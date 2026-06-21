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
import { formatTime, timeToMinutes } from "../../../../../components/ts/utils/dateToStr"
import { DeleteTimer } from "../../../utils/deleteTimer"
import axios from "axios"
import { SaveOffIcon } from "lucide-react"
import { useChecklistBlocks } from "../../../../../components/hooks/utils/useChecklistHook"
import { useDelayedDelete } from "../../../../../components/hooks/utils/useDelayedDelete"

export default function DoneCompletion({ isMy }: { isMy: boolean }) {
    const { chosenDay } = useCalendar()
    const { loadHabit, habit, checklist } = useTheHabit()
    const { showNotification } = useNote()

    const {
        blocks,
        setBlocks,
        addBlock: addBlockBase,
        updateBlock,
    } = useChecklistBlocks(checklist)

    const {
        deleting,
        progress: deleteProgress,
        timeLeft: deleteTimeLeft,
        requestDelete,
        cancelDelete,
    } = useDelayedDelete()

    const API_URL = import.meta.env.VITE_API_URL

    const [editing, setEditing] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState<Set<number>>(new Set())


    useEffect(() => {
        setBlocks(checklist)
    }, [checklist])

    const addBlock = () => {
        if (!habit) return

        const id = addBlockBase(habit.id, chosenDay)
        toggleEdit(id)
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
                    setBlocks(prev => prev.filter(x => x.id !== b.id))
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

    const filteredBlocks = [
        ...blocks
            .filter(
                b =>
                    b.date === chosenDay &&
                    b.habit_id === habit?.id
            )
            .sort(
                (a, b) =>
                    timeToMinutes(a.start_time) -
                    timeToMinutes(b.start_time)
            ),
    ]

    return (
        <div className="doneCompletionDiv">
            <div className="doneComps">
                {filteredBlocks.map(b => {
                    const isEditing = editing.has(b.id)
                    const isLoading = loading.has(b.id)

                    return (
                        <div
                            className={`doneComp ${
                                (b.start_time || "").trim() === "" &&
                                (b.end_time || "").trim() === "" &&
                                !isEditing &&
                                "doneCompSmall"
                            }`}
                            key={b.id}
                        >
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
                                                placeholder="чч:мм"
                                                pattern="^[\\d.:]{0,5}$"
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
                                                placeholder="чч:мм"
                                                pattern="^[\\d.:]{0,5}$"
                                            />
                                            :
                                        </>
                                    ) : (
                                        formatTime(b.start_time, b.end_time,)
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
                                        minLength={1}
                                    />
                                ) : (
                                    <span>{b.name}</span>
                                )}
                            </div>

                            {isMy && (
                                <div className="doneCompContolers">
                                    <div
                                        className="doneCompControler"
                                        onClick={() =>
                                            isEditing
                                                ? saveBlock(b)
                                                : toggleEdit(b.id)
                                        }
                                    >
                                        {isEditing ? (
                                            isLoading ? (
                                                <FloppyDiskIcon
                                                    className="doneCompControlerSaving"
                                                    size={20}
                                                />
                                            ) : b.name.trim() !== "" ? (
                                                <CheckCircleIcon
                                                    className="doneCompControlerReady"
                                                    size={20}
                                                />
                                            ) : (
                                                <SaveOffIcon
                                                    className="doneCompControlerEmpty"
                                                    size={20}
                                                />
                                            )
                                        ) : (
                                            <PencilSimpleIcon
                                                className="doneCompControlerEdit"
                                                size={20}
                                            />
                                        )}
                                    </div>

                                    <div
                                        className="doneCompDelete doneCompControler"
                                        onClick={() =>
                                            deleting.has(b.id)
                                                ? cancelDelete(b.id)
                                                : requestDelete(b.id)
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