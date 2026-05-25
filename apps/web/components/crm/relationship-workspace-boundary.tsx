"use client"

import React from "react"

import { ErrorState } from "@/components/shared"

type RelationshipWorkspaceBoundaryProps = {
  children: React.ReactNode
  title?: string
  description?: string
}

type RelationshipWorkspaceBoundaryState = {
  hasError: boolean
}

export class RelationshipWorkspaceBoundary extends React.Component<
  RelationshipWorkspaceBoundaryProps,
  RelationshipWorkspaceBoundaryState
> {
  state: RelationshipWorkspaceBoundaryState = { hasError: false }

  static getDerivedStateFromError(): RelationshipWorkspaceBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[relationship-index]", "workspace render boundary", error, info)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={
            this.props.title ?? "Não foi possível exibir o workspace operacional."
          }
          description={
            this.props.description ??
            "Erro ao consolidar relacionamentos do CRM."
          }
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}
