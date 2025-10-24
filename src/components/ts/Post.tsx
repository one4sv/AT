import { useNavigate } from "react-router";
import { useBlackout } from "../hooks/BlackoutHook";
import { useDelete } from "../hooks/DeleteHook";
import { habitIcon } from "./habitIcon";
import { ChevronRight } from "lucide-react";
import Linkify from "linkify-react";
import { useRef, useState } from "react";
import { api } from "./api";
import EmojiBar from "./utils/EmojiBar";
import { useAcc } from "../hooks/AccHook";
import { useUser } from "../hooks/UserHook";
import AccPostMedia from "../../pages/Acc/utils/AccPostMedia";
import { ChatCircle, Check, Heart, Paperclip, PencilSimple, SmileySticker, Trash, UserCircle } from "@phosphor-icons/react";
import formatCreated from "../../pages/Acc/utils/formatCreated";
import AccPostComment from "../../pages/Acc/utils/accPostComment";
import type { PostType } from "../context/AccContext";
import type { Media } from "../context/ChatContext";
import { useLocation } from "react-router";
import "../../scss/Post.scss"
interface PostProps {
    post: PostType
    isMy: boolean
}
export default function Post({ post, isMy }: PostProps) {
    const { setDeleteConfirm } = useDelete()
    const { setBlackout } = useBlackout()
    const { setPosts } = useAcc()
    const { user } = useUser()
    const navigate = useNavigate()
    const location = useLocation()
    const [ newText, setNewText ] = useState("");
    const [ red, setRed ] = useState<boolean>(false);
    const [ hover, setHover ] = useState<boolean>(false)
    const [ showComment, setShowComment ] = useState<boolean>(false)
    const [ keptMedia, setKeptMedia ] = useState<Media[]>([]);
    const [ newFiles, setNewFiles ] = useState<File[]>([]);
    const [ emojiPos, setEmojiPos ] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false)
    const taRef = useRef<HTMLTextAreaElement>(null);
    const divRef = useRef<HTMLDivElement>(null);
    const inputFileRef = useRef<HTMLInputElement>(null);

    const upPost = async () => {
        const createdObjectUrls: string[] = [];
        const optimisticNewFilesMedia: Media[] = newFiles.map((f) => {
            const url = URL.createObjectURL(f);
            createdObjectUrls.push(url);
            return {
                url,
                name: f.name,
                type: f.type,
                __optimistic: true as boolean,
            } as unknown as Media;
        });

        const optimisticMedia: Media[] = [
            ...(keptMedia || []),
            ...optimisticNewFilesMedia,
        ];

        let previousPosts: PostType[] | undefined;
        setPosts(prev => {
            previousPosts = prev ? [...prev] : undefined;
            if (!prev) return prev;
            return prev.map(p =>
                p.id === post.id
                    ? {
                        ...p,
                        text: newText || p.text,
                        media: optimisticMedia,
                    }
                    : p
            );
        });

        const formData = new FormData();
        formData.append("id", String(post.id));
        formData.append("text", newText);
        formData.append("keptMedia", JSON.stringify(keptMedia));
        newFiles.forEach((file) => formData.append("media", file));

        try {
            const res = await api.post("/uppost", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data && res.data.success) {
                const serverPost = res.data.post;
                if (serverPost) {
                    let serverMedia: Media[] = [];
                    if (serverPost.media) {
                        if (typeof serverPost.media === "string") {
                            try {
                                serverMedia = JSON.parse(serverPost.media);
                            } catch {
                                serverMedia = [];
                            }
                        } else {
                            serverMedia = serverPost.media;
                        }
                    }

                    setPosts(prev => prev?.map(p =>
                        p.id === post.id
                            ? {
                                ...p,
                                text: serverPost.text ?? p.text,
                                media: serverMedia,
                                comments_count: serverPost.comments_count ?? p.comments_count,
                                likes: serverPost.likes ?? p.likes,
                            }
                            : p
                    ));
                } else {
                    setPosts(prev => prev?.map(p =>
                        p.id === post.id
                            ? { ...p, text: newText || p.text, media: optimisticMedia }
                            : p
                    ));
                }

                // очистка локального редактора
                setRed(false);
                setKeptMedia([]);
                setNewFiles([]);

                createdObjectUrls.forEach(u => URL.revokeObjectURL(u));
            } else {
                throw new Error(res?.data?.error || "Не удалось обновить пост");
            }
        } catch (err) {
            console.error("Ошибка при обновлении поста:", err);
            if (previousPosts) setPosts(previousPosts);
            createdObjectUrls.forEach(u => URL.revokeObjectURL(u));
        }
    };

    const handleToggleEmojiBar = () => {
        if (!taRef.current || !taRef.current.parentElement) return;
        const rect = taRef.current.getBoundingClientRect();
        const container = taRef.current.parentElement;
        const containerRect = container.getBoundingClientRect();
        const vh = innerHeight/100;
        const top = rect.bottom - containerRect.top + container.scrollTop + 5*vh;
        const left = rect.left - containerRect.left;

        setEmojiPos({
            top,
            left,
        });

        setShowEmojiBar(prev => !prev);
    };

    const like = async (id: number) => {
        try {
            const res = await api.post("/like", { id });
            if (res.data.success) {
                setPosts(prev =>
                    prev?.map(p =>
                        p.id === id
                            ? {
                                ...p,
                                likes: res.data.liked
                                    ? [...p.likes, user.id]
                                    : p.likes.filter((uid: string | null) => uid !== user.id),
                            }
                            : p
                    )
                );
            }
        } catch (e) {
            console.error("Ошибка при лайке:", e);
        }
    };
    let likesCount = 0;
    const isLiked = post.likes?.includes(user.id!);
    if (post.likes) likesCount = post.likes.length;

    return (
        <div className="PostDiv" onMouseEnter={() => isMy && setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="Post">
                {!location.pathname.includes("/acc") && (
                    <div className="commentUser" onClick={() => navigate(`/acc/${post.user.id}`)}>
                        <div className="commentAvatar">
                            {post.user.avatar_url ? (
                                <img src={post.user.avatar_url}/>
                            ) : (
                                <UserCircle />
                            )}
                        </div>
                        {post.user.username || post.user.nick}
                    </div>
                )}
                <EmojiBar setText={setNewText} cn={"apEmojiBar"} setShowEmojiBar={setShowEmojiBar} showEmojiBar={showEmojiBar} taRef={taRef} emojiPos={emojiPos}/>
                {red ? (
                    <textarea
                        ref={taRef}
                        defaultValue={newText}
                        className="PostText"
                        style={{display:red ? "block" : "none", minHeight:`${divRef.current?.scrollHeight}px`}}
                        onChange={(e) => setNewText(e.target.value)}
                    ></textarea>
                ) : (
                    <div className="PostText" style={{display:red ? "none" : "block"}} ref={divRef}>
                        <Linkify>{newText || post.text}</Linkify>
                    </div>
                )}
                {post.habit && (
                    <div className="PostHabit" onClick={() => navigate(`/habit/${post.habit}`)}>
                        <div className="aphIcon">{habitIcon(post.habit)}</div>
                        <div className="aphName">{post.habit.name}</div>
                        <ChevronRight className="aphGo" />
                    </div>
                )}
                <AccPostMedia red={red} media={post.media} keptMedia={keptMedia} newFiles={newFiles} setKeptMedia={setKeptMedia} setNewFiles={setNewFiles} inputFileRef={inputFileRef}/>
                <div className="PostBottom">
                    <div className="PostInteract">
                        <div
                            className="PostLikes"
                            onClick={() => {
                                like(post.id)
                            }}
                        >
                        {isLiked ? <Heart weight="fill" color="#d60000" /> : <Heart />}
                        <span>{likesCount}</span>
                        </div>
                        <div className="PostComment" onClick={() => setShowComment(!showComment)}>
                            <ChatCircle />
                            <span>{post.comments_count}</span>
                        </div>
                    </div>
                    <div className="PostDate">
                        {hover && (
                        <div className="PostButts">
                            {red && (
                                <>
                                    <div className="PostButt" onClick={() => handleToggleEmojiBar()}>
                                        <SmileySticker className="pwSvg"/>
                                    </div>
                                    <div className="PostButt" onClick={() => inputFileRef.current?.click()}>
                                        <Paperclip className="pwSvg" />
                                    </div>
                                </>
                            )}
                            <div
                                className="PostButt"
                                onClick={() => {
                                if (red) {
                                    upPost();
                                } else {
                                    setRed(true);
                                    setNewText(post.text);
                                    setKeptMedia(post.media || []);
                                    setNewFiles([]);
                                }
                            }}
                            >
                                {red ? <Check /> : <PencilSimple />}
                            </div>
                            <div className="PostButt" onClick={() => {
                                setDeleteConfirm({goal:"post", id:post.id, name: post.text.length > 10 ? post.text.slice(0, 15) + "…" : post.text})
                                setBlackout({seted:true, module:"Delete"})
                            }}>
                                <Trash />
                            </div>
                        </div>
                        )}
                        <span>{formatCreated(post.created_at)}</span>
                    </div>
                </div>
            </div>
            {showComment && (
                <AccPostComment id={post.id}/>
            )}
        </div>
    )
}
