import apiClient from '@/lib/api-client'

export interface ProfileImageResponse {
  success: boolean
  message: string
  profile_image_url: string
}

export interface GetProfileImageResponse {
  profile_image_url: string | null
}

export interface DeleteProfileImageResponse {
  success: boolean
  message: string
}

export const profileService = {
  /**
   * Upload or update user profile image
   * @param file - The image file to upload (jpeg, png, gif, webp - max 5MB)
   */
  async uploadProfileImage(file: File): Promise<ProfileImageResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await apiClient.post<ProfileImageResponse>(
      '/users/profile-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  /**
   * Get current user's profile image URL
   */
  async getProfileImage(): Promise<GetProfileImageResponse> {
    const response =
      await apiClient.get<GetProfileImageResponse>('/users/profile-image')
    return response.data
  },

  /**
   * Delete current user's profile image
   */
  async deleteProfileImage(): Promise<DeleteProfileImageResponse> {
    const response = await apiClient.delete<DeleteProfileImageResponse>(
      '/users/profile-image'
    )
    return response.data
  },
}
