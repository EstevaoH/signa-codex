"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"

interface DeleteConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: string
    itemName?: string
    isLoading?: boolean
}

export function DeleteConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Confirmar Exclusão",
    description = "Esta ação não pode ser desfeita. Isso excluirá permanentemente o item de nossos servidores.",
    itemName,
    isLoading = false
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[400px]">
                <DialogHeader className="space-y-3">
                    <div className="mx-auto bg-red-500/10 p-3 rounded-full w-fit">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <DialogTitle className="text-xl font-serif text-center text-slate-100">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 text-center text-sm">
                        {description}
                        {itemName && (
                            <span className="block mt-2 font-bold text-slate-200">
                                "{itemName}"
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-slate-800 cursor-pointer bg-transparent text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex-1"
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        className="bg-red-600 cursor-pointer hover:bg-red-700 text-white flex-1 font-bold shadow-lg shadow-red-900/20"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Trash2 className="h-4 w-4" />
                                <span>Excluir</span>
                            </div>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
