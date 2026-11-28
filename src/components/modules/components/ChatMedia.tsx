import { videoPreviewSource } from "../../ts/utils/videoPlayback";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import {
    LinkIcon,
    PlayIcon
} from "@phosphor-icons/react";
import { useChat } from "../../hooks/ChatHook";
import type { LibraryCategory } from "../../context/ChatContext";
import SharedEntityCard, { type SharedEntityKind } from "../../../pages/Chat/components/SharedEntityCard";
import MessageLinkContent from "../../../pages/Chat/components/MessageLinkContent";
import { internalObjectKind } from "../../../pages/Chat/utils/internalObjectSummary";
import type { Media } from "../../context/ChatContext";
import { parseATEntityLink } from "../../../pages/Chat/utils/parseATEntityLink";
import { api } from "../../ts/api";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useContextMenu } from "../../hooks/ContextMenuHook";
import useOpenLink from "../../hooks/utils/useOpenLink";
import GetIconByType from "../../../pages/Chat/utils/getIconByType";
import Selector from "../../ts/Selector";
import useModalSlider from "../../hooks/utils/useModalSlider";

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
    entity_type?: SharedEntityKind;
    entity_id?: string;
    files?: Media[];
    sender: { id?: string; nick?: string; name?: string; url?: string };
}

