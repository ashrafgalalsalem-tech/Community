import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { repository, BrandSettings, DEFAULT_BRAND_SETTINGS } from '../lib/storage';
import { BRAND, TOPIC_CATEGORIES, TopicCategory } from '../styles/tokens';
import { Member, Round, PartnerAccreditation, MembershipBenefit, PartnerRelationshipType, VerificationStatus, EventType, Topic, Comment, MembershipStatus, UserRole } from '../types';
import { generateCsv, triggerDownload } from '../lib/sanitization';
import {
  Shield,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  PlusCircle,
  Lock,
  Search,
  Award,
  Activity,
  Check,
  X,
  MessageSquare,
  Eye,
  EyeOff,
  Trash2,
  LogOut,
  Sparkles,
  Pin,
  Mail,
  Send,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Edit3,
  Sliders,
  ExternalLink,
  Layers,
  BookOpen,
  AlertTriangle,
  Loader2,
  Upload,
  Database,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { AiRoundCreatorModal } from '../components/AiRoundCreatorModal';

export const AdminPortalView: React.FC = () => {
  const { currentUser, isAdmin, loginAs, logout, loginWithCredentials } = useAuth();
  const { isArabic, t } = useLanguage();
  const [adminUsernameInput, setAdminUsernameInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'members' | 'branding' | 'topics' | 'comments' | 'rounds' | 'partners' | 'benefits' | 'attendance' | 'audit'>('members');
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [membersList, setMembersList] = useState<Member[]>(() => repository.getMembers());
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [statusAlert, setStatusAlert] = useState<{
    type: 'success' | 'warning';
    memberName: string;
    email: string;
    message: string;
  } | null>(null);

  // Member management modals state
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editMemberForm, setEditMemberForm] = useState<{
    fullName: string;
    jobTitle: string;
    organization: string;
    specialty: string;
    bio: string;
    professionalEmail: string;
    linkedinUrl: string;
    status: MembershipStatus;
    role: UserRole;
  }>({
    fullName: '',
    jobTitle: '',
    organization: '',
    specialty: '',
    bio: '',
    professionalEmail: '',
    linkedinUrl: '',
    status: 'approved',
    role: 'approved_member',
  });
  const [rejectingMember, setRejectingMember] = useState<Member | null>(null);
  const [memberEditLoading, setMemberEditLoading] = useState(false);
  const [memberEditError, setMemberEditError] = useState<string | null>(null);

  // Topics management state
  const [topicsList, setTopicsList] = useState<Topic[]>(() => repository.getTopics(true));
  const [topicStatusFilter, setTopicStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [topicSearch, setTopicSearch] = useState('');
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editTopicForm, setEditTopicForm] = useState<{
    title: string;
    category: TopicCategory;
    body: string;
  }>({
    title: '',
    category: 'Human Capital Management',
    body: '',
  });
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null);

  // Comments management state
  const [commentsList, setCommentsList] = useState<Comment[]>(() => repository.getComments(undefined, true));
  const [commentStatusFilter, setCommentStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [commentTopicFilter, setCommentTopicFilter] = useState<string>('all');
  const [deletingComment, setDeletingComment] = useState<Comment | null>(null);

  // Round creation state
  const [isCreateRoundOpen, setIsCreateRoundOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [newRoundTitle, setNewRoundTitle] = useState('Inaugural Executive Roundtable: Healthcare Workforce Resilience, Talent Retention & Leadership Development');
  const [newRoundTopic, setNewRoundTopic] = useState('Sustainable Hospital Leadership, Workforce Retention & Organizational Effectiveness');
  const [newRoundDesc, setNewRoundDesc] = useState('An executive roundtable convening C-suite directors, medical directors, and healthcare leaders across the region.');
  const [newRoundEventType, setNewRoundEventType] = useState<EventType>('roundtable');
  const [newRoundDate, setNewRoundDate] = useState('27 October 2026');
  const [newRoundTime, setNewRoundTime] = useState('10:00 AM - 02:30 PM (EET)');
  const [newRoundVenue, setNewRoundVenue] = useState('Executive Healthcare Center Grand Auditorium, Cairo, Egypt');
  const [newRoundCapacity, setNewRoundCapacity] = useState('75');
  const [newRoundStatus, setNewRoundStatus] = useState<Round['status']>('published');
  const [roundActionMsg, setRoundActionMsg] = useState<string | null>(null);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [roundsList, setRoundsList] = useState<Round[]>(() => repository.getRounds());

  // Deletion modals state
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [deletingRound, setDeletingRound] = useState<Round | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<PartnerAccreditation | null>(null);
  const [deletingBenefit, setDeletingBenefit] = useState<MembershipBenefit | null>(null);
  const [deletingLogoIndex, setDeletingLogoIndex] = useState<(1 | 2) | null>(null);
  const [deletingSpeaker, setDeletingSpeaker] = useState<{ id: string; name: string } | null>(null);
  const [deletingAgendaIdx, setDeletingAgendaIdx] = useState<{ index: number; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Speaker and agenda management inside editingRound
  const [speakerFormOpen, setSpeakerFormOpen] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [newSpeakerTitle, setNewSpeakerTitle] = useState('');
  const [newSpeakerOrg, setNewSpeakerOrg] = useState('');
  const [newSpeakerBio, setNewSpeakerBio] = useState('');
  const [newSpeakerPhoto, setNewSpeakerPhoto] = useState('');

  const [agendaFormOpen, setAgendaFormOpen] = useState(false);
  const [newAgendaTime, setNewAgendaTime] = useState('');
  const [newAgendaTitle, setNewAgendaTitle] = useState('');
  const [newAgendaSpeaker, setNewAgendaSpeaker] = useState('');
  const [newAgendaDesc, setNewAgendaDesc] = useState('');

  // Partners & Accreditations state
  const [partnersList, setPartnersList] = useState<PartnerAccreditation[]>(() => repository.getPartners());
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerAccreditation | null>(null);
  const [partnerOrgName, setPartnerOrgName] = useState('');
  const [partnerLogoUrl, setPartnerLogoUrl] = useState('');
  const [partnerRelType, setPartnerRelType] = useState<PartnerRelationshipType>('Hospital Network Accreditation');
  const [partnerDesc, setPartnerDesc] = useState('');
  const [partnerVerStatus, setPartnerVerStatus] = useState<VerificationStatus>('verified');
  const [partnerDisplayOrder, setPartnerDisplayOrder] = useState('1');
  const [partnerIsActive, setPartnerIsActive] = useState(true);
  const [partnerWebsiteUrl, setPartnerWebsiteUrl] = useState('');

  // Membership Benefits state
  const [benefitsList, setBenefitsList] = useState<MembershipBenefit[]>(() => repository.getBenefits());
  const [isBenefitModalOpen, setIsBenefitModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<MembershipBenefit | null>(null);
  const [benefitTitle, setBenefitTitle] = useState('');
  const [benefitCategory, setBenefitCategory] = useState<MembershipBenefit['category']>('Academy & Education');
  const [benefitDesc, setBenefitDesc] = useState('');
  const [benefitConditions, setBenefitConditions] = useState('');
  const [benefitIconName, setBenefitIconName] = useState('GraduationCap');
  const [benefitDisplayOrder, setBenefitDisplayOrder] = useState('1');
  const [benefitIsActive, setBenefitIsActive] = useState(true);
  const [benefitTermsUrl, setBenefitTermsUrl] = useState('');

  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  const [partnerUploading, setPartnerUploading] = useState(false);
  const [speakerUploading, setSpeakerUploading] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<any>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);

  const [adminLoginLoading, setAdminLoginLoading] = useState(false);

  // Brand & Logo Management State
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(() => repository.getBrandSettings());
  const [logo1Url, setLogo1Url] = useState(brandSettings.primaryLogoUrl || DEFAULT_BRAND_SETTINGS.primaryLogoUrl);
  const [logo2Url, setLogo2Url] = useState(brandSettings.secondaryLogoUrl || DEFAULT_BRAND_SETTINGS.secondaryLogoUrl);
  const [logo1Alt, setLogo1Alt] = useState(brandSettings.logo1Alt || DEFAULT_BRAND_SETTINGS.logo1Alt);
  const [logo2Alt, setLogo2Alt] = useState(brandSettings.logo2Alt || DEFAULT_BRAND_SETTINGS.logo2Alt);
  const [brandPlatformName, setBrandPlatformName] = useState(brandSettings.platformName || DEFAULT_BRAND_SETTINGS.platformName);
  const [brandPlatformNameAr, setBrandPlatformNameAr] = useState(brandSettings.platformNameAr || DEFAULT_BRAND_SETTINGS.platformNameAr);
  const [brandSaveLoading, setBrandSaveLoading] = useState(false);
  const [brandSaveSuccess, setBrandSaveSuccess] = useState<string | null>(null);
  const [brandSaveError, setBrandSaveError] = useState<string | null>(null);
  const [uploadingLogo1, setUploadingLogo1] = useState(false);
  const [uploadingLogo2, setUploadingLogo2] = useState(false);

  // Administrative Re-Authentication State
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);

  // AUTHORIZATION GATE WITH SECURE SERVER AUTHENTICATION
  const hasServerToken = Boolean(repository.getAdminToken() || repository.getSessionToken());
  if (!isAdmin || !currentUser || !hasServerToken) {
    const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      setAdminLoginLoading(true);

      const cleanUser = (adminUsernameInput.trim() || currentUser?.professionalEmail || 'Ashrafgalalsalem@gmail.com').toLowerCase();
      const cleanPass = adminPasswordInput.trim();

      try {
        const result = await loginWithCredentials(cleanUser, cleanPass);
        setAdminLoginLoading(false);

        if (result.success && result.role === 'administrator') {
          setAdminPasswordInput('');
          setLoginError('');
        } else {
          setLoginError(
            result.error ||
              (isArabic
                ? 'بيانات الدخول غير صحيحة أو الحساب ليس لديه صلاحيات الإدارة.'
                : 'Invalid admin credentials or account lacks administrator privileges.')
          );
        }
      } catch {
        setAdminLoginLoading(false);
        setLoginError(isArabic ? 'حدث خطأ أثناء تسجيل الدخول.' : 'An error occurred during authentication.');
      }
    };

    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#E6F4F1] border-2 border-[#A7F3D0] text-[#008765] mx-auto flex items-center justify-center shadow-xs">
          <Shield className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">
            {t.admin.title}
          </h1>
          <p className="text-xs text-slate-500">
            {t.admin.subtitle}
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm text-left space-y-5">
          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs leading-relaxed">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.login.userOrEmailLabel}
              </label>
              <input
                type="text"
                required
                autoComplete="off"
                placeholder={t.login.userOrEmailPlaceholder}
                value={adminUsernameInput}
                onChange={e => setAdminUsernameInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {t.login.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="off"
                  placeholder={t.login.passwordPlaceholder}
                  value={adminPasswordInput}
                  onChange={e => setAdminPasswordInput(e.target.value)}
                  className={`w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors ${
                    isArabic ? 'pl-10 pr-3.5' : 'pl-3.5 pr-10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer ${
                    isArabic ? 'left-3' : 'right-3'
                  }`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold tracking-wide shadow-xs transition-all hover:shadow-md cursor-pointer mt-2"
            >
              {t.common.signIn}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const refreshAdminData = async () => {
    setLoadingMembers(true);
    try {
      const [members, rounds, partners, benefits, topics, comments, bSettings] = await Promise.all([
        repository.fetchMembers(true),
        repository.fetchRoundsAsync(),
        repository.fetchPartnersAsync(),
        repository.fetchBenefitsAsync(),
        repository.fetchTopicsAsync(true),
        repository.fetchCommentsAsync(undefined, true),
        repository.fetchBrandSettingsAsync(),
      ]);
      setMembersList(members);
      setRoundsList(rounds);
      setPartnersList(partners);
      setBenefitsList(benefits);
      setTopicsList(topics);
      setCommentsList(comments);
      if (bSettings) {
        setBrandSettings(bSettings);
        setLogo1Url(bSettings.primaryLogoUrl);
        setLogo2Url(bSettings.secondaryLogoUrl);
        setLogo1Alt(bSettings.logo1Alt);
        setLogo2Alt(bSettings.logo2Alt);
        setBrandPlatformName(bSettings.platformName);
        setBrandPlatformNameAr(bSettings.platformNameAr);
      }
    } catch {
      setMembersList(repository.getMembers());
      setRoundsList(repository.getRounds());
      setPartnersList(repository.getPartners());
      setBenefitsList(repository.getBenefits());
      setTopicsList(repository.getTopics(true));
      setCommentsList(repository.getComments(undefined, true));
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleUploadLogoFile = (logoIndex: 1 | 2) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoIndex === 1) setUploadingLogo1(true);
    else setUploadingLogo2(true);
    setBrandSaveError(null);
    setBrandSaveSuccess(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const res = await repository.uploadImageAsync(dataUrl, logoIndex === 1 ? 'logo_horizontal' : 'logo_emblem');
      if (logoIndex === 1) setUploadingLogo1(false);
      else setUploadingLogo2(false);

      if (res.success && res.url) {
        if (logoIndex === 1) setLogo1Url(res.url);
        else setLogo2Url(res.url);
        setBrandSaveSuccess(
          isArabic
            ? 'تم رفع ملف الشعار بنجاح. اضغط حفظ التغييرات لتثبيته في قاعدة البيانات.'
            : 'Logo image uploaded successfully. Click Save Changes to persist to database.'
        );
      } else {
        setBrandSaveError(res.error || 'Failed to upload logo.');
      }
    };
    reader.onerror = () => {
      if (logoIndex === 1) setUploadingLogo1(false);
      else setUploadingLogo2(false);
      setBrandSaveError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrandSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandSaveLoading(true);
    setBrandSaveError(null);
    setBrandSaveSuccess(null);

    const res = await repository.updateBrandSettingsAsync({
      primaryLogoUrl: logo1Url.trim(),
      secondaryLogoUrl: logo2Url.trim(),
      logo1Alt: logo1Alt.trim(),
      logo2Alt: logo2Alt.trim(),
      platformName: brandPlatformName.trim(),
      platformNameAr: brandPlatformNameAr.trim(),
    });

    setBrandSaveLoading(false);
    if (res.success && res.settings) {
      setBrandSettings(res.settings);
      setBrandSaveSuccess(
        isArabic
          ? 'تم حفظ وتثبيت إعدادات الشعار والهوية بنجاح في قاعدة البيانات المستدامة.'
          : 'Brand settings and official logos successfully saved to persistent database.'
      );
    } else {
      setBrandSaveError(res.error || 'Failed to save brand settings.');
      if (res.error?.includes('Unauthorized') || res.error?.includes('authorization required')) {
        setReauthOpen(true);
      }
    }
  };

  const handleResetBrandToDefaults = () => {
    setLogo1Url(DEFAULT_BRAND_SETTINGS.primaryLogoUrl);
    setLogo2Url(DEFAULT_BRAND_SETTINGS.secondaryLogoUrl);
    setLogo1Alt(DEFAULT_BRAND_SETTINGS.logo1Alt);
    setLogo2Alt(DEFAULT_BRAND_SETTINGS.logo2Alt);
    setBrandPlatformName(DEFAULT_BRAND_SETTINGS.platformName);
    setBrandPlatformNameAr(DEFAULT_BRAND_SETTINGS.platformNameAr);
    setBrandSaveSuccess(
      isArabic
        ? 'تمت استعادة مسارات شعارات الأكاديمية الرسمية. اضغط حفظ لتثبيتها.'
        : 'Official Academy logo paths restored. Click Save Changes to persist.'
    );
  };

  const handleInitiateDeleteLogo = (index: 1 | 2) => {
    setDeleteError(null);
    setDeletingLogoIndex(index);
  };

  const handleConfirmDeleteLogo = async () => {
    if (!deletingLogoIndex) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const idx = deletingLogoIndex;
      const res = await repository.removeBrandLogoAsync(idx);
      if (res.success) {
        if (idx === 1) setLogo1Url('');
        else setLogo2Url('');
        setDeletingLogoIndex(null);
        await refreshAdminData();
        setStatusAlert({
          type: 'warning',
          memberName: `Logo ${idx}`,
          email: '',
          message: isArabic
            ? `تم حذف الشعار ${idx === 1 ? 'الأول (العرضي)' : 'الثاني (الرأسي)'} نهائياً وحفظ التغيير في قاعدة البيانات.`
            : `Logo ${idx} successfully removed and permanently deleted from the database.`,
        });
      } else {
        setDeleteError(res.error || `Failed to remove Logo ${deletingLogoIndex}`);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error removing logo');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReauthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReauthLoading(true);
    setReauthError(null);
    const cleanUser = (currentUser?.professionalEmail || 'Ashrafgalalsalem@gmail.com').toLowerCase();
    const cleanPass = reauthPassword.trim();
    const res = await loginWithCredentials(cleanUser, cleanPass);
    setReauthLoading(false);

    if (res.success && res.role === 'administrator') {
      setReauthOpen(false);
      setReauthPassword('');
      await refreshAdminData();
      setStatusAlert({
        type: 'success',
        memberName: 'Administrator',
        email: cleanUser,
        message: isArabic
          ? 'تم تجديد جلسة الإدارة وتوثيق الهوية مع السيرفر بنجاح.'
          : 'Administrative session successfully renewed and verified with server.',
      });
    } else {
      setReauthError(res.error || (isArabic ? 'كلمة المرور غير صحيحة.' : 'Incorrect password.'));
    }
  };

  useEffect(() => {
    if (isAdmin) {
      refreshAdminData();
    }
  }, [isAdmin, activeTab]);

  const allMembers = membersList;
  const allRounds = roundsList;
  const allTopics = topicsList;
  const allComments = commentsList;
  const auditLogs = repository.getAuditLogs();

  const pendingCount = allMembers.filter(m => m.status === 'pending').length;
  const approvedCount = allMembers.filter(m => m.status === 'approved').length;
  const pendingTopicsCount = allTopics.filter(t => t.status === 'pending' || (t.status as any) === 'pending_review').length;
  const pendingCommentsCount = allComments.filter(c => c.status === 'pending' || (c.status as any) === 'pending_moderation').length;

  const filteredMembers = allMembers.filter(m => {
    if (memberStatusFilter !== 'all' && m.status !== memberStatusFilter) return false;
    if (memberSearch.trim()) {
      const q = memberSearch.toLowerCase();
      return (
        m.fullName.toLowerCase().includes(q) ||
        m.professionalEmail.toLowerCase().includes(q) ||
        (m.username && m.username.toLowerCase().includes(q)) ||
        m.organization.toLowerCase().includes(q) ||
        m.jobTitle.toLowerCase().includes(q) ||
        m.specialty.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApproveMember = async (memberId: string) => {
    const member = membersList.find(m => m.id === memberId);
    const res = await repository.updateMemberStatusAsync(memberId, 'approved', currentUser.id);
    if (res.success) {
      await refreshAdminData();
      setStatusAlert({
        type: 'success',
        memberName: member ? member.fullName : 'Applicant',
        email: member ? member.professionalEmail : '',
        message: isArabic
          ? `تم اعتماد عضوية ${member?.fullName || ''} بنجاح وحفظها في قاعدة بيانات المجتمع.`
          : `Member application approved successfully. Status set to Approved in the community database.`,
      });
    }
  };

  const handleInitiateRejectMember = (member: Member) => {
    setRejectingMember(member);
  };

  const handleConfirmRejectMember = async () => {
    if (!rejectingMember) return;
    const memberId = rejectingMember.id;
    const member = rejectingMember;
    setRejectingMember(null);
    const res = await repository.updateMemberStatusAsync(memberId, 'rejected', currentUser.id);
    if (res.success) {
      await refreshAdminData();
      setStatusAlert({
        type: 'warning',
        memberName: member.fullName,
        email: member.professionalEmail,
        message: isArabic
          ? `تم تحديث حالة طلب ${member.fullName} إلى مرفوض في قاعدة البيانات.`
          : `Member application for ${member.fullName} rejected. Status set to Rejected.`,
      });
    }
  };

  const handleOpenViewMember = (member: Member) => {
    setViewingMember(member);
  };

  const handleOpenEditMember = (member: Member) => {
    setEditingMember(member);
    setEditMemberForm({
      fullName: member.fullName,
      jobTitle: member.jobTitle,
      organization: member.organization,
      specialty: member.specialty,
      bio: member.bio || '',
      professionalEmail: member.professionalEmail,
      linkedinUrl: member.linkedinUrl || '',
      status: member.status,
      role: member.role || 'approved_member',
    });
    setMemberEditError(null);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setMemberEditLoading(true);
    setMemberEditError(null);
    try {
      const res = await repository.updateMemberAsync(editingMember.id, {
        fullName: editMemberForm.fullName.trim(),
        jobTitle: editMemberForm.jobTitle.trim(),
        organization: editMemberForm.organization.trim(),
        specialty: editMemberForm.specialty.trim(),
        bio: editMemberForm.bio.trim(),
        professionalEmail: editMemberForm.professionalEmail.trim(),
        linkedinUrl: editMemberForm.linkedinUrl.trim(),
        status: editMemberForm.status,
        role: editMemberForm.role,
      });
      if (res.success) {
        setEditingMember(null);
        await refreshAdminData();
        setStatusAlert({
          type: 'success',
          memberName: editMemberForm.fullName,
          email: editMemberForm.professionalEmail,
          message: isArabic
            ? `تم تحديث بيانات العضو ${editMemberForm.fullName} بنجاح.`
            : `Profile for ${editMemberForm.fullName} updated successfully.`,
        });
      } else {
        setMemberEditError(res.error || 'Failed to update member profile');
        if (res.error?.includes('Unauthorized') || res.error?.includes('authorization')) {
          setReauthOpen(true);
        }
      }
    } catch (err: any) {
      setMemberEditError(err.message || 'Error updating member profile');
    } finally {
      setMemberEditLoading(false);
    }
  };

  const handleDeleteMember = (member: Member) => {
    if (member.id === 'admin_ashraf') {
      alert(isArabic ? 'لا يمكن حذف حساب المشرف الرئيسي للنظام.' : 'The root administrator account cannot be deleted.');
      return;
    }
    setDeleteError(null);
    setDeletingMember(member);
  };

  const handleConfirmDeleteMember = async () => {
    if (!deletingMember) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await repository.deleteMemberAsync(deletingMember.id);
      if (res.success) {
        const deletedName = deletingMember.fullName;
        const deletedEmail = deletingMember.professionalEmail;
        setDeletingMember(null);
        await refreshAdminData();
        setStatusAlert({
          type: 'warning',
          memberName: deletedName,
          email: deletedEmail,
          message: isArabic
            ? `تم حذف العضو ${deletedName} نهائياً من قاعدة البيانات.`
            : `Member ${deletedName} permanently deleted from database.`,
        });
      } else {
        const errText = res.error || (isArabic ? 'فشل حذف العضو.' : 'Failed to delete member.');
        setDeleteError(errText);
        if (
          errText.includes('Unauthorized') ||
          errText.includes('authorization') ||
          errText.includes('توثيق')
        ) {
          setReauthOpen(true);
        }
      }
    } catch (err: any) {
      const msg = err?.message || '';
      setDeleteError(
        msg.includes('JSON') || msg.includes('<')
          ? (isArabic
              ? 'السيرفر قيد إعادة التشغيل أو التحديث. يرجى إعادة المحاولة بعد لحظات.'
              : 'The server is temporarily restarting or updating. Please try again in a moment.')
          : msg || (isArabic ? 'حدث خطأ أثناء حذف العضو.' : 'Error deleting member.')
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Topics Handlers
  const handleModerateTopic = async (topicId: string, status: 'approved' | 'rejected' | 'pinned') => {
    const res = await repository.moderateTopicAsync(topicId, status, currentUser.id);
    if (res.success) {
      await refreshAdminData();
      setStatusAlert({
        type: 'success',
        memberName: 'Topic',
        email: '',
        message: isArabic
          ? `تم تحديث حالة الأطروحة بنجاح إلى: ${status === 'approved' ? 'معتمد' : status === 'rejected' ? 'مرفوض' : 'مثبت'}.`
          : `Topic status updated to ${status}.`,
      });
    }
  };

  const handleOpenEditTopic = (t: Topic) => {
    setEditingTopic(t);
    setEditTopicForm({
      title: t.title,
      category: t.category as TopicCategory,
      body: t.body,
    });
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    const res = await repository.updateTopicAsync(editingTopic.id, {
      title: editTopicForm.title.trim(),
      category: editTopicForm.category,
      body: editTopicForm.body.trim(),
    });
    if (res.success) {
      setEditingTopic(null);
      await refreshAdminData();
      setStatusAlert({
        type: 'success',
        memberName: 'Topic',
        email: '',
        message: isArabic ? 'تم تحديث الأطروحة بنجاح.' : 'Discussion topic updated successfully.',
      });
    }
  };

  const handleConfirmDeleteTopic = async () => {
    if (!deletingTopic) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await repository.deleteTopicAsync(deletingTopic.id);
      if (res.success) {
        setDeletingTopic(null);
        await refreshAdminData();
        setStatusAlert({
          type: 'warning',
          memberName: 'Topic',
          email: '',
          message: isArabic ? 'تم حذف الأطروحة نهائياً.' : 'Topic permanently deleted.',
        });
      } else {
        setDeleteError(res.error || 'Failed to delete topic');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting topic');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Comments Handlers
  const handleModerateComment = async (commentId: string, status: 'approved' | 'rejected') => {
    const res = await repository.moderateCommentAsync(commentId, status, currentUser.id);
    if (res.success) {
      await refreshAdminData();
      setStatusAlert({
        type: 'success',
        memberName: 'Reflection',
        email: '',
        message: isArabic
          ? `تم تحديث حالة المداخلة إلى: ${status === 'approved' ? 'معتمد' : 'مرفوض'}.`
          : `Comment status updated to ${status}.`,
      });
    }
  };

  const handleConfirmDeleteComment = async () => {
    if (!deletingComment) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await repository.deleteCommentAsync(deletingComment.id);
      if (res.success) {
        setDeletingComment(null);
        await refreshAdminData();
        setStatusAlert({
          type: 'warning',
          memberName: 'Reflection',
          email: '',
          message: isArabic ? 'تم حذف المداخلة نهائياً.' : 'Comment permanently deleted.',
        });
      } else {
        setDeleteError(res.error || 'Failed to delete comment');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting comment');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoundTitle.trim() || !newRoundTopic.trim() || !newRoundDate.trim()) {
      setRoundActionMsg('Please complete required fields.');
      return;
    }

    const res = await repository.saveRoundAsync(
      {
        title: newRoundTitle.trim(),
        topic: newRoundTopic.trim(),
        description: newRoundDesc.trim(),
        scheduledDate: newRoundDate.trim(),
        scheduledTime: newRoundTime.trim(),
        durationMinutes: 270,
        venue: newRoundVenue.trim(),
        venueType: 'in_person',
        maxCapacity: parseInt(newRoundCapacity) || 60,
        status: newRoundStatus,
        isFirstAdminConfirmedRound: newRoundDate.includes('27 October 2026'),
        speakers: [
          {
            id: 'spk_' + Date.now(),
            name: currentUser.fullName,
            title: currentUser.jobTitle,
            organization: currentUser.organization,
          },
        ],
        agenda: [
          {
            time: '10:00 - 10:30',
            title: 'Welcome & Executive Briefing',
            description: 'Opening remarks by hospital leadership.',
          },
          {
            time: '10:30 - 12:30',
            title: 'Clinical Peer Roundtable',
            description: 'Structured leadership case studies.',
          },
        ],
        eventType: newRoundEventType,
      },
      currentUser.id
    );

    if (res && res.id) {
      setSelectedRoundId(res.id);
      setRoundActionMsg('Round published successfully to database!');
      await refreshAdminData();
      setTimeout(() => {
        setIsCreateRoundOpen(false);
        setRoundActionMsg(null);
      }, 1800);
    }
  };

  const handleDeleteRound = (round: Round) => {
    setDeleteError(null);
    setDeletingRound(round);
  };

  const handleConfirmDeleteRound = async () => {
    if (!deletingRound) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const roundTitle = deletingRound.title;
      const res = await repository.deleteRoundAsync(deletingRound.id);
      if (res.success) {
        setDeletingRound(null);
        await refreshAdminData();
        setStatusAlert({
          type: 'warning',
          memberName: 'Leadership Round',
          email: '',
          message: isArabic
            ? `تم حذف الجولة القيادية "${roundTitle}" نهائياً من قاعدة البيانات.`
            : `Leadership round "${roundTitle}" permanently deleted from database.`,
        });
      } else {
        setDeleteError(res.error || 'Failed to delete round.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting round.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveEditingRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRound) return;
    const res = await repository.saveRoundAsync(editingRound, currentUser.id);
    if (res && res.id) {
      setEditingRound(null);
      setRoundActionMsg('Round updated successfully in database!');
      await refreshAdminData();
      setTimeout(() => setRoundActionMsg(null), 2000);
    }
  };

  const handleUploadSpeakerPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Speaker photo size must be less than 5MB.');
      return;
    }
    setSpeakerUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const uploadRes = await repository.uploadImageAsync(reader.result as string, 'speaker');
        if (uploadRes.success && uploadRes.url) {
          setNewSpeakerPhoto(uploadRes.url);
        } else {
          alert(uploadRes.error || 'Failed to upload speaker photo.');
        }
      } catch (err: any) {
        alert(err.message || 'Failed to upload speaker photo.');
      } finally {
        setSpeakerUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSpeakerToRound = () => {
    if (!newSpeakerName.trim() || !editingRound) return;
    const newSpeaker = {
      id: 'spk_' + Date.now(),
      name: newSpeakerName.trim(),
      title: newSpeakerTitle.trim() || 'Distinguished Speaker',
      organization: newSpeakerOrg.trim() || 'Saudi German Hospital',
      bio: newSpeakerBio.trim() || undefined,
      avatarUrl: newSpeakerPhoto.trim() || undefined,
    };
    setEditingRound({
      ...editingRound,
      speakers: [...(editingRound.speakers || []), newSpeaker],
    });
    setNewSpeakerName('');
    setNewSpeakerTitle('');
    setNewSpeakerOrg('');
    setNewSpeakerBio('');
    setNewSpeakerPhoto('');
    setSpeakerFormOpen(false);
  };

  const handleInitiateDeleteSpeaker = (speaker: { id: string; name: string }) => {
    setDeletingSpeaker(speaker);
  };

  const handleConfirmDeleteSpeaker = () => {
    if (!editingRound || !deletingSpeaker) return;
    setEditingRound({
      ...editingRound,
      speakers: (editingRound.speakers || []).filter(s => s.id !== deletingSpeaker.id),
    });
    setDeletingSpeaker(null);
  };

  const handleDeleteSpeakerFromRound = (spkId: string) => {
    const spk = editingRound?.speakers?.find(s => s.id === spkId);
    handleInitiateDeleteSpeaker({ id: spkId, name: spk ? spk.name : 'Speaker' });
  };

  const handleAddAgendaToRound = () => {
    if (!newAgendaTitle.trim() || !editingRound) return;
    const newItem = {
      time: newAgendaTime.trim() || 'TBD',
      title: newAgendaTitle.trim(),
      speaker: newAgendaSpeaker.trim() || undefined,
      description: newAgendaDesc.trim() || undefined,
    };
    setEditingRound({
      ...editingRound,
      agenda: [...(editingRound.agenda || []), newItem],
    });
    setNewAgendaTime('');
    setNewAgendaTitle('');
    setNewAgendaSpeaker('');
    setNewAgendaDesc('');
    setAgendaFormOpen(false);
  };

  const handleInitiateDeleteAgenda = (index: number, title: string) => {
    setDeletingAgendaIdx({ index, title });
  };

  const handleConfirmDeleteAgenda = () => {
    if (!editingRound || !deletingAgendaIdx) return;
    setEditingRound({
      ...editingRound,
      agenda: (editingRound.agenda || []).filter((_, idx) => idx !== deletingAgendaIdx.index),
    });
    setDeletingAgendaIdx(null);
  };

  const handleDeleteAgendaFromRound = (index: number) => {
    const item = editingRound?.agenda?.[index];
    handleInitiateDeleteAgenda(index, item ? item.title : `Session #${index + 1}`);
  };

  // Partners & Accreditations Handlers
  const handleOpenAddPartner = () => {
    setEditingPartner(null);
    setPartnerOrgName('');
    setPartnerLogoUrl('/assets/aistudio/logo_hospital_egypt_copy-05_43a268db.png');
    setPartnerRelType('Hospital Network Accreditation');
    setPartnerDesc('');
    setPartnerVerStatus('verified');
    setPartnerDisplayOrder(String(partnersList.length + 1));
    setPartnerIsActive(true);
    setPartnerWebsiteUrl('');
    setIsPartnerModalOpen(true);
  };

  const handleOpenEditPartner = (p: PartnerAccreditation) => {
    setEditingPartner(p);
    setPartnerOrgName(p.organizationName);
    setPartnerLogoUrl(p.logoUrl || '');
    setPartnerRelType(p.relationshipType);
    setPartnerDesc(p.description);
    setPartnerVerStatus(p.verificationStatus);
    setPartnerDisplayOrder(String(p.displayOrder));
    setPartnerIsActive(p.isActive);
    setPartnerWebsiteUrl(p.websiteUrl || '');
    setIsPartnerModalOpen(true);
  };

  const handlePartnerLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be less than 5MB.');
      return;
    }
    setPartnerUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const uploadRes = await repository.uploadImageAsync(reader.result as string, 'partner');
        if (uploadRes.success && uploadRes.url) {
          setPartnerLogoUrl(uploadRes.url);
        } else {
          alert(uploadRes.error || 'Failed to upload partner logo.');
        }
      } catch (err: any) {
        alert(err.message || 'Failed to upload partner logo.');
      } finally {
        setPartnerUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerOrgName.trim()) return;

    const res = await repository.savePartnerAsync({
      id: editingPartner ? editingPartner.id : undefined,
      organizationName: partnerOrgName.trim(),
      logoUrl: partnerLogoUrl.trim(),
      relationshipType: partnerRelType,
      description: partnerDesc.trim(),
      verificationStatus: partnerVerStatus,
      displayOrder: parseInt(partnerDisplayOrder) || 1,
      isActive: partnerIsActive,
      websiteUrl: partnerWebsiteUrl.trim() || undefined,
      verifiedBy: currentUser.professionalEmail,
    });

    if (res && res.id) {
      await refreshAdminData();
      setIsPartnerModalOpen(false);
    }
  };

  const handleDeletePartner = (partner: PartnerAccreditation) => {
    setDeleteError(null);
    setDeletingPartner(partner);
  };

  const handleConfirmDeletePartner = async () => {
    if (!deletingPartner) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const partnerName = deletingPartner.organizationName;
      const res = await repository.deletePartnerAsync(deletingPartner.id);
      if (res.success) {
        setDeletingPartner(null);
        await refreshAdminData();
        setStatusAlert({
          type: 'warning',
          memberName: 'Partner Accreditation',
          email: '',
          message: isArabic
            ? `تم حذف اعتماد / شريك "${partnerName}" نهائياً من قاعدة البيانات.`
            : `Partner accreditation "${partnerName}" permanently deleted from database.`,
        });
      } else {
        setDeleteError(res.error || 'Failed to delete partner.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting partner.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTogglePartnerActive = async (p: PartnerAccreditation) => {
    await repository.savePartnerAsync({
      ...p,
      isActive: !p.isActive,
    });
    await refreshAdminData();
  };

  const handleReorderPartner = async (id: string, direction: 'up' | 'down') => {
    const idx = partnersList.findIndex(p => p.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= partnersList.length) return;

    const newOrder = [...partnersList];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    const orderedIds = newOrder.map(p => p.id);
    repository.reorderPartners(orderedIds);
    await refreshAdminData();
  };

  // Membership Benefits Handlers
  const handleOpenAddBenefit = () => {
    setEditingBenefit(null);
    setBenefitTitle('');
    setBenefitCategory('Academy & Education');
    setBenefitDesc('');
    setBenefitConditions('Subject to course schedule, seat availability, and prior executive registration verification.');
    setBenefitIconName('GraduationCap');
    setBenefitDisplayOrder(String(benefitsList.length + 1));
    setBenefitIsActive(true);
    setBenefitTermsUrl('');
    setIsBenefitModalOpen(true);
  };

  const handleOpenEditBenefit = (b: MembershipBenefit) => {
    setEditingBenefit(b);
    setBenefitTitle(b.title);
    setBenefitCategory(b.category);
    setBenefitDesc(b.description);
    setBenefitConditions(b.conditions);
    setBenefitIconName(b.iconName);
    setBenefitDisplayOrder(String(b.displayOrder));
    setBenefitIsActive(b.isActive);
    setBenefitTermsUrl(b.termsUrl || '');
    setIsBenefitModalOpen(true);
  };

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benefitTitle.trim() || !benefitDesc.trim()) return;

    const res = await repository.saveBenefitAsync({
      id: editingBenefit ? editingBenefit.id : undefined,
      title: benefitTitle.trim(),
      category: benefitCategory,
      description: benefitDesc.trim(),
      conditions: benefitConditions.trim(),
      iconName: benefitIconName,
      displayOrder: parseInt(benefitDisplayOrder) || 1,
      isActive: benefitIsActive,
      termsUrl: benefitTermsUrl.trim() || undefined,
    });

    if (res && res.id) {
      await refreshAdminData();
      setIsBenefitModalOpen(false);
    }
  };

  const handleDeleteBenefit = (benefit: MembershipBenefit) => {
    setDeleteError(null);
    setDeletingBenefit(benefit);
  };

  const handleConfirmDeleteBenefit = async () => {
    if (!deletingBenefit) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const benefitTitleStr = deletingBenefit.title;
      const res = await repository.deleteBenefitAsync(deletingBenefit.id);
      if (res.success) {
        setDeletingBenefit(null);
        await refreshAdminData();
        setStatusAlert({
          type: 'warning',
          memberName: 'Membership Benefit',
          email: '',
          message: isArabic
            ? `تم حذف ميزة العضوية "${benefitTitleStr}" نهائياً من قاعدة البيانات.`
            : `Membership benefit "${benefitTitleStr}" permanently deleted from database.`,
        });
      } else {
        setDeleteError(res.error || 'Failed to delete benefit.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting benefit.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleToggleBenefitActive = async (b: MembershipBenefit) => {
    await repository.saveBenefitAsync({
      ...b,
      isActive: !b.isActive,
    });
    await refreshAdminData();
  };

  const handleReorderBenefit = async (id: string, direction: 'up' | 'down') => {
    const idx = benefitsList.findIndex(b => b.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= benefitsList.length) return;

    const newOrder = [...benefitsList];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;

    const orderedIds = newOrder.map(b => b.id);
    repository.reorderBenefits(orderedIds);
    await refreshAdminData();
  };

  const handleExportMembers = () => {
    const headers = ['Member ID', 'Full Name', 'Professional Email', 'Job Title', 'Organization', 'Specialty', 'Status', 'Directory Consent', 'Photo Consent', 'Joined At'];
    const rows = allMembers.map(m => [
      m.id,
      m.fullName,
      m.professionalEmail,
      m.jobTitle,
      m.organization,
      m.specialty,
      m.status,
      m.consentDirectoryDisplay ? 'Yes' : 'No',
      m.consentPhotoPublish ? 'Yes' : 'No',
      m.joinedAt,
    ]);
    const csv = generateCsv(headers, rows);
    triggerDownload('HLE_SGH_Members_Roster.csv', csv);
  };

  const handleExportTopics = () => {
    const headers = ['Topic ID', 'Title', 'Category', 'Author Name', 'Author Organization', 'Status', 'Likes', 'Dislikes', 'Comments', 'Created At'];
    const rows = allTopics.map(t => [
      t.id,
      t.title,
      t.category,
      t.authorName,
      t.authorOrg,
      t.status,
      t.likeCount,
      t.dislikeCount,
      t.commentCount,
      t.createdAt,
    ]);
    const csv = generateCsv(headers, rows);
    triggerDownload('HLE_SGH_Leadership_Topics.csv', csv);
  };

  const fetchDiagnostics = async () => {
    setDiagnosticsOpen(true);
    setDiagnosticsLoading(true);
    try {
      const { ok, data, error } = await repository.safeFetch<{
        databaseId?: string;
        connected?: boolean;
        initialized?: boolean;
        status?: string;
        [key: string]: any;
      }>('/api/admin/diagnostics', {
        headers: {
          Authorization: `Bearer ${repository.getAdminToken() || ''}`,
        },
      });
      if (ok && data) {
        setDiagnosticsData(data);
      } else {
        setDiagnosticsData({ error: error || 'Failed to retrieve diagnostics data.' });
      }
    } catch (err: any) {
      setDiagnosticsData({ error: err.message });
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#006B52] border border-emerald-200 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#008765]" /> {isArabic ? 'وحدة الحوكمة المركزية للمجتمع' : 'Healthcare Leadership Governance Console'}
            </span>
            <span className="text-xs text-slate-500">{isArabic ? 'مدير النظام:' : 'Root Admin:'} {currentUser.professionalEmail}</span>
          </div>
          <h1 className="font-serif-display text-3xl font-bold text-slate-900">
            {isArabic ? 'بوابة الحوكمة والإدارة المركزية' : 'Administrative Governance Portal'}
          </h1>
          <p className="text-xs text-slate-500">
            {isArabic
              ? 'إدارة طلبات العضوية، ومحاور الراوندات، وتوثيق الحضور وساعات التعليم الطبي المستمر، وتصدير البيانات.'
              : 'Manage member registrations, round agendas, attendance verification, and data exports.'}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportMembers}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#008765]" /> {isArabic ? 'تصدير سجل الأعضاء CSV' : 'Export Members CSV'}
          </button>
          <button
            onClick={handleExportTopics}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#0284C7]" /> {isArabic ? 'تصدير الرؤى والموضوعات CSV' : 'Export Topics CSV'}
          </button>
          <button
            onClick={fetchDiagnostics}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            title={isArabic ? 'فحص اتصال قاعدة البيانات وتتبع النظام' : 'Inspect Firestore connectivity and database telemetry'}
          >
            <Database className="w-3.5 h-3.5 text-[#008765]" /> {isArabic ? 'تشخيص النظام' : 'System Diagnostics'}
          </button>
          <button
            onClick={refreshAdminData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            title={isArabic ? 'تحديث السجلات المعتمدة' : 'Reload authoritative database records'}
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> {isArabic ? 'تحديث' : 'Refresh'}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 transition-all cursor-pointer"
            title={isArabic ? 'تسجيل الخروج من البوابة' : 'Log out of Admin Portal'}
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" /> {isArabic ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Operational Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500">{isArabic ? 'قيد المراجعة' : 'Pending Review'}</div>
          <div className="text-3xl font-bold font-serif-display text-amber-600">{pendingCount}</div>
          <div className="text-[10px] text-slate-400">{isArabic ? 'طلبات بانتظار الاعتماد' : 'Applications queued'}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500">{isArabic ? 'الأعضاء المعتمدون' : 'Approved Members'}</div>
          <div className="text-3xl font-bold font-serif-display text-emerald-600">{approvedCount}</div>
          <div className="text-[10px] text-slate-400">{isArabic ? 'قيادات نشطة بالدليل' : 'Active executive leaders'}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500">{isArabic ? 'الراوندات المنشورة' : 'Published Rounds'}</div>
          <div className="text-3xl font-bold font-serif-display text-slate-900">{allRounds.length}</div>
          <div className="text-[10px] text-slate-400">{isArabic ? 'فعاليات قيادية منشورة' : 'Hospital leadership events'}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs text-slate-500">{isArabic ? 'النقاشات المعتمدة' : 'Approved Topics'}</div>
          <div className="text-3xl font-bold font-serif-display text-[#008765]">
            {allTopics.filter(t => t.status === 'approved' || t.status === 'pinned').length}
          </div>
          <div className="text-[10px] text-slate-400">{isArabic ? 'أطروحات ورؤى عامة' : 'Public leadership insights'}</div>
        </div>
      </div>

      {/* In-App Confirmation Banner (No Email Delivery) */}
      {statusAlert && (
        <div className={`p-4 rounded-2xl border text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
          statusAlert.type === 'success' ? 'bg-[#E6F4F1] border-[#A7F3D0]' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
              statusAlert.type === 'success' ? 'bg-[#008765] text-white' : 'bg-amber-600 text-white'
            }`}>
              {statusAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div className="space-y-0.5">
              <p className={`text-xs font-bold flex items-center gap-1.5 ${
                statusAlert.type === 'success' ? 'text-[#006B52]' : 'text-amber-800'
              }`}>
                <span>{statusAlert.message}</span>
              </p>
              <p className="text-[11px] text-slate-600">
                {isArabic ? 'العضو:' : 'Applicant:'} <strong>{statusAlert.memberName}</strong>
                {statusAlert.email && (
                  <>
                    {' '}— {isArabic ? 'البريد:' : 'Email:'}{' '}
                    <code className="text-[#008765] bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      {statusAlert.email}
                    </code>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStatusAlert(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-white cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'members', label: isArabic ? `طلبات العضوية (${pendingCount})` : `Member Applications (${pendingCount})`, icon: Users },
          { id: 'branding', label: isArabic ? 'الشعارات والهوية' : 'Logos & Branding', icon: Layers },
          { id: 'topics', label: isArabic ? `إشراف الأطروحات (${pendingTopicsCount})` : `Topic Moderation (${pendingTopicsCount})`, icon: MessageSquare },
          { id: 'comments', label: isArabic ? `إشراف المداخلات (${pendingCommentsCount})` : `Comment Moderation (${pendingCommentsCount})`, icon: MessageSquare },
          { id: 'rounds', label: isArabic ? 'إدارة الراوندات والفعاليات' : 'Round & Event Management', icon: Calendar },
          { id: 'partners', label: isArabic ? `الاعتمادات والشراكات (${partnersList.length})` : `Partners & Accreditations (${partnersList.length})`, icon: ShieldCheck },
          { id: 'benefits', label: isArabic ? `مزايا العضوية (${benefitsList.length})` : `Membership Benefits (${benefitsList.length})`, icon: Sparkles },
          { id: 'attendance', label: isArabic ? 'توثيق الحضور والاعتمادات' : 'Attendance & Verification', icon: Award },
          { id: 'audit', label: isArabic ? 'سجل العمليات والتدقيق' : 'Audit Trail', icon: Activity },
        ].map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-white text-[#008765] border-t-2 border-[#008765] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Member Approvals */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by name, username, email, specialty, or hospital..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-slate-500">
              <span>Status:</span>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setMemberStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase ${
                    memberStatusFilter === st
                      ? 'bg-[#008765] text-white'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {st}
                  {st === 'pending' && pendingCount > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}

              <button
                onClick={refreshAdminData}
                className="ml-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Refresh applications from database"
              >
                {loadingMembers ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 min-w-[850px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Professional Email</th>
                    <th className="py-3.5 px-4">Title & Organization</th>
                    <th className="py-3.5 px-4">Specialty</th>
                    <th className="py-3.5 px-4">Registration Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Photo & Name + Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {member.profilePhotoUrl ? (
                            <img
                              src={member.profilePhotoUrl}
                              alt={member.fullName}
                              className="w-10 h-10 rounded-full object-cover border border-[#008765] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#E6F4F1] text-[#008765] border border-[#A7F3D0] flex items-center justify-center font-bold text-sm shrink-0">
                              {member.fullName[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{member.fullName}</div>
                            {member.username && (
                              <div className="text-[11px] text-slate-400 font-mono">@{member.username}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-mono text-[11px] select-all">
                          {member.professionalEmail}
                        </span>
                      </td>

                      {/* Job Title & Organization */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{member.jobTitle}</div>
                        <div className="text-[11px] text-[#008765]">{member.organization}</div>
                      </td>

                      {/* Specialty */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                          {member.specialty}
                        </span>
                      </td>

                      {/* Registration Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {member.joinedAt ? (
                          <span>{new Date(member.joinedAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* Membership Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : member.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {member.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* View Profile */}
                          <button
                            onClick={() => handleOpenViewMember(member)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer transition-colors"
                            title={isArabic ? 'عرض الملف التعريفي كاملاً' : 'View full member profile'}
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {/* Edit Member */}
                          <button
                            onClick={() => handleOpenEditMember(member)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 cursor-pointer transition-colors"
                            title={isArabic ? 'تعديل بيانات العضو' : 'Edit member profile'}
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          </button>

                          {/* Status buttons */}
                          {member.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleApproveMember(member.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-all"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{isArabic ? 'اعتماد' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => handleInitiateRejectMember(member)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold cursor-pointer transition-all"
                              >
                                <X className="w-3.5 h-3.5" /> {isArabic ? 'رفض' : 'Reject'}
                              </button>
                            </>
                          ) : member.status === 'approved' ? (
                            <>
                              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-[#008765]" />
                                <span>{isArabic ? 'معتمد' : 'Approved'}</span>
                              </span>
                              <button
                                onClick={() => handleInitiateRejectMember(member)}
                                className="text-slate-400 hover:text-rose-600 text-[11px] ml-1 cursor-pointer transition-colors"
                                title="Update status to rejected"
                              >
                                {isArabic ? 'رفض' : 'Reject'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleApproveMember(member.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#008765] border border-emerald-200 text-[11px] font-bold cursor-pointer transition-all"
                            >
                              {isArabic ? 'إعادة اعتماد' : 'Approve Application'}
                            </button>
                          )}

                          {/* Delete Member (protected from root admin) */}
                          {member.id !== 'admin_ashraf' && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                              title={isArabic ? 'حذف السجل نهائياً' : 'Delete record'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                        {loadingMembers ? (
                          <p>Loading applications from community database...</p>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold text-slate-700">No applications found matching your filter.</p>
                            <p className="text-[11px] text-slate-400">New registration submissions will appear here automatically.</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Round Management */}
      {activeTab === 'rounds' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="space-y-0.5">
              <h3 className="text-lg font-bold text-slate-900">
                Hospital Round Management
              </h3>
              <p className="text-xs text-slate-500">
                Create, edit, publish, and manage leadership rounds and agendas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#008765] to-[#0284C7] hover:from-[#006B52] hover:to-[#0274B3] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                title="Create a complete round with all agenda items automatically using AI"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FEF9C3]" />
                <span>Create Round with AI</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCreateRoundOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#008765]" />
                <span>Publish New Round</span>
              </button>
            </div>
          </div>

          {/* AI Round Creator Modal */}
          <AiRoundCreatorModal
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            onRoundCreated={(round) => {
              setSelectedRoundId(round.id);
            }}
          />

          {/* Create Round Modal/Form */}
          {isCreateRoundOpen && (
            <div className="p-6 rounded-3xl bg-white border-2 border-[#008765]/20 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  Publish Healthcare Leadership Round (Dynamic - No Code Changes)
                </h4>
                <button onClick={() => setIsCreateRoundOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              {roundActionMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  {roundActionMsg}
                </div>
              )}

              <form onSubmit={handleCreateRound} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 mb-1 font-semibold">Event Title *</label>
                  <input
                    type="text"
                    required
                    value={newRoundTitle}
                    onChange={e => setNewRoundTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Event Format / Type *</label>
                  <select
                    value={newRoundEventType}
                    onChange={e => setNewRoundEventType(e.target.value as EventType)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  >
                    <option value="roundtable">Executive Roundtable (Default)</option>
                    <option value="summit">Executive Summit (Large Scale)</option>
                    <option value="symposium">Clinical Governance Symposium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Core Theme / Topic *</label>
                  <input
                    type="text"
                    required
                    value={newRoundTopic}
                    onChange={e => setNewRoundTopic(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Scheduled Date *</label>
                  <input
                    type="text"
                    required
                    value={newRoundDate}
                    onChange={e => setNewRoundDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Scheduled Time *</label>
                  <input
                    type="text"
                    required
                    value={newRoundTime}
                    onChange={e => setNewRoundTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Venue *</label>
                  <input
                    type="text"
                    required
                    value={newRoundVenue}
                    onChange={e => setNewRoundVenue(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Max Capacity</label>
                  <input
                    type="number"
                    value={newRoundCapacity}
                    onChange={e => setNewRoundCapacity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                  <textarea
                    rows={2}
                    value={newRoundDesc}
                    onChange={e => setNewRoundDesc(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateRoundOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white font-semibold shadow-xs"
                  >
                    Publish Round
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-3">
            {allRounds.map(r => (
              <div key={r.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#008765] bg-[#E6F4F1] px-2 py-0.5 rounded-full">
                      {r.status}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                      {r.eventType === 'summit' ? 'Executive Summit' : r.eventType === 'symposium' ? 'Symposium' : 'Executive Roundtable'}
                    </span>
                  </div>
                  <h4 className="font-serif-display text-base font-bold text-slate-900">{r.title}</h4>
                  <p className="text-xs text-slate-500"><strong>Theme:</strong> {r.topic}</p>
                  <p className="text-[11px] text-slate-400">{r.scheduledDate} • {r.scheduledTime} • {r.venue}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingRound(r)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#008765]" /> Edit Details
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRoundId(r.id);
                      setActiveTab('attendance');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Verify Attendance ({r.currentRegistrationsCount} RSVPs)
                  </button>
                  <button
                    onClick={() => handleDeleteRound(r)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                    title="Delete Round"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {allRounds.length === 0 && (
              <div className="text-center py-10 bg-white border border-slate-200 rounded-3xl text-xs text-slate-500">
                No rounds in database. Click "Publish New Round" above to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Partners & Accreditations */}
      {activeTab === 'partners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#008765]" />
                <span>Accreditations & Strategic Partnerships Library</span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage verified hospital accreditations, international certifications, and academic partnerships without code changes.
              </p>
            </div>

            <button
              onClick={handleOpenAddPartner}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Partner / Accreditation</span>
            </button>
          </div>

          {/* Compliance & Accuracy Disclaimer Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-700" />
              <span>Governance & Accreditation Integrity Rule:</span>
            </p>
            <p className="text-slate-700 text-[11px]">
              Display each accreditation, certification, or affiliation only when its exact relationship is verified. Accreditations belong to Saudi German Hospital Cairo or respective independent bodies. Unverified or inactive entries are automatically hidden from the homepage slider and public sections.
            </p>
          </div>

          {/* Partners Table / Cards List */}
          <div className="space-y-3">
            {partnersList.map((partner, index) => (
              <div
                key={partner.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Reorder and Order Badge */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleReorderPartner(partner.id, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded-md text-slate-400 hover:text-slate-700 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'}`}
                      title="Move Up in Slider"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      #{partner.displayOrder}
                    </span>
                    <button
                      onClick={() => handleReorderPartner(partner.id, 'down')}
                      disabled={index === partnersList.length - 1}
                      className={`p-1 rounded-md text-slate-400 hover:text-slate-700 ${index === partnersList.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'}`}
                      title="Move Down in Slider"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Logo Preview */}
                  <div className="w-20 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={partner.organizationName}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">NO LOGO</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        {partner.organizationName}
                      </h4>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          partner.verificationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {partner.verificationStatus === 'verified' ? '✓ Verified' : 'Pending Verification'}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          partner.isActive
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {partner.isActive ? 'Active in Slider' : 'Hidden / Inactive'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#008765]">
                      {partner.relationshipType}
                    </p>
                    <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                      {partner.description}
                    </p>
                    {partner.websiteUrl && (
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#008765]"
                      >
                        <span>{partner.websiteUrl}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleTogglePartnerActive(partner)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      partner.isActive
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {partner.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleOpenEditPartner(partner)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#008765]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {partnersList.length === 0 && (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl space-y-2">
                <Shield className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">No partner or accreditation entries configured.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Membership Benefits */}
      {activeTab === 'benefits' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#008765]" />
                <span>Membership Benefits Management</span>
              </h3>
              <p className="text-xs text-slate-500">
                Configure Academy course discounts, executive networking privileges, and verifiable terms before public display.
              </p>
            </div>

            <button
              onClick={handleOpenAddBenefit}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Membership Benefit</span>
            </button>
          </div>

          {/* Benefits Compliance Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-[#008765]" />
              <span>Truth in Benefits Requirement:</span>
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Do not enter fabricated discount percentages or unauthorized commercial promises. All course fee waivers and program privileges must specify verifiable conditions.
            </p>
          </div>

          {/* Benefits List */}
          <div className="space-y-3">
            {benefitsList.map((benefit, index) => (
              <div
                key={benefit.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Reorder and Order Badge */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleReorderBenefit(benefit.id, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded-md text-slate-400 hover:text-slate-700 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'}`}
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      #{benefit.displayOrder}
                    </span>
                    <button
                      onClick={() => handleReorderBenefit(benefit.id, 'down')}
                      disabled={index === benefitsList.length - 1}
                      className={`p-1 rounded-md text-slate-400 hover:text-slate-700 ${index === benefitsList.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'}`}
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Benefit Details */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {benefit.title}
                      </span>
                      <span className="text-[10px] font-semibold text-[#008765] bg-[#E6F4F1] px-2 py-0.5 rounded-full">
                        {benefit.category}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          benefit.isActive
                            ? 'bg-emerald-50 text-emerald-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {benefit.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                      {benefit.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 max-w-2xl">
                      <strong>Applicable Terms:</strong> {benefit.conditions}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleToggleBenefitActive(benefit)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      benefit.isActive
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {benefit.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleOpenEditBenefit(benefit)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#008765]" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteBenefit(benefit)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {benefitsList.length === 0 && (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl space-y-2">
                <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">No benefits configured. Click "Add Membership Benefit" above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Attendance */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#E6F4F1] border border-[#A7F3D0] text-xs text-slate-700">
            Attendance verification activates member presence records and enforces the dual-key photo privacy rule.
          </div>
          <div className="text-xs text-slate-500 text-center py-6 bg-white border border-slate-200 rounded-3xl">
            {selectedRoundId
              ? `Displaying attendance verification roster for round: ${selectedRoundId}`
              : 'Select a round from the Round Management tab to audit and verify attendance.'}
          </div>
        </div>
      )}

      {/* TAB: Dual Logos & Brand Management */}
      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#008765]"></span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display">
                    {isArabic ? 'إدارة الشعارات والهوية الرسمية' : 'Official Dual Logos & Brand Management'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isArabic
                    ? 'رفع ومعاينة وتثبيت شعاري المنصة (الشعار العرضي وشعار الشارة الرأسي) مع الحفظ الدائم في قاعدة البيانات.'
                    : 'Upload, preview, and persistently save both official platform logos (Horizontal Banner & Vertical Emblem) across sessions and restarts.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetBrandToDefaults}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {isArabic ? 'استعادة الشعارات الافتراضية' : 'Reset to Default Academy Logos'}
                </button>
              </div>
            </div>

            {brandSaveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{brandSaveSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBrandSaveSuccess(null)}
                  className="text-emerald-500 hover:text-emerald-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {brandSaveError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{brandSaveError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBrandSaveError(null)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSaveBrandSettings} className="space-y-6 pt-2">
              {/* Grid: Logo 1 and Logo 2 Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logo 1 Card: Horizontal Banner */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#008765]" />
                        {isArabic ? 'الشعار الأول: الشعار العرضي (Horizontal Logo)' : 'Logo 1: Horizontal Brand Logo'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isArabic ? 'الشعار العرضي الرسمي للمنصة في شريط التنقل العلوي والفوتر' : 'Primary horizontal logo banner for navbar and footer'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-[#006B52]">
                      {isArabic ? 'عرضي' : 'Horizontal'}
                    </span>
                  </div>

                  {/* Visual Live Preview Box */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      {isArabic ? 'معاينة حية للشعار:' : 'Live Rendering Preview:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="h-24 p-3 rounded-xl bg-white border border-slate-200/90 flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-[9px] font-semibold text-slate-400 mb-1">Light Mode</span>
                        <img
                          src={logo1Url || DEFAULT_BRAND_SETTINGS.primaryLogoUrl}
                          alt={logo1Alt}
                          className="h-10 max-w-full object-contain select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_BRAND_SETTINGS.primaryLogoUrl;
                          }}
                        />
                      </div>
                      <div className="h-24 p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-[9px] font-semibold text-slate-400 mb-1">Dark Mode</span>
                        <div className="p-1.5 rounded-lg bg-white/95">
                          <img
                            src={logo1Url || DEFAULT_BRAND_SETTINGS.primaryLogoUrl}
                            alt={logo1Alt}
                            className="h-9 max-w-full object-contain select-none"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_BRAND_SETTINGS.primaryLogoUrl;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File Upload & URL Controls */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {isArabic ? 'رفع صورة جديدة للشعار العرضي:' : 'Upload New Horizontal Logo:'}
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#008765] text-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                          {uploadingLogo1 ? <Loader2 className="w-4 h-4 animate-spin text-[#008765]" /> : <Upload className="w-4 h-4 text-[#008765]" />}
                          <span>{uploadingLogo1 ? (isArabic ? 'جاري الرفع والمعالجة...' : 'Uploading & processing...') : (isArabic ? 'اختر ملف صورة من جهازك (PNG / SVG)' : 'Choose Image File (PNG / SVG / WebP)')}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleUploadLogoFile(1)}
                            className="hidden"
                            disabled={uploadingLogo1}
                          />
                        </label>
                        {logo1Url && (
                          <button
                            type="button"
                            onClick={() => handleInitiateDeleteLogo(1)}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                            title={isArabic ? 'حذف الشعار الأول نهائياً' : 'Remove & delete Logo 1'}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{isArabic ? 'حذف' : 'Remove'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isArabic ? 'مسار أو رابط الشعار (URL / Path):' : 'Logo Image Path / URL:'}
                      </label>
                      <input
                        type="text"
                        value={logo1Url}
                        onChange={e => setLogo1Url(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-[#008765]"
                        placeholder="/assets/aistudio/Academy-logos-01_08a20a13.png"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isArabic ? 'النص البديل للشعار (Alt text):' : 'Logo Alt Text:'}
                      </label>
                      <input
                        type="text"
                        value={logo1Alt}
                        onChange={e => setLogo1Alt(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#008765]"
                        placeholder="Saudi German Academy - Horizontal Logo"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo 2 Card: Vertical / Emblem Badge */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#0284C7]" />
                        {isArabic ? 'الشعار الثاني: شعار الشارة الرأسي (Vertical / Emblem Logo)' : 'Logo 2: Vertical Emblem / Badge Logo'}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {isArabic ? 'شارة الأكاديمية الرأسية وأيقونة الهوية المميزة في شريط التنقل والبطاقات' : 'Vertical emblem tree badge for responsive navbar and branding crest'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-[#0284C7]">
                      {isArabic ? 'رأسي / شارة' : 'Emblem'}
                    </span>
                  </div>

                  {/* Visual Live Preview Box */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      {isArabic ? 'معاينة حية للشارة الرأسية:' : 'Live Rendering Preview:'}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="h-24 p-3 rounded-xl bg-white border border-slate-200/90 flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-[9px] font-semibold text-slate-400 mb-1">Light Mode</span>
                        <img
                          src={logo2Url || DEFAULT_BRAND_SETTINGS.secondaryLogoUrl}
                          alt={logo2Alt}
                          className="h-12 w-auto object-contain select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_BRAND_SETTINGS.secondaryLogoUrl;
                          }}
                        />
                      </div>
                      <div className="h-24 p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center shadow-2xs">
                        <span className="text-[9px] font-semibold text-slate-400 mb-1">Dark Mode</span>
                        <div className="p-1 rounded-lg bg-white/95">
                          <img
                            src={logo2Url || DEFAULT_BRAND_SETTINGS.secondaryLogoUrl}
                            alt={logo2Alt}
                            className="h-10 w-auto object-contain select-none"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = DEFAULT_BRAND_SETTINGS.secondaryLogoUrl;
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File Upload & URL Controls */}
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {isArabic ? 'رفع صورة جديدة للشعار الرأسي:' : 'Upload New Vertical / Emblem Logo:'}
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#0284C7] text-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                          {uploadingLogo2 ? <Loader2 className="w-4 h-4 animate-spin text-[#0284C7]" /> : <Upload className="w-4 h-4 text-[#0284C7]" />}
                          <span>{uploadingLogo2 ? (isArabic ? 'جاري الرفع والمعالجة...' : 'Uploading & processing...') : (isArabic ? 'اختر ملف شارة من جهازك (PNG / SVG)' : 'Choose Emblem File (PNG / SVG / WebP)')}</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={handleUploadLogoFile(2)}
                            className="hidden"
                            disabled={uploadingLogo2}
                          />
                        </label>
                        {logo2Url && (
                          <button
                            type="button"
                            onClick={() => handleInitiateDeleteLogo(2)}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs shrink-0"
                            title={isArabic ? 'حذف الشعار الثاني نهائياً' : 'Remove & delete Logo 2'}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{isArabic ? 'حذف' : 'Remove'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isArabic ? 'مسار أو رابط الشعار (URL / Path):' : 'Emblem Image Path / URL:'}
                      </label>
                      <input
                        type="text"
                        value={logo2Url}
                        onChange={e => setLogo2Url(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono text-[11px] focus:outline-none focus:border-[#0284C7]"
                        placeholder="/assets/aistudio/Academy-logos-03_a9a4c809.png"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {isArabic ? 'النص البديل للشعار (Alt text):' : 'Emblem Alt Text:'}
                      </label>
                      <input
                        type="text"
                        value={logo2Alt}
                        onChange={e => setLogo2Alt(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-[#0284C7]"
                        placeholder="Saudi German Academy - Emblem Logo"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined Brand Presentation Preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 font-display flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-[#008765]" />
                    {isArabic ? 'معاينة حية متكاملة لمنطقة العلامة التجارية (Website Header Branding Area)' : 'Combined Live Navbar Branding Area Simulation'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {isArabic ? 'كلا الشعارين مع اسم المجتمع' : 'Both Logos + Community Identity'}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {/* Emblem Badge Logo */}
                    <div className="p-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                      <img
                        src={logo2Url || DEFAULT_BRAND_SETTINGS.secondaryLogoUrl}
                        alt="Emblem"
                        className="h-10 w-auto object-contain"
                      />
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-slate-200" aria-hidden="true" />

                    {/* Horizontal Logo */}
                    <div className="hidden sm:block p-1 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                      <img
                        src={logo1Url || DEFAULT_BRAND_SETTINGS.primaryLogoUrl}
                        alt="Horizontal"
                        className="h-9 w-auto object-contain max-w-[200px]"
                      />
                    </div>

                    <div className={`border-slate-200 ${isArabic ? 'border-r pr-3 text-right' : 'border-l pl-3 text-left'}`}>
                      <span className="text-sm sm:text-base font-bold text-slate-900 font-display leading-tight block">
                        {isArabic ? brandPlatformNameAr : brandPlatformName}
                      </span>
                      <p className="text-[10px] font-semibold text-[#008765] tracking-wide">
                        {isArabic ? 'ملتقى قيادات المستشفيات والرعاية الصحية' : 'Executive Hospital & Medical Leadership'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    High-Res Vector Sharpness Verified
                  </span>
                </div>
              </div>

              {/* Platform Title Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isArabic ? 'اسم المنصة الرسمي (English):' : 'Official Platform Name (English):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={brandPlatformName}
                    onChange={e => setBrandPlatformName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#008765]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {isArabic ? 'اسم المنصة الرسمي (العربية):' : 'Official Platform Name (Arabic):'}
                  </label>
                  <input
                    type="text"
                    required
                    value={brandPlatformNameAr}
                    onChange={e => setBrandPlatformNameAr(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-[#008765]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetBrandToDefaults}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {isArabic ? 'استعادة الافتراضي' : 'Reset to Defaults'}
                </button>
                <button
                  type="submit"
                  disabled={brandSaveLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold shadow-xs hover:shadow-md cursor-pointer transition-all disabled:opacity-50"
                >
                  {brandSaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{brandSaveLoading ? (isArabic ? 'جاري الحفظ والتثبيت...' : 'Saving to Database...') : (isArabic ? 'حفظ وتثبيت إعدادات الشعار والهوية' : 'Save & Persist Brand Settings')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: Topic Moderation */}
      {activeTab === 'topics' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={isArabic ? 'البحث بالعنوان، المحتوى، الكاتب...' : 'Search by title, body, author, org...'}
                value={topicSearch}
                onChange={e => setTopicSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-slate-500 flex-wrap">
              <span>{isArabic ? 'الحالة:' : 'Status:'}</span>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(st => {
                const count = st === 'all'
                  ? allTopics.length
                  : st === 'pending'
                  ? allTopics.filter(t => t.status === 'pending' || (t.status as any) === 'pending_review').length
                  : allTopics.filter(t => t.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setTopicStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors cursor-pointer ${
                      topicStatusFilter === st
                        ? 'bg-[#008765] text-white'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {isArabic ? (st === 'all' ? 'الكل' : st === 'pending' ? 'قيد المراجعة' : st === 'approved' ? 'معتمد' : 'مرفوض') : st}
                    {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {allTopics
              .filter(topic => {
                if (topicStatusFilter !== 'all') {
                  if (topicStatusFilter === 'pending' && !(topic.status === 'pending' || (topic.status as any) === 'pending_review')) return false;
                  if (topicStatusFilter === 'approved' && !(topic.status === 'approved' || topic.status === 'pinned')) return false;
                  if (topicStatusFilter === 'rejected' && topic.status !== 'rejected') return false;
                }
                if (topicSearch.trim()) {
                  const q = topicSearch.toLowerCase();
                  return (
                    topic.title.toLowerCase().includes(q) ||
                    topic.body.toLowerCase().includes(q) ||
                    topic.authorName.toLowerCase().includes(q) ||
                    topic.authorOrg.toLowerCase().includes(q)
                  );
                }
                return true;
              })
              .map(topic => (
                <div
                  key={topic.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-[#006B52] border border-emerald-200">
                        {topic.category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        topic.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : topic.status === 'pinned'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : topic.status === 'rejected'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {topic.status === 'pending' ? (isArabic ? 'قيد المراجعة' : 'Pending Review') : topic.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {new Date(topic.createdAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif-display text-base font-bold text-slate-900 leading-snug">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-line">
                      {topic.body}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-[#006B52] flex items-center justify-center font-bold text-[10px]">
                        {topic.authorName[0]}
                      </div>
                      <span className="font-semibold text-slate-900">{topic.authorName}</span>
                      <span className="text-slate-400">· {topic.authorTitle} ({topic.authorOrg})</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleOpenEditTopic(topic)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title={isArabic ? 'تعديل محتوى الأطروحة' : 'Edit topic content'}
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{isArabic ? 'تعديل' : 'Edit'}</span>
                      </button>

                      {topic.status !== 'approved' && (
                        <button
                          onClick={() => handleModerateTopic(topic.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'اعتماد ونشر' : 'Approve'}</span>
                        </button>
                      )}

                      {topic.status !== 'rejected' && (
                        <button
                          onClick={() => handleModerateTopic(topic.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'رفض' : 'Reject'}</span>
                        </button>
                      )}

                      {topic.status === 'approved' && (
                        <button
                          onClick={() => handleModerateTopic(topic.id, 'pinned')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'تثبيت' : 'Pin'}</span>
                        </button>
                      )}

                      {topic.status === 'pinned' && (
                        <button
                          onClick={() => handleModerateTopic(topic.id, 'approved')}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>{isArabic ? 'إلغاء التثبيت' : 'Unpin'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingTopic(topic);
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        title={isArabic ? 'حذف الأطروحة نهائياً' : 'Delete topic'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

            {allTopics.length === 0 && (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl text-xs text-slate-500">
                {isArabic ? 'لا توجد أطروحات في قائمة المراجعة حالياً.' : 'No topics in moderation queue.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: Comment Moderation */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
              <span className="text-xs text-slate-500">{isArabic ? 'الحالة:' : 'Status:'}</span>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(st => {
                const count = st === 'all'
                  ? allComments.length
                  : st === 'pending'
                  ? allComments.filter(c => c.status === 'pending' || (c.status as any) === 'pending_moderation').length
                  : allComments.filter(c => c.status === st).length;
                return (
                  <button
                    key={st}
                    onClick={() => setCommentStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors cursor-pointer ${
                      commentStatusFilter === st
                        ? 'bg-[#008765] text-white'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {isArabic ? (st === 'all' ? 'الكل' : st === 'pending' ? 'قيد المراجعة' : st === 'approved' ? 'معتمد' : 'مرفوض') : st}
                    {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs text-slate-600">
              <span className="shrink-0">{isArabic ? 'تصفية بالأطروحة:' : 'Topic:'}</span>
              <select
                value={commentTopicFilter}
                onChange={e => setCommentTopicFilter(e.target.value)}
                className="w-full sm:w-64 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:border-[#008765] cursor-pointer"
              >
                <option value="all">{isArabic ? 'كافة الأطروحات والموضوعات' : 'All Topics'}</option>
                {allTopics.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {allComments
              .filter(cmt => {
                if (commentStatusFilter !== 'all') {
                  if (commentStatusFilter === 'pending' && !(cmt.status === 'pending' || (cmt.status as any) === 'pending_moderation')) return false;
                  if (commentStatusFilter === 'approved' && cmt.status !== 'approved') return false;
                  if (commentStatusFilter === 'rejected' && cmt.status !== 'rejected') return false;
                }
                if (commentTopicFilter !== 'all' && cmt.topicId !== commentTopicFilter) return false;
                return true;
              })
              .map(cmt => {
                const topic = allTopics.find(t => t.id === cmt.topicId);
                return (
                  <div
                    key={cmt.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">{cmt.authorName}</span>
                        {cmt.authorTitle && <span className="text-[#006B52] text-xs">· {cmt.authorTitle}</span>}
                        {cmt.authorOrg && <span className="text-slate-400 text-xs">({cmt.authorOrg})</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          cmt.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : cmt.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {cmt.status === 'pending' || (cmt.status as any) === 'pending_moderation'
                            ? (isArabic ? 'قيد المراجعة' : 'Pending Review')
                            : cmt.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400">
                        {new Date(cmt.createdAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    {topic && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3 text-[#008765] shrink-0" />
                        <span className="font-medium text-slate-700">{isArabic ? 'الأطروحة:' : 'Topic:'}</span>
                        <span className="font-semibold text-slate-900 truncate">{topic.title}</span>
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed break-words whitespace-pre-line">
                      {cmt.content}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      {cmt.status !== 'approved' && (
                        <button
                          onClick={() => handleModerateComment(cmt.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'اعتماد' : 'Approve'}</span>
                        </button>
                      )}

                      {cmt.status !== 'rejected' && (
                        <button
                          onClick={() => handleModerateComment(cmt.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'رفض' : 'Reject'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingComment(cmt);
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors ml-1"
                        title={isArabic ? 'حذف المداخلة نهائياً' : 'Delete comment'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

            {allComments.length === 0 && (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-3xl text-xs text-slate-500">
                {isArabic ? 'لا توجد مداخلات في قائمة المراجعة.' : 'No comments found in moderation queue.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
          {auditLogs.map((log, i) => (
            <div key={i} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 text-xs last:border-none">
              <div>
                <div className="font-bold text-slate-900">{log.action}</div>
                <div className="text-slate-600 text-[11px]">{log.details}</div>
              </div>
              <div className="text-right text-[10px] text-slate-400 font-mono">
                {new Date(log.timestamp).toLocaleTimeString()} • {log.performedBy}
              </div>
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-400">Audit log empty.</div>
          )}
        </div>
      )}

      {/* Round Edit Modal */}
      {editingRound && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-serif-display text-base font-bold text-slate-900">
                Edit Event Title, Theme & Details
              </h4>
              <button
                onClick={() => setEditingRound(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditingRound} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Event Title *</label>
                <input
                  type="text"
                  required
                  value={editingRound.title}
                  onChange={e => setEditingRound({ ...editingRound, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Event Format / Type *</label>
                <select
                  value={editingRound.eventType || 'roundtable'}
                  onChange={e => setEditingRound({ ...editingRound, eventType: e.target.value as EventType })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  <option value="roundtable">Executive Roundtable (Default)</option>
                  <option value="summit">Executive Summit (Large Scale)</option>
                  <option value="symposium">Clinical Governance Symposium</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Theme / Topic *</label>
                <input
                  type="text"
                  required
                  value={editingRound.topic}
                  onChange={e => setEditingRound({ ...editingRound, topic: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Scheduled Date *</label>
                <input
                  type="text"
                  required
                  value={editingRound.scheduledDate}
                  onChange={e => setEditingRound({ ...editingRound, scheduledDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Scheduled Time *</label>
                <input
                  type="text"
                  required
                  value={editingRound.scheduledTime}
                  onChange={e => setEditingRound({ ...editingRound, scheduledTime: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Venue *</label>
                <input
                  type="text"
                  required
                  value={editingRound.venue}
                  onChange={e => setEditingRound({ ...editingRound, venue: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Status *</label>
                <select
                  value={editingRound.status}
                  onChange={e => setEditingRound({ ...editingRound, status: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="closed">Registration Closed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Max Capacity *</label>
                <input
                  type="number"
                  min="5"
                  required
                  value={editingRound.maxCapacity || 60}
                  onChange={e => setEditingRound({ ...editingRound, maxCapacity: parseInt(e.target.value) || 60 })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Description</label>
                <textarea
                  rows={2}
                  value={editingRound.description}
                  onChange={e => setEditingRound({ ...editingRound, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              {/* Distinguished Speakers Section */}
              <div className="sm:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-900 font-bold text-xs uppercase tracking-wider">
                    Distinguished Speakers ({editingRound.speakers?.length || 0})
                  </label>
                  {!speakerFormOpen && (
                    <button
                      type="button"
                      onClick={() => setSpeakerFormOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#008765] border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Speaker
                    </button>
                  )}
                </div>

                {/* Existing speakers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(editingRound.speakers || []).map((s) => (
                    <div key={s.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {s.avatarUrl ? (
                            <img src={s.avatarUrl} alt={s.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 text-xs truncate">{s.name}</p>
                          <p className="text-[10px] text-slate-500 truncate">{s.title} • {s.organization}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSpeakerFromRound(s.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                        title="Remove speaker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Speaker Add Form */}
                {speakerFormOpen && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Add New Speaker</span>
                      <button type="button" onClick={() => setSpeakerFormOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Speaker Full Name *"
                        value={newSpeakerName}
                        onChange={e => setNewSpeakerName(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Executive Title / Role *"
                        value={newSpeakerTitle}
                        onChange={e => setNewSpeakerTitle(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Institution / Organization"
                        value={newSpeakerOrg}
                        onChange={e => setNewSpeakerOrg(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Short Executive Bio"
                        value={newSpeakerBio}
                        onChange={e => setNewSpeakerBio(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    {/* Speaker Photo Upload */}
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
                        {speakerUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#008765]" /> : <Upload className="w-3.5 h-3.5 text-[#008765]" />}
                        <span>{speakerUploading ? 'Uploading...' : 'Upload Speaker Photo'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleUploadSpeakerPhoto} disabled={speakerUploading} />
                      </label>
                      {newSpeakerPhoto && (
                        <div className="flex items-center gap-2">
                          <img src={newSpeakerPhoto} alt="Speaker Preview" className="w-7 h-7 rounded-full object-cover border border-slate-300" />
                          <button type="button" onClick={() => setNewSpeakerPhoto('')} className="text-rose-600 text-[10px] hover:underline">Remove</button>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setSpeakerFormOpen(false)} className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs">Cancel</button>
                      <button type="button" onClick={handleAddSpeakerToRound} className="px-3 py-1 rounded-lg bg-[#008765] hover:bg-[#006B52] text-white text-xs font-semibold">Save Speaker</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Agenda Items Section */}
              <div className="sm:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-900 font-bold text-xs uppercase tracking-wider">
                    Event Agenda & Schedule ({editingRound.agenda?.length || 0})
                  </label>
                  {!agendaFormOpen && (
                    <button
                      type="button"
                      onClick={() => setAgendaFormOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-[#008765] border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 cursor-pointer flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add Agenda Session
                    </button>
                  )}
                </div>

                {/* Existing agenda items */}
                <div className="space-y-1.5">
                  {(editingRound.agenda || []).map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-mono text-[11px] font-bold text-[#008765] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mr-2">{item.time}</span>
                        <span className="font-bold text-slate-900">{item.title}</span>
                        {item.speaker && <span className="text-slate-500 text-[11px] ml-2">({item.speaker})</span>}
                        {item.description && <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteAgendaFromRound(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer shrink-0"
                        title="Remove session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Agenda Add Form */}
                {agendaFormOpen && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Add Agenda Session</span>
                      <button type="button" onClick={() => setAgendaFormOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Time Range (e.g. 10:00 - 11:15) *"
                        value={newAgendaTime}
                        onChange={e => setNewAgendaTime(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Session Title *"
                        value={newAgendaTitle}
                        onChange={e => setNewAgendaTitle(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Session Lead / Speaker"
                        value={newAgendaSpeaker}
                        onChange={e => setNewAgendaSpeaker(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Brief Session Outline"
                        value={newAgendaDesc}
                        onChange={e => setNewAgendaDesc(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setAgendaFormOpen(false)} className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs">Cancel</button>
                      <button type="button" onClick={handleAddAgendaToRound} className="px-3 py-1 rounded-lg bg-[#008765] hover:bg-[#006B52] text-white text-xs font-semibold">Save Session</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingRound(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner & Accreditation Add/Edit Modal */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-serif-display text-base font-bold text-slate-900">
                {editingPartner ? 'Edit Partner / Accreditation' : 'Add Partner / Accreditation'}
              </h4>
              <button
                onClick={() => setIsPartnerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Organization / Institution Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joint Commission International (JCI)"
                  value={partnerOrgName}
                  onChange={e => setPartnerOrgName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Relationship Type *</label>
                <select
                  value={partnerRelType}
                  onChange={e => setPartnerRelType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  <option value="Hospital Network Accreditation">Hospital Network Accreditation</option>
                  <option value="Clinical Governance Certification">Clinical Governance Certification</option>
                  <option value="Academic & Educational Partner">Academic & Educational Partner</option>
                  <option value="Professional Healthcare Association">Professional Healthcare Association</option>
                  <option value="Strategic Healthcare Alliance">Strategic Healthcare Alliance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Verification Status *</label>
                <select
                  value={partnerVerStatus}
                  onChange={e => setPartnerVerStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  <option value="verified">Verified (Eligible for Slider)</option>
                  <option value="pending_verification">Pending Verification (Hidden)</option>
                  <option value="unverified">Unverified (Hidden)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block text-slate-700 font-semibold">Official Partner / Accreditation Logo</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 cursor-pointer shrink-0">
                    {partnerUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#008765]" /> : <Upload className="w-3.5 h-3.5 text-[#008765]" />}
                    <span>{partnerUploading ? 'Uploading Logo...' : 'Upload Logo File'}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePartnerLogoUpload} disabled={partnerUploading} />
                  </label>
                  <input
                    type="text"
                    placeholder="Or enter logo URL (/assets/aistudio/... or https://...)"
                    value={partnerLogoUrl}
                    onChange={e => setPartnerLogoUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765]"
                  />
                </div>
                {partnerLogoUrl && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <img src={partnerLogoUrl} alt="Logo preview" className="h-8 max-w-[120px] object-contain" />
                    <span className="text-[10px] text-slate-500 truncate flex-1">{partnerLogoUrl}</span>
                    <button type="button" onClick={() => setPartnerLogoUrl('')} className="text-rose-600 text-xs hover:underline shrink-0">Remove</button>
                  </div>
                )}

              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Accreditation scope or institutional partnership role..."
                  value={partnerDesc}
                  onChange={e => setPartnerDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Official Website URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={partnerWebsiteUrl}
                  onChange={e => setPartnerWebsiteUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Slider Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={partnerDisplayOrder}
                  onChange={e => setPartnerDisplayOrder(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="partnerActiveCheck"
                  checked={partnerIsActive}
                  onChange={e => setPartnerIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#008765] focus:ring-[#008765]"
                />
                <label htmlFor="partnerActiveCheck" className="text-slate-700 text-xs font-semibold cursor-pointer">
                  Activate in Partner Logo Slider and Accreditations section
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white font-semibold cursor-pointer"
                >
                  Save Partner Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Membership Benefit Add/Edit Modal */}
      {isBenefitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-serif-display text-base font-bold text-slate-900">
                {editingBenefit ? 'Edit Membership Benefit' : 'Add Membership Benefit'}
              </h4>
              <button
                onClick={() => setIsBenefitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBenefit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Benefit Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saudi German Academy Executive Courses"
                  value={benefitTitle}
                  onChange={e => setBenefitTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Category *</label>
                <select
                  value={benefitCategory}
                  onChange={e => setBenefitCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  <option value="Academy & Education">Academy & Education</option>
                  <option value="Professional Development">Professional Development</option>
                  <option value="Executive Networking">Executive Networking</option>
                  <option value="Institutional Collaboration">Institutional Collaboration</option>
                  <option value="Leadership Roundtables">Leadership Roundtables</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Icon Representation</label>
                <select
                  value={benefitIconName}
                  onChange={e => setBenefitIconName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  <option value="GraduationCap">Graduation Cap (Academy)</option>
                  <option value="Award">Award (Certificates)</option>
                  <option value="Building2">Building (Hospital/Partner)</option>
                  <option value="Users">Users (Networking)</option>
                  <option value="Compass">Compass (Knowledge)</option>
                  <option value="Calendar">Calendar (Roundtables)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Concise overview of benefit..."
                  value={benefitDesc}
                  onChange={e => setBenefitDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">Specific Conditions & Eligibility Terms *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Subject to course schedule, seat availability, and prior executive verification..."
                  value={benefitConditions}
                  onChange={e => setBenefitConditions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Display Order</label>
                <input
                  type="number"
                  min="1"
                  value={benefitDisplayOrder}
                  onChange={e => setBenefitDisplayOrder(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">Terms & Conditions URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={benefitTermsUrl}
                  onChange={e => setBenefitTermsUrl(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="benefitActiveCheck"
                  checked={benefitIsActive}
                  onChange={e => setBenefitIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#008765] focus:ring-[#008765]"
                />
                <label htmlFor="benefitActiveCheck" className="text-slate-700 text-xs font-semibold cursor-pointer">
                  Publish in Membership Benefits Section on Homepage
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBenefitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white font-semibold cursor-pointer"
                >
                  Save Benefit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Member Deletion Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  {isArabic ? 'تأكيد حذف العضو نهائياً' : 'Confirm Permanent Member Deletion'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isArabic ? 'هذا الإجراء لا يمكن التراجع عنه' : 'This action is irreversible.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{deletingMember.fullName}</p>
              <p className="text-slate-600">{deletingMember.jobTitle} • {deletingMember.organization}</p>
              <p className="text-slate-400 font-mono text-[11px]">{deletingMember.professionalEmail}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? 'سيتم حذف هذا السجل وملفات الاعتماد الخاصة به نهائياً من قاعدة بيانات المجتمع ومن جميع السجلات التابعة.'
                : 'This will permanently remove the member profile and credentials from the authoritative community database.'}
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleteLoading ? (isArabic ? 'جاري الحذف...' : 'Deleting...') : (isArabic ? 'تأكيد الحذف' : 'Permanently Delete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Deletion Confirmation Modal */}
      {deletingRound && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  {isArabic ? 'تأكيد حذف الجولة القيادية' : 'Confirm Round Deletion'}
                </h4>
                <p className="text-xs text-slate-500">
                  {isArabic ? 'سيتم إزالة الجولة من جدول الفعاليات' : 'Remove event from leadership rounds schedule.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-900">{deletingRound.title}</p>
              <p className="text-slate-600">{deletingRound.scheduledDate} • {deletingRound.venue}</p>
              <p className="text-[#008765] font-semibold text-[11px]">{deletingRound.currentRegistrationsCount || 0} Registered Attendees</p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingRound(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRound}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleteLoading ? (isArabic ? 'جاري الحذف...' : 'Deleting...') : (isArabic ? 'تأكيد حذف الجولة' : 'Delete Round')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Deletion Confirmation Modal */}
      {deletingPartner && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  {isArabic ? 'تأكيد إزالة الشريك / الاعتماد' : 'Confirm Partner Removal'}
                </h4>
                <p className="text-xs text-slate-500">{deletingPartner.organizationName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? 'هل أنت متأكد من رغبتك في إزالة هذا الاعتماد أو الشريك من مكتبة الاعتمادات وقاعدة البيانات؟'
                : 'Are you sure you want to permanently remove this accreditation entry from the database and homepage slider?'}
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingPartner(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePartner}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleteLoading ? 'Removing...' : 'Remove Partner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Benefit Deletion Confirmation Modal */}
      {deletingBenefit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  {isArabic ? 'تأكيد إزالة ميزة العضوية' : 'Confirm Benefit Removal'}
                </h4>
                <p className="text-xs text-slate-500">{deletingBenefit.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? 'هل أنت متأكد من رغبتك في إزالة هذه الميزة من قائمة مزايا العضوية؟'
                : 'Are you sure you want to remove this membership benefit from the database and homepage?'}
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingBenefit(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBenefit}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleteLoading ? 'Removing...' : 'Remove Benefit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Health & Diagnostics Modal */}
      {diagnosticsOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#008765]" />
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  Authoritative Database Diagnostics & Telemetry
                </h4>
              </div>
              <button onClick={() => setDiagnosticsOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            {diagnosticsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                <Loader2 className="w-6 h-6 animate-spin text-[#008765]" />
                <span>Querying authoritative storage layer...</span>
              </div>
            ) : diagnosticsData ? (
              <div className="space-y-4 text-xs">
                {/* Storage Mode */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Storage Backend</span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {diagnosticsData.storageMode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                    <div>Firestore Configured: {diagnosticsData.firestoreConfigured ? 'Yes' : 'No'}</div>
                    <div>Database: {diagnosticsData.firestoreDatabaseId}</div>
                    <div>Project: {diagnosticsData.firestoreProjectId}</div>
                  </div>
                  {diagnosticsData.iamNote && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                      <strong>IAM Notice:</strong> {diagnosticsData.iamNote}
                    </div>
                  )}
                </div>

                {/* Entity Counts */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700">Authoritative Entity Counts</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-600">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-400">Total Members</div>
                      <div className="text-base font-bold text-slate-900">{diagnosticsData.counts?.membersTotal ?? 0}</div>
                      <div className="text-[10px] text-emerald-700">Approved: {diagnosticsData.counts?.membersApproved ?? 0}</div>
                      <div className="text-[10px] text-amber-700">Pending: {diagnosticsData.counts?.membersPending ?? 0}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-400">Hospital Rounds</div>
                      <div className="text-base font-bold text-slate-900">{diagnosticsData.counts?.roundsTotal ?? 0}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-400">Partners / Accreditations</div>
                      <div className="text-base font-bold text-slate-900">{diagnosticsData.counts?.partnersTotal ?? 0}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-400">Membership Benefits</div>
                      <div className="text-base font-bold text-slate-900">{diagnosticsData.counts?.benefitsTotal ?? 0}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] text-slate-400">Private Credentials</div>
                      <div className="text-base font-bold text-slate-900">{diagnosticsData.counts?.privateCredentialsTotal ?? 0}</div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center font-mono">
                  Checked at {diagnosticsData.checkedAt}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDiagnosticsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Profile View Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                {viewingMember.profilePhotoUrl ? (
                  <img
                    src={viewingMember.profilePhotoUrl}
                    alt={viewingMember.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#008765] shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] text-[#008765] border-2 border-[#A7F3D0] flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                    {viewingMember.fullName[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-serif-display text-lg sm:text-xl font-bold text-slate-900">
                    {viewingMember.fullName}
                  </h3>
                  {viewingMember.username && (
                    <p className="text-xs text-slate-400 font-mono">@{viewingMember.username}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      viewingMember.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : viewingMember.status === 'pending'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      {viewingMember.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {viewingMember.role || 'member'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setViewingMember(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5 font-medium">{isArabic ? 'البريد المهني' : 'Professional Email'}</span>
                <span className="font-mono text-slate-900 font-semibold select-all">{viewingMember.professionalEmail}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5 font-medium">{isArabic ? 'المسمى الوظيفي' : 'Job Title'}</span>
                <span className="text-slate-900 font-semibold">{viewingMember.jobTitle}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5 font-medium">{isArabic ? 'المؤسسة / المستشفى' : 'Organization'}</span>
                <span className="text-[#008765] font-semibold">{viewingMember.organization}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5 font-medium">{isArabic ? 'التخصص الإكلينيكي / الإداري' : 'Specialty'}</span>
                <span className="text-slate-900 font-semibold">{viewingMember.specialty}</span>
              </div>

              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block mb-0.5 font-medium">{isArabic ? 'السيرة الذاتية التنفيذية' : 'Executive Bio'}</span>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {viewingMember.bio || (isArabic ? 'لم تتوفر سيرة ذاتية بعد.' : 'No executive bio provided.')}
                </p>
              </div>

              {viewingMember.linkedinUrl && (
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">LinkedIn Profile</span>
                    <span className="text-slate-900 font-mono text-[11px] truncate">{viewingMember.linkedinUrl}</span>
                  </div>
                  <a
                    href={viewingMember.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#0077b5] text-white text-xs font-semibold hover:opacity-90 flex items-center gap-1 shrink-0"
                  >
                    <span>{isArabic ? 'فتح الملف' : 'Visit'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-400 block mb-1 font-medium">{isArabic ? 'الموافقات والتعهدات التنظيمية' : 'Governance & Consents'}</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#008765]" />
                    <span>Data Processing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#008765]" />
                    <span>Code of Conduct</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {viewingMember.consentPhotoPublish ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#008765]" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>Photo Publication</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {viewingMember.status !== 'approved' && (
                  <button
                    onClick={() => {
                      handleApproveMember(viewingMember.id);
                      setViewingMember(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'اعتماد الطلب' : 'Approve Application'}</span>
                  </button>
                )}
                {viewingMember.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      const m = viewingMember;
                      setViewingMember(null);
                      handleInitiateRejectMember(m);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'رفض الطلب' : 'Reject Application'}</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    const m = viewingMember;
                    setViewingMember(null);
                    handleOpenEditMember(m);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تعديل البيانات' : 'Edit Profile'}</span>
                </button>
              </div>

              <button
                onClick={() => setViewingMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Profile Edit Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-serif-display text-base font-bold text-slate-900">
                {isArabic ? 'تعديل بيانات العضو القيادي' : 'Edit Member Profile & Permissions'}
              </h4>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {memberEditError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {memberEditError}
              </div>
            )}

            <form onSubmit={handleSaveMember} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'الاسم الكامل *' : 'Full Name *'}</label>
                <input
                  type="text"
                  required
                  value={editMemberForm.fullName}
                  onChange={e => setEditMemberForm({ ...editMemberForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'البريد المهني *' : 'Professional Email *'}</label>
                <input
                  type="email"
                  required
                  value={editMemberForm.professionalEmail}
                  onChange={e => setEditMemberForm({ ...editMemberForm, professionalEmail: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'المسمى الوظيفي *' : 'Job Title *'}</label>
                <input
                  type="text"
                  required
                  value={editMemberForm.jobTitle}
                  onChange={e => setEditMemberForm({ ...editMemberForm, jobTitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'المؤسسة / المستشفى *' : 'Organization *'}</label>
                <input
                  type="text"
                  required
                  value={editMemberForm.organization}
                  onChange={e => setEditMemberForm({ ...editMemberForm, organization: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'التخصص الطبي / الإداري *' : 'Specialty *'}</label>
                <input
                  type="text"
                  required
                  value={editMemberForm.specialty}
                  onChange={e => setEditMemberForm({ ...editMemberForm, specialty: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'حالة العضوية *' : 'Membership Status *'}</label>
                <select
                  value={editMemberForm.status}
                  onChange={e => setEditMemberForm({ ...editMemberForm, status: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  <option value="approved">{isArabic ? 'معتمد (Approved)' : 'Approved'}</option>
                  <option value="pending">{isArabic ? 'قيد المراجعة (Pending)' : 'Pending'}</option>
                  <option value="rejected">{isArabic ? 'مرفوض (Rejected)' : 'Rejected'}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'الدور / الصلاحيات *' : 'Role & Privileges *'}</label>
                <select
                  value={editMemberForm.role}
                  onChange={e => setEditMemberForm({ ...editMemberForm, role: e.target.value as any })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  <option value="approved_member">{isArabic ? 'عضو قيادي معتمد (Approved Member)' : 'Approved Member'}</option>
                  <option value="pending_member">{isArabic ? 'عضو قيد المراجعة (Pending Member)' : 'Pending Member'}</option>
                  <option value="administrator">{isArabic ? 'مشرف نظام (Administrator)' : 'Administrator'}</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={editMemberForm.linkedinUrl}
                  onChange={e => setEditMemberForm({ ...editMemberForm, linkedinUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'السيرة الذاتية التنفيذية' : 'Executive Bio'}</label>
                <textarea
                  rows={3}
                  value={editMemberForm.bio}
                  onChange={e => setEditMemberForm({ ...editMemberForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  disabled={memberEditLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer hover:bg-slate-200"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={memberEditLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white font-semibold cursor-pointer disabled:opacity-50"
                >
                  {memberEditLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{memberEditLoading ? (isArabic ? 'جارٍ الحفظ...' : 'Saving...') : (isArabic ? 'حفظ التعديلات' : 'Save Changes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Rejection Confirmation Modal */}
      {rejectingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  {isArabic ? 'تأكيد رفض طلب العضوية' : 'Confirm Membership Rejection'}
                </h4>
                <p className="text-xs text-slate-500">{rejectingMember.fullName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? `هل أنت متأكد من رغبتك في تحديث حالة طلب ${rejectingMember.fullName} إلى مرفوض؟ سيتم منع العضو من المشاركة العامة، ويمكن إعادة تفعيل الطلب لاحقاً.`
                : `Are you sure you want to mark the application for ${rejectingMember.fullName} as Rejected? The applicant will not be able to post topics or reflections.`}
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectMember}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>{isArabic ? 'تأكيد الرفض' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Edit Modal */}
      {editingTopic && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-7 space-y-4 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-serif-display text-base font-bold text-slate-900">
                {isArabic ? 'تعديل الأطروحة القيادية' : 'Edit Discussion Topic'}
              </h4>
              <button
                onClick={() => setEditingTopic(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'مسار الأطروحة *' : 'Track / Category *'}</label>
                <select
                  value={editTopicForm.category}
                  onChange={e => setEditTopicForm({ ...editTopicForm, category: e.target.value as TopicCategory })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                >
                  {TOPIC_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'عنوان الأطروحة *' : 'Topic Title *'}</label>
                <input
                  type="text"
                  required
                  value={editTopicForm.title}
                  onChange={e => setEditTopicForm({ ...editTopicForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-semibold">{isArabic ? 'محتوى الأطروحة والرؤية *' : 'Topic Body & Content *'}</label>
                <textarea
                  rows={5}
                  required
                  value={editTopicForm.body}
                  onChange={e => setEditTopicForm({ ...editTopicForm, body: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold cursor-pointer hover:bg-slate-200"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white font-semibold cursor-pointer"
                >
                  {isArabic ? 'حفظ الأطروحة' : 'Save Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topic Deletion Confirmation Modal */}
      {deletingTopic && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  {isArabic ? 'تأكيد حذف الأطروحة نهائياً' : 'Confirm Topic Deletion'}
                </h4>
                <p className="text-xs text-slate-500 truncate max-w-xs">{deletingTopic.title}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? 'هل أنت متأكد من رغبتك في حذف هذه الأطروحة وكافة التفاعلات المرتبطة بها نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذه العملية.'
                : 'Are you sure you want to permanently delete this discussion topic and all associated reflections? This action is irreversible.'}
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingTopic(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTopic}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleteLoading ? (isArabic ? 'جارٍ الحذف...' : 'Deleting...') : (isArabic ? 'حذف نهائي' : 'Delete Topic')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Deletion Confirmation Modal */}
      {deletingComment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  {isArabic ? 'تأكيد حذف المداخلة نهائياً' : 'Confirm Reflection Deletion'}
                </h4>
                <p className="text-xs text-slate-500">By {deletingComment.authorName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? 'هل أنت متأكد من رغبتك في حذف هذه المداخلة نهائياً من قاعدة البيانات؟'
                : 'Are you sure you want to permanently delete this peer reflection from the community database?'}
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingComment(null)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                {isArabic ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteComment}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleteLoading ? (isArabic ? 'جارٍ الحذف...' : 'Deleting...') : (isArabic ? 'حذف نهائي' : 'Delete Reflection')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-Authentication Modal for Server Admin Session Renewal */}
      {reauthOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-200 text-amber-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-display text-base font-bold text-slate-900">
                  {isArabic ? 'تجديد الجلسة وتوثيق هوية الإدارة' : 'Renew Administrator Authorization'}
                </h4>
                <p className="text-[11px] text-slate-500 font-mono">
                  {currentUser?.professionalEmail || 'Ashrafgalalsalem@gmail.com'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {isArabic
                ? 'انتهت صلاحية جلسة الإدارة المشفرة أو يلزم التحقق من هوية المشرف الرئيسي مع السيرفر لحفظ التعديلات أو حذف السجلات. يرجى إدخال كلمة مرور المشرف.'
                : 'Your server administrator session token requires renewal to perform protected modifications. Please enter your administrator password to re-verify your identity.'}
            </p>

            {reauthError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {reauthError}
              </div>
            )}

            <form onSubmit={handleReauthSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isArabic ? 'كلمة مرور المشرف الرئيسي' : 'Administrator Password'}
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={reauthPassword}
                  onChange={e => setReauthPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReauthOpen(false)}
                  disabled={reauthLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={reauthLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {reauthLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{reauthLoading ? (isArabic ? 'جارٍ التوثيق...' : 'Verifying...') : (isArabic ? 'توثيق وتفعيل' : 'Unlock & Authorize')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
