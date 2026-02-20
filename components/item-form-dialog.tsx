"use client"

import { useState, useRef, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Plus, Upload, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
    Form,
    FormControl,
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const ITEM_TYPES = [
    { value: "arma", label: "Arma" },
    { value: "armadura", label: "Armadura" },
    { value: "pocao", label: "Poção" },
    { value: "pergaminho", label: "Pergaminho" },
    { value: "anel", label: "Anel" },
    { value: "amuleto", label: "Amuleto" },
    { value: "varinha", label: "Varinha" },
    { value: "cajado", label: "Cajado" },
    { value: "ferramenta", label: "Ferramenta" },
    { value: "consumivel", label: "Consumível" },
    { value: "tesouro", label: "Tesouro" },
    { value: "outro", label: "Outro" },
]

const RARITY_LEVELS = [
    { value: "common", label: "Comum" },
    { value: "uncommon", label: "Incomum" },
    { value: "rare", label: "Raro" },
    { value: "very_rare", label: "Muito Raro" },
    { value: "legendary", label: "Lendário" },
    { value: "artifact", label: "Artefato" },
]

const itemSchema = z.object({
    name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres."),
    description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
    type: z.string().min(1, "Selecione um tipo."),
    rarity: z.enum(["common", "uncommon", "rare", "very_rare", "legendary", "artifact"]),
    properties: z.string().optional(),
    image_url: z.string().optional(),
    notes: z.string().optional(),
    weight: z.number().nonnegative().optional(),
    value: z.number().nonnegative().optional(),
    requirements: z.object({
        strength: z.number().optional(),
        level: z.number().optional()
    }).optional(),
    damage: z.string().optional(),
    defense_bonus: z.number().optional(),
})

type ItemFormValues = z.infer<typeof itemSchema>

interface ItemFormDialogProps {
    campaignId: string
    onItemCreated?: (item: ItemFormValues & { campaignId?: string }) => void
}

export function ItemFormDialog({ campaignId, onItemCreated }: ItemFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    useEffect(() => {
        const getUserId = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)
        }
        getUserId()
    }, [])

    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            name: "",
            description: "",
            type: "",
            rarity: "common",
            properties: "",
            image_url: "",
            notes: "",
            weight: 0,
            value: 0,
            damage: "",
            defense_bonus: 0,
            requirements: {
                strength: 0,
                level: 1
            }
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

    async function onSubmit(data: ItemFormValues) {
        if (!userId) {
            toast({
                title: "Erro",
                description: "Você precisa estar logado para criar um item.",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)

        try {
            const itemData = {
                name: data.name,
                rarity: data.rarity,
                type: data.type,
                description: data.description,
                properties: {
                    effect: data.properties,
                    weight: data.weight,
                    value: data.value,
                    damage: data.damage,
                    defense_bonus: data.defense_bonus,
                    requirements: data.requirements
                },
                image_url: data.image_url,
                owner_id: userId,
                campaign_id: campaignId,
                notes: data.notes
            }

            const { data: newItem, error } = await supabase
                .from('items')
                .insert(itemData)
                .select()
                .single()

            if (error) throw error

            toast({
                title: "Sucesso!",
                description: "Item criado com sucesso.",
            })

            if (onItemCreated) {
                onItemCreated(newItem)
            }

            form.reset()
            setImagePreview(null)
            setOpen(false)
        } catch (error: any) {
            console.error("Erro ao criar item:", error)
            toast({
                title: "Erro",
                description: error.message || "Não foi possível criar o item.",
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
                    <span className="font-bold">Criar Novo Item</span>
                </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-serif text-amber-500">Novo Item</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Crie um novo item para sua campanha ou adicione à biblioteca global.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Nome do Item *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Ex: Espada Flamejante"
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
                                            placeholder="Descreva a aparência, história e características do item..."
                                            {...field}
                                            className="bg-slate-950/50 border-slate-700 focus:ring-amber-500 min-h-[100px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <Label className="text-slate-300">Imagem do Item</Label>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Tipo *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-slate-950/50 border-slate-700 focus:ring-amber-500">
                                                    <SelectValue placeholder="Selecione o tipo" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800">
                                                {ITEM_TYPES.map((type) => (
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
                                name="rarity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Raridade *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full bg-slate-950/50 border-slate-700 focus:ring-amber-500">
                                                    <SelectValue placeholder="Selecione a raridade" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-slate-900 border-slate-800">
                                                {RARITY_LEVELS.map((rarity) => (
                                                    <SelectItem
                                                        key={rarity.value}
                                                        value={rarity.value}
                                                        className="text-slate-100 focus:bg-slate-800 focus:text-amber-500"
                                                    >
                                                        {rarity.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4 p-4 rounded-lg bg-slate-950/20 border border-slate-800/50">
                                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Economia & Carga</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="weight"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300 text-xs">Peso (kg)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                        className="bg-slate-950/50 border-slate-700 h-9"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300 text-xs">Valor (PO)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                        className="bg-slate-950/50 border-slate-700 h-9"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 rounded-lg bg-slate-950/20 border border-slate-800/50">
                                <h4 className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2">Atributos de Combate</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="damage"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300 text-xs">Dano / Efeito</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: 1d8 + 2" {...field} className="bg-slate-950/50 border-slate-700 h-9" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="defense_bonus"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300 text-xs">Bônus de Defesa (+)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={e => field.onChange(Number(e.target.value))}
                                                        className="bg-slate-950/50 border-slate-700 h-9"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-slate-950/30 border border-slate-800">
                            <FormField
                                control={form.control}
                                name="requirements.level"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 text-xs uppercase font-bold">Nível Mínimo</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                className="bg-slate-950 border-slate-800 h-8"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="requirements.strength"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-400 text-xs uppercase font-bold">Força Mínima</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={e => field.onChange(Number(e.target.value))}
                                                className="bg-slate-950 border-slate-800 h-8"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="properties"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300">Propriedades Mágicas</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Liste as propriedades mágicas, efeitos especiais e bônus..."
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
                                            placeholder="Informações extras, requisitos, valor estimado..."
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
                                disabled={isLoading}
                                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-amber-600 hover:bg-amber-700 text-white min-w-[120px]"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Criar Item
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
