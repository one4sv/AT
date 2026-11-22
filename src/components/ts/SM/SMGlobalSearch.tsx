import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useSideMenu } from "../../hooks/SideMenuHook";
import { useSearchableSettings } from "../../../pages/Settings/Arrays/searchableSettings";
import { formatSMSearchQuery, parseSMSearchQuery, searchTabFilters, type SearchFilter } from "../utils/globalSearchQuery";
import type { tab } from "../../context/SideMenuContext";
import "../../../scss/SM/globalSearch.scss";

interface SearchResult {
    kind: string;
    id: string;
    label: string;
    description: string;
    url: string;
}

export default function SMGlobalSearch({ query, tab: section, onFilterChange, onChoose }: {
    query: string;
    tab: tab;
    onFilterChange: (filter: SearchFilter | null) => void;
    onChoose: (kind: string) => void;
}) {
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { setActiveTab, setSettingsSearch } = useSideMenu();
    const sections = useSearchableSettings();
    const parsed = parseSMSearchQuery(query);
    const activeFilters = parsed.filter ? [parsed.filter] : searchTabFilters[section];
    const serverFilters = activeFilters.filter(filter => filter !== "setting");
    const isFilterInput = query.trim().startsWith("/") && !parsed.query;
    const slashMatches = isFilterInput ? searchTabFilters[section].filter(filter =>
        filter.startsWith(query.trim().slice(1).toLowerCase())) : [];
    const settings = activeFilters.includes("setting") && parsed.query
        ? sections.flatMap(section => section.items.filter(item =>
            [item.name, item.category].some(value => value?.toLowerCase().includes(parsed.query.toLowerCase())))
            .map(item => ({
                kind: "setting", id: item.id, label: item.name, description: item.category,
                url: "/settings"
            }))).slice(0, 20) : [];
    const [items, setItems] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [pages, setPages] = useState<Record<string, number>>({});
    const [moreFilters, setMoreFilters] = useState<SearchFilter[]>([]);
    const valid = !!parsed.query && parsed.query.length <= 100;

    useEffect(() => {
        setItems([]);
        setPages({});
        setMoreFilters([]);
        if (!valid || !serverFilters.length) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        const timer = window.setTimeout(() => {
            void Promise.all(serverFilters.map(filter =>
                api.get("search/global", {
                    params: { q: formatSMSearchQuery(filter, parsed.query), page: 0 },
                    signal: controller.signal
                }).catch(() => null)
            )).then(responses => {
                if (controller.signal.aborted) return;
                const seen = new Set<string>();
                const results: SearchResult[] = [];
                responses.forEach(response => {
                    if (!response?.data?.success) return;
                    (response.data.items || []).forEach((item: SearchResult) => {
                        const key = item.kind + ":" + item.id;
                        if (seen.has(key)) return;
                        seen.add(key);
                        results.push(item);
                    });
                });
                setItems(results);
                setMoreFilters(serverFilters.filter((_, index) => !!responses[index]?.data?.hasMore));
            }).finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        }, 250);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query, section]);

    const loadMore = () => {
        if (loading || !moreFilters.length) return;
        setLoading(true);
        const filters = [...moreFilters];
        void Promise.all(filters.map(filter => api.get("search/global", {
            params: { q: formatSMSearchQuery(filter, parsed.query), page: (pages[filter] || 0) + 1 }
        }).catch(() => null))).then(responses => {
            setItems(previous => {
                const seen = new Set(previous.map(item => item.kind + ":" + item.id));
                const result = [...previous];
                responses.forEach(response => {
                    if (!response?.data?.success) return;
                    (response.data.items || []).forEach((item: SearchResult) => {
                        const key = item.kind + ":" + item.id;
                        if (seen.has(key)) return;
                        seen.add(key);
                        result.push(item);
                    });
                });
                return result;
            });
            setPages(previous => {
                const next = { ...previous };
                filters.forEach((filter, index) => {
                    if (responses[index]?.data?.success) next[filter] = (next[filter] || 0) + 1;
                });
                return next;
            });
            setMoreFilters(filters.filter((_, index) => !!responses[index]?.data?.hasMore));
        }).finally(() => setLoading(false));
    };
    const open = (item: SearchResult) => {
        if (item.kind === "setting") {
            setSettingsSearch(parsed.query);
            setActiveTab("user");
        }
        onChoose(item.kind);
        navigate(item.kind === "com" ? item.url.replace("?comment=", "#comment-") : item.url);
    };
    return <div className="SMlist smSearchResults" role="region" aria-label={t("accountNavigation.search")}>
        {isFilterInput ? <>
            <button type="button" className="smSearchResult" onClick={() => onFilterChange(null)}>
                {t("sideMenu.searchFilter.none")}
            </button>
            {slashMatches.map(filter => <button type="button" className="smSearchResult" key={filter}
                onClick={() => onFilterChange(filter)}>
                {"/" + filter} — {t("sideMenu.searchFilter." + filter)}
            </button>)}
        </> : <>
            {[...settings, ...items].map(item => <button type="button"
                key={item.kind + ":" + item.id} className="smSearchResult"
                onClick={() => open(item)}>
                <span className="smSearchKind">{t("sideMenu.searchFilter." + item.kind)}</span>
                <span className="smSearchText">{item.label}</span>
                {item.description && <span className="smSearchDescription">{item.description}</span>}
            </button>)}
            {loading && <div className="smSearchStatus">{t("sideMenu.globalSearchLoading")}</div>}
            {!loading && !settings.length && !items.length && <div className="smSearchStatus">
                {valid ? t("sideMenu.globalSearchEmpty") : t("sideMenu.searchHint")}
            </div>}
            {moreFilters.length > 0 && <button type="button" className="smSearchMore" disabled={loading}
                onClick={loadMore}>{t("sideMenu.globalSearchMore")}</button>}
        </>}
    </div>;
}
