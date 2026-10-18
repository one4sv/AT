import { motion } from "motion/react";
import AutoFitIconText from "./AutoFitIconText";
import type { SearchableSetting } from "../Settings";
import type { SearchableSection } from "../Arrays/searchableSettings";
import { isMobile } from "react-device-detect";
import HighlightText from "./Search/HighlightText";

interface Props {
    item: SearchableSetting,
    section: SearchableSection,
    itemIndex:number,
    selectSetting: (sectionId: string, item: SearchableSetting) => void;
    search:string
}

export default function SearchButt({item, section, itemIndex, selectSetting, search}:Props) {

    if (isMobile && item.options?.mobileOnly) return

    return (
        <motion.div
            className="searchButt"
            onClick={() => selectSetting(section!.id, item)}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{
                duration: 0.1,
                ease: [0.22, 1, 0.36, 1],
                delay: itemIndex * 0.025,
            }}
            layout
        >
            <span className={`settingName ${item.options?.isDanger ? "danger" : ""}`}>
                {item.icon ? (
                    <item.icon
                        size={22}
                        weight="fill"
                        color={item.options?.icon_color ?? "var(--accent)"}
                    />
                ) : (
                    <AutoFitIconText text={item.options?.icon_text} />
                )}
                {item.options?.icon2 ? (
                    <item.options.icon2
                        size={22}
                        weight="fill"
                        color={item.options?.icon2_color ?? "var(--accent)"}
                    />
                ) : ""}
                <HighlightText search={search} text={item.name}/>
            </span>
        </motion.div>
    )
}