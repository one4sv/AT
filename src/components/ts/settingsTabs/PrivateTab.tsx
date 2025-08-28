import { type TabProps } from "../../modules/Settings";
import SelectList, { type Option } from "../SelectList";
import { useSettings } from "../../hooks/SettingsHook";
import { useUpSettings } from "../../hooks/UpdateSettingsHook";
import { type PrivateSettings } from "../../context/SettingsContext";

export default function PrivateTab({ tabRef, isUpdating, fadingOutSections, handleAnimationEnd }: TabProps) {
    const { privateShow } = useSettings();
    const { setNewPrivateShow } = useUpSettings()

    const privateArr: Option[] = [
        { label: "Никто", value: "nobody" },
        { label: "Контакты", value: "contacts" },
    ];

    const privateArrFull: Option[] = [
        ...privateArr,
        { label: "Все", value: "all" },
    ];

    const applyNewPrivate = (setting: keyof PrivateSettings, value: string) => {
        if (!privateShow) return;
        const updated: PrivateSettings = { ...privateShow, [setting]: value };
        setNewPrivateShow(updated);
    };

    return (
        <div className="tab" ref={tabRef}>
            <span className="spanMain">Приватность</span>
            {fadingOutSections.includes("private") && (
                <span
                    className={`spanSave ${!isUpdating.includes("private") ? "fade-out" : ""}`}
                    onAnimationEnd={() => handleAnimationEnd("private")}
                >
                    Сохранение...
                </span>
            )}
            <div className="privateShowInfo">
                <div className="privateSLWrapper">
                    <label htmlFor="">Кто видит ваш номер телефона</label>
                    <SelectList className="privateSL" arr={privateArr} selected={privateShow.number} extraFunction={(value) => applyNewPrivate("number", value || "nobody")}/>
                </div>

                <div className="privateSLWrapper">
                    <label htmlFor="">Кто видит вашу электронную почту</label>
                    <SelectList className="privateSL" arr={privateArr} selected={privateShow.mail} extraFunction={(value) => applyNewPrivate("mail", value || "nobody")}/>
                </div>

                <div className="privateSLWrapper">
                    <label htmlFor="">Кто видит ваши привычки</label>
                    <SelectList className="privateSL" arr={privateArrFull} selected={privateShow.habits} extraFunction={(value) => applyNewPrivate("habits", value || "nobody")}/>
                </div>

                <div className="privateSLWrapper">
                    <label htmlFor="">Кто видит ваши посты</label>
                    <SelectList className="privateSL" arr={privateArrFull} selected={privateShow.posts} extraFunction={(value) => applyNewPrivate("posts", value || "nobody")}/>
                </div>
            </div>
        </div>
    );
}
