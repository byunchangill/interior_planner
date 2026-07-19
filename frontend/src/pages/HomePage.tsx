// HOME-001 홈 — docs/_1
// M0: 스캐폴딩 연동 검증용으로 /health 결과를 표시한다. 본 구현은 M1+에서.
import { useEffect, useState } from 'react'
import { getHealth } from '../api/health'
import type { HealthStatus } from '../types/common'

type Health =
  | { state: 'loading' }
  | { state: 'ok'; data: HealthStatus }
  | { state: 'error'; message: string }

export default function HomePage() {
  const [health, setHealth] = useState<Health>({ state: 'loading' })

  useEffect(() => {
    let alive = true
    getHealth()
      .then((data) => alive && setHealth({ state: 'ok', data }))
      .catch((err: unknown) =>
        alive &&
        setHealth({
          state: 'error',
          message: err instanceof Error ? err.message : String(err),
        }),
      )
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="px-margin-mobile py-stack-lg">
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
        HomeStyler
      </h1>
      <p className="mt-stack-sm font-body-md text-body-md text-on-surface-variant">
        AI 맞춤형 인테리어 추천 · M0 스캐폴딩
      </p>

      {/* 백엔드 연동 검증 카드 (추후 홈 실제 콘텐츠로 교체) */}
      <section className="mt-stack-lg rounded-xl border border-outline-variant bg-surface-container-lowest p-gutter shadow-sm">
        <div className="flex items-center gap-stack-sm">
          <span className="material-symbols-outlined text-primary">monitor_heart</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">백엔드 연동 상태</h2>
        </div>

        <div className="mt-stack-md font-body-md text-body-md">
          {health.state === 'loading' && (
            <p className="text-on-surface-variant">/api/v1/health 확인 중…</p>
          )}
          {health.state === 'ok' && (
            <ul className="space-y-1">
              <li className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-secondary" />
                <span className="text-on-surface">
                  status: <b>{health.data.status}</b>
                </span>
              </li>
              <li className="text-on-surface-variant">service: {health.data.service}</li>
              <li className="text-on-surface-variant">timestamp: {health.data.timestamp}</li>
            </ul>
          )}
          {health.state === 'error' && (
            <div className="rounded-lg bg-error-container p-stack-md text-on-error-container">
              <p className="font-label-md text-label-md">헬스체크 실패</p>
              <p className="mt-1 text-body-sm">{health.message}</p>
              <p className="mt-1 text-body-sm">백엔드(8080)가 실행 중인지 확인하세요.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
