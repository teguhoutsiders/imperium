// IE-MODUL-JS-MULAI
/* ==== IELTS: rencana, materi, latihan, kosakata, progres. Data disimpan di dokumen "ielts" (fallback: browser ini). ==== */
(function(){
  var root=document.getElementById("ie-root");if(!root)return;
  var $=function(id){return document.getElementById(id)};
  var esc=function(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})};
  var pad=function(n){return n<10?"0"+n:""+n};
  var todayStr=function(){var d=new Date();return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())};
  var LS="imperium-ielts";

  /* ---------- state ---------- */
  function blank(){return{start:todayStr(),testDate:"",est:{L:5.5,R:5.5,W:5.5,S:5.5},plan:{},cards:{},logs:[],mocks:[],draft:{},assess:{L:[],R:[],W:[],S:[]},done:{},level:"dasar",dasar:{},updated:0}}
  function clean(d){var b=blank();if(!d||typeof d!=="object")return b;
    ["start","testDate"].forEach(function(k){if(typeof d[k]==="string")b[k]=d[k]});
    if(d.est)["L","R","W","S"].forEach(function(k){var v=+d.est[k];if(v>=1&&v<=9)b.est[k]=v});
    ["plan","cards","draft"].forEach(function(k){if(d[k]&&typeof d[k]==="object")b[k]=d[k]});
    if(Array.isArray(d.logs))b.logs=d.logs.slice(-400);if(Array.isArray(d.mocks))b.mocks=d.mocks.slice(-100);
    if(d.assess&&typeof d.assess==="object")["L","R","W","S"].forEach(function(k){if(Array.isArray(d.assess[k]))b.assess[k]=d.assess[k].filter(function(x){return x&&+x.b>=1&&+x.b<=9}).slice(-60)});
    if(d.done&&typeof d.done==="object")b.done=d.done;
    if(d.dasar&&typeof d.dasar==="object")b.dasar=d.dasar;
    if(["dasar","menengah","lanjut"].indexOf(d.level)>=0)b.level=d.level;
    b.updated=+d.updated||0;return b}
  var st=blank();try{st=clean(JSON.parse(localStorage.getItem(LS)||"null"))}catch(_){}
  var saveT=null,remoteOK=false;
  function persist(){st.updated=Date.now();try{localStorage.setItem(LS,JSON.stringify(st))}catch(_){}
    if(window.IMP_RENDER_DREAMS)window.IMP_RENDER_DREAMS();
    clearTimeout(saveT);saveT=setTimeout(async function(){
      if(window.IMP_IELTS_SAVE){var ok=await window.IMP_IELTS_SAVE(JSON.parse(JSON.stringify(st)));setSync(ok?"Progres IELTS tersimpan otomatis.":"Belum tersimpan ke akun — tersimpan di browser ini dulu.")}
      else setSync("Tersimpan di browser ini.");
    },700)}
  function setSync(t){var e=$("ie-sync");if(e)e.textContent=t}
  window.IMP_IELTS_SYNC=function(doc){if(!doc)return;remoteOK=true;var d=clean(doc);if(d.updated>st.updated){st=d;try{localStorage.setItem(LS,JSON.stringify(st))}catch(_){}renderHero();renderBody();if(window.IMP_RENDER_DREAMS)window.IMP_RENDER_DREAMS()}};
  if(window.IMP_IELTS_LAST)window.IMP_IELTS_SYNC(window.IMP_IELTS_LAST);

  /* ---------- helpers ---------- */
  function overall(arr){var a=arr.reduce(function(x,y){return x+(+y)},0)/arr.length;return Math.floor(a*2+0.5)/2}
  function fmt(b){return(+b).toFixed(1)}
  function daysBetween(a,b){return Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/864e5)}
  function curWeek(){var d=daysBetween(st.start||todayStr(),todayStr());return Math.max(1,Math.min(16,Math.floor(d/7)+1))}
  function norm(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]/g,"")}

  /* ---------- band dari penilaian latihan (tidak bisa diubah manual) ---------- */
  var LT=[[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[26,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4],[6,3.5],[4,3],[0,2.5]];
  var RT=[[40,9],[39,8.5],[37,8],[36,7.5],[34,7],[32,6.5],[30,6],[27,5.5],[23,5],[19,4.5],[15,4],[12,3.5],[9,3],[0,2.5]];
  function bandFrom(k,c,t){var raw=Math.round(c/Math.max(1,t)*40),T=k==="L"?LT:RT;for(var i=0;i<T.length;i++)if(raw>=T[i][0])return T[i][1];return 2.5}
  function estOf(k){var a=(st.assess[k]||[]).slice(-5);if(!a.length)return null;var w=0,sum=0;a.forEach(function(x){var ww=+x.w||1;w+=ww;sum+=(+x.b)*ww});return Math.floor(sum/w*2+0.5)/2}
  window.IMP_IELTS_SUMMARY=function(){var K=["L","R","W","S"],e={},n=0,cnt=0,wk=0,last="",cut=Date.now()-7*864e5;
    K.forEach(function(k){e[k]=estOf(k);if(e[k]!=null)n++;cnt+=(st.assess[k]||[]).length});
    st.logs.forEach(function(l){var m=+l.min||0;if((+l.ts||0)>=cut)wk+=m;if(l.date&&l.date>last)last=l.date});
    return{est:e,overall:n===4?overall(K.map(function(k){return e[k]})):null,weekMin:Math.round(wk),last:last,assessCount:cnt}};
  function addAssess(k,band,src,id,w){
    var arr=st.assess[k]||(st.assess[k]=[]),e={d:todayStr(),b:band,src:String(src||"").slice(0,80),ts:Date.now()};
    if(id)e.id=id;if(w)e.w=w;
    var i=id?arr.findIndex(function(x){return x.id===id}):-1;
    if(i>=0)arr[i]=e;else arr.push(e);
    if(arr.length>60)arr.splice(0,arr.length-60);
    persist();renderHero();
  }
  /* =================== DATA KONTEN =================== */
  var SK={L:"Listening",R:"Reading",W:"Writing",S:"Speaking"};
  var PHASES=[
    {n:"Fase 1 · Fondasi",w:[1,4],d:"Perbaiki grammar dasar, bangun kosakata, biasakan telinga dengan aksen Australia & Inggris."},
    {n:"Fase 2 · Skill per section",w:[5,8],d:"Kuasai tiap tipe soal satu per satu. Akurasi dulu, kecepatan nanti."},
    {n:"Fase 3 · Teknik & waktu",w:[9,12],d:"Latihan dengan timer resmi. Writing 3 esai/minggu, Speaking direkam."},
    {n:"Fase 4 · Simulasi tes",w:[13,16],d:"Satu full mock test per minggu, analisis salah, lalu booking & tes."}];
  var WEEKS=[
    ["Tes diagnostik",["Kerjakan Reading, Listening, Writing & Speaking di tab Latihan untuk mendapat band awal","Tulis 3 kelemahan terbesar Anda di Progres","Kuis Grammar di tab Latihan (target 8/10)","Hafalkan 20 kata dek Mining & Maintenance"]],
    ["Grammar inti",["Pelajari article a/an/the & plural -s (materi Grammar)","Dengarkan ABC News 15 menit/hari, catat 5 kata baru","Baca 1 artikel berita tambang Australia/hari","Speaking Part 1: jawab 10 pertanyaan, rekam & dengarkan ulang"]],
    ["Kalimat kompleks",["Latih relative clause & conditional (tulis 10 kalimat soal pekerjaan Anda)","Kerjakan latihan Reading 'Predictive maintenance'","Hafalkan 20 kolokasi akademik","Tulis 1 paragraf opini 150 kata tanpa batas waktu"]],
    ["Telinga & kosakata",["Latihan Listening site induction sampai skor 7/7","Dengarkan 2 podcast ABC (30 menit), tulis ringkasan 5 kalimat","Hafalkan dek Australian workplace","Review semua kesalahan Fase 1 di catatan"]],
    ["Listening: form & note",["Latih soal form/note completion (Section 1–2), fokus ejaan & angka","Latih mengeja nama & alamat (alfabet bahasa Inggris)","Writing Task 1 GT: surat formal (1x)","Speaking Part 2: 3 cue card dengan timer 1+2 menit"]],
    ["Reading: T/F/NG",["Pelajari beda FALSE vs NOT GIVEN, kerjakan 2 set soal","Skimming: baca judul paragraf saja, tebak isi dalam 1 menit","Writing Task 2: struktur 4 paragraf (1 esai, tanpa timer)","Hafalkan 15 kata linking & hedging"]],
    ["Reading: matching & heading",["Latihan matching headings 2 set","Listening Section 3 (diskusi) 2 set","Writing Task 1 GT: surat semi-formal & informal","Speaking Part 3: latih jawaban 4–5 kalimat dengan alasan + contoh"]],
    ["Writing fokus",["Writing Task 2: 2 esai, cek pakai checklist band 7","Bandingkan esai Anda dengan model paragraf di Materi","Listening Section 4 (monolog akademik) 2 set","Mini-mock: 1 Reading passage dengan timer 20 menit"]],
    ["Timer penuh: L & R",["Listening full test 30 menit + 2 menit transfer","Reading full test 60 menit tanpa tambahan waktu","Hitung skor → band, catat di Progres","Analisis: tipe soal mana yang paling banyak salah?"]],
    ["Timer penuh: W",["Writing full test: Task 1 (20 mnt) + Task 2 (40 mnt)","Ulangi 1 esai lama: tulis ulang versi lebih baik","Speaking: rekam full test 11–14 menit","Hafalkan 20 kolokasi baru dari esai model"]],
    ["Kelemahan terbesar",["Ulangi 3 set dari tipe soal terlemah","Writing Task 2: 3 esai dengan timer","Speaking: minta teman/tutor menilai pakai band descriptor","Dek kosakata: tuntaskan semua kartu 'Ulangi'"]],
    ["Kecepatan & akurasi",["Reading: selesaikan 3 passage dalam 55 menit","Listening: latih soal map/diagram labelling","Writing: 2 esai + 1 surat dengan timer","Cek ulang grammar: 10 kesalahan yang paling sering Anda buat"]],
    ["Mock test 1",["Full mock test (L, R, W, S) dalam satu sesi","Input skor mock di tab Progres","Analisis per section: 3 perbaikan utama","Booking tes IELTS (cek jadwal IDP/British Council)"]],
    ["Mock test 2",["Full mock test kedua","Perbaiki esai yang skornya paling rendah","Speaking: latih 10 cue card acak di tab Latihan","Hafalkan ulang kosakata tambang untuk Speaking"]],
    ["Mock test 3",["Full mock test ketiga (pagi hari, seperti hari tes)","Tinjau semua catatan kesalahan","Latihan ringan: 1 Reading + 1 Listening","Siapkan dokumen: paspor, konfirmasi tes"]],
    ["Minggu tes",["Latihan ringan 45 menit/hari, jangan full test","Tidur cukup, cek lokasi tes","Hari tes: datang 30 menit lebih awal","Setelah tes: catat pengalaman & skor resmi di Progres"]]];

  var MATERI=[
    {k:"L",t:"Listening",s:"30 menit · 4 section · 40 soal",b:[
      ["Format",["Section 1: percakapan sehari-hari (mis. booking, formulir)","Section 2: monolog sehari-hari (mis. pengumuman, tur)","Section 3: diskusi akademik/pelatihan 2–4 orang","Section 4: monolog akademik (kuliah)","Rekaman diputar <b>sekali</b>. Band 7 ≈ 30–31 benar dari 40."]],
      ["Strategi band 7",["Baca soal sebelum audio mulai; tebak jenis jawaban (angka, nama, kata benda)","Garis bawahi kata kunci, lalu dengarkan <b>sinonim</b>-nya, bukan kata yang sama","Waspadai jawaban yang dikoreksi pembicara: “It's Tuesday… no, sorry, Thursday”","Patuhi batas kata: “NO MORE THAN TWO WORDS” — tiga kata = salah","Ejaan & plural dihitung. “boots” ≠ “boot”"]],
      ["Jebakan umum orang Indonesia",["Angka 13 vs 30, 15 vs 50 (tekanan suku kata)","Huruf G/J, E/I, A/R saat dieja","Aksen Australia: “day” terdengar seperti “die”, “mate” seperti “mite”","Lupa -s di akhir kata karena tidak terdengar jelas"]],
      ["Latihan harian",["ABC News / ABC Listen 15–30 menit (aksen Australia)","Dictation: dengarkan 1 kalimat, pause, tulis persis","Shadowing: ulangi kalimat pembicara bersamaan","Gunakan latihan Listening di tab Latihan (pakai suara en-AU)"]]]},
    {k:"R",t:"Reading",s:"60 menit · 3 bagian · 40 soal",b:[
      ["Academic vs General Training",["Untuk migrasi kerja, kebanyakan orang memilih <b>General Training (GT)</b>: teks dari iklan, aturan kerja, buku panduan, dan 1 teks panjang","Academic: 3 teks panjang dari jurnal/buku","Skor GT butuh lebih banyak benar untuk band yang sama: band 7 GT ≈ 34/40, Academic ≈ 30/40","Cek dulu tes mana yang diminta visa/employer Anda"]],
      ["Tipe soal",["True / False / Not Given (fakta) dan Yes / No / Not Given (opini penulis)","Matching headings, matching information, matching features","Sentence/summary/note completion","Multiple choice, short answer"]],
      ["FALSE vs NOT GIVEN",["<b>FALSE</b>: teks mengatakan kebalikannya","<b>NOT GIVEN</b>: teks tidak membahas sama sekali — jangan pakai pengetahuan Anda sendiri","Kata mutlak di soal (always, only, all, never) sering jadi kunci FALSE","Kalau Anda harus “menebak maksud penulis”, kemungkinan besar NOT GIVEN"]],
      ["Manajemen waktu",["±20 menit per bagian; jangan terpaku pada 1 soal >90 detik","Skim paragraf (kalimat pertama + terakhir) sebelum menjawab","Jawaban biasanya berurutan sesuai teks (kecuali matching)","Tidak ada waktu transfer di Reading — tulis langsung di lembar jawaban"]]]},
    {k:"W",t:"Writing",s:"60 menit · Task 1 (150 kata) + Task 2 (250 kata)",b:[
      ["4 kriteria penilaian",["<b>Task Response</b>: jawab semua bagian soal, posisi jelas dari awal sampai akhir","<b>Coherence & Cohesion</b>: paragraf logis, linking bervariasi tapi tidak berlebihan","<b>Lexical Resource</b>: kosakata tepat & kolokasi alami, sedikit kesalahan ejaan","<b>Grammatical Range & Accuracy</b>: kalimat kompleks beragam, mayoritas kalimat bebas salah","Task 2 bernilai 2x Task 1 — prioritaskan waktu 40 menit untuk Task 2"]],
      ["Task 1 GT: surat",["Tentukan nada: formal (orang tak dikenal/perusahaan), semi-formal (atasan), informal (teman)","Jawab <b>ketiga</b> bullet point, masing-masing satu paragraf","Formal: “Dear Sir or Madam,” → “Yours faithfully,” · ke nama: “Dear Mr Smith,” → “Yours sincerely,”","Informal: kontraksi (I'm, can't) boleh; formal sebaiknya tidak"]],
      ["Task 2: struktur 4 paragraf",["<b>Intro</b> (2 kalimat): parafrase soal + posisi Anda","<b>Body 1</b>: ide utama → penjelasan → contoh spesifik","<b>Body 2</b>: ide kedua / sisi lain → penjelasan → contoh","<b>Kesimpulan</b> (1–2 kalimat): ulangi posisi dengan kata lain","Rencanakan 5 menit, tulis 30 menit, cek 5 menit"]],
      ["Model paragraf band 7",["<div class=\"ie-model\">Soal: <i>Companies should invest more in training existing staff than in hiring new employees.</i><br><br>One compelling reason to prioritise training is that <mark>experienced employees already understand</mark> how an organisation operates. In heavy industries such as mining, for instance, a maintenance planner who has worked on a site for several years <mark>is familiar with</mark> the fleet, the suppliers and the safety procedures. <mark>Upskilling</mark> such a person in data analysis is therefore likely to deliver results faster than recruiting an outsider, <mark>who would require</mark> months to reach the same level of site knowledge. <mark>Consequently</mark>, training can reduce both recruitment costs and the risk of costly mistakes.</div>","Perhatikan: topic sentence jelas, contoh konkret dari industri, relative clause, kata penghubung yang wajar."]]]},
    {k:"S",t:"Speaking",s:"11–14 menit · tatap muka dengan penguji",b:[
      ["Format",["<b>Part 1</b> (4–5 mnt): pertanyaan tentang diri, kerja, kota, hobi","<b>Part 2</b> (3–4 mnt): cue card, 1 menit persiapan, bicara 1–2 menit","<b>Part 3</b> (4–5 mnt): diskusi abstrak terkait topik Part 2"]],
      ["Strategi band 7",["Part 1: jawab 2–3 kalimat (jawaban + alasan + detail)","Part 2: catat 4 kata kunci di kertas, pakai urutan cue card, bicara sampai penguji menghentikan","Part 3: opini → alasan → contoh → kemungkinan lain (“That said, …”)","Kefasihan lebih penting dari kosakata langka. Jangan menghafal jawaban — penguji tahu"]],
      ["Frasa berguna",["Memberi waktu berpikir: “That's an interesting question. I'd say…”","Opini: “From my perspective…”, “I'm inclined to think…”","Kontras: “Having said that…”, “On the flip side…”","Contoh: “Take my previous job, for example…”","Klarifikasi: “Sorry, could you rephrase the question?” (boleh, tidak mengurangi nilai)"]],
      ["Pengucapan",["Bunyi akhir: worked /t/, planned /d/, trucks /s/ — orang Indonesia sering menghilangkannya","th: think /θ/ vs this /ð/","Tekanan kata: maintenance = MAIN-te-nance, schedule = SHED-yool (Inggris/Australia)","Rekam diri sendiri tiap hari, bandingkan dengan native speaker"]]]},
    {k:"G",t:"Grammar & kosakata band 7",s:"Kesalahan yang paling sering menurunkan skor",b:[
      ["Article (a/an/the)",["Kata benda tunggal yang bisa dihitung wajib pakai article: “He is <b>an</b> engineer”","“the” untuk yang sudah spesifik: “<b>the</b> truck I mentioned”","Umum & jamak tanpa article: “Trucks need regular maintenance”"]],
      ["Subject–verb & plural",["“The number of breakdowns <b>has</b> fallen” (subjek: the number)","“Each of the units <b>is</b>…”","Uncountable: equipment, information, advice, research — tidak pakai -s"]],
      ["Variasi kalimat kompleks",["Relative clause: “The planner, <b>who</b> had ten years' experience, …”","Conditional: “If the parts <b>had arrived</b> on time, the unit <b>would have been</b> ready.”","Passive: “The data <b>is collected</b> every shift.”","Participle: “<b>Having reviewed</b> the backlog, the team…”"]],
      ["Kolokasi akademik",["play a crucial role in · have a detrimental effect on","a significant proportion of · pose a threat to","address the issue of · take into account","Hindari klise berlebihan (“in a nutshell”, “every coin has two sides”) — penguji menilainya tidak alami"]]]}
  ];

  var READ={id:"builtin-r1",title:"From Breakdown to Prediction",p:[
    "For decades, maintenance on remote Australian mine sites followed a simple rule: fix equipment when it breaks, or replace parts on a fixed schedule. Haul trucks, which can carry more than 200 tonnes per load, were serviced every 500 engine hours regardless of their actual condition. The approach was easy to plan but expensive, because components were often replaced long before they were worn out.",
    "Over the past fifteen years, many operators in the Pilbara region of Western Australia have shifted toward condition-based maintenance. Sensors fitted to engines, transmissions and wheel motors now send data on temperature, vibration and oil quality to a central control room, which is sometimes located more than 1,000 kilometres away in Perth. Planners use this information to schedule work only when the data shows a genuine need.",
    "Supporters argue that the change has reduced unplanned downtime significantly. One planner interviewed for this article estimated that his site's mean time between failures had almost doubled. However, he admitted that the figures were difficult to compare, since part of the fleet had also been replaced with newer models during the same period.",
    "The new approach has not been without problems. Sensor data is only useful if someone interprets it correctly, and several companies have struggled to recruit staff who combine mechanical knowledge with strong data skills. Fly-in fly-out rosters, typically two weeks on site followed by one week at home, also make it harder to keep the same people on a long-term project.",
    "Despite these challenges, few in the industry expect a return to the old methods. Autonomous haul trucks, which already operate at several Pilbara sites, depend on reliable data to run safely, and planners who can read that data are likely to remain in high demand."],
    tfng:[
      ["Under the older system, haul trucks were serviced according to their actual condition.","FALSE","Paragraf A: diservis tiap 500 jam “regardless of their actual condition” — kebalikannya."],
      ["The control room that receives sensor data is always located on the mine site.","FALSE","Paragraf B: kadang lebih dari 1.000 km jauhnya di Perth. Kata “always” jadi kuncinya."],
      ["Condition-based maintenance was first developed in Western Australia.","NOT GIVEN","Teks hanya bilang operator di Pilbara beralih ke metode ini; asal metodenya tidak dibahas."],
      ["The planner was certain that the improvement in reliability was caused only by the new method.","FALSE","Paragraf C: ia mengakui angkanya sulit dibandingkan karena armada juga diganti."],
      ["Some companies find it difficult to hire people with both mechanical and data skills.","TRUE","Paragraf D: “struggled to recruit staff who combine mechanical knowledge with strong data skills”."],
      ["FIFO workers earn more than workers who live near the mine.","NOT GIVEN","Gaji tidak dibahas sama sekali."]],
    comp:[
      ["Under the old system, trucks were serviced every ____ engine hours.",["500"],"Paragraf A"],
      ["Sensors send data on temperature, vibration and the quality of the ____.",["oil"],"Paragraf B"],
      ["A typical roster is two weeks on site and one week at ____.",["home"],"Paragraf D"]]};

  var LISTEN={id:"builtin-l1",title:"Site induction",script:"Good morning everyone, and welcome to the site induction. My name is Karen, and I'm the safety coordinator here. Before we go any further, a few key points. Your first shift starts at six thirty tomorrow morning, so please be at the crib room by six fifteen for the pre-start meeting. Everyone must wear a hard hat, steel-capped boots and a high-visibility shirt at all times outside the office area. Safety glasses are also required in the workshop. The speed limit on the haul roads is forty kilometres per hour for light vehicles, and haul trucks always have right of way. If you hear the emergency siren, which is three long blasts, go straight to the muster point, located next to the main gate. Your supervisor is Dave Mitchell. That's M, I, T, C, H, E, L, L. Finally, your swing is fourteen days on and seven days off, and flights to Perth leave on Wednesdays. Any questions? No? Great, let's head to the workshop.",
    q:[["Be at the crib room by ____ for the pre-start meeting.",["615","6.15","sixfifteen","quarterpastsix"],"6:15 (six fifteen)"],
       ["Safety glasses are required in the ____.",["workshop"],"workshop"],
       ["Speed limit for light vehicles: ____ km/h.",["40","forty"],"40"],
       ["The emergency siren is three long ____.",["blasts"],"blasts (perhatikan -s)"],
       ["The muster point is next to the main ____.",["gate"],"gate"],
       ["Supervisor's surname: Dave ____.",["mitchell"],"Mitchell (ejaan dihitung)"],
       ["Flights to Perth leave on ____.",["wednesday","wednesdays"],"Wednesday(s)"]]};

  var GRAM=[
    ["I have worked as a planner ____ 2019.",["since","for","from","in"],0,"<b>since</b> + titik waktu (2019); <b>for</b> + durasi (7 years)."],
    ["She is ____ engineer with ten years of experience.",["a","an","the","—"],1,"Bunyi vokal di awal “engineer” → <b>an</b>."],
    ["The number of breakdowns ____ fallen sharply this year.",["have","has","are","were"],1,"Subjeknya “the number” (tunggal) → <b>has</b>."],
    ["If I ____ band 7, I would apply for a skilled visa.",["get","got","will get","have got"],1,"Second conditional: If + past simple, would + verb."],
    ["Each of the trucks ____ inspected every week.",["are","is","were","have"],1,"“Each” selalu tunggal → <b>is</b>."],
    ["The site purchased several new ____ last year.",["equipments","equipment's","pieces of equipment","equipment pieces's"],2,"“Equipment” tidak bisa dihitung; pakai <b>pieces of equipment</b>."],
    ["The report, ____ was written by the planner, shows a 30% drop in downtime.",["that","which","who","what"],1,"Non-defining relative clause (ada koma) untuk benda → <b>which</b>."],
    ["By the end of next year, I ____ in Australia for six months.",["will work","work","will have been working","am working"],2,"Future perfect continuous: durasi sampai titik di masa depan."],
    ["Hardly ____ the shift started when the alarm went off.",["did","had","has","was"],1,"Inversi: Hardly + had + subjek + V3 … when …"],
    ["I look forward to ____ from you.",["hear","hearing","heard","be heard"],1,"“look forward to” + V-ing. Sering muncul di surat Task 1."]];

  var T2=["Some people believe that companies should invest more in training their existing staff than in hiring new employees. To what extent do you agree or disagree?",
    "In many countries, people move to remote areas or work on fly-in fly-out rosters for high salaries. What are the advantages and disadvantages of this for workers and their families?",
    "Automation is replacing many jobs in heavy industries such as mining. Is this a positive or negative development?",
    "Some people think workplace safety rules are too strict and reduce productivity. Others believe they are essential. Discuss both views and give your own opinion.",
    "More and more young people choose to work abroad. Why is this happening? Is it a positive or negative development for their home country?",
    "Some argue that countries should process their natural resources locally rather than export them as raw materials. To what extent do you agree or disagree?",
    "Many people believe that a person's job is the most important part of their identity. Do you agree or disagree?",
    "Governments should spend more money on vocational training than on university education. To what extent do you agree or disagree?"];
  var T1=["You would like to attend a training course related to your job. Write a letter to your manager. In your letter: explain what the course is, say why you want to attend it, explain how the company will benefit.",
    "You are looking for work in Australia. Write a letter to a recruitment agency. In your letter: introduce yourself, describe your work experience, ask about suitable job opportunities.",
    "You are living in company accommodation and the air conditioner has stopped working. Write a letter to the accommodation manager. In your letter: describe the problem, explain how it affects you, say what you want them to do.",
    "A friend helped you when you first moved to a new city. Write a letter to your friend. In your letter: thank them for their help, tell them about your new job, invite them to visit you."];
  var CUE=[
    ["Describe a skill you learned at work that you find useful.","what the skill is · how you learned it · how often you use it · and explain why it is useful"],
    ["Describe a time you solved a difficult problem at work.","what the problem was · when it happened · how you solved it · and explain how you felt about it"],
    ["Describe a piece of technology you use every day.","what it is · how long you have used it · what you use it for · and explain how your life would be different without it"],
    ["Describe a place where you would like to work in the future.","where it is · what kind of work you would do there · how you would get there · and explain why you want to work there"],
    ["Describe a person who has helped you in your career.","who this person is · how you know them · what they did for you · and explain how it changed your career"],
    ["Describe a goal you are working towards.","what the goal is · why you set it · what you are doing to achieve it · and explain how you will feel when you achieve it"],
    ["Describe a time you had to work under pressure.","when it was · what you had to do · how you managed the pressure · and explain what you learned"],
    ["Describe a team you have worked in.","what the team did · who was in it · what your role was · and explain whether it was a successful team"],
    ["Describe a long journey you have taken.","where you went · how you travelled · who you went with · and explain why you remember it"],
    ["Describe a piece of good news you received.","what the news was · how you received it · who you shared it with · and explain why it was good news"]];
  var P1=["What do you do for work?","Why did you choose this kind of job?","What is the most interesting part of your job?","Describe your hometown.","Is your hometown a good place for young people?","How do you usually spend your weekends?","Do you prefer working alone or in a team? Why?","How has technology changed the way you work?","Do you like to plan your day in advance?","What kind of transport do you use most?","Would you like to live in another country? Why?","How do you relax after a long day?"];

  var DECKS={
    mine:{n:"Mining & Maintenance",c:[
      ["breakdown","kerusakan mendadak unit","The excavator had a hydraulic breakdown on night shift."],
      ["downtime","waktu unit tidak beroperasi","Unplanned downtime fell by 18% this quarter."],
      ["physical availability (PA)","ketersediaan fisik unit","We target 90% physical availability for the haul fleet."],
      ["MTBF","rata-rata waktu antar kerusakan","Our weekly review tracks MTBF for every dump truck."],
      ["MTTR","rata-rata waktu perbaikan","Faster parts delivery cut MTTR to four hours."],
      ["backlog","daftar pekerjaan tertunda","I prioritise the backlog by safety risk first."],
      ["work order","perintah kerja","Every job must have an approved work order."],
      ["preventive maintenance","perawatan terjadwal","Preventive maintenance is scheduled every 500 hours."],
      ["condition monitoring","pemantauan kondisi (oli, vibrasi, suhu)","Condition monitoring flagged high iron in the oil sample."],
      ["component life","umur pakai komponen","We replace engines at 80% of expected component life."],
      ["overhaul / rebuild","turun mesin / rekondisi","The transmission was sent away for a rebuild."],
      ["shutdown","penghentian terencana untuk perawatan besar","The plant shutdown is planned for March."],
      ["critical spares","suku cadang kritis","We keep critical spares on site to avoid long delays."],
      ["lead time","waktu tunggu pengadaan","The lead time for a new final drive is six weeks."],
      ["root cause analysis","analisis akar masalah","A root cause analysis showed the filter was wrong."],
      ["isolation / lockout-tagout","isolasi energi sebelum kerja","Nobody starts work before isolation is verified."],
      ["permit to work","izin kerja","Hot work requires a permit to work."],
      ["JSA (job safety analysis)","analisis keselamatan pekerjaan","The crew reviewed the JSA before lifting."],
      ["near miss","nyaris celaka","Please report every near miss, even small ones."],
      ["handover","serah terima shift","Write clear notes for the shift handover."],
      ["payload","muatan","Overloading the payload shortens tyre life."],
      ["cycle time","waktu satu siklus angkut","Cycle time increased because of the wet haul road."],
      ["cost centre","pusat biaya","All tyre costs are charged to the fleet cost centre."],
      ["purchase requisition","permintaan pembelian","I raised a purchase requisition for the seals."],
      ["reliability","keandalan","Improving reliability is my main focus as a planner."]]},
    aus:{n:"Australian workplace",c:[
      ["FIFO","fly-in fly-out: terbang ke site, tinggal di camp","Most Pilbara jobs are FIFO from Perth."],
      ["DIDO","drive-in drive-out","It's a DIDO role, about three hours from town."],
      ["swing","satu periode kerja di site","I'm on a two-week swing."],
      ["roster (2:1, 8/6)","pola kerja: hari kerja / hari libur","The roster is 2:1 — two weeks on, one week off."],
      ["R&R","rest and recreation: masa libur","I'll fly home on R&R next Wednesday."],
      ["crib / crib room","istirahat makan / ruang makan site","Let's talk at crib."],
      ["smoko","rehat singkat (kopi/rokok)","We'll finish this after smoko."],
      ["donga","kamar/kontainer hunian di camp","My donga is next to the gym."],
      ["hi-vis","pakaian visibilitas tinggi","Hi-vis is mandatory on the haul road."],
      ["pre-start","briefing sebelum shift / cek unit sebelum jalan","Pre-start meeting is at 6:15 sharp."],
      ["toolbox talk","briefing keselamatan singkat","Today's toolbox talk is about heat stress."],
      ["ute","mobil pikap","Grab the keys for the light vehicle — the white ute."],
      ["arvo","sore hari","I'll send the report this arvo."],
      ["reckon","pikir / kira","I reckon the parts will arrive Friday."],
      ["no worries","tidak apa-apa / sama-sama","“Thanks for the help.” — “No worries.”"],
      ["heaps","banyak sekali","There's heaps of work in the backlog."],
      ["she'll be right","nanti juga beres (santai)","Don't stress, she'll be right."],
      ["fair go","kesempatan yang adil","Everyone deserves a fair go."]]},
    acad:{n:"Kolokasi band 7",c:[
      ["play a crucial role in","berperan penting dalam","Training plays a crucial role in workplace safety."],
      ["have a detrimental effect on","berdampak buruk pada","Long rosters can have a detrimental effect on family life."],
      ["a significant proportion of","sebagian besar","A significant proportion of costs comes from tyres."],
      ["pose a threat to","mengancam","Fatigue poses a serious threat to operator safety."],
      ["take into account","mempertimbangkan","Planners must take weather into account."],
      ["address the issue of","menangani masalah","The company addressed the issue of high turnover."],
      ["in the long run","dalam jangka panjang","Automation may save money in the long run."],
      ["to a large extent","sebagian besar (sikap setuju)","I agree with this view to a large extent."],
      ["whereas","sedangkan","Some prefer FIFO, whereas others want to live locally."],
      ["nevertheless","meskipun demikian","The costs are high; nevertheless, the benefits are clear."],
      ["consequently","akibatnya","Parts arrived late; consequently, the unit stayed down."],
      ["provided that","asalkan","Automation is safe provided that systems are maintained."],
      ["a growing number of","semakin banyak","A growing number of workers choose FIFO jobs."],
      ["it could be argued that","bisa dikatakan bahwa","It could be argued that experience matters more than degrees."],
      ["outweigh","lebih besar dari (manfaat vs kerugian)","In my view, the benefits outweigh the drawbacks."],
      ["be inclined to think","cenderung berpikir","I'm inclined to think that training is the better option."]]}};

  var LINKS=[
    ["IELTS resmi","https://ielts.org","Format tes, contoh soal, band descriptor resmi"],
    ["British Council — persiapan gratis","https://takeielts.britishcouncil.org","Practice test gratis, kursus online"],
    ["IDP IELTS","https://ielts.idp.com","Booking tes & materi latihan (IDP banyak di Indonesia)"],
    ["ABC Listen","https://www.abc.net.au/listen","Podcast & radio Australia untuk latihan aksen"],
    ["Home Affairs — visa","https://immi.homeaffairs.gov.au","Syarat visa & bahasa Inggris resmi"],
    ["VETASSESS","https://www.vetassess.com.au","Skills assessment untuk Maintenance Planner"],
    ["SEEK","https://www.seek.com.au","Lowongan kerja: cari “maintenance planner mining”"]];

  /* ----- Belajar Dasar ----- */
  var DUNIT={1:"Kenal IELTS",2:"Grammar dasar",3:"Teknik tiap skill",4:"Kosakata kerja"};
  var ZL=[
  {id:"d01",u:1,t:"Mengenal IELTS & cara menghitung band",why:"Sebelum belajar, Sir perlu tahu apa yang diuji dan bagaimana nilainya dihitung.",
   pts:["IELTS menguji 4 skill: <b>Listening</b> (±30 menit), <b>Reading</b> (60 menit), <b>Writing</b> (60 menit), <b>Speaking</b> (11–14 menit).","Untuk kerja dan migrasi dipakai versi <b>General Training</b>. Versi Academic untuk kuliah.","Nilai tiap skill disebut <b>band</b>, dari 0 sampai 9, naik per 0.5.","<b>Overall</b> = rata-rata 4 band, dibulatkan ke 0.5 terdekat. Contoh: 6 + 6.5 + 6 + 6.5 = 25 ÷ 4 = 6.25 → <b>6.5</b>.","Band 7 artinya pemakai bahasa yang baik: masih ada salah kecil, tapi bisa memahami dan menjelaskan hal yang rumit.","Listening dan Reading masing-masing 40 soal. Band 7 kira-kira perlu <b>30–31 benar</b> di Listening dan <b>34 benar</b> di Reading General Training."],
   ex:[["Overall 6.25 → 6.5","Rata-rata .25 dibulatkan naik ke .5"],["Overall 6.125 → 6.0","Di bawah .25 dibulatkan turun"]],
   q:[["Versi IELTS yang dipakai untuk kerja di Australia biasanya…","General Training",["Academic","TOEFL","Business"],"Untuk kerja dan migrasi dipakai General Training."],
      ["Berapa skill yang diuji di IELTS?","4",["2","3","5"],"Listening, Reading, Writing, Speaking."],
      ["Band 6, 6.5, 6, 6.5 → overall-nya…","6.5",["6.0","6.25","7.0"],"Rata-rata 6.25 dibulatkan ke 6.5."],
      ["Skala band IELTS adalah…","0 sampai 9",["0 sampai 100","1 sampai 10","A sampai F"],"Band 0–9, naik per 0.5."],
      ["Bagian tes yang paling singkat adalah…","Speaking",["Reading","Writing","Listening"],"Speaking 11–14 menit."],
      ["Untuk Listening band 7, kira-kira perlu benar…","30 dari 40",["20 dari 40","15 dari 40","40 dari 40"],"Sekitar 30–31 benar dari 40."],
      ["Speaking IELTS dilakukan dengan cara…","Bicara langsung dengan penguji",["Menulis jawaban","Memilih jawaban di komputer","Merekam sendiri di rumah"],"Speaking adalah wawancara dengan penguji."]]},
  {id:"d02",u:2,t:"To be & susunan kalimat",why:"Bahasa Indonesia sering tanpa kata kerja (“Saya planner”). Bahasa Inggris selalu butuh kata kerja.",
   pts:["Susunan dasar: <b>Subjek + Kata kerja + Objek</b>. Contoh: <i>I check the trucks.</i>","Kalau tidak ada kata kerja lain, pakai <b>to be</b>: I <b>am</b> · he/she/it <b>is</b> · you/we/they <b>are</b>.","Masa lalu: I/he/she/it <b>was</b> · you/we/they <b>were</b>.","Kesalahan umum: <i>I planner</i> ✗ → <i>I <b>am</b> a planner</i> ✓.","Kalimat negatif: tambah <b>not</b> setelah to be: <i>The truck is not ready.</i>","Pertanyaan: to be pindah ke depan: <i><b>Is</b> the truck ready?</i>"],
   ex:[["I am a maintenance planner.","Saya seorang maintenance planner."],["The spare parts are in the warehouse.","Suku cadang ada di gudang."],["We were on night shift last week.","Minggu lalu kami shift malam."]],
   q:[["I ____ a maintenance planner.","am",["is","are","be"],"I selalu dengan am."],
      ["The trucks ____ ready for the shift.","are",["is","am","be"],"The trucks = jamak → are."],
      ["My supervisor ____ very busy today.","is",["are","am","were"],"Satu orang → is."],
      ["Pilih kalimat yang benar.","She is an engineer.",["She engineer.","She are an engineer.","She an engineer is."],"Subjek + to be + keterangan."],
      ["We ____ at the mine site last month.","were",["was","are","is"],"we + masa lalu → were."],
      ["Bentuk pertanyaan yang benar:","Is the pump working?",["The pump is working?","Working the pump is?","Is working the pump?"],"Pertanyaan: to be pindah ke depan subjek."],
      ["The generator ____ not ready yesterday.","was",["were","is","are"],"Satu benda + masa lalu → was."]]},
  {id:"d03",u:2,t:"Present simple & present continuous",why:"Dipakai untuk menceritakan pekerjaan sehari-hari (Speaking Part 1) dan hal yang sedang terjadi.",
   pts:["<b>Present simple</b> = kebiasaan, rutinitas, fakta: <i>I <b>work</b> 12-hour shifts.</i>","Untuk he/she/it tambah <b>-s/-es</b>: <i>He <b>checks</b> the oil every day.</i>","Negatif: <b>don't / doesn't</b> + kata kerja dasar: <i>She <b>doesn't work</b> on Sundays.</i>","<b>Present continuous</b> = sedang terjadi: am/is/are + <b>-ing</b>: <i>I <b>am studying</b> English now.</i>","Petunjuk: every day, usually, always → simple. Now, at the moment, this week → continuous."],
   ex:[["I usually start work at 6 a.m.","Saya biasanya mulai kerja jam 6 pagi."],["The mechanics are repairing the excavator now.","Para mekanik sedang memperbaiki ekskavator sekarang."],["He doesn't drive the haul truck.","Dia tidak mengemudikan haul truck."]],
   q:[["He ____ the tyres every morning.","checks",["check","checking","is check"],"he + kebiasaan → tambah -s."],
      ["Look! The mechanics ____ the engine now.","are repairing",["repair","repairs","repaired"],"“now” → are + -ing."],
      ["I usually ____ work at 6 a.m.","start",["starts","am starting","started"],"I + kebiasaan → bentuk dasar."],
      ["She ____ on Sundays.","doesn't work",["don't work","not works","doesn't works"],"she → doesn't + kata kerja dasar."],
      ["At the moment, I ____ for a new job.","am looking",["look","looks","looked"],"“At the moment” → present continuous."],
      ["Water ____ at 100 degrees Celsius.","boils",["is boiling","boil","boiled"],"Fakta umum → present simple."],
      ["They ____ 12-hour shifts on this site.","work",["works","working","is working"],"they + rutinitas → bentuk dasar."]]},
  {id:"d04",u:2,t:"Past simple: menceritakan pengalaman",why:"Untuk menceritakan pengalaman kerja di Speaking, surat Writing, dan wawancara.",
   pts:["Kejadian yang sudah selesai di masa lalu: <i>I <b>worked</b> at a nickel mine in 2020.</i>","Kata kerja beraturan: tambah <b>-ed</b>: work → worked, check → checked, plan → planned.","Tidak beraturan, harus dihafal: go → <b>went</b>, have → <b>had</b>, make → <b>made</b>, buy → <b>bought</b>, break → <b>broke</b>, take → <b>took</b>.","Negatif dan pertanyaan pakai <b>did</b> + kata kerja dasar: <i>I <b>didn't go</b>.</i> · <i><b>Did</b> you <b>finish</b>?</i>","Petunjuk waktu: yesterday, last week, in 2019, two years ago."],
   ex:[["The excavator broke down yesterday.","Ekskavator rusak kemarin."],["I worked as a planner for three years.","Saya bekerja sebagai planner selama tiga tahun."],["We didn't have spare parts last week.","Minggu lalu kami tidak punya suku cadang."]],
   q:[["Yesterday the truck ____ down.","broke",["break","breaks","broken"],"break → broke."],
      ["I ____ at a coal mine in 2021.","worked",["work","works","working"],"Tahun lampau → worked."],
      ["We ____ to Perth last month.","went",["go","goed","gone"],"go → went."],
      ["She ____ finish the report yesterday.","didn't",["doesn't","don't","not"],"Negatif masa lalu → didn't."],
      ["____ you check the oil this morning?","Did",["Do","Does","Are"],"Pertanyaan masa lalu → Did."],
      ["The team ____ new spare parts two days ago.","bought",["buyed","buy","buys"],"buy → bought."],
      ["I ____ a meeting with the supervisor last Monday.","had",["have","haved","has"],"have → had."]]},
  {id:"d05",u:2,t:"a / an / the & bentuk jamak",why:"Kesalahan a/an/the dan bentuk jamak adalah kesalahan paling sering orang Indonesia di Writing.",
   pts:["<b>a</b> sebelum bunyi konsonan: a truck, a planner, a university (dibaca “yu”).","<b>an</b> sebelum bunyi vokal: an engine, an engineer, an hour (h tidak dibaca).","<b>the</b> untuk benda yang sudah jelas: <i>the truck I told you about</i>, <i>the main gate</i>.","Jamak: tambah -s: truck → trucks. Tidak beraturan: person → <b>people</b>, man → <b>men</b>.","Benda tak terhitung <b>tanpa -s dan tanpa a</b>: equipment, information, advice, money, water."],
   ex:[["I need an hour to finish this.","Saya butuh satu jam untuk menyelesaikan ini."],["The site has new equipment.","Site punya peralatan baru (bukan “equipments”)."],["Three people work in the workshop.","Tiga orang bekerja di bengkel."]],
   q:[["She is ____ engineer.","an",["a","the","—"],"engineer diawali bunyi vokal → an."],
      ["We waited for ____ hour.","an",["a","the","—"],"h di hour tidak dibaca → an."],
      ["He studies at ____ university in Perth.","a",["an","the","—"],"university dibaca “yu-” → a."],
      ["The company bought new ____.","equipment",["equipments","an equipment","equipment's"],"equipment tidak pakai -s."],
      ["Five ____ work on the night shift.","people",["peoples","person","persons'"],"person → people."],
      ["Can you give me some ____ about the job?","information",["informations","an information","a information"],"information tak terhitung."],
      ["Please close ____ main gate.","the",["a","an","—"],"Gerbang utama sudah jelas → the."]]},
  {id:"d06",u:2,t:"Preposisi waktu & tempat",why:"at/on/in muncul di semua bagian tes, terutama Listening (tanggal, jam, tempat).",
   pts:["Waktu: <b>at</b> + jam (at 6 a.m., at night) · <b>on</b> + hari/tanggal (on Monday, on 5 March) · <b>in</b> + bulan/tahun/bagian hari (in March, in 2027, in the morning).","Tempat: <b>at</b> + titik (at the gate, at work) · <b>on</b> + permukaan/jalan (on the table, on the haul road) · <b>in</b> + di dalam ruang/kota/negara (in the workshop, in Perth).","<b>for</b> + durasi (for 3 years) · <b>since</b> + titik mulai (since 2019) · <b>by</b> + batas waktu (by Friday)."],
   ex:[["The shift starts at 6 a.m. on Monday.","Shift mulai jam 6 pagi hari Senin."],["I live in Ketapang, in West Kalimantan.","Saya tinggal di Ketapang, Kalimantan Barat."],["Please send the report by Friday.","Tolong kirim laporan paling lambat Jumat."]],
   q:[["The meeting is ____ Monday.","on",["in","at","by"],"Hari → on."],
      ["My flight is ____ 7 p.m.","at",["on","in","for"],"Jam → at."],
      ["I want to work ____ Australia.","in",["at","on","to"],"Negara → in."],
      ["The new roster starts ____ January.","in",["on","at","since"],"Bulan → in."],
      ["Wait for me ____ the main gate.","at",["in","on","by"],"Titik tertentu → at."],
      ["I have lived here ____ 28 years.","for",["since","in","at"],"Durasi → for."],
      ["Please finish the report ____ Friday.","by",["in","at","since"],"Batas waktu → by."]]},
  {id:"d07",u:2,t:"Kata penghubung: and, but, because, so",why:"Kata penghubung membuat jawaban lebih panjang dan jelas. Ini termasuk kriteria nilai (Coherence).",
   pts:["<b>and</b> = menambah: <i>I check the trucks and update the schedule.</i>","<b>but</b> = kontras: <i>The job is hard, but the salary is good.</i>","<b>because</b> = alasan: <i>I study English because I want to work in Australia.</i>","<b>so</b> = akibat: <i>The part arrived late, so the truck was down for two days.</i>","<b>although</b> = walaupun: <i>Although it was raining, we finished the job.</i>","Di Writing: <b>However,</b> · <b>For example,</b> · <b>In addition,</b> — di awal kalimat, diikuti koma."],
   ex:[["I like my job because I solve problems every day.","Saya suka pekerjaan saya karena setiap hari memecahkan masalah."],["The salary is high. However, the roster is long.","Gajinya tinggi. Namun, rosternya panjang."]],
   q:[["I study English ____ I want to work in Australia.","because",["but","so","although"],"Alasan → because."],
      ["The part arrived late, ____ the truck was down for two days.","so",["because","but","although"],"Akibat → so."],
      ["The job is hard, ____ the salary is good.","but",["so","because","and so"],"Kontras → but."],
      ["____ it was raining, we finished the job.","Although",["Because","So","But"],"Walaupun → although."],
      ["FIFO pays well. ____, it is hard for families.","However",["Because","So","And"],"Kontras antar kalimat → However,"],
      ["I check the oil ____ clean the filters.","and",["but","so","because"],"Menambah → and."],
      ["Many sites use sensors. ____, haul trucks send data every minute.","For example",["However","Although","Because"],"Memberi contoh → For example,"]]},
  {id:"d08",u:3,t:"Listening: angka, ejaan, tanggal",why:"Banyak poin Listening hilang karena salah tulis angka, ejaan, atau jamak, bukan karena tidak paham.",
   pts:["Angka mirip: <b>thirteen (13)</b> vs <b>thirty (30)</b>. -teen ditekan di akhir (thir-TEEN), -ty di awal (THIR-ty).","<b>double</b> = diulang: “double L” = LL, “double five” = 55. <b>oh</b> dalam nomor = nol.","Nama dieja huruf per huruf. Huruf yang sering tertukar: A (ei), E (ii), I (ai), G (dji), J (djei).","Baca soal sebelum audio diputar dan tebak jenis jawabannya: angka? nama? tempat?","Perhatikan batas: “NO MORE THAN TWO WORDS” — tiga kata dihitung salah.","Ejaan harus benar, dan jamak/tunggal harus sama dengan audio."],
   ex:[["fifteen (15) / fifty (50)","fif-TEEN vs FIF-ty"],["“oh-four-double-one…” = 0411…","oh = 0, double one = 11"]],
   q:[["Penutur bilang “double seven”. Tulis…","77",["7","27","707"],"double = angka diulang."],
      ["“Oh” dalam nomor telepon artinya…","0 (nol)",["8","Huruf O","Tidak ada"],"Dalam angka, oh = nol."],
      ["Mana yang tekanannya di akhir?","thirteen",["thirty","Keduanya sama","Tidak ada"],"thir-TEEN."],
      ["Instruksi “NO MORE THAN TWO WORDS”. Jawaban “the main gate”…","Salah (3 kata)",["Benar","Benar jika ejaan tepat","Tergantung penguji"],"Tiga kata melebihi batas."],
      ["Ejaan: “M, I, T, C, H, E, double L”. Hasilnya…","MITCHELL",["MITCHEL","MICHELL","MITCHELLL"],"double L = LL."],
      ["Sebelum audio diputar, sebaiknya Sir…","Membaca soal dan menebak jenis jawaban",["Langsung menulis","Menutup mata","Menunggu sampai audio selesai"],"Membaca soal dulu membantu tahu apa yang dicari."],
      ["Audio: “three trucks”. Sir menulis “truck”. Nilainya…","Salah",["Benar","Setengah benar","Benar kalau ejaannya tepat"],"Jamak harus sesuai audio."]]},
  {id:"d09",u:3,t:"Reading: skimming, scanning, TRUE/FALSE/NOT GIVEN",why:"Reading 60 menit untuk 40 soal. Tidak mungkin membaca semua kata, jadi Sir perlu teknik.",
   pts:["<b>Skimming</b> = baca cepat judul dan kalimat pertama tiap paragraf untuk tahu ide utama.","<b>Scanning</b> = cari kata kunci tertentu (angka, nama, tanggal) tanpa membaca semuanya.","Soal biasanya <b>memparafrase</b> teks: kata berbeda, arti sama. Contoh: repair ↔ fix, employees ↔ staff.","<b>TRUE</b> = teks bilang hal yang sama · <b>FALSE</b> = teks bilang kebalikannya · <b>NOT GIVEN</b> = teks tidak membahas.","Waspadai kata mutlak di soal: <b>always, never, all, only</b>. Sering membuat jawaban FALSE."],
   ex:[["Teks: “Staff must wear boots.” Soal: “Employees need to wear boots.” → TRUE","staff = employees"],["Teks: “Trucks are serviced every 500 hours.” Soal: “Trucks are serviced every week.” → FALSE","Keterangan waktunya berbeda"]],
   q:[["Membaca cepat kalimat pertama tiap paragraf untuk tahu ide utama disebut…","Skimming",["Scanning","Summarising","Spelling"],"Skimming = ide utama."],
      ["Mencari angka atau nama tertentu di teks disebut…","Scanning",["Skimming","Writing","Paraphrasing"],"Scanning = cari info spesifik."],
      ["Teks: “The site has 40 trucks.” Soal: “There are 40 trucks on the site.” Jawaban…","TRUE",["FALSE","NOT GIVEN","Tidak bisa ditentukan"],"Artinya sama."],
      ["Teks: “The office opens at 7 a.m.” Soal: “The office opens at 9 a.m.” Jawaban…","FALSE",["TRUE","NOT GIVEN","Tergantung"],"Teks bilang hal yang bertentangan."],
      ["Teks hanya membahas jam kerja. Soal: “Workers earn $50 an hour.” Jawaban…","NOT GIVEN",["TRUE","FALSE","TRUE kalau masuk akal"],"Gaji tidak dibahas."],
      ["Kata “fix” paling dekat artinya dengan…","repair",["break","buy","drive"],"fix = repair."],
      ["Kata di soal yang sering membuat jawaban FALSE adalah…","always",["often","sometimes","usually"],"Kata mutlak mudah dibantah oleh teks."]]},
  {id:"d10",u:3,t:"Writing: kalimat, paragraf & surat",why:"Sebelum menulis esai 250 kata, Sir perlu bisa membuat kalimat dan paragraf yang rapi.",
   pts:["Satu kalimat = satu ide, ada subjek dan kata kerja. Hindari kalimat panjang tanpa titik.","Paragraf sederhana: <b>kalimat utama</b> (ide) → <b>alasan</b> (because…) → <b>contoh</b> (For example,…).","Writing Task 1 General Training = <b>surat</b>. Formal: <i>Dear Sir or Madam,</i> … <i>Yours faithfully,</i>. Ke nama orang: <i>Dear Mr Smith,</i> … <i>Yours sincerely,</i>.","Surat ke teman (informal): <i>Dear John,</i> … <i>Best wishes,</i>.","Jangan pakai singkatan chat (u, pls, thx) dan jangan menulis semua huruf kapital.","Sisakan 3–5 menit di akhir untuk mengecek: to be, -s, a/an, ejaan."],
   ex:[["Training is important because it improves safety. For example, new workers learn how to use equipment correctly.","Kalimat utama → alasan → contoh"],["Dear Sir or Madam, I am writing to apply for…","Pembuka surat formal"]],
   q:[["Surat formal ke perusahaan yang nama penerimanya tidak Sir ketahui dibuka dengan…","Dear Sir or Madam,",["Hi guys,","Hello friend,","Dear John,"],"Formal, nama tidak diketahui."],
      ["Penutup untuk surat yang dibuka “Dear Sir or Madam,” adalah…","Yours faithfully,",["Yours sincerely,","Best wishes,","See you,"],"Dear Sir or Madam → Yours faithfully."],
      ["Penutup untuk surat yang dibuka “Dear Mr Smith,” adalah…","Yours sincerely,",["Yours faithfully,","Cheers,","Love,"],"Ke nama orang → Yours sincerely."],
      ["Urutan paragraf sederhana yang baik:","Ide utama → alasan → contoh",["Contoh → ide → alasan","Alasan saja","Kesimpulan → ide"],"Mulai dari ide utama."],
      ["Mana yang tidak boleh dipakai di Writing IELTS?","thx u pls",["However,","For example,","because"],"Singkatan chat tidak diterima."],
      ["Kalimat yang benar:","I am writing to ask about the job.",["I writing ask about job.","Me write for ask job.","I am write to asking job."],"Subjek + am + -ing + to + kata kerja."],
      ["Waktu yang baik untuk mengecek tulisan di akhir:","Sekitar 3–5 menit",["Tidak perlu","30 menit","1 jam"],"Sisakan beberapa menit untuk koreksi."]]},
  {id:"d11",u:3,t:"Speaking: jawaban 2–3 kalimat",why:"Penguji menilai kelancaran. Jawaban satu kata (“Yes.”) membuat nilai rendah.",
   pts:["Pakai pola <b>Jawab + Alasan + Contoh</b>. <i>Yes, I do. I enjoy it because… For example…</i>","Butuh waktu berpikir? <i>That's a good question. Let me think…</i> atau <i>Well, …</i>","Tidak paham pertanyaan? Boleh minta diulang: <i>Sorry, could you repeat the question?</i> Ini tidak mengurangi nilai.","Jangan menghafal jawaban panjang. Penguji bisa tahu dan menurunkan nilai.","Ucapkan bunyi akhir dengan jelas: work<b>ed</b>, truck<b>s</b>, plann<b>ed</b>."],
   ex:[["Q: Do you like your job? A: Yes, I do. I enjoy it because I solve problems every day. For example, I plan repairs for dump trucks.","Jawab + alasan + contoh"],["Sorry, could you say that again, please?","Minta pertanyaan diulang"]],
   q:[["Penguji: “Do you like your job?” Jawaban terbaik…","Yes, I do. I enjoy it because I solve problems every day.",["Yes.","Job.","Yes yes yes."],"Jawab + alasan."],
      ["Kalau tidak paham pertanyaan, Sir sebaiknya…","Minta diulang dengan sopan",["Diam saja","Menjawab asal","Bicara bahasa Indonesia"],"Minta diulang tidak mengurangi nilai."],
      ["Kalimat untuk memberi waktu berpikir:","That's a good question. Let me think…",["I don't know.","Next question.","No."],"Frasa pengisi yang alami."],
      ["Pola jawaban Part 1 yang disarankan:","Jawab + alasan + contoh",["Satu kata","Hafalan panjang","Bertanya balik terus"],"2–3 kalimat cukup."],
      ["Menghafal jawaban panjang di Speaking…","Tidak disarankan, penguji bisa tahu",["Wajib","Pasti menaikkan nilai","Tidak berpengaruh"],"Jawaban hafalan terdengar tidak alami."],
      ["Bunyi akhir yang sering hilang pada orang Indonesia:","-ed dan -s",["Huruf A","Huruf M","Bunyi awal kata"],"worked, trucks — ucapkan jelas."],
      ["Penguji: “Where are you from?” Jawaban yang baik…","I'm from Ketapang, a small city in West Kalimantan, Indonesia.",["Ketapang.","Indonesia yes.","From."],"Jawaban + sedikit detail."]]},
  {id:"d12",u:4,t:"Kosakata kerja tambang & maintenance",why:"Kosakata pekerjaan Sir sendiri paling cepat dipakai di Speaking, surat Writing, dan wawancara kerja.",
   pts:["<b>breakdown</b> = kerusakan · <b>downtime</b> = waktu unit tidak beroperasi · <b>availability</b> = ketersediaan unit","<b>spare parts</b> = suku cadang · <b>backlog</b> = pekerjaan tertunda · <b>work order</b> = perintah kerja","<b>preventive maintenance</b> = perawatan terjadwal · <b>overhaul</b> = perbaikan besar menyeluruh","<b>shift</b> = giliran kerja · <b>roster</b> = pola jadwal kerja (mis. 14/7) · <b>FIFO</b> = fly-in fly-out","<b>PPE</b> = alat pelindung diri (APD) · <b>hazard</b> = bahaya · <b>induction</b> = pengenalan site","<b>haul truck</b> = truk angkut tambang · <b>excavator</b> = ekskavator · <b>workshop</b> = bengkel"],
   ex:[["The truck had two breakdowns this week, so availability dropped.","Truk rusak dua kali minggu ini, jadi availability turun."],["We reduced the backlog by planning work orders earlier.","Kami mengurangi backlog dengan merencanakan work order lebih awal."]],
   q:[["“Downtime” artinya…","Waktu unit tidak beroperasi",["Waktu istirahat makan","Shift malam","Jam lembur"],"downtime = unit tidak bisa dipakai."],
      ["“Spare parts” dalam bahasa Indonesia…","Suku cadang",["Alat pelindung diri","Bengkel","Laporan"],"spare parts = suku cadang."],
      ["“PPE” adalah…","Alat pelindung diri (APD)",["Perintah kerja","Jadwal kerja","Truk angkut"],"Personal Protective Equipment."],
      ["Pekerjaan perawatan yang tertunda disebut…","backlog",["overhaul","roster","induction"],"backlog = pekerjaan tertunda."],
      ["“Roster 14/7” artinya…","14 hari kerja, 7 hari libur",["14 jam kerja per hari","7 hari kerja, 14 hari libur","14 orang, 7 truk"],"Pola kerja di site."],
      ["Perawatan terjadwal sebelum unit rusak disebut…","preventive maintenance",["breakdown","emergency repair","downtime"],"preventive = pencegahan."],
      ["Pengenalan keselamatan saat pertama datang ke site disebut…","induction",["overhaul","backlog","availability"],"site induction."]]}
  ];
  var zs={open:null,quiz:null,ans:{},checked:false};
  function zRec(id){return(st.dasar||{})[id]||null}
  function zScore(){var t=0;ZL.forEach(function(l){var r=zRec(l.id);t+=r?(+r.best||0):0});return Math.round(t/ZL.length)}
  function zPassed(){return ZL.filter(function(l){var r=zRec(l.id);return r&&r.best>=80}).length}
  function zLabel(s){return s>=90?["Siap latihan IELTS penuh","p-ok"]:s>=70?["Fondasi kuat","p-ok"]:s>=40?["Berkembang","p-acc"]:["Baru mulai","p-mute"]}
  window.IMP_IELTS_DASAR=function(){return{score:zScore(),passed:zPassed(),total:ZL.length}};
  function zNext(after){var i=after?ZL.findIndex(function(l){return l.id===after}):-1;
    for(var k=i+1;k<ZL.length;k++){var r=zRec(ZL[k].id);if(!(r&&r.best>=80))return ZL[k]}
    return after?null:null}
  function zStatus(l){var r=zRec(l.id);if(!r)return'<span class="pill p-mute">Belum</span>';return r.best>=80?'<span class="pill p-ok">Lulus · '+r.best+'%</span>':'<span class="pill p-acc">'+r.best+'% · ulangi</span>'}
  function renderDasar(){
    var l=zs.open&&ZL.find(function(x){return x.id===zs.open});
    return l?zLesson(l):zList()}
  function zList(){
    var sc=zScore(),ps=zPassed(),lb=zLabel(sc),nx=zNext(null);
    var units=Object.keys(DUNIT).map(function(u){var ls=ZL.filter(function(x){return String(x.u)===u}),t=0;ls.forEach(function(x){var r=zRec(x.id);t+=r?r.best:0});return'<div class="z-unit"><span>'+DUNIT[u]+'</span><b class="mono">'+Math.round(t/ls.length)+'</b></div>'}).join("");
    var h='<div class="ie-card"><div class="z-top"><div><p class="ie-sub">Nilai overall Belajar Dasar</p><p class="z-big"><b>'+sc+'</b> / 100</p><span class="pill '+lb[1]+'">'+lb[0]+'</span></div>'
      +'<div class="z-prog"><div class="barlab"><span>Pelajaran lulus (skor ≥ 80%)</span><span class="mono">'+ps+' / '+ZL.length+'</span></div><div class="bar"><i style="width:'+Math.round(ps/ZL.length*100)+'%"></i></div><div class="z-units">'+units+'</div></div></div>'
      +'<p class="hint">Nilai overall = rata-rata skor terbaik kuis di 12 pelajaran (yang belum dicoba dihitung 0). Ini nilai fondasi, bukan band IELTS. Setelah semua lulus, lanjutkan ke tab Latihan.</p>'
      +(nx?'<div class="ie-row"><button type="button" class="primary" data-zopen="'+nx.id+'">'+(ps||Object.keys(st.dasar||{}).length?"Lanjut":"Mulai")+': '+esc(nx.t)+'</button></div>':'<p class="ie-fb ok">Semua pelajaran dasar sudah lulus. Sir siap pindah ke tab Latihan level Menengah.</p>')+'</div>';
    Object.keys(DUNIT).forEach(function(u){
      h+='<div class="ie-card"><h4>Unit '+u+' · '+DUNIT[u]+'</h4><div class="z-list">'+ZL.map(function(l,i){return String(l.u)!==u?"":'<button type="button" class="z-row" data-zopen="'+l.id+'"><span class="z-n mono">'+(i+1)+'</span><span class="z-t">'+esc(l.t)+'</span>'+zStatus(l)+'</button>'}).join("")+'</div></div>'});
    return h}
  function zLesson(l){
    var r=zRec(l.id),idx=ZL.indexOf(l);
    var h='<div class="ie-row"><button type="button" data-zact="back">← Semua pelajaran</button><span class="ie-sub">Pelajaran '+(idx+1)+' dari '+ZL.length+' · Unit '+l.u+' · '+DUNIT[l.u]+'</span></div>';
    h+='<div class="ie-grid2"><div class="ie-card"><h4>'+esc(l.t)+'</h4><p class="z-why">'+esc(l.why)+'</p><ul class="z-pts">'+l.pts.map(function(p){return'<li>'+p+'</li>'}).join("")+'</ul>'
      +(l.ex&&l.ex.length?'<h5>Contoh</h5><div class="z-ex">'+l.ex.map(function(x){return'<div><p lang="en"><b>'+esc(x[0])+'</b></p><p class="hint">'+esc(x[1])+'</p></div>'}).join("")+'</div>':'')+'</div>';
    h+='<div class="ie-card"><div class="ie-row" style="justify-content:space-between"><h4>Kuis pelajaran</h4>'+zStatus(l)+'</div>';
    if(!zs.quiz){
      h+='<p>5 soal acak dari pelajaran ini. <b>Lulus jika skor ≥ 80%</b> (4 dari 5 benar). Yang disimpan adalah skor terbaik Sir.</p>'+(r?'<p class="hint">Skor terbaik '+r.best+'% · terakhir '+r.last+'% · dicoba '+r.tries+'×</p>':'')+'<div class="ie-row"><button type="button" class="primary" data-zact="quiz">Mulai kuis</button></div>';
    }else{
      var n=zs.quiz.length,done=Object.keys(zs.ans).length,c=0;
      zs.quiz.forEach(function(q,i){var a=zs.ans[i];if(zs.checked&&a===q[2])c++;
        h+='<div class="ie-q"><div class="qt"><b>'+(i+1)+'</b>'+esc(q[0])+'</div><div class="ie-opts">'+q[1].map(function(o,j){var cls="";if(zs.checked){if(j===q[2])cls=" right";else if(j===a)cls=" wrong"}return'<button type="button" class="chip'+cls+'" data-zq="'+i+'" data-zo="'+j+'" aria-pressed="'+(a===j)+'"'+(zs.checked?" disabled":"")+'>'+esc(o)+'</button>'}).join("")+'</div>'
          +(zs.checked?'<div class="ie-fb '+(a===q[2]?"ok":"no")+'">'+(a===q[2]?"Benar. ":"Jawaban: <b>"+esc(q[1][q[2]])+"</b>"+(/[.!?…,]$/.test(q[1][q[2]])?" ":". "))+esc(q[3])+'</div>':'')+'</div>'});
      if(!zs.checked)h+='<div class="ie-row"><button type="button" class="primary" data-zact="check"'+(done<n?" disabled":"")+'>Periksa jawaban</button><span class="hint">'+done+' / '+n+' dijawab</span></div>';
      else{var p=Math.round(c/n*100),nx=zNext(l.id);
        h+='<div class="ie-row"><span class="ie-score">Skor: '+c+' / '+n+' = '+p+'%</span>'+(p>=80?'<span class="pill p-ok">Lulus</span>':'<span class="pill p-acc">Belum lulus — baca lagi materinya, lalu ulangi</span>')+'</div><div class="ie-row"><button type="button" data-zact="quiz">Kuis lagi (soal diacak)</button>'+(p>=80&&nx?'<button type="button" class="primary" data-zopen="'+nx.id+'">Pelajaran berikutnya →</button>':'')+'</div>'}
    }
    return h+'</div></div>'}
  function zMakeQuiz(l){return gShuf(l.q).slice(0,5).map(function(q){var o=gShuf([q[1]].concat(q[2]));return[q[0],o,o.indexOf(q[1]),q[3]]})}
  function zClick(e){var t=e.target,b=t.closest("[data-zopen]");
    if(b){zs.open=b.dataset.zopen;zs.quiz=null;zs.ans={};zs.checked=false;renderBody();try{$("ie-tabs").scrollIntoView({block:"start"})}catch(_){}return}
    b=t.closest("[data-zq]");if(b){if(!zs.checked){zs.ans[+b.dataset.zq]=+b.dataset.zo;renderBody()}return}
    b=t.closest("[data-zact]");if(!b)return;var a=b.dataset.zact,l=ZL.find(function(x){return x.id===zs.open});
    if(a==="back"){zs.open=null;zs.quiz=null;renderBody();return}
    if(!l)return;
    if(a==="quiz"){zs.quiz=zMakeQuiz(l);zs.ans={};zs.checked=false;renderBody();return}
    if(a==="check"&&zs.quiz&&!zs.checked){var c=0;zs.quiz.forEach(function(q,i){if(zs.ans[i]===q[2])c++});var p=Math.round(c/zs.quiz.length*100);
      if(!st.dasar)st.dasar={};var r=st.dasar[l.id]||{best:0,last:0,tries:0};r.tries=(+r.tries||0)+1;r.last=p;if(p>(+r.best||0))r.best=p;r.at=todayStr();if(p>=80&&!r.passedAt)r.passedAt=todayStr();st.dasar[l.id]=r;
      zs.checked=true;addLog("G",10,c+"/"+zs.quiz.length,"Belajar dasar: "+l.t);renderBody()}
  }
  /* =================== RENDER =================== */
  var TABS=[["dasar","Belajar Dasar"],["plan","Rencana 16 minggu"],["materi","Materi"],["latihan","Latihan"],["kosakata","Kosakata"],["progres","Progres"],["aus","Jalur Australia"]];
  var tab="dasar";try{var tt=localStorage.getItem(LS+"-tab");if(TABS.some(function(t){return t[0]===tt}))tab=tt}catch(_){}
  var BANDS=[];for(var b=4;b<=9;b+=0.5)BANDS.push(b);

  function renderHero(){
    $("ie-start").value=st.start||"";$("ie-test").value=st.testDate||"";
    var e={};["L","R","W","S"].forEach(function(k){e[k]=estOf(k)});
    var all=["L","R","W","S"].every(function(k){return e[k]!=null});
    var cd="";
    if(st.testDate){var dl=daysBetween(todayStr(),st.testDate);cd=dl>=0?'<span><b>'+dl+'</b> hari menuju tes</span>':'<span>Tanggal tes sudah lewat — perbarui jika ada jadwal baru</span>'}
    else cd='<span>Isi tanggal tes untuk hitung mundur</span>';
    cd+='<span>Minggu ke-<b>'+curWeek()+'</b> dari 16</span>';
    var h='<div class="ie-count">'+cd+'</div><div class="ie-skills">';
    ["L","R","W","S"].forEach(function(k){var v=e[k],a=st.assess[k]||[],n=a.length,last=n?a[n-1]:null,g=v==null?null:7-v;
      h+='<div class="ie-sk"><span class="k">'+SK[k]+'</span><span class="mono ie-band" style="color:'+(v==null?"var(--muted)":g<=0?"var(--ok)":"var(--ink)")+'">'+(v==null?"—":fmt(v))+'</span>'
        +'<div class="bar '+(g!=null&&g<=0?"ok":"")+'"><i style="width:'+(v==null?0:Math.min(100,Math.max(4,(v-4)/3*100)))+'%"></i></div>'
        +'<span class="gap" style="color:'+(v==null?"var(--muted)":g<=0?"var(--ok)":"var(--muted)")+'">'+(v==null?"Belum dinilai":g<=0?"Target tercapai":"kurang "+fmt(g))+'</span>'
        +(last?'<span class="ie-src">'+n+' penilaian · terakhir '+last.d.slice(8)+'/'+last.d.slice(5,7)+'</span>':'')+'</div>'});
    var ov=all?overall([e.L,e.R,e.W,e.S]):null,min=all?Math.min(e.L,e.R,e.W,e.S):null;
    h+='</div><div class="ie-overall"><span>Overall perkiraan</span><span class="big">'+(ov==null?"—":fmt(ov))+'</span>'
      +(all?'<span class="pill '+(min>=7?"p-ok":min>=6?"p-warn":"p-crit")+'">'+(min>=7?"Proficient (7+) tercapai":min>=6?"Level Competent — lanjut ke 7":"Di bawah Competent")+'</span>':'<span class="pill p-mute">Butuh penilaian di keempat section</span>')+'</div>'
      +'<p class="hint">Band tidak bisa diubah manual. Reading & Listening dinilai dari jawaban yang diperiksa (percobaan pertama tiap soal), Writing & Speaking dinilai Claude. Angka = rata-rata 5 penilaian terakhir.</p>';
    $("ie-est").innerHTML=h;
  }
  function renderTabs(){$("ie-tabs").innerHTML=TABS.map(function(t){return'<button type="button" class="chip" role="tab" data-ietab="'+t[0]+'" aria-pressed="'+(t[0]===tab)+'" aria-selected="'+(t[0]===tab)+'">'+t[1]+'</button>'}).join("")}

  /* ----- Rencana ----- */
  function renderPlan(){
    var cw=curWeek(),total=0,done=0;
    WEEKS.forEach(function(w,i){w[1].forEach(function(_,j){total++;if(st.plan["w"+(i+1)+"-"+j])done++})});
    var h='<div class="ie-grid2"><div class="ie-card"><h4>Progres rencana</h4><div class="barlab"><span>'+done+' / '+total+' tugas</span><span>'+Math.round(done/total*100)+'%</span></div><div class="bar brass"><i style="width:'+(done/total*100)+'%"></i></div>'
      +'<p class="ie-sub">Minggu dihitung dari tanggal mulai belajar. Minggu aktif diberi bingkai.</p></div>'
      +'<div class="ie-card"><h4>Rutinitas harian 90 menit</h4><ol class="ie-steps"><li><span><b>15 mnt</b> — kosakata (flashcard) + 5 kalimat dengan kata baru</span></li><li><span><b>25 mnt</b> — Listening atau Reading (bergantian)</span></li><li><span><b>30 mnt</b> — Writing atau Speaking (bergantian)</span></li><li><span><b>20 mnt</b> — tinjau kesalahan & catat di Progres</span></li></ol></div></div>';
    PHASES.forEach(function(p){
      h+='<div class="ie-phase"><div class="ie-phase-h"><h4>'+p.n+'</h4><span class="ie-sub">'+p.d+'</span></div><div class="ie-weeks">';
      for(var w=p.w[0];w<=p.w[1];w++){var W=WEEKS[w-1],dn=W[1].filter(function(_,j){return st.plan["w"+w+"-"+j]}).length;
        h+='<div class="ie-wk'+(w===cw?" now":"")+'"><div class="ie-wk-h"><b>MINGGU '+w+'</b>'+(w===cw?'<span class="pill p-acc">Minggu ini</span>':dn===W[1].length?'<span class="pill p-ok">Selesai</span>':'<span class="pill p-mute">'+dn+'/'+W[1].length+'</span>')+'</div><div class="ie-wk-f">'+W[0]+'</div>';
        W[1].forEach(function(t,j){var id="w"+w+"-"+j,on=!!st.plan[id];h+='<label class="ie-tk'+(on?" on":"")+'" for="ie-p-'+id+'"><input type="checkbox" id="ie-p-'+id+'" data-plan="'+id+'"'+(on?" checked":"")+'><span>'+t+'</span></label>'});
        h+='</div>'}
      h+='</div></div>'});
    return h}

  /* ----- Materi ----- */
  function renderMateri(){
    return MATERI.map(function(m,i){return'<details class="ie-acc"'+(i===0?" open":"")+'><summary><span>'+m.t+' <span class="ie-sub">· '+m.s+'</span></span></summary><div class="ie-acc-b">'
      +m.b.map(function(b){return'<div><h5>'+b[0]+'</h5>'+(b[1].length===1||b[1][0].indexOf("<div")===0?b[1].map(function(x){return x.indexOf("<div")===0?x:"<p>"+x+"</p>"}).join(""):"<ul>"+b[1].map(function(x){return"<li>"+x+"</li>"}).join("")+"</ul>")+'</div>'}).join("")+'</div></details>'}).join("")
      +'<div class="ie-card"><h4>Konversi skor ke band (perkiraan umum)</h4><div class="ie-tbl-w"><table class="ie-tbl"><thead><tr><th>Band</th><th>Listening (/40)</th><th>Reading Academic (/40)</th><th>Reading GT (/40)</th></tr></thead><tbody>'
      +[["8.0","35–36","35–36","38"],["7.5","32–34","33–34","36–37"],["7.0","30–31","30–32","34–35"],["6.5","26–29","27–29","32–33"],["6.0","23–25","23–26","30–31"]].map(function(r){return'<tr'+(r[0]==="7.0"?' class="hl"':"")+'><td class="mono">'+r[0]+'</td><td class="mono">'+r[1]+'</td><td class="mono">'+r[2]+'</td><td class="mono">'+r[3]+'</td></tr>'}).join("")
      +'</tbody></table></div><p class="hint">Tabel konversi bisa sedikit berbeda antar versi tes. Pakai sebagai patokan latihan, bukan nilai resmi.</p></div>'}

  /* ----- Latihan ----- */
  var ex={sub:"read",readDone:false,listenDone:false,gram:{},wType:"t2",wIdx:0,cue:0,p1:[]};
  var timer={id:null,left:0,label:""};
  function renderLatihan(){
    var subs=[["read","Reading"],["listen","Listening"],["gram","Grammar"],["write","Writing"],["speak","Speaking"],["exam","Speaking 2 arah (AI)"]];
    var h=lvlBar()+'<div class="filters">'+subs.map(function(s){return'<button type="button" class="chip" data-iesub="'+s[0]+'" aria-pressed="'+(ex.sub===s[0])+'">'+s[1]+'</button>'}).join("")+'</div>';
    if(ex.sub==="read")h+=exRead();else if(ex.sub==="listen")h+=exListen();else if(ex.sub==="gram")h+=exGram();else if(ex.sub==="write")h+=exWrite();else if(ex.sub==="exam")h+=exExam();else h+=exSpeak();
    return h}
  /* ----- Level & generator grammar ----- */
  function gShuf(a){var o=a.slice(),i,j,t;for(i=o.length-1;i>0;i--){j=Math.floor(Math.random()*(i+1));t=o[i];o[i]=o[j];o[j]=t}return o}
  function gPick(a){return a[Math.floor(Math.random()*a.length)]}
  function gMk(q,correct,wrong,expl){var o=gShuf([correct].concat(wrong));return[q,o,o.indexOf(correct),expl]}
  var GART={vowel:["engineer","inspection","employee","excavator","engine","alarm","hour"],cons:["planner","truck","supervisor","mechanic","report","tyre","driver","workshop"]};
  var GT={
    art:function(){var v=Math.random()<0.5,n=gPick(v?GART.vowel:GART.cons),c=v?"an":"a";
      return gMk("We bought ____ "+n+" last week.",c,["the","—",v?"a":"an"],"Bunyi awal “"+n+"” "+(v?"vokal":"konsonan")+" → <b>"+c+"</b>. “the” hanya untuk benda yang sudah spesifik.")},
    sv:function(){var sing=Math.random()<0.5,s=gPick(sing?["He","She","The mechanic","The driver","My supervisor"]:["They","The drivers","We","My colleagues"]),t=gPick([["check","checks","checking"],["repair","repairs","repairing"],["drive","drives","driving"],["wash","washes","washing"],["inspect","inspects","inspecting"]]),o=gPick(["the engine","the tyres","the report","the truck"]);
      return gMk(s+" ____ "+o+" every morning.",sing?t[1]:t[0],sing?[t[0],"to "+t[0],t[2]]:[t[1],"to "+t[0],t[2]],sing?"Subjek tunggal (he, she, the …) → tambah -s: <b>"+t[1]+"</b>.":"Subjek jamak (they, we, the …) → bentuk dasar: <b>"+t[0]+"</b>.")},
    sf:function(){var y=2015+Math.floor(Math.random()*10),d=2+Math.floor(Math.random()*8);
      if(Math.random()<0.5)return gMk("I have worked here ____ "+d+" years.","for",["since","from","in"],"Durasi (berapa lama) → <b>for</b>. Titik waktu (kapan mulai) → <b>since</b>.");
      return gMk("I have worked here ____ "+y+".","since",["for","from","in"],"Titik waktu (tahun "+y+") → <b>since</b>. Durasi (berapa lama) → <b>for</b>.")},
    prep:function(){var p=gPick([["6 a.m.","at"],["Monday","on"],["March","in"],["the morning","in"],["noon","at"]]);
      return gMk("The shift starts ____ "+p[0]+".",p[1],["at","on","in"].filter(function(x){return x!==p[1]}).concat(["for"]).slice(0,3),"Jam tertentu → <b>at</b>; hari → <b>on</b>; bulan dan bagian hari → <b>in</b>.")},
    past:function(){var t=gPick([["break down","broke down","has broken down"],["stop","stopped","has stopped"],["fail","failed","has failed"],["arrive","arrived","has arrived"]]),th=gPick(["haul truck","generator","conveyor","water pump"]),tm=gPick(["last Tuesday","yesterday","two days ago","in 2022"]);
      return gMk("The "+th+" ____ "+tm+".",t[1],[t[2],t[0],"to "+t[0]],"Keterangan waktu lampau yang spesifik (“"+tm+"”) → <b>past simple</b>: "+t[1]+", bukan present perfect.")},
    pp:function(){var sing=Math.random()<0.5,s=sing?gPick(["The planner","My team's leader","The site manager"]):gPick(["We","My team","They"]),v=gPick([["finish","finished"],["complete","completed"],["update","updated"],["review","reviewed"],["check","checked"]]),o=gPick(["the inspection","the report","the schedule","the backlog"]),aux=sing?"has":"have";
      return gMk(s+" ____ "+o+" already.",aux+" "+v[1],["to "+v[0],"will "+v[0],aux+" "+v[0]],"<b>already</b> (juga just, yet, ever) dipakai dengan present perfect: has/have + V3 → <b>"+aux+" "+v[1]+"</b>.")},
    modal:function(){var it=gPick(["a hard hat","steel-capped boots","a high-visibility shirt","safety glasses"]);
      return gMk("Everyone ____ wear "+it+" on site. It is a legal requirement.","must",["might","could","would"],"Kewajiban yang ditentukan aturan → <b>must</b> (atau have to). Might/could = kemungkinan; would = kebiasaan atau pengandaian.")},
    agr:function(){
      if(Math.random()<0.5)return gMk("Every "+gPick(["truck","pump","conveyor"])+" ____ inspected before each shift.","is",["are","have","were"],"Every + kata benda tunggal selalu memakai kata kerja tunggal → <b>is</b>.");
      return gMk("Neither of the "+gPick(["drivers","mechanics","planners"])+" ____ available today.","is",["are","were","be"],"Neither of + kata benda jamak tetap memakai kata kerja tunggal → <b>is</b>.")},
    pas:function(){var v=gPick([["write","written","writing"],["send","sent","sending"],["check","checked","checking"],["update","updated","updating"]]);
      return gMk("The report ____ by the planner every Friday.","is "+v[1],["has "+v[1],"is "+v[2],"was "+v[1]],"Present passive (jadwal rutin): is/are + V3 → <b>is "+v[1]+"</b>.")},
    comp:function(){var v=gPick(["truck","pump","generator","conveyor"]),s=gPick([["fast","faster",["more fast","the fastest","fastest"]],["reliable","more reliable",["reliabler","the most reliable","most reliable"]]]);
      return gMk("The new "+v+" is ____ than the old one.",s[1],s[2],"Adjektif satu suku kata → <b>-er</b> (fast → faster). Adjektif panjang → <b>more</b> + adjektif (more reliable).")},
    c2:function(){var s=gPick([["If I ____ more time, I would learn Excel better.","had",["have","will have","would have"],"Second conditional: <b>If + past simple, would + verb</b>."],["If the planner ____ the risk earlier, the breakdown would not have happened.","had spotted",["spotted","has spotted","would spot"],"Third conditional: <b>If + had + V3, would have + V3</b> (kejadian di masa lalu yang tidak terjadi)."]]);
      return gMk(s[0],s[1],s[2],s[3])},
    inv:function(){var s=gPick([["Rarely ____ such a serious breakdown.","have we seen",["we have seen","we saw","we seen"],"Setelah <b>Rarely</b> (kata negatif di awal), susunannya terbalik: auxiliary + subjek → <b>have we seen</b>."],["Hardly ____ the shift started when the alarm went off.","had",["did","has","was"],"<b>Hardly + had + subjek + V3 … when …</b> → inversi, <b>had</b> di depan subjek."],["Not only ____ the report late, but he also made errors.","did he submit",["he submitted","he did submit","submitted he"],"Setelah <b>Not only</b> di awal kalimat → inversi: <b>did he submit</b>."]]);
      return gMk(s[0],s[1],s[2],s[3])},
    rel:function(){var s=gPick([["The engineer ____ designed the system is retiring next year.","who",["which","where","what"],"Orang sebagai subjek relative clause → <b>who</b> (atau that). Benda → which/that."],["The machine ____ I inspected yesterday is still running.","which",["who","where","what"],"Benda → <b>which</b> (atau that). Orang → who."]]);
      return gMk(s[0],s[1],s[2],s[3])},
    part:function(){var o=gPick(["the backlog","the overdue reports","the spare parts list"]);
      return gMk("____ "+o+", the team started the repair.","Having reviewed",["To review","Review","Reviews"],"<b>Having + V3</b> untuk aksi yang selesai lebih dulu sebelum aksi utama. Gaya tulisan formal.")},
    coll:function(){var s=gPick([["The new policy will ____ a significant impact on costs.","have",["make","do","take"],"Kolokasi: <b>have an impact on</b>."],["The planner must ____ into account the safety risks.","take",["make","have","do"],"Kolokasi: <b>take into account</b>."],["The company must ____ a clear plan for training.","make",["take","do","have"],"Kolokasi: <b>make a plan</b>."]]);
      return gMk(s[0],s[1],s[2],s[3])},
    fp:function(){return gMk("By the end of next year, I ____ in Australia for six months.","will have been working",["will work","work","am working"],"Future perfect continuous: <b>will have been + V-ing</b> untuk durasi sampai titik di masa depan.")}
  };
  var GPOOL={dasar:["art","sv","sf","prep","past"],menengah:["pp","past","modal","agr","pas","comp","sf","prep"],lanjut:["c2","inv","rel","part","coll","fp","pas","agr"]};
  function makeGram(level){var pool=GPOOL[level]||GPOOL.dasar,order=[];
    while(order.length<10)order=order.concat(gShuf(pool));
    return order.slice(0,10).map(function(k){return GT[k]()})}
  function gramSet(){if(!ex.gramSet)ex.gramSet=makeGram(st.level||"dasar");return ex.gramSet}
  function lvlSpec(k){var l=st.level||"dasar";
    if(k==="R")return l==="dasar"?"Use simple, clear English (CEFR A2 to B1): short sentences of mostly 15 words or fewer, everyday vocabulary, no idioms. Length 220 to 280 words, exactly 4 paragraphs.":l==="menengah"?"Use clear B1 to B2 English with some topic vocabulary. Length 300 to 360 words, exactly 5 paragraphs.":"Length 380 to 450 words, exactly 5 paragraphs, IELTS section 3 style.";
    return l==="dasar"?"Use very simple English (CEFR A2 to B1): short sentences, everyday vocabulary, no idioms. Length 150 to 200 words.":l==="menengah"?"Use clear B1 to B2 English. Length 200 to 250 words.":"Length 230 to 300 words, IELTS section 1 or 2 style."}
  function lvlBar(){var L=[["dasar","Dasar"],["menengah","Menengah"],["lanjut","Lanjut (target band 7)"]],cur=st.level||"dasar",note={dasar:"Kalimat pendek, kosakata umum, grammar dasar. Mulai di sini kalau terasa sulit.",menengah:"Teks dan soal sedikit lebih panjang, grammar B1–B2.",lanjut:"Setara tes asli: kalimat kompleks dan kosakata akademik."}[cur];
    return '<div class="ie-card" style="padding:12px 16px"><div class="ie-row" style="justify-content:space-between"><span class="ie-row"><span class="ie-sub">Level Sir</span>'+L.map(function(x){return'<button type="button" class="chip" data-lvl="'+x[0]+'" aria-pressed="'+(cur===x[0])+'">'+x[1]+'</button>'}).join("")+'</span></div><p class="hint">'+note+' Soal Grammar langsung ikut level ini. Soal Reading dan Listening baru mengikuti level saat Sir menekan “Buat soal baru”.</p></div>'}
  function genBar(k,set,counted){
    var busy=ex.gen===k,builtin=set.id.indexOf("builtin")===0;
    return'<div class="ie-card" style="padding:12px 16px"><div class="ie-row" style="justify-content:space-between"><span class="ie-row"><span class="ie-sub">'+(builtin?"Soal contoh bawaan":"Soal baru buatan Claude")+'</span>'+(counted?'<span class="pill p-mute">Sudah dinilai — percobaan ulang tidak dihitung</span>':'<span class="pill p-acc">Percobaan pertama dihitung ke band '+SK[k]+'</span>')+'</span>'
      +(SAMPLE_OK?'<button type="button" class="primary" data-act="gen-'+k+'"'+(ex.gen?" disabled":"")+'>'+(busy?"Claude menyusun soal… (±30–60 detik)":"Buat soal baru")+'</button>':'')+'</div>'
      +(ex.genErr&&ex.genErrK===k?'<p class="ie-fb no">'+esc(ex.genErr)+'</p>':'')+'</div>';
  }
  function exRead(){
    var R=ex.readSet||READ,n=R.tfng.length,m=R.comp.length;
    var h=genBar("R",R,!!st.done[R.id])+'<div class="ie-grid2"><div class="ie-card"><h4>'+esc(R.title)+'</h4><p class="ie-sub">Reading passage · target waktu 15–20 menit</p><div class="ie-passage">'+R.p.map(function(p,i){return'<p><b>'+String.fromCharCode(65+i)+'</b>'+esc(p)+'</p>'}).join("")+'</div></div><div class="ie-card"><h4>Soal 1–'+n+' · TRUE / FALSE / NOT GIVEN</h4><div>';
    R.tfng.forEach(function(q,i){h+='<div class="ie-q"><div class="qt"><b>'+(i+1)+'</b>'+esc(q[0])+'</div><div class="ie-opts" data-rq="'+i+'">'+["TRUE","FALSE","NOT GIVEN"].map(function(o){return'<button type="button" class="chip" data-ropt="'+o+'">'+o+'</button>'}).join("")+'</div><div class="ie-fb" hidden id="ie-rfb-'+i+'"></div></div>'});
    h+='</div><h5>Soal '+(n+1)+'–'+(n+m)+' · ONE WORD AND/OR A NUMBER</h5><div>';
    R.comp.forEach(function(q,i){var parts=q[0].split("____");h+='<div class="ie-q"><div class="qt"><b>'+(i+n+1)+'</b>'+esc(parts[0])+'<input class="ie-gap" id="ie-rc-'+i+'" aria-label="Jawaban soal '+(i+n+1)+'" autocomplete="off">'+esc(parts.slice(1).join(" "))+'</div><div class="ie-fb" hidden id="ie-rcfb-'+i+'"></div></div>'});
    h+='</div><div class="ie-row"><button type="button" class="primary" data-act="read-check">Periksa jawaban</button><button type="button" data-act="read-reset">Kosongkan</button><span class="ie-score" id="ie-rscore"></span></div></div></div>';
    return h}
  function exListen(){
    var L=ex.listenSet||LISTEN,ok=!!window.speechSynthesis,n=L.q.length;
    var h=genBar("L",L,!!st.done[L.id])+'<div class="ie-grid2"><div class="ie-card"><h4>'+esc(L.title)+'</h4><p class="ie-sub">Dengarkan sekali saja (seperti tes asli), lalu isi jawaban. Maksimal TWO WORDS AND/OR A NUMBER.</p>';
    h+=ok?'<div class="ie-row"><button type="button" class="primary" data-act="ls-play">Putar audio</button><button type="button" data-act="ls-stop">Stop</button><label for="ie-rate" style="flex-direction:row;align-items:center;gap:6px">Kecepatan<select id="ie-rate" style="width:auto"><option value="0.85">Pelan</option><option value="1" selected>Normal (tes)</option><option value="1.1">Cepat</option></select></label></div><p class="hint" id="ie-voice"></p>'
      :'<p class="ie-fb no">Browser ini tidak mendukung suara, jadi latihan Listening tidak bisa dipakai di sini.</p>';
    h+='<div id="ie-trans" hidden class="ie-passage"><p>'+esc(L.script)+'</p></div><button type="button" id="ie-transbtn" data-act="ls-trans" hidden>Tampilkan / sembunyikan transkrip</button><p class="hint">Transkrip terbuka setelah jawaban diperiksa.</p></div><div class="ie-card"><h4>Soal 1–'+n+'</h4><div>';
    L.q.forEach(function(q,i){var p=q[0].split("____");h+='<div class="ie-q"><div class="qt"><b>'+(i+1)+'</b>'+esc(p[0])+'<input class="ie-gap" id="ie-lq-'+i+'" aria-label="Jawaban soal '+(i+1)+'" autocomplete="off">'+esc(p.slice(1).join(" "))+'</div><div class="ie-fb" hidden id="ie-lfb-'+i+'"></div></div>'});
    h+='</div><div class="ie-row"><button type="button" class="primary" data-act="ls-check">Periksa jawaban</button><button type="button" data-act="ls-reset">Kosongkan</button><span class="ie-score" id="ie-lscore"></span></div></div></div>';
    return h}
  var GEN_TOPICS=["mine site safety rules","equipment maintenance and reliability","renting a house in Perth","a community festival in a regional town","solar power for remote communities","workplace training programs","Australian wildlife protection","fly-in fly-out work and family life","opening of a new regional hospital","water saving in dry regions","the history of a gold-mining town","automation in heavy industry","a local sports club","starting a small business","public transport in Brisbane","volunteering programs"];
  function speakable(t){return String(t||"").replace(/^\s*[A-Z][A-Za-z .'-]{0,24}:\s*/gm,"")}
  async function genSet(k){
    if(!SAMPLE||ex.gen)return;
    ex.gen=k;ex.genErr="";ex.genErrK=k;renderBody();
    var topic=GEN_TOPICS[Math.floor(Math.random()*GEN_TOPICS.length)];
    var p=k==="R"
      ?"Write an original reading practice passage for an IELTS General Training candidate. "+lvlSpec("R")+" About: "+topic+". Then write 6 TRUE/FALSE/NOT GIVEN statements (at least 2 FALSE and at least 2 NOT GIVEN, each decidable only from the passage, paraphrased rather than copied) and 4 sentence-completion items in passage order whose answer is ONE WORD AND/OR A NUMBER copied exactly from the passage.\n\nReply with only one JSON object of this shape:\n{\"title\":\"...\",\"paragraphs\":[\"...\"],\"tfng\":[{\"statement\":\"...\",\"answer\":\"TRUE\",\"why\":\"penjelasan singkat dalam Bahasa Indonesia yang menyebut paragraf A-E\"}],\"completion\":[{\"sentence\":\"text with exactly one ____ gap\",\"answers\":[\"word\"],\"where\":\"Paragraf B\"}]}\nanswer must be TRUE, FALSE or NOT GIVEN. List every acceptable form in answers (e.g. [\"40\",\"forty\"])."
      :"Write an original IELTS Listening practice script. "+lvlSpec("L")+" About: "+topic+", set in Australia. Use either a conversation between two people or one speaker giving information. Include specific details a listener must catch: names spelled out letter by letter, numbers, prices, times, days and places. For a conversation, start each turn on a new line with the speaker's first name and a colon. Then write 7 note-completion items in script order; each answer is ONE or TWO WORDS AND/OR A NUMBER actually said in the script.\n\nReply with only one JSON object of this shape:\n{\"title\":\"short title\",\"script\":\"...\",\"questions\":[{\"sentence\":\"note with exactly one ____ gap\",\"answers\":[\"every acceptable form, e.g. 40\",\"forty\"],\"display\":\"the answer as written in the key\"}]}";
    try{
      var d=await SAMPLE.json(p,{cache:false}),id=(k==="R"?"r-":"l-")+Date.now();
      if(!d||typeof d!=="object")throw{code:"invalid_json"};
      var gap=function(x){return typeof x==="string"&&x.indexOf("____")>=0};
      var answers=function(a){return(Array.isArray(a)?a:[a]).map(norm).filter(Boolean)};
      if(k==="R"){
        var ps=(Array.isArray(d.paragraphs)?d.paragraphs:[]).map(String).filter(function(x){return x.trim()}).slice(0,6);
        var tf=(Array.isArray(d.tfng)?d.tfng:[]).map(function(q){var a=String(q&&q.answer||"").toUpperCase().trim();return[String(q&&q.statement||""),a,String(q&&q.why||"")]}).filter(function(q){return q[0]&&["TRUE","FALSE","NOT GIVEN"].indexOf(q[1])>=0}).slice(0,8);
        var cp=(Array.isArray(d.completion)?d.completion:[]).filter(function(q){return q&&gap(q.sentence)&&answers(q.answers).length}).map(function(q){var a=Array.isArray(q.answers)?q.answers:[q.answers];return[q.sentence,answers(q.answers),String(q.where||""),String(a[0])]}).slice(0,5);
        if(ps.length<3||tf.length<4||cp.length<2)throw{code:"invalid_json"};
        ex.readSet={id:id,title:String(d.title||"Reading practice").slice(0,120),p:ps,tfng:tf,comp:cp};ex.readDone=false;
      }else{
        var qs=(Array.isArray(d.questions)?d.questions:[]).filter(function(q){return q&&gap(q.sentence)&&answers(q.answers).length}).map(function(q){var a=Array.isArray(q.answers)?q.answers:[q.answers];return[q.sentence,answers(q.answers),String(q.display||a[0])]}).slice(0,10);
        if(!d.script||qs.length<4)throw{code:"invalid_json"};
        ex.listenSet={id:id,title:String(d.title||"Listening practice").slice(0,120),script:String(d.script),q:qs};ex.listenDone=false;
      }
    }catch(e){if(!e||e.code!=="cancelled")ex.genErr=e&&e.code==="invalid_json"?"Soal yang dibuat tidak lengkap. Tekan Buat soal baru sekali lagi.":xErr(e)}
    ex.gen=null;renderBody();
  }
  function exGram(){
    var h='<div class="ie-card"><h4>Kuis grammar · kesalahan yang sering menurunkan band</h4><div>';
    gramSet().forEach(function(q,i){var a=ex.gram[i];h+='<div class="ie-q"><div class="qt"><b>'+(i+1)+'</b>'+esc(q[0])+'</div><div class="ie-opts">'+q[1].map(function(o,j){var cls="";if(a!=null){if(j===q[2])cls=" right";else if(j===a)cls=" wrong"}return'<button type="button" class="chip'+cls+'" data-gq="'+i+'" data-go="'+j+'"'+(a!=null?" disabled":"")+'>'+esc(o)+'</button>'}).join("")+'</div>'+(a!=null?'<div class="ie-fb '+(a===q[2]?"ok":"no")+'">'+(a===q[2]?"Benar. ":"Belum tepat. ")+q[3]+'</div>':"")+'</div>'});
    var G=gramSet(),n=Object.keys(ex.gram).length,c=Object.keys(ex.gram).filter(function(k){return ex.gram[k]===G[k][2]}).length;
    h+='</div><div class="ie-row"><span class="ie-score">Skor: '+c+' / '+n+(n===G.length?" · selesai":"")+'</span><button type="button" data-act="gram-new">Soal baru (acak)</button><button type="button" data-act="gram-reset">Ulangi kuis</button>'+(n===G.length?'<button type="button" class="soft" data-act="gram-log">Catat skor ke Progres</button>':"")+'</div></div>';
    return h}
  function exWrite(){
    var list=ex.wType==="t2"?T2:T1,p=list[ex.wIdx%list.length],min=ex.wType==="t2"?40:20,target=ex.wType==="t2"?250:150;
    var key=ex.wType+"-"+(ex.wIdx%list.length),txt=st.draft[key]||"";
    var h='<div class="ie-grid2"><div class="ie-card"><div class="ie-row"><button type="button" class="chip" data-wt="t2" aria-pressed="'+(ex.wType==="t2")+'">Task 2 · esai</button><button type="button" class="chip" data-wt="t1" aria-pressed="'+(ex.wType==="t1")+'">Task 1 GT · surat</button></div>'
      +'<h5>Soal '+(ex.wIdx%list.length+1)+' dari '+list.length+'</h5><div class="ie-prompt">'+esc(p)+'</div>'
      +'<div class="ie-row"><button type="button" data-act="w-next">Soal lain</button><button type="button" class="primary" data-act="w-timer" data-min="'+min+'">Mulai timer '+min+' menit</button><span class="ie-timer" id="ie-wtimer">'+(timer.label==="w"?mmss(timer.left):pad(min)+":00")+'</span></div>'
      +'<label for="ie-draft">Tulisan Anda (tersimpan otomatis)<textarea id="ie-draft" class="ie-draft" data-key="'+key+'" spellcheck="false">'+esc(txt)+'</textarea></label>'
      +'<div class="ie-row"><span class="ie-wc" id="ie-wc"></span><span class="hint">Minimal '+target+' kata. Spell-check dimatikan, sama seperti tes.</span></div></div>'
      +'<div class="ie-card">'+wAssessHtml(key)+'<h4>Checklist sebelum selesai</h4><div class="ie-checks">'
      +(ex.wType==="t2"?["Intro memparafrase soal & posisi saya jelas","Menjawab SEMUA bagian pertanyaan","Tiap body paragraph punya 1 ide utama + contoh","Ada minimal 3 kalimat kompleks (relative clause, conditional, passive)","Linking word bervariasi, tidak diulang-ulang","Tidak ada kalimat yang disalin dari soal","Cek article, plural -s, dan subject–verb agreement","Kesimpulan tidak membawa ide baru"]
        :["Nada surat sesuai penerima (formal / semi / informal)","Salam pembuka & penutup cocok","Ketiga bullet point dijawab","Tujuan surat jelas di paragraf pertama","Detail spesifik (tanggal, nama, angka)","Cek article, plural -s, ejaan"]).map(function(c,i){return'<label class="ie-tk" for="ie-wc-'+i+'"><input type="checkbox" id="ie-wc-'+i+'"><span>'+c+'</span></label>'}).join("")
      +'</div><button type="button" class="soft" data-act="w-log">Catat sesi Writing ke Progres</button></div></div>';
    return h}
  function exSpeak(){
    var c=CUE[ex.cue%CUE.length];
    if(!ex.p1.length)ex.p1=P1.slice().sort(function(){return Math.random()-.5}).slice(0,4);
    return'<div class="ie-grid2"><div class="ie-card"><h4>Part 2 · Cue card</h4><div class="ie-prompt"><b>'+esc(c[0])+'</b><br><span class="ie-sub">You should say: '+esc(c[1])+'</span></div>'
      +'<div class="ie-row"><button type="button" data-act="s-next">Kartu lain</button><button type="button" class="primary" data-act="s-prep">Persiapan 1 menit</button><button type="button" class="primary" data-act="s-talk">Bicara 2 menit</button><span class="ie-timer" id="ie-stimer">'+(timer.label==="s"?mmss(timer.left):"01:00")+'</span></div>'
      +'<p class="hint">Rekam dengan HP Anda sendiri, lalu dengarkan: apakah ada jeda panjang, bunyi akhir -ed/-s hilang, atau kata “ee…” berulang?</p></div>'
      +'<div class="ie-card"><h4>Part 1 · Pertanyaan acak</h4><ul>'+ex.p1.map(function(q){return"<li>"+esc(q)+"</li>"}).join("")+'</ul><button type="button" data-act="s-p1">Acak lagi</button>'
      +'<h5>Pola jawaban 2–3 kalimat</h5><div class="ie-model">Q: What do you do for work?<br>A: I work as a maintenance planner in the mining industry. <mark>Basically, my job is to</mark> schedule repairs so that the trucks spend as little time out of action as possible, <mark>which I find</mark> quite rewarding.</div>'
      +'<button type="button" class="soft" data-act="s-log">Catat sesi Speaking ke Progres</button></div></div>'}
  /* ----- Examiner AI (Speaking 2 arah) ----- */
  var SAMPLE,SAMPLE_OK=null;
  (async function(){try{SAMPLE=window.claude&&window.claude.use?await window.claude.use("sample"):null}catch(_){SAMPLE=null}SAMPLE_OK=!!SAMPLE;if(tab==="latihan"&&ex.sub==="exam")renderBody()})();
  var XMODES={p1:["Part 1","Perkenalan & topik sehari-hari, 4–5 menit"],p2:["Part 2","Cue card + 1–2 pertanyaan lanjutan"],p3:["Part 3","Diskusi abstrak tentang satu topik"],full:["Full test","Part 1 → 2 → 3, ±14 menit"]};
  var EX={mode:"p1",turns:[],live:"",busy:false,ended:false,fb:null,fbBusy:false,err:"",voice:true,ctl:null,t0:0,logged:false,draft:""};
  function xRules(m){
    var plan={p1:"Run ONLY Part 1: greet the candidate, ask their name and what they do, then 4 to 6 questions across two familiar topics (work, hometown, daily routine, free time, technology, travel). Then end.",
      p2:"Run ONLY Part 2: give one cue card on a work or life topic (topic line + 'You should say:' with 4 bullet points), tell the candidate they have one minute to prepare and should speak for one to two minutes, then after their talk ask one or two short rounding-off questions. Then end.",
      p3:"Run ONLY Part 3: name a broad theme (for example work, technology, safety, education or living abroad) and ask 5 to 6 discussion questions that need opinions, comparisons, reasons and speculation, building on what the candidate says. Then end.",
      full:"Run the FULL test in order: Part 1 (name, work, 4 to 5 questions on two familiar topics), then Part 2 (one cue card, tell them one minute to prepare and one to two minutes to speak, then one rounding-off question), then Part 3 (4 to 5 discussion questions linked to the Part 2 topic). Announce each new part briefly. Then end."}[m];
    return "You are a certified IELTS Speaking examiner running a realistic practice test. The candidate is an Indonesian maintenance planner from the mining industry who wants band 7 to work in Australia.\n\n"
      +plan+"\n\nRules:\n- Speak only as the examiner, in natural spoken British or Australian English.\n- Each reply is short: at most one brief acknowledgement plus exactly ONE question (or the cue card).\n- Follow up on what the candidate actually said, the way a real examiner would.\n- Never correct, praise or give feedback during the test.\n- Plain text only: no markdown, no bullet symbols except '-' on cue card lines, no stage directions.\n- When the plan is complete, say exactly: 'Thank you. That is the end of the speaking test.' and add [END] at the very end.\n\nBegin now with your first line.";
  }
  var clean=function(t){return String(t||"").replace(/\[END\]/g,"").trim()};
  function xErr(e){var c=e&&e.code;
    if(c==="not_granted"||c==="sampling_disabled"||c==="not_declared"||c==="capability_disabled"||c==="capability_removed"){SAMPLE_OK=false;return"Examiner AI tidak diizinkan di tampilan ini. Izinkan halaman memakai Claude saat diminta, lalu muat ulang."}
    if(c==="rate_limited")return"Terlalu banyak permintaan atau batas pemakaian Claude tercapai. Tunggu sebentar lalu coba lagi.";
    if(c==="session_expired")return"Sesi login berakhir. Muat ulang halaman lalu masuk lagi.";
    if(c==="refused")return"Examiner tidak bisa menjawab pesan itu. Coba ubah jawaban Anda.";
    if(c==="invalid_json")return"Penilaian tidak terbaca. Tekan tombol nilai sekali lagi.";
    return"Koneksi ke examiner terputus. Tekan Kirim lagi untuk mencoba ulang.";}
  function xScroll(){var c=$("ie-chat");if(c)c.scrollTop=c.scrollHeight}
  async function xAsk(){
    if(!SAMPLE||EX.busy)return;
    EX.busy=true;EX.live="";EX.err="";EX.ctl=new AbortController();renderBody();xScroll();
    try{
      var r=await SAMPLE(EX.turns,{cache:false,modelTier:"quick",signal:EX.ctl.signal,onText:function(u){EX.live=u.text;var el=$("ie-live");if(el){el.textContent=clean(u.text);xScroll()}}});
      EX.turns.push({role:"assistant",content:r.text});
      if(/\[END\]/.test(r.text))EX.ended=true;
      if(EX.voice)say(clean(r.text),0.95);
    }catch(e){if(e&&e.code!=="cancelled")EX.err=xErr(e)}
    EX.busy=false;EX.live="";renderBody();xScroll();
    var a=$("ie-ans");if(a&&!EX.ended)a.focus();
  }
  function xStart(){if(window.speechSynthesis)speechSynthesis.cancel();EX.turns=[{role:"user",content:xRules(EX.mode)}];EX.ended=false;EX.fb=null;EX.err="";EX.logged=false;EX.t0=Date.now();EX.aid="s:"+Date.now();EX.draft="";xAsk()}
  function xSend(){var a=$("ie-ans"),t=(a?a.value:EX.draft).trim();if(!t||EX.busy||EX.ended||EX.turns.length<2)return;if(window.speechSynthesis)speechSynthesis.cancel();EX.turns.push({role:"user",content:t.slice(0,4000)});EX.draft="";xAsk()}
  function xAnswers(){return EX.turns.slice(1).filter(function(t){return t.role==="user"}).length}
  async function xFeedback(){
    if(!SAMPLE||EX.fbBusy||xAnswers()<2)return;
    var tr=EX.turns.slice(1).map(function(t){return(t.role==="assistant"?"Examiner: ":"Candidate: ")+clean(t.content)}).join("\n");
    var p="You are a strict, experienced IELTS Speaking examiner. Assess the CANDIDATE in this practice transcript against the official IELTS Speaking band descriptors. The candidate typed or voice-typed their answers, so pronunciation cannot be judged; judge Fluency and Coherence from length, development, linking and coherence of the answers. Use bands in 0.5 steps and be realistic, not generous.\n\nTranscript:\n"+tr.slice(-30000)
      +"\n\nReply with only one JSON object of this shape:\n{\"fc\":6.5,\"lr\":6,\"gra\":6,\"overall\":6.5,\"summary\":\"2-3 kalimat dalam Bahasa Indonesia\",\"strengths\":[\"poin singkat Bahasa Indonesia\"],\"fixes\":[{\"said\":\"kalimat asli kandidat persis\",\"better\":\"versi band 7+ dalam bahasa Inggris\",\"why\":\"alasan singkat Bahasa Indonesia\"}],\"vocab\":[\"frasa bahasa Inggris berguna untuk topik ini\"],\"next\":\"satu fokus latihan berikutnya, Bahasa Indonesia\"}\nGive at most 3 strengths, 5 fixes (taken from what the candidate really wrote) and 6 vocab items. overall is the average of fc, lr and gra rounded to the nearest 0.5.";
    EX.fbBusy=true;EX.err="";renderBody();
    try{
      var d=await SAMPLE.json(p,{cache:false});
      var n=function(v){v=+v;return v>=1&&v<=9?Math.round(v*2)/2:null};
      if(!d||typeof d!=="object")throw{code:"invalid_json"};
      EX.fb={fc:n(d.fc),lr:n(d.lr),gra:n(d.gra),overall:n(d.overall),summary:String(d.summary||""),strengths:(Array.isArray(d.strengths)?d.strengths:[]).slice(0,3).map(String),
        fixes:(Array.isArray(d.fixes)?d.fixes:[]).slice(0,5).filter(function(f){return f&&f.better}).map(function(f){return{said:String(f.said||""),better:String(f.better),why:String(f.why||"")}}),
        vocab:(Array.isArray(d.vocab)?d.vocab:[]).slice(0,6).map(String),next:String(d.next||"")};
      if(EX.fb.overall==null){var arr=[EX.fb.fc,EX.fb.lr,EX.fb.gra].filter(function(x){return x!=null});if(arr.length)EX.fb.overall=overall(arr)}
      EX.fb.counted=EX.fb.overall!=null&&xAnswers()>=4;
      if(EX.fb.counted)addAssess("S",EX.fb.overall,"Speaking · Examiner AI "+XMODES[EX.mode][0],EX.aid);
    }catch(e){if(!e||e.code!=="cancelled")EX.err=xErr(e)}
    EX.fbBusy=false;renderBody();
  }
  function exExam(){
    if(SAMPLE_OK===null)return'<div class="ie-card"><p class="ie-sub">Menyiapkan examiner AI…</p></div>';
    if(!SAMPLE_OK)return'<div class="ie-card"><h4>Examiner AI belum tersedia di tampilan ini</h4><p>Fitur ini memakai Claude dari akun Anda, jadi halaman harus dibuka di Claude dalam keadaan login. Jika Anda menolak izin, muat ulang halaman lalu pilih Izinkan.</p><p class="hint">Sementara itu, latihan Speaking satu arah (cue card + timer) tetap bisa dipakai.</p></div>';
    var started=EX.turns.length>1||EX.busy,h='<div class="ie-grid2"><div class="ie-card"><div class="ie-row" style="justify-content:space-between"><h4>Examiner AI</h4><label class="ie-tk" for="ie-xvoice"><input type="checkbox" id="ie-xvoice"'+(EX.voice?" checked":"")+'><span>Examiner bersuara (aksen Australia)</span></label></div>';
    h+='<div class="ie-opts">'+Object.keys(XMODES).map(function(k){return'<button type="button" class="chip" data-xmode="'+k+'" aria-pressed="'+(EX.mode===k)+'"'+(started&&!EX.ended?" disabled":"")+' title="'+esc(XMODES[k][1])+'">'+XMODES[k][0]+'</button>'}).join("")+'</div><p class="ie-sub">'+esc(XMODES[EX.mode][1])+'</p>';
    if(!started)h+='<div class="ie-model">Examiner akan bertanya satu per satu, menanggapi jawaban Anda, dan bertanya lanjutan seperti tes asli. Tidak ada koreksi selama tes. Setelah selesai, tekan <b>Nilai jawaban saya</b> untuk skor per kriteria dan perbaikan kalimat.</div><div class="ie-row"><button type="button" class="primary" data-act="x-start">Mulai tes</button></div>';
    else{
      h+='<div class="ie-chat" id="ie-chat">'+EX.turns.slice(1).map(function(t,i,a){var isEx=t.role==="assistant";return'<div class="ie-msg '+(isEx?"ex":"me")+'"><div class="ie-who">'+(isEx?"Examiner":"Anda")+'</div>'+esc(clean(t.content))+(isEx&&i===a.length-1&&!EX.busy&&window.speechSynthesis?'<div><button type="button" class="ghost" data-act="x-replay">Dengar lagi</button></div>':'')+'</div>'}).join("")
        +(EX.busy?'<div class="ie-msg ex"><div class="ie-who">Examiner</div><span id="ie-live">'+(EX.live?esc(clean(EX.live)):'…')+'</span></div>':'')+'</div>';
      if(EX.err)h+='<p class="ie-fb no">'+esc(EX.err)+'</p>';
      if(!EX.ended)h+='<label for="ie-ans">Jawaban Anda (bahasa Inggris)<textarea id="ie-ans" rows="4" placeholder="Ketik, atau tekan Windows + H untuk mengetik dengan suara…">'+esc(EX.draft)+'</textarea></label>'
        +'<div class="ie-row"><button type="button" class="primary" data-act="x-send"'+(EX.busy?" disabled":"")+'>Kirim jawaban</button>'+(EX.busy?'<button type="button" data-act="x-stop">Stop</button>':'')+'<span class="hint">Ctrl + Enter untuk kirim</span></div>';
      else h+='<p class="ie-fb ok">Tes selesai. Tekan Nilai jawaban saya untuk melihat skor.</p>';
      h+='<div class="ie-row"><button type="button" data-act="x-start"'+(EX.busy?" disabled":"")+'>Mulai ulang</button></div>';
    }
    h+='<p class="hint">Agar benar-benar berbicara: di laptop Windows tekan <b>Windows + H</b> lalu bicara, teks masuk otomatis ke kotak jawaban. Di HP, pakai tombol mikrofon pada keyboard. Halaman ini tidak bisa merekam mikrofon langsung.</p></div>';
    h+='<div class="ie-card"><h4>Penilaian</h4>';
    if(EX.fbBusy)h+='<p class="ie-sub">Examiner sedang menilai… biasanya 10–60 detik.</p>';
    else if(EX.fb){var f=EX.fb;
      h+='<div class="ie-skills">'+[["Fluency & Coherence",f.fc],["Lexical Resource",f.lr],["Grammar",f.gra],["Overall",f.overall]].map(function(x){var ok=x[1]!=null&&x[1]>=7;return'<div class="ie-sk"><span class="k">'+x[0]+'</span><span class="mono" style="font-size:20px;color:'+(x[1]==null?"var(--muted)":ok?"var(--ok)":"var(--ink)")+'">'+(x[1]==null?"—":fmt(x[1]))+'</span></div>'}).join("")+'</div>'
        +'<p class="hint">Pronunciation tidak dinilai karena jawaban berupa teks. Ini perkiraan latihan, bukan skor resmi.</p>'
        +(f.summary?'<p>'+esc(f.summary)+'</p>':'')
        +(f.strengths.length?'<h5>Yang sudah bagus</h5><ul>'+f.strengths.map(function(s){return"<li>"+esc(s)+"</li>"}).join("")+'</ul>':'')
        +(f.fixes.length?'<h5>Perbaikan kalimat</h5><div>'+f.fixes.map(function(x){return'<div class="ie-q">'+(x.said?'<div class="qt" style="color:var(--muted)">'+esc(x.said)+'</div>':'')+'<div class="qt"><b>→</b>'+esc(x.better)+'</div>'+(x.why?'<div class="hint">'+esc(x.why)+'</div>':'')+'</div>'}).join("")+'</div>':'')
        +(f.vocab.length?'<h5>Frasa untuk dipakai</h5><div class="ie-opts">'+f.vocab.map(function(v){return'<span class="pill p-acc">'+esc(v)+'</span>'}).join("")+'</div>':'')
        +(f.next?'<h5>Fokus berikutnya</h5><p>'+esc(f.next)+'</p>':'')
        +'<div class="ie-row"><button type="button" class="soft" data-act="x-log"'+(EX.logged?" disabled":"")+'>'+(EX.logged?"Tercatat di Progres":"Catat ke Progres")+'</button>'+'</div><p class="hint">'+(f.counted?'Sudah masuk ke band Speaking di atas. Menilai ulang tes yang sama menggantikan nilai sebelumnya.':'Belum dihitung ke band Speaking: jawab minimal 4 pertanyaan lalu nilai lagi.')+'</p><div>'+'</div>';
    }else h+='<p class="ie-sub">Jawab minimal 2 pertanyaan, lalu minta penilaian. Anda juga bisa menilai di tengah tes.</p>';
    if(!EX.fbBusy)h+='<div class="ie-row"><button type="button" class="primary" data-act="x-fb"'+(xAnswers()<2||EX.busy?" disabled":"")+'>Nilai jawaban saya</button></div>';
    return h+'</div></div>';
  }
  function wAssessHtml(key){
    var f=ex.wfb&&ex.wfb[key],busy=ex.wBusy===key,h='<h4>Penilaian Claude</h4>';
    if(!SAMPLE_OK)return h+'<p class="ie-sub">Penilaian tersedia saat halaman dibuka di Claude dan diizinkan memakai Claude.</p>';
    if(busy)h+='<p class="ie-sub">Examiner sedang menilai… biasanya 10–60 detik.</p>';
    else if(f){
      h+='<div class="ie-skills">'+[[ex.wType==="t2"?"Task Response":"Task Achievement",f.tr],["Coherence",f.cc],["Lexical",f.lr],["Grammar",f.gra]].map(function(x){return'<div class="ie-sk"><span class="k">'+x[0]+'</span><span class="mono" style="font-size:19px">'+(x[1]==null?"—":fmt(x[1]))+'</span></div>'}).join("")+'</div>'
        +'<div class="ie-overall"><span>Band tulisan ini</span><span class="big">'+(f.overall==null?"—":fmt(f.overall))+'</span><span class="hint">Sudah masuk ke band Writing di atas.</span></div>'
        +(f.summary?'<p>'+esc(f.summary)+'</p>':'')
        +(f.fixes.length?'<h5>Perbaikan kalimat</h5><div>'+f.fixes.map(function(x){return'<div class="ie-q">'+(x.said?'<div class="qt" style="color:var(--muted)">'+esc(x.said)+'</div>':'')+'<div class="qt"><b>→</b>'+esc(x.better)+'</div>'+(x.why?'<div class="hint">'+esc(x.why)+'</div>':'')+'</div>'}).join("")+'</div>':'')
        +(f.next?'<h5>Fokus berikutnya</h5><p>'+esc(f.next)+'</p>':'');
    }
    if(ex.wErr)h+='<p class="ie-fb no">'+esc(ex.wErr)+'</p>';
    if(!busy)h+='<div class="ie-row"><button type="button" class="primary" data-act="w-assess"'+(ex.wBusy?" disabled":"")+'>'+(f?"Nilai ulang tulisan ini":"Nilai tulisan saya")+'</button><span class="hint">Nilai ulang untuk soal yang sama menggantikan nilai sebelumnya.</span></div>';
    return h+'<hr style="border:0;border-top:1px solid var(--line);margin:4px 0">';
  }
  async function wAssess(){
    if(!SAMPLE||ex.wBusy)return;
    var list=ex.wType==="t2"?T2:T1,i=ex.wIdx%list.length,key=ex.wType+"-"+i,ta=$("ie-draft"),txt=(ta?ta.value:(st.draft[key]||"")).trim(),n=(txt.match(/\S+/g)||[]).length,min=ex.wType==="t2"?150:100;
    ex.wErr="";
    if(n<min){ex.wErr="Tulis minimal "+min+" kata dulu supaya bisa dinilai (sekarang "+n+" kata).";renderBody();return}
    st.draft[key]=txt.slice(0,12000);persist();
    ex.wBusy=key;renderBody();
    var task=ex.wType==="t2"?"General Training Writing Task 2 (essay, minimum 250 words)":"General Training Writing Task 1 (letter, minimum 150 words)";
    var p="You are a strict, experienced IELTS Writing examiner. Assess this "+task+" against the official public band descriptors: Task Response (Task Achievement for Task 1), Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Penalise under-length or off-topic answers as a real examiner would. Use bands in 0.5 steps and be realistic, not generous.\n\nTask:\n"+list[i]+"\n\nCandidate's response ("+n+" words):\n"+txt.slice(0,12000)
      +"\n\nReply with only one JSON object of this shape:\n{\"tr\":6,\"cc\":6,\"lr\":6,\"gra\":6,\"overall\":6,\"summary\":\"2-3 kalimat Bahasa Indonesia\",\"fixes\":[{\"said\":\"kalimat asli kandidat persis\",\"better\":\"versi band 7+ dalam bahasa Inggris\",\"why\":\"alasan singkat Bahasa Indonesia\"}],\"next\":\"satu fokus perbaikan, Bahasa Indonesia\"}\nGive at most 5 fixes. overall is the average of the four criteria rounded to the nearest 0.5.";
    try{
      var d=await SAMPLE.json(p,{cache:false});
      var nb=function(v){v=+v;return v>=1&&v<=9?Math.round(v*2)/2:null};
      if(!d||typeof d!=="object")throw{code:"invalid_json"};
      var f={tr:nb(d.tr),cc:nb(d.cc),lr:nb(d.lr),gra:nb(d.gra),overall:null,summary:String(d.summary||""),next:String(d.next||""),
        fixes:(Array.isArray(d.fixes)?d.fixes:[]).slice(0,5).filter(function(x){return x&&x.better}).map(function(x){return{said:String(x.said||""),better:String(x.better),why:String(x.why||"")}})};
      var crit=[f.tr,f.cc,f.lr,f.gra].filter(function(x){return x!=null});
      f.overall=crit.length===4?overall(crit):nb(d.overall);
      ex.wfb=ex.wfb||{};ex.wfb[key]=f;
      if(f.overall!=null)addAssess("W",f.overall,(ex.wType==="t2"?"Writing Task 2":"Writing Task 1")+" #"+(i+1),"w:"+key,ex.wType==="t2"?2:1);
    }catch(e){if(!e||e.code!=="cancelled")ex.wErr=xErr(e)}
    ex.wBusy=null;renderBody();
  }
  function mmss(s){return pad(Math.floor(s/60))+":"+pad(s%60)}
  function startTimer(sec,label,elId){clearInterval(timer.id);timer.left=sec;timer.label=label;var tick=function(){var e=$(elId);if(e){e.textContent=mmss(timer.left);e.classList.toggle("low",timer.left<=60&&sec>120||timer.left<=10)}if(timer.left<=0){clearInterval(timer.id);timer.label="";if(e)e.textContent="Waktu habis";return}timer.left--};tick();timer.id=setInterval(tick,1000)}

  /* ----- Kosakata ----- */
  var voc={deck:"mine",i:0,flip:false,only:false};
  function deckCards(){var d=DECKS[voc.deck].c;return voc.only?d.filter(function(c){return!st.cards[voc.deck+":"+c[0]]}):d}
  function renderKosakata(){
    var cards=deckCards(),all=DECKS[voc.deck].c,known=all.filter(function(c){return st.cards[voc.deck+":"+c[0]]}).length;
    var h='<div class="ie-decks">'+Object.keys(DECKS).map(function(k){var n=DECKS[k].c.filter(function(c){return st.cards[k+":"+c[0]]}).length;return'<button type="button" class="chip" data-deck="'+k+'" aria-pressed="'+(voc.deck===k)+'">'+DECKS[k].n+' · '+n+'/'+DECKS[k].c.length+'</button>'}).join("")+'</div>';
    h+='<div class="ie-grid2"><div class="ie-card ie-flash"><div class="barlab"><span>Sudah hafal '+known+' / '+all.length+'</span><label class="ie-tk" for="ie-only" style="text-transform:none"><input type="checkbox" id="ie-only"'+(voc.only?" checked":"")+'><span>Hanya yang belum hafal</span></label></div><div class="bar ok"><i style="width:'+(known/all.length*100)+'%"></i></div>';
    if(!cards.length)h+='<div class="empty">Semua kartu di dek ini sudah hafal. Matikan filter untuk mengulang.</div>';
    else{var c=cards[voc.i%cards.length];
      h+='<div class="ie-fc" data-act="v-flip" role="button" tabindex="0" aria-label="Balik kartu"><div class="term">'+esc(c[0])+'</div>'+(voc.flip?'<div class="mean">'+esc(c[1])+'</div><div class="ex">“'+esc(c[2])+'”</div>':'<div class="tap">Ketuk untuk melihat arti & contoh</div>')+'</div>'
        +'<div class="ie-row" style="justify-content:space-between"><button type="button" data-act="v-prev">‹ Sebelumnya</button><span class="ie-score">'+(voc.i%cards.length+1)+' / '+cards.length+'</span><button type="button" data-act="v-next">Berikutnya ›</button></div>'
        +'<div class="ie-row" style="justify-content:center"><button type="button" class="danger" data-act="v-again">Ulangi lagi</button><button type="button" class="primary" data-act="v-know">Sudah hafal</button>'+(window.speechSynthesis?'<button type="button" data-act="v-say">Dengar pengucapan</button>':"")+'</div>'}
    h+='</div><div class="ie-card"><h4>Daftar lengkap · '+DECKS[voc.deck].n+'</h4><ul class="ie-vlist">'+all.map(function(c){return'<li class="'+(st.cards[voc.deck+":"+c[0]]?"known":"")+'"><b>'+esc(c[0])+'</b> — '+esc(c[1])+'</li>'}).join("")+'</ul><p class="hint">Tips: tulis 1 kalimat tentang pekerjaan Anda sendiri untuk tiap kata baru. Kosakata tambang ini paling berguna di Speaking & interview kerja.</p></div></div>';
    return h}

  /* ----- Progres ----- */
  function renderProgres(){
    var mins=st.logs.reduce(function(a,l){return a+(+l.min||0)},0),days={};st.logs.forEach(function(l){days[l.date]=1});
    var streak=0,d=new Date();for(;;){var k=d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());if(days[k]){streak++;d.setDate(d.getDate()-1)}else if(streak===0&&k===todayStr()){d.setDate(d.getDate()-1)}else break}
    var last=st.mocks.length?st.mocks[st.mocks.length-1]:null;
    var h='<div class="ledger"><div class="stat"><div class="k">Total belajar</div><div class="v">'+(mins/60).toFixed(1)+' jam</div><div class="s">'+st.logs.length+' sesi</div></div><div class="stat"><div class="k">Streak harian</div><div class="v">'+streak+' hari</div><div class="s">berturut-turut</div></div>'
      +'<div class="stat net"><div class="k">Mock test terakhir</div><div class="v">'+(last?fmt(overall([last.L,last.R,last.W,last.S])):"—")+'</div><div class="s">'+(last?"L "+fmt(last.L)+" · R "+fmt(last.R)+" · W "+fmt(last.W)+" · S "+fmt(last.S):"belum ada")+'</div></div>'
      +'<div class="stat"><div class="k">Section terlemah</div><div class="v">'+(last?SK[["L","R","W","S"].sort(function(a,b){return last[a]-last[b]})[0]]:"—")+'</div><div class="s">fokus minggu ini</div></div></div>';
    h+='<div class="ie-grid2"><div class="ie-card"><h4>Tren skor mock test</h4>'+chart()+'</div>'
      +'<form class="ie-card" id="ie-mockf"><h4>Catat skor practice test resmi</h4><p class="hint">Hanya untuk riwayat dan grafik. Band di bagian atas tetap dari penilaian latihan.</p><div class="ie-skills">'+["L","R","W","S"].map(function(k){return'<label for="ie-m-'+k+'">'+SK[k]+'<select id="ie-m-'+k+'">'+BANDS.map(function(x){return'<option value="'+x+'"'+(x===6?" selected":"")+'>'+fmt(x)+'</option>'}).join("")+'</select></label>'}).join("")+'</div>'
      +'<label for="ie-m-date">Tanggal<input type="date" id="ie-m-date" value="'+todayStr()+'"></label><div class="actions"><button type="submit" class="primary">Simpan skor</button></div></form></div>';
    var as=[];["L","R","W","S"].forEach(function(k){(st.assess[k]||[]).forEach(function(x){as.push({k:k,x:x})})});as.sort(function(a,b){return(b.x.ts||0)-(a.x.ts||0)});
    h+='<div class="ie-card"><h4>Riwayat penilaian band</h4>'+(as.length?'<ul class="list">'+as.slice(0,20).map(function(r){return'<li class="mid"><span class="pill p-acc">'+SK[r.k]+'</span><div class="grow"><div class="ttl">'+esc(r.x.src||"Latihan")+'</div><div class="meta"><span class="mono">'+esc(r.x.d)+'</span></div></div><span class="mono" style="font-size:17px">'+fmt(r.x.b)+'</span></li>'}).join("")+'</ul>':'<div class="empty">Belum ada penilaian. Kerjakan latihan Reading, Listening, Writing atau Speaking di tab Latihan.</div>')+'</div>';
    h+='<div class="ie-grid2"><form class="ie-card" id="ie-logf"><h4>Catat sesi belajar</h4><div style="display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr))"><label for="ie-l-date">Tanggal<input type="date" id="ie-l-date" value="'+todayStr()+'"></label><label for="ie-l-sk">Skill<select id="ie-l-sk"><option value="L">Listening</option><option value="R">Reading</option><option value="W">Writing</option><option value="S">Speaking</option><option value="V">Kosakata</option><option value="G">Grammar</option></select></label><label for="ie-l-min">Menit<input type="number" id="ie-l-min" min="5" max="600" step="5" value="30"></label><label for="ie-l-sc">Skor (opsional)<input id="ie-l-sc" placeholder="mis. 28/40"></label></div><label for="ie-l-note">Catatan kesalahan / pelajaran<textarea id="ie-l-note" placeholder="mis. salah ejaan “accommodation”, T/F/NG masih bingung"></textarea></label><div class="actions"><button type="submit" class="primary">Simpan sesi</button></div></form>'
      +'<div class="ie-card"><h4>Riwayat</h4>'+(st.logs.length||st.mocks.length?'<ul class="list">'+histRows()+'</ul>':'<div class="empty">Belum ada catatan. Simpan sesi pertama Anda di formulir sebelah.</div>')+'</div></div>';
    return h}
  function histRows(){
    var rows=st.logs.map(function(l,i){return{t:l.date,ts:l.ts||0,h:'<li class="mid"><span class="pill p-acc">'+({L:"Listening",R:"Reading",W:"Writing",S:"Speaking",V:"Kosakata",G:"Grammar"}[l.sk]||l.sk)+'</span><div class="grow"><div class="ttl">'+esc(l.note||"Sesi belajar")+'</div><div class="meta"><span class="mono">'+esc(l.date)+'</span><span>'+(+l.min||0)+' menit</span>'+(l.sc?'<span>Skor '+esc(l.sc)+'</span>':"")+'</div></div><div class="row-actions"><button type="button" class="ghost" data-dlog="'+i+'">Hapus</button></div></li>'}});
    st.mocks.forEach(function(m,i){rows.push({t:m.date,ts:m.ts||0,h:'<li class="mid"><span class="pill p-ok">Mock '+fmt(overall([m.L,m.R,m.W,m.S]))+'</span><div class="grow"><div class="ttl">L '+fmt(m.L)+' · R '+fmt(m.R)+' · W '+fmt(m.W)+' · S '+fmt(m.S)+'</div><div class="meta"><span class="mono">'+esc(m.date)+'</span></div></div><div class="row-actions"><button type="button" class="ghost" data-dmock="'+i+'">Hapus</button></div></li>'})});
    return rows.sort(function(a,b){return a.t<b.t?1:a.t>b.t?-1:b.ts-a.ts}).slice(0,40).map(function(r){return r.h}).join("")}
  function chart(){
    var m=st.mocks.slice().sort(function(a,b){return a.date<b.date?-1:1}).slice(-12);
    if(!m.length)return'<div class="empty">Grafik muncul setelah Anda menyimpan skor mock test pertama.</div>';
    var W=560,H=220,L=36,R=14,T=14,B=30,y=function(v){return T+(9-v)/5*(H-T-B)},n=m.length,x=function(i){return n===1?(L+W-R)/2:L+i*(W-L-R)/(n-1)};
    var s='<svg class="ie-chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Tren skor overall mock test">';
    [4,5,6,7,8,9].forEach(function(v){s+='<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text x="'+(L-8)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v+'</text>'});
    s+='<line class="tgt" x1="'+L+'" x2="'+(W-R)+'" y1="'+y(7)+'" y2="'+y(7)+'"/><text class="tgtl" x="'+(W-R)+'" y="'+(y(7)-6)+'" text-anchor="end">Target 7.0</text>';
    var pts=m.map(function(o,i){return[x(i),y(overall([o.L,o.R,o.W,o.S]))]});
    if(n>1){s+='<path class="ar" d="M'+pts[0][0]+','+y(4)+' L'+pts.map(function(p){return p.join(",")}).join(" L")+' L'+pts[n-1][0]+','+y(4)+' Z"/><path class="ln" d="M'+pts.map(function(p){return p.join(",")}).join(" L")+'"/>'}
    pts.forEach(function(p,i){s+='<circle class="pt" cx="'+p[0]+'" cy="'+p[1]+'" r="'+(i===n-1?5.5:4)+'"/>';if(i===0||i===n-1||n<=6)s+='<text x="'+p[0]+'" y="'+(H-10)+'" text-anchor="middle">'+m[i].date.slice(5)+'</text>'});
    return s+'</svg>'}

  /* ----- Australia ----- */
  function renderAus(){
    return'<div class="ie-grid2"><div class="ie-card"><h4>Level bahasa Inggris untuk visa Australia</h4><p class="ie-sub">Untuk tes IELTS yang diambil sejak 7 Agustus 2025 (Academic atau General Training).</p><div class="ie-tbl-w"><table class="ie-tbl"><thead><tr><th>Level</th><th>IELTS minimal</th><th>Arti untuk Anda</th></tr></thead><tbody>'
      +'<tr><td>Vocational</td><td class="mono">5 tiap section</td><td>Syarat dasar beberapa visa</td></tr><tr><td>Competent</td><td class="mono">6 tiap section</td><td>Syarat dasar visa skilled (poin 0)</td></tr><tr class="hl"><td><b>Proficient</b></td><td class="mono"><b>7 tiap section</b></td><td>Target Anda · +10 poin di points test</td></tr><tr><td>Superior</td><td class="mono">8 tiap section</td><td>+20 poin di points test</td></tr></tbody></table></div>'
      +'<p class="hint">Syarat bisa berubah. Selalu cek halaman resmi Home Affairs sebelum mendaftar.</p></div>'
      +'<div class="ie-card"><h4>Profil pekerjaan Anda</h4><ul><li><b>Maintenance Planner</b> — ANZSCO 312911</li><li>Masuk <b>Core Skills Occupation List</b> dan <b>Regional Occupation List</b></li><li>Visa yang terbuka: 482 Skills in Demand (disponsori employer), 186, 494, 491</li><li>Skills assessment: <b>VETASSESS</b></li><li>Pengalaman Anda sejak 2019 + D3 Teknik Pertambangan relevan untuk asesmen</li></ul><p class="hint">Daftar okupasi & syarat visa ditinjau berkala oleh pemerintah Australia — cek ulang saat akan melamar.</p></div></div>'
      +'<div class="ie-grid2"><div class="ie-card"><h4>Langkah menuju kerja di tambang Australia</h4><ol class="ie-steps"><li><span>Capai IELTS 7 di tiap section (mulai dari halaman ini)</span></li><li><span>Siapkan CV format Australia: 2–3 halaman, tanpa foto, fokus pencapaian & angka (MTBF, PA, cost)</span></li><li><span>Skills assessment VETASSESS untuk Maintenance Planner</span></li><li><span>Cari employer sponsor: lowongan FIFO di SEEK, LinkedIn, situs karier perusahaan tambang besar</span></li><li><span>Latih interview berbasis perilaku (metode STAR) dalam bahasa Inggris</span></li><li><span>Pengajuan visa sesuai jalur (482 lewat sponsor, atau 491/186)</span></li></ol></div>'
      +'<div class="ie-card"><h4>Kawasan tambang utama</h4><ul><li><b>Pilbara, WA</b> — bijih besi, FIFO dari Perth</li><li><b>Goldfields (Kalgoorlie), WA</b> — emas & nikel</li><li><b>Bowen Basin, QLD</b> — batu bara</li><li><b>Hunter Valley, NSW</b> — batu bara</li></ul><h5>Contoh jawaban interview (STAR)</h5><div class="ie-model"><b>S</b>: Breakdown data between Plant and the control room only matched about 40% of the time. <b>T</b>: I was asked to fix the reconciliation process. <b>A</b>: I standardised the codes and built a daily cross-check in Excel. <b>R</b>: <mark>Accuracy rose to 95%</mark>, and weekly MTBF reviews became reliable.</div></div></div>'
      +'<div class="ie-card"><h4>Sumber belajar & resmi</h4><div class="ie-links">'+LINKS.map(function(l){return'<a href="'+l[1]+'" target="_blank" rel="noopener"><b>'+l[0]+'</b><span>'+l[2]+'</span></a>'}).join("")+'</div></div>'}

  function renderBody(){
    renderTabs();var h="";
    if(tab==="dasar")h=renderDasar();else if(tab==="plan")h=renderPlan();else if(tab==="materi")h=renderMateri();else if(tab==="latihan")h=renderLatihan();else if(tab==="kosakata")h=renderKosakata();else if(tab==="progres")h=renderProgres();else h=renderAus();
    $("ie-body").innerHTML='<div class="ie" style="gap:14px">'+h+'</div>';
    if(tab==="latihan"&&ex.sub==="write")updWC();
    if(tab==="latihan"&&ex.sub==="listen")voiceHint();
  }

  /* =================== EVENTS =================== */
  function addLog(sk,min,sc,note){st.logs.push({date:todayStr(),sk:sk,min:min,sc:sc||"",note:note||"",ts:Date.now()});persist()}
  function updWC(){var t=$("ie-draft");if(!t)return;var n=(t.value.trim().match(/\S+/g)||[]).length,tg=ex.wType==="t2"?250:150;var e=$("ie-wc");e.textContent=n+" kata";e.style.color=n>=tg?"var(--ok)":"var(--muted)"}
  var voice=null;
  function pickVoice(){if(!window.speechSynthesis)return null;var v=speechSynthesis.getVoices();return v.find(function(x){return/en-AU/i.test(x.lang)})||v.find(function(x){return/en-GB/i.test(x.lang)})||v.find(function(x){return/^en/i.test(x.lang)})||null}
  function voiceHint(){var e=$("ie-voice");if(!e)return;voice=pickVoice();e.textContent=voice?"Suara: "+voice.name+" ("+voice.lang+")"+(/AU/.test(voice.lang)?" · aksen Australia":""):"Suara bahasa Inggris default browser."}
  if(window.speechSynthesis)speechSynthesis.onvoiceschanged=voiceHint;
  function say(text,rate){if(!window.speechSynthesis)return;speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(text);voice=pickVoice();if(voice){u.voice=voice;u.lang=voice.lang}else u.lang="en-AU";u.rate=rate||1;speechSynthesis.speak(u)}

  ["ie-start","ie-test"].forEach(function(id){$(id).addEventListener("change",function(e){st[id==="ie-start"?"start":"testDate"]=e.target.value;persist();renderHero();if(tab==="plan")renderBody()})});
  $("ie-est").addEventListener("change",function(e){var k=e.target.dataset.est;if(!k)return;st.est[k]=+e.target.value;persist();renderHero()});
  $("ie-tabs").addEventListener("click",function(e){var b=e.target.closest("[data-ietab]");if(!b)return;tab=b.dataset.ietab;try{localStorage.setItem(LS+"-tab",tab)}catch(_){}if(window.speechSynthesis)speechSynthesis.cancel();renderBody()});

  var body=$("ie-body");
  body.addEventListener("click",zClick);
  body.addEventListener("change",function(e){var t=e.target;
    if(t.dataset.plan){if(t.checked)st.plan[t.dataset.plan]=1;else delete st.plan[t.dataset.plan];persist();t.closest(".ie-tk").classList.toggle("on",t.checked);var y=body.scrollTop;renderBody();return}
    if(t.id==="ie-xvoice"){EX.voice=t.checked;if(!t.checked&&window.speechSynthesis)speechSynthesis.cancel();return}
    if(t.id==="ie-only"){voc.only=t.checked;voc.i=0;voc.flip=false;renderBody()}
  });
  var draftT=null;
  body.addEventListener("input",function(e){if(e.target.id==="ie-ans")EX.draft=e.target.value;if(e.target.id==="ie-draft"){updWC();var k=e.target.dataset.key,v=e.target.value;clearTimeout(draftT);draftT=setTimeout(function(){st.draft[k]=v.slice(0,12000);persist()},900)}});
  body.addEventListener("keydown",function(e){if(e.target.id==="ie-ans"&&e.key==="Enter"&&(e.ctrlKey||e.metaKey)){e.preventDefault();xSend();return}if((e.key==="Enter"||e.key===" ")&&e.target.dataset&&e.target.dataset.act==="v-flip"){e.preventDefault();e.target.click()}});
  body.addEventListener("submit",function(e){e.preventDefault();var f=e.target;
    if(f.id==="ie-mockf"){var m={date:$("ie-m-date").value||todayStr(),ts:Date.now()};["L","R","W","S"].forEach(function(k){m[k]=+$("ie-m-"+k).value});st.mocks.push(m);persist();renderBody()}
    if(f.id==="ie-logf"){st.logs.push({date:$("ie-l-date").value||todayStr(),sk:$("ie-l-sk").value,min:Math.max(0,Math.min(600,+$("ie-l-min").value||0)),sc:$("ie-l-sc").value.slice(0,40),note:$("ie-l-note").value.slice(0,500),ts:Date.now()});persist();renderBody()}
  });
  body.addEventListener("click",function(e){var t=e.target;
    var b=t.closest("[data-lvl]");if(b){st.level=b.dataset.lvl;persist();ex.gramSet=null;ex.gram={};renderBody();return}
    b=t.closest("[data-iesub]");if(b){ex.sub=b.dataset.iesub;if(window.speechSynthesis)speechSynthesis.cancel();renderBody();return}
    b=t.closest("[data-ropt]");if(b){var g=b.closest("[data-rq]");g.querySelectorAll(".chip").forEach(function(c){c.setAttribute("aria-pressed",String(c===b))});return}
    b=t.closest("[data-gq]");if(b){ex.gram[+b.dataset.gq]=+b.dataset.go;renderBody();return}
    b=t.closest("[data-wt]");if(b){ex.wType=b.dataset.wt;ex.wIdx=0;renderBody();return}
    b=t.closest("[data-deck]");if(b){voc.deck=b.dataset.deck;voc.i=0;voc.flip=false;renderBody();return}
    b=t.closest("[data-dlog]");if(b){if(b.classList.contains("armed")){st.logs.splice(+b.dataset.dlog,1);persist();renderBody()}else{b.classList.add("armed");b.textContent="Yakin hapus?"}return}
    b=t.closest("[data-dmock]");if(b){if(b.classList.contains("armed")){st.mocks.splice(+b.dataset.dmock,1);persist();renderBody()}else{b.classList.add("armed");b.textContent="Yakin hapus?"}return}
    b=t.closest("[data-xmode]");if(b){EX.mode=b.dataset.xmode;renderBody();return}
    b=t.closest("[data-act]");if(!b)return;var a=b.dataset.act;
    if(a==="x-start"){xStart();return}
    if(a==="x-send"){xSend();return}
    if(a==="x-stop"){if(EX.ctl)EX.ctl.abort();return}
    if(a==="x-replay"){var lx=EX.turns[EX.turns.length-1];if(lx&&lx.role==="assistant")say(clean(lx.content),0.95);return}
    if(a==="x-fb"){xFeedback();return}
    if(a==="x-log"){if(EX.fb&&!EX.logged){EX.logged=true;addLog("S",Math.max(1,Math.round((Date.now()-(EX.t0||Date.now()))/60000)),EX.fb.overall!=null?"~"+fmt(EX.fb.overall):"","Examiner AI · "+XMODES[EX.mode][0]);renderBody()}return}
    if(a==="gen-R"||a==="gen-L"){genSet(a.slice(4));return}
    if(a==="w-assess"){wAssess();return}
    if(a==="read-check"){var R=ex.readSet||READ,sc=0,tot=R.tfng.length+R.comp.length;R.tfng.forEach(function(q,i){var sel=body.querySelector('[data-rq="'+i+'"] [aria-pressed="true"]'),v=sel?sel.dataset.ropt:"",ok=v===q[1];if(ok)sc++;
        body.querySelectorAll('[data-rq="'+i+'"] .chip').forEach(function(c){c.classList.remove("right","wrong");if(c.dataset.ropt===q[1])c.classList.add("right");else if(c===sel)c.classList.add("wrong")});
        var f=$("ie-rfb-"+i);f.hidden=false;f.className="ie-fb "+(ok?"ok":"no");f.innerHTML=(ok?"Benar. ":"Jawaban: <b>"+q[1]+"</b>. ")+esc(q[2])});
      R.comp.forEach(function(q,i){var inp=$("ie-rc-"+i),ok=q[1].indexOf(norm(inp.value))>=0&&inp.value.trim()!=="";if(ok)sc++;inp.classList.toggle("right",ok);inp.classList.toggle("wrong",!ok);var f=$("ie-rcfb-"+i);f.hidden=false;f.className="ie-fb "+(ok?"ok":"no");f.textContent=(ok?"Benar. ":"Jawaban: "+(q[3]||q[1][0])+". ")+q[2]});
      var rb=bandFrom("R",sc,tot),first=!st.done[R.id];
      $("ie-rscore").textContent="Skor: "+sc+" / "+tot+" ≈ band "+fmt(rb)+(first?" · dihitung":" · tidak dihitung (percobaan ulang)");
      if(first){st.done[R.id]=1;addAssess("R",rb,"Reading: "+R.title)}
      if(!ex.readDone){ex.readDone=true;addLog("R",15,sc+"/"+tot,"Latihan Reading: "+R.title)}
      return}
    if(a==="read-reset"){ex.readDone=false;renderBody();return}
    if(a==="ls-play"){say(speakable((ex.listenSet||LISTEN).script),+($("ie-rate")||{}).value||1);return}
    if(a==="ls-stop"){if(window.speechSynthesis)speechSynthesis.cancel();return}
    if(a==="ls-trans"){var tr=$("ie-trans");tr.hidden=!tr.hidden;return}
    if(a==="ls-check"){var L=ex.listenSet||LISTEN,s2=0,lt=L.q.length;L.q.forEach(function(q,i){var inp=$("ie-lq-"+i),v=norm(inp.value),ok=v!==""&&q[1].indexOf(v)>=0;if(ok)s2++;inp.classList.toggle("right",ok);inp.classList.toggle("wrong",!ok);var f=$("ie-lfb-"+i);f.hidden=false;f.className="ie-fb "+(ok?"ok":"no");f.textContent=ok?"Benar.":"Jawaban: "+q[2]});
      var lb=bandFrom("L",s2,lt),lf=!st.done[L.id];
      $("ie-lscore").textContent="Skor: "+s2+" / "+lt+" ≈ band "+fmt(lb)+(lf?" · dihitung":" · tidak dihitung (percobaan ulang)");
      $("ie-transbtn").hidden=false;
      if(lf){st.done[L.id]=1;addAssess("L",lb,"Listening: "+L.title)}
      if(!ex.listenDone){ex.listenDone=true;addLog("L",10,s2+"/"+lt,"Latihan Listening: "+L.title)}
      return}
    if(a==="ls-reset"){ex.listenDone=false;renderBody();return}
    if(a==="gram-reset"){ex.gram={};renderBody();return}
    if(a==="gram-new"){ex.gramSet=null;ex.gram={};renderBody();return}
    if(a==="gram-log"){var c=Object.keys(ex.gram).filter(function(k){return ex.gram[k]===gramSet()[k][2]}).length;addLog("G",10,c+"/10","Kuis grammar");b.disabled=true;b.textContent="Tercatat";return}
    if(a==="w-next"){ex.wIdx++;renderBody();return}
    if(a==="w-timer"){startTimer(+b.dataset.min*60,"w","ie-wtimer");return}
    if(a==="w-log"){var tx=($("ie-draft")||{}).value||"",n=(tx.trim().match(/\S+/g)||[]).length;addLog("W",ex.wType==="t2"?40:20,n+" kata",(ex.wType==="t2"?"Task 2: ":"Task 1: ")+(ex.wType==="t2"?T2:T1)[ex.wIdx%(ex.wType==="t2"?T2:T1).length].slice(0,80)+"…");b.disabled=true;b.textContent="Tercatat";return}
    if(a==="s-next"){ex.cue++;clearInterval(timer.id);timer.label="";renderBody();return}
    if(a==="s-prep"){startTimer(60,"s","ie-stimer");return}
    if(a==="s-talk"){startTimer(120,"s","ie-stimer");return}
    if(a==="s-p1"){ex.p1=[];renderBody();return}
    if(a==="s-log"){addLog("S",15,"","Speaking: "+CUE[ex.cue%CUE.length][0]);b.disabled=true;b.textContent="Tercatat";return}
    var cards=deckCards();
    if(a==="v-flip"){voc.flip=!voc.flip;renderBody();return}
    if(a==="v-next"){voc.i=(voc.i+1)%Math.max(1,cards.length);voc.flip=false;renderBody();return}
    if(a==="v-prev"){voc.i=(voc.i-1+cards.length)%Math.max(1,cards.length);voc.flip=false;renderBody();return}
    if(a==="v-know"||a==="v-again"){var cc=cards[voc.i%cards.length];if(!cc)return;var key=voc.deck+":"+cc[0];if(a==="v-know")st.cards[key]=1;else delete st.cards[key];persist();if(!(voc.only&&a==="v-know"))voc.i=(voc.i+1)%Math.max(1,deckCards().length);else voc.i=voc.i%Math.max(1,deckCards().length);voc.flip=false;renderBody();return}
    if(a==="v-say"){var c2=cards[voc.i%cards.length];if(c2)say(c2[0].replace(/\(.*?\)/g,"")+". "+c2[2],0.95);return}
  });

  renderHero();renderBody();
  setSync(window.claude&&window.claude.use?"Menyambungkan progres IELTS…":"Progres disimpan di browser ini.");
})();
// IE-MODUL-JS-SELESAI
