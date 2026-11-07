import { useRef, type SetStateAction } from "react"
import { useTranslation } from "react-i18next"
import type { Habit } from "../../../../components/context/HabitsContext"
import "../../scss/HabitName.scss"
import { useUpHabit } from "../../../../components/hooks/UpdateHabitHook"
import { TagIcon } from "../../utils/TagIcon"
import Streak from "./Streak"
import { useCalendar } from "../../../../components/hooks/CalendarHook"
import { TextIndentIcon } from "@phosphor-icons/react"
import { useSideMenu } from "../../../../components/hooks/SideMenuHook"
import useCompactLayout from "../../../../components/hooks/utils/useCompactLayout"
import { useSettings } from "../../../../components/hooks/SettingsHook"
import { useContextMenu } from "../../../../components/hooks/ContextMenuHook"
import useHeaderMenuGestures from "../../../../components/hooks/utils/useHeaderMenuGestures"

interface HabitNameProps {
    habit:Habit | undefined,
    showHabitMenu:boolean,
    setShowHabitMenu:React.Dispatch<SetStateAction<boolean>>,
    isReadOnly:boolean,
}
export default function HabitName({habit, showHabitMenu, setShowHabitMenu}:HabitNameProps) {
    const { t } = useTranslation("common")
    const { isUpdating } = useUpHabit()
    const { calendar } = useCalendar()
    const { openSideMenu } = useSideMenu()
    const { layout } = useSettings()
    const isCompact = useCompactLayout()
    const { openMenu } = useContextMenu()
    const headerGestures = useHeaderMenuGestures()
    const habitNameRef = useRef<HTMLDivElement | null>(null);

    if (!habit) return null
    
    return (
        <div className={`headerDiv ${showHabitMenu ? "br" : ""}`} ref={habitNameRef} {...headerGestures}>
            {(isCompact || layout === "hidden") && (
                <div className="headerButt" data-header-gesture="quick"
                    onContextMenu={e => {
                        e.preventDefault()
                        openMenu(e.clientX, e.clientY, "headerQuickAction", { id: "headerQuickAction" })
                    }}
                    onClick={() => openSideMenu()}>
                    <TextIndentIcon />
                </div>
            )}
            <div className="header habitNameMain" data-header-gesture="habit" data-habit-id={habit.id}
                onContextMenu={e => {
                    e.preventDefault()
                    openMenu(e.clientX, e.clientY, "habitHeader", { id: String(habit.id) })
                }}
                onClick={() => setShowHabitMenu(!showHabitMenu)}>
                {habit.tag && (
                    <div className="habitNameTag">
                        {TagIcon(habit)}
                    </div>
                )}
                <div className="habitNameText">
                    <div className="habitName">{habit.name}</div>
                    <span className="habitNameStatus">
                        <Streak habit={habit} calendar={calendar}/>
                    </span>
                </div>
                <div className="saveHabit">
                    <span
                        className="spanSaveHabit"
                        style={{ display: isUpdating.includes(`habit_${habit.id}`) ? "block" : "none" }}
                    >
                        {t("habitPageUi.saving")}
                    </span>
                </div>
            </div>
        </div>
    )
}