// ─── Report Service (Manager API) ─────────────────────────────────────────────

import { managerApi, ApiResponseEnvelope } from './managerClient';
import { FinancialStats } from './expenseService';

export type ReportPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

export interface ProductReportItem {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  image_url: string | null;
  price: number; // in tiyin
  cost_price: number; // in tiyin
  unit_profit: number; // in tiyin
  sold_count: number;
  total_turnover: number; // in tiyin
  total_cost: number; // in tiyin
  total_profit: number; // in tiyin
  profit_margin: number;
  share_of_sales: number;
  velocity: 'fast' | 'normal' | 'slow' | 'zero';
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

class ReportService {
  /**
   * Fetch complete periodic report from Manager API GET /api/manager/reports/?period=...
   */
  async getReport(
    period: ReportPeriod = 'week',
    customStart?: string,
    customEnd?: string
  ): Promise<ComprehensiveReport | null> {
    const res = await managerApi.reports.getReport({
      period,
      start_date: customStart,
      end_date: customEnd,
    });

    if (res.success && res.data) {
      return res.data as ComprehensiveReport;
    }

    return null;
  }
}

export const reportService = new ReportService();
