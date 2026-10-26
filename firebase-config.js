/**
 * Database & Real-Time Sync Provider
 * Supports Firebase Firestore & Instant Offline / LocalStorage Multi-Tab Broadcast Sync
 */

// Initial Seed Data tailored for วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์
const INITIAL_SEED_BOOKINGS = [
  {
    id: "BK-2569-001",
    requestDate: "2026-10-24",
    prefix: "นาย",
    fullName: "วิโรจน์ แสงสุวรรณ",
    position: "ครูชำนาญการ",
    department: "แผนกวิชาช่างยนต์",
    phone: "089-123-4567",
    room: "หอประชุมอดิเรกสาร",
    roomOther: "",
    purpose: "จัดโครงการปฐมนิเทศนักศึกษาฝึกงานและเตรียมความพร้อมสู่สถานประกอบการ",
    startDate: "2026-10-27",
    endDate: "2026-10-27",
    startTime: "08:30",
    endTime: "16:30",
    attendees: 250,
    facilities: {
      projector: true,
      soundSystem: true,
      microphone: true,
      airConditioner: true,
      internet: true,
      extraTablesChairs: true,
      extraCount: 50,
      other: "ขอโพเดียม 1 ตัว และปลั๊กพ่วง 3 จุด"
    },
    agreement: true,
    status: "approved", // approved
    workflow: {
      step1_submitted: { at: "2026-10-24 09:30", by: "วิโรจน์ แสงสุวรรณ" },
      step2_checked: {
        checked: true,
        ready: true,
        officerName: "นายวัชรพงศ์ โสภา",
        officerRole: "เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร",
        at: "2026-10-24 10:15",
        note: "ตรวจสอบระบบเสียงและโปรเจกเตอร์พร้อมใช้งาน"
      },
      step3_endorsed: {
        endorsed: true,
        endorserName: "นายเอกราช เขียวทอง",
        endorserRole: "หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร",
        at: "2026-10-24 11:30",
        note: "เห็นควรอนุญาตตามคำขอ"
      },
      step4_approved: {
        decision: "approved",
        approverName: "นายชาตรี เริงชัยภูมิ",
        approverRole: "รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน",
        at: "2026-10-24 14:00",
        note: "อนุญาตให้ใช้สถานที่ตามระเบียบของวิทยาลัยฯ"
      }
    },
    createdAt: "2026-10-24T09:30:00Z"
  },
  {
    id: "BK-2569-002",
    requestDate: "2026-10-25",
    prefix: "นางสาว",
    fullName: "กุลธิดา มีสุข",
    position: "หัวหน้างานการเงิน",
    department: "ฝ่ายบริหารทรัพยากร",
    phone: "081-987-6543",
    room: "ห้องประชุมสักทอง",
    roomOther: "",
    purpose: "ประชุมชี้แจงการเบิกจ่ายงบประมาณไตรมาส 1 ประจำปีงบประมาณ 2570",
    startDate: "2026-10-28",
    endDate: "2026-10-28",
    startTime: "09:00",
    endTime: "12:00",
    attendees: 35,
    facilities: {
      projector: true,
      soundSystem: true,
      microphone: true,
      airConditioner: true,
      internet: true,
      extraTablesChairs: false,
      extraCount: 0,
      other: ""
    },
    agreement: true,
    status: "endorsed", // waiting for final approval by รอง ผอ. ชาตรี
    workflow: {
      step1_submitted: { at: "2026-10-25 08:45", by: "กุลธิดา มีสุข" },
      step2_checked: {
        checked: true,
        ready: true,
        officerName: "นายวัชรพงศ์ โสภา",
        officerRole: "เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร",
        at: "2026-10-25 09:20",
        note: "ห้องว่างและอุปกรณ์พร้อมใช้งาน"
      },
      step3_endorsed: {
        endorsed: true,
        endorserName: "นายเอกราช เขียวทอง",
        endorserRole: "หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร",
        at: "2026-10-25 10:05",
        note: "รับรองคำขอ ส่งต่อผู้บริหารพิจารณา"
      },
      step4_approved: null
    },
    createdAt: "2026-10-25T08:45:00Z"
  },
  {
    id: "BK-2569-003",
    requestDate: "2026-10-26",
    prefix: "นาย",
    fullName: "อนุสรณ์ ใจดี",
    position: "ครูผู้ช่วย",
    department: "แผนกวิชาเทคโนโลยีสารสนเทศ",
    phone: "086-555-1234",
    room: "ห้องคอมพิวเตอร์กลาง (ห้องโสต)",
    roomOther: "",
    purpose: "จัดสอบประเมินสมรรถนะวิชาชีพด้านดิจิทัลมาตรฐานสากล (IC3 Digital Literacy)",
    startDate: "2026-10-29",
    endDate: "2026-10-29",
    startTime: "13:00",
    endTime: "16:30",
    attendees: 40,
    facilities: {
      projector: true,
      soundSystem: false,
      microphone: true,
      airConditioner: true,
      internet: true,
      extraTablesChairs: false,
      extraCount: 0,
      other: "ขอเปิดสัญญาณไฟเบอร์ออปติกความเร็วสูง 1 Gbps"
    },
    agreement: true,
    status: "pending_check", // Waiting for Officer Watcharaphong
    workflow: {
      step1_submitted: { at: "2026-10-26 08:15", by: "อนุสรณ์ ใจดี" },
      step2_checked: null,
      step3_endorsed: null,
      step4_approved: null
    },
    createdAt: "2026-10-26T08:15:00Z"
  },
  {
    id: "BK-2569-004",
    requestDate: "2026-10-26",
    prefix: "นาง",
    fullName: "พรรณรายณ์ รัตนโชติ",
    position: "หัวหน้างานกิจกรรมนักเรียนนักศึกษา",
    department: "ฝ่ายพัฒนากิจการนักเรียนนักศึกษา",
    phone: "085-444-9988",
    room: "ห้องประชุมหน้าห้องผู้อำนวยการ",
    roomOther: "",
    purpose: "ประชุมปรึกษาหารือการเข้าร่วมการแข่งขันทักษะวิชาชีพ ระดับ อศจ.สระบุรี",
    startDate: "2026-10-30",
    endDate: "2026-10-30",
    startTime: "10:00",
    endTime: "12:00",
    attendees: 15,
    facilities: {
      projector: true,
      soundSystem: true,
      microphone: true,
      airConditioner: true,
      internet: true,
      extraTablesChairs: false,
      extraCount: 0,
      other: ""
    },
    agreement: true,
    status: "checked_ready", // Waiting for Head Ekkarat
    workflow: {
      step1_submitted: { at: "2026-10-26 09:00", by: "พรรณรายณ์ รัตนโชติ" },
      step2_checked: {
        checked: true,
        ready: true,
        officerName: "นายวัชรพงศ์ โสภา",
        officerRole: "เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร",
        at: "2026-10-26 09:30",
        note: "ห้องว่างพร้อมใช้งาน มีจอ Smart TV พร้อมสาย HDMI"
      },
      step3_endorsed: null,
      step4_approved: null
    },
    createdAt: "2026-10-26T09:00:00Z"
  }
];

