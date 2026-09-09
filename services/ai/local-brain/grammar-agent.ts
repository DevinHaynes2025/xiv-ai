import { completeWithLocalModel } from './local-model';

export type WritingTask = {
  text: string;
  mode: 'grammar' | 'spelling' | 'clarity' | 'translate';
  targetLanguage?: string;
};

export async function runWritingAgent(task: WritingTask) {
  if (!task.text.trim()) throw new Error('WRITING_TEXT_REQUIRED');
  if (task.text.length > 40_000) throw new Error('WRITING_TEXT_TOO_LARGE');
  if (task.mode === 'translate' && !task.targetLanguage) throw new Error('TARGET_LANGUAGE_REQUIRED');

  const instruction = task.mode === 'translate'
    ? `Translate into ${task.targetLanguage}. Preserve meaning, names, numbers, uncertainty, and formatting.`
    : `${task.mode === 'grammar' ? 'Correct grammar' : task.mode === 'spelling' ? 'Correct spelling' : 'Improve clarity'} without inventing facts or changing the intended meaning.`;

  try {
    const result = await completeWithLocalModel([
      'You are XIV Editor, a bounded offline-capable writing specialist.',
      instruction,
      'Return only the revised text. Do not claim external research or verification.',
      `TEXT:\n${task.text}`,
    ].join('\n\n'));

    return { ...result, mode: task.mode, targetLanguage: task.targetLanguage ?? null, state: 'COMPLETED' as const };
  } catch (error) {
    return {
      text: task.text,
      model: null,
      provider: 'ollama' as const,
      mode: task.mode,
      targetLanguage: task.targetLanguage ?? null,
      state: 'UNAVAILABLE' as const,
      reason: error instanceof Error ? error.message : 'local model unavailable',
    };
  }
}
