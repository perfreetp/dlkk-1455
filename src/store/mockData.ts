import type {
  Part, Category, Supplier, StockBatch, StockIn, StockOut,
  TransferOrder, Store, StocktakeOrder, PriceHistory, BatchPhoto,
  OperationLog, Employee
} from '@/types';

export const MOCK_STORES: Store[] = [
  { id: 's1', name: '总店（中山路店）', address: '中山路123号', phone: '13800000001' },
  { id: 's2', name: '分店（人民路店）', address: '人民路456号', phone: '13800000002' },
  { id: 's3', name: '分店（解放路店）', address: '解放路789号', phone: '13800000003' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'e1', name: '张老板', username: 'admin', role: 'admin', phone: '13800000001' },
  { id: 'e2', name: '李师傅', username: 'staff1', role: 'staff', phone: '13800000005' },
  { id: 'e3', name: '王师傅', username: 'staff2', role: 'staff', phone: '13800000006' },
];

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: '手机屏幕' },
  { id: 'c2', name: '手机电池' },
  { id: 'c3', name: '手机主板配件' },
  { id: 'c4', name: '后壳/中框' },
  { id: 'c5', name: '摄像头模组' },
  { id: 'c6', name: '汽车滤芯' },
  { id: 'c7', name: '刹车片' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
  { id: 'sup1', name: '华强北电子', contact: '陈经理', phone: '13900000001', wechat: 'hqb_chen', address: '深圳市福田区华强北路1001号', mainCategories: ['c1', 'c2', 'c3'], remark: '合作3年，账期月结' },
  { id: 'sup2', name: '诚信通讯配件', contact: '刘总', phone: '13900000002', address: '广州市荔湾区西堤二马路', mainCategories: ['c4', 'c5'], remark: '可退换货' },
  { id: 'sup3', name: '汽配商城', contact: '赵经理', phone: '13900000003', address: '上海市闵行区汽配城', mainCategories: ['c6', 'c7'] },
];

