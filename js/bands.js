// Default US General/Extra HF band edges (decision 1, docs/spec.md).
// Plain data array by design — adding WARC-only or phone-only sub-bands
// later is a one-line change, not a redesign.
//
// 60m is deliberately omitted: it's a set of discrete channels, not a
// continuous range, and doesn't fit the low/high-edge sweep model used by
// DN.bandVerdict. Add it as a zero-width band (lowMHz === highMHz per
// channel) if/when needed rather than forcing it into a range shape.
(function (global) {
  const BANDS = [
    { name: '160m', lowMHz: 1.800, highMHz: 2.000 },
    { name: '80m', lowMHz: 3.500, highMHz: 4.000 },
    { name: '40m', lowMHz: 7.000, highMHz: 7.300 },
    { name: '30m', lowMHz: 10.100, highMHz: 10.150 },
    { name: '20m', lowMHz: 14.000, highMHz: 14.350 },
    { name: '17m', lowMHz: 18.068, highMHz: 18.168 },
    { name: '15m', lowMHz: 21.000, highMHz: 21.450 },
    { name: '12m', lowMHz: 24.890, highMHz: 24.990 },
    { name: '10m', lowMHz: 28.000, highMHz: 29.700 },
  ];

  global.DN = Object.assign(global.DN || {}, { BANDS });
})(window);
