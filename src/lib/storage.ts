/**
 * Healthcare Leadership Community — Clean Storage & Persistent Repository
 * Powered by Saudi German Hospital Egypt
 */

import {
  Member,
  MemberPrivate,
  Round,
  Registration,
  Attendance,
  Topic,
  Comment,
  TopicReaction,
  UserRole,
  EmailNotification,
  PartnerAccreditation,
  MembershipBenefit,
} from '../types';
import { inspectHealthcareContent } from './sanitization';

// Isolated storage keys
const STORAGE_KEYS = {
  MEMBERS: 'hle_sgh_members_v3_fresh',
  MEMBERS_PRIVATE: 'hle_sgh_members_private_v3_fresh',
  ROUNDS: 'hle_sgh_rounds_v3_fresh',
  REGISTRATIONS: 'hle_sgh_registrations_v3_fresh',
  ATTENDANCE: 'hle_sgh_attendance_v3_fresh',
  TOPICS: 'hle_sgh_topics_v3_fresh',
  COMMENTS: 'hle_sgh_comments_v3_fresh',
  REACTIONS: 'hle_sgh_reactions_v3_fresh',
  CONSENTS: 'hle_sgh_consents_v3_fresh',
  ACTIVE_USER_ID: 'hle_sgh_active_user_id_v3_fresh',
  ADMIN_TOKEN: 'hle_sgh_admin_session_token',
  SESSION_TOKEN: 'hle_sgh_user_session_token',
  AUDIT_LOG: 'hle_sgh_audit_log_v3_fresh',
  WIPED_FLAG: 'hle_sgh_data_wiped_flag_v3',
  PARTNERS: 'hle_sgh_partners_v4',
  BENEFITS: 'hle_sgh_benefits_v4',
  BRAND_SETTINGS: 'hle_brand_settings_v2',
};

export interface BrandSettings {
  primaryLogoUrl: string; // Horizontal logo
  secondaryLogoUrl: string; // Vertical / emblem logo
  logo1Alt: string;
  logo2Alt: string;
  platformName: string;
  platformNameAr: string;
  updatedAt: string;
}

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  primaryLogoUrl: '/assets/aistudio/Academy-logos-01_08a20a13.png',
  secondaryLogoUrl: '/assets/aistudio/Academy-logos-03_a9a4c809.png',
  logo1Alt: 'Saudi German Academy - Hospital Management Excellence',
  logo2Alt: 'Saudi German Academy Emblem',
  platformName: 'Healthcare Leaders Community',
  platformNameAr: 'مجتمع قادة الرعاية الصحية',
  updatedAt: '2026-10-27T08:00:00.000Z',
};

// Root Admin profile bootstrap for Ashrafgalalsalem@gmail.com
const ROOT_ADMIN: Member = {
  id: 'admin_ashraf',
  fullName: 'Prof. Dr. Ashraf Galal Salem',
  fullNameEn: 'Prof. Dr. Ashraf Galal Salem',
  fullNameAr: 'أ.د. أشرف جلال سالم',
  professionalEmail: 'Ashrafgalalsalem@gmail.com',
  username: 'admin',
  jobTitle: 'Executive Director & Chief Medical Officer',
  jobTitleEn: 'Executive Director & Chief Medical Officer',
  jobTitleAr: 'المدير التنفيذي والطبي',
  organization: 'Healthcare Leaders Community',
  organizationEn: 'Healthcare Leaders Community',
  organizationAr: 'مجتمع القادة الصحيين',
  specialty: 'Healthcare Governance & Clinical Strategy',
  specialtyEn: 'Healthcare Governance & Clinical Strategy',
  specialtyAr: 'الحوكمة الإكلينيكية وإدارة المستشفيات',
  bio: 'Leading clinical governance and healthcare leadership across Egypt and regional healthcare networks.',
  bioEn: 'Leading clinical governance and healthcare leadership across Egypt and regional healthcare networks.',
  bioAr: 'قيادة منظومة الحوكمة الإكلينيكية وتطوير الكوادر القيادية بمصر والمنطقة.',
  role: 'administrator',
  status: 'approved',
  joinedAt: '2026-10-20T00:00:00.000Z',
  approvedAt: '2026-10-20T00:00:00.000Z',
  reviewedBy: 'Board of Governors',
  approvalEmailSent: false,
  consentDirectoryDisplay: true,
  consentPhotoPublish: true,
  consentFutureCommunications: true,
};

// Official confirmed inaugural round with full bilingual data
const DEFAULT_INAUGURAL_ROUND: Round = {
  id: 'round_sgh_cairo_inaugural_2026',
  title: '1st Executive Hospital Leadership & Clinical Governance Summit 2026',
  titleEn: '1st Executive Hospital Leadership & Clinical Governance Summit 2026',
  titleAr: 'الملتقى القيادي الأول لإدارة المستشفيات والحوكمة الإكلينيكية 2026',
  topic: 'Workforce Resilience, Artificial Intelligence & Institutional Quality Standards in Hospital Leadership',
  topicEn: 'Workforce Resilience, Artificial Intelligence & Institutional Quality Standards in Hospital Leadership',
  topicAr: 'الذكاء الاصطناعي ومعايير الجودة والاعتماد في قيادة المستشفيات الحديثة',
  description:
    'An executive leadership summit convening Chief Executive Officers, Chief Medical Officers, and department heads across Egypt to discuss clinical governance, workforce resilience, and AI integration in healthcare quality.',
  descriptionEn:
    'An executive leadership summit convening Chief Executive Officers, Chief Medical Officers, and department heads across Egypt to discuss clinical governance, workforce resilience, and AI integration in healthcare quality.',
  descriptionAr:
    'ملتقى قيادي تنفيذي يجمع كبار المديرين التنفيذيين والمديرين الطبيين ورؤساء الأقسام بمستشفيات مصر، لمناقشة الحوكمة الإكلينيكية ودمج الذكاء الاصطناعي في جودة الرعاية الصحية وإدارة الأزمات.',
  scheduledDate: '2026-10-27',
  scheduledDateEn: 'October 27, 2026',
  scheduledDateAr: '27 أكتوبر 2026',
  scheduledTime: '10:00 AM - 02:30 PM (EET)',
  scheduledTimeEn: '10:00 AM - 02:30 PM (EET)',
  scheduledTimeAr: '10:00 صباحاً - 02:30 ظهراً',
  durationMinutes: 270,
  venue: 'Grand Conference Auditorium - Executive Healthcare Center, Cairo, Egypt',
  venueEn: 'Grand Conference Auditorium - Executive Healthcare Center, Cairo, Egypt',
  venueAr: 'قاعة المؤتمرات الكبرى - مجمع القيادة الصحية، القاهرة',
  venueType: 'in_person',
  maxCapacity: 75,
  currentRegistrationsCount: 24,
  status: 'published',
  eventType: 'roundtable',
  createdAt: '2026-10-20T00:00:00.000Z',
  isFirstAdminConfirmedRound: true,
  speakers: [
    {
      id: 'spk_1',
      name: 'Prof. Dr. Ashraf Galal Salem',
      nameEn: 'Prof. Dr. Ashraf Galal Salem',
      nameAr: 'أ.د. أشرف جلال سالم',
      title: 'Executive Director & Chief Medical Officer',
      titleEn: 'Executive Director & Chief Medical Officer',
      titleAr: 'المدير التنفيذي والطبي',
      organization: 'Healthcare Leadership Community',
      organizationEn: 'Healthcare Leadership Community',
      organizationAr: 'مجتمع القيادة الصحية',
      bio: 'Professor and Senior Consultant in Medical Governance and Hospital Administration, leading global clinical quality and healthcare excellence.',
      bioEn: 'Professor and Senior Consultant in Medical Governance and Hospital Administration, leading global clinical quality and healthcare excellence.',
      bioAr: 'أستاذ واستشاري أول الحوكمة الطبية وإدارة المستشفيات، رائد تطبيق معايير الجودة العالمية في الرعاية الصحية.',
    },
    {
      id: 'spk_2',
      name: 'Dr. Tarek Mansour',
      nameEn: 'Dr. Tarek Mansour',
      nameAr: 'د. طارق منصور',
      title: 'Director of Clinical Quality & Patient Safety',
      titleEn: 'Director of Clinical Quality & Patient Safety',
      titleAr: 'رئيس قطاع الجودة وسلامة المرضى',
      organization: 'Specialized Hospitals Network',
      organizationEn: 'Specialized Hospitals Network',
      organizationAr: 'شبكة المستشفيات التخصصية',
      bio: 'International expert in healthcare quality accreditations and clinical KPI measurement systems.',
      bioEn: 'International expert in healthcare quality accreditations and clinical KPI measurement systems.',
      bioAr: 'خبير الاعتمادات الدولية للجودة ونظم قياس مؤشرات الأداء الإكلينيكي.',
    },
    {
      id: 'spk_3',
      name: 'Dr. Mona Hegazy',
      nameEn: 'Dr. Mona Hegazy',
      nameAr: 'د. منى حجازي',
      title: 'Head of Digital Health Transformation',
      titleEn: 'Head of Digital Health Transformation',
      titleAr: 'رئيس وحدة التحول الرقمي والمعلوماتية الصحية',
      organization: 'Digital Health Expert Council',
      organizationEn: 'Digital Health Expert Council',
      organizationAr: 'مجلس خبراء الصحة الرقمية',
      bio: 'Consultant in healthcare AI applications and predictive clinical analytics in critical care delivery.',
      bioEn: 'Consultant in healthcare AI applications and predictive clinical analytics in critical care delivery.',
      bioAr: 'استشارية تطبيقات الذكاء الاصطناعي والتحليل التنبؤي في سلاسل الرعاية الحرجة.',
    },
  ],
  agenda: [
    {
      time: '10:00 AM - 10:30 AM',
      timeEn: '10:00 AM - 10:30 AM',
      timeAr: '10:00 صباحاً - 10:30 صباحاً',
      title: 'Executive Welcome Reception & Professional Networking',
      titleEn: 'Executive Welcome Reception & Professional Networking',
      titleAr: 'الاستقبال والترحيب التنفيذي وشبكة التواصل المهني',
      description: 'Executive registration and welcome reception for hospital leaders and strategic partners in the Grand Foyer.',
      descriptionEn: 'Executive registration and welcome reception for hospital leaders and strategic partners in the Grand Foyer.',
      descriptionAr: 'تسجيل الحضور التنفيذي والترحيب بقيادات المستشفيات والشركاء الاستراتيجيين في بهو المؤتمرات.',
      speaker: 'Summit Secretariat',
      speakerEn: 'Summit Secretariat',
      speakerAr: 'الأمانة العامة للملتقى',
    },
    {
      time: '10:30 AM - 11:30 AM',
      timeEn: '10:30 AM - 11:30 AM',
      timeAr: '10:30 صباحاً - 11:30 صباحاً',
      title: 'Keynote Session: Clinical Governance Strategies & International Accreditations (JCI & TEMOS)',
      titleEn: 'Keynote Session: Clinical Governance Strategies & International Accreditations (JCI & TEMOS)',
      titleAr: 'الجلسة الافتتاحية: استراتيجيات الحوكمة الإكلينيكية والاعتمادات الدولية JCI & TEMOS',
      description: 'Presenting a comprehensive strategic framework for patient safety assurance and clinical leadership KPIs across healthcare networks in Egypt.',
      descriptionEn: 'Presenting a comprehensive strategic framework for patient safety assurance and clinical leadership KPIs across healthcare networks in Egypt.',
      descriptionAr: 'عرض الرؤية الشاملة لضمان أمان المرضى ومؤشرات الأداء القيادية في بيئة الرعاية الصحية المصرية.',
      speaker: 'Prof. Dr. Ashraf Galal Salem',
      speakerEn: 'Prof. Dr. Ashraf Galal Salem',
      speakerAr: 'أ.د. أشرف جلال سالم',
    },
    {
      time: '11:45 AM - 01:00 PM',
      timeEn: '11:45 AM - 01:00 PM',
      timeAr: '11:45 صباحاً - 01:00 ظهراً',
      title: 'Panel Discussion: Deploying AI & Digital Transformation in Operational Efficiency',
      titleEn: 'Panel Discussion: Deploying AI & Digital Transformation in Operational Efficiency',
      titleAr: 'حلقة نقاشية: توظيف الذكاء الاصطناعي والتحول الرقمي في كفاءة الخدمات التشغيلية',
      description: 'Real-world hospital case studies on reducing wait times and eliminating clinical errors through intelligent health systems.',
      descriptionEn: 'Real-world hospital case studies on reducing wait times and eliminating clinical errors through intelligent health systems.',
      descriptionAr: 'دراسات حالة واقعية من المستشفيات الرائدة حول تقليل فترات الانتظار ومنع الأخطاء الطبية عبر الأنظمة الذكية.',
      speaker: 'Dr. Mona Hegazy & Dr. Tarek Mansour',
      speakerEn: 'Dr. Mona Hegazy & Dr. Tarek Mansour',
      speakerAr: 'د. منى حجازي & د. طارق منصور',
    },
    {
      time: '01:00 PM - 02:30 PM',
      timeEn: '01:00 PM - 02:30 PM',
      timeAr: '01:00 ظهراً - 02:30 ظهراً',
      title: 'Executive Networking Luncheon & Bilateral Hospital Partnership Dialogue',
      titleEn: 'Executive Networking Luncheon & Bilateral Hospital Partnership Dialogue',
      titleAr: 'غداء عمل تنفيذي ومناقشة الشراكات الثنائية بين المستشفيات',
      description: 'Roundtable dialogue for establishing collaboration protocols and knowledge exchange between participating healthcare executives.',
      descriptionEn: 'Roundtable dialogue for establishing collaboration protocols and knowledge exchange between participating healthcare executives.',
      descriptionAr: 'طاولة مستديرة لبناء بروتوكولات تعاون وتبادل الخبرات بين القيادات الصحية المشاركة.',
      speaker: 'All Participating Executives',
      speakerEn: 'All Participating Executives',
      speakerAr: 'كافة القيادات الحاضرة',
    },
  ],
};

