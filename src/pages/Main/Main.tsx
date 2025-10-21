import { useUser } from "../../components/hooks/UserHook.ts";
import Loader from "../../components/ts/Loader.tsx";
import FeedNothing from "./components/FeedNothing.tsx";
import PostWrite from "./components/PostWrite.tsx";
import "./scss/Main.scss"

export default function Feed() {
    const { initialLoading } = useUser();

    if (initialLoading) return <Loader />;

    return (
        <div className="MainDiv">
            <div className="postFeed">
                <FeedNothing/>
            </div>
            <PostWrite/>
        </div>
    );
}
