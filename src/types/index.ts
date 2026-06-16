export type QualityLevel = 'original' | 'high' | 'generic' | 'refurbished';
export type StockInSource = 'purchase' | 'scatter' | 'salvage';
export type StockOutType = 'repair' | 'retail' | 'damage' | 'selfuse';
export type TransferStatus = 'pending_ship' | 'in_transit' | 'pending_receive' | 'completed' | 'cancelled';
export type StocktakeStatus = 'draft' | 'processing' | 'completed';
export type EmployeeRole = 'admin' | 'staff';
export type LogAction = 'create' | 'update' | 'delete' | 'confirm';
export type PhotoType = 'invoice' | 'package' | 'part';
export type PriceField = 'purchasePrice' | 'retailPrice';

export interface Part {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  compatibleModels: string[];
  qualityLevel: QualityLevel;
  supplierId: string;
  purchasePrice: number;
  retailPrice: number;
  warrantyDays: number;
  location: string;
  safetyStock: number;
  stockQty: number;
  lastMoveDate: string;
  repairCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  wechat?: string;
  address: string;
  mainCategories: string[];
  remark?: string;
}

export interface StockBatch {
  id: string;
  partId: string;
  batchNo: string;
  supplierId?: string;
  purchasePrice: number;
  qty: number;
  inboundQty: number;
  source: StockInSource;
  repairCount: number;
  inboundDate: string;
}

export interface StockInItem {
  partId: string;
  batchNo: string;
  qty: number;
  purchasePrice: number;
}

export interface StockIn {
  id: string;
  no: string;
  source: StockInSource;
  supplierId?: string;
  purchaseOrderNo?: string;
  salvageDeviceNo?: string;
  items: StockInItem[];
  totalAmount: number;
  operatorId: string;
  remark?: string;
  createdAt: string;
}

export interface StockOutItem {
  partId: string;
  qty: number;
  unitPrice: number;
}

export interface StockOut {
  id: string;
  no: string;
  type: StockOutType;
  repairOrderNo?: string;
  customerName?: string;
  damageReason?: string;
  user?: string;
  items: StockOutItem[];
  totalAmount: number;
  operatorId: string;
  remark?: string;
  createdAt: string;
}

export interface TransferItem {
  partId: string;
  qty: number;
}

export interface TransferOrder {
  id: string;
  no: string;
  fromStoreId: string;
  toStoreId: string;
  status: TransferStatus;
  items: TransferItem[];
  applicantId: string;
  shippedAt?: string;
  receivedAt?: string;
  remark?: string;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
}

export interface StocktakeItem {
  partId: string;
  systemQty: number;
  actualQty: number;
  diffQty: number;
  diffAmount: number;
  reason?: string;
}

export interface StocktakeOrder {
  id: string;
  no: string;
  status: StocktakeStatus;
  items: StocktakeItem[];
  operatorId: string;
  createdAt: string;
  completedAt?: string;
}

export interface PriceHistory {
  id: string;
  partId: string;
  field: PriceField;
  oldValue: number;
  newValue: number;
  operatorId: string;
  createdAt: string;
}

export interface BatchPhoto {
  id: string;
  batchId: string;
  url: string;
  type: PhotoType;
  remark?: string;
}

export interface OperationLog {
  id: string;
  operatorId: string;
  module: string;
  action: LogAction;
  targetId: string;
  targetType: string;
  diff?: Record<string, { old: unknown; new: unknown }>;
  ip?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  username: string;
  role: EmployeeRole;
  phone?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}
