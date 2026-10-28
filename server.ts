import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '25mb' }));

// Static uploads directory for persistent member photos, speaker photos, and partner logos
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize GoogleGenAI SDK per skill guidelines
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// =========================================================================
// FIRESTORE DATABASE INITIALIZATION & IAM STATUS TRACKING
// =========================================================================
const FIRESTORE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'erudite-flow-cj1d7';
const FIRESTORE_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID || 'ai-studio-healthcareleader-136d7718-c608-4ce8-bd30-7919c5629153';

let firestoreDb: Firestore | null = null;
let firestoreConnectionStatus = {
  initialized: false,
  connected: false,
  error: null as string | null,
  projectId: FIRESTORE_PROJECT_ID,
  databaseId: FIRESTORE_DATABASE_ID,
  requiredIamRole: 'roles/datastore.user (Cloud Datastore User)',
};

try {
  firestoreDb = new Firestore({
    projectId: FIRESTORE_PROJECT_ID,
    databaseId: FIRESTORE_DATABASE_ID,
  });
  firestoreConnectionStatus.initialized = true;
  // Test Firestore connectivity asynchronously
  firestoreDb
    .collection('members')
    .limit(1)
    .get()
    .then(() => {
      firestoreConnectionStatus.connected = true;
      firestoreConnectionStatus.error = null;
      console.log(`[FIRESTORE] Connected successfully to database ${FIRESTORE_DATABASE_ID}`);
    })
    .catch((err: any) => {
      firestoreConnectionStatus.connected = false;
      firestoreConnectionStatus.error = err?.message || String(err);
      console.warn(
        `[FIRESTORE] Connection pending IAM permissions (${err?.message}). Running with atomic resilient storage.`
      );
    });
} catch (err: any) {
  firestoreConnectionStatus.error = err?.message || String(err);
  console.warn('[FIRESTORE] Firestore client initialization note:', err?.message);
}

// =========================================================================
// CRYPTOGRAPHIC SERVER-SIDE SESSION & AUTHENTICATION
// =========================================================================
function getOrCreateSessionSecret(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const secretFile = path.join(DATA_DIR, '.session_secret');
  try {
    if (fs.existsSync(secretFile)) {
      const secret = fs.readFileSync(secretFile, 'utf-8').trim();
      if (secret.length >= 32) return secret;
    }
    const newSecret = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(secretFile, newSecret, 'utf-8');
    return newSecret;
  } catch (err) {
    console.error('Failed to read/write session secret file:', err);
    return 'hlc_community_session_secret_stable_key_v1';
  }
}

const SERVER_SESSION_SECRET = getOrCreateSessionSecret();
// Server-only administrative key (rotated away from client bundle)
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'SGH_SECURE_ADMIN_' + crypto.randomBytes(16).toString('hex');

