import nobiBody from '@/assets/nobi-body.png'
import nobiHead from '@/assets/nobi-head.png'
import nobiTail from '@/assets/nobi-tail.png'

type NobiMascotProps = {
  className?: string
  label?: string
}

export function NobiMascot({ className = '', label = 'Nobi is waiting here' }: NobiMascotProps) {
  return (
    <div className={`nobi-mascot ${className}`} aria-label={label} role="img">
      <img className="nobi-part nobi-tail" src={nobiTail} alt="" draggable={false} />
      <img className="nobi-part nobi-body" src={nobiBody} alt="" draggable={false} />
      <img className="nobi-part nobi-head" src={nobiHead} alt="" draggable={false} />
    </div>
  )
}
