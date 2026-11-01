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
      const { sessionId, workspaceName, gitBranch, description, session, ts } = lastMessage;
      // New format sends full session object; fall back to flat fields
      const s = session ?? { sessionId, workspaceName, gitBranch, description };
      setSessions((prev) => {
        if (prev.some((s) => s.sessionId === (session?.sessionId ?? sessionId))) return prev;
        return [
          {
            sessionId: s.sessionId,
            workspaceName: s.workspaceName,
            gitBranch: s.gitBranch,
            description: s.description ?? '',
            status: SESSION_STATUS.REGISTERED,
            message: '',
            options: s.options ?? [],
            approvalMode: s.approvalMode ?? null,
            registeredAt: s.registeredAt ?? ts ?? Date.now(),
            updatedAt: s.updatedAt ?? ts ?? Date.now(),
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
            ? { ...s, status: lastMessage.status, message: lastMessage.message ?? '', options: lastMessage.options ?? s.options ?? [], updatedAt: lastMessage.ts ?? Date.now() }
            : s
        )
      );
      return;
    }

    if (type === 'session_deregistered' || type === 'session_removed') {
      setSessions((prev) => prev.filter((s) => s.sessionId !== lastMessage.sessionId));
      return;
    }

    if (type === 'alert_notification') {
      setAlerts((prev) => [lastMessage, ...prev]);
      return;
    }

    if (type === 'approval_mode_changed') {
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === lastMessage.sessionId
            ? { ...s, approvalMode: lastMessage.approvalMode }
            : s
        )
      );
      return;
    }

    if (type === 'alert_response') {
      setSessions((prev) =>
        prev.map((s) =>
          s.sessionId === lastMessage.sessionId
            ? {
                ...s,
                status: 'working',
                message: `Response: ${lastMessage.option}`,
                updatedAt: lastMessage.ts ?? Date.now(),
              }
            : s
        )
      );
      return;
    }
  }, [lastMessage]);

  return { sessions, alerts };
}

