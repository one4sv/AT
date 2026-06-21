import { useEffect, useMemo, useRef, useState } from "react"
import { Prohibit, ShareFat, UserGear, UserPlus, Image, TextAa, TextAlignCenter, PushPin,
  SneakerMove, SoccerBall, Strategy, Volleyball, Hockey, PingPong, Racquet,
  DribbbleLogo, PersonSimpleSwim, PersonSimpleSnowboard, PersonSimpleSki,
  PersonSimpleBike, BowlingBall, BoxingGlove, PersonSimpleWalk, Code,
  BookBookmark, Briefcase, Palette, Camera, Guitar, BowlFood,
  PersonSimpleTaiChi, PersonArmsSpread
} from "@phosphor-icons/react"
import "../../../scss/svgRain.scss"

const ICONS = [Prohibit, ShareFat, UserGear, UserPlus, Image, TextAa, TextAlignCenter, PushPin]
const ICONSHABITS = [
  SneakerMove, SoccerBall, Strategy, Volleyball, Hockey, PingPong, Racquet,
  DribbbleLogo, PersonSimpleSwim, PersonSimpleSnowboard, PersonSimpleSki,
  PersonSimpleBike, BowlingBall, BoxingGlove, PersonSimpleWalk, Code,
  BookBookmark, Briefcase, Palette, Camera, Guitar, BowlFood,
  PersonSimpleTaiChi, PersonArmsSpread
]

type Drop = {
  id: number
  left: number
  size: number
  duration: number
  delay: number
  opacity: number
}

type SvgRainParams = {
  count?: number
  durMin?: number
  durMax?: number
  delayMax?: number
  sizeMin?: number
  sizeMax?: number
  opacityMin?: number
  opacityMax?: number
  refreshInterval?: number
  refreshCount?: number
  startDelay?: number        // ← НОВЫЙ ПАРАМЕТР (в миллисекундах)
}

export default function SvgRain({
  className,
  icons = 0,
  params = {}
}: {
  className?: string
  icons?: number
  params?: SvgRainParams
}) {
  const {
    count = 50,
    durMin = 12,
    durMax = 25,
    delayMax = 3,
    sizeMin = 14,
    sizeMax = 32,
    opacityMin = 0.15,
    opacityMax = 0.65,
    refreshInterval = 1800,
    refreshCount = 6,
    startDelay = 600,           // ← по умолчанию 0.6 секунды
  } = params

  const [drops, setDrops] = useState<Drop[]>([])
  const [isStarted, setIsStarted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const initialDrops = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: sizeMin + Math.random() * (sizeMax - sizeMin),
      duration: durMin + Math.random() * (durMax - durMin),
      delay: Math.random() * delayMax,
      opacity: opacityMin + Math.random() * (opacityMax - opacityMin),
    }))
  }, [count, durMin, durMax, delayMax, sizeMin, sizeMax, opacityMin, opacityMax])

  // Запуск с задержкой
  useEffect(() => {
    const timer = setTimeout(() => {
      setDrops(initialDrops)
      setIsStarted(true)
    }, startDelay)

    return () => clearTimeout(timer)
  }, [initialDrops, startDelay])

  // Обновление части иконок
  useEffect(() => {
    if (!isStarted) return

    const interval = setInterval(() => {
      setDrops(prev => {
        if (prev.length === 0) return prev
        const newDrops = [...prev]
        for (let i = 0; i < refreshCount; i++) {
          const idx = Math.floor(Math.random() * newDrops.length)
          newDrops[idx] = {
            ...newDrops[idx],
            id: Date.now() + i,
            left: Math.random() * 100,
            size: sizeMin + Math.random() * (sizeMax - sizeMin),
            duration: durMin + Math.random() * (durMax - durMin),
            delay: Math.random() * delayMax,
            opacity: opacityMin + Math.random() * (opacityMax - opacityMin),
          }
        }
        return newDrops
      })
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isStarted, refreshInterval, refreshCount, sizeMin, sizeMax, durMin, durMax, delayMax, opacityMin, opacityMax])

  const IconList = icons === 1 ? ICONSHABITS : ICONS

  return (
    <div ref={containerRef} className={`svgRain ${className || ''}`}>
      {drops.map((d) => {
        const IconComponent = IconList[d.id % IconList.length]

        return (
          <IconComponent
            key={d.id}
            className="rainItem"
            style={{
              left: `${d.left}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `-${d.delay}s`,
              opacity: d.opacity,
            }}
          />
        )
      })}
    </div>
  )
}