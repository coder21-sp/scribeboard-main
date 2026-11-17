export const demoUser = { id: 'demo-author', firstName: 'Alex', lastName: 'Morgan', role: 'EDITOR', email: 'alex@example.com' };
export const categories = ['Design', 'Engineering', 'Writing', 'Ideas'].map((name, i) => ({ id: `category-${i}`, name, slug: name.toLowerCase() }));
const articles = [
 ['The quiet art of making things that matter', 'Design', 'Good work begins with paying attention. A few thoughts on slowing down, staying curious, and creating with intention.', 'A useful idea rarely arrives fully formed. It starts with a question, a small observation, or a problem that refuses to leave you alone.\n\nMake room for that beginning. Write it down before you decide whether it is good. Give yourself permission to explore without immediately turning every thought into a finished product.\n\nThe work that matters is often simple: understand the person on the other side, remove what gets in their way, and make the next step feel natural.\n\nStart small. Listen carefully. Keep making things.'],
 ['Building APIs people enjoy using', 'Engineering', 'Clear contracts, useful errors, and the little details that make a developer’s day better.', 'A good API is a conversation. The request asks a clear question, and the response provides an answer the caller can use.\n\nConsistent naming and predictable status codes are a good place to start. Document the failure cases as carefully as the happy path.\n\nThen test with a real client. Small mismatches become obvious when someone tries to turn your endpoints into a complete experience.'],
 ['A blank page is an invitation', 'Writing', 'Finding your voice starts with putting one imperfect sentence on the page.', 'You do not need a perfect opening to begin writing. You need a thought you care about enough to follow.\n\nWrite a rough version first. Read it aloud. Notice which sentences sound like you and which are trying too hard.\n\nEditing is a way of listening. Keep the parts that say something true, and give them room to breathe.'],
 ['Small experiments, lasting lessons', 'Ideas', 'Why a weekend project can teach you more than a month of planning.', 'Choose one question you can answer by making something. Keep the first version small enough to finish.\n\nAn experiment is useful when it changes what you understand. A result you did not expect can be more valuable than one that confirms your plan.\n\nWrite down what you learned and what you would try next. That record becomes the beginning of your next project.'],
 ['Designing for a slower internet', 'Design', 'Thoughtful interfaces should work beyond perfect connections and powerful devices.', 'A resilient interface tells people what is happening, even when the network is slow. Keep useful content visible and make pending actions clear.\n\nReduce unnecessary requests, compress assets, and preserve unfinished work. Never claim an action succeeded before the server confirms it.\n\nAccessibility includes the conditions people work in. Test with real constraints, not only your own connection.'],
 ['Notes from the work in progress', 'Writing', 'A draft about the value of sharing what we learn along the way.', 'This is a sample draft. Try editing the title, adding a paragraph, and publishing it in demo mode.\n\nYour demo changes stay in this browser tab. Connect your own backend to store real posts and use real accounts.']
];
function seed() { return articles.map(([title, cat, excerpt, content], i) => ({ id: `post-${i}`, title, excerpt, content, category: categories.find(c => c.name === cat), categoryId: categories.find(c => c.name === cat).id, author: demoUser, authorId: demoUser.id, tags: [], status: i === 5 ? 'DRAFT' : 'PUBLISHED', allowComments: true, readingTime: 3 + i % 3, createdAt: '2026-11-12T10:00:00Z', updatedAt: '2026-11-12T10:00:00Z', viewCount: 0 })); }
export class DemoClient {
 constructor() { this.session = null; try { this.posts = JSON.parse(sessionStorage.getItem('scribe-demo-posts')) || seed(); this.comments = JSON.parse(sessionStorage.getItem('scribe-demo-comments')) || []; } catch { this.posts = seed(); this.comments = []; } }
 save() { sessionStorage.setItem('scribe-demo-posts', JSON.stringify(this.posts)); sessionStorage.setItem('scribe-demo-comments', JSON.stringify(this.comments)); }
 async request(path, { method = 'GET', body = {} } = {}) {
   const [p, query] = path.split('?'), q = new URLSearchParams(query); const parts = p.split('/').filter(Boolean);
   const paginate = data => { const page = Number(q.get('page') || 1), limit = Number(q.get('limit') || 9); return { data: structuredClone(data.slice((page - 1) * limit, page * limit)), pagination: { page, total: data.length, totalPages: Math.ceil(data.length / limit), hasNextPage: page * limit < data.length, hasPrevPage: page > 1 } }; };
   if (p === '/health') return { success: true };
   if (p === '/categories') return { data: categories };
   if (p === '/auth/logout') { this.session = null; return { data: null }; }
   if (parts[0] === 'auth') throw new Error('Connect your API to use real accounts. Use “Try the demo workspace” to explore.');
   if (method !== 'GET' && !this.session && !(parts[0] === 'posts' && parts[2] === 'comments')) throw new Error('Enter the demo workspace first.');
   if (parts[0] === 'comments') {
     if (!this.session) throw new Error('Sign in to moderate comments.');
     if (method === 'GET') return paginate(this.comments.filter(c => !q.get('status') || c.status === q.get('status')));
     const c = this.comments.find(c => c.id === parts[1]); if (!c) throw new Error('Comment not found.');
     c.status = { approve: 'APPROVED', reject: 'REJECTED', spam: 'SPAM' }[parts[2]]; this.save(); return { data: c };
   }
   if (parts[0] === 'posts') {
     if (parts[2] === 'comments') {
       const post = this.posts.find(p => p.id === parts[1]);
       if (!post || post.status !== 'PUBLISHED') throw new Error('Post is not published.');
       if (method === 'GET') return paginate(this.comments.filter(c => c.postId === post.id && c.status === 'APPROVED'));
       if (!post.allowComments) throw new Error('Comments are closed.');
       const c = { ...body, id: crypto.randomUUID(), postId: post.id, post: { title: post.title }, status: 'PENDING', createdAt: new Date().toISOString(), author: this.session?.user }; this.comments.unshift(c); this.save(); return { data: c };
     }
     if (method === 'GET' && (!parts[1] || parts[1] === 'mine')) {
       if (parts[1] === 'mine' && !this.session) throw new Error('Sign in to see your posts.');
       let list = this.posts.filter(p => (parts[1] === 'mine' || p.status === 'PUBLISHED') && (!q.get('status') || p.status === q.get('status')) && (!q.get('categoryId') || p.categoryId === q.get('categoryId')) && (!q.get('search') || `${p.title} ${p.content}`.toLowerCase().includes(q.get('search').toLowerCase())));
       if (q.get('sort') === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
       return paginate(list);
     }
     let post = this.posts.find(p => p.id === parts[1]);
     if (method === 'GET') { if (!post || (post.status !== 'PUBLISHED' && !this.session)) throw new Error('Post not found.'); return { data: structuredClone(post) }; }
     const fields = { ...body, ...(body.categoryId !== undefined ? { category: categories.find(c => c.id === body.categoryId) || null } : {}), ...(body.tags ? { tags: body.tags.map(name => ({ tag: { name } })) } : {}), updatedAt: new Date().toISOString() };
     if (method === 'POST' && !parts[1]) { post = { ...fields, id: crypto.randomUUID(), author: demoUser, authorId: demoUser.id, status: 'DRAFT', createdAt: new Date().toISOString(), readingTime: Math.max(1, Math.ceil(body.content.split(/\s+/).length / 200)) }; this.posts.unshift(post); }
     else if (!post) throw new Error('Post not found.');
     else if (method === 'PATCH') Object.assign(post, fields);
     else if (method === 'DELETE') this.posts = this.posts.filter(p => p.id !== post.id);
     else post.status = { publish: 'PUBLISHED', unpublish: 'UNPUBLISHED', 'submit-review': 'PENDING_REVIEW' }[parts[2]] || post.status;
     this.save(); return { data: structuredClone(post) };
   }
   throw new Error('This action is not available in demo mode.');
 }
}
