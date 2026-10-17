import { useSearchableSettings } from "../../Arrays/searchableSettings";
import AutoFitIconText from "../AutoFitIconText";

export default function SearchUnstarted() {
    const searchableSettings = useSearchableSettings();
    const personalization = searchableSettings.find((section) => section.id === "pers");

    const popularSettings = personalization?.items.filter(
        (item) => item.id === "theme" || item.id === "decor"
    ) ?? [];

    return (
        <div className="searchUnstarted">
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Недавние
                </div>
            </div>
            <div className="settingInnerDiv">
                <div className="settingHeader">
                    Популярное
                </div>
                {popularSettings.map((item) => (
                    <div className="settingButt" key={item.id}>
                        <span className="settingName">
                            {item.icon ? (
                                <item.icon
                                    size={22}
                                    weight="fill"
                                    color={item.options?.icon_color ?? "var(--accent)"}
                                />
                            ) : (
                                <AutoFitIconText text={item.options?.icon_text} />
                            )}
                            {item.options?.icon2 && (
                                <item.options.icon2
                                    size={22}
                                    weight="fill"
                                    color={item.options?.icon2_color ?? "var(--accent)"}
                                />
                            )}
                            {item.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}