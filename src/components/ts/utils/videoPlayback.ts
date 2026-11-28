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
