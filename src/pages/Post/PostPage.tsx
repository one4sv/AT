import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { api } from "../../components/ts/api";
import Post from "../../components/ts/Post";
import type { PostType } from "../../components/context/AccContext";
import { useUser } from "../../components/hooks/UserHook";
import { usePageTitle } from "../../components/hooks/PageContextHook";
import "./scss/postPage.scss";
import { useTranslation } from "react-i18next";
import { isMobile } from "react-device-detect";
export default function PostPage() {
    const { t } = useTranslation("info");
    const { postId } = useParams();
    const { user } = useUser();
    const { setTitle } = usePageTitle();
    const navigate = useNavigate();
    const [post, setPost] = useState<PostType | null>(null);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(
        () => {
            setTitle("Пост");
            setPost(null);
            setError("");
            const controller = new AbortController();
            api.get(`post/${postId}`, {
                signal: controller.signal
            }).then(
                res => setPost(res.data.post)
            ).catch(
                err => {
                    if (!controller.signal.aborted) setError(err.response?.status === 404 ? "Пост удалён или недоступен" : "Не удалось загрузить пост");
                }
            );
            return () => controller.abort();
        },
        [postId, retry, setTitle]
    );

    return (
        <div className="postPage">
            <div className="postPageInner">
                {!isMobile ? (
                    <div className="postTop">
                        <div
                            className="infoBack"
                            onClick={() => {
                                navigate(-1);
                            }}
                        >
                            <ArrowLeftIcon size={24} />
                            <h2>{t("navigation.back")}</h2>
                        </div>
                    </div>
                ) : ""}
                {error ? <div className="statusCard" role="alert">
                    <p>
                        {error}
                    </p>
                    <button onClick={() => setRetry(n => n + 1)}>
                        Повторить
                    </button>
                </div> : post ? <Post key={post.id} post={post} isMy={user.id === post.user.id} expanded /> : <p role="status">Загрузка поста…</p>}
                {isMobile ? (
                    <div className="postBackWrapper">
                        <div
                            className="infoBack"
                            onClick={() => {
                                navigate(-1);
                            }}
                        >
                            <ArrowLeftIcon size={24} />
                            <h2>{t("navigation.back")}</h2>
                        </div>
                    </div>
                ) : ""}
            </div>
        </div>
    );
}
