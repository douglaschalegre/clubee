import { redirect } from "next/navigation";
import { CreditCard, ExternalLink, ShieldCheck, Wallet } from "lucide-react";
import type { StripeConnectStatus } from "@/lib/generated/prisma/client";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FinanceiroDashboardCta } from "@/components/financeiro-dashboard-cta";

const statusConfig: Record<
  StripeConnectStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    note: string;
  }
> = {
  not_started: {
    label: "Não configurado",
    variant: "secondary",
    note: "Conecte sua conta Stripe para começar a receber pagamentos e acessar o painel.",
  },
  onboarding_started: {
    label: "Onboarding incompleto",
    variant: "outline",
    note: "Finalize o onboarding para liberar o painel e os repasses.",
  },
  onboarding_incomplete: {
    label: "Onboarding incompleto",
    variant: "outline",
    note: "Finalize o onboarding para liberar o painel e os repasses.",
  },
  active: {
    label: "Ativo",
    variant: "default",
    note: "Tudo pronto. Você já pode acessar o painel Stripe.",
  },
  restricted: {
    label: "Restrito",
    variant: "destructive",
    note: "Há pendências na sua conta. Revise sua configuração para voltar a receber pagamentos.",
  },
  disabled: {
    label: "Desativado",
    variant: "destructive",
    note: "A conta foi desativada. Entre em contato com o suporte do Stripe.",
  },
};

export default async function FinanceiroPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { stripeConnectStatus: true, stripeConnectAccountId: true, profileCompleted: true },
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  if (!dbUser.profileCompleted) {
    redirect(`/profile?returnTo=${encodeURIComponent("/financeiro")}`);
  }

  const status = dbUser.stripeConnectStatus;
  const config = statusConfig[status];
  const canAccessDashboard =
    status === "active" && !!dbUser.stripeConnectAccountId;

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "Painel financeiro" }]} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden bg-honeycomb shadow-honey-lg">
          <div className="absolute inset-0 pattern-honeycomb opacity-40" />
          <CardHeader className="relative">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-card/80 px-2.5 py-1">
                Stripe Express
              </span>
              <span>Operado pelo Stripe (fora do Clubee)</span>
            </div>
            <CardTitle
              className="text-2xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Painel financeiro para organizar seus repasses
            </CardTitle>
            <CardDescription className="max-w-2xl">
              Aqui você encontra o acesso ao painel do Stripe, onde seu clube
              acompanha saldo, repasses e pagamentos. Ao abrir o painel, você será
              levado para uma nova aba segura do Stripe Express.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              Você pode voltar ao Clubee a qualquer momento.
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex h-full flex-col gap-3 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h3
                className="text-base font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Por que o Stripe é necessário
              </h3>
              <p className="text-sm text-muted-foreground">
                O Clubee usa o Stripe para processar pagamentos com segurança. Sem
                uma conta Stripe ativa, você não consegue cobrar assinaturas de
                clubes nem vender eventos pagos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" />
            <span>Status da sua conta Stripe</span>
            <Badge variant={config.variant} className="gap-2">
              {config.label}
            </Badge>
          </CardTitle>
          <CardDescription>
            O painel só fica disponível quando sua conta está ativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-start">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{config.note}</p>
            {!canAccessDashboard ? (
              <p className="text-xs text-muted-foreground">
                Quando a conta estiver ativa, você poderá cobrar por clubes e
                eventos pagos.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Ao clicar em “Abrir painel Stripe”, você será levado para uma
                nova aba do Stripe Express.
              </p>
            )}
          </div>

          <div className="flex items-start md:justify-end">
            <FinanceiroDashboardCta
              canAccessDashboard={canAccessDashboard}
              status={status}
            />
          </div>
        </CardContent>
      </Card>
      <section className="space-y-4">
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Como funciona o painel
          </h2>
          <p className="text-sm text-muted-foreground">
            Um guia rápido para entender o que acontece quando você acessa o
            Stripe.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="hover-lift">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">O que é o painel</CardTitle>
              <CardDescription>
                É o painel Stripe Express da sua conta de recebimentos. Ele é
                hospedado e operado pelo Stripe.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">O que você pode fazer</CardTitle>
              <CardDescription>
                Ver saldo disponível, acompanhar repasses, revisar pagamentos e
                atualizar dados bancários ou fiscais.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover-lift">
            <CardHeader className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ExternalLink className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-base">
                O que acontece ao clicar
              </CardTitle>
              <CardDescription>
                Abrimos uma nova aba segura do Stripe. Você continua no Clubee e
                pode voltar quando quiser.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

    </div>
  );
}
