// Benchmark-only Google Cloud adapter. Never accepts an arbitrary credential destination.
export function vertexRequest(vars, instruction, image) {
  const mode=vars.VERTEX_AUTH_MODE;
  if(!['oauth','api_key','express_key'].includes(mode)) throw new Error('Set VERTEX_AUTH_MODE to oauth, api_key or express_key');
  const model=vars.VERTEX_MODEL||'gemini-3.5-flash-lite';
  if(!/^gemini-[a-z0-9.-]+$/.test(model)) throw new Error('Invalid Vertex model');
  const headers={'Content-Type':'application/json'};
  let url;
  if(mode==='express_key') {
    if(!vars.GOOGLE_CLOUD_API_KEY)throw new Error('Missing GOOGLE_CLOUD_API_KEY');
    url=`https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent`;
    headers['x-goog-api-key']=vars.GOOGLE_CLOUD_API_KEY;
  } else {
    const project=vars.GOOGLE_CLOUD_PROJECT,location=vars.GOOGLE_CLOUD_LOCATION;
    if(!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project||'')||!['global','eu','us'].includes(location))throw new Error('Set valid GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION (global, eu or us)');
    const host=location==='global'?'aiplatform.googleapis.com':`aiplatform.${location}.rep.googleapis.com`;
    url=`https://${host}/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`;
    if(mode==='oauth') {
      if(!vars.GOOGLE_CLOUD_ACCESS_TOKEN)throw new Error('Missing GOOGLE_CLOUD_ACCESS_TOKEN');
      headers.Authorization=`Bearer ${vars.GOOGLE_CLOUD_ACCESS_TOKEN}`;
    } else {
      if(!vars.GOOGLE_CLOUD_API_KEY)throw new Error('Missing GOOGLE_CLOUD_API_KEY');
      headers['x-goog-api-key']=vars.GOOGLE_CLOUD_API_KEY;
    }
  }
  const match=/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(image);
  if(!match)throw new Error('Expected inline synthetic JPEG or PNG');
  return {url,headers,body:{systemInstruction:{parts:[{text:instruction}]},contents:[{role:'user',parts:[{text:'Identify a grounded candidate question from this frame. Return the requested result as JSON.'},{inlineData:{mimeType:match[1],data:match[2]}}]}],generationConfig:{responseMimeType:'application/json',thinkingConfig:{thinkingLevel:'MINIMAL'}}}};
}
export function parseVars(text) {
  const result={};
  for(const line of text.split('\n')) {const match=/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);if(match)result[match[1]]=match[2].replace(/^(['"])(.*)\1$/,'$2');}
  return result;
}
