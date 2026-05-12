import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type PartnerStatus = 'online' | 'away' | 'offline' | 'unknown';

interface UsePresenceOptions {
  pairId: string | null;
  userId: string | null;
  enabled?: boolean;
}

/**
 * Tracks partner presence via periodic heartbeats.
 * 
 * Pings own `last_active` every 15s.
 * Subscribes to pair row changes to detect partner activity.
 * Derives: online (<30s), away (<5min), offline (>5min).
 */
export function usePresence({ pairId, userId, enabled = true }: UsePresenceOptions) {
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus>('unknown');
  const [partnerLastActive, setPartnerLastActive] = useState<Date | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine which user field we are (a or b) and which is the partner
  const isUserA = userId?.startsWith('user_a_');
  const myField = isUserA ? 'user_a_last_active' : 'user_b_last_active';
  const partnerField = isUserA ? 'user_b_last_active' : 'user_a_last_active';

  // Send our heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!pairId || !enabled) return;

    await supabase
      .from('pairs')
      .update({ [myField]: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', pairId);
  }, [pairId, myField, enabled]);

  // Derive status from timestamp
  const deriveStatus = useCallback((lastActive: string | null): PartnerStatus => {
    if (!lastActive) return 'unknown';

    const diff = Date.now() - new Date(lastActive).getTime();
    if (diff < 30_000) return 'online';     // < 30 seconds
    if (diff < 300_000) return 'away';       // < 5 minutes
    return 'offline';
  }, []);

  useEffect(() => {
    if (!pairId || !userId || !enabled) return;

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Heartbeat every 15 seconds
    heartbeatRef.current = setInterval(sendHeartbeat, 15_000);

    // Check partner status every 10 seconds (from our local cached timestamp)
    statusCheckRef.current = setInterval(() => {
      if (partnerLastActive) {
        setPartnerStatus(deriveStatus(partnerLastActive.toISOString()));
      }
    }, 10_000);

    // Subscribe to pair updates to get partner's heartbeat in real-time
    const channel = supabase
      .channel('presence-' + pairId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pairs',
          filter: `id=eq.${pairId}`,
        },
        (payload) => {
          const partnerTime = payload.new[partnerField];
          if (partnerTime) {
            const d = new Date(partnerTime);
            setPartnerLastActive(d);
            setPartnerStatus(deriveStatus(partnerTime));
          }
        }
      )
      .subscribe();

    // Also fetch initial state
    (async () => {
      const { data } = await supabase
        .from('pairs')
        .select('user_a_last_active, user_b_last_active')
        .eq('id', pairId)
        .single();

      if (data) {
        const partnerTime = (data as any)[partnerField];
        if (partnerTime) {
          const d = new Date(partnerTime);
          setPartnerLastActive(d);
          setPartnerStatus(deriveStatus(partnerTime));
        }
      }
    })();

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (statusCheckRef.current) clearInterval(statusCheckRef.current);
      supabase.removeChannel(channel);
    };
  }, [pairId, userId, enabled, sendHeartbeat, deriveStatus, partnerField]);

  return { partnerStatus, partnerLastActive };
}
