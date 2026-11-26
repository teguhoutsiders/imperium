/* English cepat fasih (Teguh 2026-11-22: "butuh cepat paham dan lekas fasih").
   metode = cara belajar yang terbukti mempercepat bicara; frasa = kalimat siap pakai per situasi kerja, dengan cara baca versi lidah Indonesia.
   Format frasa: [English, arti Indonesia, cara baca, catatan opsional]. Cara baca hanya perkiraan bunyi, bukan ejaan resmi. */
window.ENGLISH_CEPAT = {
  metode: [
    { judul: "Kenapa cepat fasih itu soal kebiasaan, bukan hafalan", isi: "Fasih artinya kalimat keluar otomatis tanpa menerjemahkan di kepala. Itu terbentuk dari mengulang kalimat utuh dengan suara keras, bukan dari menghafal rumus. Grammar tetap penting, tapi fungsinya untuk memeriksa, bukan untuk dipikirkan saat bicara.",
      poin: ["Hafalkan potongan kalimat (chunk), bukan kata satu-satu: 'Could you send me...' lebih berguna daripada kata 'send'.", "Selalu ucapkan keras-keras. Membaca dalam hati tidak melatih mulut.", "Sedikit tapi tiap hari lebih cepat hasilnya daripada banyak tapi seminggu sekali."] },
    { judul: "Rutinitas 30 menit sehari", isi: "Bagi waktu supaya keempat kemampuan jalan bersamaan.",
      poin: ["10 menit Percakapan Siap Pakai: pilih 5 kalimat, ucapkan masing-masing 5 kali, lalu tutup layar dan ucapkan dari ingatan (pakai tombol 'Mode latihan').", "10 menit Grammar: satu topik, baca Pengertian dan Rumus, kerjakan Latihan di bawahnya.", "5 menit Latihan Soal: 10 soal acak. Baca pembahasan untuk tiap jawaban yang salah.", "5 menit bicara sendiri: ceritakan pekerjaan hari ini dalam 5 kalimat bahasa Inggris. Rekam pakai perekam suara HP, dengarkan lagi."] },
    { judul: "Teknik shadowing (meniru langsung)", isi: "Cara tercepat memperbaiki pengucapan dan irama. Cari video YouTube pendek berbahasa Inggris tentang topik kerja (mis. 'heavy equipment maintenance', 'job interview answers').",
      poin: ["Putar 1 kalimat, jeda, tirukan persis termasuk nada naik-turunnya.", "Ulangi kalimat yang sama 3 sampai 5 kali sampai lancar.", "Nyalakan subtitle bahasa Inggris (bukan Indonesia) supaya mata dan telinga belajar bersamaan."] },
    { judul: "Ubah pekerjaan sehari-hari jadi bahan latihan", isi: "Kosakata yang paling cepat melekat adalah yang Bos pakai tiap hari.",
      poin: ["Tulis laporan breakdown harian versi bahasa Inggris 2-3 kalimat: 'Unit DT-12 broke down at 10 a.m. due to a hydraulic leak. Repair is in progress.'", "Ganti bahasa HP dan Excel ke English. Istilah menu otomatis jadi hafal.", "Saat melihat unit di lapangan, sebutkan dalam hati: 'This truck needs a new tire.'"] },
    { judul: "Saat bicara: jangan berhenti karena takut salah", isi: "Orang asing lebih peduli pesannya sampai daripada grammar sempurna. Kalau lupa kata, jelaskan dengan kata lain.",
      poin: ["Lupa kata 'gasket'? Bilang: 'the rubber thing between two metal parts'.", "Pakai kata pengisi untuk beli waktu: 'Well...', 'Let me think...', 'How can I say...'. Lihat kategori 'Beli waktu saat bicara'.", "Kalau tidak paham, minta ulang. Itu normal dan sopan: 'Sorry, could you say that again?'"] },
    { judul: "Ukur kemajuan tiap minggu", isi: "Tanpa ukuran, rasanya seperti tidak maju. Pakai yang sudah ada di menu English.",
      poin: ["Tiap Minggu: Tes Level 15 soal, catat skornya.", "Lihat Progres & Tier: target naik minimal 1 tier per 2 minggu.", "Rekam diri bercerita 1 menit tentang pekerjaan. Bandingkan rekaman minggu ini dengan bulan lalu."] }
  ],
  rencana12: [
    "Minggu 1-2: Percakapan (Perkenalan, Basa-basi) + Grammar Dasar topik 1-3. Target: bisa memperkenalkan diri 1 menit tanpa melihat teks.",
    "Minggu 3-4: Percakapan (Rapat & laporan, Breakdown) + Grammar Dasar topik 4-9. Target: bisa melaporkan 1 breakdown secara lisan.",
    "Minggu 5-8: Percakapan (Telepon & radio, Email, Minta bantuan) + Grammar Menengah. Target: bisa menulis email singkat tanpa terjemahan.",
    "Minggu 9-12: Interview kerja (latih tiap jawaban sampai lancar) + Lanjut & IELTS. Target: menjawab 10 pertanyaan interview masing-masing 1 menit."
  ],
  frasa: [
    { id: "kenal", ikon: "🙋", nama: "Perkenalan diri", ket: "Dipakai di hari pertama kerja, rapat dengan orang baru, dan pembuka interview.", item: [
      ["Hi, I'm Teguh. Nice to meet you.", "Halo, saya Teguh. Senang bertemu Anda.", "hai, aim teguh. nais tu mit yu"],
      ["I work as a maintenance planner.", "Saya bekerja sebagai maintenance planner.", "ai werk es e meintenens planer", "Pakai 'work as' + jabatan."],
      ["I'm from Ketapang, West Kalimantan.", "Saya dari Ketapang, Kalimantan Barat.", "aim from ketapang, west kalimantan"],
      ["I have about seven years of experience in mining maintenance.", "Saya punya sekitar tujuh tahun pengalaman di maintenance tambang.", "ai hev ebaut seven yirs of ekspiriens in maining meintenens", "'experience' tidak diberi -s jika artinya pengalaman kerja."],
      ["I'm responsible for planning, scheduling, and cost control.", "Saya bertanggung jawab atas perencanaan, penjadwalan, dan kontrol biaya.", "aim risponsibel for planing, skejuling, en kost kontrol", "responsible for + kata kerja -ing / kata benda."],
      ["My main focus is dump truck availability.", "Fokus utama saya adalah ketersediaan dump truck.", "mai mein fokus iz damp trak eveilebiliti"],
      ["I'm good at Excel and data analysis.", "Saya mahir Excel dan analisis data.", "aim gud et ekzel en deita enalisis", "good at + keahlian."],
      ["Let me introduce myself.", "Izinkan saya memperkenalkan diri.", "let mi intrades maiself"]
    ]},
    { id: "interview", ikon: "💼", nama: "Interview kerja", ket: "Pola jawaban untuk pertanyaan interview yang paling sering muncul. Latih sampai bisa diucapkan tanpa membaca.", item: [
      ["Q: Tell me about yourself. → I'm a maintenance planner with about seven years of experience in mining. I specialize in planning, KPI reporting, and breakdown analysis.", "Ceritakan tentang diri Anda. → Saya maintenance planner dengan pengalaman sekitar tujuh tahun di tambang, spesialis perencanaan, laporan KPI, dan analisis breakdown.", "ai em e meintenens planer wit ebaut seven yirs of ekspiriens in maining", "Rumus: siapa Anda + pengalaman + keahlian utama. Cukup 30-60 detik."],
      ["Q: What is your greatest achievement? → I improved the accuracy of breakdown data reconciliation from 40 to 95 percent.", "Apa pencapaian terbesar Anda? → Saya meningkatkan akurasi rekonsiliasi data breakdown dari 40 ke 95 persen.", "ai improvd di ekyurasi of breikdaun deita rekonsiliesyen from forti tu naynti faiv persen", "Sebut angka. Angka membuat jawaban meyakinkan."],
      ["Q: Why did you leave your last job? → I'm looking for a bigger challenge and a chance to grow in reliability.", "Kenapa keluar dari pekerjaan terakhir? → Saya mencari tantangan lebih besar dan kesempatan berkembang di bidang reliability.", "aim luking for e biger chelenj en e chens tu grou in rilaiebiliti", "Jawab positif, jangan menjelekkan perusahaan lama."],
      ["Q: What are your strengths? → I'm detail-oriented and good with data.", "Apa kelebihan Anda? → Saya teliti dan kuat di pengolahan data.", "aim ditel orientid en gud wit deita"],
      ["Q: What is your weakness? → My spoken English is still developing, so I practice every day.", "Apa kelemahan Anda? → Bahasa Inggris lisan saya masih berkembang, jadi saya latihan setiap hari.", "mai spoken inglis iz stil divelaping, sou ai prektis evri dei", "Sebut kelemahan yang nyata + usaha memperbaikinya."],
      ["Q: Why should we hire you? → Because I can help reduce downtime by planning maintenance based on data.", "Kenapa kami harus menerima Anda? → Karena saya bisa membantu mengurangi downtime dengan perencanaan berbasis data.", "bikos ai ken help ridyus dauntaim bai planing meintenens beist on deita"],
      ["Could you repeat the question, please?", "Bisa diulang pertanyaannya?", "kud yu ripit de kwescen, pliz", "Sopan dan wajar dipakai saat interview."],
      ["Do you have any questions for us? → Yes. What does a typical day look like in this role?", "Ada pertanyaan untuk kami? → Ya. Seperti apa hari kerja biasa di posisi ini?", "wot daz e tipikel dei luk laik in dis rol", "Selalu siapkan 1 pertanyaan. Menjawab 'no' terkesan kurang minat."],
      ["Thank you for your time. I look forward to hearing from you.", "Terima kasih atas waktunya. Saya menunggu kabar dari Anda.", "tenk yu for yor taim. ai luk forwed tu hiring from yu", "look forward to + kata kerja -ing."]
    ]},
    { id: "rapat", ikon: "📊", nama: "Rapat & laporan harian", ket: "Untuk daily meeting, menyampaikan KPI, dan update progres.", item: [
      ["Good morning, everyone. Let's get started.", "Selamat pagi semua. Mari kita mulai.", "gud morning, evriwan. lets get startid"],
      ["Here is today's update.", "Ini update hari ini.", "hir iz tudeiz apdeit"],
      ["Physical availability this week is 88 percent.", "Physical availability minggu ini 88 persen.", "fisikel eveilebiliti dis wik iz eiti eit persen", "Angka: 88 = eighty-eight."],
      ["We are behind schedule on two units.", "Kita terlambat dari jadwal di dua unit.", "wi ar bihaind skejul on tu yunits", "Lawannya: ahead of schedule = lebih cepat dari jadwal."],
      ["The main issue is a shortage of spare parts.", "Masalah utamanya adalah kekurangan suku cadang.", "de mein isyu iz e shortij of sper parts"],
      ["We expect to finish by Friday.", "Kami perkirakan selesai paling lambat Jumat.", "wi ekspekt tu finis bai fraidei", "by + waktu = paling lambat."],
      ["Any questions so far?", "Ada pertanyaan sejauh ini?", "eni kwescens sou far"],
      ["Let's move on to the next item.", "Mari lanjut ke poin berikutnya.", "lets muv on tu de nekst aitem"],
      ["I'll send the report after the meeting.", "Saya kirim laporannya setelah rapat.", "ail send de riport after de miting"]
    ]},
    { id: "breakdown", ikon: "🔧", nama: "Breakdown & perbaikan", ket: "Melaporkan kerusakan unit, penyebab, dan estimasi selesai.", item: [
      ["DT-15 broke down at 9 a.m.", "DT-15 rusak jam 9 pagi.", "di ti fiftin brouk daun et nain ei em", "break down (rusak) → bentuk lampau broke down."],
      ["The cause is a hydraulic oil leak.", "Penyebabnya kebocoran oli hidrolik.", "de koz iz e haidrolik oil lik"],
      ["The mechanic is checking the engine now.", "Mekanik sedang memeriksa mesinnya sekarang.", "de mekenik iz ceking di enjin nau"],
      ["We are waiting for the parts to arrive.", "Kami sedang menunggu suku cadang datang.", "wi ar weiting for de parts tu eraiv", "Status WP (waiting parts)."],
      ["The estimated time to repair is four hours.", "Estimasi waktu perbaikan empat jam.", "di estimeitid taim tu riper iz for awers"],
      ["The unit is ready for operation.", "Unit sudah siap operasi (RFU).", "de yunit iz redi for opereisyen"],
      ["This failure keeps happening. We need to find the root cause.", "Kerusakan ini terus berulang. Kita perlu cari akar masalahnya.", "dis feilyur kips hepening. wi nid tu faind de rut koz", "keep + -ing = terus-menerus."],
      ["The component has reached the end of its lifetime.", "Komponen ini sudah mencapai akhir umur pakainya.", "de kompounen hez ricd di end of its laiftaim"],
      ["We should replace it during the next service.", "Sebaiknya kita ganti saat servis berikutnya.", "wi syud ripleis it during de nekst servis"]
    ]},
    { id: "bantuan", ikon: "🤝", nama: "Minta tolong & klarifikasi", ket: "Meminta sesuatu dengan sopan dan memastikan Anda paham.", item: [
      ["Could you help me with this?", "Bisa bantu saya dengan ini?", "kud yu help mi wit dis", "Could you lebih sopan daripada Can you."],
      ["Could you send me the data by 3 p.m.?", "Bisa kirim datanya paling lambat jam 3 sore?", "kud yu send mi de deita bai tri pi em"],
      ["Sorry, could you say that again?", "Maaf, bisa diulang?", "sori, kud yu sei det egen"],
      ["Could you speak a bit more slowly, please?", "Bisa bicara sedikit lebih pelan?", "kud yu spik e bit mor slouli, pliz"],
      ["Just to confirm, you need it today, right?", "Untuk memastikan, Anda butuh hari ini, kan?", "jas tu konferm, yu nid it tudei, rait"],
      ["What do you mean by 'backlog'?", "Apa maksud Anda dengan 'backlog'?", "wot du yu min bai beklog"],
      ["How do you say 'suku cadang' in English?", "Bagaimana bilang 'suku cadang' dalam bahasa Inggris?", "hau du yu sei ... in inglis", "Jawaban: spare parts."],
      ["No problem. I'll take care of it.", "Tidak masalah. Saya urus.", "nou problem. ail teik ker of it"],
      ["Thanks a lot. I really appreciate it.", "Terima kasih banyak. Saya sangat menghargainya.", "tenks e lot. ai rili epricieit it"]
    ]},
    { id: "telepon", ikon: "📞", nama: "Telepon & radio", ket: "Saat menelepon vendor, atasan, atau komunikasi radio di site.", item: [
      ["Hello, this is Teguh from the plant department.", "Halo, ini Teguh dari departemen plant.", "helou, dis iz teguh from de plent dipartment", "Di telepon pakai 'this is', bukan 'I am'."],
      ["May I speak to Mr. Andi, please?", "Boleh saya bicara dengan Pak Andi?", "mei ai spik tu mister endi, pliz"],
      ["I'm calling about the spare parts order.", "Saya menelepon soal pesanan suku cadang.", "aim koling ebaut de sper parts order"],
      ["Sorry, the line is bad. I can't hear you.", "Maaf, sinyalnya jelek. Saya tidak dengar.", "sori, de lain iz bed. ai kent hir yu"],
      ["Could you ask him to call me back?", "Bisa minta dia telepon saya balik?", "kud yu ask him tu kol mi bek"],
      ["Copy that.", "Diterima / dimengerti (radio).", "kopi det"],
      ["Say again, over.", "Ulangi, ganti (radio).", "sei egen, ouver"],
      ["I'll call you back in five minutes.", "Saya telepon balik lima menit lagi.", "ail kol yu bek in faiv minits"]
    ]},
    { id: "email", ikon: "✉️", nama: "Email & chat kerja", ket: "Kalimat pembuka, isi, dan penutup email yang paling sering dipakai.", item: [
      ["Dear Mr. Budi,", "Yth. Pak Budi,", "dir mister budi", "Untuk yang belum dikenal. Ke rekan dekat cukup 'Hi Budi,'."],
      ["I hope this email finds you well.", "Semoga Anda dalam keadaan baik.", "ai houp dis imeil faindz yu wel", "Pembuka sopan, tidak wajib."],
      ["Please find attached the weekly KPI report.", "Terlampir laporan KPI mingguan.", "pliz faind etecht de wikli kei pi ai riport"],
      ["I'm writing to ask about the delivery date.", "Saya menulis untuk menanyakan tanggal pengiriman.", "aim raiting tu ask ebaut de diliveri deit"],
      ["Could you please confirm by tomorrow?", "Mohon konfirmasi paling lambat besok.", "kud yu pliz konferm bai tumorou"],
      ["Sorry for the late reply.", "Maaf terlambat membalas.", "sori for de leit riplai"],
      ["Please let me know if you have any questions.", "Kabari saya jika ada pertanyaan.", "pliz let mi nou if yu hev eni kwescens"],
      ["Best regards, Teguh", "Salam, Teguh", "best rigards", "Penutup netral dan aman dipakai ke siapa saja."]
    ]},
    { id: "ngobrol", ikon: "☕", nama: "Basa-basi sehari-hari", ket: "Obrolan ringan sebelum rapat, di mess, atau saat makan siang.", item: [
      ["How's it going?", "Apa kabar? (santai)", "haus it going", "Jawab: 'Pretty good, thanks. And you?'"],
      ["How was your weekend?", "Bagaimana akhir pekan Anda?", "hau woz yor wikend"],
      ["It's really hot today.", "Panas sekali hari ini.", "its rili hot tudei"],
      ["Have you had lunch yet?", "Sudah makan siang?", "hev yu hed lanc yet"],
      ["Where are you from originally?", "Asalnya dari mana?", "wer ar yu from orijinali"],
      ["See you tomorrow. Take care.", "Sampai besok. Hati-hati.", "si yu tumorou. teik ker"],
      ["Congratulations on your promotion!", "Selamat atas promosinya!", "kongrecyuleisyens on yor promousyen"],
      ["Sorry to hear that. I hope it gets better.", "Turut prihatin. Semoga membaik.", "sori tu hir det. ai houp it gets beter"]
    ]},
    { id: "waktu", ikon: "⏳", nama: "Beli waktu saat bicara", ket: "Kata pengisi supaya tidak diam terlalu lama saat mencari kata. Ini rahasia terlihat lancar.", item: [
      ["Well, ...", "Ya, begini...", "wel"],
      ["Let me think for a second.", "Sebentar, saya pikir dulu.", "let mi tink for e sekend"],
      ["That's a good question.", "Itu pertanyaan bagus.", "dets e gud kwescen", "Dipakai di interview sambil menyusun jawaban."],
      ["How can I say this...", "Bagaimana ya saya bilangnya...", "hau ken ai sei dis"],
      ["What I mean is...", "Maksud saya adalah...", "wot ai min iz"],
      ["In other words, ...", "Dengan kata lain, ...", "in ader werds"],
      ["For example, ...", "Contohnya, ...", "for egzampel"],
      ["To be honest, ...", "Jujur saja, ...", "tu bi onest"]
    ]}
  ]
};
