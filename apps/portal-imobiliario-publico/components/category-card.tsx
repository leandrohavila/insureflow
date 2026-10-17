import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const TONES = {
  casas: "from-[#1a2744] via-[#10294B] to-[#3d2a12]",
  apartamentos: "from-[#000C24] via-[#10294B] to-[#1A3A66]",
  terrenos: "from-[#0C2418] via-[#10294B] to-[#000C24]",
  comerciais: "from-[#24180C] via-[#10294B] to-[#000C24]",
  lancamentos: "from-[#3d2a12] via-[#1A3A66] to-[#000C24]",
} as const;

export type CategoryTone = keyof typeof TONES;

export function CategoryCard({
  href,
  label,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  tone: CategoryTone;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex min-h-48 overflow-hidden rounded-[24px] bg-gradient-to-br ${TONES[tone]} p-5 text-white shadow-[0_18px_40px_-22px_rgba(0,12,36,.65)] ring-1 ring-white/10 transition duration-300 hover:shadow-[0_28px_50px_-18px_rgba(192,144,72,.55)] hover:ring-[#DEAE5D]/50 motion-safe:hover:-translate-y-1 motion-reduce:transition-none`}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(222,174,93,.35),transparent_52%)] opacity-80 transition duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <Icon
        className="pointer-events-none absolute -bottom-6 -right-4 size-36 text-white/10 transition duration-500 motion-safe:group-hover:scale-110 motion-safe:group-hover:text-[#DEAE5D]/30"
        aria-hidden
      />
      <span className="relative mt-auto block">
        <span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/25 transition duration-300 group-hover:bg-[#DEAE5D] group-hover:text-[#000C24]">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="block text-xl font-semibold tracking-tight">{label}</span>
        <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[#DEAE5D]">
          Explorar
        </span>
      </span>
    </Link>
  );
}
