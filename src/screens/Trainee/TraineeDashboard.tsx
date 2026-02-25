import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import LeaderboardTable from '../../components/ui/LeaderboardTable';
import { Flame, Play } from 'lucide-react';

export default function TraineeDashboard() {
  const { currentUser, fetchStreak, fetchTasks, fetchAssignedProgram, fetchLeaderboard } = useApp();
  const navigate = useNavigate();

  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0 });
  const [tasks, setTasks] = useState<any[]>([]);
  const [program, setProgram] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      try {
        const [s, t, p, lb] = await Promise.all([
          fetchStreak(currentUser!.id),
          fetchTasks(),
          fetchAssignedProgram(currentUser!.id),
          fetchLeaderboard(),
        ]);
        setStreak(s);
        setTasks(t);
        setProgram(p);
        setLeaderboard(lb);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser, fetchStreak, fetchTasks, fetchAssignedProgram, fetchLeaderboard]);

  if (!currentUser) return null;
  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hi, {currentUser.name.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500">Let's crush today's workout</p>
      </div>

      <Card className="text-center py-8 bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100">
        <div className="text-6xl font-black text-orange-500">{streak.currentStreak}</div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-sm font-medium text-orange-600">Week Streak</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Longest: {streak.longestStreak} weeks</p>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Weekly Tasks</h2>
        {tasks.length > 0 ? (
          tasks.map((task: any) => (
            <Card key={task.id} className="mb-2">
              <ProgressBar value={task.progress} max={task.targetCount} label={task.title} />
              {task.completed ? (
                <p className="text-xs text-green-600 font-medium mt-2">✓ Completed!</p>
              ) : null}
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-sm text-gray-400">No tasks this week</p>
          </Card>
        )}
      </div>

      {program && program.workouts && program.workouts.length > 0 && (
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate(`/workout/${program.workouts[0].id}`)}
        >
          <Play className="w-5 h-5 mr-2" /> Start Today's Workout
        </Button>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
          <button
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            onClick={() => navigate('/leaderboard')}
          >
            See All
          </button>
        </div>
        <LeaderboardTable entries={leaderboard} highlightId={currentUser.id} limit={3} />
      </div>
    </div>
  );
}
