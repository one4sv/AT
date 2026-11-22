/** Keep SideMenu and /settings search navigation identical. */
export function settingsSearchNavigation(sectionId: string, item: { id: string; name: string }) {
    return {
        pathname: item.id === "bg" ? "/wallpapers" :
            item.id === "language" ? "/settings/language" : "/settings/" + sectionId,
        state: {
            from: "/settings",
            settingId: item.id,
            settingName: item.name
        }
    };
}
