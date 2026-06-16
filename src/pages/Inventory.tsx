import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Search, Plus, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react';
import type { Part, QualityLevel } from '@/types';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import FormField, { inputClass, textareaClass } from '@/components/common/FormField';

const QUALITY_LABELS: Record<QualityLevel, string> = {
  original: '原装',
  high: '高品质',
  generic: '通用',
  refurbished: '翻新',
};

const QUALITY_COLORS: Record<QualityLevel, string> = {
  original: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  high: 'bg-blue-50 text-blue-700 border-blue-200',
  generic: 'bg-slate-50 text-slate-700 border-slate-200',
  refurbished: 'bg-amber-50 text-amber-700 border-amber-200',
};

interface FormData {
  sku: string;
  name: string;
  categoryId: string;
  compatibleModels: string;
  qualityLevel: QualityLevel;
  supplierId: string;
  purchasePrice: string;
  retailPrice: string;
  warrantyDays: string;
  location: string;
  safetyStock: string;
}

const emptyForm: FormData = {
  sku: '',
  name: '',
  categoryId: '',
  compatibleModels: '',
  qualityLevel: 'high',
  supplierId: '',
  purchasePrice: '',
  retailPrice: '',
  warrantyDays: '90',
  location: '',
  safetyStock: '5',
};

