import React, { useState, useEffect } from 'react';
import { repository, BrandSettings, DEFAULT_BRAND_SETTINGS } from '../lib/storage';

interface CommunityLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showText?: boolean;
  isArabic?: boolean;
  variant?: 'dual' | 'emblem' | 'horizontal';
}

export const CommunityLogo: React.FC<CommunityLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  isArabic = false,
  variant = 'dual',
}) => {
  const [settings, setSettings] = useState<BrandSettings>(() => repository.getBrandSettings());
  const [primaryErr, setPrimaryErr] = useState(false);
  const [secondaryErr, setSecondaryErr] = useState(false);

  useEffect(() => {
    let mounted = true;
    repository.fetchBrandSettingsAsync().then(data => {
      if (mounted && data) {
        setSettings(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const primaryLogo = settings.primaryLogoUrl || DEFAULT_BRAND_SETTINGS.primaryLogoUrl;
  const secondaryLogo = settings.secondaryLogoUrl || DEFAULT_BRAND_SETTINGS.secondaryLogoUrl;

  const emblemHeight = {
    sm: 'h-8 sm:h-9',
    md: 'h-10 sm:h-11',
    lg: 'h-12 sm:h-14',
    hero: 'h-16 sm:h-20',
  }[size];

  const horizontalHeight = {
    sm: 'h-7 sm:h-8',
    md: 'h-9 sm:h-10',
    lg: 'h-11 sm:h-12',
    hero: 'h-14 sm:h-16',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3.5 ${className}`}>
      {/* Logo 2: Vertical / Emblem Badge Logo */}
      {(variant === 'dual' || variant === 'emblem') && (
        <div className="relative shrink-0 flex items-center justify-center p-0.5 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs hover:border-[#008765]/40 transition-colors">
          {!secondaryErr && secondaryLogo ? (
            <img
              src={secondaryLogo}
              alt={settings.logo2Alt || 'Saudi German Academy Emblem'}
              className={`${emblemHeight} w-auto object-contain select-none`}
              onError={() => setSecondaryErr(true)}
              loading="eager"
            />
          ) : (
            <div className={`${emblemHeight} aspect-square rounded-lg bg-gradient-to-br from-[#008765] to-[#0F172A] p-2 flex items-center justify-center text-white`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-full h-full">
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Elegant Vertical Divider in Dual Mode */}
      {variant === 'dual' && (
        <div className="hidden sm:block h-8 w-px bg-slate-200/80 shrink-0" aria-hidden="true" />
      )}

      {/* Logo 1: Horizontal Brand Logo */}
      {(variant === 'dual' || variant === 'horizontal') && (
        <div className={`relative shrink-0 items-center justify-center p-1 rounded-xl bg-white/95 border border-slate-200/80 shadow-xs hover:border-[#008765]/40 transition-colors ${variant === 'dual' ? 'hidden sm:flex' : 'flex'}`}>
          {!primaryErr && primaryLogo ? (
            <img
              src={primaryLogo}
              alt={settings.logo1Alt || 'Saudi German Academy Horizontal Logo'}
              className={`${horizontalHeight} w-auto object-contain select-none max-w-[190px] sm:max-w-[220px]`}
              onError={() => setPrimaryErr(true)}
              loading="eager"
            />
          ) : (
            <span className="text-xs font-bold text-slate-800 px-2 font-display">
              Saudi German Academy
            </span>
          )}
        </div>
      )}

      {showText && (
        <div className={isArabic ? 'text-right' : 'text-left'}>
          <span className="font-display font-extrabold text-slate-900 leading-tight block text-base sm:text-lg">
            {isArabic ? (settings.platformNameAr || 'مجتمع القادة الصحيين') : (settings.platformName || 'Healthcare Leaders Community')}
          </span>
          <span className="text-[11px] font-semibold text-[#008765] tracking-wider uppercase block">
            {isArabic ? 'ملتقى قيادات المستشفيات' : 'Executive Hospital Leadership'}
          </span>
        </div>
      )}
    </div>
  );
};
