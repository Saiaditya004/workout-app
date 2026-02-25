import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function TraineeProfile() {
  const { traineeId } = useParams<{ traineeId: string }>();
  const navigate = useNavigate();
  const { fetchUsers, fetchPrograms, fetchAssignedProgram, fetchWorkoutLogs, fetchTraineeTasks, assignProgram } = useApp();

  const [trainee, setTrainee] = useState<any>(null);
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [showProgramPicker, setShowProgramPicker] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!traineeId) return;
    async function load() {
      try {
        const [users, allPrograms, program, workoutLogs, traineeTasks] = await Promise.all([
          fetchUsers(),
          fetchPrograms(),
          fetchAssignedProgram(traineeId!),
          fetchWorkoutLogs(traineeId!),
          fetchTraineeTasks(traineeId!),
        ]);
        setTrainee(users.find((u: any) => u.id === traineeId));
        setPrograms(allPrograms);
        setActiveProgram(program);
        setLogs(workoutLogs);
        setTasks(traineeTasks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [traineeId, fetchUsers, fetchPrograms, fetchAssignedProgram, fetchWorkoutLogs, fetchTraineeTasks]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!trainee) return <p className="text-gray-500 p-4">Trainee not found.</p>;

  const handleAssign = async (programId: string) => {
    await assignProgram(traineeId!, programId);
    const updated = await fetchAssignedProgram(traineeId!);
    setActiveProgram(updated);
    setShowProgramPicker(false);
  };

  return (
    <div className="space-y-6">
      <button
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{trainee.name}</h1>
        <p className="text-sm text-gray-500">Trainee Profile</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-900">Active Program</h2>
          <Button size="sm" variant="ghost" onClick={() => setShowProgramPicker(!showProgramPicker)}>
            Change
          </Button>
        </div>
        {activeProgram ? (
          <div>
            <p className="text-blue-600 font-medium">{activeProgram.name}</p>
            <p className="text-xs text-gray-500">{activeProgram.description}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No program assigned</p>
        )}

        {showProgramPicker && (
          <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
            {programs.map((p: any) => (
              <Button
                key={p.id}
                size="sm"
                variant={activeProgram?.id === p.id ? 'primary' : 'secondary'}
                fullWidth
                onClick={() => handleAssign(p.id)}
              >
                {p.name}
              </Button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Weekly Tasks</h2>
        {tasks.length > 0 ? (
          tasks.map((task: any) => (
            <ProgressBar
              key={task.id}
              value={task.progress}
              max={task.targetCount}
              label={task.title}
            />
          ))
        ) : (
          <p className="text-sm text-gray-400">No tasks assigned</p>
        )}
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Workout History</h2>
        {logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log: any) => (
              <Card key={log.id}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.workoutName || `Workout`}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No workouts logged yet</p>
        )}
      </div>
    </div>
  );
}
