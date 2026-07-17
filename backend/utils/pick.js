/**
 * Return a copy of `source` containing only the whitelisted `allowed` keys.
 * Used to prevent mass-assignment: admin create/update handlers pass raw
 * req.body straight into Mongoose, so without a whitelist a client could set
 * arbitrary/unexpected fields. Only keys that are actually present are copied.
 *
 * @param {object} source
 * @param {string[]} allowed
 * @returns {object}
 */
function pick(source, allowed) {
  const out = {};
  if (!source || typeof source !== 'object') return out;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      out[key] = source[key];
    }
  }
  return out;
}

module.exports = { pick };
