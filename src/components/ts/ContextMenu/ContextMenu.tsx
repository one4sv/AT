import { useEffect, useState } from "react";
import "../../../scss/ContextMenu.scss";
import { useContextMenu } from "../../hooks/ContextMenuHook";

import HabitMenu from "./menus/HabitMenu";
import ChatMenu from "./menus/ChatMenu";
import PostMenu from "./menus/PostMenu";
import AccMenu from "./menus/AccMenu";
import MemberMenu from "./menus/MemberMenu";
import MessMenu from "./menus/MessMenu";
import MediaMenu from "./menus/MediaMenu";
import MessBarMenu from "./menus/MessBarMenu";

export default function ContextMenu() {
    const { menu, menuRef } = useContextMenu();

    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [isAdjusted, setIsAdjusted] = useState(false);

    useEffect(() => {
        if (!menu.visible) {
            setIsAdjusted(false);
            return;
        }
        if (!menuRef.current) return;

        const menuRect = menuRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = menu.x;
        let top = menu.y;

        if (left + menuRect.width > viewportWidth) {
            left = viewportWidth - menuRect.width - 10;
            if (left < 0) left = 0;
        }

        if (top + menuRect.height > viewportHeight) {
            top = viewportHeight - menuRect.height - 10;
            if (top < 0) top = 0;
        }

        setPos({ top, left });
        setIsAdjusted(true);
    }, [menu.x, menu.y, menu.visible, menuRef]);

    if (!menu.visible) return null;

    const currentPos = isAdjusted ? pos : { top: menu.y, left: menu.x };

    const renderMenu = () => {
        switch (menu.point) {
            case "habit":
                return <HabitMenu />;
            case "chat":
                return <ChatMenu />;
            case "post":
                return <PostMenu />;
            case "acc":
                return <AccMenu />;
            case "member":
                return <MemberMenu />;
            case "mess":
                return <MessMenu />;
            case "media":
                return <MediaMenu />;
            case "messBar":
                return <MessBarMenu />;
            default:
                return null;
        }
    };

    return (
        <div
            className="ContextMenuWrapper"
            ref={menuRef}
            style={{
                top: currentPos.top,
                left: currentPos.left,
                visibility: isAdjusted ? "visible" : "hidden",
            }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {renderMenu()}
        </div>
    );
}