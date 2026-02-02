import type { Habit } from "../../../components/context/HabitsContext"
import { tags, type Tag } from "../../../components/ts/tags"

export const TagIcon = (habit:Habit, selectedTag?:string) => {
    let tag:Tag | undefined
    if (selectedTag || habit.tag) tag = tags.find(tag => tag.value === (selectedTag || habit.tag))
    if (!tag) return null
    const Icon = tag.icon
    return <Icon size={24} />
}