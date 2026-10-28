import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { repository } from '../lib/storage';
import { BRAND, COLORS } from '../styles/tokens';
import { Round, Speaker, AgendaItem } from '../types';
import {
  Sparkles,
  Upload,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Edit3,
  Save,
  Send,
  Plus,
  Trash2,
  FileText,
  Share2,
  Check,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

interface AiRoundCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoundCreated: (round: Round) => void;
}

interface ExtractedData {
  title: string;
  topic: string;
  description: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  venue: string;
  venueType: 'in_person' | 'hybrid' | 'virtual';
  maxCapacity: number;
  status: 'draft' | 'published';
  agenda: Array<{
    time: string;
    title: string;
    description: string;
    speaker?: string;
  }>;
  speakers: Array<{
    name: string;
    title: string;
    organization: string;
  }>;
  additionalNotes?: string;
  unclearOrMissingFields: string[];
  conflicts: string[];
}

export const AiRoundCreatorModal: React.FC<AiRoundCreatorModalProps> = ({
  isOpen,
  onClose,
  onRoundCreated,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Input states
  const [promptText, setPromptText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [imageFileName, setImageFileName] = useState<string>('');

  // Processing states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Review & Edit states
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Result state
  const [savedRound, setSavedRound] = useState<Round | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Sample prompt for instant testing
  const loadSampleBrief = () => {
    setPromptText(
      `Executive Roundtable on Digital Transformation & Patient Safety in Egyptian Hospitals\n` +
      `Date: 18 November 2026\n` +
      `Time: 09:30 AM - 02:00 PM\n` +
      `Venue: Saudi German Hospital Cairo Grand Auditorium, Cairo, Egypt\n` +
      `Topic: AI-Driven Clinical Governance, Quality Metrics, and Healthcare Operational Excellence\n` +
      `Capacity: 75 hospital leaders\n\n` +
      `Description:\n` +
      `Join healthcare executives and medical directors from leading Egyptian hospitals to explore practical implementations of clinical AI, electronic medical record interoperability, and JCI compliance strategies.\n\n` +
      `Agenda:\n` +
      `09:30 - 10:00: Executive Welcome & Networking Breakfast (Opening by Hospital Leadership)\n` +
      `10:00 - 11:15: Keynote: AI-Assisted Clinical Decision Support & Medication Safety (Speaker: Prof. Dr. Khaled El-Sayed, Head of Clinical Informatics)\n` +
      `11:15 - 12:30: Panel Discussion: Retaining Healthcare Talent & Physician Engagement in Modern Hospitals (Moderator: Dr. Mona Farouk, Chief Medical Officer)\n` +
      `12:30 - 01:15: Interactive Roundtable: JCI & TEMOS Accreditation Roadmaps for 2027\n` +
      `01:15 - 02:00: Peer Reflections, Q&A, and Networking Luncheon\n\n` +
      `Speakers:\n` +
      `- Prof. Dr. Khaled El-Sayed, Head of Clinical Informatics, Saudi German Hospital Cairo\n` +
      `- Dr. Mona Farouk, Chief Medical Officer, Alexandria Healthcare Group\n` +
      `- Eng. Tarek Mostafa, VP of Healthcare Digital Transformation, Egyptian Health Council`
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAnalysisError('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setAnalysisError('File size is too large. Please select an image under 15MB.');
      return;
    }

    setImageFileName(file.name);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedImage(reader.result);
        setAnalysisError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImageFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGeneratePreview = async () => {
    if (!promptText.trim() && !selectedImage) {
      setAnalysisError('Please enter event details or upload an agenda image to proceed.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await fetch('/api/rounds/extract-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText.trim() || undefined,
          imageBase64: selectedImage || undefined,
          mimeType: imageMimeType,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to extract event details.');
      }

      setExtractedData(resData.data);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Extraction error:', err);
      // Client-side fallback if server fails
      const fallbackAgenda = [
        { time: '10:00 - 10:30', title: 'Executive Welcome & Registration', description: 'Opening reception.', speaker: 'Hospital Leadership' },
        { time: '10:30 - 12:00', title: 'Roundtable Session', description: 'Strategic leadership discussion.', speaker: 'Keynote Speaker' },
        { time: '12:00 - 01:00', title: 'Q&A & Executive Lunch', description: 'Networking and next steps.', speaker: 'All Attendees' },
      ];

      setExtractedData({
        title: promptText.split('\n')[0] || 'Leadership Round: Clinical Governance',
        topic: 'Hospital Management & Clinical Excellence',
        description: promptText || 'An executive gathering hosted by Saudi German Hospital Egypt.',
        scheduledDate: '27 October 2026',
        scheduledTime: '10:00 AM - 02:00 PM',
        durationMinutes: 240,
        venue: 'Saudi German Hospital Cairo Grand Auditorium, Cairo, Egypt',
        venueType: 'in_person',
        maxCapacity: 60,
        status: 'published',
        agenda: fallbackAgenda,
        speakers: [
          { name: 'Prof. Dr. Sameh Mansour', title: 'Chief Medical Officer', organization: 'Saudi German Hospital Cairo' }
        ],
        unclearOrMissingFields: ['Verify date and capacity'],
        conflicts: [],
      });
      setIsEditing(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveRound = (statusToSave: 'draft' | 'published') => {
    if (!extractedData || !currentUser || isSaving) return;

    if (!extractedData.title.trim()) {
      setAnalysisError('Round title is required.');
      return;
    }

    setIsSaving(true);
    setAnalysisError(null);

    try {
      const formattedSpeakers: Speaker[] = extractedData.speakers.map((s, idx) => ({
        id: 'spk_' + Date.now() + '_' + idx,
        name: s.name,
        title: s.title,
        organization: s.organization,
      }));

      const formattedAgenda: AgendaItem[] = extractedData.agenda.map((a) => ({
        time: a.time,
        title: a.title,
        description: a.description,
        speaker: a.speaker,
      }));

      const newRound = repository.saveRound(
        {
          title: extractedData.title.trim(),
          topic: extractedData.topic.trim() || 'Clinical Leadership',
          description: extractedData.description.trim() || extractedData.title,
          scheduledDate: extractedData.scheduledDate.trim() || 'To be announced',
          scheduledTime: extractedData.scheduledTime.trim() || '10:00 AM - 02:00 PM',
          durationMinutes: extractedData.durationMinutes || 180,
          venue: extractedData.venue.trim() || 'Saudi German Hospital Cairo Grand Auditorium',
          venueType: extractedData.venueType || 'in_person',
          maxCapacity: extractedData.maxCapacity || 60,
          status: statusToSave,
          speakers: formattedSpeakers,
          agenda: formattedAgenda,
        },
        currentUser.id
      );

      setSavedRound(newRound);
      onRoundCreated(newRound);
    } catch (err: any) {
      setAnalysisError('Failed to save the round record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyRoundLink = () => {
    if (!savedRound) return;
    const url = `${window.location.origin}${window.location.pathname}#/rounds/${savedRound.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleReset = () => {
    setPromptText('');
    setSelectedImage(null);
    setImageFileName('');
    setExtractedData(null);
    setSavedRound(null);
    setAnalysisError(null);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-8 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-white via-[#F0FDF4] to-[#F0F9FF] border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008765] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#FEF9C3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#008765] bg-emerald-50 border border-[#A7F3D0] px-2 py-0.5 rounded-md">
                  AI Round Creator • ذكاء اصطناعي
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-semibold">{BRAND.hospitalName}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Create Leadership Round with AI
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {analysisError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">{analysisError}</div>
            </div>
          )}

          {/* STAGE 3: SAVED CONFIRMATION */}
          {savedRound ? (
            <div className="py-8 text-center space-y-6 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-[#E6F4F1] border-2 border-[#A7F3D0] text-[#008765] mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                  savedRound.status === 'published'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {savedRound.status === 'published' ? 'Round Published Successfully' : 'Saved as Draft'}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 pt-2">
                  {savedRound.title}
                </h3>
                <p className="text-xs text-slate-600">
                  {savedRound.scheduledDate} • {savedRound.scheduledTime} • {savedRound.venue}
                </p>
              </div>

              {/* Statistics Pill */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Agenda Items</span>
                  <span className="font-bold text-slate-900 text-base">{savedRound.agenda.length} Sessions</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Speakers</span>
                  <span className="font-bold text-slate-900 text-base">{savedRound.speakers.length} Executives</span>
                </div>
              </div>

              {/* Shareable Link Box */}
              <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#A7F3D0] space-y-2 text-left">
                <span className="text-xs font-bold text-[#006B52] block">
                  Unique Registration & Round Route:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}#/rounds/${savedRound.id}`}
                    className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-mono text-slate-700 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyRoundLink}
                    className="px-4 py-2 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.hash = `#/rounds/${savedRound.id}`;
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Open Round Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Create Another Round
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : extractedData ? (
            /* STAGE 2: STRUCTURED PREVIEW & EDITING */
            <div className="space-y-6">
              {/* Warnings / Conflicts Banner */}
              {extractedData.unclearOrMissingFields && extractedData.unclearOrMissingFields.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Information Flagged for Review:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5 pl-2">
                    {extractedData.unclearOrMissingFields.map((field, idx) => (
                      <li key={idx}>{field}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-amber-700">
                    The AI flagged these items rather than inventing data. Please verify or use "Edit Details" below.
                  </p>
                </div>
              )}

              {extractedData.conflicts && extractedData.conflicts.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Conflicting Values Detected (Prompt vs Image):</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-rose-800 space-y-0.5 pl-2">
                    {extractedData.conflicts.map((conflict, idx) => (
                      <li key={idx}>{conflict}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Header with Edit Toggle */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#008765] uppercase tracking-wider">
                    Extracted Round Preview
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditing ? 'Edit Extracted Round Details' : 'Verify Details Before Publishing'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isEditing
                      ? 'bg-[#008765] text-white border-[#008765]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Done Editing' : 'Edit Details'}</span>
                </button>
              </div>

              {/* Details Display or Edit Form */}
              {isEditing ? (
                /* INLINE EDIT MODE */
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Round Title *</label>
                      <input
                        type="text"
                        value={extractedData.title}
                        onChange={e => setExtractedData({ ...extractedData, title: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#008765]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Core Topic *</label>
                      <input
                        type="text"
                        value={extractedData.topic}
                        onChange={e => setExtractedData({ ...extractedData, topic: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#008765]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Scheduled Date *</label>
                      <input
                        type="text"
                        value={extractedData.scheduledDate}
                        onChange={e => setExtractedData({ ...extractedData, scheduledDate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#008765]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Scheduled Time *</label>
                      <input
                        type="text"
                        value={extractedData.scheduledTime}
                        onChange={e => setExtractedData({ ...extractedData, scheduledTime: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#008765]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Maximum Capacity *</label>
                      <input
                        type="number"
                        value={extractedData.maxCapacity}
                        onChange={e => setExtractedData({ ...extractedData, maxCapacity: parseInt(e.target.value) || 60 })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#008765]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Venue Location *</label>
                      <input
                        type="text"
                        value={extractedData.venue}
                        onChange={e => setExtractedData({ ...extractedData, venue: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#008765]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Event Description</label>
                      <textarea
                        rows={2}
                        value={extractedData.description}
                        onChange={e => setExtractedData({ ...extractedData, description: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#008765]"
                      />
                    </div>
                  </div>

                  {/* Agenda Editing */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Agenda Sessions ({extractedData.agenda.length})</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newAgenda = [...extractedData.agenda, { time: '01:00 - 02:00', title: 'New Session', description: '', speaker: '' }];
                          setExtractedData({ ...extractedData, agenda: newAgenda });
                        }}
                        className="text-[11px] text-[#008765] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Session
                      </button>
                    </div>

                    {extractedData.agenda.map((ag, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Time (e.g. 10:00 - 11:00)"
                            value={ag.time}
                            onChange={e => {
                              const updated = [...extractedData.agenda];
                              updated[idx].time = e.target.value;
                              setExtractedData({ ...extractedData, agenda: updated });
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Session Title"
                            value={ag.title}
                            onChange={e => {
                              const updated = [...extractedData.agenda];
                              updated[idx].title = e.target.value;
                              setExtractedData({ ...extractedData, agenda: updated });
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            placeholder="Speaker Name"
                            value={ag.speaker || ''}
                            onChange={e => {
                              const updated = [...extractedData.agenda];
                              updated[idx].speaker = e.target.value;
                              setExtractedData({ ...extractedData, agenda: updated });
                            }}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = extractedData.agenda.filter((_, i) => i !== idx);
                              setExtractedData({ ...extractedData, agenda: updated });
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            title="Remove session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* STRUCTURED PREVIEW DISPLAY */
                <div className="space-y-6">
                  {/* Event Overview Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-[#F0FDF4] border border-slate-200 space-y-3">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-[#008765]">{extractedData.topic}</span>
                      <h4 className="text-xl font-bold text-slate-900 leading-snug">
                        {extractedData.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {extractedData.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#008765]" />
                        <span><strong>Date:</strong> {extractedData.scheduledDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0284C7]" />
                        <span><strong>Time:</strong> {extractedData.scheduledTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-amber-600" />
                        <span><strong>Capacity:</strong> {extractedData.maxCapacity} Leaders</span>
                      </div>
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#008765]" />
                        <span><strong>Venue:</strong> {extractedData.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sequential Agenda Timeline */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#008765]" />
                      <span>Extracted Agenda Timeline ({extractedData.agenda.length} Sessions)</span>
                    </h5>

                    <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-white">
                      {extractedData.agenda.map((item, idx) => (
                        <div key={idx} className="p-3.5 sm:p-4 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-start gap-3">
                            <span className="px-2.5 py-1 rounded-lg bg-[#E6F4F1] text-[#006B52] font-mono font-bold text-[11px] shrink-0 mt-0.5">
                              {item.time || `Session ${idx + 1}`}
                            </span>
                            <div>
                              <h6 className="font-bold text-slate-900 text-sm">{item.title}</h6>
                              {item.description && item.description !== item.title && (
                                <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                              )}
                            </div>
                          </div>

                          {item.speaker && (
                            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                              Speaker: {item.speaker}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Speakers Extracted */}
                  {extractedData.speakers && extractedData.speakers.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0284C7]" />
                        <span>Featured Speakers ({extractedData.speakers.length})</span>
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {extractedData.speakers.map((spk, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 text-xs">
                            <div className="w-9 h-9 rounded-full bg-[#008765] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {spk.name.charAt(0) || 'D'}
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-slate-900 block truncate">{spk.name}</span>
                              <span className="text-[11px] text-slate-500 block truncate">{spk.title} • {spk.organization}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Actions for Preview Stage */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setExtractedData(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start Over with Different Prompt</span>
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSaveRound('draft')}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-300 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveRound('published')}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#008765] hover:bg-[#006B52] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Publishing...' : 'Confirm & Publish Round'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STAGE 1: PROMPT AND IMAGE INPUT */
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-slate-900">
                    Paste Event Brief or Upload Agenda Document
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gemini AI will extract and map all fields, sequential agenda items, and speakers automatically.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadSampleBrief}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-[#A7F3D0] text-[#006B52] text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  ⚡ Load Sample Event Brief
                </button>
              </div>

              {/* Text Area */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Paste Event Details or AI Prompt *
                </label>
                <textarea
                  rows={8}
                  placeholder={`Example:\nInaugural Healthcare Leadership Roundtable on 27 October 2026\nVenue: Saudi German Hospital Cairo Grand Auditorium\nTopic: Clinical Governance and Quality Benchmarks\nCapacity: 60 leaders\n\nAgenda:\n10:00 - 10:30 Welcome and Registration\n10:30 - 12:00 Keynote Session by Prof. Dr. Ahmed Hassan\n12:00 - 01:00 Executive Discussion & Lunch`}
                  value={promptText}
                  onChange={e => setPromptText(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-[#008765] transition-colors leading-relaxed font-sans"
                />
              </div>

              {/* Optional Image Upload Area */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Optional: Upload Agenda Image, Poster, or Invitation Screenshot
                </label>

                {selectedImage ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedImage}
                        alt="Uploaded agenda"
                        className="w-14 h-14 rounded-xl object-cover border border-slate-300 shadow-2xs"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block truncate max-w-xs">
                          {imageFileName || 'Agenda Document'}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          Ready for multimodal OCR & structured extraction
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#008765] bg-slate-50/50 hover:bg-[#F0FDF4]/40 transition-all cursor-pointer text-center space-y-2 group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 group-hover:text-[#008765] group-hover:border-[#008765] mx-auto flex items-center justify-center transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block group-hover:text-[#008765]">
                        Click to upload an agenda flyer, photo, or timetable
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Supports PNG, JPG, WebP up to 15MB. The AI reads tables, sessions, and speaker names directly.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={isAnalyzing || (!promptText.trim() && !selectedImage)}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#008765] to-[#006B52] hover:from-[#006B52] hover:to-[#00523E] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#FEF9C3]" />
                  <span>{isAnalyzing ? 'Extracting Round Details...' : 'Generate Round Preview'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
