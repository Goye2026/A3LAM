import type { ReactNode } from "react";

export function AdminFoundationPanel({
  eyebrow,
  title,
  description,
  status,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  children?: ReactNode;
}) {
  return (
    <section className="admin-panel admin-foundation-panel" aria-labelledby="admin-foundation-title">
      <div className="admin-foundation-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="admin-foundation-title">{title}</h2>
        <p>{description}</p>
      </div>
      <p className="admin-foundation-status" role="status">{status}</p>
      {children ? <div className="admin-foundation-detail">{children}</div> : null}
    </section>
  );
}
