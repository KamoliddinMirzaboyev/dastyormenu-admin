import { mockStore } from './mockStore';
import { Menu, ExpenseCategory } from './types';
import { FinancialStats } from './expenseService';

export type ReportPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

export interface ProductReportItem {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  image_url: string | null;
  price: number;              // Sotilish narxi (tiyin)
  cost_price: number;         // Tan narxi (tiyin)
  unit_profit: number;        // Bir porsiyadan sof foyda (tiyin)
  sold_count: number;         // Sotilgan miqdori (dona/porsiya)
  total_turnover: number;     // Jami aylanma (tiyin)
  total_cost: number;         // Jami tan narx (tiyin)
  total_profit: number;       // Jami sof foyda (tiyin)
  profit_margin: number;      // Marja foizi %
  share_of_sales: number;     // Sotuvdagi ulushi %
  velocity: 'fast' | 'normal' | 'slow' | 'zero'; // Tezlik ko'rsatkichi
}

export interface CategoryReportItem {
  id: string;
  name: string;
  icon: string;
  items_sold: number;
  total_turnover: number;
  total_profit: number;
  share: number;
}

export interface ComprehensiveReport {
  period: ReportPeriod;
  periodLabel: string;
  startDate: string;
  endDate: string;
  financials: FinancialStats;
  totalItemsSold: number;
  products: ProductReportItem[];
  topFastMoving: ProductReportItem[];
  slowMoving: ProductReportItem[];
  zeroSales: ProductReportItem[];
  categories: CategoryReportItem[];
  dailyTimeline: Array<{
    date: string;
    day: string;
    turnover: number;
    costPrice: number;
    expenses: number;
    netProfit: number;
    ordersCount: number;
    itemsCount: number;
  }>;
}

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  ingredients: "Masalliqlar & Oziq-ovqat",
  salary: "Xodimlar maoshi & Choypuli",
  utilities: "Kommunal to'lovlar",
  rent: "Bino ijarasi",
  household: "Xo'jalik xarajatlari",
  other: "Boshqa xarajatlar",
};

class ReportService {
  /**
   * Generates a complete periodic report with financial overview and itemized product analytics
   */
  generateReport(
    period: ReportPeriod = 'week',
    customStart?: string,
    customEnd?: string
  ): ComprehensiveReport {
    const allOrders = mockStore.getOrders();
    const allExpenses = mockStore.getExpenses();
    const allMenus = mockStore.getMenu();
    const allCategories = mockStore.getCategories();
    const allStaff = mockStore.getStaff();

    const catLookup = new Map<string, { name: string; icon: string }>();
    allCategories.forEach(c => catLookup.set(c.id, { name: c.name, icon: c.icon }));

    // Determine date boundary
    const now = new Date();
    let startDateStr = '';
    let endDateStr = now.toISOString().split('T')[0];
    let periodLabel = 'Haftalik';

    if (period === 'today') {
      startDateStr = endDateStr;
      periodLabel = 'Bugun';
    } else if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDateStr = y.toISOString().split('T')[0];
      endDateStr = startDateStr;
      periodLabel = 'Kecha';
    } else if (period === 'week') {
      const w = new Date(now);
      w.setDate(w.getDate() - 6);
      startDateStr = w.toISOString().split('T')[0];
      periodLabel = "Oxirgi 7 kun";
    } else if (period === 'month') {
      const m = new Date(now);
      m.setDate(m.getDate() - 29);
      startDateStr = m.toISOString().split('T')[0];
      periodLabel = "Shu oy (30 kun)";
    } else if (period === 'all') {
      startDateStr = '2026-01-01';
      periodLabel = "Barcha davr";
    } else if (period === 'custom' && customStart && customEnd) {
      startDateStr = customStart;
      endDateStr = customEnd;
      periodLabel = `${customStart} - ${customEnd}`;
    } else {
      const w = new Date(now);
      w.setDate(w.getDate() - 6);
      startDateStr = w.toISOString().split('T')[0];
      periodLabel = "Oxirgi 7 kun";
    }

    // Filter orders within date boundary
    const filteredOrders = allOrders.filter(o => {
      const orderDate = o.created_at.split('T')[0];
      return orderDate >= startDateStr && orderDate <= endDateStr;
    });

    const completedOrders = filteredOrders.filter(o => o.status === 'completed');

    // Menu mapping
    const menuMap = new Map<string, Menu>();
    allMenus.forEach(m => menuMap.set(m.id, m));

    // Calculate item sales
    const itemSales = new Map<string, {
      count: number;
      revenue: number;
      cost: number;
    }>();

