import postgres from "postgres";
import { runMigrations } from "./db-migrate.mjs";

function requireDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required. Copy .env.example to .env.local and set a PostgreSQL URL.");
  return value;
}

if (process.env.A3LAM_ALLOW_SYNTHETIC_SEED !== "true") {
  throw new Error("Synthetic seed is disabled. Set A3LAM_ALLOW_SYNTHETIC_SEED=true for an explicit development seed.");
}

const ARABIC_DIACRITICS = /[\u064B-\u065F\u0670]/g;

function normalizeArabic(value) {
  return value
    .trim()
    .toLocaleLowerCase("ar")
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/[\u200C\u200D]/g, "")
    .replace(/[^\p{L}\p{N}-]+/gu, " ")
    .replace(/\s+/g, " ");
}

const categories = [
  ["media", "media-journalism", "الإعلام والصحافة", "تصنيف تطويري لاختبار المنصة."],
  ["academia", "academia-research", "الأكاديميا والبحث", "تصنيف تطويري لاختبار المنصة."],
  ["culture", "culture-arts", "الثقافة والفنون", "تصنيف تطويري لاختبار المنصة."],
  ["business", "business-economy", "الأعمال والاقتصاد", "تصنيف تطويري لاختبار المنصة."],
  ["society", "society-impact", "المجتمع والتأثير", "تصنيف تطويري لاختبار المنصة."],
  ["science", "science-technology", "العلوم والتقنية", "تصنيف تطويري لاختبار المنصة."],
  ["sports", "sports", "الرياضة", "تصنيف تطويري لاختبار المنصة."],
];

const people = [
  {
    id: "dev-draft-profile",
    slug: "dev-draft-profile",
    name: "سجل تطويري — مسودة",
    nameArabic: "سجل تطويري — مسودة",
    shortBio: "بيانات اصطناعية لاختبار حالة المسودة.",
    biography: "هذا سجل تطويري اصطناعي، وليس سيرة شخص حقيقي.",
    categoryId: "media",
    occupation: "اختبار دورة المحتوى",
    status: "draft",
  },
  {
    id: "dev-review-profile",
    slug: "dev-review-profile",
    name: "سجل تطويري — قيد المراجعة",
    nameArabic: "سجل تطويري — قيد المراجعة",
    shortBio: "بيانات اصطناعية لاختبار حالة المراجعة.",
    biography: "هذا سجل تطويري اصطناعي، وليس سيرة شخص حقيقي.",
    categoryId: "academia",
    occupation: "اختبار دورة المحتوى",
    status: "review",
  },
  {
    id: "dev-published-test-profile",
    slug: "dev-published-test-profile",
    name: "سجل اختبار تطويري — منشور",
    nameArabic: "سجل اختبار تطويري — منشور",
    shortBio: "سجل اصطناعي مطلوب للتحقق من مسار النشر العام.",
    biography: "هذا سجل اختبار تطويري اصطناعي، وليس سيرة شخص حقيقي أو شخصية تاريخية.",
    categoryId: "science",
    occupation: "اختبار دورة النشر",
    status: "published",
  },
  {
    id: "dev-archived-profile",
    slug: "dev-archived-profile",
    name: "سجل تطويري — مؤرشف",
    nameArabic: "سجل تطويري — مؤرشف",
    shortBio: "بيانات اصطناعية لاختبار حالة الأرشفة.",
    biography: "هذا سجل تطويري اصطناعي، وليس سيرة شخص حقيقي.",
    categoryId: "culture",
    occupation: "اختبار دورة المحتوى",
    status: "archived",
  },
  {
    id: "dev-published-long-profile",
    slug: "dev-published-long-profile",
    name: "شخصية تجريبية — ليان نموذج",
    nameArabic: "شخصية تجريبية — ليان نموذج",
    shortBio: "محتوى اصطناعي لعرض تجربة القراءة الموسوعية الطويلة.",
    biography: `هذا محتوى اصطناعي مخصص لاختبار واجهة القراءة، وليس سيرة شخص حقيقي أو شخصية تاريخية.

## النشأة والتعليم
بدأ هذا المثال داخل مختبر تطويري صغير يختبر كيف تُعرض الفقرات العربية الطويلة مع مصادر واضحة. **كل التفاصيل هنا تجريبية** ولا تمثل وقائع أو إنجازات واقعية.

- فقرة اختبارية لعرض القوائم في السيرة.
- فقرة ثانية لقياس المسافة بين النقاط.
- فقرة ثالثة للتأكد من التفاف النص العربي واللاتيني مثل A3LAM.

## مسار العمل
يعرض هذا القسم نموذجًا محايدًا لمسار مهني مستقبلي يمكن ربطه بسجلات تحريرية موثقة. لا توجد في هذا السجل ادعاءات تاريخية أو مهنية حقيقية.

تُستخدم هذه الفقرة أيضًا لاختبار طول السطر والإيقاع الرأسي عند قراءة نص عربي ممتد على الهاتف واللوحي وسطح المكتب.`,
    categoryId: "science",
    occupation: "باحثة تجريبية في المحتوى",
    status: "published",
  },
  {
    id: "dev-published-companion-profile",
    slug: "dev-published-companion-profile",
    name: "شخصية تجريبية — سامي اختبار",
    nameArabic: "شخصية تجريبية — سامي اختبار",
    shortBio: "سجل اصطناعي ثانٍ لاختبار الاكتشاف المرتبط والتصنيف المشترك.",
    biography: "هذا سجل اصطناعي ثانٍ لاختبار بطاقات الأشخاص والملفات المرتبطة، وليس سيرة شخص حقيقي أو شخصية تاريخية.",
    categoryId: "science",
    occupation: "محرر تجريبي للمعرفة",
    status: "published",
  },
];

