"use client"

import { LockKeyhole, Loader2, AlertCircle, Save } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    validatePasswordStrength,
    getPasswordStrengthLabel,
    getPasswordStrengthColor
} from "@/lib/password-strength"
import { cn } from "@/lib/utils"

const updatePasswordSchema = z.object({
    password: z.string().min(6, { message: "Sua nova senha deve ter pelo menos 6 caracteres." }),
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

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>

export default function UpdatePasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const form = useForm<UpdatePasswordFormValues>({
        resolver: zodResolver(updatePasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    const password = form.watch("password")
    const passwordStrength = password ? validatePasswordStrength(password) : null

    async function onSubmit(data: UpdatePasswordFormValues) {
        setIsLoading(true)
        setError(null)

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.password
            })

            if (updateError) {
                throw updateError
            }

            // Redireciona para login ou dashboard com mensagem de sucesso
            router.push("/dashboard?message=password-updated")
        } catch (error: any) {
            setError(error.message || "Erro ao atualizar senha. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900/80 text-slate-100 backdrop-blur-md shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-600/20 border border-amber-600/50 shadow-[0_0_15px_rgba(217,119,6,0.2)]">
                        <LockKeyhole className="h-8 w-8 text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl font-serif text-slate-100">
                        Nova Senha
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Defina uma nova senha para proteger seu grimório.
                    </CardDescription>
                </CardHeader>

                <CardContent>
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Nova Senha</FormLabel>
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
                                        <FormLabel className="text-slate-300">Confirmar Nova Senha</FormLabel>
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
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Atualizar Senha
                                    </>
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
