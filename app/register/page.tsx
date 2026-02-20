"use client"

"use client"

import { Dice5, Scroll, Loader2, AlertCircle, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
    validatePasswordStrength,
    getPasswordStrengthLabel,
    getPasswordStrengthColor,
} from "@/lib/password-strength"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

const registerSchema = z.object({
    userName: z.string().min(3, { message: "Seu nome de herói deve ter pelo menos 3 letras." }),
    fullName: z.string().min(3, { message: "Seu nome deve ter pelo menos 3 letras." }),
    email: z.email({ message: "O corvo precisa de um endereço válido." }),
    password: z.string().min(6, { message: "Sua senha deve ser forte (mínimo 6 caracteres)." }),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
}).refine(
    (data) => {
        const strength = validatePasswordStrength(data.password)
        return strength.isValid
    },
    {
        message: "Senha não atende aos requisitos de segurança",
        path: ["password"],
    }
)

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            fullName: "",
            userName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const password = form.watch("password")
    const passwordStrength = password ? validatePasswordStrength(password) : null



    async function onSubmit(data: RegisterFormValues) {
        setIsLoading(true)
        setError(null)

        try {
            const { error: authError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                    data: {
                        full_name: data.fullName,
                        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${data.fullName}`,
                        username: data.userName,
                    },
                },
            })

            if (authError) {
                throw authError
            }

            setIsSuccess(true)
        } catch (error: any) {
            setError(error.message || "Erro ao criar conta. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans">
                <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100 backdrop-blur-md shadow-2xl">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-900/50 border border-green-800 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                            <ShieldCheck className="h-8 w-8 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-serif text-green-500">
                            Registro Concluído!
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Um corvo foi enviado para <strong>{form.getValues("email")}</strong> com instruções para confirmar sua conta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-sm text-slate-400">
                            <p>Verifique sua caixa de entrada (e spam) e clique no link para ativar seu acesso ao grimório.</p>
                        </div>
                        <Button
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                            onClick={() => router.push("/login")}
                        >
                            Voltar para o Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100 backdrop-blur-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.4)]">
                        <Scroll className="h-10 w-10 text-slate-900" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight text-amber-500 uppercase italic">
                        Novo Aventureiro
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Inscreva-se na guilda para começar sua jornada.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro no Registro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="userName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Nome do Personagem</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: Aragorn II"
                                                {...field}
                                                className="bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Seu nome</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Ex: Aragorn II"
                                                {...field}
                                                className="bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />


                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">E-mail</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="nome@reino.com"
                                                {...field}
                                                className="bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Senha</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••"
                                                {...field}
                                                className="bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        {password && passwordStrength && (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-zinc-400">Força da senha:</span>
                                                    <span
                                                        className={cn(
                                                            "font-medium",
                                                            passwordStrength.score >= 3
                                                                ? "text-green-500"
                                                                : passwordStrength.score >= 2
                                                                    ? "text-yellow-500"
                                                                    : "text-red-500"
                                                        )}
                                                    >
                                                        {getPasswordStrengthLabel(passwordStrength.score)}
                                                    </span>
                                                </div>
                                                <div className="flex gap-1">
                                                    {[0, 1, 2, 3].map((index) => (
                                                        <div
                                                            key={index}
                                                            className={cn(
                                                                "h-1 flex-1 rounded-full transition-colors",
                                                                index < passwordStrength.score
                                                                    ? getPasswordStrengthColor(passwordStrength.score)
                                                                    : "bg-zinc-800"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                {passwordStrength.feedback.length > 0 && (
                                                    <div className="bg-slate-800 border border-slate-700 focus:border-amber-500 focus:ring-amber-500 rounded-lg p-2 space-y-1">
                                                        <p className="text-xs font-medium text-zinc-400">Requisitos:</p>
                                                        {passwordStrength.feedback.map((item, index) => (
                                                            <div key={index} className="flex items-start gap-2 text-xs">
                                                                <span className="text-red-500 mt-0.5">•</span>
                                                                <span className="text-zinc-400">{item}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Confirmar Senha</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••"
                                                {...field}
                                                className="bg-slate-800 border-slate-700 focus:border-amber-500 focus:ring-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-red-400" />
                                    </FormItem>
                                )}
                            />

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 mt-4"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando Ficha...
                                    </>
                                ) : (
                                    <>
                                        <Dice5 className="mr-2 h-4 w-4" /> Registrar-se
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>

                <CardFooter className="flex justify-center pb-8">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">
                        Já possui um passe?
                        <a href="/login" className="ml-1 text-amber-500 hover:text-amber-400 font-bold transition-colors">Entrar</a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}