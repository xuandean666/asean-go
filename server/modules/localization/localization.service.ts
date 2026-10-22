import { Injectable, Logger } from '@nestjs/common';
import type {
  CreateLocalizationRequest,
  PaginationParams,
  PaginationResult,
  ProductLocalization,
} from '@shared/api.interface';

const LANG_NAMES: Record<string, string> = {
  vi: '越南语',
  th: '泰语',
  id: '印尼语',
  ms: '马来语',
  fil: '菲律宾语',
};

const LOCALIZED_TITLES: Record<string, Record<string, string>> = {
  '无线蓝牙耳机': {
    vi: 'Tai nghe Bluetooth không dây cao cấp - Chống ồn chủ động',
    th: 'หูฟังบลูทูธไร้สายพรีเมียม - ตัดเสียงรบกวนอัตโนมัติ',
    id: 'Headphone Bluetooth Nirkabel Premium - Peredam Bising Aktif',
    ms: 'Fon Telinga Bluetooth Tanpa Wayar Premium - Peredam Bising Aktif',
    fil: 'Premium Wireless Bluetooth Earbuds - Active Noise Cancelling',
  },
  '智能手表运动版': {
    vi: 'Đồng hồ thông minh thể thao - Theo dõi sức khỏe 24/7',
    th: 'นาฬิกาอัจฉริยะสปอร์ต - ติดตามสุขภาพ 24 ชั่วโมง',
    id: 'Smartwatch Olahraga - Pemantau Kesehatan 24 Jam',
    ms: 'Jam Pintar Sukan - Pemantau Kesihatan 24/7',
    fil: 'Smart Watch Sports Edition - 24/7 Health Tracker',
  },
  '便携折叠电动牙刷': {
    vi: 'Bàn chải điện gấp gọn - 3 chế độ làm sạch sâu',
    th: 'แปรงสีฟันไฟฟ้าพกพาพับได้ - 3 โหมดทำความสะอาด',
    id: 'Sikat Gigi Elektrik Lipat Portabel - 3 Mode Pembersihan',
    ms: 'Berus Gigi Elektrik Boleh Lipat - 3 Mod Pembersihan',
    fil: 'Portable Folding Electric Toothbrush - 3 Clean Modes',
  },
  '女士真丝连衣裙': {
    vi: 'Váy lụa nữ cao cấp - Thiết kế thanh lịch nhẹ nhàng',
    th: 'ชุดเดรสผ้าไหมผู้หญิงพรีเมียม - ดีไซน์หรูหรา',
    id: 'Gaun Sutra Wanita Premium - Desain Elegan dan Mewah',
    ms: 'Gaun Sutra Wanita Premium - Reka Bentuk Anggun',
    fil: 'Premium Silk Dress for Women - Elegant Design',
  },
  '多功能厨房料理机': {
    vi: 'Máy xay đa năng nhà bếp - 6 cối xay thông minh',
    th: 'เครื่องปั่นอเนกประสงค์ครัว - 6 ใบมีดอัจฉริยะ',
    id: 'Blender Dapur Multifungsi - 6 Mata Pisau Cerdas',
    ms: 'Pengisar Dapur Pelbagai Fungsi - 6 Bilah Pintar',
    fil: 'Multifunction Kitchen Blender - 6 Smart Blades',
  },
};

