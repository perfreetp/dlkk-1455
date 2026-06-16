import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className = '' }: Props) {
  return (
    <main className={`flex-1 overflow-y-auto bg-slate-50 p-6 ${className}`}>
      {children}
    </main>
  );
}
