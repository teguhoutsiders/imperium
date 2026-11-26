/* ==== Imperium Excel: shortcut Alt ala Excel (KeyTips), misalnya Alt+H+O+I = AutoFit lebar kolom (Teguh 2026-11-26) ====
   Tekan Alt lalu lepas (atau tahan Alt) lalu ketik huruf satu per satu. Panel kecil menunjukkan tombol berikutnya.
   Hanya untuk fitur yang ada di menu Excel Imperium. */
(function(){
  var host=document.getElementById("xl-host");if(!host)return;
  function X(){return host.__xl||(host.querySelector(".xl")&&host.__xl)||null}
  function on(){return (location.hash||"")==="#excel"&&!document.getElementById("tab-excel").hidden&&!!X()}
  function act(a){return function(){var x=X();x.commit();x.aksi(a,host.querySelector('[data-act="'+a+'"]'))}}
  function bd(k){return function(){var x=X();x.commit();x.garis(k);x.fokus()}}
  function mg(k){return function(){var x=X();x.commit();x.gabung(k);x.fokus()}}
  function al(k,v){return function(){var x=X();x.commit();x.gayaRentang(function(s){s[k]=v});x.fokus()}}
  function rot(v){return function(){var x=X();x.commit();x.gayaRentang(function(s){s.rot=v==="none"?null:v});x.fokus()}}
  function fn(f){return function(){var x=X();x.commit();x.mulaiEdit("="+f+"(","ubah")}}
  function nf(t,d){return function(){var x=X();x.commit();x.aturNf(t,d);x.fokus()}}
  function sel(name){return function(){var s=host.querySelector(name);if(s){s.focus();try{s.showPicker&&s.showPicker()}catch(_){}}}}
  function fontStep(d){return function(){var x=X(),s=x.selSize,i=Math.max(0,Math.min(s.options.length-1,s.selectedIndex+d));s.selectedIndex=i;s.dispatchEvent(new Event("change",{bubbles:true}));x.fokus()}}
  function cols(){var g=X().rentang(),out=[];for(var c=g.c1;c<=g.c2;c++)out.push(c);return out}
  function rows(){var g=X().rentang(),out=[];for(var r=g.r1;r<=Math.min(g.r2,X().S().brs-1);r++)out.push(r);return out}
  function L(c){return String.fromCharCode(65+c)}
  /* AutoFit seperti Excel: lebar kolom = teks terpanjang di kolom itu (diukur dari teksnya, bukan dari lebar sel), jadi diulang berkali-kali hasilnya tetap sama */
  var cvx=null;
  function textW(td){if(!cvx)cvx=document.createElement("canvas").getContext("2d");var cs=getComputedStyle(td);
    cvx.font=cs.fontStyle+" "+cs.fontWeight+" "+cs.fontSize+" "+cs.fontFamily;
    var acc=td.querySelector(".xl-acc"),w=0;
    if(acc){[].forEach.call(acc.children,function(ch){w+=cvx.measureText(ch.textContent).width});w+=12}else w=cvx.measureText(td.textContent).width;
    return Math.ceil(w+(parseFloat(cs.paddingLeft)||0)+(parseFloat(cs.paddingRight)||0)+6)}
  function autofitCol(){var x=X();x.commit();var S=x.S(),T=x.T();cols().forEach(function(c){var w=0;
      for(var r=0;r<T.length;r++){var td=T[r]&&T[r][c];if(!td||!td.textContent||td.colSpan>1||td.offsetParent===null)continue;w=Math.max(w,textW(td))}
      if(w)S.lebar[L(c)]=Math.min(800,Math.max(20,w));else delete S.lebar[L(c)]});x.lebarKolom();x.draft();x.fokus();tip("AutoFit lebar kolom")}
  function autofitRow(){var x=X();x.commit();var S=x.S(),TR=x.TR();rows().forEach(function(r){if(S.tinggi)delete S.tinggi[r];if(TR[r])TR[r].style.height=""});x.draft();x.fokus();tip("AutoFit tinggi baris")}
  function colWidth(){var x=X();x.commit();var S=x.S(),cs=cols(),cur=S.lebar[L(cs[0])]||Math.round(host.querySelectorAll(".xl-t col")[cs[0]+1].getBoundingClientRect().width||100);
    var v=prompt("Lebar kolom (piksel):",String(cur));v=parseFloat(String(v||"").replace(",","."));if(!(v>0))return x.fokus();
    cs.forEach(function(c){S.lebar[L(c)]=Math.max(12,Math.min(800,Math.round(v)))});x.lebarKolom();x.draft();x.fokus()}
  function rowHeight(){var x=X();x.commit();var S=x.S(),TR=x.TR(),rs=rows(),cur=(S.tinggi&&S.tinggi[rs[0]])||Math.round(TR[rs[0]].getBoundingClientRect().height);
    var v=prompt("Tinggi baris (piksel):",String(cur));v=parseFloat(String(v||"").replace(",","."));if(!(v>0))return x.fokus();
    S.tinggi=S.tinggi||{};rs.forEach(function(r){S.tinggi[r]=Math.max(16,Math.min(400,Math.round(v)));TR[r].style.height=S.tinggi[r]+"px"});x.draft();x.fokus()}
  function defWidth(){var x=X();x.commit();var S=x.S();cols().forEach(function(c){delete S.lebar[L(c)]});x.lebarKolom();x.draft();x.fokus();tip("Lebar kolom kembali ke bawaan")}
  function sheet(k){return function(){var s=window.IMP_XL_SHEET;if(!s||!s[k])return;if(k==="del"&&!confirm("Hapus sheet ini beserta isinya?"))return;s[k]()}}
  function zoom(v){return function(){if(window.IMP_ZOOM){if(v==="q"){var cur=window.IMP_ZOOM.get("excel"),n=parseFloat(prompt("Zoom (50–200%):",String(cur))||"");if(n>0)window.IMP_ZOOM.set("excel",n)}else window.IMP_ZOOM.set("excel",v)}var x=X();if(x)x.fokus()}}
  function sort(asc){return function(){var x=X();x.commit();x.urutkan(asc);x.fokus()}}
  function filt(){var x=X();x.commit();x.filterToggle();x.fokus()}
  function popup(a){return function(){var x=X();x.commit();var b=host.querySelector('[data-act="'+a+'"]');x.aksi(a,b)}}
  /* peta tombol: [huruf, keterangan, aksi | sub-peta] */
  var MAP={
    H:["Home",{
      "1":["Bold (tebal)",act("b")],"2":["Italic (miring)",act("i")],"3":["Underline (garis bawah)",act("u")],
      B:["Border",{A:["Semua garis",bd("all")],S:["Garis luar",bd("outer")],T:["Garis luar tebal",bd("thick")],O:["Garis bawah",bd("bottom")],P:["Garis atas",bd("top")],L:["Garis kiri",bd("left")],R:["Garis kanan",bd("right")],N:["Tanpa garis",bd("none")],M:["Pilihan border…",popup("bd-m")]}],
      H:["Warna isi sel…",popup("isi-m")],
      F:["Font",{F:["Pilih font",sel("[data-font]")],S:["Ukuran font",sel("[data-size]")],C:["Warna tulisan…",popup("warna-m")],G:["Perbesar font",fontStep(1)],K:["Perkecil font",fontStep(-1)],Q:["Orientasi (miring tulisan)",{
        O:["Miring ke atas",rot("ccw45")],L:["Miring ke bawah",rot("cw45")],V:["Teks tegak",rot("vert")],U:["Putar ke atas",rot("up")],D:["Putar ke bawah",rot("down")],N:["Normal",rot("none")]}]}],
      A:["Perataan & Accounting",{T:["Rata atas",al("va","top")],M:["Rata tengah (vertikal)",al("va","mid")],B:["Rata bawah",al("va","bot")],L:["Rata kiri",al("ha","left")],C:["Rata tengah",al("ha","center")],R:["Rata kanan",al("ha","right")],N:["Accounting (Rp)",nf("accounting",0)]}],
      W:["Wrap Text",act("wrap")],
      M:["Merge",{C:["Merge & Center",mg("center")],A:["Merge Across",mg("across")],M:["Merge Cells",mg("merge")],U:["Unmerge Cells",mg("un")]}],
      N:["Format angka…",sel("[data-nf]")],P:["Percentage (%)",nf("percent",0)],K:["Comma Style (pemisah ribuan)",nf("number",2)],
      "0":["Tambah desimal",act("dec+1")],"9":["Kurangi desimal",act("dec-1")],
      L:["Conditional Formatting…",popup("cf-m")],
      U:["AutoSum",{S:["SUM",act("sum")],A:["AVERAGE",fn("AVERAGE")],C:["COUNT",fn("COUNT")],M:["MAX",fn("MAX")],I:["MIN",fn("MIN")],F:["Rumus lain…",popup("fn-m")]}],
      S:["Sort & Filter",{S:["Urutkan A → Z",sort(true)],O:["Urutkan Z → A",sort(false)],F:["Filter on/off",filt]}],
      O:["Format (ukuran & sheet)",{I:["AutoFit lebar kolom",autofitCol],A:["AutoFit tinggi baris",autofitRow],W:["Lebar kolom…",colWidth],H:["Tinggi baris…",rowHeight],D:["Lebar bawaan",defWidth],R:["Ganti nama sheet",sheet("ren")]}],
      I:["Insert",{S:["Sheet baru",sheet("add")]}],
      D:["Delete",{S:["Hapus sheet ini",sheet("del")]}]
    }],
    F:["File",{S:["Simpan",act("simpan")],A:["Simpan sebagai (Download .xlsx)",act("unduh")]}],
    W:["View",{Q:["Zoom…",zoom("q")],J:["Zoom 100%",zoom(100)]}]
  };
  var mode=false,seq=[],armed=false,panel=null,tipT=0;
  function node(){var m=MAP,label="";for(var i=0;i<seq.length;i++){var it=m[seq[i]];if(!it)return null;label=it[0];m=it[1]}return {map:m,label:label}}
  function esc(t){return String(t).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})}
  function show(msg){
    if(!panel){panel=document.createElement("div");panel.className="kt";panel.setAttribute("role","status");host.appendChild(panel)}
    if(panel.parentNode!==host)host.appendChild(panel);
    var n=node();if(!n){exit();return}
    var keys=Object.keys(n.map);keys=keys.filter(function(k){return !/^\d$/.test(k)}).concat(keys.filter(function(k){return /^\d$/.test(k)}));
    panel.innerHTML='<div class="kt-h"><b>Alt</b>'+seq.map(function(k){return " › <b>"+esc(k)+"</b>"}).join("")+(n.label?' <span>'+esc(n.label)+"</span>":"")+'<i>Esc = kembali</i></div><div class="kt-l">'
      +keys.map(function(k){var it=n.map[k];return '<span class="kt-i"><kbd>'+esc(k)+"</kbd>"+esc(it[0])+(typeof it[1]==="object"?" ›":"")+"</span>"}).join("")+"</div>"+(msg?'<div class="kt-m">'+esc(msg)+"</div>":"");
    panel.hidden=false;
  }
  function tip(t){if(!panel)return;clearTimeout(tipT);panel.innerHTML='<div class="kt-h">✓ '+esc(t)+"</div>";panel.hidden=false;tipT=setTimeout(function(){if(!mode&&panel)panel.hidden=true},1400)}
  function enter(first){mode=true;seq=first?[first]:[];if(first&&!MAP[first]){exit();return}show()}
  function exit(){mode=false;seq=[];if(panel)panel.hidden=true}
  function keyOf(e){var c=e.code||"";if(/^Key[A-Z]$/.test(c))return c.slice(3);if(/^Digit\d$/.test(c))return c.slice(5);if(/^Numpad\d$/.test(c))return c.slice(6);return null}
  addEventListener("keydown",function(e){
    if(!on())return;
    var inHost=host.contains(document.activeElement)||document.activeElement===document.body;
    if(!inHost&&!mode)return;
    if(e.key==="Alt"){if(!mode){armed=true;e.preventDefault()}return}
    armed=false;
    var k=keyOf(e);
    if(!mode){if(e.altKey&&!e.ctrlKey&&!e.metaKey&&k&&MAP[k]){e.preventDefault();e.stopPropagation();enter(k)}return}
    if(e.key==="Escape"){e.preventDefault();e.stopPropagation();if(seq.length){seq.pop();show()}else exit();return}
    if(e.key==="Shift"||e.key==="Control"||e.key==="Meta")return;
    e.preventDefault();e.stopPropagation();
    if(!k){exit();return}
    var n=node(),it=n&&n.map[k];
    if(!it){show("Tidak ada shortcut "+seq.concat(k).join("+"));return}
    if(typeof it[1]==="object"){seq.push(k);show();return}
    var label=it[0];exit();try{it[1]()}catch(err){console.error("KeyTips:",err)}
    if(!/…$/.test(label))tip(label);
  },true);
  addEventListener("keyup",function(e){if(!on())return;if(e.key==="Alt"){if(armed&&!mode){e.preventDefault();enter()}else if(mode)e.preventDefault();armed=false}},true);
  document.addEventListener("mousedown",function(e){if(mode&&panel&&!panel.contains(e.target))exit()},true);
  addEventListener("hashchange",exit);addEventListener("blur",function(){armed=false});
})();
