import { HeartIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../components/ts/api";
import Post from "../../components/ts/Post";
import type { PostType } from "../../components/context/AccContext";
import { useUser } from "../../components/hooks/UserHook";
import { useAcc } from "../../components/hooks/AccHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import PageBottom from "../../components/ts/PageBottom";
import PostComments from "./PostComments";
import "../../scss/Loading.scss";
import "../Acc/scss/AccPostComments.scss";
import "./scss/postPage.scss";

export default function PostPage() {
    const { t } = useTranslation("acc");
    const { postId } = useParams();
    const { user } = useUser();
    const { setPosts } = useAcc();
    const { setTitle } = usePageTitle();
    const navigate = useNavigate();
    const [ post, setPost ] = useState<PostType | null>(null);
    const [ error, setError ] = useState("");
    const [ retry, setRetry ] = useState(0);
    const [ liking, setLiking ] = useState(false);
    const likingRef = useRef(false);
    const currentPost = post && String(post.id) === postId ? post : null;

    useEffect(() => {
        setTitle(t("post.title"));
    }, [setTitle, t]);
    useEffect(() => {
        const controller = new AbortController();
        setPost(null);
        setError("");
        api.get(`post/${postId}`, { signal: controller.signal })
            .then(res => { if (!controller.signal.aborted) setPost(res.data.post); })
            .catch(err => {
                if (!controller.signal.aborted) setError(err.response?.status === 404 ? "post.unavailable" : "post.loadFailed");
            });
        return () => controller.abort();
    }, [postId, retry]);

    const likePost = async () => {
        if (!user.id) {
            navigate("/sign");
            return;
        }
        if (!currentPost || likingRef.current) return;
        likingRef.current = true;
        setLiking(true);
        setError("");
        try {
            const res = await api.post("like", { id: currentPost.id });
            if (!res.data.success) throw new Error("Like not saved");
            const update = (item: PostType): PostType => {
                if (item.id !== currentPost.id) return item;
                const likes = item.likes.filter(id => id !== user.id);
                if (res.data.liked) likes.push(user.id);
                return { ...item, likes };
            };
            setPost(previous => previous ? update(previous) : previous);
            setPosts(previous => previous.map(update));
        } catch {
            setError("editor.likeFailed");
        } finally {
            likingRef.current = false;
            setLiking(false);
        }
    };

    const goBack = () => {
        if (window.history.state?.idx > 0) navigate(-1);
        else navigate("/");
    };
    const onCommentSent = (delta = 1) => {
        setPost(prev => prev ? { ...prev, comments_count: Math.max(0, prev.comments_count + delta) } : prev);
        setPosts(prev => prev.map(item => String(item.id) === postId
            ? { ...item, comments_count: Math.max(0, item.comments_count + delta) } : item));
    };

    return (
        <div className="postPage">
            {currentPost ? <PostComments
                key={currentPost.id}
                id={currentPost.id}
                onSent={onCommentSent}
                onBack={goBack}
                action={user.id !== currentPost.user.id && (
                    <button
                        type="button"
                        className="pageBottomAction"
                        disabled={liking}
                        aria-pressed={currentPost.likes.includes(user.id)}
                        onClick={likePost}
                    >
                        <HeartIcon weight={currentPost.likes.includes(user.id) ? "fill" : "regular"} />
                        {t("editor.like")}
                    </button>
                )}
                onEdit={user.id === currentPost.user.id ? () => navigate(`/post/${currentPost.id}/edit`) : undefined}
            >
                {error && <div className="postStatus" role="alert">
                    {t(error)}
                </div>}
                <Post
                    post={currentPost}
                    isMy={user.id === currentPost.user.id}
                    expanded
                    onLike={likePost}
                    liking={liking}
                />
            </PostComments> : <>
                <div className="postPageScroll">
                    {error ? <div className="postStatus" role="alert">
                        <span>
                            {t(error)}
                        </span>
                        <button type="button" onClick={() => setRetry(value => value + 1)}>
                            {t("post.retry")}
                        </button>
                    </div> : <div
                        className="skeleton postSkeleton"
                        role="status"
                        aria-busy="true"
                        aria-label={t("post.loading")}
                    >
                        <div className="skeletonCard" aria-hidden="true">
                            <div className="skeletonRow">
                                <div className="skeletonCircle" />
                                <div className="skeletonText">
                                    <div className="skeletonLine skeletonShort" />
                                    <div className="skeletonLine" />
                                </div>
                            </div>
                            <div className="skeletonLine" />
                            <div className="skeletonLine" />
                            <div className="skeletonBlock" />
                        </div>
                    </div>}
                </div>
                <PageBottom onBack={goBack} />
            </>}
        </div>
    );
}
