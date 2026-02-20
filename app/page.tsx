
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scroll, Shield, Sword, Users, Sparkles, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">

      {/* Header / Navbar */}
      <header className="container mx-auto flex h-20 items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2 text-amber-500">
          <Scroll className="h-8 w-8" />
          <span className="text-xl font-bold tracking-widest uppercase font-serif">Signa Codex</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-400">
          <Link href="#" className="hover:text-amber-500 transition-colors">Lore</Link>
          <Link href="#" className="hover:text-amber-500 transition-colors">Recursos</Link>
          <Link href="#" className="hover:text-amber-500 transition-colors">Comunidade</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800">
            <Link href="/login">
              Entrar
            </Link>
          </Button>
          <Button asChild className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
            <Link href="/register">
              Criar Conta
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-4 py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-slate-950 -z-10" />

          <div className="container mx-auto flex flex-col items-center text-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-500 cursor-default">
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Nova Campanha Disponível</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white max-w-4xl">
              Sua Aventura Começa <span className="text-amber-500">Aqui</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
              Gerencie seus personagens, organize suas campanhas e mergulhe em mundos de fantasia sem limites. O Signa Codex é o grimório definitivo para mestres e jogadores.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="h-12 px-8 text-lg bg-amber-600 hover:bg-amber-700 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all">
                <Link href="/register">
                  Começar Jornada <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 text-lg border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent">
                <Link href="/login">
                  Acessar Grimório
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Sword className="h-10 w-10 text-amber-500" />}
                title="Criação de Personagens"
                description="Construa heróis lendários com nosso criador detalhado. Escolha classes, raças e equipamentos com facilidade."
              />
              <FeatureCard
                icon={<Shield className="h-10 w-10 text-amber-500" />}
                title="Gestão de Campanhas"
                description="Mestres podem organizar anotações, NPCs e linhas do tempo em um único lugar seguro e acessível."
              />
              <FeatureCard
                icon={<Users className="h-10 w-10 text-amber-500" />}
                title="Companhia de Aventuras"
                description="Forme grupos, agende sessões e mantenha o diário de bordo da sua party sempre atualizado."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-slate-500">
            <Scroll className="h-5 w-5" />
            <span className="font-serif font-bold">Signa Codex</span>
          </div>
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} Signa Codex. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Card className="bg-slate-950 border-slate-800 hover:border-amber-500/50 transition-colors group">
      <CardHeader>
        <div className="mb-4 p-3 w-fit rounded-lg bg-slate-900 group-hover:bg-amber-500/10 transition-colors">
          {icon}
        </div>
        <CardTitle className="text-xl font-serif text-slate-100 group-hover:text-amber-500 transition-colors">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-slate-400 text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
