import Link from "next/link";
import { ArrowRight, BarChart3, Box, FileText, Globe, Layers, LayoutDashboard, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Aswaq-Agency</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="transition-colors hover:text-foreground">
              Fonctionnalités
            </Link>
            <Link href="#about" className="transition-colors hover:text-foreground">
              À propos
            </Link>
            <Link href="#contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm">
                Se connecter
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Commencer</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32 lg:pb-32 xl:pb-36">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-x-8 lg:gap-y-20">
              <div className="relative z-10 mx-auto max-w-2xl lg:col-span-7 lg:max-w-none lg:pt-6 xl:col-span-6">
                <Badge variant="secondary" className="mb-4">
                  🚧 Actuellement en développement
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
                  Maîtrisez votre <span className="text-primary">Stock</span> & <span className="text-primary">Facturation</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground">
                  Optimisez vos opérations commerciales avec Aswaq-Agency. La solution ultime pour gérer les stocks, suivre les factures et optimiser votre flux de travail.
                </p>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-4">
                  <Link href="/sign-up">
                    <Button size="lg" className="h-12 px-8">
                      Essai gratuit <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#features">
                    <Button variant="outline" size="lg" className="h-12 px-8">
                      En savoir plus
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative mt-10 sm:mt-20 lg:col-span-5 lg:row-span-2 lg:mt-0 xl:col-span-6">
                <div className="absolute left-1/2 top-4 h-[1026px] w-[1026px] -translate-x-1/2 stroke-gray-300/70 [mask-image:linear-gradient(to_bottom,white,20%,transparent,75%)] sm:top-16 sm:-translate-x-1/2 lg:-top-16 lg:ml-12 xl:-top-14 xl:ml-0 dark:stroke-gray-700/70">
                  <svg viewBox="0 0 1026 1026" fill="none" aria-hidden="true" className="absolute inset-0 h-full w-full animate-spin-slow">
                    <path d="M1025 513c0 282.77-229.23 512-512 512S1 795.77 1 513 230.23 1 513 1s512 229.23 512 512Z" stroke="currentColor" strokeOpacity="0.7" />
                    <path d="M513 1025C230.23 1025 1 795.77 1 513" stroke="currentColor" strokeLinecap="round" />
                  </svg>
                </div>
                {/* Abstract UI Mockup */}
                <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 dark:bg-white/5 dark:ring-white/10">
                  <div className="rounded-md bg-background shadow-2xl ring-1 ring-gray-900/10 dark:ring-white/10">
                    <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                      <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-400" />
                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                        <div className="h-3 w-3 rounded-full bg-green-400" />
                      </div>
                      <div className="mx-auto h-2.5 w-32 rounded-full bg-muted-foreground/20" />
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="h-8 w-1/3 rounded bg-muted-foreground/20" />
                        <div className="grid grid-cols-3 gap-4">
                          <div className="h-24 rounded bg-primary/10" />
                          <div className="h-24 rounded bg-primary/10" />
                          <div className="h-24 rounded bg-primary/10" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 w-full rounded bg-muted-foreground/10" />
                          <div className="h-4 w-5/6 rounded bg-muted-foreground/10" />
                          <div className="h-4 w-4/6 rounded bg-muted-foreground/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Tout ce dont vous avez besoin pour gérer votre entreprise</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Du suivi détaillé des stocks à la facturation automatisée, Aswaq-Agency vous donne les outils pour réussir.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-8">
            <FeatureCard
              icon={<Box className="h-6 w-6 text-primary" />}
              title="Gestion des Stocks"
              description="Suivi en temps réel de votre inventaire. Sachez exactement ce que vous avez, où cela se trouve et quand recommander."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6 text-primary" />}
              title="Facturation Intelligente"
              description="Créez des factures professionnelles en quelques secondes. Gérez facilement les factures de détail, d'exportation et proforma."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6 text-primary" />}
              title="Analyses & Rapports"
              description="Obtenez des informations sur les performances de votre entreprise grâce à des rapports détaillés et des tableaux de bord interactifs."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-6 w-6 text-primary" />}
              title="Plateforme Sécurisée"
              description="Vos données sont protégées par une sécurité de niveau entreprise. L'accès basé sur les rôles garantit un contrôle total."
            />
            <FeatureCard
              icon={<Globe className="h-6 w-6 text-primary" />}
              title="Accès Partout"
              description="Solution basée sur le cloud vous permettant de gérer votre entreprise depuis n'importe quel appareil, partout dans le monde."
            />
            <FeatureCard
              icon={<LayoutDashboard className="h-6 w-6 text-primary" />}
              title="Interface Intuitive"
              description="Conçu pour la facilité d'utilisation. Interface moderne et épurée nécessitant une formation minimale pour être maîtrisée."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              Construit par{" "}
              <a href="#" className="font-medium underline underline-offset-4">
                L'équipe Aswaq-Agency
              </a>
              . Le code source est disponible sur{" "}
              <a href="#" className="font-medium underline underline-offset-4">
                GitHub
              </a>
              .
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Conditions
            </Link>
            <Link href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              Confidentialité
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="flex flex-col items-start transition-all hover:shadow-lg dark:hover:bg-accent/50">
      <CardHeader>
        <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
