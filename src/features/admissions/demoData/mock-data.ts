import { CURRENT_USER, STATUS_CONFIG, defaultFeeFor } from "../constants";
import type {
  ActivityEvent,
  Admission,
  AdmissionStatus,
  Gender,
  Payment,
  PaymentMethod,
  PrimaryContact,
} from "../types/types";
import { buildPaymentMessage, buildStatusMessage, contactOf } from "../utils";

// Demo applications used until the admissions API exists.
// [student, gender, class, father, mother, primary contact, appliedOn, status, paid share (0 | 0.5 | 1), previous school]
type Row = [string, Gender, string, string, string, PrimaryContact, string, AdmissionStatus, number, string];

const rows: Row[] = [
  ["Ayesha Rahman", "Female", "Class 6", "Mizanur Rahman", "Salma Rahman", "father", "2026-10-21", "approved", 1, "Sunbeams School"],
  ["Tanvir Hasan", "Male", "Class 9", "Kamrul Hasan", "Nasrin Hasan", "father", "2026-10-20", "pending", 0, "Ideal School & College"],
  ["Nusrat Jahan", "Female", "Class 3", "Abdul Jalil", "Shirin Akter", "mother", "2026-10-19", "in_review", 0, "Little Jewels"],
  ["Arif Chowdhury", "Male", "Class 7", "Faruk Chowdhury", "Rehana Chowdhury", "father", "2026-10-18", "rejected", 0, "Govt. Lab School"],
  ["Sadia Islam", "Female", "Class 1", "Rafiqul Islam", "Morium Islam", "father", "2026-10-18", "approved", 0.5, "Kids Garden"],
  ["Rafsan Ahmed", "Male", "KG", "Shahid Ahmed", "Nazma Begum", "mother", "2026-10-17", "pending", 0, ""],
  ["Mahira Khan", "Female", "Class 5", "Imran Khan", "Farhana Khan", "father", "2026-10-16", "waitlisted", 0, "Scholastica"],
  ["Ibrahim Hossain", "Male", "Class 8", "Delwar Hossain", "Kohinoor Begum", "father", "2026-10-15", "in_review", 0, "Motijheel Model School"],
  ["Tasnia Ferdous", "Female", "Nursery", "Anwar Ferdous", "Ruma Ferdous", "mother", "2026-10-15", "approved", 1, ""],
  ["Sakib Al Hasan", "Male", "Class 10", "Mashrafe Hasan", "Shimu Akter", "guardian", "2026-10-14", "pending", 0, "Notre Dame College"],
  ["Lamia Akter", "Female", "Class 4", "Harun Akter", "Jahanara Akter", "mother", "2026-10-13", "approved", 1, "Viqarunnisa Noon"],
  ["Zayan Mahmud", "Male", "Play", "Selim Mahmud", "Tania Mahmud", "father", "2026-10-12", "pending", 0, ""],
  ["Fariha Tabassum", "Female", "Class 2", "Monir Hossain", "Tahmina Tabassum", "father", "2026-10-11", "in_review", 0, "Green Herald"],
  ["Nafis Iqbal", "Male", "Class 6", "Tamim Iqbal", "Ayesha Iqbal", "father", "2026-10-10", "approved", 1, "Willes Little Flower"],
  ["Maliha Rahman", "Female", "Class 9", "Habibur Rahman", "Shahana Rahman", "mother", "2026-10-09", "rejected", 0, "Holy Cross School"],
  ["Ehsan Kabir", "Male", "Class 3", "Humayun Kabir", "Dilara Kabir", "father", "2026-10-08", "waitlisted", 0, "Udayan School"],
  ["Anika Tahsin", "Female", "KG", "Tahsin Ahmed", "Sumi Ahmed", "father", "2026-10-07", "approved", 1, ""],
  ["Rayhan Uddin", "Male", "Class 7", "Jasim Uddin", "Rokeya Uddin", "father", "2026-10-06", "pending", 0, "BAF Shaheen College"],
  ["Samira Haque", "Female", "Class 8", "Azizul Haque", "Laila Haque", "father", "2026-10-05", "approved", 1, "Mastermind School"],
  ["Tahmid Hasan", "Male", "Class 1", "Nayeem Hasan", "Farzana Hasan", "mother", "2026-10-04", "in_review", 0, "Kids Campus"],
  ["Nabila Sultana", "Female", "Class 10", "Golam Sultan", "Rabeya Sultana", "guardian", "2026-10-03", "approved", 0.5, "Rajuk Uttara Model"],
  ["Ariyan Sarker", "Male", "Class 5", "Bimal Sarker", "Mitali Sarker", "father", "2026-10-02", "rejected", 0, "St. Joseph School"],
  ["Jannatul Ferdous", "Female", "Play", "Kabir Ferdous", "Rokeya Begum", "mother", "2026-10-01", "pending", 0, ""],
  ["Mushfiq Rahim", "Male", "Class 4", "Mahbub Rahim", "Nargis Rahim", "father", "2026-09-29", "approved", 1, "Cantonment Public School"],
  ["Sumaiya Noor", "Female", "Class 6", "Noor Mohammad", "Hasina Noor", "father", "2026-09-27", "waitlisted", 0, "Agrani School"],
  ["Fahad Karim", "Male", "Nursery", "Rezaul Karim", "Shamima Karim", "mother", "2026-09-25", "approved", 1, ""],
  ["Raisa Anjum", "Female", "Class 7", "Anjum Hossain", "Anjum Ara", "mother", "2026-09-22", "in_review", 0, "South Point School"],
  ["Imtiaz Alam", "Male", "Class 2", "Shafiul Alam", "Nasima Alam", "father", "2026-09-20", "pending", 0, "Little Angels"],
];

