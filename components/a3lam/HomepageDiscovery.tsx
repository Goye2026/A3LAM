import Link from "next/link";
import type { PublicMessages } from "@/lib/i18n/messages";

type HomepageDiscoveryProps = { copy: PublicMessages };

export function HomepageDiscovery({ copy }: HomepageDiscoveryProps) {
  return (
    <section className="discovery-foundation section-block" aria-labelledby="discovery-foundation-title">
      <div className="discovery-foundation-visual" aria-hidden="true">
        <span className="discovery-line discovery-line-one" />
        <span className="discovery-line discovery-line-two" />
        <span className="discovery-node discovery-node-one" />
        <span className="discovery-node discovery-node-two" />
        <span className="discovery-node discovery-node-three" />
        <span className="discovery-coordinate">A3LAM / DISCOVERY</span>
      </div>
      <div className="discovery-foundation-content">
        <p className="eyebrow">{copy.discoveryEyebrow}</p>
        <h2 id="discovery-foundation-title">{copy.discoveryTitle}</h2>
        <p className="section-description">{copy.discoveryDescription}</p>
        <div className="discovery-deferred" role="status">
          <span className="discovery-deferred-label">{copy.discoveryDeferredLabel}</span>
          <p>{copy.discoveryDeferred}</p>
        </div>
        <div className="discovery-foundation-actions">
          <Link className="text-link" href="/search">{copy.discoverySearchAction}<span aria-hidden="true">↗</span></Link>
          <Link className="text-link" href="/categories">{copy.discoveryCategoriesAction}<span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}
