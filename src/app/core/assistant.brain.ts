import { SectionId } from './assistant.bus';
import { ABOUT_HIGHLIGHTS, EDUCATION, EXPERIENCE, PROFILE, PROJECTS, SKILL_CATEGORIES } from '../data/portfolio.data';
import { STUDY_GUIDES } from '../data/study.data';

/** Everything ALPHA says is generated from the portfolio data, so it never drifts from the site. */

const [kaaspro, intern] = EXPERIENCE;
const be = EDUCATION[EDUCATION.length - 1];
const SKILLS = SKILL_CATEGORIES.flatMap(c => c.skills.map(s => ({ name: s.name, cat: c.name })));
const TOPICS = STUDY_GUIDES.flatMap(g => g.topics.map(t => ({ ...t, file: g.file, guide: g.short })));
const QUESTIONS = TOPICS.reduce((n, t) => n + t.questions, 0);
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/** "Explain this section" — what ALPHA says about each part of the page. */
export const NARRATION: Record<SectionId, string> = {
  home: `This is ${PROFILE.name}, a ${PROFILE.role} from ${PROFILE.location.split(',')[0]} with more than three years of experience. He builds secure, scalable enterprise web applications with Spring Boot, Angular and Hibernate, and he currently works at ${PROFILE.company} on the 75Health cloud EHR and EMR platforms.`,
  about: `A little about Kishore. His strengths are ${list(ABOUT_HIGHLIGHTS.map(h => h.title.toLowerCase()))}. He has shipped ${PROJECTS.length} projects and works with ${SKILLS.length} technologies.`,
  skills: `Kishore's toolbox has ${SKILLS.length} technologies in ${SKILL_CATEGORIES.length} groups. ${SKILL_CATEGORIES.slice(0, 4).map(c => `${c.name}: ${list(c.skills.slice(0, 4).map(s => s.name))}`).join('. ')}. He also uses AI assistants like Claude, Copilot and Gemini every day.`,
  projects: `There are ${PROJECTS.length} projects here. The headline one is the 75Health EHR, a cloud based electronic health record platform for clinics and hospitals, built with Java 21, Spring Boot, Spring Security, Hibernate and Angular. The 75Health EMR is a multi-tenant SaaS on OpenEMR, which Kishore upgraded to PHP 8.4 using AI tools.`,
  experience: `Since ${kaaspro.period.split(' –')[0]}, Kishore has been a ${kaaspro.role} at ${kaaspro.company}, working with Java 21, Spring Boot, Angular and MySQL. Before that, he spent ${intern.duration} as a ${intern.role} at ${intern.company}, where he built ${list(intern.projects)}.`,
  education: `Kishore holds a ${be.degree} from ${be.institution.split(',')[0]}, finished in ${be.year}. Before that he completed his HSC and SSLC at ${EDUCATION[0].institution.split(',')[0]}.`,
  prep: `These are the notes Kishore revises before interviews: ${TOPICS.length} chapters and over ${QUESTIONS.toLocaleString()} questions, split into a Java full stack guide and a DSA and coding guide. Search any topic and each chapter opens straight to its page.`,
  contact: `Want to work with Kishore? Email him at ${PROFILE.email.replace('@', ' at ')}, or use the contact form. He is open to Java full stack roles and freelance projects.`,
};

export interface TourStep { app: SectionId; text: string; }

/** The guided tour — ALPHA scrolls to each section and narrates it. */
export const TOUR: TourStep[] = [
  { app: 'home', text: `Hi, I'm Alpha, I'm here to assist you. I'll walk you through Kishore's portfolio. You can pause, skip, or stop me at any time. ${NARRATION.home}` },
  { app: 'skills', text: NARRATION.skills },
  { app: 'projects', text: NARRATION.projects },
  { app: 'experience', text: NARRATION.experience },
  { app: 'education', text: NARRATION.education },
  { app: 'prep', text: NARRATION.prep },
  { app: 'contact', text: `${NARRATION.contact} That's the tour! Tap me any time you have a question, or just say Alpha.` },
];

export interface Reply { text: string; open?: SectionId; link?: string; copy?: string; tour?: boolean; }

const has = (q: string, ...w: string[]) => w.some(x => q.includes(x));

