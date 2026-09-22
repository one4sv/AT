import { useEffect, useRef, useState, useCallback, type ElementType } from "react"
import "../../scss/selector.scss"
import { useSideMenu } from "../hooks/SideMenuHook"

interface selectorArr<T extends string | number> {
    label: string,
    icon?: ElementType,
    func: (value: T) => void,
    value: T
}

export default function Selector<T extends string | number>({
    arr,
    selected
}: {
    arr: selectorArr<T>[],
    selected: T
}) {
    const { setDontHandle, dontHandleOther } = useSideMenu()

    const selectorRef = useRef<HTMLDivElement | null>(null)
    const timerRef = useRef<number | null>(null)
    const longPress = useRef(false)
    const dragging = useRef(false)

    const width = 100 / arr.length
    const selectedIndex = arr.findIndex(i => i.value === selected)

    const [indicator, setIndicator] = useState(0)

    const setSelectedPosition = useCallback(() => {
        if (dragging.current) return

        const selector = selectorRef.current
        if (!selector) return

        const itemWidth = selector.getBoundingClientRect().width / arr.length
        setIndicator(selectedIndex * itemWidth)
    }, [selectedIndex, arr.length])

    useEffect(() => {
        setSelectedPosition()

        window.addEventListener('resize', setSelectedPosition)
        return () => window.removeEventListener('resize', setSelectedPosition)
    }, [setSelectedPosition])

    const changeByPosition = (x: number) => {
        if (dontHandleOther) return
        const selector = selectorRef.current
        if (!selector) return

        const rect = selector.getBoundingClientRect()
        const itemWidth = rect.width / arr.length

        let position = x - rect.left - itemWidth / 2

        if (position < 0) position = 0
        if (position > rect.width - itemWidth) position = rect.width - itemWidth

        setIndicator(position)

        let index = Math.floor((x - rect.left) / itemWidth)
        index = Math.max(0, Math.min(index, arr.length - 1))

        if (arr[index] && arr[index].value !== selected) {
            arr[index].func(arr[index].value)
        }
    }

    const startLongPress = (x: number) => {
        if (dontHandleOther) return

        longPress.current = false
        dragging.current = false

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        // Сразу блокируем меню (ещё до long-press)
        setDontHandle(true)

        timerRef.current = window.setTimeout(() => {
            longPress.current = true
            dragging.current = true
            changeByPosition(x)
        }, 350)
    }

    const move = (x: number) => {
        if (dontHandleOther) return
        if (!dragging.current) return
        changeByPosition(x)
    }

    const end = () => {
        if (dontHandleOther) return

        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        longPress.current = false

        if (dragging.current) {
            dragging.current = false
            setSelectedPosition()
        }

        // Всегда снимаем блокировку
        setDontHandle(false)
    }

    return (
        <div
            className="selector"
            ref={selectorRef}
            onMouseMove={(e) => move(e.clientX)}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchMove={(e) => {
                if (dontHandleOther) return
                e.stopPropagation()          // ← важно
                move(e.touches[0].clientX)
            }}
            onTouchEnd={(e) => {
                e.stopPropagation()
                end()
            }}
            onTouchCancel={(e) => {
                e.stopPropagation()
                end()
            }}
        >
            <div
                className="selectedItem"
                style={{
                    width: `${width}%`,
                    transform: `translateX(${indicator}px)`
                }}
            />

            {arr.map((i, n) => (
                <div
                    className="selectorElement"
                    style={{ width: `${width}%` }}
                    key={n}
                    onMouseDown={(e) => {
                        e.stopPropagation()
                        startLongPress(e.clientX)
                    }}
                    onMouseUp={() => {
                        if (!longPress.current) {
                            i.func(i.value)
                        }
                    }}
                    onTouchStart={(e) => {
                        if (dontHandleOther) return
                        e.stopPropagation()      // ← критично: не даём событию уйти в MobileLayout
                        const touch = e.touches[0]
                        startLongPress(touch.clientX)
                    }}
                    onTouchEnd={(e) => {
                        if (dontHandleOther) return
                        e.stopPropagation()
                        if (!longPress.current) {
                            i.func(i.value)
                        }
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <span
                        className={`selectorSpan ${
                            i.value === selected ? "chosen" : ""
                        }`}
                    >
                        {i.icon ? <i.icon size={20} weight="fill" /> : ""}
                        {i.label}
                    </span>
                </div>
            ))}
        </div>
    )
}