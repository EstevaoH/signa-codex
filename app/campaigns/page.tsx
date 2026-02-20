"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
    Scroll,
    Plus,
    Users,
    Calendar,
    Swords,
    CheckCircle2,
    Clock,
    Play,
    BookOpen,
    Loader2,
    Trash2,
    AlertTriangle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"



type CampaignStatus = "upcoming" | "playing" | "completed"

const STATUS_CONFIG = {
    "upcoming": {
        label: "Vai Iniciar",
        icon: Clock,
        badgeVariant: "secondary" as const,
        color: "text-blue-400",
    },
    "playing": {
        label: "Em Andamento",
        icon: Play,
        badgeVariant: "default" as const,
        color: "text-amber-500",
    },
    "completed": {
        label: "Concluídas",
        icon: CheckCircle2,
        badgeVariant: "outline" as const,
        color: "text-green-500",
    },
}

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [campaignToDelete, setCampaignToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const { toast } = useToast()

    const getCampaignsByStatus = (status: CampaignStatus) => {
        return campaigns.filter(campaign => campaign.status === status)
    }

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) return
                setUserId(user.id)

                // 1. Buscando campanhas onde sou Mestre
                const { data: gmCampaigns, error: gmError } = await supabase
                    .from('campaigns')
                    .select('*')
                    .eq('master_id', user.id)

                if (gmError) throw gmError

                // 2. Buscando campanhas onde sou Jogador
                const { data: playerParticipation, error: playerError } = await supabase
                    .from('campaign_participants')
                    .select('campaign:campaigns(*)')
                    .eq('user_id', user.id)

                if (playerError) throw playerError

                // Formatando e unificando as listas
                const playerCampaigns = playerParticipation
                    .map((p: any) => p.campaign)
                    .filter(c => c !== null)

                // Combinar listas removendo duplicatas (caso o mestre jogue na própria mesa)
                const allCampaigns = [...(gmCampaigns || []), ...playerCampaigns]
                const uniqueCampaigns = Array.from(new Map(allCampaigns.map(c => [c.id, c])).values())

                // Adicionar contagem de jogadores (simulado ou via query separada se necessário)
                // Para simplificar, vamos usar os dados que já temos ou 0
                const campaignsWithStats = await Promise.all(uniqueCampaigns.map(async (c: any) => {
                    const { count } = await supabase
                        .from('campaign_participants')
                        .select('*', { count: 'exact', head: true })
                        .eq('campaign_id', c.id)

                    return {
                        ...c,
                        currentPlayers: count || 0,
                        maxPlayers: c.max_players || 4, // Fallback
                        sessionsPlayed: 0, // Não temos essa tabela ainda
                        lastSession: null
                    }
                }))

                setCampaigns(campaignsWithStats)
            } catch (error) {
                console.error("Erro ao buscar campanhas:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchCampaigns()
    }, [])

    const handleDeleteCampaign = async () => {
        if (!campaignToDelete) return

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', campaignToDelete.id)

            if (error) throw error

            setCampaigns(prev => prev.filter(c => c.id !== campaignToDelete.id))
            setDeleteDialogOpen(false)
            setCampaignToDelete(null)

            toast({
                title: "Campanha excluída",
                description: "A campanha e todos os seus dados foram removidos.",
            })
        } catch (error: any) {
            toast({
                title: "Erro ao excluir",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsDeleting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
                    <p className="text-slate-400 animate-pulse">Invocando campanhas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            {/* Header */}
            <header className="container mx-auto max-w-7xl mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Scroll className="h-8 w-8 text-amber-500" />
                            <h1 className="text-3xl font-serif italic text-white">Minhas Campanhas</h1>
                        </div>
                        <p className="text-slate-400">Gerencie todas as suas aventuras épicas em um só lugar.</p>
                    </div>
                    <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                        <Link href="/campaigns/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Campanha
                        </Link>
                    </Button>
                </div>
            </header>

            {/* Campaigns Tabs */}
            <div className="container mx-auto max-w-7xl">
                <Tabs defaultValue="upcoming" className="space-y-6">
                    <TabsList className="bg-slate-900 border border-slate-800 p-1 grid grid-cols-2 md:grid-cols-3 gap-1">
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                            const Icon = config.icon
                            const count = getCampaignsByStatus(status as CampaignStatus).length

                            return (
                                <TabsTrigger
                                    key={status}
                                    value={status}
                                    className="data-[state=active]:bg-amber-600 cursor-pointer hover:text-slate-100 text-slate-100 flex items-center gap-2"
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden  sm:inline">{config.label}</span>
                                    <Badge variant="outline" className="ml-auto bg-slate-950/50 border-slate-700 text-xs text-slate-100">
                                        {count}
                                    </Badge>
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>

                    {/* Tab Contents */}
                    {Object.keys(STATUS_CONFIG).map((status) => (
                        <TabsContent key={status} value={status}>
                            <CampaignGrid
                                campaigns={getCampaignsByStatus(status as CampaignStatus)}
                                status={status as CampaignStatus}
                                currentUserId={userId}
                                onDeleteRequest={(campaign) => {
                                    setCampaignToDelete(campaign)
                                    setDeleteDialogOpen(true)
                                }}
                            />
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <DialogHeader>
                        <div className="flex items-center gap-3 text-red-500 mb-2">
                            <AlertTriangle className="h-6 w-6" />
                            <DialogTitle className="text-xl font-serif">Excluir Campanha?</DialogTitle>
                        </div>
                        <DialogDescription className="text-slate-400">
                            Esta ação é permanente. Ao excluir <strong className="text-slate-200">"{campaignToDelete?.name}"</strong>, a campanha será removida, mas seus NPCs, localidades e itens permanecerão salvos na sua biblioteca para uso futuro.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteDialogOpen(false)}
                            className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDeleteCampaign}
                            className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir Definitivamente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function CampaignGrid({
    campaigns,
    status,
    currentUserId,
    onDeleteRequest
}: {
    campaigns: any[],
    status: CampaignStatus,
    currentUserId: string | null,
    onDeleteRequest: (campaign: any) => void
}) {
    if (campaigns.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-slate-900 rounded-full p-6 mb-4">
                    <Scroll className="h-12 w-12 text-slate-700" />
                </div>
                <h3 className="text-xl font-serif text-slate-400 mb-2">Nenhuma campanha {STATUS_CONFIG[status].label.toLowerCase()}</h3>
                <p className="text-slate-500 mb-6">Comece criando uma nova aventura épica!</p>
                <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                    <Link href="/campaigns/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Campanha
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
                <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    isMaster={currentUserId === campaign.master_id}
                    onDelete={() => onDeleteRequest(campaign)}
                />
            ))}
        </div>
    )
}

function CampaignCard({
    campaign,
    isMaster,
    onDelete
}: {
    campaign: any,
    isMaster: boolean,
    onDelete: () => void
}) {
    const statusConfig = STATUS_CONFIG[campaign.status as CampaignStatus]
    const StatusIcon = statusConfig.icon

    return (
        <div className="relative group">
            {isMaster && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDelete()
                    }}
                    className="absolute top-2 right-2 z-20 h-8 w-8 text-slate-500 hover:text-red-500 hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all rounded-full"
                    title="Excluir Campanha"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}

            <Link href={`/campaigns/${campaign.id}/dashboard`} className="block">
                <Card className="bg-slate-900 border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer h-full">
                    <CardHeader>
                        <div className="flex items-start justify-between mb-2">
                            <Badge variant={statusConfig.badgeVariant} className={`${statusConfig.color} border-slate-700`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusConfig.label}
                            </Badge>
                            <Swords className="h-5 w-5 text-slate-700 group-hover:text-amber-500 transition-colors" />
                        </div>

                        <CardTitle className="text-xl font-serif text-slate-100 group-hover:text-amber-500 transition-colors">
                            {campaign.name}
                        </CardTitle>

                        <CardDescription className="text-slate-400 line-clamp-2">
                            {campaign.description}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>{campaign.currentPlayers}/{campaign.maxPlayers}</span>
                            </div>

                            {campaign.sessionsPlayed > 0 && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{campaign.sessionsPlayed} sessões</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-slate-500">Sistema</span>
                                <span className="text-sm font-medium text-slate-300">{campaign.system}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                                <span className="text-xs text-slate-500">Gênero</span>
                                <span className="text-sm font-medium text-slate-300">{campaign.genre}</span>
                            </div>
                        </div>

                        {campaign.lastSession && (
                            <div className="text-xs text-slate-500">
                                Última sessão: {new Date(campaign.lastSession).toLocaleDateString('pt-BR')}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}
