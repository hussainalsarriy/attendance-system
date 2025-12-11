import React from 'react';
import { Employee, AttendanceRecord } from '@/types/attendance';
import { exportDailyToExcel, exportMonthlyToExcel } from './excel-export';
import { exportDailyToPDF, exportMonthlyToPDF } from './pdf-export';

export interface ReportSchedule {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly';
  day?: number;
  time: string;
  format: 'excel' | 'pdf' | 'csv';
  enabled: boolean;
  lastRun?: string;
}

const SCHEDULES_KEY = 'report_schedules';

export const scheduleManager = {
  getSchedules: (): ReportSchedule[] => {
    try {
      const data = localStorage.getItem(SCHEDULES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSchedules: (schedules: ReportSchedule[]) => {
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
  },

  addSchedule: (schedule: Omit<ReportSchedule, 'id' | 'lastRun'>) => {
    const schedules = scheduleManager.getSchedules();
    const newSchedule: ReportSchedule = {
      ...schedule,
      id: `sched-${Date.now()}`,
      lastRun: undefined
    };
    schedules.push(newSchedule);
    scheduleManager.saveSchedules(schedules);
    return newSchedule;
  },

  updateSchedule: (id: string, updates: Partial<ReportSchedule>) => {
    const schedules = scheduleManager.getSchedules();
    const index = schedules.findIndex(s => s.id === id);
    if (index !== -1) {
      schedules[index] = { ...schedules[index], ...updates };
      scheduleManager.saveSchedules(schedules);
    }
  },

  deleteSchedule: (id: string) => {
    const schedules = scheduleManager.getSchedules().filter(s => s.id !== id);
    scheduleManager.saveSchedules(schedules);
  },

  checkAndRun: (employees: Employee[], records: AttendanceRecord[]) => {
    const schedules = scheduleManager.getSchedules().filter(s => s.enabled);
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const currentDay = now.getDay();
    const currentDate = now.getDate();

    schedules.forEach(schedule => {
      let shouldRun = false;

      if (currentTime !== schedule.time) return;

      if (schedule.type === 'daily') {
        shouldRun = true;
      } else if (schedule.type === 'weekly' && schedule.day !== undefined) {
        shouldRun = currentDay === schedule.day;
      } else if (schedule.type === 'monthly' && schedule.day !== undefined) {
        shouldRun = currentDate === schedule.day;
      }

      if (shouldRun) {
        const lastRun = schedule.lastRun ? new Date(schedule.lastRun) : null;
        const lastRunToday = lastRun && 
          lastRun.getDate() === now.getDate() &&
          lastRun.getMonth() === now.getMonth() &&
          lastRun.getFullYear() === now.getFullYear();

        if (lastRunToday) {
          shouldRun = false;
        }
      }

      if (shouldRun) {
        scheduleManager.executeSchedule(schedule, employees, records);
      }
    });
  },

  executeSchedule: (
    schedule: ReportSchedule,
    employees: Employee[],
    records: AttendanceRecord[]
  ) => {
    try {
      const now = new Date();
      const month = now.toISOString().slice(0, 7);
      const date = now.toISOString().slice(0, 10);

      if (schedule.type === 'daily' || schedule.type === 'weekly') {
        const dailyRecords = records.filter(r => r.date === date);
        
        if (schedule.format === 'excel') {
          exportDailyToExcel(dailyRecords, employees, date);
        } else if (schedule.format === 'pdf') {
          exportDailyToPDF(dailyRecords, employees, date);
        } else if (schedule.format === 'csv') {
          const csvData = dailyRecords.map(r => ({
            التاريخ: r.date,
            الموظف: employees.find(e => e.id === r.employeeId)?.name || 'محذوف',
            الدخول: r.checkin,
            الخروج: r.checkout,
            الساعات: r.totalHours
          }));
          scheduleManager.downloadCSV(csvData, `تقرير-يومي-${date}.csv`);
        }
      } else if (schedule.type === 'monthly') {
        const monthRecords = records.filter(r => r.date.startsWith(month));
        const summary = employees.map(emp => {
          const empRecords = monthRecords.filter(r => r.employeeId === emp.id);
          return {
            empId: emp.id,
            name: emp.name,
            department: emp.department,
            presentDays: empRecords.filter(r => r.status === 'present').length,
            absentDays: empRecords.filter(r => r.status === 'absent').length,
            regularHours: empRecords.reduce((sum, r) => sum + r.regularHours, 0),
            overtimeHours: empRecords.reduce((sum, r) => sum + r.overtimeHours, 0),
            totalHours: empRecords.reduce((sum, r) => sum + r.totalHours, 0)
          };
        });

        if (schedule.format === 'excel') {
          exportMonthlyToExcel(summary, month);
        } else if (schedule.format === 'pdf') {
          exportMonthlyToPDF(summary, month);
        } else if (schedule.format === 'csv') {
          const csvData = summary.map(s => ({
            الموظف: s.name,
            القسم: s.department,
            الحضور: s.presentDays,
            الغياب: s.absentDays,
            أساسي: s.regularHours,
            إضافي: s.overtimeHours,
            الإجمالي: s.totalHours
          }));
          scheduleManager.downloadCSV(csvData, `تقرير-شهري-${month}.csv`);
        }
      }

      scheduleManager.updateSchedule(schedule.id, {
        lastRun: now.toISOString()
      });
    } catch (error) {
      console.error('Error executing schedule:', error);
    }
  },

  downloadCSV: (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => {
          const val = row[h];
          return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
        }).join(',')
      )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
};

export const useReportScheduler = (employees: Employee[], records: AttendanceRecord[]) => {
  React.useEffect(() => {
    const interval = setInterval(() => {
      scheduleManager.checkAndRun(employees, records);
    }, 60000);

    return () => clearInterval(interval);
  }, [employees, records]);
};
