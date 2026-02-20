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

const CLIMATES = [
    { value: "aconchegante", label: "Aconchegante" },
    { value: "sombrio", label: "Sombrio" },
    { value: "nebuloso", label: "Nebuloso" },
    { value: "denso", label: "Denso" },
    { value: "arido", label: "Árido" },
    { value: "gelido", label: "Gélido" },
]

const DANGER_LEVELS = [
    { value: "baixo", label: "Baixo" },
    { value: "medio", label: "Médio" },
    { value: "alto", label: "Alto" },
    { value: "extremo", label: "Extremo" },
]

const LOCATION_TYPES = [
    { value: "city", label: "Cidade / Vila" },
    { value: "dungeon", label: "Masmorra / Dungeon" },
    { value: "wilderness", label: "Região Selvagem" },
    { value: "building", label: "Construção / Edifício" },
    { value: "plane", label: "Plano de Existência" },
]

interface LocationFormValues {
    name: string
    description: string
    type: "city" | "dungeon" | "wilderness" | "building" | "plane"
    climate?: string
    dangerLevel: string
    dangerLevelNum: number
    capacity?: string
    government?: string
    image_url?: string
    notes?: string
}

const locationSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
    type: z.enum(["city", "dungeon", "wilderness", "building", "plane"]),
    climate: z.string().optional(),
    dangerLevel: z.string().min(1, "Selecione um nível de perigo."),
    dangerLevelNum: z.number().min(0).max(10),
    capacity: z.string().optional(),
    government: z.string().optional(),
    image_url: z.string().optional(),
    notes: z.string().optional(),
})

interface LocationFormDialogProps {
    campaignId: string
    onLocationCreated?: (location: LocationFormValues & { campaignId?: string }) => void
}

export function LocationFormDialog({ campaignId, onLocationCreated }: LocationFormDialogProps) {
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

    const form = useForm<LocationFormValues>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            name: "",
            description: "",
            type: "city",
            climate: "",
            dangerLevel: "",
            dangerLevelNum: 0,
            capacity: "",
            government: "",
            image_url: "",
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

    async function onSubmit(data: LocationFormValues) {
        if (!userId) {
            toast({
                title: "Erro de Autenticação",
                description: "Você precisa estar logado para criar um local.",
                variant: "destructive"
            })
            return
        }

        setIsLoading(true)
        try {
            const locationData = {
                name: data.name,
                description: data.description,
                image_url: data.image_url,
                owner_id: userId,
                campaign_id: campaignId,
                stats: {
                    type: data.type,
                    climate: data.climate,
                    danger_level: data.dangerLevel,
                    danger_level_num: data.dangerLevelNum,
                    capacity: data.capacity,
                    government: data.government,
                    notes: data.notes
                },
                is_visible: true
            }

            const { error } = await supabase
                .from('locations')
                .insert([locationData])

            if (error) throw error

            toast({
                title: "Local criado!",
                description: `${data.name} agora faz parte do seu mundo.`,
            })

            onLocationCreated?.(data)
            setOpen(false)
            form.reset()
            setImagePreview(null)
        } catch (error: any) {
            toast({
                title: "Erro ao criar local",
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
                    <span className="font-bold">Criar Nova Localidade</span>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif text-amber-500">Nova Localidade</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Crie uma nova localidade para sua campanha ou adicione à biblioteca global.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Nome da Localidade *</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: Taverna do Bode Manco"
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
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Tipo de Local *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-slate-700 focus:ring-amber-500">
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800">
                                                {LOCATION_TYPES.map((type) => (
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
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Descrição *</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Descreva a localidade, sua aparência, história e importância..."
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
                            <Label className="text-slate-300">Imagem da Localidade</Label>
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
                                name="climate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Clima</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: Ártico, Tropical..."
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
                                name="dangerLevel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Nível de Perigo (Geral) *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-slate-950/50 border-slate-700 focus:ring-amber-500">
                                                    <SelectValue placeholder="Selecione o perigo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800">
                                                {DANGER_LEVELS.map((level) => (
                                                    <SelectItem
                                                        key={level.value}
                                                        value={level.value}
                                                        className="text-slate-100 focus:bg-slate-800 focus:text-amber-500"
                                                    >
                                                        {level.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="government"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Governo</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: Monarquia, Anarquia..."
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
                                name="capacity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">População / Capacidade</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: ~500 habitantes"
                                                {...field}
                                                className="bg-slate-950/50 border-slate-700 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="dangerLevelNum"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center mb-1">
                                        <FormLabel className="text-slate-300">Nível de Ameaça (0-10)</FormLabel>
                                        <span className="text-amber-500 font-bold">{field.value}</span>
                                    </div>
                                    <FormControl>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="1"
                                            {...field}
                                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-slate-500 text-[10px]">
                                        Use este valor para calcular encontros aleatórios ou dificuldade geral da área.
                                    </FormDescription>
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
                                            placeholder="Informações extras, segredos, NPCs importantes..."
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
                                className="border-slate-700 text-slate-300 cursor-pointer bg-slate-900 hover:text-slate-400 hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="bg-amber-600 hover:bg-amber-700 cursor-pointer text-white min-w-[140px]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="mr-2 h-4 w-4" />
                                )}
                                {isLoading ? 'Criando...' : 'Criar Localidade'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
