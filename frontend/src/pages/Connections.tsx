import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Sparkles, Send } from 'lucide-react';
import { apiRequest } from '../services/api';
import ConnectionCard from '../components/connections/ConnectionCard';

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

interface ConnectionSuggestion {
  user_id: number;
  email: string;
  mutual_count: number;
  recommendation_reason: string;
  score: number;
}

export default function Connections() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'requests' | 'sent' | 'connections' | 'discover'>('discover');
  const [requests, setRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all network data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqsData, sentData, connsData, suggData, usersData] = await Promise.all([
        apiRequest<Connection[]>('/connections/me/requests').catch(() => []),
        apiRequest<Connection[]>('/connections/me/sent-requests').catch(() => []),
        apiRequest<Connection[]>('/connections/me').catch(() => []),
        apiRequest<ConnectionSuggestion[]>('/connections/suggestions').catch(() => []),
        apiRequest<User[]>('/users').catch(() => [])
      ]);

      setRequests(Array.isArray(reqsData) ? reqsData : []);
      setSentRequests(Array.isArray(sentData) ? sentData : []);
      setConnections(Array.isArray(connsData) ? connsData : []);
      setSuggestions(Array.isArray(suggData) ? suggData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch network data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (tab: 'requests' | 'sent' | 'connections' | 'discover') => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleAccept = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/accept`, { method: 'PATCH' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept connection request');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/reject`, { method: 'PATCH' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to reject connection request');
    }
  };

  const handleWithdraw = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/withdraw`, { method: 'DELETE' });
      setSentRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw connection request');
    }
  };

  const handleConnect = async (userId: number) => {
    try {
      await apiRequest('/connections', {
        method: 'POST',
        body: JSON.stringify({ addressee_id: userId }),
      });
      setSuggestions((prev) => prev.filter((s) => s.user_id !== userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to send connection request');
    }
  };

  const handleSendMessage = (userId: number) => {
    navigate('/messaging', { state: { targetUserId: userId } });
  };

  // Filter items based on search query
  const filteredRequests = requests.filter((req) =>
    req.requester_id.toString().includes(searchQuery.trim())
  );

  const filteredSentRequests = sentRequests.filter((req) =>
    req.addressee_id.toString().includes(searchQuery.trim())
  );

  const filteredConnections = connections.filter((conn) =>
    conn.requester_id.toString().includes(searchQuery.trim()) ||
    conn.addressee_id.toString().includes(searchQuery.trim()) ||
    conn.id.toString().includes(searchQuery.trim())
  );

  const filteredSuggestions = suggestions.filter((sugg) =>
    sugg.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    sugg.recommendation_reason.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
      !suggestions.some((s) => s.user_id === u.id)
  );

  if (loading) {
    return <div className="text-slate-400 p-6 flex items-center justify-center min-h-[50vh]">Loading network data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              My Network
            </h2>
            <p className="text-slate-400 text-sm">Build relationships, connect with peers, and explore smart suggestions.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'discover'
                  ? 'Search suggestions & people by email...'
                  : activeTab === 'requests'
                  ? 'Search pending requests...'
                  : activeTab === 'sent'
                  ? 'Search sent requests...'
                  : 'Search connections...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-12 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-4 border-b border-slate-800 pb-2">
          <button 
            onClick={() => handleTabChange('discover')}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 flex items-center gap-1.5 ${activeTab === 'discover' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Suggestions & Discover ({suggestions.length})
          </button>
          <button 
            onClick={() => handleTabChange('requests')}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === 'requests' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            Pending Requests ({requests.length})
          </button>
          <button 
            onClick={() => handleTabChange('sent')}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 flex items-center gap-1.5 ${activeTab === 'sent' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            <Send className="w-3.5 h-3.5" />
            Sent Requests ({sentRequests.length})
          </button>
          <button 
            onClick={() => handleTabChange('connections')}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === 'connections' ? 'text-indigo-400 border-indigo-400' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            My Connections ({connections.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        
        {/* SUGGESTIONS & DISCOVER TAB */}
        {activeTab === 'discover' && (
          <>
            {filteredSuggestions.length === 0 && filteredUsers.length === 0 ? (
              <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">
                {searchQuery ? 'No suggestions match your search.' : 'No suggestions available right now.'}
              </div>
            ) : (
              <>
                {filteredSuggestions.map((sugg) => (
                  <ConnectionCard
                    key={sugg.user_id}
                    type="discover"
                    id={sugg.user_id}
                    targetId={sugg.user_id}
                    email={sugg.email}
                    subtitle="Suggested for You"
                    mutualCount={sugg.mutual_count}
                    reason={sugg.recommendation_reason}
                    onConnect={handleConnect}
                  />
                ))}
                {filteredUsers.map((user) => (
                  <ConnectionCard
                    key={user.id}
                    type="discover"
                    id={user.id}
                    targetId={user.id}
                    email={user.email}
                    subtitle="Platform Member"
                    onConnect={handleConnect}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* PENDING REQUESTS TAB */}
        {activeTab === 'requests' && (
          <>
            {filteredRequests.length === 0 ? (
              <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">
                {searchQuery ? 'No pending requests match your search.' : 'No incoming pending requests.'}
              </div>
            ) : (
              filteredRequests.map((req) => (
                <ConnectionCard
                  key={req.id}
                  type="request"
                  id={req.id}
                  targetId={req.requester_id}
                  subtitle="Wants to connect"
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            )}
          </>
        )}

        {/* SENT REQUESTS TAB */}
        {activeTab === 'sent' && (
          <>
            {filteredSentRequests.length === 0 ? (
              <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">
                {searchQuery ? 'No sent requests match your search.' : 'No outgoing sent requests.'}
              </div>
            ) : (
              filteredSentRequests.map((req) => (
                <ConnectionCard
                  key={req.id}
                  type="sent"
                  id={req.id}
                  targetId={req.addressee_id}
                  subtitle="Pending Request Sent"
                  onWithdraw={handleWithdraw}
                />
              ))
            )}
          </>
        )}

        {/* MY CONNECTIONS TAB */}
        {activeTab === 'connections' && (
          <>
            {filteredConnections.length === 0 ? (
              <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">
                {searchQuery ? 'No connections match your search.' : "You don't have any connections yet."}
              </div>
            ) : (
              filteredConnections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  type="connection"
                  id={conn.id}
                  targetId={conn.requester_id}
                  subtitle="Connected"
                  onMessage={handleSendMessage}
                />
              ))
            )}
          </>
        )}

      </div>
    </div>
  );
}

