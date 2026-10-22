import React, { useState, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  FileCheck,
  Award,
  Percent,
  MapPin,
  BookOpen,
  Download,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { createReport } from '@/api/compliance';
import type { ComplianceReport, RiskLevel } from '@shared/api.interface';

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

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  low: {
    label: '低风险',
    color: '#10B981',
    bgColor: 'bg-[#ECFDF5]',
    borderColor: 'border-[#10B981]/30',
    icon: <ShieldCheck className="w-10 h-10 text-[#10B981]" />,
  },
  medium: {
    label: '中风险',
    color: '#F59E0B',
    bgColor: 'bg-[#FFFBEB]',
    borderColor: 'border-[#F59E0B]/30',
    icon: <Shield className="w-10 h-10 text-[#F59E0B]" />,
  },
  high: {
    label: '高风险',
    color: '#EF4444',
    bgColor: 'bg-[#FEF2F2]',
    borderColor: 'border-[#EF4444]/30',
    icon: <ShieldAlert className="w-10 h-10 text-[#EF4444]" />,
  },
  critical: {
    label: '极高风险',
    color: '#991B1B',
    bgColor: 'bg-[#FEF2F2]',
    borderColor: 'border-[#991B1B]/30',
    icon: <ShieldAlert className="w-10 h-10 text-[#991B1B]" />,
  },
};

const STATUS_MAP: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
  '通过': { label: '通过', variant: 'default', icon: <CheckCircle2 className="w-4 h-4" /> },
  '需注意': { label: '需注意', variant: 'secondary', icon: <AlertTriangle className="w-4 h-4" /> },
  '不通过': { label: '不通过', variant: 'destructive', icon: <XCircle className="w-4 h-4" /> },
};

