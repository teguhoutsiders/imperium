/* ==== Imperium · bilah menu bawah HP gaya "homebar" (Teguh 2026-11-27) ====
   Bar membulat; menu aktif ditandai lingkaran penuh di dalam bar yang bergeser.
   Kalau menu aktif ada di dalam grup, submenu grup menempel di atas bar (satu panel).
   Dibangun otomatis dari .nav (urutan, kunci, badge, bahasa ikut). Hanya tampil di layar ≤760px. */
(function(){
  "use strict";
  var MQ=matchMedia("(max-width:760px)");
  var SKIP=["pengaturan","info"]; /* di HP pindah ke tombol roda gigi di kanan atas */
  var bar,row,l3,l3sig="",ind,last={},built="";
  function nav(){return document.querySelector("#side .nav")||document.querySelector(".nav")}
  function shown(el){if(!el||el.hidden)return false;var p=el;while(p&&p!==document.body){if(p.hidden&&!p.classList.contains("nsub"))return false;p=p.parentElement}var cs=getComputedStyle(el);return cs.display!=="none"}
  function cur(){var h=(location.hash||"").slice(1).split("?")[0];if(h==="stopwatch")h="calendar";var n=nav();return n&&n.querySelector('a[data-tab="'+h+'"]')?h:"overview"}
  function lbl(el){var s=el.querySelector(".ni");return s?(s.getAttribute("data-s")||s.textContent||"").trim():""}
  function full(el){var s=el.querySelector(".ni");return s?(s.textContent||"").trim():""}
  function cnt(el){var c=el.querySelector(".count");if(!c||c.hidden)return null;var t=(c.textContent||"").trim();if(!t||t==="0")return null;return {t:t,alert:c.classList.contains("alert")}}
  function icon(el){var i=el.querySelector("svg.ic");return i?i.outerHTML:""}
  function col(el){var i=el&&el.querySelector("svg.ic");if(!i)return "";var c=getComputedStyle(i).color;return c&&c!=="rgba(0, 0, 0, 0)"?c:""}
  try{last=JSON.parse(sessionStorage.getItem("imp-mnav-last")||"{}")||{}}catch(_){last={}}

  function items(){
    var n=nav(),out=[];if(!n)return out;
    Array.prototype.forEach.call(n.children,function(el){
      if(el.matches("a[data-tab]")){if(SKIP.indexOf(el.dataset.tab)<0&&shown(el))out.push({key:el.dataset.tab,tab:el.dataset.tab,name:full(el),icon:icon(el),count:cnt(el),c:col(el)})}
      else if(el.classList.contains("ngrp")){
        if(!shown(el))return;var g=el.dataset.ng,btn=el.querySelector(".ng-btn"),subs=[];
        el.querySelectorAll(".nsub a[data-tab]").forEach(function(a){var h=a.classList.contains("nav-hide");if(h||(!a.hidden&&getComputedStyle(a).display!=="none"))subs.push({tab:a.dataset.tab,name:full(a),icon:icon(a),count:cnt(a),c:col(a),hide:h})});
        if(subs.some(function(x){return !x.hide}))out.push({key:"g:"+g,group:g,name:btn?full(btn):g,icon:btn?icon(btn):"",count:btn?cnt(btn):null,c:col(btn),subs:subs});
      }
    });
    return out;
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function badge(c){return c?'<b class="mn-c'+(c.alert?" al":"")+'">'+esc(c.t)+"</b>":""}

  function ensure(){
    if(bar)return;
    bar=document.createElement("nav");bar.id="mnav";bar.setAttribute("aria-label","Menu");
    bar.innerHTML='<div id="mnav-l3" role="tablist" hidden></div><div id="mnav-sub" role="navigation" hidden></div><div class="mn-items"><span class="mn-ind" aria-hidden="true" hidden><span class="mn-ball"></span></span><div class="mn-row"></div></div>';
    row=bar.querySelector("#mnav-sub");l3=bar.querySelector("#mnav-l3");
    l3.addEventListener("click",function(e){var b=e.target.closest("[data-l3]");if(!b)return;e.preventDefault();e.stopPropagation();var src=l3src();if(!src)return;var t=src.items[+b.dataset.l3];if(t)t.click();setTimeout(renderL3,30)});
    document.body.appendChild(bar);
    ind=bar.querySelector(".mn-ind");
    bar.addEventListener("click",function(e){
      var b=e.target.closest("[data-go]");if(!b)return;e.preventDefault();
      var k=b.dataset.go;
      if(k.indexOf("g:")===0){var it=items().find(function(x){return x.key===k});if(!it)return;
        var vis=it.subs.filter(function(s){return !s.hide}),t=last[it.group]&&it.subs.some(function(s){return s.tab===last[it.group]})?last[it.group]:vis[0].tab;
        if(it.subs.some(function(s){return s.tab===cur()}))return;go(t)}
      else go(k);
    });
  }
  function gear(){
    var lb=document.getElementById("launch-btn");if(!lb||document.getElementById("mn-gear"))return;
    var g=document.createElement("button");g.type="button";g.id="mn-gear";g.className="launch-btn mn-gear";
    g.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
    g.addEventListener("click",function(){go("pengaturan")});lb.parentNode.insertBefore(g,lb);
  }
  function go(t){if(cur()===t)return;try{navigator.vibrate&&navigator.vibrate(6)}catch(_){}location.hash=t}

  function render(){
    if(!MQ.matches){document.documentElement.classList.remove("mnav-on","mnav-sub");return}
    ensure();gear();document.documentElement.classList.add("mnav-on");
    var gb=document.getElementById("mn-gear");if(gb){var on=SKIP.indexOf(cur())>=0;gb.classList.toggle("on",on);var gl=document.querySelector('.nav a[data-tab="pengaturan"] .ni');var nm=gl?gl.textContent.trim():"Settings";gb.title=nm;gb.setAttribute("aria-label",nm)}
    var its=items(),c=cur(),act=null,grp=null;
    its.forEach(function(it){if(it.tab===c)act=it;if(it.subs&&it.subs.some(function(s){return s.tab===c})){act=it;grp=it}});
    if(grp){last[grp.group]=c;try{sessionStorage.setItem("imp-mnav-last",JSON.stringify(last))}catch(_){}}
    var sig=JSON.stringify(its.map(function(i){return [i.key,i.name,i.count,i.c,i.subs&&i.subs.map(function(s){return [s.tab,s.name,s.count,s.c]})]}))+"|"+(act?act.key:"")+"|"+c;
    if(sig===built)return;built=sig;
    var box=bar.querySelector(".mn-row");
    box.innerHTML=its.map(function(it){var on=act&&act.key===it.key;
      return '<a href="'+(it.tab?"#"+it.tab:"#")+'" class="mn-i'+(on?" on":"")+'" data-go="'+esc(it.key)+'" aria-label="'+esc(it.name)+'"'+(on?' aria-current="page"':"")+' title="'+esc(it.name)+'"'+(it.c?' style="--ic:'+esc(it.c)+'"':"")+'>'+it.icon+badge(it.count)+"</a>"}).join("");
    bar.style.setProperty("--n",its.length);
    bar.style.setProperty("--gc",(grp&&grp.c)||(act&&act.c)||"");
    /* lingkaran aktif */
    var ball=ind.querySelector(".mn-ball");
    if(act){var i=its.indexOf(act);ball.innerHTML=act.icon;ind.hidden=false;ind.style.setProperty("--ic",act.c||"");
      var first=!ind.dataset.ready;ind.style.transition=first?"none":"";ind.style.setProperty("--i",i);ind.dataset.ready="1";
      if(first)requestAnimationFrame(function(){ind.style.transition=""});
      ball.classList.remove("pop");void ball.offsetWidth;ball.classList.add("pop");
    }else ind.hidden=true;
    /* submenu di atas bar */
    if(grp){
      row.innerHTML='<div class="mns-in">'+grp.subs.filter(function(x){return !x.hide}).map(function(s){var on=s.tab===c||(c==="ielts"&&s.tab==="english");return '<a href="#'+esc(s.tab)+'" class="mns-i'+(on?" on":"")+'" data-go="'+esc(s.tab)+'"'+(on?' aria-current="page"':"")+(s.c?' style="--ic:'+esc(s.c)+'"':"")+' aria-label="'+esc(s.name)+'" title="'+esc(s.name)+'">'+s.icon+badge(s.count)+"</a>"}).join("")+"</div>";
      row.setAttribute("aria-label",grp.name);row.hidden=false;document.documentElement.classList.add("mnav-sub");
      var a=row.querySelector(".mns-i.on");if(a)try{a.scrollIntoView({block:"nearest",inline:"center"})}catch(_){}
    }else{row.hidden=true;row.innerHTML="";document.documentElement.classList.remove("mnav-sub")}
  }

  /* ---------- tingkat ketiga: tab di dalam halaman (Basic English, IELTS) ---------- */
  var L3=[
    {sel:"#tab-english .fb-tab",item:"button[data-t]",on:function(b){return b.classList.contains("on")}},
    {sel:"#ie-tabs",item:"[data-ietab]",on:function(b){return b.getAttribute("aria-pressed")==="true"||b.classList.contains("on")}}
  ];
  function l3src(){
    for(var k=0;k<L3.length;k++){var el=document.querySelector(L3[k].sel);if(!el)continue;var pn=el.closest("section.panel");if(pn&&pn.hidden)continue;
      var its=Array.prototype.slice.call(el.querySelectorAll(L3[k].item));if(its.length)return {def:L3[k],el:el,items:its}}
    return null;
  }
  function renderL3(){
    if(!l3)return;var src=MQ.matches?l3src():null;
    if(!src){if(!l3.hidden){l3.hidden=true;l3.innerHTML="";l3sig=""}document.documentElement.classList.remove("mnav-l3");return}
    var data=src.items.map(function(b){return [(b.textContent||"").trim(),src.def.on(b)]}),sig=JSON.stringify(data);
    document.documentElement.classList.add("mnav-l3");l3.hidden=false;
    if(sig===l3sig)return;var first=!l3sig;l3sig=sig;
    l3.setAttribute("aria-label",(src.el.getAttribute("aria-label")||"").trim());
    l3.innerHTML='<div class="ml3-in">'+data.map(function(d,i){return '<button type="button" role="tab" class="ml3-i'+(d[1]?" on":"")+'" data-l3="'+i+'" aria-selected="'+d[1]+'">'+esc(d[0])+"</button>"}).join("")+"</div>";
    var a=l3.querySelector(".ml3-i.on");if(a)try{a.scrollIntoView({block:"nearest",inline:"center",behavior:first?"auto":"smooth"})}catch(_){}
  }
  var l3t=null;function l3soon(){clearTimeout(l3t);l3t=setTimeout(renderL3,40)}
  function watchL3(){["tab-english","tab-ielts"].forEach(function(id){var p=document.getElementById(id);if(p)new MutationObserver(l3soon).observe(p,{subtree:true,childList:true,attributes:true,attributeFilter:["class","aria-pressed","hidden"]})})}
  var t=null;function soon(){clearTimeout(t);t=setTimeout(function(){render();renderL3()},40)}
  addEventListener("hashchange",soon);
  addEventListener("imp-lang",function(){built="";soon()});
  addEventListener("resize",soon);
  if(MQ.addEventListener)MQ.addEventListener("change",function(){built="";soon()});
  function watch(){var n=nav();if(!n)return;new MutationObserver(soon).observe(n,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["hidden","class","style","data-s"]})}
  function start(){watch();watchL3();render();setTimeout(render,600);setTimeout(render,2000)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
