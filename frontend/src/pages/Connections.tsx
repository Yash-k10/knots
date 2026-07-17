import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, Users, UserCheck } from 'lucide-react';
import { apiRequest } from '../services/api';

interface User {
  id: number;
  email: string;
}

interface Connection {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: string;
  created_at: string;
}

export default function Connections() {
  const [activeTab, setActiveTab] = useState<'requests' | 'connections' | 'discover'>('requests');
  const [requests, setRequests] = useState<Connection[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqsData, connsData, usersData] = await Promise.all([
        apiRequest<Connection[]>('/connections/me/requests'),
        apiRequest<Connection[]>('/connections/me'),
        apiRequest<User[]>('/users')
      ]);
      setRequests(reqsData);
      setConnections(connsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/accept`, { method: 'PATCH' });
      fetchData(); // Refresh lists
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/reject`, { method: 'PATCH' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConnect = async (userId: number) => {
    try {
      await apiRequest('/connections', {
        method: 'POST',
        body: JSON.stringify({ addressee_id: userId }),
      });
      alert('Request sent!');
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="text-slate-400 p-6 flex items-center justify-center min-h-[50vh]">Loading network data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Users className="w-6 h-6 text-indigo-400" />
          My Network
        </h2>
        <p className="text-slate-400 text-sm">Build relationships with alumni and campus colleagues.</p>
        
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-6 mt-6 border-b border-slate-800 pb-2">
          <button 
            onClick={() => setActiveTab('requests')}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === 'requests' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            Pending Requests ({requests.length})
          </button>
          <button 
            onClick={() => setActiveTab('connections')}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === 'connections' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            My Connections ({connections.length})
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === 'discover' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            Discover People
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PENDING REQUESTS TAB */}
        {activeTab === 'requests' && requests.length === 0 && (
          <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">No pending requests.</div>
        )}
        {activeTab === 'requests' && requests.map((req) => (
          <div key={req.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4 shadow-lg">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 mx-auto text-xl ring-4 ring-slate-900">
              U
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">User #{req.requester_id}</h4>
              <p className="text-xs text-indigo-400 mt-1">Wants to connect</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => handleAccept(req.id)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-md shadow-indigo-900/20"
              >
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
              <button 
                onClick={() => handleReject(req.id)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-xs font-semibold text-white transition-all"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>
        ))}

        {/* MY CONNECTIONS TAB */}
        {activeTab === 'connections' && connections.length === 0 && (
          <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">You don't have any connections yet.</div>
        )}
        {activeTab === 'connections' && connections.map((conn) => (
          <div key={conn.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4 shadow-lg">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-indigo-400 mx-auto text-xl ring-4 ring-slate-900">
              <UserCheck className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                Connection #{conn.requester_id}
              </h4>
              <p className="text-xs text-emerald-400 mt-1">Connected</p>
            </div>
            <div className="pt-2">
              <button className="w-full bg-slate-800 hover:bg-slate-700 py-2 rounded-lg text-xs font-semibold text-white transition-all">
                Send Message
              </button>
            </div>
          </div>
        ))}

        {/* DISCOVER TAB */}
        {activeTab === 'discover' && users.length === 0 && (
          <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">No users found.</div>
        )}
        {activeTab === 'discover' && users.map((user) => (
          <div key={user.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4 shadow-lg hover:border-slate-700 transition-colors">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 mx-auto text-xl ring-4 ring-slate-900">
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white truncate px-2" title={user.email}>{user.email}</h4>
              <p className="text-xs text-slate-500 mt-1">Platform Member</p>
            </div>
            <div className="pt-2">
              <button 
                onClick={() => handleConnect(user.id)}
                className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 py-2 rounded-lg text-xs font-semibold text-white transition-all shadow-md shadow-indigo-900/20"
              >
                <UserPlus className="w-3.5 h-3.5" /> Connect
              </button>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
