import { useEffect, useState, useCallback } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  Search,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { ProductLocalization } from '@shared/api.interface';
import * as localizationApi from '@/api/localization';
import { cn } from '@/lib/utils';

const LANGUAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'vi', label: '越南语' },
  { value: 'th', label: '泰语' },
  { value: 'id', label: '印尼语' },
  { value: 'ms', label: '马来语' },
  { value: 'fil', label: '菲律宾语' },
];

const PLATFORM_OPTIONS = ['Shopee', 'Lazada', 'TikTok Shop'];

const CATEGORY_OPTIONS = [
  '电子产品',
  '服装',
  '个护健康',
  '家居厨房',
  '美妆',
  '母婴',
  '食品',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function LocalizationPage() {
  const [products, setProducts] = useState<ProductLocalization[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductLocalization | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [activeLang, setActiveLang] = useState<string>('vi');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editingBullets, setEditingBullets] = useState<string[]>([]);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [editingKeywords, setEditingKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  // Create form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPlatforms, setFormPlatforms] = useState<string[]>([]);
  const [formLanguages, setFormLanguages] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await localizationApi.getProducts({
        page: 1,
        pageSize: 20,
        platform: platformFilter || undefined,
        language: languageFilter || undefined,
      });
      setProducts(result.items);
      if (result.items.length > 0 && !selectedId) {
        setSelectedId(result.items[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [platformFilter, languageFilter, selectedId]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!selectedId) return;
    const fetchDetail = async (): Promise<void> => {
      setDetailLoading(true);
      try {
        const product = await localizationApi.getProduct(selectedId);
        setSelectedProduct(product);
        if (
          product.targetLanguages &&
          product.targetLanguages.length > 0
        ) {
          const firstLang = product.targetLanguages[0];
          setActiveLang(firstLang);
          setEditingTitle(product.localizedTitles?.[firstLang] ?? '');
          setEditingBullets(product.bulletPoints?.[firstLang] ?? ['', '', '', '', '']);
          setEditingDesc(product.descriptions?.[firstLang] ?? '');
          setEditingKeywords(product.keywords?.[firstLang] ?? []);
        }
      } finally {
        setDetailLoading(false);
      }
    };
    void fetchDetail();
  }, [selectedId]);

  const handleSelect = (id: string): void => {
    setSelectedId(id);
  };

  const handleLangChange = (lang: string): void => {
    setActiveLang(lang);
    setEditingTitle(selectedProduct?.localizedTitles?.[lang] ?? '');
    setEditingBullets(
      selectedProduct?.bulletPoints?.[lang] ?? ['', '', '', '', ''],
    );
    setEditingDesc(selectedProduct?.descriptions?.[lang] ?? '');
    setEditingKeywords(selectedProduct?.keywords?.[lang] ?? []);
  };

  const handleBulletChange = (index: number, value: string): void => {
    const newBullets = [...editingBullets];
    newBullets[index] = value;
    setEditingBullets(newBullets);
  };

  const handleAddKeyword = (): void => {
    const trimmed = keywordInput.trim();
    if (!trimmed) return;
    if (editingKeywords.includes(trimmed)) {
      setKeywordInput('');
      return;
    }
    setEditingKeywords([...editingKeywords, trimmed]);
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string): void => {
    setEditingKeywords(editingKeywords.filter((k: string) => k !== kw));
  };

  const handleRegenerate = async (): Promise<void> => {
    if (!selectedId) return;
    setRegenerating(true);
    try {
      const updated = await localizationApi.regenerateProduct(
        selectedId,
        activeLang,
      );
      setSelectedProduct(updated);
      setEditingTitle(updated.localizedTitles?.[activeLang] ?? '');
      setEditingBullets(
        updated.bulletPoints?.[activeLang] ?? ['', '', '', '', ''],
      );
      setEditingDesc(updated.descriptions?.[activeLang] ?? '');
      setEditingKeywords(updated.keywords?.[activeLang] ?? []);
      // Also update the list item
      setProducts((prev) =>
        prev.map((p: ProductLocalization) =>
          p.id === updated.id ? updated : p,
        ),
      );
    } finally {
      setRegenerating(false);
    }
  };

  const handlePlatformToggle = (platform: string): void => {
    setFormPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p: string) => p !== platform)
        : [...prev, platform],
    );
  };

  const handleLanguageToggle = (lang: string): void => {
    setFormLanguages((prev) =>
      prev.includes(lang)
        ? prev.filter((l: string) => l !== lang)
        : [...prev, lang],
    );
  };

  const handleCreate = async (): Promise<void> => {
    if (!formName.trim()) return;
    if (formPlatforms.length === 0) return;
    if (formLanguages.length === 0) return;
    setCreating(true);
    try {
      const newProduct = await localizationApi.createProduct({
        nameCn: formName,
        category: formCategory || undefined,
        productDesc: formDesc || undefined,
        targetPlatforms: formPlatforms,
        targetLanguages: formLanguages,
      });
      setProducts((prev) => [newProduct, ...prev]);
      setSelectedId(newProduct.id);
      setCreateDialogOpen(false);
      // Reset form
      setFormName('');
      setFormCategory('');
      setFormDesc('');
      setFormPlatforms([]);
      setFormLanguages([]);
    } finally {
      setCreating(false);
    }
  };

  const statusBadge = (status: string): React.ReactNode => {
    if (status === 'completed') {
      return (
        <Badge
          variant="outline"
          className="border-emerald-200 bg-emerald-50 text-emerald-700"
        >
          已完成
        </Badge>
      );
    }
    if (status === 'processing') {
      return (
        <Badge
          variant="outline"
          className="border-blue-200 bg-blue-50 text-blue-700"
        >
          生成中
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-slate-200 text-slate-600">
        草稿
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              商品本地化工作台
            </h2>
            <p className="text-xs text-slate-500">
              AI 多语种商品文案生成 · 文化禁忌智能检测
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Select
              value={platformFilter}
              onValueChange={setPlatformFilter}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue placeholder="平台筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部平台</SelectItem>
                {PLATFORM_OPTIONS.map((p: string) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={languageFilter}
              onValueChange={setLanguageFilter}
            >
              <SelectTrigger size="sm" className="w-32">
                <SelectValue placeholder="语言筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部语言</SelectItem>
                {LANGUAGE_OPTIONS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white border-blue-700"
          >
            <Plus className="w-4 h-4" />
            新建本地化
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: record list */}
        <div className="w-[280px] flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="搜索商品..."
                className="pl-9 h-8 text-sm"
              />
            </div>
          </div>
          {loading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i: number) => (
                <div key={i} className="p-3 rounded-lg border border-slate-100">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <div className="flex gap-1">
                    <Skeleton className="h-4 w-10 rounded" />
                    <Skeleton className="h-4 w-10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-6">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Globe className="w-5 h-5" />
                  </EmptyMedia>
                  <EmptyTitle>暂无本地化记录</EmptyTitle>
                  <EmptyDescription>
                    点击右上角「新建本地化」开始创建
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {products.map((p: ProductLocalization) => (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition-all border',
                    selectedId === p.id
                      ? 'bg-blue-50 border-blue-200 shadow-sm'
                      : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200',
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-medium text-slate-800 line-clamp-1 flex-1">
                      {p.nameCn}
                    </h3>
                    {statusBadge(p.status)}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    {p.category || '未分类'}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {p.targetLanguages?.slice(0, 3).map((lang: string) => (
                      <Badge
                        key={lang}
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-600 font-normal"
                      >
                        {LANGUAGE_OPTIONS.find(
                          (l) => l.value === lang,
                        )?.label || lang}
                      </Badge>
                    ))}
                    {p.targetLanguages && p.targetLanguages.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-500 font-normal"
                      >
                        +{p.targetLanguages.length - 3}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {formatDate(p.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {detailLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : !selectedProduct ? (
            <div className="h-full flex items-center justify-center">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Globe className="w-5 h-5" />
                  </EmptyMedia>
                  <EmptyTitle>选择一条记录查看详情</EmptyTitle>
                  <EmptyDescription>
                    从左侧列表中选择商品，查看或编辑本地化内容
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          ) : (
            <div className="space-y-5 max-w-4xl mx-auto">
              {/* Basic info card */}
              <Card className="border border-slate-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-slate-800">
                        {selectedProduct.nameCn}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-600"
                        >
                          {selectedProduct.category || '未分类'}
                        </Badge>
                        <div className="flex gap-1">
                          {selectedProduct.targetPlatforms?.map(
                            (p: string) => (
                              <Badge
                                key={p}
                                variant="outline"
                                className="border-blue-200 text-blue-600 bg-blue-50/50"
                              >
                                {p}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                    {statusBadge(selectedProduct.status)}
                  </div>
                </CardHeader>
              </Card>

              {/* Language tabs */}
              <Card className="border border-slate-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    本地化文案
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeLang} onValueChange={handleLangChange}>
                    <TabsList className="mb-4 bg-slate-100">
                      {selectedProduct.targetLanguages?.map(
                        (lang: string) => {
                          const langOption = LANGUAGE_OPTIONS.find(
                            (l) => l.value === lang,
                          );
                          return (
                            <TabsTrigger key={lang} value={lang}>
                              {langOption?.label || lang}
                            </TabsTrigger>
                          );
                        },
                      )}
                    </TabsList>

                    {selectedProduct.targetLanguages?.map(
                      (lang: string) => (
                        <TabsContent key={lang} value={lang} className="space-y-5">
                          {/* Title */}
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                              本地化标题
                            </Label>
                            <Input
                              value={
                                activeLang === lang ? editingTitle : ''
                              }
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="bg-white"
                            />
                          </div>

                          {/* Bullet points */}
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">
                              五点卖点
                            </Label>
                            <div className="space-y-2">
                              {(activeLang === lang ? editingBullets : ['', '', '', '', '']).map(
                                (bp: string, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center mt-2">
                                      {idx + 1}
                                    </span>
                                    <Textarea
                                      value={bp}
                                      onChange={(e) =>
                                        activeLang === lang &&
                                        handleBulletChange(idx, e.target.value)
                                      }
                                      placeholder={`卖点 ${idx + 1}`}
                                      className="bg-white min-h-[60px] text-sm"
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                              详情描述
                            </Label>
                            <Textarea
                              value={activeLang === lang ? editingDesc : ''}
                              onChange={(e) => setEditingDesc(e.target.value)}
                              className="bg-white min-h-[120px] text-sm leading-relaxed"
                            />
                          </div>

                          {/* Keywords */}
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">
                              搜索关键词
                            </Label>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {(activeLang === lang
                                ? editingKeywords
                                : []
                              ).map((kw: string) => (
                                <Badge
                                  key={kw}
                                  variant="outline"
                                  className="gap-1.5 pl-2.5 pr-1 py-1 border-cyan-200 bg-cyan-50 text-cyan-700"
                                >
                                  {kw}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-4 h-4 hover:bg-cyan-100 text-cyan-600"
                                    onClick={() => handleRemoveKeyword(kw)}
                                    aria-label={`删除关键词 ${kw}`}
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={keywordInput}
                                onChange={(e) =>
                                  setKeywordInput(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddKeyword();
                                  }
                                }}
                                placeholder="输入关键词后回车添加"
                                className="h-8 text-sm"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleAddKeyword}
                                className="h-8"
                              >
                                添加
                              </Button>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between pt-2 border-t border-slate-100">
                            <Button
                              variant="outline"
                              onClick={handleRegenerate}
                              disabled={regenerating}
                              className="gap-2"
                            >
                              {regenerating ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              重新生成
                            </Button>
                            <Button
                              variant="outline"
                              className="gap-2 border-slate-300 text-slate-700"
                            >
                              <Download className="w-4 h-4" />
                              导出
                            </Button>
                          </div>
                        </TabsContent>
                      ),
                    )}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Cultural check */}
              <Card className="border border-slate-200 rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    文化禁忌检查
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedProduct.culturalCheck?.hasIssues ? (
                    <div className="space-y-3">
                      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 [&>svg]:text-red-500">
                        <AlertTriangle className="w-4 h-4" />
                        <AlertTitle>检测到 {selectedProduct.culturalCheck.warnings.length} 项文化风险</AlertTitle>
                        <AlertDescription>
                          建议在发布前根据提示进行调整，以避免目标市场的文化冲突
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-3">
                        {selectedProduct.culturalCheck.warnings.map(
                          (w: { type: string; description: string; suggestion: string }, idx: number) => (
                            <div
                              key={idx}
                              className="p-4 rounded-lg border border-red-200 bg-red-50/50"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="font-medium text-red-800 text-sm">
                                  {w.type}
                                </span>
                              </div>
                              <p className="text-sm text-red-700 mb-2">
                                {w.description}
                              </p>
                              <div className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-700">
                                  <span className="font-medium">建议：</span>
                                  {w.suggestion}
                                </p>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <Alert variant="default" className="bg-emerald-50 border-emerald-200 text-emerald-800 [&>svg]:text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                      <AlertTitle>文化检查通过</AlertTitle>
                      <AlertDescription>
                        未检测到明显的文化禁忌问题，可安全在目标市场发布
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建商品本地化</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                商品中文名 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="请输入商品中文名"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                品类
              </Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择品类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c: string) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                商品描述
              </Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="可选，输入商品描述帮助 AI 生成更精准的文案"
                className="min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                目标平台 <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-3">
                {PLATFORM_OPTIONS.map((p: string) => (
                  <label
                    key={p}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={formPlatforms.includes(p)}
                      onCheckedChange={() => handlePlatformToggle(p)}
                    />
                    <span className="text-sm text-slate-700">{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                目标语言 <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGE_OPTIONS.map((l) => (
                  <label
                    key={l.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={formLanguages.includes(l.value)}
                      onCheckedChange={() => handleLanguageToggle(l.value)}
                    />
                    <span className="text-sm text-slate-700">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={creating || !formName.trim() || formPlatforms.length === 0 || formLanguages.length === 0}
              className="bg-blue-600 hover:bg-blue-700 border-blue-700"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {creating ? '生成中...' : 'AI 生成文案'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
