const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S=JSON.parse(localStorage.getItem('kd2')||'null')||{user:null,deals:[],plan:'free',used:0,ok:false,pref:{}};
const save=()=>localStorage.setItem('kd2',JSON.stringify(S));
const QUOTA=5,LOC=[
    'Aceh',
    'Sumatera Utara',
    'Sumatera Barat',
    'Riau',
    'Kepulauan Riau',
    'Jambi',
    'Sumatera Selatan',
    'Kepulauan Bangka Belitung',
    'Bengkulu',
    'Lampung',
    'DKI Jakarta',
    'Jawa Barat',
    'Jawa Tengah',
    'DI Yogyakarta',
    'Jawa Timur',
    'Banten',
    'Bali',
    'Nusa Tenggara Barat',
    'Nusa Tenggara Timur',
    'Kalimantan Barat',
    'Kalimantan Tengah',
    'Kalimantan Selatan',
    'Kalimantan Timur',
    'Kalimantan Utara',
    'Sulawesi Utara',
    'Gorontalo',
    'Sulawesi Tengah',
    'Sulawesi Barat',
    'Sulawesi Selatan',
    'Sulawesi Tenggara',
    'Maluku',
    'Maluku Utara',
    'Papua',
    'Papua Barat',
    'Papua Selatan',
    'Papua Tengah',
    'Papua Pegunungan',
    'Papua Barat Daya'
],TYPES=['Cash','Produk','Jasa','Voucher'];
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
const score=p=>{const m=S.user?.profile||{},f=S.pref;let s=52+(p.id*7%9);
 if(p.l==(f.l||m.l))s+=18;if(f.c&&p.c==f.c)s+=15;if(f.t&&p.t.includes(f.t))s+=10;
 if(f.b){const[a,z]=BR[f.b];if(p.b[0]<=z&&p.b[1]>=a)s+=8}return Math.min(99,s)};
const scc=s=>`<span class="sc ${s>=90?'':s>=80?'m':'l'}">${s}% match</span>`;
const hit=p=>{const f=S.pref;return(!f.c||p.c==f.c)&&(!f.l||p.l==f.l)&&(!f.t||p.t.includes(f.t))&&(!f.b||(p.b[0]<=BR[f.b][1]&&p.b[1]>=BR[f.b][0]))};
const pcard=(p,cls='',extra='')=>`<div class="card pc ${cls}" data-a="${extra?'pick':'sel'}" data-id="${p.id}">${extra}<div class="top"><div><h3>${esc(p.n)}</h3><span class="mut">${esc(p.c)} · ${esc(p.l)}</span></div>${scc(score(p))}</div><div>${chips(p.t)}</div><div class="mut" style="font-size:13px"><b style="color:var(--ink)">${rng(p.b)}</b> · respon &lt; ${p.sla} jam</div></div>`;

let mode='daftar',step=0,pend=null,tab='fl',dir={q:'',c:'',l:'',t:'',sel:null},pick=new Set(),docs={};

/* ---------- AUTH ---------- */
function V_auth(){
 if(step)return`<section class="card narrow"><h2>Verifikasi OTP</h2><p class="mut">Kode dikirim ke ${esc(pend.id)}. Untuk demo, pakai 123456.</p><div class="otp">${'<input maxlength="1" inputmode="numeric" aria-label="digit OTP">'.repeat(6)}</div><button class="btn" data-a="otp">Verifikasi</button></section>`;
 return`<section class="card narrow"><div class="tabs"><button data-a="mode" data-m="masuk" class="${mode=='masuk'?'on':''}">Masuk</button><button data-a="mode" data-m="daftar" class="${mode=='daftar'?'on':''}">Daftar</button></div>
 <form data-f="auth">${mode=='daftar'?`<label>Daftar sebagai</label><div class="roles"><label><input type="radio" name="role" value="event" checked>Pihak Event<small>Mencari sponsor</small></label><label><input type="radio" name="role" value="sponsor">Pihak Sponsor<small>Mencari event</small></label></div><label>Nama lengkap / PIC</label><input name="name" required>`:''}
 <label>No. HP / Email</label><input name="id" required><button class="btn" style="width:100%">Kirim kode OTP</button></form></section>`}

