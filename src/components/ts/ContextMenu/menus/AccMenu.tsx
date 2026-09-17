import { CheckCircle, Circle, SignOut } from "@phosphor-icons/react";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useDelete } from "../../../hooks/DeleteHook";
import { useMessages } from "../../../hooks/MessagesHook";
import LinkButton from "../buttons/LinkButton";
import PersonButtons from "../buttons/PersonButtons";

export default function AccMenu() {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm } = useDelete();
    const { isChose, setIsChose, setChosenMess } = useMessages();

    const { options, chatInfo } = menu;

    return (
        <>
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