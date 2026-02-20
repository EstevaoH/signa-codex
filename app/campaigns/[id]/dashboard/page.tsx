"use client"

import { useEffect, useState } from "react"

import React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
    Skull,
    ShieldAlert,
    MapPin,
    Users,
    Trophy,
    Plus,
    Search,
    ScrollText,
    ArrowLeft,
    ArrowRight,
    Swords,
    Eye,
    EyeOff,
    Mail,
    X,
    LogOut,
    User,
    Shield,
    CheckCircle2,
    Dice5,
    Pencil,
    Trash2,
    Sword
} from "lucide-react"

import { UserMenu } from "@/components/user-menu"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LocationFormDialog } from "@/components/location-form-dialog"
import { MonsterFormDialog } from "@/components/monster-form-dialog"
import { ItemFormDialog } from "@/components/item-form-dialog"
import { NpcFormDialog } from "@/components/npc-form-dialog"
import { MasterActionsTab } from "@/components/master-actions-tab"
import { EntityDetailsDialog } from "@/components/entity-details-dialog"
import { CampaignInviteDialog } from "@/components/campaign-invite-dialog"

import { supabase } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"
// import { Item } from "@/shared/types/item"

// Type definitions could be moved to shared/types but kept here for now or inferred


export default function CampaignDashboard() {
    const params = useParams()
    const router = useRouter()
    // ID comes from URL, so it's a string (UUID)
    const campaignId = params.id as string

    const [loading, setLoading] = useState(true)
    const [campaign, setCampaign] = useState<any>(null)
    const [isMaster, setIsMaster] = useState(false)
    const [userParticipant, setUserParticipant] = useState<any>(null)
    const [myCharacters, setMyCharacters] = useState<any[]>([])
    const [selectingCharacter, setSelectingCharacter] = useState(false)
    const [data, setData] = useState<{
        monstros: any[],
        itens: any[],
        localidades: any[],
        jogadores: any[],
        npcs: any[]
    }>({
        monstros: [],
        itens: [],
        localidades: [],
        jogadores: [],
        npcs: []
    })
    const [pendingInvites, setPendingInvites] = useState<any[]>([])

    const [deadMonsters, setDeadMonsters] = useState<Set<string>>(new Set()) // Changed to string UUIDs

    // ... (keep visibility toggles, update IDs to string if needed)
    const toggleEntityVisibility = async (type: string, id: string) => {
        const isCurrentlyVisible = !isEntityHidden(type, id)
        const newVisibility = !isCurrentlyVisible

        try {
            let table = ''
            let query: any

            if (type === 'monstro') {
                table = 'campaign_monsters'
                query = supabase.from(table).update({ is_visible: newVisibility }).eq('campaign_id', campaignId).eq('monster_id', id)
            } else if (type === 'item') {
                table = 'items'
                query = supabase.from(table).update({ is_visible: newVisibility }).eq('id', id)
            } else if (type === 'local') {
                table = 'locations'
                query = supabase.from(table).update({ is_visible: newVisibility }).eq('id', id)
            } else if (type === 'npc') {
                table = 'npcs'
                query = supabase.from(table).update({ is_visible: newVisibility }).eq('id', id)
            }

            const { error } = await query
            if (error) throw error

            // Update local state
            setData(prev => ({
                ...prev,
                monstros: type === 'monstro' ? prev.monstros.map(m => m.id === id ? { ...m, is_revealed: newVisibility } : m) : prev.monstros,
                itens: type === 'item' ? prev.itens.map(i => i.id === id ? { ...i, is_visible: newVisibility } : i) : prev.itens,
                localidades: type === 'local' ? prev.localidades.map(l => l.id === id ? { ...l, is_visible: newVisibility } : l) : prev.localidades,
                npcs: type === 'npc' ? prev.npcs.map(n => n.id === id ? { ...n, is_visible: newVisibility } : n) : prev.npcs,
            }))

            toast({
                title: newVisibility ? "Conteúdo Revelado" : "Conteúdo Ocultado",
                description: `O item agora está ${newVisibility ? 'visível' : 'oculto'} para os jogadores.`,
            })
        } catch (error) {
            console.error("Erro ao alterar visibilidade:", error)
            toast({
                title: "Erro ao alterar visibilidade",
                description: "Não foi possível salvar a alteração no banco de dados.",
                variant: "destructive"
            })
        }
    }

    const isEntityHidden = (type: string, id: string) => {
        if (type === 'monstro') return !data.monstros.find(m => m.id === id)?.is_revealed
        if (type === 'item') return !data.itens.find(i => i.id === id)?.is_visible
        if (type === 'local') return !data.localidades.find(l => l.id === id)?.is_visible
        if (type === 'npc') return !data.npcs.find(n => n.id === id)?.is_visible
        return false
    }

    const toggleMonsterDeath = (id: string) => {
        setDeadMonsters(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) newSet.delete(id)
            else newSet.add(id)
            return newSet
        })
        // TODO: Persist status change to DB
    }

    const isMonsterDead = (id: string) => deadMonsters.has(id)

    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedEntity, setSelectedEntity] = useState<any>(null)
    const [selectedEntityType, setSelectedEntityType] = useState<'monstro' | 'item' | 'local' | 'npc' | 'jogador'>('monstro')

    const openDetails = (type: 'monstro' | 'item' | 'local' | 'npc' | 'jogador', entity: any) => {
        setSelectedEntityType(type)
        setSelectedEntity(entity)
        setDetailsOpen(true)
    }

    const fetchInvites = async () => {
        if (!campaignId) return
        const { data: invites } = await supabase
            .from('campaign_invites')
            .select('*')
            .eq('campaign_id', campaignId)
            .eq('status', 'pending')

        setPendingInvites(invites || [])
    }

    const selectCharacter = async (characterId: string) => {
        try {
            const { error } = await supabase
                .from('campaign_participants')
                .update({ character_id: characterId })
                .eq('campaign_id', campaignId)
                .eq('user_id', userParticipant.user_id)

            if (error) throw error

            const { data: updatedParticipant } = await supabase
                .from('campaign_participants')
                .select('*, profile:profiles(*), character:characters(*)')
                .eq('campaign_id', campaignId)
                .eq('user_id', userParticipant.user_id)
                .single()

            setUserParticipant(updatedParticipant)
            setSelectingCharacter(false)
        } catch (error) {
            console.error("Erro ao selecionar personagem:", error)
        }
    }

    const handleCancelInvite = async (inviteId: string) => {
        try {
            const { error } = await supabase
                .from('campaign_invites')
                .delete()
                .eq('id', inviteId)

            if (error) throw error

            fetchInvites()
        } catch (error) {
            console.error("Erro ao cancelar convite:", error)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            if (!campaignId) return

            setLoading(true)
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push("/login")
                    return
                }

                // 2. Fetch Campaign Details
                const { data: campaignData, error: campaignError } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('id', campaignId)
                    .single()

                if (campaignError) throw campaignError
                setCampaign(campaignData)
                const masterCheck = campaignData.master_id === user.id
                console.log("🛠️ Role Check:", { master_id: campaignData.master_id, user_id: user.id, isMaster: masterCheck })
                setIsMaster(masterCheck)

                // 3. Fetch Helper Data (Parallel)
                const [
                    { data: monstersData },
                    { data: items },
                    { data: locations },
                    { data: npcs },
                    { data: participants }
                ] = await Promise.all([
                    // Updated to fetch via join table
                    supabase
                        .from('campaign_monsters')
                        .select('is_visible, monsters(*)')
                        .eq('campaign_id', campaignId),
                    supabase.from('items').select('*').eq('campaign_id', campaignId),
                    supabase.from('locations').select('*').eq('campaign_id', campaignId),
                    supabase.from('npcs').select('*').eq('campaign_id', campaignId),
                    supabase.from('campaign_participants')
                        .select('*, profile:profiles(*), character:characters(*)')
                        .eq('campaign_id', campaignId),
                    supabase.from('characters').select('*').eq('user_id', user.id)
                ])

                const participant = (participants || [])?.find((p: any) => p.user_id === user.id)
                setUserParticipant(participant)

                const { data: userCharacters } = await supabase.from('characters').select('*').eq('user_id', user.id)
                setMyCharacters(userCharacters || [])

                // Map monsters to flatten stats structure for UI
                const mappedMonsters = (monstersData || []).map((entry: any) => {
                    const m = entry.monsters
                    if (!m) return null
                    return {
                        ...m,
                        hp: m.stats?.hp || "??",
                        cr: m.challenge_rating || "??",
                        ac: m.stats?.ac || "??",
                        tipo: m.type || '??',
                        nome: m.name,
                        is_revealed: entry.is_visible
                    }
                }).filter(Boolean)

                // Transform participants to 'jogadores' shape
                const mappedPlayers = (participants || []).map((p: any) => ({
                    id: p.user_id,
                    nome: p.profile.full_name || p.profile.username,
                    classe: p.character?.data?.class || "Aventureiro",
                    nivel: p.character?.data?.level || 1,
                    raca: p.character?.data?.race || "Humano",
                    descricao: "Jogador da campanha"
                }))

                setData({
                    monstros: mappedMonsters,
                    itens: items || [],
                    localidades: locations || [],
                    npcs: (npcs || []).map((n: any) => ({
                        ...n,
                        nome: n.name,
                        raca: n.race,
                        classe: n.occupation,
                        alinhamento: n.alignment,
                        descricao: n.description
                    })),
                    jogadores: mappedPlayers
                })

                // 3. Fetch Invites
                await fetchInvites()

            } catch (error) {
                console.error("Erro ao carregar dashboard:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [campaignId])


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    {/* Assume Loader2 was imported or use a simple text */}
                    <p className="text-slate-400 animate-pulse">Carregando grimório...</p>
                </div>
            </div>
        )
    }

    if (!isMaster && !userParticipant?.character_id) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex items-center justify-center">
                <Card className="bg-slate-900 border-slate-800 w-full max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-serif text-amber-500 flex items-center gap-2">
                            <Users className="h-6 w-6" /> Selecione seu Herói
                        </CardTitle>
                        <CardDescription>
                            Para entrar em <strong>{campaign.name}</strong>, você precisa escolher qual dos seus personagens irá participar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {myCharacters.map((char) => (
                            <Card
                                key={char.id}
                                className="bg-slate-950 border-slate-800 hover:border-amber-500 cursor-pointer transition-all group"
                                onClick={() => selectCharacter(char.id)}
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg group-hover:text-amber-500">{char.name}</CardTitle>
                                    <CardDescription>{char.data?.race} • {char.data?.class}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                        {myCharacters.length === 0 && (
                            <div className="col-span-full py-8 text-center bg-slate-950 rounded-lg border border-dashed border-slate-800">
                                <p className="text-slate-500 mb-4">Você ainda não criou nenhum personagem.</p>
                                <Button asChild variant="outline" className="border-slate-700">
                                    <Link href="/characters/new">Criar Novo Personagem</Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
                        <Button asChild variant="ghost" className="text-slate-400">
                            <Link href="/campaigns">Voltar</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            {/* Header do Painel */}
            <header className="container mx-auto max-w-7xl mb-8">
                <Link href="/campaigns" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar às Campanhas</span>
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-serif italic text-amber-500 flex items-center gap-2">
                            <ScrollText className="h-8 w-8" /> {isMaster ? "Grimório do Mestre" : "Painel do Herói"}
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Campanha: {campaign.name}</p>
                        <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">{campaign.system}</Badge>
                            <Badge variant="outline" className="text-xs border-slate-700">{campaign.genre}</Badge>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 text-amber-500 hidden md:flex">
                            <Search className="mr-2 h-4 w-4" /> Buscar no Cânone
                        </Button>
                        {isMaster && (
                            <Button className="bg-amber-600 hover:bg-amber-700">
                                <Plus className="mr-2 h-4 w-4" /> Novo Conteúdo
                            </Button>
                        )}
                        <div className="h-8 w-px bg-slate-800 mx-2 hidden md:block" />
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Seção de Jogadores */}
            <div className="container mx-auto max-w-7xl mb-8">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-amber-500" />
                        <h2 className="text-xl font-serif text-amber-500">Jogadores da Campanha</h2>
                        <Badge variant="secondary" className="ml-2">{data.jogadores.length}</Badge>
                        {isMaster && (
                            <div className="ml-auto">
                                <CampaignInviteDialog campaignId={campaignId} onInviteSent={fetchInvites} />
                            </div>
                        )}
                    </div>

                    {/* Convites Pendentes */}
                    {pendingInvites.length > 0 && (
                        <div className="mb-6 flex flex-wrap gap-2">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest w-full mb-1">Convites Pendentes:</span>
                            {pendingInvites.map(invite => (
                                <Badge key={invite.id} variant="outline" className="bg-slate-900 border-slate-800 text-slate-400 py-1 px-3 flex items-center gap-2 group">
                                    <Mail className="w-3 h-3" />
                                    {invite.email}
                                    <button
                                        onClick={() => handleCancelInvite(invite.id)}
                                        className="text-slate-600 hover:text-red-500 transition-colors cursor-pointer"
                                        title="Cancelar convite"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {data.jogadores.map((jogador) => (
                            <Card
                                key={jogador.id}
                                className="bg-slate-950/50 border-slate-800 cursor-pointer hover:border-amber-900/50 transition-colors"
                                onClick={() => openDetails('jogador', jogador)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg text-slate-100 mb-1">{jogador.nome}</CardTitle>
                                            <CardDescription className="text-xs text-slate-400">
                                                {jogador.raca} • Nível {jogador.nivel}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <Badge className="bg-amber-900/30 text-amber-400 border-amber-700 text-xs">
                                            {jogador.classe}
                                        </Badge>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto max-w-7xl">
                <Tabs defaultValue="monstros" className="space-y-6">
                    <TabsList className="bg-slate-900 border border-slate-800 p-1 grid grid-cols-2 md:grid-cols-6 gap-1">
                        <TabsTrigger value="monstros" className="data-[state=active]:bg-amber-600 text-slate-400 cursor-pointer hover:text-slate-400">
                            <Skull className="w-4 h-4 mr-2" /> Monstros
                        </TabsTrigger>
                        <TabsTrigger value="itens" className="data-[state=active]:bg-amber-600 text-slate-300 cursor-pointer hover:text-slate-300">
                            <ShieldAlert className="w-4 h-4 mr-2" /> Itens
                        </TabsTrigger>
                        <TabsTrigger value="locais" className="data-[state=active]:bg-amber-600 text-slate-300 cursor-pointer hover:text-slate-300">
                            <MapPin className="w-4 h-4 mr-2" /> Localidades
                        </TabsTrigger>
                        <TabsTrigger value="npcs" className="data-[state=active]:bg-amber-600 text-slate-300 cursor-pointer hover:text-slate-300">
                            <Users className="w-4 h-4 mr-2" /> NPCs
                        </TabsTrigger>
                        {isMaster && (
                            <>
                                <TabsTrigger value="acoes" className="data-[state=active]:bg-amber-600 text-slate-300 cursor-pointer hover:text-slate-300">
                                    <Swords className="w-4 h-4 mr-2" /> Ações do Mestre
                                </TabsTrigger>
                                <TabsTrigger value="conquistas" className="data-[state=active]:bg-amber-600 text-slate-300 cursor-pointer hover:text-slate-300">
                                    <Trophy className="w-4 h-4 mr-2" /> Conquistas
                                </TabsTrigger>
                            </>
                        )}
                    </TabsList>

                    {/* CONTEÚDO DE MONSTROS */}
                    <TabsContent value="monstros" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isMaster && <MonsterFormDialog campaignId={campaignId} />}
                        {data.monstros.filter(m => isMaster || m.is_revealed).map((monstro) => (
                            <Card
                                key={monstro.id}
                                className={`bg-slate-900 border-slate-800 hover:border-amber-900/50 transition-all group cursor-pointer ${isMonsterDead(monstro.id) ? 'grayscale opacity-60' : ''}`}
                                onClick={() => openDetails('monstro', monstro)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="text-amber-500 border-amber-900 bg-amber-950/20">CR {monstro.cr}</Badge>
                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            {isMaster && (
                                                <>
                                                    <button
                                                        onClick={() => toggleEntityVisibility('monstro', monstro.id)}
                                                        className="text-slate-500 hover:text-amber-500 transition-colors"
                                                        title={isEntityHidden('monstro', monstro.id) ? "Mostrar" : "Ocultar"}
                                                    >
                                                        {isEntityHidden('monstro', monstro.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => toggleMonsterDeath(monstro.id)}
                                                        className={`transition-colors ${isMonsterDead(monstro.id) ? 'text-red-600' : 'text-slate-700 hover:text-red-500'}`}
                                                        title={isMonsterDead(monstro.id) ? "Reviver" : "Marcar como Morto"}
                                                    >
                                                        <Skull className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl text-slate-100 uppercase tracking-wide">{monstro.nome}</CardTitle>
                                    <CardDescription className="text-slate-500">{monstro.tipo}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-slate-400 flex items-center gap-2">
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${100 <= 30 ? 'bg-red-600' :
                                                    100 <= 79 ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                    }`}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        <span className="font-mono">{monstro.hp} HP</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                    </TabsContent>

                    <TabsContent value="itens" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isMaster && <ItemFormDialog campaignId={campaignId} />}

                        {data.itens.filter(item => isMaster || item.is_visible).map((item: any) => (
                            <Card
                                key={item.id}
                                className="bg-slate-900 border-slate-800 cursor-pointer hover:border-amber-900/50 transition-colors"
                                onClick={() => openDetails('item', item)}
                            >
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                        <Sword className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <CardTitle className="text-md text-slate-100">{item.name}</CardTitle>
                                            {isMaster && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleEntityVisibility('item', item.id) }}
                                                    className="text-slate-500 hover:text-amber-500 transition-colors"
                                                    title={isEntityHidden('item', item.id) ? "Mostrar" : "Ocultar"}
                                                >
                                                    {isEntityHidden('item', item.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            )}
                                        </div>
                                        <CardDescription className="flex flex-col gap-1">
                                            <Badge className="w-fit bg-purple-900 text-purple-100 hover:bg-purple-800">
                                                {item.rarity === 'common' ? 'Comum' :
                                                    item.rarity === 'uncommon' ? 'Incomum' :
                                                        item.rarity === 'rare' ? 'Raro' :
                                                            item.rarity === 'very_rare' ? 'Muito Raro' :
                                                                item.rarity === 'legendary' ? 'Lendário' :
                                                                    item.rarity === 'artifact' ? 'Artefato' : item.rarity}
                                            </Badge>
                                            <div className="flex gap-2 text-[10px] text-slate-500 font-mono uppercase">
                                                <span>{item.properties?.weight || item.weight || 0}kg</span>
                                                <span>•</span>
                                                <span>{item.properties?.value || item.value || 0} PO</span>
                                            </div>
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* CONTEÚDO DE LOCALIDADES */}
                    <TabsContent value="locais" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isMaster && <LocationFormDialog campaignId={campaignId} />}

                        {data.localidades.filter(local => isMaster || local.is_visible).map((local: any) => (
                            <Card
                                key={local.id}
                                className="bg-slate-900 border-slate-800 overflow-hidden group cursor-pointer hover:border-amber-900/50 transition-colors"
                                onClick={() => openDetails('local', local)}
                            >
                                <div className="h-24 bg-[url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop')] bg-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                <CardHeader className="-mt-12 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-amber-500">{local.name}</CardTitle>
                                        {isMaster && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleEntityVisibility('local', local.id) }}
                                                className="text-slate-300 hover:text-amber-500 transition-colors z-10"
                                                title={isEntityHidden('local', local.id) ? "Mostrar" : "Ocultar"}
                                            >
                                                {isEntityHidden('local', local.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        )}
                                    </div>
                                    <CardDescription className="flex gap-2">
                                        <Badge variant="secondary">{local.stats?.climate}</Badge>
                                        <Badge variant="destructive">{local.stats?.danger_level}</Badge>
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* NPCs Tab */}
                    <TabsContent value="npcs" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {isMaster && <NpcFormDialog campaignId={campaignId} />}

                        {data.npcs.filter(npc => isMaster || npc.is_visible).map((npc) => (
                            <Card
                                key={npc.id}
                                className="bg-slate-900 border-slate-800 overflow-hidden group cursor-pointer hover:border-green-900/50 transition-colors"
                                onClick={() => openDetails('npc', npc)}
                            >
                                <div className="h-24 bg-[url('https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=400&auto=format&fit=crop')] bg-cover opacity-30 group-hover:opacity-60 transition-opacity" />
                                <CardHeader className="-mt-12 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                                                <Users className="h-5 w-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg text-slate-100">{npc.nome}</CardTitle>
                                                <CardDescription className="text-slate-400 capitalize">{npc.raca} • {npc.classe}</CardDescription>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleEntityVisibility('npc', npc.id) }}
                                            className="text-slate-500 hover:text-amber-500 transition-colors z-10"
                                            title={isEntityHidden('npc', npc.id) ? "Mostrar" : "Ocultar"}
                                        >
                                            {(isMaster && isEntityHidden('npc', npc.id)) ? <EyeOff className="h-4 w-4" /> : isMaster ? <Eye className="h-4 w-4" /> : null}
                                        </button>
                                    </div>
                                    <div className="mt-2">
                                        <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500 uppercase">
                                            {npc.alinhamento}
                                        </Badge>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* Ações do Mestre Tab */}
                    {isMaster && (
                        <TabsContent value="acoes">
                            <MasterActionsTab jogadores={data.jogadores} monstros={data.monstros} isMaster={isMaster} />
                        </TabsContent>
                    )}

                    {/* Conquistas Tab - Empty State */}
                    {isMaster && (
                        <TabsContent value="conquistas" className="flex flex-col items-center justify-center py-16">
                            <Trophy className="h-16 w-16 text-slate-700 mb-4" />
                            <h3 className="text-xl font-serif text-slate-400 mb-2">Nenhuma conquista registrada</h3>
                            <p className="text-slate-500 mb-6">Registre marcos importantes da jornada dos heróis.</p>
                            <Button className="bg-amber-600 hover:bg-amber-700">
                                <Plus className="mr-2 h-4 w-4" /> Adicionar Conquista
                            </Button>
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <EntityDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                type={selectedEntityType}
                data={selectedEntity}
            />
        </div>
    )
}
