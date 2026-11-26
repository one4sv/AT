import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { MagnifyingGlassMinusIcon } from "@phosphor-icons/react";
import { api } from "../api";
import { tags } from "../tags";
import { useContacts } from "../../hooks/ContactsHook";
import { matchesSettingSearch, useSearchableSettings } from "../../../pages/Settings/Arrays/searchableSettings";
import { settingsSearchNavigation } from "../../../pages/Settings/Arrays/settingsSearchNavigation";
import { formatSMSearchQuery, searchResultRank, searchSourceFilters, searchTabFilters, type SearchFilter } from "../utils/globalSearchQuery";
import type { tab } from "../../context/SideMenuContext";
import type { Contact } from "../../context/ContactsContext";
import SMSearchFilterIcon from "./SMSearchFilterIcon";
import "../../../scss/Loading.scss";
import "../../../scss/SM/globalSearch.scss";

interface SearchResult {
    kind: string;
    id: string;
    label: string;
    description: string;
    url: string;
    settingSection?: string;
    avatar_url?: string | null;
    tag?: string | null;
    mine?: boolean;
}

function SMSearchResultVisual({ item }: { item: SearchResult }) {
    const [failedImage, setFailedImage] = useState(false);
    const hasAvatar = ["user", "post", "contact"].includes(item.kind) && !!item.avatar_url && !failedImage;
    const TagIcon = item.kind === "habit" || item.kind === "plan"
        ? tags.find(tag => tag.value === item.tag)?.icon : null;

    return <span className={"smSearchVisual " + (hasAvatar ? "withImage" : "")} aria-hidden="true">
        {hasAvatar ? <img src={item.avatar_url!} alt="" loading="lazy" onError={() => setFailedImage(true)}/>
            : TagIcon ? <TagIcon/> : <SMSearchFilterIcon filter={item.kind === "contact" ? "user" : item.kind as SearchFilter} size={26}/>}
    </span>;
}

function SearchSkeleton({ count = 5 }: { count?: number }) {
    return <div className="smSearchSkeleton" role="status" aria-busy="true">
        {Array.from({ length: count }, (_, index) => <div className="smSearchSkeletonItem" key={index}>
            <span className="skeletonCircle"/>
            <span className="smSearchSkeletonLines">
                <span className="skeletonLine"/>
                <span className="skeletonLine skeletonShort"/>
            </span>
        </div>)}
    </div>;
}

function mapContact(contact: Contact): SearchResult {
    return {
        kind: "contact",
        id: contact.id,
        label: contact.name || contact.nick,
        description: contact.is_group ? "group" : "@" + contact.nick,
        url: contact.is_group ? "/chat/g/" + encodeURIComponent(contact.id) :
            "/chat/" + encodeURIComponent(contact.nick),
        avatar_url: contact.avatar_url
    };
}

