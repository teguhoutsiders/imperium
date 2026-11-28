/* ==== Imperium Life OS (Teguh 2026-11-26) ====
   Menu: Insights, Career, Ventures
   + Ctrl+K (cari & perintah), tangkap cepat, pengingat.
   (28 Nov 2026: Today, Weekly review, Goal map, People, Health, Journal dihapus.)
   Data disimpan di koleksi yang sama dengan menu lain, dengan kind baru:
   daily (day-YYYY-MM-DD), habit, weekly (week-YYYY-MM-DD), glink (goallinks),
   job, venture, vtx, vkpi, vkv, person, lifecfg. Semua ikut cadangan .zip otomatis. */
(function(){
  "use strict";
  const ID=()=>document.documentElement.lang==="id";
  const T=(en,id)=>ID()?id:en;
  const $=id=>document.getElementById(id);
  const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rp=n=>(n<0?"−":"")+"Rp "+Math.round(Math.abs(n||0)).toLocaleString("id-ID");
  const rpS=n=>{const a=Math.abs(n||0),s=n<0?"−":"";if(a>=1e9)return s+(a/1e9).toFixed(1).replace(".0","")+" M";if(a>=1e6)return s+(a/1e6).toFixed(1).replace(".0","")+" jt";if(a>=1e3)return s+Math.round(a/1e3)+" rb";return s+Math.round(a)};
  const num=s=>{const t=String(s==null?"":s).replace(/[^\d,.-]/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",",".");const n=parseFloat(t);return isNaN(n)?NaN:n};
  const pad=n=>String(n).padStart(2,"0");
  const ymd=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  const today=()=>ymd(new Date());
  const dnum=s=>{const [y,m,d]=s.split("-").map(Number);return Date.UTC(y,m-1,d)/864e5};
  const fromN=n=>new Date(n*864e5).toISOString().slice(0,10);
  const addD=(s,n)=>fromN(dnum(s)+n);
  const diffD=(a,b)=>Math.round(dnum(a)-dnum(b));
  const monday=s=>{const n=dnum(s),w=(new Date(n*864e5).getUTCDay()+6)%7;return fromN(n-w)};
  const tsYmd=t=>t?ymd(new Date(t)):"";
  const MON_EN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],MON_ID=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  const DOW_EN=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],DOW_ID=["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
  const mon=i=>(ID()?MON_ID:MON_EN)[i];
  const fmtD=s=>{if(!s)return"";const [y,m,d]=s.split("-");return (+d)+" "+mon(+m-1)+(y!==today().slice(0,4)?" "+y:"")};
  const dowOf=s=>(new Date(dnum(s)*864e5).getUTCDay()+6)%7;
  const relD=s=>{const n=diffD(s,today());if(n===0)return T("today","hari ini");if(n===1)return T("tomorrow","besok");if(n===-1)return T("yesterday","kemarin");return n>0?T("in "+n+" days",n+" hari lagi"):T(-n+" days ago",-n+" hari lalu")};
  const genId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  /* ---------- data ---------- */
  let col=null,items=[],ready=false;
  const byKind=k=>items.filter(i=>i.kind===k);
  const get=id=>items.find(i=>i.id===id)||null;
  async function put(id,data){
    if(!col)return false;id=id||genId();
    const prev=get(id),body=Object.assign({},data,{created:(prev&&prev.created)||data.created||Date.now(),updated:Date.now()});
    const i=items.findIndex(x=>x.id===id);const loc=Object.assign({id},body);if(i>=0)items[i]=loc;else items.push(loc);
    try{await col.doc(id).set(body);return id}catch(e){console.error("Life OS save",e);toast(T("Could not save. Check your connection.","Gagal menyimpan. Cek koneksi."));return false}
  }
  async function del(id){if(!col)return;items=items.filter(x=>x.id!==id);try{await col.doc(id).delete()}catch(e){console.error(e)}}
  const isRoutine=t=>["daily","weekly","monthly"].includes(t.rep);
  function periodKey(rep,d){d=d||today();if(rep==="daily")return d;if(rep==="monthly")return d.slice(0,7);return monday(d)}
  const doneNow=t=>isRoutine(t)?(t.log||[]).includes(periodKey(t.rep)):!!t.done;

  /* ---------- kecil-kecil ---------- */
  function toast(msg){let t=$("los-toast");if(!t){t=document.createElement("div");t.id="los-toast";t.className="los-toast";t.setAttribute("role","status");document.body.appendChild(t)}t.textContent=msg;t.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("on"),2600)}
  const empty=(txt)=>'<div class="los-empty">'+esc(txt)+'</div>';
  const card=(title,body,extra)=>'<div class="setcard los-card'+(extra&&extra.cls?" "+extra.cls:"")+'">'+(title?'<div class="los-ch"><h3 class="set-h">'+title+'</h3>'+(extra&&extra.right||"")+'</div>':"")+body+'</div>';
  const stat=(lab,val,sub,cls)=>'<div class="los-stat"><span class="los-sl">'+esc(lab)+'</span><b class="los-sv'+(cls?" "+cls:"")+'">'+val+'</b>'+(sub?'<small>'+esc(sub)+'</small>':"")+'</div>';
  const opt=(v,l,sel)=>'<option value="'+esc(v)+'"'+(sel?" selected":"")+'>'+esc(l)+'</option>';
  const bar=(pct,cls)=>'<span class="los-bar'+(cls?" "+cls:"")+'"><i style="width:'+clamp(Math.round(pct||0),0,100)+'%"></i></span>';
  const cur=()=>(location.hash||"#overview").slice(1);
  const vis=t=>{const p=$("tab-"+t);return p&&!p.hidden};

  /* ---------- grafik SVG sederhana (batang & garis) ---------- */
  /* series: [{name,cls,values:[]}], labels: []; fmt: angka → teks */
  function barChart(labels,series,fmt,opts){
    opts=opts||{};const W=640,H=opts.h||200,L=44,R=8,Tp=10,B=24,iw=W-L-R,ih=H-Tp-B;
    let mx=0,mn=0;series.forEach(s=>s.values.forEach(v=>{if(v>mx)mx=v;if(v<mn)mn=v}));if(mx===mn)mx=mn+1;
    const tk=ticks(mn,mx,opts.int);mn=tk[0];mx=tk[tk.length-1];const y=v=>Tp+ih*(1-(v-mn)/(mx-mn));
    let g='';
    tk.forEach(v=>{const yy=y(v);g+='<line class="los-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'"/><text class="los-ax" x="'+(L-6)+'" y="'+(yy+4)+'" text-anchor="end">'+esc(fmt?fmt(v,true):Math.round(v))+'</text>'});
    if(mn<0)g+='<line class="los-zero" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(0)+'" y2="'+y(0)+'"/>';
    const n=labels.length,gw=iw/n,ns=series.length,bw=Math.max(3,Math.min(22,(gw-6)/ns-2));
    const step=Math.ceil(n/12);
    labels.forEach((lab,i)=>{
      const cx=L+gw*i+gw/2,x0=cx-(ns*(bw+2)-2)/2;
      if(i%step===0)g+='<text class="los-ax" x="'+cx+'" y="'+(H-6)+'" text-anchor="middle">'+esc(lab)+'</text>';
      const tip=esc(lab)+": "+series.map(s=>(ns>1?s.name+" ":"")+(fmt?fmt(s.values[i]):s.values[i])).join(" · ");
      g+='<g class="los-hit" data-tip="'+tip+'"><rect class="los-hb" x="'+(L+gw*i)+'" y="'+Tp+'" width="'+gw+'" height="'+ih+'"/>';
      series.forEach((s,k)=>{const v=s.values[i]||0,y1=y(Math.max(0,v)),y2=y(Math.min(0,v)),h=Math.max(v?1.5:0,y2-y1);
        if(h>0)g+='<path class="los-mk '+(s.cls||"s1")+'" d="'+roundBar(x0+k*(bw+2),y1,bw,h,v<0)+'"/>'});
      g+='</g>';
    });
    const leg=ns>1?'<div class="los-leg">'+series.map(s=>'<span><i class="'+(s.cls||"s1")+'"></i>'+esc(s.name)+'</span>').join("")+'</div>':"";
    return leg+'<div class="los-chart"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(opts.label||"")+'">'+g+'</svg><div class="los-tip" hidden></div></div>';
  }
  /* garis bantu sumbu dengan angka bulat (1, 2, 5 × 10ⁿ) */
  function ticks(mn,mx,int){
    const raw=(mx-mn)/4,p=Math.pow(10,Math.floor(Math.log10(raw||1))),f=raw/p;let st=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p;if(int)st=Math.max(1,Math.ceil(st));
    const a=Math.floor(mn/st)*st,b=Math.ceil(mx/st)*st,out=[];for(let v=a;v<=b+st/2;v+=st)out.push(Math.round(v/st)*st);if(out.length<2)out.push(a+st);return out;
  }
  function roundBar(x,y,w,h,down){const r=Math.min(4,w/2,h);if(down)return "M"+x+","+y+"h"+w+"v"+(h-r)+"q0,"+r+" -"+r+","+r+"h-"+(w-2*r)+"q-"+r+",0 -"+r+",-"+r+"z";return "M"+x+","+(y+h)+"v-"+(h-r)+"q0,-"+r+" "+r+",-"+r+"h"+(w-2*r)+"q"+r+",0 "+r+","+r+"v"+(h-r)+"z"}
  function lineChart(labels,values,fmt,opts){
    opts=opts||{};const W=640,H=opts.h||180,L=44,R=10,Tp=12,B=24,iw=W-L-R,ih=H-Tp-B;
    const pts=values.map((v,i)=>v==null?null:[i,v]).filter(Boolean);
    if(!pts.length)return empty(T("No data yet.","Belum ada data."));
    let mx=Math.max(...pts.map(p=>p[1])),mn=Math.min(...pts.map(p=>p[1]));if(opts.target!=null){mx=Math.max(mx,opts.target);mn=Math.min(mn,opts.target)}
    if(mx===mn){mx+=1;mn-=1}
    const tk=ticks(opts.min0?Math.max(0,mn):mn,mx,opts.int);mn=tk[0];mx=tk[tk.length-1];
    const x=i=>L+(labels.length<2?iw/2:iw*i/(labels.length-1)),y=v=>Tp+ih*(1-(v-mn)/(mx-mn));
    let g='';tk.forEach(v=>{g+='<line class="los-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text class="los-ax" x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+esc(fmt?fmt(v,true):String(+v.toFixed(2)))+'</text>'});
    if(opts.target!=null)g+='<line class="los-tgt" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(opts.target)+'" y2="'+y(opts.target)+'"/><text class="los-ax" x="'+(L+4)+'" y="'+(y(opts.target)-4)+'">'+esc(T("target","target"))+'</text>';
    const step=Math.ceil(labels.length/8);labels.forEach((l,i)=>{if(i%step===0)g+='<text class="los-ax" x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle">'+esc(l)+'</text>'});
    let d='';pts.forEach((p,k)=>{d+=(k?"L":"M")+x(p[0]).toFixed(1)+","+y(p[1]).toFixed(1)});
    g+='<path class="los-line" d="'+d+'"/>';
    pts.forEach(p=>{g+='<g class="los-hit" data-tip="'+esc(labels[p[0]]+": "+(fmt?fmt(p[1]):p[1]))+'"><circle class="los-hc" cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="11"/><circle class="los-dot" cx="'+x(p[0])+'" cy="'+y(p[1])+'" r="4"/></g>'});
    return '<div class="los-chart"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(opts.label||"")+'">'+g+'</svg><div class="los-tip" hidden></div></div>';
  }
  document.addEventListener("pointerover",e=>{const h=e.target.closest&&e.target.closest(".los-hit");if(!h)return;const c=h.closest(".los-chart"),tip=c&&c.querySelector(".los-tip");if(!tip)return;
    c.querySelectorAll(".los-hit.on").forEach(x=>x.classList.remove("on"));h.classList.add("on");tip.textContent=h.dataset.tip;tip.hidden=false;
    const r=c.getBoundingClientRect(),b=h.getBoundingClientRect();tip.style.left=clamp(b.left-r.left+b.width/2,60,r.width-60)+"px";tip.style.top=Math.max(0,b.top-r.top-8)+"px"});
  document.addEventListener("pointerout",e=>{const h=e.target.closest&&e.target.closest(".los-hit");if(!h||(e.relatedTarget&&h.contains(e.relatedTarget)))return;h.classList.remove("on");const t=h.closest(".los-chart").querySelector(".los-tip");if(t)t.hidden=true});

  /* ---------- pengingat (tugas, lamaran, masa aktif, cicilan) ---------- */
  function reminders(){
    const t0=today(),r=[];
    byKind("task").forEach(t=>{if(isRoutine(t)||t.done||!t.due)return;const n=diffD(t.due,t0);if(n<=0)r.push({k:"t-"+t.id,lv:n<0?"crit":"warn",tab:"tugas",txt:(n<0?T("Overdue: ","Terlambat: "):T("Due today: ","Jatuh tempo hari ini: "))+t.title})});
    byKind("job").forEach(j=>{if(!j.follow||["rejected","accepted","withdrawn"].includes(j.status))return;const n=diffD(j.follow,t0);if(n<=0)r.push({k:"j-"+j.id+j.follow,lv:n<0?"crit":"warn",tab:"career",txt:T("Follow up ","Follow-up ")+(j.company||"")+(j.role?" · "+j.role:"")+(n<0?" ("+relD(j.follow)+")":"")})});
    byKind("sub").forEach(s=>{if(s.mode==="up"||!s.end)return;const n=diffD(s.end,t0);if(n>=0&&n<=7)r.push({k:"s-"+s.id+s.end,lv:n<=2?"warn":"info",tab:"masa-aktif",txt:(s.name||"")+" "+T("ends ","berakhir ")+relD(s.end)})});
    const ym=t0.slice(0,7);
    byKind("fin").forEach(f=>{if(f.type!=="liabilitas"||!(f.dueDay>0))return;const paid=items.some(x=>x.kind==="pay"&&x.liab===f.id&&(x.date||"").slice(0,7)===ym);if(paid)return;
      const last=new Date(+ym.slice(0,4),+ym.slice(5),0).getDate(),due=ym+"-"+pad(Math.min(f.dueDay,last)),n=diffD(due,t0);if(n<=3)r.push({k:"l-"+f.id+due,lv:n<0?"crit":"warn",tab:"hutang",txt:(/^(cicilan|installment)/i.test(f.name||"")?"":T("Installment ","Cicilan "))+(f.name||"")+" "+(n<0?T("overdue","lewat jatuh tempo"):relD(due))+(f.installment?" · "+rp(f.installment):"")})});
    const ord={crit:0,warn:1,info:2};return r.sort((a,b)=>ord[a.lv]-ord[b.lv]);
  }

  /* =====================================================================
     INSIGHTS
     ===================================================================== */
  let insCatMonth=null;
  function renderInsights(){
    const root=$("los-insights");if(!root)return;const t0=today();
    const months=[];{let y=+t0.slice(0,4),m=+t0.slice(5,7);for(let i=0;i<12;i++){months.unshift(y+"-"+pad(m));m--;if(m<1){m=12;y--}}}
    const inc=months.map(()=>0),exp=months.map(()=>0);
    const tx=byKind("fin").filter(f=>f.type==="transaksi");
    tx.forEach(f=>{const i=months.indexOf((f.date||"").slice(0,7));if(i<0)return;if(f.dir==="in")inc[i]+=+f.amount||0;else exp[i]+=+f.amount||0});
    const net=months.map((_,i)=>inc[i]-exp[i]),mLab=months.map(m=>mon(+m.slice(5)-1));
    const cm=insCatMonth||t0.slice(0,7),cats={};tx.forEach(f=>{if(f.dir==="in"||(f.date||"").slice(0,7)!==cm)return;const c=f.cat||T("Uncategorised","Tanpa kategori");cats[c]=(cats[c]||0)+(+f.amount||0)});
    const catArr=Object.entries(cats).sort((a,b)=>b[1]-a[1]),catTot=catArr.reduce((a,c)=>a+c[1],0);
    const weeks=[];{const w0=monday(t0);for(let i=11;i>=0;i--)weeks.push(addD(w0,-7*i))}
    const wLab=weeks.map(w=>fmtD(w).replace(/ \d{4}$/,""));
    const focusW=weeks.map(w=>byKind("sw").filter(s=>s.date>=w&&s.date<=addD(w,6)).reduce((a,s)=>a+(+s.ms||0),0)/36e5);
    const doneW=weeks.map(w=>byKind("task").filter(t=>!isRoutine(t)&&t.done&&(d=>d>=w&&d<=addD(w,6))(tsYmd(t.doneAt))).length);
    const sum=a=>a.reduce((x,y)=>x+y,0),thisM=months.length-1;
    let h='<div class="los-stats">'+stat(T("Income this month","Pemasukan bulan ini"),rp(inc[thisM]),"","mny-pos")+stat(T("Expense this month","Pengeluaran bulan ini"),rp(exp[thisM]),"","mny-neg")+stat(T("Net this month","Selisih bulan ini"),rp(net[thisM]),"",net[thisM]>=0?"mny-pos":"mny-neg")+stat(T("Net, last 12 months","Selisih 12 bulan"),rp(sum(net)),"",sum(net)>=0?"mny-pos":"mny-neg")+stat(T("Saving rate (12 mo)","Rasio tabungan (12 bln)"),sum(inc)?Math.round(sum(net)/sum(inc)*100)+"%":"—")+stat(T("Focus, last 4 weeks","Fokus 4 minggu"),sum(focusW.slice(-4)).toFixed(1)+T(" h"," jam"))+'</div>';
    h+='<div class="los-g2">';
    h+=card(T("Income vs expense · 12 months","Pemasukan vs pengeluaran · 12 bulan"),tx.length?barChart(mLab,[{name:T("Income","Pemasukan"),cls:"pos",values:inc},{name:T("Expense","Pengeluaran"),cls:"neg",values:exp}],(v,ax)=>ax?rpS(v):rp(v),{label:"Income vs expense"}):empty(T("Add income and expense records to see this chart.","Tambah record pemasukan dan pengeluaran untuk melihat grafik ini.")));
    h+=card(T("Net per month","Selisih per bulan"),tx.length?barChart(mLab,[{name:T("Net","Selisih"),cls:"s1",values:net}],(v,ax)=>ax?rpS(v):rp(v),{label:"Net"}):empty(T("No records yet.","Belum ada record.")));
    const mOpts=months.slice().reverse().map(m=>opt(m,mon(+m.slice(5)-1)+" "+m.slice(0,4),m===cm)).join("");
    h+=card(T("Expense by category","Pengeluaran per kategori"),(catArr.length?'<ul class="los-hbar">'+catArr.map(([c,v])=>'<li title="'+esc(c+": "+rp(v))+'"><span class="n">'+esc(c)+'</span>'+bar(v/catArr[0][1]*100,"neg")+'<span class="v">'+rp(v)+' <small>'+Math.round(v/catTot*100)+'%</small></span></li>').join("")+'</ul>':empty(T("No expenses this month.","Belum ada pengeluaran bulan ini."))),{right:'<select data-act="cm" aria-label="'+T("Month","Bulan")+'">'+mOpts+'</select>'});
    h+=card(T("Focus time per week (hours)","Waktu fokus per minggu (jam)"),sum(focusW)?barChart(wLab,[{name:T("Hours","Jam"),cls:"s2",values:focusW.map(v=>+v.toFixed(2))}],(v,ax)=>ax?String(+(+v).toFixed(1)):(+v).toFixed(1)+T(" h"," jam"),{label:"Focus"}):empty(T("Save stopwatch sessions to see focus time.","Simpan sesi stopwatch untuk melihat waktu fokus.")));
    h+=card(T("Tasks finished per week","Tugas selesai per minggu"),sum(doneW)?barChart(wLab,[{name:T("Tasks","Tugas"),cls:"s3",values:doneW}],v=>Math.round(v),{label:"Tasks",int:true}):empty(T("Finish a few tasks to see this chart.","Selesaikan beberapa tugas untuk melihat grafik ini.")));
    h+='</div>';root.innerHTML=h;
  }
  function wireInsights(){const root=$("los-insights");if(!root||root.dataset.w)return;root.dataset.w=1;root.addEventListener("change",e=>{if(e.target.dataset.act==="cm"){insCatMonth=e.target.value;renderInsights()}})}

  /* =====================================================================
     CAREER
     ===================================================================== */
  const JST=[["wish","Wishlist","Incaran"],["applied","Applied","Terkirim"],["test","Test","Tes"],["interview","Interview","Interview"],["offer","Offer","Offer"],["accepted","Accepted","Diterima"],["rejected","Rejected","Ditolak"],["withdrawn","Withdrawn","Mundur"]];
  const jst=k=>{const s=JST.find(x=>x[0]===k)||JST[0];return T(s[1],s[2])};
  const OPEN=["wish","applied","test","interview","offer"];
  let jobEdit=null,jobFormOpen=false,showClosed=false;
  function jobForm(j){
    j=j||{};const f=(n,lab,attrs,val)=>'<label>'+esc(lab)+'<input name="'+n+'" '+(attrs||"")+' value="'+esc(val!=null?val:(j[n]||""))+'"></label>';
    return '<form class="entry los-form" data-form="job" autocomplete="off"><p class="formtitle">'+(jobEdit?T("Edit application","Ubah lamaran"):T("New application","Lamaran baru"))+'</p>'+
      f("company",T("Company","Perusahaan"),'required maxlength="120" placeholder="'+T("e.g. PT Example Mining","mis. PT Contoh Tambang")+'"')+f("role",T("Position","Posisi"),'maxlength="120" placeholder="Maintenance Planner"')+
      '<label>'+T("Status","Status")+'<select name="status">'+JST.map(s=>opt(s[0],T(s[1],s[2]),(j.status||"applied")===s[0])).join("")+'</select></label>'+
      f("applied",T("Applied on","Tanggal kirim"),'type="date"',j.applied||(jobEdit?"":today()))+f("follow",T("Follow up on","Follow-up tanggal"),'type="date"',j.follow||(jobEdit?"":addD(today(),7)))+
      f("location",T("Location","Lokasi"),'maxlength="80"')+f("source",T("Source","Sumber"),'maxlength="60" list="los-srcs" placeholder="LinkedIn, JobStreet, Website, Referral"')+f("salary",T("Salary / package","Gaji / paket"),'maxlength="60"')+
      f("contact",T("Contact person","Kontak"),'maxlength="120" placeholder="'+T("HR name, email or phone","Nama HR, email atau HP")+'"')+f("url",T("Job link","Tautan lowongan"),'type="url" maxlength="400" placeholder="https://"')+
      '<label class="wide">'+T("Notes","Catatan")+'<textarea name="notes" rows="3" maxlength="4000">'+esc(j.notes||"")+'</textarea></label>'+
      '<datalist id="los-srcs"><option>LinkedIn</option><option>JobStreet</option><option>Website</option><option>Referral</option><option>Email</option><option>Glints</option><option>Kalibrr</option></datalist>'+
      '<div class="actions">'+(jobEdit?'<button type="button" class="ghost danger" data-act="jobdel">'+T("Delete","Hapus")+'</button>':"")+'<button type="button" class="ghost" data-act="jobcancel">'+T("Cancel","Batal")+'</button><button class="primary">'+(jobEdit?T("Save changes","Simpan perubahan"):T("Add application","Tambah lamaran"))+'</button></div></form>';
  }
  function renderCareer(){
    const root=$("los-career");if(!root)return;const js=byKind("job"),t0=today(),ym=t0.slice(0,7);
    const act=js.filter(j=>OPEN.includes(j.status)),sent=js.filter(j=>j.status!=="wish"),resp=sent.filter(j=>["test","interview","offer","accepted","rejected"].includes(j.status));
    let h='<div class="los-stats">'+stat(T("Active","Aktif"),act.length)+stat(T("Sent this month","Terkirim bulan ini"),js.filter(j=>(j.applied||"").slice(0,7)===ym&&j.status!=="wish").length)+stat(T("Interviews","Interview"),js.filter(j=>["interview","offer","accepted"].includes(j.status)).length)+stat(T("Offers","Offer"),js.filter(j=>["offer","accepted"].includes(j.status)).length)+stat(T("Response rate","Tingkat respons"),sent.length?Math.round(resp.length/sent.length*100)+"%":"—",T("of applications sent","dari lamaran terkirim"))+stat(T("Follow-ups due","Follow-up jatuh tempo"),act.filter(j=>j.follow&&j.follow<=t0).length,"",act.some(j=>j.follow&&j.follow<t0)?"mny-neg":"")+'</div>';
    h+='<div class="los-bar2"><button type="button" class="soft" data-act="jobnew">+ '+T("New application","Lamaran baru")+'</button><label class="los-tg"><input type="checkbox" data-act="closed"'+(showClosed?" checked":"")+'> '+T("Show closed","Tampilkan yang selesai")+'</label></div>';
    if(jobFormOpen)h+=jobForm(jobEdit?get(jobEdit):null);
    const cols=OPEN.concat(showClosed?["accepted","rejected","withdrawn"]:[]);
    h+='<div class="los-kb">'+cols.map(st=>{const list=js.filter(j=>(j.status||"applied")===st).sort((a,b)=>(a.follow||"9").localeCompare(b.follow||"9"));
      return '<div class="los-kc" data-st="'+st+'"><div class="los-kh"><b>'+esc(jst(st))+'</b><span class="los-pill">'+list.length+'</span></div>'+list.map(j=>{const od=j.follow&&j.follow<=t0&&OPEN.includes(st);const i=OPEN.indexOf(st);
        return '<div class="los-job'+(od?" due":"")+'"><button type="button" class="los-jb" data-act="jobedit" data-id="'+esc(j.id)+'"><b>'+esc(j.company)+'</b><span>'+esc(j.role||"")+'</span><small>'+(j.applied&&st!=="wish"?T("Sent ","Kirim ")+esc(fmtD(j.applied)):"")+(j.follow&&OPEN.includes(st)?" · "+T("follow-up ","follow-up ")+esc(relD(j.follow)):"")+'</small></button><div class="los-jm">'+(i>0?'<button type="button" class="ghost" data-act="jobmv" data-id="'+esc(j.id)+'" data-v="-1" aria-label="'+T("Move back","Mundurkan")+'">‹</button>':"")+(OPEN.includes(st)&&j.follow?'<button type="button" class="ghost" data-act="jobfu" data-id="'+esc(j.id)+'" title="'+T("Followed up today: next in 7 days","Sudah follow-up hari ini: berikutnya 7 hari lagi")+'">✓ FU</button>':"")+(OPEN.includes(st)?'<button type="button" class="ghost" data-act="jobrej" data-id="'+esc(j.id)+'" title="'+T("Rejected","Ditolak")+'">✕</button>':"")+(i>=0&&i<OPEN.length-1?'<button type="button" class="ghost" data-act="jobmv" data-id="'+esc(j.id)+'" data-v="1" aria-label="'+T("Move forward","Majukan")+'">›</button>':st==="offer"?'<button type="button" class="ghost" data-act="jobacc" data-id="'+esc(j.id)+'">'+T("Accept","Terima")+'</button>':"")+'</div></div>'}).join("")+(list.length?"":'<p class="hint los-kempty">—</p>')+'</div>'}).join("")+'</div>';
    root.innerHTML=h;const c=$("c-career");if(c){const n=act.filter(j=>j.follow&&j.follow<=t0).length;c.textContent=String(n);c.classList.toggle("alert",n>0)}
  }
  function wireCareer(){const root=$("los-career");if(!root||root.dataset.w)return;root.dataset.w=1;
    root.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act,j=b.dataset.id&&get(b.dataset.id);
      const upd=f=>{const {id,...r}=j;return put(j.id,Object.assign(r,f)).then(renderCareer)};
      if(a==="jobnew"){jobEdit=null;jobFormOpen=true;renderCareer();root.querySelector('[name=company]').focus();return}
      if(a==="jobedit"){jobEdit=b.dataset.id;jobFormOpen=true;renderCareer();root.querySelector(".los-form").scrollIntoView({block:"nearest"});return}
      if(a==="jobcancel"){jobFormOpen=false;jobEdit=null;renderCareer();return}
      if(a==="jobdel"){if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent=T("Delete for good?","Yakin hapus?");return}del(jobEdit).then(()=>{jobFormOpen=false;jobEdit=null;renderCareer()});return}
      if(!j)return;
      if(a==="jobmv"){const i=OPEN.indexOf(j.status||"applied"),n=OPEN[clamp(i+ +b.dataset.v,0,OPEN.length-1)],f={status:n};if(n==="applied"&&!j.applied)f.applied=today();if(n!=="wish"&&(!j.follow||j.follow<today()))f.follow=addD(today(),7);upd(f);return}
      if(a==="jobfu"){upd({follow:addD(today(),7),notes:((j.notes||"")+"\n"+today()+": follow-up").trim()});return}
      if(a==="jobrej"){upd({status:"rejected"});return}
      if(a==="jobacc"){upd({status:"accepted"});return}
    });
    root.addEventListener("change",e=>{if(e.target.dataset.act==="closed"){showClosed=e.target.checked;renderCareer()}});
    root.addEventListener("submit",e=>{const f=e.target;if(f.dataset.form!=="job")return;e.preventDefault();const g=n=>(f[n]&&f[n].value||"").trim();
      const prev=jobEdit?get(jobEdit):null,{id:_i,...base}=prev||{};
      put(jobEdit,Object.assign(base,{kind:"job",company:g("company"),role:g("role"),status:g("status")||"applied",applied:g("applied"),follow:g("follow"),location:g("location"),source:g("source"),salary:g("salary"),contact:g("contact"),url:g("url"),notes:f.notes.value.trim()})).then(()=>{jobFormOpen=false;jobEdit=null;renderCareer()})});
  }

  /* =====================================================================
     VENTURES
     ===================================================================== */
  let vSel=null,vForm=null; /* vForm: "new"|"edit"|"tx"|"kpi" */
  function vStats(v){const tx=byKind("vtx").filter(x=>x.venture===v.id),ym=today().slice(0,7);
    const s={inM:0,outM:0,inA:0,outA:0};tx.forEach(x=>{const a=+x.amount||0,m=(x.date||"").slice(0,7)===ym;if(x.dir==="in"){s.inA+=a;if(m)s.inM+=a}else{s.outA+=a;if(m)s.outM+=a}});return s}
  function renderVentures(){
    const root=$("los-ventures");if(!root)return;const vs=byKind("venture").sort((a,b)=>(a.created||0)-(b.created||0));
    if(vSel&&!vs.some(v=>v.id===vSel))vSel=null;if(!vSel&&vs.length)vSel=vs[0].id;
    const v=vSel&&get(vSel);
    let h='<div class="los-bar2 los-vtabs">'+vs.map(x=>'<button type="button" class="chip" data-act="vsel" data-id="'+esc(x.id)+'" aria-pressed="'+(x.id===vSel)+'">'+esc((x.emoji?x.emoji+" ":"")+x.name)+'</button>').join("")+'<button type="button" class="soft" data-act="vnew">+ '+T("New venture","Usaha baru")+'</button></div>';
    if(vForm==="new"||vForm==="edit"){const x=vForm==="edit"?v:{};
      h+='<form class="entry los-form" data-form="venture"><p class="formtitle">'+(vForm==="edit"?T("Edit venture","Ubah usaha"):T("New venture","Usaha baru"))+'</p><label>'+T("Name","Nama")+'<input name="name" required maxlength="80" value="'+esc(x.name||"")+'" placeholder="'+T("e.g. Layer farm","mis. Ternak ayam petelur")+'"></label><label>Emoji<input name="emoji" maxlength="2" value="'+esc(x.emoji||"")+'" placeholder="🥚"></label><label>'+T("Status","Status")+'<select name="status">'+[["idea",T("Idea","Ide")],["build",T("Building","Persiapan")],["run",T("Running","Berjalan")],["pause",T("Paused","Jeda")],["stop",T("Stopped","Berhenti")]].map(s=>opt(s[0],s[1],(x.status||"idea")===s[0])).join("")+'</select></label><label>'+T("Partners","Mitra")+'<input name="partners" maxlength="200" value="'+esc(x.partners||"")+'"></label><label class="wide">'+T("What it is / plan","Deskripsi / rencana")+'<textarea name="desc" rows="3" maxlength="4000">'+esc(x.desc||"")+'</textarea></label><div class="actions">'+(vForm==="edit"?'<button type="button" class="ghost danger" data-act="vdel">'+T("Delete","Hapus")+'</button>':"")+'<button type="button" class="ghost" data-act="vcancel">'+T("Cancel","Batal")+'</button><button class="primary">'+T("Save","Simpan")+'</button></div></form>'}
    if(!v){h+=(vForm?"":empty(T("No ventures yet. Add each business you run or plan, then log its cash and KPIs.","Belum ada usaha. Tambah tiap usaha yang dijalankan atau direncanakan, lalu catat uang dan KPI-nya.")));root.innerHTML=h;return}
    const s=vStats(v),tx=byKind("vtx").filter(x=>x.venture===v.id).sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.created||0)-(a.created||0));
    const kp=byKind("vkpi").filter(k=>k.venture===v.id);
    h+='<div class="los-vh"><div><h3 class="set-h">'+esc((v.emoji?v.emoji+" ":"")+v.name)+' <span class="los-st">'+esc({idea:T("Idea","Ide"),build:T("Building","Persiapan"),run:T("Running","Berjalan"),pause:T("Paused","Jeda"),stop:T("Stopped","Berhenti")}[v.status||"idea"])+'</span></h3>'+(v.partners?'<p class="hint">'+T("Partners: ","Mitra: ")+esc(v.partners)+'</p>':"")+(v.desc?'<p class="hint los-pre">'+esc(v.desc)+'</p>':"")+'</div><button type="button" class="ghost" data-act="vedit">'+T("Edit","Ubah")+'</button></div>';
    h+='<div class="los-stats">'+stat(T("In this month","Masuk bulan ini"),rp(s.inM),"","mny-pos")+stat(T("Out this month","Keluar bulan ini"),rp(s.outM),"","mny-neg")+stat(T("Net this month","Selisih bulan ini"),rp(s.inM-s.outM),"",s.inM-s.outM>=0?"mny-pos":"mny-neg")+stat(T("Net all time","Selisih total"),rp(s.inA-s.outA),T("Capital out ","Modal keluar ")+rp(s.outA),s.inA-s.outA>=0?"mny-pos":"mny-neg")+'</div>';
    /* arus kas */
    let c1='<form class="los-row" data-form="vtx"><select name="dir" aria-label="'+T("Type","Jenis")+'">'+opt("in",T("In","Masuk"))+opt("out",T("Out","Keluar"),true)+'</select><input name="amount" inputmode="numeric" required placeholder="'+T("Amount","Jumlah")+'" aria-label="'+T("Amount","Jumlah")+'"><input name="note" maxlength="140" placeholder="'+T("e.g. Feed 10 sacks","mis. Pakan 10 karung")+'" aria-label="'+T("Description","Keterangan")+'"><input name="date" type="date" value="'+today()+'" aria-label="'+T("Date","Tanggal")+'"><button class="primary">'+T("Add","Tambah")+'</button></form>';
    c1+=tx.length?'<ul class="list los-tx">'+tx.slice(0,40).map(x=>'<li><span class="los-txd">'+esc(fmtD(x.date))+'</span><span class="grow">'+esc(x.note||"—")+'</span><b class="'+(x.dir==="in"?"mny-pos":"mny-neg")+'">'+(x.dir==="in"?"+":"−")+rp(x.amount).replace("−","")+'</b><button type="button" class="ghost los-x" data-act="vtxdel" data-id="'+esc(x.id)+'" aria-label="'+T("Delete","Hapus")+'">×</button></li>').join("")+'</ul>':empty(T("No cash entries yet.","Belum ada catatan uang."));
    /* KPI */
    let c2=kp.length?'<ul class="list los-kpi">'+kp.map(k=>{const vals=byKind("vkv").filter(x=>x.kpi===k.id).sort((a,b)=>(a.date||"").localeCompare(b.date||"")),last=vals[vals.length-1],pct=k.target&&last?Math.round(last.value/k.target*100):null;
      const spark=vals.length>1?sparkline(vals.slice(-20).map(x=>+x.value)):"";
      return '<li><div class="grow"><div class="ttl">'+esc(k.name)+'</div><div class="meta"><b>'+(last?esc(fmtNum(last.value))+" "+esc(k.unit||""):"—")+'</b>'+(k.target?'<span>'+T("target ","target ")+esc(fmtNum(k.target))+" "+esc(k.unit||"")+(pct!=null?" · "+pct+"%":"")+'</span>':"")+(last?'<span>'+esc(fmtD(last.date))+'</span>':"")+'</div>'+(k.target&&last?bar(pct):"")+'</div>'+spark+'<form class="los-kv" data-form="vkv" data-id="'+esc(k.id)+'"><input name="value" inputmode="decimal" required placeholder="'+T("Value","Nilai")+'" aria-label="'+esc(k.name)+'"><button class="soft">'+T("Log","Catat")+'</button></form><button type="button" class="ghost los-x" data-act="vkpidel" data-id="'+esc(k.id)+'" aria-label="'+T("Delete KPI","Hapus KPI")+'">×</button></li>'}).join("")+'</ul>':empty(T("No KPIs yet, e.g. eggs per day, active customers, orders.","Belum ada KPI, mis. telur per hari, pelanggan aktif, jumlah order."));
    c2+='<form class="los-row" data-form="vkpi"><input name="name" required maxlength="60" placeholder="'+T("KPI name","Nama KPI")+'"><input name="unit" maxlength="16" placeholder="'+T("Unit","Satuan")+'"><input name="target" inputmode="decimal" placeholder="Target"><button class="primary">'+T("Add KPI","Tambah KPI")+'</button></form>';
    h+='<div class="los-g2">'+card(T("Cash flow","Arus kas"),c1)+card("KPI",c2)+'</div>';
    root.innerHTML=h;
  }
  const fmtNum=v=>(+v).toLocaleString("id-ID",{maximumFractionDigits:2});
  function sparkline(vals){const W=90,H=28,mx=Math.max(...vals),mn=Math.min(...vals),r=mx-mn||1;const d=vals.map((v,i)=>(i?"L":"M")+(i*(W-4)/(vals.length-1)+2).toFixed(1)+","+(H-3-(v-mn)/r*(H-6)).toFixed(1)).join("");return '<svg class="los-spark" viewBox="0 0 '+W+' '+H+'" aria-hidden="true"><path d="'+d+'"/></svg>'}
  function wireVentures(){const root=$("los-ventures");if(!root||root.dataset.w)return;root.dataset.w=1;
    root.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
      if(a==="vsel"){vSel=b.dataset.id;vForm=null;renderVentures();return}
      if(a==="vnew"){vForm="new";renderVentures();root.querySelector('[data-form=venture] [name=name]').focus();return}
      if(a==="vedit"){vForm="edit";renderVentures();return}
      if(a==="vcancel"){vForm=null;renderVentures();return}
      if(a==="vdel"){if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent=T("Delete venture and its entries?","Hapus usaha beserta catatannya?");return}
        const id=vSel,kids=items.filter(x=>(x.kind==="vtx"||x.kind==="vkpi")&&x.venture===id),kv=items.filter(x=>x.kind==="vkv"&&kids.some(k=>k.id===x.kpi));
        Promise.all(kids.concat(kv).map(x=>del(x.id))).then(()=>del(id)).then(()=>{vSel=null;vForm=null;renderVentures()});return}
      const arm=(fn)=>{if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent="?";setTimeout(()=>{if(b.isConnected){b.dataset.arm="";b.textContent="×"}},2500);return}fn()};
      if(a==="vtxdel")arm(()=>del(b.dataset.id).then(renderVentures));
      if(a==="vkpidel")arm(()=>{const kv=byKind("vkv").filter(x=>x.kpi===b.dataset.id);Promise.all(kv.map(x=>del(x.id))).then(()=>del(b.dataset.id)).then(renderVentures)});
    });
    root.addEventListener("submit",e=>{const f=e.target,k=f.dataset.form;if(!k)return;e.preventDefault();
      if(k==="venture"){const prev=vForm==="edit"?get(vSel):null,{id:_i,...base}=prev||{};put(prev?prev.id:null,Object.assign(base,{kind:"venture",name:f.name.value.trim(),emoji:f.emoji.value.trim(),status:f.status.value,partners:f.partners.value.trim(),desc:f.desc.value.trim()})).then(id=>{if(id)vSel=id;vForm=null;renderVentures()});return}
      if(k==="vtx"){const a=num(f.amount.value);if(!(a>0)){toast(T("Amount must be greater than 0.","Jumlah harus lebih dari 0."));return}put(null,{kind:"vtx",venture:vSel,dir:f.dir.value,amount:a,note:f.note.value.trim(),date:f.date.value||today()}).then(renderVentures);return}
      if(k==="vkpi"){const t=num(f.target.value);put(null,{kind:"vkpi",venture:vSel,name:f.name.value.trim(),unit:f.unit.value.trim(),target:isNaN(t)?0:t}).then(renderVentures);return}
      if(k==="vkv"){const v=num(f.value.value);if(isNaN(v))return;const kid=f.dataset.id,ex=byKind("vkv").find(x=>x.kpi===kid&&x.date===today());put(ex?ex.id:null,{kind:"vkv",kpi:kid,venture:vSel,date:today(),value:v}).then(renderVentures)}
    });
  }

  /* =====================================================================
     Ctrl+K: cari & perintah + tangkap cepat
     ===================================================================== */
  let pal=null,palSel=0,palRes=[];
  function navItems(){return [...document.querySelectorAll(".nav a[data-tab]")].map(a=>{const g=a.closest(".ngrp"),gn=g&&g.querySelector(".ng-btn .ni");return {tab:a.dataset.tab,name:(gn?gn.textContent.trim()+" › ":"")+a.querySelector(".ni").textContent.trim()}})}
  function searchAll(q){
    q=q.toLowerCase();const out=[];if(q.length<2)return out;
    const add=(type,tab,title,sub,id)=>{if(out.length<40)out.push({type,tab,title,sub,id})};
    const has=(...s)=>s.join(" ").toLowerCase().includes(q);
    items.forEach(i=>{switch(i.kind){
      case "task":if(has(i.title))add(T("Task","Tugas"),"tugas",i.title,i.done?T("done","selesai"):(i.due?fmtD(i.due):""));break;
      case "project":if(has(i.name,i.notes))add(T("Project","Proyek"),"proyek",i.name,(+i.progress||0)+"%");break;
      case "dream":if(has(i.title,i.why))add(T("Dream","Impian"),"dreams",i.title,i.year||"");break;
      case "note":if(has(i.title,i.body))add(T("Note","Catatan"),"notes",i.title||String(i.body||"").slice(0,60),String(i.body||"").slice(0,80),i.id);break;
      case "link":if(has(i.title,i.url))add("Link","overview",i.title,i.url);break;
      case "job":if(has(i.company,i.role,i.notes))add(T("Application","Lamaran"),"career",i.company,(i.role||"")+" · "+jst(i.status));break;
      case "venture":if(has(i.name,i.desc))add(T("Venture","Usaha"),"ventures",i.name,"",i.id);break;
      case "fin":if(i.type==="transaksi"&&has(i.name,i.note))add("Record","record",i.name||"—",(i.dir==="in"?"+":"−")+rp(i.amount).replace("−","")+" · "+fmtD(i.date));else if(i.type&&i.type!=="transaksi"&&i.type!=="transfer"&&has(i.name))add(i.type==="aset"?T("Asset","Aset"):T("Liability","Kewajiban"),i.type==="aset"?"aset":"hutang",i.name,rp(i.amount));break;
      case "sub":if(has(i.name,i.note))add("Lead time","masa-aktif",i.name,i.end?fmtD(i.end):"");break;
      case "file":if(has(i.name))add(T("File","Berkas"),"files",i.name,"");break;
    }});
    return out;
  }
  function palCmds(q){
    const t=q.trim(),cmds=[];
    if(t){
      cmds.push({cmd:"task",title:T("Add task: ","Tambah tugas: ")+t,icon:"＋"});
      cmds.push({cmd:"note",title:T("New note: ","Catatan baru: ")+t,icon:"✎"});
      const m=/^(\d[\d.,]*)\s*(rb|k|jt|ribu|juta)?\s+(.+)$/i.exec(t)||/^(.+?)\s+(\d[\d.,]*)\s*(rb|k|jt|ribu|juta)?$/i.exec(t);
      if(m){let amt,desc;if(/^\d/.test(m[1])){amt=num(m[1]);desc=m[3];if(/^(rb|k|ribu)$/i.test(m[2]||""))amt*=1e3;if(/^(jt|juta)$/i.test(m[2]||""))amt*=1e6}else{desc=m[1];amt=num(m[2]);if(/^(rb|k|ribu)$/i.test(m[3]||""))amt*=1e3;if(/^(jt|juta)$/i.test(m[3]||""))amt*=1e6}
        if(amt>0)cmds.push({cmd:"exp",amt,desc,title:T("Record expense: ","Catat pengeluaran: ")+rp(amt)+" · "+desc,icon:"Rp"})}
      cmds.push({cmd:"job",title:T("New application: ","Lamaran baru: ")+t,icon:"💼"});
    }
    const ex=cmds.findIndex(c=>c.cmd==="exp");if(ex>0)cmds.unshift(cmds.splice(ex,1)[0]);
    return cmds;
  }
  function openPal(mode){
    if(!pal){pal=document.createElement("div");pal.className="lpal";pal.hidden=true;pal.setAttribute("role","dialog");pal.setAttribute("aria-modal","true");
      pal.innerHTML='<div class="lpal-in"><input class="lpal-q" type="text" autocomplete="off" spellcheck="false"><ul class="lpal-r" role="listbox"></ul><p class="lpal-f"></p></div>';document.body.appendChild(pal);
      const q=pal.querySelector(".lpal-q");
      q.addEventListener("input",()=>{palSel=0;palRender()});
      q.addEventListener("keydown",e=>{if(e.key==="ArrowDown"){e.preventDefault();palSel=Math.min(palRes.length-1,palSel+1);palHi()}else if(e.key==="ArrowUp"){e.preventDefault();palSel=Math.max(0,palSel-1);palHi()}else if(e.key==="Enter"){e.preventDefault();palRun(palRes[palSel])}else if(e.key==="Escape"){e.preventDefault();e.stopPropagation();closePal()}});
      pal.addEventListener("click",e=>{if(e.target===pal){closePal();return}const li=e.target.closest("[data-i]");if(li)palRun(palRes[+li.dataset.i])});
    }
    const q=pal.querySelector(".lpal-q");q.placeholder=mode==="capture"?T("Type anything: a task, a note, “25rb coffee”…","Ketik apa saja: tugas, catatan, “25rb kopi”…"):T("Search everything or type a command…","Cari apa saja atau ketik perintah…");
    pal.querySelector(".lpal-f").innerHTML=T("<b>↑↓</b> choose · <b>Enter</b> open · <b>Esc</b> close · type “50rb lunch” to record an expense","<b>↑↓</b> pilih · <b>Enter</b> buka · <b>Esc</b> tutup · ketik “50rb makan siang” untuk catat pengeluaran");
    pal.dataset.mode=mode||"";pal.hidden=false;document.documentElement.classList.add("lpal-open");q.value="";palSel=0;palRender();setTimeout(()=>q.focus(),0);
  }
  function closePal(){if(pal){pal.hidden=true;document.documentElement.classList.remove("lpal-open")}}
  function palRender(){
    const q=pal.querySelector(".lpal-q").value,ql=q.trim().toLowerCase(),cap=pal.dataset.mode==="capture";
    const nav=navItems().filter(n=>!ql||n.name.toLowerCase().includes(ql)).slice(0,ql?6:30).map(n=>({go:n.tab,title:n.name,icon:"→",type:T("Menu","Menu")}));
    const hits=searchAll(q).map(r=>({go:r.tab,title:r.title,sub:r.sub,type:r.type,icon:"•",id:r.id}));
    const cmds=palCmds(q).map(c=>Object.assign({type:T("Action","Aksi")},c));
    palRes=cap?cmds.concat(hits,nav):(ql?nav.slice(0,4).concat(hits,cmds,nav.slice(4)):nav);
    const ul=pal.querySelector(".lpal-r");
    ul.innerHTML=palRes.length?palRes.map((r,i)=>'<li role="option" data-i="'+i+'"'+(i===palSel?' aria-selected="true"':"")+'><span class="lpal-i">'+esc(r.icon)+'</span><span class="lpal-t">'+esc(r.title)+(r.sub?'<small>'+esc(r.sub)+'</small>':"")+'</span><span class="lpal-k">'+esc(r.type||"")+'</span></li>').join(""):'<li class="lpal-none">'+T("No results","Tidak ada hasil")+'</li>';
  }
  function palHi(){pal.querySelectorAll("[data-i]").forEach(li=>{const on=+li.dataset.i===palSel;li.toggleAttribute("aria-selected",on);if(on)li.scrollIntoView({block:"nearest"})})}
  async function palRun(r){
    if(!r)return;const q=pal.querySelector(".lpal-q").value.trim();closePal();
    if(r.go){location.hash=r.go;return}
    if(r.cmd==="task"){await put(null,{kind:"task",title:q.slice(0,200),rep:"",due:today(),prio:2,project:"",done:false,doneAt:null,log:[]});toast(T("Task added for today.","Tugas ditambahkan untuk hari ini."));return}
    if(r.cmd==="note"){await put(null,{kind:"note",title:q.slice(0,200),body:"",pinned:false,done:false,images:[],folder:""});toast(T("Note saved in Library › Notes.","Catatan tersimpan di Library › Notes."));return}
    if(r.cmd==="job"){await put(null,{kind:"job",company:q.slice(0,120),role:"",status:"wish",applied:"",follow:"",notes:""});location.hash="career";toast(T("Saved to Career › Wishlist.","Tersimpan di Career › Incaran."));return}
    if(r.cmd==="exp"){location.hash="record";setTimeout(()=>{const ty=$("rec-type"),tg=$("tg-rec");if(tg&&$("f-rec")&&$("f-rec").hidden)tg.click();if(ty){ty.value="out";ty.dispatchEvent(new Event("change",{bubbles:true}))}const a=$("rec-amt"),n=$("rec-name"),dt=$("rec-date");if(a){a.value=Math.round(r.amt).toLocaleString("id-ID");a.dispatchEvent(new Event("input",{bubbles:true}))}if(n){n.value=r.desc.slice(0,120);n.dispatchEvent(new Event("input",{bubbles:true}))}if(dt&&!dt.value)dt.value=today();toast(T("Choose the account and category, then save.","Pilih akun dan kategori, lalu simpan."));const c=$("rec-cat");if(c)c.focus()},250);return}
  }
  addEventListener("keydown",e=>{
    if((e.ctrlKey||e.metaKey)&&!e.altKey&&(e.key==="k"||e.key==="K")){if(document.querySelector("#tab-excel:not([hidden])")&&!e.shiftKey&&document.activeElement&&document.activeElement.closest&&document.activeElement.closest("#tab-excel"))return;e.preventDefault();e.stopPropagation();if(pal&&!pal.hidden)closePal();else openPal("");return}
    if(e.key==="Escape"&&pal&&!pal.hidden){e.preventDefault();e.stopImmediatePropagation();closePal()}
  },true);
  function addButtons(){
    const tb=document.querySelector(".topbar"),lb=$("launch-btn");if(tb&&lb&&!$("los-sbtn")){
      const s=document.createElement("button");s.type="button";s.id="los-sbtn";s.className="launch-btn los-sbtn";s.title=T("Search (Ctrl+K)","Cari (Ctrl+K)");s.setAttribute("aria-label",s.title);
      s.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>'+T("Search","Cari")+'</span><kbd>Ctrl K</kbd>';s.onclick=()=>openPal("");
      const c=document.createElement("button");c.type="button";c.id="los-cbtn";c.className="launch-btn los-cbtn";c.title=T("Quick capture","Tangkap cepat");c.setAttribute("aria-label",c.title);c.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';c.onclick=()=>openPal("capture");
      lb.parentNode.insertBefore(s,lb);lb.parentNode.insertBefore(c,lb);
    }
    if(!$("los-fab")){const f=document.createElement("button");f.type="button";f.id="los-fab";f.className="los-fab";f.setAttribute("aria-label",T("Quick capture","Tangkap cepat"));f.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';f.onclick=()=>openPal("capture");document.body.appendChild(f)}
  }
  function relabel(){const s=$("los-sbtn");if(s){s.title=T("Search (Ctrl+K)","Cari (Ctrl+K)");s.querySelector("span").textContent=T("Search","Cari")}const c=$("los-cbtn");if(c)c.title=T("Quick capture","Tangkap cepat")}

  /* ---------- notifikasi pengingat (perangkat ini, saat Imperium terbuka) ---------- */
  function notifyCheck(force){
    if(!ready||!("Notification" in window)||Notification.permission!=="granted")return;
    let sent={};try{sent=JSON.parse(localStorage.getItem("imp-los-notif")||"{}")||{}}catch(_){}
    const t0=today();Object.keys(sent).forEach(k=>{if(sent[k]<addD(t0,-14))delete sent[k]});
    const fresh=reminders().filter(r=>r.lv!=="info"||r.k[0]==="b").filter(r=>!sent[r.k]);if(!fresh.length)return;
    const body=fresh.slice(0,4).map(r=>"• "+r.txt).join("\n")+(fresh.length>4?"\n+"+(fresh.length-4):"");
    const show=reg=>{try{if(reg&&reg.showNotification)reg.showNotification("Imperium",{body,icon:"icon-192-v2.png",tag:"imp-los"});else new Notification("Imperium",{body,icon:"icon-192-v2.png"})}catch(_){}};
    if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration)navigator.serviceWorker.getRegistration().then(show).catch(()=>show(null));else show(null);
    fresh.forEach(r=>{sent[r.k]=t0});try{localStorage.setItem("imp-los-notif",JSON.stringify(sent))}catch(_){}
  }

  /* ---------- render & sambung ---------- */
  const R={insights:renderInsights,career:renderCareer,ventures:renderVentures};
  function renderVisible(){if(!ready)return;Object.keys(R).forEach(t=>{if(vis(t))try{R[t]()}catch(e){console.error("Life OS",t,e)}});badges()}
  function badges(){try{if(!vis("career"))renderCareerBadge()}catch(_){}}
  function renderCareerBadge(){const c=$("c-career");if(!c)return;const n=byKind("job").filter(j=>OPEN.includes(j.status)&&j.follow&&j.follow<=today()).length;c.textContent=String(n);c.classList.toggle("alert",n>0)}
  let rT=null;const soon=()=>{clearTimeout(rT);rT=setTimeout(renderVisible,60)};
  async function start(){
    [wireInsights,wireCareer,wireVentures].forEach(f=>f());addButtons();
    if(!window.claude||!window.claude.use)return;
    try{
      const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);if(!db||!user)return;
      const uid=await user.id();if(!uid)return;col=db.collection("data/users/"+uid);
      col.onSnapshot(s=>{
        const fresh=s.docs.map(d=>Object.assign({id:d.id},d.data()));
        items=fresh;ready=true;soon();setTimeout(notifyCheck,1500);
      });
    }catch(e){console.error("Life OS start",e)}
  }
  addEventListener("hashchange",()=>setTimeout(()=>{const t=cur();if(R[t]&&ready){const r=$("los-"+t);if(r)r.dataset.dirty="";try{R[t]()}catch(e){console.error(e)}}},0));
  addEventListener("imp-lang",()=>{relabel();Object.keys(R).forEach(t=>{const r=$("los-"+t);if(r)r.dataset.dirty=""});renderVisible()});
  setInterval(()=>{if(ready&&!document.hidden){badges();notifyCheck()}},30*60000);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&ready){soon();notifyCheck()}});
  window.IMP_LOS={open:openPal,reminders:()=>reminders()};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
