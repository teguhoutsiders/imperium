(function(){
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const rp=n=>"Rp "+Math.round(n||0).toLocaleString("id-ID");
  const ymd=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  const today=()=>ymd(new Date());
  const BLN=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const fmtDate=s=>{if(!s)return"";const [y,m,d]=s.split("-");return (+d)+" "+BLN[+m-1]+" "+y};
  const parseAmt=s=>{const t=String(s??"").replace(/[^\d,]/g,"").replace(",",".");return t?parseFloat(t):NaN};
  const dayNum=s=>{const [y,m,d]=s.split("-").map(Number);return Date.UTC(y,m-1,d)/864e5};
  const daysLeft=s=>Math.round(dayNum(s)-dayNum(today()));
  function addCycle(s,cycle){
    let [y,m,d]=s.split("-").map(Number);
    if(cycle==="year")y+=1;else{m+=1;if(m>12){m=1;y+=1}}
    const last=new Date(Date.UTC(y,m,0)).getUTCDate();
    return y+"-"+String(m).padStart(2,"0")+"-"+String(Math.min(d,last)).padStart(2,"0");
  }
  const smooth=()=>matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth";

  let col=null, items=[], ready=false, taskFilter="aktif";
  let assets=null, ent=null, entBusy=false, lbItem=null, lbAsset=null, linkBusy=false;
  const expanded=new Set();
  const editing={task:null,proj:null,sub:null,link:null,aset:null,debt:null,acct:null,rec:null,dream:null,note:null};
  let downloads=null;

  /* ---------- tabs ---------- */
  const TABS=["overview","english","ielts","tugas","calendar","proyek","dreams","files","notes","masa-aktif","akun","record","aset","hutang","budget","kategori","excel","tabel","pengaturan","info","today","weekly","goalmap","insights","career","ventures","people","health","journal"];
  const isMob=()=>matchMedia("(max-width:760px)").matches;
  const GROUPS={train:["english","ielts"],plan:["tugas","masa-aktif","calendar","weekly"],goals:["proyek","dreams","goalmap"],money:["akun","record","aset","hutang","budget","kategori","insights"],life:["career","ventures","people","health","journal"],lib:["notes","files"]};
  const groupOf=t=>Object.keys(GROUPS).find(g=>GROUPS[g].includes(t))||null;
  function syncGroupCounts(){
    document.querySelectorAll("[data-gc]").forEach(el=>{
      const g=el.dataset.gc,cs=[...document.querySelectorAll('.nsub[data-sg="'+g+'"]>a .count')];
      const alert=cs.filter(c=>c.classList.contains("alert"));
      const use=alert.length?alert:cs;
      const n=use.reduce((a,c)=>a+(parseInt(c.textContent,10)||0),0);
      const txt=String(n),al=alert.length>0;
      if(el.textContent!==txt)el.textContent=txt;
      if(el.hidden!==!n)el.hidden=!n;
      if(el.classList.contains("alert")!==al)el.classList.toggle("alert",al);
    });
  }
  try{const mo=new MutationObserver(syncGroupCounts);document.querySelectorAll(".nsub>a .count").forEach(c=>mo.observe(c,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:["class"]}))}catch(_){}
  function openGroup(g){
    document.querySelectorAll(".ngrp").forEach(n=>{
      const on=n.dataset.ng===g;
      n.querySelector(".nsub").hidden=!on;
      n.querySelector(".ng-btn").setAttribute("aria-expanded",String(on));
    });
    if(isMob())$("scrim").hidden=!g;
  }
  document.querySelector(".nav").addEventListener("click",e=>{
    const b=e.target.closest(".ng-btn");if(!b)return;
    /* klik menu besar: kembali ke sub-menu terakhir yang dibuka di grup itu (awal: sub-menu pertama) */
    const g=b.dataset.ngb,curT=(location.hash||"").slice(1);
    if(groupOf(curT)!==g){const last=lastSub[g],f=b.parentNode.querySelector(".nsub>a[data-tab]");const to=last&&GROUPS[g].includes(last)?last:(f&&f.dataset.tab);if(to){location.hash=to;return}}
    if(isMob())return;
    openGroup(b.getAttribute("aria-expanded")==="true"?null:g);
  });
  let lastSub={},prevTab=null,curTab=null;try{lastSub=JSON.parse(localStorage.getItem("imp-lastsub")||"{}")||{}}catch(_){}
  function showTab(){
    let h=(location.hash||"").slice(1);if(h==="stopwatch")h="calendar";if(h==="keuangan")h="aset";const t=TABS.includes(h)?h:"overview";
    const g=groupOf(t);
    if(g&&lastSub[g]!==t){lastSub[g]=t;try{localStorage.setItem("imp-lastsub",JSON.stringify(lastSub))}catch(_){}}
    const tabChanged=t!==curTab;
    if(tabChanged){prevTab=curTab;curTab=t}
    TABS.forEach(n=>{$("tab-"+n).hidden=n!==t;document.querySelector('[data-tab="'+n+'"]').setAttribute("aria-current",n===t?"page":"false")});
    document.querySelectorAll(".ng-btn").forEach(b=>b.classList.toggle("on",b.dataset.ngb===g));
    if(g&&!isMob())openGroup(g);
    $("view-title").textContent=document.querySelector('[data-tab="'+t+'"] .ni').textContent;
    if(t==="files")setTimeout(()=>{if(assets&&!usageLoaded)refreshUsage()},0);
    closeMenu();
    /* hanya gulir ke atas saat benar-benar pindah menu; ganti pilihan di halaman yang sama (mis. Pengaturan) tetap di posisinya */
    if(tabChanged){const mn=document.querySelector(".main");if(mn)mn.scrollTop=0}
  }
  /* ---------- sidebar (HP) ---------- */
  function openMenu(){}
  function closeMenu(){
    $("side").classList.remove("open");$("scrim").hidden=true;$("menu-btn").setAttribute("aria-expanded","false");
    if(isMob())document.querySelectorAll(".ngrp").forEach(n=>{n.querySelector(".nsub").hidden=true;n.querySelector(".ng-btn").setAttribute("aria-expanded","false")});
  }
  $("menu-btn").addEventListener("click",()=>$("side").classList.contains("open")?closeMenu():openMenu());
  $("scrim").addEventListener("click",closeMenu);
  $("side").addEventListener("click",e=>{if(e.target.closest(".nav a, .app"))closeMenu()});
  addEventListener("keydown",e=>{if(e.key==="Escape"&&isMob()&&!$("scrim").hidden)closeMenu()});
  /* Laptop: Esc = bolak-balik ke menu sebelumnya (mis. Arsip › Catatan ⇄ Keuangan › Anggaran).
     Tidak dipakai saat sedang mengetik, ada jendela/popup terbuka, atau di dalam Excel. */
  addEventListener("keydown",e=>{
    if(e.key!=="Escape"||e.ctrlKey||e.altKey||e.metaKey||e.shiftKey||e.repeat||isMob()||!prevTab)return;
    /* sedang menulis draft di Library › Notes: Esc tetap kembali ke menu sebelumnya (draft tersimpan otomatis), Esc lagi kembali ke catatan */
    if(curTab==="notes"&&window.IMP_NOTE_DRAFTING&&window.IMP_NOTE_DRAFTING()&&!document.querySelector('[role="dialog"]:not([hidden]):not(.lnc),dialog[open]')){
      e.preventDefault();e.stopImmediatePropagation();try{window.IMP_NOTE_FLUSH&&window.IMP_NOTE_FLUSH()}catch(_){}location.hash=prevTab;return}
    const a=document.activeElement;
    if(a&&a!==document.body&&(a.matches("input,textarea,select,[contenteditable],[contenteditable] *")||a.closest("#tab-excel,[role=dialog],dialog")))return;
    if(document.querySelector('[role="dialog"]:not([hidden]),dialog[open],[aria-modal="true"]:not([hidden]),.entry:not([hidden]) :focus'))return;
    if(curTab==="excel")return;
    const vis=[...document.querySelectorAll("form.entry:not([hidden])")].some(f=>f.closest(".panel")&&!f.closest(".panel").hidden&&f.matches(".bg-addf,[data-popup]"));if(vis)return;
    e.preventDefault();location.hash=prevTab;
  },true);
  addEventListener("hashchange",showTab); showTab(); syncGroupCounts();

  /* ---------- status ---------- */
  function setSync(txt,bad){const s=$("sync");s.textContent=txt;s.classList.toggle("bad",!!bad);const t=$("sync-top");if(t){t.textContent=txt;t.classList.toggle("bad",!!bad)}}
  function notice(txt){const n=$("notice");n.textContent=txt||"";n.hidden=!txt}
  function setFormsEnabled(on){document.querySelectorAll("form.entry button.primary").forEach(b=>b.disabled=!on)}
  setFormsEnabled(false);

  /* ---------- data ---------- */
  const byKind=k=>items.filter(i=>i.kind===k);
  async function save(kind,id,data){
    if(!col)return false;
    const ref=id?col.doc(id):col.doc();
    const prev=id?items.find(i=>i.id===id):null;
    const body=Object.assign({kind,created:prev?.created||Date.now(),updated:Date.now()},data);
    try{await ref.set(body);notice("");return true}
    catch(e){handleWriteErr(e);return false}
  }
  async function patch(id,data){
    try{await col.doc(id).update(Object.assign({updated:Date.now()},data));return true}catch(e){handleWriteErr(e);return false}
  }
  function handleWriteErr(e){
    const c=e&&e.code;
    if(c==="quota_exceeded")notice("Storage is full. Delete some old entries and try again.");
    else if(c==="invalid_argument"){notice("You have view-only access to this page, so changes can’t be saved.");setFormsEnabled(false)}
    else notice("Couldn’t save. Check your connection and try again.");
  }
  async function delAssets(ids){if(!assets||!ids)return;for(const a of [].concat(ids)){if(!a)continue;try{await assets.delete(a)}catch(_){}}}
  /* file .xlsx dari menu Excel disimpan ke Library › Files › Excel; satu file per lembar, diperbarui setiap kali disimpan (Teguh 2026-11-26) */
  window.IMP_SAVE_FILE=async(blob,name,key)=>{
    if(!assets||!col)return false;
    try{
      const FID="fld-excel";
      if(!items.some(i=>i.id===FID))await save("folder",FID,{name:"Excel",parent:""});
      const r=await assets.upload(blob,{type:blob.type});
      const old=items.find(i=>i.kind==="file"&&i.xlkey===key);
      if(old){const ok=await patch(old.id,{name:name.slice(0,200),size:r.sizeBytes||blob.size,type:blob.type,asset:r.id});if(ok&&old.asset&&old.asset!==r.id)await delAssets(old.asset);if(!ok)await delAssets(r.id);return ok}
      const ok=await save("file",null,{name:name.slice(0,200),size:r.sizeBytes||blob.size,type:blob.type,asset:r.id,folder:FID,xlkey:key});
      if(!ok)await delAssets(r.id);return ok;
    }catch(e){console.error("Imperium: simpan ke Files gagal",e);return false}
  };
  async function remove(id){
    const it=items.find(i=>i.id===id);if(!it)return;
    try{
      let children=[];
      if(it.kind==="fin"&&it.type==="liabilitas")children=items.filter(x=>x.kind==="pay"&&x.liab===id);
      if(it.kind==="project")children=items.filter(x=>x.kind==="pcost"&&x.proj===id);
      for(const c of children){await delAssets(c.evidence);await col.doc(c.id).delete()}
      if(ent&&(ent.parent===id||ent.edit===id||children.some(c=>c.id===ent.edit)))closeEnt(true);
      await delAssets(it.evidence);
      if(it.kind==="link")await delAssets(it.logo);
      if(it.kind==="dream")await delAssets(it.cover);
      if(it.kind==="note")await delAssets(it.images);
      if(it.kind==="file"){await delAssets(it.asset);setTimeout(refreshUsage,300)}
      await col.doc(id).delete();
    }catch(e){handleWriteErr(e)}
  }

  /* ---------- images ---------- */
  async function prepImage(f,max,type,limit){
    const ok=["image/jpeg","image/png","image/webp","image/gif"];
    if(ok.includes(f.type)&&f.size<=limit)return f;
    try{
      const bmp=await createImageBitmap(f);
      const s=Math.min(1,max/Math.max(bmp.width,bmp.height));
      const c=document.createElement("canvas");c.width=Math.max(1,Math.round(bmp.width*s));c.height=Math.max(1,Math.round(bmp.height*s));
      c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
      const b=await new Promise(r=>c.toBlob(r,type,0.85));
      if(b)return b;
    }catch(_){}
    if(ok.includes(f.type))return f;
    throw {code:"unsupported_type"};
  }
  function assetErr(e){
    const c=e&&e.code;
    if(c==="too_large")return"Photo is too large (20 MB max).";
    if(c==="unsupported_type")return"Image format not supported. Use JPG, PNG, or WebP.";
    if(c==="quota_or_state")return"Photo storage is full. Delete some old photos and try again.";
    if(c==="rate_limited")return"Too many uploads. Wait a moment and try again.";
    if(c==="upstream_auth")return"Your session expired. Reload the page and try again.";
    return"Couldn’t upload the image. Check your connection and try again.";
  }
  document.addEventListener("error",e=>{const t=e.target;if(t&&t.tagName==="IMG"&&t.closest){const th=t.closest(".thumb");if(th)th.classList.add("missing");const lg=t.closest(".logo");if(lg){t.remove()}}},true);

  /* ---------- delete with inline confirm ---------- */
  document.addEventListener("click",e=>{
    const b=e.target.closest("button[data-del]"); if(!b)return;
    if(b.classList.contains("armed")){remove(b.dataset.del);return}
    b.classList.add("armed");b.textContent="Confirm delete?";
    setTimeout(()=>{if(b.isConnected){b.classList.remove("armed");b.textContent="Delete"}},3000);
  });
  document.addEventListener("click",e=>{
    const mb=e.target.closest("button[data-more]");if(!mb)return;
    const id=mb.dataset.more;expanded.has(id)?expanded.delete(id):expanded.add(id);render();
  });
  document.addEventListener("click",e=>{
    const ev=e.target.closest("button[data-ev]");if(ev)openLb(ev.dataset.p,ev.dataset.ev);
  });
  ["aset-amt","debt-amt","debt-inst","rec-amt","acct-open","ent-amt","proj-budget","sub-cost"].forEach(i=>{const el=$(i);el.addEventListener("blur",()=>{const n=parseAmt(el.value);if(!isNaN(n))el.value=n.toLocaleString("id-ID")})});
  const fmtIn=n=>n?Number(n).toLocaleString("id-ID"):"";
  const openH=new Set();
  function hist(key,label,inner){return '<details class="hist" data-h="'+esc(key)+'"'+(openH.has(key)?' open':'')+'><summary>'+label+'</summary>'+inner+'</details>'}
  document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.classList&&d.classList.contains("hist")){if(d.open)openH.add(d.dataset.h);else openH.delete(d.dataset.h)}},true);
  const rowActs=id=>'<div class="row-actions"><button class="ghost" data-edit="'+esc(id)+'">Edit</button><button class="ghost danger" data-del="'+esc(id)+'">Delete</button></div>';

  function setFormOpen(kind,open){
    const f=$("f-"+kind);f.hidden=!open;
    const b=document.getElementById("tg-"+kind);
    if(b){b.textContent=open?"− Hide form":b.dataset.lab;b.setAttribute("aria-expanded",String(open))}
  }
  function setEditing(kind,id,labels){
    editing[kind]=id;
    setFormOpen(kind,!!id);
    const f=$("f-"+kind);
    f.classList.toggle("editing",!!id);
    $("ft-"+kind).textContent=id?labels[1]:labels[0];
    $(kind+"-submit").textContent=id?"Save changes":labels[2];
    $(kind+"-cancel").hidden=!id;
    if(id)f.scrollIntoView({behavior:smooth(),block:"start"});
  }
  ["task","proj","dream","sub","link","aset","debt","acct","rec","note"].forEach(k=>{
    const f=$("f-"+k),b=document.createElement("button");
    b.type="button";b.id="tg-"+k;b.className="soft";b.style.alignSelf="flex-start";
    b.dataset.lab="+ "+$("ft-"+k).textContent;b.setAttribute("aria-controls","f-"+k);
    b.onclick=()=>{
      if(f.hidden){setFormOpen(k,true);const first=f.querySelector("input:not([type=hidden]),select,textarea");if(first)first.focus()}
      else if(editing[k])$(k+"-cancel").click();
      else setFormOpen(k,false);
    };
    f.parentNode.insertBefore(b,f);setFormOpen(k,false);
  });

  /* ---------- inline entry form (cicilan & biaya proyek) ---------- */
  const ENT={
    pay:{title:"Log payment",edit:"Edit payment",amt:"Amount paid (Rp)",note:"Description",ph:"e.g. Installment #3, bank transfer",ev:"Payment proof (photos or screenshots, multiple allowed)",submit:"Save payment",kind:"pay",key:"liab"},
    cost:{title:"Log cost",edit:"Edit cost",amt:"Cost (Rp)",note:"Item / description",ph:"e.g. 10 bags of cement, week 2 labor",ev:"Receipt or photos (optional, multiple allowed)",submit:"Save cost",kind:"pcost",key:"proj"}
  };
  function entStatus(t){$("ent-status").textContent=t||""}
  function openEnt(mode,parentId,item){
    const parent=items.find(i=>i.id===parentId);if(!parent)return;
    const C=ENT[mode];
    ent={mode,parent:parentId,edit:item?item.id:null};
    $("entform").reset();entStatus("");
    $("ent-title").textContent=(item?C.edit:C.title)+" · "+(parent.name||"");
    $("ent-amt-lab").textContent=C.amt;$("ent-note-lab").textContent=C.note;$("ent-note").placeholder=C.ph;$("ent-ev-lab").textContent=C.ev;
    $("ent-date").value=item?(item.date||today()):today();
    $("ent-amt").value=item?fmtIn(item.amount):(mode==="pay"?fmtIn(parent.installment):"");
    $("ent-note").value=item?(item.note||""):"";
    $("ent-ev-hint").hidden=!(item&&item.evidence&&item.evidence.length&&assets);
    $("ent-submit").textContent=item?"Save changes":C.submit;
    render();
    const f=$("entform");
    if(f.isConnected){f.scrollIntoView({behavior:smooth(),block:"center"});$("ent-amt").focus()}
  }
  function closeEnt(silent){ent=null;$("ent-holder").appendChild($("entform"));$("entform").reset();entStatus("");if(!silent)render()}
  $("ent-cancel").onclick=()=>closeEnt();
  function parkEnt(mode){if(ent&&ent.mode===mode)$("ent-holder").appendChild($("entform"))}
  function placeEnt(mode){
    if(!ent||ent.mode!==mode)return;
    const slot=document.getElementById("slot-"+ent.parent);
    if(slot)slot.appendChild($("entform"));else closeEnt(true);
  }
  $("entform").addEventListener("submit",async e=>{
    e.preventDefault(); if(entBusy||!ent)return;
    const amount=parseAmt($("ent-amt").value);
    if(isNaN(amount)||amount<=0){entStatus("Enter the amount as a number.");return}
    const files=assets?[...($("ent-files").files||[])]:[];
    const {mode,parent,edit}=ent, C=ENT[mode];
    entBusy=true;$("ent-submit").disabled=true;
    const uploaded=[];
    try{
      for(let i=0;i<files.length;i++){
        entStatus("Uploading photo "+(i+1)+" of "+files.length+"…");
        const b=await prepImage(files[i],2000,"image/jpeg",1.5e6);
        const r=await assets.upload(b,{type:b.type||"image/jpeg"});
        uploaded.push(r.id);
      }
      entStatus("Saving…");
      const prev=edit?items.find(x=>x.id===edit):null;
      const data={date:$("ent-date").value||today(),amount,note:$("ent-note").value.trim(),evidence:((prev&&prev.evidence)||[]).concat(uploaded)};
      data[C.key]=parent;
      const ok=await save(C.kind,edit,data);
      if(ok)closeEnt();
      else{await delAssets(uploaded);entStatus("Not saved yet. Try again.")}
    }catch(err){
      await delAssets(uploaded);
      entStatus(assetErr(err));
    }finally{entBusy=false;$("ent-submit").disabled=false}
  });
  function entryRows(list){
    return list.map(p=>{
      const ev=(p.evidence||[]).map(a=>'<button class="thumb" data-ev="'+esc(a)+'" data-p="'+esc(p.id)+'" aria-label="View photo"><img src="/_blob/'+esc(a)+'" alt="" loading="lazy"></button>').join("");
      return '<li><span class="pd">'+esc(fmtDate(p.date))+'</span><span class="pn">'+(p.note?esc(p.note):'<span class="hint">No description</span>')+'</span><span class="thumbs">'+(ev||'<span class="noev">No photo</span>')+'</span><span class="amt">'+rp(p.amount)+'</span>'+rowActs(p.id)+'</li>';
    }).join("");
  }
  function entryList(ownerId,list,n,noun){
    if(!list.length)return"";
    const show=expanded.has(ownerId)?list:list.slice(0,n);
    const more=list.length>n?'<button class="ghost" data-more="'+esc(ownerId)+'">'+(expanded.has(ownerId)?"Show less":"Show all "+list.length+" "+noun)+'</button>':"";
    return '<ul class="pays">'+entryRows(show)+'</ul>'+more;
  }
  const byDateDesc=(a,b)=>(b.date||"").localeCompare(a.date||"")||(b.created-a.created);

  /* ---------- lightbox ---------- */
  function openLb(itemId,assetId,canDel){
    lbItem=itemId;lbAsset=assetId;
    $("lb-img").src="/_blob/"+assetId;
    $("lb-del").hidden=!assets||canDel===false;$("lb-del").textContent="Delete this photo";$("lb-del").classList.remove("armed");
    $("lb").hidden=false;$("lb-close").focus();
  }
  function closeLb(){$("lb").hidden=true;$("lb-img").removeAttribute("src");lbItem=null;lbAsset=null}
  $("lb-close").onclick=closeLb;
  $("lb").addEventListener("click",e=>{if(e.target===$("lb"))closeLb()});
  addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("lb").hidden)closeLb()});
  $("lb-del").onclick=async()=>{
    const b=$("lb-del");
    if(!b.classList.contains("armed")){b.classList.add("armed");b.textContent="Confirm delete?";return}
    const p=items.find(x=>x.id===lbItem),a=lbAsset;if(!p){closeLb();return}
    b.disabled=true;
    const ok=await patch(p.id,{evidence:(p.evidence||[]).filter(x=>x!==a)});
    if(ok)await delAssets(a);
    b.disabled=false;closeLb();
  };

  /* ---------- TASKS ---------- */
  const TL=["New task","Edit task","Add task"];
  const REP={daily:"Daily",weekly:"Weekly",monthly:"Monthly"};
  const REPORD={daily:0,weekly:1,monthly:2};
  const UNIT={daily:"day",weekly:"week",monthly:"month"};
  const NOWLAB={daily:"Done today",weekly:"Done this week",monthly:"Done this month"};
  const isRoutine=t=>!!REP[t.rep];
  const ymdN=n=>new Date(n*864e5).toISOString().slice(0,10);
  function periodKey(rep,d){
    d=d||today();
    if(rep==="daily")return d;
    if(rep==="monthly")return d.slice(0,7);
    const n=dayNum(d),dow=(new Date(n*864e5).getUTCDay()+6)%7;return ymdN(n-dow);
  }
  function prevKey(rep,k){
    if(rep==="daily")return ymdN(dayNum(k)-1);
    if(rep==="weekly")return ymdN(dayNum(k)-7);
    let [y,m]=k.split("-").map(Number);m-=1;if(m<1){m=12;y-=1}return y+"-"+String(m).padStart(2,"0");
  }
  const doneNow=t=>isRoutine(t)?(t.log||[]).includes(periodKey(t.rep)):!!t.done;
  function streakOf(t){
    const log=new Set(t.log||[]);let k=periodKey(t.rep);
    if(!log.has(k))k=prevKey(t.rep,k);
    let c=0;while(log.has(k)&&c<2000){c++;k=prevKey(t.rep,k)}return c;
  }
  function toggleTask(id,checked){
    const t=items.find(i=>i.id===id);if(!t)return;
    if(isRoutine(t)){
      const cur=periodKey(t.rep);let log=(t.log||[]).filter(x=>x!==cur);
      if(checked)log.push(cur);
      patch(id,{log:log.sort().slice(-500)});
    }else patch(id,{done:checked,doneAt:checked?Date.now():null});
  }
  document.addEventListener("change",e=>{const c=e.target.closest&&e.target.closest("input[data-done]");if(c)toggleTask(c.dataset.done,c.checked)});
  function syncRep(){$("lb-due").hidden=$("task-rep").value!=="none"}
  $("task-rep").addEventListener("change",syncRep);
  $("f-task").addEventListener("submit",async e=>{
    e.preventDefault();
    const title=$("task-title").value.trim(); if(!title)return;
    const id=editing.task, prev=id?items.find(i=>i.id===id):null;
    const r=$("task-rep").value, routine=!!REP[r];
    const ok=await save("task",id,{
      title,rep:routine?r:"",due:routine?"":($("task-due").value||""),prio:+$("task-prio").value,project:$("task-proj").value||"",
      done:(prev&&!routine)?!!prev.done:false,doneAt:(prev&&!routine)?(prev.doneAt||null):null,
      log:(prev&&routine&&prev.rep===r)?(prev.log||[]):[]
    });
    if(ok){$("f-task").reset();syncRep();setEditing("task",null,TL)}
  });
  $("task-cancel").onclick=()=>{$("f-task").reset();syncRep();setEditing("task",null,TL)};
  document.querySelectorAll("[data-tf]").forEach(b=>b.onclick=()=>{taskFilter=b.dataset.tf;document.querySelectorAll("[data-tf]").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"));renderTasks()});
  $("task-list").addEventListener("click",e=>{
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const t=items.find(i=>i.id===b.dataset.edit);if(!t)return;
    $("task-title").value=t.title||"";$("task-rep").value=t.rep||"none";$("task-due").value=t.due||"";$("task-prio").value=String(t.prio||2);$("task-proj").value=t.project||"";
    syncRep();setEditing("task",t.id,TL);$("task-title").focus();
  });
  function taskItem(t,projs,pre,actions){
    const t0=today(),p=projs.find(x=>x.id===t.project),dn=doneNow(t);
    const meta=[];
    if(isRoutine(t)){
      meta.push('<span class="pill p-acc">'+REP[t.rep]+'</span>');
      const st=streakOf(t);if(st)meta.push('<span class="mono">'+st+'-'+UNIT[t.rep]+' streak</span>');
      if(dn)meta.push('<span>'+NOWLAB[t.rep]+'</span>');
    }
    meta.push({1:'<span class="pill p-crit">High</span>',2:'<span class="pill p-mute">Medium</span>',3:'<span class="pill p-mute">Low</span>'}[t.prio||2]);
    if(!isRoutine(t)&&t.due){const late=!t.done&&t.due<t0,isT=t.due===t0;meta.push('<span class="mono'+(late?' neg':'')+'">'+(late?"Overdue · ":isT?"Today · ":"")+esc(fmtDate(t.due))+'</span>')}
    if(p)meta.push('<span>'+esc(p.name)+'</span>');
    return '<li class="'+(dn?"done":"")+'"><input type="checkbox" class="check" id="'+pre+'-'+esc(t.id)+'" data-done="'+esc(t.id)+'" '+(dn?"checked":"")+' aria-label="Mark as done"><div class="grow"><div class="ttl">'+esc(t.title)+'</div><div class="meta">'+meta.join("")+'</div></div>'+(actions?rowActs(t.id):'')+'</li>';
  }
  const TKT=(en,id)=>document.documentElement.lang==="id"?id:en;
  function tkRoutineRow(t,rep,keys,curKey,projs){
    const log=new Set(t.log||[]);let on=0,tot=0;
    const cells=keys.map(k=>{
      const isCur=k===curKey,d=log.has(k),na=!d&&keyEnded(rep,k,t.created);
      if(d||(!na&&!isCur)){tot++;if(d)on++}
      const tip=keyLabel(rep,k)+" · "+(na?TKT("before this routine existed","sebelum rutinitas dibuat"):d?TKT("done","selesai"):TKT("not done","belum"));
      return '<i role="button" tabindex="0" data-rc="'+esc(t.id)+'|'+k+'" class="'+(d?"on":na?"na":"off")+(isCur?" cur":"")+'" title="'+esc(tip)+'" aria-label="'+esc(tip)+'"></i>';
    }).join("");
    const rate=tot?Math.round(on/tot*100):0,st=streakOf(t),p=projs.find(x=>x.id===t.project);
    const U=TKT({day:"day",week:"week",month:"month"}[UNIT[rep]],{day:"hari",week:"minggu",month:"bulan"}[UNIT[rep]]);
    const meta=[PRIO_PILL[t.prio||2],'<span class="mono">'+on+' '+TKT("of","dari")+' '+tot+'</span>'];
    if(st)meta.push('<span class="mono">'+TKT(st+"-"+U+" streak","beruntun "+st+" "+U)+'</span>');
    if(p)meta.push('<span class="acn">'+esc(p.name)+'</span>');
    return '<div class="tk-row" role="row"><div class="tk-name" role="cell"><div class="ttl">'+esc(t.title)+'</div><div class="meta">'+meta.join("")+'</div></div>'
      +'<div class="tk-cells rc-cells" role="cell">'+cells+'</div>'
      +'<div class="tk-rate mono '+(tot?(rate>=80?"t-ok":rate>=50?"t-warn":"t-crit"):"")+'" role="cell">'+(tot?rate+"%":"–")+'</div>'+rowActs(t.id)+'</div>';
  }
  function tkTodoRow(t,projs){
    const t0=today(),p=projs.find(x=>x.id===t.project),late=!t.done&&t.due&&t.due<t0,isT=t.due===t0;
    const tip=t.done?TKT("Done · tap to reopen","Selesai · ketuk untuk membuka lagi"):TKT("Not done · tap to mark done","Belum · ketuk untuk menandai selesai");
    const meta=[PRIO_PILL[t.prio||2]];
    if(p)meta.push('<span class="acn">'+esc(p.name)+'</span>');
    const due=t.due?'<span class="tk-due mono'+(late?" neg":"")+'">'+(late?TKT("Overdue · ","Terlambat · "):isT?TKT("Today · ","Hari ini · "):"")+esc(fmtDate(t.due))+'</span>':'<span class="tk-due hint">'+TKT("No due date","Tanpa tenggat")+'</span>';
    return '<div class="tk-row'+(t.done?" done":"")+'" role="row"><div class="tk-name" role="cell"><div class="ttl">'+esc(t.title)+'</div><div class="meta">'+meta.join("")+'</div></div>'
      +'<div class="tk-cells rc-cells" role="cell">'+due+'<i role="button" tabindex="0" data-tdone="'+esc(t.id)+'" class="'+(t.done?"on":"off")+' cur" title="'+esc(tip)+'" aria-label="'+esc(tip)+'"></i></div>'
      +'<div class="tk-rate mono'+(t.done?" t-ok":"")+'" role="cell">'+(t.done?"✓":"–")+'</div>'+rowActs(t.id)+'</div>';
  }
  const PRIO_PILL={1:'<span class="pill p-crit">High</span>',2:'<span class="pill p-mute">Medium</span>',3:'<span class="pill p-mute">Low</span>'};
  function renderTasks(){
    const projs=byKind("project");
    const sel=$("task-proj"),cur=sel.value;
    sel.innerHTML='<option value="">No project</option>'+projs.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+'</option>').join("");
    sel.value=projs.some(p=>p.id===cur)?cur:"";
    const all=byKind("task");
    let rs=all.filter(isRoutine),os=all.filter(t=>!isRoutine(t));
    $("c-tugas").textContent=os.filter(t=>!t.done).length+rs.filter(t=>!doneNow(t)).length;
    if(taskFilter==="aktif")os=os.filter(t=>!t.done);
    else if(taskFilter==="selesai"){os=os.filter(t=>t.done);rs=rs.filter(doneNow)}
    os.sort((a,b)=>(a.done-b.done)||((a.due||"9999")<(b.due||"9999")?-1:(a.due||"9999")>(b.due||"9999")?1:0)||((a.prio||2)-(b.prio||2))||(a.created-b.created));
    const el=$("task-list");
    if(!ready){el.innerHTML='<div class="empty">Loading tasks…</div>';return}
    if(!rs.length&&!os.length){el.innerHTML='<div class="empty">'+(taskFilter==="selesai"?"Nothing done yet in this period.":"No tasks yet. Type your first task above. For a habit like reading every day, set Repeat to Daily.")+'</div>';return}
    let h='<div class="ptbl-wrap tk-tbl" role="table"><div class="tk-head" role="row"><span role="columnheader">'+TKT("Task","Tugas")+'</span><span role="columnheader">'+TKT("Trend · tap a square to tick","Tren · ketuk kotak untuk mencentang")+'</span><span role="columnheader" class="r">%</span><span role="columnheader"></span></div>';
    ["daily","weekly","monthly"].forEach(rep=>{
      const g=rs.filter(t=>t.rep===rep).sort((a,b)=>((a.prio||2)-(b.prio||2))||((a.created||0)-(b.created||0)));if(!g.length)return;
      const keys=recapKeys(rep),ck=periodKey(rep);
      h+='<div class="tk-sec" role="row"><span>'+TKT(REP[rep]+" · "+RCLAB[rep],{daily:"Harian · 14 hari terakhir",weekly:"Mingguan · 8 minggu terakhir",monthly:"Bulanan · 6 bulan terakhir"}[rep])+'</span><span class="mono">'+g.filter(doneNow).length+' / '+g.length+' '+TKT("done now","selesai")+'</span></div>';
      h+=g.map(t=>tkRoutineRow(t,rep,keys,ck,projs)).join("");
    });
    if(os.length||taskFilter==="aktif"){
      h+='<div class="tk-sec" role="row"><span>To-do</span><span class="mono">'+os.filter(t=>t.done).length+' / '+os.length+' '+TKT("done","selesai")+'</span></div>';
      h+=os.length?os.map(t=>tkTodoRow(t,projs)).join(""):'<div class="tk-empty hint">No open to-dos.</div>';
    }
    h+='</div><p class="hint tk-hint">'+TKT("Oldest on the left, newest on the right. The outlined square is the current period; dashed squares are from before the routine existed. For a to-do, the single square marks it done.","Terlama di kiri, terbaru di kanan. Kotak bergaris tebal = periode sekarang; kotak putus-putus = sebelum rutinitas dibuat. Untuk tugas biasa, satu kotak itu menandai selesai.")+'</p>';
    el.innerHTML=h;
  }
  function tkTodo(el){const t=items.find(x=>x.id===el.dataset.tdone);if(!t)return;el.classList.toggle("on",!t.done);toggleTask(t.id,!t.done)}
  $("task-list").addEventListener("click",e=>{
    const c=e.target.closest("[data-rc]");if(c){window.IMP_RC(c);return}
    const d=e.target.closest("[data-tdone]");if(d)tkTodo(d);
  });
  $("task-list").addEventListener("keydown",e=>{
    const c=e.target.closest&&e.target.closest("[data-rc],[data-tdone]");if(!c||(e.key!=="Enter"&&e.key!==" "))return;
    e.preventDefault();if(c.dataset.rc)window.IMP_RC(c);else tkTodo(c);
  });


  /* ---------- DREAMS ---------- */
  const DL=["New dream","Edit dream","Add dream"];
  const DSTAT={dream:["Dreaming","p-mute"],work:["Working on it","p-acc"],done:["Achieved","p-ok"]};
  const DORD={work:0,dream:1,done:2};
  let dreamFilter="all",dreamBusy=false;
  function dreamUi(){const d=editing.dream?items.find(i=>i.id===editing.dream):null;$("dream-img-hint").hidden=!(d&&d.cover&&assets);$("dream-img-del").hidden=!(d&&d.cover&&assets)}
  $("f-dream").addEventListener("submit",async e=>{
    e.preventDefault(); if(dreamBusy)return;
    const title=$("dream-title").value.trim();if(!title)return;
    const id=editing.dream,prev=id?items.find(i=>i.id===id):null;
    const file=assets&&$("dream-img").files&&$("dream-img").files[0];
    const status=$("dream-status").value,yr=parseInt($("dream-year").value,10);
    dreamBusy=true;$("dream-submit").disabled=true;
    let cover=prev?prev.cover||"":"",newId=null;
    try{
      if(file){$("dream-status-msg").textContent="Uploading image…";const b=await prepImage(file,1600,"image/jpeg",1.5e6);const r=await assets.upload(b,{type:b.type||"image/jpeg"});newId=r.id;cover=newId}
      const dk=$("dream-kind").value,goal=parseAmt($("dream-goal").value);
      const ok=await save("dream",id,{title,dkind:dk,goal:dk==="save"&&goal>0?goal:0,train:dk==="train"?$("dream-train").value:"",cat:$("dream-cat").value,year:yr>=2000&&yr<=2100?yr:0,status,why:$("dream-why").value.trim(),cover,steps:prev?(prev.steps||[]):[],achievedAt:status==="done"?((prev&&prev.achievedAt)||today()):""});
      if(ok){if(newId&&prev&&prev.cover)await delAssets(prev.cover);$("f-dream").reset();setEditing("dream",null,DL);dreamUi();$("dream-status-msg").textContent=""}
      else{if(newId)await delAssets(newId);$("dream-status-msg").textContent=""}
    }catch(err){if(newId)await delAssets(newId);$("dream-status-msg").textContent=assetErr(err)}
    finally{dreamBusy=false;$("dream-submit").disabled=false}
  });
  $("dream-cancel").onclick=()=>{$("f-dream").reset();setEditing("dream",null,DL);dreamUi();dreamKindUi();$("dream-status-msg").textContent=""};
  function dreamKindUi(){const k=$("dream-kind").value;$("lb-dream-goal").hidden=k!=="save";$("lb-dream-train").hidden=k!=="train";
    const h=$("dream-kind-hint");h.hidden=k==="year";
    h.textContent=k==="save"?TT("Progress comes from accounts of type Savings that you link to this target in Finance › Account.","Progres dihitung dari saldo account bertipe Tabungan yang Anda hubungkan ke target ini di Keuangan › Account.")
      :k==="train"?TT("Progress follows the topics you have marked as understood in Training › Basic English.","Progres mengikuti topik yang sudah Anda centang \"Sudah paham\" di Pelatihan › Basic English."):"";}
  $("dream-kind").addEventListener("change",dreamKindUi);
  $("f-dream").addEventListener("reset",()=>setTimeout(dreamKindUi,0));
  $("dream-img-del").onclick=async()=>{
    const d=items.find(i=>i.id===editing.dream);if(!d||!d.cover)return;
    const old=d.cover;
    if(await patch(d.id,{cover:""})){await delAssets(old);$("dream-img-hint").hidden=true;$("dream-img-del").hidden=true}
  };
  document.querySelectorAll("[data-df]").forEach(b=>b.onclick=()=>{dreamFilter=b.dataset.df;document.querySelectorAll("[data-df]").forEach(x=>x.setAttribute("aria-pressed",x===b?"true":"false"));renderDreams()});
  function stepRef(v){const i=v.lastIndexOf("|");return {d:items.find(x=>x.id===v.slice(0,i)),i:+v.slice(i+1)}}
  $("dream-list").addEventListener("click",e=>{
    const a=e.target.closest("button[data-achieve]");
    if(a){patch(a.dataset.achieve,{status:"done",achievedAt:today()});return}
    const sd=e.target.closest("button[data-stepdel]");
    if(sd){const r=stepRef(sd.dataset.stepdel);if(!r.d)return;const steps=(r.d.steps||[]).slice();steps.splice(r.i,1);patch(r.d.id,{steps});return}
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const d=items.find(i=>i.id===b.dataset.edit);if(!d)return;
    $("dream-title").value=d.title||"";$("dream-kind").value=d.dkind||"year";$("dream-goal").value=d.goal?fmtIn(d.goal):"";$("dream-train").value=d.train||"be";dreamKindUi();$("dream-cat").value=d.cat||"Other";$("dream-year").value=d.year||"";$("dream-status").value=d.status||"dream";$("dream-why").value=d.why||"";$("dream-img").value="";
    setEditing("dream",d.id,DL);dreamUi();$("dream-title").focus();
  });
  $("dream-list").addEventListener("change",e=>{
    const c=e.target.closest("input[data-step]");if(!c)return;
    const r=stepRef(c.dataset.step);if(!r.d)return;
    const steps=(r.d.steps||[]).map((x,k)=>k===r.i?{t:x.t,done:c.checked}:x);
    patch(r.d.id,{steps});
  });
  $("dream-list").addEventListener("submit",e=>{
    const f=e.target.closest("form[data-stepform]");if(!f)return;
    e.preventDefault();
    const d=items.find(x=>x.id===f.dataset.stepform);const inp=f.querySelector("input");const t=inp.value.trim();
    if(!d||!t)return;
    const steps=(d.steps||[]).concat([{t:t.slice(0,200),done:false}]).slice(0,50);
    inp.value="";patch(d.id,{steps});
  });
  function ieltsPanel(){
    const s=window.IMP_IELTS_SUMMARY&&window.IMP_IELTS_SUMMARY();if(!s)return"";
    const K=[["L","Listening"],["R","Reading"],["W","Writing"],["S","Speaking"]];
    const vals=K.map(k=>s.est[k[0]]);
    const pct=Math.round(vals.reduce((a,v)=>a+(v==null?0:Math.max(0,Math.min(1,(v-4)/3))),0)/4*100);
    const hit=vals.filter(v=>v!=null&&v>=7).length;
    const cells=K.map((k,i)=>{const v=vals[i];return'<div class="ie-dc'+(v!=null&&v>=7?' hit':'')+'"><span>'+k[1]+'</span><b class="mono">'+(v==null?"—":v.toFixed(1))+'</b></div>'}).join("");
    const info=s.assessCount?hit+' dari 4 section sudah band 7 · '+s.weekMin+' menit latihan 7 hari terakhir'+(s.last?' · terakhir latihan '+esc(fmtDate(s.last)):''):'Belum ada penilaian. Band terisi otomatis dari latihan di menu IELTS.';
    const dz=window.IMP_IELTS_DASAR&&window.IMP_IELTS_DASAR();
    return'<div class="ie-dream"><div><div class="barlab"><span>IELTS · progres ke band 7</span><span class="mono">Overall '+(s.overall!=null?s.overall.toFixed(1):'—')+' / 7.0</span></div><div class="bar"><i style="width:'+pct+'%"></i></div></div><div class="ie-dgrid">'+cells+'</div><p class="hint">'+info+'</p>'+(dz?'<p class="hint">Belajar Dasar: <b>'+dz.score+'/100</b> · '+dz.passed+' dari '+dz.total+' pelajaran lulus</p>':'')+'<a href="#ielts" data-tab="ielts" class="ie-dlink">Buka latihan IELTS →</a></div>';
  }
  window.IMP_RENDER_DREAMS=()=>{try{renderDreams()}catch(_){}};
  addEventListener("hashchange",()=>{if(location.hash==="#dreams")window.IMP_RENDER_DREAMS()});
  /* panel progres sesuai jenis target: tabungan (dari account Tabungan) atau pelatihan (dari Basic English) */
  function dreamKindPanel(d){
    const k=d.dkind||"year";
    if(k==="save"){
      const fs=byKind("fin"),linked=byKind("acct").filter(a=>a.atype==="savings"&&a.dream===d.id),have=linked.reduce((t,a)=>t+acctBal(a,fs),0),goal=+d.goal||0;
      const pct=goal?Math.max(0,Math.min(100,Math.round(have/goal*100))):0;
      return '<div class="dk-panel"><div class="barlab"><span>🐷 '+TT("Savings","Tabungan")+'</span><span class="mono">'+rp(have)+(goal?' / '+rp(goal)+' · '+pct+'%':'')+'</span></div><div class="bar ok"><i style="width:'+pct+'%"></i></div>'
        +'<p class="hint">'+(linked.length?TT("From: ","Dari: ")+linked.map(a=>esc(a.name)+' <span class="mono">'+rp(acctBal(a,fs))+'</span>').join(" · ")+(goal&&have<goal?' · '+TT("still needed ","kurang ")+'<span class="mono">'+rp(goal-have)+'</span>':goal&&have>=goal?' · ✓ '+TT("goal reached","target tercapai"):''):TT("No savings account linked yet. In Finance › Account, set an account's type to Savings and pick this target.","Belum ada account tabungan yang terhubung. Di Keuangan › Account, pilih tipe Tabungan lalu pilih target ini."))+'</p></div>';
    }
    if(k==="train"){
      const p=window.IMP_BE_PROGRESS&&window.IMP_BE_PROGRESS();if(!p)return "";
      return '<div class="dk-panel"><div class="barlab"><span>📘 Basic English</span><span class="mono">'+p.pct+'% · '+p.paham+' / '+p.total+' '+TT("topics","topik")+'</span></div><div class="bar"><i style="width:'+p.pct+'%"></i></div>'
        +'<p class="hint">'+p.level.map(l=>esc(l.nama)+' <span class="mono">'+l.paham+'/'+l.total+'</span>').join(" · ")+'</p></div>';
    }
    return "";
  }
  function renderDreams(){
    let ds=byKind("dream");
    $("c-dreams").textContent=ds.filter(d=>d.status!=="done").length;
    const el=$("dream-list");
    if(!ready){el.innerHTML='<div class="empty">Loading dreams…</div>';return}
    if(dreamFilter!=="all")ds=ds.filter(d=>(d.status||"dream")===dreamFilter);
    ds.sort((a,b)=>(DORD[a.status||"dream"]-DORD[b.status||"dream"])||((a.year||9999)-(b.year||9999))||(a.created-b.created));
    if(!ds.length){el.innerHTML='<div class="empty">'+(dreamFilter==="all"?"No dreams written yet. Write down what you want to achieve, why it matters, and the first steps toward it.":"Nothing here yet.")+'</div>';return}
    const yNow=new Date().getFullYear();
    el.innerHTML='<div class="dreams">'+ds.map(d=>{
      const st=DSTAT[d.status||"dream"],steps=d.steps||[],nd=steps.filter(x=>x.done).length,pct=steps.length?Math.round(nd/steps.length*100):0;
      const meta=['<span>'+({save:"🐷 "+TT("Savings target","Target tabungan"),train:"📘 "+TT("Training target","Target pelatihan")}[d.dkind]||"🎯 "+TT("Year target","Target tahun"))+'</span>','<span>'+esc(d.cat||"Other")+'</span>'];
      if(d.status==="done"&&d.achievedAt)meta.push('<span class="mono">Achieved '+esc(fmtDate(d.achievedAt))+'</span>');
      else if(d.year){const left=d.year-yNow;meta.push('<span class="mono'+(left<0?' neg':'')+'">Target '+d.year+(document.documentElement.lang==="id"?(left>0?' · '+left+' tahun lagi':left===0?' · tahun ini':' · target terlewat'):(left>0?' · '+left+' year'+(left>1?'s':'')+' to go':left===0?' · this year':' · target passed'))+'</span>')}
      const cover=d.cover?'<div class="cover"><img src="/_blob/'+esc(d.cover)+'" alt="" loading="lazy"></div>':'<div class="cover blank"><span>'+esc(d.cat||"Dream")+'</span></div>';
      const stepList=steps.map((x,k)=>'<li class="'+(x.done?"done":"")+'"><input type="checkbox" class="check" id="st-'+esc(d.id)+'-'+k+'" data-step="'+esc(d.id)+'|'+k+'" '+(x.done?"checked":"")+' aria-label="Step done"><span>'+esc(x.t)+'</span><button type="button" class="ghost" data-stepdel="'+esc(d.id)+'|'+k+'" aria-label="Remove step">×</button></li>').join("");
      return '<article class="proj dream'+(d.status==="done"?" achieved":"")+'">'+cover
        +'<div class="card-head"><h3>'+esc(d.title)+'</h3><span class="pill '+st[1]+'">'+st[0]+'</span></div>'
        +'<div class="meta">'+meta.join("")+'</div>'
        +(d.why?'<p class="why">'+esc(d.why)+'</p>':'')
        +'<div><div class="barlab"><span>Steps</span><span class="mono">'+(steps.length?nd+' of '+steps.length:'none yet')+'</span></div><div class="bar ok"><i style="width:'+pct+'%"></i></div></div>'
        +dreamKindPanel(d)
        +(/australia/i.test(d.title||'')?ieltsPanel():'')
        +(steps.length?'<ul class="steps">'+stepList+'</ul>':'')
        +'<form class="stepform" data-stepform="'+esc(d.id)+'"><input id="stepin-'+esc(d.id)+'" maxlength="200" placeholder="Add a step toward this dream" aria-label="New step"><button type="submit" class="soft">Add</button></form>'
        +'<div class="card-foot">'+(d.status!=="done"?'<button class="ghost" data-achieve="'+esc(d.id)+'">Mark achieved</button>':'<span></span>')+rowActs(d.id)+'</div></article>';
    }).join("")+'</div>';
  }

  /* ---------- NOTES ---------- */
  const NL=["New note","Edit note","Add note"];
  let noteQuery="";
  let noteFolder="";      /* "" = all notes, "__none" = no folder, else folder id */
  let nfEdit=null;        /* null | "new" | folder id being renamed */
  const nfolders=()=>byKind("nfolder").slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
  const NF_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>';
  let noteImgs=[];       /* {id}=saved image, {blob,url}=pasted, not uploaded yet */
  let noteBusy=false;
  const nstat=t=>{$("note-img-status").textContent=t?(window.I18N?I18N.t(t):t):""};
  /* ---------- NOTE DRAFTS (autosave) ---------- */
  const DRAFT_LS="imperium-note-drafts",DRAFT_KEEP=7*864e5;
  function cleanDrafts(r){
    const o={},now=Date.now();
    Object.keys(r||{}).slice(0,60).forEach(k=>{
      const d=r[k];if(!d||typeof d!=="object")return;
      const ts=+d.ts||0;
      if(d.del){if(now-ts<DRAFT_KEEP)o[k]={del:1,ts};return}
      o[k]={title:String(d.title||"").slice(0,150),body:String(d.body||"").slice(0,10000),pin:!!d.pin,folder:String(d.folder||"").slice(0,200),ts};
    });
    return o;
  }
  let drafts={};
  try{const r=JSON.parse(localStorage.getItem(DRAFT_LS)||"null");if(r&&typeof r==="object"&&!Array.isArray(r))drafts=cleanDrafts(r)}catch(_){}
  let draftTimer=0,dbDraftTimer=0;
  const liveDraft=k=>drafts[k]&&!drafts[k].del?drafts[k]:null;
  function keepDraftsLocal(){try{localStorage.setItem(DRAFT_LS,JSON.stringify(drafts))}catch(_){}}
  function persistDrafts(){keepDraftsLocal();clearTimeout(dbDraftTimer);dbDraftTimer=setTimeout(pushDrafts,1500)}
  async function pushDrafts(){
    clearTimeout(dbDraftTimer);dbDraftTimer=0;
    if(!col)return;
    const list=Object.keys(drafts).map(k=>Object.assign({k},drafts[k]));
    try{await col.doc("notedrafts").set({kind:"ndraft",list,updated:Date.now()})}catch(_){}
  }
  function syncDraftsFromStore(){
    const d=items.find(i=>i.id==="notedrafts");
    if(!d||!Array.isArray(d.list))return;
    let changed=false,localNewer=false;
    d.list.forEach(e=>{
      if(!e||typeof e.k!=="string")return;
      const c=cleanDrafts({[e.k]:e})[e.k];if(!c)return;
      const cur=drafts[e.k];
      if(!cur||c.ts>cur.ts){drafts[e.k]=c;changed=true}
      else if(cur.ts>c.ts)localNewer=true;
    });
    Object.keys(drafts).forEach(k=>{if(!d.list.some(e=>e&&e.k===k))localNewer=true});
    if(changed)keepDraftsLocal();
    if(localNewer&&!dbDraftTimer)dbDraftTimer=setTimeout(pushDrafts,800);
  }
  function noteFormState(){return {title:$("note-title").value,body:$("note-body").value,pin:$("note-pin").checked,folder:$("note-folder").value||""}}
  function noteDirty(){
    const s=noteFormState(),n=editing.note?items.find(i=>i.id===editing.note):null;
    if(n){
      const f0=n.folder&&nfolders().some(f=>f.id===n.folder)?n.folder:"";
      return s.title.trim()!==(n.title||"").trim()||s.body.trim()!==(n.body||"").trim()||s.pin!==!!n.pinned||s.folder!==f0;
    }
    return !!(s.title.trim()||s.body.trim()||s.pin);
  }
  const ndStatus=t=>{const el=$("note-draft-status");if(el)el.textContent=t?(window.I18N?I18N.t(t):t):""};
  window.IMP_NOTE_DRAFTING=()=>!$("f-note").hidden&&noteDirty();
  window.IMP_NOTE_FLUSH=()=>{if(draftTimer||noteDirty())noteDraftFlush()};
  /* kembali ke catatan yang sedang ditulis: kursor langsung di isi catatan */
  addEventListener("hashchange",()=>{if(location.hash==="#notes"&&!isMob()&&window.IMP_NOTE_DRAFTING&&window.IMP_NOTE_DRAFTING())setTimeout(()=>{const b=$("note-body");if(b){b.focus({preventScroll:true});const n=b.value.length;try{b.setSelectionRange(n,n)}catch(_){}}},60)});
  function noteDraftTouch(){if(noteBusy)return;clearTimeout(draftTimer);draftTimer=setTimeout(noteDraftFlush,500)}
  function noteDraftFlush(){
    clearTimeout(draftTimer);draftTimer=0;
    if(noteBusy)return;
    const key=editing.note||"new";
    if(noteDirty()){
      const s=noteFormState();
      drafts[key]={title:s.title.slice(0,150),body:s.body.slice(0,10000),pin:s.pin,folder:s.folder,ts:Date.now()};
      persistDrafts();
      ndStatus(noteImgs.some(im=>im.blob)?"Draft saved. Pasted images are not kept until you press Add note.":"Draft saved");
    }else if(liveDraft(key)){drafts[key]={del:1,ts:Date.now()};persistDrafts();ndStatus("")}
    renderDrafts();
  }
  function dropDraft(key){
    clearTimeout(draftTimer);draftTimer=0;
    if(liveDraft(key)){drafts[key]={del:1,ts:Date.now()};persistDrafts()}
    ndStatus("");renderDrafts();
  }
  function restoreNewDraft(){
    const d=liveDraft("new");
    if(editing.note||!d||noteDirty())return;
    $("note-title").value=d.title;$("note-body").value=d.body;$("note-pin").checked=d.pin;
    fillNoteFolderSel(nfolders().some(f=>f.id===d.folder)?d.folder:"");
    ndStatus("Restored your unsaved draft.");renderDrafts();
  }
  function loadDraft(key){
    const d=liveDraft(key);if(!d)return;
    const n=key==="new"?null:items.find(i=>i.id===key);
    if(key!=="new"&&!n){drafts[key]={del:1,ts:Date.now()};persistDrafts();renderDrafts();return}
    if(draftTimer)noteDraftFlush();
    clearNoteImgs();
    if(n){noteImgs=(n.images||[]).map(id=>({id}));renderNotePending()}
    $("note-title").value=d.title;$("note-body").value=d.body;$("note-pin").checked=d.pin;
    fillNoteFolderSel(nfolders().some(f=>f.id===d.folder)?d.folder:"");
    if(n)setEditing("note",key,NL);
    else{setEditing("note",null,NL);setFormOpen("note",true);$("f-note").scrollIntoView({behavior:smooth(),block:"start"})}
    $("note-body").focus();
    ndStatus("Restored your unsaved draft.");
    renderDrafts();
  }
  function renderDrafts(){
    const el=$("note-drafts"),nav=$("nav-nd");if(!el||!nav)return;
    const open=!$("f-note").hidden?(editing.note||"new"):null;
    const keys=Object.keys(drafts).filter(k=>liveDraft(k)&&(k==="new"||(ready&&items.some(i=>i.id===k)))).sort((a,b)=>drafts[b].ts-drafts[a].ts);
    nav.hidden=!keys.length;
    nav.innerHTML=keys.length?'<button type="button" data-ndgo><span>Unfinished drafts</span><span class="count alert">'+keys.length+'</span></button>':"";
    const show=keys.filter(k=>k!==open);
    el.hidden=!show.length;
    if(!show.length){el.innerHTML="";return}
    el.innerHTML='<div class="drafts"><h4>Unfinished drafts</h4>'+show.map(k=>{
      const d=drafts[k],n=k==="new"?null:items.find(i=>i.id===k);
      const t=new Date(d.ts),when=fmtDate(ymd(t))+" "+String(t.getHours()).padStart(2,"0")+":"+String(t.getMinutes()).padStart(2,"0");
      const tt=d.title.trim(),bl=d.body.trim().split("\n");
      const first=(tt||bl[0]||"").slice(0,90),prev=(tt?bl.join(" "):bl.slice(1).join(" ")).trim().slice(0,160);
      return '<div class="ndraft"><div class="grow"><div class="meta"><span class="pill p-warn">Draft</span><span>'+(n?"Editing note":"New note")+'</span>'+(n?'<span class="nd-user">“'+esc(n.title||"…")+'”</span>':'')+'<span class="mono">Saved '+esc(when)+'</span></div>'
        +'<div class="ttl nd-user">'+(first?esc(first):'<span class="untitled">Untitled</span>')+'</div>'
        +(prev?'<p class="note-body clamp nd-user">'+esc(prev)+'</p>':'')+'</div>'
        +'<div class="row-actions"><button type="button" class="soft" data-ndcont="'+esc(k)+'">Continue writing</button><button type="button" class="ghost danger" data-nddel="'+esc(k)+'">Discard</button></div></div>';
    }).join("")+'</div>';
  }
  $("note-drafts").addEventListener("click",e=>{
    const c=e.target.closest("button[data-ndcont]");if(c){loadDraft(c.dataset.ndcont);return}
    const d=e.target.closest("button[data-nddel]");if(!d)return;
    if(d.classList.contains("armed")){dropDraft(d.dataset.nddel);return}
    d.classList.add("armed");d.textContent="Discard draft?";
    setTimeout(()=>{if(d.isConnected){d.classList.remove("armed");d.textContent="Discard"}},3000);
  });
  $("nav-nd").addEventListener("click",e=>{
    if(!e.target.closest("button[data-ndgo]"))return;
    closeMenu();
    if(location.hash!=="#notes")location.hash="#notes";
    setTimeout(()=>{const el=$("note-drafts");if(el&&!el.hidden)el.scrollIntoView({behavior:smooth(),block:"start"})},60);
  });
  $("f-note").addEventListener("input",noteDraftTouch);
  $("f-note").addEventListener("change",noteDraftTouch);
  $("tg-note").addEventListener("click",()=>{if(!$("f-note").hidden)restoreNewDraft();renderDrafts()});
  function flushDraftsNow(){if(draftTimer)noteDraftFlush();if(dbDraftTimer)pushDrafts()}
  addEventListener("pagehide",flushDraftsNow);
  addEventListener("hashchange",()=>{if(draftTimer)noteDraftFlush()});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)flushDraftsNow()});
  function renderNotePending(){
    $("note-pending").innerHTML=noteImgs.map((im,i)=>'<div class="nimg"><img src="'+esc(im.id?"/_blob/"+im.id:im.url)+'" alt="Note image"><button type="button" data-nirm="'+i+'" aria-label="Remove image" title="Remove image">×</button></div>').join("");
  }
  function clearNoteImgs(){noteImgs.forEach(im=>{if(im.url)try{URL.revokeObjectURL(im.url)}catch(_){}});noteImgs=[];renderNotePending();nstat("")}
  function addNoteImages(files){
    const list=[...files].filter(f=>f&&/^image\//.test(f.type||""));
    if(!list.length){nstat("That isn’t an image.");return}
    if(!assets){nstat("Only the signed-in page owner can add images.");return}
    if(!$("f-note")||$("f-note").hidden){setFormOpen("note",true);restoreNewDraft()}
    list.forEach(f=>noteImgs.push({blob:f,url:URL.createObjectURL(f)}));
    renderNotePending();nstat("Image added. Press Add note to keep it.");
  }
  function notesTabOpen(){return !$("tab-notes").hidden}
  document.addEventListener("paste",e=>{
    if(!notesTabOpen())return;
    const cd=e.clipboardData;if(!cd)return;
    const files=[...(cd.files||[])].filter(f=>/^image\//.test(f.type));
    if(!files.length&&cd.items)for(const it of cd.items){if(it.kind==="file"&&/^image\//.test(it.type)){const f=it.getAsFile();if(f)files.push(f)}}
    if(!files.length)return;
    const a=document.activeElement;
    if(a&&a.id==="note-body"&&(cd.getData("text/plain")||"").trim())return;
    if(a&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA")&&!a.closest("#f-note")&&a.id!=="note-search")return;
    e.preventDefault();addNoteImages(files);
  });
  $("note-paste").onclick=()=>$("note-paste").focus();
  $("note-addimg").onclick=()=>$("note-img-file").click();
  $("note-img-file").addEventListener("change",()=>{const l=[...($("note-img-file").files||[])];$("note-img-file").value="";if(l.length)addNoteImages(l)});
  ["dragenter","dragover"].forEach(ev=>$("note-paste").addEventListener(ev,e=>{e.preventDefault();$("note-paste").classList.add("over")}));
  ["dragleave","drop"].forEach(ev=>$("note-paste").addEventListener(ev,e=>{e.preventDefault();$("note-paste").classList.remove("over");if(ev==="drop"&&e.dataTransfer)addNoteImages(e.dataTransfer.files||[])}));
  $("note-pending").addEventListener("click",e=>{
    const b=e.target.closest("button[data-nirm]");if(!b)return;
    const im=noteImgs[+b.dataset.nirm];if(im&&im.url)try{URL.revokeObjectURL(im.url)}catch(_){}
    noteImgs.splice(+b.dataset.nirm,1);renderNotePending();
  });
  function resetNoteForm(){$("f-note").reset();clearNoteImgs();setEditing("note",null,NL);fillNoteFolderSel(noteFolder&&noteFolder!=="__none"?noteFolder:"");ndStatus("");renderDrafts()}
  function fillNoteFolderSel(sel){
    const fl=nfolders();
    $("note-folder").innerHTML='<option value="">No folder</option>'+fl.map(f=>'<option value="'+esc(f.id)+'"'+(f.id===sel?' selected':'')+'>'+esc(f.name)+'</option>').join("");
  }
  $("f-note").addEventListener("submit",async e=>{
    e.preventDefault();
    if(noteBusy)return;
    const body=$("note-body").value.trim();
    if(!body&&!noteImgs.length){nstat("Write something or add an image first.");return}
    noteBusy=true;$("note-submit").disabled=true;
    const uploaded=[];
    try{
      const prev=editing.note?items.find(i=>i.id===editing.note):null;
      const keepIds=noteImgs.filter(im=>im.id).map(im=>im.id);
      const fresh=noteImgs.filter(im=>im.blob);
      for(let i=0;i<fresh.length;i++){
        nstat("Uploading images…");
        const b=await prepImage(fresh[i].blob,1600,"image/jpeg",1.5e6);
        const r=await assets.upload(b,{type:b.type||"image/jpeg"});
        uploaded.push(r.id);
      }
      const images=keepIds.concat(uploaded);
      const ok=await save("note",editing.note,{title:$("note-title").value.trim(),body,pinned:$("note-pin").checked,done:!!(prev&&prev.done),images,folder:$("note-folder").value||""});
      if(ok){
        dropDraft(editing.note||"new");
        const dropped=((prev&&prev.images)||[]).filter(id=>!images.includes(id));
        if(dropped.length)await delAssets(dropped);
        resetNoteForm();
      }else{await delAssets(uploaded)}
    }catch(err){await delAssets(uploaded);nstat(assetErr(err))}
    finally{noteBusy=false;$("note-submit").disabled=false}
  });
  $("note-cancel").onclick=()=>{if(draftTimer)noteDraftFlush();resetNoteForm()};
  $("note-search").addEventListener("input",e=>{noteQuery=e.target.value.trim().toLowerCase();renderNotes()});
  $("note-list").addEventListener("click",e=>{
    const p=e.target.closest("button[data-pin]");
    if(p){const n=items.find(i=>i.id===p.dataset.pin);if(n)patch(n.id,{pinned:!n.pinned});return}
    const im=e.target.closest("button[data-nimg]");
    if(im){openLb(im.dataset.nid,im.dataset.nimg,false);return}
    let b=e.target.closest("button[data-edit]");
    /* ketuk kartu/baris catatan untuk membuka (penting di HP tampilan daftar, tombol Edit tersembunyi) */
    if(!b){const card=e.target.closest(".note");if(!card||e.target.closest("button,a,input,label,select,textarea,.notedone"))return;
      const lv=$("note-list").dataset.view==="list";if(!lv&&!isMob())return;b=card.querySelector("button[data-edit]");if(!b)return}
    const n=items.find(i=>i.id===b.dataset.edit);if(!n)return;
    if(draftTimer)noteDraftFlush();
    clearNoteImgs();
    noteImgs=(n.images||[]).map(id=>({id}));renderNotePending();
    const dr=liveDraft(n.id);
    $("note-title").value=dr?dr.title:(n.title||"");$("note-body").value=dr?dr.body:(n.body||"");$("note-pin").checked=dr?dr.pin:!!n.pinned;
    fillNoteFolderSel(dr?dr.folder:(n.folder||""));
    setEditing("note",n.id,NL);$("note-body").focus({preventScroll:isMob()});
    if(isMob())setTimeout(()=>{try{$("f-note").scrollIntoView({behavior:smooth(),block:"start"})}catch(_){}},30);
    ndStatus(dr?"Restored your unsaved draft.":"");renderDrafts();
  });
  $("note-list").addEventListener("change",async e=>{
    const c=e.target.closest("input[data-notedone]");if(!c)return;
    const id=c.dataset.notedone;
    try{await col.doc(id).update({done:c.checked})}catch(err){handleWriteErr(err);c.checked=!c.checked}
  });
  function nfCount(id){return byKind("note").filter(n=>id==="__none"?!(n.folder&&nfolders().some(f=>f.id===n.folder)):n.folder===id).length}
  function setNoteFolder(id){
    noteFolder=id;nfEdit=null;
    if(location.hash!=="#notes")location.hash="#notes";
    if(!editing.note)fillNoteFolderSel(id&&id!=="__none"?id:"");
    renderNotes();
  }
  function renderNoteFolders(){
    const fl=nfolders(),all=byKind("note").length;
    if(noteFolder&&noteFolder!=="__none"&&!fl.some(f=>f.id===noteFolder))noteFolder="";
    const chip=(id,label,n,icon)=>'<button type="button" class="chip" data-nf="'+esc(id)+'" aria-pressed="'+(noteFolder===id)+'">'+(icon?NF_SVG:'')+'<span class="nm">'+esc(label)+'</span><span class="n">'+n+'</span></button>';
    const cur=fl.find(f=>f.id===noteFolder);
    let h=chip("","All notes",all)+fl.map(f=>chip(f.id,f.name,nfCount(f.id),true)).join("");
    if(fl.length||nfCount("__none")!==all)h+=chip("__none","No folder",nfCount("__none"));
    h+='<button type="button" class="soft" id="nf-new">+ New folder</button>';
    if(cur)h+='<span class="nfmanage"><button type="button" class="ghost" data-nfren="'+esc(cur.id)+'">Rename folder</button><button type="button" class="ghost danger" data-nfdel="'+esc(cur.id)+'">Delete folder</button></span>';
    $("nf-bar").innerHTML=h;
    /* the folder chips hold user text: keep the translator away from the names */
    $("nf-bar").querySelectorAll(".chip[data-nf] .nm").forEach(el=>{if(el.parentNode.dataset.nf&&el.parentNode.dataset.nf!=="__none")el.classList.add("ttl")});
    const sb=$("nav-nf");
    sb.hidden=!fl.length;
    sb.innerHTML=fl.length?fl.map(f=>'<button type="button" data-nfside="'+esc(f.id)+'"'+(noteFolder===f.id&&notesTabOpen()?' aria-current="true"':'')+'><span class="ttl">'+esc(f.name)+'</span><span class="count">'+nfCount(f.id)+'</span></button>').join(""):"";
    $("f-nf").hidden=!nfEdit;
    if(nfEdit){const ed=nfEdit!=="new"?fl.find(f=>f.id===nfEdit):null;if(!ed&&nfEdit!=="new")nfEdit=null;$("nf-save").textContent=ed?"Save name":"Create folder"}
    fillNoteFolderSel($("note-folder").value||"");
  }
  $("nf-bar").addEventListener("click",async e=>{
    const c=e.target.closest("button[data-nf]");if(c){setNoteFolder(c.dataset.nf);return}
    if(e.target.closest("#nf-new")){nfEdit="new";renderNoteFolders();$("nf-name").value="";$("nf-name").focus();return}
    const r=e.target.closest("button[data-nfren]");
    if(r){const f=byKind("nfolder").find(x=>x.id===r.dataset.nfren);if(f){nfEdit=f.id;renderNoteFolders();$("nf-name").value=f.name||"";$("nf-name").focus();$("nf-name").select()}return}
    const d=e.target.closest("button[data-nfdel]");
    if(d){
      if(d.classList.contains("armed")){
        const id=d.dataset.nfdel;
        try{
          for(const n of byKind("note").filter(x=>x.folder===id))await col.doc(n.id).update({folder:""});
          await col.doc(id).delete();
          noteFolder="";
        }catch(err){handleWriteErr(err)}
        return;
      }
      d.classList.add("armed");d.textContent="Delete folder? Notes stay in “No folder”";
      setTimeout(()=>{if(d.isConnected){d.classList.remove("armed");d.textContent="Delete folder"}},4000);
    }
  });
  $("nav-nf").addEventListener("click",e=>{const b=e.target.closest("button[data-nfside]");if(!b)return;setNoteFolder(b.dataset.nfside);closeMenu()});
  $("nf-cancel").onclick=()=>{nfEdit=null;renderNoteFolders()};
  $("f-nf").addEventListener("submit",async e=>{
    e.preventDefault();
    const name=$("nf-name").value.trim();if(!name)return;
    if(nfolders().some(f=>f.id!==nfEdit&&String(f.name||"").toLowerCase()===name.toLowerCase())){nstat("A folder with that name already exists.");$("nf-name").focus();return}
    let ok;
    if(nfEdit&&nfEdit!=="new")ok=await patch(nfEdit,{name});
    else{
      ok=await save("nfolder",null,{name});
    }
    if(ok){nfEdit=null;$("nf-name").value="";renderNoteFolders();nstat("")}
  });
  function renderNotes(){
    renderNoteFolders();renderDrafts();
    const all=byKind("note");
    $("c-notes").textContent=all.length;
    const el=$("note-list");
    if(!ready){el.innerHTML='<div class="empty">Loading notes…</div>';return}
    let ns=all.slice();
    if(noteFolder==="__none"){const ids=new Set(nfolders().map(f=>f.id));ns=ns.filter(n=>!(n.folder&&ids.has(n.folder)))}
    else if(noteFolder)ns=ns.filter(n=>n.folder===noteFolder);
    if(noteQuery)ns=ns.filter(n=>((n.title||"")+" "+(n.body||"")).toLowerCase().includes(noteQuery));
    ns.sort((a,b)=>(!!a.done-!!b.done)||(!!b.pinned-!!a.pinned)||((b.updated||0)-(a.updated||0)));
    if(!ns.length){el.innerHTML='<div class="empty">'+(noteQuery?"No notes match your search.":noteFolder?"No notes in this folder yet. Add one with the form above.":"No notes yet. Tap “+ New note” to write your first one.")+'</div>';return}
    const fnm={};nfolders().forEach(f=>fnm[f.id]=f.name);
    el.innerHTML='<div class="notes">'+ns.map(n=>{
      const body=n.body||"",long=body.length>380||body.split("\n").length>8,open=expanded.has(n.id);
      const imgs=(n.images||[]).map(a=>'<button type="button" class="thumb" data-nimg="'+esc(a)+'" data-nid="'+esc(n.id)+'" aria-label="Open image"><img src="/_blob/'+esc(a)+'" alt="Note image" loading="lazy"></button>').join("");
      return '<article class="proj note'+(n.pinned?' pinned':'')+(n.done?' isdone':'')+'">'
        +'<label class="notedone"><input type="checkbox" data-notedone="'+esc(n.id)+'"'+(n.done?' checked':'')+' aria-label="Mark note as done"><span>Done</span></label>'
        +'<div class="card-head"><h3>'+(n.title?esc(n.title):'<span class="untitled">Untitled</span>')+'</h3>'+(n.pinned?'<span class="pill p-acc">Pinned</span>':'')+'</div>'
        +((!noteFolder&&n.folder&&fnm[n.folder])?'<span class="pill nfpill"><span class="ttl">'+esc(fnm[n.folder])+'</span></span>':'')
        +(body?'<p class="note-body'+(long&&!open?' clamp':'')+'">'+esc(body)+'</p>':'')
        +(imgs?'<div class="note-imgs">'+imgs+'</div>':'')
        +(long?'<button type="button" class="ghost" style="align-self:flex-start" data-more="'+esc(n.id)+'">'+(open?'Show less':'Show more')+'</button>':'')
        +'<div class="meta"><span class="mono">Updated '+esc(fmtDate(ymd(new Date(n.updated||n.created||Date.now()))))+'</span></div>'
        +'<div class="card-foot"><button type="button" class="ghost" data-pin="'+esc(n.id)+'">'+(n.pinned?'Unpin':'Pin')+'</button>'+rowActs(n.id)+'</div></article>';
    }).join("")+'</div>';
  }

  /* ---------- FILES ---------- */
  let curFolder="",fileQuery="",fileEdit=null,usageLoaded=false,fileBusy=false;
  const EXT_TYPE={xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pdf:"application/pdf",txt:"text/plain",csv:"text/csv",md:"text/markdown",json:"application/json",mp4:"video/mp4",webm:"video/webm",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",svg:"image/svg+xml"};
  const TLAB={"application/pdf":"PDF","video/mp4":"VID","video/webm":"VID","text/csv":"CSV","text/markdown":"MD","application/json":"JSON","text/plain":"TXT"};
  const FOLDER_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v8.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/></svg>';
  const extOf=n=>{n=String(n);return n.includes(".")?n.split(".").pop().toLowerCase():""};
  const keepExt=(old,n)=>{const e=extOf(old);return !e||extOf(n)===e?n:n+"."+e};
  const fmtSize=b=>b<1024?b+" B":b<1048576?Math.round(b/1024)+" KB":(b/1048576).toFixed(1)+" MB";
  const folders=()=>byKind("folder");
  function folderPath(id){const out=[],fl=folders();let f=fl.find(x=>x.id===id),g=0;while(f&&g++<30){out.unshift(f);const par=f.parent;f=par?fl.find(x=>x.id===par):null}return out}
  const pathLabel=id=>id?folderPath(id).map(f=>f.name).join(" / ")||"All files":"All files";
  function fileStatus(t){$("file-status").textContent=t||""}
  async function refreshUsage(){
    if(!assets)return;
    try{const r=await assets.list(),u=r.usage;$("file-usage").textContent="Storage used: "+fmtSize(u.bytes)+" of "+fmtSize(u.maxBytes)+" (shared with photos and logos elsewhere in Imperium).";usageLoaded=true}catch(_){}
  }
  $("btn-upload").onclick=()=>$("file-input").click();
  $("file-input").addEventListener("change",async()=>{
    const list=[...($("file-input").files||[])];$("file-input").value="";
    if(!list.length||!assets||!col||fileBusy)return;
    fileBusy=true;$("btn-upload").disabled=true;
    const skipped=[];let n=0,done=0;
    for(const f of list){
      n++;
      const type=EXT_TYPE[extOf(f.name)];
      if(!type){skipped.push(f.name+" (file type not supported)");continue}
      if(f.size>(type==="image/svg+xml"?2:50)*1048576){skipped.push(f.name+" (over 50 MB)");continue}
      fileStatus("Uploading "+n+" of "+list.length+": "+f.name+"…");
      try{
        const r=await assets.upload(f,{type});
        const ok=await save("file",null,{name:f.name.slice(0,200),size:r.sizeBytes||f.size,type,asset:r.id,folder:curFolder});
        if(ok)done++;else{await delAssets(r.id);skipped.push(f.name+" (not saved)")}
      }catch(e){skipped.push(f.name+" ("+assetErr(e).replace(/\.$/,"")+")")}
    }
    fileBusy=false;$("btn-upload").disabled=false;
    fileStatus((done?done+TT(" file"+(done>1?"s":"")+" uploaded. "," berkas terunggah. "):"")+(skipped.length?TT("Not uploaded: ","Tidak terunggah: ")+skipped.join("; ").replace(/ \(over 50 MB\)/g,TT(" (over 50 MB)"," (lebih dari 50 MB)")).replace(/ \(file type not supported\)/g,TT(" (file type not supported)"," (jenis berkas tidak didukung)"))+TT(". Supported: images, PDF, MP4 or WebM video, TXT, CSV, MD and JSON, up to 50 MB each.",". Didukung: gambar, PDF, video MP4/WebM, TXT, CSV, MD dan JSON, maksimal 50 MB per berkas."):""));
    refreshUsage();
  });
  $("btn-newfolder").onclick=()=>{$("f-folder").hidden=false;$("folder-name").focus()};
  $("folder-cancel").onclick=()=>{$("f-folder").reset();$("f-folder").hidden=true};
  $("f-folder").addEventListener("submit",async e=>{
    e.preventDefault();const name=$("folder-name").value.trim();if(!name)return;
    const ok=await save("folder",null,{name,parent:curFolder});
    if(ok){$("f-folder").reset();$("f-folder").hidden=true}
  });
  $("file-search").addEventListener("input",()=>{fileQuery=$("file-search").value.trim().toLowerCase();renderFiles()});
  async function downloadFile(id){
    const f=items.find(x=>x.id===id);if(!f)return;
    if(!downloads){fileStatus("Downloads aren’t available in this view.");return}
    try{
      fileStatus("Preparing "+f.name+"…");
      const res=await fetch("/_blob/"+f.asset);if(!res.ok)throw {code:"fetch"};
      const blob=await res.blob();
      await downloads.save({filename:f.name,data:blob});
      fileStatus("");
    }catch(e){
      const c=e&&e.code;
      fileStatus(c==="declined"?"":c==="rejected_extension"||c==="extension_not_enabled"?"This file type can’t be downloaded here.":c==="rate_limited"?"A download prompt is already open. Finish that one first.":"Couldn’t download "+f.name+". Try again.");
    }
  }
  /* ---------- file viewer ---------- */
  let fvId=null,fvTok=0;
  async function loadPdf(){
    const lib=await loadLib("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js","pdfjsLib");
    await loadLib("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js","pdfjsWorker");
    lib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    return lib;
  }
  /* pratinjau isi berkas (halaman pertama PDF, awal teks, bingkai video) tanpa membuka */
  const prevCache=new Map();let prevIO=null;const prevQ=[];let prevBusy=0;
  function pvKey(a){return "imp-prev-"+a}
  function prevGet(a){if(prevCache.has(a))return prevCache.get(a);try{const v=localStorage.getItem(pvKey(a));if(v){prevCache.set(a,v);return v}}catch(_){}return null}
  function prevSet(a,v){prevCache.set(a,v);try{localStorage.setItem(pvKey(a),v)}catch(_){}}
  function prevPaint(tile,v){
    if(!tile.isConnected)return;
    if(v.startsWith("T:")){tile.classList.add("has-txt");tile.innerHTML='<span class="ftxt"></span>';tile.firstChild.textContent=v.slice(2)}
    else if(v.startsWith("data:")){tile.classList.add("has-prev");tile.innerHTML='<img src="'+v+'" alt="">'}
  }
  async function prevMake(tile){
    const f=items.find(x=>x.id===tile.dataset.prev);if(!f||!f.asset)return;
    const c=prevGet(f.asset);if(c){prevPaint(tile,c);return}
    const t=String(f.type||""),url="/_blob/"+f.asset;
    try{
      if(t==="application/pdf"){
        const [lib,buf]=await Promise.all([loadPdf(),fetch(url).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()})]);
        const pdf=await lib.getDocument({data:buf}).promise,page=await pdf.getPage(1);
        const v1=page.getViewport({scale:1}),sc=260/v1.width,vp=page.getViewport({scale:sc});
        const cv=document.createElement("canvas");cv.width=Math.floor(vp.width);cv.height=Math.floor(vp.height);
        const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);
        await page.render({canvasContext:cx,viewport:vp}).promise;
        const d=cv.toDataURL("image/jpeg",.72);prevSet(f.asset,d);prevPaint(tile,d);
      }else if(t.startsWith("video/")){
        const d=await new Promise((ok,no)=>{const v=document.createElement("video");v.muted=true;v.preload="metadata";v.src=url;
          v.onloadeddata=()=>{try{v.currentTime=Math.min(1,(v.duration||2)/3)}catch(_){no()}};
          v.onseeked=()=>{try{const cv=document.createElement("canvas");cv.width=260;cv.height=Math.round(260*(v.videoHeight||9)/(v.videoWidth||16));cv.getContext("2d").drawImage(v,0,0,cv.width,cv.height);ok(cv.toDataURL("image/jpeg",.7))}catch(e){no(e)}};
          v.onerror=no;setTimeout(no,8000)});
        prevSet(f.asset,d);prevPaint(tile,d);
      }else if(t.startsWith("text/")||t==="application/json"||/\.(txt|csv|md|json)$/i.test(f.name||"")){
        const r=await fetch(url);if(!r.ok)throw 0;const tx=(await r.text()).slice(0,500);const v="T:"+tx;prevSet(f.asset,v);prevPaint(tile,v);
      }
    }catch(_){}
  }
  function prevPump(){while(prevBusy<2&&prevQ.length){const t=prevQ.shift();prevBusy++;prevMake(t).finally(()=>{prevBusy--;prevPump()})}}
  function filePreviews(){
    const tiles=[...document.querySelectorAll("#file-list .ftile[data-prev]")];if(!tiles.length)return;
    if(!prevIO&&"IntersectionObserver" in window)prevIO=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){prevIO.unobserve(e.target);prevQ.push(e.target);prevPump()}})},{rootMargin:"200px"});
    tiles.forEach(t=>{const f=items.find(x=>x.id===t.dataset.prev),c=f&&f.asset&&prevGet(f.asset);if(c){prevPaint(t,c);return}if(prevIO)prevIO.observe(t);else{prevQ.push(t);prevPump()}});
  }
  function closeFile(){fvTok++;fvId=null;$("fv-body").innerHTML="";$("fv").hidden=true}
  $("fv-close").onclick=closeFile;
  $("fv").addEventListener("click",e=>{if(e.target===$("fv"))closeFile()});
  addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("fv").hidden)closeFile()});
  $("fv-dl").onclick=()=>{if(fvId)downloadFile(fvId)};
  async function openFile(id){
    const f=items.find(x=>x.id===id);if(!f)return;
    const tok=++fvTok;fvId=id;
    const body=$("fv-body"),url="/_blob/"+f.asset,t=String(f.type||"");
    $("fv-name").textContent=f.name;$("fv-dl").hidden=!downloads;
    body.innerHTML='<p class="hint">Opening…</p>';$("fv").hidden=false;$("fv-close").focus();
    try{
      if(t.startsWith("image/")){body.innerHTML='<img src="'+esc(url)+'" alt="'+esc(f.name)+'">';return}
      if(t.startsWith("video/")){body.innerHTML='<video controls playsinline preload="metadata" src="'+esc(url)+'"></video>';return}
      const res=await fetch(url);if(!res.ok)throw 0;
      if(t==="application/pdf"){
        const [lib,buf]=await Promise.all([loadPdf(),res.arrayBuffer()]);
        if(tok!==fvTok)return;
        const pdf=await lib.getDocument({data:buf}).promise;
        if(tok!==fvTok)return;
        body.innerHTML="";
        const max=Math.min(pdf.numPages,60),dpr=Math.min(2,window.devicePixelRatio||1);
        for(let i=1;i<=max;i++){
          const page=await pdf.getPage(i);if(tok!==fvTok)return;
          const vp1=page.getViewport({scale:1}),css=Math.min(1.6,Math.max(.5,(body.clientWidth-24)/vp1.width)),vp=page.getViewport({scale:css*dpr});
          const c=document.createElement("canvas");c.width=Math.floor(vp.width);c.height=Math.floor(vp.height);c.style.width=Math.floor(vp1.width*css)+"px";
          c.setAttribute("aria-label","Page "+i+" of "+pdf.numPages);body.appendChild(c);
          await page.render({canvasContext:c.getContext("2d"),viewport:vp}).promise;
        }
        if(pdf.numPages>max){const p=document.createElement("p");p.className="hint";p.textContent="Showing the first "+max+" of "+pdf.numPages+" pages. Download the file to see the rest.";body.appendChild(p)}
        return;
      }
      if(t==="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"){
        const [X,buf]=await Promise.all([loadXLSX(),res.arrayBuffer()]);if(tok!==fvTok)return;
        const wb=X.read(buf,{type:"array"});body.innerHTML="";
        wb.SheetNames.slice(0,10).forEach(nm=>{const h=document.createElement("h4");h.className="fv-sh";h.textContent=nm;body.appendChild(h);
          const w=document.createElement("div");w.className="fv-xl";w.innerHTML=X.utils.sheet_to_html(wb.Sheets[nm],{header:"",footer:""});body.appendChild(w)});
        return;
      }
      let txt=await res.text();if(tok!==fvTok)return;
      if(t==="application/json"){try{txt=JSON.stringify(JSON.parse(txt),null,2)}catch(_){}}
      body.innerHTML="";const pre=document.createElement("pre");
      pre.textContent=txt.length>400000?txt.slice(0,400000)+"\n\n… (file is long; download it to see everything)":txt;
      body.appendChild(pre);
    }catch(_){
      if(tok===fvTok)body.innerHTML='<p class="hint">This file couldn’t be shown here.'+(downloads?' Use Download to open it on your device.':'')+'</p>';
    }
  }
  $("tab-files").addEventListener("click",async e=>{
    const row=e.target.closest("li[data-row]");
    if(row&&!e.target.closest("button,a,input,select,textarea,label")){
      const v=row.dataset.row,i=v.indexOf(":"),k=v.slice(0,i),id=v.slice(i+1);
      if(k==="folder"){curFolder=id;fileEdit=null;fileQuery="";$("file-search").value="";renderFiles()}
      else if(k==="open")openFile(id);
      else if(k==="view")openLb(null,id,false);
      else if(k==="dl")downloadFile(id);
      return;
    }
    const op=e.target.closest("[data-open]");if(op){openFile(op.dataset.open);return}
    const fo=e.target.closest("[data-folder]");
    if(fo){curFolder=fo.dataset.folder;fileEdit=null;fileQuery="";$("file-search").value="";renderFiles();return}
    const v=e.target.closest("button[data-view]");if(v){openLb(null,v.dataset.view,false);return}
    const d=e.target.closest("[data-dl]");if(d){downloadFile(d.dataset.dl);return}
    const ed=e.target.closest("[data-fedit]");if(ed){fileEdit=ed.dataset.fedit;renderFiles();const i=$("fe-name");if(i)i.focus();return}
    if(e.target.closest("[data-fcancel]")){fileEdit=null;renderFiles();return}
    if(e.target.closest("[data-fsave]")){
      const it=items.find(x=>x.id===fileEdit);if(!it)return;
      const name=$("fe-name").value.trim(),target=$("fe-folder").value;if(!name)return;
      const ok=await patch(it.id,it.kind==="folder"?{name,parent:target}:{name:keepExt(it.name,name),folder:target});
      if(ok){fileEdit=null;renderFiles()}
    }
  });
  function folderOptions(sel,excl){
    const fl=folders(),bad=new Set();
    if(excl){bad.add(excl);let ch=true;while(ch){ch=false;fl.forEach(f=>{if(!bad.has(f.id)&&bad.has(f.parent)){bad.add(f.id);ch=true}})}}
    const opts=[["","All files (top level)"]].concat(fl.filter(f=>!bad.has(f.id)).map(f=>[f.id,pathLabel(f.id)]).sort((a,b)=>a[1].localeCompare(b[1])));
    return opts.map(o=>'<option value="'+esc(o[0])+'"'+(o[0]===sel?' selected':'')+'>'+esc(o[1])+'</option>').join("");
  }
  /* seret & lepas: berkas/folder ke folder lain (atau ke jejak folder di atas) */
  let dragId=null;
  function isInside(target,folderId){let f=folders().find(x=>x.id===target),g=0;while(f&&g++<40){if(f.id===folderId)return true;f=f.parent?folders().find(x=>x.id===f.parent):null}return false}
  function dropTarget(el){
    const li=el.closest&&el.closest('#file-list li[data-row^="folder:"]');if(li)return {el:li,id:li.dataset.row.slice(7)};
    const cr=el.closest&&el.closest('#crumbs .crumb');if(cr)return {el:cr,id:cr.dataset.folder||""};
    return null;
  }
  function canDrop(id,target){
    const it=items.find(x=>x.id===id);if(!it)return false;
    if(it.kind==="folder")return target!==id&&!isInside(target,id)&&(it.parent||"")!==target;
    return (it.folder||"")!==target;
  }
  function clearDrop(){document.querySelectorAll(".drop-on").forEach(x=>x.classList.remove("drop-on"))}
  $("tab-files").addEventListener("dragstart",e=>{
    const li=e.target.closest&&e.target.closest("#file-list li[data-drag]");if(!li)return;
    dragId=li.dataset.drag;li.classList.add("dragging");
    try{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",dragId)}catch(_){}
  });
  $("tab-files").addEventListener("dragend",()=>{dragId=null;clearDrop();document.querySelectorAll("#file-list .dragging").forEach(x=>x.classList.remove("dragging"))});
  $("tab-files").addEventListener("dragover",e=>{
    if(!dragId)return;const t=dropTarget(e.target);
    clearDrop();if(!t||!canDrop(dragId,t.id))return;
    e.preventDefault();try{e.dataTransfer.dropEffect="move"}catch(_){}t.el.classList.add("drop-on");
  });
  $("tab-files").addEventListener("dragleave",e=>{const t=dropTarget(e.target);if(t&&!t.el.contains(e.relatedTarget))t.el.classList.remove("drop-on")});
  $("tab-files").addEventListener("drop",async e=>{
    if(!dragId)return;const t=dropTarget(e.target);clearDrop();
    const id=dragId;dragId=null;if(!t||!canDrop(id,t.id))return;
    e.preventDefault();
    const it=items.find(x=>x.id===id);if(!it)return;
    const ok=await patch(id,it.kind==="folder"?{parent:t.id}:{folder:t.id});
    const ID=document.documentElement.lang==="id",dest=t.id?(folders().find(f=>f.id===t.id)||{}).name:(ID?"Semua berkas":"All files");
    if(ok){$("file-status").textContent=(ID?"“"+it.name+"” dipindah ke ":"Moved “"+it.name+"” to ")+dest+".";setTimeout(()=>{if($("file-status").textContent.indexOf(it.name)>=0)$("file-status").textContent=""},4000)}
  });
  function editRow(it){
    const isF=it.kind==="folder";
    return '<li><div class="grow fedit"><label>Name<input id="fe-name" value="'+esc(it.name)+'" maxlength="200"></label><label>'+(isF?"Inside folder":"Folder")+'<select id="fe-folder">'+folderOptions(isF?(it.parent||""):(it.folder||""),isF?it.id:null)+'</select></label><div class="actions"><button type="button" class="ghost" data-fcancel>Cancel</button><button type="button" class="primary" data-fsave>Save</button></div></div></li>';
  }
  function folderRow(f){
    if(fileEdit===f.id)return editRow(f);
    const nF=byKind("file").filter(x=>x.folder===f.id).length,nS=folders().filter(x=>x.parent===f.id).length;
    const ID=document.documentElement.lang==="id",info=(nS?nS+" folder"+(nS>1&&!ID?"s":"")+" · ":"")+nF+(ID?" berkas":" file"+(nF===1?"":"s"));
    return '<li class="mid rowlink" draggable="true" data-drag="'+esc(f.id)+'" data-row="folder:'+esc(f.id)+'"><span class="ftile fold" aria-hidden="true">'+FOLDER_SVG+'</span><div class="grow"><button type="button" class="linkbtn" data-folder="'+esc(f.id)+'">'+esc(f.name)+'</button><div class="meta"><span>'+info+'</span>'+(fileQuery?'<span>in '+esc(pathLabel(f.parent))+'</span>':'')+'</div></div><div class="row-actions"><button class="ghost" data-fedit="'+esc(f.id)+'">Edit</button>'+(!nF&&!nS?'<button class="ghost danger" data-del="'+esc(f.id)+'">Delete</button>':'')+'</div></li>';
  }
  function fileRow(f){
    if(fileEdit===f.id)return editRow(f);
    const img=String(f.type).startsWith("image/");
    const tile=img?'<button type="button" class="ftile" data-open="'+esc(f.id)+'" aria-label="Open '+esc(f.name)+'"><img src="/_blob/'+esc(f.asset)+'" alt="" loading="lazy"></button>':'<span class="ftile" aria-hidden="true" data-prev="'+esc(f.id)+'">'+esc(TLAB[f.type]||extOf(f.name).toUpperCase().slice(0,4)||"FILE")+'</span>';
    const act='open:'+f.id;
    return '<li class="mid'+(act?' rowlink':'')+'" draggable="true" data-drag="'+esc(f.id)+'"'+(act?' data-row="'+esc(act)+'"':'')+'>'+tile+'<div class="grow"><div class="ttl">'+esc(f.name)+'</div><div class="meta"><span class="mono">'+fmtSize(f.size||0)+'</span><span class="mono">'+esc(fmtDate(ymd(new Date(f.created||Date.now()))))+'</span>'+(fileQuery?'<span>in '+esc(pathLabel(f.folder))+'</span>':'')+'</div></div><div class="row-actions"><button class="ghost" data-open="'+esc(f.id)+'">Open</button>'+(downloads?'<button class="ghost" data-dl="'+esc(f.id)+'">Download</button>':'')+'<button class="ghost" data-fedit="'+esc(f.id)+'">Edit</button><button class="ghost danger" data-del="'+esc(f.id)+'">Delete</button></div></li>';
  }
  function renderFiles(){
    const fs=byKind("file"),fl=folders();
    $("c-files").textContent=fs.length;
    if(curFolder&&!fl.some(f=>f.id===curFolder))curFolder="";
    $("crumbs").innerHTML='<button type="button" class="crumb" data-folder="">All files</button>'+folderPath(curFolder).map(f=>'<span class="hint" aria-hidden="true">/</span><button type="button" class="crumb" data-folder="'+esc(f.id)+'">'+esc(f.name)+'</button>').join("");
    $("btn-upload").hidden=!assets;
    const el=$("file-list");
    if(!ready){el.innerHTML='<div class="empty">Loading files…</div>';return}
    if(!usageLoaded&&assets&&location.hash==="#files")refreshUsage();
    let subs,files;
    if(fileQuery){subs=fl.filter(f=>f.name.toLowerCase().includes(fileQuery));files=fs.filter(f=>f.name.toLowerCase().includes(fileQuery))}
    else{subs=fl.filter(f=>(f.parent||"")===curFolder);files=fs.filter(f=>(f.folder||"")===curFolder)}
    subs.sort((a,b)=>a.name.localeCompare(b.name));files.sort((a,b)=>(b.created||0)-(a.created||0));
    if(!subs.length&&!files.length){el.innerHTML='<div class="empty">'+(fileQuery?"No files or folders match your search.":curFolder?"This folder is empty. Upload files here or create a folder inside it.":"No files yet. Create folders and upload photos, PDFs, videos or text files, up to 50 MB each.")+'</div>';return}
    el.innerHTML='<ul class="list">'+subs.map(folderRow).join("")+files.map(fileRow).join("")+'</ul><p class="hint fdrag-hint">'+(document.documentElement.lang==="id"?"Tips: klik tahan berkas atau folder, lalu seret ke folder tujuan (atau ke nama folder di jejak atas untuk keluar dari folder).":"Tip: press and hold a file or folder, then drag it onto a folder (or onto a folder name in the path above to move it out).")+'</p>';filePreviews();
  }


  /* ---------- BACKUP ---------- */
  const KINDS=["ielts","task","project","pcost","dream","sub","link","fin","pay","file","folder","prefs","meta","sw","note","nfolder","btypes","budget","itypes","acct","menu"];
  /* cadangan mencakup SEMUA jenis data di akun, termasuk fitur baru (Excel, Basic English, Tabel, draf catatan, ikon aplikasi, dll.),
     jadi setiap fitur yang ditambahkan nanti otomatis ikut tanpa perlu mengubah daftar ini */
  const bkKind=k=>typeof k==="string"&&/^[A-Za-z][A-Za-z0-9_-]{0,40}$/.test(k)&&k!=="meta";
  const TYPE_EXT={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/gif":"gif","image/svg+xml":"svg","application/pdf":"pdf","video/mp4":"mp4","video/webm":"webm","text/plain":"txt","text/csv":"csv","text/markdown":"md","application/json":"json"};
  let pendingRestore=null,bkBusy=false;
  function loadLib(src,glob){
    if(window[glob])return Promise.resolve(window[glob]);
    return new Promise((res,rej)=>{const sc=document.createElement("script");sc.src=src;sc.onload=()=>window[glob]?res(window[glob]):rej({code:"lib"});sc.onerror=()=>rej({code:"lib"});document.head.appendChild(sc)});
  }
  const loadXLSX=()=>loadLib("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js","XLSX");
  const loadZip=()=>loadLib("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js","JSZip");
  function bkStatus(t){$("bk-status").textContent=t||""}
  function bkLock(on){bkBusy=on;["btn-export-zip","btn-export","btn-import","bk-go"].forEach(i=>{$(i).disabled=on})}
  function renderBackup(){
    const m=items.find(i=>i.kind==="meta");
    $("bk-last").textContent=!ready?"":(m&&m.lastBackup?"Last export: "+fmtDate(m.lastBackup)+(m.lastFull?" (full backup "+fmtDate(m.lastFull)+")":""):"No backup exported yet.");
  }
  function assetRefs(d){
    const r=[];
    if(Array.isArray(d.evidence))r.push(...d.evidence);
    if(d.kind==="dream"&&d.cover)r.push(d.cover);
    if(d.kind==="link"&&d.logo)r.push(d.logo);
    if(d.kind==="file"&&d.asset)r.push(d.asset);
    if(d.kind==="note"&&Array.isArray(d.images))r.push(...d.images);
    return r.filter(x=>typeof x==="string"&&/^[0-9a-f]{32}$/i.test(x));
  }
  function remapRefs(d,map){
    const c=JSON.parse(JSON.stringify(d));
    if(Array.isArray(c.evidence))c.evidence=c.evidence.map(x=>map[x]||x);
    if(c.kind==="dream"&&c.cover)c.cover=map[c.cover]||c.cover;
    if(c.kind==="link"&&c.logo)c.logo=map[c.logo]||c.logo;
    if(c.kind==="file"&&c.asset)c.asset=map[c.asset]||c.asset;
    if(c.kind==="note"&&Array.isArray(c.images))c.images=c.images.map(x=>map[x]||x);
    return c;
  }
  function readableSheets(add){
    const projs=byKind("project"),pname=id=>(projs.find(p=>p.id===id)||{}).name||"";
    add("Tasks",[["Task","Repeat","Due date","Priority","Project","Status","Streak"]].concat(byKind("task").map(t=>[t.title||"",REP[t.rep]||"",t.due||"",{1:"High",2:"Medium",3:"Low"}[t.prio||2],pname(t.project),doneNow(t)?(isRoutine(t)?NOWLAB[t.rep]:"Done"):"Open",isRoutine(t)?streakOf(t):""])));
    const costs=byKind("pcost");
    add("Projects",[["Project","Status","Progress %","Target date","Budget (Rp)","Spent (Rp)","Notes"]].concat(projs.map(p=>[p.name||"",STL[p.status]||p.status||"",p.progress||0,p.due||"",+p.budget||0,costs.filter(c=>c.proj===p.id).reduce((a,c)=>a+(+c.amount||0),0),p.notes||""])));
    add("Project costs",[["Project","Date","Item","Amount (Rp)","Photos"]].concat(costs.slice().sort(byDateDesc).map(c=>[pname(c.proj),c.date||"",c.note||"",+c.amount||0,(c.evidence||[]).length])));
    add("Dreams",[["Dream","Category","Target year","Status","Steps done","Steps total","Steps","Why it matters","Achieved on"]].concat(byKind("dream").map(d=>{const st=d.steps||[];return [d.title||"",d.cat||"",d.year||"",(DSTAT[d.status||"dream"]||DSTAT.dream)[0],st.filter(x=>x.done).length,st.length,st.map(x=>(x.done?"[x] ":"[ ] ")+x.t).join("\n"),d.why||"",d.achievedAt||""]})));
    add("Notes",[["Folder","Title","Note","Pinned","Done","Updated"]].concat(byKind("note").slice().sort((a,b)=>(b.updated||0)-(a.updated||0)).map(n=>[(byKind("nfolder").find(f=>f.id===n.folder)||{}).name||"",n.title||"",n.body||"",n.pinned?"Yes":"No",n.done?"Yes":"No",n.updated?ymd(new Date(n.updated)):""])));
    add("Renewals",[["Name","Ends on","Days left","Renews","Cost (Rp)","Notes"]].concat(byKind("sub").map(x=>[x.name||"",x.end||"",x.end?daysLeft(x.end):"",CYC[x.cycle||"month"]||"",+x.cost||0,x.note||""])));
    add("Links",[["Name","URL","Category","In shortcuts"]].concat(byKind("link").map(l=>[l.title||"",l.url||"",catOf(l),l.pinned?"Yes":"No"])));
    const fs=byKind("fin"),liabs=fs.filter(f=>f.type==="liabilitas");
    add("Assets",[["Group","Name","Date","Amount (Rp)","Notes"]].concat(fs.filter(f=>f.type==="aset").map(f=>[f.group||"",f.name||"",f.date||"",+f.amount||0,f.note||""])));
    add("Liabilities",[["Type","Name","Start date","Total debt (Rp)","Paid (Rp)","Remaining (Rp)","Monthly (Rp)","Due day","Notes"]].concat(liabs.map(l=>{const st=liabStats(l);return [l.ltype==="recurring"?"Recurring":"Debt",l.name||"",l.date||"",+l.amount||0,st.paid,st.rest,+l.installment||0,l.dueDay||"",l.note||""]})));
    const lname=id=>(liabs.find(l=>l.id===id)||{}).name||"";
    add("Installments",[["Liability","Date","Amount (Rp)","Description","Photos"]].concat(byKind("pay").slice().sort(byDateDesc).map(p=>[lname(p.liab),p.date||"",+p.amount||0,p.note||"",(p.evidence||[]).length])));
    add("Accounts",[["Name","Type","Opening balance (Rp)","Balance (Rp)","Notes"]].concat(accts().map(a=>[a.name||"",acctType(a.atype)[1],+a.opening||0,acctBal(a,fs),a.note||""])));
    {const an=id=>(acctById(id)||{}).name||"",cn=f=>{const c=fcat(txDir(f)==="in"?"inc":"exp",f.cat);return c?c.n:""};
    add("Records",[["Date","Type","Description","Category","Account","To account","Amount (Rp)","Notes"]].concat(fs.filter(isRec).sort(byDateDesc).map(f=>isTr(f)?[f.date||"","Transfer",f.name||"","",an(f.from),an(f.to),+f.amount||0,f.note||""]:[f.date||"",txDir(f)==="in"?"Income":"Expense",f.name||"",cn(f),an(f.acct),"",+f.amount||0,f.note||""])))}
    add("Stopwatch",[["Date","Name","Duration (min)","Laps"]].concat(byKind("sw").slice().sort(byDateDesc).map(x=>[x.date||"",x.name||"",Math.round((+x.ms||0)/6e3)/10,x.laps||0])));
    add("Files",[["Name","Folder","Type","Size (KB)","Uploaded"]].concat(byKind("file").map(f=>[f.name||"",pathLabel(f.folder),f.type||"",Math.round((f.size||0)/1024),f.created?ymd(new Date(f.created)):""])));
  }
  async function buildWorkbook(full){
    const X=await loadXLSX(),wb=X.utils.book_new();
    const add=(name,rows)=>X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(rows),name);
    add("About",[["Imperium backup"],["Exported on",today()],["Type",full?"Full backup (inside a .zip with photos and files)":"Data only (no photos or files)"],[],["To restore: open Imperium, go to Settings, then Backup, choose Restore from backup and pick "+(full?"the .zip file.":"this file.")],["Do not edit or delete the sheet named _backup. The other sheets are for reading."]]);
    readableSheets(add);
    const raw=[["id","kind","data (do not edit)"]];
    items.filter(i=>bkKind(i.kind)).forEach(i=>{
      const {id,...d}=i;const j=JSON.stringify(d),parts=[];
      for(let k=0;k<j.length;k+=30000)parts.push(j.slice(k,k+30000));
      raw.push([id,i.kind].concat(parts));
    });
    add("_backup",raw);
    return X.write(wb,{bookType:"xlsx",type:"array"});
  }
  function exportErr(e){
    const c=e&&e.code;
    return c==="declined"?"Export cancelled.":c==="extension_not_enabled"||c==="rejected_extension"?"This file type can’t be downloaded in this view.":c==="rate_limited"?"A download prompt is already open. Finish that one first.":c==="lib"?"Couldn’t load the export tool. Check your connection and try again.":c==="too_large"?"The backup is too large to save on this device. Try again from a laptop.":"Couldn’t create the backup. Try again.";
  }
  async function markExported(full){
    const m=items.find(i=>i.kind==="meta")||{};
    try{await col.doc("meta").set({kind:"meta",lastBackup:today(),lastFull:full?today():(m.lastFull||""),updated:Date.now()})}catch(_){}
  }
  $("btn-export").onclick=async()=>{
    if(bkBusy)return;
    if(!ready||!col){bkStatus("Wait until your data has loaded, then try again.");return}
    if(!downloads){bkStatus("Downloads aren’t available in this view.");return}
    bkLock(true);
    try{
      bkStatus("Preparing data backup…");
      const out=await buildWorkbook(false);
      await downloads.save({filename:"Imperium data "+today()+".xlsx",data:new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})});
      bkStatus("Data backup saved. Photos and files are not in this file; use the full backup for those.");
      await markExported(false);
    }catch(e){bkStatus(exportErr(e))}finally{bkLock(false)}
  };
  $("btn-export-zip").onclick=async()=>{
    if(bkBusy)return;
    if(!ready||!col){bkStatus("Wait until your data has loaded, then try again.");return}
    if(!downloads){bkStatus("Downloads aren’t available in this view.");return}
    bkLock(true);
    try{
      bkStatus("Preparing full backup…");
      const [JSZip,out]=await Promise.all([loadZip(),buildWorkbook(true)]);
      const zip=new JSZip();
      zip.file("Imperium data.xlsx",out);
      const ids=[...new Set(items.filter(i=>bkKind(i.kind)).flatMap(assetRefs))];
      const manifest={app:"Imperium",version:1,exported:today(),assets:{}};
      let miss=0,bytes=0;
      for(let i=0;i<ids.length;i++){
        bkStatus("Packing photos and files: "+(i+1)+" of "+ids.length+"…");
        try{
          const res=await fetch("/_blob/"+ids[i]);if(!res.ok)throw 0;
          const blob=await res.blob();
          const type=((res.headers.get("content-type")||blob.type||"").split(";")[0]||"").trim().toLowerCase();
          const path="assets/"+ids[i]+"."+(TYPE_EXT[type]||"bin");
          zip.file(path,blob,{compression:/^image\/|^video\//.test(type)?"STORE":"DEFLATE"});
          manifest.assets[ids[i]]={path,type};bytes+=blob.size;
        }catch(_){miss++}
      }
      zip.file("manifest.json",JSON.stringify(manifest));
      zip.file("README.txt","Imperium full backup, exported "+today()+".\r\nTo restore: open Imperium > Settings > Backup > Restore from backup, and choose this .zip file.\r\nThe Excel file inside can also be opened on its own to read your notes.\r\n");
      bkStatus("Compressing "+fmtSize(bytes)+"…");
      const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE"});
      await downloads.save({filename:"Imperium backup "+today()+".zip",data:blob});
      bkStatus("Full backup saved ("+fmtSize(blob.size)+", "+Object.keys(manifest.assets).length+" photos and files)."+(miss?" "+miss+" photo"+(miss>1?"s":"")+" could not be read and were left out.":""));
      await markExported(true);
    }catch(e){bkStatus(exportErr(e))}finally{bkLock(false)}
  };
  function parseBackupSheet(X,wb){
    const ws=wb.Sheets["_backup"];if(!ws)throw {msg:"This file isn’t an Imperium backup: the sheet named _backup is missing."};
    const rows=X.utils.sheet_to_json(ws,{header:1,raw:true,defval:""}).slice(1);
    const docs=[];let bad=0;
    for(const r of rows){
      const id=String(r[0]||"").trim(),kind=String(r[1]||"").trim();
      if(!id&&!kind)continue;
      if(!/^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(id)||id==="."||id===".."||!bkKind(kind)){bad++;continue}
      try{
        const d=JSON.parse(r.slice(2).map(x=>String(x)).join(""));
        if(!d||typeof d!=="object"||Array.isArray(d)||d.kind!==kind){bad++;continue}
        docs.push({id,data:d});
      }catch(_){bad++}
    }
    return {docs,bad};
  }
  $("btn-import").onclick=()=>{if(!bkBusy)$("import-file").click()};
  $("import-file").addEventListener("change",async()=>{
    const f=$("import-file").files&&$("import-file").files[0];$("import-file").value="";if(!f)return;
    if(!col||!ready){bkStatus("Wait until Imperium has connected, then choose the file again.");return}
    pendingRestore=null;$("bk-confirm").hidden=true;
    try{
      bkStatus("Reading backup…");
      const X=await loadXLSX();
      let wbData,zip=null,manifest=null,exported="";
      if(/\.zip$/i.test(f.name)){
        const JSZip=await loadZip();
        zip=await JSZip.loadAsync(await f.arrayBuffer());
        const xf=Object.values(zip.files).find(z=>!z.dir&&/\.xlsx$/i.test(z.name));
        if(!xf)throw {msg:"This .zip doesn’t contain an Imperium backup."};
        wbData=await xf.async("arraybuffer");
        const mf=zip.file("manifest.json");
        if(mf){try{manifest=JSON.parse(await mf.async("string"));exported=manifest.exported||""}catch(_){manifest=null}}
      }else wbData=await f.arrayBuffer();
      const {docs,bad}=parseBackupSheet(X,X.read(wbData,{type:"array"}));
      if(!docs.length)throw {msg:"No entries were found in this backup."};
      const refs=new Set(docs.flatMap(d=>assetRefs(d.data)));
      const inZip=manifest?[...refs].filter(id=>manifest.assets&&manifest.assets[id]&&zip.file(manifest.assets[id].path)).length:0;
      const have=new Set(items.map(i=>i.id)),over=docs.filter(d=>have.has(d.id)).length;
      let msg="Found "+docs.length+" entries"+(exported?" in a backup exported on "+fmtDate(exported):"");
      msg+=zip?(" and "+inZip+" photos and files"):"";
      msg+=". "+(over?over+" entries already exist here and will be replaced by the backup version. ":"")+"Nothing else in Imperium will be deleted.";
      if(!zip&&refs.size)msg+=" This is a data-only backup, so photos are reconnected only if they still exist in Imperium.";
      if(zip&&inZip&&!assets)msg+=" Photos can’t be uploaded in this view, so only the data will be restored.";
      if(bad)msg+=" "+bad+" damaged rows will be skipped.";
      $("bk-msg").textContent=msg;
      pendingRestore={docs,zip,manifest};$("bk-confirm").hidden=false;bkStatus("");
    }catch(e){
      bkStatus(e&&e.msg?e.msg:e&&e.code==="lib"?"Couldn’t load the restore tool. Check your connection and try again.":"Couldn’t read this file. Choose the .zip or .xlsx backup exported from Imperium.");
    }
  });
  $("bk-cancel").onclick=()=>{pendingRestore=null;$("bk-confirm").hidden=true;bkStatus("Restore cancelled.")};
  $("bk-go").onclick=async()=>{
    if(!pendingRestore||!col||bkBusy)return;
    const {docs,zip,manifest}=pendingRestore;pendingRestore=null;$("bk-confirm").hidden=true;
    bkLock(true);
    const map={};let upOk=0,upFail=0,kept=0;
    try{
      if(zip&&manifest&&manifest.assets&&assets){
        const ids=[...new Set(docs.flatMap(d=>assetRefs(d.data)))].filter(id=>manifest.assets[id]);
        for(let i=0;i<ids.length;i++){
          const id=ids[i],m=manifest.assets[id];
          bkStatus("Restoring photos and files: "+(i+1)+" of "+ids.length+"…");
          try{const h=await fetch("/_blob/"+id,{method:"HEAD"});if(h.ok){kept++;continue}}catch(_){}
          try{
            const zf=zip.file(m.path);if(!zf)throw 0;
            const type=TYPE_EXT[m.type]?m.type:"image/jpeg";
            const blob=new Blob([await zf.async("arraybuffer")],{type});
            const r=await assets.upload(blob,{type});
            map[id]=r.id;upOk++;
          }catch(e){upFail++;if(e&&e.code==="quota_or_state")break}
        }
      }
      let ok=0,fail=0,stop="";
      for(let i=0;i<docs.length;i++){
        if(i%5===0)bkStatus("Restoring entries: "+(i+1)+" of "+docs.length+"…");
        try{await col.doc(docs[i].id).set(remapRefs(docs[i].data,map));ok++}
        catch(e){fail++;const c=e&&e.code;if(c==="quota_exceeded"){stop=" Storage is full, so the restore stopped.";break}if(c==="invalid_argument"){stop=" You don’t have permission to save here.";break}if(c==="resource_exhausted")await new Promise(r=>setTimeout(r,1500))}
      }
      let msg="Restored "+ok+" of "+docs.length+" entries.";
      if(zip)msg+=" Photos and files: "+(upOk+kept)+" ready"+(upFail?", "+upFail+" could not be uploaded":"")+".";
      bkStatus(msg+(fail?" "+fail+" entries could not be restored.":"")+stop);
      refreshUsage();
    }finally{bkLock(false)}
  };

  /* ---------- OVERVIEW ---------- */
  /* Overview satu layar: Hari ini | Proyek + Masa aktif | Keuangan + Link */
  const OVI={
    today:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    proj:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></svg>',
    ren:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/></svg>',
    fin:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V11M10 20V5M16 20v-6M22 20H2"/></svg>',
    links:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>'
  };
  function ovLogo(l){
    const h=host(l.url),init=(l.title||h||"?").trim().charAt(0).toUpperCase();
    const bg='style="background:hsl('+hue(h)+',45%,42%);border-color:transparent"';
    let img="";
    if(l.logo)img='<img src="/_blob/'+esc(l.logo)+'" alt="" loading="lazy">';
    else if(/^https?:\/\//i.test(l.url||""))img='<img class="fav" src="https://www.google.com/s2/favicons?domain='+encodeURIComponent(h)+'&sz=64" alt="" loading="lazy">';
    return '<span class="logo" '+bg+' aria-hidden="true">'+img+esc(init)+'</span>';
  }
  document.addEventListener("error",e=>{const t=e.target;if(t&&t.tagName==="IMG"&&t.classList.contains("fav"))t.remove()},true);
  /* tren Rekap rutinitas di kartu Hari ini (kotak bisa diketuk) */
  function ovRecap(rs){
    if(!rs.length)return "";
    let h='<div class="ov-rc">';
    ["daily","weekly","monthly"].forEach(rep=>{
      const g=rs.filter(t=>t.rep===rep).sort((a,b)=>(a.created||0)-(b.created||0));if(!g.length)return;
      const keys=recapKeys(rep),cur=periodKey(rep);
      h+='<p class="ov-sub"><span><span>'+REP[rep]+'</span> · <span>'+RCLAB[rep]+'</span></span><span class="mono">'+g.filter(doneNow).length+' / '+g.length+'</span></p>';
      g.forEach(t=>{
        const log=new Set(t.log||[]);let on=0,tot=0;
        const cells=keys.map(k=>{
          const isCur=k===cur,d=log.has(k),na=keyEnded(rep,k,t.created);
          const c=d?"on":na?"na":"off";
          if(d||(!na&&!isCur)){tot++;if(d)on++}
          return '<i role="button" tabindex="0" data-rc="'+esc(t.id)+'|'+k+'" class="'+c+(isCur?" cur":"")+'" title="'+esc(keyLabel(rep,k))+(document.documentElement.lang==="id"?(d?" · selesai":" · belum"):(d?" · done":" · not done"))+'"></i>';
        }).join("");
        const rate=tot?Math.round(on/tot*100):0,st=streakOf(t);
        h+='<div class="ov-rc-row"><div class="ov-rc-top"><span class="ttl">'+esc(t.title)+'</span><span class="mono rc-rate '+(rate>=80?"t-ok":rate>=50?"t-warn":"t-crit")+'">'+(tot?rate+'%':'–')+'</span></div><div class="rc-cells">'+cells+'</div>'+(st?'<span class="mono ov-rc-st">'+TKT(st+'-'+UNIT[rep]+' streak','beruntun '+st+' '+{day:"hari",week:"minggu",month:"bulan"}[UNIT[rep]])+'</span>':'')+'</div>';
      });
    });
    return h+'</div>';
  }
  /* Ringkasan: kartu Hari ini pas untuk 3 tugas; lebih dari 3 baru bisa digulir */
  const OV_WIDE=matchMedia("(min-width:1100px) and (min-height:600px)");
  function fitToday(){
    const card=document.querySelector('#ov .ovc[data-a="today"]');if(!card)return;
    const body=card.querySelector(".ov-body");if(!body)return;
    if(!card.offsetParent)return;
    body.style.maxHeight="";
    if(!OV_WIDE.matches)return;
    const rows=body.querySelectorAll(".ov-rc-row");
    if(rows.length<=3)return;
    const b=body.getBoundingClientRect(),r=rows[3].getBoundingClientRect();
    body.style.maxHeight=Math.max(120,Math.round(r.top-b.top+body.scrollTop-4))+"px";
  }
  addEventListener("resize",()=>{clearTimeout(fitToday.t);fitToday.t=setTimeout(fitToday,120)});
  if(OV_WIDE.addEventListener)OV_WIDE.addEventListener("change",fitToday);
  addEventListener("hashchange",()=>{if((location.hash||"#overview")==="#overview")requestAnimationFrame(fitToday)});
  function renderOverview(){
    window.IMP_SET_DATE&&window.IMP_SET_DATE();
    const el=$("ov");
    if(!ready){el.innerHTML='<div class="empty">Loading your overview…</div>';return}
    const t0=today(),projs=byKind("project"),tasks=byKind("task");
    const card=(key,title,hash,body)=>'<article class="ovc" data-a="'+key+'"><div class="ov-h"><h3>'+OVI[key]+'<span>'+title+'</span></h3>'+(hash?'<a href="#'+hash+'">Open</a>':'')+'</div><div class="ov-body">'+body+'</div></article>';
    const kpi=(k,v)=>'<div class="kpi'+(String(v).replace(/<[^>]+>/g,"").length>9?' long':'')+'"><div class="k">'+k+'</div><div class="v">'+v+'</div></div>';

    /* today */
    const rs=tasks.filter(isRoutine);
    const k1=[];
    ["daily","weekly","monthly"].forEach(r=>{const g=rs.filter(t=>t.rep===r);if(g.length)k1.push(kpi(REP[r]+" routines",g.filter(doneNow).length+'<small> / '+g.length+'</small>'))});
    const open=tasks.filter(t=>!isRoutine(t)&&!t.done);
    const due=open.filter(t=>t.due&&t.due<=t0).sort((a,b)=>a.due.localeCompare(b.due));
    k1.push(kpi("Open to-dos",open.length));
    k1.push(kpi("Due today or late",'<span class="'+(due.length?'neg':'')+'">'+due.length+'</span>'));
    const pend=rs.filter(t=>!doneNow(t)).sort((a,b)=>(REPORD[a.rep]-REPORD[b.rep])||((a.prio||2)-(b.prio||2)));
    let todayList="";
    const ovTodo=t=>{
      const p=projs.find(x=>x.id===t.project),late=t.due&&t.due<t0,isT=t.due===t0;
      const tip=TKT("Not done · tap to mark done","Belum · ketuk untuk menandai selesai");
      return '<div class="ov-rc-row ov-td"><div class="ov-rc-top"><span class="ttl">'+esc(t.title)+'</span><i role="button" tabindex="0" data-tdone="'+esc(t.id)+'" class="off cur" title="'+esc(tip)+'" aria-label="'+esc(tip)+'"></i></div>'
        +'<div class="meta">'+PRIO_PILL[t.prio||2]+(t.due?'<span class="mono'+(late?' neg':'')+'">'+(late?TKT("Overdue · ","Terlambat · "):isT?TKT("Today · ","Hari ini · "):"")+esc(fmtDate(t.due))+'</span>':'')+(p?'<span class="acn">'+esc(p.name)+'</span>':'')+'</div></div>';
    };
    if(due.length)todayList+='<div class="ov-rc"><p class="ov-sub">Due today or overdue</p>'+due.slice(0,12).map(ovTodo).join("")+'</div>';
    const upc=open.filter(t=>t.due&&t.due>t0).sort((a,b)=>a.due.localeCompare(b.due));
    if(upc.length)todayList+='<div class="ov-rc"><p class="ov-sub">Coming up</p>'+upc.slice(0,6).map(ovTodo).join("")+'</div>';
    if(!todayList)todayList=tasks.length?'<p class="hint">All caught up for now.</p>':'<p class="hint">No tasks yet. Add tasks or daily routines in Tasks.</p>';
    let html=card("today","Today","tugas",ovRecap(rs)+todayList);

    /* projects */
    const act=projs.filter(p=>p.status==="Berjalan");
    const costs=byKind("pcost");
    const avg=act.length?Math.round(act.reduce((s,p)=>s+(p.progress||0),0)/act.length):0;
    let pb='<div class="kpis">'+kpi("In progress",act.length)+kpi("Average progress",avg+"%")+kpi("Done",projs.filter(p=>p.status==="Selesai").length)+'</div>';
    if(act.length){
      pb+='<div>'+act.map(p=>{
        const spent=costs.filter(c=>c.proj===p.id).reduce((s,c)=>s+(+c.amount||0),0),bud=+p.budget||0;
        const line=bud?'<span class="mono'+(spent>bud?' neg':'')+'"><span class="spent">'+rp(spent)+'</span> of '+rp(bud)+'</span>':(spent?'<span class="mono spent">'+rp(spent)+' spent</span>':'');
        return '<div class="ov-row"><div class="grow"><div class="ttl">'+esc(p.name)+'</div><div class="meta"><span class="mono">'+(p.progress||0)+'%</span>'+line+'</div><div class="bar"><i style="width:'+(p.progress||0)+'%"></i></div></div></div>';
      }).join("")+'</div>';
    }else pb+='<p class="hint">No projects in progress.</p>';
    html+=card("proj","Projects","proyek",pb);

    /* finance */
    const fs=byKind("fin"),liabs=fs.filter(f=>f.type==="liabilitas"),ym=t0.slice(0,7),day=+t0.slice(8,10);
    const A=fs.filter(f=>f.type==="aset").reduce((s,f)=>s+(+f.amount||0),0);
    const L=liabs.reduce((s,l)=>s+liabStats(l).rest,0),net=A-L;
    const txM=fs.filter(f=>isTx(f)&&(f.date||"").slice(0,7)===ym);
    const inM=txM.filter(f=>txDir(f)==="in").reduce((s,f)=>s+(+f.amount||0),0),outM=txM.filter(f=>txDir(f)==="out").reduce((s,f)=>s+(+f.amount||0),0);
    const unpaid=liabs.filter(l=>{const st=liabStats(l);return (st.rest>0||l.ltype==="recurring")&&!st.ps.some(p=>(p.date||"").slice(0,7)===ym)});
    let fb='<div class="kpis">'+kpi("Net worth",'<span class="'+(net<0?'neg':'')+'">'+(net<0?"−":"")+rp(Math.abs(net))+'</span>')+kpi("Remaining liabilities",'<span class="'+(L>0?"neg":"")+'">'+(L>0?"−":"")+rp(L)+'</span>')+kpi("In this month",'<span class="pos">+'+rp(inM)+'</span>')+kpi("Out this month",'<span class="neg">−'+rp(outM)+'</span>')+'</div>';
    if(unpaid.length){
      fb+='<div><p class="ov-sub">Installments not paid this month</p>'+unpaid.map(l=>{
        const late=l.dueDay&&day>l.dueDay;
        return '<div class="ov-row"><div class="grow"><div class="ttl">'+esc(l.name)+'</div><div class="meta">'+(l.installment?'<span class="mono">'+rp(l.installment)+'/month</span>':'')+(l.dueDay?'<span>Due on day '+l.dueDay+'</span>':'')+'</div></div>'+(late?'<span class="pill p-crit">Late</span>':'<span class="pill p-warn">Pending</span>')+'</div>';
      }).join("")+'</div>';
    }else if(liabs.length)fb+='<p class="hint">All installments are paid for this month.</p>';
    else if(!fs.length)fb+='<p class="hint">No finance entries yet.</p>';
    html+=card("fin","Finance","record",fb);

    /* lead time */
    const ID=document.documentElement.lang==="id";
    const ldn=byKind("sub").filter(x=>x.mode!=="up"&&x.end).sort((a,b)=>a.end.localeCompare(b.end));
    const lup=byKind("sub").filter(x=>x.mode==="up"&&x.start).sort((a,b)=>a.start.localeCompare(b.start));
    let rb="";
    if(ldn.length||lup.length){
      const soon=ldn.filter(x=>daysLeft(x.end)<=7).length;
      rb='<div class="kpis">'+kpi("Tracked",ldn.length+lup.length)+kpi("Due within 7 days",'<span class="'+(soon?'neg':'')+'">'+soon+'</span>')+'</div><div>'+ldn.map(x=>{
        const d=daysLeft(x.end),cls=d<=3?"t-crit":d<=7?"t-warn":"t-ok";
        const SP=(a,b)=>window.IMP_LTSPAN?IMP_LTSPAN(a,b):Math.abs(daysLeft(b)-daysLeft(a))+(ID?" hari":" days");
        const lab=d<0?SP(x.end,today())+(ID?" terlambat":" overdue"):d===0?(ID?"Habis hari ini":"Ends today"):SP(today(),x.end)+(ID?" lagi":" left");
        return '<div class="ov-row"><div class="grow"><div class="ttl">⏳ '+esc(x.name)+'</div><div class="meta"><span class="mono">'+(ID?"Habis ":"Ends ")+esc(fmtDate(x.end))+'</span></div></div><span class="mono '+cls+'" style="font-weight:600;white-space:nowrap">'+lab+'</span></div>';
      }).join("")+lup.map(x=>{
        const n=-daysLeft(x.start);
        return '<div class="ov-row"><div class="grow"><div class="ttl">📅 '+esc(x.name)+'</div><div class="meta"><span class="mono">'+(ID?"Sejak ":"Since ")+esc(fmtDate(x.start))+'</span></div></div><span class="mono" style="font-weight:600;white-space:nowrap">'+(window.IMP_LTSPAN?IMP_LTSPAN(x.start,today()):Math.abs(n)+(ID?" hari":" days"))+'</span></div>';
      }).join("")+'</div>';
    }else rb='<p class="hint">Nothing tracked yet.</p>';
    html+=card("ren","Lead time","masa-aktif",rb);

    /* links */
    const ol=byKind("link").sort((a,b)=>(a.created||0)-(b.created||0));
    let lb='<details class="ovl-add" id="ovl-add"'+(ovlOpen?' open':'')+'><summary><span class="ovl-plus">＋</span><span>Add link</span></summary><form class="ovl-form" id="ovl-form" autocomplete="off"><input id="ovl-url" maxlength="1000" inputmode="url" placeholder="Paste a link (https://…)" aria-label="Paste a link (https://…)" required><input id="ovl-name" maxlength="150" placeholder="Name (optional)" aria-label="Name (optional)"><button class="primary" type="submit">Add</button></form></details>';
    if(ol.length)lb+='<ul class="ovl-list">'+ol.map(l=>'<li><a href="'+esc(safeHref(l.url))+'" target="_blank" rel="noopener noreferrer" title="'+esc(l.url)+'">'+ovLogo(l)+'<span class="grow"><span class="t">'+esc(l.title)+'</span><span class="d">'+esc(host(l.url))+'</span></span></a><button type="button" class="ovl-x" data-ovl-del="'+esc(l.id)+'" aria-label="Remove link" title="Remove link">×</button></li>').join("")+'</ul>';
    else lb+='<p class="hint">No links yet. Tap Add link, paste the address and give it a name.</p>';
    html+=card("links","Links","",lb);

    /* jaga isi kotak link saat data diperbarui */
    const ae=document.activeElement,keep={u:$("ovl-url")?.value||"",n:$("ovl-name")?.value||"",f:ae&&el.contains(ae)?ae.id:"",s:ae&&ae.selectionStart,e:ae&&ae.selectionEnd};
    const sc=[...el.querySelectorAll(".ov-body")].map(b=>b.scrollTop);
    el.innerHTML=html;fitToday();
    el.querySelectorAll(".ov-body").forEach((b,i)=>{if(sc[i])b.scrollTop=sc[i]});
    if($("ovl-url")){$("ovl-url").value=keep.u;$("ovl-name").value=keep.n;if(keep.f&&$(keep.f)){const f=$(keep.f);f.focus({preventScroll:true});try{f.setSelectionRange(keep.s,keep.e)}catch(_){}}}
  }
  let ovlBusy=false,ovlOpen=false;
  $("ov").addEventListener("toggle",e=>{if(e.target.id==="ovl-add"){ovlOpen=e.target.open;if(ovlOpen){const u=$("ovl-url");if(u)u.focus({preventScroll:true})}}},true);
  $("ov").addEventListener("submit",async e=>{
    if(e.target.id!=="ovl-form")return;
    e.preventDefault();if(ovlBusy)return;
    const raw=$("ovl-url").value.trim();if(!raw)return;
    const url=normUrl(raw),title=$("ovl-name").value.trim()||host(url);
    ovlBusy=true;const b=e.target.querySelector("button");if(b)b.disabled=true;
    const ok=await save("link",null,{title,url,cat:"Overview",logo:"",pinned:false,ov:true});
    ovlBusy=false;
    if(ok){if($("ovl-url")){$("ovl-url").value="";$("ovl-name").value="";$("ovl-url").focus({preventScroll:true})}}
    const b2=$("ovl-form")&&$("ovl-form").querySelector("button");if(b2)b2.disabled=false;
  });
  $("ov").addEventListener("paste",e=>{
    if(e.target.id!=="ovl-url")return;
    setTimeout(()=>{const n=$("ovl-name"),u=$("ovl-url").value.trim();if(n&&u&&!n.value.trim()){n.value=host(normUrl(u));n.focus();n.select()}},0);
  });
  $("ov").addEventListener("click",e=>{const c=e.target.closest("[data-rc]");if(c&&window.IMP_RC){IMP_RC(c);return}const d=e.target.closest("[data-tdone]");if(d)tkTodo(d)});
  $("ov").addEventListener("keydown",e=>{const c=e.target.closest&&e.target.closest("[data-rc],[data-tdone]");if(c&&(e.key==="Enter"||e.key===" ")){e.preventDefault();if(c.dataset.rc){if(window.IMP_RC)IMP_RC(c)}else tkTodo(c)}});
  $("ov").addEventListener("click",e=>{
    const b=e.target.closest("[data-ovl-del]");if(!b)return;
    e.preventDefault();
    if(b.classList.contains("armed")){remove(b.dataset.ovlDel);return}
    b.classList.add("armed");b.textContent="?";b.title="Tap again to delete";
    setTimeout(()=>{if(b.isConnected){b.classList.remove("armed");b.textContent="×";b.title="Remove link"}},2500);
  });

  /* ---------- BUDGET (anggaran bulanan per tipe pengeluaran) ---------- */
  const BT_GROUPS=[
    ["Makanan","🍔 🍕 🍜 🍚 🍛 🍗 🥩 🐟 🍳 🥗 🍞 🥐 🍰 🍩 🍪 🍫 🍦 🍎 🍌 🥤 ☕ 🍵 🧃 🥛 🍺 🧋 🍱 🍢 🚬"],
    ["Belanja & rumah","🛒 🛍️ 🧺 🧴 🧼 🧻 🪥 🧹 🪣 🛋️ 🛏️ 🪑 🚿 🧯 🔑 🏠 🏡 🏘️ 🧱 🪚 🔨 🔧 🪛 💡 🔌 🔋 ⚡ 💧 🔥 🗑️"],
    ["Transport","⛽ 🚗 🏍️ 🛵 🚲 🚌 🚕 🚚 🚛 ✈️ 🚢 🚆 🛞 🅿️ 🛣️ 🧭"],
    ["Komunikasi & kerja","📶 📱 💻 🖥️ 🖨️ 📡 📺 🎧 📷 💼 📁 📝 ✏️ 📚 🎓 🏫 🧑‍💻 ⛏️ 🦺 ⚙️"],
    ["Kesehatan & diri","💊 🏥 🩺 🦷 👓 💉 🩹 🧘 🏋️ ⚽ 🏸 🏊 💇 💅 👕 👖 👗 👟 👜 ⌚ 💍 🧥"],
    ["Keluarga & sosial","👨‍👩‍👧 👶 🍼 🧸 🎒 ❤️ 💝 🎁 🎂 🎉 💐 🕌 ⛪ 🤲 🙏 🐈 🐕 🐔 🥚 🌱 🌴"],
    ["Hiburan","🎮 🎬 🎵 🎤 🎸 📖 🎨 🎣 🏕️ 🏖️ 🎟️ 🎯 🎲 🧩 🍿 📸 🌙"],
    ["Uang & tagihan","💰 💵 💳 🏦 🧾 📈 📉 💹 🪙 💸 🏷️ 📦 📌 ⭐ ✅ ❗"]];
  const BT_ICONS=[].concat(...BT_GROUPS.map(g=>g[1].split(" ")));
  let btPickFor=null;
  function btPicker(){
    let pk=document.getElementById("bt-pick");if(pk)return pk;
    pk=document.createElement("div");pk.id="bt-pick";pk.className="bt-pick";pk.hidden=true;pk.setAttribute("role","dialog");pk.setAttribute("aria-label","Pilih emoji");
    pk.innerHTML='<div class="bt-pick-h"><b>Pilih emoji</b><button type="button" class="ghost" data-pkx aria-label="Tutup">×</button></div><div class="bt-pick-b">'+BT_GROUPS.map(g=>'<div class="bt-pg"><span>'+g[0]+'</span><div>'+g[1].split(" ").map(i=>'<button type="button" data-pk="'+i+'">'+i+'</button>').join("")+'</div></div>').join("")+'</div>';
    document.body.appendChild(pk);
    pk.addEventListener("click",async e=>{
      if(e.target.closest("[data-pkx]")){pk.hidden=true;return}
      const b=e.target.closest("[data-pk]");if(!b)return;const ic=b.dataset.pk;pk.hidden=true;
      if(btPickFor&&btPickFor.id==="new"){$("ct-ic-"+btPickFor.set).value=ic;$("ct-ib-"+btPickFor.set).textContent=ic}
      else if(btPickFor){const pf=btPickFor;const list=catList(pf.set).map(t=>t.id===pf.id?Object.assign({},t,{i:ic}):t);await catSave(pf.set,list)}
    });
    document.addEventListener("keydown",e=>{if(e.key==="Escape")pk.hidden=true});
    document.addEventListener("click",e=>{if(!pk.hidden&&!pk.contains(e.target)&&!e.target.closest("[data-pkopen]"))pk.hidden=true},true);
    return pk;
  }
  function btOpenPick(forId,anchor,set){const pk=btPicker();btPickFor={id:forId,set:set||"exp"};pk.hidden=false;
    const r=anchor.getBoundingClientRect(),w=Math.min(340,innerWidth-16);pk.style.width=w+"px";
    pk.style.left=Math.max(8,Math.min(r.left,innerWidth-w-8))+"px";const top=r.bottom+6,h=Math.min(380,innerHeight*.6);
    pk.style.top=(top+h>innerHeight?Math.max(8,r.top-h-6):top)+"px";pk.style.maxHeight=h+"px"}
  const BT_DEF=[["🍔","Makan"],["🛒","Belanja bulanan"],["⚡","Listrik & air"],["📶","Internet & pulsa"],["⛽","Transport & BBM"],["🏠","Cicilan & rumah"],["💊","Kesehatan"],["🎮","Hiburan"],["📦","Lain-lain"]];
  const nextMonth=()=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")};
  const shiftMonth=(m,n)=>{let [y,mm]=m.split("-").map(Number);mm+=n;while(mm>12){mm-=12;y++}while(mm<1){mm+=12;y--}return y+"-"+String(mm).padStart(2,"0")};
  let bgMonth=nextMonth();
  function btList(){return catList("exp")}
  async function btSave(list){return catSave("exp",list)}
  function bgDoc(m){return items.find(i=>i.id==="budget-"+m)}
  /* Kategori yang tampil di tabel Anggaran dipilih lewat "+ Tambah expense" (bukan otomatis semua kategori) */
  function bgSel(){
    const d=items.find(i=>i.id==="budget-sel");if(d&&Array.isArray(d.sel))return d.sel;
    const used=new Set();items.forEach(i=>{if(i.kind==="budget"&&i.lines)Object.keys(i.lines).forEach(k=>{if(+i.lines[k])used.add(k)})});
    return btList().map(t=>t.id).filter(id=>used.has(id));
  }
  async function bgSetSel(sel){return save("budget","budget-sel",{sel:sel})}
  function renderBgPick(){
    const el=$("bg-pick");if(!el)return;const sel=new Set(bgSel()),av=btList().filter(t=>!sel.has(t.id));
    el.innerHTML=av.length?av.map(t=>'<button type="button" class="bg-pk" data-bgpk="'+esc(t.id)+'"><span class="bt-i">'+esc(t.i)+'</span> <span class="catn">'+esc(t.n)+'</span> <b>+</b></button>').join(""):'<span class="hint">'+(btList().length?"All expense categories are already in the budget.":"No expense categories yet. Create one in Category.")+'</span>';
  }
  function renderBudget(){
    if(!$("bg-month"))return;
    if($("bg-month").value!==bgMonth)$("bg-month").value=bgMonth;
    const allT=btList(),selS=new Set(bgSel()),types=allT.filter(t=>selS.has(t.id));renderBgPick();
    if($("bg-chips"))$("bg-chips").innerHTML=types.length?types.map(t=>'<span class="pill p-mute"><span class="bt-i">'+esc(t.i)+'</span> <span class="catn">'+esc(t.n)+'</span></span>').join(""):'<span class="hint">No expense types yet.</span>';
    if(!ready){$("bg-table").innerHTML='<div class="empty">Loading…</div>';return}
    const doc=bgDoc(bgMonth),lines=(doc&&doc.lines)||{};
    const out=byKind("fin").filter(f=>isTx(f)&&txDir(f)==="out"&&(f.date||"").slice(0,7)===bgMonth);
    const spentBy={};let untyped=0;
    out.forEach(f=>{const a=+f.amount||0;if(f.cat&&types.some(t=>t.id===f.cat))spentBy[f.cat]=(spentBy[f.cat]||0)+a;else untyped+=a});
    const totB=types.reduce((s,t)=>s+(+lines[t.id]||0),0),totS=out.reduce((s,f)=>s+(+f.amount||0),0),rem=totB-totS;
    const [y,mm]=bgMonth.split("-");
    $("bg-sum").innerHTML='<div class="stat"><div class="k">Total budget</div><div class="v">'+rp(totB)+'</div><div class="s">'+BLN[+mm-1]+' '+y+'</div></div><div class="stat"><div class="k">Spent</div><div class="v neg">'+rp(totS)+'</div></div><div class="stat net"><div class="k">Remaining</div><div class="v'+(rem<0?' neg':'')+'">'+(rem<0?"−":"")+rp(Math.abs(rem))+'</div></div>';
    if(!types.length){$("bg-table").innerHTML='<div class="empty">No expenses in the budget yet. Tap “+ Add expense” to choose from your categories.</div>';return}
    const keep=document.activeElement&&document.activeElement.dataset&&document.activeElement.dataset.bgin;
    let rows=types.map(t=>{
      const b=+lines[t.id]||0,s=spentBy[t.id]||0,p=b?Math.min(100,Math.round(s/b*100)):(s?100:0),over=b&&s>b;
      return '<tr><td><span class="bt-i">'+esc(t.i)+'</span> <span class="catn">'+esc(t.n)+'</span><button type="button" class="bg-rm" data-bgrm="'+esc(t.id)+'" title="Remove from budget" aria-label="Remove from budget">×</button></td><td class="r"><input class="bg-in mono" inputmode="numeric" data-bgin="'+esc(t.id)+'" value="'+(b?fmtIn(b):"")+'" placeholder="0" aria-label="Budget (Rp)"></td><td class="r mono spent">'+rp(s)+'</td><td class="r mono'+(over?' neg':'')+'">'+(b?(b-s<0?"−":"")+rp(Math.abs(b-s)):"–")+'</td><td class="bg-barc"><div class="bar'+(over?' over':' ok')+'"><i style="width:'+p+'%"></i></div></td></tr>';
    }).join("");
    if(untyped)rows+='<tr class="bg-untyped"><td>Other spending (not in budget)</td><td></td><td class="r mono">'+rp(untyped)+'</td><td></td><td></td></tr>';
    $("bg-table").innerHTML='<div class="ptbl-wrap"><table class="ptbl bg-tbl"><thead><tr><th>Type</th><th class="r">Budget (Rp)</th><th class="r">Spent</th><th class="r">Remaining</th><th></th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr><td>Total</td><td class="r mono">'+rp(totB)+'</td><td class="r mono spent">'+rp(totS)+'</td><td class="r mono'+(rem<0?' neg':'')+'">'+(rem<0?"−":"")+rp(Math.abs(rem))+'</td><td></td></tr></tfoot></table></div><p class="hint" id="bg-msg">Spending is taken from expense records in Record for this month.</p>';
    if(keep){const x=document.querySelector('[data-bgin="'+keep+'"]');if(x){x.focus();try{x.setSelectionRange(x.value.length,x.value.length)}catch(_){}}}
  }
  if($("bg-month")){
    $("bg-month").addEventListener("change",e=>{if(e.target.value){bgMonth=e.target.value;renderBudget()}});
    $("bg-next").onclick=()=>{bgMonth=nextMonth();renderBudget()};
    $("bg-copy").onclick=async()=>{const prev=bgDoc(shiftMonth(bgMonth,-1));if(!prev||!prev.lines){$("bg-msg")&&($("bg-msg").textContent="Last month has no budget.");return}
      if(await save("budget","budget-"+bgMonth,{month:bgMonth,lines:Object.assign({},prev.lines)})&&$("bg-msg"))$("bg-msg").textContent="Copied from last month."};
    $("bg-table").addEventListener("change",async e=>{const x=e.target.closest("[data-bgin]");if(!x)return;
      const v=parseAmt(x.value),doc=bgDoc(bgMonth),lines=Object.assign({},(doc&&doc.lines)||{});
      if(isNaN(v)||!v)delete lines[x.dataset.bgin];else lines[x.dataset.bgin]=v;
      await save("budget","budget-"+bgMonth,{month:bgMonth,lines})});
    $("bg-table").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches("[data-bgin]")){e.preventDefault();e.target.blur()}});
    $("bg-table").addEventListener("click",async e=>{const b=e.target.closest("[data-bgrm]");if(!b)return;
      if(b.dataset.arm!=="1"){b.dataset.arm="1";b.textContent=document.documentElement.lang==="id"?"Hapus?":"Remove?";b.classList.add("arm");setTimeout(()=>{if(b.isConnected){b.dataset.arm="";b.textContent="×";b.classList.remove("arm")}},2500);return}
      await bgSetSel(bgSel().filter(x=>x!==b.dataset.bgrm))});
    $("bg-pick")&&$("bg-pick").addEventListener("click",async e=>{const b=e.target.closest("[data-bgpk]");if(!b)return;b.disabled=true;
      const sel=bgSel().slice();if(!sel.includes(b.dataset.bgpk))sel.push(b.dataset.bgpk);await bgSetSel(sel)});
  }
  if($("bg-add")){
    const f=$("f-bgadd");
    const close=()=>{f.reset();$("ct-ic-bgx").value="📦";$("ct-ib-bgx").textContent="📦";f.hidden=true};
    $("bg-add").onclick=()=>{if(f.hidden){f.hidden=false;$("bg-add-name").focus()}else close()};
    $("bg-add-cancel").onclick=close;
    addEventListener("keydown",e=>{if(e.key==="Escape"&&!f.hidden&&!$("tab-budget").hidden&&!(document.getElementById("bt-pick")&&!document.getElementById("bt-pick").hidden)){e.preventDefault();e.stopImmediatePropagation();close()}},true);
    $("ct-ib-bgx").onclick=()=>btOpenPick("new",$("ct-ib-bgx"),"bgx");
    $("bg-add-amt").addEventListener("blur",e=>{const v=parseAmt(e.target.value);if(v>0)e.target.value=fmtIn(v)});
    f.addEventListener("submit",async e=>{
      e.preventDefault();const n=$("bg-add-name").value.trim();if(!n)return;
      const id="t"+Date.now().toString(36),list=catList("exp").slice();list.push({id,i:$("ct-ic-bgx").value||"📦",n});
      const sel=bgSel().slice();
      if(!await catSave("exp",list))return;
      sel.push(id);await bgSetSel(sel);
      const v=parseAmt($("bg-add-amt").value);
      if(v>0){const doc=bgDoc(bgMonth),lines=Object.assign({},(doc&&doc.lines)||{});lines[id]=v;await save("budget","budget-"+bgMonth,{month:bgMonth,lines})}
      close();
    });
  }
  /* ---------- PENGATURAN KATEGORI (income & expense) ---------- */
  ["exp","inc"].forEach(set=>{
    const f=$("f-cat-"+set),ul=$("ct-list-"+set),ib=$("ct-ib-"+set);
    if(!f||!ul||!ib)return;
    ib.onclick=()=>btOpenPick("new",ib,set);
    f.addEventListener("submit",async e=>{
      e.preventDefault();const n=$("ct-name-"+set).value.trim();if(!n)return;
      const list=catList(set).slice();
      list.push({id:CAT[set].pfx+Date.now().toString(36),i:$("ct-ic-"+set).value||"📦",n});
      if(await catSave(set,list)){$("ct-name-"+set).value="";$("ct-ic-"+set).value="📦";ib.textContent="📦"}
    });
    ul.addEventListener("click",async e=>{
      const ic=e.target.closest("[data-ctic]");if(ic){btOpenPick(ic.dataset.ctic,ic,set);return}
      const rn=e.target.closest("[data-ctren]");
      if(rn){ctEdit=set+":"+rn.dataset.ctren;renderCategories();const x=ul.querySelector("[data-ctin]");if(x){x.focus();x.select()}return}
      const b=e.target.closest("[data-ctdel]");if(!b)return;
      if(!b.classList.contains("armed")){b.classList.add("armed");b.textContent="?";setTimeout(()=>{if(b.isConnected){b.classList.remove("armed");b.textContent="×"}},2500);return}
      await catSave(set,catList(set).filter(t=>t.id!==b.dataset.ctdel));
    });
    ul.addEventListener("keydown",e=>{
      const x=e.target.closest&&e.target.closest("[data-ctin]");if(!x)return;
      if(e.key==="Enter"){e.preventDefault();x.blur()}
      else if(e.key==="Escape"){x.dataset.cancel="1";x.blur()}
    });
    ul.addEventListener("focusout",async e=>{
      const x=e.target.closest&&e.target.closest("[data-ctin]");if(!x)return;
      const id=x.dataset.ctin,n=x.value.trim(),cancel=x.dataset.cancel==="1";ctEdit=null;
      const cur=catList(set).find(t=>t.id===id);
      if(!cancel&&n&&cur&&cur.n!==n)await catSave(set,catList(set).map(t=>t.id===id?Object.assign({},t,{n}):t));
      else renderCategories();
    });
  });

  /* ---------- LIMIT CLAUDE (diisi sendiri; halaman tidak bisa membaca pemakaian Claude) ---------- */
  let limOpen=false;
  function limDur(ms){const m=Math.max(0,Math.round(ms/6e4)),d=Math.floor(m/1440),h=Math.floor(m%1440/60),mi=m%60;return d?d+"h "+h+"j":h?h+"j "+mi+"m":mi+"m"}
  function limPart(key,lab,o){
    const pct=Math.max(0,Math.min(100,+(o&&o.pct)||0)),r=o&&o.reset?new Date(o.reset):null,now=Date.now();
    const passed=r&&r.getTime()<=now,show=passed?0:pct,cls=show>=90?"crit":show>=70?"warn":"ok";
    const tip=r?(passed?'<span class="lm-t">reset</span>':'<span class="lm-t"><span>resets in</span> '+limDur(r-now)+'</span>'):'';
    return '<span class="lm-p lm-'+cls+'"><b>'+lab+'</b><span class="lm-bar"><i style="width:'+show+'%"></i></span><span class="mono">'+(o?show+'%':'–')+'</span>'+tip+'</span>';
  }
  function renderLimit(){
    const el=$("climit");if(!el)return;
    const d=items.find(i=>i.id==="climit")||{};
    if(d.w&&d.w.reset){let r=new Date(d.w.reset).getTime();if(r<=Date.now()){while(r<=Date.now())r+=7*864e5;d.w=Object.assign({},d.w,{pct:0,reset:new Date(r).toISOString()})}}
    const toLocal=s=>{if(!s)return"";const t=new Date(s);if(isNaN(t))return"";const p=n=>String(n).padStart(2,"0");return t.getFullYear()+"-"+p(t.getMonth()+1)+"-"+p(t.getDate())+"T"+p(t.getHours())+":"+p(t.getMinutes())};
    el.innerHTML='<button type="button" class="lm-chip" id="lm-open" title="Set Claude limit" aria-expanded="'+limOpen+'"><span class="lm-sep">|</span><span class="lm-ttl">✳ Claude limit</span>'+limPart("s","5-hour",d.s)+limPart("w","Weekly",d.w)+(d.s||d.w?'':'<span class="hint">Not filled in yet · tap to fill in</span>')+'</button>'
      +(limOpen?'<form class="lm-form" id="lm-form" autocomplete="off"><b>Set Claude limit</b>'
        +'<div class="lm-g"><span>5-hour</span><label>Used (%)<input type="number" min="0" max="100" id="lm-sp" value="'+(d.s?d.s.pct:"")+'"></label><label>Resets at<input type="datetime-local" id="lm-sr" value="'+toLocal(d.s&&d.s.reset)+'"></label></div>'
        +'<div class="lm-g"><span>Weekly</span><label>Used (%)<input type="number" min="0" max="100" id="lm-wp" value="'+(d.w?d.w.pct:"")+'"></label><label>Resets at<input type="datetime-local" id="lm-wr" value="'+toLocal(d.w&&d.w.reset)+'"></label></div>'
        +'<p class="hint">Copy the numbers from Claude Settings › Usage. A page can\'t read your Claude usage by itself.</p><a class="lm-link" href="https://claude.ai/settings/usage" target="_blank" rel="noopener">Open Claude usage page ↗</a>'
        +'<div class="actions"><button type="button" class="ghost" id="lm-x">Cancel</button><button class="primary" type="submit">Save</button></div></form>':'');
  }
  if($("climit")){
    $("climit").addEventListener("click",e=>{if(e.target.closest("#lm-open")){limOpen=!limOpen;renderLimit();return}if(e.target.closest("#lm-x")){limOpen=false;renderLimit()}});
    $("climit").addEventListener("submit",async e=>{e.preventDefault();
      const g=(p,r)=>{const pv=$(p).value,rv=$(r).value;if(pv===""&&!rv)return null;return {pct:Math.max(0,Math.min(100,+pv||0)),reset:rv?new Date(rv).toISOString():""}};
      const s=g("lm-sp","lm-sr"),w=g("lm-wp","lm-wr");
      if(await save("climit","climit",{s,w})){limOpen=false;renderLimit()}});
    setInterval(()=>{if(!limOpen)renderLimit()},60000);
  }

  /* ---------- PROJECTS ---------- */
  const PL=["New project","Edit project","Add project"];
  let projBusy=false,photoTarget=null;
  async function uploadImgs(files,into,say){
    for(let i=0;i<files.length;i++){
      say("Uploading photo "+(i+1)+" of "+files.length+"…");
      const b=await prepImage(files[i],2000,"image/jpeg",1.5e6);
      const r=await assets.upload(b,{type:b.type||"image/jpeg"});
      into.push(r.id);
    }
  }
  function projReset(){$("f-proj").reset();setEditing("proj",null,PL);$("proj-photo-hint").hidden=true;$("proj-form-status").textContent=""}
  $("f-proj").addEventListener("submit",async e=>{
    e.preventDefault(); if(projBusy)return;
    const name=$("proj-name").value.trim();if(!name)return;
    let prog=Math.max(0,Math.min(100,+$("proj-prog").value||0));
    const status=$("proj-status").value; if(status==="Selesai")prog=100;
    const bud=parseAmt($("proj-budget").value);
    const id=editing.proj,prev=id?items.find(i=>i.id===id):null;
    const files=assets?[...($("proj-photos").files||[])]:[];
    const up=[],say=t=>{$("proj-form-status").textContent=t};
    projBusy=true;$("proj-submit").disabled=true;
    try{
      await uploadImgs(files,up,say);
      if(files.length)say("Saving…");
      const data={name,status,progress:prog,due:$("proj-due").value||"",budget:isNaN(bud)?0:bud,notes:$("proj-notes").value.trim(),url:$("proj-url").value.trim()?normUrl($("proj-url").value):"",evidence:((prev&&prev.evidence)||[]).concat(up)};
      if(status==="Selesai")data.doneOn=(prev&&prev.status==="Selesai"&&prev.doneOn)||today();
      const ok=await save("project",id,data);
      if(ok)projReset();else{await delAssets(up);say("")}
    }catch(err){await delAssets(up);say(assetErr(err))}
    finally{projBusy=false;$("proj-submit").disabled=false}
  });
  $("proj-cancel").onclick=projReset;
  $("proj-photo-input").addEventListener("change",async e=>{
    const files=[...(e.target.files||[])],pid=photoTarget;e.target.value="";
    if(!files.length||!pid||!assets)return;
    const st=$("proj-photo-status"),up=[];
    try{
      await uploadImgs(files,up,t=>{st.textContent=t});
      const p=items.find(i=>i.id===pid);if(!p){await delAssets(up);st.textContent="";return}
      if(await patch(pid,{evidence:(p.evidence||[]).concat(up)})){expanded.add("pd-"+pid);st.textContent="Photos added.";setTimeout(()=>{if(st.textContent==="Photos added.")st.textContent=""},2500)}
      else{await delAssets(up);st.textContent=""}
    }catch(err){await delAssets(up);st.textContent=assetErr(err)}
  });
  $("proj-list").addEventListener("click",e=>{
    const xb=e.target.closest("button[data-pexp]");
    if(xb){const k="pd-"+xb.dataset.pexp;expanded.has(k)?expanded.delete(k):expanded.add(k);renderProjects();return}
    const ph=e.target.closest("button[data-pphoto]");
    if(ph){photoTarget=ph.dataset.pphoto;$("proj-photo-input").click();return}
    const cb=e.target.closest("button[data-cost]");
    if(cb){expanded.add("pd-"+cb.dataset.cost);openEnt("cost",cb.dataset.cost,null);return}
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const p=items.find(i=>i.id===b.dataset.edit);if(!p)return;
    if(p.kind==="pcost"){expanded.add("pd-"+p.proj);openEnt("cost",p.proj,p);return}
    $("proj-name").value=p.name||"";$("proj-status").value=p.status||"Berjalan";$("proj-prog").value=p.progress||0;$("proj-due").value=p.due||"";$("proj-budget").value=fmtIn(p.budget);$("proj-notes").value=p.notes||"";$("proj-url").value=p.url||"";$("proj-photos").value="";
    $("proj-photo-hint").hidden=!(p.evidence&&p.evidence.length&&assets);
    setEditing("proj",p.id,PL);$("proj-name").focus();
  });
  const ORDER={"Berjalan":0,"Ide":1,"Ditunda":2,"Selesai":3};
  const STL={"Berjalan":"In progress","Ide":"Idea","Ditunda":"On hold","Selesai":"Done"};
  const SCLS={"Berjalan":"p-acc","Ide":"p-mute","Ditunda":"p-warn","Selesai":"p-ok"};
  function renderProjects(){
    parkEnt("cost");
    const lastEd=x=>+x.updated||+x.created||0;
    const ps=byKind("project").sort((a,b)=>(ORDER[a.status]??9)-(ORDER[b.status]??9)||lastEd(b)-lastEd(a));
    const tasks=byKind("task"),costs=byKind("pcost");
    $("c-proyek").textContent=ps.filter(p=>p.status!=="Selesai").length;
    const el=$("proj-list");
    if(!ready){el.innerHTML='<div class="empty">Loading projects…</div>';return}
    if(!ps.length){el.innerHTML='<div class="empty">No projects yet. Add what you’re working on, and set a budget if you want to track its cost.</div>';return}
    const t0=today();
    const rs=n=>{n=Math.round(n||0);const a=Math.abs(n),f=(v,u)=>"Rp "+(+v.toFixed(v<10?2:1)).toLocaleString("id-ID")+" "+u;return a>=1e9?f(a/1e9,"M"):a>=1e6?f(a/1e6,"jt"):a>=1e4?f(a/1e3,"rb"):rp(a)};
    const money=(n,neg)=>'<span title="'+(neg?"−":"")+rp(Math.abs(n))+'">'+(neg?"−":"")+rs(Math.abs(n))+'</span>';
    const thumb=(p,a)=>'<button class="thumb" data-ev="'+esc(a)+'" data-p="'+esc(p.id)+'" aria-label="View photo"><img src="/_blob/'+esc(a)+'" alt="" loading="lazy"></button>';
    const stat=p=>{
      const cs=costs.filter(c=>c.proj===p.id).sort(byDateDesc);
      const spent=cs.reduce((s,c)=>s+(+c.amount||0),0),bud=+p.budget||0;
      return {cs,spent,bud};
    };
    function row(p,done){
      const mine=tasks.filter(t=>t.project===p.id),open=mine.filter(t=>!t.done).length;
      const late=p.due&&p.status!=="Selesai"&&p.due<t0;
      const prog=p.progress||0,{cs,spent,bud}=stat(p),rest=bud-spent;
      const cpct=bud>0?Math.round(spent/bud*100):0;
      const warn=[];
      if(bud>0&&spent>bud)warn.push('<span class="pill p-crit">Over budget</span>');
      else if(bud>0&&!done&&cpct>prog+10)warn.push('<span class="pill p-warn">Cost ahead of progress</span>');
      const ev=p.evidence||[];
      const open_=expanded.has("pd-"+p.id)||(ent&&ent.mode==="cost"&&ent.parent===p.id);
      const photos='<div class="thumbs">'+ev.slice(0,3).map(a=>thumb(p,a)).join("")+(ev.length>3?'<span class="pmore">+'+(ev.length-3)+'</span>':'')+(assets?'<button type="button" class="paddph" data-pphoto="'+esc(p.id)+'" aria-label="Add photo" title="Add photo">+</button>':(ev.length?'':'<span class="hint">—</span>'))+'</div>';
      const href=p.url&&safeHref(p.url)!=="#"?safeHref(p.url):"";
      const nm='<div class="ttl">'+esc(p.name)+(href?'<svg class="plink-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>':'')+'</div>';
      let h='<tr class="prow'+(done?' done-row':'')+(href?' has-link':'')+'">'
        +'<td><div class="pname"><button type="button" class="pexp" data-pexp="'+esc(p.id)+'" aria-expanded="'+open_+'" aria-label="Show details">▶</button><div class="grow">'+(href?'<a class="plink" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer" title="Open '+esc(host(href))+'">'+nm+'</a>':nm)+((!done||warn.length)?'<div class="pills">'+(done?'':'<span class="pill '+(SCLS[p.status]||"p-mute")+'">'+esc(STL[p.status]||p.status)+'</span>')+warn.join("")+'</div>':'')+'</div></div></td>'
        +(done?'':'<td><div class="pprog"><div class="bar" role="progressbar" aria-valuenow="'+prog+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+prog+'%"></i></div><span class="mono">'+prog+'%</span></div></td>')
        +'<td class="mono nw'+(late?' neg':'')+'">'+(done?(p.doneOn?esc(fmtDate(p.doneOn)):(p.due?esc(fmtDate(p.due)):'—')):(p.due?esc(fmtDate(p.due)):'—'))+'</td>'
        +'<td class="mono nw">'+(mine.length?(done?mine.length:open+' / '+mine.length):'—')+'</td>'
        +'<td class="r amt">'+(bud?money(bud):'—')+'</td>'
        +'<td class="r amt spent">'+(spent?money(spent):'—')+'</td>'
        +'<td class="r amt'+(bud&&rest<0?' neg':'')+'">'+(bud?money(rest,rest<0):'—')+'</td>'
        +'<td>'+photos+'</td>'
        +'<td>'+rowActs(p.id)+'</td></tr>';
      if(open_){
        const cols=done?8:9;
        h+='<tr class="pdet"><td colspan="'+cols+'"><div class="pdet-grid">'
          +'<div class="pdet-col">'+(p.url?'<h4>Link</h4><a class="lnk" href="'+esc(safeHref(p.url))+'" target="_blank" rel="noopener noreferrer">'+esc(host(p.url))+'</a>':'')+'<h4>Notes</h4>'+(p.notes?'<p class="pnotes">'+esc(p.notes)+'</p>':'<p class="hint">No notes.</p>')
          +'<h4>Project photos</h4><div class="pgal">'+ev.map(a=>thumb(p,a)).join("")+(assets?'<button type="button" class="paddph" data-pphoto="'+esc(p.id)+'">+ Add photos</button>':(ev.length?'':'<p class="hint">No photos yet.</p>'))+'</div></div>'
          +'<div class="pdet-col"><h4>Costs</h4>'+(cs.length?entryList(p.id,cs,6,"costs"):'<p class="hint">No costs logged yet.</p>')
          +'<div id="slot-'+esc(p.id)+'"></div>'
          +(ent&&ent.mode==="cost"&&ent.parent===p.id?'':'<div><button class="soft" data-cost="'+esc(p.id)+'">+ Log cost</button></div>')
          +'</div></div></td></tr>';
      }
      return h;
    }
    function table(list,done,title){
      const tot=list.reduce((a,p)=>{const x=stat(p);a.b+=x.bud;a.s+=x.spent;return a},{b:0,s:0});
      const head='<tr><th>Project</th>'+(done?'':'<th>Progress</th>')+'<th>'+(done?'Finished':'Target')+'</th><th>Tasks</th><th class="r">Budget</th><th class="r">Spent</th><th class="r">Remaining</th><th>Photos</th><th></th></tr>';
      const rest=tot.b-tot.s;
      const foot=list.length>1?'<tfoot><tr><td>Total</td>'+(done?'':'<td></td>')+'<td></td><td></td><td class="r amt">'+(tot.b?money(tot.b):'—')+'</td><td class="r amt">'+(tot.s?money(tot.s):'—')+'</td><td class="r amt'+(tot.b&&rest<0?' neg':'')+'">'+(tot.b?money(rest,rest<0):'—')+'</td><td></td><td></td></tr></tfoot>':'';
      return '<section class="ptbl-sec"><div class="ptbl-h"><h3>'+title+'</h3><span class="count">'+list.length+'</span></div><div class="ptbl-wrap"><table class="ptbl"><thead>'+head+'</thead><tbody>'+list.map(p=>row(p,done)).join("")+'</tbody>'+foot+'</table></div></section>';
    }
    const act=ps.filter(p=>p.status!=="Selesai"),fin=ps.filter(p=>p.status==="Selesai");
    el.innerHTML='<div class="fin-cols">'
      +(act.length?table(act,false,"Active projects"):'<div class="empty">No active projects. Add one with + New project.</div>')
      +(fin.length?table(fin,true,"Finished projects"):'')
      +'</div>';
    placeEnt("cost");
  }

  /* ---------- MASA AKTIF ---------- */
  const SL=["New lead time","Edit lead time","Add"];
  const LTL=(en,id)=>document.documentElement.lang==="id"?id:en;
  const ltMode=s=>s.mode==="up"?"up":"down";
  const ltCur=()=>(document.querySelector('input[name="lt-mode"]:checked')||{}).value||"down";
  function ltForm(){
    const up=ltCur()==="up";
    $("lt-end-l").hidden=up;$("lt-cyc-l").hidden=up;
    $("lt-start-t").textContent=up?LTL("Since date","Sejak tanggal"):LTL("Bought / start date (optional)","Tanggal beli / mulai (opsional)");
    $("sub-start").required=up;$("sub-end").required=!up;
    $("sub-name").placeholder=up?LTL("e.g. Unemployed since resigning","mis. Menganggur sejak resign"):LTL("e.g. Monthly data quota","mis. Kuota bulanan");
  }
  function ltAutoEnd(){if(ltCur()!=="down")return;const st=$("sub-start").value,c=$("sub-cycle").value;if(st&&c!=="once"&&(!$("sub-end").value||$("sub-end").dataset.auto==="1")){$("sub-end").value=addCycle(st,c);$("sub-end").dataset.auto="1"}}
  const ltReset=()=>{$("f-sub").reset();$("sub-end").dataset.auto="";ltForm()};
  function ltSpan(a,b){
    let m=0,cur=a;while(true){const n=addCycle(cur,"month");if(n>b)break;cur=n;m++}
    const d=Math.round(dayNum(b)-dayNum(cur)),y=Math.floor(m/12),mm=m%12,P=[];
    if(y)P.push(y+LTL(y>1?" years":" year"," tahun"));if(mm)P.push(mm+LTL(mm>1?" months":" month"," bulan"));if(d||!P.length)P.push(d+LTL(d===1?" day":" days"," hari"));
    return P.join(" ");
  }
  function ltParts(a,b){/* [[n,unit],...] */
    if(a>b){const t=a;a=b;b=t}
    let m=0,cur=a;while(true){const n=addCycle(cur,"month");if(n>b)break;cur=n;m++}
    const d=Math.round(dayNum(b)-dayNum(cur)),y=Math.floor(m/12),mm=m%12,P=[];
    if(y)P.push([y,LTL(y>1?"years":"year","tahun")]);if(mm)P.push([mm,LTL(mm>1?"months":"month","bulan")]);if(d||!P.length)P.push([d,LTL(d===1?"day":"days","hari")]);
    return P;
  }
  const ltBig=(a,b)=>'<span class="lt-big">'+ltParts(a,b).map(p=>'<span><b>'+p[0]+'</b> '+p[1]+'</span>').join("")+'</span>';
  window.IMP_LTSPAN=(a,b)=>{if(a>b){const t=a;a=b;b=t}return ltSpan(a,b)};
  const CYC={month:"Monthly",year:"Yearly",once:"One-time"};
  $("f-sub").addEventListener("submit",async e=>{
    e.preventDefault();
    const mode=ltCur(),name=$("sub-name").value.trim(),start=$("sub-start").value,end=mode==="up"?"":$("sub-end").value;
    if(!name||(mode==="up"&&!start)||(mode==="down"&&!end))return;
    if(mode==="down"&&start&&start>end){$("sub-end").setCustomValidity(LTL("Due date must be on or after the start date","Due date harus sama atau setelah tanggal mulai"));$("sub-end").reportValidity();setTimeout(()=>$("sub-end").setCustomValidity(""),2500);return}
    const c=parseAmt($("sub-cost").value);
    const ok=await save("sub",editing.sub,{mode,grp:$("sub-grp").value.trim(),name,start,end,cycle:mode==="up"?"once":$("sub-cycle").value,cost:isNaN(c)?0:c,note:$("sub-note").value.trim()});
    if(ok){ltReset();setEditing("sub",null,SL)}
  });
  $("sub-cancel").onclick=()=>{ltReset();setEditing("sub",null,SL)};
  document.querySelectorAll('input[name="lt-mode"]').forEach(r=>r.addEventListener("change",ltForm));
  $("sub-start").addEventListener("change",ltAutoEnd);$("sub-cycle").addEventListener("change",()=>{if(!$("sub-end").value)$("sub-end").dataset.auto="1";ltAutoEnd()});
  $("sub-end").addEventListener("input",()=>{$("sub-end").dataset.auto=""});
  new MutationObserver(ltForm).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  ltForm();
  $("sub-list").addEventListener("click",e=>{
    const r=e.target.closest("button[data-renew]");
    if(r){const s=items.find(i=>i.id===r.dataset.renew);if(s&&s.end)patch(s.id,{end:addCycle(s.end,s.cycle)});return}
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const s=items.find(i=>i.id===b.dataset.edit);if(!s)return;
    const rm=document.querySelector('input[name="lt-mode"][value="'+ltMode(s)+'"]');if(rm)rm.checked=true;ltForm();
    $("sub-name").value=s.name||"";$("sub-grp").value=s.grp||"";$("sub-start").value=s.start||"";$("sub-end").value=s.end||"";$("sub-end").dataset.auto="";$("sub-cycle").value=s.cycle||"once";$("sub-cost").value=fmtIn(s.cost);$("sub-note").value=s.note||"";
    setEditing("sub",s.id,SL);$("sub-name").focus();
  });
  let ltRolling=false;const ltOpen={};
  document.addEventListener("toggle",e=>{const d=e.target;if(d&&d.classList&&d.classList.contains("lt-g"))ltOpen[d.dataset.ltg]=d.open},true);
  function renderSubs(){
    const all=byKind("sub");
    /* repeating countdowns roll forward automatically once their due date has passed */
    if(!ltRolling&&ready){const roll=all.filter(s=>ltMode(s)==="down"&&s.end&&s.cycle&&s.cycle!=="once"&&daysLeft(s.end)<0);
      if(roll.length){ltRolling=true;Promise.all(roll.map(s=>{let st=s.start||"",en=s.end;while(daysLeft(en)<0){st=en;en=addCycle(en,s.cycle)}return patch(s.id,{start:st,end:en})})).finally(()=>{ltRolling=false})}}
    const dn=all.filter(s=>ltMode(s)==="down"&&s.end).sort((a,b)=>a.end.localeCompare(b.end));
    const up=all.filter(s=>ltMode(s)==="up"&&s.start).sort((a,b)=>a.start.localeCompare(b.start));
    const soon=dn.filter(s=>daysLeft(s.end)<=7).length;
    const c=$("c-masa");c.textContent=soon||(dn.length+up.length);c.classList.toggle("alert",soon>0);
    const el=$("sub-list");
    if(!ready){el.innerHTML='<div class="empty">Loading…</div>';return}
    if(!dn.length&&!up.length){el.innerHTML='<div class="empty">'+LTL("Nothing tracked yet. Use “Days left” for something that runs out (e.g. a monthly data quota) or “Days running” to count the days since a date (e.g. your last day of work).","Belum ada yang dipantau. Pakai “Hari lagi” untuk sesuatu yang akan habis (mis. kuota bulanan), atau “Hari berjalan” untuk menghitung hari sejak suatu tanggal (mis. hari terakhir kerja).")+'</div>';return}
    const acts=s=>'<div class="row-actions"><button class="ghost" data-edit="'+esc(s.id)+'">Edit</button><button class="ghost danger" data-del="'+esc(s.id)+'">Delete</button></div>';
    const CYCL={month:LTL("Repeats monthly","Berulang tiap bulan"),year:LTL("Repeats yearly","Berulang tiap tahun")};
    const grps=[...new Set(all.map(s=>(s.grp||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    $("sub-grps").innerHTML=grps.map(g=>'<option value="'+esc(g)+'">').join("");
    const grouped=(list,row)=>{const keys=[...new Set(list.map(s=>(s.grp||"").trim()))].sort((a,b)=>!a?1:!b?-1:a.localeCompare(b));
      if(keys.length===1&&!keys[0])return '<ul class="list lt-list">'+list.map(row).join("")+'</ul>';
      return keys.map(k=>{const it=list.filter(s=>(s.grp||"").trim()===k),oc=ltOpen[k]!==false;
        return '<details class="lt-g" data-ltg="'+esc(k)+'"'+(oc?' open':'')+'><summary><span>'+(k?'🗂 '+esc(k):LTL("No group","Tanpa grup"))+'</span><span class="count">'+it.length+'</span></summary><ul class="list lt-list">'+it.map(row).join("")+'</ul></details>'}).join("")};
    let h='';
    const rowDn=s=>{
      const st=s.start||"",d=daysLeft(s.end),run=st?Math.max(0,-daysLeft(st)):0,tot=st?Math.max(0,daysLeft(s.end)-daysLeft(st)):0;
      const pct=tot?Math.min(100,Math.round(run/tot*100)):(d<=0?100:0);
      const cls=d<0?"t-crit":d<=3?"t-crit":d<=7?"t-warn":"t-ok";
      const lab=d<0?LTL("days overdue","hari terlambat"):d===0?LTL("ends today","habis hari ini"):LTL("days left","hari lagi");
      const meta=[st?'<span class="mono">'+LTL("Start ","Mulai ")+esc(fmtDate(st))+'</span>':'','<span class="mono">'+LTL("Ends ","Habis ")+esc(fmtDate(s.end))+'</span>',CYCL[s.cycle]?'<span>🔁 '+CYCL[s.cycle]+'</span>':'',s.note?'<span>'+esc(s.note)+'</span>':''];
      return '<li class="mid lt-row"><div class="days '+cls+'"><b>'+Math.abs(d)+'</b><span>'+lab+'</span></div><div class="grow"><div class="ttl">'+esc(s.name)+'</div>'
        +(st?'<div class="lt-run"><span><b class="mono">'+run+'</b> '+LTL("of ","dari ")+tot+LTL(" days used"," hari terpakai")+'</span><span class="mono">'+pct+'%</span></div><div class="lt-bar '+cls+'"><i style="width:'+pct+'%"></i></div>':'')
        +'<div class="meta">'+meta.join("")+'</div></div>'+acts(s)+'</li>';
    };
    const sec=(ic,t,list,row)=>'<section class="lt-sec"><header class="lt-sec-h"><h3>'+ic+' '+t+'</h3><span class="count">'+list.length+'</span></header>'+grouped(list,row)+'</section>';
    if(dn.length)h+=sec("⏳",LTL("Days left","Hari lagi"),dn,rowDn);
    const rowUp=s=>{
      const n=-daysLeft(s.start),fut=n<0,t=today();
      const meta=['<span class="mono">'+LTL("Since ","Sejak ")+esc(fmtDate(s.start))+'</span>',s.note?'<span>'+esc(s.note)+'</span>':''];
      const span=ltParts(fut?t:s.start,fut?s.start:t).map(p=>'<span class="lt-u"><b>'+p[0]+'</b> '+p[1]+'</span>').join(" ");
      return '<li class="mid lt-row lt-up"><div class="grow"><div class="ttl">'+esc(s.name)+'</div>'
        +'<div class="lt-span">'+(fut?'<small>'+LTL("Starts in","Mulai dalam")+'</small> ':'')+span+(fut?'':' <small>'+LTL("so far","sampai hari ini")+'</small>')+'</div>'
        +'<div class="meta">'+meta.join("")+'</div></div>'+acts(s)+'</li>';
    };
    if(up.length)h+=sec("📅",LTL("Days running","Hari berjalan"),up,rowUp);
    el.innerHTML=h;
  }

  /* ---------- LINKS ---------- */
  const LL=["New link","Edit link","Add link"];
  function normUrl(u){u=u.trim();if(!/^[a-z][a-z0-9+.-]*:/i.test(u))u="https://"+u;return u}
  function safeHref(u){return /^https?:\/\//i.test(u)?u:"#"}
  function host(u){try{return new URL(u).hostname.replace(/^www\./,"")}catch(_){return u}}
  const catOf=l=>(!l.cat||l.cat==="Lainnya")?"Other":l.cat;
  function hue(s){let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))%360;return h}
  function linkUi(){
    const l=editing.link?items.find(i=>i.id===editing.link):null;
    $("link-logo-hint").hidden=!(l&&l.logo&&assets);$("link-logo-del").hidden=!(l&&l.logo&&assets);
  }
  $("f-link").addEventListener("submit",async e=>{
    e.preventDefault(); if(linkBusy)return;
    const title=$("link-title").value.trim(),url=normUrl($("link-url").value);if(!title||!url)return;
    const id=editing.link,prev=id?items.find(i=>i.id===id):null;
    const file=assets&&$("link-logo").files&&$("link-logo").files[0];
    linkBusy=true;$("link-submit").disabled=true;
    let logo=prev?prev.logo||"":"",newId=null;
    try{
      if(file){$("link-status").textContent="Uploading logo…";const b=await prepImage(file,192,"image/png",2e5);const r=await assets.upload(b,{type:b.type||"image/png"});newId=r.id;logo=newId}
      const ok=await save("link",id,{title,url,cat:$("link-cat").value.trim()||"Other",logo,pinned:$("link-pin").checked,ov:!!(prev&&prev.ov)});
      if(ok){if(newId&&prev&&prev.logo)await delAssets(prev.logo);$("f-link").reset();setEditing("link",null,LL);linkUi();$("link-status").textContent=""}
      else{if(newId)await delAssets(newId);$("link-status").textContent=""}
    }catch(err){if(newId)await delAssets(newId);$("link-status").textContent=assetErr(err)}
    finally{linkBusy=false;$("link-submit").disabled=false}
  });
  $("link-logo-del").onclick=async()=>{
    const l=items.find(i=>i.id===editing.link);if(!l||!l.logo)return;
    const old=l.logo;
    if(await patch(l.id,{logo:""})){await delAssets(old);$("link-logo-hint").hidden=true;$("link-logo-del").hidden=true}
  };
  $("link-cancel").onclick=()=>{$("f-link").reset();setEditing("link",null,LL);linkUi();$("link-status").textContent=""};
  $("link-list").addEventListener("click",e=>{
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const l=items.find(i=>i.id===b.dataset.edit);if(!l)return;
    $("link-title").value=l.title||"";$("link-url").value=l.url||"";$("link-cat").value=l.cat||"";$("link-logo").value="";$("link-pin").checked=!!l.pinned;
    setEditing("link",l.id,LL);linkUi();$("link-title").focus();
  });
  function logoTile(l){
    const h=host(l.url);const init=(l.title||h||"?").trim().charAt(0).toUpperCase();
    const bg='style="background:hsl('+hue(h)+',42%,40%);border-color:transparent"';
    if(l.logo)return '<span class="logo" '+bg+'><img src="/_blob/'+esc(l.logo)+'" alt="" loading="lazy">'+esc(init)+'</span>';
    return '<span class="logo" '+bg+' aria-hidden="true">'+esc(init)+'</span>';
  }
  function renderLinks(){
    const ls=byKind("link");
    $("c-tautan").textContent=ls.length;
    const cats=[...new Set(ls.map(catOf))].sort((a,b)=>a.localeCompare(b,"id"));
    $("cats").innerHTML=cats.map(c=>'<option value="'+esc(c)+'">').join("");
    const el=$("link-list");
    if(!ready){el.innerHTML='<div class="empty">Loading links…</div>';return}
    if(!ls.length){el.innerHTML='<div class="empty">No links yet. Save the sites you open often, group them by category, and add a logo if you like.</div>';return}
    el.innerHTML=cats.map(c=>{
      const g=ls.filter(l=>catOf(l)===c).sort((a,b)=>a.title.localeCompare(b.title,"id"));
      return '<div class="group"><h4>'+esc(c)+'</h4><ul class="list">'+g.map(l=>'<li class="mid rowlink">'+logoTile(l)+'<div class="grow"><a class="lnk" href="'+esc(safeHref(l.url))+'" target="_blank" rel="noopener noreferrer">'+esc(l.title)+'</a><div class="meta"><span class="mono">'+esc(host(l.url))+'</span></div></div>'+rowActs(l.id)+'</li>').join("")+'</ul></div>';
    }).join("");
  }

  /* ---------- FINANCE (Account, Record, Aset, Hutang, Kategori) ---------- */
  const TT=(en,id)=>document.documentElement.lang==="id"?id:en;
  const isTx=f=>f.type==="transaksi"||f.type==="pemasukan";
  const isTr=f=>f.type==="transfer";
  const isRec=f=>isTx(f)||isTr(f);
  const txDir=f=>f.type==="pemasukan"?"in":(f.dir||"out");
  const ACCT_TYPES=[["cash","Cash","💵"],["bank","Bank","🏦"],["ewallet","E-wallet","📱"],["savings","Savings","🐷"],["card","Credit card","💳"],["other","Other","📦"]];
  const acctType=k=>ACCT_TYPES.find(x=>x[0]===k)||ACCT_TYPES[5];
  const accts=()=>byKind("acct").slice().sort((a,b)=>(a.created||0)-(b.created||0));
  const acctById=id=>id?byKind("acct").find(a=>a.id===id):null;
  const monthNow=()=>today().slice(0,7);
  const signRp=n=>(n<0?"−":"")+rp(Math.abs(n));
  function acctBal(a,fs){
    let b=+a.opening||0;
    fs.forEach(f=>{
      const m=+f.amount||0;
      if(isTx(f)){if(f.acct===a.id)b+=txDir(f)==="in"?m:-m}
      else if(isTr(f)){if(f.from===a.id)b-=m;if(f.to===a.id)b+=m}
    });
    return b;
  }
  /* kategori: expense (doc "btypes", dipakai juga oleh Anggaran) dan income (doc "itypes") */
  const IT_DEF=[["💼","Gaji"],["🎁","Bonus"],["🏪","Usaha"],["📈","Investasi"],["💰","Pemasukan lain"]];
  const CAT={exp:{doc:"btypes",pfx:"t",def:BT_DEF},inc:{doc:"itypes",pfx:"i",def:IT_DEF}};
  function catList(set){const c=CAT[set],d=items.find(i=>i.id===c.doc);if(d&&Array.isArray(d.list))return d.list;return c.def.map((x,i)=>({id:c.pfx+i,i:x[0],n:x[1]}))}
  function catSave(set,list){const c=CAT[set];return save(c.doc,c.doc,{list})}
  const fcat=(set,id)=>id?catList(set).find(t=>t.id===id):null;

  /* ----- Account ----- */
  const ACL=["New account","Edit account","Add account"];
  $("f-acct").addEventListener("submit",async e=>{
    e.preventDefault();
    const name=$("acct-name").value.trim();if(!name)return;
    const open=parseAmt($("acct-open").value);
    const data={name,atype:$("acct-type").value,opening:isNaN(open)?0:open,note:$("acct-note").value.trim(),dream:$("acct-type").value==="savings"?$("acct-dream").value:""};
    if(await save("acct",editing.acct,data)){$("f-acct").reset();setEditing("acct",null,ACL)}
  });
  $("acct-cancel").onclick=()=>{$("f-acct").reset();setEditing("acct",null,ACL);acctDreamUi()};
  function acctDreamUi(){const sv=$("acct-type").value==="savings";$("lb-acct-dream").hidden=!sv;
    const keep=$("acct-dream").value,ds=byKind("dream").filter(d=>d.dkind==="save");
    $("acct-dream").innerHTML='<option value="">'+TT("— Not linked —","— Tidak dihubungkan —")+'</option>'+ds.map(d=>'<option value="'+esc(d.id)+'">'+esc(d.title)+'</option>').join("")+(ds.length?"":'<option value="" disabled>'+TT("(make a Savings target in Goals › Dreams first)","(buat dulu Target tabungan di Goals › Dreams)")+'</option>');
    if(keep&&ds.some(d=>d.id===keep))$("acct-dream").value=keep}
  $("acct-type").addEventListener("change",acctDreamUi);
  $("f-acct").addEventListener("reset",()=>setTimeout(acctDreamUi,0));
  $("acct-list").addEventListener("click",e=>{
    const v=e.target.closest("button[data-acct-rec]");
    if(v){recAcct=v.dataset.acctRec;recType="all";recMonth="";location.hash="record";renderRecords();return}
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const a=items.find(i=>i.id===b.dataset.edit);if(!a)return;
    $("acct-name").value=a.name||"";$("acct-type").value=acctType(a.atype)[0];acctDreamUi();$("acct-dream").value=a.dream||"";$("acct-open").value=fmtIn(a.opening);$("acct-note").value=a.note||"";
    setEditing("acct",a.id,ACL);$("acct-name").focus();
  });
  function renderAccounts(){
    const el=$("acct-list");if(!el)return;acctDreamUi();
    const fs=byKind("fin"),as=accts(),ym=monthNow();
    const tot=as.reduce((s,a)=>s+acctBal(a,fs),0);
    $("acct-sum").innerHTML='<div class="stat net"><div class="k">Total balance</div><div class="v'+(tot<0?' neg':'')+'">'+signRp(tot)+'</div></div><div class="stat"><div class="k">Accounts</div><div class="v">'+as.length+'</div></div>';
    if(!ready){el.innerHTML='<div class="empty">Loading finance…</div>';return}
    if(!as.length){el.innerHTML='<div class="empty">No accounts yet. Add your cash, bank accounts and e-wallets so each record can say where the money moved.</div>';return}
    el.innerHTML='<div class="group"><h4>'+TT("Accounts","Daftar account")+' · <span class="mono">'+rp(tot)+'</span></h4><ul class="list">'+as.map(a=>{
      const b=acctBal(a,fs),t=acctType(a.atype);
      let mi=0,mo=0;
      fs.forEach(f=>{if(!isTx(f)||f.acct!==a.id||(f.date||"").slice(0,7)!==ym)return;if(txDir(f)==="in")mi+=+f.amount||0;else mo+=+f.amount||0});
      return '<li><span class="acct-ic" aria-hidden="true">'+t[2]+'</span><div class="grow"><div class="ttl">'+esc(a.name)+'</div><div class="meta"><span>'+t[1]+'</span>'+(a.atype==="savings"&&a.dream&&items.find(i=>i.id===a.dream)?'<span>🎯 '+esc(items.find(i=>i.id===a.dream).title)+'</span>':'')+(a.note?'<span>'+esc(a.note)+'</span>':'')+'<span class="mono">+'+rp(mi)+' · −'+rp(mo)+' '+TT("this month","bulan ini")+'</span></div></div><span class="amt'+(b<0?' neg':'')+'">'+signRp(b)+'</span><div class="row-actions"><button class="ghost" data-acct-rec="'+esc(a.id)+'">View records</button><button class="ghost" data-edit="'+esc(a.id)+'">Edit</button><button class="ghost danger" data-del="'+esc(a.id)+'">Delete</button></div></li>';
    }).join("")+'</ul></div>';
  }

  /* ----- Record (income / expense / transfer) ----- */
  const RCL=["New record","Edit record","Add record"];
  let recMonth=monthNow(),recType="all",recAcct="all";
  function fillRecSelects(){
    const t=$("rec-type").value,tr=t==="tr";
    const aOpts=accts().map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name+" · "+acctType(a.atype)[1])+'</option>').join("");
    const keep={a:$("rec-acct").value,t:$("rec-to").value,c:$("rec-cat").value};
    $("rec-acct").innerHTML='<option value="">'+(tr?"Select account":"No account")+'</option>'+aOpts;
    $("rec-to").innerHTML='<option value="">Select account</option>'+aOpts;
    $("rec-cat").innerHTML='<option value="">No category</option>'+catList(t==="in"?"inc":"exp").map(c=>'<option value="'+esc(c.id)+'">'+esc(c.i+" "+c.n)+'</option>').join("");
    [["rec-acct",keep.a],["rec-to",keep.t],["rec-cat",keep.c]].forEach(p=>{if(p[1]&&$(p[0]).querySelector('option[value="'+CSS.escape(p[1])+'"]'))$(p[0]).value=p[1]});
  }
  function syncRecType(){
    fillRecSelects();
    const tr=$("rec-type").value==="tr";
    $("lb-rto").hidden=!tr;$("lb-rcat").hidden=tr;
    $("rec-acct-lab").textContent=tr?"From account":"Account";
  }
  window.IMP_BT_FILL=()=>{const a=document.activeElement&&document.activeElement.id;if(a==="rec-acct"||a==="rec-to"||a==="rec-cat"||a==="rec-type")return;if($("rec-cat"))fillRecSelects()};
  function resetRecForm(){$("f-rec").reset();$("rec-date").value=today();syncRecType()}
  $("rec-type").addEventListener("change",syncRecType);
  $("f-rec").addEventListener("submit",async e=>{
    e.preventDefault();
    const t=$("rec-type").value,amount=parseAmt($("rec-amt").value);
    if(!(amount>0)){notice("Amount must be a number greater than 0, e.g. 50.000.");return}
    const prev=editing.rec?items.find(i=>i.id===editing.rec):null;
    const name=$("rec-name").value.trim(),date=$("rec-date").value||today();
    let data;
    if(t==="tr"){
      const from=$("rec-acct").value,to=$("rec-to").value;
      if(!from||!to){notice("Choose both accounts for a transfer.");return}
      if(from===to){notice("Choose two different accounts.");return}
      data={type:"transfer",name,amount,date,from,to,note:prev&&prev.note||""};
    }else data={type:"transaksi",dir:t,name,amount,date,acct:$("rec-acct").value,cat:$("rec-cat").value,note:prev&&prev.note||""};
    notice("");
    if(await save("fin",editing.rec,data)){resetRecForm();setEditing("rec",null,RCL)}
  });
  $("rec-cancel").onclick=()=>{resetRecForm();setEditing("rec",null,RCL)};
  $("rec-list").addEventListener("click",e=>{
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const f=items.find(i=>i.id===b.dataset.edit);if(!f)return;
    $("rec-type").value=isTr(f)?"tr":txDir(f);syncRecType();
    $("rec-date").value=f.date||today();
    if(isTr(f)){$("rec-acct").value=f.from||"";$("rec-to").value=f.to||""}
    else{$("rec-acct").value=f.acct||"";$("rec-cat").value=f.cat||""}
    $("rec-amt").value=fmtIn(f.amount)||"0";$("rec-name").value=f.name||"";
    setEditing("rec",f.id,RCL);$("rec-amt").focus();
  });
  $("rec-month").addEventListener("change",e=>{recMonth=e.target.value;renderRecords()});
  $("rec-prev").onclick=()=>{recMonth=shiftMonth(recMonth||monthNow(),-1);renderRecords()};
  $("rec-nextm").onclick=()=>{recMonth=shiftMonth(recMonth||monthNow(),1);renderRecords()};
  $("rec-now").onclick=()=>{recMonth=monthNow();renderRecords()};
  $("rec-all").onclick=()=>{recMonth="";renderRecords()};
  $("rec-types").addEventListener("click",e=>{const b=e.target.closest("[data-rt]");if(!b)return;recType=b.dataset.rt;renderRecords()});
  $("rec-facct").addEventListener("change",e=>{recAcct=e.target.value;renderRecords()});
  const recAcctOk=f=>recAcct==="all"?true:recAcct==="none"?(isTx(f)&&!f.acct):(isTx(f)?f.acct===recAcct:(f.from===recAcct||f.to===recAcct));
  function recRow(f){
    const tr=isTr(f),inn=!tr&&txDir(f)==="in",meta=[];
    let title;
    if(tr){
      const fa=acctById(f.from),ta=acctById(f.to);
      title=f.name||"Transfer";
      meta.push('<span class="pill p-acc">Transfer</span>');
      meta.push('<span class="acn">'+esc(fa?fa.name:"?")+' → '+esc(ta?ta.name:"?")+'</span>');
    }else{
      const c=fcat(inn?"inc":"exp",f.cat),a=acctById(f.acct);
      title=f.name||(c?c.n:(inn?"Income":"Expense"));
      if(c)meta.push('<span class="pill p-mute catn">'+esc(c.i+" "+c.n)+'</span>');
      if(a)meta.push('<span class="acn">'+esc(a.name)+'</span>');
    }
    if(f.note)meta.push('<span>'+esc(f.note)+'</span>');
    const amt=tr?'<span class="amt">'+rp(f.amount)+'</span>':'<span class="amt '+(inn?"pos":"neg")+'">'+(inn?"+":"−")+rp(f.amount)+'</span>';
    return '<li><div class="grow"><div class="ttl">'+esc(title)+'</div><div class="meta">'+meta.join("")+'</div></div>'+amt+rowActs(f.id)+'</li>';
  }
  function renderRecords(){
    const el=$("rec-list");if(!el)return;
    if($("rec-month").value!==recMonth)$("rec-month").value=recMonth;
    const as=accts();
    const sel=$("rec-facct"),sig=as.map(a=>a.id+a.name).join("|");
    if(sel.dataset.sig!==sig){
      sel.dataset.sig=sig;
      sel.innerHTML='<option value="all">All accounts</option>'+as.map(a=>'<option value="'+esc(a.id)+'">'+esc(a.name)+'</option>').join("")+'<option value="none">No account</option>';
    }
    if(!Array.prototype.some.call(sel.options,o=>o.value===recAcct))recAcct="all";
    sel.value=recAcct;
    $("rec-types").innerHTML=[["all","All"],["in","Income"],["out","Expense"],["tr","Transfer"]].map(x=>'<button type="button" class="chip" data-rt="'+x[0]+'" aria-pressed="'+(recType===x[0])+'">'+x[1]+'</button>').join("");
    const base=byKind("fin").filter(isRec).filter(f=>(!recMonth||(f.date||"").slice(0,7)===recMonth)&&recAcctOk(f));
    const inc=base.filter(f=>isTx(f)&&txDir(f)==="in").reduce((s,f)=>s+(+f.amount||0),0);
    const exp=base.filter(f=>isTx(f)&&txDir(f)==="out").reduce((s,f)=>s+(+f.amount||0),0);
    const net=inc-exp,cnt=base.length;
    $("rec-sum").innerHTML='<div class="stat"><div class="k">Income</div><div class="v pos">+'+rp(inc)+'</div></div><div class="stat"><div class="k">Expense</div><div class="v neg">−'+rp(exp)+'</div></div><div class="stat net"><div class="k">Total</div><div class="v'+(net<0?' neg':'')+'">'+(net>0?"+":"")+signRp(net)+'</div><div class="s">'+cnt+' '+TT(cnt===1?"record":"records","record")+'</div></div>';
    if(!ready){el.innerHTML='<div class="empty">Loading finance…</div>';return}
    const list=base.filter(f=>recType==="all"||(recType==="tr"?isTr(f):(isTx(f)&&txDir(f)===recType))).sort(byDateDesc);
    if(!list.length){el.innerHTML='<div class="empty">'+(byKind("fin").some(isRec)?"No records match these filters.":"No records yet. Add your first income, expense or transfer.")+'</div>';return}
    const LIM=60,show=expanded.has("rec")?list:list.slice(0,LIM);
    let rows="",last="";
    const day={};
    list.forEach(f=>{const k=f.date||"";const d=day[k]||(day[k]={i:0,o:0});if(isTx(f)){if(txDir(f)==="in")d.i+=+f.amount||0;else d.o+=+f.amount||0}});
    for(const f of show){
      const k=f.date||"";
      if(k!==last){last=k;const d=day[k];rows+='<li class="mid rec-day"><span class="hint">'+(k?esc(fmtDate(k)):"No date")+'</span><span class="mono">'+(d.i?'<span class="pos">+'+rp(d.i)+'</span> ':'')+(d.o?'<span class="neg">−'+rp(d.o)+'</span>':'')+'</span></li>'}
      rows+=recRow(f);
    }
    const more=list.length>LIM?'<button class="ghost" data-more="rec">'+(expanded.has("rec")?"Show less":TT("Show all "+list.length+" records","Tampilkan semua "+list.length+" record"))+'</button>':"";
    el.innerHTML='<div class="group"><ul class="list">'+rows+'</ul>'+more+'</div>';
  }


  /* ----- Aset ----- */
  const ASSL=["New asset","Edit asset","Add asset"];
  $("f-aset").addEventListener("submit",async e=>{
    e.preventDefault();
    const name=$("aset-name").value.trim(),amount=parseAmt($("aset-amt").value);
    if(!name)return;if(isNaN(amount)){notice("Amount must be a number, e.g. 1.500.000.");return}
    const data={type:"aset",name,amount,group:$("aset-group").value.trim().slice(0,60),date:$("aset-date").value||today(),note:$("aset-note").value.trim()};
    if(await save("fin",editing.aset,data)){$("f-aset").reset();setEditing("aset",null,ASSL)}
  });
  $("aset-cancel").onclick=()=>{$("f-aset").reset();setEditing("aset",null,ASSL)};
  $("aset-list").addEventListener("click",e=>{
    const rn=e.target.closest("button[data-agren]");
    if(rn){agEdit=rn.dataset.agren;renderAssets();const x=$("aset-list").querySelector("[data-agin]");if(x){x.focus();x.select()}return}
    const ag=e.target.closest("button[data-agadd]");
    if(ag){$("f-aset").reset();setEditing("aset",null,ASSL);setFormOpen("aset",true);$("aset-group").value=ag.dataset.agadd;$("aset-name").focus();return}
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const f=items.find(i=>i.id===b.dataset.edit);if(!f)return;
    $("aset-group").value=f.group||"";
    $("aset-name").value=f.name||"";$("aset-amt").value=fmtIn(f.amount)||"0";$("aset-date").value=f.date||"";$("aset-note").value=f.note||"";
    setEditing("aset",f.id,ASSL);$("aset-name").focus();
  });

  /* ----- Hutang ----- */
  const DEBL=["New liability","Edit liability","Add liability"];
  const isRecur=l=>l.ltype==="recurring";
  function syncDebtKind(){
    const r=$("debt-kind").value==="recurring";
    $("lb-debt-amt").hidden=r;$("debt-amt").required=!r;$("debt-inst").required=r;
    $("debt-inst-lab").textContent=r?"Amount per month (Rp)":"Monthly installment (Rp)";
    $("debt-inst").placeholder=r?"150.000":"Optional";
    $("debt-date-lab").textContent=r?"Start date":"Debt start date";
  }
  $("debt-kind").addEventListener("change",syncDebtKind);
  $("f-debt").addEventListener("submit",async e=>{
    e.preventDefault();
    const r=$("debt-kind").value==="recurring",name=$("debt-name").value.trim();if(!name)return;
    const amount=r?0:parseAmt($("debt-amt").value),inst=parseAmt($("debt-inst").value),dd=parseInt($("debt-dueday").value,10);
    if(!r&&isNaN(amount)){notice("Amount must be a number, e.g. 1.500.000.");return}
    if(r&&!(inst>0)){notice("Fill in the amount per month, e.g. 150.000.");return}
    notice("");
    const data={type:"liabilitas",ltype:r?"recurring":"debt",name,amount,date:$("debt-date").value||today(),note:$("debt-note").value.trim(),installment:isNaN(inst)?0:inst,dueDay:dd>=1&&dd<=31?dd:0};
    if(await save("fin",editing.debt,data)){$("f-debt").reset();syncDebtKind();setEditing("debt",null,DEBL)}
  });
  $("debt-cancel").onclick=()=>{$("f-debt").reset();syncDebtKind();setEditing("debt",null,DEBL)};
  $("debt-list").addEventListener("click",e=>{
    const sb=e.target.closest("button[data-sim]");
    if(sb){calcFromLiab(sb.dataset.sim,true);return}
    const pb=e.target.closest("button[data-pay]");
    if(pb){openEnt("pay",pb.dataset.pay,null);return}
    const b=e.target.closest("button[data-edit]");if(!b)return;
    const f=items.find(i=>i.id===b.dataset.edit);if(!f)return;
    if(f.kind==="pay"){openEnt("pay",f.liab,f);return}
    $("debt-name").value=f.name||"";$("debt-amt").value=fmtIn(f.amount)||"0";$("debt-date").value=f.date||"";$("debt-note").value=f.note||"";
    $("debt-kind").value=isRecur(f)?"recurring":"debt";syncDebtKind();
    $("debt-inst").value=fmtIn(f.installment);$("debt-dueday").value=f.dueDay||"";
    setEditing("debt",f.id,DEBL);$("debt-name").focus();
  });
  function liabStats(l){
    const ps=items.filter(x=>x.kind==="pay"&&x.liab===l.id).sort(byDateDesc);
    const paid=ps.reduce((s,p)=>s+(+p.amount||0),0);
    return {ps,paid,rest:l.ltype==="recurring"?0:Math.max(0,(+l.amount||0)-paid)};
  }
  function renderRecur(l){
    const {ps,paid}=liabStats(l),t0=today(),ym=t0.slice(0,7),day=+t0.slice(8,10);
    const psM=ps.filter(p=>(p.date||"").slice(0,7)===ym),paidM=psM.reduce((s,p)=>s+(+p.amount||0),0),m=+l.installment||0;
    let pill;
    if(psM.length&&paidM>=m)pill='<span class="pill p-ok">Paid this month</span>';
    else if(psM.length)pill='<span class="pill p-warn">'+TT("Partly paid","Dibayar sebagian")+'</span>';
    else if(l.dueDay&&day>l.dueDay)pill='<span class="pill p-crit">Unpaid this month</span>';
    else if(l.dueDay)pill='<span class="pill p-warn">Due on day '+l.dueDay+'</span>';
    else pill='<span class="pill p-mute">'+TT("Not paid yet this month","Belum dibayar bulan ini")+'</span>';
    const meta=['<span class="pill p-acc">'+TT("Recurring","Rutin")+'</span>'];
    if(l.date)meta.push('<span class="mono">Started '+esc(fmtDate(l.date))+'</span>');
    if(l.note)meta.push('<span>'+esc(l.note)+'</span>');
    return '<article class="liab recur"><div class="card-head"><div class="grow"><div class="ttl">'+esc(l.name)+'</div><div class="meta">'+meta.join("")+'</div></div>'+pill+'</div>'
      +'<div class="nums"><div><span class="k">'+TT("Per month","Per bulan")+'</span><span class="amt">'+rp(m)+'</span></div><div><span class="k">'+TT("Paid this month","Dibayar bulan ini")+'</span><span class="amt">'+rp(paidM)+'</span></div><div><span class="k">'+TT("Paid in total","Total dibayar")+'</span><span class="amt">'+rp(paid)+'</span></div></div>'
      +(ps.length?hist("pl-"+l.id,"Payment history · "+ps.length+" "+(ps.length===1?"payment":"payments"),entryList(l.id,ps,6,"payments")):'')
      +'<div id="slot-'+esc(l.id)+'"></div>'
      +'<div class="card-foot">'+(ent&&ent.mode==="pay"&&ent.parent===l.id?'<span></span>':'<span class="preview"><button class="soft" data-pay="'+esc(l.id)+'">+ Log payment</button></span>')+rowActs(l.id)+'</div></article>';
  }
  function renderLiab(l){
    if(isRecur(l))return renderRecur(l);
    const {ps,paid,rest}=liabStats(l);
    const total=+l.amount||0, pct=total>0?Math.min(100,Math.round(paid/total*100)):0;
    const t0=today(),ym=t0.slice(0,7),day=+t0.slice(8,10);
    const paidMonth=ps.some(p=>(p.date||"").slice(0,7)===ym);
    let pill;
    if(total>0&&rest<=0)pill='<span class="pill p-ok">Paid off</span>';
    else if(paidMonth)pill='<span class="pill p-ok">Paid this month</span>';
    else if(l.dueDay&&day>l.dueDay)pill='<span class="pill p-crit">Unpaid this month</span>';
    else if(l.dueDay)pill='<span class="pill p-warn">Due on day '+l.dueDay+'</span>';
    else pill='<span class="pill p-mute">Active</span>';
    const meta=[];
    if(l.date)meta.push('<span class="mono">Started '+esc(fmtDate(l.date))+'</span>');
    if(l.installment)meta.push('<span class="mono">'+rp(l.installment)+'/month</span>');
    if(l.installment&&rest>0){const n=Math.ceil(rest/l.installment);meta.push('<span>~'+n+' payments left</span>');meta.push('<span class="mono">Paid off ~'+monthLabel(addMonths(paidMonth?1:0,n-1))+'</span>')}
    if(l.note)meta.push('<span>'+esc(l.note)+'</span>');
    return '<article class="liab"><div class="card-head"><div class="grow"><div class="ttl">'+esc(l.name)+'</div><div class="meta">'+meta.join("")+'</div></div>'+pill+'</div>'
      +'<div class="nums"><div><span class="k">Total debt</span><span class="amt">'+rp(total)+'</span></div><div><span class="k">Paid</span><span class="amt">'+rp(paid)+'</span></div><div><span class="k">Remaining</span><span class="amt'+(rest>0?' neg':'')+'">'+rp(rest)+'</span></div></div>'
      +'<div><div class="barlab"><span>Paid off</span><span class="mono">'+pct+'% · '+ps.length+' payments</span></div><div class="bar ok" role="progressbar" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100"><i style="width:'+pct+'%"></i></div></div>'
      +(ps.length?hist("pl-"+l.id,"Payment history · "+ps.length+" "+(ps.length===1?"payment":"payments"),entryList(l.id,ps,6,"payments")):'')
      +'<div id="slot-'+esc(l.id)+'"></div>'
      +'<div class="card-foot">'+(ent&&ent.mode==="pay"&&ent.parent===l.id?'<span></span>':'<span class="preview"><button class="soft" data-pay="'+esc(l.id)+'">+ Log payment</button>'+(rest>0?'<button class="ghost" data-sim="'+esc(l.id)+'" title="Open the payoff calculator with this debt">Simulate</button>':'')+'</span>')+rowActs(l.id)+'</div></article>';
  }
  $("rec-date").value=today();syncRecType();
  let agEdit=null;
  function renderAssets(){
    const el=$("aset-list");if(!el)return;
    if(agEdit!==null&&document.activeElement&&document.activeElement.matches&&document.activeElement.matches("[data-agin]"))return;
    const fs=byKind("fin"),as=fs.filter(f=>f.type==="aset"),liabs=fs.filter(f=>f.type==="liabilitas");
    const A=as.reduce((s,f)=>s+(+f.amount||0),0),L=liabs.reduce((s,l)=>s+liabStats(l).rest,0),net=A-L;
    const G={};as.forEach(f=>{const g=String(f.group||"").trim();(G[g]=G[g]||[]).push(f)});
    const gsum=g=>G[g].reduce((s,f)=>s+(+f.amount||0),0);
    const names=Object.keys(G).filter(Boolean).sort((a,b)=>gsum(b)-gsum(a)||a.localeCompare(b));
    $("aset-groups").innerHTML=names.map(g=>'<option value="'+esc(g)+'"></option>').join("");
    $("aset-sum").innerHTML='<div class="stat"><div class="k">Total assets</div><div class="v">'+rp(A)+'</div></div><div class="stat"><div class="k">'+TT("Groups","Grup")+'</div><div class="v">'+names.length+'</div></div><div class="stat net"><div class="k">Net worth</div><div class="v'+(net<0?' neg':'')+'">'+signRp(net)+'</div><div class="s">'+TT("Assets minus remaining debts","Aset dikurangi sisa hutang")+'</div></div>';
    if(!ready){el.innerHTML='<div class="empty">Loading finance…</div>';return}
    if(!as.length){el.innerHTML='<div class="empty">No assets yet. Add savings, vehicles, gold or anything you own.</div>';return}
    if(G[""])names.push("");
    const row=f=>'<li><div class="grow"><div class="ttl">'+esc(f.name)+'</div><div class="meta">'+(f.date?'<span class="mono">'+esc(fmtDate(f.date))+'</span>':'')+(f.note?'<span>'+esc(f.note)+'</span>':'')+'</div></div><span class="amt">'+rp(f.amount)+'</span>'+rowActs(f.id)+'</li>';
    el.innerHTML=names.map(g=>{
      const sum=gsum(g),pct=A>0?Math.round(sum/A*100):0;
      const head=agEdit===g&&g?'<input class="ct-in" data-agin="'+esc(g)+'" maxlength="60" value="'+esc(g)+'" aria-label="'+TT("Group name","Nama grup")+'">'
        :'<span class="ag-name acn">'+(g?esc(g):TT("No group","Tanpa grup"))+'</span>';
      const tools=g?'<button type="button" class="ghost ag-btn" data-agren="'+esc(g)+'">'+TT("Rename","Ganti nama")+'</button>':'';
      return '<section class="group aset-grp"><div class="ag-h"><h4>'+head+'</h4><span class="ag-tot mono">'+rp(sum)+' · '+pct+'%</span></div>'
        +'<div class="bar ok ag-bar" aria-hidden="true"><i style="width:'+pct+'%"></i></div>'
        +'<ul class="list">'+G[g].slice().sort((a,b)=>(b.amount||0)-(a.amount||0)).map(row).join("")+'</ul>'
        +(g?'<div class="ag-foot">'+tools+'<button type="button" class="ghost ag-btn" data-agadd="'+esc(g)+'">+ '+TT("Add to this group","Tambah ke grup ini")+'</button></div>':'')+'</section>';
    }).join("");
  }
  $("aset-list").addEventListener("keydown",e=>{
    const x=e.target.closest&&e.target.closest("[data-agin]");if(!x)return;
    if(e.key==="Enter"){e.preventDefault();x.blur()}else if(e.key==="Escape"){x.dataset.cancel="1";x.blur()}
  });
  $("aset-list").addEventListener("focusout",async e=>{
    const x=e.target.closest&&e.target.closest("[data-agin]");if(!x)return;
    const old=x.dataset.agin,nw=x.value.trim().slice(0,60),cancel=x.dataset.cancel==="1";agEdit=null;
    if(cancel||!nw||nw===old){renderAssets();return}
    for(const f of byKind("fin").filter(f=>f.type==="aset"&&String(f.group||"").trim()===old))await patch(f.id,{group:nw});
    renderAssets();
  });
  function renderDebts(){
    parkEnt("pay");
    const el=$("debt-list");if(!el)return;
    const fs=byKind("fin"),liabs=fs.filter(f=>f.type==="liabilitas"),ym=today().slice(0,7);
    const debts=liabs.filter(l=>!isRecur(l)),recs=liabs.filter(isRecur);
    const L=debts.reduce((s,l)=>s+liabStats(l).rest,0);
    const monthly=debts.filter(l=>liabStats(l).rest>0).reduce((s,l)=>s+(+l.installment||0),0)+recs.reduce((s,l)=>s+(+l.installment||0),0);
    const paidM=items.filter(x=>x.kind==="pay"&&(x.date||"").slice(0,7)===ym).reduce((s,p)=>s+(+p.amount||0),0);
    $("debt-sum").innerHTML='<div class="stat net"><div class="k">Remaining debt</div><div class="v'+(L>0?' neg':'')+'">'+(L>0?"−":"")+rp(L)+'</div></div><div class="stat"><div class="k">'+TT("To pay per month","Wajib dibayar per bulan")+'</div><div class="v">'+rp(monthly)+'</div><div class="s">'+TT("Installments + recurring","Cicilan + kewajiban rutin")+'</div></div><div class="stat"><div class="k">'+TT("Paid this month","Dibayar bulan ini")+'</div><div class="v">'+rp(paidM)+'</div></div>';
    fillCalcLiabs(liabs);
    if(!ready){el.innerHTML='<div class="empty">Loading finance…</div>';return}
    if(!liabs.length){el.innerHTML='<div class="empty">'+TT("No liabilities yet. Add a debt (loan or installment) or a recurring obligation such as a monthly oil change.","Belum ada liabilities. Tambahkan hutang (pinjaman atau cicilan) atau kewajiban rutin seperti ganti oli tiap bulan.")+'</div>';return}
    let h="";
    if(debts.length)h+='<div class="group"><h4>'+TT("Debts · remaining","Hutang · sisa")+' <span class="mono neg">−'+rp(L)+'</span></h4><div class="liabs">'+debts.sort((a,b)=>liabStats(b).rest-liabStats(a).rest).map(renderLiab).join("")+'</div></div>';
    if(recs.length)h+='<div class="group"><h4>'+TT("Recurring obligations · per month","Kewajiban rutin · per bulan")+' <span class="mono">'+rp(recs.reduce((s,l)=>s+(+l.installment||0),0))+'</span></h4><div class="liabs">'+recs.sort((a,b)=>(+b.installment||0)-(+a.installment||0)).map(renderLiab).join("")+'</div></div>';
    el.innerHTML=h;
    placeEnt("pay");
    fillCalcLiabs(liabs);
  }
  let ctEdit=null;
  function catUse(set,id){return byKind("fin").filter(f=>isTx(f)&&(set==="inc"?txDir(f)==="in":txDir(f)==="out")&&f.cat===id).length}
  function renderCategories(){
    if(ctEdit&&document.activeElement&&document.activeElement.matches&&document.activeElement.matches("[data-ctin]"))return;
    ["exp","inc"].forEach(set=>{
      const ul=$("ct-list-"+set);if(!ul)return;
      const list=catList(set);
      ul.innerHTML=list.length?list.map(t=>{
        const n=catUse(set,t.id);
        return '<li><button type="button" class="bt-i bt-i-btn" data-pkopen data-ctic="'+esc(t.id)+'" title="Change emoji" aria-label="Change emoji">'+esc(t.i)+'</button>'
          +(ctEdit===set+":"+t.id?'<input class="ct-in grow" data-ctin="'+esc(t.id)+'" maxlength="60" value="'+esc(t.n)+'" aria-label="Name">':'<button type="button" class="ct-name grow" data-ctren="'+esc(t.id)+'" title="Rename">'+esc(t.n)+'</button>')
          +(n?'<span class="ct-use">'+n+'×</span>':'')
          +'<button type="button" class="ghost danger" data-ctdel="'+esc(t.id)+'" aria-label="Remove category" title="Remove category">×</button></li>';
      }).join(""):'<li class="hint">No categories yet.</li>';
    });
  }
  function renderFinance(){
    renderAccounts();renderRecords();renderAssets();renderDebts();renderCategories();
    window.IMP_BT_FILL();
  }


  /* ---------- DEBT PAYOFF CALCULATOR ---------- */
  function addMonths(off,n){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()+off+n);return d}
  function monthLabel(d){return BLN[d.getMonth()]+" "+d.getFullYear()}
  function fillCalcLiabs(liabs){
    const sel=$("calc-liab");if(!sel)return;const cur=sel.value;
    const opts=liabs.filter(l=>liabStats(l).rest>0).map(l=>'<option value="'+esc(l.id)+'">'+esc(l.name)+' · '+rp(liabStats(l).rest)+'</option>').join("");
    const first=sel.options[0]?sel.options[0].outerHTML:'<option value="">Type the numbers myself</option>';
    sel.innerHTML=first+opts;
    if(cur&&sel.querySelector('option[value="'+CSS.escape(cur)+'"]'))sel.value=cur;
  }
  function calcFromLiab(id,jump){
    const l=items.find(i=>i.id===id);if(!l)return;
    const {rest}=liabStats(l);
    $("calc-liab").value=id;
    $("calc-debt").value=fmtIn(rest);
    $("calc-inst").value=fmtIn(l.installment);
    const t0=today(),paidM=items.some(x=>x.kind==="pay"&&x.liab===id&&(x.date||"").slice(0,7)===t0.slice(0,7));
    const d=addMonths(paidM?1:0,0);$("calc-start").value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
    runCalc();
    if(jump){const f=$("f-calc");f.scrollIntoView({behavior:smooth(),block:"start"});f.classList.add("flash");setTimeout(()=>f.classList.remove("flash"),1400);if(!l.installment)$("calc-inst").focus()}
  }
  function runCalc(){
    const out=$("calc-out");if(!out)return;
    const ID=window.I18N&&I18N.get()==="id";
    const T=(en,id)=>ID?id:en;
    const MN=ID?["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]:BLN;
    const P=parseAmt($("calc-debt").value),A=parseAmt($("calc-inst").value);
    const rate=Math.max(0,parseFloat(String($("calc-rate").value).replace(",","."))||0)/100,type=$("calc-rtype").value;
    if(!(P>0)||!(A>0)){out.innerHTML='<p class="hint">'+T("Fill in the debt and the monthly installment. Interest is optional.","Isi jumlah hutang dan cicilan per bulan. Bunga boleh dikosongkan.")+'</p>';return}
    const r=rate/12,flatI=type==="flat"?P*r:0;
    const firstInt=type==="flat"?flatI:P*r;
    if(A<=firstInt+0.5){
      out.innerHTML='<p class="notice" style="margin:0">'+T("This installment only covers the interest (","Cicilan ini hanya menutup bunga (")+rp(firstInt)+T("/month), so the debt never goes down. Raise the installment above that amount.","/bulan), jadi hutang tidak pernah berkurang. Naikkan cicilan di atas angka itu.")+'</p>';return}
    let bal=P,n=0,totInt=0,last=A;const yearly=[];let yPaid=0;
    const sv=$("calc-start").value;let sd=new Date();sd.setDate(1);
    if(/^\d{4}-\d{2}$/.test(sv))sd=new Date(+sv.slice(0,4),+sv.slice(5,7)-1,1);
    while(bal>0.5&&n<1200){
      const it=type==="flat"?flatI:bal*r;
      let pay=A;
      if(bal+it<=A){pay=bal+it;last=pay}
      bal=bal+it-pay;totInt+=it;n++;yPaid+=pay;
      const d=new Date(sd.getFullYear(),sd.getMonth()+n-1,1);
      if(d.getMonth()===11||bal<=0.5){yearly.push([d.getFullYear(),yPaid,Math.max(0,bal)]);yPaid=0}
    }
    if(n>=1200){out.innerHTML='<p class="notice" style="margin:0">'+T("This would take more than 100 years. Raise the installment.","Butuh lebih dari 100 tahun. Naikkan cicilannya.")+'</p>';return}
    const end=new Date(sd.getFullYear(),sd.getMonth()+n-1,1);
    const yrs=Math.floor(n/12),mo=n%12;
    const span=(yrs?yrs+T(yrs===1?" year":" years"," tahun"):"")+(yrs&&mo?" ":"")+(mo?mo+T(mo===1?" month":" months"," bulan"):"");
    const total=P+totInt,pPct=Math.round(P/total*100);
    out.innerHTML=
      '<div class="calc-big"><b>'+n+'</b><span>'+T(n===1?"payment":"payments","kali bayar")+' · '+span+'</span></div>'+
      '<div class="calc-kv">'+
        '<div><span class="k">'+T("Paid off in","Lunas pada")+'</span><span class="v">'+MN[end.getMonth()]+' '+end.getFullYear()+'</span></div>'+
        '<div><span class="k">'+T("Last payment","Cicilan terakhir")+'</span><span class="v">'+rp(last)+'</span></div>'+
        '<div><span class="k">'+T("Total paid","Total dibayar")+'</span><span class="v">'+rp(total)+'</span></div>'+
        '<div><span class="k">'+T("Total interest","Total bunga")+'</span><span class="v'+(totInt>0?' neg':'')+'">'+rp(totInt)+'</span></div>'+
      '</div>'+
      (totInt>0?'<div class="calc-bar" aria-hidden="true"><i style="width:'+pPct+'%"></i><i style="width:'+(100-pPct)+'%"></i></div><div class="calc-legend"><span><i style="background:var(--ok)"></i>'+T("Principal","Pokok")+' '+pPct+'%</span><span><i style="background:var(--warn)"></i>'+T("Interest","Bunga")+' '+(100-pPct)+'%</span></div>':'')+
      (yearly.length>1?'<table class="calc-tbl"><thead><tr><th>'+T("Year","Tahun")+'</th><th>'+T("Paid that year","Dibayar")+'</th><th>'+T("Debt left","Sisa hutang")+'</th></tr></thead><tbody>'+yearly.map(y=>'<tr><td>'+y[0]+'</td><td>'+rp(y[1])+'</td><td>'+rp(y[2])+'</td></tr>').join("")+'</tbody></table>':'')+
      '<p class="hint">'+T("Estimate only. Lenders may round, add fees or count interest differently.","Perkiraan saja. Pihak pemberi pinjaman bisa membulatkan, menambah biaya admin, atau menghitung bunga dengan cara lain.")+'</p>';
  }
  (function(){
    const f=$("f-calc");if(!f)return;
    f.addEventListener("submit",e=>e.preventDefault());
    ["calc-debt","calc-inst","calc-rate","calc-rtype","calc-start"].forEach(id=>{$(id).addEventListener("input",()=>{if(id==="calc-debt"||id==="calc-inst")$("calc-liab").value="";runCalc()});$(id).addEventListener("change",runCalc)});
    $("calc-liab").addEventListener("change",e=>{if(e.target.value)calcFromLiab(e.target.value,false);else runCalc()});
    ["calc-debt","calc-inst"].forEach(id=>$(id).addEventListener("blur",e=>{const v=parseAmt(e.target.value);if(v>0)e.target.value=fmtIn(v)}));
    const d=new Date();$("calc-start").value=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");
    addEventListener("hashchange",runCalc);
    runCalc();
  })();

  /* ---------- URUTAN SUBMENU (Pengaturan › Urutan menu) ---------- */
  const MENU_LS="imperium-menu";
  const nsubOf=g=>document.querySelector('.nsub[data-sg="'+g+'"]');
  const curOrder=g=>{const ns=nsubOf(g);return ns?Array.prototype.map.call(ns.querySelectorAll(":scope>a[data-tab]"),a=>a.dataset.tab):[]};
  const DEF_ORDER={};Object.keys(GROUPS).forEach(g=>{DEF_ORDER[g]=curOrder(g)});
  function cleanMenu(m){const o={};Object.keys(GROUPS).concat(["__top"]).forEach(g=>{if(m&&Array.isArray(m[g]))o[g]=m[g].filter(t=>typeof t==="string")});return o}
  const NAV=document.querySelector(".nav"),NAVSEP=NAV.querySelector(".sep");
  const topEls=()=>Array.prototype.filter.call(NAV.children,c=>c!==NAVSEP&&(c.matches("a[data-tab]")||c.matches(".ngrp"))&&!(c.matches('a[data-tab="pengaturan"],a[data-tab="info"]')));
  const topKey=c=>c.matches(".ngrp")?"g:"+c.dataset.ng:"t:"+c.dataset.tab;
  const topName=c=>(c.querySelector(".ng-btn .ni")||c.querySelector(".ni")).textContent;
  const DEF_TOP=topEls().map(topKey);
  function effTop(){const sv=(menuOrder.__top||[]).filter(k=>DEF_TOP.includes(k));DEF_TOP.forEach(k=>{if(!sv.includes(k))sv.push(k)});return Array.from(new Set(sv))}
  function applyTop(){
    const want=effTop(),els={};topEls().forEach(c=>{els[topKey(c)]=c});
    if(topEls().map(topKey).join()===want.join())return;
    want.forEach(k=>{if(els[k])NAV.insertBefore(els[k],NAVSEP)});
  }
  function moveTop(k,pos){const arr=effTop().filter(x=>x!==k);arr.splice(Math.max(0,Math.min(arr.length,pos-1)),0,k);menuOrder.__top=arr;applyMenu();renderMenuCard();saveMenu()}
  let menuOrder={};
  try{menuOrder=cleanMenu(JSON.parse(localStorage.getItem(MENU_LS)||"null"))}catch(_){menuOrder={}}
  function effOrder(g){
    const def=DEF_ORDER[g],sv=(menuOrder[g]||[]).filter(t=>def.includes(t));
    def.forEach(t=>{if(!sv.includes(t))sv.push(t)});
    return Array.from(new Set(sv));
  }
  function applyMenu(){
    applyTop();
    Object.keys(GROUPS).forEach(g=>{
      const ns=nsubOf(g);if(!ns)return;
      const want=effOrder(g);
      if(curOrder(g).join()===want.join())return;
      const units={},head=[];let cur=null;
      Array.prototype.slice.call(ns.children).forEach(ch=>{
        if(ch.matches("a[data-tab]")){cur=ch.dataset.tab;units[cur]=[ch]}
        else if(cur)units[cur].push(ch);else head.push(ch);
      });
      const frag=document.createDocumentFragment();
      head.forEach(n=>frag.appendChild(n));
      want.forEach(t=>{(units[t]||[]).forEach(n=>frag.appendChild(n))});
      ns.appendChild(frag);
    });
  }
  async function saveMenu(){
    try{localStorage.setItem(MENU_LS,JSON.stringify(menuOrder))}catch(_){}
    if(col){try{await col.doc("menuorder").set({kind:"menu",orders:menuOrder,updated:Date.now()})}catch(e){handleWriteErr(e)}}
  }
  function syncMenuFromStore(){
    const d=items.find(i=>i.id==="menuorder");if(!d||!d.orders)return;
    const o=cleanMenu(d.orders);
    if(JSON.stringify(o)!==JSON.stringify(menuOrder)){
      menuOrder=o;try{localStorage.setItem(MENU_LS,JSON.stringify(menuOrder))}catch(_){}
      applyMenu();renderMenuCard();
    }
  }
  function moveTab(g,t,pos){
    const arr=effOrder(g).filter(x=>x!==t);
    arr.splice(Math.max(0,Math.min(arr.length,pos-1)),0,t);
    menuOrder[g]=arr;applyMenu();renderMenuCard();saveMenu();
  }
  function renderMenuCard(){
    const host=$("menu-ord");if(!host)return;
    const tops=topEls();
    const rowsTop='<div class="mo-grp mo-top"><h4>'+TT("Main menu","Menu utama")+'</h4>'+tops.map((c,i)=>{const k=topKey(c);
        return '<div class="mo-row"><select class="mo-n" data-mo-top="'+k+'" aria-label="Row number">'+tops.map((_,j)=>'<option value="'+(j+1)+'"'+(j===i?' selected':'')+'>'+(j+1)+'</option>').join("")+'</select>'
          +'<span class="mo-name">'+esc(topName(c))+(c.matches(".ngrp")?' <small class="hint">· '+TT("group","grup")+'</small>':'')+'</span>'
          +'<button type="button" class="ghost" data-mo-tup="'+k+'" aria-label="Move up"'+(i===0?' disabled':'')+'>↑</button>'
          +'<button type="button" class="ghost" data-mo-tdn="'+k+'" aria-label="Move down"'+(i===tops.length-1?' disabled':'')+'>↓</button></div>'}).join("")
      +'<p class="hint">'+TT("Settings always stays at the bottom.","Pengaturan selalu di paling bawah.")+'</p></div><h3 class="set-h mo-subh">'+TT("Submenus","Submenu")+'</h3>';
    host.innerHTML=rowsTop+Array.prototype.map.call(document.querySelectorAll(".ngrp"),ng=>{
      const g=ng.dataset.ng,tabs=curOrder(g);
      return '<div class="mo-grp"><h4>'+esc(ng.querySelector(".ng-btn .ni").textContent)+'</h4>'+tabs.map((t,i)=>{
        const nm=nsubOf(g).querySelector('a[data-tab="'+t+'"] .ni').textContent;
        return '<div class="mo-row"><select class="mo-n" data-mo-g="'+g+'" data-mo-t="'+t+'" aria-label="Row number">'+tabs.map((_,k)=>'<option value="'+(k+1)+'"'+(k===i?' selected':'')+'>'+(k+1)+'</option>').join("")+'</select>'
          +'<span class="mo-name">'+esc(nm)+'</span>'
          +'<button type="button" class="ghost" data-mo-up="'+t+'" data-mo-g="'+g+'" aria-label="Move up"'+(i===0?' disabled':'')+'>↑</button>'
          +'<button type="button" class="ghost" data-mo-dn="'+t+'" data-mo-g="'+g+'" aria-label="Move down"'+(i===tabs.length-1?' disabled':'')+'>↓</button></div>';
      }).join("")+'</div>';
    }).join("");
  }
  $("menu-card").addEventListener("change",e=>{const t=e.target.closest("select[data-mo-top]");if(t){moveTop(t.dataset.moTop,+t.value);return}const s=e.target.closest("select[data-mo-t]");if(s)moveTab(s.dataset.moG,s.dataset.moT,+s.value)});
  $("menu-card").addEventListener("click",e=>{
    const tu=e.target.closest("[data-mo-tup]");if(tu){const i=effTop().indexOf(tu.dataset.moTup);if(i>0)moveTop(tu.dataset.moTup,i);return}
    const td=e.target.closest("[data-mo-tdn]");if(td){const o=effTop(),i=o.indexOf(td.dataset.moTdn);if(i>=0&&i<o.length-1)moveTop(td.dataset.moTdn,i+2);return}
    const up=e.target.closest("[data-mo-up]");if(up){const g=up.dataset.moG,i=curOrder(g).indexOf(up.dataset.moUp);if(i>0)moveTab(g,up.dataset.moUp,i);return}
    const dn=e.target.closest("[data-mo-dn]");if(dn){const g=dn.dataset.moG,o=curOrder(g),i=o.indexOf(dn.dataset.moDn);if(i>=0&&i<o.length-1)moveTab(g,dn.dataset.moDn,i+2);return}
    if(e.target.closest("#menu-reset")){menuOrder={};applyMenu();renderMenuCard();saveMenu()}
  });
  addEventListener("hashchange",renderMenuCard);
  applyMenu();renderMenuCard();

  /* ---------- TEMA ---------- */
  const MODES=[["system","Match device"],["light","Light"],["dark","Dark"],["krem","Cream"],["sagemist","Sage mist"],["dusk","Dusk"],["hutan","Forest night"],["senja","Warm dusk"]];
  const BASE={light:"light",dark:"dark",krem:"light",sagemist:"light",dusk:"dark",hutan:"dark",senja:"dark"};
  const ACCENTS=[["anggur","Wine","#7A1F3D"],["biru","Navy","#1F4E8C"],["hijau","Forest","#2E6B47"],["tembaga","Copper","#9A4A1C"],["ungu","Purple","#5B3A9C"],["sage","Sage","#557564"],["laut","Ocean","#2F6F73"],["mawar","Dusty rose","#A15C6B"],["slate","Slate","#4F6478"],["pasir","Sand","#86693A"],["lavender","Lavender","#6E6A9E"]];
  const BGCS=[["","Theme default"],["#FFFFFF","White"],["#F3EEE4","Cream"],["#E4F1E8","Mint"],["#E3EEF9","Sky"],["#F8E8EC","Blush"],["#EDE7F8","Lilac"],["#FFF4D0","Butter"],["#2B2F38","Charcoal"],["#0F1730","Midnight"],["#12201C","Pine"],["#241A14","Cocoa"],["#231638","Plum"],["#3B0D14","Dark red"],["#0D2A2C","Deep teal"],["#0F2416","Dark green"],["#0E1A33","Navy night"],["#1C1838","Indigo night"],["#2B1F0C","Bronze"],["#000000","Black"]];
  const pl=(c,o,d,w)=>'<path d="'+d+'" fill="none" stroke="'+c+'" stroke-opacity="'+o+'" stroke-width="'+(w||1)+'"/>';
  const PATS=[
    {id:"dots",n:"Dots",w:20,h:20,s:(c,o)=>'<circle cx="10" cy="10" r="1.5" fill="'+c+'" fill-opacity="'+o+'"/>'},
    {id:"grid",n:"Grid",w:28,h:28,s:(c,o)=>pl(c,o,"M0 .5H28M.5 0V28")},
    {id:"diag",n:"Diagonal",w:14,h:14,s:(c,o)=>pl(c,o,"M-1 1L1 -1M0 14L14 0M13 15L15 13")},
    {id:"graph",n:"Graph paper",w:40,h:40,s:(c,o)=>pl(c,+(o*.55).toFixed(3),"M0 8.5H40M0 16.5H40M0 24.5H40M0 32.5H40M8.5 0V40M16.5 0V40M24.5 0V40M32.5 0V40",.6)+pl(c,o,"M0 .5H40M.5 0V40")},
    {id:"plus",n:"Plus",w:24,h:24,s:(c,o)=>pl(c,o,"M12 8V16M8 12H16",1.3)},
    {id:"waves",n:"Waves",w:40,h:12,s:(c,o)=>pl(c,o,"M0 6Q10 0 20 6T40 6",1.2)},
    {id:"zigzag",n:"Zigzag",w:24,h:12,s:(c,o)=>pl(c,o,"M0 9L6 3L12 9L18 3L24 9",1.2)},
    {id:"diamonds",n:"Diamonds",w:24,h:24,s:(c,o)=>pl(c,o,"M12 3L21 12L12 21L3 12Z")},
    {id:"rings",n:"Rings",w:24,h:24,s:(c,o)=>'<circle cx="12" cy="12" r="6.5" fill="none" stroke="'+c+'" stroke-opacity="'+o+'" stroke-width="1.2"/>'},
    {id:"bricks",n:"Bricks",w:40,h:20,s:(c,o)=>pl(c,o,"M0 .5H40M0 10.5H40M20.5 .5V10.5M.5 10.5V20")}
  ];
  function patUrl(p,c,o){
    const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+p.w+'" height="'+p.h+'" viewBox="0 0 '+p.w+' '+p.h+'">'+p.s(c,+o.toFixed(3))+'</svg>';
    return "url('data:image/svg+xml,"+encodeURIComponent(svg).replace(/'/g,"%27")+"')";
  }
  const HEX=/^#[0-9a-f]{6}$/i;
  const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
  const rgb2hex=a=>"#"+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join("");
  const mixc=(a,b,t)=>{const x=hex2rgb(a),y=hex2rgb(b);return rgb2hex(x.map((v,i)=>v+(y[i]-v)*t))};
  function lumOf(h){const c=hex2rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]}
  const BG_TOK=["bg","surface","sunk","line","ink","muted","inner","side"];
  function rgb2hsl(h){let [r,g,b]=hex2rgb(h).map(v=>v/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let hh=0,s=0;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);hh=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;hh*=60}return [hh,s,l]}
  function hsl2hex(h,s,l){s=Math.max(0,Math.min(1,s));l=Math.max(0,Math.min(1,l));const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return rgb2hex([f(0)*255,f(8)*255,f(4)*255])}
  /* warna latar -> kartu -> kartu dalam -> sidebar dibuat satu keluarga warna (hue sama, terang bertingkat) */
  function deriveBg(c){
    let [h,s0,l]=rgb2hsl(c);const g=[.6,1,1.45][(prefs.grad||2)-1];
    if(lumOf(c)<0.22){
      /* latar selalu paling gelap: warna yang terlalu terang untuk tema gelap ditekan dulu, kartu & tabel naik dari situ */
      const s=Math.min(Math.max(s0,.12),.8),L=Math.min(l,.2),up=d=>Math.min(.48,L+d*g);
      return {bg:l>L+.005?hsl2hex(h,s,L):c,side:hsl2hex(h,s*1.05,up(.06)),surface:hsl2hex(h,s*1.08,up(.15)),inner:hsl2hex(h,s*1.08,up(.095)),sunk:hsl2hex(h,s,up(.09)),line:hsl2hex(h,s*.9,up(.23)),ink:hsl2hex(h,Math.min(s,.3),.95),muted:hsl2hex(h,Math.min(s,.25),.76)};
    }
    /* latar sangat terang (mis. putih) digelapkan sedikit agar kartu putih tetap menonjol */
    const lb=Math.min(l,.955-.025*g),bgc=lb<l-.003?hsl2hex(h,s0,lb):c;l=lb;
    const dn=d=>Math.max(.08,l-d*g),toW=d=>l+(1-l)*Math.min(.95,d*g);
    return {bg:bgc,side:hsl2hex(h,s0,dn(.05)),surface:toW(.7)>.985?"#ffffff":hsl2hex(h,s0,toW(.7)),inner:hsl2hex(h,s0,toW(.32)),sunk:hsl2hex(h,s0*.9,dn(.07)),line:hsl2hex(h,s0*.6,dn(.16)),ink:hsl2hex(h,Math.min(s0,.45),.12),muted:hsl2hex(h,Math.min(s0,.25),.38)};
  }

  let prefs={mode:"system",accent:"anggur",hidden:[],lang:"en",pat:"none",patStr:2,patCol:"",bgCol:""};
  function cleanPrefs0(p){return {hidden:Array.isArray(p?.hidden)?p.hidden.filter(x=>typeof x==="string").slice(0,20):[],mode:MODES.some(m=>m[0]===p?.mode)?p.mode:"system",accent:ACCENTS.some(a=>a[0]===p?.accent)?p.accent:"anggur",lang:p?.lang==="id"?"id":"en",pat:PATS.some(x=>x.id===p?.pat)?p.pat:"none",patStr:[1,2,3].includes(+p?.patStr)?+p.patStr:2,patCol:p?.patCol==="accent"?"accent":HEX.test(p?.patCol||"")?p.patCol.toLowerCase():"",bgCol:HEX.test(p?.bgCol||"")?p.bgCol.toLowerCase():""}}
  const UIS=[["flat","Klasik (bawaan): datar dan bersih"],["glass","Glassmorphism: kaca buram tembus pandang"],["neu","Neumorphism: timbul lembut menyatu latar"],["skeuo","Skeuomorphism: kulit dan tombol fisik"],["clay","Claymorphism: empuk seperti tanah liat"],["material","Material: kartu melayang ala Android"],["brutal","Neubrutalism: garis hitam tebal"],["neon","Cyberpunk Neon: garis menyala"],["aurora","Aurora: gradasi warna"],["pixel","Retro Pixel: gaya game 8-bit"],["paper","Paper: kertas catatan"],["bento","Bento: kotak-kotak rapi"]];
  const TFXS=[["off","Off"],["glow","Glow"],["pop","Pop"],["spark","Sparks"],["confetti","Confetti"],["emoji","Emoji burst"],["wave","Ripple"],["rainbow","Rainbow"],["power","Power mode"],["sound","Typewriter sound"]];
  const ANIMS=[["full","Lively"],["soft","Subtle"],["slide","Slide"],["zoom","Zoom"],["flip","Flip 3D"],["bounce","Bounce"],["blur","Blur focus"],["swing","Swing"],["drop","Drop"],["elastic","Elastic"],["off","Off"]];
  function cleanPrefs(p){const o=cleanPrefs0(p);o.ui=UIS.some(x=>x[0]===p?.ui)?p.ui:"flat";o.tfx=TFXS.some(x=>x[0]===p?.tfx)?p.tfx:"off";o.anim=ANIMS.some(x=>x[0]===p?.anim)?p.anim:"full";o.grad=[1,2,3].includes(+p?.grad)?+p.grad:2;o.vivid="off";return o}
  try{prefs=cleanPrefs(JSON.parse(localStorage.getItem("imperium-prefs")||"null")||prefs)}catch(_){}
  const mq=matchMedia("(prefers-color-scheme: dark)");
  function effMode(){
    if(prefs.mode!=="system")return BASE[prefs.mode];
    const ht=document.documentElement.getAttribute("data-theme");
    if(ht==="dark"||ht==="light")return ht;
    return mq.matches?"dark":"light";
  }
  let langApplied=null;
  function applyPattern(){
    const r=document.documentElement,p=PATS.find(x=>x.id===prefs.pat);
    if(!p){r.style.removeProperty("--pat-img");return}
    const cs=getComputedStyle(r),hx=v=>{v=(v||"").trim();return HEX.test(v)?v:""};
    const ink=hx(cs.getPropertyValue("--ink"))||(r.getAttribute("data-mode")==="dark"?"#E9EBF0":"#16181E");
    let col=ink,colored=false;
    if(prefs.patCol==="accent"){col=hx(cs.getPropertyValue("--accent"))||ink;colored=true}
    else if(prefs.patCol){col=prefs.patCol;colored=true}
    const op=(colored?[.16,.3,.5]:[.07,.13,.22])[prefs.patStr-1];
    r.style.setProperty("--pat-img",patUrl(p,col,op));
  }
  function applyTheme(){
    const r=document.documentElement,bgc=prefs.bgCol,dark=bgc?lumOf(bgc)<0.22:false;
    r.setAttribute("data-mode",bgc?(dark?"dark":"light"):effMode());
    if(!bgc&&BASE[prefs.mode]&&prefs.mode!==BASE[prefs.mode])r.setAttribute("data-bg",prefs.mode);else r.removeAttribute("data-bg");
    r.setAttribute("data-accent",prefs.accent);
    BG_TOK.forEach(k=>r.style.removeProperty("--"+k));
    r.style.removeProperty("--accent-soft");
    if(bgc){const t=deriveBg(bgc);BG_TOK.forEach(k=>r.style.setProperty("--"+k,t[k]));r.style.setProperty("color-scheme",dark?"dark":"light");
      const ac=(getComputedStyle(r).getPropertyValue("--accent")||"").trim();if(HEX.test(ac))r.style.setProperty("--accent-soft",mixc(ac,t.surface,dark?.72:.84))}
    else r.style.removeProperty("color-scheme");
    r.setAttribute("data-ui",prefs.ui);r.setAttribute("data-vivid",prefs.vivid);r.setAttribute("data-anim",prefs.anim);window.IMP_PREFS=prefs;
    applyPattern();
    renderThemeOpts();
    if(window.I18N&&langApplied!==prefs.lang){langApplied=prefs.lang;I18N.set(prefs.lang)}
  }
  function renderThemeOpts(){
    {const us=$("ui-sel");if(us){if(!us.options.length){us.innerHTML=UIS.map(u=>'<option value="'+u[0]+'">'+esc(u[1])+'</option>').join("");us.addEventListener("change",()=>setPrefs({ui:us.value}))}us.value=prefs.ui}}
    $("lang-opts").innerHTML=[["en","English"],["id","Bahasa Indonesia"]].map(l=>'<button type="button" class="chip" data-lang-opt="'+l[0]+'" aria-pressed="'+(prefs.lang===l[0])+'">'+l[1]+'</button>').join("");
    renderBgOpts();
    $("tfx-opts").innerHTML=TFXS.map(x=>'<button type="button" class="chip" data-tfx-opt="'+x[0]+'" aria-pressed="'+(prefs.tfx===x[0])+'">'+x[1]+'</button>').join("");
    $("grad-opts").innerHTML=[[1,"Subtle"],[2,"Medium"],[3,"Strong"]].map(x=>'<button type="button" class="chip" data-grad-opt="'+x[0]+'" aria-pressed="'+(prefs.grad===x[0])+'">'+x[1]+'</button>').join("");
    $("grad-row").hidden=!prefs.bgCol;
    $("anim-opts").innerHTML=ANIMS.map(x=>'<button type="button" class="chip" data-anim-opt="'+x[0]+'" aria-pressed="'+(prefs.anim===x[0])+'">'+x[1]+'</button>').join("");
  }
  function renderBgOpts(){
    const lc=v=>String(v||"").toLowerCase(),cs=getComputedStyle(document.documentElement),hx=v=>{v=(v||"").trim();return HEX.test(v)?v:""};
    let h=BGCS.map(b=>'<button type="button" class="chip" data-bgc-opt="'+b[0]+'" aria-pressed="'+(lc(prefs.bgCol)===lc(b[0]))+'">'+(b[0]?'<span class="dot" style="background:'+b[0]+'"></span>':'')+b[1]+'</button>').join("");
    if(prefs.bgCol&&!BGCS.some(b=>lc(b[0])===prefs.bgCol))h+='<button type="button" class="chip" data-bgc-opt="'+prefs.bgCol+'" aria-pressed="true"><span class="dot" style="background:'+prefs.bgCol+'"></span>Custom</button>';
    $("bgc-opts").innerHTML=h;
    const curBg=prefs.bgCol||hx(cs.getPropertyValue("--bg"))||"#eef0f3";
    if(lc($("bgc-custom").value)!==lc(curBg))$("bgc-custom").value=curBg;
    const ink=hx(cs.getPropertyValue("--ink"))||"#16181E";
    $("pat-opts").innerHTML=[{id:"none",n:"None"}].concat(PATS).map(p=>'<button type="button" class="pat" data-pat-opt="'+p.id+'" aria-pressed="'+(prefs.pat===p.id)+'"><span class="pv"'+(p.id==="none"?'':' style="background-image:'+patUrl(p,ink,.4)+'"')+'></span><span>'+p.n+'</span></button>').join("");
    $("pat-extra").hidden=prefs.pat==="none";
    $("pstr-opts").innerHTML=[[1,"Subtle"],[2,"Medium"],[3,"Bold"]].map(x=>'<button type="button" class="chip" data-pstr-opt="'+x[0]+'" aria-pressed="'+(prefs.patStr===x[0])+'">'+x[1]+'</button>').join("");
    let pc='<button type="button" class="chip" data-pcol-opt="" aria-pressed="'+(prefs.patCol==="")+'">Auto</button><button type="button" class="chip" data-pcol-opt="accent" aria-pressed="'+(prefs.patCol==="accent")+'">Accent</button>';
    if(HEX.test(prefs.patCol))pc+='<button type="button" class="chip" data-pcol-opt="'+prefs.patCol+'" aria-pressed="true"><span class="dot" style="background:'+prefs.patCol+'"></span>Custom</button>';
    $("pcol-opts").innerHTML=pc;
    const curPc=HEX.test(prefs.patCol)?prefs.patCol:ink;
    if(lc($("pcol-custom").value)!==lc(curPc))$("pcol-custom").value=curPc;
  }
  let pvRaf=0,pvQ=null;
  function previewPrefs(p){
    pvQ=Object.assign(pvQ||{},p);if(pvRaf)return;
    pvRaf=requestAnimationFrame(()=>{pvRaf=0;const q=pvQ;pvQ=null;prefs=cleanPrefs(Object.assign({},prefs,q));applyTheme()});
  }
  $("bgc-custom").addEventListener("input",e=>previewPrefs({bgCol:e.target.value}));
  $("bgc-custom").addEventListener("change",e=>setPrefs({bgCol:e.target.value}));
  $("pcol-custom").addEventListener("input",e=>previewPrefs({patCol:e.target.value}));
  $("pcol-custom").addEventListener("change",e=>setPrefs({patCol:e.target.value}));
  async function setPrefs(p){
    prefs=cleanPrefs(Object.assign({},prefs,p));
    try{localStorage.setItem("imperium-prefs",JSON.stringify(prefs))}catch(_){}
    applyTheme();
    if(col){try{await col.doc("prefs").set({kind:"prefs",mode:prefs.mode,accent:prefs.accent,hidden:prefs.hidden,lang:prefs.lang,pat:prefs.pat,patStr:prefs.patStr,patCol:prefs.patCol,bgCol:prefs.bgCol,ui:prefs.ui,tfx:prefs.tfx,anim:prefs.anim,grad:prefs.grad,vivid:prefs.vivid,updated:Date.now()})}catch(e){handleWriteErr(e)}}
  }
  $("tab-pengaturan").addEventListener("click",e=>{
    const vv=e.target.closest("[data-vivid-opt]");if(vv){setPrefs({vivid:vv.dataset.vividOpt});return}
    const gr=e.target.closest("[data-grad-opt]");if(gr){setPrefs({grad:+gr.dataset.gradOpt});return}
    const ui=e.target.closest("[data-ui-opt]");if(ui){setPrefs({ui:ui.dataset.uiOpt});return}
    const tf=e.target.closest("[data-tfx-opt]");if(tf){setPrefs({tfx:tf.dataset.tfxOpt}).then(()=>{const x=$("tfx-try");if(x){x.focus({preventScroll:true});if(window.IMP_FX)IMP_FX.test(prefs.tfx)}});return}
    const an=e.target.closest("[data-anim-opt]");if(an){setPrefs({anim:an.dataset.animOpt}).then(()=>{if(prefs.anim!=="off")window.dispatchEvent(new Event("hashchange"))});return}
    const m=e.target.closest("[data-mode-opt]");if(m){setPrefs({mode:m.dataset.modeOpt});return}
    const a=e.target.closest("[data-acc-opt]");if(a){setPrefs({accent:a.dataset.accOpt});return}
    const lg=e.target.closest("[data-lang-opt]");if(lg){setPrefs({lang:lg.dataset.langOpt});return}
    const bg=e.target.closest("[data-bgc-opt]");if(bg){setPrefs({bgCol:bg.dataset.bgcOpt});return}
    const pt=e.target.closest("[data-pat-opt]");if(pt){setPrefs({pat:pt.dataset.patOpt});return}
    const ps=e.target.closest("[data-pstr-opt]");if(ps){setPrefs({patStr:+ps.dataset.pstrOpt});return}
    const pcl=e.target.closest("[data-pcol-opt]");if(pcl)setPrefs({patCol:pcl.dataset.pcolOpt});
  });
  if(mq.addEventListener)mq.addEventListener("change",()=>{if(prefs.mode==="system")applyTheme()});
  new MutationObserver(()=>{if(prefs.mode==="system")applyTheme()}).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
  applyTheme();
  function syncPrefsFromStore(){
    const d=items.find(i=>i.kind==="prefs");if(!d)return;
    const p=cleanPrefs(d);
    if(p.mode!==prefs.mode||p.accent!==prefs.accent||p.lang!==prefs.lang||p.pat!==prefs.pat||p.patStr!==prefs.patStr||p.patCol!==prefs.patCol||p.bgCol!==prefs.bgCol||p.ui!==prefs.ui||p.tfx!==prefs.tfx||p.anim!==prefs.anim||p.grad!==prefs.grad||p.vivid!==prefs.vivid||p.hidden.join("|")!==prefs.hidden.join("|")){prefs=p;try{localStorage.setItem("imperium-prefs",JSON.stringify(prefs))}catch(_){}applyTheme()}
  }
  /* ---------- PINTASAN ---------- */
  const APPS=[
    {t:"Chat Nyenyo",d:"Telegram @Nyenyo07_Bot",u:"https://web.telegram.org/k/#@Nyenyo07_Bot",i:"TG"}
  ];
  function renderApps(){
    const x=(k,t)=>'<button type="button" class="app-x" data-rm="'+esc(k)+'" aria-label="Remove shortcut '+esc(t)+'" title="Remove shortcut">×</button>';
    const fixed=APPS.filter(a=>!prefs.hidden.includes(a.u)).map(a=>'<div class="appw"><a class="app" href="'+esc(a.u)+'" target="_blank" rel="noopener"><span class="logo ai" aria-hidden="true">'+esc(a.i)+'</span><span class="grow"><span class="t" style="display:block">'+esc(a.t)+'</span><span class="d">'+esc(a.d)+'</span></span></a>'+x("app:"+a.u,a.t)+'</div>').join("");
    const pins=byKind("link").filter(l=>l.pinned).sort((a,b)=>a.title.localeCompare(b.title,"id")).map(l=>'<div class="appw"><a class="app" href="'+esc(safeHref(l.url))+'" target="_blank" rel="noopener noreferrer">'+logoTile(l)+'<span class="grow"><span class="t" style="display:block">'+esc(l.title)+'</span><span class="d">'+esc(host(l.url))+'</span></span></a>'+x("link:"+l.id,l.title)+'</div>').join("");
    $("apps").innerHTML=fixed+pins||'<p class="hint">No shortcuts. Tick "Show in Shortcuts" on a link to add one.</p>';
  }
  $("apps").addEventListener("click",e=>{
    const b=e.target.closest("button[data-rm]");if(!b)return;
    const k=b.dataset.rm;
    if(k.startsWith("link:"))patch(k.slice(5),{pinned:false});
    else setPrefs({hidden:prefs.hidden.concat([k.slice(4)])}).then(renderApps);
  });

  /* ---------- RECAP (routines) ---------- */
  const RCWIN={daily:14,weekly:8,monthly:6};
  const RCLAB={daily:"Last 14 days",weekly:"Last 8 weeks",monthly:"Last 6 months"};
  function recapKeys(rep){
    const out=[];let k=periodKey(rep);
    for(let i=0;i<RCWIN[rep];i++){out.unshift(k);k=prevKey(rep,k)}
    return out;
  }
  const BLN_ID=["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  function keyLabel(rep,k){
    const ID=document.documentElement.lang==="id",M=ID?BLN_ID:BLN,fd=x=>{const [y,m,d]=x.split("-");return (+d)+" "+M[+m-1]+" "+y};
    if(rep==="monthly"){const [y,m]=k.split("-");return M[+m-1]+" "+y}
    return rep==="weekly"?(ID?"Minggu ":"Week of ")+fd(k):fd(k);
  }
  function keyEnded(rep,k,created){
    const c=ymd(new Date(created||Date.now()));
    if(rep==="daily")return k<c;
    if(rep==="weekly")return ymdN(dayNum(k)+6)<c;
    return k<c.slice(0,7);
  }
  function renderRecap(){
    const el=$("recap");if(!el)return;
    el.hidden=true;el.innerHTML="";return;
    const rs=byKind("task").filter(isRoutine);
    if(!ready||!rs.length){el.innerHTML="";return}
    const cur={daily:periodKey("daily"),weekly:periodKey("weekly"),monthly:periodKey("monthly")};
    let html='<div class="rc-card"><div class="rc-h"><h3>Routine recap</h3></div>';
    ["daily","weekly","monthly"].forEach(rep=>{
      const g=rs.filter(t=>t.rep===rep).sort((a,b)=>(a.created||0)-(b.created||0));if(!g.length)return;
      const keys=recapKeys(rep);
      const doneNowN=g.filter(doneNow).length;
      html+='<div class="rc-grp"><h4><span><span>'+REP[rep]+'</span> · <span>'+RCLAB[rep]+'</span></span><span class="mono">'+doneNowN+' / '+g.length+' done now</span></h4>';
      g.forEach(t=>{
        const log=new Set(t.log||[]);let on=0,tot=0;
        const cells=keys.map(k=>{
          const isCur=k===cur[rep],d=log.has(k),na=keyEnded(rep,k,t.created);
          let c="off";
          if(d)c="on";else if(na)c="na";
          if(d||(!na&&!isCur)){tot++;if(d)on++}
          return '<i role="button" tabindex="0" data-rc="'+esc(t.id)+'|'+k+'" class="'+c+(isCur?" cur":"")+'" title="'+esc(keyLabel(rep,k))+(na?" · before this routine existed":d?" · done":" · not done")+'"></i>';
        }).join("");
        const rate=tot?Math.round(on/tot*100):0,st=streakOf(t);
        html+='<div class="rc-row"><div class="rc-name">'+esc(t.title)+'<small class="mono">'+(document.documentElement.lang==="id"?on+' dari '+tot+(st?' · beruntun '+st+' '+({day:"hari",week:"minggu",month:"bulan"}[UNIT[rep]]||UNIT[rep]):''):on+' of '+tot+(st?' · '+st+'-'+UNIT[rep]+' streak':''))+'</small></div><div class="rc-cells">'+cells+'</div><div class="rc-rate mono '+(rate>=80?"t-ok":rate>=50?"t-warn":"t-crit")+'">'+(tot?rate+'%':'–')+'</div></div>';
      });
      html+='</div>';
    });
    el.innerHTML=html+'<p class="hint" style="margin-top:10px">Oldest on the left, newest on the right. The outlined square is the current period. Dashed squares are from before the routine was created.</p><p class="hint">Tap a square to mark that day, week or month as done or not done.</p></div>';
  }

  function rcToggle(el){
    const i=el.dataset.rc.lastIndexOf("|"),id=el.dataset.rc.slice(0,i),k=el.dataset.rc.slice(i+1),t=items.find(x=>x.id===id);if(!t)return;
    const had=(t.log||[]).includes(k);let log=(t.log||[]).filter(x=>x!==k);if(!had)log.push(k);
    el.classList.toggle("on",!had);el.classList.remove("na");
    patch(id,{log:log.sort().slice(-500)});
  }
  window.IMP_RC=rcToggle;
  $("recap").addEventListener("click",e=>{const c=e.target.closest("[data-rc]");if(c)rcToggle(c)});
  $("recap").addEventListener("keydown",e=>{const c=e.target.closest&&e.target.closest("[data-rc]");if(c&&(e.key==="Enter"||e.key===" ")){e.preventDefault();rcToggle(c)}});
  /* ---------- STOPWATCH ---------- */
  const SWK="imperium-sw";
  let sw={run:false,start:0,acc:0,laps:[],name:""};
  try{const r=JSON.parse(localStorage.getItem(SWK)||"null");if(r&&typeof r==="object")sw={run:!!r.run,start:+r.start||0,acc:+r.acc||0,laps:Array.isArray(r.laps)?r.laps.map(Number).filter(isFinite):[],name:String(r.name||"")}}catch(_){}
  $("sw-name").value=sw.name;
  const swKeep=()=>{try{localStorage.setItem(SWK,JSON.stringify(sw))}catch(_){}};
  const swEl=()=>sw.acc+(sw.run?Date.now()-sw.start:0);
  const pad2=n=>String(n).padStart(2,"0");
  function fmtMs(ms){ms=Math.max(0,Math.floor(ms));const h=Math.floor(ms/36e5),m=Math.floor(ms%36e5/6e4),s=Math.floor(ms%6e4/1e3),c=Math.floor(ms%1e3/10);return pad2(h)+":"+pad2(m)+":"+pad2(s)+"."+pad2(c)}
  function fmtDur(ms){const m=Math.round(ms/6e4),h=Math.floor(m/60);return h?h+" h "+pad2(m%60)+" min":(m<1?"< 1 min":m+" min")}
  function swPaint(){
    const e=swEl();
    $("sw-time").textContent=fmtMs(e);
    $("sw-go").textContent=sw.run?"Pause":(e>0?"Resume":"Start");
    $("sw-lap").disabled=!sw.run;
    $("sw-reset").disabled=e===0&&!sw.laps.length;
    $("sw-save").disabled=e<1000||!col;
    $("sw-laps").innerHTML=sw.laps.slice().reverse().map((t,ri)=>{const i=sw.laps.length-1-ri,prev=i?sw.laps[i-1]:0;return '<li><span>Lap '+(i+1)+'</span><span>+'+fmtMs(t-prev)+'</span><span>'+fmtMs(t)+'</span></li>'}).join("");
  }
  function swPause(){if(sw.run){sw.acc+=Date.now()-sw.start;sw.run=false}}
  $("sw-go").onclick=()=>{if(sw.run)swPause();else{sw.start=Date.now();sw.run=true}swKeep();swPaint()};
  $("sw-lap").onclick=()=>{if(sw.run){sw.laps.push(swEl());swKeep();swPaint()}};
  $("sw-reset").onclick=()=>{sw={run:false,start:0,acc:0,laps:[],name:$("sw-name").value};swKeep();$("sw-msg").textContent="";swPaint()};
  $("sw-name").addEventListener("input",()=>{sw.name=$("sw-name").value;swKeep()});
  $("sw-save").onclick=async()=>{
    swPause();const ms=swEl();if(ms<1000||!col){swPaint();return}
    const ok=await save("sw",null,{name:$("sw-name").value.trim().slice(0,120),ms:Math.round(ms),laps:sw.laps.length,date:today()});
    if(ok){sw={run:false,start:0,acc:0,laps:[],name:""};$("sw-name").value="";swKeep();$("sw-msg").textContent="Session saved."}
    else $("sw-msg").textContent="Couldn’t save the session. Try again.";
    swPaint();
  };
  setInterval(()=>{if(sw.run&&!document.hidden)swPaint()},100);
  window.IMP_SW_SAVE=o=>col?save("sw",null,o):Promise.resolve(false);
  function renderSw(){
    $("sw-list").innerHTML=[...new Set(byKind("task").filter(t=>!doneNow(t)).map(t=>t.title).concat(byKind("project").map(p=>p.name)))].filter(Boolean).slice(0,60).map(n=>'<option value="'+esc(n)+'">').join("");
    const el=$("sw-hist"),ss=byKind("sw").sort((a,b)=>(b.date||"").localeCompare(a.date||"")||(b.created-a.created));
    swPaint();
    if(!ready){el.innerHTML='<div class="empty">Loading sessions…</div>';return}
    if(!ss.length){el.innerHTML='<div class="empty">No saved sessions yet. Time something, then press Save session.</div>';return}
    const t0=today(),wk=periodKey("weekly");
    const sum=f=>ss.filter(f).reduce((a,x)=>a+(+x.ms||0),0);
    let html='<p class="hint">Today: <span class="mono">'+fmtDur(sum(x=>x.date===t0))+'</span> · This week: <span class="mono">'+fmtDur(sum(x=>(x.date||"")>=wk))+'</span></p>';
    const days=[...new Set(ss.map(x=>x.date))].slice(0,30);
    html+=hist("sw-hist","Session history · "+ss.length+" "+(ss.length===1?"session":"sessions"),days.map(d=>{const g=ss.filter(x=>x.date===d);return '<div class="group"><h4>'+esc(fmtDate(d))+' · <span class="mono">'+fmtDur(g.reduce((a,x)=>a+(+x.ms||0),0))+'</span></h4><ul class="list">'+g.map(x=>'<li class="mid"><div class="grow"><div class="ttl">'+(x.name?esc(x.name):'<span class="hint">Untitled</span>')+'</div><div class="meta"><span class="mono">'+fmtMs(x.ms)+'</span>'+(x.laps?'<span>'+x.laps+' laps</span>':'')+'</div></div><div class="row-actions"><button class="ghost danger" data-del="'+esc(x.id)+'">Delete</button></div></li>').join("")+'</ul></div>'}).join(""));
    el.innerHTML=html;
  }

  /* ---------- CALENDAR ---------- */
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  let calY=new Date().getFullYear(),calM=new Date().getMonth(),calSel=today();
  const EVLAB={task:"Task",proj:"Project",sub:"Renewal",pay:"Installment",sw:"Stopwatch"};
  function calEvents(y,m){
    const ev={},add=(d,o)=>{(ev[d]=ev[d]||[]).push(o)},ym=y+"-"+pad2(m+1);
    byKind("task").filter(t=>!isRoutine(t)&&t.due).forEach(t=>add(t.due,{k:"task",t:t.title,done:!!t.done,s:t.done?"Done":"Due"}));
    byKind("project").filter(p=>p.due).forEach(p=>add(p.due,{k:"proj",t:p.name,done:p.status==="Selesai",s:"Target date"}));
    byKind("sub").filter(x=>x.end).forEach(x=>add(x.end,{k:"sub",t:x.name,s:"Ends"}));
    const last=new Date(y,m+1,0).getDate();
    byKind("fin").filter(f=>f.type==="liabilitas"&&f.dueDay).forEach(f=>{
      const st=liabStats(f);if(st.rest<=0)return;
      const paid=st.ps.some(p=>(p.date||"").slice(0,7)===ym);
      add(ym+"-"+pad2(Math.min(f.dueDay,last)),{k:"pay",t:f.name,done:paid,s:(paid?"Paid this month":"Due")+(f.installment?" · "+rp(f.installment):"")});
    });
    const per={};byKind("sw").forEach(x=>{if(x.date)per[x.date]=(per[x.date]||0)+(+x.ms||0)});
    Object.keys(per).forEach(d=>add(d,{k:"sw",t:"Time tracked",s:fmtDur(per[d])}));
    return ev;
  }
  function renderCalendar(){
    const grid=$("cal");if(!grid)return;
    $("cal-title").textContent=MONTHS[calM]+" "+calY;
    const ev=calEvents(calY,calM),first=new Date(calY,calM,1),lead=(first.getDay()+6)%7,days=new Date(calY,calM+1,0).getDate(),t0=today();
    let h=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>'<div class="wd">'+d+'</div>').join("");
    for(let i=0;i<lead;i++)h+='<div class="blank"></div>';
    for(let d=1;d<=days;d++){
      const key=calY+"-"+pad2(calM+1)+"-"+pad2(d),es=ev[key]||[],kinds=[...new Set(es.map(e=>e.k))];
      h+='<button type="button" class="day'+(key===t0?" today":"")+(key===calSel?" sel":"")+'" data-d="'+key+'" aria-label="'+esc(fmtDate(key))+(es.length?", "+es.length+" items":"")+'"><span>'+d+'</span><span class="dots">'+kinds.map(k=>'<i class="dt ev-'+k+'"></i>').join("")+'</span></button>';
    }
    grid.innerHTML=h;
    renderCalDay(ev);
  }
  function renderCalDay(ev){
    ev=ev||calEvents(+calSel.slice(0,4),+calSel.slice(5,7)-1);
    const es=(ev[calSel]||[]),el=$("cal-day");
    let h='<h3 class="set-h">'+esc(fmtDate(calSel))+(calSel===today()?(document.documentElement.lang==="id"?' · Hari ini':' · Today'):'')+'</h3>';
    if(es.length)h+='<ul class="list">'+es.map(e=>'<li class="mid'+(e.done?" done":"")+'"><i class="dt ev-'+e.k+'"></i><div class="grow"><div class="ttl">'+esc(e.t)+'</div><div class="meta"><span>'+EVLAB[e.k]+'</span><span>'+esc(e.s||"")+'</span></div></div></li>').join("")+'</ul>';
    else h+='<p class="hint">Nothing scheduled on this day.</p>';
    if(calSel<=today()){
      const rs=byKind("task").filter(isRoutine);
      if(rs.length)h+='<p class="ov-sub">Routines</p><ul class="list">'+rs.map(t=>{const d=(t.log||[]).includes(periodKey(t.rep,calSel));return '<li class="mid'+(d?" done":"")+'"><div class="grow"><div class="ttl">'+esc(t.title)+'</div><div class="meta"><span class="pill p-acc">'+REP[t.rep]+'</span><span>'+(document.documentElement.lang==="id"?(d?"Selesai":"Belum")+({week:" minggu ini",month:" bulan ini"}[UNIT[t.rep]]||" hari ini"):(d?"Done":"Not done")+(t.rep!=="daily"?" this "+UNIT[t.rep]:" today"))+'</span></div></div></li>'}).join("")+'</ul>';
    }
    h+='<div><button type="button" class="soft" id="cal-add">+ Add a task due this day</button></div>';
    el.innerHTML=h;
  }
  $("cal").addEventListener("click",e=>{const b=e.target.closest("button[data-d]");if(!b)return;calSel=b.dataset.d;renderCalendar()});
  $("cal-prev").onclick=()=>{calM--;if(calM<0){calM=11;calY--}renderCalendar()};
  $("cal-next").onclick=()=>{calM++;if(calM>11){calM=0;calY++}renderCalendar()};
  $("cal-today").onclick=()=>{const n=new Date();calY=n.getFullYear();calM=n.getMonth();calSel=today();renderCalendar()};
  $("cal-day").addEventListener("click",e=>{
    if(!e.target.closest("#cal-add"))return;
    location.hash="#tugas";setFormOpen("task",true);
    $("task-rep").value="none";syncRep();$("task-due").value=calSel;$("task-title").focus();
  });

  function render(){renderBudget();renderLimit();renderApps();renderOverview();renderTasks();renderRecap();renderProjects();renderDreams();renderNotes();renderFiles();renderBackup();renderSubs();renderLinks();renderFinance();renderCalendar();renderSw()}
  render();

  addEventListener("imp-lang",()=>{if(ready)render()});
  /* ---------- connect ---------- */
  async function start(){
    if(!window.claude||!window.claude.use){setSync("Not connected",true);notice("Open this page in Claude while signed in to save your notes.");return}
    const [db,user,as,dl]=await Promise.all([claude.use("db"),claude.use("user"),claude.use("assets"),claude.use("downloads")]);
    downloads=dl; $("dream-img-wrap").hidden=!as; $("proj-photo-wrap").hidden=!as; $("btn-upload").hidden=!as;
    assets=as; $("ent-ev-wrap").hidden=!assets; $("ent-ev-off").hidden=!!assets; $("link-logo-wrap").hidden=!assets;
    if(!db||!user){setSync("Not connected",true);notice("Storage isn’t available in this view. Sign in to your Claude account and open this link again.");return}
    const uid=await user.id();
    if(!uid){setSync("Not connected",true);notice("Sign in to your Claude account to view and save your notes.");return}
    col=db.collection("data/users/"+uid);
    window.IMP_DOC_SAVE=async(id,d)=>{try{await col.doc(id).set(d);return true}catch(e){return false}};
    window.IMP_DOC_DEL=async id=>{try{await col.doc(id).delete();return true}catch(e){return false}};
    window.IMP_IELTS_SAVE=async d=>{try{await col.doc("ielts").set(Object.assign({},d,{kind:"ielts"}));return true}catch(e){return false}};
    let timer=setTimeout(()=>{setSync("Not connected yet",true);notice("Can’t reach your data yet. Check your internet connection; the page will reconnect on its own.")},10000);
    col.onSnapshot(s=>{
      items=s.docs.map(d=>Object.assign({id:d.id},d.data()));
      {const be=items.find(i=>i.id==="basicenglish");if(be&&window.IMP_BE_SYNC)window.IMP_BE_SYNC(be)}
      {const ie=items.find(i=>i.id==="ielts");window.IMP_IELTS_LAST=ie||null;if(ie&&window.IMP_IELTS_SYNC)window.IMP_IELTS_SYNC(ie)}
      {const xb=items.find(i=>i.id==="excelbos");if(xb&&window.IMP_XLBOS_SYNC)window.IMP_XLBOS_SYNC(xb)}
      if(window.IMP_TBL_SYNC)window.IMP_TBL_SYNC(items.filter(i=>i.kind==="tabel"));
      if(window.IMP_MLOCK_SYNC)window.IMP_MLOCK_SYNC(items.find(i=>i.id==="menulock"));
      ready=true;
      syncPrefsFromStore();
      syncMenuFromStore();
      syncDraftsFromStore();
      if(!s.metadata.fromCache){clearTimeout(timer);setSync("Auto-saved");notice("")}
      setFormsEnabled(true);
      render();
    },err=>{
      clearTimeout(timer);ready=true;render();
      setSync("Disconnected",true);
      notice(err&&err.code==="revoked"?"Access to this page changed.":"Lost connection to storage. Reload the page to reconnect.");
    });
  }
  start();
})();
