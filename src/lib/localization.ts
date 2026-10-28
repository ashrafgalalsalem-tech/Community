import { Member, Speaker, AgendaItem, Round, PartnerAccreditation, MembershipBenefit, Topic } from '../types';
import { Language, TRANSLATIONS } from './translations';

/**
 * Healthcare Leadership Community — Comprehensive Bilingual Localization Utilities
 * Ensures 100% pure English content in English mode and 100% pure Arabic content in Arabic mode.
 */

// Dictionary of known clinical executive speakers for perfect bilingual fidelity
const KNOWN_SPEAKERS: Record<string, { en: Partial<Speaker>; ar: Partial<Speaker> }> = {
  spk_1: {
    en: {
      name: 'Prof. Dr. Ashraf Galal Salem',
      title: 'Executive Director & Chief Medical Officer',
      organization: 'Healthcare Leadership Community',
      bio: 'Professor and Senior Consultant in Medical Governance and Hospital Administration, leading global clinical quality and healthcare excellence.',
    },
    ar: {
      name: 'أ.د. أشرف جلال سالم',
      title: 'المدير التنفيذي والطبي',
      organization: 'مجتمع القيادة الصحية',
      bio: 'أستاذ واستشاري أول الحوكمة الطبية وإدارة المستشفيات، رائد تطبيق معايير الجودة العالمية في الرعاية الصحية.',
    },
  },
  spk_2: {
    en: {
      name: 'Dr. Tarek Mansour',
      title: 'Director of Clinical Quality & Patient Safety',
      organization: 'Specialized Hospitals Network',
      bio: 'International expert in healthcare quality accreditations and clinical KPI measurement systems.',
    },
    ar: {
      name: 'د. طارق منصور',
      title: 'رئيس قطاع الجودة وسلامة المرضى',
      organization: 'شبكة المستشفيات التخصصية',
      bio: 'خبير الاعتمادات الدولية للجودة ونظم قياس مؤشرات الأداء الإكلينيكي.',
    },
  },
  spk_3: {
    en: {
      name: 'Dr. Mona Hegazy',
      title: 'Head of Digital Health Transformation',
      organization: 'Digital Health Expert Council',
      bio: 'Consultant in healthcare AI applications and predictive clinical analytics in critical care delivery.',
    },
    ar: {
      name: 'د. منى حجازي',
      title: 'رئيس وحدة التحول الرقمي والمعلوماتية الصحية',
      organization: 'مجلس خبراء الصحة الرقمية',
      bio: 'استشارية تطبيقات الذكاء الاصطناعي والتحليل التنبؤي في سلاسل الرعاية الحرجة.',
    },
  },
};

/**
 * Localizes a speaker's details based on the active language.
 */
export function getLocalizedSpeaker(speaker: Speaker, language: Language): Speaker {
  const isAr = language === 'ar';
  const known = KNOWN_SPEAKERS[speaker.id];

  if (known) {
    const localized = isAr ? known.ar : known.en;
    return {
      ...speaker,
      name: localized.name || speaker.name,
      title: localized.title || speaker.title,
      organization: localized.organization || speaker.organization,
      bio: localized.bio || speaker.bio,
    };
  }

  // Check explicit bilingual properties
  if (isAr) {
    return {
      ...speaker,
      name: speaker.nameAr || speaker.name,
      title: speaker.titleAr || speaker.title,
      organization: speaker.organizationAr || speaker.organization,
      bio: speaker.bioAr || speaker.bio,
    };
  } else {
    // English mode: fallback to English property if provided
    return {
      ...speaker,
      name: speaker.nameEn || speaker.name,
      title: speaker.titleEn || speaker.title,
      organization: speaker.organizationEn || speaker.organization,
      bio: speaker.bioEn || speaker.bio,
    };
  }
}

/**
 * Localizes an agenda item based on the active language.
 */
