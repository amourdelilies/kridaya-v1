/* ===== HALAMAN ADMIN: ringkasan, verifikasi, kerja sama, pengguna, log audit ===== */
const AD={items:[],sel:0,st:'pending',chk:{},rs:new Set(),note:'',prev:null,stats:null,deals:[],users:[]};
const ADN=[['ringkasan','Ringkasan','dashboard'],['verifikasi','Verifikasi','check'],['kerjasama','Kerja Sama','brief'],['pengguna','Pengguna','user'],['log','Log Audit','clock']];
const DLB={izin:'Surat izin',panitia:'Susunan kepanitiaan',rab:'RAB',proposal:'Proposal sponsorship',dok:'Dokumentasi',nib:'Dokumen NIB'};
const CK={event:['Surat izin kegiatan sah dan terbaca','Tanda tangan dan stempel sesuai','Susunan kepanitiaan jelas','RAB dan proposal wajar','Media sosial aktif'],sponsor:['NIB valid dan terbaca','Nama usaha sesuai NIB','Lokasi usaha jelas','Kontak dapat dihubungi']};
const RJ=['Dokumen tidak terbaca','Tanda tangan tidak sesuai','Dokumen tidak lengkap','Data tidak konsisten','Media sosial tidak aktif','NIB tidak valid'];
const fmtD=t=>new Date(t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}),fmtT=t=>new Date(t).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
const adSla=t=>{const left=new Date(t).getTime()+864e5-Date.now(),h=Math.abs(left)/36e5,u=h<1?Math.max(1,Math.round(h*60))+' menit':Math.floor(h)+' jam';return{cls:left<0?'over':h<6?'warn':'ok',txt:(left<0?'lewat ':'sisa ')+u}};

function adShell(sub){
 document.body.classList.add('has-sb','is-adm');$('#hd').innerHTML='';const pend=AD.stats?.pending;
 $('#sb').innerHTML=`<a class="sb-lg" href="#/admin">KriDaya<em class="adtag">ADMIN</em></a><nav>${ADN.map(([k,l,i])=>`<a href="#/admin/${k=='ringkasan'?'':k}" class="${sub==k?'on':''}">${svg(i)}<span>${l}</span>${k=='verifikasi'&&pend?`<em>${pend}</em>`:''}</a>`).join('')}<a href="#/verifikasi" class="${sub=='cek'?'on':''}">${svg('search')}<span>Cek TTD</span></a></nav><div class="sb-b"><div class="sb-u"><div><b>${esc(S.user.name)}</b><small>Administrator</small></div><button data-a="out" title="Keluar" aria-label="Keluar">${svg('out')}</button></div></div>`}

async function admin(){
 const sub=location.hash.split('/')[2]||'ringkasan';
 try{await({ringkasan:adHome,verifikasi:adVer,kerjasama:adDeals,pengguna:adUsers,log:adLog}[sub]||adHome)()}catch(x){toast(x.message)}}

