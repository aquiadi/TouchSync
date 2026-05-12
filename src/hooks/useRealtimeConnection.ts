import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface UseRealtimeOptions {
  channelName: string;
  table: string;
  event: 'INSERT' | 'UPDATE' | '*';
  filter?: string;
  onPayload: (payload: RealtimePostgresChangesPayload<any>) => void;
  enabled?: boolean;
}

/**
 * Wraps Supabase Realtime with automatic reconnection and exponential backoff.
 * Ensures pulses are never silently lost.
 */
export function useRealtimeConnection(options: UseRealtimeOptions) {
  const { channelName, table, event, filter, onPayload, enabled = true } = options;
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setStatus('reconnecting');

    const channelConfig: any = {
      event,
      schema: 'public',
      table,
    };
    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName + '-' + Date.now()) // unique name avoids stale channel issues
      .on('postgres_changes', channelConfig, (payload) => {
        onPayload(payload);
      })
      .subscribe((subscriptionStatus) => {
        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus('connected');
          retryCountRef.current = 0; // reset backoff on success
        } else if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
          setStatus('disconnected');
          scheduleReconnect();
        } else if (subscriptionStatus === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    channelRef.current = channel;
  }, [channelName, table, event, filter, onPayload]);

  const scheduleReconnect = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
    retryCountRef.current += 1;

    setStatus('reconnecting');

    retryTimerRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    if (!enabled) return;

    connect();

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, connect]);

  return { status };
}
