/* ==== Animasi pindah menu, riak tombol, geser kiri/kanan di HP, efek mengetik ==== */
(function(){
  var R=document.documentElement;
  function P(){return window.IMP_PREFS||{}}
  function reduced(){return P().anim==="off"||matchMedia("(prefers-reduced-motion: reduce)").matches}
  var CARDS="#file-list li,#note-list .note,#dream-list .dream,.ovc,.setcard,form.entry,.lcol>*,.rcol>*,.proj,.liab,.stat,.ie-hero,.ie-card,.ie-wk,details.ie-acc,.rc-card,.ptbl-sec,.fb .kartu,.notes>*,.dreams>*,.liabs>*,.fbar,#file-list>*,.ledger";
  var dir=0;
  function panel(){return document.querySelector("section.panel:not([hidden])")}
  function stagger(root){
    if(reduced()||!root)return;
    var els=root.querySelectorAll(CARDS),n=0,seen=[];
    for(var i=0;i<els.length&&n<22;i++){
      var el=els[i];if(seen.some(function(s){return s.contains(el)}))continue;
      var r=el.getBoundingClientRect();if(!r.height||r.top>innerHeight)continue;
      seen.push(el);el.style.setProperty("--fx-i",n++);el.classList.remove("fx-pop");void el.offsetWidth;el.classList.add("fx-pop");
      el.addEventListener("animationend",function h(ev){if(ev.target!==this)return;this.classList.remove("fx-pop");this.removeEventListener("animationend",h)});
    }
  }
  function enter(){
    var p=panel();if(!p)return;
    var t=document.getElementById("view-title");
    if(!reduced()){
      p.classList.remove("fx-in","fx-l","fx-r");void p.offsetWidth;p.classList.add("fx-in");
      if(dir>0)p.classList.add("fx-l");else if(dir<0)p.classList.add("fx-r");
      p.addEventListener("animationend",function h(ev){if(ev.target!==p)return;p.classList.remove("fx-in","fx-l","fx-r");p.removeEventListener("animationend",h)});
      if(t){t.classList.remove("fx-t");void t.offsetWidth;t.classList.add("fx-t")}
      requestAnimationFrame(function(){stagger(p)});
    }
    dir=0;
    toast();
  }
  window.IMP_FX_STAGGER=stagger;
  addEventListener("hashchange",enter);
  setTimeout(enter,60);
  /* overview: kartu muncul bertahap setelah data pertama kali dimuat */
  var ov=document.getElementById("ov");
  if(ov)new MutationObserver(function(){if(ov.dataset.fx||!ov.querySelector(".ovc"))return;ov.dataset.fx="1";if(!document.getElementById("tab-overview").hidden)stagger(ov)}).observe(ov,{childList:true});

  /* riak saat menekan tombol/menu */
  var RIP="button:not(.check):not(.thumb),.nav a,.app,.stabs a,.ovl-list a,.chip,.uiopt";
  document.addEventListener("pointerdown",function(e){
    if(reduced())return;
    var b=e.target.closest&&e.target.closest(RIP);if(!b||b.disabled)return;
    var cs=getComputedStyle(b);if(cs.display==="none")return;
    var r=b.getBoundingClientRect(),z=Math.max(r.width,r.height),sp=document.createElement("span");
    sp.className="fx-rip";sp.style.width=sp.style.height=z+"px";sp.style.left=(e.clientX-r.left-z/2)+"px";sp.style.top=(e.clientY-r.top-z/2)+"px";
    var pos=b.style.position,ovf=b.style.overflow;
    if(cs.position==="static")b.style.position="relative";
    b.style.overflow="hidden";b.appendChild(sp);
    setTimeout(function(){sp.remove();b.style.overflow=ovf;if(cs.position==="static")b.style.position=pos},560);
  },{passive:true});

  /* ---------- HP: geser kiri/kanan untuk pindah menu ---------- */
  function order(){var a=document.querySelector('.nav .nsub a[data-tab="'+cur()+'"]');var sc=a?a.parentNode:document;return Array.prototype.map.call(sc.querySelectorAll(a?"a[data-tab]":".nav a[data-tab]"),function(x){return x.dataset.tab})}
  function inSub(){return !!document.querySelector('.nav .nsub a[data-tab="'+cur()+'"]')}
  function cur(){var h=(location.hash||"").slice(1);if(h==="stopwatch")h="calendar";return document.querySelector('.nav a[data-tab="'+h+'"]')?h:"overview"}
  function scrollX(el){for(;el&&el!==document.body;el=el.parentElement){if(el.scrollWidth>el.clientWidth+4){var o=getComputedStyle(el).overflowX;if(o==="auto"||o==="scroll")return true}}return false}
  var tst=null;
  document.addEventListener("touchstart",function(e){
    if(e.touches.length!==1){tst=null;return}
    var t=e.target;
    if(t.closest("input,textarea,select,[contenteditable],.lb,.fv,.fb-lihat,canvas,#tab-excel")||scrollX(t)){tst=null;return}
    tst={x:e.touches[0].clientX,y:e.touches[0].clientY,w:Date.now(),side:!!t.closest(".side")};
  },{passive:true});
  document.addEventListener("touchend",function(e){
    if(!tst)return;var s=tst;tst=null;
    var p=e.changedTouches[0],dx=p.clientX-s.x,dy=p.clientY-s.y;
    if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.7||Date.now()-s.w>800)return;
    var side=document.getElementById("side"),open=side&&side.classList.contains("open");
    var mobile=matchMedia("(max-width:760px)").matches;
    if(open||!document.getElementById("scrim").hidden){document.getElementById("scrim").click();return}
    if(s.side||!inSub())return;
    var o=order(),i=o.indexOf(cur()),j=i+(dx<0?1:-1);
    if(j<0)return;
    if(j>=o.length)return;
    dir=dx<0?1:-1;
    if(P().anim!=="off")try{navigator.vibrate&&navigator.vibrate(8)}catch(_){}
    location.hash=o[j];
  },{passive:true});
  /* penanda posisi menu (HP) */
  var tEl=null,tTm=0;
  function toast(){
    if(!matchMedia("(max-width:760px)").matches||!inSub())return;
    if(!tEl){tEl=document.createElement("div");tEl.className="fx-toast";tEl.setAttribute("aria-hidden","true");document.body.appendChild(tEl)}
    var o=order(),i=o.indexOf(cur()),a=document.querySelector('.nav a[data-tab="'+cur()+'"] .ni');
    tEl.innerHTML='<span></span><span class="fx-dots">'+o.map(function(_,k){return "<i"+(k===i?' class="on"':"")+"></i>"}).join("")+"</span>";
    tEl.firstChild.textContent=a?a.textContent:"";
    tEl.classList.add("on");clearTimeout(tTm);tTm=setTimeout(function(){tEl.classList.remove("on")},1400);
  }

  /* ---------- efek mengetik ---------- */
  var layer=null,alive=0,actx=null;
  function L(){if(!layer){layer=document.createElement("div");layer.id="fx-layer";document.body.appendChild(layer)}return layer}
  var TXT='input:not([type]),input[type=text],input[type=search],input[type=url],input[type=email],input[type=number],input[type=tel],input[type=password],textarea';
  var PROPS=["boxSizing","width","fontFamily","fontSize","fontWeight","fontStyle","letterSpacing","textTransform","wordSpacing","textIndent","paddingTop","paddingRight","paddingBottom","paddingLeft","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth","borderStyle","lineHeight","tabSize","whiteSpace","wordBreak","overflowWrap"];
  function caret(el){
    var r=el.getBoundingClientRect(),pos=null;
    try{pos=el.selectionEnd}catch(_){}
    if(pos==null||el.type==="password")return {x:Math.min(r.right-12,r.left+14+(el.value||"").length*7.5),y:r.top+r.height/2};
    var cs=getComputedStyle(el),m=document.createElement("div"),ta=el.tagName==="TEXTAREA";
    PROPS.forEach(function(k){m.style[k]=cs[k]});
    m.style.position="fixed";m.style.left="-9999px";m.style.top="0";m.style.visibility="hidden";m.style.borderColor="transparent";
    m.style.whiteSpace=ta?"pre-wrap":"pre";if(!ta)m.style.width="auto";
    m.textContent=el.value.slice(0,pos);
    var sp=document.createElement("span");sp.textContent=el.value.slice(pos)||".";m.appendChild(sp);document.body.appendChild(m);
    var lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.3;
    var x=r.left+sp.offsetLeft+parseFloat(cs.borderLeftWidth)-el.scrollLeft;
    var y=r.top+sp.offsetTop+parseFloat(cs.borderTopWidth)-el.scrollTop+lh/2;
    m.remove();
    return {x:Math.max(r.left+4,Math.min(r.right-4,x)),y:Math.max(r.top+4,Math.min(r.bottom-4,y))};
  }
  function accent(){return getComputedStyle(R).getPropertyValue("--accent").trim()||"#7A1F3D"}
  function spawn(html,x,y,css,frames,opt){
    if(alive>140)return;
    var s=document.createElement("span");s.innerHTML=html||"";if(css)s.style.cssText=css;
    s.style.left=x+"px";s.style.top=y+"px";L().appendChild(s);alive++;
    var a=s.animate(frames,opt);a.onfinish=function(){s.remove();alive--};
  }
  function rnd(a,b){return a+Math.random()*(b-a)}
  var COLS=["#ff5d73","#ffcc33","#4fd18b","#5aa9ff","#b07aff","#ff9b3d"];
  var FX={
    glow:function(p,el){bump(el,"fx-glow")},
    pop:function(p,el,ch){
      bump(el,"fx-bump");
      if(!ch||!ch.trim())return;
      var c1=ch.slice(-1).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]});
      spawn(c1,p.x,p.y,"font:700 18px var(--f-body);color:"+accent()+";text-shadow:0 2px 6px rgba(0,0,0,.25)",[{transform:"translate(-50%,-50%) scale(.6)",opacity:1},{transform:"translate(-50%,-190%) scale(1.5)",opacity:0}],{duration:620,easing:"cubic-bezier(.2,.8,.2,1)"});
    },
    spark:function(p){var c=accent();for(var i=0;i<7;i++){var a=rnd(0,Math.PI*2),d=rnd(14,34),z=rnd(2,4.5);
      spawn("",p.x,p.y,"width:"+z+"px;height:"+z+"px;border-radius:50%;background:"+(i%2?c:"#ffcc33")+";box-shadow:0 0 6px "+c,[{transform:"translate(-50%,-50%)",opacity:1},{transform:"translate(calc(-50% + "+Math.cos(a)*d+"px),calc(-50% + "+Math.sin(a)*d+"px)) scale(.3)",opacity:0}],{duration:rnd(380,620),easing:"cubic-bezier(.1,.7,.3,1)"})}},
    confetti:function(p){for(var i=0;i<6;i++){var dx=rnd(-40,40),dy=rnd(-50,-15),rt=rnd(-360,360);
      spawn("",p.x,p.y,"width:6px;height:9px;border-radius:1.5px;background:"+COLS[i%COLS.length],[{transform:"translate(-50%,-50%) rotate(0)",opacity:1},{transform:"translate(calc(-50% + "+dx*.6+"px),calc(-50% + "+dy+"px)) rotate("+rt/2+"deg)",opacity:1,offset:.4},{transform:"translate(calc(-50% + "+dx+"px),calc(-50% + "+(dy+70)+"px)) rotate("+rt+"deg)",opacity:0}],{duration:rnd(700,1000),easing:"ease-out"})}},
    emoji:function(p){var E=["✨","⭐","💥","🔥","💫","🎉","⚡","💖"],e=E[Math.floor(Math.random()*E.length)];
      spawn(e,p.x,p.y,"font-size:18px",[{transform:"translate(-50%,-50%) scale(.4) rotate(0)",opacity:1},{transform:"translate(calc(-50% + "+rnd(-22,22)+"px),-260%) scale(1.3) rotate("+rnd(-40,40)+"deg)",opacity:0}],{duration:800,easing:"cubic-bezier(.2,.8,.2,1)"})},
    power:function(p,el){FX.spark(p);FX.spark(p);
      if(reduced())return;var x=rnd(-3,3),y=rnd(-3,3),m=document.querySelector(".main");if(m)m.animate([{transform:"translate("+x+"px,"+y+"px)"},{transform:"none"}],{duration:90})},
    wave:function(p){spawn("",p.x,p.y,"width:10px;height:10px;border-radius:50%;border:2px solid "+accent(),[{transform:"translate(-50%,-50%) scale(.3)",opacity:.9},{transform:"translate(-50%,-50%) scale(3.4)",opacity:0}],{duration:520,easing:"ease-out"})},
    sound:function(p,el,ch){click(ch===" "?0:ch==="\n"?2:1);bump(el,"fx-glow")},
    rainbow:function(p,el){var c=COLS[Math.floor(Math.random()*COLS.length)];el.style.caretColor=c;el.style.transition="box-shadow .25s";el.style.boxShadow="0 0 0 2px "+c;clearTimeout(el._rb);el._rb=setTimeout(function(){el.style.boxShadow=""},260)}
  };
  function bump(el,c){el.classList.remove(c);void el.offsetWidth;el.classList.add(c);clearTimeout(el["_"+c]);el["_"+c]=setTimeout(function(){el.classList.remove(c)},480)}
  function click(kind){
    try{
      actx=actx||new (window.AudioContext||window.webkitAudioContext)();
      var t=actx.currentTime,len=kind===2?.09:.035,buf=actx.createBuffer(1,Math.floor(actx.sampleRate*len),actx.sampleRate),d=buf.getChannelData(0);
      for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,kind===2?2:4);
      var src=actx.createBufferSource();src.buffer=buf;
      var f=actx.createBiquadFilter();f.type="bandpass";f.frequency.value=kind===0?900:kind===2?600:rnd(1700,2600);f.Q.value=.9;
      var g=actx.createGain();g.gain.value=kind===2?.5:.35;
      src.connect(f);f.connect(g);g.connect(actx.destination);src.start(t);
    }catch(_){}
  }
  document.addEventListener("input",function(e){
    var mode=P().tfx;if(!mode||mode==="off")return;
    var el=e.target;if(!el.matches||!el.matches(TXT))return;
    if(e.inputType&&!/^insert/.test(e.inputType))return;
    if(reduced()&&mode!=="sound"&&mode!=="glow"&&mode!=="rainbow"){bump(el,"fx-glow");return}
    var fn=FX[mode];if(!fn)return;
    var p=caret(el);L();fn(p,el,e.data||(e.inputType==="insertLineBreak"?"\n":""));
  });
  window.IMP_FX={test:function(mode){var el=document.getElementById("tfx-try");if(el&&FX[mode]){var r=el.getBoundingClientRect();L();FX[mode]({x:r.left+30,y:r.top+r.height/2},el,"A")}}};
})();
/* ==== Pilihan tampilan Berkas & Catatan: daftar, kartu kecil, kartu besar (disimpan di perangkat ini) ==== */
(function(){
  var T={file:{el:"file-list",def:"list"},note:{el:"note-list",def:"lg"},dream:{el:"dream-list",def:"lg"}};
  function get(k){try{return localStorage.getItem("imp-view-"+k)||T[k].def}catch(_){return T[k].def}}
  function apply(k){var v=get(k),el=document.getElementById(T[k].el);if(el)el.setAttribute("data-view",v);
    document.querySelectorAll('[data-vsw="'+k+'"] button').forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.v===v))})}
  document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-vsw] button");if(!b)return;
    var k=b.parentNode.dataset.vsw;try{localStorage.setItem("imp-view-"+k,b.dataset.v)}catch(_){}apply(k);
    var el=document.getElementById(T[k].el);if(el&&window.IMP_FX_STAGGER)window.IMP_FX_STAGGER(el)});
  apply("file");apply("note");apply("dream");
})();
/* HP: tab halaman di bawah — setelah dipilih, isi kembali ke atas dan tombol aktif terlihat */
document.addEventListener("click",function(e){
  var b=e.target.closest&&e.target.closest("#tab-english .fb-tab button,#ie-tabs [data-ietab]");if(!b)return;
  if(!matchMedia("(max-width:760px)").matches)return;
  setTimeout(function(){var m=document.querySelector(".main");if(m)m.scrollTo({top:0,behavior:"smooth"});
    var bar=b.parentNode,on=bar.querySelector(".on,[aria-pressed=\"true\"]")||b;try{bar.scrollTo({left:on.offsetLeft-bar.clientWidth/2+on.offsetWidth/2,behavior:"smooth"})}catch(_){}},30);
});
