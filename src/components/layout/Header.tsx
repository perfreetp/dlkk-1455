import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, RefreshCw } from 'lucide-react';
import { useStore } from '@/store';

const titleMap: Record<string, { title: string; subtitle?: string; breadcrumbs: { label: string; to?: string }[] }> = {
  '/dashboard': { title: '库存首页', subtitle: '总览库存状况与快捷操作', breadcrumbs: [{ label: '首页' }] },
  '/inventory': { title: '备件档案', subtitle: '管理备件基础信息与库存数据', breadcrumbs: [{ label: '首页', to: '/dashboard' }, { label: '备件档案' }] },
  '/stock-movement': { title: '入库出库', subtitle: '登记备件出入库流水记录', breadcrumbs: [{ label: '首页', to: '/dashboard' }, { label: '出入库' }] },
  '/transfer': { title: '门店调拨', subtitle: '多门店间备件调拨流转', breadcrumbs: [{ label: '首页', to: '/dashboard' }, { label: '调拨' }] },
  '/stocktake': { title: '盘点修正', subtitle: '实物盘点与库存盈亏调整', breadcrumbs: [{ label: '首页', to: '/dashboard' }, { label: '盘点' }] },
  '/reports': { title: '预警报表', subtitle: '库存预警与数据分析报告', breadcrumbs: [{ label: '首页', to: '/dashboard' }, { label: '报表' }] },
  '/suppliers': { title: '供应商管理', subtitle: '供应商联系人与合作信息', breadcrumbs: [{ label: '首页', to: '/dashboard' }, { label: '供应商' }] },
  '/logs': { title: '操作日志', subtitle: '员工操作审计记录', breadcrumbs: [{ label: '首页', to: '/dashboard' }, { label: '日志' }] },
};

export default function Header() {
  const location = useLocation();
  const addToast = useStore(s => s.addToast);
  const key = Object.keys(titleMap).find(k => location.pathname.startsWith(k));
  const info = titleMap[key ?? '/dashboard'] ?? titleMap['/dashboard'];
  const warningCount = useStore(s => s.parts.filter(p => p.stockQty <= p.safetyStock).length);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1 min-w-0">
        <nav className="text-xs text-slate-500 flex items-center gap-1.5 mb-0.5">
          {info.breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300">/</span>}
              {b.to ? <Link to={b.to} className="hover:text-slate-700">{b.label}</Link> : <span>{b.label}</span>}
            </span>
          ))}
        </nav>
        <div className="flex items-baseline gap-3">
          <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">{info.title}</h1>
          {info.subtitle && <span className="text-xs text-slate-400">{info.subtitle}</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="搜索备件编码 / 名称..."
            className="w-64 h-9 pl-9 pr-3 text-sm rounded-[2px] border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-colors"
          />
        </div>

        <button
          onClick={() => addToast('info', '数据已刷新')}
          className="w-9 h-9 rounded-[2px] border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
          title="刷新数据"
        >
          <RefreshCw className="w-[18px] h-[18px]" />
        </button>

        <button
          className="relative w-9 h-9 rounded-[2px] border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-500 transition-colors"
          title="预警通知"
        >
          <Bell className="w-[18px] h-[18px]" />
          {warningCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-red text-white text-[10px] font-bold flex items-center justify-center">
              {warningCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
