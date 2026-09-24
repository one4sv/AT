import { CheckCircle, Circle, MagnifyingGlassIcon, PushPinIcon, SignOut, UserIcon } from "@phosphor-icons/react";
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
    const { isChose, setIsChose, setChosenMess } = useMessages();
    const { messages } = useChat()

    const { options, chatInfo } = menu;
    const header = chatInfo?.activeHeader
    const setHeader = chatInfo?.setActiveHeader

    return (
        <>
            {header && setHeader ? (
                <>
                    <div
                        className="ContextMenuButt"
                        onClick={() => {
                            if (header === "search") setHeader("user")
                            else setHeader("search")
                        }}
                    >
                        {header === "search" ? <UserIcon weight="fill" /> : <MagnifyingGlassIcon />}
                        {header === "search" ? "Собеседник" : "Поиск сообщений"}
                    </div>            
                    {messages.find(m => m.is_pinned) ? (
                        <div
                            className="ContextMenuButt"
                            onClick={() => {
                                if (header === "pinned") setHeader("user")
                                else setHeader("pinned")
                            }}
                        >
                            {header === "pinned" ? <UserIcon weight="fill" /> : <PushPinIcon weight="fill"/>}
                            {header === "pinned" ? "Собеседник" : "Закреплённые сообщения"}
                        </div>
                    ) : ""}
                </> 
            ) : ""}       
            <div
                className="ContextMenuButt"
                onClick={() => {
                    setIsChose(!isChose);
                    setChosenMess([]);
                }}
            >
                {isChose ? <Circle /> : <CheckCircle />}
                {isChose ? "Отменить выбор" : "Выбрать сообщения"}
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