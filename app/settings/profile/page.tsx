"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
    User,
    AtSign,
    Image as ImageIcon,
    Save,
    ArrowLeft,
    Loader2,
    Shield,
    Camera
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const profileSchema = z.object({
    username: z.string().min(3, "O nome de usuário deve ter pelo menos 3 caracteres"),
    full_name: z.string().min(3, "O nome completo deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido").optional(),
    avatar_url: z.string().url("URL de avatar inválida").or(z.literal("")),
    banner_url: z.string().url("URL de banner inválida").or(z.literal("")),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfileSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const { toast } = useToast()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: "",
            full_name: "",
            email: "",
            avatar_url: "",
            banner_url: "",
        },
    })

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push("/login")
                return
            }
            setUser(user)

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile) {
                form.reset({
                    username: profile.username || "",
                    full_name: profile.full_name || "",
                    email: user.email || "",
                    avatar_url: profile.avatar_url || "",
                    banner_url: profile.banner_url || "",
                })
            }
            setIsLoading(false)
        }

        fetchProfile()
    }, [router, form])

    async function onSubmit(values: ProfileFormValues) {
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    username: values.username,
                    full_name: values.full_name,
                    avatar_url: values.avatar_url,
                    banner_url: values.banner_url,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (error) throw error

            // Update auth metadata as well for consistency
            await supabase.auth.updateUser({
                data: {
                    full_name: values.full_name,
                    avatar_url: values.avatar_url
                }
            })

            toast({
                title: "Perfil atualizado!",
                description: "Suas informações foram salvas com sucesso.",
            })
        } catch (error: any) {
            toast({
                title: "Erro ao salvar",
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
            <div className="container mx-auto max-w-2xl">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-amber-500 transition-colors mb-8 group">
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Voltar ao Dashboard</span>
                </Link>

                <div className="mb-8">
                    <h1 className="text-4xl font-serif text-amber-500 italic flex items-center gap-3">
                        <Shield className="h-10 w-10" /> Meus Dados
                    </h1>
                    <p className="text-slate-400 mt-2 text-lg">Atualize sua identidade na guilda.</p>
                </div>

                <Card className="bg-slate-900 border-slate-800 shadow-2xl overflow-hidden">
                    <div className="h-40 relative overflow-hidden bg-slate-800">
                        {form.watch("banner_url") ? (
                            <img
                                src={form.watch("banner_url")}
                                alt="Banner"
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-r from-amber-600/20 to-slate-800" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
                    </div>
                    <div className="px-6 -mt-12 mb-6">
                        <div className="relative inline-block">
                            <Avatar className="h-24 w-24 border-4 border-slate-900 shadow-xl">
                                <AvatarImage src={form.watch("avatar_url")} />
                                <AvatarFallback className="bg-slate-800 text-amber-500 text-2xl font-serif">
                                    {form.watch("full_name")?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 bg-amber-600 p-1.5 rounded-full border-2 border-slate-900 shadow-lg cursor-pointer hover:bg-amber-700 transition-colors">
                                <Camera className="h-4 w-4 text-white" />
                            </div>
                        </div>
                    </div>

                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="full_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                                                    <User className="h-3 w-3 text-amber-500" /> Nome de Batismo
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Seu nome real"
                                                        {...field}
                                                        className="bg-slate-950 border-slate-800 focus:border-amber-500 h-11 text-slate-100"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500 text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                                                    <AtSign className="h-3 w-3 text-amber-500" /> Correio Eletrônico (E-mail)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        readOnly
                                                        className="bg-slate-950/50 border-slate-800 focus:border-slate-800 h-11 text-slate-500 cursor-not-allowed opacity-70"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[9px] text-slate-600">
                                                    Identificador único da sua conta. Não pode ser alterado por aqui.
                                                </FormDescription>
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="username"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                                                    <AtSign className="h-3 w-3 text-amber-500" /> Nome de Herói (User)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="ex: aragorn_99"
                                                        {...field}
                                                        className="bg-slate-950 border-slate-800 focus:border-amber-500 h-11 text-slate-100"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500 text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="avatar_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                                                    <ImageIcon className="h-3 w-3 text-amber-500" /> URL do Retrato (Avatar)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://..."
                                                        {...field}
                                                        className="bg-slate-950 border-slate-800 focus:border-amber-500 h-11 text-slate-100"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500 text-[10px]" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="banner_url"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                                                    <ImageIcon className="h-3 w-3 text-amber-500" /> URL do Estandarte (Banner)
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="https://..."
                                                        {...field}
                                                        className="bg-slate-950 border-slate-800 focus:border-amber-500 h-11 text-slate-100"
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-[10px] text-slate-500 italic">
                                                    Personalize o topo do seu perfil com uma imagem épica.
                                                </FormDescription>
                                                <FormMessage className="text-red-500 text-[10px]" />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-800 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 px-8 cursor-pointer transition-all shadow-lg shadow-amber-900/20"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        Salvar Alterações
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <div className="mt-8 bg-slate-900/40 p-6 rounded-xl border border-slate-800 text-center">
                    <p className="text-slate-500 text-sm italic">"Uma identidade forte é o primeiro passo para se tornar uma lenda."</p>
                </div>
            </div>
        </div>
    )
}
