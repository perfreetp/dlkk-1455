import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  trend?: number;
  color: 'amber' | 'emerald' | 'red' | 'blue';
}

const colorBg: Record<Props['color'], string> = {
  amber: 'from-amber-500/20 to-amber-500/5 text-amber-600',
  emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600',
  red: 'from-red-500/20 to-red-500/5 text-red-600',
  blue: 'from-blue-500/20 to-blue-500/5 text-blue-600',
};
const colorDot: Record<Props['color'], string> = {
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
};

export default function StatCard({ title, value, sub, icon: Icon, trend, color }: Props) {
  const trendPositive = (trend ?? 0) > 0;
  const trendNegative = (trend ?? 0) < 0;

  return (
    <div className="bg-white rounded-[2px] border border-slate-200 shadow-card hover:shadow-card-hover transition-shadow p-5 flex gap-4">
      <div className={cn('w-12 h-12 rounded-[2px] bg-gradient-to-br flex items-center justify-center shrink-0', colorBg[color])}>
        <Icon className="w-6 h-6" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full ${colorDot[color]}`}></span>
          <span className="text-xs text-slate-500 font-medium tracking-wide">{title}</span>
        </div>
        <div className="text-2xl font-bold text-slate-800 font-mono tracking-tight">{value}</div>
        {sub && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {typeof trend === 'number' && (
              <span className={cn(
                'inline-flex items-center gap-0.5 font-semibold',
                trendPositive ? 'text-emerald-600' : trendNegative ? 'text-red-600' : 'text-slate-400'
              )}>
                {trendPositive ? <TrendingUp className="w-3 h-3" /> : trendNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {Math.abs(trend)}%
              </span>
            )}
            <span className="text-slate-400">{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}
