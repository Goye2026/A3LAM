import Link from "next/link";
import type { DisplayCategory } from "@/lib/a3lam/catalog";

type CategoryCardProps = {
  category: DisplayCategory;
};

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link className={`category-card category-${category.tone}`} href={`/categories/${category.slug}`}
 aria-label={`${category.label}: ${category.description}`}>
      <span className="category-number" aria-hidden="true">{category.indexLabel}</span>
      <span className="category-icon" aria-hidden="true">
        {category.icon}
      </span>
      <span className="category-label">{category.label}</span>
      <span className="category-description">{category.description}</span>
      <span className="category-arrow" aria-hidden="true">
        ↗
      </span>
    </Link>
  );
}
