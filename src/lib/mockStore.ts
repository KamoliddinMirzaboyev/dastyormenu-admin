import { 
  Category, 
  Menu, 
  Table, 
  UserProfile, 
  Order, 
  OrderStatus, 
  Expense, 
  Organization 
} from './types';
import { 
  initialOrganization, 
  initialAdminUser, 
  initialStaff, 
  initialCategories, 
  initialMenu, 
  initialTables, 
  generateInitialOrders, 
  generateInitialExpenses 
} from './mockData';
import { queryClient } from './queryClient';

const STORAGE_KEY = 'dastyor_mock_store_v1';

interface StoreData {
  organization: Organization;
  adminUser: UserProfile;
  staff: UserProfile[];
  categories: Category[];
  menu: Menu[];
  tables: Table[];
  orders: Order[];
  expenses: Expense[];
}

type OrderListener = (order: Order, action: 'new_order' | 'status_update') => void;

class MockStore {
  private data: StoreData;
  private orderListeners: Set<OrderListener> = new Set();
  private changeListeners: Set<() => void> = new Set();

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): StoreData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.organization && parsed.orders && parsed.menu) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored mock data, using fresh initial data', e);
    }

    const fresh: StoreData = {
      organization: initialOrganization,
      adminUser: initialAdminUser,
      staff: initialStaff,
      categories: initialCategories,
      menu: initialMenu,
      tables: initialTables,
      orders: generateInitialOrders(),
      expenses: generateInitialExpenses(),
    };
    this.saveToStorage(fresh);
    return fresh;
  }

  private saveToStorage(data: StoreData = this.data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.notifyChange();
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // Realtime general store change listener
  subscribe(listener: () => void): () => void {
    this.changeListeners.add(listener);
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  private notifyChange() {
    this.changeListeners.forEach(listener => {
      try {
        listener();
      } catch (e) {
        console.error('Store change listener error:', e);
      }
    });
  }

  // Realtime order listeners
  subscribeOrders(listener: OrderListener): () => void {
    this.orderListeners.add(listener);
    return () => {
      this.orderListeners.delete(listener);
    };
  }

  private notifyOrder(order: Order, action: 'new_order' | 'status_update') {
    this.orderListeners.forEach(listener => {
      try {
        listener(order, action);
      } catch (e) {
        console.error('Order listener error:', e);
      }
    });
  }

  // --- Organization & Auth ---
  getOrganization(): Organization {
    return { ...this.data.organization };
  }

  updateOrganization(patch: Partial<Organization>): Organization {
    this.data.organization = { ...this.data.organization, ...patch, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.getOrganization();
  }

  getAdminUser(): UserProfile {
    return { ...this.data.adminUser };
  }

  updateAdminUser(patch: Partial<UserProfile>): UserProfile {
    this.data.adminUser = { ...this.data.adminUser, ...patch, updated_at: new Date().toISOString() };
    this.saveToStorage();
    return this.getAdminUser();
  }

  // --- Categories ---
  getCategories(): Category[] {
    return [...this.data.categories].sort((a, b) => a.sort_order - b.sort_order);
  }

  createCategory(cat: { name: string; icon?: string; sort_order?: number }): Category {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      organization_id: this.data.organization.id,
      name: cat.name,
      icon: cat.icon || '🍽️',
      sort_order: cat.sort_order ?? (this.data.categories.length + 1),
      is_active: true,
      items_count: 0,
    };
    this.data.categories.push(newCat);
    this.saveToStorage();
    queryClient.invalidate('categories');
    return newCat;
  }

  updateCategory(id: string, patch: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...patch };
    this.saveToStorage();
    queryClient.invalidate('categories');
    return this.data.categories[idx];
  }

  deleteCategory(id: string): boolean {
    const before = this.data.categories.length;
    this.data.categories = this.data.categories.filter(c => c.id !== id);
    this.saveToStorage();
    queryClient.invalidate('categories');
    return this.data.categories.length < before;
  }

  // --- Menu ---
  getMenu(categoryId?: string): Menu[] {
    let items = [...this.data.menu];
    if (categoryId) {
      items = items.filter(m => m.category_id === categoryId);
    }
    return items.sort((a, b) => a.sort_order - b.sort_order);
  }

  createMenu(item: {
    name: string;
    description?: string;
    image_url?: string | null;
    price: number;
    cost_price?: number;
    category_id: string;
    cook_time_minutes: number;
    ingredients?: string;
    is_available?: boolean;
    sort_order?: number;
  }): Menu {
    const newMenu: Menu = {
      id: `menu-${Date.now()}`,
      organization_id: this.data.organization.id,
      category_id: item.category_id,
      name: item.name,
      description: item.description || null,
      image_url: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      price: item.price,
      cost_price: item.cost_price ?? Math.round(item.price * 0.5),
      cook_time_minutes: item.cook_time_minutes,
      ingredients: item.ingredients || null,
      is_available: item.is_available ?? true,
      sort_order: item.sort_order ?? (this.data.menu.length + 1),
    };
    this.data.menu.push(newMenu);
    this.saveToStorage();
    queryClient.invalidate('menu');
    return newMenu;
  }

  updateMenu(id: string, patch: Partial<Menu>): Menu | null {
    const idx = this.data.menu.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.data.menu[idx] = { ...this.data.menu[idx], ...patch };
    this.saveToStorage();
    queryClient.invalidate('menu');
    return this.data.menu[idx];
  }

  deleteMenu(id: string): boolean {
    const before = this.data.menu.length;
    this.data.menu = this.data.menu.filter(m => m.id !== id);
    this.saveToStorage();
    queryClient.invalidate('menu');
    return this.data.menu.length < before;
  }

  // --- Tables ---
  getTables(): Table[] {
    // Attach assigned waiter if exists
    return this.data.tables.map(tbl => {
      const waiter = tbl.assigned_waiter_id 
        ? this.data.staff.find(s => s.id === tbl.assigned_waiter_id)
        : undefined;
      return {
        ...tbl,
        assigned_waiter: waiter,
      };
    }).sort((a, b) => a.table_number - b.table_number);
  }

  createTable(tableNumber: number, waiterId?: string | null): Table {
    const newTbl: Table = {
      id: `tbl-${Date.now()}`,
      organization_id: this.data.organization.id,
      table_number: tableNumber,
      assigned_waiter_id: waiterId || null,
      waiter_name: waiterId ? this.data.staff.find(s => s.id === waiterId)?.full_name : null,
      is_active: true,
    };
    this.data.tables.push(newTbl);
    this.saveToStorage();
    queryClient.invalidate('tables');
    return newTbl;
  }

  createTablesBulk(count: number): Table[] {
    const maxNumber = this.data.tables.reduce((max, t) => Math.max(max, t.table_number), 0);
    const added: Table[] = [];
    for (let i = 1; i <= count; i++) {
      const num = maxNumber + i;
      const t: Table = {
        id: `tbl-${Date.now()}-${i}`,
        organization_id: this.data.organization.id,
        table_number: num,
        assigned_waiter_id: null,
        is_active: true,
      };
      this.data.tables.push(t);
      added.push(t);
    }
    this.saveToStorage();
    queryClient.invalidate('tables');
    return added;
  }

  updateTable(id: string, patch: Partial<Table>): Table | null {
    const idx = this.data.tables.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.tables[idx] = { ...this.data.tables[idx], ...patch };
    this.saveToStorage();
    queryClient.invalidate('tables');
    return this.data.tables[idx];
  }

  deleteTable(id: string): boolean {
    const before = this.data.tables.length;
    this.data.tables = this.data.tables.filter(t => t.id !== id);
    this.saveToStorage();
    queryClient.invalidate('tables');
    return this.data.tables.length < before;
  }

  assignWaiterToTable(tableId: string, waiterId: string | null): Table | null {
    const idx = this.data.tables.findIndex(t => t.id === tableId);
    if (idx === -1) return null;
    const waiter = waiterId ? this.data.staff.find(s => s.id === waiterId) : null;
    this.data.tables[idx] = {
      ...this.data.tables[idx],
      assigned_waiter_id: waiterId,
      waiter_name: waiter?.full_name || null,
    };
    this.saveToStorage();
    queryClient.invalidate('tables');
    return this.data.tables[idx];
  }

  // --- Staff ---
  getStaff(): UserProfile[] {
    return [...this.data.staff];
  }

  createStaff(staffData: {
    username: string;
    full_name: string;
    role: 'manager' | 'chef' | 'waiter';
    email?: string;
    pin_code?: string;
    monthly_salary?: number;
    is_active?: boolean;
  }): UserProfile {
    const newStaff: UserProfile = {
      id: `user-${Date.now()}`,
      organization_id: this.data.organization.id,
      username: staffData.username,
      full_name: staffData.full_name,
      role: staffData.role,
      email: staffData.email || `${staffData.username}@dastyor.uz`,
      pin_code: staffData.pin_code || '1111',
      monthly_salary: staffData.monthly_salary ?? 400000000,
      is_active: staffData.is_active ?? true,
      created_at: new Date().toISOString(),
    };
    this.data.staff.push(newStaff);
    this.saveToStorage();
    queryClient.invalidate('staff');
    return newStaff;
  }

  updateStaff(id: string, patch: Partial<UserProfile>): UserProfile | null {
    const idx = this.data.staff.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.staff[idx] = { ...this.data.staff[idx], ...patch, updated_at: new Date().toISOString() };
    this.saveToStorage();
    queryClient.invalidate('staff');
    return this.data.staff[idx];
  }

  deleteStaff(id: string): boolean {
    const before = this.data.staff.length;
    this.data.staff = this.data.staff.filter(s => s.id !== id);
    this.saveToStorage();
    queryClient.invalidate('staff');
    return this.data.staff.length < before;
  }

  // --- Orders ---
  getOrders(params: { status?: OrderStatus | 'all'; date?: string; tableId?: string } = {}): Order[] {
    let orders = [...this.data.orders];

    if (params.status && params.status !== 'all') {
      orders = orders.filter(o => o.status === params.status);
    }

    if (params.tableId) {
      orders = orders.filter(o => o.table_id === params.tableId);
    }

    if (params.date) {
      // params.date is YYYY-MM-DD
      orders = orders.filter(o => o.created_at.startsWith(params.date!));
    }

    return orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createOrder(payload: {
    table_id: string;
    waiter_id?: string | null;
    items: Array<{
      menu_id: string;
      quantity: number;
      modifications?: string | null;
    }>;
    customer_note?: string | null;
    status?: OrderStatus;
  }): Order {
    const tbl = this.data.tables.find(t => t.id === payload.table_id);
    const tableNumber = tbl?.table_number ?? 1;
    const waiter = payload.waiter_id 
      ? this.data.staff.find(s => s.id === payload.waiter_id)
      : (tbl?.assigned_waiter_id ? this.data.staff.find(s => s.id === tbl.assigned_waiter_id) : this.data.staff.find(s => s.role === 'waiter'));

    const now = new Date().toISOString();
    const orderId = `ord-${Date.now().toString().slice(-6)}`;

    let subtotal = 0;
    const orderItems = payload.items.map((item, idx) => {
      const menu = this.data.menu.find(m => m.id === item.menu_id);
      const price = menu?.price ?? 3000000;
      const costPrice = menu?.cost_price ?? Math.round(price * 0.5);
      const itemName = menu?.name ?? 'Taom';
      subtotal += price * item.quantity;

      return {
        id: `item-${orderId}-${idx + 1}`,
        order_id: orderId,
        menu_id: item.menu_id,
        menu_name: itemName,
        menu_price: price,
        cost_price: costPrice,
        quantity: item.quantity,
        modifications: item.modifications || null,
        item_status: 'pending',
      };
    });

    const tipPercentage = 10;
    const tipAmount = Math.round(subtotal * (tipPercentage / 100));

    const newOrder: Order = {
      id: orderId,
      organization_id: this.data.organization.id,
      table_id: payload.table_id,
      waiter_id: waiter?.id ?? null,
      status: payload.status || 'pending',
      total_amount: subtotal,
      tip_amount: tipAmount,
      tip_percentage: tipPercentage,
      customer_note: payload.customer_note || null,
      created_at: now,
      completed_at: null,
      table: {
        id: payload.table_id,
        table_number: tableNumber,
        is_active: true,
      },
      waiter: waiter ? {
        id: waiter.id,
        full_name: waiter.full_name,
        username: waiter.username,
        role: waiter.role,
        is_active: true,
      } : undefined,
      order_items: orderItems,
    };

    this.data.orders.unshift(newOrder);
    this.saveToStorage();

    queryClient.invalidate('orders');
    this.notifyOrder(newOrder, 'new_order');

    return newOrder;
  }

  updateOrderStatus(orderId: string, newStatus: OrderStatus): Order | null {
    const idx = this.data.orders.findIndex(o => o.id === orderId);
    if (idx === -1) return null;

    const order = this.data.orders[idx];
    const updated: Order = {
      ...order,
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : order.completed_at,
    };

    this.data.orders[idx] = updated;
    this.saveToStorage();

    queryClient.invalidate('orders');
    this.notifyOrder(updated, 'status_update');

    return updated;
  }

  deleteOrder(orderId: string): boolean {
    const before = this.data.orders.length;
    this.data.orders = this.data.orders.filter(o => o.id !== orderId);
    this.saveToStorage();
    queryClient.invalidate('orders');
    return this.data.orders.length < before;
  }

  // --- Expenses ---
  getExpenses(params: { date?: string; category?: string } = {}): Expense[] {
    let list = [...this.data.expenses];
    if (params.date) {
      list = list.filter(e => e.date === params.date);
    }
    if (params.category && params.category !== 'all') {
      list = list.filter(e => e.category === params.category);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createExpense(data: {
    category: Expense['category'];
    category_label: string;
    title: string;
    amount: number; // tiyin
    date?: string;
    note?: string;
  }): Expense {
    const todayStr = new Date().toISOString().split('T')[0];
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      organization_id: this.data.organization.id,
      category: data.category,
      category_label: data.category_label,
      title: data.title,
      amount: data.amount,
      date: data.date || todayStr,
      created_at: new Date().toISOString(),
      note: data.note,
      created_by: this.data.adminUser.full_name,
    };
    this.data.expenses.unshift(newExpense);
    this.saveToStorage();
    queryClient.invalidate('expenses');
    return newExpense;
  }

  deleteExpense(id: string): boolean {
    const before = this.data.expenses.length;
    this.data.expenses = this.data.expenses.filter(e => e.id !== id);
    this.saveToStorage();
    queryClient.invalidate('expenses');
    return this.data.expenses.length < before;
  }

  // Reset to original demo data
  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadFromStorage();
    queryClient.invalidate('orders');
    queryClient.invalidate('categories');
    queryClient.invalidate('menu');
    queryClient.invalidate('tables');
    queryClient.invalidate('staff');
    queryClient.invalidate('expenses');
  }
}

export const mockStore = new MockStore();
