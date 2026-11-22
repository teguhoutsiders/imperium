/**
 * IMPERIUM — gudang data di Google Spreadsheet + Google Drive.
 * Tempel seluruh isi file ini ke Extensions › Apps Script pada Spreadsheet kosong milik Anda.
 *
 * Sheet yang dibuat otomatis:
 *   Data          → satu baris per dokumen Imperium (jangan diedit manual)
 *   Log akses     → catatan masuk & percobaan kunci yang salah
 *   Tabel …       → salinan yang mudah dibaca (menu Imperium › Perbarui tabel bacaan)
 * Berkas (foto, PDF, dll.) disimpan di folder Drive "Imperium Files".
 * Kunci akses disimpan sebagai hash di Script Properties, tidak pernah di sheet.
 */

var SHEET_DATA = 'Data';
var SHEET_LOG = 'Log akses';
var CHUNK = 45000;          // batas aman isi satu sel
var NCHUNK = 12;            // maks 12 sel → ±540 ribu karakter per dokumen
var WIDTH = 4 + NCHUNK;     // id | kind | updated | deleted | json…
var MAX_FAIL = 8;           // salah kunci sebanyak ini → dikunci
var LOCK_MIN = 15;          // lama dikunci (menit)

/* ===================== Menu di Spreadsheet ===================== */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Imperium')
    .addItem('Atur kunci akses', 'menuSetKey')
    .addItem('Perbarui tabel bacaan', 'buildReadableSheets')
    .addSeparator()
    .addItem('Buka folder berkas di Drive', 'menuShowFolder')
    .addItem('Buka kunci (jika terkunci)', 'menuUnlock')
    .addToUi();
}

