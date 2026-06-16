import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  label?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  hint?: string;
}

export default function FormField({ label, children, className = '', required, hint }: Props) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-xs font-medium text-slate-600">
          {label}
          {required && <span className="text-accent-red ml-0.5">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export const inputClass = 'w-full h-9 px-3 text-sm rounded-[2px] border border-slate-300 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition placeholder:text-slate-400';
export const textareaClass = 'w-full px-3 py-2 text-sm rounded-[2px] border border-slate-300 bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition placeholder:text-slate-400 resize-none';
