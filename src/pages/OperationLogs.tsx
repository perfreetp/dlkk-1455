import { Fragment, useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store';
import {
  ChevronDown, ChevronRight, ClipboardList, Filter,
  ChevronLeft, RotateCcw, User as UserIcon
} from 'lucide-react';
import type { OperationLog, LogAction } from '@/types';
import Button from '@/components/common/Button';
import FormField, { inputClass } from '@/components/common/FormField';
import StatusBadge from '@/components/common/StatusBadge';
import Empty from '@/components/common/Empty';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 50;

const ACTION_STYLES: Record<LogAction, { label: string; className: string; icon: string }> = {
  create: {
    label: '创建',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'text-emerald-600',
  },
  update: {
    label: '更新',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: 'text-blue-600',
  },
  confirm: {
    label: '确认',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'text-amber-600',
  },
  delete: {
    label: '删除',
    className: 'bg-red-50 text-red-700 border-red-200',
    icon: 'text-red-600',
  },
};

const ACTION_LABELS: Record<LogAction, string> = {
  create: '创建',
  update: '更新',
  confirm: '确认',
  delete: '删除',
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  Part: '备件',
  Supplier: '供应商',
  StockIn: '入库单',
  StockOut: '出库单',
  TransferOrder: '调拨单',
  StocktakeOrder: '盘点单',
};

export default function OperationLogs() {
  const { operationLogs, employees, initData, getEmployeeById, getCategoryById } = useStore();

  useEffect(() => { initData(); }, [initData]);

  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterOperator, setFilterOperator] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const allModules = useMemo(() => {
    const set = new Set<string>();
    operationLogs.forEach(l => set.add(l.module));
    return Array.from(set).sort();
  }, [operationLogs]);

  const allTargetTypes = useMemo(() => {
    const set = new Set<string>();
    operationLogs.forEach(l => set.add(l.targetType));
    return Array.from(set).sort();
  }, [operationLogs]);

  const filteredLogs = useMemo(() => {
    let logs = [...operationLogs];
    if (filterModule) logs = logs.filter(l => l.module === filterModule);
    if (filterAction) logs = logs.filter(l => l.action === filterAction);
    if (filterOperator) logs = logs.filter(l => l.operatorId === filterOperator);
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00').getTime();
      logs = logs.filter(l => new Date(l.createdAt).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59').getTime();
      logs = logs.filter(l => new Date(l.createdAt).getTime() <= to);
    }
    logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return logs;
  }, [operationLogs, filterModule, filterAction, filterOperator, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedLogs = filteredLogs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setFilterModule('');
    setFilterAction('');
    setFilterOperator('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const formatDiffValue = (val: unknown): string => {
    if (val === null || val === undefined) return '（空）';
    if (typeof val === 'string') {
      if (val === '') return '（空字符串）';
      return val;
    }
    if (typeof val === 'boolean') return val ? '是' : '否';
    if (Array.isArray(val)) {
      if (val.length === 0) return '（空数组）';
      const mapped = val.map(v => {
        if (typeof v === 'string') {
          const cat = getCategoryById(v);
          return cat?.name ?? v;
        }
        return String(v);
      });
      return mapped.join('、');
    }
    return String(val);
  };

  const formatDiffFieldLabel = (field: string): string => {
    const map: Record<string, string> = {
      sku: 'SKU',
      name: '名称',
      categoryId: '品类',
      compatibleModels: '适配机型',
      qualityLevel: '品质等级',
      supplierId: '供应商',
      purchasePrice: '进货价',
      retailPrice: '零售价',
      warrantyDays: '保修天数',
      location: '库位',
      safetyStock: '安全库存',
      stockQty: '库存数量',
      contact: '联系人',
      phone: '电话',
      wechat: '微信号',
      address: '地址',
      mainCategories: '主营品类',
      remark: '备注',
      status: '状态',
    };
    return map[field] ?? field;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">操作日志</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          共 {filteredLogs.length} 条记录
          {filteredLogs.length !== operationLogs.length && ` / 总计 ${operationLogs.length} 条`}
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">筛选条件</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <FormField label="模块">
            <select
              value={filterModule}
              onChange={e => { setFilterModule(e.target.value); setPage(1); }}
              className={inputClass}
            >
              <option value="">全部模块</option>
              {allModules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </FormField>
          <FormField label="操作类型">
            <select
              value={filterAction}
              onChange={e => { setFilterAction(e.target.value); setPage(1); }}
              className={inputClass}
            >
              <option value="">全部类型</option>
              {(Object.keys(ACTION_LABELS) as LogAction[]).map(a => (
                <option key={a} value={a}>{ACTION_LABELS[a]}</option>
              ))}
            </select>
          </FormField>
          <FormField label="操作人">
            <select
              value={filterOperator}
              onChange={e => { setFilterOperator(e.target.value); setPage(1); }}
              className={inputClass}
            >
              <option value="">全部人员</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </FormField>
          <FormField label="开始日期">
            <input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1); }}
              className={inputClass}
            />
          </FormField>
          <FormField label="结束日期">
            <div className="flex gap-2">
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setPage(1); }}
                className={inputClass}
              />
              <Button
                variant="outline"
                size="md"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={resetFilters}
                title="重置筛选"
              />
            </div>
          </FormField>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded shadow-card overflow-hidden">
        {pagedLogs.length === 0 ? (
          <Empty title="暂无符合条件的操作日志" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-10 px-3 py-3"></th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">时间</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">模块</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">操作</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">操作人</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">目标类型</th>
                    <th className="text-left px-3 py-3 font-semibold text-slate-700 text-xs uppercase tracking-wider">目标ID</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLogs.map(log => {
                    const isExpanded = expandedRows.has(log.id);
                    const operator = getEmployeeById(log.operatorId);
                    const actionStyle = ACTION_STYLES[log.action];
                    const hasDiff = log.diff && Object.keys(log.diff).length > 0;
                    return (
                      <Fragment key={log.id}>
                        <tr
                          className={cn(
                            'border-b border-slate-100 transition-colors',
                            hasDiff ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/40',
                            isExpanded && 'bg-amber-50/30'
                          )}
                          onClick={() => hasDiff && toggleRow(log.id)}
                        >
                          <td className="px-3 py-3 text-center align-top">
                            {hasDiff ? (
                              isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400 mx-auto" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400 mx-auto" />
                              )
                            ) : (
                              <div className="w-4 h-4 mx-auto" />
                            )}
                          </td>
                          <td className="px-3 py-3 text-slate-600 text-xs whitespace-nowrap align-top">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-3 py-3 text-slate-700 font-medium align-top">
                            {log.module}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <StatusBadge
                              label={actionStyle.label}
                              className={actionStyle.className}
                            />
                          </td>
                          <td className="px-3 py-3 text-slate-700 align-top">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <UserIcon className="w-3 h-3 text-slate-500" />
                              </div>
                              <span>{operator?.name ?? '-'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <StatusBadge
                              label={TARGET_TYPE_LABELS[log.targetType] ?? log.targetType}
                              className="bg-slate-50 text-slate-600 border-slate-200"
                            />
                          </td>
                          <td className="px-3 py-3 font-mono text-xs text-slate-500 align-top">
                            {log.targetId}
                          </td>
                        </tr>
                        {isExpanded && hasDiff && log.diff && (
                          <tr className="bg-slate-50/50 border-b border-slate-100">
                            <td colSpan={7} className="px-6 py-3">
                              <div className="pl-8 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                                <ClipboardList className="w-3.5 h-3.5" />
                                <span>变更详情（{Object.keys(log.diff).length} 项）</span>
                              </div>
                              <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                      <th className="text-left px-3 py-2 font-semibold text-slate-600 w-1/5">字段</th>
                                      <th className="text-left px-3 py-2 font-semibold text-red-600 w-2/5">变更前</th>
                                      <th className="w-10 text-center py-2" />
                                      <th className="text-left px-3 py-2 font-semibold text-emerald-600 w-2/5">变更后</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(log.diff).map(([field, val], idx) => (
                                      <tr key={field} className={idx > 0 ? 'border-t border-slate-100' : ''}>
                                        <td className="px-3 py-2 font-medium text-slate-700">
                                          {formatDiffFieldLabel(field)}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className="inline-block max-w-full px-2 py-0.5 rounded bg-red-50 border border-red-100 text-red-700 break-all">
                                            {formatDiffValue(val.old)}
                                          </span>
                                        </td>
                                        <td className="py-2 text-center">
                                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                                        </td>
                                        <td className="px-3 py-2">
                                          <span className="inline-block max-w-full px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 break-all">
                                            {formatDiffValue(val.new)}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                <div className="text-xs text-slate-500">
                  第 {currentPage} / {totalPages} 页，每页 {PAGE_SIZE} 条
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ChevronLeft className="w-4 h-4" />}
                    disabled={currentPage === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    上一页
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={cn(
                            'w-8 h-8 rounded text-xs font-medium transition-colors',
                            pageNum === currentPage
                              ? 'bg-accent-amber text-white'
                              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ChevronRight className="w-4 h-4" />}
                    disabled={currentPage === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