function menuSetKey() {
  var ui = SpreadsheetApp.getUi();
  var r = ui.prompt('Atur kunci akses Imperium',
    'Isi kunci baru (minimal 10 karakter, campur huruf & angka). Semua perangkat lama harus masuk ulang dengan kunci ini.',
    ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  var key = r.getResponseText();
  if (!key || key.length < 10) { ui.alert('Kunci terlalu pendek. Minimal 10 karakter.'); return; }
  var props = PropertiesService.getScriptProperties();
  var salt = Utilities.getUuid();
  props.setProperty('SALT', salt);
  props.setProperty('KEY_HASH', hash_(salt + key));
  props.deleteProperty('LOCK_UNTIL');
  CacheService.getScriptCache().remove('fails');
  ensureSheets_();
  log_('Kunci akses diganti', '');
  ui.alert('Kunci tersimpan. Sekarang Deploy › New deployment › Web app (Execute as: Me, Who has access: Anyone), lalu salin alamat /exec ke halaman Imperium.');
}

function menuShowFolder() {
  var f = folder_();
  SpreadsheetApp.getUi().alert('Folder berkas Imperium:\n' + f.getUrl());
}

function menuUnlock() {
  PropertiesService.getScriptProperties().deleteProperty('LOCK_UNTIL');
  CacheService.getScriptCache().remove('fails');
  log_('Kunci dibuka manual', '');
  SpreadsheetApp.getUi().alert('Akses dibuka kembali.');
}

/* ===================== Web app ===================== */
function doGet() {
  return out_({ ok: true, app: 'imperium', v: 1 });
}

function doPost(e) {
  var req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return out_({ ok: false, err: 'bad', msg: 'Permintaan tidak terbaca' }); }
  var a = auth_(req.k, req.a);
  if (a !== true) return out_({ ok: false, err: a });
  try {
    switch (req.a) {
      case 'ping':   log_('Masuk', ''); return out_({ ok: true, t: Date.now() });
      case 'pull':   return out_(pull_(+req.since || 0));
      case 'batch':  return out_(batch_(req.ops || []));
      case 'bput':   return out_(blobPut_(req));
      case 'bget':   return out_(blobGet_(req.id));
      case 'bhead':  return out_({ ok: true, exists: blobExists_(req.id) });
      case 'bdel':   blobDel_(req.id); return out_({ ok: true });
      case 'busage': return out_(blobUsage_());
      default:       return out_({ ok: false, err: 'bad', msg: 'Aksi tidak dikenal' });
    }
  } catch (err) {
    return out_({ ok: false, err: 'server', msg: String(err && err.message || err) });
  }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ===================== Keamanan ===================== */
function hash_(s) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

function auth_(key, action) {
  var props = PropertiesService.getScriptProperties();
  var h = props.getProperty('KEY_HASH'), salt = props.getProperty('SALT');
  if (!h || !salt) return 'nokey';
  var until = +(props.getProperty('LOCK_UNTIL') || 0);
  if (until > Date.now()) return 'locked';
  if (key && hash_(salt + key) === h) return true;
  var cache = CacheService.getScriptCache();
  var fails = (+(cache.get('fails') || 0)) + 1;
  cache.put('fails', String(fails), LOCK_MIN * 60);
  log_('Kunci salah', 'aksi: ' + (action || '-') + ', percobaan ke-' + fails);
  if (fails >= MAX_FAIL) {
    props.setProperty('LOCK_UNTIL', String(Date.now() + LOCK_MIN * 60000));
    cache.remove('fails');
    log_('Akses dikunci ' + LOCK_MIN + ' menit', '');
    return 'locked';
  }
  return 'auth';
}

function log_(what, detail) {
  try {
    var sh = ensureSheets_().log;
    sh.appendRow([new Date(), what, detail]);
    var n = sh.getLastRow();
    if (n > 2000) sh.deleteRows(2, n - 1500);
  } catch (e) {}
}

/* ===================== Sheet ===================== */
function ensureSheets_() {
  var ss = SpreadsheetApp.getActive();
  var data = ss.getSheetByName(SHEET_DATA);
  if (!data) {
    data = ss.insertSheet(SHEET_DATA, 0);
    var head = ['id', 'kind', 'updated', 'deleted'];
    for (var i = 1; i <= NCHUNK; i++) head.push('json' + i);
    data.getRange(1, 1, 1, WIDTH).setValues([head]).setFontWeight('bold');
    data.setFrozenRows(1);
    data.getRange('A:B').setNumberFormat('@');
    data.getRange(1, 5, data.getMaxRows(), NCHUNK).setNumberFormat('@');
    if (data.getMaxColumns() < WIDTH) data.insertColumnsAfter(data.getMaxColumns(), WIDTH - data.getMaxColumns());
  }
  var log = ss.getSheetByName(SHEET_LOG);
  if (!log) {
    log = ss.insertSheet(SHEET_LOG);
    log.getRange(1, 1, 1, 3).setValues([['Waktu', 'Kejadian', 'Keterangan']]).setFontWeight('bold');
    log.setFrozenRows(1);
  }
  return { data: data, log: log };
}

function readAll_(sh) {
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  return sh.getRange(2, 1, n, WIDTH).getValues();
}

function rowJson_(r) {
  var s = '';
  for (var i = 4; i < WIDTH; i++) {
    if (r[i] === '' || r[i] == null) break;
    var c = String(r[i]);
    s += c.charAt(0) === '~' ? c.slice(1) : c;   // penanda '~' mencegah teks dianggap rumus
  }
  return s;
}

function rowFromDoc_(id, doc, now, deleted) {
  var row = [String(id), String(doc && doc.kind || ''), now, deleted ? 1 : 0];
  var s = deleted ? '' : JSON.stringify(doc);
  if (s.length > CHUNK * NCHUNK) throw new Error('Dokumen "' + id + '" terlalu besar');
  for (var i = 0; i < NCHUNK; i++) { var part = s.substr(i * CHUNK, CHUNK); row.push(part ? '~' + part : ''); }
  return row;
}

/* ===================== Data ===================== */
function pull_(since) {
  var sh = ensureSheets_().data;
  var t = Date.now();
  var rows = readAll_(sh), docs = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    var u = +r[2] || 0;
    if (since && u < since) continue;
    if (+r[3] === 1) { if (since) docs.push({ id: String(r[0]), x: 1 }); continue; }
    var s = rowJson_(r);
    try { docs.push({ id: String(r[0]), d: JSON.parse(s) }); } catch (e) {}
  }
  return { ok: true, t: t - 2000, full: !since, docs: docs };
}

function batch_(ops) {
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var sh = ensureSheets_().data;
    var rows = readAll_(sh), index = {};
    for (var i = 0; i < rows.length; i++) if (rows[i][0]) index[String(rows[i][0])] = i;
    var now = Date.now(), dirty = {}, appended = [];
    ops.forEach(function (op) {
      var id = String(op.id || ''); if (!id) return;
      var at = index.hasOwnProperty(id) ? index[id] : -1;
      var row;
      if (op.o === 'set') row = rowFromDoc_(id, op.d || {}, now, false);
      else if (op.o === 'del') row = rowFromDoc_(id, null, now, true);
      else if (op.o === 'upd') {
        var cur = {};
        if (at >= 0 && +rows[at][3] !== 1) { try { cur = JSON.parse(rowJson_(rows[at])); } catch (e) {} }
        else return;
        var f = op.f || {};
        for (var k in f) if (f.hasOwnProperty(k)) cur[k] = f[k];
        row = rowFromDoc_(id, cur, now, false);
      } else return;
      if (at >= 0) { rows[at] = row; dirty[at] = true; }
      else { index[id] = rows.length; rows.push(row); appended.push(rows.length - 1); }
    });
    Object.keys(dirty).forEach(function (i) { sh.getRange(+i + 2, 1, 1, WIDTH).setValues([rows[+i]]); });
    if (appended.length) {
      var start = sh.getLastRow() + 1;
      var need = start + appended.length - 1 - sh.getMaxRows();
      if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need + 100);
      sh.getRange(start, 1, appended.length, WIDTH).setNumberFormat('@').setValues(appended.map(function (i) { return rows[i]; }));
      sh.getRange(start, 3, appended.length, 2).setNumberFormat('0');
    }
    return { ok: true, n: ops.length, t: now };
  } finally {
    lock.releaseLock();
  }
}