/* ---------- ONBOARDING ---------- */
function V_onb(){const e=isEv(),p=S.user.profile||S.user.draft||{};docs={...docs,...(p.docs||{})};
 const st=S.ok?3:S.user.profile?2:1,fl=(a,b)=>`<span class="${st>a?'ok':st==a?'on':''}"><i>${st>a?'✓':a}</i>${b}</span>`;
 const f=(k,l,ph='',t='text',req=1)=>`<label>${l}</label><input name="${k}" type="${t}" placeholder="${ph}" value="${esc(p[k])}" ${req?'data-r':''}>`;
 const dz=(k,l,req=1)=>`<label class="drop ${docs[k]?'ok':''}"><input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" hidden data-doc="${k}" ${req?'data-dr':''}><b>${l}</b><span>${docs[k]?'✓ '+esc(docs[k]):'Klik untuk unggah'}</span></label>`;
 const radios=(n,a,type='radio')=>`<div class="opts">${a.map(x=>`<label class="opt"><input type="${type}" name="${n}" value="${x}" ${type=='radio'?(p[n]||a[0])==x:(p[n]||[]).includes(x)?'checked':''}>${x}</label>`).join('')}</div>`;
 return`<div class="card banner"><div><h3>${S.ok?'Akun terverifikasi':S.user.profile?'Dokumen sedang diverifikasi':'Lengkapi identitas & dokumen legal'}</h3><span class="mut">${S.ok?'Kamu bisa menjelajah direktori dan matching.':S.user.profile?'Admin memeriksa maksimal 1x24 jam.':'Admin akan memeriksa dokumen sebelum akunmu aktif (maks. 1x24 jam).'}</span></div>
 <div class="flow">${fl(1,'Isi profil')}<hr>${fl(2,'Validasi admin')}<hr>${fl(3,'Aktif')}</div></div>
 <form id="onb" ${S.user.profile?'class="locked"':''}><div class="col3">
 <div class="card"><h3><span>01</span>${e?'Identitas proker':'Identitas usaha'}</h3>${f('n',e?'Nama event / proker':'Nama usaha')}
 <label>Kategori</label>${e?radios('c',['Webinar','Lomba','Seminar','Lainnya']):`<select name="c">${opt(['F&B','Fashion','Teknologi','Jasa','Kecantikan','Lainnya'],'',p.c)}</select>`}
 <label>Lokasi</label><select name="l">${opt(LOC,'',p.l)}</select>
 <label>Deskripsi ${e?'(target peserta, jumlah target, dll)':''}</label><textarea name="d" rows="4" data-r>${esc(p.d)}</textarea>
 ${e?f('b','Badan yang menaungi','mis. BEM Fakultas Ilmu Komputer'):`<div class="two"><div>${f('y','Tahun berdiri','2020','number')}</div><div>${f('nib','Nomor NIB')}</div></div><label>Bentuk dukungan</label>${radios('t',TYPES,'checkbox')}<div class="two"><div>${f('bmin','Dana min (Rp)','','number',0)}</div><div>${f('bmax','Dana maks (Rp)','','number',0)}</div></div>`}</div>
 <div class="card"><h3><span>02</span>Kanal komunikasi PIC</h3>${f('m','Email aktif','nama@domain.id','email')}${f('w','No. WhatsApp','+62 812…')}${f('s','Media sosial','@akun',  'text',0)}</div>
 <div class="card"><h3><span>03</span>Dokumen legal</h3>${e?dz('izin','Surat izin kegiatan')+dz('panitia','Susunan kepanitiaan')+dz('rab','RAB')+dz('proposal','Proposal sponsorship')+dz('dok','Dokumentasi (opsional)',0):dz('nib','Dokumen NIB')+dz('izin','Surat izin usaha',0)}<div class="mut" style="font-size:12px;margin-top:12px">PDF/JPG/PNG, maks. 5 MB per file.</div></div></div>
 <label class="opt" style="display:flex;gap:10px;border-radius:12px;padding:12px 16px"><input type="checkbox" id="cm" style="display:block;width:auto" ${S.user.profile?'checked':''}>Saya menyatakan seluruh data dan dokumen di atas benar dan dapat dipertanggungjawabkan.</label>
 <div class="bottom"><div style="flex:1;min-width:180px"><small class="mut">Kelengkapan <b id="pt">0%</b></small><div class="prog"><i id="pb" style="width:0"></i></div></div><div style="display:flex;gap:8px"><button type="button" class="btn ghost" data-a="draft">Simpan draft</button><button type="button" class="btn" data-a="submit" ${S.user.profile?'disabled':''}>Kirim untuk validasi (1x24 jam)</button></div></div></form>`}
