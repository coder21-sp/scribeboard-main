import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ApiClient } from '../dist/api.js';
test('frontend client against real Express API and PostgreSQL', { skip: !process.env.SCRIBE_BACKEND_DIR }, async()=>{
 if(!process.env.DATABASE_URL?.includes('scribeboard_test'))throw Error('Use a disposable scribeboard_test database.');
 process.env.CORS_ORIGIN='https://frontend.example.com';process.env.NODE_ENV='test';process.env.BCRYPT_SALT_ROUNDS='4';
 const require=createRequire(import.meta.url);const app=require(process.env.SCRIBE_BACKEND_DIR+'/src/app.js');const {prisma}=require(process.env.SCRIBE_BACKEND_DIR+'/src/config/database.js');
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
 let cookie=''; const browserFetch=async(url,options)=>{ const r=await fetch(url,{...options,headers:{...options.headers,Origin:process.env.CORS_ORIGIN,...(cookie?{Cookie:cookie}:{})}}); const header=r.headers.get('set-cookie');if(header)cookie=header.split(';')[0];return r; };
 const api=new ApiClient('http://127.0.0.1:'+server.address().port+'/api/v1',browserFetch);const anonymous=new ApiClient(api.base);let userId;
 try {
  const email=`frontend-${crypto.randomUUID()}@example.com`;
  api.session=(await api.request('/auth/register',{method:'POST',body:{email,password:'TestPass123',firstName:'Frontend',lastName:'Test'}})).data;userId=api.session.user.id;
  assert.equal(api.session.user.role,'AUTHOR'); assert.equal(api.session.refreshToken,undefined);api.session=null;assert.equal(await api.restoreSession(),true);assert.equal(api.session.user.id,userId);
  const p=(await api.request('/posts',{method:'POST',body:{title:'Frontend integration story',content:'This integration story verifies that the frontend client speaks the real ScribeBoard API.',tags:['frontend'],allowComments:true}})).data;
  assert.equal(p.status,'DRAFT');await assert.rejects(()=>anonymous.request('/posts/'+p.id),/not found/i);
  assert.ok((await api.request('/posts/mine')).data.some(x=>x.id===p.id));
  await api.request('/posts/'+p.id,{method:'PATCH',body:{title:'Updated integration story'}});
  await api.request('/posts/'+p.id+'/publish',{method:'POST'});
  assert.equal((await anonymous.request('/posts/'+p.id)).data.title,'Updated integration story');
  const c=(await anonymous.request('/posts/'+p.id+'/comments',{method:'POST',body:{content:'A useful article!',guestName:'Reader',guestEmail:'reader@example.com'}})).data;assert.equal(c.status,'PENDING');
  await api.request('/posts/'+p.id+'/unpublish',{method:'POST'});await assert.rejects(()=>anonymous.request('/posts/'+p.id),/not found/i);
  await api.request('/posts/'+p.id,{method:'DELETE'});
  await api.request('/auth/logout',{method:'POST',body:{}});
  await assert.rejects(()=>api.request('/posts/mine'));assert.equal(api.session,null);
 } finally {if(userId)await prisma.user.delete({where:{id:userId}});await prisma.$disconnect();await new Promise(r=>server.close(r));}
});
