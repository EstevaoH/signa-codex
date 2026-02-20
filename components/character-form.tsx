"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Upload, X, Loader2, Shield, Dice5 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Character } from "@/shared/types/character"
import { RULE_SYSTEMS, getRuleEngine } from "@/lib/rule-systems"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export const characterSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
    system: z.string().min(1, "Selecione um sistema."),
    race: z.string().min(1, "Selecione uma raça."),
    class: z.string().min(1, "Selecione uma classe."),
    level: z.number().min(1, "Nível mínimo é 1"),
    alignment: z.string().min(1, "Selecione um alinhamento."),
    personality: z.string().optional(),
    image: z.string().optional(),
    attributes: z.object({
        strength: z.number(),
        dexterity: z.number(),
        constitution: z.number(),
        intelligence: z.number(),
        wisdom: z.number(),
        charisma: z.number(),
    })
});

export type CharacterFormValues = z.infer<typeof characterSchema>;

const SYSTEMS = Object.entries(RULE_SYSTEMS).map(([id, data]) => ({
    id,
    name: data.name
}))

const RACES = [
    "Humano", "Elfo", "Anão", "Halfling", "Draconato",
    "Gnomo", "Meio-Elfo", "Meio-Orc", "Tiefling"
]

const CLASSES = [
    "Bárbaro", "Bardo", "Clérigo", "Druida", "Guerreiro",
    "Monge", "Paladino", "Ranger", "Ladino", "Feiticeiro",
    "Bruxo", "Mago"
]

const ALIGNMENTS = [
    "Leal e Bom", "Neutro e Bom", "Caótico e Bom",
    "Leal e Neutro", "Neutro Verdadeiro", "Caótico e Neutro",
    "Leal e Mau", "Neutro e Mau", "Caótico e Mau"
]

interface CharacterFormProps {
    onSuccess?: () => void
    onCancel?: () => void
    characterToEdit?: Character
    isDialog?: boolean
}

