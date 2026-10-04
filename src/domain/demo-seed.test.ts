import { describe, expect, it } from 'vitest';
import { demoSeed } from './demo-seed';

describe('Notion demo import files', () => {
  it('match the synthetic sandbox case the visual coach is given (regenerate with vitest -u)', async () => {
    const seed = demoSeed();
    expect(seed.expertTasks).not.toContain('Atlas Data Correction');
    expect(seed.learnerTasks).toContain('Atlas Data Correction');
    await expect(seed.expertTasks).toMatchFileSnapshot('../../docs/demo/notion-expert-week.csv');
    await expect(seed.learnerTasks).toMatchFileSnapshot('../../docs/demo/notion-learner-case.csv');
    await expect(seed.availability).toMatchFileSnapshot('../../docs/demo/notion-availability.csv');
  });
});
