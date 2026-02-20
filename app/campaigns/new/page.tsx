"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    Scroll,
    ArrowRight,
    ArrowLeft,
    Check,
    BookOpen,
    Sparkles,
    Swords,
    MapPin,
    Users,
    Mail,
    X,
    Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { RULE_SYSTEMS, RuleSystemID } from "@/lib/rule-systems"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Campaign } from "@/shared/types/campaign"

// Mock Data
const SYSTEMS = Object.entries(RULE_SYSTEMS).map(([id, data]) => ({
    id,
    name: data.name,
    description: data.description,
    baseDice: data.baseDice
}))

const GENRES = [
    { id: "high-fantasy", name: "High Fantasy" },
    { id: "dark-fantasy", name: "Dark Fantasy" },
    { id: "sci-fi", name: "Sci-Fi" },
    { id: "horror", name: "Horror" },
    { id: "cyberpunk", name: "Cyberpunk" },
    { id: "steampunk", name: "Steampunk" },
]

const STEPS = [
    { id: 1, name: "Detalhes Básicos", icon: BookOpen },
    { id: 2, name: "Jogadores", icon: Users },
    { id: 3, name: "Sistema & Regras", icon: Swords },
]

export default function NewCampaignPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [campaignData, setCampaignData] = useState<Campaign>({
        name: "",
        description: "",
        lore: "",
        genre: "",
        system: "",
        max_players: 4,
        players: [],
        status: "upcoming",
        id: "",
        master_id: "",
    })

    // Player Invite State
    const [inviteEmail, setInviteEmail] = useState("")
    const [invitedEmails, setInvitedEmails] = useState<string[]>([])

    const updateField = (field: keyof Campaign, value: string) => {
        setCampaignData(prev => ({ ...prev, [field]: value }))
    }

    const addInvite = () => {
        if (inviteEmail && inviteEmail.includes("@") && !invitedEmails.includes(inviteEmail)) {
            setInvitedEmails([...invitedEmails, inviteEmail])
            setInviteEmail("")
        }
    }

    const removeInvite = (email: string) => {
        setInvitedEmails(invitedEmails.filter(e => e !== email))
    }

    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1)
    }

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        console.log("📜 Criando Campanha:", { ...campaignData, invites: invitedEmails })

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                console.error("Usuário não autenticado")
                return
            }

            // 1. Criar a campanha
            const { data: campaign, error: campaignError } = await supabase
                .from('campaigns')
                .insert({

                    name: campaignData.name,
                    description: campaignData.description,
                    system: campaignData.system, // assumindo que adicionaremos colunas extras depois ou usaremos JSON
                    genre: campaignData.genre,
                    master_id: user.id,
                    status: 'upcoming',

                })
                .select()
                .single()

            if (campaignError) throw campaignError

            // 2. Criar os convites
            if (invitedEmails.length > 0) {
                const invites = invitedEmails.map(email => ({
                    campaign_id: campaign.id,
                    email: email.toLowerCase(),
                    token: crypto.randomUUID(),
                    status: 'pending'
                }))

                const { error: inviteError } = await supabase
                    .from('campaign_invites')
                    .insert(invites)

                if (inviteError) console.error("Erro ao criar convites:", inviteError)
            }

            toast({
                title: "Campanha Criada!",
                description: `A aventura "${campaignData.name}" foi forjada com sucesso.`,
                variant: "default",
                className: "bg-green-600 border-green-700 text-white"
            })

            router.push(`/campaigns/${campaign.id}/dashboard`) // Redireciona para o dash da nova campanha
        } catch (error: any) {
            console.error("Erro ao salvar campanha:", error)
            toast({
                title: "Erro ao criar campanha",
                description: error.message || "Ocorreu um erro ao tentar criar a campanha. Tente novamente.",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            {/* Header */}
            <header className="container mx-auto max-w-4xl mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar ao Grimório</span>
                </Link>

                <div className="flex items-center gap-3 mb-2">
                    <Scroll className="h-8 w-8 text-amber-500" />
                    <h1 className="text-3xl font-serif italic text-white">Forjar Nova Campanha</h1>
                </div>
                <p className="text-slate-400">Crie uma nova jornada épica para seus jogadores.</p>
            </header>

            {/* Progress Steps */}
            <div className="container mx-auto max-w-4xl mb-8">
                <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => {
                        const Icon = step.icon
                        const isActive = currentStep === step.id
                        const isCompleted = currentStep > step.id

                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center gap-2 flex-1">
                                    <div className={`
                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all
                    ${isCompleted ? 'bg-amber-600 border-amber-600' : ''}
                    ${isActive ? 'bg-amber-600 border-amber-600 scale-110' : ''}
                    ${!isActive && !isCompleted ? 'bg-slate-900 border-slate-700' : ''}
                  `}>
                                        {isCompleted ? (
                                            <Check className="h-6 w-6 text-white" />
                                        ) : (
                                            <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                        )}
                                    </div>
                                    <span className={`text-xs font-medium text-center ${isActive ? 'text-amber-500' : 'text-slate-500'}`}>
                                        {step.name}
                                    </span>
                                </div>

                                {index < STEPS.length - 1 && (
                                    <div className={`h-0.5 flex-1 mx-4 ${isCompleted ? 'bg-amber-600' : 'bg-slate-800'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="container mx-auto max-w-4xl">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-2xl font-serif text-amber-500">
                            {STEPS[currentStep - 1].name}
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {currentStep === 1 && "Defina o nome e propósito da sua campanha."}
                            {currentStep === 2 && "Convide os bravos aventureiros que irão participar."}
                            {currentStep === 3 && "Escolha o sistema de regras e configurações finais."}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-slate-300">Nome da Campanha *</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: A Queda de Aethelgard"
                                        value={campaignData.name}
                                        onChange={(e) => updateField("name", e.target.value)}
                                        className="bg-slate-950/50 border-slate-700 text-slate-300 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-slate-300">Descrição Curta *</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Uma breve descrição do que os jogadores podem esperar..."
                                        value={campaignData.description}
                                        onChange={(e) => updateField("description", e.target.value)}
                                        className="bg-slate-950/50 border-slate-700 text-slate-300 focus:ring-amber-500 min-h-[100px]"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="setting" className="text-slate-300">Ambientação</Label>
                                        <Input
                                            id="setting"
                                            placeholder="Ex: Reino de Valdoria"
                                            value={campaignData.lore}
                                            onChange={(e) => updateField("lore", e.target.value)}
                                            className="bg-slate-950/50 border-slate-700 text-slate-300 focus:ring-amber-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="genre" className="text-slate-300">Gênero</Label>
                                        <Select value={campaignData.genre} onValueChange={(value) => updateField("genre", value)}>
                                            <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-300 focus:ring-amber-500">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 text-slate-300 border-slate-800">
                                                {GENRES.map((genre) => (
                                                    <SelectItem key={genre.id} value={genre.id} className="text-slate-100 focus:bg-slate-800 focus:text-amber-500">
                                                        {genre.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Players & Invites */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="maxPlayers" className="text-slate-300">Número Máximo de Jogadores</Label>
                                        <Input
                                            id="maxPlayers"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={campaignData.max_players}
                                            onChange={(e) => updateField("max_players", e.target.value)}
                                            className="bg-slate-950/50 border-slate-700 text-slate-300 focus:ring-amber-500 w-32"
                                        />
                                    </div>

                                    <div className="space-y-2 pt-4">
                                        <Label className="text-slate-300">Convidar Jogadores (E-mail)</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                                <Input
                                                    placeholder="jogador@exemplo.com"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && addInvite()}
                                                    className="pl-10 bg-slate-950/50 border-slate-700 text-slate-300 focus:ring-amber-500"
                                                />
                                            </div>
                                            <Button
                                                onClick={addInvite}
                                                type="button"
                                                variant="secondary"
                                                className="bg-slate-800 cursor-pointer text-slate-200 hover:bg-slate-700"
                                            >
                                                Adicionar
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Adicione os e-mails dos jogadores que deseja convidar. Eles receberão um link para criar as fichas.
                                        </p>
                                    </div>

                                    {invitedEmails.length > 0 && (
                                        <div className="bg-slate-950/30 rounded-lg p-4 border border-slate-800/50 mt-4">
                                            <h4 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                                                <Users className="h-4 w-4" /> Convites Pendentes ({invitedEmails.length})
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {invitedEmails.map((email) => (
                                                    <Badge key={email} variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 pl-2 pr-1 py-1 flex items-center gap-2">
                                                        {email}
                                                        <button
                                                            onClick={() => removeInvite(email)}
                                                            className="hover:bg-slate-800 rounded-full p-0.5 transition-colors"
                                                        >
                                                            <X className="h-3 w-3 text-slate-500 hover:text-red-400" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: System & Rules */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="system" className="text-slate-300">Sistema de Regras *</Label>
                                    <Select value={campaignData.system} onValueChange={(value) => updateField("system", value)}>
                                        <SelectTrigger className="bg-slate-950/50 border-slate-700 text-slate-300 focus:ring-amber-500">
                                            <SelectValue placeholder="Selecione o sistema" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800">
                                            {SYSTEMS.map((system) => (
                                                <SelectItem key={system.id} value={system.id} className="text-slate-100 focus:bg-slate-800 focus:text-amber-500">
                                                    {system.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lore" className="text-slate-300">Lore Inicial (Opcional)</Label>
                                    <Textarea
                                        id="lore"
                                        placeholder="Um breve prelúdio para a campanha..."
                                        value={campaignData.lore}
                                        onChange={(e) => updateField("lore", e.target.value)}
                                        className="bg-slate-950/50 border-slate-700 text-slate-300 focus:ring-amber-500 min-h-[120px]"
                                    />
                                </div>

                                {campaignData.system && (
                                    <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="flex items-center gap-2 text-amber-500 mb-2">
                                            <Sparkles className="h-4 w-4" />
                                            <h4 className="font-bold text-sm uppercase tracking-wider">Mecânica do Sistema</h4>
                                        </div>
                                        <p className="text-slate-300 text-sm italic">
                                            {RULE_SYSTEMS[campaignData.system as RuleSystemID]?.description}
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <Badge variant="outline" className="border-amber-700 text-amber-500 bg-amber-900/10">
                                                Dado Base: {RULE_SYSTEMS[campaignData.system as RuleSystemID]?.baseDice}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                <Separator className="bg-slate-800" />

                                {/* Review Summary */}
                                <div className="space-y-4 bg-slate-950/50 p-6 rounded-lg border border-slate-800">
                                    <div className="flex items-center gap-2 text-amber-500 mb-4">
                                        <Sparkles className="h-5 w-5" />
                                        <h3 className="font-serif font-bold text-lg">Resumo da Campanha</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-slate-500">Nome:</p>
                                            <p className="text-slate-200 font-medium">{campaignData.name || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Ambientação:</p>
                                            <p className="text-slate-200 font-medium">{campaignData.lore || "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Sistema:</p>
                                            <p className="text-slate-200 font-medium">
                                                {SYSTEMS.find(s => s.id === campaignData.system)?.name || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500">Jogadores:</p>
                                            <p className="text-slate-200 font-medium">{invitedEmails.length} convidados (Máx: {campaignData.max_players})</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6 border-t border-slate-800">
                            <Button
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={currentStep === 1 || isLoading}
                                className="border-slate-700 text-slate-300 cursor-pointer bg-slate-950/50 hover:bg-slate-800 hover:text-white disabled:opacity-50"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Anterior
                            </Button>

                            {currentStep < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={isLoading}
                                    className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                                >
                                    Próximo
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                    className="bg-amber-600 cursor-pointer hover:bg-amber-700 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Forjando Campanha...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="mr-2  h-4 w-4" />
                                            Criar Campanha
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
