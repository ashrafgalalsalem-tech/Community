import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BRAND } from '../styles/tokens';
import { getLocalizedMember } from '../lib/localization';
import {
  User,
  Shield,
  Clock,
  CheckCircle2,
  Mail,
  Stethoscope,
  FileText,
  Save,
} from 'lucide-react';

interface ProfileViewProps {
  onOpenRegister: () => void;
  onNavigate: (view: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onNavigate }) => {
  const { currentUser, isVisitor, isPending, isAdmin, updateConsents } = useAuth();
  const { isArabic, t, language } = useLanguage();

  const [dirConsent, setDirConsent] = useState(currentUser?.consentDirectoryDisplay ?? true);
  const [photoConsent, setPhotoConsent] = useState(currentUser?.consentPhotoPublish ?? false);
  const [commConsent, setCommConsent] = useState(currentUser?.consentFutureCommunications ?? true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const locUser = currentUser ? getLocalizedMember(currentUser, language) : null;

  if (isVisitor || !currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <User className="w-16 h-16 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900">
          {isArabic ? 'لا توجد جلسة نشطة' : 'No Active Session'}
        </h2>
        <p className="text-sm text-slate-600">
          {isArabic
            ? 'يرجى تقديم طلب تسجيل عضوية أو تسجيل الدخول إلى حسابكم القيادي.'
            : 'Please submit a registration application on the homepage or sign in to your executive account.'}
        </p>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-semibold shadow-xs cursor-pointer"
        >
          {t.common.register}
        </button>
      </div>
    );
  }

  const handleSaveConsents = () => {
    updateConsents({
      consentDirectoryDisplay: dirConsent,
      consentPhotoPublish: photoConsent,
      consentFutureCommunications: commConsent,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-[#008765] uppercase tracking-wider">
          {isArabic ? 'مركز الحساب والخصوصية' : 'Account & Privacy Center'}
        </span>
        <h1 className="text-3xl font-bold text-slate-900">
          {t.profile.title}
        </h1>
        <p className="text-xs text-slate-500">{t.profile.subtitle}</p>
      </div>

      {/* Status Banner */}
      {isPending ? (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
          <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-900">
              {isArabic ? 'حالة الطلب: قيد المراجعة الإدارية' : 'Application Status: Pending Governance Review'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? `تم استلام طلبكم بتاريخ ${new Date(currentUser.joinedAt).toLocaleDateString('ar-EG')}. يقوم مجلس إدارة المستشفى السعودي الألماني بمراجعة المؤهلات.`
                : `Your registration application was received on ${new Date(currentUser.joinedAt).toLocaleDateString()}. The SGH Egypt governance board (${BRAND.adminBootstrapEmail}) validates credentials before directory activation.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-900">
              {isArabic ? 'العضوية القيادية: معتمدة ونشطة بالكامل' : 'Executive Membership: Approved & Active'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? 'حساب قيادي معتمد. لديكم وصول كامل لحجز مقاعد الراوندات ودليل الأعضاء وحلقات النقاش.'
                : 'Verified clinical leadership status. You have unrestricted access to RSVPs, the private directory, and strategic discussions.'}
            </p>
          </div>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] text-[#008765] flex items-center justify-center font-bold text-xl border border-[#A7F3D0]">
              {(locUser || currentUser).fullName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{(locUser || currentUser).fullName}</h2>
              <p className="text-xs font-semibold text-[#008765]">{(locUser || currentUser).jobTitle}</p>
              <p className="text-xs text-slate-500">{(locUser || currentUser).organization}</p>
            </div>
          </div>

          <div className={isArabic ? 'text-right sm:text-left' : 'text-left sm:text-right'}>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${
              isAdmin ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isAdmin ? (isArabic ? 'مدير نظام' : 'Administrator') : (isArabic ? 'عضو معتمد' : 'Approved Member')}
            </span>
            <span className="block text-[10px] text-slate-400 mt-1">ID: {currentUser.id}</span>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Mail className="w-3.5 h-3.5 text-[#008765]" /> {isArabic ? 'البريد الإلكتروني المهني' : 'Professional Email'}
            </span>
            <div className="font-semibold text-slate-900">{currentUser.professionalEmail}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Stethoscope className="w-3.5 h-3.5 text-[#0284C7]" /> {isArabic ? 'التخصص الطبي / الإداري' : 'Specialty'}
            </span>
            <div className="font-semibold text-slate-900">{(locUser || currentUser).specialty}</div>
          </div>
        </div>

        {(locUser || currentUser).bio && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> {isArabic ? 'النبذة المهنية' : 'Executive Bio'}
            </span>
            <p className="text-slate-600 leading-relaxed">{(locUser || currentUser).bio}</p>
          </div>
        )}
      </div>

      {/* Consent & Privacy Controls */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#008765]" />
              <h3 className="text-lg font-bold text-slate-900">
                {t.profile.privacyConsentsTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {isArabic ? 'التحكم في ظهور بياناتك المهنية وإشعارات الملتقى.' : 'Manage your personal directory and notification preferences.'}
            </p>
          </div>

          <button
            onClick={handleSaveConsents}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{t.common.save}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isArabic ? 'تم حفظ التفضيلات بنجاح.' : 'Privacy preferences saved successfully.'}</span>
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900">
                1. {isArabic ? 'إظهار الملف في دليل الأعضاء الخاص' : 'Private Members Directory Display'}
              </span>
              <p className="text-[11px] text-slate-500">
                {isArabic ? 'عرض اسمك ومسماك ومستشفاك في الدليل المخصص للقيادات.' : 'Show your name, title, and hospital in the private directory.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={dirConsent}
              onChange={e => setDirConsent(e.target.checked)}
              className="mt-1 rounded text-[#008765] focus:ring-[#008765] w-4 h-4 accent-[#008765]"
            />
          </label>

          <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900">
                2. {isArabic ? 'نشر الصور في معرض حضور الراوندات' : 'Attendees Gallery Photo Publishing (Dual-Key Rule)'}
              </span>
              <p className="text-[11px] text-slate-500">
                {isArabic ? 'السماح بنشر الصور في معرض الراوند فقط عند تأكيد الحضور الفعلي.' : 'Allow photo publishing in round galleries ONLY if you attended and were verified.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={photoConsent}
              onChange={e => setPhotoConsent(e.target.checked)}
              className="mt-1 rounded text-[#008765] focus:ring-[#008765] w-4 h-4 accent-[#008765]"
            />
          </label>

          <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900">
                3. {isArabic ? 'استلام دعوات الراوندات والإشعارات' : 'Future Round Communications'}
              </span>
              <p className="text-[11px] text-slate-500">
                {isArabic ? 'تلقي الدعوات الرسمية للراوندات القادمة المنعقدة بالمستشفى السعودي الألماني.' : 'Receive official invitations to upcoming SGH Egypt roundtables.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={commConsent}
              onChange={e => setCommConsent(e.target.checked)}
              className="mt-1 rounded text-[#008765] focus:ring-[#008765] w-4 h-4 accent-[#008765]"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
