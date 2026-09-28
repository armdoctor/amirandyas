// One question per household, picked deterministically from the primary's id
// so the same guest always sees the same question.

export const NOTE_PROMPTS = [
  "Share a favourite memory of Amir or Yasmin. We'd love to read it on the day.",
  "What's one piece of advice you'd give the two of them?",
  "Tell us something you love about Amir or Yasmin — they could use the reminder.",
] as const;

export function pickPromptForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return NOTE_PROMPTS[Math.abs(hash) % NOTE_PROMPTS.length];
}
