import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import StatusBadge from '@/components/common/StatusBadge';
import {
  ClipboardList, Plus, Search, CheckCircle, ChevronDown, ChevronUp,
  AlertTriangle, MinusCircle, PlusCircle, TrendingDown, TrendingUp,
  Package, User, Calendar, FileText, Box, X, Save, Hash
} from 'lucide-react';
import { stocktakeStatusMap, formatDateTime, formatCurrency } from '@/utils/format';
import type { StocktakeOrder } from '@/types';
import { cn } from '@/lib/utils';

export default function Stocktake() {
  const {
    stocktakeOrders, parts,
    createStocktake, updateStocktakeItem, completeStocktake
  } = useStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [partSearch, setPartSearch] = useState('');
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [selectedItemPartId, setSelectedItemPartId] = useState<string | null>(null);
  const [inputQty, setInputQty] = useState<number>(0);
  const [inputReason, setInputReason] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState('');

  const processingOrders = stocktakeOrders.filter(o => o.status === 'processing');
  const completedOrders = stocktakeOrders.filter(o => o.status === 'completed');

  const activeOrder = processingOrders.find(o => o.id === activeOrderId) ?? processingOrders[0] ?? null;

  const filteredParts = useMemo(() => {
    const keyword = partSearch.trim().toLowerCase();
    return parts.filter(p => {
      if (!keyword) return true;
      return p.name.toLowerCase().includes(keyword)
        || p.sku.toLowerCase().includes(keyword)
        || (p.location && p.location.toLowerCase().includes(keyword));
    });
  }, [parts, partSearch]);

  const togglePart = (partId: string) => {
    setSelectedPartIds(prev =>
      prev.includes(partId)
        ? prev.filter(id => id !== partId)
        : [...prev, partId]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredParts.map(p => p.id);
    const allSelected = ids.every(id => selectedPartIds.includes(id));
    if (allSelected) {
      setSelectedPartIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedPartIds(prev => Array.from(new Set([...prev, ...ids])));
    }
  };

  const handleCreate = () => {
    if (selectedPartIds.length === 0) return;
    const newId = createStocktake(selectedPartIds);
    setActiveOrderId(newId);
    setCreateOpen(false);
    setSelectedPartIds([]);
    setPartSearch('');
  };

  const getPartName = (id: string) => useStore.getState().getPartById(id)?.name ?? '-';
  const getPartSku = (id: string) => useStore.getState().getPartById(id)?.sku ?? '-';
  const getPartLocation = (id: string) => useStore.getState().getPartById(id)?.location ?? '-';
  const getPartPrice = (id: string) => useStore.getState().getPartById(id)?.purchasePrice ?? 0;

  const selectedItem = activeOrder?.items.find(it => it.partId === selectedItemPartId);

  const pendingItems = activeOrder?.items.filter(it =>
    it.actualQty === it.systemQty && !it.reason
  ) ?? [];
  const adjustedItems = activeOrder?.items.filter(it =>
    it.diffQty !== 0 || it.reason
  ) ?? [];
  const totalDiffAmount = activeOrder?.items.reduce((s, i) => s + i.diffAmount, 0) ?? 0;
  const totalDiffQty = activeOrder?.items.reduce((s, i) => s + i.diffQty, 0) ?? 0;

  const startEditingItem = (partId: string) => {
    const item = activeOrder?.items.find(it => it.partId === partId);
    setSelectedItemPartId(partId);
    setInputQty(item?.actualQty ?? item?.systemQty ?? 0);
    setInputReason(item?.reason ?? '');
  };

  const saveItem = () => {
    if (!activeOrder || !selectedItemPartId) return;
    const reason = inputReason.trim() || undefined;
    updateStocktakeItem(activeOrder.id, selectedItemPartId, inputQty, reason);
    setSelectedItemPartId(null);
    setInputReason('');
  };

  const handleComplete = () => {
    if (!activeOrder) return;
    completeStocktake(activeOrder.id);
    setActiveOrderId(null);
    setSelectedItemPartId(null);
  };

  const handleScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !scanInput.trim() || !activeOrder) return;
    const code = scanInput.trim().toUpperCase();
    setScanError('');
    setScanSuccess('');
    const foundBySku = activeOrder.items.find(item => {
      const p = useStore.getState().getPartById(item.partId);
      return p && p.sku.toUpperCase() === code;
    });
    if (foundBySku) {
      startEditingItem(foundBySku.partId);
      const p = useStore.getState().getPartById(foundBySku.partId);
      setScanSuccess(`已定位：${p?.name}（${code}）`);
      setTimeout(() => setScanSuccess(''), 2000);
      setScanInput('');
      return;
    }
    const foundByBatch = activeOrder.items.find(item => {
      const batches = useStore.getState().stockBatches.filter(b => b.partId === item.partId);
      return batches.some(b => b.batchNo.toUpperCase() === code);
    });
    if (foundByBatch) {
      startEditingItem(foundByBatch.partId);
      const p = useStore.getState().getPartById(foundByBatch.partId);
      setScanSuccess(`已定位：${p?.name}（批次 ${code}）`);
      setTimeout(() => setScanSuccess(''), 2000);
      setScanInput('');
      return;
    }
    setScanError(`未找到：${code}，请检查编码或该备件不在本盘点单内`);
    setTimeout(() => setScanError(''), 3000);
    setScanInput('');
  };

  const reasonOptions = [
    '正常损耗', '出库未登账', '入库错登', '被盗丢失',
    '损坏报废', '盘点误差', '串号记录', '其他原因'
  ];

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-wide flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-600" strokeWidth={1.8} />
            盘点修正
          </h1>
          <p className="text-xs text-slate-500 mt-1">定期盘点库存，修正账面数量与实际数量差异</p>
        </div>
        <Button
          size="lg"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { setSelectedPartIds([]); setPartSearch(''); setCreateOpen(true); }}
        >
          新建盘点单
        </Button>
      </div>

      {processingOrders.length > 0 && (
        <div className="mb-6 bg-white rounded-[2px] border border-amber-200 shadow-sm">
          <div className="px-5 py-3 border-b border-amber-200 bg-amber-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="font-semibold text-amber-800 text-sm">
                盘点进行中
              </span>
              <div className="flex items-center gap-1">
                {processingOrders.map(o => (
                  <button
                    key={o.id}
                    onClick={() => { setActiveOrderId(o.id); setSelectedItemPartId(null); }}
                    className={cn(
                      'px-2.5 py-1 rounded text-xs font-mono transition-colors',
                      activeOrder?.id === o.id
                        ? 'bg-amber-500 text-white font-semibold'
                        : 'bg-white text-amber-700 border border-amber-300 hover:bg-amber-100'
                    )}
                  >
                    {o.no}
                  </button>
                ))}
              </div>
            </div>
            {activeOrder && (
              <Button
                size="sm"
                variant="secondary"
                icon={<CheckCircle className="w-3.5 h-3.5" />}
                onClick={handleComplete}
              >
                完成盘点
              </Button>
            )}
          </div>

          {activeOrder && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-[480px]">
              <div className="lg:col-span-5 border-r border-slate-200 flex flex-col">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-slate-500" />
                      <span className="font-medium text-slate-700 text-sm">待盘点备件</span>
                      <StatusBadge label={`${pendingItems.length}项`} className="bg-slate-100 text-slate-600 border-slate-200" />
                    </div>
                    {adjustedItems.length > 0 && (
                      <StatusBadge
                        label={`已调整 ${adjustedItems.length}项`}
                        className={cn(
                          totalDiffQty !== 0
                            ? totalDiffQty > 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        )}
                      />
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={e => setScanInput(e.target.value)}
                      onKeyDown={handleScan}
                      placeholder="扫码枪扫 SKU 或批次号，按回车确认..."
                      autoFocus
                      className={cn(
                        'w-full h-9 pl-9 pr-3 text-sm rounded-[2px] border bg-white outline-none transition-colors placeholder:text-slate-400',
                        scanError ? 'border-red-400 ring-1 ring-red-400/30 focus:border-red-500 focus:ring-red-500/50' :
                        scanSuccess ? 'border-emerald-400 ring-1 ring-emerald-400/30' :
                        'border-slate-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40'
                      )}
                    />
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    {scanSuccess && (
                      <div className="absolute left-0 right-0 -bottom-6 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {scanSuccess}
                      </div>
                    )}
                    {scanError && (
                      <div className="absolute left-0 right-0 -bottom-6 text-[11px] text-red-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {scanError}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-6">
                  {activeOrder.items.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">暂无盘点项</p>
                    </div>
                  ) : (
                    activeOrder.items.map(item => {
                      const isActive = selectedItemPartId === item.partId;
                      const isDiff = item.diffQty !== 0;
                      return (
                        <button
                          key={item.partId}
                          onClick={() => startEditingItem(item.partId)}
                          className={cn(
                            'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors',
                            isActive ? 'bg-amber-50 border-l-4 border-l-amber-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent',
                            isDiff ? 'bg-red-50/30' : ''
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-800 text-sm truncate">
                                {getPartName(item.partId)}
                              </span>
                              {isDiff && (
                                <span className={cn(
                                  'shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold',
                                  item.diffQty > 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                )}>
                                  {item.diffQty > 0 ? <PlusCircle className="w-2.5 h-2.5" /> : <MinusCircle className="w-2.5 h-2.5" />}
                                  {item.diffQty > 0 ? '+' : ''}{item.diffQty}
                                </span>
                              )}
                              {!isDiff && item.reason && (
                                <Hash className="w-3 h-3 text-blue-500 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500">
                              <span className="font-mono">{getPartSku(item.partId)}</span>
                              <span className="inline-flex items-center gap-0.5">
                                <Package className="w-2.5 h-2.5" />
                                {getPartLocation(item.partId)}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-3 text-xs">
                              <span className="text-slate-500">
                                系统: <span className="font-mono font-semibold text-slate-700">{item.systemQty}</span>
                              </span>
                              <span className="text-slate-300">→</span>
                              <span className="text-slate-500">
                                实际: <span className={cn(
                                  'font-mono font-semibold',
                                  isDiff
                                    ? item.actualQty > item.systemQty
                                      ? 'text-emerald-600'
                                      : 'text-red-600'
                                    : 'text-slate-700'
                                )}>{item.actualQty}</span>
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={cn('w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform', isActive && 'rotate-180 text-amber-500')} />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col">
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700 text-sm">数量录入</span>
                  </div>
                  {activeOrder.items.length > 0 && (
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-slate-500">
                        盈亏数量: <span className={cn(
                          'font-mono font-semibold ml-1',
                          totalDiffQty > 0 ? 'text-emerald-600' : totalDiffQty < 0 ? 'text-red-600' : 'text-slate-600'
                        )}>
                          {totalDiffQty > 0 ? '+' : ''}{totalDiffQty}
                        </span>
                      </span>
                      <span className="text-slate-500">
                        盈亏金额: <span className={cn(
                          'font-mono font-semibold ml-1',
                          totalDiffAmount > 0 ? 'text-emerald-600' : totalDiffAmount < 0 ? 'text-red-600' : 'text-slate-600'
                        )}>
                          {totalDiffAmount > 0 ? '+' : ''}{formatCurrency(totalDiffAmount)}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {selectedItem ? (
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="mb-6 pb-5 border-b border-slate-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 mb-1">
                            {getPartName(selectedItem.partId)}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{getPartSku(selectedItem.partId)}</span>
                            <span className="inline-flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              库位: {getPartLocation(selectedItem.partId)}
                            </span>
                            <span>
                              单价: <span className="font-mono">{formatCurrency(getPartPrice(selectedItem.partId))}</span>
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedItemPartId(null)}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-slate-100 text-slate-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 rounded border border-slate-200 p-3">
                          <div className="text-[11px] text-slate-500 mb-1">系统库存</div>
                          <div className="text-2xl font-mono font-bold text-slate-700">
                            {selectedItem.systemQty}
                          </div>
                        </div>
                        <div className="bg-amber-50 rounded border border-amber-200 p-3">
                          <div className="text-[11px] text-amber-600 mb-1">实际盘点</div>
                          <div className="text-2xl font-mono font-bold text-amber-700">
                            {inputQty}
                          </div>
                        </div>
                        <div className={cn(
                          'rounded border p-3',
                          inputQty === selectedItem.systemQty
                            ? 'bg-slate-50 border-slate-200'
                            : inputQty > selectedItem.systemQty
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-red-50 border-red-200'
                        )}>
                          <div className={cn('text-[11px] mb-1',
                            inputQty === selectedItem.systemQty ? 'text-slate-500'
                            : inputQty > selectedItem.systemQty ? 'text-emerald-600' : 'text-red-600'
                          )}>
                            盈亏差异
                          </div>
                          <div className={cn('text-2xl font-mono font-bold flex items-center gap-1',
                            inputQty === selectedItem.systemQty ? 'text-slate-600'
                            : inputQty > selectedItem.systemQty ? 'text-emerald-600' : 'text-red-600'
                          )}>
                            {inputQty - selectedItem.systemQty > 0 && <TrendingUp className="w-5 h-5" />}
                            {inputQty - selectedItem.systemQty < 0 && <TrendingDown className="w-5 h-5" />}
                            {inputQty - selectedItem.systemQty > 0 ? '+' : ''}{inputQty - selectedItem.systemQty}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">
                          <span className="text-red-500 mr-0.5">*</span>实际盘点数量
                        </label>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setInputQty(Math.max(0, inputQty - 1))}
                            className="w-10 h-10 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center"
                          >
                            <MinusCircle className="w-5 h-5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={inputQty}
                            onChange={e => setInputQty(Math.max(0, parseInt(e.target.value) || 0))}
                            className="flex-1 h-12 rounded border border-slate-300 bg-white px-4 text-center text-2xl font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                          />
                          <button
                            onClick={() => setInputQty(inputQty + 1)}
                            className="w-10 h-10 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center"
                          >
                            <PlusCircle className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          {[1, 5, 10, -1, -5].map(v => (
                            <button
                              key={v}
                              onClick={() => setInputQty(Math.max(0, inputQty + v))}
                              className={cn(
                                'px-2.5 py-1 rounded text-xs font-mono border transition-colors',
                                v > 0
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                              )}
                            >
                              {v > 0 ? '+' : ''}{v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {inputQty !== selectedItem.systemQty && (
                        <div className="bg-amber-50/60 border border-amber-200 rounded p-4">
                          <div className="flex items-start gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium text-amber-800">检测到数量差异</div>
                              <div className="text-xs text-amber-600 mt-0.5">
                                系统库存 {selectedItem.systemQty} vs 实际 {inputQty}，
                                差额 {inputQty - selectedItem.systemQty > 0 ? '+' : ''}{inputQty - selectedItem.systemQty}
                                ({formatCurrency((inputQty - selectedItem.systemQty) * getPartPrice(selectedItem.partId))})
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-2">
                              <span className="text-red-500 mr-0.5">*</span>盈亏原因
                            </label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {reasonOptions.map(r => (
                                <button
                                  key={r}
                                  type="button"
                                  onClick={() => setInputReason(r)}
                                  className={cn(
                                    'px-3 py-1.5 rounded border text-xs transition-colors',
                                    inputReason === r
                                      ? 'bg-amber-500 border-amber-500 text-white font-medium'
                                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                  )}
                                >
                                  {r}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={inputReason}
                              onChange={e => setInputReason(e.target.value)}
                              placeholder="或输入具体原因说明..."
                              className="w-full h-9 rounded border border-slate-300 bg-white px-3 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <Button
                          size="lg"
                          icon={<Save className="w-4 h-4" />}
                          onClick={saveItem}
                          disabled={inputQty !== selectedItem.systemQty && !inputReason.trim()}
                        >
                          保存盘点项
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                    <ClipboardList className="w-14 h-14 mb-4 opacity-30" strokeWidth={1.5} />
                    <p className="text-sm mb-1">请从左侧选择一个备件</p>
                    <p className="text-xs">录入实际盘点数量和盈亏原因</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-[2px] border border-slate-200 shadow-sm">
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="w-full px-5 py-3.5 border-b border-slate-200 flex items-center justify-between hover:bg-slate-50/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-700 text-sm">已完成盘点单</span>
            <StatusBadge label={`${completedOrders.length} 单`} className="bg-emerald-50 text-emerald-700 border-emerald-200" />
          </div>
          {showCompleted ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showCompleted && (
          completedOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">暂无已完成的盘点单</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {completedOrders.map(order => {
                const isExpanded = expandedOrder === order.id;
                const orderDiffQty = order.items.reduce((s, i) => s + i.diffQty, 0);
                const orderDiffAmount = order.items.reduce((s, i) => s + i.diffAmount, 0);
                const statusInfo = stocktakeStatusMap[order.status];
                return (
                  <div key={order.id}>
                    <div
                      className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <button className="w-5 h-5 flex items-center justify-center text-slate-400 shrink-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono text-sm font-semibold text-slate-800">{order.no}</span>
                          <StatusBadge label={statusInfo.label} className={statusInfo.className} />
                          <span className={cn(
                            'text-xs font-mono font-semibold',
                            orderDiffQty > 0 ? 'text-emerald-600' : orderDiffQty < 0 ? 'text-red-600' : 'text-slate-500'
                          )}>
                            {orderDiffQty > 0 ? '+' : ''}{orderDiffQty} 件
                          </span>
                          <span className={cn(
                            'text-xs font-mono font-semibold',
                            orderDiffAmount > 0 ? 'text-emerald-600' : orderDiffAmount < 0 ? 'text-red-600' : 'text-slate-500'
                          )}>
                            {orderDiffAmount > 0 ? '+' : ''}{formatCurrency(orderDiffAmount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Box className="w-3 h-3" />
                            共 {order.items.length} 项
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {useStore.getState().getEmployeeById(order.operatorId)?.name ?? '-'}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateTime(order.completedAt ?? order.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-0">
                        <div className="ml-9 bg-slate-50 rounded border border-slate-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-100 text-left text-xs text-slate-600 border-b border-slate-200">
                                <th className="px-3 py-2 font-medium">备件名称</th>
                                <th className="px-3 py-2 font-medium">SKU</th>
                                <th className="px-3 py-2 font-medium text-right">系统</th>
                                <th className="px-3 py-2 font-medium text-right">实际</th>
                                <th className="px-3 py-2 font-medium text-right">差异</th>
                                <th className="px-3 py-2 font-medium text-right">差额</th>
                                <th className="px-3 py-2 font-medium">原因</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {order.items.map(item => {
                                const isDiff = item.diffQty !== 0;
                                return (
                                  <tr key={item.partId} className={isDiff ? 'bg-amber-50/30' : ''}>
                                    <td className="px-3 py-2 text-slate-700 font-medium">{getPartName(item.partId)}</td>
                                    <td className="px-3 py-2 text-slate-500 font-mono text-xs">{getPartSku(item.partId)}</td>
                                    <td className="px-3 py-2 text-right font-mono text-slate-600">{item.systemQty}</td>
                                    <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">{item.actualQty}</td>
                                    <td className={cn('px-3 py-2 text-right font-mono font-semibold',
                                      isDiff
                                        ? item.diffQty > 0 ? 'text-emerald-600' : 'text-red-600'
                                        : 'text-slate-400'
                                    )}>
                                      {isDiff && (item.diffQty > 0 ? '+' : '')}{item.diffQty}
                                    </td>
                                    <td className={cn('px-3 py-2 text-right font-mono font-semibold',
                                      isDiff
                                        ? item.diffAmount > 0 ? 'text-emerald-600' : 'text-red-600'
                                        : 'text-slate-400'
                                    )}>
                                      {isDiff && (item.diffAmount > 0 ? '+' : '')}{formatCurrency(item.diffAmount)}
                                    </td>
                                    <td className="px-3 py-2 text-slate-600 text-xs">
                                      {item.reason || <span className="text-slate-300">-</span>}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="新建盘点单"
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreate}
              disabled={selectedPartIds.length === 0}
            >
              创建盘点单 ({selectedPartIds.length}项)
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索备件名称 / SKU / 库位..."
                value={partSearch}
                onChange={e => setPartSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
            <Button variant="outline" size="md" onClick={selectAllFiltered}>
              {filteredParts.every(p => selectedPartIds.includes(p.id)) ? '取消全选' : '全选当前'}
            </Button>
          </div>

          <div className="border border-slate-200 rounded overflow-hidden max-h-[420px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                  <th className="px-3 py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={filteredParts.length > 0 && filteredParts.every(p => selectedPartIds.includes(p.id))}
                      onChange={selectAllFiltered}
                      className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-400"
                    />
                  </th>
                  <th className="px-3 py-2.5 font-medium">备件名称</th>
                  <th className="px-3 py-2.5 font-medium">SKU</th>
                  <th className="px-3 py-2.5 font-medium">库位</th>
                  <th className="px-3 py-2.5 font-medium text-right">系统库存</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      未找到匹配的备件
                    </td>
                  </tr>
                ) : (
                  filteredParts.map(p => {
                    const selected = selectedPartIds.includes(p.id);
                    return (
                      <tr
                        key={p.id}
                        className={cn('cursor-pointer transition-colors', selected ? 'bg-amber-50' : 'hover:bg-slate-50')}
                        onClick={() => togglePart(p.id)}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => togglePart(p.id)}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-400"
                          />
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 font-medium">{p.name}</td>
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">{p.sku}</td>
                        <td className="px-3 py-2.5 text-slate-500 text-xs inline-flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {p.location || '-'}
                        </td>
                        <td className={cn(
                          'px-3 py-2.5 text-right font-mono font-semibold',
                          p.stockQty === 0 ? 'text-red-500' : p.stockQty <= p.safetyStock ? 'text-amber-600' : 'text-slate-700'
                        )}>
                          {p.stockQty}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between">
            <span>
              已选择 <span className="font-semibold text-slate-700">{selectedPartIds.length}</span> 项备件进行盘点
            </span>
            <span>
              共 {parts.length} 项备件，筛选出 {filteredParts.length} 项
            </span>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
