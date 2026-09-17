import { ChatTeardrop, Prohibit, User, UserMinus } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import { useContextMenu } from "../../../hooks/ContextMenuHook";
import { useBlackout } from "../../../hooks/BlackoutHook";
import { useDelete } from "../../../hooks/DeleteHook";
import LinkButton from "../buttons/LinkButton";

export default function MemberMenu() {
    const { menu } = useContextMenu();
    const { setBlackout } = useBlackout();
    const { setDeleteConfirm } = useDelete();
    const navigate = useNavigate();

    const { options, memberInfo, point } = menu;

    if (!memberInfo) return null;

    return (
        <>
            <div
                className="ContextMenuButt"
                onClick={() => navigate(`/acc/${options.nick}`)}
            >
                <User />
                Открыть профиль
            </div>

            <div
                className="ContextMenuButt"
                onClick={() => navigate(`/chat/${options.nick}`)}
            >
                <ChatTeardrop />
                Открыть чат
            </div>

            <LinkButton />

            {!memberInfo.isMe && memberInfo.myPerms?.kick_users === true && (
                <div
                    className="ContextMenuButt delete"
                    onClick={() => {
                        setDeleteConfirm({
                            goal: point,
                            id: options.id,
                            name: options.name!,
                        });
                        setBlackout({ seted: true, module: "Delete" });
                    }}
                >
                    <UserMinus />
                    Исключить из группы
                </div>
            )}

            {!memberInfo.isMe && memberInfo.myPerms?.ban_users === true && (
                <div
                    className="ContextMenuButt delete"
                    onClick={() => {
                        setDeleteConfirm({
                            goal: point,
                            id: options.id,
                            name: options.name!,
                        });
                        setBlackout({ seted: true, module: "Delete" });
                    }}
                >
                    <Prohibit />
                    Заблокировать
                </div>
            )}
        </>
    );
}