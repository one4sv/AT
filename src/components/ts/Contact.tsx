import type { Contact } from "../context/ContactsContext";
import { PushPin, SpeakerSimpleX, BookmarkSimpleIcon } from "@phosphor-icons/react";
import { Check, CheckCheck, CircleUserRound } from "lucide-react";
import { isMobile } from "react-device-detect";
import { useChat } from "../hooks/ChatHook";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDrop } from "../hooks/DropHook";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";
import { useUser } from "../hooks/UserHook";
import { useIdentify } from "../hooks/utils/useIdentify";
import { useMemo } from "react";
import { useSideMenu } from "../hooks/SideMenuHook";
import { useTranslation } from "react-i18next";
import { useContacts } from "../hooks/ContactsHook";

export interface ContactType {
    contact: Contact;
}

export default function Contact({ contact }: ContactType) {
    const { t, i18n } = useTranslation("common");
    const { typingMap } = useChat();
    const { onlineMap } = useContacts();
    const { setBlackout } = useBlackout();
    const { openMenu } = useContextMenu();
    const { setDroppedFiles } = useDrop();
    const { setIsChose } = useMessages();
    const { user } = useUser();
    const { closeMenu } = useSideMenu();
    const { nick, id } = useParams<{ nick: string; id: string }>();
    const navigate = useNavigate();

    const isFavorite = contact.id === user.id;

    const { identified: targetForLast } = useIdentify(
        contact.lastMessage?.is_system && contact.lastMessage?.target_id
            ? contact.lastMessage.target_id.toString()
            : null
    );

    const partsLast = useMemo(() => {
        if (
            !contact.lastMessage?.is_system ||
            !contact.lastMessage?.content ||
            !contact.lastMessage.target_id
        ) {
            return null;
        }

        const split = contact.lastMessage.content.split("{}");
        if (split.length === 2) {
            return { before: split[0], after: split[1] };
        }
        return null;
    }, [contact.lastMessage?.content, contact.lastMessage?.is_system, contact.lastMessage?.target_id]);

    const messageGetTime = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (diff < oneDay) {
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        return d.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : undefined, {
            day: "numeric",
            month: "short",
        });
    };

    const handleDrop = (e: React.DragEvent<HTMLAnchorElement>, nick: string) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);

        if (droppedFiles.length > 0) {
            navigate(`/chat/${nick}`);
            setTimeout(() => {
                setDroppedFiles((prev) => [...prev, ...droppedFiles]);
            }, 10);
        }
    };

    const typingNames = typingMap[contact.id] || [];
    let typingText: string | null = null;

    if (typingNames.length > 0) {
        if (contact.is_group) {
            typingText = t("contact.typingGroup", { names: typingNames.join(", ") });
        } else {
            typingText = t("contact.typing");
        }
    }

    const getName = () => {
        if (isFavorite) return "Избранное";
        if (contact.name) return contact.name;
        return contact.nick;
    };

    const getAvatar = () => {
        if (isFavorite) {
            return <BookmarkSimpleIcon weight="fill" className="favoriteIcon" />;
        }

        if (contact.avatar_url) {
            return (
                <img
                    className="contactsUserAvatar"
                    src={contact.avatar_url}
                    alt={contact.name ?? contact.nick}
                />
            );
        }

        return <CircleUserRound />;
    };

    const getReadStatus = () => {
        if (!contact.lastMessage) return null;

        if (contact.lastMessage.sender_id !== user.id) {
            if (contact.unread_count > 0) {
                return <div className="contactsUnreadCount">{contact.unread_count}</div>;
            }
            return null;
        }

        if (contact.lastMessage.read_by.length > 0) {
            return <CheckCheck className="isReadCL" height={18} />;
        }

        return <Check className="isReadCL" height={18} />;
    };

    const getLastMessageContent = () => {
        if (!contact.lastMessage) return null;

        const msg = contact.lastMessage;

        if (msg.is_system) {
            if (partsLast && targetForLast) {
                return `${partsLast.before}${targetForLast.name || targetForLast.nick}${partsLast.after}`;
            }
            return msg.content;
        }

        if (msg.content) {
            return msg.content;
        }

        if (msg.files?.length) {
            if (msg.files.length > 1) {
                return `${msg.files.length} ${t("contact.mediafiles")}`;
            }
            return `1 ${t("contact.mediafile")}`;
        }

        return t("contact.forwardedMessage");
    };

    const getSenderPrefix = () => {
        if (!contact.lastMessage) return null;

        const msg = contact.lastMessage;

        if (msg.is_system) {
            return <span className="lmsender lmcExtra">{msg.sender_name}</span>;
        }

        if (msg.sender_id === user.id) {
            return <span>{t("contact.you")}</span>;
        }

        if (contact.is_group) {
            return <span>{msg.sender_name}:</span>;
        }

        return null;
    };

    const isActive = nick === contact.nick || id === contact.id;

    return (
        <Link
            className={`contactsUser ${isActive ? "active" : ""}`}
            key={contact.id}
            onClick={() => {
                setBlackout({ seted: false });
                setIsChose(false);
                closeMenu();
            }}
            to={contact.is_group ? `chat/g/${contact.id}` : `chat/${contact.nick}`}
            onContextMenu={(e) => {
                e.preventDefault();
                openMenu(
                    e.clientX,
                    e.clientY,
                    "chat",
                    {
                        id: contact.id,
                        isMy: contact.lastMessage?.id !== undefined,
                        name: contact.name ? contact.name : contact.nick,
                        nick: contact.nick,
                    },
                    undefined,
                    {
                        note: contact.note,
                        is_blocked: contact.is_blocked,
                        pinned: contact.pinned,
                        is_group: contact.is_group,
                    }
                );
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                handleDrop(e, contact.nick);
            }}
        >
            <div className="contactsUserPic">
                {getAvatar()}
                {!isFavorite && (
                    <div
                        className={`contactOnlineStauts ${
                            nick !== contact.nick && onlineMap[contact?.id || ""]
                                ? "online"
                                : "offline"
                        }`}
                    />
                )}
            </div>

            <div className={`contactsUserInfo ${isMobile ? "mobile" : ""}`}>
                <div className="contactsUserStr">
                    <span className="nameSpan">
                        {getName()}
                        {contact.note === false && <SpeakerSimpleX weight="fill" />}
                        {contact.pinned && <PushPin weight="fill" />}
                    </span>

                    {!contact.lastMessage && contact.name && (
                        <span className="secSpan">| {contact.nick}</span>
                    )}

                    {getReadStatus()}
                </div>

                {typingText ? (
                    <div className="nowTyping lmcExtra">{typingText}</div>
                ) : (
                    contact.lastMessage && (
                        <div className={`lastMess ${isMobile ? "mobile" : ""}`}>
                            <div>
                                {getSenderPrefix()}
                                <span
                                    className={`lmc ${
                                        !contact.lastMessage.content || contact.lastMessage.is_system
                                            ? "lmcExtra"
                                            : ""
                                    }`}
                                >
                                    {getLastMessageContent()}
                                </span>
                            </div>
                            <span className="messageGetTime">
                                {messageGetTime(contact.lastMessage.created_at)}
                            </span>
                        </div>
                    )
                )}
            </div>
        </Link>
    );
}