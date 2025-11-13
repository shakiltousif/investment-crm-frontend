'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, MapPin, Shield, Save, X } from 'lucide-react';

interface AdminProfile {
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
  role: 'CLIENT' | 'ADMIN';
  isEmailVerified: boolean;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export default function AdminProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminProfile>>({});
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.users.getProfile();
      const profileData = response.data.data;
      setProfile(profileData);
      setFormData(profileData);
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateUser(formData);
      await fetchProfile();
      setEditing(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
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
    const fileInput = document.getElementById('admin-profile-picture-input') as HTMLInputElement;
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
      
      setSuccess('Profile picture updated successfully');
      setTimeout(() => setSuccess(''), 3000);
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      await api.users.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess('Password changed successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">Manage your admin account information and security</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Personal Information</CardTitle>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
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
                          parent.innerHTML = '<div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300"><svg class="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg></div>';
                        }
                      }}
                      onLoad={() => {
                        console.log('Profile picture loaded successfully:', getProfilePictureUrl());
                      }}
                      key={`${profile?.profilePicture || user?.profilePicture || 'default'}-${profile?.updatedAt || Date.now()}`}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Profile Picture</p>
                  <div className="flex gap-2">
                    <label
                      htmlFor="admin-profile-picture-input"
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition"
                    >
                      {uploadingPicture ? 'Uploading...' : 'Change Picture'}
                    </label>
                    <input
                      id="admin-profile-picture-input"
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      className="hidden"
                      disabled={uploadingPicture}
                    />
                    {picturePreview && (
                      <Button
                        onClick={handlePictureUpload}
                        disabled={uploadingPicture}
                        size="sm"
                        variant="outline"
                      >
                        Save
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or WEBP (max 5MB)</p>
                </div>
              </div>
            </div>

            {!editing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-gray-900 font-medium">
                      {profile?.firstName} {profile?.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 font-medium">{profile?.email}</p>
                      {profile?.isEmailVerified && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {profile?.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="text-gray-900 font-medium">{profile.phoneNumber}</p>
                    </div>
                  </div>
                )}

                {profile?.dateOfBirth && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="text-gray-900 font-medium">
                        {new Date(profile.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {(profile?.address || profile?.city || profile?.state) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="text-gray-900 font-medium">
                        {[profile.address, profile.city, profile.state, profile.zipCode, profile.country]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <Badge className="bg-purple-100 text-purple-800">
                      {profile?.role || 'ADMIN'}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="+44 20 1234 5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Street address"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    name="country"
                    value={formData.country || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData(profile || {});
                      setError('');
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Account Information & Security */}
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-900 font-medium">{profile?.email}</p>
                    {profile?.isEmailVerified ? (
                      <Badge className="bg-green-100 text-green-800 text-xs">
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        Not Verified
                      </Badge>
                    )}
                  </div>
                  {profile?.emailVerifiedAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Verified on: {new Date(profile.emailVerifiedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <Badge className="bg-purple-100 text-purple-800 mt-1">
                    {profile?.role || 'ADMIN'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Account Created</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-gray-900 font-medium mt-1">
                    {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                {profile?.lastLoginAt && (
                  <div>
                    <p className="text-sm text-gray-600">Last Login</p>
                    <p className="text-gray-900 font-medium mt-1">
                      {new Date(profile.lastLoginAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-700 text-sm">{passwordError}</p>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-700 text-sm">{passwordSuccess}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

