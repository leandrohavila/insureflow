"use client"

import { useCallback, useEffect, useRef } from "react"

import type { QuestionnaireTemplate } from "@/lib/data-access/modules/questionnaires"

import {
  hashSettings,
  TEMPLATE_SETTINGS_AUTOSAVE_DEBOUNCE_MS,
} from "./template-settings-autosave.util"

type UpdateTemplateMutate = (
  variables: {
    id: string
    input: { settings: Record<string, unknown> }
    autosave?: boolean
  },
  options?: {
    onSuccess?: (template: QuestionnaireTemplate) => void
    onError?: () => void
    onSettled?: () => void
  },
) => void

type UseTemplateSettingsAutosaveOptions = {
  template: QuestionnaireTemplate | null
  updateTemplate: { mutate: UpdateTemplateMutate; isPending: boolean }
  debounceMs?: number
}

export function useTemplateSettingsAutosave({
  template,
  updateTemplate,
  debounceMs = TEMPLATE_SETTINGS_AUTOSAVE_DEBOUNCE_MS,
}: UseTemplateSettingsAutosaveOptions) {
  const templateRef = useRef(template)
  templateRef.current = template

  const isSavingRef = useRef(false)
  const lastSavedHashRef = useRef<string | null>(null)
  const lastSavedVersionRef = useRef<number | null>(null)
  const lastSavedUpdatedAtRef = useRef<string | null>(null)
  const pendingChangesRef = useRef<string | null>(null)
  const pendingSettingsRef = useRef<Record<string, unknown> | null>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const trackedTemplateIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!template) {
      trackedTemplateIdRef.current = null
      lastSavedHashRef.current = null
      lastSavedVersionRef.current = null
      lastSavedUpdatedAtRef.current = null
      pendingChangesRef.current = null
      pendingSettingsRef.current = null
      return
    }

    const templateChanged = trackedTemplateIdRef.current !== template.id
    const serverSynced =
      template.updatedAt !== lastSavedUpdatedAtRef.current ||
      template.version !== lastSavedVersionRef.current

    if (templateChanged || serverSynced) {
      trackedTemplateIdRef.current = template.id
      lastSavedHashRef.current = hashSettings(
        template.settings as Record<string, unknown>,
      )
      lastSavedVersionRef.current = template.version
      lastSavedUpdatedAtRef.current = template.updatedAt
      pendingChangesRef.current = null
      pendingSettingsRef.current = null
    }
  }, [
    template?.id,
    template?.updatedAt,
    template?.version,
    template?.settings,
    template,
  ])

  useEffect(() => {
    isSavingRef.current = updateTemplate.isPending
  }, [updateTemplate.isPending])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const flushScheduledSave = useCallback(() => {
    debounceTimerRef.current = null

    const currentTemplate = templateRef.current
    const nextSettings = pendingSettingsRef.current
    if (!currentTemplate || !nextSettings || isSavingRef.current) return

    const nextHash = hashSettings(nextSettings)
    if (nextHash === lastSavedHashRef.current) {
      pendingChangesRef.current = null
      pendingSettingsRef.current = null
      return
    }

    pendingChangesRef.current = nextHash
    isSavingRef.current = true

    updateTemplate.mutate(
      {
        id: currentTemplate.id,
        input: { settings: nextSettings },
        autosave: true,
      },
      {
        onSuccess: (saved) => {
          const savedHash = hashSettings(
            saved.settings as Record<string, unknown>,
          )
          lastSavedHashRef.current = savedHash
          lastSavedVersionRef.current = saved.version
          lastSavedUpdatedAtRef.current = saved.updatedAt
          pendingChangesRef.current = null
          pendingSettingsRef.current = null
        },
        onError: () => {
          pendingChangesRef.current = null
        },
        onSettled: () => {
          isSavingRef.current = false
        },
      },
    )
  }, [updateTemplate])

  const scheduleSettingsSave = useCallback(
    (nextSettings: Record<string, unknown>) => {
      if (!templateRef.current) return

      const nextHash = hashSettings(nextSettings)
      if (nextHash === lastSavedHashRef.current) return

      pendingSettingsRef.current = nextSettings
      pendingChangesRef.current = nextHash

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = window.setTimeout(() => {
        flushScheduledSave()
      }, debounceMs)
    },
    [debounceMs, flushScheduledSave],
  )

  return {
    scheduleSettingsSave,
    isSaving: isSavingRef,
    lastSavedHash: lastSavedHashRef,
    lastSavedVersion: lastSavedVersionRef,
    pendingChanges: pendingChangesRef,
  }
}
