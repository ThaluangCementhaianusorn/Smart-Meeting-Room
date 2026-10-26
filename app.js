/**
 * Smart Meeting Room Booking System - Application Logic
 * College: วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์
 */

// Global State
let currentTab = 'dashboard';
let calendarInstance = null;
let roomUsageChartInstance = null;
let equipmentChartInstance = null;
let allBookings = [];
let currentViewingBooking = null;

// Room Color and Config Definition
const ROOM_DEFINITIONS = {
  "หอประชุมอดิเรกสาร": { color: "#2563EB", bg: "#EFF6FF", border: "#93C5FD", capacity: 400 },
  "ห้องประชุมสักทอง": { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", capacity: 60 },
  "ห้องประชุม (กาแฟ)": { color: "#BE123C", bg: "#FFF1F2", border: "#FECDD3", capacity: 25 },
  "อาคารโดมเอนกประสงค์": { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", capacity: 800 },
  "ห้องประชุมหน้าห้องผู้อำนวยการ": { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", capacity: 25 },
  "ห้องคอมพิวเตอร์กลาง (ห้องโสต)": { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", capacity: 50 },
  "อื่นๆ": { color: "#64748B", bg: "#F8FAFC", border: "#CBD5E1", capacity: 0 }
};

// Thai Date Helpers
const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

function formatThaiDate(dateStr, includeYear = true) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const year = date.getFullYear() + 543;
  return includeYear ? `${day} ${month} ${year}` : `${day} ${month}`;
}

function parseThaiDateParts(dateStr) {
  if (!dateStr) return { day: "...", month: "...............", year: "....." };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { day: "...", month: "...............", year: "....." };
  return {
    day: date.getDate(),
    month: THAI_MONTHS[date.getMonth()],
    year: date.getFullYear() + 543
  };
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupBookingForm();
  setupNotificationCenter();
  setupSettings();
  
  // Connect Real-Time Database updates
  window.dbProvider.onBookingsChange((bookings) => {
    allBookings = bookings;
    updateDashboardKPIs();
    renderRecentBookings();
    renderCharts();
    refreshCalendarEvents();
    renderApprovalList();
    renderReportsTable();
  });

  // Pre-fill default booking form date to today
  const today = new Date().toISOString().split('T')[0];
  const reqDateInput = document.getElementById('form-requestDate');
  if (reqDateInput) reqDateInput.value = today;
  const startDateInput = document.getElementById('form-startDate');
  if (startDateInput) startDateInput.value = today;
  const endDateInput = document.getElementById('form-endDate');
  if (endDateInput) endDateInput.value = today;
});

// Navigation Handling
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.tab;
      switchTab(target);
    });
  });

  // Mobile menu toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  if (mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
    });
  }
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  const targetElement = document.getElementById(`tab-${tabId}`);
  if (targetElement) {
    targetElement.classList.remove('hidden');
    targetElement.classList.add('animate-fade-in');
  }

  // Update active state in nav
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.tab === tabId) {
      link.classList.add('bg-orange-500', 'text-white');
      link.classList.remove('text-slate-300', 'hover:bg-slate-800');
    } else {
      link.classList.remove('bg-orange-500', 'text-white');
      link.classList.add('text-slate-300', 'hover:bg-slate-800');
    }
  });

  // Actions on tab change
  if (tabId === 'calendar') {
    setTimeout(initOrUpdateCalendar, 100);
  } else if (tabId === 'dashboard') {
    setTimeout(renderCharts, 100);
  } else if (tabId === 'approval') {
    renderApprovalList();
  } else if (tabId === 'reports') {
    renderReportsTable();
  }
}

