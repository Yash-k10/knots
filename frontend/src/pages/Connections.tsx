import { useState, useEffect } from "react";
import { Users, Search } from "lucide-react";
import { apiRequest } from "../services/api";
import ConnectionCard from "../components/connections/ConnectionCard";

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
  const [activeTab, setActiveTab] = useState<
    "requests" | "connections" | "discover"
  >("requests");
  const [requests, setRequests] = useState<Connection[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqsData, connsData, usersData] = await Promise.all([
        apiRequest<Connection[]>("/connections/me/requests"),
        apiRequest<Connection[]>("/connections/me"),
        apiRequest<User[]>("/users"),
      ]);
      setRequests(reqsData);
      setConnections(connsData);
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (tab: "requests" | "connections" | "discover") => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  const handleAccept = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/accept`, { method: "PATCH" });
      fetchData(); // Refresh lists
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await apiRequest(`/connections/${id}/reject`, { method: "PATCH" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConnect = async (userId: number) => {
    try {
      await apiRequest("/connections", {
        method: "POST",
        body: JSON.stringify({ addressee_id: userId }),
      });
      alert("Request sent!");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendMessage = (userId: number) => {
    // Currently just a placeholder function or alert until Week 2 real-time chat
    alert(`Opening conversation with User #${userId}`);
  };

  // Filter lists based on search query
  const filteredRequests = requests.filter((req) =>
    req.requester_id.toString().includes(searchQuery.trim()),
  );

  const filteredConnections = connections.filter(
    (conn) =>
      conn.requester_id.toString().includes(searchQuery.trim()) ||
      conn.id.toString().includes(searchQuery.trim()),
  );

  const filteredUsers = users.filter((user) =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase().trim()),
  );

  if (loading) {
    return (
      <div className="text-slate-400 p-6 flex items-center justify-center min-h-[50vh]">
        Loading network data...
      </div>
    );
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
            <p className="text-slate-400 text-sm">
              Build relationships with alumni and campus colleagues.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === "discover"
                  ? "Search people by email..."
                  : activeTab === "requests"
                    ? "Search requests by User ID..."
                    : "Search connections by User/Connection ID..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-12 py-2.5 bg-slate-900/50 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all duration-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
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

        <div className="flex gap-6 border-b border-slate-800 pb-2">
          <button
            onClick={() => handleTabChange("requests")}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === "requests" ? "text-indigo-400 border-indigo-400" : "text-slate-400 border-transparent hover:text-slate-200"}`}
          >
            Pending Requests ({requests.length})
          </button>
          <button
            onClick={() => handleTabChange("connections")}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === "connections" ? "text-indigo-400 border-indigo-400" : "text-slate-400 border-transparent hover:text-slate-200"}`}
          >
            My Connections ({connections.length})
          </button>
          <button
            onClick={() => handleTabChange("discover")}
            className={`text-sm font-semibold transition-colors pb-2 -mb-[9px] border-b-2 ${activeTab === "discover" ? "text-indigo-400 border-indigo-400" : "text-slate-400 border-transparent hover:text-slate-200"}`}
          >
            Discover People
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {/* PENDING REQUESTS TAB */}
        {activeTab === "requests" && (
          <>
            {filteredRequests.length === 0 ? (
              <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">
                {searchQuery
                  ? "No pending requests match your search."
                  : "No pending requests."}
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

        {/* MY CONNECTIONS TAB */}
        {activeTab === "connections" && (
          <>
            {filteredConnections.length === 0 ? (
              <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">
                {searchQuery
                  ? "No connections match your search."
                  : "You don't have any connections yet."}
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

        {/* DISCOVER TAB */}
        {activeTab === "discover" && (
          <>
            {filteredUsers.length === 0 ? (
              <div className="col-span-3 text-slate-400 text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/50">
                {searchQuery
                  ? "No users match your search."
                  : "No users found."}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <ConnectionCard
                  key={user.id}
                  type="discover"
                  id={user.id}
                  targetId={user.id}
                  email={user.email}
                  subtitle="Platform Member"
                  onConnect={handleConnect}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