export default function Inventory() {
  const navigate = useNavigate();
  const {
    parts, categories, suppliers, initData, addPart, updatePart, deletePart,
  } = useStore();

  useEffect(() => { initData(); }, [initData]);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterQuality, setFilterQuality] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      if (search) {
        const s = search.toLowerCase();
        if (!p.sku.toLowerCase().includes(s) && !p.name.toLowerCase().includes(s)) return false;
      }
      if (filterCategory && p.categoryId !== filterCategory) return false;
      if (filterQuality && p.qualityLevel !== filterQuality) return false;
      if (filterSupplier && p.supplierId !== filterSupplier) return false;
      return true;
    });
  }, [parts, search, filterCategory, filterQuality, filterSupplier]);

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '-';
  const supplierName = (id: string) => suppliers.find(s => s.id === id)?.name ?? '-';

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (p: Part) => {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      categoryId: p.categoryId,
      compatibleModels: p.compatibleModels.join('、'),
      qualityLevel: p.qualityLevel,
      supplierId: p.supplierId,
      purchasePrice: String(p.purchasePrice),
      retailPrice: String(p.retailPrice),
      warrantyDays: String(p.warrantyDays),
      location: p.location,
      safetyStock: String(p.safetyStock),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.sku.trim()) e.sku = '请输入SKU编号';
    if (!form.name.trim()) e.name = '请输入备件名称';
    if (!form.categoryId) e.categoryId = '请选择品类';
    if (!form.supplierId) e.supplierId = '请选择供应商';
    if (!form.purchasePrice || isNaN(Number(form.purchasePrice))) e.purchasePrice = '请输入有效进货价';
    if (!form.retailPrice || isNaN(Number(form.retailPrice))) e.retailPrice = '请输入有效零售价';
    if (!form.warrantyDays || isNaN(Number(form.warrantyDays))) e.warrantyDays = '请输入有效保修天数';
    if (!form.location.trim()) e.location = '请输入存放位置';
    if (!form.safetyStock || isNaN(Number(form.safetyStock))) e.safetyStock = '请输入有效安全库存';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      categoryId: form.categoryId,
      compatibleModels: form.compatibleModels.split(/[、,，]/).map(s => s.trim()).filter(Boolean),
      qualityLevel: form.qualityLevel,
      supplierId: form.supplierId,
      purchasePrice: Number(form.purchasePrice),
      retailPrice: Number(form.retailPrice),
      warrantyDays: Number(form.warrantyDays),
      location: form.location.trim(),
      safetyStock: Number(form.safetyStock),
      stockQty: 0,
      lastMoveDate: new Date().toISOString(),
      repairCount: 0,
    };
    if (editingId) {
      const { stockQty, lastMoveDate, repairCount, ...rest } = data;
      updatePart(editingId, rest);
    } else {
      addPart(data);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除该备件档案？相关库存记录将一并移除。')) {
      deletePart(id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">备件档案</h1>
          <p className="text-xs text-slate-500 mt-0.5">共 {filteredParts.length} 条备件记录</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>新增备件</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <FormField label="搜索">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="输入 SKU 或备件名称..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </FormField>
          </div>
          <FormField label="品类">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">全部品类</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="品质">
            <select
              value={filterQuality}
              onChange={e => setFilterQuality(e.target.value)}
              className={inputClass}
            >
              <option value="">全部品质</option>
              {Object.entries(QUALITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FormField>
          <FormField label="供应商">
            <select
              value={filterSupplier}
              onChange={e => setFilterSupplier(e.target.value)}
              className={inputClass}
            >
              <option value="">全部供应商</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </FormField>
          <Button variant="outline" size="md" onClick={() => {
            setSearch(''); setFilterCategory(''); setFilterQuality(''); setFilterSupplier('');
          }}>
            重置筛选
          </Button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">SKU</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">名称</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">品类</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">品质</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">库存</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">进货价</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">零售价</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">位置</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-400">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <div>暂无备件数据</div>
                  </td>
                </tr>
              ) : (
                filteredParts.map(p => {
                  const lowStock = p.stockQty <= p.safetyStock;
                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{p.sku}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/inventory/${p.id}`)}
                          className="text-slate-800 font-medium hover:text-accent-amber hover:underline transition-colors text-left"
                        >
                          {p.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{categoryName(p.categoryId)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={QUALITY_LABELS[p.qualityLevel]}
                          className={QUALITY_COLORS[p.qualityLevel]}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={lowStock ? 'text-accent-red font-semibold' : 'text-slate-800 font-medium'}>
                            {p.stockQty}
                          </span>
                          {lowStock && <AlertTriangle className="w-3.5 h-3.5 text-accent-amber" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">¥{p.purchasePrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-800 font-medium">¥{p.retailPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{p.location}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => openEdit(p)}>
                            编辑
                          </Button>
                          <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} className="text-accent-red hover:bg-red-50" onClick={() => handleDelete(p.id)}>
                            删除
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? '编辑备件档案' : '新增备件档案'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingId ? '保存修改' : '确认新增'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="SKU 编号" required hint="备件唯一编码，建议格式：品类缩写-机型-序号">
              <input
                type="text"
                value={form.sku}
                onChange={e => setForm({ ...form, sku: e.target.value })}
                className={`${inputClass} ${errors.sku ? 'border-accent-red' : ''}`}
                placeholder="如：LCD-IP15-001"
              />
              {errors.sku && <p className="text-[11px] text-accent-red mt-1">{errors.sku}</p>}
            </FormField>
            <FormField label="备件名称" required>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={`${inputClass} ${errors.name ? 'border-accent-red' : ''}`}
                placeholder="如：iPhone 15 屏幕总成"
              />
              {errors.name && <p className="text-[11px] text-accent-red mt-1">{errors.name}</p>}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="品类" required>
              <select
                value={form.categoryId}
                onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className={`${inputClass} ${errors.categoryId ? 'border-accent-red' : ''}`}
              >
                <option value="">请选择品类</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-[11px] text-accent-red mt-1">{errors.categoryId}</p>}
            </FormField>
            <FormField label="品质等级" required>
              <select
                value={form.qualityLevel}
                onChange={e => setForm({ ...form, qualityLevel: e.target.value as QualityLevel })}
                className={inputClass}
              >
                {Object.entries(QUALITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="供应商" required>
              <select
                value={form.supplierId}
                onChange={e => setForm({ ...form, supplierId: e.target.value })}
                className={`${inputClass} ${errors.supplierId ? 'border-accent-red' : ''}`}
              >
                <option value="">请选择供应商</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}（{s.contact}）</option>
                ))}
              </select>
              {errors.supplierId && <p className="text-[11px] text-accent-red mt-1">{errors.supplierId}</p>}
            </FormField>
            <FormField label="保修天数" required hint="0 表示无保修">
              <input
                type="number"
                min="0"
                value={form.warrantyDays}
                onChange={e => setForm({ ...form, warrantyDays: e.target.value })}
                className={`${inputClass} ${errors.warrantyDays ? 'border-accent-red' : ''}`}
                placeholder="90"
              />
              {errors.warrantyDays && <p className="text-[11px] text-accent-red mt-1">{errors.warrantyDays}</p>}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="进货价（元）" required hint="采购成本，用于库存价值核算">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.purchasePrice}
                onChange={e => setForm({ ...form, purchasePrice: e.target.value })}
                className={`${inputClass} ${errors.purchasePrice ? 'border-accent-red' : ''}`}
                placeholder="580.00"
              />
              {errors.purchasePrice && <p className="text-[11px] text-accent-red mt-1">{errors.purchasePrice}</p>}
            </FormField>
            <FormField label="零售价（元）" required hint="客户维修报价">
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.retailPrice}
                onChange={e => setForm({ ...form, retailPrice: e.target.value })}
                className={`${inputClass} ${errors.retailPrice ? 'border-accent-red' : ''}`}
                placeholder="899.00"
              />
              {errors.retailPrice && <p className="text-[11px] text-accent-red mt-1">{errors.retailPrice}</p>}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="存放位置" required hint="仓库货架编号">
              <input
                type="text"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className={`${inputClass} ${errors.location ? 'border-accent-red' : ''}`}
                placeholder="如：A-01-03"
              />
              {errors.location && <p className="text-[11px] text-accent-red mt-1">{errors.location}</p>}
            </FormField>
            <FormField label="安全库存" required hint="低于此数量时触发补货提醒">
              <input
                type="number"
                min="0"
                value={form.safetyStock}
                onChange={e => setForm({ ...form, safetyStock: e.target.value })}
                className={`${inputClass} ${errors.safetyStock ? 'border-accent-red' : ''}`}
                placeholder="5"
              />
              {errors.safetyStock && <p className="text-[11px] text-accent-red mt-1">{errors.safetyStock}</p>}
            </FormField>
          </div>

          <FormField label="适配机型" hint="多个机型用顿号、逗号分隔">
            <textarea
              rows={2}
              value={form.compatibleModels}
              onChange={e => setForm({ ...form, compatibleModels: e.target.value })}
              className={textareaClass}
              placeholder="如：iPhone 15、iPhone 15 Plus"
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