// Status Badges & Utilities
function getStatusBadge(status) {
  switch (status) {
    case 'pending_check':
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>รอตรวจสอบห้อง
      </span>`;
    case 'checked_ready':
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500"></span>พร้อมใช้งาน (รอรับรอง)
      </span>`;
    case 'checked_not_ready':
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-500"></span>ห้องไม่พร้อมใช้งาน
      </span>`;
    case 'endorsed':
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-purple-500"></span>รับรองแล้ว (รออนุมัติ)
      </span>`;
    case 'approved':
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>อนุมัติเรียบร้อย
      </span>`;
    case 'rejected':
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300">
        <span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-500"></span>ไม่อนุมัติ
      </span>`;
    default:
      return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        ${status}
      </span>`;
  }
}

// ---------------- DASHBOARD LOGIC ----------------
function updateDashboardKPIs() {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayBookings = allBookings.filter(b => b.startDate <= todayStr && b.endDate >= todayStr && b.status === 'approved');
  const pendingApprovals = allBookings.filter(b => ['pending_check', 'checked_ready', 'endorsed'].includes(b.status));
  const approvedTotal = allBookings.filter(b => b.status === 'approved');

  document.getElementById('kpi-today-count').textContent = todayBookings.length;
  document.getElementById('kpi-pending-count').textContent = pendingApprovals.length;
  document.getElementById('kpi-approved-count').textContent = approvedTotal.length;
  document.getElementById('kpi-total-count').textContent = allBookings.length;
}

function renderRecentBookings() {
  const tbody = document.getElementById('recent-bookings-tbody');
  if (!tbody) return;

  if (allBookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-400">ยังไม่มีข้อมูลการจองห้องประชุม</td></tr>`;
    return;
  }

  const recent = allBookings.slice(0, 5);
  tbody.innerHTML = recent.map(b => {
    const roomDef = ROOM_DEFINITIONS[b.room] || ROOM_DEFINITIONS["อื่นๆ"];
    return `
      <tr class="hover:bg-slate-50 transition border-b border-gray-100">
        <td class="py-3 px-4 font-medium text-slate-900">${b.id}</td>
        <td class="py-3 px-4">
          <div class="font-medium text-slate-800">${b.prefix}${b.fullName}</div>
          <div class="text-xs text-slate-500">${b.department}</div>
        </td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold" style="color: ${roomDef.color}; background-color: ${roomDef.bg};">
            ${b.room}
          </span>
        </td>
        <td class="py-3 px-4 text-sm text-slate-600">
          <div>${formatThaiDate(b.startDate)}</div>
          <div class="text-xs text-slate-400">${b.startTime} - ${b.endTime} น.</div>
        </td>
        <td class="py-3 px-4">${getStatusBadge(b.status)}</td>
        <td class="py-3 px-4 text-right">
          <button onclick="viewBookingDetails('${b.id}')" class="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium mr-2">
            ดูข้อมูล
          </button>
          <button onclick="openPrintModal('${b.id}')" class="text-xs text-orange-600 hover:text-orange-800 hover:underline font-medium">
            พิมพ์แบบฟอร์ม
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;

  // 1. Room Usage Bar Chart
  const roomCountMap = {};
  Object.keys(ROOM_DEFINITIONS).forEach(k => { if (k !== 'อื่นๆ') roomCountMap[k] = 0; });
  allBookings.forEach(b => {
    if (roomCountMap[b.room] !== undefined) {
      roomCountMap[b.room]++;
    } else {
      roomCountMap['อื่นๆ'] = (roomCountMap['อื่นๆ'] || 0) + 1;
    }
  });

  const roomLabels = Object.keys(roomCountMap);
  const roomData = Object.values(roomCountMap);
  const roomColors = roomLabels.map(r => (ROOM_DEFINITIONS[r] || ROOM_DEFINITIONS['อื่นๆ']).color);

  const ctxRoom = document.getElementById('chart-room-usage');
  if (ctxRoom) {
    if (roomUsageChartInstance) roomUsageChartInstance.destroy();
    roomUsageChartInstance = new Chart(ctxRoom, {
      type: 'bar',
      data: {
        labels: roomLabels.map(l => l.length > 15 ? l.substring(0, 15) + '...' : l),
        datasets: [{
          label: 'จำนวนครั้งที่จอง',
          data: roomData,
          backgroundColor: roomColors,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            titleFont: { family: 'Kanit' },
            bodyFont: { family: 'Kanit' }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { precision: 0, font: { family: 'Kanit' } }
          },
          x: {
            ticks: { font: { family: 'Kanit', size: 11 } }
          }
        }
      }
    });
  }

  // 2. Equipment Requested Doughnut Chart
  const equipCounts = {
    'เครื่องฉายภาพ': 0,
    'ระบบเสียง': 0,
    'ไมโครโฟน': 0,
    'เครื่องปรับอากาศ': 0,
    'อินเทอร์เน็ต': 0,
    'โต๊ะ/เก้าอี้เพิ่มเติม': 0
  };

  allBookings.forEach(b => {
    if (!b.facilities) return;
    if (b.facilities.projector) equipCounts['เครื่องฉายภาพ']++;
    if (b.facilities.soundSystem) equipCounts['ระบบเสียง']++;
    if (b.facilities.microphone) equipCounts['ไมโครโฟน']++;
    if (b.facilities.airConditioner) equipCounts['เครื่องปรับอากาศ']++;
    if (b.facilities.internet) equipCounts['อินเทอร์เน็ต']++;
    if (b.facilities.extraTablesChairs) equipCounts['โต๊ะ/เก้าอี้เพิ่มเติม']++;
  });

  const ctxEquip = document.getElementById('chart-equipment-usage');
  if (ctxEquip) {
    if (equipmentChartInstance) equipmentChartInstance.destroy();
    equipmentChartInstance = new Chart(ctxEquip, {
      type: 'doughnut',
      data: {
        labels: Object.keys(equipCounts),
        datasets: [{
          data: Object.values(equipCounts),
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { family: 'Kanit', size: 12 }, boxWidth: 14 }
          },
          tooltip: {
            titleFont: { family: 'Kanit' },
            bodyFont: { family: 'Kanit' }
          }
        }
      }
    });
  }
}

// ---------------- FULLCALENDAR LOGIC ----------------
function initOrUpdateCalendar() {
  const calendarEl = document.getElementById('meeting-calendar');
  if (!calendarEl || typeof FullCalendar === 'undefined') return;

  const events = allBookings
    .filter(b => b.status !== 'rejected' && b.status !== 'checked_not_ready')
    .map(b => {
      const roomDef = ROOM_DEFINITIONS[b.room] || ROOM_DEFINITIONS["อื่นๆ"];
      return {
        id: b.id,
        title: `${b.room}: ${b.purpose}`,
        start: `${b.startDate}T${b.startTime}:00`,
        end: `${b.endDate}T${b.endTime}:00`,
        backgroundColor: roomDef.color,
        borderColor: roomDef.color,
        extendedProps: {
          booking: b,
          room: b.room,
          applicant: `${b.prefix}${b.fullName}`,
          department: b.department,
          status: b.status
        }
      };
    });

  if (!calendarInstance) {
    calendarInstance = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      locale: 'th',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
      },
      buttonText: {
        today: 'วันนี้',
        month: 'เดือน',
        week: 'สัปดาห์',
        day: 'วัน',
        list: 'กำหนดการ'
      },
      events: events,
      eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        meridiem: false,
        hour12: false
      },
      eventClick: function(info) {
        viewBookingDetails(info.event.id);
      }
    });
    calendarInstance.render();

    // Hook room filter selector
    const filterSelect = document.getElementById('calendar-room-filter');
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        applyCalendarFilter(filterSelect.value);
      });
    }
  } else {
    calendarInstance.removeAllEvents();
    calendarInstance.addEventSource(events);
  }
}

function refreshCalendarEvents() {
  if (calendarInstance) {
    initOrUpdateCalendar();
  }
}

function applyCalendarFilter(selectedRoom) {
  if (!calendarInstance) return;
  const filteredEvents = allBookings
    .filter(b => b.status !== 'rejected' && b.status !== 'checked_not_ready')
    .filter(b => !selectedRoom || b.room === selectedRoom)
    .map(b => {
      const roomDef = ROOM_DEFINITIONS[b.room] || ROOM_DEFINITIONS["อื่นๆ"];
      return {
        id: b.id,
        title: `${b.room}: ${b.purpose}`,
        start: `${b.startDate}T${b.startTime}:00`,
        end: `${b.endDate}T${b.endTime}:00`,
        backgroundColor: roomDef.color,
        borderColor: roomDef.color,
        extendedProps: { booking: b }
      };
    });
  calendarInstance.removeAllEvents();
  calendarInstance.addEventSource(filteredEvents);
}

// ---------------- BOOKING FORM & CONFLICT DETECTION ----------------
function setupBookingForm() {
  const form = document.getElementById('meeting-booking-form');
  if (!form) return;

  // Toggle custom room input if 'อื่นๆ' is picked
  const roomRadios = document.querySelectorAll('input[name="form-room"]');
  const otherRoomInputContainer = document.getElementById('other-room-container');
  roomRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'อื่นๆ') {
        otherRoomInputContainer.classList.remove('hidden');
      } else {
        otherRoomInputContainer.classList.add('hidden');
      }
      checkFormConflict();
    });
  });

  // Toggle extra tables/chairs count
  const extraCheckbox = document.getElementById('form-fac-tables');
  const extraCountContainer = document.getElementById('fac-tables-count-container');
  if (extraCheckbox && extraCountContainer) {
    extraCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        extraCountContainer.classList.remove('hidden');
      } else {
        extraCountContainer.classList.add('hidden');
      }
    });
  }

  // Conflict triggers on date / time change
  ['form-startDate', 'form-endDate', 'form-startTime', 'form-endTime'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', checkFormConflict);
  });

  // Form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const agreementChecked = document.getElementById('form-agreement').checked;
    if (!agreementChecked) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณายอมรับเงื่อนไข',
        text: 'โปรดยืนยันการรับรองว่าจะดูแลรักษาทรัพย์สินของทางราชการตามระเบียบ',
        confirmButtonColor: '#1B2A41',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const selectedRoomRadio = document.querySelector('input[name="form-room"]:checked');
    if (!selectedRoomRadio) {
      Swal.fire({ icon: 'warning', title: 'กรุณาเลือกห้องประชุม', confirmButtonColor: '#1B2A41' });
      return;
    }

    const room = selectedRoomRadio.value;
    const roomOther = room === 'อื่นๆ' ? document.getElementById('form-roomOther').value.trim() : '';
    const startDate = document.getElementById('form-startDate').value;
    const endDate = document.getElementById('form-endDate').value;
    const startTime = document.getElementById('form-startTime').value;
    const endTime = document.getElementById('form-endTime').value;

    // Check conflict
    const conflictResult = window.dbProvider.checkConflict(room, startDate, endDate, startTime, endTime);
    if (conflictResult.hasConflict) {
      const conflict = conflictResult.conflicts[0];
      Swal.fire({
        icon: 'error',
        title: 'ห้องประชุมไม่ว่างในช่วงเวลาดังกล่าว!',
        html: `<div class="text-left text-sm text-slate-700 bg-red-50 p-3 rounded-lg border border-red-200">
          <p class="font-semibold text-red-800">มีรายการจองซ้ำซ้อน:</p>
          <p>• ผู้จอง: ${conflict.prefix}${conflict.fullName} (${conflict.department})</p>
          <p>• เรื่อง: ${conflict.purpose}</p>
          <p>• วันเวลา: ${conflict.startDate} (${conflict.startTime} - ${conflict.endTime} น.)</p>
          <p>• สถานะ: ${window.notificationService.getStatusLabel(conflict.status)}</p>
        </div>
        <p class="mt-3 text-xs text-gray-500">กรุณาเลือกช่วงเวลาอื่น หรือเลือกห้องประชุมอื่น</p>`,
        confirmButtonColor: '#E07A2F',
        confirmButtonText: 'เข้าใจแล้ว'
      });
      return;
    }

    // Prepare booking object
    const booking = {
      prefix: document.getElementById('form-prefix').value,
      fullName: document.getElementById('form-fullName').value.trim(),
      position: document.getElementById('form-position').value.trim(),
      department: document.getElementById('form-department').value.trim(),
      phone: document.getElementById('form-phone').value.trim(),
      requestDate: document.getElementById('form-requestDate').value || new Date().toISOString().split('T')[0],
      room,
      roomOther,
      purpose: document.getElementById('form-purpose').value.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      attendees: parseInt(document.getElementById('form-attendees').value) || 0,
      facilities: {
        projector: document.getElementById('form-fac-projector').checked,
        soundSystem: document.getElementById('form-fac-sound').checked,
        microphone: document.getElementById('form-fac-mic').checked,
        airConditioner: document.getElementById('form-fac-ac').checked,
        internet: document.getElementById('form-fac-net').checked,
        extraTablesChairs: document.getElementById('form-fac-tables').checked,
        extraCount: parseInt(document.getElementById('form-fac-tables-count')?.value) || 0,
        other: document.getElementById('form-fac-other-desc').value.trim()
      },
      agreement: true,
      status: 'pending_check', // Step 1: รอตรวจสอบห้อง
      workflow: {
        step1_submitted: {
          at: new Date().toLocaleString('th-TH'),
          by: `${document.getElementById('form-prefix').value}${document.getElementById('form-fullName').value.trim()}`
        },
        step2_checked: null,
        step3_endorsed: null,
        step4_approved: null
      }
    };

    // Show loading
    Swal.fire({
      title: 'กำลังส่งแบบคำขอ...',
      text: 'กรุณารอสักครู่ ระบบกำลังบันทึกและส่งการแจ้งเตือน',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const created = await window.dbProvider.createBooking(booking);

      // Trigger notification
      window.notificationService.notify(
        'มีคำขอจองห้องประชุมใหม่',
        `${created.prefix}${created.fullName} ขอใช้ ${created.room} ในวันที่ ${formatThaiDate(created.startDate)}`,
        'info',
        created
      );

      Swal.fire({
        icon: 'success',
        title: 'ส่งแบบคำขอสำเร็จ!',
        html: `<p class="text-sm text-gray-600 mb-2">รหัสคำขอ: <strong class="text-blue-600">${created.id}</strong></p>
               <p class="text-xs text-gray-500">ระบบได้ส่งต่อไปยังเจ้าหน้าที่ตรวจสอบห้อง (นายวัชรพงศ์ โสภา) เรียบร้อยแล้ว</p>`,
        showCancelButton: true,
        confirmButtonColor: '#1B2A41',
        cancelButtonColor: '#E07A2F',
        confirmButtonText: 'ไปที่รายการจอง',
        cancelButtonText: 'พิมพ์แบบคำขอ (PDF)'
      }).then((result) => {
        form.reset();
        checkFormConflict();
        if (result.isConfirmed) {
          switchTab('approval');
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          openPrintModal(created.id);
        }
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
        text: err.message || 'โปรดลองใหม่อีกครั้ง',
        confirmButtonColor: '#1B2A41'
      });
    }
  });
}

function checkFormConflict() {
  const selectedRoomRadio = document.querySelector('input[name="form-room"]:checked');
  const banner = document.getElementById('conflict-alert-banner');
  if (!banner) return;

  if (!selectedRoomRadio) {
    banner.classList.add('hidden');
    return;
  }

  const room = selectedRoomRadio.value;
  const startDate = document.getElementById('form-startDate').value;
  const endDate = document.getElementById('form-endDate').value;
  const startTime = document.getElementById('form-startTime').value;
  const endTime = document.getElementById('form-endTime').value;

  if (!startDate || !endDate || !startTime || !endTime) {
    banner.classList.add('hidden');
    return;
  }

  const result = window.dbProvider.checkConflict(room, startDate, endDate, startTime, endTime);
  banner.classList.remove('hidden');

  if (result.hasConflict) {
    const c = result.conflicts[0];
    banner.className = "p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 transition animate-fade-in";
    banner.innerHTML = `
      <div class="flex items-start">
        <svg class="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <div>
          <h4 class="font-semibold text-red-800">มีรายการจองชนกันในช่วงเวลานี้!</h4>
          <p class="text-xs text-red-700 mt-1">ผู้จอง: <strong>${c.prefix}${c.fullName}</strong> (${c.department}) เรื่อง "${c.purpose}" (${c.startTime} - ${c.endTime} น.)</p>
          <span class="inline-block mt-2 text-xs font-semibold px-2 py-0.5 bg-red-200 text-red-800 rounded">กรุณาเปลี่ยนห้องหรือเวลา</span>
        </div>
      </div>
    `;
  } else {
    banner.className = "p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 transition animate-fade-in";
    banner.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <div class="text-sm font-medium text-emerald-800">
          ห้อง <strong>${room}</strong> ว่างในช่วงเวลาดังกล่าว สามารถส่งคำขอได้ทันที
        </div>
      </div>
    `;
  }
}

// ---------------- APPROVAL WORKFLOW CENTER ----------------
let currentApprovalFilter = 'all';

function renderApprovalList() {
  const container = document.getElementById('approval-cards-container');
  if (!container) return;

  const filterTab = currentApprovalFilter;
  let filtered = allBookings;

  if (filterTab === 'pending_check') {
    filtered = allBookings.filter(b => b.status === 'pending_check');
  } else if (filterTab === 'endorsed') {
    filtered = allBookings.filter(b => b.status === 'checked_ready');
  } else if (filterTab === 'approved') {
    filtered = allBookings.filter(b => b.status === 'endorsed');
  } else if (filterTab === 'history') {
    filtered = allBookings.filter(b => ['approved', 'rejected', 'checked_not_ready'].includes(b.status));
  }

  // Update counter badges on tabs
  const countAll = allBookings.length;
  const countStep1 = allBookings.filter(b => b.status === 'pending_check').length;
  const countStep2 = allBookings.filter(b => b.status === 'checked_ready').length;
  const countStep3 = allBookings.filter(b => b.status === 'endorsed').length;

  document.getElementById('badge-appr-all').textContent = countAll;
  document.getElementById('badge-appr-step1').textContent = countStep1;
  document.getElementById('badge-appr-step2').textContent = countStep2;
  document.getElementById('badge-appr-step3').textContent = countStep3;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm col-span-full">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-gray-500 font-medium">ไม่พบรายการในหมวดหมู่นี้</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const roomDef = ROOM_DEFINITIONS[b.room] || ROOM_DEFINITIONS["อื่นๆ"];
    return `
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition">
        <!-- Header -->
        <div class="flex items-start justify-between pb-4 border-b border-gray-100">
          <div>
            <div class="flex items-center space-x-2">
              <span class="text-xs font-mono font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800">${b.id}</span>
              ${getStatusBadge(b.status)}
            </div>
            <h3 class="text-lg font-bold text-slate-900 mt-2">${b.purpose}</h3>
            <p class="text-xs text-slate-500">ยื่นคำขอเมื่อ: ${formatThaiDate(b.requestDate)}</p>
          </div>
          <span class="px-3 py-1 rounded-lg text-xs font-semibold" style="color: ${roomDef.color}; background-color: ${roomDef.bg};">
            ${b.room}
          </span>
        </div>

        <!-- Body Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-sm text-slate-600 border-b border-gray-100">
          <div>
            <p class="text-xs text-slate-400 font-medium">ผู้ขอใช้ห้อง</p>
            <p class="font-semibold text-slate-800">${b.prefix}${b.fullName} (${b.position || 'เจ้าหน้าที่'})</p>
            <p class="text-xs text-slate-500">${b.department} | โทร. ${b.phone}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-medium">วันและเวลาที่ขอใช้</p>
            <p class="font-semibold text-slate-800">${formatThaiDate(b.startDate)} ถึง ${formatThaiDate(b.endDate)}</p>
            <p class="text-xs text-slate-500">${b.startTime} - ${b.endTime} น. (ผู้เข้าร่วม ~${b.attendees} คน)</p>
          </div>
        </div>

        <!-- Facility Checklist -->
        <div class="py-3 text-xs text-slate-600 border-b border-gray-100">
          <p class="font-medium text-slate-500 mb-1">อุปกรณ์ที่ขอใช้:</p>
          <div class="flex flex-wrap gap-1.5">
            ${b.facilities?.projector ? '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">✓ โปรเจกเตอร์</span>' : ''}
            ${b.facilities?.soundSystem ? '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">✓ ระบบเสียง</span>' : ''}
            ${b.facilities?.microphone ? '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">✓ ไมโครโฟน</span>' : ''}
            ${b.facilities?.airConditioner ? '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">✓ เครื่องปรับอากาศ</span>' : ''}
            ${b.facilities?.internet ? '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">✓ อินเทอร์เน็ต</span>' : ''}
            ${b.facilities?.extraTablesChairs ? `<span class="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md">✓ โต๊ะ/เก้าอี้ (${b.facilities.extraCount} ตัว)</span>` : ''}
            ${b.facilities?.other ? `<span class="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">✓ อื่นๆ: ${b.facilities.other}</span>` : ''}
          </div>
        </div>

        <!-- Workflow History Badges -->
        <div class="py-3 text-xs bg-slate-50 rounded-xl p-3 my-3">
          <div class="font-semibold text-slate-700 mb-1.5 flex items-center">
            <svg class="w-4 h-4 mr-1 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            ลำดับขั้นการตรวจสอบและอนุมัติ:
          </div>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-slate-600">1. ผู้ยื่นคำขอ: ${b.workflow?.step1_submitted?.by || b.fullName}</span>
              <span class="text-slate-400 font-mono">${b.workflow?.step1_submitted?.at || '-'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="${b.workflow?.step2_checked ? 'text-emerald-700 font-medium' : 'text-slate-400'}">
                2. จนท.ตรวจสอบห้อง: นายวัชรพงศ์ โสภา ${b.workflow?.step2_checked ? (b.workflow.step2_checked.ready ? '(พร้อมใช้งาน)' : '(ไม่พร้อม)') : '(รอตรวจ)'}
              </span>
              <span class="text-slate-400 font-mono">${b.workflow?.step2_checked?.at || '-'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="${b.workflow?.step3_endorsed ? 'text-emerald-700 font-medium' : 'text-slate-400'}">
                3. ผู้รับรอง: นายเอกราช เขียวทอง ${b.workflow?.step3_endorsed ? '(รับรองคำขอแล้ว)' : '(รอรับรอง)'}
              </span>
              <span class="text-slate-400 font-mono">${b.workflow?.step3_endorsed?.at || '-'}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="${b.workflow?.step4_approved ? (b.workflow.step4_approved.decision === 'approved' ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium') : 'text-slate-400'}">
                4. ผู้พิจารณา: นายชาตรี เริงชัยภูมิ ${b.workflow?.step4_approved ? (b.workflow.step4_approved.decision === 'approved' ? '(อนุมัติ)' : '(ไม่อนุมัติ)') : '(รอพิจารณา)'}
              </span>
              <span class="text-slate-400 font-mono">${b.workflow?.step4_approved?.at || '-'}</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons depending on role / current state -->
        <div class="pt-2 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center space-x-2">
            <button onclick="viewBookingDetails('${b.id}')" class="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium">
              ดูรายละเอียด
            </button>
            <button onclick="openPrintModal('${b.id}')" class="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-medium flex items-center">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              พิมพ์แบบฟอร์ม A4
            </button>
          </div>

          <!-- Dynamic Workflow Action Buttons -->
          <div class="flex items-center space-x-2">
            ${renderWorkflowActionButtons(b)}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderWorkflowActionButtons(b) {
  // Step 1: รอตรวจสอบห้อง (Officer Watcharaphong Sopa)
  if (b.status === 'pending_check') {
    return `
      <button onclick="handleOfficerCheck('${b.id}', true)" class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition">
        ✓ ยืนยันห้องพร้อมใช้งาน
      </button>
      <button onclick="handleOfficerCheck('${b.id}', false)" class="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium shadow-sm transition">
        ✗ ไม่พร้อมใช้งาน
      </button>
    `;
  }

  // Step 2: ตรวจสอบแล้ว -> รอรับรอง (Head Ekkarat Khiaothong)
  if (b.status === 'checked_ready') {
    return `
      <button onclick="handleHeadEndorse('${b.id}')" class="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition">
        ✓ รับรองคำขอ (หัวหน้างาน)
      </button>
    `;
  }

  // Step 3: รับรองแล้ว -> รออนุมัติ (Deputy Director Chatree Roengchaiyaphum)
  if (b.status === 'endorsed') {
    return `
      <button onclick="handleDirectorApproval('${b.id}', 'approved')" class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition">
        ✓ อนุมัติ (รอง ผอ.)
      </button>
      <button onclick="handleDirectorApproval('${b.id}', 'rejected')" class="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium shadow-sm transition">
        ✗ ไม่อนุมัติ
      </button>
    `;
  }

  return `<span class="text-xs text-slate-400 font-medium">ดำเนินการเสร็จสิ้นแล้ว</span>`;
}

// Workflow Handlers
async function handleOfficerCheck(id, isReady) {
  const { value: note } = await Swal.fire({
    title: isReady ? 'ยืนยันห้องพร้อมใช้งาน' : 'ระบุสาเหตุที่ห้องไม่พร้อมใช้งาน',
    input: 'textarea',
    inputLabel: 'บันทึกการตรวจสอบอุปกรณ์และสภาพห้อง (ระบุโดย นายวัชรพงศ์ โสภา)',
    inputPlaceholder: isReady ? 'เช่น ตรวจสอบระบบเสียง ไมค์ และเครื่องปรับอากาศเรียบร้อย' : 'เช่น เครื่องปรับอากาศขัดข้องอยู่ระหว่างซ่อมแซม',
    showCancelButton: true,
    confirmButtonColor: isReady ? '#059669' : '#DC2626',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'บันทึกผลการตรวจสอบ',
    cancelButtonText: 'ยกเลิก'
  });

  if (note !== undefined) {
    const booking = allBookings.find(b => b.id === id);
    if (!booking) return;

    const newStatus = isReady ? 'checked_ready' : 'checked_not_ready';
    const update = {
      status: newStatus,
      'workflow.step2_checked': {
        checked: true,
        ready: isReady,
        officerName: 'นายวัชรพงศ์ โสภา',
        officerRole: 'เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร',
        at: new Date().toLocaleString('th-TH'),
        note: note || (isReady ? 'อุปกรณ์และห้องประชุมพร้อมใช้งาน' : 'ห้องไม่พร้อมใช้งาน')
      }
    };

    await window.dbProvider.updateBooking(id, update);
    window.notificationService.notify(
      `ผลตรวจห้อง: ${isReady ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'}`,
      `นายวัชรพงศ์ โสภา ได้บันทึกผลตรวจสอบคำขอ ${id} แล้ว`,
      isReady ? 'success' : 'warning',
      { ...booking, status: newStatus }
    );
  }
}

