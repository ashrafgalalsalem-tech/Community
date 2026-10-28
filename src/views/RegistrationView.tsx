import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BRAND } from '../styles/tokens';
import { repository } from '../lib/storage';
import { inspectHealthcareContent } from '../lib/sanitization';
import {
  Users,
  Award,
  Upload,
  Linkedin,
  Mail,
  User,
  Building2,
  Stethoscope,
  Phone,
  FileText,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Calendar,
} from 'lucide-react';

interface RegistrationViewProps {
  onNavigate: (view: string, param?: string) => void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({ onNavigate }) => {
  const { register, setIsMemberLoginOpen } = useAuth();
  const { isArabic, t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    professionalEmail: '',
    username: '',
    password: '',
    jobTitle: '',
    organization: '',
    specialty: '',
    phone: '',
    linkedinUrl: '',
    bio: '',
    profilePhotoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    consentDirectoryDisplay: true,
    consentPhotoPublish: true,
    consentFutureCommunications: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(isArabic ? 'يرجى اختيار ملف صورة صالح (JPG, PNG, WebP).' : 'Please select an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(isArabic ? 'يجب أن يكون حجم الصورة أقل من 5 ميجابايت.' : 'Image file size should be less than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        const dataUri = reader.result as string;
        try {
          const uploadRes = await repository.uploadImageAsync(dataUri, 'avatar');
          if (uploadRes.success && uploadRes.url) {
            setFormData(prev => ({ ...prev, profilePhotoUrl: uploadRes.url! }));
            return;
          }
        } catch {}
        setFormData(prev => ({ ...prev, profilePhotoUrl: dataUri }));
      }
    };
    reader.readAsDataURL(file);
  };

