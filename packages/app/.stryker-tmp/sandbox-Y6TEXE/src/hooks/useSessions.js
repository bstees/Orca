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
export function useSessions({
  lastMessage
}) {
  if (stryMutAct_9fa48("26")) {
    {}
  } else {
    stryCov_9fa48("26");
    const [sessions, setSessions] = useState(stryMutAct_9fa48("27") ? ["Stryker was here"] : (stryCov_9fa48("27"), []));
    const [alerts, setAlerts] = useState(stryMutAct_9fa48("28") ? ["Stryker was here"] : (stryCov_9fa48("28"), []));
    useEffect(() => {
      if (stryMutAct_9fa48("29")) {
        {}
      } else {
        stryCov_9fa48("29");
        if (stryMutAct_9fa48("32") ? false : stryMutAct_9fa48("31") ? true : stryMutAct_9fa48("30") ? lastMessage : (stryCov_9fa48("30", "31", "32"), !lastMessage)) return;
        const {
          type
        } = lastMessage;
        if (stryMutAct_9fa48("35") ? type !== 'sessions_snapshot' : stryMutAct_9fa48("34") ? false : stryMutAct_9fa48("33") ? true : (stryCov_9fa48("33", "34", "35"), type === (stryMutAct_9fa48("36") ? "" : (stryCov_9fa48("36"), 'sessions_snapshot')))) {
          if (stryMutAct_9fa48("37")) {
            {}
          } else {
            stryCov_9fa48("37");
            setSessions(stryMutAct_9fa48("38") ? lastMessage.sessions && [] : (stryCov_9fa48("38"), lastMessage.sessions ?? (stryMutAct_9fa48("39") ? ["Stryker was here"] : (stryCov_9fa48("39"), []))));
            return;
          }
        }
        if (stryMutAct_9fa48("42") ? type !== 'session_registered' : stryMutAct_9fa48("41") ? false : stryMutAct_9fa48("40") ? true : (stryCov_9fa48("40", "41", "42"), type === (stryMutAct_9fa48("43") ? "" : (stryCov_9fa48("43"), 'session_registered')))) {
          if (stryMutAct_9fa48("44")) {
            {}
          } else {
            stryCov_9fa48("44");
            const {
              sessionId,
              workspaceName,
              gitBranch,
              description,
              ts
            } = lastMessage;
            setSessions(prev => {
              if (stryMutAct_9fa48("45")) {
                {}
              } else {
                stryCov_9fa48("45");
                if (stryMutAct_9fa48("48") ? prev.every(s => s.sessionId === sessionId) : stryMutAct_9fa48("47") ? false : stryMutAct_9fa48("46") ? true : (stryCov_9fa48("46", "47", "48"), prev.some(stryMutAct_9fa48("49") ? () => undefined : (stryCov_9fa48("49"), s => stryMutAct_9fa48("52") ? s.sessionId !== sessionId : stryMutAct_9fa48("51") ? false : stryMutAct_9fa48("50") ? true : (stryCov_9fa48("50", "51", "52"), s.sessionId === sessionId))))) return prev;
                return stryMutAct_9fa48("53") ? [] : (stryCov_9fa48("53"), [stryMutAct_9fa48("54") ? {} : (stryCov_9fa48("54"), {
                  sessionId,
                  workspaceName,
                  gitBranch,
                  description: stryMutAct_9fa48("55") ? description && '' : (stryCov_9fa48("55"), description ?? (stryMutAct_9fa48("56") ? "Stryker was here!" : (stryCov_9fa48("56"), ''))),
                  status: SESSION_STATUS.REGISTERED,
                  message: stryMutAct_9fa48("57") ? "Stryker was here!" : (stryCov_9fa48("57"), ''),
                  registeredAt: stryMutAct_9fa48("58") ? ts && Date.now() : (stryCov_9fa48("58"), ts ?? Date.now()),
                  updatedAt: stryMutAct_9fa48("59") ? ts && Date.now() : (stryCov_9fa48("59"), ts ?? Date.now())
                }), ...prev]);
              }
            });
            return;
          }
        }
        if (stryMutAct_9fa48("62") ? type !== 'status_updated' : stryMutAct_9fa48("61") ? false : stryMutAct_9fa48("60") ? true : (stryCov_9fa48("60", "61", "62"), type === (stryMutAct_9fa48("63") ? "" : (stryCov_9fa48("63"), 'status_updated')))) {
          if (stryMutAct_9fa48("64")) {
            {}
          } else {
            stryCov_9fa48("64");
            setSessions(stryMutAct_9fa48("65") ? () => undefined : (stryCov_9fa48("65"), prev => prev.map(stryMutAct_9fa48("66") ? () => undefined : (stryCov_9fa48("66"), s => (stryMutAct_9fa48("69") ? s.sessionId !== lastMessage.sessionId : stryMutAct_9fa48("68") ? false : stryMutAct_9fa48("67") ? true : (stryCov_9fa48("67", "68", "69"), s.sessionId === lastMessage.sessionId)) ? stryMutAct_9fa48("70") ? {} : (stryCov_9fa48("70"), {
              ...s,
              status: lastMessage.status,
              message: stryMutAct_9fa48("71") ? lastMessage.message && '' : (stryCov_9fa48("71"), lastMessage.message ?? (stryMutAct_9fa48("72") ? "Stryker was here!" : (stryCov_9fa48("72"), ''))),
              updatedAt: stryMutAct_9fa48("73") ? lastMessage.ts && Date.now() : (stryCov_9fa48("73"), lastMessage.ts ?? Date.now())
            }) : s))));
            return;
          }
        }
        if (stryMutAct_9fa48("76") ? type !== 'session_deregistered' : stryMutAct_9fa48("75") ? false : stryMutAct_9fa48("74") ? true : (stryCov_9fa48("74", "75", "76"), type === (stryMutAct_9fa48("77") ? "" : (stryCov_9fa48("77"), 'session_deregistered')))) {
          if (stryMutAct_9fa48("78")) {
            {}
          } else {
            stryCov_9fa48("78");
            setSessions(stryMutAct_9fa48("79") ? () => undefined : (stryCov_9fa48("79"), prev => stryMutAct_9fa48("80") ? prev : (stryCov_9fa48("80"), prev.filter(stryMutAct_9fa48("81") ? () => undefined : (stryCov_9fa48("81"), s => stryMutAct_9fa48("84") ? s.sessionId === lastMessage.sessionId : stryMutAct_9fa48("83") ? false : stryMutAct_9fa48("82") ? true : (stryCov_9fa48("82", "83", "84"), s.sessionId !== lastMessage.sessionId))))));
            return;
          }
        }
        if (stryMutAct_9fa48("87") ? type !== 'alert_notification' : stryMutAct_9fa48("86") ? false : stryMutAct_9fa48("85") ? true : (stryCov_9fa48("85", "86", "87"), type === (stryMutAct_9fa48("88") ? "" : (stryCov_9fa48("88"), 'alert_notification')))) {
          if (stryMutAct_9fa48("89")) {
            {}
          } else {
            stryCov_9fa48("89");
            setAlerts(stryMutAct_9fa48("90") ? () => undefined : (stryCov_9fa48("90"), prev => stryMutAct_9fa48("91") ? [] : (stryCov_9fa48("91"), [lastMessage, ...prev])));
          }
        }
      }
    }, stryMutAct_9fa48("92") ? [] : (stryCov_9fa48("92"), [lastMessage]));
    return stryMutAct_9fa48("93") ? {} : (stryCov_9fa48("93"), {
      sessions,
      alerts
    });
  }
}