async function handleHeadEndorse(id) {
  const { value: note } = await Swal.fire({
    title: 'รับรองคำขอใช้ห้องประชุม',
    input: 'textarea',
    inputLabel: 'ความเห็น/บันทึกการรับรอง (โดย นายเอกราช เขียวทอง)',
    inputValue: 'เห็นควรอนุญาตตามคำขอ เพื่อส่งให้ผู้บริหารพิจารณา',
    showCancelButton: true,
    confirmButtonColor: '#2563EB',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'ยืนยันการรับรอง',
    cancelButtonText: 'ยกเลิก'
  });

  if (note !== undefined) {
    const booking = allBookings.find(b => b.id === id);
    if (!booking) return;

    const update = {
      status: 'endorsed',
      'workflow.step3_endorsed': {
        endorsed: true,
        endorserName: 'นายเอกราช เขียวทอง',
        endorserRole: 'หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร',
        at: new Date().toLocaleString('th-TH'),
        note: note || 'เห็นควรอนุญาตตามคำขอ'
      }
    };

    await window.dbProvider.updateBooking(id, update);
    window.notificationService.notify(
      'คำขอได้รับการรับรองแล้ว',
      `นายเอกราช เขียวทอง ได้รับรองคำขอ ${id} และส่งต่อรองผู้อำนวยการฯ แล้ว`,
      'info',
      { ...booking, status: 'endorsed' }
    );
  }
}

