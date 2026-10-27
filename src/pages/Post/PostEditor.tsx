import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../components/ts/api";
import { useUser } from "../../components/hooks/UserHook";
// import { useHabits } from "../../components/hooks/HabitsHook";
import { useAcc } from "../../components/hooks/AccHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import type { Media } from "../../components/context/ChatContext";
import type { PostType } from "../../components/context/AccContext";
import PageBottom from "../../components/ts/PageBottom";
// import SelectList from "../../components/ts/SelectList";
import "./scss/postPage.scss";
import "./scss/postEditor.scss";
import { GearIcon, PaperPlaneRightIcon } from "@phosphor-icons/react";

export default function PostEditor() {
    const { postId } = useParams();
    const { t } = useTranslation("acc");
    const { user, loadingUser } = useUser();
    // const { habits } = useHabits();
    const { refetchPosts } = useAcc();
    const { setTitle } = usePageTitle();
    const navigate = useNavigate();
    const [text, setText] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [media, setMedia] = useState<Media[]>([]);
    const [habit, setHabit] = useState("none");
    const [loading, setLoading] = useState(!!postId);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const sendingRef = useRef(false);
    const title = t(postId ? "post.edit" : "post.create");

    useEffect(() => { setTitle(title); }, [setTitle, title]);
    useEffect(() => {
        if (!loadingUser && !user.id) navigate("/sign", { replace: true });
    }, [loadingUser, user.id, navigate]);
    useEffect(() => {
        setText("");
        setFiles([]);
        setMedia([]);
        setHabit("none");
        setError("");
        setLoading(!!postId);
        if (!postId || !user.id) return;
        const controller = new AbortController();
        api.get(`post/${postId}`, { signal: controller.signal }).then(res => {
            if (controller.signal.aborted) return;
            const post: PostType = res.data.post;
            if (post.user.id !== user.id) {
                navigate(`/post/${postId}`, { replace: true });
                return;
            }
            setText(post.text || "");
            setMedia(post.media || []);
            setHabit(post.habit ? String(post.habit.id) : "none");
        }).catch(() => {
            if (!controller.signal.aborted) setError("post.loadFailed");
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });
        return () => controller.abort();
    }, [postId, user.id, navigate, retry]);

    const goBack = () => {
        if (window.history.state?.idx > 0) navigate(-1);
        else navigate(postId ? `/post/${postId}` : "/");
    };
    const sendPost = async () => {
        if (!user.id || loading || error === "post.loadFailed" || sendingRef.current || (!text.trim() && !files.length && !media.length)) return;
        sendingRef.current = true;
        setSending(true);
        setError("");
        const data = new FormData();
        data.append("text", text.trim());
        if (postId) {
            data.append("id", postId);
            data.append("keptMedia", JSON.stringify(media));
        } else data.append("habit_id", habit);
        files.forEach(file => data.append("media", file));
        try {
            const res = await api.post(postId ? "uppost" : "addpost", data);
            if (!res.data.success) throw new Error("Post not saved");
            if (user.nick) void refetchPosts(user.nick);
            navigate(`/post/${postId || res.data.post_id}`, { replace: true });
        } catch {
            setError("post.saveFailed");
        } finally {
            sendingRef.current = false;
            setSending(false);
        }
    };

    function handleSend(): void {
        throw new Error("Function not implemented.");
    }

    return <div className="postPage postEditor">
        <div className="postPageScroll">
            {loading && <div className="postStatus" role="status">{t("post.loading")}</div>}
            {error && <div className="postStatus" role="alert">
                {t(error)}
                {error === "post.loadFailed" && <button type="button" onClick={() => setRetry(value => value + 1)}>{t("post.retry")}</button>}
            </div>}
            {!loading && error !== "post.loadFailed" && <>
                {/* {!postId && <SelectList className="postEditorHabit" arr={[
                    { label: t("post.noHabit"), value: "none" },
                    ...(habits || []).map(item => ({ label: item.name, value: String(item.id) }))
                ]} selected={habit} onChange={setHabit} />} */}
                <textarea className="postTA"/>
            </>}
        </div>
        <PageBottom onBack={goBack}>
            <button type="button" className="pageBottomAction" onClick={sendPost}
                disabled={loading || sending || error === "post.loadFailed" || (!text.trim() && !files.length && !media.length)}>
                <GearIcon weight="fill" color="var(--accent)"/> Настроики публикации
            </button>
            <div className="chatTaButts">
                <div className="chatWriteTAButt" onClick={handleSend}>
                    <PaperPlaneRightIcon className="chatSend" weight="fill" />
                </div>
            </div>
        </PageBottom>
    </div>;
}
