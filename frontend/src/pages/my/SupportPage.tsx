// MY-005 공지·고객센터 — docs/_26 (P2, 화면만 — API 호출 없음)
// 정적 공지/FAQ 목록. 탭 전환 + FAQ 아코디언.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Notice {
  tag: string
  tone: string
  date: string
  title: string
  body: string
}
interface Faq {
  q: string
  a: string
}

const NOTICES: Notice[] = [
  {
    tag: '중요',
    tone: 'bg-secondary-container text-on-secondary-container',
    date: '2026.07.15',
    title: "새로운 AI 인테리어 스타일 '북유럽 모던' 추가 안내",
    body: '이제 더 세련된 북유럽풍 인테리어를 AI가 제안해드립니다. 화이트 톤과 우드 소재의 조화를 경험해보세요.',
  },
  {
    tag: '안내',
    tone: 'bg-surface-variant text-on-surface-variant',
    date: '2026.07.10',
    title: '서비스 안정화를 위한 정기 점검 안내',
    body: '더 나은 서비스 제공을 위해 서버 점검을 실시합니다. 점검 시간에는 앱 사용이 제한될 수 있습니다.',
  },
  {
    tag: '이벤트',
    tone: 'bg-surface-variant text-on-surface-variant',
    date: '2026.07.01',
    title: '친구 초대하고 프리미엄 혜택 받으세요!',
    body: '초대받은 친구가 첫 디자인을 완성하면, 두 분 모두에게 혜택을 드립니다.',
  },
]

const FAQS: Faq[] = [
  {
    q: 'AI 스타일링 결과는 어떻게 저장하나요?',
    a: "추천 결과 화면 하단의 '저장하기'를 누르면 보관함에 저장됩니다. 이미지 다운로드로 갤러리에도 저장할 수 있어요.",
  },
  {
    q: '업로드한 원본 사진을 삭제하려면?',
    a: "마이페이지 > 데이터·개인정보 관리에서 개별 또는 전체 원본을 삭제할 수 있습니다. '추천 결과는 남기기'를 켜면 추천안은 유지됩니다.",
  },
  {
    q: '사진 촬영 시 주의할 점이 있나요?',
    a: '더 정확한 분석을 위해 밝은 상태에서, 방의 모서리나 전체 구조가 잘 보이도록 사선 방향에서 촬영하는 것을 권장합니다.',
  },
  {
    q: '회원 탈퇴하면 데이터는 어떻게 되나요?',
    a: '탈퇴 시 원본 사진·도면·공간·추천안·공유링크 등 모든 개인 데이터가 즉시 영구 삭제되며 복구할 수 없습니다.',
  },
]

export default function SupportPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'notice' | 'faq'>('notice')
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="fixed top-0 left-1/2 z-50 flex h-14 w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface px-margin-mobile shadow-sm">
        <button onClick={() => navigate(-1)} className="text-primary" aria-label="뒤로">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary">공지·고객센터</h1>
      </header>

      <main className="px-margin-mobile pt-20">
        <section className="mb-8">
          <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            도움이 필요하신가요?
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            공지사항과 자주 묻는 질문을 확인해보세요.
          </p>
        </section>

        {/* 탭 */}
        <div className="mb-6 flex border-b border-outline-variant">
          {(['notice', 'faq'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-4 text-center font-label-md text-label-md transition-all',
                tab === t ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant',
              ].join(' ')}
            >
              {t === 'notice' ? '공지사항' : '자주 묻는 질문(FAQ)'}
            </button>
          ))}
        </div>

        {/* 공지 */}
        {tab === 'notice' && (
          <div className="space-y-4">
            {NOTICES.map((n) => (
              <div key={n.title} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                <div className="mb-2 flex items-start justify-between">
                  <span className={`rounded-full px-3 py-1 font-label-sm text-label-sm ${n.tone}`}>{n.tag}</span>
                  <span className="font-label-sm text-label-sm text-outline">{n.date}</span>
                </div>
                <h3 className="font-headline-md text-[18px] text-on-surface">{n.title}</h3>
                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">{n.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* FAQ */}
        {tab === 'faq' && (
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const active = open === i
              return (
                <div key={f.q} className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm">
                  <button
                    onClick={() => setOpen(active ? null : i)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-surface-container-low"
                  >
                    <span className="pr-3 font-label-md text-[16px] text-on-surface">{f.q}</span>
                    <span
                      className="material-symbols-outlined text-primary transition-transform"
                      style={active ? { transform: 'rotate(180deg)' } : undefined}
                    >
                      expand_more
                    </span>
                  </button>
                  {active && (
                    <p className="px-5 pb-5 font-body-md text-body-md text-on-surface-variant">{f.a}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* 1:1 문의 (준비 중) */}
        <div className="mt-10 flex justify-center">
          <button className="flex cursor-default items-center gap-2 rounded-full bg-primary px-8 py-4 font-label-md text-label-md text-on-primary opacity-90 shadow-lg">
            <span className="material-symbols-outlined">contact_support</span>
            1:1 문의하기 (준비 중)
          </button>
        </div>
      </main>
    </div>
  )
}
