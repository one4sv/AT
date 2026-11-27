import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { UserCircleIcon } from "@phosphor-icons/react";
import MessageLinkContent from "../../../pages/Chat/components/MessageLinkContent";
import SharedEntityCard from "../../../pages/Chat/components/SharedEntityCard";
import "../../../scss/ContextMenu.scss";
import "../../../scss/Loading.scss";
import { prepareContextMedia } from "./prepareContextMedia";
import { useIdentify } from "../../hooks/utils/useIdentify";
import { useContextMenu } from "../../hooks/ContextMenuHook";
import HabitMenu from "./menus/HabitMenu";
import ChatMenu from "./menus/ChatMenu";
import PostMenu from "./menus/PostMenu";
import PersonMenu from "./menus/PersonMenu";
import CommentMenu from "./menus/CommentMenu";
import AccMenu from "./menus/AccMenu";
import ProfileActionsMenu from "./menus/ProfileActionsMenu";
import SMAccountMenu from "./menus/SMAccountMenu";
import MemberMenu from "./menus/MemberMenu";
import MessMenu from "./menus/MessMenu";
import MediaMenu from "./menus/MediaMenu";
import MessBarMenu from "./menus/MessBarMenu";
import ChatActionMenu from "./menus/ChatActionMenu";
import HeaderQuickActionMenu from "./menus/HeaderQuickActionMenu";
import HabitHeaderMenu from "./menus/HabitHeaderMenu";
import SettingsBackMenu from "./menus/SettingsBackMenu";
import SettingsSectionMenu from "./menus/SettingsSectionMenu";
import PlanCreateMenu from "./menus/PlanCreateMenu";
import PlanMenu from "./menus/PlanMenu";
import WallpaperMenu from "./menus/WallpaperMenu";
import CompositionMenu from "./menus/CompositionMenu";
import SharedSettingMenu from "./menus/SharedSettingMenu";
import CalendarDayMenu from "./menus/CalendarDayMenu";
import ActivityAvatarMenu from "./menus/ActivityAvatarMenu";
function PreviewSender({ name, id, avatar }: { name: string; id?: string; avatar?: string }) {
    const { identified } = useIdentify(avatar ? undefined : id);
    const avatarUrl = avatar || identified?.avatar_url;
    return <div className="contextMenuChatSender">
        {avatarUrl ? <img src={avatarUrl} alt=""/> : <UserCircleIcon aria-hidden="true"/>}
        <span>{name}</span>
    </div>;
}

