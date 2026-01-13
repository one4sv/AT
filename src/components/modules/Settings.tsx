import { useRef, useEffect, useState, useMemo } from "react";
import type { RefObject } from "react";
import { useSettings } from "../hooks/SettingsHook";
import { useUpSettings } from "../hooks/UpdateSettingsHook";
import { Search } from "lucide-react";
import "../../scss/modules/settings.scss";
import HabitsTab from "../ts/settingsTabs/HabitsTab";
import PersTab from "../ts/settingsTabs/PersTab";
import PrivateTab from "../ts/settingsTabs/PrivateTab"
import SafetyTab from "../ts/settingsTabs/SafetyTab";
import ChatTab from "../ts/settingsTabs/ChatTab";
import NoteTab from "../ts/settingsTabs/NoteTab";

export interface TabProps {
    tabRef: RefObject<HTMLDivElement>;
    isUpdating: string[];
    fadingOutSections: string[];
    handleAnimationEnd: (section: string) => void;
}

export default function Settings() {
    const { tab, setTab } = useSettings();
    const { isUpdating } = useUpSettings();
    const [fadingOutSections, setFadingOutSections] = useState<string[]>([]);

    const persRef = useRef<HTMLDivElement>(null!);
    const habitsRef = useRef<HTMLDivElement>(null!);
    const safetyRef = useRef<HTMLDivElement>(null!);
    const privateRef = useRef<HTMLDivElement>(null!);
    const noteRef = useRef<HTMLDivElement>(null!);
    const chatRef = useRef<HTMLDivElement>(null!);

    const refMap = useMemo<Record<string, React.RefObject<HTMLDivElement>>>(() => ({
        pers: persRef,
        habits: habitsRef,
        safety: safetyRef,
        private: privateRef,
        note: noteRef,
        chat: chatRef,
    }), []);

    const scrollToTab = (tabName: string) => {
        setTab(tabName);
        const ref = refMap[tabName];
        if (ref?.current) {
            ref.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        const ref = refMap[tab];
        if (ref?.current) {
            ref.current.scrollIntoView({ behavior: "auto" });
        }
    }, [refMap, tab]);

    // Обработчик завершения анимации
    const handleAnimationEnd = (section: string) => {
        setFadingOutSections((prev) => prev.filter((item) => item !== section));
    };

    // Синхронизация fadingOutSections с isUpdating
    useEffect(() => {
        setFadingOutSections((prev) => [...new Set([...prev, ...isUpdating])]);
    }, [isUpdating]);

    return (
        <div className="settingsDiv">
            <div className="settingsSideMenu">
                <div className="search">
                    <input type="text" />
                    <Search />
                </div>
                <div onClick={() => scrollToTab("pers")} className={tab === "pers" ? "active" : ""}>Персонализация</div>
                <div onClick={() => scrollToTab("habits")} className={tab === "habits" ? "active" : ""}>Активности</div>
                <div onClick={() => scrollToTab("safety")} className={tab === "safety" ? "active" : ""}>Безопасность</div>
                <div onClick={() => scrollToTab("private")} className={tab === "private" ? "active" : ""}>Приватность</div>
                <div onClick={() => scrollToTab("note")} className={tab === "note" ? "active" : ""}>Уведомления</div>
                <div onClick={() => scrollToTab("chat")} className={tab === "chat" ? "active" : ""}>Чаты</div>
            </div>
            <div className="settingsMainWrapper">
                <div className="settingsMain">
                    <PersTab tabRef={persRef} isUpdating={isUpdating} fadingOutSections={fadingOutSections} handleAnimationEnd={handleAnimationEnd}/>
                    <HabitsTab tabRef={habitsRef} isUpdating={isUpdating} fadingOutSections={fadingOutSections} handleAnimationEnd={handleAnimationEnd}/>
                    <SafetyTab tabRef={safetyRef} isUpdating={isUpdating} fadingOutSections={fadingOutSections} handleAnimationEnd={handleAnimationEnd}/>
                    <PrivateTab tabRef={privateRef} isUpdating={isUpdating} fadingOutSections={fadingOutSections} handleAnimationEnd={handleAnimationEnd}/>
                    <NoteTab tabRef={noteRef} isUpdating={isUpdating} fadingOutSections={fadingOutSections} handleAnimationEnd={handleAnimationEnd}/>
                    <ChatTab tabRef={chatRef} isUpdating={isUpdating} fadingOutSections={fadingOutSections} handleAnimationEnd={handleAnimationEnd}/>
                </div>
            </div>
        </div>
    );
}