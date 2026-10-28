import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BRAND } from '../styles/tokens';
import { CommunityLogo } from './CommunityLogo';
import { Shield, Award, MapPin, Lock, ChevronRight } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { isArabic, t } = useLanguage();

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 text-sm">
      {/* Top Banner with Executive Leadership Trust */}
      <div className="border-b border-slate-200/80 bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center md:text-left">
            <CommunityLogo size="md" isArabic={isArabic} />
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                {t.common.appName}
              </h3>
              <p className="text-xs font-semibold text-[#008765]">
                {isArabic ? 'ملتقى قيادات المستشفيات والرعاية الصحية' : 'Executive Healthcare Leadership Network'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#008765]" />
              <span>{isArabic ? 'التميز والاعتماد المؤسسي' : 'Institutional Leadership & Rigor'}</span>
            </div>
            <span className="hidden sm:inline text-slate-300" aria-hidden="true">•</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#0284C7]" />
              <span>{isArabic ? 'الحوكمة الإكلينيكية وإدارة المستشفيات' : 'Clinical Governance & Administration'}</span>
            </div>
            <span className="hidden sm:inline text-slate-300" aria-hidden="true">•</span>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#008765]" />
              <span>{isArabic ? 'إقرارات خصوصية مستقلة تماماً' : 'Strict Consent & Privacy Protected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Hospital Details & Location */}
        <div className="space-y-3 md:col-span-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.footer.desc}
          </p>
          <div className="text-xs text-slate-500 space-y-1.5 pt-1">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#008765] shrink-0 mt-0.5" />
              <span className="leading-relaxed">{t.footer.address}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Navigation Destinations */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
            {t.footer.quickLinks}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('home')}
                className="hover:text-[#008765] transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{t.nav.overview}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('register')}
                className="hover:text-[#008765] transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{t.nav.register}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('rounds')}
                className="hover:text-[#008765] transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{t.nav.rounds}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('members')}
                className="hover:text-[#008765] transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{t.nav.members}</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('surfaces')}
                className="hover:text-[#008765] transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span>{t.nav.surfaces}</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Professional Ethics & Privacy Principles */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
            {t.footer.ethicsTitle}
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li>• {isArabic ? 'إقرارات خصوصية مستقلة وموثقة' : 'Strict Independent Consent Isolation'}</li>
            <li>• {isArabic ? 'منع تداول أي بيانات خاصة بالمرضى' : 'Zero Patient Identifiers Permitted'}</li>
            <li>• {isArabic ? 'حوكمة نشر صور الحضور القيادي' : 'Dual-Key Attendees Gallery Privacy'}</li>
            <li>• {isArabic ? 'الالتزام بأخلاقيات المهنة الطبية' : 'Healthcare Syndicate Ethical Alignment'}</li>
          </ul>
        </div>

        {/* Column 4: Hospital Leadership Governance */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
            {t.common.adminConsole}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isArabic
              ? 'مخصص حصرياً للمديرين المعتمدين وأعضاء مجلس الحوكمة الطبية بالمستشفى.'
              : 'Reserved exclusively for authorized hospital leadership administrators and board members.'}
          </p>
          <button
            onClick={() => onNavigate('admin')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765]"
          >
            <Shield className="w-3.5 h-3.5 text-[#008765]" />
            <span>{t.common.adminConsole}</span>
          </button>
        </div>
      </div>

      {/* Bottom Copyright Strip */}
      <div className="border-t border-slate-200/80 py-5 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 bg-slate-50">
        <p className="max-w-7xl mx-auto">{t.footer.copyright}</p>
      </div>
    </footer>
  );
};
