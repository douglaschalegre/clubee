import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Users,
  CalendarCheck,
  Compass,
  UserCheck,
  Receipt,
  BadgeCheck,
} from "lucide-react";

const stats = [
  { label: "Comece grátis", value: "Clubes gratuitos ou pagos" },
  { label: "Checkout seguro", value: "Eventos pagos" },
  { label: "Controle de presença", value: "RSVP com aprovação" },
];

const journey = [
  {
    title: "Descubra o clube",
    description: "Membros veem regras e detalhes com clareza.",
    icon: Compass,
  },
  {
    title: "RSVP",
    description: "Você confirma presença ou solicita participação pro evento.",
    icon: UserCheck,
  },
  {
    title: "Pagamento seguro",
    description: "Eventos pagos com checkout Stripe integrado.",
    icon: Receipt,
  },
  {
    title: "Presença confirmada",
    description: "Lista final pronta para o dia do evento.",
    icon: BadgeCheck,
  },
];

const features = [
  {
    title: "Eventos pagos do clube",
    description: "Venda ingressos com Stripe e repasse automático.",
    icon: CreditCard,
  },
  {
    title: "Eventos gratuitos",
    description: "RSVP rápido para convidar e organizar presenças.",
    icon: CalendarCheck,
  },
  {
    title: "Clubes gratuitos ou pagos",
    description: "Comece grátis e monetize quando fizer sentido.",
    icon: Users,
  },
  {
    title: "Aprovação de RSVP",
    description: "Aprove ou recuse pedidos antes de confirmar.",
    icon: ShieldCheck,
  },
];

const steps = [
  {
    title: "Crie um clube",
    description: "Defina nome, descrição e regras do clube, pago ou gratuito.",
  },
  {
    title: "Publique eventos pagos ou gratuitos",
    description: "Escolha o formato e defina vagas.",
  },
  {
    title: "Aprove RSVPs",
    description:
      "Controle quem participa com opção de aprovação manual de participantes.",
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/90 px-3 py-1 text-sm font-medium ">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Comunidades em colmeia</span>
            </div>
            <h1
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Clubes gratuitos ou pagos
              <span className="block text-primary">
                Eventos pagos ou gratuitos, com RSVP aprovado.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Crie um clube e publique eventos em minutos.
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
                  <span>· {stat.label}</span>
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
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Seguro por design</div>
                  <div className="text-xs text-muted-foreground">
                    Pagamentos, RSVPs e acessos gerenciados automaticamente
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-amber/10 p-8 sm:p-12">
        <div className="absolute inset-0 pattern-honeycomb opacity-20" />
        <div className="absolute -left-16 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2
              className="text-3xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Da descoberta ao check-in
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Uma jornada simples para membros e organizada para quem cria.
            </p>
          </div>
          <div className="stagger-in grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {journey.map((step, index) => (
              <div
                key={step.title}
                className="hex-frame relative rounded-2xl border border-border/60 bg-background/80 p-5"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
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

      {/* Features */}
      <section className="space-y-8">
        <div className="text-center">
          <h2
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tudo o que você precisa para clubes e eventos
          </h2>
          <p className="mt-2 text-muted-foreground">
            Clubes e eventos com flexibilidade total, pagos ou gratuitos.
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
              “O Clubee tornou fácil organizar eventos pagos e gratuitos com
              RSVP aprovado. Finalmente tenho um lugar onde a comunidade se
              encontra e os pagamentos funcionam.”
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
              Pronto para lançar seu clube e seus eventos?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Grátis para começar. Cobrança só quando você vende eventos pagos.
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
