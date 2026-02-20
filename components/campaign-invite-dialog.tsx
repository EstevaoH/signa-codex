"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Plus, Loader2, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const inviteSchema = z.object({
    email: z.string().email("E-mail inválido"),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface CampaignInviteDialogProps {
    campaignId: string
    onInviteSent?: () => void
}

export function CampaignInviteDialog({ campaignId, onInviteSent }: CampaignInviteDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<InviteFormValues>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(values: InviteFormValues) {
        setIsLoading(true)
        try {
            const email = values.email.toLowerCase()
            // 1. Verificar se já existe um convite pendente/aceito para este e-mail nesta campanha
            const { data: existingInvite, error: checkError } = await supabase
                .from('campaign_invites')
                .select('id, status')
                .eq('campaign_id', campaignId)
                .eq('email', email)
                .single()

            if (existingInvite && (existingInvite.status === 'pending' || existingInvite.status === 'accepted')) {
                throw new Error("Já existe um convite ativo para este e-mail.")
            }

            // 2. Gerar token único (simples UUID para este exemplo)
            const token = crypto.randomUUID()

            // 3. Inserir convite
            const { error: inviteError } = await supabase
                .from('campaign_invites')
                .insert({
                    campaign_id: campaignId,
                    email: email,
                    token: token,
                    status: 'pending'
                })

            if (inviteError) throw inviteError

            toast({
                title: "Convite enviado!",
                description: `O convite para ${values.email} foi registrado no sistema.`,
            })

            form.reset()
            setOpen(false)
            if (onInviteSent) onInviteSent()
        } catch (error: any) {
            toast({
                title: "Erro ao convidar",
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 h-8 gap-2 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>Convidar</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
                <DialogHeader>
                    <div className="bg-amber-500/10 p-2 rounded-lg w-fit mb-2">
                        <Mail className="h-6 w-6 text-amber-500" />
                    </div>
                    <DialogTitle className="text-2xl font-serif text-amber-500">Convidar Jogador</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Insira o e-mail do explorador que você deseja convocar para sua jornada.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-300 uppercase text-[10px] font-bold tracking-widest">E-mail do Jogador</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                placeholder="exemplo@gmail.com"
                                                {...field}
                                                className="bg-slate-950 border-slate-800 focus:border-amber-500 pl-10 h-10 transition-all text-slate-100"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-red-500 text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-11 cursor-pointer transition-all shadow-lg shadow-amber-900/20"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Send className="h-4 w-4" />
                                    <span>Enviar Convite</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
