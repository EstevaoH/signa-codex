"use client"

import { Scroll, Loader2, ArrowLeft, Mail, AlertCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const forgotPasswordSchema = z.object({
    email: z.email({ message: "Insira um e-mail válido para o corvo encontrar." }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(data: ForgotPasswordFormValues) {
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${location.origin}/auth/callback?next=/auth/update-password`,
            })

            if (error) {
                throw error
            }

            setIsSuccess(true)
        } catch (error: any) {
            setError(error.message || "Erro ao enviar e-mail de recuperação. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100 backdrop-blur-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-600/20 border border-amber-600/50 shadow-[0_0_15px_rgba(217,119,6,0.2)]">
                        <Mail className="h-8 w-8 text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl font-serif text-slate-100">
                        Recuperar Senha
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Enviaremos um pergaminho mágico para você redefinir seu acesso.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {isSuccess ? (
                        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 text-center">
                            <h3 className="text-green-500 font-bold mb-2">E-mail Enviado!</h3>
                            <p className="text-sm text-slate-300 mb-4">
                                Verifique sua caixa de entrada (e spam). O link de recuperação expira em breve.
                            </p>
                            <Button asChild variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300">
                                <Link href="/login">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Login
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800 text-red-200">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Erro</AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-300">E-mail Cadastrado</FormLabel>
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

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                Enviar Link de Recuperação
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </>
                    )}
                </CardContent>

                {!isSuccess && (
                    <CardFooter className="flex justify-center pb-6">
                        <Link
                            href="/login"
                            className="text-sm text-slate-500 hover:text-amber-500 transition-colors flex items-center"
                        >
                            <ArrowLeft className="mr-1 h-3 w-3" /> Voltar para o Login
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}
