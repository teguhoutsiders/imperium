/* ==== Basic English (dari File Bos > English). Materi: basic-english*.js, soal*.js, english-cepat.js ==== */
/* File Bos (Teguh 2026-11-16): catatan pribadi Bos di menu sidebar kantor. Planner (Task, Stopwatch, Kalender),
   Finance (Aset & Utang, Renewal), Library (Catatan). Data awal dari data-bos.js (impor Imperium Center);
   perubahan Bos disimpan di browser, "Simpan permanen" mengirim [simpan file bos] ke Nyenyo untuk ditulis ke data-bos.js.
   Nyenyo dan staf tidak boleh mengubah isi data tanpa izin Bos. */
(function () {
  var KUNCI = "fileBos", KUNCI_SW = "fileBosStopwatch";
  function salin(o) { return JSON.parse(JSON.stringify(o)); }
  function muat() { try { var s = localStorage.getItem(KUNCI); if (s) return JSON.parse(s); } catch (x) {} return salin(window.FILE_BOS || {}); }
  var D = muat();
  /* data baru dari impor (bukti bayar, proyek, files 2026-11-16) ikut masuk walau browser sudah punya salinan lama */
  (function gabung() { var A = window.FILE_BOS || {};
    Object.keys(A).forEach(function (k) { if (D[k] === undefined) D[k] = salin(A[k]); });
    var bk = {}; (A.bayar || []).forEach(function (b) { bk[b.id] = b.bukti; });
    (D.bayar || []).forEach(function (b) { if (!b.bukti && bk[b.id]) b.bukti = bk[b.id]; }); })();
  ["tasks", "aset", "utang", "bayar", "renewal", "folder", "catatan", "proyek", "files", "fileFolder"].forEach(function (k) { if (!Array.isArray(D[k])) D[k] = []; });
  var ubahLokal = false; try { ubahLokal = !!localStorage.getItem(KUNCI); } catch (x) {}
  var pendengar = [];
  function simpan() { ubahLokal = true; try { localStorage.setItem(KUNCI, JSON.stringify(D)); } catch (x) {} pendengar.forEach(function (f) { f(); }); }
  function idBaru() { return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function rp(n) { return "Rp" + Math.round(+n || 0).toLocaleString("id-ID"); }
  function hariIni() { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function selisihHari(tgl) { if (!tgl) return null; var a = new Date(hariIni() + "T00:00:00"), b = new Date(tgl + "T00:00:00"); return Math.round((b - a) / 864e5); }
  function tglIndo(t) { if (!t) return "-"; var d = new Date(t + "T00:00:00"); return isNaN(d) ? t : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
  /* kotak tulis menyesuaikan tinggi isinya (Teguh 2026-11-17), berlaku untuk catatan Library dan textarea File Bos lain */
  function tinggiPas(t) { if (!t || !t.matches || !t.matches(".fb textarea")) return; t.style.height = "auto"; var mx = Math.round(window.innerHeight * 0.6); t.style.height = Math.min(mx, t.scrollHeight + 2) + "px"; t.style.overflowY = t.scrollHeight + 2 > mx ? "auto" : "hidden"; }
  document.addEventListener("input", function (e) { tinggiPas(e.target); });
  document.addEventListener("focusin", function (e) { tinggiPas(e.target); });

  var css = ".fb{display:flex;flex-direction:column;gap:12px;font-size:13.5px}" +
    ".fb-tab{display:flex;gap:4px;border-bottom:1px solid var(--kp-line);flex-wrap:wrap}.fb-tab button{background:none;border:0;border-bottom:2px solid transparent;color:var(--kp-muted);padding:7px 10px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;margin-bottom:-1px}" +
    ".fb-tab button.on{color:#bfe6ee;border-bottom-color:#4fb3c9}" +
    ".fb-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;background:var(--fb-dalam,#213f48);border:1px solid var(--fb-dalam-garis,var(--kp-line));border-radius:8px;padding:8px}" +
    ".fb-form .lebar{grid-column:1/-1}.fb input,.fb select,.fb textarea{background:#10262c;color:var(--kp-fg);border:1px solid var(--kp-line);border-radius:6px;padding:6px 8px;font:13px Inter,system-ui,sans-serif;width:100%;min-width:0}" +
    ".fb textarea{min-height:120px;resize:vertical}.fb button.fb-b{background:#2b7a90;color:#fff;border:0;border-radius:6px;padding:6px 12px;font:600 12.5px Inter,system-ui,sans-serif;cursor:pointer}" +
    ".fb button.fb-g{background:#2a4a54;color:#fff;border:0;border-radius:6px;padding:4px 9px;font:600 12px Inter,system-ui,sans-serif;cursor:pointer}.fb button.fb-g.bahaya{background:#5a2323}" +
    ".fb ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:5px}" +
    ".fb li.fb-i{display:flex;gap:9px;align-items:center;background:var(--fb-dalam,#213f48);border:1px solid var(--fb-dalam-garis,var(--kp-line));border-radius:8px;padding:7px 10px}" +
    ".fb .tumbuh{flex:1;min-width:0}.fb .jdl{font-weight:600;overflow-wrap:anywhere}.fb .met{font-size:11.5px;color:var(--kp-muted)}" +
    ".fb li.selesai .jdl{text-decoration:line-through;color:var(--kp-muted)}.fb input[type=checkbox]{width:17px;height:17px;flex:none;accent-color:#4fd18b}" +
    ".fb .pil{font-size:11px;font-weight:700;border-radius:99px;padding:1px 8px;white-space:nowrap}.fb .ok{background:#173326;color:#5cc08c}.fb .wn{background:#3a2c12;color:#e3a84a}.fb .cr{background:#3d1c1a;color:#f07a70}.fb .mu{background:#213f48;color:#9aa0ae}" +
    ".fb .stat{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.fb .stat div{background:var(--fb-dalam,#213f48);border:1px solid var(--fb-dalam-garis,var(--kp-line));border-radius:8px;padding:8px 10px}.fb .stat b{display:block;font:600 15px 'IBM Plex Mono',Consolas,monospace}.fb .stat span{font-size:11.5px;color:var(--kp-muted)}" +
    ".fb .bar{height:6px;border-radius:3px;background:#213f48;overflow:hidden}.fb .bar i{display:block;height:100%;background:#4fd18b}" +
    ".fb .kartu{background:var(--fb-kartu,#213f48);border:1px solid var(--fb-kartu-garis,var(--kp-line));border-radius:8px;padding:10px;display:flex;flex-direction:column;gap:8px}" +
    ".fb details summary{cursor:pointer;color:var(--kp-muted);font-size:12.5px}.fb .bayar li{display:flex;gap:8px;font-size:12.5px;border-top:1px solid var(--kp-line);padding:4px 0}" +
    ".fb .sw{font:500 44px 'IBM Plex Mono',Consolas,monospace;text-align:center;letter-spacing:1px}.fb .baris{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}" +
    ".fb .kal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}.fb .kal .hr{font-size:10.5px;color:var(--kp-muted);text-align:center}" +
    ".fb .kal button{min-height:40px;background:var(--fb-dalam,#213f48);border:1px solid var(--fb-dalam-garis,var(--kp-line));border-radius:6px;color:var(--kp-fg);font:600 12px Inter,system-ui,sans-serif;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:3px}" +
    ".fb .kal button.ini{border-color:#4fb3c9;color:#bfe6ee}.fb .kal button.pilih{background:#1f5f70}.fb .tt{display:flex;gap:2px}.fb .tt i{width:6px;height:6px;border-radius:50%}" +
    ".fb .e-task{background:#4fb3c9}.fb .e-ren{background:#e3a84a}.fb .e-bay{background:#f07a70}" +
    ".fb .kepala{display:flex;align-items:center;gap:6px}.fb .kepala b{flex:1;text-align:center}" +
    ".fb .chips{display:flex;gap:4px;flex-wrap:wrap}.fb .chips button{background:#213f48;border:1px solid var(--kp-line);color:var(--kp-muted);border-radius:99px;padding:3px 10px;font:600 12px Inter,system-ui,sans-serif;cursor:pointer}.fb .chips button.on{background:#eef1f7;color:#11141f}" +
    ".fb .isi{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12.5px;color:#c9d2e3;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}.fb .isi.full{display:block}" +
    ".fb .kosong{border:1px dashed var(--kp-line);border-radius:8px;padding:14px;text-align:center;color:var(--kp-muted)}" +
    ".fb-tren{display:flex;flex-direction:column;gap:5px}.fb-tren-b{display:flex;gap:10px;align-items:center;background:var(--fb-dalam,#213f48);border:1px solid var(--fb-dalam-garis,var(--kp-line));border-radius:8px;padding:7px 10px}" +
    ".fb-sel{display:flex;gap:2px}.fb-sel i{width:12px;height:12px;border-radius:3px;background:#213f48;border:1px solid #346371}.fb-sel i.on{background:#4fd18b;border-color:#4fd18b}.fb-sel i.kini{outline:2px solid #4fb3c9;outline-offset:1px}.fb-pr{width:38px;text-align:right;font-size:12px}" +
    ".fb-batang{display:flex;align-items:flex-end;gap:2px;height:70px;background:var(--fb-dalam,#213f48);border:1px solid var(--fb-dalam-garis,var(--kp-line));border-radius:8px;padding:6px}.fb-batang i{flex:1;background:#4fb3c9;border-radius:2px 2px 0 0;min-height:1px}" +
    ".fb-bukti{width:34px;height:34px;padding:0;border:1px solid var(--kp-line);border-radius:5px;overflow:hidden;background:#213f48;cursor:pointer;flex:none}.fb-bukti img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".fb-lihat{position:fixed;inset:0;z-index:3000;background:#05070de6;display:flex;flex-direction:column;padding:14px;gap:10px}.fb-lihat-bar{display:flex;gap:8px;align-items:center;color:#eef1f7}.fb-lihat-bar b{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fb-lihat-bar a{text-decoration:none}" +
    ".fb-lihat img{max-width:100%;max-height:calc(100vh - 80px);margin:auto;border-radius:8px;object-fit:contain}.fb-lihat iframe{flex:1;border:0;border-radius:8px;background:#fff}" +
    ".fb-file{display:flex;gap:9px;align-items:center}.fb-ik{width:36px;height:36px;border-radius:7px;flex:none;display:grid;place-items:center;font:700 10px Inter,sans-serif;background:#213f48;color:#9fb7bd;overflow:hidden;border:1px solid var(--kp-line)}.fb-ik img{width:100%;height:100%;object-fit:cover}.fb-ik.dir{background:#1f5f70;color:#bfe6ee;font-size:17px}" +
    ".fb-jejak{display:flex;gap:4px;align-items:center;flex-wrap:wrap;font-weight:600}.fb-jejak button{background:none;border:0;color:#bfe6ee;cursor:pointer;font:inherit;padding:2px 4px}" +
    ".fb li.fb-i select,.fb .kepala select{width:auto;max-width:150px;flex:none}.fb li.fb-i .tumbuh,.fb .kepala .tumbuh{min-width:0}" +
    /* 3 kolom: kartu Project setinggi dua baris di kanan (Teguh 2026-11-17), tetap satu halaman */
    ".fb-ov{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:10px;flex:1;min-height:0}.fb-ov .kartu.prj{grid-column:3;grid-row:1/span 2}.fb-ov .kartu.prj ul{overflow:auto;min-height:0;flex:1}.fb-ov .kartu.prj a{color:inherit;text-decoration:none}.fb-ov ul.ov-task{overflow:auto;min-height:0;flex:1}.fb-ov .ov-tren{overflow:auto;min-height:0;flex:1}.fb-ov .ov-tren .fb-tren-b{padding:3px 6px}.fb-ov .ov-tren .jdl{font-size:12.5px}.fb-ov .ren-isi{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:6px}.fb-ov .ren-isi ul.dua{grid-template-columns:1fr}.fb-ov .ren-isi .fb-form{gap:4px}.fb-ov .ren-isi .fb-form input,.fb-ov .ren-isi .fb-form select{padding:3px 6px;font-size:12px;min-width:0;flex:1 1 90px}.fb-ov .kartu.prj a:hover .jdl{color:#9fe0ee}" +
    /* kartu Task gabungan + kartu Link (Teguh 2026-11-19) */
    ".fb-ov .ov-jejak{display:flex;align-items:center;gap:6px;margin-top:3px}.fb-ov .ov-jejak .fb-pr{font-size:11.5px}" +
    ".fb-ov .lk-isi{flex:1;min-height:0;display:flex;flex-direction:column;gap:6px}.fb-ov ul.lk-daftar{overflow:auto;min-height:0;flex:1;display:flex;flex-direction:column;gap:4px}.fb-ov .ov-link a{color:inherit;text-decoration:none;min-width:0}.fb-ov .ov-link a:hover .jdl{color:#9fe0ee}" +
    ".lk-logo{width:34px;height:34px;flex:none;border-radius:9px;display:grid;place-items:center;font-size:17px;color:#fff;background:#fff1;box-shadow:inset 0 0 0 1px #ffffff22}.lk-logo.huruf{font:800 16px Inter,system-ui,sans-serif}.lk-form{display:flex;gap:4px;flex-wrap:wrap}.lk-form input{flex:1 1 90px;min-width:0;padding:3px 6px;font-size:12px}.ov-link li.fb-i{align-items:center}" +
    "@media(max-width:1100px){.fb-ov{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none;overflow:auto}.fb-ov .kartu.prj{grid-column:1/-1;grid-row:auto}}" +
    ".fb-ov .kartu{overflow:hidden;gap:6px;padding:10px 12px;min-height:0}.fb-ov ul{gap:3px}.fb-ov li.fb-i{padding:4px 8px}.fb-ov .fb-batang{height:60px}.fb-ov .stat3 b{font-size:14px}@media(max-width:800px){.fb-ov{grid-template-columns:1fr;grid-template-rows:none;overflow:auto}}" +
    ".fb-waktu{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;align-items:start}.fb-tug{display:flex;flex-direction:column;gap:14px}.fb-t1,.fb-t2{display:flex;flex-direction:column;gap:12px}.fb-waktu .sw{font-size:30px}.fb-waktu .kal button{min-height:30px}.fb-waktu .kartu{padding:8px}.fb-sw,.fb-kal{display:flex;flex-direction:column;gap:8px;min-width:0}" +
    ".fb ul.dua{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.fb ul.dua li.fb-i{flex-wrap:wrap;min-width:0}.fb ul.dua li.fb-i.buka{grid-column:1/-1}@media(max-width:900px){.fb ul.dua{grid-template-columns:minmax(0,1fr)}}" +
    ".fb li.fb-i .fb-kep{cursor:pointer}.fb .stat3{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px}.fb .stat3 div{background:var(--fb-dalam,#213f48);border:1px solid var(--fb-dalam-garis,var(--kp-line));border-radius:8px;padding:8px 10px}.fb .stat3 b{display:block;font:600 15px 'IBM Plex Mono',Consolas,monospace}.fb .stat3 span{font-size:11.5px;color:var(--kp-muted)}" +
    ".fb .bayar li select.jenis{width:auto;max-width:95px;flex:none;padding:2px 4px;font-size:11.5px}" +
    /* Task dan Finance muat satu layar: dua kolom berdampingan di layar lebar (Teguh 2026-11-17) */
    "@media(min-width:900px){.fb-tug,.fb-2k{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}.fb-tug .fb-batang{height:54px}.fb-tug .fb-t1,.fb-tug .fb-t2,.fb-2k>div{gap:8px}.fb-tug li.fb-i,.fb-2k li.fb-i{padding:5px 9px}.fb-2k .kartu{padding:8px 10px;gap:6px}}" +
    ".fb-kiri,.fb-tren-bawah{display:flex;flex-direction:column;gap:8px;min-width:0}.fb-tren-bawah .stat div div{background:none;border:0;padding:1px 0;font-size:12.5px}" +
    ".fb-2k>div{display:flex;flex-direction:column;gap:10px;min-width:0}.fb details.fb-bay summary{font-size:12px}.fb details.fb-bay .fb-form{margin-top:6px}" +
    ".fb-simpan{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:12px;color:var(--kp-muted);border-top:1px solid var(--kp-line);padding-top:8px}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* tombol hapus dua langkah (tanpa jendela konfirmasi browser) */
  function hapusDua(btn, fn) { btn.addEventListener("click", function () { if (btn.dataset.yakin) return fn(); btn.dataset.yakin = 1; btn.textContent = "Yakin?"; setTimeout(function () { delete btn.dataset.yakin; btn.textContent = "Hapus"; }, 2500); }); }
  function tab(el, daftar, kunciTab, tanpaSimpan) {
    var kini = daftar[0][0]; try { kini = sessionStorage.getItem(kunciTab) || kini; } catch (x) {}
    el.innerHTML = '<div class="fb"><div class="fb-tab">' + daftar.map(function (d) { return '<button type="button" data-t="' + d[0] + '">' + d[1] + "</button>"; }).join("") + '</div><div class="fb-isi"></div>' + (tanpaSimpan ? "" : barSimpan()) + "</div>";
    var isi = el.querySelector(".fb-isi");
    function buka(k) { kini = k; try { sessionStorage.setItem(kunciTab, k); } catch (x) {} el.querySelectorAll(".fb-tab button").forEach(function (b) { b.classList.toggle("on", b.dataset.t === k); }); daftar.forEach(function (d) { if (d[0] === k) d[2](isi); }); }
    el.querySelector(".fb-tab").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) buka(b.dataset.t); });
    if (!tanpaSimpan) pasangSimpan(el); buka(daftar.some(function (d) { return d[0] === kini; }) ? kini : daftar[0][0]);
    return function () { buka(kini); };
  }
  /* versi HP (Teguh 2026-11-19): di kantor ada tombol "Unduh data buat HP" (file JSON); di HP tombol simpan permanen diganti "Salin data" */
  function barSimpan() { return '<div class="fb-simpan"><span class="fb-st"></span>' + (window.FILE_BOS_HP ? '<button type="button" class="fb-g" data-salin>Salin data (buat kantor)</button>' :
    '<button type="button" class="fb-g" data-unduh-hp>⬇ Unduh data buat HP</button><button type="button" class="fb-g" data-simpan>Simpan permanen ke Nyenyo</button>') + "</div>"; }
  function pasangSimpan(el) {
    var s = el.querySelector(".fb-st");
    function tulis() { s.textContent = ubahLokal ? "Perubahan tersimpan di browser ini." : "Data dari impor Imperium Center (16 Nov 2026)."; }
    tulis(); pendengar.push(tulis);
    var bs = el.querySelector("[data-simpan]"); if (bs) bs.addEventListener("click", function () { if (window.FileBos.kirim) window.FileBos.kirim("[simpan file bos]\n" + JSON.stringify(D)); });
    var bu = el.querySelector("[data-unduh-hp]"); if (bu) bu.addEventListener("click", function () {
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ fileBos: D, tanggal: hariIni() })], { type: "application/json" }));
      a.download = "file-bos-" + hariIni() + ".json"; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); s.textContent = "File data diunduh. Buka link HP, tekan Impor data, pilih file ini."; });
    var bc = el.querySelector("[data-salin]"); if (bc) bc.addEventListener("click", function () {
      var t = "[simpan file bos]\n" + JSON.stringify(D);
      navigator.clipboard.writeText(t).then(function () { s.textContent = "Data tersalin. Tempel di chat Nyenyo kalau mau disimpan ke kantor."; }, function () { s.textContent = "HP menolak menyalin otomatis."; }); });
  }

  /* ---------- Planner ---------- */
  /* progres Basic English untuk target pelatihan di Dreams (Teguh 2026-11-26) */
  window.IMP_BE_PROGRESS = function () { var B = window.BASIC_ENGLISH; if (!B) return null; var pg = {}; try { pg = JSON.parse(localStorage.getItem("fileBosBasic") || "{}"); } catch (x) {}
    var all = [].concat.apply([], B.level.map(function (l) { return l.topik; })), paham = all.filter(function (t) { return pg[t.id]; }).length;
    var lv = B.level.map(function (l) { return { nama: l.nama, paham: l.topik.filter(function (t) { return pg[t.id]; }).length, total: l.topik.length }; });
    return { paham: paham, total: all.length, pct: all.length ? Math.round(paham / all.length * 100) : 0, level: lv }; };
  function vBasic(el) {
    var B = window.BASIC_ENGLISH, KP = "fileBosBasic", pg = {}; try { pg = JSON.parse(localStorage.getItem(KP) || "{}"); } catch (x) {}
    if (!B) { el.innerHTML = '<div class="fb"><div class="kosong">Materi Basic English belum terpasang.</div></div>'; return function () {}; }
    function simpanPg() { try { localStorage.setItem(KP, JSON.stringify(pg)); } catch (x) {} }
    /* tier belajar ala game (Teguh 2026-11-18 "biar saya semakin semangat"): XP dari topik dipahami, soal dikerjakan (effort), jawaban benar,
       latihan selesai, latihan sempurna, hari aktif, dan Cek Level; tiap tier dibagi III-II-I seperti ranked game */
    var S = pg._st = Object.assign({ soal: 0, benar: 0, sesi: 0, sempurna: 0, tes: 0, tesTerbaik: 0, hari: [] }, pg._st || {});
    function tglDari(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
    function aktif() { var h = hariIni(); if (S.hari.indexOf(h) < 0) S.hari.push(h); if (S.hari.length > 500) S.hari = S.hari.slice(-500); }
    function catat(f) { f(S); aktif(); simpanPg(); }
    function beruntun() { var n = 0, d = new Date(); if (S.hari.indexOf(tglDari(d)) < 0) d.setDate(d.getDate() - 1); while (S.hari.indexOf(tglDari(d)) >= 0) { n++; d.setDate(d.getDate() - 1); } return n; }
    function terpanjang() { var a = S.hari.slice().sort(), m = 0, n = 0, sb = null; a.forEach(function (h) { var d = new Date(h + "T00:00:00"); n = sb && (d - sb) / 864e5 === 1 ? n + 1 : 1; if (n > m) m = n; sb = d; }); return m; }
    var semuaTopik = [].concat.apply([], B.level.map(function (l) { return l.topik; }));
    function hitungXP() { var paham = semuaTopik.filter(function (t) { return pg[t.id]; }).length;
      var rinci = [["📘", "Topik dipahami", paham, 60], ["✍️", "Soal dikerjakan (effort)", S.soal, 2], ["✅", "Jawaban benar", S.benar, 8], ["🏁", "Latihan selesai", S.sesi, 20], ["💯", "Latihan sempurna", S.sempurna, 40], ["📅", "Hari aktif belajar", S.hari.length, 15], ["🧭", "Tes Level selesai", S.tes, 25]];
      return { paham: paham, rinci: rinci, xp: rinci.reduce(function (s, r) { return s + r[2] * r[3]; }, 0) }; }
    var TIER = [["Iron", 0, "#8a8f98", "🪨"], ["Bronze", 300, "#cd7f32", "🥉"], ["Silver", 900, "#c0c8d4", "🥈"], ["Gold", 1800, "#ffcc33", "🥇"], ["Platinum", 3200, "#4fd1c5", "💠"],
      ["Emerald", 5000, "#2ecc71", "💚"], ["Diamond", 7500, "#7ab8ff", "💎"], ["Master", 11000, "#b07aff", "👑"], ["Grandmaster", 15000, "#ff6b6b", "🔥"], ["Legend", 20000, "#ffd23f", "🌟"]], DIV = ["III", "II", "I"];
    function tierDari(xp) { var i = 0; while (i + 1 < TIER.length && xp >= TIER[i + 1][1]) i++; var t = TIER[i], nx = TIER[i + 1];
      if (!nx) return { t: t, i: i, nama: t[0], pct: 100, sisa: 0, lanjut: "" };
      var lebar = (nx[1] - t[1]) / 3, d = Math.min(2, Math.floor((xp - t[1]) / lebar));
      return { t: t, i: i, nama: t[0] + " " + DIV[d], pct: (xp - t[1] - lebar * d) / lebar * 100, sisa: Math.ceil(t[1] + lebar * (d + 1) - xp), lanjut: d < 2 ? t[0] + " " + DIV[d + 1] : nx[0] + " III" }; }
    function lihatTier(isi) {
      var h = hitungXP(), r = tierDari(h.xp), ak = S.soal ? Math.round(S.benar / S.soal * 100) : 0, br = beruntun(), lv0 = B.level[0];
      var LC = [["👣", "Langkah pertama", "Jawab 1 soal", S.soal >= 1], ["📚", "Rajin", "100 soal dikerjakan", S.soal >= 100], ["🏋️", "Pejuang", "500 soal dikerjakan", S.soal >= 500],
        ["🎯", "Penembak jitu", "Akurasi 85%+ (min. 50 soal)", S.soal >= 50 && ak >= 85], ["💯", "Sempurna", "Latihan 10+ soal benar semua", S.sempurna >= 1], ["🔥", "Konsisten", "Belajar 7 hari beruntun", terpanjang() >= 7],
        ["🗓️", "Disiplin", "30 hari aktif belajar", S.hari.length >= 30], ["🧠", "Fondasi kuat", "Semua topik " + lv0.nama + " dipahami", lv0.topik.every(function (t) { return pg[t.id]; })],
        ["🎓", "Tuntas", "Semua topik dipahami", h.paham === semuaTopik.length], ["🧭", "Kenal diri", "Tes Level 1 kali", S.tes >= 1]];
      var misi = h.paham < semuaTopik.length ? "Pahami 1 topik lagi lalu centang \"Sudah paham\" (+60 XP)" : "Kerjakan latihan 20 soal (+40 XP effort, +8 XP tiap jawaban benar)";
      isi.innerHTML = '<div class="kartu" style="--tw:' + r.t[2] + '"><div class="be-tier"><div class="be-emb">' + r.t[3] + '</div><div class="tumbuh"><div class="met">Tier kamu sekarang</div><div class="be-tn">' + r.nama + '</div>' +
          '<div class="be-xp">' + h.xp.toLocaleString("id-ID") + " XP" + (r.lanjut ? " · " + r.sisa + " XP lagi ke <b>" + r.lanjut + "</b>" : " · tier tertinggi!") + '</div><div class="bar" style="margin-top:6px;height:9px"><i style="width:' + r.pct + "%;background:" + r.t[2] + '"></i></div></div></div>' +
          '<div class="met">🎯 Misi berikutnya: ' + misi + ".</div></div>" +
        '<div class="kartu"><b>Penilaian belajar</b><div class="stat3"><div><span>Topik dipahami</span><b>' + h.paham + " / " + semuaTopik.length + "</b></div><div><span>Soal dikerjakan</span><b>" + S.soal + "</b></div><div><span>Akurasi jawaban</span><b" + (S.soal ? ' style="color:' + (ak >= 80 ? "#5cc08c" : ak >= 60 ? "#e3a84a" : "#f07a70") + '"' : "") + ">" + (S.soal ? ak + "%" : "-") + "</b></div>" +
          "<div><span>Latihan selesai</span><b>" + S.sesi + "</b></div><div><span>Belajar beruntun</span><b>" + br + " hari</b></div><div><span>Hari aktif total</span><b>" + S.hari.length + "</b></div><div><span>Tes Level terbaik</span><b>" + (S.tes ? S.tesTerbaik + " / 15" : "-") + "</b></div></div></div>" +
        '<div class="kartu"><b>Asal XP</b><ul>' + h.rinci.map(function (x) { return '<li class="fb-i"><span>' + x[0] + '</span><div class="tumbuh">' + x[1] + ' <span class="met">· ' + x[2] + " × " + x[3] + " XP</span></div><b>" + (x[2] * x[3]).toLocaleString("id-ID") + "</b></li>"; }).join("") + "</ul></div>" +
        '<div class="kartu"><b>Lencana (' + LC.filter(function (l) { return l[3]; }).length + " / " + LC.length + ')</b><div class="be-lc">' + LC.map(function (l) { return '<div class="' + (l[3] ? "on" : "") + '"><b>' + l[0] + " " + l[1] + "</b>" + l[2] + "</div>"; }).join("") + "</div></div>" +
        '<div class="kartu"><b>Tangga tier</b><div class="be-tangga">' + TIER.map(function (t, i) { return '<span class="' + (i <= r.i ? "on" : "") + '"' + (i <= r.i ? ' style="background:' + t[2] + ";border-color:" + t[2] + '"' : "") + ">" + t[3] + " " + t[0] + ' <small>' + t[1].toLocaleString("id-ID") + "</small></span>"; }).join("") + "</div></div>";
    }
    /* tampilan rumus dan contoh bertanda (Teguh 2026-11-16 sore): rumus tebal, (+) (-) (?) tiap baris sendiri, tabel semua subject, contoh dengan label "subject" di bawah subjeknya */
    if (!document.getElementById("fb-rumus-css")) { var sc = document.createElement("style"); sc.id = "fb-rumus-css";
      sc.textContent = ".rm-blok{border:1px solid var(--kp-line);border-radius:8px;padding:8px 10px;margin:8px 0}.rm-nama{font-weight:700;margin-bottom:4px}.rm-b{margin:3px 0;line-height:1.5}.rm-t{display:inline-block;min-width:44px;color:#7dff8a;font-weight:700}.rm-f{font-weight:800}.rm-c{color:var(--kp-muted);font-size:.9em}" +
        ".rm-tab{width:100%;border-collapse:collapse;margin-top:6px;font-size:.92em}.rm-tab th,.rm-tab td{border:1px solid var(--kp-line);padding:3px 7px;text-align:left}.rm-tab th{color:var(--kp-muted);font-weight:600}" +
        ".kal{line-height:2.1}.tk{display:inline-flex;flex-direction:column;align-items:center;vertical-align:top;line-height:1.15}.tk small{font-size:.68em;color:#7dff8a;border-top:2px solid #7dff8a;padding:0 2px;margin-top:1px}.tk.v small{color:#ffd23f;border-top-color:#ffd23f}" +
        /* materi Basic English lebih besar dan rapi (Teguh 2026-11-18): tiap bagian setelah ";" turun ke baris baru */
        ".be-tingkat details.kartu{font-size:15px;line-height:1.55}.be-tingkat details.kartu .met{font-size:14px}.be-tingkat summary b{font-size:15.5px}" +
        ".be-sek{display:flex;align-items:center;gap:8px;margin:16px 0 8px;font-weight:800;font-size:16px;color:#fff;border-bottom:1px solid var(--kp-line);padding-bottom:5px}" +
        ".be-no{flex:none;width:24px;height:24px;border-radius:50%;background:#4fb3c9;color:#fff;display:inline-grid;place-items:center;font-size:12.5px}" +
        ".be-kotak{background:#173a42;border-left:3px solid #4fb3c9;border-radius:6px;padding:8px 12px}" +
        ".be-j{display:inline-block;min-width:96px;font-weight:800;font-size:13px;padding:2px 8px;border-radius:5px;background:#2a4a54;color:#dfe6f5;text-align:center}.be-j.p{background:#173826;color:#7dff8a}.be-j.n{background:#3d1f22;color:#ff9b91}.be-j.t{background:#1b2c48;color:#8ab8ff}" +
        ".be-tingkat .rm-b{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:5px 0;border-bottom:1px dashed var(--kp-line)}.be-tingkat .rm-b:last-of-type{border-bottom:0}.be-tingkat .rm-c{flex-basis:100%;padding-left:106px;font-size:13.5px}" +
        ".be-grup{margin:6px 0 10px}.be-grup>ul{margin-top:5px}.be-tingkat .jdl.kal{display:block;font-size:15.5px}.be-tingkat .tk{margin:0 1px}" +
        ".be-at{color:#c9d2e3;padding:2px 0}.be-at ul{margin:3px 0 2px 18px;padding:0;list-style:none;display:flex;flex-direction:column;gap:2px}.be-at ul li{position:relative;padding-left:14px}.be-at ul li:before{content:'–';position:absolute;left:0;color:#4fb3c9}" +
        ".be-tier{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.be-emb{width:88px;height:88px;border-radius:50%;display:grid;place-items:center;font-size:42px;flex:none;background:radial-gradient(circle at 35% 30%,#ffffff55,transparent 60%),var(--tw);box-shadow:0 0 0 4px #0007,0 0 20px var(--tw);animation:beKilau 3s ease-in-out infinite}" +
        ".be-tn{font:800 26px Inter,system-ui,sans-serif;color:var(--tw);letter-spacing:.5px}.be-xp{font:600 13px 'IBM Plex Mono',Consolas,monospace}@keyframes beKilau{50%{box-shadow:0 0 0 4px #0007,0 0 34px var(--tw)}}" +
        ".be-lc{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}.be-lc div{border:1px solid var(--kp-line);border-radius:8px;padding:7px 9px;font-size:12px;opacity:.38;filter:grayscale(1)}.be-lc div.on{opacity:1;filter:none;border-color:#ffd23f;background:#ffd23f12}.be-lc b{display:block;font-size:13px}" +
        ".be-tangga{display:flex;gap:5px;flex-wrap:wrap}.be-tangga span{font-size:12px;font-weight:700;border-radius:99px;padding:3px 10px;border:1px solid var(--kp-line);color:var(--kp-muted)}.be-tangga span.on{color:#11141f}.be-tangga small{font-weight:500;opacity:.75}" +
        ".be-naik{font:800 16px Inter,sans-serif;color:#ffd23f;animation:beNaik .6s ease-out}@keyframes beNaik{from{transform:scale(.6);opacity:0}}@media(prefers-reduced-motion:reduce){.be-emb,.be-naik{animation:none}}";
      document.head.appendChild(sc); }
    /* ";" di teks aturan = baris baru; bagian pertama jadi judul butir, sisanya jadi sub-butir */
    function aturanHtml(a) { var p = a.split(/\s*;\s*/).filter(Boolean);
      return '<li class="be-at">• ' + esc(p[0]) + (p.length > 1 ? "<ul>" + p.slice(1).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</li>"; }
    function tandai(kal, subj, kerja) {
      var tanda = [];
      [[subj, "subject", ""], [kerja, "verb", " v"]].forEach(function (m) { if (!m[0]) return;
        var re = new RegExp("(^|[^A-Za-z'])(" + m[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")(?![A-Za-z'])", "i"), r = re.exec(kal); if (r) tanda.push({ a: r.index + r[1].length, b: r.index + r[1].length + m[0].length, l: m[1], k: m[2] }); });
      tanda.sort(function (x, y) { return x.a - y.a; });
      var h = "", p = 0; tanda.forEach(function (t) { if (t.a < p) return; h += esc(kal.slice(p, t.a)) + '<span class="tk' + t.k + '">' + esc(kal.slice(t.a, t.b)) + "<small>" + t.l + "</small></span>"; p = t.b; });
      return h + esc(kal.slice(p));
    }
    /* kerangka materi berhierarki (Teguh 2026-11-18 "biar orang baca langsung paham"): bagian bernomor,
       jenis kalimat diberi label berwarna (+) Positif / (−) Negatif / (?) Tanya, contoh dikelompokkan per jenis */
    var JENIS = { "+": ["p", "(+) Positif"], "-": ["n", "(−) Negatif"], "?": ["t", "(?) Tanya"] };
    function labelJenis(k) { var j = JENIS[k]; return j ? '<span class="be-j ' + j[0] + '">' + j[1] + "</span>" : '<span class="be-j">' + esc(k) + "</span>"; }
    function jenisKal(s) { return /\?\s*$/.test(s) ? "?" : /\bnot\b|n't\b/i.test(s) ? "-" : "+"; }
    function bagian(no, judul, isi) { return '<div class="be-sek"><span class="be-no">' + no + "</span>" + judul + "</div>" + isi; }
    function rumusHtml(t) { return (t.rumus || []).map(function (r, ri) {
      return '<div class="rm-blok"><div class="rm-nama">' + ((t.rumus.length > 1 ? String.fromCharCode(65 + ri) + ". " : "") + esc(r.nama)) + "</div>" +
        (r.baris || []).map(function (b) { return '<div class="rm-b">' + labelJenis(b[0]) + ' <span class="rm-f">' + esc(b[1]) + "</span>" + (b[2] ? '<div class="rm-c">' + esc(b[2]) + "</div>" : "") + "</div>"; }).join("") +
        (r.tabel ? '<table class="rm-tab"><tr>' + r.tabel.kepala.map(function (k) { return "<th>" + esc(k) + "</th>"; }).join("") + "</tr>" + r.tabel.baris.map(function (br) { return "<tr>" + br.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</table>" : "") + "</div>"; }).join(""); }
    function lihatTingkat(lv) { return function (isi) {
      var paham = lv.topik.filter(function (t) { return pg[t.id]; }).length; isi.classList.add("be-tingkat");
      isi.innerHTML = '<div class="met">Kemajuan: <b>' + paham + " / " + lv.topik.length + "</b> topik sudah dipahami</div><div class=\"bar\"><i style=\"width:" + (paham / lv.topik.length * 100) + '%"></i></div>' +
        lv.topik.map(function (t) {
          var no = 0, kapan = (t.aturan || []).filter(function (a) { return /^(Dipakai|Kata penanda|Penanda)/.test(a); }), atur = (t.aturan || []).filter(function (a) { return kapan.indexOf(a) < 0; });
          var grup = { "+": [], "-": [], "?": [] }; (t.contoh || []).forEach(function (c) { grup[jenisKal(c[0])].push(c); });
          function contohLi(c) { return '<li class="fb-i"><div class="tumbuh"><div class="jdl kal">' + (c[2] ? tandai(c[0], c[2], c[3]) : esc(c[0])) + '</div><div class="met">' + esc(c[1]) + "</div></div></li>"; }
          return '<details class="kartu" data-id="' + t.id + '"' + (bukaBasic[t.id] ? " open" : "") + "><summary><b>" + (pg[t.id] ? "✓ " : "") + esc(t.judul) + "</b>" + (ulang(t.id) ? ' <span class="be-ul-b" title="Sudah dipelajari ' + ulang(t.id) + ' kali">🔁 ' + ulang(t.id) + "×</span>" : "") + "</summary>" +
            /* pengertian dan tips (basic-english-tambahan.js, Teguh 2026-11-17: materi harus informatif) */
            (t.pengertian ? bagian(++no, "Pengertian", '<div class="be-kotak">' + esc(t.pengertian) + "</div>") : "") +
            (kapan.length ? bagian(++no, "Kapan dipakai", "<ul>" + kapan.map(aturanHtml).join("") + "</ul>") : "") +
            (t.rumus ? bagian(++no, "Rumus kalimat", rumusHtml(t)) : "") +
            (t.contoh ? bagian(++no, "Contoh kalimat", ["+", "-", "?"].map(function (k) { return grup[k].length ? '<div class="be-grup">' + labelJenis(k) + "<ul>" + grup[k].map(contohLi).join("") + "</ul></div>" : ""; }).join("")) : "") +
            (t.kosakata ? bagian(++no, "Kosakata", '<ul class="dua">' + t.kosakata.map(function (c) { return '<li class="fb-i"><div class="tumbuh"><div class="jdl">' + esc(c[0]) + '</div><div class="met">' + esc(c[1]) + "</div></div></li>"; }).join("") + "</ul>") : "") +
            (atur.length ? bagian(++no, "Aturan penting", "<ul>" + atur.map(aturanHtml).join("") + "</ul>") : "") +
            (t.salah ? bagian(++no, "Kesalahan umum", "<ul>" + t.salah.map(function (s) { return '<li class="fb-i"><div class="tumbuh"><div class="met">✗ ' + esc(s[0]) + '</div><div class="jdl">✓ ' + esc(s[1]) + '</div><div class="met">' + esc(s[2] || "") + "</div></div></li>"; }).join("") + "</ul>") : "") +
            (t.tips ? bagian(++no, "Tips ingat", "<ul>" + t.tips.map(function (a) { return '<li class="met" style="color:#ffd98a">💡 ' + esc(a) + "</li>"; }).join("") + "</ul>") : "") +
            (t.latihan ? bagian(++no, "Latihan", "<ul>" + t.latihan.map(function (q) { return '<li class="fb-i"><div class="tumbuh"><div>' + esc(q[0]) + '</div><details><summary>Lihat jawaban</summary><b>' + esc(q[1]) + "</b></details></div></li>"; }).join("") + "</ul>") : "") +
            ulangHtml(t.id) +
            '<label class="met" style="display:flex;gap:6px;align-items:center"><input type="checkbox" data-p' + (pg[t.id] ? " checked" : "") + ' style="width:auto"> Sudah paham</label></details>'; }).join("");
      isi.querySelectorAll("details.kartu").forEach(function (d) { d.addEventListener("toggle", function () { bukaBasic[d.dataset.id] = d.open; });
        d.querySelector("[data-p]").addEventListener("change", function () { pg[d.dataset.id] = this.checked; aktif(); simpanPg(); lihatTingkat(lv)(isi); });
        var ub = d.querySelector(".be-ul"); if (ub) ub.addEventListener("click", function (e) { var b = e.target.closest("[data-ul]"); if (!b) return; e.preventDefault();
          var id = d.dataset.id, n = ulang(id), v = b.dataset.ul;
          n = v === "+" ? n + 1 : v === "-" ? Math.max(0, n - 1) : (+v === n ? n - 1 : +v);
          setUlang(id, n); if (v !== "-" && n > 0) aktif(); simpanPg(); lihatTingkat(lv)(isi); }); }); }; }
    /* penanda ulang belajar (Teguh 2026-11-26): berapa kali topik ini sudah dipelajari; kotak dicentang per kali belajar */
    function ulang(id) { var u = pg._ul && pg._ul[id]; return u ? +u.n || 0 : 0; }
    function setUlang(id, n) { pg._ul = pg._ul || {}; if (n > 0) pg._ul[id] = { n: n, t: hariIni() }; else delete pg._ul[id]; }
    function ulangHtml(id) { var n = ulang(id), u = pg._ul && pg._ul[id], tot = Math.min(30, Math.max(10, n + 1)), kotak = "";
      for (var i = 1; i <= tot; i++) kotak += '<button type="button" class="be-ulk' + (i <= n ? " on" : "") + '" data-ul="' + i + '" title="Tandai sudah ' + i + ' kali" aria-label="' + i + ' kali" aria-pressed="' + (i <= n) + '">' + (i <= n ? "✓" : "") + "</button>";
      return '<div class="be-ul"><div class="be-ul-h"><b>Sudah dipelajari: ' + n + '×</b>' + (u && u.t ? ' <span class="met">· terakhir ' + esc(u.t) + "</span>" : "") + '</div><div class="be-ul-k">' + kotak + '</div>' +
        '<div class="be-ul-a"><button type="button" class="fb-b" data-ul="+">+1 Selesai belajar lagi</button>' + (n ? '<button type="button" class="be-ul-min" data-ul="-" title="Kurangi satu">−1</button>' : "") + "</div></div>"; }
    /* Cara Belajar + Percakapan Siap Pakai (english-cepat.js, 2026-11-22: "butuh cepat paham dan lekas fasih") */
    var EC = window.ENGLISH_CEPAT || { metode: [], frasa: [], rencana12: [] };
    function lihatRencana(isi) {
      isi.innerHTML = '<div class="be-kotak">Tujuan: bicara lancar untuk kerja dan interview secepat mungkin. Ikuti rutinitas 30 menit di bawah setiap hari.</div>' +
        EC.metode.map(function (m, i) { return '<details class="kartu"' + (i < 2 ? " open" : "") + "><summary><b>" + (i + 1) + ". " + esc(m.judul) + '</b></summary><div class="be-at">' + esc(m.isi) + "</div><ul>" + m.poin.map(function (x) { return '<li class="be-at">• ' + esc(x) + "</li>"; }).join("") + "</ul></details>"; }).join("") +
        '<div class="kartu"><b>Target 12 minggu</b><ul>' + (EC.rencana12 || []).map(function (r) { return '<li class="fb-i"><div class="tumbuh">' + esc(r) + "</div></li>"; }).join("") + "</ul></div>" +
        '<details class="kartu"><summary><b>Catatan rencana lama</b></summary><ul>' + B.rencana.map(function (r) { return '<li class="fb-i"><div class="tumbuh">' + esc(r) + "</div></li>"; }).join("") + "</ul></details>"; }
    var frasaUji = false, frasaBuka = {};
    function ucap(t) { try { var u = new SpeechSynthesisUtterance(t.replace(/^Q:.*?→\s*/, "")); u.lang = "en-US"; u.rate = .85; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (x) {} }
    function lihatFrasa(isi) {
      var bisaSuara = typeof speechSynthesis !== "undefined";
      isi.innerHTML = '<div class="met">Ucapkan tiap kalimat keras-keras 5 kali. ' + (bisaSuara ? "Tekan 🔊 untuk mendengar contoh bunyinya. " : "") + 'Cara baca = perkiraan bunyi untuk lidah Indonesia.</div>' +
        '<label class="met fr-uji"><input type="checkbox" data-uji' + (frasaUji ? " checked" : "") + '> Mode latihan: sembunyikan bahasa Inggris, tebak dari artinya, ketuk untuk melihat</label>' +
        EC.frasa.map(function (k) { return '<details class="kartu" data-k="' + k.id + '"' + (frasaBuka[k.id] ? " open" : "") + '><summary><b>' + k.ikon + " " + esc(k.nama) + '</b> <span class="met">· ' + k.item.length + ' kalimat</span></summary><div class="met">' + esc(k.ket) + '</div><ul class="fr-daftar">' +
          k.item.map(function (f, i) { var qa = /^Q:\s*(.*?)\s*→\s*(.*)$/.exec(f[0]), qi = /^(.*?)\s*→\s*(.*)$/.exec(f[1]);
            return '<li class="fb-i fr' + (frasaUji ? " tutup" : "") + '"><div class="tumbuh">' + (qa ? '<div class="fr-q">❓ ' + esc(qa[1]) + (qi ? ' <span class="met">(' + esc(qi[1]) + ")</span>" : "") + '</div><div class="fr-en jdl">' + esc(qa[2]) + '</div><div class="fr-id">' + esc(qi ? qi[2] : f[1]) + "</div>" : '<div class="fr-en jdl">' + esc(f[0]) + '</div><div class="fr-id">' + esc(f[1]) + "</div>") + (f[2] ? '<div class="fr-baca">🗣 ' + esc(f[2]) + "</div>" : "") + (f[3] ? '<div class="fr-cat">💡 ' + esc(f[3]) + "</div>" : "") + "</div>" +
            (bisaSuara ? '<button type="button" class="fb-g" data-u="' + k.id + ":" + i + '" title="Dengarkan">🔊</button>' : "") + "</li>"; }).join("") + "</ul></details>"; }).join("");
      isi.querySelector("[data-uji]").addEventListener("change", function () { frasaUji = this.checked; lihatFrasa(isi); });
      isi.querySelectorAll("details[data-k]").forEach(function (d) { d.addEventListener("toggle", function () { frasaBuka[d.dataset.k] = d.open; }); });
      isi.querySelectorAll("li.fr").forEach(function (li) { li.addEventListener("click", function (e) { if (!e.target.closest("[data-u]")) li.classList.toggle("tutup"); }); });
      isi.querySelectorAll("[data-u]").forEach(function (b) { b.addEventListener("click", function () { var a = b.dataset.u.split(":"), k = EC.frasa.filter(function (x) { return x.id === a[0]; })[0]; if (k) ucap(k.item[+a[1]][0]); }); });
      if (!document.getElementById("fr-css")) { var c = document.createElement("style"); c.id = "fr-css";
        c.textContent = ".fr-uji{display:flex;gap:8px;align-items:center;margin:4px 0}.fr-uji input{width:auto!important;min-height:0!important}.fr-en{font-size:15px}.fr-q{font-size:13px;color:#9fe0ee;font-weight:600;margin-bottom:3px}.fr-id{font-size:13px;color:#c9d2e3}.fr-baca{font-size:12.5px;color:#9fe0ee;font-style:italic;margin-top:2px}.fr-cat{font-size:12px;color:#ffd98a;margin-top:2px}" +
          ".fb li.fr{align-items:flex-start;cursor:pointer}.fb li.fr.tutup .fr-en,.fb li.fr.tutup .fr-baca,.fb li.fr.tutup .fr-cat{filter:blur(6px);opacity:.5}.fb li.fr.tutup .fr-en{user-select:none}";
        document.head.appendChild(c); }
    }
    /* bank soal besar (soal-basic.js): urutan soal dan pilihan diacak tiap kali (Teguh 2026-11-16 siang) */
    function acak(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    function soalAcak(q) { var ben = q[1][q[2]], op = acak(q[1]); return [q[0], op, op.indexOf(ben), q[3], q[4] || ""]; }
    function ambilBank(level, n) { var b = (window.BANK_SOAL || B.tes).filter(function (q) { return !level || q[3] === level; }); return acak(b).slice(0, n || b.length).map(soalAcak); }
    function ambilTes() { var h = []; ["dasar", "menengah", "lanjut"].forEach(function (l) { h = h.concat(ambilBank(l, 5)); }); return h; }
    function lihatLatihan(isi) {
      var jml = (window.BANK_SOAL || []).length, st = null;
      function awal() {
        isi.innerHTML = '<div class="met">Bank soal: <b>' + jml + '</b> soal, diacak tiap kali mulai. Jawab, langsung dapat koreksi.</div>' +
          '<div class="kepala"><select data-lv class="fb-b"><option value="">Campur semua tingkat</option><option value="dasar">Dasar</option><option value="menengah">Menengah</option><option value="lanjut">Lanjut</option></select>' +
          '<select data-n class="fb-b"><option value="10">10 soal</option><option value="20">20 soal</option><option value="30">30 soal</option><option value="0">Semua</option></select>' +
          '<button type="button" class="fb-b" data-mulai>Mulai latihan acak</button></div>';
        isi.querySelector("[data-mulai]").addEventListener("click", function () { var n = +isi.querySelector("[data-n]").value; st = { s: ambilBank(isi.querySelector("[data-lv]").value, n || 0), i: 0, benar: 0, salah: [], xp0: hitungXP().xp }; tampil(); });
      }
      function tampil() {
        if (st.i >= st.s.length) { if (!st.tutup) { st.tutup = 1; catat(function (s) { s.sesi++; if (st.s.length >= 10 && st.benar === st.s.length) s.sempurna++; }); }
          var x1 = hitungXP().xp, t0 = tierDari(st.xp0), t1 = tierDari(x1);
          isi.innerHTML = '<div class="kartu"><b>Selesai!</b><div>Skor: <b>' + st.benar + " / " + st.s.length + "</b> (" + Math.round(st.benar / st.s.length * 100) + "%)</div>" +
          '<div class="be-xp">+' + (x1 - st.xp0) + " XP · tier " + t1.nama + "</div>" + (t1.nama !== t0.nama ? '<div class="be-naik">🎉 NAIK TIER: ' + t0.nama + " → " + t1.t[3] + " " + t1.nama + "!</div>" : "") +
          (st.salah.length ? "<b>Yang masih salah</b><ul>" + st.salah.map(function (q) { return '<li class="fb-i"><div class="tumbuh"><div>' + esc(q[0]) + '</div><div class="jdl">✓ ' + esc(q[1][q[2]]) + "</div>" + (q[4] ? '<div class="met">💡 ' + esc(q[4]) + "</div>" : "") + "</div></li>"; }).join("") + "</ul>" : '<div class="met">Semua benar, mantap!</div>') +
          '</div><div class="kepala"><button type="button" class="fb-b" data-ulang>Latihan lagi (diacak ulang)</button></div>'; isi.querySelector("[data-ulang]").addEventListener("click", awal); return; }
        var q = st.s[st.i];
        isi.innerHTML = '<div class="met">Soal ' + (st.i + 1) + " / " + st.s.length + " · tingkat " + q[3] + " · benar " + st.benar + '</div><div class="bar"><i style="width:' + (st.i / st.s.length * 100) + '%"></i></div>' +
          '<div class="kartu"><div><b>' + esc(q[0]) + '</b></div><div class="chips">' + q[1].map(function (o, k) { return '<button type="button" class="fb-b" data-k="' + k + '">' + esc(o) + "</button>"; }).join("") + '</div><div data-umpan class="met"></div></div>';
        var kunci = false;
        isi.querySelectorAll("[data-k]").forEach(function (b) { b.addEventListener("click", function () {
          if (kunci) return; kunci = true; var k = +b.dataset.k, ok = k === q[2]; if (ok) st.benar++; else st.salah.push(q); catat(function (s) { s.soal++; if (ok) s.benar++; });
          isi.querySelectorAll("[data-k]").forEach(function (x) { if (+x.dataset.k === q[2]) x.style.background = "#1f7a45"; });
          if (!ok) b.style.background = "#a33b3b";
          var u = isi.querySelector("[data-umpan]"); u.innerHTML = (ok ? "✓ Benar! " : "✗ Kurang tepat. Jawaban: <b>" + esc(q[1][q[2]]) + "</b>. ") + (q[4] ? '<div class="be-kotak" style="margin:6px 0;color:var(--kp-fg)">💡 ' + esc(q[4]) + "</div>" : "") + '<button type="button" class="fb-b" data-lanjut>' + (st.i + 1 >= st.s.length ? "Lihat hasil" : "Berikutnya") + "</button>";
          u.querySelector("[data-lanjut]").addEventListener("click", function () { st.i++; tampil(); }); }); });
      }
      awal();
    }
    function lihatTes(isi) {
      var TES = ambilTes();
      isi.innerHTML = '<div class="met">15 soal pilihan ganda (5 Dasar, 5 Menengah, 5 Lanjut) diambil acak dari bank ' + (window.BANK_SOAL || B.tes).length + ' soal. Tidak ada nilai buruk, ini hanya peta belajar.</div>' + TES.map(function (q, i) {
        return '<div class="kartu"><div><b>' + (i + 1) + ".</b> " + esc(q[0]) + '</div><div class="chips">' + q[1].map(function (o, k) { return '<label class="met" style="display:flex;gap:6px;align-items:center;border:1px solid var(--kp-line);border-radius:99px;padding:3px 10px"><input type="radio" name="q' + i + '" value="' + k + '" style="width:auto">' + esc(o) + "</label>"; }).join("") + "</div></div>"; }).join("") +
        '<div class="kepala"><button type="button" class="fb-b" data-hitung>Hitung hasil</button><button type="button" class="fb-b" data-acak>Acak soal baru</button></div><div class="kartu" data-hasil hidden></div>';
      isi.querySelector("[data-acak]").addEventListener("click", function () { lihatTes(isi); });
      var tercatat = false;
      isi.querySelector("[data-hitung]").addEventListener("click", function () {
        var skor = { dasar: [0, 0], menengah: [0, 0], lanjut: [0, 0] };
        TES.forEach(function (q, i) { var p = isi.querySelector('input[name="q' + i + '"]:checked'); skor[q[3]][1]++; if (p && +p.value === q[2]) skor[q[3]][0]++; });
        if (!tercatat) { tercatat = true; var tot = skor.dasar[0] + skor.menengah[0] + skor.lanjut[0]; catat(function (s) { s.tes++; s.tesTerbaik = Math.max(s.tesTerbaik, tot); }); }
        var rek = skor.dasar[0] < skor.dasar[1] - 1 ? "Dasar" : skor.menengah[0] < skor.menengah[1] - 1 ? "Menengah" : "Lanjut", h = isi.querySelector("[data-hasil]");
        h.hidden = false; h.innerHTML = "<b>Hasil</b><div>Dasar: " + skor.dasar[0] + "/" + skor.dasar[1] + " · Menengah: " + skor.menengah[0] + "/" + skor.menengah[1] + " · Lanjut: " + skor.lanjut[0] + "/" + skor.lanjut[1] + "</div><div>Mulai belajar dari tingkat: <b>" + rek + "</b>.</div>" +
          '<div class="met">Ini perkiraan kasar dari soal singkat, bukan hasil tes resmi. Ulangi tiap beberapa minggu untuk melihat kemajuan.</div>'; });
    }
    return tab(el, [["tier", "Progres & Tier", lihatTier], ["rencana", "Cara Belajar", lihatRencana], ["frasa", "Percakapan Siap Pakai", lihatFrasa]].concat(B.level.map(function (lv) { return [lv.id, lv.nama, lihatTingkat(lv)]; })).concat([["latihan", "Latihan Soal", lihatLatihan], ["tes", "Tes Level", lihatTes]]), "fbBasic", true);
  }
  var bukaBasic = {};
  window.FileBosBasic = vBasic;
})();