export default function SMGlobalSearch({ query, filter, tab: section, onFilterChange, onChoose }: {
    query: string;
    filter: SearchFilter | null;
    tab: tab;
    onFilterChange: (filter: SearchFilter | null) => void;
    onChoose: (kind: string) => void;
}) {
    const { t } = useTranslation("common");
    const navigate = useNavigate();
    const { findContacts } = useContacts();
    const sections = useSearchableSettings();
    const term = query.trim();
    const isFilterInput = term.startsWith("/");
    const activeFilters = searchSourceFilters(section, filter, term);
    const serverFilters = activeFilters.filter(type => type !== "setting");
    const includeContacts = section === "chats" && filter === null && !isFilterInput;
    const slashMatches = isFilterInput ? searchTabFilters[section].filter(type =>
        type.startsWith(term.slice(1).toLowerCase())) : [];
    const settings: SearchResult[] = activeFilters.includes("setting") && !isFilterInput
        ? sections.flatMap(section => section.items.filter(item =>
            matchesSettingSearch(section, item, term.toLowerCase()))
            .map(item => ({
                kind: "setting", id: item.id, label: item.name, description: item.category,
                url: "/settings", settingSection: section.id
            }))).slice(0, 20) : [];
    const requestKey = section + ":" + (filter || "none") + ":" + query;
    const valid = term.length <= 100;
    const moreRequest = useRef<AbortController | null>(null);
    const [items, setItems] = useState<SearchResult[]>([]);
    const [contacts, setContacts] = useState<SearchResult[]>([]);
    const [loadedKey, setLoadedKey] = useState<string | null>(null);
    const [pages, setPages] = useState<Record<string, number>>({});
    const [moreFilters, setMoreFilters] = useState<SearchFilter[]>([]);
    const [moreLoading, setMoreLoading] = useState(false);
    const initialLoading = !isFilterInput && valid && (!!serverFilters.length || includeContacts) &&
        loadedKey !== requestKey;
    const contactIds = new Set(contacts.filter(item => item.description !== "group").map(item => item.id));
    const results = [...contacts, ...items.filter(item =>
        !(section === "chats" && !filter && item.kind === "user" && contactIds.has(item.id))),
        ...settings].sort((a, b) => searchResultRank(section, a) - searchResultRank(section, b));

    useEffect(() => {
        moreRequest.current?.abort();
        setItems([]);
        setContacts([]);
        setPages({});
        setMoreFilters([]);
        setMoreLoading(false);
        setLoadedKey(null);
        if (isFilterInput || !valid || (!serverFilters.length && !includeContacts)) {
            setLoadedKey(requestKey);
            return;
        }
        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            const searches = Promise.all(serverFilters.map(type =>
                api.get("search/global", {
                    params: {
                        q: formatSMSearchQuery(type, term),
                        page: 0,
                        ...(section === "habits" && !term ? { mine_only: "1" } : {})
                    },
                    signal: controller.signal
                }).catch(() => null)
            ));
            const contactSearch = includeContacts ? findContacts(term, controller).catch(() => undefined) :
                Promise.resolve(undefined);
            void Promise.all([searches, contactSearch]).then(([responses, contactRows]) => {
                if (controller.signal.aborted) return;
                const seen = new Set<string>();
                const found: SearchResult[] = [];
                responses.forEach(response => {
                    if (!response?.data?.success) return;
                    (response.data.items || []).forEach((item: SearchResult) => {
                        const key = item.kind + ":" + item.id;
                        if (seen.has(key)) return;
                        seen.add(key);
                        found.push(item);
                    });
                });
                setItems(found);
                setContacts((contactRows || []).map(mapContact));
                setMoreFilters(serverFilters.filter((_, index) => !!responses[index]?.data?.hasMore));
                setLoadedKey(requestKey);
            }).catch(() => {
                if (!controller.signal.aborted) setLoadedKey(requestKey);
            });
        }, term ? 250 : 0);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
            moreRequest.current?.abort();
        };
    }, [query, filter, section]);

    const loadMore = () => {
        if (moreLoading || initialLoading || !moreFilters.length) return;
        setMoreLoading(true);
        moreRequest.current?.abort();
        const controller = new AbortController();
        moreRequest.current = controller;
        const filters = [...moreFilters];
        void Promise.all(filters.map(type => api.get("search/global", {
            params: {
                q: formatSMSearchQuery(type, term),
                page: (pages[type] || 0) + 1,
                ...(section === "habits" && !term ? { mine_only: "1" } : {})
            },
            signal: controller.signal
        }).catch(() => null))).then(responses => {
            if (controller.signal.aborted) return;
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
                filters.forEach((type, index) => {
                    if (responses[index]?.data?.success) next[type] = (next[type] || 0) + 1;
                });
                return next;
            });
            setMoreFilters(filters.filter((_, index) => !!responses[index]?.data?.hasMore));
        }).finally(() => {
            if (!controller.signal.aborted) setMoreLoading(false);
        });
    };
    const open = (item: SearchResult) => {
        if (item.kind === "setting" && item.settingSection) {
            const { pathname, state } = settingsSearchNavigation(item.settingSection, {
                id: item.id,
                name: item.label
            });
            onChoose(item.kind);
            navigate(pathname, { state });
            return;
        }
        onChoose(item.kind);
        navigate(item.url);
    };
    return <div className="SMlist smSearchResults" role="region" aria-label={t("accountNavigation.search")}>
        {isFilterInput ? <>
            <button type="button" className="smSearchFilterSuggestion" onClick={() => onFilterChange(null)}>
                <SMSearchFilterIcon filter={null}/>
                {t("sideMenu.searchFilter.none")}
            </button>
            {slashMatches.map(type => <button type="button" className="smSearchFilterSuggestion" key={type}
                onClick={() => onFilterChange(type)}>
                <SMSearchFilterIcon filter={type}/>
                {t("sideMenu.searchFilter." + type)}
            </button>)}
        </> : <>
            {initialLoading ? <SearchSkeleton/> : <>
                {results.map(item => <button type="button"
                    key={item.kind + ":" + item.id} className="smSearchResult"
                    onClick={() => open(item)}>
                    <SMSearchResultVisual item={item}/>
                    <span className="smSearchResultBody">
                        <span className="smSearchText">{item.label}</span>
                        <span className="smSearchDescription">
                            {item.kind === "contact" ? t("sideMenu.searchContacts") :
                                t("sideMenu.searchFilter." + item.kind)}
                            {item.description ? " · " + (item.description === "group" && item.kind === "contact"
                                ? t("sideMenu.searchFilter.group") : item.description) : ""}
                        </span>
                    </span>
                </button>)}
                {!results.length && <div className="smSearchEmpty">
                    <span className="smSearchEmptyIcon"><MagnifyingGlassMinusIcon size={38}/></span>
                    <span>{t("sideMenu.globalSearchEmpty")}</span>
                    <span className="smSearchEmptyHint">{t("sideMenu.searchEmptyHint")}</span>
                </div>}
            </>}
            {moreLoading && <SearchSkeleton count={2}/>}
            {!initialLoading && moreFilters.length > 0 && <button type="button"
                className="smSearchMore" disabled={moreLoading}
                onClick={loadMore}>{t("sideMenu.globalSearchMore")}</button>}
        </>}
    </div>;
}
