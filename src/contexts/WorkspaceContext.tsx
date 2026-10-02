import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

export interface WorkspaceChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  members: string[]; // array of user emails/names
  created_by?: string;
}

export interface WorkspaceMessage {
  id: string;
  channelId: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  attachments?: { type: 'image' | 'file'; url: string; name: string }[];
}

interface WorkspaceContextType {
  channels: WorkspaceChannel[];
  addChannel: (channel: Omit<WorkspaceChannel, 'id'>) => Promise<void>;
  updateChannel: (id: string, updates: Partial<WorkspaceChannel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  addMemberToChannel: (channelId: string, member: string) => Promise<void>;
  messages: WorkspaceMessage[];
  sendMessage: (message: Omit<WorkspaceMessage, 'id' | 'timestamp'>) => Promise<void>;
  loading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const [channels, setChannels] = useState<WorkspaceChannel[]>([]);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Initial Data
  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  // Set up Realtime Subscriptions
  useEffect(() => {
    // Subscribe to new messages
    const messageSubscription = supabase
      .channel('public:workspace_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workspace_messages' }, payload => {
        const newMsg = payload.new;
        const formattedMsg: WorkspaceMessage = {
          id: newMsg.id,
          channelId: newMsg.channel_id,
          sender: newMsg.sender_name,
          avatar: newMsg.sender_avatar || '',
          text: newMsg.text || '',
          isMe: newMsg.sender_name === user?.name,
          attachments: newMsg.attachments || [],
          timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => {
          // Prevent duplicates if we already added it optimistically
          if (prev.find(m => m.id === formattedMsg.id)) return prev;
          return [...prev, formattedMsg];
        });
      })
      .subscribe();

    // Subscribe to channel updates
    const channelSubscription = supabase
      .channel('public:workspace_channels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_channels' }, () => {
        fetchWorkspaceData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      supabase.removeChannel(channelSubscription);
    };
  }, [user]);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      
      // Fetch Channels
      const { data: channelsData, error: channelsError } = await supabase
        .from('workspace_channels')
        .select('*');
        
      if (channelsError) throw channelsError;

      // Fetch Members
      const { data: membersData, error: membersError } = await supabase
        .from('workspace_channel_members')
        .select('*');

      if (membersError) throw membersError;

      // Map channels (deduplicated by normalized name)
      const seenNames = new Set<string>();
      const formattedChannels: WorkspaceChannel[] = [];
      for (const ch of (channelsData || [])) {
        const clean = (ch.name || '').toLowerCase().trim();
        if (!clean || seenNames.has(clean)) continue;
        seenNames.add(clean);
        formattedChannels.push({
          id: ch.id,
          name: clean,
          description: ch.description || '',
          isPrivate: ch.is_private || false,
          created_by: ch.created_by,
          members: (membersData || []).filter(m => m.channel_id === ch.id).map(m => m.user_email)
        });
      }

      // Fetch Messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('workspace_messages')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (messagesError) throw messagesError;

      const formattedMessages: WorkspaceMessage[] = (messagesData || []).map(msg => ({
        id: msg.id,
        channelId: msg.channel_id,
        sender: msg.sender_name,
        avatar: msg.sender_avatar || '',
        text: msg.text || '',
        isMe: msg.sender_name === user?.name,
        attachments: msg.attachments || [],
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

      setChannels(formattedChannels);
      setMessages(formattedMessages);
      
    } catch (error) {
      console.error('Error fetching workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addChannel = async (channel: Omit<WorkspaceChannel, 'id'>) => {
    const id = channel.name.toLowerCase().replace(/\s+/g, '-');
    
    // Optimistic UI update
    const newChannel: WorkspaceChannel = { ...channel, id };
    setChannels(prev => [...prev, newChannel]);

    try {
      await supabase.from('workspace_channels').insert([{
        id,
        name: channel.name,
        description: channel.description,
        is_private: channel.isPrivate
      }]);
      
      // Add initial members if any
      if (channel.members && channel.members.length > 0) {
        const memberInserts = channel.members.map(memberEmail => ({
          channel_id: id,
          user_email: memberEmail
        }));
        await supabase.from('workspace_channel_members').insert(memberInserts);
      }
    } catch (e) {
      console.error('Failed to create channel in DB', e);
    }
  };

  const addMemberToChannel = async (channelId: string, member: string) => {
    // Optimistic UI update
    setChannels(prev => prev.map(ch => {
      if (ch.id === channelId && !ch.members.includes(member)) {
        return { ...ch, members: [...ch.members, member] };
      }
      return ch;
    }));

    try {
      await supabase.from('workspace_channel_members').insert([{
        channel_id: channelId,
        user_email: member
      }]);
    } catch (e) {
      console.error('Failed to add member in DB', e);
    }
  };

  const sendMessage = async (msg: Omit<WorkspaceMessage, 'id' | 'timestamp'>) => {
    // Optimistic UI update
    const tempId = Date.now().toString();
    const newMessage: WorkspaceMessage = {
      ...msg,
      id: tempId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);

    try {
      const { data, error } = await supabase.from('workspace_messages').insert([{
        channel_id: msg.channelId,
        sender_name: msg.sender,
        sender_avatar: msg.avatar,
        text: msg.text,
        attachments: msg.attachments || []
      }]).select().single();
      
      if (error) throw error;
      
      // Update temp id with real UUID
      if (data) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
      }
    } catch (e) {
      console.error('Failed to send message to DB', e);
    }
  };

  const updateChannel = async (id: string, updates: Partial<WorkspaceChannel>) => {
    setChannels(prev => prev.map(c => (c.id === id || c.name === id) ? { ...c, ...updates } : c));
    try {
      await supabase.from('workspace_channels').update({
        ...(updates.name ? { name: updates.name.toLowerCase().trim().replace(/\s+/g, '-') } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.isPrivate !== undefined ? { is_private: updates.isPrivate } : {})
      }).or(`id.eq.${id},name.eq.${id}`);
    } catch (e) {
      console.error('Failed to update channel in DB', e);
    }
  };

  const deleteChannel = async (channelIdOrName: string) => {
    const target = channels.find(c => c.id === channelIdOrName || c.name === channelIdOrName);
    const idToDelete = target ? target.id : channelIdOrName;
    const nameToDelete = target ? target.name : channelIdOrName;

    setChannels(prev => prev.filter(c => c.id !== idToDelete && c.name !== nameToDelete));
    try {
      await supabase.from('workspace_messages').delete().or(`channel_id.eq.${idToDelete},channel_id.eq.${nameToDelete}`);
      await supabase.from('workspace_channels').delete().or(`id.eq.${idToDelete},name.eq.${nameToDelete}`);
    } catch (e) {
      console.error('Failed to delete channel from DB', e);
    }
  };

  return (
    <WorkspaceContext.Provider value={{ channels, addChannel, updateChannel, deleteChannel, addMemberToChannel, messages, sendMessage, loading }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  return context;
}
