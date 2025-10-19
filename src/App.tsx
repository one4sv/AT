import './scss/App.scss'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppProvider  } from './components/ts/AppProvider';
import Sign from './pages/Sign'
import Main from './pages/Main'
import Confirm from './pages/Confirm';
import Chat from './pages/Chat/Chat';
import Acc from './pages/Acc/Acc';
import Admin from './pages/Admin';
import HabitPage from './pages/HabitPage/HabitPage';

import Notification from "./components/ts/Notification";
import Blackout from './components/ts/Blackout';
import MainLayout from './components/layout/MainLayout';
import ThemeHandler from './components/hooks/themeHook';

function App() {
  return (
    <Router>
      <AppProvider>
        <ThemeHandler/>
        <Notification />
        <Blackout/>
        <Routes>
          <Route path="/sign" element={<Sign />} />
            {window.location.hostname === "localhost" && (
              <Route path="/admin" element={<Admin />} />
            )}
          <Route path="/confirm" element={<Confirm />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Main />} />
            <Route path="/habit" element={<HabitPage />} />
            <Route path="/habit/:habitId" element={<HabitPage />} />
            <Route path='/chat/:contactId' element={<Chat />}/>
            <Route path='/acc/:contactId' element={<Acc />}/>
          </Route>
        </Routes>        
      </AppProvider>         
    </Router>
  );
}

export default App;
