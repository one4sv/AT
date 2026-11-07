import { lazy, Suspense } from "react";
import Skeleton from "./components/ts/Skeleton";
import { Background } from "./components/ts/utils/background";
import ResponsiveLayout from "./components/layout/ResponsiveLayout";
import MobileLayout from "./components/layout/MobileLayout";
import './scss/App.scss';
import ConnectionStatus from './components/ts/ConnectionStatus';
import TrustedDevice from './components/ts/TrustedDevice';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from './components/ts/AppProvider';
import Notification from "./components/ts/Notification";
import Blackout from './components/ts/Blackout';
import ThemeHandler from './components/hooks/themeHook';
import ContextMenu from './components/ts/ContextMenu/ContextMenu';
import CookieConsent from './components/ts/CookieConsent';
import { useVisualViewport } from './components/hooks/utils/VisualViewportHook';
const PostEditor = lazy(() => import("./pages/Post/PostEditor"));
const PostPage = lazy(() => import("./pages/Post/PostPage"));
const QrApprove = lazy(() => import("./pages/QrApprove"));
const Main = lazy(() => import("./pages/Main/Main"));
const Chat = lazy(() => import("./pages/Chat/Chat"));
const Acc = lazy(() => import("./pages/Acc/Acc"));
const Admin = lazy(() => import("./pages/Admin"));
const HabitPage = lazy(() => import("./pages/HabitPage/HabitPage"));
const Group = lazy(() => import("./pages/Group/Group"));
const Join = lazy(() => import("./pages/Join"));
const Settings = lazy(() => import("./pages/Settings/Settings"));
const Landing = lazy(() => import("./pages/Landing/Landing"));
const Info = lazy(() => import("./pages/Info/Info"));
const Language = lazy(() => import("./pages/Settings/Language"));
const WallpaperStudio = lazy(() => import("./pages/WallpaperStudio/WallpaperStudio"));
const PasswordAccess = lazy(() => import("./pages/Settings/PasswordAccess"));
const AuthorizedDevices = lazy(() => import("./pages/Settings/AuthorizedDevices"));

function App() {
    useVisualViewport();

    return (
        <Router>
            <AppProvider>
                <ThemeHandler />
                <ConnectionStatus />
                <TrustedDevice />
                <CookieConsent />
                <Notification />
                <Blackout />
                <ContextMenu />
                <Suspense fallback={<div className="appRoutePending" role="status" aria-busy="true"><Background/><Skeleton type="feed" count={3}/></div>}>
                <Routes>
                    <Route path="/auth/qr" element={<QrApprove />} />
                    <Route path="/connection" element={<ConnectionStatus standalone />} />
                    <Route path="/sign" element={<Landing />} />
                    <Route path="/settings/language" element={<Language />} />
                    <Route path="/reset-password" element={<PasswordAccess />} />
                    <Route path="/settings/password" element={<PasswordAccess />} />
                    <Route path="/settings/devices" element={<AuthorizedDevices />} />
                    {window.location.hostname === "localhost" && <Route path="/admin" element={<Admin />} />}
                    <Route path="/wallpapers/:tab?" element={<MobileLayout><Suspense fallback={<Skeleton type="feed" count={3}/>}><WallpaperStudio/></Suspense></MobileLayout>}/>
                    <Route path="/" element={<ResponsiveLayout />}>
                        <Route index element={<Main />} />
                        <Route path="post/new" element={<PostEditor />} />
                        <Route path="post/:postId/edit" element={<PostEditor />} />
                        <Route path="post/:postId" element={<PostPage />} />
                        <Route path="habit" element={<HabitPage />} />
                        <Route path="habit/:habitId" element={<HabitPage />} />
                        <Route path="chat/:nick" element={<Chat />} />
                        <Route path="chat/g/:id" element={<Chat />} />
                        <Route path="acc/:nick" element={<Acc />} />
                        <Route path="room/:id" element={<Group />} />
                        <Route path="join/:token" element={<Join />} />
                        <Route path="acc" element={<Acc />} />
                        <Route path="settings/:tab?" element={<Settings />} />
                        <Route path="info/:tab?" element={<Info />} />
                    </Route>
                </Routes>
                </Suspense>
            </AppProvider>
        </Router>
    );
}
export default App;
