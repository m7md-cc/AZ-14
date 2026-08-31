// ========== Main Page Logic ==========

document.addEventListener('DOMContentLoaded', () => {
    loadAnnouncements();
    setupMobileMenu();
});

// تحميل الإعلانات
async function loadAnnouncements() {
    const container = document.getElementById('announcementsContainer');
    
    try {
        const { data: announcements, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('is_active', true)
            .gte('end_date', new Date().toISOString())
            .lte('start_date', new Date().toISOString())
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (announcements && announcements.length > 0) {
            container.innerHTML = announcements.map(ann => `
                <div class="glass-card announcement">
                    <span class="announcement-badge ${getBadgeClass(ann.type)}">
                        ${getBadgeEmoji(ann.type)} ${getBadgeText(ann.type)}
                    </span>
                    <h3 class="announcement-title">${ann.title}</h3>
                    <p class="announcement-text">${ann.content}</p>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="glass-card" style="padding: 40px; text-align: center;">
                    <p style="color: #64748B; font-size: 18px;">لا توجد إعلانات حالية</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading announcements:', error);
        container.innerHTML = `
            <div class="glass-card" style="padding: 40px; text-align: center;">
                <p style="color: #64748B; font-size: 18px;">لا توجد إعلانات حالية</p>
            </div>
        `;
    }
}

function getBadgeEmoji(type) {
    const emojis = {
        'league': '🏆',
        'maintenance': '🔧',
        'general': '📢',
        'important': '⚠️',
        'event': '🎉'
    };
    return emojis[type] || '📢';
}

function getBadgeText(type) {
    const texts = {
        'league': 'دوري',
        'maintenance': 'صيانة',
        'general': 'إعلان عام',
        'important': 'تنبيه مهم',
        'event': 'فعالية'
    };
    return texts[type] || 'إعلان';
}

function getBadgeClass(type) {
    const classes = {
        'league': '',
        'maintenance': 'info',
        'general': '',
        'important': 'danger',
        'event': 'warning'
    };
    return classes[type] || '';
}

// قائمة الموبايل
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const nav = document.getElementById('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('open');
        });
    }
}
