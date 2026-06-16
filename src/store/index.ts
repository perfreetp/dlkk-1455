import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Part, Category, Supplier, StockBatch, StockIn, StockOut, TransferOrder,
  Store, StocktakeOrder, PriceHistory, BatchPhoto, OperationLog, Employee,
  StockInSource, StockOutType, QualityLevel, StockInItem, StockOutItem,
  TransferItem, StocktakeItem, PriceField, ToastMessage, PhotoType
} from '@/types';
import { uid } from '@/utils/id';
import { generateOrderNo } from '@/utils/format';
import {
  MOCK_PARTS, MOCK_CATEGORIES, MOCK_SUPPLIERS, MOCK_STOCK_BATCHES,
  MOCK_STOCK_IN, MOCK_STOCK_OUT, MOCK_TRANSFER, MOCK_STORES,
  MOCK_STOCKTAKE, MOCK_PRICE_HISTORY, MOCK_BATCH_PHOTOS, MOCK_LOGS, MOCK_EMPLOYEES
} from './mockData';

interface RootState {
  initialized: boolean;
  parts: Part[];
  categories: Category[];
  suppliers: Supplier[];
  stockBatches: StockBatch[];
  stockInList: StockIn[];
  stockOutList: StockOut[];
  transferOrders: TransferOrder[];
  stores: Store[];
  stocktakeOrders: StocktakeOrder[];
  priceHistory: PriceHistory[];
  batchPhotos: BatchPhoto[];
  operationLogs: OperationLog[];
  employees: Employee[];
  currentUserId: string;
  toasts: ToastMessage[];

  initData: () => void;
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
  writeLog: (module: string, action: OperationLog['action'], targetId: string, targetType: string, diff?: OperationLog['diff']) => void;