export function getLocalizedAgendaItem(item: AgendaItem, language: Language, index?: number): AgendaItem {
  const isAr = language === 'ar';

  // Standard inaugural round agenda items
  const INAUGURAL_AGENDA: Record<number, { en: Partial<AgendaItem>; ar: Partial<AgendaItem> }> = {
    0: {
      en: {
        time: '10:00 AM - 10:30 AM',
        title: 'Executive Welcome Reception & Professional Networking',
        description: 'Executive registration and welcome reception for hospital leaders and strategic partners in the Grand Foyer.',
        speaker: 'Summit Secretariat',
      },
      ar: {
        time: '10:00 صباحاً - 10:30 صباحاً',
        title: 'الاستقبال والترحيب التنفيذي وشبكة التواصل المهني',
        description: 'تسجيل الحضور التنفيذي والترحيب بقيادات المستشفيات والشركاء الاستراتيجيين في بهو المؤتمرات.',
        speaker: 'الأمانة العامة للملتقى',
      },
    },
    1: {
      en: {
        time: '10:30 AM - 11:30 AM',
        title: 'Keynote Session: Clinical Governance Strategies & International Accreditations (JCI & TEMOS)',
        description: 'Presenting a comprehensive strategic framework for patient safety assurance and clinical leadership KPIs across healthcare networks in Egypt.',
        speaker: 'Prof. Dr. Ashraf Galal Salem',
      },
      ar: {
        time: '10:30 صباحاً - 11:30 صباحاً',
        title: 'الجلسة الافتتاحية: استراتيجيات الحوكمة الإكلينيكية والاعتمادات الدولية JCI & TEMOS',
        description: 'عرض الرؤية الشاملة لضمان أمان المرضى ومؤشرات الأداء القيادية في بيئة الرعاية الصحية المصرية.',
        speaker: 'أ.د. أشرف جلال سالم',
      },
    },
    2: {
      en: {
        time: '11:45 AM - 01:00 PM',
        title: 'Panel Discussion: Deploying AI & Digital Transformation in Operational Efficiency',
        description: 'Real-world hospital case studies on reducing wait times and eliminating clinical errors through intelligent health systems.',
        speaker: 'Dr. Mona Hegazy & Dr. Tarek Mansour',
      },
      ar: {
        time: '11:45 صباحاً - 01:00 ظهراً',
        title: 'حلقة نقاشية: توظيف الذكاء الاصطناعي والتحول الرقمي في كفاءة الخدمات التشغيلية',
        description: 'دراسات حالة واقعية من المستشفيات الرائدة حول تقليل فترات الانتظار ومنع الأخطاء الطبية عبر الأنظمة الذكية.',
        speaker: 'د. منى حجازي & د. طارق منصور',
      },
    },
    3: {
      en: {
        time: '01:00 PM - 02:30 PM',
        title: 'Executive Networking Luncheon & Bilateral Hospital Partnership Dialogue',
        description: 'Roundtable dialogue for establishing collaboration protocols and knowledge exchange between participating healthcare executives.',
        speaker: 'All Participating Executives',
      },
      ar: {
        time: '01:00 ظهراً - 02:30 ظهراً',
        title: 'غداء عمل تنفيذي ومناقشة الشراكات الثنائية بين المستشفيات',
        description: 'طاولة مستديرة لبناء بروتوكولات تعاون وتبادل الخبرات بين القيادات الصحية المشاركة.',
        speaker: 'كافة القيادات الحاضرة',
      },
    },
  };

  if (index !== undefined && INAUGURAL_AGENDA[index]) {
    const loc = isAr ? INAUGURAL_AGENDA[index].ar : INAUGURAL_AGENDA[index].en;
    return {
      time: loc.time || item.time,
      title: loc.title || item.title,
      description: loc.description || item.description,
      speaker: loc.speaker || item.speaker,
    };
  }

  // Use explicit bilingual fields
  if (isAr) {
    return {
      time: item.timeAr || item.time,
      title: item.titleAr || item.title,
      description: item.descriptionAr || item.description,
      speaker: item.speakerAr || item.speaker,
    };
  } else {
    return {
      time: item.timeEn || item.time,
      title: item.titleEn || item.title,
      description: item.descriptionEn || item.description,
      speaker: item.speakerEn || item.speaker,
    };
  }
}

