const previewMedia = [
    "img.contextMenuPhoto",
    "img.messageFilePreview",
    "video.messageFilePreview",
    ".chatMediaItem img",
    ".chatMediaItem video"
].join(", ");

export function prepareContextMedia(preview: HTMLElement) {
    for (const media of preview.querySelectorAll<HTMLImageElement | HTMLVideoElement>(previewMedia)) {
        const isImage = media instanceof HTMLImageElement;
        if (!isImage && media.preload === "none") continue;

        const tile = media.closest<HTMLElement>(".messageFile, .chatMediaItem") ??
            media.parentElement?.closest<HTMLElement>(".ContextMenuFocusPreview");
        if (!tile) continue;

        const skeleton = document.createElement("span");
        skeleton.className = "skeletonBlock contextMediaSkeleton";
        skeleton.setAttribute("aria-hidden", "true");
        tile.querySelector(".messageFileSkeleton")?.remove();
        tile.append(skeleton);
        media.classList.add("contextMediaPending");

        const ready = () => {
            skeleton.remove();
            media.classList.remove("contextMediaPending", "messageMediaPending");
        };
        const failed = () => {
            skeleton.classList.remove("skeletonBlock");
            skeleton.classList.add("contextMediaFailed");
        };
        const loaded = () => {
            if (isImage && media.decode) void media.decode().then(ready, failed);
            else ready();
        };
        media.addEventListener(isImage ? "load" : "loadeddata", loaded, { once: true });
        media.addEventListener("error", failed, { once: true });

        if (isImage) {
            media.loading = "eager";
            if (media.complete) {
                if (media.naturalWidth > 0) loaded();
                else failed();
            }
        } else {
            media.preload = "auto";
            if (media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) loaded();
            else if (media.error) failed();
        }
    }
}
