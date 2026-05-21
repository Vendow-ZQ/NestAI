import nobiWaiting from '@/assets/nobi-waiting.png'

type NobiMascotProps = {
  className?: string
  label?: string
}

export function NobiMascot({ className = '', label = 'Nobi is waiting here' }: NobiMascotProps) {
  return (
    <div className={`nobi-mascot ${className}`} aria-label={label} role="img">
      <span className="nobi-tail" aria-hidden="true" />
      <img src={nobiWaiting} alt="" draggable={false} />
    </div>
  )
}
