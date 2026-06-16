import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import {
  Search, Plus, Edit2, Trash2, Building2, User,
  Phone, MessageCircle, MapPin, Tag, X
} from 'lucide-react';
import type { Supplier } from '@/types';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import FormField, { inputClass, textareaClass } from '@/components/common/FormField';
import Empty from '@/components/common/Empty';
import { cn } from '@/lib/utils';

interface FormData {
  name: string;
  contact: string;
  phone: string;
  wechat: string;
  address: string;
  mainCategories: string[];
  remark: string;
}

const emptyForm: FormData = {
  name: '',
  contact: '',
  phone: '',
  wechat: '',
  address: '',
  mainCategories: [],
  remark: '',
};

export default function Suppliers() {
  const { suppliers, categories, initData, addSupplier, updateSupplier, deleteSupplier } = useStore();

  useEffect(() => { initData(); }, [initData]);

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      if (search) {
        const s2 = search.toLowerCase();
        const hitName = s.name.toLowerCase().includes(s2);
        const hitContact = s.contact.toLowerCase().includes(s2);
        const hitPhone = s.phone.includes(search);
        const hitWechat = (s.wechat ?? '').toLowerCase().includes(s2);
        if (!hitName && !hitContact && !hitPhone && !hitWechat) return false;
      }
      if (filterCategory && !s.mainCategories.includes(filterCategory)) return false;
      return true;
    });
  }, [suppliers, search, filterCategory]);

  const categoryName = (id: string) => categories.find(c => c.id === id)?.name ?? '-';

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      contact: s.contact,
      phone: s.phone,
      wechat: s.wechat ?? '',
      address: s.address,
      mainCategories: [...s.mainCategories],
      remark: s.remark ?? '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = '请输入供应商名称';
    if (!form.contact.trim()) e.contact = '请输入联系人';
    if (!form.phone.trim()) e.phone = '请输入联系电话';
    if (!form.address.trim()) e.address = '请输入地址';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = {
      name: form.name.trim(),
      contact: form.contact.trim(),
      phone: form.phone.trim(),
      wechat: form.wechat.trim() || undefined,
      address: form.address.trim(),
      mainCategories: form.mainCategories,
      remark: form.remark.trim() || undefined,
    };
    if (editingId) {
      updateSupplier(editingId, data);
    } else {
      addSupplier(data);
    }
    setModalOpen(false);
  };

  const handleDelete = (s: Supplier) => {
    if (confirm(`确定删除供应商「${s.name}」？关联的备件记录不会被删除，但将无法通过该供应商筛选。`)) {
      deleteSupplier(s.id);
    }
  };

  const toggleCategory = (catId: string) => {
    setForm(prev => ({
      ...prev,
      mainCategories: prev.mainCategories.includes(catId)
        ? prev.mainCategories.filter(id => id !== catId)
        : [...prev.mainCategories, catId],
    }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">供应商管理</h1>
          <p className="text-xs text-slate-500 mt-0.5">共 {filteredSuppliers.length} 家供应商</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>新增供应商</Button>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-card p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <FormField label="搜索">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="输入名称、联系人、电话或微信..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </FormField>
          </div>
          <FormField label="主营品类">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className={inputClass}
              style={{ minWidth: 160 }}
            >
              <option value="">全部品类</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>
          <Button variant="outline" size="md" onClick={() => {
            setSearch('');
            setFilterCategory('');
          }}>
            重置
          </Button>
        </div>
      </div>

      {filteredSuppliers.length === 0 ? (
        <Empty title="暂无供应商数据" description="点击右上角「新增供应商」开始录入" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map(s => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded shadow-card p-4 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-[2px] bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-600 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 text-[15px] truncate">{s.name}</h3>
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {s.mainCategories.length === 0 ? (
                        <span className="text-[11px] text-slate-400">未设置主营品类</span>
                      ) : (
                        s.mainCategories.slice(0, 3).map(cid => {
                          const cat = categories.find(c => c.id === cid);
                          if (!cat) return null;
                          return (
                            <StatusBadge
                              key={cid}
                              label={cat.name}
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            />
                          );
                        })
                      )}
                      {s.mainCategories.length > 3 && (
                        <span className="text-[11px] text-slate-400">+{s.mainCategories.length - 3}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4 pl-1">
                <div className="flex items-start gap-2 text-slate-600">
                  <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-500 shrink-0 w-14">联系人:</span>
                  <span className="text-slate-800 font-medium">{s.contact}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-500 shrink-0 w-14">电话:</span>
                  <a
                    href={`tel:${s.phone}`}
                    className="text-slate-800 hover:text-accent-amber transition-colors"
                  >
                    {s.phone}
                  </a>
                </div>
                {s.wechat && (
                  <div className="flex items-start gap-2 text-slate-600">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-500 shrink-0 w-14">微信:</span>
                    <span className="text-slate-800">{s.wechat}</span>
                  </div>
                )}
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-slate-500 shrink-0 w-14">地址:</span>
                  <span className="text-slate-700 break-words">{s.address}</span>
                </div>
                {s.remark && (
                  <div className="flex items-start gap-2 text-slate-600 pt-1 border-t border-slate-100 mt-2">
                    <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-slate-500 shrink-0 w-14">备注:</span>
                    <span className="text-slate-500 text-xs break-words">{s.remark}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => openEdit(s)}
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-accent-red hover:bg-red-50"
                  onClick={() => handleDelete(s)}
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? '编辑供应商' : '新增供应商'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingId ? '保存修改' : '确认新增'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="供应商名称" required>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={`${inputClass} ${errors.name ? 'border-accent-red' : ''}`}
                placeholder="如：华强北电子"
              />
              {errors.name && <p className="text-[11px] text-accent-red mt-1">{errors.name}</p>}
            </FormField>
            <FormField label="联系人" required>
              <input
                type="text"
                value={form.contact}
                onChange={e => setForm({ ...form, contact: e.target.value })}
                className={`${inputClass} ${errors.contact ? 'border-accent-red' : ''}`}
                placeholder="如：陈经理"
              />
              {errors.contact && <p className="text-[11px] text-accent-red mt-1">{errors.contact}</p>}
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="联系电话" required hint="用于快速联系和搜索">
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                className={`${inputClass} ${errors.phone ? 'border-accent-red' : ''}`}
                placeholder="如：13900000001"
              />
              {errors.phone && <p className="text-[11px] text-accent-red mt-1">{errors.phone}</p>}
            </FormField>
            <FormField label="微信号" hint="可选，方便添加微信沟通">
              <div className="relative">
                <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                <input
                  type="text"
                  value={form.wechat}
                  onChange={e => setForm({ ...form, wechat: e.target.value })}
                  className={`${inputClass} pl-9`}
                  placeholder="如：hqb_chen"
                />
              </div>
            </FormField>
          </div>

          <FormField label="地址" required>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              className={`${inputClass} ${errors.address ? 'border-accent-red' : ''}`}
              placeholder="如：深圳市福田区华强北路1001号"
            />
            {errors.address && <p className="text-[11px] text-accent-red mt-1">{errors.address}</p>}
          </FormField>

          <FormField label="主营品类" hint="可多选，用于按品类快速筛选供应商" required={false}>
            <div className="border border-slate-200 rounded-[2px] p-3 max-h-40 overflow-y-auto bg-slate-50/50">
              {categories.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">暂无品类数据</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => {
                    const selected = form.mainCategories.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCategory(c.id)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] border text-xs font-medium transition-colors',
                          selected
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                        )}
                      >
                        {selected && <X className="w-3 h-3" />}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </FormField>

          <FormField label="备注">
            <textarea
              rows={3}
              value={form.remark}
              onChange={e => setForm({ ...form, remark: e.target.value })}
              className={textareaClass}
              placeholder="如：合作时长、账期、退换货政策等补充说明..."
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
