import { activityAvatarUrl } from "./utils/activityImage";
import "../../scss/activityImages.scss";
import type { Habit } from "../context/HabitsContext"
import { tags } from "./tags"

export const habitIcon = (habit : Habit ) => {
    if(habit.avatar_key) return <img className="activityAvatar" loading="lazy" src={activityAvatarUrl(habit.id,habit.avatar_key)} alt=""/>;
    const selectedTag = tags.find(tag => tag.value === habit.tag)
    if (!selectedTag) return null
    const Icon = selectedTag.icon
    return <Icon className="habitIconSvg"/>
}