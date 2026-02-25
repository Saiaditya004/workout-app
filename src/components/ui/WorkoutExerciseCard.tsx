import React, { useState } from 'react';
import type { Exercise } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface WorkoutExerciseCardProps {
  exercise: Exercise;
  onSaveSet: (exerciseId: string, setIndex: number, reps: number, weight: number) => void;
}

export default function WorkoutExerciseCard({ exercise, onSaveSet }: WorkoutExerciseCardProps) {
  const [setData, setSetData] = useState<{ reps: string; weight: string; saved: boolean }[]>(
    Array.from({ length: exercise.sets }, () => ({
      reps: '',
      weight: '',
      saved: false,
    }))
  );

  const handleSave = (idx: number) => {
    const reps = parseInt(setData[idx].reps) || 0;
    const weight = parseFloat(setData[idx].weight) || 0;
    onSaveSet(exercise.id, idx, reps, weight);
    setSetData((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, saved: true } : s))
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900">{exercise.name}</h3>
        <p className="text-xs text-gray-500">
          Target: {exercise.sets} × {exercise.targetReps} reps @ {exercise.targetWeight} lbs
        </p>
      </div>
      <div className="space-y-2">
        {setData.map((s, idx) => (
          <div key={idx} className="flex items-end gap-2">
            <span className="text-xs font-medium text-gray-400 w-8 pb-2.5">
              S{idx + 1}
            </span>
            <div className="flex-1">
              <Input
                placeholder="Reps"
                type="number"
                value={s.reps}
                onChange={(e) =>
                  setSetData((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, reps: e.target.value } : item))
                  )
                }
                disabled={s.saved}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Weight"
                type="number"
                value={s.weight}
                onChange={(e) =>
                  setSetData((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, weight: e.target.value } : item))
                  )
                }
                disabled={s.saved}
              />
            </div>
            <Button
              size="sm"
              variant={s.saved ? 'secondary' : 'primary'}
              onClick={() => handleSave(idx)}
              disabled={s.saved}
            >
              {s.saved ? '✓' : 'Save'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
