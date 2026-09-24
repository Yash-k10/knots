import { Link } from 'react-router-dom';
import { UserPlus, Check, X, MessageSquare, Users, RotateCcw } from 'lucide-react';
import { getMediaUrl } from '../../services/api';

interface ConnectionCardProps {
  type: 'request' | 'connection' | 'discover' | 'sent';
  id: number; // The connection ID (or user ID if discover)
  targetId: number; // The user ID we are interacting with
  email?: string;
  name?: string;
  role?: string | null;
  profilePicture?: string | null;
  subtitle: string;
  mutualCount?: number;
  reason?: string;
  isAccepted?: boolean;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
  onWithdraw?: (id: number) => void;
  onConnect?: (userId: number) => void;
  onMessage?: (userId: number) => void;
  onTieBack?: (userId: number) => void;
}

export default function ConnectionCard({
  type,
  id,
  targetId,
  email,
  name,
  role,
  profilePicture,
  subtitle,
  mutualCount,
  reason,
  isAccepted,
  onAccept,
  onReject,
  onWithdraw,
  onConnect,
  onMessage,
  onTieBack,
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

  // Normalize role tag
  const normalizedRole = role || (
    email?.includes('prof') || email?.includes('faculty') || email?.includes('teacher') ? 'Faculty' :
    email?.includes('hod') ? 'HOD' :
    email?.includes('dean') ? 'Dean' :
    email?.includes('principal') ? 'Principal' :
    email?.includes('ceo') ? 'CEO' :
    email?.includes('tpo') ? 'TPO' :
    email?.includes('controller') ? 'Controller' :
    email?.includes('alumni') ? 'Alumni' : 'Student'
  );

  const getRolePill = (r: string) => {
    const lower = r.toLowerCase();
    if (lower.includes('alumni')) {
      return { label: 'Alumni', style: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (lower.includes('faculty') || lower.includes('prof') || lower.includes('teacher')) {
      return { label: 'Faculty', style: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
    if (lower.includes('hod') || lower.includes('head')) {
      return { label: 'HOD', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    if (lower.includes('dean')) {
      return { label: 'Dean', style: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
    if (lower.includes('principal')) {
      return { label: 'Principal', style: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
    if (lower.includes('ceo')) {
      return { label: 'CEO', style: 'bg-purple-50 text-purple-800 border-purple-200' };
    }
    if (lower.includes('tpo')) {
      return { label: 'TPO', style: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
    if (lower.includes('controller') || lower.includes('admin')) {
      return { label: 'Controller', style: 'bg-indigo-50 text-[#4B63D2] border-[#D5CBEE]' };
    }
    return { label: 'Student', style: 'bg-[#FAF9FD] text-[#5851A4] border-[#EAE4F7]' };
  };

  const rolePill = getRolePill(normalizedRole);

  return (
    <div className="group relative bg-white border border-[#EAE4F7] hover:border-[#C8B6E2] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center space-y-3 sm:space-y-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex flex-col justify-between">
      <div>
        {/* Avatar Container */}
        <Link to={`/profile/${targetId}`} className="block relative mx-auto h-16 w-16 sm:h-20 sm:w-20 cursor-pointer mb-2 sm:mb-3">
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
        </Link>

        {/* Text Info */}
        <div className="space-y-1.5">
          <Link to={`/profile/${targetId}`} className="block">
            <h4 className="text-base font-bold text-[#1E2746] truncate px-2 transition-colors group-hover:text-[#4B63D2]" title={email || displayName}>
              {displayName}
            </h4>
          </Link>

          {/* Explicit Role Pill */}
          <div>
            <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${rolePill.style}`}>
              {rolePill.label}
            </span>
          </div>

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

          <div className="pt-1">
            <Link
              to={`/profile/${targetId}`}
              className="text-xs font-bold text-[#4B63D2] hover:text-[#3E53BE] hover:underline inline-flex items-center gap-1 transition"
            >
              View Profile →
            </Link>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-[#EAE4F7] mt-2">
        {type === 'request' && (
          isAccepted ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 py-2 rounded-xl">
                <Check className="w-4 h-4 text-emerald-600" /> Tie Accepted
              </div>
              <button
                onClick={() => onTieBack && onTieBack(targetId)}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#4B63D2] to-[#5851A4] hover:opacity-90 active:scale-95 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md shadow-[#4B63D2]/25 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Tie Back
              </button>
            </div>
          ) : (
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
          )
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
            <UserPlus className="w-4 h-4" /> Tie
          </button>
        )}
      </div>
    </div>
  );
}
