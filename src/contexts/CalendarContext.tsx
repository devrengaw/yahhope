import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: 'meeting' | 'availability';
  creator_id: string;
  google_event_id?: string;
  microsoft_event_id?: string;
}

export interface CalendarEventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined';
}

export interface CalendarToken {
  id: string;
  provider: 'google' | 'microsoft';
  user_id: string;
}

interface CalendarContextType {
  events: CalendarEvent[];
  attendees: CalendarEventAttendee[];
  tokens: CalendarToken[];
  loading: boolean;
  createEvent: (event: Omit<CalendarEvent, 'id' | 'creator_id'>, invitedUserIds?: string[]) => Promise<void>;
  updateEventStatus: (event_id: string, status: 'accepted' | 'declined') => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  connectGoogle: () => void;
  connectMicrosoft: () => void;
  disconnectProvider: (provider: 'google' | 'microsoft') => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [attendees, setAttendees] = useState<CalendarEventAttendee[]>([]);
  const [tokens, setTokens] = useState<CalendarToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
      
      const sub = supabase.channel('calendar_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_events' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_event_attendees' }, () => fetchData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_calendar_tokens' }, () => fetchData())
        .subscribe();

      return () => { supabase.removeChannel(sub); };
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEvents, resAttendees, resTokens] = await Promise.all([
        supabase.from('workspace_events').select('*'),
        supabase.from('workspace_event_attendees').select('*'),
        supabase.from('user_calendar_tokens').select('id, provider, user_id').eq('user_id', user?.id)
      ]);

      if (resEvents.data) setEvents(resEvents.data);
      if (resAttendees.data) setAttendees(resAttendees.data);
      if (resTokens.data) setTokens(resTokens.data);
    } catch (e) {
      console.error('Error fetching calendar data', e);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'creator_id'>, invitedUserIds: string[] = []) => {
    if (!user) return;
    
    // Create event
    const { data: newEvent, error } = await supabase.from('workspace_events')
      .insert([{ ...eventData, creator_id: user.id }])
      .select()
      .single();
      
    if (error) {
      console.error(error);
      return;
    }

    // Create attendees
    if (newEvent && invitedUserIds.length > 0) {
      const attendeesToInsert = invitedUserIds.map(uid => ({
        event_id: newEvent.id,
        user_id: uid,
        status: 'pending'
      }));
      await supabase.from('workspace_event_attendees').insert(attendeesToInsert);
    }
    
    fetchData();
  };

  const updateEventStatus = async (event_id: string, status: 'accepted' | 'declined') => {
    if (!user) return;
    await supabase.from('workspace_event_attendees')
      .update({ status })
      .eq('event_id', event_id)
      .eq('user_id', user.id);
    fetchData();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from('workspace_events').delete().eq('id', id);
    fetchData();
  };

  const connectGoogle = () => {
    alert("Redirecionando para o fluxo de OAuth do Google... (Funcionalidade Placeholder)");
    // Here we would window.location.href = to the Google OAuth URL.
  };

  const connectMicrosoft = () => {
    alert("Redirecionando para o fluxo de OAuth da Microsoft... (Funcionalidade Placeholder)");
    // Here we would window.location.href = to the Microsoft OAuth URL.
  };

  const disconnectProvider = async (provider: 'google' | 'microsoft') => {
    if (!user) return;
    await supabase.from('user_calendar_tokens').delete().eq('user_id', user.id).eq('provider', provider);
    fetchData();
  };

  return (
    <CalendarContext.Provider value={{
      events, attendees, tokens, loading,
      createEvent, updateEventStatus, deleteEvent,
      connectGoogle, connectMicrosoft, disconnectProvider
    }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (!context) throw new Error('useCalendar must be used within CalendarProvider');
  return context;
}
