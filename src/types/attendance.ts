export interface Employee {
  id: string;
  name: string;
  department: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  day: string;
  employeeId: string;
  checkin: string; // HH:mm (24h format stored, displayed as 12h)
  checkout: string; // HH:mm
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  notes: string;
  isFriday: boolean;
  status: 'present' | 'absent' | 'friday';
  createdAt: string;
}

export interface HoursResult {
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  error: string | null;
}

export interface MonthlyStats {
  empId: string;
  name: string;
  department: string;
  presentDays: number;
  absentDays: number;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
}
