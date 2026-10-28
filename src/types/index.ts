import { TopicCategory } from '../styles/tokens';

export type UserRole = 'visitor' | 'pending_member' | 'approved_member' | 'administrator';

export type MembershipStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Member {
  id: string;
  fullName: string;
  professionalEmail: string;
  jobTitle: string;
  organization: string;
  specialty: string;
  bio?: string;
  profilePhotoUrl?: string;
  linkedinUrl?: string;
  username?: string;
  approvalEmailSent?: boolean;
  approvalEmailSentAt?: string;
  role: UserRole;
  status: MembershipStatus;
  joinedAt: string;
  approvedAt?: string;
  reviewedBy?: string;
  
  // Explicit separate consents
  consentDirectoryDisplay: boolean;
  consentPhotoPublish: boolean;
  consentFutureCommunications: boolean;

  // Bilingual fields
  fullNameEn?: string;
  fullNameAr?: string;
  jobTitleEn?: string;
  jobTitleAr?: string;
  organizationEn?: string;
  organizationAr?: string;
  specialtyEn?: string;
  specialtyAr?: string;
  bioEn?: string;
  bioAr?: string;
}

export interface MemberPrivate {
  memberId: string;
  username?: string;
  password?: string;
  phone?: string;
  notes?: string;
  emailVerified: boolean;
  lastLoginAt: string;
}

export interface Speaker {
  id: string;
  name: string;
  title: string;
  organization: string;
  photoUrl?: string;
  avatarUrl?: string;
  bio?: string;

  // Bilingual fields
  nameEn?: string;
  nameAr?: string;
  titleEn?: string;
  titleAr?: string;
  organizationEn?: string;
  organizationAr?: string;
  bioEn?: string;
  bioAr?: string;
}

export interface AgendaItem {
  time: string;
  title: string;
  description?: string;
  speaker?: string;

  // Bilingual fields
  timeEn?: string;
  timeAr?: string;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  speakerEn?: string;
  speakerAr?: string;
}

export interface RoundMaterial {
  title: string;
  type: 'presentation' | 'case_study' | 'policy_brief' | 'agenda';
  url: string;
}

export type RoundStatus = 'draft' | 'published' | 'closed' | 'archived';
export type EventType = 'roundtable' | 'summit' | 'symposium';

export interface Round {
  id: string;
  title: string;
  topic: string;
  description: string;
  eventType?: EventType;
  scheduledDate: string; // ISO or human date
  scheduledTime: string;
  durationMinutes: number;
  venue: string;
  venueType: 'in_person' | 'hybrid' | 'virtual';
  virtualLink?: string;
  maxCapacity?: number;
  currentRegistrationsCount: number;
  status: RoundStatus;
  speakers: Speaker[];
  agenda: AgendaItem[];
  materials?: RoundMaterial[];
  createdAt: string;
  updatedAt?: string;
  isFirstAdminConfirmedRound?: boolean;

  // Bilingual fields
  titleEn?: string;
  titleAr?: string;
  topicEn?: string;
  topicAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  venueEn?: string;
  venueAr?: string;
  scheduledDateEn?: string;
  scheduledDateAr?: string;
  scheduledTimeEn?: string;
  scheduledTimeAr?: string;
}

export type PartnerRelationshipType =
  | 'Hospital Network Accreditation'
  | 'Clinical Governance Certification'
  | 'Academic & Educational Partner'
  | 'Professional Healthcare Association'
  | 'Strategic Healthcare Alliance'
  | string;

export type VerificationStatus = 'verified' | 'pending_verification' | 'unverified';

export interface PartnerAccreditation {
  id: string;
  organizationName: string;
  logoUrl?: string;
  relationshipType: PartnerRelationshipType;
  description: string;
  verificationStatus: VerificationStatus;
  displayOrder: number;
  isActive: boolean;
  websiteUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;

  // Bilingual fields
  organizationNameEn?: string;
  organizationNameAr?: string;
  relationshipTypeEn?: string;
  relationshipTypeAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
}

export interface MembershipBenefit {
  id: string;
  title: string;
  category: 'Academy & Education' | 'Professional Development' | 'Executive Networking' | 'Institutional Collaboration' | 'Leadership Roundtables';
  description: string;
  conditions: string;
  iconName: string;
  displayOrder: number;
  isActive: boolean;
  termsUrl?: string;

  // Bilingual fields
  titleEn?: string;
  titleAr?: string;
  categoryEn?: string;
  categoryAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  conditionsEn?: string;
  conditionsAr?: string;
}

export type RegistrationStatus = 'registered' | 'waitlisted' | 'cancelled';

export interface Registration {
  id: string;
  roundId: string;
  memberId: string;
  memberName: string;
  memberTitle: string;
  memberOrg: string;
  memberEmail: string;
  status: RegistrationStatus;
  registeredAt: string;
  notes?: string;
}

export interface Attendance {
  id: string;
  roundId: string;
  memberId: string;
  memberName: string;
  memberTitle: string;
  memberOrg: string;
  memberPhotoUrl?: string;
  attended: boolean;
  consentPhotoPublish: boolean;
  verifiedAt?: string;
  verifiedByAdminId?: string;
  cmeCreditsEarned: number;
  notes?: string;
}

export type TopicStatus = 'pending' | 'pending_review' | 'approved' | 'rejected' | 'pinned' | 'hidden';

export interface Topic {
  id: string;
  title: string;
  category: TopicCategory;
  body: string;
  authorId: string;
  authorName: string;
  authorTitle: string;
  authorOrg: string;
  authorPhotoUrl?: string;
  status: TopicStatus;
  createdAt: string;
  publishedAt?: string;
  likeCount: number;
  dislikeCount: number;
  commentCount: number;
  tags?: string[];
}

export type ReactionType = 'like' | 'dislike';

export interface TopicReaction {
  id: string;
  topicId: string;
  memberId: string;
  type: ReactionType;
  createdAt: string;
  updatedAt: string;
}

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'pending_moderation' | 'hidden';

export interface Comment {
  id: string;
  topicId: string;
  topicTitle?: string;
  authorId: string;
  authorName: string;
  authorTitle: string;
  authorOrg: string;
  authorPhotoUrl?: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
}

export interface ConsentRecord {
  id: string;
  memberId: string;
  consentDirectoryDisplay: boolean;
  consentPhotoPublish: boolean;
  consentFutureCommunications: boolean;
  version: string;
  acceptedAt: string;
}

export interface EmailNotification {
  id: string;
  memberId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  sentAt: string;
  status: 'delivered' | 'simulated';
  type: 'approval' | 'welcome' | 'round_invitation';
}
