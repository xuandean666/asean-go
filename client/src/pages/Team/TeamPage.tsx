import { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Crown,
  Headphones,
  Edit3,
  Trash2,
  Circle,
  CheckCircle2,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
  joinedAt: string;
  status: 'online' | 'offline';
}

const mockMembers: TeamMember[] = [
  {
    id: '1',
    name: '张明远',
    avatar: '',
    role: '管理员',
    email: 'zhangmingyuan@aseango.com',
    joinedAt: '2025-03-15',
    status: 'online',
  },
  {
    id: '2',
    name: '李思琪',
    avatar: '',
    role: '运营专员',
    email: 'lisiqi@aseango.com',
    joinedAt: '2025-04-02',
    status: 'online',
  },
  {
    id: '3',
    name: '王海涛',
    avatar: '',
    role: '运营专员',
    email: 'wanghaitao@aseango.com',
    joinedAt: '2025-05-20',
    status: 'offline',
  },
  {
    id: '4',
    name: '陈雨萱',
    avatar: '',
    role: '客服专员',
    email: 'chenyuxuan@aseango.com',
    joinedAt: '2025-06-10',
    status: 'online',
  },
  {
    id: '5',
    name: '刘佳怡',
    avatar: '',
    role: '客服专员',
    email: 'liujiayi@aseango.com',
    joinedAt: '2025-07-01',
    status: 'online',
  },
  {
    id: '6',
    name: '赵文博',
    avatar: '',
    role: '合规专员',
    email: 'zhaowenbo@aseango.com',
    joinedAt: '2025-04-18',
    status: 'offline',
  },
  {
    id: '7',
    name: '黄晓琳',
    avatar: '',
    role: '合规专员',
    email: 'huangxiaolin@aseango.com',
    joinedAt: '2025-08-05',
    status: 'online',
  },
];

const roleColors: Record<string, string> = {
  管理员: 'bg-[#1E3A8A]/10 text-[#1E3A8A]',
  运营专员: 'bg-[#3B82F6]/10 text-[#3B82F6]',
  客服专员: 'bg-[#10B981]/10 text-[#10B981]',
  合规专员: 'bg-[#F59E0B]/10 text-[#F59E0B]',
};

const roleCards = [
  {
    title: '管理员',
    icon: Crown,
    color: '#1E3A8A',
    bgColor: 'bg-[#1E3A8A]/5',
    permissions: [
      '所有功能模块完全访问',
      '团队成员管理与角色分配',
      '项目创建与删除',
      '账单与订阅管理',
      'API 密钥管理',
      '操作日志与审计',
    ],
  },
  {
    title: '运营专员',
    icon: Shield,
    color: '#3B82F6',
    bgColor: 'bg-[#3B82F6]/5',
    permissions: [
      '商品本地化工作台',
      '单证智能处理',
      '市场行情分析',
      '合规审查发起',
      '多智能体协作',
      '知识库管理',
    ],
  },
  {
    title: '客服专员',
    icon: Headphones,
    color: '#10B981',
    bgColor: 'bg-[#10B981]/5',
    permissions: [
      '多语种客服工作台',
      '会话查看与跟进',
      '智能回复建议使用',
      '客户信息查看',
      '会话记录导出',
      '知识库检索',
    ],
  },
];

function getInitials(name: string): string {
  return name.slice(0, 2);
}

const TeamPage: React.FC = () => {
  const [members, setMembers] = useState<TeamMember[]>(mockMembers);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('运营专员');
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }
    setInviting(true);
    // mock send
    await new Promise((resolve) => setTimeout(resolve, 800));
    setInviting(false);
    toast.success(`已向 ${inviteEmail} 发送邀请邮件`);
    setInviteOpen(false);
    setInviteEmail('');
    setInviteRole('运营专员');
  };

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.success('成员已移除');
  };

  const handleChangeRole = (id: string, newRole: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)),
    );
    toast.success('角色已更新');
  };

  return (
    <div className="space-y-6">
      {/* 顶部工具栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A]/10">
            <Users className="h-5 w-5 text-[#1E3A8A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">团队成员</h1>
            <p className="text-sm text-[#64748B]">管理团队成员与角色权限</p>
          </div>
        </div>
        <Button
          onClick={() => setInviteOpen(true)}
          className="bg-[#1E3A8A] hover:bg-[#1e3a8a]/90"
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          邀请成员
        </Button>
      </div>

      {/* 成员表格 */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">
            团队成员 <span className="text-[#94A3B8]">（{members.length} 人）</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F8FAFC]">
                <TableHead className="w-[280px]">成员</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>加入时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id} className="hover:bg-[#F8FAFC]/60">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-[#E2E8F0]">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-[#EFF6FF] text-xs font-medium text-[#1E3A8A]">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-[#0F172A]">{member.name}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${roleColors[member.role] || ''}`}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#64748B]">{member.email}</TableCell>
                  <TableCell className="text-[#64748B]">{member.joinedAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {member.status === 'online' ? (
                        <>
                          <Circle className="h-2 w-2 fill-[#10B981] text-[#10B981]" />
                          <span className="text-sm text-[#10B981]">在线</span>
                        </>
                      ) : (
                        <>
                          <Circle className="h-2 w-2 fill-[#94A3B8] text-[#94A3B8]" />
                          <span className="text-sm text-[#94A3B8]">离线</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4 text-[#64748B]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleChangeRole(member.id, member.role === '管理员' ? '运营专员' : '管理员')}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          编辑角色
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[#EF4444]"
                          onClick={() => handleRemove(member.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          移除成员
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 角色权限说明 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">角色权限说明</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {roleCards.map((role) => {
            const Icon = role.icon;
            return (
              <Card
                key={role.title}
                className="border border-[#E2E8F0] transition-all duration-200 hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${role.bgColor}`}>
                      <Icon className="h-5 w-5" style={{ color: role.color }} />
                    </div>
                    <CardTitle className="text-base font-semibold">{role.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.permissions.map((perm) => (
                      <li key={perm} className="flex items-start gap-2 text-sm text-[#475569]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#10B981]" />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 邀请弹窗 */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>邀请成员</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">邮箱地址 <span className="text-[#EF4444]">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  className="pl-9"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>分配角色</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="管理员">管理员</SelectItem>
                  <SelectItem value="运营专员">运营专员</SelectItem>
                  <SelectItem value="客服专员">客服专员</SelectItem>
                  <SelectItem value="合规专员">合规专员</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[#94A3B8]">
                受邀成员将通过邮件接收邀请链接，注册后加入团队。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
              取消
            </Button>
            <Button
              onClick={handleInvite}
              disabled={inviting}
              className="bg-[#1E3A8A] hover:bg-[#1e3a8a]/90"
            >
              {inviting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              发送邀请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamPage;
