import React, { useState, useEffect } from 'react';
import { 
  X, User, Shield, KeyRound, Mail, Check, LogOut, Camera, Upload, 
  ImagePlus, Users, UserPlus, Crown, CheckCircle2, ChevronRight, AtSign
} from 'lucide-react';
import { AdminUser } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUser;
  adminAccounts?: AdminUser[];
  onUpdateProfile: (updated: AdminUser) => void;
  onRegisterAdmin?: (newAdmin: AdminUser) => void;
  onSwitchAdmin?: (admin: AdminUser) => void;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  './default_avatar.jpg',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop&crop=faces'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  adminAccounts = [],
  onUpdateProfile,
  onRegisterAdmin,
  onSwitchAdmin,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'accounts'>('profile');

  // Active Admin Profile Fields
  const [username, setUsername] = useState(currentUser.username || 'ADMIN');
  const [name, setName] = useState(currentUser.name || 'ADMIN');
  const [role, setRole] = useState(currentUser.role || 'System Administrator');
  const [email, setEmail] = useState(currentUser.email || 'admin@ub.edu.ph');
  const [avatar, setAvatar] = useState(currentUser.avatar || './default_avatar.jpg');
  const [pin, setPin] = useState(currentUser.pin || '1234');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // New Admin Account Registration State
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Executive Officer');
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('1234');
  const [newAvatar, setNewAvatar] = useState('./default_avatar.jpg');
  const [registerSuccessToast, setRegisterSuccessToast] = useState<string | null>(null);

  // Sync state when currentUser changes
  useEffect(() => {
    setUsername(currentUser.username || 'ADMIN');
    setName(currentUser.name || 'ADMIN');
    setRole(currentUser.role || 'System Administrator');
    setEmail(currentUser.email || 'admin@ub.edu.ph');
    setAvatar(currentUser.avatar || './default_avatar.jpg');
    setPin(currentUser.pin || '1234');
  }, [currentUser]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNewAdminImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setNewAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateProfile({
      ...currentUser,
      username: username.trim() || 'ADMIN',
      name: name.trim() || 'ADMIN',
      role: role.trim() || 'System Administrator',
      email: email.trim(),
      avatar: avatar.trim() || './default_avatar.jpg',
      pin: pin.trim() || '1234',
    });

    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 800);
  };

  const handleCreateNewAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim()) return;

    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      username: newUsername.trim(),
      name: newName.trim(),
      role: newRole.trim() || 'Executive Officer',
      email: newEmail.trim() || `${newUsername.trim().toLowerCase()}@ub.edu.ph`,
      avatar: newAvatar || './default_avatar.jpg',
      pin: newPin.trim() || '1234',
      isLoggedIn: false
    };

    if (onRegisterAdmin) {
      onRegisterAdmin(newAdmin);
    }

    setRegisterSuccessToast(`✓ Registered new admin account "${newAdmin.name}"!`);
    setShowRegisterForm(false);
    setNewUsername('');
    setNewName('');
    setNewEmail('');
    setNewPin('1234');
    setNewAvatar('./default_avatar.jpg');

    setTimeout(() => {
      setRegisterSuccessToast(null);
    }, 4000);
  };

  const accountsList = adminAccounts.length > 0 ? adminAccounts : [currentUser];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col modal-content animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-ubytes-maroon-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ubytes-amber-500 text-ubytes-maroon-950 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white tracking-wide uppercase">
                ADMINISTRATION & ACCOUNTS
              </h2>
              <p className="text-xs text-amber-200/80">
                Young Thinkers Society • Executive Control
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center btn-subtle cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'border-ubytes-maroon-900 text-ubytes-maroon-950 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Active Admin Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'accounts'
                ? 'border-ubytes-maroon-900 text-ubytes-maroon-950 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admin Accounts ({accountsList.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-6 space-y-5">
          {registerSuccessToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{registerSuccessToast}</span>
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              
              {/* Avatar and Quick Identity Header */}
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <label className="relative group cursor-pointer flex-shrink-0" title="Click to upload from gallery">
                  <img
                    src={avatar || './default_avatar.jpg'}
                    alt={name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-ubytes-amber-400 shadow-md group-hover:brightness-90 transition-all bg-slate-200"
                  />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-slate-900 text-lg truncate leading-tight">
                      {name || 'ADMIN'}
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Active
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full flex items-center gap-1 border border-amber-300">
                      <Crown className="w-3 h-3 text-amber-600" /> #1 Primary
                    </span>
                  </div>
                  <p className="text-xs text-ubytes-maroon-700 font-semibold truncate flex items-center gap-1 mt-0.5">
                    <span>@{username || 'ADMIN'}</span>
                    <span>•</span>
                    <span>{role || 'System Administrator'}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {email || 'admin@ub.edu.ph'}
                  </p>
                </div>
              </div>

              {/* Preset Avatar & Gallery Upload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-ubytes-maroon-700" />
                    Avatar Selection
                  </label>

                  <label
                    className="flex items-center gap-1.5 text-xs font-bold text-ubytes-maroon-800 hover:text-ubytes-maroon-950 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1 rounded-lg cursor-pointer transition-all btn-subtle shadow-sm"
                    title="Select a photo from your gallery or files"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upload from Gallery</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setAvatar(url)}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all cursor-pointer bg-slate-100 ${
                        avatar === url
                          ? 'border-ubytes-amber-500 ring-2 ring-ubytes-amber-300 scale-105'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      title={idx === 0 ? 'No Profile (Default Silhouette)' : `Preset ${idx + 1}`}
                    >
                      <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white font-bold text-center leading-tight py-0.5">
                          Default
                        </div>
                      )}
                    </button>
                  ))}

                  {/* Gallery circular upload button */}
                  <label
                    className={`w-11 h-11 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                      !PRESET_AVATARS.includes(avatar) && avatar
                        ? 'border-ubytes-amber-500 ring-2 ring-ubytes-amber-300 bg-amber-50/50'
                        : 'border-slate-300 hover:border-ubytes-amber-500 hover:bg-amber-50/40 text-slate-500 hover:text-ubytes-maroon-800'
                    }`}
                    title="Upload custom photo from gallery"
                  >
                    <ImagePlus className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-ubytes-maroon-700" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none transition-all font-mono"
                    placeholder="ADMIN"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-ubytes-maroon-700" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none transition-all"
                    placeholder="ADMIN"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-ubytes-maroon-700" />
                    Organization Role
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none transition-all"
                    placeholder="System Administrator"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    University Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none transition-all"
                    placeholder="admin@ub.edu.ph"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-500" />
                    Terminal PIN (4-Digits)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center tracking-widest focus:bg-white focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none transition-all"
                    placeholder="1234"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 btn-subtle transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs btn-subtle cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-ubytes-amber-500 hover:bg-ubytes-amber-600 text-ubytes-maroon-950 font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 btn-subtle cursor-pointer"
                  >
                    {showSavedToast ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-900" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>

            </form>
          ) : (
            /* Accounts List & Registration Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Registered Admin Accounts
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Account #1 is permanently the primary Administrator account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRegisterForm(!showRegisterForm)}
                  className="px-3 py-1.5 bg-ubytes-maroon-800 hover:bg-ubytes-maroon-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm btn-subtle"
                >
                  {showRegisterForm ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{showRegisterForm ? 'Close Form' : 'Register New Admin'}</span>
                </button>
              </div>

              {/* Registration Sub-form */}
              {showRegisterForm && (
                <form onSubmit={handleCreateNewAdmin} className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3 animate-new-row shadow-sm">
                  <h4 className="font-bold text-xs text-ubytes-maroon-950 uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-ubytes-maroon-800" />
                    Register New Admin Account
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. supervisor"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Maria Clara"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Role</label>
                      <input
                        type="text"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        placeholder="e.g. Executive Officer"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Security PIN (4-Digits) *</label>
                      <input
                        type="password"
                        maxLength={6}
                        required
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="1234"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-center tracking-widest"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">University Email</label>
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="e.g. mclara@ub.edu.ph"
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Avatar Selection</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setNewAvatar(url)}
                            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer bg-slate-100 ${
                              newAvatar === url
                                ? 'border-ubytes-amber-500 ring-2 ring-ubytes-amber-300 scale-105'
                                : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                            title={idx === 0 ? 'No Profile (Default Silhouette)' : `Preset ${idx + 1}`}
                          >
                            <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-amber-200">
                    <button
                      type="button"
                      onClick={() => setShowRegisterForm(false)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-ubytes-maroon-800 hover:bg-ubytes-maroon-900 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Register Admin</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Accounts List */}
              <div className="space-y-2.5">
                {accountsList.map((account, index) => {
                  const isPrimary = index === 0;
                  const isActive = currentUser.id === account.id || (!account.id && isPrimary);

                  return (
                    <div
                      key={account.id || index}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-amber-50/50 border-ubytes-amber-400 ring-1 ring-ubytes-amber-300 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={account.avatar || './default_avatar.jpg'}
                            alt={account.name}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-ubytes-amber-400/70 bg-slate-200"
                          />
                          {isActive && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-bold text-xs text-slate-900 truncate">
                              {account.name}
                            </h5>
                            {isPrimary && (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded flex items-center gap-0.5 border border-amber-300">
                                <Crown className="w-2.5 h-2.5 text-amber-600" /> #1 Primary
                              </span>
                            )}
                            {isActive && (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ubytes-maroon-800 font-semibold truncate">
                            @{account.username || account.name} • {account.role}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {account.email || 'admin@ub.edu.ph'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isActive ? (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            Current
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSwitchAdmin && onSwitchAdmin(account)}
                            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-ubytes-maroon-800 hover:text-ubytes-maroon-900 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all btn-subtle shadow-xs cursor-pointer"
                          >
                            <span>Switch</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
export default UserProfileModal;
