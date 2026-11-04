import { useEffect, useRef, useState, type ElementType } from "react"
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
    const pressed = useRef(false)
    const selectedIndex = arr.findIndex(i => i.value === selected)
    const [ indicator, setIndicator ] = useState(Math.max(0, selectedIndex))

    useEffect(() => {
        if (!dragging.current) setIndicator(Math.max(0, selectedIndex))
    }, [selectedIndex])

    useEffect(() => () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setDontHandle(false)
    }, [setDontHandle])

    const changeByPosition = (x: number) => {
        if (dontHandleOther || !arr.length) return
        const selector = selectorRef.current
        if (!selector) return

        const rect = selector.getBoundingClientRect()
        const index = Math.max(0, Math.min(arr.length - 1, Math.floor((x - rect.left) / (rect.width / arr.length))))
        setIndicator(index)

        if (arr[index] && arr[index].value !== selected) arr[index].func(arr[index].value)
    }

    const startLongPress = (x: number) => {
        if (dontHandleOther) return

        pressed.current = true
        longPress.current = false
        dragging.current = false
        if (timerRef.current) clearTimeout(timerRef.current)
        setDontHandle(true)

        timerRef.current = window.setTimeout(() => {
            if (!pressed.current) return
            longPress.current = true
            dragging.current = true
            changeByPosition(x)
        }, 350)
    }

    const move = (x: number) => {
        if (!dragging.current || dontHandleOther) return
        changeByPosition(x)
    }

    const end = () => {
        pressed.current = false
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        if (dragging.current) dragging.current = false
        else setIndicator(Math.max(0, selectedIndex))

        longPress.current = false
        setDontHandle(false)
    }

    return (
        <div
            className="selector"
            ref={selectorRef}
            onMouseMove={e => move(e.clientX)}
            onMouseUp={end}
            onMouseLeave={end}
            onTouchMove={e => {
                if (dontHandleOther) return
                e.stopPropagation()
                move(e.touches[0].clientX)
            }}
            onTouchEnd={e => {
                e.stopPropagation()
                end()
            }}
            onTouchCancel={e => {
                e.stopPropagation()
                end()
            }}
        >
            <div
                className="selectedItem"
                style={{
                    width: `${100 / arr.length}%`,
                    transform: `translateX(${indicator * 100}%)`
                }}
            />

            {arr.map((i, n) => (
                <div
                    className="selectorElement"
                    style={{ width: `${100 / arr.length}%` }}
                    key={n}
                    onMouseDown={e => {
                        e.stopPropagation()
                        startLongPress(e.clientX)
                    }}
                    onMouseUp={() => {
                        if (!longPress.current) {
                            setIndicator(n)
                            i.func(i.value)
                        }
                    }}
                    onTouchStart={e => {
                        if (dontHandleOther) return
                        e.stopPropagation()
                        startLongPress(e.touches[0].clientX)
                    }}
                    onTouchEnd={e => {
                        if (dontHandleOther) return
                        e.stopPropagation()
                        if (!longPress.current) {
                            setIndicator(n)
                            i.func(i.value)
                        }
                    }}
                    onContextMenu={e => e.preventDefault()}
                >
                    <span className={`selectorSpan ${i.value === selected ? "chosen" : ""}`}>
                        {i.icon ? <i.icon size={20} weight="fill" /> : ""}
                        {i.label}
                    </span>
                </div>
            ))}
        </div>
    )
}
