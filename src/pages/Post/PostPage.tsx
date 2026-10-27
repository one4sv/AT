import { useEffect, useState } from "react";
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
    const [post, setPost] = useState<PostType | null>(null);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);
    const currentPost = post && String(post.id) === postId ? post : null;

    useEffect(() => { setTitle(t("post.title")); }, [setTitle, t]);
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

    const goBack = () => {
        if (window.history.state?.idx > 0) navigate(-1);
        else navigate("/");
    };
    const onCommentSent = () => {
        setPost(prev => prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev);
        setPosts(prev => prev.map(item => String(item.id) === postId
            ? { ...item, comments_count: item.comments_count + 1 } : item));
    };

    return <div className="postPage">
        {currentPost ? <PostComments key={currentPost.id} id={currentPost.id} onSent={onCommentSent} onBack={goBack}
            onEdit={user.id === currentPost.user.id ? () => navigate(`/post/${currentPost.id}/edit`) : undefined}>
            <Post post={currentPost} isMy={user.id === currentPost.user.id} expanded />
        </PostComments> : <>
            <div className="postPageScroll">
                {error ? <div className="postStatus" role="alert">
                    <span>{t(error)}</span>
                    <button type="button" onClick={() => setRetry(value => value + 1)}>{t("post.retry")}</button>
                </div> : <div className="skeleton postSkeleton" role="status" aria-busy="true" aria-label={t("post.loading")}>
                    <div className="skeletonCard" aria-hidden="true">
                        <div className="skeletonRow">
                            <div className="skeletonCircle" />
                            <div className="skeletonText"><div className="skeletonLine skeletonShort" /><div className="skeletonLine" /></div>
                        </div>
                        <div className="skeletonLine" /><div className="skeletonLine" /><div className="skeletonBlock" />
                    </div>
                </div>}
            </div>
            <PageBottom onBack={goBack} />
        </>}
    </div>;
}
