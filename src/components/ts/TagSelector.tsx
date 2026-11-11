import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import "../../scss/modules/habitFormControls.scss"
import { Plus, Pencil } from "lucide-react"
  import { tags, groups } from "./tags"

interface TagSelectorProps {
  selectedTag?: string;
  setSelectedTag: (tag: string | undefined) => void;
  showOnly?:boolean | undefined;
  portal?: boolean;
}

export default function TagSelector({ selectedTag, setSelectedTag, showOnly, portal = false }: TagSelectorProps) {
  const [showTagList, setShowTagList] = useState<boolean>(false)
  const tagListRef = useRef<HTMLDivElement>(null)
  const addTagButt = useRef<HTMLDivElement>(null)
  const [popupPosition, setPopupPosition] = useState<{top: number; left: number; width: number; maxHeight: number} | null>(null)

  useEffect(() => {
    if (!portal || !showTagList) return
    const updatePosition = () => {
      const triggerRect = addTagButt.current?.getBoundingClientRect()
      const fieldRect = addTagButt.current?.closest(".planTagWrapper")?.getBoundingClientRect()
      if (!triggerRect) return
      const spaceBelow = window.innerHeight - triggerRect.bottom - 12
      const spaceAbove = triggerRect.top - 12
      const openAbove = spaceBelow < 220 && spaceAbove > spaceBelow
      const maxHeight = Math.max(100, Math.min(320, openAbove ? spaceAbove : spaceBelow))
      const anchorRect = fieldRect || triggerRect
      const left = Math.max(8, anchorRect.left)
      setPopupPosition({
        top: openAbove ? Math.max(8, triggerRect.top - maxHeight - 6) : triggerRect.bottom + 6,
        left,
        width: Math.min(anchorRect.width, window.innerWidth - left - 8),
        maxHeight
      })
    }
    updatePosition()
    window.addEventListener("scroll", updatePosition, true)
    window.addEventListener("resize", updatePosition)
    return () => {
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
    }
  }, [portal, showTagList])

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

  const tagList = (
    <div className={`tagList ${showTagList ? "active" : ""} ${portal ? "planTagPortal" : ""}`} ref={tagListRef}
      style={portal ? { position: "fixed", top: popupPosition?.top ?? -9999, left: popupPosition?.left ?? 0,
        width: popupPosition?.width ?? 0, maxHeight: popupPosition?.maxHeight ?? 200, zIndex: 1000 } : undefined}>
      {groups.map(({ group, value }) => {
        const tagsInGroup = tags.filter(tag => tag.group === group)
        if (!tagsInGroup.length) return null
        return <div key={group} className="tagGroup">
          <div className="tagGroupTitle">{value}</div>
          {tagsInGroup.map((tag, i) => {
            const Icon = tag.icon
            if (selectedTag !== tag.value) return <div className="tag" key={i}
              onClick={() => { setSelectedTag(tag.value); setShowTagList(false) }}>
              <Icon size={24}/> {tag.label}
            </div>
            return null
          })}
        </div>
      })}
    </div>
  )

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
      {portal ? (showTagList && createPortal(tagList, document.body)) : tagList}
    </>
  )
}
