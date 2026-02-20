"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Upload, X, Loader2 } from "lucide-react"

import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const MONSTER_TYPES = [
    { value: "aberracao", label: "Aberração" },
    { value: "besta", label: "Besta" },
    { value: "celestial", label: "Celestial" },
    { value: "construto", label: "Construto" },
    { value: "dragao", label: "Dragão" },
    { value: "elemental", label: "Elemental" },
    { value: "fada", label: "Fada" },
    { value: "demonio", label: "Demônio" },
    { value: "gigante", label: "Gigante" },
    { value: "humanoide", label: "Humanoide" },
    { value: "monstruosidade", label: "Monstruosidade" },
    { value: "morto-vivo", label: "Morto-Vivo" },
    { value: "planta", label: "Planta" },
    { value: "vaso", label: "Vaso" },
]

const monsterSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    type: z.string().min(1, "Selecione um tipo."),
    challenge_rating: z.string().min(1, "Informe o CR (Challenge Rating)."),
    description: z.string().min(1, "Informe a descrição."),
    stats: z.object({
        hit_points: z.string().min(1, "Informe os pontos de vida."),
        armor_class: z.string().min(1, "Informe a classe de armadura."),
        speed: z.string().optional(),
        attributes: z.object({
            strength: z.number().default(10).optional(),
            dexterity: z.number().default(10).optional(),
            constitution: z.number().default(10).optional(),
            intelligence: z.number().default(10).optional(),
            wisdom: z.number().default(10).optional(),
            charisma: z.number().default(10).optional(),
        }).optional(),
    }),
    actions: z.string().optional(),
    image_url: z.string().optional(),
    notes: z.string().optional(),
})

type MonsterFormValues = z.infer<typeof monsterSchema>

interface MonsterFormDialogProps {
    campaignId: string
    onMonsterCreated?: (monster: MonsterFormValues & { campaignId?: string }) => void
}

