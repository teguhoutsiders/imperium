/* Layar kartu menu (Teguh 2026-11-26): muncul setelah password; kartu grup membuka kartu sub-menunya. Juga lewat tombol ⊞ di atas atau klik logo. */
(function(){
  var el=null,curG=null;
  function T(en,id){return document.documentElement.lang==="id"?id:en}
  function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function mc(n){try{return getComputedStyle(n).getPropertyValue("--mc").trim()}catch(_){return ""}}
  function lbl(n){var x=n.querySelector(".ni");return x?x.textContent.trim():n.textContent.trim()}
  function ico(n){var x=n.querySelector("svg.ic");return x?x.outerHTML:""}
  function cnt(n){var c=n.querySelector(".count,[data-gc]");if(!c||c.hidden||!c.textContent.trim()||c.textContent.trim()==="0")return "";return '<span class="lnc-k'+(c.classList.contains("alert")?" alert":"")+'">'+esc(c.textContent.trim())+"</span>"}
  function cur(){return (location.hash||"#overview").slice(1)}
  function card(attr,n,color,sub,isLast){return '<button type="button" class="lnc-c'+(isLast?" last":"")+'" '+attr+(color?' style="--mc:'+esc(color)+'"':"")+'><span class="lnc-ic">'+ico(n)+'</span><span class="lnc-n">'+esc(lbl(n))+"</span>"+(sub?'<span class="lnc-s">'+esc(sub)+"</span>":"")+cnt(n)+"</button>"}
  function top(){
    var nav=document.querySelector(".nav");if(!nav)return "";var h="";
    Array.prototype.forEach.call(nav.children,function(n){
      if(n.matches("a[data-tab]")){h+=card('data-lt="'+n.dataset.tab+'"',n,mc(n),"",n.dataset.tab===cur());return}
      if(n.classList.contains("ngrp")){var b=n.querySelector(".ng-btn"),subs=n.querySelectorAll(".nsub>a[data-tab]:not(.nav-hide)");if(!b||!subs.length)return;
        var names=Array.prototype.map.call(subs,lbl);var on=Array.prototype.some.call(subs,function(a){return a.dataset.tab===cur()||(a.dataset.tab==="english"&&cur()==="ielts")});
        h+=card('data-lg="'+n.dataset.ng+'"',b,mc(n),names.slice(0,4).join(" · ")+(names.length>4?" …":""),on)}
    });
    return h;
  }
  function group(g){
    var n=document.querySelector('.ngrp[data-ng="'+g+'"]');if(!n)return "";var color=mc(n),h="";
    n.querySelectorAll(".nsub>a[data-tab]:not(.nav-hide)").forEach(function(a){h+=card('data-lt="'+a.dataset.tab+'"',a,color,"",a.dataset.tab===cur())});
    return h;
  }
  function date(){var d=document.getElementById("ov-date");return d?d.textContent:""}
  function render(){
    if(!el)return;var g=curG,gn=g&&document.querySelector('.ngrp[data-ng="'+g+'"] .ng-btn');
    var lg=document.getElementById("side-logo");
    el.innerHTML='<div class="lnc-in"><div class="lnc-h"><div><div class="brand-row"><img class="lnc-logo side-logo" src="'+esc(lg?lg.src:"icon-192-v2.png")+'" alt="" width="40" height="40"><h1 class="mark">IMPER<span>I</span>UM</h1></div><p class="lnc-d">'+esc(date())+'</p></div><button type="button" class="lnc-x" data-lx>'+T("Close","Tutup")+' ✕</button></div>'
      +(gn?'<p class="lnc-t"><button type="button" class="lnc-back" data-lb>← '+T("All menus","Semua menu")+'</button><b>'+esc(lbl(gn))+"</b></p>":'<p class="lnc-t"><b>'+T("Where to?","Mau buka menu apa?")+"</b></p>")
      +'<div class="lnc-g">'+(gn?group(g):top())+"</div></div>";
    var f=el.querySelector(".lnc-c.last")||el.querySelector(".lnc-c");if(f)try{f.focus({preventScroll:true})}catch(_){}
  }
  function open(){
    if(!el){el=document.createElement("div");el.className="lnc";el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label",T("All menus","Semua menu"));document.body.appendChild(el);
      el.addEventListener("click",function(e){
        if(e.target.closest("[data-lx]"))return close();
        if(e.target.closest("[data-lb]")){curG=null;return render()}
        var t=e.target.closest("[data-lt]");if(t){var tab=t.dataset.lt;close();if(cur()!==tab)location.hash=tab;return}
        var g=e.target.closest("[data-lg]");if(g){curG=g.dataset.lg;render()}
      });
      el.addEventListener("keydown",function(e){
        if(e.key==="Escape"){e.preventDefault();e.stopPropagation();if(curG){curG=null;render()}else close();return}
        if(e.key==="Backspace"&&curG&&!/INPUT|TEXTAREA/.test(e.target.tagName)){e.preventDefault();curG=null;render();return}
        var cs=[].slice.call(el.querySelectorAll(".lnc-c")),i=cs.indexOf(document.activeElement);if(i<0)return;
        var cols=Math.max(1,Math.round(el.querySelector(".lnc-g").clientWidth/cs[0].offsetWidth)),d={ArrowRight:1,ArrowLeft:-1,ArrowDown:cols,ArrowUp:-cols}[e.key];
        if(d){e.preventDefault();var j=Math.max(0,Math.min(cs.length-1,i+d));cs[j].focus()}
      });
    }
    curG=null;el.hidden=false;render();document.documentElement.classList.add("lnc-open");
  }
  function close(){if(el){el.hidden=true}document.documentElement.classList.remove("lnc-open")}
  window.IMP_LAUNCHER={open:open,close:close};
  var lb=document.getElementById("launch-btn");if(lb)lb.addEventListener("click",open);
  var mk=document.querySelector(".side-brand .mark");if(mk){mk.style.cursor="pointer";mk.title=T("All menus","Semua menu");mk.addEventListener("click",open)}
  addEventListener("imp-unlocked",function(){setTimeout(open,0)});
  if(window.IMP_UNLOCKED)setTimeout(open,0);
  addEventListener("imp-lang",function(){if(el&&!el.hidden)render()});
})();
