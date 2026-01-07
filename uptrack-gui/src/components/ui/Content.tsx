import React from 'react';

interface ContentProps {
  children: React.ReactNode;
}

export function Content({ children }: ContentProps) {
  return (
    <div role="main" className="w-full h-full pt-4 pb-4 print:p-0">
      {children}
    </div>
  );
}