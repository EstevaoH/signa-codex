"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
    Skull,
    ShieldAlert,
    MapPin,
    Users,
    Search,
    Plus,
    ArrowLeft,
    ScrollText,
    Sword,
    Eye,
    EyeOff
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EntityDetailsDialog } from "@/components/entity-details-dialog"

export default function CodexPage() {
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [data, setData] = useState<{
        monstros: any[],
        itens: any[],
        localidades: any[],
        npcs: any[]
    }>({
        monstros: [],
        itens: [],
        localidades: [],
        npcs: []
    })

    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedEntity, setSelectedEntity] = useState<any>(null)
    const [selectedEntityType, setSelectedEntityType] = useState<'monstro' | 'item' | 'local' | 'npc'>('monstro')

    const openDetails = (type: 'monstro' | 'item' | 'local' | 'npc', entity: any) => {
        setSelectedEntityType(type)
        setSelectedEntity(entity)
        setDetailsOpen(true)
    }

    useEffect(() => {
        const fetchCodexData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setLoading(true)
            try {
                const [
                    { data: monstersData },
                    { data: itemsData },
                    { data: locationsData },
                    { data: npcsData }
                ] = await Promise.all([
                    supabase.from('monsters').select('*').eq('owner_id', user.id),
                    supabase.from('items').select('*').eq('owner_id', user.id),
                    supabase.from('locations').select('*').eq('owner_id', user.id),
                    supabase.from('npcs').select('*').eq('owner_id', user.id)
                ])

                setData({
                    monstros: (monstersData || []).map(m => ({
                        ...m,
                        nome: m.name,
                        cr: m.challenge_rating || m.stats?.challenge_rating || "-",
                        hp: m.stats?.hit_points || m.hp || "??",
                        tipo: m.type
                    })),
                    itens: itemsData || [],
                    localidades: locationsData || [],
                    npcs: (npcsData || []).map(n => ({
                        ...n,
                        nome: n.name,
                        raca: n.race,
                        classe: n.occupation,
                        alinhamento: n.alignment,
                        descricao: n.description
                    }))
                })
            } catch (error) {
                console.error("Erro ao carregar Codex:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchCodexData()
    }, [])

    const filterEntities = (entities: any[]) => {
        return entities.filter(e =>
            (e.nome || e.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.descricao || e.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.tipo || e.type || "").toLowerCase().includes(searchTerm.toLowerCase())
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <p className="text-slate-400 animate-pulse">Consultando o Cânone...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            <header className="container mx-auto max-w-7xl mb-8">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar à Dashboard</span>
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-serif italic text-amber-500 flex items-center gap-2">
                            <ScrollText className="h-8 w-8" /> Cânone Global
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Sua biblioteca completa de criações</p>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar no Cânone..."
                            className="pl-10 bg-slate-900 border-slate-800 focus:border-amber-500/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="container mx-auto max-w-7xl">
                <Tabs defaultValue="monstros" className="space-y-6">
                    <TabsList className="bg-slate-900 border border-slate-800 p-1 grid grid-cols-2 md:grid-cols-4 gap-1">
                        <TabsTrigger value="monstros" className="data-[state=active]:bg-amber-600">
                            <Skull className="w-4 h-4 mr-2" /> Monstros
                        </TabsTrigger>
                        <TabsTrigger value="itens" className="data-[state=active]:bg-amber-600">
                            <Sword className="w-4 h-4 mr-2" /> Itens
                        </TabsTrigger>
                        <TabsTrigger value="locais" className="data-[state=active]:bg-amber-600">
                            <MapPin className="w-4 h-4 mr-2" /> Localidades
                        </TabsTrigger>
                        <TabsTrigger value="npcs" className="data-[state=active]:bg-amber-600">
                            <Users className="w-4 h-4 mr-2" /> NPCs
                        </TabsTrigger>
                    </TabsList>

                    {/* Monstros */}
                    <TabsContent value="monstros" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterEntities(data.monstros).map((monstro) => (
                            <Card
                                key={monstro.id}
                                className="bg-slate-900 border-slate-800 hover:border-amber-900/50 transition-all cursor-pointer"
                                onClick={() => openDetails('monstro', monstro)}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="text-amber-500 border-amber-900">CR {monstro.cr}</Badge>
                                    </div>
                                    <CardTitle className="text-xl text-slate-100 uppercase tracking-wide">{monstro.nome}</CardTitle>
                                    <CardDescription className="text-slate-500">{monstro.tipo}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-slate-400 flex items-center gap-2">
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: '100%' }} />
                                        </div>
                                        <span className="font-mono">{monstro.hp} HP</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* Itens */}
                    <TabsContent value="itens" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterEntities(data.itens).map((item) => (
                            <Card
                                key={item.id}
                                className="bg-slate-900 border-slate-800 hover:border-amber-900/50 transition-all cursor-pointer"
                                onClick={() => openDetails('item', item)}
                            >
                                <CardHeader className="flex flex-row items-center gap-4">
                                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                                        <Sword className="h-6 w-6 text-amber-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-md text-slate-100">{item.name}</CardTitle>
                                        <Badge className="mt-1 bg-purple-900/30 text-purple-400 border-purple-900">
                                            {item.rarity}
                                        </Badge>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* Localidades */}
                    <TabsContent value="locais" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterEntities(data.localidades).map((local) => (
                            <Card
                                key={local.id}
                                className="bg-slate-900 border-slate-800 hover:border-amber-900/50 transition-all cursor-pointer overflow-hidden"
                                onClick={() => openDetails('local', local)}
                            >
                                <div className="h-24 bg-slate-800 opacity-50" />
                                <CardHeader className="-mt-8">
                                    <CardTitle className="text-amber-500">{local.name}</CardTitle>
                                    <CardDescription>{local.stats?.climate || "Clima desconhecido"}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* NPCs */}
                    <TabsContent value="npcs" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filterEntities(data.npcs).map((npc) => (
                            <Card
                                key={npc.id}
                                className="bg-slate-900 border-slate-800 hover:border-amber-900/50 transition-all cursor-pointer"
                                onClick={() => openDetails('npc', npc)}
                            >
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                                            <Users className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-slate-100">{npc.nome}</CardTitle>
                                            <CardDescription className="text-slate-400">{npc.raca} • {npc.classe}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))}
                    </TabsContent>
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
