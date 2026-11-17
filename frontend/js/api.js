/* Lapisan API: menimpa data mock di app.js dengan data dari Laravel. Muat SETELAH app.js. */
const API='https://kridaya-v1-forked-production.up.railway.app/api',files={};
const api=async(p,{method='GET',body}={})=>{const fm=body instanceof FormData,
 r=await fetch(API+p,{method,body:fm?body:body&&JSON.stringify(body),headers:{Accept:'application/json',...(body&&!fm?{'Content-Type':'application/json'}:{}),...(localStorage.kdt?{Authorization:'Bearer '+localStorage.kdt}:{})}});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.message||'Error '+r.status);return j};
const nP=(p,own)=>{const x=p.extra||{};return{id:p.user_id,n:p.name,c:p.category,l:p.location,d:p.description,t:p.types||[],sla:24,want:x.want||[],logo:x.logo,status:p.status,note:p.note,y:x.y,nib:x.nib,m:x.m,w:x.w,s:x.s,bmin:x.bmin,bmax:x.bmax,b:own&&S.user.role=='event'?x.badan:[+x.bmin||0,+x.bmax||0]}};
const nD=d=>{const me=S.user.id,ev=d.event_user_id==me;return{id:d.id,pid:ev?d.sponsor_user_id:d.event_user_id,dir:d.initiator_id==me?'out':'in',st:d.status,ct:Date.parse(d.created_at),up:Date.parse(d.updated_at),mt:d.mou_at?Date.parse(d.mou_at):0,se:d.event_signed_at?Date.parse(d.event_signed_at):0,ss:d.sponsor_signed_at?Date.parse(d.sponsor_signed_at):0,en:d.ended_at?Date.parse(d.ended_at):0,
 at:d.deadline_at?Date.parse(d.deadline_at)-12096e5:Date.parse(d.created_at),mou:!!d.mou_at,ce:d.event_sign_code,cs:d.sponsor_sign_code,pitch:d.pitch||'',pd:d.partner_docs||[],sg:{e:!!d.event_signed_at,s:!!d.sponsor_signed_at},
 msgs:d.messages.map(m=>({t:m.body,me:m.user_id==me,at:Date.parse(m.created_at)})),fl:d.fulfillments.map(f=>({id:f.id,k:f.kind=='material'?'sp':'ev',n:f.title,n2:f.note,v:+f.value,fn:f.file_name,ok:!!f.verified_at,at:Date.parse(f.created_at),vt:f.verified_at?Date.parse(f.verified_at):0}))}};
async function sync(){const u=await api('/me');S.user={id:u.id,name:u.name,role:u.role,profile:null};
 if(u.profile)S.user.profile={...nP(u.profile,1),docs:Object.fromEntries((u.documents||[]).map(d=>[d.type,d.path.split('/').pop()])),dl:(u.documents||[]).map(d=>({id:d.id,type:d.type,name:d.path.split('/').pop()}))};
 S.plan=u.plan;S.used=u.matches_used;S.ok=u.profile?.status=='approved';SPONSORS.length=EVENTS.length=0;S.deals=[];
 if(S.ok&&u.role!='admin'){(u.role=='event'?SPONSORS:EVENTS).push(...(await api('/discover')).map(p=>nP(p)));S.deals=(await api('/deals')).map(nD)}}
