import { useOutlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import "../../scss/routeTransition.scss";
import useCompactLayout from "../hooks/utils/useCompactLayout";
import MainLayout from "./MainLayout";
import MobileLayout from "./MobileLayout";
import Skeleton, { type SkeletonType } from "../ts/Skeleton";
import { useUser } from "../hooks/UserHook";
import { useSettings } from "../hooks/SettingsHook";
export default function ResponsiveLayout() {
    const isMobile = useCompactLayout();
    const {
        settingsLoaded,
        layout
    } = useSettings();
    const {
        initialLoading,
        user
    } = useUser();
    const { pathname } = useLocation();
    const outlet = useOutlet();
    const reduced = useReducedMotion();
    const section = pathname.startsWith("/post/") ? pathname : pathname.startsWith("/info") ? "info" : pathname.startsWith("/settings") ? "settings" : "page";
    const type: SkeletonType = pathname.startsWith("/habit") ? "habit" : pathname.startsWith("/chat") ? "chat" : pathname === "/" ? "feed" : "profile";
    const content = initialLoading || !settingsLoaded ? <Skeleton type={type} count={type === "chat" ? 5 : 3} overview={pathname === "/habit"} /> : <AnimatePresence mode="wait">
        <motion.div
            key={`${user.id ?? "guest"}-${section}`}
            className="routeTransition"
            initial={reduced || section === "page" ? false : {
                opacity: 0,
                y: "2vh"
            }}
            animate={{
                opacity: 1,
                y: 0
            }}
            exit={reduced || section === "page" ? {} : {
                opacity: 0,
                y: "-1vh"
            }}
            transition={{
                duration: .2,
                ease: [.22, 1, .36, 1]
            }}
        >
            {outlet}
        </motion.div>
    </AnimatePresence>;
    if (isMobile || layout === "hidden") {
        return (
            <MobileLayout>
                {content}
            </MobileLayout>
        );
    }

    return (
        <MainLayout>
            {content}
        </MainLayout>
    );
}
