import { useEffect, useRef, useState } from "react"

import { useSettings } from "../../../components/hooks/SettingsHook"

interface ColorItem {
    value: string
    dark: string
    light: string
}

export default function ColorSelector({
    arr,
    value,
    setNew
}: {
    arr: ColorItem[],
    value: string,
    setNew: (val: string) => void
}) {
    const { isDark } = useSettings()

    const wrapperRef = useRef<HTMLDivElement | null>(null)

    const index = arr.findIndex(i => i.value === value)

    const [indicator, setIndicator] = useState(0)

    const timerRef = useRef<number | null>(null)

    const dragging = useRef(false)

    const longPress = useRef(false)

    const clickBlocked = useRef(false)


    const getItemStep = () => {
        const wrapper = wrapperRef.current

        if (!wrapper) return 0

        const item = wrapper.querySelector(".colorButt") as HTMLElement

        if (!item) return 0

        const style = getComputedStyle(wrapper)

        const gap = parseFloat(style.gap)

        return item.offsetWidth + gap
    }


    const setSelectedPosition = () => {
        const step = getItemStep()

        if (step) {
            setIndicator(index * step + 2)
        }
    }


    useEffect(() => {
        setSelectedPosition()
    }, [index, arr.length])


    const changeByPosition = (x: number) => {
        const wrapper = wrapperRef.current

        if (!wrapper) return

        const rect = wrapper.getBoundingClientRect()

        const step = getItemStep()

        if (!step) return

        const item = wrapper.querySelector(".colorButt") as HTMLElement

        const itemWidth = item.offsetWidth

        let position = x - rect.left - itemWidth / 2

        const max = (arr.length - 1) * step

        if (position < 0) {
            position = 0
        }

        if (position > max) {
            position = max
        }

        setIndicator(position)

        const newIndex = Math.round(position / step)

        if (arr[newIndex]) {
            setNew(arr[newIndex].value)
        }
    }


    const startLongPress = (x: number) => {
        longPress.current = false
        dragging.current = false
        clickBlocked.current = false

        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }

        timerRef.current = window.setTimeout(() => {
            longPress.current = true
            dragging.current = true
            clickBlocked.current = true

            changeByPosition(x)
        }, 350)
    }


    const move = (x: number) => {
        if (!dragging.current) return

        changeByPosition(x)
    }


    const click = (val: string) => {
        if (clickBlocked.current) return

        setNew(val)
    }


    const end = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }

        if (dragging.current) {
            setSelectedPosition()
        }

        dragging.current = false
        longPress.current = false
    }


    return (
        <div
            className="colorSelectorWrapper"
            ref={wrapperRef}

            onMouseMove={(e) => {
                move(e.clientX)
            }}

            onMouseUp={end}

            onMouseLeave={end}
        >
            <div
                className="colorSelected"
                style={{
                    transform: `translateX(${indicator}px)`
                }}
            />

            {arr.map(a => (
                <div
                    className="colorButt"
                    key={a.value}

                    onClick={() => {
                        click(a.value)
                    }}

                    onMouseDown={(e) => {
                        startLongPress(e.clientX)
                    }}

                    onMouseUp={end}

                    onTouchStart={(e) => {
                        const touch = e.touches[0]

                        startLongPress(touch.clientX)
                    }}

                    onTouchMove={(e) => {
                        const touch = e.touches[0]

                        move(touch.clientX)
                    }}

                    onTouchEnd={end}

                    onContextMenu={(e) => {
                        e.preventDefault()
                    }}
                >
                    <div
                        className="colorPicker"
                        style={{
                            backgroundColor: isDark
                                ? a.dark
                                : a.light
                        }}
                    />
                </div>
            ))}
        </div>
    )
}