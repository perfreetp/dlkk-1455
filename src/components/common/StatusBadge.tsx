import { cn } from '@/lib/utils';

interface Props {
  label: string;
  className?: string;
}

export default function StatusBadge({ label, className = '' }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-medium whitespace-nowrap',
      className
    )}>
      {label}
    </span>
  );
}
