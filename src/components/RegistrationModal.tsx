import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BRAND } from '../styles/tokens';
import { repository } from '../lib/storage';
import { inspectHealthcareContent } from '../lib/sanitization';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Mail,
  Building2,
  Stethoscope,
  Linkedin,
  Lock,
  Eye,
  EyeOff,
  LogIn,
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
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

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      setError(isArabic ? 'يرجى إدخال الاسم بالكامل.' : 'Please enter your full name.');
      return;
    }
    if (!formData.professionalEmail.trim() || !formData.professionalEmail.includes('@')) {
      setError(isArabic ? 'يرجى إدخال بريد إلكتروني صحيح.' : 'Please enter a valid professional email.');
      return;
    }
    if (!formData.password || formData.password.length < 4) {
      setError(isArabic ? 'يرجى تعيين كلمة مرور مكونة من 4 أحرف على الأقل.' : 'Password must be at least 4 characters.');
      return;
    }
    if (!formData.jobTitle.trim() || !formData.organization.trim()) {
      setError(isArabic ? 'يرجى تحديد المسمى الوظيفي والمستشفى أو المؤسسة.' : 'Please specify your job title and organization.');
      return;
    }

    const check = inspectHealthcareContent(formData.fullName);
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
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch {
      setLoading(false);
      setError(isArabic ? 'حدث خطأ غير متوقع أثناء إرسال الطلب.' : 'An unexpected error occurred.');
    }
  };

  const sampleAvatars = [
    { label: 'Executive 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80' },
    { label: 'Executive 2', url: 'https://images.unsplash.com/photo-1594824813571-638f02614d3f?auto=format&fit=crop&w=400&q=80' },
    { label: 'Executive 3', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-white via-[#F0FDF4] to-[#F0F9FF] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={BRAND.logos.emblem}
              alt="Saudi German Hospital"
              className="h-10 w-auto object-contain"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#008765]"></span>
                <span className="text-[10px] font-bold tracking-wider text-[#008765] uppercase">
                  {t.common.topEmployer}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {t.registration.title}
              </h2>
              <p className="text-[11px] text-slate-500">{t.common.hospitalName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {successSubmitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E6F4F1] text-[#008765] border-2 border-[#A7F3D0] mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {t.registration.successTitle}
              </h3>
              <p className="text-sm font-semibold text-[#008765]">
                {t.registration.successSubtitle}
              </p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                {t.registration.successDesc}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>{error}</div>
                </div>
              )}

              {/* Photo Upload Row */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <img
                  src={formData.profilePhotoUrl}
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#008765] shrink-0"
                />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    {t.registration.photoTitle}
                  </span>
                  <div className="flex items-center gap-2">
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-[#008765]" />
                      <span>{t.registration.uploadPhotoBtn}</span>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      {isArabic ? 'أو نماذج:' : 'Or samples:'}
                    </span>
                    {sampleAvatars.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, profilePhotoUrl: av.url })}
                        className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 hover:scale-110 transition-all cursor-pointer"
                      >
                        <img src={av.url} alt="av" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Account Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.registration.fullNameLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isArabic ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      required
                      placeholder={t.registration.fullNamePlaceholder}
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      className={`w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765] ${
                        isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.registration.emailLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isArabic ? 'right-3' : 'left-3'}`} />
                    <input
                      type="email"
                      required
                      placeholder={t.registration.emailPlaceholder}
                      value={formData.professionalEmail}
                      onChange={e => setFormData({ ...formData, professionalEmail: e.target.value })}
                      className={`w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765] ${
                        isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.registration.usernameLabel}
                  </label>
                  <div className="relative">
                    <User className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isArabic ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      placeholder={t.registration.usernamePlaceholder}
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className={`w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765] ${
                        isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.registration.passwordLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isArabic ? 'right-3' : 'left-3'}`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={t.registration.passwordPlaceholder}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765] ${
                        isArabic ? 'pr-9 pl-8 text-right' : 'pl-9 pr-8 text-left'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer ${
                        isArabic ? 'left-2.5' : 'right-2.5'
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.registration.jobTitleLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t.registration.jobTitlePlaceholder}
                    value={formData.jobTitle}
                    onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.registration.orgLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isArabic ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      required
                      placeholder={t.registration.orgPlaceholder}
                      value={formData.organization}
                      onChange={e => setFormData({ ...formData, organization: e.target.value })}
                      className={`w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765] ${
                        isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.registration.specialtyLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Stethoscope className={`w-4 h-4 text-slate-400 absolute top-2.5 ${isArabic ? 'right-3' : 'left-3'}`} />
                    <input
                      type="text"
                      required
                      placeholder={t.registration.specialtyPlaceholder}
                      value={formData.specialty}
                      onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                      className={`w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765] ${
                        isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {t.registration.linkedinLabel}
                  </label>
                  <div className="relative">
                    <Linkedin className={`w-4 h-4 text-[#0A66C2] absolute top-2.5 ${isArabic ? 'right-3' : 'left-3'}`} />
                    <input
                      type="url"
                      placeholder={t.registration.linkedinPlaceholder}
                      value={formData.linkedinUrl}
                      onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      className={`w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765] ${
                        isArabic ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Consents */}
              <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#A7F3D0] space-y-2">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentDirectoryDisplay}
                    onChange={e => setFormData({ ...formData, consentDirectoryDisplay: e.target.checked })}
                    className="mt-0.5 rounded text-[#008765] focus:ring-[#008765] accent-[#008765]"
                  />
                  <span className="text-xs text-slate-700">
                    {t.registration.consentDirectory}
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consentFutureCommunications}
                    onChange={e => setFormData({ ...formData, consentFutureCommunications: e.target.checked })}
                    className="mt-0.5 rounded text-[#008765] focus:ring-[#008765] accent-[#008765]"
                  />
                  <span className="text-xs text-slate-700">
                    {t.registration.consentComms}
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setIsMemberLoginOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#008765] font-bold hover:underline cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t.registration.alreadyAccountBtn}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? t.registration.submittingBtn : t.registration.submitBtn}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
