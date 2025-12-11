import { HoursResult } from '@/types/attendance';

export const WORK_HOURS_LIMIT = 8;
export const END_OF_WORK_DAY = '17:00';

// --- Time Formatting Logic (12-Hour System) ---
export const formatTo12Hour = (time24: string): string => {
  if (!time24 || time24 === '-') return '-';
  
  const parts = time24.split(':');
  if (parts.length < 2) return time24;

  const [hoursStr, minutesStr] = parts;
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  
  if (isNaN(hours)) return time24;

  const period = hours >= 12 ? 'م' : 'ص'; // Arabic PM/AM
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${hours}:${minutes} ${period}`;
};

export const formatTime24 = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const parseTime = (timeString: string): number => {
  if (!timeString || timeString === '-') return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

// --- Duration Formatting (Decimal to H:mm) ---
export const formatDuration = (hoursDecimal: number): string => {
  if (!hoursDecimal || isNaN(hoursDecimal)) return '0:00';
  
  const hours = Math.floor(hoursDecimal);
  const minutes = Math.round((hoursDecimal - hours) * 60);
  
  if (minutes === 60) {
    return `${hours + 1}:00`;
  }
  
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

// --- Date Helpers ---
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDayName = (date: Date): string => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
};

export const getMonthName = (dateString: string): string => {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const parts = dateString.split('-');
  if (parts.length < 2) return '';
  const month = parseInt(parts[1]) - 1;
  return months[month] || '';
};

export const getDayOfMonth = (dateString: string): number => {
  return parseInt(dateString.split('-')[2]) || 0;
};

export const getYear = (dateString: string): string => {
  return dateString.split('-')[0] || '';
};

// --- Calculation Logic ---
export const calculateHours = (checkinTime: string, checkoutTime: string): HoursResult => {
  const checkinMinutes = parseTime(checkinTime);
  const checkoutMinutes = parseTime(checkoutTime);
  const endOfWorkDayMinutes = parseTime(END_OF_WORK_DAY);

  if (checkoutMinutes <= checkinMinutes) {
    return {
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      error: 'وقت الخروج يجب أن يكون بعد وقت الدخول!'
    };
  }

  let regularHours = 0;
  let overtimeHours = 0;

  if (checkoutMinutes <= endOfWorkDayMinutes) {
    regularHours = (checkoutMinutes - checkinMinutes) / 60;
    overtimeHours = 0;
  } else {
    const regularMinutes = Math.min(
      endOfWorkDayMinutes - checkinMinutes,
      WORK_HOURS_LIMIT * 60
    );
    regularHours = Math.max(0, regularMinutes / 60);
    overtimeHours = (checkoutMinutes - endOfWorkDayMinutes) / 60;
  }

  regularHours = Math.min(regularHours, WORK_HOURS_LIMIT);

  return {
    totalHours: parseFloat((regularHours + overtimeHours).toFixed(2)),
    regularHours: parseFloat(regularHours.toFixed(2)),
    overtimeHours: parseFloat(overtimeHours.toFixed(2)),
    error: null
  };
};

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
};
