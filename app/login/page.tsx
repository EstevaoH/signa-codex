"use client"

import { Dice5, Sword, Loader2, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const loginSchema = z.object({
    email: z.email({ message: "O corvo se perdeu! Insira um e-mail válido." }),
    password: z.string().min(6, { message: "Sua senha de guilda deve ter pelo menos 6 caracteres." }),
})

type LoginFormValues = z.infer<typeof loginSchema>


export default function RPGLoginPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // 1. Inicializar o formulário
    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    // 2. Handler de submissão
    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true)
        setError(null)

        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })
            console.log(authError)

            if (authError) {
                throw authError
            }

            router.push("/dashboard")
        } catch (error: any) {
            console.error("Erro de login:", error)
            let errorMessage = "Falha ao entrar na taverna. Verifique suas credenciais."

            if (error.message.includes("Email not confirmed")) {
                errorMessage = "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada (e spam)."
            } else if (error.message.includes("Invalid login credentials")) {
                errorMessage = "E-mail ou senha incorretos. O guardião não reconhece você."
            }

            setError(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100 backdrop-blur-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                        <Dice5 className="h-10 w-10 text-slate-900" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight text-amber-500 uppercase italic">
                        Grimório de Login
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Identifique-se para acessar suas fichas e campanhas.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-red-200">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro de Autenticação</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">E-mail do Herói</FormLabel>
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
                                        <FormLabel className="text-slate-300">Senha Secreta</FormLabel>
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
                                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Conjurando Acesso...
                                    </>
                                ) : (
                                    <>
                                        <Sword className="mr-2 h-4 w-4" /> Entrar na Taverna
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>

                <CardFooter className="flex flex-col gap-2 pb-8 text-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">
                        Esqueceu a chave do calabouço?
                        <a href="/forgot-password" className="ml-1 text-amber-500 hover:text-amber-400 font-bold transition-colors">Recuperar</a>
                    </p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">
                        Ainda não é membro da taverna?
                        <a href="/register" className="ml-1 text-amber-500 hover:text-amber-400 font-bold transition-colors">Cadastrar-se</a>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}