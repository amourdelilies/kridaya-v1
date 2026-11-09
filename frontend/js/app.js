const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S=JSON.parse(localStorage.getItem('kd2')||'null')||{user:null,deals:[],plan:'free',used:0,ok:false,pref:{}};
const save=()=>localStorage.setItem('kd2',JSON.stringify(S));
const QUOTA=5,LOC=['Bandung','Jakarta','Yogyakarta','Surabaya'],TYPES=['Cash','Produk','Jasa','Voucher'];
const BR={'< Rp10 jt':[0,1e7],'Rp10–30 jt':[1e7,3e7],'> Rp30 jt':[3e7,1e12]};
const isEv=()=>S.user?.role==='event',pool=()=>isEv()?SPONSORS:EVENTS,find=id=>[...SPONSORS,...EVENTS].find(x=>x.id==id);
const Rp=n=>'Rp '+Math.round(n||0).toLocaleString('id-ID'),rng=b=>b[0]==b[1]?Rp(b[0]):Rp(b[0]/1e6*1e6).replace(/\.000\.000$/,' jt')+' – '+Rp(b[1]).replace(/\.000\.000$/,' jt');
const chips=a=>(a||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('');
const opt=(a,all,v)=>(all?`<option value="">${all}</option>`:'')+a.map(x=>`<option ${x==v?'selected':''}>${esc(x)}</option>`).join('');
const left=()=>S.plan=='premium'?null:QUOTA-S.used;
const toast=m=>{const t=$('#toast');t.textContent=m;t.className='on';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2400)};
const cats=()=>[...new Set(pool().map(p=>p.c))];
const busy=()=>S.deals.filter(d=>['pending','active'].includes(d.st)).map(d=>d.pid);

/* skor kecocokan: lokasi, kategori, bentuk dukungan, dan rentang dana */
const AFF={'F&B':{Seminar:70,Lomba:85,Webinar:55,Lainnya:80},Fashion:{Seminar:55,Lomba:80,Webinar:50,Lainnya:85},Teknologi:{Seminar:90,Lomba:85,Webinar:90,Lainnya:60},Jasa:{Seminar:80,Lomba:80,Webinar:75,Lainnya:70},Kecantikan:{Seminar:60,Lomba:70,Webinar:65,Lainnya:80}},MIN=65;
/* kecocokan 2 arah: kebutuhan event dibandingkan dengan kemampuan sponsor (dana, dukungan, industri, lokasi) */
const fit=p=>{const m=S.user?.profile||{},e=isEv(),need=e?+m.bmax||0:p.b[1],lo=e?p.b[0]:+m.bmin||0,hi=e?p.b[1]:+m.bmax||0,et=(e?m.t:p.t)||[],st=(e?p.t:m.t)||[],sc=e?p.c:m.c,ec=e?m.c:p.c,sl=e?p.l:m.l,el=e?m.l:p.l;
 const dn=!need||!hi?60:need>=lo&&need<=hi?100:need<lo?Math.max(25,Math.round(100*need/lo)):Math.max(25,Math.round(100*hi/need)),
  ov=st.filter(t=>et.includes(t)).length,du=!et.length?70:ov?Math.min(100,Math.round(60+40*ov/et.length)):10,
  ind=(AFF[sc]||{})[ec]??60,lk=sl&&sl==el?100:50,parts=[['Dana',dn],['Dukungan',du],['Industri',ind],['Lokasi',lk]];
 return{total:Math.round(dn*.35+du*.25+ind*.25+lk*.15),parts}};
const score=p=>fit(p).total;
const scc=s=>`<span class="sc ${s>=90?'':s>=80?'m':'l'}">${s}% match</span>`;
const hit=p=>{const f=S.pref;return(!f.c||p.c==f.c)&&(!f.l||p.l==f.l)&&(!f.t||p.t.includes(f.t))&&(!f.b||(p.b[0]<=BR[f.b][1]&&p.b[1]>=BR[f.b][0]))};
const pcard=(p,cls='',extra='')=>`<div class="card pc ${cls}" data-a="${extra?'pick':'sel'}" data-id="${p.id}">${extra}<div class="top"><div><h3>${esc(p.n)}</h3><span class="mut">${esc(p.c)} · ${esc(p.l)}</span></div></div><div>${chips(p.t)}</div><div class="mut" style="font-size:13px"><b style="color:var(--ink)">${rng(p.b)}</b> · respon &lt; ${p.sla} jam</div></div>`;

let reg=null,mode='daftar',step=0,pend=null,tab='fl',dir={q:'',c:'',l:'',t:'',sel:null},pick=new Set(),docs={};

/* ---------- AUTH ---------- */
function V_auth(){
 if(step)return`<section class="card narrow"><h2>Verifikasi OTP</h2><p class="mut">Kode dikirim ke ${esc(pend.id)}. Untuk demo, pakai 123456.</p><div class="otp">${'<input maxlength="1" inputmode="numeric" aria-label="digit OTP">'.repeat(6)}</div><button class="btn" data-a="otp">Verifikasi</button></section>`;
 return`<section class="card narrow"><div class="tabs"><button data-a="mode" data-m="masuk" class="${mode=='masuk'?'on':''}">Masuk</button><button data-a="mode" data-m="daftar" class="${mode=='daftar'?'on':''}">Daftar</button></div>
 <form data-f="auth">${mode=='daftar'?`${reg?`<input type="hidden" name="role" value="${reg}"><div class="rolepill"><b>Mendaftar sebagai ${reg=='event'?'Pihak Event':'Pihak Sponsor'}</b><a href="#/daftar/${reg=='event'?'sponsor':'event'}">Bukan? Daftar sebagai ${reg=='event'?'sponsor':'event'}</a></div>`:`<label>Daftar sebagai</label><div class="roles"><label><input type="radio" name="role" value="event" checked>Pihak Event<small>Mencari sponsor</small></label><label><input type="radio" name="role" value="sponsor">Pihak Sponsor<small>Mencari event</small></label></div>`}<label>Nama lengkap / PIC</label><input name="name" required>`:''}
 <label>No. HP / Email</label><input name="id" required><button class="btn" style="width:100%">Kirim kode OTP</button></form></section>`}

/* ---------- ONBOARDING ---------- */
function V_onb(){const e=isEv(),p=S.user.profile||S.user.draft||{},rj=S.user.profile?.status=='rejected',lk=S.user.profile&&!rj;docs={...docs,...(p.docs||{})};
 const st=S.ok?3:lk?2:1,fl=(a,b)=>`<span class="${st>a?'ok':st==a?'on':''}"><i>${st>a?'✓':a}</i>${b}</span>`;
 const f=(k,l,ph='',t='text',req=1)=>`<label>${l}</label><input name="${k}" type="${t}" placeholder="${ph}" value="${esc(p[k])}" ${req?'data-r':''}>`;
 const dz=(k,l,req=1)=>`<label class="drop ${docs[k]?'ok':''}"><input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" hidden data-doc="${k}" ${req?'data-dr':''}><b>${l}</b><span>${docs[k]?'✓ '+esc(docs[k]):'Klik untuk unggah'}</span></label>`;
 const radios=(n,a,type='radio')=>`<div class="opts">${a.map(x=>`<label class="opt"><input type="${type}" name="${n}" value="${x}" ${type=='radio'?(p[n]||a[0])==x:(p[n]||[]).includes(x)?'checked':''}>${x}</label>`).join('')}</div>`;
 return`<div class="card banner"><div><h3>${S.ok?'Akun terverifikasi':rj?'Profil perlu diperbaiki':S.user.profile?'Dokumen sedang diverifikasi':(isEv()?'Daftarkan eventmu dan dokumen legalnya':'Daftarkan usahamu dan tawaran dukungannya')}</h3><span class="mut">${S.ok?'Kamu bisa menjelajah direktori dan matching.':rj?'Alasan: '+esc(S.user.profile.note||'tidak dicantumkan')+'. Perbaiki data lalu kirim ulang.':S.user.profile?'Admin memeriksa maksimal 1x24 jam.':'Admin akan memeriksa dokumen sebelum akunmu aktif (maks. 1x24 jam).'}</span></div>
 <div class="flow">${fl(1,e?'Isi data event':'Isi data usaha')}<hr>${fl(2,'Validasi admin')}<hr>${fl(3,'Aktif')}</div></div>
 <form id="onb" ${S.user.profile?'class="locked"':''}><div class="col3">
 <div class="card"><h3><span>01</span>${e?'Identitas proker':'Identitas usaha'}</h3>${f('n',e?'Nama event / proker':'Nama usaha')}
 <label>Kategori</label>${e?radios('c',['Webinar','Lomba','Seminar','Lainnya']):`<select name="c">${opt(['F&B','Fashion','Teknologi','Jasa','Kecantikan','Lainnya'],'',p.c)}</select>`}
 <label>Lokasi</label><select name="l">${opt(LOC,'',p.l)}</select>
 <label>Deskripsi ${e?'(target peserta, jumlah target, dll)':''}</label><textarea name="d" rows="4" data-r>${esc(p.d)}</textarea>
 ${e?f('b','Badan yang menaungi','mis. BEM Fakultas Ilmu Komputer')+f('bmax','Dana sponsor yang dibutuhkan (Rp)','2000000','number'):`<div class="two"><div>${f('y','Tahun berdiri','2020','number')}</div><div>${f('nib','Nomor NIB')}</div></div><label>Bentuk dukungan</label>${radios('t',TYPES,'checkbox')}<div class="two"><div>${f('bmin','Dana sponsor minimal (Rp)','','number',0)}</div><div>${f('bmax','Dana sponsor maksimal (Rp)','','number',0)}</div></div>`}</div>
 <div class="card"><h3><span>02</span>Kanal komunikasi PIC</h3>${f('m','Email aktif','nama@domain.id','email')}${f('w','No. WhatsApp','+62 812…')}${f('s','Media sosial','@akun',  'text',0)}</div>
 <div class="card"><h3><span>03</span>Dokumen legal</h3>${e?dz('izin','Surat izin kegiatan')+dz('panitia','Susunan kepanitiaan')+dz('rab','RAB')+dz('proposal','Proposal sponsorship')+dz('dok','Dokumentasi (opsional)',0):dz('nib','Dokumen NIB')+dz('izin','Surat izin usaha',0)}<div class="mut" style="font-size:12px;margin-top:12px">PDF/JPG/PNG, maks. 5 MB per file.</div></div></div>
 <label class="opt" style="display:flex;gap:10px;border-radius:12px;padding:12px 16px"><input type="checkbox" id="cm" style="display:block;width:auto" ${lk?'checked':''}>Saya menyatakan seluruh data dan dokumen di atas benar dan dapat dipertanggungjawabkan.</label>
 <div class="bottom"><div style="flex:1;min-width:180px"><small class="mut">Kelengkapan <b id="pt">0%</b></small><div class="prog"><i id="pb" style="width:0"></i></div></div><div style="display:flex;gap:8px"><button type="button" class="btn ghost" data-a="draft">Simpan draft</button><button type="button" class="btn" data-a="submit" ${lk?'disabled':''}>Kirim untuk validasi (1x24 jam)</button></div></div></form>`}
