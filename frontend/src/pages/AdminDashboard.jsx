import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Shield,
  Layers,
  Trophy,
  Swords,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';
import api from '../services/api';
import GlassCard from '../components/common/GlassCard';
import NeonButton from '../components/common/NeonButton';
import Badge from '../components/common/Badge';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const fetchAdminData = async () => {
    try {
      const [metRes, usrRes, logRes] = await Promise.all([
        api.get('/admin/metrics'),
        api.get('/admin/users'),
        api.get('/admin/logs'),
      ]);
      setMetrics(metRes.data);
      setUsers(usrRes.data.users || []);
      setLogs(logRes.data.logs || []);
    } catch (err) {
      console.error('Failed to load admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/admin/users/${userId}/toggle-status`);
      setMessage(res.data.message);
      fetchAdminData();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-8">
      {/* Admin Top Header */}
      <GlassCard className="p-8 border-neon-pink/30 shadow-glow-pink flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-neon-pink/20 border border-neon-pink/40 flex items-center justify-center text-neon-pink">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-black font-heading text-white">ADMIN COMMAND CENTER</h1>
              <Badge variant="pink">Superuser</Badge>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">Platform telemetry, account security, and active session controls.</p>
          </div>
        </div>
      </GlassCard>

      {message && (
        <div className="p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Registered Users', value: metrics.total_users, icon: Users, color: 'text-neon-blue' },
            { label: 'Active Students', value: metrics.total_students, icon: Trophy, color: 'text-neon-cyan' },
            { label: 'Teacher Creators', value: metrics.total_teachers, icon: Layers, color: 'text-neon-purple' },
            { label: 'Completed Battles', value: metrics.completed_games, icon: Swords, color: 'text-neon-amber' },
          ].map((m, i) => (
            <GlassCard key={i} className="p-5">
              <m.icon className={`w-5 h-5 mb-2 ${m.color}`} />
              <div className="text-3xl font-bold font-heading text-white">{m.value}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 uppercase">{m.label}</div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* User Management Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-heading text-white">USER DIRECTORY & ACCESS CONTROL</h2>
        <GlassCard className="p-0 overflow-hidden border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/80 border-b border-white/10 text-xs uppercase font-mono text-slate-400">
                <tr>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Registered</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-lg bg-surface" />
                      <div>
                        <p className="font-bold text-white text-xs sm:text-sm">{u.full_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={u.role === 'admin' ? 'pink' : u.role === 'teacher' ? 'purple' : 'blue'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${
                        u.is_active ? 'text-neon-emerald' : 'text-neon-pink'
                      }`}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                            u.is_active
                              ? 'bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20'
                              : 'bg-neon-emerald/10 text-neon-emerald hover:bg-neon-emerald/20'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Activity Logs Stream */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold font-heading text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-cyan" /> PLATFORM AUDIT STREAM
        </h2>
        <GlassCard className="p-4 border-white/10 max-h-72 overflow-y-auto space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="p-2.5 rounded-lg bg-surface/50 border border-white/5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-neon-blue font-bold">[{log.action}]</span>
                <span className="text-slate-300">{log.user_email}</span>
              </div>
              <span className="text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminDashboard;