/* --- Ringkasan --- */
async function adHome(){
 const[st,pend]=await Promise.all([api('/admin/stats'),api('/admin/profiles?status=pending')]);AD.stats=st;adShell('ringkasan');
 const days=[...Array(14)].map((_,i)=>{const k=new Date(Date.now()-(13-i)*864e5).toISOString().slice(0,10);return[k,(st.daily||{})[k]||0]}),mx=Math.max(1,...days.map(x=>x[1])),
  late=pend.filter(p=>adSla(p.submitted_at).cls=='over'),dls=st.deals||{},us=st.users||{};
 $('#app').innerHTML=`<div class="dsh"><header class="dhd"><div><h1 class="pt">Ringkasan</h1><p class="sub">Antrean verifikasi dan kondisi platform hari ini.</p></div><div class="dact"><a class="btn solid" href="#/admin/verifikasi">Buka antrean</a></div></header>
 <div class="ss five">${[['Menunggu',st.pending,'profil di antrean'],['Lewat SLA',st.overdue,'lebih dari 24 jam',,st.overdue?'hot':''],['Disetujui hari ini',st.approved_today,''],['Ditolak hari ini',st.rejected_today,''],['Rata-rata verifikasi',st.avg_hours==null?'–':st.avg_hours+' jam','50 keputusan terakhir']].map(([l,n,s,,c])=>`<div class="${c||''}"><small class="lb">${l}</small><b>${n}</b><small>${s}</small></div>`).join('')}</div>
 <div class="dg2"><section class="pnl"><div class="ph"><h3>Perlu perhatian</h3><a href="#/admin/verifikasi">Semua antrean</a></div>${(late.length?late:pend.slice(0,4)).slice(0,5).map(p=>{const s=adSla(p.submitted_at);return`<a class="td" href="#/admin/verifikasi" style="text-decoration:none;color:inherit"><i class="dot ${s.cls=='ok'?'':'amber'}"></i><div><b>${esc(p.name)}</b><small>${p.role=='event'?'Event':'Sponsor'} · ${esc(p.location)}${p.flags.length?' · ada peringatan':''}</small></div><span class="sla ${s.cls}">${s.txt}</span></a>`}).join('')||'<p class="mut" style="margin:8px 0 0">Antrean kosong. Semua sudah diperiksa.</p>'}</section>
 <section class="pnl"><div class="ph"><h3>Keputusan 14 hari</h3></div><div class="bars" style="height:90px">${days.map(([k,c])=>`<i title="${c} keputusan · ${fmtD(k)}" style="height:${8+c*92/mx}%"></i>`).join('')}</div><small class="mut">Disetujui dan ditolak per hari</small></section></div>
 <div class="dg2"><section class="pnl"><div class="ph"><h3>Pengguna</h3></div><dl class="kv"><div><dt>Pihak event</dt><dd>${us.event||0}</dd></div><div><dt>Pihak sponsor</dt><dd>${us.sponsor||0}</dd></div></dl></section>
 <section class="pnl"><div class="ph"><h3>Kerja sama</h3><a href="#/admin/kerjasama">Detail</a></div><dl class="kv">${[['Berjalan','active'],['Menunggu jawaban','pending'],['Selesai','done'],['Ditolak / kedaluwarsa',['rejected','expired']]].map(([l,k])=>`<div><dt>${l}</dt><dd>${[].concat(k).reduce((a,x)=>a+(+dls[x]||0),0)}</dd></div>`).join('')}</dl></section></div></div>`}

/* --- Verifikasi (tiga panel) --- */
async function adVer(){
 const[items,st]=await Promise.all([api('/admin/profiles?status='+AD.st),api('/admin/stats')]);AD.items=items;AD.stats=st;if(AD.sel>=items.length)AD.sel=0;adReset();adShell('verifikasi');adVerDraw()}
const adReset=()=>{AD.chk={};AD.rs=new Set();AD.note=''};
function adVerDraw(){
 const it=AD.items,p=it[AD.sel],tabs=[['pending','Menunggu'],['approved','Disetujui'],['rejected','Ditolak']];
 $('#app').innerHTML=`<div class="dsh"><header class="dhd"><div><h1 class="pt">Verifikasi</h1><p class="sub">Periksa dokumen, centang daftar periksa, lalu putuskan. Pintasan: <b>J</b>/<b>K</b> pindah, <b>A</b> setujui, <b>R</b> tulis alasan.</p></div><div class="sg2">${tabs.map(([k,l])=>`<button class="${AD.st==k?'on':''}" data-a="adst" data-v="${k}">${l}${AD.st==k?`<i>${it.length}</i>`:''}</button>`).join('')}</div></header>
 ${p?`<div class="vp"><aside class="vq">${it.map((x,i)=>{const s=AD.st=='pending'?adSla(x.submitted_at):null;return`<button class="vqi ${i==AD.sel?'on':''}" data-a="adsel" data-i="${i}"><div><b>${esc(x.name)}</b><small>${x.role=='event'?'Event':'Sponsor'} · ${esc(x.location)}</small></div><span style="display:flex;gap:8px;align-items:center">${x.flags.length?'<i class="wf" title="Ada peringatan"></i>':''}${s?`<span class="sla ${s.cls}" data-dl="${new Date(x.submitted_at).getTime()}">${s.txt}</span>`:''}</span></button>`}).join('')}</aside><section class="vd">${adDetail(p)}</section><aside class="vk" id="vk">${adDecide(p)}</aside></div>`
 :`<section class="pnl"><p class="mut" style="margin:6px 0">Tidak ada profil ${AD.st=='pending'?'yang menunggu':AD.st=='approved'?'yang disetujui':'yang ditolak'}.</p></section>`}</div>`}
