import { useCallback, useEffect, useState } from 'react';
import {
  FileText,
  Upload,
  Filter,
  CheckSquare,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Download,
  Edit3,
  Save,
  FileCheck2,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { DocumentFields, DocumentRecord } from '@shared/api.interface';
import * as documentsApi from '@/api/documents';
import { cn } from '@/lib/utils';

const DOC_TYPE_LABELS: Record<string, string> = {
  invoice: '商业发票',
  packing_list: '装箱单',
  bill_of_lading: '海运提单',
  certificate_of_origin: '原产地证',
};

const STATUS_LABELS: Record<string, string> = {
  completed: '已完成',
  processing: '处理中',
  failed: '失败',
};

const FIELD_LABELS: Record<string, string> = {
  invoiceNo: '发票号',
  blNo: '提单号',
  shipper: '发货人',
  consignee: '收货人',
  productName: '品名',
  hsCode: 'HS 编码',
  quantity: '数量',
  unitPrice: '单价',
  totalAmount: '总金额',
  grossWeight: '毛重(kg)',
  netWeight: '净重(kg)',
  containerNo: '集装箱号',
  originCountry: '原产国',
  destinationCountry: '目的国',
  currency: '币种',
};

const FIELD_ORDER = [
  'invoiceNo',
  'blNo',
  'shipper',
  'consignee',
  'productName',
  'hsCode',
  'quantity',
  'unitPrice',
  'totalAmount',
  'grossWeight',
  'netWeight',
  'containerNo',
  'originCountry',
  'destinationCountry',
  'currency',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function getDocTypeColor(type: string): string {
  switch (type) {
    case 'invoice':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'packing_list':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'bill_of_lading':
      return 'border-purple-200 bg-purple-50 text-purple-700';
    case 'certificate_of_origin':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'processing':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'failed':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

interface CrossCheckResult {
  docs: DocumentRecord[];
  hasDiscrepancies: boolean;
  discrepancies: {
    field: string;
    fieldLabel: string;
    values: { docId: string; fileName: string; value: string }[];
    severity: string;
  }[];
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingFields, setEditingFields] = useState<Partial<DocumentFields>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cross-check state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [crossCheckResult, setCrossCheckResult] = useState<CrossCheckResult | null>(null);
  const [crossCheckOpen, setCrossCheckOpen] = useState(false);
  const [crossChecking, setCrossChecking] = useState(false);

  // Upload dialog
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await documentsApi.getDocuments({
        page: 1,
        pageSize: 20,
        docType: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      setDocs(result.items);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => {
    void fetchDocs();
  }, [fetchDocs]);

  const handleViewDetail = async (id: string): Promise<void> => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const doc = await documentsApi.getDocument(id);
      setSelectedDoc(doc);
      setEditingFields(doc.extractedFields || {});
      setIsEditing(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFieldEdit = (field: string, value: string): void => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (): Promise<void> => {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      const updated = await documentsApi.updateDocument(selectedDoc.id, {
        extractedFields: editingFields,
      });
      setSelectedDoc(updated);
      setEditingFields(updated.extractedFields || {});
      setIsEditing(false);
      // Update list
      setDocs((prev) =>
        prev.map((d: DocumentRecord) =>
          d.id === updated.id ? updated : d,
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSelect = (id: string): void => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id],
    );
  };

  const handleCrossCheck = async (): Promise<void> => {
    if (selectedIds.length < 2) return;
    setCrossChecking(true);
    try {
      const result = await documentsApi.crossCheckDocs(selectedIds);
      setCrossCheckResult(result);
      setCrossCheckOpen(true);
    } finally {
      setCrossChecking(false);
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!uploadFileName.trim() || !uploadDocType) return;
    setUploading(true);
    try {
      const newDoc = await documentsApi.uploadDocument({
        fileName: uploadFileName,
        docType: uploadDocType,
      });
      setDocs((prev) => [newDoc, ...prev]);
      setUploadOpen(false);
      setUploadFileName('');
      setUploadDocType('');
    } finally {
      setUploading(false);
    }
  };

  const getConfidenceColor = (confidence: number | undefined): string => {
    if (!confidence) return 'bg-slate-200';
    if (confidence >= 0.95) return 'bg-emerald-500';
    if (confidence >= 0.9) return 'bg-blue-500';
    if (confidence >= 0.8) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const isLowConfidence = (confidence: number | undefined): boolean => {
    return confidence ? confidence < 0.9 : false;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              单证智能处理
            </h2>
            <p className="text-xs text-slate-500">
              OCR 智能抽取 · 跨单一致性核对 · 人工校正
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="搜索单证..."
                className="pl-9 h-8 w-56 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger size="sm" className="w-32">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="w-28">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部状态</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <Button
            variant="outline"
            onClick={() => void handleCrossCheck()}
            disabled={selectedIds.length < 2 || crossChecking}
            className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {crossChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckSquare className="w-4 h-4" />
            )}
            跨单核对
            {selectedIds.length > 0 && (
              <Badge className="ml-1 h-5 min-w-[20px] justify-center bg-purple-600 text-white border-0">
                {selectedIds.length}
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setUploadOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
          >
            <Upload className="w-4 h-4" />
            上传单证
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i: number) => (
              <Card key={i} className="border border-slate-200">
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-2 w-full rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText className="w-5 h-5" />
                </EmptyMedia>
                <EmptyTitle>暂无单证记录</EmptyTitle>
                <EmptyDescription>
                  点击右上角「上传单证」开始处理
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {docs.map((doc: DocumentRecord) => (
              <Card
                key={doc.id}
                className={cn(
                  'border border-slate-200 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5',
                  selectedIds.includes(doc.id)
                    ? 'ring-2 ring-blue-500 ring-offset-2'
                    : '',
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Checkbox
                        checked={selectedIds.includes(doc.id)}
                        onCheckedChange={() => handleToggleSelect(doc.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <h3
                        className="text-sm font-medium text-slate-800 line-clamp-2 flex-1 leading-snug"
                        title={doc.fileName}
                      >
                        {doc.fileName}
                      </h3>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3" onClick={() => void handleViewDetail(doc.id)}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getDocTypeColor(doc.docType))}
                    >
                      {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn('text-xs', getStatusColor(doc.status))}
                    >
                      {STATUS_LABELS[doc.status] || doc.status}
                    </Badge>
                  </div>

                  {doc.confidence !== undefined && doc.status === 'completed' && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">置信度</span>
                        <span
                          className={cn(
                            'font-medium',
                            doc.confidence >= 0.95
                              ? 'text-emerald-600'
                              : doc.confidence >= 0.9
                              ? 'text-blue-600'
                              : doc.confidence >= 0.8
                              ? 'text-amber-600'
                              : 'text-red-600',
                          )}
                        >
                          {Math.round(doc.confidence * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={doc.confidence * 100}
                        className={cn(
                          'h-1.5',
                          doc.confidence >= 0.95
                            ? '[&>div]:bg-emerald-500'
                            : doc.confidence >= 0.9
                            ? '[&>div]:bg-blue-500'
                            : doc.confidence >= 0.8
                            ? '[&>div]:bg-amber-500'
                            : '[&>div]:bg-red-500',
                        )}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400">
                      {formatDate(doc.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleViewDetail(doc.id);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      查看
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-slate-200">
            <DialogTitle className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-600" />
              单证详情
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : !selectedDoc ? null : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* File info */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-7 h-7 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-800 mb-1 truncate">
                      {selectedDoc.fileName}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          getDocTypeColor(selectedDoc.docType),
                        )}
                      >
                        {DOC_TYPE_LABELS[selectedDoc.docType] ||
                          selectedDoc.docType}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          getStatusColor(selectedDoc.status),
                        )}
                      >
                        {STATUS_LABELS[selectedDoc.status] ||
                          selectedDoc.status}
                      </Badge>
                      {selectedDoc.confidence !== undefined && (
                        <span className="text-xs text-slate-500">
                          置信度{' '}
                          <span
                            className={cn(
                              'font-medium',
                              selectedDoc.confidence >= 0.9
                                ? 'text-emerald-600'
                                : 'text-red-600',
                            )}
                          >
                            {Math.round(selectedDoc.confidence * 100)}%
                          </span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      上传时间：{formatDate(selectedDoc.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Extracted fields */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-slate-800">
                      抽取字段
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(!isEditing)}
                      className="h-7 text-blue-600 hover:bg-blue-50"
                    >
                      {isEditing ? (
                        <>
                          <X className="w-3.5 h-3.5 mr-1" />
                          取消编辑
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5 mr-1" />
                          人工校正
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-32 font-medium text-slate-600">
                            字段
                          </TableHead>
                          <TableHead className="font-medium text-slate-600">
                            值
                          </TableHead>
                          <TableHead className="w-28 font-medium text-slate-600 text-right">
                            置信度
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {FIELD_ORDER.filter(
                          (f) =>
                            editingFields[
                              f as keyof DocumentFields
                            ] !== undefined,
                        ).map((field) => {
                          const value =
                            editingFields[
                              field as keyof DocumentFields
                            ];
                          const valStr =
                            value !== undefined && value !== null
                              ? String(value)
                              : '';
                          // Simulate per-field confidence based on overall
                          const fieldConfidence =
                            (selectedDoc.confidence || 0.9) +
                            (field === 'hsCode' ? -0.05 : field === 'shipper' ? -0.03 : field === 'consignee' ? -0.04 : 0.01);
                          const lowConf = fieldConfidence < 0.9;
                          return (
                            <TableRow
                              key={field}
                              className={cn(
                                lowConf && !isEditing
                                  ? 'bg-red-50/60'
                                  : '',
                              )}
                            >
                              <TableCell className="text-sm text-slate-600 font-medium">
                                {FIELD_LABELS[field] || field}
                              </TableCell>
                              <TableCell>
                                {isEditing ? (
                                  <Input
                                    value={valStr}
                                    onChange={(e) =>
                                      handleFieldEdit(field, e.target.value)
                                    }
                                    className="h-8 text-sm"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {lowConf && (
                                      <span className="relative inline-flex">
                                      <AlertTriangle
                                        className="w-3.5 h-3.5 text-red-500 flex-shrink-0"
                                      />
                                      <span className="sr-only">低置信度</span>
                                    </span>
                                    )}
                                    <span
                                      className={cn(
                                        'text-sm whitespace-pre-wrap',
                                        lowConf
                                          ? 'text-red-700 font-medium'
                                          : 'text-slate-800',
                                      )}
                                    >
                                      {valStr || '-'}
                                    </span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <span
                                    className={cn(
                                      'text-xs font-medium',
                                      fieldConfidence >= 0.95
                                        ? 'text-emerald-600'
                                        : fieldConfidence >= 0.9
                                        ? 'text-blue-600'
                                        : 'text-red-600',
                                    )}
                                  >
                                    {Math.round(fieldConfidence * 100)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="gap-2 border-slate-300 text-slate-700"
                >
                  <Download className="w-4 h-4" />
                  导出
                </Button>
                {isEditing ? (
                  <Button
                    onClick={() => void handleSave()}
                    disabled={saving}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 border-blue-700"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    保存校正
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setDetailOpen(false)}
                  >
                    关闭
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cross-check dialog */}
      <Dialog open={crossCheckOpen} onOpenChange={setCrossCheckOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b border-slate-200">
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-purple-600" />
              跨单一致性核对结果
            </DialogTitle>
          </DialogHeader>

          {crossCheckResult && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Summary */}
              {crossCheckResult.hasDiscrepancies ? (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 [&>svg]:text-red-500">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>
                    发现 {crossCheckResult.discrepancies.length} 处不一致
                  </AlertTitle>
                  <AlertDescription>
                    请仔细核对以下字段，确认是数据差异还是 OCR 识别错误
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="default" className="bg-emerald-50 border-emerald-200 text-emerald-800 [&>svg]:text-emerald-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <AlertTitle>核对通过</AlertTitle>
                  <AlertDescription>
                    所有单据的关键字段完全一致，未发现异常
                  </AlertDescription>
                </Alert>
              )}

              {/* Docs list */}
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">
                  核对单据（{crossCheckResult.docs.length} 张）
                </h4>
                <div className="flex flex-wrap gap-2">
                  {crossCheckResult.docs.map((d: DocumentRecord) => (
                    <Badge
                      key={d.id}
                      variant="outline"
                      className={cn(
                        'text-xs px-3 py-1',
                        getDocTypeColor(d.docType),
                      )}
                    >
                      {DOC_TYPE_LABELS[d.docType] || d.docType}
                      <span className="mx-1 text-slate-400">·</span>
                      <span className="truncate max-w-[160px]">
                        {d.fileName}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Discrepancies table */}
              {crossCheckResult.hasDiscrepancies && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">
                    不一致字段
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-28 font-medium text-slate-600">
                            字段
                          </TableHead>
                          {crossCheckResult.docs.map((d: DocumentRecord) => (
                            <TableHead
                              key={d.id}
                              className="font-medium text-slate-600"
                            >
                              <div className="truncate max-w-[150px]" title={d.fileName}>
                                {DOC_TYPE_LABELS[d.docType] || d.docType}
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="w-20 font-medium text-slate-600 text-right">
                            严重程度
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {crossCheckResult.discrepancies.map((disc) => (
                          <TableRow key={disc.field} className="bg-red-50/40">
                            <TableCell className="text-sm font-medium text-slate-700">
                              {disc.fieldLabel}
                            </TableCell>
                            {crossCheckResult.docs.map((d: DocumentRecord) => {
                              const val =
                                disc.values.find(
                                  (v) => v.docId === d.id,
                                )?.value || '-';
                              return (
                                <TableCell key={d.id}>
                                  <span className="text-sm text-red-700 font-medium">
                                    {val}
                                  </span>
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-right">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  disc.severity === 'high'
                                    ? 'border-red-300 bg-red-100 text-red-700'
                                    : 'border-amber-300 bg-amber-100 text-amber-700',
                                )}
                              >
                                {disc.severity === 'high' ? '高' : '中'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="px-6 py-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setCrossCheckOpen(false)}>
              关闭
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Download className="w-4 h-4" />
              导出核对报告
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>上传单证</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                文件名
              </Label>
              <Input
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="请输入文件名，如 INV-20250901.pdf"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                单证类型
              </Label>
              <Select
                value={uploadDocType}
                onValueChange={setUploadDocType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择单证类型" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                支持 PDF / JPG / PNG 格式
              </p>
              <p className="text-xs text-slate-400 mt-1">
                （演示模式：直接模拟上传流程）
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => void handleUpload()}
              disabled={uploading || !uploadFileName.trim() || !uploadDocType}
              className="bg-blue-600 hover:bg-blue-700 border-blue-700"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? '处理中...' : '开始识别'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
