export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="insure-main-surface relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.64_0.19_252/0.18),transparent)]"
      />
      {children}
    </div>
  )
}