const BULLET_POINTS: Record<string, Record<string, string[]>> = {
  '无线蓝牙耳机': {
    vi: [
      'Chống ồn chủ động ANC, loại bỏ 95% tiếng ồn xung quanh',
      'Thời lượng pin 30 giờ, sạc nhanh 10 phút dùng 3 giờ',
      'Bluetooth 5.3 kết nối ổn định, không giật lag',
      'Chống nước IPX5, thoải mái tập luyện ngoài trời',
      'Công nghệ âm thanh HD, âm bass sâu và trong trẻo',
    ],
    th: [
      'ตัดเสียงรบกวนอัตโนมัติ ANC กำจัดเสียงรบกวนได้ถึง 95%',
      'แบตเตอรี่ 30 ชั่วโมง ชาร์จเร็ว 10 นาที ใช้ได้ 3 ชั่วโมง',
      'บลูทูธ 5.3 เชื่อมต่อเสถียร ไม่มีสัญญาณขัดข้อง',
      'กันน้ำ IPX5 ใช้งานได้สบายแม้ออกกำลังกายกลางแจ้ง',
      'เทคโนโลยีเสียง HD เสียงเบสหนักแน่น และใสสะอาด',
    ],
    id: [
      'Peredam bising aktif ANC, menghilangkan 95% kebisingan sekitar',
      'Daya tahan baterai 30 jam, pengisian cepat 10 menit pakai 3 jam',
      'Bluetooth 5.3 koneksi stabil tanpa gangguan',
      'Tahan air IPX5, nyaman digunakan saat olahraga luar ruangan',
      'Teknologi suara HD, bass dalam dan jernih',
    ],
    ms: [
      'Peredam bising aktif ANC, menghilangkan 95% bunyi bising',
      'Bateri tahan 30 jam, cas pantas 10 minit guna 3 jam',
      'Bluetooth 5.3 sambungan stabil tanpa gangguan',
      'Kalis air IPX5, selesa bersenam di luar rumah',
      'Teknologi bunyi HD, bass dalam dan jernih',
    ],
    fil: [
      'Active Noise Cancelling ANC, blocks 95% of ambient noise',
      '30-hour battery life, fast charge 10 mins for 3 hours use',
      'Bluetooth 5.3 stable connection, no dropouts',
      'IPX5 water resistant, great for outdoor workouts',
      'HD sound technology, deep bass and crystal clear audio',
    ],
  },
  '智能手表运动版': {
    vi: [
      'Màn hình AMOLED 1.43 inch, hiển thị sắc nét',
      'Theo dõi nhịp tim, SpO2, giấc ngủ 24/7',
      'Hơn 100 chế độ thể thao, ghi nhận chính xác',
      'Thời lượng pin 14 ngày, sạc nhanh 2 giờ đầy',
      'Chống nước 5ATM, bơi lội thoải mái',
    ],
    th: [
      'หน้าจอ AMOLED 1.43 นิ้ว แสดงผลคมชัด',
      'ติดตามอัตราการเต้นของหัวใจ SpO2 และการนอนหลับ 24 ชั่วโมง',
      'มากกว่า 100 โหมดสปอร์ต บันทึกข้อมูลแม่นยำ',
      'แบตเตอรี่ 14 วัน ชาร์จเต็มเพียง 2 ชั่วโมง',
      'กันน้ำ 5ATM ใส่ว่ายน้ำได้สบาย',
    ],
    id: [
      'Layar AMOLED 1.43 inci, tampilan jernih tajam',
      'Pantau detak jantung, SpO2, tidur 24 jam sehari',
      'Lebih dari 100 mode olahraga, catatan akurat',
      'Daya tahan baterai 14 hari, pengisian cepat 2 jam penuh',
      'Tahan air 5ATM, nyaman untuk berenang',
    ],
    ms: [
      'Skrin AMOLED 1.43 inci, paparan jernih',
      'Pantau degupan jantung, SpO2, tidur 24/7',
      'Lebih 100 mod sukan, rakaman tepat',
      'Bateri tahan 14 hari, cas pantas 2 jam penuh',
      'Kalis air 5ATM, selesa berenang',
    ],
    fil: [
      '1.43 inch AMOLED display, sharp and vibrant',
      '24/7 heart rate, SpO2, and sleep tracking',
      '100+ sports modes, accurate recording',
      '14-day battery life, 2-hour fast charge',
      '5ATM water resistance, swim-ready',
    ],
  },
  '便携折叠电动牙刷': {
    vi: [
      'Thiết kế gấp gọn, dễ dàng mang đi du lịch',
      '3 chế độ làm sạch: trắng, mềm, massage',
      'Lông bàn chải mềm Dupont, an toàn cho men răng',
      'Sạc USB-C, dùng 30 ngày sau 1 lần sạc',
      'Thời gian 2 phút tự động ngừng theo tiêu chuẩn nha khoa',
    ],
    th: [
      'ดีไซน์พับได้ พกพาเดินทางได้ง่าย',
      '3 โหมดทำความสะอาด ฟอกขาว นุ่มนวล นวด',
      'ขนแปรง Dupont นุ่มนวล ปลอดภัยต่อเคลือบฟัน',
      'ชาร์จ USB-C ใช้ได้ 30 วันหลังจากชาร์จ 1 ครั้ง',
      'หยุดอัตโนมัติทุก 2 นาที ตามมาตรฐานทันตกรรม',
    ],
    id: [
      'Desain lipat portabel, mudah dibawa bepergian',
      '3 mode pembersihan: putih, lembut, pijat',
      'Bulu sikat Dupont lembut, aman untuk email gigi',
      'Pengisian USB-C, tahan 30 hari sekali isi',
      'Berhenti otomatis 2 menit sesuai standar kedokteran gigi',
    ],
    ms: [
      'Reka bentuk boleh lipat, mudah dibawa melancong',
      '3 mod pembersihan: putih, lembut, urut',
      'Bulu berus Dupont lembut, selamat untuk enamel gigi',
      'Cas USB-C, tahan 30 hari sekali cas',
      'Berhenti automatik 2 minit mengikut piawaian pergigian',
    ],
    fil: [
      'Foldable design, perfect for travel',
      '3 clean modes: white, soft, massage',
      'Soft Dupont bristles, safe for enamel',
      'USB-C charging, 30 days on one charge',
      '2-minute auto timer per dental standard',
    ],
  },
  '女士真丝连衣裙': {
    vi: [
      'Chất liệu lụa 100% tự nhiên, mát mẻ cao cấp',
      'Thiết kế cổ V, tôn dáng nữ tính thanh lịch',
      'Họa tiết hoa tinh tế, không bao giờ lỗi mốt',
      'Phù hợp đi làm, dự tiệc, đi chơi cuối tuần',
      'Có nhiều màu và size để lựa chọn',
    ],
    th: [
      'ผ้าไหม 100% ผสมผสานความหรูหราและความสบาย',
      'ดีไซน์คอวี เด่นด้วยรูปร่างผู้หญิงที่สง่างาม',
      'ลายดอกไม้ที่ละเอียดอ่อน ไม่เคยตกยุค',
      'เหมาะกับไปทำงาน งานเลี้ยง และท่องเที่ยวสุดสัปดาห์',
      'มีหลายสีและหลายไซส์ให้เลือก',
    ],
    id: [
      'Bahan sutra 100% alami, sejuk dan premium',
      'Desain leher V, menonjolkan siluet feminin elegan',
      'Motif bunga halus, tidak pernah ketinggalan zaman',
      'Cocok untuk kerja, pesta, dan liburan akhir pekan',
      'Tersedia berbagai warna dan ukuran',
    ],
    ms: [
      'Bahan sutera 100% semula jadi, sejuk dan premium',
      'Reka bentuk leher V, menyerlahkan siluet wanita anggun',
      'Corak bunga halus, tidak pernah ketinggalan zaman',
      'Sesuai untuk kerja, majlis dan bercuti hujung minggu',
      'Terdapat pelbagai warna dan saiz',
    ],
    fil: [
      '100% natural silk, cool and luxurious feel',
      'V-neck design, elegant and feminine silhouette',
      'Delicate floral pattern, timeless classic',
      'Perfect for work, parties, weekend getaways',
      'Available in multiple colors and sizes',
    ],
  },
  '多功能厨房料理机': {
    vi: [
      'Công suất 1200W, xay nhuyễn mọi loại nguyên liệu',
      '6 lưỡi dao thép không gỉ 304, bền bỉ sắc bén',
      'Bình thủy tinh chịu nhiệt 1.5L, an toàn sức khỏe',
      '3 tốc độ + chức năng xung, dễ dàng điều khiển',
      'Thiết kế chống trượt, hoạt động ổn định yên tĩnh',
    ],
    th: [
      'กำลัง 1200 วัตต์ ปั่นละเอียดทุกส่วนผสม',
      '6 ใบมีดสแตนเลส 304 ทนทานและคมชัด',
      'โถแก้วทนความร้อน 1.5 ลิตร ปลอดภัยต่อสุขภาพ',
      '3 ความเร็ว + โหมดพัลส์ ควบคุมได้ง่าย',
      'ดีไซน์กันลื่น ทำงานเสถียรและเงียบ',
    ],
    id: [
      'Daya 1200W, menghaluskan semua jenis bahan',
      '6 bilah pisau baja tahan karat 304, tajam dan awet',
      'Wadah kaca tahan panas 1.5L, aman untuk kesehatan',
      '3 kecepatan + mode pulsa, mudah dikendalikan',
      'Desain anti selip, kerja stabil dan tenang',
    ],
    ms: [
      'Kuasa 1200W, kisar semua jenis bahan dengan halus',
      '6 bilah keluli tahan karat 304, tajam dan tahan lama',
      'Baldi kaca tahan haba 1.5L, selamat untuk kesihatan',
      '3 kelajuan + mod nadi, mudah dikawal',
      'Reka bentuk anti licin, operasi stabil dan senyap',
    ],
    fil: [
      '1200W power, blends all ingredients smoothly',
      '6 304 stainless steel blades, durable and sharp',
      '1.5L heat-resistant glass jar, food-safe',
      '3 speeds + pulse mode, easy control',
      'Anti-slip design, stable and quiet operation',
    ],
  },
};

