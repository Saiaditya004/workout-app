import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Dumbbell } from 'lucide-react';

export default function LoginScreen() {
  const { login, register, authError } = useApp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'trainer' | 'trainee'>('trainee');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name, role, role === 'trainee' ? inviteCode : undefined);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-6">
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-2">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">FitCoach</h1>
        <p className="text-gray-500 text-sm">Your personal fitness platform</p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-full max-w-xs">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setMode('register')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        {mode === 'register' && (
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        )}
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />

        {mode === 'register' && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-600">Role</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('trainee')}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
                    role === 'trainee' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  Trainee
                </button>
                <button
                  type="button"
                  onClick={() => setRole('trainer')}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl border transition-colors ${
                    role === 'trainer' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  Trainer
                </button>
              </div>
            </div>

            {role === 'trainee' && (
              <Input
                label="Trainer Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3"
                required
                maxLength={6}
              />
            )}
          </>
        )}

        {(error || authError) && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error || authError}</p>
        )}

        <Button fullWidth size="lg" type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>
    </div>
  );
}
