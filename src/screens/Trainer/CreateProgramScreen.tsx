import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface WorkoutDraft {
  key: string;
  name: string;
  exercises: ExerciseDraft[];
}

interface ExerciseDraft {
  key: string;
  name: string;
  sets: number;
  targetReps: number;
  targetWeight: number;
}

let counter = 100;
const uid = () => `draft-${counter++}`;

export default function CreateProgramScreen() {
  const { createProgram } = useApp();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workouts, setWorkouts] = useState<WorkoutDraft[]>([]);

  const addWorkout = () => {
    setWorkouts((prev) => [
      ...prev,
      { key: uid(), name: '', exercises: [] },
    ]);
  };

  const updateWorkoutName = (wIdx: number, val: string) => {
    setWorkouts((prev) =>
      prev.map((w, i) => (i === wIdx ? { ...w, name: val } : w))
    );
  };

  const removeWorkout = (wIdx: number) => {
    setWorkouts((prev) => prev.filter((_, i) => i !== wIdx));
  };

  const addExercise = (wIdx: number) => {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === wIdx
          ? {
              ...w,
              exercises: [
                ...w.exercises,
                { key: uid(), name: '', sets: 3, targetReps: 10, targetWeight: 0 },
              ],
            }
          : w
      )
    );
  };

  const updateExercise = (wIdx: number, eIdx: number, field: keyof ExerciseDraft, val: string | number) => {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === wIdx
          ? {
              ...w,
              exercises: w.exercises.map((e, j) =>
                j === eIdx ? { ...e, [field]: val } : e
              ),
            }
          : w
      )
    );
  };

  const removeExercise = (wIdx: number, eIdx: number) => {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === wIdx
          ? { ...w, exercises: w.exercises.filter((_, j) => j !== eIdx) }
          : w
      )
    );
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await createProgram({
        name: name.trim(),
        description: description.trim(),
        workouts: workouts.map((w) => ({
          name: w.name,
          exercises: w.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets,
            targetReps: ex.targetReps,
            targetWeight: ex.targetWeight,
          })),
        })),
      });
      navigate(-1);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold text-gray-900">Create Program</h1>

      <div className="space-y-4">
        <Input label="Program Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Strength 101" />
        <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Workouts</h2>
          <Button size="sm" variant="secondary" onClick={addWorkout}>
            <Plus className="w-4 h-4 mr-1" /> Add Workout
          </Button>
        </div>

        {workouts.map((workout, wIdx) => (
          <Card key={workout.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Workout name"
                value={workout.name}
                onChange={(e) => updateWorkoutName(wIdx, e.target.value)}
                className="flex-1"
              />
              <button onClick={() => removeWorkout(wIdx)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {workout.exercises.map((ex, eIdx) => (
              <div key={ex.key} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Exercise name"
                    value={ex.name}
                    onChange={(e) => updateExercise(wIdx, eIdx, 'name', e.target.value)}
                  />
                  <button onClick={() => removeExercise(wIdx, eIdx)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    label="Sets"
                    type="number"
                    value={ex.sets}
                    onChange={(e) => updateExercise(wIdx, eIdx, 'sets', parseInt(e.target.value) || 0)}
                  />
                  <Input
                    label="Reps"
                    type="number"
                    value={ex.targetReps}
                    onChange={(e) => updateExercise(wIdx, eIdx, 'targetReps', parseInt(e.target.value) || 0)}
                  />
                  <Input
                    label="Weight"
                    type="number"
                    value={ex.targetWeight}
                    onChange={(e) => updateExercise(wIdx, eIdx, 'targetWeight', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}

            <Button size="sm" variant="ghost" onClick={() => addExercise(wIdx)}>
              <Plus className="w-4 h-4 mr-1" /> Add Exercise
            </Button>
          </Card>
        ))}
      </div>

      <Button fullWidth size="lg" onClick={handleSave} disabled={!name.trim() || saving}>
        {saving ? 'Saving...' : 'Save Program'}
      </Button>
    </div>
  );
}