/**
 * Localizes a Leadership Round in its entirety.
 */
export function getLocalizedRound(round: Round, language: Language): Round {
  const isAr = language === 'ar';

  if (round.id === 'round_sgh_cairo_inaugural_2026') {
    if (isAr) {
      return {
        ...round,
        title: 'الملتقى القيادي الأول لإدارة المستشفيات والحوكمة الإكلينيكية 2026',
        topic: 'الذكاء الاصطناعي ومعايير JCI/TEMOS في قيادة المستشفيات الحديثة',
        description:
          'ملتقى قيادي تنفيذي يجمع كبار المديرين التنفيذيين والمديرين الطبيين ورؤساء الأقسام بمستشفيات مصر، لمناقشة الحوكمة الإكلينيكية ودمج الذكاء الاصطناعي في جودة الرعاية الصحية وإدارة الأزمات.',
        venue: 'قاعة المؤتمرات الكبرى - مركز القيادة الصحية، القاهرة',
        scheduledDate: '27 أكتوبر 2026',
        scheduledTime: '10:00 صباحاً - 02:30 ظهراً',
        speakers: round.speakers.map(s => getLocalizedSpeaker(s, 'ar')),
        agenda: round.agenda.map((a, idx) => getLocalizedAgendaItem(a, 'ar', idx)),
      };
    } else {
      return {
        ...round,
        title: '1st Executive Hospital Leadership & Clinical Governance Summit 2026',
        topic: 'Workforce Resilience, Artificial Intelligence & JCI/TEMOS Standards in Modern Hospital Leadership',
        description:
          'An executive leadership summit gathering Chief Executive Officers, Chief Medical Officers, and department heads across Egypt to discuss clinical governance and AI integration in healthcare quality.',
        venue: 'Grand Conference Auditorium - Executive Healthcare Center, Cairo, Egypt',
        scheduledDate: 'October 27, 2026',
        scheduledTime: '10:00 AM - 02:30 PM (EET)',
        speakers: round.speakers.map(s => getLocalizedSpeaker(s, 'en')),
        agenda: round.agenda.map((a, idx) => getLocalizedAgendaItem(a, 'en', idx)),
      };
    }
  }

  // Generic round localization
  return {
    ...round,
    title: (isAr ? round.titleAr : round.titleEn) || round.title,
    topic: (isAr ? round.topicAr : round.topicEn) || round.topic,
    description: (isAr ? round.descriptionAr : round.descriptionEn) || round.description,
    venue: (isAr ? round.venueAr : round.venueEn) || round.venue,
    scheduledDate: (isAr ? round.scheduledDateAr : round.scheduledDateEn) || round.scheduledDate,
    scheduledTime: (isAr ? round.scheduledTimeAr : round.scheduledTimeEn) || round.scheduledTime,
    speakers: (round.speakers || []).map(s => getLocalizedSpeaker(s, language)),
    agenda: (round.agenda || []).map((a, idx) => getLocalizedAgendaItem(a, language, idx)),
  };
}

/**
 * Localizes a Member profile.
 */
export function getLocalizedMember(member: Member, language: Language): Member {
  const isAr = language === 'ar';

  if (member.id === 'admin_ashraf') {
    if (isAr) {
      return {
        ...member,
        fullName: 'أ.د. أشرف جلال سالم',
        jobTitle: 'المدير التنفيذي والطبي',
        organization: 'مجتمع القيادة الصحية',
        specialty: 'الحوكمة الإكلينيكية وإدارة المستشفيات',
        bio: 'قيادة منظومة الحوكمة الإكلينيكية وتطوير الكوادر القيادية بمجتمع القيادة الصحية.',
      };
    } else {
      return {
        ...member,
        fullName: 'Prof. Dr. Ashraf Galal Salem',
        jobTitle: 'Executive Director & Chief Medical Officer',
        organization: 'Healthcare Leadership Community',
        specialty: 'Healthcare Governance & Clinical Strategy',
        bio: 'Leading clinical governance and healthcare leadership development across executive networks.',
      };
    }
  }

  return {
    ...member,
    fullName: (isAr ? member.fullNameAr : member.fullNameEn) || member.fullName,
    jobTitle: (isAr ? member.jobTitleAr : member.jobTitleEn) || member.jobTitle,
    organization: (isAr ? member.organizationAr : member.organizationEn) || member.organization,
    specialty: getLocalizedCategory(member.specialty, language),
    bio: (isAr ? member.bioAr : member.bioEn) || member.bio,
  };
}

