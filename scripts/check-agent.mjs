// Reads model availability through Google AI Studio. Never prints credentials.
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
try {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!key)
    throw new Error(
      'Set GOOGLE_GENERATIVE_AI_API_KEY in .env.local. Do not share it in chat.',
    );
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models',
    { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(15000) },
  );
  if (!response.ok)
    throw new Error(
      `Google model discovery failed (HTTP ${response.status}). Check API access and quotas.`,
    );
  const data = await response.json();
  const models = (data.models ?? []).filter((model) =>
    model.supportedGenerationMethods?.includes('generateContent'),
  );
  console.log('Available generateContent models:');
  for (const model of models) console.log(model.name.replace(/^models\//, ''));
  const selected = process.env.KUDEX_AI_MODEL?.trim();
  if (!selected)
    throw new Error(
      'Choose a listed text/tool-capable model and set KUDEX_AI_MODEL in .env.local.',
    );
  if (!models.some((model) => model.name === `models/${selected}`))
    throw new Error(
      'Configured model was not present in the returned catalog. Check its ID or API access.',
    );
  if (process.argv.includes('--probe')) {
    const result = await generateText({
      model: google(selected),
      prompt: 'Reply with the single word READY.',
      maxOutputTokens: 128,
      maxRetries: 0,
      abortSignal: AbortSignal.timeout(30000),
    });
    if (!result.text.trim()) throw new Error('The model returned no text.');
    console.log(
      'Configured model responded successfully. This probe does not verify wallet actions.',
    );
  } else console.log('Model found. Use --probe to make a small generation request.');
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Agent configuration check failed.',
  );
  process.exitCode = 1;
}
