import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
    LinkIcon,
    PlayIcon
} from "@phosphor-icons/react";
import { useChat } from "../../hooks/ChatHook";
import { api } from "../../ts/api";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useContextMenu } from "../../hooks/ContextMenuHook";
import useOpenLink from "../../hooks/utils/useOpenLink";
import GetIconByType from "../../../pages/Chat/utils/getIconByType";
import Selector from "../../ts/Selector";
import useCompactLayout from "../../hooks/utils/useCompactLayout";
import { useSideMenu } from "../../hooks/SideMenuHook";

type MediaCategory = "photo" | "video" | "link" | "file";

interface ChatMediaItem {
    id: string | number;
    message_id: number;
    url: string;
    name: string;
    type: string;
    size: number;
    created_at: string;
    sender_id: string;
    category: MediaCategory;
    sender: { id?: string; nick?: string; name?: string; url?: string };
}

const filters: { id: MediaCategory; label: string }[] = [
    { id: "photo", label: "photo" },
    { id: "video", label: "video" },
    { id: "link", label: "link" },
    { id: "file", label: "file" }
];

const skeletons = Array.from({ length: 3 }, (_, index) => index);

const cardVariants = {
    hidden: {
        opacity: 0,
        scale: 0.88,
        y: 10
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: -6
    }
};

