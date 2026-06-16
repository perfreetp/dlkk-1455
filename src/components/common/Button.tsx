import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export default function Button({ variant = 'primary', size = 'md', icon, className = '', children, ...rest }: Props) {
  const variants = {
    primary: 'bg-accent-amber text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm',
    secondary: 'bg-slate-800 text-white hover:bg-slate-900',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-accent-red text-white hover:bg-red-600',
    outline: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
  };
  const sizes = {
    sm: 'h-7 px-2.5 text-xs gap-1',
    md: 'h-9 px-3.5 text-sm gap-1.5',
    lg: 'h-11 px-5 text-sm gap-2',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-[2px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