const swap=r=>{localStorage.removeItem('kdt');Object.assign(S,{user:null,deals:[],ok:false,plan:'free',used:0,pref:{}});SPONSORS.length=EVENTS.length=0;for(const k in files)delete files[k];docs={};step=0;reg=null;go('/daftar/'+r)};
const run=async f=>{try{await f();await sync();route()}catch(e){toast(e.message)}},id=e=>e.dataset.id;
Object.assign(A,{
 otp:async()=>{try{const r=await api('/auth/verify',{method:'POST',body:{identifier:pend.id,code:$$('.otp input').map(i=>i.value).join('')}});localStorage.kdt=r.token;step=0;await sync();go(S.user.role=='admin'?'/admin':S.user.profile?'/dashboard':'/onboarding')}catch(e){toast(e.message)}},
 submit:()=>{for(const n of [1,2,3])if(!obCheck(n)){obShow(n);return toast('Lengkapi kolom yang ditandai')}if(!$('#cm').checked)return toast('Centang pernyataan terlebih dahulu');
  const f=new FormData($('#onb')),o=new FormData();o.append('name',f.get('n'));o.append('category',f.get('c')||'Lainnya');o.append('location',f.get('l'));o.append('description',f.get('d'));
  f.getAll('t').forEach(x=>o.append('types[]',x));['m','w','s','y','nib','bmin','bmax'].forEach(k=>f.get(k)&&o.append('extra['+k+']',f.get(k)));
  if(isEv()&&f.get('b'))o.append('extra[badan]',f.get('b'));if(isEv()&&f.get('bmax'))o.append('extra[bmin]',f.get('bmax'));f.getAll('want').forEach(x=>o.append('extra[want][]',x));Object.entries(files).forEach(([k,v])=>o.append('docs['+k+']',v));
  run(()=>api('/profile',{method:'POST',body:o}).then(()=>{toast('Terkirim untuk validasi');location.hash='/dashboard'}))},
 pitch:e=>run(()=>api('/deals',{method:'POST',body:{targets:[+id(e)]}}).then(()=>toast('Minat terkirim, menunggu jawaban ≤ 24 jam'))),
 batch:()=>run(async()=>{await api('/deals',{method:'POST',body:{targets:[...pick],pitch:(mt.pitch||'').slice(0,500)}});pick.clear();location.hash='/workspace'}),
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
 if(f=='auth')api('/auth/otp',{method:'POST',body:{identifier:v.id,name:v.name,role:v.role}}).then(()=>{pend={id:v.id,name:v.name,role:v.role};step=1;route()}).catch(x=>toast(x.message));
 if(f=='msg'&&v.t.trim())run(()=>api(`/deals/${did}/messages`,{method:'POST',body:{body:v.t}}));
 if(f=='file'&&v.n){const o=new FormData();o.append('title',v.n);o.append('note',v.n2||'');o.append('value',v.v||0);if(t.fn.files[0])o.append('file',t.fn.files[0]);run(()=>api(`/deals/${did}/fulfillments`,{method:'POST',body:o}))}},true);
const _route=route;route=function(){const a=location.hash.startsWith('#/admin')&&S.user?.role=='admin';document.body.classList.toggle('is-adm',a);return a?admin():_route()};
removeEventListener('hashchange',_route);addEventListener('hashchange',route);
addEventListener('focus',async()=>{if(!S.user||S.user.role=='admin'||$('#dlg').open||($('#onb')&&!S.user.profile)||document.activeElement.matches('input,textarea,select'))return;try{await sync();route()}catch{}});
(async()=>{if(localStorage.kdt){try{await sync();if(S.user.role=='admin')location.hash='/admin'}catch{localStorage.removeItem('kdt');S.user=null}}route()})();

document.addEventListener('change',e=>{const t=e.target,f=t.dataset?.doc&&t.files[0];if(!f)return;const big=f.size>5*1024*1024;if(big||!/\.(pdf|jpe?g|png|docx)$/i.test(f.name)){e.stopImmediatePropagation();t.value='';toast(big?'File maksimal 5 MB':'Format harus PDF, JPG, PNG, atau DOCX')}},true);

/* unduh berkas lewat API (butuh token) dan kirim ringkasan ke email */
const dl=async(path,name)=>{try{const r=await fetch(API+path,{headers:{Authorization:'Bearer '+localStorage.kdt}});if(!r.ok)throw new Error(r.status==404?'File tidak ditemukan di server':'Gagal mengunduh ('+r.status+')');const u=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=u;a.download=name||'berkas';a.click();setTimeout(()=>URL.revokeObjectURL(u),5e3)}catch(x){toast(x.message)}};
Object.assign(A,{dlf:e=>dl(`/deals/${id(e)}/fulfillments/${e.dataset.f}/download`,e.textContent),dldoc:e=>dl(`/documents/${id(e)}/download`,e.dataset.n),
 mail:e=>api(`/deals/${id(e)}/email-report`,{method:'POST'}).then(()=>alert('Ringkasan dikirim ke emailmu.')).catch(x=>alert(x.message))});

