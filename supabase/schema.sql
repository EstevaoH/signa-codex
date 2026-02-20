-- ==========================================
-- 1. INFRAESTRUTURA E PERFIS
-- ==========================================

-- Habilita a geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis (Lincada ao Auth.Users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamptz DEFAULT now(),
  username text UNIQUE,
  full_name text,
  avatar_url text,
  constraint username_length check (char_length(username) >= 3)
);

-- Função para criar perfil automaticamente no Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que dispara a função acima
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 2. ENTIDADES PRINCIPAIS
-- ==========================================

-- Tabela de Campanhas (Estrutura Completa)
CREATE TABLE campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  master_id uuid REFERENCES profiles(id) NOT NULL,
  
  -- Dados da Campanha
  name text NOT NULL,
  description text,
  genre text,
  system text,
  setting text,
  lore text,
  max_players integer DEFAULT 1,
  
  -- Estado
  status text CHECK (status IN ('playing', 'completed', 'upcoming')) DEFAULT 'upcoming',
  image_url text,
  is_active boolean DEFAULT true
);

-- Tabela de Personagens (Fichas Criadas)
CREATE TABLE characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb, -- Stats, Raça, Classe, etc.
  system text,
  image_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- 3. RELACIONAMENTOS E LISTAS (JOIN TABLES)
-- ==========================================

-- Tabela de Participantes (A "Lista de Jogadores" de cada campanha)
CREATE TABLE campaign_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters(id) ON DELETE SET NULL,
  joined_at timestamptz DEFAULT now() NOT NULL,
  status text CHECK (status IN ('invited', 'active', 'banned', 'left')) DEFAULT 'active',
  
  -- Regra de Negócio: 1 usuário por campanha
  UNIQUE(campaign_id, user_id)
);

-- Tabela de Convites por E-mail
CREATE TABLE campaign_invites (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  token text UNIQUE NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ==========================================
-- 4. SEGURANÇA (RLS)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas
CREATE POLICY "Perfis visíveis para todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Dono edita próprio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Campanhas visíveis para todos" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Mestres criam/editam suas campanhas" ON campaigns FOR ALL USING (auth.uid() = master_id);

CREATE POLICY "Usuários veem/editam seus próprios personagens" ON characters FOR ALL USING (auth.uid() = user_id);

-- Mestre pode ver fichas dos personagens na sua campanha
CREATE POLICY "Mestre vê personagens da mesa" ON characters FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM campaign_participants cp
    JOIN campaigns c ON cp.campaign_id = c.id
    WHERE cp.character_id = characters.id AND c.master_id = auth.uid()
  )
);

-- ==========================================
-- 5. ENTIDADES DE MUNDO (BIBLIOTECA)
-- ==========================================

-- 5.1. Locais (Cidades, Masmorras, Planos)
CREATE TABLE locations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  image_url text,
  map_url text,
  is_public boolean DEFAULT false,
  is_visible boolean DEFAULT false, -- Controle de Visibilidade
  stats jsonb DEFAULT '{}'::jsonb
);

-- 5.2. NPCs (Personagens do Mestre)
CREATE TABLE npcs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  name text NOT NULL,
  race text,
  occupation text,
  alignment text,
  description text,
  stats jsonb DEFAULT '{}'::jsonb,
  image_url text,
  is_visible boolean DEFAULT false -- Controle de Visibilidade
);

-- 5.3. Monstros (Bestiário)
CREATE TABLE monsters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text,
  challenge_rating text,
  stats jsonb DEFAULT '{}'::jsonb,
  actions jsonb DEFAULT '[]'::jsonb,
  image_url text,
  notes text
);

-- 5.4. Itens (Equipamentos e Artefatos)
CREATE TABLE items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  name text NOT NULL,
  rarity text,
  type text,
  description text,
  properties jsonb DEFAULT '{}'::jsonb,
  image_url text,
  is_visible boolean DEFAULT true -- Itens geralmente são visíveis ao serem criados
);

