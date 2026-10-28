import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BRAND } from '../styles/tokens';
import { repository } from '../lib/storage';
import {
  Users,
  Award,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  LogIn,
  CheckCircle2,
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  Shield,
  Layers,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { AccreditationsSection } from '../components/AccreditationsSection';
import { MembershipBenefitsSection } from '../components/MembershipBenefitsSection';
import { PartnerLogoSlider } from '../components/PartnerLogoSlider';
import { CommunityLogo } from '../components/CommunityLogo';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

import { getLocalizedRound, getLocalizedVenueType } from '../lib/localization';

interface HomeViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenRegister?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, onOpenRegister }) => {
  const { isVisitor, currentUser, setIsMemberLoginOpen } = useAuth();
  const { isArabic, t, language } = useLanguage();

  // Retrieve upcoming published round for featured showcase
  const rounds = repository.getRounds();
  const rawFeaturedRound = rounds.find(r => r.isFirstAdminConfirmedRound) || rounds[0];
  const featuredRound = rawFeaturedRound ? getLocalizedRound(rawFeaturedRound, language) : null;

  return (
    <div className="bg-[#F8FAFC] pb-16 space-y-12 sm:space-y-16">
      {/* Executive Hero Section */}
      <section className="relative bg-white border-b border-slate-200/90 pt-10 sm:pt-14 pb-14 sm:pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Institutional Trust Kicker Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs">
            <Badge variant="emerald" size="md" icon={<Award className="w-3.5 h-3.5 text-[#008765]" />}>
              {t.common.topEmployer}
            </Badge>
            <span className="text-slate-300 hidden sm:inline" aria-hidden="true">|</span>
            <Badge variant="slate" size="md" icon={<Shield className="w-3.5 h-3.5 text-[#0094D9]" />}>
              {t.common.jciAccreditation}
            </Badge>
          </div>

          {/* Executive Crest & Title Presentation */}
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <div className="flex justify-center mb-3">
              <CommunityLogo size="hero" isArabic={isArabic} />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-display tracking-tight leading-tight [text-wrap:balance]">
              {t.home.heroTitle}
            </h1>

            <p className="text-base sm:text-lg font-bold text-[#008765] font-display max-w-2xl mx-auto">
              {t.home.heroSubtitle}
            </p>

            <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wide">
              {isArabic ? BRAND.taglineArabic : BRAND.tagline}
            </p>

            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed pt-1">
              {t.home.heroDesc}
            </p>
          </div>

          {/* Executive Action Strip */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isVisitor ? (
              <>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onNavigate('register')}
                  rightIcon={isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                >
                  {t.home.applyBtn}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setIsMemberLoginOpen(true)}
                  leftIcon={<LogIn className="w-4 h-4 text-[#008765]" />}
                >
                  {t.common.signIn}
                </Button>
              </>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-bold text-[#006B52] shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#008765]" />
                <span>
                  {t.home.welcomeMember
                    .replace('{name}', currentUser?.fullName || '')
                    .replace('{status}', currentUser?.status === 'approved' ? t.home.statusApproved : t.home.statusPending)}
                </span>
              </div>
            )}

            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('rounds')}
              leftIcon={<Calendar className="w-4 h-4 text-[#008765]" />}
            >
              {t.home.viewRoundsBtn}
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Upcoming Roundtable Spotlight */}
      {featuredRound && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card hoverAccent className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="emerald" size="sm" icon={<Sparkles className="w-3 h-3 text-[#008765]" />}>
                    {t.home.inauguralTitle}
                  </Badge>
                  <span className="text-xs text-slate-500 font-medium capitalize">
                    {getLocalizedVenueType(featuredRound.venueType, language)}
                  </span>
                </div>

                <h3
                  onClick={() => onNavigate('round_detail', featuredRound.id)}
                  className="text-xl sm:text-2xl font-bold text-slate-900 font-display leading-snug tracking-tight hover:text-[#008765] transition-colors cursor-pointer"
                >
                  {featuredRound.title}
                </h3>

                <p className="text-xs sm:text-sm font-semibold text-[#008765]">
                  {featuredRound.topic}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-4 h-4 text-[#008765]" />
                    <strong className="text-slate-800">
                      {featuredRound.scheduledDate}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-4 h-4 text-[#0094D9]" />
                    <span>{featuredRound.scheduledTime}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{featuredRound.venue}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate('round_detail', featuredRound.id)}
                >
                  {t.home.registerForRoundBtn}
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => onNavigate('rounds')}
                >
                  {t.home.viewAgendaBtn}
                </Button>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Strategic Pillars of Healthcare Leadership */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <p className="text-xs font-bold text-[#008765] uppercase tracking-wider font-display">
            {isArabic ? 'محاور العمل القيادي والمؤسسي' : 'Strategic Pillars of Leadership'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            {t.home.pillarsTitle}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {t.home.pillarsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Human Capital */}
          <Card hoverAccent className="p-6 sm:p-7 space-y-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#E6F4F1] text-[#008765] border border-[#A7F3D0] flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display tracking-tight">
              {t.home.pillar1Title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.home.pillar1Desc}
            </p>
          </Card>

          {/* Pillar 2: Clinical Governance */}
          <Card hoverAccent className="p-6 sm:p-7 space-y-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] flex items-center justify-center font-bold">
              <Briefcase className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display tracking-tight">
              {t.home.pillar2Title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.home.pillar2Desc}
            </p>
          </Card>

          {/* Pillar 3: Leadership Academies */}
          <Card hoverAccent className="p-6 sm:p-7 space-y-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-display tracking-tight">
              {t.home.pillar3Title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {t.home.pillar3Desc}
            </p>
          </Card>
        </div>
      </section>

      {/* Verified Accreditations & Strategic Partnerships Section */}
      <AccreditationsSection />

      {/* Verified Membership Benefits Section */}
      <MembershipBenefitsSection onOpenRegister={onOpenRegister || (() => onNavigate('register'))} />

      {/* Community Call to Action Card */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="p-8 sm:p-10 text-center space-y-5">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-display tracking-tight">
              {t.home.ctaTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
              {t.home.ctaDesc}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => onNavigate('register')}
              rightIcon={isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            >
              {t.common.register}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setIsMemberLoginOpen(true)}
              leftIcon={<LogIn className="w-4 h-4 text-[#008765]" />}
            >
              {t.common.signIn}
            </Button>
          </div>
        </Card>
      </section>

      {/* Verified Partner Logo Slider */}
      <PartnerLogoSlider />
    </div>
  );
};
