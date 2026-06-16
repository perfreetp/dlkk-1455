import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import {
  ArrowLeft, Package, MapPin, Shield, AlertTriangle,
  Image as ImageIcon, TrendingUp, TrendingDown, Minus,
  ArrowDownCircle, ArrowUpCircle, Calendar, User,
  ChevronDown, ChevronRight, Building2
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import Button from '@/components/common/Button';
import Empty from '@/components/common/Empty';
import {
  formatCurrency, formatDateTime, qualityLevelMap,
  stockInSourceMap, stockOutTypeMap
} from '@/utils/format';
import { cn } from '@/lib/utils';

type TabKey = 'flow' | 'photos' | 'price';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'flow', label: '出入库流水' },
  { key: 'photos', label: '批次照片' },
  { key: 'price', label: '价格变动历史' },
];

const PRICE_FIELD_LABEL: Record<string, string> = {
  purchasePrice: '进货价',
  retailPrice: '零售价',
};

export default function InventoryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    initData, getPartById, getCategoryById, getSupplierById, getEmployeeById,
    stockInList, stockOutList, stockBatches, batchPhotos, priceHistory
  } = useStore();

  useEffect(() => { initData(); }, [initData]);

  const [activeTab, setActiveTab] = useState<TabKey>('flow');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [expandedPhotos, setExpandedPhotos] = useState<Set<string>>(new Set());

  const part = id ? getPartById(id) : undefined;
  const category = part ? getCategoryById(part.categoryId) : undefined;
  const supplier = part ? getSupplierById(part.supplierId) : undefined;
  const qualityInfo = part ? qualityLevelMap[part.qualityLevel] : undefined;

  const relatedStockIn = useMemo(() => {
    if (!id) return [];
    return stockInList
      .filter(si => si.items.some(item => item.partId === id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [id, stockInList]);

  const relatedStockOut = useMemo(() => {
    if (!id) return [];
    return stockOutList
      .filter(so => so.items.some(item => item.partId === id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [id, stockOutList]);

  const allFlowRecords = useMemo(() => {
    const inRecords = relatedStockIn.map(si => {
      const item = si.items.find(i => i.partId === id)!;
      return {
        id: si.id,
        type: 'in' as const,
        no: si.no,
        subtype: si.source,
        qty: item.qty,
        unitPrice: item.purchasePrice,
        totalAmount: item.qty * item.purchasePrice,
        operatorId: si.operatorId,
        createdAt: si.createdAt,
        remark: si.remark ?? '',
        extra: si.supplierId ? getSupplierById(si.supplierId)?.name : undefined,
      };
    });
    const outRecords = relatedStockOut.map(so => {
      const item = so.items.find(i => i.partId === id)!;
      return {
        id: so.id,
        type: 'out' as const,
        no: so.no,
        subtype: so.type,
        qty: item.qty,
        unitPrice: item.unitPrice,
        totalAmount: item.qty * item.unitPrice,
        operatorId: so.operatorId,
        createdAt: so.createdAt,
        remark: so.remark ?? '',
        extra: so.repairOrderNo ?? so.customerName ?? so.damageReason ?? so.user ?? '',
      };
    });
    return [...inRecords, ...outRecords]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [relatedStockIn, relatedStockOut, id, getSupplierById]);

  const partBatches = useMemo(() => {
    if (!id) return [];
    return stockBatches.filter(b => b.partId === id);
  }, [id, stockBatches]);

  const partBatchPhotos = useMemo(() => {
    const batchIds = new Set(partBatches.map(b => b.id));
    return batchPhotos.filter(bp => batchIds.has(bp.batchId));
  }, [partBatches, batchPhotos]);

  const photosByBatch = useMemo(() => {
    const map = new Map<string, typeof partBatchPhotos>();
    partBatchPhotos.forEach(bp => {
      if (!map.has(bp.batchId)) map.set(bp.batchId, []);
      map.get(bp.batchId)!.push(bp);
    });
    return map;
  }, [partBatchPhotos]);

  const partPriceHistory = useMemo(() => {
    if (!id) return [];
    return priceHistory
      .filter(ph => ph.partId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [id, priceHistory]);

  const toggleBatchPhotos = (batchId: string) => {
    setExpandedPhotos(prev => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  };

  if (!part) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/inventory')}>
            返回备件列表
          </Button>
        </div>
        <Empty title="未找到备件记录" description="该备件可能已被删除，或链接无效" />
      </div>
    );
  }

  const lowStock = part.stockQty <= part.safetyStock;

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/inventory')}
          className="shrink-0 mt-0.5"
        >
          返回
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-800 break-words">{part.name}</h1>
            {qualityInfo && (
              <StatusBadge label={qualityInfo.label} className={qualityInfo.className} />
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="font-mono">SKU: {part.sku}</span>
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {category?.name ?? '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>当前库存</span>
            </div>
            <div className="flex items-end gap-2">
              <span className={cn(
                'text-2xl font-bold font-mono',
                lowStock ? 'text-accent-red' : 'text-slate-800'
              )}>
                {part.stockQty}
              </span>
              <span className="text-xs text-slate-400 mb-1">件</span>
              {lowStock && <AlertTriangle className="w-4 h-4 text-accent-amber mb-1" />}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              安全库存: {part.safetyStock} 件
              {part.lastMoveDate && (
                <span className="ml-2">
                  最近变动: {formatDateTime(part.lastMoveDate)}
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>进货价</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 font-mono">
              {formatCurrency(part.purchasePrice)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              库存价值: {formatCurrency(part.stockQty * part.purchasePrice)}
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>零售价</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono">
              {formatCurrency(part.retailPrice)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              毛利率: {part.retailPrice > 0 ? ((part.retailPrice - part.purchasePrice) / part.retailPrice * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>保修</span>
            </div>
            <div className="text-2xl font-bold text-slate-800 font-mono">
              {part.warrantyDays}
              <span className="text-sm font-normal text-slate-500 ml-1">天</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              维修次数: {part.repairCount} 次
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2.5 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0 w-20">品类：</span>
              <span className="text-slate-800">{category?.name ?? '-'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0 w-20">适配机型：</span>
              <span className="text-slate-800">{part.compatibleModels.length > 0 ? part.compatibleModels.join('、') : '-'}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0 w-20">供应商：</span>
              <span className="text-slate-800 flex items-center gap-1">
                {supplier ? (
                  <>
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {supplier.name}
                    {supplier.contact && <span className="text-slate-400">（{supplier.contact}）</span>}
                  </>
                ) : '-'}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span className="text-slate-500 shrink-0 w-16">库位：</span>
              <span className="text-slate-800 font-mono">{part.location || '-'}</span>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span className="text-slate-500 shrink-0 w-16">创建：</span>
              <span className="text-slate-800">{formatDateTime(part.createdAt)}</span>
            </div>
            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span className="text-slate-500 shrink-0 w-16">更新：</span>
              <span className="text-slate-800">{formatDateTime(part.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-card overflow-hidden">
        <div className="flex border-b border-slate-200 px-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors relative',
                activeTab === tab.key
                  ? 'text-accent-amber'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-amber rounded-t" />
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === 'flow' && (
            <div className="overflow-x-auto">
              {allFlowRecords.length === 0 ? (
                <Empty title="暂无出入库记录" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">类型</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">单号</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">来源/去向</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">数量</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">单价</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">金额</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">操作人</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">时间</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFlowRecords.map(r => {
                      const isIn = r.type === 'in';
                      const typeMap = isIn ? stockInSourceMap : stockOutTypeMap;
                      const info = typeMap[r.subtype as string];
                      const operator = getEmployeeById(r.operatorId);
                      return (
                        <tr key={r.id + r.type} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5">
                              {isIn ? (
                                <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <ArrowUpCircle className="w-4 h-4 text-red-500" />
                              )}
                              <StatusBadge
                                label={(isIn ? '入库' : '出库') + ' · ' + (info?.label ?? r.subtype)}
                                className={cn(
                                  isIn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                )}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{r.no}</td>
                          <td className="px-3 py-2.5 text-slate-600">{r.extra || '-'}</td>
                          <td className={cn('px-3 py-2.5 text-right font-mono font-semibold', isIn ? 'text-emerald-600' : 'text-red-600')}>
                            {isIn ? '+' : '-'}{r.qty}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-600 font-mono text-xs">{formatCurrency(r.unitPrice)}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-800">{formatCurrency(r.totalAmount)}</td>
                          <td className="px-3 py-2.5 text-slate-600">{operator?.name ?? '-'}</td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs max-w-[180px] truncate">{r.remark || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div>
              {partBatchPhotos.length === 0 ? (
                <Empty
                  title="暂无批次照片"
                  description="入库时上传的发票、包装、实物照片会在此展示"
                />
              ) : (
                <div className="space-y-3">
                  {partBatches.length > 0 ? (
                    partBatches.map(batch => {
                      const photos = photosByBatch.get(batch.id) ?? [];
                      const isExpanded = expandedPhotos.has(batch.id) || partBatches.length === 1;
                      return (
                        <div key={batch.id} className="border border-slate-200 rounded overflow-hidden">
                          <button
                            onClick={() => toggleBatchPhotos(batch.id)}
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-500" />
                              )}
                              <div>
                                <span className="font-mono text-sm font-semibold text-slate-700">{batch.batchNo}</span>
                                <span className="text-xs text-slate-400 ml-3">
                                  入库: {formatDateTime(batch.inboundDate)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>数量: {batch.qty}/{batch.inboundQty}</span>
                              <span>进价: {formatCurrency(batch.purchasePrice)}</span>
                              <span className="flex items-center gap-1">
                                <ImageIcon className="w-3.5 h-3.5" />
                                {photos.length}
                              </span>
                            </div>
                          </button>
                          {isExpanded && photos.length > 0 && (
                            <div className="p-4 border-t border-slate-100">
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {photos.map(photo => (
                                  <div
                                    key={photo.id}
                                    className="group relative aspect-square rounded overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer hover:border-accent-amber transition-colors"
                                    onClick={() => setPhotoPreview(photo.url)}
                                  >
                                    <img
                                      src={photo.url}
                                      alt={photo.remark || batch.batchNo}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      loading="lazy"
                                    />
                                    <div className="absolute top-1 left-1">
                                      <StatusBadge
                                        label={photo.type === 'invoice' ? '发票' : photo.type === 'package' ? '包装' : '实物'}
                                        className={cn(
                                          photo.type === 'invoice' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                          photo.type === 'package' ? 'bg-slate-50 text-slate-700 border-slate-200' :
                                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        )}
                                      />
                                    </div>
                                    {photo.remark && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                        <p className="text-[11px] text-white line-clamp-2">{photo.remark}</p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {isExpanded && photos.length === 0 && (
                            <div className="p-6 border-t border-slate-100 text-center text-xs text-slate-400">
                              该批次暂未上传照片
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <Empty title="暂无批次信息" />
                  )}
                </div>
              )}

              {photoPreview && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                  onClick={() => setPhotoPreview(null)}
                >
                  <img
                    src={photoPreview}
                    alt="预览"
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded shadow-2xl"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'price' && (
            <div className="overflow-x-auto">
              {partPriceHistory.length === 0 ? (
                <Empty title="暂无价格变动记录" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">价格类型</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">原价</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">新价</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">变动</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">变动幅度</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">操作人</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-700 text-xs uppercase tracking-wider">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partPriceHistory.map(ph => {
                      const diff = ph.newValue - ph.oldValue;
                      const pct = ph.oldValue > 0 ? (diff / ph.oldValue * 100) : 0;
                      const operator = getEmployeeById(ph.operatorId);
                      const isUp = diff > 0;
                      const isDown = diff < 0;
                      return (
                        <tr key={ph.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                          <td className="px-3 py-2.5">
                            <StatusBadge
                              label={PRICE_FIELD_LABEL[ph.field] ?? ph.field}
                              className={ph.field === 'purchasePrice' ? 'bg-slate-50 text-slate-700 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-500 line-through text-xs">{formatCurrency(ph.oldValue)}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-800">{formatCurrency(ph.newValue)}</td>
                          <td className={cn('px-3 py-2.5 text-right font-mono font-semibold', isUp ? 'text-red-600' : isDown ? 'text-emerald-600' : 'text-slate-500')}>
                            <div className="flex items-center justify-end gap-1">
                              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                              {isUp ? '+' : ''}{formatCurrency(diff)}
                            </div>
                          </td>
                          <td className={cn('px-3 py-2.5 text-right font-mono text-xs', isUp ? 'text-red-600' : isDown ? 'text-emerald-600' : 'text-slate-400')}>
                            {isUp ? '+' : ''}{pct.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{operator?.name ?? '-'}</td>
                          <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(ph.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
