import { useNavigate } from "react-router-dom";
import type { message } from "../../../components/context/ChatContext";

export default function SystemMessage({m}:{m:message}) {
    const navigate = useNavigate()
    
    return (
        <div className="messageWrapper">
            <div className="systemMessage">
                <span className="systemMessageSender" onClick={()=> navigate(`/acc/${m.sender_nick}`)}>
                    {m.sender_name}
                </span>
                &nbsp;
                <span>
                    {m.content}
                </span>
            </div>
        </div>

    )
}