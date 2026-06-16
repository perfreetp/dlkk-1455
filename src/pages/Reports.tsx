import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import {
  AlertTriangle, Clock, RefreshCcw, TrendingUp, DollarSign,
  Package, ArrowRight, Flame, Ban
} from 'lucide-react';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import StatCard from '@/components/common/StatCard';
import { daysSince, formatCurrency, formatDate, formatNumber, getDaysAgoDateStr } from '@/utils/format';
import { cn } from '@/lib/utils';

type TabKey = 'lowStock' | 'noMove' | 'highRepair' | 'abnormalMargin' | 'hotSale';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: typeof AlertTriangle;
}

const TABS: TabConfig[] = [
  { key: 'lowStock', label: '低库存预警', icon: AlertTriangle },
  { key: 'noMove', label: '久未动销', icon: Clock },
  { key: 'highRepair', label: '高返修批次', icon: RefreshCcw },
  { key: 'abnormalMargin', label: '毛利异常', icon: DollarSign },
  { key: 'hotSale', label: '热销备件', icon: TrendingUp },
];

export default function Reports() {
  const navigate = useNavigate();
  const { parts, categories, suppliers, stockBatches, stockOutList, initData } = useStore();
  const [activeTab, setActiveTab] = useState<TabKey>('lowStock');

  useEffect(() => { initData(); }, [initData]);

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '-';
  const supplierName = (id: string) => suppliers.find(s => s.id === id)?.name ?? '-';
  const partById = (id: string) => parts.find(p => p.id === id);

  const lowStockList = useMemo(() => {
    return parts
      .filter(p => p.stockQty <= p.safetyStock)
      .map(p => {
        const ratio = p.safetyStock > 0 ? p.stockQty / p.safetyStock : 0;
        const diff = p.safetyStock - p.stockQty;
        return { ...p, ratio, diff };
      })
      .sort((a, b) => a.ratio - b.ratio);
  }, [parts]);

  const noMoveList = useMemo(() => {
    return parts
      .filter(p => daysSince(p.lastMoveDate) > 90 && p.stockQty > 0)
      .map(p => ({ ...p, idleDays: daysSince(p.lastMoveDate) }))
      .sort((a, b) => b.idleDays - a.idleDays);
  }, [parts]);

  const highRepairList = useMemo(() => {
    return stockBatches
      .filter(b => b.inboundQty > 0 && (b.repairCount / b.inboundQty) > 0.05)
      .map(b => {
        const repairRate = b.inboundQty > 0 ? (b.repairCount / b.inboundQty) * 100 : 0;
        const part = partById(b.partId);
        return { ...b, repairRate, partName: part?.name ?? '-', partSku: part?.sku ?? '-' };
      })
      .sort((a, b) => b.repairRate - a.repairRate);
  }, [stockBatches, parts]);

  const abnormalMarginList = useMemo(() => {
    return parts
      .filter(p => {
        const margin = p.retailPrice - p.purchasePrice;
        const marginRate = p.retailPrice > 0 ? margin / p.retailPrice : -1;
        return marginRate < 0.1 || p.retailPrice < p.purchasePrice;
      })
      .map(p => {
        const marginAmount = p.retailPrice - p.purchasePrice;
        const marginRate = p.retailPrice > 0 ? (marginAmount / p.retailPrice) * 100 : -100;
        const isLoss = p.retailPrice < p.purchasePrice;
        return { ...p, marginAmount, marginRate, isLoss };
      })
      .sort((a, b) => a.marginRate - b.marginRate);
  }, [parts]);

  const hotSaleList = useMemo(() => {
    const thirtyDaysAgo = getDaysAgoDateStr(30);
    const outQtyMap = new Map<string, number>();
    for (const so of stockOutList) {
      if (so.createdAt >= thirtyDaysAgo) {
        for (const item of so.items) {
          outQtyMap.set(item.partId, (outQtyMap.get(item.partId) ?? 0) + item.qty);
        }
      }
    }
    return Array.from(outQtyMap.entries())
      .map(([partId, qty]) => {
        const part = partById(partId);
        return {
          partId,
          qty,
          partName: part?.name ?? '-',
          partSku: part?.sku ?? '-',
          stockQty: part?.stockQty ?? 0,
          safetyStock: part?.safetyStock ?? 0,
          categoryId: part?.categoryId ?? '',
        };
      })
      .filter(x => x.partName !== '-')
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 20);
  }, [stockOutList, parts]);

  const tabCounts: Record<TabKey, number> = {
    lowStock: lowStockList.length,
    noMove: noMoveList.length,
    highRepair: highRepairList.length,
    abnormalMargin: abnormalMarginList.length,
    hotSale: hotSaleList.length,
  };

  const totalLowStockValue = lowStockList.reduce((s, p) => s + p.stockQty * p.purchasePrice, 0);
  const totalIdleValue = noMoveList.reduce((s, p) => s + p.stockQty * p.purchasePrice, 0);
  const totalAbnormalLoss = abnormalMarginList.reduce((s, p) => s + p.marginAmount * p.stockQty, 0);
  const totalHotSaleQty = hotSaleList.reduce((s, x) => s + x.qty, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">预警报表</h1>
          <p className="text-xs text-slate-500 mt-0.5">库存健康度监控与异常预警</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-card">
        <div className="flex border-b border-slate-200 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 shrink-0',
                  active
                    ? 'border-amber-500 text-amber-700 bg-amber-50/40'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={cn(
                  'inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded text-[11px] font-semibold',
                  active ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                )}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-5 space-y-5">
          {activeTab === 'lowStock' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="预警备件数"
                  value={String(lowStockList.length)}
                  sub="需关注补货"
                  icon={AlertTriangle}
                  color="amber"
                />
                <StatCard
                  title="极度危险(库存=0)"
                  value={String(lowStockList.filter(p => p.stockQty === 0).length)}
                  sub="断货风险"
                  icon={Ban}
                  color="red"
                />
                <StatCard
                  title="当前库存总值"
                  value={formatCurrency(totalLowStockValue)}
                  sub="预警范围内"
                  icon={Package}
                  color="amber"
                />
                <StatCard
                  title="平均安全倍数"
                  value={lowStockList.length ? formatNumber(lowStockList.reduce((s, p) => s + p.ratio, 0) / lowStockList.length, 2) + 'x' : '-'}
                  sub="库存/安全库存"
                  icon={TrendingUp}
                  color="blue"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">危险等级</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">SKU</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">名称</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">品类</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">当前库存</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">安全库存</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">差额</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">安全倍数</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <div>暂无低库存预警</div>
                          </td>
                        </tr>
                      ) : lowStockList.map(p => {
                        const dangerLevel = p.ratio === 0 ? 'critical' : p.ratio < 0.3 ? 'high' : p.ratio < 0.6 ? 'medium' : 'low';
                        const levelConfig = {
                          critical: { label: '断货', className: 'bg-red-100 text-red-700 border-red-200' },
                          high: { label: '高危', className: 'bg-orange-100 text-orange-700 border-orange-200' },
                          medium: { label: '中危', className: 'bg-amber-100 text-amber-700 border-amber-200' },
                          low: { label: '低危', className: 'bg-blue-100 text-blue-700 border-blue-200' },
                        };
                        return (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <StatusBadge label={levelConfig[dangerLevel].label} className={levelConfig[dangerLevel].className} />
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
                            <td className="px-4 py-3 text-slate-800 font-medium">{p.name}</td>
                            <td className="px-4 py-3 text-slate-600">{categoryName(p.categoryId)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={dangerLevel === 'critical' ? 'text-red-600 font-bold' : dangerLevel === 'high' ? 'text-orange-600 font-semibold' : 'text-slate-800 font-medium'}>
                                {p.stockQty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">{p.safetyStock}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-medium">-{p.diff}</td>
                            <td className="px-4 py-3 text-right font-mono">
                              <span className={p.ratio < 0.5 ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                                {formatNumber(p.ratio, 2)}x
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                                  onClick={() => navigate('/inventory')}
                                >
                                  补货
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'noMove' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="呆滞备件数"
                  value={String(noMoveList.length)}
                  sub="超90天未动销"
                  icon={Clock}
                  color="amber"
                />
                <StatCard
                  title="超半年未动"
                  value={String(noMoveList.filter(p => p.idleDays > 180).length)}
                  sub="建议优先清库"
                  icon={Ban}
                  color="red"
                />
                <StatCard
                  title="呆滞库存总值"
                  value={formatCurrency(totalIdleValue)}
                  sub="资金占用"
                  icon={DollarSign}
                  color="amber"
                />
                <StatCard
                  title="最长未动销"
                  value={noMoveList.length ? `${noMoveList[0].idleDays}天` : '-'}
                  sub="积压最久"
                  icon={Clock}
                  color="blue"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">建议</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">SKU</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">名称</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">品类</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">库存</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">库存价值</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">最后动销</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">未动销天数</th>
                      </tr>
                    </thead>
                    <tbody>
                      {noMoveList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <div>暂无呆滞备件</div>
                          </td>
                        </tr>
                      ) : noMoveList.map(p => {
                        const isSerious = p.idleDays > 180;
                        const isMedium = p.idleDays > 120;
                        return (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <StatusBadge
                                label={isSerious ? '立即清库' : isMedium ? '建议清库' : '关注'}
                                className={isSerious ? 'bg-red-100 text-red-700 border-red-200' : isMedium ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200'}
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
                            <td className="px-4 py-3 text-slate-800 font-medium">{p.name}</td>
                            <td className="px-4 py-3 text-slate-600">{categoryName(p.categoryId)}</td>
                            <td className="px-4 py-3 text-right text-slate-800 font-medium">{p.stockQty}</td>
                            <td className="px-4 py-3 text-right text-slate-700 font-mono">{formatCurrency(p.stockQty * p.purchasePrice)}</td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(p.lastMoveDate)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={isSerious ? 'text-red-600 font-bold' : isMedium ? 'text-orange-600 font-semibold' : 'text-amber-600 font-medium'}>
                                {p.idleDays}天
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'highRepair' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="问题批次"
                  value={String(highRepairList.length)}
                  sub="返修率超5%"
                  icon={RefreshCcw}
                  color="red"
                />
                <StatCard
                  title="高风险(>20%)"
                  value={String(highRepairList.filter(b => b.repairRate > 20).length)}
                  sub="严重质量问题"
                  icon={AlertTriangle}
                  color="red"
                />
                <StatCard
                  title="返修总量"
                  value={String(highRepairList.reduce((s, b) => s + b.repairCount, 0))}
                  sub="件次"
                  icon={RefreshCcw}
                  color="amber"
                />
                <StatCard
                  title="平均返修率"
                  value={highRepairList.length ? formatNumber(highRepairList.reduce((s, b) => s + b.repairRate, 0) / highRepairList.length, 1) + '%' : '-'}
                  sub="加权平均"
                  icon={TrendingUp}
                  color="amber"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">风险等级</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">批次号</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">备件SKU</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">备件名称</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">供应商</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">入库数</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">返修数</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">返修率</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">入库日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highRepairList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                            <RefreshCcw className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <div>暂无高返修批次</div>
                          </td>
                        </tr>
                      ) : highRepairList.map(b => {
                        const level = b.repairRate > 20 ? 'critical' : b.repairRate > 10 ? 'high' : 'medium';
                        const levelConfig = {
                          critical: { label: '极高', className: 'bg-red-100 text-red-700 border-red-200' },
                          high: { label: '高', className: 'bg-orange-100 text-orange-700 border-orange-200' },
                          medium: { label: '中', className: 'bg-amber-100 text-amber-700 border-amber-200' },
                        };
                        return (
                          <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <StatusBadge label={levelConfig[level].label} className={levelConfig[level].className} />
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-700">{b.batchNo}</td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{b.partSku}</td>
                            <td className="px-4 py-3 text-slate-800 font-medium">{b.partName}</td>
                            <td className="px-4 py-3 text-slate-600">{b.supplierId ? supplierName(b.supplierId) : '-'}</td>
                            <td className="px-4 py-3 text-right text-slate-800 font-medium">{b.inboundQty}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-semibold">{b.repairCount}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={level === 'critical' ? 'text-red-600 font-bold' : level === 'high' ? 'text-orange-600 font-semibold' : 'text-amber-600 font-medium'}>
                                {formatNumber(b.repairRate, 1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{formatDate(b.inboundDate)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'abnormalMargin' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="异常备件数"
                  value={String(abnormalMarginList.length)}
                  sub="毛利<10%或亏损"
                  icon={DollarSign}
                  color="red"
                />
                <StatCard
                  title="亏损定价"
                  value={String(abnormalMarginList.filter(p => p.isLoss).length)}
                  sub="售价低于成本"
                  icon={AlertTriangle}
                  color="red"
                />
                <StatCard
                  title="潜在损失"
                  value={formatCurrency(totalAbnormalLoss)}
                  sub="按库存估算"
                  icon={DollarSign}
                  color="red"
                />
                <StatCard
                  title="平均毛利率"
                  value={abnormalMarginList.length ? formatNumber(abnormalMarginList.reduce((s, p) => s + p.marginRate, 0) / abnormalMarginList.length, 1) + '%' : '-'}
                  sub="异常范围内"
                  icon={TrendingUp}
                  color="amber"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">状态</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">SKU</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">名称</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">品类</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">进货价</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">零售价</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">毛利额</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">毛利率</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">库存影响</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abnormalMarginList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <div>暂无毛利异常备件</div>
                          </td>
                        </tr>
                      ) : abnormalMarginList.map(p => (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <StatusBadge
                              label={p.isLoss ? '亏损销售' : '毛利偏低'}
                              className={p.isLoss ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}
                            />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
                          <td className="px-4 py-3 text-slate-800 font-medium">{p.name}</td>
                          <td className="px-4 py-3 text-slate-600">{categoryName(p.categoryId)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.purchasePrice)}</td>
                          <td className="px-4 py-3 text-right text-slate-800 font-medium">{formatCurrency(p.retailPrice)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={p.isLoss ? 'text-red-600 font-semibold' : 'text-amber-600 font-medium'}>
                              {p.marginAmount >= 0 ? '+' : ''}{formatCurrency(p.marginAmount)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={p.isLoss ? 'text-red-600 font-bold' : p.marginRate < 5 ? 'text-orange-600 font-semibold' : 'text-amber-600 font-medium'}>
                              {formatNumber(p.marginRate, 1)}%
                            </span>
                          </td>
                          <td className={cn(
                            'px-4 py-3 text-right font-mono',
                            p.marginAmount * p.stockQty < 0 ? 'text-red-600 font-semibold' : 'text-slate-600'
                          )}>
                            {p.marginAmount * p.stockQty >= 0 ? '+' : ''}{formatCurrency(p.marginAmount * p.stockQty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'hotSale' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="热销备件数"
                  value={String(hotSaleList.length)}
                  sub="近30天TOP20"
                  icon={Flame}
                  color="amber"
                />
                <StatCard
                  title="出库总量"
                  value={String(totalHotSaleQty)}
                  sub="近30天累计"
                  icon={TrendingUp}
                  color="emerald"
                />
                <StatCard
                  title="缺货风险"
                  value={String(hotSaleList.filter(x => x.stockQty <= x.safetyStock).length)}
                  sub="热销且低库存"
                  icon={AlertTriangle}
                  color="red"
                />
                <StatCard
                  title="日均销量TOP"
                  value={hotSaleList.length ? formatNumber(hotSaleList[0].qty / 30, 1) + '/天' : '-'}
                  sub="冠军备件"
                  icon={Flame}
                  color="amber"
                />
              </div>

              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-center px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">排名</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">SKU</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">名称</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">品类</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">30天出库</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">日均</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">当前库存</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">库存状态</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotSaleList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-40" />
                            <div>近30天暂无出库记录</div>
                          </td>
                        </tr>
                      ) : hotSaleList.map((x, idx) => {
                        const isTop3 = idx < 3;
                        const lowStock = x.stockQty <= x.safetyStock;
                        return (
                          <tr key={x.partId} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-3 text-center">
                              <span className={cn(
                                'inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-bold',
                                idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-600'
                              )}>
                                {idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{x.partSku}</td>
                            <td className="px-4 py-3">
                              <span className={isTop3 ? 'text-slate-800 font-semibold' : 'text-slate-800 font-medium'}>
                                {x.partName}
                              </span>
                              {idx === 0 && <Flame className="inline w-4 h-4 ml-1 text-amber-500 -mt-0.5" />}
                            </td>
                            <td className="px-4 py-3 text-slate-600">{categoryName(x.categoryId)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={isTop3 ? 'text-amber-700 font-bold' : 'text-slate-800 font-medium'}>
                                {x.qty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-slate-700">{formatNumber(x.qty / 30, 1)}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={lowStock ? 'text-red-600 font-semibold' : 'text-slate-800 font-medium'}>
                                {x.stockQty}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {lowStock ? (
                                <StatusBadge label="需补货" className="bg-red-100 text-red-700 border-red-200" />
                              ) : x.stockQty <= x.safetyStock * 1.5 ? (
                                <StatusBadge label="库存偏低" className="bg-amber-100 text-amber-700 border-amber-200" />
                              ) : (
                                <StatusBadge label="充足" className="bg-emerald-100 text-emerald-700 border-emerald-200" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {lowStock && (
                                <div className="flex items-center justify-center">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                                    onClick={() => navigate('/inventory')}
                                  >
                                    补货
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
