import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Users, Search, Sparkles, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiRequest } from '../services/api';
import ConnectionCard from '../components/connections/ConnectionCard';

interface User {
  id: number;
  email: string;
}

interface ConnectionUserProfile {
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  department?: string | null;
}

interface ConnectionUserSummary {
  id: number;
  email: string;
  profile?: ConnectionUserProfile | null;
}

interface Connection {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: string;
  created_at: string;
  requester?: ConnectionUserSummary | null;
  addressee?: ConnectionUserSummary | null;
}

interface ConnectionSuggestion {
  user_id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture?: string | null;
  department?: string | null;
  mutual_count: number;
  recommendation_reason: string;
  score: number;
  profile?: ConnectionUserProfile | null;
}

export default function Connections() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<{ id: number; email: string } | null>(null);

  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'requests' | 'sent' | 'connections' | 'discover'>(() => {
    if (initialTab === 'requests' || initialTab === 'pending') return 'requests';
    if (initialTab === 'sent') return 'sent';
    if (initialTab === 'connections' || initialTab === 'my-connections') return 'connections';
    return 'discover';
  });

  const [requests, setRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionSuggestion[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-clear action success message after 4s
  useEffect(() => {
    if (!actionSuccess) return;
    const t = setTimeout(() => setActionSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [actionSuccess]);

  // Sync searchParam tab changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'requests' || tabParam === 'pending') setActiveTab('requests');
    else if (tabParam === 'sent') setActiveTab('sent');
    else if (tabParam === 'connections' || tabParam === 'my-connections') setActiveTab('connections');
    else if (tabParam === 'discover') setActiveTab('discover');
  }, [searchParams]);

  // Fetch all network data and current user
  const fetchData = async () => {
    try {
      setLoading(true);
      const [currentUserData, reqsData, sentData, connsData, suggData, usersData] = await Promise.all([
        apiRequest<{ id: number; email: string }>('/users/me').catch(() => null),
        apiRequest<Connection[]>('/connections/me/requests').catch(() => []),
        apiRequest<Connection[]>('/connections/me/sent-requests').catch(() => []),
        apiRequest<Connection[]>('/connections/me').catch(() => []),
        apiRequest<ConnectionSuggestion[]>('/connections/suggestions').catch(() => []),
        apiRequest<User[]>('/users').catch(() => [])
      ]);

      if (currentUserData) setCurrentUser(currentUserData);
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
      setActionSuccess('Connection accepted successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to accept connection request');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/reject`, { method: 'PATCH' });
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setActionSuccess('Connection request rejected.');
    } catch (err: any) {
      setError(err.message || 'Failed to reject connection request');
    }
  };

  const handleWithdraw = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/withdraw`, { method: 'DELETE' });
      setSentRequests((prev) => prev.filter((r) => r.id !== id));
      setActionSuccess('Connection request withdrawn.');
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw connection request');
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
      setActionSuccess('Connection request sent successfully!');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to send connection request');
    }
  };

  const handleSendMessage = (userId: number) => {
    navigate('/messaging', { state: { targetUserId: userId } });
  };

  // Helper to extract clean display name
  const getUserProfileName = (userSummary?: ConnectionUserSummary | null, fallbackId?: number) => {
    if (!userSummary) return `Peer #${fallbackId || '?'}`;
    const first = userSummary.profile?.first_name || '';
    const last = userSummary.profile?.last_name || '';
    const full = `${first} ${last}`.trim();
    if (full && full.toLowerCase() !== 'user' && full.toLowerCase() !== 'user user') {
      return full;
    }
    if (userSummary.email) {
      const handle = userSummary.email.split('@')[0];
      const clean = handle
        .replace(/[_.-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return clean || handle;
    }
    if (first && first.toLowerCase() !== 'user') return first;
    return `Peer #${userSummary.id || fallbackId || ''}`;
  };

  const getSuggestionDisplayName = (sugg: ConnectionSuggestion) => {
    const first = sugg.first_name || sugg.profile?.first_name || '';
    const last = sugg.last_name || sugg.profile?.last_name || '';
    const full = `${first} ${last}`.trim();
    if (full && full.toLowerCase() !== 'user' && full.toLowerCase() !== 'user user') {
      return full;
    }
    if (sugg.email) {
      const handle = sugg.email.split('@')[0];
      const clean = handle
        .replace(/[_.-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return clean || handle;
    }
    return `Peer #${sugg.user_id}`;
  };

  const getUserSimpleDisplayName = (user: User) => {
    if (user.email) {
      const handle = user.email.split('@')[0];
      const clean = handle
        .replace(/[_.-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return clean || handle;
    }
    return `Peer #${user.id}`;
  };

  // Filter items based on search query
  const query = searchQuery.toLowerCase().trim();

  const filteredRequests = requests.filter((req) => {
    const name = getUserProfileName(req.requester, req.requester_id).toLowerCase();
    const email = (req.requester?.email || '').toLowerCase();
    return name.includes(query) || email.includes(query) || req.requester_id.toString().includes(query);
  });

  const filteredSentRequests = sentRequests.filter((req) => {
    const name = getUserProfileName(req.addressee, req.addressee_id).toLowerCase();
    const email = (req.addressee?.email || '').toLowerCase();
    return name.includes(query) || email.includes(query) || req.addressee_id.toString().includes(query);
  });

  const filteredConnections = connections.filter((conn) => {
    const isRequester = conn.requester_id === currentUser?.id;
    const targetUser = isRequester ? conn.addressee : conn.requester;
    const targetId = isRequester ? conn.addressee_id : conn.requester_id;
    const name = getUserProfileName(targetUser, targetId).toLowerCase();
    const email = (targetUser?.email || '').toLowerCase();
    return name.includes(query) || email.includes(query) || targetId.toString().includes(query);
  });

  const filteredSuggestions = suggestions.filter((sugg) => {
    const name = getSuggestionDisplayName(sugg).toLowerCase();
    const email = (sugg.email || '').toLowerCase();
    const reason = (sugg.recommendation_reason || '').toLowerCase();
    return name.includes(query) || email.includes(query) || reason.includes(query);
  });

  const filteredUsers = users.filter(
    (u) =>
      u.id !== currentUser?.id &&
      u.email.toLowerCase().includes(query) &&
      !suggestions.some((s) => s.user_id === u.id) &&
      !connections.some((c) => c.requester_id === u.id || c.addressee_id === u.id) &&
      !sentRequests.some((s) => s.addressee_id === u.id) &&
      !requests.some((r) => r.requester_id === u.id)
  );

  if (loading && !requests.length && !connections.length && !suggestions.length && !users.length) {
    return (
      <div className="text-[#5851A4] p-8 flex items-center justify-center min-h-[50vh] font-semibold">
        Loading network data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications / Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-xs font-semibold">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs font-bold text-rose-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{actionSuccess}</span>
        </div>
      )}

      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#1E2746] mb-1 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-[#4B63D2]" />
              My Network
            </h2>
            <p className="text-[#5851A4] text-sm font-medium">
              Build relationships, connect with peers, and explore smart suggestions.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9188BE]" />
            <input
              type="text"
              placeholder={
                activeTab === 'discover'
                  ? 'Search suggestions & people by name or email...'
                  : activeTab === 'requests'
                  ? 'Search pending requests...'
                  : activeTab === 'sent'
                  ? 'Search sent requests...'
                  : 'Search connections...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-12 py-2.5 bg-[#FAF9FD] border border-[#D5CBEE] focus:bg-white focus:border-[#4B63D2] rounded-xl text-sm font-medium text-[#1E2746] placeholder-[#9188BE] focus:outline-none focus:ring-2 focus:ring-[#4B63D2]/20 transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#5851A4] hover:text-[#1E2746] bg-[#EAE4F7] hover:bg-[#D5CBEE] rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-[#EAE4F7] pb-4">
          <button
            onClick={() => handleTabChange('discover')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20'
                : 'bg-[#FAF9FD] text-[#5851A4] hover:bg-[#F3EFFB] hover:text-[#1E2746]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Discover & Suggestions
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'discover' ? 'bg-white/20 text-white' : 'bg-[#EAE4F7] text-[#5851A4]'
            }`}>
              {suggestions.length + filteredUsers.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('requests')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20'
                : 'bg-[#FAF9FD] text-[#5851A4] hover:bg-[#F3EFFB] hover:text-[#1E2746]'
            }`}
          >
            <Users className="w-4 h-4" />
            Pending Requests
            {requests.length > 0 && (
              <span className="bg-[#FFD21A] text-[#1E2746] font-extrabold text-xs px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                {requests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('sent')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20'
                : 'bg-[#FAF9FD] text-[#5851A4] hover:bg-[#F3EFFB] hover:text-[#1E2746]'
            }`}
          >
            <Send className="w-4 h-4" />
            Sent Requests
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'sent' ? 'bg-white/20 text-white' : 'bg-[#EAE4F7] text-[#5851A4]'
            }`}>
              {sentRequests.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('connections')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'connections'
                ? 'bg-[#4B63D2] text-white shadow-md shadow-[#4B63D2]/20'
                : 'bg-[#FAF9FD] text-[#5851A4] hover:bg-[#F3EFFB] hover:text-[#1E2746]'
            }`}
          >
            <Users className="w-4 h-4" />
            My Connections
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'connections' ? 'bg-white/20 text-white' : 'bg-[#EAE4F7] text-[#5851A4]'
            }`}>
              {connections.length}
            </span>
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* DISCOVER TAB */}
        {activeTab === 'discover' && (
          <>
            {filteredSuggestions.length === 0 && filteredUsers.length === 0 ? (
              <div className="col-span-3 text-[#5851A4] text-center py-12 bg-white rounded-3xl border border-[#EAE4F7] font-medium">
                {searchQuery ? 'No suggestions or users match your search.' : 'No new recommendations available right now.'}
              </div>
            ) : (
              <>
                {filteredSuggestions.map((sugg) => (
                  <ConnectionCard
                    key={`sugg-${sugg.user_id}`}
                    type="discover"
                    id={sugg.user_id}
                    targetId={sugg.user_id}
                    email={sugg.email}
                    name={getSuggestionDisplayName(sugg)}
                    profilePicture={sugg.profile_picture || sugg.profile?.profile_picture}
                    subtitle={sugg.department || 'Suggested for You'}
                    mutualCount={sugg.mutual_count}
                    reason={sugg.recommendation_reason}
                    onConnect={handleConnect}
                  />
                ))}
                {filteredUsers.map((user) => (
                  <ConnectionCard
                    key={`user-${user.id}`}
                    type="discover"
                    id={user.id}
                    targetId={user.id}
                    email={user.email}
                    name={getUserSimpleDisplayName(user)}
                    subtitle="Campus Member"
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
              <div className="col-span-3 text-[#5851A4] text-center py-12 bg-white rounded-3xl border border-[#EAE4F7] font-medium">
                {searchQuery ? 'No pending requests match your search.' : 'No incoming pending requests.'}
              </div>
            ) : (
              filteredRequests.map((req) => {
                const targetUser = req.requester;
                const name = getUserProfileName(targetUser, req.requester_id);
                return (
                  <ConnectionCard
                    key={req.id}
                    type="request"
                    id={req.id}
                    targetId={req.requester_id}
                    email={targetUser?.email}
                    name={name}
                    profilePicture={targetUser?.profile?.profile_picture}
                    subtitle="Wants to connect"
                    onAccept={handleAccept}
                    onReject={handleReject}
                  />
                );
              })
            )}
          </>
        )}

        {/* SENT REQUESTS TAB */}
        {activeTab === 'sent' && (
          <>
            {filteredSentRequests.length === 0 ? (
              <div className="col-span-3 text-[#5851A4] text-center py-12 bg-white rounded-3xl border border-[#EAE4F7] font-medium">
                {searchQuery ? 'No sent requests match your search.' : 'No pending sent requests.'}
              </div>
            ) : (
              filteredSentRequests.map((req) => {
                const targetUser = req.addressee;
                const name = getUserProfileName(targetUser, req.addressee_id);
                return (
                  <ConnectionCard
                    key={req.id}
                    type="sent"
                    id={req.id}
                    targetId={req.addressee_id}
                    email={targetUser?.email}
                    name={name}
                    profilePicture={targetUser?.profile?.profile_picture}
                    subtitle="Request Sent (Pending)"
                    onWithdraw={handleWithdraw}
                  />
                );
              })
            )}
          </>
        )}

        {/* MY CONNECTIONS TAB */}
        {activeTab === 'connections' && (
          <>
            {filteredConnections.length === 0 ? (
              <div className="col-span-3 text-[#5851A4] text-center py-12 bg-white rounded-3xl border border-[#EAE4F7] font-medium">
                {searchQuery ? 'No connections match your search.' : 'No active connections yet. Start connecting from Discover!'}
              </div>
            ) : (
              filteredConnections.map((conn) => {
                const isRequester = currentUser && conn.requester_id === currentUser.id;
                const otherUser = isRequester ? conn.addressee : conn.requester;
                const otherUserId = isRequester ? conn.addressee_id : conn.requester_id;
                const name = getUserProfileName(otherUser, otherUserId);

                return (
                  <ConnectionCard
                    key={conn.id}
                    type="connection"
                    id={conn.id}
                    targetId={otherUserId}
                    email={otherUser?.email}
                    name={name}
                    profilePicture={otherUser?.profile?.profile_picture}
                    subtitle="Connected"
                    onMessage={handleSendMessage}
                  />
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
