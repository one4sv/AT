const IDLE_MS = 180;
type ScrollActivity = { last: number; touching: boolean };
const activities = new WeakMap<HTMLElement, ScrollActivity>();

function activity(el: HTMLElement): ScrollActivity {
    let current = activities.get(el);
    if (!current) {
        current = {last: -Infinity, touching: false};
        activities.set(el, current);
    }
    return current;
}

export function markHistoryScroll(el: HTMLElement) {
    activity(el).last = performance.now();
}

export function setHistoryTouching(el: HTMLElement, touching: boolean) {
    const current = activity(el);
    current.touching = touching;
    current.last = performance.now();
}

export function isHistoryMoving(el: HTMLElement) {
    const current = activity(el);
    return current.touching || performance.now() - current.last < IDLE_MS;
}

export function waitForHistoryIdle(el: HTMLElement, signal: AbortSignal): Promise<void> {
    return new Promise(resolve => {
        let timer: number | undefined;
        const finish = () => {
            if (timer !== undefined) window.clearTimeout(timer);
            signal.removeEventListener("abort", finish);
            resolve();
        };
        const check = () => {
            if (signal.aborted || !el.isConnected || !isHistoryMoving(el)) { finish(); return; }
            timer = window.setTimeout(check, 60);
        };
        signal.addEventListener("abort", finish, {once:true});
        check();
    });
}
