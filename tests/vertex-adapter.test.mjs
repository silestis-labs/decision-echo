import {test} from 'node:test';
import assert from 'node:assert/strict';
import {vertexRequest,parseVars} from './helpers/vertex-benchmark.mjs';
const image='data:image/jpeg;base64,YQ==';
test('Vertex OAuth uses the project endpoint and minimal JSON image request',()=>{
 const r=vertexRequest({VERTEX_AUTH_MODE:'oauth',GOOGLE_CLOUD_PROJECT:'demo-project',GOOGLE_CLOUD_LOCATION:'eu',GOOGLE_CLOUD_ACCESS_TOKEN:'fixture'},'instruction',image);
 assert.equal(r.url,'https://aiplatform.eu.rep.googleapis.com/v1/projects/demo-project/locations/eu/publishers/google/models/gemini-3.5-flash-lite:generateContent');
 assert.equal(r.headers.Authorization,'Bearer fixture');assert.equal(r.body.generationConfig.thinkingConfig.thinkingLevel,'MINIMAL');assert.equal(r.body.contents[0].parts[1].inlineData.data,'YQ==');
});
test('Express key has no project/region path and no query-string secret',()=>{
 const r=vertexRequest({VERTEX_AUTH_MODE:'express_key',GOOGLE_CLOUD_API_KEY:'fixture'},'instruction',image);
 assert(!r.url.includes('/projects/')&&!r.url.includes('fixture'));assert.equal(r.headers['x-goog-api-key'],'fixture');
});
test('Global and US endpoints preserve their distinct documented hosts',()=>{
 for(const [location,host] of [['global','aiplatform.googleapis.com'],['us','aiplatform.us.rep.googleapis.com']]) {
  const r=vertexRequest({VERTEX_AUTH_MODE:'api_key',GOOGLE_CLOUD_PROJECT:'demo-project',GOOGLE_CLOUD_LOCATION:location,GOOGLE_CLOUD_API_KEY:'fixture'},'instruction',image);
  assert.equal(new URL(r.url).hostname,host);
  assert(new URL(r.url).pathname.includes(`/locations/${location}/`));
  assert.equal(r.headers['x-goog-api-key'],'fixture');
 }
});
test('Reject missing credentials, untrusted identifiers and unsupported locations',()=>{
 assert.throws(()=>vertexRequest({},'instruction',image));
 assert.throws(()=>vertexRequest({VERTEX_AUTH_MODE:'oauth',GOOGLE_CLOUD_PROJECT:'https://evil.test',GOOGLE_CLOUD_LOCATION:'eu',GOOGLE_CLOUD_ACCESS_TOKEN:'fixture'},'instruction',image));
 assert.throws(()=>vertexRequest({VERTEX_AUTH_MODE:'express_key',GOOGLE_CLOUD_API_KEY:'fixture',VERTEX_MODEL:'../../malicious'},'instruction',image));
 assert.deepEqual(parseVars('# comment\nKEY="value"\n'),{KEY:'value'});
});