const pct=()=>{const r=$$('#onb [data-r]'),d=$$('#onb [data-dr]');const n=r.filter(i=>i.value.trim()).length+d.filter(i=>docs[i.dataset.doc]).length,t=r.length+d.length,v=Math.round(n/t*100);if($('#pb')){$('#pb').style.width=v+'%';$('#pt').textContent=v+'%'}return v};
const collect=()=>{const f=new FormData($('#onb')),o={};f.forEach((v,k)=>{if(k!='t')o[k]=v});o.t=f.getAll('t');o.docs={...docs};o.b=[+o.bmin||0,+o.bmax||0];return o};

/* ---------- DIREKTORI ---------- */
function dres(){const l=pool().filter(p=>(!dir.q||(p.n+p.d+p.c).toLowerCase().includes(dir.q.toLowerCase()))&&(!dir.c||p.c==dir.c)&&(!dir.l||p.l==dir.l)&&(!dir.t||p.t.includes(dir.t))).sort((a,b)=>a.n.localeCompare(b.n));
 const s=find(dir.sel)&&l.find(x=>x.id==dir.sel)||l[0];
 return`<div class="list">${l.map(p=>pcard(p,s?.id==p.id?'sel':'')).join('')||'<p class="mut">Tidak ada hasil. Coba longgarkan filter.</p>'}</div><div class="card stk">${s?detail(s):'<p class="mut">Pilih item untuk melihat detail.</p>'}</div>`}
function detail(p){const m=S.user.profile||{},sent=busy().includes(p.id),ev=isEv();
 return`<div class="top row"><div><h2 style="margin:0">${esc(p.n)}</h2><span class="mut">${esc(p.c)} · ${esc(p.l)}${p.y?' · sejak '+esc(p.y):''}</span></div></div><p>${esc(p.d)}</p><div>${chips(p.t)}</div>
 <div class="kpi"><div><small>${ev?'Dana per sponsor':'Kebutuhan dana'}</small><b style="font-size:.95rem">${rng(p.b)}</b></div><div><small>SLA respon</small><b>&lt; ${p.sla} jam</b></div></div>
 <h3>Kecocokan dengan profilmu</h3><ul class="chk"><li class="${p.l==m.l?'':'no'}">Lokasi ${p.l==m.l?'sama':'berbeda'} (${esc(p.l)})</li><li class="${S.pref.c?p.c==S.pref.c?'':'no':''}">Kategori ${esc(p.c)}</li><li class="${p.t.some(t=>(m.t||[]).includes(t))||!ev?'':'no'}">Bentuk dukungan: ${esc(p.t.join(', '))}</li></ul>
 <button class="btn" style="width:100%" data-a="pitch" data-id="${p.id}" ${sent?'disabled':''}>${sent?'Minat sudah dikirim':'Kirim minat'+(left()===null?'':' (1 kuota)')}</button>`}
function V_dir(){return`<div class="head"><div><h1 class="h1">Direktori ${isEv()?'sponsor':'event'}</h1><p class="mut" style="margin:0">Katalog lengkap: telusuri dan filter sendiri. Mau rekomendasi yang dihitung otomatis? Buka Matching.</p></div><div class="stats"><div class="stat"><small>Terverifikasi</small><b>${pool().length}</b></div><div class="stat"><small>Kerja sama aktif</small><b>${S.deals.filter(d=>d.st=='active').length}</b></div></div></div>
 <div class="filters"><input data-i="q" placeholder="Cari nama, kategori, kata kunci…" value="${esc(dir.q)}" id="dq"><select data-i="c">${opt(cats(),'Semua kategori',dir.c)}</select><select data-i="l">${opt(LOC,'Semua lokasi',dir.l)}</select><select data-i="t">${opt(TYPES,'Semua bentuk dukungan',dir.t)}</select></div><div class="split" id="dres">${dres()}</div>`}

/* ---------- MATCHING (papan seret-dan-lepas) ---------- */
let mt={cand:[],seen:new Set(),ran:false,load:false,sig:'',uid:null},nope=new Set(),dragId=null;
const kcard=(p,z,deal,i)=>`<article class="kc ${z!='p'?'cp':''} ${deal?'deal':''}" draggable="true" data-mc="${p.id}" style="${deal?'animation-delay:'+i*80+'ms':''}"><div class="kc-t"><div class="kc-n"><b>${esc(p.n)}</b><small>${esc(p.c)} · ${esc(p.l)}</small></div><span class="kc-s">${score(p)}<i>%</i></span></div>${z=='p'?`<p class="kc-d">${esc(p.d||'')}</p><div class="kc-m"><span>${rng(p.b)}</span><span>Respon &lt; ${p.sla} jam</span></div><div>${chips(p.t)}</div>${fp(p)}<div class="kc-a"><button class="mn" data-a="mmv" data-id="${p.id}" data-z="n">${svg('x')}Belum minat</button><button class="my" data-a="mmv" data-id="${p.id}" data-z="y">${svg('heart')}Minat</button></div>`:`<button class="kc-b" data-a="mmv" data-id="${p.id}" data-z="p">Kembalikan</button>`}</article>`;
function mres(deal){
 const n=S.plan=='premium'?20:5,q=left();if(mt.pitch==null)mt.pitch=defPitch();
 if(!mt.ran)return`<section class="card kst"><div><h3 style="font-size:1.4rem">Temukan ${isEv()?'sponsor':'event'} yang cocok</h3><p class="mut" style="margin:6px 0 0">Kami tampilkan ${n} kandidat terbaik sesuai preferensimu. Tidak ada yang muncul sebelum kamu memulai.</p><ol><li><div><b>Atur preferensi</b><br><small class="mut">Kategori, lokasi, rentang dana, dan bentuk dukungan.</small></div></li><li><div><b>Klik Mulai matching</b><br><small class="mut">Kandidat terbaik muncul sebagai kartu.</small></div></li><li><div><b>Seret ke Minat atau Belum minat</b><br><small class="mut">Atau pakai tombolnya. Lalu kirim yang diminati sekaligus.</small></div></li></ol></div><div class="kdeck" aria-hidden="true"><i></i><i></i><i></i></div></section>`;
 if(mt.load)return`<div class="kb"><section class="kcol"><div class="kh">Mencari kandidat…</div><div class="dz pool">${'<div class="ksk"></div>'.repeat(Math.min(n,4))}</div></section></div>`;
 const c=mt.cand.filter(p=>!busy().includes(p.id));pick.forEach(i=>{if(!c.some(p=>p.id==i))pick.delete(i)});
 const pool=c.filter(p=>!pick.has(p.id)&&!nope.has(p.id)),ys=c.filter(p=>pick.has(p.id)),ns=c.filter(p=>nope.has(p.id)),tot=ys.reduce((a,p)=>a+p.b[1],0),over=q!==null&&ys.length>q;
 if(!c.length)return`<section class="card"><div class="empty">${svg('inbox')}<br>Belum ada kecocokan di atas ${MIN}% untuk kombinasi ini.<br><small>Coba longgarkan preferensi, atau mulai ulang untuk melihat kandidat yang sudah dilewati.</small><br><button class="btn ghost sm" style="margin-top:12px" data-a="mrst">Mulai ulang</button></div></section>`;
 return`${mt.sig&&mt.sig!==JSON.stringify(S.pref)?'<div class="mnote">Preferensi berubah. Klik <b>Matching lagi</b> untuk memperbarui kandidat.</div>':''}
 <div class="kb"><section class="kcol"><div class="kh">Kandidat<span>${pool.length}</span></div><div class="dz pool" data-z="p">${pool.map((p,i)=>kcard(p,'p',deal,i)).join('')||'<div class="dh">Semua kandidat sudah kamu putuskan.<br>Klik Matching lagi untuk kandidat berikutnya.</div>'}</div></section>
 <section class="kcol"><div class="kh y">${svg('heart')}Minat<span>${ys.length}</span></div><div class="dz y" data-z="y">${ys.map(p=>kcard(p,'y')).join('')||'<div class="dh">Seret kartu ke sini<br>atau klik tombol Minat</div>'}</div></section>
 <section class="kcol"><div class="kh n">${svg('x')}Belum minat<span>${ns.length}</span></div><div class="dz n" data-z="n">${ns.map(p=>kcard(p,'n')).join('')||'<div class="dh">Kartu yang kamu lewati<br>akan ada di sini</div>'}</div></section></div>
 ${ys.length?`<section class="card pk"><div class="pn-h"><h3>Pesan pembuka</h3><span class="ct">Dikirim bersama minatmu</span></div><textarea id="mpt" rows="3" maxlength="500">${esc(mt.pitch)}</textarea></section>`:''}<div class="bottom"><div><b>${ys.length} minat</b> · ${ns.length} belum minat · ${pool.length} belum dipilih<div class="mut" style="font-size:13px">Potensi dana ${Rp(tot)} · pihak lain punya 1×24 jam untuk menjawab${over?` · <span style="color:#c8472a">Kuota hanya ${q}</span>`:''}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-a="mrun">Matching lagi</button><button class="btn" data-a="batch" ${ys.length&&!over?'':'disabled'}>Kirim minat${q===null?'':' ('+ys.length+' kuota)'}</button></div></div>`}
