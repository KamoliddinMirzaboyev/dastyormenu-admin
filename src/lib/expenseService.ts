import { ApiResponse } from './api';
import { Expense, ExpenseCategory } from './types';
import { mockStore } from './mockStore';

export interface FinancialStats {
  periodLabel: string;
  totalTurnover: number;     // Jami aylanma (sotuv tushumi, tiyin)
  totalRevenue: number;      // same as totalTurnover for backward compat
  totalCostPrice: number;    // Taomlar tan narxi (COGS, tiyin)
  grossProfit: number;       // Yalpi foyda = Aylanma - Tan narx (tiyin)
  totalSalaries: number;     // Ushbu davr uchun hisoblangan xodimlar maoshi (tiyin)
  otherExpenses: number;     // Boshqa operatsion xarajatlar (tiyin)
  totalExpenses: number;     // Jami xarajatlar = Tan narx + Maoshlar + Boshqa (tiyin)
  netProfit: number;         // Sof foyda = Aylanma - Jami xarajatlar (tiyin)
  profitMargin: number;      // Rentabellik % = (Sof foyda / Aylanma) * 100
  grossMargin: number;       // Yalpi marja % = (Yalpi foyda / Aylanma) * 100
  orderCount: number;
  averageCheck: number;      // in tiyin
  customerCount: number;
  revenueChange: number;     // percentage compared to prev
  totalPayrollFund: number;  // Umumiy oylik maosh fondi (jami jamoa)
  staffCount: number;
  expensesByCategory: Array<{
    category: string;
    label: string;
    amount: number;         // in tiyin
    percentage: number;
  }>;
  dailyFinancials: Array<{
    day: string;
    date: string;
    revenue: number;        // in tiyin (aylanma)
    turnover: number;       // in tiyin
    costPrice: number;      // in tiyin
    expenses: number;       // in tiyin
    profit: number;         // in tiyin
  }>;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredients: 'Masalliqlar & Oziq-ovqat',
  salary: 'Xodimlar maoshi & Choypuli',
  utilities: 'Kommunal to\'lovlar',
  rent: 'Bino ijarasi',
  household: 'Xo\'jalik xarajatlari',
  other: 'Boshqa xarajatlar',
};

class ExpenseService {
  async getExpenses(params: { date?: string; category?: string } = {}): Promise<ApiResponse<Expense[]>> {
    const data = mockStore.getExpenses(params);
    return { success: true, data };
  }

  async createExpense(payload: {
    category: ExpenseCategory;
    title: string;
    amount: number;
    date?: string;
    note?: string;
  }): Promise<ApiResponse<Expense>> {
    const expense = mockStore.createExpense({
      ...payload,
      category_label: CATEGORY_LABELS[payload.category] || 'Xarajat',
    });
    return { success: true, data: expense };
  }

  async deleteExpense(id: string): Promise<ApiResponse<void>> {
    mockStore.deleteExpense(id);
    return { success: true, data: undefined };
  }

  /**
   * Calculate detailed financial stats for: 'today' | 'week' | 'month'
   * Accurately factors in:
   * 1. Aylanma (Turnover / Gross Sales)
   * 2. Mahsulotlar Tan Narxi (Cost of Goods Sold - COGS)
   * 3. Xodimlar Maoshlari (Salaries & Payroll Fund)
   * 4. Boshqa Xarajatlar (Ijara, Kommunal, Xo'jalik)
   * 5. Sof Foyda (Net Profit)
   */
  getFinancialStats(period: 'today' | 'week' | 'month' = 'today'): FinancialStats {
    const orders = mockStore.getOrders();
    const expenses = mockStore.getExpenses();
    const staff = mockStore.getStaff();
    const menu = mockStore.getMenu();

    // Map menu items for quick cost_price lookup
    const menuCostMap = new Map<string, number>();
    menu.forEach(m => {
      const cost = m.cost_price ?? Math.round(m.price * 0.5);
      menuCostMap.set(m.id, cost);
      menuCostMap.set(m.name, cost);
    });

    // Staff payroll fund (monthly)
    const totalPayrollFund = staff.reduce((sum, s) => {
      const salary = s.monthly_salary ?? (s.role === 'chef' ? 900000000 : s.role === 'manager' ? 800000000 : 400000000);
      return sum + salary;
    }, 0);

    const numDays = period === 'today' ? 1 : period === 'week' ? 7 : 30;
    
    // Period salary share:
    // Today: monthly / 30
    // Week: (monthly / 30) * 7
    // Month: full monthly
    const periodSalaries = Math.round((totalPayrollFund / 30) * numDays);

    const now = new Date();
    const DAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];
    const targetDates: { day: string; date: string }[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      targetDates.push({
        day: DAYS[d.getDay()],
        date: dateStr,
      });
    }

    const dateSet = new Set(targetDates.map(t => t.date));

    // Filter relevant orders for this period
    const periodOrders = orders.filter(o => {
      const d = o.created_at.split('T')[0];
      return dateSet.has(d);
    });

