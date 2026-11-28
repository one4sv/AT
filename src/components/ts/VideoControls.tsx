import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import SeekBar from "../../pages/Settings/components/SeekBar";
import "../../pages/Settings/scss/seekbar.scss";
import "./scss/VideoControls.scss";

export function useDesktopVideoControls() {
    const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 801px) and (pointer: fine)").matches);
    useEffect(() => {
        const query = window.matchMedia("(min-width: 801px) and (pointer: fine)");
        const update = () => setDesktop(query.matches);
        query.addEventListener("change", update);
        update();
        return () => query.removeEventListener("change", update);
    }, []);
    return desktop;
}

const formatTime = (value: number) => {
    const seconds = Math.floor(Number.isFinite(value) ? Math.max(0, value) : 0);
    return Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
};

export default function VideoControls({ videoRef }: { videoRef: RefObject<HTMLVideoElement | null> }) {
    const { t } = useTranslation("common");
    const id = useId();
    const [state, setState] = useState({ paused: true, time: 0, duration: 0, volume: 1, muted: false, rate: 1 });
    const [fullscreen, setFullscreen] = useState(false);
    const lastVolume = useRef(1);
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        const sync = () => setState({
            paused: video.paused, time: video.currentTime || 0,
            duration: Number.isFinite(video.duration) ? video.duration : 0,
            volume: video.volume, muted: video.muted, rate: video.playbackRate
        });
        const events = ["play", "pause", "timeupdate", "loadedmetadata", "durationchange", "volumechange", "ratechange", "ended", "emptied"];
        events.forEach(event => video.addEventListener(event, sync));
        const syncFull = () => setFullscreen(document.fullscreenElement === video.parentElement || document.fullscreenElement === video);
        document.addEventListener("fullscreenchange", syncFull);
        sync();
        return () => {
            events.forEach(event => video.removeEventListener(event, sync));
            document.removeEventListener("fullscreenchange", syncFull);
        };
    }, [videoRef]);

    const toggle = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) void video.play().catch(() => {});
        else video.pause();
    };
    const seek = (value: number) => {
        const video = videoRef.current;
        if (video && Number.isFinite(video.duration)) video.currentTime = Math.max(0, Math.min(video.duration, value));
    };
    const mute = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.muted || video.volume === 0) {
            video.muted = false;
            if (!video.volume) video.volume = lastVolume.current || 1;
        } else {
            lastVolume.current = video.volume;
            video.muted = true;
        }
    };
    const rate = () => {
        const video = videoRef.current;
        if (!video) return;
        const rates = [0.5, 1, 1.25, 1.5, 2];
        video.playbackRate = rates[(rates.indexOf(video.playbackRate) + 1) % rates.length];
    };
    const expand = async () => {
        const video = videoRef.current;
        if (!video) return;
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else if (video.parentElement?.requestFullscreen) await video.parentElement.requestFullscreen();
            else (video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.();
        } catch { /* fullscreen can be denied by the browser */ }
    };
    return <div className={`atVideoControls${state.paused ? " paused" : ""}`} onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()} onTouchStart={event => event.stopPropagation()}>
        <button type="button" className="atVideoCenter" aria-label={t(state.paused ? "video.play" : "video.pause")} onClick={toggle}>
            {state.paused ? <Play fill="currentColor"/> : <Pause fill="currentColor"/>}
        </button>
        <div className="atVideoBottom">
            <div className="atVideoTimeline" role="slider" tabIndex={0} aria-label={t("video.seek")} aria-valuemin={0} aria-valuemax={state.duration} aria-valuenow={Math.min(state.duration, state.time)} onKeyDown={event => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault(); event.stopPropagation(); seek(state.time + (event.key === "ArrowLeft" ? -5 : 5));
            }}>
                <SeekBar id={id + "-time"} min={0} max={state.duration || 1} value={state.time} step={0.1} disabled={!state.duration} onChange={seek}/>
            </div>
            <div className="atVideoActions">
                <button type="button" aria-label={t("video.back")} onClick={() => seek(state.time - 10)}><RotateCcw/><span>10</span></button>
                <button type="button" aria-label={t("video.forward")} onClick={() => seek(state.time + 10)}><RotateCw/><span>10</span></button>
                <span className="atVideoTime">{formatTime(state.time)} / {formatTime(state.duration)}</span>
                <button type="button" aria-label={t(state.muted || !state.volume ? "video.unmute" : "video.mute")} onClick={mute}>{state.muted || !state.volume ? <VolumeX/> : <Volume2/>}</button>
                <div className="atVideoVolume" role="slider" tabIndex={0} aria-label={t("video.volume")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.muted ? 0 : state.volume * 100)} onKeyDown={event => {
                    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                    event.preventDefault(); event.stopPropagation();
                    const video = videoRef.current;
                    if (video) { video.muted = false; video.volume = Math.max(0, Math.min(1, video.volume + (event.key === "ArrowLeft" ? -.1 : .1))); }
                }}><SeekBar id={id + "-volume"} min={0} max={100} value={state.muted ? 0 : state.volume * 100} disabled={false} onChange={value => {
                    const video = videoRef.current;
                    if (video) { video.muted = false; video.volume = value / 100; }
                }}/></div>
                <button type="button" aria-label={t("video.speed")} onClick={rate}>{state.rate}×</button>
                <button type="button" aria-label={t(fullscreen ? "video.exitFullscreen" : "video.fullscreen")} onClick={() => void expand()}>{fullscreen ? <Minimize/> : <Maximize/>}</button>
            </div>
        </div>
    </div>;
}
