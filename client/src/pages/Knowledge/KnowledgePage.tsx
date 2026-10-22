import React, { useEffect, useState, useCallback } from 'react';
import {
  Search,
  BookOpen,
  Filter,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  Tag,
  Globe,
  Layers,
  Link as LinkIcon,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import * as knowledgeApi from '@/api/knowledge';
import type { KnowledgeItem, KnowledgeSearchResult } from '@shared/api.interface';

const CATEGORIES = [
  { key: '', label: '全部分类', icon: Layers },
  { key: '政策法规', label: '政策法规', icon: BookOpen },
  { key: '认证注册', label: '认证注册', icon: ShieldCheck },
  { key: '关税税率', label: '关税税率', icon: FileText },
  { key: '平台规则', label: '平台规则', icon: Globe },
  { key: '营销 FAQ', label: '营销 FAQ', icon: Sparkles },
  { key: '市场概况', label: '市场概况', icon: Layers },
  { key: '物流仓储', label: '物流仓储', icon: FileText },
];

const COUNTRIES = [
  { key: '', label: '全部国家' },
  { key: 'vietnam', label: '越南' },
  { key: 'thailand', label: '泰国' },
  { key: 'indonesia', label: '印度尼西亚' },
  { key: 'malaysia', label: '马来西亚' },
  { key: 'philippines', label: '菲律宾' },
  { key: 'singapore', label: '新加坡' },
];

const ITEM_TYPES = [
  { key: '', label: '全部类型' },
  { key: 'regulation', label: '法规政策' },
  { key: 'certification', label: '认证要求' },
  { key: 'tariff', label: '关税信息' },
  { key: 'platform', label: '平台规则' },
  { key: 'guide', label: '指南教程' },
  { key: 'research', label: '研究报告' },
];

function getCountryLabel(countryKey?: string): string {
  if (!countryKey) return '';
  const found = COUNTRIES.find((c) => c.key === countryKey);
  return found?.label ?? countryKey;
}

function getTypeLabel(itemType?: string): string {
  if (!itemType) return '';
  const found = ITEM_TYPES.find((t) => t.key === itemType);
  return found?.label ?? itemType;
}

const KnowledgePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [itemType, setItemType] = useState('');

  const [searchResult, setSearchResult] = useState<KnowledgeSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');

  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [itemPage, setItemPage] = useState(1);

  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());

  const [activeSidebarCategory, setActiveSidebarCategory] = useState('');

  const loadItems = useCallback(async () => {
    try {
      setLoadingItems(true);
      const result = await knowledgeApi.getItems({
        page: itemPage,
        pageSize: 9,
        category: activeSidebarCategory || category || undefined,
        country: country || undefined,
        itemType: itemType || undefined,
      });
      setItems(result.items);
      setTotalItems(result.total);
    } catch (error) {
      logger.error('加载知识库条目失败', error);
    } finally {
      setLoadingItems(false);
    }
  }, [itemPage, category, country, itemType, activeSidebarCategory]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setSearching(true);
      setSearchedQuery(query);
      const result = await knowledgeApi.searchKnowledge({
        query,
        country: country || undefined,
        category: category || undefined,
        itemType: itemType || undefined,
      });
      setSearchResult(result);
    } catch (error) {
      logger.error('搜索失败', error);
    } finally {
      setSearching(false);
    }
  };

  const toggleSource = (itemId: string) => {
    setExpandedSources((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleViewSource = async (itemId: string) => {
    // 已展开时直接用内存中的 item；未展开则查询
    if (expandedSources.has(itemId)) {
      toggleSource(itemId);
      return;
    }
    try {
      const item = await knowledgeApi.getItem(itemId);
      // 把查到的内容合并到 items 里方便引用
      setItems((prev) => {
        const exists = prev.some((it) => it.id === itemId);
        if (exists) return prev.map((it) => (it.id === itemId ? item : it));
        return [item, ...prev];
      });
      toggleSource(itemId);
    } catch (error) {
      logger.error('加载来源条目失败', error);
    }
  };

  const getItemById = (id: string): KnowledgeItem | undefined => {
    return items.find((it) => it.id === id);
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Hero */}
      <div className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6]">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-4">
              <BookOpen className="w-4 h-4" />
              合规知识库 · 全链路溯源
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              知识库问答
            </h1>
            <p className="text-white/80 max-w-xl mx-auto">
              覆盖东盟十国政策法规、认证要求、关税税率、平台规则，每一条回答均可追溯来源，拒绝 AI 幻觉
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="输入问题，从知识库中检索答案... 例如：越南硅胶厨具需要什么认证？"
                className="pl-12 pr-28 h-14 text-base rounded-xl border-0 shadow-lg bg-white"
              />
              <Button
                onClick={handleSearch}
                disabled={searching || !query.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-11 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6]"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    搜索
                  </>
                )}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              <div className="w-[140px]">
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="bg-white/90 backdrop-blur-sm border-white/20 text-white h-9">
                    <Globe className="w-4 h-4 mr-2 text-white/70" />
                    <SelectValue placeholder="国家" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-white/90 backdrop-blur-sm border-white/20 text-white h-9">
                    <Filter className="w-4 h-4 mr-2 text-white/70" />
                    <SelectValue placeholder="分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter((c) => c.key !== '').map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger className="bg-white/90 backdrop-blur-sm border-white/20 text-white h-9">
                    <Tag className="w-4 h-4 mr-2 text-white/70" />
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.filter((t) => t.key !== '').map((t) => (
                      <SelectItem key={t.key} value={t.key}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search Result */}
        {searchResult && (
          <div className="mb-8 space-y-6">
            {/* Answer Card */}
            {!searchResult.hasReliableAnswer && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-800 mb-1">
                    未检索到足够可靠的依据
                  </div>
                  <p className="text-sm text-amber-700">
                    以下答案仅供参考，可能包含不准确的信息。建议您尝试其他关键词，或咨询专业机构获取权威答案。
                  </p>
                </div>
              </div>
            )}

            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#06B6D4] flex items-center justify-center text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        智能回答
                      </CardTitle>
                      <CardDescription className="text-xs">
                        基于知识库检索生成 · 问题：{searchedQuery}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      searchResult.hasReliableAnswer
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }
                  >
                    {searchResult.hasReliableAnswer ? (
                      <>
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        已溯源验证
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        低置信度
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {searchResult.answer}
                </div>
              </CardContent>
            </Card>

            {/* Source References */}
            {searchResult.sources.length > 0 && (
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-blue-500" />
                      溯源引用
                      <span className="text-xs font-normal text-slate-500">
                        共 {searchResult.sources.length} 条来源
                      </span>
                    </CardTitle>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      回答逐句引用，可点击溯源
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Accordion
                    type="multiple"
                    value={Array.from(expandedSources)}
                    onValueChange={(vals) => setExpandedSources(new Set(vals))}
                    className="space-y-2"
                  >
                    {searchResult.sources.map((source, idx) => {
                      const fullItem = getItemById(source.itemId);
                      const isExpanded = expandedSources.has(source.itemId);
                      return (
                        <AccordionItem
                          key={source.itemId}
                          value={source.itemId}
                          className="border border-slate-200 rounded-xl px-4 data-[state=open]:bg-slate-50"
                        >
                          <AccordionTrigger className="hover:no-underline py-3">
                            <div className="flex items-center gap-3 w-full text-left">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-slate-900 truncate">
                                  {source.title}
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  相关度 {Math.round(source.relevance * 100)}%
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="flex-shrink-0 text-xs"
                              >
                                {Math.round(source.relevance * 100)}% 相关
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-4">
                            <div className="pl-10">
                              <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm text-slate-600 mb-3">
                                "{source.snippet}"
                              </div>
                              {isExpanded && fullItem ? (
                                <div className="space-y-3">
                                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {fullItem.content}
                                  </div>
                                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                    {fullItem.sourceName && (
                                      <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <LinkIcon className="w-3 h-3" />
                                        来源：{fullItem.sourceName}
                                      </span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedItem(fullItem)}
                                      className="ml-auto text-xs h-7 text-blue-600"
                                    >
                                      查看完整条目
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  加载完整内容中...
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Knowledge Items Section */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Categories */}
          <div className="w-full lg:w-56 flex-shrink-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  分类导航
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeSidebarCategory === cat.key;
                    return (
                      <button
                        key={cat.label}
                        onClick={() => {
                          setActiveSidebarCategory(cat.key);
                          setItemPage(1);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-blue-500' : 'text-slate-400'
                          }`}
                        />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border-0 shadow-md mt-4">
              <CardContent className="p-5">
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  {totalItems}
                </div>
                <div className="text-sm text-slate-500">知识库条目总数</div>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      溯源覆盖率
                    </span>
                    <span className="font-semibold text-emerald-600">100%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      覆盖国家
                    </span>
                    <span className="font-semibold text-blue-600">10 国</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                {activeSidebarCategory || '全部知识库条目'}
                <span className="text-sm font-normal text-slate-400 ml-2">
                  共 {totalItems} 条
                </span>
              </h2>
            </div>

            {loadingItems ? (
              <div className="py-16 text-center text-slate-400">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                加载中...
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <BookOpen className="w-8 h-8 mx-auto mb-3" />
                <p>暂无相关知识库条目</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-3">
                        {item.content.slice(0, 100)}...
                      </p>

                      <div className="flex items-center flex-wrap gap-1.5 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {item.category}
                        </Badge>
                        {item.country && (
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-200 text-slate-600"
                          >
                            <Globe className="w-3 h-3 mr-1" />
                            {getCountryLabel(item.country)}
                          </Badge>
                        )}
                        {item.itemType && (
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-200 text-slate-600"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {getTypeLabel(item.itemType)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                        <span className="flex items-center gap-1 truncate">
                          <LinkIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">
                            {item.sourceName ?? '内部知识库'}
                          </span>
                        </span>
                        <span className="flex-shrink-0 ml-2">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Load More */}
            {items.length < totalItems && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => setItemPage((p) => p + 1)}
                  disabled={loadingItems}
                >
                  加载更多
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 pr-8">
              {selectedItem?.title}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{selectedItem?.category}</Badge>
              {selectedItem?.country && (
                <Badge variant="outline" className="border-slate-200">
                  <Globe className="w-3 h-3 mr-1" />
                  {getCountryLabel(selectedItem.country)}
                </Badge>
              )}
              {selectedItem?.itemType && (
                <Badge variant="outline" className="border-slate-200">
                  <Tag className="w-3 h-3 mr-1" />
                  {getTypeLabel(selectedItem.itemType)}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-2">
            <div className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
              {selectedItem?.content}
            </div>

            {selectedItem?.tags && selectedItem.tags.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-500 mb-2">标签</div>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs border-blue-200 text-blue-600 bg-blue-50"
                    >
                      # {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(selectedItem?.sourceName || selectedItem?.sourceUrl) && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-medium text-slate-500 mb-2">来源信息</div>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  {selectedItem.sourceName ?? '内部知识库'}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgePage;
