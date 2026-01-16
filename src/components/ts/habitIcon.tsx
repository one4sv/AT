import type { Habit } from "../context/HabitsContext"
import { tags } from "./tags"

export const habitIcon = (habit : Habit ) => {
    const selectedTag = tags.find(tag => tag.value === habit.tag)
    if (!selectedTag) return null
    const Icon = selectedTag.icon
    return <Icon size={24} className="habitIconSvg"/>
}