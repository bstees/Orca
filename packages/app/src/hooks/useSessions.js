import { useState, useEffect } from 'react';
import { SESSION_STATUS } from '@orca/shared';

/**
 * Derives session state from Orca socket messages.
 * Handles: sessions_snapshot, session_registered, status_updated,
 *          session_deregistered, alert_notification.
 *
 * @param {{ lastMessage: Object | null }} socket
 * @returns {{ sessions: import('@orca/shared').SessionRegistration[], alerts: Object[] }}
 */
export function useSessions({ lastMessage }) {
  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!lastMessage) return;
    const { type } = lastMessage;

    if (type === 'sessions_snapshot') {
      setSessions(lastMessage.sessions ?? []);
      return;
    }

    if (type === 'session_registered') {
      const { sessionId, workspaceName, gitBranch, description, ts } = lastMessage;
      setSessions((prev) => {
        if (prev.some((s) => s.sessionId === sessionId)) return prev;
        return [
          {
            sessionId,
            workspaceName,
            gitBranch,
            description: description ?? '',
            status: SESSION_STATUS.REGISTERED,
            message: '',
            registeredAt: ts ?? Date.now(),
            updatedAt: ts ?? Date.now(),
          },
          ...prev,
        ];
      });
      return;
    }

    if (type === 'status_updated') {
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === lastMessage.sessionId
            ? { ...s, status: lastMessage.status, message: lastMessage.message ?? '', updatedAt: lastMessage.ts ?? Date.now() }
            : s
        )
      );
      return;
    }

    if (type === 'session_deregistered') {
      setSessions((prev) => prev.filter((s) => s.sessionId !== lastMessage.sessionId));
      return;
    }

    if (type === 'alert_notification') {
      setAlerts((prev) => [lastMessage, ...prev]);
    }
  }, [lastMessage]);

  return { sessions, alerts };
}