-- ==========================================
-- 6. TABELAS DE RELAÇÃO (INVENTÁRIO E ENCONTROS)
-- ==========================================

-- Inventário de Personagem
CREATE TABLE character_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  item_id uuid REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  quantity integer DEFAULT 1,
  is_equipped boolean DEFAULT false,
  UNIQUE(character_id, item_id)
);

-- Bestiário da Campanha (Monstros que o Mestre separou para usar)
CREATE TABLE campaign_monsters (
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  monster_id uuid REFERENCES monsters(id) ON DELETE CASCADE NOT NULL,
  is_visible boolean DEFAULT false, -- Só aparece para o jogador se o Mestre revelar
  PRIMARY KEY (campaign_id, monster_id)
);

-- ==========================================
-- 7. SEGURANÇA AVANÇADA (RLS COM FOG OF WAR)
-- ==========================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_monsters ENABLE ROW LEVEL SECURITY;

-- POLÍTICA PARA LOCAIS
CREATE POLICY "Mestre gerencia seus locais" ON locations
FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Participantes vêem locais da campanha" ON locations
FOR SELECT USING (
  is_visible = true AND EXISTS (
    SELECT 1 FROM campaign_participants 
    WHERE campaign_id = locations.campaign_id AND user_id = auth.uid()
  )
);

-- POLÍTICA PARA NPCs
CREATE POLICY "Mestre gerencia seus NPCs" ON npcs
FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Participantes vêem NPCs da campanha" ON npcs
FOR SELECT USING (
  is_visible = true AND EXISTS (
    SELECT 1 FROM campaign_participants 
    WHERE campaign_id = npcs.campaign_id AND user_id = auth.uid()
  )
);

-- POLÍTICA PARA MONSTROS DA CAMPANHA
CREATE POLICY "Jogadores vêem monstros revelados" ON campaign_monsters
FOR SELECT USING (
  is_visible = true AND EXISTS (
    SELECT 1 FROM campaign_participants 
    WHERE campaign_id = campaign_monsters.campaign_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Mestre gerencia monstros da campanha" ON campaign_monsters
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE id = campaign_monsters.campaign_id AND master_id = auth.uid()
  )
);

-- O Mestre sempre pode ver tudo o que criou
CREATE POLICY "Mestre vê todos os seus monstros" ON monsters 
FOR ALL USING (auth.uid() = owner_id);

-- POLÍTICA PARA ITENS
-- O criador pode gerenciar (CRUD total)
CREATE POLICY "Mestre gerencia seus itens" ON items
FOR ALL 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Participantes da campanha podem ver os itens nela
CREATE POLICY "Participantes vêem itens da campanha" ON items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaign_participants 
    WHERE campaign_id = items.campaign_id AND user_id = auth.uid()
  )
);

-- ==========================================
-- 8. POLÍTICAS DE PARTICIPAÇÃO E CONVITES
-- ==========================================

-- Participantes
ALTER TABLE campaign_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários vêem sua própria participação" ON campaign_participants
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Mestres vêem todos os participantes da mesa" ON campaign_participants
FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_participants.campaign_id AND master_id = auth.uid())
);

CREATE POLICY "Usuários podem se juntar a campanhas" ON campaign_participants
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam seus dados de participação" ON campaign_participants
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Mestres removem jogadores" ON campaign_participants
FOR DELETE USING (
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_participants.campaign_id AND master_id = auth.uid())
);

-- Convites
ALTER TABLE campaign_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mestres gerenciam convites de sua campanha" ON campaign_invites
FOR ALL USING (
  EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_invites.campaign_id AND master_id = auth.uid())
);

CREATE POLICY "Usuários vêem convites para seu e-mail" ON campaign_invites
FOR SELECT USING (
  email = auth.jwt() ->> 'email'
);

CREATE POLICY "Usuários atualizam status do convite" ON campaign_invites
FOR UPDATE USING (
  email = auth.jwt() ->> 'email'
) WITH CHECK (
  status IN ('accepted', 'declined')
);