interface SessionPayload {
  memberId: string;
  email: string;
  role: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

function createSessionToken(payload: { memberId: string; email: string; role: string; isAdmin: boolean }): string {
  const data: SessionPayload = {
    ...payload,
    iat: Date.now(),
    exp: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14-day validity
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', SERVER_SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const clean = token.replace(/^Bearer\s+/i, '').trim();
  const parts = clean.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;
  try {
    const expectedSig = crypto.createHmac('sha256', SERVER_SESSION_SECRET).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as SessionPayload;
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

function getCallerSession(req: express.Request): SessionPayload | null {
  const authHeader =
    req.headers.authorization ||
    (typeof req.headers['x-admin-token'] === 'string' ? req.headers['x-admin-token'] : undefined) ||
    (typeof req.headers['x-session-token'] === 'string' ? req.headers['x-session-token'] : undefined);
  return verifySessionToken(authHeader);
}

function isAuthorizedAdmin(req: express.Request): boolean {
  const session = getCallerSession(req);
  if (session) {
    // Authoritative verification against stored member record in database
    const members = getStoredMembers();
    const caller = members.find(
      (m: any) =>
        m.id === session.memberId ||
        (m.professionalEmail && m.professionalEmail.toLowerCase() === session.email.toLowerCase())
    );

    if (caller) {
      const isActualAdmin =
        caller.role === 'administrator' ||
        (caller.professionalEmail && caller.professionalEmail.toLowerCase() === 'ashrafgalalsalem@gmail.com');
      if (isActualAdmin) return true;
    }

    if (session.isAdmin) return true;
  }

  // Fallback for direct server-to-server calls with server secret
  const headerKey = req.headers['x-admin-key'];
  if (typeof headerKey === 'string' && headerKey) {
    try {
      const keyBuf = Buffer.from(headerKey);
      const secretBuf = Buffer.from(ADMIN_SECRET_KEY);
      if (keyBuf.length === secretBuf.length && crypto.timingSafeEqual(keyBuf, secretBuf)) {
        return true;
      }
    } catch {}
  }
  return false;
}

// Password hashing & timing-safe verification
function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  if (!password || !salt || !storedHash) return false;
  try {
    const hash = hashPassword(password, salt);
    const hashBuf = Buffer.from(hash, 'hex');
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (hashBuf.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(hashBuf, storedBuf);
  } catch {
    return false;
  }
}

// =========================================================================
// DATA PERSISTENCE & SYNCHRONIZATION
// =========================================================================
const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');
const PRIVATE_FILE = path.join(DATA_DIR, 'private.json');
const AUDIT_FILE = path.join(DATA_DIR, 'audit.json');
const ROUNDS_FILE = path.join(DATA_DIR, 'rounds.json');
const PARTNERS_FILE = path.join(DATA_DIR, 'partners.json');
const BENEFITS_FILE = path.join(DATA_DIR, 'benefits.json');
const TOPICS_FILE = path.join(DATA_DIR, 'topics.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'comments.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const INITIAL_ROOT_ADMIN = {
  id: 'admin_ashraf',
  fullName: 'Prof. Ashraf Galal Salem',
  professionalEmail: 'Ashrafgalalsalem@gmail.com',
  username: 'admin',
  jobTitle: 'Executive Director & Chief Medical Officer',
  organization: 'Healthcare Leaders Community',
  specialty: 'Healthcare Governance & Clinical Strategy',
  bio: 'Leading clinical governance and healthcare leadership across Egypt and regional healthcare networks.',
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

const DEFAULT_INAUGURAL_ROUND = {
  id: 'round_sgh_cairo_inaugural_2026',
  title: 'الملتقى القيادي الأول لإدارة المستشفيات والحوكمة الإكلينيكية 2026',
  topic: 'الذكاء الاصطناعي ومعايير JCI/TEMOS في قيادة المستشفيات الحديثة',
  description:
    'ملتقى قيادي تنفيذي يجمع كبار المديرين التنفيذيين والمديرين الطبيين ورؤساء الأقسام بمستشفيات مصر، لمناقشة الحوكمة الإكلينيكية ودمج الذكاء الاصطناعي في جودة الرعاية الصحية وإدارة الأزمات.',
  scheduledDate: '2026-10-27',
  scheduledTime: '10:00 AM - 02:30 PM',
  durationMinutes: 270,
  venue: 'قاعة المؤتمرات الكبرى - مجمع القيادة الصحية، القاهرة',
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
      name: 'أ.د. أشرف جلال سالم',
      title: 'المدير التنفيذي والطبي (CMO & Executive Director)',
      organization: 'المستشفى السعودي الألماني - مصر',
      bio: 'أستاذ واستشاري أول الحوكمة الطبية وإدارة المستشفيات، رائد تطبيق معايير الجودة العالمية في الرعاية الصحية.',
    },
    {
      id: 'spk_2',
      name: 'د. طارق منصور',
      title: 'رئيس قطاع الجودة وسلامة المرضى (Director of Clinical Quality)',
      organization: 'مجموعة مستشفيات السعودي الألماني الصحية',
      bio: 'خبير الاعتمادات الدولية JCI و TEMOS ونظم قياس مؤشرات الأداء الإكلينيكي.',
    },
    {
      id: 'spk_3',
      name: 'د. منى حجازي',
      title: 'رئيس وحدة التحول الرقمي والمعلوماتية الصحية (Head of Digital Health)',
      organization: 'مجلس خبراء الصحة الرقمية',
      bio: 'استشارية تطبيقات الذكاء الاصطناعي والتحليل التنبؤي في سلاسل الرعاية الحرجة.',
    },
  ],
  agenda: [
    {
      time: '10:00 AM - 10:30 AM',
      title: 'الاستقبال والترحيب التنفيذي وشبكة التواصل المهني',
      description: 'تسجيل الحضور التنفيذي والترحيب بقيادات المستشفيات والشركاء الاستراتيجيين في بهو المؤتمرات.',
      speaker: 'الأمانة العامة للملتقى',
    },
    {
      time: '10:30 AM - 11:30 AM',
      title: 'الجلسة الافتتاحية: استراتيجيات الحوكمة الإكلينيكية والاعتمادات الدولية JCI & TEMOS',
      description: 'عرض الرؤية الشاملة لضمان أمان المرضى ومؤشرات الأداء القيادية في بيئة الرعاية الصحية المصرية.',
      speaker: 'أ.د. أشرف جلال سالم',
    },
    {
      time: '11:45 AM - 01:00 PM',
      title: 'حلقة نقاشية: توظيف الذكاء الاصطناعي والتحول الرقمي في كفاءة الخدمات التشغيلية',
      description: 'دراسات حالة واقعية من المستشفيات الرائدة حول تقليل فترات الانتظار ومنع الأخطاء الطبية عبر الأنظمة الذكية.',
      speaker: 'د. منى حجازي & د. طارق منصور',
    },
    {
      time: '01:00 PM - 02:30 PM',
      title: 'غداء عمل تنفيذي ومناقشة الشراكات الثنائية بين المستشفيات',
      description: 'طاولة مستديرة لبناء بروتوكولات تعاون وتبادل الخبرات بين القيادات الصحية المشاركة.',
      speaker: 'كافة القيادات الحاضرة',
    },
  ],
};

const DEFAULT_PARTNERS = [
  {
    id: 'partner_jci',
    organizationName: 'Joint Commission International (JCI)',
    logoUrl: '/assets/aistudio/logo_hospital_egypt_copy-05_43a268db.png',
    relationshipType: 'Hospital Network Accreditation',
    description:
      'Gold standard global hospital accreditation held by Saudi German Hospital Cairo for international clinical excellence, governance, and patient safety.',
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
    logoUrl: '/assets/aistudio/logo_hospital_egypt_copy-05_43a268db.png',
    relationshipType: 'Clinical Governance Certification',
    description:
      'International quality certification for healthcare management, medical tourism, and international patient care excellence held by Saudi German Health Egypt.',
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
    logoUrl: '/assets/aistudio/logo_hospital_egypt_copy-05_43a268db.png',
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
    logoUrl: '/assets/aistudio/logo_hospital_egypt_copy-05_43a268db.png',
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
    logoUrl: '/assets/aistudio/logo_hospital_egypt_copy-05_43a268db.png',
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
    id: 'partner_sgh_academy',
    organizationName: 'Saudi German Academy',
    logoUrl: '/assets/aistudio/logo_hospital_egypt_copy-01_e8873238.png',
    relationshipType: 'Academic & Educational Partner',
    description:
      'Premier executive education arm of Saudi German Health, offering healthcare leadership development, continuous professional education, and fellowships.',
    verificationStatus: 'verified',
    displayOrder: 6,
    isActive: true,
    websiteUrl: 'https://sghgroup.com.eg',
    verifiedAt: '2026-10-20T00:00:00.000Z',
    verifiedBy: 'Clinical Governance Board',
  },
];

const DEFAULT_BENEFITS = [
  {
    id: 'benefit_academy_courses',
    title: 'Saudi German Academy Course Reductions',
    category: 'Academy & Education',
    description:
      'Exclusive member discounts on select healthcare management diplomas, clinical leadership courses, and healthcare workforce certifications.',
    conditions:
      'Subject to course seat availability, cohort enrollment dates, and specific academic prerequisites as established by Saudi German Academy.',
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

const DEFAULT_TOPICS = [
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

const DEFAULT_COMMENTS = [
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

// File Operation Queue for Atomic Operations
let fileOperationQueue = Promise.resolve();
function runWithFileLock<T>(fn: () => T | Promise<T>): Promise<T> {
  const result = fileOperationQueue.then(() => fn());
  fileOperationQueue = result.then(
    () => {},
    () => {}
  );
  return result;
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      writeJsonFileAtomic(filePath, fallback);
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFileAtomic<T>(filePath: string, data: T): void {
  try {
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`Failed to write atomically to ${filePath}:`, err);
  }
}

// Write to Firestore if connected, with fallback to local atomic storage
async function syncToFirestore(collectionName: string, docId: string, data: any) {
  if (firestoreDb && firestoreConnectionStatus.connected) {
    try {
      await firestoreDb.collection(collectionName).doc(docId).set(data, { merge: true });
    } catch (err: any) {
      console.warn(`[FIRESTORE] Sync to ${collectionName}/${docId} deferred:`, err?.message);
    }
  }
}

async function deleteFromFirestore(collectionName: string, docId: string) {
  if (firestoreDb && firestoreConnectionStatus.connected) {
    try {
      await firestoreDb.collection(collectionName).doc(docId).delete();
    } catch (err: any) {
      console.warn(`[FIRESTORE] Delete from ${collectionName}/${docId} deferred:`, err?.message);
    }
  }
}

// Stored Collections Accessors
function getStoredMembers(): any[] {
  const members = readJsonFile<any[]>(MEMBERS_FILE, [INITIAL_ROOT_ADMIN]);
  if (!members.some((m: any) => m.professionalEmail.toLowerCase() === 'ashrafgalalsalem@gmail.com')) {
    members.unshift(INITIAL_ROOT_ADMIN);
    writeJsonFileAtomic(MEMBERS_FILE, members);
  }
  return members;
}

function getStoredPrivate(): Record<string, any> {
  const privates = readJsonFile<Record<string, any>>(PRIVATE_FILE, {});
  let needsSave = false;

  for (const key of Object.keys(privates)) {
    const entry = privates[key];
    if (entry && entry.password && !entry.passwordHash) {
      entry.salt = generateSalt();
      entry.passwordHash = hashPassword(entry.password, entry.salt);
      delete entry.password;
      needsSave = true;
    }
  }

  if (!privates.admin_ashraf || !privates.admin_ashraf.passwordHash) {
    const salt = generateSalt();
    privates.admin_ashraf = {
      memberId: 'admin_ashraf',
      username: 'admin',
      salt,
      // Initial root admin password hash (securely salt-hashed)
      passwordHash: hashPassword(process.env.INITIAL_ADMIN_PASSWORD || 'SGH@8894940111', salt),
      emailVerified: true,
      lastLoginAt: '2026-10-20T00:00:00.000Z',
    };
    needsSave = true;
  }

  if (needsSave) {
    writeJsonFileAtomic(PRIVATE_FILE, privates);
  }
  return privates;
}

function getStoredRounds(): any[] {
  const rounds = readJsonFile<any[]>(ROUNDS_FILE, [DEFAULT_INAUGURAL_ROUND]);
  if (rounds.length === 0) {
    rounds.push(DEFAULT_INAUGURAL_ROUND);
    writeJsonFileAtomic(ROUNDS_FILE, rounds);
  }
  return rounds;
}

function getStoredPartners(): any[] {
  const partners = readJsonFile<any[]>(PARTNERS_FILE, DEFAULT_PARTNERS);
  if (partners.length === 0) {
    writeJsonFileAtomic(PARTNERS_FILE, DEFAULT_PARTNERS);
    return DEFAULT_PARTNERS;
  }
  return partners;
}

function getStoredBenefits(): any[] {
  const benefits = readJsonFile<any[]>(BENEFITS_FILE, DEFAULT_BENEFITS);
  if (benefits.length === 0) {
    writeJsonFileAtomic(BENEFITS_FILE, DEFAULT_BENEFITS);
    return DEFAULT_BENEFITS;
  }
  return benefits;
}

function getStoredTopics(): any[] {
  const topics = readJsonFile<any[]>(TOPICS_FILE, DEFAULT_TOPICS);
  if (topics.length === 0) {
    writeJsonFileAtomic(TOPICS_FILE, DEFAULT_TOPICS);
    return DEFAULT_TOPICS;
  }
  return topics;
}

function getStoredComments(): any[] {
  const comments = readJsonFile<any[]>(COMMENTS_FILE, DEFAULT_COMMENTS);
  if (comments.length === 0) {
    writeJsonFileAtomic(COMMENTS_FILE, DEFAULT_COMMENTS);
    return DEFAULT_COMMENTS;
  }
  return comments;
}

interface BrandSettings {
  primaryLogoUrl: string; // Horizontal logo
  secondaryLogoUrl: string; // Vertical / emblem logo
  logo1Alt: string;
  logo2Alt: string;
  platformName: string;
  platformNameAr: string;
  updatedAt: string;
}

const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  primaryLogoUrl: '/assets/aistudio/Academy-logos-01_08a20a13.png',
  secondaryLogoUrl: '/assets/aistudio/Academy-logos-03_a9a4c809.png',
  logo1Alt: 'Saudi German Academy - Hospital Management Excellence',
  logo2Alt: 'Saudi German Academy Emblem',
  platformName: 'Healthcare Leaders Community',
  platformNameAr: 'مجتمع قادة الرعاية الصحية',
  updatedAt: '2026-10-27T00:00:00.000Z',
};

function getStoredBrandSettings(): BrandSettings {
  const current = readJsonFile<BrandSettings>(SETTINGS_FILE, DEFAULT_BRAND_SETTINGS);
  return { ...DEFAULT_BRAND_SETTINGS, ...current };
}

function logAuditEntry(action: string, performedBy: string, details: string) {
  const logs = readJsonFile<any[]>(AUDIT_FILE, []);
  const entry = {
    id: 'log_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    action,
    performedBy,
    details,
  };
  logs.unshift(entry);
  writeJsonFileAtomic(AUDIT_FILE, logs.slice(0, 200));
  syncToFirestore('audit_logs', entry.id, entry);
}

// =========================================================================
// API ROUTES
// =========================================================================

// --- Session & Verification Endpoint ---
app.get('/api/auth/me', (req, res) => {
  const session = getCallerSession(req);
  if (!session) {
    return res.status(401).json({ success: false, valid: false, error: 'No active session or session has expired.' });
  }

  const members = getStoredMembers();
  const caller = members.find(
    (m: any) =>
      m.id === session.memberId ||
      (m.professionalEmail && m.professionalEmail.toLowerCase() === session.email.toLowerCase())
  );

  const isAdmin = isAuthorizedAdmin(req);

  return res.json({
    success: true,
    valid: true,
    isAdmin,
    role: caller ? caller.role : session.role,
    member: caller || null,
  });
});

// --- Brand Settings API ---
app.get('/api/settings/brand', (req, res) => {
  const settings = getStoredBrandSettings();
  return res.json({ success: true, settings });
});

app.post('/api/settings/brand', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Administrative authorization required.' });
    }

    const { primaryLogoUrl, secondaryLogoUrl, logo1Alt, logo2Alt, platformName, platformNameAr } = req.body;
    const current = getStoredBrandSettings();

    const updated: BrandSettings = {
      ...current,
      primaryLogoUrl: primaryLogoUrl !== undefined ? String(primaryLogoUrl).trim() : current.primaryLogoUrl,
      secondaryLogoUrl: secondaryLogoUrl !== undefined ? String(secondaryLogoUrl).trim() : current.secondaryLogoUrl,
      logo1Alt: logo1Alt !== undefined ? String(logo1Alt).trim() : current.logo1Alt,
      logo2Alt: logo2Alt !== undefined ? String(logo2Alt).trim() : current.logo2Alt,
      platformName: platformName !== undefined ? String(platformName).trim() : current.platformName,
      platformNameAr: platformNameAr !== undefined ? String(platformNameAr).trim() : current.platformNameAr,
      updatedAt: new Date().toISOString(),
    };

    writeJsonFileAtomic(SETTINGS_FILE, updated);
    await syncToFirestore('community_settings', 'brand', updated);
    logAuditEntry('BRAND_SETTINGS_UPDATE', 'admin', `Updated community brand logos (Primary: ${updated.primaryLogoUrl}, Secondary: ${updated.secondaryLogoUrl})`);

    return res.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error('Update brand settings error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update brand settings.' });
  }
});

// DELETE /api/settings/brand/logo/:index - Remove or Reset individual Logo (Admin only)
app.delete('/api/settings/brand/logo/:index', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Administrative authorization required.' });
    }

    const index = parseInt(req.params.index, 10);
    if (index !== 1 && index !== 2) {
      return res.status(400).json({ success: false, error: 'Invalid logo index. Must be 1 or 2.' });
    }

    const result = await runWithFileLock(async () => {
      const current = getStoredBrandSettings();
      const updated: BrandSettings = {
        ...current,
        primaryLogoUrl: index === 1 ? '' : current.primaryLogoUrl,
        secondaryLogoUrl: index === 2 ? '' : current.secondaryLogoUrl,
        updatedAt: new Date().toISOString(),
      };
      writeJsonFileAtomic(SETTINGS_FILE, updated);
      await syncToFirestore('community_settings', 'brand', updated);
      logAuditEntry('BRAND_LOGO_REMOVE', 'admin', `Removed Logo ${index} from platform branding.`);
      return { status: 200, body: { success: true, settings: updated, message: `Logo ${index} removed successfully.` } };
    });

    return res.status(result.status).json(result.body);
  } catch (err: any) {
    console.error('Remove logo error:', err);
    return res.status(500).json({ success: false, error: 'Failed to remove logo.' });
  }
});

