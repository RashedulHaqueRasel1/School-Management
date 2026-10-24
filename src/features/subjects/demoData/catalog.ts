import { CLASS_OPTIONS } from "@/features/admissions/constants";
import { slugify } from "@/features/admissions/utils";
import { FOURTH_SUBJECTS, RELIGION_SUBJECTS, SUBJECT_CODES, addDaysIso, localToday, subjectNamesFor } from "@/features/students/demoData/profile-data";

import type { Subject, SubjectSettings, SubjectType, SyllabusTopic, TopicStatus } from "../types/types";

/*
 * The national-curriculum subject catalog, derived from the same curriculum the
 * student profiles use. TODO (backend phase): GET /subjects
 */

/** Curriculum name → display name (early-childhood "General Knowledge"). */
export const displayName = (name: string) => (name === "Early Childhood" ? "General Knowledge" : name);
/** Display name → the name teachers list in their subjects. */
export const teacherSubjectName = (name: string) => (name === "General Knowledge" ? "Early Childhood" : name);

export const subjectSlug = (name: string) => slugify(name);

const isReligion = (name: string) => RELIGION_SUBJECTS.includes(name);

export function defaultType(name: string): SubjectType {
  if (isReligion(name)) return "Religion";
  if (FOURTH_SUBJECTS.includes(name)) return "Optional (4th)";
  if (["Arts & Crafts", "General Knowledge", "Early Childhood"].includes(name)) return "Pre-primary";
  return "Core";
}

const DESCRIPTIONS: Record<string, string> = {
  Bangla: "Mother-tongue literacy: reading, writing, grammar and Bangla literature (NCTB textbook).",
  English: "Communicative English — reading, writing, grammar and spoken practice.",
  Mathematics: "Number sense, arithmetic, algebra and geometry following the NCTB curriculum.",
  Science: "Integrated science — physical, life and earth science with simple experiments.",
  "Bangladesh & Global Studies": "History, geography, civics and the Liberation War of Bangladesh.",
  ICT: "Computer basics, digital citizenship, office tools and introductory programming.",
  Physics: "Mechanics, heat, light, sound, electricity and modern physics for SSC.",
  Chemistry: "Matter, periodic table, chemical bonding, reactions and the mole concept.",
  Biology: "Cells, human physiology, plants, genetics and ecology.",
  "Higher Mathematics": "Optional (4th) subject — algebra, trigonometry, geometry and calculus basics.",
  "Agriculture Studies": "Optional (4th) subject — crops, soil, livestock and fisheries.",
  "Arts & Crafts": "Drawing, colouring and hand-craft activities for early learners.",
  "General Knowledge": "Rhymes, stories, environment and everyday knowledge for early learners.",
};

/** Classes a curriculum subject is taught in (alternatives count where they can be chosen). */
function classesFor(name: string) {
  return CLASS_OPTIONS.filter((c) => {
    const subjects = [...subjectNamesFor(c, "Islam"), ...subjectNamesFor(c, "Hinduism")];
    const grade = Number(c.replace(/\D/g, ""));
    if (isReligion(name)) return subjects.some(isReligion);
    if (name === "Agriculture Studies") return grade >= 9;
    return subjects.includes(name);
  });
}

const CURRICULUM = [
  ...new Set(CLASS_OPTIONS.flatMap((c) => subjectNamesFor(c, "Islam"))),
  ...RELIGION_SUBJECTS.filter((r) => r !== "Islam & Moral Education"),
  "Agriculture Studies",
];

export const curriculumSubjects: Subject[] = CURRICULUM.map((raw) => {
  const name = displayName(raw);
  const settings: SubjectSettings = {
    code: SUBJECT_CODES[raw] ?? "GEN",
    type: defaultType(raw),
    classes: classesFor(raw),
    periodsPerWeek: ["Bangla", "English", "Mathematics"].includes(raw) ? 6 : 4,
    fullMarks: 100,
    passMarks: 33,
    description: DESCRIPTIONS[name] ?? (isReligion(raw) ? "Faith, values and moral education — students take the subject of their own religion." : ""),
  };
  return { ...settings, slug: subjectSlug(name), name, custom: false, archived: false };
});

/* ------------------------------------------------------------------ */
/* Syllabus                                                            */
/* ------------------------------------------------------------------ */

