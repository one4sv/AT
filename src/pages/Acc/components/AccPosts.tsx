
import type { Habit } from "../../../components/context/HabitsContext";
import type { PostType } from "../../../components/context/AccContext";
import Post from "../../../components/ts/Post";
import { isMobile } from "react-device-detect";

interface AccPostsProps {
    posts: PostType[] | undefined,
    habits: Habit[] | undefined,
    isMy: boolean,
    refetch:(contactId:string)=>Promise<void>
}
export default function AccPosts({ posts, isMy }: AccPostsProps) {
    return (
        <div className={`accPosts ${isMobile ? "mobile" : ""}`}>
            {posts?.map((post) => {
                return (
                    <Post isMy={isMy} post={post} key={post.id}/>
                );
            })}
        </div>
    );
}