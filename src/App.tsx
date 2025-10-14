import './scss/App.scss'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from '../src/components/context/AuthContext';
import { NoteProvider } from "./components/context/NoteContext";
import { UserProvider } from './components/context/UserContext';
import { BlackoutProvider } from './components/context/BlackoutContext';
import { HabitsProvider } from './components/context/HabitsContext';
import { UpdateSettingsProvider } from './components/context/UpdateSettingsContext';
import { ChatProvider } from './components/context/ChatContext';
import { SettingsProvider } from './components/context/SettingsContext';
import { UpdateHabitProvider } from './components/context/UpdateHabitContext';
import { DeleteProvider } from './components/context/DeleteContext';
import { UpdateUserProvider } from './components/context/UpdateUserContext'
import { DoneProvider } from './components/context/DoneContext';;
import { CalendarProvider } from './components/context/CalendarContext';
import { TheHabitProvider } from './components/context/TheHabitContext';

import Sign from './pages/Sign'
import Main from './pages/Main'
import Confirm from './pages/Confirm';
import Chat from './pages/Chat';
import Acc from './pages/Acc';
// import Admin from './pages/Admin';
import HabitPage from './pages/HabitPage';

import Notification from "./components/ts/Notification";
import Blackout from './components/ts/Blackout';
import MainLayout from './components/layout/MainLayout';
import ThemeHandler from './components/hooks/themeHook';

function App() {
  return (
    <Router>
      <NoteProvider>
        <UserProvider>
          <SettingsProvider>
            <UpdateSettingsProvider>
              <HabitsProvider>
                <ChatProvider>
                  <UpdateHabitProvider>
                    <UpdateUserProvider>
                      <AuthProvider>
                        <DeleteProvider>
                          <BlackoutProvider>
                            <TheHabitProvider>
                              <CalendarProvider>
                                <DoneProvider>
                                  <ThemeHandler/>
                                  <Notification />
                                  <Blackout/>
                                  <Routes>
                                    <Route path="/sign" element={<Sign />} />
                                    {/* <Route path="/admin" element={<Admin />} /> */}
                                    <Route path="/confirm" element={<Confirm />} />
                                    <Route element={<MainLayout />}>
                                      <Route path="/" element={<Main />} />
                                      <Route path="/habit" element={<HabitPage />} />
                                      <Route path="/habit/:habitId" element={<HabitPage />} />
                                      <Route path='/chat/:contactId' element={<Chat />}/>
                                      <Route path='/acc/:contactId' element={<Acc />}/>
                                    </Route>
                                  </Routes>
                              </DoneProvider>
                              </CalendarProvider>
                            </TheHabitProvider>
                          </BlackoutProvider>
                        </DeleteProvider>
                      </AuthProvider>
                    </UpdateUserProvider>
                  </UpdateHabitProvider>
                </ChatProvider>
              </HabitsProvider>
            </UpdateSettingsProvider>
          </SettingsProvider>
        </UserProvider>
      </NoteProvider>
    </Router>
  );
}

export default App;
