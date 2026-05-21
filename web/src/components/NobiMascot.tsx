import nobiTransparent from '@/assets/nobi-transparent.png'

type NobiMascotProps = {
  className?: string
  label?: string
}

export function NobiMascot({ className = '', label = 'Nobi is waiting here' }: NobiMascotProps) {
  return (
    <div className={`nobi-mascot ${className}`} aria-label={label} role="img">
      <img className="nobi-part nobi-body" src={nobiTransparent} alt="" draggable={false} />
      <img className="nobi-part nobi-head" src={nobiTransparent} alt="" draggable={false} />
      <img className="nobi-part nobi-tail" src={nobiTransparent} alt="" draggable={false} />
    </div>
  )
}
