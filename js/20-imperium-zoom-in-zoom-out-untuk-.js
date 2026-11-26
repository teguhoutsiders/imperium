/* ==== Imperium: zoom in / zoom out untuk menu Excel & Tabel (Teguh 2026-11-26) ====
   Kontrol seperti pojok kanan bawah Excel: [−] slider [+] 100%. Juga Ctrl + scroll mouse / cubit touchpad di atas sel.
   Ukuran tersimpan per menu di perangkat ini. */
(function(){
  var MIN=50,MAX=200,STEP=10;
  function T(en,id){return document.documentElement.lang==="id"?id:en}
  var Z={excel:{key:"imp-zoom-excel",host:"xl-host",target:".xl-t",bar:".xl-sheets",wrap:".xl-grid"},
         tabel:{key:"imp-zoom-tabel",host:"tb-host",target:".tb-t",bar:".tb-bar",wrap:".tb-wrap"}};
  function get(k){var v=100;try{v=+localStorage.getItem(Z[k].key)||100}catch(_){}return Math.max(MIN,Math.min(MAX,v))}
  function set(k,v){v=Math.round(Math.max(MIN,Math.min(MAX,v)));try{localStorage.setItem(Z[k].key,String(v))}catch(_){}apply(k);return v}
  window.IMP_ZOOM={get:get,set:set};
  function apply(k){var c=Z[k],h=document.getElementById(c.host);if(!h)return;var v=get(k),t=h.querySelector(c.target);
    if(t)t.style.zoom=v===100?"":String(v/100);
    h.querySelectorAll(".zm").forEach(function(w){var r=w.querySelector("input[type=range]"),p=w.querySelector(".zm-p");if(r&&document.activeElement!==r)r.value=v;if(p)p.textContent=v+"%"})}
  function widget(k){var d=document.createElement("div");d.className="zm";d.dataset.zk=k;
    d.innerHTML='<button type="button" data-zm="-" title="'+T("Zoom out","Perkecil")+'" aria-label="'+T("Zoom out","Perkecil")+'">−</button>'
      +'<input type="range" min="'+MIN+'" max="'+MAX+'" step="'+STEP+'" value="'+get(k)+'" aria-label="Zoom">'
      +'<button type="button" data-zm="+" title="'+T("Zoom in","Perbesar")+'" aria-label="'+T("Zoom in","Perbesar")+'">+</button>'
      +'<button type="button" class="zm-p" data-zm="0" title="'+T("Back to 100%","Kembali ke 100%")+'">'+get(k)+"%</button>";
    d.addEventListener("click",function(e){var b=e.target.closest("[data-zm]");if(!b)return;e.preventDefault();var v=get(k);
      set(k,b.dataset.zm==="+"?Math.floor(v/STEP)*STEP+STEP:b.dataset.zm==="-"?Math.ceil(v/STEP)*STEP-STEP:100)});
    d.addEventListener("input",function(e){if(e.target.type==="range")set(k,+e.target.value)});
    return d}
  function mount(k){var c=Z[k],h=document.getElementById(c.host);if(!h)return;var bar=h.querySelector(c.bar);
    if(bar&&!bar.querySelector(".zm"))bar.appendChild(widget(k));apply(k)}
  /* pasang ulang setiap kali Excel/Tabel menggambar ulang isinya */
  Object.keys(Z).forEach(function(k){var h=document.getElementById(Z[k].host);if(!h)return;
    var mo=new MutationObserver(function(){if(!h.querySelector(Z[k].bar+" .zm")||(h.querySelector(Z[k].target)&&h.querySelector(Z[k].target).style.zoom!==(get(k)===100?"":String(get(k)/100))))mount(k)});
    mo.observe(h,{childList:true,subtree:true});mount(k);
    /* Ctrl + scroll (atau cubit touchpad) di atas sel = zoom, seperti Excel */
    h.addEventListener("wheel",function(e){if(!(e.ctrlKey||e.metaKey))return;if(!e.target.closest(Z[k].wrap))return;e.preventDefault();
      set(k,get(k)+(e.deltaY<0?STEP:-STEP))},{passive:false});
  });
  addEventListener("imp-lang",function(){Object.keys(Z).forEach(function(k){var h=document.getElementById(Z[k].host);if(h)h.querySelectorAll(".zm").forEach(function(w){w.remove()});mount(k)})});
})();
