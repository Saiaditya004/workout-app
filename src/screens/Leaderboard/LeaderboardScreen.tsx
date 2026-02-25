import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import LeaderboardTable from '../../components/ui/LeaderboardTable';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function LeaderboardScreen() {
  const { currentUser, fetchLeaderboard } = useApp();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard()
      .then((lb) => setLeaderboard(lb))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <button
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-sm text-gray-500">Ranked by current streak</p>
      </div>

      <LeaderboardTable entries={leaderboard} highlightId={currentUser?.id} />
    </div>
  );
}
