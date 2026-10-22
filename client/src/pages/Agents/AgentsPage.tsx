import React, { useEffect, useState, useCallback } from 'react';
import {
  Sparkles,
  Briefcase,
  TrendingUp,
  Search,
  ShieldCheck,
  Languages,
  Settings2,
  Truck,
  Send,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Download,
  FileText,
  Zap,
  ChevronRight,
  Play,
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as agentsApi from '@/api/agents';
import type { AgentTask, AgentStep, TaskStatus } from '@shared/api.interface';

const AGENT_ROLES = [
  { key: 'ProjectManager', name: '项目经理', icon: Briefcase, color: 'bg-blue-500' },
  { key: 'MarketAnalyst', name: '市场分析师', icon: TrendingUp, color: 'bg-emerald-500' },
  { key: 'ProductResearcher', name: '产品研究员', icon: Search, color: 'bg-purple-500' },
  { key: 'ComplianceOfficer', name: '合规官', icon: ShieldCheck, color: 'bg-amber-500' },
  { key: 'LocalizationSpecialist', name: '本地化专家', icon: Languages, color: 'bg-cyan-500' },
  { key: 'OperationConsultant', name: '运营顾问', icon: Settings2, color: 'bg-rose-500' },
  { key: 'LogisticsPlanner', name: '物流规划师', icon: Truck, color: 'bg-indigo-500' },
];

const EXAMPLE_PROMPTS = [
  '帮我把硅胶厨具打入越南市场',
  '泰国美妆新品上市全流程方案',
  '印尼3C配件合规与上架计划',
];

function getAgentColor(agentName: string): string {
  const role = AGENT_ROLES.find((r) => agentName.includes(r.name));
  return role?.color ?? 'bg-slate-500';
}

function getAgentIcon(agentName: string) {
  const role = AGENT_ROLES.find((r) => agentName.includes(r.name));
  return role?.icon ?? Zap;
}

function getStatusBadge(status: TaskStatus) {
  switch (status) {
    case 'completed':
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          已完成
        </Badge>
      );
    case 'running':
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          执行中
        </Badge>
      );
    case 'failed':
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          失败
        </Badge>
      );
    case 'awaiting_human':
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200"
        >
          <Clock className="w-3 h-3 mr-1" />
          待确认
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="bg-slate-50 text-slate-600 border-slate-200"
        >
          <Clock className="w-3 h-3 mr-1" />
          待执行
        </Badge>
      );
  }
}

function formatDuration(ms?: number): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

const AgentsPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [historyTasks, setHistoryTasks] = useState<AgentTask[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const result = await agentsApi.getTasks({ page: 1, pageSize: 5 });
      setHistoryTasks(result.items);
      if (result.items.length > 0 && !currentTask) {
        setCurrentTask(result.items[0]);
      }
    } catch (error) {
      logger.error('加载任务列表失败', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentTask]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (currentTask) {
      agentsApi
        .getTaskSteps(currentTask.id)
        .then((stepList) => {
          setSteps(stepList);
          if (stepList.length > 0 && !selectedStepId) {
            setSelectedStepId(stepList[0].id);
          }
        })
        .catch((err) => logger.error('加载步骤失败', err));
    }
  }, [currentTask]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateTask = async () => {
    if (!prompt.trim()) return;
    try {
      setSubmitting(true);
      const task = await agentsApi.createTask({ userPrompt: prompt });
      setCurrentTask(task);
      const stepList = await agentsApi.getTaskSteps(task.id);
      setSteps(stepList);
      if (stepList.length > 0) setSelectedStepId(stepList[0].id);
      await loadHistory();
    } catch (error) {
      logger.error('创建任务失败', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRerunStep = async (stepKey: string) => {
    if (!currentTask) return;
    try {
      const updated = await agentsApi.rerunStep(currentTask.id, stepKey);
      setSteps((prev) =>
        prev.map((s) => (s.stepKey === stepKey ? updated : s)),
      );
      setSelectedStepId(updated.id);
    } catch (error) {
      logger.error('重跑步骤失败', error);
    }
  };

  const selectedStep = steps.find((s) => s.id === selectedStepId);
  const allCompleted = steps.length > 0 && steps.every((s) => s.status === 'completed');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#06B6D4]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              多智能体协作系统 · Multi-Agent Collaboration
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              多智能体协作工作台
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
              7 位跨境贸易领域 AI 专家协同工作，从市场分析到合规审查，从本地化到物流规划，
              只需一句话，全自动完成复杂任务
            </p>
          </div>

          {/* Agent Avatars Row */}
          <div className="flex justify-center items-center gap-3 md:gap-6 flex-wrap">
            {AGENT_ROLES.map((role, index) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.key}
                  className="flex flex-col items-center gap-2 group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full ${role.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/30`}
                  >
                    <Icon className="w-6 h-6 md:w-7 md:h-7" />
                  </div>
                  <span className="text-xs md:text-sm text-white/90 font-medium whitespace-nowrap">
                    {role.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Task Input Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#06B6D4] flex items-center justify-center text-white flex-shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-1">
                  下达任务
                </h2>
                <p className="text-sm text-slate-500">
                  用自然语言描述你的跨境贸易需求，AI 将自动拆解任务并调度多智能体协同执行
                </p>
              </div>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：帮我把硅胶厨具打入越南市场，从市场分析到物流规划全流程出方案..."
              className="min-h-[120px] text-base resize-none border-slate-200 focus:border-[#1E3A8A] focus:ring-[#1E3A8A]/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleCreateTask();
                }
              }}
            />

            {/* Example chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 flex items-center">
                试试这些：
              </span>
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  onClick={() => setPrompt(example)}
                  className="px-3 py-1 text-xs rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleCreateTask}
                disabled={submitting || !prompt.trim()}
                size="lg"
                className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1e40af] hover:to-[#2563eb] text-white min-w-[140px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    规划中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    开始执行
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Execution Visualization */}
        {(currentTask || submitting) && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Steps Timeline */}
            <Card className="lg:col-span-3 border-0 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    执行过程
                  </CardTitle>
                  {currentTask && getStatusBadge(currentTask.status as TaskStatus)}
                </div>
                <CardDescription className="line-clamp-2">
                  {currentTask?.title ?? '正在规划任务...'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {steps.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
                    <p>正在生成执行计划...</p>
                  </div>
                ) : (
                  <div className="relative">
                    {steps.map((step, index) => {
                      const isSelected = step.id === selectedStepId;
                      const isRunning = step.status === 'running';
                      const isCompleted = step.status === 'completed';
                      const AgentIcon = getAgentIcon(step.agentName);
                      const agentColor = getAgentColor(step.agentName);

                      return (
                        <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
                          {/* Connector line */}
                          {index < steps.length - 1 && (
                            <div
                              className={`absolute left-[22px] top-[48px] w-0.5 h-[calc(100%-32px)] ${
                                isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                              }`}
                            />
                          )}

                          {/* Node */}
                          <button
                            onClick={() => setSelectedStepId(step.id)}
                            className={`relative z-10 flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                              isSelected
                                ? 'ring-4 ring-blue-100 scale-110'
                                : 'hover:scale-105'
                            } ${isCompleted ? agentColor : isRunning ? agentColor : 'bg-slate-200'}`}
                            aria-label={`查看 ${step.agentName} 步骤详情`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : isRunning ? (
                              <div className="relative w-5 h-5">
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                                <span className="absolute inset-0 rounded-full bg-inherit animate-ping opacity-40" />
                              </div>
                            ) : (
                              <Clock className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          {/* Content */}
                          <button
                            onClick={() => setSelectedStepId(step.id)}
                            className={`flex-1 text-left p-4 rounded-xl transition-all ${
                              isSelected
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <AgentIcon
                                className={`w-4 h-4 ${
                                  isCompleted || isRunning ? 'text-blue-600' : 'text-slate-400'
                                }`}
                              />
                              <span className="text-sm font-semibold text-slate-900">
                                {step.agentName}
                              </span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-500">
                                步骤 {index + 1}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-slate-800 mb-1">
                              {step.description?.split('\n')[0] ?? step.stepKey}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              {getStatusBadge(step.status)}
                              {step.durationMs && (
                                <span>{formatDuration(step.durationMs)}</span>
                              )}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right: Step Detail Panel */}
            <Card className="lg:col-span-2 border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-slate-900">
                  步骤详情
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {!selectedStep ? (
                  <div className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-3" />
                    <p>点击左侧步骤查看详情</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Agent Header */}
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div
                        className={`w-12 h-12 rounded-xl ${getAgentColor(
                          selectedStep.agentName,
                        )} flex items-center justify-center text-white`}
                      >
                        {React.createElement(getAgentIcon(selectedStep.agentName), {
                          className: 'w-6 h-6',
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900">
                          {selectedStep.agentName}
                        </div>
                        <div className="text-xs text-slate-500">{selectedStep.stepKey}</div>
                      </div>
                      {getStatusBadge(selectedStep.status)}
                    </div>

                    {/* Description */}
                    <div>
                      <div className="text-xs font-medium text-slate-500 mb-2">
                        任务描述
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {selectedStep.description}
                      </p>
                    </div>

                    {/* Output */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-slate-500">
                          输出结果
                        </div>
                        {selectedStep.outputData?.confidence !== undefined && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200"
                          >
                            置信度 {Math.round(selectedStep.outputData.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl max-h-[280px] overflow-y-auto text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedStep.outputData?.result ?? '等待执行...'}
                      </div>
                    </div>

                    {/* Sources */}
                    {selectedStep.outputData?.sources &&
                      selectedStep.outputData.sources.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-slate-500 mb-2">
                            来源引用
                          </div>
                          <div className="space-y-2">
                            {selectedStep.outputData.sources.map((src, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg text-xs"
                              >
                                <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                <span className="text-slate-600">{src}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Rerun Button */}
                    <Button
                      variant="outline"
                      onClick={() => handleRerunStep(selectedStep.stepKey)}
                      className="w-full"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重跑此步骤
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Summary Report */}
        {allCompleted && currentTask?.summary && (
          <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-emerald-900">
                      任务执行完成
                    </CardTitle>
                    <CardDescription className="text-emerald-700">
                      共 {steps.length} 个步骤，总耗时 {formatDuration(currentTask.totalDurationMs)}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                >
                  <Download className="w-4 h-4" />
                  导出完整报告
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-5 bg-white/70 backdrop-blur-sm rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border border-emerald-100">
                {currentTask.summary}
              </div>
            </CardContent>
          </Card>
        )}

        {/* History Tasks */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">
              历史任务
            </CardTitle>
            <CardDescription>查看最近执行的多智能体任务</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingHistory ? (
              <div className="py-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                加载中...
              </div>
            ) : historyTasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                暂无历史任务
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务名</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-center">步骤数</TableHead>
                    <TableHead>总耗时</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setCurrentTask(task)}
                    >
                      <TableCell className="font-medium text-slate-900 max-w-[320px] truncate">
                        {task.title ?? task.userPrompt}
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status as TaskStatus)}</TableCell>
                      <TableCell className="text-center">
                        {task.plan?.steps?.length ?? '-'}
                      </TableCell>
                      <TableCell>{formatDuration(task.totalDurationMs)}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(task.createdAt).toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTask(task);
                          }}
                        >
                          查看
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentsPage;
