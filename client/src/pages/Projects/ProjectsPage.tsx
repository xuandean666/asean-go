import { useEffect, useState, useCallback } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Edit3,
  Trash2,
  ArrowRight,
  MessageSquare,
  FileText,
  Shield,
  Calendar,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Empty, EmptyHeader, EmptyMedia, EmptyDescription } from '@/components/ui/empty';
import { toast } from 'sonner';
import { logger } from '@lark-apaas/client-toolkit/logger';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/api/projects';
import type { Project, CreateProjectRequest, PaginationResult } from '@shared/api.interface';

const PLATFORM_OPTIONS = ['shopee', 'lazada', 'tiktok', 'tokopedia', '其他'];
const COUNTRY_OPTIONS = [
  { value: 'vietnam', label: '越南' },
  { value: 'thailand', label: '泰国' },
  { value: 'indonesia', label: '印度尼西亚' },
  { value: 'malaysia', label: '马来西亚' },
  { value: 'philippines', label: '菲律宾' },
  { value: 'singapore', label: '新加坡' },
  { value: 'cambodia', label: '柬埔寨' },
  { value: 'laos', label: '老挝' },
  { value: 'myanmar', label: '缅甸' },
  { value: 'brunei', label: '文莱' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '进行中' },
  { value: 'archived', label: '已归档' },
];

const countryLabelMap: Record<string, string> = COUNTRY_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  },
  {} as Record<string, string>,
);

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// mock stats per project (deterministic by id)
function getMockStats(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  return {
    conversations: 12 + (abs % 48),
    documents: 3 + (abs % 17),
    compliance: 1 + (abs % 9),
  };
}

const ProjectsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginationResult<Project> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPlatform, setFormPlatform] = useState('');
  const [formCountry, setFormCountry] = useState('');

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProjects({
        page: 1,
        pageSize: 12,
        keyword: keyword || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setData(result);
    } catch (err) {
      logger.error('获取项目列表失败', err);
      toast.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    void fetchProjects();
  }, [fetchProjects]);

  const openCreate = () => {
    setEditingProject(null);
    setFormName('');
    setFormDesc('');
    setFormPlatform('');
    setFormCountry('');
    setDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormDesc(project.description || '');
    setFormPlatform(project.platform || '');
    setFormCountry(project.country || '');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('请输入项目名称');
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateProjectRequest = {
        name: formName.trim(),
        description: formDesc.trim() || undefined,
        platform: formPlatform || undefined,
        country: formCountry || undefined,
      };
      if (editingProject) {
        await updateProject(editingProject.id, payload);
        toast.success('项目已更新');
      } else {
        await createProject(payload);
        toast.success('项目已创建');
      }
      setDialogOpen(false);
      void fetchProjects();
    } catch (err) {
      logger.error('保存项目失败', err);
      toast.error('保存项目失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast.success('项目已删除');
      setDeleteTarget(null);
      void fetchProjects();
    } catch (err) {
      logger.error('删除项目失败', err);
      toast.error('删除项目失败');
    }
  };

  const toggleArchive = async (project: Project) => {
    const next = project.status === 'active' ? 'archived' : 'active';
    try {
      await updateProject(project.id, { status: next });
      toast.success(next === 'active' ? '项目已恢复' : '项目已归档');
      void fetchProjects();
    } catch (err) {
      logger.error('更新项目状态失败', err);
      toast.error('操作失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A]/10">
            <FolderKanban className="h-5 w-5 text-[#1E3A8A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">项目管理</h1>
            <p className="text-sm text-[#64748B]">管理您的跨境项目与店铺</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              placeholder="搜索项目..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={openCreate}
            className="bg-[#1E3A8A] hover:bg-[#1e3a8a]/90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            新建项目
          </Button>
        </div>
      </div>

      {/* 项目列表 */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((project: Project) => {
            const stats = getMockStats(project.id);
            return (
              <Card
                key={project.id}
                className="group cursor-pointer overflow-hidden border border-[#E2E8F0] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1 text-base font-semibold text-[#0F172A]">
                      {project.name}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[#94A3B8] hover:text-[#0F172A]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(project); }}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleArchive(project); }}>
                          {project.status === 'active' ? '归档' : '恢复'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[#EF4444]"
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(project); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pb-5">
                  <p className="line-clamp-2 h-10 text-sm text-[#64748B]">
                    {project.description || '暂无描述'}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {project.platform && (
                      <Badge variant="secondary" className="bg-[#EFF6FF] text-[#1E40AF] hover:bg-[#DBEAFE]">
                        {project.platform}
                      </Badge>
                    )}
                    {project.country && (
                      <Badge variant="outline" className="text-[#F59E0B]">
                        {countryLabelMap[project.country] || project.country}
                      </Badge>
                    )}
                    {project.status === 'active' ? (
                      <Badge className="ml-auto bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20">
                        进行中
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-auto text-[#64748B]">
                        已归档
                      </Badge>
                    )}
                  </div>

                  {/* 统计 */}
                  <div className="grid grid-cols-3 gap-2 rounded-lg bg-[#F8FAFC] p-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[#3B82F6]">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="text-sm font-semibold">{stats.conversations}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[#94A3B8]">会话</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[#F59E0B]">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="text-sm font-semibold">{stats.documents}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[#94A3B8]">文档</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-[#10B981]">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-sm font-semibold">{stats.compliance}</span>
                      </div>
                      <div className="mt-0.5 text-xs text-[#94A3B8]">合规</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(project.createdAt)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-[#1E3A8A] hover:bg-[#EFF6FF] hover:text-[#1E3A8A]"
                    >
                      进入
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty>
          <EmptyMedia variant="icon">
            <FolderKanban className="h-6 w-6" />
          </EmptyMedia>
          <EmptyHeader>暂无项目</EmptyHeader>
          <EmptyDescription>创建您的第一个跨境项目，开始使用 ASEAN-Go</EmptyDescription>
          <div className="mt-2">
            <Button onClick={openCreate} className="bg-[#1E3A8A] hover:bg-[#1e3a8a]/90">
              <Plus className="mr-1.5 h-4 w-4" />
              新建项目
            </Button>
          </div>
        </Empty>
      )}

      {/* 新建/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProject ? '编辑项目' : '新建项目'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="project-name">项目名称 <span className="text-[#EF4444]">*</span></Label>
              <Input
                id="project-name"
                placeholder="例如：越南 Shopee 3C 数码店"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-desc">项目描述</Label>
              <Textarea
                id="project-desc"
                placeholder="简要描述项目背景和目标..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>运营平台</Label>
                <Select value={formPlatform} onValueChange={setFormPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>目标国家</Label>
                <Select value={formCountry} onValueChange={setFormCountry}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择国家" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#1E3A8A] hover:bg-[#1e3a8a]/90"
            >
              {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editingProject ? '保存更改' : '创建项目'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除项目？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除「{deleteTarget?.name}」及其相关数据，删除后无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#EF4444] hover:bg-[#EF4444]/90"
              onClick={handleDelete}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectsPage;
