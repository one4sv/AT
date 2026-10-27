import type { ReactNode } from "react";
import Composer from "../../components/ts/Composer";
import PageBottom from "../../components/ts/PageBottom";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PencilSimpleIcon, UserCircle } from "@phosphor-icons/react";
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
    created_at: string;
    user: { nick: string; username: string; avatar_url?: string } | null;
}

interface Props {
    id: number;
    onSent: () => void;
    children: ReactNode;
    onBack: () => void;
    onEdit?: () => void;
}

export default function PostComments({ id, onSent, children, onBack, onEdit }: Props) {
    const { user } = useUser();
    const { t } = useTranslation("acc");
    const [comments, setComments] = useState<Comment[]>([]);
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const sendingRef = useRef(false);
    const mounted = useRef(true);
    const sectionRef = useRef<HTMLElement>(null);
    const scrolled = useRef(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
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
        files.forEach(file => form.append("media", file));

        try {
            const res = await api.post("sendcomment", form);
            if (!res.data.success || !res.data.comment) throw new Error("Comment not saved");
            if (!mounted.current) return;
            setComments(prev => [...prev, res.data.comment]);
            setText("");
            setFiles([]);
            onSent();
        } catch {
            if (mounted.current) setError("post.sendFailed");
        } finally {
            sendingRef.current = false;
            if (mounted.current) setSending(false);
        }
    };

    return (
        <>
            <div className="postPageScroll">
                {children}
                <section ref={sectionRef} className="AccPostComments postComments" id="comments" aria-label={t("post.comments")}>
                    <div className="postCommentsTitle">{t("post.comments")}:</div>
                    {loading && <p role="status">{t("post.loadingComments")}</p>}
                    {error && (
                        <div role="alert" className="postCommentError">
                            <span>{t(error)}</span>
                            <button type="button" onClick={() => setRetry(value => value + 1)}>
                                {t("post.reload")}
                            </button>
                        </div>
                    )}
                    {!loading && !error && !comments.length && <p>{t("post.empty")}</p>}
                    <div className="comments">
                        {comments.map(comment => (
                            <article className="comment" key={comment.id}>
                                <div className="commentInfo">
                                    {comment.user && (
                                        <Link className="commentUser" to={`/acc/${comment.user.nick}`}>
                                            <div className="commentAvatar">
                                                {comment.user.avatar_url ? <img src={comment.user.avatar_url} alt="" /> : <UserCircle />}
                                            </div>
                                            {comment.user.username || comment.user.nick}
                                        </Link>
                                    )}
                                    <span className="commentDate">{formatCreated(comment.created_at)}</span>
                                </div>
                                <div className="commentText"><HighlightText text={comment.text ?? ""} search="" /></div>
                                <AccPostMedia red={false} media={comment.files ?? []} />
                            </article>
                        ))}
                    </div>
                </section>
            </div>
            <div className="postCommentBottom">
                {user.id ? <Composer text={text} setText={setText} files={files} setFiles={setFiles}
                    placeholder={t("post.placeholder")} onSend={sendComment} disabled={loading || sending}
                    sendLabel={t("post.send")} onBack={onBack}
                    action={onEdit && <button type="button" className="pageBottomAction" onClick={onEdit}><PencilSimpleIcon weight="fill"/> {t("post.edit")}</button>} />
                    : <PageBottom onBack={onBack}><Link className="pageBottomAction" to="/sign">{t("post.signIn")}</Link></PageBottom>}
            </div>
        </>
    );
}