const TOPICS: Record<string, string[]> = {
  Bangla: ["Poems & rhymes", "Prose reading", "Grammar: parts of speech", "Letter & application writing", "Composition", "Story writing", "Comprehension", "Revision"],
  English: ["Reading: seen passages", "Grammar: tense", "Vocabulary & synonyms", "Paragraph writing", "Letter & email", "Dialogue writing", "Unseen comprehension", "Revision"],
  Mathematics: ["Numbers & place value", "Fractions & decimals", "Ratio & percentage", "Algebraic expressions", "Equations", "Geometry", "Measurement", "Statistics"],
  Science: ["Living things", "Matter & materials", "Force & motion", "Energy", "Light & sound", "Earth & sky", "Our environment", "Health & hygiene"],
  "Bangladesh & Global Studies": ["Our country", "History of Bengal", "Liberation War", "Geography of Bangladesh", "Citizenship & rights", "Economy", "World & SAARC", "Revision"],
  ICT: ["Computer basics", "Operating systems", "Word processing", "Spreadsheets", "Internet & safety", "Presentations", "Intro to programming", "Project"],
  Physics: ["Physical quantities", "Motion", "Force", "Work, power & energy", "Pressure", "Heat", "Waves & sound", "Electricity"],
  Chemistry: ["Concept of chemistry", "States of matter", "Atomic structure", "Periodic table", "Chemical bonds", "Mole concept", "Chemical reactions", "Acids & bases"],
  Biology: ["Life & cells", "Cell division", "Bio-energetics", "Food & nutrition", "Transport in organisms", "Coordination", "Reproduction", "Heredity & evolution"],
  "Higher Mathematics": ["Sets & functions", "Algebraic expressions", "Geometry", "Trigonometry", "Exponents & logarithms", "Binomial expansion", "Coordinate geometry", "Vectors"],
  "General Knowledge": ["My family", "My school", "Colours & shapes", "Animals & birds", "Fruits & vegetables", "Seasons", "Our country", "Good habits"],
  "Arts & Crafts": ["Free drawing", "Colouring", "Paper folding", "Clay modelling", "Collage", "Patterns", "Festival crafts", "Exhibition"],
};

const RELIGION_TOPICS = ["Belief & faith", "Worship", "Morality & ethics", "Lives of great personalities", "Festivals", "Rights of others", "Honesty & truth", "Revision"];

/** Demo syllabus: 8 topics, progress follows the session calendar (Jan → Nov). */
export function defaultSyllabus(subject: string, className: string): SyllabusTopic[] {
  const titles = TOPICS[subject] ?? (subject.includes("Religion") || subject.includes("Islam") ? RELIGION_TOPICS : Array.from({ length: 8 }, (_, i) => `Unit ${i + 1}`));
  const today = localToday();
  const year = today.slice(0, 4);
  const elapsed = Math.max(0, Math.min(1, (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${year}-01-01T00:00:00Z`)) / (Date.parse(`${year}-11-15T00:00:00Z`) - Date.parse(`${year}-01-01T00:00:00Z`))));
  const done = Math.floor(elapsed * titles.length);
  return titles.map((title, i) => {
    const status: TopicStatus = i < done ? "completed" : i === done ? "in-progress" : "upcoming";
    const month = addDaysIso(`${year}-01-10`, Math.round((i / titles.length) * 310)).slice(0, 7);
    return { id: `${subjectSlug(subject)}-${slugify(className)}-${i + 1}`, title: `${i + 1}. ${title}`, status, month };
  });
}

/** "Class 1–10", "Play–KG", or a list. */
export function classRange(classes: string[]) {
  const sorted = [...classes].sort((a, b) => CLASS_OPTIONS.indexOf(a) - CLASS_OPTIONS.indexOf(b));
  if (sorted.length === 0) return "—";
  const idx = sorted.map((c) => CLASS_OPTIONS.indexOf(c));
  const consecutive = idx.every((v, i) => v !== -1 && (i === 0 || v === idx[i - 1]! + 1));
  if (!consecutive || sorted.length < 3) return sorted.join(", ");
  const first = sorted[0]!;
  const last = sorted.at(-1)!;
  return first.startsWith("Class ") && last.startsWith("Class ") ? `Class ${first.slice(6)}–${last.slice(6)}` : `${first}–${last}`;
}
