/* ==== Imperium: header tiap menu + stopwatch mini (Basic English & IELTS) + kunci menu (Teguh 2026-11-26) ==== */
(function(){
  function T(en,id){return document.documentElement.lang==="id"?id:en}
  function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function cur(){var h=(location.hash||"").slice(1);if(h==="stopwatch")h="calendar";if(h==="keuangan")h="aset";return document.getElementById("tab-"+h)?h:"overview"}
  function navA(t){return document.querySelector('.nav a[data-tab="'+t+'"]')}
  function grpOf(t){var a=navA(t),g=a&&a.closest(".ngrp");return g?g.dataset.ng:null}
  function lbl(n){var x=n&&n.querySelector(".ni");return x?x.textContent.trim():""}
  function scope(t){return grpOf(t)||t}

  /* ---------- header: jalur menu + keterangan singkat ---------- */
  var DESC={
    today:["Your top 3, routines, habits, check-in and journal for today.","Tiga prioritas, rutinitas, kebiasaan, check-in, dan jurnal hari ini."],
    weekly:["Look back on the week and set the focus for the next one.","Tinjau minggu ini dan tentukan fokus minggu depan."],
    goalmap:["Dreams, the projects that serve them and their tasks.","Impian, proyek yang mendukungnya, dan tugas-tugasnya."],
    insights:["Charts of your money, focus time and finished tasks.","Grafik keuangan, waktu fokus, dan tugas selesai."],
    career:["Job applications from wishlist to offer, with follow-ups.","Lamaran kerja dari incaran sampai offer, lengkap dengan follow-up."],
    ventures:["Each business: cash in and out, and its KPIs.","Tiap usaha: uang masuk-keluar dan KPI-nya."],
    people:["Important contacts, birthdays and who to follow up.","Kontak penting, ulang tahun, dan siapa yang perlu dihubungi."],
    health:["Sleep, exercise and weight over time.","Tidur, olahraga, dan berat badan dari waktu ke waktu."],
    journal:["Every journal entry, newest first.","Semua catatan jurnal, terbaru di atas."],
    overview:["Today, projects, money and links at a glance.","Ringkasan hari ini, proyek, keuangan, dan tautan dalam satu layar."],
    english:["Grammar step by step, practice and your study streak.","Grammar bertahap, latihan soal, dan catatan belajar Anda."],
    ielts:["IELTS practice towards band 7: listening, reading, writing, speaking.","Latihan IELTS menuju band 7: listening, reading, writing, speaking."],
    tugas:["Tasks and daily, weekly and monthly routines.","Tugas dan rutinitas harian, mingguan, bulanan."],
    "masa-aktif":["Things that run out: subscriptions, documents, warranties.","Hal yang punya masa berlaku: langganan, dokumen, garansi."],
    calendar:["Stopwatch sessions and your calendar.","Sesi stopwatch dan kalender Anda."],
    proyek:["Projects with progress, costs and proof photos.","Proyek dengan progres, biaya, dan foto bukti."],
    dreams:["The things you are working towards.","Impian dan target yang sedang Anda kejar."],
    akun:["Your accounts and their balances.","Akun dan saldo Anda."],
    record:["Every income and expense record.","Semua catatan pemasukan dan pengeluaran."],
    aset:["What you own.","Aset yang Anda miliki."],
    hutang:["Debts and installments to pay.","Utang dan cicilan yang perlu dibayar."],
    budget:["Monthly budget per expense category.","Anggaran bulanan per kategori expense."],
    kategori:["Income and expense categories.","Kategori pemasukan dan pengeluaran."],
    notes:["Your notes and folders.","Catatan dan folder Anda."],
    files:["Photos and files stored in your account.","Foto dan berkas yang tersimpan di akun Anda."],
    excel:["A spreadsheet with formulas, formats and sheets.","Lembar kerja dengan rumus, format, dan sheet."],
    tabel:["Free tables: type in any cell, rename headers, align and format.","Tabel bebas: isi sel sesuka Anda, ganti nama header, atur rata dan format."],
    pengaturan:["Appearance, menus, locks, backup and account.","Tampilan, menu, kunci, cadangan, dan akun."],
    info:["How much of your Supabase space is used and how much is left.","Seberapa banyak ruang Supabase yang terpakai dan sisanya."]
  };
  var tb=document.querySelector(".topbar"),vt=document.getElementById("view-title");
  if(tb&&vt&&!document.getElementById("vt-wrap")){
    var w=document.createElement("div");w.className="vt-wrap";w.id="vt-wrap";vt.parentNode.insertBefore(w,vt);
    var cr=document.createElement("p");cr.className="vt-crumb";cr.id="vt-crumb";w.appendChild(cr);w.appendChild(vt);
    var sb=document.createElement("p");sb.className="vt-sub";sb.id="vt-sub";w.appendChild(sb);
    var tools=document.createElement("div");tools.className="vt-tools";tools.id="vt-tools";
    var ref=document.getElementById("sync-top");tb.insertBefore(tools,ref||null);
  }
  function header(){
    var t=cur(),g=grpOf(t),gn=g&&document.querySelector('.ngrp[data-ng="'+g+'"] .ng-btn'),cr=document.getElementById("vt-crumb"),sb=document.getElementById("vt-sub");
    if(cr){cr.innerHTML=gn?esc(lbl(gn))+' <span aria-hidden="true">›</span>':"";cr.hidden=!gn}
    var d=DESC[t];if(sb){sb.textContent=d?T(d[0],d[1]):"";sb.hidden=!d}
    var tools=document.getElementById("vt-tools");if(tools){var on=t==="english"||t==="ielts";tools.hidden=!on;if(on)swMount(tools)}
    document.documentElement.setAttribute("data-cur-tab",t);
  }

  /* ---------- stopwatch mini: maju (stopwatch) & mundur (timer) ---------- */
  var SK="imp-sw-mini",S=null,tick=0,el=null;
  function load(){try{S=JSON.parse(localStorage.getItem(SK)||"null")}catch(_){S=null}S=Object.assign({mode:"up",run:false,t0:0,acc:0,dur:25*60000,done:false},S||{})}
  function store(){try{localStorage.setItem(SK,JSON.stringify(S))}catch(_){}}
  function elapsed(){return S.acc+(S.run?Date.now()-S.t0:0)}
  function fmt(ms){ms=Math.max(0,ms);var s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;function p(n){return (n<10?"0":"")+n}return (h?h+":"+p(m):p(m))+":"+p(x)}
  function value(){return S.mode==="up"?elapsed():S.dur-elapsed()}
  function beep(){try{var C=window.AudioContext||window.webkitAudioContext,a=new C(),o=a.createOscillator(),g=a.createGain();o.connect(g);g.connect(a.destination);o.frequency.value=880;g.gain.value=.12;o.start();
      [0,.25,.5].forEach(function(t,i){g.gain.setValueAtTime(i%2?0:.12,a.currentTime+t)});g.gain.setValueAtTime(.12,a.currentTime+.5);g.gain.setValueAtTime(0,a.currentTime+.8);o.stop(a.currentTime+.85)}catch(_){}
    try{navigator.vibrate&&navigator.vibrate([250,120,250])}catch(_){}}
  function finish(){S.run=false;S.acc=S.dur;S.done=true;store();beep();
    try{if(window.Notification&&Notification.permission==="granted")new Notification("Imperium",{body:T("Countdown finished","Waktu mundur selesai"),icon:"icon-192-v2.png"})}catch(_){}
    var t=document.createElement("div");t.className="sw-toast";t.textContent="⏳ "+T("Time is up!","Waktu habis!");document.body.appendChild(t);setTimeout(function(){t.remove()},4000)}
  function paint(){if(!el)return;var v=value();if(S.mode==="down"&&S.run&&v<=0){finish();v=0}
    var d=el.querySelector(".sw-d");if(d)d.textContent=fmt(S.mode==="down"?Math.ceil(v/1000)*1000:v);
    el.classList.toggle("run",S.run);el.classList.toggle("done",S.done&&S.mode==="down");
    var b=el.querySelector("[data-sw=go]");if(b){b.textContent=S.run?"❚❚":"▶";b.title=S.run?T("Pause","Jeda"):T("Start","Mulai")}
    el.querySelectorAll("[data-swm]").forEach(function(x){x.setAttribute("aria-pressed",String(x.dataset.swm===S.mode))});
    var st=el.querySelector(".sw-set");if(st)st.hidden=S.mode!=="down"||S.run||elapsed()>0;
    clearInterval(tick);if(S.run)tick=setInterval(paint,250)}
  function swMount(host){
    if(!S)load();
    if(!el){el=document.createElement("div");el.className="swm";el.setAttribute("role","group");el.setAttribute("aria-label",T("Study timer","Timer belajar"));
      el.innerHTML='<div class="sw-m"><button type="button" data-swm="up" title="'+T("Stopwatch (count up)","Stopwatch (waktu maju)")+'">⏱</button><button type="button" data-swm="down" title="'+T("Countdown","Hitung mundur")+'">⏳</button></div>'
        +'<span class="sw-d" aria-live="off">00:00</span>'
        +'<span class="sw-set"><select data-swdur aria-label="'+T("Countdown minutes","Menit hitung mundur")+'">'+[5,10,15,20,25,30,45,60,90,120].map(function(m){return '<option value="'+m+'">'+m+" "+T("min","mnt")+"</option>"}).join("")+'<option value="c">'+T("Other…","Lainnya…")+"</option></select></span>"
        +'<button type="button" data-sw="go">▶</button><button type="button" data-sw="reset" title="'+T("Reset","Ulang")+'">↺</button>';
      el.addEventListener("click",function(e){var m=e.target.closest("[data-swm]");if(m){if(S.mode!==m.dataset.swm){S.mode=m.dataset.swm;S.run=false;S.acc=0;S.done=false;store()}paint();return}
        var b=e.target.closest("[data-sw]");if(!b)return;
        if(b.dataset.sw==="go"){if(S.run){S.acc+=Date.now()-S.t0;S.run=false}else{if(S.mode==="down"&&elapsed()>=S.dur){S.acc=0}S.done=false;S.t0=Date.now();S.run=true;
            try{if(S.mode==="down"&&window.Notification&&Notification.permission==="default")Notification.requestPermission()}catch(_){}}store();paint()}
        else if(b.dataset.sw==="reset"){S.run=false;S.acc=0;S.done=false;store();paint()}});
      el.addEventListener("change",function(e){var x=e.target.closest("[data-swdur]");if(!x)return;var v=x.value;
        if(v==="c"){var n=prompt(T("Minutes","Berapa menit?"),String(Math.round(S.dur/60000)));n=parseFloat(String(n||"").replace(",","."));if(n>0&&n<=600){S.dur=Math.round(n*60000)}}else S.dur=+v*60000;
        sync();S.acc=0;S.done=false;store();paint()});
    }
    function sync(){var x=el.querySelector("[data-swdur]"),m=Math.round(S.dur/60000),has=[].some.call(x.options,function(o){return o.value===String(m)});
      if(!has){var o=x.querySelector("option.cus")||document.createElement("option");o.className="cus";o.value=String(m);o.textContent=m+" "+T("min","mnt");x.insertBefore(o,x.lastElementChild)}x.value=String(m)}
    if(el.parentNode!==host)host.appendChild(el);sync();paint();
  }
  document.addEventListener("visibilitychange",function(){if(!document.hidden&&el)paint()});
  addEventListener("storage",function(e){if(e.key===SK){load();paint()}});

  /* ---------- kunci menu ---------- */
  var LK="imp-mlock",locked=[],okScope=null,lt=0;
  try{var c=JSON.parse(localStorage.getItem(LK)||"null");if(c&&Array.isArray(c.tabs)){locked=c.tabs;lt=+c.t||0}}catch(_){}
  function isLocked(t){return locked.indexOf(t)>=0}
  function saveLocks(){lt=Date.now();try{localStorage.setItem(LK,JSON.stringify({tabs:locked,t:lt}))}catch(_){}if(window.IMP_DOC_SAVE)window.IMP_DOC_SAVE("menulock",{kind:"menulock",tabs:locked.slice(),t:lt});marks();guard()}
  window.IMP_MLOCK_SYNC=function(d){if(!d||!Array.isArray(d.tabs)||(+d.t||0)<=lt)return;locked=d.tabs.slice();lt=+d.t||0;try{localStorage.setItem(LK,JSON.stringify({tabs:locked,t:lt}))}catch(_){}marks();renderLockCard();guard()};
  window.IMP_IS_LOCKED=function(t){return isLocked(t)&&okScope!==scope(t)};
  function marks(){document.querySelectorAll(".nav a[data-tab]").forEach(function(a){a.classList.toggle("is-locked",isLocked(a.dataset.tab))});
    document.querySelectorAll(".ngrp").forEach(function(g){var subs=g.querySelectorAll(".nsub>a[data-tab]"),all=subs.length&&[].every.call(subs,function(a){return isLocked(a.dataset.tab)});g.classList.toggle("is-locked",!!all)})}
  var panel=null;
  function guard(){
    var t=cur(),sec=document.getElementById("tab-"+t);if(!sec)return;
    if(okScope&&okScope!==scope(t))okScope=null;  /* pindah ke menu lain: kunci aktif lagi */
    var need=isLocked(t)&&okScope!==scope(t);
    if(!panel){panel=document.createElement("section");panel.className="panel mlock";panel.id="mlock";panel.hidden=true;var mn=document.querySelector(".main");(mn||document.body).appendChild(panel)}
    if(need){document.querySelectorAll("section.panel[id^='tab-']").forEach(function(p){if(!p.hidden){p.hidden=true;p.dataset.mlocked="1"}});
      var nm=lbl(navA(t));panel.innerHTML='<form class="mlock-f" autocomplete="off"><div class="mlock-ic">🔒</div><h3>'+esc(nm)+" "+T("is locked","dikunci")+'</h3><p class="hint">'+T("Enter your Imperium password to open this menu.","Masukkan password Imperium untuk membuka menu ini.")+'</p>'
        +'<input type="password" id="mlock-pw" autocomplete="current-password" placeholder="'+T("Password","Password")+'" aria-label="Password">'
        +'<label class="mlock-show"><input type="checkbox" id="mlock-sh"> '+T("Show password","Tampilkan password")+'</label>'
        +'<button type="submit" class="primary">'+T("Open","Buka")+'</button><p class="mlock-msg" role="status"></p></form>';
      panel.hidden=false;var pw=panel.querySelector("#mlock-pw");setTimeout(function(){try{pw.focus()}catch(_){}},30);
      panel.querySelector("#mlock-sh").onchange=function(e){pw.type=e.target.checked?"text":"password"};
      panel.querySelector("form").onsubmit=async function(e){e.preventDefault();var m=panel.querySelector(".mlock-msg"),b=panel.querySelector("button[type=submit]");b.disabled=true;m.textContent=T("Checking…","Memeriksa…");
        var ok=window.IMP_CHECK_PW?await window.IMP_CHECK_PW(pw.value):true;b.disabled=false;
        if(ok===true){okScope=scope(cur());guard();return}
        m.textContent=ok==="offline"?T("Can't check without internet.","Tidak bisa memeriksa tanpa internet."):T("Wrong password.","Password salah.");pw.select()};
    }else{
      if(!panel.hidden){panel.hidden=true;panel.innerHTML=""}
      document.querySelectorAll("section.panel[data-mlocked]").forEach(function(p){delete p.dataset.mlocked});
      if(sec.hidden&&!sec.dataset.mlocked){/* showTab sudah menentukan; buka kembali tab aktif */sec.hidden=false}
    }
  }
  /* kartu pengaturan */
  function renderLockCard(){
    var host=document.getElementById("tab-pengaturan");if(!host)return;var card=document.getElementById("mlock-card");
    if(!card){card=document.createElement("div");card.className="setcard";card.id="mlock-card";var anchor=document.getElementById("ui-sel");anchor=anchor&&anchor.closest(".setcard");
      if(anchor&&anchor.nextSibling)anchor.parentNode.insertBefore(card,anchor.nextSibling);else host.insertBefore(card,host.querySelector("footer")||null);
      card.addEventListener("change",function(e){var x=e.target;if(x.dataset.lk){var i=locked.indexOf(x.dataset.lk);if(x.checked&&i<0)locked.push(x.dataset.lk);if(!x.checked&&i>=0)locked.splice(i,1);saveLocks();renderLockCard()}
        else if(x.dataset.lkg){var subs=[].map.call(document.querySelectorAll('.ngrp[data-ng="'+x.dataset.lkg+'"] .nsub>a[data-tab]'),function(a){return a.dataset.tab});
          subs.forEach(function(t){var i=locked.indexOf(t);if(x.checked&&i<0)locked.push(t);if(!x.checked&&i>=0)locked.splice(i,1)});saveLocks();renderLockCard()}});
    }
    var h='<h3 class="set-h">'+T("Lock menus","Kunci menu")+'</h3><p class="hint">'+T("Ticked menus ask for your Imperium password every time you open them (switching between sub-menus of the same menu does not ask again).","Menu yang dicentang meminta password Imperium setiap kali dibuka (pindah antar sub-menu di menu yang sama tidak ditanya lagi).")+'</p><div class="lk-list">';
    var nav=document.querySelector(".nav");
    [].forEach.call(nav?nav.children:[],function(n){
      if(n.matches("a[data-tab]")){var t=n.dataset.tab;h+='<label class="lk-row lk-top"><input type="checkbox" data-lk="'+t+'"'+(isLocked(t)?" checked":"")+"> "+esc(lbl(n))+"</label>";return}
      if(n.classList.contains("ngrp")){var subs=n.querySelectorAll(".nsub>a[data-tab]");if(!subs.length)return;var all=[].every.call(subs,function(a){return isLocked(a.dataset.tab)}),some=[].some.call(subs,function(a){return isLocked(a.dataset.tab)});
        h+='<div class="lk-grp"><label class="lk-row lk-top"><input type="checkbox" data-lkg="'+n.dataset.ng+'"'+(all?" checked":"")+(some&&!all?' data-mixed="1"':"")+"> "+esc(lbl(n.querySelector(".ng-btn")))+'</label><div class="lk-subs">'
          +[].map.call(subs,function(a){return '<label class="lk-row"><input type="checkbox" data-lk="'+a.dataset.tab+'"'+(isLocked(a.dataset.tab)?" checked":"")+"> "+esc(lbl(a))+"</label>"}).join("")+"</div></div>"}
    });
    card.innerHTML=h+"</div>";
    card.querySelectorAll("[data-mixed]").forEach(function(x){x.indeterminate=true});
  }
  addEventListener("hashchange",function(){header();guard()});
  addEventListener("imp-lang",function(){header();renderLockCard()});
  addEventListener("imp-unlocked",function(){okScope=scope(cur());guard()});
  document.addEventListener("click",function(e){if(e.target.closest('a[data-tab="pengaturan"]'))setTimeout(renderLockCard,0)});
  header();marks();renderLockCard();guard();
  if(window.IMP_UNLOCKED)okScope=scope(cur());
})();
