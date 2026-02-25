import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Dumbbell } from 'lucide-react';

export default function ProgramListScreen() {
  const { currentUser, fetchPrograms } = useApp();
  const navigate = useNavigate();
  const isTrainer = currentUser?.role === 'trainer';
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrograms()
      .then((p) => setPrograms(p))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500">{programs.length} total</p>
        </div>
        {isTrainer && (
          <Button size="sm" onClick={() => navigate('/programs/create')}>
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {programs.map((program: any) => (
          <Card key={program.id}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Dumbbell className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{program.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{program.description}</p>
                <p className="text-xs text-gray-400 mt-1">{(program.workouts || []).length} workouts</p>
              </div>
            </div>

            {/* Show workouts list */}
            <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
              {(program.workouts || []).map((w: any) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between text-sm py-1.5"
                >
                  <span className="text-gray-700">{w.name}</span>
                  <span className="text-xs text-gray-400">{w.exercises.length} exercises</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {isTrainer && (
        <div className="space-y-3">
          <Button fullWidth variant="secondary" onClick={() => navigate('/tasks/create')}>
            <Plus className="w-4 h-4 mr-1" /> Create Weekly Task
          </Button>
        </div>
      )}
    </div>
  );
}
