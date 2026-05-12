import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Link2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Onboarding() {
  const [code, setCode] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ──────────────────────────────────────────
  // Auto-reconnect: check for existing session
  // ──────────────────────────────────────────
  useEffect(() => {
    const checkExistingSession = async () => {
      const pairId = localStorage.getItem('touchsync_pair_id');
      const userId = localStorage.getItem('touchsync_user_id');

      if (pairId && userId) {
        try {
          const { data: pair } = await supabase
            .from('pairs')
            .select('*')
            .eq('id', pairId)
            .eq('status', 'active')
            .single();

          if (pair && pair.user_a_id && pair.user_b_id) {
            // Both users exist and pair is active — go straight to dashboard
            navigate('/dashboard');
            return;
          }

          if (pair && !pair.user_b_id) {
            // We created this pair but partner hasn't joined yet — resume waiting
            setIsWaiting(true);
            setInviteLink(`${window.location.origin}/app?code=${pair.code}`);
            listenForPartner(pair.id);
            setIsReconnecting(false);
            return;
          }
        } catch {
          // Pair doesn't exist anymore — clear stale data
          localStorage.removeItem('touchsync_pair_id');
          localStorage.removeItem('touchsync_user_id');
        }
      }

      setIsReconnecting(false);
    };

    checkExistingSession();
  }, [navigate]);

  // ──────────────────────────────────────────
  // Pre-fill code from invite link (?code=ABC123)
  // ──────────────────────────────────────────
  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl && codeFromUrl.length === 6) {
      setCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // ──────────────────────────────────────────
  // Listen for partner joining
  // ──────────────────────────────────────────
  const listenForPartner = (pairId: string) => {
    supabase
      .channel('waiting-room-' + pairId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pairs',
          filter: `id=eq.${pairId}`,
        },
        (payload) => {
          if (payload.new.user_b_id) {
            navigate('/dashboard');
          }
        }
      )
      .subscribe();
  };

  // ──────────────────────────────────────────
  // Pair / Join logic
  // ──────────────────────────────────────────
  const handlePair = async () => {
    if (code.length !== 6) return;
    setIsWaiting(true);

    try {
      // Look for any active pairs with this code
      const { data: activePairs, error: selectError } = await supabase
        .from('pairs')
        .select('*')
        .eq('code', code)
        .eq('status', 'active');

      if (selectError) {
        console.error("Select error:", selectError);
        alert("Error checking code: " + selectError.message);
        setIsWaiting(false);
        return;
      }

      // Find if there's an active pair waiting for a partner
      const waitingPair = activePairs?.find(p => !p.user_b_id);
      
      // If there are active pairs but NONE are waiting, the code is currently in use
      if (activePairs && activePairs.length > 0 && !waitingPair) {
        alert("This code is currently in use by another active connection. Please try a different code.");
        setIsWaiting(false);
        return;
      }

      if (waitingPair) {
        // ── Join existing pair ──
        const userId = 'user_b_' + Math.random().toString(36).substring(7);

        const { error: updateError } = await supabase
          .from('pairs')
          .update({
            user_b_id: userId,
            user_b_last_active: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', waitingPair.id);

        if (updateError) {
          console.error("Update error:", updateError);
          alert("Error joining pair: " + updateError.message);
          setIsWaiting(false);
          return;
        }

        localStorage.setItem('touchsync_pair_id', waitingPair.id);
        localStorage.setItem('touchsync_user_id', userId);
        navigate('/dashboard');
      } else {
        // ── Create new pair ──
        const userId = 'user_a_' + Math.random().toString(36).substring(7);

        const { data: newPair, error: insertError } = await supabase
          .from('pairs')
          .insert([{
            code,
            user_a_id: userId,
            status: 'active',
            user_a_last_active: new Date().toISOString(),
          }])
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          // With our new migration, this should only happen if another client 
          // created a waiting pair with the exact same code at the exact same millisecond
          alert("This code is already in use. Your partner may have already joined — try refreshing.");
          setIsWaiting(false);
          return;
        }

        if (newPair) {
          localStorage.setItem('touchsync_pair_id', newPair.id);
          localStorage.setItem('touchsync_user_id', userId);

          const link = `${window.location.origin}/app?code=${code}`;
          setInviteLink(link);

          listenForPartner(newPair.id);
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      alert(
        "Could not connect to the server. Please check:\n" +
        "1. Your internet connection is working\n" +
        "2. The Supabase project is not paused (check supabase.com/dashboard)\n\n" +
        "Free-tier Supabase projects auto-pause after 7 days of inactivity."
      );
      setIsWaiting(false);
    }
  };

  // ──────────────────────────────────────────
  // Disconnect / Unpair
  // ──────────────────────────────────────────
  const handleDisconnect = async () => {
    const pairId = localStorage.getItem('touchsync_pair_id');
    if (pairId) {
      await supabase
        .from('pairs')
        .update({ status: 'ended', updated_at: new Date().toISOString() })
        .eq('id', pairId);
    }
    localStorage.removeItem('touchsync_pair_id');
    localStorage.removeItem('touchsync_user_id');
    setIsWaiting(false);
    setInviteLink('');
    setCode('');
  };

  // ──────────────────────────────────────────
  // Copy invite link
  // ──────────────────────────────────────────
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      prompt("Copy this link:", inviteLink);
    }
  };

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────

  // Show loading while checking for existing session
  if (isReconnecting) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Heart size={32} className="text-primary animate-heartbeat" />
          <span className="text-text-secondary text-sm">Reconnecting...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-glow rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-sm flex flex-col items-center"
      >
        <h1 className="text-3xl font-semibold mb-3 text-center tracking-tight">
          Connect with your partner
        </h1>
        <p className="text-text-secondary text-center mb-12 text-sm leading-relaxed px-4">
          Enter a 6-digit code to create or join a connection.
        </p>

        <div className="w-full glass-panel rounded-2xl p-6 flex flex-col items-center mb-8 shadow-2xl">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-4">
            Pairing Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
            placeholder="ABC123"
            disabled={isWaiting}
            className="w-full bg-transparent text-center text-5xl tracking-[0.2em] font-medium text-white placeholder-white/10 outline-none transition-all duration-300 disabled:opacity-50"
          />
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent mt-4 opacity-50" />
        </div>

        <AnimatePresence mode="wait">
          {isWaiting ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center gap-4"
            >
              {/* Waiting state */}
              <div className="w-full py-5 rounded-2xl font-semibold text-lg bg-primary/20 text-primary flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,59,48,0.2)]">
                <span className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                Waiting for partner...
              </div>

              {/* Invite link */}
              {inviteLink && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full"
                >
                  <p className="text-text-secondary text-xs text-center mb-3">
                    Share this link with your partner:
                  </p>
                  <button
                    onClick={copyLink}
                    className={`w-full glass-panel rounded-xl p-4 flex items-center justify-between gap-3 text-left hover:border-primary/30 transition-all ${copied ? 'copy-flash' : ''}`}
                  >
                    <span className="text-sm text-white/70 truncate flex-1 font-mono">
                      {inviteLink}
                    </span>
                    {copied ? (
                      <Check size={18} className="text-primary shrink-0" />
                    ) : (
                      <Link2 size={18} className="text-text-secondary shrink-0" />
                    )}
                  </button>
                  {copied && (
                    <p className="text-primary text-xs text-center mt-2">Copied!</p>
                  )}
                </motion.div>
              )}

              {/* Cancel button */}
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 text-text-secondary text-sm hover:text-white transition-colors mt-2"
              >
                <X size={14} />
                Cancel
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="pair"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={handlePair}
              disabled={code.length !== 6}
              className={`w-full py-5 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                code.length === 6
                  ? 'bg-primary text-white shadow-[0_0_40px_rgba(255,59,48,0.4)]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              Pair Devices
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
