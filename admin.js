// ========== Admin Panel Logic ==========

document.addEventListener('DOMContentLoaded', () => {
    setupAdminPanel();
});

async function setupAdminPanel() {
    setupSidebarNavigation();
    await loadDashboard();
}

// التنقل بين الصفحات
function setupSidebarNavigation() {
    const links = document.querySelectorAll('.sidebar-link');
    
    links.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // إزالة active من كل الروابط
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // إخفاء كل الصفحات
            const pages = document.querySelectorAll('[id^="page-"]');
            pages.forEach(p => p.style.display = 'none');
            
            // إظهار الصفحة المطلوبة
            const pageName = link.dataset.page;
            document.getElementById(`page-${pageName}`).style.display = 'block';
            
            // تحميل بيانات الصفحة
            switch(pageName) {
                case 'dashboard':
                    await loadDashboard();
                    break;
                case 'bookings':
                    await loadBookings();
                    break;
                case 'announcements':
                    await loadAnnouncements();
                    break;
                case 'settings':
                    await loadSettings();
                    break;
                case 'notifications':
                    await loadNotifications();
                    break;
                case 'reports':
                    await loadReports();
                    break;
            }
        });
    });
}

// لوحة القيادة
async function loadDashboard() {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // حجوزات اليوم
        const { data: todayBookings, error: todayError } = await supabase
            .from('bookings')
            .select('*')
            .eq('booking_date', today)
            .neq('status', 'cancelled');
        
        if (todayError) throw todayError;
        
        // كل الحجوزات
        const { data: allBookings, error: allError } = await supabase
            .from('bookings')
            .select('*');
        
        if (allError) throw allError;
        
        // تحديث الإحصائيات
        document.getElementById('todayBookings').textContent = todayBookings?.length || 0;
        
        const upcoming = allBookings?.filter(b => 
            new Date(b.booking_date + 'T' + b.start_time) >= new Date() && 
            b.status !== 'cancelled'
        ) || [];
        document.getElementById('upcomingCount').textContent = upcoming.length;
        
        const revenue = allBookings?.reduce((sum, b) => 
            b.status === 'confirmed' ? sum + b.price : sum, 0
        ) || 0;
        document.getElementById('totalRevenue').textContent = revenue;
        
        document.getElementById('confirmedCount').textContent = 
            allBookings?.filter(b => b.status === 'confirmed').length || 0;
        document.getElementById('pendingCount').textContent = 
            allBookings?.filter(b => b.status === 'pending').length || 0;
        document.getElementById('cancelledCount').textContent = 
            allBookings?.filter(b => b.status === 'cancelled').length || 0;
        
        // جدول اليوم
        const scheduleTable = document.getElementById('todaySchedule');
        if (todayBookings && todayBookings.length > 0) {
            scheduleTable.innerHTML = todayBookings.map(b => `
                <tr>
                    <td>${b.start_time}</td>
                    <td>${b.phone}</td>
                    <td>${b.duration} دقيقة</td>
                    <td>${b.booking_type === 'weekly' ? 'أسبوعي' : 'عادي'}</td>
                    <td><span class="status-badge status-${b.status}">${getStatusText(b.status)}</span></td>
                </tr>
            `).join('');
        } else {
            scheduleTable.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748B;">لا توجد حجوزات اليوم</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// إدارة الحجوزات
async function loadBookings(phone = '') {
    try {
        let query = supabase
            .from('bookings')
            .select('*')
            .order('booking_date', { ascending: false });
        
        if (phone) {
            query = query.eq('phone', phone);
        }
        
        const { data: bookings, error } = await query;
        
        if (error) throw error;
        
        const table = document.getElementById('bookingsTable');
        
        if (bookings && bookings.length > 0) {
            table.innerHTML = bookings.map(b => `
                <tr>
                    <td>${formatDate(b.booking_date)}</td>
                    <td>${b.start_time}</td>
                    <td>${b.duration} دقيقة</td>
                    <td>${b.phone}</td>
                    <td>${b.booking_type === 'weekly' ? 'أسبوعي' : 'عادي'}</td>
                    <td>${b.source === 'website' ? 'الموقع' : 'المالك'}</td>
                    <td><span class="status-badge status-${b.status}">${getStatusText(b.status)}</span></td>
                    <td>
                        ${b.status === 'pending' ? `<button onclick="updateBookingStatus(${b.id}, 'confirmed')" class="btn-primary" style="padding: 8px 15px; font-size: 13px;">تأكيد</button>` : ''}
                        ${b.status !== 'cancelled' ? `<button onclick="updateBookingStatus(${b.id}, 'cancelled')" class="btn-danger" style="padding: 8px 15px; font-size: 13px;">إلغاء</button>` : ''}
                    </td>
                </tr>
            `).join('');
        } else {
            table.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #64748B;">لا توجد حجوزات</td></tr>';
        }
        
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// تحديث حالة الحجز
async function updateBookingStatus(id, status) {
    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status: status })
            .eq('id', id);
        
        if (error) throw error;
        
        showToast(status === 'confirmed' ? 'تم تأكيد الحجز ✅' : 'تم إلغاء الحجز');
        
        if (status === 'cancelled') {
            // إضافة إشعار
            await supabase
                .from('notifications')
                .insert([{
                    type: 'slot_available',
                    message: '🔓 الموعد أصبح متاحًا',
                    created_at: new Date().toISOString(),
                    is_read: false
                }]);
        }
        
        loadDashboard();
        loadBookings();
        
    } catch (error) {
        console.error('Error updating booking:', error);
        showToast('حدث خطأ', 'error');
    }
}

// الإعلانات
async function loadAnnouncements() {
    try {
        const { data: announcements, error } = await supabase
            .from('announcements')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('announcementsList');
        
        if (announcements && announcements.length > 0) {
            container.innerHTML = announcements.map(a => `
                <div class="glass-card announcement" style="margin-bottom: 15px;">
                    <span class="announcement-badge">${getAnnouncementEmoji(a.type)} ${getAnnouncementText(a.type)}</span>
                    <h3 class="announcement-title">${a.title}</h3>
                    <p class="announcement-text">${a.content}</p>
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button onclick="toggleAnnouncement(${a.id}, ${!a.is_active})" class="btn-outline" style="padding: 8px 20px; font-size: 13px;">
                            ${a.is_active ? 'إيقاف' : 'تشغيل'}
                        </button>
                        <button onclick="deleteAnnouncement(${a.id})" class="btn-danger" style="padding: 8px 20px; font-size: 13px;">
                            حذف
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="color: #64748B;">لا توجد إعلانات</p>';
        }
        
    } catch (error) {
        console.error('Error loading announcements:', error);
    }
}

// الإعدادات
async function loadSettings() {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('*')
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (settings) {
            document.getElementById('dayPrice').value = settings.day_price;
            document.getElementById('nightPrice').value = settings.night_price;
            document.getElementById('nightStart').value = settings.night_start;
            document.getElementById('openTime').value = settings.open_time;
            document.getElementById('closeTime').value = settings.close_time;
            document.getElementById('reminderTime').value = settings.reminder_time;
            document.getElementById('bookingsEnabled').value = String(settings.bookings_enabled);
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// حفظ الإعدادات
async function saveSettings() {
    const settings = {
        day_price: parseInt(document.getElementById('dayPrice').value),
        night_price: parseInt(document.getElementById('nightPrice').value),
        night_start: document.getElementById('nightStart').value,
        open_time: document.getElementById('openTime').value,
        close_time: document.getElementById('closeTime').value,
        reminder_time: parseInt(document.getElementById('reminderTime').value),
        bookings_enabled: document.getElementById('bookingsEnabled').value === 'true'
    };
    
    try {
        const { error } = await supabase
            .from('settings')
            .upsert(settings);
        
        if (error) throw error;
        
        showToast('تم حفظ الإعدادات ✅');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('حدث خطأ في الحفظ', 'error');
    }
}

// الإشعارات
async function loadNotifications() {
    try {
        const { data: notifications, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        
        if (error) throw error;
        
        const container = document.getElementById('notificationsList');
        
        if (notifications && notifications.length > 0) {
            container.innerHTML = notifications.map(n => `
                <div class="glass-card notification-item">
                    <div class="notification-icon ${getNotificationIconClass(n.type)}">
                        ${getNotificationEmoji(n.type)}
                    </div>
                    <div>
                        <p class="notification-text">${n.message}</p>
                        <p class="notification-time">${formatDate(n.created_at)}</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="color: #64748B;">لا توجد إشعارات</p>';
        }
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// التقارير
async function loadReports() {
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*');
        
        if (error) throw error;
        
        document.getElementById('totalBookings').textContent = bookings?.length || 0;
        
        const revenue = bookings?.reduce((sum, b) => 
            b.status === 'confirmed' ? sum + b.price : sum, 0
        ) || 0;
        document.getElementById('totalRevenue2').textContent = revenue;
        
        document.getElementById('cancelledTotal').textContent = 
            bookings?.filter(b => b.status === 'cancelled').length || 0;
        
        document.getElementById('weeklyTotal').textContent = 
            bookings?.filter(b => b.booking_type === 'weekly').length || 0;
        
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Helper Functions
function getStatusText(status) {
    const texts = {
        'pending': 'معلق',
        'confirmed': 'مؤكد',
        'cancelled': 'ملغي'
    };
    return texts[status] || status;
}

function getAnnouncementEmoji(type) {
    const emojis = {
        'league': '🏆',
        'maintenance': '🔧',
        'general': '📢',
        'important': '⚠️',
        'event': '🎉'
    };
    return emojis[type] || '📢';
}

function getAnnouncementText(type) {
    const texts = {
        'league': 'دوري',
        'maintenance': 'صيانة',
        'general': 'إعلان عام',
        'important': 'تنبيه مهم',
        'event': 'فعالية'
    };
    return texts[type] || 'إعلان';
}

function getNotificationEmoji(type) {
    const emojis = {
        'new_booking': '📅',
        'cancelled_booking': '❌',
        'slot_available': '🔓'
    };
    return emojis[type] || '🔔';
}

function getNotificationIconClass(type) {
    const classes = {
        'new_booking': 'success',
        'cancelled_booking': 'danger',
        'slot_available': 'info'
    };
    return classes[type] || 'info';
          }
