import React, { useState, useEffect, useRef } from 'react';
import { repository } from '../lib/storage';
import { PartnerAccreditation } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, ChevronRight, Pause, Play, ShieldCheck, ExternalLink } from 'lucide-react';
import { getLocalizedPartner } from '../lib/localization';

interface PartnerLogoSliderProps {
  className?: string;
}

export const PartnerLogoSlider: React.FC<PartnerLogoSliderProps> = ({ className = '' }) => {
  const { isArabic, language } = useLanguage();
  const [partners, setPartners] = useState<PartnerAccreditation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load verified and active partners
  useEffect(() => {
    const loadPartners = () => {
      const activeVerified = repository.getVerifiedActivePartners();
      setPartners(activeVerified);
    };
    loadPartners();

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Items visible at once based on responsive breakpoints
  // We can calculate slides based on total count
  const itemsPerView = 4; // on desktop
  const totalSlides = Math.max(1, Math.ceil(partners.length / 2));

  // Auto rotation
  useEffect(() => {
    if (prefersReducedMotion || isPaused || isInteracting || partners.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % partners.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [prefersReducedMotion, isPaused, isInteracting, partners.length]);

  if (partners.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? partners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % partners.length);
  };

  return (
    <section
      aria-label={isArabic ? 'شركاء المؤسسة والاعتمادات الدولية' : 'Institutional Partners & Accreditations Slider'}
      className={`relative bg-white border-y border-slate-200 py-10 overflow-hidden ${className}`}
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocus={() => setIsInteracting(true)}
      onBlur={() => setIsInteracting(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Accessible Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008765] uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#008765]" />
              <span>{isArabic ? 'الاعتمادات والشراكات المؤسسية المعتمدة' : 'Verified Institutional Partners & Accreditations'}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">
              {isArabic
                ? 'اعتمادات وشراكات مستشفيات السعودي الألماني مصر والهيئات العالمية الداعمة للمجتمع القيادي'
                : 'Accreditations and strategic alliances supporting Healthcare Leadership Community'}
            </h3>
          </div>

          {/* Slider Controls */}
          <div className="flex items-center gap-2" role="group" aria-label="Slider Controls">
            <button
              onClick={() => setIsPaused(prev => !prev)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              aria-label={isPaused ? 'Resume automatic rotation' : 'Pause automatic rotation'}
              title={isPaused ? 'Resume rotation' : 'Pause rotation'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-[#008765]" /> : <Pause className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handlePrev}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              aria-label="Previous partner logo"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleNext}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              aria-label="Next partner logo"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Viewport */}
        <div className="relative overflow-hidden py-3">
          <div
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{
              transform: `translateX(${isArabic ? '' : '-'}${currentIndex * (100 / Math.min(partners.length, itemsPerView))}%)`,
            }}
          >
            {partners.concat(partners).map((rawPartner, idx) => {
              const partner = getLocalizedPartner(rawPartner, language);
              return (
              <div
                key={`${partner.id}-${idx}`}
                className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 shrink-0"
              >
                <div className="h-full p-4 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-[#008765]/40 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between group">
                  <div className="flex items-center justify-center h-20 px-4 bg-white rounded-xl border border-slate-100 p-2">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={`${partner.organizationName} official insignia`}
                        className="max-h-14 max-w-full object-contain filter group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">
                        {partner.organizationName.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-center space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#008765] transition-colors truncate">
                      {partner.organizationName}
                    </h4>
                    <p className="text-[10px] font-medium text-slate-500 truncate">
                      {partner.relationshipType}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {partner.description}
                    </p>
                  </div>

                  {partner.websiteUrl && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-center">
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 hover:text-[#008765] transition-colors"
                        aria-label={`Visit official website of ${partner.organizationName} (opens in new tab)`}
                      >
                        <span>{isArabic ? 'الموقع الرسمي' : 'Official Portal'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>

        {/* Legal Disclaimer attribution */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-4xl mx-auto">
            {isArabic
              ? 'تنويه تنظيمي: كافة الاعتمادات وشهادات الجودة الموضحة أعلاه تخص المستشفى السعودي الألماني مصر والجهات الشريكة المستقلة، وتُعرض لبيان المرجعية المؤسسية لمعايير الحوكمة والتدريب القيادي.'
              : 'Regulatory Note: All accreditations and certifications displayed are held by Saudi German Hospital Egypt or respective independent institutional partners, establishing the operational quality framework for executive leadership development.'}
          </p>
        </div>
      </div>
    </section>
  );
};
