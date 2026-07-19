import React, { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { profileService, ProfileResponse } from '../../services/profile'

interface ProfilePictureUploaderProps {
  currentImageUrl: string | null
  initials: string
  onUploadSuccess: (updatedProfile: ProfileResponse) => void
  onUploadError: (errorMessage: string) => void
}

export default function ProfilePictureUploader({
  currentImageUrl,
  initials,
  onUploadSuccess,
  onUploadError,
}: ProfilePictureUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleContainerClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Client-side Validation: File Type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      onUploadError('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed.')
      return
    }

    // Client-side Validation: File Size (Max 2MB)
    const maxSizeBytes = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSizeBytes) {
      onUploadError('File size is too large. Maximum size allowed is 2MB.')
      return
    }

    setIsUploading(true)
    try {
      const updatedProfile = await profileService.uploadProfilePicture(file)
      onUploadSuccess(updatedProfile)
    } catch (err: any) {
      onUploadError(err.message || 'Failed to upload profile picture.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = '' // Clear input
      }
    }
  }

  // Determine full image URL
  const imageUrl = currentImageUrl
    ? currentImageUrl.startsWith('http')
      ? currentImageUrl
      : `http://localhost:8000${currentImageUrl}`
    : null

  return (
    <div className="relative group cursor-pointer" onClick={handleContainerClick}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        disabled={isUploading}
      />

      <div className="h-28 w-28 rounded-full overflow-hidden border-4 border-slate-800 bg-slate-900 flex items-center justify-center shadow-xl transition-all group-hover:border-indigo-500 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Profile Avatar"
            className={`h-full w-full object-cover transition-all ${isUploading ? 'opacity-30' : 'group-hover:opacity-60'}`}
          />
        ) : (
          <div className={`text-4xl font-extrabold text-white transition-all ${isUploading ? 'opacity-30' : 'group-hover:opacity-60'}`}>
            {initials}
          </div>
        )}

        {/* Hover/Upload Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          ) : (
            <Camera className="h-8 w-8 text-white" />
          )}
        </div>
      </div>

      {isUploading && (
        <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1.5 shadow-lg">
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        </div>
      )}
    </div>
  )
}
