import { useLayoutEffect, useState } from "react";
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

    useLayoutEffect(() => {
        if (!menu.visible) {
            setIsAdjusted(false);
            return;
        }
        if (!menuRef.current) return;

        const element = menuRef.current;
        const menuWidth = element.offsetWidth;
        const menuHeight = element.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let left = menu.x;
        let top = menu.y;

        if (left + menuWidth > viewportWidth) {
            left = viewportWidth - menuWidth - 10;
            if (left < 0) left = 0;
        }

        if (top + menuHeight > viewportHeight) {
            top = viewportHeight - menuHeight - 10;
            if (top < 0) top = 0;
        }

        setPos({ top, left });
        setIsAdjusted(true);

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const originX = Math.max(0, Math.min(menuWidth, menu.x - left));
        const originY = Math.max(0, Math.min(menuHeight, menu.y - top));
        element.style.transformOrigin = `${originX}px ${originY}px`;

        const animation = element.animate([
            { opacity: 0, transform: "scale(0.94)" },
            { opacity: 1, transform: "scale(1)" },
        ], {
            duration: 200,
            easing: "cubic-bezier(0.075, 0.82, 0.165, 1)",
        });

        return () => animation.cancel();
    }, [menu, menuRef]);

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