const now = Date.now();
const d = (daysAgo: number) => new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_PARTS: Part[] = [
  {
    id: 'p1', sku: 'LCD-IP15-001', name: 'iPhone 15 屏幕总成', categoryId: 'c1',
    compatibleModels: ['iPhone 15', 'iPhone 15 Plus'], qualityLevel: 'original',
    supplierId: 'sup1', purchasePrice: 580, retailPrice: 899, warrantyDays: 90,
    location: 'A-01-03', safetyStock: 5, stockQty: 12, lastMoveDate: d(1),
    repairCount: 2, createdAt: d(120), updatedAt: d(1),
  },
  {
    id: 'p2', sku: 'BAT-IP14-002', name: 'iPhone 14 Pro 电池', categoryId: 'c2',
    compatibleModels: ['iPhone 14 Pro'], qualityLevel: 'high',
    supplierId: 'sup1', purchasePrice: 85, retailPrice: 180, warrantyDays: 180,
    location: 'B-02-01', safetyStock: 10, stockQty: 8, lastMoveDate: d(2),
    repairCount: 0, createdAt: d(100), updatedAt: d(2),
  },
  {
    id: 'p3', sku: 'LCD-IP13-003', name: 'iPhone 13 屏幕总成', categoryId: 'c1',
    compatibleModels: ['iPhone 13'], qualityLevel: 'high',
    supplierId: 'sup1', purchasePrice: 320, retailPrice: 599, warrantyDays: 90,
    location: 'A-01-02', safetyStock: 5, stockQty: 3, lastMoveDate: d(3),
    repairCount: 1, createdAt: d(150), updatedAt: d(3),
  },
  {
    id: 'p4', sku: 'BAT-HW-004', name: '华为 Mate 60 电池', categoryId: 'c2',
    compatibleModels: ['Mate 60', 'Mate 60 Pro'], qualityLevel: 'original',
    supplierId: 'sup2', purchasePrice: 120, retailPrice: 260, warrantyDays: 180,
    location: 'B-02-05', safetyStock: 5, stockQty: 18, lastMoveDate: d(1),
    repairCount: 0, createdAt: d(80), updatedAt: d(1),
  },
  {
    id: 'p5', sku: 'CAM-IP14-005', name: 'iPhone 14 后置摄像头', categoryId: 'c5',
    compatibleModels: ['iPhone 14'], qualityLevel: 'original',
    supplierId: 'sup2', purchasePrice: 220, retailPrice: 450, warrantyDays: 90,
    location: 'C-01-04', safetyStock: 3, stockQty: 2, lastMoveDate: d(5),
    repairCount: 3, createdAt: d(90), updatedAt: d(5),
  },
  {
    id: 'p6', sku: 'HOUS-XM-006', name: '小米 13 中框后壳', categoryId: 'c4',
    compatibleModels: ['小米 13'], qualityLevel: 'generic',
    supplierId: 'sup2', purchasePrice: 45, retailPrice: 120, warrantyDays: 30,
    location: 'D-03-01', safetyStock: 5, stockQty: 15, lastMoveDate: d(4),
    repairCount: 0, createdAt: d(60), updatedAt: d(4),
  },
  {
    id: 'p7', sku: 'FILT-TOY-007', name: '丰田卡罗拉 机油滤芯', categoryId: 'c6',
    compatibleModels: ['卡罗拉 2019-2024'], qualityLevel: 'high',
    supplierId: 'sup3', purchasePrice: 18, retailPrice: 45, warrantyDays: 0,
    location: 'E-01-02', safetyStock: 20, stockQty: 35, lastMoveDate: d(1),
    repairCount: 0, createdAt: d(200), updatedAt: d(1),
  },
  {
    id: 'p8', sku: 'BRK-VW-008', name: '大众朗逸 前刹车片', categoryId: 'c7',
    compatibleModels: ['朗逸 2018-2023'], qualityLevel: 'original',
    supplierId: 'sup3', purchasePrice: 95, retailPrice: 220, warrantyDays: 365,
    location: 'E-02-05', safetyStock: 5, stockQty: 6, lastMoveDate: d(6),
    repairCount: 0, createdAt: d(180), updatedAt: d(6),
  },
  {
    id: 'p9', sku: 'LCD-OP-009', name: 'OPPO Find X6 屏幕', categoryId: 'c1',
    compatibleModels: ['Find X6'], qualityLevel: 'refurbished',
    supplierId: 'sup1', purchasePrice: 420, retailPrice: 699, warrantyDays: 60,
    location: 'A-02-04', safetyStock: 3, stockQty: 1, lastMoveDate: d(20),
    repairCount: 5, createdAt: d(70), updatedAt: d(20),
  },
  {
    id: 'p10', sku: 'MB-IP12-010', name: 'iPhone 12 主板充电IC', categoryId: 'c3',
    compatibleModels: ['iPhone 12', 'iPhone 12 Pro'], qualityLevel: 'high',
    supplierId: 'sup1', purchasePrice: 38, retailPrice: 95, warrantyDays: 90,
    location: 'F-01-08', safetyStock: 10, stockQty: 0, lastMoveDate: d(95),
    repairCount: 1, createdAt: d(110), updatedAt: d(95),
  },
  {
    id: 'p11', sku: 'BAT-OP-011', name: 'OPPO Reno 10 电池', categoryId: 'c2',
    compatibleModels: ['Reno 10'], qualityLevel: 'generic',
    supplierId: 'sup2', purchasePrice: 40, retailPrice: 55, warrantyDays: 90,
    location: 'B-03-02', safetyStock: 8, stockQty: 4, lastMoveDate: d(60),
    repairCount: 0, createdAt: d(150), updatedAt: d(60),
  },
  {
    id: 'p12', sku: 'CAM-VI-012', name: 'vivo X90 前置摄像头', categoryId: 'c5',
    compatibleModels: ['X90', 'X90 Pro'], qualityLevel: 'original',
    supplierId: 'sup2', purchasePrice: 80, retailPrice: 195, warrantyDays: 90,
    location: 'C-02-03', safetyStock: 5, stockQty: 50, lastMoveDate: d(100),
    repairCount: 0, createdAt: d(130), updatedAt: d(100),
  },
];

export const MOCK_STOCK_BATCHES: StockBatch[] = [
  { id: 'b1', partId: 'p1', batchNo: 'B20250501-001', supplierId: 'sup1', purchasePrice: 580, qty: 12, inboundQty: 15, source: 'purchase', repairCount: 2, inboundDate: d(45) },
  { id: 'b2', partId: 'p2', batchNo: 'B20250510-002', supplierId: 'sup1', purchasePrice: 85, qty: 8, inboundQty: 20, source: 'purchase', repairCount: 0, inboundDate: d(35) },
  { id: 'b3', partId: 'p9', batchNo: 'B20250415-003', supplierId: 'sup1', purchasePrice: 420, qty: 1, inboundQty: 5, source: 'purchase', repairCount: 5, inboundDate: d(60) },
  { id: 'b4', partId: 'p5', batchNo: 'B20250520-004', supplierId: 'sup2', purchasePrice: 220, qty: 2, inboundQty: 8, source: 'purchase', repairCount: 3, inboundDate: d(25) },
];

export const MOCK_STOCK_IN: StockIn[] = [
  {
    id: 'si1', no: 'IN20260610ABC123', source: 'purchase', supplierId: 'sup1', purchaseOrderNo: 'PO2026061001',
    items: [
      { partId: 'p1', batchNo: 'B20250501-001', qty: 10, purchasePrice: 580 },
      { partId: 'p2', batchNo: 'B20250510-002', qty: 15, purchasePrice: 85 },
    ],
    totalAmount: 580 * 10 + 85 * 15, operatorId: 'e1', remark: '正常采购', createdAt: d(5),
  },
  {
    id: 'si2', no: 'IN20260612DEF456', source: 'scatter',
    items: [{ partId: 'p6', batchNo: 'SCATTER-001', qty: 8, purchasePrice: 45 }],
    totalAmount: 360, operatorId: 'e2', createdAt: d(3),
  },
];

