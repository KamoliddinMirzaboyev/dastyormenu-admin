// ─── Expense Service (Manager API) ────────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { Expense, ExpenseCategory } from './types';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredients: "Masalliqlar & Oziq-ovqat",
  salary: "Xodimlar maoshi & Choypuli",
  utilities: "Kommunal to'lovlar",
  rent: "Bino ijarasi",
  household: "Xo'jalik xarajatlari",
  other: "Boshqa xarajatlar",
};

export interface FinancialStats {
  periodLabel: string;
  totalTurnover: number;
  totalRevenue: number;
  totalCostPrice: number;
  grossProfit: number;
  totalSalaries: number;
  otherExpenses: number;
  totalExpenses: number;
  netProfit: number | null;
  profitMargin: number | null;
  grossMargin: number | null;
  orderCount: number;
  averageCheck: number;
  customerCount: number;
  revenueChange: number | null;
  totalPayrollFund: number;
  staffCount: number;
  expensesByCategory: Array<{
    category: string;
    label: string;
    amount: number;
    percentage: number;
  }>;
  dailyFinancials: Array<{
    day: string;
    date: string;
    revenue: number;
    turnover: number;
    costPrice: number;
    expenses: number;
    profit: number;
  }>;
}

class ExpenseService {
  async getExpenses(params: { date?: string; category?: string } = {}): Promise<ApiResponseEnvelope<Expense[]>> {
    const res = await managerApi.expenses.getExpenses(params);
    if (res.success && res.data) {
      const items = Array.isArray(res.data) ? res.data : [];
      return {
        success: true,
        data: items.map((e: any) => ({
          id: e.id,
          organization_id: e.organization_id || e.organization || '',
          category: e.category,
          category_label: CATEGORY_LABELS[e.category as ExpenseCategory] || 'Xarajat',
          title: e.title,
          amount: e.amount || 0, // in tiyin
          date: e.date || new Date().toISOString().split('T')[0],
          created_at: e.created_at || new Date().toISOString(),
          note: e.note,
        })),
      };
    }
    return { success: false, error: res.error };
  }

  async createExpense(payload: {
    category: ExpenseCategory;
    title: string;
    amount: number; // in tiyin
    date?: string;
    note?: string;
  }): Promise<ApiResponseEnvelope<Expense>> {
    const res = await managerApi.expenses.createExpense({
      category: payload.category,
      title: payload.title,
      amount: payload.amount,
      date: payload.date || new Date().toISOString().split('T')[0],
      note: payload.note,
    });

    if (res.success && res.data) {
      return {
        success: true,
        data: {
          id: res.data.id,
          organization_id: res.data.organization_id || '',
          category: res.data.category,
          category_label: CATEGORY_LABELS[res.data.category as ExpenseCategory] || 'Xarajat',
          title: res.data.title,
          amount: res.data.amount,
          date: res.data.date,
          created_at: res.data.created_at || new Date().toISOString(),
          note: res.data.note,
        },
      };
    }

    return { success: false, error: res.error };
  }

  async deleteExpense(id: string): Promise<ApiResponseEnvelope<void>> {
    const res = await managerApi.expenses.deleteExpense(id);
    return { success: res.success, error: res.error, data: undefined };
  }
}

export const expenseService = new ExpenseService();