class DatabaseProvider {
  constructor() {
    this.useFirebase = false;
    this.firestore = null;
    this.broadcastChannel = null;
    this.listeners = [];
    this.firebaseConfig = null;

    this.init();
  }

  init() {
    // Check saved config
    const savedConfig = localStorage.getItem('thtc_firebase_config');
    if (savedConfig) {
      try {
        this.firebaseConfig = JSON.parse(savedConfig);
        if (this.firebaseConfig && this.firebaseConfig.apiKey && window.firebase) {
          this.initFirebase();
        }
      } catch (e) {
        console.warn('Invalid saved Firebase config:', e);
      }
    }

    // Set up Broadcast Channel for real-time multi-tab syncing
    try {
      this.broadcastChannel = new BroadcastChannel('thtc_meeting_sync');
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'DATA_UPDATED') {
          this.notifyListeners(this.getLocalBookings());
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    // Seed local storage if empty
    if (!localStorage.getItem('thtc_bookings')) {
      localStorage.setItem('thtc_bookings', JSON.stringify(INITIAL_SEED_BOOKINGS));
    }
  }

  initFirebase() {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(this.firebaseConfig);
      }
      this.firestore = firebase.firestore();
      this.useFirebase = true;
      console.log('🔥 Connected to Firebase Firestore real-time database');

      // Listen to real-time updates
      this.firestore.collection('bookings')
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
          const bookings = [];
          snapshot.forEach(doc => {
            bookings.push({ id: doc.id, ...doc.data() });
          });
          // Cache in local storage
          localStorage.setItem('thtc_bookings', JSON.stringify(bookings));
          this.notifyListeners(bookings);
        }, (err) => {
          console.error('Firestore listener error, falling back to local store:', err);
          this.useFirebase = false;
        });
    } catch (err) {
      console.error('Failed to initialize Firebase:', err);
      this.useFirebase = false;
    }
  }

  // Subscribe to real-time changes
  onBookingsChange(callback) {
    this.listeners.push(callback);
    // Initial call
    this.getBookings().then(data => callback(data));

    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(data) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Listener callback error:', e); }
    });
  }

  getLocalBookings() {
    try {
      const data = localStorage.getItem('thtc_bookings');
      return data ? JSON.parse(data) : INITIAL_SEED_BOOKINGS;
    } catch (e) {
      return INITIAL_SEED_BOOKINGS;
    }
  }

  async getBookings() {
    if (this.useFirebase && this.firestore) {
      try {
        const snapshot = await this.firestore.collection('bookings').orderBy('createdAt', 'desc').get();
        const list = [];
        snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
        return list;
      } catch (e) {
        console.warn('Firestore fetch failed, using local store:', e);
      }
    }
    return this.getLocalBookings();
  }

  async createBooking(booking) {
    booking.id = booking.id || ('BK-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000));
    booking.createdAt = new Date().toISOString();

    if (this.useFirebase && this.firestore) {
      try {
        await this.firestore.collection('bookings').doc(booking.id).set(booking);
        return booking;
      } catch (e) {
        console.warn('Firestore set failed, saving locally:', e);
      }
    }

    // Local save
    const current = this.getLocalBookings();
    current.unshift(booking);
    localStorage.setItem('thtc_bookings', JSON.stringify(current));

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'DATA_UPDATED' });
    }
    this.notifyListeners(current);
    return booking;
  }

  async updateBooking(id, updateData) {
    if (this.useFirebase && this.firestore) {
      try {
        await this.firestore.collection('bookings').doc(id).update(updateData);
        return true;
      } catch (e) {
        console.warn('Firestore update failed, updating locally:', e);
      }
    }

    const current = this.getLocalBookings();
    const index = current.findIndex(b => b.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updateData };
      localStorage.setItem('thtc_bookings', JSON.stringify(current));

      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'DATA_UPDATED' });
      }
      this.notifyListeners(current);
      return true;
    }
    return false;
  }

  async deleteBooking(id) {
    if (this.useFirebase && this.firestore) {
      try {
        await this.firestore.collection('bookings').doc(id).delete();
      } catch (e) {
        console.warn('Firestore delete failed:', e);
      }
    }

    let current = this.getLocalBookings();
    current = current.filter(b => b.id !== id);
    localStorage.setItem('thtc_bookings', JSON.stringify(current));

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'DATA_UPDATED' });
    }
    this.notifyListeners(current);
    return true;
  }

  // Check room conflict
  checkConflict(room, startDate, endDate, startTime, endTime, excludeId = null) {
    const bookings = this.getLocalBookings();
    const conflicts = [];

    const newStart = new Date(`${startDate}T${startTime}:00`);
    const newEnd = new Date(`${endDate}T${endTime}:00`);

    for (const b of bookings) {
      if (excludeId && b.id === excludeId) continue;
      // If booking was rejected or marked not ready, it doesn't block
      if (b.status === 'rejected' || b.status === 'checked_not_ready') continue;

      if (b.room === room) {
        const existStart = new Date(`${b.startDate}T${b.startTime}:00`);
        const existEnd = new Date(`${b.endDate}T${b.endTime}:00`);

        // Check date/time overlap: (StartA < EndB) and (EndA > StartB)
        if (newStart < existEnd && newEnd > existStart) {
          conflicts.push(b);
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }
}

window.dbProvider = new DatabaseProvider();
