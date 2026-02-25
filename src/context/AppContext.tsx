import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  getSession,
  apiGetUsers,
  apiGetPrograms,
  apiCreateProgram,
  apiAssignProgram,
  apiGetAssignedProgram,
  apiLogWorkout,
  apiGetWorkoutLogs,
  apiGetTasks,
  apiGetTraineeTasks,
  apiCreateTask,
  apiUpdateTaskProgress,
  apiGetLeaderboard,
  apiGetStreak,
} from '../api/client';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'trainer' | 'trainee';
  trainerId: string | null;
  inviteCode: string | null;
}

interface AppState {
  currentUser: AppUser | null;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: 'trainer' | 'trainee', inviteCode?: string) => Promise<void>;
  logout: () => void;

  fetchUsers: () => Promise<any[]>;
  fetchPrograms: () => Promise<any[]>;
  createProgram: (data: { name: string; description: string; workouts: any[] }) => Promise<void>;
  assignProgram: (traineeId: string, programId: string) => Promise<void>;
  fetchAssignedProgram: (traineeId: string) => Promise<any>;
  logWorkout: (workoutId: string, exercisesLogged: any[]) => Promise<void>;
  fetchWorkoutLogs: (traineeId: string) => Promise<any[]>;
  fetchTasks: () => Promise<any[]>;
  fetchTraineeTasks: (traineeId: string) => Promise<any[]>;
  createTask: (data: { title: string; targetCount: number; assignAll: boolean }) => Promise<void>;
  updateTaskProgress: (taskId: string) => Promise<{ progress: number; completed: boolean }>;
  fetchLeaderboard: () => Promise<any[]>;
  fetchStreak: (traineeId: string) => Promise<any>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session) {
      setCurrentUser(session.user);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    try {
      const res = await apiLogin(email, password);
      setCurrentUser(res.user);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
      throw err;
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string, role: 'trainer' | 'trainee', inviteCode?: string) => {
      setAuthError(null);
      try {
        const res = await apiRegister(email, password, name, role, inviteCode);
        setCurrentUser(res.user);
      } catch (err: any) {
        setAuthError(err.message || 'Registration failed');
        throw err;
      }
    },
    []
  );

  const logout = useCallback(() => {
    apiLogout();
    setCurrentUser(null);
  }, []);

  const fetchUsers = useCallback(() => apiGetUsers(), []);
  const fetchPrograms = useCallback(() => apiGetPrograms(), []);
  const createProgram = useCallback(async (data: { name: string; description: string; workouts: any[] }) => { await apiCreateProgram(data); }, []);
  const assignProgram = useCallback(async (traineeId: string, programId: string) => { await apiAssignProgram(traineeId, programId); }, []);
  const fetchAssignedProgram = useCallback((traineeId: string) => apiGetAssignedProgram(traineeId), []);
  const logWorkout = useCallback(async (workoutId: string, exercisesLogged: any[]) => { await apiLogWorkout(workoutId, exercisesLogged); }, []);
  const fetchWorkoutLogs = useCallback((traineeId: string) => apiGetWorkoutLogs(traineeId), []);
  const fetchTasks = useCallback(() => apiGetTasks(), []);
  const fetchTraineeTasks = useCallback((traineeId: string) => apiGetTraineeTasks(traineeId), []);
  const createTask = useCallback(async (data: { title: string; targetCount: number; assignAll: boolean }) => { await apiCreateTask(data); }, []);
  const updateTaskProgress = useCallback((taskId: string) => apiUpdateTaskProgress(taskId), []);
  const fetchLeaderboard = useCallback(() => apiGetLeaderboard(), []);
  const fetchStreak = useCallback((traineeId: string) => apiGetStreak(traineeId), []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isLoading,
        authError,
        login,
        register,
        logout,
        fetchUsers,
        fetchPrograms,
        createProgram,
        assignProgram,
        fetchAssignedProgram,
        logWorkout,
        fetchWorkoutLogs,
        fetchTasks,
        fetchTraineeTasks,
        createTask,
        updateTaskProgress,
        fetchLeaderboard,
        fetchStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