function V_match(){
 if(mt.uid!==S.user.id){mt={cand:[],seen:new Set(),ran:false,load:false,sig:'',uid:S.user.id};pick.clear();nope.clear()}
 const f=S.pref,e=isEv();
 return`<div class="head"><div><h1 class="h1">${e?'Sponsor':'Event'} matching</h1><p class="mut" style="margin:0">Hanya kecocokan tinggi (≥${MIN}%), dihitung dari dana, dukungan, industri, dan lokasi, lengkap dengan rincian skor dan pesan pembuka otomatis.</p></div>${chips([S.plan=='premium'?'Premium · 20 kandidat':'Free · 5 kandidat'])}</div>
 <div class="card kpf"><div><label>Kategori</label><select data-p="c">${opt(cats(),'Semua',f.c)}</select></div><div><label>Lokasi</label><select data-p="l">${opt(LOC,'Semua',f.l)}</select></div><div><label>Rentang dana</label><select data-p="b">${opt(Object.keys(BR),'Semua',f.b)}</select></div><div><label>Bentuk dukungan</label><select data-p="t">${opt(TYPES,'Semua',f.t)}</select></div><button class="btn lg" id="mbtn" data-a="mrun">${mt.ran?'Matching lagi':'Mulai matching'}</button></div>
 <div id="mres">${mres()}</div>`}
const mv=(id,z)=>{pick.delete(id);nope.delete(id);if(z=='y')pick.add(id);if(z=='n')nope.add(id);$('#mres').innerHTML=mres()};