// --- Image Upload API (Priority 6) ---
app.post('/api/upload-image', (req, res) => {
  try {
    const { dataUrl, filenamePrefix } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid data URL is required.' });
    }

    const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, error: 'Invalid image format. Expected data URI.' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Max 5MB limit
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Image exceeds maximum allowed size of 5MB.' });
    }

    let extension = 'jpg';
    if (mimeType === 'image/png') extension = 'png';
    else if (mimeType === 'image/webp') extension = 'webp';
    else if (mimeType === 'image/svg+xml') extension = 'svg';

    const prefix = filenamePrefix ? filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '') : 'img';
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    const publicUrl = `/uploads/${filename}`;

    return res.json({ success: true, url: publicUrl, mimeType, size: buffer.length });
  } catch (err: any) {
    console.error('Upload image error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process image upload.' });
  }
});

// --- Diagnostics Endpoint (Priority 1 & 8) ---
app.get('/api/admin/diagnostics', (req, res) => {
  const isAdmin = isAuthorizedAdmin(req);
  if (!isAdmin) {
    return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
  }

  const members = getStoredMembers();
  const privates = getStoredPrivate();
  const audit = readJsonFile<any[]>(AUDIT_FILE, []);
  const rounds = getStoredRounds();
  const partners = getStoredPartners();
  const benefits = getStoredBenefits();

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    firestore: firestoreConnectionStatus,
    dataIntegrity: {
      membersCount: members.length,
      privateCredsCount: Object.keys(privates).length,
      roundsCount: rounds.length,
      partnersCount: partners.length,
      benefitsCount: benefits.length,
      auditLogsCount: audit.length,
      rootAdminPresent: members.some((m: any) => m.id === 'admin_ashraf'),
      zeroPlaintextPasswords: Object.values(privates).every((p: any) => !p.password && p.passwordHash),
    },
  });
});

// --- Members API ---

// GET /api/members - Directory & Admin list
app.get('/api/members', (req, res) => {
  const members = getStoredMembers();
  const isAdmin = isAuthorizedAdmin(req);

  if (isAdmin) {
    // Return all members to authorized administrator
    return res.json({ success: true, members });
  }

  // Public/member view: return ONLY approved members who consented to directory display
  const publicDirectory = members
    .filter((m: any) => m.status === 'approved' && m.consentDirectoryDisplay !== false)
    .map((m: any) => ({
      id: m.id,
      fullName: m.fullName,
      username: m.username,
      jobTitle: m.jobTitle,
      organization: m.organization,
      specialty: m.specialty,
      bio: m.bio || '',
      profilePhotoUrl: m.profilePhotoUrl,
      linkedinUrl: m.linkedinUrl || '',
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
      consentDirectoryDisplay: m.consentDirectoryDisplay,
      consentPhotoPublish: m.consentPhotoPublish,
    }));

  return res.json({ success: true, members: publicDirectory });
});

// GET /api/members/:id - Secure Member Profile (Priority 3)
app.get('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const members = getStoredMembers();
  const member = members.find((m: any) => m.id === id);

  if (!member) {
    return res.status(404).json({ success: false, error: 'Member profile not found.' });
  }

  const session = getCallerSession(req);
  const isAdmin = isAuthorizedAdmin(req);
  const isSelf = session && session.memberId === id;

  // 1. Authorized administrator: full profile metadata (excluding credentials)
  if (isAdmin) {
    return res.json({ success: true, member });
  }

  // 2. Member viewing own profile: full profile details
  if (isSelf) {
    return res.json({ success: true, member });
  }

  // 3. Public caller: ONLY if approved and consented to directory display
  if (member.status === 'approved' && member.consentDirectoryDisplay !== false) {
    return res.json({
      success: true,
      member: {
        id: member.id,
        fullName: member.fullName,
        username: member.username,
        jobTitle: member.jobTitle,
        organization: member.organization,
        specialty: member.specialty,
        bio: member.bio || '',
        profilePhotoUrl: member.profilePhotoUrl,
        linkedinUrl: member.linkedinUrl || '',
        role: member.role,
        status: member.status,
        consentDirectoryDisplay: member.consentDirectoryDisplay,
        consentPhotoPublish: member.consentPhotoPublish,
      },
    });
  }

  // 4. Pending, rejected, or privacy-withheld member accessed without authorization: return 404
  return res.status(404).json({ success: false, error: 'Member profile not found or access restricted.' });
});

