import { personService } from "@/lib/services/personService";
import type { ContentStatus } from "@/lib/domain/a3lam";

export type DisplayPerson = {
  id: string;
  name: string;
  role: string;
  meta: string;
  initials: string;
  tone: "teal" | "sand" | "ink";
  tags: string[];
  status: ContentStatus;
};

export type DisplayCategory = {
  id: string;
  label: string;
  count: string;
  icon: string;
  tone: "teal" | "sand" | "ink";
};

const categoryVisuals: Record<string, Pick<DisplayCategory, "icon" | "tone">> = {
  media: { icon: "↗", tone: "teal" },
  academia: { icon: "⌁", tone: "sand" },
  culture: { icon: "✦", tone: "ink" },
  business: { icon: "◌", tone: "teal" },
  society: { icon: "＋", tone: "sand" },
  science: { icon: "⌬", tone: "ink" },
  sports: { icon: "◈", tone: "sand" },
};

const peopleVisuals: Record<string, Pick<DisplayPerson, "initials" | "tone">> = {
  "sample-profile-one": { initials: "ش١", tone: "teal" },
  "sample-profile-two": { initials: "ش٢", tone: "sand" },
  "sample-profile-three": { initials: "ش٣", tone: "ink" },
};

function statusMeta(status: ContentStatus) {
  switch (status) {
    case "draft":
      return "مسودة غير منشورة";
    case "review":
      return "قيد المراجعة";
    case "archived":
      return "مؤرشف وغير منشور";
    case "published":
      return "منشور";
  }
}

export const displayCategories: DisplayCategory[] = personService.listCategories().map((category, index) => ({
  id: category.id,
  label: category.name,
  count: String(index + 1).padStart(2, "0"),
  ...categoryVisuals[category.id],
}));

export const displayPeople: DisplayPerson[] = personService.listDisplayPeople().map((person) => {
  const category = personService.listCategories().find((item) => item.id === person.categoryIds[0]);
  const visuals = peopleVisuals[person.id] ?? { initials: "ش", tone: "teal" as const };
  return {
    id: person.id,
    name: person.nameArabic,
    role: category?.name ?? person.occupations[0] ?? "غير مصنف",
    meta: `اليمن · ${statusMeta(person.status)}`,
    initials: visuals.initials,
    tone: visuals.tone,
    tags: person.occupations,
    status: person.status,
  };
});

export function findDisplayPerson(id: string) {
  return displayPeople.find((person) => person.id === id) ?? null;
}
