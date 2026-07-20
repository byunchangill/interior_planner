// RECO-003 분석 진행 — docs/ai_2
// GET /analyses/{id}를 5초 폴링. COMPLETED → 요약 이동, FAILED → 재시도.
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAnalysis } from '../../api/reco'
import { usePolling } from '../../hooks/usePolling'
import { PROGRESS_STEPS, type AnalysisStatus } from '../../types/reco'

const isDone = (a: AnalysisStatus) => a.status === 'COMPLETED' || a.status === 'FAILED'

export default function AnalysisProgressPage() {
  const { analysisId } = useParams()
  const navigate = useNavigate()
  const id = Number(analysisId)
  const poll = usePolling<AnalysisStatus>(() => getAnalysis(id), isDone)

  const data = poll.state === 'polling' || poll.state === 'done' ? poll.data : null
  const failed = data?.status === 'FAILED' || poll.state === 'error'
  const completed = poll.state === 'done' && data?.status === 'COMPLETED'
  const progress = data?.progress ?? 0
  const stepLabel = data?.currentStepLabel ?? '분석 대기 중...'

  // 완료 시 요약 화면으로 이동
  useEffect(() => {
    if (completed) navigate(`/reco/summary/${id}`, { replace: true })
  }, [completed, id, navigate])

  // 현재 진행 단계 인덱스 (스텝 리스트 강조용)
  const activeIdx = PROGRESS_STEPS.findIndex((s) => s.status === data?.status)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="fixed top-0 left-1/2 z-50 flex h-14 w-full max-w-md -translate-x-1/2 items-center gap-3 bg-surface px-margin-mobile shadow-sm">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">AI 분석</h1>
      </header>

      <main className="flex flex-grow flex-col items-center justify-center px-margin-mobile pt-14">
        <div className="flex w-full max-w-md flex-col items-center">
          {failed ? (
            <FailureView reason={data?.failureReason} onRetry={() => navigate('/reco')} />
          ) : (
            <>
              {/* 분석 그래픽 */}
              <div className="relative mb-stack-lg flex h-56 w-56 items-center justify-center">
                <div className="absolute inset-0 animate-[pulse_3s_ease-in-out_infinite]">
                  <div className="flex h-full w-full items-center justify-center rounded-full border border-primary/10 bg-primary/5">
                    <div className="h-[85%] w-[85%] animate-[spin_20s_linear_infinite] rounded-full border-2 border-dashed border-primary/20" />
                  </div>
                </div>
                <div className="glass-card relative flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border-4 border-white shadow-xl">
                  <span
                    className="material-symbols-outlined text-6xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                </div>
              </div>

              <div className="mb-stack-md text-center">
                <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  AI가 공간을 분석하고 있습니다
                </h2>
                <p className="mx-auto max-w-md font-body-md text-body-md text-on-surface-variant">
                  수만 개의 인테리어 데이터를 바탕으로 최적의 스타일을 매칭하고 있습니다.
                </p>
              </div>

              {/* 진행률 패널 */}
              <div className="glass-card w-full space-y-4 rounded-xl p-stack-md shadow-sm">
                <div className="mb-1 flex items-end justify-between">
                  <span className="font-label-md text-label-md text-primary">{stepLabel}</span>
                  <span className="font-headline-md text-headline-md text-primary">{progress}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-variant">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  {PROGRESS_STEPS.map((s, i) => {
                    const reached = activeIdx < 0 ? false : i <= activeIdx
                    return (
                      <div
                        key={s.status}
                        className={`flex items-center gap-3 transition-opacity duration-300 ${reached ? 'opacity-100' : 'opacity-40'}`}
                      >
                        <span
                          className={`material-symbols-outlined text-[18px] ${reached ? 'text-secondary' : 'text-outline'}`}
                          style={reached ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                          {i < activeIdx ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{s.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <p className="mt-stack-lg text-center font-label-sm text-label-sm italic text-on-surface-variant opacity-60">
                * 이 작업은 평균 10-15초가 소요됩니다.
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

function FailureView({ reason, onRetry }: { reason?: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-container">
        <span
          className="material-symbols-outlined text-4xl text-error"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          error
        </span>
      </span>
      <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
        분석에 실패했습니다
      </h2>
      <p className="mb-8 max-w-sm font-body-md text-body-md text-on-surface-variant">
        {reason || '일시적인 오류로 분석을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.'}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 font-label-md text-label-md text-white shadow-lg active:scale-95"
      >
        <span className="material-symbols-outlined">refresh</span>
        다시 시도
      </button>
    </div>
  )
}
