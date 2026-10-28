import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { repository } from '../lib/storage';
import { BRAND, LEADERSHIP_DOMAINS } from '../styles/tokens';
import { getLocalizedMember, getLocalizedCategory } from '../lib/localization';
import {
  Users,
  Search,
  Lock,
  Shield,
  Building2,
  Stethoscope,
  Mail,
  UserCheck,
  Clock,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Linkedin,
} from 'lucide-react';

interface DirectoryViewProps {
  onOpenRegister: () => void;
  onNavigate: (view: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ onNavigate }) => {
  const { isApproved, isPending } = useAuth();
  const { isArabic, t, language } = useLanguage();

  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 6;

  // ACCESS CONTROL GATE: Strict authentication check
  if (!isApproved) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#E6F4F1] border-2 border-[#A7F3D0] text-[#008765] mx-auto flex items-center justify-center shadow-xs">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-3">
          <span className="text-xs font-semibold text-[#008765] uppercase tracking-wider">
            {isArabic ? 'بوابة التحقق من صلاحيات العضوية القيادية' : 'Attribute-Based Access Control Gate'}
          </span>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900">
            {t.directory.title}
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            {isArabic
              ? 'وفقاً لضوابط الحوكمة وسرية الأعضاء، فإن الوصول إلى دليل القيادات يقتصر حصرياً على القيادات التنفيذية المعتمدة في المستشفيات.'
              : 'In compliance with healthcare governance and member privacy, access to the directory is restricted strictly to authenticated, approved healthcare executives.'}
          </p>
        </div>

        {isPending ? (
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>{isArabic ? 'طلب عضويتكم قيد المراجعة الإدارية' : 'Application Under Review'}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? `تم استلام ملفكم القيادي. تقوم لجنة الحوكمة الإدارية بمراجعة بياناتكم واعتمادها (${BRAND.adminBootstrapEmail}).`
                : `Your executive profile has been received. Our leadership board (${BRAND.adminBootstrapEmail}) is verifying your hospital credentials.`}
            </p>
            <button
              onClick={() => onNavigate('profile')}
              className="text-xs text-[#008765] font-semibold underline hover:text-[#006B52] cursor-pointer"
            >
              {isArabic ? 'متابعة حالة الطلب في ملفي الشخصي ←' : 'Check My Application Status →'}
            </button>
          </div>
        ) : (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <p className="text-xs text-slate-600">
              {isArabic
                ? 'هل أنت مدير مستشفى، مدير طبي، أو قائد لإدارة الكوادر الصحية والموارد البشرية في مصر؟'
                : 'Are you a hospital director, CMO, workforce executive, or healthcare leader in Egypt?'}
            </p>
            <button
              onClick={() => onNavigate('register')}
              className="w-full py-3 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              {t.home.applyBtn}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Get approved members respecting profile visibility consent
  const directoryMembers = repository.getDirectoryMembers();
  const allApprovedCount = repository.getMembers().filter(m => m.status === 'approved').length;
  const withheldDueToConsentCount = allApprovedCount - directoryMembers.length;

  // Extract unique specialties/domains for filtering
  const specialties = ['All', ...Array.from(new Set(directoryMembers.map(m => m.specialty)))];

  // Filtering
  const filteredMembers = directoryMembers.filter(m => {
    if (selectedSpecialty !== 'All' && m.specialty !== selectedSpecialty) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const loc = getLocalizedMember(m, language);
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.organization.toLowerCase().includes(q) ||
        m.jobTitle.toLowerCase().includes(q) ||
        m.specialty.toLowerCase().includes(q) ||
        loc.fullName.toLowerCase().includes(q) ||
        loc.organization.toLowerCase().includes(q) ||
        loc.jobTitle.toLowerCase().includes(q) ||
        loc.specialty.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E6F4F1] border border-[#A7F3D0] text-xs text-[#006B52] font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isArabic ? 'شبكة القيادات المعتمدة • الأعضاء المعتمدون فقط' : 'Approved Executive Network • Active Members Only'}</span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="text-[#008765] font-semibold">
              {isArabic ? `${directoryMembers.length} قائد معتمد` : `${directoryMembers.length} Leaders Listed`}
            </span>
            {withheldDueToConsentCount > 0 && (
              <span>({isArabic ? `${withheldDueToConsentCount} مفضل للخصوصية` : `${withheldDueToConsentCount} withheld by private consent`})</span>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-900">
          {t.directory.title}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          {isArabic
            ? 'دليل حصري للقيادات التنفيذية ومديري المستشفيات ورؤساء قطاعات رأس المال البشري والتعليم الطبي المعتمدين في مصر.'
            : 'An exclusive directory of hospital chief executives, medical directors, human capital leaders, and healthcare executives across Egypt.'}
        </p>
      </div>

      {/* Privacy Safeguard Notice */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <Shield className="w-4 h-4 text-[#008765] shrink-0" />
          <span>
            <strong>{isArabic ? 'حماية الخصوصية التنفيذية:' : 'Executive Privacy Safeguard:'}</strong>{' '}
            {isArabic
              ? 'أرقام الهواتف وبيانات الاعتماد الخاصة وسجلات المراجعة محمية ومحفوظة بسرية تامة ولا تظهر في هذا الدليل.'
              : 'Direct personal phones and internal administrative verification audit trails remain confidential and are never exposed publicly.'}
          </span>
        </div>
        <button
          onClick={() => onNavigate('profile')}
          className="text-xs text-[#008765] underline font-semibold hover:text-[#006B52] cursor-pointer"
        >
          {isArabic ? 'إعدادات الخصوصية في حسابي' : 'My Privacy Settings'}
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            placeholder={isArabic ? 'البحث بالاسم، المستشفى، أو التخصص...' : 'Search by name, organization, or specialty...'}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className={`w-full py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#008765] ${
              isArabic ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-slate-600">
          <Filter className="w-3.5 h-3.5 text-[#008765]" />
          <span>{isArabic ? 'المجال القيادي:' : 'Leadership Domain:'}</span>
          <select
            value={selectedSpecialty}
            onChange={e => {
              setSelectedSpecialty(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 focus:outline-none focus:bg-white cursor-pointer"
          >
            {specialties.map(spec => (
              <option key={spec} value={spec}>
                {spec === 'All' ? (isArabic ? 'كافة التخصصات القيادية' : 'All Leadership Areas') : getLocalizedCategory(spec, language)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedMembers.map(rawMember => {
          const member = getLocalizedMember(rawMember, language);
          return (
          <div
            key={member.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-[#008765] transition-all shadow-xs flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {member.profilePhotoUrl ? (
                  <img
                    src={member.profilePhotoUrl}
                    alt={member.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#A7F3D0] shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] text-[#008765] border border-[#A7F3D0] flex items-center justify-center font-bold text-xl shrink-0">
                    {member.fullName[0]}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-[#008765] transition-colors">
                    {member.fullName}
                  </h3>
                  <p className="text-xs text-[#008765] font-semibold truncate">
                    {member.jobTitle}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 truncate">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.organization}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Briefcase className="w-3.5 h-3.5 text-[#008765] shrink-0" />
                  <span className="font-medium text-slate-800">{member.specialty}</span>
                </div>
                {member.bio && (
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed pt-0.5">
                    {member.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-[#008765]" />
                <span>{isArabic ? 'عضو قيادي معتمد' : 'Verified Executive'}</span>
              </span>

              <div className="flex items-center gap-2">
                {member.linkedinUrl && (
                  <a
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-md text-slate-400 hover:text-[#0077B5] transition-colors"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                  </a>
                )}
                <a
                  href={`mailto:${member.professionalEmail}`}
                  className="flex items-center gap-1 text-slate-500 hover:text-[#008765] transition-colors text-[11px] font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تواصل' : 'Connect'}</span>
                </a>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-16 p-8 rounded-3xl bg-white border border-slate-200 space-y-3">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">{t.directory.noMembersFound}</h3>
          <p className="text-xs text-slate-500">
            {isArabic ? 'سيتم إدراج الأعضاء الجدد فور اعتماد طلباتهم.' : 'New approved executive applications will populate here automatically.'}
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <div className="text-xs text-slate-500">
            {isArabic ? (
              <span>
                عرض {startIndex + 1} - {Math.min(startIndex + pageSize, filteredMembers.length)} من إجمالي {filteredMembers.length} قائد معتمد
              </span>
            ) : (
              <span>
                Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredMembers.length)} of {filteredMembers.length} approved leaders
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                safeCurrentPage === 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isArabic ? 'السابق' : 'Previous'}</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  safeCurrentPage === page
                    ? 'bg-[#008765] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
                safeCurrentPage === totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
              }`}
              aria-label="Next page"
            >
              <span className="hidden sm:inline">{isArabic ? 'التالي' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