const pct=()=>{const r=$$('#onb [data-r]'),d=$$('#onb [data-dr]');const n=r.filter(i=>i.value.trim()).length+d.filter(i=>docs[i.dataset.doc]).length,t=r.length+d.length,v=Math.round(n/t*100);if($('#pb')){$('#pb').style.width=v+'%';$('#pt').textContent=v+'%'}return v};
const collect=()=>{const f=new FormData($('#onb')),o={};f.forEach((v,k)=>{if(k!='t')o[k]=v});o.t=f.getAll('t');o.docs={...docs};o.b=[+o.bmin||0,+o.bmax||0];return o};

/* ---------- DIREKTORI ---------- */
function dres(){const l=pool().filter(p=>(!dir.q||(p.n+p.d+p.c).toLowerCase().includes(dir.q.toLowerCase()))&&(!dir.c||p.c==dir.c)&&(!dir.l||p.l==dir.l)&&(!dir.t||p.t.includes(dir.t))).sort((a,b)=>score(b)-score(a));
 const s=find(dir.sel)&&l.find(x=>x.id==dir.sel)||l[0];
 return`<div class="list">${l.map(p=>pcard(p,s?.id==p.id?'sel':'')).join('')||'<p class="mut">Tidak ada hasil. Coba longgarkan filter.</p>'}</div><div class="card stk">${s?detail(s):'<p class="mut">Pilih item untuk melihat detail.</p>'}</div>`}
function detail(p){const m=S.user.profile||{},sent=busy().includes(p.id),ev=isEv();
 return`<div class="top row"><div><h2 style="margin:0">${esc(p.n)}</h2><span class="mut">${esc(p.c)} · ${esc(p.l)}${p.y?' · sejak '+p.y:''}</span></div>${scc(score(p))}</div><p>${esc(p.d)}</p><div>${chips(p.t)}</div>
 <div class="kpi"><div><small>${ev?'Dana per sponsor':'Kebutuhan dana'}</small><b style="font-size:.95rem">${rng(p.b)}</b></div><div><small>SLA respon</small><b>&lt; ${p.sla} jam</b></div></div>
 <h3>Kecocokan dengan profilmu</h3><ul class="chk"><li class="${p.l==m.l?'':'no'}">Lokasi ${p.l==m.l?'sama':'berbeda'} (${esc(p.l)})</li><li class="${S.pref.c?p.c==S.pref.c?'':'no':''}">Kategori ${esc(p.c)}</li><li class="${p.t.some(t=>(m.t||[]).includes(t))||!ev?'':'no'}">Bentuk dukungan: ${p.t.join(', ')}</li></ul>
 <button class="btn" style="width:100%" data-a="pitch" data-id="${p.id}" ${sent?'disabled':''}>${sent?'Minat sudah dikirim':'Kirim minat'+(left()===null?'':' (1 kuota)')}</button>`}
function V_dir(){return`<div class="head"><div><h1 class="h1">Direktori ${isEv()?'sponsor':'event'}</h1><p class="mut" style="margin:0">Telusuri pihak terverifikasi, lihat kecocokannya, lalu kirim minat.</p></div><div class="stats"><div class="stat"><small>Terverifikasi</small><b>${pool().length}</b></div><div class="stat"><small>Kerja sama aktif</small><b>${S.deals.filter(d=>d.st=='active').length}</b></div></div></div>
 <div class="filters"><input data-i="q" placeholder="Cari nama, kategori, kata kunci…" value="${esc(dir.q)}" id="dq"><select data-i="c">${opt(cats(),'Semua kategori',dir.c)}</select><select data-i="l">${opt(LOC,'Semua lokasi',dir.l)}</select><select data-i="t">${opt(TYPES,'Semua bentuk dukungan',dir.t)}</select></div><div class="split" id="dres">${dres()}</div>`}

