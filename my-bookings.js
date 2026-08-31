// ========== My Bookings Page Logic ==========

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBookings');
    
    searchBtn.addEventListener('click', searchBookings);
    
    // البحث عند الضغط على Enter
    document.getElementById('phone').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBookings();
        }
    });
});

async function searchBookings() {
    const phone = document.getElementById('phone').value;
    
    if (!phone || !phone.match(/^01[0-9]{9}$/)) {
        showToast('اكتب رقم موبايل صحيح', 'error');
        return;
    }
    
    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('phone', phone)
            .order('booking_date', { ascending: false });
        
        if (error) throw error;
        
        if (!bookings || bookings.length === 0) {
            showToast('لا توجد حجوزات لهذا الرقم', 'error');
            document.getElementById('upcomingContainer').innerHTML = '';
            document.getElementById('pastContainer').innerHTML = '';
            return;
        }
        
        // تقسيم الحجوزات إلى قادمة وسابقة
        const now = new Date();
        const upcoming = bookings.filter(b => new Date(b.booking_date + 'T' + b.start_time) >= now && b.status !== 'cancelled');
        const past = bookings.filter(b => new Date(b.booking_date + 'T' + b.start_time) < now || b.status === 'cancelled');
        
        displayUpcoming(upcoming);
        displayPast(past);
        
    } catch (error) {
        console.error('Error searching bookings:', error);
        showToast('حدث خطأ في البحث', 'error');
    }
}

function displayUpcoming(bookings) {
    const container = document.getElementById('upcomingContainer');
    
    if (bookings.length === 0) {
        container.innerHTML = '<p style="color: #64748B;">لا توجد حجوزات قادمة</p>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="glass-card" style="padding: 25px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h4 style="font-size: 18px; margin-bottom: 10px;">📅 ${formatDate(booking.booking_date)}</h4>
                    <p style="color: #94A3B8;">🕐 ${booking.start_time} — ${booking.duration} دقيقة</p>
                    <p style="color: #94A3B8;">💰 ${booking.price} ج.م</p>
                    <p style="color: #94A3B8;">📋 ${booking.booking_type === 'weekly' ? 'حجز أسبوعي' : 'حجز عادي'}</p>
                </div>
                <div style="text-align: left;">
                    <span class="status-badge status-${booking.status}">
                        ${getStatusText(booking.status)}
                    </span>
                    <br><br>
                    <button onclick="shareBooking(${JSON.stringify(booking).replace(/"/g, '&quot;')})" 
                            class="btn-outline" style="padding: 8px 20px; font-size: 14px;">
                        📱 مشاركة
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function displayPast(bookings) {
    const container = document.getElementById('pastContainer');
    
    if (bookings.length === 0) {
        container.innerHTML = '<p style="color: #64748B;">لا توجد حجوزات سابقة</p>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="glass-card" style="padding: 25px; margin-bottom: 15px; opacity: 0.7;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
                <div>
                    <h4 style="font-size: 18px; margin-bottom: 10px;">📅 ${formatDate(booking.booking_date)}</h4>
                    <p style="color: #94A3B8;">🕐 ${booking.start_time} — ${booking.duration} دقيقة</p>
                    <p style="color: #94A3B8;">💰 ${booking.price} ج.م</p>
                </div>
                <span class="status-badge status-${booking.status}">
                    ${getStatusText(booking.status)}
                </span>
            </div>
        </div>
    `).join('');
}

function getStatusText(status) {
    const texts = {
        'pending': 'معلق',
        'confirmed': 'مؤكد',
        'cancelled': 'ملغي'
    };
    return texts[status] || status;
}

function shareBooking(booking) {
    const message = `⚽ حجزي في ملعب العزيمة 14\n\n📅 التاريخ: ${formatDate(booking.booking_date)}\n🕐 الوقت: ${booking.start_time}\n⏱️ المدة: ${booking.duration} دقيقة\n💰 السعر: ${booking.price} ج.م`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}