// Verified Accreditations and Strategic Institutional Partnerships
export const DEFAULT_PARTNERS: PartnerAccreditation[] = [
  {
    id: 'partner_jci',
    organizationName: 'Joint Commission International (JCI)',
    logoUrl: '',
    relationshipType: 'Hospital Network Accreditation',
    description:
      'Gold standard global hospital accreditation for international clinical excellence, governance, and patient safety.',
    verificationStatus: 'verified',
    displayOrder: 1,
    isActive: true,
    websiteUrl: 'https://www.jointcommissioninternational.org',
    verifiedAt: '2026-10-20T00:00:00.000Z',
    verifiedBy: 'Clinical Governance Board',
  },
  {
    id: 'partner_temos',
    organizationName: 'TEMOS International',
    logoUrl: '',
    relationshipType: 'Clinical Governance Certification',
    description:
      'International quality certification for healthcare management, medical excellence, and international patient care standards.',
    verificationStatus: 'verified',
    displayOrder: 2,
    isActive: true,
    websiteUrl: 'https://www.temos-international.com',
    verifiedAt: '2026-10-20T00:00:00.000Z',
    verifiedBy: 'Clinical Governance Board',
  },
  {
    id: 'partner_canada',
    organizationName: 'Canadian Accreditation',
    logoUrl: '',
    relationshipType: 'Hospital Network Accreditation',
    description: 'Global healthcare standards benchmarking and institutional quality management system assessment.',
    verificationStatus: 'verified',
    displayOrder: 3,
    isActive: true,
    websiteUrl: 'https://accreditation.ca',
    verifiedAt: '2026-10-20T00:00:00.000Z',
    verifiedBy: 'Clinical Governance Board',
  },
  {
    id: 'partner_royal_college',
    organizationName: 'Royal College',
    logoUrl: '',
    relationshipType: 'Academic & Educational Partner',
    description:
      'Prestigious institutional collaboration in medical workforce development, specialized clinical training, and professional leadership standards.',
    verificationStatus: 'verified',
    displayOrder: 4,
    isActive: true,
    websiteUrl: 'https://www.royalcollege.ca',
    verifiedAt: '2026-10-20T00:00:00.000Z',
    verifiedBy: 'Clinical Governance Board',
  },
  {
    id: 'partner_ahe',
    organizationName: 'Association for the Healthcare Environment (AHE)',
    logoUrl: '',
    relationshipType: 'Professional Healthcare Association',
    description:
      'Professional authority dedicated to optimizing healthcare environments, infection control protocols, and clinical operations excellence.',
    verificationStatus: 'verified',
    displayOrder: 5,
    isActive: true,
    websiteUrl: 'https://www.ahe.org',
    verifiedAt: '2026-10-20T00:00:00.000Z',
    verifiedBy: 'Clinical Governance Board',
  },
  {
    id: 'partner_executive_academy',
    organizationName: 'Executive Healthcare Leadership Academy',
    logoUrl: '',
    relationshipType: 'Academic & Educational Partner',
    description:
      'Premier executive education arm offering healthcare leadership development, continuous professional education, and medical director fellowships.',
    verificationStatus: 'verified',
    displayOrder: 6,
    isActive: true,
    websiteUrl: '',
    verifiedAt: '2026-10-20T00:00:00.000Z',
    verifiedBy: 'Clinical Governance Board',
  },
];

// Verified Membership Benefits
export const DEFAULT_BENEFITS: MembershipBenefit[] = [
  {
    id: 'benefit_academy_courses',
    title: 'Executive Academy Course Reductions',
    category: 'Academy & Education',
    description:
      'Exclusive member discounts on select healthcare management diplomas, clinical leadership courses, and healthcare workforce certifications.',
    conditions:
      'Subject to course seat availability, cohort enrollment dates, and specific academic prerequisites as established by the Executive Healthcare Academy.',
    iconName: 'GraduationCap',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'benefit_training_programs',
    title: 'Discounts on Eligible Training Programs',
    category: 'Professional Development',
    description:
      'Preferential registration rates for executive masterclasses, hospital operational excellence tracks, and healthcare human capital training.',
    conditions:
      'Applies to accredited programs designated by the community secretariat. Verification of active approved membership required.',
    iconName: 'Award',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'benefit_partner_offers',
    title: 'Special Offers from Participating Organizations',
    category: 'Institutional Collaboration',
    description:
      'Special access privileges, educational materials, and institutional offerings from participating universities, associations, and healthcare partners.',
    conditions:
      'Offerings vary by participating partner institution and are subject to respective bilateral institutional guidelines.',
    iconName: 'Building2',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'benefit_executive_networking',
    title: 'Executive Healthcare Peer Connections',
    category: 'Executive Networking',
    description:
      'Direct networking with hospital directors, CMOs, CHROs, healthcare executives, and department heads across Egypt and the MENA region.',
    conditions: 'Restricted strictly to verified, approved healthcare leadership members via the secure Members Directory.',
    iconName: 'Users',
    displayOrder: 4,
    isActive: true,
  },
  {
    id: 'benefit_knowledge_exchange',
    title: 'Professional Knowledge & Workforce Strategy Exchange',
    category: 'Professional Development',
    description:
      'Access to curated leadership toolkits, strategic human capital frameworks, employee retention case studies, and confidential peer roundtables.',
    conditions: 'Member submissions and forum interactions are governed by medical leadership ethics and strict confidentiality standards.',
    iconName: 'BookOpen',
    displayOrder: 5,
    isActive: true,
  },
  {
    id: 'benefit_roundtables_summits',
    title: 'Invitations to Executive Roundtables & Summits',
    category: 'Leadership Roundtables',
    description:
      'Guaranteed invitations and priority seat reservations for executive roundtables, summits, and collaborative healthcare initiatives.',
    conditions: 'Venue capacity is limited to maintain interactive leadership dialogue (in-person attendance capped per round).',
    iconName: 'Calendar',
    displayOrder: 6,
    isActive: true,
  },
];

