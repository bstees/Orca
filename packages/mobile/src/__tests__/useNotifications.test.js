import { renderHook, act } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '../hooks/useNotifications.js';

// jest-expo auto-mocks expo-notifications — make sure key functions are spies
beforeEach(() => {
  jest.clearAllMocks();
  // Ensure mocked functions exist (jest-expo stubs them as jest.fn())
  if (!jest.isMockFunction(Notifications.requestPermissionsAsync)) {
    jest.spyOn(Notifications, 'requestPermissionsAsync').mockResolvedValue({ status: 'granted' });
  } else {
    Notifications.requestPermissionsAsync.mockResolvedValue({ status: 'granted' });
  }
  if (!jest.isMockFunction(Notifications.getPermissionsAsync)) {
    jest.spyOn(Notifications, 'getPermissionsAsync').mockResolvedValue({ status: 'granted' });
  } else {
    Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
  }
  if (!jest.isMockFunction(Notifications.scheduleNotificationAsync)) {
    jest.spyOn(Notifications, 'scheduleNotificationAsync').mockResolvedValue('notif-id-1');
  } else {
    Notifications.scheduleNotificationAsync.mockResolvedValue('notif-id-1');
  }
  if (!jest.isMockFunction(Notifications.cancelScheduledNotificationAsync)) {
    jest.spyOn(Notifications, 'cancelScheduledNotificationAsync').mockResolvedValue();
  } else {
    Notifications.cancelScheduledNotificationAsync.mockResolvedValue();
  }
});

describe('useNotifications', () => {
  it('requests permission on mount', () => {
    renderHook(() => useNotifications({ lastMessage: null }));
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('schedules a notification when status_updated with needs_input', async () => {
    const { rerender } = renderHook(({ msg }) => useNotifications({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    await act(async () => {
      rerender({
        msg: {
          type: 'status_updated',
          sessionId: 'sess-001',
          status: 'needs_input',
          message: 'Which approach?',
        },
      });
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Orca needs your input',
          body: 'Which approach?',
          data: { sessionId: 'sess-001' },
        }),
        trigger: null,
      })
    );
  });

  it('cancels notification when session moves away from needs_input to a non-notifiable status', async () => {
    Notifications.scheduleNotificationAsync.mockResolvedValue('notif-abc');
    const { rerender } = renderHook(({ msg }) => useNotifications({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    await act(async () => {
      rerender({
        msg: {
          type: 'status_updated',
          sessionId: 'sess-001',
          status: 'needs_input',
          message: 'Question?',
        },
      });
    });

    await act(async () => {
      rerender({
        msg: {
          type: 'status_updated',
          sessionId: 'sess-001',
          status: 'responded',
          message: 'Response: Yes',
        },
      });
    });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-abc');
  });

  it('schedules a notification when status_updated with idle', async () => {
    const { rerender } = renderHook(({ msg }) => useNotifications({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    await act(async () => {
      rerender({
        msg: {
          type: 'status_updated',
          sessionId: 'sess-004',
          status: 'idle',
          message: 'Ready for next task',
        },
      });
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Orca is ready',
          body: 'Ready for next task',
          data: { sessionId: 'sess-004' },
        }),
        trigger: null,
      })
    );
  });

  it('cancels notification when session is removed', async () => {
    Notifications.scheduleNotificationAsync.mockResolvedValue('notif-xyz');
    const { rerender } = renderHook(({ msg }) => useNotifications({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    await act(async () => {
      rerender({
        msg: {
          type: 'status_updated',
          sessionId: 'sess-002',
          status: 'needs_input',
          message: 'Pick one',
        },
      });
    });

    await act(async () => {
      rerender({ msg: { type: 'session_removed', sessionId: 'sess-002' } });
    });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notif-xyz');
  });

  it('does not schedule for working/responded/done status updates', async () => {
    const { rerender } = renderHook(({ msg }) => useNotifications({ lastMessage: msg }), {
      initialProps: { msg: null },
    });

    for (const status of ['working', 'responded', 'done', 'registered']) {
      await act(async () => {
        rerender({
          msg: { type: 'status_updated', sessionId: 'sess-003', status, message: 'some message' },
        });
      });
    }

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
