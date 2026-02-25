export type Role = 'trainer' | 'trainee';

export interface User {
  id: string;
  name: string;
  role: Role;
  trainerId?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  targetReps: number;
  targetWeight: number;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface Program {
  id: string;
  name: string;
  description: string;
  workouts: Workout[];
}

export interface ExerciseLog {
  exerciseId: string;
  sets: { reps: number; weight: number }[];
}

export interface WorkoutLog {
  id: string;
  traineeId: string;
  workoutId: string;
  completedAt: string;
  exercisesLogged: ExerciseLog[];
}

export interface Task {
  id: string;
  title: string;
  targetCount: number;
  type: 'weekly';
  progress: number;
  completed: boolean;
  assignedTo: string[]; // trainee ids
}

export interface Streak {
  traineeId: string;
  currentStreak: number;
  longestStreak: number;
}

export interface LeaderboardEntry {
  traineeId: string;
  name: string;
  currentStreak: number;
  workoutsThisWeek: number;
}

export interface TraineeAssignment {
  traineeId: string;
  programId: string;
}
