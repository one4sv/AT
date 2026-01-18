import { useEffect, useState } from "react";
import { useUser } from "../../components/hooks/UserHook.ts";
import Loader from "../../components/ts/Loader.tsx";
import FeedNothing from "./components/FeedNothing.tsx";
import PostWrite from "./components/PostWrite.tsx";
import "./scss/Main.scss"
import type { PostType } from "../../components/context/AccContext.tsx";
import { api } from "../../components/ts/api.ts";
import Post from "../../components/ts/Post.tsx";
import { isMobile } from "react-device-detect";
import { usePageTitle } from "../../components/hooks/PageContextHook.tsx";

export default function Feed() {
    const { initialLoading, user } = useUser();
    const [ postLoading, setPostLoading ] = useState(true)
    const [ posts, setPosts ] = useState<PostType[]>([])
    const { setTitle } = usePageTitle()

    useEffect(() => {
        setTitle("Главная")
    }, [setTitle])

    const postFor = async () => {
        try {
            const res = await api.get(`feed`)
            if (res.data.success) setPosts(res.data.posts)
        } catch (err) {
            console.log(err)
        } finally {
            setPostLoading(false)
        }
    }

    useEffect(() => {
        if (user.id) postFor()
    }, [user.id])

    if (initialLoading || postLoading) return <Loader />;

    return (
        <div className={`MainDiv ${isMobile ? "mobile" : ""}`}>
            <div className={`postFeed ${isMobile ? "mobile" : ""}`}>
                {posts.length === 0 ? (
                    <FeedNothing/>
                ) : (
                    <>
                        {posts.map((post) => (
                            <Post isMy={false} post={post} key={post.id}/>
                        ))}
                    </>
                )}
            </div>
            <PostWrite/>
        </div>
    );
}
