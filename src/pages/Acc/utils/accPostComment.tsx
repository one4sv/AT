import { useEffect, useRef, useState } from "react";
import EmojiBar from "../../../components/ts/utils/EmojiBar";
import { Paperclip, SmileySticker, UserCircle } from "@phosphor-icons/react";
import { SendHorizontal } from "lucide-react";
import { api } from "../../../components/ts/api";
import { useNavigate } from "react-router";
import MinLoader from "../../../components/ts/MinLoader";
import type { Media } from "../../../components/context/ChatContext";
import CommentTAFiles from "./CommentTAFiles";
import type { User } from "../../../components/context/UserContext";
import formatCreated from "./formatCreated";
import AccPostMedia from "./AccPostMedia";
import { useUser } from "../../../components/hooks/UserHook";

interface Comments {
    id:number,
    post_id:number,
    text:string,
    files:Media[],
    user:User,
    created_at:string
}
export default function AccPostComment({id}:{id:number}) {
    const navigate = useNavigate()
    const { user } = useUser()
    const [ comment, setComment] = useState("");
    const [ showEmojiBar, setShowEmojiBar ] = useState<boolean>(false)
    const [ emojiPos, setEmojiPos ] = useState<{top: number, left: number}>({top: 0, left: 0});
    const [ files, setFiles ] = useState<File[]>([])
    const [ loadingComms, setLoadingComms ] = useState(true)
    const [ comments, setComments ] = useState<Comments[] | null>(null)
    const inputFileRef = useRef<HTMLInputElement>(null);
    const taRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        const ta = taRef.current;
        if (!ta) return;

        const adjustHeight = () => {
            ta.style.height = "auto";
            ta.style.minHeight = "4vh";
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
    }, [comment]);

    const handleToggleEmojiBar = () => {
        if (!taRef.current || !taRef.current.parentElement) return;
        const rect = taRef.current.getBoundingClientRect();
        const containerRect = taRef.current.parentElement.getBoundingClientRect();
        const vh = window.innerHeight/100;
        setEmojiPos({
            top: rect.bottom - containerRect.top + taRef.current.parentElement.scrollTop + (5 * vh),
            left: rect.left - containerRect.left,
        });

        setShowEmojiBar(prev => !prev);
    };

    const sendComment = async () => {
        if (!comment.trim() && files.length === 0 && user.id === null) return;

        const tempComment: Comments = {
            id: Date.now(),
            post_id: id,
            text: comment,
            files: [],
            user: user,
            created_at: new Date().toISOString(),
        };

        // добавляем временно в список
        setComments((prev) => prev ? [tempComment, ...prev] : [tempComment]);

        // очищаем инпуты
        setComment("");
        setFiles([]);

        try {
            const formData = new FormData();
            formData.append("text", tempComment.text);
            formData.append("id", String(id));
            formData.append("goal", "post");
            files.forEach((file) => formData.append("media", file));

            const res = await api.post("/sendcomment", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.data.success && res.data.comment) {
                // заменяем временный комментарий на настоящий (с id от сервера)
                setComments((prev) =>
                    prev
                        ? prev.map((c) =>
                            c.id === tempComment.id ? res.data.comment : c
                        )
                        : [res.data.comment]
                );
            } else {
                // если сервер не вернул успех — откатываем
                setComments((prev) =>
                    prev ? prev.filter((c) => c.id !== tempComment.id) : prev
                );
            }
        } catch (err) {
            console.error(err);
            // если ошибка — удаляем временный комментарий
            setComments((prev) =>
                prev ? prev.filter((c) => c.id !== tempComment.id) : prev
            );
        }
    };



    const getComms = async() => {
        setLoadingComms(true)
        try {
            const res = await api.get(`comments/${id}`)
            if (res.data.success) setComments(res.data.comments)
        } catch (err) {
            console.log(err)
        } finally {
            setLoadingComms(false)
        }
    }
    useEffect(() => {
        if (id) getComms()
    }, [id])

    return (
        <div className="AccPostComments">
            <EmojiBar setText={setComment} cn={"apEmojiBar"} setShowEmojiBar={setShowEmojiBar} showEmojiBar={showEmojiBar} taRef={taRef} emojiPos={emojiPos}/>
            <div className="AccPostCommentWrite">
                <div className="sendCommentTAButt">
                    <SendHorizontal className="sctabSvg" fill="currentColor" onClick={() => sendComment()}/>
                </div>
                <textarea name="" id="" className="AccPostCommentTA" placeholder="Комментарий" ref={taRef} value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
                {files.length > 0 && (
                    <CommentTAFiles files={files} setFiles={setFiles}/>
                )}
                <div className="AccPostCommentBar">
                    <div className="accPostButt" onClick={() => handleToggleEmojiBar()}>
                        <SmileySticker className="apcbSvg"/>
                    </div>
                    <input type="file" name="" id="" multiple style={{display:"none"}} ref={inputFileRef}
                        onChange={(e) => {
                            if (!e.target.files) return;
                            setFiles(prev => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])]);
                        }}
                    />
                    <div className="accPostButt" onClick={() => inputFileRef.current?.click()}>
                        <Paperclip className="apcbSvg" />
                    </div>
                    {loadingComms && (
                        <div className="commentLoad">
                            <MinLoader/>
                        </div>
                    )}
                </div>
            </div>
            {comments !== null && (
                <div className="comments">
                    {comments?.map((c) => {
                        const user = c.user
                    return (
                        <div className="comment" key={c.id}>
                            <div className="commentInfo">
                                <div className="commentUser" onClick={() => navigate(`/acc/${user?.nick}`)}>
                                    <div className="commentAvatar">
                                        {user?.avatar_url ? (
                                            <img src={user.avatar_url}/>
                                        ) : (
                                            <UserCircle />
                                        )}
                                    </div>
                                    {user?.username || user?.nick}
                                </div>
                                <div className="commentDate">
                                    {formatCreated(c.created_at)}
                                </div>
                            </div>
                            <div className="commentText">{c.text}</div>
                            <AccPostMedia red={false} media={c.files}/>
                        </div>
                    )
                    })}
                </div>
                )}
        </div>
    )
}