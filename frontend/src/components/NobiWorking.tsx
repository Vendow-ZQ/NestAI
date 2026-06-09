import { useEffect, useState } from 'react'

type NobiWorkingProps = {
  className?: string
  variant?: 'questionnaire' | 'result' | 'effect' | 'letter'
}

const frameFolders = {
  questionnaire: '/nobi/questionnaire-frames',
  result: '/nobi/result-frames',
  effect: '/nobi/effect-frames',
  letter: '/nobi/letter-frames',
} as const

const frameCounts = {
  questionnaire: 8,
  result: 8,
  effect: 8,
  letter: 8,
} as const

export function NobiWorking({ className = '', variant = 'questionnaire' }: NobiWorkingProps) {
  const [frameIndex, setFrameIndex] = useState(0)
  const frameFolder = frameFolders[variant]
  const workingFrames = Array.from({ length: frameCounts[variant] }, (_, index) => {
    return `${frameFolder}/frame-${index + 1}.png`
  })

  useEffect(() => {
    setFrameIndex(0)
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % workingFrames.length)
    }, 260)

    return () => window.clearInterval(timer)
  }, [workingFrames.length])

  return (
    <div className={`nobi-working ${className}`} aria-label="Nobi is working" role="img">
      <img className="nobi-working-frame" src={workingFrames[frameIndex]} alt="" draggable={false} />
    </div>
  )
}
