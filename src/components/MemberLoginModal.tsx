import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BRAND } from '../styles/tokens';
import {
  X,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogIn,
  ShieldCheck,
  Clock,
  Sparkles,
} from 'lucide-react';

interface MemberLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export const MemberLoginModal: React.FC<MemberLoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { loginWithCredentials } = useAuth();
  const { isArabic, t } = useLanguage();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    name: string;
    isPending: boolean;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (!usernameOrEmail.trim()) {
      setError(isArabic ? 'يرجى إدخال اسم المستخدم أو البريد الإلكتروني.' : 'Please enter your username or email address.');
      return;
    }
    if (!password.trim()) {
      setError(isArabic ? 'يرجى إدخال كلمة المرور.' : 'Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await loginWithCredentials(usernameOrEmail, password);
      setLoading(false);

      if (!res.success) {
        setError(res.error || (isArabic ? 'فشل تسجيل الدخول. يرجى التحقق من صحة البيانات.' : 'Login failed. Please verify your credentials.'));
        return;
      }

      if (res.member) {
        setSuccessInfo({
          name: res.member.fullName,
          isPending: res.member.status === 'pending',
          email: res.member.professionalEmail,
        });

        setTimeout(() => {
          onClose();
          setSuccessInfo(null);
          setUsernameOrEmail('');
          setPassword('');
        }, 1800);
      }
    } catch {
      setLoading(false);
      setError(isArabic ? 'حدث خطأ غير متوقع أثناء تسجيل الدخول.' : 'An unexpected error occurred during login.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-white via-[#F0FDF4] to-[#F0F9FF] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={BRAND.logos.emblem}
              alt="Saudi German Health"
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
                {t.login.title}
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

        {/* Body */}
        <div className="p-6 space-y-5">
          {successInfo ? (
            <div className="py-6 text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center border-2 ${
                  successInfo.isPending
                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                    : 'bg-[#E6F4F1] text-[#008765] border-[#A7F3D0]'
                }`}
              >
                {successInfo.isPending ? (
                  <Clock className="w-8 h-8" />
                ) : (
                  <CheckCircle2 className="w-8 h-8" />
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  {successInfo.isPending
                    ? (isArabic ? 'مرحباً بك' : 'Welcome')
                    : (isArabic ? 'تم تسجيل الدخول بنجاح' : 'Signed In Successfully')}
                </h3>
                <p className="text-sm font-semibold text-[#008765]">
                  {successInfo.name}
                </p>
              </div>

              {successInfo.isPending ? (
                <div className={`p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                  <p className="font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{isArabic ? 'طلب عضويتكم قيد المراجعة حالياً' : 'Your membership is pending review'}</span>
                  </p>
                  <p className="text-amber-700 leading-relaxed text-[11px]">
                    {isArabic
                      ? `تقوم إدارة المستشفى السعودي الألماني بمراجعة ملفكم القيادي. فور اعتماد الحساب ستظهر بياناتكم في دليل القيادات المعتمدة.`
                      : `The administration is reviewing your leadership profile. Upon approval, your profile will be active in the community directory.`}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#E6F4F1] border border-[#A7F3D0] text-xs text-[#006B52] flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#008765]" />
                  <span className="font-bold">
                    {isArabic ? 'حساب قيادي معتمد بالكامل — مرحباً بكم' : 'Verified Executive Member — Welcome'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Username or Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t.login.userOrEmailLabel}
                </label>
                <div className="relative">
                  <User className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isArabic ? 'right-3.5' : 'left-3.5'}`} />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={e => setUsernameOrEmail(e.target.value)}
                    placeholder={t.login.userOrEmailPlaceholder}
                    dir="ltr"
                    className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#008765] focus:ring-1 focus:ring-[#008765] transition-all ${
                      isArabic ? 'pr-10 pl-3.5 text-right' : 'pl-10 pr-3.5 text-left'
                    }`}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  {t.login.passwordLabel}
                </label>
                <div className="relative">
                  <Lock className={`w-4 h-4 text-slate-400 absolute top-3.5 ${isArabic ? 'right-3.5' : 'left-3.5'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={t.login.passwordPlaceholder}
                    dir="ltr"
                    className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#008765] focus:ring-1 focus:ring-[#008765] transition-all ${
                      isArabic ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ${
                      isArabic ? 'left-3.5' : 'right-3.5'
                    }`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>{t.login.signingInBtn}</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{t.login.submitBtn}</span>
                  </>
                )}
              </button>

              {/* Switch to Register link */}
              <div className="pt-3 border-t border-slate-100 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  {t.login.noAccount}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToRegister();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008765] hover:text-[#006B52] transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.login.applyBtn}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
