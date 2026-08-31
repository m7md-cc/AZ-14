// ========== Supabase Configuration ==========

const SUPABASE_URL = 'https://dypwgpjzlbtpkxxxmvsj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5cHdncGp6bGJ0cGt4eHhtdnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjAyODAsImV4cCI6MjEwMzUzNjI4MH0.W_sdRo8UfopW79rAMpayp-EhitGYlFLHbVz1FJIsPYI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== Helper Functions ==========

// تنسيق التاريخ
function formatDate(date) {
    return new Date(date).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// تنسيق الوقت
function formatTime(time) {
    return new Date(time).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// حساب السعر
function calculatePrice(startTime, duration) {
    const hour = parseInt(startTime.split(':')[0]);
    const minutes = parseInt(startTime.split(':')[1]);
    const totalMinutes = hour * 60 + minutes;
    const nightStart = 19 * 60 + 30; // 19:30
    
    let pricePerHour;
    if (totalMinutes >= nightStart || totalMinutes < 17 * 60) {
        pricePerHour = 80; // ليلي
    } else {
        pricePerHour = 70; // نهاري
    }
    
    const hours = duration / 60;
    return pricePerHour * hours;
}

// عرض Toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}
