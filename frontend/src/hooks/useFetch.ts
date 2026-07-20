import { useEffect, useState } from 'react'

export type FetchState<T> =
  | { state: 'loading' }
  | { state: 'ok'; data: T }
  | { state: 'error'; message: string }

// 마운트 시 1회 fetch. deps 변경 시 재요청. 홈/갤러리/상세 공통 패턴.
export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []): FetchState<T> {
  const [result, setResult] = useState<FetchState<T>>({ state: 'loading' })

  useEffect(() => {
    let alive = true
    setResult({ state: 'loading' })
    fetcher()
      .then((data) => alive && setResult({ state: 'ok', data }))
      .catch(
        (err: unknown) =>
          alive &&
          setResult({
            state: 'error',
            message: err instanceof Error ? err.message : String(err),
          }),
      )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return result
}
