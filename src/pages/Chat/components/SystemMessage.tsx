import type { message } from "../../../components/context/ChatContext";

export default function SystemMessage({m}:{m:message}) {
    if (!m.is_system) return null
    return (
        <div className="messageWrapper">
            <div className="systemMessage">
                <span>{m.content}</span>
            </div>
        </div>

    )
}