export const MOCK_STOCK_OUT: StockOut[] = [
  {
    id: 'so1', no: 'OUT20260614XYZ001', type: 'repair', repairOrderNo: 'WX202606140001',
    items: [
      { partId: 'p1', qty: 1, unitPrice: 899 },
      { partId: 'p2', qty: 2, unitPrice: 180 },
    ],
    totalAmount: 899 + 360, operatorId: 'e2', remark: '客户张先生', createdAt: d(2),
  },
  {
    id: 'so2', no: 'OUT20260615XYZ002', type: 'retail', customerName: '零售客户',
    items: [{ partId: 'p7', qty: 2, unitPrice: 45 }],
    totalAmount: 90, operatorId: 'e3', createdAt: d(1),
  },
  {
    id: 'so3', no: 'OUT20260613XYZ003', type: 'damage', damageReason: '运输破损，屏幕碎裂',
    items: [{ partId: 'p3', qty: 1, unitPrice: 320 }],
    totalAmount: 320, operatorId: 'e1', createdAt: d(4),
  },
];

export const MOCK_TRANSFER: TransferOrder[] = [
  {
    id: 't1', no: 'TR20260614TR001', fromStoreId: 's1', toStoreId: 's2',
    status: 'pending_receive',
    items: [{ partId: 'p2', qty: 3 }, { partId: 'p4', qty: 5 }],
    applicantId: 'e1', shippedAt: d(1), remark: '人民路店申请电池补货',
    createdAt: d(2),
  },
  {
    id: 't2', no: 'TR20260615TR002', fromStoreId: 's1', toStoreId: 's3',
    status: 'in_transit',
    items: [{ partId: 'p7', qty: 10 }],
    applicantId: 'e3', shippedAt: d(0),
    createdAt: d(0),
  },
  {
    id: 't3', no: 'TR20260610TR003', fromStoreId: 's2', toStoreId: 's1',
    status: 'completed',
    items: [{ partId: 'p6', qty: 5 }],
    applicantId: 'e2', shippedAt: d(6), receivedAt: d(5),
    createdAt: d(7),
  },
];

export const MOCK_STOCKTAKE: StocktakeOrder[] = [
  {
    id: 'st1', no: 'PD20260601PD001', status: 'completed',
    items: [
      { partId: 'p1', systemQty: 15, actualQty: 14, diffQty: -1, diffAmount: -580, reason: '出库未登账' },
      { partId: 'p2', systemQty: 25, actualQty: 25, diffQty: 0, diffAmount: 0 },
    ],
    operatorId: 'e1', createdAt: d(15), completedAt: d(15),
  },
];

export const MOCK_PRICE_HISTORY: PriceHistory[] = [
  { id: 'ph1', partId: 'p1', field: 'retailPrice', oldValue: 999, newValue: 899, operatorId: 'e1', createdAt: d(30) },
  { id: 'ph2', partId: 'p2', field: 'purchasePrice', oldValue: 90, newValue: 85, operatorId: 'e1', createdAt: d(40) },
  { id: 'ph3', partId: 'p9', field: 'retailPrice', oldValue: 799, newValue: 699, operatorId: 'e1', createdAt: d(25) },
];

export const MOCK_BATCH_PHOTOS: BatchPhoto[] = [
  { id: 'bp1', batchId: 'b1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=warehouse%20iphone%20screen%20parts%20invoice&image_size=square', type: 'invoice', remark: '采购单照片' },
  { id: 'bp2', batchId: 'b1', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smartphone%20lcd%20screen%20replacement%20part&image_size=square', type: 'part' },
  { id: 'bp3', batchId: 'b4', url: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smartphone%20camera%20module%20close%20up&image_size=square', type: 'part' },
];

const logDiff = (oldVal: unknown, newVal: unknown) => ({ old: oldVal, new: newVal });

export const MOCK_LOGS: OperationLog[] = [
  { id: 'l1', operatorId: 'e1', module: '备件档案', action: 'create', targetId: 'p1', targetType: 'Part', createdAt: d(120) },
  { id: 'l2', operatorId: 'e1', module: '价格', action: 'update', targetId: 'p1', targetType: 'Part', diff: { retailPrice: logDiff(999, 899) }, createdAt: d(30) },
  { id: 'l3', operatorId: 'e2', module: '入库', action: 'create', targetId: 'si1', targetType: 'StockIn', createdAt: d(5) },
  { id: 'l4', operatorId: 'e2', module: '出库', action: 'create', targetId: 'so1', targetType: 'StockOut', createdAt: d(2) },
  { id: 'l5', operatorId: 'e1', module: '调拨', action: 'confirm', targetId: 't2', targetType: 'TransferOrder', createdAt: d(0) },
  { id: 'l6', operatorId: 'e1', module: '盘点', action: 'confirm', targetId: 'st1', targetType: 'StocktakeOrder', createdAt: d(15) },
];
