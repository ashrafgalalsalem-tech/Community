import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BRAND } from '../styles/tokens';
import { CommunityLogo } from './CommunityLogo';
import { getLocalizedMember } from '../lib/localization';
import {
  Calendar,
  Layers,
  Users,
  LogOut,
  UserPlus,
  Menu,
  X,
  Award,
  Shield,
  LogIn,
  CheckCircle2,
  Clock,
  Globe,
  Building2,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenRegister?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { currentUser, isVisitor, isAdmin, logout, setIsMemberLoginOpen } = useAuth();
  const { isArabic, toggleLanguage, t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const locUser = currentUser ? getLocalizedMember(currentUser, language) : null;

  // Exact 5 approved navigation destinations
  const navItems = [
    { id: 'home', label: t.nav.overview, icon: Building2 },
    { id: 'register', label: t.nav.register, icon: UserPlus },
    { id: 'rounds', label: t.nav.rounds, icon: Calendar },
    { id: 'members', label: t.nav.members, icon: Users },
    { id: 'surfaces', label: t.nav.surfaces, icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs transition-colors">
      {/* Top Institutional Governance Strip */}
      <div className="bg-slate-50/90 border-b border-slate-200/80 py-1.5 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#008765] text-white font-bold text-[10px] tracking-wider uppercase">
              <Award className="w-3 h-3 text-[#FEF9C3]" />
              {isArabic ? 'التميز القيادي والتنفيذي' : 'Executive Leadership Excellence'}
            </span>
            <span className="hidden sm:inline text-slate-300" aria-hidden="true">|</span>
            <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">
              {isArabic ? 'شبكة القيادات التنفيذية والطبية' : 'Healthcare Executives & Medical Leaders Network'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-md font-semibold transition-colors cursor-pointer"
                title={t.common.adminConsole}
              >
                <Shield className="w-3 h-3 text-amber-600" />
                <span>{t.common.adminConsole}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Top Bar: 3-Zone Contract */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 lg:gap-8 h-20">
          {/* Zone 1: Executive Brand Mark & Community Identity */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765] rounded-lg p-1 group cursor-pointer shrink-0"
            aria-label={`${t.common.appName} - Home`}
          >
            <CommunityLogo size="md" isArabic={isArabic} />
            <div className={`border-slate-200 ${isArabic ? 'border-r pr-3 text-right' : 'border-l pl-3 text-left'}`}>
              <span className="text-base sm:text-lg font-bold text-slate-900 font-display leading-tight block group-hover:text-[#008765] transition-colors whitespace-nowrap">
                {t.common.appName}
              </span>
              <p className="text-[11px] font-semibold text-[#008765] tracking-wide whitespace-nowrap">
                {isArabic ? 'ملتقى قيادات المستشفيات والرعاية الصحية' : 'Executive Hospital & Medical Leadership'}
              </p>
            </div>
          </button>

          {/* Zone 2: Navigation Links (Single-Line, Clean Typography) */}
          <nav
            className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600"
            aria-label="Primary Navigation"
          >
            {navItems.map(item => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765] ${
                    active
                      ? 'bg-[#E6F4F1] text-[#006B52] border border-[#A7F3D0]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.icon className={`w-3.5 h-3.5 ${active ? 'text-[#008765]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Language Switcher, Sign In / Register, Profile) */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765]"
              title={t.common.langSwitchTitle}
              aria-label={t.common.langSwitchTitle}
            >
              <Globe className="w-3.5 h-3.5 text-[#008765]" />
              <span className="text-[#008765]">{t.common.langToggleText}</span>
            </button>

            {currentUser && !isVisitor ? (
              <div className={`flex items-center gap-2.5 border-slate-200 ${isArabic ? 'pr-2 border-r' : 'pl-2 border-l'}`}>
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765] rounded-lg p-1"
                  title={t.nav.profile}
                >
                  {currentUser.profilePhotoUrl ? (
                    <img
                      src={currentUser.profilePhotoUrl}
                      alt={(locUser || currentUser).fullName}
                      className="w-8 h-8 rounded-full object-cover border border-[#008765]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#008765] text-white flex items-center justify-center font-bold text-xs">
                      {(locUser || currentUser).fullName ? (locUser || currentUser).fullName[0] : 'U'}
                    </div>
                  )}
                  <div className={isArabic ? 'text-right' : 'text-left'}>
                    <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                      {(locUser || currentUser).fullName}
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      {currentUser.status === 'approved' ? (
                        <span className="text-[#008765] font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> {t.common.approved}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {t.common.pending}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title={t.common.signOut}
                  aria-label={t.common.signOut}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMemberLoginOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765]"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#008765]" />
                  <span>{t.common.signIn}</span>
                </button>

                <button
                  onClick={() => onNavigate('register')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#008765] hover:bg-[#006B52] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-[0.99] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.common.register}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg bg-slate-100 text-[#008765] font-bold text-xs border border-slate-200 flex items-center gap-1 cursor-pointer"
              title={t.common.langSwitchTitle}
              aria-label={t.common.langSwitchTitle}
            >
              <Globe className="w-4 h-4" />
              <span>{t.common.langToggleText}</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765]"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 shadow-md">
          <div className="space-y-1">
            {navItems.map(item => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#E6F4F1] text-[#006B52] font-semibold border border-[#A7F3D0]'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? 'text-[#008765]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {currentUser && !isVisitor ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold text-slate-800">
                  {(locUser || currentUser).fullName} ({currentUser.status === 'approved' ? t.common.approved : t.common.pending})
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  {t.common.signOut}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMemberLoginOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold text-center hover:bg-slate-200"
                >
                  {t.common.signIn}
                </button>
                <button
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-3 rounded-lg bg-[#008765] text-white text-xs font-bold text-center hover:bg-[#006B52]"
                >
                  {t.common.register}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
