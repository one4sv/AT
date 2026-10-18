import { useSearchableSettings } from "../../Arrays/searchableSettings";
import type { SearchableSetting } from "../../Settings";
import AutoFitIconText from "../AutoFitIconText";

interface Props {
    recent: SearchableSetting[];
    selectSetting: (sectionId: string, item: SearchableSetting) => void;
}

export default function SearchUnstarted({ recent, selectSetting }: Props) {
    const searchableSettings = useSearchableSettings();
    const personalization = searchableSettings.find((section) => section.id === "pers");

    const popularSettings = personalization?.items.filter(
        (item) => item.id === "theme" || item.id === "decor"
    ) ?? [];

    const getSectionId = (item: SearchableSetting) =>
        searchableSettings.find((section) => section.items.includes(item))?.id
        ?? personalization?.id
        ?? "pers";

    const renderSetting = (item: SearchableSetting, sectionId: string) => (
        <div
            className="searchButt"
            key={`${sectionId}:${item.id}`}
            onClick={() => selectSetting(sectionId, item)}
        >
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
    );

    return (
        <>
            {recent.length > 0 && (
                <div className="settingInnerDiv">
                    <div className="settingHeader">Недавние</div>
                    <div className="searchInnerDiv">
                        {recent.map((item) => renderSetting(item, getSectionId(item)))}
                    </div>
                </div>
            )}

            <div className="settingInnerDiv">
                <div className="settingHeader">Популярное</div>
                <div className="searchInnerDiv">
                    {popularSettings.map((item) => renderSetting(item, "pers"))}
                </div>
            </div>
        </>
    );
}