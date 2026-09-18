import Image from "next/image"

import { cn } from "@/lib/utils"

const LOGO_SRC = "/branding/grupo-avila-logo.png"

type GrupoAvilaLogoProps = {
  variant?: "plain" | "plate"
  className?: string
  imageClassName?: string
  height?: number
  priority?: boolean
}

export function GrupoAvilaLogo({
  variant = "plain",
  className,
  imageClassName,
  height = 36,
  priority = false,
}: GrupoAvilaLogoProps) {
  const image = (
    <Image
      src={LOGO_SRC}
      alt="Grupo Ávila"
      width={Math.round(height * 2.4)}
      height={height}
      className={cn("h-auto w-auto max-w-full", imageClassName)}
      style={{ height, width: "auto" }}
      priority={priority}
    />
  )

  if (variant === "plate") {
    return (
      <div className={cn("avila-logo-plate inline-flex items-center justify-center", className)}>
        {image}
      </div>
    )
  }

  return <div className={cn("inline-flex items-center", className)}>{image}</div>
}
