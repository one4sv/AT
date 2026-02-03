import { useState, useEffect, useRef } from "react"
import { Plus, Pencil } from "lucide-react"
  import { tags, groups } from "./tags"

interface TagSelectorProps {
  selectedTag?: string;
  setSelectedTag: (tag: string | undefined) => void;
  showOnly?:boolean | undefined;
}

export default function TagSelector({ selectedTag, setSelectedTag, showOnly }: TagSelectorProps) {
  const [showTagList, setShowTagList] = useState<boolean>(false)
  const tagListRef = useRef<HTMLDivElement>(null)
  const addTagButt = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        addTagButt.current &&
        !addTagButt.current.contains(event.target as Node) &&
        tagListRef.current &&
        !tagListRef.current.contains(event.target as Node)
      ) {
        setShowTagList(false)
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <>
      <label htmlFor="inputTeg">Тег</label>
      <div className="tegSelector">
        {tags.map((tag, i) => {
          const Icon = tag.icon
          if (selectedTag === tag.value) return (
            <div
              className="tag active"
              key={i}
              onClick={() => !showOnly && setSelectedTag(undefined)}
            >
              <Icon size={24} /> {tag.label}
            </div>
          )
        })}
        <div
          className="addTeg"
          ref={addTagButt}
          onClick={() => !showOnly && setShowTagList(!showTagList)}
        >
          <>
            {selectedTag ? <Pencil /> : <Plus />}
            {selectedTag ? " Изменить" : " Добавить"}
          </>
        </div>
      </div>
      <div className={`tagList ${showTagList ? "active" : ""}`} ref={tagListRef}>
          {groups.map(({ group, value }) => {
            const tagsInGroup = tags.filter(tag => tag.group === group)

            if (!tagsInGroup.length) return null

            return (
              <div key={group} className="tagGroup">
                <div className="tagGroupTitle">{value}</div>
                {tagsInGroup.map((tag, i) => {
                  const Icon = tag.icon
                  if (selectedTag !== tag.value) return (
                    <div
                      className="tag"
                      key={i}
                      onClick={() => setSelectedTag(tag.value)}
                    >
                      <Icon size={24} /> {tag.label}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
    </>
  )
}
