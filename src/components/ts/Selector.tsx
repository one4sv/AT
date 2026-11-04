import { useEffect, useRef, useState, type ElementType, type PointerEvent } from "react"
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
    const pointerId = useRef<number | null>(null)
    const selectedIndex = arr.findIndex(i => i.value === selected)
    const [ indicator, setIndicator ] = useState(Math.max(0, selectedIndex))

    useEffect(() => {
        if (pointerId.current === null) setIndicator(Math.max(0, selectedIndex))
    }, [selectedIndex])

    useEffect(() => () => {
        pointerId.current = null
        setDontHandle(false)
    }, [setDontHandle])

    const findIndex = (x: number) => {
        const rect = selectorRef.current?.getBoundingClientRect()
        if (!rect || !arr.length || rect.width <= 0) return -1
        return Math.max(0, Math.min(arr.length - 1, Math.floor((x - rect.left) / (rect.width / arr.length))))
    }

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === "mouse" && e.button !== 0) return
        e.stopPropagation()
        e.preventDefault()
        if (pointerId.current !== null) return

        pointerId.current = e.pointerId
        setDontHandle(true)
        e.currentTarget.setPointerCapture(e.pointerId)
        const index = findIndex(e.clientX)
        if (index >= 0) setIndicator(index)
    }

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (pointerId.current !== e.pointerId) return
        e.stopPropagation()
        const index = findIndex(e.clientX)
        if (index >= 0) setIndicator(index)
    }

    const releasePointer = (e: PointerEvent<HTMLDivElement>, cancel = false) => {
        if (pointerId.current !== e.pointerId) return
        e.stopPropagation()
        e.preventDefault()

        const index = findIndex(e.clientX)
        pointerId.current = null
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId)
        }
        setDontHandle(false)

        if (cancel || index < 0) {
            setIndicator(Math.max(0, selectedIndex))
            return
        }
        setIndicator(index)
        if (arr[index].value !== selected) arr[index].func(arr[index].value)
    }

    return (
        <div
            className="selector"
            ref={selectorRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={releasePointer}
            onPointerCancel={e => releasePointer(e, true)}
            onTouchStart={e => e.stopPropagation()}
            onTouchMove={e => {
                e.stopPropagation()
                if (e.cancelable) e.preventDefault()
            }}
            onTouchEnd={e => e.stopPropagation()}
            onTouchCancel={e => e.stopPropagation()}
            onContextMenu={e => e.preventDefault()}
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
                    tabIndex={0}
                    role="button"
                    aria-pressed={selected === i.value}
                    onKeyDown={e => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            i.func(i.value)
                        }
                    }}
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
