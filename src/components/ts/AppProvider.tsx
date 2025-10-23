import type React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { NoteProvider } from "../context/NoteContext";
import { UserProvider } from '../context/UserContext';
import { BlackoutProvider } from '../context/BlackoutContext';
import { HabitsProvider } from '../context/HabitsContext';
import { UpdateSettingsProvider } from '../context/UpdateSettingsContext';
import { ChatProvider } from '../context/ChatContext';
import { SettingsProvider } from '../context/SettingsContext';
import { UpdateHabitProvider } from '../context/UpdateHabitContext';
import { DeleteProvider } from '../context/DeleteContext';
import { UpdateUserProvider } from '../context/UpdateUserContext'
import { DoneProvider } from '../context/DoneContext';;
import { CalendarProvider } from '../context/CalendarContext';
import { TheHabitProvider } from '../context/TheHabitContext';
import { AccProvider } from '../context/AccContext';

export const AppProvider = ({ children }:{ children:React.ReactNode }) => (
    <NoteProvider>
        <UserProvider>
            <SettingsProvider>
                <UpdateSettingsProvider>
                    <HabitsProvider>
                        <ChatProvider>
                            <UpdateHabitProvider>
                                <UpdateUserProvider>
                                    <AuthProvider>
                                        <AccProvider>
                                            <DeleteProvider>
                                                <BlackoutProvider>
                                                    <TheHabitProvider>
                                                        <CalendarProvider>
                                                            <DoneProvider>
                                                                {children}
                                                            </DoneProvider>
                                                        </CalendarProvider>
                                                    </TheHabitProvider>
                                                </BlackoutProvider>
                                            </DeleteProvider>
                                        </AccProvider>
                                    </AuthProvider>
                                </UpdateUserProvider>
                            </UpdateHabitProvider>
                        </ChatProvider>
                    </HabitsProvider>
                </UpdateSettingsProvider>
            </SettingsProvider>
        </UserProvider>
    </NoteProvider>
)