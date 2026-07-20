// COM-005 권한 요청 안내 — docs/_33
// 가입 직후 안내 화면. 실제 OS 권한은 P2 이후 — 여기서는 안내 후 홈으로 이동.
import { useNavigate } from 'react-router-dom'

interface Perm {
  icon: string
  title: string
  desc: string
  accent: string
}

const PERMS: Perm[] = [
  {
    icon: 'photo_camera',
    title: '카메라 권한',
    desc: '실시간 사진 촬영을 통해 즉각적인 AI 스타일링 분석을 시작합니다.',
    accent: 'bg-secondary-container text-on-secondary-container',
  },
  {
    icon: 'image',
    title: '사진첩 접근 권한',
    desc: '사진첩의 공간 사진을 업로드하여 새로운 인테리어 스타일을 탐색합니다.',
    accent: 'bg-primary-fixed text-on-primary-fixed-variant',
  },
  {
    icon: 'notifications_active',
    title: '스마트 알림',
    desc: 'AI 디자인 렌더링 및 스타일 리포트가 완료되면 알림을 보내드립니다.',
    accent: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  },
]

export default function PermissionsPage() {
  const navigate = useNavigate()
  const goHome = () => navigate('/home', { replace: true })

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface">
      <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-secondary-fixed/20 blur-3xl" />
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary-fixed/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-[480px] px-margin-mobile py-stack-lg">
        <div className="mb-stack-lg flex aspect-[4/3] items-center justify-center rounded-3xl bg-primary-container/10 shadow-sm">
          <span
            className="material-symbols-outlined text-[96px] text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            interior_design
          </span>
        </div>

        <div className="mb-stack-lg text-center">
          <h1 className="mb-stack-sm font-headline-lg-mobile text-headline-lg-mobile text-primary">
            공간 디자인을 시작해볼까요?
          </h1>
          <p className="mx-auto max-w-[320px] font-body-md text-body-md text-on-surface-variant">
            맞춤형 AI 스타일링과 실시간 분석을 제공하기 위해 몇 가지 권한 허용이 필요합니다.
          </p>
        </div>

        <div className="mb-stack-lg space-y-stack-md">
          {PERMS.map((p) => (
            <div
              key={p.icon}
              className="flex items-center rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm"
            >
              <div
                className={`mr-stack-md flex h-12 w-12 flex-none items-center justify-center rounded-full ${p.accent}`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {p.icon}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-label-md text-label-md text-on-surface">{p.title}</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-stack-sm">
          <button
            onClick={goHome}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary-container font-label-md text-label-md text-on-primary-container shadow-lg transition-all active:scale-95"
          >
            권한 허용하기
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button
            onClick={goHome}
            className="h-12 w-full rounded-full font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            나중에 하기
          </button>
        </div>

        <p className="mt-stack-lg text-center font-label-sm text-label-sm text-outline">
          사용자의 데이터는 안전하게 보호되며 절대 외부에 공유되지 않습니다.
        </p>
      </div>
    </main>
  )
}
