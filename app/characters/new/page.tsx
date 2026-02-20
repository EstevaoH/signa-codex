"use client"

import { useRouter } from "next/navigation"
import { Shield, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CharacterForm } from "@/components/character-form"

export default function NewCharacterPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <Button
                            variant="ghost"
                            className="text-slate-400 hover:text-amber-500 -ml-4 mb-2"
                            onClick={() => router.back()}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
                        </Button>
                        <h1 className="text-4xl font-serif text-amber-500 flex items-center gap-3">
                            <div className="bg-amber-500/10 p-2 rounded-lg">
                                <Shield className="h-8 w-8" />
                            </div>
                            Novo Personagem
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Defina a essência do seu herói e salve-o na sua biblioteca.
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-sm">
                    <CharacterForm
                        onSuccess={() => router.push("/dashboard")}
                        onCancel={() => router.back()}
                    />
                </div>
            </div>
        </div>
    )
}
