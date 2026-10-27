import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    LinkIcon,
    PlayIcon
} from "@phosphor-icons/react";
import { useChat } from "../../hooks/ChatHook";
import { api } from "../../ts/api";
import { useBlackout } from "../../hooks/BlackoutHook";
import { useParams } from "react-router";
import useOpenLink from "../../hooks/utils/useOpenLink";
import GetIconByType from "../../../pages/Chat/utils/getIconByType";

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
    { id: "photo", label: "Фото" },
    { id: "video", label: "Видео" },
    { id: "link", label: "Ссылки" },
    { id: "file", label: "Файлы" }
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
    const openLink = useOpenLink();
    const { chatWith } = useChat();
    const { setBlackout } = useBlackout();
    const { nick, id } = useParams();

    const [activeFilter, setActiveFilter] = useState<MediaCategory>("photo");
    const [items, setItems] = useState<ChatMediaItem[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const requestRef = useRef(0);
    const loadingRef = useRef(false);
    const beforeIdRef = useRef<string | number | null>(null);
    const hasMoreRef = useRef(true);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const loadPage = useCallback(async (reset = false) => {
        if (!chatWith || loadingRef.current || (!hasMoreRef.current && !reset)) return;

        loadingRef.current = true;
        setLoading(true);
        setError("");

        const requestId = ++requestRef.current;
        const cursor = reset ? null : beforeIdRef.current;

        try {
            const type = chatWith.is_group ? "group" : "user";
            const chatId = chatWith.is_group
                ? chatWith.id
                : encodeURIComponent(chatWith.nick);

            const response = await api.get(`/media/${type}/${chatId}`, {
                params: {
                    limit: 40,
                    category: activeFilter,
                    beforeId: cursor ?? undefined
                }
            });

            if (requestId !== requestRef.current) return;

            const data = response.data;

            if (!data.success) throw new Error("Не удалось загрузить медиа");

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
                setError("Не удалось загрузить медиа");
            }
        } finally {
            if (requestId === requestRef.current) {
                loadingRef.current = false;
                setLoading(false);
            }
        }
    }, [chatWith, activeFilter]);

    useEffect(() => {
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
    }, [loadPage]);

    useEffect(() => {
        const sentinel = sentinelRef.current;

        if (!sentinel || !hasMore || loading || error) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries.some(entry => entry.isIntersecting)) {
                    void loadPage();
                }
            },
            {
                root: null,
                rootMargin: "300px",
                threshold: 0
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasMore, loading, error, loadPage]);

    const filtered = items.filter(item => item.category === activeFilter);

    const openMedia = (item: ChatMediaItem) => {
        if (item.category === "link") {
            openLink(item.url, true);
            return;
        }


        if (item.category === "photo") {
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
                        nick: nick ? nick : `g/${id}`,
                        id: String(photo.message_id),
                        name: photo.name,
                        url: photo.url
                    },
                    sender: photo.sender
                })),
                imageIndex,
                options: {
                    nick: nick ? nick : `g/${id}`,
                    id: String(item.message_id),
                    name: item.name,
                    url: item.url
                },
                sender: item.sender
            });
        }
    };

    const formatSize = (size: number) => {
        if (!size) return "";
        if (size < 1024) return `${size} Б`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} КБ`;

        return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
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
        <motion.div
            className="chatMedia"
            layout
        >
            <div className="chatMediaFilters">
                <motion.div
                    className="chatMediaFilterTrack"
                    animate={{
                        x: `${filters.findIndex(filter => filter.id === activeFilter) * 100}%`
                    }}
                    transition={{
                        duration: 0.3,
                        ease: [0.075, 0.82, 0.165, 1]
                    }}
                    style={{
                        width: `${100 / filters.length}%`
                    }}
                />

                {filters.map(filter => (
                    <div
                        key={filter.id}
                        className={`chatMediaFilter ${activeFilter === filter.id ? "active" : ""}`}
                        onClick={() => setActiveFilter(filter.id)}
                    >
                        {filter.label}
                    </div>
                ))}
            </div>

            <motion.div
                className="chatMediaBody"
                layout
            >
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
                    ) : loading ? (
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
                            {error || "Здесь пока ничего нет"}
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
                            Повторить
                        </button>
                    </motion.div>
                )}

                <div
                    ref={sentinelRef}
                    className="chatMediaSentinel"
                    aria-hidden="true"
                />
            </motion.div>
        </motion.div>
    );
}