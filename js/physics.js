// Core antinode/node math. Pure functions only — no DOM access — so this
// file can be loaded standalone by the unit tests via the real index.html.
(function (global) {
  function hwFt(freqMHz, vf) {
    return (492 * vf) / freqMHz;
  }

  function nValue(lengthFt, freqMHz, vf) {
    return lengthFt / hwFt(freqMHz, vf);
  }

  function distanceToNearestEven(n) {
    const nearestEven = Math.round(n / 2) * 2;
    return Math.abs(n - nearestEven);
  }

  function classifyDistance(dist, tolerance) {
    if (dist < tolerance) return 'danger';
    // Amber buffer is 2x the danger tolerance — a legible middle band for
    // the traffic-light UI, not a physically derived threshold.
    if (dist < tolerance * 2) return 'marginal';
    return 'good';
  }

  // n(f) = L*f / (492*vf) is linear in f, so across a band's frequency range
  // the distance-to-nearest-even-integer function is unimodal (a "tent"
  // between consecutive even integers) — its minimum over the band can only
  // occur at one of the two band edges, or be exactly 0 if an even integer
  // falls inside the range. No need to sample interior frequencies.
  function bandVerdict(lengthFt, band, vf, tolerance) {
    const nLow = nValue(lengthFt, band.lowMHz, vf);
    const nHigh = nValue(lengthFt, band.highMHz, vf);
    const lo = Math.min(nLow, nHigh);
    const hi = Math.max(nLow, nHigh);
    const firstEvenAtOrAbove = Math.ceil(lo / 2) * 2;
    const straddlesNode = firstEvenAtOrAbove <= hi;
    const minDist = straddlesNode
      ? 0
      : Math.min(distanceToNearestEven(nLow), distanceToNearestEven(nHigh));

    return {
      band: band.name,
      nLow,
      nHigh,
      minDist,
      verdict: classifyDistance(minDist, tolerance),
    };
  }

  // Free-space quarter-wave reference length for the Random Wire tab's
  // informational counterpoise display — see docs/spec.md decision 5.
  // Deliberately NOT fed into nValue/bandVerdict.
  function counterpoiseFt(freqMHz, vf) {
    return (246 * (vf || 1)) / freqMHz;
  }

  global.DN = Object.assign(global.DN || {}, {
    hwFt,
    nValue,
    distanceToNearestEven,
    classifyDistance,
    bandVerdict,
    counterpoiseFt,
  });
})(window);
