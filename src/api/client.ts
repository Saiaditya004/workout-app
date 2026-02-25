const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('fitcoach_token');
}

function setToken(token: string) {
  localStorage.setItem('fitcoach_token', token);
}

function clearToken() {
  localStorage.removeItem('fitcoach_token');
  localStorage.removeItem('fitcoach_user');
}

function getStoredUser() {
  const raw = localStorage.getItem('fitcoach_user');
  return raw ? JSON.parse(raw) : null;
}

function setStoredUser(user: any) {
  localStorage.setItem('fitcoach_user', JSON.stringify(user));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json();
}

// --- Auth ---

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'trainer' | 'trainee';
    trainerId: string | null;
    inviteCode: string | null;
  };
}

export async function apiLogin(email: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function apiRegister(
  email: string,
  password: string,
  name: string,
  role: 'trainer' | 'trainee',
  inviteCode?: string
): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name, role, inviteCode }),
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function apiGetMe() {
  return request<{ user: AuthResponse['user'] }>('/auth/me');
}

export function apiLogout() {
  clearToken();
}

export function getSession() {
  const token = getToken();
  const user = getStoredUser();
  return token && user ? { token, user } : null;
}

// --- Users ---

export async function apiGetUsers() {
  return request<any[]>('/users');
}

export async function apiGetUser(id: string) {
  return request<any>(`/users/${id}`);
}

// --- Programs ---

export async function apiGetPrograms() {
  return request<any[]>('/programs');
}

export async function apiCreateProgram(data: {
  name: string;
  description: string;
  workouts: any[];
}) {
  return request<{ id: string }>('/programs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiAssignProgram(traineeId: string, programId: string) {
  return request('/programs/assign', {
    method: 'PUT',
    body: JSON.stringify({ traineeId, programId }),
  });
}

export async function apiGetAssignedProgram(traineeId: string) {
  return request<any>(`/programs/assigned/${traineeId}`);
}

// --- Workouts ---

export async function apiGetWorkout(workoutId: string) {
  return request<any>(`/workouts/${workoutId}`);
}

export async function apiLogWorkout(workoutId: string, exercisesLogged: any[]) {
  return request<{ id: string }>('/workouts/log', {
    method: 'POST',
    body: JSON.stringify({ workoutId, exercisesLogged }),
  });
}

export async function apiGetWorkoutLogs(traineeId: string) {
  return request<any[]>(`/workouts/logs/${traineeId}`);
}

// --- Tasks ---

export async function apiGetTasks() {
  return request<any[]>('/tasks');
}

export async function apiGetTraineeTasks(traineeId: string) {
  return request<any[]>(`/tasks/trainee/${traineeId}`);
}

export async function apiCreateTask(data: {
  title: string;
  targetCount: number;
  assignAll: boolean;
}) {
  return request<{ id: string }>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateTaskProgress(taskId: string) {
  return request<{ progress: number; completed: boolean }>(`/tasks/${taskId}/progress`, {
    method: 'PUT',
  });
}

// --- Leaderboard ---

export async function apiGetLeaderboard() {
  return request<any[]>('/leaderboard');
}

export async function apiGetStreak(traineeId: string) {
  return request<any>(`/leaderboard/streak/${traineeId}`);
}
