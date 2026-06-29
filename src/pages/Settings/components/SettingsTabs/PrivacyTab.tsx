import { type Option } from "../../../../components/ts/SelectList";
import { useSettings } from "../../../../components/hooks/SettingsHook";
import { useUpSettings } from "../../../../components/hooks/UpdateSettingsHook";
import { type PrivateSettings } from "../../../../components/context/SettingsContext";
import RadioGroup from "../../../../components/ts/RadioGroup";

export default function PrivacyTab() {
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
        <div className="settingTab">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Чипинкос
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Кто видит ваш номер телефона</div>
                    <RadioGroup list={privateArr} val={privateShow.number} newVal={(value) => applyNewPrivate("number", value || "nobody")}/>
                </div>
                <div className="privateSLWrapper">
                    <div className="settingSpan">Кто видит вашу электронную почту</div>
                    <RadioGroup list={privateArr} val={privateShow.mail} newVal={(value) => applyNewPrivate("mail", value || "nobody")}/>
                </div>

                <div className="privateSLWrapper">
                    <div className="settingSpan">Кто видит ваши привычки</div>
                    <RadioGroup list={privateArrFull} val={privateShow.habits} newVal={(value) => applyNewPrivate("habits", value || "nobody")}/>
                </div>

                <div className="privateSLWrapper">
                    <div className="settingSpan">Кто видит ваши посты</div>
                    <RadioGroup list={privateArrFull} val={privateShow.posts} newVal={(value) => applyNewPrivate("posts", value || "nobody")}/>
                </div>
            </div>
        </div>
    );
}
