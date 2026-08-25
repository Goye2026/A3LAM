import { AdminFoundationPanel } from "@/components/a3lam/AdminFoundationPanel";
import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

export function AdminStatusPage({
  title,
  description,
  status,
  detail,
}: {
  title: string;
  description: string;
  status: string;
  detail?: string;
}) {
  const copy = getMessages(defaultLocale);
  return (
    <div className="admin-route">
      <header className="admin-route-heading">
        <div>
          <p className="eyebrow">{copy.adminControlCenter}</p>
          <h1>{title}</h1>
          <p className="route-description">{description}</p>
        </div>
      </header>
      <AdminFoundationPanel
        eyebrow={copy.adminControlCenter}
        title={title}
        description={copy.adminUnavailableDescription}
        status={status}
      >
        {detail ? <p className="section-help">{detail}</p> : null}
      </AdminFoundationPanel>
    </div>
  );
}
