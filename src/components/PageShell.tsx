import { TopBar } from "@/components/TopBar";

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">{title}</h1>
        {children}
      </main>
    </div>
  );
}
