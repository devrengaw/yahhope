import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, User } from './AuthContext';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'leader' | 'member' | 'admin';
  joined_at: string;
  user?: Partial<User>; // populated with user details
}

export interface TeamActivity {
  id: string;
  team_id: string;
  user_id: string;
  action: string;
  target_name: string;
  target_id: string | null;
  created_at: string;
  user?: Partial<User>;
}

interface TeamContextType {
  teams: Team[];
  myTeams: Team[];
  teamMembers: Record<string, TeamMember[]>;
  activities: TeamActivity[];
  loading: boolean;
  createTeam: (name: string, description?: string, color?: string) => Promise<Team | null>;
  addMember: (teamId: string, userId: string, role?: 'leader' | 'member' | 'admin') => Promise<boolean>;
  removeMember: (teamId: string, userId: string) => Promise<boolean>;
  loadTeamDetails: (teamId: string) => Promise<void>;
  logActivity: (teamId: string, action: string, targetName: string, targetId?: string) => Promise<void>;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<Record<string, TeamMember[]>>({});
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Load teams the user has access to
  useEffect(() => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      try {
        if (user.role === 'ADMIN') {
          // Admin can see all teams
          const { data, error } = await supabase.from('workspace_teams').select('*').order('created_at', { ascending: false });
          if (!error && data) setTeams(data);
        } else {
          // Others can see only teams they are members of
          const { data: memberData, error: memberError } = await supabase
            .from('workspace_team_members')
            .select('team_id')
            .eq('user_id', user.id);
            
          if (!memberError && memberData && memberData.length > 0) {
            const teamIds = memberData.map(m => m.team_id);
            const { data, error } = await supabase
              .from('workspace_teams')
              .select('*')
              .in('id', teamIds)
              .order('created_at', { ascending: false });
              
            if (!error && data) setTeams(data);
          } else {
            setTeams([]);
          }
        }
      } catch (err) {
        console.error("Error loading teams:", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Derived state: teams the user is actually a part of (even if admin sees all)
  // For now, we assume if you fetched it, it's in `teams`. 
  // We'll fetch members lazily per team, or we can figure out 'myTeams' by checking membership.
  // As a simplification, `teams` holds what you can see. If you are admin, you see all.

  const createTeam = async (name: string, description?: string, color: string = '#3b82f6') => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('workspace_teams')
      .insert({
        name,
        description,
        color,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating team:", error);
      return null;
    }

    // Auto-add the creator as leader
    if (data) {
      await addMember(data.id, user.id, 'leader');
      setTeams(prev => [data, ...prev]);
    }
    
    return data;
  };

  const addMember = async (teamId: string, userId: string, role: 'leader' | 'member' | 'admin' = 'member') => {
    const { error } = await supabase
      .from('workspace_team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role
      });

    if (error) {
      console.error("Error adding member:", error);
      return false;
    }
    
    await logActivity(teamId, 'adicionou um membro', 'Equipe');
    await loadTeamDetails(teamId); // Reload members
    return true;
  };

  const removeMember = async (teamId: string, userId: string) => {
    const { error } = await supabase
      .from('workspace_team_members')
      .delete()
      .match({ team_id: teamId, user_id: userId });

    if (error) {
      console.error("Error removing member:", error);
      return false;
    }

    await loadTeamDetails(teamId); // Reload members
    return true;
  };

  const loadTeamDetails = async (teamId: string) => {
    // Load members
    const { data: membersData, error: membersError } = await supabase
      .from('workspace_team_members')
      .select('*, user:users(id, name, email, role)')
      .eq('team_id', teamId);
      
    if (!membersError && membersData) {
      // Massage the data
      const formattedMembers = membersData.map((m: any) => ({
        ...m,
        user: m.user
      }));
      setTeamMembers(prev => ({ ...prev, [teamId]: formattedMembers }));
    }

    // Load activities
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('workspace_team_activities')
      .select('*, user:users(id, name, email)')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (!activitiesError && activitiesData) {
      const formattedActivities = activitiesData.map((a: any) => ({
        ...a,
        user: a.user
      }));
      setActivities(formattedActivities);
    }
  };

  const logActivity = async (teamId: string, action: string, targetName: string, targetId?: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('workspace_team_activities')
      .insert({
        team_id: teamId,
        user_id: user.id,
        action,
        target_name: targetName,
        target_id: targetId || null
      });
      
    if (!error) {
      await loadTeamDetails(teamId); // Reload to get new activity
    }
  };

  return (
    <TeamContext.Provider value={{
      teams,
      myTeams: teams, // for now they are the same in scope
      teamMembers,
      activities,
      loading,
      createTeam,
      addMember,
      removeMember,
      loadTeamDetails,
      logActivity
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}
