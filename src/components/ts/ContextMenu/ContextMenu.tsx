import { useLayoutEffect, useRef, useState } from "react";
import "../../../scss/ContextMenu.scss";
import { useContextMenu } from "../../hooks/ContextMenuHook";
import HabitMenu from "./menus/HabitMenu";
import ChatMenu from "./menus/ChatMenu";
import PostMenu from "./menus/PostMenu";
import PersonMenu from "./menus/PersonMenu";
import CommentMenu from "./menus/CommentMenu";
import AccMenu from "./menus/AccMenu";
import MemberMenu from "./menus/MemberMenu";
import MessMenu from "./menus/MessMenu";
import MediaMenu from "./menus/MediaMenu";
import MessBarMenu from "./menus/MessBarMenu";
import HeaderQuickActionMenu from "./menus/HeaderQuickActionMenu";
import HabitHeaderMenu from "./menus/HabitHeaderMenu";
import SettingsBackMenu from "./menus/SettingsBackMenu";
import SettingsSectionMenu from "./menus/SettingsSectionMenu";
import PlanCreateMenu from "./menus/PlanCreateMenu";
import PlanMenu from "./menus/PlanMenu";
export default function ContextMenu() {
    const {
        menu,
        menuRef,
        closeMenu
    } = useContextMenu();
    const [pos, setPos] = useState<{
        top: number;
        left: number;
        previewTop?: number;
        previewLeft?: number;
        previewWidth?: number;
        previewHeight?: number;
    }>(
        {
            top: 0,
            left: 0
        }
    );
    const [isAdjusted, setIsAdjusted] = useState(false);
    const previewRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(
        () => {
            if (!menu.visible) {
                setIsAdjusted(false);
                return;
            }
            if (!menuRef.current) return;
            const element = menuRef.current;
            const menuWidth = element.offsetWidth;
            const menuHeight = element.offsetHeight;
            const viewport = window.visualViewport;
            const viewportWidth = viewport?.width ?? window.innerWidth;
            const viewportHeight = viewport?.height ?? window.innerHeight;
            const offsetLeft = viewport?.offsetLeft ?? 0;
            const offsetTop = viewport?.offsetTop ?? 0;
            const focused = !!menu.focusSource?.isConnected && !!menu.focusRect;
            const previewWidth = focused ? Math.min(menu.focusRect!.width, viewportWidth - 32) : 0;
            const previewHeight = focused ? Math.min(menu.focusRect!.height, viewportHeight * .28) : 0;
            const previewTop = Math.max(offsetTop + 12, offsetTop + (viewportHeight - previewHeight - menuHeight - 16) / 2);
            const previewLeft = offsetLeft + (viewportWidth - previewWidth) / 2;
            const minLeft = menu.originSide ? Math.max(offsetLeft + 10, menu.originSide.left + 10) : offsetLeft + 10;
            const maxRight = menu.originSide ? Math.min(offsetLeft + viewportWidth - 10, menu.originSide.right - 10) : offsetLeft + viewportWidth - 10;
            const left = focused ? offsetLeft + (viewportWidth - menuWidth) / 2 :
                Math.max(minLeft, Math.min(menu.x, Math.max(minLeft, maxRight - menuWidth)));
            const top = focused ? Math.min(previewTop + previewHeight + 16, offsetTop + viewportHeight - menuHeight - 12) :
                Math.max(offsetTop + 10, Math.min(menu.y, offsetTop + viewportHeight - menuHeight - 10));
            setPos({ top, left, previewTop, previewLeft, previewWidth, previewHeight });
            if (focused && previewRef.current && menu.focusSource) {
                const clone = menu.focusSource.cloneNode(true) as HTMLElement;
                clone.removeAttribute("id");
                clone.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
                previewRef.current.replaceChildren(clone);
            }
            setIsAdjusted(true);
            if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            const originX = Math.max(0, Math.min(menuWidth, menu.x - left));
            const originY = Math.max(0, Math.min(menuHeight, menu.y - top));
            element.style.transformOrigin = `${originX}px ${originY}px`;
            const animation = element.animate(
                [{
                    opacity: 0,
                    transform: "scale(0.94)"
                }, {
                    opacity: 1,
                    transform: "scale(1)"
                }],
                {
                    duration: 200,
                    easing: "cubic-bezier(0.075, 0.82, 0.165, 1)"
                }
            );
            return () => animation.cancel();
        },
        [menu, menuRef]
    );
    useLayoutEffect(() => {
        if (!menu.visible || !menuRef.current) return;
        const actions = Array.from(menuRef.current.querySelectorAll<HTMLElement>(".ContextMenuButt"));
        actions.forEach(item => {
            item.setAttribute("role", "menuitem");
            item.setAttribute("tabindex", "-1");
        });
        if (window.matchMedia("(pointer: fine)").matches) actions[0]?.focus({ preventScroll: true });
    }, [menu.visible, menu.point, menuRef]);

    if (!menu.visible) return null;
    const currentPos = isAdjusted ? pos : {
        top: menu.y,
        left: menu.x
    };
    const renderMenu = () => {
        switch (menu.point) {
            case "habit":
                return <HabitMenu />;
            case "chat":
                return <ChatMenu />;
            case "post":
                return <PostMenu />;
            case "person":
                return <PersonMenu />;
            case "comment":
                return <CommentMenu />;
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
            case "headerQuickAction":
                return <HeaderQuickActionMenu />;
            case "habitHeader":
                return <HabitHeaderMenu />;
            case "settingsBack":
                return <SettingsBackMenu />;
            case "settingsSection":
                return <SettingsSectionMenu />;
            case "planCreate":
                return <PlanCreateMenu />;
            case "plan":
                return <PlanMenu />;
            default:
                return null;
        }
    };

    return (
        <>
        {menu.focusRect && menu.focusSource?.isConnected && <>
            <div className="ContextMenuFocusBackdrop" onPointerDown={event => {
                if (event.pointerType !== "touch" && event.pointerType !== "pen") closeMenu();
            }}/>
            <div className="ContextMenuFocusPreview" ref={previewRef} aria-hidden="true"
                style={{ top: pos.previewTop ?? 0, left: pos.previewLeft ?? 0,
                    width: pos.previewWidth ?? 0, height: pos.previewHeight ?? 0,
                    visibility: isAdjusted ? "visible" : "hidden" }}/>
        </>}
        <div
            className="ContextMenuWrapper"
            role="menu"
            aria-label={menu.options.name || undefined}
            tabIndex={-1}
            onKeyDown={event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    closeMenu();
                    return;
                }
                const actions = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(".ContextMenuButt"));
                const index = actions.indexOf(document.activeElement as HTMLElement);
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    actions[(index + direction + actions.length) % actions.length]?.focus();
                } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (index >= 0) actions[index].click();
                }
            }}
            ref={menuRef}
            style={{
                top: currentPos.top,
                left: currentPos.left,
                visibility: isAdjusted ? "visible" : "hidden"
            }}
            onContextMenu={e => e.preventDefault()}
        >
            {renderMenu()}
        </div>
        </>
    );
}
