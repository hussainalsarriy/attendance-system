import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/attendance/Sidebar';
import { Dashboard } from '@/components/attendance/Dashboard';
import { EmployeeManager } from '@/components/attendance/EmployeeManager';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { TodayRecords } from '@/components/attendance/TodayRecords';
import { ReportsView } from '@/components/attendance/ReportsView';
import { NotificationProvider, useNotification } from '@/contexts/NotificationContext';
import { storage } from '@/lib/storage';
import { Employee, AttendanceRecord } from '@/types/attendance';

const AttendanceApp: React.FC = () => {
  const { notify } = useNotification();
  const [activeView, setActiveView] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  // Load data on mount
  useEffect(() => {
    storage.initDemoData();
    refreshData();
  }, []);

  const refreshData = () => {
    setEmployees(storage.getEmployees());
    setRecords(storage.getRecords());
  };

  const handleAddEmployee = (emp: Employee) => {
    storage.addEmployee(emp.name, emp.department, emp.id);
    refreshData();
  };

  const handleUpdateEmployee = (emp: Employee) => {
    storage.updateEmployee(emp);
    refreshData();
  };

  const handleDeleteEmployee = (id: string) => {
    storage.deleteEmployee(id);
    refreshData();
  };

  const handleAddRecord = (record: AttendanceRecord) => {
    try {
      storage.addRecord(record);
      refreshData();
    } catch (e: any) {
      notify(e.message, 'error');
    }
  };

  const handleUpdateRecord = (record: AttendanceRecord) => {
    storage.updateRecord(record);
    refreshData();
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
      storage.deleteRecord(id);
      refreshData();
      notify('تم حذف السجل', 'info');
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard employees={employees} records={records} />;
      
      case 'employees':
        return (
          <EmployeeManager
            employees={employees}
            records={records}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onDeleteRecord={handleDeleteRecord}
          />
        );
      
      case 'attendance':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
            <div className="xl:col-span-4">
              <AttendanceForm
                employees={employees}
                records={records}
                onAddRecord={handleAddRecord}
              />
            </div>
            <div className="xl:col-span-8">
              <TodayRecords
                employees={employees}
                records={records}
                onDeleteRecord={handleDeleteRecord}
              />
            </div>
          </div>
        );
      
      case 'reports':
        return (
          <ReportsView
            employees={employees}
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onUpdateRecord={handleUpdateRecord}
          />
        );
      
      default:
        return <Dashboard employees={employees} records={records} />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar activeView={activeView} onChangeView={setActiveView} />
      
      <main className="flex-1 p-6 overflow-auto custom-scrollbar">
        {renderContent()}
      </main>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <NotificationProvider>
      <AttendanceApp />
    </NotificationProvider>
  );
};

export default Index;