const allFilters: { id: LibraryCategory; label: string }[] = [
    { id: "media", label: "media" },
    { id: "link", label: "link" },
    { id: "file", label: "file" },
    { id: "activity", label: "activity" }
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
    const { library } = useChat();
    const filters = allFilters.filter(filter => library?.tabs[filter.id]);
    const filterKey = filters.map(filter => filter.id).join(",");
    const [activeFilter, setActiveFilter] = useState<LibraryCategory>("media");
    const [visited, setVisited] = useState<LibraryCategory[]>([]);
    const effectiveFilter = filters.some(filter => filter.id === activeFilter) ? activeFilter : filters[0]?.id;
    useEffect(() => {
        if (effectiveFilter) {
            setActiveFilter(effectiveFilter);
            const index = filters.findIndex(filter => filter.id === effectiveFilter);
            setVisited(previous => [...new Set([...previous, ...filters.filter((_, i) => Math.abs(i-index) <= 1).map(filter => filter.id)])]);
        }
    }, [effectiveFilter, filterKey]);
    const activeIndex = Math.max(0, filters.findIndex(filter => filter.id === effectiveFilter));
    const select = useCallback((category: LibraryCategory) => {
        const index = filters.findIndex(filter => filter.id === category);
        if (index < 0) return;
        setActiveFilter(category);
        setVisited(previous => [...new Set([...previous, ...filters.filter((_, i) => Math.abs(i - index) <= 1).map(filter => filter.id)])]);
    }, [filterKey]);
    const slider = useModalSlider(activeIndex, filters.length, filterKey, index => select(filters[index].id));
    const [scrollPosition, setScrollPosition] = useState(activeIndex);
    const positionRef = useRef(slider.position);
    positionRef.current = slider.position;
    const initialFilterKey = useRef<string | null>(null);
    const updateScrollPosition = (viewport: HTMLDivElement) => {
        if (viewport.clientWidth) setScrollPosition(Math.max(0, Math.min(filters.length - 1, viewport.scrollLeft / viewport.clientWidth)));
    };
    // One physical offset for both the content and Selector, just as in Acc.
    useLayoutEffect(() => {
        const viewport = slider.viewportRef.current;
        if (!viewport || !filters.length) return;
        const initial = initialFilterKey.current !== filterKey;
        initialFilterKey.current = filterKey;
        const target = slider.position;
        const write = (position: number) => {
            viewport.scrollLeft = position * viewport.clientWidth;
            updateScrollPosition(viewport);
        };
        if (initial || slider.previewIndex !== null || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            write(target);
            return;
        }
        const start = viewport.clientWidth ? viewport.scrollLeft / viewport.clientWidth : target;
        if (Math.abs(start - target) < .001) { write(target); return; }
        let frame = 0;
        const began = performance.now();
        const tick = (now: number) => {
            const progress = Math.min(1, (now - began) / 320);
            write(start + (target - start) * (1 - Math.pow(1 - progress, 3)));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [activeIndex, slider.previewIndex, filterKey]);
    useLayoutEffect(() => {
        const viewport = slider.viewportRef.current;
        if (!viewport) return;
        let width = viewport.clientWidth;
        const observer = new ResizeObserver(() => {
            if (width === viewport.clientWidth) return;
            width = viewport.clientWidth;
            viewport.scrollLeft = positionRef.current * width;
            updateScrollPosition(viewport);
        });
        observer.observe(viewport);
        return () => observer.disconnect();
    }, [filterKey]);

    if (!filters.length) return null;
    return (
        <div className="chatMedia">
            {filters.length > 1 && <div className="chatMediaFilters">
                <Selector key={filterKey} selected={effectiveFilter!} previewIndex={scrollPosition} onPreviewIndexChange={slider.setPreviewIndex}
                    arr={filters.map(filter => ({
                        value: filter.id,
                        label: t(`chatMedia.${filter.label}`),
                        func: select
                    }))}/>
            </div>}
            <div className="chatMediaViewport" ref={slider.viewportRef} onClickCapture={slider.onClickCapture} onScroll={event => {
                if (event.target === event.currentTarget) updateScrollPosition(event.currentTarget);
            }}>
                <div className="chatMediaTrack">
                    {filters.map(filter => (
                        filter.id === "activity" ? <ActivityPanel key={filter.id} active={filter.id === effectiveFilter}/> :
                        <ChatMediaPanel key={filter.id} activeFilter={filter.id}
                            active={filter.id === effectiveFilter} enabled={visited.includes(filter.id) || filter.id === effectiveFilter}/>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ChatMediaPanel({ activeFilter, active, enabled }: { activeFilter: Exclude<LibraryCategory, "activity">; active: boolean; enabled: boolean }) {
    const { t } = useTranslation("common");
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
    const chatId = chatWith?.chat_id;

    const loadPage = useCallback(async (reset = false) => {
        if (!chatId || loadingRef.current || (!hasMoreRef.current && !reset)) return;

        loadingRef.current = true;
        setLoading(true);
        setError("");

        const requestId = ++requestRef.current;
        const cursor = reset ? null : beforeIdRef.current;

        try {
            const response = await api.get(`/chat/library/${encodeURIComponent(chatId)}`, {
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
    }, [chatId, activeFilter, t]);

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
                root: panelRef.current,
                rootMargin: "300px",
                threshold: 0
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [active, enabled, hasMore, loading, error, loadPage]);

    const filtered = items.map(item => {
        const entity = item.category === "link" && !item.entity_type ? parseATEntityLink(item.url) : null;
        return entity ? {...item, entity_type: entity.kind, entity_id: entity.id} : item;
    });

    const openMedia = (item: ChatMediaItem) => {
        if (item.entity_type || (item.category === "link" && internalObjectKind(item.url))) return;
        if (item.category === "link") {
            openLink(item.url, true);
            return;
        }


        if ((item.category === "photo" || item.category === "video") && chatWith) {
            const chatPath = chatWith.is_group ? `g/${chatWith.id}` : chatWith.nick;
            const photos = items.filter(media => media.category === "photo" || media.category === "video");
            const imageIndex = photos.findIndex(photo => photo.id === item.id);

            setBlackout({
                seted: true,
                module: "ImgPrev",
                img: item.url,
                images: photos.map(photo => ({
                    url: photo.url,
                    name: photo.name,
                    type: photo.category === "video" ? (photo.type?.startsWith("video/") ? photo.type : "video/unknown") : photo.type,
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
            aria-hidden={!active} inert={!active}>
                <AnimatePresence mode="wait" initial={false}>
                    {filtered.length > 0 ? (
                        <motion.div
                            key={activeFilter}
                            className={`chatMediaGrid chatMediaGrid${activeFilter === "media" ? "photo" : activeFilter}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.2 }}
                        >
                            {filtered.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    className={`chatMediaItem chatMedia${item.category}${item.entity_type || (item.category === "link" && internalObjectKind(item.url)) ? " chatMediaEntity" : ""}`}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{
                                        opacity: { duration: 0.2 },
                                        scale: { duration: 0.2 },
                                        y: { duration: 0.2 },
                                        delay: Math.min(index * 0.025, 0.25)
                                    }}
                                    data-context-menu="true"
                                    onContextMenu={event => { if (!item.entity_type) openMediaMenu(event, item); }}
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
                                                src={videoPreviewSource(item.url, "metadata")}
                                                playsInline
                                                preload="metadata"
                                            />
                                            <PlayIcon
                                                className="chatMediaPlay"
                                                size={30}
                                                weight="fill"
                                            />
                                        </>
                                    )}

                                    {item.entity_type && item.entity_id ? <SharedEntityCard kind={item.entity_type} id={item.entity_id} fallbackUrl={item.url || undefined}/> : item.category === "link" && internalObjectKind(item.url) ? <MessageLinkContent text={item.url} search="" files={item.files}/> : item.category === "link" && (
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

function ActivityPanel({active}: {active:boolean}) {
    const { library } = useChat();
    const { setBlackout } = useBlackout();
    const { t } = useTranslation("common");
    const groups = [{kind:"habit",label:"activities"},{kind:"plan",label:"plans"},{kind:"goal",label:"goals"}] as const;
    return <div className={`chatMediaBody chatMediaPanel chatLibraryActivity${active ? " active" : ""}`} aria-hidden={!active} inert={!active}>
        {groups.map(group => {
            const items = library?.activity.filter(item => item.kind === group.kind) || [];
            return items.length > 0 && <details key={group.kind} open>
                <summary>{t("chatMedia."+group.label)} · {items.length}</summary>
                {items.map(item => item.kind === "goal" ? <button key={item.id} type="button" onClick={() => setBlackout({seted:true,module:"GoalDetails",options:{id:item.id}})}>{item.name}</button> : <SharedEntityCard key={item.id} kind={item.kind} id={item.id}/>)}
            </details>;
        })}
    </div>;
}