function adDetail(p){
 const x=p.extra||{},ev=p.role=='event',kv=[['Email',x.m],['WhatsApp',x.w],['Media sosial',x.s],ev?['Badan penaung',x.badan]:['NIB',x.nib],ev?['Dana dibutuhkan',x.bmax?Rp(+x.bmax):'']:['Rentang dana',x.bmin||x.bmax?rng([+x.bmin||0,+x.bmax||0]):''],['Berdiri',ev?'':x.y]].filter(r=>r[1]);
 return`<small class="lb">${ev?'Event':'Usaha sponsor'} · diajukan ${ago(new Date(p.submitted_at).getTime())}</small><h2 class="vh">${esc(p.name)}</h2><p class="mut" style="margin:0 0 12px">${esc(p.category)} · ${esc(p.location)} · ${esc(p.identifier)}</p>${p.flags.map(f=>`<div class="warn">${esc(f)}</div>`).join('')}<p>${esc(p.description)}</p><div>${chips(p.types||[])}</div><dl class="kv">${kv.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
 <h3 style="margin:22px 0 8px">Dokumen</h3><div class="tbw"><div class="tsc"><table class="tb2"><thead><tr><th>Jenis</th><th>Berkas</th><th></th></tr></thead><tbody>${p.docs.map(d=>`<tr><td>${DLB[d.type]||esc(d.type)}</td><td>${esc(d.name)}</td><td class="ta"><a class="lk" href="#" data-a="adpv" data-id="${d.id}" data-n="${esc(d.name)}">Pratinjau</a> · <a class="lk" href="#" data-a="dldoc" data-id="${d.id}" data-n="${esc(d.name)}">Unduh</a></td></tr>`).join('')||'<tr><td colspan="3" class="mut" style="padding:20px 16px">Tidak ada dokumen.</td></tr>'}</tbody></table></div></div><div id="pv" class="pv"></div>${p.note?`<p class="mut" style="margin-top:14px">Catatan: ${esc(p.note)}</p>`:''}`}
function adDecide(p){
 if(AD.st!='pending')return`<small class="lb">Keputusan</small><p style="margin:8px 0"><b>${p.status=='approved'?'Disetujui':'Ditolak'}</b>${p.decided_at?` · ${fmtT(p.decided_at)}`:''}</p>${p.note?`<p class="mut">${esc(p.note)}</p>`:''}`;
 const ck=CK[p.role]||[],all=ck.every((_,i)=>AD.chk[i]);
 return`<small class="lb">Daftar periksa</small><div class="cks">${ck.map((t,i)=>`<label class="ck"><input type="checkbox" data-adck="${i}" ${AD.chk[i]?'checked':''}><span>${t}</span></label>`).join('')}</div><button class="btn solid" style="width:100%" id="adok" data-a="adok" data-id="${p.id}" ${all?'':'disabled'}>Setujui</button>
 <small class="lb" style="display:block;margin-top:24px">Tolak dengan alasan</small><div class="chp" style="margin-top:8px">${RJ.map(r=>`<button class="${AD.rs.has(r)?'on':''}" data-a="adrs" data-v="${r}">${r}</button>`).join('')}</div><textarea id="adnote" rows="3" placeholder="Catatan tambahan (opsional)">${esc(AD.note)}</textarea><button class="btn red" style="width:100%;margin-top:10px" data-a="adno" data-id="${p.id}">Tolak</button>`}
async function adPrev(id,name){
 const o=$('#pv');o.innerHTML='<p class="mut">Memuat pratinjau…</p>';
 try{const r=await fetch(API+'/documents/'+id+'/download?inline=1',{headers:{Authorization:'Bearer '+localStorage.kdt}});if(!r.ok)throw new Error(r.status==404?'Berkas tidak ada di server (kemungkinan data contoh).':'Gagal memuat ('+r.status+')');
  const b=await r.blob();if(AD.prev)URL.revokeObjectURL(AD.prev);AD.prev=URL.createObjectURL(b);
  o.innerHTML=b.type.startsWith('image/')?`<img src="${AD.prev}" alt="${esc(name)}">`:b.type=='application/pdf'?`<iframe src="${AD.prev}" title="${esc(name)}"></iframe>`:'<p class="mut">Pratinjau tidak tersedia untuk jenis berkas ini. Gunakan Unduh.</p>'}catch(x){o.innerHTML=`<p class="mut">${esc(x.message)}</p>`}}