async function handleDirectorApproval(id, decision) {
  const isApproved = decision === 'approved';
  const { value: note } = await Swal.fire({
    title: isApproved ? 'อนุมัติการใช้ห้องประชุม' : 'ไม่อนุมัติการใช้ห้องประชุม',
    input: 'textarea',
    inputLabel: 'ความเห็น/คำสั่งการ (โดย นายชาตรี เริงชัยภูมิ - รอง ผอ.)',
    inputValue: isApproved ? 'อนุมัติให้ใช้สถานที่ตามระเบียบของวิทยาลัยฯ' : 'เนื่องจากมีภารกิจเร่งด่วนของวิทยาลัยฯ',
    showCancelButton: true,
    confirmButtonColor: isApproved ? '#059669' : '#DC2626',
    cancelButtonColor: '#6B7280',
    confirmButtonText: isApproved ? 'ยืนยันอนุมัติ' : 'ยืนยันไม่อนุมัติ',
    cancelButtonText: 'ยกเลิก'
  });

  if (note !== undefined) {
    const booking = allBookings.find(b => b.id === id);
    if (!booking) return;

    const update = {
      status: decision,
      'workflow.step4_approved': {
        decision: decision,
        approverName: 'นายชาตรี เริงชัยภูมิ',
        approverRole: 'รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน',
        at: new Date().toLocaleString('th-TH'),
        note: note || (isApproved ? 'อนุมัติเรียบร้อย' : 'ไม่อนุมัติ')
      }
    };

    await window.dbProvider.updateBooking(id, update);
    window.notificationService.notify(
      `คำขอจองห้องประชุม: ${isApproved ? 'ได้รับอนุมัติแล้ว' : 'ไม่อนุมัติ'}`,
      `นายชาตรี เริงชัยภูมิ รองผู้อำนวยการฯ ได้มีคำสั่ง ${isApproved ? 'อนุมัติ' : 'ไม่อนุมัติ'} คำขอ ${id}`,
      isApproved ? 'success' : 'error',
      { ...booking, status: decision }
    );
  }
}

