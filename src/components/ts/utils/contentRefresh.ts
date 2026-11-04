export type ContentRefreshScope = "page" | "chats" | "habits" | "spots" | "user";

export type ContentRefreshEvent = CustomEvent<{
    scope: ContentRefreshScope;
    pathname: string;
}>;

export const CONTENT_REFRESH_EVENT = "at:refresh-content";

export function requestContentRefresh(scope: ContentRefreshScope, pathname = window.location.pathname) {
    window.dispatchEvent(new CustomEvent(CONTENT_REFRESH_EVENT, {
        detail: { scope, pathname }
    }));
}
