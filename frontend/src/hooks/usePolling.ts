import { useEffect, useRef, useState } from 'react'

export type PollState<T> =
  | { state: 'loading' }
  | { state: 'polling'; data: T }
  | { state: 'done'; data: T }
  | { state: 'error'; message: string }

// 5초 간격 폴링. isDone(data)가 true면 폴링을 멈추고 done으로 전이.
// 언마운트 시 interval 정리(clearInterval)로 누수·완료 후 재요청을 방지한다.
export function usePolling<T>(
  fetcher: () => Promise<T>,
  isDone: (d: T) => boolean,
  intervalMs = 5000,
): PollState<T> {
  const [result, setResult] = useState<PollState<T>>({ state: 'loading' })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let alive = true
    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    const tick = () => {
      fetcher()
        .then((data) => {
          if (!alive) return
          if (isDone(data)) {
            stop()
            setResult({ state: 'done', data })
          } else {
            setResult({ state: 'polling', data })
          }
        })
        .catch((err: unknown) => {
          if (!alive) return
          stop()
          setResult({ state: 'error', message: err instanceof Error ? err.message : String(err) })
        })
    }

    tick() // 즉시 1회
    timerRef.current = setInterval(tick, intervalMs)

    return () => {
      alive = false
      stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return result
}
