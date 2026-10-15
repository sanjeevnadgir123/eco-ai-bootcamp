export interface EcoEvent {
  id: string;
  title: string;
  description: string;
  category: 'Faculty & Student Innovation' | 'Faculty Excellence' | 'Student Life & Celebrations' | 'Workshops & Seminars';
  images: string[];
  tags?: string[];
  dateBadge?: string;
}

export interface AgendaTopic {
  title: string;
  description?: string;
  isHandsOn?: boolean;
}

export interface BootcampDay {
  day: number;
  date: string;
  dayOfWeek: string;
  themeTitle: string;
  themeSubtitle: string;
  topics: string[];
  handsOnHighlight?: string;
  iconName: string;
}

export interface SpeakerProfile {
  name: string;
  designation: string;
  organization: string;
  bioParagraphs: string[];
  areasOfExpertise: string[];
  quote?: string;
}

export type PaymentStatus = 'PENDING_PAYMENT' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
export type RegistrationStatus = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED';

export interface StudentRegistration {
  id: string;
  registrationId: string;
  fullName: string;
  email: string;
  phone: string;
  isEligible?: boolean;
  feeAmount: number;
  utrNumber?: string;
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
}

export interface EligibilityRecord {
  email: string;
  studentName: string;
  department: string;
  semester: string;
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
}