/**
 * Known Partners & Accreditations dictionary.
 */
const KNOWN_PARTNERS: Record<string, { en: Record<string, any>; ar: Record<string, any> }> = {
  partner_jci: {
    en: {
      organizationName: 'Joint Commission International (JCI)',
      relationshipType: 'Hospital Network Accreditation',
      description: 'Gold standard global hospital accreditation for international clinical excellence, governance, and patient safety.',
    },
    ar: {
      organizationName: 'اللجنة المشتركة الدولية (JCI)',
      relationshipType: 'اعتماد دولي لشبكة المستشفيات',
      description: 'المعيار الذهبي العالمي لاعتماد المستشفيات تقديراً للتميز الإكلينيكي والحوكمة وسلامة المرضى.',
    },
  },
  partner_temos: {
    en: {
      organizationName: 'TEMOS International',
      relationshipType: 'Clinical Governance Certification',
      description: 'International quality certification for healthcare management, medical tourism, and international patient care excellence.',
    },
    ar: {
      organizationName: 'تيموس الدولية (TEMOS International)',
      relationshipType: 'شهادة جودة الحوكمة الإكلينيكية',
      description: 'شهادة الجودة الدولية المعتمدة في إدارة المستشفيات والسياحة العلاجية والتميز في رعاية المرضى الدوليين.',
    },
  },
  partner_canada: {
    en: {
      organizationName: 'Accreditation Canada',
      relationshipType: 'Hospital Network Accreditation',
      description: 'Global healthcare standards benchmarking and institutional quality management system assessment.',
    },
    ar: {
      organizationName: 'الاعتماد الكندي للرعاية الصحية',
      relationshipType: 'اعتماد دولي لشبكة المستشفيات',
      description: 'معايير جودة الرعاية الصحية العالمية وتقييم أنظمة إدارة الجودة المؤسسية وسلامة الإجراءات الطبية.',
    },
  },
  partner_royal_college: {
    en: {
      organizationName: 'Royal College of Physicians and Surgeons',
      relationshipType: 'Academic & Educational Partner',
      description: 'Prestigious institutional collaboration in medical workforce development, specialized clinical training, and professional leadership standards.',
    },
    ar: {
      organizationName: 'الكلية الملكية للأطباء والجراحين',
      relationshipType: 'شريك أكاديمي وتعليمي',
      description: 'تعاون مؤسسي رفيع في تدريب الكوادر الطبية والتعليم المستمر وتطبيق أرفع معايير الممارسة الإكلينيكية والقيادية.',
    },
  },
  partner_ahe: {
    en: {
      organizationName: 'Association for the Healthcare Environment (AHE)',
      relationshipType: 'Professional Healthcare Association',
      description: 'Professional authority dedicated to optimizing healthcare environments, infection control protocols, and clinical operations excellence.',
    },
    ar: {
      organizationName: 'جمعية البيئة الصحية الأمريكية (AHE)',
      relationshipType: 'جمعية مهنية للرعاية الصحية',
      description: 'المرجعية المهنية العالمية في تطوير البيئة الاستشفائية، بروتوكولات مكافحة العدوى، والتميز في العمليات التشغيلية للمستشفيات.',
    },
  },
  partner_sgh_academy: {
    en: {
      organizationName: 'Executive Healthcare Leadership Academy',
      relationshipType: 'Academic & Educational Partner',
      description: 'Premier executive education arm offering healthcare leadership development, continuous professional education, and fellowships.',
    },
    ar: {
      organizationName: 'الأكاديمية التنفيذية للقيادة الصحية',
      relationshipType: 'شريك أكاديمي وتعليمي',
      description: 'الذراع التعليمي والتدريبي الرائد لتقديم برامج التطوير القيادي والتعليم الطبي المستمر والزمالات المهنية.',
    },
  },
};