export function CharacterForm({ onSuccess, onCancel, characterToEdit, isDialog = false }: CharacterFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(characterToEdit?.image_url || null)
    const [userId, setUserId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const isEditing = !!characterToEdit

    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUserId(user?.id || null)
        }
        getUserId()
    }, [])

    const form = useForm<CharacterFormValues>({
        resolver: zodResolver(characterSchema),
        defaultValues: {
            name: characterToEdit?.name || '',
            description: characterToEdit?.data?.description || '',
            system: characterToEdit?.system || '',
            race: characterToEdit?.data?.race || '',
            class: characterToEdit?.data?.class || '',
            level: characterToEdit?.data?.level || 1,
            alignment: characterToEdit?.data?.alignment || '',
            personality: characterToEdit?.data?.personality || '',
            image: characterToEdit?.image_url || '',
            attributes: characterToEdit?.data?.attributes || {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10,
            }
        }
    })

    // Reset form when characterToEdit changes
    useEffect(() => {
        if (characterToEdit) {
            form.reset({
                name: characterToEdit.name,
                description: characterToEdit.data?.description,
                system: characterToEdit.system,
                race: characterToEdit.data?.race,
                class: characterToEdit.data?.class,
                level: characterToEdit.data?.level,
                alignment: characterToEdit.data?.alignment,
                personality: characterToEdit.data?.personality,
                image: characterToEdit.image_url,
                attributes: characterToEdit.data?.attributes || {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10,
                },
            });
            setImagePreview(characterToEdit.image_url || "");
        }
    }, [characterToEdit, form]);

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64String = reader.result as string
                setImagePreview(base64String)
                form.setValue("image", base64String)
            }
            reader.readAsDataURL(file)
        }
    }

    function removeImage() {
        setImagePreview(null)
        form.setValue("image", "")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    async function onSubmit(data: CharacterFormValues) {
        if (!userId) {
            toast({
                title: "Erro de autenticação",
                description: "Você precisa estar logado para salvar um personagem.",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            const characterData = {
                user_id: userId,
                name: data.name,
                system: data.system,
                image_url: data.image || null,
                data: {
                    race: data.race,
                    class: data.class,
                    level: data.level,
                    alignment: data.alignment,
                    description: data.description,
                    personality: data.personality,
                    attributes: data.attributes
                }
            }

            if (isEditing) {
                const { error } = await supabase
                    .from('characters')
                    .update(characterData)
                    .eq('id', characterToEdit.id)

                if (error) throw error

                toast({
                    title: "Personagem atualizado!",
                    description: `${data.name} teve seus dados salvos.`,
                })
            } else {
                const { error } = await supabase
                    .from('characters')
                    .insert([characterData])

                if (error) throw error

                toast({
                    title: "Personagem criado!",
                    description: `${data.name} está pronto para a aventura.`,
                })
            }

            onSuccess?.()
            if (!isEditing) {
                form.reset()
                setImagePreview(null)
            }
        } catch (error: any) {
            toast({
                title: isEditing ? "Erro ao atualizar" : "Erro ao criar",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Bloco de Informações Principais - 8 colunas */}
                    <div className="md:col-span-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-amber-500/80 font-bold text-xs uppercase tracking-wider">Nome do Personagem *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Elara Vento-Sussurro" {...field} className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 transition-colors h-11" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="system"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-amber-500/80 font-bold text-xs uppercase tracking-wider">Sistema *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-slate-800 focus:border-amber-500/50 transition-colors h-11">
                                                    <SelectValue placeholder="Selecione o Sistema" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                {SYSTEMS.map(sys => (
                                                    <SelectItem key={sys.id} value={sys.id}>{sys.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <FormField
                                control={form.control}
                                name="race"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-wider">Raça *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/30 border-slate-800 h-10">
                                                    <SelectValue placeholder="Raça" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                {RACES.map(race => (
                                                    <SelectItem key={race} value={race.toLowerCase()}>{race}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="class"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-wider">Classe *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/30 border-slate-800 h-10">
                                                    <SelectValue placeholder="Classe" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                {CLASSES.map(cls => (
                                                    <SelectItem key={cls} value={cls.toLowerCase()}>{cls}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-wider">Nível *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                className="bg-slate-950/30 border-slate-800 h-10 text-center"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="alignment"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-wider">Alinhamento *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/30 border-slate-800 h-10">
                                                    <SelectValue placeholder="Alinhamento" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                                {ALIGNMENTS.map(align => (
                                                    <SelectItem key={align} value={align.toLowerCase()}>{align}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-400 font-bold text-xs uppercase tracking-wider">Biografia / Background *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Conte a história do seu herói..."
                                            className="min-h-[160px] bg-slate-950/50 border-slate-800 focus:border-amber-500/30 transition-colors scrollbar-hide leading-relaxed"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Bloco Lateral: Arte e Atributos - 4 colunas */}
                    <div className="md:col-span-4 space-y-6">
                        <div className="space-y-2">
                            <FormLabel className="text-amber-500/80 font-bold text-xs uppercase tracking-wider block mb-2">Arte do Personagem</FormLabel>
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-4 bg-slate-950/30 min-h-[180px] relative hover:border-amber-500/20 transition-all group overflow-hidden">
                                {imagePreview ? (
                                    <div className="relative w-full aspect-square max-h-[160px]">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover rounded-lg shadow-2xl"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-white hover:bg-white/20"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                Trocar Imagem
                                            </Button>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg z-20"
                                            onClick={removeImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-amber-500 transition-colors p-6"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-10 w-10 mb-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-sm font-medium">Ficha Visual</span>
                                        <span className="text-[10px] opacity-50 mt-1 uppercase tracking-tighter">PNG, JPG até 2MB</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4 shadow-inner">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Shield className="h-3 w-3" /> Atributos Base
                                </h4>
                                <Dice5 className="h-3 w-3 text-slate-700" />
                            </div>
                            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
                                {[
                                    { name: "strength", label: "FOR" },
                                    { name: "dexterity", label: "DES" },
                                    { name: "constitution", label: "CON" },
                                    { name: "intelligence", label: "INT" },
                                    { name: "wisdom", label: "SAB" },
                                    { name: "charisma", label: "CAR" },
                                ].map((attr) => (
                                    <FormField
                                        key={attr.name}
                                        control={form.control}
                                        name={`attributes.${attr.name}` as any}
                                        render={({ field }) => {
                                            const systemId = form.watch("system");
                                            const engine = getRuleEngine(systemId);
                                            const mod = engine.calculateModifier(field.value || 0, { level: form.watch("level") || 1 });
                                            const showMod = systemId === 'dnd5e' || systemId === 'pathfinder2e';
                                            const isCthulhu = systemId === 'cthulhu' || systemId === 'cthulhu7e';

                                            return (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[9px] text-slate-500 text-center block font-black border-b border-slate-800 pb-0.5 tracking-widest">{attr.label}</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group/input">
                                                            <Input
                                                                type="number"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                                className="h-12 text-center bg-slate-900/50 border-transparent focus:border-amber-500/30 text-base px-1 font-mono font-bold text-amber-100 transition-all hover:bg-slate-800/80"
                                                            />
                                                            {showMod && (
                                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 px-1 rounded text-[10px] text-amber-500 font-bold pointer-events-none transition-transform group-hover/input:scale-110">
                                                                    {mod >= 0 ? `+${mod}` : mod}
                                                                </div>
                                                            )}
                                                            {isCthulhu && (
                                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                                                                    <span className="bg-slate-900 border border-slate-800 px-1 rounded text-[8px] text-amber-500/70 font-bold">
                                                                        {Math.floor((field.value || 0) / 2)}
                                                                    </span>
                                                                    <span className="bg-slate-900 border border-slate-800 px-1 rounded text-[8px] text-amber-600 font-bold">
                                                                        {Math.floor((field.value || 0) / 5)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                </FormItem>
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="border-slate-800 bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white transition-all font-bold px-8 h-11"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-amber-600 hover:bg-amber-700 text-white min-w-[160px] font-bold h-11 shadow-lg shadow-amber-900/20"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isEditing ? "Salvar Alterações" : "Consagrar Herói")}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
