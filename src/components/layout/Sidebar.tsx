import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ArrowLeftRight, GitBranch, ClipboardList,
  AlertTriangle, Users, FileText, Settings, Wrench
} from 'lucide-react';
import { useStore } from '@/store';

const menuItems = [
  { path: '/dashboard', label: '库存首页', icon: LayoutDashboard, group: 'main' },
  { path: '/inventory', label: '备件档案', icon: Package, group: 'main' },
  { path: '/stock-movement', label: '入库出库', icon: ArrowLeftRight, group: 'main' },
  { path: '/transfer', label: '门店调拨', icon: GitBranch, group: 'main' },
  { path: '/stocktake', label: '盘点修正', icon: ClipboardList, group: 'main' },
  { path: '/reports', label: '预警报表', icon: AlertTriangle, group: 'main' },
  { path: '/suppliers', label: '供应商', icon: Users, group: 'sub' },
  { path: '/logs', label: '操作日志', icon: FileText, group: 'sub' },
];

export default function Sidebar() {
  const location = useLocation();
  const getCurrentEmployee = useStore(s => s.getCurrentEmployee);
  const employee = getCurrentEmployee();

  const groupTitle = (group: string) => group === 'main' ? '核心功能' : '辅助管理';
  const groups = ['main', 'sub'];

  return (
    <aside className="w-60 bg-primary-800 text-primary-100 h-screen flex flex-col border-r border-primary-900 shrink-0">
      <div className="px-5 py-5 border-b border-primary-700/50 flex items-center gap-3">
        <div className="w-9 h-9 rounded bg-accent-amber text-primary-900 flex items-center justify-center font-bold">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-base tracking-wide">维修库存台账</div>
          <div className="text-xs text-primary-400 mt-0.5">REPAIR SHOP STOCK</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {groups.map(group => (
          <div key={group} className="mb-4">
            <div className="px-3 pb-2 pt-1 text-[11px] uppercase tracking-wider text-primary-500 font-semibold">
              {groupTitle(group)}
            </div>
            <ul className="space-y-0.5">
              {menuItems.filter(m => m.group === group).map(item => {
                const Icon = item.icon;
                const active = location.pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[2px] text-sm transition-all ${
                        active
                          ? 'bg-accent-amber/15 text-accent-amber border-l-2 border-accent-amber -ml-[2px] pl-[10px]'
                          : 'text-primary-200 hover:bg-primary-700/40 hover:text-white'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-primary-700/50">
        <div className="flex items-center gap-3 px-2 py-2 rounded bg-primary-700/30">
          <div className="w-9 h-9 rounded-full bg-accent-blue flex items-center justify-center text-white font-bold text-sm">
            {employee?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{employee?.name ?? '用户'}</div>
            <div className="text-xs text-primary-400">
              {employee?.role === 'admin' ? '店主/管理员' : '员工'}
            </div>
          </div>
          <Settings className="w-4 h-4 text-primary-400 hover:text-white cursor-pointer" />
        </div>
      </div>
    </aside>
  );
}
