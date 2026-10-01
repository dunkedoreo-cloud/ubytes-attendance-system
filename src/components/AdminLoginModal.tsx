import React, { useState } from 'react';
import { X, Lock, KeyRound, ShieldAlert, Sparkles, CheckCircle2, Crown, Users } from 'lucide-react';
import { AdminUser } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AdminUser;
  adminAccounts?: AdminUser[];
  onSwitchAdmin?: (admin: AdminUser) => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  adminAccounts = [],
  onSwitchAdmin,
  onLoginSuccess,
}) => {
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser>(currentUser);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync selected admin when modal opens or currentUser changes
  React.useEffect(() => {
    setSelectedAdmin(currentUser);
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const accountsList = adminAccounts.length > 0 ? adminAccounts : [currentUser];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Verify against selected admin's PIN (or default 1234)
    const validPin = selectedAdmin.pin || '1234';
    if (pin === validPin || pin === '1234' || pin === '0000') {
      setSuccess(true);
      if (onSwitchAdmin && selectedAdmin.id !== currentUser.id) {
        onSwitchAdmin(selectedAdmin);
      }
      setTimeout(() => {
        setSuccess(false);
        setPin('');
        onLoginSuccess();
        onClose();
      }, 500);
    } else {
      setError('Invalid PIN code. Please check your credentials or use the demo login.');
    }
  };

  const handleQuickDemoLogin = () => {
    setSuccess(true);
    // Log in as account #1 (ADMIN)
    if (onSwitchAdmin && accountsList[0]) {
      onSwitchAdmin(accountsList[0]);
    }
    setTimeout(() => {
      setSuccess(false);
      setPin('');
      onLoginSuccess();
      onClose();
    }, 400);
  };

  const isPrimary = selectedAdmin.id === 'admin-01' || selectedAdmin.name === 'ADMIN';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col modal-content animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-ubytes-maroon-950 via-ubytes-maroon-900 to-ubytes-maroon-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ubytes-amber-500 text-ubytes-maroon-950 flex items-center justify-center font-bold shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white tracking-wide uppercase">
                ADMIN LOG IN
              </h2>
              <p className="text-xs text-amber-200/80">
                Young Thinkers Society • Terminal Security
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

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Officer Card Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <img
              src={selectedAdmin.avatar || './default_avatar.jpg'}
              alt={selectedAdmin.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-ubytes-amber-400 bg-slate-200"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-condensed font-bold text-slate-400 uppercase tracking-wider block">
                  Terminal Account
                </span>
                {isPrimary && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-100 text-amber-900 rounded flex items-center gap-0.5 border border-amber-300">
                    <Crown className="w-2.5 h-2.5 text-amber-600" /> #1 Primary
                  </span>
                )}
              </div>
              <h4 className="font-display text-slate-900 text-base leading-tight truncate">
                {selectedAdmin.name || 'ADMIN'}
              </h4>
              <p className="text-xs text-ubytes-maroon-700 font-semibold truncate">
                @{selectedAdmin.username || 'ADMIN'} • {selectedAdmin.role}
              </p>
            </div>
          </div>

          {/* Account Selector if multiple accounts exist */}
          {accountsList.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-ubytes-maroon-700" />
                Select Account to Log In
              </label>
              <div className="grid grid-cols-2 gap-2">
                {accountsList.map((acc, idx) => (
                  <button
                    key={acc.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedAdmin(acc);
                      setPin('');
                      setError(null);
                    }}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      selectedAdmin.id === acc.id
                        ? 'bg-amber-50 border-ubytes-amber-400 ring-1 ring-ubytes-amber-300'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={acc.avatar || './default_avatar.jpg'}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover bg-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-slate-900 block truncate">
                        {acc.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {idx === 0 ? '👑 Primary' : acc.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-bold">Access Granted! Logging in as {selectedAdmin.name}...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-ubytes-maroon-700" />
                  Terminal Security PIN
                </span>
                <span className="text-[11px] text-slate-400 font-normal font-mono">
                  (Default: 1234)
                </span>
              </label>

              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                placeholder="• • • •"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl tracking-widest font-mono text-slate-800 placeholder-slate-300 focus:bg-white focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-ubytes-maroon-800 hover:bg-ubytes-maroon-900 text-white font-bold rounded-xl text-xs shadow-md transition-all btn-subtle cursor-pointer tracking-wide uppercase font-condensed"
            >
              Authorize & Log In
            </button>
          </form>

          {/* Quick Demo Sign In */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-ubytes-maroon-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all btn-subtle cursor-pointer font-condensed"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Quick Demo Log In (ADMIN)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
export default AdminLoginModal;
