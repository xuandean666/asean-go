import React, { useState, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Globe,
  BarChart3,
  ShieldCheck,
  Truck,
  Lightbulb,
  Download,
  Search,
  ArrowUpRight,
  Star,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { createReport } from '@/api/market';
import type { MarketReport } from '@shared/api.interface';

const ASEAN_COUNTRIES = [
  { value: 'vietnam', label: '越南 Vietnam' },
  { value: 'thailand', label: '泰国 Thailand' },
  { value: 'indonesia', label: '印尼 Indonesia' },
  { value: 'malaysia', label: '马来西亚 Malaysia' },
  { value: 'philippines', label: '菲律宾 Philippines' },
  { value: 'singapore', label: '新加坡 Singapore' },
  { value: 'cambodia', label: '柬埔寨 Cambodia' },
  { value: 'laos', label: '老挝 Laos' },
  { value: 'myanmar', label: '缅甸 Myanmar' },
  { value: 'brunei', label: '文莱 Brunei' },
];

const CATEGORY_SUGGESTIONS = [
  '3C数码', '家居用品', '服装鞋帽', '美妆个护', '食品饮料',
  '玩具母婴', '运动户外', '汽车配件', '工业用品',
];

const MarketPage: React.FC = () => {
  const [country, setCountry] = useState<string>('vietnam');
  const [category, setCategory] = useState<string>('3C数码');
  const [report, setReport] = useState<MarketReport | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!country || !category.trim()) return;
    setLoading(true);
    try {
      const result = await createReport({
        country,
        category: category.trim(),
      });
      setReport(result);
    } catch (error) {
      logger.error('生成市场报告失败', error);
    } finally {
      setLoading(false);
    }
  }, [country, category]);

  const countryLabel = ASEAN_COUNTRIES.find((c) => c.value === country)?.label ?? country;

  return (
    <div className="space-y-6">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">市场行情</h1>
          <p className="text-sm text-[#475569] mt-1">
            基于东盟各国实时贸易数据，生成品类市场分析报告
          </p>
        </div>
        <Badge variant="outline" className="text-[#1E3A8A] border-[#1E3A8A]/30 bg-[#1E3A8A]/5">
          <BarChart3 className="w-3.5 h-3.5 mr-1" />
          数据覆盖 10 个东盟国家
        </Badge>
      </div>

      {/* 查询区 */}
      <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-[#475569]">
                <MapPin className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                目标国家
              </Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择国家" />
                </SelectTrigger>
                <SelectContent>
                  {ASEAN_COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[#475569]">
                <Search className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                商品品类
              </Label>
              <Input
                value={category}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCategory(e.target.value)}
                placeholder="请输入品类名称"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={loading || !category.trim()}
                className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    生成报告
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* 概览指标卡 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-ai-section-type="card-stat">
            <Card className="bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-white/80">市场规模</span>
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-1">
                  {report.trendData?.values[5]?.toLocaleString() ?? '--'}
                </div>
                <div className="text-sm text-white/80">美元 / 月</div>
                <div className="mt-3 flex items-center text-sm">
                  <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                  <span className="text-emerald-300 font-medium ml-0.5">
                    +{report.trendData?.growthRate ?? 0}%
                  </span>
                  <span className="text-white/70 ml-1">近6月增长</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#475569]">价格带区间</span>
                  <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[#0F172A]">
                  {report.priceRange?.min?.toLocaleString()} ~ {report.priceRange?.max?.toLocaleString()}
                </div>
                <div className="text-sm text-[#475569] mt-1">
                  {report.priceRange?.currency}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-[#94A3B8] mb-1">
                    <span>最低</span>
                    <span>均价 {report.priceRange?.average?.toLocaleString()}</span>
                    <span>最高</span>
                  </div>
                  <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#10B981] via-[#F59E0B] to-[#EF4444] rounded-full"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-[#475569]">汇率参考</span>
                  <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#10B981]" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-[#0F172A]">
                  {report.exchangeRate?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '--'}
                </div>
                <div className="text-sm text-[#475569] mt-1">
                  {report.priceRange?.currency} / 美元
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-[#475569] border-[#E2E8F0]">
                    {countryLabel.split(' ')[0]}
                  </Badge>
                  <span className="text-xs text-[#94A3B8]">实时参考汇率</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 趋势图 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#3B82F6]" />
                市场规模趋势（近6个月）
              </CardTitle>
              <CardDescription>
                {countryLabel} · {category} 品类 · 单位：美元
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-3 border-b border-l border-[#E2E8F0] relative pl-10 pt-4">
                {report.trendData?.values?.map((val: number, idx: number) => {
                  const max = Math.max(...(report.trendData?.values ?? [1]));
                  const height = (val / max) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div className="text-xs text-[#475569] mb-1 font-medium">
                        {val.toLocaleString()}
                      </div>
                      <div
                        className="w-full bg-gradient-to-t from-[#1E3A8A] to-[#3B82F6] rounded-t-md transition-all duration-500 hover:from-[#1E40AF] hover:to-[#60A5FA] cursor-pointer"
                        style={{ height: `${height}%`, minHeight: '8px' }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between gap-3 mt-2 pl-10">
                {report.trendData?.months?.map((m: string, idx: number) => (
                  <div key={idx} className="flex-1 text-center text-xs text-[#94A3B8]">
                    {m.slice(5)}月
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 竞品分析 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
                竞品分析
              </CardTitle>
              <CardDescription>
                主要竞争品牌及市场表现
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E2E8F0]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#475569]">品牌</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#475569]">价格</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#475569] w-1/3">市场份额</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[#475569]">评分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.competitors?.items?.map((item, idx: number) => (
                      <tr key={idx} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold">
                              {item.name.charAt(0)}
                            </div>
                            <span className="font-medium text-[#0F172A]">{item.name}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4 text-[#0F172A] font-medium">
                          {item.price.toLocaleString()}
                          <span className="text-xs text-[#94A3B8] ml-1">{report.priceRange?.currency}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#3B82F6] to-[#1E3A8A] rounded-full"
                                style={{ width: `${item.share * 2.5}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#475569] font-medium w-10 text-right">{item.share}%</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <div className="inline-flex items-center gap-1">
                            <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                            <span className="text-[#0F172A] font-medium">{item.rating}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* 关税与物流 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                  关税信息
                </CardTitle>
                <CardDescription>{report.tariffInfo?.type}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#1E3A8A]">
                    {report.tariffInfo?.rate}%
                  </span>
                  <span className="text-sm text-[#475569]">适用税率</span>
                </div>
                <p className="text-sm text-[#475569] leading-relaxed">
                  {report.tariffInfo?.description}
                </p>
                <div className="p-3 bg-[#F0FDF4] rounded-lg border border-[#10B981]/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-[#065F46]">
                      建议申请 CAFTA / RCEP 原产地证书，可进一步享受优惠税率，降低进口成本。
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#3B82F6]" />
                  物流成本参考
                </CardTitle>
                <CardDescription>{report.logisticsCost?.unit}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: '海运', value: report.logisticsCost?.sea, color: '#10B981', icon: '🚢' },
                  { label: '空运', value: report.logisticsCost?.air, color: '#3B82F6', icon: '✈️' },
                  { label: '快递', value: report.logisticsCost?.express, color: '#F59E0B', icon: '📦' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${item.color}15` }}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-[#0F172A]">{item.label}</span>
                        <span className="text-sm font-bold" style={{ color: item.color }}>
                          ${item.value?.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${((item.value ?? 0) / (report.logisticsCost?.express ?? 1)) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 进入建议 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
                  市场进入建议
                </CardTitle>
                <CardDescription>
                  基于数据分析的综合策略建议
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="w-4 h-4" />
                导出报告
              </Button>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line text-sm text-[#475569] leading-relaxed bg-[#F8FAFC] p-4 rounded-lg border border-[#E2E8F0]">
                {report.recommendations}
              </div>
            </CardContent>
            <CardFooter className="border-t border-[#E2E8F0] pt-4 flex justify-between items-center">
              <span className="text-xs text-[#94A3B8]">
                报告生成时间：{new Date(report.createdAt).toLocaleString('zh-CN')}
              </span>
              <Badge variant="outline" className="text-[#10B981] border-[#10B981]/30 bg-[#10B981]/5">
                <ShieldCheck className="w-3 h-3 mr-1" />
                数据已验证
              </Badge>
            </CardFooter>
          </Card>
        </>
      )}

      {!report && !loading && (
        <Card className="border border-dashed border-[#E2E8F0] bg-white/50">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A]/5 flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-[#1E3A8A]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">选择国家和品类生成报告</h3>
            <p className="text-sm text-[#475569] max-w-md">
              输入目标市场和商品品类，系统将自动生成包含市场规模、竞品分析、关税物流及进入建议的完整市场行情报告。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MarketPage;
