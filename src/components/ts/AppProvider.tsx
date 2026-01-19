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
import { SendMessProvider } from '../context/SendMessContext';
import { GroupProvider } from '../context/GroupContext';

export const AppProvider = ({ children }:{ children:React.ReactNode }) => (
    <NoteProvider>
        <UserProvider>
            <SettingsProvider>
                <UpdateSettingsProvider>
                    <HabitsProvider>
                        <ChatProvider>
                            <SendMessProvider>
                                <UpdateHabitProvider>
                                    <UpdateUserProvider>
                                        <AuthProvider>
                                            <AccProvider>
                                                <GroupProvider>
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
                                                </GroupProvider>
                                            </AccProvider>
                                        </AuthProvider>
                                    </UpdateUserProvider>
                                </UpdateHabitProvider>
                            </SendMessProvider>
                        </ChatProvider>
                    </HabitsProvider>
                </UpdateSettingsProvider>
            </SettingsProvider>
        </UserProvider>
    </NoteProvider>
)