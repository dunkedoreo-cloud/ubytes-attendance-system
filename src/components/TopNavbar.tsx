import React, { useState } from 'react';
import { CreditCard, LayoutDashboard, Users, Calendar, Zap, Lock } from 'lucide-react';
import { AdminUser } from '../types';
import ubytesLogo from '../assets/ubytes_logo.png';

interface TopNavbarProps {
  activeView: 'kiosk' | 'dashboard';
  setActiveView: (view: 'kiosk' | 'dashboard') => void;
  onOpenDirectory: () => void;
  onOpenEvents: () => void;
  onOpenCloudSync: () => void;
  isCloudSyncActive: boolean;
  hardwareStatus: boolean;
  currentUser: AdminUser;
  onOpenProfile: () => void;
  onOpenLogin: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeView,
  setActiveView,
  onOpenDirectory,
  onOpenEvents,
  onOpenCloudSync,
  isCloudSyncActive,
  currentUser,
  onOpenProfile,
  onOpenLogin,
}) => {
  return (
    <header className="bg-gradient-to-r from-[#3d050a] via-[#520911] to-[#3d050a] text-white px-4 md:px-8 min-h-[76px] sm:min-h-[82px] md:h-22 py-2.5 sm:py-3 border-b-[3px] border-ubytes-amber-500/80 flex items-center justify-between gap-4 sticky top-0 z-50 shadow-xl select-none backdrop-blur-md flex-nowrap">
      
      {/* LEFT: Brand Identity */}
      <div 
        className="flex items-center gap-3 sm:gap-3.5 md:gap-4 flex-shrink-0 cursor-pointer group" 
        onClick={() => setActiveView('kiosk')}
        title="University of Bohol - Young Thinkers Society"
      >
        <img
          src={ubytesLogo}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('ubytes_logo')) {
              target.src = './ubytes_logo.png';
            }
          }}
          alt="Young Thinkers Society Logo"
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-[66px] lg:h-[66px] object-contain drop-shadow-md group-hover:scale-105 transition-transform flex-shrink-0"
        />
        <div className="flex flex-col justify-center items-start leading-none font-montserrat">
          <span className="font-montserrat text-xs sm:text-sm md:text-base lg:text-[17px] font-medium tracking-[0.16em] sm:tracking-[0.18em] text-white uppercase leading-none select-none">
            UNIVERSITY OF BOHOL
          </span>
          <h1 className="font-montserrat text-lg sm:text-2xl md:text-3xl lg:text-[28px] font-black tracking-tight text-white uppercase leading-none mt-1 sm:mt-1.5 drop-shadow-sm select-none">
            YOUNG THINKERS SOCIETY
          </h1>
        </div>
      </div>

      {/* CENTER: Main View Switcher (Segmented Pill) */}
      <div className="hidden md:flex items-center bg-[#290306]/90 p-1 rounded-xl border border-white/10 shadow-inner flex-shrink-0">
        <button
          onClick={() => setActiveView('kiosk')}
          className={`btn-subtle px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 font-condensed tracking-wider uppercase active:scale-[0.97] ${
            activeView === 'kiosk'
              ? 'bg-gradient-to-r from-ubytes-amber-500 to-amber-400 text-ubytes-maroon-950 shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>RFID Tap Station</span>
        </button>

        <button
          onClick={() => setActiveView('dashboard')}
          className={`btn-subtle px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 font-condensed tracking-wider uppercase active:scale-[0.97] ${
            activeView === 'dashboard'
              ? 'bg-gradient-to-r from-ubytes-amber-500 to-amber-400 text-ubytes-maroon-950 shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Executive Dashboard</span>
        </button>
      </div>

      {/* RIGHT: Actions, Hardware Status & Officer Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        
        {/* Navigation Toolbar */}
        <div className="hidden sm:flex items-center gap-1 bg-black/25 p-1 rounded-xl border border-white/10">
          <button
            onClick={onOpenDirectory}
            className="btn-subtle active:scale-[0.96] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-100/90 hover:text-white hover:bg-white/10 transition-all font-condensed tracking-wide"
            title="Student Directory & RFID Mapping"
          >
            <Users className="w-3.5 h-3.5 text-ubytes-amber-400" />
            <span className="hidden lg:inline">Directory</span>
          </button>

          <button
            onClick={onOpenEvents}
            className="btn-subtle active:scale-[0.96] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-100/90 hover:text-white hover:bg-white/10 transition-all font-condensed tracking-wide"
            title="Event Sessions & Timing"
          >
            <Calendar className="w-3.5 h-3.5 text-ubytes-amber-400" />
            <span className="hidden lg:inline">Sessions</span>
          </button>

          <button
            onClick={onOpenCloudSync}
            className="btn-subtle active:scale-[0.96] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-100/90 hover:text-white hover:bg-white/10 transition-all font-condensed tracking-wide"
            title="Supabase & Google Sheets Sync"
          >
            <Zap className={`w-3.5 h-3.5 ${isCloudSyncActive ? 'text-ubytes-amber-400' : 'text-amber-200/70'}`} />
            <span className="hidden lg:inline">Cloud Sync</span>
            {isCloudSyncActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-ubytes-amber-400 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* RFID Scanner Status Pill - UB Brand Palette */}
        <div className="flex items-center gap-1.5 bg-[#290306]/90 border border-ubytes-amber-500/40 text-ubytes-amber-300 px-2.5 py-1.5 rounded-xl shadow-sm text-xs font-condensed">
          <span className="w-2 h-2 rounded-full bg-ubytes-amber-400 animate-pulse"></span>
          <span className="font-bold tracking-wide uppercase hidden sm:inline">RFID Ready</span>
        </div>

        {/* Officer Avatar & Identity OR Admin Login */}
        {currentUser.isLoggedIn ? (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 border-l border-white/15 hover:opacity-90 transition-opacity cursor-pointer group text-left btn-subtle"
            title="Manage Admin Profile"
          >
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full ring-2 ring-ubytes-amber-400/80 group-hover:ring-ubytes-amber-300 object-cover shadow transition-all"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ubytes-amber-400 border-2 border-[#3d050a]"></span>
            </div>
            <div className="hidden xl:block text-left text-xs leading-none">
              <span className="font-bold block text-white font-condensed group-hover:text-ubytes-amber-300 transition-colors">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-amber-200/70 font-condensed">
                {currentUser.role}
              </span>
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-ubytes-amber-500 hover:bg-ubytes-amber-400 text-ubytes-maroon-950 rounded-xl text-xs font-bold shadow-md transition-all btn-subtle font-condensed uppercase tracking-wider ml-1 cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-ubytes-maroon-950" />
            <span>Admin Log In</span>
          </button>
        )}

      </div>

    </header>
  );
};

export default TopNavbar;
