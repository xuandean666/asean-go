import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Globe,
  FileText,
  TrendingUp,
  Shield,
  Bot,
  Zap,
  Clock,
  Languages,
  CheckCircle2,
  ArrowUpRight,
  ArrowRight,
  TrendingDown,
  MessageCircle,
  ListChecks,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getDashboardStats,
  getIndustryData,
  getRecentConversations,
  getRecentAgentTasks,
} from '@/api/dashboard';
import type {
  DashboardStats,
  IndustryData,
  Conversation,
  AgentTask,
} from '@shared/api.interface';

const languageNameMap: Record<string, string> = {
  vi: '越南语',
  th: '泰语',
  id: '印尼语',
  ms: '马来语',
  fil: '菲律宾语',
  'vi-zh': '越南语 - 中文',
  'th-zh': '泰语 - 中文',
  'id-zh': '印尼语 - 中文',
  'ms-zh': '马来语 - 中文',
  'fil-zh': '菲律宾语 - 中文',
};

const featureCards = [
  {
    title: '多语种客服',
    description: '5 种东盟语言实时翻译与智能回复，文化适配谈判策略',
    icon: MessageSquare,
    path: '/customer-service',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    title: '商品本地化',
    description: '多语种标题、卖点、描述一键生成，文化合规检测',
    icon: Globe,
    path: '/localization',
    color: 'from-blue-600 to-indigo-500',
  },
  {
    title: '单证处理',
    description: '智能抽取发票、提单等单证字段，交叉比对自动校验',
    icon: FileText,
    path: '/documents',
    color: 'from-amber-500 to-orange-400',
  },
  {
    title: '市场行情',
    description: '东南亚各国品类趋势、竞品分析、汇率关税一站式查询',
    icon: TrendingUp,
    path: '/market',
    color: 'from-emerald-500 to-teal-400',
  },
  {
    title: '合规审查',
    description: '目标国法规、认证要求、RCEP 关税优惠智能核查',
    icon: Shield,
    path: '/compliance',
    color: 'from-rose-500 to-pink-400',
  },
  {
    title: '多智能体协作',
    description: '多 Agent 分工协作完成复杂跨境贸易任务，全链路可追溯',
    icon: Bot,
    path: '/agents',
    color: 'from-violet-500 to-purple-500',
    highlighted: true,
  },
];

