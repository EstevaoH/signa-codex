"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
    Plus,
    Search,
    ScrollText,
    Dice5,
    Calendar,
    Users,
    Swords,
    CheckCircle2,
    Loader2,
    Shield,
    Mail,
    ArrowRight,
    User,
    LogOut
} from "lucide-react"

import { CharacterFormDialog } from "@/components/character-form-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { UserMenu } from "@/components/user-menu"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { EntityDetailsDialog } from "@/components/entity-details-dialog"
import { Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Campaign = {
    id: string
    name: string
    description: string
    status: 'playing' | 'completed' | 'upcoming'
    created_at: string
    image_url?: string
}

import { Character } from "@/shared/types/character"

export default function Dashboard() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [characters, setCharacters] = useState<Character[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedEntity, setSelectedEntity] = useState<any>(null)
    const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [invites, setInvites] = useState<any[]>([])
    const [isAccepting, setIsAccepting] = useState<string | null>(null)
    const router = useRouter()
    const { toast } = useToast()

    const fetchCharacters = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (data) {
            setCharacters(data as Character[])
        }
    }

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
            router.push("/login")
        } catch (error: any) {
            console.error("Erro ao fazer logout:", error.message)
        }
    }

    const fetchInvites = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !user.email) return

        const { data, error } = await supabase
            .from('campaign_invites')
            .select('*, campaigns(name)')
            .eq('email', user.email.toLowerCase())
            .eq('status', 'pending')

        setInvites(data || [])
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push("/login")
                return
            }

            // 1. Buscando campanhas (onde sou o mestre ou o jogador)
            const { data: mastered } = await supabase
                .from('campaigns')
                .select('*')
                .eq('master_id', user.id)

            const { data: participating } = await supabase
                .from('campaign_participants')
                .select('campaigns(*)')
                .eq('user_id', user.id)
                .eq('status', 'active')

            const allCampaigns = [
                ...(mastered || []),
                ...(participating?.map(p => p.campaigns) || [])
            ].filter((c): c is any => !!c)

            // Remove duplicatas por precaução
            const uniqueCampaigns = Array.from(new Map(allCampaigns.map(c => [c.id, c])).values())

            setCampaigns(uniqueCampaigns.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ))

            // 2. Buscando personagens
            await fetchCharacters()

            // 3. Buscando convites
            await fetchInvites()

            setIsLoading(false)
        }

        fetchDashboardData()
    }, [router])

    const filteredCampaigns = (status: string) =>
        campaigns.filter(c => c.status === status)

    async function handleDeleteCharacter(character: Character, e: React.MouseEvent) {
        e.stopPropagation()
        setCharacterToDelete(character)
        setIsDeleteDialogOpen(true)
    }

    async function confirmDelete() {
        if (!characterToDelete) return

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('characters')
                .delete()
                .eq('id', characterToDelete.id)

            if (error) throw error

            toast({
                title: "Personagem removido",
                description: "O herói foi excluído da sua biblioteca."
            })
            fetchCharacters()
            setIsDeleteDialogOpen(false)
        } catch (error: any) {
            toast({
                title: "Erro ao excluir",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsDeleting(false)
            setCharacterToDelete(null)
        }
    }

    async function handleAcceptInvite(invite: any) {
        setIsAccepting(invite.id)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Usuário não autenticado")

            // 1. Atualizar convite
            const { error: updateError } = await supabase
                .from('campaign_invites')
                .update({ status: 'accepted' })
                .eq('id', invite.id)

            if (updateError) throw updateError

            // 2. Adicionar ao campaign_participants
            // Nota: O character_id será nulo até que o jogador escolha um na dashboard da campanha
            const { error: partError } = await supabase
                .from('campaign_participants')
                .upsert({
                    campaign_id: invite.campaign_id,
                    user_id: user.id,
                    status: 'active'
                })

            if (partError) throw partError

            toast({
                title: "Convite aceito!",
                description: `Você agora faz parte da campanha ${invite.campaigns.name}.`
            })

            fetchDashboardData() // Recarrega tudo
        } catch (error: any) {
            toast({
                title: "Erro ao aceitar convite",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsAccepting(null)
        }
    }

    async function handleDeclineInvite(inviteId: string) {
        try {
            const { error } = await supabase
                .from('campaign_invites')
                .update({ status: 'declined' })
                .eq('id', inviteId)

            if (error) throw error

            toast({
                title: "Convite recusado",
                description: "O convite foi removido."
            })

            fetchInvites()
        } catch (error: any) {
            toast({
                title: "Erro ao recusar",
                description: error.message,
                variant: "destructive"
            })
        }
    }

    const fetchDashboardData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push("/login");
            return;
        }

        // Campanhas (Mestre + Jogador)
        const { data: mastered } = await supabase
            .from('campaigns')
            .select('*')
            .eq('master_id', user.id);

        const { data: participating } = await supabase
            .from('campaign_participants')
            .select('campaigns(*)')
            .eq('user_id', user.id)
            .eq('status', 'active');

        const allCampaigns = [
            ...(mastered || []),
            ...(participating?.map(p => p.campaigns) || [])
        ].filter((c): c is any => !!c);

        const uniqueCampaigns = Array.from(new Map(allCampaigns.map(c => [c.id, c])).values());

        setCampaigns(uniqueCampaigns.sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));

        // Personagens
        await fetchCharacters();

        // Convites
        await fetchInvites();

        setIsLoading(false);
    }

    const CampaignCard = ({ campaign }: { campaign: Campaign }) => (
        <Link href={`/campaigns/${campaign.id}/dashboard`}>
            <Card className="bg-slate-900 border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group h-full flex flex-col">
                <div className="h-32 bg-slate-950 relative overflow-hidden rounded-t-lg">
                    {campaign.image_url ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity transform group-hover:scale-105 duration-500"
                            style={{ backgroundImage: `url(${campaign.image_url})` }}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    <Badge className={`absolute top-2 cursor-pointer right-2 ${campaign.status === 'playing' ? 'bg-green-600' :
                        campaign.status === 'upcoming' ? 'bg-amber-600' : 'bg-slate-600'
                        }`}>
                        {campaign.status === 'playing' && 'Em Andamento'}
                        {campaign.status === 'upcoming' && 'Vai Iniciar'}
                        {campaign.status === 'completed' && 'Concluída'}
                    </Badge>
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-amber-500 group-hover:text-amber-400 font-serif">
                        {campaign.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-slate-400">
                        {campaign.description || "Uma aventura épica aguarda..."}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="mt-auto pt-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(campaign.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Grupo
                    </span>
                </CardFooter>
            </Card>
        </Link>
    )

    const CharacterCard = ({ character }: { character: Character }) => (
        <Card
            className="bg-slate-900 border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group overflow-hidden relative"
            onClick={() => {
                setSelectedEntity(character)
                setDetailsOpen(true)
            }}
        >
            <div className="h-24 bg-slate-950 relative overflow-hidden">
                {character.image_url ? (
                    <img
                        src={character.image_url}
                        alt={character.name}
                        className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                        <Shield className="h-12 w-12 text-slate-500" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <Badge className="absolute bottom-2 right-2 bg-slate-800/80 border-slate-700">
                    Nível {character.data?.level || 1}
                </Badge>
            </div>
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <CharacterFormDialog
                    characterToEdit={character}
                    onCharacterCreated={fetchCharacters}
                    trigger={
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 cursor-pointer bg-slate-900/80 border border-slate-700 hover:bg-slate-800 hover:text-amber-500"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Pencil className="h-4 w-4 text-amber-500" />
                        </Button>
                    }
                />
                <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 cursor-pointer bg-red-950/80 border border-red-900/50 hover:bg-red-900"
                    onClick={(e) => handleDeleteCharacter(character, e)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <CardHeader className="py-3 px-4 relative">
                <CardTitle className="text-lg text-slate-100 group-hover:text-amber-500 transition-colors font-serif">
                    {character.name}
                </CardTitle>
                <div className="flex items-center justify-between mt-1">
                    <CardDescription className="text-xs text-slate-400 capitalize">
                        {character.data?.race || "Raça"} • {character.data?.class || "Classe"}
                    </CardDescription>
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">{character.system}</span>
                </div>
            </CardHeader>
        </Card >
    )

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-4xl font-serif italic text-amber-500 flex items-center gap-3">
                        <ScrollText className="h-10 w-10" /> Meus RPGs
                    </h1>
                    <p className="text-slate-400 mt-2">Gerencie suas mesas e aventuras.</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/codex">
                        <Button variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 hover:text-amber-500 cursor-pointer font-bold hidden md:flex">
                            <ScrollText className="mr-2 h-4 w-4" /> Cânone
                        </Button>
                    </Link>
                    <Button variant="outline" className="border-slate-700 bg-slate-900 hover:bg-slate-800 hover:text-amber-500 cursor-pointer font-bold hidden lg:flex">
                        <Search className="mr-2 h-4 w-4" /> Buscar Mesa
                    </Button>
                    <Link href="/campaigns/new">
                        <Button className="bg-amber-600 hover:bg-amber-700 cursor-pointer font-bold">
                            <Plus className="mr-2 h-4 w-4" /> Nova Campanha
                        </Button>
                    </Link>

                    <div className="h-8 w-px bg-slate-800 mx-2 hidden md:block" />

                    <UserMenu />
                </div>
            </header>

            {/* Convites de Campanha */}
            {invites.length > 0 && (
                <section className="container mx-auto max-w-7xl mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-amber-500/10 p-2 rounded-lg">
                            <Mail className="h-6 w-6 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-serif text-slate-100 italic">Chamados para Aventura</h2>
                        <Badge className="bg-amber-600 animate-pulse">{invites.length}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {invites.map((invite) => (
                            <Card key={invite.id} className="bg-slate-900 border-slate-800 border-l-4 border-l-amber-500 overflow-hidden shadow-xl shadow-amber-900/5">
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-lg text-amber-500 font-serif mb-1">
                                        Novo Convite de Mesa
                                    </CardTitle>
                                    <CardDescription className="text-slate-300 text-sm">
                                        Você foi convidado para participar da campanha:
                                        <span className="block mt-1 font-bold text-slate-100 text-base italic line-clamp-1">
                                            "{invite.campaigns.name}"
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardFooter className="bg-slate-950/50 flex gap-3 pt-4">
                                    <Button
                                        onClick={() => handleAcceptInvite(invite)}
                                        disabled={isAccepting === invite.id}
                                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold h-9 cursor-pointer transition-all gap-2"
                                    >
                                        {isAccepting === invite.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <ArrowRight className="h-4 w-4" />
                                                <span>Aceitar</span>
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDeclineInvite(invite.id)}
                                        disabled={isAccepting === invite.id}
                                        className="border-slate-800 text-slate-400 hover:bg-red-950/30 hover:text-red-500 hover:border-red-900/50 cursor-pointer h-9 transition-all"
                                    >
                                        Recusar
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="playing" className="space-y-8">
                    <TabsList className="bg-slate-900 border border-slate-800 p-1 w-full md:w-auto">
                        <TabsTrigger value="playing" className="data-[state=active]:bg-amber-600 px-6 text-slate-300 hover:text-slate-300 cursor-pointer">
                            <Swords className="w-4 h-4 mr-2" /> Jogando
                        </TabsTrigger>
                        <TabsTrigger value="upcoming" className="data-[state=active]:bg-amber-600 px-6 text-slate-300 hover:text-slate-300 cursor-pointer">
                            <Dice5 className="w-4 h-4 mr-2" /> Vai Iniciar
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="data-[state=active]:bg-amber-600 px-6 text-slate-300 hover:text-slate-300 cursor-pointer">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Concluídas
                        </TabsTrigger>
                        <TabsTrigger value="characters" className="data-[state=active]:bg-amber-600 px-6 text-slate-300 hover:text-slate-300 cursor-pointer">
                            <Shield className="w-4 h-4 mr-2" /> Personagens
                        </TabsTrigger>
                        <TabsTrigger value="invites" className="data-[state=active]:bg-amber-600 px-6 text-slate-300 hover:text-slate-300 cursor-pointer relative">
                            <Mail className="w-4 h-4 mr-2" /> Convites
                            {invites.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-slate-900">
                                    {invites.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {['playing', 'upcoming', 'completed'].map((status) => (
                        <TabsContent key={status} value={status} className="mt-6">
                            {filteredCampaigns(status).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredCampaigns(status).map(campaign => (
                                        <CampaignCard key={campaign.id} campaign={campaign} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-12 text-center">
                                    <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        {status === 'playing' && <Swords className="h-8 w-8 text-slate-600" />}
                                        {status === 'upcoming' && <Dice5 className="h-8 w-8 text-slate-600" />}
                                        {status === 'completed' && <CheckCircle2 className="h-8 w-8 text-slate-600" />}
                                    </div>
                                    <h3 className="text-xl font-serif text-slate-300 mb-2">
                                        {status === 'playing' && "Nenhuma campanha em andamento"}
                                        {status === 'upcoming' && "Nenhuma campanha agendada"}
                                        {status === 'completed' && "Nenhuma campanha concluída"}
                                    </h3>
                                    <p className="text-slate-500 mb-6">Comece uma nova aventura agora mesmo.</p>
                                    <Link href="/campaigns/new">
                                        <Button variant="outline" className="border-slate-700 cursor-pointer font-bold bg-amber-600 text-slate-300 hover:border-amber-700 hover:bg-amber-700 hover:text-slate-300">
                                            Criar Nova Campanha
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </TabsContent>
                    ))}

                    <TabsContent value="characters" className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <Link href="/characters/new" className="border-2 border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500/50 hover:text-amber-500 transition-all group cursor-pointer">
                                <Plus className="h-10 w-10 mb-2 group-hover:scale-110 transition-transform" />
                                <span className="font-bold font-serif">Criar Novo Herói</span>
                            </Link>

                            {characters.map(char => (
                                <CharacterCard key={char.id} character={char} />
                            ))}
                        </div>

                        {characters.length === 0 && !isLoading && (
                            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-12 text-center">
                                <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Shield className="h-8 w-8 text-slate-600" />
                                </div>
                                <h3 className="text-xl font-serif text-slate-300 mb-2">Você ainda não tem personagens</h3>
                                <p className="text-slate-500 mb-6">Crie seu primeiro herói para começar a jogar.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="invites" className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-5 w-5 text-amber-500" />
                            <h2 className="text-xl font-serif text-slate-100 italic">Gestão de Convites</h2>
                        </div>

                        {invites.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {invites.map((invite) => (
                                    <Card key={invite.id} className="bg-slate-900 border-slate-800 border-l-4 border-l-amber-500 overflow-hidden shadow-xl shadow-amber-900/5 transition-all hover:border-amber-500/30">
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg text-amber-500 font-serif mb-1 uppercase tracking-tight">
                                                Chamado para o Dever
                                            </CardTitle>
                                            <CardDescription className="text-slate-300 text-sm">
                                                Convocado para a aventura:
                                                <span className="block mt-2 font-bold text-slate-100 text-lg italic line-clamp-2 leading-tight">
                                                    "{invite.campaigns.name}"
                                                </span>
                                            </CardDescription>
                                        </CardHeader>
                                        <CardFooter className="bg-slate-950/30 border-t border-slate-800/50 flex gap-3 pt-4">
                                            <Button
                                                onClick={() => handleAcceptInvite(invite)}
                                                disabled={isAccepting === invite.id}
                                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 cursor-pointer transition-all gap-2 group"
                                            >
                                                {isAccepting === invite.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                        <span>Aceitar</span>
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDeclineInvite(invite.id)}
                                                disabled={isAccepting === invite.id}
                                                className="border-slate-800 text-slate-400 hover:bg-red-950/30 hover:text-red-500 hover:border-red-900/50 cursor-pointer h-10 transition-all"
                                            >
                                                Recusar
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-16 text-center">
                                <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                                    <Mail className="h-8 w-8 text-slate-500" />
                                </div>
                                <h3 className="text-xl font-serif text-slate-400 mb-2 italic">Silêncio nos Salões</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Você não possui convites pendentes no momento. Aguarde por novos chamados ou crie sua própria campanha.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            <EntityDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                type="jogador"
                data={selectedEntity}
            />

            <DeleteConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={confirmDelete}
                itemName={characterToDelete?.name}
                isLoading={isDeleting}
            />
        </div>
    )
}