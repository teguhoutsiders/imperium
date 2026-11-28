/* ==== English Academy (Teguh 2026-11-28) ====
   Basic English dan IELTS jadi satu paket di satu menu "English Academy".
   Kedua halaman tetap utuh (materi, progres, catatan belajar, skor tidak berubah dan tetap
   disimpan di tempat yang sama); yang berubah hanya cara masuknya: satu menu + tombol pindah
   "Basic English | IELTS" di bagian atas halaman. Menu IELTS di sidebar disembunyikan (nav-hide). */
(function(){
  "use strict";
  var NAME="English Academy";
  function T(en,id){return document.documentElement.lang==="id"?id:en}
  function cur(){return (location.hash||"").slice(1).split("?")[0]}
  var PARTS=[
    {tab:"english",n:"Basic English",s:["Foundation · grammar & practice","Dasar · grammar & latihan"]},
    {tab:"ielts",n:"IELTS",s:["Target band 7","Target band 7"]}
  ];
  function bar(){
    var c=cur();
    return '<div class="ea-in"><span class="ea-k">'+NAME+'</span><div class="ea-seg" role="tablist" aria-label="'+NAME+'">'+PARTS.map(function(p,i){
      var on=p.tab===c;
      return '<a role="tab" href="#'+p.tab+'" class="ea-b'+(on?" on":"")+'" aria-selected="'+on+'"'+(on?' aria-current="page"':"")+'><span class="ea-no">'+(i+1)+'</span><span class="ea-t"><b>'+p.n+'</b><small>'+T(p.s[0],p.s[1])+'</small></span></a>'}).join("")+'</div></div>';
  }
  function mount(){
    PARTS.forEach(function(p){
      var pn=document.getElementById("tab-"+p.tab);if(!pn)return;
      var el=pn.querySelector(":scope>.ea-bar");
      if(!el){el=document.createElement("div");el.className="ea-bar";pn.insertBefore(el,pn.firstChild)}
      el.innerHTML=bar();
    });
  }
  function sync(){
    var c=cur(),inAcad=c==="english"||c==="ielts";
    mount();
    var a=document.querySelector('.nav a[data-tab="english"]');
    if(a&&inAcad)a.setAttribute("aria-current","page");
    if(inAcad){var vt=document.getElementById("view-title");if(vt&&vt.textContent!==NAME)vt.textContent=NAME}
  }
  addEventListener("hashchange",function(){setTimeout(sync,0)});
  addEventListener("imp-lang",function(){setTimeout(sync,0)});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",sync);else sync();
})();
