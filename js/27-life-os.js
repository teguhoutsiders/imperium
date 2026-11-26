/* ==== Imperium Life OS (Teguh 2026-11-26) ====
   Menu: Today, Weekly review, Goal map, Insights, Career, Ventures, People, Health, Journal
   + Ctrl+K (cari & perintah), tangkap cepat, pengingat.
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
  const dayId=d=>"day-"+d;
  const dayDoc=d=>get(dayId(d))||{kind:"daily",date:d};
  const dayTimers={};
  function patchDay(d,f,now){
    const cur=Object.assign({},dayDoc(d),f,{kind:"daily",date:d});
    const i=items.findIndex(x=>x.id===dayId(d));const loc=Object.assign({id:dayId(d)},cur);if(i>=0)items[i]=loc;else items.push(loc);
    clearTimeout(dayTimers[d]);
    const go=()=>{const {id,...body}=get(dayId(d))||cur;put(dayId(d),body)};
    if(now)go();else dayTimers[d]=setTimeout(go,700);
  }
  const cfg=()=>get("lifecfg")||{kind:"lifecfg",sleepT:7,exT:150,habitsOrder:[]};
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

  /* =====================================================================
     TODAY
     ===================================================================== */
  let todayDate=null;
  function habits(){const o=cfg().habitsOrder||[];return byKind("habit").filter(h=>!h.archived).sort((a,b)=>{const ia=o.indexOf(a.id),ib=o.indexOf(b.id);return (ia<0?999:ia)-(ib<0?999:ib)||(a.created||0)-(b.created||0)})}
  const habitDone=(h,d)=>!!((dayDoc(d).habits||{})[h.id]);
  const habitOn=(h,d)=>!h.days||!h.days.length||h.days.includes(dowOf(d));
  function habitStreak(h,d){let n=0,k=d;if(!habitDone(h,k))k=addD(k,-1);for(let i=0;i<400;i++){if(!habitOn(h,k)){k=addD(k,-1);continue}if(habitDone(h,k)){n++;k=addD(k,-1)}else break}return n}
  function reminders(){
    const t0=today(),r=[];
    byKind("task").forEach(t=>{if(isRoutine(t)||t.done||!t.due)return;const n=diffD(t.due,t0);if(n<=0)r.push({k:"t-"+t.id,lv:n<0?"crit":"warn",tab:"tugas",txt:(n<0?T("Overdue: ","Terlambat: "):T("Due today: ","Jatuh tempo hari ini: "))+t.title})});
    byKind("job").forEach(j=>{if(!j.follow||["rejected","accepted","withdrawn"].includes(j.status))return;const n=diffD(j.follow,t0);if(n<=0)r.push({k:"j-"+j.id+j.follow,lv:n<0?"crit":"warn",tab:"career",txt:T("Follow up ","Follow-up ")+(j.company||"")+(j.role?" · "+j.role:"")+(n<0?" ("+relD(j.follow)+")":"")})});
    byKind("person").forEach(p=>{
      if(p.birthday){const md=p.birthday.slice(5),nx=(md>=t0.slice(5)?t0.slice(0,4):String(+t0.slice(0,4)+1))+"-"+md,n=diffD(nx,t0);if(n<=3)r.push({k:"b-"+p.id+nx,lv:n===0?"warn":"info",tab:"people",txt:"🎂 "+p.name+" "+(n===0?T("has a birthday today","ulang tahun hari ini"):T("birthday "+relD(nx),"ulang tahun "+relD(nx)))})}
      if(p.every>0){const last=p.last||tsYmd(p.created),due=addD(last,p.every);if(diffD(due,t0)<=0)r.push({k:"p-"+p.id+due,lv:"info",tab:"people",txt:T("Get in touch with ","Hubungi ")+p.name+" ("+T("last ","terakhir ")+relD(last)+")"})}
    });
    byKind("sub").forEach(s=>{if(s.mode==="up"||!s.end)return;const n=diffD(s.end,t0);if(n>=0&&n<=7)r.push({k:"s-"+s.id+s.end,lv:n<=2?"warn":"info",tab:"masa-aktif",txt:(s.name||"")+" "+T("ends ","berakhir ")+relD(s.end)})});
    const ym=t0.slice(0,7);
    byKind("fin").forEach(f=>{if(f.type!=="liabilitas"||!(f.dueDay>0))return;const paid=items.some(x=>x.kind==="pay"&&x.liab===f.id&&(x.date||"").slice(0,7)===ym);if(paid)return;
      const last=new Date(+ym.slice(0,4),+ym.slice(5),0).getDate(),due=ym+"-"+pad(Math.min(f.dueDay,last)),n=diffD(due,t0);if(n<=3)r.push({k:"l-"+f.id+due,lv:n<0?"crit":"warn",tab:"hutang",txt:(/^(cicilan|installment)/i.test(f.name||"")?"":T("Installment ","Cicilan "))+(f.name||"")+" "+(n<0?T("overdue","lewat jatuh tempo"):relD(due))+(f.installment?" · "+rp(f.installment):"")})});
    const ord={crit:0,warn:1,info:2};return r.sort((a,b)=>ord[a.lv]-ord[b.lv]);
  }
  function renderToday(){
    const root=$("los-today");if(!root)return;const d=todayDate||today(),dd=dayDoc(d),isT=d===today();
    const top=(dd.top||[]).concat([{},{},{}]).slice(0,3);
    const tasks=byKind("task").filter(t=>isRoutine(t)?t.rep==="daily"||!doneNow(t):(!t.done&&t.due&&t.due<=d)).sort((a,b)=>(isRoutine(a)-isRoutine(b))||(a.prio||2)-(b.prio||2));
    const doneT=byKind("task").filter(t=>!isRoutine(t)&&t.done&&tsYmd(t.doneAt)===d);
    const hs=habits().filter(h=>habitOn(h,d)),hDone=hs.filter(h=>habitDone(h,d)).length;
    const rem=isT?reminders():[];
    const face=["😫","😕","😐","🙂","😄"];
    const scale=(key,lab)=>'<div class="los-scale" role="group" aria-label="'+esc(lab)+'"><span class="los-sl">'+esc(lab)+'</span>'+face.map((f,i)=>'<button type="button" class="los-face'+((dd[key]||0)===i+1?" on":"")+'" data-act="scale" data-k="'+key+'" data-v="'+(i+1)+'" aria-pressed="'+((dd[key]||0)===i+1)+'" title="'+(i+1)+'/5">'+f+'</button>').join("")+'</div>';
    let h='<div class="los-dbar"><button type="button" class="ghost" data-act="tday" data-v="-1" aria-label="'+T("Previous day","Hari sebelumnya")+'">‹</button><b>'+(isT?T("Today","Hari ini")+" · ":"")+esc(fmtD(d))+' · '+esc((ID()?DOW_ID:DOW_EN)[dowOf(d)])+'</b><button type="button" class="ghost" data-act="tday" data-v="1" aria-label="'+T("Next day","Hari berikutnya")+'"'+(isT?" disabled":"")+'>›</button>'+(isT?"":'<button type="button" class="soft" data-act="tday" data-v="0">'+T("Back to today","Kembali ke hari ini")+'</button>')+'</div>';
    h+='<div class="los-g3">';
    /* kolom 1 */
    let c1='<ol class="los-top">'+top.map((x,i)=>'<li><input type="checkbox" class="check" data-act="topdone" data-i="'+i+'"'+(x.done?" checked":"")+' aria-label="'+T("Done","Selesai")+'"><input class="los-in'+(x.done?" done":"")+'" data-act="top" data-i="'+i+'" maxlength="140" value="'+esc(x.t||"")+'" placeholder="'+esc(T(["The one thing that matters most","Second priority","Third priority"][i],["Satu hal paling penting","Prioritas kedua","Prioritas ketiga"][i]))+'"></li>').join("")+'</ol>';
    h+='<div class="los-col">'+card(T("Top 3 today","3 prioritas hari ini"),c1);
    let c2=tasks.length?'<ul class="list los-tl">'+tasks.slice(0,12).map(t=>{const dn=doneNow(t),od=!isRoutine(t)&&t.due<d;return '<li class="'+(dn?"done":"")+'"><input type="checkbox" class="check" data-done="'+esc(t.id)+'"'+(dn?" checked":"")+' aria-label="'+T("Mark as done","Tandai selesai")+'"><div class="grow"><div class="ttl">'+esc(t.title)+'</div><div class="meta">'+(isRoutine(t)?'<span>↻ '+esc({daily:T("Daily","Harian"),weekly:T("Weekly","Mingguan"),monthly:T("Monthly","Bulanan")}[t.rep])+'</span>':'<span class="'+(od?"neg":"")+'">'+esc(od?T("Overdue ","Terlambat ")+relD(t.due):T("Due today","Hari ini"))+'</span>')+(t.prio===1?'<span class="los-hi">'+T("High","Tinggi")+'</span>':"")+'</div></div></li>'}).join("")+'</ul>':empty(T("Nothing due. Add tasks or routines in Tasks.","Tidak ada yang jatuh tempo. Tambah tugas atau rutinitas di Tasks."));
    if(doneT.length)c2+='<p class="hint">✓ '+doneT.length+T(" task(s) finished today"," tugas selesai hari ini")+'</p>';
    h+=card(T("Due & routines","Jatuh tempo & rutinitas"),c2,{right:'<a class="los-lnk" href="#tugas">'+T("Tasks","Tasks")+' ›</a>'});
    h+='</div>';
    /* kolom 2: kebiasaan */
    let hb=hs.length?'<ul class="los-hab">'+hs.map(x=>{const dn=habitDone(x,d),st=habitStreak(x,d);let dots='';for(let i=6;i>=0;i--){const k=addD(d,-i);dots+='<i class="'+(habitOn(x,k)?(habitDone(x,k)?"y":"n"):"o")+'" title="'+esc(fmtD(k))+'"></i>'}
      return '<li class="'+(dn?"done":"")+'"><button type="button" class="los-hck" data-act="habit" data-id="'+esc(x.id)+'" aria-pressed="'+dn+'" aria-label="'+esc(x.name)+'">'+(dn?"✓":esc(x.icon||"○"))+'</button><div class="grow"><div class="ttl">'+esc(x.name)+'</div><div class="los-dots">'+dots+'</div></div><span class="los-streak" title="'+T("Streak","Beruntun")+'">'+(st?"🔥 "+st:"")+'</span><button type="button" class="ghost los-x" data-act="habitdel" data-id="'+esc(x.id)+'" aria-label="'+T("Remove habit","Hapus kebiasaan")+'">×</button></li>'}).join("")+'</ul>':empty(T("No habits yet. Add one below, e.g. read 10 pages.","Belum ada kebiasaan. Tambah di bawah, mis. baca 10 halaman."));
    hb+='<form class="los-row" data-form="habit"><input name="icon" class="los-ico" maxlength="2" placeholder="📖" aria-label="Icon"><input name="name" required maxlength="60" placeholder="'+T("New habit","Kebiasaan baru")+'"><select name="days" aria-label="'+T("Days","Hari")+'">'+opt("",T("Every day","Setiap hari"))+opt("0,1,2,3,4",T("Weekdays","Hari kerja"))+opt("5,6",T("Weekend","Akhir pekan"))+'</select><button class="primary">'+T("Add","Tambah")+'</button></form>';
    h+='<div class="los-col">'+card(T("Habits","Kebiasaan")+(hs.length?' <span class="los-pill">'+hDone+"/"+hs.length+'</span>':""),hb);
    h+=card(T("Check-in","Check-in"),scale("energy",T("Energy","Energi"))+scale("mood",T("Mood","Suasana hati"))+
      '<div class="los-g3s"><label>'+T("Sleep (hours)","Tidur (jam)")+'<input inputmode="decimal" data-act="num" data-k="sleep" value="'+esc(dd.sleep||"")+'" placeholder="0"></label><label>'+T("Exercise (min)","Olahraga (menit)")+'<input inputmode="numeric" data-act="num" data-k="ex" value="'+esc(dd.ex||"")+'" placeholder="0"></label><label>'+T("Weight (kg)","Berat (kg)")+'<input inputmode="decimal" data-act="num" data-k="wt" value="'+esc(dd.wt||"")+'" placeholder="—"></label></div>');
    if(isT)h+=card(T("Reminders","Pengingat"),(rem.length?'<ul class="los-rem">'+rem.slice(0,8).map(r=>'<li class="'+r.lv+'"><a href="#'+r.tab+'">'+esc(r.txt)+'</a></li>').join("")+'</ul>':empty(T("No reminders. All clear.","Tidak ada pengingat. Aman.")))+notifBtn());
    h+='</div>';
    /* kolom 3: jurnal */
    h+='<div class="los-col">'+card(T("Journal","Jurnal"),'<label>'+T("Grateful for","Bersyukur untuk")+'<input data-act="txt" data-k="grat" maxlength="200" value="'+esc(dd.grat||"")+'" placeholder="'+T("One good thing today","Satu hal baik hari ini")+'"></label><label>'+T("Notes of the day","Catatan hari ini")+'<textarea data-act="txt" data-k="journal" rows="9" maxlength="8000" placeholder="'+T("What happened, what you learned, what is on your mind…","Apa yang terjadi, apa yang dipelajari, apa yang dipikirkan…")+'">'+esc(dd.journal||"")+'</textarea></label><label>'+T("Win of the day","Kemenangan hari ini")+'<input data-act="txt" data-k="win" maxlength="200" value="'+esc(dd.win||"")+'" placeholder="'+T("Something you are proud of","Sesuatu yang membuat bangga")+'"></label><p class="hint">'+T("Saved automatically.","Tersimpan otomatis.")+'</p>',{right:'<a class="los-lnk" href="#journal">'+T("All entries","Semua jurnal")+' ›</a>'})+'</div>';
    h+='</div>';
    keepFocus(root,h);
    const c=$("c-today");if(c){const n=top.filter(x=>x.t&&!x.done).length+tasks.filter(t=>!doneNow(t)).length;c.textContent=String(n);c.classList.toggle("alert",rem.some(r=>r.lv==="crit"))}
  }
  /* render ulang tanpa merusak ketikan yang sedang berjalan */
  function keepFocus(root,html){
    const a=document.activeElement;let key=null,sel=null;
    if(a&&root.contains(a)&&a.matches("input,textarea,select")){key=[a.dataset.act,a.dataset.k,a.dataset.i,a.name,a.dataset.f].join("|");try{sel=[a.selectionStart,a.selectionEnd]}catch(_){}}
    if(key&&a.matches("input[type=text],input:not([type]),textarea")&&root.dataset.dirty==="1")return; /* sedang mengetik: tunda */
    root.innerHTML=html;
    if(key){const n=[...root.querySelectorAll("input,textarea,select")].find(x=>[x.dataset.act,x.dataset.k,x.dataset.i,x.name,x.dataset.f].join("|")===key);if(n){n.focus({preventScroll:true});if(sel)try{n.setSelectionRange(sel[0],sel[1])}catch(_){}}}
  }
  function notifBtn(){
    if(!("Notification" in window))return "";
    if(Notification.permission==="granted")return '<p class="hint">🔔 '+T("Browser notifications are on for this device.","Notifikasi browser aktif di perangkat ini.")+'</p>';
    if(Notification.permission==="denied")return '<p class="hint">'+T("Notifications are blocked in this browser's site settings.","Notifikasi diblokir di pengaturan situs browser ini.")+'</p>';
    return '<button type="button" class="soft" data-act="notif">🔔 '+T("Turn on notifications","Aktifkan notifikasi")+'</button>';
  }
  function wireToday(){
    const root=$("los-today");if(!root||root.dataset.w)return;root.dataset.w=1;
    root.addEventListener("click",e=>{
      const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act,d=todayDate||today();
      if(a==="tday"){const v=+b.dataset.v;todayDate=v===0?null:addD(d,v);if(todayDate&&todayDate>=today())todayDate=null;renderToday();return}
      if(a==="scale"){const k=b.dataset.k,v=+b.dataset.v;patchDay(d,{[k]:(dayDoc(d)[k]===v?0:v)},true);renderToday();return}
      if(a==="habit"){const hs=Object.assign({},dayDoc(d).habits||{});if(hs[b.dataset.id])delete hs[b.dataset.id];else hs[b.dataset.id]=1;patchDay(d,{habits:hs},true);renderToday();return}
      if(a==="habitdel"){if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent=T("Remove?","Hapus?");setTimeout(()=>{if(b.isConnected){b.dataset.arm="";b.textContent="×"}},2500);return}
        const h=get(b.dataset.id);if(h){const {id,...rest}=h;put(h.id,Object.assign(rest,{archived:true})).then(renderToday)}return}
      if(a==="notif"){Notification.requestPermission().then(()=>{renderToday();notifyCheck(true)});return}
    });
    root.addEventListener("change",e=>{const x=e.target;if(x.dataset.act==="topdone"){const d=todayDate||today(),top=((dayDoc(d).top||[]).concat([{},{},{}])).slice(0,3).map(o=>Object.assign({},o));top[+x.dataset.i].done=x.checked;patchDay(d,{top},true);renderToday()}});
    root.addEventListener("input",e=>{
      const x=e.target,a=x.dataset.act,d=todayDate||today();if(!a)return;root.dataset.dirty="1";clearTimeout(root._dt);root._dt=setTimeout(()=>{root.dataset.dirty=""},1200);
      if(a==="top"){const top=((dayDoc(d).top||[]).concat([{},{},{}])).slice(0,3).map(o=>Object.assign({},o));top[+x.dataset.i].t=x.value;patchDay(d,{top})}
      else if(a==="txt")patchDay(d,{[x.dataset.k]:x.value});
      else if(a==="num"){const v=num(x.value);patchDay(d,{[x.dataset.k]:isNaN(v)?"":v})}
    });
    root.addEventListener("submit",e=>{const f=e.target;if(f.dataset.form!=="habit")return;e.preventDefault();const name=f.name.value.trim();if(!name)return;
      const days=f.days.value?f.days.value.split(",").map(Number):[];put(null,{kind:"habit",name,icon:f.icon.value.trim(),days}).then(()=>{renderToday();const n=$("los-today").querySelector('[data-form="habit"] [name=name]');if(n)n.focus()})});
  }

  /* =====================================================================
     WEEKLY REVIEW
     ===================================================================== */
  let wkStart=null;
  function weekStats(ws){
    const we=addD(ws,6),inW=s=>s&&s>=ws&&s<=we;
    const tasksDone=byKind("task").filter(t=>!isRoutine(t)&&t.done&&inW(tsYmd(t.doneAt))).length;
    let rDone=0,rDue=0;byKind("task").filter(isRoutine).forEach(t=>{const log=new Set(t.log||[]);if(t.rep==="daily"){for(let i=0;i<7;i++){const k=addD(ws,i);if(k>today())break;rDue++;if(log.has(k))rDone++}}else if(t.rep==="weekly"){rDue++;if(log.has(ws))rDone++}});
    let money={in:0,out:0};byKind("fin").forEach(f=>{if(f.type==="transaksi"&&inW(f.date))money[f.dir==="in"?"in":"out"]+=+f.amount||0});
    const focus=byKind("sw").filter(s=>inW(s.date)).reduce((a,s)=>a+(+s.ms||0),0);
    const days=[];for(let i=0;i<7;i++)days.push(dayDoc(addD(ws,i)));
    const hs=habits();let hOn=0,hOk=0;days.forEach(dd=>{hs.forEach(h=>{if(dd.date>today()||!habitOn(h,dd.date))return;hOn++;if((dd.habits||{})[h.id])hOk++})});
    const avg=k=>{const v=days.map(x=>+x[k]).filter(x=>x>0);return v.length?v.reduce((a,b)=>a+b,0)/v.length:0};
    const journ=days.filter(x=>(x.journal||"").trim()||(x.grat||"").trim()).length;
    const jobs=byKind("job").filter(j=>inW(j.applied)).length;
    const ex=days.reduce((a,x)=>a+(+x.ex||0),0);
    return {tasksDone,rDone,rDue,money,focus,hPct:hOn?Math.round(hOk/hOn*100):null,energy:avg("energy"),mood:avg("mood"),sleep:avg("sleep"),journ,jobs,ex,wins:days.map(x=>x.win).filter(Boolean)};
  }
  const hm=ms=>{const m=Math.round(ms/6e4);return m>=60?Math.floor(m/60)+T("h ","j ")+(m%60)+"m":m+"m"};
  function renderWeekly(){
    const root=$("los-weekly");if(!root)return;const ws=wkStart||monday(today()),we=addD(ws,6),id="week-"+ws,doc=get(id)||{},s=weekStats(ws),cur=ws===monday(today());
    let h='<div class="los-dbar"><button type="button" class="ghost" data-act="wk" data-v="-7">‹</button><b>'+esc(fmtD(ws))+" – "+esc(fmtD(we))+(cur?" · "+T("this week","minggu ini"):"")+'</b><button type="button" class="ghost" data-act="wk" data-v="7"'+(cur?" disabled":"")+'>›</button>'+(cur?"":'<button type="button" class="soft" data-act="wk" data-v="0">'+T("This week","Minggu ini")+'</button>')+'</div>';
    h+='<div class="los-stats">'+stat(T("Tasks done","Tugas selesai"),s.tasksDone)+stat(T("Routines","Rutinitas"),s.rDue?s.rDone+"/"+s.rDue:"—")+stat(T("Habits","Kebiasaan"),s.hPct==null?"—":s.hPct+"%")+stat(T("Focus time","Waktu fokus"),s.focus?hm(s.focus):"—",T("Stopwatch sessions","Sesi stopwatch"))+stat(T("Money in","Uang masuk"),rp(s.money.in),"","mny-pos")+stat(T("Money out","Uang keluar"),rp(s.money.out),"","mny-neg")+stat(T("Avg sleep","Rata-rata tidur"),s.sleep?s.sleep.toFixed(1)+T(" h"," jam"):"—")+stat(T("Exercise","Olahraga"),s.ex?s.ex+T(" min"," menit"):"—")+stat(T("Energy · mood","Energi · mood"),(s.energy?s.energy.toFixed(1):"—")+" · "+(s.mood?s.mood.toFixed(1):"—"),"/5")+stat(T("Journal days","Hari menulis jurnal"),s.journ+"/7")+stat(T("Applications sent","Lamaran terkirim"),s.jobs)+'</div>';
    const f=(k,lab,ph,rows)=>'<label>'+esc(lab)+'<textarea data-f="'+k+'" rows="'+(rows||3)+'" maxlength="3000" placeholder="'+esc(ph)+'">'+esc(doc[k]||"")+'</textarea></label>';
    const focus=(doc.focus||[]).concat(["","",""]).slice(0,3);
    h+='<div class="los-g2">'+card(T("Reflection","Refleksi"),f("wins",T("What went well","Yang berjalan baik"),s.wins.length?s.wins.join(" · "):T("Wins, progress, good moments","Kemenangan, kemajuan, momen baik"))+f("bad",T("What didn't go well","Yang kurang berjalan"),T("Be honest, no blame","Jujur, tanpa menyalahkan"))+f("learn",T("Lessons","Pelajaran"),T("What will you do differently?","Apa yang akan dilakukan berbeda?"))+'<p class="hint">'+T("Saved automatically.","Tersimpan otomatis.")+'</p>')+
      card(T("Focus for next week","Fokus minggu depan"),'<ol class="los-top">'+focus.map((x,i)=>'<li><span class="los-num">'+(i+1)+'</span><input class="los-in" data-f="focus" data-i="'+i+'" maxlength="140" value="'+esc(x)+'" placeholder="'+esc(T("Outcome to reach","Hasil yang ingin dicapai"))+'"></li>').join("")+'</ol>'+f("note",T("Other notes","Catatan lain"),"",3)+'<label>'+T("Rate this week","Nilai minggu ini")+'<select data-f="score">'+opt("","—")+[1,2,3,4,5,6,7,8,9,10].map(n=>opt(n,n+"/10",+doc.score===n)).join("")+'</select></label>')+'</div>';
    const past=byKind("weekly").filter(w=>w.week!==ws).sort((a,b)=>b.week.localeCompare(a.week)).slice(0,12);
    if(past.length)h+=card(T("Past reviews","Tinjauan sebelumnya"),'<ul class="list los-past">'+past.map(w=>'<li><button type="button" class="ghost los-pb" data-act="wkgo" data-v="'+esc(w.week)+'"><b>'+esc(fmtD(w.week))+'</b><span>'+esc((w.focus||[]).filter(Boolean).join(" · ")||(w.wins||"").slice(0,90)||"—")+'</span>'+(w.score?'<em>'+w.score+'/10</em>':"")+'</button></li>').join("")+'</ul>');
    keepFocus(root,h);
  }
  function wireWeekly(){
    const root=$("los-weekly");if(!root||root.dataset.w)return;root.dataset.w=1;
    root.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;
      if(b.dataset.act==="wk"){const v=+b.dataset.v,ws=wkStart||monday(today());wkStart=v===0?null:addD(ws,v);if(wkStart&&wkStart>=monday(today()))wkStart=null;renderWeekly()}
      if(b.dataset.act==="wkgo"){wkStart=b.dataset.v;renderWeekly();root.scrollIntoView({block:"start"})}});
    let t=null;
    const save=()=>{const ws=wkStart||monday(today()),id="week-"+ws,doc=Object.assign({kind:"weekly",week:ws},get(id)||{});delete doc.id;
      root.querySelectorAll("[data-f]").forEach(x=>{if(x.dataset.f==="focus"){doc.focus=doc.focus&&doc.focus.slice?doc.focus.slice(0,3):["","",""];doc.focus[+x.dataset.i]=x.value}else doc[x.dataset.f]=x.dataset.f==="score"?(+x.value||0):x.value});put(id,doc)};
    root.addEventListener("input",e=>{if(!e.target.dataset.f)return;root.dataset.dirty="1";clearTimeout(t);t=setTimeout(()=>{root.dataset.dirty="";save()},700)});
    root.addEventListener("change",e=>{if(e.target.tagName==="SELECT"&&e.target.dataset.f)save()});
  }

  /* =====================================================================
     GOAL MAP: Dream → Project → Task
     ===================================================================== */
  const links=()=>get("goallinks")||{kind:"glink",proj:{}};
  function renderGoalmap(){
    const root=$("los-goalmap");if(!root)return;
    const L=links().proj||{},ds=byKind("dream").sort((a,b)=>(a.status==="done")-(b.status==="done")||(a.created||0)-(b.created||0)),ps=byKind("project");
    const tasksOf=pid=>byKind("task").filter(t=>t.project===pid&&!isRoutine(t));
    const pRow=p=>{const ts=tasksOf(p.id),dn=ts.filter(t=>t.done).length,nx=ts.filter(t=>!t.done).sort((a,b)=>(a.due||"9").localeCompare(b.due||"9"))[0];
      return '<li class="los-proj"><div class="grow"><div class="ttl"><a href="#proyek">'+esc(p.name||T("Untitled","Tanpa judul"))+'</a> <span class="los-st">'+esc(p.status||"")+'</span></div>'+bar(+p.progress||0)+'<div class="meta"><span>'+(+p.progress||0)+'%</span><span>'+(ts.length?dn+"/"+ts.length+" "+T("tasks","tugas"):T("no tasks","belum ada tugas"))+'</span>'+(nx?'<span>'+T("Next: ","Berikutnya: ")+esc(nx.title)+(nx.due?" · "+esc(fmtD(nx.due)):"")+'</span>':"")+(p.due?'<span>'+T("Target ","Target ")+esc(fmtD(p.due))+'</span>':"")+'</div></div><select class="los-ln" data-act="link" data-id="'+esc(p.id)+'" aria-label="'+T("Linked dream","Impian terkait")+'">'+opt("",T("— No dream —","— Tanpa impian —"))+ds.map(d=>opt(d.id,d.title,L[p.id]===d.id)).join("")+'</select></li>'};
    let h='<p class="hint">'+T("Link each project to the dream it serves. Tasks link to projects in Tasks (field Project). Dream progress = average of its projects.","Hubungkan tiap proyek ke impian yang didukungnya. Tugas terhubung ke proyek lewat kolom Project di Tasks. Progres impian = rata-rata progres proyeknya.")+'</p>';
    if(!ds.length&&!ps.length)h+=empty(T("Add dreams in Goals › Dreams and projects in Goals › Projects, then link them here.","Tambah impian di Goals › Dreams dan proyek di Goals › Projects, lalu hubungkan di sini."));
    h+='<div class="los-gm">';
    ds.forEach(d=>{const mine=ps.filter(p=>L[p.id]===d.id),pr=mine.length?Math.round(mine.reduce((a,p)=>a+(+p.progress||0),0)/mine.length):null;
      h+=card('<a href="#dreams">'+esc(d.title||"")+'</a>'+(d.status==="done"?' <span class="los-pill ok">'+T("Achieved","Tercapai")+'</span>':""),
        '<div class="los-gmh">'+(pr==null?'<span class="hint">'+T("No projects linked yet.","Belum ada proyek terhubung.")+'</span>':bar(pr,"big")+'<b>'+pr+'%</b>')+(d.year?'<span class="los-st">'+T("Target ","Target ")+d.year+'</span>':"")+'</div>'+(d.why?'<p class="hint">'+esc(d.why)+'</p>':"")+(mine.length?'<ul class="list">'+mine.map(pRow).join("")+'</ul>':""));
    });
    const free=ps.filter(p=>!L[p.id]||!ds.some(d=>d.id===L[p.id]));
    if(free.length)h+=card(T("Projects without a dream","Proyek tanpa impian"),'<ul class="list">'+free.map(pRow).join("")+'</ul>');
    h+='</div>';root.innerHTML=h;
  }
  function wireGoalmap(){const root=$("los-goalmap");if(!root||root.dataset.w)return;root.dataset.w=1;
    root.addEventListener("change",e=>{const s=e.target;if(s.dataset.act!=="link")return;const l=links(),proj=Object.assign({},l.proj||{});if(s.value)proj[s.dataset.id]=s.value;else delete proj[s.dataset.id];put("goallinks",{kind:"glink",proj}).then(renderGoalmap)})}

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
    const hsW=weeks.map(w=>{const s=weekStats(w);return s.hPct});
    h+=card(T("Habit completion per week (%)","Kebiasaan tercapai per minggu (%)"),hsW.some(v=>v!=null)?lineChart(wLab,hsW,v=>Math.round(v)+"%",{min0:true,label:"Habits",max100:true}):empty(T("Track habits in Today to see this chart.","Catat kebiasaan di Today untuk melihat grafik ini.")));
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
     PEOPLE
     ===================================================================== */
  let pEdit=null,pForm=false,pQ="",pGrp="";
  const PG=[["family","Family","Keluarga"],["friend","Friend","Teman"],["work","Work","Kerja"],["business","Business","Bisnis"],["recruiter","Recruiter / HR","Recruiter / HR"],["other","Other","Lainnya"]];
  const pg=k=>{const x=PG.find(g=>g[0]===k)||PG[5];return T(x[1],x[2])};
  function waLink(ph){let d=String(ph||"").replace(/\D/g,"");if(!d)return "";if(d[0]==="0")d="62"+d.slice(1);return "https://wa.me/"+d}
  function renderPeople(){
    const root=$("los-people");if(!root)return;const t0=today();
    let ps=byKind("person");const q=pQ.toLowerCase();
    if(q)ps=ps.filter(p=>[p.name,p.org,p.notes,p.phone,p.email].join(" ").toLowerCase().includes(q));if(pGrp)ps=ps.filter(p=>(p.grp||"other")===pGrp);
    const dueOf=p=>p.every>0?addD(p.last||tsYmd(p.created),p.every):null;
    ps.sort((a,b)=>{const da=dueOf(a),db=dueOf(b);return (da&&da<=t0?0:1)-(db&&db<=t0?0:1)||(a.name||"").localeCompare(b.name||"")});
    let h='<div class="los-bar2"><button type="button" class="soft" data-act="pnew">+ '+T("New person","Orang baru")+'</button><input type="search" data-act="pq" value="'+esc(pQ)+'" placeholder="'+T("Search people","Cari orang")+'" aria-label="'+T("Search people","Cari orang")+'"><select data-act="pg" aria-label="'+T("Group","Grup")+'">'+opt("",T("All groups","Semua grup"))+PG.map(g=>opt(g[0],T(g[1],g[2]),pGrp===g[0])).join("")+'</select></div>';
    if(pForm){const p=pEdit?get(pEdit):{};const f=(n,lab,at,val)=>'<label>'+esc(lab)+'<input name="'+n+'" '+(at||"")+' value="'+esc(val!=null?val:(p[n]||""))+'"></label>';
      h+='<form class="entry los-form" data-form="person" autocomplete="off"><p class="formtitle">'+(pEdit?T("Edit person","Ubah data"):T("New person","Orang baru"))+'</p>'+f("name",T("Name","Nama"),'required maxlength="100"')+'<label>'+T("Group","Grup")+'<select name="grp">'+PG.map(g=>opt(g[0],T(g[1],g[2]),(p.grp||"friend")===g[0])).join("")+'</select></label>'+f("org",T("Company / role","Perusahaan / peran"),'maxlength="120"')+f("phone",T("Phone / WhatsApp","HP / WhatsApp"),'inputmode="tel" maxlength="30"')+f("email","Email",'type="email" maxlength="120"')+f("birthday",T("Birthday","Ulang tahun"),'type="date"')+f("last",T("Last contact","Kontak terakhir"),'type="date"',p.last||(pEdit?"":today()))+'<label>'+T("Keep in touch every","Hubungi setiap")+'<select name="every">'+[[0,T("No reminder","Tanpa pengingat")],[7,T("Week","Minggu")],[14,T("2 weeks","2 minggu")],[30,T("Month","Bulan")],[90,T("3 months","3 bulan")],[180,T("6 months","6 bulan")]].map(o=>opt(o[0],o[1],(+p.every||0)===o[0])).join("")+'</select></label><label class="wide">'+T("Notes","Catatan")+'<textarea name="notes" rows="3" maxlength="4000">'+esc(p.notes||"")+'</textarea></label><div class="actions">'+(pEdit?'<button type="button" class="ghost danger" data-act="pdel">'+T("Delete","Hapus")+'</button>':"")+'<button type="button" class="ghost" data-act="pcancel">'+T("Cancel","Batal")+'</button><button class="primary">'+T("Save","Simpan")+'</button></div></form>'}
    h+=ps.length?'<div class="los-pgrid">'+ps.map(p=>{const due=dueOf(p),od=due&&due<=t0,wa=waLink(p.phone);let bd="";if(p.birthday){const md=p.birthday.slice(5),nx=(md>=t0.slice(5)?t0.slice(0,4):String(+t0.slice(0,4)+1))+"-"+md;bd=diffD(nx,t0)<=30?"🎂 "+relD(nx):"🎂 "+fmtD(p.birthday.slice(0,4)==="0000"?"2000"+p.birthday.slice(4):p.birthday).replace(/ \d{4}$/,"")}
      return '<div class="setcard los-person'+(od?" due":"")+'"><div class="los-ph"><span class="los-av">'+esc((p.name||"?").trim().split(/\s+/).map(w=>w[0]).slice(0,2).join("").toUpperCase())+'</span><div class="grow"><b>'+esc(p.name)+'</b><small>'+esc(pg(p.grp))+(p.org?" · "+esc(p.org):"")+'</small></div><button type="button" class="ghost" data-act="pedit" data-id="'+esc(p.id)+'">'+T("Edit","Ubah")+'</button></div><div class="meta">'+(p.last?'<span>'+T("Last contact ","Kontak terakhir ")+esc(relD(p.last))+'</span>':"")+(od?'<span class="neg">'+T("Time to reach out","Waktunya menghubungi")+'</span>':"")+(bd?'<span>'+esc(bd)+'</span>':"")+'</div>'+(p.notes?'<p class="hint los-clamp">'+esc(p.notes)+'</p>':"")+'<div class="los-pa">'+(wa?'<a class="soft los-btn" href="'+esc(wa)+'" target="_blank" rel="noopener">WhatsApp</a>':"")+(p.email?'<a class="soft los-btn" href="mailto:'+esc(p.email)+'">Email</a>':"")+'<button type="button" class="soft" data-act="ptouch" data-id="'+esc(p.id)+'">✓ '+T("Contacted today","Sudah kontak hari ini")+'</button></div></div>'}).join("")+'</div>':empty(q||pGrp?T("No one matches.","Tidak ada yang cocok."):T("No people yet. Add family, mentors, recruiters and business contacts you want to keep close.","Belum ada data. Tambah keluarga, mentor, recruiter, dan relasi bisnis yang ingin tetap dekat."));
    keepFocus(root,h);const c=$("c-people");if(c){const n=byKind("person").filter(p=>{const d=dueOf(p);return d&&d<=t0}).length;c.textContent=String(n)}
  }
  function wirePeople(){const root=$("los-people");if(!root||root.dataset.w)return;root.dataset.w=1;
    root.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
      if(a==="pnew"){pEdit=null;pForm=true;renderPeople();root.querySelector('[data-form=person] [name=name]').focus();return}
      if(a==="pedit"){pEdit=b.dataset.id;pForm=true;renderPeople();root.querySelector(".los-form").scrollIntoView({block:"nearest"});return}
      if(a==="pcancel"){pForm=false;pEdit=null;renderPeople();return}
      if(a==="pdel"){if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent=T("Delete for good?","Yakin hapus?");return}del(pEdit).then(()=>{pForm=false;pEdit=null;renderPeople()});return}
      if(a==="ptouch"){const p=get(b.dataset.id);if(!p)return;const {id,...r}=p;put(p.id,Object.assign(r,{last:today()})).then(()=>{toast(T("Saved: contacted today.","Tersimpan: sudah kontak hari ini."));renderPeople()})}
    });
    root.addEventListener("input",e=>{if(e.target.dataset.act==="pq"){pQ=e.target.value;renderPeople()}});
    root.addEventListener("change",e=>{if(e.target.dataset.act==="pg"){pGrp=e.target.value;renderPeople()}});
    root.addEventListener("submit",e=>{const f=e.target;if(f.dataset.form!=="person")return;e.preventDefault();const prev=pEdit?get(pEdit):null,{id:_i,...base}=prev||{};
      put(pEdit,Object.assign(base,{kind:"person",name:f.name.value.trim(),grp:f.grp.value,org:f.org.value.trim(),phone:f.phone.value.trim(),email:f.email.value.trim(),birthday:f.birthday.value,last:f.last.value,every:+f.every.value||0,notes:f.notes.value.trim()})).then(()=>{pForm=false;pEdit=null;renderPeople()})});
  }

  /* =====================================================================
     HEALTH
     ===================================================================== */
  let hRange=30;
  function renderHealth(){
    const root=$("los-health");if(!root)return;const t0=today(),c=cfg(),dd=dayDoc(t0);
    const days=[];for(let i=hRange-1;i>=0;i--)days.push(addD(t0,-i));
    const lab=days.map(d=>fmtD(d).replace(/ \d{4}$/,""));
    const val=k=>days.map(d=>{const v=+dayDoc(d)[k];return v>0?v:null});
    const sl=val("sleep"),wt=val("wt"),en=val("energy");
    const avg=a=>{const v=a.filter(x=>x!=null);return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};
    const weeks=[];{const w0=monday(t0);for(let i=7;i>=0;i--)weeks.push(addD(w0,-7*i))}
    const exW=weeks.map(w=>{let s=0;for(let i=0;i<7;i++)s+=+dayDoc(addD(w,i)).ex||0;return s});
    const wv=wt.filter(x=>x!=null),wDelta=wv.length>1?wv[wv.length-1]-wv[0]:null;
    let h='<div class="los-stats">'+stat(T("Avg sleep","Rata-rata tidur"),avg(sl)!=null?avg(sl).toFixed(1)+T(" h"," jam"):"—",T("target ","target ")+c.sleepT+T(" h"," jam"),avg(sl)!=null&&avg(sl)<c.sleepT?"mny-neg":"")+stat(T("Exercise this week","Olahraga minggu ini"),exW[exW.length-1]+T(" min"," menit"),T("target ","target ")+c.exT+T(" min"," menit"),exW[exW.length-1]>=c.exT?"mny-pos":"")+stat(T("Latest weight","Berat terakhir"),wv.length?fmtNum(wv[wv.length-1])+" kg":"—",wDelta!=null?(wDelta>0?"+":"")+wDelta.toFixed(1)+" kg "+T("in "+hRange+" days","dalam "+hRange+" hari"):"")+stat(T("Avg energy","Rata-rata energi"),avg(en)!=null?avg(en).toFixed(1)+"/5":"—")+'</div>';
    h+='<div class="los-bar2"><div class="filters" role="group">'+[14,30,90].map(n=>'<button type="button" class="chip" data-act="hr" data-v="'+n+'" aria-pressed="'+(hRange===n)+'">'+n+T(" days"," hari")+'</button>').join("")+'</div><span class="hint">'+T("Log sleep, exercise and weight in Today › Check-in.","Catat tidur, olahraga, dan berat di Today › Check-in.")+'</span></div>';
    h+='<div class="los-g2">'+card(T("Today","Hari ini"),'<div class="los-g3s"><label>'+T("Sleep (hours)","Tidur (jam)")+'<input inputmode="decimal" data-k="sleep" value="'+esc(dd.sleep||"")+'"></label><label>'+T("Exercise (min)","Olahraga (menit)")+'<input inputmode="numeric" data-k="ex" value="'+esc(dd.ex||"")+'"></label><label>'+T("Weight (kg)","Berat (kg)")+'<input inputmode="decimal" data-k="wt" value="'+esc(dd.wt||"")+'"></label></div><div class="los-g3s"><label>'+T("Sleep target (h)","Target tidur (jam)")+'<input inputmode="decimal" data-cfg="sleepT" value="'+esc(c.sleepT)+'"></label><label>'+T("Exercise target / week (min)","Target olahraga / minggu (menit)")+'<input inputmode="numeric" data-cfg="exT" value="'+esc(c.exT)+'"></label></div>')+
      card(T("Sleep (hours)","Tidur (jam)"),lineChart(lab,sl,v=>(+v).toFixed(1),{target:c.sleepT,min0:true,label:"Sleep"}))+
      card(T("Exercise per week (minutes)","Olahraga per minggu (menit)"),exW.some(Boolean)?barChart(weeks.map(w=>fmtD(w).replace(/ \d{4}$/,"")),[{name:T("Minutes","Menit"),cls:"s2",values:exW}],v=>Math.round(v),{label:"Exercise",int:true}):empty(T("No exercise logged yet.","Belum ada olahraga tercatat.")))+
      card(T("Weight (kg)","Berat (kg)"),lineChart(lab,wt,v=>(+v).toFixed(1),{label:"Weight"}))+'</div>';
    keepFocus(root,h);
  }
  function wireHealth(){const root=$("los-health");if(!root||root.dataset.w)return;root.dataset.w=1;
    root.addEventListener("click",e=>{const b=e.target.closest('[data-act="hr"]');if(b){hRange=+b.dataset.v;renderHealth()}});
    let t=null;root.addEventListener("input",e=>{const x=e.target;root.dataset.dirty="1";clearTimeout(t);
      if(x.dataset.k){const v=num(x.value);patchDay(today(),{[x.dataset.k]:isNaN(v)?"":v})}
      if(x.dataset.cfg){const v=num(x.value);if(v>0){const c=Object.assign({},cfg());delete c.id;c[x.dataset.cfg]=v;clearTimeout(root._c);root._c=setTimeout(()=>put("lifecfg",Object.assign(c,{kind:"lifecfg"})),700)}}
      t=setTimeout(()=>{root.dataset.dirty="";renderHealth()},1500)});
  }

  /* =====================================================================
     JOURNAL
     ===================================================================== */
  let jQ="",jEdit=null;
  function renderJournal(){
    const root=$("los-journal");if(!root)return;const q=jQ.toLowerCase();
    let ds=byKind("daily").filter(d=>(d.journal||"").trim()||(d.grat||"").trim()||(d.win||"").trim());
    if(q)ds=ds.filter(d=>[d.journal,d.grat,d.win].join(" ").toLowerCase().includes(q));
    ds.sort((a,b)=>b.date.localeCompare(a.date));
    const face=["","😫","😕","😐","🙂","😄"];
    let h='<div class="los-bar2"><input type="search" data-act="jq" value="'+esc(jQ)+'" placeholder="'+T("Search journal","Cari jurnal")+'" aria-label="'+T("Search journal","Cari jurnal")+'"><a class="soft los-btn" href="#today">✎ '+T("Write today","Tulis hari ini")+'</a><span class="hint">'+ds.length+T(" entries"," catatan")+'</span></div>';
    h+=ds.length?'<div class="los-jl">'+ds.slice(0,120).map(d=>'<article class="setcard los-je"><header><b>'+esc(fmtD(d.date))+'</b> <span class="hint">'+esc((ID()?DOW_ID:DOW_EN)[dowOf(d.date)])+'</span>'+(d.mood?' <span title="Mood">'+face[d.mood]+'</span>':"")+(d.energy?' <span class="los-st">⚡'+d.energy+'</span>':"")+'<button type="button" class="ghost" data-act="jedit" data-v="'+esc(d.date)+'">'+(jEdit===d.date?T("Done","Selesai"):T("Edit","Ubah"))+'</button></header>'+
      (jEdit===d.date?'<textarea data-jk="journal" data-d="'+esc(d.date)+'" rows="8" maxlength="8000">'+esc(d.journal||"")+'</textarea>':(d.journal?'<p class="los-pre">'+hl(d.journal,q)+'</p>':""))+(d.grat?'<p class="hint">🙏 '+hl(d.grat,q)+'</p>':"")+(d.win?'<p class="hint">🏆 '+hl(d.win,q)+'</p>':"")+'</article>').join("")+'</div>':empty(q?T("Nothing matches.","Tidak ada yang cocok."):T("No journal entries yet. Write one in Today.","Belum ada jurnal. Tulis di Today."));
    keepFocus(root,h);
  }
  function hl(t,q){const e=esc(t);if(!q)return e;const i=e.toLowerCase().indexOf(esc(q).toLowerCase());if(i<0)return e;return e.slice(0,i)+"<mark>"+e.slice(i,i+esc(q).length)+"</mark>"+e.slice(i+esc(q).length)}
  function wireJournal(){const root=$("los-journal");if(!root||root.dataset.w)return;root.dataset.w=1;
    root.addEventListener("input",e=>{const x=e.target;if(x.dataset.act==="jq"){jQ=x.value;renderJournal();return}if(x.dataset.jk){root.dataset.dirty="1";patchDay(x.dataset.d,{journal:x.value});clearTimeout(root._t);root._t=setTimeout(()=>{root.dataset.dirty=""},1200)}});
    root.addEventListener("click",e=>{const b=e.target.closest('[data-act="jedit"]');if(!b)return;root.dataset.dirty="";jEdit=jEdit===b.dataset.v?null:b.dataset.v;renderJournal();if(jEdit){const t=root.querySelector("textarea[data-jk]");if(t)t.focus()}});
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
      case "person":if(has(i.name,i.org,i.notes,i.phone))add(T("Person","Orang"),"people",i.name,i.org||"");break;
      case "venture":if(has(i.name,i.desc))add(T("Venture","Usaha"),"ventures",i.name,"",i.id);break;
      case "fin":if(i.type==="transaksi"&&has(i.name,i.note))add("Record","record",i.name||"—",(i.dir==="in"?"+":"−")+rp(i.amount).replace("−","")+" · "+fmtD(i.date));else if(i.type&&i.type!=="transaksi"&&i.type!=="transfer"&&has(i.name))add(i.type==="aset"?T("Asset","Aset"):T("Liability","Kewajiban"),i.type==="aset"?"aset":"hutang",i.name,rp(i.amount));break;
      case "sub":if(has(i.name,i.note))add("Lead time","masa-aktif",i.name,i.end?fmtD(i.end):"");break;
      case "daily":if(has(i.journal,i.grat,i.win))add(T("Journal","Jurnal"),"journal",fmtD(i.date),String(i.journal||i.grat||i.win).slice(0,80));break;
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
      cmds.push({cmd:"journal",title:T("Add to today's journal: ","Tambah ke jurnal hari ini: ")+t,icon:"📓"});
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
    if(r.cmd==="journal"){const d=today(),dd=dayDoc(d),hh=new Date();patchDay(d,{journal:((dd.journal||"")+(dd.journal?"\n":"")+pad(hh.getHours())+":"+pad(hh.getMinutes())+" "+q).slice(0,8000)},true);toast(T("Added to today's journal.","Ditambahkan ke jurnal hari ini."));return}
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
  const R={today:renderToday,weekly:renderWeekly,goalmap:renderGoalmap,insights:renderInsights,career:renderCareer,ventures:renderVentures,people:renderPeople,health:renderHealth,journal:renderJournal};
  function renderVisible(){if(!ready)return;Object.keys(R).forEach(t=>{if(vis(t))try{R[t]()}catch(e){console.error("Life OS",t,e)}});badges()}
  function badges(){try{if(!vis("today"))renderTodayBadge();if(!vis("career"))renderCareerBadge();if(!vis("people"))renderPeopleBadge()}catch(_){}}
  function renderTodayBadge(){const c=$("c-today");if(!c)return;const d=today(),dd=dayDoc(d),top=(dd.top||[]).filter(x=>x.t&&!x.done).length,ts=byKind("task").filter(t=>isRoutine(t)?t.rep==="daily"&&!doneNow(t):(!t.done&&t.due&&t.due<=d)).length;c.textContent=String(top+ts);c.classList.toggle("alert",reminders().some(r=>r.lv==="crit"))}
  function renderCareerBadge(){const c=$("c-career");if(!c)return;const n=byKind("job").filter(j=>OPEN.includes(j.status)&&j.follow&&j.follow<=today()).length;c.textContent=String(n);c.classList.toggle("alert",n>0)}
  function renderPeopleBadge(){const c=$("c-people");if(!c)return;const t0=today();c.textContent=String(byKind("person").filter(p=>p.every>0&&addD(p.last||tsYmd(p.created),p.every)<=t0).length)}
  let rT=null;const soon=()=>{clearTimeout(rT);rT=setTimeout(renderVisible,60)};
  async function start(){
    [wireToday,wireWeekly,wireGoalmap,wireInsights,wireCareer,wireVentures,wirePeople,wireHealth,wireJournal].forEach(f=>f());addButtons();
    if(!window.claude||!window.claude.use)return;
    try{
      const [db,user]=await Promise.all([claude.use("db"),claude.use("user")]);if(!db||!user)return;
      const uid=await user.id();if(!uid)return;col=db.collection("data/users/"+uid);
      col.onSnapshot(s=>{
        const fresh=s.docs.map(d=>Object.assign({id:d.id},d.data()));
        /* hari yang sedang diketik: pertahankan versi lokal sampai tersimpan */
        Object.keys(dayTimers).forEach(d=>{const loc=items.find(x=>x.id===dayId(d));if(loc){const i=fresh.findIndex(x=>x.id===loc.id);if(i>=0)fresh[i]=loc;else fresh.push(loc)}});
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
