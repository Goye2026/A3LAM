export type DisplayPerson = {
  id: string;
  name: string;
  role: string;
  meta: string;
  initials: string;
  tone: "teal" | "sand" | "ink";
  tags: string[];
};

export type DisplayCategory = {
  id: string;
  label: string;
  count: string;
  icon: string;
  tone: "teal" | "sand" | "ink";
};

export const displayPeople: DisplayPerson[] = [
  {
    id: "sample-profile-one",
    name: "نموذج شخصية أولى",
    role: "الإعلام والصحافة",
    meta: "اليمن · ملف قيد المراجعة",
    initials: "ش١",
    tone: "teal",
    tags: ["إعلام", "صحافة"],
  },
  {
    id: "sample-profile-two",
    name: "نموذج شخصية ثانية",
    role: "الأكاديميا والبحث",
    meta: "اليمن · ملف قيد المراجعة",
    initials: "ش٢",
    tone: "sand",
    tags: ["بحث", "أكاديميا"],
  },
  {
    id: "sample-profile-three",
    name: "نموذج شخصية ثالثة",
    role: "الثقافة والفنون",
    meta: "اليمن · ملف قيد المراجعة",
    initials: "ش٣",
    tone: "ink",
    tags: ["ثقافة", "فنون"],
  },
];

export const displayCategories: DisplayCategory[] = [
  { id: "media", label: "الإعلام والصحافة", count: "01", icon: "↗", tone: "teal" },
  { id: "academia", label: "الأكاديميا والبحث", count: "02", icon: "⌁", tone: "sand" },
  { id: "culture", label: "الثقافة والفنون", count: "03", icon: "✦", tone: "ink" },
  { id: "business", label: "الأعمال والاقتصاد", count: "04", icon: "◌", tone: "teal" },
  { id: "society", label: "المجتمع والتأثير", count: "05", icon: "＋", tone: "sand" },
  { id: "science", label: "العلوم والتقنية", count: "06", icon: "⌬", tone: "ink" },
  { id: "sports", label: "الرياضة", count: "07", icon: "◈", tone: "sand" },
];

export function findDisplayPerson(id: string) {
  return displayPeople.find((person) => person.id === id) ?? displayPeople[0];
}
