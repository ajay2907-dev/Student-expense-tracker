import { Expense, DateRangePreset } from '../types';

export function filterExpensesByPreset(
  expenses: Expense[],
  preset: DateRangePreset,
  startDate?: string,
  endDate?: string
): Expense[] {
  if (!preset || preset === 'all') return expenses;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  return expenses.filter((exp) => {
    if (!exp.date) return false;
    const expDate = new Date(exp.date);
    if (isNaN(expDate.getTime())) return false;

    const expDateStr = exp.date.substring(0, 10);

    switch (preset) {
      case 'today':
        return expDateStr === todayStr;

      case 'yesterday': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return expDateStr === y.toISOString().split('T')[0];
      }

      case 'this_week': {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return expDate >= startOfWeek && expDate <= now;
      }

      case 'last_week': {
        const startOfLastWeek = new Date(now);
        const day = startOfLastWeek.getDay();
        const diffToMon = startOfLastWeek.getDate() - day + (day === 0 ? -6 : 1) - 7;
        startOfLastWeek.setDate(diffToMon);
        startOfLastWeek.setHours(0, 0, 0, 0);

        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);

        return expDate >= startOfLastWeek && expDate <= endOfLastWeek;
      }

      case 'this_month': {
        return (
          expDate.getFullYear() === now.getFullYear() &&
          expDate.getMonth() === now.getMonth()
        );
      }

      case 'last_month': {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          expDate.getFullYear() === lm.getFullYear() &&
          expDate.getMonth() === lm.getMonth()
        );
      }

      case 'this_year': {
        return expDate.getFullYear() === now.getFullYear();
      }

      case 'custom': {
        if (startDate && expDateStr < startDate) return false;
        if (endDate && expDateStr > endDate) return false;
        return true;
      }

      default:
        return true;
    }
  });
}

export function getWeeklyDaysData(expenses: Expense[], _currency?: string) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const startOfWeek = new Date(now);
  const currentDay = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - currentDay;
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = days[d.getDay()];
    const fullDayLabel = fullDays[d.getDay()];
    const formattedDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      dateStr,
      dayLabel,
      fullDayLabel,
      formattedDate,
      amount: 0,
      expenses: [] as Expense[],
    };
  });

  expenses.forEach((exp) => {
    if (!exp.date) return;
    const expDateStr = exp.date.substring(0, 10);
    const target = weekDays.find((w) => w.dateStr === expDateStr);
    if (target) {
      target.amount += Number(exp.amount) || 0;
      target.expenses.push(exp);
    }
  });

  const weekData = weekDays.map((w) => ({
    dateStr: w.dateStr,
    day: w.dayLabel,
    fullDay: w.fullDayLabel,
    formattedDate: w.formattedDate,
    amount: Math.round(w.amount * 100) / 100,
    isToday: w.dateStr === todayStr,
    expenses: w.expenses,
    count: w.expenses.length,
  }));

  const totalWeekly = weekData.reduce((sum, item) => sum + item.amount, 0);
  const dailyAvg = Math.round((totalWeekly / 7) * 100) / 100;

  return { weekData, totalWeekly, dailyAvg };
}
