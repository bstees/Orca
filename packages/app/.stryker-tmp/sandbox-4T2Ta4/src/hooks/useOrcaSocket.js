// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { useState, useEffect, useCallback, useRef } from 'react';
const RECONNECT_DELAY_MS = 3000;

/**
 * Connects to the Orca dashboard WebSocket endpoint.
 * Reconnects automatically on disconnect.
 *
 * @param {string} url - WebSocket URL (ws://... or wss://...)
 * @returns {{ connected: boolean, lastMessage: Object | null, send: (data: Object) => void }}
 */
export function useOrcaSocket(url) {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    const [connected, setConnected] = useState(stryMutAct_9fa48("1") ? true : (stryCov_9fa48("1"), false));
    const [lastMessage, setLastMessage] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const connect = useCallback(() => {
      if (stryMutAct_9fa48("2")) {
        {}
      } else {
        stryCov_9fa48("2");
        const ws = new WebSocket(url);
        wsRef.current = ws;
        ws.addEventListener(stryMutAct_9fa48("3") ? "" : (stryCov_9fa48("3"), 'open'), stryMutAct_9fa48("4") ? () => undefined : (stryCov_9fa48("4"), () => setConnected(stryMutAct_9fa48("5") ? false : (stryCov_9fa48("5"), true))));
        ws.addEventListener(stryMutAct_9fa48("6") ? "" : (stryCov_9fa48("6"), 'message'), event => {
          if (stryMutAct_9fa48("7")) {
            {}
          } else {
            stryCov_9fa48("7");
            try {
              if (stryMutAct_9fa48("8")) {
                {}
              } else {
                stryCov_9fa48("8");
                setLastMessage(JSON.parse(event.data));
              }
            } catch {
              // ignore malformed
            }
          }
        });
        ws.addEventListener(stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), 'close'), () => {
          if (stryMutAct_9fa48("10")) {
            {}
          } else {
            stryCov_9fa48("10");
            setConnected(stryMutAct_9fa48("11") ? true : (stryCov_9fa48("11"), false));
            reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
          }
        });
        ws.addEventListener(stryMutAct_9fa48("12") ? "" : (stryCov_9fa48("12"), 'error'), () => {
          // handled by close
        });
      }
    }, stryMutAct_9fa48("13") ? [] : (stryCov_9fa48("13"), [url]));
    useEffect(() => {
      if (stryMutAct_9fa48("14")) {
        {}
      } else {
        stryCov_9fa48("14");
        connect();
        return () => {
          if (stryMutAct_9fa48("15")) {
            {}
          } else {
            stryCov_9fa48("15");
            clearTimeout(reconnectTimer.current);
            stryMutAct_9fa48("16") ? wsRef.current.close() : (stryCov_9fa48("16"), wsRef.current?.close());
          }
        };
      }
    }, stryMutAct_9fa48("17") ? [] : (stryCov_9fa48("17"), [connect]));
    const send = useCallback(data => {
      if (stryMutAct_9fa48("18")) {
        {}
      } else {
        stryCov_9fa48("18");
        if (stryMutAct_9fa48("21") ? wsRef.current?.readyState !== WebSocket.OPEN : stryMutAct_9fa48("20") ? false : stryMutAct_9fa48("19") ? true : (stryCov_9fa48("19", "20", "21"), (stryMutAct_9fa48("22") ? wsRef.current.readyState : (stryCov_9fa48("22"), wsRef.current?.readyState)) === WebSocket.OPEN)) {
          if (stryMutAct_9fa48("23")) {
            {}
          } else {
            stryCov_9fa48("23");
            wsRef.current.send(JSON.stringify(data));
          }
        }
      }
    }, stryMutAct_9fa48("24") ? ["Stryker was here"] : (stryCov_9fa48("24"), []));
    return stryMutAct_9fa48("25") ? {} : (stryCov_9fa48("25"), {
      connected,
      lastMessage,
      send
    });
  }
}