const DESCRIPTIONS: Record<string, Record<string, string>> = {
  '无线蓝牙耳机': {
    vi:
      'Tai nghe Bluetooth không dây cao cấp được thiết kế dành riêng cho người dùng yêu cầu chất lượng âm thanh vượt trội. Với công nghệ chống ồn chủ động ANC thế hệ mới, bạn sẽ được đắm chìm trong không gian âm nhạc riêng biệt, không bị tiếng ồn xung quanh làm phiền. Thiết kế tai nghe kèm gối tai silicone mềm mại, đeo cả ngày cũng không cảm thấy đau. Hộp sạc tích hợp pin dự phòng lớn, đủ dùng cho cả chuyến đi dài. Phù hợp cho cả công việc hàng ngày, học tập và giải trí.',
    th:
      'หูฟังบลูทูธไร้สายพรีเมียมที่ออกแบบมาสำหรับผู้ใช้ที่ต้องการคุณภาพเสียงที่เหนือกว่า ด้วยเทคโนโลยีตัดเสียงรบกวนอัตโนมัติ ANC รุ่นล่าสุด คุณจะได้ดื่มด่ำกับพื้นที่เพลงส่วนตัวโดยไม่ถูกเสียงรบกวนรอบข้างรบกวน ดีไซน์หูฟังพร้อมแผ่นรองหูซิลิโคนนุ่มนวล สวมใส่ทั้งวันก็ไม่เจ็บ กล่องชาร์จมีแบตเตอรี่สำรองขนาดใหญ่ เพียงพอสำหรับการเดินทางที่ยาว เหมาะสำหรับทั้งการทำงาน การเรียนรู้ และความบันเทิง',
    id:
      'Headphone Bluetooth nirkabel premium dirancang khusus untuk pengguna yang menuntut kualitas suara luar biasa. Dengan teknologi peredam bising aktif ANC generasi terbaru, Anda akan tenggelam dalam ruang musik pribadi tanpa gangguan kebisingan sekitar. Desain earphone dengan bantalan silikon lembut, dipakai seharian pun tidak terasa sakit. Kotak pengisian terintegrasi dengan baterai cadangan besar, cukup untuk perjalanan jauh. Cocok untuk pekerjaan sehari-hari, belajar, dan hiburan.',
    ms:
      'Fon telinga Bluetooth tanpa wayar premium direka khas untuk pengguna yang menuntut kualiti bunyi yang unggul. Dengan teknologi peredam bising aktif ANC generasi terbaru, anda akan tenggelam dalam ruang muzik peribadi tanpa gangguan bunyi bising sekitar. Reka bentuk fon telinga dengan bantalan silikon lembut, dipakai seharian pun tidak terasa sakit. Kotak cas bersepadu dengan bateri simpanan besar, cukup untuk perjalanan jauh. Sesuai untuk kerja harian, belajar dan hiburan.',
    fil:
      'Premium wireless Bluetooth earbuds designed for users who demand superior sound quality. With the latest ANC active noise cancellation technology, you can immerse yourself in your personal music space without ambient noise interference. Soft silicone ear tips design, comfortable for all-day wear. Charging case with large backup battery, perfect for long trips. Suitable for daily work, study, and entertainment.',
  },
  '智能手表运动版': {
    vi:
      'Đồng hồ thông minh thể thao là người bạn đồng hành lý tưởng cho lối sống năng động. Màn hình AMOLED lớn hiển thị rõ ràng dưới ánh nắng mặt trời. Hệ thống cảm biến y tế chính xác cao theo dõi liên tục nhịp tim, nồng độ oxy trong máu và chất lượng giấc ngủ. Hơn 100 chế độ thể thao giúp bạn ghi nhận toàn diện mọi hoạt động vận động. Pin siêu bền 14 ngày mang lại sự tự tin trong mỗi chuyến đi. Vỏ kim loại chống trầy xước, dây đeo thoáng khí, tạo cảm giác thoải mái tối đa khi đeo.',
    th:
      'นาฬิกาอัจฉริยะสปอร์ตคือเพื่อนร่วมทางที่สมบูรณ์แบบสำหรับไลฟ์สไตล์ที่กระตือรือร้น หน้าจอ AMOLED ขนาดใหญ่แสดงผลชัดเจนแม้จะอยู่ใต้แสงแดด ระบบเซ็นเซอร์สุขภาพที่แม่นยำสูง ติดตามอัตราการเต้นของหัวใจ ระดับออกซิเจนในเลือด และคุณภาพการนอนหลับอย่างต่อเนื่อง มากกว่า 100 โหมดสปอร์ต ช่วยให้คุณบันทึกกิจกรรมการเคลื่อนไหวทุกอย่างอย่างครบถ้วน แบตเตอรี่ที่ทนทาน 14 วัน ให้ความมั่นใจในการเดินทางทุกครั้ง เคสโลหะกันรอย สายรัดระบายอากาศได้ดี ให้ความสบายสูงสุด',
    id:
      'Smartwatch olahraga adalah teman yang ideal untuk gaya hidup aktif. Layar AMOLED besar menampilkan konten dengan jelas di bawah sinar matahari. Sistem sensor kesehatan presisi tinggi memantau detak jantung, kadar oksigen darah, dan kualitas tidur secara terus-menerus. Lebih dari 100 mode olahraga membantu Anda mencatat semua aktivitas fisik secara komprehensif. Baterai super tahan 14 hari memberikan kepercayaan diri dalam setiap perjalanan. Casing logam anti gores, tali bernapas, memberikan kenyamanan maksimal saat dipakai.',
    ms:
      'Jam pintar sukan adalah teman yang ideal untuk gaya hidup aktif. Skrin AMOLED besar memaparkan kandungan dengan jelas di bawah cahaya matahari. Sistem sensor kesihatan berketepatan tinggi memantau degupan jantung, tahap oksigen darah dan kualiti tidur secara berterusan. Lebih 100 mod sukan membantu anda merekodkan semua aktiviti fizikal secara menyeluruh. Bateri super tahan 14 hari memberi keyakinan dalam setiap perjalanan. Casing logam anti calar, tali bernafas, memberikan keselesaan maksimum apabila dipakai.',
    fil:
      'Sports smartwatch is the ideal companion for an active lifestyle. Large AMOLED display shows content clearly in direct sunlight. High-precision health sensor system continuously monitors heart rate, blood oxygen level, and sleep quality. 100+ sports modes help you comprehensively record all physical activities. Super 14-day battery life gives you confidence on every trip. Scratch-resistant metal case, breathable strap, maximum wearing comfort.',
  },
  '便携折叠电动牙刷': {
    vi:
      'Bàn chải điện gấp gọn là giải pháp chăm sóc răng miệng hoàn hảo cho người thường xuyên đi công tác, du lịch. Thiết kế độc đáo có thể gập lại chỉ bằng 1 nửa kích thước ban đầu, dễ dàng bỏ vào túi xách hay vali. Công nghệ rung siêu âm tạo ra hàng triệu bọt nhỏ thấm sâu vào những kẽ răng khó làm sạch nhất. 3 chế độ làm sạch linh hoạt cho phép bạn lựa chọn tùy theo nhu cầu. Lông bàn chải mềm an toàn cho nướu nhạy cảm. Sạc tiện lợi qua cổng USB-C, một lần sạc dùng được cả tháng.',
    th:
      'แปรงสีฟันไฟฟ้าพกพาพับได้ เป็นโซลูชันการดูแลสุขภาพช่องปากที่สมบูรณ์แบบสำหรับคนที่ต้องเดินทางบ่อย ดีไซน์พิเศษที่สามารถพับได้เหลือเพียงครึ่งหนึ่งของขนาดเดิม ใส่ในกระเป๋าถือหรือกระเป๋าเดินทางได้ง่าย เทคโนโลยีสั่นสะเทือนอัลตราโซนิก สร้างฟองน้ำหลายล้านฟอง ซึมเข้าไปในช่องว่างระหว่างฟันที่ยากที่สุดที่จะทำความสะอาด 3 โหมดทำความสะอาดยืดหยุ่น ช่วยให้คุณเลือกตามความต้องการ ขนแปรงนุ่มนวล ปลอดภัยสำหรับเหงื่อที่ไวต่อการแพ้ ชาร์จสะดวกผ่านพอร์ต USB-C ชาร์จครั้งเดียว ใช้ได้เป็นเดือน',
    id:
      'Sikat gigi elektrik lipat portabel adalah solusi perawatan gigi yang sempurna untuk orang yang sering bepergian. Desain unik yang dapat dilipat menjadi setengah ukuran asli, mudah dimasukkan ke dalam tas atau koper. Teknologi getaran ultrasonik menghasilkan jutaan busa kecil yang menembus ke celah gigi yang paling sulit dibersihkan. 3 mode pembersihan fleksibel memungkinkan Anda memilih sesuai kebutuhan. Bulu sikat lembut aman untuk gusi sensitif. Pengisian nyaman melalui port USB-C, satu kali pengisian tahan sebulan.',
    ms:
      'Berus gigi elektrik boleh lipat mudah alih adalah penyelesaian penjagaan gigi yang sempurna untuk orang yang kerap melancong. Reka bentuk unik yang boleh dilipat kepada separuh saiz asal, mudah dimasukkan ke dalam beg atau beg pakaian. Teknologi getaran ultrasonik menghasilkan berjuta-juta buih kecil yang menembusi celah gigi yang paling sukar dibersihkan. 3 mod pembersihan fleksibel membolehkan anda memilih mengikut keperluan. Bulu berus lembut selamat untuk gusi sensitif. Pengecasan mudah melalui port USB-C, sekali cas tahan sebulan.',
    fil:
      'Portable folding electric toothbrush is the perfect oral care solution for frequent travelers. Unique foldable design shrinks to half its original size, easily fits in handbag or suitcase. Ultrasonic vibration technology creates millions of micro-bubbles that penetrate hard-to-reach interdental spaces. 3 flexible cleaning modes let you choose according to your needs. Soft bristles safe for sensitive gums. Convenient USB-C charging, one charge lasts a whole month.',
  },
  '女士真丝连衣裙': {
    vi:
      'Váy lụa nữ cao cấp được dệt từ sợi lụa tự nhiên 100%, mang lại cảm giác mát lạnh khi chạm vào da. Kiểu dáng cổ V thanh lịch kết hợp với đường cắt may tinh tế, giúp tôn lên nét đẹp nữ tính và kiêu kỳ. Chất lụa có độ bóng tự nhiên nhẹ nhàng, không hề gây cảm giác rực rỡ. Phù hợp đeo đi làm, đi dự tiệc cưới hay những dịp trang trọng khác. Có sẵn nhiều màu sắc và kích thước, dễ dàng phối đồ với các loại phụ kiện. Giặt tay với nước lạnh để bảo quản chất vải lâu dài.',
    th:
      'ชุดเดรสผ้าไหมผู้หญิงพรีเมียม ทอจากเส้นใยไหมธรรมชาติ 100% ให้ความรู้สึกเย็นสบายเมื่อสัมผัสผิวหนัง ดีไซน์คอวีที่สง่างาม ผสานกับการตัดเย็บที่ประณีต ช่วยเน้นความสวยงามแห่งความเป็นผู้หญิงและความสง่างาม ผ้าไหมมีความมันวาวธรรมชาติที่อ่อนโยน ไม่ดูจ้าแจ้งเกินไป เหมาะสำหรับใส่ไปทำงาน งานเลี้ยงงานแต่ง หรือโอกาสพิเศษอื่นๆ มีหลายสีและหลายไซส์ให้เลือก จับคู่กับเครื่องประดับได้ง่าย ซักด้วยมือและน้ำเย็นเพื่อรักษาคุณภาพผ้าไว้นาน',
    id:
      'Gaun sutra wanita premium ditenun dari serat sutra alami 100%, memberikan sensasi dingin saat menyentuh kulit. Desain leher V yang elegan dipadukan dengan potongan jahitan yang rapi, membantu menonjolkan keindahan feminin dan anggun. Bahan sutra memiliki kilau alami yang lembut, tidak terlihat berlebihan. Cocok dipakai untuk bekerja, menghadiri pesta pernikahan, atau acara formal lainnya. Tersedia berbagai warna dan ukuran, mudah dipadukan dengan berbagai aksesori. Cuci tangan dengan air dingin untuk menjaga kualitas kain agar tahan lama.',
    ms:
      'Gaun sutera wanita premium ditenun daripada serat sutera semula jadi 100%, memberikan rasa sejuk apabila menyentuh kulit. Reka bentuk leher V yang anggun digabungkan dengan potongan jahitan yang kemas, membantu menyerlahkan keindahan feminin dan anggun. Bahan sutera mempunyai kilauan semula jadi yang lembut, tidak kelihatan berlebihan. Sesuai dipakai untuk kerja, majlis perkahwinan atau acara rasmi lain. Terdapat pelbagai warna dan saiz, mudah dipadankan dengan pelbagai aksesori. Cuci tangan dengan air sejuk untuk mengekalkan kualiti kain agar tahan lama.',
    fil:
      'Premium womens silk dress woven from 100% natural silk fibers, giving a cool sensation against the skin. Elegant V-neck design combined with exquisite tailoring, highlighting feminine beauty and grace. The silk has a gentle natural sheen, never looking overly flashy. Suitable for work, wedding parties, or other formal occasions. Available in multiple colors and sizes, easy to match with various accessories. Hand wash in cold water to preserve fabric quality for lasting wear.',
  },
  '多功能厨房料理机': {
    vi:
      'Máy xay đa năng nhà bếp là trợ thủ đắc lực cho mọi bà nội trợ. Với công suất 1200W mạnh mẽ, máy có thể xay nhuyễn mọi loại nguyên liệu từ trái cây, rau củ đến thịt, đá viên. 6 lưỡi dao thép không gỉ được sắp xếp đa chiều tạo ra chuyển động xoáy mạnh mẽ, đảm bảo nguyên liệu được xay đều mịn trong vài giây. Bình thủy tinh dày dặn chịu nhiệt tốt, dễ dàng vệ sinh sau khi sử dụng. 3 mức tốc độ và chức năng xung đáp ứng đa dạng nhu cầu chế biến thực phẩm. Thiết kế hiện đại, phù hợp với mọi không gian nhà bếp.',
    th:
      'เครื่องปั่นอเนกประสงค์ครัว เป็นผู้ช่วยที่มีประโยชน์สำหรับคุณแม่ทุกคน ด้วยกำลัง 1200 วัตต์ที่แข็งแรง เครื่องสามารถปั่นละเอียดได้ทุกส่วนผสม ตั้งแต่ผลไม้ ผักไปจนถึงเนื้อสัตว์ และน้ำแข็ง 6 ใบมีดสแตนเลสที่วางเรียงหลายมิติ สร้างการหมุนวนที่แรง มั่นใจว่าส่วนผสมจะถูกปั่นให้ละเอียดเนียนในเวลาเพียงไม่กี่วินาที โถแก้วหนาทนทานต่อความร้อนได้ดี ทำความสะอาดได้ง่ายหลังใช้งาน 3 ระดับความเร็วและโหมดพัลส์ ตอบสนองความต้องการการปรุงอาหารที่หลากหลาย ดีไซน์สมัยใหม่ เข้ากันได้กับทุกห้องครัว',
    id:
      'Blender dapur multifungsi adalah asisten yang sangat berguna bagi setiap ibu rumah tangga. Dengan daya 1200W yang kuat, mesin dapat menghaluskan semua jenis bahan dari buah-buahan, sayuran hingga daging dan es batu. 6 bilah baja tahan karat yang disusun multi arah menciptakan gerakan pusaran kuat, memastikan bahan tercampur rata dan halus dalam beberapa detik. Wadah kaca tebal tahan panas, mudah dibersihkan setelah digunakan. 3 tingkat kecepatan dan mode pulsa memenuhi berbagai kebutuhan pengolahan makanan. Desain modern, cocok untuk setiap ruang dapur.',
    ms:
      'Pengisar dapur pelbagai fungsi adalah pembantu yang berguna untuk setiap suri rumah. Dengan kuasa 1200W yang kuat, mesin boleh mengisar semua jenis bahan daripada buah-buahan, sayur-sayuran hingga daging dan ais batu. 6 bilah keluli tahan karat yang disusun pelbagai arah menghasilkan gerakan pusaran yang kuat, memastikan bahan dicampur rata dan halus dalam beberapa saat. Baldi kaca tebal tahan haba, mudah dibersihkan selepas digunakan. 3 tahap kelajuan dan mod nadi memenuhi pelbagai keperluan pemprosesan makanan. Reka bentuk moden, sesuai untuk setiap ruang dapur.',
    fil:
      'Multifunction kitchen blender is the essential helper for every home cook. With powerful 1200W motor, it can blend everything from fruits and vegetables to meat and ice cubes. 6 stainless steel blades arranged in multi-dimensional angles create powerful vortex motion, ensuring ingredients are perfectly smooth in seconds. Thick heat-resistant glass jar, easy to clean after use. 3 speed levels and pulse mode meet diverse food processing needs. Modern design, fits perfectly in any kitchen space.',
  },
};

