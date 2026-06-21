import { ArrowUUpLeftIcon, CheckCircleIcon, FloppyDiskIcon, GearIcon, PencilIcon, PencilSimpleIcon, PencilSimpleLineIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import "../../../scss/checklist.scss"
import { useCalendar } from "../../../../../components/hooks/CalendarHook";
import { useTheHabit } from "../../../../../components/hooks/TheHabitHook";
import { formatTime, timeToMinutes } from "../../../../../components/ts/utils/dateToStr";
import { SaveOffIcon } from "lucide-react";
import { DeleteTimer } from "../../../utils/deleteTimer";

export default function Checklist({ isMy }: { isMy:boolean }) {
    const { chosenDay } = useCalendar()
    const { pattern, checklist, habit } = useTheHabit()

    const [ editing, setEditing ] = useState<Set<number>>(new Set())
    const [ loading, setLoading ] = useState<Set<number>>(new Set())
    const [ editChecklist, setEditChecklist ] = useState(false)

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

    const filteredBlocks = [
        ...(checklist ?? [])
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
    const sorted = [...pattern].sort(
        (a, b) =>
            timeToMinutes(a.start_time) -
            timeToMinutes(b.start_time)
    )

    return (
        <div className="doneCompletionDiv">
            <div className="doneComps dnh">
                {sorted.map((p) => {
                    const isEditing = editing.has(p.id)
                    const isLoading = loading.has(p.id)

                    return(
                        <div
                            className={`doneComp ${
                                (p.start_time || "").trim() === "" &&
                                (p.end_time || "").trim() === "" &&
                                !isEditing &&
                                "doneCompSmall"
                            }`}
                            key={p.id}
                        >
                            <div className="doneButtInfo">
                                <span className="scheduleButtSpan">
                                    {isEditing ? (
                                        <>
                                            с{" "}
                                            <input
                                                value={p.start_time}
                                                className="doneCompInp"
                                                // onChange={e =>
                                                //     updateBlock(
                                                //         p.id,
                                                //         "start_time",
                                                //         e.target.value
                                                //     )
                                                // }
                                                placeholder="чч:мм"
                                                pattern="^[\\d.:]{0,5}$"
                                            />
                                            до
                                            <input
                                                value={p.end_time}
                                                className="doneCompInp"
                                                // onChange={e =>
                                                //     updateBlock(
                                                //         p.id,
                                                //         "end_time",
                                                //         e.target.value
                                                //     )
                                                // }
                                                placeholder="чч:мм"
                                                pattern="^[\\d.:]{0,5}$"
                                            />
                                            :
                                        </>
                                    ) : (
                                        formatTime(p.start_time, p.end_time,)
                                    )}
                                </span>

                                {isEditing ? (
                                    <input
                                        value={p.name}
                                        className="doneCompInp dciw"
                                        // onChange={e =>
                                        //     updateBlock(
                                        //         p.id,
                                        //         "name",
                                        //         e.target.value
                                        //     )
                                        // }
                                        minLength={1}
                                    />
                                ) : (
                                    <span>{p.name}</span>
                                )}
                            </div>

                            {isMy && (
                                <div className="doneCompContolers">
                                    <div
                                        className="doneCompControler"
                                        // onClick={() =>
                                        //     isEditing
                                        //         ? saveBlock(b)
                                        //         : toggleEdit(b.id)
                                        // }
                                    >
                                        {isEditing ? (
                                            isLoading ? (
                                                <FloppyDiskIcon
                                                    className="doneCompControlerSaving"
                                                    size={20}
                                                />
                                            ) : p.name.trim() !== "" ? (
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
                                        // onClick={() =>
                                        //     deleting.has(p.id)
                                        //         ? cancelDelete(p.id)
                                        //         : requestDelete(p.id)
                                        // }
                                    >
                                        {/* {deleting.has(p.id) ? (
                                            <DeleteTimer
                                                progress={
                                                    deleteProgress[p.id] || 0
                                                }
                                                timeLeft={
                                                    deleteTimeLeft[p.id] ?? 4
                                                }
                                            />
                                        ) : (
                                            <TrashIcon size={20} />
                                        )} */}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
                {isMy && (
                    <div className="doneCompAdd" onClick={() => habit && setEditChecklist(!editChecklist)}>
                        {editChecklist ? (
                            "Сохранить" 
                        ) : (
                            <>
                                <PencilSimpleIcon /> Редактировать чеклист
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}