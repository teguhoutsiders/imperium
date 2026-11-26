#!/usr/bin/env python3
"""Perbarui ?v=<hash> pada setiap js/ dan css/ di index.html.
Jalankan setelah mengubah file mana pun di js/ atau css/, supaya browser
tidak memakai salinan lama:  python3 tools/stamp.py"""
import hashlib, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
idx = root / "index.html"
s = idx.read_text(encoding="utf-8")
def rep(m):
    path = m.group(2)
    v = hashlib.sha1((root / path).read_bytes()).hexdigest()[:8]
    return m.group(1) + path + "?v=" + v
s2 = re.sub(r'((?:src|href)=")((?:js|css)/[^"?]+)\?v=[0-9a-f]+', rep, s)
if s2 != s:
    idx.write_text(s2, encoding="utf-8"); print("index.html diperbarui")
else:
    print("tidak ada perubahan")
