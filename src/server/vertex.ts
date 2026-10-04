import { z } from 'zod';
import { ApiError, imageSchema, providerFetch } from './safety';

export type VertexConfig = {
  VERTEX_AUTH_MODE?: 'oauth' | 'api_key' | 'express_key';
  GOOGLE_CLOUD_PROJECT?: string;
  GOOGLE_CLOUD_LOCATION?: 'eu' | 'us' | 'global';
  VERTEX_MODEL?: string;
  GOOGLE_CLOUD_ACCESS_TOKEN?: string;
  GOOGLE_CLOUD_API_KEY?: string;
};

const defaultModel = 'gemini-3.5-flash-lite';
const configuredError = () => new ApiError(503, 'Vertex AI is not configured correctly');
const outputError = () => new ApiError(502, 'Vertex AI returned invalid JSON output');

function requestConfig(env: VertexConfig) {
  const mode = env.VERTEX_AUTH_MODE;
  const model = env.VERTEX_MODEL || defaultModel;
  if (!['oauth', 'api_key', 'express_key'].includes(mode || '') ||
      model.length > 128 || !/^gemini-[a-z0-9.-]+$/.test(model)) throw configuredError();
  const credential = mode === 'oauth' ? env.GOOGLE_CLOUD_ACCESS_TOKEN : env.GOOGLE_CLOUD_API_KEY;
  // Credentials stay in headers, and malformed header values fail before delivery.
  if (!credential || !/^[\x21-\x7e]+$/.test(credential)) throw configuredError();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (mode === 'oauth') headers.Authorization = `Bearer ${credential}`;
  else headers['x-goog-api-key'] = credential;
  if (mode === 'express_key') {
    return { url: `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent`, headers };
  }
  const project = env.GOOGLE_CLOUD_PROJECT;
  const location = env.GOOGLE_CLOUD_LOCATION;
  if (!project || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project) ||
      !['global', 'eu', 'us'].includes(location || '')) throw configuredError();
  const host = location === 'global' ? 'aiplatform.googleapis.com' : `aiplatform.${location}.rep.googleapis.com`;
  return { url: `https://${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`, headers };
}

/** Configuration completeness only; account/model access still requires a real request. */
export function vertexConfigured(env: VertexConfig): boolean {
  try { requestConfig(env); return true; } catch { return false; }
}

const responseSchema = z.object({
  candidates: z.array(z.object({
    content: z.object({ parts: z.array(z.object({ text: z.string().optional(), thought: z.boolean().optional() })) }).optional(),
  })).optional(),
});

export async function vertexJson(env: VertexConfig, instruction: string, image: string): Promise<unknown> {
  const { url, headers } = requestConfig(env);
  if (!imageSchema.safeParse(image).success) throw new ApiError(400, 'Invalid observation image');
  const comma = image.indexOf(',');
  const mimeType = image.slice(5, image.indexOf(';'));
  const response = await providerFetch(url, {
    method: 'POST', headers,
    // Never follow a redirect with credentials or a captured screen attached.
    redirect: 'manual',
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instruction }] },
      contents: [{ role: 'user', parts: [
        { text: 'Identify a grounded candidate question from this frame. Return the requested result as JSON.' },
        { inlineData: { mimeType, data: image.slice(comma + 1) } },
      ] }],
      generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingLevel: 'MINIMAL' } },
    }),
  });
  try {
    const parsed = responseSchema.safeParse(await response.json());
    if (!parsed.success) throw outputError();
    const text = parsed.data.candidates?.[0]?.content?.parts
      .filter(part => !part.thought && typeof part.text === 'string')
      .map(part => part.text).join('');
    if (!text?.trim()) throw outputError();
    return JSON.parse(text);
  } catch { throw outputError(); }
}
