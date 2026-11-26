/* Imperium extra2: countdown timer, tidy stat numbers, mobile tables, folded input forms (Teguh 2026-11-22) */
(function(){
  "use strict";
  var $=function(id){return document.getElementById(id)};
  var isID=function(){return (document.documentElement.lang||"").slice(0,2)==="id"};

  /* ================= 1. tidy numbers in .stat cards ================= */
  function fitStats(root){
    (root||document).querySelectorAll(".stat .v").forEach(function(v){
      if(!v.querySelector(".cur")){
        var t=v.textContent,m=/^([−+\-]?)Rp\s?(.*)$/.exec(t);
        if(m){v.innerHTML=(m[1]?'<span class="sg">'+m[1]+'</span>':'')+'<span class="cur">Rp</span>'+m[2].replace(/[<>&]/g,"")}
      }
      var n=v.textContent.length;
      if(String(n)!==v.style.getPropertyValue("--n"))v.style.setProperty("--n",String(Math.max(6,n)));
    });
  }

  /* ================= 2. tables become cards on mobile ================= */
  var TSEL="table.ptbl,table.ie-tbl";
  function labelTables(root){
    (root||document).querySelectorAll(TSEL).forEach(function(t){
      var hr=t.querySelector("thead tr:last-child")||t.querySelector("tr");
      if(!hr)return;
      var heads=[];
      hr.querySelectorAll("th,td").forEach(function(th){var span=+th.getAttribute("colspan")||1;for(var i=0;i<span;i++)heads.push(th.textContent.trim())});
      if(!t.querySelector("thead"))hr.classList.add("mhead");
      t.classList.add("mstack");
      t.querySelectorAll("tbody tr,tfoot tr,tr").forEach(function(tr){
        if(tr===hr||tr.parentNode.tagName==="THEAD")return;
        var c=0;
        Array.prototype.forEach.call(tr.children,function(td){
          var span=+td.getAttribute("colspan")||1;
          if(span>1){td.classList.add("mfull");td.setAttribute("data-label","")}
          else{var lab=heads[c]||"";if(td.getAttribute("data-label")!==lab)td.setAttribute("data-label",lab)}
          c+=span;
        });
      });
    });
  }

  /* ================= 3. every input form folded by default ================= */
  var FOLD={
    "f-calc":{en:"+ Debt payoff calculator",id:"+ Kalkulator pelunasan hutang"},
    "ie-logf":{en:"+ Catat sesi belajar",id:"+ Catat sesi belajar"},
    "ie-mockf":{en:"+ Catat skor practice test",id:"+ Catat skor practice test"}
  };
  var openF={};
  function foldForms(){
    Object.keys(FOLD).forEach(function(id){
      var f=$(id);if(!f||f.dataset.fold)return;
      f.dataset.fold="1";
      var b=document.createElement("button");
      b.type="button";b.className="soft fold-tg";b.setAttribute("aria-controls",id);
      var paint=function(){var o=!f.hidden;b.textContent=o?(id.indexOf("ie-")===0?"− Sembunyikan":"− Hide form"):(id.indexOf("ie-")===0||isID()?FOLD[id].id:FOLD[id].en);b.setAttribute("aria-expanded",String(o))};
      b.onclick=function(){f.hidden=!f.hidden;openF[id]=!f.hidden;paint();if(!f.hidden){var x=f.querySelector("input,select,textarea");if(x)try{x.focus({preventScroll:true})}catch(_){}}};
      f.parentNode.insertBefore(b,f);
      f.hidden=!openF[id];paint();
    });
  }

  /* ================= 4. countdown (hitung mundur) ================= */
  var CDK="imperium-cd",MK="imperium-sw-mode";
  var cd={target:25*6e4,run:false,start:0,acc:0,done:false};
  try{var r=JSON.parse(localStorage.getItem(CDK)||"null");if(r&&typeof r==="object")cd={target:+r.target||25*6e4,run:!!r.run,start:+r.start||0,acc:+r.acc||0,done:!!r.done}}catch(_){}
  var mode="sw";try{mode=localStorage.getItem(MK)==="cd"?"cd":"sw"}catch(_){}
  var keep=function(){try{localStorage.setItem(CDK,JSON.stringify(cd))}catch(_){}};
  var el=function(){return cd.acc+(cd.run?Date.now()-cd.start:0)};
  var left=function(){return Math.max(0,cd.target-el())};
  var p2=function(n){return String(n).padStart(2,"0")};
  function fmt(ms){var s=Math.ceil(ms/1000),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return p2(h)+":"+p2(m)+":"+p2(s%60)}
  var actx=null;
  function unlockAudio(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==="suspended")actx.resume()}catch(_){}}
  function beep(){
    try{unlockAudio();if(!actx)return;var t0=actx.currentTime;
      for(var i=0;i<6;i++){var o=actx.createOscillator(),g=actx.createGain();o.type="sine";o.frequency.value=i%2?660:880;
        var t=t0+i*.32;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.35,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.28);
        o.connect(g);g.connect(actx.destination);o.start(t);o.stop(t+.3)}
    }catch(_){}
    try{navigator.vibrate&&navigator.vibrate([300,120,300,120,500])}catch(_){}
  }
  function notify(msg){
    try{if(window.Notification&&Notification.permission==="granted"){
      if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration)navigator.serviceWorker.getRegistration().then(function(reg){if(reg)reg.showNotification("Imperium",{body:msg,icon:"icon-192-v2.png",vibrate:[300,120,300]});else new Notification("Imperium",{body:msg})}).catch(function(){new Notification("Imperium",{body:msg})});
      else new Notification("Imperium",{body:msg});
    }}catch(_){}
  }
  async function saveSession(ms,auto){
    var name=(($("sw-name")||{}).value||"").trim().slice(0,120);
    if(ms<1000||!window.IMP_SW_SAVE)return false;
    var d=new Date(),day=d.getFullYear()+"-"+p2(d.getMonth()+1)+"-"+p2(d.getDate());
    var ok=await window.IMP_SW_SAVE({name:name||(isID()?"Hitung mundur":"Countdown"),ms:Math.round(ms),laps:0,date:day,cd:true});
    var m=$("cd-msg");if(m)m.textContent=ok?(auto?(isID()?"Waktu habis — sesi tersimpan.":"Time’s up — session saved."):(isID()?"Sesi tersimpan.":"Session saved.")):(isID()?"Gagal menyimpan sesi.":"Couldn’t save the session.");
    return ok;
  }
  function finish(){
    cd.acc=cd.target;cd.run=false;cd.done=true;keep();
    beep();notify(isID()?"Hitung mundur selesai!":"Countdown finished!");
    var box=$("cd-box");if(box){box.classList.add("cd-ring");setTimeout(function(){box.classList.remove("cd-ring")},6000)}
    saveSession(cd.target,true);
    paint();
  }
  function setTarget(ms){cd={target:Math.max(1000,Math.min(ms,99*36e5)),run:false,start:0,acc:0,done:false};keep();syncInputs();paint()}
  function syncInputs(){var s=Math.round(cd.target/1000);if($("cd-h")){$("cd-h").value=Math.floor(s/3600);$("cd-m").value=Math.floor(s%3600/60);$("cd-s").value=s%60}}
  function readInputs(){var h=+$("cd-h").value||0,m=+$("cd-m").value||0,s=+$("cd-s").value||0;return((h*60+m)*60+s)*1000}
  function paint(){
    var t=$("cd-time");if(!t)return;
    var l=left(),e=el();
    t.textContent=fmt(l);
    t.classList.toggle("cd-low",cd.run&&l<=10000);
    t.classList.toggle("cd-zero",cd.done);
    $("cd-bar").style.width=(cd.target?Math.min(100,e/cd.target*100):0)+"%";
    var id=isID();
    $("cd-go").textContent=cd.run?(id?"Jeda":"Pause"):(cd.done?(id?"Ulangi":"Restart"):(e>0?(id?"Lanjut":"Resume"):(id?"Mulai":"Start")));
    $("cd-reset").disabled=e===0&&!cd.done;
    $("cd-save").disabled=cd.done||e<1000;
    $("cd-plus").disabled=false;
    $("cd-set").querySelectorAll("input,button").forEach(function(x){x.disabled=cd.run});
  }
  function applyMode(){
    var c=$("sw-time");if(!c)return;var card=c.closest(".setcard");
    card.classList.toggle("is-cd",mode==="cd");
    card.querySelectorAll(".sw-mode button").forEach(function(b){var on=b.dataset.m===mode;b.classList.toggle("on",on);b.setAttribute("aria-selected",String(on))});
    try{localStorage.setItem(MK,mode)}catch(_){}
    paint();
  }
  function buildCountdown(){
    var t=$("sw-time");if(!t||$("cd-box"))return;
    var card=t.closest(".setcard");
    var seg=document.createElement("div");seg.className="sw-mode";seg.setAttribute("role","tablist");
    seg.innerHTML='<button type="button" role="tab" data-m="sw">⏱ Stopwatch</button><button type="button" role="tab" data-m="cd">⏳ Countdown</button>';
    card.insertBefore(seg,card.firstChild);
    var box=document.createElement("div");box.id="cd-box";box.className="cd-box";
    var PRE=[1,5,10,15,25,30,45,60,90];
    box.innerHTML='<div class="sw-time mono cd-time" id="cd-time" aria-live="off">00:25:00</div>'
      +'<div class="cd-track"><i id="cd-bar"></i></div>'
      +'<div class="cd-set" id="cd-set"><div class="cd-hms">'
      +'<label>Hours<input id="cd-h" type="number" min="0" max="99" inputmode="numeric"></label>'
      +'<label>Minutes<input id="cd-m" type="number" min="0" max="59" inputmode="numeric"></label>'
      +'<label>Seconds<input id="cd-s" type="number" min="0" max="59" inputmode="numeric"></label></div>'
      +'<div class="cd-pre">'+PRE.map(function(m){return '<button type="button" class="chip" data-min="'+m+'">'+(m>=60?(m/60)+" h":m+" min")+'</button>'}).join("")+'</div></div>'
      +'<div class="preview cd-acts"><button type="button" class="primary" id="cd-go">Start</button><button type="button" id="cd-plus">+1 min</button><button type="button" id="cd-reset">Reset</button><button type="button" class="soft" id="cd-save">Save session</button></div>'
      +'<p class="hint" id="cd-msg" role="status"></p>';
    t.parentNode.insertBefore(box,t.nextSibling);
    seg.addEventListener("click",function(e){var b=e.target.closest("button[data-m]");if(!b)return;mode=b.dataset.m;applyMode()});
    ["cd-h","cd-m","cd-s"].forEach(function(id){$(id).addEventListener("change",function(){var ms=readInputs();if(ms>=1000)setTarget(ms)})});
    box.querySelector(".cd-pre").addEventListener("click",function(e){var b=e.target.closest("[data-min]");if(b)setTarget(+b.dataset.min*6e4)});
    $("cd-go").onclick=function(){
      unlockAudio();
      try{if(window.Notification&&Notification.permission==="default")Notification.requestPermission()}catch(_){}
      if(cd.run){cd.acc+=Date.now()-cd.start;cd.run=false}
      else{if(cd.done){cd.acc=0;cd.done=false}var ms=readInputs();if(!el()&&ms>=1000)cd.target=ms;cd.start=Date.now();cd.run=true;$("cd-msg").textContent=""}
      keep();paint();
    };
    $("cd-plus").onclick=function(){cd.target+=6e4;if(cd.done){cd.done=false;cd.acc=cd.target-6e4;}keep();if(!cd.run)syncInputs();paint()};
    $("cd-reset").onclick=function(){cd.run=false;cd.acc=0;cd.start=0;cd.done=false;keep();$("cd-msg").textContent="";paint()};
    $("cd-save").onclick=async function(){if(cd.run){cd.acc+=Date.now()-cd.start;cd.run=false}var ms=el();if(await saveSession(ms,false)){cd.acc=0;cd.done=false}keep();paint()};
    syncInputs();applyMode();
    setInterval(function(){if(cd.run){if(left()<=0)finish();else if(!document.hidden&&mode==="cd")paint()}},200);
  }


  /* ================= 5. app logo (home-screen icon) per device ================= */
  var IK="imp-icon-v1";
  function themeBg(){try{var v=getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();return v||"#2a0f2e"}catch(_){return "#2a0f2e"}}
  var lastMan="";
  function applyIcon(o){
    try{
      var base=location.href.replace(/[#?].*$/,"").replace(/[^\/]*$/,""),col=themeBg();
      var lm=document.querySelector('link[rel="manifest"]'),li=document.querySelector('link[rel="icon"]'),la=document.querySelector('link[rel="apple-touch-icon"]');
      var icons=o?[{src:o.i192,sizes:"192x192",type:"image/png"},{src:o.i512,sizes:"512x512",type:"image/png"},{src:o.m512,sizes:"512x512",type:"image/png",purpose:"maskable"}]
        :[{src:base+"icon-192-v2.png",sizes:"192x192",type:"image/png"},{src:base+"icon-512-v2.png",sizes:"512x512",type:"image/png"},{src:base+"icon-512-maskable-v2.png",sizes:"512x512",type:"image/png",purpose:"maskable"}];
      var m={name:"Imperium",short_name:"Imperium",description:"Buku catatan pribadi",id:base,start_url:base+"#overview",scope:base,display:"standalone",background_color:col,theme_color:col,orientation:"any",icons:icons};
      var js=JSON.stringify(m);
      if(lm&&js!==lastMan){lastMan=js;lm.href=URL.createObjectURL(new Blob([js],{type:"application/manifest+json"}))}
      if(li)li.href=o?o.i192:"favicon-v2.png";if(la)la.href=o?o.i180:"icon-180-v2.png";
    }catch(_){}
  }
  /* status bar / browser bar colour follows the chosen theme */
  function syncThemeColor(){
    var c=themeBg();
    var mt=document.querySelector('meta[name="theme-color"]');if(!mt){mt=document.createElement("meta");mt.name="theme-color";document.head.appendChild(mt)}
    if(mt.content!==c)mt.content=c;
    if(document.documentElement.style.backgroundColor!==c)document.documentElement.style.backgroundColor=c;
    try{if(localStorage.getItem("imp-theme-bg")!==c){localStorage.setItem("imp-theme-bg",c);appliedT=-1;refreshIcon()}}catch(_){}
  }
  window.IMP_APPLY_ICON=applyIcon;
  function recode(url,size,type,q){return new Promise(function(res){var im=new Image();im.onload=function(){var c=document.createElement("canvas");c.width=c.height=size;var x=c.getContext("2d");x.imageSmoothingQuality="high";x.drawImage(im,0,0,size,size);res(c.toDataURL(type,q))};im.onerror=function(){res(url)};im.src=url})}
  async function compact(o){
    var w=await recode(o.i512,512,"image/webp",.9),mw=await recode(o.m512,512,"image/webp",.9);
    if(w.indexOf("data:image/webp")!==0){w=o.i512;mw=o.m512}
    return {kind:"appicon",i512:w,m512:mw,i192:w,i180:await recode(o.i512,180,"image/png"),t:o.t};
  }
  function syncedIcon(){try{var c=JSON.parse(localStorage.getItem("imp-cache-v1")||"null");return c&&c.appicon||null}catch(_){return null}}
  function localIcon(){try{return JSON.parse(localStorage.getItem(IK)||"null")}catch(_){return null}}
  function pickIcon(){var a=localIcon(),b=syncedIcon();var w=(a&&b)?((+b.t||0)>(+a.t||0)?b:a):(a||b);return w&&!w.off&&w.i192?w:null}
  var appliedT=-1;
  function refreshIcon(){var w=pickIcon(),t=w?+w.t||1:0;if(t!==appliedT){appliedT=t;applyIcon(w);var cur=$("ic-cur");if(cur)cur.src=w?w.i192:"icon-192-v2.png";document.querySelectorAll(".side-logo,.lnc-logo").forEach(function(im){im.src=w?w.i192:"icon-192-v2.png"})}}
  function makeIcons(img,bg,zoom){
    function draw(size,mask,fill){
      var c=document.createElement("canvas");c.width=c.height=size;var x=c.getContext("2d");
      if(fill){x.fillStyle=bg;x.fillRect(0,0,size,size)}
      var area=size*(mask?.8:1)*zoom,w=img.naturalWidth,h=img.naturalHeight,k=Math.max(area/w,area/h);
      if(zoom<1)k=Math.min(area/w,area/h);
      var dw=w*k,dh=h*k;x.save();
      if(mask){x.beginPath();x.rect((size-size*.8)/2,(size-size*.8)/2,size*.8,size*.8);x.clip()}
      else{x.beginPath();x.rect(0,0,size,size);x.clip()}
      x.imageSmoothingQuality="high";x.drawImage(img,(size-dw)/2,(size-dh)/2,dw,dh);x.restore();
      return c.toDataURL("image/png");
    }
    var o={i192:draw(192,false,true),i512:draw(512,false,true),m512:draw(512,true,true),i180:draw(180,false,true),t:Date.now()};
    return o;
  }
  function buildIconCard(){
    var host=$("tab-pengaturan");if(!host||$("imp-iconcard"))return;
    var c=document.createElement("div");c.className="setcard";c.id="imp-iconcard";
    c.innerHTML='<h3 class="set-h">Logo aplikasi di HP</h3>'
      +'<p class="hint">Ganti ikon Imperium di layar utama HP dan di tab browser. Berlaku di semua perangkat yang masuk dengan akun Imperium Anda.</p>'
      +'<div class="ic-row"><div class="ic-prev"><img id="ic-cur" alt="Logo sekarang"><small>Sekarang</small></div><div class="ic-prev"><img id="ic-new" alt="" hidden><span class="ic-empty" id="ic-empty">Belum dipilih</span><small>Baru</small></div></div>'
      +'<label>Pilih gambar (PNG/JPG, persegi lebih bagus)<input type="file" id="ic-file" accept="image/*"></label>'
      +'<div class="ic-opts"><label>Warna latar<input type="color" id="ic-bg" value="#2a0f2e"></label><label>Ukuran<select id="ic-zoom"><option value="1">Penuh (dipotong persegi)</option><option value="0.82">Ada jarak tepi</option><option value="0.65">Kecil di tengah</option></select></label></div>'
      +'<div class="preview"><button type="button" class="primary" id="ic-save" disabled>Pakai logo ini</button><button type="button" id="ic-reset">Kembalikan logo bawaan</button></div>'
      +'<p class="hint" id="ic-msg" role="status"></p>'
      +'<details class="ic-how"><summary>Supaya ikon di layar utama ikut berubah</summary><ol><li>Simpan logo baru di sini.</li><li>Hapus ikon Imperium lama dari layar utama HP (tekan lama → Hapus / Copot).</li><li>Buka lagi halaman Imperium di Chrome (Android) atau Safari (iPhone).</li><li>Android: menu ⋮ → <b>Instal aplikasi</b> / Tambahkan ke layar utama. iPhone: tombol Bagikan → <b>Tambah ke Layar Utama</b>.</li></ol></details>';
    var foot=host.querySelector("footer");host.insertBefore(c,foot||null);
    var img=null,cur=null;
    cur=pickIcon();
    $("ic-cur").src=cur?cur.i192:"icon-192-v2.png";
    function preview(){if(!img)return;var o=makeIcons(img,$("ic-bg").value,+$("ic-zoom").value);$("ic-new").src=o.m512;$("ic-new").hidden=false;$("ic-empty").hidden=true;$("ic-save").disabled=false;return o}
    $("ic-file").onchange=function(){
      var f=this.files&&this.files[0];if(!f)return;
      if(!/^image\//.test(f.type)){$("ic-msg").textContent="File itu bukan gambar.";return}
      var u=URL.createObjectURL(f),im=new Image();
      im.onload=function(){img=im;preview();$("ic-msg").textContent=(im.naturalWidth<192||im.naturalHeight<192)?"Gambar kecil ("+im.naturalWidth+"×"+im.naturalHeight+"), ikon bisa terlihat buram. Disarankan minimal 512×512.":""};
      im.onerror=function(){$("ic-msg").textContent="Gambar tidak bisa dibaca."};im.src=u;
    };
    $("ic-bg").oninput=preview;$("ic-zoom").onchange=preview;
    $("ic-save").onclick=function(){
      var o=preview();if(!o)return;
      try{localStorage.setItem(IK,JSON.stringify(o))}catch(e){$("ic-msg").textContent="Gagal menyimpan logo (memori browser penuh). Coba gambar yang lebih kecil.";return}
      appliedT=-1;refreshIcon();
      $("ic-msg").textContent="Logo tersimpan dan dikirim ke perangkat lain (laptop/HP lain ikut berganti setelah sinkron). Untuk ikon di layar utama HP, ikuti langkah di bawah.";
      compact(o).then(function(d){if(window.IMP_DOC_SAVE)window.IMP_DOC_SAVE("appicon",d)});
      c.querySelector(".ic-how").open=true;
    };
    $("ic-reset").onclick=function(){var off={kind:"appicon",off:true,t:Date.now()};try{localStorage.setItem(IK,JSON.stringify(off))}catch(_){}if(window.IMP_DOC_SAVE)window.IMP_DOC_SAVE("appicon",off);appliedT=-1;refreshIcon();$("ic-msg").textContent="Logo bawaan dipakai lagi. Pasang ulang ikon di layar utama agar ikut kembali.";};
  }

  /* ================= wiring ================= */
  var queued=false;
  function pass(){queued=false;try{fitStats()}catch(e){}try{labelTables()}catch(e){}try{foldForms()}catch(e){}}
  function boot(){
    buildCountdown();try{buildIconCard();refreshIcon();syncThemeColor();setInterval(refreshIcon,5000);new MutationObserver(syncThemeColor).observe(document.documentElement,{attributes:true,attributeFilter:["style","class","data-mode","data-theme"]});if(window.matchMedia)matchMedia("(prefers-color-scheme: dark)").addEventListener("change",syncThemeColor)}catch(e){}pass();
    new MutationObserver(function(){if(!queued){queued=true;requestAnimationFrame(pass)}}).observe(document.body,{childList:true,subtree:true});
    /* language switch: repaint countdown labels */
    new MutationObserver(function(){paint();document.querySelectorAll(".fold-tg").forEach(function(b){var f=$(b.getAttribute("aria-controls"));if(f&&f.hidden&&FOLD[f.id]&&f.id.indexOf("ie-")!==0)b.textContent=isID()?FOLD[f.id].id:FOLD[f.id].en})}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();
