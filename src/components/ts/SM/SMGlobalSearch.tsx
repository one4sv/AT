import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { api } from "../api";
import { useSideMenu } from "../../hooks/SideMenuHook";
import { useSearchableSettings } from "../../../pages/Settings/Arrays/searchableSettings";
import { parseSMSearchQuery } from "../utils/globalSearchQuery";
import "../../../scss/SM/globalSearch.scss";

interface SearchResult {
    kind: string;
    id: string;
    label: string;
    description: string;
    url: string;
}

export default function SMGlobalSearch({ query, onChoose }: {
    query: string;
    onChoose: (kind: string) => void;
}) {
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { setActiveTab, setSettingsSearch } = useSideMenu();
    const sections = useSearchableSettings();
    const parsed = parseSMSearchQuery(query);
    const settings = (parsed.filter === "every" || parsed.filter === "setting") && parsed.query
        ? sections.flatMap(section => section.items.filter(item =>
            [item.name, item.category].some(value => value?.toLowerCase().includes(parsed.query.toLowerCase())))
            .map(item => ({
                kind: "setting", id: item.id, label: item.name, description: item.category,
                url: "/settings"
            }))).slice(0, 20) : [];
    const [items, setItems] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const valid = !!parsed.query && parsed.query.length <= 100 &&
        !query.trim().startsWith("/setting");
    useEffect(() => {
        setItems([]);
        setPage(0);
        setHasMore(false);
        if (!valid) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        setLoading(true);
        const timer = window.setTimeout(() => {
            void api.get("search/global", { params: { q: query, page: 0 }, signal: controller.signal })
                .then(response => {
                    if (controller.signal.aborted) return;
                    setItems(response.data?.success ? response.data.items || [] : []);
                    setHasMore(!!response.data?.hasMore);
                }).catch(() => {
                    if (!controller.signal.aborted) { setItems([]); setHasMore(false); }
                }).finally(() => {
                    if (!controller.signal.aborted) setLoading(false);
                });
        }, 250);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query, valid]);
    const loadMore = () => {
        if (loading || !hasMore) return;
        setLoading(true);
        void api.get("search/global", { params: { q: query, page: page + 1 } }).then(response => {
            if (!response.data?.success) return;
            setItems(previous => [...previous, ...(response.data.items || [])]);
            setPage(previous => previous + 1);
            setHasMore(!!response.data.hasMore);
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
    return <div className="smGlobalSearch" role="region" aria-label={t("accountNavigation.search")}>
        {[...settings, ...items].map(item => <button type="button"
            key={item.kind + ":" + item.id} className="smGlobalSearchResult"
            onClick={() => open(item)}>
            <span className="smGlobalSearchKind">{t("sideMenu.searchFilter." + item.kind)}</span>
            <span className="smGlobalSearchText">{item.label}</span>
            {item.description && <span className="smGlobalSearchDescription">{item.description}</span>}
        </button>)}
        {loading && <div className="smGlobalSearchStatus">{t("sideMenu.globalSearchLoading")}</div>}
        {!loading && !settings.length && !items.length && <div className="smGlobalSearchStatus">
            {t("sideMenu.globalSearchEmpty")}
        </div>}
        {hasMore && <button type="button" className="smGlobalSearchMore" disabled={loading} onClick={loadMore}>
            {t("sideMenu.globalSearchMore")}
        </button>}
    </div>;
}
