'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  kycVerifiedAt?: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData(user);
      setLoading(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await updateUser(formData);
      setEditing(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED':
        return 'text-secondary bg-secondary/10';
      case 'EXPIRED':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePictureUpload = async () => {
    const fileInput = document.getElementById('profile-picture-input') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      setError('Please select an image file');
      return;
    }

    try {
      setUploadingPicture(true);
      setError('');

      const formData = new FormData();
      formData.append('picture', file);

      const response = await api.users.uploadProfilePicture(formData);
      const updatedUser = response.data.data;

      console.log('Profile picture upload response:', updatedUser);
      console.log('Profile picture URL:', updatedUser.profilePicture);

      // Update profile state
      setProfile(updatedUser);
      setPicturePreview(null);
      
      // Clear file input
      if (fileInput) {
        fileInput.value = '';
      }

      // Update auth context - pass full user object so it updates directly without API call
      await updateUser(updatedUser);
      
      // Force image refresh by updating the key
      // The key change will force React to reload the image
      // Use a small delay to ensure state is fully updated
      setTimeout(() => {
        setProfile((prev) => {
          const newProfile = { ...prev, ...updatedUser };
          console.log('Updated profile state:', newProfile);
          return newProfile;
        });
      }, 50);
    } catch (err: any) {
      console.error('Profile picture upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const getProfilePictureUrl = () => {
    if (picturePreview) return picturePreview;
    
    // Check both profile state and user from context
    const profilePic = profile?.profilePicture || user?.profilePicture;
    
    if (profilePic) {
      // If it's already a full URL (starts with http:// or https://), return it as-is
      if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) {
        return profilePic;
      }
      // If it starts with /, it's a relative path - prepend API URL
      if (profilePic.startsWith('/')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        return `${apiUrl}${profilePic}`;
      }
      // Otherwise, assume it's a relative path and prepend API URL with /
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return `${apiUrl}/${profilePic}`;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Profile Picture Section */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center gap-4">
              <div className="relative">
                {getProfilePictureUrl() ? (
                  <img
                    src={getProfilePictureUrl() || ''}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      console.error('Failed to load profile picture:', getProfilePictureUrl());
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300"><span class="text-2xl font-semibold text-gray-500">${profile?.firstName?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || 'U'}</span></div>`;
                      }
                    }}
                    onLoad={() => {
                      console.log('Profile picture loaded successfully:', getProfilePictureUrl());
                    }}
                    key={`${profile?.profilePicture || user?.profilePicture || 'default'}-${profile?.updatedAt || Date.now()}`}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                    <span className="text-2xl font-semibold text-gray-500">
                      {profile?.firstName?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">Profile Picture</p>
                <div className="flex gap-2">
                  <label
                    htmlFor="profile-picture-input"
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition"
                  >
                    {uploadingPicture ? 'Uploading...' : 'Change Picture'}
                  </label>
                  <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="hidden"
                    disabled={uploadingPicture}
                  />
                  {picturePreview && (
                    <button
                      onClick={handlePictureUpload}
                      disabled={uploadingPicture}
                      className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      Save
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG or WEBP (max 5MB)</p>
              </div>
            </div>
          </div>

          {!editing ? (
            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Email</p>
                <p className="text-gray-900 font-medium">{profile?.email}</p>
                {profile?.isEmailVerified && (
                  <span className="text-green-600 text-xs">✓ Verified</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">First Name</p>
                  <p className="text-gray-900 font-medium">{profile?.firstName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Last Name</p>
                  <p className="text-gray-900 font-medium">{profile?.lastName}</p>
                </div>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">Phone Number</p>
                <p className="text-gray-900 font-medium">{profile?.phoneNumber || 'Not provided'}</p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">Date of Birth</p>
                <p className="text-gray-900 font-medium">
                  {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              </div>
              
              <div>
                <p className="text-gray-600 text-sm">KYC Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getKycStatusColor(profile?.kycStatus || '')}`}>
                  {profile?.kycStatus}
                </span>
                {profile?.kycVerifiedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    Verified on: {new Date(profile.kycVerifiedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  name="country"
                  value={formData.country || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="JP">Japan</option>
                  <option value="SG">Singapore</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setFormData(profile || {});
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm">Account Created</p>
              <p className="text-gray-900 font-medium">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Last Updated</p>
              <p className="text-gray-900 font-medium">
                {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div>
              <p className="text-gray-600 text-sm">Email Verification</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  profile?.isEmailVerified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                }`}>
                  {profile?.isEmailVerified ? 'Verified' : 'Pending'}
                </span>
                {profile?.emailVerifiedAt && (
                  <span className="text-xs text-gray-500">
                    ({new Date(profile.emailVerifiedAt).toLocaleDateString()})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

