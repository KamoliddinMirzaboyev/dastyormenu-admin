import { useEffect, useRef } from 'react';
import { Order } from '../lib/types';
import { managerApi } from '../lib/managerClient';
import { authService } from '../lib/authService';

interface UseRealtimeOrdersOptions {
  onInsert?: (order: Order) => void;
  onUpdate?: (order: Order) => void;
  onDelete?: (id: string) => void;
}

/**
 * Realtime order feed:
 * Connects to real Server-Sent Events (SSE) /api/staff/notifications/stream/
 * with automatic reconnect and cleanup.
 */
export function useRealtimeOrders({ onInsert, onUpdate, onDelete }: UseRealtimeOrdersOptions) {
  const cbRef = useRef({ onInsert, onUpdate, onDelete });
  cbRef.current = { onInsert, onUpdate, onDelete };

  useEffect(() => {
    const token = managerApi.getToken();
    if (!token) return;

    const abortController = new AbortController();
    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectSSE = async () => {
      if (!isMounted) return;

      const stored = authService.getStoredAuth();
      const orgId = stored?.organization?.id;
      const streamUrl = `https://dastroymenu.abboskhoja.uz/api/staff/notifications/stream/${orgId ? `?organization=${orgId}` : ''}`;

      try {
        const response = await fetch(streamUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`SSE HTTP Error ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (isMounted) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const dataMatch = line.match(/^data:\s*(.+)$/m);
            if (dataMatch) {
              try {
                const parsed = JSON.parse(dataMatch[1]);
                if (parsed.type === 'order' || parsed.order_id || parsed.status) {
                  cbRef.current.onUpdate?.(parsed as Order);
                }
              } catch {
                // Ignore ping / heartbeat / non-json events
              }
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          reconnectTimeout = setTimeout(connectSSE, 5000);
        }
      }
    };

    connectSSE();

    return () => {
      isMounted = false;
      abortController.abort();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);
}