const KEYWORDS: Record<string, Record<string, string[]>> = {
  '无线蓝牙耳机': {
    vi: ['tai nghe bluetooth', 'không dây', 'chống ồn ANC', 'bass mạnh', 'pin 30 giờ'],
    th: ['หูฟังบลูทูธ', 'ไร้สาย', 'ตัดเสียงรบกวน ANC', 'เบสหนัก', 'แบต 30 ชั่วโมง'],
    id: ['headset bluetooth', 'nirkabel', 'ANC peredam bising', 'bass kuat', 'baterai 30 jam'],
    ms: ['fon telinga bluetooth', 'tanpa wayar', 'ANC peredam bising', 'bass kuat', 'bateri 30 jam'],
    fil: ['bluetooth earbuds', 'wireless', 'ANC noise cancelling', 'deep bass', '30hr battery'],
  },
  '智能手表运动版': {
    vi: ['đồng hồ thông minh', 'theo dõi sức khỏe', 'chống nước 5ATM', 'pin 14 ngày', 'AMOLED'],
    th: ['นาฬิกาอัจฉริยะ', 'ติดตามสุขภาพ', 'กันน้ำ 5ATM', 'แบต 14 วัน', 'AMOLED'],
    id: ['smartwatch', 'pemantau kesehatan', 'tahan air 5ATM', 'baterai 14 hari', 'AMOLED'],
    ms: ['jam pintar', 'pemantau kesihatan', 'kalis air 5ATM', 'bateri 14 hari', 'AMOLED'],
    fil: ['smart watch', 'health tracker', '5ATM waterproof', '14-day battery', 'AMOLED'],
  },
  '便携折叠电动牙刷': {
    vi: ['bàn chải điện', 'gấp gọn', 'di động', 'USB-C', 'làm trắng răng'],
    th: ['แปรงสีฟันไฟฟ้า', 'พับได้', 'พกพา', 'USB-C', 'ฟอกสีฟัน'],
    id: ['sikat gigi elektrik', 'lipat', 'portabel', 'USB-C', 'pemutih gigi'],
    ms: ['berus gigi elektrik', 'boleh lipat', 'mudah alih', 'USB-C', 'pemutih gigi'],
    fil: ['electric toothbrush', 'foldable', 'portable', 'USB-C', 'teeth whitening'],
  },
  '女士真丝连衣裙': {
    vi: ['váy lụa', 'nữ tính', 'thanh lịch', 'công sở', 'họa tiết hoa'],
    th: ['เดรสผ้าไหม', 'ผู้หญิง', 'สง่างาม', 'สำนักงาน', 'ลายดอกไม้'],
    id: ['gaun sutra', 'feminin', 'elegan', 'kantor', 'motif bunga'],
    ms: ['gaun sutera', 'wanita', 'anggun', 'pejabat', 'corak bunga'],
    fil: ['silk dress', 'feminine', 'elegant', 'office wear', 'floral print'],
  },
  '多功能厨房料理机': {
    vi: ['máy xay', 'đa năng', 'nhà bếp', '1200W', 'thủy tinh'],
    th: ['เครื่องปั่น', 'อเนกประสงค์', 'ครัว', '1200W', 'แก้ว'],
    id: ['blender', 'multifungsi', 'dapur', '1200W', 'kaca'],
    ms: ['pengisar', 'pelbagai fungsi', 'dapur', '1200W', 'kaca'],
    fil: ['blender', 'multifunction', 'kitchen', '1200W', 'glass jar'],
  },
};