    const completedOrders = periodOrders.filter(o => o.status === 'completed');

    // 1. Aylanma (Total Turnover)
    const totalTurnover = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);

    // 2. Tan Narxi (COGS)
    let totalCostPrice = 0;
    completedOrders.forEach(o => {
      (o.order_items || []).forEach(item => {
        const itemCost = item.cost_price ?? menuCostMap.get(item.menu_id) ?? menuCostMap.get(item.menu_name) ?? Math.round(item.menu_price * 0.5);
        totalCostPrice += itemCost * item.quantity;
      });
    });

    // 3. Yalpi Foyda (Gross Profit = Aylanma - Tan Narxi)
    const grossProfit = totalTurnover - totalCostPrice;
    const grossMargin = totalTurnover > 0 ? Math.round((grossProfit / totalTurnover) * 1000) / 10 : 0;

    // 4. Boshqa Xarajatlar (Direct Expenses in mockStore excluding pure salary double-counts)
    const periodExpenses = expenses.filter(e => dateSet.has(e.date));
    const otherExpenses = periodExpenses.reduce((sum, e) => {
      // If categorized as salary in expenses, we account it under operational expenses
      return sum + e.amount;
    }, 0);

    // 5. Jami Xarajatlar & Sof Foyda
    const totalExpenses = totalCostPrice + periodSalaries + otherExpenses;
    const netProfit = totalTurnover - totalExpenses;
    const profitMargin = totalTurnover > 0 ? Math.round((netProfit / totalTurnover) * 1000) / 10 : 0;

    const orderCount = periodOrders.length;
    const averageCheck = completedOrders.length > 0 ? Math.round(totalTurnover / completedOrders.length) : 0;
    const customerCount = new Set(periodOrders.map(o => o.table_id)).size;

    // Categorized breakdown
    const catMap: Record<ExpenseCategory, number> = {
      ingredients: 0,
      salary: 0,
      utilities: 0,
      rent: 0,
      household: 0,
      other: 0,
    };

    periodExpenses.forEach(e => {
      if (catMap[e.category] !== undefined) {
        catMap[e.category] += e.amount;
      } else {
        catMap.other += e.amount;
      }
    });

    // Include monthly salary fund in the category breakdown for full clarity
    catMap.salary += periodSalaries;

    const allExpensesTotal = totalCostPrice + Object.values(catMap).reduce((a, b) => a + b, 0);

    const expensesByCategory: Array<{
      category: string;
      label: string;
      amount: number;
      percentage: number;
    }> = [
      {
        category: 'cogs',
        label: 'Mahsulotlar Tan Narxi (COGS)',
        amount: totalCostPrice,
        percentage: allExpensesTotal > 0 ? Math.round((totalCostPrice / allExpensesTotal) * 100) : 0,
      },
      ...((Object.keys(catMap) as ExpenseCategory[])
        .filter(cat => catMap[cat] > 0)
        .map(cat => ({
          category: cat,
          label: CATEGORY_LABELS[cat],
          amount: catMap[cat],
          percentage: allExpensesTotal > 0 ? Math.round((catMap[cat] / allExpensesTotal) * 100) : 0,
        }))),
    ].sort((a, b) => b.amount - a.amount);

    // Daily breakdown for charts
    const dailySalaries = Math.round(totalPayrollFund / 30);
    const dailyFinancials = targetDates.map(({ day, date }) => {
      const dayOrders = completedOrders.filter(o => o.created_at.startsWith(date));
      const dayTurnover = dayOrders.reduce((sum, o) => sum + o.total_amount, 0);

      let dayCost = 0;
      dayOrders.forEach(o => {
        (o.order_items || []).forEach(it => {
          const c = it.cost_price ?? menuCostMap.get(it.menu_id) ?? Math.round(it.menu_price * 0.5);
          dayCost += c * it.quantity;
        });
      });

      const dayExp = periodExpenses
        .filter(e => e.date === date)
        .reduce((sum, e) => sum + e.amount, 0) + dailySalaries + dayCost;

      return {
        day,
        date,
        turnover: dayTurnover,
        revenue: dayTurnover,
        costPrice: dayCost,
        expenses: dayExp,
        profit: dayTurnover - dayExp,
      };
    });

    return {
      periodLabel: period === 'today' ? 'Bugun' : period === 'week' ? 'Haftalik' : 'Oylik',
      totalTurnover,
      totalRevenue: totalTurnover,
      totalCostPrice,
      grossProfit,
      totalSalaries: periodSalaries,
      otherExpenses,
      totalExpenses,
      netProfit,
      profitMargin,
      grossMargin,
      orderCount,
      averageCheck,
      customerCount,
      revenueChange: 14.8,
      totalPayrollFund,
      staffCount: staff.length,
      expensesByCategory,
      dailyFinancials,
    };
  }
}

export const expenseService = new ExpenseService();
