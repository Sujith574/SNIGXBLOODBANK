import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('donor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      await register({ name, email, password, role });
      setSuccessMsg('Registration successful. Please verify your email.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md p-6 rounded-xl border bg-white dark:bg-slate-900">
        <h1 className="text-2xl font-bold">Register</h1>
        <p className="mt-2 opacity-70">Create your account.</p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm font-medium">Name (optional)</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Role</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="admin">Admin</option>
              <option value="donor">Donor</option>
              <option value="hospital">Hospital</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <div className="text-xs opacity-70 mt-1">
              Must be 8+ chars with uppercase, lowercase, number, and special character.
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
          {successMsg && (
            <div className="rounded-md bg-green-50 text-green-700 px-3 py-2 text-sm">{successMsg}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black text-white py-2 font-semibold disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-sm opacity-80">
          Already have an account?{' '}
          <button type="button" className="underline" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}





