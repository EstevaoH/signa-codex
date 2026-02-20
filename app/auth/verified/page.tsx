"use client"

import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import confetti from "canvas-confetti"
import { useEffect } from "react"

export default function VerifiedPage() {
    useEffect(() => {
        const duration = 3 * 1000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            })
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            })
        }, 250)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Card className="max-w-md w-full bg-slate-900 border-slate-800 shadow-2xl">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 bg-green-900/30 p-4 rounded-full w-20 h-20 flex items-center justify-center border border-green-800">
                        <ShieldCheck className="w-10 h-10 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl font-serif text-slate-100">
                        Autenticação Bem-sucedida!
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Sua identidade foi confirmada pelos guardiões do sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800 text-sm text-slate-300">
                        <p className="flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Email verificado com sucesso.
                        </p>
                        <p className="mt-2 text-slate-400">
                            Agora você tem acesso completo ao grimório e pode gerenciar suas campanhas.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold">
                        <Link href="/dashboard">
                            Adentrar o Dashboard
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
