/* Lapisan API: menimpa data mock di app.js dengan data dari Laravel. Muat SETELAH app.js. */
const API='http://localhost:8000/api',files={};
const api=async(p,{method='GET',body}={})=>{const fm=body instanceof FormData,
 r=await fetch(API+p,{method,body:fm?body:body&&JSON.stringify(body),headers:{Accept:'application/json',...(body&&!fm?{'Content-Type':'application/json'}:{}),...(localStorage.kdt?{Authorization:'Bearer '+localStorage.kdt}:{})}});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||'Error '+r.status);return j};
const nP=(p,own)=>{const x=p.extra||{};return{id:p.user_id,n:p.name,c:p.category,l:p.location,d:p.description,t:p.types||[],sla:24,status:p.status,note:p.note,y:x.y,nib:x.nib,m:x.m,w:x.w,s:x.s,bmin:x.bmin,bmax:x.bmax,b:own&&S.user.role=='event'?x.badan:[+x.bmin||0,+x.bmax||0]}};
const nD=d=>{const me=S.user.id,ev=d.event_user_id==me;return{id:d.id,pid:ev?d.sponsor_user_id:d.event_user_id,dir:d.initiator_id==me?'out':'in',st:d.status,ct:Date.parse(d.created_at),up:Date.parse(d.updated_at),mt:d.mou_at?Date.parse(d.mou_at):0,se:d.event_signed_at?Date.parse(d.event_signed_at):0,ss:d.sponsor_signed_at?Date.parse(d.sponsor_signed_at):0,en:d.ended_at?Date.parse(d.ended_at):0,
 at:d.deadline_at?Date.parse(d.deadline_at)-12096e5:Date.parse(d.created_at),mou:!!d.mou_at,sg:{e:!!d.event_signed_at,s:!!d.sponsor_signed_at},
 msgs:d.messages.map(m=>({t:m.body,me:m.user_id==me,at:Date.parse(m.created_at)})),fl:d.fulfillments.map(f=>({id:f.id,k:f.kind=='material'?'sp':'ev',n:f.title,n2:f.note,v:+f.value,fn:f.file_name,ok:!!f.verified_at,at:Date.parse(f.created_at),vt:f.verified_at?Date.parse(f.verified_at):0}))}};
async function sync(){const u=await api('/me');S.user={id:u.id,name:u.name,role:u.role,profile:null};
 if(u.profile)S.user.profile={...nP(u.profile,1),docs:Object.fromEntries((u.documents||[]).map(d=>[d.type,d.path.split('/').pop()]))};
 S.plan=u.plan;S.used=u.matches_used;S.ok=u.profile?.status=='approved';SPONSORS.length=EVENTS.length=0;S.deals=[];
 if(S.ok&&u.role!='admin'){(u.role=='event'?SPONSORS:EVENTS).push(...(await api('/discover')).map(p=>nP(p)));S.deals=(await api('/deals')).map(nD)}}
const swap=r=>{localStorage.removeItem('kdt');Object.assign(S,{user:null,deals:[],ok:false,plan:'free',used:0,pref:{}});SPONSORS.length=EVENTS.length=0;for(const k in files)delete files[k];docs={};step=0;reg=null;go('/daftar/'+r)};
const run=async f=>{try{await f();await sync();route()}catch(e){toast(e.message)}},id=e=>e.dataset.id;
Object.assign(A,{
 otp:async()=>{try{const r=await api('/auth/verify',{method:'POST',body:{identifier:pend.id,code:$$('.otp input').map(i=>i.value).join('')}});localStorage.kdt=r.token;step=0;await sync();go(S.user.role=='admin'?'/admin':S.user.profile?'/dashboard':'/onboarding')}catch(e){toast(e.message)}},
 submit:()=>{if(pct()<100||!$('#cm').checked)return toast('Lengkapi semua field wajib, dokumen, dan centang pernyataan');
  const f=new FormData($('#onb')),o=new FormData();o.append('name',f.get('n'));o.append('category',f.get('c')||'Lainnya');o.append('location',f.get('l'));o.append('description',f.get('d'));
  f.getAll('t').forEach(x=>o.append('types[]',x));['m','w','s','y','nib','bmin','bmax'].forEach(k=>f.get(k)&&o.append('extra['+k+']',f.get(k)));
  if(isEv()&&f.get('b'))o.append('extra[badan]',f.get('b'));if(isEv()&&f.get('bmax'))o.append('extra[bmin]',f.get('bmax'));Object.entries(files).forEach(([k,v])=>o.append('docs['+k+']',v));
  run(()=>api('/profile',{method:'POST',body:o}).then(()=>{toast('Terkirim untuk validasi');location.hash='/dashboard'}))},
 pitch:e=>run(()=>api('/deals',{method:'POST',body:{targets:[+id(e)]}}).then(()=>toast('Minat terkirim, menunggu jawaban ≤ 24 jam'))),
 batch:()=>run(async()=>{await api('/deals',{method:'POST',body:{targets:[...pick]}});pick.clear();location.hash='/workspace'}),
 acc:e=>run(async()=>{await api(`/deals/${id(e)}/respond`,{method:'POST',body:{accept:true}});location.hash='/workspace/'+id(e)}),
 rej:e=>run(()=>api(`/deals/${id(e)}/respond`,{method:'POST',body:{accept:false}})),
 mou:e=>run(()=>api(`/deals/${id(e)}/mou`,{method:'POST'})),
 sign:e=>(e.dataset.k=='e')!=isEv()?toast('Kamu hanya bisa menandatangani sisimu sendiri'):run(()=>api(`/deals/${id(e)}/sign`,{method:'POST'})),
 vf:e=>run(()=>api(`/deals/${id(e)}/fulfillments/${e.dataset.f}/verify`,{method:'POST'})),
 end:e=>run(async()=>{await api(`/deals/${id(e)}/end`,{method:'POST'});$('#dlg').close();toast('Kerja sama diakhiri')}),
 plan:()=>run(()=>api('/me/plan',{method:'POST',body:{plan:S.plan=='free'?'premium':'free'}})),
 out:()=>{localStorage.removeItem('kdt');for(const k in files)delete files[k];docs={};Object.assign(S,{user:null,deals:[],ok:false,plan:'free',used:0,pref:{}});SPONSORS.length=EVENTS.length=0;step=0;go('/masuk')},
 adm:e=>api('/admin/profiles/'+id(e),{method:'POST',body:{status:e.dataset.s,note:e.dataset.s=='rejected'?(prompt('Alasan penolakan (akan dilihat pengguna):')||''):''}}).then(()=>{toast('Tersimpan');admin()}).catch(x=>toast(x.message))});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.doc&&t.files[0])files[t.dataset.doc]=t.files[0]});
