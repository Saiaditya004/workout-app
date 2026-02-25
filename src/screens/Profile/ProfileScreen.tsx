import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { LogOut, Flame, User, Copy, Check } from 'lucide-react';

function InviteCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center">
        <span className="text-2xl font-mono font-bold tracking-widest text-blue-600">{code}</span>
      </div>
      <button
        onClick={handleCopy}
        className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
      >
        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
      </button>
    </div>
  );
}

export default function ProfileScreen() {
  const { currentUser, logout, fetchStreak, fetchTasks, fetchAssignedProgram, fetchWorkoutLogs } = useApp();
  const [streak, setStreak] = useState<any>(null);
  const [program, setProgram] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logCount, setLogCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'trainee') { setLoading(false); return; }
    async function load() {
      try {
        const [s, t, p, logs] = await Promise.all([
          fetchStreak(currentUser!.id),
          fetchTasks(),
          fetchAssignedProgram(currentUser!.id).catch(() => null),
          fetchWorkoutLogs(currentUser!.id),
        ]);
        setStreak(s);
        setTasks(t);
        setProgram(p);
        setLogCount(logs.length);
      } catch {}
      setLoading(false);
    }
    load();
  }, [currentUser]);

  if (!currentUser) return null;
  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  const isTrainee = currentUser.role === 'trainee';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
          <User className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{currentUser.name}</h1>
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 capitalize">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Trainer invite code */}
      {currentUser.role === 'trainer' && currentUser.inviteCode && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-2">Your Invite Code</h2>
          <p className="text-xs text-gray-500 mb-3">Share this code with your trainees so they can join your team during registration.</p>
          <InviteCodeDisplay code={currentUser.inviteCode} />
        </Card>
      )}

      {isTrainee && (
        <>
          {/* Streak */}
          {streak && (
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{streak.currentStreak}</p>
                <p className="text-xs text-gray-500">Current streak (Longest: {streak.longestStreak})</p>
              </div>
            </Card>
          )}

          {/* Program */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-1">Active Program</h2>
            {program ? (
              <p className="text-sm text-blue-600">{program.name}</p>
            ) : (
              <p className="text-sm text-gray-400">None assigned</p>
            )}
          </Card>

          {/* Tasks */}
          {tasks.length > 0 && (
            <Card>
              <h2 className="font-semibold text-gray-900 mb-3">Weekly Tasks</h2>
              {tasks.map((task: any) => (
                <ProgressBar key={task.id} value={task.progress} max={task.targetCount} label={task.title} />
              ))}
            </Card>
          )}

          {/* Stats */}
          <Card>
            <h2 className="font-semibold text-gray-900 mb-1">Total Workouts Logged</h2>
            <p className="text-2xl font-bold text-gray-900">{logCount}</p>
          </Card>
        </>
      )}

      <Button variant="danger" fullWidth onClick={logout}>
        <LogOut className="w-4 h-4 mr-2" /> Logout
      </Button>
    </div>
  );
}
