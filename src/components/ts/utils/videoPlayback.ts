// iOS Safari needs a tiny media fragment to fetch the first visible frame.
export function videoPreviewSource(src: string, preload: "metadata" | "none") {
    return preload === "metadata" && !src.includes("#") ? src + "#t=0.001" : src;
}

export function pauseVideos(except?: HTMLVideoElement) {
    document.querySelectorAll<HTMLVideoElement>("video").forEach(video => {
        if (video !== except && !video.paused) video.pause();
    });
}

export function installVideoPlaybackGuard() {
    const play = (event: Event) => {
        if (event.target instanceof HTMLVideoElement) pauseVideos(event.target);
    };
    const filePicker = (event: Event) => {
        if (event.target instanceof HTMLInputElement && event.target.type === "file") pauseVideos();
    };
    const hidden = () => { if (document.hidden) pauseVideos(); };
    const pageHide = () => pauseVideos();
    document.addEventListener("play", play, true);
    document.addEventListener("click", filePicker, true);
    document.addEventListener("change", filePicker, true);
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("pagehide", pageHide);
    return () => {
        document.removeEventListener("play", play, true);
        document.removeEventListener("click", filePicker, true);
        document.removeEventListener("change", filePicker, true);
        document.removeEventListener("visibilitychange", hidden);
        window.removeEventListener("pagehide", pageHide);
    };
}

// Store only a small local poster, not a second network asset.
export function firstFramePoster(video: HTMLVideoElement): string | undefined {
    if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return;
    try {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", .8);
    } catch {
        // A cross-origin media resource may not permit canvas readback.
        // The video fragment still requests its first frame.
        return;
    }
}
