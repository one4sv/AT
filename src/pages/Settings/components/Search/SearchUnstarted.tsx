import { useSearchableSettings } from "../../Arrays/searchableSettings";
import type { SearchableSetting } from "../../Settings";
import SettingCatalogIcon from "../SettingCatalogIcon";

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
        searchableSettings.find((section) => section.items.some(entry => entry.id === item.id))?.id
        ?? personalization?.id
        ?? "pers";

    const renderSetting = (item: SearchableSetting, sectionId: string) => (
        <div
            className="searchButt"
            key={`${sectionId}:${item.id}`}
            onClick={() => selectSetting(sectionId, item)}
        >
            <span className="settingName">
                <SettingCatalogIcon item={item}/>
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