import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { repository } from '../lib/storage';
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Search,
  PlusCircle,
  CheckCircle2,
  UserPlus,
  Clock,
  X,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { getLocalizedRound, getLocalizedStatus, getLocalizedVenueType } from '../lib/localization';

interface RoundsViewProps {
  onNavigate: (view: string, param?: string) => void;
  onOpenRegister: () => void;
}

export const RoundsView: React.FC<RoundsViewProps> = ({ onNavigate, onOpenRegister }) => {
  const { isVisitor, isAdmin, currentUser } = useAuth();
  const { isArabic, t, language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'published' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [rsvpSuccessMap, setRsvpSuccessMap] = useState<Record<string, boolean>>({});
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const allRounds = repository.getRounds();
  const filteredRounds = allRounds.filter(r => {
    if (filter === 'published' && r.status !== 'published') return false;
    if (filter === 'archived' && r.status !== 'archived') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const loc = getLocalizedRound(r, language);
      return (
        r.title.toLowerCase().includes(q) ||
        r.topic.toLowerCase().includes(q) ||
        r.venue.toLowerCase().includes(q) ||
        loc.title.toLowerCase().includes(q) ||
        loc.topic.toLowerCase().includes(q) ||
        loc.venue.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleQuickRegister = (roundId: string) => {
    setNoticeMessage(null);
    if (isVisitor || !currentUser) {
      onOpenRegister();
      return;
    }

    if (currentUser.status !== 'approved') {
      setNoticeMessage(
        isArabic
          ? 'طلب عضويتكم قيد المراجعة الإدارية حالياً. سيتم تفعيل حجز المقاعد فور اعتماد الحساب.'
          : 'Your membership application is currently under administrative review. Seat reservations will be activated upon approval.'
      );
      setTimeout(() => setNoticeMessage(null), 5000);
      return;
    }

    const res = repository.rsvpRound(roundId, currentUser);
    if (res.success) {
      setRsvpSuccessMap(prev => ({ ...prev, [roundId]: true }));
      setNoticeMessage(
        isArabic
          ? 'تم تأكيد حجز مقعدكم في هذا الراوند القيادي بنجاح!'
          : 'Your seat has been reserved successfully for this executive round!'
      );
      setTimeout(() => setNoticeMessage(null), 4000);
    } else {
      setNoticeMessage(
        res.error ||
          (isArabic
            ? 'تعذر تأكيد التسجيل في الراوند حالياً.'
            : 'Unable to confirm registration for this round.')
      );
      setTimeout(() => setNoticeMessage(null), 5000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-[#008765]" />}>
              {t.rounds.badge}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
            {t.rounds.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            {t.rounds.subtitle}
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate('admin')}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="self-start md:self-auto"
          >
            {t.rounds.addRoundAdmin}
          </Button>
        )}
      </div>

      {/* Global In-App Notice Banner (No alert popups) */}
      {noticeMessage && (
        <div className="p-4 rounded-xl bg-[#E6F4F1] border border-[#A7F3D0] text-[#006B52] text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#008765] shrink-0" />
            <span>{noticeMessage}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-[#006B52] hover:text-[#004D3A] p-1 rounded-md"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3.5' : 'left-3.5'}`} />
          <input
            type="text"
            placeholder={t.rounds.searchPlaceholder}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={`w-full py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#008765] focus:ring-1 focus:ring-[#008765] transition-colors ${
              isArabic ? 'pr-9 pl-3.5' : 'pl-9 pr-3.5'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            {t.rounds.filterStatus}
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-lg gap-1 border border-slate-200">
            {(['all', 'published', 'archived'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'all'
                  ? t.rounds.filterAll
                  : tab === 'published'
                  ? t.rounds.filterPublished
                  : t.rounds.filterArchived}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rounds List */}
      <div className="space-y-6">
        {filteredRounds.length > 0 ? (
          filteredRounds.map(round => {
            const isUserRegistered =
              currentUser &&
              (repository.isRegistered(round.id, currentUser.id) || rsvpSuccessMap[round.id]);
            const roundDisplay = getLocalizedRound(round, language);

            return (
              <Card
                key={round.id}
                hoverAccent
                className="p-6 sm:p-7 space-y-4"
              >
                {/* Status & Capacity Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="emerald" size="sm">
                      {getLocalizedVenueType(round.venueType, language)}
                    </Badge>
                    {round.isFirstAdminConfirmedRound && (
                      <Badge variant="blue" size="sm">
                        {isArabic ? `الراوند الافتتاحي المعتمد • ${roundDisplay.scheduledDate}` : `Inaugural Round • ${roundDisplay.scheduledDate}`}
                      </Badge>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      {getLocalizedStatus(round.status, language)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-medium tabular-nums">
                    {t.rounds.seats}: <strong className="text-slate-900 font-bold">{round.currentRegistrationsCount}</strong> /{' '}
                    {round.maxCapacity || (isArabic ? 'غير محدودة' : 'Unlimited')}
                  </div>
                </div>

                {/* Round Title & Description */}
                <div className="space-y-1.5">
                  <h2
                    onClick={() => onNavigate('round_detail', round.id)}
                    className="text-xl sm:text-2xl font-bold text-slate-900 font-display hover:text-[#008765] transition-colors cursor-pointer leading-snug tracking-tight"
                  >
                    {roundDisplay.title}
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-[#008765]">{roundDisplay.topic}</p>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed pt-1">
                    {roundDisplay.description}
                  </p>
                </div>

                {/* Logistics Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3.5 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2 tabular-nums">
                    <Calendar className="w-4 h-4 text-[#008765] shrink-0" />
                    <span>
                      {roundDisplay.scheduledDate} ({roundDisplay.scheduledTime})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0094D9] shrink-0" />
                    <span className="truncate">{roundDisplay.venue}</span>
                  </div>
                  <div className="flex items-center gap-2 tabular-nums">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {isArabic
                        ? `${roundDisplay.speakers.length} متحدثون وقادة جلسات`
                        : `${roundDisplay.speakers.length} Distinguished Speakers & Chairs`}
                    </span>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="pt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{round.durationMinutes} {isArabic ? 'دقيقة' : 'minutes session'}</span>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto w-full sm:w-auto justify-end">
                    {/* Direct RSVP Button */}
                    {isUserRegistered ? (
                      <Badge variant="emerald" size="md" icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#008765]" />}>
                        {t.rounds.rsvpedBtn}
                      </Badge>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleQuickRegister(round.id)}
                        leftIcon={<UserPlus className="w-4 h-4" />}
                      >
                        {t.rounds.rsvpBtn}
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onNavigate('round_detail', round.id)}
                      rightIcon={isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    >
                      {t.rounds.viewDetails}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="text-center py-16 p-8 space-y-4">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 font-display">
                {t.rounds.noRoundsTitle}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {t.rounds.noRoundsDesc}
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('admin')}
              >
                {t.rounds.addRoundAdmin}
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
