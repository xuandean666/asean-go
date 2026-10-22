import { useState } from 'react';
import {
  Settings,
  BarChart3,
  UserCircle2,
  Key,
  Bell,
  Sparkles,
  Languages,
  Bot,
  FileText,
  TrendingUp,
  Shield,
  BookOpen,
  CheckCircle2,
  XCircle,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface UsageMetric {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  used: number;
  limit: number;
  unit: string;
  color: string;
}

interface FeatureUsage {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: string;
}

interface AuditLog {
  time: string;
  user: string;
  type: string;
  detail: string;
  typeColor: string;
}

interface CoreMetric {
  name: string;
  target: string;
  actual: string;
  passed: boolean;
  progress: number;
}

const menuItems = [
  { key: 'usage', label: '用量统计', icon: BarChart3 },
  { key: 'account', label: '账户设置', icon: UserCircle2 },
  { key: 'api', label: 'API 密钥', icon: Key },
  { key: 'notification', label: '通知设置', icon: Bell },
  { key: 'onboarding', label: '新手引导', icon: Sparkles },
];

const usageMetrics: UsageMetric[] = [
  { label: '本月翻译字符数', icon: Languages, used: 285000, limit: 500000, unit: '字符', color: '#3B82F6' },
  { label: '本月 AI 调用次数', icon: Bot, used: 1842, limit: 3000, unit: '次', color: '#06B6D4' },
  { label: '文档处理数', icon: FileText, used: 156, limit: 500, unit: '份', color: '#F59E0B' },
  { label: '智能体任务数', icon: Zap, used: 89, limit: 200, unit: '个', color: '#10B981' },
];

const featureUsage: FeatureUsage[] = [
  { name: '客服', icon: Bot, count: 2840, color: '#3B82F6' },
  { name: '本地化', icon: Languages, count: 1520, color: '#06B6D4' },
  { name: '单证', icon: FileText, count: 980, color: '#F59E0B' },
  { name: '行情', icon: TrendingUp, count: 640, color: '#10B981' },
  { name: '合规', icon: Shield, count: 420, color: '#8B5CF6' },
  { name: '智能体', icon: Zap, count: 310, color: '#EC4899' },
  { name: '知识库', icon: BookOpen, count: 780, color: '#14B8A6' },
];

const auditLogs: AuditLog[] = [
  { time: '2025-10-22 14:32', user: '张明远', type: '创建项目', detail: '创建项目「越南 Shopee 3C 数码店」', typeColor: 'text-[#3B82F6]' },
  { time: '2025-10-22 11:08', user: '李思琪', type: '生成本地化', detail: '生成本地化文案「蓝牙耳机 Pro」- 越南语/泰语', typeColor: 'text-[#06B6D4]' },
  { time: '2025-10-22 09:45', user: '陈雨萱', type: '客服会话', detail: '结束会话 #CV-20251022-0042（越南买家）', typeColor: 'text-[#10B981]' },
  { time: '2025-10-21 18:20', user: '赵文博', type: '合规审查', detail: '生成合规报告「无线充电器 - 印尼」', typeColor: 'text-[#F59E0B]' },
  { time: '2025-10-21 16:05', user: '张明远', type: '邀请成员', detail: '邀请 huangxiaolin@aseango.com 加入团队', typeColor: 'text-[#8B5CF6]' },
  { time: '2025-10-21 14:30', user: '王海涛', type: '单证处理', detail: '上传并处理商业发票 INV-20251021', typeColor: 'text-[#EC4899]' },
  { time: '2025-10-21 10:12', user: '李思琪', type: '智能体任务', detail: '执行多智能体任务「东南亚新品调研」', typeColor: 'text-[#06B6D4]' },
  { time: '2025-10-20 19:48', user: '刘佳怡', type: '客服会话', detail: '开始会话 #CV-20251020-0098（泰国买家）', typeColor: 'text-[#10B981]' },
  { time: '2025-10-20 15:22', user: '赵文博', type: '知识库', detail: '新增知识库条目「越南食品进口准入」', typeColor: 'text-[#14B8A6]' },
  { time: '2025-10-20 09:30', user: '张明远', type: '账户操作', detail: '更新订阅方案为企业版', typeColor: 'text-[#F59E0B]' },
];

const coreMetrics: CoreMetric[] = [
  { name: '首次响应时间', target: '< 3 秒', actual: '2.1 秒', passed: true, progress: 92 },
  { name: '意图识别准确率', target: '≥ 90%', actual: '94.2%', passed: true, progress: 94 },
  { name: '单据抽取 F1', target: '≥ 92%', actual: '95.8%', passed: true, progress: 96 },
  { name: '合规溯源覆盖率', target: '100%', actual: '100%', passed: true, progress: 100 },
  { name: '支持语种', target: '中文 + 5 种东盟语言', actual: '6 种语言', passed: true, progress: 100 },
];

function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return n.toLocaleString();
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('usage');
  const maxCount = Math.max(...featureUsage.map((f) => f.count));

  return (
    <div className="flex gap-6">
      {/* 左侧菜单 */}
      <div className="hidden w-56 flex-shrink-0 lg:block">
        <Card className="border border-[#E2E8F0]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#0F172A]">设置</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-[#1E3A8A]/10 font-medium text-[#1E3A8A]'
                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* 右侧内容 */}
      <div className="flex-1 space-y-6">
        {activeTab === 'usage' ? (
          <>
            {/* 用量概览 */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#1E3A8A]" />
                <h2 className="text-lg font-semibold text-[#0F172A]">用量概览</h2>
                <Badge variant="secondary" className="ml-2 bg-[#F59E0B]/10 text-[#F59E0B]">
                  企业版
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {usageMetrics.map((metric) => {
                  const Icon = metric.icon;
                  const pct = Math.min(100, Math.round((metric.used / metric.limit) * 100));
                  return (
                    <Card
                      key={metric.label}
                      className="border border-[#E2E8F0] transition-all duration-200 hover:shadow-md"
                    >
                      <CardContent className="pt-5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#64748B]">{metric.label}</span>
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${metric.color}15` }}
                          >
                             <span style={{ color: metric.color }}>
                               <Icon className="h-4 w-4" />
                             </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="text-2xl font-bold text-[#0F172A]">
                            {formatNumber(metric.used)}
                          </span>
                          <span className="ml-1 text-sm text-[#94A3B8]">
                            / {formatNumber(metric.limit)} {metric.unit}
                          </span>
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: metric.color }}
                          />
                        </div>
                        <div className="mt-1.5 text-xs text-[#94A3B8]">已使用 {pct}%</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* 功能使用情况 + 最近操作日志 */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="border border-[#E2E8F0]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">功能使用情况</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {featureUsage.map((item) => {
                      const Icon = item.icon;
                      const pct = (item.count / maxCount) * 100;
                      return (
                        <div key={item.name}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-[#475569]">
                               <span style={{ color: item.color }}>
                                 <Icon className="h-3.5 w-3.5" />
                               </span>
                              {item.name}
                            </div>
                            <span className="font-medium text-[#0F172A]">
                              {item.count.toLocaleString()} 次
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: item.color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-[#E2E8F0]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">最近操作日志</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8FAFC]">
                        <TableHead className="w-[110px]">时间</TableHead>
                        <TableHead>操作人</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>详情</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.slice(0, 6).map((log, idx) => (
                        <TableRow key={idx} className="hover:bg-[#F8FAFC]/60">
                          <TableCell className="whitespace-nowrap text-xs text-[#94A3B8]">
                            {log.time.slice(5)}
                          </TableCell>
                          <TableCell className="text-sm text-[#475569]">{log.user}</TableCell>
                          <TableCell>
                            <span className={`text-xs font-medium ${log.typeColor}`}>
                              {log.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-[#64748B]">
                            <div className="line-clamp-1 max-w-[180px]">{log.detail}</div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* 核心指标达标情况 */}
            <Card className="border border-[#E2E8F0]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">核心指标达标情况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {coreMetrics.map((metric) => (
                    <div
                      key={metric.name}
                      className="rounded-xl border border-[#E2E8F0] bg-white p-4 transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-[#0F172A]">{metric.name}</div>
                          <div className="mt-0.5 text-xs text-[#94A3B8]">目标：{metric.target}</div>
                        </div>
                        {metric.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-[#10B981]" />
                        ) : (
                          <XCircle className="h-5 w-5 text-[#EF4444]" />
                        )}
                      </div>
                      <div className="mt-3">
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0]">
                        <div
                          className="h-full rounded-full bg-[#10B981] transition-all duration-500"
                          style={{ width: `${metric.progress}%` }}
                        />
                      </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-[#94A3B8]">实际值</span>
                        <span className="text-sm font-semibold text-[#0F172A]">
                          {metric.actual}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border border-[#E2E8F0]">
            <CardContent className="flex h-64 items-center justify-center">
              <div className="text-center">
                <Settings className="mx-auto mb-3 h-10 w-10 text-[#94A3B8]" />
                <p className="text-sm text-[#64748B]">
                  {menuItems.find((m) => m.key === activeTab)?.label} 功能建设中
                </p>
                <p className="mt-1 text-xs text-[#94A3B8]">敬请期待</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