const AREAS = ["Dhanmondi", "Mirpur", "Uttara", "Gulshan", "Mohammadpur", "Banani", "Bashundhara", "Motijheel"];
const FATHER_JOBS = ["Businessman", "Engineer", "Banker", "Doctor", "Govt. Officer", "Teacher", "Lawyer"];
const MOTHER_JOBS = ["Homemaker", "Teacher", "Doctor", "Banker", "Homemaker", "Entrepreneur"];
const METHODS: PaymentMethod[] = ["bkash", "cash", "nagad", "bank", "bkash", "rocket"];
const BLOOD = ["A+", "B+", "O+", "AB+", "O-", "B-"];

const REASONS: Partial<Record<AdmissionStatus, string>> = {
  rejected: "Did not pass the admission test",
  waitlisted: "Class capacity is currently full",
  in_review: "Documents received — admission test will be scheduled",
  approved: "Passed the admission test",
};

function phoneFor(seed: number) {
  return `01${7 + (seed % 3)}${String(10000000 + seed * 734521).slice(0, 8)}`;
}

function birthYearFor(applyingClass: string) {
  const grade = Number(applyingClass.replace("Class ", ""));
  if (Number.isNaN(grade)) return applyingClass === "KG" ? 2021 : applyingClass === "Nursery" ? 2022 : 2023;
  return 2020 - grade;
}

function addDays(isoDate: string, days: number, hour: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour - 6); // Dhaka time → UTC
  return d.toISOString();
}

let receiptCounter = 5000;