/** Small intent matcher over the data — no network, no AI service. */
export function answer(raw: string): Reply {
  const q = ' ' + raw.toLowerCase().replace(/[?!.]/g, '') + ' ';

  if (has(q, 'tour', 'show me around', 'guide me')) return { text: 'Starting the guided tour now.', tour: true };
  const openMatch = q.match(/\b(open|show|go to|scroll to|take me to)\s+(the\s+|his\s+)?(\w+)/);
  const sectionWords: [string[], SectionId][] = [[['home', 'top', 'start'], 'home'], [['about', 'profile', 'bio'], 'about'], [['project', 'work', 'portfolio'], 'projects'],
    [['experience', 'job', 'career'], 'experience'], [['education', 'degree', 'college'], 'education'], [['skill', 'stack', 'tech'], 'skills'],
    [['note', 'study', 'prep'], 'prep'], [['contact', 'email', 'mail'], 'contact']];
  if (openMatch) {
    const hit = sectionWords.find(([ws]) => ws.some(w => openMatch[3].startsWith(w)));
    if (hit) return { text: `Here's the ${hit[1]} section.`, open: hit[1] };
  }

  if (has(q, 'contact', 'email', 'phone', 'reach', 'hire', 'available')) {
    return { text: `You can email Kishore at ${PROFILE.email} or call ${PROFILE.phone}. He's open to Java full stack roles and freelance work. I've copied the email for you.`, open: 'contact', copy: PROFILE.email };
  }
  if (has(q, 'resume', ' cv ')) return { text: 'Opening his resume in a new tab.', link: PROFILE.resume };

  const topic = TOPICS.find(t => q.includes(' ' + t.title.toLowerCase() + ' ') || (has(q, 'note', 'prep', 'interview', 'question', 'revise', 'study') && t.title.toLowerCase().split(/[\s&/:,()]+/).filter(w => w.length > 3).some(w => q.includes(' ' + w))));
  if (topic) return { text: `${topic.title} is a chapter in the ${topic.guide} guide, with ${topic.questions} questions. Opening it in a new tab.`, link: `${topic.file}#${topic.id}` };

  // full title first, then keywords — EMR before EHR because both titles start with "75Health"
  const byTitle = (t: string) => PROJECTS.find(p => p.title === t);
  const proj = PROJECTS.find(p => q.includes(p.title.toLowerCase())) ??
    (has(q, ' emr', 'openemr') ? byTitle('75Health EMR') : has(q, ' ehr') ? byTitle('75Health EHR') : has(q, 'kaaspro website') ? byTitle('Kaaspro Website') :
     has(q, 'crm', 'mysales') ? PROJECTS.find(p => p.title.startsWith('MySales')) : has(q, 'exam', 'mycognitiv') ? PROJECTS.find(p => p.title.startsWith('MyCognitiv')) : undefined);
  if (proj) return { text: projectStory(proj.title), open: 'projects' };

  const skill = SKILLS.find(s => s.name.length > 2 && q.includes(' ' + s.name.toLowerCase()));
  if (skill) {
    const used = PROJECTS.filter(p => p.tech.some(t => t.toLowerCase().startsWith(skill.name.toLowerCase()))).map(p => p.title);
    return { text: `Yes, ${skill.name} is in Kishore's toolbox, under ${skill.cat}.${used.length ? ` He used it on ${list(used)}.` : ''}`, open: 'skills' };
  }
  if (has(q, 'project', 'built', 'product')) return { text: NARRATION.projects, open: 'projects' };
  if (has(q, 'intern', 'techietact')) return { text: `${intern.role} at ${intern.company}, for ${intern.duration}. ${intern.summary}`, open: 'experience' };
  if (has(q, 'experience', 'years', 'job', 'work', 'company', 'kaaspro', 'current')) return { text: NARRATION.experience, open: 'experience' };
  if (has(q, 'study', 'education', 'degree', 'college', 'school')) return { text: NARRATION.education, open: 'education' };
  if (has(q, 'skill', 'tech', 'stack', 'know', 'language')) return { text: NARRATION.skills, open: 'skills' };
  if (has(q, 'note', 'prep', 'interview')) return { text: NARRATION.prep, open: 'prep' };
  if (has(q, 'where', 'location', 'live', 'based', 'city')) return { text: `Kishore is based in ${PROFILE.location}.` };
  if (has(q, 'how', 'built', 'made')) return { text: 'This site is Angular 22 with signals and no Zone.js, three.js for the 3D hero and skills, and the Web Speech API for my voice. No server needed.' };
  if (has(q, 'who', 'about', 'what does', 'tell me', 'introduce', 'yourself')) return { text: NARRATION.home, open: 'about' };
  if (has(q, ' hi ', 'hello', ' hey ', 'vanakkam')) return { text: `Hello! Ask me about Kishore's projects, skills, experience or interview notes. Or say "start the tour".` };
  if (has(q, 'thank')) return { text: "You're welcome! Anything else?" };
  return { text: `I only know what's on this site, and I didn't catch that. Try "what are his skills", "tell me about the 75Health EMR", "Kafka notes", or "start the tour".` };
}

/** A spoken summary of one project. */
export function projectStory(title: string): string {
  const p = PROJECTS.find(x => x.title === title)!;
  return `${p.title}, at ${p.org}, ${p.period.replace('–', 'to')}. ${p.features.slice(0, 3).join('. ')}. It's built with ${list(p.tech.slice(0, 5))}.`;
}
