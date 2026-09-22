import { useEffect, useRef, useState, useCallback } from "react"
import { useSettings } from "../../../components/hooks/SettingsHook"
import { useSideMenu } from "../../../components/hooks/SideMenuHook"
import { isMobile } from "react-device-detect"

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
    const { setDontHandle, dontHandleOther } = useSideMenu()
    
    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const itemsRef = useRef<(HTMLDivElement | null)[]>([])
    const index = arr.findIndex(i => i.value === value)
    
    const [indicator, setIndicator] = useState(0)
    const [gradientObj, setGradientObj] = useState({
        bgImage: "none",
        bgSize: "0px 100%"
    })
    
    // Добавляем ref для отслеживания первоначальной загрузки
    const isInitial = useRef(true)
    
    const timerRef = useRef<number | null>(null)
    const dragging = useRef(false)
    const longPress = useRef(false)
    const clickBlocked = useRef(false)
    const gradientWidth = isMobile ? 18 : 20

    const updateLayout = useCallback(() => {
        if (!wrapperRef.current || !itemsRef.current.length) return
        const wrapper = wrapperRef.current
        const selectedEl = wrapper.querySelector(".colorSelected") as HTMLElement

        if (!selectedEl) return
        const selWidth = selectedEl.offsetWidth
        
        if (!dragging.current) {
            const activeItem = itemsRef.current[index]
            if (activeItem) {
                const pos =
                    activeItem.offsetLeft +
                    (activeItem.offsetWidth - selWidth) / 2

                setIndicator(pos)
            }
        }

        const centers = arr
            .map((_, i) => {
                const item = itemsRef.current[i]
                if (!item) return null
                return item.offsetLeft + item.offsetWidth / 2
            })
            .filter((value): value is number => value !== null)

        if (centers.length === 0) return

        const stops: string[] = []

        arr.forEach((a, i) => {
            const center = centers[i]
            if (center === undefined) return
            const color = isDark ? a.dark : a.light
            
            if (i === 0) {
                stops.push(`${color} 0px`)
            }
            if (i > 0) {
                const previousCenter = centers[i - 1]
                if (previousCenter === undefined) return
                const transitionCenter = (previousCenter + center) / 2
                stops.push(
                    `${isDark ? arr[i - 1].dark : arr[i - 1].light} ${transitionCenter - gradientWidth / 2}px`,
                    `${color} ${transitionCenter + gradientWidth / 2}px`
                )
            }
            if (i === arr.length - 1) {
                stops.push(`${color} ${wrapper.scrollWidth}px`)
            }
        })

        setGradientObj({
            bgImage: `linear-gradient(to right, ${stops.join(", ")})`,
            bgSize: `${wrapper.scrollWidth}px 100%`
        })
    }, [index, arr, isDark, gradientWidth])

    useEffect(() => {
        updateLayout()
        
        // Снимаем флаг первой загрузки после применения верстки (даем браузеру 50мс на отрисовку без анимации)
        const initTimer = setTimeout(() => {
            isInitial.current = false
        }, 50)
        
        window.addEventListener("resize", updateLayout)

        return () => {
            clearTimeout(initTimer)
            window.removeEventListener("resize", updateLayout)
        }
    }, [updateLayout])

    const changeByPosition = (x: number) => {
        const wrapper = wrapperRef.current
        if (!wrapper) return
        const rect = wrapper.getBoundingClientRect()
        const contentX = x - rect.left + wrapper.scrollLeft

        const selectedEl = wrapper.querySelector(".colorSelected") as HTMLElement
        const selWidth = selectedEl ? selectedEl.offsetWidth : 0
        
        let pos = contentX - selWidth / 2

        if (pos < 0) pos = 0
        const max = wrapper.scrollWidth - selWidth
        if (pos > max) pos = max
        
        setIndicator(pos)
        
        let closestIndex = index
        let minDiff = Infinity
        
        itemsRef.current.forEach((item, i) => {
            if (!item) return
            const center = item.offsetLeft + item.offsetWidth / 2
            const diff = Math.abs(contentX - center)

            if (diff < minDiff) {
                minDiff = diff
                closestIndex = i
            }
        })

        if (arr[closestIndex] && arr[closestIndex].value !== value) {
            setNew(arr[closestIndex].value)
        }
    }

    const startLongPress = (x: number) => {
        if (dontHandleOther) return
        longPress.current = false
        dragging.current = false
        clickBlocked.current = false
        setDontHandle(true)
        
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
            dragging.current = false
            updateLayout()
        }

        longPress.current = false

        setTimeout(() => {
            clickBlocked.current = false
        }, 50)
    }

    return (
        <div
            className="colorSelectorWrapper"
            ref={wrapperRef}
            onMouseMove={e => move(e.clientX)}
            onMouseUp={end}
            onMouseLeave={end}
        >
            {arr.map((a, i) => (
                <div
                    className="colorButt"
                    key={a.value}
                    ref={el => {
                        itemsRef.current[i] = el
                    }}
                    onClick={() => click(a.value)}
                    onMouseDown={e => startLongPress(e.clientX)}
                    onMouseUp={end}
                    onTouchStart={e => startLongPress(e.touches[0].clientX)}
                    onTouchMove={e => move(e.touches[0].clientX)}
                    onTouchEnd={end}
                    onContextMenu={e => e.preventDefault()}
                >
                    <div
                        className="colorPicker"
                        style={{
                            backgroundColor: isDark ? a.dark : a.light
                        }}
                    />
                </div>
            ))}

            <div
                className="colorSelected"
                style={{
                    transform: `translateX(${indicator}px)`,
                    backgroundPosition: `${-indicator}px center`,
                    backgroundImage: gradientObj.bgImage,
                    backgroundSize: gradientObj.bgSize,
                    transition: isInitial.current
                        ? "none"
                        : "transform 0.3s ease, background-position 0.3s ease"
                }}
            />
        </div>
    )
}