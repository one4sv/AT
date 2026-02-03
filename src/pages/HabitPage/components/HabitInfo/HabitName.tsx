import { useRef, type SetStateAction } from "react"
import type { Habit } from "../../../../components/context/HabitsContext"
import "../../scss/HabitName.scss"
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook"
import { TagIcon } from "../../utils/TagIcon"
import Streak from "./Streak"
import { useCalendar } from "../../../../components/hooks/CalendarHook"
import { DotsThreeOutlineVertical } from "@phosphor-icons/react"
import { useContextMenu } from "../../../../components/hooks/ContextMenuHook"

interface HabitNameProps {
    habit:Habit | undefined,
    showHabitMenu:boolean,
    setShowHabitMenu:React.Dispatch<SetStateAction<boolean>>,
    isReadOnly:boolean
}
export default function HabitName({habit, showHabitMenu, setShowHabitMenu, isReadOnly}:HabitNameProps) {
    const { isUpdating } = useUpHabit()
    const { calendar } = useCalendar()
    const { menu, closeMenu, openMenu } = useContextMenu()
    const habitNameRef = useRef<HTMLDivElement | null>(null);

    if (!habit) return null

    const handleMenuClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!habitNameRef.current || !habit) return;

        if (menu.visible) {
            closeMenu()
            return
        }

        const rect = habitNameRef.current.getBoundingClientRect();
        const x = rect.left + rect.width * 0.86;
        const y = window.innerHeight * 0.065;

        openMenu(x, y, "habit", {id:String(habit.id), name:habit.name, isMy:!isReadOnly}, habit)
    };
    
    return (
        <div className="chatUser" ref={habitNameRef}>
            <div className="habitNameMain" onClick={() => setShowHabitMenu(!showHabitMenu)}>
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
            <div className="userMenuCall" onClick={handleMenuClick}>
                <DotsThreeOutlineVertical weight="fill"/>
            </div>
        </div>
    )
}