  const sampleAvatars = [
    { label: 'Executive 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80' },
    { label: 'Executive 2', url: 'https://images.unsplash.com/photo-1594824813571-638f02614d3f?auto=format&fit=crop&w=400&q=80' },
    { label: 'Executive 3', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80' },
    { label: 'Executive 4', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      setError(isArabic ? 'يرجى كتابة الاسم الثلاثي واللقب المهني.' : 'Please enter your full name and professional title.');
      return;
    }
    if (!formData.professionalEmail.trim() || !formData.professionalEmail.includes('@')) {
      setError(isArabic ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid professional email address.');
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setError(isArabic ? 'يرجى تحديد كلمة مرور لا تقل عن 4 أحرف لتأمين حسابكم.' : 'Please choose a password with at least 4 characters.');
      return;
    }
    if (!formData.jobTitle.trim() || !formData.organization.trim()) {
      setError(isArabic ? 'يرجى توضيح المسمى الوظيفي والمستشفى أو المؤسسة الصحية.' : 'Please specify your job title and hospital/organization.');
      return;
    }
    if (!formData.specialty.trim()) {
      setError(isArabic ? 'يرجى توضيح التخصص الطبي أو الإداري.' : 'Please specify your clinical or administrative specialty.');
      return;
    }

    // Safety checks
    const check = inspectHealthcareContent(formData.fullName + ' ' + (formData.bio || ''));
    if (!check.isSafe) {
      setError(check.reason || (isArabic ? 'فشل التحقق من أمان المدخلات.' : 'Input validation failed.'));
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        fullName: formData.fullName,
        professionalEmail: formData.professionalEmail,
        username: formData.username.trim() || formData.professionalEmail.split('@')[0],
        password: formData.password.trim(),
        jobTitle: formData.jobTitle,
        organization: formData.organization,
        specialty: formData.specialty,
        bio: formData.bio,
        profilePhotoUrl: formData.profilePhotoUrl,
        linkedinUrl: formData.linkedinUrl,
        phone: formData.phone,
        consentDirectoryDisplay: formData.consentDirectoryDisplay,
        consentPhotoPublish: formData.consentPhotoPublish,
        consentFutureCommunications: formData.consentFutureCommunications,
      });

      if (!res.success) {
        setError(res.error || (isArabic ? 'فشل التسجيل.' : 'Registration failed.'));
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccessSubmitted(true);
    } catch {
      setLoading(false);
      setError(isArabic ? 'حدث خطأ غير متوقع أثناء إرسال الطلب.' : 'An unexpected error occurred during submission.');
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-[calc(100vh-160px)] py-10 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* REGISTRATION FORM CONTAINER */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-white to-[#F8FAFC] border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4F1] border border-[#A7F3D0] text-[11px] font-bold text-[#006B52]">
                <Award className="w-3.5 h-3.5 text-[#008765]" />
                <span>{t.common.topEmployer}</span>
                <span>•</span>
                <span>{t.common.hospitalName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {t.registration.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                {t.registration.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsMemberLoginOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-[#008765]" />
              <span>{t.registration.alreadyAccountBtn}</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {successSubmitted ? (
              <div className="py-12 text-center space-y-6 max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-[#E6F4F1] text-[#008765] border-2 border-[#A7F3D0] mx-auto flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-slate-900">
                    {t.registration.successTitle}
                  </h3>
                  <p className="text-sm font-semibold text-[#008765]">
                    {t.registration.successSubtitle}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-2">
                    {t.registration.successDesc}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 ${isArabic ? 'text-right' : 'text-left'}`}>
                  <p className="font-bold text-slate-900">{t.registration.registeredDataTitle}</p>
                  <p>{isArabic ? 'الاسم:' : 'Name:'} <strong>{formData.fullName}</strong></p>
                  <p>{isArabic ? 'البريد الإلكتروني:' : 'Email:'} <strong>{formData.professionalEmail}</strong></p>
                  <p>{isArabic ? 'المنصب:' : 'Position:'} <strong>{formData.jobTitle} — {formData.organization}</strong></p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => onNavigate('rounds')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{t.registration.viewRoundsBtn}</span>
                  </button>
                  <button
                    onClick={() => setIsMemberLoginOpen(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-[#008765]" />
                    <span>{t.registration.signInNowBtn}</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">{t.common.error}</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {/* Section 1: Profile Photo */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <img
                      src={formData.profilePhotoUrl}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-[#008765] shadow-xs shrink-0"
                    />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-800">
                        {t.registration.photoTitle}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {t.registration.photoDesc}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#008765]" />
                          <span>{t.registration.uploadPhotoBtn}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preset Avatars */}
                  <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      {isArabic ? 'أو اختر صورة رمزية:' : 'Or choose executive avatar:'}
                    </span>
                    <div className="flex items-center gap-2">
                      {sampleAvatars.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormData({ ...formData, profilePhotoUrl: av.url })}
                          className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                            formData.profilePhotoUrl === av.url ? 'border-[#008765] scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2: Account Credentials & Identity */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#008765] flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> 1. {isArabic ? 'بيانات الحساب والاعتماد' : 'Account Credentials'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.fullNameLabel} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3' : 'left-3'}`} />
                        <input
                          type="text"
                          required
                          placeholder={t.registration.fullNamePlaceholder}
                          value={formData.fullName}
                          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                          className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors ${
                            isArabic ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Professional Email */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.emailLabel} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3' : 'left-3'}`} />
                        <input
                          type="email"
                          required
                          placeholder={t.registration.emailPlaceholder}
                          value={formData.professionalEmail}
                          onChange={e => setFormData({ ...formData, professionalEmail: e.target.value })}
                          className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors ${
                            isArabic ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Desired Username */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.usernameLabel}
                      </label>
                      <div className="relative">
                        <User className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3' : 'left-3'}`} />
                        <input
                          type="text"
                          placeholder={t.registration.usernamePlaceholder}
                          value={formData.username}
                          onChange={e => setFormData({ ...formData, username: e.target.value })}
                          className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors ${
                            isArabic ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.passwordLabel} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3' : 'left-3'}`} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder={t.registration.passwordPlaceholder}
                          value={formData.password}
                          onChange={e => setFormData({ ...formData, password: e.target.value })}
                          className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors ${
                            isArabic ? 'pr-9 pl-10 text-right' : 'pl-9 pr-10 text-left'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ${
                            isArabic ? 'left-3' : 'right-3'
                          }`}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Professional Appointment */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#008765] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" /> 2. {isArabic ? 'المنصب والمؤسسة الصحية' : 'Executive Leadership Details'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Job Title */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.jobTitleLabel} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.registration.jobTitlePlaceholder}
                        value={formData.jobTitle}
                        onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors"
                      />
                    </div>

                    {/* Organization */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.orgLabel} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.registration.orgPlaceholder}
                        value={formData.organization}
                        onChange={e => setFormData({ ...formData, organization: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors"
                      />
                    </div>

                    {/* Specialty */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.specialtyLabel} <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Stethoscope className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3' : 'left-3'}`} />
                        <input
                          type="text"
                          required
                          placeholder={t.registration.specialtyPlaceholder}
                          value={formData.specialty}
                          onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                          className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors ${
                            isArabic ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Phone / WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.phoneLabel}
                      </label>
                      <div className="relative">
                        <Phone className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3' : 'left-3'}`} />
                        <input
                          type="tel"
                          placeholder={t.registration.phonePlaceholder}
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors ${
                            isArabic ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'
                          }`}
                        />
                      </div>
                    </div>

                    {/* LinkedIn URL */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {t.registration.linkedinLabel}
                      </label>
                      <div className="relative">
                        <Linkedin className={`w-4 h-4 text-[#0A66C2] absolute top-3 ${isArabic ? 'right-3' : 'left-3'}`} />
                        <input
                          type="url"
                          placeholder={t.registration.linkedinPlaceholder}
                          value={formData.linkedinUrl}
                          onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                          className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors ${
                            isArabic ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Bio */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#008765]" />
                    <span>{t.registration.bioLabel}</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder={t.registration.bioPlaceholder}
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors"
                  />
                </div>

                {/* Section 5: Community Preferences */}
                <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#A7F3D0] space-y-2.5">
                  <span className="text-xs font-bold text-[#006B52] block">
                    {t.registration.consentTitle}
                  </span>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.consentDirectoryDisplay}
                      onChange={e => setFormData({ ...formData, consentDirectoryDisplay: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-[#008765] focus:ring-[#008765] accent-[#008765]"
                    />
                    <span className="text-xs text-slate-700">
                      {t.registration.consentDirectory}
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.consentFutureCommunications}
                      onChange={e => setFormData({ ...formData, consentFutureCommunications: e.target.checked })}
                      className="mt-0.5 rounded border-slate-300 text-[#008765] focus:ring-[#008765] accent-[#008765]"
                    />
                    <span className="text-xs text-slate-700">
                      {t.registration.consentComms}
                    </span>
                  </label>
                </div>

                {/* Submit button */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsMemberLoginOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#008765] font-semibold cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{t.registration.alreadyAccountBtn}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#008765] hover:bg-[#006B52] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? t.registration.submittingBtn : t.registration.submitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
