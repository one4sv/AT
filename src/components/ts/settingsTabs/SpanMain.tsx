import { isMobile } from "react-device-detect"
import { useSettings } from "../../hooks/SettingsHook"
import { ChevronLeft } from "lucide-react"

export const SpanMain = ({text}:{text:string}) => {
    const { setTab } = useSettings()
    return (
        <div className="spanMain" onClick={() => isMobile && setTab("menu")}>{isMobile && <ChevronLeft/>}{text}</div>
    )
}