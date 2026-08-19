import { useBlackout } from "../hooks/BlackoutHook"
import { useNavigate } from "react-router"
import { useMessages } from "../hooks/MessagesHook"
import { ArrowDownToLine, MessageCircleReply } from "lucide-react"

export default function ImgPrev () {
    const { blackout, setBlackout } = useBlackout()
    const { setPendingScrollId } = useMessages()
    const navigate = useNavigate()
    const { nick, id, name } = blackout.options ?? {}

    const handleDownload = async () => {
        if (!blackout.img) return
        const response = await fetch(blackout.img);
        const blob = await response.blob();

        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name || "image";
        a.click();

        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="imgPrevDiv" onClick={() => setBlackout({seted:false})}>
            <img src={blackout?.img} alt="" onClick={(e) => e.stopPropagation()}/>
            <div className="imgPrevMenu">
                {nick && id ? (
                    <div className="imgPrevToMessage imgPrevMenuButt" title="Перейти к сообщению" onClick={()=> {
                        navigate(`/chat/${nick}`);
                        setPendingScrollId(Number(id));
                    }}>
                        <MessageCircleReply size={32}/>
                    </div>
                ) : ""}
                <div className="imgPrevToMessage imgPrevMenuButt" title="Скачать" onClick={(e)=> {
                    handleDownload();
                    e.stopPropagation()
                }}>
                    <ArrowDownToLine size={32}/>
                </div>
            </div>
        </div>
    )
}