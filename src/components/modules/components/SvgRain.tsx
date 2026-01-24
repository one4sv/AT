import { useEffect, useState } from "react"
import { Prohibit , ShareFat, UserGear, UserPlus, Image, TextAa , TextAlignCenter, PushPin } from "@phosphor-icons/react"
import "../../../scss/svgRain.scss"

type Drop = {
    id: number
    left: number
    size: number
    duration: number
    delay: number
    opacity: number
}

const ICONS = [Prohibit, ShareFat, UserGear, UserPlus, Image, TextAa , TextAlignCenter, PushPin ]

export default function SvgRain() {
  const [drops, setDrops] = useState<Drop[]>([])

  useEffect(() => {
    const generated: Drop[] = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 14 + Math.random() * 12,
      duration: 10 + Math.random() * 5,
      delay: Math.random() * 5,
      opacity: 0.2 + Math.random() * 0.5,
    }))
    setDrops(generated)
  }, [])

  return (
    <div className="svgRain">
      {drops.map((d) => {
        const Icon = ICONS[d.id % ICONS.length]

        return (
          <Icon
            key={d.id}
            className="rainItem"
            style={{
              left: `${d.left}%`,
              width: d.size,
              height: d.size,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
              opacity: d.opacity,
            }}
          />
        )
      })}
    </div>
  )
}
