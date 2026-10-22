import type { Student } from "../types/types";

// Students already studying at the school (demo). New students are added
// automatically from paid admissions — see hooks/use-students.ts.

const BOYS = ["Rahim Uddin", "Karim Hossain", "Sabbir Ahmed", "Fardin Islam", "Nayeem Hasan", "Shakib Khan", "Rifat Chowdhury", "Tawsif Rahman", "Mahin Kabir", "Arafat Hossain", "Siam Ahmed", "Nafees Alam", "Rakib Hasan", "Junaid Karim", "Ayaan Rahman", "Tahsin Ahmed", "Imran Hossain", "Zubair Islam", "Rayan Chowdhury", "Samin Yasar"];
const GIRLS = ["Fatema Akter", "Tasfia Rahman", "Nadia Islam", "Sumaiya Khan", "Anika Chowdhury", "Jarin Tasnim", "Mim Akter", "Raisa Islam", "Nowshin Rahman", "Tahia Hossain", "Lamisa Haque", "Adiba Sultana", "Ishrat Jahan", "Farhana Yasmin", "Samia Ahmed", "Orpa Das", "Rupkotha Saha", "Maisha Kabir", "Zarin Subah", "Afia Noor"];
const FATHERS = ["Abdul", "Mohammad", "Golam", "Shafiqul", "Anisur", "Kamal", "Jahangir", "Nurul", "Ashraf", "Habib"];
const AREAS = ["Dhanmondi", "Mirpur", "Uttara", "Gulshan", "Mohammadpur", "Banani", "Bashundhara", "Motijheel"];
const BLOOD = ["A+", "B+", "O+", "AB+", "O-", "B-", "A-"];

export const existingStudents: Omit<Student, "roll">[] = Array.from({ length: 40 }, (_, i) => {
  const isBoy = i % 2 === 0;
  const name = (isBoy ? BOYS : GIRLS)[Math.floor(i / 2)]!;
  const lastName = name.split(" ").slice(-1)[0]!;
  const grade = (i % 10) + 1;
  const joinedYear = 2026 - Math.min(grade - 1, 5);
  const seq = 100 + i * 7;

  return {
    id: `STU-${joinedYear}-${String(seq).padStart(4, "0")}`,
    name,
    photo: null,
    gender: isBoy ? "Male" : "Female",
    dateOfBirth: `${2019 - grade}-${String((i % 12) + 1).padStart(2, "0")}-${String(((i * 5) % 27) + 1).padStart(2, "0")}`,
    bloodGroup: BLOOD[i % BLOOD.length]!,
    className: `Class ${grade}`,
    section: Math.floor(i / 10) % 2 === 0 ? "A" : "B",
    version: i % 5 === 0 ? "English" : "Bangla",
    shift: i % 3 === 0 ? "Day" : "Morning",
    guardianName: `${FATHERS[i % FATHERS.length]} ${lastName}`,
    guardianRelation: "Father",
    phone: `01${7 + (i % 3)}${String(20000000 + i * 613297).slice(0, 8)}`,
    email: i % 3 === 0 ? `${FATHERS[i % FATHERS.length]!.toLowerCase()}.${lastName.toLowerCase()}@gmail.com` : "",
    address: `House ${30 + i}, Road ${(i % 11) + 1}, ${AREAS[i % AREAS.length]}, Dhaka`,
    enrolledOn: `${joinedYear}-01-${String((i % 20) + 5).padStart(2, "0")}`,
    source: "existing",
    feeDue: 0,
  };
});
