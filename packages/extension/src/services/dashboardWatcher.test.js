'use strict';

jest.mock('ws', () => {
  const EventEmitter = require('node:events');
  class MockWebSocket extends EventEmitter {
    static OPEN = 1;
    static CONNECTING = 0;
    static CLOSING = 2;
    static CLOSED = 3;

    constructor(url) {
      super();
      this.url = url;
      this.readyState = MockWebSocket.CONNECTING;
      MockWebSocket.__lastInstance = this;
      MockWebSocket.__instances.push(this);
    }

    send(data) {
      MockWebSocket.__sent.push(data);
    }

    close() {
      this.readyState = MockWebSocket.CLOSED;
      this.emit('close');
    }

    simulateMessage(data) {
      this.emit('message', Buffer.from(JSON.stringify(data)));
    }
  }

  MockWebSocket.__lastInstance = null;
  MockWebSocket.__instances = [];
  MockWebSocket.__sent = [];
  MockWebSocket.reset = () => {
    MockWebSocket.__lastInstance = null;
    MockWebSocket.__instances = [];
    MockWebSocket.__sent = [];
  };

  return { WebSocket: MockWebSocket };
});

const { WebSocket: MockWS } = require('ws');
const { createDashboardWatcher } = require('./dashboardWatcher.js');

beforeEach(() => {
  jest.useFakeTimers();
  MockWS.reset();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('createDashboardWatcher', () => {
  it('connects to /ws/dashboard', () => {
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'abc',
      onNeedsInput: jest.fn(),
    });
    watcher.start();
    expect(MockWS.__lastInstance.url).toBe('ws://127.0.0.1:7337/ws/dashboard');
  });

  it('calls onNeedsInput when status_updated needs_input matches own sessionId', () => {
    const onNeedsInput = jest.fn();
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'abc',
      onNeedsInput,
    });
    watcher.start();

    MockWS.__lastInstance.simulateMessage({
      type: 'status_updated',
      sessionId: 'abc',
      status: 'needs_input',
      message: 'Continue?',
      options: ['Yes', 'No'],
    });

    expect(onNeedsInput).toHaveBeenCalledWith('Continue?', ['Yes', 'No']);
  });

  it('does not call onNeedsInput for a different sessionId', () => {
    const onNeedsInput = jest.fn();
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'abc',
      onNeedsInput,
    });
    watcher.start();

    MockWS.__lastInstance.simulateMessage({
      type: 'status_updated',
      sessionId: 'other-session',
      status: 'needs_input',
      message: 'Question?',
      options: [],
    });

    expect(onNeedsInput).not.toHaveBeenCalled();
  });

  it('does not call onNeedsInput when status is not needs_input or working with 📱', () => {
    const onNeedsInput = jest.fn();
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'abc',
      onNeedsInput,
    });
    watcher.start();

    MockWS.__lastInstance.simulateMessage({
      type: 'status_updated',
      sessionId: 'abc',
      status: 'working',
      message: 'Thinking...',
      options: [],
    });

    expect(onNeedsInput).not.toHaveBeenCalled();
  });

  it('does not call onNeedsInput when sessionId is not yet set', () => {
    const onNeedsInput = jest.fn();
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => null,
      onNeedsInput,
    });
    watcher.start();

    MockWS.__lastInstance.simulateMessage({
      type: 'status_updated',
      sessionId: 'abc',
      status: 'needs_input',
      message: 'Hello?',
      options: [],
    });

    expect(onNeedsInput).not.toHaveBeenCalled();
  });

  it('defaults message to empty string when absent', () => {
    const onNeedsInput = jest.fn();
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'abc',
      onNeedsInput,
    });
    watcher.start();

    MockWS.__lastInstance.simulateMessage({
      type: 'status_updated',
      sessionId: 'abc',
      status: 'needs_input',
      options: ['OK'],
    });

    expect(onNeedsInput).toHaveBeenCalledWith('', ['OK']);
  });

  it('reconnects after disconnect', () => {
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'abc',
      onNeedsInput: jest.fn(),
    });
    watcher.start();
    MockWS.__lastInstance.close();
    jest.advanceTimersByTime(5100);
    expect(MockWS.__instances).toHaveLength(2);
  });

  it('stop() prevents reconnect', () => {
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'abc',
      onNeedsInput: jest.fn(),
    });
    watcher.start();
    watcher.stop();
    jest.advanceTimersByTime(10_000);
    expect(MockWS.__instances).toHaveLength(1);
  });

  it('does NOT call onMobilePrompt for 📱 messages on other sessions', () => {
    const onNeedsInput = jest.fn();
    const onMobilePrompt = jest.fn();
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'my-session',
      onNeedsInput,
      onMobilePrompt,
    });
    watcher.start();

    MockWS.__lastInstance.simulateMessage({
      type: 'status_updated',
      sessionId: 'some-other-session',
      status: 'working',
      message: '📱 Fix the login bug',
      options: [],
    });

    expect(onMobilePrompt).not.toHaveBeenCalled();
    expect(onNeedsInput).not.toHaveBeenCalled();
  });

  it('does not call onNeedsInput for 📱 working messages on own session', () => {
    const onNeedsInput = jest.fn();
    const onMobilePrompt = jest.fn();
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'my-session',
      onNeedsInput,
      onMobilePrompt,
    });
    watcher.start();

    MockWS.__lastInstance.simulateMessage({
      type: 'status_updated',
      sessionId: 'my-session',
      status: 'working',
      message: '📱 Do something',
      options: [],
    });

    expect(onMobilePrompt).toHaveBeenCalledWith('Do something');
    expect(onNeedsInput).not.toHaveBeenCalled();
  });

  it('works without onMobilePrompt (no crash on 📱 working message)', () => {
    const onNeedsInput = jest.fn();
    const watcher = createDashboardWatcher({
      serverUrl: 'http://127.0.0.1:7337',
      getSessionId: () => 'my-session',
      onNeedsInput,
    });
    watcher.start();

    expect(() => {
      MockWS.__lastInstance.simulateMessage({
        type: 'status_updated',
        sessionId: 'other',
        status: 'working',
        message: '📱 Do something',
        options: [],
      });
    }).not.toThrow();
  });
});
