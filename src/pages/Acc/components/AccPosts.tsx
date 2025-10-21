import { ChevronRight } from "lucide-react";
import type { Habit } from "../../../components/context/HabitsContext";
import { habitIcon } from "../../../components/ts/habitIcon";
import type { Post } from "../Acc";
import { ChatCircle, Heart } from "@phosphor-icons/react";
import { useNavigate } from "react-router";
import Linkify from "linkify-react";
import GetIconByType from "../../Chat/utils/getIconByType";
import { useBlackout } from "../../../components/hooks/BlackoutHook";

export default function AccPosts({posts, habits} : { posts:Post[], habits:Habit[] | undefined }) {
    const { setBlackout } = useBlackout()
    const navigate = useNavigate()
    return (
        <div className="accPosts">
            {posts.map((post) => {
                let likesCount = 0
                let like = false
                if (post.likes) likesCount = post.likes.length
                let habit = null
                if (post.habit_id) habit = habits?.find(h => h.id === post.habit_id)
                return (
                    <div className="accPost" key={post.id}>
                        {habit && (
                            <div className="accPostHabit" onClick={() => navigate(`/habit/${habit.id}`)}>
                                <div className="aphIcon">
                                    {habitIcon(habit)}
                                </div>
                                <div className="aphName">
                                    {habit.name}
                                </div>
                                <ChevronRight className="aphGo"/>
                            </div>
                        )}
                        <div className="accPostText">
                            <Linkify>{post.text}</Linkify>
                        </div>
                        <div className="accPostmedia">
                            {post.media && post.media.length > 0 && (
                                <div className="postMediaGrid">
                                    {post.media.map((file, j) => {
                                        const isImage = file.type.startsWith("image/");
                                        const isVideo = file.type.startsWith("video/");
                                        return (
                                            <div key={j} className="postFileGrid">
                                                {isImage ? (
                                                    <img src={file.url} alt={file.name} className="postFilePreview" onClick={() => setBlackout({seted:true, module:"ImgPrev", img:file.url})}/>
                                                ) : isVideo ? (
                                                    <video src={file.url} className="postFilePreview" controls />
                                                ) : (
                                                    <a href={file.url} download={file.name} className="postFileOther">
                                                        {GetIconByType(file.name, file.type)}
                                                        <span className="postFileName">{file.name}</span>
                                                    </a>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="accPostInteract">
                            <div className="accPostLikes" onClick={() => {
                                likesCount +=1
                                like = !like
                            }}>
                                {like ? <Heart weight="fill" color="#d60000"/> :<Heart/> }
                                <span>{likesCount}</span>
                            </div>
                            <div className="accPostComment">
                                <ChatCircle/>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}