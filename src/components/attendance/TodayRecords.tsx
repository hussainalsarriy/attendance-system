import React from 'react';
import { Employee, AttendanceRecord } from '@/types/attendance';
import { formatDuration, formatTo12Hour, formatDate } from '@/lib/attendance-utils';
import { cn } from '@/lib/utils';

interface TodayRecordsProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onDeleteRecord: (id: string) => void;
}

export const TodayRecords: React.FC<TodayRecordsProps> = ({ 
  employees, 
  records,
  onDeleteRecord 
}) => {
  const today = formatDate(new Date());
  const todayRecords = records.filter(r => r.date === today);

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'موظف محذوف';

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
        <div>
          <h3 className="font-bold text-foreground flex items-center gap-2">
            📅 سجلات اليوم
          </h3>
          <p className="text-xs text-muted-foreground">{today}</p>
        </div>
        <span className="badge bg-primary/10 text-primary">
          {todayRecords.length} سجل
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full">
          <thead className="table-header sticky top-0">
            <tr>
              <th className="p-3 text-right">الموظف</th>
              <th className="p-3 text-center">دخول</th>
              <th className="p-3 text-center">خروج</th>
              <th className="p-3 text-center">الإجمالي</th>
              <th className="p-3 text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {todayRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  <span className="text-4xl block mb-2 opacity-30">📭</span>
                  لا توجد سجلات اليوم بعد
                </td>
              </tr>
            ) : (
              todayRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="p-3 font-bold text-foreground text-sm">{getEmpName(rec.employeeId)}</td>
                  <td className="p-3 text-center font-mono text-xs" dir="ltr">
                    {formatTo12Hour(rec.checkin)}
                  </td>
                  <td className="p-3 text-center font-mono text-xs" dir="ltr">
                    {formatTo12Hour(rec.checkout)}
                  </td>
                  <td className="p-3 text-center font-bold" dir="ltr">
                    {rec.status === 'absent' ? (
                      <span className="text-destructive">-</span>
                    ) : (
                      <span className="text-primary">{formatDuration(rec.totalHours)}</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={cn(
                      'badge',
                      rec.status === 'present' && 'badge-success',
                      rec.status === 'absent' && 'badge-danger',
                      rec.status === 'friday' && 'badge-warning'
                    )}>
                      {rec.status === 'present' ? '✓' : rec.status === 'absent' ? '✕' : '🕌'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
