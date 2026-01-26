"use client";

import { messages, type Language } from "@/lib/i18n";

export function PageBottomSections({ lang }: { lang: Language }) {
  const copy = messages[lang];

  return (
    <>
      <section className="info">
        <div className="info-header">
          <h2>{copy.infoTitle}</h2>
          <p>{copy.infoSubtitle}</p>
        </div>
        <div className="info-grid">
          {copy.infoCards.map((card) => (
            <article key={card.title} className="info-card">
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="faq">
        <div className="info-header">
          <h2>{copy.faqTitle}</h2>
        </div>
        <div className="faq-list">
          {copy.faqItems.map((item) => (
            <article key={item.question} className="faq-item">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="resources">
        <div className="info-header">
          <h2>{copy.resourcesTitle}</h2>
          <p>{copy.resourcesSubtitle}</p>
        </div>
        <ul className="resources-list">
          {copy.resourcesLinks.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