export function MonsterFormDialog({ campaignId, onMonsterCreated }: MonsterFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<MonsterFormValues>({
        resolver: zodResolver(monsterSchema),
        defaultValues: {
            name: "",
            type: "",
            challenge_rating: "",
            description: "",
            stats: {
                hit_points: "",
                armor_class: "",
                speed: "",
                attributes: {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10,
                },
            },
            actions: "",
            image_url: "",
            notes: "",
        },
    })

    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    // Fetch user on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id || null)
        })
    }, [])

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64String = reader.result as string
                setImagePreview(base64String)
                form.setValue("image_url", base64String)
            }
            reader.readAsDataURL(file)
        }
    }

    function removeImage() {
        setImagePreview(null)
        form.setValue("image_url", "")
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    async function onSubmit(data: MonsterFormValues) {
        if (!userId) {
            toast({
                title: "Erro de permissão",
                description: "Você precisa estar logado para criar monstros.",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            const monsterData = {
                name: data.name,
                type: data.type,
                challenge_rating: data.challenge_rating,
                stats: {
                    ...data.stats,
                    description: data.description, // Store description in JSONB for now
                    status: 'alive',
                },
                actions: data.actions ? [{ name: "Standard", description: data.actions }] : [],
                image_url: data.image_url,
                notes: data.notes,
                owner_id: userId,
            }

            // 1. Create Monster
            const { data: createdMonster, error: monsterError } = await supabase
                .from('monsters')
                .insert(monsterData)
                .select()
                .single()

            if (monsterError) throw monsterError

            // 2. Link to Campaign (if campaignId is present)
            if (campaignId && createdMonster) {
                const { error: linkError } = await supabase
                    .from('campaign_monsters')
                    .insert({
                        campaign_id: campaignId,
                        monster_id: createdMonster.id,
                        is_visible: true
                    })

                if (linkError) {
                    console.error("Erro ao vincular monstro à campanha:", linkError)
                }
            }

            toast({
                title: "Monstro criado com sucesso!",
                description: `${data.name} foi adicionado ao bestiário e à campanha.`,
                variant: "default",
            })

            console.log("👹 Novo Monstro Criado:", createdMonster)

            if (onMonsterCreated) {
                onMonsterCreated({ ...data, campaignId })
            }

            form.reset()
            setImagePreview(null)
            setOpen(false)
        } catch (error: any) {
            console.error("Erro ao criar monstro:", error)
            toast({
                title: "Erro ao criar monstro",
                description: error.message || "Ocorreu um erro ao tentar salvar no bestiário.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="border-2 border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500/50 hover:text-amber-500 transition-all">
                    <Plus className="h-10 w-10 mb-2" />
                    <span className="font-bold">Criar Nova Criatura</span>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif text-amber-500">Novo Monstro</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Crie um novo monstro para sua campanha ou adicione à biblioteca global.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Nome do Monstro *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Dragão de Lápis-Lazúli"
                                            {...field}
                                            className="bg-slate-950/50 border-slate-700 focus:ring-amber-500"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Descrição *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descreva a aparência, comportamento e características do monstro..."
                                            {...field}
                                            className="bg-slate-950/50 border-slate-700 focus:ring-amber-500 min-h-[100px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Image Upload Field */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Imagem do Monstro</Label>
                            <div className="flex flex-col gap-4">
                                {imagePreview ? (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-slate-700">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                                        >
                                            <X className="h-4 w-4 text-white" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-amber-500/50 transition-colors bg-slate-950/30">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="h-10 w-10 text-slate-500 mb-2" />
                                            <p className="text-sm text-slate-400 mb-1">
                                                <span className="font-semibold">Clique para fazer upload</span> ou arraste e solte
                                            </p>
                                            <p className="text-xs text-slate-500">PNG, JPG ou WEBP (MAX. 5MB)</p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Tipo *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-slate-700 focus:ring-amber-500">
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800">
                                                {MONSTER_TYPES.map((type) => (
                                                    <SelectItem
                                                        key={type.value}
                                                        value={type.value}
                                                        className="text-slate-100 focus:bg-slate-800 focus:text-amber-500"
                                                    >
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="challenge_rating"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">CR (Challenge Rating) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: 14"
                                                {...field}
                                                className="bg-slate-950/50 border-slate-700 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="stats.hit_points"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">HP (Pontos de Vida) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: 250"
                                                {...field}
                                                className="bg-slate-950/50 border-slate-700 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="stats.armor_class"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">AC (Classe de Armadura) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: 18"
                                                {...field}
                                                className="bg-slate-950/50 border-slate-700 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="stats.speed"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Deslocamento</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: 9m, Voo 18m"
                                                {...field}
                                                className="bg-slate-950/50 border-slate-700 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-4 border border-slate-800 rounded-lg p-4 bg-slate-950/30">
                            <Label className="text-amber-500 font-serif text-lg">Atributos</Label>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map((attr) => (
                                    <FormField
                                        key={attr}
                                        control={form.control}
                                        name={`stats.attributes.${attr}` as any}
                                        render={({ field }) => (
                                            <FormItem className="text-center">
                                                <FormLabel className="text-xs text-slate-400 uppercase font-bold">
                                                    {attr.substring(0, 3)}
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        value={field.value ?? 10}
                                                        onChange={e => field.onChange(parseInt(e.target.value))}
                                                        className="bg-slate-900 border-slate-700 text-center focus:ring-amber-500 h-12 text-lg font-bold text-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="actions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Habilidades Especiais</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Liste as habilidades especiais, ataques e características únicas..."
                                            {...field}
                                            className="bg-slate-950/50 border-slate-700 focus:ring-amber-500 min-h-[80px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Notas Adicionais</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Informações extras, fraquezas, habitat, comportamento..."
                                            {...field}
                                            className="bg-slate-950/50 border-slate-700 focus:ring-amber-500 min-h-[80px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                className="border-slate-700 bg-slate-950/50 text-slate-300 cursor-pointer hover:bg-slate-800 hover:text-slate-300"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-amber-600 cursor-pointer hover:bg-amber-700 text-white"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Criar Monstro
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    )
}
