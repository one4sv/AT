import { useNavigate, useParams } from "react-router";
import { useChat } from "../../components/hooks/ChatHook";
import { useMessages } from "../../components/hooks/MessagesHook";
import { useUser } from "../../components/hooks/UserHook";
import "./scss/Chat.scss";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DateDivider from "./components/DateDivider";
import Message from "./components/Message";
import ChatUser from "./components/ChatUser";
import { ChatTAWrapper } from "./components/ChatTAWrapper";

import { isSameDay } from "./utils/isSameDay";
import { isMobile } from "react-device-detect";
import { api } from "../../components/ts/api";
import type { message } from "../../components/context/ChatContext";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import getCornerType from "./components/getCornet";
import SystemMessage from "./components/SystemMessage";
import Loader from "../../components/ts/Loader";
import { LoaderSmall } from "../../components/ts/LoaderSmall";

export default function Chat() {
    const { user, loadingUser } = useUser();
    const {
        refetchChatWLoading,
        chatLoading,
        messages,
        chatWith,
        refetchGroupChatWLoading,
        searchMess: search,
        setSearchMess: setSearch,
        searchInputRef,
        hasMore,
        loadingMore,
        loadOlderMessages,
        loadAroundMessage,
    } = useChat();

    const {
        chosenMess,
        setChosenMess,
        isChose,
        setIsChose,
        pendingScrollId,
        setPendingScrollId,
    } = useMessages();

    const { setTitle } = usePageTitle();
    const { nick, id } = useParams();
    const navigate = useNavigate();

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [highlightedId, setHighlightedId] = useState<number | null>(null);
    const [showGoDown, setShowGoDown] = useState(false);
    const [mess, setMess] = useState<string>("");

    const searchItemRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const chatContainerRef = useRef<HTMLDivElement | null>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
    const highlightTimeoutRef = useRef<number | null>(null);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const isLoadingMoreRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const initialScrolledRef = useRef(false);

    const API_URL = import.meta.env.VITE_API_URL;

    // ========== Инициализация чата ==========
    useEffect(() => {
        setIsChose(false);
        setChosenMess([]);
        initialScrolledRef.current = false;

        if (id) {
            refetchGroupChatWLoading(id);
        } else if (nick) {
            refetchChatWLoading(nick);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nick, id]);

    useEffect(() => {
        if (!user.id && !loadingUser) navigate(`/acc/${nick}`);
    }, [loadingUser, navigate, nick, user]);

    // ========== Отметка прочитанных ==========
    useEffect(() => {
        const unread = messages.filter(
        (m) => !m.read_by.includes(user.id!) && m.sender_id !== user.id
        );

        if (unread.length) {
        unread.forEach((m) =>
            api.post(`chat/read`, { messageId: m.id }, { withCredentials: true })
        );
        }
    }, [API_URL, messages, user.id]);

    // ========== Поиск ==========
    const searchedMessages = useMemo(() => {
        if (!search.trim()) return [];
        return messages
        .filter(
            (m) =>
            m.content.toLowerCase().includes(search.toLowerCase()) ||
            new Date(m.created_at).toLocaleDateString("ru-RU").includes(search)
        )
        .reverse();
    }, [messages, search]);

    const handleArrowClick = (dir: "up" | "down") => {
        setHighlightedId(null);
        if (!searchedMessages.length) return;

        let newIndex = selectedIndex;
        if (dir === "down")
        newIndex = Math.min(searchedMessages.length - 1, selectedIndex + 1);
        if (dir === "up") newIndex = Math.max(0, selectedIndex - 1);

        setSelectedIndex(newIndex);
        const target = searchedMessages[newIndex];
        if (!target) return;
        scrollToMessage(target.id);
    };

    // ========== Переход к сообщению ==========
    const scrollToMessage = useCallback(
        async (targetId: number) => {
            const existingEl = messageRefs.current.get(targetId);
            if (existingEl) {
                if (highlightTimeoutRef.current) {
                    clearTimeout(highlightTimeoutRef.current);
                }
                setHighlightedId(targetId);
                existingEl.scrollIntoView({ behavior: "smooth", block: "center" });

                highlightTimeoutRef.current = window.setTimeout(() => {
                    setHighlightedId(null);
                    highlightTimeoutRef.current = null;
                }, 2000);
                return;
            }

            // Нет — загружаем вокруг
            const success = await loadAroundMessage(targetId);
            if (!success) return;

            // Ждём рендер
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const el = messageRefs.current.get(targetId);
                    if (el) {
                        if (highlightTimeoutRef.current) {
                            clearTimeout(highlightTimeoutRef.current);
                        }
                        setHighlightedId(targetId);
                        el.scrollIntoView({ behavior: "smooth", block: "center" });

                        highlightTimeoutRef.current = window.setTimeout(() => {
                            setHighlightedId(null);
                            highlightTimeoutRef.current = null;
                        }, 2000);
                    }
                });
            });
        },
        [loadAroundMessage]
    );

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!searchedMessages.length) return;
        setHighlightedId(null);

        if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
            Math.min(prev + 1, searchedMessages.length - 1)
        );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            scrollToMessage(searchedMessages[selectedIndex].id);
        }
    };

    // ========== Title ==========
    useEffect(() => {
        if (
        !chatLoading &&
        chatWith &&
        (chatWith.nick === nick || String(chatWith.id) === id)
        ) {
            setTitle(chatWith.name || chatWith.nick);
        }
    }, [chatLoading, chatWith, id, nick, setTitle]);

    // ========== Фокус на textarea ==========
    useEffect(() => {
        if (location.pathname.startsWith("/chat") && !isMobile) {
        textAreaRef.current?.focus();
        }
    }, []);

    // ========== Горячие клавиши ==========
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
        if (
            document.activeElement === searchInputRef.current ||
            document.activeElement instanceof HTMLInputElement ||
            document.activeElement instanceof HTMLTextAreaElement ||
            e.ctrlKey ||
            e.altKey ||
            e.metaKey ||
            e.key === "Escape"
        ) {
            return;
        }

        const selection = window.getSelection();
        if (selection?.toString()) return;

        textAreaRef.current?.focus();

        if (e.key.length === 1) {
            e.preventDefault();
            setMess((prev) => prev + e.key);
        }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [setMess, searchInputRef]);

    // ========== Группировка по дням ==========
    const grouped = useMemo(() => {
        const groups: message[][] = [];

        messages.forEach((msg) => {
        const lastGroup = groups[groups.length - 1];

        if (
            !lastGroup ||
            !isSameDay(
            new Date(lastGroup[0].created_at),
            new Date(msg.created_at)
            )
        ) {
            groups.push([msg]);
        } else {
            lastGroup.push(msg);
        }
        });

        return groups;
    }, [messages]);

    // ========== pendingScrollId ==========
    useEffect(() => {
        if (pendingScrollId === null) return;

        scrollToMessage(pendingScrollId).finally(() => {
        setTimeout(() => setPendingScrollId(null), 600);
        });
    }, [pendingScrollId, scrollToMessage, setPendingScrollId]);

    // ========== Infinite scroll + кнопка "вниз" ==========
    useEffect(() => {
        const el = chatContainerRef.current;
        if (!el) return;

        const onScroll = () => {
        const distanceFromBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowGoDown(distanceFromBottom > 250);

        // Подгрузка старых сообщений
        if (
            el.scrollTop < 150 &&
            hasMore &&
            !isLoadingMoreRef.current &&
            !loadingMore
        ) {
            isLoadingMoreRef.current = true;
            prevScrollHeightRef.current = el.scrollHeight;

            loadOlderMessages().finally(() => {
            requestAnimationFrame(() => {
                if (chatContainerRef.current) {
                const newHeight = chatContainerRef.current.scrollHeight;
                chatContainerRef.current.scrollTop =
                    newHeight - prevScrollHeightRef.current;
                }
                isLoadingMoreRef.current = false;
            });
            });
        }
        };

        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [hasMore, loadingMore, loadOlderMessages]);

    // ========== Скролл вниз после первой загрузки ==========
    useEffect(() => {
        if (
        !chatLoading &&
        messages.length > 0 &&
        chatContainerRef.current &&
        !initialScrolledRef.current
        ) {
        chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        initialScrolledRef.current = true;
        }
    }, [chatLoading, messages.length]);

    if (chatLoading) return <Loader />;

    return (
        <div className={`chatDiv ${isMobile ? "mobile" : ""}`}>
        <ChatUser
            search={search}
            setSearch={setSearch}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            searchedMessages={searchedMessages}
            handleSearchKeyDown={handleSearchKeyDown}
            handleArrowClick={handleArrowClick}
            scrollToMessage={scrollToMessage}
            searchItemRefs={searchItemRefs}
            isChose={isChose}
            setIsChose={setIsChose}
            chosenMess={chosenMess}
            setChosenMess={setChosenMess}
            searchInputRef={searchInputRef}
        />

        <div className="chat" ref={chatContainerRef}>
            {loadingMore && (
            <div
                style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px 0",
                }}
            >
                <LoaderSmall />
            </div>
            )}

            {grouped.map((group) => (
            <div key={group[0].id}>
                <DateDivider currDate={new Date(group[0].created_at)} />

                {group.map((m) => {
                const find = messages.find((mess) => mess.id === m.answer_id);
                const answer = find
                    ? {
                        id: find.id,
                        name: find.sender_name,
                        text:
                        find.content ||
                        (find.files?.length
                            ? `${find.files.length} mediafile`
                            : "Пересланное сообщение"),
                    }
                    : undefined;

                const redir_find = messages.find(
                    (mess) =>
                    mess.id === m.redirected_answer ||
                    mess.redirected_id === m.redirected_answer
                );

                const redir_answer = redir_find
                    ? {
                        id: redir_find.id,
                        name: redir_find.redirected_name || "",
                        text:
                        redir_find.content ||
                        (redir_find.files?.length
                            ? `${redir_find.files.length} mediafile`
                            : "Пересланное сообщение"),
                    }
                    : undefined;

                return m.is_system ? (
                    <SystemMessage
                    key={m.id}
                    m={m}
                    answer={answer}
                    scrollToMessage={answer ? scrollToMessage : undefined}
                    />
                ) : (
                    <Message
                    key={m.id}
                    message={m}
                    highlightedId={highlightedId}
                    messageRefs={messageRefs}
                    answer={answer}
                    redir_answer={redir_answer}
                    scrollToMessage={answer ? scrollToMessage : undefined}
                    cornerType={getCornerType(
                        m.id,
                        messages.map((msg) => msg.id),
                        chosenMess.map((cm) => cm.id)
                    )}
                    />
                );
                })}
            </div>
            ))}
        </div>

        <ChatTAWrapper
            showGoDown={showGoDown}
            handleGoDown={() => {
            chatContainerRef.current?.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: "smooth",
            });
            }}
            scrollToMessage={scrollToMessage}
            textAreaRef={textAreaRef}
            mess={mess}
            setMess={setMess}
        />
        </div>
    );
}