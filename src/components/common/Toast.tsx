import { createContext, useContext, type ReactNode } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};
const colorMap = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};
const iconColorMap = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useStore(s => s.toasts);
  const removeToast = useStore(s => s.removeToast);

  return (
    <ToastContext.Provider value={null as never}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-80">
        {toasts.map(t => {
          const Icon = iconMap[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3 rounded shadow-lg border text-sm animate-in slide-in-from-right',
                colorMap[t.type]
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0 mt-0.5', iconColorMap[t.type])} />
              <p className="flex-1 leading-relaxed">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToastCtx = () => useContext(ToastContext);
