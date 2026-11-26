import ContactsList from "../ts/SM/ContactsList"
import "./scss/Redirecting.scss";
import { Search } from "lucide-react";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";
import { useRef, useState } from "react";
import { useContacts } from "../hooks/ContactsHook";
import { useTranslation } from "react-i18next";
import Selector from "../ts/Selector";
import useModalSlider from "../hooks/utils/useModalSlider";

export default function Redirecting() {
    const { setSearch } = useContacts()
    const { setBlackout } = useBlackout()
    const { setRedirect, setForwardPost, setForwardMedia } = useMessages()
    const { t } = useTranslation("settings")
    const searchRef = useRef<HTMLInputElement | null>(null)
    const [ filter, setFilter ] = useState<"all" | "private" | "group">("all")
    const filters = [
        { value: "all" as const, label: t("quickFilters.all") },
        { value: "private" as const, label: t("quickFilters.private") },
        { value: "group" as const, label: t("quickFilters.group") }
    ]
    const activeIndex = filters.findIndex(item => item.value === filter)
    const slider = useModalSlider(activeIndex, filters.length, "all,private,group", index => setFilter(filters[index].value))

    return (
        <div className="contactListModule">
            <div className="redirectBar">
                <div className="SMsearch">
                    <input type="text" className="SMsearchInput" ref={searchRef}
                        placeholder={t("quickFilters.search")}
                        onChange={(e) => setSearch(e.currentTarget.value)}/>
                    <Search />
                </div>
            </div>
            <div className="redirectFilters">
                <Selector selected={filter} previewIndex={slider.previewIndex ?? undefined}
                    onPreviewIndexChange={slider.setPreviewIndex}
                    arr={filters.map(item => ({...item, func: setFilter}))}/>
            </div>
            <div className="redirectViewport" ref={slider.viewportRef} onClickCapture={slider.onClickCapture}>
                <div className={`redirectTrack${slider.previewIndex !== null ? " dragging" : ""}`}
                    style={{transform: `translate3d(${-slider.position * 100}%, 0, 0)`}}>
                    {filters.map(item => <div key={item.value} className="redirectSlide"
                        inert={item.value !== filter} aria-hidden={item.value !== filter}>
                        <ContactsList filter={item.value} searchRef={searchRef}/>
                    </div>)}
                </div>
            </div>
            <div className="cancelRedirect">
                <div className="addHabitGoal" onClick={() => {
                    setBlackout({seted:false})
                    setRedirect(undefined)
                    setForwardPost(null)
                    setForwardMedia(null)
                }}>
                    Отмена
                </div>
            </div>
        </div>
    )
}