// DELETE /api/members/:id - Admin Delete Member (Priority 4)
app.delete('/api/members/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Administrative authorization required.' });
    }
    const id = decodeURIComponent(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Member ID is required.' });
    }
    if (id === 'admin_ashraf') {
      return res.status(400).json({ success: false, error: 'Root administrator account cannot be deleted.' });
    }

    const deleteResult = await runWithFileLock(async () => {
      const members = getStoredMembers();
      const idx = members.findIndex((m: any) => m.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Member record not found.' } };
      }
      const removed = members.splice(idx, 1)[0];
      writeJsonFileAtomic(MEMBERS_FILE, members);

      const privates = getStoredPrivate();
      delete privates[id];
      writeJsonFileAtomic(PRIVATE_FILE, privates);

      await deleteFromFirestore('members', id);
      await deleteFromFirestore('members_private', id);

      logAuditEntry('MEMBER_DELETE', 'admin', `Deleted member profile: ${removed.fullName} (${removed.professionalEmail})`);

      return { status: 200, body: { success: true, message: `Member ${removed.fullName} deleted successfully.` } };
    });

    return res.status(deleteResult.status).json(deleteResult.body);
  } catch (err: any) {
    console.error('Delete member error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete member.' });
  }
});

// PUT /api/members/:id - Admin or Self Update Member Profile Fields
app.put('/api/members/:id', async (req, res) => {
  try {
    const session = getCallerSession(req);
    const isAdmin = isAuthorizedAdmin(req);
    const { id } = req.params;

    if (!isAdmin && (!session || session.memberId !== id)) {
      return res.status(403).json({ success: false, error: 'Unauthorized to edit member profile.' });
    }

    const {
      fullName,
      fullNameEn,
      fullNameAr,
      jobTitle,
      jobTitleEn,
      jobTitleAr,
      organization,
      organizationEn,
      organizationAr,
      specialty,
      specialtyEn,
      specialtyAr,
      bio,
      bioEn,
      bioAr,
      professionalEmail,
      linkedinUrl,
      profilePhotoUrl,
      status,
      role,
      consentDirectoryDisplay,
      consentPhotoPublish,
      consentFutureCommunications,
    } = req.body;

    const editResult = await runWithFileLock(async () => {
      const members = getStoredMembers();
      const idx = members.findIndex((m: any) => m.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Member not found.' } };
      }

      const existing = members[idx];

      if (fullName !== undefined) existing.fullName = String(fullName).trim();
      if (fullNameEn !== undefined) existing.fullNameEn = String(fullNameEn).trim();
      if (fullNameAr !== undefined) existing.fullNameAr = String(fullNameAr).trim();
      if (jobTitle !== undefined) existing.jobTitle = String(jobTitle).trim();
      if (jobTitleEn !== undefined) existing.jobTitleEn = String(jobTitleEn).trim();
      if (jobTitleAr !== undefined) existing.jobTitleAr = String(jobTitleAr).trim();
      if (organization !== undefined) existing.organization = String(organization).trim();
      if (organizationEn !== undefined) existing.organizationEn = String(organizationEn).trim();
      if (organizationAr !== undefined) existing.organizationAr = String(organizationAr).trim();
      if (specialty !== undefined) existing.specialty = String(specialty).trim();
      if (specialtyEn !== undefined) existing.specialtyEn = String(specialtyEn).trim();
      if (specialtyAr !== undefined) existing.specialtyAr = String(specialtyAr).trim();
      if (bio !== undefined) existing.bio = String(bio).trim();
      if (bioEn !== undefined) existing.bioEn = String(bioEn).trim();
      if (bioAr !== undefined) existing.bioAr = String(bioAr).trim();
      if (linkedinUrl !== undefined) existing.linkedinUrl = String(linkedinUrl).trim();
      if (profilePhotoUrl !== undefined) existing.profilePhotoUrl = String(profilePhotoUrl).trim();

      if (isAdmin) {
        if (professionalEmail !== undefined) existing.professionalEmail = String(professionalEmail).trim().toLowerCase();
        if (status !== undefined) existing.status = status;
        if (role !== undefined) existing.role = role;
      }

      if (consentDirectoryDisplay !== undefined) existing.consentDirectoryDisplay = Boolean(consentDirectoryDisplay);
      if (consentPhotoPublish !== undefined) existing.consentPhotoPublish = Boolean(consentPhotoPublish);
      if (consentFutureCommunications !== undefined) existing.consentFutureCommunications = Boolean(consentFutureCommunications);

      existing.updatedAt = new Date().toISOString();
      members[idx] = existing;
      writeJsonFileAtomic(MEMBERS_FILE, members);

      await syncToFirestore('members', existing.id, existing);
      logAuditEntry('MEMBER_UPDATE', isAdmin ? 'admin' : id, `Updated profile fields for: ${existing.fullName}`);

      return { status: 200, body: { success: true, member: existing } };
    });

    return res.status(editResult.status).json(editResult.body);
  } catch (err: any) {
    console.error('Update member error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update member profile.' });
  }
});

// POST /api/members/register - Registration Endpoint
app.post('/api/members/register', async (req, res) => {
  try {
    const {
      fullName,
      professionalEmail,
      username,
      password,
      jobTitle,
      organization,
      specialty,
      bio,
      profilePhotoUrl,
      linkedinUrl,
      phone,
      consentDirectoryDisplay,
      consentPhotoPublish,
      consentFutureCommunications,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, error: 'Full Name is required.' });
    }
    if (!professionalEmail || !professionalEmail.trim() || !professionalEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid professional email address is required.' });
    }
    if (!jobTitle || !jobTitle.trim() || !organization || !organization.trim()) {
      return res.status(400).json({ success: false, error: 'Job title and healthcare organization are required.' });
    }
    if (!specialty || !specialty.trim()) {
      return res.status(400).json({ success: false, error: 'Specialty is required.' });
    }

    const cleanEmail = professionalEmail.trim().toLowerCase();
    const cleanUsername = username?.trim().toLowerCase() || cleanEmail.split('@')[0];

    const registrationResult = await runWithFileLock(async () => {
      const members = getStoredMembers();

      // Check duplicate email
      const duplicateEmail = members.find((m: any) => m.professionalEmail.toLowerCase() === cleanEmail);
      if (duplicateEmail) {
        return {
          status: 400,
          body: { success: false, error: 'An account with this email already exists. Please sign in.' },
        };
      }

      // Check duplicate username
      const duplicateUser = members.find((m: any) => m.username && m.username.toLowerCase() === cleanUsername);
      if (duplicateUser || cleanUsername === 'admin') {
        return {
          status: 400,
          body: { success: false, error: 'This username is already taken. Please choose another username.' },
        };
      }

      const newId = 'mem_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      const newMember = {
        id: newId,
        fullName: fullName.trim(),
        professionalEmail: cleanEmail,
        username: cleanUsername,
        jobTitle: jobTitle.trim(),
        organization: organization.trim(),
        specialty: specialty.trim(),
        bio: bio?.trim() || '',
        profilePhotoUrl:
          profilePhotoUrl ||
          'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
        linkedinUrl: linkedinUrl?.trim() || '',
        role: 'pending_member',
        status: 'pending',
        joinedAt: new Date().toISOString(),
        approvalEmailSent: false,
        consentDirectoryDisplay: consentDirectoryDisplay !== undefined ? Boolean(consentDirectoryDisplay) : true,
        consentPhotoPublish: consentPhotoPublish !== undefined ? Boolean(consentPhotoPublish) : true,
        consentFutureCommunications: consentFutureCommunications !== undefined ? Boolean(consentFutureCommunications) : true,
      };

      const privates = getStoredPrivate();
      const salt = generateSalt();
      const rawPass = password ? password.trim() : 'SGH@2026';
      const passwordHash = hashPassword(rawPass, salt);

      const privateEntry = {
        memberId: newId,
        username: cleanUsername,
        salt,
        passwordHash,
        phone: phone?.trim() || '',
        emailVerified: true,
        lastLoginAt: new Date().toISOString(),
      };

      privates[newId] = privateEntry;
      writeJsonFileAtomic(PRIVATE_FILE, privates);

      members.push(newMember);
      writeJsonFileAtomic(MEMBERS_FILE, members);

      await syncToFirestore('members', newId, newMember);
      await syncToFirestore('members_private', newId, privateEntry);

      logAuditEntry(
        'MEMBER_REGISTER',
        cleanEmail,
        `Registered member application: ${newMember.fullName} (${newMember.jobTitle} - ${newMember.organization}) with initial status: Pending`
      );

      const sessionToken = createSessionToken({
        memberId: newId,
        email: cleanEmail,
        role: 'pending_member',
        isAdmin: false,
      });

      return {
        status: 201,
        body: {
          success: true,
          member: newMember,
          sessionToken,
          message: 'Application submitted successfully. Queued for administrative review.',
        },
      };
    });

    return res.status(registrationResult.status).json(registrationResult.body);
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, error: 'Failed to process registration application.' });
  }
});

