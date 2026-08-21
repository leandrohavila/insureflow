"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

type TemplateWizardOnboardingProps = {
  open: boolean
  templateName?: string
  onOpenChange: (open: boolean) => void
  onInsertBlock?: () => void
}

export function TemplateWizardOnboarding({
  open,
  templateName,
  onOpenChange,
  onInsertBlock,
}: TemplateWizardOnboardingProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-background/95 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Template criado com sucesso
          </DialogTitle>
          <DialogDescription>
            {templateName ? (
              <>
                <strong className="text-foreground">{templateName}</strong> está
                pronto para personalização no canvas.
              </>
            ) : (
              "Seu questionário inteligente está pronto para personalização."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-[var(--if-space-4)] text-sm">
          <p className="font-medium text-foreground">Dica</p>
          <p className="mt-1 text-muted-foreground">
            Você pode adicionar novos blocos com{" "}
            <strong className="text-foreground">Inserir Bloco</strong> ou
            personalizar qualquer pergunta clicando nela no canvas.
          </p>
        </div>
        <DialogFooter>
          {onInsertBlock ? (
            <Button type="button" variant="outline" onClick={onInsertBlock}>
              Inserir Bloco
            </Button>
          ) : null}
          <Button type="button" onClick={() => onOpenChange(false)}>
            Ir para o canvas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
