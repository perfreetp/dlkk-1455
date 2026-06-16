import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import PageContainer from '@/components/layout/PageContainer';
import StatCard from '@/components/common/StatCard';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import StatusBadge from '@/components/common/StatusBadge';
import {
  Package, Truck, MapPin, Plus, Search, Send, CheckCircle,
  XCircle, ChevronDown, ChevronUp, Trash2, Building2, User,
  Calendar, FileText, AlertCircle, ArrowDownToLine
} from 'lucide-react';
import { transferStatusMap, formatDateTime, formatCurrency } from '@/utils/format';
import type { TransferItem } from '@/types';
import { cn } from '@/lib/utils';

export default function Transfer() {
  const {
    transferOrders, stores, parts, currentUserId, storeStocks,
    createTransfer, shipTransfer, arriveTransfer, receiveTransfer, cancelTransfer,
    getPartStockByStore,
  } = useStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [toStoreId, setToStoreId] = useState('');
  const [fromStoreId, setFromStoreId] = useState('');
  const [remark, setRemark] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [partSearch, setPartSearch] = useState('');
  const [storePartDropdown, setStorePartDropdown] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const pendingShipCount = transferOrders.filter(t => t.status === 'pending_ship').length;
  const inTransitCount = transferOrders.filter(t => t.status === 'in_transit').length;
  const pendingReceiveCount = transferOrders.filter(t => t.status === 'pending_receive').length;

  const currentStore = stores.find(s => s.id === fromStoreId);

  const filteredParts = useMemo(() => {
    const keyword = partSearch.trim().toLowerCase();
    return parts.filter(p => {
      const qty = fromStoreId ? getPartStockByStore(p.id, fromStoreId) : p.stockQty;
      if (qty <= 0) return false;
      if (!keyword) return true;
      return p.name.toLowerCase().includes(keyword)
        || p.sku.toLowerCase().includes(keyword);
    });
  }, [parts, partSearch, fromStoreId, getPartStockByStore]);

  const addItem = () => {
    if (!selectedPartId || itemQty <= 0) return;
    const existing = items.find(i => i.partId === selectedPartId);
    const totalAfterAdd = existing ? existing.qty + itemQty : itemQty;
    const availableStock = getPartStock(selectedPartId);
    if (totalAfterAdd > availableStock) {
      useStore.getState().addToast('error', `${getPartName(selectedPartId)} 最多可调拨 ${availableStock} 件，已选 ${existing ? existing.qty : 0} 件，再添 ${itemQty} 件会超库存`);
      return;
    }
    if (existing) {
      setItems(items.map(i =>
        i.partId === selectedPartId
          ? { ...i, qty: i.qty + itemQty }
          : i
      ));
    } else {
      setItems([...items, { partId: selectedPartId, qty: itemQty }]);
    }
    setSelectedPartId('');
    setItemQty(1);
    setPartSearch('');
    setStorePartDropdown(false);
  };

  const removeItem = (partId: string) => {
    setItems(items.filter(i => i.partId !== partId));
  };

  const handleCreate = () => {
    if (!fromStoreId || !toStoreId || items.length === 0) return;
    const overstock = items.find(item => item.qty > getPartStock(item.partId));
    if (overstock) {
      useStore.getState().addToast('error', `${getPartName(overstock.partId)} 调拨数量超过调出门店库存，请修正后再提交`);
      return;
    }
    createTransfer(toStoreId, fromStoreId, items, remark);
    setCreateOpen(false);
    setToStoreId('');
    setFromStoreId('');
    setRemark('');
    setItems([]);
  };

  const resetForm = () => {
    setToStoreId('');
    setFromStoreId('');
    setRemark('');
    setItems([]);
    setSelectedPartId('');
    setItemQty(1);
    setPartSearch('');
  };

  const activeOrders = transferOrders.filter(t =>
    t.status === 'pending_ship' || t.status === 'in_transit' || t.status === 'pending_receive'
  );

  const getStoreName = (id: string) => useStore.getState().getStoreById(id)?.name ?? '-';
  const getPartName = (id: string) => useStore.getState().getPartById(id)?.name ?? '-';
  const getPartSku = (id: string) => useStore.getState().getPartById(id)?.sku ?? '';
  const getPartPrice = (id: string) => useStore.getState().getPartById(id)?.purchasePrice ?? 0;
  const getPartStock = (id: string) => fromStoreId ? getPartStockByStore(id, fromStoreId) : (useStore.getState().getPartById(id)?.stockQty ?? 0);

  const totalEstimate = items.reduce((sum, it) => sum + it.qty * getPartPrice(it.partId), 0);
  const selectedItemsTotal = items.reduce((sum, it) => sum + it.qty, 0);

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-wide flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" strokeWidth={1.8} />
            门店调拨
          </h1>
          <p className="text-xs text-slate-500 mt-1">跨门店备件调拨管理，跟踪发货与收货状态</p>
        </div>
        <Button
          size="lg"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => { resetForm(); setCreateOpen(true); }}
        >
          新建调拨
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="待发货"
          value={String(pendingShipCount)}
          sub="待门店确认出库"
          icon={Package}
          color="amber"
        />
        <StatCard
          title="在途"
          value={String(inTransitCount)}
          sub="运输中调拨单"
          icon={Truck}
          color="blue"
        />
        <StatCard
          title="待收货"
          value={String(pendingReceiveCount)}
          sub="待目标门店签收"
          icon={MapPin}
          color="red"
        />
      </div>

      <div className="bg-white rounded-[2px] border border-slate-200 shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700 text-sm">进行中的调拨单</span>
            <span className="text-xs text-slate-400">{activeOrders.length} 单</span>
          </div>
        </div>

        {activeOrders.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Package className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">暂无进行中的调拨单</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeOrders.map(order => {
              const isExpanded = expandedOrder === order.id;
              const statusInfo = transferStatusMap[order.status];
              const orderItemTotal = order.items.reduce((s, i) => s + i.qty, 0);
              return (
                <div key={order.id} className="hover:bg-slate-50/60 transition-colors">
                  <div
                    className="px-5 py-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <button className="w-5 h-5 flex items-center justify-center text-slate-400 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono text-sm font-semibold text-slate-800">{order.no}</span>
                        <StatusBadge label={statusInfo.label} className={statusInfo.className} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {getStoreName(order.fromStoreId)} → {getStoreName(order.toStoreId)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          {order.items.length} 类 / {orderItemTotal} 件
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(order.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {order.status === 'pending_ship' && (
                        <>
                          <Button
                            size="sm"
                            icon={<Send className="w-3.5 h-3.5" />}
                            onClick={(e) => { e.stopPropagation(); shipTransfer(order.id); }}
                          >
                            发货
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<XCircle className="w-3.5 h-3.5" />}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); cancelTransfer(order.id); }}
                          >
                            取消
                          </Button>
                        </>
                      )}
                      {order.status === 'in_transit' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<ArrowDownToLine className="w-3.5 h-3.5" />}
                          onClick={(e) => { e.stopPropagation(); arriveTransfer(order.id); }}
                        >
                          确认到店
                        </Button>
                      )}
                      {order.status === 'pending_receive' && (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<CheckCircle className="w-3.5 h-3.5" />}
                          onClick={(e) => { e.stopPropagation(); receiveTransfer(order.id); }}
                        >
                          确认收货
                        </Button>
                      )}
                      {order.status === 'completed' && (
                        <StatusBadge label="已完成" className="bg-emerald-50 text-emerald-600 border-emerald-200" />
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-0">
                      <div className="ml-9 bg-slate-50 rounded border border-slate-200 p-4">
                        {order.remark && (
                          <div className="mb-3 text-xs text-slate-600">
                            <span className="text-slate-400">备注：</span>{order.remark}
                          </div>
                        )}
                        <div className="mb-3 grid grid-cols-3 gap-3 text-[11px]">
                          <div className="bg-white rounded border border-slate-200 p-2">
                            <div className="text-slate-400 mb-1">调出门店</div>
                            <div className="font-semibold text-slate-700">{getStoreName(order.fromStoreId)}</div>
                          </div>
                          <div className="bg-white rounded border border-slate-200 p-2">
                            <div className="text-slate-400 mb-1">调入门店</div>
                            <div className="font-semibold text-slate-700">{getStoreName(order.toStoreId)}</div>
                          </div>
                          <div className="bg-white rounded border border-slate-200 p-2">
                            <div className="text-slate-400 mb-1">库存状态</div>
                            <div className="font-semibold text-slate-700">
                              {order.status === 'pending_ship' && order.stockDeducted && '已扣减调出'}
                              {order.status === 'pending_ship' && !order.stockDeducted && '待扣减'}
                              {(order.status === 'in_transit' || order.status === 'pending_receive') && order.stockDeducted && '调出已扣、调入待加'}
                              {order.status === 'completed' && '两边已对平'}
                              {order.status === 'cancelled' && '已取消'}
                            </div>
                          </div>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                              <th className="pb-2 font-medium">备件名称</th>
                              <th className="pb-2 font-medium">SKU</th>
                              <th className="pb-2 font-medium text-right">调拨数量</th>
                              <th className="pb-2 font-medium text-right">调出方库存</th>
                              <th className="pb-2 font-medium text-right">调入方库存</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {order.items.map(item => {
                              const fromStock = getPartStockByStore(item.partId, order.fromStoreId);
                              const toStock = getPartStockByStore(item.partId, order.toStoreId);
                              return (
                                <tr key={item.partId}>
                                  <td className="py-2 text-slate-700 font-medium">{getPartName(item.partId)}</td>
                                  <td className="py-2 text-slate-500 font-mono text-xs">{getPartSku(item.partId)}</td>
                                  <td className="py-2 text-right font-mono font-semibold text-slate-800">{item.qty}</td>
                                  <td className="py-2 text-right font-mono text-slate-600">{fromStock}</td>
                                  <td className="py-2 text-right font-mono text-slate-600">{toStock}</td>
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
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="新建调拨单"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreate}
              disabled={
                !fromStoreId || !toStoreId || items.length === 0 ||
                fromStoreId === toStoreId ||
                items.some(item => item.qty > getPartStock(item.partId))
              }
            >
              创建调拨单
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <span className="text-red-500 mr-0.5">*</span>调出门店
              </label>
              <select
                value={fromStoreId}
                onChange={e => setFromStoreId(e.target.value)}
                className={cn(
                  'w-full h-9 rounded-[2px] border text-sm px-3',
                  'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400',
                  fromStoreId ? 'border-slate-300 bg-white' : 'border-slate-300 bg-slate-50 text-slate-400'
                )}
              >
                <option value="">请选择调出门店</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                <span className="text-red-500 mr-0.5">*</span>目标门店
              </label>
              <select
                value={toStoreId}
                onChange={e => setToStoreId(e.target.value)}
                className={cn(
                  'w-full h-9 rounded-[2px] border text-sm px-3',
                  'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400',
                  toStoreId ? 'border-slate-300 bg-white' : 'border-slate-300 bg-slate-50 text-slate-400'
                )}
              >
                <option value="">请选择目标门店</option>
                {stores.filter(s => s.id !== fromStoreId).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {fromStoreId && toStoreId && fromStoreId === toStoreId && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              调出门店与目标门店不能相同
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">
                <span className="text-red-500 mr-0.5">*</span>调拨备件明细
              </label>
              {currentStore && (
                <span className="text-xs text-slate-400">
                  当前库存：{currentStore.name}
                </span>
              )}
            </div>

            <div className="border border-slate-200 rounded-[2px] overflow-hidden">
              <div className="bg-slate-50 px-3 py-2.5 border-b border-slate-200 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索备件名称 / SKU..."
                    value={partSearch}
                    onChange={e => { setPartSearch(e.target.value); setStorePartDropdown(true); }}
                    onFocus={() => setStorePartDropdown(true)}
                    className="w-full h-7 pl-8 pr-3 rounded border border-slate-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                  />
                  {storePartDropdown && filteredParts.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredParts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { setSelectedPartId(p.id); setStorePartDropdown(false); setPartSearch(p.name); }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-xs hover:bg-amber-50 flex items-center justify-between border-b border-slate-100 last:border-0',
                            selectedPartId === p.id ? 'bg-amber-50' : ''
                          )}
                        >
                          <div>
                            <div className="font-medium text-slate-700">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.sku} | {p.location}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-700 font-mono">库存 {getPartStock(p.id)}</div>
                            <div className="text-[10px] text-slate-400">{formatCurrency(p.purchasePrice)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  value={itemQty}
                  onChange={e => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 h-7 rounded border border-slate-300 bg-white text-xs px-2 text-center font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                />
                <Button
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={addItem}
                  disabled={
                    !selectedPartId || itemQty <= 0 ||
                    itemQty + (items.find(i => i.partId === selectedPartId)?.qty ?? 0) > getPartStock(selectedPartId)
                  }
                >
                  添加
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-slate-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  请从上方选择要调拨的备件
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs text-slate-500 border-b border-slate-200">
                      <th className="px-3 py-2 font-medium">备件名称</th>
                      <th className="px-3 py-2 font-medium">SKU</th>
                      <th className="px-3 py-2 font-medium text-right">可用库存</th>
                      <th className="px-3 py-2 font-medium text-right">单价</th>
                      <th className="px-3 py-2 font-medium text-center w-28">调拨数量</th>
                      <th className="px-3 py-2 font-medium text-right">小计</th>
                      <th className="px-3 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map(item => {
                      const stock = getPartStock(item.partId);
                      const price = getPartPrice(item.partId);
                      const overStock = item.qty > stock;
                      return (
                        <tr key={item.partId} className={overStock ? 'bg-red-50/50' : ''}>
                          <td className="px-3 py-2 text-slate-700 font-medium">{getPartName(item.partId)}</td>
                          <td className="px-3 py-2 text-slate-500 font-mono text-xs">{getPartSku(item.partId)}</td>
                          <td className={cn('px-3 py-2 text-right font-mono', overStock ? 'text-red-600 font-semibold' : 'text-slate-600')}>{stock}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">{formatCurrency(price)}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={1}
                              max={stock}
                              value={item.qty}
                              onChange={e => {
                                const v = Math.max(1, parseInt(e.target.value) || 1);
                                setItems(items.map(i => i.partId === item.partId ? { ...i, qty: v } : i));
                              }}
                              className={cn(
                                'w-full h-7 rounded border text-xs text-center font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400',
                                overStock ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                              )}
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                            {formatCurrency(item.qty * price)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => removeItem(item.partId)}
                              className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 text-sm">
                      <td colSpan={5} className="px-3 py-2.5 text-right font-medium text-slate-600">合计：</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-600 text-base">
                        {formatCurrency(totalEstimate)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-400">
                        {selectedItemsTotal}件
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center gap-1">
              <User className="w-3 h-3" />
              调拨备注
            </label>
            <textarea
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="请输入调拨原因、注意事项等（选填）"
              rows={2}
              className="w-full rounded-[2px] border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 resize-none"
            />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
