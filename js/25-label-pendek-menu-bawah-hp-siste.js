/* label pendek menu bawah HP (sistem desain) */
(function(){
  var S={id:{overview:"Ringkas",train:"Latihan",plan:"Agenda",goals:"Target",money:"Uang",lib:"Arsip",excel:"Excel",tabel:"Tabel",pengaturan:"Atur",info:"Info"},
         en:{overview:"Home",train:"Learn",plan:"Plan",goals:"Goals",money:"Money",lib:"Library",excel:"Excel",tabel:"Table",pengaturan:"Settings",info:"Info"}};
  function apply(){var L=(document.documentElement.lang||"en").slice(0,2)==="id"?S.id:S.en;
    document.querySelectorAll(".nav>a[data-tab] .ni").forEach(function(n){var k=n.parentNode.dataset.tab;if(L[k])n.setAttribute("data-s",L[k]);else n.removeAttribute("data-s")});
    document.querySelectorAll(".nav>.ngrp>.ng-btn .ni").forEach(function(n){var k=n.closest(".ngrp").dataset.ng;if(L[k])n.setAttribute("data-s",L[k]);else n.removeAttribute("data-s")})}
  apply();addEventListener("imp-lang",apply);new MutationObserver(function(){apply()}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
})();
