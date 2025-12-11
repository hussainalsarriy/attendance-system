import React from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface SidebarProps {
  activeView: string;
  onChangeView: (view: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: '📊' },
  { id: 'employees', label: 'الموظفين', icon: '👥' },
  { id: 'attendance', label: 'تسجيل الحضور', icon: '✋' },
  { id: 'reports', label: 'التقارير', icon: '📋' },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView }) => {
  return (
    <aside className="w-64 bg-sidebar min-h-screen flex flex-col shadow-xl no-print">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xl shadow-lg shadow-primary/30">
            ⏱
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg">نظام الحضور</h1>
            <p className="text-xs text-sidebar-foreground/60">إدارة الموظفين</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={cn(
              'sidebar-item w-full',
              activeView === item.id && 'sidebar-item-active'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Theme Toggle & Footer */}
      <div className="p-4 space-y-4 border-t border-sidebar-border">
        <ThemeToggle />
        <div className="glass-card rounded-xl p-4 bg-sidebar-accent/50">
          <p className="text-xs text-sidebar-foreground/70 text-center">
            نظام حضور الموظفين
            <br />
            <span className="text-sidebar-foreground/50">الإصدار 2.0</span>
          </p>
        </div>
      </div>
    </aside>
  );
};
