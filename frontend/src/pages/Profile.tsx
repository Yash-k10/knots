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
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center">
          <div className="h-28 w-28 rounded-full bg-slate-900 border border-slate-800" />
          <div className="flex-1 space-y-4 w-full text-center md:text-left">
            <div className="h-8 bg-slate-900 rounded-lg w-1/3 mx-auto md:mx-0" />
            <div className="h-4 bg-slate-900 rounded-lg w-1/4 mx-auto md:mx-0" />
            <div className="h-12 bg-slate-900 rounded-lg w-3/4 mx-auto md:mx-0" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-48" />
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-48" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-64" />
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-64" />
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 shadow-2xl">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          Failed to Load Profile
        </h3>
        <p className="text-slate-400 text-sm mb-6">{error}</p>
        <button
          onClick={fetchProfileAndActivity}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition"
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </button>
      </div>
    );
  }

  if (!profile || !ownProfile) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto my-8 shadow-2xl">
        <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Setting up your profile...</p>
      </div>
    );
  }

  const isOwnProfile = profile.user_id === ownProfile.user_id;

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-md w-full px-4 sm:px-0">
        {error && (
          <div className="bg-red-950/90 border border-red-800/80 text-red-200 rounded-xl p-4 shadow-2xl flex gap-3 backdrop-blur items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-sm text-white">
                Error Encountered
              </h5>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider select-none"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-950/90 border border-emerald-800/80 text-emerald-200 rounded-xl p-4 shadow-2xl flex gap-3 backdrop-blur items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-sm text-white">Success</h5>
              <p className="text-xs text-emerald-300 mt-1">{successMessage}</p>
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
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-400" />
                Recent Activity
              </h3>
              {userPosts.length > 0 && (
                <span className="text-xs bg-slate-900 border border-slate-800 text-indigo-300 font-semibold px-2.5 py-1 rounded-full">
                  {userPosts.length} {userPosts.length === 1 ? "Post" : "Posts"}
                </span>
              )}
            </div>
            {isLoadingPosts ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" />
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
                        Posted on{" "}
                        {new Date(post.created_at).toLocaleDateString()}
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
