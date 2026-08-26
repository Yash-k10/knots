import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  MessageSquare,
  Heart,
  Calendar,
  Activity,
} from "lucide-react";
import { profileService, ProfileResponse } from "../services/profile";
import { apiRequest, getMediaUrl } from "../services/api";
import { formatTimeAgo } from "../utils/date";
import ProfileHeader from "../components/profile/ProfileHeader";
import SkillsSection from "../components/profile/SkillsSection";
import EducationSection from "../components/profile/EducationSection";
import ExperienceSection from "../components/profile/ExperienceSection";
import CertificationsSection from "../components/profile/CertificationsSection";
import ProjectsSection from "../components/profile/ProjectsSection";

export default function Profile() {
  const { userId } = useParams<{ userId?: string }>();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [ownProfile, setOwnProfile] = useState<ProfileResponse | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProfileAndActivity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch logged-in user profile first
      const ownData = await profileService.getOwnProfile();
      setOwnProfile(ownData);

      // 2. Determine target profile
      let targetProfile = ownData;
      if (userId) {
        const parsedId = parseInt(userId, 10);
        if (!isNaN(parsedId) && parsedId !== ownData.user_id) {
          targetProfile = await profileService.getProfileByUserId(parsedId);
        }
      }
      setProfile(targetProfile);

      // 3. Fetch activity posts for the target profile user
      setIsLoadingPosts(true);
      try {
        const posts = await apiRequest<any[]>(
          `/posts/user/${targetProfile.user_id}`,
        );
        setUserPosts(posts || []);
      } catch (err) {
        console.error("Failed to load user posts activity", err);
      } finally {
        setIsLoadingPosts(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndActivity();
  }, [userId]);

  const handleUpdate = (updatedProfile: ProfileResponse) => {
    setProfile(updatedProfile);
    showSuccess("Profile updated successfully!");
  };

  const handleError = (message: string) => {
    setError(message);
    setTimeout(() => {
      setError((prev) => (prev === message ? null : prev));
    }, 6000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage((prev) => (prev === message ? null : prev));
    }, 4000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white border border-[#EAE4F7] rounded-3xl p-8 flex flex-col md:flex-row gap-6 items-center shadow-sm">
          <div className="h-28 w-28 rounded-full bg-[#F8F6FD] border border-[#EAE4F7]" />
          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <div className="h-8 bg-[#F8F6FD] rounded-xl w-1/3 mx-auto md:mx-0" />
            <div className="h-4 bg-[#F8F6FD] rounded-xl w-1/4 mx-auto md:mx-0" />
            <div className="h-12 bg-[#F8F6FD] rounded-xl w-3/4 mx-auto md:mx-0" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 h-48 shadow-sm" />
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 h-48 shadow-sm" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 h-64 shadow-sm" />
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 h-64 shadow-sm" />
            <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 h-64 shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[#1E2746] mb-2">
          Failed to Load Profile
        </h3>
        <p className="text-[#5851A4] text-sm mb-6 font-medium">{error}</p>
        <button
          onClick={fetchProfileAndActivity}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4B63D2] hover:bg-[#3E53BE] text-white font-bold rounded-xl text-sm transition shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  if (!profile || !ownProfile) {
    return (
      <div className="bg-white border border-[#EAE4F7] rounded-3xl p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
        <Loader2 className="h-10 w-10 text-[#4B63D2] animate-spin mx-auto mb-4" />
        <p className="text-[#5851A4] font-medium">Setting up your profile...</p>
      </div>
    );
  }

  const isOwnProfile = profile.user_id === ownProfile.user_id;

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md w-full px-4 sm:px-0">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 shadow-lg flex gap-3 items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-bold text-sm text-[#1E2746]">
                Error Encountered
              </h5>
              <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold uppercase tracking-wider select-none"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 shadow-lg flex gap-3 items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-bold text-sm text-[#1E2746]">Success</h5>
              <p className="text-xs text-emerald-700 mt-1 font-medium">{successMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Profile Header */}
      <ProfileHeader
        profile={profile}
        onUpdate={handleUpdate}
        onError={handleError}
        isOwnProfile={isOwnProfile}
      />

      {/* Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Skills & Certifications */}
        <div className="lg:col-span-1 space-y-6">
          <SkillsSection
            profile={profile}
            onUpdate={handleUpdate}
            onError={handleError}
            isOwnProfile={isOwnProfile}
            currentUserId={ownProfile.user_id}
          />
          <CertificationsSection
            profile={profile}
            onUpdate={handleUpdate}
            onError={handleError}
            isOwnProfile={isOwnProfile}
          />
        </div>

        {/* Right Side: Education, Experience, Projects, and Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <EducationSection
            profile={profile}
            onUpdate={handleUpdate}
            onError={handleError}
            isOwnProfile={isOwnProfile}
          />
          <ExperienceSection
            profile={profile}
            onUpdate={handleUpdate}
            onError={handleError}
            isOwnProfile={isOwnProfile}
          />
          <ProjectsSection
            profile={profile}
            onUpdate={handleUpdate}
            onError={handleError}
            isOwnProfile={isOwnProfile}
          />

          {/* Recent Activity Feed */}
          <div className="bg-white border border-[#EAE4F7] rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#EAE4F7] pb-4">
              <h3 className="text-xl font-black text-[#1E2746] flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#4B63D2]" />
                Recent Activity
              </h3>
              {userPosts.length > 0 && (
                <span className="text-xs bg-[#C8B6E2]/25 border border-[#C8B6E2] text-[#5851A4] font-bold px-3 py-1 rounded-full">
                  {userPosts.length} {userPosts.length === 1 ? "Post" : "Posts"}
                </span>
              )}
            </div>
            {isLoadingPosts ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 text-[#4B63D2] animate-spin" />
              </div>
            ) : userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-xl p-4 transition duration-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        Posted {formatTimeAgo(post.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                    {post.image_url && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-slate-800 max-h-60 bg-slate-950 flex items-center justify-center">
                        <img
                          src={getMediaUrl(post.image_url)}
                          alt="Post attachment"
                          className="max-h-60 object-contain w-full"
                        />
                      </div>
                    )}
                    <div className="flex gap-4 mt-4 pt-3 border-t border-slate-900/60 text-xs text-slate-500 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-rose-400" />{" "}
                        {post.likes_count} Likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-indigo-400" />{" "}
                        {post.comments_count} Comments
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl bg-slate-900/10">
                <MessageSquare className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm font-medium">
                  No recent activity yet
                </p>
                <p className="text-slate-600 text-xs mt-1">
                  Posts and discussions shared by this user will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
