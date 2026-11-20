import { useEffect, useRef } from 'react';
import { Order } from '../lib/types';
import { mockStore } from '../lib/mockStore';

interface UseRealtimeOrdersOptions {
  onInsert?: (order: Order) => void;
  onUpdate?: (order: Order) => void;
  onDelete?: (id: string) => void;
}

/**
 * Local Realtime order feed powered by mockStore event emitter.
 * Provides instant live updates across views without needing an external WebSocket server.
 */
export function useRealtimeOrders({ onInsert, onUpdate, onDelete }: UseRealtimeOrdersOptions) {
  const cbRef = useRef({ onInsert, onUpdate, onDelete });
  cbRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    const unsubscribe = mockStore.subscribeOrders((order, action) => {
      if (action === 'new_order') {
        cbRef.current.onInsert?.(order);
      } else {
        cbRef.current.onUpdate?.(order);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
