import nobiWorking from '@/assets/nobi-working.png'

type NobiWorkingProps = {
  className?: string
}

export function NobiWorking({ className = '' }: NobiWorkingProps) {
  return (
    <div className={`nobi-working ${className}`} aria-label="Nobi is working" role="img">
      <img src={nobiWorking} alt="" draggable={false} />
      <span className="nobi-working-dot dot-a" aria-hidden="true" />
      <span className="nobi-working-dot dot-b" aria-hidden="true" />
      <span className="nobi-working-dot dot-c" aria-hidden="true" />
    </div>
  )
}
