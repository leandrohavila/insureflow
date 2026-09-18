"use client"

import Link from "next/link"
import { ExternalLink, Globe, Star } from "lucide-react"

import {
  AppCard,
  ContentContainer,
  Grid,
  PageContainer,
  PageHeader,
  Section,
  Stack,
  StatCard,
} from "@/components/design-system"
import { useBusinessUnitContext } from "@/lib/data-access/modules/business-units"
import { useRealEstateDashboardStats } from "@/lib/data-access/modules/properties"
import {
  getPortalHomeUrl,
  getPortalSitemapUrl,
} from "@/lib/real-estate/portal-url"
import { useRealEstateBusinessUnitId } from "@/lib/real-estate/use-real-estate-business-unit"
import { dsContentLayoutVariant } from "@/lib/design-system"

export function PortalManagementPage() {
  const businessUnitId = useRealEstateBusinessUnitId()
  const context = useBusinessUnitContext()
  const statsQuery = useRealEstateDashboardStats(businessUnitId)
  const stats = statsQuery.data
  const portalUrl = getPortalHomeUrl(context.data)
  const sitemapUrl = getPortalSitemapUrl()

  return (
    <PageContainer className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-[var(--if-space-2)] md:py-[var(--if-space-3)]">
      <ContentContainer variant={dsContentLayoutVariant.leads}>
        <Stack gap="sm">
          <PageHeader
            title="Portal"
            description="Acompanhe a publicação no portal imobiliário público."
          />

          <Section>
            <Grid columns="2">
              <StatCard
                label="Imóveis publicados"
                value={stats?.publishedProperties ?? "—"}
                icon={Globe}
                loading={statsQuery.isLoading}
              />
              <StatCard
                label="Em destaque"
                value={stats?.featuredProperties ?? "—"}
                icon={Star}
                loading={statsQuery.isLoading}
              />
            </Grid>
          </Section>

          <Section>
            <Grid columns="2">
              <AppCard padding="compact" className="space-y-2">
                <p className="text-sm font-medium text-foreground">URL do portal</p>
                <Link
                  href={portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  {portalUrl}
                  <ExternalLink className="size-3.5" />
                </Link>
              </AppCard>

              <AppCard padding="compact" className="space-y-2">
                <p className="text-sm font-medium text-foreground">Sitemap</p>
                <Link
                  href={sitemapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  {sitemapUrl}
                  <ExternalLink className="size-3.5" />
                </Link>
              </AppCard>
            </Grid>
          </Section>
        </Stack>
      </ContentContainer>
    </PageContainer>
  )
}
