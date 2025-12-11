import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord } from '@/types/attendance';
import { generateId, formatDuration, formatDate, getDayName, formatTo12Hour } from '@/lib/attendance-utils';
import { exportEmployeeRecordsToExcel } from '@/lib/excel-export';
import { useNotification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

interface EmployeeManagerProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onAddEmployee: (emp: Employee) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onDeleteRecord: (id: string) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  records,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onDeleteRecord
}) => {
  const { notify } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [statsMonth, setStatsMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showAllRecords, setShowAllRecords] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpDept, setNewEmpDept] = useState('');

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const getRecordCount = (id: string) => records.filter(r => r.employeeId === id).length;

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

  const openAddModal = () => {
    setEditingId(null);
    setNewEmpName('');
    setNewEmpId('');
    setNewEmpDept('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditingId(emp.id);
    setNewEmpName(emp.name);
    setNewEmpId(emp.id);
    setNewEmpDept(emp.department);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!newEmpName.trim()) return notify('يرجى إدخال اسم الموظف', 'error');
    
    if (editingId) {
      const originalEmp = employees.find(e => e.id === editingId);
      if (!originalEmp) return;

      const updatedEmp: Employee = {
        ...originalEmp,
        name: newEmpName,
        department: newEmpDept || 'عام',
      };
      onUpdateEmployee(updatedEmp);
      notify('تم تحديث بيانات الموظف');
    } else {
      const emp: Employee = {
        id: newEmpId.trim() || generateId('EMP'),
        name: newEmpName,
        department: newEmpDept || 'عام',
        createdAt: new Date().toISOString()
      };
      onAddEmployee(emp);
      notify('تم إضافة الموظف بنجاح');
    }

    setIsModalOpen(false);
  };

  // Get all employee records (either for month or all time)
  const employeeRecords = useMemo(() => {
    if (!viewingEmployee) return [];

    let filteredRecords = records.filter(r => r.employeeId === viewingEmployee.id);
    
    if (!showAllRecords) {
      filteredRecords = filteredRecords.filter(r => r.date.startsWith(statsMonth));
    }

    return filteredRecords.sort((a, b) => b.date.localeCompare(a.date));
  }, [viewingEmployee, records, statsMonth, showAllRecords]);

  // Statistics for viewing employee
  const employeeStats = useMemo(() => {
    if (!viewingEmployee) return null;

    const relevantRecords = showAllRecords 
      ? records.filter(r => r.employeeId === viewingEmployee.id)
      : records.filter(r => r.employeeId === viewingEmployee.id && r.date.startsWith(statsMonth));

    const presentDays = relevantRecords.filter(r => r.status === 'present').length;
    const absentDays = relevantRecords.filter(r => r.status === 'absent').length;
    const totalRegular = relevantRecords.reduce((sum, r) => sum + r.regularHours, 0);
    const totalOvertime = relevantRecords.reduce((sum, r) => sum + r.overtimeHours, 0);
    const totalAllHours = relevantRecords.reduce((sum, r) => sum + r.totalHours, 0);
    const avgDailyHours = presentDays > 0 ? totalAllHours / presentDays : 0;

    return {
      presentDays,
      absentDays,
      totalRegular,
      totalOvertime,
      avgDailyHours,
      records: employeeRecords
    };
  }, [viewingEmployee, records, statsMonth, showAllRecords, employeeRecords]);

  const handleExportEmployee = () => {
    if (!viewingEmployee || !employeeStats) return;
    exportEmployeeRecordsToExcel(viewingEmployee, employeeStats.records, showAllRecords ? 'الكل' : statsMonth);
    notify('تم تصدير البيانات بنجاح');
  };

  const handlePrintEmployee = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">إدارة الموظفين</h2>
          <p className="text-muted-foreground text-sm">سجل {employees.length} موظف</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <span className="absolute right-3 top-3 text-muted-foreground text-sm">🔍</span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث بالاسم أو القسم..." 
              className="input-field pr-9"
            />
          </div>
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2 whitespace-nowrap">
            <span>+</span> إضافة موظف
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-card rounded-xl border-2 border-dashed border-border">
            <span className="text-4xl text-muted-foreground/30 mb-3 block">🔍</span>
            <p className="text-muted-foreground">لا يوجد موظفين مطابقين للبحث</p>
          </div>
        ) : (
          filteredEmployees.map(emp => (
            <div 
              key={emp.id}
              className="bg-card rounded-xl p-4 border border-border transition-all group hover:shadow-md hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-3">
                <div 
                  className="flex items-center gap-3 cursor-pointer" 
                  onClick={() => setViewingEmployee(emp)}
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-primary-foreground font-bold shadow-md',
                    getAvatarColor(emp.name)
                  )}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-base leading-tight hover:text-primary transition-colors">
                      {emp.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">{emp.department}</span>
                  </div>
                </div>
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(emp)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => { 
                      if(confirm('هل أنت متأكد من حذف الموظف وسجلاته؟')) {
                        onDeleteEmployee(emp.id);
                        notify('تم حذف الموظف', 'info');
                      }
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                <span className="text-xs text-muted-foreground font-mono">ID: {emp.id.substring(0, 8)}</span>
                <button 
                  onClick={() => setViewingEmployee(emp)} 
                  className="text-xs font-semibold text-primary bg-primary/5 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
                >
                  📜 السجل ({getRecordCount(emp.id)})
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden z-10 animate-fade-in">
            <div className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">
                {editingId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    الاسم الكامل <span className="text-destructive">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={newEmpName} 
                    onChange={e => setNewEmpName(e.target.value)} 
                    className="input-field" 
                    placeholder="أدخل الاسم"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">القسم / الوظيفة</label>
                  <input 
                    type="text" 
                    value={newEmpDept} 
                    onChange={e => setNewEmpDept(e.target.value)} 
                    className="input-field" 
                    placeholder="مثال: الحسابات"
                  />
                </div>
                
                {!editingId && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">الكود الوظيفي</label>
                    <input 
                      type="text" 
                      value={newEmpId} 
                      onChange={e => setNewEmpId(e.target.value)} 
                      className="input-field"
                      placeholder="سيتم إنشاؤه تلقائياً إذا ترك فارغاً"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-muted p-4 flex justify-end gap-3 border-t border-border">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">إلغاء</button>
              <button onClick={handleSave} className="btn-primary">
                {editingId ? 'حفظ التغييرات' : 'إضافة الموظف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Profile Modal - Full Records View */}
      {viewingEmployee && employeeStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" onClick={() => setViewingEmployee(null)} />
          
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden z-10 animate-fade-in print:max-w-none print:max-h-none print:rounded-none print:shadow-none">
            {/* Header */}
            <div className="bg-sidebar text-sidebar-foreground p-6 flex justify-between items-center no-print">
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-full bg-gradient-to-br flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg',
                  getAvatarColor(viewingEmployee.name)
                )}>
                  {viewingEmployee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{viewingEmployee.name}</h2>
                  <p className="text-sidebar-foreground/70 text-sm flex items-center gap-2">
                    💼 {viewingEmployee.department}
                    <span className="opacity-50">|</span>
                    <span className="font-mono opacity-70">ID: {viewingEmployee.id}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportEmployee}
                  className="px-4 py-2 bg-success/20 text-success rounded-lg hover:bg-success/30 transition-colors flex items-center gap-2"
                >
                  📊 تصدير Excel
                </button>
                <button 
                  onClick={handlePrintEmployee}
                  className="px-4 py-2 bg-primary/20 text-primary-foreground rounded-lg hover:bg-primary/30 transition-colors flex items-center gap-2"
                >
                  🖨️ طباعة
                </button>
                <button 
                  onClick={() => setViewingEmployee(null)} 
                  className="w-10 h-10 rounded-full bg-sidebar-accent hover:bg-sidebar-accent/80 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block p-6 border-b border-border">
              <h1 className="text-2xl font-bold text-center mb-2">سجل حضور الموظف</h1>
              <div className="flex justify-center gap-8 text-sm">
                <span><strong>الاسم:</strong> {viewingEmployee.name}</span>
                <span><strong>القسم:</strong> {viewingEmployee.department}</span>
                <span><strong>الفترة:</strong> {showAllRecords ? 'جميع السجلات' : statsMonth}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-muted/50 p-6 custom-scrollbar">
              {/* Controls */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-4 no-print">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  📊 {showAllRecords ? 'جميع السجلات' : 'إحصائيات الشهر'}
                </h3>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={showAllRecords}
                      onChange={(e) => setShowAllRecords(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">عرض جميع السجلات</span>
                  </label>
                  {!showAllRecords && (
                    <input 
                      type="month" 
                      value={statsMonth}
                      onChange={(e) => setStatsMonth(e.target.value)}
                      className="input-field w-auto"
                    />
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground text-xs font-bold uppercase mb-1">أيام الحضور</p>
                  <span className="text-2xl font-bold text-success block">{employeeStats.presentDays}</span>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground text-xs font-bold uppercase mb-1">أيام الغياب</p>
                  <span className="text-2xl font-bold text-destructive block">{employeeStats.absentDays}</span>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground text-xs font-bold uppercase mb-1">ساعات أساسية</p>
                  <span className="text-2xl font-bold text-primary block" dir="ltr">{formatDuration(employeeStats.totalRegular)}</span>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                  <p className="text-muted-foreground text-xs font-bold uppercase mb-1">ساعات إضافية</p>
                  <span className="text-2xl font-bold text-warning block" dir="ltr">{formatDuration(employeeStats.totalOvertime)}</span>
                </div>
              </div>

              {/* Records Table - ALL RECORDS */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/50 flex justify-between items-center">
                  <h4 className="font-bold text-foreground text-sm">
                    سجل الحضور ({employeeStats.records.length} سجل)
                  </h4>
                </div>
                <div className="overflow-x-auto custom-scrollbar max-h-[400px] print:max-h-none">
                  <table className="w-full">
                    <thead className="table-header sticky top-0">
                      <tr>
                        <th className="p-3 text-right">#</th>
                        <th className="p-3 text-right">التاريخ</th>
                        <th className="p-3 text-center">اليوم</th>
                        <th className="p-3 text-center">دخول</th>
                        <th className="p-3 text-center">خروج</th>
                        <th className="p-3 text-center">أساسي</th>
                        <th className="p-3 text-center">إضافي</th>
                        <th className="p-3 text-center">الإجمالي</th>
                        <th className="p-3 text-center">الحالة</th>
                        <th className="p-3 text-center no-print">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {employeeStats.records.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-muted-foreground">
                            لا توجد سجلات {showAllRecords ? '' : 'لهذا الشهر'}
                          </td>
                        </tr>
                      ) : (
                        employeeStats.records.map((rec, index) => (
                          <tr key={rec.id} className="hover:bg-muted/50 transition-colors">
                            <td className="p-3 text-muted-foreground text-sm">{index + 1}</td>
                            <td className="p-3">
                              <span className="font-bold text-foreground">{rec.date}</span>
                            </td>
                            <td className="p-3 text-center">
                              <span className="text-xs text-muted-foreground">{rec.day}</span>
                            </td>
                            <td className="p-3 text-center font-mono text-sm" dir="ltr">{formatTo12Hour(rec.checkin)}</td>
                            <td className="p-3 text-center font-mono text-sm" dir="ltr">{formatTo12Hour(rec.checkout)}</td>
                            <td className="p-3 text-center font-mono text-sm text-primary" dir="ltr">{formatDuration(rec.regularHours)}</td>
                            <td className="p-3 text-center font-mono text-sm" dir="ltr">
                              {rec.overtimeHours > 0 ? (
                                <span className="text-warning bg-warning/10 px-2 py-0.5 rounded">+{formatDuration(rec.overtimeHours)}</span>
                              ) : (
                                <span className="text-muted-foreground">0:00</span>
                              )}
                            </td>
                            <td className="p-3 text-center font-bold" dir="ltr">{formatDuration(rec.totalHours)}</td>
                            <td className="p-3 text-center">
                              <span className={cn(
                                'badge',
                                rec.status === 'present' && 'badge-success',
                                rec.status === 'absent' && 'badge-danger',
                                rec.status === 'friday' && 'badge-warning'
                              )}>
                                {rec.status === 'present' ? 'حاضر' : rec.status === 'absent' ? 'غائب' : 'جمعة'}
                              </span>
                            </td>
                            <td className="p-3 text-center no-print">
                              <button 
                                onClick={() => {
                                  if(confirm('هل أنت متأكد من حذف هذا السجل؟')) {
                                    onDeleteRecord(rec.id);
                                    notify('تم حذف السجل', 'info');
                                  }
                                }}
                                className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {/* Totals Footer */}
                    {employeeStats.records.length > 0 && (
                      <tfoot className="bg-muted font-bold border-t-2 border-border">
                        <tr>
                          <td colSpan={5} className="p-3 text-right text-muted-foreground">المجموع</td>
                          <td className="p-3 text-center text-primary" dir="ltr">{formatDuration(employeeStats.totalRegular)}</td>
                          <td className="p-3 text-center text-warning" dir="ltr">{formatDuration(employeeStats.totalOvertime)}</td>
                          <td className="p-3 text-center text-lg" dir="ltr">
                            {formatDuration(employeeStats.totalRegular + employeeStats.totalOvertime)}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
