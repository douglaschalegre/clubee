import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  CreditCard,
  Shield,
  Users,
  Zap,
  Crown,
} from "lucide-react";

const stats = [
  { label: "Assinaturas pagas", value: "Pronto para o Stripe" },
  { label: "Controle de membros", value: "Foco no organizador" },
  { label: "Regras de acesso", value: "Automático" },
];

const features = [
  {
    title: "Assinaturas pagas",
    description: "Crie assinaturas recorrentes com checkout seguro.",
    icon: CreditCard,
  },
  {
    title: "Controles do organizador",
    description:
      "Gerencie membros, alterne acessos e mantenha seu clube saudável.",
    icon: Crown,
  },
  {
    title: "Diretório de membros",
    description: "Crie confiança com visibilidade clara de membros e status.",
    icon: Users,
  },
  {
    title: "Acesso imediato",
    description: "Fluxo de entrada automático com ativação imediata.",
    icon: Zap,
  },
];

const steps = [
  {
    title: "Crie seu clube",
    description: "Defina um nome, adicione uma descrição e escolha o estilo.",
  },
  {
    title: "Defina assinaturas",
    description: "Ofereça acesso pago com Stripe e convide sua comunidade.",
  },
  {
    title: "Cresçam juntos",
    description: "Gerencie membros e construa comunidades pagas duradouras.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-amber/10 blur-3xl" />
        <div className="absolute inset-0 pattern-honeycomb opacity-40" />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Comunidades em colmeia</span>
            </div>
            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Crie comunidades pagas
              <span className="block text-primary">que dão vida.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              O Clubee ajuda criadores a lançar clubes pagos com assinaturas do
              Stripe, controle de membros e acesso imediato. Simples de operar e
              agradável de participar.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="gap-2 shadow-honey transition-all hover:shadow-honey-lg hover:scale-[1.02]"
              >
                <Link href="/clubs/new">
                  Começar um clube
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild size="lg">
                <Link href="/clubs">Explorar clubes</Link>
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">
                    {stat.value}
                  </span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Honeycomb Cluster */}
          <div className="relative hidden h-[360px] lg:block">
            <div className="absolute right-6 top-6 grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex h-24 w-24 items-center justify-center rounded-xl bg-white/80 shadow-sm"
                >
                  <div className="clip-hexagon h-16 w-16 bg-primary/15" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-6 translate-y-6 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-honey">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Seguro por design</div>
                  <div className="text-xs text-muted-foreground">
                    Pagamentos e acessos gerenciados automaticamente
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <div className="text-center">
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tudo o que você precisa para gerenciar um clube pago
          </h2>
          <p className="mt-2 text-muted-foreground">
            Feito para criadores que querem comunidade sem sobrecarga
            administrativa.
          </p>
        </div>

        <div className="stagger-in grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="hex-frame group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-honey"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3
                className="font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-8 sm:p-12">
        <div className="absolute inset-0 pattern-honeycomb opacity-25" />
        <div className="relative">
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Como funciona
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-border/60 bg-background/80 p-6"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </div>
                <h3
                  className="font-semibold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-amber/10 p-8 sm:p-12">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[0.45fr_0.55fr]">
          <div className="flex items-center justify-center rounded-3xl bg-white/80 p-6 shadow-honey">
            <div className="clip-hexagon flex h-24 w-24 items-center justify-center bg-primary/20 text-2xl">
              🐝
            </div>
          </div>
          <div>
            <p
              className="text-xl font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              “O Clubee tornou fácil operar uma comunidade paga. Finalmente
              tenho um lugar onde os membros se sentem conectados e os
              pagamentos funcionam.”
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Ava Romero · Fundadora, The Makers Hive
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-8 sm:p-12">
        <div className="absolute inset-0 pattern-honeycomb opacity-30" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Pronto para lançar seu clube?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Grátis para começar. Você só paga quando tiver membros pagantes.
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="gap-2 shadow-honey transition-all hover:shadow-honey-lg hover:scale-[1.02]"
          >
            <Link href="/clubs/new">
              Começar um clube
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