    completedOrders.forEach(order => {
      (order.order_items || []).forEach(item => {
        const menuItem = menuMap.get(item.menu_id);
        const itemCost = item.cost_price ?? menuItem?.cost_price ?? Math.round(item.menu_price * 0.5);

        const current = itemSales.get(item.menu_id) || { count: 0, revenue: 0, cost: 0 };
        current.count += item.quantity;
        current.revenue += item.menu_price * item.quantity;
        current.cost += itemCost * item.quantity;
        itemSales.set(item.menu_id, current);
      });
    });

    const totalTurnover = completedOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const totalCostPrice = Array.from(itemSales.values()).reduce((sum, it) => sum + it.cost, 0);
    const grossProfit = totalTurnover - totalCostPrice;
    const totalItemsSold = Array.from(itemSales.values()).reduce((sum, it) => sum + it.count, 0);

    // Build ProductReportItem list for EVERY menu item
    const products: ProductReportItem[] = allMenus.map(menuItem => {
      const sales = itemSales.get(menuItem.id) || { count: 0, revenue: 0, cost: 0 };
      const catInfo = catLookup.get(menuItem.category_id) || { name: 'Boshqa', icon: '🍽️' };
      const costPrice = menuItem.cost_price ?? Math.round(menuItem.price * 0.5);
      const unitProfit = menuItem.price - costPrice;
      const totalProfit = sales.revenue - sales.cost;
      const profitMargin = sales.revenue > 0 ? Math.round((totalProfit / sales.revenue) * 100) : Math.round((unitProfit / menuItem.price) * 100);
      const shareOfSales = totalTurnover > 0 ? Math.round((sales.revenue / totalTurnover) * 1000) / 10 : 0;

      let velocity: 'fast' | 'normal' | 'slow' | 'zero' = 'zero';
      if (sales.count >= 5) {
        velocity = 'fast';
      } else if (sales.count >= 2) {
        velocity = 'normal';
      } else if (sales.count === 1) {
        velocity = 'slow';
      } else {
        velocity = 'zero';
      }

      return {
        id: menuItem.id,
        name: menuItem.name,
        category_id: menuItem.category_id,
        category_name: catInfo.name,
        category_icon: catInfo.icon,
        image_url: menuItem.image_url,
        price: menuItem.price,
        cost_price: costPrice,
        unit_profit: unitProfit,
        sold_count: sales.count,
        total_turnover: sales.revenue,
        total_cost: sales.cost,
        total_profit: totalProfit,
        profit_margin: profitMargin,
        share_of_sales: shareOfSales,
        velocity,
      };
    });

    // Top Fast-Moving (Ko'p sotilganlar)
    const topFastMoving = [...products]
      .filter(p => p.sold_count > 0)
      .sort((a, b) => b.sold_count - a.sold_count)
      .slice(0, 8);

    // Slow-Moving (Kam sotilganlar - 1 yoki 2 ta)
    const slowMoving = [...products]
      .filter(p => p.sold_count === 1 || p.sold_count === 2)
      .sort((a, b) => a.sold_count - b.sold_count);

