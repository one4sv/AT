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
import { ContextMenuProvider } from '../context/ContextMenuContext';
import { DropProvider } from '../context/DropContext';
import { MessagesProvider } from '../context/MessagesContext';
import { PageTitleProvider } from '../context/PageTitleContext';

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
                                                    <CalendarProvider>
                                                        <TheHabitProvider>
                                                            <DoneProvider>
                                                                <MessagesProvider>
                                                                    <ContextMenuProvider>
                                                                        <DropProvider>
                                                                            <PageTitleProvider>
                                                                                {children}
                                                                            </PageTitleProvider>
                                                                        </DropProvider>
                                                                    </ContextMenuProvider>
                                                                </MessagesProvider>
                                                            </DoneProvider>
                                                        </TheHabitProvider>
                                                    </CalendarProvider>
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