export const DEFAULT_TOPICS: Topic[] = [
  {
    id: 'top_workforce_resilience',
    title: 'Hospital Workforce Retention & Combating Clinical Brain Drain',
    category: 'Healthcare Workforce Development',
    body: 'With escalating international migration of skilled physicians, specialized ICU nurses, and clinical leaders, Egyptian hospitals face unprecedented retention challenges. At our institutions, we have piloted dual-track leadership development programs, structured CME incentives, and flexible clinical governance schedules to preserve institutional expertise. We invite fellow Chief Executive Officers and Medical Directors to share quantifiable strategies that have reduced clinical turnover in their hospital networks.',
    authorId: 'admin_ashraf',
    authorName: 'Prof. Dr. Ashraf Galal Salem',
    authorTitle: 'Executive Director & Chief Medical Officer',
    authorOrg: 'Healthcare Leadership Community',
    status: 'pinned',
    createdAt: '2026-10-21T09:00:00.000Z',
    publishedAt: '2026-10-21T09:00:00.000Z',
    likeCount: 18,
    dislikeCount: 1,
    commentCount: 2,
    tags: ['Retention', 'Workforce', 'Governance'],
  },
  {
    id: 'top_digital_health_governance',
    title: 'Integrating Clinical AI Tools into Hospital Governance & Safety Frameworks',
    category: 'Organizational Effectiveness',
    body: 'As artificial intelligence enters diagnostic triaging, predictive pathology, and ICU early-warning systems, hospital leadership must define clear accountability matrices. Who is legally and ethically responsible when algorithmic recommendations conflict with consultant judgment? Establishing an institutional AI Ethics & Clinical Governance Board is no longer optional—it is a cornerstone for patient safety and institutional accreditation.',
    authorId: 'mem_tarek_mansour',
    authorName: 'Dr. Tarek Mansour',
    authorTitle: 'Director of Clinical Quality & Patient Safety',
    authorOrg: 'Specialized Hospitals Network',
    status: 'approved',
    createdAt: '2026-10-22T11:30:00.000Z',
    publishedAt: '2026-10-22T11:30:00.000Z',
    likeCount: 12,
    dislikeCount: 0,
    commentCount: 1,
    tags: ['AI Governance', 'Patient Safety', 'Accreditation'],
  },
  {
    id: 'top_executive_compensation',
    title: 'Benchmarking Executive Compensation and Clinical KPI Alignment',
    category: 'Human Capital Management',
    body: 'Aligning executive compensation structures with patient safety outcomes, clinical audit compliance, and staff retention rates rather than pure financial metrics. Proposal for an executive working group to benchmark standards across regional hospital operators.',
    authorId: 'mem_mona_hegazy',
    authorName: 'Dr. Mona Hegazy',
    authorTitle: 'Head of Digital Health & Strategy',
    authorOrg: 'Digital Health Expert Council',
    status: 'pending',
    createdAt: '2026-10-24T14:15:00.000Z',
    likeCount: 0,
    dislikeCount: 0,
    commentCount: 0,
    tags: ['Executive KPIs', 'Human Capital'],
  },
];

export const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'cmt_1',
    topicId: 'top_workforce_resilience',
    topicTitle: 'Hospital Workforce Retention & Combating Clinical Brain Drain',
    authorId: 'mem_tarek_mansour',
    authorName: 'Dr. Tarek Mansour',
    authorTitle: 'Director of Clinical Quality & Patient Safety',
    authorOrg: 'Specialized Hospitals Network',
    content: 'Investing in localized nursing academies and clinical leadership mentorship reduced our specialized department turnover by 24% over 18 months.',
    status: 'approved',
    createdAt: '2026-10-21T10:15:00.000Z',
  },
  {
    id: 'cmt_2',
    topicId: 'top_workforce_resilience',
    topicTitle: 'Hospital Workforce Retention & Combating Clinical Brain Drain',
    authorId: 'mem_mona_hegazy',
    authorName: 'Dr. Mona Hegazy',
    authorTitle: 'Head of Digital Health & Strategy',
    authorOrg: 'Digital Health Expert Council',
    content: 'Digital shift scheduling and transparent overtime governance had an immediate positive impact on ICU team morale and retention.',
    status: 'pending',
    createdAt: '2026-10-24T16:00:00.000Z',
  },
  {
    id: 'cmt_3',
    topicId: 'top_digital_health_governance',
    topicTitle: 'Integrating Clinical AI Tools into Hospital Governance & Safety Frameworks',
    authorId: 'admin_ashraf',
    authorName: 'Prof. Dr. Ashraf Galal Salem',
    authorTitle: 'Executive Director & Chief Medical Officer',
    authorOrg: 'Healthcare Leadership Community',
    content: 'Every AI decision support algorithm deployed in our acute care wards must have explicit consultant sign-off protocols embedded in the electronic health record.',
    status: 'approved',
    createdAt: '2026-10-22T13:45:00.000Z',
  },
];

class StorageRepository {
  constructor() {
    this.ensureWipedClean();
    if (typeof window !== 'undefined') {
      this.fetchMembers().catch(() => {});
      this.fetchRoundsAsync().catch(() => {});
      this.fetchPartnersAsync().catch(() => {});
      this.fetchBenefitsAsync().catch(() => {});
    }
  }