const CULTURAL_WARNINGS_BY_CATEGORY: Record<string, { type: string; description: string; suggestion: string }[]> = {
  电子产品: [
    {
      type: '宗教符号',
      description: '部分东盟国家以佛教或伊斯兰教为国教，产品图案中应避免出现可能冒犯宗教信仰的符号。',
      suggestion: '建议使用通用几何图案或抽象设计，避免直接使用宗教相关的图像或文字。',
    },
    {
      type: '颜色避讳',
      description: '在泰国，白色与丧葬相关；在马来西亚和印尼，绿色具有特殊宗教含义。',
      suggestion: '针对不同市场调整主色调，泰国市场减少纯白大面积使用，马来/印尼市场慎用亮绿色作为警示色。',
    },
  ],
  服装: [
    {
      type: '宗教着装',
      description: '马来西亚和印尼穆斯林人口占多数，女性服装展示需考虑当地宗教着装规范。',
      suggestion: '在穆斯林市场主图和描述中避免过于暴露的展示，可增加 modest wear 相关款式描述。',
    },
    {
      type: '尺码标注',
      description: '东南亚消费者身材普遍偏小，使用中国标准尺码可能导致退货率高。',
      suggestion: '提供详细的尺码对照表，并以 cm 为单位标注具体尺寸数据，建议加小一码推荐。',
    },
  ],
  家居厨房: [
    {
      type: '电压标准',
      description: '东南亚各国电压和插头标准不统一（220V/230V 均有，插头类型各异）。',
      suggestion: '产品需明确标注适配电压范围，优先提供适配当地的插头款式或万能转换头。',
    },
  ],
};

