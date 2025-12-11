import * as XLSX from 'xlsx';
import { Employee, AttendanceRecord, MonthlyStats } from '@/types/attendance';
import { formatTo12Hour, formatDuration } from './attendance-utils';

export const exportDailyToExcel = (
  records: AttendanceRecord[],
  employees: Employee[],
  date: string
) => {
  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'موظف محذوف';
  
  const data = records.map(record => ({
    'التاريخ': record.date,
    'اليوم': record.day,
    'الموظف': getEmpName(record.employeeId),
    'وقت الدخول': formatTo12Hour(record.checkin),
    'وقت الخروج': formatTo12Hour(record.checkout),
    'ساعات أساسية': formatDuration(record.regularHours),
    'ساعات إضافية': formatDuration(record.overtimeHours),
    'إجمالي الساعات': formatDuration(record.totalHours),
    'الحالة': record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : 'جمعة',
    'ملاحظات': record.notes || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'تقرير يومي');
  
  // Set RTL
  ws['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, 
    { wch: 10 }, { wch: 25 }
  ];
  
  XLSX.writeFile(wb, `تقرير-يومي-${date}.xlsx`);
};

export const exportMonthlyToExcel = (
  summary: MonthlyStats[],
  month: string
) => {
  const data = summary.map(stats => ({
    'الموظف': stats.name,
    'القسم': stats.department,
    'أيام الحضور': stats.presentDays,
    'أيام الغياب': stats.absentDays,
    'ساعات أساسية': formatDuration(stats.regularHours),
    'ساعات إضافية': formatDuration(stats.overtimeHours),
    'إجمالي الساعات': formatDuration(stats.totalHours)
  }));

  // Add totals row
  data.push({
    'الموظف': 'المجموع الكلي',
    'القسم': '',
    'أيام الحضور': summary.reduce((a, b) => a + b.presentDays, 0),
    'أيام الغياب': summary.reduce((a, b) => a + b.absentDays, 0),
    'ساعات أساسية': formatDuration(summary.reduce((a, b) => a + b.regularHours, 0)),
    'ساعات إضافية': formatDuration(summary.reduce((a, b) => a + b.overtimeHours, 0)),
    'إجمالي الساعات': formatDuration(summary.reduce((a, b) => a + b.totalHours, 0))
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'تقرير شهري');
  
  ws['!cols'] = [
    { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 12 }
  ];
  
  XLSX.writeFile(wb, `تقرير-شهري-${month}.xlsx`);
};

export const exportEmployeeRecordsToExcel = (
  employee: Employee,
  records: AttendanceRecord[],
  month: string
) => {
  const data = records.map(record => ({
    'التاريخ': record.date,
    'اليوم': record.day,
    'وقت الدخول': formatTo12Hour(record.checkin),
    'وقت الخروج': formatTo12Hour(record.checkout),
    'ساعات أساسية': formatDuration(record.regularHours),
    'ساعات إضافية': formatDuration(record.overtimeHours),
    'إجمالي الساعات': formatDuration(record.totalHours),
    'الحالة': record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : 'جمعة',
    'ملاحظات': record.notes || '-'
  }));

  // Add summary
  const totalRegular = records.reduce((sum, r) => sum + r.regularHours, 0);
  const totalOvertime = records.reduce((sum, r) => sum + r.overtimeHours, 0);
  const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0);
  const presentDays = records.filter(r => r.status === 'present').length;
  const absentDays = records.filter(r => r.status === 'absent').length;

  data.push({
    'التاريخ': '',
    'اليوم': '',
    'وقت الدخول': '',
    'وقت الخروج': '',
    'ساعات أساسية': '',
    'ساعات إضافية': '',
    'إجمالي الساعات': '',
    'الحالة': '',
    'ملاحظات': ''
  });

  data.push({
    'التاريخ': 'الإجمالي',
    'اليوم': `${presentDays} يوم حضور`,
    'وقت الدخول': `${absentDays} يوم غياب`,
    'وقت الخروج': '',
    'ساعات أساسية': formatDuration(totalRegular),
    'ساعات إضافية': formatDuration(totalOvertime),
    'إجمالي الساعات': formatDuration(totalHours),
    'الحالة': '',
    'ملاحظات': ''
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'سجل الموظف');
  
  ws['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 25 }
  ];
  
  XLSX.writeFile(wb, `سجل-${employee.name}-${month}.xlsx`);
};

export const exportAllRecordsToExcel = (
  records: AttendanceRecord[],
  employees: Employee[]
) => {
  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'موظف محذوف';
  
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
  
  const data = sortedRecords.map(record => ({
    'التاريخ': record.date,
    'اليوم': record.day,
    'الموظف': getEmpName(record.employeeId),
    'وقت الدخول': formatTo12Hour(record.checkin),
    'وقت الخروج': formatTo12Hour(record.checkout),
    'ساعات أساسية': formatDuration(record.regularHours),
    'ساعات إضافية': formatDuration(record.overtimeHours),
    'إجمالي الساعات': formatDuration(record.totalHours),
    'الحالة': record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : 'جمعة',
    'ملاحظات': record.notes || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'جميع السجلات');
  
  ws['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 }, 
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, 
    { wch: 10 }, { wch: 25 }
  ];
  
  XLSX.writeFile(wb, `جميع-السجلات-${new Date().toISOString().slice(0, 10)}.xlsx`);
};
