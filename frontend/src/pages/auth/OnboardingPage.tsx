// COM-002 온보딩 — docs/_31, _32 (3스텝 캐러셀)
// 원본의 원격 스톡 이미지는 만료 위험이 있어 디자인 토큰 기반 플레이스홀더 패널로 대체.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Step {
  icon: string
  title: string
  desc: string
  accent: string
}

const STEPS: Step[] = [
  {
    icon: 'photo_camera',
    title: '공간 사진을 찍어주세요',
    desc: '원하는 공간의 사진을 선명하게 찍어주세요. AI가 치수, 가구, 조명을 자동으로 분석합니다.',
    accent: 'bg-primary/10 text-primary',
  },
  {
    icon: 'palette',
    title: '선호하는 스타일을 선택하세요',
    desc: '자판디부터 미드센추리 모던까지, 당신의 취향에 딱 맞는 인테리어 스타일을 찾아보세요.',
    accent: 'bg-secondary/10 text-secondary',
  },
  {
    icon: 'auto_awesome',
    title: 'AI 추천을 받아보세요',
    desc: '새롭게 변화된 당신의 공간을 경험해 보세요. 맞춤형 쇼핑 리스트와 레이아웃을 제공합니다.',
    accent: 'bg-tertiary/10 text-tertiary',
  },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1

  const finish = () => navigate('/login', { replace: true })
  const next = () => (isLast ? finish() : setStep((s) => s + 1))

  return (
    <main className="relative mx-auto flex h-screen w-full max-w-[500px] flex-col overflow-hidden bg-surface-container-lowest">
      <header className="absolute left-0 top-0 z-20 flex w-full items-center justify-between px-margin-mobile py-8">
        <div className="font-headline-md text-headline-md font-bold text-primary">HomeStyler AI</div>
        <button
          className="font-label-md text-label-md text-on-surface-variant transition-colors hover:text-primary"
          onClick={finish}
        >
          건너뛰기
        </button>
      </header>

      {/* 슬라이드 트랙 */}
      <div className="flex h-full flex-1">
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          {STEPS.map((s) => (
            <section key={s.icon} className="flex h-full w-full flex-none flex-col">
              <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-surface-container-low">
                <div
                  className={`flex h-40 w-40 items-center justify-center rounded-[2.5rem] ${s.accent}`}
                >
                  <span
                    className="material-symbols-outlined text-[80px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {s.icon}
                  </span>
                </div>
              </div>
              <div className="px-margin-mobile pb-40 pt-8 text-center">
                <h2 className="mb-4 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  {s.title}
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">{s.desc}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <footer className="absolute bottom-0 left-0 z-20 flex w-full flex-col items-center gap-6 px-margin-mobile pb-10">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s.icon}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-primary' : 'w-2 bg-outline-variant'
              }`}
            />
          ))}
        </div>
        <button
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 transition-all active:scale-95"
          onClick={next}
        >
          <span>{isLast ? '시작하기' : '다음'}</span>
          <span className="material-symbols-outlined">
            {isLast ? 'rocket_launch' : 'arrow_forward'}
          </span>
        </button>
      </footer>
    </main>
  )
}
