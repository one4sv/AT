import {
    CheckCircleIcon,
    FloppyDiskIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
} from "@phosphor-icons/react"

import "../../../scss/doneComp.scss"
import { useEffect, useState } from "react"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { api } from "../../../../../components/ts/api"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { type DoneCompletion } from "../../../../../components/context/TheHabitContext"
import { useNote } from "../../../../../components/hooks/NoteHook"
import { timeToMinutes } from "../../../utils/dateToStr"
import { DeleteTimer } from "../../../utils/deleteTimer"
import axios from "axios"
import { SaveOffIcon } from "lucide-react"

export default function DoneCompletion({ isMy }: { isMy: boolean }) {
    const { chosenDay } = useCalendar()
    const { loadHabit, habit, checklist } = useTheHabit()
    const { showNotification } = useNote()

    const [blocks, setBlocks] = useState<DoneCompletion[]>([])
    const [editing, setEditing] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState<Set<number>>(new Set())
    const [deleting, setDeleting] = useState<Set<number>>(new Set())
    const [deleteTimers, setDeleteTimers] = useState<Map<number, ReturnType<typeof setTimeout>>>(new Map())
    const [deleteProgress, setDeleteProgress] = useState<Record<number, number>>({})
    const [deleteTimeLeft, setDeleteTimeLeft] = useState<Record<number, number>>({})

    const API_URL = import.meta.env.VITE_API_URL

    useEffect(() => {
        setBlocks(checklist)
    }, [checklist])

    const generateId = () => Date.now() + Math.random()

    const addBlock = () => {
        if (!habit) return

        const id = generateId()

        setBlocks(prev => [
            ...prev,
            {
                id,
                start_time: "",
                end_time: "",
                name: "",
                date: chosenDay,
                habit_id: habit.id,
                isNew: true
            }
        ])

        setEditing(prev => new Set(prev).add(id))
    }

    const deleteBlock = (b: DoneCompletion) => {
        if (b.isNew) {
            setBlocks(prev => prev.filter(x => x.id !== b.id))
            return
        }

        if (deleting.has(b.id)) return

        setDeleting(prev => new Set(prev).add(b.id))

        const timer = setTimeout(async () => {
            try {
                const res = await api.post(`${API_URL}checklist/delete`, {
                    id: b.id
                })

                if (res.data.success) {
                    loadHabit(String(habit?.id))
                }
            } catch (err) {
                if (!axios.isAxiosError(err)) return
                showNotification(
                    "error",
                    err?.response?.data?.error || "Ошибка удаления"
                )
            } finally {
                setDeleting(prev => {
                    const next = new Set(prev)
                    next.delete(b.id)
                    return next
                })

                setDeleteTimers(prev => {
                    const next = new Map(prev)
                    next.delete(b.id)
                    return next
                })

                setDeleteProgress(prev => {
                    const next = { ...prev }
                    delete next[b.id]
                    return next
                })

                setDeleteTimeLeft(prev => {
                    const next = { ...prev }
                    delete next[b.id]
                    return next
                })
            }
        }, 4000)

        setDeleteTimers(prev => {
            const next = new Map(prev)
            next.set(b.id, timer)
            return next
        })

        startDeleteAnimation(b.id)
    }

    const cancelDelete = (id: number) => {
        const timer = deleteTimers.get(id)

        if (timer) clearTimeout(timer)

        setDeleteTimers(prev => {
            const next = new Map(prev)
            next.delete(id)
            return next
        })

        setDeleting(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })

        setDeleteProgress(prev => {
            const next = { ...prev }
            delete next[id]
            return next
        })

        setDeleteTimeLeft(prev => {
            const next = { ...prev }
            delete next[id]
            return next
        })
    }

    const startDeleteAnimation = (id: number) => {
        const duration = 4000
        const start = Date.now()

        const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)

            setDeleteProgress(prev => ({
                ...prev,
                [id]: progress
            }))

            setDeleteTimeLeft(prev => ({
                ...prev,
                [id]: Math.ceil((1 - progress) * 4)
            }))

            if (progress < 1) {
                requestAnimationFrame(tick)
            }
        }

        requestAnimationFrame(tick)
    }

    const updateBlock = (
        id: number,
        field: keyof DoneCompletion,
        value: string
    ) => {
        setBlocks(prev =>
            prev.map(b =>
                b.id === id ? { ...b, [field]: value } : b
            )
        )
    }

    const toggleEdit = (id: number) => {
        setEditing(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const saveBlock = async (b: DoneCompletion) => {
        if (!b.name.trim()) return

        setLoading(prev => new Set(prev).add(b.id))

        try {
            const path = b.isNew ? "save" : "update"

            const res = await api.post(
                `${API_URL}checklist/${path}`,
                b
            )

            if (res.data.success) {
                toggleEdit(b.id)
                loadHabit(String(habit?.id))

                if (b.isNew) {
                    setBlocks(prev =>
                        prev.filter(x => x.id !== b.id)
                    )
                }
            }
        } catch (err) {
            if (!axios.isAxiosError(err)) return
            showNotification(
                "error",
                err.response?.data?.error || "Ошибка"
            )
        } finally {
            setLoading(prev => {
                const next = new Set(prev)
                next.delete(b.id)
                return next
            })
        }
    }

    const formatTime = (b: DoneCompletion) => {
        if (b.start_time && b.end_time)
            return `${b.start_time} - ${b.end_time}:`
        if (b.start_time) return `с ${b.start_time}:`
        if (b.end_time) return `до ${b.end_time}:`
        return ""
    }

    const filteredBlocks = [
        ...blocks
            .filter(
                b =>
                    b.date === chosenDay &&
                    b.habit_id === habit?.id &&
                    !b.isNew
            )
            .sort(
                (a, b) =>
                    timeToMinutes(a.start_time) -
                    timeToMinutes(b.start_time)
            ),

        ...blocks.filter(
            b =>
                b.date === chosenDay &&
                b.habit_id === habit?.id &&
                b.isNew
        )
    ]

    return (
        <div className="doneCompletionDiv">
            <div className="doneComps">
                {filteredBlocks.map(b => {
                    const isEditing = editing.has(b.id)
                    const isLoading = loading.has(b.id)

                    return (
                        <div className="doneComp" key={b.id}>
                            <div className="doneButtInfo">
                                <span className="scheduleButtSpan">
                                    {isEditing ? (
                                        <>
                                            с{" "}
                                            <input
                                                value={b.start_time}
                                                className="doneCompInp"
                                                onChange={e =>
                                                    updateBlock(
                                                        b.id,
                                                        "start_time",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            до
                                            <input
                                                value={b.end_time}
                                                className="doneCompInp"
                                                onChange={e =>
                                                    updateBlock(
                                                        b.id,
                                                        "end_time",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                            :
                                        </>
                                    ) : (
                                        formatTime(b)
                                    )}
                                </span>

                                {isEditing ? (
                                    <input
                                        value={b.name}
                                        className="doneCompInp dciw"
                                        onChange={e =>
                                            updateBlock(
                                                b.id,
                                                "name",
                                                e.target.value
                                            )
                                        }
                                    />
                                ) : (
                                    <span>{b.name}</span>
                                )}
                            </div>

                            {isMy && (
                                <div className="doneCompContolers">
                                    <div
                                        className="doneCompControler"
                                        onClick={() => isEditing ? saveBlock(b) : toggleEdit(b.id)}
                                    >
                                        {isEditing ? (
                                            isLoading ? (
                                                <FloppyDiskIcon className="doneCompControlerSaving" size={20}/>
                                            ) : (
                                                b.name.trim() !== ""
                                                    ? <CheckCircleIcon className="doneCompControlerReady" size={20}/>
                                                    : <SaveOffIcon className="doneCompControlerEmpty" size={20}/>
                                            )
                                        ) : (
                                            <PencilSimpleIcon className="doneCompControlerEdit" size={20}/>
                                        )}
                                    </div>

                                    <div
                                        className="doneCompDelete doneCompControler"
                                        onClick={() =>
                                            deleting.has(b.id)
                                                ? cancelDelete(b.id)
                                                : deleteBlock(b)
                                        }
                                    >
                                        {deleting.has(b.id) ? (
                                            <DeleteTimer
                                                progress={
                                                    deleteProgress[b.id] || 0
                                                }
                                                timeLeft={
                                                    deleteTimeLeft[b.id] ?? 4
                                                }
                                            />
                                        ) : (
                                            <TrashIcon size={20} />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {isMy && (
                <div className="doneCompAdd" onClick={addBlock}>
                    <PlusIcon /> Добавить блок
                </div>
            )}
        </div>
    )
}