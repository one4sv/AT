import { useTranslation } from "react-i18next";
import { CheckCircle, ShareFat, PushPin, ClockCountdownIcon } from "@phosphor-icons/react";
import { useChat } from "../../../components/hooks/ChatHook";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { message } from "../../../components/context/ChatContext";
import { useUser } from "../../../components/hooks/UserHook";
import Linkify from "linkify-react";
import { isMobile } from "react-device-detect";
import { useContextMenu } from "../../../components/hooks/ContextMenuHook";
import { useMessages } from "../../../components/hooks/MessagesHook";
import { Check, CheckCheck, UserCircle } from "lucide-react";
import { useNavigate } from "react-router";
import AnswerMess from "../utils/AnswerMess";
import MessageFiles from "../utils/MessageFiles";
import { useSettings } from "../../../components/hooks/SettingsHook";
import { formatAppTime } from "../../../components/ts/utils/dateToStr";
import ReactionIcon from "../../../components/ts/ReactionIcon";
import ReactionPicker from "../../../components/ts/ReactionPicker";
import { SmilePlus } from "lucide-react";
import { useChatMessageScroll } from "../../../components/hooks/utils/useChatMessageScroll";
import HighlightText from "../../../components/ts/HighlightText";
import HabitInvitation from "./HabitInvitation";
type MessageComponentType = {
    message: message;
    messageRefs?: React.MutableRefObject<Map<number, HTMLDivElement | null>>;
    answer?: {
        id: number;
        name: string;
        text: string;
    };
    redir_answer?: {
        id: number;
        name: string;
        text: string;
    };
    scrollToMessage?: (id: number) => void;
    showNames?: (boolean);
    cornerType?: string | null;
};
export default function Message({
    message: m,
    answer,
    showNames,
    redir_answer,
    cornerType
}: MessageComponentType) {
    const {
        scrollToMessage,
        messageRefs,
        highlightedId
    } = useChatMessageScroll();
    const {
        setReaction,
        chatWith,
        activeHeader,
        setActiveHeader
    } = useChat();
    const {
        chosenMess,
        setChosenMess,
        setAnswer
    } = useMessages();
    const { t } = useTranslation("common");
    const { user } = useUser();
    const {
        openMenu,
        closeMenu,
        menu,
        menuRef
    } = useContextMenu();
    const {
        emote,
        messdb
    } = useSettings();
    const { searchMess } = useChat();
    const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
    const [reactionPickerPosition, setReactionPickerPosition] = useState({ top: 0, left: 0 });
    const reactionTriggerRef = useRef<HTMLButtonElement>(null);
    const reactionPopoverRef = useRef<HTMLDivElement>(null);
    const appearRef = useRef<HTMLDivElement>(null);
    const animateIn = useRef(Boolean(m.animateIn));

    useLayoutEffect(
        () => {
            const element = appearRef.current;
            if (!element || !animateIn.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
            const animation = element.animate(
                [{
                    opacity: 0,
                    transform: "translateY(12px) scale(0.97)"
                }, {
                    opacity: 1,
                    transform: "translateY(0) scale(1)"
                }],
                {
                    duration: 260,
                    easing: "cubic-bezier(0.075, 0.82, 0.165, 1)"
                }
            );
            return () => animation.cancel();
        },
        []
    );
    const navigate = useNavigate();
    const messageGetTime = (date: Date | string) => {
        const d = new Date(date);
        return formatAppTime(d);
    };
    const isMy = m.sender_id === user.id ? true : false;
    const isChose = activeHeader === "choosing";
    const contextReactionOpen = menu.visible && menu.point === "mess" && menu.options.id === String(m.id) && !isChose;
    const pickerVisible = reactionPickerOpen || contextReactionOpen;
    const mediaOnly = !m.content?.trim() && !!m.files?.length &&
        !m.redirected_id && !answer && !m.habit_invite_habit_id;
    const uniqueReactions = [...new Map((m.reactions || []).map(reaction => [reaction.user_id, reaction])).values()];
    const reactionGroups = Object.entries(uniqueReactions.reduce((acc, reaction) => {
        if (!acc[reaction.reaction]) acc[reaction.reaction] = [];
        acc[reaction.reaction].push(reaction.user_id);
        return acc;
    }, {} as Record<string, string[]>));
    const ownReactions = uniqueReactions.filter(reaction => reaction.user_id === user.id).map(reaction => reaction.reaction);
    useLayoutEffect(() => {
        if (!pickerVisible) return;

        const updatePosition = () => {
            const popover = reactionPopoverRef.current;
            const anchorElement = contextReactionOpen ? menuRef.current : reactionTriggerRef.current;
            if (!anchorElement || !popover) return;

            const anchor = anchorElement.getBoundingClientRect();
            const width = popover.offsetWidth;
            const height = popover.offsetHeight;
            const preferredLeft = contextReactionOpen
                ? anchor.left + (anchor.width - width) / 2
                : isMy ? anchor.right - width : anchor.left;
            const left = Math.max(8, Math.min(preferredLeft, window.innerWidth - width - 8));
            let top = anchor.top - height - 8;

            if (contextReactionOpen) {
                const preview = document.querySelector<HTMLElement>(".ContextMenuFocusPreview");
                const previewRect = preview?.getBoundingClientRect();
                if (previewRect && top < previewRect.bottom + 8) {
                    const abovePreview = previewRect.top - height - 8;
                    const belowMenu = anchor.bottom + 8;
                    if (abovePreview >= 8) top = abovePreview;
                    else if (belowMenu + height <= window.innerHeight - 8) top = belowMenu;
                }
            }

            if (top < 8) top = Math.min(anchor.bottom + 8, window.innerHeight - height - 8);
            setReactionPickerPosition({ top: Math.max(8, top), left });
        };

        updatePosition();
        const frame = window.requestAnimationFrame(updatePosition);
        window.addEventListener("resize", updatePosition);
        document.addEventListener("scroll", updatePosition, true);

        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("resize", updatePosition);
            document.removeEventListener("scroll", updatePosition, true);
        };
    }, [pickerVisible, contextReactionOpen, isMy, menuRef]);

    useEffect(() => {
        if (!pickerVisible) return;
        const handleOutside = (event: PointerEvent) => {
            const target = event.target as Node;
            if (reactionTriggerRef.current?.contains(target) ||
                reactionPopoverRef.current?.contains(target)) return;
            setReactionPickerOpen(false);
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setReactionPickerOpen(false);
        };
        document.addEventListener("pointerdown", handleOutside, true);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("pointerdown", handleOutside, true);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [pickerVisible]);

    useEffect(() => {
        if (menu.visible) setReactionPickerOpen(false);
    }, [menu.visible]);

    const openContext = (x: number, y: number) => {
        setReactionPickerOpen(false);
        const reaction = m.reactions.find(r => r.user_id === user.id);
        const isReacted = reaction ? reaction.reaction : "none";
        openMenu(
            x,
            y,
            "mess",
            {
                id: String(m.id)
            },
            undefined,
            undefined,
            {
                isReacted,
                isMy: m.sender_id === user.id,
                text: m.content,
                previewText: m.content || (m.files && m.files.length > 0 ? `${m.files.length} mediafile` : t("chatUi.forwarded")),
                sender: m.sender_name,
                files: m.files || undefined,
                is_pinned: m.is_pinned
            }
        );
    };

    return (
        <div
            className={`messageWrapper ${isChose ? "choosing" : ""} ${chosenMess.some(mess => mess.id === m.id) ? "chosen" : ""} ${highlightedId === m.id ? "highlight" : ""}
                ${cornerType ? `corner-${cornerType}` : ""}
                ${menu.point === "mess" && menu.options.id === String(m.id) && "onContextMenu"}
                ${m.isPending ? "pending" : ""}
                ${mediaOnly ? "mediaOnly" : ""}
            `}
            ref={el => {
                messageRefs?.current.set(m.id, el);
            }}
            onMouseDown={e => {
                if (e.detail === 2) {
                    const el = e.currentTarget;
                    el.style.userSelect = "none";
                    setTimeout(() => {
                        el.style.userSelect = "text";
                    }, 300);
                }
            }}
            onClick={() => {
                if (isChose) {
                    if (chosenMess.some(mess => mess.id === m.id)) setChosenMess(prev => prev.filter(mess => mess.id !== m.id)); else setChosenMess(
                        prev => [...prev, {
                            id: m.id,
                            text: m.content
                        }]
                    );
                }
            }}
            data-context-menu="true"
            onContextMenu={e => {
                e.preventDefault();
                openContext(e.clientX, e.clientY);
            }}
            onDoubleClick={e => {
                if (isChose) return;
                e.preventDefault();
                if (messdb === "reaction") {
                    setReaction(m.id, emote);
                } else if (messdb === "answer") {
                    setAnswer(
                        {
                            id: m.id.toString(),
                            sender: m.sender_name,
                            text: m.content,
                            previewText: m.content || (m.files && m.files?.length > 0 ? `${m.files?.length} mediafile` : t("chatUi.forwarded"))
                        }
                    );
                } else if (messdb === "select") {
                    setActiveHeader("choosing");
                    if (!isChose) {
                        setChosenMess(
                            prev => [...prev, {
                                id: m.id,
                                text: m.content
                            }]
                        );
                    }
                }
            }}
        >
            {isChose && <div className="messChoseButt" style={{
                opacity: isChose ? "1" : "0"
            }}>
                {chosenMess.some(mess => mess.id === m.id) ? <CheckCircle weight="fill" /> : <CheckCircle />}
            </div>}
            <div
                ref={appearRef}
                className={`message ${isMy ? "my" : "ur"} ${isMobile ? "mobile" : ""} ${m.isPending ? "pending" : ""} ${mediaOnly ? "mediaOnly" : ""}`}
            >
                {!isMy && (showNames === undefined || showNames === true) && chatWith?.is_group && <div
                    className="senderName"
                    style={{
                        cursor: isChose ? "default" : "pointer"
                    }}
                    onClick={() => !isChose && navigate(`/acc/${m.sender_nick}`)}
                >
                    {m.sender_name}
                </div>}
                {answer && scrollToMessage && <AnswerMess answer={answer} scrollToMessage={scrollToMessage} />}
                {m.habit_invite_habit_id && m.habit_invite_recipient_id ? <HabitInvitation messageId={m.id} recipientId={m.habit_invite_recipient_id} /> : !!m.content?.trim() && <div className={`messageText ${isMobile ? "mobile" : ""}`}>
                    <HighlightText text={m.content} search={searchMess} />
                </div>}
                {m.files && m.files.length > 0 && <MessageFiles files={m.files} m={m} />}
                {m.redirected_id && <div className="redirectedMess">
                    <div className="redirectSign">
                        <ShareFat weight="fill" />
                        {t("chatUi.forwarded")}{m.redirected_name ? ` ${t("chatUi.from")}` : ""}&nbsp;
                        <span onClick={() => navigate(`/acc/${m.redirected_nick}`)}>
                            {m.redirected_name}
                        </span>
                    </div>
                    {m.redirected_answer && redir_answer && m.redirected_name && scrollToMessage && <AnswerMess answer={redir_answer} scrollToMessage={scrollToMessage} />}
                    <div className="redirectText">
                        <Linkify>
                            {m.redirected_content}
                        </Linkify>
                    </div>
                    {m.redirected_files && m.redirected_files.length > 0 && <MessageFiles files={m.redirected_files} m={m} />}
                </div>}
                <div className="messageStatusBarDiv">
                    {isMy && chatWith ? m.isPending ? <div className="messageReadSign ">
                        <ClockCountdownIcon />
                    </div> : m.read_by.length > 0 ? <div className="messageReadSign read">
                        <CheckCheck />
                    </div> : <div className="messageReadSign unread">
                        <Check />
                    </div> : ""}
                    <div className="messageBar">
                        <span className="messTime">{messageGetTime(m.created_at)}</span>
                        {m.edited && <span className="editedMess">{t("chatUi.edited")}</span>}
                        {m.is_pinned && <PushPin weight="fill" className="messBarSvg" />}
                        {reactionGroups.length > 0 && <div className="reactions" role="group" aria-label={t("chatUi.chooseReaction")}>
                            {reactionGroups.map(([reaction, users]) => (
                                <button
                                    type="button"
                                    key={reaction}
                                    className={`reactionItem ${ownReactions.includes(reaction) ? "active" : ""}`}
                                    aria-label={`${t(`reactions.${reaction}`)}: ${users.length}`}
                                    aria-pressed={ownReactions.includes(reaction)}
                                    title={t(`reactions.${reaction}`)}
                                    onClick={event => {
                                        event.stopPropagation();
                                        void setReaction(m.id, reaction);
                                    }}
                                >
                                    <span className="reactionItemMain">
                                        <ReactionIcon value={reaction} size={21} />
                                        {users.length >= 4 && <span className="reactionCount">{users.length}</span>}
                                    </span>
                                    <span className="reactionUsers" aria-hidden="true">
                                        {users.slice(0, 4).map(userId => {
                                            const member = chatWith?.is_group
                                                ? chatWith.members.find(member => member.id === userId)
                                                : null;
                                            const name = userId === user.id
                                                ? t("chatUi.you")
                                                : member?.nick || (m.sender_id === userId ? m.sender_name : chatWith?.name || chatWith?.nick || "");
                                            const avatar = userId === user.id
                                                ? user.avatar_url
                                                : chatWith?.is_group
                                                    ? member?.avatar_url || (m.sender_id === userId ? m.sender_avatar_url : "")
                                                    : chatWith?.avatar_url;

                                            return (
                                                <span key={userId} className="reactionUser" title={name}>
                                                    {avatar ? <img src={avatar} alt="" loading="lazy" /> : <UserCircle size={14} aria-hidden="true" />}
                                                </span>
                                            );
                                        })}
                                    </span>
                                </button>
                            ))}
                        </div>}
                        {!isChose && !m.isPending && <button
                            ref={reactionTriggerRef}
                            type="button"
                            className={`reactionTrigger ${reactionPickerOpen ? "active" : ""}`}
                            title={t("chatUi.chooseReaction")}
                            aria-label={t("chatUi.chooseReaction")}
                            aria-expanded={reactionPickerOpen}
                            onClick={event => {
                                event.stopPropagation();
                                setReactionPickerOpen(current => !current);
                            }}
                        >
                            <SmilePlus size={15} strokeWidth={1.9} />
                        </button>}
                    </div>
                </div>
                {pickerVisible && !isChose && createPortal(
                    <div
                        ref={reactionPopoverRef}
                        className="reactionPopover"
                        style={reactionPickerPosition}
                    >
                        <ReactionPicker
                            activeReactions={ownReactions}
                            onSelect={reaction => {
                                void setReaction(m.id, reaction);
                                setReactionPickerOpen(false);
                                if (contextReactionOpen) closeMenu();
                            }}
                        />
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}
