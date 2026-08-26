import { UserPlus, Check, X, MessageSquare, Users, RotateCcw } from 'lucide-react';
import { getMediaUrl } from '../../services/api';

interface ConnectionCardProps {
  type: 'request' | 'connection' | 'discover' | 'sent';
  id: number; // The connection ID (or user ID if discover)
  targetId: number; // The user ID we are interacting with
  email?: string;
  name?: string;
  profilePicture?: string | null;
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
  name,
  profilePicture,
  subtitle,
  mutualCount,
  reason,
  onAccept,
  onReject,
  onWithdraw,
  onConnect,
  onMessage,
}: ConnectionCardProps) {
  // Generate a vibrant gradient background based on targetId or email
  const getGradientStyle = (seed: string | number) => {
    const seedStr = seed.toString();
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = Math.abs((hash + 80) % 360);
    return {
      background: `linear-gradient(135deg, hsl(${hue1}, 70%, 50%) 0%, hsl(${hue2}, 80%, 60%) 100%)`,
    };
  };

  const displayName = name && name.trim() ? name.trim() : (email ? email.split('@')[0] : `User #${targetId}`);
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const resolvedAvatar = getMediaUrl(profilePicture);

  return (
    <div className="group relative bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-3xl p-6 text-center space-y-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between">
      <div>
        {/* Avatar Container */}
        <div className="relative mx-auto h-20 w-20 flex items-center justify-center mb-3">
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt={displayName}
              className="h-20 w-20 rounded-2xl object-cover border border-[#EAE4F7] shadow-md group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              style={getGradientStyle(displayName || targetId)}
              className="h-20 w-20 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-md group-hover:scale-105 transition-transform duration-300"
            >
              {avatarLetter}
            </div>
          )}
        </div>

        {/* Text Info */}
        <div className="space-y-1">
          <h4 className="text-base font-bold text-[#1E2746] truncate px-2 transition-colors group-hover:text-[#4B63D2]" title={email || displayName}>
            {displayName}
          </h4>
          <p className={`text-xs font-semibold tracking-wide ${
            type === 'request' ? 'text-[#4B63D2]' :
            type === 'connection' ? 'text-emerald-600' :
            type === 'sent' ? 'text-amber-600' : 'text-[#5851A4]'
          }`}>
            {subtitle}
          </p>

          {/* Mutual Connections & Reason Badges */}
          {((mutualCount !== undefined && mutualCount > 0) || reason) && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
              {mutualCount !== undefined && mutualCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4B63D2]/10 text-[#4B63D2] border border-[#4B63D2]/20">
                  <Users className="w-3 h-3 text-[#4B63D2]" />
                  {mutualCount} mutual
                </span>
              )}
              {reason && (
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium text-[#5851A4] bg-[#FAF9FD] border border-[#EAE4F7] truncate max-w-[200px]" title={reason}>
                  {reason}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#EAE4F7] mt-2">
        {type === 'request' && (
          <div className="flex gap-2.5">
            <button
              onClick={() => onAccept && onAccept(id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] active:scale-95 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" /> Accept
            </button>
            <button
              onClick={() => onReject && onReject(id)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#FAF9FD] hover:bg-rose-50 hover:text-rose-600 active:scale-95 py-2.5 rounded-xl text-xs font-bold text-[#5851A4] transition-all border border-[#EAE4F7] cursor-pointer"
            >
              <X className="w-4 h-4" /> Reject
            </button>
          </div>
        )}

        {type === 'sent' && (
          <button
            onClick={() => onWithdraw && onWithdraw(id)}
            className="w-full flex items-center justify-center gap-1.5 bg-[#FAF9FD] hover:bg-rose-50 hover:text-rose-600 active:scale-[0.98] py-2.5 rounded-xl text-xs font-bold text-[#5851A4] transition-all border border-[#EAE4F7] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Withdraw Request
          </button>
        )}

        {type === 'connection' && (
          <button
            onClick={() => onMessage && onMessage(targetId)}
            className="w-full flex items-center justify-center gap-2 bg-[#FAF9FD] hover:bg-[#F0EDF9] hover:border-[#C8B6E2] active:scale-[0.98] py-2.5 rounded-xl text-xs font-bold text-[#1E2746] transition-all border border-[#EAE4F7] shadow-sm cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#4B63D2]" /> Send Message
          </button>
        )}

        {type === 'discover' && (
          <button
            onClick={() => onConnect && onConnect(targetId)}
            className="w-full flex items-center justify-center gap-1.5 bg-[#4B63D2] hover:bg-[#3E53BE] active:scale-[0.98] py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Connect
          </button>
        )}
      </div>
    </div>
  );
}
