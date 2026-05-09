// src/hooks/useProgressionTracker.ts
import { useEffect, useRef, useCallback } from 'react';
import api from '../api/config';

export type EventType =
  | 'scroll_50%'
  | 'scroll_100%'
  | 'click_ressource'
  | 'download'
  | 'video_play'
  | 'video_end';

interface TrackerReturn {
  logEvent: (type: EventType, valeur?: string) => Promise<void>;
}

export function useProgressionTracker(
  coursId: number | undefined,
  etudiantId: number | undefined
): TrackerReturn {
  // IDs stockés en ref pour éviter les re-renders
  const sessionIdRef   = useRef<number | null>(null);
  const heartbeatRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollHandled  = useRef<Set<string>>(new Set()); // évite les doublons scroll
  const isMounted      = useRef(true);

  // ── Démarrer une session ───────────────────────────────────────────────────
  const startSession = useCallback(async () => {
    if (!coursId || !etudiantId) return;
    try {
      const { data } = await api.post<{ session_id: number }>('/progression/session/start', {
        cours_id:    coursId,
        etudiant_id: etudiantId,
      });
      if (isMounted.current) sessionIdRef.current = data.session_id;
    } catch (err) {
      console.warn('[Tracker] Impossible de démarrer la session', err);
    }
  }, [coursId, etudiantId]);

  // ── Envoyer un heartbeat toutes les 30s ───────────────────────────────────
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      await api.post('/progression/session/heartbeat', {
        session_id: sessionIdRef.current,
      });
    } catch {
      // silencieux — l'étudiant peut être hors ligne temporairement
    }
  }, []);

  // ── Terminer la session ────────────────────────────────────────────────────
  const endSession = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      await api.post('/progression/session/end', {
        session_id: sessionIdRef.current,
      });
    } catch {
      // silencieux
    } finally {
      sessionIdRef.current = null;
    }
  }, []);

  // ── Logger un événement pédagogique ───────────────────────────────────────
  const logEvent = useCallback(async (type: EventType, valeur?: string): Promise<void> => {
    if (!sessionIdRef.current || !coursId || !etudiantId) return;

    // Éviter les doublons pour le même type dans la même session
    const key = `${sessionIdRef.current}-${type}`;
    if (scrollHandled.current.has(key)) return;
    scrollHandled.current.add(key);

    try {
      await api.post('/progression/event', {
        session_id:  sessionIdRef.current,
        etudiant_id: etudiantId,
        cours_id:    coursId,
        type,
        valeur:      valeur || null,
      });
    } catch (err) {
      console.warn('[Tracker] Événement non enregistré', type, err);
      // Retirer du Set pour réessayer
      scrollHandled.current.delete(key);
    }
  }, [coursId, etudiantId]);

  // ── Détection du scroll ────────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const pct = ((scrollTop + clientHeight) / scrollHeight) * 100;

    if (pct >= 50)  logEvent('scroll_50%');
    if (pct >= 98)  logEvent('scroll_100%');
  }, [logEvent]);

  // ── Cycle de vie principal ─────────────────────────────────────────────────
  useEffect(() => {
    if (!coursId || !etudiantId) return;

    isMounted.current = true;
    scrollHandled.current.clear();

    // 1. Ouvrir la session
    startSession().then(() => {
      if (!isMounted.current) return;
      // 2. Heartbeat toutes les 30s (le serveur ajoute 30s, pas le client)
      heartbeatRef.current = setInterval(sendHeartbeat, 30_000);
    });

    // 3. Écouter le scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    // 4. Cleanup au démontage du composant
    return () => {
      isMounted.current = false;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener('scroll', handleScroll);
      endSession();
    };
  }, [coursId, etudiantId, startSession, sendHeartbeat, endSession, handleScroll]);

  return { logEvent };
}