import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

// Show banners even when the app is foregrounded — the user may be glancing at
// another app while Orca is open in the background tab.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permission on first mount and schedules a local
 * notification whenever a session transitions to `needs_input`.
 *
 * Cancels the notification for a session when it leaves `needs_input`.
 *
 * @param {{ lastMessage: Object | null }} socket
 */
export function useNotifications({ lastMessage, send }) {
  // Map from sessionId → notificationId for active alerts
  const notifIds = useRef(new Map());

  // Request permission on mount — separate from push token to avoid swallowed errors
  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
  }, []);

  // Register Expo push token once permissions are granted (best-effort, background only)
  useEffect(() => {
    let cancelled = false;
    Notifications.getPermissionsAsync().then(({ status }) => {
      if (cancelled || status !== 'granted' || !send) return;
      // projectId is required for background push — only attempt if eas.projectId is configured
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const appJson = require('../../app.json');
        const projectId = appJson?.expo?.extra?.eas?.projectId;
        if (!projectId) return;
        Notifications.getExpoPushTokenAsync({ projectId }).then((tokenData) => {
          if (!cancelled && tokenData?.data) {
            send({ type: 'push_token', token: tokenData.data });
          }
        }).catch(() => {});
      } catch {
        // app.json not resolvable — skip push token
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [send]);

  useEffect(() => {
    if (!lastMessage) return;
    const { type, sessionId, status, message } = lastMessage;

    if (type === 'status_updated' && sessionId) {
      // Cancel any existing notification for this session first
      const existing = notifIds.current.get(sessionId);
      if (existing) {
        Notifications.cancelScheduledNotificationAsync(existing).catch(() => {});
        notifIds.current.delete(sessionId);
      }

      if (status === 'needs_input') {
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Orca needs your input',
            body: message || 'A session is waiting for your response.',
            data: { sessionId },
          },
          trigger: null,
        })
          .then((notifId) => { notifIds.current.set(sessionId, notifId); })
          .catch(() => {});
      } else if (status === 'idle') {
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Orca is ready',
            body: message || 'Your session is ready for the next task.',
            data: { sessionId },
          },
          trigger: null,
        })
          .then((notifId) => { notifIds.current.set(sessionId, notifId); })
          .catch(() => {});
      }
    }

    if (type === 'session_removed' && sessionId) {
      const notifId = notifIds.current.get(sessionId);
      if (notifId) {
        Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
        notifIds.current.delete(sessionId);
      }
    }
  }, [lastMessage]);
}
