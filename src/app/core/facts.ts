import { ABOUT_HIGHLIGHTS, EDUCATION, EXPERIENCE, PROFILE, PROJECTS, SKILL_CATEGORIES } from '../data/portfolio.data';
import { STUDY_GUIDES } from '../data/study.data';

/** Everything the AI is allowed to know about Kishore. `compact` drops the chapter list, for small on-device models. */
export function portfolioFacts(compact = false): string {
  const exp = EXPERIENCE.map(e => `- ${e.role} at ${e.company} (${e.period}, ${e.duration}). ${e.summary} Projects: ${e.projects.join(', ')}. Tech: ${e.tech.join(', ')}.`).join('\n');
  const proj = PROJECTS.map(p => `- ${p.title} (${p.org}, ${p.period}${p.link ? ', ' + p.link : ''}): ${p.features.join('; ')}. Tech: ${p.tech.join(', ')}.`).join('\n');
  const skills = SKILL_CATEGORIES.map(c => `- ${c.name}: ${c.skills.map(s => s.name).join(', ')}`).join('\n');
  const edu = EDUCATION.map(e => `- ${e.degree}, ${e.institution} (${e.period}), ${e.grade}`).join('\n');
  const notes = STUDY_GUIDES.map(g => `- ${g.title}: ${g.topics.map(t => t.title).join(', ')}`).join('\n');
  return `PROFILE: ${PROFILE.name}, ${PROFILE.role}, ${PROFILE.location}. 3+ years of experience. Email ${PROFILE.email}, phone ${PROFILE.phone}, LinkedIn ${PROFILE.linkedin}, GitHub ${PROFILE.github}. Open to Java full-stack roles and freelance work.
STRENGTHS: ${ABOUT_HIGHLIGHTS.map(h => `${h.title} — ${h.desc}`).join(' | ')}
EXPERIENCE:
${exp}
PROJECTS:
${proj}
SKILLS:
${skills}
EDUCATION:
${edu}${compact ? '' : `
INTERVIEW-PREP NOTES ON THIS SITE (chapter titles):
${notes}`}
THIS SITE: Kishore's 3D portfolio — a single scrolling page built with Angular 22 and three.js, with sections Home, About, Skills, Projects, Experience, Education, Study notes and Contact, plus ALPHA the voice guide.`;
}
