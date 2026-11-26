/* ---------- Info: sisa penyimpanan Supabase ---------- */
(function(){
  var $=function(i){return document.getElementById(i)};
  var ID=function(){return (document.documentElement.lang||"en").slice(0,2)==="id"};
  var T=function(e,i){return ID()?i:e};
  function sz(b){b=+b||0;var u=["B","KB","MB","GB"],k=0;while(b>=1024&&k<3){b/=1024;k++}return (k?b.toFixed(b<10?2:1):b)+" "+u[k]}
  function esc(x){return String(x).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
  var NAMES={dream:["Dreams","Impian"],proj:["Projects","Proyek"],pcost:["Project costs","Biaya proyek"],task:["Tasks","Tugas"],tlog:["Task log","Riwayat tugas"],link:["Links","Tautan"],fin:["Records","Record keuangan"],acct:["Accounts","Account"],asset:["Assets","Aset"],liab:["Liabilities","Liabilities"],liabpay:["Installment payments","Pembayaran cicilan"],sub:["Lead time","Lead time"],note:["Notes","Catatan"],ndraft:["Note drafts","Draft catatan"],file:["Files","Berkas"],folder:["Folders","Folder"],xlbook:["Excel books","Buku Excel"],excelbos:["Excel Bos","Excel Bos"],tabel:["Tables","Tabel"],prefs:["Settings","Pengaturan"],btype:["Expense types","Tipe pengeluaran"],budget:["Budget","Anggaran"],appicon:["App icon","Ikon aplikasi"],basicenglish:["Basic English progress","Progres Basic English"],btypes:["Expense types","Tipe pengeluaran"],ielts:["IELTS progress","Progres IELTS"],menu:["Menu order","Urutan menu"],menulock:["Menu lock","Kunci menu"],pay:["Installment payments","Pembayaran cicilan"],project:["Projects","Proyek"]};
  function nm(k){var n=NAMES[k];return n?T(n[0],n[1]):k}
  function meter(title,used,max,extra){
    var pct=max?Math.min(100,used/max*100):0,left=Math.max(0,max-used),cl=pct>=90?"bad":pct>=75?"warn":"";
    return '<div class="setcard im"><h3>'+title+'</h3>'
      +'<div class="big left">'+sz(left)+' <small>'+T("left","tersisa")+'</small></div>'
      +'<div class="bar ok"><i class="'+cl+'" style="width:'+Math.max(pct,pct>0?1:0).toFixed(1)+'%"></i></div>'
      +'<div class="row3"><div><span>'+T("Used","Terpakai")+'</span><b>'+sz(used)+'</b></div><div><span>'+T("Limit (free plan)","Batas (paket gratis)")+'</span><b>'+sz(max)+'</b></div><div><span>'+T("Used %","Persen terpakai")+'</span><b>'+pct.toFixed(1)+'%</b></div></div>'
      +(extra?'<p class="hint" style="margin:8px 0 0">'+extra+'</p>':'')+'</div>';
  }
  var busy=false,last=null;
  async function load(){
    if(busy)return;busy=true;var m=$("info-meters");
    if(!last)m.innerHTML='<div class="setcard im"><p class="hint">'+T("Checking your Supabase usage…","Memeriksa pemakaian Supabase…")+'</p></div>';
    try{
      if(!window.IMP_USAGE)throw new Error("na");
      var d=await window.IMP_USAGE();last=d;render();
    }catch(e){
      m.innerHTML='<div class="setcard im"><h3>'+T("Could not read usage","Gagal membaca pemakaian")+'</h3><p class="hint">'+T("Check your connection, then press Refresh.","Periksa koneksi lalu tekan Muat ulang.")+'</p><button type="button" class="soft" data-info-ref>'+T("Refresh","Muat ulang")+'</button></div>';
      $("info-break").innerHTML="";$("info-foot").textContent="";
    }finally{busy=false}
  }
  function render(){
    var d=last;if(!d)return;
    $("info-meters").innerHTML=
      meter(T("File storage","Penyimpanan berkas")+' <span class="hint">(Storage)</span>',+d.st_bytes||0,+d.st_max||1073741824,(+d.st_n||0)+' '+T("files: photos, covers, proofs, logos and Archive › Files.","berkas: foto, sampul, bukti bayar, logo, dan Arsip › Berkas."))
      +meter(T("Database","Database")+' <span class="hint">(Postgres)</span>',+d.db_bytes||0,+d.db_max||524288000,T("All notes, numbers and settings. Your own entries take ","Semua catatan, angka, dan pengaturan. Data Anda sendiri memakai ")+sz(d.my_db_bytes)+T("; the rest is Supabase's own system tables.","; sisanya tabel sistem bawaan Supabase."));
    var rows=(d.docs||[]).map(function(x){return '<tr><td>'+esc(nm(x.kind))+'</td><td class="n">'+x.n+'</td><td class="n">'+sz(x.bytes)+'</td></tr>'}).join("");
    $("info-break").innerHTML='<div class="info-act"><h3 class="set-h" style="margin:0">'+T("What is in the database","Isi database")+'</h3><button type="button" class="ghost" data-info-ref>'+T("Refresh","Muat ulang")+'</button></div>'
      +'<table><thead><tr><th>'+T("Type","Jenis")+'</th><th class="n">'+T("Entries","Jumlah")+'</th><th class="n">'+T("Size","Ukuran")+'</th></tr></thead><tbody>'+(rows||'<tr><td colspan="3" class="hint">—</td></tr>')+'</tbody></table>';
    var at=d.at?new Date(d.at):new Date();
    $("info-foot").textContent=T("Checked ","Diperiksa ")+at.toLocaleString(ID()?"id-ID":"en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})+T(". Limits follow the Supabase free plan (1 GB storage, 500 MB database).",". Batas mengikuti paket gratis Supabase (penyimpanan 1 GB, database 500 MB).");
  }
  document.addEventListener("click",function(e){if(e.target.closest("[data-info-ref]"))load()});
  function chk(){if((location.hash||"").slice(1)==="info")load()}
  addEventListener("hashchange",chk);addEventListener("imp-lang",render);
  if(document.readyState!=="loading")setTimeout(chk,300);else addEventListener("DOMContentLoaded",function(){setTimeout(chk,300)});
})();
