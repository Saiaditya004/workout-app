import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { ArrowLeft } from 'lucide-react';

export default function CreateTaskScreen() {
  const { createTask } = useApp();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [targetCount, setTargetCount] = useState('3');
  const [assignAll, setAssignAll] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await createTask({
        title: title.trim(),
        targetCount: parseInt(targetCount) || 1,
        assignAll,
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

      <h1 className="text-2xl font-bold text-gray-900">Create Weekly Task</h1>

      <div className="space-y-4">
        <Input
          label="Task Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Complete 3 workouts this week"
        />
        <Input
          label="Target Workout Count"
          type="number"
          value={targetCount}
          onChange={(e) => setTargetCount(e.target.value)}
          min={1}
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAssignAll(!assignAll)}
            className={`w-10 h-6 rounded-full transition-colors ${assignAll ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${assignAll ? 'translate-x-4.5' : 'translate-x-0.5'}`}
            />
          </button>
          <span className="text-sm text-gray-700">Assign to all trainees</span>
        </div>
      </div>

      <Button fullWidth size="lg" onClick={handleSave} disabled={!title.trim() || saving}>
        {saving ? 'Creating...' : 'Create Task'}
      </Button>
    </div>
  );
}
