import { PackageOpen } from 'lucide-react';

interface Props {
  title?: string;
  description?: string;
}

export default function Empty({ title = '暂无数据', description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-3">
        <PackageOpen className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {description && <div className="text-xs text-slate-400 mt-1 text-center max-w-sm">{description}</div>}
    </div>
  );
}
