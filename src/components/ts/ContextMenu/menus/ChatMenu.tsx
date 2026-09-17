import { SignOut, User, Users } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useDelete } from "../../../hooks/DeleteHook";
import { TogglePinned } from "../buttons/TogglePinned";
import DeleteButton from "../buttons/DeleteButton";
import LinkButton from "../buttons/LinkButton";
import PersonButtons from "../buttons/PersonButtons";

export default function ChatMenu() {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm } = useDelete();
    const navigate = useNavigate();

    const { options, chatInfo } = menu;

    return (
        <>
            <LinkButton />

            {chatInfo?.is_group ? (
                <div
                    className="ContextMenuButt"
                    onClick={() => navigate(`/room/${options.id}`)}
                >
                    <Users />
                    Информация о чате
                </div>
            ) : (
                <div
                    className="ContextMenuButt"
                    onClick={() => navigate(`/acc/${options.nick}`)}
                >
                    <User />
                    Открыть профиль
                </div>
            )}

            <TogglePinned bool={chatInfo!.pinned} id={options.id} />
            <PersonButtons />

            {options?.isMy && !chatInfo?.is_group && <DeleteButton />}

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