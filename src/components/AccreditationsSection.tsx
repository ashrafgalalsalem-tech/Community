import React, { useState, useEffect } from 'react';
import { repository } from '../lib/storage';
import { PartnerAccreditation } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Award, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { Badge } from './ui/Badge';
import { getLocalizedPartner } from '../lib/localization';

interface AccreditationsSectionProps {
  className?: string;
}

export const AccreditationsSection: React.FC<AccreditationsSectionProps> = ({ className = '' }) => {
  const { isArabic, language } = useLanguage();
  const [partners, setPartners] = useState<PartnerAccreditation[]>([]);

  useEffect(() => {
    // Only verified and active entries are displayed
    const verified = repository.getVerifiedActivePartners();
    setPartners(verified);
  }, []);

  if (partners.length === 0) {
    return null;
  }

  return (
    <section className={`py-12 bg-white border-b border-slate-200/90 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="text-center space-y-2 max-w-3xl mx-auto">
          <p className="text-xs font-bold text-[#008765] uppercase tracking-wider font-display">
            {isArabic ? 'المرجعية المؤسسية والاعتمادات' : 'Institutional Rigor & Alliances'}
          </p>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            {isArabic ? 'الاعتمادات والشراكات الاستراتيجية' : 'Accreditations & Strategic Partnerships'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            {isArabic
              ? 'تعتمد مبادرات المجتمع القيادي على معايير التميز الإداري والإكلينيكي الراسخة في المستشفى السعودي الألماني مصر والجهات الأكاديمية والاعتمادية الشريكة.'
              : 'Healthcare Leadership Community convenes executive dialogue anchored in the globally audited standards and clinical governance held by Saudi German Hospital Egypt and affiliated institutions.'}
          </p>
        </div>

        {/* Institutional Relationship Transparency Notice */}
        <div className="max-w-4xl mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-[#008765] shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-800">
              {isArabic ? 'إفصاح الحوكمة المؤسسية:' : 'Institutional Governance Notice:'}
            </strong>{' '}
            {isArabic
              ? 'شهادات الاعتماد الدولية والزمالات الأكاديمية المبينة أدناه هي اعتمادات رسمية ممنوحة للمستشفى السعودي الألماني مصر أو لهيئات الشركاء المستقلة. يلتزم مجتمع القيادات الصحية بالشفافية التامة وتطبيق هذه المعايير في برامج التطوير القيادي وتدريب الكوادر الصحية.'
              : 'The institutional accreditations, board affiliations, and educational certifications detailed below are awarded to Saudi German Hospital Egypt or independent academic partners. The community applies these rigorous quality systems to executive roundtable curricula without claiming independent community-held licensing.'}
          </p>
        </div>

        {/* Grid of Verified Accreditations and Partners */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map(rawPartner => {
            const partner = getLocalizedPartner(rawPartner, language);
            return (
            <div
              key={partner.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#008765]/60 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-4">
                {/* Logo and Status Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="h-16 w-32 bg-slate-50 rounded-xl p-2 border border-slate-100 flex items-center justify-center shrink-0">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={`${partner.organizationName} verified logo`}
                        className="max-h-12 max-w-full object-contain filter group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#E6F4F1] text-[#008765] flex items-center justify-center font-bold text-xs font-display">
                        {partner.organizationName.slice(0, 3).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-[#008765]" />}>
                    {isArabic ? 'معتمد رسمياً' : 'Verified'}
                  </Badge>
                </div>

                {/* Institution Name & Relationship Type */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 font-display group-hover:text-[#008765] transition-colors leading-snug">
                    {partner.organizationName}
                  </h3>
                  <p className="text-xs font-semibold text-[#008765]">
                    {partner.relationshipType}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed">
                  {partner.description}
                </p>
              </div>

              {/* Footer / Official Link */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {isArabic ? 'حالة التدقيق: موثق' : 'Audit Status: Verified Active'}
                </span>
                {partner.websiteUrl && (
                  <a
                    href={partner.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-[#008765] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#008765]"
                  >
                    <span>{isArabic ? 'زيارة الموقع' : 'Official Portal'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
