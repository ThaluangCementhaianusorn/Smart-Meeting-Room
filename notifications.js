/**
 * Smart Meeting Room Booking System - Notification Engine
 * Supports:
 * 1. In-App Notifications & Sound Alert (Web Audio Synth)
 * 2. Unread Bell Counter & Notification Dropdown History
 * 3. External Webhook Dispatcher (Telegram, Discord, Google Chat, Slack, Custom Webhook)
 */

class NotificationService {
  constructor() {
    this.notifications = JSON.parse(localStorage.getItem('thtc_notifications') || '[]');
    this.settings = JSON.parse(localStorage.getItem('thtc_webhook_settings') || JSON.stringify({
      enabled: false,
      platform: 'telegram', // 'telegram' | 'discord' | 'googlechat' | 'custom'
      webhookUrl: '',
      botToken: '',
      chatId: '',
      soundEnabled: true
    }));
  }

  // Play a pleasant chime using Web Audio API (zero external assets needed)
  playChime() {
    if (!this.settings.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const now = audioCtx.currentTime;

      // First tone (E5 - 659.25Hz)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Second tone (G#5 - 830.61Hz)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {
      console.warn('Web Audio error or blocked by autoplay policy:', e);
    }
  }

  // Add internal notification & show toast
  notify(title, message, type = 'info', bookingData = null) {
    const item = {
      id: 'notif_' + Date.now(),
      title,
      message,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date().toISOString(),
      read: false,
      bookingId: bookingData?.id || null
    };

    this.notifications.unshift(item);
    if (this.notifications.length > 50) this.notifications.pop();
    localStorage.setItem('thtc_notifications', JSON.stringify(this.notifications));

    this.playChime();
    this.renderBadge();

    // SweetAlert2 Toast
    if (window.Swal) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 4500,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer);
          toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
      });

      Toast.fire({
        icon: type,
        title: `<span class="font-kanit font-semibold">${title}</span>`,
        html: `<span class="font-kanit text-sm text-gray-600">${message}</span>`
      });
    }

    // Send external Webhook if configured and enabled
    if (this.settings.enabled && bookingData) {
      this.dispatchWebhook(title, message, bookingData);
    }
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    localStorage.setItem('thtc_notifications', JSON.stringify(this.notifications));
    this.renderBadge();
  }

  renderBadge() {
    const badge = document.getElementById('notif-badge');
    const count = this.getUnreadCount();
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem('thtc_webhook_settings', JSON.stringify(this.settings));
  }

  // Send external webhook to Telegram / Google Chat / Discord / Custom Endpoint
  async dispatchWebhook(title, message, booking) {
    try {
      const { platform, webhookUrl, botToken, chatId } = this.settings;

      const roomText = booking.roomOther ? `${booking.room} (${booking.roomOther})` : booking.room;
      const formattedDate = `${booking.startDate} ถึง ${booking.endDate}`;
      const formattedTime = `${booking.startTime} - ${booking.endTime} น.`;

      if (platform === 'telegram' && botToken && chatId) {
        const text = `🏢 *วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์*\n` +
                     `🔔 *${title}*\n\n` +
                     `👤 *ผู้ขอใช้:* ${booking.prefix}${booking.fullName}\n` +
                     `🏛 *ห้องประชุม:* ${roomText}\n` +
                     `📅 *วันที่:* ${formattedDate}\n` +
                     `⏰ *เวลา:* ${formattedTime}\n` +
                     `👥 *จำนวน:* ${booking.attendees} คน\n` +
                     `🎯 *วัตถุประสงค์:* ${booking.purpose}\n` +
                     `📊 *สถานะ:* ${this.getStatusLabel(booking.status)}\n\n` +
                     `🔗 ดำเนินการตรวจสอบ: ${window.location.origin}${window.location.pathname}`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
          })
        });
      } else if (platform === 'discord' && webhookUrl) {
        const payload = {
          embeds: [{
            title: `🏛 ระบบจองห้องประชุม วท.ท่าหลวงฯ: ${title}`,
            description: message,
            color: 0x1B2A41,
            fields: [
              { name: "ผู้ขอใช้", value: `${booking.prefix}${booking.fullName} (${booking.department})`, inline: true },
              { name: "ห้องประชุม", value: roomText, inline: true },
              { name: "วัน-เวลา", value: `${formattedDate} (${formattedTime})`, inline: false },
              { name: "เรื่อง", value: booking.purpose || '-', inline: false },
              { name: "สถานะ", value: this.getStatusLabel(booking.status), inline: true }
            ],
            footer: { text: "งานศูนย์ดิจิทัลและสื่อสารองค์กร วท.ท่าหลวงซิเมนต์ไทยอนุสรณ์" }
          }]
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (platform === 'googlechat' && webhookUrl) {
        const payload = {
          text: `*วิทยาลัยเทคนิคท่าหลวงซิเมนต์ไทยอนุสรณ์ - ระบบจองห้องประชุม*\n` +
                `*${title}*\n` +
                `ผู้ขอใช้: ${booking.prefix}${booking.fullName} (${booking.department})\n` +
                `ห้องประชุม: ${roomText}\n` +
                `วัน-เวลา: ${formattedDate} (${formattedTime})\n` +
                `เรื่อง: ${booking.purpose}\n` +
                `สถานะ: ${this.getStatusLabel(booking.status)}`
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (platform === 'custom' && webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'meeting_room_booking_update',
            title,
            message,
            booking
          })
        });
      }
    } catch (err) {
      console.warn('External Webhook dispatch error:', err);
    }
  }

  getStatusLabel(status) {
    const map = {
      pending_check: 'รอตรวจสอบห้อง',
      checked_ready: 'ตรวจสอบแล้ว - พร้อมใช้งาน',
      checked_not_ready: 'ไม่พร้อมใช้งาน',
      endorsed: 'รับรองคำขอแล้ว',
      approved: 'อนุมัติเรียบร้อย',
      rejected: 'ไม่อนุมัติ'
    };
    return map[status] || status;
  }
}

window.notificationService = new NotificationService();
