import type { ExperienceCard, ExperienceSurface } from './experience-backend';

export interface ExperienceViewModel {
  surface: ExperienceSurface;
  headline: string;
  primaryQuestion: string;
  cards: ExperienceCard[];
  density: 'LOW' | 'MEDIUM';
  storyFirst: true;
}

const QUESTIONS: Record<ExperienceSurface, string> = {
  EXECUTIVE_HOME: 'What changed, what needs attention, and what should I do next?',
  BUSINESS_HEALTH: 'How is the organization doing, and why?',
  STORY_ENGINE: 'What happened, why, what is affected, and what happens next?',
  AGENT_ACTIVITY: 'What did the AI workforce observe, recommend, or attempt?',
  APPROVALS: 'Which consequential actions need an authorized human decision?',
  LEARNING: 'What did XIV learn from measured outcomes?',
  COMMUNITY: 'What useful business knowledge or collaboration is available?',
};

export function toExperienceViewModel(surface: ExperienceSurface, cards: ExperienceCard[]): ExperienceViewModel {
  return {
    surface,
    headline: surface.replaceAll('_', ' '),
    primaryQuestion: QUESTIONS[surface],
    cards: cards.slice(0, 12),
    density: surface === 'EXECUTIVE_HOME' ? 'LOW' : 'MEDIUM',
    storyFirst: true,
  };
}
