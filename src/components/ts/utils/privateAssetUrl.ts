// Migrate historic public custom wallpapers to the authenticated AT endpoint.
// A selected image can still be in the user's localStorage from before migration.
export function privateAssetUrl(value: string): string {
    if (!value || value.startsWith("/api/private-asset/")) return value;
    try {
        const url = new URL(value);
        if (!url.hostname.endsWith(".supabase.co")) return value;
        const match = /^\/storage\/v1\/object\/public\/(media|bgs)\/(.+)$/.exec(url.pathname);
        if (!match) return value;
        return "/api/private-asset/" + match[1] + "/" + match[2];
    } catch {
        return value;
    }
}