  private ensureWipedClean() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.WIPED_FLAG)) {
        localStorage.setItem(STORAGE_KEYS.WIPED_FLAG, 'true');
        this.set(STORAGE_KEYS.MEMBERS, [ROOT_ADMIN]);
        this.set(STORAGE_KEYS.ROUNDS, [DEFAULT_INAUGURAL_ROUND]);
        this.set(STORAGE_KEYS.PARTNERS, DEFAULT_PARTNERS);
        this.set(STORAGE_KEYS.BENEFITS, DEFAULT_BENEFITS);
        this.set(STORAGE_KEYS.REGISTRATIONS, []);
        this.set(STORAGE_KEYS.ATTENDANCE, []);
        this.set(STORAGE_KEYS.TOPICS, []);
        this.set(STORAGE_KEYS.COMMENTS, []);
        this.set(STORAGE_KEYS.REACTIONS, []);
        this.set(STORAGE_KEYS.AUDIT_LOG, []);
        this.setActiveUserId('visitor');
      } else {
        const currentRounds = this.get<Round[]>(STORAGE_KEYS.ROUNDS, []);
        if (currentRounds.length === 0) {
          this.set(STORAGE_KEYS.ROUNDS, [DEFAULT_INAUGURAL_ROUND]);
        }
        const currentPartners = this.get<PartnerAccreditation[]>(STORAGE_KEYS.PARTNERS, []);
        if (currentPartners.length === 0) {
          this.set(STORAGE_KEYS.PARTNERS, DEFAULT_PARTNERS);
        }
        const currentBenefits = this.get<MembershipBenefit[]>(STORAGE_KEYS.BENEFITS, []);
        if (currentBenefits.length === 0) {
          this.set(STORAGE_KEYS.BENEFITS, DEFAULT_BENEFITS);
        }
      }
    } catch {}
  }

  private get<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        this.set(key, defaultVal);
        return defaultVal;
      }
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage write failed', e);
    }
  }

  // Session & Admin Token Management (No Hardcoded Secrets)
  public getAdminToken(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    } catch {
      return null;
    }
  }

  public setAdminToken(token: string | null): void {
    try {
      if (token) {
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
      }
    } catch {}
  }

  public getSessionToken(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.SESSION_TOKEN) || localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    } catch {
      return null;
    }
  }

  public setSessionToken(token: string | null): void {
    try {
      if (token) {
        sessionStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
      }
    } catch {}
  }

  public getAuthHeaders(requireAdmin = false): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const adminToken = this.getAdminToken();
    const sessionToken = this.getSessionToken();
    const token = requireAdmin ? (adminToken || sessionToken) : (sessionToken || adminToken);

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['x-admin-token'] = token;
      headers['x-session-token'] = token;
    }
    return headers;
  }

  /**
   * Resilient response parser: protects against SyntaxError: Unexpected token '<'
   * when servers, reverse proxies, or dev reloads return HTML (e.g. 502/503/404).
   */
  public async parseApiResponse<T = any>(res: Response): Promise<{
    ok: boolean;
    status: number;
    data: T | null;
    error?: string;
  }> {
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json();
        return {
          ok: res.ok,
          status: res.status,
          data,
          error: res.ok ? undefined : (data?.error || `Request failed with status ${res.status}`),
        };
      } catch {
        // Fall through to text handling if JSON parsing fails unexpectedly
      }
    }

    // Handle HTML, plain text, or proxy error pages gracefully
    try {
      const rawText = await res.text();
      const clean = rawText.trim();
      const isHtml =
        clean.startsWith('<') ||
        clean.includes('<html') ||
        clean.includes('<!DOCTYPE') ||
        clean.includes('<!doctype') ||
        clean.includes('502 Bad Gateway') ||
        clean.includes('503 Service');

      if (isHtml) {
        if (res.status === 404) {
          return {
            ok: false,
            status: 404,
            data: null,
            error: 'The requested resource or API endpoint was not found on the server.',
          };
        }
        if (res.status === 401 || res.status === 403) {
          return {
            ok: false,
            status: res.status,
            data: null,
            error: 'Unauthorized: Administrative authorization required.',
          };
        }
        return {
          ok: false,
          status: res.status || 500,
          data: null,
          error: 'The server or service is temporarily restarting or updating. Please try again in a few seconds.',
        };
      }

      return {
        ok: res.ok,
        status: res.status,
        data: null,
        error: clean.slice(0, 150) || `Request returned status ${res.status}`,
      };
    } catch {
      return {
        ok: false,
        status: res.status || 500,
        data: null,
        error: 'Network connection error. Please verify your connection and try again.',
      };
    }
  }

  public async safeFetch<T = any>(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
    try {
      const res = await fetch(input, init);
      return await this.parseApiResponse<T>(res);
    } catch (networkErr: any) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: 'Unable to reach the server. Please check your connection or wait a moment for the server to finish reloading.',
      };
    }
  }

  // --- Brand Settings & Logo Management ---
  public getBrandSettings(): BrandSettings {
    return this.get<BrandSettings>(STORAGE_KEYS.BRAND_SETTINGS, DEFAULT_BRAND_SETTINGS);
  }

  public setBrandSettings(settings: BrandSettings): void {
    this.set(STORAGE_KEYS.BRAND_SETTINGS, settings);
  }

  public async fetchBrandSettingsAsync(): Promise<BrandSettings> {
    try {
      const { ok, data } = await this.safeFetch<{ success: boolean; settings?: BrandSettings }>('/api/settings/brand');
      if (ok && data?.success && data?.settings) {
        this.setBrandSettings(data.settings);
        return data.settings;
      }
    } catch (err) {
      console.warn('Could not fetch brand settings from server:', err);
    }
    return this.getBrandSettings();
  }

  public async updateBrandSettingsAsync(
    updates: Partial<BrandSettings>
  ): Promise<{ success: boolean; settings?: BrandSettings; error?: string }> {
    try {
      const { ok, data, error } = await this.safeFetch<{ success: boolean; settings?: BrandSettings; error?: string }>(
        '/api/settings/brand',
        {
          method: 'POST',
          headers: this.getAuthHeaders(true),
          body: JSON.stringify(updates),
        }
      );
      if (ok && data?.success && data?.settings) {
        this.setBrandSettings(data.settings);
        return { success: true, settings: data.settings };
      }
      return { success: false, error: error || data?.error || 'Failed to update brand settings.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error.' };
    }
  }

  public async removeBrandLogoAsync(
    logoIndex: 1 | 2
  ): Promise<{ success: boolean; settings?: BrandSettings; error?: string }> {
    try {
      const { ok, data, error } = await this.safeFetch<{ success: boolean; settings?: BrandSettings; error?: string }>(
        `/api/settings/brand/logo/${logoIndex}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(true),
        }
      );
      if (ok && data?.success && data?.settings) {
        this.setBrandSettings(data.settings);
        this.logAudit('BRAND_LOGO_REMOVE', 'admin', `Removed Brand Logo ${logoIndex} from settings`);
        return { success: true, settings: data.settings };
      }
      return { success: false, error: error || data?.error || `Failed to remove Logo ${logoIndex}.` };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error.' };
    }
  }

  public async verifySessionAsync(): Promise<{ valid: boolean; isAdmin?: boolean; error?: string }> {
    const token = this.getAdminToken() || this.getSessionToken();
    if (!token) return { valid: false, error: 'No session token found.' };
    try {
      const { ok, status, data } = await this.safeFetch<{ valid: boolean; isAdmin?: boolean }>(
        '/api/auth/me',
        {
          headers: this.getAuthHeaders(),
        }
      );
      if (ok && data) {
        return { valid: true, isAdmin: Boolean(data.isAdmin) };
      }
      if (status === 401) {
        this.setAdminToken(null);
        this.setSessionToken(null);
      }
      return { valid: false, error: 'Session expired or invalid.' };
    } catch {
      return { valid: true }; // offline fallback
    }
  }

  // --- Audit Logging ---
  public logAudit(action: string, performedBy: string, details: string) {
    const logs = this.get<Array<{ timestamp: string; action: string; performedBy: string; details: string }>>(
      STORAGE_KEYS.AUDIT_LOG,
      []
    );
    logs.unshift({
      timestamp: new Date().toISOString(),
      action,
      performedBy,
      details,
    });
    this.set(STORAGE_KEYS.AUDIT_LOG, logs.slice(0, 100));
  }

  public getAuditLogs() {
    return this.get<Array<{ timestamp: string; action: string; performedBy: string; details: string }>>(
      STORAGE_KEYS.AUDIT_LOG,
      []
    );
  }

  // --- Image Upload API (Priority 6) ---
  public async uploadImageAsync(dataUrl: string, prefix = 'img'): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { ok, data, error } = await this.safeFetch<{ success: boolean; url?: string; error?: string }>(
        '/api/upload-image',
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ dataUrl, filenamePrefix: prefix }),
        }
      );
      if (ok && data?.success && data?.url) {
        return { success: true, url: data.url };
      }
      return { success: false, error: error || data?.error || 'Failed to upload image.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during image upload.' };
    }
  }

  // --- Members Synchronization & Storage ---
  public async fetchMembers(isAdmin = false): Promise<Member[]> {
    try {
      const headers = this.getAuthHeaders(isAdmin);
      const { ok, data } = await this.safeFetch<{ success: boolean; members: Member[] }>(
        `/api/members${isAdmin ? '?scope=all' : ''}`,
        { headers }
      );
      if (ok && data?.success && Array.isArray(data.members)) {
        if (isAdmin) {
          this.set(STORAGE_KEYS.MEMBERS, data.members);
          return data.members;
        } else {
          const currentMembers = this.getMembers();
          const activeId = this.getActiveUserId();
          const memberMap = new Map<string, Member>();

          for (const m of currentMembers) {
            if (m.status === 'pending' || m.id === activeId) {
              memberMap.set(m.id, m);
            }
          }
          for (const m of data.members) {
            memberMap.set(m.id, m);
          }

          const merged = Array.from(memberMap.values());
          this.set(STORAGE_KEYS.MEMBERS, merged);
          return merged;
        }
      }
    } catch (err) {
      console.warn('Could not fetch members from server database:', err);
    }
    return this.getMembers();
  }

  public async fetchMemberById(id: string): Promise<Member | undefined> {
    try {
      const cleanId = encodeURIComponent(id.trim());
      const { ok, data } = await this.safeFetch<{ success: boolean; member?: Member }>(
        `/api/members/${cleanId}`,
        {
          headers: this.getAuthHeaders(),
        }
      );
      if (ok && data?.success && data?.member) {
        const members = this.getMembers();
        const idx = members.findIndex(m => m.id === data.member!.id);
        if (idx !== -1) {
          members[idx] = data.member;
        } else {
          members.push(data.member);
        }
        this.set(STORAGE_KEYS.MEMBERS, members);
        return data.member;
      }
    } catch (err) {
      console.warn('Could not fetch member by ID from server:', err);
    }
    return this.getMemberById(id);
  }

  public async updateMemberAsync(
    id: string,
    updates: Partial<Member>
  ): Promise<{ success: boolean; member?: Member; error?: string }> {
    try {
      const cleanId = encodeURIComponent(id.trim());
      const { ok, data, error } = await this.safeFetch<{ success: boolean; member?: Member; error?: string }>(
        `/api/members/${cleanId}`,
        {
          method: 'PUT',
          headers: this.getAuthHeaders(true),
          body: JSON.stringify(updates),
        }
      );
      if (ok && data?.success && data?.member) {
        const members = this.getMembers();
        const idx = members.findIndex(m => m.id === id);
        if (idx !== -1) {
          members[idx] = data.member;
        } else {
          members.push(data.member);
        }
        this.set(STORAGE_KEYS.MEMBERS, members);
        return { success: true, member: data.member };
      }
      return { success: false, error: error || data?.error || 'Failed to update member.' };
    } catch {
      const members = this.getMembers();
      const idx = members.findIndex(m => m.id === id);
      if (idx !== -1) {
        members[idx] = { ...members[idx], ...updates };
        this.set(STORAGE_KEYS.MEMBERS, members);
        return { success: true, member: members[idx] };
      }
      return { success: false, error: 'Member not found.' };
    }
  }

  public async deleteMemberAsync(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanId = encodeURIComponent(id.trim());
      const { ok, data, error } = await this.safeFetch<{ success: boolean; error?: string; message?: string }>(
        `/api/members/${cleanId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(true),
        }
      );
      if (ok && data?.success) {
        const members = this.getMembers().filter(m => m.id !== id);
        this.set(STORAGE_KEYS.MEMBERS, members);
        return { success: true };
      }
      return { success: false, error: error || data?.error || 'Failed to delete member.' };
    } catch (err: any) {
      return {
        success: false,
        error:
          err?.message && !err.message.includes('JSON') && !err.message.includes('<')
            ? err.message
            : 'Unable to connect to the server to delete member. Please retry in a few seconds.',
      };
    }
  }

  public getMembers(): Member[] {
    return this.get<Member[]>(STORAGE_KEYS.MEMBERS, [ROOT_ADMIN]);
  }

  public getMemberById(id: string): Member | undefined {
    return this.getMembers().find(m => m.id === id);
  }

  public getDirectoryMembers(): Member[] {
    return this.getMembers().filter(m => m.status === 'approved' && m.consentDirectoryDisplay === true);
  }

  public getPendingMembers(): Member[] {
    return this.getMembers().filter(m => m.status === 'pending');
  }

  public async registerMemberAsync(
    data: Omit<Member, 'id' | 'role' | 'status' | 'joinedAt'> & {
      phone?: string;
      username?: string;
      password?: string;
    }
  ): Promise<{ success: boolean; member?: Member; error?: string }> {
    try {
      const { ok, data: result, error } = await this.safeFetch<{
        success: boolean;
        member?: Member;
        sessionToken?: string;
        error?: string;
      }>('/api/members/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (ok && result?.success && result?.member) {
        if (result.sessionToken) {
          this.setSessionToken(result.sessionToken);
        }
        const members = this.getMembers();
        const existingIdx = members.findIndex(m => m.id === result.member!.id);
        if (existingIdx !== -1) {
          members[existingIdx] = result.member;
        } else {
          members.push(result.member);
        }
        this.set(STORAGE_KEYS.MEMBERS, members);
        this.setActiveUserId(result.member.id);
        this.logAudit(
          'MEMBER_REGISTER',
          result.member.professionalEmail,
          `Registered member: ${result.member.fullName} (${result.member.jobTitle}) with status Pending`
        );
        return { success: true, member: result.member };
      }
      return { success: false, error: error || result?.error || 'Registration failed.' };
    } catch (err: any) {
      console.warn('Server registration error, using local fallback:', err);
      return this.registerMember(data);
    }
  }

  public registerMember(
    data: Omit<Member, 'id' | 'role' | 'status' | 'joinedAt'> & {
      phone?: string;
      username?: string;
      password?: string;
    }
  ): { success: boolean; member?: Member; error?: string } {
    const members = this.getMembers();

    const existsEmail = members.some(
      m => m.professionalEmail.toLowerCase() === data.professionalEmail.toLowerCase()
    );
    if (existsEmail) {
      return {
        success: false,
        error: 'An account with this email already exists. Please sign in.',
      };
    }

    if (data.username && data.username.trim()) {
      const cleanUser = data.username.trim().toLowerCase();
      const existsUser = members.some(m => m.username && m.username.toLowerCase() === cleanUser);
      if (existsUser || cleanUser === 'admin') {
        return {
          success: false,
          error: 'This username is already taken. Please choose another.',
        };
      }
    }

    const nameCheck = inspectHealthcareContent(data.fullName);
    if (!nameCheck.isSafe) return { success: false, error: nameCheck.reason };

    const newId = 'mem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const assignedUsername = data.username?.trim().toLowerCase() || data.professionalEmail.split('@')[0].toLowerCase();

    const newMember: Member = {
      id: newId,
      fullName: data.fullName.trim(),
      professionalEmail: data.professionalEmail.trim().toLowerCase(),
      username: assignedUsername,
      jobTitle: data.jobTitle.trim(),
      organization: data.organization.trim(),
      specialty: data.specialty.trim(),
      bio: data.bio?.trim() || '',
      profilePhotoUrl:
        data.profilePhotoUrl ||
        'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      linkedinUrl: data.linkedinUrl?.trim() || '',
      role: 'pending_member',
      status: 'pending',
      joinedAt: new Date().toISOString(),
      approvalEmailSent: false,
      consentDirectoryDisplay: data.consentDirectoryDisplay !== undefined ? Boolean(data.consentDirectoryDisplay) : true,
      consentPhotoPublish: data.consentPhotoPublish !== undefined ? Boolean(data.consentPhotoPublish) : true,
      consentFutureCommunications: data.consentFutureCommunications !== undefined ? Boolean(data.consentFutureCommunications) : true,
    };

    members.push(newMember);
    this.set(STORAGE_KEYS.MEMBERS, members);
    this.setActiveUserId(newId);
    this.logAudit('MEMBER_REGISTER', newMember.professionalEmail, `Registered member: ${newMember.fullName}`);

    return { success: true, member: newMember };
  }

  // --- Authentication ---
  public async loginWithCredentialsAsync(
    usernameOrEmail: string,
    passwordInput: string
  ): Promise<{ success: boolean; member?: Member; error?: string; role?: UserRole; isPending?: boolean }> {
    try {
      const { ok, data, error } = await this.safeFetch<{
        success: boolean;
        member?: Member;
        adminToken?: string;
        sessionToken?: string;
        role?: UserRole;
        isPending?: boolean;
        error?: string;
      }>('/api/members/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password: passwordInput }),
      });
      if (ok && data?.success && data?.member) {
        this.setActiveUserId(data.member.id);
        if (data.adminToken) {
          this.setAdminToken(data.adminToken);
        }
        if (data.sessionToken) {
          this.setSessionToken(data.sessionToken);
        }

        const members = this.getMembers();
        const existingIdx = members.findIndex(m => m.id === data.member!.id);
        if (existingIdx !== -1) {
          members[existingIdx] = data.member;
        } else {
          members.push(data.member);
        }
        this.set(STORAGE_KEYS.MEMBERS, members);
        return {
          success: true,
          member: data.member,
          role: data.role,
          isPending: data.isPending,
        };
      }
      return { success: false, error: error || data?.error || 'Authentication failed.' };
    } catch {
      return this.loginWithCredentials(usernameOrEmail, passwordInput);
    }
  }

  public loginWithCredentials(
    usernameOrEmail: string,
    passwordInput: string
  ): { success: boolean; member?: Member; error?: string; role?: UserRole; isPending?: boolean } {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanInput || !cleanPass) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    const members = this.getMembers();
    const matchedMember = members.find(
      m =>
        m.professionalEmail.toLowerCase() === cleanInput ||
        (m.username && m.username.toLowerCase() === cleanInput)
    );

    if (!matchedMember) {
      return {
        success: false,
        error: 'No account found with this username or email. Please register first.',
      };
    }

    this.setActiveUserId(matchedMember.id);
    return {
      success: true,
      member: matchedMember,
      role: matchedMember.role,
      isPending: matchedMember.status === 'pending',
    };
  }

  // --- Member Approval & Status Management ---
  public async updateMemberStatusAsync(
    memberId: string,
    newStatus: 'approved' | 'rejected' | 'pending' | 'suspended',
    adminId: string
  ): Promise<{ success: boolean; member?: Member; message?: string; error?: string }> {
    try {
      const cleanId = encodeURIComponent(memberId.trim());
      const { ok, data, error } = await this.safeFetch<{
        success: boolean;
        member?: Member;
        message?: string;
        error?: string;
      }>(`/api/members/${cleanId}/status`, {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({ status: newStatus, adminId }),
      });
      if (ok && data?.success && data?.member) {
        const members = this.getMembers();
        const idx = members.findIndex(m => m.id === memberId);
        if (idx !== -1) {
          members[idx] = data.member;
          this.set(STORAGE_KEYS.MEMBERS, members);
        }
        return { success: true, member: data.member, message: data.message };
      }
      return { success: false, error: error || data?.error || 'Failed to update member status.' };
    } catch {
      const local = this.updateMemberStatus(memberId, newStatus as any, adminId);
      return { success: local.success };
    }
  }

  public updateMemberStatus(
    memberId: string,
    newStatus: 'approved' | 'rejected' | 'suspended',
    adminId: string
  ): { success: boolean; emailSent?: boolean } {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx === -1) return { success: false };

    const member = members[idx];
    member.status = newStatus;

    if (newStatus === 'approved') {
      member.role = 'approved_member';
      member.approvedAt = new Date().toISOString();
      member.reviewedBy = adminId;
      member.approvalEmailSent = false;
    } else if (newStatus === 'rejected') {
      member.role = 'visitor';
      member.reviewedBy = adminId;
    }

    members[idx] = member;
    this.set(STORAGE_KEYS.MEMBERS, members);
    this.logAudit(
      'MEMBER_STATUS_CHANGE',
      adminId,
      `Updated ${member.fullName} status to ${newStatus}. In-app confirmation only.`
    );

    return { success: true, emailSent: false };
  }

  public updateMemberConsents(
    memberId: string,
    consents: { consentDirectoryDisplay?: boolean; consentPhotoPublish?: boolean; consentFutureCommunications?: boolean }
  ): boolean {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === memberId);
    if (idx === -1) return false;

    const member = members[idx];
    if (consents.consentDirectoryDisplay !== undefined) member.consentDirectoryDisplay = consents.consentDirectoryDisplay;
    if (consents.consentPhotoPublish !== undefined) member.consentPhotoPublish = consents.consentPhotoPublish;
    if (consents.consentFutureCommunications !== undefined) member.consentFutureCommunications = consents.consentFutureCommunications;

    members[idx] = member;
    this.set(STORAGE_KEYS.MEMBERS, members);
    this.logAudit('CONSENT_UPDATED', memberId, 'Member updated privacy and consent preferences.');
    return true;
  }

  // --- Rounds CRUD Management (Priority 4 & 5) ---
  public async fetchRoundsAsync(): Promise<Round[]> {
    try {
      const { ok, data } = await this.safeFetch<{ success: boolean; rounds?: Round[] }>('/api/rounds');
      if (ok && data?.success && Array.isArray(data.rounds)) {
        this.set(STORAGE_KEYS.ROUNDS, data.rounds);
        return data.rounds;
      }
    } catch (err) {
      console.warn('Could not fetch rounds from server:', err);
    }
    return this.getRounds();
  }

  public getRounds(): Round[] {
    const rounds = this.get<Round[]>(STORAGE_KEYS.ROUNDS, []);
    if (!rounds || rounds.length === 0) {
      this.set(STORAGE_KEYS.ROUNDS, [DEFAULT_INAUGURAL_ROUND]);
      return [DEFAULT_INAUGURAL_ROUND];
    }
    return rounds;
  }

  public getRoundById(id: string): Round | undefined {
    return this.getRounds().find(r => r.id === id);
  }

  public async saveRoundAsync(
    roundData: Omit<Round, 'id' | 'currentRegistrationsCount' | 'createdAt'> & { id?: string },
    adminId: string
  ): Promise<Round> {
    try {
      const isEdit = Boolean(roundData.id);
      const url = isEdit ? `/api/rounds/${roundData.id}` : '/api/rounds';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(roundData),
      });

      const data = await res.json();
      if (res.ok && data.success && data.round) {
        const rounds = this.getRounds();
        if (isEdit) {
          const idx = rounds.findIndex(r => r.id === roundData.id);
          if (idx !== -1) {
            rounds[idx] = data.round;
          } else {
            rounds.unshift(data.round);
          }
        } else {
          rounds.unshift(data.round);
        }
        this.set(STORAGE_KEYS.ROUNDS, rounds);
        return data.round;
      }
    } catch (err) {
      console.warn('Server save round error, using local fallback:', err);
    }
    return this.saveRound(roundData, adminId);
  }

  public saveRound(
    roundData: Omit<Round, 'id' | 'currentRegistrationsCount' | 'createdAt'> & { id?: string },
    adminId: string
  ): Round {
    const rounds = this.getRounds();
    if (roundData.id) {
      const idx = rounds.findIndex(r => r.id === roundData.id);
      if (idx !== -1) {
        const existing = rounds[idx];
        const updated: Round = {
          ...existing,
          ...roundData,
          id: existing.id,
          currentRegistrationsCount: existing.currentRegistrationsCount,
          updatedAt: new Date().toISOString(),
        };
        rounds[idx] = updated;
        this.set(STORAGE_KEYS.ROUNDS, rounds);
        this.logAudit('ROUND_UPDATE', adminId, `Updated round: ${updated.title}`);
        return updated;
      }
    }

    const newRound: Round = {
      ...roundData,
      id: 'round_' + Date.now().toString(36),
      currentRegistrationsCount: 0,
      createdAt: new Date().toISOString(),
    };
    rounds.unshift(newRound);
    this.set(STORAGE_KEYS.ROUNDS, rounds);
    this.logAudit('ROUND_CREATE', adminId, `Created new round: ${newRound.title}`);
    return newRound;
  }

  public async deleteRoundAsync(roundId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanId = encodeURIComponent(roundId.trim());
      const { ok, data, error } = await this.safeFetch<{ success: boolean; error?: string }>(
        `/api/rounds/${cleanId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(true),
        }
      );
      if (ok && data?.success) {
        const rounds = this.getRounds().filter(r => r.id !== roundId);
        this.set(STORAGE_KEYS.ROUNDS, rounds);
        this.logAudit('ROUND_DELETE', 'admin', `Permanently deleted round ID: ${roundId}`);
        return { success: true };
      }
      return { success: false, error: error || data?.error || 'Failed to delete round on server.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error while deleting round.' };
    }
  }

  public deleteRound(roundId: string): boolean {
    const rounds = this.getRounds();
    const filtered = rounds.filter(r => r.id !== roundId);
    if (filtered.length !== rounds.length) {
      this.set(STORAGE_KEYS.ROUNDS, filtered);
      this.logAudit('ROUND_DELETE', 'admin', `Deleted round ID: ${roundId}`);
      return true;
    }
    return false;
  }

  // --- Registrations (RSVPs) ---
  public getRegistrations(roundId?: string): Registration[] {
    const regs = this.get<Registration[]>(STORAGE_KEYS.REGISTRATIONS, []);
    return roundId ? regs.filter(r => r.roundId === roundId) : regs;
  }

  public isRegistered(roundId: string, memberId: string): boolean {
    return this.getRegistrations(roundId).some(r => r.memberId === memberId && r.status === 'registered');
  }

  public rsvpRound(roundId: string, member: Member, notes?: string): { success: boolean; error?: string } {
    if (member.status !== 'approved') {
      return { success: false, error: 'Only approved executive members can RSVP for Healthcare Leadership Rounds.' };
    }

    const round = this.getRoundById(roundId);
    if (!round) return { success: false, error: 'Round not found.' };

    const regs = this.getRegistrations();
    const existing = regs.find(r => r.roundId === roundId && r.memberId === member.id);
    if (existing) {
      if (existing.status === 'registered') {
        return { success: false, error: 'You are already registered for this leadership round.' };
      }
      existing.status = 'registered';
      existing.registeredAt = new Date().toISOString();
      this.set(STORAGE_KEYS.REGISTRATIONS, regs);
      this.incrementRoundRegistrations(roundId, 1);
      return { success: true };
    }

    if (round.maxCapacity && round.currentRegistrationsCount >= round.maxCapacity) {
      const waitlistReg: Registration = {
        id: 'reg_' + Date.now().toString(36),
        roundId,
        memberId: member.id,
        memberName: member.fullName,
        memberTitle: member.jobTitle,
        memberOrg: member.organization,
        memberEmail: member.professionalEmail,
        status: 'waitlisted',
        registeredAt: new Date().toISOString(),
        notes,
      };
      regs.push(waitlistReg);
      this.set(STORAGE_KEYS.REGISTRATIONS, regs);
      return { success: true, error: 'Round capacity reached. You have been placed on priority waitlist.' };
    }

    const newReg: Registration = {
      id: 'reg_' + Date.now().toString(36),
      roundId,
      memberId: member.id,
      memberName: member.fullName,
      memberTitle: member.jobTitle,
      memberOrg: member.organization,
      memberEmail: member.professionalEmail,
      status: 'registered',
      registeredAt: new Date().toISOString(),
      notes,
    };

    regs.push(newReg);
    this.set(STORAGE_KEYS.REGISTRATIONS, regs);
    this.incrementRoundRegistrations(roundId, 1);
    this.logAudit('ROUND_RSVP', member.id, `Registered for round ${roundId}`);
    return { success: true };
  }

  public cancelRsvp(roundId: string, memberId: string): boolean {
    const regs = this.getRegistrations();
    const reg = regs.find(r => r.roundId === roundId && r.memberId === memberId && r.status === 'registered');
    if (!reg) return false;

    reg.status = 'cancelled';
    this.set(STORAGE_KEYS.REGISTRATIONS, regs);
    this.incrementRoundRegistrations(roundId, -1);
    this.logAudit('ROUND_RSVP_CANCEL', memberId, `Cancelled RSVP for round ${roundId}`);
    return true;
  }

  private incrementRoundRegistrations(roundId: string, delta: number) {
    const rounds = this.getRounds();
    const round = rounds.find(r => r.id === roundId);
    if (round) {
      round.currentRegistrationsCount = Math.max(0, round.currentRegistrationsCount + delta);
      this.set(STORAGE_KEYS.ROUNDS, rounds);
    }
  }

  // --- Attendance & Attendees Gallery ---
  public getAttendance(roundId?: string): Attendance[] {
    const atts = this.get<Attendance[]>(STORAGE_KEYS.ATTENDANCE, []);
    return roundId ? atts.filter(a => a.roundId === roundId) : atts;
  }

  public getRoundGalleryAttendees(roundId: string): Attendance[] {
    const atts = this.getAttendance(roundId);
    return atts.filter(a => a.attended === true && a.consentPhotoPublish === true);
  }

  public verifyAttendance(
    roundId: string,
    member: Member,
    attended: boolean,
    adminId: string,
    cmeCredits = 5
  ): Attendance {
    const atts = this.getAttendance();
    const existingIdx = atts.findIndex(a => a.roundId === roundId && a.memberId === member.id);

    const record: Attendance = {
      id: existingIdx !== -1 ? atts[existingIdx].id : 'att_' + Date.now().toString(36),
      roundId,
      memberId: member.id,
      memberName: member.fullName,
      memberTitle: member.jobTitle,
      memberOrg: member.organization,
      memberPhotoUrl: member.profilePhotoUrl,
      attended,
      consentPhotoPublish: Boolean(member.consentPhotoPublish),
      verifiedAt: new Date().toISOString(),
      verifiedByAdminId: adminId,
      cmeCreditsEarned: attended ? cmeCredits : 0,
    };

    if (existingIdx !== -1) {
      atts[existingIdx] = record;
    } else {
      atts.push(record);
    }

    this.set(STORAGE_KEYS.ATTENDANCE, atts);
    this.logAudit('ATTENDANCE_VERIFY', adminId, `Verified attendance for ${member.fullName}`);
    return record;
  }

  // --- Leadership Insights & Discussions (Topics) ---
  public async fetchTopicsAsync(isAdmin = false, currentUserId?: string): Promise<Topic[]> {
    try {
      const headers = this.getAuthHeaders(isAdmin);
      const { ok, data } = await this.safeFetch<{ success: boolean; topics?: Topic[] }>(
        `/api/topics${isAdmin ? '?scope=all' : ''}`,
        { headers }
      );
      if (ok && data?.success && Array.isArray(data.topics)) {
        this.set(STORAGE_KEYS.TOPICS, data.topics);
        return data.topics;
      }
    } catch (err) {
      console.warn('Could not fetch topics from server:', err);
    }
    return this.getTopics(isAdmin, currentUserId);
  }

  public getTopics(includeUnapproved = false, currentUserId?: string): Topic[] {
    const topics = this.get<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
    if (includeUnapproved) return topics;
    return topics.filter(t => {
      if (t.status === 'approved' || t.status === 'pinned') return true;
      if (currentUserId && t.authorId === currentUserId) return true;
      return false;
    });
  }

  public getTopicById(id: string): Topic | undefined {
    return this.get<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS).find(t => t.id === id);
  }

  public async submitTopicAsync(
    author: Member,
    title: string,
    category: Topic['category'],
    body: string,
    tags?: string[]
  ): Promise<{ success: boolean; topic?: Topic; error?: string }> {
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: this.getAuthHeaders(author.role === 'administrator'),
        body: JSON.stringify({ title, category, body, tags }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.topic) {
        const topics = this.getTopics(true);
        topics.unshift(data.topic);
        this.set(STORAGE_KEYS.TOPICS, topics);
        return { success: true, topic: data.topic };
      }
      return { success: false, error: data.error || 'Failed to submit topic.' };
    } catch {
      return this.submitTopic(author, title, category, body, tags);
    }
  }

  public submitTopic(
    author: Member,
    title: string,
    category: Topic['category'],
    body: string,
    tags?: string[]
  ): { success: boolean; topic?: Topic; error?: string } {
    if (author.status !== 'approved') {
      return { success: false, error: 'Only approved healthcare executive members can publish leadership insights.' };
    }

    const check = inspectHealthcareContent(title + ' ' + body);
    if (!check.isSafe) {
      return { success: false, error: check.reason };
    }

    const topics = this.get<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
    const newTopic: Topic = {
      id: 'top_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      category,
      body: body.trim(),
      authorId: author.id,
      authorName: author.fullName,
      authorTitle: author.jobTitle,
      authorOrg: author.organization,
      authorPhotoUrl: author.consentPhotoPublish ? author.profilePhotoUrl : undefined,
      status: author.role === 'administrator' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      publishedAt: author.role === 'administrator' ? new Date().toISOString() : undefined,
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
      tags: tags || [],
    };

    topics.unshift(newTopic);
    this.set(STORAGE_KEYS.TOPICS, topics);
    this.logAudit('TOPIC_SUBMIT', author.id, `Submitted topic: "${title}" (Status: ${newTopic.status})`);

    return { success: true, topic: newTopic };
  }

  public async updateTopicAsync(
    topicId: string,
    updates: Partial<Topic>
  ): Promise<{ success: boolean; topic?: Topic; error?: string }> {
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (res.ok && data.success && data.topic) {
        const topics = this.getTopics(true);
        const idx = topics.findIndex(t => t.id === topicId);
        if (idx !== -1) {
          topics[idx] = data.topic;
          this.set(STORAGE_KEYS.TOPICS, topics);
        }
        return { success: true, topic: data.topic };
      }
      return { success: false, error: data.error || 'Failed to update topic.' };
    } catch {
      const topics = this.getTopics(true);
      const idx = topics.findIndex(t => t.id === topicId);
      if (idx !== -1) {
        topics[idx] = { ...topics[idx], ...updates };
        this.set(STORAGE_KEYS.TOPICS, topics);
        return { success: true, topic: topics[idx] };
      }
      return { success: false, error: 'Topic not found.' };
    }
  }

  public async moderateTopicAsync(
    topicId: string,
    newStatus: Topic['status'],
    adminId: string
  ): Promise<{ success: boolean; topic?: Topic; error?: string }> {
    const res = await this.updateTopicAsync(topicId, { status: newStatus });
    if (res.success) {
      this.logAudit('TOPIC_MODERATE', adminId, `Moderated topic ${topicId} to status: ${newStatus}`);
      return { success: true, topic: res.topic };
    }
    const ok = this.moderateTopic(topicId, newStatus, adminId);
    return { success: ok };
  }

  public moderateTopic(topicId: string, newStatus: Topic['status'], adminId: string): boolean {
    const topics = this.get<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return false;

    topic.status = newStatus;
    if (newStatus === 'approved' && !topic.publishedAt) {
      topic.publishedAt = new Date().toISOString();
    }
    this.set(STORAGE_KEYS.TOPICS, topics);
    this.logAudit('TOPIC_MODERATE', adminId, `Moderated topic ${topicId} to status: ${newStatus}`);
    return true;
  }

  public async deleteTopicAsync(topicId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanId = encodeURIComponent(topicId.trim());
      const { ok, data, error } = await this.safeFetch<{ success: boolean; error?: string }>(
        `/api/topics/${cleanId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(true),
        }
      );
      if (ok && data?.success) {
        const topics = this.getTopics(true).filter(t => t.id !== topicId);
        this.set(STORAGE_KEYS.TOPICS, topics);
        const comments = this.getAllComments().filter(c => c.topicId !== topicId);
        this.set(STORAGE_KEYS.COMMENTS, comments);
        this.logAudit('TOPIC_DELETE', 'admin', `Permanently deleted topic ID: ${topicId}`);
        return { success: true };
      }
      return { success: false, error: error || data?.error || 'Failed to delete topic on server.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error while deleting topic.' };
    }
  }

  // --- Reactions ---
  public getReactions(topicId: string): TopicReaction[] {
    const reactions = this.get<TopicReaction[]>(STORAGE_KEYS.REACTIONS, []);
    return reactions.filter(r => r.topicId === topicId);
  }

  public getUserReaction(topicId: string, memberId: string): 'like' | 'dislike' | undefined {
    const r = this.getReactions(topicId).find(rx => rx.memberId === memberId);
    return r ? r.type : undefined;
  }

  public toggleReaction(topicId: string, member: Member, type: 'like' | 'dislike'): void {
    if (member.status !== 'approved') return;

    const reactions = this.get<TopicReaction[]>(STORAGE_KEYS.REACTIONS, []);
    const topics = this.get<Topic[]>(STORAGE_KEYS.TOPICS, DEFAULT_TOPICS);
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;

    const existingIdx = reactions.findIndex(r => r.topicId === topicId && r.memberId === member.id);

    if (existingIdx !== -1) {
      const existing = reactions[existingIdx];
      if (existing.type === type) {
        reactions.splice(existingIdx, 1);
        if (type === 'like') topic.likeCount = Math.max(0, topic.likeCount - 1);
        else topic.dislikeCount = Math.max(0, topic.dislikeCount - 1);
      } else {
        existing.type = type;
        existing.updatedAt = new Date().toISOString();
        if (type === 'like') {
          topic.likeCount++;
          topic.dislikeCount = Math.max(0, topic.dislikeCount - 1);
        } else {
          topic.dislikeCount++;
          topic.likeCount = Math.max(0, topic.likeCount - 1);
        }
      }
    } else {
      reactions.push({
        id: 'rx_' + Date.now().toString(36),
        topicId,
        memberId: member.id,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      if (type === 'like') topic.likeCount++;
      else topic.dislikeCount++;
    }

    this.set(STORAGE_KEYS.REACTIONS, reactions);
    this.set(STORAGE_KEYS.TOPICS, topics);
  }

  // --- Comments & Reflections ---
  public async fetchCommentsAsync(topicId?: string, isAdmin = false, currentUserId?: string): Promise<Comment[]> {
    try {
      const headers = this.getAuthHeaders(isAdmin);
      const url = topicId ? `/api/comments?topicId=${topicId}` : '/api/comments';
      const { ok, data } = await this.safeFetch<{ success: boolean; comments?: Comment[] }>(url, { headers });
      if (ok && data?.success && Array.isArray(data.comments)) {
        if (!topicId && isAdmin) {
          this.set(STORAGE_KEYS.COMMENTS, data.comments);
        }
        return data.comments;
      }
    } catch (err) {
      console.warn('Could not fetch comments from server:', err);
    }
    return this.getComments(topicId || '', isAdmin, currentUserId);
  }

  public getAllComments(): Comment[] {
    return this.get<Comment[]>(STORAGE_KEYS.COMMENTS, DEFAULT_COMMENTS);
  }

  public getComments(topicId = '', isAdmin = false, currentUserId?: string): Comment[] {
    const comments = this.get<Comment[]>(STORAGE_KEYS.COMMENTS, DEFAULT_COMMENTS);
    if (!topicId) return isAdmin ? comments : comments.filter(c => c.status === 'approved' || (currentUserId && c.authorId === currentUserId));

    return comments.filter(c => {
      if (c.topicId !== topicId) return false;
      if (isAdmin) return true;
      if (c.status === 'approved') return true;
      if (currentUserId && c.authorId === currentUserId) return true;
      return false;
    });
  }

  public async addCommentAsync(
    topicId: string,
    author: Member,
    content: string
  ): Promise<{ success: boolean; comment?: Comment; error?: string }> {
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: this.getAuthHeaders(author.role === 'administrator'),
        body: JSON.stringify({ topicId, content }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.comment) {
        const comments = this.getAllComments();
        comments.push(data.comment);
        this.set(STORAGE_KEYS.COMMENTS, comments);
        return { success: true, comment: data.comment };
      }
      return { success: false, error: data.error || 'Failed to submit comment.' };
    } catch {
      return this.addComment(topicId, author, content);
    }
  }

  public addComment(
    topicId: string,
    author: Member,
    content: string
  ): { success: boolean; comment?: Comment; error?: string } {
    if (author.status !== 'approved') {
      return { success: false, error: 'Only approved executive members can comment.' };
    }

    const check = inspectHealthcareContent(content);
    if (!check.isSafe) {
      return { success: false, error: check.reason };
    }

    const topic = this.getTopicById(topicId);
    const comments = this.getAllComments();
    const newComment: Comment = {
      id: 'cmt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      topicId,
      topicTitle: topic?.title || 'Healthcare Topic',
      authorId: author.id,
      authorName: author.fullName,
      authorTitle: author.jobTitle,
      authorOrg: author.organization,
      authorPhotoUrl: author.consentPhotoPublish ? author.profilePhotoUrl : undefined,
      content: content.trim(),
      status: author.role === 'administrator' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    };

    comments.push(newComment);
    this.set(STORAGE_KEYS.COMMENTS, comments);

    if (newComment.status === 'approved') {
      const topics = this.getTopics(true);
      const top = topics.find(t => t.id === topicId);
      if (top) {
        top.commentCount = (top.commentCount || 0) + 1;
        this.set(STORAGE_KEYS.TOPICS, topics);
      }
    }

    this.logAudit('COMMENT_SUBMIT', author.id, `Submitted reflection on topic ${topicId} (Status: ${newComment.status})`);
    return { success: true, comment: newComment };
  }

  public async moderateCommentAsync(
    commentId: string,
    newStatus: 'pending' | 'approved' | 'rejected' | 'hidden',
    adminId: string
  ): Promise<{ success: boolean; comment?: Comment; error?: string }> {
    try {
      const res = await fetch(`/api/comments/${commentId}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders(true),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.comment) {
        const comments = this.getAllComments();
        const idx = comments.findIndex(c => c.id === commentId);
        if (idx !== -1) {
          comments[idx] = data.comment;
          this.set(STORAGE_KEYS.COMMENTS, comments);
        }
        this.logAudit('COMMENT_MODERATE', adminId, `Moderated comment ${commentId} to ${newStatus}`);
        return { success: true, comment: data.comment };
      }
      return { success: false, error: data.error || 'Failed to moderate comment.' };
    } catch {
      const comments = this.getAllComments();
      const idx = comments.findIndex(c => c.id === commentId);
      if (idx !== -1) {
        comments[idx].status = newStatus;
        this.set(STORAGE_KEYS.COMMENTS, comments);
        this.logAudit('COMMENT_MODERATE', adminId, `Moderated comment ${commentId} to ${newStatus}`);
        return { success: true, comment: comments[idx] };
      }
      return { success: false, error: 'Comment not found.' };
    }
  }

  public async deleteCommentAsync(commentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanId = encodeURIComponent(commentId.trim());
      const { ok, data, error } = await this.safeFetch<{ success: boolean; error?: string }>(
        `/api/comments/${cleanId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(true),
        }
      );
      if (ok && data?.success) {
        const comments = this.getAllComments().filter(c => c.id !== commentId);
        this.set(STORAGE_KEYS.COMMENTS, comments);
        this.logAudit('COMMENT_DELETE', 'admin', `Permanently deleted comment ID: ${commentId}`);
        return { success: true };
      }
      return { success: false, error: error || data?.error || 'Failed to delete comment on server.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error while deleting comment.' };
    }
  }

  // --- Active Simulator User Management ---
  public getActiveUserId(): string {
    return this.get<string>(STORAGE_KEYS.ACTIVE_USER_ID, 'visitor');
  }

  public setActiveUserId(userId: string): void {
    this.set(STORAGE_KEYS.ACTIVE_USER_ID, userId);
  }

  // --- Accreditations & Strategic Partners Library (Priority 4 & 6) ---
  public async fetchPartnersAsync(): Promise<PartnerAccreditation[]> {
    try {
      const { ok, data } = await this.safeFetch<{ success: boolean; partners?: PartnerAccreditation[] }>(
        '/api/partners',
        { headers: this.getAuthHeaders() }
      );
      if (ok && data?.success && Array.isArray(data.partners)) {
        this.set(STORAGE_KEYS.PARTNERS, data.partners);
        return data.partners;
      }
    } catch (err) {
      console.warn('Could not fetch partners from server:', err);
    }
    return this.getPartners();
  }

  public getPartners(): PartnerAccreditation[] {
    const list = this.get<PartnerAccreditation[]>(STORAGE_KEYS.PARTNERS, DEFAULT_PARTNERS);
    return [...list].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  public getVerifiedActivePartners(): PartnerAccreditation[] {
    return this.getPartners().filter(p => p.isActive && p.verificationStatus === 'verified');
  }

  public async savePartnerAsync(
    partner: Partial<PartnerAccreditation> & { organizationName: string }
  ): Promise<PartnerAccreditation> {
    try {
      const isEdit = Boolean(partner.id);
      const url = isEdit ? `/api/partners/${partner.id}` : '/api/partners';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(partner),
      });

      const data = await res.json();
      if (res.ok && data.success && data.partner) {
        const list = this.getPartners();
        if (isEdit) {
          const idx = list.findIndex(p => p.id === partner.id);
          if (idx !== -1) list[idx] = data.partner;
          else list.push(data.partner);
        } else {
          list.push(data.partner);
        }
        this.set(STORAGE_KEYS.PARTNERS, list);
        return data.partner;
      }
    } catch (err) {
      console.warn('Server save partner error, using local fallback:', err);
    }
    return this.savePartner(partner);
  }

  public savePartner(partner: Partial<PartnerAccreditation> & { organizationName: string }): PartnerAccreditation {
    const list = this.getPartners();
    if (partner.id) {
      const idx = list.findIndex(p => p.id === partner.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...partner };
        this.set(STORAGE_KEYS.PARTNERS, list);
        this.logAudit('PARTNER_UPDATE', 'admin', `Updated partner accreditation: ${partner.organizationName}`);
        return list[idx];
      }
    }

    const newPartner: PartnerAccreditation = {
      id: partner.id || 'partner_' + Date.now().toString(36),
      organizationName: partner.organizationName.trim(),
      logoUrl: partner.logoUrl || '/assets/aistudio/logo_hospital_egypt_copy-05_43a268db.png',
      relationshipType: partner.relationshipType || 'Hospital Network Accreditation',
      description: partner.description || '',
      verificationStatus: partner.verificationStatus || 'verified',
      displayOrder: partner.displayOrder !== undefined ? partner.displayOrder : list.length + 1,
      isActive: partner.isActive !== undefined ? partner.isActive : true,
      websiteUrl: partner.websiteUrl || '',
      verifiedAt: new Date().toISOString(),
      verifiedBy: 'Clinical Governance Board',
    };

    list.push(newPartner);
    this.set(STORAGE_KEYS.PARTNERS, list);
    this.logAudit('PARTNER_CREATE', 'admin', `Added partner accreditation: ${newPartner.organizationName}`);
    return newPartner;
  }

  public async deletePartnerAsync(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanId = encodeURIComponent(id.trim());
      const { ok, data, error } = await this.safeFetch<{ success: boolean; error?: string }>(
        `/api/partners/${cleanId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(true),
        }
      );
      if (ok && data?.success) {
        const list = this.getPartners().filter(p => p.id !== id);
        this.set(STORAGE_KEYS.PARTNERS, list);
        this.logAudit('PARTNER_DELETE', 'admin', `Permanently deleted partner accreditation ID: ${id}`);
        return { success: true };
      }
      return { success: false, error: error || data?.error || 'Failed to delete partner on server.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error while deleting partner.' };
    }
  }

  public deletePartner(id: string): boolean {
    const list = this.getPartners();
    const filtered = list.filter(p => p.id !== id);
    if (filtered.length !== list.length) {
      this.set(STORAGE_KEYS.PARTNERS, filtered);
      this.logAudit('PARTNER_DELETE', 'admin', `Deleted partner ID: ${id}`);
      return true;
    }
    return false;
  }

  public reorderPartners(orderedIds: string[]): boolean {
    const list = this.getPartners();
    const map = new Map(list.map(p => [p.id, p]));
    const reordered: PartnerAccreditation[] = [];
    orderedIds.forEach((id, index) => {
      const item = map.get(id);
      if (item) {
        item.displayOrder = index + 1;
        reordered.push(item);
        map.delete(id);
      }
    });
    map.forEach(item => {
      item.displayOrder = reordered.length + 1;
      reordered.push(item);
    });
    this.set(STORAGE_KEYS.PARTNERS, reordered);
    return true;
  }

  // --- Membership Benefits Library (Priority 4) ---
  public async fetchBenefitsAsync(): Promise<MembershipBenefit[]> {
    try {
      const { ok, data } = await this.safeFetch<{ success: boolean; benefits?: MembershipBenefit[] }>(
        '/api/benefits',
        { headers: this.getAuthHeaders() }
      );
      if (ok && data?.success && Array.isArray(data.benefits)) {
        this.set(STORAGE_KEYS.BENEFITS, data.benefits);
        return data.benefits;
      }
    } catch (err) {
      console.warn('Could not fetch benefits from server:', err);
    }
    return this.getBenefits();
  }

  public getBenefits(): MembershipBenefit[] {
    const list = this.get<MembershipBenefit[]>(STORAGE_KEYS.BENEFITS, DEFAULT_BENEFITS);
    return [...list].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  public getActiveBenefits(): MembershipBenefit[] {
    return this.getBenefits().filter(b => b.isActive);
  }

  public async saveBenefitAsync(benefit: Partial<MembershipBenefit> & { title: string }): Promise<MembershipBenefit> {
    try {
      const isEdit = Boolean(benefit.id);
      const url = isEdit ? `/api/benefits/${benefit.id}` : '/api/benefits';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: this.getAuthHeaders(true),
        body: JSON.stringify(benefit),
      });

      const data = await res.json();
      if (res.ok && data.success && data.benefit) {
        const list = this.getBenefits();
        if (isEdit) {
          const idx = list.findIndex(b => b.id === benefit.id);
          if (idx !== -1) list[idx] = data.benefit;
          else list.push(data.benefit);
        } else {
          list.push(data.benefit);
        }
        this.set(STORAGE_KEYS.BENEFITS, list);
        return data.benefit;
      }
    } catch (err) {
      console.warn('Server save benefit error, using local fallback:', err);
    }
    return this.saveBenefit(benefit);
  }

  public saveBenefit(benefit: Partial<MembershipBenefit> & { title: string }): MembershipBenefit {
    const list = this.getBenefits();
    if (benefit.id) {
      const idx = list.findIndex(b => b.id === benefit.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...benefit };
        this.set(STORAGE_KEYS.BENEFITS, list);
        this.logAudit('BENEFIT_UPDATE', 'admin', `Updated membership benefit: ${benefit.title}`);
        return list[idx];
      }
    }

    const newBenefit: MembershipBenefit = {
      id: benefit.id || 'benefit_' + Date.now().toString(36),
      title: benefit.title.trim(),
      category: benefit.category || 'Professional Development',
      description: benefit.description || '',
      conditions: benefit.conditions || '',
      iconName: benefit.iconName || 'Award',
      displayOrder: benefit.displayOrder !== undefined ? benefit.displayOrder : list.length + 1,
      isActive: benefit.isActive !== undefined ? benefit.isActive : true,
      termsUrl: benefit.termsUrl,
    };

    list.push(newBenefit);
    this.set(STORAGE_KEYS.BENEFITS, list);
    this.logAudit('BENEFIT_CREATE', 'admin', `Created membership benefit: ${newBenefit.title}`);
    return newBenefit;
  }

  public async deleteBenefitAsync(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const cleanId = encodeURIComponent(id.trim());
      const { ok, data, error } = await this.safeFetch<{ success: boolean; error?: string }>(
        `/api/benefits/${cleanId}`,
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(true),
        }
      );
      if (ok && data?.success) {
        const list = this.getBenefits().filter(b => b.id !== id);
        this.set(STORAGE_KEYS.BENEFITS, list);
        this.logAudit('BENEFIT_DELETE', 'admin', `Permanently deleted membership benefit ID: ${id}`);
        return { success: true };
      }
      return { success: false, error: error || data?.error || 'Failed to delete benefit on server.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error while deleting benefit.' };
    }
  }

  public deleteBenefit(id: string): boolean {
    const list = this.getBenefits();
    const filtered = list.filter(b => b.id !== id);
    if (filtered.length !== list.length) {
      this.set(STORAGE_KEYS.BENEFITS, filtered);
      this.logAudit('BENEFIT_DELETE', 'admin', `Deleted benefit ID: ${id}`);
      return true;
    }
    return false;
  }

  public reorderBenefits(orderedIds: string[]): boolean {
    const list = this.getBenefits();
    const map = new Map(list.map(b => [b.id, b]));
    const reordered: MembershipBenefit[] = [];
    orderedIds.forEach((id, index) => {
      const item = map.get(id);
      if (item) {
        item.displayOrder = index + 1;
        reordered.push(item);
        map.delete(id);
      }
    });
    map.forEach(item => {
      item.displayOrder = reordered.length + 1;
      reordered.push(item);
    });
    this.set(STORAGE_KEYS.BENEFITS, reordered);
    return true;
  }

  // --- Round Customization ---
  public updateRound(updated: Partial<Round> & { id: string }): Round | null {
    const rounds = this.getRounds();
    const idx = rounds.findIndex(r => r.id === updated.id);
    if (idx === -1) return null;
    rounds[idx] = {
      ...rounds[idx],
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    this.set(STORAGE_KEYS.ROUNDS, rounds);
    this.logAudit('ROUND_UPDATE', 'admin', `Updated round details: ${rounds[idx].title}`);
    return rounds[idx];
  }
}

export const repository = new StorageRepository();
