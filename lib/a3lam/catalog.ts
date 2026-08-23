import type { Category, ContentStatus, Person } from "@/lib/domain/a3lam";

export type DisplayPerson = {
  id: string;
  slug: string;
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
  slug: string;
  label: string;
  description: string;
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

export function toDisplayCategories(categories: Category[]): DisplayCategory[] {
  return categories.map((category, index) => ({
    id: category.id,
    slug: category.slug,
    label: category.name,
    description: category.description,
    count: String(index + 1).padStart(2, "0"),
    ...(categoryVisuals[category.id] ?? { icon: "•", tone: "teal" as const }),
  }));
}

export function toDisplayPeople(people: Person[], categories: Category[]): DisplayPerson[] {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  return people.map((person) => {
    const category = categoriesById.get(person.categoryIds[0]);
    const visuals = peopleVisuals[person.id] ?? { initials: person.nameArabic.slice(0, 2), tone: "teal" as const };
    return {
      id: person.id,
      slug: person.slug,
      name: person.nameArabic,
      role: category?.name ?? person.occupations[0] ?? "غير مصنف",
      meta: statusMeta(person.status),
      initials: visuals.initials,
      tone: visuals.tone,
      tags: person.occupations,
      status: person.status,
    };
  });
}

export function findDisplayPerson(people: DisplayPerson[], id: string) {
  return people.find((person) => person.id === id) ?? null;
}