    // Zero-Sales (Umuman sotilmaganlar)
    const zeroSales = [...products]
      .filter(p => p.sold_count === 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    // Category Sales breakdown
    const catSalesMap = new Map<string, { sold: number; turnover: number; profit: number }>();
    products.forEach(p => {
      const c = catSalesMap.get(p.category_id) || { sold: 0, turnover: 0, profit: 0 };
      c.sold += p.sold_count;
      c.turnover += p.total_turnover;
      c.profit += p.total_profit;
      catSalesMap.set(p.category_id, c);
    });

    const categories: CategoryReportItem[] = Array.from(catSalesMap.entries()).map(([catId, data]) => {
      const catInfo = catLookup.get(catId) || { name: 'Boshqa', icon: '🍽️' };
      return {
        id: catId,
        name: catInfo.name,
        icon: catInfo.icon,
        items_sold: data.sold,
        total_turnover: data.turnover,
        total_profit: data.profit,
        share: totalTurnover > 0 ? Math.round((data.turnover / totalTurnover) * 100) : 0,
      };
    }).sort((a, b) => b.total_turnover - a.total_turnover);

    // Filter expenses in range
    const periodExpenses = allExpenses.filter(e => e.date >= startDateStr && e.date <= endDateStr);
    const otherExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Staff payroll fund
    const totalPayrollFund = allStaff.reduce((sum, s) => {
      const sal = s.monthly_salary ?? (s.role === 'chef' ? 900000000 : s.role === 'manager' ? 800000000 : 400000000);
      return sum + sal;
    }, 0);

    // Calculate number of days in period
    const startD = new Date(startDateStr);
    const endD = new Date(endDateStr);
    const diffTime = Math.abs(endD.getTime() - startD.getTime());
    const dayCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const periodSalaries = Math.round((totalPayrollFund / 30) * dayCount);
    const totalExpenses = totalCostPrice + periodSalaries + otherExpenses;
    const netProfit = totalTurnover - totalExpenses;
    const profitMargin = totalTurnover > 0 ? Math.round((netProfit / totalTurnover) * 1000) / 10 : 0;
    const averageCheck = completedOrders.length > 0 ? Math.round(totalTurnover / completedOrders.length) : 0;

    // Timeline calculation
    const DAYS_SHORT = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan'];
    const dailyTimeline: ComprehensiveReport['dailyTimeline'] = [];
    const loopDate = new Date(startD);

    const dailySal = Math.round(totalPayrollFund / 30);

    while (loopDate <= endD) {
      const dStr = loopDate.toISOString().split('T')[0];
      const dOrders = completedOrders.filter(o => o.created_at.startsWith(dStr));
      const dayTurnover = dOrders.reduce((sum, o) => sum + o.total_amount, 0);
      let dayCost = 0;
      let dayItems = 0;

      dOrders.forEach(o => {
        (o.order_items || []).forEach(it => {
          const menuItem = menuMap.get(it.menu_id);
          const c = it.cost_price ?? menuItem?.cost_price ?? Math.round(it.menu_price * 0.5);
          dayCost += c * it.quantity;
          dayItems += it.quantity;
        });
      });

      const dayDirectExpenses = periodExpenses
        .filter(e => e.date === dStr)
        .reduce((sum, e) => sum + e.amount, 0);

      const dayTotalExpenses = dayCost + dailySal + dayDirectExpenses;

      dailyTimeline.push({
        date: dStr,
        day: DAYS_SHORT[loopDate.getDay()],
        turnover: dayTurnover,
        costPrice: dayCost,
        expenses: dayTotalExpenses,
        netProfit: dayTurnover - dayTotalExpenses,
        ordersCount: dOrders.length,
        itemsCount: dayItems,
      });

      loopDate.setDate(loopDate.getDate() + 1);
    }

    // Categorized expenses
    const expCatMap: Record<ExpenseCategory, number> = {
      ingredients: 0,
      salary: 0,
      utilities: 0,
      rent: 0,
      household: 0,
      other: 0,
    };

    periodExpenses.forEach(e => {
      if (expCatMap[e.category] !== undefined) {
        expCatMap[e.category] += e.amount;
      } else {
        expCatMap.other += e.amount;
      }
    });
    expCatMap.salary += periodSalaries;

    const allExpensesTotal = totalCostPrice + Object.values(expCatMap).reduce((a, b) => a + b, 0);

    const expensesByCategory = [
      {
        category: 'cogs',
        label: 'Mahsulotlar Tan Narxi (COGS)',
        amount: totalCostPrice,
        percentage: allExpensesTotal > 0 ? Math.round((totalCostPrice / allExpensesTotal) * 100) : 0,
      },
      ...((Object.keys(expCatMap) as ExpenseCategory[])
        .filter(cat => expCatMap[cat] > 0)
        .map(cat => ({
          category: cat,
          label: CATEGORY_NAMES[cat] || 'Boshqa',
          amount: expCatMap[cat],
          percentage: allExpensesTotal > 0 ? Math.round((expCatMap[cat] / allExpensesTotal) * 100) : 0,
        }))),
    ].sort((a, b) => b.amount - a.amount);

    const financials: FinancialStats = {
      periodLabel,
      totalTurnover,
      totalRevenue: totalTurnover,
      totalCostPrice,
      grossProfit,
      totalSalaries: periodSalaries,
      otherExpenses,
      totalExpenses,
      netProfit,
      profitMargin,
      grossMargin: totalTurnover > 0 ? Math.round((grossProfit / totalTurnover) * 100) : 0,
      orderCount: completedOrders.length,
      averageCheck,
      customerCount: new Set(completedOrders.map(o => o.table_id)).size,
      revenueChange: 14.8,
      totalPayrollFund,
      staffCount: allStaff.length,
      expensesByCategory,
      dailyFinancials: dailyTimeline.map(d => ({
        day: d.day,
        date: d.date,
        turnover: d.turnover,
        revenue: d.turnover,
        costPrice: d.costPrice,
        expenses: d.expenses,
        profit: d.netProfit,
      })),
    };

    return {
      period,
      periodLabel,
      startDate: startDateStr,
      endDate: endDateStr,
      financials,
      totalItemsSold,
      products: products.sort((a, b) => b.sold_count - a.sold_count),
      topFastMoving,
      slowMoving,
      zeroSales,
      categories,
      dailyTimeline,
    };
  }
}

export const reportService = new ReportService();