const CompliancePage: React.FC = () => {
  const [productName, setProductName] = useState<string>('蓝牙无线耳机');
  const [hsCode, setHsCode] = useState<string>('');
  const [targetCountry, setTargetCountry] = useState<string>('vietnam');
  const [productDesc, setProductDesc] = useState<string>('');
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = useCallback(async () => {
    if (!productName.trim() || !targetCountry) return;
    setLoading(true);
    try {
      const result = await createReport({
        productName: productName.trim(),
        hsCode: hsCode.trim() || undefined,
        targetCountry,
        productDesc: productDesc.trim() || undefined,
      });
      setReport(result);
    } catch (error) {
      logger.error('生成合规报告失败', error);
    } finally {
      setLoading(false);
    }
  }, [productName, hsCode, targetCountry, productDesc]);

  const countryLabel = ASEAN_COUNTRIES.find((c) => c.value === targetCountry)?.label ?? targetCountry;
  const riskCfg = report ? RISK_CONFIG[report.riskLevel] : RISK_CONFIG.low;

  return (
    <div className="space-y-6">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">合规审查</h1>
          <p className="text-sm text-[#475569] mt-1">
            一键生成东盟市场准入合规报告，涵盖法规、认证、关税与原产地优惠
          </p>
        </div>
        <Badge variant="outline" className="text-[#1E3A8A] border-[#1E3A8A]/30 bg-[#1E3A8A]/5">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          100% 可溯源
        </Badge>
      </div>

      {/* 查询区 */}
      <Card className="border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-[#475569]">
                <Package className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                商品名称 <span className="text-[#EF4444]">*</span>
              </Label>
              <Input
                value={productName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductName(e.target.value)}
                placeholder="请输入商品名称"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#475569]">
                HS 编码（可选）
              </Label>
              <Input
                value={hsCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHsCode(e.target.value)}
                placeholder="如：8517620000"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-[#475569]">
                <MapPin className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                目标国家 <span className="text-[#EF4444]">*</span>
              </Label>
              <Select value={targetCountry} onValueChange={setTargetCountry}>
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
                商品描述（可选）
              </Label>
              <Input
                value={productDesc}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProductDesc(e.target.value)}
                placeholder="简要描述商品用途、材质等"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              onClick={handleCheck}
              disabled={loading || !productName.trim()}
              className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  审查中...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  开始审查
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* 风险等级横幅 */}
          <Card className={`${riskCfg.bgColor} ${riskCfg.borderColor} border-2 shadow-md`}>
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  {riskCfg.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold" style={{ color: riskCfg.color }}>
                      {riskCfg.label}
                    </h2>
                    <Badge
                      style={{
                        backgroundColor: `${riskCfg.color}15`,
                        color: riskCfg.color,
                        border: `1px solid ${riskCfg.color}30`,
                      }}
                    >
                      {report.productName}
                    </Badge>
                    <Badge variant="outline" className="text-[#475569] border-[#E2E8F0] bg-white">
                      {countryLabel.split(' ')[0]}
                    </Badge>
                  </div>
                  <p className="text-[#475569] text-sm leading-relaxed">
                    {report.conclusion?.split('\n')[0]?.replace('【结论】', '')}
                  </p>
                </div>
                <div className="hidden md:block text-right">
                  <div className="text-xs text-[#94A3B8] mb-1">溯源覆盖率</div>
                  <div className="text-2xl font-bold" style={{ color: riskCfg.color }}>100%</div>
                  <div className="text-xs text-[#475569] mt-1">{report.sources?.items?.length ?? 0} 条权威来源</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 法规要求 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#3B82F6]" />
                法规要求
              </CardTitle>
              <CardDescription>
                目标国进口相关法规及准入要求
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.regulations?.items?.map((reg, idx: number) => {
                const statusInfo = STATUS_MAP[reg.status] ?? STATUS_MAP['需注意'];
                const statusColor: Record<string, string> = {
                  '通过': 'text-[#10B981] bg-[#ECFDF5] border-[#10B981]/30',
                  '需注意': 'text-[#F59E0B] bg-[#FFFBEB] border-[#F59E0B]/30',
                  '不通过': 'text-[#EF4444] bg-[#FEF2F2] border-[#EF4444]/30',
                };
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-4 rounded-lg border border-[#E2E8F0] hover:border-[#3B82F6]/30 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <Badge
                        className={`${statusColor[reg.status] ?? ''} gap-1`}
                        variant="outline"
                      >
                        {statusInfo.icon}
                        {reg.status}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[#0F172A] mb-1">{reg.name}</h4>
                      <p className="text-sm text-[#475569]">{reg.detail}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 所需认证 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#F59E0B]" />
                所需认证
              </CardTitle>
              <CardDescription>
                产品进入目标市场需取得的认证资质
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.certifications?.required?.map((cert, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border transition-all hover:shadow-sm hover:-translate-y-0.5 duration-200 ${
                      cert.isMandatory
                        ? 'border-[#EF4444]/30 bg-[#FEF2F2]/50'
                        : 'border-[#E2E8F0] bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          cert.isMandatory ? 'bg-[#EF4444]/10' : 'bg-[#1E3A8A]/10'
                        }`}>
                          <Award className={`w-5 h-5 ${cert.isMandatory ? 'text-[#EF4444]' : 'text-[#1E3A8A]'}`} />
                        </div>
                        <h4 className="font-semibold text-[#0F172A]">{cert.name}</h4>
                      </div>
                      {cert.isMandatory && (
                        <Badge variant="destructive" className="text-xs">强制</Badge>
                      )}
                    </div>
                    <p className="text-xs text-[#94A3B8] mb-2">发证机构：{cert.authority}</p>
                    <p className="text-sm text-[#475569] leading-relaxed">{cert.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 关税信息 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <Percent className="w-5 h-5 text-[#10B981]" />
                关税信息对比
              </CardTitle>
              <CardDescription>
                {report.tariffInfo?.calculationMethod}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#475569]">最惠国税率 (MFN)</span>
                    <span className="text-2xl font-bold text-[#EF4444]">
                      {report.tariffInfo?.mfnRate}%
                    </span>
                  </div>
                  <div className="h-3 bg-[#FEF2F2] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EF4444] rounded-full transition-all duration-500"
                      style={{ width: `${(report.tariffInfo?.mfnRate ?? 0) * 3}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#475569]">优惠税率 (协定)</span>
                    <span className="text-2xl font-bold text-[#10B981]">
                      {report.tariffInfo?.preferentialRate}%
                    </span>
                  </div>
                  <div className="h-3 bg-[#ECFDF5] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all duration-500"
                      style={{ width: `${(report.tariffInfo?.preferentialRate ?? 0) * 3}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-[#F0FDF4] rounded-lg border border-[#10B981]/20">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#065F46]">
                      可节省关税约 {((report.tariffInfo?.mfnRate ?? 0) - (report.tariffInfo?.preferentialRate ?? 0)).toFixed(1)}%
                    </p>
                    <p className="text-xs text-[#065F46]/70 mt-1">
                      计税基准：{report.tariffInfo?.base}。申请原产地证书后可享受优惠税率。
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 原产地优惠 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#3B82F6]" />
                原产地优惠安排
              </CardTitle>
              <CardDescription>
                可适用的自由贸易协定及优惠税率
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.originPreference?.agreements?.map((ag, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all ${
                    ag.eligible
                      ? 'border-[#10B981]/30 bg-[#ECFDF5]/50 hover:bg-[#ECFDF5]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]/50 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ag.eligible ? (
                        <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                      ) : (
                        <XCircle className="w-5 h-5 text-[#94A3B8]" />
                      )}
                      <h4 className={`font-semibold ${ag.eligible ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>
                        {ag.name}
                      </h4>
                    </div>
                    <Badge
                      variant={ag.eligible ? 'default' : 'outline'}
                      className={ag.eligible ? 'bg-[#10B981] hover:bg-[#059669]' : 'text-[#94A3B8]'}
                    >
                      优惠税率 {ag.preferentialRate}%
                    </Badge>
                  </div>
                  <p className={`text-sm ml-7 leading-relaxed ${ag.eligible ? 'text-[#475569]' : 'text-[#94A3B8]'}`}>
                    {ag.requirement}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 来源依据 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-[#0F172A] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
                  来源依据
                </CardTitle>
                <CardDescription>
                  所有结论均有权威来源支撑，可溯源核查
                </CardDescription>
              </div>
              <Badge className="bg-[#1E3A8A] hover:bg-[#1E40AF] gap-1">
                <ShieldCheck className="w-3 h-3" />
                100% 溯源覆盖
              </Badge>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" defaultValue={['source-0']} className="w-full">
                {report.sources?.items?.map((src, idx: number) => (
                  <AccordionItem key={idx} value={`source-${idx}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-3 pr-2">
                        <div className="w-7 h-7 rounded-md bg-[#1E3A8A]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#1E3A8A]">{idx + 1}</span>
                        </div>
                        <span className="font-medium text-[#0F172A] text-sm">{src.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-10 pr-2">
                        <p className="text-sm text-[#475569] leading-relaxed bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                          {src.excerpt}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* 底部操作 */}
          <Card className="border border-[#E2E8F0] shadow-sm">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#10B981]/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                  </div>
                  <div>
                    <div className="font-medium text-[#0F172A]">审查完成</div>
                    <div className="text-xs text-[#94A3B8]">
                      报告编号：{report.id.slice(0, 8)} · {new Date(report.createdAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-1.5">
                    <UserCheck className="w-4 h-4" />
                    转人工审核
                  </Button>
                  <Button className="bg-[#1E3A8A] hover:bg-[#1E40AF] text-white gap-1.5">
                    <Download className="w-4 h-4" />
                    导出报告
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!report && !loading && (
        <Card className="border border-dashed border-[#E2E8F0] bg-white/50">
          <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#1E3A8A]/5 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-[#1E3A8A]" />
            </div>
            <h3 className="text-lg font-semibold text-[#0F172A] mb-2">输入商品信息开始合规审查</h3>
            <p className="text-sm text-[#475569] max-w-md">
              填写商品名称和目标国家，系统将自动分析法规要求、所需认证、关税税率及原产地优惠，生成完整的合规审查报告。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompliancePage;
