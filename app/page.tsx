import { defaultLocale } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import {
  Button,
  FoundationLink,
  Heading,
  Surface,
  Text,
} from "@/components/foundation/Primitives";

export default function FoundationPage() {
  const copy = getMessages(defaultLocale);
  const foundationSamples = [
    { label: copy.sampleArabicLabel, value: copy.sampleArabicValue },
    { label: copy.sampleMixedLabel, value: copy.sampleMixedValue },
    { label: copy.sampleNumbersLabel, value: copy.sampleNumbersValue },
  ] as const;

  return (
    <main className="shell">
      <header className="site-header" aria-label={copy.brandName}>
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            أ
          </span>
          <div>
            <p className="eyebrow">{copy.brandEyebrow}</p>
            <p className="brand-name">{copy.brandName}</p>
          </div>
        </div>
        <span className="status-chip" role="status">
          {copy.phaseStatus}
        </span>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">{copy.heroEyebrow}</p>
          <Heading level={1} id="page-title">
            {copy.heroTitle}
          </Heading>
          <Text className="hero-lede">{copy.heroLede}</Text>
          <div className="action-row">
            <Button className="button button-primary" type="button">
              {copy.primaryAction}
            </Button>
            <FoundationLink className="button button-secondary" href="#tokens">
              {copy.secondaryAction}
            </FoundationLink>
          </div>
        </div>
        <Surface className="hero-note" aria-label={copy.scopeKicker}>
          <span className="note-kicker">{copy.scopeKicker}</span>
          <strong>{copy.scopeTitle}</strong>
          <span>{copy.scopeDescription}</span>
        </Surface>
      </section>

      <section className="sample-grid" aria-labelledby="samples-title">
        <div className="section-heading">
          <p className="eyebrow">{copy.samplesEyebrow}</p>
          <Heading level={2} id="samples-title">
            {copy.samplesTitle}
          </Heading>
        </div>
        <div className="sample-cards">
          {foundationSamples.map((sample) => (
            <Surface className="sample-card" key={sample.label}>
              <p className="sample-label">{sample.label}</p>
              <p className="sample-value">{sample.value}</p>
            </Surface>
          ))}
        </div>
      </section>

      <section className="token-panel" id="tokens" aria-labelledby="tokens-title">
        <div className="section-heading">
          <p className="eyebrow">{copy.tokensEyebrow}</p>
          <Heading level={2} id="tokens-title">
            {copy.tokensTitle}
          </Heading>
        </div>
        <div className="token-list">
          <div className="token-row">
            <span className="swatch swatch-ink" aria-hidden="true" />
            <span>{copy.tokenInk}</span>
            <code>--color-ink</code>
          </div>
          <div className="token-row">
            <span className="swatch swatch-brand" aria-hidden="true" />
            <span>{copy.tokenBrand}</span>
            <code>--color-brand</code>
          </div>
          <div className="token-row">
            <span className="swatch swatch-accent" aria-hidden="true" />
            <span>{copy.tokenAccent}</span>
            <code>--color-accent</code>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span>{copy.footerRtl}</span>
        <span>{copy.footerNote}</span>
      </footer>
    </main>
  );
}
