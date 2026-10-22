export type AdmissionStatus = "pending" | "in_review" | "approved" | "waitlisted" | "rejected";

export type Gender = "Male" | "Female";

export type ParentInfo = {
  name: string;
  occupation: string;
  phone: string;
  email: string;
  nid: string;
};

export type LocalGuardian = {
  name: string;
  relation: string;
  phone: string;
  email: string;
};

/** Who receives SMS / email updates about this application. */
export type PrimaryContact = "father" | "mother" | "guardian";

export type PaymentMethod = "cash" | "bkash" | "nagad" | "rocket" | "bank" | "card";

export type Payment = {
  id: string;
  receiptNo: string;
  amount: number;
  method: PaymentMethod;
  /** Mobile-banking TrxID / bank reference. Empty for cash. */
  transactionId: string;
  /** ISO date (YYYY-MM-DD) */
  paidOn: string;
  receivedBy: string;
  note: string;
};

export type NotificationChannel = "sms" | "email";

/**
 * Delivery state of a guardian notification.
 * The UI only creates `queued` items — the backend sends them and updates the state.
 */
export type NotificationState = "queued" | "sent" | "failed";

export type GuardianNotification = {
  channel: NotificationChannel;
  /** Phone number or email address. */
  to: string;
  state: NotificationState;
};

export type ActivityEvent = {
  id: string;
  type: "submitted" | "status" | "payment" | "updated";
  /** New status, for `status` events. */
  status?: AdmissionStatus;
  title: string;
  /** Internal reason / remark written by the admin. */
  note?: string;
  /** Exact text sent to the guardian. */
  message?: string;
  notifications: GuardianNotification[];
  /** ISO date-time */
  at: string;
  by: string;
};

export type DocumentFile = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export type Admission = {
  id: string;
  /** Small data-URL image in the demo; a storage URL once the backend exists. */
  photo: string | null;

  // Student
  studentName: string;
  studentNameBn: string;
  gender: Gender;
  /** ISO date (YYYY-MM-DD) */
  dateOfBirth: string;
  bloodGroup: string;
  religion: string;
  nationality: string;
  birthCertificateNo: string;

  // Admission
  applyingClass: string;
  version: "Bangla" | "English";
  shift: "Morning" | "Day";
  source: "online" | "office";

  // Previous education
  previousSchool: string;
  previousClass: string;
  previousResult: string;

  // Family
  father: ParentInfo;
  mother: ParentInfo;
  primaryContact: PrimaryContact;
  /** Used when `primaryContact` is "guardian". */
  localGuardian: LocalGuardian;

  // Address & health
  presentAddress: string;
  permanentAddress: string;
  medicalNotes: string;

  documents: DocumentFile[];

  // Office
  admissionFee: number;
  internalNotes: string;

  // System-managed
  /** ISO date (YYYY-MM-DD) */
  appliedOn: string;
  status: AdmissionStatus;
  payments: Payment[];
  history: ActivityEvent[];
};

/** Everything the application form edits. */
export type AdmissionInput = Omit<Admission, "id" | "appliedOn" | "status" | "payments" | "history">;

export type PaymentInput = Omit<Payment, "id" | "receiptNo">;

export type PaymentStatus = "paid" | "partial" | "unpaid";

export type AdmissionSort = "newest" | "oldest" | "name-asc" | "name-desc";

export type AdmissionFilters = {
  search: string;
  status: AdmissionStatus | "all";
  applyingClass: string;
  gender: Gender | "all";
  fee: PaymentStatus | "all";
  sort: AdmissionSort;
};
