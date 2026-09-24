import { cn } from "@/lib/utils";

const OFFICIAL_LOGO = "/branding/grupo-avila-logo.png";

export function GrupoAvilaLogo({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span className={cn("avila-logo-plate", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={OFFICIAL_LOGO}
        alt="Grupo Ávila"
        className={cn("h-12 w-auto object-contain", imageClassName)}
      />
    </span>
  );
}
