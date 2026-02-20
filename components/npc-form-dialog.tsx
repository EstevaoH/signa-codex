"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Upload, X, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"

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

const NPC_RACES = [
    { value: "humano", label: "Humano" },
    { value: "elfo", label: "Elfo" },
    { value: "anao", label: "Anão" },
    { value: "halfling", label: "Halfling" },
    { value: "orc", label: "Orc" },
    { value: "meio-elfo", label: "Meio-Elfo" },
    { value: "meio-orc", label: "Meio-Orc" },
    { value: "tiefling", label: "Tiefling" },
    { value: "draconato", label: "Draconato" },
    { value: "gnomo", label: "Gnomo" },
    { value: "outro", label: "Outro" },
]

const NPC_CLASSES = [
    { value: "guerreiro", label: "Guerreiro" },
    { value: "mago", label: "Mago" },
    { value: "clerigo", label: "Clérigo" },
    { value: "ladino", label: "Ladino" },
    { value: "paladino", label: "Paladino" },
    { value: "ranger", label: "Ranger" },
    { value: "barbaro", label: "Bárbaro" },
    { value: "bardo", label: "Bardo" },
    { value: "druida", label: "Druida" },
    { value: "feiticeiro", label: "Feiticeiro" },
    { value: "monge", label: "Monge" },
    { value: "bruxo", label: "Bruxo" },
    { value: "plebeu", label: "Plebeu" },
    { value: "nobre", label: "Nobre" },
    { value: "mercador", label: "Mercador" },
    { value: "outro", label: "Outro" },
]

const ALIGNMENTS = [
    { value: "leal-bom", label: "Leal e Bom" },
    { value: "neutro-bom", label: "Neutro e Bom" },
    { value: "caotico-bom", label: "Caótico e Bom" },
    { value: "leal-neutro", label: "Leal e Neutro" },
    { value: "neutro", label: "Neutro" },
    { value: "caotico-neutro", label: "Caótico e Neutro" },
    { value: "leal-mau", label: "Leal e Mau" },
    { value: "neutro-mau", label: "Neutro e Mau" },
    { value: "caotico-mau", label: "Caótico e Mau" },
]

const npcSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
    race: z.string().min(1, "Selecione uma raça."),
    class: z.string().min(1, "Selecione uma classe."),
    alignment: z.string().min(1, "Selecione um alinhamento."),
    personality: z.string().optional(),
    image: z.string().optional(),
    notes: z.string().optional(),
})

type NpcFormValues = z.infer<typeof npcSchema>

interface NpcFormDialogProps {
    campaignId: string
    onNpcCreated?: (npc: NpcFormValues & { campaignId?: string }) => void
}

export function NpcFormDialog({ campaignId, onNpcCreated }: NpcFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const { toast } = useToast()
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)
        }
        getUserId()
    }, [])

    const form = useForm<NpcFormValues>({
        resolver: zodResolver(npcSchema),
        defaultValues: {
            name: "",
            description: "",
            race: "",
            class: "",
            alignment: "",
            personality: "",
            image: "",
            notes: "",
        },
    })

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

    async function onSubmit(data: NpcFormValues) {
        if (!userId) {
            toast({
                title: "Erro de autenticação",
                description: "Você precisa estar logado para criar um NPC.",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            // Inserir no Banco
            const npcData = {
                name: data.name,
                description: data.description,
                race: data.race,
                occupation: data.class,
                alignment: data.alignment,
                image_url: data.image || null,
                owner_id: userId,
                campaign_id: campaignId,
                is_visible: true,
                stats: {
                    personality: data.personality,
                    notes: data.notes,
                }
            }

            const { error } = await supabase
                .from('npcs')
                .insert([npcData])

            if (error) throw error

            toast({
                title: "NPC criado!",
                description: `${data.name} foi adicionado à sua campanha.`,
            })

            if (onNpcCreated) {
                onNpcCreated(data)
            }

            form.reset()
            setImagePreview(null)
            setOpen(false)
        } catch (error: any) {
            toast({
                title: "Erro ao criar NPC",
                description: error.message,
                variant: "destructive"
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
                    <span className="font-bold">Criar Novo NPC</span>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif text-amber-500">Novo NPC</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Crie um novo personagem não-jogador para sua campanha ou adicione à biblioteca global.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Nome do NPC *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Elara Moonwhisper"
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
                                            placeholder="Descreva a aparência, história e papel do NPC na campanha..."
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
                            <Label className="text-slate-300">Imagem do NPC</Label>
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
                                name="race"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Raça *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-slate-700 focus:ring-amber-500">
                                                    <SelectValue placeholder="Selecione a raça" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800">
                                                {NPC_RACES.map((race) => (
                                                    <SelectItem
                                                        key={race.value}
                                                        value={race.value}
                                                        className="text-slate-100 focus:bg-slate-800 focus:text-amber-500"
                                                    >
                                                        {race.label}
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
                                name="class"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Classe *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-slate-700 focus:ring-amber-500">
                                                    <SelectValue placeholder="Selecione a classe" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800">
                                                {NPC_CLASSES.map((npcClass) => (
                                                    <SelectItem
                                                        key={npcClass.value}
                                                        value={npcClass.value}
                                                        className="text-slate-100 focus:bg-slate-800 focus:text-amber-500"
                                                    >
                                                        {npcClass.label}
                                                    </SelectItem>
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
                            name="alignment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Alinhamento *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-slate-950/50 border-slate-700 focus:ring-amber-500">
                                                <SelectValue placeholder="Selecione o alinhamento" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-slate-900 border-slate-800">
                                            {ALIGNMENTS.map((alignment) => (
                                                <SelectItem
                                                    key={alignment.value}
                                                    value={alignment.value}
                                                    className="text-slate-100 focus:bg-slate-800 focus:text-amber-500"
                                                >
                                                    {alignment.label}
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
                            name="personality"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Traços de Personalidade</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descreva a personalidade, motivações, medos e objetivos do NPC..."
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
                                            placeholder="Informações extras, segredos, relações com outros NPCs..."
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
                                className="border-slate-700 bg-slate-950/50  text-slate-300 cursor-pointer hover:text-slate-100 hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-amber-600 cursor-pointer hover:bg-amber-700 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Criar NPC
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
