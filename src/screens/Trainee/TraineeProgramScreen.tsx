import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Play, Dumbbell } from 'lucide-react';

export default function TraineeProgramScreen() {
  const { currentUser, fetchAssignedProgram } = useApp();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    fetchAssignedProgram(currentUser.id)
      .then((p) => setProgram(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) return null;
  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  if (!program) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Program</h1>
        <Card className="text-center py-8">
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-400">No program assigned yet</p>
          <p className="text-xs text-gray-400 mt-1">Ask your trainer to assign one</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
        <p className="text-sm text-gray-500">{program.description}</p>
      </div>

      <div className="space-y-3">
        {program.workouts.map((workout: any) => (
          <Card key={workout.id}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{workout.name}</h3>
                <p className="text-xs text-gray-500">{workout.exercises.length} exercises</p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/workout/${workout.id}`)}
              >
                <Play className="w-3.5 h-3.5 mr-1" /> Start
              </Button>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
              {workout.exercises.map((ex: any) => (
                <div key={ex.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-600">{ex.name}</span>
                  <span className="text-xs text-gray-400">
                    {ex.sets}×{ex.targetReps} @ {ex.targetWeight}lbs
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
