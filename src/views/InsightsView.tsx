import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { repository } from '../lib/storage';
import { TopicCategory, TOPIC_CATEGORIES } from '../styles/tokens';
import { inspectHealthcareContent } from '../lib/sanitization';
import { getLocalizedCategory } from '../lib/localization';
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  PlusCircle,
  Pin,
  Shield,
  Search,
  Lock,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  Calendar,
  Clock,
} from 'lucide-react';

interface InsightsViewProps {
  onOpenRegister: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onOpenRegister }) => {
  const { currentUser, isApproved, isAdmin } = useAuth();
  const { isArabic, t, language } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'comments'>('newest');
  const [refreshKey, setRefreshKey] = useState(0);

  // Submit modal state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState<TopicCategory>('Human Capital Management');
  const [newTopicBody, setNewTopicBody] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Active topic comment view state
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [expandedBodies, setExpandedBodies] = useState<Record<string, boolean>>({});
  const [newCommentText, setNewCommentText] = useState<{ [topicId: string]: string }>({});
  const [commentError, setCommentError] = useState<{ [topicId: string]: string }>({});
  const [commentNotice, setCommentNotice] = useState<{ [topicId: string]: string }>({});

  useEffect(() => {
    // Fetch fresh topics and comments from server API
    repository.fetchTopicsAsync(isAdmin, currentUser?.id).then(() => setRefreshKey(k => k + 1));
    repository.fetchCommentsAsync(undefined, isAdmin, currentUser?.id).then(() => setRefreshKey(k => k + 1));
  }, [isAdmin, currentUser?.id]);

  const allTopics = repository.getTopics(isAdmin, currentUser?.id);

  const filteredTopics = allTopics.filter(topic => {
    if (selectedCategory !== 'All' && topic.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        topic.title.toLowerCase().includes(q) ||
        topic.body.toLowerCase().includes(q) ||
        topic.authorName.toLowerCase().includes(q) ||
        topic.authorOrg.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredTopics.sort((a, b) => {
    if (a.status === 'pinned' && b.status !== 'pinned') return -1;
    if (b.status === 'pinned' && a.status !== 'pinned') return 1;

    if (sortBy === 'likes') return b.likeCount - a.likeCount;
    if (sortBy === 'comments') return b.commentCount - a.commentCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const toggleBodyExpansion = (topicId: string) => {
    setExpandedBodies(prev => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const handleToggleReaction = async (topicId: string, type: 'like' | 'dislike') => {
    if (!currentUser || !isApproved) return;
    repository.toggleReaction(topicId, currentUser, type);
    setRefreshKey(k => k + 1);
  };

  const handleAddComment = async (topicId: string) => {
    if (!currentUser || !isApproved) return;
    const content = newCommentText[topicId] || '';
    if (!content.trim()) return;

    const check = inspectHealthcareContent(content);
    if (!check.isSafe) {
      setCommentError({
        ...commentError,
        [topicId]: check.reason || (isArabic ? 'فشل فحص سلامة المحتوى.' : 'Safety validation failed.'),
      });
      return;
    }

    const res = await repository.addCommentAsync(topicId, currentUser, content);
    if (res.success) {
      setNewCommentText({ ...newCommentText, [topicId]: '' });
      setCommentError({ ...commentError, [topicId]: '' });
      if (!isAdmin) {
        setCommentNotice({
          ...commentNotice,
          [topicId]: isArabic
            ? 'تم إرسال مداخلتك بنجاح وهي قيد مراجعة الإدارة قبل النشر للجميع.'
            : 'Your reflection has been submitted and is pending administrator review before public display.',
        });
      }
      setRefreshKey(k => k + 1);
    } else {
      setCommentError({
        ...commentError,
        [topicId]: res.error || (isArabic ? 'تعذر نشر المداخلة.' : 'Failed to post reflection.'),
      });
    }
  };

  const handleSubmitNewTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isApproved) return;
    setSubmitError(null);
    setSubmitSuccess(null);

    const check = inspectHealthcareContent(newTopicTitle + ' ' + newTopicBody);
    if (!check.isSafe) {
      setSubmitError(check.reason || (isArabic ? 'فشل فحص سلامة المحتوى.' : 'Safety validation failed.'));
      return;
    }

    const res = await repository.submitTopicAsync(
      currentUser,
      newTopicTitle,
      newTopicCategory,
      newTopicBody
    );

    if (!res.success) {
      setSubmitError(res.error || (isArabic ? 'تعذر نشر الموضوع.' : 'Failed to publish topic.'));
      return;
    }

    setSubmitSuccess(
      isArabic
        ? (isAdmin
            ? 'تم نشر الرؤية القيادية بنجاح!'
            : 'تم تقديم الأطروحة بنجاح وهي قيد مراجعة الإدارة قبل ظهورها للعامة.')
        : (isAdmin
            ? 'Leadership discussion topic published successfully!'
            : 'Discussion topic submitted and awaiting administrator approval before public listing.')
    );
    setRefreshKey(k => k + 1);
    setTimeout(() => {
      setIsSubmitModalOpen(false);
      setNewTopicTitle('');
      setNewTopicBody('');
      setSubmitSuccess(null);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-[#006B52]">
            <Shield className="w-3.5 h-3.5 text-[#008765]" />
            <span>
              {isArabic
                ? 'منصة الفكر والقيادة الاستراتيجية • مجتمع القيادة الصحية'
                : 'Executive Thought Leadership • Healthcare Leadership Community'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            {t.insights.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
            {t.insights.subtitle}
          </p>
        </div>

        <div className="shrink-0">
          {isApproved ? (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.insights.newDiscussionBtn}</span>
            </button>
          ) : (
            <button
              onClick={onOpenRegister}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#008765]" />
              <span>{isArabic ? 'سجل للمشاركة والتفاعل' : 'Register to Participate'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs & Interactive Search */}
      <div className="space-y-4">
        {/* Track Segmented Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {isArabic ? `كافة المسارات (${allTopics.length})` : `All Tracks (${allTopics.length})`}
          </button>
          {TOPIC_CATEGORIES.map(cat => {
            const count = allTopics.filter(tp => tp.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#008765] text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {getLocalizedCategory(cat, language)} {count > 0 && <span className="opacity-70 ml-1">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="relative w-full sm:w-96">
            <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${isArabic ? 'right-3.5' : 'left-3.5'}`} />
            <input
              type="text"
              placeholder={isArabic ? 'البحث في النقاشات بالعنوان، اسم الكاتب، المؤسسة...' : 'Search discussions by keyword, author, or organization...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#008765] focus:ring-1 focus:ring-[#008765] transition-colors ${
                isArabic ? 'pr-9 pl-3.5 text-right' : 'pl-9 pr-3.5 text-left'
              }`}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs text-slate-600">
            <span className="font-medium shrink-0">{isArabic ? 'الترتيب حسب:' : 'Sort by:'}</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white focus:border-[#008765] cursor-pointer"
            >
              <option value="newest">{isArabic ? 'الأحدث أولاً' : 'Most Recent'}</option>
              <option value="likes">{isArabic ? 'الأكثر تأييداً' : 'Most Recommended'}</option>
              <option value="comments">{isArabic ? 'الأكثر تفاعلاً ونقاشاً' : 'Most Discussed'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discussion Cards Feed */}
      <div className="space-y-6">
        {filteredTopics.length > 0 ? (
          filteredTopics.map(topic => {
            const userReaction = currentUser ? repository.getUserReaction(topic.id, currentUser.id) : undefined;
            const comments = repository.getComments(topic.id, isAdmin, currentUser?.id);
            const isCommentsOpen = expandedTopicId === topic.id;
            const isBodyExpanded = Boolean(expandedBodies[topic.id]);

            const isLongBody = topic.body.length > 280;
            const displayedBody = !isLongBody || isBodyExpanded
              ? topic.body
              : topic.body.slice(0, 260) + '...';

            return (
              <article
                key={topic.id}
                className="bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="p-6 sm:p-7 space-y-4">
                  {/* Author Header & Track Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {topic.authorPhotoUrl ? (
                        <img
                          src={topic.authorPhotoUrl}
                          alt={topic.authorName}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                          onError={(e) => {
                            // Graceful fallback to monogram on image error
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: topic.authorPhotoUrl ? 'none' : 'flex' }}
                        className="w-12 h-12 rounded-full bg-slate-100 text-[#006B52] border border-slate-200 font-bold text-base items-center justify-center shrink-0 shadow-2xs"
                      >
                        {topic.authorName ? topic.authorName[0] : <User className="w-5 h-5 text-slate-400" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                            {topic.authorName}
                          </h3>
                          {topic.status === 'pinned' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-semibold shrink-0">
                              <Pin className="w-2.5 h-2.5" />
                              {isArabic ? 'رؤية مثبتة' : 'Pinned Insight'}
                            </span>
                          )}
                          {topic.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-semibold shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              {isArabic ? 'قيد مراجعة الإدارة' : 'Pending Review'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-[13px] text-[#006B52] font-semibold truncate leading-tight mt-0.5">
                          {topic.authorTitle}
                        </p>
                        <p className="text-[11px] sm:text-xs text-slate-500 truncate leading-tight mt-0.5">
                          {topic.authorOrg}
                          <span className="mx-1.5 opacity-60">·</span>
                          <span>{new Date(topic.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>

                    {/* Category Pill Badge */}
                    <div className="shrink-0 self-start sm:self-auto">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-[#006B52] border border-emerald-200/90 whitespace-nowrap">
                        {getLocalizedCategory(topic.category, language)}
                      </span>
                    </div>
                  </div>

                  {/* Discussion Title & Content */}
                  <div className="pt-2 space-y-2">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug break-words [overflow-wrap:anywhere]">
                      {topic.title}
                    </h2>
                    <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line">
                      {displayedBody}
                    </p>

                    {/* Read More / Show Less Toggle */}
                    {isLongBody && (
                      <button
                        onClick={() => toggleBodyExpansion(topic.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#008765] hover:text-[#006B52] pt-1 transition-colors cursor-pointer"
                      >
                        <span>
                          {isBodyExpanded
                            ? isArabic ? 'عرض أقل' : 'Show less'
                            : isArabic ? 'اقرأ المزيد' : 'Read more'}
                        </span>
                        {isBodyExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Subtle Hairline Divider */}
                  <div className="border-t border-slate-100 pt-3.5">
                    {/* Compact Aligned Reactions Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Agree Button */}
                        <button
                          onClick={() => handleToggleReaction(topic.id, 'like')}
                          disabled={!isApproved}
                          title={!isApproved ? (isArabic ? 'العضوية المعتمدة مطلوبة للتأييد' : 'Approved membership required to agree') : undefined}
                          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                            userReaction === 'like'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold shadow-2xs'
                              : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${userReaction === 'like' ? 'text-emerald-700 fill-emerald-100' : 'text-slate-500'}`} />
                          <span className="font-semibold">{topic.likeCount}</span>
                          <span className="hidden sm:inline font-medium">{isArabic ? 'أؤيد' : 'Agree'}</span>
                        </button>

                        {/* Disagree Button */}
                        <button
                          onClick={() => handleToggleReaction(topic.id, 'dislike')}
                          disabled={!isApproved}
                          title={!isApproved ? (isArabic ? 'العضوية المعتمدة مطلوبة للتعبير عن الرأي' : 'Approved membership required to express perspective') : undefined}
                          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                            userReaction === 'dislike'
                              ? 'bg-rose-50 text-rose-800 border-rose-300 font-semibold shadow-2xs'
                              : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <ThumbsDown className={`w-3.5 h-3.5 ${userReaction === 'dislike' ? 'text-rose-700 fill-rose-100' : 'text-slate-500'}`} />
                          <span className="font-semibold">{topic.dislikeCount}</span>
                          <span className="hidden sm:inline font-medium">{isArabic ? 'أعارض' : 'Disagree'}</span>
                        </button>

                        {/* Reflections Toggle Button */}
                        <button
                          onClick={() => setExpandedTopicId(isCommentsOpen ? null : topic.id)}
                          className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                            isCommentsOpen
                              ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                              : 'bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100 border-slate-200 font-medium'
                          }`}
                        >
                          <MessageSquare className={`w-3.5 h-3.5 ${isCommentsOpen ? 'text-emerald-400' : 'text-[#008765]'}`} />
                          <span className="font-semibold">{comments.length}</span>
                          <span>{isArabic ? 'المداخلات' : 'Reflections'}</span>
                          {isCommentsOpen ? (
                            <ChevronUp className="w-3 h-3 ml-0.5 opacity-70" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
                          )}
                        </button>
                      </div>

                      {/* Quiet Status / Activity Marker */}
                      <div className="text-[11px] text-slate-400 font-medium">
                        {comments.length > 0
                          ? isArabic
                            ? `${comments.length} مداخلة من القيادات`
                            : `${comments.length} peer reflection${comments.length === 1 ? '' : 's'}`
                          : isArabic
                            ? 'بانتظار أول مداخلة'
                            : 'Open for peer reflections'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reflections & Perspectives Area */}
                {isCommentsOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-[#008765]" />
                        <span>
                          {isArabic
                            ? `المداخلات والرؤى الاستراتيجية (${comments.length})`
                            : `Executive Reflections & Insights (${comments.length})`}
                        </span>
                      </h4>
                    </div>

                    {/* Reflections List */}
                    <div className="space-y-3">
                      {comments.map(cmt => (
                        <div
                          key={cmt.id}
                          className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900">{cmt.authorName}</span>
                              {cmt.authorTitle && (
                                <span className="text-[#006B52] font-medium text-[11px]">· {cmt.authorTitle}</span>
                              )}
                              {cmt.authorOrg && (
                                <span className="text-slate-400 text-[11px]">({cmt.authorOrg})</span>
                              )}
                              {cmt.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 font-semibold">
                                  <Clock className="w-2.5 h-2.5" />
                                  {isArabic ? 'قيد مراجعة الإدارة' : 'Pending Review'}
                                </span>
                              )}
                              {cmt.status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-rose-800 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 font-semibold">
                                  {isArabic ? 'مرفوض' : 'Rejected'}
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {new Date(cmt.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed break-words [overflow-wrap:anywhere]">
                            {cmt.content}
                          </p>
                        </div>
                      ))}

                      {comments.length === 0 && (
                        <div className="py-6 text-center rounded-xl bg-white/60 border border-dashed border-slate-200 space-y-1">
                          <p className="text-xs text-slate-500 font-medium">
                            {isArabic
                              ? 'لم تسجل أي مداخلات بعد حول هذه الأطروحة.'
                              : 'No peer reflections recorded yet on this discussion.'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {isArabic
                              ? 'كن أول من يشارك برؤيته الإدارية أو السريرية.'
                              : 'Be the first healthcare leader to contribute your perspective.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* New Reflection Input */}
                    {isApproved ? (
                      <div className="pt-2 space-y-2">
                        {commentNotice[topic.id] && (
                          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                            <span>{commentNotice[topic.id]}</span>
                            <button
                              onClick={() => setCommentNotice(prev => ({ ...prev, [topic.id]: '' }))}
                              className="text-amber-700 hover:text-amber-900 font-bold text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                        {commentError[topic.id] && (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                            {commentError[topic.id]}
                          </div>
                        )}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                          <input
                            type="text"
                            placeholder={
                              isArabic
                                ? 'أضف مداخلتك أو رأيك القيادي حول هذه الأطروحة...'
                                : 'Contribute your executive reflection or organizational perspective...'
                            }
                            value={newCommentText[topic.id] || ''}
                            onChange={e =>
                              setNewCommentText({ ...newCommentText, [topic.id]: e.target.value })
                            }
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddComment(topic.id);
                              }
                            }}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:border-[#008765] focus:ring-1 focus:ring-[#008765] shadow-2xs transition-colors"
                          />
                          <button
                            onClick={() => handleAddComment(topic.id)}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs sm:text-sm font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
                          >
                            <span>{isArabic ? 'إرسال المداخلة' : 'Post Reflection'}</span>
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-700">
                          {isArabic
                            ? 'العضوية المعتمدة في مجتمع القيادات مطلوبة لإضافة المداخلات.'
                            : 'Approved community membership is required to contribute peer reflections.'}
                        </span>
                        <button
                          onClick={onOpenRegister}
                          className="text-[#008765] font-bold hover:underline shrink-0 cursor-pointer"
                        >
                          {isArabic ? 'سجل عضويتك الآن' : 'Apply for Membership'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="text-center py-16 p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{t.insights.noTopics}</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {isArabic
                ? 'لم يتم العثور على أي نقاشات تطابق معايير البحث المحددة.'
                : 'No leadership discussions found matching your search criteria.'}
            </p>
          </div>
        )}
      </div>

      {/* New Topic Submission Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="space-y-0.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {t.insights.newDiscussionBtn}
                </h3>
                <p className="text-xs text-slate-500">
                  {isArabic
                    ? 'طرح قضية قيادية أو تجربة سريرية للنقاش وتبادل الخبرات بين القيادات الصحية.'
                    : 'Submit a clinical, operational, or leadership perspective for peer roundtable discussion.'}
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {submitSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitNewTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isArabic ? 'عنوان الموضوع القيادي *' : 'Discussion Title *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    isArabic
                      ? 'مثال: تطبيق معايير JCI في غرف العمليات الحديثة'
                      : 'e.g. Strategic Talent Retention & Clinical Leadership in Modern Operating Suites'
                  }
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#008765] focus:ring-1 focus:ring-[#008765] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isArabic ? 'المسار التخصصي *' : 'Track / Domain *'}
                </label>
                <select
                  value={newTopicCategory}
                  onChange={e => setNewTopicCategory(e.target.value as TopicCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#008765] cursor-pointer"
                >
                  {TOPIC_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {getLocalizedCategory(cat, language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {isArabic ? 'نص الرؤية أو القضية المؤسسية *' : 'Executive Thesis or Perspective *'}
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder={
                    isArabic
                      ? 'اشرح الأطروحة أو التحدي الإداري والحلول المقترحة (دون بيانات خاصة بالمرضى)...'
                      : 'Articulate your strategic perspective, governance dilemma, or organizational model (strictly no patient PII)...'
                  }
                  value={newTopicBody}
                  onChange={e => setNewTopicBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#008765] focus:ring-1 focus:ring-[#008765] transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
                >
                  {t.common.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
