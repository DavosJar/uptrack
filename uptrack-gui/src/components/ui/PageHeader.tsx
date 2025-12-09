import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        <p className="text-white">{description}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}