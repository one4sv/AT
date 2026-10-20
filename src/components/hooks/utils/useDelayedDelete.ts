import { useEffect, useRef, useState } from "react"
import { api } from "../../ts/api"
import { useTheHabit } from "../TheHabitHook"
import axios from "axios"
import { useNote } from "../NoteHook"

export function useDelayedDelete() {
    const { loadHabit, habit } = useTheHabit()
    const { showNotification } = useNote()
    const [deleting, setDeleting] = useState<Set<number>>(new Set())
    const [progress, setProgress] = useState<Record<number, number>>({})
    const [timeLeft, setTimeLeft] = useState<Record<number, number>>({})
    const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
    const frames = useRef(new Map<number, number>())
    const pending = useRef(new Set<number>())
    const mounted = useRef(true)
    const generation = useRef(0)
    const delay = 4000

    useEffect(() => {
        mounted.current = true
        const activeTimers = timers.current
        const activeFrames = frames.current
        const activePending = pending.current
        setDeleting(new Set())
        setProgress({})
        setTimeLeft({})
        return () => {
            generation.current += 1
            mounted.current = false
            activeTimers.forEach(clearTimeout)
            activeFrames.forEach(cancelAnimationFrame)
            activeTimers.clear()
            activeFrames.clear()
            activePending.clear()
        }
    }, [habit?.id])

    const clearDelete = (id: number) => {
        const timer = timers.current.get(id)
        const frame = frames.current.get(id)
        if (timer !== undefined) clearTimeout(timer)
        if (frame !== undefined) cancelAnimationFrame(frame)
        timers.current.delete(id)
        frames.current.delete(id)
        if (!mounted.current) return
        setDeleting(previous => {
            const next = new Set(previous)
            next.delete(id)
            return next
        })
        setProgress(previous => {
            const next = { ...previous }
            delete next[id]
            return next
        })
        setTimeLeft(previous => {
            const next = { ...previous }
            delete next[id]
            return next
        })
    }

    const requestDelete = (id: number) => {
        if (!habit || timers.current.has(id) || pending.current.has(id)) return
        const habitId = habit.id
        const currentGeneration = generation.current
        const startedAt = performance.now()
        setDeleting(previous => new Set(previous).add(id))
        setProgress(previous => ({ ...previous, [id]: 0 }))
        setTimeLeft(previous => ({ ...previous, [id]: 4 }))

        const tick = () => {
            if (!mounted.current || !timers.current.has(id)) return
            const value = Math.min((performance.now() - startedAt) / delay, 1)
            setProgress(previous => ({ ...previous, [id]: value }))
            setTimeLeft(previous => ({ ...previous, [id]: Math.ceil((1 - value) * 4) }))
            if (value < 1) frames.current.set(id, requestAnimationFrame(tick))
        }

        const timer = setTimeout(async () => {
            pending.current.add(id)
            try {
                const response = await api.post("checklist/delete", { id })
                if (generation.current !== currentGeneration) return
                if (response.data.success && mounted.current) await loadHabit(String(habitId))
                else if (!response.data.success && mounted.current) showNotification("error", response.data.error || "Ошибка удаления")
            } catch (error) {
                if (mounted.current && generation.current === currentGeneration) showNotification("error", axios.isAxiosError(error) ? error.response?.data?.error || "Ошибка удаления" : "Ошибка удаления")
            } finally {
                if (generation.current === currentGeneration) {
                    pending.current.delete(id)
                    clearDelete(id)
                }
            }
        }, delay)

        timers.current.set(id, timer)
        frames.current.set(id, requestAnimationFrame(tick))
    }

    const cancelDelete = (id: number) => {
        if (!pending.current.has(id)) clearDelete(id)
    }

    return { deleting, progress, timeLeft, requestDelete, cancelDelete }
}
