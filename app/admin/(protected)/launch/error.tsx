"use client";

import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";

type LaunchErrorProps = { reset: () => void };

export default function LaunchControlError({ reset }: LaunchErrorProps) {
  const copy = getMessages(defaultLocale);
  return (
    <div className="admin-route">
      <p className="admin-alert" role="alert">{copy.adminLaunchError}</p>
      <button className="button button-quiet" type="button" onClick={reset}>{copy.retryAction}</button>
    </div>
  );
}
