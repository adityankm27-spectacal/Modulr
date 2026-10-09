/** Minimal RFC 4180 CSV parser: quoted fields, "" escapes, newlines inside quotes, BOM, CRLF. */
export class CsvError extends Error {}

export interface CsvRow {
  /** 1-based line number where the row starts (for error messages). */
  line: number;
  cells: string[];
}

export function parseCsv(input: string): CsvRow[] {
  const text = input.replace(/^\uFEFF/, "");
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;
  let rowLine = 1;
  let quoteLine = 1;

  const endRow = () => {
    cells.push(cell);
    if (cells.some((c) => c.trim() !== "")) rows.push({ line: rowLine, cells });
    cells = [];
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === "\n") line++;
        cell += ch;
      }
      continue;
    }
    if (ch === '"' && cell === "") {
      inQuotes = true;
      quoteLine = line;
    } else if (ch === ",") {
      cells.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      endRow();
      line++;
      rowLine = line;
    } else {
      cell += ch;
    }
  }

  if (inQuotes) throw new CsvError(`Line ${quoteLine}: a quoted value is never closed.`);
  endRow();
  return rows;
}