export default function ContextMenu() {
    const { t } = useTranslation("common");
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
    const [messagePreviewHost] = useState(() => document.createElement("div"));
    const lastMessage = menu.point === "chat" && menu.focusSource ? menu.options.lastMessage : undefined;
    const mobileCalendar=menu.point==="calendarDay" && window.matchMedia("(pointer: coarse)").matches;
    const selectableMessage = menu.point === "mess" && !!(menu.curChat?.selectableText || menu.curChat?.text)?.trim();

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
            const focused = !!menu.focusSource && !!menu.focusRect;
            const fitProfile = menu.point === "profileCardActions" || (menu.point === "smAccountNavigation" && menu.options.id === "profile");
            const previewScale = focused && fitProfile ? Math.min(1, (viewportWidth - 32) / Math.max(1, menu.focusRect!.width), viewportHeight * .28 / Math.max(1, menu.focusRect!.height)) : 1;
            const focusSource = menu.focusSource;
            const photo = focused && /^image\//i.test(menu.options.type || "") && focusSource
                ? (focusSource instanceof HTMLImageElement ? focusSource : focusSource.querySelector("img"))
                : null;
            const photoWidth = photo?.naturalWidth || photo?.clientWidth || 0;
            const photoHeight = photo?.naturalHeight || photo?.clientHeight || 0;
            const previewRoom = Math.max(0, viewportHeight - menuHeight - 40);
            const photoScale = photoWidth && photoHeight
                ? Math.min((viewportWidth - 32) / photoWidth, previewRoom / photoHeight, viewportHeight * .62 / photoHeight)
                : 0;
            const photoPreview = photo && photoScale > 0 ? photo : null;
            const previewWidth = photoPreview ? photoWidth * photoScale : focused ? Math.min(menu.focusRect!.width * previewScale, viewportWidth - 32) : 0;
            const previewHeight = photoPreview ? photoHeight * photoScale :
                focused ? Math.min(menu.focusRect!.height * previewScale + (lastMessage ? (lastMessage.entity || /https?:\/\//i.test(lastMessage.text) ? 180 : lastMessage.image ? 138 : 105) : 0), previewRoom) : 0;
            const previewTop = Math.max(offsetTop + 12, offsetTop + (viewportHeight - previewHeight - menuHeight - 16) / 2);
            const previewLeft = offsetLeft + (viewportWidth - previewWidth) / 2;
            const minLeft = menu.originSide ? Math.max(offsetLeft + 10, menu.originSide.left + 10) : offsetLeft + 10;
            const maxRight = menu.originSide ? Math.min(offsetLeft + viewportWidth - 10, menu.originSide.right - 10) : offsetLeft + viewportWidth - 10;
            const left = mobileCalendar ? offsetLeft+(viewportWidth-menuWidth)/2 : focused ? offsetLeft + (viewportWidth - menuWidth) / 2 :
                Math.max(minLeft, Math.min(menu.options.anchorRight ? menu.x - menuWidth : menu.x, Math.max(minLeft, maxRight - menuWidth)));
            const top = mobileCalendar ? offsetTop+Math.max(10,(viewportHeight-menuHeight)/2) : focused ? Math.min(previewTop + previewHeight + 16, offsetTop + viewportHeight - menuHeight - 12) :
                Math.max(offsetTop + 10, Math.min(menu.y, offsetTop + viewportHeight - menuHeight - 10));
            setPos({ top, left, previewTop, previewLeft, previewWidth, previewHeight });
            if (focused && previewRef.current && menu.focusSource) {
                const clone = (photoPreview || menu.focusSource).cloneNode(true) as HTMLElement;
                clone.removeAttribute("id");
                clone.querySelectorAll("[id]").forEach(element => element.removeAttribute("id"));
                if (selectableMessage) {
                    clone.removeAttribute("data-context-menu");
                    clone.querySelectorAll("[data-context-menu]").forEach(element => element.removeAttribute("data-context-menu"));
                    clone.querySelectorAll(".messageText").forEach(element => element.classList.add("contextMessageSelectable"));
                }
                if (fitProfile) {
                    clone.style.width = `${menu.focusRect!.width}px`;
                    clone.style.height = `${menu.focusRect!.height}px`;
                    clone.style.maxHeight = "none";
                    clone.style.flexShrink = "0";
                    clone.style.boxSizing = "border-box";
                    clone.style.transform = `scale(${previewScale})`;
                }
                if (photoPreview && clone instanceof HTMLImageElement) {
                    clone.className = "contextMenuPhoto";
                    clone.removeAttribute("style");
                    clone.loading = "eager";
                    previewRef.current.replaceChildren(clone);
                } else if (lastMessage) {
                    const preview = document.createElement("div");
                    preview.className = "contextMenuChatPreview";
                    preview.append(clone, messagePreviewHost);
                    previewRef.current.replaceChildren(preview);
                } else {
                    previewRef.current.replaceChildren(clone);
                }
                prepareContextMedia(previewRef.current);
            }
            setIsAdjusted(true);
            if (mobileCalendar || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
        [menu, menuRef, mobileCalendar, lastMessage, messagePreviewHost, selectableMessage]
    );
    useLayoutEffect(() => {
        if (!menu.visible || !menuRef.current) return;
        const actions = Array.from(menuRef.current.querySelectorAll<HTMLElement>(".ContextMenuButt"));
        actions.forEach(item => {
            item.setAttribute("role", "menuitem");
            item.setAttribute("tabindex", "-1");
        });
        if (window.matchMedia("(pointer: fine)").matches) actions[0]?.focus({ preventScroll: true });
    }, [menu, menuRef]);

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
            case "profileActions":
            case "profileCardActions":
                return <ProfileActionsMenu />;
            case "smAccountNavigation":
                return <SMAccountMenu />;
            case "acc":
                return <AccMenu />;
            case "member":
                return <MemberMenu />;
            case "mess":
                return <MessMenu />;
            case "media":
                return <MediaMenu />;
            case "chatAction":
                return <ChatActionMenu/>;
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
            case "planItem":
                return <PlanMenu />;
            case "calendarDay":
                return <CalendarDayMenu key={menu.options.id} mobile={mobileCalendar}/>;
            case "activityAvatar":
                return <ActivityAvatarMenu/>;
            case "wallpaper":
                return <WallpaperMenu/>;
            case "sharedSetting":
                return <SharedSettingMenu/>;
            case "composition":
                return <CompositionMenu />;
            default:
                return null;
        }
    };

    return (
        <>
        {lastMessage && createPortal(
            <div className={`contextMenuChatLastMessage ${lastMessage.mine ? "my" : "ur"}`} inert>
                {lastMessage.sender && <PreviewSender key={lastMessage.senderId} name={lastMessage.sender}
                    id={lastMessage.senderId} avatar={lastMessage.avatar}/>}
                <div className="contextMenuChatBubble">
                    {lastMessage.forwardedBy && <small>{t("chatUi.forwarded")} · {lastMessage.forwardedBy}</small>}
                    {lastMessage.image && <img className="contextMenuChatPhoto" src={lastMessage.image} alt=""/>}
                    {lastMessage.text && <MessageLinkContent text={lastMessage.text} search="" files={lastMessage.files}/>}
                    {lastMessage.entity && <SharedEntityCard kind={lastMessage.entity.kind} id={lastMessage.entity.id}/>}
                </div>
            </div>,
            messagePreviewHost
        )}
        {mobileCalendar && <div className="ContextMenuFocusBackdrop" onClick={closeMenu}/>}
        {menu.focusRect && menu.focusSource && <>
            <div className="ContextMenuFocusBackdrop" onPointerDown={event => {
                if (event.pointerType !== "touch" && event.pointerType !== "pen") closeMenu();
            }}/>
            <div className={`ContextMenuFocusPreview${selectableMessage ? " selectableMessagePreview" : ""}${menu.point === "composition" ? " compositionContextPreview" : menu.point === "wallpaper" ? " wallpaperContextPreview" : ""}`} ref={previewRef} aria-hidden={!selectableMessage}
                onClick={event => {
                    if (!selectableMessage || !(event.target instanceof Element) || !event.target.closest(".contextMessageSelectable")) return;
                    event.stopPropagation();
                    if (event.target.closest("a")) event.preventDefault();
                }}
                style={{ top: pos.previewTop ?? 0, left: pos.previewLeft ?? 0,
                    width: pos.previewWidth ?? 0, height: pos.previewHeight ?? 0,
                    visibility: isAdjusted ? "visible" : "hidden" }}/>
        </>}
        <div
            className={"ContextMenuWrapper"+(mobileCalendar?" calendarDayContextMenu":menu.point==="calendarDay"?" calendarDayDesktopMenu":"")}
            data-at-native-menu={menu.point === "composition" ? "composition" : undefined}
            role="menu"
            aria-label={menu.options.name || undefined}
            tabIndex={-1}
            onKeyDown={event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    closeMenu();
                    return;
                }
                if ((event.target as HTMLElement).closest(".calendarContextCalendar, .calendarContextPick")) return;
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
