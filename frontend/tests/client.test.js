import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient, validBase } from '../dist/api.js';
const json = (data, status=200) => new Response(JSON.stringify(data), { status, headers: {'Content-Type':'application/json'} });
test('concurrent unauthorized calls share one refresh and retry with rotated access token', async () => {
 let refreshes=0;
 const client=new ApiClient('https://api.example.com/api/v1',async(url,options)=>{
  if(url.endsWith('/auth/refresh-tokens')){refreshes++; await new Promise(r=>setTimeout(r,10)); return json({data:{accessToken:'new',refreshToken:'rotated'}});}
  return options.headers.Authorization==='Bearer new'?json({data:['ok']}):json({message:'expired'},401);
 });
 client.session={accessToken:'old',refreshToken:'old-refresh',user:{id:'u'}};
 const result=await Promise.all([client.request('/posts/mine'),client.request('/comments')]);
 assert.equal(refreshes,1);assert.deepEqual(result.map(r=>r.data),[['ok'],['ok']]);assert.equal(client.session.user.id,'u');assert.equal(client.session.refreshToken,'rotated');
});
test('rejected refresh clears session and does not loop',async()=>{
 let count=0;const c=new ApiClient('https://api.example.com',async()=>{count++;return json({message:'Session revoked'},401)});c.session={accessToken:'old',refreshToken:'bad'};
 await assert.rejects(()=>c.request('/posts/mine'),/Session revoked/);assert.equal(c.session,null);assert.equal(count,2);
});
test('network and non-JSON failures have actionable messages',async()=>{
 await assert.rejects(()=>new ApiClient('https://api.example.com',async()=>{throw Error('network')}).request('/health'),/CORS/);
 await assert.rejects(()=>new ApiClient('https://api.example.com',async()=>new Response('<html>')).request('/health'),/did not return JSON/);
});
test('API configuration rejects unsafe protocols and embedded credentials',()=>{
 for(const v of ['javascript:alert(1)','http://remote.example.com','https://u:secret@api.example.com','https://api.example.com?token=secret'])assert.throws(()=>validBase(v));
 assert.equal(validBase('https://api.example.com/api/v1/'),'https://api.example.com/api/v1');assert.equal(validBase('http://localhost:3000/api/v1'),'http://localhost:3000/api/v1');
});
