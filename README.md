# ระบบจองห้องประชุมออนไลน์ (Smart Meeting Room Booking System)
## วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์

ระบบบริหารจัดการและจองห้องประชุมออนไลน์แบบครบวงจร ออกแบบมาเพื่อวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์โดยเฉพาะ รองรับการทำงานแบบ Real-time, ระบบตรวจจับการจองซ้ำซ้อน (Conflict Detection), ปฏิทินแสดงสถานะห้องประชุม, แดชบอร์ดสถิติ, ระบบอนุมัติตามลำดับขั้น 4 ลำดับตามระเบียบงานศูนย์ดิจิทัลและสื่อสารองค์กร และการพิมพ์เอกสารแบบคำขออนุญาตขนาด A4 ตามแบบฟอร์มราชการที่ถูกต้อง 100%

---

## 🏛 1. ฟังก์ชันหลักของระบบ (Core Features)

1. **Interactive Dashboard & Statistics:**
   - การ์ดสรุป KPI: จำนวนการใช้ห้องวันนี้, รายการที่รออนุมัติ, รายการที่อนุมัติแล้ว, จำนวนการจองทั้งหมด
   - กราฟแท่ง (Bar Chart) วิเคราะห์สถิติความถี่การใช้แต่ละห้องประชุม
   - กราฟโดนัท (Doughnut Chart) แสดงสถิติการขอใช้อุปกรณ์/ครุภัณฑ์
   - ตารางแสดงรายการจองล่าสุดพร้อมป้ายสถานะแบบ Real-time

2. **ปฏิทินสถานะห้องประชุม (FullCalendar.js):**
   - มุมมองปฏิทินแบบ รายเดือน (Month), รายสัปดาห์ (Week), รายวัน (Day) และ รายการ (List)
   - แยกสีตามห้องประชุม 6 ห้องหลักและห้องอื่นๆ เพื่อดูคิวว่างได้ชัดเจน
   - ตัวกรอง (Filter) ดูเฉพาะห้องที่ต้องการ
   - คลิกดูรายละเอียดผู้ขอใช้ วันเวลา วัตถุประสงค์ และอุปกรณ์ที่ขอใช้ได้ทันที

3. **แบบฟอร์มบันทึกคำขอ & Conflict Detection:**
   - ข้อมูลผู้ขอใช้: วันที่เขียนคำขอ, คำนำหน้า, ชื่อ-สกุล, ตำแหน่ง, หน่วยงาน/สาขาวิชา, เบอร์โทร
   - รายชื่อห้องประชุมของวิทยาลัยฯ:
     - หอประชุมอดิเรกสาร
     - ห้องประชุมสักทอง
     - ห้องประชุมหน้าห้องผู้อำนวยการ
     - ห้องประชุม (กาแฟ)
     - อาคารโดมเอนกประสงค์
     - ห้องคอมพิวเตอร์กลาง (ห้องโสต)
     - อื่นๆ (ระบุสถานที่เพิ่มเติม)
   - ระบบ **ตรวจเวลาชนกันแบบ Real-time (Conflict Detection)** แจ้งเตือนทันทีหากมีคำขอจองห้องเดียวกันในช่วงวันและเวลาที่คาบเกี่ยวกัน
   - รายการอุปกรณ์/สิ่งอำนวยความสะดวก: โปรเจกเตอร์, เครื่องเสียง, ไมค์, แอร์, อินเทอร์เน็ต, โต๊ะ/เก้าอี้เพิ่มเติม (ระบุจำนวนตัว), อื่นๆ
   - กล่องยืนยันคำรับรองรักษาทรัพย์สินราชการ

4. **ระบบอนุมัติตามลำดับขั้น (Multi-Level Approval Workflow):**
   - **ลำดับที่ 1:** `รอตรวจสอบห้อง` (Pending Check) – ผู้ขอใช้ยื่นแบบฟอร์มเข้ามาในระบบ
   - **ลำดับที่ 2:** `ตรวจสอบแล้ว - พร้อมใช้งาน / ไม่พร้อมใช้งาน` – สำหรับ **นายวัชรพงศ์ โสภา** (เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร) ตรวจสอบสภาพห้องและอุปกรณ์
   - **ลำดับที่ 3:** `รับรองคำขอ` (Endorsed) – สำหรับ **นายเอกราช เขียวทอง** (หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร) รับรองคำขอเพื่อเสนอผู้บริหาร
   - **ลำดับที่ 4:** `อนุมัติ / ไม่อนุมัติ` (Approved / Rejected) – สำหรับ **นายชาตรี เริงชัยภูมิ** (รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน) พร้อมบันทึกคำสั่งการ/หมายเหตุ

5. **ระบบรายงาน & พิมพ์แบบฟอร์มราชการ (Official A4 Print):**
   - ตารางแสดงรายการพร้อมระบบค้นหาและตัวกรองตามห้องประชุม และสถานะ
   - ปุ่ม **ส่งออก Excel / CSV** เข้ารหัส UTF-8 BOM รองรับภาษาไทยสมบูรณ์
   - ปุ่ม **"พิมพ์แบบคำขอ (PDF)"** จัดหน้ากระดาษ A4 สัดส่วนตามแบบฟอร์มต้นฉบับ มีตราสัญลักษณ์วิทยาลัยฯ กล่องติ๊กเลือกข้อมูลอัตโนมัติ และตารางลงนาม 4 ฝ่ายครบถ้วน

