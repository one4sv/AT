import type { ReactNode } from "react";
import Composer from "../../components/ts/Composer";
import PageBottom from "../../components/ts/PageBottom";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { PencilSimpleIcon, UserCircle, DotsThreeIcon, TrashIcon, XIcon, CheckIcon, HeartIcon, ArrowBendUpLeftIcon, CopyIcon } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { api } from "../../components/ts/api";
import { useUser } from "../../components/hooks/UserHook";
import HighlightText from "../../components/ts/HighlightText";
import AccPostMedia from "../Acc/utils/AccPostMedia";
import formatCreated from "../Acc/utils/formatCreated";
import type { Media } from "../../components/context/ChatContext";

interface Comment {
    id: number;
    text: string | null;
    files: Media[];
    parent_id?: number | null;
    likes?: string[];
    created_at: string;
    user: { id: string; nick: string; username: string; avatar_url?: string } | null;
}

interface PostCommentsProps {
    id: number;
    onSent: (delta?: number) => void;
    children: ReactNode;
    onBack: () => void;
    onEdit?: () => void;
    action?: ReactNode;
}

export default function PostComments({ id, onSent, children, onBack, onEdit, action }: PostCommentsProps) {
    const { user } = useUser();
    const { t } = useTranslation("acc");
    const [ comments, setComments ] = useState<Comment[]>([]);
    const [ text, setText ] = useState("");
    const [ files, setFiles ] = useState<File[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ sending, setSending ] = useState(false);
    const [ error, setError ] = useState("");
    const [ retry, setRetry ] = useState(0);
    const [ replyTo, setReplyTo ] = useState<Comment | null>(null);
    const [ likingId, setLikingId ] = useState<number | null>(null);
    const [ menuId, setMenuId ] = useState<number | null>(null);
    const [ menuPosition, setMenuPosition ] = useState({ top: 0, left: 0 });
    const [ editingId, setEditingId ] = useState<number | null>(null);
    const [ editText, setEditText ] = useState("");
    const [ changingId, setChangingId ] = useState<number | null>(null);
    const sendingRef = useRef(false);
    const mounted = useRef(true);
    const sectionRef = useRef<HTMLElement>(null);
    const scrolled = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError("");
        api.get(`comments/${id}`, { signal: controller.signal })
            .then(res => {
                if (!controller.signal.aborted) setComments(res.data.comments ?? []);
            })
            .catch(() => {
                if (!controller.signal.aborted) setError("post.commentsFailed");
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [id, retry]);

    useEffect(() => {
        if (!loading && !scrolled.current && window.location.hash === "#comments") {
            sectionRef.current?.scrollIntoView({ block: "start" });
            scrolled.current = true;
        }
    }, [loading]);

    const sendComment = async () => {
        if (!user.id || loading || sendingRef.current || (!text.trim() && !files.length)) return;
        sendingRef.current = true;
        setSending(true);
        setError("");
        const form = new FormData();
        form.append("id", String(id));
        form.append("text", text);
        if (replyTo) form.append("parent_id", String(replyTo.id));
        files.forEach(file => form.append("media", file));

        try {
            const res = await api.post("sendcomment", form);
            if (!res.data.success || !res.data.comment) throw new Error("Comment not saved");
            if (!mounted.current) return;
            setComments(prev => [...prev, res.data.comment]);
            setText("");
            setFiles([]);
            setReplyTo(null);
            onSent();
        } catch {
            if (mounted.current) setError("post.sendFailed");
        } finally {
            sendingRef.current = false;
            if (mounted.current) setSending(false);
        }
    };

    const likeComment = async (commentId: number) => {
        if (!user.id) return;
        setLikingId(commentId);
        try {
            const res = await api.post(`comments/${commentId}/like`);
            if (!res.data.success) throw new Error("Like failed");
            setComments(previous => previous.map(comment => {
                if (comment.id !== commentId) return comment;
                const likes = (comment.likes || []).filter(id => id !== user.id);
                if (res.data.liked) likes.push(user.id!);
                return { ...comment, likes };
            }));
        } catch {
            setError("post.commentLikeFailed");
        } finally {
            setLikingId(null);
        }
    };

    const editComment = async (commentId: number) => {
        if (!editText.trim() || changingId !== null) return;
        setChangingId(commentId);
        try {
            const res = await api.patch(`comments/${commentId}`, { text: editText });
            if (!res.data.success) throw new Error("Comment not updated");
            setComments(previous => previous.map(comment => comment.id === commentId
                ? { ...comment, text: res.data.comment.text } : comment));
            setEditingId(null);
            setMenuId(null);
        } catch {
            setError("post.commentActionsFailed");
        } finally {
            setChangingId(null);
        }
    };

    const deleteComment = async (commentId: number) => {
        if (changingId !== null || !window.confirm(t("post.commentDeleteConfirm"))) return;
        setChangingId(commentId);
        try {
            const res = await api.delete(`comments/${commentId}`);
            if (!res.data.success) throw new Error("Comment not deleted");
            setComments(previous => previous.filter(comment => comment.id !== commentId));
            setMenuId(null);
            onSent(-1);
        } catch {
            setError("post.commentActionsFailed");
        } finally {
            setChangingId(null);
        }
    };

    return (
        <>
            <div className="postPageScroll">
                {children}
                <section
                    ref={sectionRef}
                    className="AccPostComments postComments"
                    id="comments"
                    aria-label={t("post.comments")}
                >
                    <div className="postCommentsTitle">
                        {t("post.comments")}:</div>
                    {loading && <p role="status">
                        {t("post.loadingComments")}
                    </p>}
                    {error && (
                        <div role="alert" className="postCommentError">
                            <span>
                                {t(error)}
                            </span>
                            <button type="button" onClick={() => setRetry(value => value + 1)}>
                                {t("post.reload")}
                            </button>
                        </div>
                    )}
                    {!loading && !error && !comments.length && <p>
                        {t("post.empty")}
                    </p>}
                    <div className="comments">
                        {comments.map(comment => (
                            <article className="comment" key={comment.id} style={comment.parent_id ? { marginLeft: "3vw" } : undefined}>
                                {comment.parent_id && <div className="commentReplyParent">
                                    <ArrowBendUpLeftIcon /> {comments.find(item => item.id === comment.parent_id)?.user?.username || comments.find(item => item.id === comment.parent_id)?.user?.nick || t("post.commentReply")}
                                </div>}
                                <div className="commentInfo">
                                    {comment.user && (
                                        <Link className="commentUser" to={`/acc/${comment.user.nick}`}>
                                            <div className="commentAvatar">
                                                {comment.user.avatar_url ? <img src={comment.user.avatar_url} alt="" /> : <UserCircle />}
                                            </div>
                                            {comment.user.username || comment.user.nick}
                                        </Link>
                                    )}
                                    <div className="commentActions">
                                        <button type="button" aria-label={t("post.commentActions")} aria-expanded={menuId === comment.id} onClick={event => { const rect = event.currentTarget.getBoundingClientRect(); setMenuPosition({ top: Math.min(rect.bottom, window.innerHeight - 190), left: Math.max(10, Math.min(rect.right - 200, window.innerWidth - 210)) }); setMenuId(previous => previous === comment.id ? null : comment.id); }}>
                                            <DotsThreeIcon />
                                        </button>
                                        {menuId === comment.id && createPortal(<div className="commentActionMenu" style={{ position: "fixed", top: menuPosition.top, left: menuPosition.left }}>
                                            {user.id && <button type="button" onClick={() => { setReplyTo(comment); setMenuId(null); }}><ArrowBendUpLeftIcon /> {t("post.commentReply")}</button>}
                                            {!!comment.text && <button type="button" onClick={() => { void navigator.clipboard.writeText(comment.text || ""); setMenuId(null); }}><CopyIcon /> {t("post.commentCopy")}</button>}
                                            {user.id === comment.user?.id && <button type="button" onClick={() => {
                                                setEditingId(comment.id);
                                                setEditText(comment.text || "");
                                                setMenuId(null);
                                            }}><PencilSimpleIcon /> {t("post.edit")}</button>}
                                            {user.id === comment.user?.id && <button type="button" className="delete" disabled={changingId === comment.id} onClick={() => void deleteComment(comment.id)}>
                                                <TrashIcon /> {t("post.commentDelete")}
                                            </button>}
                                        </div>, document.body)}
                                    </div>
                                </div>
                                {editingId === comment.id ? <div className="commentEdit">
                                    <textarea value={editText} disabled={changingId === comment.id} onChange={event => setEditText(event.target.value)} />
                                    <button type="button" disabled={!editText.trim() || changingId === comment.id} onClick={() => void editComment(comment.id)} aria-label={t("post.commentSave")}>
                                        <CheckIcon />
                                    </button>
                                    <button type="button" onClick={() => setEditingId(null)} aria-label={t("post.commentCancel")}><XIcon /></button>
                                </div> : <div className="commentText">
                                    <HighlightText text={comment.text ?? ""} search="" />
                                </div>}
                                <AccPostMedia red={false} media={comment.files ?? []} />
                                <div className="commentReactions">
                                    <button type="button" className="commentLike" disabled={!user.id || likingId === comment.id} aria-pressed={(comment.likes || []).includes(user.id || "")} onClick={() => void likeComment(comment.id)}>
                                        <HeartIcon weight={(comment.likes || []).includes(user.id || "") ? "fill" : "regular"} color={(comment.likes || []).includes(user.id || "") ? "#d60000" : undefined} /> {(comment.likes || []).length}
                                    </button>
                                    {user.id && <button type="button" className="commentReply" onClick={() => setReplyTo(comment)}>
                                        <ArrowBendUpLeftIcon /> {t("post.commentReply")}
                                    </button>}
                                    <span className="commentDate">{formatCreated(comment.created_at)}</span>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
            <div className="postCommentBottom">
                {replyTo && <div className="commentReplyBanner">{t("post.commentReplying", { name: replyTo.user?.username || replyTo.user?.nick || "" })}<button type="button" onClick={() => setReplyTo(null)} aria-label={t("post.commentCancel")}><XIcon /></button></div>}
                {user.id ? <Composer
                    text={text}
                    setText={setText}
                    files={files}
                    setFiles={setFiles}
                    placeholder={t("post.placeholder")}
                    onSend={sendComment}
                    disabled={loading || sending}
                    sendLabel={t("post.send")}
                    onBack={onBack}
                    action={action || (onEdit && <button type="button" className="pageBottomAction" onClick={onEdit}>
                        <PencilSimpleIcon weight="fill" /> {t("post.edit")}
                    </button>)}
                />
                    : <PageBottom onBack={onBack}>
                        {action}<Link className="pageBottomAction" to="/sign">
                            {t("post.signIn")}
                        </Link>
                    </PageBottom>}
            </div>
        </>
    );
}
