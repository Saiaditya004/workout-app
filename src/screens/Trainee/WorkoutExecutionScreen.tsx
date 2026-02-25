import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import WorkoutExerciseCard from '../../components/ui/WorkoutExerciseCard';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { apiGetWorkout } from '../../api/client';

export default function WorkoutExecutionScreen() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { currentUser, logWorkout, fetchTasks, updateTaskProgress } = useApp();
  const [completed, setCompleted] = useState(false);
  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [exerciseData, setExerciseData] = useState<
    Record<string, { reps: number; weight: number }[]>
  >({});

  useEffect(() => {
    if (!workoutId) return;
    async function load() {
      try {
        const w = await apiGetWorkout(workoutId!);
        setWorkout(w);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workoutId]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  if (!workout || !currentUser) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Workout not found.</p>
        <Button variant="secondary" className="mt-3" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const handleSaveSet = (exerciseId: string, setIndex: number, reps: number, weight: number) => {
    setExerciseData((prev) => {
      const existing = prev[exerciseId] ?? [];
      const updated = [...existing];
      updated[setIndex] = { reps, weight };
      return { ...prev, [exerciseId]: updated };
    });
  };

  const handleComplete = async () => {
    const exercisesLogged = Object.entries(exerciseData).map(
      ([exerciseId, sets]) => ({ exerciseId, sets })
    );

    await logWorkout(workout.id, exercisesLogged);

    // Update task progress
    try {
      const tasks = await fetchTasks();
      const incomplete = tasks.find((t: any) => !t.completed);
      if (incomplete) {
        await updateTaskProgress(incomplete.id);
      }
    } catch {}

    setCompleted(true);
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Workout Complete!</h1>
        <p className="text-gray-500 mb-6">Great job finishing {workout.name}</p>
        <Button onClick={() => navigate('/')} fullWidth>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{workout.name}</h1>
        <p className="text-sm text-gray-500">{workout.exercises.length} exercises</p>
      </div>

      <div className="space-y-4">
        {workout.exercises.map((exercise: any) => (
          <WorkoutExerciseCard
            key={exercise.id}
            exercise={exercise}
            onSaveSet={handleSaveSet}
          />
        ))}
      </div>

      <Button fullWidth size="lg" onClick={handleComplete}>
        <CheckCircle className="w-5 h-5 mr-2" /> Complete Workout
      </Button>
    </div>
  );
}