// ---------------- REPORTS & TABLE EXPORT ----------------
function renderReportsTable() {
  const tbody = document.getElementById('reports-table-tbody');
  if (!tbody) return;

  const searchQuery = document.getElementById('report-search')?.value.toLowerCase() || '';
  const roomFilter = document.getElementById('report-room-filter')?.value || '';
  const statusFilter = document.getElementById('report-status-filter')?.value || '';

  const filtered = allBookings.filter(b => {
    const matchSearch = !searchQuery || 
      b.id.toLowerCase().includes(searchQuery) ||
      b.fullName.toLowerCase().includes(searchQuery) ||
      b.department.toLowerCase().includes(searchQuery) ||
      b.purpose.toLowerCase().includes(searchQuery);

    const matchRoom = !roomFilter || b.room === roomFilter;
    const matchStatus = !statusFilter || b.status === statusFilter;

    return matchSearch && matchRoom && matchStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-400">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const roomDef = ROOM_DEFINITIONS[b.room] || ROOM_DEFINITIONS["อื่นๆ"];
    return `
      <tr class="hover:bg-slate-50 transition border-b border-gray-100 text-sm">
        <td class="py-3 px-4 font-mono font-medium text-slate-800">${b.id}</td>
        <td class="py-3 px-4">
          <div class="font-medium text-slate-900">${b.prefix}${b.fullName}</div>
          <div class="text-xs text-slate-500">${b.department} (โทร. ${b.phone})</div>
        </td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold" style="color: ${roomDef.color}; background-color: ${roomDef.bg};">
            ${b.room}
          </span>
        </td>
        <td class="py-3 px-4 text-xs text-slate-700">
          <div class="font-medium">${formatThaiDate(b.startDate)}</div>
          <div class="text-slate-400">${b.startTime} - ${b.endTime} น.</div>
        </td>
        <td class="py-3 px-4 text-xs text-slate-600 max-w-xs truncate" title="${b.purpose}">
          ${b.purpose}
        </td>
        <td class="py-3 px-4">${getStatusBadge(b.status)}</td>
        <td class="py-3 px-4 text-right space-x-1 whitespace-nowrap">
          <button onclick="viewBookingDetails('${b.id}')" title="ดูข้อมูล" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
          <button onclick="openPrintModal('${b.id}')" title="พิมพ์แบบฟอร์ม A4" class="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
          </button>
          <button onclick="confirmDeleteBooking('${b.id}')" title="ลบรายการ" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function exportBookingsToCSV() {
  if (allBookings.length === 0) {
    Swal.fire({ icon: 'info', title: 'ไม่มีข้อมูลสำหรับส่งออก', confirmButtonColor: '#1B2A41' });
    return;
  }

  const headers = [
    "รหัสการจอง",
    "วันที่ยื่นคำขอ",
    "คำนำหน้า",
    "ชื่อ-นามสกุล",
    "ตำแหน่ง",
    "หน่วยงาน/สาขาวิชา",
    "เบอร์โทรศัพท์",
    "ห้องประชุม",
    "ห้องประชุมอื่นๆ",
    "วัตถุประสงค์",
    "วันที่เริ่ม",
    "วันที่สิ้นสุด",
    "เวลาเริ่ม",
    "เวลาสิ้นสุด",
    "จำนวนผู้เข้าใช้",
    "สถานะ"
  ];

  const rows = allBookings.map(b => [
    `"${b.id}"`,
    `"${b.requestDate}"`,
    `"${b.prefix}"`,
    `"${b.fullName}"`,
    `"${b.position || ''}"`,
    `"${b.department}"`,
    `"${b.phone}"`,
    `"${b.room}"`,
    `"${b.roomOther || ''}"`,
    `"${(b.purpose || '').replace(/"/g, '""')}"`,
    `"${b.startDate}"`,
    `"${b.endDate}"`,
    `"${b.startTime}"`,
    `"${b.endTime}"`,
    `"${b.attendees}"`,
    `"${window.notificationService.getStatusLabel(b.status)}"`
  ]);

  // UTF-8 BOM so Excel opens Thai fonts correctly
  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("href", url);
  a.setAttribute("download", `meeting_bookings_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---------------- OFFICIAL GOVERNMENT PRINT FORM (A4) ----------------
function openPrintModal(bookingId) {
  const booking = allBookings.find(b => b.id === bookingId);
  if (!booking) return;

  currentViewingBooking = booking;
  generateOfficialPrintHTML(booking);

  const modal = document.getElementById('print-preview-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closePrintModal() {
  const modal = document.getElementById('print-preview-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

function generateOfficialPrintHTML(b) {
  const printContainer = document.getElementById('official-print-document');
  if (!printContainer) return;

  const reqDateParts = parseThaiDateParts(b.requestDate);
  const startDateParts = parseThaiDateParts(b.startDate);
  const endDateParts = parseThaiDateParts(b.endDate);

  const isRoom = (r) => b.room === r ? '✓' : '&nbsp;';
  const isFac = (key) => b.facilities && b.facilities[key] ? '✓' : '&nbsp;';

  // Verification step statuses
  const step2 = b.workflow?.step2_checked;
  const isReadyChecked = step2 && step2.ready === true ? '✓' : '&nbsp;';
  const isNotReadyChecked = step2 && step2.ready === false ? '✓' : '&nbsp;';

  const html = `
    <div class="gov-form-container">
      <!-- Header with College Emblem -->
      <div class="text-center mb-3">
        <img src="assets/logo.svg" alt="ตราวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์" class="w-20 h-20 mx-auto mb-2 object-contain" />
        <h1 class="text-xl font-bold text-slate-900 tracking-wide font-kanit">แบบคำขออนุญาตใช้ห้องประชุม</h1>
        <h2 class="text-lg font-bold text-slate-800 font-kanit">วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</h2>
      </div>

      <!-- Date Written -->
      <div class="text-right text-sm my-2">
        เขียนวันที่ <span class="dotted-line px-4 min-w-[200px] text-center">${reqDateParts.day} ${reqDateParts.month} พ.ศ. ${reqDateParts.year}</span>
      </div>

      <!-- Subject & Recipient -->
      <div class="text-sm space-y-1 mb-2">
        <div><strong>เรื่อง</strong> ขออนุญาตใช้ห้องประชุม</div>
        <div><strong>เรียน</strong> ผู้อำนวยการวิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์</div>
      </div>

      <!-- Applicant Info -->
      <div class="text-sm leading-relaxed mb-2">
        <div class="flex items-baseline">
          <span>ข้าพเจ้า (นาย/นาง/นางสาว)</span>
          <span class="dotted-line flex-1 px-3 ml-2 font-semibold">${b.prefix} ${b.fullName}</span>
        </div>
        <div class="flex items-baseline mt-1">
          <span>ตำแหน่ง</span>
          <span class="dotted-line flex-1 px-3 ml-2 font-medium">${b.position || '-'}</span>
        </div>
        <div class="flex items-baseline mt-1">
          <span>หน่วยงาน / สาขาวิชา</span>
          <span class="dotted-line flex-1 px-3 ml-2 font-medium">${b.department}</span>
          <span class="ml-4">หมายเลขโทรศัพท์</span>
          <span class="dotted-line px-3 ml-2 font-mono font-medium">${b.phone}</span>
        </div>
      </div>

      <!-- Room Selection Checklist -->
      <div class="text-sm mt-3 mb-2">
        <div class="font-bold mb-1.5">มีความประสงค์ขออนุญาตใช้ห้องประชุม</div>
        <div class="grid grid-cols-3 gap-y-1 pl-4 text-sm">
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isRoom('หอประชุมอดิเรกสาร')}</span> หอประชุมอดิเรกสาร
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isRoom('ห้องประชุมสักทอง')}</span> ห้องประชุมสักทอง
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isRoom('ห้องประชุมหน้าห้องผู้อำนวยการ')}</span> ห้องประชุมหน้าห้องผู้อำนวยการ
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isRoom('ห้องประชุม (กาแฟ)')}</span> ห้องประชุม (กาแฟ)
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isRoom('อาคารโดมเอนกประสงค์')}</span> อาคารโดมเอนกประสงค์
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isRoom('ห้องคอมพิวเตอร์กลาง (ห้องโสต)')}</span> ห้องคอมพิวเตอร์กลาง (ห้องโสต)
          </div>
        </div>
        <div class="flex items-baseline pl-4 mt-1">
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isRoom('อื่นๆ')}</span> อื่นๆ
          </div>
          <span class="dotted-line flex-1 px-3 ml-2">${b.room === 'อื่นๆ' ? b.roomOther : ''}</span>
        </div>
      </div>

      <!-- Purpose & Schedule Details -->
      <div class="text-sm leading-relaxed mb-3">
        <div class="flex items-baseline">
          <span>เพื่อใช้ในการดำเนินงาน เรื่อง</span>
          <span class="dotted-line flex-1 px-3 ml-2 font-semibold text-slate-900">${b.purpose}</span>
        </div>
        <div class="flex items-baseline mt-1 flex-wrap">
          <span>กำหนดการใช้งานวันที่</span>
          <span class="dotted-line px-2 font-semibold">${startDateParts.day}</span>
          <span class="ml-1">เดือน</span>
          <span class="dotted-line px-2 font-semibold">${startDateParts.month}</span>
          <span class="ml-1">พ.ศ.</span>
          <span class="dotted-line px-2 font-semibold">${startDateParts.year}</span>
          <span class="ml-2">ถึงวันที่</span>
          <span class="dotted-line px-2 font-semibold">${endDateParts.day}</span>
          <span class="ml-1">เดือน</span>
          <span class="dotted-line px-2 font-semibold">${endDateParts.month}</span>
          <span class="ml-1">พ.ศ.</span>
          <span class="dotted-line px-2 font-semibold">${endDateParts.year}</span>
        </div>
        <div class="flex items-baseline mt-1">
          <span>ตั้งแต่เวลา</span>
          <span class="dotted-line px-3 font-semibold font-mono">${b.startTime}</span>
          <span class="ml-1">น. ถึงเวลา</span>
          <span class="dotted-line px-3 font-semibold font-mono">${b.endTime}</span>
          <span class="ml-1">น.</span>
          <span class="ml-4">จำนวนผู้เข้าใช้ (โดยประมาณ)</span>
          <span class="dotted-line px-3 font-semibold font-mono">${b.attendees}</span>
          <span class="ml-1">คน</span>
        </div>
      </div>

      <!-- Equipment Checklist -->
      <div class="text-sm mb-3">
        <div class="font-bold mb-1.5">ครุภัณฑ์/อุปกรณ์/สิ่งอำนวยความสะดวกที่ขอใช้</div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 pl-4">
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isFac('projector')}</span> เครื่องฉายภาพ (Projector)
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isFac('soundSystem')}</span> ระบบเสียง
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isFac('microphone')}</span> ไมโครโฟน
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isFac('airConditioner')}</span> เครื่องปรับอากาศ
          </div>
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isFac('internet')}</span> อินเทอร์เน็ต
          </div>
        </div>
        <div class="flex items-baseline pl-4 mt-1.5">
          <div class="flex items-center">
            <span class="gov-checkbox-box">${isFac('extraTablesChairs')}</span> โต๊ะ/เก้าอี้เพิ่มเติม
          </div>
          <span class="dotted-line px-3 font-semibold">${b.facilities?.extraCount || '......'}</span> ตัว
          <div class="flex items-center ml-6">
            <span class="gov-checkbox-box">${b.facilities?.other ? '✓' : '&nbsp;'}</span> อื่น ๆ
          </div>
          <span class="dotted-line flex-1 px-3 ml-2">${b.facilities?.other || ''}</span>
        </div>
      </div>

      <!-- Legal Obligation Statement -->
      <div class="text-xs text-center my-3 text-slate-800">
        ข้าพเจ้าขอรับรองว่าจะดูแลรักษาทรัพย์สินของทางราชการ และปฏิบัติตามระเบียบของวิทยาลัยโดยเคร่งครัด
      </div>

      <!-- 4-Box Signature Table -->
      <table class="signature-table text-xs">
        <tr>
          <!-- 1. Applicant -->
          <td class="h-32">
            <p class="font-bold mb-6">ผู้ยื่นคำขอ</p>
            <p class="mb-1">ลงชื่อ ...........................................................</p>
            <p class="mb-1">(<span class="px-2 font-semibold">${b.prefix}${b.fullName}</span>)</p>
            <p class="text-slate-600">วันที่ <span class="dotted-line px-2">${reqDateParts.day} ${reqDateParts.month} ${reqDateParts.year}</span></p>
          </td>

          <!-- 2. Head of Department -->
          <td class="h-32">
            <p class="font-bold mb-6">หัวหน้างาน/ผู้รับรอง</p>
            <p class="mb-1">ลงชื่อ ...........................................................</p>
            <p class="mb-1 font-semibold">(นายเอกราช เขียวทอง)</p>
            <p class="text-slate-600">หัวหน้างานศูนย์ดิจิทัลและสื่อสารองค์กร</p>
            <p class="text-slate-600 mt-1">วันที่ ...........................................................</p>
          </td>
        </tr>
        <tr>
          <!-- 3. Room Inspection Officer -->
          <td class="h-32">
            <p class="font-bold mb-4">เจ้าหน้าที่ผู้ตรวจสอบห้อง</p>
            <p class="mb-1">ลงชื่อ ...........................................................</p>
            <p class="mb-1 font-semibold">(นายวัชรพงศ์ โสภา)</p>
            <p class="text-slate-600 mb-2">เจ้าหน้าที่งานศูนย์ดิจิทัลและสื่อสารองค์กร</p>
            <div class="flex justify-center items-center space-x-6 text-xs">
              <span class="flex items-center"><span class="gov-checkbox-box">${isReadyChecked}</span> พร้อมใช้งาน</span>
              <span class="flex items-center"><span class="gov-checkbox-box">${isNotReadyChecked}</span> ไม่พร้อมใช้งาน</span>
            </div>
          </td>

          <!-- 4. Approver / Deputy Director -->
          <td class="h-32">
            <p class="font-bold mb-4">ผู้พิจารณา</p>
            <p class="mb-1">ลงชื่อ ...........................................................</p>
            <p class="mb-1 font-semibold">(นายชาตรี เริงชัยภูมิ)</p>
            <p class="text-slate-600">รองผู้อำนวยการฝ่ายพัฒนายุทธศาสตร์และแผนงาน</p>
            <p class="text-slate-600 mt-2">วันที่ ...........................................................</p>
          </td>
        </tr>
      </table>

      <!-- Notes footer -->
      <div class="text-xs mt-3 flex items-baseline">
        <span class="font-bold">หมายเหตุ</span>
        <span class="dotted-line flex-1 px-3 ml-2 text-slate-700">
          ${b.workflow?.step4_approved?.note || b.workflow?.step2_checked?.note || ''}
        </span>
      </div>
    </div>
  `;

  printContainer.innerHTML = html;
}

function printOfficialForm() {
  window.print();
}

// ---------------- DETAILS MODAL ----------------
function viewBookingDetails(id) {
  const b = allBookings.find(item => item.id === id);
  if (!b) return;

  currentViewingBooking = b;
  const modal = document.getElementById('details-modal');
  const content = document.getElementById('details-modal-content');
  if (!modal || !content) return;

  const roomDef = ROOM_DEFINITIONS[b.room] || ROOM_DEFINITIONS["อื่นๆ"];

  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <span class="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">${b.id}</span>
          <h3 class="text-lg font-bold text-slate-900 mt-1">${b.purpose}</h3>
        </div>
        ${getStatusBadge(b.status)}
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
        <div>
          <p class="text-xs text-slate-400">ผู้ขอใช้:</p>
          <p class="font-semibold text-slate-800">${b.prefix}${b.fullName}</p>
          <p class="text-xs text-slate-600">${b.position || '-'} | ${b.department}</p>
          <p class="text-xs text-slate-600">โทร. ${b.phone}</p>
        </div>
        <div>
          <p class="text-xs text-slate-400">ห้องประชุมที่ขอใช้:</p>
          <p class="font-semibold" style="color: ${roomDef.color};">${b.room} ${b.roomOther ? `(${b.roomOther})` : ''}</p>
          <p class="text-xs text-slate-600 mt-1">วันเวลา: ${formatThaiDate(b.startDate)} - ${formatThaiDate(b.endDate)}</p>
          <p class="text-xs text-slate-600">${b.startTime} - ${b.endTime} น. (ผู้เข้าใช้ ~${b.attendees} คน)</p>
        </div>
      </div>

      <div>
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">อุปกรณ์ที่ขอใช้</h4>
        <div class="flex flex-wrap gap-2 text-xs">
          ${b.facilities?.projector ? '<span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">✓ เครื่องฉายภาพ (Projector)</span>' : ''}
          ${b.facilities?.soundSystem ? '<span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">✓ ระบบเสียง</span>' : ''}
          ${b.facilities?.microphone ? '<span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">✓ ไมโครโฟน</span>' : ''}
          ${b.facilities?.airConditioner ? '<span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">✓ เครื่องปรับอากาศ</span>' : ''}
          ${b.facilities?.internet ? '<span class="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md">✓ อินเทอร์เน็ต</span>' : ''}
          ${b.facilities?.extraTablesChairs ? `<span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md">✓ โต๊ะ/เก้าอี้เพิ่มเติม (${b.facilities.extraCount} ตัว)</span>` : ''}
          ${b.facilities?.other ? `<span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">✓ อื่นๆ: ${b.facilities.other}</span>` : ''}
        </div>
      </div>

      <div class="border-t border-gray-100 pt-3">
        <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">บันทึกการตรวจสอบตามลำดับขั้น</h4>
        <div class="space-y-2 text-xs">
          <div class="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
            <span class="font-semibold text-slate-700">1. ยื่นคำขอ:</span> ${b.workflow?.step1_submitted?.by || b.fullName} 
            <span class="text-slate-400">(${b.workflow?.step1_submitted?.at || '-'})</span>
          </div>
          <div class="p-2.5 rounded-lg ${b.workflow?.step2_checked ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}">
            <span class="font-semibold text-slate-700">2. จนท.ตรวจสอบห้อง:</span> 
            ${b.workflow?.step2_checked ? `นายวัชรพงศ์ โสภา - ${b.workflow.step2_checked.ready ? 'พร้อมใช้งาน' : 'ไม่พร้อมใช้งาน'} (${b.workflow.step2_checked.note || '-'})` : 'รอดำเนินการ'}
          </div>
          <div class="p-2.5 rounded-lg ${b.workflow?.step3_endorsed ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}">
            <span class="font-semibold text-slate-700">3. หัวหน้างานรับรอง:</span> 
            ${b.workflow?.step3_endorsed ? `นายเอกราช เขียวทอง (${b.workflow.step3_endorsed.note || 'รับรองคำขอ'})` : 'รอดำเนินการ'}
          </div>
          <div class="p-2.5 rounded-lg ${b.workflow?.step4_approved ? (b.workflow.step4_approved.decision === 'approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200') : 'bg-gray-50 border border-gray-200'}">
            <span class="font-semibold text-slate-700">4. ผู้พิจารณา (รอง ผอ.):</span> 
            ${b.workflow?.step4_approved ? `นายชาตรี เริงชัยภูมิ - ${b.workflow.step4_approved.decision === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'} (${b.workflow.step4_approved.note || '-'})` : 'รอดำเนินการ'}
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeDetailsModal() {
  const modal = document.getElementById('details-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function confirmDeleteBooking(id) {
  const result = await Swal.fire({
    title: 'ยืนยันการลบรายการจอง?',
    text: `รหัสคำขอ: ${id} การกระทำนี้ไม่สามารถย้อนกลับได้`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#DC2626',
    cancelButtonColor: '#6B7280',
    confirmButtonText: 'ลบรายการ',
    cancelButtonText: 'ยกเลิก'
  });

  if (result.isConfirmed) {
    await window.dbProvider.deleteBooking(id);
    Swal.fire({
      icon: 'success',
      title: 'ลบข้อมูลสำเร็จ',
      timer: 1500,
      showConfirmButton: false
    });
  }
}

// ---------------- NOTIFICATION CENTER ----------------
function setupNotificationCenter() {
  const notifBtn = document.getElementById('notif-bell-btn');
  const dropdown = document.getElementById('notif-dropdown');
  const markReadBtn = document.getElementById('notif-mark-all-read');

  if (notifBtn && dropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      renderNotificationDropdown();
    });

    document.addEventListener('click', () => {
      dropdown.classList.add('hidden');
    });

    dropdown.addEventListener('click', (e) => e.stopPropagation());
  }

  if (markReadBtn) {
    markReadBtn.addEventListener('click', () => {
      window.notificationService.markAllAsRead();
      renderNotificationDropdown();
    });
  }

  window.notificationService.renderBadge();
}