/* ---------- MATCHING ---------- */
const cand=()=>pool().filter(p=>hit(p)&&!busy().includes(p.id)).sort((a,b)=>score(b)-score(a)).slice(0,S.plan=='premium'?20:5);
function mres(){const c=cand();pick=new Set([...pick].filter(i=>c.some(p=>p.id==i)));const ps=[...pick].map(find),tot=ps.reduce((a,p)=>a+p.b[1],0),n=ps.length,q=left();
 return`<div class="card banner" style="margin-bottom:16px"><div><h3>Top ${c.length} rekomendasi</h3><span class="mut">${S.plan=='premium'?'Premium: hingga 20 kandidat tanpa batas kuota.':'Free: 5 kandidat. Upgrade untuk 20 kandidat dan kuota tanpa batas.'}</span></div><span class="sc m">${q===null?'Kuota tak terbatas':'Sisa '+q+' dari '+QUOTA+' kuota'}</span></div>
 <div class="mx">${c.map(p=>pcard(p,pick.has(p.id)?'sel':'',`<input type="checkbox" ${pick.has(p.id)?'checked':''} tabindex="-1" aria-label="pilih">`)).join('')||'<p class="mut">Tidak ada kandidat untuk kombinasi filter ini.</p>'}</div>
 <div class="bottom"><div><b>${n} ${isEv()?'sponsor':'event'} dipilih</b><div class="mut" style="font-size:13px">Total potensi ${Rp(tot)} · pihak lain punya 1x24 jam untuk menjawab</div></div><button class="btn" data-a="batch" ${n?'':'disabled'}>Kirim batch pitching${q===null?'':' ('+n+' kuota)'}</button></div>`}
function V_match(){const f=S.pref,m=S.user.profile||{};return`<div class="head"><div><h1 class="h1">${isEv()?'Sponsor':'Event'} matching</h1><p class="mut" style="margin:0">Atur preferensi, bandingkan kandidat sekaligus, tandai yang diminati, lalu kirim.</p></div></div>
 <div class="mc"><div class="card"><small class="mut">${isEv()?'Event aktif':'Usaha'}</small><br><b>${esc(m.n)}</b></div><div class="card"><small class="mut">Target kategori</small><select data-p="c">${opt(cats(),'Semua',f.c)}</select></div><div class="card"><small class="mut">Lokasi</small><select data-p="l">${opt(LOC,'Semua',f.l)}</select></div><div class="card"><small class="mut">Rentang dana</small><select data-p="b">${opt(Object.keys(BR),'Semua',f.b)}</select></div><div class="card"><small class="mut">Bentuk dukungan</small><select data-p="t">${opt(TYPES,'Semua',f.t)}</select></div></div><div id="mres">${mres()}</div>`}

/* ---------- WORKSPACE ---------- */
const mouText=(d,p)=>{const m=S.user.profile||{},e=isEv();return`NOTA KESEPAHAMAN (MoU) SPONSORSHIP\n\nPihak Pertama (Event): ${e?m.n:p.n}\nPihak Kedua (Sponsor): ${e?p.n:m.n}\n\nPasal 1. Bentuk dukungan: ${p.t.join(' / ')}.\nPasal 2. Pihak Kedua menyerahkan materi (logo, adlibs) paling lambat 14 hari setelah penandatanganan.\nPasal 3. Pihak Pertama memberikan eksposur dan menyerahkan bukti pelaksanaan.\nPasal 4. Perselisihan diselesaikan secara musyawarah.\n\nTanggal: ${new Date(d.at).toLocaleDateString('id-ID',{dateStyle:'long'})}`};
const dcard=d=>{const p=find(d.pid),l={pending:d.dir=='in'?'Minat masuk':'Menunggu jawaban',active:'Aktif',done:'Selesai',rejected:'Ditolak',expired:'Kedaluwarsa'}[d.st];
 return`<div class="card"><h3>${esc(p.n)}</h3>${chips([l])}<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">${d.st=='pending'&&d.dir=='in'?`<button class="btn sm" data-a="acc" data-id="${d.id}">Terima</button><button class="btn red sm" data-a="rej" data-id="${d.id}">Tolak</button>`:''}${['active','done'].includes(d.st)?`<a class="btn sm" href="#/workspace/${d.id}">Buka workspace</a>`:''}</div></div>`};
