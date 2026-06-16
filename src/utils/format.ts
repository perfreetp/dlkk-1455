export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value: number, digits: number = 2): string => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
};

export const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return `${formatDate(dateStr)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const daysSince = (dateStr: string): number => {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
};

export const getDaysAgoDateStr = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const generateOrderNo = (prefix: string): string => {
  const d = new Date();
  const datePart = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${datePart}${rand}`;
};

export const qualityLevelMap: Record<string, { label: string; className: string }> = {
  original: { label: '原装正品', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  high: { label: '高品质', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  generic: { label: '通用', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  refurbished: { label: '翻新', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const stockInSourceMap: Record<string, { label: string; className: string }> = {
  purchase: { label: '采购单', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  scatter: { label: '散件补货', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  salvage: { label: '旧机拆件', className: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const stockOutTypeMap: Record<string, { label: string; className: string }> = {
  repair: { label: '维修工单', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  retail: { label: '零售销售', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  damage: { label: '报损', className: 'bg-red-50 text-red-700 border-red-200' },
  selfuse: { label: '自用', className: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const transferStatusMap: Record<string, { label: string; className: string }> = {
  pending_ship: { label: '待发货', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_transit: { label: '在途', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending_receive: { label: '待收货', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed: { label: '已完成', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: '已取消', className: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const stocktakeStatusMap: Record<string, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  processing: { label: '盘点中', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  completed: { label: '已完成', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};
