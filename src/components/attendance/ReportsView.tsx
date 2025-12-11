import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, MonthlyStats } from '@/types/attendance';
import { formatTo12Hour, formatDuration, formatDate, WORK_HOURS_LIMIT } from '@/lib/attendance-utils';
import { exportDailyToExcel, exportMonthlyToExcel, exportAllRecordsToExcel } from '@/lib/excel-export';
import { exportDailyToPDF, exportMonthlyToPDF, exportRecordsToCSV, exportMonthlySummaryToCSV } from '@/lib/pdf-export';
import { useNotification } from '@/contexts/NotificationContext';
import { useReportScheduler } from '@/lib/schedule-manager';
import { ReportScheduleManager } from './ReportScheduleManager';
import { cn } from '@/lib/utils';

interface ReportsViewProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onDeleteRecord: (id: string) => void;
  onUpdateRecord: (record: AttendanceRecord) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  employees, 
  records,
  onDeleteRecord,
  onUpdateRecord 
}) => {
  const { notify } = useNotification();
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'all' | 'schedule'>('daily');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  
  // Enable report scheduler
  useReportScheduler(employees, records);

  // Daily records
  const dailyRecords = useMemo(() => {
    return records
      .filter(r => r.date === selectedDate)
      .sort((a, b) => a.checkin.localeCompare(b.checkin));
  }, [records, selectedDate]);

  // All records sorted by date
  const allRecords = useMemo(() => {
    return [...records].sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  // Monthly summary
  const monthlySummary: MonthlyStats[] = useMemo(() => {
    const monthRecords = records.filter(r => r.date.startsWith(selectedMonth));
    
    return employees.map(emp => {
      const empRecords = monthRecords.filter(r => r.employeeId === emp.id);
      return {
        empId: emp.id,
        name: emp.name,
        department: emp.department,
        presentDays: empRecords.filter(r => r.status === 'present').length,
        absentDays: empRecords.filter(r => r.status === 'absent').length,
        regularHours: empRecords.reduce((sum, r) => sum + r.regularHours, 0),
        overtimeHours: empRecords.reduce((sum, r) => sum + r.overtimeHours, 0),
        totalHours: empRecords.reduce((sum, r) => sum + r.totalHours, 0),
      };
    }).filter(s => s.presentDays > 0 || s.absentDays > 0);
  }, [employees, records, selectedMonth]);

  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'موظف محذوف';

  const handleExport = () => {
    try {
      if (viewMode === 'daily') {
        if (exportFormat === 'excel') {
          exportDailyToExcel(dailyRecords, employees, selectedDate);
        } else if (exportFormat === 'pdf') {
          exportDailyToPDF(dailyRecords, employees, selectedDate);
        } else {
          exportRecordsToCSV(dailyRecords, employees, `تقرير-يومي-${selectedDate}.csv`);
        }
      } else if (viewMode === 'monthly') {
        if (exportFormat === 'excel') {
          exportMonthlyToExcel(monthlySummary, selectedMonth);
        } else if (exportFormat === 'pdf') {
          exportMonthlyToPDF(monthlySummary, selectedMonth);
        } else {
          exportMonthlySummaryToCSV(monthlySummary, selectedMonth);
        }
      } else if (viewMode === 'all') {
        if (exportFormat === 'excel') {
          exportAllRecordsToExcel(records, employees);
        } else if (exportFormat === 'pdf') {
          // Export all as PDF would be too large, fallback to CSV
          exportRecordsToCSV(records, employees, `جميع-السجلات-${new Date().toISOString().slice(0, 10)}.csv`);
        } else {
          exportRecordsToCSV(records, employees, `جميع-السجلات-${new Date().toISOString().slice(0, 10)}.csv`);
        }
      }
      notify(`تم تصدير البيانات بصيغة ${exportFormat.toUpperCase()} بنجاح`);
    } catch (error) {
      notify('حدث خطأ أثناء التصدير', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col lg:flex-row justify-between items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-foreground">التقارير</h2>
          <p className="text-muted-foreground text-sm">عرض وتحليل بيانات الحضور</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('daily')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                viewMode === 'daily' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              📅 يومي
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                viewMode === 'monthly' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              📊 شهري
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                viewMode === 'all' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              📋 الكل
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-all',
                viewMode === 'schedule' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              ⏰ جدولة
            </button>
          </div>

          {viewMode !== 'schedule' && (
            <>
              {/* Date Picker */}
              {viewMode === 'daily' && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field w-auto"
                />
              )}
              {viewMode === 'monthly' && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-field w-auto"
                />
              )}

              {/* Export Format */}
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="input-field w-auto"
              >
                <option value="excel">Excel</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>

              {/* Export Button */}
              <button 
                onClick={handleExport}
                className="btn-primary flex items-center gap-2"
              >
                📥 تصدير {exportFormat.toUpperCase()}
              </button>

              {/* Print Button */}
              <button 
                onClick={() => window.print()}
                className="btn-secondary flex items-center gap-2"
              >
                🖨️ طباعة
              </button>
            </>
          )}
        </div>
      </div>

      {/* Schedule Manager */}
      {viewMode === 'schedule' && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">جدولة التقارير التلقائية</h3>
          <p className="text-muted-foreground text-sm mb-6">
            قم بجدولة التقارير لتلقي التقارير تلقائياً يومياً أو أسبوعياً أو شهرياً بصيغ مختلفة
          </p>
          <ReportScheduleManager onSchedulesChange={() => {}} />
        </div>
      )}

      {/* Stats Summary for All Records */}
      {viewMode === 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-muted-foreground text-xs font-bold uppercase mb-1">إجمالي السجلات</p>
            <span className="text-2xl font-bold text-primary block">{records.length}</span>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-muted-foreground text-xs font-bold uppercase mb-1">أيام الحضور</p>
            <span className="text-2xl font-bold text-success block">
              {records.filter(r => r.status === 'present').length}
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-muted-foreground text-xs font-bold uppercase mb-1">أيام الغياب</p>
            <span className="text-2xl font-bold text-destructive block">
              {records.filter(r => r.status === 'absent').length}
            </span>
          </div>
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-muted-foreground text-xs font-bold uppercase mb-1">إجمالي الساعات</p>
            <span className="text-2xl font-bold text-foreground block" dir="ltr">
              {formatDuration(records.reduce((sum, r) => sum + r.totalHours, 0))}
            </span>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          {viewMode === 'daily' ? (
            <table className="w-full min-w-[900px]">
              <thead className="table-header">
                <tr>
                  <th className="p-4 text-right">#</th>
                  <th className="p-4 text-right">التاريخ</th>
                  <th className="p-4 text-right">الموظف</th>
                  <th className="p-4 text-center">دخول</th>
                  <th className="p-4 text-center">خروج</th>
                  <th className="p-4 text-center">أساسي</th>
                  <th className="p-4 text-center">إضافي</th>
                  <th className="p-4 text-center">الإجمالي</th>
                  <th className="p-4 text-right">ملاحظات</th>
                  <th className="p-4 text-center no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dailyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <span className="text-6xl mb-4">📋</span>
                        <p className="text-lg text-muted-foreground font-medium">لا توجد سجلات لعرضها</p>
                        <p className="text-sm text-muted-foreground">قم بتغيير التاريخ أو أضف سجلات جديدة</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dailyRecords.map((record, index) => {
                    const hasOvertime = record.overtimeHours > 0;
                    const percent = Math.min((record.totalHours / 12) * 100, 100);
                    const isFullDay = record.totalHours >= WORK_HOURS_LIMIT;

                    return (
                      <tr 
                        key={record.id} 
                        className={cn(
                          'transition-colors group',
                          record.isFriday && 'bg-warning/5',
                          record.status === 'absent' && 'bg-destructive/5',
                          !record.isFriday && record.status !== 'absent' && 'hover:bg-primary/5'
                        )}
                      >
                        <td className="p-4 text-muted-foreground">{index + 1}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground">{record.date}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{record.day}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-foreground">{getEmpName(record.employeeId)}</td>
                        <td className="p-4 text-center" dir="ltr">
                          <span className={cn(
                            'font-mono text-xs px-2.5 py-1 rounded-md border',
                            record.checkin !== '-' ? 'bg-muted border-border text-foreground' : 'border-transparent'
                          )}>
                            {formatTo12Hour(record.checkin)}
                          </span>
                        </td>
                        <td className="p-4 text-center" dir="ltr">
                          <span className={cn(
                            'font-mono text-xs px-2.5 py-1 rounded-md border',
                            record.checkout !== '-' ? 'bg-muted border-border text-foreground' : 'border-transparent'
                          )}>
                            {formatTo12Hour(record.checkout)}
                          </span>
                        </td>
                        <td className="p-4 text-center text-primary font-semibold font-mono text-xs" dir="ltr">
                          {record.status === 'absent' ? '0:00' : formatDuration(record.regularHours)}
                        </td>
                        <td className="p-4 text-center font-bold font-mono text-xs" dir="ltr">
                          {record.status === 'absent' ? (
                            <span className="text-muted-foreground">-</span>
                          ) : hasOvertime ? (
                            <span className="bg-warning/10 text-warning px-2 py-0.5 rounded">
                              + {formatDuration(record.overtimeHours)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0:00</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <span className={cn(
                              'font-bold font-mono text-sm',
                              record.status === 'absent' ? 'text-destructive' : 'text-foreground'
                            )} dir="ltr">
                              {record.status === 'absent' ? 'غياب' : formatDuration(record.totalHours)}
                            </span>
                            {record.status !== 'absent' && (
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex justify-end print:hidden">
                                <div 
                                  className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    isFullDay ? (hasOvertime ? 'bg-gradient-to-r from-warning to-warning/70' : 'bg-success') : 'bg-primary'
                                  )} 
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground truncate max-w-[180px] text-xs">
                          {record.notes || '-'}
                        </td>
                        <td className="p-4 text-center no-print">
                          <button 
                            onClick={() => onDeleteRecord(record.id)}
                            className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : viewMode === 'all' ? (
            // All Records View
            <table className="w-full min-w-[900px]">
              <thead className="table-header sticky top-0">
                <tr>
                  <th className="p-4 text-right">#</th>
                  <th className="p-4 text-right">التاريخ</th>
                  <th className="p-4 text-center">اليوم</th>
                  <th className="p-4 text-right">الموظف</th>
                  <th className="p-4 text-center">دخول</th>
                  <th className="p-4 text-center">خروج</th>
                  <th className="p-4 text-center">أساسي</th>
                  <th className="p-4 text-center">إضافي</th>
                  <th className="p-4 text-center">الإجمالي</th>
                  <th className="p-4 text-center">الحالة</th>
                  <th className="p-4 text-center no-print">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <span className="text-6xl mb-4">📋</span>
                        <p className="text-lg text-muted-foreground font-medium">لا توجد سجلات</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  allRecords.map((record, index) => (
                    <tr 
                      key={record.id} 
                      className={cn(
                        'transition-colors group hover:bg-muted/50',
                        record.status === 'absent' && 'bg-destructive/5'
                      )}
                    >
                      <td className="p-4 text-muted-foreground text-sm">{index + 1}</td>
                      <td className="p-4 font-bold text-foreground">{record.date}</td>
                      <td className="p-4 text-center text-xs text-muted-foreground">{record.day}</td>
                      <td className="p-4 font-bold text-foreground">{getEmpName(record.employeeId)}</td>
                      <td className="p-4 text-center font-mono text-sm" dir="ltr">{formatTo12Hour(record.checkin)}</td>
                      <td className="p-4 text-center font-mono text-sm" dir="ltr">{formatTo12Hour(record.checkout)}</td>
                      <td className="p-4 text-center text-primary font-mono text-sm" dir="ltr">{formatDuration(record.regularHours)}</td>
                      <td className="p-4 text-center font-mono text-sm" dir="ltr">
                        {record.overtimeHours > 0 ? (
                          <span className="text-warning bg-warning/10 px-2 py-0.5 rounded">+{formatDuration(record.overtimeHours)}</span>
                        ) : (
                          <span className="text-muted-foreground">0:00</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold font-mono" dir="ltr">{formatDuration(record.totalHours)}</td>
                      <td className="p-4 text-center">
                        <span className={cn(
                          'badge',
                          record.status === 'present' && 'badge-success',
                          record.status === 'absent' && 'badge-danger'
                        )}>
                          {record.status === 'present' ? 'حاضر' : 'غائب'}
                        </span>
                      </td>
                      <td className="p-4 text-center no-print">
                        <button 
                          onClick={() => onDeleteRecord(record.id)}
                          className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors opacity-0 group-hover:opacity-100"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {allRecords.length > 0 && (
                <tfoot className="bg-muted font-bold border-t-2 border-border">
                  <tr>
                    <td colSpan={6} className="p-4 text-right text-muted-foreground">المجموع الكلي</td>
                    <td className="p-4 text-center text-primary" dir="ltr">
                      {formatDuration(allRecords.reduce((sum, r) => sum + r.regularHours, 0))}
                    </td>
                    <td className="p-4 text-center text-warning" dir="ltr">
                      {formatDuration(allRecords.reduce((sum, r) => sum + r.overtimeHours, 0))}
                    </td>
                    <td className="p-4 text-center text-lg" dir="ltr">
                      {formatDuration(allRecords.reduce((sum, r) => sum + r.totalHours, 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            // Monthly View
            <table className="w-full min-w-[900px]">
              <thead className="bg-sidebar text-sidebar-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="p-4 text-right">#</th>
                  <th className="p-4 text-right">الموظف</th>
                  <th className="p-4 text-right">القسم</th>
                  <th className="p-4 text-center bg-success/10">أيام الحضور</th>
                  <th className="p-4 text-center bg-destructive/10">أيام الغياب</th>
                  <th className="p-4 text-center">ساعات أساسية</th>
                  <th className="p-4 text-center">ساعات إضافية</th>
                  <th className="p-4 text-center font-bold text-primary">إجمالي الساعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthlySummary.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <span className="text-6xl mb-4">📊</span>
                        <p className="text-lg text-muted-foreground font-medium">لا توجد بيانات لهذا الشهر</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {monthlySummary.map((stats, index) => (
                      <tr key={stats.empId} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4 text-muted-foreground">{index + 1}</td>
                        <td className="p-4 font-bold text-foreground">{stats.name}</td>
                        <td className="p-4 text-muted-foreground text-xs">{stats.department}</td>
                        <td className="p-4 text-center">
                          <span className="inline-block min-w-[2rem] py-1 bg-success/10 text-success rounded font-bold">
                            {stats.presentDays}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={cn(
                            'inline-block min-w-[2rem] py-1 rounded font-bold',
                            stats.absentDays > 0 ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground'
                          )}>
                            {stats.absentDays > 0 ? stats.absentDays : '-'}
                          </span>
                        </td>
                        <td className="p-4 text-center text-foreground font-mono text-xs" dir="ltr">
                          {formatDuration(stats.regularHours)}
                        </td>
                        <td className="p-4 text-center" dir="ltr">
                          <span className={cn(
                            'font-mono font-bold px-2 py-1 rounded text-xs',
                            stats.overtimeHours > 10 ? 'bg-warning/10 text-warning' : 
                            stats.overtimeHours > 0 ? 'text-warning' : 'text-muted-foreground'
                          )}>
                            {formatDuration(stats.overtimeHours)}
                          </span>
                        </td>
                        <td className="p-4 text-center text-primary font-mono font-bold bg-primary/5" dir="ltr">
                          {formatDuration(stats.totalHours)}
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-muted font-bold border-t-2 border-border text-sm">
                      <td className="p-4"></td>
                      <td className="p-4 text-muted-foreground" colSpan={2}>المجموع الكلي</td>
                      <td className="p-4 text-center text-success">
                        {monthlySummary.reduce((a, b) => a + b.presentDays, 0)}
                      </td>
                      <td className="p-4 text-center text-destructive">
                        {monthlySummary.reduce((a, b) => a + b.absentDays, 0)}
                      </td>
                      <td className="p-4 text-center text-foreground" dir="ltr">
                        {formatDuration(monthlySummary.reduce((a, b) => a + b.regularHours, 0))}
                      </td>
                      <td className="p-4 text-center text-warning bg-warning/5" dir="ltr">
                        {formatDuration(monthlySummary.reduce((a, b) => a + b.overtimeHours, 0))}
                      </td>
                      <td className="p-4 text-center text-xl text-primary" dir="ltr">
                        {formatDuration(monthlySummary.reduce((a, b) => a + b.totalHours, 0))}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
