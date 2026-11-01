import { useState } from "react"
import DayCommentMobile from "./DayCommentMobile"
import DoneButtonMobile from "./DoneButtonMobile"

export default function HabitMobileDone({ habitId, isReadOnly, canComment } : {habitId:string, isReadOnly: boolean, canComment: boolean}) {
    const [ open, setOpen ] = useState(isReadOnly ? "comment" : "done")

    if (!habitId || (isReadOnly && !canComment)) return null

    return (
        <div className="habitMobileDone">
            {!isReadOnly && <DoneButtonMobile habitId={Number(habitId)} open={open} setOpen={setOpen}/>}
            <DayCommentMobile id={habitId} isMy={canComment} open={open} setOpen={setOpen}/>
        </div>
    )

}