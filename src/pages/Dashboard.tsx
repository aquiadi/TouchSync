import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Wifi, WifiOff, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePresence } from '../hooks/usePresence';
import { useRealtimeConnection } from '../hooks/useRealtimeConnection';

export default function Dashboard() {
  const navigate = useNavigate();

  // Session
  const [pairId, setPairId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Pulse state
  const [isSending, setIsSending] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveKey, setReceiveKey] = useState(0); // triggers re-render for animations

  // Cooldown
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownDuration, setCooldownDuration] = useState(3);
  const rapidTapCountRef = useRef(0);
  const rapidTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session
  useEffect(() => {
    const pid = localStorage.getItem('touchsync_pair_id');
    const uid = localStorage.getItem('touchsync_user_id');
    if (!pid || !uid) {
      navigate('/app');
      return;
    }
    setPairId(pid);
    setUserId(uid);
  }, [navigate]);

  // Presence
  const { partnerStatus } = usePresence({
    pairId,
    userId,
    enabled: !!pairId && !!userId,
  });

  // Haptic patterns
  const triggerSendHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50]); // Crisp single tap
    }
  };

  const triggerReceiveHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]); // Double heartbeat
    }
  };

  // Handle receiving a pulse
  const handleReceivePulse = useCallback((payload: any) => {
    if (payload.new.sender_id !== userId) {
      setIsReceiving(true);
      setReceiveKey((k) => k + 1);
      triggerReceiveHaptic();
      setTimeout(() => setIsReceiving(false), 2500);
    }
  }, [userId]);

  // Realtime connection with auto-reconnect
  const { status: connectionStatus } = useRealtimeConnection({
    channelName: 'pulses',
    table: 'pulses',
    event: 'INSERT',
    filter: pairId ? `pair_id=eq.${pairId}` : undefined,
    onPayload: handleReceivePulse,
    enabled: !!pairId,
  });

  // ──────────────────────────────────────────
  // Send pulse with cooldown + anti-spam
  // ──────────────────────────────────────────
  const handlePulse = async () => {
    if (cooldownActive || isSending || !pairId || !userId) return;

    // Track rapid taps
    rapidTapCountRef.current += 1;
    if (rapidTapTimerRef.current) clearTimeout(rapidTapTimerRef.current);
    rapidTapTimerRef.current = setTimeout(() => {
      rapidTapCountRef.current = 0;
    }, 10_000);

    // Anti-spam: extend cooldown if tapping too fast
    const nextCooldown = rapidTapCountRef.current >= 5 ? 8 : 3;
    setCooldownDuration(nextCooldown);

    // Fire
    setIsSending(true);
    triggerSendHaptic();

    await supabase.from('pulses').insert([
      { pair_id: pairId, sender_id: userId, type: 'heartbeat' },
    ]);

    // Animation duration
    setTimeout(() => setIsSending(false), 1500);

    // Cooldown
    setCooldownActive(true);
    setTimeout(() => setCooldownActive(false), nextCooldown * 1000);
  };

  // ──────────────────────────────────────────
  // Disconnect
  // ──────────────────────────────────────────
  const handleDisconnect = async () => {
    if (pairId) {
      await supabase
        .from('pairs')
        .update({ status: 'ended', updated_at: new Date().toISOString() })
        .eq('id', pairId);
    }
    localStorage.removeItem('touchsync_pair_id');
    localStorage.removeItem('touchsync_user_id');
    navigate('/app');
  };

  // ──────────────────────────────────────────
  // Presence indicator config
  // ──────────────────────────────────────────
  const presenceConfig = {
    online: {
      color: 'bg-green-500',
      className: 'presence-online',
      label: 'Connected',
    },
    away: {
      color: 'bg-amber-400',
      className: 'presence-away',
      label: 'Away',
    },
    offline: {
      color: 'bg-white/20',
      className: 'presence-offline',
      label: 'Offline',
    },
    unknown: {
      color: 'bg-white/10',
      className: 'presence-offline',
      label: 'Waiting...',
    },
  };

  const presence = presenceConfig[partnerStatus];

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 pb-[env(safe-area-inset-bottom,24px)] relative overflow-hidden">
      {/* ── Background flash on receive ── */}
      <AnimatePresence>
        {isReceiving && (
          <motion.div
            key={receiveKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.5 } }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at center, rgba(255, 59, 48, 0.15) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="w-full flex justify-between items-center z-10 pt-[env(safe-area-inset-top,16px)]">
        <div className="flex items-center gap-3">
          {/* Presence dot */}
          <span className="relative flex h-3 w-3">
            <span className={`absolute inline-flex h-full w-full rounded-full ${presence.color} ${presence.className}`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${presence.color}`} />
          </span>
          <span className="text-xs text-text-secondary uppercase tracking-wider font-medium">
            {presence.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          {connectionStatus === 'reconnecting' && (
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <WifiOff size={14} className="text-amber-400" />
            </motion.div>
          )}
          {connectionStatus === 'connected' && (
            <Wifi size={14} className="text-text-secondary/30" />
          )}

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className="text-text-secondary hover:text-white transition-colors p-1"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Main Pulse Button ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center w-full">

        {/* Sender ripples: expand outward */}
        <AnimatePresence>
          {isSending && (
            <>
              <div className="absolute w-64 h-64 rounded-full border border-primary/50 ripple-ring-1" />
              <div className="absolute w-64 h-64 rounded-full border border-primary/30 ripple-ring-2" />
              <div className="absolute w-64 h-64 rounded-full border border-primary/20 ripple-ring-3" />
            </>
          )}
        </AnimatePresence>

        {/* Receiver ripples: converge inward */}
        <AnimatePresence>
          {isReceiving && (
            <>
              <div key={`r1-${receiveKey}`} className="absolute w-64 h-64 rounded-full border border-primary/50 ripple-receive-1" />
              <div key={`r2-${receiveKey}`} className="absolute w-64 h-64 rounded-full border border-primary/30 ripple-receive-2" />
              <div key={`r3-${receiveKey}`} className="absolute w-64 h-64 rounded-full border border-primary/20 ripple-receive-3" />
            </>
          )}
        </AnimatePresence>

        {/* Ambient glow when receiving */}
        <AnimatePresence>
          {isReceiving && (
            <motion.div
              key={`glow-${receiveKey}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.4 }}
              exit={{ opacity: 0, transition: { duration: 1.5 } }}
              className="absolute w-64 h-64 rounded-full bg-primary/20 blur-2xl"
            />
          )}
        </AnimatePresence>

        {/* Cooldown recharge ring (SVG circle) */}
        {cooldownActive && (
          <svg
            className="absolute w-[280px] h-[280px] pointer-events-none"
            viewBox="0 0 280 280"
          >
            <circle
              className="cooldown-ring"
              style={{ '--cooldown-duration': `${cooldownDuration}s` } as React.CSSProperties}
              cx="140"
              cy="140"
              r="128"
              fill="none"
              stroke="rgba(255, 59, 48, 0.2)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* The button */}
        <motion.button
          whileTap={!cooldownActive ? { scale: 0.92 } : {}}
          animate={isSending ? { scale: [1, 0.92, 1.02, 1] } : {}}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={handlePulse}
          disabled={cooldownActive}
          className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 ${
            isReceiving
              ? 'bg-primary shadow-[0_0_100px_rgba(255,59,48,0.6)]'
              : cooldownActive
              ? 'glass-panel opacity-60 cursor-default'
              : 'glass-panel hover:border-primary/30 active:border-primary/50'
          }`}
        >
          <Heart
            size={64}
            className={`transition-all duration-500 ${
              isReceiving
                ? 'text-white fill-white animate-heartbeat'
                : isSending
                ? 'text-primary fill-primary scale-110'
                : 'text-primary'
            }`}
            strokeWidth={1.5}
          />
          <span
            className={`font-medium tracking-widest uppercase text-xs ${
              isReceiving ? 'text-white' : cooldownActive ? 'text-text-secondary/50' : 'text-text-secondary'
            }`}
          >
            {isReceiving
              ? 'Feeling you...'
              : cooldownActive
              ? rapidTapCountRef.current >= 5
                ? 'Take a breath...'
                : '...'
              : 'Tap to vibe'}
          </span>
        </motion.button>
      </div>

      {/* ── Bottom spacer for safe area ── */}
      <div className="h-4" />
    </div>
  );
}