function randomId(): string {
  return 'prod_' + Math.random().toString(36).substring(2, 14);
}

function genLocalized(nameCn: string, languages: string[]): {
  titles: Record<string, string>;
  bullets: Record<string, string[]>;
  descriptions: Record<string, string>;
  keywords: Record<string, string[]>;
} {
  const titles: Record<string, string> = {};
  const bullets: Record<string, string[]> = {};
  const descriptions: Record<string, string> = {};
  const keywords: Record<string, string[]> = {};
  const fallback = LOCALIZED_TITLES['无线蓝牙耳机'];
  const fallbackBullets = BULLET_POINTS['无线蓝牙耳机'];
  const fallbackDesc = DESCRIPTIONS['无线蓝牙耳机'];
  const fallbackKeys = KEYWORDS['无线蓝牙耳机'];

  for (const lang of languages) {
    titles[lang] = LOCALIZED_TITLES[nameCn]?.[lang] ?? fallback[lang] ?? `${nameCn} (${LANG_NAMES[lang] || lang})`;
    bullets[lang] = BULLET_POINTS[nameCn]?.[lang] ?? fallbackBullets[lang] ?? ['', '', '', '', ''];
    descriptions[lang] = DESCRIPTIONS[nameCn]?.[lang] ?? fallbackDesc[lang] ?? '';
    keywords[lang] = KEYWORDS[nameCn]?.[lang] ?? fallbackKeys[lang] ?? [];
  }
  return { titles, bullets, descriptions, keywords };
}