// POST /api/members/:id/status - Status update (Approve / Reject)
app.post('/api/members/:id/status', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Administrative authorization required.' });
    }

    const { id } = req.params;
    const { status, adminId } = req.body;

    if (!['approved', 'rejected', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid membership status specified.' });
    }

    const updateResult = await runWithFileLock(async () => {
      const members = getStoredMembers();
      const memberIndex = members.findIndex((m: any) => m.id === id);

      if (memberIndex === -1) {
        return { status: 404, body: { success: false, error: 'Member record not found.' } };
      }

      const member = members[memberIndex];
      member.status = status;

      if (status === 'approved') {
        member.role = 'approved_member';
        member.approvedAt = new Date().toISOString();
        member.reviewedBy = adminId || 'Prof. Ashraf Galal Salem';
        member.approvalEmailSent = false;
      } else if (status === 'rejected') {
        member.role = 'visitor';
        member.reviewedBy = adminId || 'Prof. Ashraf Galal Salem';
      } else if (status === 'pending') {
        member.role = 'pending_member';
      }

      members[memberIndex] = member;
      writeJsonFileAtomic(MEMBERS_FILE, members);

      await syncToFirestore('members', id, member);

      logAuditEntry(
        'MEMBER_STATUS_UPDATE',
        adminId || 'admin',
        `Updated member ${member.fullName} (${member.professionalEmail}) status to ${status}.`
      );

      return {
        status: 200,
        body: {
          success: true,
          member,
          message: `Member status updated to ${status} in community database.`,
        },
      };
    });

    return res.status(updateResult.status).json(updateResult.body);
  } catch (err: any) {
    console.error('Status update error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update member status.' });
  }
});

// POST /api/members/login - Authentication
app.post('/api/members/login', (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Please enter both username and password.' });
    }

    const cleanInput = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Root Admin Login
    if (
      cleanInput === 'admin' ||
      cleanInput === 'admin_ashraf' ||
      cleanInput === 'ashrafgalalsalem@gmail.com' ||
      cleanInput === 'ashraf'
    ) {
      const privates = getStoredPrivate();
      const adminCreds = privates.admin_ashraf;

      const isValidAdminPass =
        adminCreds && adminCreds.salt && adminCreds.passwordHash
          ? verifyPassword(cleanPass, adminCreds.salt, adminCreds.passwordHash)
          : false;

      if (isValidAdminPass) {
        logAuditEntry('ADMIN_LOGIN', 'Ashrafgalalsalem@gmail.com', 'Root Administrator logged in successfully.');
        const token = createSessionToken({
          memberId: INITIAL_ROOT_ADMIN.id,
          email: INITIAL_ROOT_ADMIN.professionalEmail,
          role: 'administrator',
          isAdmin: true,
        });

        return res.json({
          success: true,
          member: INITIAL_ROOT_ADMIN,
          role: 'administrator',
          isAdmin: true,
          adminToken: token,
          sessionToken: token,
        });
      }
    }

    // 2. Member Lookup
    const members = getStoredMembers();
    const matched = members.find(
      (m: any) =>
        m.professionalEmail.toLowerCase() === cleanInput ||
        (m.username && m.username.toLowerCase() === cleanInput)
    );

    if (!matched) {
      return res.status(401).json({
        success: false,
        error: 'No account found with this username or email. Please register first.',
      });
    }

    const privates = getStoredPrivate();
    const memberPrivate = privates[matched.id];

    if (!memberPrivate) {
      return res.status(401).json({
        success: false,
        error: 'Authentication credentials not found. Please contact administration.',
      });
    }

    const isPassValid =
      memberPrivate.salt && memberPrivate.passwordHash
        ? verifyPassword(cleanPass, memberPrivate.salt, memberPrivate.passwordHash)
        : memberPrivate.password === cleanPass;

    if (!isPassValid) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please verify and try again.',
      });
    }

    memberPrivate.lastLoginAt = new Date().toISOString();
    privates[matched.id] = memberPrivate;
    writeJsonFileAtomic(PRIVATE_FILE, privates);

    logAuditEntry('MEMBER_LOGIN', matched.professionalEmail, `Member logged in. Status: ${matched.status}`);

    const isAdmin =
      matched.role === 'administrator' || matched.professionalEmail.toLowerCase() === 'ashrafgalalsalem@gmail.com';

    const token = createSessionToken({
      memberId: matched.id,
      email: matched.professionalEmail,
      role: matched.role,
      isAdmin,
    });

    return res.json({
      success: true,
      member: matched,
      role: matched.role,
      isAdmin,
      isPending: matched.status === 'pending',
      adminToken: isAdmin ? token : undefined,
      sessionToken: token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Failed to authenticate user.' });
  }
});

// --- ROUNDS CRUD API (Priority 4 & 5) ---

// GET /api/rounds
app.get('/api/rounds', (_req, res) => {
  const rounds = getStoredRounds();
  return res.json({ success: true, rounds });
});

// GET /api/rounds/:id
app.get('/api/rounds/:id', (req, res) => {
  const { id } = req.params;
  const rounds = getStoredRounds();
  const round = rounds.find((r: any) => r.id === id);
  if (!round) {
    return res.status(404).json({ success: false, error: 'Round not found.' });
  }
  return res.json({ success: true, round });
});

// POST /api/rounds - Create Round (Admin only)
app.post('/api/rounds', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const {
      title,
      topic,
      description,
      scheduledDate,
      scheduledTime,
      durationMinutes,
      venue,
      venueType,
      maxCapacity,
      status,
      eventType,
      speakers,
      agenda,
      coverImageUrl,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Round title is required.' });
    }

    const newRoundId = 'round_' + Date.now().toString(36);
    const newRound = {
      id: newRoundId,
      title: title.trim(),
      topic: topic?.trim() || 'Executive Healthcare Leadership',
      description: description?.trim() || '',
      scheduledDate: scheduledDate?.trim() || 'TBD',
      scheduledTime: scheduledTime?.trim() || '10:00 AM - 02:00 PM',
      durationMinutes: durationMinutes ? Number(durationMinutes) : 180,
      venue: venue?.trim() || 'Saudi German Hospital Cairo Grand Auditorium, Cairo, Egypt',
      venueType: venueType || 'in_person',
      maxCapacity: maxCapacity ? Number(maxCapacity) : 75,
      currentRegistrationsCount: 0,
      status: status || 'published',
      eventType: eventType || 'roundtable',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      speakers: Array.isArray(speakers) ? speakers : [],
      agenda: Array.isArray(agenda) ? agenda : [],
      coverImageUrl: coverImageUrl || '',
    };

    const rounds = getStoredRounds();
    rounds.unshift(newRound);
    writeJsonFileAtomic(ROUNDS_FILE, rounds);
    await syncToFirestore('rounds', newRoundId, newRound);

    logAuditEntry('ROUND_CREATE', 'admin', `Created leadership round: ${newRound.title}`);

    return res.status(201).json({ success: true, round: newRound });
  } catch (err: any) {
    console.error('Create round error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create round.' });
  }
});