document.addEventListener('dragstart',e=>{const c=e.target.closest?.('[data-mc]');if(!c)return;dragId=+c.dataset.mc;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',String(dragId));setTimeout(()=>{c.classList.add('dragging');$$('.dz').forEach(z=>z.classList.add('armed'))},0)});
document.addEventListener('dragend',()=>{dragId=null;$$('.dragging').forEach(c=>c.classList.remove('dragging'));$$('.dz').forEach(z=>z.classList.remove('armed','over'))});
document.addEventListener('dragover',e=>{const z=e.target.closest?.('.dz');if(z&&dragId!=null){e.preventDefault();$$('.dz').forEach(x=>x.classList.toggle('over',x==z))}});
document.addEventListener('drop',e=>{const z=e.target.closest?.('.dz');if(!z||dragId==null)return;e.preventDefault();const id=dragId;dragId=null;if(z.dataset.z=='y')burst(z);mv(id,z.dataset.z)});

/* ---------- WORKSPACE ---------- */
const mouText=(d,p)=>{const m=S.user.profile||{},e=isEv();return`NOTA KESEPAHAMAN (MoU) SPONSORSHIP\n\nPihak Pertama (Event): ${e?m.n:p.n}\nPihak Kedua (Sponsor): ${e?p.n:m.n}\n\nPasal 1. Bentuk dukungan: ${p.t.join(' / ')}.\nPasal 2. Pihak Kedua menyerahkan materi (logo, adlibs) paling lambat 14 hari setelah penandatanganan.\nPasal 3. Pihak Pertama memberikan eksposur dan menyerahkan bukti pelaksanaan.\nPasal 4. Perselisihan diselesaikan secara musyawarah.\n\nTanggal: ${new Date(d.at).toLocaleDateString('id-ID',{dateStyle:'long'})}`};
const dcard=d=>{const p=find(d.pid),l={pending:d.dir=='in'?'Minat masuk':'Menunggu jawaban',active:'Aktif',done:'Selesai',rejected:'Ditolak',expired:'Kedaluwarsa'}[d.st];
 return`<div class="card"><h3>${esc(p.n)}</h3>${chips([l])}<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">${d.st=='pending'&&d.dir=='in'?`<button class="btn sm" data-a="acc" data-id="${d.id}">Terima</button><button class="btn red sm" data-a="rej" data-id="${d.id}">Tolak</button>`:''}${['active','done'].includes(d.st)?`<a class="btn sm" href="#/workspace/${d.id}">Buka workspace</a>`:''}</div></div>`};
function V_work(id){
 if(!id)return`<div class="head"><div><h1 class="h1">Workspace &amp; Deal</h1><p class="mut" style="margin:0">Semua kerja samamu di satu tempat.</p></div></div>${S.deals.length?`<div class="grid">${S.deals.map(dcard).join('')}</div>`:'<div class="card"><p class="mut">Belum ada kerja sama. Mulai dari <a href="#/matching"><b>Sponsor Matching</b></a>.</p></div>'}`;
 const d=S.deals.find(x=>x.id==id);if(!d)return V_work();const p=find(d.pid),me=isEv()?'ev':'sp',both=d.sg.e&&d.sg.s,st=d.st=='done'?3:both?2:d.mou?1:0,ok=d.fl.filter(x=>x.ok).length,pc=d.fl.length?Math.round(ok/d.fl.length*100):0;
 const days=Math.max(0,Math.ceil((d.at+12096e5-Date.now())/864e5)),cl=[['Buat MoU otomatis',d.mou],['Event menandatangani MoU',d.sg.e],['Sponsor menandatangani MoU',d.sg.s],['Sponsor mengunggah materi',d.fl.some(f=>f.k=='sp')],['Event mengunggah bukti',d.fl.some(f=>f.k=='ev')],['Semua deliverables terverifikasi',d.fl.length>0&&ok==d.fl.length]];
 const it=f=>`<div class="it"><div><b>${esc(f.n)}</b><small>${esc(f.n2||'')}${f.fn?` · <a href="#" data-a="dlf" data-id="${d.id}" data-f="${f.id}">${esc(f.fn)}</a>`:''}${f.v?' · '+Rp(f.v):''}</small></div>${f.ok?'<span class="chip">Terverifikasi</span>':f.k!=me?`<button class="btn sm" data-a="vf" data-id="${d.id}" data-f="${f.id}">Verifikasi</button>`:'<span class="chip" style="background:#eee;color:var(--mut)">Menunggu</span>'}</div>`;
 const col=(k,t)=>`<div><h3>${t}</h3>${d.fl.filter(f=>f.k==k).map(it).join('')||'<p class="mut" style="font-size:13px">Belum ada.</p>'}${k==me?`<form data-f="file" data-k="${k}" class="card" style="margin-top:12px"><input name="n" placeholder="${k=='sp'?'Judul materi, mis. Logo vektor':'Judul bukti, mis. Foto booth'}" required><input name="n2" placeholder="Catatan" style="margin-top:8px"><div class="two" style="margin-top:8px"><input name="v" type="number" min="0" placeholder="Nilai (Rp)"><input name="fn" type="file"></div><button class="btn sm">Tambah</button></form>`:''}</div>`;
 const main=tab=='fl'?(!both?'<div class="card"><p class="mut">Deliverables dibuka setelah MoU ditandatangani kedua pihak. Buka tab Dokumen &amp; MoU.</p></div>':`<div class="card"><div class="row"><b>${ok} dari ${d.fl.length} terverifikasi</b><span class="mut">Tenggat ${new Date(d.at+12096e5).toLocaleDateString('id-ID',{dateStyle:'long'})}</span></div><div class="prog" style="margin:8px 0 16px"><i style="width:${pc}%"></i></div><div class="two">${col('sp','Dari sponsor (materi)')}${col('ev','Dari event (bukti)')}</div></div>`)
 :`<div class="card"><div class="paper">${d.mou?esc(mouText(d,p)):'MoU belum dibuat.'}</div>${d.mou?`<div class="sgs">${sigBox(d,'e')}${sigBox(d,'s')}</div>`:''}<div class="row" style="margin-top:14px"><button class="btn lime" data-a="mou" data-id="${d.id}" ${d.mou?'disabled':''}>Buat MoU otomatis</button><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost" data-a="sign" data-k="e" data-id="${d.id}" ${d.mou&&!d.sg.e?'':'disabled'}>${d.sg.e?'✓ ':''}TTD Event</button><button class="btn ghost" data-a="sign" data-k="s" data-id="${d.id}" ${d.mou&&!d.sg.s?'':'disabled'}>${d.sg.s?'✓ ':''}TTD Sponsor</button>${d.sg.e&&d.sg.s?`<button class="btn solid" data-a="pmou" data-id="${d.id}">Cetak MoU</button>`:''}</div></div></div>`;
 return`<a href="#/workspace" class="mut">← Semua kerja sama</a><div class="head" style="margin-top:10px"><div><h1 class="h1">${esc(p.n)}</h1><p class="mut" style="margin:0">${esc(p.c)} · ${esc(p.l)} · ${esc(p.t.join(', '))}</p></div><div class="stats">${both&&d.st=='active'?`<div class="stat"><small>Sisa waktu</small><b>${days} hari</b></div>`:''}<button class="btn" data-a="rep" data-id="${d.id}">Laporan evaluasi</button></div></div>
 <div class="card flow" style="margin-bottom:16px;justify-content:space-between;flex-wrap:wrap">${['Match & negosiasi','MoU e-signed','Deliverables','Audit & selesai'].map((s,i)=>`<span class="${i<st?'ok':i==st?'on':''}"><i>${i<st?'✓':i+1}</i>${s}</span>`).join('')}</div>
 <div class="wsp"><div><div class="tabs"><button data-a="tab" data-k="fl" class="${tab=='fl'?'on':''}">Deliverables</button><button data-a="tab" data-k="mou" class="${tab=='mou'?'on':''}">Dokumen &amp; MoU</button></div>${main}</div>
 <div><div class="card" style="margin-bottom:16px"><h3>Langkah berikutnya</h3><ol class="ms">${cl.map(([t,v],i)=>{const cur=!v&&i==cl.findIndex(x=>!x[1]),own=['Salah satu pihak','Pihak event','Pihak sponsor','Pihak sponsor','Pihak event','Kedua pihak'],mine=i==0||i==5||(i==1&&isEv())||(i==2&&!isEv())||(i==3&&!isEv())||(i==4&&isEv());return`<li class="${v?'d':cur?'c':''}"><i><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg></i><div><b>${t}</b>${cur?`<small>${own[i]}${mine?' · <u>giliran kamu</u>':''}</small>`:''}</div></li>`}).join('')}</ol></div><div class="card"><h3>Diskusi</h3><div class="chat" id="chat">${d.msgs.map(m=>`<div class="msg ${m.me?'me':''}">${esc(m.t)}</div>`).join('')||'<p class="mut" style="font-size:13px">Mulai obrolan dengan pihak lain.</p>'}</div><form data-f="msg" class="row" style="flex-wrap:nowrap"><input name="t" placeholder="Tulis pesan…" autocomplete="off"><button class="btn sm" style="margin:0">Kirim</button></form></div></div></div>`}
function reportHtml(d){const p=find(d.pid),v=d.fl.filter(f=>f.ok).reduce((a,f)=>a+(+f.v||0),0),ok=d.fl.filter(f=>f.ok).length,e=isEv();
 return`<h2 style="margin:0 0 4px">Laporan evaluasi &amp; LPJ akhir</h2><p class="mut" style="margin:0">${esc(e?S.user.profile.n:p.n)} × ${esc(e?p.n:S.user.profile.n)} · ${esc(p.t.join(', '))}</p>
 <div class="kpi"><div><small>Deliverables</small><b>${d.fl.length}</b></div><div><small>Terverifikasi</small><b>${ok}</b></div><div><small>Total valuasi</small><b>${Rp(v)}</b></div><div><small>MoU</small><b>${d.sg.e&&d.sg.s?'Lengkap':'Belum'}</b></div></div>
 <table class="tb"><tr><th>Item</th><th>Dari</th><th>Valuasi</th><th>Status</th></tr>${d.fl.map(f=>`<tr><td>${esc(f.n)}</td><td>${f.k=='sp'?'Sponsor':'Event'}</td><td>${Rp(f.v)}</td><td>${f.ok?'✓ Terverifikasi':'Menunggu'}</td></tr>`).join('')||'<tr><td colspan="4" class="mut">Belum ada deliverables.</td></tr>'}</table>
 <div class="row noprint" style="margin-top:20px"><button class="btn ghost" onclick="print()">Unduh / cetak PDF</button><button class="btn ghost" data-a="mail" data-id="${d.id}">Kirim ke email</button><div style="display:flex;gap:8px"><button class="btn ghost" onclick="$('#dlg').close()">Tutup</button><button class="btn" data-a="end" data-id="${d.id}" ${d.st=='done'||ok<d.fl.length||!d.fl.length?'disabled':''}>${d.st=='done'?'Sudah selesai':'Setujui &amp; akhiri kerja sama'}</button></div></div>${ok<d.fl.length&&d.st!='done'?'<p class="mut noprint" style="font-size:12px">Semua deliverables harus terverifikasi sebelum kerja sama diakhiri.</p>':''}`}

/* ---------- ROUTER ---------- */
function hd(r){
 const lg=!!S.user,e=lg&&isEv(),nb=S.deals.filter(d=>d.st=='pending'&&d.dir=='in').length,q=lg?left():0;
 document.body.classList.toggle('has-sb',lg);
 if(!lg){$('#hd').innerHTML='<a class="logo" href="index.html">KriDaya</a>';$('#sb').innerHTML='';return}
 const T=e?[['dashboard','Dashboard','dashboard'],['onboarding','Profil','user'],['direktori','Cari Sponsor','search'],['matching','Matching','layers'],['workspace','Workspace','brief'],['riwayat','Riwayat','clock']]:[['dashboard','Dashboard','dashboard'],['onboarding','Profil','user'],['direktori','Cari Event','search'],['proposal','Proposal','inbox'],['workspace','Kerja Sama','brief'],['riwayat','Riwayat','clock']];
 $('#hd').innerHTML=`<form data-f="gs"><input id="gs" placeholder="Cari ${e?'sponsor':'event'}…"><kbd>Ctrl K</kbd></form>`;
 $('#sb').innerHTML=`<a class="sb-lg" href="index.html">KriDaya</a><nav>${T.map(([k,l,i])=>`<a href="#/${k}" class="${r==k?'on':''}">${svg(i)}<span>${l}</span>${k=='proposal'&&nb?`<em>${nb}</em>`:''}</a>`).join('')}</nav>
 <div class="sb-b">${q===null?'<div class="sb-q"><small>Paket</small><b>Premium</b><a href="#" data-a="plan">Kembali ke Free</a></div>':`<div class="sb-q"><small>Kuota pitch bulan ini</small><b>${S.used}/${QUOTA}</b><span class="thin"><i style="width:${S.used*100/QUOTA}%"></i></span><a href="#" data-a="plan">Coba Premium</a></div>`}<div class="sb-u"><div><b>${esc(S.user.name)}</b><small>${e?'Pihak Event':'Pihak Sponsor'}</small></div><button data-a="out" title="Keluar" aria-label="Keluar">${svg('out')}</button></div></div>`}
function route(){
 const[r,id]=(location.hash.slice(2)||'masuk').split('/');
 if(r=='verifikasi'){hd(r);$('#app').innerHTML=V_ver(decodeURIComponent(id||''));vfx(decodeURIComponent(id||''));return}
 if(r=='masuk')reg=null;
 if(!S.user&&!['masuk','daftar'].includes(r))return go('/masuk');
 if(r=='daftar'&&!['event','sponsor'].includes(id))return go('/masuk');
 if(S.user&&r=='daftar'&&S.user.role==id)return go(S.user.profile?'/dashboard':'/onboarding');
 if(r=='proposal'&&S.user&&isEv())return go('/dashboard');
 if(S.user&&r=='masuk')return go(S.user.profile?'/dashboard':'/onboarding');
 if(S.user&&!S.user.profile&&!['onboarding','daftar'].includes(r))return go('/onboarding');
 if(S.user&&S.user.profile&&!S.ok&&!['onboarding','dashboard','daftar'].includes(r)){toast('Menunggu verifikasi admin');return go('/dashboard')}
 $('#app').innerHTML={masuk:V_auth,daftar:()=>V_reg(id),riwayat:V_riw,proposal:V_prop,dashboard:V_home,onboarding:()=>S.user&&(S.user.profile&&S.user.profile.status!='rejected'?V_prof():V_onb()),direktori:V_dir,matching:V_match,workspace:()=>V_work(id)}[r]?.()||'';
 hd(r);$$('.otp input').forEach((i,k,a)=>i.addEventListener('input',()=>i.value&&a[k+1]?.focus()));
 if(r=='onboarding')pct();if(r=='dashboard')dashFx();const c=$('#chat');if(c)c.scrollTop=1e9}
const go=h=>{location.hash=h;route()};addEventListener('hashchange',route);

const Dl=id=>S.deals.find(x=>x.id==id),mk=pid=>({id:'d'+pid+Date.now()+Math.random().toString(36).slice(2,5),pid,dir:'out',st:'pending',stage:0,msgs:[],sg:{},fl:[],at:Date.now()});
const A={
 mode:e=>{mode=e.dataset.m;route()},
 otp:()=>{if($$('.otp input').map(i=>i.value).join('')!='123456')return toast('Kode salah. Gunakan 123456.');
  if(!S.user||S.user.id!=pend.id)S.user={...pend,profile:null};step=0;save();go('/onboarding')},
 draft:()=>{S.user.draft=collect();save();toast('Draft tersimpan')},
 submit:()=>{if(pct()<100||!$('#cm').checked)return toast('Lengkapi semua field wajib, dokumen, dan centang pernyataan');S.user.profile=collect();save();toast('Terkirim untuk validasi');route()},
 approve:()=>{S.ok=true;if(!isEv()&&!S.deals.length)S.deals.push({...mk(101),dir:'in'});save();toast('Akun terverifikasi');go('/direktori')},
 sel:e=>{dir.sel=+e.dataset.id;$('#dres').innerHTML=dres()},
 pitch:e=>{const q=left();if(q!==null&&q<1)return toast('Kuota habis. Upgrade ke Premium.');S.deals.push(mk(+e.dataset.id));if(q!==null)S.used++;save();toast('Minat terkirim, menunggu jawaban ≤ 24 jam');hd('direktori');$('#dres').innerHTML=dres()},
 pick:e=>{const i=+e.dataset.id;pick.has(i)?pick.delete(i):pick.add(i);$('#mres').innerHTML=mres()},
 batch:()=>{const q=left();if(q!==null&&pick.size>q)return toast('Kuota tidak cukup untuk '+pick.size+' pitch');pick.forEach(i=>S.deals.push(mk(i)));if(q!==null)S.used+=pick.size;pick.clear();save();go('/workspace')},
 acc:e=>{const d=Dl(e.dataset.id);d.st='active';d.at=Date.now();save();go('/workspace/'+d.id)},
 rej:e=>{Dl(e.dataset.id).st='rejected';save();route()},
 tab:e=>{tab=e.dataset.k;route()},
 mou:e=>{Dl(e.dataset.id).mou=1;save();route()},
 sign:e=>{const d=Dl(e.dataset.id);d.sg[e.dataset.k]=!d.sg[e.dataset.k];save();route()},
 vf:e=>{Dl(e.dataset.id).fl.find(f=>f.id==e.dataset.f).ok=1;save();toast('Terverifikasi');route()},
 demo:e=>{const d=Dl(e.dataset.id),k=isEv()?'sp':'ev';d.fl.push({id:'f'+Date.now(),k,n:k=='sp'?'Logo vektor & adlibs':'Foto dokumentasi booth',n2:'Contoh unggahan pihak lain',v:k=='sp'?5e6:3e6});save();route()},
 rep:e=>{$('#dlg').className='big';$('#dlg').innerHTML=reportHtml(Dl(e.dataset.id));$('#dlg').showModal()},
 end:e=>{Dl(e.dataset.id).st='done';save();$('#dlg').close();toast('Kerja sama diakhiri');route()},
 plan:()=>{S.plan=S.plan=='free'?'premium':'free';save();toast(S.plan=='premium'?'Premium aktif (demo)':'Kembali ke Free');route()},
 out:()=>{localStorage.removeItem('kd2');S={user:null,deals:[],plan:'free',used:0,ok:false,pref:{}};step=0;go('/masuk')}};
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(t&&A[t.dataset.a]){if(t.tagName!='INPUT')e.preventDefault();A[t.dataset.a](t)}});
document.addEventListener('input',e=>{const t=e.target;
 if(t.dataset.i){dir[t.dataset.i]=t.value;$('#dres').innerHTML=dres()}
 if(t.dataset.p){S.pref[t.dataset.p]=t.value;save();$('#mres').innerHTML=mres()}
 if(t.closest('#onb'))pct()});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset.doc&&t.files[0]){docs[t.dataset.doc]=t.files[0].name;const l=t.closest('.drop');l.classList.add('ok');$('span',l).textContent='✓ '+t.files[0].name;pct()}});
