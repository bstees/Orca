/**
 * Formats elapsed milliseconds into a human-readable string.
 *
 * @param {number} ms
 * @returns {string}
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
export function formatElapsed(ms) {
  if (stryMutAct_9fa48("127")) {
    {}
  } else {
    stryCov_9fa48("127");
    if (stryMutAct_9fa48("131") ? ms >= 0 : stryMutAct_9fa48("130") ? ms <= 0 : stryMutAct_9fa48("129") ? false : stryMutAct_9fa48("128") ? true : (stryCov_9fa48("128", "129", "130", "131"), ms < 0)) return stryMutAct_9fa48("132") ? "" : (stryCov_9fa48("132"), '0s');
    const totalSeconds = Math.floor(stryMutAct_9fa48("133") ? ms * 1000 : (stryCov_9fa48("133"), ms / 1000));
    const hours = Math.floor(stryMutAct_9fa48("134") ? totalSeconds * 3600 : (stryCov_9fa48("134"), totalSeconds / 3600));
    const minutes = Math.floor(stryMutAct_9fa48("135") ? totalSeconds % 3600 * 60 : (stryCov_9fa48("135"), (stryMutAct_9fa48("136") ? totalSeconds * 3600 : (stryCov_9fa48("136"), totalSeconds % 3600)) / 60));
    const seconds = stryMutAct_9fa48("137") ? totalSeconds * 60 : (stryCov_9fa48("137"), totalSeconds % 60);
    if (stryMutAct_9fa48("141") ? hours <= 0 : stryMutAct_9fa48("140") ? hours >= 0 : stryMutAct_9fa48("139") ? false : stryMutAct_9fa48("138") ? true : (stryCov_9fa48("138", "139", "140", "141"), hours > 0)) return stryMutAct_9fa48("142") ? `` : (stryCov_9fa48("142"), `${hours}h ${minutes}m`);
    if (stryMutAct_9fa48("146") ? minutes <= 0 : stryMutAct_9fa48("145") ? minutes >= 0 : stryMutAct_9fa48("144") ? false : stryMutAct_9fa48("143") ? true : (stryCov_9fa48("143", "144", "145", "146"), minutes > 0)) return stryMutAct_9fa48("147") ? `` : (stryCov_9fa48("147"), `${minutes}m ${seconds}s`);
    return stryMutAct_9fa48("148") ? `` : (stryCov_9fa48("148"), `${seconds}s`);
  }
}

/**
 * Returns elapsed time from a timestamp to now as a formatted string.
 *
 * @param {number} sinceMs - Unix timestamp (ms)
 * @returns {string}
 */
export function elapsedSince(sinceMs) {
  if (stryMutAct_9fa48("149")) {
    {}
  } else {
    stryCov_9fa48("149");
    return formatElapsed(stryMutAct_9fa48("150") ? Date.now() + sinceMs : (stryCov_9fa48("150"), Date.now() - sinceMs));
  }
}