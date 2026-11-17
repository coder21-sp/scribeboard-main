process.env.NODE_ENV='test';process.env.BCRYPT_SALT_ROUNDS='4';
const {test,before,after}=require('node:test');const assert=require('node:assert/strict');const request=require('supertest');const {randomUUID}=require('crypto');
if(!process.env.DATABASE_URL?.includes('scribeboard_test'))throw Error('Use a disposable scribeboard_test database');
const app=require('../src/app');const {prisma}=require('../src/config/database');
let a,b,admin,post,comment;const suffix=randomUUID();
const call=(method,path,body,user)=>{const r=request(app)[method]('/api/v1'+path);if(user)r.set('Authorization','Bearer '+user.accessToken);return body?r.send(body):r;};
async function signup(name,role){const r=await call('post','/auth/register',{email:`${name}-${suffix}@example.com`,password:'TestPass123',firstName:'Test',lastName:'User',role});assert.equal(r.status,201,JSON.stringify(r.body));return r.body.data;}
before(async()=>{a=await signup('a','EDITOR');b=await signup('b','ADMIN');admin=await signup('admin');await prisma.user.update({where:{id:admin.user.id},data:{role:'ADMIN'}});});
after(async()=>{await prisma.user.deleteMany({where:{email:{endsWith:suffix+'@example.com'}}}).catch(()=>{});await prisma.$disconnect();});
test('registration cannot assign roles and repeated login tokens remain unique',async()=>{
 assert.equal(a.user.role,'AUTHOR');assert.equal(b.user.role,'AUTHOR');for(let i=0;i<2;i++)assert.equal((await call('post','/auth/login',{email:a.user.email,password:'TestPass123'})).status,200);
});
test('drafts are private by id, slug, search, status and author filters',async()=>{
 const r=await call('post','/posts',{title:'Private draft '+suffix,content:'Private text '.repeat(10),tags:['Node','node']},a);assert.equal(r.status,201,JSON.stringify(r.body));post=r.body.data;assert.equal(post.tags.length,1);
 for(const id of [post.id,post.slug]){assert.equal((await call('get','/posts/'+id)).status,404);assert.equal((await call('get','/posts/'+id,null,b)).status,404);assert.equal((await call('get','/posts/'+id,null,a)).status,200);}
 for(const q of ['?status=DRAFT','?search=Private','?sort=title,-createdAt','?authorId='+a.user.id+'&status=DRAFT']){const result=await call('get','/posts'+q,null,b);assert.equal(result.status,200);assert.equal(result.body.data.some(p=>p.id===post.id),false);}
 assert.equal((await call('get','/posts/mine',null,a)).body.data.some(p=>p.id===post.id),true);
});
test('ownership, atomic edits and returned tags',async()=>{
 assert.equal((await call('patch','/posts/'+post.id,{title:'Unauthorized edit'},b)).status,403);
 let r=await call('patch','/posts/'+post.id,{tags:['Express','express']},a);assert.equal(r.status,200);assert.equal(r.body.data.tags.length,1);assert.equal(r.body.data.tags[0].tag.name,'express');
 const count=await prisma.postRevision.count({where:{postId:post.id}});
 r=await call('patch','/posts/'+post.id,{title:'Must roll back',categoryId:randomUUID()},a);assert.equal(r.status,400);assert.equal((await prisma.post.findUnique({where:{id:post.id}})).title,post.title);assert.equal(await prisma.postRevision.count({where:{postId:post.id}}),count);
});
test('publishing and moderated comments hide guest email and IP',async()=>{
 assert.equal((await call('post','/posts/'+post.id+'/publish',{},a)).status,200);
 let r=await call('post','/posts/'+post.id+'/comments',{content:'Guest comment',guestName:'Guest',guestEmail:'private@example.com'});assert.equal(r.status,201);comment=r.body.data;assert.equal(comment.status,'PENDING');assert.equal('guestEmail' in comment,false);
 assert.equal((await call('get','/posts/'+post.id+'/comments')).body.data.length,0);
 assert.equal((await call('post','/comments/'+comment.id+'/approve',{},b)).status,403);
 assert.equal((await call('post','/comments/'+comment.id+'/approve',{},admin)).status,200);
 r=await call('get','/posts/'+post.id+'/comments');assert.equal(r.body.data.length,1);for(const key of ['guestEmail','ipAddress','userAgent'])assert.equal(key in r.body.data[0],false);
 await call('post','/posts/'+post.id+'/unpublish',{},a);assert.equal((await call('get','/posts/'+post.id+'/comments')).status,404);
});
test('refresh rotation has one winner and logout revokes access',async()=>{
 const r=await Promise.all([1,2].map(()=>call('post','/auth/refresh-tokens',{refreshToken:b.refreshToken})));assert.deepEqual(r.map(x=>x.status).sort(),[200,401]);const fresh=r.find(x=>x.status===200).body.data;
 assert.equal((await call('post','/auth/logout',{refreshToken:fresh.refreshToken})).status,200);assert.equal((await call('get','/auth/profile',null,b)).status,401);
});
test('password changes revoke sessions; category permissions and post deletion work',async()=>{
 assert.equal((await call('post','/categories',{name:'Forbidden'},a)).status,403);
 assert.equal((await call('post','/auth/change-password',{currentPassword:'TestPass123',newPassword:'NewPass123'},a)).status,200);assert.equal((await call('get','/auth/profile',null,a)).status,401);
 assert.equal((await call('delete','/posts/'+post.id,null,admin)).status,200);
});
