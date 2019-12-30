export var _Math = Math;
export var random = _Math.random;

function round(number, precisionTo) {
  var precision = _Math.pow(10, precisionTo || 0);
  return _Math.round(number * precision) / precision;
}

/**
 *
 * @param {Number} degree
 * @returns {Number} radian
 */
function radian(degree) {
  return (degree * _Math.PI) / 180 || 0;
}

/**
 *
 * @param {Number} cx X coordinate of center of circle
 * @param {Number} cy Y coordinate of center of circle
 * @param {Number} radius Radius of circle
 * @param {Number} degree Angle in Degrees for seeking point
 * @returns {Object} {x,y} coordinates
 */
function getArcPoint(cx, cy, radius, degree) {
  var theta = radian(degree);
  return {
    x: round(cx + radius * _Math.cos(theta), 2),
    y: round(cy + radius * _Math.sin(theta), 2)
  };
}

/**
 *
 * @param {Number} cx X coordinate of center of circle
 * @param {Number} cy Y coordinate of center of circle
 * @param {Number} radius Radius of circle
 * @param {Number} startDegree Arc start angle in Degrees
 * @param {Number} endDegree Arc end angle in Degrees
 * @returns {String} SVG path definition `d`
 */
function doArc(cx, cy, radius, startDegree, endDegree) {
  const start = getArcPoint(cx, cy, radius, startDegree);
  const end = getArcPoint(cx, cy, radius, endDegree);
  const largeArcFlag = _Math.abs(endDegree - startDegree) > 180 ? 1 : 0;
  let sweepFlag = 1;
  const M = `M ${start.x} ${start.y}`;
  const A = [
    "A",
    radius,
    radius,
    "0",
    largeArcFlag,
    sweepFlag,
    end.x,
    end.y
  ].join(" ");

  return M + A;
}

/**
 *
 * @param {Number} cx X coordinate of center of circle
 * @param {Number} cy Y coordinate of center of circle
 * @param {Number} radius Radius of circle
 * @param {Number} startDegree Arc start angle in Degrees
 * @param {Number} endDegree Arc end angle in Degrees
 * @returns {String} SVG path definition `d`
 */
export function arc(cx, cy, radius, startDegree, endDegree) {
  if (endDegree > 359) {
    return (
      doArc(cx, cy, radius, startDegree, 359) +
      doArc(cx, cy, radius, 359, endDegree)
    );
  }
  return doArc(cx, cy, radius, startDegree, endDegree);
}
