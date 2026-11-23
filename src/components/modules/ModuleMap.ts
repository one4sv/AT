import { lazy, type ComponentType } from "react";

// Load each dialog only when it is requested.
const ModuleMap: Record<string, ComponentType> = {
    ConfirmAction: lazy(() => import("./ConfirmAction")),
    AccountSecurityAction: lazy(() => import("./AccountSecurityAction")),
    HabitParticipantPicker: lazy(() => import("./HabitParticipantPicker")),
    HabitCreateChat: lazy(() => import("./HabitCreateChat")),
    AddHabit: lazy(() => import("./AddHabit")),
    AddPlan: lazy(() => import("./AddPlan")),
    HabitOverviewList: lazy(() => import("./HabitOverviewList")),
    Delete: lazy(() => import("./DeleteConfirm")),
    PickHandler: lazy(() => import("./PickHandler").then(module => ({ default: module.PickHandler }))),
    BgHandler: lazy(() => import("./BgHandler").then(module => ({ default: module.BgHandler }))),
    ImgPrev: lazy(() => import("./ImgPrev")),
    Redirecting: lazy(() => import("./Redirecting")),
    RedirectMesses: lazy(() => import("./RedirectMesses")),
    CreateChat: lazy(() => import("./CreateChat")),
    PermissionsSettings: lazy(() => import("./PermissionsSettings")),
    ShareAcc: lazy(() => import("./ShareAcc")),
    LinkConfirm: lazy(() => import("./LinkConfirm")),
    ChatWithInfo: lazy(() => import("./ChatWithInfo")),
    PostSettings: lazy(() => import("./PostSettings")),
    HabitCollaborationSettings: lazy(() => import("./HabitCollaborationSettings")),
    HabitDayActivityHistory: lazy(() => import("./HabitDayActivityHistory")),
    HabitTaskEditor: lazy(() => import("./HabitTaskEditor")),
    WelcomeMessageInfo: lazy(() => import("./WelcomeMessageInfo")),
    QuickActionPicker: lazy(() => import("./QuickActionPicker")),
    BackgroundLibrary: lazy(() => import("./BackgroundLibrary")),
    BackgroundFullscreen: lazy(() => import("./BackgroundFullscreen")),
    BackgroundHelp: lazy(() => import("./BackgroundHelp")),
    PushInstallHelp: lazy(() => import("./PushInstallHelp")),
    FeedbackModal: lazy(() => import("./FeedbackModal")),
    WallpaperSettings: lazy(() => import("./WallpaperSettings")),
    CustomThemeColor: lazy(() => import("./CustomThemeColor")),
    Table: lazy(() => import("./Table")),
};

export default ModuleMap;
