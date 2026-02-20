"use client"

import { useState } from "react"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Swords, Shield, Heart, Zap, Moon, Sun, Plus, Minus, Play, Square, Users, Skull, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DiceResultOverlay } from "./dice-result-overlay"

interface MasterActionsTabProps {
    jogadores: Array<{ id: number; nome: string; classe: string; nivel: number; raca: string }>
    monstros: Array<{ id: number; nome: string; cr: string; tipo: string; hp: string }>
    isMaster?: boolean
}

export function MasterActionsTab({ jogadores, monstros, isMaster }: MasterActionsTabProps) {
    const [diceResult, setDiceResult] = useState<{ result: number; isCritical: boolean; isFumble: boolean } | null>(null)
    const [combatActive, setCombatActive] = useState(false)
    const [initiativeList, setInitiativeList] = useState<Array<{ id: string; nome: string; iniciativa: number; tipo: 'jogador' | 'monstro'; hp: number; maxHp: number; status: string[]; hidden: boolean }>>([])
    const [selectedEntity, setSelectedEntity] = useState<string>("")
    const [initiativeValue, setInitiativeValue] = useState<string>("")
    const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0)

    const rollDice = (sides: number) => {
        const result = Math.floor(Math.random() * sides) + 1
        const isCritical = sides === 20 && result === 20
        const isFumble = sides === 20 && result === 1
        setDiceResult({ result, isCritical, isFumble })
    }

    const addToInitiative = () => {
        if (!selectedEntity || !initiativeValue) return

        const entity = jogadores.find(j => j.id.toString() === selectedEntity) ||
            monstros.find(m => m.id.toString() === selectedEntity)

        if (!entity) return

        const newEntry = {
            id: selectedEntity,
            nome: 'nome' in entity ? entity.nome : '',
            iniciativa: parseInt(initiativeValue),
            tipo: jogadores.find(j => j.id.toString() === selectedEntity) ? 'jogador' as const : 'monstro' as const,
            hp: 'hp' in entity ? parseInt(entity.hp) : 100,
            maxHp: 'hp' in entity ? parseInt(entity.hp) : 100,
            status: [],
            hidden: false
        }

        setInitiativeList([...initiativeList, newEntry].sort((a, b) => b.iniciativa - a.iniciativa))
        setSelectedEntity("")
        setInitiativeValue("")
    }

    const updateHP = (id: string, delta: number) => {
        setInitiativeList(initiativeList.map(entity =>
            entity.id === id
                ? { ...entity, hp: Math.max(0, Math.min(entity.maxHp, entity.hp + delta)) }
                : entity
        ))
    }

    const addStatus = (id: string, status: string) => {
        setInitiativeList(initiativeList.map(entity =>
            entity.id === id
                ? { ...entity, status: [...entity.status, status] }
                : entity
        ))
    }

    const removeStatus = (id: string, status: string) => {
        setInitiativeList(initiativeList.map(entity =>
            entity.id === id
                ? { ...entity, status: entity.status.filter(s => s !== status) }
                : entity
        ))
    }

    const toggleHidden = (id: string) => {
        setInitiativeList(initiativeList.map(entity =>
            entity.id === id
                ? { ...entity, hidden: !entity.hidden }
                : entity
        ))
    }

    const toggleDeath = (id: string) => {
        setInitiativeList(initiativeList.map(entity => {
            if (entity.id !== id) return entity

            // Se já estiver morto, revive com 1 HP
            if (entity.status.includes('Morto')) {
                return {
                    ...entity,
                    hp: 1,
                    status: entity.status.filter(s => s !== 'Morto')
                }
            }

            // Se estiver vivo, mata (0 HP e status Morto)
            return {
                ...entity,
                hp: 0,
                status: [...entity.status, 'Morto']
            }
        }))
    }

    const startCombat = () => {
        setActiveTurnIndex(0)
        setCombatActive(true)
    }

    const endCombat = () => {
        setCombatActive(false)
        setInitiativeList([])
        setActiveTurnIndex(0)
    }

    const nextTurn = () => {
        if (initiativeList.length === 0) return
        setActiveTurnIndex((prev) => (prev + 1) % initiativeList.length)
    }

    const prevTurn = () => {
        if (initiativeList.length === 0) return
        setActiveTurnIndex((prev) => (prev - 1 + initiativeList.length) % initiativeList.length)
    }

    const rollForMonsters = () => {
        const newMonsters = monstros
            .filter(m => !initiativeList.some(e => e.id === m.id.toString()))
            .map(m => ({
                id: m.id.toString(),
                nome: m.nome,
                iniciativa: Math.floor(Math.random() * 20) + 1,
                tipo: 'monstro' as const,
                hp: parseInt(m.hp) || 100,
                maxHp: parseInt(m.hp) || 100,
                status: [],
                hidden: false
            }))

        const newList = [...initiativeList, ...newMonsters].sort((a, b) => b.iniciativa - a.iniciativa)
        setInitiativeList(newList)
    }

    const shortRest = () => {
        setInitiativeList(initiativeList.map(entity => ({
            ...entity,
            hp: Math.min(entity.maxHp, entity.hp + Math.floor(entity.maxHp * 0.25)),
            status: entity.status.filter(s => !['Envenenado', 'Atordoado'].includes(s))
        })))
    }

    const longRest = () => {
        setInitiativeList(initiativeList.map(entity => ({
            ...entity,
            hp: entity.maxHp,
            status: []
        })))
    }

    return (
        <div className="space-y-6">
            {diceResult && (
                <DiceResultOverlay
                    result={diceResult.result}
                    isCritical={diceResult.isCritical}
                    isFumble={diceResult.isFumble}
                    onClose={() => setDiceResult(null)}
                />
            )}

            {/* Rolador de Dados */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-amber-500 flex items-center gap-2">
                        <Dice6 className="h-5 w-5" />
                        Rolador de Dados
                    </CardTitle>
                    <CardDescription>Role dados para testes, dano e efeitos</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {[4, 6, 8, 10, 12, 20].map((sides) => (
                            <Button
                                key={sides}
                                onClick={() => rollDice(sides)}
                                className="bg-slate-950 hover:bg-amber-900/30 border-2 border-slate-700 hover:border-amber-500 h-20 flex flex-col gap-1"
                            >
                                <Dice6 className="h-6 w-6" />
                                <span className="text-lg font-bold">d{sides}</span>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Controles de Combate */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-amber-500 flex items-center gap-2">
                        <Swords className="h-5 w-5" />
                        Controle de Combate
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3">
                        {!combatActive ? (
                            <Button onClick={startCombat} className="bg-red-600 hover:bg-red-700 flex-1">
                                <Play className="mr-2 h-4 w-4" />
                                Iniciar Combate
                            </Button>
                        ) : (
                            <div className="flex flex-col gap-3 w-full">
                                <Button onClick={endCombat} variant="outline" className="border-red-600 text-red-500 hover:bg-red-950 flex-1" disabled={!isMaster}>
                                    <Square className="mr-2 h-4 w-4" />
                                    Finalizar Combate
                                </Button>
                                <div className="flex gap-2">
                                    <Button onClick={prevTurn} variant="secondary" className="flex-1 bg-slate-800 hover:bg-slate-700">
                                        Turno Anterior
                                    </Button>
                                    <Button onClick={nextTurn} className="flex-1 bg-amber-600 hover:bg-amber-700">
                                        Próximo Turno
                                    </Button>
                                </div>
                                <Button onClick={rollForMonsters} variant="outline" className="border-amber-600/50 text-amber-500 hover:bg-amber-950 flex-1" disabled={!isMaster}>
                                    <Swords className="mr-2 h-4 w-4" />
                                    Rolar Iniciativa Geral (Monstros)
                                </Button>
                            </div>
                        )}
                    </div>

                    {combatActive && (
                        <div className={`space-y-3 pt-4 border-t border-slate-800 ${!isMaster ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h3 className="text-sm font-semibold text-slate-300">Adicionar à Iniciativa</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs text-slate-400">Entidade</Label>
                                    <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                                        <SelectTrigger className="bg-slate-950 border-slate-700">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800">
                                            <div className="px-2 py-1 text-xs font-semibold text-amber-500">Jogadores</div>
                                            {jogadores.map((j) => (
                                                <SelectItem key={`j-${j.id}`} value={j.id.toString()} className="text-slate-100">
                                                    {j.nome}
                                                </SelectItem>
                                            ))}
                                            <div className="px-2 py-1 text-xs font-semibold text-red-500 mt-2">Monstros</div>
                                            {monstros.map((m) => (
                                                <SelectItem key={`m-${m.id}`} value={m.id.toString()} className="text-slate-100">
                                                    {m.nome}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-400">Iniciativa</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={initiativeValue}
                                            onChange={(e) => setInitiativeValue(e.target.value)}
                                            className="bg-slate-950 border-slate-700"
                                            placeholder="0"
                                        />
                                        <Button onClick={addToInitiative} size="sm" className="bg-amber-600 hover:bg-amber-700">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rastreador de Iniciativa */}
            {combatActive && initiativeList.length > 0 && (
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-amber-500 flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Ordem de Iniciativa
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {initiativeList.map((entity, index) => (
                            <div
                                key={`${entity.id}-${index}`}
                                className={`bg-slate-950/50 border rounded-lg p-4 transition-all ${index === activeTurnIndex ? 'border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-[1.02] bg-slate-900/80' : 'border-slate-800'} ${entity.status.includes('Morto') ? 'opacity-50 grayscale' : ''}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {index === activeTurnIndex && (
                                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-amber-500 rounded-r-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                        )}
                                        <Badge className="bg-amber-900/30 text-amber-400 text-lg px-3 py-1">
                                            {entity.iniciativa}
                                        </Badge>
                                        <div>
                                            <h4 className="font-semibold text-slate-100">{entity.nome}</h4>
                                            <p className="text-xs text-slate-400">
                                                {entity.tipo === 'jogador' ? <Users className="inline h-3 w-3 mr-1" /> : <Skull className="inline h-3 w-3 mr-1" />}
                                                {entity.tipo === 'jogador' ? 'Jogador' : 'Monstro'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isMaster && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleDeath(entity.id)}
                                                    className={`text-slate-400 hover:text-red-600 ${entity.status.includes('Morto') ? 'text-red-600 bg-red-950/30' : ''}`}
                                                    title={entity.status.includes('Morto') ? "Reviver" : "Marcar como morto"}
                                                >
                                                    <Skull className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleHidden(entity.id)}
                                                    className="text-slate-400 hover:text-amber-500"
                                                    title={entity.hidden ? "Mostrar informações" : "Ocultar informações"}
                                                >
                                                    {entity.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </>
                                        )}
                                        {!entity.hidden && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateHP(entity.id, -5)}
                                                    className="border-red-700 text-red-500 hover:bg-red-950"
                                                    disabled={entity.status.includes('Morto') || !isMaster}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <div className="text-center min-w-[80px]">
                                                    <div className="text-lg font-bold text-slate-100">
                                                        {entity.hp}/{entity.maxHp}
                                                    </div>
                                                    <div className="text-xs text-slate-400">HP</div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateHP(entity.id, 5)}
                                                    className="border-green-700 text-green-500 hover:bg-green-950"
                                                    disabled={entity.status.includes('Morto') || !isMaster}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {!entity.hidden && (
                                    <>
                                        {/* Barra de HP */}
                                        <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                                            <div
                                                className={`h-2 rounded-full transition-all ${entity.hp > entity.maxHp * 0.5 ? 'bg-green-600' :
                                                    entity.hp > entity.maxHp * 0.25 ? 'bg-yellow-600' : 'bg-red-600'
                                                    }`}
                                                style={{ width: `${(entity.hp / entity.maxHp) * 100}%` }}
                                            />
                                        </div>

                                        {/* Status Effects */}
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {entity.status.map((status, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="outline"
                                                    className="border-purple-700 text-purple-400 text-xs cursor-pointer hover:bg-purple-950"
                                                    onClick={() => removeStatus(entity.id, status)}
                                                >
                                                    {status} ×
                                                </Badge>
                                            ))}
                                        </div>

                                        {/* Quick Status Buttons */}
                                        <div className="flex gap-2 flex-wrap">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => addStatus(entity.id, 'Abençoado')}
                                                className="border-blue-700 text-blue-400 hover:bg-blue-950 text-xs"
                                                disabled={!isMaster}
                                            >
                                                <Zap className="h-3 w-3 mr-1" /> Buff
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => addStatus(entity.id, 'Envenenado')}
                                                className="border-purple-700 text-purple-400 hover:bg-purple-950 text-xs"
                                                disabled={!isMaster}
                                            >
                                                <Shield className="h-3 w-3 mr-1" /> Debuff
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Controles de Descanso */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-amber-500 flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Gerenciamento de Descanso
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            onClick={shortRest}
                            variant="outline"
                            className="border-blue-700 text-blue-400 hover:bg-blue-950 h-20 flex flex-col gap-2"
                            disabled={initiativeList.length === 0}
                        >
                            <Moon className="h-6 w-6" />
                            <span>Descanso Curto</span>
                            <span className="text-xs opacity-70">+25% HP</span>
                        </Button>
                        <Button
                            onClick={longRest}
                            variant="outline"
                            className="border-green-700 text-green-400 hover:bg-green-950 h-20 flex flex-col gap-2"
                            disabled={initiativeList.length === 0 || !isMaster}
                        >
                            <Sun className="h-6 w-6" />
                            <span>Descanso Longo</span>
                            <span className="text-xs opacity-70">HP Completo</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
