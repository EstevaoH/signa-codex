"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Skull,
    Sword,
    MapPin,
    Users,
    User,
    Shield,
    Heart,
    Zap,
    Activity,
    BookOpen,
    Wind
} from "lucide-react"

type EntityType = 'monstro' | 'item' | 'local' | 'npc' | 'jogador'

const LOCATION_TYPES = [
    { value: "city", label: "Cidade / Vila" },
    { value: "dungeon", label: "Masmorra / Dungeon" },
    { value: "wilderness", label: "Região Selvagem" },
    { value: "building", label: "Construção / Edifício" },
    { value: "plane", label: "Plano de Existência" },
]

interface EntityDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    type: EntityType
    data: any
}

export function EntityDetailsDialog({ open, onOpenChange, type, data }: EntityDetailsDialogProps) {
    if (!data) return null

    const renderContent = () => {
        switch (type) {
            case 'monstro':
                // Filter out non-stat fields from the stats object
                const validStats = data.stats ? Object.entries(data.stats).filter(([key]) =>
                    !['description', 'status', 'challenge_rating', 'cr', 'attributes'].includes(key)
                ) : []

                // Add mapping for speed
                const formatStatLabel = (key: string) => {
                    const map: Record<string, string> = {
                        hit_points: 'PV',
                        armor_class: 'CA',
                        challenge_rating: 'CR',
                        speed: 'DESL.',
                        strength: 'FOR',
                        dexterity: 'DES',
                        constitution: 'CON',
                        intelligence: 'INT',
                        wisdom: 'SAB',
                        charisma: 'CAR'
                    }
                    return map[key] || key
                }

                return (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="border-amber-600 text-amber-500">CR {data.cr}</Badge>
                            <Badge className="bg-slate-800">{data.tipo}</Badge>
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <Heart className="h-3 w-3" /> {data.hp} HP
                            </Badge>
                            <Badge variant={data.stats?.status === 'dead' ? 'destructive' : 'default'} className={data.stats?.status === 'dead' ? "bg-red-900" : "bg-green-900"}>
                                {data.stats?.status === 'dead' ? 'Morto' : 'Vivo'}
                            </Badge>
                        </div>

                        {data.image_url && (
                            <div className="flex justify-center mb-6">
                                <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-slate-800 shadow-lg shadow-black/50">
                                    <img
                                        src={data.image_url}
                                        alt={data.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="text-slate-300 italic border-l-2 border-slate-700 pl-4">
                            {data.description || data.stats?.description || "Sem descrição disponível."}
                        </div>

                        {data.stats?.attributes && (
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                {Object.entries(data.stats.attributes).map(([attr, val]) => (
                                    <div key={attr} className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                                        <div className="text-[10px] text-slate-500 uppercase font-bold">{formatStatLabel(attr)}</div>
                                        <div className="text-lg font-bold text-amber-500">{val as number}</div>
                                        <div className="text-xs text-slate-400">
                                            {Math.floor(((val as number) - 10) / 2) >= 0 ? '+' : ''}{Math.floor(((val as number) - 10) / 2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {validStats.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                {validStats.map(([stat, value]) => (
                                    <div key={stat} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">{formatStatLabel(stat)}</div>
                                        <div className="text-sm font-medium text-slate-200">{value as string}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* GM Notes / Secrets */}
                        {data.notes && (
                            <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg mt-4">
                                <h4 className="flex items-center gap-2 text-amber-500 font-semibold mb-2">
                                    <BookOpen className="h-4 w-4" /> Segredo do Mestre
                                </h4>
                                <p className="text-sm text-amber-200/80 italic whitespace-pre-wrap">{data.notes}</p>
                            </div>
                        )}

                        {/* Actions Section if available */}
                        {data.actions && data.actions.length > 0 && (
                            <div>
                                <h4 className="flex items-center gap-2 text-amber-500 font-semibold mb-3">
                                    <Sword className="h-4 w-4" /> Ações
                                </h4>
                                <div className="space-y-3">
                                    {data.actions.map((action: any, idx: number) => (
                                        <div key={idx} className="bg-slate-900/50 p-3 rounded border border-slate-800">
                                            <span className="font-bold text-slate-200 block mb-1">{action.name}</span>
                                            <p className="text-sm text-slate-400">{action.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 'item':
                return (
                    <div className="space-y-6">
                        <div className="flex gap-2">
                            <Badge className="bg-purple-900 text-purple-100">
                                {data.rarity === 'common' ? 'Comum' :
                                    data.rarity === 'uncommon' ? 'Incomum' :
                                        data.rarity === 'rare' ? 'Raro' :
                                            data.rarity === 'very_rare' ? 'Muito Raro' :
                                                data.rarity === 'legendary' ? 'Lendário' :
                                                    data.rarity === 'artifact' ? 'Artefato' : data.rarity}
                            </Badge>
                            <Badge variant="secondary" className="capitalize">{data.type}</Badge>
                        </div>

                        {data.image_url && (
                            <div className="flex justify-center">
                                <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-slate-800 shadow-lg shadow-black/50">
                                    <img
                                        src={data.image_url}
                                        alt={data.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Peso</div>
                                <div className="text-xl font-bold text-slate-200">{data.properties?.weight ?? data.weight ?? 0}kg</div>
                            </div>
                            <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Valor</div>
                                <div className="text-xl font-bold text-amber-500">{data.properties?.value ?? data.value ?? 0} PO</div>
                            </div>
                            {(data.properties?.damage || data.damage) && (
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Dano</div>
                                    <div className="text-xl font-bold text-red-500">{data.properties?.damage || data.damage}</div>
                                </div>
                            )}
                            {(data.properties?.defense_bonus || data.defense_bonus) > 0 && (
                                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex flex-col items-center justify-center">
                                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Defesa</div>
                                    <div className="text-xl font-bold text-blue-500">+{data.properties?.defense_bonus || data.defense_bonus}</div>
                                </div>
                            )}
                        </div>

                        <div className="text-slate-300 text-sm leading-relaxed">
                            {data.description || "Sem descrição."}
                        </div>

                        {data.properties?.requirements && (data.properties.requirements.level > 1 || data.properties.requirements.strength > 0) && (
                            <div className="flex gap-4 p-3 rounded-lg bg-slate-950/30 border border-slate-800 w-fit">
                                {data.properties.requirements.level > 1 && (
                                    <div className="text-[10px]">
                                        <span className="text-slate-500 font-bold uppercase mr-1">Nível:</span>
                                        <span className="text-slate-300">{data.properties.requirements.level}</span>
                                    </div>
                                )}
                                {data.properties.requirements.strength > 0 && (
                                    <div className="text-[10px]">
                                        <span className="text-slate-500 font-bold uppercase mr-1">Força:</span>
                                        <span className="text-slate-300">{data.properties.requirements.strength}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {(data.properties?.effect || data.efeito) && (
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                <h4 className="flex items-center gap-2 text-amber-500 font-semibold mb-2 text-sm">
                                    <Zap className="h-4 w-4" /> Propriedades Mágicas
                                </h4>
                                <p className="text-sm text-slate-300 italic">{data.properties?.effect || data.efeito}</p>
                            </div>
                        )}

                        {data.notes && (
                            <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg mt-4">
                                <h4 className="flex items-center gap-2 text-amber-500 font-semibold mb-2">
                                    <BookOpen className="h-4 w-4" /> Segredo do Mestre
                                </h4>
                                <p className="text-sm text-amber-200/80 italic whitespace-pre-wrap">{data.notes}</p>
                            </div>
                        )}
                    </div>
                )

            case 'local':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase">Tipo</span>
                                <div className="flex items-center gap-2 text-slate-200">
                                    <MapPin className="h-4 w-4 text-amber-500" />
                                    {LOCATION_TYPES.find((t: { value: string; label: string }) => t.value === (data.stats?.type || data.tipo))?.label || data.stats?.type || data.tipo || "Geral"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase">Clima</span>
                                <div className="flex items-center gap-2 text-slate-200">
                                    <Wind className="h-4 w-4 text-blue-400" />
                                    {data.stats?.climate || data.clima || "Normal"}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase">Governo</span>
                                <div className="flex items-center gap-2 text-slate-200">
                                    <Shield className="h-4 w-4 text-purple-400" />
                                    {data.stats?.government || "Nenhum"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase">População / Cap.</span>
                                <div className="flex items-center gap-2 text-slate-200">
                                    <Users className="h-4 w-4 text-emerald-400" />
                                    {data.stats?.capacity || "Não informada"}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase">Nível de Perigo</span>
                                <div className="flex items-center gap-2 text-slate-200">
                                    <Skull className="h-4 w-4 text-red-500" />
                                    {data.stats?.danger_level || data.perigo}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-500 uppercase">Ameaça (0-10)</span>
                                <div className="flex items-center gap-2 text-slate-200">
                                    <Sword className="h-4 w-4 text-orange-500" />
                                    {data.stats?.danger_level_num !== undefined ? data.stats.danger_level_num : "0"}/10
                                </div>
                            </div>
                        </div>

                        {data.image_url && (
                            <div className="flex justify-center">
                                <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-slate-800 shadow-lg shadow-black/50">
                                    <img
                                        src={data.image_url}
                                        alt={data.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="text-slate-300 text-lg leading-relaxed">
                            {data.description || "Sem descrição."}
                        </div>

                        {data.map_url && (
                            <div className="space-y-2">
                                <h4 className="flex items-center gap-2 text-blue-400 font-semibold text-sm uppercase">
                                    <MapPin className="h-4 w-4" /> Mapa / Referência Visual
                                </h4>
                                <a
                                    href={data.map_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 rounded-lg bg-slate-950/30 border border-slate-800 text-blue-400 hover:text-blue-300 transition-colors text-sm break-all"
                                >
                                    {data.map_url}
                                </a>
                            </div>
                        )}

                        {(data.stats?.notes || data.segredos) && (
                            <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg">
                                <h4 className="flex items-center gap-2 text-amber-500 font-semibold mb-2">
                                    <BookOpen className="h-4 w-4" /> Segredos do Mestre
                                </h4>
                                <p className="text-sm text-amber-200/80 italic">{data.stats?.notes || data.segredos}</p>
                            </div>
                        )}
                    </div>
                )

            case 'npc':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-slate-800 text-slate-200 border-slate-700">
                                {data.race || data.raca || "Raça Desconhecida"}
                            </Badge>
                            <Badge variant="outline" className="border-amber-900/50 text-amber-500 bg-amber-950/10">
                                {data.occupation || data.classe || "Ocupação"}
                            </Badge>
                            <Badge className="bg-slate-900 text-slate-400 border border-slate-800">
                                {data.alignment || data.alinhamento || "Neutro"}
                            </Badge>
                        </div>

                        {data.image_url && (
                            <div className="flex justify-center my-4">
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-slate-800 shadow-2xl shadow-black/50 group">
                                    <img
                                        src={data.image_url}
                                        alt={data.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800/50">
                                <h4 className="text-xs text-slate-500 uppercase mb-2 font-bold tracking-wider">Descrição & Papel</h4>
                                <div className="text-slate-300 leading-relaxed italic">
                                    "{data.description || data.descricao || "Sem descrição disponível."}"
                                </div>
                            </div>

                            {(data.stats?.personality || data.personalidade) && (
                                <div className="space-y-2">
                                    <h4 className="flex items-center gap-2 text-emerald-400 font-semibold text-sm uppercase tracking-tight">
                                        <Activity className="h-4 w-4" /> Personalidade & Comportamento
                                    </h4>
                                    <div className="p-3 rounded-lg bg-emerald-950/10 border border-emerald-900/20 text-slate-300 text-sm">
                                        {data.stats?.personality || data.personalidade}
                                    </div>
                                </div>
                            )}

                            {(data.stats?.notes || data.segredos) && (
                                <div className="space-y-2">
                                    <h4 className="flex items-center gap-2 text-amber-500 font-semibold text-sm uppercase tracking-tight">
                                        <BookOpen className="h-4 w-4" /> Notas do Mestre
                                    </h4>
                                    <div className="p-3 rounded-lg bg-amber-950/10 border border-amber-900/20 text-amber-200/80 text-sm italic whitespace-pre-wrap">
                                        {data.stats?.notes || data.segredos}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )

            case 'jogador':
                const charData = data.data || data;
                const raca = charData.race || charData.raca || "Raça Desconhecida";
                const classe = charData.class || charData.classe || "Classe";
                const nivel = charData.level || charData.nivel || 1;
                const alinhamento = charData.alignment || charData.alinhamento;
                const bio = charData.description || charData.descricao || "Sem descrição disponível.";
                const personality = charData.personality;
                const system = data.system || "D&D 5e";
                const attrs = charData.attributes;

                return (
                    <div className="space-y-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-slate-800 text-slate-200 border-slate-700 capitalize">
                                        {raca}
                                    </Badge>
                                    <Badge className="bg-amber-600 capitalize">
                                        {classe}
                                    </Badge>
                                    {alinhamento && (
                                        <Badge variant="outline" className="border-slate-700 text-slate-400 capitalize">
                                            {alinhamento}
                                        </Badge>
                                    )}
                                </div>
                                <div className="text-2xl font-bold text-amber-500 font-serif italic">Nível {nivel}</div>
                            </div>

                            <Badge variant="outline" className="w-fit border-amber-500/30 text-amber-500/80 bg-amber-500/5 text-[10px] uppercase font-bold tracking-widest">
                                Sistema: {system}
                            </Badge>
                        </div>

                        {data.image_url && (
                            <div className="flex justify-center mb-6">
                                <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-slate-800 shadow-xl shadow-black/50">
                                    <img
                                        src={data.image_url}
                                        alt={data.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {attrs && (
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                {[
                                    { label: "FOR", value: attrs.strength },
                                    { label: "DES", value: attrs.dexterity },
                                    { label: "CON", value: attrs.constitution },
                                    { label: "INT", value: attrs.intelligence },
                                    { label: "SAB", value: attrs.wisdom },
                                    { label: "CAR", value: attrs.charisma },
                                ].map((attr) => (
                                    <div key={attr.label} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-center">
                                        <div className="text-[10px] text-slate-500 font-bold mb-1">{attr.label}</div>
                                        <div className="text-lg font-serif font-bold text-amber-500">{attr.value || 10}</div>
                                        <div className="text-[8px] text-slate-600">
                                            {Math.floor(((attr.value || 10) - 10) / 2) >= 0 ? "+" : ""}
                                            {Math.floor(((attr.value || 10) - 10) / 2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                <h4 className="text-xs text-slate-500 uppercase mb-2 font-bold tracking-wider">Biografia / Antecedente</h4>
                                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-serif italic">
                                    {bio}
                                </div>
                            </div>

                            {personality && (
                                <div className="bg-amber-950/10 p-4 rounded-lg border border-amber-900/20">
                                    <h4 className="text-xs text-amber-600 uppercase mb-2 font-bold tracking-wider">Personalidade</h4>
                                    <p className="text-amber-200/80 text-sm italic">{personality}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )

            default:
                return <p className="text-slate-500">Visualização não implementada para este tipo.</p>
        }
    }

    const getIcon = () => {
        switch (type) {
            case 'monstro': return <Skull className="h-5 w-5 text-red-500" />
            case 'item': return <Sword className="h-5 w-5 text-amber-500" />
            case 'local': return <MapPin className="h-5 w-5 text-blue-500" />
            case 'npc': return <Users className="h-5 w-5 text-green-500" />
            case 'jogador': return <User className="h-5 w-5 text-amber-500" />
            default: return null
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-100">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                            {getIcon()}
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-serif text-amber-500">{data.name}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                {type.charAt(0).toUpperCase() + type.slice(1)} Detalhes
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <Separator className="bg-slate-800 mb-4" />

                <div className="max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    )
}