const industryMetrics = [
  {
    label: '中国对东盟贸易额',
    value: '突破 1 万亿美元',
    sub: '东盟连续多年为中国第一大贸易伙伴',
    icon: TrendingUp,
    trend: 'up',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    label: '东南亚电商 GMV',
    value: '1576 亿美元',
    sub: '同比增长 22.8%',
    icon: Zap,
    trend: 'up',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: '广西对东盟进出口',
    value: '4292.2 亿元',
    sub: '同比增长 8%',
    icon: ArrowUpRight,
    trend: 'up',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    label: '西部陆海新通道班列',
    value: '突破 1 万列',
    sub: '铁海联运班列累计',
    icon: TrendingUp,
    trend: 'up',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
];

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

function getStatusLabel(status: string): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    completed: { label: '已完成', className: 'bg-emerald-50 text-emerald-600' },
    running: { label: '执行中', className: 'bg-blue-50 text-blue-600' },
    pending: { label: '等待中', className: 'bg-slate-100 text-slate-600' },
    failed: { label: '失败', className: 'bg-red-50 text-red-600' },
    awaiting_human: { label: '待人工', className: 'bg-amber-50 text-amber-600' },
    planning: { label: '规划中', className: 'bg-violet-50 text-violet-600' },
    active: { label: '进行中', className: 'bg-blue-50 text-blue-600' },
  };
  return map[status] || { label: status, className: 'bg-slate-100 text-slate-600' };
}

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [industryData, setIndustryData] = useState<IndustryData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [convLoading, setConvLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [s, i] = await Promise.all([
          getDashboardStats(),
          getIndustryData(),
        ]);
        if (mounted) {
          setStats(s);
          setIndustryData(i);
        }
      } catch (err) {
        logger.error('加载仪表盘数据失败', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getRecentConversations();
        if (mounted) setConversations(result.items);
      } catch (err) {
        logger.error('加载最近会话失败', err);
      } finally {
        if (mounted) setConvLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await getRecentAgentTasks();
        if (mounted) setAgentTasks(result.items);
      } catch (err) {
        logger.error('加载智能体任务失败', err);
      } finally {
        if (mounted) setTasksLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-6">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-xl p-8 text-white"
          style={{
            background:
              'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #3B82F6 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-cyan-400/10 rounded-full translate-y-1/2" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs mb-4">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                中国 - 东盟跨境贸易多智能体平台
              </div>
              <h1 className="text-3xl font-bold leading-tight mb-3">
                东盟智贸 AI
              </h1>
              <p className="text-blue-100 text-base mb-4 max-w-xl">
                面向跨境电商卖家、外贸中小企业、货代与园区的 AI 原生垂直 SaaS。
                多语种智能客服、商品本地化、单证处理、合规审查，一站式解决方案。
              </p>
              {industryData && (
                <p className="text-sm text-blue-200">
                  📈 2025 年中国对东盟进出口{industryData.tradeVolume}，东盟为中国第一大贸易伙伴
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:w-auto">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 text-slate-800 shadow-lg min-w-[160px]">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {loading ? '—' : `< ${(stats?.avgResponseTimeMs ?? 2800) / 1000} 秒`}
                </div>
                <div className="text-xs text-slate-500 mt-1">首次响应时间</div>
              </div>
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 text-slate-800 shadow-lg min-w-[160px]">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                  <Languages className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {loading ? '—' : `${stats?.supportedLanguages ?? 5} 国语种`}
                </div>
                <div className="text-xs text-slate-500 mt-1">东盟语言支持</div>
              </div>
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 text-slate-800 shadow-lg min-w-[160px]">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {loading ? '—' : `${(stats?.sourceCoverage ?? 1) * 100}%`}
                </div>
                <div className="text-xs text-slate-500 mt-1">溯源覆盖率</div>
              </div>
            </div>
          </div>
        </section>

        {/* Industry Data */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">行业概览</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {industryMetrics.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    {item.trend === 'up' ? (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        增长
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-red-500">
                        <TrendingDown className="w-3.5 h-3.5" />
                        下降
                      </div>
                    )}
                  </div>
                  <div className="text-xl font-bold text-slate-900 leading-tight">
                    {item.value}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{item.sub}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Cards */}
        <section>
          <h2 className="text-xl font-bold text-slate-800 mb-4">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`relative bg-white rounded-xl p-6 shadow-sm border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    card.highlighted
                      ? 'border-amber-400 ring-2 ring-amber-200/50'
                      : 'border-slate-100'
                  }`}
                >
                  {card.highlighted && (
                    <div className="absolute -top-2.5 right-5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white text-xs font-medium shadow-sm">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        推荐
                      </span>
                    </div>
                  )}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md mb-4`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-5 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Link to={card.path}>
                      立即使用
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent Conversations */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-semibold text-slate-800">最近客服会话</h3>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-700">
                <Link to="/customer-service">
                  查看全部
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
            <div className="divide-y divide-slate-50">
              {convLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-slate-50 rounded w-2/3" />
                  </div>
                ))
              ) : conversations.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">暂无会话记录</p>
                  <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link to="/customer-service">开始新会话</Link>
                  </Button>
                </div>
              ) : (
                conversations.map((conv) => {
                  const statusInfo = getStatusLabel(conv.status);
                  const langLabel = conv.languagePair
                    ? languageNameMap[conv.languagePair] || conv.languagePair
                    : '';
                  return (
                    <Link
                      key={conv.id}
                      to={`/customer-service/${conv.id}`}
                      className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <span className="font-medium text-sm text-slate-800 truncate">
                          {conv.meta?.customerName || conv.title}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {formatTimeAgo(conv.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {langLabel && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                            {langLabel}
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-slate-400 truncate">
                          {conv.title}
                        </span>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Agent Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-violet-600" />
                <h3 className="text-base font-semibold text-slate-800">智能体任务</h3>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-slate-500 hover:text-slate-700">
                <Link to="/agents">
                  查看全部
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
            <div className="divide-y divide-slate-50">
              {tasksLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-50 rounded w-1/3" />
                  </div>
                ))
              ) : agentTasks.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Bot className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">暂无智能体任务</p>
                  <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link to="/agents">创建任务</Link>
                  </Button>
                </div>
              ) : (
                agentTasks.map((task) => {
                  const statusInfo = getStatusLabel(task.status);
                  return (
                    <Link
                      key={task.id}
                      to={`/agents/${task.id}`}
                      className="block px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <span className="font-medium text-sm text-slate-800 truncate">
                          {task.title || task.userPrompt.slice(0, 40)}
                        </span>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {formatTimeAgo(task.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                        {task.totalDurationMs !== undefined && task.totalDurationMs > 0 && (
                          <span className="text-xs text-slate-400">
                            耗时 {(task.totalDurationMs / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
