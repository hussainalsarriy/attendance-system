# 🔧 دليل المطور السريع

## البنية الجديدة للمشروع

```
src/
├── contexts/
│   ├── NotificationContext.tsx (موجود)
│   └── ThemeContext.tsx ⭐ جديد
├── components/
│   ├── ThemeToggle.tsx ⭐ جديد
│   ├── attendance/
│   │   ├── Dashboard.tsx
│   │   ├── Sidebar.tsx (معدّل)
│   │   ├── ReportsView.tsx (معدّل)
│   │   ├── AdvancedRecordsTable.tsx ⭐ جديد
│   │   └── ReportScheduleManager.tsx ⭐ جديد
│   └── ui/
│       └── ...
├── lib/
│   ├── storage.ts
│   ├── attendance-utils.ts
│   ├── excel-export.ts
│   ├── pdf-export.ts ⭐ جديد
│   └── schedule-manager.ts ⭐ جديد
└── ...
```

---

## استخدام الـ Hooks الجديدة

### useTheme()

```typescript
import { useTheme } from '@/contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, isDark } = useTheme();
  
  return (
    <button onClick={() => setTheme('dark')}>
      الوضع المظلم: {isDark ? 'مفعل' : 'معطل'}
    </button>
  );
}
```

### useReportScheduler()

```typescript
import { useReportScheduler } from '@/lib/schedule-manager';

function MyComponent({ employees, records }) {
  // تفعيل التحقق من الجدولة كل دقيقة
  useReportScheduler(employees, records);
  
  return <div>تم تفعيل الجدولة</div>;
}
```

---

## استخدام مدير الجدولة

```typescript
import { scheduleManager, ReportSchedule } from '@/lib/schedule-manager';

// إضافة جدولة جديدة
const schedule = scheduleManager.addSchedule({
  name: 'تقرير يومي',
  type: 'daily',
  time: '09:00',
  format: 'excel',
  enabled: true
});

// الحصول على كل الجدولات
const schedules = scheduleManager.getSchedules();

// تحديث جدولة
scheduleManager.updateSchedule(scheduleId, { enabled: false });

// حذف جدولة
scheduleManager.deleteSchedule(scheduleId);

// التحقق والتشغيل اليدوي
scheduleManager.checkAndRun(employees, records);
```

---

## استخدام دوال التصدير

### تصدير Excel

```typescript
import { exportDailyToExcel, exportMonthlyToExcel } from '@/lib/excel-export';

// تقرير يومي
exportDailyToExcel(records, employees, '2025-12-11');

// تقرير شهري
exportMonthlyToExcel(monthlySummary, '2025-12');
```

### تصدير PDF

```typescript
import { exportDailyToPDF, exportMonthlyToPDF } from '@/lib/pdf-export';

// تقرير يومي
exportDailyToPDF(records, employees, '2025-12-11');

// تقرير شهري
exportMonthlyToPDF(monthlySummary, '2025-12');
```

### تصدير CSV

```typescript
import { exportRecordsToCSV, exportMonthlySummaryToCSV } from '@/lib/pdf-export';

// سجلات يومية
exportRecordsToCSV(records, employees, 'تقرير-يومي.csv');

// ملخص شهري
exportMonthlySummaryToCSV(summary, '2025-12');
```

---

## استخدام الجدول المتقدم

```typescript
import { AdvancedRecordsTable } from '@/components/attendance/AdvancedRecordsTable';

function MyView() {
  return (
    <AdvancedRecordsTable
      employees={employees}
      records={records}
      onDeleteRecord={(id) => console.log('حذف:', id)}
    />
  );
}
```

**الميزات:**
- بحث فوري
- تصفية حسب الحالة
- ترتيب ديناميكي
- تصفح بالصفحات

---

## مراجع أنواع البيانات

### ReportSchedule

```typescript
interface ReportSchedule {
  id: string;           // معرف فريد
  name: string;         // اسم الجدولة
  type: 'daily' | 'weekly' | 'monthly';
  day?: number;         // 0-6 للأسبوعي، 1-31 للشهري
  time: string;         // HH:mm format
  format: 'excel' | 'pdf' | 'csv';
  enabled: boolean;
  lastRun?: string;     // ISO date string
}
```

---

## متغيرات بيئية مهمة

> لا توجد متغيرات بيئية مطلوبة حالياً.
> جميع البيانات تُحفظ في localStorage

---

## نصائح الأداء

### 1. استخدم useMemo للحسابات الثقيلة
```typescript
const filteredData = useMemo(() => {
  return records.filter(r => r.date === selectedDate);
}, [records, selectedDate]);
```

### 2. تجنب إعادة التصيير غير الضرورية
```typescript
const handleDelete = useCallback((id: string) => {
  onDeleteRecord(id);
}, [onDeleteRecord]);
```

### 3. كسّر الملفات الضخمة
```typescript
// بدلاً من ملف واحد ضخم، استخدم:
// - pdf-export.ts
// - excel-export.ts
// - schedule-manager.ts
```

---

## التوسيعات المستقبلية

### 1. إضافة قاعدة بيانات
```typescript
// قد تحتاج إلى تعديل:
import { storage } from '@/lib/storage'; // → API calls
```

### 2. نظام المصادقة
```typescript
// إضافة context جديد:
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

### 3. إرسال البريد الإلكتروني
```typescript
// توسيع schedule-manager:
const sendEmailReport = async (email, attachment) => {
  // استدعاء API
};
```

---

## الأخطاء الشائعة وحلولها

### ❌ خطأ: "jspdf-autotable not found"
```bash
npm install jspdf-autotable --save
```

### ❌ خطأ: "localStorage is undefined"
**الحل:** تحقق من أن الكود يعمل في المتصفح، وليس في SSR

### ❌ خطأ: "Theme not applying"
**الحل:** تأكد من أن `ThemeProvider` يلف التطبيق في App.tsx

---

## اختبار الميزات الجديدة

### اختبار الوضع المظلم:
1. انقر على الشريط الجانبي
2. اجد أيقونة القمر/الشمس
3. جرب التبديل بين الأوضاع

### اختبار التصدير:
1. اذهب إلى التقارير
2. اختر نوع التقرير
3. اختر صيغة مختلفة وصدّر

### اختبار الجدولة:
1. أضف جدولة جديدة
2. غيّر الوقت الحالي في النظام
3. راقب التشغيل التلقائي

---

## السجلات والـ Debugging

```typescript
// فعّل الـ console logs:
scheduleManager.checkAndRun(employees, records);
// سيطبع معلومات في console عند تشغيل جدولة

// راقب التغييرات:
console.log(scheduleManager.getSchedules());
```

---

## المراجع المهمة

- [Recharts Docs](https://recharts.org/)
- [jsPDF Docs](https://github.com/parallax/jsPDF)
- [React Hooks Docs](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**آخر تحديث:** ديسمبر 2025  
**مستوى الصعوبة:** متوسط  
**الوقت المقدر للتعلم:** 1-2 ساعة