// PUT /api/rounds/:id - Update Round (Admin only)
app.put('/api/rounds/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const { id } = req.params;
    const rounds = getStoredRounds();
    const idx = rounds.findIndex((r: any) => r.id === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Round not found.' });
    }

    const existing = rounds[idx];
    const updateData = req.body;

    const updatedRound = {
      ...existing,
      ...updateData,
      id: existing.id, // Preserve existing ID
      currentRegistrationsCount: existing.currentRegistrationsCount, // Preserve counts
      createdAt: existing.createdAt, // Preserve creation timestamp
      updatedAt: new Date().toISOString(),
    };

    rounds[idx] = updatedRound;
    writeJsonFileAtomic(ROUNDS_FILE, rounds);
    await syncToFirestore('rounds', id, updatedRound);

    logAuditEntry('ROUND_UPDATE', 'admin', `Updated leadership round: ${updatedRound.title}`);

    return res.json({ success: true, round: updatedRound });
  } catch (err: any) {
    console.error('Update round error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update round.' });
  }
});

// DELETE /api/rounds/:id - Delete Round (Admin only)
app.delete('/api/rounds/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const id = decodeURIComponent(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Round ID is required.' });
    }

    const delResult = await runWithFileLock(async () => {
      const rounds = getStoredRounds();
      const idx = rounds.findIndex((r: any) => r.id === id);

      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Round not found.' } };
      }

      const target = rounds[idx];
      const removed = rounds.splice(idx, 1)[0];
      writeJsonFileAtomic(ROUNDS_FILE, rounds);
      await deleteFromFirestore('rounds', id);

      logAuditEntry('ROUND_DELETE', 'admin', `Deleted leadership round: ${removed.title}`);

      return {
        status: 200,
        body: {
          success: true,
          message: `Round "${target.title}" successfully deleted.`,
        },
      };
    });

    return res.status(delResult.status).json(delResult.body);
  } catch (err: any) {
    console.error('Delete round error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete round.' });
  }
});

// --- PARTNERS & ACCREDITATIONS CRUD API (Priority 4 & 6) ---

// GET /api/partners
app.get('/api/partners', (req, res) => {
  const partners = getStoredPartners();
  const isAdmin = isAuthorizedAdmin(req);
  if (isAdmin) {
    return res.json({ success: true, partners });
  }
  return res.json({ success: true, partners: partners.filter((p: any) => p.isActive !== false) });
});

// POST /api/partners - Add Partner
app.post('/api/partners', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const { organizationName, logoUrl, relationshipType, description, verificationStatus, displayOrder, isActive, websiteUrl } = req.body;
    if (!organizationName || !organizationName.trim()) {
      return res.status(400).json({ success: false, error: 'Organization name is required.' });
    }

    const addResult = await runWithFileLock(async () => {
      const partners = getStoredPartners();
      const newPartner = {
        id: 'partner_' + Date.now().toString(36),
        organizationName: organizationName.trim(),
        logoUrl: logoUrl || '/assets/aistudio/logo_hospital_egypt_copy-05_43a268db.png',
        relationshipType: relationshipType || 'Hospital Network Accreditation',
        description: description?.trim() || '',
        verificationStatus: verificationStatus || 'verified',
        displayOrder: displayOrder ? Number(displayOrder) : partners.length + 1,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        websiteUrl: websiteUrl?.trim() || '',
        verifiedAt: new Date().toISOString(),
        verifiedBy: 'Clinical Governance Board',
      };

      partners.push(newPartner);
      writeJsonFileAtomic(PARTNERS_FILE, partners);
      await syncToFirestore('partners', newPartner.id, newPartner);

      logAuditEntry('PARTNER_ADD', 'admin', `Added partner/accreditation: ${newPartner.organizationName}`);
      return { status: 201, body: { success: true, partner: newPartner } };
    });

    return res.status(addResult.status).json(addResult.body);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to add partner.' });
  }
});

// PUT /api/partners/:id - Update Partner
app.put('/api/partners/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const id = decodeURIComponent(req.params.id || '').trim();
    const editResult = await runWithFileLock(async () => {
      const partners = getStoredPartners();
      const idx = partners.findIndex((p: any) => p.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Partner not found.' } };
      }

      partners[idx] = { ...partners[idx], ...req.body, id };
      writeJsonFileAtomic(PARTNERS_FILE, partners);
      await syncToFirestore('partners', id, partners[idx]);

      logAuditEntry('PARTNER_UPDATE', 'admin', `Updated partner/accreditation: ${partners[idx].organizationName}`);
      return { status: 200, body: { success: true, partner: partners[idx] } };
    });

    return res.status(editResult.status).json(editResult.body);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update partner.' });
  }
});

// DELETE /api/partners/:id - Delete Partner
app.delete('/api/partners/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const id = decodeURIComponent(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Partner ID is required.' });
    }

    const delResult = await runWithFileLock(async () => {
      const partners = getStoredPartners();
      const idx = partners.findIndex((p: any) => p.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Partner not found.' } };
      }

      const removed = partners.splice(idx, 1)[0];
      writeJsonFileAtomic(PARTNERS_FILE, partners);
      await deleteFromFirestore('partners', id);

      logAuditEntry('PARTNER_DELETE', 'admin', `Deleted partner/accreditation: ${removed.organizationName}`);
      return { status: 200, body: { success: true, message: `Partner ${removed.organizationName} deleted.` } };
    });

    return res.status(delResult.status).json(delResult.body);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete partner.' });
  }
});

// --- MEMBERSHIP BENEFITS CRUD API (Priority 4) ---

// GET /api/benefits
app.get('/api/benefits', (req, res) => {
  const benefits = getStoredBenefits();
  const isAdmin = isAuthorizedAdmin(req);
  if (isAdmin) {
    return res.json({ success: true, benefits });
  }
  return res.json({ success: true, benefits: benefits.filter((b: any) => b.isActive !== false) });
});

// POST /api/benefits - Add Benefit
app.post('/api/benefits', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const { title, category, description, conditions, iconName, displayOrder, isActive, termsUrl } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Benefit title is required.' });
    }

    const benefits = getStoredBenefits();
    const newBenefit = {
      id: 'benefit_' + Date.now().toString(36),
      title: title.trim(),
      category: category || 'Professional Development',
      description: description?.trim() || '',
      conditions: conditions?.trim() || '',
      iconName: iconName || 'Award',
      displayOrder: displayOrder ? Number(displayOrder) : benefits.length + 1,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      termsUrl: termsUrl?.trim() || '',
    };

    benefits.push(newBenefit);
    writeJsonFileAtomic(BENEFITS_FILE, benefits);
    await syncToFirestore('benefits', newBenefit.id, newBenefit);

    logAuditEntry('BENEFIT_ADD', 'admin', `Added membership benefit: ${newBenefit.title}`);
    return res.status(201).json({ success: true, benefit: newBenefit });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to add benefit.' });
  }
});

// PUT /api/benefits/:id - Update Benefit
app.put('/api/benefits/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const { id } = req.params;
    const benefits = getStoredBenefits();
    const idx = benefits.findIndex((b: any) => b.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Benefit not found.' });
    }

    benefits[idx] = { ...benefits[idx], ...req.body, id };
    writeJsonFileAtomic(BENEFITS_FILE, benefits);
    await syncToFirestore('benefits', id, benefits[idx]);

    logAuditEntry('BENEFIT_UPDATE', 'admin', `Updated membership benefit: ${benefits[idx].title}`);
    return res.json({ success: true, benefit: benefits[idx] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to update benefit.' });
  }
});

// DELETE /api/benefits/:id - Delete Benefit
app.delete('/api/benefits/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const id = decodeURIComponent(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Benefit ID is required.' });
    }

    const delResult = await runWithFileLock(async () => {
      const benefits = getStoredBenefits();
      const idx = benefits.findIndex((b: any) => b.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Benefit not found.' } };
      }

      const removed = benefits.splice(idx, 1)[0];
      writeJsonFileAtomic(BENEFITS_FILE, benefits);
      await deleteFromFirestore('benefits', id);

      logAuditEntry('BENEFIT_DELETE', 'admin', `Deleted membership benefit: ${removed.title}`);
      return { status: 200, body: { success: true, message: `Benefit ${removed.title} deleted.` } };
    });

    return res.status(delResult.status).json(delResult.body);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete benefit.' });
  }
});

// =========================================================================
// TOPIC MODERATION & KNOWLEDGE RESOURCES API
// =========================================================================

// GET /api/topics - Fetch Topics
app.get('/api/topics', (req, res) => {
  const isAdmin = isAuthorizedAdmin(req);
  const session = getCallerSession(req);
  const scope = req.query.scope;
  const topics = getStoredTopics();

  if (isAdmin || scope === 'all') {
    return res.json({ success: true, topics });
  }

  // Non-admins see approved or pinned topics, plus any topics created by themselves
  const filtered = topics.filter((t: any) => {
    if (t.status === 'approved' || t.status === 'pinned') return true;
    if (session && t.authorId === session.memberId) return true;
    return false;
  });

  return res.json({ success: true, topics: filtered });
});