document.addEventListener('submit',e=>{const f=e.target.dataset.f;if(!f)return;e.preventDefault();const v=Object.fromEntries(new FormData(e.target));
 if(f=='auth'){pend={id:v.id,name:v.name||S.user?.name,role:v.role||S.user?.role||'event'};step=1;route()}
 if(f=='gs'){dir.q=v.t||$('#gs').value;go('/direktori')}
 if(f=='msg'&&v.t.trim()){Dl(location.hash.split('/')[2]).msgs.push({t:v.t});save();route()}
 if(f=='file'&&v.n){const fn=e.target.fn?.files?.[0]?.name;Dl(location.hash.split('/')[2]).fl.push({id:'f'+Date.now(),k:e.target.dataset.k,n:v.n,n2:v.n2,v:+v.v||0,fn});save();route()}});
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key=='k'){e.preventDefault();$('#gs')?.focus()}});

/* ---------- DASHBOARD (event dan sponsor) ---------- */
const IC={link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',check:'<path d="M20 6 9 17l-5-5"/>',inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>'};
const svg=n=>`<svg viewBox="0 0 24 24">${IC[n]}</svg>`;
function dashFx(){$$('[data-cu]').forEach(el=>{const to=+el.dataset.cu,rp=el.dataset.rp,t0=performance.now(),tick=t=>{const p=Math.min(1,(t-t0)/900),v=to*(1-Math.pow(1-p,3));el.textContent=rp?Rp(v):Math.round(v);if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)})}
/* ---------- ALUR DAFTAR TERPISAH + PROPOSAL MASUK (sponsor) ---------- */
const COPY={event:{k:'Untuk panitia event',h:'Temukan sponsor untuk eventmu.',p:'Daftarkan event, lengkapi dokumen legalnya, lalu bandingkan sponsor yang cocok sekaligus.',s:['Buat akun dan verifikasi OTP','Isi data event dan unggah dokumen','Tunggu verifikasi admin (maks. 1×24 jam)','Cari sponsor dan kirim minat']},
 sponsor:{k:'Untuk UMKM dan brand',h:'Dukung event mahasiswa yang tepat.',p:'Daftarkan usahamu, terima proposal dari event yang sudah dikurasi, dan pantau hasil eksposurnya.',s:['Buat akun dan verifikasi OTP','Isi data usaha dan unggah NIB','Tunggu verifikasi admin (maks. 1×24 jam)','Terima proposal atau cari event']}};
function V_reg(role){
 const nm=role=='event'?'event':'sponsor';
 if(S.user)return`<section class="card narrow"><h2>Kamu masih masuk sebagai ${S.user.role=='event'?'Pihak Event':'Pihak Sponsor'}</h2><p class="mut">Akun <b>${esc(S.user.name)}</b> masih aktif di browser ini. Untuk mendaftar sebagai ${nm}, keluar dulu dari akun tersebut.</p><div class="row"><a class="btn ghost" href="#/dashboard">Kembali ke dashboard</a><button class="btn" data-a="swap" data-r="${role}">Keluar dan daftar sebagai ${nm}</button></div></section>`;
 if(reg!==role){reg=role;mode='daftar';step=0}
 const c=COPY[role];
 return`<div class="reg"><aside class="regl ${role}"><small>${c.k}</small><h1>${c.h}</h1><p>${c.p}</p><ol>${c.s.map(x=>`<li>${x}</li>`).join('')}</ol></aside>${V_auth()}</div>`}
function V_prop(){
 const inc=S.deals.filter(d=>d.st=='pending'&&d.dir=='in'),out=S.deals.filter(d=>d.st=='pending'&&d.dir=='out'),P=d=>find(d.pid)||{n:'Event',t:[],b:[0,0]};
 return`<div class="head"><div><h1 class="h1">Proposal masuk</h1><p class="mut" style="margin:0">Event yang meminta dukunganmu. Jawab dalam 1×24 jam.</p></div>${chips([inc.length+' menunggu'])}</div>`+
 (inc.length?`<div class="grid">${inc.map(d=>{const p=P(d);return`<div class="card"><div class="row"><div><h3 style="margin:0">${esc(p.n)}</h3><span class="mut">${esc(p.c||'')} · ${esc(p.l||'')}</span></div>${scc(score(p))}</div><p style="font-size:14px">${esc(p.d||'')}</p>${d.pitch?`<p class="pitch">“${esc(d.pitch)}”</p>`:''}<div class="kpi"><div><small>Dana dibutuhkan</small><b style="font-size:.95rem">${rng(p.b)}</b></div><div><small>Dukungan</small><b style="font-size:.95rem">${esc((p.t||[]).join(', ')||'-')}</b></div></div><div style="display:flex;gap:8px"><button class="btn" data-a="acc" data-id="${d.id}">Terima</button><button class="btn red" data-a="rej" data-id="${d.id}">Tolak</button></div></div>`}).join('')}</div>`
 :`<div class="card"><div class="empty">${svg('inbox')}<br>Belum ada proposal masuk.<br><a href="#/direktori" class="btn ghost sm" style="margin-top:12px">Cari event untuk didukung</a></div></div>`)+
 (out.length?`<h3 style="margin:28px 0 8px">Penawaran yang kamu kirim</h3><div class="grid">${out.map(d=>`<div class="card"><h3 style="margin:0">${esc(P(d).n)}</h3>${chips(['Menunggu jawaban'])}</div>`).join('')}</div>`:'')}


