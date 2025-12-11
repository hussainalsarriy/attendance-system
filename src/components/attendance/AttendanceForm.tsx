import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord } from '@/types/attendance';
import { 
  formatDate, 
  formatTime24, 
  calculateHours, 
  generateId, 
  getDayName, 
  formatTo12Hour, 
  END_OF_WORK_DAY 
} from '@/lib/attendance-utils';
import { useNotification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';

interface AttendanceFormProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onAddRecord: (record: AttendanceRecord) => void;
}

export const AttendanceForm: React.FC<AttendanceFormProps> = ({ 
  employees, 
  records,
  onAddRecord 
}) => {
  const { notify } = useNotification();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  const [date, setDate] = useState(formatDate(new Date()));
  const [checkin, setCheckin] = useState(formatTime24(new Date()));
  const [checkout, setCheckout] = useState('');
  const [notes, setNotes] = useState('');
  const [isDuplicate, setIsDuplicate] = useState(false);

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const avatarColors = [
    'from-primary to-primary-hover',
    'from-success to-success/80',
    'from-warning to-warning/80',
    'from-destructive to-destructive/80',
  ];

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) { 
      hash = name.charCodeAt(i) + ((hash << 5) - hash); 
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  };

  useEffect(() => {
    if (checkin && !checkout) {
      setCheckout(END_OF_WORK_DAY); 
    }
  }, [checkin]);

  useEffect(() => {
    if (selectedEmployeeId && date) {
      const exists = records.some(r => r.date === date && r.employeeId === selectedEmployeeId);
      setIsDuplicate(exists);
    } else {
      setIsDuplicate(false);
    }
  }, [selectedEmployeeId, date, records]);

  const handleAdd = (status: 'present' | 'absent') => {
    if (!selectedEmployeeId) return notify('يرجى اختيار موظف أولاً', 'error');
    if (!date) return notify('يرجى اختيار التاريخ', 'error');
    if (isDuplicate) return notify('تم التسجيل لهذا الموظف اليوم مسبقاً', 'error');

    const d = new Date(date);
    const dayName = getDayName(d);
    const isFriday = d.getDay() === 5; 

    let record: AttendanceRecord;

    if (status === 'absent') {
      record = {
        id: generateId('REC'),
        date,
        day: dayName,
        employeeId: selectedEmployeeId,
        checkin: '-',
        checkout: '-',
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        notes: notes || 'غياب',
        isFriday,
        status: isFriday ? 'friday' : 'absent',
        createdAt: new Date().toISOString()
      };
    } else {
      if (!checkin || !checkout) return notify('يرجى إدخال وقت الدخول والخروج', 'error');
      const calc = calculateHours(checkin, checkout);
      if (calc.error) return notify(calc.error, 'error');

      record = {
        id: generateId('REC'),
        date,
        day: dayName,
        employeeId: selectedEmployeeId,
        checkin,
        checkout,
        totalHours: calc.totalHours,
        regularHours: calc.regularHours,
        overtimeHours: calc.overtimeHours,
        notes,
        isFriday,
        status: isFriday ? 'friday' : 'present',
        createdAt: new Date().toISOString()
      };
    }

    onAddRecord(record);
    setNotes('');
    notify('تم تسجيل الحضور بنجاح');
  };

  const setNow = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(formatTime24(new Date()));
  };

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden sticky top-6">
      {/* Header */}
      <div className="bg-sidebar p-5 text-sidebar-foreground">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          ✋ تسجيل حضور جديد
        </h2>
        
        <div className="relative">
          <span className={cn(
            'absolute right-3 top-3 transition-colors',
            isSearchFocused ? 'text-primary' : 'text-sidebar-foreground/50'
          )}>
            🔍
          </span>
          <input 
            type="text"
            placeholder="ابحث واختر الموظف..."
            className="w-full pr-10 pl-4 py-3 bg-sidebar-accent border border-sidebar-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary text-sidebar-foreground placeholder-sidebar-foreground/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          
          {isSearchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card rounded-xl shadow-xl border border-border max-h-60 overflow-y-auto z-50 custom-scrollbar">
              {filteredEmployees.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground text-sm">لا يوجد نتائج</div>
              ) : (
                filteredEmployees.map(emp => (
                  <div 
                    key={emp.id}
                    className="p-3 hover:bg-primary/5 cursor-pointer border-b border-border last:border-0 flex items-center gap-3 transition-colors text-foreground"
                    onMouseDown={() => {
                      setSelectedEmployeeId(emp.id);
                      setSearchTerm(emp.name);
                    }}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-primary-foreground text-xs font-bold',
                      getAvatarColor(emp.name)
                    )}>
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground">{emp.department}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* Selected Employee */}
        {selectedEmployee ? (
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-center gap-4 animate-fade-in">
            <div className={cn(
              'w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-primary-foreground font-bold text-xl shadow-md ring-4 ring-card',
              getAvatarColor(selectedEmployee.name)
            )}>
              {selectedEmployee.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground text-lg">{selectedEmployee.name}</h3>
                  <p className="text-xs text-primary font-medium bg-primary/10 inline-block px-2 py-0.5 rounded-full mt-1">
                    {selectedEmployee.department}
                  </p>
                </div>
                <button 
                  onClick={() => { setSelectedEmployeeId(null); setSearchTerm(''); }} 
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-8 border-2 border-dashed border-border text-center">
            <span className="text-4xl mb-3 block opacity-30">👆</span>
            <p className="text-muted-foreground">اختر موظفاً من القائمة أعلاه</p>
          </div>
        )}

        {/* Duplicate Warning */}
        {isDuplicate && (
          <div className="bg-warning/10 text-warning p-3 rounded-lg text-sm flex items-center gap-2 animate-fade-in">
            ⚠️ تم تسجيل هذا الموظف في هذا التاريخ مسبقاً
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">📅 التاريخ</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">🟢 وقت الدخول</label>
              <div className="flex gap-2">
                <input 
                  type="time" 
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                  className="input-field flex-1"
                />
                <button 
                  onClick={() => setNow(setCheckin)}
                  className="btn-secondary px-3"
                  title="الوقت الحالي"
                >
                  ⏱
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">🔴 وقت الخروج</label>
              <div className="flex gap-2">
                <input 
                  type="time" 
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                  className="input-field flex-1"
                />
                <button 
                  onClick={() => setNow(setCheckout)}
                  className="btn-secondary px-3"
                  title="الوقت الحالي"
                >
                  ⏱
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">📝 ملاحظات</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="أي ملاحظات إضافية..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button 
            onClick={() => handleAdd('present')}
            disabled={!selectedEmployeeId || isDuplicate}
            className={cn(
              'py-4 rounded-xl font-bold text-primary-foreground transition-all flex items-center justify-center gap-2 shadow-lg',
              selectedEmployeeId && !isDuplicate 
                ? 'bg-success hover:bg-success/90 shadow-success/20' 
                : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
            )}
          >
            ✓ تسجيل حضور
          </button>
          <button 
            onClick={() => handleAdd('absent')}
            disabled={!selectedEmployeeId || isDuplicate}
            className={cn(
              'py-4 rounded-xl font-bold text-primary-foreground transition-all flex items-center justify-center gap-2 shadow-lg',
              selectedEmployeeId && !isDuplicate 
                ? 'bg-destructive hover:bg-destructive/90 shadow-destructive/20' 
                : 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
            )}
          >
            ✕ تسجيل غياب
          </button>
        </div>
      </div>
    </div>
  );
};
