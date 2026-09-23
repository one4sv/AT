import { useRef, type SetStateAction } from "react"
import type { Habit } from "../../../../components/context/HabitsContext"
import "../../scss/HabitName.scss"
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook"
import { TagIcon } from "../../utils/TagIcon"
import Streak from "./Streak"
import { useCalendar } from "../../../../components/hooks/CalendarHook"
import { TextIndentIcon } from "@phosphor-icons/react"
import { useSideMenu } from "../../../../components/hooks/SideMenuHook"
import { isMobile } from "react-device-detect"

interface HabitNameProps {
    habit:Habit | undefined,
    showHabitMenu:boolean,
    setShowHabitMenu:React.Dispatch<SetStateAction<boolean>>,
    isReadOnly:boolean,
    expandProgress:number,
    pulling:boolean
}
export default function HabitName({habit, showHabitMenu, setShowHabitMenu, expandProgress, pulling}:HabitNameProps) {
    const { isUpdating } = useUpHabit()
    const { calendar } = useCalendar()
    const { openSideMenu } = useSideMenu()
    const habitNameRef = useRef<HTMLDivElement | null>(null);

    if (!habit) return null
    
    return (
        <div className={`headerDiv ${showHabitMenu ? "br" : ""}`} ref={habitNameRef} style={{transform:`translateY(${-6 * expandProgress}vh)`, transition:pulling ? "none" : "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"}}>
            {isMobile && (
                <div className="headerButt" onClick={() => openSideMenu()}>
                    <TextIndentIcon />
                </div>
            )}
            <div className="header habitNameMain" onClick={() => setShowHabitMenu(!showHabitMenu)}>
                {habit.tag && (
                    <div className="habitNameTag chatUserPick">
                        {TagIcon(habit)}
                    </div>
                )}
                <div className="chatUserName">
                    <div className="habitName">{habit.name}</div>
                    <span className="chatOnlineStauts">
                        <Streak habit={habit} calendar={calendar}/>
                    </span>
                </div>
            </div>
            <div className="saveHabit">
                <span
                    className="spanSaveHabit"
                    style={{ display: isUpdating.includes(`habit_${habit.id}`) ? "block" : "none" }}
                >
                    Сохранение...
                </span>
            </div>
        </div>
    )
}