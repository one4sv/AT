
import { MagnifyingGlassMinusIcon } from "@phosphor-icons/react";
import { useSearchableSettings, type SearchableSection } from "../../Arrays/searchableSettings";
import type { SearchableSetting } from "../../Settings";
import { AnimatePresence, motion } from "motion/react";
import SearchButt from "../SearchButt";

interface Props {
    search: string;
    selectSetting: (sectionId: string, item: SearchableSetting) => void;
}

export default function SearchedButts({ search, selectSetting }: Props) {
    const searchableSettings = useSearchableSettings();
    const query = search.trim().toLowerCase();

    const filteredSections: SearchableSection[] = searchableSettings
        .map((section) => {
            const filteredItems = query === "??" || query === "."
                ? section.items
                : section.items.filter((item) =>
                    item.name.toLowerCase().includes(query)
                );

            if (filteredItems.length === 0) return null;

            return {
                ...section,
                items: filteredItems,
            };
        })
        .filter((section): section is SearchableSection => section !== null);


    if (filteredSections.length === 0) {
        return (
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
        );
    }

    return (
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

                    <div className="searchInnerDiv">
                        <AnimatePresence mode="popLayout">
                            {section!.items.map((item, itemIndex) => (
                                <SearchButt item={item} itemIndex={itemIndex} section={section} selectSetting={selectSetting} key={item.id} search={search}/>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
    );
}
