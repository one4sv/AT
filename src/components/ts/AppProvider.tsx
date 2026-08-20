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
import { ScheduleProvider } from '../context/ScheduleContext';
import { SideMenuProvider } from '../context/SideMenuContext';
import { WebSocketProvider } from '../context/WebSocketContext';
import { PlannedProvider } from '../context/PlannedContext';
import { ContactsProvider } from '../context/ContactsContext';

export const AppProvider = ({ children }:{ children:React.ReactNode }) => (
    <NoteProvider>
        <UserProvider>
            <WebSocketProvider>
                <SettingsProvider>
                    <UpdateSettingsProvider>
                        <HabitsProvider>
                            <ContactsProvider>
                                <ChatProvider>
                                    <SendMessProvider>
                                        <UpdateUserProvider>
                                            <AuthProvider>
                                                <AccProvider>
                                                    <GroupProvider>
                                                        <DeleteProvider>
                                                            <BlackoutProvider>
                                                                <CalendarProvider>
                                                                    <TheHabitProvider>
                                                                        <UpdateHabitProvider>
                                                                            <DoneProvider>
                                                                                <PlannedProvider>
                                                                                    <MessagesProvider>
                                                                                        <ScheduleProvider>
                                                                                            <ContextMenuProvider>
                                                                                                <DropProvider>
                                                                                                    <PageTitleProvider>
                                                                                                        <SideMenuProvider>
                                                                                                                {children}
                                                                                                        </SideMenuProvider>
                                                                                                    </PageTitleProvider>
                                                                                                </DropProvider>
                                                                                            </ContextMenuProvider>
                                                                                        </ScheduleProvider>
                                                                                    </MessagesProvider>
                                                                                </PlannedProvider>
                                                                            </DoneProvider>
                                                                        </UpdateHabitProvider>
                                                                    </TheHabitProvider>
                                                                </CalendarProvider>
                                                            </BlackoutProvider>
                                                        </DeleteProvider>
                                                    </GroupProvider>
                                                </AccProvider>
                                            </AuthProvider>
                                        </UpdateUserProvider>
                                    </SendMessProvider>
                                </ChatProvider>
                            </ContactsProvider>
                        </HabitsProvider>
                    </UpdateSettingsProvider>
                </SettingsProvider>
            </WebSocketProvider>
        </UserProvider>
    </NoteProvider>
)