// POST /api/topics - Submit Topic
app.post('/api/topics', async (req, res) => {
  try {
    const session = getCallerSession(req);
    const isAdmin = isAuthorizedAdmin(req);

    if (!isAdmin && !session) {
      return res.status(401).json({ success: false, error: 'Authentication required to submit topics.' });
    }

    const { title, category, body, tags } = req.body;
    if (!title || !body || !category) {
      return res.status(400).json({ success: false, error: 'Title, category, and body are required.' });
    }

    const members = getStoredMembers();
    const author = isAdmin ? INITIAL_ROOT_ADMIN : members.find((m: any) => m.id === session?.memberId);

    if (!isAdmin && author?.status !== 'approved') {
      return res.status(403).json({ success: false, error: 'Only approved members can publish leadership topics.' });
    }

    const newTopic = {
      id: 'top_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: String(title).trim(),
      category: String(category).trim(),
      body: String(body).trim(),
      authorId: author?.id || (isAdmin ? 'admin_ashraf' : 'unknown'),
      authorName: author?.fullName || 'Healthcare Leader',
      authorTitle: author?.jobTitle || 'Executive Member',
      authorOrg: author?.organization || 'Healthcare Facility',
      authorPhotoUrl: author?.consentPhotoPublish ? author?.profilePhotoUrl : undefined,
      status: isAdmin ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      publishedAt: isAdmin ? new Date().toISOString() : undefined,
      likeCount: 0,
      dislikeCount: 0,
      commentCount: 0,
      tags: Array.isArray(tags) ? tags : [],
    };

    await runWithFileLock(async () => {
      const topics = getStoredTopics();
      topics.unshift(newTopic);
      writeJsonFileAtomic(TOPICS_FILE, topics);
      await syncToFirestore('topics', newTopic.id, newTopic);
      logAuditEntry('TOPIC_CREATE', newTopic.authorId, `Created topic "${newTopic.title}" (Status: ${newTopic.status})`);
    });

    return res.json({ success: true, topic: newTopic });
  } catch (err: any) {
    console.error('Create topic error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create topic.' });
  }
});

// PUT /api/topics/:id - Admin Edit / Moderate Topic
app.put('/api/topics/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const { id } = req.params;
    const { title, category, body, status, tags } = req.body;

    const editResult = await runWithFileLock(async () => {
      const topics = getStoredTopics();
      const idx = topics.findIndex((t: any) => t.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Topic not found.' } };
      }

      const existing = topics[idx];
      if (title !== undefined) existing.title = String(title).trim();
      if (category !== undefined) existing.category = String(category).trim();
      if (body !== undefined) existing.body = String(body).trim();
      if (status !== undefined) {
        existing.status = status;
        if (status === 'approved' && !existing.publishedAt) {
          existing.publishedAt = new Date().toISOString();
        }
      }
      if (tags !== undefined) existing.tags = tags;
      existing.updatedAt = new Date().toISOString();

      topics[idx] = existing;
      writeJsonFileAtomic(TOPICS_FILE, topics);
      await syncToFirestore('topics', existing.id, existing);
      logAuditEntry('TOPIC_UPDATE', 'admin', `Updated topic "${existing.title}" (Status: ${existing.status})`);

      return { status: 200, body: { success: true, topic: existing } };
    });

    return res.status(editResult.status).json(editResult.body);
  } catch (err: any) {
    console.error('Update topic error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update topic.' });
  }
});

// DELETE /api/topics/:id - Admin Delete Topic
app.delete('/api/topics/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const id = decodeURIComponent(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Topic ID is required.' });
    }
    const delResult = await runWithFileLock(async () => {
      const topics = getStoredTopics();
      const idx = topics.findIndex((t: any) => t.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Topic not found.' } };
      }

      const removed = topics.splice(idx, 1)[0];
      writeJsonFileAtomic(TOPICS_FILE, topics);
      await deleteFromFirestore('topics', id);

      const comments = getStoredComments().filter((c: any) => c.topicId !== id);
      writeJsonFileAtomic(COMMENTS_FILE, comments);

      logAuditEntry('TOPIC_DELETE', 'admin', `Deleted topic "${removed.title}"`);
      return { status: 200, body: { success: true, message: `Topic "${removed.title}" deleted successfully.` } };
    });

    return res.status(delResult.status).json(delResult.body);
  } catch (err: any) {
    console.error('Delete topic error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete topic.' });
  }
});

// =========================================================================
// COMMENT & REFLECTION MODERATION API
// =========================================================================

// GET /api/comments - Fetch Comments
app.get('/api/comments', (req, res) => {
  const isAdmin = isAuthorizedAdmin(req);
  const session = getCallerSession(req);
  const topicId = req.query.topicId as string;
  const statusFilter = req.query.status as string;

  let comments = getStoredComments();

  if (topicId) {
    comments = comments.filter((c: any) => c.topicId === topicId);
  }

  if (isAdmin) {
    if (statusFilter && statusFilter !== 'all') {
      comments = comments.filter((c: any) => c.status === statusFilter);
    }
    return res.json({ success: true, comments });
  }

  // Non-admins see only approved comments, plus author's own comments
  const filtered = comments.filter((c: any) => {
    if (c.status === 'approved') return true;
    if (session && c.authorId === session.memberId) return true;
    return false;
  });

  return res.json({ success: true, comments: filtered });
});

// POST /api/comments - Submit Comment (Enters pending moderation)
app.post('/api/comments', async (req, res) => {
  try {
    const session = getCallerSession(req);
    const isAdmin = isAuthorizedAdmin(req);

    if (!isAdmin && !session) {
      return res.status(401).json({ success: false, error: 'Authentication required to post comments.' });
    }

    const { topicId, content } = req.body;
    if (!topicId || !content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Topic ID and content are required.' });
    }

    const members = getStoredMembers();
    const author = isAdmin ? INITIAL_ROOT_ADMIN : members.find((m: any) => m.id === session?.memberId);

    if (!isAdmin && author?.status !== 'approved') {
      return res.status(403).json({ success: false, error: 'Only approved members can post reflections.' });
    }

    const topics = getStoredTopics();
    const topic = topics.find((t: any) => t.id === topicId);

    const newComment = {
      id: 'cmt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      topicId,
      topicTitle: topic?.title || 'Leadership Roundtable',
      authorId: author?.id || (isAdmin ? 'admin_ashraf' : 'unknown'),
      authorName: author?.fullName || 'Healthcare Leader',
      authorTitle: author?.jobTitle || 'Executive Member',
      authorOrg: author?.organization || 'Healthcare Facility',
      authorPhotoUrl: author?.consentPhotoPublish ? author?.profilePhotoUrl : undefined,
      content: String(content).trim(),
      status: isAdmin ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    };

    await runWithFileLock(async () => {
      const comments = getStoredComments();
      comments.push(newComment);
      writeJsonFileAtomic(COMMENTS_FILE, comments);
      await syncToFirestore('comments', newComment.id, newComment);

      if (newComment.status === 'approved' && topic) {
        topic.commentCount = (topic.commentCount || 0) + 1;
        writeJsonFileAtomic(TOPICS_FILE, topics);
      }

      logAuditEntry('COMMENT_CREATE', newComment.authorId, `Posted reflection on topic ${topicId} (Status: ${newComment.status})`);
    });

    return res.json({ success: true, comment: newComment });
  } catch (err: any) {
    console.error('Create comment error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create comment.' });
  }
});

// PUT /api/comments/:id/status - Admin Approve / Reject Comment
app.put('/api/comments/:id/status', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'hidden'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid comment status.' });
    }

    const editResult = await runWithFileLock(async () => {
      const comments = getStoredComments();
      const idx = comments.findIndex((c: any) => c.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Comment not found.' } };
      }

      const prevStatus = comments[idx].status;
      comments[idx].status = status;
      comments[idx].moderatedAt = new Date().toISOString();
      writeJsonFileAtomic(COMMENTS_FILE, comments);
      await syncToFirestore('comments', id, comments[idx]);

      // Update topic comment count if transitioned to/from approved
      if (prevStatus !== 'approved' && status === 'approved') {
        const topics = getStoredTopics();
        const topic = topics.find((t: any) => t.id === comments[idx].topicId);
        if (topic) {
          topic.commentCount = (topic.commentCount || 0) + 1;
          writeJsonFileAtomic(TOPICS_FILE, topics);
        }
      } else if (prevStatus === 'approved' && status !== 'approved') {
        const topics = getStoredTopics();
        const topic = topics.find((t: any) => t.id === comments[idx].topicId);
        if (topic) {
          topic.commentCount = Math.max(0, (topic.commentCount || 1) - 1);
          writeJsonFileAtomic(TOPICS_FILE, topics);
        }
      }

      logAuditEntry('COMMENT_STATUS_UPDATE', 'admin', `Updated comment ${id} status to ${status}`);
      return { status: 200, body: { success: true, comment: comments[idx] } };
    });

    return res.status(editResult.status).json(editResult.body);
  } catch (err: any) {
    console.error('Update comment status error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update comment status.' });
  }
});

