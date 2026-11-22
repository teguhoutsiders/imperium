/* ==== Imperium · penghubung ke Google Spreadsheet (Apps Script) ====
   Menyediakan window.claude.use("db"|"user"|"assets"|"downloads") seperti di artifak Claude,
   tapi datanya disimpan di Spreadsheet + Google Drive milik pemilik lewat web app Apps Script.
   Alamat web app dan kunci akses TIDAK ditulis di kode: diisi sekali di tiap perangkat. */
(function(){
  "use strict";
  var LS_URL="imp-api-url",LS_KEY="imp-api-key",LS_CACHE="imp-cache-v1",LS_QUEUE="imp-queue-v1",LS_T="imp-sync-t";
  function lsGet(k){try{return localStorage.getItem(k)}catch(_){return null}}
  function lsSet(k,v){try{localStorage.setItem(k,v)}catch(_){}}
  function lsDel(k){try{localStorage.removeItem(k)}catch(_){}}

  /* ---------- panggilan ke Apps Script ---------- */
  var cfg={url:lsGet(LS_URL)||"",key:lsGet(LS_KEY)||""};
  function ApiErr(code,msg){var e=new Error(msg||code);e.code=code;return e}
  async function call(a,payload,opt){
    if(!cfg.url||!cfg.key)throw ApiErr("auth","Belum masuk");
    var body=JSON.stringify(Object.assign({k:cfg.key,a:a},payload||{}));
    var res;
    try{res=await fetch(cfg.url,{method:"POST",body:body,redirect:"follow",cache:"no-store"})}
    catch(e){throw ApiErr("network","Tidak bisa menghubungi Spreadsheet")}
    if(!res.ok)throw ApiErr("network","HTTP "+res.status);
    var j;try{j=await res.json()}catch(_){throw ApiErr("network","Jawaban tidak terbaca (cek alamat web app)")}
    if(!j||!j.ok){
      var c=(j&&j.err)||"server";
      if((c==="auth"||c==="locked")&&!(opt&&opt.login))onAuthLost(c);
      throw ApiErr(c,(j&&j.msg)||c);
    }
    return j;
  }

  /* ---------- layar masuk ---------- */
  var loginResolve=null,loginP=null;
  function needLogin(){if(!loginP)loginP=new Promise(function(r){loginResolve=r;showLogin()});return loginP}
  function onAuthLost(code){
    lsDel(LS_KEY);cfg.key="";
    stopPoll();
    loginP=null;needLogin().then(function(){startPoll(true)});
    if(code==="locked")setTimeout(function(){var m=document.getElementById("imp-login-msg");if(m)m.textContent="Terlalu banyak percobaan salah. Akses dikunci sementara (±15 menit)."},50);
  }
  function showLogin(){
    var old=document.getElementById("imp-login");if(old)old.remove();
    var d=document.createElement("div");d.id="imp-login";
    d.innerHTML='<form id="imp-login-f" autocomplete="on">'
      +'<div class="il-logo">IMPERIUM</div><p class="il-sub">Buku catatan pribadi</p>'
      +'<label>Alamat web app Apps Script<input id="imp-l-url" type="url" inputmode="url" placeholder="https://script.google.com/macros/s/…/exec" required></label>'
      +'<label>Kunci akses<input id="imp-l-key" type="password" autocomplete="current-password" required></label>'
      +'<label class="il-show"><input type="checkbox" id="imp-l-show"> Tampilkan kunci</label>'
      +'<button type="submit" id="imp-l-go">Masuk</button>'
      +'<p class="il-msg" id="imp-login-msg" role="status"></p>'
      +'<p class="il-hint">Alamat dan kunci hanya disimpan di perangkat ini. Data Anda tetap di Google Spreadsheet & Drive milik Anda.</p></form>';
    (document.body||document.documentElement).appendChild(d);
    var u=document.getElementById("imp-l-url"),k=document.getElementById("imp-l-key");
    u.value=cfg.url||"";(cfg.url?k:u).focus();
    document.getElementById("imp-l-show").onchange=function(e){k.type=e.target.checked?"text":"password"};
    document.getElementById("imp-login-f").onsubmit=async function(e){
      e.preventDefault();
      var msg=document.getElementById("imp-login-msg"),btn=document.getElementById("imp-l-go");
      var url=u.value.trim(),key=k.value;
      if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)){msg.textContent="Alamat harus berbentuk https://script.google.com/macros/s/…/exec";return}
      btn.disabled=true;msg.textContent="Memeriksa…";
      var keep={url:cfg.url,key:cfg.key};cfg.url=url;cfg.key=key;
      try{
        await call("ping",{},{login:true});
        lsSet(LS_URL,url);lsSet(LS_KEY,key);
        if(keep.url&&keep.url!==url){lsDel(LS_CACHE);lsDel(LS_T);lsDel(LS_QUEUE);cache=new Map();lastT=0;queue=[]}
        d.remove();var r=loginResolve;loginResolve=null;if(r)r();
      }catch(err){
        cfg.url=keep.url;cfg.key=keep.key;btn.disabled=false;
        msg.textContent=err.code==="auth"?"Kunci akses salah.":err.code==="locked"?"Terlalu banyak percobaan salah. Coba lagi ±15 menit lagi.":err.code==="nokey"?"Kunci belum diatur di Spreadsheet (menu Imperium › Atur kunci akses).":"Tidak bisa terhubung: "+err.message;
      }
    };
  }
  window.IMP_LOGOUT=function(){lsDel(LS_KEY);lsDel(LS_CACHE);lsDel(LS_QUEUE);lsDel(LS_T);try{caches.delete("imp-blobs")}catch(_){}location.reload()};

  /* ---------- database (koleksi dokumen) ---------- */
  var cache=new Map(),lastT=+(lsGet(LS_T)||0),queue=[],subs=[],flushing=false,pollTimer=0,firstPull=true,errCbs=[];
  try{var c0=JSON.parse(lsGet(LS_CACHE)||"null");if(c0&&typeof c0==="object")Object.keys(c0).forEach(function(id){cache.set(id,c0[id])})}catch(_){}
  try{queue=JSON.parse(lsGet(LS_QUEUE)||"[]")||[]}catch(_){queue=[]}
  var saveT=0;function persist(){clearTimeout(saveT);saveT=setTimeout(function(){var o={};cache.forEach(function(v,k){o[k]=v});lsSet(LS_CACHE,JSON.stringify(o));lsSet(LS_QUEUE,JSON.stringify(queue));lsSet(LS_T,String(lastT))},250)}
  function clone(x){return x==null?x:JSON.parse(JSON.stringify(x))}
  function emit(fromCache){
    var docs=[];cache.forEach(function(v,k){docs.push({id:k,data:(function(d){return function(){return clone(d)}})(v)})});
    var snap={docs:docs,metadata:{fromCache:!!fromCache||queue.length>0}};
    subs.forEach(function(cb){try{cb(snap)}catch(e){console.error(e)}});
  }
  function genId(){var s="abcdefghijklmnopqrstuvwxyz0123456789",o="";var a=new Uint8Array(20);crypto.getRandomValues(a);for(var i=0;i<20;i++)o+=s[a[i]%36];return o}
  function enqueue(op){queue.push(op);persist();emit(false);return flush()}
  async function flush(){
    if(flushing)return flushing;
    flushing=(async function(){
      while(queue.length){
        var ops=queue.slice(0,40);
        try{await call("batch",{ops:ops})}
        catch(e){if(e.code==="network"||e.code==="server"){setStatus("Offline · perubahan disimpan dan dikirim nanti");setTimeout(function(){flush()},8000)}throw e}
        queue.splice(0,ops.length);persist();
      }
      setStatus("");
    })();
    try{await flushing}finally{flushing=false;emit(false)}
  }
  function DocRef(id){this.id=id}
  DocRef.prototype.set=function(data){var d=clone(data);cache.set(this.id,d);return enqueue({o:"set",id:this.id,d:d}).catch(softErr)};
  DocRef.prototype.update=function(f){var cur=cache.get(this.id);if(!cur){var e=ApiErr("not_found","Dokumen tidak ada");return Promise.reject(e)}var n=Object.assign({},cur,clone(f));cache.set(this.id,n);return enqueue({o:"upd",id:this.id,f:clone(f)}).catch(softErr)};
  DocRef.prototype.delete=function(){cache.delete(this.id);return enqueue({o:"del",id:this.id}).catch(softErr)};
  DocRef.prototype.get=async function(){var d=cache.get(this.id);return {exists:!!d,id:this.id,data:function(){return clone(d)}}};
  /* gagal jaringan = tetap tersimpan di antrean perangkat; gagal lain diteruskan ke aplikasi */
  function softErr(e){if(e&&(e.code==="network"||e.code==="server"))return;throw e}
  var col={doc:function(id){return new DocRef(id||genId())},onSnapshot:function(cb,err){subs.push(cb);if(err)errCbs.push(err);if(cache.size)setTimeout(function(){emit(true)},0);startPoll(true);return function(){subs=subs.filter(function(x){return x!==cb})}}};
  async function pull(){
    if(document.hidden&&!firstPull)return;
    try{
      var j=await call("pull",{since:lastT});
      var ch=false;
      (j.docs||[]).forEach(function(r){
        if(queue.some(function(q){return q.id===r.id}))return; /* perubahan lokal belum terkirim menang */
        if(r.x){if(cache.has(r.id)){cache.delete(r.id);ch=true}}
        else{var s=JSON.stringify(r.d),o=cache.get(r.id);if(!o||JSON.stringify(o)!==s){cache.set(r.id,r.d);ch=true}}
      });
      if(j.full){var keep=new Set((j.docs||[]).filter(function(r){return !r.x}).map(function(r){return r.id}));cache.forEach(function(v,k){if(!keep.has(k)&&!queue.some(function(q){return q.id===k})){cache.delete(k);ch=true}})}
      lastT=j.t||lastT;persist();
      if(ch||firstPull)emit(false);
      firstPull=false;setStatus("");
      if(queue.length)flush().catch(function(){});
    }catch(e){
      if(e.code==="network"){setStatus("Offline · menampilkan data terakhir");if(firstPull&&cache.size){firstPull=false;emit(true)}}
    }
  }
  function startPoll(now){stopPoll();if(now)pull();pollTimer=setInterval(pull,document.hidden?30000:5000)}
  function stopPoll(){clearInterval(pollTimer);pollTimer=0}
  document.addEventListener("visibilitychange",function(){if(!pollTimer)return;startPoll(!document.hidden)});
  window.addEventListener("online",function(){if(pollTimer){startPoll(true);flush().catch(function(){})}});

  /* ---------- status kecil di pojok ---------- */
  var stEl=null;
  function setStatus(t){
    if(!stEl){stEl=document.createElement("div");stEl.id="imp-net";document.body&&document.body.appendChild(stEl)}
    stEl.textContent=t;stEl.hidden=!t;
  }

  /* ---------- berkas (Google Drive) ---------- */
  function toB64(blob){return new Promise(function(ok,no){var r=new FileReader();r.onload=function(){var s=String(r.result);ok(s.slice(s.indexOf(",")+1))};r.onerror=no;r.readAsDataURL(blob)})}
  function fromB64(b64,type){var bin=atob(b64),n=bin.length,u=new Uint8Array(n);for(var i=0;i<n;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type:type||"application/octet-stream"})}
  var blobMem=new Map();
  async function cacheGet(id){
    if(blobMem.has(id))return blobMem.get(id);
    try{var c=await caches.open("imp-blobs"),r=await c.match("/_imp_blob/"+id);if(r){var b=await r.blob();blobMem.set(id,b);return b}}catch(_){}
    return null;
  }
  async function cachePut(id,b){blobMem.set(id,b);try{var c=await caches.open("imp-blobs");await c.put("/_imp_blob/"+id,new Response(b,{headers:{"Content-Type":b.type||"application/octet-stream"}}))}catch(_){}}
  var inflight=new Map();
  function getBlob(id){
    if(inflight.has(id))return inflight.get(id);
    var p=(async function(){var c=await cacheGet(id);if(c)return c;var j=await call("bget",{id:id});var b=fromB64(j.b64,j.type);await cachePut(id,b);return b})();
    inflight.set(id,p);p.finally(function(){inflight.delete(id)});return p;
  }
  var assets={
    upload:async function(blob,opt){var type=(opt&&opt.type)||blob.type||"application/octet-stream";var b64=await toB64(blob);var j=await call("bput",{type:type,name:(blob.name||"file"),b64:b64});await cachePut(j.id,blob.type?blob:new Blob([blob],{type:type}));return {id:j.id,url:"/_blob/"+j.id}},
    delete:async function(id){blobMem.delete(id);try{var c=await caches.open("imp-blobs");await c.delete("/_imp_blob/"+id)}catch(_){}await call("bdel",{id:id})},
    list:async function(){var j=await call("busage",{});return {assets:[],usage:{bytes:j.bytes||0,maxBytes:j.maxBytes||0}}}
  };
  /* alamat /_blob/ID di halaman diarahkan ke Drive */
  var origFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    var url=typeof input==="string"?input:(input&&input.url)||"";
    var m=url.match(/^(?:https?:\/\/[^\/]+)?\/_blob\/([\w-]+)$/);
    if(m){
      var id=m[1],method=((init&&init.method)||(input&&input.method)||"GET").toUpperCase();
      if(method==="HEAD")return call("bhead",{id:id}).then(function(j){return new Response(null,{status:j.exists?200:404})}).catch(function(){return new Response(null,{status:404})});
      return getBlob(id).then(function(b){return new Response(b,{status:200,headers:{"Content-Type":b.type||"application/octet-stream"}})}).catch(function(){return new Response(null,{status:404})});
    }
    return origFetch(input,init);
  };
  var urlMem=new Map();
  function fixEl(el){
    var attr=el.tagName==="A"?"href":"src",v=el.getAttribute(attr);
    if(!v)return;var m=v.match(/^(?:https?:\/\/[^\/]+)?\/_blob\/([\w-]+)$/);if(!m)return;var id=m[1];
    if(urlMem.has(id)){el.setAttribute(attr,urlMem.get(id));return}
    el.setAttribute("data-imp-blob",id);
    if(el.tagName==="IMG")el.setAttribute(attr,"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
    else el.removeAttribute(attr);
    getBlob(id).then(function(b){var u=URL.createObjectURL(b);urlMem.set(id,u);if(el.getAttribute("data-imp-blob")===id)el.setAttribute(attr,u);el.removeAttribute("data-imp-blob")}).catch(function(){el.removeAttribute("data-imp-blob");if(el.tagName==="IMG")el.dispatchEvent(new Event("error"))});
  }
  var SEL='img[src*="/_blob/"],video[src*="/_blob/"],audio[src*="/_blob/"],source[src*="/_blob/"],iframe[src*="/_blob/"],embed[src*="/_blob/"],a[href*="/_blob/"]';
  function scan(root){if(root.nodeType!==1)return;if(root.matches&&root.matches(SEL))fixEl(root);root.querySelectorAll&&root.querySelectorAll(SEL).forEach(fixEl)}
  new MutationObserver(function(ms){ms.forEach(function(m){if(m.type==="attributes")scan(m.target);else m.addedNodes.forEach(scan)})}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["src","href"]});

  /* ---------- unduhan ---------- */
  var downloads={save:async function(o){var b=o.data instanceof Blob?o.data:new Blob([o.data]);var u=URL.createObjectURL(b),a=document.createElement("a");a.href=u;a.download=o.filename||"download";document.body.appendChild(a);a.click();setTimeout(function(){a.remove();URL.revokeObjectURL(u)},1500)}};

  /* ---------- pintu masuk yang dipakai aplikasi ---------- */
  window.claude={use:async function(name){
    if(name==="sample")return null;
    if(!cfg.url||!cfg.key)await needLogin();
    if(name==="db")return {collection:function(){return col}};
    if(name==="user")return {id:async function(){return "owner"}};
    if(name==="assets")return assets;
    if(name==="downloads")return downloads;
    return null;
  }};

  /* ---------- kartu Koneksi di Pengaturan ---------- */
  function addSetCard(){
    var host=document.getElementById("tab-pengaturan");if(!host||document.getElementById("imp-conn"))return;
    var c=document.createElement("div");c.className="setcard";c.id="imp-conn";
    c.innerHTML='<h3 class="set-h">Koneksi Spreadsheet</h3><p class="hint">Data tersimpan di Google Spreadsheet, berkas di Google Drive milik Anda. Halaman memeriksa perubahan tiap beberapa detik.</p>'
      +'<p class="hint mono" id="imp-conn-url" style="word-break:break-all"></p>'
      +'<div class="actions" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="soft" id="imp-sync-now">Sinkronkan sekarang</button><button type="button" class="ghost danger" id="imp-logout">Keluar dari perangkat ini</button></div>';
    var foot=host.querySelector("footer");host.insertBefore(c,foot||null);
    document.getElementById("imp-conn-url").textContent=cfg.url?cfg.url.replace(/(\/s\/.{6}).+(.{6}\/exec)$/,"$1…$2"):"";
    document.getElementById("imp-sync-now").onclick=function(){startPoll(true);flush().catch(function(){})};
    document.getElementById("imp-logout").onclick=function(){if(this.dataset.arm){window.IMP_LOGOUT();return}this.dataset.arm=1;this.textContent="Ketuk lagi untuk keluar"};
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addSetCard);else addSetCard();

  /* ---------- aplikasi di layar utama (PWA) ---------- */
  if("serviceWorker" in navigator&&location.protocol==="https:")window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
})();
