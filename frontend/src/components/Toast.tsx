// 간단 토스트 — 소셜 로그인 "준비 중" 안내, 폼 에러 등에 사용
import { useEffect } from 'react'

interface Props {
  message: string
  onClose: () => void
  duration?: number
}

export default function Toast({ message, onClose, duration = 2500 }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [onClose, duration])

  return (
    <div className="fixed bottom-28 left-1/2 z-[100] -translate-x-1/2 px-4">
      <div className="rounded-full bg-inverse-surface px-5 py-3 font-body-sm text-body-sm text-inverse-on-surface shadow-lg">
        {message}
      </div>
    </div>
  )
}
