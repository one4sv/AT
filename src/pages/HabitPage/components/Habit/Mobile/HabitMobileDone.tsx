import { useState } from "react"
import DayCommentMobile from "./DayCommentMobile"
import DoneButtonMobile from "./DoneButtonMobile"

export default function HabitMobileDone({ habitId, isReadOnly} : {habitId:string, isReadOnly: boolean}) {
    const [ open, setOpen ] = useState("done")

    if (!habitId || isReadOnly) return null

    return (
        <div className="habitMobileDone">
            <DoneButtonMobile habitId={Number(habitId)} open={open} setOpen={setOpen}/>
            <DayCommentMobile id={habitId} isMy={!isReadOnly} open={open} setOpen={setOpen}/>
        </div>
    )

}