function genCulturalCheck(category: string): {
  hasIssues: boolean;
  warnings: { type: string; description: string; suggestion: string }[];
} {
  const pool = CULTURAL_WARNINGS_BY_CATEGORY[category] ?? [];
  if (pool.length === 0) return { hasIssues: false, warnings: [] };
  const numWarnings = Math.floor(Math.random() * 3); // 0-2
  if (numWarnings === 0) return { hasIssues: false, warnings: [] };
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return { hasIssues: true, warnings: shuffled.slice(0, numWarnings) };
}

@Injectable()
export class LocalizationService {
  private readonly logger = new Logger(LocalizationService.name);
  private records: ProductLocalization[];

  constructor() {
    this.records = this.seedMockData();
  }

  private seedMockData(): ProductLocalization[] {
    const seedProducts = [
      { nameCn: '无线蓝牙耳机', category: '电子产品', platforms: ['Shopee', 'Lazada', 'TikTok Shop'] },
      { nameCn: '智能手表运动版', category: '电子产品', platforms: ['Shopee', 'TikTok Shop'] },
      { nameCn: '便携折叠电动牙刷', category: '个护健康', platforms: ['Lazada', 'TikTok Shop'] },
      { nameCn: '女士真丝连衣裙', category: '服装', platforms: ['Shopee', 'Lazada'] },
      { nameCn: '多功能厨房料理机', category: '家居厨房', platforms: ['Shopee', 'Lazada', 'TikTok Shop'] },
    ];
    const allLangs = ['vi', 'th', 'id', 'ms', 'fil'];
    const now = Date.now();

    return seedProducts.map((p, i: number) => {
      const langs = allLangs.slice(0, 3 + (i % 3));
      const localized = genLocalized(p.nameCn, langs);
      const culturalCheck = genCulturalCheck(p.category);
      const createdAt = new Date(now - i * 86400000 - Math.random() * 3600000);
      return {
        id: randomId(),
        nameCn: p.nameCn,
        category: p.category,
        targetPlatforms: p.platforms,
        targetLanguages: langs,
        localizedTitles: localized.titles,
        bulletPoints: localized.bullets,
        descriptions: localized.descriptions,
        keywords: localized.keywords,
        culturalCheck,
        status: 'completed',
        createdAt: createdAt.toISOString(),
        updatedAt: createdAt.toISOString(),
      };
    });
  }

