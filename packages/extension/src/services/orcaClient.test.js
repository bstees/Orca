'use strict';

// Mock ws before requiring orcaClient
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

    /** Call in tests to simulate successful connection */
    triggerOpen() {
      this.readyState = MockWebSocket.OPEN;
      this.emit('open');
    }

    send(data) {
      MockWebSocket.__sent.push(data);
    }

    close() {
      this.readyState = MockWebSocket.CLOSED;
      this.emit('close');
    }

    /** Simulate receiving a message from the server */
    simulateMessage(data) {
      this.emit('message', Buffer.from(JSON.stringify(data)));
    }

    /** Simulate unexpected connection drop */
    simulateDisconnect() {
      this.readyState = MockWebSocket.CLOSED;
      this.emit('close');
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
const { createOrcaClient } = require('./orcaClient.js');

beforeEach(() => {
  jest.useFakeTimers();
  MockWS.reset();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('createOrcaClient', () => {
  it('connects to the extension WebSocket URL', () => {
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });
    client.connect();
    expect(MockWS.__lastInstance.url).toBe('ws://127.0.0.1:7337/ws/extension');
  });

  it('notifies status handler on connect', () => {
    const onStatus = jest.fn();
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });
    client.onStatusChange(onStatus);
    client.connect();
    MockWS.__lastInstance.triggerOpen();
    expect(onStatus).toHaveBeenCalledWith(true);
  });

  it('queues messages sent before connect() is called', () => {
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });

    // Send while ws is null — must be queued
    client.send('session_registered', { workspaceName: 'ws', gitBranch: 'main' });
    expect(MockWS.__sent).toHaveLength(0);

    client.connect();
    expect(MockWS.__sent).toHaveLength(0); // still CONNECTING

    MockWS.__lastInstance.triggerOpen(); // open → drain()
    expect(MockWS.__sent).toHaveLength(1);
    const msg = JSON.parse(MockWS.__sent[0]);
    expect(msg.type).toBe('session_registered');
    expect(msg.workspaceName).toBe('ws');
  });

  it('sends immediately when connection is open', () => {
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });
    client.connect();
    MockWS.__lastInstance.triggerOpen();

    client.send('status_updated', { sessionId: 'abc', status: 'working' });
    expect(MockWS.__sent).toHaveLength(1);
    expect(JSON.parse(MockWS.__sent[0]).type).toBe('status_updated');
  });

  it('includes ts timestamp in all sent messages', () => {
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });
    client.connect();
    MockWS.__lastInstance.triggerOpen();

    const before = Date.now();
    client.send('status_updated', { sessionId: 'abc', status: 'idle' });
    const after = Date.now();

    const msg = JSON.parse(MockWS.__sent[0]);
    expect(msg.ts).toBeGreaterThanOrEqual(before);
    expect(msg.ts).toBeLessThanOrEqual(after);
  });

  it('reconnects after unexpected disconnect with exponential backoff', () => {
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });
    client.connect();
    MockWS.__lastInstance.triggerOpen();

    MockWS.__lastInstance.simulateDisconnect();

    // Advance past the initial backoff (1000ms) — reconnect fires
    jest.advanceTimersByTime(1100);
    expect(MockWS.__instances).toHaveLength(2);
  });

  it('notifies status handler on disconnect', () => {
    const onStatus = jest.fn();
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });
    client.onStatusChange(onStatus);
    client.connect();
    MockWS.__lastInstance.triggerOpen();

    MockWS.__lastInstance.simulateDisconnect();
    expect(onStatus).toHaveBeenLastCalledWith(false);
  });

  it('calls message handler on incoming message', () => {
    const onMessage = jest.fn();
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });
    client.onMessage(onMessage);
    client.connect();
    MockWS.__lastInstance.triggerOpen();

    MockWS.__lastInstance.simulateMessage({ type: 'ping', ts: Date.now() });
    expect(onMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'ping' }));
  });

  it('disconnect() prevents reconnect after socket closes', () => {
    const client = createOrcaClient({ serverUrl: 'ws://127.0.0.1:7337' });
    client.connect();
    MockWS.__lastInstance.triggerOpen();

    // disconnect sets stopped=true, then close() fires close event synchronously
    client.disconnect();

    jest.advanceTimersByTime(5000);
    expect(MockWS.__instances).toHaveLength(1);
  });
});


