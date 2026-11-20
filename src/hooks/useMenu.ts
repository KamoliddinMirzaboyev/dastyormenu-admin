import { useMemo } from 'react';
import { Menu, Category } from '../lib/types';
import { authService } from '../lib/authService';
import { menuService } from '../lib/menuService';
import { categoryService } from '../lib/categoryService';
import { resizeImage, fileToBase64 } from '../lib/imageUploadService';
import { useQuery, useMutation } from './useQuery';
import { queryClient } from '../lib/queryClient';

// Data fetching now goes through the shared query client with Stale-While-Revalidate:
// menus and categories are cached with TTL, de-duplicated across components, and
// optimistic updates provide instant 0ms interactions.
export function useMenu() {
  const token = authService.getToken();
  const enabled = !!token;

  // StaleTime: 2 minutes for menus, 5 minutes for categories
  const menusQuery = useQuery<Menu[]>({
    key: 'menu',
    fetcher: () => menuService.getMenus(),
    enabled,
    staleTime: 2 * 60 * 1000,
  });

  const categoriesQuery = useQuery<Category[]>({
    key: 'categories',
    fetcher: () => categoryService.getCategories(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);

  // Attach the category object to each menu item (same shape as before).
  const menus = useMemo<Menu[]>(() => {
    const items = menusQuery.data ?? [];
    return items.map((menu) => ({
      ...menu,
      category: categories.find((c) => c.id === menu.category_id),
    }));
  }, [menusQuery.data, categories]);

  const refetch = () => {
    menusQuery.refetch();
    categoriesQuery.refetch();
  };

  const toggle = useMutation<{ id: string; current: boolean }, Menu>(
    ({ id, current }) => menuService.toggleAvailability(id, current),
    { invalidates: ['menu'] },
  );

  const remove = useMutation<string, void>(
    (id) => menuService.deleteMenu(id),
    { invalidates: ['menu'] },
  );

  const toggleAvailability = async (menuId: string, current: boolean): Promise<string | null> => {
    // Optimistic local update: flip state in 0ms!
    queryClient.setQueryData<Menu[]>('menu', (prev) =>
      (prev ?? []).map((m) => (m.id === menuId ? { ...m, is_available: !current } : m))
    );

    try {
      const res = await toggle.mutate({ id: menuId, current });
      if (!res.success) {
        // Rollback on server error
        queryClient.setQueryData<Menu[]>('menu', (prev) =>
          (prev ?? []).map((m) => (m.id === menuId ? { ...m, is_available: current } : m))
        );
        return res.error?.message ?? 'Xatolik yuz berdi';
      }
      return null;
    } catch (e) {
      // Rollback on network exception
      queryClient.setQueryData<Menu[]>('menu', (prev) =>
        (prev ?? []).map((m) => (m.id === menuId ? { ...m, is_available: current } : m))
      );
      return e instanceof Error ? e.message : 'Xatolik yuz berdi';
    }
  };

  const deleteMenu = async (menuId: string): Promise<string | null> => {
    const previous = queryClient.getSnapshot<Menu[]>('menu').data;
    // Optimistic deletion: item disappears immediately
    queryClient.setQueryData<Menu[]>('menu', (prev) =>
      (prev ?? []).filter((m) => m.id !== menuId)
    );

    try {
      const res = await remove.mutate(menuId);
      if (!res.success) {
        // Rollback on server error
        if (previous) queryClient.setQueryData<Menu[]>('menu', () => previous);
        return res.error?.message ?? 'Xatolik yuz berdi';
      }
      return null;
    } catch (e) {
      if (previous) queryClient.setQueryData<Menu[]>('menu', () => previous);
      return e instanceof Error ? e.message : 'Xatolik yuz berdi';
    }
  };

  // Resize + base64 for in-form preview
  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const resizedFile = await resizeImage(file, 800, 800, 0.85);
      return await fileToBase64(resizedFile);
    } catch {
      return null;
    }
  };

  return {
    menus,
    categories,
    // Only true when initial fetch is running and there is no cached data yet
    loading: (menusQuery.loading && menus.length === 0) || (categoriesQuery.loading && categories.length === 0),
    isFetching: menusQuery.isFetching || categoriesQuery.isFetching,
    error: menusQuery.error || categoriesQuery.error,
    refetch,
    toggleAvailability,
    deleteMenu,
    uploadImage,
  };
}