  addPart: (data: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePart: (id: string, data: Partial<Part>) => void;
  updatePartPrice: (id: string, field: PriceField, newValue: number) => void;
  deletePart: (id: string) => void;

  addSupplier: (data: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  stockIn: (params: {
    source: StockInSource; supplierId?: string; purchaseOrderNo?: string;
    salvageDeviceNo?: string; items: StockInItem[]; remark?: string;
    batchPhotos?: { batchNo: string; photos: { type: PhotoType; url: string; remark?: string }[] }[];
  }) => { success: boolean; message?: string };
  addBatchPhoto: (batchId: string, type: PhotoType, url: string, remark?: string) => void;
  getBatchPhotosByPart: (partId: string) => BatchPhoto[];

  stockOut: (params: {
    type: StockOutType; repairOrderNo?: string; customerName?: string;
    damageReason?: string; user?: string; items: StockOutItem[]; remark?: string;
  }) => { success: boolean; message?: string };

  createTransfer: (toStoreId: string, fromStoreId: string, items: TransferItem[], remark?: string) => void;
  shipTransfer: (id: string) => void;
  receiveTransfer: (id: string) => void;
  cancelTransfer: (id: string) => void;

  createStocktake: (partIds: string[]) => string;
  updateStocktakeItem: (orderId: string, partId: string, actualQty: number, reason?: string) => void;
  completeStocktake: (orderId: string) => void;

  getTotalStockValue: () => number;
  getPartById: (id: string) => Part | undefined;
  getSupplierById: (id: string) => Supplier | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getStoreById: (id: string) => Store | undefined;
  getEmployeeById: (id: string) => Employee | undefined;
  getCurrentEmployee: () => Employee | undefined;
}

export const useStore = create<RootState>()(
  persist(
    (set, get) => ({
      initialized: false,
      parts: [], categories: [], suppliers: [], stockBatches: [], stockInList: [],
      stockOutList: [], transferOrders: [], stores: [], stocktakeOrders: [],
      priceHistory: [], batchPhotos: [], operationLogs: [], employees: [],
      currentUserId: 'e1', toasts: [],

      initData: () => {
        if (get().initialized) return;
        set({
          initialized: true,
          parts: MOCK_PARTS, categories: MOCK_CATEGORIES, suppliers: MOCK_SUPPLIERS,
          stockBatches: MOCK_STOCK_BATCHES, stockInList: MOCK_STOCK_IN,
          stockOutList: MOCK_STOCK_OUT, transferOrders: MOCK_TRANSFER,
          stores: MOCK_STORES, stocktakeOrders: MOCK_STOCKTAKE,
          priceHistory: MOCK_PRICE_HISTORY, batchPhotos: MOCK_BATCH_PHOTOS,
          operationLogs: MOCK_LOGS, employees: MOCK_EMPLOYEES,
        });
      },

      addToast: (type, message) => {
        const id = uid('tst_');
        set(s => ({ toasts: [...s.toasts, { id, type, message }] }));
        setTimeout(() => get().removeToast(id), 3000);
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      writeLog: (module, action, targetId, targetType, diff) => {
        const log: OperationLog = {
          id: uid('log_'), operatorId: get().currentUserId, module, action,
          targetId, targetType, diff, ip: '127.0.0.1', createdAt: new Date().toISOString(),
        };
        set(s => ({ operationLogs: [log, ...s.operationLogs] }));
      },

      addPart: (data) => {
        const now = new Date().toISOString();
        const part: Part = { ...data, id: uid('p_'), createdAt: now, updatedAt: now };
        set(s => ({ parts: [part, ...s.parts] }));
        get().writeLog('备件档案', 'create', part.id, 'Part');
        get().addToast('success', `已添加备件：${part.name}`);
      },

      updatePart: (id, data) => {
        const diff: OperationLog['diff'] = {};
        const oldPart = get().getPartById(id);
        if (oldPart) {
          Object.entries(data).forEach(([k, v]) => {
            const key = k as keyof Part;
            if (oldPart[key] !== v) diff[k] = { old: oldPart[key], new: v };
          });
        }
        set(s => ({
          parts: s.parts.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p),
        }));
        if (Object.keys(diff).length) get().writeLog('备件档案', 'update', id, 'Part', diff);
      },

      updatePartPrice: (id, field, newValue) => {
        const part = get().getPartById(id);
        if (!part) return;
        const oldValue = part[field];
        if (oldValue === newValue) return;
        const ph: PriceHistory = {
          id: uid('ph_'), partId: id, field, oldValue, newValue,
          operatorId: get().currentUserId, createdAt: new Date().toISOString(),
        };
        set(s => ({
          parts: s.parts.map(p => p.id === id ? { ...p, [field]: newValue, updatedAt: new Date().toISOString() } : p),
          priceHistory: [ph, ...s.priceHistory],
        }));
        get().writeLog('价格', 'update', id, 'Part', { [field]: { old: oldValue, new: newValue } });
        get().addToast('info', `价格已更新`);
      },

      deletePart: (id) => {
        const p = get().getPartById(id);
        set(s => ({ parts: s.parts.filter(x => x.id !== id) }));
        get().writeLog('备件档案', 'delete', id, 'Part');
        get().addToast('success', `已删除：${p?.name ?? id}`);
      },

      addSupplier: (data) => {
        const sup: Supplier = { ...data, id: uid('sup_') };
        set(s => ({ suppliers: [sup, ...s.suppliers] }));
        get().writeLog('供应商', 'create', sup.id, 'Supplier');
        get().addToast('success', `已添加供应商：${sup.name}`);
      },
      updateSupplier: (id, data) => {
        set(s => ({ suppliers: s.suppliers.map(sup => sup.id === id ? { ...sup, ...data } : sup) }));
        get().writeLog('供应商', 'update', id, 'Supplier');
      },
      deleteSupplier: (id) => {
        set(s => ({ suppliers: s.suppliers.filter(x => x.id !== id) }));
        get().writeLog('供应商', 'delete', id, 'Supplier');
      },

      stockIn: (params) => {
        const now = new Date().toISOString();
        const totalAmount = params.items.reduce((sum, i) => sum + i.qty * i.purchasePrice, 0);
        const order: StockIn = {
          id: uid('si_'), no: generateOrderNo('IN'), ...params, totalAmount,
          operatorId: get().currentUserId, createdAt: now,
        };
        const newParts = [...get().parts];
        const newBatches = [...get().stockBatches];
        const newPhotos: BatchPhoto[] = [];
        const batchMap = new Map<string, string>();
        for (const item of params.items) {
          const idx = newParts.findIndex(p => p.id === item.partId);
          if (idx >= 0) {
            const oldTotalValue = newParts[idx].purchasePrice * newParts[idx].stockQty;
            const addValue = item.purchasePrice * item.qty;
            const newQty = newParts[idx].stockQty + item.qty;
            const newPrice = newQty > 0 ? (oldTotalValue + addValue) / newQty : item.purchasePrice;
            newParts[idx] = { ...newParts[idx], stockQty: newQty, purchasePrice: newPrice, lastMoveDate: now, updatedAt: now };
          }
          const batchId = uid('b_');
          batchMap.set(item.batchNo, batchId);
          newBatches.push({
            id: batchId, partId: item.partId, batchNo: item.batchNo,
            supplierId: params.supplierId, purchasePrice: item.purchasePrice,
            qty: item.qty, inboundQty: item.qty, source: params.source,
            repairCount: 0, inboundDate: now,
          });
        }
        if (params.batchPhotos) {
          for (const bp of params.batchPhotos) {
            const batchId = batchMap.get(bp.batchNo);
            if (!batchId) continue;
            for (const p of bp.photos) {
              newPhotos.push({
                id: uid('bp_'), batchId, url: p.url, type: p.type, remark: p.remark,
              });
            }
          }
        }
        set(s => ({
          stockInList: [order, ...s.stockInList],
          parts: newParts, stockBatches: newBatches,
          batchPhotos: [...newPhotos, ...s.batchPhotos],
        }));
        get().writeLog('入库', 'create', order.id, 'StockIn');
        const photoCount = newPhotos.length;
        get().addToast('success', `入库成功：${order.no}${photoCount > 0 ? `，已添加 ${photoCount} 张批次照片` : ''}`);
        return { success: true };
      },
      addBatchPhoto: (batchId, type, url, remark) => {
        const photo: BatchPhoto = {
          id: uid('bp_'), batchId, url, type, remark,
        };
        set(s => ({ batchPhotos: [photo, ...s.batchPhotos] }));
        get().writeLog('批次照片', 'create', photo.id, 'BatchPhoto');
      },
      getBatchPhotosByPart: (partId) => {
        const batches = get().stockBatches.filter(b => b.partId === partId);
        const batchIds = new Set(batches.map(b => b.id));
        return get().batchPhotos.filter(p => batchIds.has(p.batchId));
      },

      stockOut: (params) => {
        for (const item of params.items) {
          const part = get().getPartById(item.partId);
          if (!part || part.stockQty < item.qty) {
            get().addToast('error', `${part?.name ?? '备件'} 库存不足`);
            return { success: false, message: `${part?.name ?? '备件'} 库存不足` };
          }
        }
        const now = new Date().toISOString();
        const totalAmount = params.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
        const order: StockOut = {
          id: uid('so_'), no: generateOrderNo('OUT'), ...params, totalAmount,
          operatorId: get().currentUserId, createdAt: now,
        };
        const newParts = [...get().parts];
        for (const item of params.items) {
          const idx = newParts.findIndex(p => p.id === item.partId);
          if (idx >= 0) {
            newParts[idx] = { ...newParts[idx], stockQty: newParts[idx].stockQty - item.qty, lastMoveDate: now, updatedAt: now };
          }
        }
        set(s => ({
          stockOutList: [order, ...s.stockOutList],
          parts: newParts,
        }));
        get().writeLog('出库', 'create', order.id, 'StockOut');
        get().addToast('success', `出库成功：${order.no}，共 ${totalAmount.toFixed(2)} 元`);
        return { success: true };
      },

      createTransfer: (toStoreId, fromStoreId, items, remark) => {
        for (const item of items) {
          const part = get().getPartById(item.partId);
          if (!part || part.stockQty < item.qty) {
            get().addToast('error', `${part?.name ?? '备件'} 库存不足，无法调拨`);
            return;
          }
        }
        const now = new Date().toISOString();
        const order: TransferOrder = {
          id: uid('t_'), no: generateOrderNo('TR'), fromStoreId, toStoreId,
          status: 'pending_ship', items, applicantId: get().currentUserId,
          remark, createdAt: now,
        };
        const newParts = [...get().parts];
        for (const item of items) {
          const idx = newParts.findIndex(p => p.id === item.partId);
          if (idx >= 0) {
            newParts[idx] = { ...newParts[idx], stockQty: newParts[idx].stockQty - item.qty, lastMoveDate: now, updatedAt: now };
          }
        }
        set(s => ({
          transferOrders: [order, ...s.transferOrders],
          parts: newParts,
        }));
        get().writeLog('调拨', 'create', order.id, 'TransferOrder');
        get().addToast('success', `调拨申请已创建：${order.no}，调出方库存已扣减`);
      },
      shipTransfer: (id) => {
        set(s => ({
          transferOrders: s.transferOrders.map(t =>
            t.id === id ? { ...t, status: 'in_transit', shippedAt: new Date().toISOString() } : t
          ),
        }));
        get().writeLog('调拨', 'confirm', id, 'TransferOrder');
        get().addToast('success', '已确认发货');
      },
      receiveTransfer: (id) => {
        const order = get().transferOrders.find(t => t.id === id);
        if (!order) return;
        const now = new Date().toISOString();
        const newParts = [...get().parts];
        for (const item of order.items) {
          const idx = newParts.findIndex(p => p.id === item.partId);
          if (idx >= 0) {
            newParts[idx] = { ...newParts[idx], stockQty: newParts[idx].stockQty + item.qty, lastMoveDate: now, updatedAt: now };
          }
        }
        set(s => ({
          transferOrders: s.transferOrders.map(t => t.id === id ? { ...t, status: 'completed', receivedAt: now } : t),
          parts: newParts,
        }));
        get().writeLog('调拨', 'confirm', id, 'TransferOrder');
        get().addToast('success', '已确认收货，调入方库存已增加');
      },
      cancelTransfer: (id) => {
        const order = get().transferOrders.find(t => t.id === id);
        if (!order) return;
        const now = new Date().toISOString();
        const newParts = [...get().parts];
        for (const item of order.items) {
          const idx = newParts.findIndex(p => p.id === item.partId);
          if (idx >= 0) {
            newParts[idx] = { ...newParts[idx], stockQty: newParts[idx].stockQty + item.qty, lastMoveDate: now, updatedAt: now };
          }
        }
        set(s => ({
          transferOrders: s.transferOrders.map(t => t.id === id ? { ...t, status: 'cancelled' } : t),
          parts: newParts,
        }));
        get().writeLog('调拨', 'update', id, 'TransferOrder');
        get().addToast('success', '已取消调拨，库存已恢复');
      },

      createStocktake: (partIds) => {
        const items: StocktakeItem[] = partIds.map(pid => {
          const p = get().getPartById(pid)!;
          return { partId: pid, systemQty: p.stockQty, actualQty: p.stockQty, diffQty: 0, diffAmount: 0 };
        });
        const order: StocktakeOrder = {
          id: uid('st_'), no: generateOrderNo('PD'), status: 'processing', items,
          operatorId: get().currentUserId, createdAt: new Date().toISOString(),
        };
        set(s => ({ stocktakeOrders: [order, ...s.stocktakeOrders] }));
        get().writeLog('盘点', 'create', order.id, 'StocktakeOrder');
        return order.id;
      },
      updateStocktakeItem: (orderId, partId, actualQty, reason) => {
        set(s => ({
          stocktakeOrders: s.stocktakeOrders.map(o => {
            if (o.id !== orderId) return o;
            return {
              ...o,
              items: o.items.map(it => {
                if (it.partId !== partId) return it;
                const part = get().getPartById(partId);
                const diffQty = actualQty - it.systemQty;
                return { ...it, actualQty, diffQty, diffAmount: diffQty * (part?.purchasePrice ?? 0), reason };
              }),
            };
          }),
        }));
      },
      completeStocktake: (orderId) => {
        const order = get().stocktakeOrders.find(o => o.id === orderId);
        if (!order) return;
        const now = new Date().toISOString();
        const newParts = [...get().parts];
        for (const item of order.items) {
          if (item.diffQty !== 0) {
            const idx = newParts.findIndex(p => p.id === item.partId);
            if (idx >= 0) {
              newParts[idx] = { ...newParts[idx], stockQty: item.actualQty, lastMoveDate: now, updatedAt: now };
            }
          }
        }
        set(s => ({
          stocktakeOrders: s.stocktakeOrders.map(o => o.id === orderId ? { ...o, status: 'completed', completedAt: now } : o),
          parts: newParts,
        }));
        get().writeLog('盘点', 'confirm', orderId, 'StocktakeOrder');
        get().addToast('success', '盘点完成，库存已更新');
      },

      getTotalStockValue: () => get().parts.reduce((sum, p) => sum + p.stockQty * p.purchasePrice, 0),
      getPartById: (id) => get().parts.find(p => p.id === id),
      getSupplierById: (id) => get().suppliers.find(s => s.id === id),
      getCategoryById: (id) => get().categories.find(c => c.id === id),
      getStoreById: (id) => get().stores.find(s => s.id === id),
      getEmployeeById: (id) => get().employees.find(e => e.id === id),
      getCurrentEmployee: () => get().employees.find(e => e.id === get().currentUserId),
    }),
    {
      name: 'repair-shop-stock',
      partialize: (state) => ({
        initialized: state.initialized,
        parts: state.parts, categories: state.categories, suppliers: state.suppliers,
        stockBatches: state.stockBatches, stockInList: state.stockInList,
        stockOutList: state.stockOutList, transferOrders: state.transferOrders,
        stores: state.stores, stocktakeOrders: state.stocktakeOrders,
        priceHistory: state.priceHistory, batchPhotos: state.batchPhotos,
        operationLogs: state.operationLogs, employees: state.employees,
        currentUserId: state.currentUserId,
      }),
    }
  )
);