/* ---------- DASHBOARD v3 (layout terpisah event dan sponsor) + RIWAYAT ---------- */
Object.assign(IC,{x:'<path d="M18 6 6 18M6 6l12 12"/>',doc:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',up:'<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>',flag:'<path d="M4 22V4M4 4h12l-2 4 2 4H4"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'});
const ago=t=>{const s=(Date.now()-t)/1e3;return s<60?'baru saja':s<3600?Math.floor(s/60)+' menit lalu':s<86400?Math.floor(s/3600)+' jam lalu':s<604800?Math.floor(s/86400)+' hari lalu':new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})};
function feed(){const ev=[],add=(t,at,ic,c,txt,did)=>at&&ev.push({t,at,ic,c,txt,did});
 S.deals.forEach(d=>{const n=esc((find(d.pid)||{n:'Mitra'}).n);
  add('minat',d.ct,'bell','#e0a526',d.dir=='out'?`Kamu mengirim minat ke <b>${n}</b>`:`<b>${n}</b> mengirim minat kepadamu`,d.id);
  if(d.st=='active'||d.st=='done')add('minat',d.at,'link','#2f5733',`Kerja sama dengan <b>${n}</b> dimulai`,d.id);
  if(d.st=='rejected')add('minat',d.up,'x','#e2674a',`Minat dengan <b>${n}</b> ditolak`,d.id);
  if(d.st=='expired')add('minat',d.up,'clock','#6b7a8c',`Minat dengan <b>${n}</b> kedaluwarsa`,d.id);
  add('dokumen',d.mt,'doc','#1f8a85',`MoU dengan <b>${n}</b> dibuat`,d.id);
  add('dokumen',d.se,'pen','#1f8a85',`Event menandatangani MoU dengan <b>${n}</b>`,d.id);
  add('dokumen',d.ss,'pen','#1f8a85',`Sponsor menandatangani MoU dengan <b>${n}</b>`,d.id);
  d.fl.forEach(f=>{add('item',f.at,'up','#3a6fd8',`${f.k=='sp'?'Sponsor':'Event'} mengunggah <b>${esc(f.n)}</b> (${n})`,d.id);add('item',f.vt,'check','#2f7d4a',`<b>${esc(f.n)}</b> terverifikasi (${n})`,d.id)});
  add('selesai',d.en,'flag','#2f5733',`Kerja sama dengan <b>${n}</b> diakhiri`,d.id)});
 return ev.sort((a,b)=>b.at-a.at)}
const fi=x=>`<a class="fe" data-t="${x.t}" href="#/workspace/${x.did}"><i class="dot"></i><div><div>${x.txt}</div><small>${ago(x.at)}</small></div></a>`;
const bars=fe=>{const d0=new Date();d0.setHours(0,0,0,0);const ds=[...Array(14)].map((_,i)=>d0.getTime()-(13-i)*864e5),cn=ds.map(t=>fe.filter(x=>x.at>=t&&x.at<t+864e5).length),mx=Math.max(1,...cn);
 return`<div class="bars">${cn.map((c,i)=>`<i title="${c} aktivitas · ${new Date(ds[i]).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}" style="height:${8+c*92/mx}%"></i>`).join('')}</div><small class="mut">Aktivitas 14 hari terakhir</small>`};
function V_pend(){const m=S.user.profile||{},rj=m.status=='rejected';
 return`<div class="dsh"><header class="dhd"><div><small class="lb">${rj?'Perlu perbaikan':'Dalam pemeriksaan'}</small><h1>${esc(m.n)}</h1><p class="sub">${rj?'Alasan: '+esc(m.note||'tidak dicantumkan'):'Admin memeriksa dokumenmu, maksimal 1×24 jam.'}</p></div>${rj?'<a class="btn solid" href="#/onboarding">Perbaiki profil</a>':''}</header>
 <section class="pnl"><div class="ph"><h3>Proses verifikasi</h3></div><ol class="vs"><li class="d"><i></i><div><b>Profil dikirim</b><small>Dokumen sudah kami terima</small></div></li><li class="${rj?'x':'c'}"><i></i><div><b>Pemeriksaan admin</b><small>${rj?'Perlu perbaikan data':'Sedang berlangsung'}</small></div></li><li><i></i><div><b>Akun aktif</b><small>Direktori, matching, dan workspace terbuka</small></div></li></ol></section></div>`}
function dp(){
 const e=isEv(),m=S.user.profile||{},me=e?'ev':'sp',P=d=>find(d.pid)||{n:'Mitra',c:'',l:''},ds=S.deals,ac=ds.filter(d=>d.st=='active'),pn=ds.filter(d=>d.st=='pending'),inc=pn.filter(d=>d.dir=='in'),out=pn.filter(d=>d.dir=='out'),dn=ds.filter(d=>d.st=='done'),end=ds.filter(d=>['rejected','expired'].includes(d.st)),q=left(),
  vf=ds.flatMap(d=>d.fl).filter(f=>f.ok),val=vf.reduce((a,f)=>a+f.v,0),h=new Date().getHours(),sal=h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam',fe=feed(),
  stp=d=>[d.mou,d.sg.e,d.sg.s,d.fl.some(f=>f.k=='sp'),d.fl.some(f=>f.k=='ev'),d.fl.length>0&&d.fl.every(f=>f.ok)],STP=['Buat MoU','TTD Event','TTD Sponsor','Materi sponsor','Bukti event','Verifikasi'],
  nx=d=>{const s=stp(d);return s.every(Boolean)?'Siap diakhiri':STP[s.indexOf(false)]},prog=d=>stp(d).filter(Boolean).length*100/6|0;
 const td=(dot,t,s,a)=>`<div class="td"><i class="dot ${dot}"></i><div><b>${esc(t)}</b><small>${s}</small></div><div class="tda">${a}</div></div>`,todo=[];
 if(e)inc.forEach(d=>todo.push(td('amber',P(d).n,'Mengirim tawaran dukungan',`<button class="btn solid sm" data-a="acc" data-id="${d.id}">Terima</button><button class="btn ghost sm" data-a="rej" data-id="${d.id}">Tolak</button>`)));
 ac.forEach(d=>{const my=e?d.sg.e:d.sg.s,both=d.sg.e&&d.sg.s,mine=d.fl.filter(f=>f.k==me).length,ver=d.fl.filter(f=>!f.ok&&f.k!=me).length;
  const t=!d.mou?'Buat MoU':!my?'Tanda tangani MoU':both&&ver?`Verifikasi ${ver} item dari pihak lain`:both&&!mine?`Unggah ${e?'bukti pelaksanaan':'materi sponsor'}`:'';
  if(t)todo.push(td('',P(d).n,t,`<a class="lk" href="#/workspace/${d.id}">Buka</a>`))});
 const drow=d=>`<a class="dr" href="#/workspace/${d.id}"><div><b>${esc(P(d).n)}</b><small>${esc(P(d).c||'')} · ${esc(P(d).l||'')}</small></div><div class="dp"><span class="thin"><i style="width:${prog(d)}%"></i></span><small>${prog(d)}% · ${nx(d)}</small></div></a>`;
 const rec=pool().filter(p=>!busy().includes(p.id)).sort((a,b)=>score(b)-score(a)).slice(0,5).map(p=>{const sc=score(p);return`<div class="rt"><div><b>${esc(p.n)}</b><small>${esc(p.c)} · ${esc(p.l)}</small></div><span class="num">${rng(p.b)}</span><span class="mt"><b>${sc}%</b><span class="thin"><i style="width:${sc}%"></i></span></span><button class="btn ghost sm" data-a="pitch" data-id="${p.id}">Kirim minat</button></div>`}).join('')||'<p class="mut" style="margin:8px 0 0">Belum ada rekomendasi.</p>';
 const strip=a=>`<div class="ss">${a.map(([l,n,s,rp])=>`<div><small class="lb">${l}</small><b ${rp!=null?`data-cu="${rp}" data-rp="1"`:typeof n=='number'?`data-cu="${n}"`:''}>${n}</b><small>${s||''}</small></div>`).join('')}</div>`;
 const head=(sub,act)=>`<header class="dhd"><div><small class="lb">${sal}, ${esc((S.user.name||'').split(' ')[0])}</small><h1>${esc(m.n)}</h1><p class="sub">${sub}</p></div><div class="dact">${act}</div></header>`;
 const tl=`<section class="pnl"><div class="ph"><h3>Aktivitas</h3><a href="#/riwayat">Riwayat</a></div>${bars(fe)}<div class="fl">${fe.slice(0,5).map(fi).join('')||'<p class="mut" style="margin:8px 0 0">Belum ada aktivitas.</p>'}</div></section>`;
 const tdp=`<section class="pnl"><div class="ph"><h3>Perlu tindakanmu</h3><span class="ct">${todo.length}</span></div>${todo.join('')||'<p class="mut" style="margin:8px 0 0">Tidak ada yang menunggu.</p>'}</section>`;
 return{e,m,P,ds,ac,inc,out,dn,end,q,vf,val,head,strip,tdp,tl,rec,drow,nx,prog}}
Object.assign(IC,{dashboard:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',layers:'<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',brief:'<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',out:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>'});
const logoUrl=l=>l?API.replace(/\/api$/,'')+'/storage/'+l:'';
function pbox(full){const m=S.user.profile||{},e=isEv(),ok=S.ok,lg=logoUrl(m.logo),
 rows=e?[['Kategori',m.c],['Lokasi',m.l],['Badan penaung',m.b],['Dana dibutuhkan',Rp(+m.bmax||0)],['WhatsApp',m.w]]:[['Kategori',m.c],['Lokasi',m.l],['Berdiri',m.y],['Rentang dana',rng([+m.bmin||0,+m.bmax||0])],['WhatsApp',m.w]];
 return`<aside class="pb"><div class="pb-lg">${lg?`<img src="${esc(lg)}" alt="Logo">`:'<span class="pb-ph"></span>'}</div><h3>${esc(m.n)}</h3><span class="pb-st ${ok?'ok':''}">${ok?'Terverifikasi':m.status=='rejected'?'Ditolak':'Menunggu verifikasi'}</span><dl>${rows.filter(r=>r[1]).map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${full?`<label class="pb-up" for="lg">${lg?'Ganti logo':'Unggah logo'}</label><input id="lg" type="file" accept="image/png,image/jpeg,image/webp" hidden>`:'<a class="pb-lk" href="#/onboarding">Lihat profil</a>'}</aside>`}
