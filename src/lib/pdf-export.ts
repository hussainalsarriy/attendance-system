import jsPDF from 'jspdf';
import { Employee, AttendanceRecord, MonthlyStats } from '@/types/attendance';
import { formatTo12Hour, formatDuration } from './attendance-utils';

// Dynamically load jspdf-autotable if available
let autoTableLoaded = false;

declare global {
  namespace jsPDF {
    interface jsPDF {
      autoTable?: any;
    }
  }
}

// Try to load autoTable dynamically
try {
  require('jspdf-autotable');
  autoTableLoaded = true;
} catch (e) {
  console.warn('jspdf-autotable not available, PDF tables will use basic formatting');
}

// CSV Export
export const exportToCSV = (
  data: any[],
  filename: string,
  headers?: string[]
) => {
  if (data.length === 0) return;

  const headerRow = headers || Object.keys(data[0]);
  const csvContent = [
    headerRow.join(','),
    ...data.map(row =>
      headerRow.map(header => {
        const value = row[header];
        // Quote if contains comma
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

// PDF Export for Daily Records
export const exportDailyToPDF = (
  records: AttendanceRecord[],
  employees: Employee[],
  date: string
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'موظف محذوف';

  // Title
  doc.setFontSize(16);
  doc.text(`تقرير يومي - ${date}`, pageWidth / 2, 15, { align: 'center' });

  // Table data
  const tableData = records.map(record => [
    record.date,
    getEmpName(record.employeeId),
    formatTo12Hour(record.checkin),
    formatTo12Hour(record.checkout),
    formatDuration(record.regularHours),
    formatDuration(record.overtimeHours),
    formatDuration(record.totalHours),
    record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : 'جمعة',
    record.notes || '-'
  ]);

  // Add table if available, otherwise use simple text
  if (autoTableLoaded && (doc as any).autoTable) {
    (doc as any).autoTable({
      head: [['التاريخ', 'الموظف', 'الدخول', 'الخروج', 'أساسي', 'إضافي', 'الإجمالي', 'الحالة', 'ملاحظات']],
      body: tableData,
      startY: 25,
      margin: { right: 10, left: 10 },
      styles: {
        font: 'Arial',
        halign: 'center',
        valign: 'middle',
        fontSize: 9
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
  } else {
    // Fallback: simple table without autoTable
    let y = 25;
    doc.setFontSize(10);
    tableData.forEach((row) => {
      doc.text(row.join(' | '), 10, y);
      y += 5;
    });
  }

  doc.save(`تقرير-يومي-${date}.pdf`);
};

// PDF Export for Monthly Report
export const exportMonthlyToPDF = (
  summary: MonthlyStats[],
  month: string
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title
  doc.setFontSize(16);
  doc.text(`تقرير شهري - ${month}`, pageWidth / 2, 15, { align: 'center' });

  // Table data
  const tableData = summary.map(stats => [
    stats.name,
    stats.department,
    stats.presentDays.toString(),
    stats.absentDays.toString(),
    formatDuration(stats.regularHours),
    formatDuration(stats.overtimeHours),
    formatDuration(stats.totalHours)
  ]);

  // Add totals
  tableData.push([
    'المجموع الكلي',
    '',
    summary.reduce((a, b) => a + b.presentDays, 0).toString(),
    summary.reduce((a, b) => a + b.absentDays, 0).toString(),
    formatDuration(summary.reduce((a, b) => a + b.regularHours, 0)),
    formatDuration(summary.reduce((a, b) => a + b.overtimeHours, 0)),
    formatDuration(summary.reduce((a, b) => a + b.totalHours, 0))
  ]);

  if (autoTableLoaded && (doc as any).autoTable) {
    (doc as any).autoTable({
      head: [['الموظف', 'القسم', 'حضور', 'غياب', 'أساسي', 'إضافي', 'الإجمالي']],
      body: tableData,
      startY: 25,
      margin: { right: 10, left: 10 },
      styles: {
        font: 'Arial',
        halign: 'center',
        valign: 'middle',
        fontSize: 9
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
  } else {
    let y = 25;
    doc.setFontSize(10);
    tableData.forEach((row) => {
      doc.text(row.join(' | '), 10, y);
      y += 5;
    });
  }

  doc.save(`تقرير-شهري-${month}.pdf`);
};

// CSV Export for Records
export const exportRecordsToCSV = (
  records: AttendanceRecord[],
  employees: Employee[],
  filename: string
) => {
  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || 'موظف محذوف';
  
  const data = records.map(record => ({
    التاريخ: record.date,
    اليوم: record.day,
    الموظف: getEmpName(record.employeeId),
    الدخول: formatTo12Hour(record.checkin),
    الخروج: formatTo12Hour(record.checkout),
    ساعات_أساسية: formatDuration(record.regularHours),
    ساعات_إضافية: formatDuration(record.overtimeHours),
    الإجمالي: formatDuration(record.totalHours),
    الحالة: record.status === 'present' ? 'حاضر' : record.status === 'absent' ? 'غائب' : 'جمعة',
    ملاحظات: record.notes || '-'
  }));

  exportToCSV(data, filename);
};

// CSV Export for Monthly Summary
export const exportMonthlySummaryToCSV = (
  summary: MonthlyStats[],
  month: string
) => {
  const data = summary.map(stats => ({
    الموظف: stats.name,
    القسم: stats.department,
    أيام_الحضور: stats.presentDays,
    أيام_الغياب: stats.absentDays,
    ساعات_أساسية: formatDuration(stats.regularHours),
    ساعات_إضافية: formatDuration(stats.overtimeHours),
    الإجمالي: formatDuration(stats.totalHours)
  }));

  // Add totals
  data.push({
    الموظف: 'المجموع الكلي',
    القسم: '',
    أيام_الحضور: summary.reduce((a, b) => a + b.presentDays, 0),
    أيام_الغياب: summary.reduce((a, b) => a + b.absentDays, 0),
    ساعات_أساسية: formatDuration(summary.reduce((a, b) => a + b.regularHours, 0)),
    ساعات_إضافية: formatDuration(summary.reduce((a, b) => a + b.overtimeHours, 0)),
    الإجمالي: formatDuration(summary.reduce((a, b) => a + b.totalHours, 0))
  });

  exportToCSV(data, `تقرير-شهري-${month}.csv`);
};
