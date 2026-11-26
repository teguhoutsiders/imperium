/* ==== Imperium · bilah menu bawah HP gaya "drop" (Teguh 2026-11-26) ====
   Bar hitam membulat; menu aktif naik ke lingkaran dengan ikon oranye.
   Kalau menu aktif ada di dalam grup, submenu grup tampil di atas bar.
   Dibangun otomatis dari .nav (urutan, kunci, badge, bahasa ikut). Hanya tampil di layar ≤760px. */
(function(){
  "use strict";
  var MQ=matchMedia("(max-width:760px)");
  var bar,row,ind,last={},built="";
  function nav(){return document.querySelector("#side .nav")||document.querySelector(".nav")}
  function shown(el){if(!el||el.hidden)return false;var p=el;while(p&&p!==document.body){if(p.hidden&&!p.classList.contains("nsub"))return false;p=p.parentElement}var cs=getComputedStyle(el);return cs.display!=="none"}
  function cur(){var h=(location.hash||"").slice(1).split("?")[0];if(h==="stopwatch")h="calendar";var n=nav();return n&&n.querySelector('a[data-tab="'+h+'"]')?h:"overview"}
  function lbl(el){var s=el.querySelector(".ni");return s?(s.getAttribute("data-s")||s.textContent||"").trim():""}
  function full(el){var s=el.querySelector(".ni");return s?(s.textContent||"").trim():""}
  function cnt(el){var c=el.querySelector(".count");if(!c||c.hidden)return null;var t=(c.textContent||"").trim();if(!t||t==="0")return null;return {t:t,alert:c.classList.contains("alert")}}
  function icon(el){var i=el.querySelector("svg.ic");return i?i.outerHTML:""}
  try{last=JSON.parse(sessionStorage.getItem("imp-mnav-last")||"{}")||{}}catch(_){last={}}

  function items(){
    var n=nav(),out=[];if(!n)return out;
    Array.prototype.forEach.call(n.children,function(el){
      if(el.matches("a[data-tab]")){if(shown(el))out.push({key:el.dataset.tab,tab:el.dataset.tab,name:full(el),icon:icon(el),count:cnt(el)})}
      else if(el.classList.contains("ngrp")){
        if(!shown(el))return;var g=el.dataset.ng,btn=el.querySelector(".ng-btn"),subs=[];
        el.querySelectorAll(".nsub a[data-tab]").forEach(function(a){if(!a.hidden&&getComputedStyle(a).display!=="none")subs.push({tab:a.dataset.tab,name:full(a),icon:icon(a),count:cnt(a)})});
        if(subs.length)out.push({key:"g:"+g,group:g,name:btn?full(btn):g,icon:btn?icon(btn):"",count:btn?cnt(btn):null,subs:subs});
      }
    });
    return out;
  }
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function badge(c){return c?'<b class="mn-c'+(c.alert?" al":"")+'">'+esc(c.t)+"</b>":""}

  function ensure(){
    if(bar)return;
    bar=document.createElement("nav");bar.id="mnav";bar.setAttribute("aria-label","Menu");
    bar.innerHTML='<div class="mn-ind" aria-hidden="true"><svg viewBox="0 0 68 80"><path d="M34 0a34 34 0 0 1 34 34c0 17-14 25-23 38-4 6-7 8-11 8s-7-2-11-8C14 59 0 51 0 34A34 34 0 0 1 34 0z"/></svg><span class="mn-ball"></span></div><div class="mn-items"></div>';
    row=document.createElement("div");row.id="mnav-sub";row.setAttribute("role","navigation");row.hidden=true;
    document.body.appendChild(row);document.body.appendChild(bar);
    ind=bar.querySelector(".mn-ind");
    bar.addEventListener("click",function(e){
      var b=e.target.closest("[data-go]");if(!b)return;e.preventDefault();
      var k=b.dataset.go;
      if(k.indexOf("g:")===0){var it=items().find(function(x){return x.key===k});if(!it)return;
        var t=last[it.group]&&it.subs.some(function(s){return s.tab===last[it.group]})?last[it.group]:it.subs[0].tab;
        if(it.subs.some(function(s){return s.tab===cur()}))return;go(t)}
      else go(k);
    });
    row.addEventListener("click",function(e){var b=e.target.closest("[data-go]");if(!b)return;e.preventDefault();go(b.dataset.go)});
  }
  function go(t){if(cur()===t)return;try{navigator.vibrate&&navigator.vibrate(6)}catch(_){}location.hash=t}

  function render(){
    if(!MQ.matches){document.documentElement.classList.remove("mnav-on","mnav-sub");return}
    ensure();document.documentElement.classList.add("mnav-on");
    var its=items(),c=cur(),act=null,grp=null;
    its.forEach(function(it){if(it.tab===c)act=it;if(it.subs&&it.subs.some(function(s){return s.tab===c})){act=it;grp=it}});
    if(grp){last[grp.group]=c;try{sessionStorage.setItem("imp-mnav-last",JSON.stringify(last))}catch(_){}}
    var sig=JSON.stringify(its.map(function(i){return [i.key,i.name,i.count,i.subs&&i.subs.map(function(s){return [s.tab,s.name,s.count]})]}))+"|"+(act?act.key:"")+"|"+c;
    if(sig===built)return;built=sig;
    var box=bar.querySelector(".mn-items");
    box.innerHTML=its.map(function(it){var on=act&&act.key===it.key;
      return '<a href="'+(it.tab?"#"+it.tab:"#")+'" class="mn-i'+(on?" on":"")+'" data-go="'+esc(it.key)+'" aria-label="'+esc(it.name)+'"'+(on?' aria-current="page"':"")+' title="'+esc(it.name)+'">'+it.icon+badge(it.count)+"</a>"}).join("");
    bar.style.setProperty("--n",its.length);
    /* lingkaran aktif */
    var ball=ind.querySelector(".mn-ball");
    if(act){var i=its.indexOf(act);ball.innerHTML=act.icon;ind.hidden=false;
      var first=!ind.dataset.ready;ind.style.transition=first?"none":"";ind.style.setProperty("--i",i);ind.dataset.ready="1";
      if(first)requestAnimationFrame(function(){ind.style.transition=""});
      ball.classList.remove("pop");void ball.offsetWidth;ball.classList.add("pop");
    }else ind.hidden=true;
    /* submenu di atas bar */
    if(grp){
      row.innerHTML='<div class="mns-in">'+grp.subs.map(function(s){var on=s.tab===c;return '<a href="#'+esc(s.tab)+'" class="mns-i'+(on?" on":"")+'" data-go="'+esc(s.tab)+'"'+(on?' aria-current="page"':"")+">"+s.icon+"<span>"+esc(s.name)+"</span>"+badge(s.count)+"</a>"}).join("")+"</div>";
      row.setAttribute("aria-label",grp.name);row.hidden=false;document.documentElement.classList.add("mnav-sub");
      var a=row.querySelector(".mns-i.on");if(a)try{a.scrollIntoView({block:"nearest",inline:"center"})}catch(_){}
    }else{row.hidden=true;row.innerHTML="";document.documentElement.classList.remove("mnav-sub")}
  }
  var t=null;function soon(){clearTimeout(t);t=setTimeout(render,40)}
  addEventListener("hashchange",soon);
  addEventListener("imp-lang",function(){built="";soon()});
  addEventListener("resize",soon);
  if(MQ.addEventListener)MQ.addEventListener("change",function(){built="";soon()});
  function watch(){var n=nav();if(!n)return;new MutationObserver(soon).observe(n,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["hidden","class","style","data-s"]})}
  function start(){watch();render();setTimeout(render,600);setTimeout(render,2000)}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();
