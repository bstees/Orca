/**
 * Status → display config mapping.
 *
 * @param {string} status
 * @returns {{ label: string, color: string }}
 */
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
export function getStatusDisplay(status) {
  if (stryMutAct_9fa48("94")) {
    {}
  } else {
    stryCov_9fa48("94");
    const map = stryMutAct_9fa48("95") ? {} : (stryCov_9fa48("95"), {
      registered: stryMutAct_9fa48("96") ? {} : (stryCov_9fa48("96"), {
        label: stryMutAct_9fa48("97") ? "" : (stryCov_9fa48("97"), 'Registered'),
        color: stryMutAct_9fa48("98") ? "" : (stryCov_9fa48("98"), '#6b7280')
      }),
      working: stryMutAct_9fa48("99") ? {} : (stryCov_9fa48("99"), {
        label: stryMutAct_9fa48("100") ? "" : (stryCov_9fa48("100"), 'Working'),
        color: stryMutAct_9fa48("101") ? "" : (stryCov_9fa48("101"), '#2563eb')
      }),
      idle: stryMutAct_9fa48("102") ? {} : (stryCov_9fa48("102"), {
        label: stryMutAct_9fa48("103") ? "" : (stryCov_9fa48("103"), 'Idle'),
        color: stryMutAct_9fa48("104") ? "" : (stryCov_9fa48("104"), '#d97706')
      }),
      blocked: stryMutAct_9fa48("105") ? {} : (stryCov_9fa48("105"), {
        label: stryMutAct_9fa48("106") ? "" : (stryCov_9fa48("106"), 'Blocked'),
        color: stryMutAct_9fa48("107") ? "" : (stryCov_9fa48("107"), '#dc2626')
      }),
      needs_input: stryMutAct_9fa48("108") ? {} : (stryCov_9fa48("108"), {
        label: stryMutAct_9fa48("109") ? "" : (stryCov_9fa48("109"), 'Needs Input'),
        color: stryMutAct_9fa48("110") ? "" : (stryCov_9fa48("110"), '#7c3aed')
      }),
      done: stryMutAct_9fa48("111") ? {} : (stryCov_9fa48("111"), {
        label: stryMutAct_9fa48("112") ? "" : (stryCov_9fa48("112"), 'Done'),
        color: stryMutAct_9fa48("113") ? "" : (stryCov_9fa48("113"), '#16a34a')
      })
    });
    return stryMutAct_9fa48("114") ? map[status] && {
      label: status,
      color: '#6b7280'
    } : (stryCov_9fa48("114"), map[status] ?? (stryMutAct_9fa48("115") ? {} : (stryCov_9fa48("115"), {
      label: status,
      color: stryMutAct_9fa48("116") ? "" : (stryCov_9fa48("116"), '#6b7280')
    })));
  }
}

/**
 * Returns true when a session requires human attention.
 *
 * @param {string} status
 * @returns {boolean}
 */
export function isActionRequired(status) {
  if (stryMutAct_9fa48("117")) {
    {}
  } else {
    stryCov_9fa48("117");
    return stryMutAct_9fa48("120") ? status === 'needs_input' && status === 'blocked' : stryMutAct_9fa48("119") ? false : stryMutAct_9fa48("118") ? true : (stryCov_9fa48("118", "119", "120"), (stryMutAct_9fa48("122") ? status !== 'needs_input' : stryMutAct_9fa48("121") ? false : (stryCov_9fa48("121", "122"), status === (stryMutAct_9fa48("123") ? "" : (stryCov_9fa48("123"), 'needs_input')))) || (stryMutAct_9fa48("125") ? status !== 'blocked' : stryMutAct_9fa48("124") ? false : (stryCov_9fa48("124", "125"), status === (stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), 'blocked')))));
  }
}