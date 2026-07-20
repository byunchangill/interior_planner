// 공용 표시 포맷 헬퍼 (M4)

// 원화 → "345만원" 축약 (만원 단위 반올림)
export function formatWon(n?: number | null): string {
  if (n == null) return '-'
  return `${Math.round(n / 10000).toLocaleString()}만원`
}

// 원화 → "1,290,000원" 전체 표기 (구매목록 텍스트/합계용)
export function formatWonFull(n?: number | null): string {
  if (n == null) return '-'
  return `${n.toLocaleString()}원`
}

// ISO 날짜 → "2026.07.20"
export function formatDate(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 치수 mm 3종 → "2180 × 920 × 810 mm"
export function formatDims(w: number, d: number, h: number): string {
  return `${w} × ${d} × ${h} mm`
}
