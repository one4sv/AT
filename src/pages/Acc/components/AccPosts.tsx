import { ChevronRight } from "lucide-react";
import type { Habit } from "../../../components/context/HabitsContext";
import { habitIcon } from "../../../components/ts/habitIcon";
import type { Post } from "../../../components/context/AccContext";
import { ChatCircle, Check, Heart, PencilSimple, SmileySticker, Trash } from "@phosphor-icons/react";
import { Paperclip } from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router";
import Linkify from "linkify-react";
import formatCreated from "../utils/formatCreated";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../components/ts/api";
import EmojiBar from "../../../components/ts/utils/EmojiBar";
import AccPostMedia from "../utils/AccPostMedia";
import { useDelete } from "../../../components/hooks/DeleteHook";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useUser } from "../../../components/hooks/UserHook";
import { useAcc } from "../../../components/hooks/AccHook";

interface AccPostsProps {
    posts: Post[] | undefined,
    habits: Habit[] | undefined,
    isMy: boolean,
    refetch:(contactId:string)=>Promise<void>
}
export default function AccPosts({ posts, habits, isMy, refetch }: AccPostsProps) {
    const { user } = useUser()
    const { setPosts } = useAcc()
    const { setDeleteConfirm } = useDelete()
    const { setBlackout } = useBlackout()
    const [ hover, setHover ] = useState(0);
    const [ red, setRed ] = useState(0);
    const { contactId } = useParams();
    const navigate = useNavigate();

    const [ newText, setNewText] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [ keptMedia, setKeptMedia ] = useState<any[]>([]);
    const [ newFiles, setNewFiles ] = useState<File[]>([]);
    const [ emojiPos, setEmojiPos ] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false)
    const taRef = useRef<HTMLTextAreaElement>(null);
    const inputFileRef = useRef<HTMLInputElement>(null);

    const upPost = async () => {
        const formData = new FormData();
        formData.append("id", String(red));
        formData.append("text", newText);
        formData.append("keptMedia", JSON.stringify(keptMedia));
        newFiles.forEach((file) => formData.append("media", file));

        const res = await api.post("/uppost", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
            setRed(0);
            setNewText("");
            setKeptMedia([]);
            setNewFiles([]);
            refetch(contactId!)
        }
    };

    const handleToggleEmojiBar = () => {
        if (!taRef.current || !taRef.current.parentElement) return;
        const rect = taRef.current.getBoundingClientRect();
        const containerRect = taRef.current.parentElement.getBoundingClientRect();
        const vh = window.innerHeight/100;
        setEmojiPos({
            top: rect.bottom - containerRect.top + taRef.current.parentElement.scrollTop + (5 * vh), // чуть ниже textarea
            left: rect.left - containerRect.left,
        });

        setShowEmojiBar(prev => !prev);
    };

    useEffect(() => {
        if (!red) return;
        const ta = taRef.current;
        if (!ta) return;

        const adjustHeight = () => {
            ta.style.height = "auto";
            const scrollHeight = ta.scrollHeight;
            ta.style.height = `${scrollHeight}px`;
            if (scrollHeight > window.innerHeight * 0.5) {
                ta.style.height = "50vh";
                ta.style.overflowY = "auto";
            } else {
                ta.style.overflowY = "hidden";
            }
        };

        adjustHeight();
    }, [red, newText]);

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
                                    : p.likes.filter((uid) => uid !== user.id),
                            }
                            : p
                    )
                );
            }
        } catch (e) {
            console.error("Ошибка при лайке:", e);
        }
    };

    return (
        <div className="accPosts">
            <EmojiBar setText={setNewText} cn={"apEmojiBar"} setShowEmojiBar={setShowEmojiBar} showEmojiBar={showEmojiBar} taRef={taRef} emojiPos={emojiPos}/>
            {posts?.map((post) => {
                let likesCount = 0;
                const isLiked = post.likes?.includes(user.id!);
                if (post.likes) likesCount = post.likes.length;
                let habit = null;
                if (post.habit_id) habit = habits?.find(h => h.id === post.habit_id);
                return (
                    <div className="accPost" key={post.id} onMouseEnter={() => isMy && setHover(post.id)} onMouseLeave={() => setHover(0)}>
                        {habit && (
                            <div className="accPostHabit" onClick={() => navigate(`/habit/${habit.id}`)}>
                                <div className="aphIcon">{habitIcon(habit)}</div>
                                <div className="aphName">{habit.name}</div>
                                <ChevronRight className="aphGo" />
                            </div>
                        )}
                        {red !== post.id && (
                            <div className="accPostText">
                                <Linkify>{post.text}</Linkify>
                            </div>
                        )}
                        {red === post.id && (
                            <textarea
                                ref={taRef}
                                value={newText}
                                className="accPostText"
                                onChange={(e) => setNewText(e.target.value)}
                            ></textarea>
                        )}
                        <AccPostMedia red={red === post.id} media={post.media} keptMedia={keptMedia} newFiles={newFiles} setKeptMedia={setKeptMedia} setNewFiles={setNewFiles} inputFileRef={inputFileRef}/>
                        <div className="accPostBottom">
                            <div className="accPostInteract">
                                <div
                                    className="accPostLikes"
                                    onClick={() => {
                                        like(post.id)
                                    }}
                                >
                                {isLiked ? <Heart weight="fill" color="#d60000" /> : <Heart />}
                                <span>{likesCount}</span>
                                </div>
                                    <div className="accPostComment">
                                    <ChatCircle />
                                </div>
                            </div>
                            <div className="accPostDate">
                                {hover === post.id && (
                                    <div className="accPostButts">
                                        {red === post.id && (
                                            <>
                                                <div className="accPostButt" onClick={() => handleToggleEmojiBar()}>
                                                    <SmileySticker className="pwSvg"/>
                                                </div>
                                                <div className="accPostButt" onClick={() => inputFileRef.current?.click()}>
                                                    <Paperclip className="pwSvg" />
                                                </div>
                                            </>
                                        )}
                                        <div
                                            className="accPostButt"
                                            onClick={() => {
                                                if (red === post.id) {
                                                upPost();
                                                } else {
                                                setRed(post.id);
                                                setNewText(post.text);
                                                setKeptMedia(post.media || []);
                                                setNewFiles([]);
                                                }
                                            }}
                                        >
                                            {red === post.id ? <Check /> : <PencilSimple />}
                                        </div>
                                        <div className="accPostButt" onClick={() => {
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
                );
            })}
        </div>
    );
}