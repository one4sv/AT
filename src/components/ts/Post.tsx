import RichPost, { mediaIds } from "../../pages/Post/RichPost";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { ChatCircle, Heart, DotsThree, UserCircle } from "@phosphor-icons/react";
import { isMobile } from "react-device-detect";
import { useBlackout } from "../hooks/BlackoutHook";
import { useMessages } from "../hooks/MessagesHook";
import { useNote } from "../hooks/NoteHook";
import { useAcc } from "../hooks/AccHook";
import { useUser } from "../hooks/UserHook";
import { useContextMenu } from "../hooks/ContextMenuHook";
import { habitIcon } from "./habitIcon";
import { api } from "./api";
import HighlightText from "./HighlightText";
import AccPostMedia from "../../pages/Acc/utils/AccPostMedia";
import formatCreated from "../../pages/Acc/utils/formatCreated";
import type { PostType } from "../context/AccContext";
import "../../scss/Post.scss";

interface PostProps {
    post: PostType;
    isMy: boolean;
    expanded?: boolean;
    onLike?: () => void;
    liking?: boolean;
}

export default function Post({ post: sourcePost, isMy, expanded = false, onLike, liking }: PostProps) {
    const { t } = useTranslation("acc");
    const [ post, setLocalPost ] = useState(sourcePost);
    const [ truncated, setTruncated ] = useState(false);
    const { setForwardPost } = useMessages();
    const { showNotification } = useNote();
    const { setBlackout } = useBlackout();
    const { setPosts } = useAcc();
    const { user } = useUser();
    const { openMenu } = useContextMenu();
    const navigate = useNavigate();
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => setLocalPost(sourcePost), [sourcePost]);
    useEffect(() => {
        const node = divRef.current;
        if (!node || expanded) return;
        const measure = () => setTruncated(node.scrollHeight > node.clientHeight + 1);
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(node);
        return () => observer.disconnect();
    }, [post.text, post.content, expanded]);
    const like = async (id: number) => {
        try {
            const res = await api.post("/like", {
                id
            });
            if (res.data.success) {
                setLocalPost(
                    p => ({
                        ...p,
                        likes: res.data.liked ? [...p.likes.filter(uid => uid !== user.id), user.id] : p.likes.filter(uid => uid !== user.id)
                    })
                );
                setPosts(
                    prev => prev?.map(
                        p => p.id === id ? {
                            ...p,
                            likes: res.data.liked ? [...p.likes, user.id] : p.likes.filter((uid: string | null) => uid !== user.id)
                        } : p
                    )
                );
            }
        } catch (e) {
            console.error("Ошибка при лайке:", e);
        }
    };

    const postUrl = new URL('/post/' + post.id, window.location.origin).href;
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            showNotification("success", t("post.linkCopied"));
        } catch {
            showNotification("error", t("post.copyFailed"));
        }
    };
    const share = async () => {
        if (!navigator.share) return copyLink();
        try {
            await navigator.share({ url: postUrl });
        } catch (error) {
            if (!(error instanceof DOMException && error.name === "AbortError")) {
                showNotification("error", t("post.shareFailed"));
            }
        }
    };
    const openPostMenu = (x: number, y: number) => {
        openMenu(x, y, "post", {
            id: String(post.id),
            name: post.text.slice(0, 40),
            isMy,
            func: () => navigate('/post/' + post.id + '/edit'),
            onCopy: () => { void copyLink(); },
            onShare: () => { void share(); },
            onForward: () => {
                if (!user.id) {
                    navigate("/sign");
                    return;
                }
                setForwardPost({ id: post.id, text: post.text, author: post.user.username || post.user.nick || "" });
                setBlackout({ seted: true, module: "Redirecting" });
            }
        });
    };

    const likesCount = post.likes?.length || 0;
    const isLiked = post.likes?.includes(user.id!);

    return (
        <div
            className={`PostDiv ${expanded ? "postExpanded" : "postPreview"}`}
            onClick={event => {
                if (expanded || window.getSelection()?.toString()) return;
                if ((event.target as Element).closest(
                    "a, button, input, textarea, video, audio, .postUser, .PostHabit, .PostBottom, .postMediaArea, .AccPostComments"
                )) return;
                navigate(`/post/${post.id}`);
            }}
            data-context-menu="true"
            onContextMenu={e => {
                e.preventDefault();
                openPostMenu(e.clientX, e.clientY);
            }}
        >
            <div className={`Post ${isMobile ? "mobile" : ""}`}>
                <div className="postHeader" data-context-menu="true" onContextMenu={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    openPostMenu(event.clientX, event.clientY);
                }}>
                    <button type="button" className="postUser" onClick={() => navigate('/acc/' + post.user.nick)}>
                        <div className="postAvatar">
                            {post.user.avatar_url ? <img src={post.user.avatar_url} alt="" /> : <UserCircle />}
                        </div>
                        <span>{post.user.username || post.user.nick}</span>
                    </button>
                    <button type="button" className="postMenuButton" aria-label={t("post.actions")} aria-haspopup="menu" onClick={event => {
                        event.stopPropagation();
                        const rect = event.currentTarget.getBoundingClientRect();
                        openPostMenu(rect.right, rect.bottom);
                    }}>
                        <DotsThree weight="bold" />
                    </button>
                </div>
                <div className="PostText" ref={divRef}>
                    {post.content ? <RichPost content={post.content} media={post.media || []} /> : <HighlightText text={post.text} search="" />}
                </div>
                {!expanded && <button
                    className={`postReadMore ${truncated ? "" : "postOpenLink"}`}
                    type="button"
                    onClick={() => navigate(`/post/${post.id}`)}
                >
                    {t(truncated ? "post.readMore" : "post.open")}
                </button>}
                {post.habit && <div className="PostHabit" onClick={() => navigate(`/habit/${post.habit?.id}`)}>
                    <div className="aphIcon">
                        {habitIcon(post.habit)}
                    </div>
                    <div className="aphName">
                        {post.habit.name}
                    </div>
                    <ChevronRight className="aphGo" />
                </div>}
                <div className="postMediaArea">
                    <AccPostMedia red={false} gallery={post.media} media={post.media?.filter(file => !mediaIds(post.content).includes(file.id || file.url))} />
                </div>
                <div className="PostBottom">
                    <div className="PostInteract">
                        <div
                            className="PostLikes"
                            onClick={() => {
                                if (liking) return;
                                if (!user.id) navigate("/sign");
                                else if (onLike) onLike();
                                else void like(post.id);
                            }}
                        >
                            {isLiked ? <Heart weight="fill" color="#d60000" /> : <Heart />}
                            <span>
                                {likesCount}
                            </span>
                        </div>
                        <div className="PostComment" onClick={() => {
                            if (expanded) document.getElementById("comments")?.scrollIntoView({ block: "start" });
                            else navigate(`/post/${post.id}#comments`);
                        }}>
                            <ChatCircle />
                            <span>
                                {post.comments_count}
                            </span>
                        </div>
                    </div>
                    <div className="PostDate">
                        <span>
                            {formatCreated(post.created_at)}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    );
}
