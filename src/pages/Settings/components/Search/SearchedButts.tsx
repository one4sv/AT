import { MagnifyingGlassMinusIcon } from "@phosphor-icons/react";
import { useSearchableSettings } from "../../Arrays/searchableSettings";
import type { SearchableSetting } from "../../Settings";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router";
import AutoFitIconText from "../AutoFitIconText";
interface Props {
    search: string;
    onSelect?: (item: SearchableSetting) => void;
}

export default function SearchedButts({ search }: Props) {
    const searchableSettings = useSearchableSettings();
    const query = search.trim().toLowerCase();
    const navigate = useNavigate();

    const filteredSections = searchableSettings
        .map((section) => {
            const filteredItems = section.items.filter(
                (item) =>
                    item.name.toLowerCase().includes(query)
            );

            if (filteredItems.length === 0) return null;

            return {
                ...section,
                items: filteredItems,
            };
        })
        .filter(Boolean);

    if (filteredSections.length === 0) {
        return (
            <div className="searchedButts">
                <motion.div
                    className="settingInnerDiv searchedButtsEmpty"
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                    <MagnifyingGlassMinusIcon size={48} />
                    <span>Ничего не найдено</span>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="settingsButtsWrapper">
            <AnimatePresence mode="popLayout">
                {filteredSections.map((section) => (
                    <motion.div
                        key={section!.id}
                        className="settingInnerDiv"
                        initial={{ scale: 0.97, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.97, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        layout
                    >
                        <div className="searchSectionHeader">
                            {section && <section.icon size={22} weight="fill" />}
                            {section!.name}
                        </div>

                        <AnimatePresence mode="popLayout">
                            {section!.items.map((item, itemIndex) => (
                                <motion.div
                                    key={item.id}
                                    className="settingButt"
                                    onClick={() => navigate(`/settings/${section!.id}`)}
                                    initial={{ scale: 0.96, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.96, opacity: 0 }}
                                    transition={{
                                        duration: 0.26,
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
                                        {item.name}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}