function V_prof(){const m=S.user.profile,e=isEv(),DL={izin:e?'Surat izin kegiatan':'Surat izin usaha',panitia:'Susunan kepanitiaan',rab:'RAB',proposal:'Proposal sponsorship',dok:'Dokumentasi kegiatan',nib:'Dokumen NIB'},
 kv=[['Email',m.m],['WhatsApp',m.w],['Media sosial',m.s]].filter(r=>r[1]);
 return`<div class="dsh"><header class="dhd"><div><h1 class="pt">Profil</h1><p class="sub">Data ${e?'event':'usaha'} dan dokumen legal yang sudah kamu kirim.</p></div></header>
 <div class="g2">${pbox(true)}<div class="stk2"><section class="pnl"><div class="ph"><h3>Deskripsi</h3></div><p style="margin:6px 0 10px">${esc(m.d)}</p>${chips(m.t||[])}</section>
 <section class="tbw"><div class="tsc"><table class="tb2"><thead><tr><th>Dokumen</th><th>Berkas</th><th></th></tr></thead><tbody>${(m.dl||[]).map(d=>`<tr><td>${DL[d.type]||esc(d.type)}</td><td>${esc(d.name)}</td><td class="ta"><a class="lk" href="#" data-a="dldoc" data-id="${d.id}" data-n="${esc(d.name)}">Unduh</a></td></tr>`).join('')||'<tr><td colspan="3" class="mut" style="padding:24px 16px">Belum ada dokumen.</td></tr>'}</tbody></table></div></section>
 ${kv.length?`<section class="pnl"><div class="ph"><h3>Kontak</h3></div><dl class="kv">${kv.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>`:''}</div></div></div>`}
function V_homeN(x){const{ds,ac,inc,out,dn,end,q,val,vf,strip,tdp,tl,rec,nx,prog,P}=x,e=isEv(),h=new Date().getHours(),sal=h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam',first=esc((S.user.name||'').split(' ')[0]),
 lab=d=>d.st=='pending'?(d.dir=='in'?'Tawaran masuk':'Menunggu jawaban'):{active:'Berjalan',done:'Selesai',rejected:'Ditolak',expired:'Kedaluwarsa'}[d.st],
 rows=[...inc,...ac,...out,...dn,...end].map(d=>{const p=P(d),live=['active','done'].includes(d.st);
  return`<tr><td><b>${esc(p.n)}</b><small>${esc(p.c||'')} · ${esc(p.l||'')}</small></td><td><span class="stl ${d.st=='active'?'on':d.st=='pending'&&d.dir=='in'?'am':''}">${lab(d)}</span></td><td>${d.st=='active'?nx(d):d.st=='pending'?'Maks. 24 jam':d.st=='done'?'Selesai':'–'}</td><td class="pg">${live?`<span class="thin"><i style="width:${d.st=='done'?100:prog(d)}%"></i></span>`:''}</td><td class="ta">${d.st=='pending'&&d.dir=='in'?`<button class="ab g" data-a="acc" data-id="${d.id}" title="Terima">${svg('check')}</button><button class="ab r" data-a="rej" data-id="${d.id}" title="Tolak">${svg('x')}</button>`:live?`<a class="ab g" href="#/workspace/${d.id}" title="Buka">${svg('arrow')}</a>`:''}</td></tr>`}).join('');
 return`<div class="dsh"><header class="dhd"><div><h1 class="pt">Dashboard</h1><p class="sub">${sal}, ${first}. ${e?`${out.length} pitch menunggu jawaban, ${ac.length} kerja sama berjalan.`:`${inc.length} proposal menunggu keputusanmu, ${ac.length} event berjalan.`}</p></div><div class="dact">${e?'<a class="btn solid" href="#/matching">Mulai matching</a><a class="lk" href="#/direktori">Cari sponsor</a>':'<a class="btn solid" href="#/proposal">Lihat proposal</a><a class="lk" href="#/direktori">Cari event</a>'}</div></header>
 ${strip(e?[['Menunggu jawaban',out.length,q===null?'Kuota pitch tanpa batas':`Sisa kuota pitch ${q}`],['Tawaran masuk',inc.length,'dari sponsor'],['Kerja sama berjalan',ac.length,`${dn.length} selesai`],['Nilai terverifikasi',Rp(val),'dari deliverables',val]]:[['Proposal baru',inc.length,'menunggu keputusanmu'],['Event didukung',ac.length,`${dn.length} selesai`],['Item terverifikasi',vf.length,'dari semua kerja sama'],['Nilai dukungan',Rp(val),'terverifikasi',val]])}
 <div class="g2">${pbox(false)}<section class="tbw"><div class="tbh"><h3>${e?'Sponsor saya':'Event saya'}</h3><span class="ct">${ds.length} kerja sama</span></div><div class="tsc"><table class="tb2"><thead><tr><th>${e?'Sponsor':'Event'}</th><th>Status</th><th>Tahap</th><th>Progres</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="5" class="mut" style="padding:28px 16px">Belum ada kerja sama. ${e?'Mulai dari <a class="lk" href="#/matching">matching</a>.':'Event akan muncul di sini saat mengajukan proposal.'}</td></tr>`}</tbody></table></div></section></div>
 <div class="dg2"><div class="stk2">${tdp}${tl}</div><section class="pnl"><div class="ph"><h3>${e?'Sponsor yang cocok':'Event yang cocok'}</h3><a href="#/direktori">Lihat semua</a></div>${rec}</section></div></div>`}
function V_home(){if(!S.ok)return V_pend();const x=dp();return V_homeN(x)}
function V_riw(){
 const fe=feed(),P=d=>find(d.pid)||{n:'Mitra'},L={active:'Aktif',done:'Selesai',pending:'Menunggu',rejected:'Ditolak',expired:'Kedaluwarsa'},F=[['all','Semua'],['minat','Minat'],['dokumen','Dokumen'],['item','Deliverables'],['selesai','Selesai']],tg=d=>d.fl.filter(f=>f.ok).reduce((a,f)=>a+f.v,0);
 return`<div class="head"><div><h1 class="h1">Riwayat</h1><p class="mut" style="margin:0">Semua aktivitas dan arsip kerja samamu.</p></div><button class="btn ghost" data-a="csv">Unduh CSV</button></div>
 <div class="card segw"><div class="sg2" style="margin-bottom:16px"><button class="on" data-a="seg" data-v="a">Aktivitas <i>${fe.length}</i></button><button data-a="seg" data-v="b">Arsip kerja sama <i>${S.deals.length}</i></button></div>
 <div data-p="a"><div class="chp">${F.map(([v,l],i)=>`<button class="${i?'':'on'}" data-a="flt" data-v="${v}">${l}</button>`).join('')}</div><div class="fl" id="fl">${fe.map(fi).join('')||'<p class="mut">Belum ada aktivitas.</p>'}</div></div>
 <div data-p="b" hidden><input data-riw placeholder="Cari mitra…" style="margin-bottom:12px"><div style="overflow-x:auto"><table class="tb"><tr><th>Mitra</th><th>Status</th><th>Dimulai</th><th>Item</th><th>Nilai</th><th></th></tr>${S.deals.slice().sort((a,b)=>b.ct-a.ct).map(d=>`<tr class="rw" data-q="${esc(P(d).n.toLowerCase())}"><td><b>${esc(P(d).n)}</b></td><td>${chips([L[d.st]])}</td><td>${new Date(d.ct).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td><td>${d.fl.filter(f=>f.ok).length}/${d.fl.length}</td><td>${Rp(tg(d))}</td><td>${['active','done'].includes(d.st)?`<a href="#/workspace/${d.id}">Buka</a>`:''}</td></tr>`).join('')||'<tr><td colspan="6" class="mut">Belum ada kerja sama.</td></tr>'}</table></div></div></div>`}
Object.assign(A,{
 seg:e=>{const w=e.closest('.segw');$$('[data-a=seg]',w).forEach(b=>b.classList.toggle('on',b==e));$$('[data-p]',w).forEach(p=>p.hidden=p.dataset.p!=e.dataset.v)},
 flt:e=>{$$('.chp button').forEach(b=>b.classList.toggle('on',b==e));$$('#fl .fe').forEach(i=>i.hidden=e.dataset.v!='all'&&i.dataset.t!=e.dataset.v)},
 csv:()=>{const c=v=>'"'+String(v??'').replace(/^([=+\-@])/,"'$1").replace(/"/g,'""')+'"',rows=[['Mitra','Status','Dimulai','Item','Nilai terverifikasi']].concat(S.deals.map(d=>[(find(d.pid)||{}).n,d.st,new Date(d.ct).toISOString().slice(0,10),d.fl.length,d.fl.filter(f=>f.ok).reduce((a,f)=>a+f.v,0)])),b=new Blob([rows.map(r=>r.map(c).join(',')).join('\n')],{type:'text/csv'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='riwayat-kridaya.csv';a.click()}});
document.addEventListener('input',e=>{if(e.target.dataset.riw!=null){const q=e.target.value.toLowerCase();$$('.rw').forEach(r=>r.hidden=!r.dataset.q.includes(q))}});

Object.assign(A,{
 mrun:()=>{const n=S.plan=='premium'?20:5,cur=JSON.stringify(S.pref);if(mt.sig&&mt.sig!==cur)mt.cand=mt.cand.filter(p=>pick.has(p.id));
  mt.ran=true;mt.load=true;mt.sig=cur;if($('#mbtn'))$('#mbtn').textContent='Matching lagi';$('#mres').innerHTML=mres();
  setTimeout(()=>{const fresh=pool().filter(p=>hit(p)&&score(p)>=MIN&&!busy().includes(p.id)&&!mt.seen.has(p.id)&&!mt.cand.some(x=>x.id==p.id)).sort((a,b)=>score(b)-score(a)).slice(0,n);
   fresh.forEach(p=>mt.seen.add(p.id));mt.cand=mt.cand.concat(fresh);mt.load=false;if($('#mres'))$('#mres').innerHTML=mres(true)},700)},
 mmv:e=>mv(+e.dataset.id,e.dataset.z),
 mrst:()=>{mt={cand:[],seen:new Set(),ran:false,load:false,sig:'',uid:S.user.id};pick.clear();nope.clear();$('#mres').innerHTML=mres();if($('#mbtn'))$('#mbtn').textContent='Mulai matching'}});
Object.assign(A,{ppsel:e=>{$$('.ib').forEach(b=>b.classList.toggle('on',b==e));$$('[data-pn]').forEach(p=>p.hidden=p.dataset.pn!=e.dataset.id)}});
/* ---------- BARCODE TTD (Code 39), VERIFIKASI, PESAN PEMBUKA, EFEK ---------- */
const C39={'0':'nnnwwnwnn','1':'wnnwnnnnw','2':'nnwwnnnnw','3':'wnwwnnnnn','4':'nnnwwnnnw','5':'wnnwwnnnn','6':'nnwwwnnnn','7':'nnnwnnwnw','8':'wnnwnnwnn','9':'nnwwnnwnn',A:'wnnnnwnnw',B:'nnwnnwnnw',C:'wnwnnwnnn',D:'nnnnwwnnw',E:'wnnnwwnnn',F:'nnwnwwnnn',G:'nnnnnwwnw',H:'wnnnnwwnn',I:'nnwnnwwnn',J:'nnnnwwwnn',K:'wnnnnnnww',L:'nnwnnnnww',M:'wnwnnnnwn',N:'nnnnwnnww',O:'wnnnwnnwn',P:'nnwnwnnwn',Q:'nnnnnnwww',R:'wnnnnnwwn',S:'nnwnnnwwn',T:'nnnnwnwwn',U:'wwnnnnnnw',V:'nwwnnnnnw',W:'wwwnnnnnn',X:'nwnnwnnnw',Y:'wwnnwnnnn',Z:'nwwnwnnnn','-':'nwnnnnwnw','.':'wwnnnnwnn',' ':'nwwnnnwnn','*':'nwnnwnwnn'};
const bc=(text,h=54)=>{let x=10,r='';for(const ch of '*'+String(text).toUpperCase()+'*'){const p=C39[ch];if(!p)continue;for(let i=0;i<9;i++){const w=p[i]=='w'?5:2;if(i%2==0)r+=`<rect x="${x}" y="0" width="${w}" height="${h}"/>`;x+=w}x+=2}return`<svg class="bc" viewBox="0 0 ${x+8} ${h}" role="img" aria-label="Barcode ${esc(text)}" fill="#0d2b1a">${r}</svg>`};
const sigBox=(d,side)=>{const e=side=='e',ok=e?d.sg.e:d.sg.s,c=e?d.ce:d.cs;
 return`<div class="sg ${ok?'ok':''}"><small class="lb">${e?'Pihak Event':'Pihak Sponsor'}</small>${ok&&c?`${bc('KD-'+c)}<b>KD-${esc(c)}</b><small>Ditandatangani secara elektronik</small><a class="lk" href="#/verifikasi/KD-${esc(c)}">Verifikasi keaslian</a>`:'<div class="sg-w">Belum ditandatangani</div>'}</div>`};
const RS={Dana:'Dana sesuai',Dukungan:'Dukungan cocok',Industri:'Industri relevan',Lokasi:'Satu kota'};
const fp=p=>{const f=fit(p),top=[...f.parts].sort((a,b)=>b[1]-a[1]).filter(x=>x[1]>=70).slice(0,2).map(x=>RS[x[0]]);return`<div class="fp">${f.parts.map(([l,v])=>`<div><span>${l}</span><i><b style="width:${v}%"></b></i><em>${v}</em></div>`).join('')}</div>${top.length?`<p class="why">Cocok karena: ${top.join(' · ')}</p>`:''}`};
const defPitch=()=>{const m=S.user.profile||{},t=(m.t||[]).join('/')||'dukungan';return isEv()?`Halo, kami panitia ${m.n} (${m.c}, ${m.l}). Kami mencari dukungan sekitar ${Rp(+m.bmax||0)} dan profil usahamu relevan dengan target peserta kami. Boleh kami kirim proposal dan RAB?`:`Halo, kami ${m.n} (${m.c}, ${m.l}) tertarik mendukung eventmu dengan ${t}. Boleh kita diskusikan kerja samanya?`};
function V_ver(code){return`<section class="card narrow" style="max-width:520px"><h2>Verifikasi tanda tangan</h2><p class="mut">Masukkan kode di bawah barcode pada MoU.</p><form data-f="ver" class="row" style="flex-wrap:nowrap;gap:8px"><input name="c" placeholder="KD-XXXXXXXXXX" value="${esc(code||'')}" autocomplete="off"><button class="btn" style="margin:0">Cek</button></form><div id="vr" style="margin-top:18px"></div></section>`}
async function vfx(code){const o=$('#vr');if(!code||!o)return;o.innerHTML='<p class="mut">Memeriksa…</p>';
 try{const r=await fetch(API+'/verify/'+encodeURIComponent(code),{headers:{Accept:'application/json'}}),j=await r.json();
  o.innerHTML=r.ok?`<div class="vok"><b>Tanda tangan valid</b><dl class="kv"><div><dt>Penandatangan</dt><dd>${esc(j.signer)} (${j.side=='event'?'Pihak Event':'Pihak Sponsor'})</dd></div><div><dt>Kerja sama</dt><dd>${esc(j.event)} × ${esc(j.sponsor)}</dd></div><div><dt>Waktu</dt><dd>${new Date(j.signed_at).toLocaleString('id-ID')}</dd></div><div><dt>Status MoU</dt><dd>${j.both_signed?'Ditandatangani kedua pihak':'Menunggu pihak lain'}</dd></div></dl></div>`:'<div class="vno"><b>Kode tidak ditemukan</b><p class="mut" style="margin:4px 0 0">Periksa kembali kodenya.</p></div>'}catch{o.innerHTML='<p class="mut">Gagal menghubungi server.</p>'}}
function burst(el){const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;for(let i=0;i<16;i++){const p=document.createElement('i'),a=Math.random()*6.28,d=40+Math.random()*70;p.className='cf';p.style.cssText=`left:${x}px;top:${y}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-30}px;background:${['#c6f135','#0d2b1a','#ff6a3d','#fff'][i%4]}`;document.body.appendChild(p);setTimeout(()=>p.remove(),900)}}
Object.assign(A,{pmou:e=>{const d=Dl(e.dataset.id),p=find(d.pid)||{n:'Mitra'},w=open('','_blank');if(!w)return toast('Izinkan pop-up untuk mencetak MoU');
 w.document.write(`<!doctype html><meta charset="utf-8"><title>MoU ${esc(p.n)}</title><style>body{font:14px/1.6 system-ui;margin:48px;color:#111}pre{white-space:pre-wrap;font:inherit}.sg{display:flex;gap:40px;margin-top:40px}.sg>div{flex:1;border-top:1px solid #111;padding-top:10px}svg{width:100%;max-width:260px;height:auto}small{display:block;color:#555}</style><pre>${esc(mouText(d,p))}</pre><div class="sg"><div><small>Pihak Event</small>${bc('KD-'+d.ce)}<b>KD-${esc(d.ce)}</b></div><div><small>Pihak Sponsor</small>${bc('KD-'+d.cs)}<b>KD-${esc(d.cs)}</b></div></div><p><small>Periksa keaslian tanda tangan di halaman Verifikasi KriDaya dengan memasukkan kode di bawah barcode.</small></p><script>onload=()=>print()<\/script>`);w.document.close()}});
document.addEventListener('click',e=>{const t=e.target.closest('[data-a]');if(!t||matchMedia('(prefers-reduced-motion:reduce)').matches)return;if(['acc','sign','end','vf'].includes(t.dataset.a)||(t.dataset.a=='mmv'&&t.dataset.z=='y'))burst(t)},true);
document.addEventListener('input',e=>{if(e.target.id=='mpt')mt.pitch=e.target.value});
document.addEventListener('submit',e=>{if(e.target.dataset.f=='ver'){e.preventDefault();location.hash='/verifikasi/'+encodeURIComponent((new FormData(e.target).get('c')||'').trim())}});

route();