function V_work(id){
 if(!id)return`<div class="head"><div><h1 class="h1">Workspace &amp; Deal</h1><p class="mut" style="margin:0">Semua kerja samamu di satu tempat.</p></div></div>${S.deals.length?`<div class="grid">${S.deals.map(dcard).join('')}</div>`:'<div class="card"><p class="mut">Belum ada kerja sama. Mulai dari <a href="#/matching"><b>Sponsor Matching</b></a>.</p></div>'}`;
 const d=S.deals.find(x=>x.id==id);if(!d)return V_work();const p=find(d.pid),me=isEv()?'ev':'sp',both=d.sg.e&&d.sg.s,st=d.st=='done'?3:both?2:d.mou?1:0,ok=d.fl.filter(x=>x.ok).length,pc=d.fl.length?Math.round(ok/d.fl.length*100):0;
 const days=Math.max(0,Math.ceil((d.at+12096e5-Date.now())/864e5));
 const it=f=>`<div class="it"><div><b>${esc(f.n)}</b><small>${esc(f.n2||'')}${f.fn?' · '+esc(f.fn):''}${f.v?' · '+Rp(f.v):''}</small></div>${f.ok?'<span class="chip">Terverifikasi</span>':f.k!=me?`<button class="btn sm" data-a="vf" data-id="${d.id}" data-f="${f.id}">Verifikasi</button>`:'<span class="chip" style="background:#eee;color:var(--mut)">Menunggu</span>'}</div>`;
 const col=(k,t)=>`<div><h3>${t}</h3>${d.fl.filter(f=>f.k==k).map(it).join('')||'<p class="mut" style="font-size:13px">Belum ada.</p>'}${k==me?`<form data-f="file" data-k="${k}" class="card" style="margin-top:12px"><input name="n" placeholder="${k=='sp'?'Judul materi, mis. Logo vektor':'Judul bukti, mis. Foto booth'}" required><input name="n2" placeholder="Catatan" style="margin-top:8px"><div class="two" style="margin-top:8px"><input name="v" type="number" min="0" placeholder="Nilai (Rp)"><input name="fn" type="file"></div><button class="btn sm">Tambah</button></form>`:''}</div>`;
 const main=tab=='fl'?(!both?'<div class="card"><p class="mut">Deliverables dibuka setelah MoU ditandatangani kedua pihak. Buka tab Dokumen &amp; MoU.</p></div>':`<div class="card"><div class="row"><b>${ok} dari ${d.fl.length} terverifikasi</b><span class="mut">Tenggat ${new Date(d.at+12096e5).toLocaleDateString('id-ID',{dateStyle:'long'})}</span></div><div class="prog" style="margin:8px 0 16px"><i style="width:${pc}%"></i></div><div class="two">${col('sp','Dari sponsor (materi)')}${col('ev','Dari event (bukti)')}</div></div>`)
 :`<div class="card"><div class="paper">${d.mou?esc(mouText(d,p)):'MoU belum dibuat.'}</div><div class="row" style="margin-top:14px"><button class="btn lime" data-a="mou" data-id="${d.id}" ${d.mou?'disabled':''}>Buat MoU otomatis</button><div style="display:flex;gap:8px"><button class="btn ghost" data-a="sign" data-k="e" data-id="${d.id}" ${d.mou?'':'disabled'}>${d.sg.e?'✓ ':''}TTD Event</button><button class="btn ghost" data-a="sign" data-k="s" data-id="${d.id}" ${d.mou?'':'disabled'}>${d.sg.s?'✓ ':''}TTD Sponsor</button></div></div></div>`;
 return`<a href="#/workspace" class="mut">← Semua kerja sama</a><div class="head" style="margin-top:10px"><div><h1 class="h1">${esc(p.n)}</h1><p class="mut" style="margin:0">${esc(p.c)} · ${esc(p.l)} · ${p.t.join(', ')}</p></div><div class="stats">${both&&d.st=='active'?`<div class="stat"><small>Sisa waktu</small><b>${days} hari</b></div>`:''}<button class="btn" data-a="rep" data-id="${d.id}">Laporan evaluasi</button></div></div>
 <div class="card flow" style="margin-bottom:16px;justify-content:space-between;flex-wrap:wrap">${['Match & negosiasi','MoU e-signed','Deliverables','Audit & selesai'].map((s,i)=>`<span class="${i<st?'ok':i==st?'on':''}"><i>${i<st?'✓':i+1}</i>${s}</span>`).join('')}</div>
 <div class="wsp"><div><div class="tabs"><button data-a="tab" data-k="fl" class="${tab=='fl'?'on':''}">Deliverables</button><button data-a="tab" data-k="mou" class="${tab=='mou'?'on':''}">Dokumen &amp; MoU</button></div>${main}</div>
 <div class="card"><h3>Diskusi</h3><div class="chat" id="chat">${d.msgs.map(m=>`<div class="msg ${m.me?'me':''}">${esc(m.t)}</div>`).join('')||'<p class="mut" style="font-size:13px">Mulai obrolan dengan pihak lain.</p>'}</div><form data-f="msg" class="row" style="flex-wrap:nowrap"><input name="t" placeholder="Tulis pesan…" autocomplete="off"><button class="btn sm" style="margin:0">Kirim</button></form></div></div>`}
