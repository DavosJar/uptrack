import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <header role="region" aria-labelledby="page-title" className="flex justify-between items-start mb-8">
      <div className="space-y-2">
        <h1 id="page-title" className="text-3xl font-bold text-text-main">{title}</h1>
        <p className="text-text-muted">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}