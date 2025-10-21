import { ChevronRight } from "lucide-react";
import type { Habit } from "../../../components/context/HabitsContext";
import { habitIcon } from "../../../components/ts/habitIcon";
import type { Post } from "../Acc";
import { ChatCircle, Check, Heart, PencilSimple, SmileySticker, Trash } from "@phosphor-icons/react";
import { Paperclip, X } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import Linkify from "linkify-react";
import GetIconByType from "../../Chat/utils/getIconByType";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import formatCreated from "../utils/formatCreated";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../components/ts/api";
import { Emojies, EmojiesGroups } from "../../Chat/utils/emojies";

export default function AccPosts({ posts, habits, isMy, refetch }: { posts: Post[], habits: Habit[] | undefined, isMy: boolean, refetch:()=>Promise<void> }) {
    const { setBlackout } = useBlackout();
    const navigate = useNavigate();
    const [hover, setHover] = useState(0);
    const [red, setRed] = useState(0);
    const [newText, setNewText] = useState("");
    const [keptMedia, setKeptMedia] = useState<any[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false)
    const taRef = useRef<HTMLTextAreaElement>(null);
    const inputFileRef = useRef<HTMLInputElement>(null);
    const emojiBarRef = useRef<HTMLDivElement | null>(null)
    const [emojiPos, setEmojiPos] = useState<{top: number, left: number}>({top: 0, left: 0});

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
            refetch()
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
        const handleClickOutside = (e: MouseEvent) => {
            if (
                emojiBarRef.current && 
                !emojiBarRef.current?.contains(e.target as Node) &&
                taRef.current &&
                !taRef.current.contains(e.target as Node) &&
                showEmojiBar
            ) {
                setShowEmojiBar(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, [showEmojiBar]);

    const handleAddEmoji = (emoji:string) => {
        const ta = taRef.current;
        if (!ta) return;

        const start = ta.selectionStart;
        const end = ta.selectionEnd;

        setNewText(prev => {
            const newValue = prev.slice(0, start) + emoji + prev.slice(end);
            requestAnimationFrame(() => {
                ta.focus();
                ta.selectionStart = ta.selectionEnd = start + emoji.length;
            });
            return newValue;
        });
    }

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

    return (
        <div className="accPosts">
            {showEmojiBar && (
                <div
                    className="emojiBar apEmojiBar"
                    ref={emojiBarRef}
                    style={{ top: emojiPos.top, left: emojiPos.left }}
                >
                    {EmojiesGroups.map((g, i) => (
                        <div className="emojiGroup" key={i}>
                            <div className="emojiGroupName">{g.value}</div>
                            <div className="emojiList">
                                {Emojies.filter(e => e.group === g.group).map((e, j) => (
                                    <div
                                        className="emoji"
                                        key={j}
                                        onClick={() => handleAddEmoji(e.pic)}
                                    >
                                        {e.pic}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {posts.map((post) => {
                let likesCount = 0;
                let like = false;
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
                        {red !== post.id && (
                            <div className="accPostmedia">
                                {post.media && post.media.length > 0 && (
                                    <div className="postMediaGrid">
                                        {post.media.map((file, j) => {
                                            const isImage = file.type.startsWith("image/");
                                            const isVideo = file.type.startsWith("video/");
                                            return (
                                                <div key={j} className="postFileGrid">
                                                    {isImage ? (
                                                        <img
                                                            src={file.url}
                                                            alt={file.name}
                                                            className="postFilePreview"
                                                            onClick={() => setBlackout({ seted: true, module: "ImgPrev", img: file.url })}
                                                        />
                                                    ) : isVideo ? (
                                                        <video src={file.url} className="postFilePreview" controls />
                                                    ) : (
                                                        <a href={file.url} download={file.name} className="postFileOther">
                                                            {GetIconByType(file.name, file.type)}
                                                            <span className="postFileName">{file.name}</span>
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                        {red === post.id && (
                            <div className="accPostmedia">
                                {(keptMedia.length > 0 || newFiles.length > 0) && (
                                <div className="postMediaGrid">
                                    {keptMedia.map((file, j) => {
                                        const isImage = file.type.startsWith("image/");
                                        const isVideo = file.type.startsWith("video/");
                                        return (
                                            <div key={`kept-${j}`} className="postFileGrid">
                                            <div
                                                className="chatTAFileOverlay"
                                                onClick={() => setKeptMedia((prev) => prev.filter((_, idx) => idx !== j))}
                                            >
                                                <X />
                                            </div>
                                            {isImage ? (
                                                <img
                                                    src={file.url}
                                                    alt={file.name}
                                                    className="postFilePreview"
                                                    onClick={() => setBlackout({ seted: true, module: "ImgPrev", img: file.url })}
                                                />
                                            ) : isVideo ? (
                                                <video src={file.url} className="postFilePreview" controls />
                                            ) : (
                                                <div className="postFileOther">
                                                    {GetIconByType(file.name, file.type)}
                                                    <span className="postFileName">{file.name}</span>
                                                </div>
                                            )}
                                            </div>
                                        );
                                    })}
                                    {newFiles.map((file, i) => {
                                        const previewUrl = URL.createObjectURL(file);
                                        const isImage = file.type.startsWith("image/");
                                        const isVideo = file.type.startsWith("video/");
                                        return (
                                            <div key={`new-${i}`} className="postFileGrid">
                                                <div
                                                    className="chatTAFileOverlay"
                                                    onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                                                >
                                                    <X />
                                                </div>
                                                {isImage ? (
                                                    <img src={previewUrl} alt={file.name} className="postFilePreview" />
                                                ) : isVideo ? (
                                                    <video src={previewUrl} className="postFilePreview" controls />
                                                ) : (
                                                    <div className="postFileOther">
                                                        {GetIconByType(file.name, file.type)}
                                                        <span className="postFileName">{file.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                )}
                                <input
                                type="file"
                                multiple
                                style={{ display: "none" }}
                                ref={inputFileRef}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const files = e.target.files;
                                    if (!files) return;
                                    setNewFiles((prev) => [...prev, ...Array.from(files)]);
                                }}
                                />
                            </div>
                        )}
                        <div className="accPostBottom">
                            <div className="accPostInteract">
                                <div
                                    className="accPostLikes"
                                    onClick={() => {
                                        likesCount += 1;
                                        like = !like;
                                    }}
                                >
                                {like ? <Heart weight="fill" color="#d60000" /> : <Heart />}
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
                                            <div className="accPostButt">
                                            <Trash /> {/* Здесь можно добавить onClick для удаления поста, если нужно */}
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