import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import FormField, { inputClass, textareaClass } from '@/components/common/FormField';
import {
  ArrowDownToLine, ArrowUpFromLine, History, Plus, Trash2,
  Package, Search, ChevronDown, ChevronUp, AlertCircle,
  FileText, Calendar, User, Building2, Filter
} from 'lucide-react';
import type { StockInSource, StockOutType, StockInItem, StockOutItem } from '@/types';
import {
  stockInSourceMap, stockOutTypeMap, formatCurrency,
  formatDateTime, formatDate
} from '@/utils/format';
import { cn } from '@/lib/utils';

type TabKey = 'in' | 'out' | 'history';

interface StockInFormItem extends StockInItem {
  uid: string;
}

interface StockOutFormItem extends StockOutItem {
  uid: string;
}

const genUid = () => Math.random().toString(36).slice(2, 10);

export default function StockMovement() {
  const {
    parts, suppliers, stockInList, stockOutList, employees,
    stockIn, stockOut, getPartById, getSupplierById, getEmployeeById
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabKey>('in');

  const [stockInSource, setStockInSource] = useState<StockInSource>('purchase');
  const [supplierId, setSupplierId] = useState('');
  const [purchaseOrderNo, setPurchaseOrderNo] = useState('');
  const [salvageDeviceNo, setSalvageDeviceNo] = useState('');
  const [stockInItems, setStockInItems] = useState<StockInFormItem[]>([]);
  const [stockInRemark, setStockInRemark] = useState('');
  const [inPartDropdownOpen, setInPartDropdownOpen] = useState<string | null>(null);
  const [inPartSearch, setInPartSearch] = useState('');

  const [stockOutType, setStockOutType] = useState<StockOutType>('repair');
  const [repairOrderNo, setRepairOrderNo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [damageReason, setDamageReason] = useState('');
  const [selfUseUser, setSelfUseUser] = useState('');
  const [stockOutItems, setStockOutItems] = useState<StockOutFormItem[]>([]);
  const [stockOutRemark, setStockOutRemark] = useState('');
  const [outPartDropdownOpen, setOutPartDropdownOpen] = useState<string | null>(null);
  const [outPartSearch, setOutPartSearch] = useState('');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [filterSubType, setFilterSubType] = useState<string>('all');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const filteredParts = useMemo(() => {
    const keyword = inPartSearch.trim().toLowerCase();
    if (!keyword) return parts;
    return parts.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.sku.toLowerCase().includes(keyword)
    );
  }, [parts, inPartSearch]);

  const filteredPartsOut = useMemo(() => {
    const keyword = outPartSearch.trim().toLowerCase();
    return parts.filter(p => {
      if (p.stockQty <= 0) return false;
      if (!keyword) return true;
      return p.name.toLowerCase().includes(keyword) || p.sku.toLowerCase().includes(keyword);
    });
  }, [parts, outPartSearch]);

  const addStockInItem = () => {
    setStockInItems([...stockInItems, {
      uid: genUid(), partId: '', batchNo: '', qty: 1, purchasePrice: 0,
    }]);
  };

  const removeStockInItem = (uid: string) => {
    setStockInItems(stockInItems.filter(i => i.uid !== uid));
  };

  const updateStockInItem = (uid: string, field: keyof StockInFormItem, value: string | number) => {
    setStockInItems(stockInItems.map(i =>
      i.uid === uid ? { ...i, [field]: value } : i
    ));
  };

  const stockInTotal = useMemo(() => {
    return stockInItems.reduce((sum, it) => sum + (it.qty * (Number(it.purchasePrice) || 0)), 0);
  }, [stockInItems]);

  const stockInItemsCount = useMemo(() => {
    return stockInItems.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  }, [stockInItems]);

  const addStockOutItem = () => {
    setStockOutItems([...stockOutItems, {
      uid: genUid(), partId: '', qty: 1, unitPrice: 0,
    }]);
  };

  const removeStockOutItem = (uid: string) => {
    setStockOutItems(stockOutItems.filter(i => i.uid !== uid));
  };

  const updateStockOutItem = (uid: string, field: keyof StockOutFormItem, value: string | number) => {
    setStockOutItems(stockOutItems.map(i =>
      i.uid === uid ? { ...i, [field]: value } : i
    ));
  };

  const stockOutTotal = useMemo(() => {
    return stockOutItems.reduce((sum, it) => sum + (it.qty * (Number(it.unitPrice) || 0)), 0);
  }, [stockOutItems]);

  const stockOutItemsCount = useMemo(() => {
    return stockOutItems.reduce((sum, it) => sum + (Number(it.qty) || 0), 0);
  }, [stockOutItems]);

  const isStockOutValid = useMemo(() => {
    return stockOutItems.every(it => {
      const part = getPartById(it.partId);
      return part && part.stockQty >= it.qty && it.qty > 0;
    });
  }, [stockOutItems, getPartById]);

  const validateStockIn = (): boolean => {
    if (stockInSource === 'purchase') {
      if (!supplierId) { alert('请选择供应商'); return false; }
    }
    if (stockInSource === 'salvage') {
      if (!salvageDeviceNo.trim()) { alert('请输入旧机编号'); return false; }
    }
    if (stockInItems.length === 0) { alert('请至少添加一条备件明细'); return false; }
    for (const item of stockInItems) {
      if (!item.partId) { alert('请选择备件'); return false; }
      if (!item.batchNo.trim()) { alert('请输入批次号'); return false; }
      if (item.qty <= 0) { alert('数量必须大于0'); return false; }
      if (item.purchasePrice <= 0) { alert('单价必须大于0'); return false; }
    }
    return true;
  };

  const validateStockOut = (): boolean => {
    if (stockOutType === 'repair' && !repairOrderNo.trim()) {
      alert('请输入维修工单号'); return false;
    }
    if (stockOutType === 'retail' && !customerName.trim()) {
      alert('请输入客户名称'); return false;
    }
    if (stockOutType === 'damage' && !damageReason.trim()) {
      alert('请填写报损原因'); return false;
    }
    if (stockOutType === 'selfuse' && !selfUseUser.trim()) {
      alert('请填写使用人'); return false;
    }
    if (stockOutItems.length === 0) { alert('请至少添加一条备件明细'); return false; }
    for (const item of stockOutItems) {
      if (!item.partId) { alert('请选择备件'); return false; }
      if (item.qty <= 0) { alert('数量必须大于0'); return false; }
      const part = getPartById(item.partId);
      if (!part || part.stockQty < item.qty) {
        alert(`${part?.name ?? '备件'} 库存不足`); return false;
      }
    }
    return true;
  };

  const handleStockIn = () => {
    if (!validateStockIn()) return;
    const items: StockInItem[] = stockInItems.map(({ uid, ...rest }) => rest);
    const result = stockIn({
      source: stockInSource,
      supplierId: stockInSource === 'purchase' ? supplierId : undefined,
      purchaseOrderNo: stockInSource === 'purchase' ? purchaseOrderNo.trim() || undefined : undefined,
      salvageDeviceNo: stockInSource === 'salvage' ? salvageDeviceNo.trim() : undefined,
      items,
      remark: stockInRemark.trim() || undefined,
    });
    if (result.success) {
      setSupplierId('');
      setPurchaseOrderNo('');
      setSalvageDeviceNo('');
      setStockInItems([]);
      setStockInRemark('');
    }
  };

  const handleStockOut = () => {
    if (!validateStockOut()) return;
    const items: StockOutItem[] = stockOutItems.map(({ uid, ...rest }) => rest);
    const result = stockOut({
      type: stockOutType,
      repairOrderNo: stockOutType === 'repair' ? repairOrderNo.trim() : undefined,
      customerName: stockOutType === 'retail' ? customerName.trim() : undefined,
      damageReason: stockOutType === 'damage' ? damageReason.trim() : undefined,
      user: stockOutType === 'selfuse' ? selfUseUser.trim() : undefined,
      items,
      remark: stockOutRemark.trim() || undefined,
    });
    if (result.success) {
      setRepairOrderNo('');
      setCustomerName('');
      setDamageReason('');
      setSelfUseUser('');
      setStockOutItems([]);
      setStockOutRemark('');
    }
  };

  const flowRecords = useMemo(() => {
    type Record = {
      id: string;
      kind: 'in' | 'out';
      no: string;
      subType: string;
      amount: number;
      itemsCount: number;
      operatorName: string;
      remark?: string;
      sourceDesc?: string;
      typeDesc?: string;
      createdAt: string;
      items: { partId: string; qty: number; price: number }[];
    };
    const records: Record[] = [];

    for (const s of stockInList) {
      records.push({
        id: s.id, kind: 'in', no: s.no, subType: s.source,
        amount: s.totalAmount, itemsCount: s.items.reduce((n, i) => n + i.qty, 0),
        operatorName: getEmployeeById(s.operatorId)?.name ?? '-',
        remark: s.remark, createdAt: s.createdAt,
        sourceDesc: s.supplierId ? getSupplierById(s.supplierId)?.name : undefined,
        items: s.items.map(i => ({ partId: i.partId, qty: i.qty, price: i.purchasePrice })),
      });
    }
    for (const s of stockOutList) {
      records.push({
        id: s.id, kind: 'out', no: s.no, subType: s.type,
        amount: s.totalAmount, itemsCount: s.items.reduce((n, i) => n + i.qty, 0),
        operatorName: getEmployeeById(s.operatorId)?.name ?? '-',
        remark: s.remark, createdAt: s.createdAt,
        typeDesc: s.repairOrderNo || s.customerName || s.damageReason || s.user,
        items: s.items.map(i => ({ partId: i.partId, qty: i.qty, price: i.unitPrice })),
      });
    }

    return records
      .filter(r => {
        if (filterType !== 'all' && r.kind !== filterType) return false;
        if (filterSubType !== 'all' && r.subType !== filterSubType) return false;
        if (filterStartDate) {
          if (formatDate(r.createdAt) < filterStartDate) return false;
        }
        if (filterEndDate) {
          if (formatDate(r.createdAt) > filterEndDate) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [stockInList, stockOutList, filterType, filterSubType, filterStartDate, filterEndDate, getEmployeeById, getSupplierById]);

  const tabs = [
    { key: 'in' as const, label: '入库登记', icon: ArrowDownToLine },
    { key: 'out' as const, label: '出库登记', icon: ArrowUpFromLine },
    { key: 'history' as const, label: '出入库流水', icon: History },
  ];

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800 tracking-wide flex items-center gap-2 mb-1">
          <Package className="w-6 h-6 text-amber-600" strokeWidth={1.8} />
          出入库管理
        </h1>
        <p className="text-xs text-slate-500">备件入库、出库登记与流水查询</p>
      </div>

      <div className="bg-white rounded-[2px] border border-slate-200 shadow-sm mb-5">
        <div className="flex border-b border-slate-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-6 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px',
                  active
                    ? 'text-amber-700 border-amber-500 bg-amber-50/30'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50/50'
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.8} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'in' && (
          <div className="p-5 space-y-5">
            <div className="bg-slate-50/60 rounded border border-slate-200 p-4">
              <div className="text-xs font-medium text-slate-600 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                入库来源
              </div>
              <div className="flex flex-wrap gap-3">
                {(['purchase', 'scatter', 'salvage'] as StockInSource[]).map(src => {
                  const info = stockInSourceMap[src];
                  const checked = stockInSource === src;
                  return (
                    <label
                      key={src}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded border cursor-pointer transition-all',
                        checked
                          ? 'border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="stockInSource"
                        value={src}
                        checked={checked}
                        onChange={() => setStockInSource(src)}
                        className="accent-amber-600 w-3.5 h-3.5"
                      />
                      <span className={cn('text-sm font-medium', checked ? 'text-amber-800' : 'text-slate-700')}>
                        {info.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {stockInSource === 'purchase' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="供应商" required>
                  <select
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">请选择供应商</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}（{s.contact}）</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="采购单号" hint="供应商提供的采购订单编号（选填）">
                  <input
                    type="text"
                    value={purchaseOrderNo}
                    onChange={e => setPurchaseOrderNo(e.target.value)}
                    className={inputClass}
                    placeholder="如：PO20240615001"
                  />
                </FormField>
              </div>
            )}

            {stockInSource === 'salvage' && (
              <FormField label="旧机编号" required hint="拆解的旧设备识别编号">
                <input
                  type="text"
                  value={salvageDeviceNo}
                  onChange={e => setSalvageDeviceNo(e.target.value)}
                  className={inputClass}
                  placeholder="如：OLD-IP14-20240512"
                />
              </FormField>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  备件明细
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={addStockInItem}
                >
                  添加行
                </Button>
              </div>

              <div className="border border-slate-200 rounded-[2px] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-[32%]">备件名称</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-[18%]">批次号</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 w-[12%]">数量</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 w-[14%]">单价（元）</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 w-[14%]">小计（元）</th>
                      <th className="px-3 py-2.5 w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockInItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          暂无备件，请点击上方「添加行」
                        </td>
                      </tr>
                    ) : (
                      stockInItems.map(item => {
                        const part = getPartById(item.partId);
                        return (
                          <tr key={item.uid} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInPartDropdownOpen(inPartDropdownOpen === item.uid ? null : item.uid);
                                    setInPartSearch(part?.name || '');
                                  }}
                                  className={cn(
                                    'w-full h-8 px-3 text-left rounded border text-xs flex items-center justify-between',
                                    item.partId
                                      ? 'border-slate-300 bg-white text-slate-700'
                                      : 'border-slate-300 bg-white text-slate-400'
                                  )}
                                >
                                  <span className="truncate">
                                    {part ? (
                                      <span>
                                        <span className="font-medium">{part.name}</span>
                                        <span className="ml-1.5 text-slate-400 font-mono">{part.sku}</span>
                                      </span>
                                    ) : '请选择备件'}
                                  </span>
                                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                </button>
                                {inPartDropdownOpen === item.uid && (
                                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg">
                                    <div className="p-2 border-b border-slate-100">
                                      <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                          type="text"
                                          placeholder="搜索备件..."
                                          value={inPartSearch}
                                          onChange={e => setInPartSearch(e.target.value)}
                                          className="w-full h-7 pl-8 pr-2 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {filteredParts.length === 0 ? (
                                        <div className="px-3 py-4 text-center text-xs text-slate-400">无匹配备件</div>
                                      ) : (
                                        filteredParts.map(p => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                              updateStockInItem(item.uid, 'partId', p.id);
                                              updateStockInItem(item.uid, 'purchasePrice', p.purchasePrice);
                                              setInPartDropdownOpen(null);
                                              setInPartSearch('');
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 border-b border-slate-50 last:border-0"
                                          >
                                            <div className="font-medium text-slate-700">{p.name}</div>
                                            <div className="text-[10px] text-slate-400">
                                              {p.sku} | 库存 {p.stockQty} | 参考进价 {formatCurrency(p.purchasePrice)}
                                            </div>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.batchNo}
                                onChange={e => updateStockInItem(item.uid, 'batchNo', e.target.value)}
                                className="w-full h-8 px-2 rounded border border-slate-300 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                                placeholder="如：B24061501"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={e => updateStockInItem(item.uid, 'qty', Math.max(0, Number(e.target.value) || 0))}
                                className="w-full h-8 px-2 rounded border border-slate-300 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.purchasePrice || ''}
                                onChange={e => updateStockInItem(item.uid, 'purchasePrice', Math.max(0, Number(e.target.value) || 0))}
                                className="w-full h-8 px-2 rounded border border-slate-300 text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">
                              {formatCurrency(item.qty * (Number(item.purchasePrice) || 0))}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => removeStockInItem(item.uid)}
                                className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={4} className="px-3 py-3 text-right text-sm font-semibold text-slate-600">
                        合计：
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-amber-600 text-base">
                        {formatCurrency(stockInTotal)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {stockInItems.length} 类 / {stockInItemsCount} 件
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <FormField label="备注" hint="入库说明、注意事项等（选填）">
              <textarea
                value={stockInRemark}
                onChange={e => setStockInRemark(e.target.value)}
                rows={2}
                className={textareaClass}
                placeholder="请输入备注信息..."
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                icon={<ArrowDownToLine className="w-4 h-4" />}
                onClick={handleStockIn}
                disabled={stockInItems.length === 0}
              >
                确认入库
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'out' && (
          <div className="p-5 space-y-5">
            <div className="bg-slate-50/60 rounded border border-slate-200 p-4">
              <div className="text-xs font-medium text-slate-600 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                出库场景
              </div>
              <div className="flex flex-wrap gap-3">
                {(['repair', 'retail', 'damage', 'selfuse'] as StockOutType[]).map(tp => {
                  const info = stockOutTypeMap[tp];
                  const checked = stockOutType === tp;
                  return (
                    <label
                      key={tp}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded border cursor-pointer transition-all',
                        checked
                          ? 'border-amber-400 bg-amber-50 shadow-sm ring-1 ring-amber-200'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      )}
                    >
                      <input
                        type="radio"
                        name="stockOutType"
                        value={tp}
                        checked={checked}
                        onChange={() => setStockOutType(tp)}
                        className="accent-amber-600 w-3.5 h-3.5"
                      />
                      <span className={cn('text-sm font-medium', checked ? 'text-amber-800' : 'text-slate-700')}>
                        {info.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {stockOutType === 'repair' && (
              <FormField label="维修工单号" required hint="关联的维修工单编号">
                <input
                  type="text"
                  value={repairOrderNo}
                  onChange={e => setRepairOrderNo(e.target.value)}
                  className={inputClass}
                  placeholder="如：WX20240615008"
                />
              </FormField>
            )}
            {stockOutType === 'retail' && (
              <FormField label="客户名称" required hint="零售客户姓名或公司名">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className={inputClass}
                  placeholder="如：张先生"
                />
              </FormField>
            )}
            {stockOutType === 'damage' && (
              <FormField label="报损原因" required hint="损坏原因、情况说明等">
                <textarea
                  value={damageReason}
                  onChange={e => setDamageReason(e.target.value)}
                  rows={2}
                  className={textareaClass}
                  placeholder="请详细说明报损原因，如：运输破损、过期报废、质量问题等"
                />
              </FormField>
            )}
            {stockOutType === 'selfuse' && (
              <FormField label="使用人" required hint="领用人员姓名">
                <input
                  type="text"
                  value={selfUseUser}
                  onChange={e => setSelfUseUser(e.target.value)}
                  className={inputClass}
                  placeholder="如：李师傅"
                />
              </FormField>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  备件明细
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={addStockOutItem}
                >
                  添加行
                </Button>
              </div>

              <div className="border border-slate-200 rounded-[2px] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 w-[30%]">备件名称</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 w-[13%]">当前库存</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 w-[12%]">出库数量</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 w-[15%]">单价（元）</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 w-[15%]">小计（元）</th>
                      <th className="px-3 py-2.5 w-[15%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockOutItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-10 text-center text-sm text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          暂无备件，请点击上方「添加行」
                        </td>
                      </tr>
                    ) : (
                      stockOutItems.map(item => {
                        const part = getPartById(item.partId);
                        const stock = part?.stockQty ?? 0;
                        const qty = Number(item.qty) || 0;
                        const overStock = qty > stock;
                        return (
                          <tr key={item.uid} className={cn(overStock && 'bg-red-50/60')}>
                            <td className="px-3 py-2">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOutPartDropdownOpen(outPartDropdownOpen === item.uid ? null : item.uid);
                                    setOutPartSearch(part?.name || '');
                                  }}
                                  className={cn(
                                    'w-full h-8 px-3 text-left rounded border text-xs flex items-center justify-between',
                                    item.partId
                                      ? 'border-slate-300 bg-white text-slate-700'
                                      : 'border-slate-300 bg-white text-slate-400'
                                  )}
                                >
                                  <span className="truncate">
                                    {part ? (
                                      <span>
                                        <span className="font-medium">{part.name}</span>
                                        <span className="ml-1.5 text-slate-400 font-mono">{part.sku}</span>
                                      </span>
                                    ) : '请选择备件'}
                                  </span>
                                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                </button>
                                {outPartDropdownOpen === item.uid && (
                                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg">
                                    <div className="p-2 border-b border-slate-100">
                                      <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                        <input
                                          type="text"
                                          placeholder="搜索备件（仅显示有库存）..."
                                          value={outPartSearch}
                                          onChange={e => setOutPartSearch(e.target.value)}
                                          className="w-full h-7 pl-8 pr-2 rounded border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                                        />
                                      </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                      {filteredPartsOut.length === 0 ? (
                                        <div className="px-3 py-4 text-center text-xs text-slate-400">无可用库存备件</div>
                                      ) : (
                                        filteredPartsOut.map(p => (
                                          <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => {
                                              updateStockOutItem(item.uid, 'partId', p.id);
                                              updateStockOutItem(item.uid, 'unitPrice', p.retailPrice);
                                              setOutPartDropdownOpen(null);
                                              setOutPartSearch('');
                                            }}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 border-b border-slate-50 last:border-0"
                                          >
                                            <div className="font-medium text-slate-700">{p.name}</div>
                                            <div className="text-[10px] text-slate-400">
                                              {p.sku} | 库存 {p.stockQty} | 参考售价 {formatCurrency(p.retailPrice)}
                                            </div>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className={cn(
                              'px-3 py-2 text-right font-mono text-xs',
                              overStock ? 'text-red-600 font-semibold' : 'text-slate-600'
                            )}>
                              {stock}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={1}
                                value={item.qty}
                                onChange={e => updateStockOutItem(item.uid, 'qty', Math.max(0, Number(e.target.value) || 0))}
                                className={cn(
                                  'w-full h-8 px-2 rounded border text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400',
                                  overStock ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white'
                                )}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.unitPrice || ''}
                                onChange={e => updateStockOutItem(item.uid, 'unitPrice', Math.max(0, Number(e.target.value) || 0))}
                                className="w-full h-8 px-2 rounded border border-slate-300 bg-white text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
                                placeholder="0.00"
                              />
                            </td>
                            <td className={cn(
                              'px-3 py-2 text-right font-mono font-semibold',
                              overStock ? 'text-red-600' : 'text-slate-800'
                            )}>
                              {formatCurrency(qty * (Number(item.unitPrice) || 0))}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1 justify-end">
                                {overStock && (
                                  <span className="text-[10px] text-red-500 flex items-center gap-0.5 mr-1">
                                    <AlertCircle className="w-3 h-3" />
                                    库存不足
                                  </span>
                                )}
                                <button
                                  onClick={() => removeStockOutItem(item.uid)}
                                  className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={4} className="px-3 py-3 text-right text-sm font-semibold text-slate-600">
                        合计：
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-amber-600 text-base">
                        {formatCurrency(stockOutTotal)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        {stockOutItems.length} 类 / {stockOutItemsCount} 件
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <FormField label="备注" hint="出库说明、注意事项等（选填）">
              <textarea
                value={stockOutRemark}
                onChange={e => setStockOutRemark(e.target.value)}
                rows={2}
                className={textareaClass}
                placeholder="请输入备注信息..."
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <Button
                size="lg"
                variant={isStockOutValid ? 'primary' : 'danger'}
                icon={<ArrowUpFromLine className="w-4 h-4" />}
                onClick={handleStockOut}
                disabled={stockOutItems.length === 0 || !isStockOutValid}
              >
                确认出库
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-5 space-y-5">
            <div className="bg-slate-50/60 rounded border border-slate-200 p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Filter className="w-3.5 h-3.5" />
                  筛选条件
                </div>
                <FormField label="开始日期">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={e => setFilterStartDate(e.target.value)}
                    className={cn(inputClass, 'w-44')}
                  />
                </FormField>
                <FormField label="结束日期">
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={e => setFilterEndDate(e.target.value)}
                    className={cn(inputClass, 'w-44')}
                  />
                </FormField>
                <FormField label="类型">
                  <select
                    value={filterType}
                    onChange={e => {
                      setFilterType(e.target.value as 'all' | 'in' | 'out');
                      setFilterSubType('all');
                    }}
                    className={cn(inputClass, 'w-32')}
                  >
                    <option value="all">全部</option>
                    <option value="in">入库</option>
                    <option value="out">出库</option>
                  </select>
                </FormField>
                <FormField label="子类型">
                  <select
                    value={filterSubType}
                    onChange={e => setFilterSubType(e.target.value)}
                    className={cn(inputClass, 'w-36')}
                  >
                    <option value="all">全部</option>
                    {(filterType === 'all' || filterType === 'in') && (
                      <>
                        <option value="purchase">采购单入库</option>
                        <option value="scatter">散件补货入库</option>
                        <option value="salvage">旧机拆件入库</option>
                      </>
                    )}
                    {(filterType === 'all' || filterType === 'out') && (
                      <>
                        <option value="repair">维修工单出库</option>
                        <option value="retail">零售出库</option>
                        <option value="damage">报损出库</option>
                        <option value="selfuse">自用出库</option>
                      </>
                    )}
                  </select>
                </FormField>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                    setFilterType('all');
                    setFilterSubType('all');
                  }}
                >
                  重置
                </Button>
                <div className="ml-auto text-xs text-slate-500">
                  共 <span className="font-semibold text-slate-700">{flowRecords.length}</span> 条记录
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-[2px] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-8 px-3 py-3"></th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600">单据编号</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600">类型</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600">关联信息</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600">数量</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-slate-600">金额</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600">操作人</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600">时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flowRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-16 text-center text-sm text-slate-400">
                        <History className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        暂无出入库记录
                      </td>
                    </tr>
                  ) : (
                    flowRecords.map(rec => {
                      const isExpanded = expandedRecord === rec.id;
                      const subInfo = rec.kind === 'in'
                        ? stockInSourceMap[rec.subType]
                        : stockOutTypeMap[rec.subType];
                      return (
                        <>
                          <tr
                            key={rec.id}
                            className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                            onClick={() => setExpandedRecord(isExpanded ? null : rec.id)}
                          >
                            <td className="px-3 py-3">
                              <div className="w-5 h-5 flex items-center justify-center text-slate-400">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="font-mono text-xs font-semibold text-slate-800">{rec.no}</span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <StatusBadge
                                  label={rec.kind === 'in' ? '入库' : '出库'}
                                  className={cn(
                                    rec.kind === 'in'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : 'bg-orange-50 text-orange-700 border-orange-300'
                                  )}
                                />
                                <StatusBadge
                                  label={subInfo?.label ?? rec.subType}
                                  className={subInfo?.className}
                                />
                              </div>
                            </td>
                            <td className="px-3 py-3 text-xs text-slate-600">
                              {rec.kind === 'in' && rec.sourceDesc && (
                                <span className="inline-flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {rec.sourceDesc}
                                </span>
                              )}
                              {rec.kind === 'out' && rec.typeDesc && (
                                <span className="inline-flex items-center gap-1">
                                  {stockOutType === 'damage' ? <AlertCircle className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                  {rec.typeDesc}
                                </span>
                              )}
                              {!rec.sourceDesc && !rec.typeDesc && <span className="text-slate-400">-</span>}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-slate-700 font-semibold">
                              {rec.itemsCount}
                            </td>
                            <td className={cn(
                              'px-3 py-3 text-right font-mono font-semibold',
                              rec.kind === 'in' ? 'text-emerald-700' : 'text-orange-700'
                            )}>
                              {rec.kind === 'in' ? '+' : '-'}{formatCurrency(rec.amount)}
                            </td>
                            <td className="px-3 py-3 text-xs text-slate-600">{rec.operatorName}</td>
                            <td className="px-3 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDateTime(rec.createdAt)}
                              </span>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/70">
                              <td></td>
                              <td colSpan={7} className="px-3 py-4">
                                <div className="ml-2 bg-white rounded border border-slate-200 p-4">
                                  <div className="grid grid-cols-4 gap-4 mb-3 text-xs">
                                    <div>
                                      <span className="text-slate-400">单类数：</span>
                                      <span className="font-medium text-slate-700">{rec.items.length} 类</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">总件数：</span>
                                      <span className="font-medium text-slate-700">{rec.itemsCount} 件</span>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-slate-400">备注：</span>
                                      <span className="font-medium text-slate-700">{rec.remark || '无'}</span>
                                    </div>
                                  </div>
                                  <div className="border-t border-slate-100 pt-3">
                                    <div className="text-xs font-medium text-slate-500 mb-2">备件明细</div>
                                    <table className="w-full text-xs">
                                      <thead>
                                        <tr className="text-slate-500 border-b border-slate-100">
                                          <th className="text-left py-1.5 font-medium">备件名称</th>
                                          <th className="text-left py-1.5 font-medium">SKU</th>
                                          <th className="text-right py-1.5 font-medium">数量</th>
                                          <th className="text-right py-1.5 font-medium">单价</th>
                                          <th className="text-right py-1.5 font-medium">小计</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50">
                                        {rec.items.map((it, idx) => {
                                          const p = getPartById(it.partId);
                                          return (
                                            <tr key={idx}>
                                              <td className="py-1.5 text-slate-700 font-medium">{p?.name ?? '-'}</td>
                                              <td className="py-1.5 text-slate-500 font-mono">{p?.sku ?? '-'}</td>
                                              <td className="py-1.5 text-right font-mono text-slate-700">{it.qty}</td>
                                              <td className="py-1.5 text-right font-mono text-slate-600">{formatCurrency(it.price)}</td>
                                              <td className="py-1.5 text-right font-mono font-semibold text-slate-800">{formatCurrency(it.qty * it.price)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
