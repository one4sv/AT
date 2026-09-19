import { useRef, useState, type ElementType } from "react"

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
    const { setDontHandle } = useSideMenu()

    const selectorRef = useRef<HTMLDivElement | null>(null)

    const width = 100 / arr.length
    const selectedIndex = arr.findIndex(i => i.value === selected)

    const [indicator, setIndicator] = useState(0)

    const timerRef = useRef<number | null>(null)

    const longPress = useRef(false)
    const dragging = useRef(false)

    const startX = useRef(0)

    const getItemWidth = () => {
        const selector = selectorRef.current

        if (!selector) return 0

        return selector.getBoundingClientRect().width / arr.length
    }

    const setSelectedPosition = () => {
        const itemWidth = getItemWidth()

        if (itemWidth) {
            setIndicator(selectedIndex * itemWidth)
        }
    }

    const changeByPosition = (x: number) => {
        const selector = selectorRef.current

        if (!selector) return

        const rect = selector.getBoundingClientRect()
        const itemWidth = rect.width / arr.length

        let position = x - rect.left - itemWidth / 2

        if (position < 0) {
            position = 0
        }

        if (position > rect.width - itemWidth) {
            position = rect.width - itemWidth
        }

        setIndicator(position)

        const index = Math.floor(
            (position + itemWidth / 2) / itemWidth
        )

        if (arr[index]) {
            arr[index].func(arr[index].value)
        }
    }

    const startLongPress = (x: number) => {
        startX.current = x

        longPress.current = false
        dragging.current = false

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        timerRef.current = window.setTimeout(() => {
            longPress.current = true
            dragging.current = true

            setDontHandle(true)

            changeByPosition(x)
        }, 350)
    }

    const move = (x: number) => {
        if (!dragging.current) return

        changeByPosition(x)
    }

    const end = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        setSelectedPosition()

        longPress.current = false
        dragging.current = false
    }

    return (
        <div
            className="selector"
            ref={selectorRef}
            onMouseMove={(e) => {
                move(e.clientX)
            }}
            onMouseUp={end}
            onMouseLeave={end}
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
                    style={{
                        width: `${width}%`
                    }}
                    key={n}

                    onMouseDown={(e) => {
                        startLongPress(e.clientX)
                    }}

                    onMouseUp={() => {
                        if (!longPress.current) {
                            i.func(i.value)
                        }

                        end()
                    }}

                    onTouchStart={(e) => {
                        const touch = e.touches[0]

                        startLongPress(touch.clientX)
                    }}

                    onTouchMove={(e) => {
                        const touch = e.touches[0]

                        move(touch.clientX)
                    }}

                    onTouchEnd={() => {
                        if (!longPress.current) {
                            i.func(i.value)
                        }

                        end()
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