// DELETE /api/comments/:id - Admin Delete Comment
app.delete('/api/comments/:id', async (req, res) => {
  try {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Administrative authorization required.' });
    }

    const id = decodeURIComponent(req.params.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, error: 'Comment ID is required.' });
    }
    const delResult = await runWithFileLock(async () => {
      const comments = getStoredComments();
      const idx = comments.findIndex((c: any) => c.id === id);
      if (idx === -1) {
        return { status: 404, body: { success: false, error: 'Comment not found.' } };
      }

      const removed = comments.splice(idx, 1)[0];
      writeJsonFileAtomic(COMMENTS_FILE, comments);
      await deleteFromFirestore('comments', id);

      if (removed.status === 'approved') {
        const topics = getStoredTopics();
        const topic = topics.find((t: any) => t.id === removed.topicId);
        if (topic) {
          topic.commentCount = Math.max(0, (topic.commentCount || 1) - 1);
          writeJsonFileAtomic(TOPICS_FILE, topics);
        }
      }

      logAuditEntry('COMMENT_DELETE', 'admin', `Deleted comment ${id} by ${removed.authorName}`);
      return { status: 200, body: { success: true, message: 'Comment deleted successfully.' } };
    });

    return res.status(delResult.status).json(delResult.body);
  } catch (err: any) {
    console.error('Delete comment error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete comment.' });
  }
});

// --- AI Event Extraction Route (Preserved) ---
interface ExtractedRoundData {
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
  agenda: Array<{ time: string; title: string; description: string; speaker?: string }>;
  speakers: Array<{ name: string; title: string; organization: string }>;
  additionalNotes?: string;
  unclearOrMissingFields: string[];
  conflicts: string[];
}

function fallbackExtract(promptText: string): ExtractedRoundData {
  const lines = promptText.split('\n').map(l => l.trim()).filter(Boolean);
  const text = promptText;

  let title = 'Healthcare Leadership Symposium';
  const titleMatch = text.match(/(?:title|event|round|symposium|conference):\s*([^\n]+)/i);
  if (titleMatch) title = titleMatch[1].trim();
  else if (lines.length > 0) title = lines[0].replace(/^#+\s*/, '');

  let topic = 'Clinical Governance & Healthcare Excellence';
  const topicMatch = text.match(/(?:topic|theme|focus):\s*([^\n]+)/i);
  if (topicMatch) topic = topicMatch[1].trim();

  let scheduledDate = '';
  const dateMatch = text.match(
    /(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/i
  );
  if (dateMatch) scheduledDate = dateMatch[0];

  let scheduledTime = '10:00 AM - 02:00 PM';
  const timeMatch =
    text.match(/(?:time|hours):\s*([^\n]+)/i) ||
    text.match(/\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)\s*(?:-|to)\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm)/i);
  if (timeMatch) scheduledTime = timeMatch[1] ? timeMatch[1].trim() : timeMatch[0].trim();

  return {
    title,
    topic,
    description: text.slice(0, 300) || 'An executive leadership round convened at Saudi German Hospital Cairo.',
    scheduledDate: scheduledDate || 'To be confirmed',
    scheduledTime,
    durationMinutes: 180,
    venue: 'Saudi German Hospital Cairo Grand Auditorium, Cairo, Egypt',
    venueType: 'in_person',
    maxCapacity: 60,
    status: 'published',
    agenda: [
      { time: '10:00 - 10:30', title: 'Welcome & Registration', description: 'Opening reception and networking.' },
      { time: '10:30 - 12:30', title: 'Keynote & Panel Discussion', description: 'Interactive clinical leadership roundtable.' },
      { time: '12:30 - 01:30', title: 'Q&A and Networking Lunch', description: 'Peer reflections and closing remarks.' },
    ],
    speakers: [
      { name: 'Prof. Dr. Ahmed Hassan', title: 'Chief Medical Officer', organization: 'Saudi German Hospital Egypt' },
    ],
    additionalNotes: 'Extracted via intelligent parsing engine. Please verify details before publishing.',
    unclearOrMissingFields: scheduledDate ? [] : ['Scheduled Date not explicitly found in input'],
    conflicts: [],
  };
}

app.post('/api/rounds/extract-ai', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;
    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: 'Please provide either a text prompt or an image.' });
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const contents: any[] = [];
        const systemPrompt = `You are an expert healthcare leadership event coordinator for Saudi German Hospital Egypt.
Extract all event information from the user's natural language brief and/or uploaded agenda image into a structured JSON object adhering strictly to the schema:
{
  "title": string,
  "topic": string,
  "description": string,
  "scheduledDate": string,
  "scheduledTime": string,
  "durationMinutes": number,
  "venue": string,
  "venueType": "in_person" | "hybrid" | "virtual",
  "maxCapacity": number,
  "status": "draft" | "published",
  "agenda": [{ "time": string, "title": string, "description": string, "speaker": string }],
  "speakers": [{ "name": string, "title": string, "organization": string }],
  "additionalNotes": string,
  "unclearOrMissingFields": string[],
  "conflicts": string[]
}`;

        if (imageBase64) {
          const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
          contents.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: cleanBase64 } });
        }
        contents.push({ text: prompt || 'Extract all event details from this brief or image.' });

        const ai = getAi();
        if (ai) {
          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents,
            config: { responseMimeType: 'application/json', systemInstruction: systemPrompt },
          });
          if (response.text) {
            const parsed = JSON.parse(response.text);
            return res.json({ success: true, data: parsed, engine: 'gemini-3.8-flash' });
          }
        }
      } catch (geminiError: any) {
        console.warn('Gemini extraction fallback:', geminiError?.message);
      }
    }

    const fallbackData = fallbackExtract(prompt || 'Healthcare Leadership Round at Saudi German Hospital Cairo');
    return res.json({ success: true, data: fallbackData, engine: 'smart-fallback' });
  } catch (err: any) {
    return res.status(500).json({ error: 'An unexpected error occurred while analyzing the event brief.' });
  }
});

// Member approval email notification endpoint - COMPLETELY DISABLED PER COMMUNITY POLICY
app.post('/api/notify-approval', (_req, res) => {
  return res.json({
    success: true,
    delivered: false,
    channel: 'In-App Only',
    message: 'Automated email sending is permanently disabled per institutional policy.',
  });
});

// Health check probe
app.get('/api/health', (_req, res) => {
  return res.json({
    status: 'ok',
    service: 'healthcare-leadership-community',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    firestore: {
      connected: firestoreConnectionStatus.connected,
      initialized: firestoreConnectionStatus.initialized,
      databaseId: firestoreConnectionStatus.databaseId,
    },
  });
});

// Explicit 404 catch-all for any unhandled /api/* routes to prevent Vite from returning index.html
app.all('/api/*', (req, res) => {
  return res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.path}`,
  });
});

// Express error-handling middleware for API requests: guarantees JSON error responses, not HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.error(`[API ERROR] ${req.method} ${req.path}:`, err);
    return res.status(err.status || 500).json({
      success: false,
      error: err?.message || 'An unexpected server error occurred.',
    });
  }
  next(err);
});

// =========================================================================
// SERVER STARTUP & SHUTDOWN
// =========================================================================
async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    const indexPath = path.resolve(distPath, 'index.html');

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send('Application dist build not found. Please run npm run build.');
        }
      });
    } else {
      console.warn(`[WARN] Production dist directory (${distPath}) not found.`);
      app.get('*', (_req, res) => {
        res.status(503).send('Application build in progress. Please refresh in a moment.');
      });
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Healthcare Leadership Community server running at http://0.0.0.0:${PORT}`);
  });

  const handleShutdown = (signal: string) => {
    console.log(`Received ${signal}. Gracefully closing HTTP server...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

startServer();
