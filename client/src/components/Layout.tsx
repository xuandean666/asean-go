import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Globe,
  FileText,
  TrendingUp,
  Shield,
  Bot,
  BookOpen,
  FolderKanban,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from './ui/button';

const navGroups = [
  {
    label: '工作台',
    items: [
      { path: '/', label: '仪表盘', icon: LayoutDashboard },
    ],
  },
  {
    label: '核心功能',
    items: [
      { path: '/customer-service', label: '多语种客服', icon: MessageSquare, badge: '5 国语' },
      { path: '/localization', label: '商品本地化', icon: Globe },
      { path: '/documents', label: '单证处理', icon: FileText },
      { path: '/market', label: '市场行情', icon: TrendingUp },
      { path: '/compliance', label: '合规审查', icon: Shield },
    ],
  },
  {
    label: '智能体',
    items: [
      { path: '/agents', label: '多智能体协作', icon: Bot, highlight: true },
      { path: '/knowledge', label: '知识库问答', icon: BookOpen },
    ],
  },
  {
    label: '管理',
    items: [
      { path: '/projects', label: '项目管理', icon: FolderKanban },
      { path: '/team', label: '团队成员', icon: Users },
      { path: '/settings', label: '设置与用量', icon: Settings },
    ],
  },
];

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`relative flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        } flex-shrink-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-base leading-tight">ASEAN-Go</div>
              <div className="text-xs text-slate-400 leading-tight">东盟智贸 AI</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-4 mb-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5 px-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group relative ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.highlight && (
                            <Zap className="w-4 h-4 text-amber-400" />
                          )}
                          {item.badge && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 text-white border-2 border-slate-800 hover:bg-slate-600 shadow-md"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? '展开导航' : '收起导航'}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </Button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              {navGroups
                .flatMap((g) => g.items)
                .find((item) =>
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)
                )?.label || '工作台'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <Sparkles className="w-4 h-4" />
              一键演示
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-sm font-medium">
              X
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
