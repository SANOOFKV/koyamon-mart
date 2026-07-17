/**
 * Parse a single CSV line into trimmed fields, honouring double-quoted values.
 *
 * Handles commas inside quotes ("a,b" -> one field) and escaped quotes
 * (""  -> ") so the header row and data rows are parsed the same way. Replaces
 * the previous mix of a naive `split(',')` for the header and a fragile regex
 * for the rows, which could misalign columns on any quoted value.
 *
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // escaped double-quote
        else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

module.exports = { parseCsvLine };
