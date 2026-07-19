// M0 placeholder — 화면 본 구현은 M1+에서 screen-map 원본(docs/_N)으로 이식한다.
interface Props {
  icon: string
  title: string
  screenId: string
}

export default function PlaceholderPage({ icon, title, screenId }: Props) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-margin-mobile text-center">
      <span className="material-symbols-outlined text-[48px] text-primary">{icon}</span>
      <h1 className="mt-stack-md font-headline-md text-headline-md text-on-surface">{title}</h1>
      <p className="mt-stack-sm font-body-sm text-body-sm text-on-surface-variant">
        {screenId} · M1+ 구현 예정
      </p>
    </div>
  )
}
