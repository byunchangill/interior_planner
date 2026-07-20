// AI 한계 고지 배너 (FR-RECO-012, 법적 고지) — RECO-004~008 공통 사용.
// disclaimers가 있으면 계약 문구를, 없으면 기본 문구를 표시한다.
interface Props {
  messages?: string[]
  // sticky: 상세(RECO-005) 최상단 고정용
  sticky?: boolean
}

const DEFAULT = 'AI 분석 결과로 실제 치수·시공 가능 여부와 다를 수 있습니다.'

export default function AiNoticeBanner({ messages, sticky = false }: Props) {
  const lines = messages && messages.length > 0 ? messages : [DEFAULT]
  return (
    <div
      className={[
        'glass-card border-none bg-tertiary-fixed/80 px-4 py-2.5 rounded-xl flex items-start gap-2 shadow-sm',
        sticky ? 'sticky top-[68px] z-30' : '',
      ].join(' ')}
    >
      <span
        className="material-symbols-outlined text-tertiary text-[20px] shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        warning
      </span>
      <div className="space-y-0.5">
        {lines.map((m, i) => (
          <p key={i} className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
            {m}
          </p>
        ))}
      </div>
    </div>
  )
}
