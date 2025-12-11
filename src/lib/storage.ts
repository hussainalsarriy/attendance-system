import { Employee, AttendanceRecord } from '@/types/attendance';
import { generateId } from './attendance-utils';

const EMPLOYEES_KEY = 'attendance_employees';
const RECORDS_KEY = 'attendance_records';

// Simple localStorage-based storage
export const storage = {
  // Employees
  getEmployees: (): Employee[] => {
    try {
      const data = localStorage.getItem(EMPLOYEES_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveEmployees: (employees: Employee[]) => {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees));
  },

  addEmployee: (name: string, department: string, customId?: string): Employee => {
    const employees = storage.getEmployees();
    const newEmployee: Employee = {
      id: customId || generateId('EMP'),
      name,
      department: department || 'عام',
      createdAt: new Date().toISOString()
    };
    employees.push(newEmployee);
    storage.saveEmployees(employees);
    return newEmployee;
  },

  updateEmployee: (employee: Employee) => {
    const employees = storage.getEmployees();
    const index = employees.findIndex(e => e.id === employee.id);
    if (index !== -1) {
      employees[index] = employee;
      storage.saveEmployees(employees);
    }
  },

  deleteEmployee: (id: string) => {
    const employees = storage.getEmployees().filter(e => e.id !== id);
    storage.saveEmployees(employees);
    
    // Also delete related records
    const records = storage.getRecords().filter(r => r.employeeId !== id);
    storage.saveRecords(records);
  },

  // Records
  getRecords: (): AttendanceRecord[] => {
    try {
      const data = localStorage.getItem(RECORDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveRecords: (records: AttendanceRecord[]) => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  },

  addRecord: (record: AttendanceRecord) => {
    const records = storage.getRecords();
    
    // Check for duplicate
    const exists = records.some(r => 
      r.date === record.date && r.employeeId === record.employeeId
    );
    
    if (exists) {
      throw new Error('تم التسجيل لهذا الموظف اليوم مسبقاً');
    }
    
    records.push(record);
    storage.saveRecords(records);
  },

  updateRecord: (record: AttendanceRecord) => {
    const records = storage.getRecords();
    const index = records.findIndex(r => r.id === record.id);
    if (index !== -1) {
      records[index] = record;
      storage.saveRecords(records);
    }
  },

  deleteRecord: (id: string) => {
    const records = storage.getRecords().filter(r => r.id !== id);
    storage.saveRecords(records);
  },

  // Initialize with demo data if empty
  initDemoData: () => {
    const employees = storage.getEmployees();
    if (employees.length === 0) {
      // Add demo employees
      const demoEmployees: Employee[] = [
        { id: 'EMP-001', name: 'أحمد محمد', department: 'الإدارة', createdAt: new Date().toISOString() },
        { id: 'EMP-002', name: 'سارة علي', department: 'المحاسبة', createdAt: new Date().toISOString() },
        { id: 'EMP-003', name: 'محمد خالد', department: 'المبيعات', createdAt: new Date().toISOString() },
        { id: 'EMP-004', name: 'فاطمة أحمد', department: 'الموارد البشرية', createdAt: new Date().toISOString() },
      ];
      storage.saveEmployees(demoEmployees);
    }
  }
};
