/* garis bawah header muncul saat konten digulir di bawahnya */
(function(){var m=document.querySelector(".main");if(!m)return;function f(){m.classList.toggle("hdr-stuck",m.scrollTop>4)}m.addEventListener("scroll",f,{passive:true});addEventListener("hashchange",function(){setTimeout(f,0)});f()})();