/**
 * Localizes a Partner Accreditation.
 */
export function getLocalizedPartner(partner: PartnerAccreditation, language: Language): PartnerAccreditation {
  const isAr = language === 'ar';
  const known = KNOWN_PARTNERS[partner.id];

  if (known) {
    const loc = isAr ? known.ar : known.en;
    return {
      ...partner,
      organizationName: loc.organizationName || partner.organizationName,
      relationshipType: (loc.relationshipType || partner.relationshipType) as any,
      description: loc.description || partner.description,
    };
  }

  return {
    ...partner,
    organizationName: (isAr ? partner.organizationNameAr : partner.organizationNameEn) || partner.organizationName,
    relationshipType: ((isAr ? partner.relationshipTypeAr : partner.relationshipTypeEn) || partner.relationshipType) as any,
    description: (isAr ? partner.descriptionAr : partner.descriptionEn) || partner.description,
  };
}

/**
 * Known Membership Benefits dictionary.
 */
const KNOWN_BENEFITS: Record<string, { en: Partial<MembershipBenefit>; ar: Partial<MembershipBenefit> }> = {
  benefit_academy_courses: {
    en: {
      title: 'Executive Healthcare Academy Course Reductions',
      category: 'Academy & Education',
      description: 'Exclusive member discounts on select healthcare management diplomas, clinical leadership courses, and healthcare workforce certifications.',
      conditions: 'Subject to course seat availability, cohort enrollment dates, and specific academic prerequisites as established by the Executive Healthcare Leadership Academy.',
    },
    ar: {
      title: 'تخفيضات دورات ودبلومات الأكاديمية التنفيذية للقيادة الصحية',
      category: 'Academy & Education',
      description: 'خصومات حصرية للأعضاء على دبلومات إدارة المستشفيات المختارة، برامج القيادة الإكلينيكية، وشهادات تطوير الكوادر الصحية.',
      conditions: 'تخضع لتوفر المقاعد ومواعيد انطلاق الدفعات الدراسية والشروط الأكاديمية المقررة من الأكاديمية التنفيذية للقيادة الصحية.',
    },
  },
  benefit_training_programs: {
    en: {
      title: 'Discounts on Eligible Training Programs',
      category: 'Professional Development',
      description: 'Preferential registration rates for executive masterclasses, hospital operational excellence tracks, and healthcare human capital training.',
      conditions: 'Applies to accredited programs designated by the community secretariat. Verification of active approved membership required.',
    },
    ar: {
      title: 'خصومات البرامج التدريبية التنفيذية المؤهلة',
      category: 'Professional Development',
      description: 'أسعار تفضيلية لحضور ورش العمل التنفيذية، مسارات التميز التشغيلي في المستشفيات، وتدريب رأس المال البشري للرعاية الصحية.',
      conditions: 'تسري على البرامج المعتمدة المحددة من أمانة الملتقى. يلزم التحقق من سريان العضوية المعتمدة.',
    },
  },
  benefit_partner_offers: {
    en: {
      title: 'Special Offers from Participating Organizations',
      category: 'Institutional Collaboration',
      description: 'Special access privileges, educational materials, and institutional offerings from participating universities, associations, and healthcare partners.',
      conditions: 'Offerings vary by participating partner institution and are subject to respective bilateral institutional guidelines.',
    },
    ar: {
      title: 'مزايا حصرية من الجهات والشركاء المشاركين',
      category: 'Institutional Collaboration',
      description: 'فرص اطلاع خاصة، حقائب تعليمية، وخدمات مؤسسية مقدمة من الجامعات والهيئات والشركاء الصحيين المشاركين في الملتقى.',
      conditions: 'تختلف المزايا وفق اللوائح التنظيمية لكل جهة شريكة وتخضع للتنسيق الإداري المباشر.',
    },
  },
  benefit_executive_networking: {
    en: {
      title: 'Executive Healthcare Peer Connections',
      category: 'Executive Networking',
      description: 'Direct networking with hospital directors, CMOs, CHROs, healthcare executives, and department heads across Egypt and the MENA region.',
      conditions: 'Restricted strictly to verified, approved healthcare leadership members via the secure Members Directory.',
    },
    ar: {
      title: 'شبكة التواصل المهني المباشر بين قيادات المستشفيات',
      category: 'Executive Networking',
      description: 'تواصل مهني رفيع مع مديري المستشفيات، المديرين الطبيين، رؤساء الموارد البشرية، والقيادات التنفيذية في مصر والمنطقة.',
      conditions: 'مقتصرة حصرياً على الأعضاء المعتمدين والموثقين من خلال دليل القيادات الآمن.',
    },
  },
  benefit_knowledge_exchange: {
    en: {
      title: 'Professional Knowledge & Workforce Strategy Exchange',
      category: 'Professional Development',
      description: 'Access to curated leadership toolkits, strategic human capital frameworks, employee retention case studies, and confidential peer roundtables.',
      conditions: 'Member submissions and forum interactions are governed by medical leadership ethics and strict confidentiality standards.',
    },
    ar: {
      title: 'تبادل المعرفة المهنية واستراتيجيات الكوادر الصحية',
      category: 'Professional Development',
      description: 'الوصول إلى أدلة العمل القيادية، أطر إدارة رأس المال البشري، دراسات حالة استبقاء الموظفين، وحلقات النقاش التخصصية.',
      conditions: 'تخضع كافة المشاركات لضوابط أخلاقيات المهن الطبية ومعايير السرية التامة دون بيانات للمرضى.',
    },
  },
  benefit_roundtables_summits: {
    en: {
      title: 'Invitations to Executive Roundtables & Summits',
      category: 'Leadership Roundtables',
      description: 'Guaranteed invitations and priority seat reservations for executive roundtables, summits, and collaborative healthcare initiatives.',
      conditions: 'Venue capacity is limited to maintain interactive leadership dialogue (in-person attendance capped per round).',
    },
    ar: {
      title: 'أولوية حجز المقاعد في الطاولات المستديرة والملتقيات',
      category: 'Leadership Roundtables',
      description: 'دعوات رسمية وحجز مقاعد ذو أولوية في كافة الطاولات المستديرة والملتقيات القيادية ومبادرات التعاون المشترك.',
      conditions: 'المقاعد محدودة لضمان فاعلية الحوار القيادي التفاعلي (يتم تحديد حد أقصى للحضور بالقاعة).',
    },
  },
};

