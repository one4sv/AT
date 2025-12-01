import './scss/App.scss';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider } from './components/ts/AppProvider';
import Sign from './pages/Sign';
import Main from './pages/Main/Main';
import Confirm from './pages/Confirm';
import Chat from './pages/Chat/Chat';
import Acc from './pages/Acc/Acc';
import Admin from './pages/Admin';
import HabitPage from './pages/HabitPage/HabitPage';

import Notification from "./components/ts/Notification";
import Blackout from './components/ts/Blackout';
import ThemeHandler from './components/hooks/themeHook';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import ContextMenu from './components/ts/ContextMenu';

function App() {
  return (
    <Router>
      <AppProvider>
        <ThemeHandler />
        <Notification />
        <Blackout />
        <ContextMenu/>
        <Routes>
          <Route path="/sign" element={<Sign />} />
          {window.location.hostname === "localhost" && (
            <Route path="/admin" element={<Admin />} />
          )}
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/" element={<ResponsiveLayout />}>
            <Route index element={<Main />} />
            <Route path="habit" element={<HabitPage />} />
            <Route path="habit/:habitId" element={<HabitPage />} />
            <Route path="chat/:nick" element={<Chat />} />
            <Route path="acc/:nick" element={<Acc />} />
            <Route path="acc" element={<Acc />} />
          </Route>
        </Routes>
      </AppProvider>
    </Router>
  );
}

export default App;