async function adDo(id,status){
 let note='';if(status=='rejected'){note=[...AD.rs,(AD.note||'').trim()].filter(Boolean).join('; ');if(!note)return toast('Pilih alasan atau tulis catatan penolakan')}
 try{await api('/admin/profiles/'+id,{method:'POST',body:{status,note}});toast(status=='approved'?'Profil disetujui':'Profil ditolak');
  AD.items.splice(AD.sel,1);AD.sel=Math.min(AD.sel,Math.max(0,AD.items.length-1));adReset();if(AD.stats)AD.stats.pending=Math.max(0,AD.stats.pending-1);adShell('verifikasi');adVerDraw()}catch(x){toast(x.message)}}

/* --- Kerja sama --- */
async function adDeals(){
 const[ds,st]=await Promise.all([api('/admin/deals'),api('/admin/stats')]);AD.deals=ds;AD.stats=st;adShell('kerjasama');
 const L={active:'Berjalan',done:'Selesai',pending:'Menunggu',rejected:'Ditolak',expired:'Kedaluwarsa'},bad=ds.filter(d=>d.flags.length).length;
 $('#app').innerHTML=`<div class="dsh"><header class="dhd"><div><h1 class="pt">Kerja Sama</h1><p class="sub">${ds.length} kerja sama, ${bad} perlu perhatian.</p></div><div class="chp" style="margin:0"><button class="on" data-a="adfl" data-v="all">Semua</button><button data-a="adfl" data-v="bad">Bermasalah</button></div></header>
 <section class="tbw"><div class="tsc"><table class="tb2"><thead><tr><th>Event</th><th>Sponsor</th><th>Status</th><th>Dibuat</th><th>Item</th><th>Penanda</th></tr></thead><tbody>${ds.map(d=>`<tr class="adr" data-bad="${d.flags.length?1:0}"><td><b>${esc(d.event)}</b></td><td>${esc(d.sponsor)}</td><td><span class="stl ${d.status=='active'?'on':''}">${L[d.status]||d.status}</span></td><td>${fmtD(d.created_at)}</td><td>${d.items}</td><td>${d.flags.map(f=>`<span class="sla over">${esc(f)}</span>`).join(' ')||'–'}</td></tr>`).join('')||'<tr><td colspan="6" class="mut" style="padding:24px 16px">Belum ada kerja sama.</td></tr>'}</tbody></table></div></section></div>`}

/* --- Pengguna --- */
async function adUsers(){
 const[us,st]=await Promise.all([api('/admin/users'),api('/admin/stats')]);AD.users=us;AD.stats=st;adShell('pengguna');
 const SL={approved:'Disetujui',pending:'Menunggu',rejected:'Ditolak'};
 $('#app').innerHTML=`<div class="dsh"><header class="dhd"><div><h1 class="pt">Pengguna</h1><p class="sub">${us.length} akun. Premium bisa diaktifkan manual sampai pembayaran tersedia (tercatat di log audit).</p></div><input data-riw placeholder="Cari nama atau email…" style="max-width:260px"></header>
 <section class="tbw"><div class="tsc"><table class="tb2"><thead><tr><th>Akun</th><th>Peran</th><th>Profil</th><th>Status</th><th>Paket</th><th>Terdaftar</th><th></th></tr></thead><tbody>${us.map(u=>`<tr class="rw" data-q="${esc((u.name+' '+u.identifier+' '+(u.profile||'')).toLowerCase())}"><td><b>${esc(u.name)}</b><small>${esc(u.identifier)}</small></td><td>${u.role=='event'?'Event':'Sponsor'}</td><td>${esc(u.profile||'–')}</td><td>${u.status?`<span class="stl ${u.status=='approved'?'on':u.status=='pending'?'am':''}">${SL[u.status]}</span>`:'–'}</td><td>${u.plan=='premium'?'Premium':'Free'}</td><td>${fmtD(u.created_at)}</td><td class="ta"><button class="btn ghost sm" data-a="adplan" data-id="${u.id}" data-v="${u.plan=='premium'?'free':'premium'}">${u.plan=='premium'?'Jadikan Free':'Aktifkan Premium'}</button></td></tr>`).join('')||'<tr><td colspan="7" class="mut" style="padding:24px 16px">Belum ada pengguna.</td></tr>'}</tbody></table></div></section></div>`}

