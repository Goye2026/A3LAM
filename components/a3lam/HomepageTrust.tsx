import type { PublicMessages } from "@/lib/i18n/messages";

type HomepageTrustProps = { copy: PublicMessages };

export function HomepageTrust({ copy }: HomepageTrustProps) {
  const principles = [
    { index: "01", title: copy.trustSourcesTitle, description: copy.trustSourcesDescription },
    { index: "02", title: copy.trustArabicTitle, description: copy.trustArabicDescription },
    { index: "03", title: copy.trustGrowthTitle, description: copy.trustGrowthDescription },
  ];

  return (
    <section className="trust-section section-block" id="trust" aria-labelledby="trust-title">
      <div className="trust-intro">
        <p className="eyebrow">{copy.trustEyebrow}</p>
        <h2 id="trust-title">{copy.aboutTitle}</h2>
        <p className="section-description">{copy.aboutDescription}</p>
      </div>
      <div className="trust-principles">
        {principles.map((principle) => (
          <article className="trust-principle" key={principle.index}>
            <span className="trust-principle-index" aria-hidden="true">{principle.index}</span>
            <h3>{principle.title}</h3>
            <p>{principle.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
