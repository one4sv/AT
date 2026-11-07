
import type { Habit } from "../../../components/context/HabitsContext";
import type { PostType } from "../../../components/context/AccContext";
import Post from "../../../components/ts/Post";
import { isMobile } from "react-device-detect";
import { useTranslation } from "react-i18next";
import SectionArt from "../../../components/ts/SectionArt";

interface AccPostsProps {
    posts: PostType[] | undefined,
    habits: Habit[] | undefined,
    isMy: boolean,
    refetch:(contactId:string)=>Promise<void>
}
export default function AccPosts({ posts, isMy }: AccPostsProps) {
    const { t } = useTranslation("acc");
    return (
        <div className={`accPosts ${isMobile ? "mobile" : ""}`}>
            {posts?.length ? posts.map(post => <Post isMy={isMy} post={post} key={post.id}/>) : posts && (
                <div className="accPostsEmpty">
                    <div className="accEmptyState">
                        <SectionArt theme="general"/>
                        <span>{t(isMy ? "postsEmptyOwn" : "postsEmpty")}</span>
                    </div>
                </div>
            )}
        </div>
    );
}