function renderNotificationDropdown() {
  const listEl = document.getElementById('notif-list-container');
  if (!listEl) return;

  const notifs = window.notificationService.notifications;
  if (notifs.length === 0) {
    listEl.innerHTML = `<div class="p-6 text-center text-xs text-gray-400">ไม่มีการแจ้งเตือน</div>`;
    return;
  }

  listEl.innerHTML = notifs.map(n => `
    <div class="p-3 border-b border-gray-100 hover:bg-slate-50 transition text-xs ${n.read ? 'opacity-70' : 'bg-blue-50/40'}">
      <div class="flex items-center justify-between mb-1">
        <span class="font-semibold text-slate-800">${n.title}</span>
        <span class="text-[10px] text-slate-400 font-mono">${new Date(n.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <p class="text-slate-600 leading-snug">${n.message}</p>
    </div>
  `).join('');
}

// ---------------- SETTINGS & WEBHOOK ----------------
function setupSettings() {
  const form = document.getElementById('settings-webhook-form');
  if (!form) return;

  // Load current settings
  const s = window.notificationService.settings;
  const enableToggle = document.getElementById('setting-webhook-enabled');
  const platformSelect = document.getElementById('setting-platform');
  const webhookUrlInput = document.getElementById('setting-webhookUrl');
  const botTokenInput = document.getElementById('setting-botToken');
  const chatIdInput = document.getElementById('setting-chatId');
  const soundToggle = document.getElementById('setting-sound-enabled');

  if (enableToggle) enableToggle.checked = s.enabled;
  if (platformSelect) platformSelect.value = s.platform;
  if (webhookUrlInput) webhookUrlInput.value = s.webhookUrl || '';
  if (botTokenInput) botTokenInput.value = s.botToken || '';
  if (chatIdInput) chatIdInput.value = s.chatId || '';
  if (soundToggle) soundToggle.checked = s.soundEnabled;

  togglePlatformFields(s.platform);

  if (platformSelect) {
    platformSelect.addEventListener('change', (e) => {
      togglePlatformFields(e.target.value);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    window.notificationService.saveSettings({
      enabled: enableToggle.checked,
      platform: platformSelect.value,
      webhookUrl: webhookUrlInput.value.trim(),
      botToken: botTokenInput.value.trim(),
      chatId: chatIdInput.value.trim(),
      soundEnabled: soundToggle.checked
    });

    Swal.fire({
      icon: 'success',
      title: 'บันทึกการตั้งค่าแล้ว',
      text: 'ระบบจะเริ่มใช้การตั้งค่าการแจ้งเตือนทันที',
      confirmButtonColor: '#1B2A41'
    });
  });

  // Test notification button
  const testBtn = document.getElementById('btn-test-notification');
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      window.notificationService.notify(
        'ทดสอบการแจ้งเตือน',
        'ระบบแจ้งเตือนระบบจองห้องประชุม วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ พร้อมใช้งาน',
        'success',
        allBookings[0] || null
      );
    });
  }
}

function togglePlatformFields(platform) {
  const telegramGroup = document.getElementById('setting-group-telegram');
  const webhookGroup = document.getElementById('setting-group-webhook');

  if (platform === 'telegram') {
    if (telegramGroup) telegramGroup.classList.remove('hidden');
    if (webhookGroup) webhookGroup.classList.add('hidden');
  } else {
    if (telegramGroup) telegramGroup.classList.add('hidden');
    if (webhookGroup) webhookGroup.classList.remove('hidden');
  }
}
