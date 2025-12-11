import React, { useState } from 'react';
import { scheduleManager, ReportSchedule } from '@/lib/schedule-manager';
import { Plus, Trash2, Edit2, Power } from 'lucide-react';

interface ScheduleManagerProps {
  onSchedulesChange?: () => void;
}

export const ReportScheduleManager: React.FC<ScheduleManagerProps> = ({ onSchedulesChange }) => {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(scheduleManager.getSchedules());
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'daily' as const,
    day: 0,
    time: '09:00',
    format: 'excel' as const,
    enabled: true
  });

  const refreshSchedules = () => {
    const updated = scheduleManager.getSchedules();
    setSchedules(updated);
    onSchedulesChange?.();
  };

  const handleAddSchedule = () => {
    if (!formData.name.trim() || !formData.time) return;

    scheduleManager.addSchedule({
      name: formData.name,
      type: formData.type,
      day: formData.type !== 'daily' ? formData.day : undefined,
      time: formData.time,
      format: formData.format,
      enabled: formData.enabled
    });

    setFormData({
      name: '',
      type: 'daily',
      day: 0,
      time: '09:00',
      format: 'excel',
      enabled: true
    });
    setIsAdding(false);
    refreshSchedules();
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('هل تريد حذف هذه الجدولة؟')) {
      scheduleManager.deleteSchedule(id);
      refreshSchedules();
    }
  };

  const handleToggleSchedule = (id: string, enabled: boolean) => {
    scheduleManager.updateSchedule(id, { enabled: !enabled });
    refreshSchedules();
  };

  const getDayLabel = (type: string, day?: number) => {
    if (type === 'daily') return 'يومي';
    if (type === 'weekly') {
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      return days[day || 0];
    }
    if (type === 'monthly') {
      return `اليوم ${day} من الشهر`;
    }
    return '';
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'excel': return 'Excel (XLSX)';
      case 'pdf': return 'PDF';
      case 'csv': return 'CSV';
      default: return format;
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Schedule Form */}
      {isAdding && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-foreground">جدولة تقرير جديد</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="اسم الجدولة"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
            />

            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="input-field"
            >
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>

          {formData.type !== 'daily' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                className="input-field"
              >
                {formData.type === 'weekly' ? (
                  <>
                    <option value={0}>الأحد</option>
                    <option value={1}>الاثنين</option>
                    <option value={2}>الثلاثاء</option>
                    <option value={3}>الأربعاء</option>
                    <option value={4}>الخميس</option>
                    <option value={5}>الجمعة</option>
                    <option value={6}>السبت</option>
                  </>
                ) : (
                  Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>اليوم {i + 1}</option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="input-field"
            />

            <select
              value={formData.format}
              onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
              className="input-field"
            >
              <option value="excel">Excel</option>
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-border rounded hover:bg-muted transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={handleAddSchedule}
              className="btn-primary"
            >
              إضافة جدولة
            </button>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>لا توجد جدولات مجدولة</p>
          </div>
        ) : (
          schedules.map(schedule => (
            <div
              key={schedule.id}
              className="bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <h4 className="font-bold text-foreground">{schedule.name}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>{getDayLabel(schedule.type, schedule.day)}</span>
                  <span>{schedule.time}</span>
                  <span>{getFormatLabel(schedule.format)}</span>
                  {schedule.lastRun && (
                    <span>آخر تشغيل: {new Date(schedule.lastRun).toLocaleString('ar-SA')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleSchedule(schedule.id, schedule.enabled)}
                  className={`p-2 rounded transition-colors ${
                    schedule.enabled
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                  title={schedule.enabled ? 'معطل' : 'مفعل'}
                >
                  <Power size={18} />
                </button>
                <button
                  onClick={() => handleDeleteSchedule(schedule.id)}
                  className="p-2 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <Plus size={18} />
          إضافة جدولة جديدة
        </button>
      )}
    </div>
  );
};