6. **ระบบการแจ้งเตือนแบบ Real-Time (Notifications & Webhook):**
   - In-App Toast & กระดิ่งแจ้งเตือนพร้อมตัวเลขนับจำนวนที่ยังไม่ได้อ่าน
   - เสียงแจ้งเตือนสังเคราะห์ผ่าน **Web Audio API** ไม่ต้องพึ่งพาไฟล์เสียงภายนอก
   - รองรับ Webhook เชื่อมต่อไปยัง **Telegram Bot**, **Discord**, **Google Chat** หรือ Custom API

---

## 🗄 2. โครงสร้างฐานข้อมูล (Database Schema)

โครงสร้าง Collection `bookings` ใน Firestore หรือแถวใน Google Sheets / LocalStorage:

```typescript
interface BookingRecord {
  id: string;                      // รหัสคำขอ เช่น "BK-2569-001"
  requestDate: string;             // วันที่เขียนคำขอ (YYYY-MM-DD)
  prefix: "นาย" | "นาง" | "นางสาว";
  fullName: string;                // ชื่อ-นามสกุล ผู้ขอใช้
  position: string;                // ตำแหน่ง
  department: string;              // แผนกวิชา / งาน
  phone: string;                   // หมายเลขโทรศัพท์
  room: string;                    // ชื่อห้องประชุม
  roomOther?: string;              // กรณีเลือก "อื่นๆ"
  purpose: string;                 // เพื่อใช้ในการดำเนินงานเรื่อง
  startDate: string;               // วันที่เริ่มต้น (YYYY-MM-DD)
  endDate: string;                 // วันที่สิ้นสุด (YYYY-MM-DD)
  startTime: string;               // เวลาเริ่มต้น เช่น "08:30"
  endTime: string;                 // เวลาสิ้นสุด เช่น "16:30"
  attendees: number;               // จำนวนผู้เข้าใช้โดยประมาณ (คน)
  facilities: {
    projector: boolean;            // เครื่องฉายภาพ
    soundSystem: boolean;          // ระบบเสียง
    microphone: boolean;           // ไมโครโฟน
    airConditioner: boolean;       // เครื่องปรับอากาศ
    internet: boolean;             // อินเทอร์เน็ต
    extraTablesChairs: boolean;    // โต๊ะ/เก้าอี้เพิ่มเติม
    extraCount: number;            // จำนวนตัว
    other: string;                 // อื่นๆ
  };
  agreement: boolean;              // ยืนยันคำรับรองรักษาทรัพย์สิน
  status: "pending_check" | "checked_ready" | "checked_not_ready" | "endorsed" | "approved" | "rejected";
  workflow: {
    step1_submitted: { at: string; by: string };
    step2_checked: {
      checked: boolean;
      ready: boolean;
      officerName: string;         // นายวัชรพงศ์ โสภา
      officerRole: string;
      at: string;
      note: string;
    } | null;
    step3_endorsed: {
      endorsed: boolean;
      endorserName: string;        // นายเอกราช เขียวทอง
      endorserRole: string;
      at: string;
      note: string;
    } | null;
    step4_approved: {
      decision: "approved" | "rejected";
      approverName: string;        // นายชาตรี เริงชัยภูมิ
      approverRole: string;
      at: string;
      note: string;
    } | null;
  };
  createdAt: string;               // ISO 8601 Timestamp
}
```

---

## ☁️ 3. การเชื่อมต่อฐานข้อมูล (Backend Options)

### ตัวเลือกที่ 1: Firebase Firestore (Real-time Database แนะนำ)
1. เข้าไปที่ [Firebase Console](https://console.firebase.google.com/) แล้วสร้างโปรเจกต์ใหม่
2. เปิดใช้งาน **Cloud Firestore**
3. คัดลอก `firebaseConfig` มาใส่ในเมนูการตั้งค่า หรือไฟล์ `js/firebase-config.js`:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "thtc-meeting.firebaseapp.com",
  projectId: "thtc-meeting",
  storageBucket: "thtc-meeting.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```
4. กำหนด Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookings/{document=**} {
      allow read, write: if true; // หรือกำหนดเงื่อนไข Authentication ตามต้องการ
    }
  }
}
```

### ตัวเลือกที่ 2: Google Apps Script + Google Sheets (สำหรับสถานศึกษา)
หากต้องการเชื่อมต่อเข้า Google Sheets ของวิทยาลัย สามารถสร้างไฟล์ Google Apps Script (`Code.gs`):
```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  if (data.action === "create") {
    sheet.appendRow([
      data.id, data.requestDate, data.prefix + data.fullName,
      data.department, data.phone, data.room, data.purpose,
      data.startDate, data.startTime, data.endTime, data.attendees, data.status
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 🚀 4. การเปิดใช้งานและทดสอบระบบ

1. **เปิดทดสอบทันทีบนเครื่องของคุณ:**
   - ดับเบิลคลิกเปิดไฟล์ `index.html` ผ่าน Google Chrome, Edge หรือ Safari ได้ทันที
   - หรือใช้ Live Server / Static HTTP Server:
     ```powershell
     cd C:\Users\Wasuphat\.gemini\antigravity\scratch\smart-meeting-booking
     python -m http.server 8080
     ```
   - เข้าใช้งานผ่านบราวเซอร์ที่: `http://localhost:8080`

2. **การนำขึ้นโฮสต์จริง (Free Deployment):**
   - สามารถอัปโหลดขึ้น **Firebase Hosting**, **GitHub Pages**, **Vercel** หรือ Web Server ภายในของวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ได้ทันทีโดยไม่ต้อง Build
