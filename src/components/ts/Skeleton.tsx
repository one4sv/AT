import "../../scss/Loading.scss";

export type SkeletonType = "list" | "feed" | "habit" | "chat" | "profile";

export default function Skeleton({ type = "list", count = 6, overview = false }: { type?: SkeletonType, count?: number, overview?: boolean }) {
    const rows = Array.from({ length: count }, (_, i) => i);

    return (
        <div className={`skeleton skeleton-${type}${overview ? " skeletonOverview" : ""}`} role="status" aria-label="Загрузка" aria-busy="true">
            {type === "habit" ? (
                <div aria-hidden="true">
                    {!overview && <div className="skeletonPageHeader skeletonCard skeletonRow">
                        <div className="skeletonCircle" />
                        <div className="skeletonText"><div className="skeletonLine skeletonShort" /></div>
                    </div>}
                    <div className="skeletonHabit">
                    <div className="skeletonCard skeletonCalendar">
                        <div className="skeletonLine skeletonTitle" />
                        <div className="skeletonWeek">
                            {Array.from({ length: 7 }, (_, i) => <div className="skeletonCircle" key={i} />)}
                        </div>
                        <div className="skeletonDays">
                            {Array.from({ length: 35 }, (_, i) => <div className="skeletonCircle" key={i} />)}
                        </div>
                    </div>
                    <div className="skeletonCard skeletonMetric">
                        <div className="skeletonLine skeletonTitle" />
                        <div className="skeletonCircle" />
                        <div className="skeletonLine skeletonShort" />
                        <div className="skeletonBlock" />
                    </div>
                    {!overview && <div className="skeletonCard skeletonComment">
                        <div className="skeletonBlock" />
                        <div className="skeletonLine" />
                    </div>}
                    </div>
                    <div className="skeletonCard skeletonStats">
                        <div className="skeletonLine skeletonTitle" />
                        <div className="skeletonStatsGrid">
                            {Array.from({ length: 5 }, (_, i) => <div className="skeletonStat" key={i}>
                                <div className="skeletonLine" />
                                <div className="skeletonLine skeletonShort" />
                                <div className="skeletonBlock" />
                            </div>)}
                        </div>
                    </div>
                </div>
            ) : type === "chat" ? (
                <div className="skeletonChat" aria-hidden="true">
                    <div className="skeletonPageHeader skeletonCard skeletonRow">
                        <div className="skeletonCircle" />
                        <div className="skeletonText">
                            <div className="skeletonLine skeletonShort" />
                        </div>
                        <div className="skeletonCircle" />
                        <div className="skeletonCircle" />
                    </div>
                    <div className="skeletonMessages">
                        {rows.map(i => <div className="skeletonCard skeletonMessage" key={i}>
                            <div className="skeletonLine" />
                            {i % 3 === 0 && <div className="skeletonLine skeletonShort" />}
                            <div className="skeletonLine skeletonTime" />
                        </div>)}
                    </div>
                    <div className="skeletonComposer skeletonRow">
                        <div className="skeletonCard skeletonCircle" />
                        <div className="skeletonCard skeletonInput"><div className="skeletonLine skeletonShort" /></div>
                        <div className="skeletonCard skeletonCircle" />
                    </div>
                </div>
            ) : rows.map(i => (
                <div className="skeletonCard" key={i} aria-hidden="true">
                    <div className="skeletonRow">
                        <div className="skeletonCircle" />
                        <div className="skeletonText">
                            <div className="skeletonLine" />
                            <div className="skeletonLine skeletonShort" />
                        </div>
                    </div>
                    {(type === "feed" || type === "profile") && <div className="skeletonBlock" />}
                </div>
            ))}
        </div>
    );
}
