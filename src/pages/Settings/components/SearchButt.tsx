import { motion } from "motion/react";
import SettingCatalogIcon from "./SettingCatalogIcon";
import type { SearchableSetting } from "../Settings";
import type { SearchableSection } from "../Arrays/searchableSettings";
import { isMobile } from "react-device-detect";
import HighlightText from "../../../components/ts/HighlightText";

interface Props {
    item: SearchableSetting,
    section: SearchableSection,
    itemIndex:number,
    selectSetting: (sectionId: string, item: SearchableSetting) => void;
    search:string,
    staticResults?: boolean
}

export default function SearchButt({item, section, itemIndex, selectSetting, search, staticResults = false}:Props) {

    if (isMobile && item.options?.mobileOnly) return

    return (
        <motion.div
            className="searchButt"
            onClick={() => selectSetting(section!.id, item)}
            initial={staticResults ? false : { scale: 0.96, opacity: 0 }}
            animate={staticResults ? undefined : { scale: 1, opacity: 1 }}
            exit={staticResults ? undefined : { scale: 0.96, opacity: 0 }}
            transition={staticResults ? { duration: 0 } : {
                duration: 0.1,
                ease: [0.22, 1, 0.36, 1],
                delay: itemIndex * 0.025,
            }}
            layout={!staticResults}
        >
            <span className={`settingName ${item.options?.isDanger ? "danger" : ""}`}>
                <SettingCatalogIcon item={item}/>
                <HighlightText search={search} text={item.name}/>
            </span>
        </motion.div>
    )
}