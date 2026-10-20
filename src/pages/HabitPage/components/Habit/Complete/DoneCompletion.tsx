import {
    CheckCircleIcon,
    ListChecksIcon,
    FloppyDiskIcon,
    PencilSimpleIcon,
    PlusIcon,
    TrashIcon,
} from "@phosphor-icons/react"

import "../../../scss/doneComp.scss"
import { useEffect, useRef, useState } from "react"
import { useCalendar } from "../../../../../components/hooks/CalendarHook"
import { api } from "../../../../../components/ts/api"
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook"
import { type DoneCompletion } from "../../../../../components/context/TheHabitContext"
import { useNote } from "../../../../../components/hooks/NoteHook"
import { formatTime, timeToMinutes } from "../../../../../components/ts/utils/dateToStr"
import { DeleteTimer } from "../../../utils/deleteTimer"
import axios from "axios"
import { useTranslation } from "react-i18next"
import { SaveOffIcon } from "lucide-react"
import { useChecklistBlocks } from "../../../../../components/hooks/utils/useChecklistHook"
import { useDelayedDelete } from "../../../../../components/hooks/utils/useDelayedDelete"

export default function DoneCompletion({ isMy }: { isMy: boolean }) {
    const { chosenDay } = useCalendar()
    const { t } = useTranslation("common")
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

    const [editing, setEditing] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState<Set<number>>(new Set())
    const saving = useRef(new Set<number>())
    const mounted = useRef(true)
    const editingRef = useRef(editing)
    editingRef.current = editing

    useEffect(() => {
        mounted.current = true
        return () => { mounted.current = false }
    }, [])


    useEffect(() => {
        setBlocks(previous => [
            ...checklist.map(block => editingRef.current.has(block.id)
                ? previous.find(draft => draft.id === block.id) ?? block
                : block),
            ...previous.filter(block => block.isNew && block.habit_id === habit?.id)
        ])
    }, [checklist, habit?.id, setBlocks])

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
        if (!isMy || !habit || !b.name.trim() || saving.current.has(b.id) || deleting.has(b.id)) return

        saving.current.add(b.id)
        setLoading(prev => new Set(prev).add(b.id))

        try {
            const path = b.isNew ? "save" : "update"

            const res = await api.post(
                `checklist/${path}`,
                { ...b, name: b.name.trim() }
            )
            if (!mounted.current) return

            if (res.data.success) {
                editingRef.current = new Set(editingRef.current)
                editingRef.current.delete(b.id)
                setEditing(previous => {
                    const next = new Set(previous)
                    next.delete(b.id)
                    return next
                })
                if (res.data.block) {
                    const saved = { ...res.data.block, isNew: false, start_time: res.data.block.start_time ?? "", end_time: res.data.block.end_time ?? "" }
                    setBlocks(previous => previous.map(block => block.id === b.id ? saved : block))
                }
                await loadHabit(String(b.habit_id))

                if (mounted.current && b.isNew && !res.data.block) {
                    setBlocks(prev => prev.filter(x => x.id !== b.id))
                }
            } else {
                showNotification("error", res.data.error || "Ошибка сохранения")
            }
        } catch (err) {
            if (!mounted.current || !axios.isAxiosError(err)) return
            showNotification(
                "error",
                err.response?.data?.error || "Ошибка"
            )
        } finally {
            saving.current.delete(b.id)
            if (mounted.current) {
                setLoading(prev => {
                    const next = new Set(prev)
                    next.delete(b.id)
                    return next
                })
            }
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
                {!filteredBlocks.length && <div className="completionEmpty"><ListChecksIcon size={32}/><span>{t("activityCompletion.noBlocks")}</span></div>}
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
                                                type="time"
                                                aria-label={t("activityCompletion.startTime")}
                                                value={b.start_time ?? ""}
                                                disabled={isLoading}
                                                className="doneCompInp"
                                                onChange={e =>
                                                    updateBlock(
                                                        b.id,
                                                        "start_time",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="чч:мм"
                                            />
                                            до
                                            <input
                                                type="time"
                                                aria-label={t("activityCompletion.endTime")}
                                                value={b.end_time ?? ""}
                                                disabled={isLoading}
                                                className="doneCompInp"
                                                onChange={e =>
                                                    updateBlock(
                                                        b.id,
                                                        "end_time",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="чч:мм"
                                            />
                                            :
                                        </>
                                    ) : (
                                        formatTime(b.start_time, b.end_time,)
                                    )}
                                </span>

                                {isEditing ? (
                                    <input
                                        aria-label={t("activityCompletion.blockName")}
                                        placeholder={t("activityCompletion.blockName")}
                                        maxLength={1000}
                                        value={b.name}
                                        disabled={isLoading}
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
                                    <button type="button" disabled={isLoading || deleting.has(b.id) || (isEditing && !b.name.trim())} aria-label={t(isEditing ? "activityCompletion.save" : "activityCompletion.edit")}
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
                                    </button>

                                    <button type="button" disabled={isLoading} aria-label={t(deleting.has(b.id) ? "activityCompletion.cancelDelete" : "activityCompletion.delete")}
                                        className="doneCompDelete doneCompControler"
                                        onClick={() =>
                                            b.isNew
                                                ? setBlocks(previous => previous.filter(block => block.id !== b.id))
                                                : isLoading
                                                ? undefined
                                                : deleting.has(b.id)
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
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {isMy && (
                <button type="button" className="doneCompAdd" onClick={addBlock}>
                    <PlusIcon /> {t("activityCompletion.addBlock")}
                </button>
            )}
        </div>
    )
}