export const demoAdmissions: Admission[] = rows.map(
  ([studentName, gender, applyingClass, fatherName, motherName, primaryContact, appliedOn, status, paidShare, previousSchool], i) => {
    const area = AREAS[i % AREAS.length]!;
    const address = `House ${12 + i}, Road ${(i % 9) + 2}, ${area}, Dhaka`;
    const admissionFee = defaultFeeFor(applyingClass);

    const base: Admission = {
      id: `ADM-2026-${String(1042 - i).padStart(4, "0")}`,
      photo: null,
      studentName,
      studentNameBn: "",
      gender,
      dateOfBirth: `${birthYearFor(applyingClass)}-${String((i % 12) + 1).padStart(2, "0")}-${String(((i * 7) % 27) + 1).padStart(2, "0")}`,
      bloodGroup: BLOOD[i % BLOOD.length]!,
      religion: i % 9 === 4 ? "Hinduism" : "Islam",
      nationality: "Bangladeshi",
      birthCertificateNo: `2015${String(2690000000000 + i * 7919).slice(0, 13)}`,
      applyingClass,
      version: i % 4 === 0 ? "English" : "Bangla",
      shift: i % 3 === 0 ? "Day" : "Morning",
      source: i % 3 === 1 ? "office" : "online",
      previousSchool,
      previousClass: previousSchool ? applyingClass.replace(/\d+/, (n) => String(Math.max(1, Number(n) - 1))) : "",
      previousResult: previousSchool ? ["GPA 5.00", "GPA 4.75", "GPA 4.50", "A+", "A"][i % 5]! : "",
      father: {
        name: fatherName,
        occupation: FATHER_JOBS[i % FATHER_JOBS.length]!,
        phone: phoneFor(i * 2 + 1),
        email: `${fatherName.toLowerCase().split(" ")[0]}.${i + 1}@gmail.com`,
        nid: "",
      },
      mother: {
        name: motherName,
        occupation: MOTHER_JOBS[i % MOTHER_JOBS.length]!,
        phone: phoneFor(i * 2 + 2),
        email: i % 2 === 0 ? `${motherName.toLowerCase().split(" ")[0]}.${i + 1}@gmail.com` : "",
        nid: "",
      },
      primaryContact,
      localGuardian:
        primaryContact === "guardian"
          ? { name: "Abdur Rob", relation: "Uncle", phone: phoneFor(i + 90), email: "abdur.rob@gmail.com" }
          : { name: "", relation: "", phone: "", email: "" },
      presentAddress: address,
      permanentAddress: i % 3 === 0 ? `Village ${["Kalia", "Sonapur", "Rampur"][i % 3]}, ${["Cumilla", "Bogura", "Sylhet"][i % 3]}` : address,
      medicalNotes: i === 2 ? "Mild asthma — carries an inhaler." : "",
      documents: [
        { id: `doc-${i}-1`, name: "birth-certificate.pdf", size: 245_000 + i * 1000, type: "application/pdf" },
        ...(previousSchool ? [{ id: `doc-${i}-2`, name: "previous-report-card.jpg", size: 812_000, type: "image/jpeg" }] : []),
      ],
      admissionFee,
      internalNotes: "",
      appliedOn,
      status,
      payments: [],
      history: [],
    };

    // Build a realistic activity history for the demo.
    const history: ActivityEvent[] = [
      {
        id: `evt-${i}-0`,
        type: "submitted",
        title: base.source === "online" ? "Application submitted online" : "Application entered at the office",
        notifications: [{ channel: "sms", to: contactOf(base).phone, state: "sent" }],
        message: `Dear ${contactOf(base).name}, we have received the admission application of ${studentName} (${base.id}). Track it any time with this ID. — EduManage School`,
        at: addDays(appliedOn, 0, 10),
        by: base.source === "online" ? contactOf(base).name : CURRENT_USER,
      },
    ];
    const steps: AdmissionStatus[] =
      status === "pending" ? [] : status === "in_review" ? ["in_review"] : ["in_review", status];
    steps.forEach((s, step) => {
      const reason = REASONS[s] ?? "";
      history.push({
        id: `evt-${i}-${step + 1}`,
        type: "status",
        status: s,
        title: `Status changed to ${STATUS_CONFIG[s].label}`,
        note: reason,
        message: buildStatusMessage(s, base, reason),
        notifications: [
          { channel: "sms", to: contactOf(base).phone, state: "sent" },
          ...(contactOf(base).email ? [{ channel: "email" as const, to: contactOf(base).email, state: "sent" as const }] : []),
        ],
        at: addDays(appliedOn, step, step === 0 ? 14 : 10),
        by: CURRENT_USER,
      });
    });

    const payments: Payment[] = [];
    if (paidShare > 0) {
      const method = METHODS[i % METHODS.length]!;
      const payment: Payment = {
        id: `pay-${i}`,
        receiptNo: `RCT-2026-${++receiptCounter}`,
        amount: Math.round(admissionFee * paidShare),
        method,
        transactionId: method === "cash" ? "" : `${["9F", "BK", "7C", "NG"][i % 4]}${(83920417 + i * 9137).toString(36).toUpperCase()}`,
        paidOn: addDays(appliedOn, 1, 12).slice(0, 10),
        receivedBy: CURRENT_USER,
        note: "",
      };
      payments.push(payment);
      history.push({
        id: `evt-${i}-pay`,
        type: "payment",
        title: `Payment received · ${payment.receiptNo}`,
        message: buildPaymentMessage(base, payment, admissionFee - payment.amount),
        notifications: [{ channel: "sms", to: contactOf(base).phone, state: "sent" }],
        at: addDays(appliedOn, 1, 12),
        by: CURRENT_USER,
      });
    }

    return { ...base, payments, history };
  },
);