export default function ChatMedia() {
    const { t } = useTranslation("common");
    const { setDontHandle, dontHandleOther } = useSideMenu();
    const { menu } = useContextMenu();
    const [activeFilter, setActiveFilter] = useState<MediaCategory>("photo");
    const [visited, setVisited] = useState<MediaCategory[]>(["photo", "video"]);
    const [dragOffset, setDragOffset] = useState<number | null>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const blocked = useRef(false);
    const suppressClick = useRef(false);
    blocked.current = dontHandleOther || menu.visible;
    const activeIndex = filters.findIndex(filter => filter.id === activeFilter);
    const select = useCallback((category: MediaCategory) => {
        const index = filters.findIndex(filter => filter.id === category);
        setActiveFilter(category);
        setVisited(previous => [...new Set([...previous, ...filters.filter((_, i) => Math.abs(i - index) <= 1).map(filter => filter.id)])]);
    }, []);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return;
        let press: { x: number; y: number; id: number; width: number; owned: boolean } | null = null;
        const release = () => {
            if (press?.owned) setDontHandle(false);
            press = null;
            setDragOffset(null);
        };
        const start = (event: TouchEvent) => {
            release();
            suppressClick.current = false;
            if (event.touches.length !== 1 || blocked.current || !(event.target instanceof Element) ||
                event.target.closest("button, input, textarea, select, [contenteditable=true]")) return;
            const touch = event.touches[0];
            press = { x: touch.clientX, y: touch.clientY, id: touch.identifier, width: Math.max(1, viewport.clientWidth), owned: false };
        };
        const move = (event: TouchEvent) => {
            if (!press || event.touches.length !== 1 || blocked.current || event.defaultPrevented) { release(); return; }
            const touch = event.touches[0];
            if (touch.identifier !== press.id) { release(); return; }
            const dx = touch.clientX - press.x;
            const dy = touch.clientY - press.y;
            if (!press.owned) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
                if (Math.abs(dx) <= Math.abs(dy)) { release(); return; }
                press.owned = true;
                suppressClick.current = true;
                setDontHandle(true);
            }
            if (event.cancelable) event.preventDefault();
            const raw = dx / press.width;
            const min = -Math.min(1, filters.length - 1 - activeIndex);
            const max = Math.min(1, activeIndex);
            setDragOffset(Math.max(min, Math.min(max, raw)));
        };
        const end = (event: TouchEvent) => {
            if (press?.owned && !blocked.current) {
                const touch = Array.from(event.changedTouches).find(item => item.identifier === press?.id);
                if (touch) {
                    const dx = touch.clientX - press.x;
                    if (Math.abs(dx) >= Math.min(press.width * .25, 85)) {
                        const next = Math.max(0, Math.min(filters.length - 1, activeIndex + (dx < 0 ? 1 : -1)));
                        select(filters[next].id);
                    }
                }
            }
            release();
        };
        viewport.addEventListener("touchstart", start, { passive: true });
        viewport.addEventListener("touchmove", move, { passive: false });
        viewport.addEventListener("touchend", end);
        viewport.addEventListener("touchcancel", release);
        return () => {
            viewport.removeEventListener("touchstart", start);
            viewport.removeEventListener("touchmove", move);
            viewport.removeEventListener("touchend", end);
            viewport.removeEventListener("touchcancel", release);
            if (press?.owned) setDontHandle(false);
        };
    }, [activeIndex, select, setDontHandle]);

    return (
        <div className="chatMedia">
            <div className="chatMediaFilters">
                <Selector selected={activeFilter} previewIndex={dragOffset === null ? undefined : activeIndex - dragOffset}
                    arr={filters.map(filter => ({
                        value: filter.id,
                        label: t(`chatMedia.${filter.label}`),
                        func: select
                    }))}/>
            </div>
            <div className="chatMediaViewport" ref={viewportRef}
                onPointerDownCapture={() => { suppressClick.current = false; }}
                onClickCapture={event => {
                    if (!suppressClick.current) return;
                    suppressClick.current = false;
                    event.preventDefault();
                    event.stopPropagation();
                }}>
                <div className={`chatMediaTrack${dragOffset !== null ? " dragging" : ""}`}
                    style={{ transform: `translateX(${(-activeIndex + (dragOffset ?? 0)) * 100}%)` }}>
                    {filters.map((filter, index) => (
                        <ChatMediaPanel key={filter.id} activeFilter={filter.id}
                            active={filter.id === activeFilter} enabled={visited.includes(filter.id)} index={index}/>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ChatMediaPanel({ activeFilter, active, enabled, index }: { activeFilter: MediaCategory; active: boolean; enabled: boolean; index: number }) {
    const { t } = useTranslation("common");
    const isMobile = useCompactLayout();
    const openLink = useOpenLink();
    const { chatWith } = useChat();
    const { setBlackout } = useBlackout();
    const { openMenu } = useContextMenu();

    const [items, setItems] = useState<ChatMediaItem[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const requestRef = useRef(0);
    const loadingRef = useRef(false);
    const beforeIdRef = useRef<string | number | null>(null);
    const hasMoreRef = useRef(true);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const chatType = chatWith?.is_group ? "group" : "user";
    const chatId = chatWith?.is_group ? chatWith.id : chatWith?.nick;

    const loadPage = useCallback(async (reset = false) => {
        if (!chatId || loadingRef.current || (!hasMoreRef.current && !reset)) return;

        loadingRef.current = true;
        setLoading(true);
        setError("");

        const requestId = ++requestRef.current;
        const cursor = reset ? null : beforeIdRef.current;

        try {
            const response = await api.get(`/media/${chatType}/${encodeURIComponent(chatId)}`, {
                params: {
                    limit: 40,
                    category: activeFilter,
                    beforeId: cursor ?? undefined
                }
            });

            if (requestId !== requestRef.current) return;

            const data = response.data;

            if (!data.success) throw new Error(t("chatMedia.loadFailed"));

            const pageItems = data.items as ChatMediaItem[];

            setItems(previous => {
                const next = reset ? [] : previous;
                const ids = new Set(next.map(item => String(item.id)));

                return [
                    ...next,
                    ...pageItems.filter(item => {
                        const itemId = String(item.id);

                        if (ids.has(itemId)) return false;

                        ids.add(itemId);
                        return true;
                    })
                ];
            });

            beforeIdRef.current = data.nextBeforeId ?? null;
            hasMoreRef.current = Boolean(data.hasMore);
            setHasMore(Boolean(data.hasMore));
        } catch {
            if (requestId === requestRef.current) {
                setError(t("chatMedia.loadFailed"));
            }
        } finally {
            if (requestId === requestRef.current) {
                loadingRef.current = false;
                setLoading(false);
            }
        }
    }, [chatId, chatType, activeFilter, t]);

    useEffect(() => {
        if (!enabled) return;
        requestRef.current++;
        loadingRef.current = false;
        beforeIdRef.current = null;
        hasMoreRef.current = true;

        setItems([]);
        setHasMore(true);
        setError("");
        setLoading(false);

        void loadPage(true);

        return () => {
            requestRef.current++;
        };
    }, [enabled, loadPage]);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!active || !enabled || !sentinel || !hasMore || loading || error) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    void loadPage();
                }
            },
            {
                root: isMobile ? panelRef.current : null,
                rootMargin: "300px",
                threshold: 0
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [active, enabled, hasMore, loading, error, loadPage, isMobile]);

    const filtered = items.filter(item => item.category === activeFilter);

    const openMedia = (item: ChatMediaItem) => {
        if (item.category === "link") {
            openLink(item.url, true);
            return;
        }


        if (item.category === "photo" && chatWith) {
            const chatPath = chatWith.is_group ? `g/${chatWith.id}` : chatWith.nick;
            const photos = items.filter(media => media.category === "photo");
            const imageIndex = photos.findIndex(photo => photo.id === item.id);

            setBlackout({
                seted: true,
                module: "ImgPrev",
                img: item.url,
                images: photos.map(photo => ({
                    url: photo.url,
                    name: photo.name,
                    options: {
                        nick: chatPath,
                        id: String(photo.message_id),
                        name: photo.name,
                        url: photo.url
                    },
                    sender: photo.sender
                })),
                imageIndex,
                options: {
                    nick: chatPath,
                    id: String(item.message_id),
                    name: item.name,
                    url: item.url
                },
                sender: item.sender
            });
        }
    };

    const openMediaMenu = (event: MouseEvent<HTMLDivElement>, item: ChatMediaItem) => {
        event.preventDefault();
        event.stopPropagation();

        if (!chatWith) return;

        openMenu(event.clientX, event.clientY, "media", {
            id: String(item.message_id),
            nick: chatWith.is_group ? `g/${chatWith.id}` : chatWith.nick,
            name: item.name,
            url: item.url,
            type: item.category === "link" ? "text/url" : item.type,
            onCopyLink: item.category === "link" ? () => { void navigator.clipboard.writeText(item.url); } : undefined
        });
    };

    const formatSize = (size: number) => {
        if (!size) return "";
        if (size < 1024) return `${size} ${t("chatMedia.bytes")}`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} ${t("chatMedia.kb")}`;

        return `${(size / (1024 * 1024)).toFixed(1)} ${t("chatMedia.mb")}`;
    };

    const renderSkeletons = () => (
        <motion.div
            key={`loading-${activeFilter}`}
            className={`chatMediaLoading${activeFilter === "link" ? " chatMediaLoadinglink" : ""}`}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {skeletons.map(index => (
                <motion.div
                    key={index}
                    className={`chatMediaLoadingItem${activeFilter === "link" ? " chatMediaLoadingItemlink" : ""}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        transition: {
                            delay: index * 0.035,
                            duration: 0.22
                        }
                    }}
                />
            ))}
        </motion.div>
    );

    return (
        <div ref={panelRef} className={`chatMediaBody chatMediaPanel${active ? " active" : ""}`}
            style={{ left: `${index * 100}%` }} aria-hidden={!active} inert={!active}>
                <AnimatePresence mode="wait" initial={false}>
                    {filtered.length > 0 ? (
                        <motion.div
                            key={activeFilter}
                            className={`chatMediaGrid chatMediaGrid${activeFilter}`}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                        >
                            {filtered.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    className={`chatMediaItem chatMedia${item.category}`}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{
                                        layout: {
                                            type: "spring",
                                            stiffness: 350,
                                            damping: 30
                                        },
                                        opacity: { duration: 0.2 },
                                        scale: { duration: 0.2 },
                                        y: { duration: 0.2 },
                                        delay: Math.min(index * 0.025, 0.25)
                                    }}
                                    data-context-menu="true"
                                    onContextMenu={event => openMediaMenu(event, item)}
                                    onClick={() => openMedia(item)}
                                >
                                    {item.category === "photo" && (
                                        <img
                                            src={item.url}
                                            alt={item.name}
                                            loading="lazy"
                                        />
                                    )}

                                    {item.category === "video" && (
                                        <>
                                            <video
                                                src={item.url}
                                                preload="metadata"
                                            />
                                            <PlayIcon
                                                className="chatMediaPlay"
                                                size={30}
                                                weight="fill"
                                            />
                                        </>
                                    )}

                                    {item.category === "link" && (
                                        <>
                                            <LinkIcon size={25} />
                                            <span>{item.name}</span>
                                        </>
                                    )}

                                    {item.category === "file" && (
                                        <a
                                            href={item.url}
                                            download={item.name}
                                            className="messageFileOther"
                                            onClick={event => event.stopPropagation()}
                                        >
                                            {GetIconByType(item.name, item.type)}
                                            <span>{item.name}</span>
                                            <small>{formatSize(item.size)}</small>
                                        </a>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : loading || !enabled ? (
                        renderSkeletons()
                    ) : (
                        <motion.div
                            key={`empty-${activeFilter}`}
                            className="chatMediaEmpty"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {error || t("chatMedia.empty")}
                        </motion.div>
                    )}
                </AnimatePresence>

                {loading && filtered.length > 0 && (
                    <AnimatePresence>
                        {renderSkeletons()}
                    </AnimatePresence>
                )}

                {error && filtered.length > 0 && (
                    <motion.div
                        className="chatMediaStatus"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                        <button
                            type="button"
                            onClick={() => void loadPage()}
                        >
                            {t("chatMedia.retry")}
                        </button>
                    </motion.div>
                )}

                <div
                    ref={sentinelRef}
                    className="chatMediaSentinel"
                    aria-hidden="true"
                />
        </div>
    );
}