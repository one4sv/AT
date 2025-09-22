import { useState, useRef, useEffect } from "react"
import "../../scss/modules/AddGroup.scss"
import TagSelector from "../ts/TagSelector";
import SelectList from "../ts/SelectList";
import { useGroups } from "../ts/chern/GroupsHabitHook";

export default function AddGroup() {
    const { addGroup } = useGroups()
    const [ name, setName ] = useState<string>("")
    const [ desc, setDescription ] = useState<string>("")
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const [selectedTag, setSelectedTag] = useState<string | null>(null)
    const [selectedTheme, setSelectedTheme] = useState<string | number | undefined>()

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = textAreaRef.current.scrollHeight + "px";
        }
    }, [desc]);

    const themeArr=[
        { label: "по умолчанию", value: "default" },
        { label: "ядовитый", value: "poison" },
        { label: "карамельное яблоко", value: "apple" },
        { label: "небесный глубокий", value: "sky" },
        { label: "космическая даль", value: "space" },
        { label: "мягкая трава", value: "grass" },
        { label: "пустынный мираж", value: "desert" },
        { label: "морская синева", value: "sea" },
        { label: "ароматная сирень", value: "violet" },
        { label: "в негативе", value: "negative" },
        { label: "своя", value: "custom" },
    ]

    return (
        <div className="AddGroupDiv">
            <div className="addHabitWrapper">
                <label htmlFor="inputGroupName">
                    Название
                </label>
                <input type="text" id="inputGroupName" className="addHabitInput" onChange={(e) => setName(e.target.value)}/>
                <span>{name.length}/40</span>
            </div>
            <div className="addHabitWrapper">
                <label htmlFor="inputDesc">Описание</label>
                <textarea id="inputDesc" className="inputDesc addHabitInput" maxLength={120} ref={textAreaRef}onChange={(e) => setDescription(e.currentTarget.value)}></textarea>
                <span>{desc.length}/120</span>
            </div>
            <div className="addHabitWrapper">
                <TagSelector selectedTag={selectedTag} setSelectedTag={setSelectedTag}/>
            </div>
            <div className="inpWrapperAddHabit">
                <label htmlFor="addHabitSL">Тема</label>
                <SelectList arr={themeArr} id="addHabitSL" className="addGroupSL" prop={setSelectedTheme}/>
            </div>
            <button className="addHabitSave" onClick={() => addGroup(name, desc, selectedTag, selectedTheme)}>Сохранить</button>
        </div>
    )
}