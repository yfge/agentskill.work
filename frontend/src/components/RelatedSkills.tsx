import { SkillCard } from "@/components/SkillCard";
import { fetchRelatedSkillsCached } from "@/lib/apiServer";
import { messages, type Language } from "@/lib/i18n";

export async function RelatedSkills({
  owner,
  repo,
  lang,
}: {
  owner: string;
  repo: string;
  lang: Language;
}) {
  const skills = await fetchRelatedSkillsCached(owner, repo, 6);
  if (skills.length === 0) {
    return null;
  }

  const copy = messages[lang];
  return (
    <section className="detail-card">
      <h2>{copy.relatedSkillsTitle}</h2>
      <p className="detail-description">{copy.relatedSkillsSubtitle}</p>
      <div className="grid">
        {skills.map((skill) => (
          <SkillCard key={skill.id} skill={skill} lang={lang} />
        ))}
      </div>
    </section>
  );
}
