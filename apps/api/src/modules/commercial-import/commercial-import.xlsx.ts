import ExcelJS from 'exceljs';

export async function buildXlsxTemplate(sheetName: string, columns: readonly string[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.addRow([...columns]);
  sheet.getRow(1).font = { bold: true };
  columns.forEach((_, index) => {
    sheet.getColumn(index + 1).width = 22;
  });
  return workbook.xlsx.writeBuffer();
}

export async function parseXlsxRows(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [] as string[], rows: [] as Record<string, string>[] };

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? '').trim();
  });

  const rows: Record<string, string>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    let empty = true;
    headers.forEach((header, index) => {
      const value = stringifyCell(row.getCell(index + 1).value);
      record[header] = value;
      if (value) empty = false;
    });
    if (!empty) rows.push(record);
  });

  return { headers, rows };
}

function stringifyCell(value: ExcelJS.CellValue): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object' && 'text' in value) return String(value.text ?? '');
  if (typeof value === 'object' && 'result' in value) {
    return stringifyCell(value.result as ExcelJS.CellValue);
  }
  return String(value).trim();
}

export function errorLogCsv(errors: Array<{ row: number; field?: string; message: string }>) {
  const lines = ['linha,campo,erro'];
  for (const error of errors) {
    const field = (error.field ?? '').replaceAll('"', '""');
    const message = error.message.replaceAll('"', '""');
    lines.push(`${error.row},"${field}","${message}"`);
  }
  return `\uFEFF${lines.join('\n')}`;
}
