import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@client/src/components/ui/button';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-blue-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">页面未找到</h1>
        <p className="text-slate-500 mb-8">
          您访问的页面不存在或已被移除，请返回首页继续使用东盟智贸 AI 平台。
        </p>
        <Button asChild className="gap-2">
          <Link to="/">
            <LayoutDashboard className="w-4 h-4" />
            返回仪表盘
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
