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


// The background upload endpoint permits 25 MB, but chat attachments permit 10 MB.
// Keep the original bytes whenever possible; only re-encode oversized images.
export async function fitWallpaperForChat(file: File): Promise<File> {
    const max = 10 * 1024 * 1024;
    if (file.size <= max) return file;
    if (file.type === "image/gif") throw new Error("Oversized animated wallpaper");
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas unavailable");
        for (const edge of [2560, 2048, 1600, 1280]) {
            const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight));
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", .9));
            if (blob && blob.type === "image/webp" && blob.size <= max) return new File([blob], "wallpaper.webp", { type: blob.type });
        }
        throw new Error("Wallpaper too large for chat");
    } finally { URL.revokeObjectURL(url); }
}