/* ===================== Berkas (Drive) ===================== */
function folder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('FOLDER_ID');
  if (id) { try { var f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  var nf = DriveApp.createFolder('Imperium Files');
  props.setProperty('FOLDER_ID', nf.getId());
  return nf;
}

function ownFile_(id) {
  var file = DriveApp.getFileById(String(id));
  var parents = file.getParents(), fid = folder_().getId();
  while (parents.hasNext()) if (parents.next().getId() === fid) return file;
  throw new Error('Berkas bukan milik Imperium');
}

function blobPut_(req) {
  var bytes = Utilities.base64Decode(req.b64 || '');
  var name = String(req.name || 'file').slice(0, 180);
  var file = folder_().createFile(Utilities.newBlob(bytes, req.type || 'application/octet-stream', name));
  return { ok: true, id: file.getId(), size: file.getSize() };
}

function blobGet_(id) {
  var file = ownFile_(id);
  if (file.isTrashed()) throw new Error('Berkas sudah dihapus');
  var b = file.getBlob();
  return { ok: true, type: b.getContentType() || file.getMimeType(), b64: Utilities.base64Encode(b.getBytes()) };
}

function blobExists_(id) {
  try { var f = ownFile_(id); return !f.isTrashed(); } catch (e) { return false; }
}

function blobDel_(id) {
  try { ownFile_(id).setTrashed(true); } catch (e) {}
}

function blobUsage_() {
  var it = folder_().getFiles(), bytes = 0;
  while (it.hasNext()) { var f = it.next(); if (!f.isTrashed()) bytes += f.getSize(); }
  var max = 0; try { max = DriveApp.getStorageLimit(); } catch (e) {}
  return { ok: true, bytes: bytes, maxBytes: max };
}

/* ===================== Tabel bacaan (opsional) ===================== */
var KIND_NAMES = {
  task: 'Tugas', project: 'Proyek', pcost: 'Biaya proyek', dream: 'Impian', fin: 'Keuangan', pay: 'Pembayaran cicilan',
  sub: 'Masa aktif', note: 'Catatan', nfolder: 'Folder catatan', file: 'Berkas', folder: 'Folder berkas', link: 'Tautan',
  budget: 'Anggaran', btypes: 'Tipe pengeluaran', climit: 'Limit Claude'
};

function buildReadableSheets() {
  var ss = SpreadsheetApp.getActive();
  var rows = readAll_(ensureSheets_().data), byKind = {};
  rows.forEach(function (r) {
    if (!r[0] || +r[3] === 1) return;
    var d; try { d = JSON.parse(rowJson_(r)); } catch (e) { return; }
    var k = d.kind || 'lain'; if (!KIND_NAMES[k]) return;
    (byKind[k] = byKind[k] || []).push(Object.assign({ id: String(r[0]) }, d));
  });
  Object.keys(byKind).forEach(function (k) {
    var list = byKind[k], cols = ['id'];
    list.forEach(function (o) { Object.keys(o).forEach(function (c) { if (cols.indexOf(c) < 0) cols.push(c); }); });
    var name = 'Tabel ' + KIND_NAMES[k];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    sh.clear();
    var vals = [cols].concat(list.map(function (o) {
      return cols.map(function (c) {
        var v = o[c];
        if (v == null) return '';
        if (typeof v === 'object') v = JSON.stringify(v);
        if ((c === 'created' || c === 'updated' || c === 'doneAt') && typeof v === 'number' && v > 1e12) return new Date(v);
        return typeof v === 'string' && v.length > 45000 ? v.slice(0, 45000) : v;
      });
    }));
    sh.getRange(1, 1, vals.length, cols.length).setValues(vals);
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  SpreadsheetApp.getUi().alert('Tabel bacaan diperbarui. Ini hanya salinan: perubahan di tabel ini tidak masuk ke Imperium.');
}
