// "Two worlds" skills section (design.md §3, proposal §4.1). Labels are i18n
// keys, not hardcoded strings — components call `t(locale, skill.labelKey)`.
import type { UIKey } from '../i18n';

export interface Skill {
  labelKey: UIKey;
}

export const skills: { ai: Skill[]; civil: Skill[] } = {
  ai: [
    { labelKey: 'skills.ai.rag' },
    { labelKey: 'skills.ai.dataScience' },
    { labelKey: 'skills.ai.dataEngineering' },
    { labelKey: 'skills.ai.geointelligence' },
    { labelKey: 'skills.ai.frontend' },
    { labelKey: 'skills.ai.dataGovernance' },
    { labelKey: 'skills.ai.webScraping' },
    { labelKey: 'skills.ai.consulting' },
  ],
  civil: [
    { labelKey: 'skills.civil.bim' },
    { labelKey: 'skills.civil.hydraulic' },
    { labelKey: 'skills.civil.structural' },
    { labelKey: 'skills.civil.territorial' },
    { labelKey: 'skills.civil.projectManagement' },
  ],
};
