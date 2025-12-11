import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord } from '@/types/attendance';
import { formatTo12Hour, formatDuration } from '@/lib/attendance-utils';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';

interface AdvancedTableProps {
  employees: Employee[];
  records: AttendanceRecord[];
  onDeleteRecord?: (id: string) => void;
}

type SortField = 'date' | 'employee' | 'checkin' | 'checkout' | 'totalHours' | 'status';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'present' | 'absent' | 'friday';

export const AdvancedRecordsTable: React.FC<AdvancedTableProps> = ({
  employees,
  records,
  onDeleteRecord
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getEmployeeName = (empId: string) => {
    return employees.find(e => e.id === empId)?.name || 'موظف محذوف';
  };

  // Filter and Search
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = 
        getEmployeeName(record.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.date.includes(searchTerm) ||
        record.day.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = 
        filterStatus === 'all' || record.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [records, searchTerm, filterStatus, employees]);

  // Sort
  const sortedRecords = useMemo(() => {
    const sorted = [...filteredRecords].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'employee':
          comparison = getEmployeeName(a.employeeId).localeCompare(
            getEmployeeName(b.employeeId)
          );
          break;
        case 'checkin':
          comparison = a.checkin.localeCompare(b.checkin);
          break;
        case 'checkout':
          comparison = a.checkout.localeCompare(b.checkout);
          break;
        case 'totalHours':
          comparison = a.totalHours - b.totalHours;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredRecords, sortField, sortDirection, employees]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-success/10 text-success';
      case 'absent':
        return 'bg-destructive/10 text-destructive';
      case 'friday':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'حاضر';
      case 'absent':
        return 'غائب';
      case 'friday':
        return 'جمعة';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-3 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="بحث بالموظف أو التاريخ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field pr-10"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute right-3 top-3 text-muted-foreground" size={18} />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as FilterStatus);
              setCurrentPage(1);
            }}
            className="input-field pr-10 appearance-none cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="present">حاضر</option>
            <option value="absent">غائب</option>
            <option value="friday">جمعة</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-center bg-card border border-border rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground">
            <span className="font-bold text-foreground">{filteredRecords.length}</span> سجل
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    التاريخ
                    <SortIcon field="date" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort('employee')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    الموظف
                    <SortIcon field="employee" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort('checkin')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors justify-center"
                  >
                    وقت الدخول
                    <SortIcon field="checkin" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort('checkout')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors justify-center"
                  >
                    وقت الخروج
                    <SortIcon field="checkout" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort('totalHours')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors justify-center"
                  >
                    الساعات
                    <SortIcon field="totalHours" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 hover:text-foreground transition-colors justify-center"
                  >
                    الحالة
                    <SortIcon field="status" />
                  </button>
                </th>
                {onDeleteRecord && <th className="px-4 py-3 text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={onDeleteRecord ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground">
                    لا توجد سجلات
                  </td>
                </tr>
              ) : (
                paginatedRecords.map(record => (
                  <tr
                    key={record.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{record.date}</td>
                    <td className="px-4 py-3 text-foreground">{getEmployeeName(record.employeeId)}</td>
                    <td className="px-4 py-3 text-center font-mono" dir="ltr">
                      {formatTo12Hour(record.checkin)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono" dir="ltr">
                      {formatTo12Hour(record.checkout)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono">
                      <span className={`${record.totalHours > 8 ? 'text-warning font-bold' : ''}`}>
                        {formatDuration(record.totalHours)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                    {onDeleteRecord && (
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            if (confirm('هل تريد حذف هذا السجل؟')) {
                              onDeleteRecord(record.id);
                            }
                          }}
                          className="px-2 py-1 text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 rounded transition-colors"
                        >
                          حذف
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50 transition-colors"
          >
            السابق
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded transition-colors ${
                currentPage === page
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50 transition-colors"
          >
            التالي
          </button>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-muted-foreground text-center">
        الصفحة {currentPage} من {totalPages} | عرض {paginatedRecords.length} من {filteredRecords.length}
      </div>
    </div>
  );
};