const sql = postgres(requireDatabaseUrl(), { max: 1, prepare: false });
try {
  await runMigrations(sql);
  await sql.begin(async (transaction) => {
    for (const [id, slug, name, description] of categories) {
      await transaction`
        INSERT INTO categories (id, slug, name, description, status)
        VALUES (${id}, ${slug}, ${name}, ${description}, 'published')
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          status = EXCLUDED.status,
          updated_at = NOW()
      `;
    }

    const sourceId = "dev-source-published";
    await transaction`
      INSERT INTO sources (id, title, publisher, url, publication_date, accessed_at, source_type, reliability, status)
      VALUES (${sourceId}, 'مصدر اصطناعي لاختبار النشر', 'A3LAM development fixtures', 'https://example.com/a3lam-development-source', NULL, CURRENT_DATE, 'official', 'low', 'published')
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        publisher = EXCLUDED.publisher,
        url = EXCLUDED.url,
        updated_at = NOW()
    `;

    for (const person of people) {
      const normalizedName = normalizeArabic(person.nameArabic);
      await transaction`
        INSERT INTO people (id, slug, name, name_arabic, short_bio, biography, image_url, status, search_name, search_name_arabic)
        VALUES (${person.id}, ${person.slug}, ${person.name}, ${person.nameArabic}, ${person.shortBio}, ${person.biography}, NULL, ${person.status}, ${normalizeArabic(person.name)}, ${normalizedName})
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          name_arabic = EXCLUDED.name_arabic,
          short_bio = EXCLUDED.short_bio,
          biography = EXCLUDED.biography,
          status = EXCLUDED.status,
          search_name = EXCLUDED.search_name,
          search_name_arabic = EXCLUDED.search_name_arabic,
          updated_at = NOW()
      `;
      await transaction`DELETE FROM person_categories WHERE person_id = ${person.id}`;
      await transaction`DELETE FROM person_occupations WHERE person_id = ${person.id}`;
      await transaction`DELETE FROM person_sources WHERE person_id = ${person.id}`;
      await transaction`
        INSERT INTO person_categories (person_id, category_id) VALUES (${person.id}, ${person.categoryId})
      `;
      await transaction`
        INSERT INTO person_occupations (person_id, occupation, occupation_normalized)
        VALUES (${person.id}, ${person.occupation}, ${normalizeArabic(person.occupation)})
      `;
      if (person.status === "published") {
        await transaction`INSERT INTO person_sources (person_id, source_id) VALUES (${person.id}, ${sourceId})`;
      }
    }

    await transaction`
      INSERT INTO timeline_events (id, person_id, event_date, title, description)
      VALUES ('dev-event-published', 'dev-published-test-profile', CURRENT_DATE, 'حدث اختبار تطويري', 'حدث اصطناعي للتحقق من علاقة timeline بالمصدر.')
      ON CONFLICT (id) DO UPDATE SET
        person_id = EXCLUDED.person_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        updated_at = NOW()
    `;
    await transaction`DELETE FROM timeline_event_sources WHERE event_id = 'dev-event-published'`;
    await transaction`INSERT INTO timeline_event_sources (event_id, source_id) VALUES ('dev-event-published', ${sourceId})`;

    await transaction`
      INSERT INTO education (id, person_id, institution, field, date_range, description)
      VALUES ('dev-education-published', 'dev-published-test-profile', 'مؤسسة اختبارية', 'مجال تطويري', '2026', 'سجل تعليمي اصطناعي للتحقق من العلاقة بالمصدر.')
      ON CONFLICT (id) DO UPDATE SET
        person_id = EXCLUDED.person_id,
        institution = EXCLUDED.institution,
        field = EXCLUDED.field,
        date_range = EXCLUDED.date_range,
        description = EXCLUDED.description,
        updated_at = NOW()
    `;
    await transaction`DELETE FROM education_sources WHERE education_id = 'dev-education-published'`;
    await transaction`INSERT INTO education_sources (education_id, source_id) VALUES ('dev-education-published', ${sourceId})`;
  });
  console.log("Synthetic development seed applied. It is not production content.");
} finally {
  await sql.end({ timeout: 5 });
}
