import type { ComponentType, ReactNode } from "react"
import { CheckCircle2, Clock, Loader2, ShieldCheck, Users } from "lucide-react"

import {
  AppCard,
  ContentContainer,
  EmptyState,
  FilterBar,
  FilterSearch,
  FilterSelect,
  FormField,
  FormLayout,
  Grid,
  Inline,
  LoadingState,
  PageContainer,
  PageHeader,
  PageActions,
  PageActionsGroup,
  Section,
  SkeletonState,
  Stack,
  StatCard,
  Toolbar,
} from "@/components/design-system"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  actionIcons,
  dsMotion,
  dsRadius,
  dsSpacing,
  dsTypography,
  moduleIcons,
  statusIcons,
} from "@/lib/design-system"

const colorSwatches = [
  ["Background", "var(--background)"],
  ["Card", "var(--card)"],
  ["Primary", "var(--primary)"],
  ["Muted", "var(--muted)"],
  ["Success", "var(--success)"],
  ["Warning", "var(--warning)"],
  ["Danger", "var(--destructive)"],
  ["Info", "var(--info)"],
] as const

const filterOptions = [
  { label: "Todos", value: "all" },
  { label: "Ativos", value: "active" },
  { label: "Pendentes", value: "pending" },
]

export default function UiKitPage() {
  return (
    <PageContainer>
      <ContentContainer>
        <Stack gap="2xl">
          <PageHeader
            eyebrow={<Badge className="w-fit">Sprint 4.2 Core Components</Badge>}
            title="InsureFlow UI Kit"
            description="Documentação viva da biblioteca oficial de componentes reutilizáveis. Esta página valida Foundation, tokens, estados, acessibilidade visual e padrões compostos sem migrar telas de negócio."
            actions={
              <PageActions>
                <PageActionsGroup>
                  <Button variant="outline" size="sm" className="h-9">
                    Ação secundária
                  </Button>
                  <Button size="sm" className="h-9">
                    Nova ação
                  </Button>
                </PageActionsGroup>
              </PageActions>
            }
          />

          <Section>
            <SectionTitle
              title="Layout"
              description="PageContainer, ContentContainer, Section, Stack, Inline e Grid."
            />
            <Grid columns="3">
              <PreviewCard title="Stack">
                <Stack>
                  <TokenPill label="gap" value="var(--if-space-4)" />
                  <TokenPill label="direction" value="column" />
                  <TokenPill label="use" value="vertical rhythm" />
                </Stack>
              </PreviewCard>
              <PreviewCard title="Inline">
                <Inline>
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Responsive</Badge>
                  <Badge variant="outline">Wrapped</Badge>
                </Inline>
              </PreviewCard>
              <PreviewCard title="Grid">
                <Grid columns="2">
                  <MiniBlock />
                  <MiniBlock />
                  <MiniBlock />
                  <MiniBlock />
                </Grid>
              </PreviewCard>
            </Grid>
          </Section>

          <Section>
            <SectionTitle
              title="Navigation"
              description="PageHeader, Toolbar, FilterBar, FilterSearch e FilterSelect."
            />
            <Stack>
              <Toolbar
                leading={<Badge variant="secondary">Toolbar</Badge>}
                trailing={<Button variant="outline">Exportar</Button>}
              >
                <span className="text-sm text-muted-foreground">
                  Área de ações padronizada
                </span>
              </Toolbar>
              <FilterBar activeCount={2}>
                <FilterSearch placeholder="Buscar clientes, leads ou apólices..." />
                <FilterSelect label="Status" defaultValue="all" options={filterOptions} />
                <FilterSelect label="Responsável" defaultValue="all" options={filterOptions} />
              </FilterBar>
            </Stack>
          </Section>

          <Section>
            <SectionTitle
              title="Cards"
              description="AppCard é a base oficial. StatCard consolida KPIs com default, loading, error e grade de 5 colunas."
            />
            <Grid columns="5">
              <StatCard
                icon={Users}
                label="Clientes ativos"
                value="1.248"
                description="Default state com tipografia compacta."
                tone="primary"
              />
              <StatCard
                icon={CheckCircle2}
                label="Conversão"
                value="32%"
                description="Success state para indicadores positivos."
                tone="success"
              />
              <StatCard
                icon={Clock}
                label="Pendências"
                value="18"
                description="Warning state para atenção operacional."
                tone="warning"
              />
              <StatCard
                icon={Clock}
                label="Carregando"
                value="0"
                description="Loading state oficial para KPIs."
                loading
                tone="info"
              />
              <StatCard
                icon={Clock}
                label="Erro"
                value="0"
                error="Não foi possível carregar."
                tone="warning"
              />
            </Grid>
            <Grid columns="2">
              <AppCard interactive>
                <Stack gap="md">
                  <Badge className="w-fit">Hover</Badge>
                  <p className="text-sm text-muted-foreground">
                    Card interativo com borda e background padronizados.
                  </p>
                </Stack>
              </AppCard>
            </Grid>
          </Section>

          <Section>
            <SectionTitle
              title="Forms"
              description="FormLayout e FormField preparados para ajuda, erro, obrigatório, disabled e loading."
            />
            <AppCard>
              <FormLayout>
                <FormField label="Nome" htmlFor="name" required hint="Campo obrigatório">
                  <Input id="name" placeholder="Empresa Avila" />
                </FormField>
                <FormField label="Status" htmlFor="status" helpText="Default e focus state">
                  <Input id="status" placeholder="Ativo" />
                </FormField>
                <FormField
                  label="E-mail"
                  htmlFor="email"
                  error="Informe um e-mail válido."
                >
                  <Input id="email" aria-invalid placeholder="erro@exemplo" />
                </FormField>
                <FormField label="Campo disabled" htmlFor="disabled" disabled>
                  <Input id="disabled" disabled placeholder="Indisponível" />
                </FormField>
              </FormLayout>
            </AppCard>
          </Section>

          <Section>
            <SectionTitle
              title="States"
              description="EmptyState, PlaceholderPage, LoadingState e SkeletonState."
            />
            <Grid columns="3">
              <EmptyState
                title="Nenhum registro encontrado"
                description="Estado vazio com ação opcional."
                action={<Button variant="outline">Criar registro</Button>}
              />
              <LoadingState label="Carregando componentes..." />
              <SkeletonState rows={4} />
            </Grid>
            <AppCard padding="compact">
              <p className="text-sm text-muted-foreground">
                PlaceholderPage também está disponível para módulos ainda não liberados:
                <span className="ml-1 font-medium text-foreground">
                  wrapper oficial sobre PageContainer + EmptyState.
                </span>
              </p>
            </AppCard>
          </Section>

          <Section>
            <SectionTitle
              title="Controls"
              description="Estados visuais obrigatórios: default, hover, focus, disabled, loading, error e success."
            />
            <Grid columns="2">
              <PreviewCard title="Buttons">
                <Inline>
                  <Button>Default</Button>
                  <Button variant="outline">Hover/Focus</Button>
                  <Button disabled>Disabled</Button>
                  <Button>
                    <Loader2 className="animate-spin" aria-hidden />
                    Loading
                  </Button>
                </Inline>
              </PreviewCard>
              <PreviewCard title="Validation">
                <Stack gap="md">
                  <Input aria-invalid placeholder="Error state" />
                  <div className="flex items-center gap-[var(--if-space-2)] rounded-[var(--if-radius-md)] border border-success/25 bg-success/10 px-[var(--if-space-3)] py-[var(--if-space-2)] text-sm text-success">
                    <ShieldCheck className="size-4" aria-hidden />
                    Success state
                  </div>
                </Stack>
              </PreviewCard>
            </Grid>
          </Section>

          <Section>
            <SectionTitle
              title="Hardening"
              description="Comportamentos oficiais para densidade compacta, acessibilidade e responsividade."
            />
            <Grid columns="3">
              <PreviewCard title="Compact density">
                <Stack gap="md">
                  <TokenPill label="control" value="var(--if-control-height-md)" />
                  <TokenPill label="gap" value="var(--if-layout-control-gap)" />
                  <TokenPill label="state" value="var(--if-state-min-height)" />
                </Stack>
              </PreviewCard>
              <PreviewCard title="ARIA states">
                <Stack gap="md">
                  <Badge className="w-fit">aria-busy em StatCard</Badge>
                  <Badge className="w-fit" variant="secondary">
                    role=status em LoadingState
                  </Badge>
                  <Badge className="w-fit" variant="outline">
                    FormField propaga aria-describedby
                  </Badge>
                </Stack>
              </PreviewCard>
              <PreviewCard title="Responsive layout">
                <Grid columns="5">
                  <MiniBlock />
                  <MiniBlock />
                  <MiniBlock />
                  <MiniBlock />
                  <MiniBlock />
                </Grid>
              </PreviewCard>
            </Grid>
          </Section>

          <Section>
            <SectionTitle
              title="Tokens"
              description="Spacing, typography, radius, motion e dark theme usados pelos componentes."
            />
            <Grid columns="3">
              <PreviewCard title="Spacing">
                <Stack gap="md">
                  {Object.entries(dsSpacing)
                    .filter(([key]) =>
                      ["xs", "sm", "md", "lg", "xl", "2xl"].includes(key),
                    )
                    .map(([key, value]) => (
                      <div key={key} className="flex items-center gap-[var(--if-space-3)]">
                        <span className="w-10 text-xs text-muted-foreground">{key}</span>
                        <span
                          className="h-2 rounded-full bg-primary/70"
                          style={{ width: value }}
                        />
                        <code className="text-xs text-muted-foreground">{value}</code>
                      </div>
                    ))}
                </Stack>
              </PreviewCard>
              <PreviewCard title="Typography">
                <Stack gap="md">
                  <p className={dsTypography.role.pageTitle}>Page title</p>
                  <p className={dsTypography.role.sectionTitle}>Section title</p>
                  <p className={dsTypography.role.body}>Body text</p>
                  <p className={dsTypography.role.meta}>Meta text</p>
                </Stack>
              </PreviewCard>
              <PreviewCard title="Radius / Motion">
                <Stack gap="md">
                  {Object.entries(dsRadius).slice(0, 4).map(([key, value]) => (
                    <TokenPill key={key} label={key} value={value} />
                  ))}
                  {Object.entries(dsMotion.duration).slice(0, 3).map(([key, value]) => (
                    <TokenPill key={key} label={key} value={value} />
                  ))}
                </Stack>
              </PreviewCard>
            </Grid>
          </Section>

          <Section>
            <SectionTitle
              title="Colors"
              description="Cores semânticas ativas no tema escuro atual."
            />
            <Grid>
              {colorSwatches.map(([label, value]) => (
                <AppCard key={label}>
                  <div
                    className="h-16 rounded-[var(--if-radius-xl)] border border-white/[0.08]"
                    style={{ background: value }}
                  />
                  <p className="mt-[var(--if-space-3)] text-sm font-medium">{label}</p>
                  <code className="text-xs text-muted-foreground">{value}</code>
                </AppCard>
              ))}
            </Grid>
          </Section>

          <Section>
            <SectionTitle
              title="Tables"
              description="DataTable existente foi preservado e reexportado como componente oficial."
            />
            <AppCard padding="none">
              <div className="grid grid-cols-3 bg-white/[0.03] px-[var(--if-space-4)] py-[var(--if-space-3)] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Cliente</span>
                <span>Status</span>
                <span className="text-right">Valor</span>
              </div>
              {["Empresa Avila", "Cliente Premium", "Conta Operacional"].map((item) => (
                <div
                  key={item}
                  className="grid grid-cols-3 border-t border-white/[0.06] px-[var(--if-space-4)] py-[var(--if-space-3)] text-sm"
                >
                  <span>{item}</span>
                  <span className="text-muted-foreground">Ativo</span>
                  <span className="text-right tabular-nums">R$ 12.400</span>
                </div>
              ))}
            </AppCard>
          </Section>

          <Section>
            <SectionTitle title="Icon System" description="Categorias oficiais de ícones." />
            <Grid columns="3">
              <IconGroup title="ModuleIcon" entries={Object.entries(moduleIcons)} />
              <IconGroup title="StatusIcon" entries={Object.entries(statusIcons)} />
              <IconGroup title="ActionIcon" entries={Object.entries(actionIcons)} />
            </Grid>
          </Section>
        </Stack>
      </ContentContainer>
    </PageContainer>
  )
}

