import { describe, it, expect } from 'vitest';
import { menuSchema, staffSchema, staffUpdateSchema, staffPasswordSchema, MENU_LIMITS } from './validators';

describe('menuSchema', () => {
  const valid = {
    name: 'Plov',
    category_id: 'cat-1',
    price_som: 25000,
    cook_time_minutes: 20,
    is_available: true,
  };

  it('accepts a well-formed menu item', () => {
    expect(menuSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty name', () => {
    const res = menuSchema.safeParse({ ...valid, name: '' });
    expect(res.success).toBe(false);
  });

  it('rejects a name over the max length', () => {
    const res = menuSchema.safeParse({ ...valid, name: 'a'.repeat(MENU_LIMITS.nameMax + 1) });
    expect(res.success).toBe(false);
  });

  it('rejects a price below the minimum', () => {
    const res = menuSchema.safeParse({ ...valid, price_som: MENU_LIMITS.priceMin - 1 });
    expect(res.success).toBe(false);
  });

  it('requires a category', () => {
    const res = menuSchema.safeParse({ ...valid, category_id: '' });
    expect(res.success).toBe(false);
  });

  it('defaults cook time when omitted', () => {
    const { name, category_id, price_som, is_available } = valid;
    const res = menuSchema.safeParse({ name, category_id, price_som, is_available });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.cook_time_minutes).toBe(MENU_LIMITS.cookDefault);
  });
});

describe('staffSchema', () => {
  const valid = { full_name: 'Ali Valiyev', role: 'chef' as const, username: 'ali_07', password: 'secret12' };

  it('accepts well-formed staff', () => {
    expect(staffSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an uppercase / non-slug username', () => {
    expect(staffSchema.safeParse({ ...valid, username: 'Ali Valiyev' }).success).toBe(false);
  });

  it('rejects a short password', () => {
    expect(staffSchema.safeParse({ ...valid, password: '123' }).success).toBe(false);
  });

  it('rejects a role outside the allowed set', () => {
    expect(staffSchema.safeParse({ ...valid, role: 'manager' }).success).toBe(false);
  });
});

describe('staffUpdateSchema', () => {
  const valid = { full_name: 'Ali Valiyev', role: 'waiter' as const, username: 'ali_07', password: '' };

  it('allows omitting password when editing', () => {
    expect(staffUpdateSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short password if provided', () => {
    expect(staffUpdateSchema.safeParse({ ...valid, password: '123' }).success).toBe(false);
  });

  it('rejects invalid pin_code format', () => {
    expect(staffUpdateSchema.safeParse({ ...valid, pin_code: 'abc' }).success).toBe(false);
  });
});

describe('staffPasswordSchema', () => {
  it('requires at least password or pin_code', () => {
    expect(staffPasswordSchema.safeParse({ password: '', pin_code: '' }).success).toBe(false);
  });

  it('accepts valid password alone', () => {
    expect(staffPasswordSchema.safeParse({ password: 'newpass1', pin_code: '' }).success).toBe(true);
  });

  it('accepts valid 6-digit pin_code alone', () => {
    expect(staffPasswordSchema.safeParse({ password: '', pin_code: '123456' }).success).toBe(true);
  });
});
