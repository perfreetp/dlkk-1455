import { useEffect, useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Warehouse, ArrowUpDown, Package, AlertTriangle,
  PackageCheck, Minus, Plus, Search
} from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { useStore } from '@/store';
import {
  formatCurrency, formatNumber, formatDate, daysSince
} from '@/utils/format';
import type { Part } from '@/types';

export default function Dashboard() {
  const {
    initData, parts, stockInList, stockOutList, stockOut, addToast,
    getTotalStockValue
  } = useStore();

  const [quickOutPart, setQuickOutPart] = useState<Part | null>(null);
  const [quickOutQty, setQuickOutQty] = useState(1);

  useEffect(() => {
    initData();
  }, [initData]);

  const totalStockValue = useMemo(() => getTotalStockValue(), [getTotalStockValue]);

  const todayOutQty = useMemo(() => {
    const today = new Date().toDateString();
    return stockOutList
      .filter(o => new Date(o.createdAt).toDateString() === today)
      .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0), 0);
  }, [stockOutList]);

  const totalPartsCount = parts.length;

  const warningParts = useMemo(
    () => parts.filter(p => p.stockQty <= p.safetyStock),
    [parts]
  );

  const chartData = useMemo(() => {
    const days = 7;
    const result: { date: string; 入库: number; 出库: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      const inQty = stockInList
        .filter(s => new Date(s.createdAt).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.items.reduce((a, b) => a + b.qty, 0), 0);
      const outQty = stockOutList
        .filter(s => new Date(s.createdAt).toDateString() === dateStr)
        .reduce((sum, s) => sum + s.items.reduce((a, b) => a + b.qty, 0), 0);
      result.push({ date: label, 入库: inQty, 出库: outQty });
    }
    return result;
  }, [stockInList, stockOutList]);

  const hotParts = useMemo(() => {
    return [...parts]
      .filter(p => p.stockQty > 0)
      .sort((a, b) => b.repairCount - a.repairCount || b.stockQty - a.stockQty)
      .slice(0, 6);
  }, [parts]);

  const lowStockTop10 = useMemo(() => {
    return [...warningParts]
      .sort((a, b) => {
        const ra = a.stockQty / Math.max(a.safetyStock, 1);
        const rb = b.stockQty / Math.max(b.safetyStock, 1);
        return ra - rb;
      })
      .slice(0, 10);
  }, [warningParts]);

  const handleQuickOut = () => {
    if (!quickOutPart) return;
    if (quickOutQty <= 0) {
      addToast('error', '出库数量必须大于 0');
      return;
    }
    if (quickOutQty > quickOutPart.stockQty) {
      addToast('error', `${quickOutPart.name} 库存不足`);
      return;
    }
    const result = stockOut({
      type: 'repair',
      items: [{
        partId: quickOutPart.id,
        qty: quickOutQty,
        unitPrice: quickOutPart.retailPrice,
      }],
      remark: '快捷出库',
    });
    if (result.success) {
      setQuickOutPart(null);
      setQuickOutQty(1);
    }
  };

  const openQuickOut = (part: Part) => {
    setQuickOutPart(part);
    setQuickOutQty(1);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="库存总值"
          value={formatCurrency(totalStockValue)}
          sub={`共 ${totalPartsCount} 种备件`}
          icon={Warehouse}
          color="amber"
        />
        <StatCard
          title="今日出库"
          value={formatNumber(todayOutQty, 0)}
          sub="件数"
          icon={ArrowUpDown}
          color="blue"
        />
        <StatCard
          title="备件总数"
          value={formatNumber(totalPartsCount, 0)}
          sub="SKU 数"
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="预警数量"
          value={formatNumber(warningParts.length, 0)}
          sub="低于安全库存"
          icon={AlertTriangle}
          color="red"
          trend={warningParts.length > 0 ? undefined : 0}
        />
      </div>

      <div className="bg-white rounded-[2px] border border-slate-200 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-amber-500 rounded" />
            <h2 className="font-bold text-slate-800">近7天出入库数量</h2>
          </div>
          <span className="text-xs text-slate-400">单位：件</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08)',
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                iconType="rect"
                iconSize={10}
              />
              <Bar
                dataKey="入库"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="出库"
                fill="#f59e0b"
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-[2px] border border-slate-200 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500 rounded" />
            <h2 className="font-bold text-slate-800">常用备件快捷出库</h2>
          </div>
          <span className="text-xs text-slate-400">点击卡片快速出库</span>
        </div>
        {hotParts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">暂无可用备件</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {hotParts.map(part => {
              const lowStock = part.stockQty <= part.safetyStock;
              return (
                <button
                  key={part.id}
                  onClick={() => openQuickOut(part)}
                  className="text-left p-4 rounded-[2px] border border-slate-200 hover:border-amber-400 hover:shadow-card-hover transition-all group bg-slate-50 hover:bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-9 h-9 rounded-[2px] bg-slate-100 group-hover:bg-amber-50 border border-slate-200 group-hover:border-amber-200 flex items-center justify-center text-slate-500 group-hover:text-amber-600 transition-colors">
                      <Package className="w-5 h-5" />
                    </div>
                    <PackageCheck className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mb-1 truncate group-hover:text-amber-700">
                    {part.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2 truncate">{part.sku}</div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-semibold ${
                      lowStock ? 'text-red-600' : 'text-slate-700'
                    }`}>
                      库存 {part.stockQty}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatCurrency(part.retailPrice)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2px] border border-slate-200 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-red-500 rounded" />
            <h2 className="font-bold text-slate-800">低库存预警 Top10</h2>
          </div>
          <span className="text-xs text-slate-400">共 {warningParts.length} 项预警</span>
        </div>
        {lowStockTop10.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            <Search className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            暂无低库存预警
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">排名</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">备件名称</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">SKU</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">库位</th>
                  <th className="text-right font-medium px-5 py-3 whitespace-nowrap">当前库存</th>
                  <th className="text-right font-medium px-5 py-3 whitespace-nowrap">安全库存</th>
                  <th className="text-right font-medium px-5 py-3 whitespace-nowrap">缺货程度</th>
                  <th className="text-left font-medium px-5 py-3 whitespace-nowrap">最近变动</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockTop10.map((part, idx) => {
                  const ratio = part.safetyStock > 0 ? part.stockQty / part.safetyStock : 0;
                  let severityColor = 'bg-amber-100 text-amber-700 border-amber-200';
                  let severityLabel = '偏低';
                  if (part.stockQty === 0) {
                    severityColor = 'bg-red-100 text-red-700 border-red-200';
                    severityLabel = '断货';
                  } else if (ratio <= 0.3) {
                    severityColor = 'bg-red-50 text-red-600 border-red-200';
                    severityLabel = '紧急';
                  } else if (ratio <= 0.6) {
                    severityColor = 'bg-orange-50 text-orange-600 border-orange-200';
                    severityLabel = '告急';
                  }
                  return (
                    <tr key={part.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                          idx < 3 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {part.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {part.sku}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-mono">
                          {part.location}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-semibold text-red-600 whitespace-nowrap">
                        {part.stockQty}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-slate-500 whitespace-nowrap">
                        {part.safetyStock}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${severityColor}`}>
                          {severityLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {daysSince(part.lastMoveDate) === 0
                          ? '今天'
                          : `${daysSince(part.lastMoveDate)} 天前 (${formatDate(part.lastMoveDate)})`
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!quickOutPart}
        onClose={() => setQuickOutPart(null)}
        title="快捷出库确认"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setQuickOutPart(null)}>
              取消
            </Button>
            <Button
              onClick={handleQuickOut}
              disabled={!quickOutPart || quickOutQty <= 0 || quickOutQty > (quickOutPart?.stockQty ?? 0)}
            >
              <PackageCheck className="w-4 h-4" />
              确认出库
            </Button>
          </>
        }
      >
        {quickOutPart && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-[2px] border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-[2px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{quickOutPart.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5 font-mono">{quickOutPart.sku}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-slate-500">
                      当前库存：<span className="font-mono font-semibold text-slate-700">{quickOutPart.stockQty}</span>
                    </span>
                    <span className="text-slate-500">
                      单价：<span className="font-mono font-semibold text-slate-700">
                        {formatCurrency(quickOutPart.retailPrice)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">出库数量</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickOutQty(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-[2px] border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={quickOutPart.stockQty}
                  value={quickOutQty}
                  onChange={e => setQuickOutQty(Math.max(1, Math.min(quickOutPart.stockQty, parseInt(e.target.value) || 1)))}
                  className="flex-1 h-9 px-3 rounded-[2px] border border-slate-300 text-center font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setQuickOutQty(q => Math.min(quickOutPart.stockQty, q + 1))}
                  className="w-9 h-9 rounded-[2px] border border-slate-300 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-[2px]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">出库金额</span>
                <span className="font-bold text-amber-700 font-mono">
                  {formatCurrency(quickOutPart.retailPrice * quickOutQty)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