function SectionTitle({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="space-y-[var(--if-space-1)]">
      <h2 className={dsTypography.role.sectionTitle}>{title}</h2>
      <p className={dsTypography.role.meta}>{description}</p>
    </div>
  )
}

function PreviewCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AppCard>
      <h3 className="mb-[var(--if-space-4)] text-sm font-semibold">{title}</h3>
      {children}
    </AppCard>
  )
}

function TokenPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-[var(--if-space-3)] rounded-[var(--if-radius-md)] border border-white/[0.08] bg-white/[0.03] px-[var(--if-space-3)] py-[var(--if-space-2)]">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <code className="text-xs text-muted-foreground">{value}</code>
    </div>
  )
}

function MiniBlock() {
  return (
    <div className="h-14 rounded-[var(--if-radius-lg)] border border-white/[0.08] bg-white/[0.04]" />
  )
}

function IconGroup({
  title,
  entries,
}: {
  title: string
  entries: Array<[string, ComponentType<{ className?: string }>]>
}) {
  return (
    <PreviewCard title={title}>
      <div className="grid grid-cols-2 gap-[var(--if-space-3)]">
        {entries.map(([name, Icon]) => (
          <div key={name} className="flex items-center gap-[var(--if-space-2)] text-sm">
            <Icon className="size-4 text-primary" />
            <span className="truncate">{name}</span>
          </div>
        ))}
      </div>
    </PreviewCard>
  )
}
