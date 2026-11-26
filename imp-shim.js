/* ==== Imperium · penghubung ke Supabase ====
   Menyediakan window.claude.use("db"|"user"|"assets"|"downloads") seperti di artifak Claude,
   tapi datanya disimpan di database + Storage Supabase milik pemilik.
   URL project dan publishable key boleh ditulis di sini: tanpa login yang benar,
   aturan keamanan (RLS) di Supabase tidak mengeluarkan data apa pun. */
(function(){
  "use strict";
  var SB_URL="https://sdcjufdqpybvxvvccflb.supabase.co";
  var SB_KEY="sb_publishable_tW8iVrAwFCHAgWKSTNo93Q_G0DQtQ38";
  var SB_LIB="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  var BUCKET="imperium";
  var FREE_BYTES=1073741824; /* kuota Storage paket gratis: 1 GB */

  var LS_CACHE="imp-cache-v1",LS_QUEUE="imp-queue-v1",LS_T="imp-sync-t",LS_UID="imp-sb-uid",LS_MARK="imp-backend";
  function lsGet(k){try{return localStorage.getItem(k)}catch(_){return null}}
  function lsSet(k,v){try{localStorage.setItem(k,v)}catch(_){}}
  function lsDel(k){try{localStorage.removeItem(k)}catch(_){}}

  /* pertama kali pindah dari versi Spreadsheet: buang salinan & kunci lama di perangkat ini */
  if(lsGet(LS_MARK)!=="supabase"){
    ["imp-api-url","imp-api-key",LS_CACHE,LS_QUEUE,LS_T].forEach(lsDel);
    try{caches.delete("imp-blobs")}catch(_){}
    lsSet(LS_MARK,"supabase");
  }

  function ApiErr(code,msg){var e=new Error(msg||code);e.code=code;return e}
  function isNet(e){var m=String(e&&(e.message||e)||"");return !navigator.onLine||/failed to fetch|networkerror|load failed|network request|timeout|fetch/i.test(m)}
  function mapErr(e){
    if(!e)return ApiErr("server","Galat tidak dikenal");
    if(e.code&&["network","auth","server","not_found"].indexOf(e.code)>=0)return e;
    var st=+(e.status||e.statusCode||0),c=String(e.code||""),m=String(e.message||e.error||e);
    if(st===401||c==="PGRST301"||c==="28000"||/jwt|not authenticated|belum masuk/i.test(m))return ApiErr("auth",m);
    if(isNet(e))return ApiErr("network","Tidak bisa menghubungi Supabase");
    return ApiErr("server",m);
  }

  /* ---------- pustaka & sesi Supabase ---------- */
  var sb=null,libP=null,uid=lsGet(LS_UID)||"",email="",signingOut=false;
  function lib(){
    if(libP)return libP;
    libP=new Promise(function(ok,no){
      if(window.supabase&&window.supabase.createClient)return ok();
      var s=document.createElement("script");s.src=SB_LIB;s.async=true;s.crossOrigin="anonymous";
      s.onload=function(){ok()};
      s.onerror=function(){libP=null;no(ApiErr("network","Pustaka Supabase tidak termuat"))};
      (document.head||document.documentElement).appendChild(s);
    }).then(function(){
      sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,storageKey:"imp-sb-auth"}});
      sb.auth.onAuthStateChange(function(ev,session){
        if(session&&session.user){email=session.user.email||"";setUid(session.user.id);showEmail()}
        if(ev==="SIGNED_OUT"&&!signingOut)onAuthLost();
      });
      return sb;
    });
    return libP;
  }
  function setUid(id){
    if(!id||id===uid)return;
    if(uid){cache=new Map();queue=[];lastT=0;lsDel(LS_CACHE);lsDel(LS_QUEUE);lsDel(LS_T)}
    uid=id;lsSet(LS_UID,id);
  }
  /* true = siap; false = perlu login */
  async function ready(){
    try{
      await lib();
      var r=await sb.auth.getSession(),s=r&&r.data&&r.data.session;
      if(s&&s.user){email=s.user.email||"";setUid(s.user.id);return true}
      return false;
    }catch(e){
      /* offline: tetap buka dengan data terakhir di perangkat ini */
      if(isNet(e)&&uid)return true;
      return false;
    }
  }

  /* ---------- layar masuk ---------- */
  var loginResolve=null,loginP=null;
  function needLogin(mode){if(!loginP)loginP=new Promise(function(r){loginResolve=r;showLogin(mode)});return loginP}
  /* kunci Imperium: tiap kali Imperium dibuka (tab/aplikasi baru) wajib masukkan password; muat ulang di tab yang sama tidak ditanya lagi */
  var LS_LOCK="imp-lock-h",SS_UNLOCK="imp-unlocked";
  function unlocked(){try{return sessionStorage.getItem(SS_UNLOCK)==="1"}catch(_){return false}}
  async function lockHash(m,p){try{var b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode("imperium|"+String(m).trim().toLowerCase()+"|"+p));return Array.prototype.map.call(new Uint8Array(b),function(x){return ("0"+x.toString(16)).slice(-2)}).join("")}catch(_){return ""}}
  async function markUnlocked(m,p){try{sessionStorage.setItem(SS_UNLOCK,"1")}catch(_){}var h=await lockHash(m,p);if(h)lsSet(LS_LOCK,h);
    try{window.IMP_UNLOCKED=true;window.dispatchEvent(new Event("imp-unlocked"))}catch(_){}}
  function onAuthLost(){
    if(loginResolve)return; /* layar masuk sudah tampil */
    stopPoll();stopRealtime();
    loginP=null;needLogin().then(function(){startRealtime();startPoll(true)});
  }
  /* periksa password akun (untuk menu yang dikunci): cocokkan dulu di perangkat, kalau tidak cocok tanya ke Supabase */
  window.IMP_CHECK_PW=async function(pw){
    if(!pw)return false;var h=await lockHash(email,pw),sv=lsGet(LS_LOCK);
    if(h&&sv&&h===sv)return true;
    try{await lib();var r=await sb.auth.signInWithPassword({email:email,password:pw});if(r.error)return false;
      if(h)lsSet(LS_LOCK,h);return true}
    catch(e){return isNet(e)?"offline":false}
  };
  window.IMP_EMAIL=function(){return email||""};
  function showLogin(mode){
    var old=document.getElementById("imp-login");if(old)old.remove();
    var d=document.createElement("div");d.id="imp-login";
    d.innerHTML='<form id="imp-login-f" autocomplete="on">'
      +'<div class="il-logo">IMPERIUM</div><p class="il-sub">'+(mode==="lock"?"Masukkan password untuk membuka Imperium":"Buku catatan pribadi")+'</p>'
      +'<label>Email<input id="imp-l-mail" type="text" inputmode="email" autocomplete="username" autocapitalize="off" spellcheck="false" required></label>'
      +'<label>Password<input id="imp-l-key" type="password" autocomplete="current-password" required></label>'
      +'<label class="il-show"><input type="checkbox" id="imp-l-show"> Tampilkan password</label>'
      +'<button type="submit" id="imp-l-go">Masuk</button>'
      +'<p class="il-msg" id="imp-login-msg" role="status"></p>'
      +'<p class="il-hint">Data Anda tersimpan di project Supabase milik Anda. Akun dibuat di Supabase › Authentication › Users.</p></form>';
    (document.body||document.documentElement).appendChild(d);
    var u=document.getElementById("imp-l-mail"),k=document.getElementById("imp-l-key");
    u.value=email||"";(email?k:u).focus();
    document.getElementById("imp-l-show").onchange=function(e){k.type=e.target.checked?"text":"password"};
    document.getElementById("imp-login-f").onsubmit=async function(e){
      e.preventDefault();
      var msg=document.getElementById("imp-login-msg"),btn=document.getElementById("imp-l-go");
      btn.disabled=true;msg.textContent="Memeriksa…";
      try{
        await lib();
        var r=await sb.auth.signInWithPassword({email:u.value.trim(),password:k.value});
        if(r.error)throw r.error;
        email=r.data.user.email||"";setUid(r.data.user.id);showEmail();
        await markUnlocked(u.value,k.value);
        d.remove();var res=loginResolve;loginResolve=null;if(res)res();
      }catch(err){
        btn.disabled=false;
        /* offline: buka kunci dengan password terakhir yang pernah benar di perangkat ini */
        if(mode==="lock"&&isNet(err)){var h=await lockHash(u.value,k.value),sv=lsGet(LS_LOCK);
          if(h&&sv&&h===sv){await markUnlocked(u.value,k.value);d.remove();var rs=loginResolve;loginResolve=null;if(rs)rs();return}if(h&&sv){msg.textContent="Password salah.";return}}
        var m=String(err&&err.message||err);
        msg.textContent=/invalid login|invalid credentials/i.test(m)?"Email atau password salah."
          :/not confirmed/i.test(m)?"Akun belum dikonfirmasi. Di Supabase › Authentication › Users, konfirmasi akun ini."
          :/rate|too many/i.test(m)?"Terlalu banyak percobaan. Tunggu beberapa menit."
          :isNet(err)?"Tidak bisa terhubung. Periksa internet Anda."
          :"Gagal masuk: "+m;
      }
    };
  }
  window.IMP_LOGOUT=async function(){
    signingOut=true;
    try{await lib();await sb.auth.signOut()}catch(_){}
    [LS_CACHE,LS_QUEUE,LS_T,LS_UID].forEach(lsDel);
    try{caches.delete("imp-blobs")}catch(_){}
    location.reload();
  };

  /* ---------- database (koleksi dokumen) ---------- */
  var cache=new Map(),lastT=+(lsGet(LS_T)||0),queue=[],subs=[],flushing=false,pollTimer=0,firstPull=true,rtCh=null,rtOk=false;
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

  /* kirim antrean: maks 40 perubahan atau ±1,5 MB per panggilan */
  function nextBatch(){var out=[],size=0;for(var i=0;i<queue.length&&out.length<40;i++){var n=JSON.stringify(queue[i]).length;if(out.length&&size+n>1.5e6)break;out.push(queue[i]);size+=n}return out}
  var retryT=0;
  async function flush(){
    if(flushing)return flushing;
    flushing=(async function(){
      while(queue.length){
        if(!sb)await lib();
        var ops=nextBatch();
        var r;
        try{r=await sb.rpc("imp_batch",{ops:ops})}catch(e){r={error:e}}
        if(r.error){
          var e=mapErr(r.error);
          if(e.code==="auth"){onAuthLost();throw e}
          setStatus(e.code==="network"?"Offline · perubahan disimpan dan dikirim nanti":"Gagal menyimpan · dicoba lagi");
          if(e.code==="server")console.error("Imperium imp_batch:",r.error);
          clearTimeout(retryT);retryT=setTimeout(function(){flush().catch(function(){})},8000);
          throw e;
        }
        queue.splice(0,ops.length);persist();
      }
      setStatus("");
    })();
    try{await flushing}finally{flushing=false;emit(false)}
  }
  function DocRef(id){this.id=id}
  DocRef.prototype.set=function(data){var d=clone(data);cache.set(this.id,d);return enqueue({o:"set",id:this.id,d:d}).catch(softErr)};
  DocRef.prototype.update=function(f){var cur=cache.get(this.id);if(!cur){return Promise.reject(ApiErr("not_found","Dokumen tidak ada"))}var n=Object.assign({},cur,clone(f));cache.set(this.id,n);return enqueue({o:"upd",id:this.id,f:clone(f)}).catch(softErr)};
  DocRef.prototype.delete=function(){cache.delete(this.id);return enqueue({o:"del",id:this.id}).catch(softErr)};
  DocRef.prototype.get=async function(){var d=cache.get(this.id);return {exists:!!d,id:this.id,data:function(){return clone(d)}}};
  /* gagal jaringan/server = tetap tersimpan di antrean perangkat; gagal lain diteruskan ke aplikasi */
  function softErr(e){if(e&&(e.code==="network"||e.code==="server"))return;throw e}
  var col={doc:function(id){return new DocRef(id||genId())},onSnapshot:function(cb,err){subs.push(cb);if(cache.size)setTimeout(function(){emit(true)},0);startRealtime();startPoll(true);return function(){subs=subs.filter(function(x){return x!==cb})}}};

  /* terapkan satu baris dari server ke salinan lokal; true jika ada perubahan */
  function applyRow(r){
    if(!r||!r.id)return false;
    var t=Date.parse(r.updated)||0;if(t>lastT)lastT=t;
    if(queue.some(function(q){return q.id===r.id}))return false; /* perubahan lokal belum terkirim menang */
    if(r.deleted){if(cache.has(r.id)){cache.delete(r.id);return true}return false}
    var s=JSON.stringify(r.data),o=cache.get(r.id);
    if(!o||JSON.stringify(o)!==s){cache.set(r.id,r.data);return true}
    return false;
  }
  var pulling=false;
  async function pull(){
    if((document.hidden&&!firstPull)||pulling)return;
    pulling=true;
    try{
      if(!sb)await lib();
      if(!uid)return;
      var full=!lastT,rows=[],from=0,PAGE=500;
      for(;;){
        var q=sb.from("docs").select("id,data,deleted,updated").eq("user_id",uid);
        q=full?q.eq("deleted",false):q.gte("updated",new Date(lastT-3000).toISOString());
        var r=await q.order("updated",{ascending:true}).order("id",{ascending:true}).range(from,from+PAGE-1);
        if(r.error)throw r.error;
        rows=rows.concat(r.data||[]);
        if(!r.data||r.data.length<PAGE)break;
        from+=PAGE;
      }
      var ch=false;
      rows.forEach(function(r){if(applyRow(r))ch=true});
      if(full){var keep=new Set(rows.map(function(r){return r.id}));cache.forEach(function(v,k){if(!keep.has(k)&&!queue.some(function(q){return q.id===k})){cache.delete(k);ch=true}});if(!lastT)lastT=1}
      persist();
      if(ch||firstPull)emit(false);
      firstPull=false;setStatus("");
      if(queue.length)flush().catch(function(){});
    }catch(err){
      var e=mapErr(err);
      if(e.code==="auth")onAuthLost();
      else if(e.code==="network"){setStatus("Offline · menampilkan data terakhir");if(firstPull&&cache.size){firstPull=false;emit(true)}}
      else console.error("Imperium pull:",err);
    }finally{pulling=false}
  }
  /* realtime: perubahan dari perangkat lain masuk seketika; polling hanya cadangan */
  function startRealtime(){
    if(rtCh||!sb||!uid)return;
    var me=rtCh=sb.channel("imp-docs-"+uid)
      .on("postgres_changes",{event:"*",schema:"public",table:"docs",filter:"user_id=eq."+uid},function(p){
        if(applyRow(p.new)){persist();emit(false)}else persist();
      })
      .subscribe(function(st){if(me!==rtCh)return;var was=rtOk;rtOk=st==="SUBSCRIBED";if(rtOk!==was&&pollTimer)startPoll(rtOk);
        /* koneksi realtime putus (laptop tidur, Wi-Fi ganti): sambung ulang, lalu tarik data yang terlewat */
        if(me===rtCh&&(st==="CHANNEL_ERROR"||st==="TIMED_OUT"||st==="CLOSED")){clearTimeout(rtRetry);rtRetry=setTimeout(function(){if(!uid)return;stopRealtime();startRealtime();pull()},4000)}});
  }
  var rtRetry=0;
  function stopRealtime(){if(rtCh&&sb){try{sb.removeChannel(rtCh)}catch(_){}}rtCh=null;rtOk=false}
  function startPoll(now){stopPoll();if(now)pull();pollTimer=setInterval(pull,document.hidden?60000:(rtOk?30000:5000))}
  function stopPoll(){clearInterval(pollTimer);pollTimer=0}
  document.addEventListener("visibilitychange",function(){if(!pollTimer)return;startPoll(!document.hidden)});
  /* jendela laptop diklik lagi: langsung ambil perubahan terbaru dari HP */
  var lastFocusPull=0;window.addEventListener("focus",function(){if(!pollTimer||Date.now()-lastFocusPull<3000)return;lastFocusPull=Date.now();pull()});
  window.IMP_REFRESH=function(){emit(false)};
  window.addEventListener("online",function(){if(pollTimer){startPoll(true);flush().catch(function(){})}});

  /* ---------- status kecil di pojok ---------- */
  var stEl=null;
  function setStatus(t){
    if(!stEl){stEl=document.createElement("div");stEl.id="imp-net";document.body&&document.body.appendChild(stEl)}
    stEl.textContent=t;stEl.hidden=!t;
  }

  /* ---------- berkas (Supabase Storage) ---------- */
  function path(id){return uid+"/"+id}
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
    var p=(async function(){
      var c=await cacheGet(id);if(c)return c;
      if(!sb)await lib();
      var r=await sb.storage.from(BUCKET).download(path(id));
      if(r.error)throw mapErr(r.error);
      await cachePut(id,r.data);return r.data;
    })();
    inflight.set(id,p);p.finally(function(){inflight.delete(id)});return p;
  }
  async function exists(id){
    if(blobMem.has(id))return true;
    if(!sb)await lib();
    var r=await sb.storage.from(BUCKET).list(uid,{search:id,limit:5});
    return !r.error&&(r.data||[]).some(function(o){return o.name===id});
  }
  var assets={
    upload:async function(blob,opt){
      if(!sb)await lib();
      var type=(opt&&opt.type)||blob.type||"application/octet-stream",id=genId();
      var body=blob.type?blob:new Blob([blob],{type:type});
      var r=await sb.storage.from(BUCKET).upload(path(id),body,{contentType:type,upsert:false,cacheControl:"31536000"});
      if(r.error)throw mapErr(r.error);
      await cachePut(id,body);
      return {id:id,url:"/_blob/"+id};
    },
    delete:async function(id){
      blobMem.delete(id);try{var c=await caches.open("imp-blobs");await c.delete("/_imp_blob/"+id)}catch(_){}
      if(!sb)await lib();
      var r=await sb.storage.from(BUCKET).remove([path(id)]);if(r.error)throw mapErr(r.error);
    },
    list:async function(){
      if(!sb)await lib();
      var bytes=0,off=0;
      for(;;){
        var r=await sb.storage.from(BUCKET).list(uid,{limit:1000,offset:off});
        if(r.error)throw mapErr(r.error);
        (r.data||[]).forEach(function(o){bytes+=+(o.metadata&&o.metadata.size)||0});
        if(!r.data||r.data.length<1000)break;off+=1000;
      }
      return {assets:[],usage:{bytes:bytes,maxBytes:FREE_BYTES}};
    }
  };
  /* alamat /_blob/ID di halaman diarahkan ke Supabase Storage */
  var origFetch=window.fetch.bind(window);
  window.fetch=function(input,init){
    var url=typeof input==="string"?input:(input&&input.url)||"";
    var m=url.match(/^(?:https?:\/\/[^\/]+)?\/_blob\/([\w-]+)$/);
    if(m){
      var id=m[1],method=((init&&init.method)||(input&&input.method)||"GET").toUpperCase();
      if(method==="HEAD")return exists(id).then(function(x){return new Response(null,{status:x?200:404})}).catch(function(){return new Response(null,{status:404})});
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
  var readyP=null;
  function ensure(){if(!readyP)readyP=ready().then(function(ok){if(!ok)return needLogin();if(!unlocked())return needLogin("lock")});return readyP}
  /* ---------- Info › pemakaian Supabase (fungsi imp_usage di database) ---------- */
  window.IMP_USAGE=async function(){
    await ensure();if(!sb)await lib();
    var r=await sb.rpc("imp_usage");if(r.error)throw mapErr(r.error);
    var d=r.data||{};d.st_max=FREE_BYTES;d.db_max=524288000;return d;
  };
  window.claude={use:async function(name){
    if(name==="sample")return null;
    await ensure();
    if(name==="db")return {collection:function(){return col}};
    if(name==="user")return {id:async function(){return "owner"}};
    if(name==="assets")return assets;
    if(name==="downloads")return downloads;
    return null;
  }};

  /* ---------- kartu Koneksi di Pengaturan ---------- */
  function showEmail(){var el=document.getElementById("imp-conn-url");if(el)el.textContent=email?"Masuk sebagai "+email:""}
  function addSetCard(){
    var host=document.getElementById("tab-pengaturan");if(!host||document.getElementById("imp-conn"))return;
    var c=document.createElement("div");c.className="setcard";c.id="imp-conn";
    c.innerHTML='<h3 class="set-h">Koneksi Supabase</h3><p class="hint">Data dan berkas tersimpan di project Supabase milik Anda. Perubahan dari perangkat lain muncul seketika.</p>'
      +'<p class="hint mono" id="imp-conn-url" style="word-break:break-all"></p>'
      +'<div class="actions" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="soft" id="imp-sync-now">Sinkronkan sekarang</button><button type="button" class="ghost danger" id="imp-logout">Keluar dari perangkat ini</button></div>';
    var foot=host.querySelector("footer");host.insertBefore(c,foot||null);
    showEmail();
    document.getElementById("imp-sync-now").onclick=function(){lastT=0;startPoll(true);flush().catch(function(){})};
    document.getElementById("imp-logout").onclick=function(){if(this.dataset.arm){window.IMP_LOGOUT();return}this.dataset.arm=1;this.textContent="Ketuk lagi untuk keluar"};
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",addSetCard);else addSetCard();


  /* ---------- aplikasi di layar utama (PWA) ---------- */
  if("serviceWorker" in navigator&&location.protocol==="https:")window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})});
})();
