import { ChatTeardropIcon, CheckCircle, Circle, MagnifyingGlassIcon, PushPinIcon, SignOut } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useDelete } from "../../../hooks/DeleteHook";
import { useMessages } from "../../../hooks/MessagesHook";
import LinkButton from "../buttons/LinkButton";
import PersonButtons from "../buttons/PersonButtons";
import { useChat } from "../../../hooks/ChatHook";

export default function AccMenu() {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm } = useDelete();
    const { setChosenMess } = useMessages();
    const { messages, activeHeader: header, setActiveHeader:setHeader } = useChat()

    const { options, chatInfo } = menu;

    return (
        <>
            <div
                className="ContextMenuButt"
                onClick={() => {
                    if (header === "search") setHeader("text")
                    else setHeader("search")
                }}
            >
                {header === "search" ? <ChatTeardropIcon weight="fill" /> : <MagnifyingGlassIcon />}
                {header === "search" ? "Сообщение" : "Поиск сообщений"}
            </div>            
            {messages.find(m => m.is_pinned) ? (
                <div
                    className="ContextMenuButt"
                    onClick={() => {
                        if (header === "pinned") setHeader("text")
                        else setHeader("pinned")
                    }}
                >
                    {header === "pinned" ? <ChatTeardropIcon weight="fill" /> : <PushPinIcon weight="fill"/>}
                    {header === "pinned" ? "Сообщение" : `${messages.filter(m => m.is_pinned).length} Закреплённые`}
                </div>
            ) : ""}
            <div
                className="ContextMenuButt"
                onClick={() => {
                    if (header === "choosing") setHeader("text")
                    else setHeader("choosing");
                    setChosenMess([]);
                }}
            >
                {header === "choosing" ? <Circle /> : <CheckCircle />}
                {header === "choosing" ? "Отменить выбор" : "Выбрать сообщения"}
            </div>

            <LinkButton />
            <PersonButtons />

            {chatInfo?.is_group && (
                <div
                    className="ContextMenuButt delete"
                    onClick={() => {
                        setDeleteConfirm({
                            goal: "leave",
                            id: options.id,
                            name: options.name!,
                        });
                        setBlackout({ seted: true, module: "Delete" });
                    }}
                >
                    <SignOut />
                    Покинуть беседу
                </div>
            )}
        </>
    );
}