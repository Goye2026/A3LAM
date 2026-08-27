import Link from "next/link";
import type { ReactNode } from "react";

export function AdminHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="admin-header">
      <div>
        <p className="admin-kicker">A3LAM CMS</p>
        <p className="admin-shell-title">{title}</p>
        {description ? <p className="admin-header-description">{description}</p> : null}
      </div>
      <span className="status-badge status-draft">CMS</span>
    </header>
  );
}

export function AdminBreadcrumbs({ current, homeLabel, ariaLabel }: { current: string; homeLabel: string; ariaLabel: string }) {
  return (
    <nav className="admin-breadcrumbs" aria-label={ariaLabel}>
      <Link href="/admin">{homeLabel}</Link>
      <span aria-hidden="true">/</span>
      <span aria-current="page">{current}</span>
    </nav>
  );
}

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="admin-page-header">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="admin-page-header-actions">{actions}</div> : null}
    </div>
  );
}

export function AdminContent({ children }: { children: ReactNode }) {
  return <div className="admin-content-body">{children}</div>;
}

export function AdminFooter({ homeLabel, logout }: { homeLabel: string; logout: ReactNode }) {
  return (
    <footer className="admin-sidebar-footer">
      <Link href="/">{homeLabel}</Link>
      {logout}
    </footer>
  );
}

export function AdminNotifications({ message }: { message?: string }) {
  return message ? <div className="admin-notifications" role="status" aria-live="polite">{message}</div> : null;
}

export function AdminStatusBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" }) {
  return <span className={`status-badge status-${tone}`}>{label}</span>;
}

export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="empty-state" role="status"><h3>{title}</h3>{description ? <p>{description}</p> : null}</div>;
}
