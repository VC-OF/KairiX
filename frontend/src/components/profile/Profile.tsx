import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { 
  User, 
  Mail, 
  Shield, 
  Camera, 
  Lock, 
  Check, 
  AlertCircle,
  FileText,
  BellRing
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  // Profile Info State
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [role, setRole] = useState(user?.globalRole || 'user');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Notification State
  const [notifyEmail, setNotifyEmail] = useState(localStorage.getItem('notifyEmail') !== 'false');
  const [notifyPush, setNotifyPush] = useState(localStorage.getItem('notifyPush') !== 'false');
  const [notifyTasks, setNotifyTasks] = useState(localStorage.getItem('notifyTasks') !== 'false');
  const [notifyMentions, setNotifyMentions] = useState(localStorage.getItem('notifyMentions') !== 'false');

  const handleToggle = (key: string, setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
    const next = !current;
    setter(next);
    localStorage.setItem(key, String(next));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProfileError('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError('');
    setProfileSuccess(false);
    
    try {
      await updateProfile(name, bio, avatar, role);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);

    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      
      {/* Header / Title Area */}
      <div className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center rounded-xl">
          <User className="text-indigo-600 dark:text-indigo-400 w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            User Profile
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>

      {/* Top Row: User Summary (Horizontal) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden group flex flex-col md:flex-row items-center gap-8">
        
        {/* Avatar */}
        <div className="relative shrink-0 z-10">
          <div className="relative inline-block">
            <div className="w-32 h-32 rounded-full border-2 border-indigo-100 dark:border-indigo-900 p-1 group-hover:border-indigo-500 transition-colors duration-300">
              <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {avatar && (avatar.startsWith('http') || avatar.startsWith('data:image')) ? (
                  <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {(avatar || user.name.charAt(0)).substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-2.5 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95"
              title="Change Photo"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1 text-center md:text-left z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{user.name}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user.email}</p>
          
          <div className="flex justify-center md:justify-start mt-4">
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              {user.globalRole}
            </span>
          </div>
        </div>

        {/* Security Status */}
        <div className="shrink-0 w-full md:w-72 z-10 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 pt-6 md:pt-0 md:pl-8">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center justify-center md:justify-start gap-2">
            <Shield size={14} className="text-indigo-500" />
            Security Status
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-300">Status</span>
              <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                <Check size={12} /> Active
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-300">Two-Factor</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium px-2 py-0.5">
                Disabled
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Identity Details Form */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <User className="text-indigo-500" size={18} />
            Personal Information
          </h3>
          
          <form onSubmit={handleUpdateProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all rounded-lg text-sm"
                    placeholder="Your full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  System Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    disabled={user.globalRole !== 'admin'}
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none rounded-lg text-sm ${user.globalRole !== 'admin' ? 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-70' : 'bg-white dark:bg-gray-900'}`}
                  >
                    <option value="user">User</option>
                    <option value="executive">Executive</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="email" 
                  value={user.email}
                  disabled
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Bio
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none rounded-lg text-sm"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {profileError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm border border-red-200 dark:border-red-800">
                <AlertCircle size={16} />
                {profileError}
              </div>
            )}

            {profileSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-2 text-sm border border-green-200 dark:border-green-800">
                <Check size={16} />
                Profile updated successfully.
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                className="px-6 h-10 min-w-[140px]"
                loading={isUpdatingProfile}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </section>

        {/* Password Change Form */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Lock className="text-indigo-500" size={18} />
            Change Password
          </h3>
          
          <form onSubmit={handleChangePassword} className="space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all rounded-lg text-sm"
                    placeholder="Enter current password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all rounded-lg text-sm"
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all rounded-lg text-sm"
                    placeholder="Repeat new password"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2 text-sm border border-red-200 dark:border-red-800">
                  <AlertCircle size={16} />
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-2 text-sm border border-green-200 dark:border-green-800">
                  <Check size={16} />
                  Password updated successfully.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  variant="outline"
                  className="px-6 h-10 min-w-[140px]"
                  loading={isChangingPassword}
                >
                  Update Password
                </Button>
              </div>
            </div>
          </form>
        </section>

        {/* Notification Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BellRing className="text-indigo-500" size={18} />
            Notification Preferences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Delivery Methods</h4>
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                </div>
                <input type="checkbox" checked={notifyEmail} onChange={() => handleToggle('notifyEmail', setNotifyEmail, notifyEmail)} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Push Notifications</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications on this device</p>
                </div>
                <input type="checkbox" checked={notifyPush} onChange={() => handleToggle('notifyPush', setNotifyPush, notifyPush)} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer" />
              </label>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notify me about...</h4>
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Task Assignments</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">When you are assigned to a task</p>
                </div>
                <input type="checkbox" checked={notifyTasks} onChange={() => handleToggle('notifyTasks', setNotifyTasks, notifyTasks)} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mentions & Comments</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">When someone mentions you or replies</p>
                </div>
                <input type="checkbox" checked={notifyMentions} onChange={() => handleToggle('notifyMentions', setNotifyMentions, notifyMentions)} className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer" />
              </label>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
