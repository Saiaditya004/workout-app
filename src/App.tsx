import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import LoginScreen from './screens/Login/LoginScreen';
import TrainerDashboard from './screens/Trainer/TrainerDashboard';
import TraineeProfile from './screens/Trainer/TraineeProfile';
import CreateProgramScreen from './screens/Trainer/CreateProgramScreen';
import CreateTaskScreen from './screens/Trainer/CreateTaskScreen';
import TraineeDashboard from './screens/Trainee/TraineeDashboard';
import TraineeProgramScreen from './screens/Trainee/TraineeProgramScreen';
import WorkoutExecutionScreen from './screens/Trainee/WorkoutExecutionScreen';
import ProgramListScreen from './screens/Programs/ProgramListScreen';
import LeaderboardScreen from './screens/Leaderboard/LeaderboardScreen';
import ProfileScreen from './screens/Profile/ProfileScreen';

function AppRoutes() {
  const { currentUser, isLoading } = useApp();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Routes>
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  const isTrainer = currentUser.role === 'trainer';

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Dashboard */}
        <Route
          path="/"
          element={isTrainer ? <TrainerDashboard /> : <TraineeDashboard />}
        />

        {/* Programs */}
        <Route
          path="/programs"
          element={isTrainer ? <ProgramListScreen /> : <TraineeProgramScreen />}
        />
        <Route path="/programs/create" element={<CreateProgramScreen />} />

        {/* Tasks */}
        <Route path="/tasks/create" element={<CreateTaskScreen />} />

        {/* Trainee profile (trainer view) */}
        <Route path="/trainee/:traineeId" element={<TraineeProfile />} />

        {/* Workout execution (trainee) */}
        <Route path="/workout/:workoutId" element={<WorkoutExecutionScreen />} />

        {/* Leaderboard */}
        <Route path="/leaderboard" element={<LeaderboardScreen />} />

        {/* Profile */}
        <Route path="/profile" element={<ProfileScreen />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
