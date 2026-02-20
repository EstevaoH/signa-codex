"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, LogOut, Settings, ChevronDown, UserCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserMenu() {
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const getProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (data) setProfile(data)
            } catch (error) {
                console.error("Error fetching profile:", error)
            } finally {
                setLoading(false)
            }
        }
        getProfile()
    }, [])

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut()
            router.push("/login")
        } catch (error) {
            console.error("Error signing out:", error)
        }
    }

    if (loading) {
        return <div className="h-10 w-32 bg-slate-800 animate-pulse rounded-lg" />
    }

    const displayName = profile?.username || profile?.full_name || "Aventureiro"
    const initials = displayName.substring(0, 2).toUpperCase()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 flex items-center gap-3 px-2 hover:bg-slate-800/50 text-slate-200 cursor-pointer transition-all border border-transparent hover:border-slate-700 rounded-lg group">
                    <Avatar className="h-8 w-8 border-2 border-slate-700 group-hover:border-amber-500/50 transition-colors">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="bg-slate-900 text-amber-500 font-bold text-xs">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left hidden md:flex">
                        <span className="text-sm font-bold text-slate-100 leading-none mb-1 group-hover:text-amber-500 transition-colors">
                            {displayName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                            Status: Online
                        </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-200 shadow-2xl" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-bold font-serif text-amber-500">{displayName}</p>
                        <p className="text-xs leading-none text-slate-500">
                            {profile?.full_name || "Membro da Guilda"}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                    className="focus:bg-slate-800 focus:text-amber-500 cursor-pointer gap-2 py-3"
                    onClick={() => router.push("/settings/profile")}
                >
                    <UserCircle className="h-4 w-4" />
                    <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    className="focus:bg-slate-800 focus:text-amber-500 cursor-pointer gap-2 py-3"
                    onClick={() => router.push("/settings")}
                >
                    <Settings className="h-4 w-4" />
                    <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                    className="focus:bg-red-900/20 focus:text-red-500 cursor-pointer gap-2 py-3 text-red-400"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    <span>Encerrar Jornada</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