/* --- Log audit --- */
async function adLog(){
 const[lg,st]=await Promise.all([api('/admin/logs'),api('/admin/stats')]);AD.stats=st;adShell('log');
 const AL={approve:'Menyetujui',reject:'Menolak',plan:'Mengubah paket'};
 $('#app').innerHTML=`<div class="dsh"><header class="dhd"><div><h1 class="pt">Log Audit</h1><p class="sub">Siapa memutuskan apa dan kapan. ${lg.length} catatan terakhir.</p></div></header>
 <section class="tbw"><div class="tsc"><table class="tb2"><thead><tr><th>Waktu</th><th>Admin</th><th>Aksi</th><th>Target</th><th>Catatan</th></tr></thead><tbody>${lg.map(l=>`<tr><td>${fmtT(l.at)}</td><td>${esc(l.admin||'–')}</td><td><span class="stl ${l.action=='approve'?'on':l.action=='reject'?'am':''}">${AL[l.action]||esc(l.action)}</span></td><td>${esc(l.label||'–')}<small>${esc(l.target)}</small></td><td>${esc(l.note||'–')}</td></tr>`).join('')||'<tr><td colspan="5" class="mut" style="padding:24px 16px">Belum ada catatan.</td></tr>'}</tbody></table></div></section></div>`}

/* --- aksi dan pintasan --- */
Object.assign(A,{
 adst:e=>{AD.st=e.dataset.v;AD.sel=0;admin()},
 adsel:e=>{AD.sel=+e.dataset.i;adReset();adVerDraw()},
 adrs:e=>{const v=e.dataset.v;AD.rs.has(v)?AD.rs.delete(v):AD.rs.add(v);$('#vk').innerHTML=adDecide(AD.items[AD.sel])},
 adok:e=>adDo(+e.dataset.id,'approved'),adno:e=>adDo(+e.dataset.id,'rejected'),adpv:e=>adPrev(e.dataset.id,e.dataset.n),
 adfl:e=>{$$('.chp button').forEach(b=>b.classList.toggle('on',b==e));$$('.adr').forEach(r=>r.hidden=e.dataset.v=='bad'&&r.dataset.bad!='1')},
 adplan:e=>api('/admin/users/'+e.dataset.id+'/plan',{method:'POST',body:{plan:e.dataset.v}}).then(()=>{toast('Paket diperbarui');adUsers()}).catch(x=>toast(x.message))});
document.addEventListener('change',e=>{if(e.target.dataset.adck==null)return;AD.chk[e.target.dataset.adck]=e.target.checked;const p=AD.items[AD.sel],b=$('#adok');if(p&&b)b.disabled=!(CK[p.role]||[]).every((_,i)=>AD.chk[i])});
document.addEventListener('input',e=>{if(e.target.id=='adnote')AD.note=e.target.value});
document.addEventListener('keydown',e=>{if(!location.hash.startsWith('#/admin/verifikasi')||e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
 const k=e.key.toLowerCase(),n=AD.items.length;
 if(k=='j'&&AD.sel<n-1){AD.sel++;adReset();adVerDraw()}else if(k=='k'&&AD.sel>0){AD.sel--;adReset();adVerDraw()}
 else if(k=='a'&&AD.st=='pending'){const b=$('#adok');if(b&&!b.disabled)b.click()}else if(k=='r'&&$('#adnote')){e.preventDefault();$('#adnote').focus()}});
setInterval(()=>$$('[data-dl]').forEach(el=>{const s=adSla(+el.dataset.dl);el.className='sla '+s.cls;el.textContent=s.txt}),30000);