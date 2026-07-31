import { UserPlus, Check, X, UserCheck, MessageSquare, Users, RotateCcw } from 'lucide-react';

interface ConnectionCardProps {
  type: 'request' | 'connection' | 'discover' | 'sent';
  id: number; // The connection ID (or user ID if discover)
  targetId: number; // The user ID we are interacting with
  email?: string;
  subtitle: string;
  mutualCount?: number;
  reason?: string;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onWithdraw?: (id: number) => void;
  onConnect?: (userId: number) => void;
  onMessage?: (userId: number) => void;
}

export default function ConnectionCard({
  type,
  id,
  targetId,
  email,
  subtitle,
  mutualCount,
  reason,
  onAccept,
  onReject,
  onWithdraw,
  onConnect,
  onMessage,
}: ConnectionCardProps) {
  // Generate a premium gradient background based on targetId or email
  const getGradientStyle = (seed: string | number) => {
    const seedStr = seed.toString();
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = Math.abs((hash + 80) % 360);
    return {
      background: `linear-gradient(135deg, hsl(${hue1}, 75%, 55%) 0%, hsl(${hue2}, 85%, 65%) 100%)`,
    };
  };

  const displayName = email ? email.split('@')[0] : `User #${targetId}`;
  const avatarLetter = email ? email.charAt(0).toUpperCase() : `U`;

  return (
    <div className="group relative bg-slate-950/40 backdrop-blur-md border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-6 text-center space-y-4 shadow-xl hover:shadow-indigo-950/10 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
      {/* Background glow animation */}
      <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-10" />

      <div>
        {/* Avatar Container */}
        <div className="relative mx-auto h-20 w-20 flex items-center justify-center mb-3">
          {type === 'connection' ? (
            <div
              style={getGradientStyle(targetId)}
              className="h-20 w-20 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/10 ring-4 ring-slate-900 group-hover:scale-105 transition-transform duration-300"
            >
              <UserCheck className="w-9 h-9 text-white/90 drop-shadow-sm" />
            </div>
          ) : (
            <div
              style={getGradientStyle(email || targetId)}
              className="h-20 w-20 rounded-2xl flex items-center justify-center font-bold text-white text-2xl shadow-lg ring-4 ring-slate-900 group-hover:scale-105 transition-transform duration-300"
            >
              {avatarLetter}
            </div>
          )}
        </div>

        {/* Text Info */}
        <div className="space-y-1">
          <h4 className="text-base font-semibold text-white truncate px-2 transition-colors group-hover:text-indigo-200" title={email || displayName}>
            {displayName}
          </h4>
          <p className={`text-xs font-medium tracking-wide ${
            type === 'request' ? 'text-indigo-400' :
            type === 'connection' ? 'text-emerald-400' :
            type === 'sent' ? 'text-amber-400' : 'text-slate-400'
          }`}>
            {subtitle}
          </p>

          {/* Mutual Connections & Reason Badges */}
          {((mutualCount !== undefined && mutualCount > 0) || reason) && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
              {mutualCount !== undefined && mutualCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <Users className="w-3 h-3 text-indigo-400" />
                  {mutualCount} mutual
                </span>
              )}
              {reason && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] text-slate-400 bg-slate-900 border border-slate-800 truncate max-w-[200px]" title={reason}>
                  {reason}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-900/60 mt-2">
        {type === 'request' && (
          <div className="flex gap-2.5">
            <button
              onClick={() => onAccept && onAccept(id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md shadow-indigo-900/30 hover:shadow-indigo-500/20"
            >
              <Check className="w-4 h-4" /> Accept
            </button>
            <button
              onClick={() => onReject && onReject(id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 py-2.5 rounded-xl text-xs font-semibold text-slate-200 transition-all border border-slate-700/50 hover:border-slate-600/50"
            >
              <X className="w-4 h-4" /> Reject
            </button>
          </div>
        )}

        {type === 'sent' && (
          <button
            onClick={() => onWithdraw && onWithdraw(id)}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-red-950/40 hover:text-red-300 hover:border-red-500/30 active:scale-[0.98] py-2.5 rounded-xl text-xs font-semibold text-slate-400 transition-all border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Withdraw Request
          </button>
        )}

        {type === 'connection' && (
          <button
            onClick={() => onMessage && onMessage(targetId)}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 hover:border-indigo-500/40 active:scale-[0.98] py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white transition-all border border-slate-800 shadow-inner group-hover:shadow-indigo-950/20"
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Send Message
          </button>
        )}

        {type === 'discover' && (
          <button
            onClick={() => onConnect && onConnect(targetId)}
            className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md shadow-indigo-900/20 hover:shadow-indigo-500/20"
          >
            <UserPlus className="w-4 h-4" /> Connect
          </button>
        )}
      </div>
    </div>
  );
}

