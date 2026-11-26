/* Excel Bos (Teguh 2026-11-19): lembar hitung cepat di File Bos, tepat di bawah Overview.
   Rumus basic (+ - * / ^ %, perbandingan, SUM, AVERAGE, MIN, MAX, COUNT, PRODUCT, ROUND, ABS, IF); rumus bisa "diukir" pakai
   klik/seret sel atau panah keyboard seperti Excel. Ribbon ala Excel (koreksi Bos 2026-11-19, kotak merah di screenshot):
   font + ukuran, B/I/U, garis tabel, warna isi & tulisan, posisi tulisan (atas/tengah/bawah, kiri/tengah/kanan), miring tulisan,
   Wrap Text, Merge & Center, format General/Number/Accounting/Percentage/Text, desimal, Conditional Formatting, Sort & Filter.
   Simpan (di browser ini) dan Download .xlsx (xlsx-js-style supaya format ikut; cadangan SheetJS, tanpa internet CSV). */
(function () {
  var KUNCI = "fileBosExcel", KUNCI_DRAFT = "fileBosExcelDraft", KOL = 26;
  var FONT = ["Calibri", "Aptos Narrow", "Arial", "Arial Narrow", "Cambria", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Segoe UI", "Inter"];
  var UKURAN = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48];
  var WARNA = ["#000000", "#FFFFFF", "#D9D9D9", "#808080", "#FF0000", "#C00000", "#FFC000", "#FFFF00", "#92D050", "#00B050", "#00B0F0", "#0070C0", "#002060", "#7030A0", "#F8CBAD", "#DDEBF7"];
  var CFG = { merah: { isi: "#FFC7CE", teks: "#9C0006", nama: "Isi merah muda, teks merah tua" }, kuning: { isi: "#FFEB9C", teks: "#9C5700", nama: "Isi kuning, teks kuning tua" }, hijau: { isi: "#C6EFCE", teks: "#006100", nama: "Isi hijau, teks hijau tua" } };
  var NF_NAMA = { general: "General", number: "Number", accounting: "Accounting", percent: "Percentage", text: "Text" };
  function huruf(c) { return String.fromCharCode(65 + c); }
  function alamat(r, c) { return huruf(c) + (r + 1); }
  function urai(a) { var m = /^\$?([A-Z]{1,3})\$?(\d+)$/.exec(String(a).toUpperCase()); if (!m || m[1].length > 1) return null; return { r: +m[2] - 1, c: m[1].charCodeAt(0) - 65 }; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function baca(k) { try { var s = localStorage.getItem(k); if (s) return JSON.parse(s); } catch (x) {} return null; }
  function tulis(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (x) {} }
  function luma(h) { var n = parseInt(String(h).slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
  function kena(m, g) { return !(m.r2 < g.r1 || m.r1 > g.r2 || m.c2 < g.c1 || m.c1 > g.c2); }
  function rapikan(o) {
    o = o || {}; o.sel = o.sel || {}; o.gaya = o.gaya || {}; o.merge = o.merge || []; o.cf = o.cf || []; o.filter = o.filter || null;
    o.lebar = o.lebar || {}; o.tinggi = o.tinggi || {}; o.brs = Math.max(100, +o.brs || 0); o.nama = o.nama || "Excel Bos";
    /* versi pertama menyimpan format per kolom (umum/rp/angka/teks): pindahkan ke format per sel */
    if (o.fmt) { Object.keys(o.sel).forEach(function (k) { var f = o.fmt[k.replace(/\d+$/, "")]; if (!f || !f.t || f.t === "umum") return;
      var s = o.gaya[k] || {}; if (!s.nf) { s.nf = { rp: "accounting", angka: "number", teks: "text" }[f.t]; if (f.d != null) s.d = f.d; } o.gaya[k] = s; }); delete o.fmt; }
    return o;
  }

  /* angka ketikan Bos: "1.500.000", "Rp 25.000", "12,5", "1,500.75", "10%" */
  function angkaDari(s) {
    var t = String(s).replace(/\s/g, ""), neg = false, pct = false;
    if (t[0] === "-") { neg = true; t = t.slice(1); }
    t = t.replace(/^rp\.?/i, ""); if (t[0] === "-") { neg = !neg; t = t.slice(1); }
    if (/%$/.test(t)) { pct = true; t = t.slice(0, -1); }
    var titik = t.lastIndexOf("."), koma = t.lastIndexOf(",");
    if (titik >= 0 && koma >= 0) t = koma > titik ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
    else if (koma >= 0) t = /^\d{1,3}(,\d{3})+$/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".");
    else if (titik >= 0 && /^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
    if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
    var n = parseFloat(t); if (neg) n = -n; return pct ? n / 100 : n;
  }
  function luarKutip(s, f) { return s.replace(/("(?:[^"]|"")*")|([^"]+)/g, function (m, q, o) { return q || f(o); }); }

  /* ---------- mesin rumus: token -> pohon -> nilai ---------- */
  function token(s) {
    var re = /\s*(?:(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\.\d+)|("(?:[^"]|"")*")|(\$?[A-Za-z]{1,3}\$?\d+)(?![A-Za-z(])|([A-Za-z_][A-Za-z0-9_.]*)|(<=|>=|<>|[-+*\/^&%(),;:<>=]))/y, t = [], m;
    re.lastIndex = 0;
    while (re.lastIndex < s.length) {
      var i = re.lastIndex; m = re.exec(s);
      if (!m) { if (/^\s*$/.test(s.slice(i))) break; throw { e: "#ERROR!" }; }
      if (m[1]) t.push({ n: parseFloat(m[1]) }); else if (m[2]) t.push({ s: m[2].slice(1, -1).replace(/""/g, '"') });
      else if (m[3]) t.push({ r: m[3].replace(/\$/g, "").toUpperCase() }); else if (m[4]) t.push({ f: m[4].toUpperCase() }); else if (m[5]) t.push({ o: m[5] });
    }
    return t;
  }
  function pohon(src) {
    var tk = token(src), p = 0;
    function op(re) { var t = tk[p]; if (t && t.o && re.test(t.o)) { p++; return t.o; } return null; }
    function perlu(o) { if (!op(new RegExp("^\\" + o + "$"))) throw { e: "#ERROR!" }; }
    function biner(bawah, re) { return function () { var a = bawah(), o; while ((o = op(re))) a = ["op", o, a, bawah()]; return a; }; }
    function una() { var o = op(/^[-+]$/); if (o) { var a = una(); return o === "-" ? ["neg", a] : a; } var b = prim(); while (op(/^%$/)) b = ["pct", b]; return b; }
    var pangkat = biner(una, /^\^$/), kali = biner(pangkat, /^[*\/]$/), tambah = biner(kali, /^[-+]$/), sambung = biner(tambah, /^&$/), ekspr = biner(sambung, /^(=|<>|<|>|<=|>=)$/);
    function prim() {
      var t = tk[p++]; if (!t) throw { e: "#ERROR!" };
      if ("n" in t) return ["n", t.n]; if ("s" in t) return ["s", t.s];
      if (t.r) { if (tk[p] && tk[p].o === ":" && tk[p + 1] && tk[p + 1].r) { p += 2; return ["rng", t.r, tk[p - 1].r]; } return ["ref", t.r]; }
      if (t.f) {
        if (tk[p] && tk[p].o === "(") { p++; var arg = []; if (!(tk[p] && tk[p].o === ")")) { do { arg.push(ekspr()); } while (op(/^[,;]$/)); } perlu(")"); return ["fn", t.f, arg]; }
        if (t.f === "TRUE" || t.f === "FALSE") return ["n", t.f === "TRUE"];
        throw { e: "#NAME?" };
      }
      if (t.o === "(") { var a = ekspr(); perlu(")"); return a; }
      throw { e: "#ERROR!" };
    }
    var akar = ekspr(); if (p < tk.length) throw { e: "#ERROR!" }; return akar;
  }

  function ik(d) { return '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="' + d + '"/></svg>'; }
  var CSS =
    ".xl{position:relative;display:flex;flex-direction:column;gap:6px;flex:1;min-height:0;font-size:13px;--xl-garis:#dfe4ee}" +
    ".xl-rb{display:flex;flex-wrap:wrap;align-items:stretch;background:#ffffff08;border:1px solid var(--kp-line);border-radius:8px;padding:3px 0}" +
    ".xl-grp{display:flex;flex-direction:column;gap:3px;padding:2px 8px;border-right:1px solid var(--kp-line)}.xl-grp:last-child{border-right:0}.xl-grp.sp{flex:1;border-right:0}" +
    ".xl-row{display:flex;gap:2px;align-items:center}.xl-cap{font-size:10px;color:var(--kp-muted);text-align:center;margin-top:auto;padding-top:1px}" +
    ".xl-rb button{background:none;border:1px solid transparent;color:var(--kp-fg);border-radius:4px;min-width:24px;height:24px;padding:0 5px;cursor:pointer;font:600 12px Inter,system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:3px;white-space:nowrap}" +
    ".xl-rb button:hover{background:#ffffff14}.xl-rb button.on{background:#4fd18b2e;border-color:#4fd18b80}.xl-rb button.mn{min-width:13px;padding:0 1px;font-size:8px;margin-left:-2px}" +
    ".xl-rb button.big{flex-direction:column;height:auto;min-height:52px;padding:3px 6px;font-size:11px;line-height:1.2;gap:2px}.xl-rb button.big b{font-size:17px;line-height:1}" +
    ".xl-rb select,.xl-rb input{height:24px;padding:0 4px;font-size:12px;width:auto}.xl-fx .xl-nm{width:120px;flex:none}.xl-fx button{flex:none;white-space:nowrap}" +
    ".xl-fx{flex-wrap:wrap}.xl-fx .xl-f{min-width:200px}.xl-sw{display:block;width:16px;height:4px;border-radius:1px;margin-top:-2px}.xl-ws{display:inline-flex;flex-direction:column;align-items:center;line-height:1}" +
    ".xl-fx{display:flex;gap:6px;align-items:center}.xl-fx .xl-ab{width:82px;flex:none;text-align:center;font:600 12px 'IBM Plex Mono',Consolas,monospace}.xl-fx .xl-f{flex:1;font-family:'IBM Plex Mono',Consolas,monospace}.xl-fx i{font:italic 700 13px Georgia,serif;color:var(--kp-muted)}" +
    ".xl-grid{position:relative;flex:1;min-height:180px;overflow:auto;border:1px solid var(--kp-line);border-radius:6px;outline:none;background:var(--fb-dalam,#141824)}" +
    ".xl-grid:focus{border-color:#4f8a6b}.xl-t{border-collapse:separate;border-spacing:0;table-layout:fixed;user-select:none}" +
    ".xl-t th{position:sticky;top:0;z-index:2;background:#1d2232;color:var(--kp-muted);font:600 11.5px Inter,system-ui,sans-serif;height:24px;border-right:1px solid var(--kp-line);border-bottom:1px solid var(--kp-line);cursor:pointer;padding:0}" +
    ".xl-t th.xl-bh{position:sticky;left:0;z-index:1;text-align:center}.xl-t th.xl-pj{left:0;z-index:3}.xl-t th.on{background:#27402f;color:#9fe3b9}.xl-t th .xl-rs{position:absolute;right:-3px;top:0;width:7px;height:100%;cursor:col-resize;z-index:4}" +
    ".xl-t td{height:24px;padding:1px 5px;border-right:1px solid #ffffff12;border-bottom:1px solid #ffffff12;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--kp-fg);cursor:cell;font:13.2px Calibri,Inter,system-ui,sans-serif;vertical-align:bottom}" +
    ".xl-t td.err{color:#f07a70}.xl-t td.pilih{box-shadow:inset 0 0 0 999px #4fd18b24}.xl-t td.aktif{outline:2px solid #4fd18b;outline-offset:-2px}.xl-t td.titik{outline:2px dashed #6fb3ff;outline-offset:-2px}" +
    ".xl-t td.edit{padding:0;overflow:visible}.xl-t td.edit input{width:100%;height:100%;min-height:22px;border:0;border-radius:0;outline:2px solid #4fd18b;outline-offset:-2px;padding:0 4px;background:#0f121b;color:var(--kp-fg);font:13.2px Calibri,Inter,sans-serif}" +
    ".xl-acc{display:flex;justify-content:space-between;gap:6px}.xl-acc i{font-style:normal}" +
    ".r-ccw45{display:inline-block;transform:rotate(-45deg)}.r-cw45{display:inline-block;transform:rotate(45deg)}.r-vert{display:inline-block;writing-mode:vertical-lr;text-orientation:upright}.r-up{display:inline-block;writing-mode:vertical-rl;transform:rotate(180deg)}.r-down{display:inline-block;writing-mode:vertical-rl}" +
    ".xl-t td.xl-fh{position:relative;padding-right:20px}.xl-fb{position:absolute;right:2px;bottom:2px;width:16px;height:16px;font-size:9px;border:1px solid #fff5;background:#2a3142;color:#fff;border-radius:3px;cursor:pointer;padding:0;line-height:1}.xl-fb.on{background:#2f7a55}" +
    ".xl-pop{position:absolute;z-index:50;background:#1a1f2c;border:1px solid var(--kp-line);border-radius:8px;padding:6px;box-shadow:0 8px 24px #0009;min-width:180px;max-height:340px;overflow:auto;display:flex;flex-direction:column;gap:3px;font-size:12.5px;color:var(--kp-fg)}" +
    ".xl-pop button.it{background:none;border:0;color:var(--kp-fg);text-align:left;padding:5px 8px;border-radius:5px;cursor:pointer;font:12.5px Inter,system-ui,sans-serif}.xl-pop button.it:hover{background:#ffffff14}" +
    ".xl-pop .jd{font-weight:700;font-size:12px;color:var(--kp-muted);padding:2px 4px}.xl-pop hr{border:0;border-top:1px solid var(--kp-line);margin:3px 0;width:100%}" +
    ".xl-pal{display:grid;grid-template-columns:repeat(8,20px);gap:4px;padding:2px}.xl-pal button{width:20px;height:20px;border:1px solid #fff4;border-radius:3px;padding:0;cursor:pointer}" +
    ".xl-pop label{display:flex;gap:6px;align-items:center;padding:2px 4px;cursor:pointer}.xl-pop input[type=checkbox]{width:15px;height:15px;accent-color:#4fd18b}.xl-pop .bar{display:flex;gap:6px;justify-content:flex-end;margin-top:4px}" +
    ".xl-pop input:not([type]),.xl-pop input[type=text],.xl-pop select{width:100%}.xl-pop .dft{max-height:170px;overflow:auto;border:1px solid var(--kp-line);border-radius:6px;padding:3px}" +
    ".xl-bawah{display:flex;gap:12px;align-items:center;flex-wrap:wrap;font-size:11.5px;color:var(--kp-muted)}.xl-bawah b{color:var(--kp-fg);font:600 12px 'IBM Plex Mono',Consolas,monospace}.xl-bawah .sp{flex:1}";

  window.FileBos = window.FileBos || {};
  window.FileBos.excel = function (el) {
    var S = rapikan(baca(KUNCI_DRAFT) || baca(KUNCI)), adaDraft = !!baca(KUNCI_DRAFT);
    var A = { r: 0, c: 0 }, U = { r: 0, c: 0 }, ed = null, sisip = null, titik = null, seret = null, T = [], TR = [];
    var cache = {}, lagi = {}, riwayat = [], maju = [], MP = { anchor: {}, cover: {} }, HID = {}, pop = null;
    var pilihan = { bd: "all", isi: "#FFFF00", warna: "#FF0000" };

    if (!document.getElementById("xl-css")) { var st = document.createElement("style"); st.id = "xl-css"; document.head.appendChild(st); }
    document.getElementById("xl-css").textContent = CSS;

    var g1 = function (act, isi, judul, kls) { return '<button data-act="' + act + '" title="' + esc(judul) + '"' + (kls ? ' class="' + kls + '"' : "") + ">" + isi + "</button>"; };
    el.innerHTML = '<div class="fb xl">' +
      '<div class="xl-rb">' +
        '<div class="xl-grp"><div class="xl-row"><select data-font title="Font">' + FONT.map(function (f) { return '<option style="font-family:\'' + f + '\'">' + f + "</option>"; }).join("") + '</select>' +
          '<select data-size title="Ukuran font">' + UKURAN.map(function (u) { return "<option>" + u + "</option>"; }).join("") + "</select></div>" +
          '<div class="xl-row">' + g1("b", "<b>B</b>", "Bold (Ctrl+B)") + g1("i", "<i style=\"font-family:Georgia\">I</i>", "Italic (Ctrl+I)") + g1("u", "<u>U</u>", "Underline (Ctrl+U)") +
          g1("bd", "▦", "Garis tabel (Borders)") + g1("bd-m", "▼", "Pilihan garis tabel", "mn") +
          g1("isi", '<span class="xl-ws">◩<i class="xl-sw" data-swi></i></span>', "Warna isi sel (Fill Color)") + g1("isi-m", "▼", "Pilih warna isi", "mn") +
          g1("warna", '<span class="xl-ws"><b>A</b><i class="xl-sw" data-swt></i></span>', "Warna tulisan (Font Color)") + g1("warna-m", "▼", "Pilih warna tulisan", "mn") +
          '</div><div class="xl-cap">Font</div></div>' +
        '<div class="xl-grp"><div class="xl-row">' + g1("va-top", ik("M2 2h12M5 5.5h6M5 8.5h6"), "Rata atas (Top Align)") + g1("va-mid", ik("M2 2h12M5 6.5h6M5 9.5h6M2 14h12"), "Rata tengah (Middle Align)") + g1("va-bot", ik("M5 7.5h6M5 10.5h6M2 14h12"), "Rata bawah (Bottom Align)") +
          g1("rot-m", '<span style="display:inline-block;transform:rotate(-40deg);font-size:11px">ab</span>▾', "Miringkan tulisan (Orientation)") + g1("wrap", "↵ Wrap Text", "Tulisan panjang turun ke baris baru di dalam sel") + "</div>" +
          '<div class="xl-row">' + g1("ha-left", ik("M2 3h12M2 6.5h8M2 10h12M2 13.5h8"), "Rata kiri") + g1("ha-center", ik("M2 3h12M4 6.5h8M2 10h12M4 13.5h8"), "Rata tengah") + g1("ha-right", ik("M2 3h12M6 6.5h8M2 10h12M6 13.5h8"), "Rata kanan") +
          g1("mg", "⇔ Merge &amp; Center", "Gabung sel terpilih dan tulisan di tengah") + g1("mg-m", "▼", "Pilihan gabung sel", "mn") + '</div><div class="xl-cap">Alignment</div></div>' +
        '<div class="xl-grp"><div class="xl-row"><select data-nf title="Format angka">' + Object.keys(NF_NAMA).map(function (k) { return '<option value="' + k + '">' + NF_NAMA[k] + "</option>"; }).join("") + "</select></div>" +
          '<div class="xl-row">' + g1("acc", "Rp", "Accounting (format rupiah ala Excel)") + g1("pct", "%", "Percentage") + g1("dec-1", ".00→.0", "Kurangi angka di belakang koma") + g1("dec+1", ".0→.00", "Tambah angka di belakang koma") + '</div><div class="xl-cap">Number</div></div>' +
        '<div class="xl-grp"><div class="xl-row">' + g1("cf-m", "<b>▤</b>Conditional<br>Formatting ▾", "Warnai sel otomatis sesuai aturan", "big") + '</div><div class="xl-cap">Styles</div></div>' +
        '<div class="xl-grp"><div class="xl-row">' + g1("sum", "Σ AutoSum", "Jumlahkan angka di atas / kiri sel ini") + g1("fn-m", "fx Rumus ▾", "Sisipkan rumus") + "</div>" +
          '<div class="xl-row">' + g1("sf-m", "⇅ Sort &amp; Filter ▾", "Urutkan dan saring data") + '</div><div class="xl-cap">Editing</div></div>' +
      "</div>" +
      '<div class="xl-fx"><input class="xl-ab" data-ab readonly><i>fx</i><input class="xl-f" data-fx placeholder="Isi sel atau rumus, contoh =A1*B1 atau =SUM(A1:A10)">' +
        '<input class="xl-nm" data-nama title="'+(document.documentElement.lang==="id"?"Nama file saat di-download":"File name when downloaded")+'" placeholder="'+(document.documentElement.lang==="id"?"Nama file":"File name")+'"><button class="fb-b" data-act="simpan" title="Ctrl+S">💾 '+(document.documentElement.lang==="id"?"Simpan":"Save")+'</button><button class="fb-b" data-act="unduh">⬇ Download .xlsx</button><button class="fb-g bahaya" data-act="kosong">'+(document.documentElement.lang==="id"?"Kosongkan":"Clear")+'</button></div>' +
      '<div class="xl-grid" tabindex="0" data-grid></div>' +
      '<div class="xl-bawah"><span data-st></span><span class="sp"></span><span data-sv></span></div>' +
      '<div class="met">Ketik lalu Enter (turun) atau Tab (kanan). Rumus diawali "=": setelah "=" atau tanda + - * / ( , tekan panah untuk menunjuk sel (Shift+panah = rentang), atau klik/seret sel. F2 / klik dua kali = ubah isi, F4 = kunci alamat ($A$1). Shortcut sama seperti Excel (Ctrl+C/X/V, Ctrl+Z/Y, Ctrl+D/R, Ctrl+Enter, Alt+=, Ctrl+Shift+$ % ! ~ &amp; _ L, Ctrl+; dll.). "1.500" dibaca seribu lima ratus, "1,5" dibaca satu koma lima.</div>' +
    "</div>";
    var root = el.querySelector(".xl"), q = function (s) { return el.querySelector(s); };
    var grid = q("[data-grid]"), fx = q("[data-fx]"), ab = q("[data-ab]"), selNf = q("[data-nf]"), selFont = q("[data-font]"), selSize = q("[data-size]"), stEl = q("[data-st]"), svEl = q("[data-sv]"), namaIn = q("[data-nama]");
    var inp = document.createElement("input"); inp.setAttribute("autocomplete", "off");
    namaIn.value = S.nama;
    function warnaTombol() { q("[data-swi]").style.background = pilihan.isi || "transparent"; q("[data-swt]").style.background = pilihan.warna || "var(--kp-fg)"; }
    warnaTombol();

    /* ---------- format angka & gaya sel ---------- */
    function gy(k) { return S.gaya[k] || {}; }
    function nf(k) { var s = gy(k), t = s.nf || "general"; return { t: t, d: s.d != null ? s.d : (t === "number" ? 2 : 0) }; }
    /* lebar bawaan = pas lebar layar (Imperium); kolom yang sudah ditarik pakai lebarnya sendiri, seperti Excel */
    function lebarBawaan() { var g = el.querySelector("[data-grid]"), w = g ? g.clientWidth : 0; if (!w) return 100; var tetap = 0, n = 0; for (var i = 0; i < KOL; i++) { var v = S.lebar[huruf(i)]; if (v) tetap += v; else n++; } return n ? Math.max(12, Math.floor((w - 44 - tetap) / n)) : 100; }
    function lebar(c) { return S.lebar[huruf(c)] || lebarBawaan(); }
    function tinggi(r) { return (S.tinggi && +S.tinggi[r]) || 0; }
    function isiSel(k, v) {
      var raw = S.sel[k], f = nf(k);
      if (v && v.e) return { h: esc(v.e), al: "center", err: 1 };
      if (typeof v === "boolean") return { h: v ? "TRUE" : "FALSE", al: "center" };
      if (typeof v !== "number") return { h: esc(v), al: "left" };
      if (f.t === "text") return { h: esc(raw[0] === "=" ? String(v) : raw), al: "left" };
      if (!isFinite(v)) return { h: "#NUM!", al: "center", err: 1 };
      var o = { minimumFractionDigits: f.d, maximumFractionDigits: f.d };
      if (f.t === "general") return { h: esc(v.toLocaleString("id-ID", { maximumFractionDigits: 10 })), al: "right" };
      if (f.t === "number") return { h: esc(v.toLocaleString("id-ID", o)), al: "right" };
      if (f.t === "percent") return { h: esc((v * 100).toLocaleString("id-ID", o) + "%"), al: "right" };
      var a = Math.abs(v), s = Math.round(a * Math.pow(10, f.d)) === 0 ? "-" : a.toLocaleString("id-ID", o);
      s = v < 0 && s !== "-" ? "(" + s + ")" : s + " ";
      return { h: '<span class="xl-acc"><i>Rp</i><span>' + esc(s) + "</span></span>", al: "acc" };
    }
    function polos(k) { var raw = S.sel[k]; if (raw == null || raw === "") return ""; return isiSel(k, nilai(k)).h.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/[\s ]+/g, " ").trim(); }
    function cssSel(s, cfx, al) {
      var c = [], fill = (cfx && cfx.isi) || s.fill, warna = (cfx && cfx.teks) || s.color;
      if (s.font) c.push("font-family:'" + s.font + "',Calibri,Inter,sans-serif");
      if (s.sz) c.push("font-size:" + (s.sz * 1.2) + "px");
      if (s.b) c.push("font-weight:700"); if (s.i) c.push("font-style:italic"); if (s.u) c.push("text-decoration:underline");
      if (fill) { c.push("background:" + fill); if (!warna) warna = luma(fill) > 0.55 ? "#111111" : "#f3f5f9"; } /* teks kontras otomatis */
      if (warna) c.push("color:" + warna);
      var ha = s.ha || (al === "acc" ? "" : al); if (ha) c.push("text-align:" + ha);
      if (s.va) c.push("vertical-align:" + { top: "top", mid: "middle", bot: "bottom" }[s.va]);
      if (s.wrap) c.push("white-space:normal;overflow-wrap:anywhere");
      if (s.bd) ["t", "b", "l", "r"].forEach(function (x) { if (s.bd[x]) c.push("border-" + { t: "top", b: "bottom", l: "left", r: "right" }[x] + ":" + (s.bd[x] === 2 ? "2px" : "1px") + " solid var(--xl-garis)"); });
      return c.join(";");
    }

    /* ---------- hitung nilai sel ---------- */
    function nilai(k) {
      if (cache.hasOwnProperty(k)) return cache[k];
      var raw = S.sel[k], v;
      if (raw == null || raw === "") v = "";
      else if (raw[0] === "=") {
        if (lagi[k]) return { e: "#CIRC!" };
        lagi[k] = 1;
        try { v = hitung(pohon(raw.slice(1))); if (v && v.range) v = v.range.length === 1 ? v.range[0] : { e: "#VALUE!" }; if (typeof v === "number" && !isFinite(v)) v = { e: "#NUM!" }; }
        catch (x) { v = x && x.e ? x : { e: "#ERROR!" }; }
        delete lagi[k];
      } else { var n = angkaDari(raw); v = n === null ? raw : n; }
      cache[k] = v; return v;
    }
    function skalar(v) { if (v && v.range) { if (v.range.length !== 1) throw { e: "#VALUE!" }; v = v.range[0]; } if (v && v.e) throw v; return v; }
    function num(v) { v = skalar(v); if (typeof v === "number") return v; if (typeof v === "boolean") return v ? 1 : 0; if (v === "" || v == null) return 0; var n = angkaDari(v); if (n === null) throw { e: "#VALUE!" }; return n; }
    function kumpul(arg) { var a = []; arg.forEach(function (x) { var v = hitung(x);
      if (v && v.range) v.range.forEach(function (y) { if (y && y.e) throw y; if (typeof y === "number") a.push(y); }); else a.push(num(v)); }); return a; }
    var FN = {
      SUM: function (g) { return kumpul(g).reduce(function (s, x) { return s + x; }, 0); },
      PRODUCT: function (g) { var a = kumpul(g); return a.length ? a.reduce(function (s, x) { return s * x; }, 1) : 0; },
      AVERAGE: function (g) { var a = kumpul(g); if (!a.length) throw { e: "#DIV/0!" }; return a.reduce(function (s, x) { return s + x; }, 0) / a.length; },
      MIN: function (g) { var a = kumpul(g); return a.length ? Math.min.apply(null, a) : 0; },
      MAX: function (g) { var a = kumpul(g); return a.length ? Math.max.apply(null, a) : 0; },
      COUNT: function (g) { var n = 0; g.forEach(function (x) { var v = hitung(x); if (v && v.range) v.range.forEach(function (y) { if (typeof y === "number") n++; }); else { try { num(v); n++; } catch (e) {} } }); return n; },
      ROUND: function (g) { var x = num(hitung(g[0])), d = g[1] ? Math.trunc(num(hitung(g[1]))) : 0, f = Math.pow(10, d); return (x < 0 ? -1 : 1) * Math.round(Math.abs(x) * f * (1 + Number.EPSILON)) / f; },
      ABS: function (g) { return Math.abs(num(hitung(g[0]))); },
      IF: function (g) { var c = skalar(hitung(g[0])); if (typeof c === "string") { if (c === "") c = 0; else throw { e: "#VALUE!" }; }
        return c ? (g[1] ? skalar(hitung(g[1])) : true) : (g[2] ? skalar(hitung(g[2])) : false); }
    };
    function banding(a, b, o) {
      a = skalar(a); b = skalar(b);
      if (a === "" && typeof b === "number") a = 0; if (b === "" && typeof a === "number") b = 0;
      if (typeof a === "string") a = a.toLowerCase(); if (typeof b === "string") b = b.toLowerCase();
      switch (o) { case "=": return a === b; case "<>": return a !== b; case "<": return a < b; case ">": return a > b; case "<=": return a <= b; default: return a >= b; }
    }
    function hitung(n) {
      switch (n[0]) {
        case "n": case "s": return n[1];
        case "ref": { var p = urai(n[1]); if (!p || p.c >= KOL) throw { e: "#REF!" }; return nilai(alamat(p.r, p.c)); }
        case "rng": { var a = urai(n[1]), b = urai(n[2]); if (!a || !b || a.c >= KOL || b.c >= KOL) throw { e: "#REF!" }; var isi = [];
          for (var r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) for (var c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) isi.push(nilai(alamat(r, c)));
          return { range: isi }; }
        case "neg": return -num(hitung(n[1]));
        case "pct": return num(hitung(n[1])) / 100;
        case "fn": if (!FN[n[1]]) throw { e: "#NAME?" }; return FN[n[1]](n[2]);
        case "op": {
          var o = n[1];
          if (o === "&") { var s1 = skalar(hitung(n[2])), s2 = skalar(hitung(n[3])); return String(s1) + String(s2); }
          if (/^(=|<>|<|>|<=|>=)$/.test(o)) return banding(hitung(n[2]), hitung(n[3]), o);
          var x = num(hitung(n[2])), y = num(hitung(n[3]));
          if (o === "+") return x + y; if (o === "-") return x - y; if (o === "*") return x * y; if (o === "^") return Math.pow(x, y);
          if (y === 0) throw { e: "#DIV/0!" }; return x / y;
        }
      }
      throw { e: "#ERROR!" };
    }

    /* ---------- conditional formatting & filter ---------- */
    function cfCocok(a, v, k, dup) {
      var n = typeof v === "number", x = angkaDari(a.a), y = angkaDari(a.b);
      switch (a.op) {
        case "gt": return n && x !== null && v > x; case "lt": return n && x !== null && v < x;
        case "bt": return n && x !== null && y !== null && v >= Math.min(x, y) && v <= Math.max(x, y);
        case "eq": return x !== null && n ? v === x : String(v).toLowerCase() === String(a.a).toLowerCase();
        case "tx": return polos(k).toLowerCase().indexOf(String(a.a).toLowerCase()) >= 0;
        case "dup": return dup[polos(k).toLowerCase()] > 1;
      }
      return false;
    }
    function hitungCF() {
      var map = {};
      S.cf.forEach(function (a) { var g = a.g, r, c, k, dup = {};
        if (a.op === "dup") for (r = g.r1; r <= g.r2; r++) for (c = g.c1; c <= g.c2; c++) { k = alamat(r, c); if (S.sel[k]) { var p = polos(k).toLowerCase(); dup[p] = (dup[p] || 0) + 1; } }
        for (r = g.r1; r <= g.r2; r++) for (c = g.c1; c <= g.c2; c++) { k = alamat(r, c); if (map[k] || S.sel[k] == null || S.sel[k] === "") continue; if (cfCocok(a, nilai(k), k, dup)) map[k] = CFG[a.gaya]; } });
      return map;
    }
    function adaBaris(r, a, b) { if (r < 0 || r >= S.brs) return false; for (var c = Math.max(0, a); c <= Math.min(KOL - 1, b); c++) if (isi(r, c)) return true; return false; }
    function adaKol(c, a, b) { if (c < 0 || c >= KOL) return false; for (var r = Math.max(0, a); r <= Math.min(S.brs - 1, b); r++) if (isi(r, c)) return true; return false; }
    function wilayah() { /* "current region" ala Excel: blok data yang menyambung dengan sel aktif */
      var r1 = A.r, r2 = A.r, c1 = A.c, c2 = A.c, lagiL = true;
      while (lagiL) { lagiL = false;
        if (adaBaris(r1 - 1, c1 - 1, c2 + 1)) { r1--; lagiL = true; } if (adaBaris(r2 + 1, c1 - 1, c2 + 1)) { r2++; lagiL = true; }
        if (adaKol(c1 - 1, r1 - 1, r2 + 1)) { c1--; lagiL = true; } if (adaKol(c2 + 1, r1 - 1, r2 + 1)) { c2++; lagiL = true; } }
      return { r1: r1, r2: r2, c1: c1, c2: c2 };
    }
    function filterR2() { var f = S.filter, r = Math.max(f.r2 || f.r, f.r); while (r + 1 < S.brs && adaBaris(r + 1, f.c1, f.c2)) r++; return r; }
    function barisTersembunyi() {
      var h = {}, f = S.filter; if (!f || !f.sembunyi) return h; var r2 = filterR2();
      Object.keys(f.sembunyi).forEach(function (c) { var daftar = f.sembunyi[c]; for (var r = f.r + 1; r <= r2; r++) if (daftar.indexOf(polos(alamat(r, +c))) >= 0) h[r] = 1; });
      return h;
    }

    /* ---------- grid ---------- */
    function htmlBaris(r) { var h = '<tr' + (tinggi(r) ? ' style="height:' + tinggi(r) + 'px"' : "") + '><th class="xl-bh" data-r="' + r + '">' + (r + 1) + '<span class="xl-rr" data-rr="' + r + '" title="Seret untuk ubah tinggi baris · klik dua kali untuk kembali"></span></th>'; for (var c = 0; c < KOL; c++) h += '<td data-r="' + r + '" data-c="' + c + '"></td>'; return h + "</tr>"; }
    function bangun() {
      var h = '<table class="xl-t"><colgroup><col style="width:42px">';
      for (var c = 0; c < KOL; c++) h += '<col style="width:' + lebar(c) + 'px">';
      h += '</colgroup><thead><tr><th class="xl-pj" title="Pilih semua"></th>';
      for (c = 0; c < KOL; c++) h += '<th class="xl-kh" data-c="' + c + '">' + huruf(c) + '<span class="xl-rs" data-rs="' + c + '" title="Seret untuk ubah lebar kolom · klik dua kali untuk kembali"></span></th>';
      h += "</tr></thead><tbody>"; for (var r = 0; r < S.brs; r++) h += htmlBaris(r);
      grid.innerHTML = h + "</tbody></table>"; petakan();
    }
    function petakan() { T = []; TR = []; grid.querySelectorAll("tbody tr").forEach(function (tr, r) { TR[r] = tr; T[r] = Array.prototype.slice.call(tr.querySelectorAll("td")); }); }
    function tambahBaris(n) { var tb = grid.querySelector("tbody"), h = ""; for (var r = S.brs; r < S.brs + n; r++) h += htmlBaris(r); tb.insertAdjacentHTML("beforeend", h); S.brs += n; petakan(); }
    function lebarKolom() { var cols = grid.querySelectorAll("col"); for (var c = 0; c < KOL; c++) cols[c + 1].style.width = lebar(c) + "px"; }
    function petaMerge() { var a = {}, cv = {}; S.merge.forEach(function (m) { a[alamat(m.r1, m.c1)] = m; for (var r = m.r1; r <= m.r2; r++) for (var c = m.c1; c <= m.c2; c++) if (r !== m.r1 || c !== m.c1) cv[alamat(r, c)] = m; }); return { anchor: a, cover: cv }; }
    function mergeDi(r, c) { var k = alamat(r, c); return MP.anchor[k] || MP.cover[k] || null; }
    function gambarSemua() {
      cache = {}; lagi = {};
      var maks = -1; Object.keys(S.sel).concat(Object.keys(S.gaya)).forEach(function (k) { var p = urai(k); if (p) maks = Math.max(maks, p.r); });
      S.merge.forEach(function (m) { maks = Math.max(maks, m.r2); }); if (maks >= S.brs) tambahBaris(maks - S.brs + 20);
      MP = petaMerge(); HID = barisTersembunyi();
      var cfMap = hitungCF(), f = S.filter;
      for (var r = 0; r < S.brs; r++) {
        TR[r].style.display = HID[r] ? "none" : "";
        for (var c = 0; c < KOL; c++) {
          var td = T[r][c], k = alamat(r, c);
          if (MP.cover[k]) { if (td.style.display !== "none") { td.style.cssText = "display:none"; td._h = null; } continue; }
          var m = MP.anchor[k]; td.rowSpan = m ? m.r2 - m.r1 + 1 : 1; td.colSpan = m ? m.c2 - m.c1 + 1 : 1;
          var raw = S.sel[k], s = gy(k), info = raw == null || raw === "" ? { h: "", al: "" } : isiSel(k, nilai(k));
          td.style.cssText = cssSel(s, cfMap[k], info.al); td.classList.toggle("err", !!info.err);
          var fh = f && r === f.r && c >= f.c1 && c <= f.c2; td.classList.toggle("xl-fh", !!fh);
          if (ed && td === ed.td && inp.parentNode === td) continue;
          var h = info.h; if (s.rot && h) h = '<span class="r-' + s.rot + '">' + h + "</span>";
          if (fh) h += '<button class="xl-fb' + (f.sembunyi && f.sembunyi[c] ? " on" : "") + '" data-fc="' + c + '" title="Filter kolom ini">' + (f.sembunyi && f.sembunyi[c] ? "⏷" : "▾") + "</button>";
          if (td._h !== h) { td.innerHTML = h; td._h = h; }
        }
      }
      tandai();
    }
    var ditandai = [], titikTanda = [];
    /* RG: pilihan satu kolom/baris/semua (Ctrl+Space, Shift+Space, Ctrl+A) tanpa memindah sel aktif, seperti Excel */
    var RG = null;
    function rentang() { if (RG) return RG; return { r1: Math.min(A.r, U.r), r2: Math.max(A.r, U.r), c1: Math.min(A.c, U.c), c2: Math.max(A.c, U.c) }; }
    function on(act, v) { var b = root.querySelector('[data-act="' + act + '"]'); if (b) b.classList.toggle("on", !!v); }
    function tandai() {
      ditandai.forEach(function (x) { x.classList.remove("pilih", "aktif", "on"); }); ditandai = [];
      var g = rentang(), banyak = g.r1 !== g.r2 || g.c1 !== g.c2, r, c;
      for (r = g.r1; r <= g.r2; r++) for (c = g.c1; c <= g.c2; c++) if (banyak && T[r]) { T[r][c].classList.add("pilih"); ditandai.push(T[r][c]); }
      var ta = T[A.r][A.c]; ta.classList.add("aktif"); ditandai.push(ta);
      grid.querySelectorAll("th.xl-kh").forEach(function (th) { var c = +th.dataset.c; if (c >= g.c1 && c <= g.c2) { th.classList.add("on"); ditandai.push(th); } });
      for (r = g.r1; r <= Math.min(g.r2, S.brs - 1); r++) { var bh = TR[r].firstElementChild; bh.classList.add("on"); ditandai.push(bh); }
      var ka = alamat(A.r, A.c), s = gy(ka), mg = MP.anchor[ka];
      ab.value = banyak && !(mg && mg.r1 === g.r1 && mg.c1 === g.c1 && mg.r2 === g.r2 && mg.c2 === g.c2) ? alamat(g.r1, g.c1) + ":" + alamat(g.r2, g.c2) : ka;
      if (!ed) fx.value = S.sel[ka] || "";
      /* tombol ribbon mengikuti sel aktif */
      selNf.value = nf(ka).t; selFont.value = s.font || "Calibri"; selSize.value = String(s.sz || 11);
      on("b", s.b); on("i", s.i); on("u", s.u); on("wrap", s.wrap); on("mg", !!mergeDi(A.r, A.c));
      ["left", "center", "right"].forEach(function (x) { on("ha-" + x, s.ha === x); }); ["top", "mid", "bot"].forEach(function (x) { on("va-" + x, (s.va || "bot") === x); });
      on("acc", nf(ka).t === "accounting"); on("pct", nf(ka).t === "percent"); on("sf-m", !!S.filter);
      /* ringkasan bawah ala Excel: jumlah, rata-rata, banyak angka di area terpilih */
      if (banyak) { var a = []; for (r = g.r1; r <= g.r2; r++) { if (HID[r]) continue; for (c = g.c1; c <= g.c2; c++) { var v = nilai(alamat(r, c)); if (typeof v === "number") a.push(v); } }
        var jml = a.reduce(function (s, x) { return s + x; }, 0), fm = function (x) { return x.toLocaleString("id-ID", { maximumFractionDigits: 4 }); };
        stEl.innerHTML = a.length ? "Jumlah <b>" + fm(jml) + "</b> &nbsp; Rata-rata <b>" + fm(jml / a.length) + "</b> &nbsp; Banyak angka <b>" + a.length + "</b>" : ""; }
      else stEl.textContent = "";
    }
    function tandaiTitik() {
      titikTanda.forEach(function (x) { x.classList.remove("titik"); }); titikTanda = []; if (!titik) return;
      for (var r = Math.min(titik.ar, titik.r); r <= Math.max(titik.ar, titik.r); r++) for (var c = Math.min(titik.ac, titik.c); c <= Math.max(titik.ac, titik.c); c++) if (T[r]) { T[r][c].classList.add("titik"); titikTanda.push(T[r][c]); }
    }
    function lihatkan(r, c) {
      var td = T[r] && T[r][c]; if (!td || td.style.display === "none") return; var hh = 25, rw = 42;
      if (td.offsetTop - hh < grid.scrollTop) grid.scrollTop = td.offsetTop - hh; else if (td.offsetTop + td.offsetHeight > grid.scrollTop + grid.clientHeight) grid.scrollTop = td.offsetTop + td.offsetHeight - grid.clientHeight;
      if (td.offsetLeft - rw < grid.scrollLeft) grid.scrollLeft = td.offsetLeft - rw; else if (td.offsetLeft + td.offsetWidth > grid.scrollLeft + grid.clientWidth) grid.scrollLeft = td.offsetLeft + td.offsetWidth - grid.clientWidth;
    }
    function isi(r, c) { var v = S.sel[alamat(r, c)]; return v != null && v !== ""; }
    function lompat(r, c, dr, dc) {
      var ok = function (r, c) { return r >= 0 && c >= 0 && c < KOL && r < S.brs; }, nr = r + dr, nc = c + dc;
      if (!ok(nr, nc)) return { r: r, c: c };
      if (isi(r, c) && isi(nr, nc)) { while (ok(nr + dr, nc + dc) && isi(nr + dr, nc + dc)) { nr += dr; nc += dc; } return { r: nr, c: nc }; }
      while (ok(nr, nc) && !isi(nr, nc)) { if (!ok(nr + dr, nc + dc)) return { r: nr, c: nc }; nr += dr; nc += dc; }
      return { r: nr, c: nc };
    }
    function gerak(dr, dc, luas, jauh) {
      RG = null; var p = luas ? U : A, m = mergeDi(p.r, p.c), br = p.r, bc = p.c;
      if (m && !jauh) { if (dr > 0) br = m.r2; if (dr < 0) br = m.r1; if (dc > 0) bc = m.c2; if (dc < 0) bc = m.c1; }
      var n = jauh ? lompat(p.r, p.c, dr, dc) : { r: br + dr, c: bc + dc };
      while (dr && n.r >= 0 && n.r < S.brs && HID[n.r]) n.r += dr > 0 ? 1 : -1;
      n.r = Math.max(0, n.r); n.c = Math.max(0, Math.min(KOL - 1, n.c)); if (n.r >= S.brs) tambahBaris(20);
      if (!luas) { var m2 = mergeDi(n.r, n.c); if (m2) n = { r: m2.r1, c: m2.c1 }; }
      if (luas) U = n; else { A = n; U = { r: n.r, c: n.c }; }
      var mu = !luas && MP.anchor[alamat(A.r, A.c)]; if (mu) U = { r: mu.r2, c: mu.c2 };
      tandai(); lihatkan(U.r, U.c);
    }
    function pilihSel(r, c) { RG = null; var m = mergeDi(r, c); if (m) { A = { r: m.r1, c: m.c1 }; U = { r: m.r2, c: m.c2 }; } else { A = { r: r, c: c }; U = { r: r, c: c }; } }

    /* ---------- ubah isi (dengan riwayat untuk Ctrl+Z) ---------- */
    var svTeks = "";
    function statusSimpan() { svEl.textContent = adaDraft ? "● Ada perubahan, belum disimpan" : svTeks; svEl.style.color = adaDraft ? "#e3a84a" : ""; }
    function potret() { return JSON.stringify({ sel: S.sel, gaya: S.gaya, merge: S.merge, cf: S.cf, filter: S.filter }); }
    function ubah(fn) { riwayat.push(potret()); if (riwayat.length > 100) riwayat.shift(); maju = []; fn(); draft(); gambarSemua(); }
    function draft() { adaDraft = true; tulis(KUNCI_DRAFT, S); statusSimpan(); }
    function pulihkan(dari, ke) { if (!dari.length) return; ke.push(potret()); var o = JSON.parse(dari.pop()); S.sel = o.sel; S.gaya = o.gaya; S.merge = o.merge; S.cf = o.cf; S.filter = o.filter; draft(); gambarSemua(); }
    function rapiRumus(v) { return v[0] === "=" ? luarKutip(v, function (o) { return o.toUpperCase(); }) : v; }
    function setRaw(k, v) {
      if ((S.sel[k] || "") === v) return gambarSemua();
      ubah(function () { if (v === "") { delete S.sel[k]; return; } S.sel[k] = rapiRumus(v);
        /* seperti Excel: ketik "10%" jadi Percentage, ketik "Rp 25.000" jadi Accounting */
        var s = S.gaya[k] || {}; if (!s.nf && v[0] !== "=" && angkaDari(v) !== null) { if (/%\s*$/.test(v)) s.nf = "percent"; else if (/^\s*-?\s*rp/i.test(v)) s.nf = "accounting"; if (s.nf) S.gaya[k] = s; } });
    }
    function hapusRentang() { var g = rentang(); ubah(function () { for (var r = g.r1; r <= g.r2; r++) for (var c = g.c1; c <= g.c2; c++) delete S.sel[alamat(r, c)]; }); }
    function gayaRentang(fn) { if (ed) selesaiEdit(true); var g = rentang(); ubah(function () { for (var r = g.r1; r <= g.r2; r++) for (var c = g.c1; c <= g.c2; c++) {
      var k = alamat(r, c), s = S.gaya[k] || {}; fn(s, r, c, g); Object.keys(s).forEach(function (x) { if (s[x] == null || s[x] === false || s[x] === "") delete s[x]; });
      if (Object.keys(s).length) S.gaya[k] = s; else delete S.gaya[k]; } }); fokus(); }
    function fokus() { grid.focus({ preventScroll: true }); }

    /* ---------- menyunting sel ---------- */
    function lepasInp() { if (inp.parentNode) { var td = inp.parentNode; td.removeChild(inp); td.classList.remove("edit"); td._h = null; } }
    function mulaiEdit(awal, mode) {
      var td = T[A.r][A.c]; tandai(); lihatkan(A.r, A.c);
      td.textContent = ""; td._h = null; td.classList.add("edit"); td.appendChild(inp); inp.value = awal; fx.value = awal;
      ed = { el: inp, k: alamat(A.r, A.c), mode: mode, td: td }; sisip = null; titik = null; inp.focus(); inp.setSelectionRange(awal.length, awal.length);
    }
    function selesaiEdit(pakai) {
      if (!ed) return; var v = ed.el.value, k = ed.k; lepasInp(); ed = null; sisip = null; titik = null; tandaiTitik();
      if (pakai) setRaw(k, v); else gambarSemua();
      fokus();
    }
    function bisaSisip() {
      if (!ed || ed.el.value[0] !== "=") return false; var pos = ed.el.selectionStart;
      if (sisip && pos === sisip.end) return true; return /[=+\-*\/^(,;:<>&]$/.test(ed.el.value.slice(0, pos));
    }
    function sisipRef(t) {
      var e = ed.el, v = e.value, pos = e.selectionStart, a = sisip && pos === sisip.end ? sisip.start : pos;
      e.value = v.slice(0, a) + t + v.slice(pos); sisip = { start: a, end: a + t.length }; e.setSelectionRange(sisip.end, sisip.end);
      if (e === inp) fx.value = e.value;
    }
    function teksTitik() { return titik.ar === titik.r && titik.ac === titik.c ? alamat(titik.r, titik.c) : alamat(Math.min(titik.ar, titik.r), Math.min(titik.ac, titik.c)) + ":" + alamat(Math.max(titik.ar, titik.r), Math.max(titik.ac, titik.c)); }
    var ARAH = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] };
    function edKey(e) {
      if (!ed) return; var k = e.key, arah = ARAH[k], ctrl = e.ctrlKey || e.metaKey; e.stopPropagation();
      if (k === "Enter" && ctrl) { /* Ctrl+Enter: isi semua sel terpilih dengan ketikan yang sama, kursor tetap */
        e.preventDefault(); var v = ed.el.value, g = rentang(), r0 = A.r, c0 = A.c; lepasInp(); ed = null; sisip = null; titik = null; tandaiTitik();
        ubah(function () { for (var r = g.r1; r <= g.r2; r++) for (var c = g.c1; c <= g.c2; c++) { var kk = alamat(r, c); if (v === "") delete S.sel[kk]; else S.sel[kk] = geser(rapiRumus(v), r - r0, c - c0); } }); fokus(); }
      else if (k === "Enter") { e.preventDefault(); selesaiEdit(true); enter(e.shiftKey); }
      else if (k === "Tab") { e.preventDefault(); selesaiEdit(true); tab(e.shiftKey); }
      else if (k === "F4") { e.preventDefault(); kunciRef(ed.el); }
      else if (ctrl && e.code === "Semicolon") { e.preventDefault(); var t = e.shiftKey ? jamTeks() : hariIniTeks(), el2 = ed.el, ps = el2.selectionStart;
        el2.value = el2.value.slice(0, ps) + t + el2.value.slice(el2.selectionEnd); el2.setSelectionRange(ps + t.length, ps + t.length); if (el2 === inp) fx.value = el2.value; }
      else if (k === "Escape") { e.preventDefault(); selesaiEdit(false); }
      else if (arah && bisaSisip()) {
        /* mode tunjuk ala Excel: panah memilih sel untuk rumus, Shift+panah = rentang */
        e.preventDefault(); if (!titik || !sisip) titik = { ar: A.r, ac: A.c, r: A.r, c: A.c };
        var nr = Math.max(0, titik.r + arah[0]), nc = Math.max(0, Math.min(KOL - 1, titik.c + arah[1])); if (nr >= S.brs) tambahBaris(20);
        titik.r = nr; titik.c = nc; if (!e.shiftKey) { titik.ar = nr; titik.ac = nc; }
        sisipRef(teksTitik()); tandaiTitik(); lihatkan(nr, nc);
      }
      else if (arah && ed.mode === "masuk" && ed.el === inp) { e.preventDefault(); selesaiEdit(true); gerak(arah[0], arah[1]); }
    }
    inp.addEventListener("keydown", edKey); fx.addEventListener("keydown", edKey);
    function ketik() { sisip = null; if (titik) { titik = null; tandaiTitik(); } }
    inp.addEventListener("input", function () { ketik(); fx.value = inp.value; });
    fx.addEventListener("input", ketik);
    inp.addEventListener("blur", function () { setTimeout(function () { if (ed && ed.el === inp && document.activeElement !== inp) selesaiEdit(true); }, 0); });
    fx.addEventListener("focus", function () {
      if (!ed) { ed = { el: fx, k: alamat(A.r, A.c), mode: "ubah", td: null }; fx.value = S.sel[ed.k] || ""; sisip = null; }
      else if (ed.el === inp) { var v = inp.value, td = ed.td; ed.el = fx; lepasInp(); ed.td = null; td.textContent = v; fx.value = v; }
    });
    fx.addEventListener("blur", function () { setTimeout(function () { if (ed && ed.el === fx && document.activeElement !== fx) selesaiEdit(true); }, 0); });

    /* ---------- mouse ---------- */
    grid.addEventListener("mousedown", function (e) {
      if (e.target.dataset.rs != null) return;
      var fb = e.target.closest(".xl-fb"); if (fb) { e.preventDefault(); e.stopPropagation(); if (ed) selesaiEdit(true); popFilter(fb, +fb.dataset.fc); return; }
      var td = e.target.closest("td"), th = e.target.closest("th");
      if (td && td === (ed && ed.td) && inp.parentNode === td) return; /* klik di dalam kotak edit */
      if (td && bisaSisip()) { e.preventDefault(); var r0 = +td.dataset.r, c0 = +td.dataset.c; titik = { ar: r0, ac: c0, r: r0, c: c0 }; sisipRef(alamat(r0, c0)); tandaiTitik(); seret = { ref: true }; return; }
      if (ed) selesaiEdit(true);
      e.preventDefault(); fokus(); tabAwal = null; RG = null;
      if (td) { var p = { r: +td.dataset.r, c: +td.dataset.c }; seret = { sel: true, aktifTadi: A.r === p.r && A.c === p.c };
        if (e.shiftKey) U = p; else pilihSel(p.r, p.c); tandai(); return; }
      if (!th) return;
      if (th.classList.contains("xl-pj")) { A = { r: 0, c: 0 }; U = { r: S.brs - 1, c: KOL - 1 }; tandai(); return; }
      if (th.dataset.c != null) { var c = +th.dataset.c; if (e.shiftKey) U = { r: S.brs - 1, c: c }; else { A = { r: 0, c: c }; U = { r: S.brs - 1, c: c }; } seret = { kol: true }; tandai(); return; }
      if (th.dataset.r != null) { var r = +th.dataset.r; if (e.shiftKey) U = { r: r, c: KOL - 1 }; else { A = { r: r, c: 0 }; U = { r: r, c: KOL - 1 }; } seret = { brs: true }; tandai(); }
    });
    grid.addEventListener("mouseover", function (e) {
      if (!seret) return; var td = e.target.closest("td"), th = e.target.closest("th");
      if (seret.ref && td && titik) { titik.r = +td.dataset.r; titik.c = +td.dataset.c; sisipRef(teksTitik()); tandaiTitik(); return; }
      if (seret.sel && td) { var m = mergeDi(+td.dataset.r, +td.dataset.c); U = m ? { r: m.r2, c: m.c2 } : { r: +td.dataset.r, c: +td.dataset.c }; tandai(); }
      else if (seret.kol && th && th.dataset.c != null) { U = { r: S.brs - 1, c: +th.dataset.c }; tandai(); }
      else if (seret.brs && th && th.dataset.r != null) { U = { r: +th.dataset.r, c: KOL - 1 }; tandai(); }
    });
    var seretTadi = null;
    grid.addEventListener("mouseup", function () { seretTadi = seret; }, true);
    document.addEventListener("mouseup", function () { seret = null; });
    grid.addEventListener("dblclick", function (e) { var td = e.target.closest("td"); if (!td || ed) return; pilihSel(+td.dataset.r, +td.dataset.c); mulaiEdit(S.sel[alamat(A.r, A.c)] || "", "ubah"); });
    /* di HP: ketuk sel yang sudah terpilih sekali lagi = ubah isi */
    grid.addEventListener("click", function (e) { var td = e.target.closest("td"); if (td && !ed && e.pointerType === "touch" && seretTadi && seretTadi.aktifTadi) mulaiEdit(S.sel[alamat(A.r, A.c)] || "", "ubah"); });
    /* lebar kolom: seret garis kanan judul kolom */
    /* lebar kolom & tinggi baris: seret garis judul kolom/baris (mouse & sentuh), klik dua kali = kembali ke bawaan (Imperium 2026-11-26) */
    grid.addEventListener("pointerdown", function (e) {
      var rs = e.target.dataset.rs, rr = e.target.dataset.rr; if (rs == null && rr == null) return; e.preventDefault(); e.stopPropagation();
      var gerak, ubahan = false, x0 = e.clientX, y0 = e.clientY;
      if (rs != null) { var c = +rs, w0 = lebar(c), cols = grid.querySelectorAll("col");
        /* kunci lebar kolom lain dulu supaya hanya kolom ini yang berubah */
        for (var i = 0; i < KOL; i++) if (!S.lebar[huruf(i)]) cols[i + 1].style.width = lebar(i) + "px";
        gerak = function (ev) { var w = Math.round(Math.max(12, Math.min(800, w0 + ev.clientX - x0))); if (w !== w0) ubahan = true; S.lebar[huruf(c)] = w; cols[c + 1].style.width = w + "px"; };
        document.documentElement.classList.add("xl-rzc");
      } else { var r = +rr, tr = TR[r], h0 = tinggi(r) || tr.getBoundingClientRect().height;
        gerak = function (ev) { var h = Math.round(Math.max(16, Math.min(400, h0 + ev.clientY - y0))); if (Math.abs(h - h0) > 0) ubahan = true; S.tinggi = S.tinggi || {}; S.tinggi[r] = h; tr.style.height = h + "px"; };
        document.documentElement.classList.add("xl-rzr"); }
      function lepas() { document.removeEventListener("pointermove", gerak); document.removeEventListener("pointerup", lepas); document.removeEventListener("pointercancel", lepas);
        document.documentElement.classList.remove("xl-rzc", "xl-rzr"); if (ubahan) { if (rs != null && !Object.keys(S.lebar).length) {} draft(); } }
      document.addEventListener("pointermove", gerak); document.addEventListener("pointerup", lepas); document.addEventListener("pointercancel", lepas);
    }, true);
    grid.addEventListener("dblclick", function (e) {
      var rs = e.target.dataset.rs, rr = e.target.dataset.rr; if (rs == null && rr == null) return; e.preventDefault(); e.stopPropagation();
      if (rs != null) { delete S.lebar[huruf(+rs)]; lebarKolom(); } else if (S.tinggi) { delete S.tinggi[+rr]; TR[+rr].style.height = ""; } draft();
    }, true);

    /* ---------- keyboard di grid ---------- */
    grid.addEventListener("keydown", function (e) {
      if (ed) return; var k = e.key, ctrl = e.ctrlKey || e.metaKey;
      if (k === "Escape") { if (pop) { e.preventDefault(); tutupPop(); } return; }
      e.stopPropagation();
      var arah = ARAH[k], kd = e.code;
      if (arah) { e.preventDefault(); tabAwal = null; return gerak(arah[0], arah[1], e.shiftKey, ctrl); }
      /* shortcut ala Excel (Bos 2026-11-19) */
      if (e.altKey && kd === "Equal") { e.preventDefault(); return autoSum(); }
      if (ctrl && e.shiftKey) {
        var fmt = { Digit4: ["accounting", 0], Digit5: ["percent", 0], Digit1: ["number", 2], Backquote: ["general"] }[kd];
        if (fmt) { e.preventDefault(); return aturNf(fmt[0], fmt[1]); }
        if (kd === "Digit7") { e.preventDefault(); return garis("outer"); }
        if (kd === "Minus") { e.preventDefault(); return garis("none"); }
        if (kd === "KeyL") { e.preventDefault(); return filterToggle(); }
        if (kd === "Semicolon") { e.preventDefault(); return setRaw(alamat(A.r, A.c), jamTeks()); }
        if (k === "Home") { e.preventDefault(); RG = null; U = { r: 0, c: 0 }; tandai(); return lihatkan(0, 0); }
        if (k === "End") { e.preventDefault(); RG = null; U = terakhir(); tandai(); return lihatkan(U.r, U.c); }
        return;
      }
      if (ctrl) { var h = k.toLowerCase();
        if (h === "z") { e.preventDefault(); pulihkan(riwayat, maju); } else if (h === "y") { e.preventDefault(); pulihkan(maju, riwayat); }
        else if (h === "a") { e.preventDefault(); RG = { r1: 0, r2: S.brs - 1, c1: 0, c2: KOL - 1 }; tandai(); }
        else if (h === "s") { e.preventDefault(); simpanPermanen(); }
        else if (h === "b" || h === "i" || h === "u") { e.preventDefault(); aksi(h); }
        else if (h === "d" || h === "r") { e.preventDefault(); isiDari(h); }
        else if (kd === "Space") { e.preventDefault(); var g0 = rentang(); RG = { r1: 0, r2: S.brs - 1, c1: g0.c1, c2: g0.c2 }; tandai(); }
        else if (kd === "Semicolon") { e.preventDefault(); setRaw(alamat(A.r, A.c), hariIniTeks()); }
        else if (k === "Home") { e.preventDefault(); pilihSel(0, 0); tandai(); lihatkan(0, 0); }
        else if (k === "End") { e.preventDefault(); var t = terakhir(); pilihSel(t.r, t.c); tandai(); lihatkan(t.r, t.c); }
        return; }
      if (e.shiftKey && kd === "Space") { e.preventDefault(); var g1 = rentang(); RG = { r1: g1.r1, r2: g1.r2, c1: 0, c2: KOL - 1 }; return tandai(); }
      if (k === "Enter") { e.preventDefault(); return enter(e.shiftKey); }
      if (k === "Tab") { e.preventDefault(); return tab(e.shiftKey); }
      if (k === "PageDown" || k === "PageUp") { e.preventDefault(); return gerak(k === "PageDown" ? 20 : -20, 0, e.shiftKey); }
      if (k === "Home") { e.preventDefault(); if (e.shiftKey) { RG = null; U = { r: U.r, c: 0 }; tandai(); return lihatkan(U.r, 0); } pilihSel(A.r, 0); tandai(); return lihatkan(A.r, 0); }
      if (k === "F2") { e.preventDefault(); return mulaiEdit(S.sel[alamat(A.r, A.c)] || "", "ubah"); }
      if (k === "Delete") { e.preventDefault(); return hapusRentang(); }
      if (k === "Backspace") { e.preventDefault(); return mulaiEdit("", "masuk"); }
      if (k.length === 1 && !e.altKey) { e.preventDefault(); mulaiEdit(k, "masuk"); }
    });

    /* ---------- salin, potong, tempel (format tab, cocok dengan Excel) ---------- */
    /* geser alamat relatif di rumus seperti Excel saat disalin/diisi (A1 ikut bergeser, $A$1 tetap) */
    function geser(raw, dr, dc) {
      if (!raw || raw[0] !== "=" || (!dr && !dc)) return raw;
      return luarKutip(raw, function (o) { return o.replace(/(?<![A-Za-z_\d])(\$?)([A-Za-z])(\$?)(\d+)(?![A-Za-z(\d])/g, function (m, d1, kol, d2, brs) {
        var c = kol.toUpperCase().charCodeAt(0) - 65 + (d1 ? 0 : dc), r = +brs - 1 + (d2 ? 0 : dr);
        return c < 0 || c >= KOL || r < 0 ? "#REF!" : d1 + huruf(c) + d2 + (r + 1); }); });
    }
    var klip = null;
    function simpanKlip(potong) { var g = rentang(), sel = [], gaya = [];
      for (var r = g.r1; r <= g.r2; r++) { if (HID[r]) continue; var a = [], b = []; for (var c = g.c1; c <= g.c2; c++) { a.push(S.sel[alamat(r, c)]); b.push(S.gaya[alamat(r, c)] ? JSON.parse(JSON.stringify(S.gaya[alamat(r, c)])) : null); } sel.push(a); gaya.push(b); }
      klip = { teks: tsv(), g: g, sel: sel, gaya: gaya, potong: potong }; return klip.teks; }
    function isiDari(arah) { /* Ctrl+D isi ke bawah, Ctrl+R isi ke kanan */
      var g = rentang(), bawah = arah === "d";
      if (bawah ? g.r1 === g.r2 : g.c1 === g.c2) { if (bawah ? g.r1 === 0 : g.c1 === 0) return; if (bawah) g.r1--; else g.c1--; }
      ubah(function () { for (var r = g.r1; r <= g.r2; r++) for (var c = g.c1; c <= g.c2; c++) {
        var sr = bawah ? g.r1 : r, sc = bawah ? c : g.c1; if (r === sr && c === sc) continue;
        var raw = S.sel[alamat(sr, sc)], k = alamat(r, c), s = S.gaya[alamat(sr, sc)];
        if (raw == null) delete S.sel[k]; else S.sel[k] = geser(raw, r - sr, c - sc);
        if (s) S.gaya[k] = JSON.parse(JSON.stringify(s)); else delete S.gaya[k]; } });
    }
    function hariIniTeks() { var d = new Date(); return ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); }
    function jamTeks() { var d = new Date(); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
    function terakhir() { var mr = 0, mc = 0; Object.keys(S.sel).forEach(function (k) { var p = urai(k); if (p && S.sel[k] !== "") { mr = Math.max(mr, p.r); mc = Math.max(mc, p.c); } }); return { r: mr, c: mc }; }
    /* F4 saat menulis rumus: A1 -> $A$1 -> A$1 -> $A1 -> A1 pada alamat di posisi kursor */
    function kunciRef(e) {
      var v = e.value, pos = e.selectionStart, re = /(?<![A-Za-z_\d])\$?[A-Za-z]\$?\d+(?![A-Za-z(\d])/g, m;
      while ((m = re.exec(v))) { var a = m.index, b = a + m[0].length; if (pos >= a && pos <= b) {
        var p = /^(\$?)([A-Za-z])(\$?)(\d+)$/.exec(m[0]), st = (p[1] ? 2 : 0) + (p[3] ? 1 : 0), lanjut = { 0: 3, 3: 1, 1: 2, 2: 0 }[st];
        var t = (lanjut & 2 ? "$" : "") + p[2].toUpperCase() + (lanjut & 1 ? "$" : "") + p[4];
        e.value = v.slice(0, a) + t + v.slice(b); e.setSelectionRange(a + t.length, a + t.length); sisip = null; if (e === inp) fx.value = e.value; return; } }
    }
    var tabAwal = null;
    function enter(naik) { if (tabAwal != null && !naik) { var c = tabAwal; tabAwal = null; gerak(1, 0); pilihSel(A.r, c); tandai(); lihatkan(A.r, c); return; } tabAwal = null; gerak(naik ? -1 : 1, 0); }
    function tab(kiri) { if (tabAwal == null) tabAwal = A.c; gerak(0, kiri ? -1 : 1); }
    function diSini() { return !ed && document.activeElement === grid; }
    function tsv() { var g = rentang(), baris = []; cache = {}; lagi = {};
      for (var r = g.r1; r <= g.r2; r++) { if (HID[r]) continue; var b = []; for (var c = g.c1; c <= g.c2; c++) { var v = nilai(alamat(r, c)); b.push(v && v.e ? v.e : typeof v === "number" ? String(v) : String(v).replace(/[\t\n]/g, " ")); } baris.push(b.join("\t")); }
      return baris.join("\n"); }
    document.addEventListener("copy", function (e) { if (!diSini()) return; e.preventDefault(); e.clipboardData.setData("text/plain", simpanKlip(false)); });
    document.addEventListener("cut", function (e) { if (!diSini()) return; e.preventDefault(); e.clipboardData.setData("text/plain", simpanKlip(true)); });
    document.addEventListener("paste", function (e) {
      if (!diSini()) return; e.preventDefault();
      var teks = e.clipboardData.getData("text/plain") || "", g = rentang(); RG = null; A = { r: g.r1, c: g.c1 };
      /* salinan dari lembar ini sendiri: rumus ikut bergeser dan format ikut, seperti Excel; Ctrl+X = pindah */
      if (klip && teks === klip.teks) { var kp = klip, dr = g.r1 - kp.g.r1, dc = g.c1 - kp.g.c1;
        ubah(function () {
          if (kp.potong) for (var r = kp.g.r1; r <= kp.g.r2; r++) for (var c = kp.g.c1; c <= kp.g.c2; c++) { delete S.sel[alamat(r, c)]; delete S.gaya[alamat(r, c)]; }
          if (g.r1 + kp.sel.length > S.brs) tambahBaris(g.r1 + kp.sel.length - S.brs + 20);
          kp.sel.forEach(function (b, i) { b.forEach(function (raw, j) { var c = g.c1 + j; if (c >= KOL) return; var k = alamat(g.r1 + i, c), s = kp.gaya[i][j];
            if (raw == null) delete S.sel[k]; else S.sel[k] = kp.potong ? raw : geser(raw, dr, dc); if (s) S.gaya[k] = JSON.parse(JSON.stringify(s)); else delete S.gaya[k]; }); });
          U = { r: g.r1 + kp.sel.length - 1, c: Math.min(KOL - 1, g.c1 + kp.sel[0].length - 1) };
        }); if (kp.potong) klip = null; return; }
      var baris = teks.replace(/\r/g, "").split("\n"); if (baris.length > 1 && baris[baris.length - 1] === "") baris.pop();
      var data = baris.map(function (b) { return b.split("\t"); });
      ubah(function () {
        if (data.length === 1 && data[0].length === 1) { for (var r = g.r1; r <= g.r2; r++) for (var c = g.c1; c <= g.c2; c++) { if (data[0][0] === "") delete S.sel[alamat(r, c)]; else S.sel[alamat(r, c)] = data[0][0]; } return; }
        if (g.r1 + data.length > S.brs) tambahBaris(g.r1 + data.length - S.brs + 20);
        data.forEach(function (b, i) { b.forEach(function (v, j) { var c = g.c1 + j; if (c >= KOL) return; var k = alamat(g.r1 + i, c); if (v === "") delete S.sel[k]; else S.sel[k] = v; }); });
        U = { r: g.r1 + data.length - 1, c: Math.min(KOL - 1, g.c1 + data[0].length - 1) };
      });
    });

    /* ---------- popover (menu kecil di bawah tombol ribbon) ---------- */
    function tutupPop() { if (pop) { pop.remove(); pop = null; } }
    function bukaPop(anchor, html, ikat) {
      tutupPop(); pop = document.createElement("div"); pop.className = "xl-pop"; pop.innerHTML = html; root.appendChild(pop);
      var a = anchor.getBoundingClientRect(), b = root.getBoundingClientRect();
      pop.style.top = (a.bottom - b.top + 3) + "px"; pop.style.left = Math.max(0, Math.min(a.left - b.left, b.width - pop.offsetWidth - 4)) + "px";
      pop.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Escape") { e.preventDefault(); tutupPop(); fokus(); } });
      ikat(pop); var f = pop.querySelector("input:not([type=checkbox]),select"); if (f) f.focus();
    }
    document.addEventListener("mousedown", function (e) { if (pop && !pop.contains(e.target) && !e.target.closest('[data-act$="-m"],.xl-fb')) tutupPop(); }, true);
    function popDaftar(anchor, item, pilih) {
      bukaPop(anchor, item.map(function (x) { return x[0] === "-" ? "<hr>" : x[0] === "#" ? '<div class="jd">' + esc(x[1]) + "</div>" : '<button class="it" data-v="' + x[0] + '">' + x[1] + "</button>"; }).join(""),
        function (p) { p.querySelectorAll("[data-v]").forEach(function (b) { b.addEventListener("click", function () { tutupPop(); pilih(b.dataset.v); }); }); });
    }
    function popWarna(anchor, judul, kosongTeks, pilih) {
      bukaPop(anchor, '<div class="jd">' + judul + '</div><div class="xl-pal">' + WARNA.map(function (w) { return '<button data-w="' + w + '" title="' + w + '" style="background:' + w + '"></button>'; }).join("") + "</div>" +
        '<button class="it" data-w="">' + kosongTeks + '</button><label class="it">Warna lain… <input type="color" value="#FFC000" style="width:40px;height:22px;padding:0"></label>',
        function (p) { p.querySelectorAll("[data-w]").forEach(function (b) { b.addEventListener("click", function () { tutupPop(); pilih(b.dataset.w); }); });
          p.querySelector("input[type=color]").addEventListener("change", function () { var w = this.value.toUpperCase(); tutupPop(); pilih(w); }); });
    }

    /* ---------- aksi ribbon ---------- */
    function garis(jenis) {
      pilihan.bd = jenis;
      gayaRentang(function (s, r, c, g) {
        if (jenis === "none") { delete s.bd; return; }
        var bd = jenis === "all" ? { t: 1, b: 1, l: 1, r: 1 } : s.bd || {}, tb = jenis === "thick" ? 2 : 1;
        if (jenis === "outer" || jenis === "thick") { if (r === g.r1) bd.t = tb; if (r === g.r2) bd.b = tb; if (c === g.c1) bd.l = tb; if (c === g.c2) bd.r = tb; }
        if (jenis === "bottom" && r === g.r2) bd.b = 1; if (jenis === "top" && r === g.r1) bd.t = 1; if (jenis === "left" && c === g.c1) bd.l = 1; if (jenis === "right" && c === g.c2) bd.r = 1;
        if (Object.keys(bd).length) s.bd = bd; else delete s.bd;
      });
    }
    function gabung(mode) {
      if (ed) selesaiEdit(true); var g = rentang(); RG = null;
      if (mode === "un") { ubah(function () { S.merge = S.merge.filter(function (m) { return !kena(m, g); }); }); return fokus(); }
      if (g.r1 === g.r2 && g.c1 === g.c2) return;
      ubah(function () {
        S.merge = S.merge.filter(function (m) { return !kena(m, g); });
        var baris = []; if (mode === "across") { if (g.c1 === g.c2) return; for (var r = g.r1; r <= g.r2; r++) baris.push([r, r]); } else baris.push([g.r1, g.r2]);
        baris.forEach(function (b) {
          var ka = alamat(b[0], g.c1), r, c, k;
          /* seperti Excel: hanya isi kiri atas yang dipertahankan (kalau kosong, ambil isi pertama yang ada) */
          if (!S.sel[ka]) for (r = b[0]; r <= b[1] && !S.sel[ka]; r++) for (c = g.c1; c <= g.c2; c++) { k = alamat(r, c); if (S.sel[k]) { S.sel[ka] = S.sel[k]; break; } }
          for (r = b[0]; r <= b[1]; r++) for (c = g.c1; c <= g.c2; c++) { k = alamat(r, c); if (k !== ka) delete S.sel[k]; }
          S.merge.push({ r1: b[0], r2: b[1], c1: g.c1, c2: g.c2 });
          if (mode === "center") { var s = S.gaya[ka] || {}; s.ha = "center"; S.gaya[ka] = s; }
        });
        A = { r: g.r1, c: g.c1 };
      });
      fokus();
    }
    function aturNf(t, d) { gayaRentang(function (s) { if (t === "general") { delete s.nf; delete s.d; return; } s.nf = t; s.d = d != null ? d : (t === "number" ? 2 : 0); }); }
    function urutkan(naik) {
      if (ed) selesaiEdit(true); cache = {}; lagi = {};
      var g = rentang(), f = S.filter, w, judul;
      if (f && A.r >= f.r && A.c >= f.c1 && A.c <= f.c2) { w = { r1: f.r, r2: filterR2(), c1: f.c1, c2: f.c2 }; judul = true; }
      else if (g.r2 > g.r1) { w = g; judul = false; }
      else { w = wilayah(); judul = false;
        /* baris pertama dianggap judul kalau isinya teks semua dan baris kedua punya angka */
        if (w.r2 > w.r1) { var semuaTeks = true, adaAngka = false;
          for (var c = w.c1; c <= w.c2; c++) { var v1 = nilai(alamat(w.r1, c)), v2 = nilai(alamat(w.r1 + 1, c)); if (typeof v1 === "number") semuaTeks = false; if (typeof v2 === "number") adaAngka = true; }
          judul = semuaTeks && adaAngka; } }
      var mulai = w.r1 + (judul ? 1 : 0); if (mulai >= w.r2) return;
      var kunci = Math.max(w.c1, Math.min(w.c2, A.c)), data = [];
      for (var r = mulai; r <= w.r2; r++) { var b = { v: nilai(alamat(r, kunci)), sel: {}, gaya: {} }; for (c = w.c1; c <= w.c2; c++) { b.sel[c] = S.sel[alamat(r, c)]; b.gaya[c] = S.gaya[alamat(r, c)]; } data.push(b); }
      var jenis = function (v) { return typeof v === "number" ? 0 : v === "" || v == null ? 2 : 1; };
      data.sort(function (a, b) { var ja = jenis(a.v), jb = jenis(b.v); if (ja === 2 || jb === 2) return ja - jb; /* sel kosong selalu di bawah */
        var h = ja !== jb ? ja - jb : ja === 0 ? a.v - b.v : String(a.v).localeCompare(String(b.v), "id", { sensitivity: "base", numeric: true }); return naik ? h : -h; });
      ubah(function () { data.forEach(function (b, i) { for (var c = w.c1; c <= w.c2; c++) { var k = alamat(mulai + i, c);
        if (b.sel[c] == null) delete S.sel[k]; else S.sel[k] = b.sel[c]; if (b.gaya[c] == null) delete S.gaya[k]; else S.gaya[k] = b.gaya[c]; } }); });
      fokus();
    }
    function filterToggle() {
      if (ed) selesaiEdit(true);
      if (S.filter) { ubah(function () { S.filter = null; }); return fokus(); }
      var g = rentang(), w = g.r2 > g.r1 || g.c2 > g.c1 ? g : wilayah();
      ubah(function () { S.filter = { r: w.r1, r2: w.r2, c1: w.c1, c2: w.c2, sembunyi: {} }; }); fokus();
    }
    function popFilter(anchor, c) {
      var f = S.filter, r2 = filterR2(), nilaiUnik = [], ada = {};
      for (var r = f.r + 1; r <= r2; r++) { var p = polos(alamat(r, c)); if (!ada[p]) { ada[p] = 1; nilaiUnik.push(p); } }
      nilaiUnik.sort(function (a, b) { return a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "id", { numeric: true }); });
      var sem = (f.sembunyi && f.sembunyi[c]) || [];
      bukaPop(anchor, '<button class="it" data-s="1">↑ Urutkan A → Z (kecil ke besar)</button><button class="it" data-s="0">↓ Urutkan Z → A (besar ke kecil)</button><hr>' +
        '<div class="jd">Filter kolom ' + huruf(c) + '</div><div class="dft"><label><input type="checkbox" data-semua' + (sem.length ? "" : " checked") + "> (Pilih semua)</label>" +
        nilaiUnik.map(function (v, i) { return '<label><input type="checkbox" data-i="' + i + '"' + (sem.indexOf(v) >= 0 ? "" : " checked") + "> " + (v === "" ? "<i>(Kosong)</i>" : esc(v)) + "</label>"; }).join("") +
        '</div><div class="bar"><button class="fb-g" data-batal>Batal</button><button class="fb-b" data-ok>OK</button></div>',
        function (p) {
          p.querySelectorAll("[data-s]").forEach(function (b) { b.addEventListener("click", function () { tutupPop(); A = { r: f.r + 1, c: c }; U = { r: f.r + 1, c: c }; urutkan(b.dataset.s === "1"); }); });
          var semua = p.querySelector("[data-semua]"), kotak = p.querySelectorAll("[data-i]");
          semua.addEventListener("change", function () { kotak.forEach(function (x) { x.checked = semua.checked; }); });
          p.querySelector("[data-batal]").addEventListener("click", function () { tutupPop(); fokus(); });
          p.querySelector("[data-ok]").addEventListener("click", function () {
            var sembunyi = []; kotak.forEach(function (x) { if (!x.checked) sembunyi.push(nilaiUnik[+x.dataset.i]); }); tutupPop();
            ubah(function () { S.filter.sembunyi = S.filter.sembunyi || {}; if (sembunyi.length) S.filter.sembunyi[c] = sembunyi; else delete S.filter.sembunyi[c]; }); fokus();
          });
        });
    }
    function popCF(anchor, op) {
      var judul = { gt: "Lebih besar dari", lt: "Lebih kecil dari", bt: "Di antara", eq: "Sama dengan", tx: "Teks yang berisi", dup: "Nilai duplikat" }[op], g = rentang();
      bukaPop(anchor, '<div class="jd">' + judul + " · " + alamat(g.r1, g.c1) + (g.r2 > g.r1 || g.c2 > g.c1 ? ":" + alamat(g.r2, g.c2) : "") + "</div>" +
        (op === "dup" ? "" : '<input data-a placeholder="' + (op === "tx" ? "teks" : "nilai") + '">') + (op === "bt" ? '<input data-b placeholder="sampai nilai">' : "") +
        '<select data-gy>' + Object.keys(CFG).map(function (k) { return '<option value="' + k + '">' + CFG[k].nama + "</option>"; }).join("") + "</select>" +
        '<div class="bar"><button class="fb-g" data-batal>Batal</button><button class="fb-b" data-ok>Terapkan</button></div>',
        function (p) {
          function terap() { var a = p.querySelector("[data-a]"), b = p.querySelector("[data-b]"), aturan = { g: g, op: op, a: a ? a.value.trim() : "", b: b ? b.value.trim() : "", gaya: p.querySelector("[data-gy]").value };
            if (op !== "dup" && !aturan.a) return a.focus(); tutupPop(); ubah(function () { S.cf.push(aturan); }); fokus(); }
          p.querySelector("[data-ok]").addEventListener("click", terap); p.querySelector("[data-batal]").addEventListener("click", function () { tutupPop(); fokus(); });
          p.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); terap(); } });
        });
    }
    function autoSum() {
      if (ed) selesaiEdit(true); cache = {}; lagi = {};
      var g = rentang(), c = A.c, r, angka; RG = null; if (g.r2 - g.r1 >= S.brs - 1) g = { r1: A.r, r2: A.r, c1: A.c, c2: A.c }; c = g.c1; angka = function (r, c) { return typeof nilai(alamat(r, c)) === "number"; };
      if (g.r2 > g.r1) { r = g.r2 + 1; if (r >= S.brs) tambahBaris(20); A = { r: r, c: c }; U = { r: r, c: c }; return setRaw(alamat(r, c), "=SUM(" + alamat(g.r1, c) + ":" + alamat(g.r2, c) + ")"); }
      r = A.r; var a = r - 1; while (a >= 0 && !angka(a, c)) { if (isi(a, c)) break; a--; } var akhir = a; while (a >= 0 && angka(a, c)) a--;
      if (akhir >= 0 && akhir > a) return setRaw(alamat(r, c), "=SUM(" + alamat(a + 1, c) + ":" + alamat(akhir, c) + ")");
      var b = c - 1; while (b >= 0 && angka(r, b)) b--; if (b < c - 1) return setRaw(alamat(r, c), "=SUM(" + alamat(r, b + 1) + ":" + alamat(r, c - 1) + ")");
      mulaiEdit("=SUM(", "ubah");
    }
    function aksi(act, tombol) {
      var s = gy(alamat(A.r, A.c));
      switch (act) {
        case "b": case "i": case "u": case "wrap": { var nyala = !s[act]; return gayaRentang(function (x) { x[act] = nyala; }); }
        case "bd": return garis(pilihan.bd);
        case "bd-m": return popDaftar(tombol, [["all", "▦ Semua garis (tabel)"], ["outer", "□ Garis luar"], ["thick", "▣ Garis luar tebal"], ["-"], ["bottom", "▁ Garis bawah"], ["top", "▔ Garis atas"], ["left", "▏ Garis kiri"], ["right", "▕ Garis kanan"], ["-"], ["none", "✕ Tanpa garis"]], garis);
        case "isi": return gayaRentang(function (x) { x.fill = pilihan.isi; });
        case "isi-m": return popWarna(tombol, "Warna isi sel", "✕ Tanpa warna", function (w) { if (w) { pilihan.isi = w; warnaTombol(); } gayaRentang(function (x) { x.fill = w; }); });
        case "warna": return gayaRentang(function (x) { x.color = pilihan.warna; });
        case "warna-m": return popWarna(tombol, "Warna tulisan", "Otomatis", function (w) { if (w) { pilihan.warna = w; warnaTombol(); } gayaRentang(function (x) { x.color = w; }); });
        case "rot-m": return popDaftar(tombol, [["ccw45", "↗ Miring ke atas"], ["cw45", "↘ Miring ke bawah"], ["vert", "⇣ Teks tegak (huruf bersusun)"], ["up", "⤴ Putar ke atas"], ["down", "⤵ Putar ke bawah"], ["-"], ["none", "Normal"]],
          function (v) { gayaRentang(function (x) { x.rot = v === "none" ? null : v; }); });
        case "mg": return gabung(mergeDi(A.r, A.c) ? "un" : "center");
        case "mg-m": return popDaftar(tombol, [["center", "⇔ Merge &amp; Center"], ["across", "⇉ Merge Across (per baris)"], ["merge", "▭ Merge Cells"], ["un", "✕ Unmerge Cells"]], gabung);
        case "acc": return aturNf("accounting", 0);
        case "pct": return aturNf("percent", 0);
        case "dec-1": case "dec+1": { var n = act === "dec+1" ? 1 : -1;
          return gayaRentang(function (x, r, c) { var f = nf(alamat(r, c)); if (f.t === "general" || f.t === "text") { x.nf = "number"; x.d = Math.max(0, n > 0 ? 1 : 0); return; } x.nf = f.t; x.d = Math.max(0, Math.min(6, f.d + n)); }); }
        case "cf-m": return popDaftar(tombol, [["#", "Tandai sel yang…"], ["gt", "Lebih besar dari…"], ["lt", "Lebih kecil dari…"], ["bt", "Di antara…"], ["eq", "Sama dengan…"], ["tx", "Teks yang berisi…"], ["dup", "Nilai duplikat"], ["-"], ["hps", "Hapus aturan di sel terpilih"], ["hpsall", "Hapus semua aturan"]],
          function (v) { if (v === "hps") { var g = rentang(); return ubah(function () { S.cf = S.cf.filter(function (a) { return !kena({ r1: a.g.r1, r2: a.g.r2, c1: a.g.c1, c2: a.g.c2 }, g); }); }); }
            if (v === "hpsall") return ubah(function () { S.cf = []; }); popCF(tombol, v); });
        case "sf-m": return popDaftar(tombol, [["asc", "↑ Urutkan A → Z (kecil ke besar)"], ["desc", "↓ Urutkan Z → A (besar ke kecil)"], ["-"], ["flt", S.filter ? "✕ Matikan Filter" : "⏷ Filter (tombol ▾ di judul kolom)"]],
          function (v) { if (v === "flt") filterToggle(); else urutkan(v === "asc"); });
        case "fn-m": return popDaftar(tombol, [["SUM", "SUM · jumlah"], ["AVERAGE", "AVERAGE · rata-rata"], ["MIN", "MIN · terkecil"], ["MAX", "MAX · terbesar"], ["COUNT", "COUNT · banyak angka"], ["PRODUCT", "PRODUCT · kali semua"], ["ROUND", "ROUND · bulatkan"], ["ABS", "ABS · nilai mutlak"], ["IF", "IF · jika"]],
          function (v) { if (ed) selesaiEdit(true); mulaiEdit("=" + v + "(", "ubah"); });
        case "sum": return autoSum();
        case "simpan": return simpanPermanen();
        case "unduh": return unduh();
        case "kosong": return kosongkan(tombol);
      }
      var m = /^(ha|va)-(\w+)$/.exec(act);
      if (m) { var sama = s[m[1]] === m[2]; gayaRentang(function (x) { x[m[1]] = sama ? null : m[2]; }); }
    }
    /* dipakai shortcut Alt (KeyTips) Imperium */
    el.__xl = { aksi: aksi, garis: garis, gabung: gabung, aturNf: aturNf, urutkan: urutkan, filterToggle: filterToggle, mulaiEdit: mulaiEdit, gayaRentang: gayaRentang,
      rentang: rentang, lebarKolom: lebarKolom, draft: draft, fokus: fokus, selSize: selSize, S: function () { return S; }, T: function () { return T; }, TR: function () { return TR; },
      commit: function () { if (ed) selesaiEdit(true); } };
    root.addEventListener("mousedown", function (e) { if (e.target.closest(".xl-rb button, .xl-fx button")) e.preventDefault(); });
    root.addEventListener("click", function (e) { var b = e.target.closest(".xl-rb [data-act], .xl-fx [data-act]"); if (!b) return; if (ed && !/-m$/.test(b.dataset.act)) selesaiEdit(true); aksi(b.dataset.act, b); });
    selNf.addEventListener("change", function () { aturNf(selNf.value); });
    selFont.addEventListener("change", function () { var v = selFont.value; gayaRentang(function (x) { x.font = v === "Calibri" ? null : v; }); });
    selSize.addEventListener("change", function () { var v = +selSize.value; gayaRentang(function (x) { x.sz = v === 11 ? null : v; }); });
    namaIn.addEventListener("input", function () { S.nama = namaIn.value; draft(); });
    function simpanPermanen() { if (ed) selesaiEdit(true); S.nama = namaIn.value.trim() || "Excel Bos"; tulis(KUNCI, S); tulis(KUNCI_DRAFT, null); adaDraft = false;
      svTeks = "✓ Tersimpan " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }); statusSimpan(); unduh(true); }
    var kosongT = null;
    function kosongkan(b) {
      if (!kosongT) { var xid = document.documentElement.lang === "id"; b.textContent = xid ? "Yakin kosongkan?" : "Clear everything?"; kosongT = setTimeout(function () { b.textContent = xid ? "Kosongkan" : "Clear"; kosongT = null; }, 3000); return; }
      clearTimeout(kosongT); kosongT = null; b.textContent = document.documentElement.lang === "id" ? "Kosongkan" : "Clear"; RG = null; A = { r: 0, c: 0 }; U = { r: 0, c: 0 };
      ubah(function () { S.sel = {}; S.gaya = {}; S.merge = []; S.cf = []; S.filter = null; });
    }

    /* ---------- download .xlsx (format, warna, garis, merge ikut terbawa) ---------- */
    function muatSkrip(src, cb) { var s = document.createElement("script"); s.src = src; s.onload = function () { cb(true); }; s.onerror = function () { cb(false); }; document.head.appendChild(s); }
    function pakaiXLSX(cb) {
      if (window.__xlGaya) return cb(window.__xlGaya, true);
      var lama = window.XLSX;
      muatSkrip("https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js", function (ok) {
        if (ok && window.XLSX && window.XLSX.utils) { window.__xlGaya = window.XLSX; if (lama) window.XLSX = lama; return cb(window.__xlGaya, true); }
        if (lama) return cb(lama, false);
        muatSkrip("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js", function (ok2) { cb(ok2 ? window.XLSX : null, false); });
      });
    }
    function zFormat(f) { var nol = f.d ? "." + "0".repeat(f.d) : "";
      return f.t === "number" ? "#,##0" + nol : f.t === "accounting" ? '_("Rp"* #,##0' + nol + '_);_("Rp"* (#,##0' + nol + ');_("Rp"* "-"' + (f.d ? "??" : "") + '_);_(@_)' : f.t === "percent" ? "0" + nol + "%" : f.t === "text" ? "@" : null; }
    function hex(w) { return String(w).replace("#", "").toUpperCase(); }
    function gayaX(s, cfx) {
      var f = { name: s.font || "Calibri", sz: s.sz || 11 }, o = { font: f }, fill = (cfx && cfx.isi) || s.fill, warna = (cfx && cfx.teks) || s.color;
      if (s.b) f.bold = true; if (s.i) f.italic = true; if (s.u) f.underline = true;
      if (fill) { o.fill = { patternType: "solid", fgColor: { rgb: hex(fill) } }; if (!warna && luma(fill) <= 0.55) warna = "#FFFFFF"; }
      if (warna) f.color = { rgb: hex(warna) };
      var al = {}; if (s.ha) al.horizontal = s.ha; if (s.va) al.vertical = { top: "top", mid: "center", bot: "bottom" }[s.va]; if (s.wrap) al.wrapText = true;
      if (s.rot) al.textRotation = { ccw45: 45, cw45: 135, vert: 255, up: 90, down: 180 }[s.rot]; if (Object.keys(al).length) o.alignment = al;
      if (s.bd) { o.border = {}; ["t", "b", "l", "r"].forEach(function (x) { if (s.bd[x]) o.border[{ t: "top", b: "bottom", l: "left", r: "right" }[x]] = { style: s.bd[x] === 2 ? "medium" : "thin", color: { rgb: "000000" } }; }); }
      return o;
    }
    function unduh(diam) {
      if (ed) selesaiEdit(true);
      var nama = (namaIn.value.trim() || "Excel Bos").replace(/[\\\/:*?"<>|]+/g, "-"), maxR = -1, maxC = -1;
      Object.keys(S.sel).concat(Object.keys(S.gaya)).forEach(function (k) { var p = urai(k); if (p) { maxR = Math.max(maxR, p.r); maxC = Math.max(maxC, p.c); } });
      S.merge.forEach(function (m) { maxR = Math.max(maxR, m.r2); maxC = Math.max(maxC, m.c2); });
      cache = {}; lagi = {}; var cfMap = hitungCF();
      pakaiXLSX(function (X, bergaya) {
        var r, c, k, raw, v;
        if (X) {
          var ws = {}, cols = [];
          for (r = 0; r <= maxR; r++) for (c = 0; c <= maxC; c++) {
            k = alamat(r, c); raw = S.sel[k]; var s = gy(k), f = nf(k), sel = null;
            if (raw != null && raw !== "") { v = nilai(k);
              if (raw[0] === "=") { sel = { f: luarKutip(raw.slice(1), function (o) { return o.replace(/;/g, ","); }) };
                if (typeof v === "number") { sel.t = "n"; sel.v = v; } else if (typeof v === "boolean") { sel.t = "b"; sel.v = v; } else { sel.t = "s"; sel.v = v && v.e ? "" : String(v); } }
              else if (typeof v === "number" && f.t !== "text") sel = { t: "n", v: v }; else sel = { t: "s", v: raw }; }
            else if (S.gaya[k] || cfMap[k]) sel = { t: "s", v: "" };
            if (!sel) continue;
            var z = zFormat(f); if (z) sel.z = z;
            if (bergaya && (S.gaya[k] || cfMap[k])) { sel.s = gayaX(s, cfMap[k]); if (z) sel.s.numFmt = z; }
            ws[k] = sel;
          }
          for (c = 0; c <= Math.max(maxC, 0); c++) cols.push({ wpx: lebar(c) });
          ws["!ref"] = maxR < 0 ? "A1" : "A1:" + alamat(maxR, maxC); ws["!cols"] = cols;
          if (S.merge.length) ws["!merges"] = S.merge.map(function (m) { return { s: { r: m.r1, c: m.c1 }, e: { r: m.r2, c: m.c2 } }; });
          if (S.filter) { ws["!autofilter"] = { ref: alamat(S.filter.r, S.filter.c1) + ":" + alamat(filterR2(), S.filter.c2) }; var rows = []; Object.keys(HID).forEach(function (x) { rows[+x] = { hidden: true }; }); if (rows.length) ws["!rows"] = rows; }
          if (S.tinggi && Object.keys(S.tinggi).length) { ws["!rows"] = ws["!rows"] || []; Object.keys(S.tinggi).forEach(function (x) { ws["!rows"][+x] = Object.assign(ws["!rows"][+x] || {}, { hpx: S.tinggi[x] }); }); }
          var lembar = (window.IMP_XL_SHEETNAME && window.IMP_XL_SHEETNAME()) || "Sheet1";
          var wb = X.utils.book_new(); X.utils.book_append_sheet(wb, ws, String(lembar).slice(0, 31).replace(/[\\\/?*\[\]:]/g, "-") || "Sheet1");
          var arr = X.write(wb, { bookType: "xlsx", type: "array" }), blob = new Blob([arr], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
          var fname = nama + ((window.IMP_XL_SHEETCOUNT && window.IMP_XL_SHEETCOUNT() > 1) ? " - " + lembar : "") + ".xlsx", key = "xl:" + ((window.IMP_XL_SHEETKEY && window.IMP_XL_SHEETKEY()) || nama);
          if (!diam) { var a2 = document.createElement("a"); a2.href = URL.createObjectURL(blob); a2.download = fname; document.body.appendChild(a2); a2.click(); a2.remove(); setTimeout(function () { URL.revokeObjectURL(a2.href); }, 4000); }
          svTeks = diam ? svTeks : (bergaya ? "✓ Di-download lengkap dengan format" : "Di-download (warna, garis, dan font tidak ikut karena pustaka format gagal dimuat)"); statusSimpan();
          if (window.IMP_SAVE_FILE) window.IMP_SAVE_FILE(blob, fname, key).then(function (ok) { svTeks = (diam ? svTeks.replace(/ · .*$/, "") : svTeks) + (ok ? " · ✓ Tersimpan di Library › Files › Excel" : " · belum tersimpan ke Files (cek internet)"); statusSimpan(); });
          return;
        }
        /* tanpa internet: CSV (bisa dibuka di Excel), berisi hasil hitungan */
        if (diam) return;
        var baris = [];
        for (r = 0; r <= maxR; r++) { var b = []; for (c = 0; c <= maxC; c++) { k = alamat(r, c); v = nilai(k); var t = v && v.e ? v.e : typeof v === "number" ? String(v) : String(v == null ? "" : v); b.push(/[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t); } baris.push(b.join(",")); }
        var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + baris.join("\r\n")], { type: "text/csv" })); a.download = nama + ".csv"; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        svTeks = "Internet tidak tersedia, file di-download sebagai CSV (tetap bisa dibuka di Excel)"; statusSimpan();
      });
    }

    bangun(); lebarKolom(); gambarSemua(); pilihSel(0, 0); tandai(); statusSimpan();
    setTimeout(fokus, 0);
    return function () { if (!ed) { gambarSemua(); setTimeout(fokus, 0); } };
  };
})();