  async getProducts(params: PaginationParams & { platform?: string; language?: string }): Promise<PaginationResult<ProductLocalization>> {
    const { page, pageSize, platform, language } = params;
    let filtered = [...this.records];
    if (platform) {
      filtered = filtered.filter((r: ProductLocalization) => r.targetPlatforms?.includes(platform));
    }
    if (language) {
      filtered = filtered.filter((r: ProductLocalization) => r.targetLanguages?.includes(language));
    }
    filtered.sort((a: ProductLocalization, b: ProductLocalization) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);
    return { items, total, page, pageSize };
  }

  async getProduct(id: string): Promise<ProductLocalization | null> {
    return this.records.find((r: ProductLocalization) => r.id === id) ?? null;
  }

  async createProduct(body: CreateLocalizationRequest): Promise<ProductLocalization> {
    const { nameCn, category, targetPlatforms, targetLanguages } = body;
    const langs = targetLanguages.length > 0 ? targetLanguages : ['vi', 'th', 'id'];
    const localized = genLocalized(nameCn, langs);
    const culturalCheck = genCulturalCheck(category ?? '');
    const now = new Date().toISOString();
    const record: ProductLocalization = {
      id: randomId(),
      nameCn,
      category,
      targetPlatforms,
      targetLanguages: langs,
      localizedTitles: localized.titles,
      bulletPoints: localized.bullets,
      descriptions: localized.descriptions,
      keywords: localized.keywords,
      culturalCheck,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
    };
    this.records.unshift(record);
    this.logger.log(`Created localization task: ${record.id}`);
    return record;
  }

  async regenerate(id: string, language: string): Promise<ProductLocalization | null> {
    const record = this.records.find((r: ProductLocalization) => r.id === id);
    if (!record) return null;
    const fallback = LOCALIZED_TITLES['无线蓝牙耳机'][language as keyof typeof LOCALIZED_TITLES['无线蓝牙耳机']];
    const fallbackBullets = BULLET_POINTS['无线蓝牙耳机'][language as keyof typeof BULLET_POINTS['无线蓝牙耳机']];
    const fallbackDesc = DESCRIPTIONS['无线蓝牙耳机'][language as keyof typeof DESCRIPTIONS['无线蓝牙耳机']];
    const fallbackKeys = KEYWORDS['无线蓝牙耳机'][language as keyof typeof KEYWORDS['无线蓝牙耳机']];
    const regen = genLocalized(record.nameCn, [language]);
    record.localizedTitles = { ...record.localizedTitles, [language]: regen.titles[language] ?? fallback };
    record.bulletPoints = { ...record.bulletPoints, [language]: regen.bullets[language] ?? fallbackBullets };
    record.descriptions = { ...record.descriptions, [language]: regen.descriptions[language] ?? fallbackDesc };
    record.keywords = { ...record.keywords, [language]: regen.keywords[language] ?? fallbackKeys };
    record.updatedAt = new Date().toISOString();
    return record;
  }
}
