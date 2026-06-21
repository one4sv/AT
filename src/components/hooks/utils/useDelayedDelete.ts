import { useRef, useState } from "react"
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
    
    const API_URL = import.meta.env.VITE_API_URL

    const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
    const delay = 4000
    const startAnimation = (id: number) => {
        const start = Date.now()

        const tick = () => {
            const elapsed = Date.now() - start
            const p = Math.min(elapsed / delay, 1)

            setProgress(prev => ({ ...prev, [id]: p }))
            setTimeLeft(prev => ({ ...prev, [id]: Math.ceil((1 - p) * (delay / 1000)) }))

            if (p < 1) requestAnimationFrame(tick)
        }

        requestAnimationFrame(tick)
    }

    const requestDelete = (id: number) => {
        if (deleting.has(id)) return

        setDeleting(prev => new Set(prev).add(id))

        const timer = setTimeout(async () => {
            try {
                const res = await api.post(`${API_URL}checklist/delete`, { id })
    
                if (res.data.success) {
                    loadHabit(String(habit?.id))
                }
            } catch (err) {
                if (!axios.isAxiosError(err)) return
                showNotification(
                    "error",
                    err.response?.data?.error || "Ошибка удаления"
                )
            }

            setDeleting(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })

            setProgress(prev => {
                const next = { ...prev }
                delete next[id]
                return next
            })

            setTimeLeft(prev => {
                const next = { ...prev }
                delete next[id]
                return next
            })

            timers.current.delete(id)
        }, delay)

        timers.current.set(id, timer)
        startAnimation(id)
    }

    const cancelDelete = (id: number) => {
        const timer = timers.current.get(id)
        if (timer) clearTimeout(timer)

        timers.current.delete(id)

        setDeleting(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
    }

    return {
        deleting,
        progress,
        timeLeft,
        requestDelete,
        cancelDelete,
    }
}