function reportHtml(d){const p=find(d.pid),v=d.fl.filter(f=>f.ok).reduce((a,f)=>a+(+f.v||0),0),ok=d.fl.filter(f=>f.ok).length,e=isEv();
 return`<h2 style="margin:0 0 4px">Laporan evaluasi &amp; LPJ akhir</h2><p class="mut" style="margin:0">${esc(e?S.user.profile.n:p.n)} × ${esc(e?p.n:S.user.profile.n)} · ${p.t.join(', ')}</p>
 <div class="kpi"><div><small>Deliverables</small><b>${d.fl.length}</b></div><div><small>Terverifikasi</small><b>${ok}</b></div><div><small>Total valuasi</small><b>${Rp(v)}</b></div><div><small>MoU</small><b>${d.sg.e&&d.sg.s?'Lengkap':'Belum'}</b></div></div>
 <table class="tb"><tr><th>Item</th><th>Dari</th><th>Valuasi</th><th>Status</th></tr>${d.fl.map(f=>`<tr><td>${esc(f.n)}</td><td>${f.k=='sp'?'Sponsor':'Event'}</td><td>${Rp(f.v)}</td><td>${f.ok?'✓ Terverifikasi':'Menunggu'}</td></tr>`).join('')||'<tr><td colspan="4" class="mut">Belum ada deliverables.</td></tr>'}</table>
 <div class="row noprint" style="margin-top:20px"><button class="btn ghost" onclick="print()">Unduh / cetak PDF</button><div style="display:flex;gap:8px"><button class="btn ghost" onclick="$('#dlg').close()">Tutup</button><button class="btn" data-a="end" data-id="${d.id}" ${d.st=='done'||ok<d.fl.length||!d.fl.length?'disabled':''}>${d.st=='done'?'Sudah selesai':'Setujui &amp; akhiri kerja sama'}</button></div></div>${ok<d.fl.length&&d.st!='done'?'<p class="mut noprint" style="font-size:12px">Semua deliverables harus terverifikasi sebelum kerja sama diakhiri.</p>':''}`}

/* ---------- ROUTER ---------- */
function hd(r){const T=[['onboarding','Onboarding & Verifikasi'],['direktori','Eksplorasi Direktori'],['matching',isEv()?'Sponsor Matching':'Event Matching'],['workspace','Workspace & Deal']],q=left();
 $('#hd').innerHTML=`<a class="logo" href="index.html">KriDaya</a>${S.user?`<nav class="tabsn">${T.map(([k,l])=>`<a href="#/${k}" class="${r==k?'on':''}">${l}</a>`).join('')}</nav><form data-f="gs"><input id="gs" placeholder="Cari ${isEv()?'sponsor':'event'}…"><kbd>Ctrl K</kbd></form><button class="pill q ${q===null?'pro':''}" data-a="plan" title="Klik untuk simulasi ganti paket">${q===null?'Premium · kuota ∞':'Free · '+q+'/'+QUOTA+' kuota pitch'}</button><button class="pill" data-a="out">Keluar</button>`:''}`}
function route(){
 const[r,id]=(location.hash.slice(2)||'masuk').split('/');
 if(!S.user&&r!='masuk')return go('/masuk');
 if(S.user&&r=='masuk')return go('/onboarding');
 if(S.user&&!S.ok&&r!='onboarding'){toast('Selesaikan verifikasi dulu');return go('/onboarding')}
 $('#app').innerHTML={masuk:V_auth,onboarding:()=>S.user&&V_onb(),direktori:V_dir,matching:V_match,workspace:()=>V_work(id)}[r]?.()||'';
 hd(r);$$('.otp input').forEach((i,k,a)=>i.addEventListener('input',()=>i.value&&a[k+1]?.focus()));
 if(r=='onboarding')pct();const c=$('#chat');if(c)c.scrollTop=1e9}
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
route();