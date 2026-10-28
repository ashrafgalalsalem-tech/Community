import React, { useState, useEffect } from 'react';
import { repository } from '../lib/storage';
import { MembershipBenefit } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedBenefit } from '../lib/localization';
import {
  GraduationCap,
  Users,
  Compass,
  Award,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Button } from './ui/Button';

interface MembershipBenefitsSectionProps {
  onOpenRegister?: () => void;
  className?: string;
}

export const MembershipBenefitsSection: React.FC<MembershipBenefitsSectionProps> = ({
  onOpenRegister,
  className = '',
}) => {
  const { isArabic, language } = useLanguage();
  const [benefits, setBenefits] = useState<MembershipBenefit[]>([]);

  useEffect(() => {
    const activeBenefits = repository.getActiveBenefits();
    setBenefits(activeBenefits);
  }, []);

  if (benefits.length === 0) {
    return null;
  }

  // Icon map for verified dynamic benefit rendering
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5" />;
      case 'Award':
        return <Award className="w-5 h-5" />;
      case 'Building2':
        return <Building2 className="w-5 h-5" />;
      case 'Users':
        return <Users className="w-5 h-5" />;
      case 'Compass':
        return <Compass className="w-5 h-5" />;
      case 'Calendar':
        return <Calendar className="w-5 h-5" />;
      default:
        return <Layers className="w-5 h-5" />;
    }
  };

  return (
    <section className={`py-16 bg-slate-900 text-white relative overflow-hidden ${className}`}>
      {/* Subtle executive ambient grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-semibold text-[#A7F3D0]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#008765]" />
            <span>{isArabic ? 'المزايا القيادية المعتمدة للأعضاء' : 'Executive Value & Privileges'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
            {isArabic ? 'مزايا عضوية مجتمع القيادات الصحية' : 'Membership Benefits & Value Proposition'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isArabic
              ? 'مجموعة متكاملة من الفرص المهنية والتعليمية المقدمة لقيادات المستشفيات وأعضاء الشبكة التنفيذية المعتمدين.'
              : 'Privileges curated for hospital directors, clinical executives, and healthcare leaders to advance talent development, peer exchange, and executive capability.'}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(rawBenefit => {
            const benefit = getLocalizedBenefit(rawBenefit, language);
            return (
            <div
              key={benefit.id}
              className="p-7 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-[#008765]/80 transition-all duration-200 flex flex-col justify-between space-y-5 group hover:shadow-lg hover:shadow-black/20"
            >
              <div className="space-y-4">
                {/* Category & Icon */}
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-700 text-[#008765] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    {getIcon(benefit.iconName)}
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">
                    {benefit.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-bold text-white font-display group-hover:text-[#A7F3D0] transition-colors leading-snug">
                  {benefit.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {benefit.description}
                </p>
              </div>

              {/* Conditions / Terms Note (Truthful and Uninvented) */}
              <div className="pt-4 border-t border-slate-700/60 space-y-2">
                <div className="flex items-start gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#008765] shrink-0 mt-0.5" />
                  <span className="leading-snug">{benefit.conditions}</span>
                </div>

                {benefit.termsUrl && (
                  <a
                    href={benefit.termsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#A7F3D0] hover:underline pt-1"
                  >
                    <span>{isArabic ? 'الشروط والأحكام' : 'Terms & Conditions'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
            );
          })}
        </div>

        {/* Executive Footnote / Transparency Box */}
        <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-slate-800/50 border border-slate-700 text-center space-y-3">
          <p className="text-xs text-slate-400 leading-relaxed">
            {isArabic
              ? 'تخضع كافة المزايا والبرامج التدريبية للوائح والشروط الخاصة بكل جهة مانحة والتقييم الإداري لكل دورة. تُدار تفاصيل المشاركة من خلال البوابة الإدارية وفق التحديثات الرسمية.'
              : 'All academy course privileges, training modules, and partner benefits are subject to terms established by the offering institution and verified through the Admin Portal. Specific criteria are confirmed upon registration.'}
          </p>

          {onOpenRegister && (
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={onOpenRegister}
                rightIcon={isArabic ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              >
                {isArabic ? 'الانضمام لمجتمع القيادات' : 'Apply for Community Membership'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
