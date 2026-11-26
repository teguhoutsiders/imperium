/* ==== Pelatihan > Basic English: dibuka saat menu dipilih; kemajuan disimpan di browser + akun (dokumen "basicenglish") ==== */
(function(){
  var KEY="fileBosBasic",TK="fileBosBasicT",root=document.getElementById("be-root"),refresh=null,timer=0,quiet=false;
  if(!root)return;
  var orig=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
    orig.call(this,k,v);
    if(quiet||k!==KEY)return;
    try{if(this!==window.localStorage)return}catch(_){return}
    var stamp=Date.now();
    try{orig.call(localStorage,TK,String(stamp))}catch(_){}
    /* waktu yang sama dipakai untuk akun, supaya data yang kembali dari akun tidak dianggap lebih baru lalu memuat ulang latihan */
    clearTimeout(timer);timer=setTimeout(function(){if(window.IMP_DOC_SAVE)window.IMP_DOC_SAVE("basicenglish",{kind:"basicenglish",data:v,t:stamp})},1500);
  };
  function localT(){try{return +localStorage.getItem(TK)||0}catch(_){return 0}}
  window.IMP_BE_SYNC=function(doc){
    if(!doc||typeof doc.data!=="string")return;
    if((+doc.t||0)<=localT())return;
    var cur=null;try{cur=localStorage.getItem(KEY)}catch(_){}
    if(cur===doc.data){try{orig.call(localStorage,TK,String(doc.t))}catch(_){}return}
    quiet=true;try{localStorage.setItem(KEY,doc.data);localStorage.setItem(TK,String(doc.t))}catch(_){}quiet=false;
    if(refresh){root.innerHTML="";refresh=null;open()}
  };
  function open(){
    if(refresh||(location.hash||"").slice(1)!=="english")return;
    if(!window.FileBosBasic){root.innerHTML='<div class="empty">Materi Basic English belum terpasang.</div>';return}
    try{refresh=window.FileBosBasic(root)||function(){}}catch(e){root.innerHTML='<div class="empty">Menu ini gagal dimuat: '+String(e.message).replace(/</g,"&lt;")+'</div>'}
  }
  addEventListener("hashchange",open);open();
  /* pindah progres: tempel teks dari artifak English lama */
  function st(t,bad){var e=document.getElementById("be-imp-st");if(e){e.textContent=t;e.style.color=bad?"var(--crit)":""}}
  function parse(t){
    t=String(t||"").trim();if(!t)throw new Error("kosong");
    var o=JSON.parse(t);
    if(o&&typeof o==="object"&&"fileBosBasic" in o)o=o.fileBosBasic;
    if(typeof o==="string")o=JSON.parse(o);
    if(!o||typeof o!=="object"||Array.isArray(o))throw new Error("format tidak dikenal");
    return o;
  }
  var go=document.getElementById("be-imp-go"),ex=document.getElementById("be-exp");
  if(go)go.addEventListener("click",function(){
    var o;try{o=parse(document.getElementById("be-imp").value)}catch(e){st("Teks tidak bisa dibaca ("+e.message+").",true);return}
    try{localStorage.setItem(KEY,JSON.stringify(o))}catch(e){st("Browser menolak menyimpan.",true);return}
    var n=Object.keys(o).filter(function(k){return k!=="_st"&&o[k]===true}).length,s=o._st||{};
    st("Progres dipulihkan: "+n+" topik dipahami, "+(s.soal||0)+" soal dikerjakan. Tersimpan ke akun.");
    document.getElementById("be-imp").value="";
    root.innerHTML="";refresh=null;open();
  });
  if(ex)ex.addEventListener("click",function(){
    var v="";try{v=localStorage.getItem(KEY)||"{}"}catch(_){}
    var t=JSON.stringify({fileBosBasic:v});
    try{navigator.clipboard.writeText(t).then(function(){st("Progres tersalin.")},function(){document.getElementById("be-imp").value=t;st("Tidak bisa menyalin otomatis; teksnya ada di kotak di atas.")})}catch(_){document.getElementById("be-imp").value=t}
  });
})();
