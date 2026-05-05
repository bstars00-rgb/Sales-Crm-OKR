// 클라이언트 사이드 CSV 내보내기 유틸 (Phase 1.5 ExportButton 정식화)

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface CsvColumn<T> {
  key: keyof T | ((row: T) => unknown)
  header: string
}

export function exportToCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
): void {
  const headers = columns.map((c) => escapeCsvCell(c.header)).join(',')
  const dataRows = rows.map((row) =>
    columns
      .map((col) => {
        const value =
          typeof col.key === 'function' ? col.key(row) : row[col.key]
        return escapeCsvCell(value)
      })
      .join(',')
  )
  const csv = [headers, ...dataRows].join('\n')
  const BOM = '\uFEFF' // Excel UTF-8 호환
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const date = new Date().toISOString().split('T')[0]
  link.download = `${filename}-${date}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
