"use client"

import { useState } from "react"
import { Plus, Shield } from "lucide-react"
import { Character } from "@/shared/types/character"
import { CharacterForm } from "./character-form"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface CharacterFormDialogProps {
    onCharacterCreated?: () => void
    characterToEdit?: Character
    trigger?: React.ReactNode
}

export function CharacterFormDialog({ onCharacterCreated, characterToEdit, trigger }: CharacterFormDialogProps) {
    const [open, setOpen] = useState(false)
    const isEditing = !!characterToEdit

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <button className="border-2 border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-slate-500 hover:border-amber-500/50 hover:text-amber-500 transition-all group cursor-pointer">
                        <Plus className="h-10 w-10 mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-bold font-serif">Criar Novo Herói</span>
                    </button>
                )}
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-5xl bg-slate-900 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto scrollbar-hide">
                <DialogHeader className="mb-4">
                    <DialogTitle className="text-3xl font-serif text-amber-500 flex items-center gap-3">
                        <div className="bg-amber-500/10 p-2 rounded-lg">
                            <Shield className="h-6 w-6" />
                        </div>
                        {isEditing ? `Editar Herói` : "Novo Personagem"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {isEditing ? "Atualize os detalhes e atributos do seu personagem." : "Defina a essência do seu herói e salve-o na sua biblioteca."}
                    </DialogDescription>
                </DialogHeader>

                <CharacterForm
                    characterToEdit={characterToEdit}
                    onSuccess={() => {
                        onCharacterCreated?.()
                        setOpen(false)
                    }}
                    onCancel={() => setOpen(false)}
                    isDialog={true}
                />
            </DialogContent>
        </Dialog>
    )
}
