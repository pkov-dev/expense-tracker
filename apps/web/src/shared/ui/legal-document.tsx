import type { ReactNode } from 'react';

interface LegalDocumentProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

/** Page shell for long-form legal text (terms, privacy policy). */
export function LegalDocument({ title, updatedAt, children }: LegalDocumentProps) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Редакция от {updatedAt}</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </main>
  );
}
