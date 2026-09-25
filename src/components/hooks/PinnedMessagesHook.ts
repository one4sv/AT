import { useContext } from "react"
import PinnedMessagesContext from "../context/PinnedMessagesContext"

export function usePinnedMessages() {
    const context = useContext(PinnedMessagesContext)
    if (!context) {
        throw new Error("usePinnedMessages must be used within PinnedMessagesProvider")
    }
    return context
}