/* ==== Imperium: Excel (paket "Excel Bos") + tab sheet di bawah seperti Excel.
   Sheet aktif tinggal di kunci localStorage milik Excel Bos (fileBosExcel/Draft); sheet lain di "imperiumXlBook".
   Seluruh buku disimpan ke akun (dokumen "excelbos"), jadi HP dan laptop sama. ==== */
(function(){
  var KEYS=["fileBosExcel","fileBosExcelDraft"],BK="imperiumXlBook",TK="fileBosExcelT",host=document.getElementById("xl-host"),mounted=false,timer=0,quiet=false,pending=null;
  if(!host)return;
  var orig=Storage.prototype.setItem,origRm=Storage.prototype.removeItem;
  function lg(k){try{return localStorage.getItem(k)}catch(_){return null}}
  function qset(k,v){quiet=true;try{if(v==null)origRm.call(localStorage,k);else orig.call(localStorage,k,v)}catch(_){}quiet=false}
  function loadBook(){var b=null;try{b=JSON.parse(lg(BK)||"null")}catch(_){}
    if(!b||!Array.isArray(b.sheets)||!b.sheets.length)b={active:0,sheets:[{n:"Sheet1"}]};
    b.active=Math.max(0,Math.min(b.sheets.length-1,+b.active||0));return b}
  var book=loadBook();
  function saveBook(){qset(BK,JSON.stringify({active:book.active,sheets:book.sheets.map(function(x,i){return i===book.active?{n:x.n,id:x.id}:x})}))}
  /* buku lengkap: sheet aktif diambil langsung dari kunci Excel Bos */
  function fullBook(){return {active:book.active,sheets:book.sheets.map(function(x,i){return i===book.active?{n:x.n,id:x.id,main:lg(KEYS[0]),draft:lg(KEYS[1])}:{n:x.n,id:x.id,main:x.main==null?null:x.main,draft:x.draft==null?null:x.draft}})}}
  function queue(){
    var stamp=Date.now();try{orig.call(localStorage,TK,String(stamp))}catch(_){}
    clearTimeout(timer);timer=setTimeout(function(){if(window.IMP_DOC_SAVE)window.IMP_DOC_SAVE("excelbos",{kind:"excelbos",book:JSON.stringify(fullBook()),t:stamp})},1200);
  }
  function mine(st,k){if(quiet||KEYS.indexOf(k)<0)return false;try{return st===window.localStorage}catch(_){return false}}
  Storage.prototype.setItem=function(k,v){orig.call(this,k,v);if(mine(this,k))queue()};
  Storage.prototype.removeItem=function(k){origRm.call(this,k);if(mine(this,k))queue()};
  function localT(){return +lg(TK)||0}
  function apply(doc){
    var b=null;
    if(doc.book){try{b=JSON.parse(doc.book)}catch(_){}}
    if(!b)b={active:0,sheets:[{n:"Sheet1",main:doc.main==null?null:doc.main,draft:doc.draft==null?null:doc.draft}]}; /* format lama: satu lembar */
    if(!Array.isArray(b.sheets)||!b.sheets.length)return;
    b.active=Math.max(0,Math.min(b.sheets.length-1,+b.active||0));
    var a=b.sheets[b.active];qset(KEYS[0],a.main);qset(KEYS[1],a.draft);
    book=b;saveBook();qset(TK,String(doc.t));
  }
  function busy(){var a=document.activeElement;return (location.hash||"")==="#excel"&&a&&host.contains(a)}
  function remount(){mounted=false;host.innerHTML="";open()}
  window.IMP_XLBOS_SYNC=function(doc){
    if(!doc||(+doc.t||0)<=localT())return;
    if(doc.book&&doc.book===JSON.stringify(fullBook())){qset(TK,String(doc.t));return}
    if(busy()){pending=doc;return}  /* sedang dipakai di perangkat ini: tunggu sampai keluar dari Excel */
    apply(doc);if(mounted)remount();
  };
  function flushPending(){if(pending&&!busy()){var d=pending;pending=null;if((+d.t||0)>localT()){apply(d);if(mounted)remount()}}}
  /* ---------- tab sheet ---------- */
  function stash(){var a=book.sheets[book.active];a.main=lg(KEYS[0]);a.draft=lg(KEYS[1])}
  function pindah(i){if(i===book.active||i<0||i>=book.sheets.length)return;stash();book.active=i;var b=book.sheets[i];
    qset(KEYS[0],b.main==null?null:b.main);qset(KEYS[1],b.draft==null?null:b.draft);saveBook();queue();remount();
    setTimeout(function(){var g=host.querySelector("[data-grid]");if(g)g.focus({preventScroll:true})},30)}
  function namaBaru(){var n=book.sheets.length+1,ada=book.sheets.map(function(x){return x.n});while(ada.indexOf("Sheet"+n)>=0)n++;return "Sheet"+n}
  function tambah(){stash();book.sheets.push({n:namaBaru(),main:null,draft:null});var i=book.sheets.length-1;
    book.active=i;qset(KEYS[0],null);qset(KEYS[1],null);saveBook();queue();remount()}
  function hapus(i){if(book.sheets.length<2)return;stash();book.sheets.splice(i,1);
    if(i<book.active)book.active--;book.active=Math.max(0,Math.min(book.active,book.sheets.length-1));
    var b=book.sheets[book.active];qset(KEYS[0],b.main==null?null:b.main);qset(KEYS[1],b.draft==null?null:b.draft);saveBook();queue();remount()}
  function shId(i){var x=book.sheets[i];if(!x.id){x.id="s"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);saveBook()}return x.id}
  window.IMP_XL_SHEETNAME=function(){return book.sheets[book.active].n};
  window.IMP_XL_SHEETCOUNT=function(){return book.sheets.length};
  window.IMP_XL_SHEETKEY=function(){return shId(book.active)};
  window.IMP_XL_SHEET={add:function(){tambah()},del:function(){if(book.sheets.length>1)hapus(book.active)},
    ren:function(){var t=host.querySelector(".xl-sh.on");if(t)t.dispatchEvent(new MouseEvent("dblclick",{bubbles:true}))}};
  function ganti(i,n){n=String(n||"").trim().slice(0,31);if(!n||n===book.sheets[i].n)return;book.sheets[i].n=n;stash();saveBook();queue();tabs()}
  function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function tabs(){
    var xl=host.querySelector(".xl");if(!xl)return;var bar=xl.querySelector(".xl-sheets");
    if(!bar){bar=document.createElement("div");bar.className="xl-sheets";var bw=xl.querySelector(".xl-bawah");xl.insertBefore(bar,bw||null);
      bar.addEventListener("click",function(e){var x=e.target.closest("[data-shx]");if(x){e.stopPropagation();
          if(x.dataset.arm!=="1"){x.dataset.arm="1";x.textContent="Hapus?";x.classList.add("arm");setTimeout(function(){if(x.isConnected){x.dataset.arm="";x.textContent="×";x.classList.remove("arm")}},2500);return}
          hapus(+x.dataset.shx);return}
        var t=e.target.closest("[data-sh]");if(t&&!t.querySelector("input")){pindah(+t.dataset.sh);return}
        if(e.target.closest("[data-shadd]"))tambah()});
      bar.addEventListener("dblclick",function(e){var t=e.target.closest("[data-sh]");if(!t)return;var i=+t.dataset.sh,inp=document.createElement("input");
        inp.className="xl-shin";inp.value=book.sheets[i].n;inp.maxLength=31;t.textContent="";t.appendChild(inp);inp.focus();inp.select();
        var done=false;function fin(ok){if(done)return;done=true;if(ok)ganti(i,inp.value);tabs()}
        inp.addEventListener("keydown",function(ev){ev.stopPropagation();if(ev.key==="Enter"){ev.preventDefault();fin(true)}else if(ev.key==="Escape"){ev.preventDefault();fin(false)}});
        inp.addEventListener("blur",function(){fin(true)})});
    }
    bar.innerHTML='<div class="xl-shl">'+book.sheets.map(function(x,i){return '<button type="button" class="xl-sh'+(i===book.active?' on':'')+'" data-sh="'+i+'" title="Klik untuk buka · klik dua kali untuk ganti nama">'+esc(x.n)+'</button>'+(i===book.active&&book.sheets.length>1?'<button type="button" class="xl-shx" data-shx="'+i+'" title="Hapus sheet ini" aria-label="Hapus sheet">×</button>':'')}).join("")+
      '</div><button type="button" class="xl-shadd" data-shadd title="Sheet baru (Shift+F11)" aria-label="Sheet baru">+</button>';
    var on=bar.querySelector(".xl-sh.on");if(on&&on.scrollIntoView)try{on.scrollIntoView({block:"nearest",inline:"nearest"})}catch(_){}
  }
  /* pintasan sheet: Ctrl+PgUp/PgDn (Alt+PgUp/PgDn kalau browser memakainya), Shift+F11 = sheet baru */
  addEventListener("keydown",function(e){
    if((location.hash||"")!=="#excel"||!host.contains(document.activeElement))return;
    if(e.target&&e.target.classList&&e.target.classList.contains("xl-shin"))return;
    if((e.ctrlKey||e.altKey)&&(e.key==="PageDown"||e.key==="PageUp")){e.preventDefault();pindah(book.active+(e.key==="PageDown"?1:-1))}
    else if(e.shiftKey&&e.key==="F11"){e.preventDefault();tambah()}
  },true);
  /* tinggi lembar = sisa layar, supaya ribbon tetap terlihat dan yang digulir hanya sel */
  function fit(){if((location.hash||"")!=="#excel")return;var mn=document.querySelector(".main");
    if(matchMedia("(max-width:760px)").matches){host.style.height="";return}
    if(mn)mn.scrollTop=0;
    /* lembar memenuhi sisa layar sampai bawah (jarak 12px), tanpa halaman ikut tergulir */
    var top=host.getBoundingClientRect().top;host.style.height=Math.max(320,Math.floor(innerHeight-top-12))+"px";
    if(mn){var extra=mn.scrollHeight-mn.clientHeight;if(extra>0)host.style.height=Math.max(320,(parseFloat(host.style.height)||0)-extra)+"px";mn.scrollTop=0}}
  function fitLater(){fit();requestAnimationFrame(fit);setTimeout(fit,250);setTimeout(fit,900)}
  try{document.fonts&&document.fonts.ready.then(fit)}catch(_){}
  addEventListener("resize",fit);
  function open(){
    fitLater();
    if(mounted||(location.hash||"").slice(1)!=="excel")return;
    if(!window.FileBos||!window.FileBos.excel){host.innerHTML='<div class="empty">Excel belum terpasang.</div>';return}
    try{window.FileBos.excel(host);mounted=true;tabs()}catch(e){host.innerHTML='<div class="empty">Excel gagal dimuat: '+String(e.message).replace(/</g,"&lt;")+'</div>'}
  }
  addEventListener("hashchange",function(){flushPending();open()});
  document.addEventListener("focusout",function(){setTimeout(flushPending,0)});
  open();
})();
