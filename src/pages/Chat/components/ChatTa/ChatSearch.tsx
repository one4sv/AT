import { CaretDownIcon, CaretUpIcon, List, MagnifyingGlassIcon, X } from "@phosphor-icons/react";
import { useChat } from "../../../../components/hooks/ChatHook";
import type { message } from "../../../../components/context/ChatContext";
import { useChatMessageScroll } from "../../../../components/hooks/utils/useChatMessageScroll";
import type { SetStateAction } from "react";
import type React from "react";

export default function ChatSearch ({searchedMessages, selectedIndex, setSelectedIndex, isOpen, setIsOpen}:{searchedMessages:message[], selectedIndex:number, setSelectedIndex:React.Dispatch<SetStateAction<number>>, isOpen:boolean, setIsOpen:React.Dispatch<SetStateAction<boolean>>}) {
    const { scrollToMessage, setHighlightedId } = useChatMessageScroll()
    const { searchMess, setSearchMess } = useChat()

    const handleArrowClick = (dir: "up" | "down") => {
        setHighlightedId(null);
        if (!searchedMessages.length) return;

        let newIndex = selectedIndex;
        if (dir === "down")
        newIndex = Math.min(searchedMessages.length - 1, selectedIndex + 1);
        if (dir === "up") newIndex = Math.max(0, selectedIndex - 1);

        setSelectedIndex(newIndex);
        const target = searchedMessages[newIndex];
        if (!target) return;
        scrollToMessage(target.id);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!searchedMessages.length) return;
        setHighlightedId(null);

        if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
            Math.min(prev + 1, searchedMessages.length - 1)
        );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            scrollToMessage(searchedMessages[selectedIndex].id);
        }
    };

    return (
        <>
            <div className="chatTAStr">
                <div className="chatTaButts">
                    <div className="chatWriteSvgButt" onClick={() => handleArrowClick("up")}><CaretDownIcon className="chatSvg"/></div>
                    <div className="chatWriteSvgButt" onClick={() => handleArrowClick("down")}><CaretUpIcon className="chatSvg"/></div>
                </div>
                <div className="chatSearch">
                    <input
                        type="text"
                        placeholder="Поиск по сообщениям"
                        value={searchMess}
                        onChange={(e) => { setSearchMess(e.target.value); setIsOpen(true)}}
                        onKeyDown={handleSearchKeyDown}
                    />
                    {searchMess.length > 0 ? (
                        <X color="white" cursor="pointer" onClick={() => { 
                            setSearchMess(""); 
                            setSelectedIndex(0); 
                        }}/>
                    ): (
                        <MagnifyingGlassIcon/>
                    )}
                </div>
                <div className="chatTaButts">
                    <div className="chatWriteTAButt" onClick={() => setIsOpen(!isOpen)}>
                        <List className="chatSend"/>
                    </div>
                </div>
            </div>
        </>
    )
}