Object.assign(A,{swap:e=>swap(e.dataset.r)});

document.addEventListener('change',e=>{const t=e.target;if(t.id!='lg'||!t.files[0])return;const f=t.files[0];if(f.size>2*1024*1024){t.value='';return toast('Logo maksimal 2 MB')}
 const o=new FormData();o.append('logo',f);run(()=>api('/profile/logo',{method:'POST',body:o}).then(()=>toast('Logo diperbarui')))});

/* ===== perbaikan UX: pratinjau dokumen, edit profil, kirim ulang OTP, penyegaran otomatis ===== */
async function pvDoc(id,name){const d=$('#dlg');d.className='big';
 d.innerHTML=`<h2 style="margin:0 0 12px;font-size:1.2rem">${esc(name)}</h2><div id="pvd" class="pv"><p class="mut">Memuat…</p></div><div class="row" style="margin-top:14px"><a class="lk" href="#" data-a="dldoc" data-id="${id}" data-n="${esc(name)}">Unduh</a><button class="btn ghost" onclick="$('#dlg').close()">Tutup</button></div>`;d.showModal();
 try{const r=await fetch(API+'/documents/'+id+'/download?inline=1',{headers:{Authorization:'Bearer '+localStorage.kdt}});if(!r.ok)throw new Error(r.status==404?'Berkas tidak ada di server':r.status==403?'Kamu tidak punya akses ke berkas ini':'Gagal memuat ('+r.status+')');
  const b=await r.blob(),u=URL.createObjectURL(b);$('#pvd').innerHTML=b.type.startsWith('image/')?`<img src="${u}" alt="">`:b.type=='application/pdf'?`<iframe src="${u}" title="${esc(name)}"></iframe>`:'<p class="mut">Pratinjau tidak tersedia untuk jenis berkas ini. Gunakan Unduh.</p>'}catch(x){$('#pvd').innerHTML=`<p class="mut">${esc(x.message)}</p>`}}
Object.assign(A,{pvdoc:e=>pvDoc(e.dataset.id,e.dataset.n),
 resend:()=>api('/auth/otp',{method:'POST',body:{identifier:pend.id,name:pend.name,role:pend.role}}).then(()=>{toast('Kode baru dikirim');rsTick(45)}).catch(x=>toast(x.message))});
document.addEventListener('submit',e=>{if(e.target.dataset.f!='pedit')return;e.preventDefault();e.stopImmediatePropagation();
 const f=new FormData(e.target),x={};['m','w','s'].forEach(k=>f.get(k)&&(x[k]=f.get(k)));if(isEv()&&f.get('b')!=null)x.badan=f.get('b');
 ['bmin','bmax'].forEach(k=>f.get(k)!==null&&f.get(k)!==''&&(x[k]=+f.get(k)));x.want=f.getAll('want');
 run(async()=>{await api('/profile/update',{method:'POST',body:{description:f.get('d'),types:f.getAll('t'),extra:x}});$('#dlg').close();toast('Profil diperbarui')})},true);
document.addEventListener('paste',e=>{if(!e.target.closest?.('.otp'))return;const s=(e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,6);if(!s)return;e.preventDefault();$$('.otp input').forEach((i,k)=>i.value=s[k]||'');if(s.length==6)A.otp()});
document.addEventListener('input',e=>{if(e.target.closest?.('.otp')&&$$('.otp input').every(i=>i.value))setTimeout(()=>A.otp(),150)});
/* data kerja sama disegarkan tiap 30 detik (chat dan notifikasi tidak lagi basi). Halaman berisi formulir tidak disentuh. */
setInterval(async()=>{if(document.hidden||!S.user||S.user.role=='admin'||!localStorage.kdt)return;const a=document.activeElement;if(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName))return;if($('#dlg').open)return;
 const r=location.hash.slice(2).split('/')[0];if(['onboarding','masuk','daftar','matching','verifikasi'].includes(r))return;
 try{const b=JSON.stringify(S.deals);await sync();if(JSON.stringify(S.deals)!==b)route()}catch{}},30000);