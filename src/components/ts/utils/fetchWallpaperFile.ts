import { privateAssetUrl } from "./privateAssetUrl";

// Only read images already accessible through the authenticated AT asset route.
// Never place the original gallery URL in a shared message.
export async function fetchWallpaperFile(source: string, bucket: "bgs" | "media"): Promise<File> {
    const url = new URL(privateAssetUrl(source), window.location.origin);
    const pending = bucket === "media" && url.protocol === "blob:" && url.origin === window.location.origin;
    if (!pending && (url.origin !== window.location.origin || !url.pathname.startsWith("/api/private-asset/" + bucket + "/"))) throw new Error("Invalid wallpaper source");
    const response = await fetch(url.href, { credentials: "same-origin", redirect: "error" });
    if (!response.ok) throw new Error("Wallpaper unavailable");
    const max = 25 * 1024 * 1024;
    if (Number(response.headers.get("content-length")) > max) throw new Error("Wallpaper too large");
    const blob = await response.blob();
    const type = blob.type.toLowerCase();
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(type) || !blob.size || blob.size > max) throw new Error("Invalid wallpaper image");
    return new File([blob], "wallpaper." + type.slice(6).replace("jpeg", "jpg"), { type });
}
