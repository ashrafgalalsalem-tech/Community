import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { repository } from '../lib/storage';
import { generateCsv, triggerDownload } from '../lib/sanitization';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Award,
  Video,
  Camera,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

import { getLocalizedRound, getLocalizedStatus, getLocalizedVenueType } from '../lib/localization';

interface RoundDetailViewProps {
  roundId: string;
  onNavigate: (view: string, param?: string) => void;
  onOpenRegister: () => void;
}

export const RoundDetailView: React.FC<RoundDetailViewProps> = ({ roundId, onNavigate, onOpenRegister }) => {
  const { currentUser, isApproved, isPending, isAdmin } = useAuth();
  const { isArabic, t, language } = useLanguage();
  const rawRound = repository.getRoundById(roundId) || repository.getRounds()[0];

  const [rsvpNotes, setRsvpNotes] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!rawRound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-900 font-display">
          {isArabic ? 'لم يتم العثور على الراوند المطلوب' : 'Leadership Round Not Found'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          {isArabic
            ? 'سجل هذا الراوند غير متوفر حالياً أو لم يتم نشره بعد.'
            : 'The requested leadership round record could not be located or has not been published yet.'}
        </p>
        <Button
          variant="secondary"
          size="md"
          onClick={() => onNavigate('rounds')}
        >
          {t.roundDetail.backToRounds}
        </Button>
      </div>
    );
  }

  // Localized round presentation in 100% pure English or Arabic
  const round = getLocalizedRound(rawRound, language);
  const roundDisplay = round;
  const isUserRegistered = currentUser ? repository.isRegistered(round.id, currentUser.id) : false;
  const galleryAttendees = repository.getRoundGalleryAttendees(round.id);
  const totalAttendedCount = repository.getAttendance(round.id).filter(a => a.attended).length;
  const registrations = repository.getRegistrations(round.id);

  const handleRsvp = () => {
    if (!currentUser) return;
    setFeedback(null);
    const res = repository.rsvpRound(round.id, currentUser, rsvpNotes);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: res.error || (isArabic ? 'تم تأكيد حجز مقعدك بنجاح في هذا الراوند!' : 'Your registration has been confirmed!'),
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || (isArabic ? 'تعذر تأكيد التسجيل.' : 'Registration failed.'),
      });
    }
  };

  const handleCancelRsvp = () => {
    if (!currentUser) return;
    setFeedback(null);
    const ok = repository.cancelRsvp(round.id, currentUser.id);
    if (ok) {
      setFeedback({
        type: 'success',
        message: isArabic ? 'تم إلغاء حجز المقعد بنجاح.' : 'Your registration RSVP was cancelled.',
      });
    }
  };

  const handleShareLink = () => {
    const url = window.location.origin + '#/rounds/' + round.id;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleExportRoster = () => {
    if (!isAdmin) return;
    const headers = ['Registration ID', 'Member Name', 'Job Title', 'Organization', 'Email', 'Status', 'Registered At'];
    const rows = registrations.map(r => [
      r.id,
      r.memberName,
      r.memberTitle,
      r.memberOrg,
      r.memberEmail,
      r.status,
      r.registeredAt,
    ]);
    const csv = generateCsv(headers, rows);
    triggerDownload(`Round_${round.id}_Registrations.csv`, csv);
  };

  const handleExportAttendance = () => {
    if (!isAdmin) return;
    const atts = repository.getAttendance(round.id);
    const headers = ['Attendance ID', 'Member Name', 'Job Title', 'Organization', 'Attended', 'Photo Consent', 'CME Credits', 'Verified At'];
    const rows = atts.map(a => [
      a.id,
      a.memberName,
      a.memberTitle,
      a.memberOrg,
      a.attended ? 'Yes' : 'No',
      a.consentPhotoPublish ? 'Granted' : 'Declined',
      a.cmeCreditsEarned,
      a.verifiedAt || 'Pending',
    ]);
    const csv = generateCsv(headers, rows);
    triggerDownload(`Round_${round.id}_Attendance.csv`, csv);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('rounds')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008765] rounded-md px-2 py-1"
        >
          {isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{t.roundDetail.backToRounds}</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShareLink}
            leftIcon={<Share2 className="w-3.5 h-3.5 text-[#008765]" />}
          >
            {copiedLink ? t.roundDetail.linkCopied : t.roundDetail.shareLink}
          </Button>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportRoster}
                leftIcon={<Download className="w-3.5 h-3.5 text-[#0284C7]" />}
              >
                {t.roundDetail.exportRoster}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleExportAttendance}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                {t.roundDetail.exportAttendance}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Header Card */}
      <Card className="p-6 sm:p-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm">
              {getLocalizedVenueType(round.venueType, language)}
            </Badge>
            {round.isFirstAdminConfirmedRound && (
              <Badge variant="blue" size="sm">
                {isArabic ? `الراوند الافتتاحي المعتمد • ${roundDisplay.scheduledDate}` : `Inaugural Round • ${roundDisplay.scheduledDate}`}
              </Badge>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            <code className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">/rounds/{round.id}</code>
          </div>
        </div>

        <div className="space-y-3 max-w-4xl">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-display leading-tight tracking-tight">
            {roundDisplay.title}
          </h1>
          <p className="text-base text-[#008765] font-semibold">
            {roundDisplay.topic}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {roundDisplay.description}
          </p>
        </div>

        {/* Vital Logistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="flex items-start gap-2.5">
            <Calendar className="w-4 h-4 text-[#008765] shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[11px]">{t.common.date} & {t.common.time}</span>
              <strong className="text-slate-900 text-sm tabular-nums">{roundDisplay.scheduledDate}</strong>
              <span className="text-slate-500 block tabular-nums">{roundDisplay.scheduledTime}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[11px]">{t.common.venue}</span>
              <strong className="text-slate-900 leading-tight">{roundDisplay.venue}</strong>
              {round.virtualLink && (
                <span className="text-[#0284C7] block flex items-center gap-1 mt-0.5 font-medium">
                  <Video className="w-3 h-3" /> {isArabic ? 'بث رقمي مباشر متاح' : 'Hybrid Stream Available'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-[#008765] shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-400 block text-[11px]">{t.common.capacity}</span>
              <strong className="text-slate-900 text-sm tabular-nums">
                {round.currentRegistrationsCount} / {round.maxCapacity || (isArabic ? 'غير محدد' : 'Unlimited')}
              </strong>
              <span className="text-slate-500 block tabular-nums">
                {round.durationMinutes} {isArabic ? 'دقيقة جلسة قيادية' : 'minutes session'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Agenda & Keynote Facilitators */}
        <div className="lg:col-span-2 space-y-8">
          {/* Keynote Facilitators */}
          {round.speakers && round.speakers.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#008765]" />
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {t.roundDetail.speakersTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {round.speakers.map(spk => (
                  <div key={spk.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#E6F4F1] text-[#008765] font-bold font-display flex items-center justify-center text-sm shrink-0 border border-[#A7F3D0]">
                        {spk.name[0]}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 font-display">{spk.name}</h4>
                        <p className="text-[11px] text-[#008765] font-semibold">{spk.title}</p>
                        <p className="text-[10px] text-slate-500">{spk.organization}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Agenda Schedule */}
          {round.agenda && round.agenda.length > 0 && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#008765]" />
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  {t.roundDetail.agendaTitle}
                </h3>
              </div>

              <div className="space-y-3">
                {round.agenda.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="px-2.5 py-1 rounded bg-white border border-slate-200 text-[#008765] text-xs font-mono font-bold shrink-0 shadow-2xs tabular-nums">
                      {item.time}
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 font-display">{item.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                      {item.speaker && (
                        <span className="text-[11px] text-[#008765] font-medium block pt-0.5">
                          {isArabic ? `بإشراف: ${item.speaker}` : `Facilitated by: ${item.speaker}`}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Verified Attendees Gallery */}
          <Card className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#008765]" />
                  <h3 className="text-lg font-bold text-slate-900 font-display">
                    {isArabic ? 'سجل حضور القيادات' : 'Round Attendees Gallery'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isArabic
                    ? 'سجل الحضور القيادي المعتمد وفق إقرارات الخصوصية الرسمية.'
                    : 'Verified clinical leadership presence and peer exchange records.'}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Badge variant="emerald" size="sm">
                  {isArabic ? `${galleryAttendees.length} مصرح بنشر صورهم` : `${galleryAttendees.length} Consented Photos`}
                </Badge>
                <span className="text-slate-300" aria-hidden="true">•</span>
                <span className="text-slate-500 tabular-nums">
                  {isArabic ? `${totalAttendedCount} تم تأكيد حضورهم` : `${totalAttendedCount} Verified Attended`}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
              <Shield className="w-4 h-4 text-[#008765] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#065F46]">
                  {isArabic ? 'ضوابط حماية الخصوصية القيادية:' : 'Privacy Dual-Key Rule Enforced:'}
                </strong>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {isArabic
                    ? 'تظهر البيانات فقط للمشاركين الذين تم تأكيد حضورهم الفعلي من الإدارة مع وجود موافقة مسجلة على النشر.'
                    : 'Photos appear ONLY for participants who have both admin-confirmed actual attendance and recorded photo publishing consent.'}
                </p>
              </div>
            </div>

            {galleryAttendees.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {galleryAttendees.map(att => (
                  <div key={att.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
                    <div className="w-14 h-14 rounded-full bg-[#E6F4F1] text-[#008765] font-bold text-lg flex items-center justify-center mx-auto border-2 border-[#008765]">
                      {att.memberName[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 font-display truncate">{att.memberName}</h4>
                      <p className="text-[10px] text-[#008765] truncate font-medium">{att.memberTitle}</p>
                      <p className="text-[10px] text-slate-500 truncate">{att.memberOrg}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                {isArabic
                  ? 'سيتم تحديث سجل الحضور هنا عقب انتهاء فعاليات الراوند واعتمادها رسمياً.'
                  : 'Attendance records will populate here following the verified conclusion of the round.'}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: RSVP Module */}
        <div className="space-y-6">
          <Card className="p-6 space-y-5 sticky top-24">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#008765] uppercase tracking-wider font-display">
                {t.roundDetail.rsvpSectionTitle}
              </span>
              <Badge variant="emerald" size="sm">
                {getLocalizedStatus(round.status, language).toUpperCase()}
              </Badge>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                )}
                <div>{feedback.message}</div>
              </div>
            )}

            {isApproved ? (
              <div className="space-y-4">
                {isUserRegistered ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-[#008765]" />
                      <span>{t.roundDetail.alreadyRegistered}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {isArabic
                        ? 'تم حجز مقعدك القيادي. يرجى إبراز بطاقة العضوية أو بريدك المعتمد عند الوصول للاستقبال.'
                        : 'Your executive seat is reserved. Please present your professional credentials at the auditorium reception.'}
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelRsvp}
                      className="w-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      {t.roundDetail.cancelRsvp}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {isArabic ? 'ملاحظات خاصة بالحضور (اختياري)' : 'Attendance Notes (Optional)'}
                      </label>
                      <input
                        type="text"
                        placeholder={t.roundDetail.notesPlaceholder}
                        value={rsvpNotes}
                        onChange={e => setRsvpNotes(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] focus:ring-1 focus:ring-[#008765]"
                      />
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleRsvp}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      className="w-full uppercase tracking-wider"
                    >
                      {t.roundDetail.confirmRsvpBtn}
                    </Button>
                  </div>
                )}
              </div>
            ) : isPending ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>{t.common.pending}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t.roundDetail.pendingWarning}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-900 font-display">
                  {isArabic ? 'تأكيد الحضور مخصص للأعضاء' : 'Executive Membership Required'}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t.roundDetail.visitorPrompt}
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate('register')}
                  className="w-full"
                >
                  {t.common.register}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
