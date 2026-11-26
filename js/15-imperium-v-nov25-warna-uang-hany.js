/* Imperium v-Nov25: warna uang hanya hijau (plus) dan merah (minus). */
(function(){
  "use strict";
  var ROOTS="#tab-overview,#tab-akun,#tab-record,#tab-aset,#tab-hutang,#tab-budget,#tab-kategori,#tab-proyek,#tab-masa-aktif,#tab-calendar,#tab-dreams,#tab-tugas";
  var SKIP=".ttl,.pn,.pnotes,.proj h3,.rc-name,.catn,.acn,.ct-name,.note-body,.ev-t,a.lnk,.app .t,textarea,input,select,option,script,style,button,.mny,.stat .v";
  var RX=/([+−\-–])?(Rp\s?\d[\d.,]*(?:\s?(?:jt|rb|M)\b)?)/g;
  function isMinus(c){return c==="−"||c==="-"||c==="–"}
  function cls(sign,el){
    if(sign)return isMinus(sign)?"neg":"pos";
    if(el.closest&&el.closest(".neg,.spent"))return "neg";
    return "pos";
  }
  function proc(tn){
    var p=tn.parentNode;if(!p||p.nodeType!==1)return;
    var s=tn.nodeValue;if(!s||s.indexOf("Rp")<0)return;
    if(p.closest(SKIP))return;
    RX.lastIndex=0;var m,last=0,frag=null;
    while((m=RX.exec(s))){
      var i=m.index;
      if(!m[1]&&i>0&&/[A-Za-z0-9]/.test(s.charAt(i-1)))continue;
      frag=frag||document.createDocumentFragment();
      if(i>last)frag.appendChild(document.createTextNode(s.slice(last,i)));
      var sp=document.createElement("span");sp.className="mny "+cls(m[1],p);sp.textContent=m[0];
      frag.appendChild(sp);last=i+m[0].length;
    }
    if(!frag)return;
    if(last<s.length)frag.appendChild(document.createTextNode(s.slice(last)));
    p.replaceChild(frag,tn);
  }
  function stat(v){
    var t=(v.textContent||"").replace(/\s+/g,"");
    var m=/^([+−\-–])?Rp\d/.exec(t);
    if(!m){v.classList.remove("mny-pos","mny-neg");return}
    var neg=m[1]?isMinus(m[1]):v.classList.contains("neg");
    v.classList.toggle("mny-neg",neg);v.classList.toggle("mny-pos",!neg);
  }
  function scan(n){
    if(!n)return;
    if(n.nodeType===3){
      var sv=n.parentNode&&n.parentNode.closest&&n.parentNode.closest(".stat .v");
      if(sv)stat(sv);else proc(n);
      return;
    }
    if(n.nodeType!==1)return;
    var sv2=n.closest&&n.closest(".stat .v");
    if(sv2){stat(sv2);return}
    if(n.matches&&n.matches(".stat .v"))stat(n);
    if(n.querySelectorAll)n.querySelectorAll(".stat .v").forEach(stat);
    var w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT,null),list=[],x;
    while((x=w.nextNode()))if(x.nodeValue.indexOf("Rp")>=0)list.push(x);
    list.forEach(proc);
  }
  var mo=new MutationObserver(function(recs){
    try{
      recs.forEach(function(r){
        if(r.type==="characterData"){var t=r.target,p=t.parentNode;if(p&&p.classList&&p.classList.contains("mny"))return;scan(t)}
        else r.addedNodes.forEach(scan);
      });
    }catch(e){}
    mo.takeRecords();
  });
  function init(){
    document.querySelectorAll(ROOTS).forEach(function(root){
      try{scan(root)}catch(e){}
      mo.observe(root,{childList:true,subtree:true,characterData:true});
    });
    mo.takeRecords();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