document.addEventListener('submit',e=>{const f=e.target.dataset.f,t=e.target,v=Object.fromEntries(new FormData(t)),did=location.hash.split('/')[2];
 if(!['auth','msg','file'].includes(f))return;e.preventDefault();e.stopImmediatePropagation();
 if(f=='auth')api('/auth/otp',{method:'POST',body:{identifier:v.id,name:v.name,role:v.role}}).then(()=>{pend={id:v.id};step=1;route()}).catch(x=>toast(x.message));
 if(f=='msg'&&v.t.trim())run(()=>api(`/deals/${did}/messages`,{method:'POST',body:{body:v.t}}));
 if(f=='file'&&v.n){const o=new FormData();o.append('title',v.n);o.append('note',v.n2||'');o.append('value',v.v||0);if(t.fn.files[0])o.append('file',t.fn.files[0]);run(()=>api(`/deals/${did}/fulfillments`,{method:'POST',body:o}))}},true);
/* halaman admin: antrean verifikasi profil */
async function admin(){hd('admin');try{const l=(await api('/admin/profiles?status=pending')).data;
 $('#app').innerHTML=`<div class="head"><div><h1 class="h1">Verifikasi profil</h1><p class="mut" style="margin:0">${l.length} menunggu</p></div></div><div class="grid">${l.map(p=>`<div class="card"><h3>${esc(p.name)}</h3><span class="mut">${esc(p.category)} · ${esc(p.location)} · ${esc(p.user.role)}</span><p>${esc(p.description)}</p><p class="mut" style="font-size:13px">Dokumen: ${p.user.documents.map(d=>`<a href="#" data-a="dldoc" data-id="${d.id}" data-n="${esc(d.type)}">${esc(d.type)}</a>`).join(', ')||'-'}</p><div style="display:flex;gap:8px"><button class="btn sm" data-a="adm" data-id="${p.id}" data-s="approved">Setujui</button><button class="btn red sm" data-a="adm" data-id="${p.id}" data-s="rejected">Tolak</button></div></div>`).join('')||'<p class="mut">Tidak ada antrean.</p>'}</div>`}catch(x){toast(x.message)}}
const _route=route;route=function(){return location.hash.startsWith('#/admin')&&S.user?.role=='admin'?admin():_route()};
removeEventListener('hashchange',_route);addEventListener('hashchange',route);
addEventListener('focus',async()=>{if(!S.user||S.user.role=='admin'||$('#dlg').open||($('#onb')&&!S.user.profile)||document.activeElement.matches('input,textarea,select'))return;try{await sync();route()}catch{}});
(async()=>{if(localStorage.kdt){try{await sync();if(S.user.role=='admin')location.hash='/admin'}catch{localStorage.removeItem('kdt');S.user=null}}route()})();

document.addEventListener('change',e=>{const t=e.target,f=t.dataset?.doc&&t.files[0];if(!f)return;const big=f.size>5*1024*1024;if(big||!/\.(pdf|jpe?g|png|docx)$/i.test(f.name)){e.stopImmediatePropagation();t.value='';toast(big?'File maksimal 5 MB':'Format harus PDF, JPG, PNG, atau DOCX')}},true);

/* unduh berkas lewat API (butuh token) dan kirim ringkasan ke email */
const dl=async(path,name)=>{try{const r=await fetch(API+path,{headers:{Authorization:'Bearer '+localStorage.kdt}});if(!r.ok)throw new Error(r.status==404?'File tidak ditemukan di server':'Gagal mengunduh ('+r.status+')');const u=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=u;a.download=name||'berkas';a.click();setTimeout(()=>URL.revokeObjectURL(u),5e3)}catch(x){toast(x.message)}};
Object.assign(A,{dlf:e=>dl(`/deals/${id(e)}/fulfillments/${e.dataset.f}/download`,e.textContent),dldoc:e=>dl(`/documents/${id(e)}/download`,e.dataset.n),
 mail:e=>api(`/deals/${id(e)}/email-report`,{method:'POST'}).then(()=>alert('Ringkasan dikirim ke emailmu.')).catch(x=>alert(x.message))});

Object.assign(A,{swap:e=>swap(e.dataset.r)});