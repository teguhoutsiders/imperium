/* ==== Imperium: menu Tabel (Teguh 2026-11-26) ====
   Tabel bebas: semua kolom & baris diisi manual, nama header bisa diubah, rata kiri/tengah/kanan,
   format Normal / Accounting. Bisa banyak tabel. Tersimpan ke akun (dokumen kind "tabel"). */
(function(){
  var host=document.getElementById("tb-host");if(!host)return;
  var lastEdit=null,seen={},books=[],cur=null,sel=null,anchor=null,dirty=false,timer=0,editing=false,lastSig="";
  var LS="imp-tabel-cur";
  function esc(t){return String(t==null?"":t).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  function uid(){return "tbl-"+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
  function blank(name){return {id:uid(),kind:"tabel",name:name||"Tabel 1",cols:[{h:"Kolom 1"},{h:"Kolom 2"},{h:"Kolom 3"},{h:"Kolom 4"}],rows:Array.apply(null,Array(10)).map(function(){return ["","","",""]}),st:{},t:Date.now(),created:Date.now()}}
  /* angka ala Indonesia: "1.500.000", "Rp 25.000", "12,5", "-3.000" */
  function num(v){var t=String(v==null?"":v).replace(/\s/g,"");if(!t)return null;var neg=false;
    if(/^\(.*\)$/.test(t)){neg=true;t=t.slice(1,-1)}
    if(t[0]==="-"||t[0]==="−"){neg=!neg;t=t.slice(1)}t=t.replace(/^rp\.?/i,"");if(t[0]==="-"){neg=!neg;t=t.slice(1)}
    var d=t.lastIndexOf("."),k=t.lastIndexOf(",");
    if(d>=0&&k>=0)t=k>d?t.replace(/\./g,"").replace(",","."):t.replace(/,/g,"");
    else if(k>=0)t=/^\d{1,3}(,\d{3})+$/.test(t)?t.replace(/,/g,""):t.replace(",",".");
    else if(d>=0&&/^\d{1,3}(\.\d{3})+$/.test(t))t=t.replace(/\./g,"");
    if(!/^(\d+\.?\d*|\.\d+)$/.test(t))return null;var n=parseFloat(t);return neg?-n:n}
  function acc(v){var n=num(v);if(n==null)return String(v||"");var a=Math.abs(n),dec=Math.round(a*100)%100?2:0;
    var s=a.toLocaleString("id-ID",{minimumFractionDigits:dec,maximumFractionDigits:2});return (n<0?"−Rp ":"Rp ")+s}
  function stOf(r,c){return (cur.st&&cur.st[r+","+c])||{}}
  var DW=150,DH=36;
  function cw(c){return (cur.cw&&+cur.cw[c])||DW}
  function rh(r){return (cur.rh&&+cur.rh[r])||0}
  function tblW(){var w=44;for(var i=0;i<cur.cols.length;i++)w+=cw(i);return w}
  function custW(){return cur.cw&&Object.keys(cur.cw).length>0}
  function tblStyle(){return custW()?"width:"+tblW()+"px":"width:max(100%,"+tblW()+"px)"}
  /* border: disimpan sebagai garis bawah/kanan tiap sel (atas/kiri hanya untuk baris/kolom pertama) supaya garis tidak dobel */
  function bdStyle(st){var o="";if(st.bb)o+="border-bottom:"+st.bb+";";if(st.br)o+="border-right:"+st.br+";";if(st.bt)o+="border-top:"+st.bt+";";if(st.bl)o+="border-left:"+st.bl+";";return o}
  /* tulisan otomatis gelap di atas warna isi yang terang (seperti Excel), kalau warna tulisan tidak diatur sendiri */
  function autoFc(bg){var m=/^#?([0-9a-f]{6})$/i.exec(String(bg||""));if(!m)return "";var n=parseInt(m[1],16),l=(0.299*(n>>16)+0.587*(n>>8&255)+0.114*(n&255))/255;return l>0.6?"#000000":""}
  var CL={bg:"#FFF2CC",fc:"#C00000"};try{Object.assign(CL,JSON.parse(localStorage.getItem("imp-tabel-cl")||"{}"))}catch(_){}
  var BD={w:"1px",s:"solid",c:"#1f2937"};try{Object.assign(BD,JSON.parse(localStorage.getItem("imp-tabel-bd")||"{}"))}catch(_){}
  function bdVal(thick){return (thick?Math.max(2,parseInt(BD.w,10)+1)+"px":BD.w)+" "+BD.s+" "+BD.c}
  function shown(r,c,v){var f=stOf(r,c).f;return f==="acc"&&v!==""?acc(v):v}
  function rect(){if(!sel)return null;return {r1:Math.min(sel.r1,sel.r2),r2:Math.max(sel.r1,sel.r2),c1:Math.min(sel.c1,sel.c2),c2:Math.max(sel.c1,sel.c2)}}
  function T(en,id){return document.documentElement.lang==="id"?id:en}

  function save(){dirty=true;cur.t=Date.now();clearTimeout(timer);timer=setTimeout(flush,600);status(T("Saving…","Menyimpan…"))}
  function flush(){clearTimeout(timer);if(!dirty||!cur)return;dirty=false;var d=JSON.parse(JSON.stringify(cur));var id=d.id;delete d.id;
    if(window.IMP_DOC_SAVE)window.IMP_DOC_SAVE(id,d).then(function(ok){status(ok?T("Saved","Tersimpan"):T("Not saved, will retry","Belum tersimpan, dicoba lagi"))});}
  function status(t){var e=host.querySelector(".tb-st");if(e)e.textContent=t}

  function toolbar(){
    var opts=books.map(function(b){return '<option value="'+esc(b.id)+'"'+(cur&&b.id===cur.id?" selected":"")+">"+esc(b.name)+"</option>"}).join("");
    function bt(a,html,title){return '<button type="button" data-ta="'+a+'" title="'+esc(title)+'" aria-label="'+esc(title)+'">'+html+"</button>"}
    function ik(d){return '<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="'+d+'"/></svg>'}
    return '<div class="tb-bar">'
      +'<div class="tb-g"><select class="tb-pick" data-tpick aria-label="'+T("Choose table","Pilih tabel")+'">'+opts+'</select>'
      +bt("new","+ "+T("New table","Tabel baru"),T("New table","Tabel baru"))+bt("ren","✎",T("Rename table","Ganti nama tabel"))+bt("del","🗑",T("Delete table","Hapus tabel"))+"</div>"
      +'<div class="tb-g">'+bt("al-left",ik("M2 3h12M2 6.5h8M2 10h12M2 13.5h8"),T("Align left","Rata kiri"))+bt("al-center",ik("M2 3h12M4 6.5h8M2 10h12M4 13.5h8"),T("Center","Rata tengah"))+bt("al-right",ik("M2 3h12M6 6.5h8M2 10h12M6 13.5h8"),T("Align right","Rata kanan"))+"</div>"
      +'<div class="tb-g tb-clrg"><label class="tb-clr" title="'+T("Fill color","Warna isi sel")+'"><span class="tb-clr-i">🪣</span><i class="tb-sw" style="background:'+esc(CL.bg)+'"></i><input type="color" data-fill value="'+esc(CL.bg)+'" aria-label="'+T("Fill color","Warna isi sel")+'"></label>'
      +bt("fill",T("Fill","Isi"),T("Apply fill color","Pakai warna isi"))
      +'<label class="tb-clr" title="'+T("Text color","Warna tulisan")+'"><span class="tb-clr-i"><b>A</b></span><i class="tb-sw" style="background:'+esc(CL.fc)+'"></i><input type="color" data-fcol value="'+esc(CL.fc)+'" aria-label="'+T("Text color","Warna tulisan")+'"></label>'
      +bt("fcol",T("Text","Tulisan"),T("Apply text color","Pakai warna tulisan"))+bt("clr-x","⨯",T("Remove colors","Hapus warna"))+"</div>"
      +'<div class="tb-g">'+bt("f-normal",T("Normal","Normal"),T("Normal format","Format normal"))+bt("f-acc","Rp "+T("Accounting","Accounting"),T("Accounting (Rupiah)","Accounting (Rupiah)"))+"</div>"
      +'<div class="tb-g tb-bdg">'+bt("bd-all",ik("M2 2h12v12H2zM2 8h12M8 2v12"),T("All borders","Semua garis"))+bt("bd-m","▦ "+T("Borders","Border")+" ▾",T("Border options","Pilihan border"))+'<div class="tb-pop" data-pop hidden></div></div>'
      +'<div class="tb-g"><label class="tb-sz" title="'+T("Width of selected columns (px)","Lebar kolom terpilih (px)")+'">↔<input type="number" min="40" max="800" step="10" data-szw placeholder="'+DW+'"></label><label class="tb-sz" title="'+T("Height of selected rows (px)","Tinggi baris terpilih (px)")+'">↕<input type="number" min="24" max="400" step="4" data-szh placeholder="'+DH+'"></label>'+bt("sz-reset","↺",T("Reset size of selected columns/rows","Kembalikan ukuran kolom/baris terpilih"))+"</div>"
      +'<div class="tb-g">'+bt("row+","+ "+T("Row","Baris"),T("Add row below","Tambah baris di bawah"))+bt("col+","+ "+T("Column","Kolom"),T("Add column to the right","Tambah kolom di kanan"))
      +bt("row-","− "+T("Row","Baris"),T("Delete selected rows","Hapus baris terpilih"))+bt("col-","− "+T("Column","Kolom"),T("Delete selected columns","Hapus kolom terpilih"))+"</div>"
      +'<span class="tb-st" role="status"></span></div>';
  }
  function grid(){
    var c=cur.cols,h='<div class="tb-wrap"><table class="tb-t" style="'+tblStyle()+'"><colgroup><col class="tb-nc">'+c.map(function(_,ci){return '<col data-cw="'+ci+'" style="width:'+cw(ci)+'px">'}).join("")+"</colgroup><thead><tr>"
      +'<th class="tb-corner" data-all title="'+T("Select all","Pilih semua")+'"></th>'
      +c.map(function(col,ci){var al=col.al||"left";return '<th data-ch="'+ci+'"'+(col.bg?' style="background:'+esc(col.bg)+'"':"")+'><input class="tb-h" data-hc="'+ci+'" value="'+esc(col.h)+'" style="text-align:'+al+((col.fc||autoFc(col.bg))?";color:"+esc(col.fc||autoFc(col.bg)):"")+'" aria-label="'+T("Header","Header")+" "+(ci+1)+'"><span class="tb-cr" data-cr="'+ci+'" title="'+T("Drag to resize · double-click to reset","Seret untuk ubah lebar · klik dua kali untuk kembali")+'"></span></th>'}).join("")
      +"</tr></thead><tbody>";
    cur.rows.forEach(function(row,ri){
      h+='<tr data-tr="'+ri+'"'+(rh(ri)?' style="height:'+rh(ri)+'px"':"")+'><th class="tb-rn" data-rh="'+ri+'">'+(ri+1)+'<span class="tb-rr" data-rr="'+ri+'" title="'+T("Drag to resize · double-click to reset","Seret untuk ubah tinggi · klik dua kali untuk kembali")+'"></span></th>';
      for(var ci=0;ci<c.length;ci++){var v=row[ci]==null?"":row[ci],st=stOf(ri,ci),al=st.al||(st.f==="acc"?"right":"left"),neg=st.f==="acc"&&(num(v)||0)<0;
        var tdS=bdStyle(st)+(st.bg?"background:"+st.bg+";":"");
        h+='<td data-r="'+ri+'" data-c="'+ci+'"'+(tdS?' style="'+tdS+'"':"")+'><input class="tb-in'+(st.f==="acc"?" acc":"")+(neg?" neg":"")+'" data-r="'+ri+'" data-c="'+ci+'" value="'+esc(shown(ri,ci,v))+'" style="text-align:'+al+(!neg&&(st.fc||autoFc(st.bg))?";color:"+(st.fc||autoFc(st.bg)):"")+'" aria-label="'+esc((c[ci].h||"")+" "+(ri+1))+'"></td>'}
      h+="</tr>";
    });
    return h+"</tbody></table></div>";
  }
  function render(){
    if(!cur){host.innerHTML='<div class="empty">'+T("Loading…","Memuat…")+"</div>";return}
    var a=document.activeElement,keep=a&&host.contains(a)&&a.dataset?{r:a.dataset.r,c:a.dataset.c,hc:a.dataset.hc}:null;
    host.innerHTML=toolbar()+grid()+'<p class="hint tb-hint">'+T("Click a cell to type. Enter = down, Tab = right, arrows move. Shift+click or drag to select several cells, then use the buttons above. Click a column header area or row number to select it.","Klik sel untuk mengetik. Enter = turun, Tab = kanan, panah untuk pindah. Shift+klik atau seret untuk memilih beberapa sel, lalu pakai tombol di atas. Klik nomor baris atau tepi header untuk memilih baris/kolom.")+"</p>";
    paint();
    if(keep){var q=keep.hc!=null?'[data-hc="'+keep.hc+'"]':'input.tb-in[data-r="'+keep.r+'"][data-c="'+keep.c+'"]',x=host.querySelector(q);if(x){x.focus({preventScroll:true})}}
  }
  function paint(){var R=rect();host.querySelectorAll("td[data-r]").forEach(function(td){var r=+td.dataset.r,c=+td.dataset.c;td.classList.toggle("on",!!R&&r>=R.r1&&r<=R.r2&&c>=R.c1&&c<=R.c2);td.classList.toggle("cur",!!sel&&r===sel.r2&&c===sel.c2)});
    if(R){var st0=stOf(R.r1,R.c1),al0=st0.al||(st0.f==="acc"?"right":"left"),f0=st0.f==="acc"?"acc":"normal";
      ["left","center","right"].forEach(function(k){var b=host.querySelector('[data-ta="al-'+k+'"]');if(b)b.classList.toggle("on",al0===k)});
      ["normal","acc"].forEach(function(k){var b=host.querySelector('[data-ta="f-'+k+'"]');if(b)b.classList.toggle("on",f0===k)})}
    host.querySelectorAll("th[data-ch]").forEach(function(th){var c=+th.dataset.ch;th.classList.toggle("on",!!R&&c>=R.c1&&c<=R.c2)});
    host.querySelectorAll("th[data-rh]").forEach(function(th){var r=+th.dataset.rh;th.classList.toggle("on",!!R&&r>=R.r1&&r<=R.r2)});szFill()}
  function cellInput(r,c){return host.querySelector('input.tb-in[data-r="'+r+'"][data-c="'+c+'"]')}
  function go(r,c,ext){r=Math.max(0,Math.min(cur.rows.length-1,r));c=Math.max(0,Math.min(cur.cols.length-1,c));
    if(ext&&sel){sel.r2=r;sel.c2=c}else sel={r1:r,c1:c,r2:r,c2:c};var x=cellInput(r,c);if(x){x.focus();try{x.select()}catch(_){}}paint()}
  function target(){var R=rect();if(!R)return null;
    if(R.r1===R.r2&&R.c1===R.c2&&lastEdit&&Date.now()-lastEdit.t<60000&&(lastEdit.r!==R.r1||lastEdit.c!==R.c1)&&!(cur.rows[R.r1]&&cur.rows[R.r1][R.c1])&&cur.rows[lastEdit.r]&&cur.rows[lastEdit.r][lastEdit.c]){
      sel={r1:lastEdit.r,c1:lastEdit.c,r2:lastEdit.r,c2:lastEdit.c};return rect()}
    return R}
  function apply(fn){var R=target();if(!R)return;cur.st=cur.st||{};for(var r=R.r1;r<=R.r2;r++)for(var c=R.c1;c<=R.c2;c++){var k=r+","+c,o=Object.assign({},cur.st[k]||{});fn(o);
      if(o.al==="left"&&o.f!=="acc")delete o.al;if(o.f==="normal")delete o.f;if(Object.keys(o).length)cur.st[k]=o;else delete cur.st[k]}save();render()}
  function shiftSt(fn){var n={};Object.keys(cur.st||{}).forEach(function(k){var p=k.split(","),nk=fn(+p[0],+p[1]);if(nk)n[nk[0]+","+nk[1]]=cur.st[k]});cur.st=n;
    ["rh","cw"].forEach(function(key){if(!cur[key])return;var m={};Object.keys(cur[key]).forEach(function(i){var nk=key==="rh"?fn(+i,0):fn(0,+i);if(nk)m[key==="rh"?nk[0]:nk[1]]=cur[key][i]});cur[key]=m})}
  function act(a,btn){
    var R=rect();
    if(a==="new"){flush();var b=blank(T("Table ","Tabel ")+(books.length+1));books.push(b);cur=b;sel=null;try{localStorage.setItem(LS,b.id)}catch(_){}save();render();return}
    if(a==="ren"){var n=prompt(T("Table name","Nama tabel"),cur.name);if(n&&n.trim()){cur.name=n.trim().slice(0,60);save();render()}return}
    if(a==="del"){if(btn.dataset.arm!=="1"){btn.dataset.arm="1";btn.textContent=T("Delete?","Hapus?");btn.classList.add("arm");setTimeout(function(){if(btn.isConnected){btn.dataset.arm="";btn.textContent="🗑";btn.classList.remove("arm")}},2500);return}
      var id=cur.id;books=books.filter(function(b){return b.id!==id});clearTimeout(timer);dirty=false;if(window.IMP_DOC_DEL)window.IMP_DOC_DEL(id);
      if(!books.length){books=[blank()];cur=books[0];save()}else cur=books[0];sel=null;render();return}
    if(/^al-/.test(a)||a==="f-acc"||a==="f-normal")R=target();
    if(/^al-/.test(a)){var al=a.slice(3);if(!R){status(T("Select cells first","Pilih sel dulu"));return}apply(function(o){o.al=al});
      if(R.r1===0&&R.r2===cur.rows.length-1){for(var c=R.c1;c<=R.c2;c++)cur.cols[c].al=al;save();render()}return}
    if(a==="f-acc"||a==="f-normal"){if(!R){status(T("Select cells first","Pilih sel dulu"));return}var f=a==="f-acc"?"acc":"normal";
      apply(function(o){o.f=f;if(f==="acc"&&!o.al)o.al="right";if(f==="normal"&&o.al==="right")delete o.al});return}
    if(a==="fill"||a==="fcol"||a==="clr-x"){R=target();if(!R){status(T("Select cells first","Pilih sel dulu"));return}
      var fullCol=R.r1===0&&R.r2===cur.rows.length-1;
      apply(function(o){if(a==="fill")o.bg=CL.bg;else if(a==="fcol")o.fc=CL.fc;else{delete o.bg;delete o.fc}});
      if(fullCol){for(var cc=R.c1;cc<=R.c2;cc++){var col=cur.cols[cc];if(a==="fill")col.bg=CL.bg;else if(a==="fcol")col.fc=CL.fc;else{delete col.bg;delete col.fc}}save();render()}return}
    if(a==="bd-m"){var pop=host.querySelector("[data-pop]");if(!pop.hidden){pop.hidden=true;return}bdPop(pop);pop.hidden=false;return}
    if(/^bd-/.test(a)){if(!R){status(T("Select cells first","Pilih sel dulu"));return}border(a.slice(3),R);var p2=host.querySelector("[data-pop]");if(p2)p2.hidden=true;return}
    if(a==="sz-reset"){if(!R){status(T("Select columns or rows first","Pilih kolom atau baris dulu"));return}var full=R.r1===0&&R.r2===cur.rows.length-1,fullC=R.c1===0&&R.c2===cur.cols.length-1;
      if(full||!fullC)for(var c3=R.c1;c3<=R.c2;c3++)if(cur.cw)delete cur.cw[c3];if(fullC||!full)for(var r3=R.r1;r3<=R.r2;r3++)if(cur.rh)delete cur.rh[r3];save();render();return}
    if(a==="row+"){var at=R?R.r2+1:cur.rows.length;cur.rows.splice(at,0,cur.cols.map(function(){return ""}));shiftSt(function(r,c){return [r>=at?r+1:r,c]});sel={r1:at,c1:R?R.c1:0,r2:at,c2:R?R.c1:0};save();render();go(at,R?R.c1:0);return}
    if(a==="col+"){var ac=R?R.c2+1:cur.cols.length;cur.cols.splice(ac,0,{h:T("Column ","Kolom ")+(cur.cols.length+1)});cur.rows.forEach(function(row){while(row.length<cur.cols.length-1)row.push("");row.splice(ac,0,"")});
      shiftSt(function(r,c){return [r,c>=ac?c+1:c]});save();render();var hi=host.querySelector('[data-hc="'+ac+'"]');if(hi){hi.focus();hi.select()}return}
    if(a==="row-"){if(!R){status(T("Select rows first","Pilih baris dulu"));return}if(cur.rows.length-(R.r2-R.r1+1)<1){status(T("A table needs at least 1 row","Tabel minimal 1 baris"));return}
      var nr=R.r2-R.r1+1;cur.rows.splice(R.r1,nr);shiftSt(function(r,c){return r<R.r1?[r,c]:r>R.r2?[r-nr,c]:null});sel=null;save();render();return}
    if(a==="col-"){if(!R){status(T("Select columns first","Pilih kolom dulu"));return}if(cur.cols.length-(R.c2-R.c1+1)<1){status(T("A table needs at least 1 column","Tabel minimal 1 kolom"));return}
      var nc=R.c2-R.c1+1;cur.cols.splice(R.c1,nc);cur.rows.forEach(function(row){row.splice(R.c1,nc)});shiftSt(function(r,c){return c<R.c1?[r,c]:c>R.c2?[r,c-nc]:null});sel=null;save();render();return}
  }
  function setB(r,c,side,v){cur.st=cur.st||{};var k,f;
    if(side==="t"){if(r>0){k=(r-1)+","+c;f="bb"}else{k=r+","+c;f="bt"}}
    else if(side==="l"){if(c>0){k=r+","+(c-1);f="br"}else{k=r+","+c;f="bl"}}
    else if(side==="b"){k=r+","+c;f="bb"}else{k=r+","+c;f="br"}
    var o=Object.assign({},cur.st[k]||{});if(v==null)delete o[f];else o[f]=v;if(Object.keys(o).length)cur.st[k]=o;else delete cur.st[k]}
  function border(kind,R){var v=bdVal(false),th=bdVal(true),r,c;
    function edge(side,val){if(side==="t")for(c=R.c1;c<=R.c2;c++)setB(R.r1,c,"t",val);if(side==="b")for(c=R.c1;c<=R.c2;c++)setB(R.r2,c,"b",val);
      if(side==="l")for(r=R.r1;r<=R.r2;r++)setB(r,R.c1,"l",val);if(side==="r")for(r=R.r1;r<=R.r2;r++)setB(r,R.c2,"r",val)}
    function inner(val){for(r=R.r1;r<=R.r2;r++)for(c=R.c1;c<=R.c2;c++){if(r<R.r2)setB(r,c,"b",val);if(c<R.c2)setB(r,c,"r",val)}}
    if(kind==="all"){inner(v);["t","b","l","r"].forEach(function(s){edge(s,v)})}
    else if(kind==="out"){["t","b","l","r"].forEach(function(s){edge(s,v)})}
    else if(kind==="thick"){["t","b","l","r"].forEach(function(s){edge(s,th)})}
    else if(kind==="inner"){inner(v)}
    else if(kind==="none"){inner("1px solid transparent");["t","b","l","r"].forEach(function(s){edge(s,"1px solid transparent")})}
    else if(kind==="clear"){inner(null);["t","b","l","r"].forEach(function(s){edge(s,null)})}
    else if(kind==="bot2"){edge("b",BD.w+" double "+BD.c)}
    else edge(kind,v);
    save();render()}
  function bdPop(pop){
    function it(k,ic,t){return '<button type="button" class="tb-pi" data-ta="bd-'+k+'"><span class="tb-pic">'+ic+"</span>"+t+"</button>"}
    pop.innerHTML='<div class="tb-pj">'+T("Borders","Border")+"</div>"
      +it("all","▦",T("All borders","Semua garis"))+it("out","□",T("Outside borders","Garis luar"))+it("thick","▣",T("Thick outside borders","Garis luar tebal"))+it("inner","╋",T("Inside borders","Garis dalam"))
      +it("t","▔",T("Top border","Garis atas"))+it("b","▁",T("Bottom border","Garis bawah"))+it("l","▏",T("Left border","Garis kiri"))+it("r","▕",T("Right border","Garis kanan"))+it("bot2","═",T("Double bottom border","Garis bawah ganda"))
      +it("none","⬚",T("No borders (hide grid)","Tanpa garis (sembunyikan grid)"))+it("clear","↺",T("Back to default","Kembali ke bawaan"))
      +'<hr><div class="tb-pj">'+T("Line","Garis")+'</div><div class="tb-prow"><label>'+T("Color","Warna")+'<input type="color" data-bdc value="'+esc(BD.c)+'"></label>'
      +'<label>'+T("Thickness","Tebal")+'<select data-bdw>'+["1px","2px","3px","4px"].map(function(w){return '<option'+(BD.w===w?" selected":"")+">"+w+"</option>"}).join("")+"</select></label>"
      +'<label>'+T("Style","Jenis")+'<select data-bds>'+[["solid",T("Solid","Garis")],["dashed",T("Dashed","Putus-putus")],["dotted",T("Dotted","Titik-titik")],["double",T("Double","Ganda")]].map(function(x){return '<option value="'+x[0]+'"'+(BD.s===x[0]?" selected":"")+">"+x[1]+"</option>"}).join("")+"</select></label></div>"
      +'<div class="tb-pprev"><span style="border-bottom:'+esc(bdVal(false))+'"></span></div>';
  }
  host.addEventListener("input",function(e){var x=e.target;if(x.matches("[data-bdc],[data-bdw],[data-bds]")){BD.c=(host.querySelector("[data-bdc]")||{}).value||BD.c;BD.w=(host.querySelector("[data-bdw]")||{}).value||BD.w;BD.s=(host.querySelector("[data-bds]")||{}).value||BD.s;
    try{localStorage.setItem("imp-tabel-bd",JSON.stringify(BD))}catch(_){}var pv=host.querySelector(".tb-pprev span");if(pv)pv.style.borderBottom=bdVal(false)}},true);
  document.addEventListener("mousedown",function(e){var pop=host.querySelector("[data-pop]");if(pop&&!pop.hidden&&!pop.contains(e.target)&&!e.target.closest('[data-ta="bd-m"]'))pop.hidden=true},true);
  host.addEventListener("input",function(e){var x=e.target;if(x.matches("[data-fill],[data-fcol]")){var sw=x.parentNode.querySelector(".tb-sw");if(sw)sw.style.background=x.value}},true);
  host.addEventListener("change",function(e){var x=e.target;if(!x.matches("[data-fill],[data-fcol]"))return;
    if(x.matches("[data-fill]"))CL.bg=x.value;else CL.fc=x.value;try{localStorage.setItem("imp-tabel-cl",JSON.stringify(CL))}catch(_){}
    act(x.matches("[data-fill]")?"fill":"fcol")});
  /* ukuran dari kotak angka di toolbar: berlaku untuk kolom/baris yang dipilih */
  host.addEventListener("change",function(e){var x=e.target;
    if(x.matches("[data-szw]")){var R=rect(),v=Math.max(40,Math.min(800,+x.value||0));if(!R||!v){status(T("Select columns first","Pilih kolom dulu"));return}cur.cw=cur.cw||{};for(var c=R.c1;c<=R.c2;c++)cur.cw[c]=v;save();render()}
    if(x.matches("[data-szh]")){var R2=rect(),h=Math.max(24,Math.min(400,+x.value||0));if(!R2||!h){status(T("Select rows first","Pilih baris dulu"));return}cur.rh=cur.rh||{};for(var r=R2.r1;r<=R2.r2;r++)cur.rh[r]=h;save();render()}});
  function szFill(){var R=rect(),w=host.querySelector("[data-szw]"),h=host.querySelector("[data-szh]");if(!w||!h)return;
    if(document.activeElement!==w)w.value=R?String(cw(R.c1)):"";if(document.activeElement!==h)h.value=R?String(rh(R.r1)||DH):""}
  /* seret tepi header untuk ubah lebar kolom / tinggi baris (mouse & sentuh) */
  var rz=null;
  host.addEventListener("pointerdown",function(e){var cr=e.target.closest("[data-cr]"),rr=e.target.closest("[data-rr]");if(!cr&&!rr)return;e.preventDefault();e.stopPropagation();
    if(cr){var ci=+cr.dataset.cr;rz={k:"c",i:ci,x0:e.clientX,v0:cw(ci),col:host.querySelector('col[data-cw="'+ci+'"]'),tbl:host.querySelector(".tb-t")}}
    else{var ri=+rr.dataset.rr,tr=host.querySelector('tr[data-tr="'+ri+'"]');rz={k:"r",i:ri,y0:e.clientY,v0:rh(ri)||tr.getBoundingClientRect().height,tr:tr}}
    try{e.target.setPointerCapture(e.pointerId)}catch(_){}document.documentElement.classList.add(rz.k==="c"?"tb-rzc":"tb-rzr")},true);
  host.addEventListener("pointermove",function(e){if(!rz)return;
    if(rz.k==="c"){var w=Math.round(Math.max(40,Math.min(800,rz.v0+e.clientX-rz.x0)));rz.v=w;rz.col.style.width=w+"px";cur.cw=cur.cw||{};cur.cw[rz.i]=w;rz.tbl.style.cssText=tblStyle()}
    else{var h=Math.round(Math.max(24,Math.min(400,rz.v0+e.clientY-rz.y0)));rz.v=h;rz.tr.style.height=h+"px";cur.rh=cur.rh||{};cur.rh[rz.i]=h}});
  function endRz(){if(!rz)return;document.documentElement.classList.remove("tb-rzc","tb-rzr");var moved=rz.v!=null;rz=null;if(moved){save();szFill()}}
  host.addEventListener("pointerup",endRz);host.addEventListener("pointercancel",endRz);
  host.addEventListener("dblclick",function(e){var cr=e.target.closest("[data-cr]"),rr=e.target.closest("[data-rr]");
    if(cr){if(cur.cw)delete cur.cw[+cr.dataset.cr];save();render()}else if(rr){if(cur.rh)delete cur.rh[+rr.dataset.rr];save();render()}});
  /* ---------- event ---------- */
  var drag=null;
  host.addEventListener("click",function(e){var b=e.target.closest("[data-ta]");if(b){act(b.dataset.ta,b);return}
    if(e.target.closest("[data-all]")){sel={r1:0,c1:0,r2:cur.rows.length-1,c2:cur.cols.length-1};paint();return}
    if(e.target.closest("[data-cr],[data-rr]"))return;
    var rh=e.target.closest("[data-rh]");if(rh){var r=+rh.dataset.rh;if(e.shiftKey&&sel){sel.r2=r;sel.c1=0;sel.c2=cur.cols.length-1}else sel={r1:r,r2:r,c1:0,c2:cur.cols.length-1};paint();return}
    var ch=e.target.closest("th[data-ch]");if(ch&&e.target===ch){var c=+ch.dataset.ch;if(e.shiftKey&&sel){sel.c2=c;sel.r1=0;sel.r2=cur.rows.length-1}else sel={r1:0,r2:cur.rows.length-1,c1:c,c2:c};paint()}});
  host.addEventListener("change",function(e){if(e.target.matches("[data-tpick]")){flush();var id=e.target.value;cur=books.find(function(b){return b.id===id})||cur;sel=null;try{localStorage.setItem(LS,cur.id)}catch(_){}render()}});
  host.addEventListener("mousedown",function(e){var td=e.target.closest("td[data-r]");if(!td)return;var r=+td.dataset.r,c=+td.dataset.c;
    if(e.shiftKey&&sel){e.preventDefault();sel.r2=r;sel.c2=c;paint();return}sel={r1:r,c1:c,r2:r,c2:c};drag=true;paint()});
  host.addEventListener("mouseover",function(e){if(!drag)return;var td=e.target.closest("td[data-r]");if(!td)return;sel.r2=+td.dataset.r;sel.c2=+td.dataset.c;if(sel.r1!==sel.r2||sel.c1!==sel.c2){var a=document.activeElement;if(a&&a.blur&&host.contains(a))a.blur()}paint()});
  document.addEventListener("mouseup",function(){drag=null});
  host.addEventListener("focusin",function(e){var x=e.target;editing=true;
    if(x.classList.contains("tb-h")){var hc=+x.dataset.hc;sel={r1:0,r2:cur.rows.length-1,c1:hc,c2:hc};lastEdit=null;paint();return}
    if(x.classList.contains("tb-in")){var r=+x.dataset.r,c=+x.dataset.c,v=cur.rows[r][c]||"";if(x.value!==v)x.value=v;
      if(!sel||drag||(sel.r1===sel.r2&&sel.c1===sel.c2)){if(!(sel&&sel.r1!==sel.r2||sel&&sel.c1!==sel.c2))sel={r1:r,c1:c,r2:r,c2:c}}paint()}});
  host.addEventListener("focusout",function(e){var x=e.target;editing=false;
    if(x.classList.contains("tb-in")){var r=+x.dataset.r,c=+x.dataset.c,v=cur.rows[r]?cur.rows[r][c]||"":"";if(stOf(r,c).f==="acc"){x.value=shown(r,c,v);x.classList.toggle("neg",(num(v)||0)<0)}}
    if(x.classList.contains("tb-h")){var ci=+x.dataset.hc,nv=x.value.trim()||T("Column ","Kolom ")+(ci+1);if(x.value!==nv)x.value=nv;if(cur.cols[ci]&&cur.cols[ci].h!==nv){cur.cols[ci].h=nv;save()}}
    setTimeout(function(){if(!host.contains(document.activeElement))flush()},0)});
  host.addEventListener("input",function(e){var x=e.target;
    if(x.classList.contains("tb-in")){var r=+x.dataset.r,c=+x.dataset.c;cur.rows[r][c]=x.value;lastEdit={r:r,c:c,t:Date.now()};save()}
    else if(x.classList.contains("tb-h")){var ci=+x.dataset.hc;cur.cols[ci].h=x.value;save()}});
  host.addEventListener("keydown",function(e){var x=e.target;
    if(x.classList.contains("tb-h")){if(e.key==="Enter"||e.key==="ArrowDown"){e.preventDefault();go(0,+x.dataset.hc)}return}
    if(!x.classList.contains("tb-in"))return;var r=+x.dataset.r,c=+x.dataset.c,len=x.value.length,pos=x.selectionStart,all=x.selectionStart===0&&x.selectionEnd===len;
    if(e.key==="Enter"){e.preventDefault();if(r===cur.rows.length-1&&!e.shiftKey){cur.rows.push(cur.cols.map(function(){return ""}));save();render()}go(r+(e.shiftKey?-1:1),c);return}
    if(e.key==="Tab"){e.preventDefault();if(e.shiftKey)go(c>0?r:r-1,c>0?c-1:cur.cols.length-1);else go(c<cur.cols.length-1?r:r+1,c<cur.cols.length-1?c+1:0);return}
    if(e.key==="ArrowDown"){e.preventDefault();go(r+1,c,e.shiftKey);return}
    if(e.key==="ArrowUp"){e.preventDefault();if(r===0&&!e.shiftKey){var h=host.querySelector('[data-hc="'+c+'"]');if(h){h.focus();h.select()}return}go(r-1,c,e.shiftKey);return}
    if(e.key==="ArrowRight"&&(all||pos===len||e.shiftKey)){e.preventDefault();go(r,c+1,e.shiftKey);return}
    if(e.key==="ArrowLeft"&&(all||pos===0||e.shiftKey)){e.preventDefault();go(r,c-1,e.shiftKey);return}
    if((e.key==="Delete"||e.key==="Backspace")&&sel&&(sel.r1!==sel.r2||sel.c1!==sel.c2)){e.preventDefault();var R=rect();for(var i=R.r1;i<=R.r2;i++)for(var j=R.c1;j<=R.c2;j++)cur.rows[i][j]="";save();render();return}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="e"){e.preventDefault();act("al-center");return}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="l"){e.preventDefault();act("al-left");return}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="r"){e.preventDefault();act("al-right");return}
  });
  /* tempel dari Excel/Sheets: teks bertab jadi banyak sel */
  host.addEventListener("paste",function(e){var x=e.target;if(!x.classList||!x.classList.contains("tb-in"))return;var t=(e.clipboardData||window.clipboardData).getData("text");if(!/[\t\n]/.test(t))return;e.preventDefault();
    var r0=+x.dataset.r,c0=+x.dataset.c,lines=t.replace(/\r/g,"").replace(/\n$/,"").split("\n");
    lines.forEach(function(l,i){var r=r0+i;while(cur.rows.length<=r)cur.rows.push(cur.cols.map(function(){return ""}));l.split("\t").forEach(function(v,j){var c=c0+j;if(c<cur.cols.length)cur.rows[r][c]=v})});
    save();render();go(r0,c0)});
  /* ---------- sinkron ---------- */
  function sig(list){return list.map(function(d){return d.id+":"+(d.t||0)}).sort().join("|")}
  window.IMP_TBL_SYNC=function(list){
    var s=sig(list);if(s===lastSig)return;lastSig=s;
    var remote=list.map(function(d){return JSON.parse(JSON.stringify(d))});
    remote.forEach(function(d){var l=books.find(function(b){return b.id===d.id});if(!l){books.push(d);return}if((+d.t||0)>(+l.t||0)&&!(cur&&cur.id===d.id&&(dirty||editing)))Object.keys(l).forEach(function(k){delete l[k]}),Object.assign(l,d)});
    /* buang hanya tabel yang pernah ada di akun lalu dihapus dari perangkat lain; tabel baru yang belum sampai ke server tetap */
    books=books.filter(function(b){var inR=remote.some(function(d){return d.id===b.id});if(inR){seen[b.id]=1;return true}return !seen[b.id]});
    books.sort(function(a,b){return (a.created||0)-(b.created||0)});
    pickCur();if(!editing&&(location.hash||"")==="#tabel")render();
  };
  function pickCur(){var want=null;try{want=localStorage.getItem(LS)}catch(_){}
    cur=books.find(function(b){return cur&&b.id===cur.id})||books.find(function(b){return b.id===want})||books[0]||null;
    if(!cur){cur=blank();books=[cur]}}
  addEventListener("hashchange",function(){if((location.hash||"")==="#tabel"){if(!cur)pickCur();render()}else flush()});
  addEventListener("beforeunload",flush);
  if((location.hash||"")==="#tabel"){setTimeout(function(){if(!cur)pickCur();render()},0)}
})();
