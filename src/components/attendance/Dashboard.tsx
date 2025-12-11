import React from 'react';
import { Employee, AttendanceRecord } from '@/types/attendance';
import { formatDuration } from '@/lib/attendance-utils';

interface DashboardProps {
  employees: Employee[];
  records: AttendanceRecord[];
}

export const Dashboard: React.FC<DashboardProps> = ({ employees, records }) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRecords = records.filter(r => r.date.startsWith(currentMonth));
  
  // Calculate stats
  const stats = {
    totalEmployees: employees.length,
    totalRegular: monthlyRecords.reduce((sum, r) => sum + r.regularHours, 0),
    totalOvertime: monthlyRecords.reduce((sum, r) => sum + r.overtimeHours, 0),
    absentDays: monthlyRecords.filter(r => r.status === 'absent').length,
    presentDays: monthlyRecords.filter(r => r.status === 'present').length,
  };

  // Top overtime performers
  const overtimeByEmployee = employees.map(emp => {
    const empRecords = monthlyRecords.filter(r => r.employeeId === emp.id);
    const overtime = empRecords.reduce((sum, r) => sum + r.overtimeHours, 0);
    return { id: emp.id, name: emp.name, overtime };
  })
  .filter(e => e.overtime > 0)
  .sort((a, b) => b.overtime - a.overtime)
  .slice(0, 3);

  // Recent records
  const recentRecords = [...records]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground">نظرة عامة على حضور الموظفين</p>
        </div>
        <div className="text-sm text-muted-foreground bg-card px-4 py-2 rounded-lg border border-border">
          {new Date().toLocaleDateString('ar-SA', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-primary to-primary-hover rounded-xl p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium mb-1">إجمالي الموظفين</p>
              <h3 className="text-3xl font-bold">{stats.totalEmployees}</h3>
            </div>
            <div className="bg-primary-foreground/20 p-2 rounded-lg text-2xl">
              👥
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">ساعات العمل (الشهر)</p>
              <h3 className="text-2xl font-bold text-foreground" dir="ltr">{formatDuration(stats.totalRegular)}</h3>
            </div>
            <div className="bg-success/10 p-2 rounded-lg text-success text-2xl">
              ⏰
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">الساعات الإضافية</p>
              <h3 className="text-2xl font-bold text-warning" dir="ltr">{formatDuration(stats.totalOvertime)}</h3>
            </div>
            <div className="bg-warning/10 p-2 rounded-lg text-warning text-2xl">
              ⏱
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">حالات الغياب</p>
              <h3 className="text-2xl font-bold text-destructive">{stats.absentDays}</h3>
            </div>
            <div className="bg-destructive/10 p-2 rounded-lg text-destructive text-2xl">
              ✕
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-warning">🏆</span> الأكثر عملاً للإضافي
          </h3>
          <div className="space-y-4">
            {overtimeByEmployee.length === 0 ? (
              <p className="text-muted-foreground text-center text-sm py-4">لا يوجد ساعات إضافية هذا الشهر</p>
            ) : (
              overtimeByEmployee.map((emp, idx) => (
                <div key={emp.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-primary-foreground text-xs ${
                    idx === 0 ? 'bg-warning' : idx === 1 ? 'bg-muted-foreground' : 'bg-warning/70'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-sm">{emp.name}</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min((emp.overtime / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-mono font-bold text-primary text-sm" dir="ltr">
                    {formatDuration(emp.overtime)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="text-primary">📜</span> آخر النشاطات
          </h3>
          <div className="space-y-3">
            {recentRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">لا توجد سجلات حديثة</p>
            ) : (
              recentRecords.map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                return (
                  <div 
                    key={rec.id} 
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground ${
                        rec.status === 'absent' ? 'bg-destructive' : 'bg-success'
                      }`}>
                        {rec.status === 'absent' ? '✕' : '✓'}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{emp?.name || 'موظف محذوف'}</p>
                        <p className="text-xs text-muted-foreground">{rec.date} | {rec.day}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-mono bg-card border border-border px-2 py-1 rounded" dir="ltr">
                        {formatDuration(rec.totalHours)} ساعة
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
