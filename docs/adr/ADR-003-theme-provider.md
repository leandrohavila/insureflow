# ADR-003: Theme Provider

## Status

Accepted

## Decision

Usar `InsureFlowThemeProvider` como boundary do produto e delegar a implementação
base para `@repo/ui/theme-provider`.

## Future

Tenant branding e accessibility themes devem estender esse boundary.
