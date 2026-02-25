import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import StatBox from '../../components/ui/StatBox';
import Button from '../../components/ui/Button';
import { Users, ClipboardList, Trophy, Flame, Copy, Check } from 'lucide-react';

export default function TrainerDashboard() {
  const { currentUser, fetchUsers, fetchPrograms, fetchTasks } = useApp();
  const navigate = useNavigate();

  const [trainees, setTrainees] = useState<any[]>([]);
  const [programCount, setProgramCount] = useState(0);
  const [taskCompletionPct, setTaskCompletionPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [users, programs, tasks] = await Promise.all([
          fetchUsers(),
          fetchPrograms(),
          fetchTasks(),
        ]);
        setTrainees(users);
        setProgramCount(programs.length);

        // Calculate task completion across all assignments
        const allAssignments = tasks.flatMap((t: any) => t.assignments || []);
        const completedCount = allAssignments.filter((a: any) => a.completed).length;
        const pct = allAssignments.length > 0 ? Math.round((completedCount / allAssignments.length) * 100) : 0;
        setTaskCompletionPct(pct);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchUsers, fetchPrograms, fetchTasks]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, Coach</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBox
          label="Trainees"
          value={trainees.length}
          icon={<Users className="w-4 h-4" />}
        />
        <StatBox
          label="Programs"
          value={programCount}
          icon={<ClipboardList className="w-4 h-4" />}
        />
      </div>

      {/* Invite Code */}
      {currentUser?.inviteCode && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">Share this code with your trainees</p>
              <span className="text-lg font-mono font-bold tracking-widest text-blue-600">{currentUser.inviteCode}</span>
            </div>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(currentUser.inviteCode!);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </Card>
      )}

      <StatBox
        label="Weekly Task Completion"
        value={`${taskCompletionPct}%`}
        icon={<Trophy className="w-4 h-4" />}
      />

      <Button
        variant="secondary"
        fullWidth
        onClick={() => navigate('/leaderboard')}
      >
        <Trophy className="w-4 h-4 mr-2" /> View Leaderboard
      </Button>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Trainees</h2>
        <div className="space-y-3">
          {trainees.map((trainee) => (
            <Card key={trainee.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{trainee.name}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {trainee.currentStreak ?? 0} week streak
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/trainee/${trainee.id}`)}
                >
                  View Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