/**
 * Localizes a Membership Benefit.
 */
export function getLocalizedBenefit(benefit: MembershipBenefit, language: Language): MembershipBenefit {
  const isAr = language === 'ar';
  const known = KNOWN_BENEFITS[benefit.id];

  if (known) {
    const loc = isAr ? known.ar : known.en;
    return {
      ...benefit,
      title: loc.title || benefit.title,
      description: loc.description || benefit.description,
      conditions: loc.conditions || benefit.conditions,
    };
  }

  return {
    ...benefit,
    title: (isAr ? benefit.titleAr : benefit.titleEn) || benefit.title,
    description: (isAr ? benefit.descriptionAr : benefit.descriptionEn) || benefit.description,
    conditions: (isAr ? benefit.conditionsAr : benefit.conditionsEn) || benefit.conditions,
  };
}

/**
 * Localizes categories, specialties, and leadership domains.
 */
export function getLocalizedCategory(cat: string, language: Language): string {
  if (!cat) return '';
  const isAr = language === 'ar';

  const CATEGORY_MAP: Record<string, { en: string; ar: string }> = {
    'Human Capital Management': {
      en: 'Human Capital Management',
      ar: 'إدارة رأس المال البشري',
    },
    'Healthcare Workforce Development': {
      en: 'Healthcare Workforce Development',
      ar: 'تطوير الكوادر الصحية',
    },
    'Talent Management & Retention': {
      en: 'Talent Management & Retention',
      ar: 'إدارة واستبقاء الكفاءات',
    },
    'Leadership Development': {
      en: 'Leadership Development',
      ar: 'تطوير القيادات الصحية',
    },
    'Learning & Development': {
      en: 'Learning & Development',
      ar: 'التعليم والتطوير المستمر',
    },
    'Organizational Effectiveness': {
      en: 'Organizational Effectiveness',
      ar: 'الفعالية والكفاءة التنظيمية',
    },
    'Employee Experience': {
      en: 'Employee Experience',
      ar: 'تجربة الموظف وبيئة العمل',
    },
    'Healthcare Education & Collaboration': {
      en: 'Healthcare Education & Collaboration',
      ar: 'التعليم الصحي والتعاون المؤسسي',
    },
    'Healthcare Governance & Clinical Strategy': {
      en: 'Healthcare Governance & Clinical Strategy',
      ar: 'الحوكمة الإكلينيكية وإدارة المستشفيات',
    },
    'Workforce Strategy & Retention': {
      en: 'Workforce Strategy & Retention',
      ar: 'استراتيجيات الكوادر والاستبقاء',
    },
    'Executive Leadership & Governance': {
      en: 'Executive Leadership & Governance',
      ar: 'القيادة التنفيذية والحوكمة',
    },
    'Learning, Training & Academies': {
      en: 'Learning, Training & Academies',
      ar: 'التدريب والتعليم والأكاديميات',
    },
    'Organizational Effectiveness & Culture': {
      en: 'Organizational Effectiveness & Culture',
      ar: 'الفعالية التنظيمية وثقافة العمل',
    },
    'Employee Experience & Wellbeing': {
      en: 'Employee Experience & Wellbeing',
      ar: 'تجربة الموظف والصحة المهنية',
    },
    'Institutional Accreditation & Quality': {
      en: 'Institutional Accreditation & Quality',
      ar: 'الاعتمادات المؤسسية والجودة',
    },
  };

  if (CATEGORY_MAP[cat]) {
    return isAr ? CATEGORY_MAP[cat].ar : CATEGORY_MAP[cat].en;
  }

  // Reverse mapping if Arabic was passed
  for (const key of Object.keys(CATEGORY_MAP)) {
    if (CATEGORY_MAP[key].ar === cat) {
      return isAr ? CATEGORY_MAP[key].ar : CATEGORY_MAP[key].en;
    }
  }

  return cat;
}

/**
 * Localizes venue type.
 */
export function getLocalizedVenueType(venueType: string, language: Language): string {
  const isAr = language === 'ar';
  switch (venueType) {
    case 'in_person':
      return isAr ? 'حضوري' : 'In-Person';
    case 'hybrid':
      return isAr ? 'مختلط (حضوري وعبر الإنترنت)' : 'Hybrid';
    case 'virtual':
      return isAr ? 'عبر الإنترنت' : 'Virtual';
    default:
      return venueType;
  }
}

/**
 * Localizes status strings.
 */
export function getLocalizedStatus(status: string, language: Language): string {
  const isAr = language === 'ar';
  switch (status.toLowerCase()) {
    case 'published':
      return isAr ? 'نشط / منشور' : 'Published';
    case 'draft':
      return isAr ? 'مسودة' : 'Draft';
    case 'archived':
      return isAr ? 'مؤرشف' : 'Archived';
    case 'closed':
      return isAr ? 'مغلق' : 'Closed';
    case 'approved':
      return isAr ? 'معتمد' : 'Approved';
    case 'pending':
      return isAr ? 'قيد المراجعة' : 'Pending Review';
    case 'rejected':
      return isAr ? 'مرفوض' : 'Rejected';
    default:
      return status;
  }
}
