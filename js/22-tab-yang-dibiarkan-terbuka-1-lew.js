/* Tab yang dibiarkan terbuka: (1) lewat tengah malam, tampilan "hari ini" diperbarui; (2) ada versi baru, tampilkan tombol muat ulang */
(function(){
  function ymd(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
  var day=ymd(new Date());
  window.IMP_SET_DATE=function(){var t=new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    ["ov-date","ov-date-m"].forEach(function(id){var e=document.getElementById(id);if(e&&e.dataset.d!==t){e.dataset.d=t;e.textContent=t}})};
  window.IMP_SET_DATE();
  function dayCheck(){var d=ymd(new Date());if(d!==day){day=d;window.IMP_SET_DATE();try{window.IMP_REFRESH&&window.IMP_REFRESH()}catch(_){}}}
  setInterval(dayCheck,30000);document.addEventListener("visibilitychange",function(){if(!document.hidden)dayCheck()});window.addEventListener("focus",dayCheck);
  var base="imperium-shell-v76",shown=false,lastChk=0; /* samakan dengan nama cache di sw.js setiap rilis */
  function ver(){return fetch("sw.js?_="+Date.now(),{cache:"no-store"}).then(function(r){return r.ok?r.text():null}).then(function(t){var m=t&&/const C="([^"]+)"/.exec(t);return m?m[1]:null}).catch(function(){return null})}
  function chk(){
    if(shown||document.hidden||Date.now()-lastChk<60000)return;lastChk=Date.now();
    ver().then(function(v){
      if(!v)return;if(!base){base=v;return}
      if(v!==base&&!shown){shown=true;var b=document.createElement("div");b.className="imp-upd";b.setAttribute("role","status");
        b.innerHTML='<span>'+(document.documentElement.lang==="id"?"Imperium versi baru tersedia":"A new version of Imperium is available")+'</span><button type="button">'+(document.documentElement.lang==="id"?"Muat ulang":"Reload")+'</button>';
        b.querySelector("button").onclick=function(){location.reload()};document.body.appendChild(b)}
    });
  }
  setTimeout(chk,3000);setInterval(chk,10*60000);document.addEventListener("visibilitychange",function(){if(!document.hidden)chk()});window.addEventListener("focus",chk);
})();
