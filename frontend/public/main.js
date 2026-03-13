// ===== TELEGRAM INTEGRATION =====
// This MUST be at the very top of main.js

// ===== RAILWAY BACKEND URL =====
// DEFINE THIS FIRST BEFORE ANY FUNCTIONS THAT USE IT!
const RAILWAY_URL = 'https://ramadan-production-8799.up.railway.app';

// At the VERY TOP of your file (after RAILWAY_URL)
console.log('🚀 main.js loaded');
console.log('RAILWAY_URL:', RAILWAY_URL);

// Initialize Telegram Web App
let tg = window.Telegram?.WebApp;
let telegramUser = null;

if (tg) {
    tg.expand(); // Expand to full height
    tg.ready(); // Notify Telegram that app is ready
    
    if (tg.initDataUnsafe?.user) {
        telegramUser = tg.initDataUnsafe.user;
        console.log('Telegram user detected:', telegramUser);
        
        // Store in localStorage
        localStorage.setItem('telegram_user', JSON.stringify({
            id: telegramUser.id,
            username: telegramUser.username || `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name || ''
        }));
        
        // Check if user already has a name
        const existingName = localStorage.getItem('user_display_name');
        if (!existingName) {
            // Show name modal after a short delay
            setTimeout(() => {
                showNameModal();
            }, 500);
        }
    }
} else {
    console.log('Not running in Telegram');
}

// ===== TELEGRAM MODAL FUNCTIONS (MOVED FROM HTML) =====

// Show name modal
function showNameModal() {
    const modal = document.getElementById('nameModal');
    const user = JSON.parse(localStorage.getItem('telegram_user') || '{}');
    const input = document.getElementById('telegramNameInput');
    if (input) input.value = user.username || '';
    if (modal) modal.style.display = 'flex';
    console.log('📝 Name modal shown');
}

// Close name modal
function closeNameModal() {
    const modal = document.getElementById('nameModal');
    if (modal) modal.style.display = 'none';
    console.log('📝 Name modal closed');
}

// Save telegram name
async function saveTelegramName() {
    const input = document.getElementById('telegramNameInput');
    const name = input?.value.trim();
    
    if (!name) {
        alert('Iltimos, ismingizni kiriting');
        return;
    }
    
    // Save locally
    localStorage.setItem('user_display_name', name);
    console.log('✅ Name saved:', name);
    closeNameModal();
    
    // Register with backend
    const user = JSON.parse(localStorage.getItem('telegram_user') || '{}');
    
    try {
        const response = await fetch(`${RAILWAY_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: user.id,
                name: name
            })
        });
        
        if (response.ok) {
            console.log('✅ User registered successfully');
            // Join all leaderboards automatically
            await joinAllLeaderboards(name, user.id);
            // Load leaderboards
            if (typeof loadLeaderboards === 'function') loadLeaderboards();
        } else {
            console.error('❌ Registration failed');
            if (typeof renderLocalLeaderboards === 'function') renderLocalLeaderboards();
        }
    } catch (err) {
        console.error('❌ Registration error:', err);
        if (typeof renderLocalLeaderboards === 'function') renderLocalLeaderboards();
    }
}

// Join all leaderboards function
async function joinAllLeaderboards(name, telegramId) {
    const types = ['quran', 'dhikr', 'sadaqa'];
    
    for (const type of types) {
        try {
            await fetch(`${RAILWAY_URL}/api/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: telegramId,
                    name: name,
                    type: type,
                    value: 0
                })
            });
        } catch (err) {
            console.error(`Error joining ${type} leaderboard:`, err);
        }
    }
}


// Name Modal Functions
function showNameModal() {
    const modal = document.getElementById('nameModal');
    if (!modal) {
        console.error('Name modal not found in DOM');
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('telegram_user') || '{}');
    const input = document.getElementById('telegramNameInput');
    
    if (input) {
        // Pre-fill with Telegram username
        input.value = user.username || user.first_name || '';
    }
    
    modal.style.display = 'flex';
}

function closeNameModal() {
    const modal = document.getElementById('nameModal');
    if (modal) modal.style.display = 'none';
}

async function saveTelegramName() {
    const input = document.getElementById('telegramNameInput');
    const name = input?.value.trim();
    
    if (!name) {
        alert('Iltimos, ismingizni kiriting');
        return;
    }
    
    // Save locally
    localStorage.setItem('user_display_name', name);
    
    // Get Telegram user
    const user = JSON.parse(localStorage.getItem('telegram_user') || '{}');
    
    // Register with backend
    try {
        const response = await fetch(`${RAILWAY_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: user.id,
                name: name
            })
        });
        
        if (response.ok) {
            console.log('User registered successfully');
            closeNameModal();
            
            // Join all leaderboards automatically
            await joinAllLeaderboards(name, user.id);
            
            // Load leaderboards
            loadLeaderboards();
        } else {
            console.error('Registration failed');
            // Still close modal and use local
            closeNameModal();
            renderLocalLeaderboards();
        }
    } catch (err) {
        console.error('Registration error:', err);
        closeNameModal();
        renderLocalLeaderboards();
    }
}

async function joinAllLeaderboards(name, telegramId) {
    // Initialize user in all leaderboards with zero scores
    const types = ['quran', 'dhikr', 'sadaqa'];
    
    for (const type of types) {
        try {
            await fetch(`${RAILWAY_URL}/api/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: telegramId,
                    name: name,
                    type: type,
                    value: 0
                })
            });
        } catch (err) {
            console.error(`Error joining ${type} leaderboard:`, err);
        }
    }
}

// ═══════════════ DATA ═══════════════
const RAMADAN_DAYS = 30;
const RAMADAN_START = '2026-02-19'; // Ramadan 1 (Toshkent)
const QURAN_TOTAL_PAGES = 604;
const QURAN_PAGES_PER_JUZ = 20;

const TASHKENT_TIMES = [
    // FEBRUARY 2026
    { date: "2026-02-18", day: "Chorshanba", shabon: 29, tong: "05:55", quyosh: "07:14", peshin: "12:37", asr: "16:17", shom: "18:03", xufton: "19:19" },
    { date: "2026-02-19", day: "Payshanba", ramadan: 1, tong: "05:54", quyosh: "07:13", peshin: "12:37", asr: "16:19", shom: "18:05", xufton: "19:20" },
    { date: "2026-02-20", day: "Juma", ramadan: 2, tong: "05:53", quyosh: "07:11", peshin: "12:37", asr: "16:20", shom: "18:06", xufton: "19:22" },
    { date: "2026-02-21", day: "Shanba", ramadan: 3, tong: "05:51", quyosh: "07:10", peshin: "12:37", asr: "16:21", shom: "18:07", xufton: "19:23" },
    { date: "2026-02-22", day: "Yakshanba", ramadan: 4, tong: "05:50", quyosh: "07:09", peshin: "12:37", asr: "16:22", shom: "18:08", xufton: "19:24" },
    { date: "2026-02-23", day: "Dushanba", ramadan: 5, tong: "05:48", quyosh: "07:07", peshin: "12:36", asr: "16:23", shom: "18:09", xufton: "19:25" },
    { date: "2026-02-24", day: "Seshanba", ramadan: 6, tong: "05:47", quyosh: "07:06", peshin: "12:36", asr: "16:24", shom: "18:11", xufton: "19:26" },
    { date: "2026-02-25", day: "Chorshanba", ramadan: 7, tong: "05:46", quyosh: "07:04", peshin: "12:36", asr: "16:25", shom: "18:12", xufton: "19:27" },
    { date: "2026-02-26", day: "Payshanba", ramadan: 8, tong: "05:44", quyosh: "07:03", peshin: "12:36", asr: "16:26", shom: "18:13", xufton: "19:28" },
    { date: "2026-02-27", day: "Juma", ramadan: 9, tong: "05:43", quyosh: "07:01", peshin: "12:36", asr: "16:27", shom: "18:14", xufton: "19:30" },
    { date: "2026-02-28", day: "Shanba", ramadan: 10, tong: "05:41", quyosh: "07:00", peshin: "12:36", asr: "16:28", shom: "18:15", xufton: "19:31" },
    // MARCH 2026
    { date: "2026-03-01", day: "Yakshanba", ramadan: 11, tong: "05:40", quyosh: "06:58", peshin: "12:35", asr: "16:29", shom: "18:16", xufton: "19:32" },
    { date: "2026-03-02", day: "Dushanba", ramadan: 12, tong: "05:38", quyosh: "06:56", peshin: "12:35", asr: "16:30", shom: "18:18", xufton: "19:33" },
    { date: "2026-03-03", day: "Seshanba", ramadan: 13, tong: "05:37", quyosh: "06:55", peshin: "12:35", asr: "16:31", shom: "18:19", xufton: "19:34" },
    { date: "2026-03-04", day: "Chorshanba", ramadan: 14, tong: "05:35", quyosh: "06:53", peshin: "12:35", asr: "16:32", shom: "18:20", xufton: "19:35" },
    { date: "2026-03-05", day: "Payshanba", ramadan: 15, tong: "05:34", quyosh: "06:52", peshin: "12:35", asr: "16:33", shom: "18:21", xufton: "19:36" },
    { date: "2026-03-06", day: "Juma", ramadan: 16, tong: "05:32", quyosh: "06:50", peshin: "12:34", asr: "16:34", shom: "18:22", xufton: "19:37" },
    { date: "2026-03-07", day: "Shanba", ramadan: 17, tong: "05:30", quyosh: "06:48", peshin: "12:34", asr: "16:35", shom: "18:23", xufton: "19:39" },
    { date: "2026-03-08", day: "Yakshanba", ramadan: 18, tong: "05:29", quyosh: "06:47", peshin: "12:34", asr: "16:36", shom: "18:24", xufton: "19:40" },
    { date: "2026-03-09", day: "Dushanba", ramadan: 19, tong: "05:27", quyosh: "06:45", peshin: "12:34", asr: "16:37", shom: "18:26", xufton: "19:41" },
    { date: "2026-03-10", day: "Seshanba", ramadan: 20, tong: "05:25", quyosh: "06:44", peshin: "12:33", asr: "16:38", shom: "18:27", xufton: "19:42" },
    { date: "2026-03-11", day: "Chorshanba", ramadan: 21, tong: "05:24", quyosh: "06:42", peshin: "12:33", asr: "16:39", shom: "18:28", xufton: "19:43" },
    { date: "2026-03-12", day: "Payshanba", ramadan: 22, tong: "05:22", quyosh: "06:40", peshin: "12:33", asr: "16:40", shom: "18:29", xufton: "19:44" },
    { date: "2026-03-13", day: "Juma", ramadan: 23, tong: "05:20", quyosh: "06:39", peshin: "12:33", asr: "16:41", shom: "18:30", xufton: "19:46" },
    { date: "2026-03-14", day: "Shanba", ramadan: 24, tong: "05:19", quyosh: "06:37", peshin: "12:32", asr: "16:42", shom: "18:31", xufton: "19:47" },
    { date: "2026-03-15", day: "Yakshanba", ramadan: 25, tong: "05:17", quyosh: "06:35", peshin: "12:32", asr: "16:42", shom: "18:32", xufton: "19:48" },
    { date: "2026-03-16", day: "Dushanba", ramadan: 26, tong: "05:15", quyosh: "06:34", peshin: "12:32", asr: "16:43", shom: "18:33", xufton: "19:49" },
    { date: "2026-03-17", day: "Seshanba", ramadan: 27, tong: "05:13", quyosh: "06:32", peshin: "12:31", asr: "16:44", shom: "18:35", xufton: "19:50" },
    { date: "2026-03-18", day: "Chorshanba", ramadan: 28, tong: "05:12", quyosh: "06:30", peshin: "12:31", asr: "16:45", shom: "18:36", xufton: "19:51" },
    { date: "2026-03-19", day: "Payshanba", ramadan: 29, tong: "05:10", quyosh: "06:29", peshin: "12:31", asr: "16:46", shom: "18:37", xufton: "19:53" },
    { date: "2026-03-20", day: "Juma", ramadan: 30, tong: "05:08", quyosh: "06:27", peshin: "12:31", asr: "16:47", shom: "18:38", xufton: "19:54" }
];

const KOKAND_TIMES = [
    // FEBRUARY 2026
    { date: "2026-02-18", day: "Chorshanba", shabon: 29, tong: "05:48", quyosh: "07:06", peshin: "12:30", asr: "16:12", shom: "17:58", xufton: "19:13" },
    { date: "2026-02-19", day: "Payshanba", ramadan: 1, tong: "05:47", quyosh: "07:05", peshin: "12:30", asr: "16:13", shom: "17:59", xufton: "19:14" },
    { date: "2026-02-20", day: "Juma", ramadan: 2, tong: "05:46", quyosh: "07:04", peshin: "12:30", asr: "16:14", shom: "18:00", xufton: "19:15" },
    { date: "2026-02-21", day: "Shanba", ramadan: 3, tong: "05:44", quyosh: "07:02", peshin: "12:30", asr: "16:15", shom: "18:01", xufton: "19:16" },
    { date: "2026-02-22", day: "Yakshanba", ramadan: 4, tong: "05:43", quyosh: "07:01", peshin: "12:30", asr: "16:16", shom: "18:02", xufton: "19:17" },
    { date: "2026-02-23", day: "Dushanba", ramadan: 5, tong: "05:42", quyosh: "06:59", peshin: "12:30", asr: "16:17", shom: "18:03", xufton: "19:18" },
    { date: "2026-02-24", day: "Seshanba", ramadan: 6, tong: "05:40", quyosh: "06:58", peshin: "12:29", asr: "16:19", shom: "18:05", xufton: "19:19" },
    { date: "2026-02-25", day: "Chorshanba", ramadan: 7, tong: "05:39", quyosh: "06:57", peshin: "12:29", asr: "16:20", shom: "18:06", xufton: "19:20" },
    { date: "2026-02-26", day: "Payshanba", ramadan: 8, tong: "05:38", quyosh: "06:55", peshin: "12:29", asr: "16:21", shom: "18:07", xufton: "19:21" },
    { date: "2026-02-27", day: "Juma", ramadan: 9, tong: "05:36", quyosh: "06:54", peshin: "12:29", asr: "16:22", shom: "18:08", xufton: "19:23" },
    { date: "2026-02-28", day: "Shanba", ramadan: 10, tong: "05:35", quyosh: "06:52", peshin: "12:29", asr: "16:23", shom: "18:09", xufton: "19:24" },
    // MARCH 2026
    { date: "2026-03-01", day: "Yakshanba", ramadan: 11, tong: "05:33", quyosh: "06:51", peshin: "12:29", asr: "16:24", shom: "18:10", xufton: "19:25" },
    { date: "2026-03-02", day: "Dushanba", ramadan: 12, tong: "05:32", quyosh: "06:49", peshin: "12:28", asr: "16:25", shom: "18:11", xufton: "19:26" },
    { date: "2026-03-03", day: "Seshanba", ramadan: 13, tong: "05:30", quyosh: "06:48", peshin: "12:28", asr: "16:25", shom: "18:13", xufton: "19:27" },
    { date: "2026-03-04", day: "Chorshanba", ramadan: 14, tong: "05:29", quyosh: "06:46", peshin: "12:28", asr: "16:26", shom: "18:14", xufton: "19:28" },
    { date: "2026-03-05", day: "Payshanba", ramadan: 15, tong: "05:27", quyosh: "06:44", peshin: "12:28", asr: "16:27", shom: "18:15", xufton: "19:29" },
    { date: "2026-03-06", day: "Juma", ramadan: 16, tong: "05:26", quyosh: "06:43", peshin: "12:28", asr: "16:28", shom: "18:16", xufton: "19:30" },
    { date: "2026-03-07", day: "Shanba", ramadan: 17, tong: "05:24", quyosh: "06:41", peshin: "12:27", asr: "16:29", shom: "18:17", xufton: "19:31" },
    { date: "2026-03-08", day: "Yakshanba", ramadan: 18, tong: "05:22", quyosh: "06:40", peshin: "12:27", asr: "16:30", shom: "18:18", xufton: "19:32" },
    { date: "2026-03-09", day: "Dushanba", ramadan: 19, tong: "05:21", quyosh: "06:38", peshin: "12:27", asr: "16:31", shom: "18:19", xufton: "19:34" },
    { date: "2026-03-10", day: "Seshanba", ramadan: 20, tong: "05:19", quyosh: "06:36", peshin: "12:27", asr: "16:32", shom: "18:20", xufton: "19:35" },
    { date: "2026-03-11", day: "Chorshanba", ramadan: 21, tong: "05:18", quyosh: "06:35", peshin: "12:26", asr: "16:33", shom: "18:21", xufton: "19:36" },
    { date: "2026-03-12", day: "Payshanba", ramadan: 22, tong: "05:16", quyosh: "06:33", peshin: "12:26", asr: "16:34", shom: "18:22", xufton: "19:37" },
    { date: "2026-03-13", day: "Juma", ramadan: 23, tong: "05:14", quyosh: "06:32", peshin: "12:26", asr: "16:35", shom: "18:24", xufton: "19:38" },
    { date: "2026-03-14", day: "Shanba", ramadan: 24, tong: "05:13", quyosh: "06:30", peshin: "12:25", asr: "16:35", shom: "18:25", xufton: "19:39" },
    { date: "2026-03-15", day: "Yakshanba", ramadan: 25, tong: "05:11", quyosh: "06:28", peshin: "12:25", asr: "16:36", shom: "18:26", xufton: "19:40" },
    { date: "2026-03-16", day: "Dushanba", ramadan: 26, tong: "05:09", quyosh: "06:27", peshin: "12:25", asr: "16:37", shom: "18:27", xufton: "19:41" },
    { date: "2026-03-17", day: "Seshanba", ramadan: 27, tong: "05:08", quyosh: "06:25", peshin: "12:25", asr: "16:38", shom: "18:28", xufton: "19:43" },
    { date: "2026-03-18", day: "Chorshanba", ramadan: 28, tong: "05:06", quyosh: "06:24", peshin: "12:24", asr: "16:39", shom: "18:29", xufton: "19:44" },
    { date: "2026-03-19", day: "Payshanba", ramadan: 29, tong: "05:04", quyosh: "06:22", peshin: "12:24", asr: "16:40", shom: "18:30", xufton: "19:45" },
    { date: "2026-03-20", day: "Juma", ramadan: 30, tong: "05:02", quyosh: "06:20", peshin: "12:24", asr: "16:40", shom: "18:31", xufton: "19:46" }
];

const ANDIJAN_TIMES = [
    // FEBRUARY 2026
    { date: "2026-02-18", day: "Chorshanba", shabon: 29, tong: "05:43", quyosh: "07:01", peshin: "12:25", asr: "16:06", shom: "17:52", xufton: "19:07" },
    { date: "2026-02-19", day: "Payshanba", ramadan: 1, tong: "05:41", quyosh: "07:00", peshin: "12:25", asr: "16:07", shom: "17:53", xufton: "19:08" },
    { date: "2026-02-20", day: "Juma", ramadan: 2, tong: "05:40", quyosh: "06:58", peshin: "12:24", asr: "16:08", shom: "17:54", xufton: "19:09" },
    { date: "2026-02-21", day: "Shanba", ramadan: 3, tong: "05:39", quyosh: "06:57", peshin: "12:24", asr: "16:09", shom: "17:55", xufton: "19:10" },
    { date: "2026-02-22", day: "Yakshanba", ramadan: 4, tong: "05:37", quyosh: "06:56", peshin: "12:24", asr: "16:10", shom: "17:56", xufton: "19:12" },
    { date: "2026-02-23", day: "Dushanba", ramadan: 5, tong: "05:36", quyosh: "06:54", peshin: "12:24", asr: "16:11", shom: "17:58", xufton: "19:13" },
    { date: "2026-02-24", day: "Seshanba", ramadan: 6, tong: "05:35", quyosh: "06:53", peshin: "12:24", asr: "16:13", shom: "17:59", xufton: "19:14" },
    { date: "2026-02-25", day: "Chorshanba", ramadan: 7, tong: "05:33", quyosh: "06:51", peshin: "12:24", asr: "16:14", shom: "18:00", xufton: "19:15" },
    { date: "2026-02-26", day: "Payshanba", ramadan: 8, tong: "05:32", quyosh: "06:50", peshin: "12:24", asr: "16:15", shom: "18:01", xufton: "19:16" },
    { date: "2026-02-27", day: "Juma", ramadan: 9, tong: "05:30", quyosh: "06:48", peshin: "12:23", asr: "16:16", shom: "18:02", xufton: "19:17" },
    { date: "2026-02-28", day: "Shanba", ramadan: 10, tong: "05:29", quyosh: "06:47", peshin: "12:23", asr: "16:17", shom: "18:03", xufton: "19:18" },
    // MARCH 2026
    { date: "2026-03-01", day: "Yakshanba", ramadan: 11, tong: "05:28", quyosh: "06:45", peshin: "12:23", asr: "16:18", shom: "18:05", xufton: "19:19" },
    { date: "2026-03-02", day: "Dushanba", ramadan: 12, tong: "05:26", quyosh: "06:44", peshin: "12:23", asr: "16:19", shom: "18:06", xufton: "19:20" },
    { date: "2026-03-03", day: "Seshanba", ramadan: 13, tong: "05:25", quyosh: "06:42", peshin: "12:23", asr: "16:20", shom: "18:07", xufton: "19:21" },
    { date: "2026-03-04", day: "Chorshanba", ramadan: 14, tong: "05:23", quyosh: "06:41", peshin: "12:22", asr: "16:21", shom: "18:08", xufton: "19:23" },
    { date: "2026-03-05", day: "Payshanba", ramadan: 15, tong: "05:21", quyosh: "06:39", peshin: "12:22", asr: "16:21", shom: "18:09", xufton: "19:24" },
    { date: "2026-03-06", day: "Juma", ramadan: 16, tong: "05:20", quyosh: "06:37", peshin: "12:22", asr: "16:22", shom: "18:10", xufton: "19:25" },
    { date: "2026-03-07", day: "Shanba", ramadan: 17, tong: "05:18", quyosh: "06:36", peshin: "12:22", asr: "16:23", shom: "18:11", xufton: "19:26" },
    { date: "2026-03-08", day: "Yakshanba", ramadan: 18, tong: "05:17", quyosh: "06:34", peshin: "12:21", asr: "16:24", shom: "18:12", xufton: "19:27" },
    { date: "2026-03-09", day: "Dushanba", ramadan: 19, tong: "05:15", quyosh: "06:33", peshin: "12:21", asr: "16:25", shom: "18:14", xufton: "19:28" },
    { date: "2026-03-10", day: "Seshanba", ramadan: 20, tong: "05:13", quyosh: "06:31", peshin: "12:21", asr: "16:26", shom: "18:15", xufton: "19:29" },
    { date: "2026-03-11", day: "Chorshanba", ramadan: 21, tong: "05:12", quyosh: "06:29", peshin: "12:21", asr: "16:27", shom: "18:16", xufton: "19:30" },
    { date: "2026-03-12", day: "Payshanba", ramadan: 22, tong: "05:10", quyosh: "06:28", peshin: "12:20", asr: "16:28", shom: "18:17", xufton: "19:32" },
    { date: "2026-03-13", day: "Juma", ramadan: 23, tong: "05:08", quyosh: "06:26", peshin: "12:20", asr: "16:29", shom: "18:18", xufton: "19:33" },
    { date: "2026-03-14", day: "Shanba", ramadan: 24, tong: "05:07", quyosh: "06:25", peshin: "12:20", asr: "16:30", shom: "18:19", xufton: "19:34" },
    { date: "2026-03-15", day: "Yakshanba", ramadan: 25, tong: "05:05", quyosh: "06:23", peshin: "12:20", asr: "16:30", shom: "18:20", xufton: "19:35" },
    { date: "2026-03-16", day: "Dushanba", ramadan: 26, tong: "05:03", quyosh: "06:21", peshin: "12:19", asr: "16:31", shom: "18:21", xufton: "19:36" },
    { date: "2026-03-17", day: "Seshanba", ramadan: 27, tong: "05:02", quyosh: "06:20", peshin: "12:19", asr: "16:32", shom: "18:22", xufton: "19:37" },
    { date: "2026-03-18", day: "Chorshanba", ramadan: 28, tong: "05:00", quyosh: "06:18", peshin: "12:19", asr: "16:33", shom: "18:23", xufton: "19:38" },
    { date: "2026-03-19", day: "Payshanba", ramadan: 29, tong: "04:58", quyosh: "06:16", peshin: "12:19", asr: "16:34", shom: "18:24", xufton: "19:40" },
    { date: "2026-03-20", day: "Juma", ramadan: 30, tong: "04:57", quyosh: "06:15", peshin: "12:18", asr: "16:35", shom: "18:25", xufton: "19:41" }
];

const SAMARKAND_TIMES = [
    // FEBRUARY 2026
    { date: "2026-02-18", day: "Chorshanba", shabon: 29, tong: "06:04", quyosh: "07:21", peshin: "12:46", asr: "16:30", shom: "18:15", xufton: "19:29" },
    { date: "2026-02-19", day: "Payshanba", ramadan: 1, tong: "06:03", quyosh: "07:20", peshin: "12:46", asr: "16:31", shom: "18:16", xufton: "19:30" },
    { date: "2026-02-20", day: "Juma", ramadan: 2, tong: "06:01", quyosh: "07:18", peshin: "12:46", asr: "16:32", shom: "18:17", xufton: "19:31" },
    { date: "2026-02-21", day: "Shanba", ramadan: 3, tong: "06:00", quyosh: "07:17", peshin: "12:46", asr: "16:33", shom: "18:18", xufton: "19:32" },
    { date: "2026-02-22", day: "Yakshanba", ramadan: 4, tong: "05:59", quyosh: "07:16", peshin: "12:46", asr: "16:34", shom: "18:19", xufton: "19:33" },
    { date: "2026-02-23", day: "Dushanba", ramadan: 5, tong: "05:58", quyosh: "07:14", peshin: "12:45", asr: "16:35", shom: "18:20", xufton: "19:34" },
    { date: "2026-02-24", day: "Seshanba", ramadan: 6, tong: "05:56", quyosh: "07:13", peshin: "12:45", asr: "16:36", shom: "18:21", xufton: "19:35" },
    { date: "2026-02-25", day: "Chorshanba", ramadan: 7, tong: "05:55", quyosh: "07:11", peshin: "12:45", asr: "16:37", shom: "18:22", xufton: "19:36" },
    { date: "2026-02-26", day: "Payshanba", ramadan: 8, tong: "05:53", quyosh: "07:10", peshin: "12:45", asr: "16:38", shom: "18:24", xufton: "19:37" },
    { date: "2026-02-27", day: "Juma", ramadan: 9, tong: "05:52", quyosh: "07:09", peshin: "12:45", asr: "16:39", shom: "18:25", xufton: "19:38" },
    { date: "2026-02-28", day: "Shanba", ramadan: 10, tong: "05:51", quyosh: "07:07", peshin: "12:45", asr: "16:40", shom: "18:26", xufton: "19:39" },
    // MARCH 2026
    { date: "2026-03-01", day: "Yakshanba", ramadan: 11, tong: "05:49", quyosh: "07:06", peshin: "12:44", asr: "16:41", shom: "18:27", xufton: "19:40" },
    { date: "2026-03-02", day: "Dushanba", ramadan: 12, tong: "05:48", quyosh: "07:04", peshin: "12:44", asr: "16:42", shom: "18:28", xufton: "19:41" },
    { date: "2026-03-03", day: "Seshanba", ramadan: 13, tong: "05:46", quyosh: "07:03", peshin: "12:44", asr: "16:43", shom: "18:29", xufton: "19:42" },
    { date: "2026-03-04", day: "Chorshanba", ramadan: 14, tong: "05:45", quyosh: "07:01", peshin: "12:44", asr: "16:43", shom: "18:30", xufton: "19:44" },
    { date: "2026-03-05", day: "Payshanba", ramadan: 15, tong: "05:43", quyosh: "07:00", peshin: "12:44", asr: "16:44", shom: "18:31", xufton: "19:45" },
    { date: "2026-03-06", day: "Juma", ramadan: 16, tong: "05:42", quyosh: "06:58", peshin: "12:43", asr: "16:45", shom: "18:32", xufton: "19:46" },
    { date: "2026-03-07", day: "Shanba", ramadan: 17, tong: "05:40", quyosh: "06:57", peshin: "12:43", asr: "16:46", shom: "18:33", xufton: "19:47" },
    { date: "2026-03-08", day: "Yakshanba", ramadan: 18, tong: "05:39", quyosh: "06:55", peshin: "12:43", asr: "16:47", shom: "18:34", xufton: "19:48" },
    { date: "2026-03-09", day: "Dushanba", ramadan: 19, tong: "05:37", quyosh: "06:54", peshin: "12:43", asr: "16:48", shom: "18:35", xufton: "19:49" },
    { date: "2026-03-10", day: "Seshanba", ramadan: 20, tong: "05:36", quyosh: "06:52", peshin: "12:42", asr: "16:49", shom: "18:37", xufton: "19:50" },
    { date: "2026-03-11", day: "Chorshanba", ramadan: 21, tong: "05:34", quyosh: "06:50", peshin: "12:42", asr: "16:50", shom: "18:38", xufton: "19:51" },
    { date: "2026-03-12", day: "Payshanba", ramadan: 22, tong: "05:32", quyosh: "06:49", peshin: "12:42", asr: "16:50", shom: "18:39", xufton: "19:52" },
    { date: "2026-03-13", day: "Juma", ramadan: 23, tong: "05:31", quyosh: "06:47", peshin: "12:42", asr: "16:51", shom: "18:40", xufton: "19:53" },
    { date: "2026-03-14", day: "Shanba", ramadan: 24, tong: "05:29", quyosh: "06:46", peshin: "12:41", asr: "16:52", shom: "18:41", xufton: "19:54" },
    { date: "2026-03-15", day: "Yakshanba", ramadan: 25, tong: "05:28", quyosh: "06:44", peshin: "12:41", asr: "16:53", shom: "18:42", xufton: "19:55" },
    { date: "2026-03-16", day: "Dushanba", ramadan: 26, tong: "05:26", quyosh: "06:42", peshin: "12:41", asr: "16:54", shom: "18:43", xufton: "19:56" },
    { date: "2026-03-17", day: "Seshanba", ramadan: 27, tong: "05:24", quyosh: "06:41", peshin: "12:40", asr: "16:54", shom: "18:44", xufton: "19:57" },
    { date: "2026-03-18", day: "Chorshanba", ramadan: 28, tong: "05:23", quyosh: "06:39", peshin: "12:40", asr: "16:55", shom: "18:45", xufton: "19:59" },
    { date: "2026-03-19", day: "Payshanba", ramadan: 29, tong: "05:21", quyosh: "06:38", peshin: "12:40", asr: "16:56", shom: "18:46", xufton: "20:00" },
    { date: "2026-03-20", day: "Juma", ramadan: 30, tong: "05:19", quyosh: "06:36", peshin: "12:40", asr: "16:57", shom: "18:47", xufton: "20:01" }
];

const NAMANGAN_TIMES = [
    // FEBRUARY 2026
    { date: "2026-02-18", day: "Chorshanba", shabon: 29, tong: "05:46", quyosh: "07:04", peshin: "12:27", asr: "16:08", shom: "17:54", xufton: "19:10" },
    { date: "2026-02-19", day: "Payshanba", ramadan: 1, tong: "05:44", quyosh: "07:03", peshin: "12:27", asr: "16:10", shom: "17:55", xufton: "19:11" },
    { date: "2026-02-20", day: "Juma", ramadan: 2, tong: "05:43", quyosh: "07:01", peshin: "12:27", asr: "16:11", shom: "17:56", xufton: "19:12" },
    { date: "2026-02-21", day: "Shanba", ramadan: 3, tong: "05:42", quyosh: "07:00", peshin: "12:27", asr: "16:12", shom: "17:58", xufton: "19:13" },
    { date: "2026-02-22", day: "Yakshanba", ramadan: 4, tong: "05:40", quyosh: "06:59", peshin: "12:27", asr: "16:13", shom: "17:59", xufton: "19:14" },
    { date: "2026-02-23", day: "Dushanba", ramadan: 5, tong: "05:39", quyosh: "06:57", peshin: "12:27", asr: "16:14", shom: "18:00", xufton: "19:15" },
    { date: "2026-02-24", day: "Seshanba", ramadan: 6, tong: "05:37", quyosh: "06:56", peshin: "12:27", asr: "16:15", shom: "18:01", xufton: "19:16" },
    { date: "2026-02-25", day: "Chorshanba", ramadan: 7, tong: "05:36", quyosh: "06:54", peshin: "12:26", asr: "16:16", shom: "18:02", xufton: "19:18" },
    { date: "2026-02-26", day: "Payshanba", ramadan: 8, tong: "05:35", quyosh: "06:53", peshin: "12:26", asr: "16:17", shom: "18:04", xufton: "19:19" },
    { date: "2026-02-27", day: "Juma", ramadan: 9, tong: "05:33", quyosh: "06:51", peshin: "12:26", asr: "16:18", shom: "18:05", xufton: "19:20" },
    { date: "2026-02-28", day: "Shanba", ramadan: 10, tong: "05:32", quyosh: "06:50", peshin: "12:26", asr: "16:19", shom: "18:06", xufton: "19:21" },
    // MARCH 2026
    { date: "2026-03-01", day: "Yakshanba", ramadan: 11, tong: "05:30", quyosh: "06:48", peshin: "12:26", asr: "16:20", shom: "18:07", xufton: "19:22" },
    { date: "2026-03-02", day: "Dushanba", ramadan: 12, tong: "05:29", quyosh: "06:47", peshin: "12:26", asr: "16:21", shom: "18:08", xufton: "19:23" },
    { date: "2026-03-03", day: "Seshanba", ramadan: 13, tong: "05:27", quyosh: "06:45", peshin: "12:25", asr: "16:22", shom: "18:09", xufton: "19:24" },
    { date: "2026-03-04", day: "Chorshanba", ramadan: 14, tong: "05:26", quyosh: "06:43", peshin: "12:25", asr: "16:23", shom: "18:11", xufton: "19:25" },
    { date: "2026-03-05", day: "Payshanba", ramadan: 15, tong: "05:24", quyosh: "06:42", peshin: "12:25", asr: "16:24", shom: "18:12", xufton: "19:27" },
    { date: "2026-03-06", day: "Juma", ramadan: 16, tong: "05:22", quyosh: "06:40", peshin: "12:25", asr: "16:25", shom: "18:13", xufton: "19:28" },
    { date: "2026-03-07", day: "Shanba", ramadan: 17, tong: "05:21", quyosh: "06:39", peshin: "12:24", asr: "16:26", shom: "18:14", xufton: "19:29" },
    { date: "2026-03-08", day: "Yakshanba", ramadan: 18, tong: "05:19", quyosh: "06:37", peshin: "12:24", asr: "16:27", shom: "18:15", xufton: "19:30" },
    { date: "2026-03-09", day: "Dushanba", ramadan: 19, tong: "05:18", quyosh: "06:36", peshin: "12:24", asr: "16:28", shom: "18:16", xufton: "19:31" },
    { date: "2026-03-10", day: "Seshanba", ramadan: 20, tong: "05:16", quyosh: "06:34", peshin: "12:24", asr: "16:29", shom: "18:17", xufton: "19:32" },
    { date: "2026-03-11", day: "Chorshanba", ramadan: 21, tong: "05:14", quyosh: "06:32", peshin: "12:23", asr: "16:30", shom: "18:18", xufton: "19:33" },
    { date: "2026-03-12", day: "Payshanba", ramadan: 22, tong: "05:13", quyosh: "06:31", peshin: "12:23", asr: "16:30", shom: "18:19", xufton: "19:34" },
    { date: "2026-03-13", day: "Juma", ramadan: 23, tong: "05:11", quyosh: "06:29", peshin: "12:23", asr: "16:31", shom: "18:21", xufton: "19:36" },
    { date: "2026-03-14", day: "Shanba", ramadan: 24, tong: "05:09", quyosh: "06:27", peshin: "12:23", asr: "16:32", shom: "18:22", xufton: "19:37" },
    { date: "2026-03-15", day: "Yakshanba", ramadan: 25, tong: "05:08", quyosh: "06:26", peshin: "12:22", asr: "16:33", shom: "18:23", xufton: "19:38" },
    { date: "2026-03-16", day: "Dushanba", ramadan: 26, tong: "05:06", quyosh: "06:24", peshin: "12:22", asr: "16:34", shom: "18:24", xufton: "19:39" },
    { date: "2026-03-17", day: "Seshanba", ramadan: 27, tong: "05:04", quyosh: "06:22", peshin: "12:22", asr: "16:35", shom: "18:25", xufton: "19:40" },
    { date: "2026-03-18", day: "Chorshanba", ramadan: 28, tong: "05:02", quyosh: "06:21", peshin: "12:22", asr: "16:36", shom: "18:26", xufton: "19:41" },
    { date: "2026-03-19", day: "Payshanba", ramadan: 29, tong: "05:01", quyosh: "06:19", peshin: "12:21", asr: "16:36", shom: "18:27", xufton: "19:43" },
    { date: "2026-03-20", day: "Juma", ramadan: 30, tong: "04:59", quyosh: "06:17", peshin: "12:21", asr: "16:37", shom: "18:28", xufton: "19:44" }
];

const CITY_STORAGE_KEY = 'ramazon_city';

const CITY_TIMES = {
    Toshkent: TASHKENT_TIMES,
    Kokand: KOKAND_TIMES,
    Namangan: NAMANGAN_TIMES,
    Samarqand: SAMARKAND_TIMES,
    Andijon: ANDIJAN_TIMES,
};

const CITY_TIMES_BY_DATE = Object.fromEntries(
    Object.entries(CITY_TIMES).map(([city, rows]) => [city, Object.fromEntries(rows.map(r => [r.date, r]))])
);

const PRAYERS = [
    { key: 'bomdod', uz: 'Bomdod', ar: 'الفجر', farz: 2, sunnah: 2 },
    { key: 'peshin', uz: 'Peshin', ar: 'الظهر', farz: 4, sunnah: 4 },
    { key: 'asr', uz: 'Asr', ar: 'العصر', farz: 4, sunnah: 0 },
    { key: 'shom', uz: 'Shom', ar: 'المغرب', farz: 3, sunnah: 2 },
    { key: 'xufton', uz: 'Xufton', ar: 'العشاء', farz: 4, sunnah: 2 },
];

const DUAS = {
    sahar: {
        title: 'Saharlik Duosi',
        arabic: 'نَوَيْتُ أَنْ أَصُومَ صَوْمَ غَدٍ مِنْ شَهْرِ رَمَضَانَ',
        text: 'Navoitu an asouma savma gadin min shahri Ramazana'
    },
    iftar: {
        title: 'Iftorlik Duosi',
        arabic: 'اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَيْكَ تَوَكَّلْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
        text: 'Allohumma laka sumtu, va bika amantu, va alaika tavakkaltu, va ala rizqika aftartu'
    }
};

const TARAWEH_JUZ = [
    { date: "2026-02-18", day: "1-kun", text: '"Baqara" surasi 1-oyatidan 202-oyatigacha', pages: "30 sahifa" },
    { date: "2026-02-19", day: "2-kun", text: '"Baqara" surasi 203-oyatidan "Oli Imron" surasi 91-oyatigacha', pages: "30 sahifa" },
    { date: "2026-02-20", day: "3-kun", text: '"Oli Imron" surasi 92-oyatidan "Niso" surasi 86-oyatigacha', pages: "30 sahifa" },
    { date: "2026-02-21", day: "4-kun", text: '"Niso" surasi 87-oyatidan "Moida" surasi 82-oyatigacha', pages: "30 sahifa" },
    { date: "2026-02-22", day: "5-kun", text: '"Moida" surasi 83-oyatidan "A\'rof" surasi 11-oyatigacha', pages: "30 sahifa" },
    { date: "2026-02-23", day: "6-kun", text: '"A\'rof" surasi 12-oyatidan "Anfol" surasi 40-oyatigacha', pages: "30 sahifa" },
    { date: "2026-02-24", day: "7-kun", text: '"Anfol" surasi 41-oyatidan "Tavba" surasi 93-oyatigacha', pages: "20 sahifa" },
    { date: "2026-02-25", day: "8-kun", text: '"Tavba" surasi 94-oyatidan "Yunus" surasi 109-oyatigacha', pages: "20 sahifa" },
    { date: "2026-02-26", day: "9-kun", text: '"Hud" surasi 1-oyatidan "Yusuf" surasi 52-oyatigacha', pages: "20 sahifa" },
    { date: "2026-02-27", day: "10-kun", text: '"Yusuf" surasi 53-oyatidan "Ibrohim" surasi 52-oyatigacha', pages: "20 sahifa" },
    { date: "2026-02-28", day: "11-kun", text: '"Hijr" surasi 1-oyatidan "Nahl" surasi 128-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-01", day: "12-kun", text: '"Isro" surasi 1-oyatidan "Kahf" surasi 74-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-02", day: "13-kun", text: '"Kahf" surasi 75-oyatidan "Toha" surasi 135-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-03", day: "14-kun", text: '"Anbiyo" surasi 1-oyatidan "Haj" surasi 78-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-04", day: "15-kun", text: '"Mu\'minun" surasi 1-oyatidan "Furqon" surasi 20-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-05", day: "16-kun", text: '"Furqon" surasi 21-oyatidan "Naml" surasi 55-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-06", day: "17-kun", text: '"Naml" surasi 56-oyatidan "Ankabut" surasi 45-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-07", day: "18-kun", text: '"Ankabut" surasi 46-oyatidan "Ahzob" surasi 30-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-08", day: "19-kun", text: '"Ahzob" surasi 31-oyatidan "Yasin" surasi 27-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-09", day: "20-kun", text: '"Yasin" surasi 28-oyatidan "Zumar" surasi 31-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-10", day: "21-kun", text: '"Zumar" surasi 32-oyatidan "Fussilat" surasi 46-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-11", day: "22-kun", text: '"Fussilat" surasi 47-oyatidan "Josiya" surasi 37-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-12", day: "23-kun", text: '"Ahqof" surasi 1-oyatidan "Zoriyot" surasi 30-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-13", day: "24-kun", text: '"Zoriyot" surasi 31-oyatidan "Hadid" surasi 29-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-14", day: "25-kun", text: '"Mujodala" surasi 1-oyatidan "Tahrim" surasi 12-oyatigacha', pages: "20 sahifa" },
    { date: "2026-03-15", day: "26-kun", text: '"Mulk" surasi 1-oyatidan "Inshiqoq" surasi 25-oyatigacha', pages: "28 sahifa" },
    { date: "2026-03-16", day: "27-kun", text: '"Buruj" surasi 1-oyatidan "Nas" surasi 6-oyatigacha', pages: "15 sahifa" }
];

const TARAWEH_BY_DATE = Object.fromEntries(TARAWEH_JUZ.map(r => [r.date, r]));

// ═══════════════ STATE ═══════════════
let state = JSON.parse(localStorage.getItem('ramazon_state') || '{}');

function initState() {
    if (!state.fasting) state.fasting = {};
    if (!state.pageTotal) state.pageTotal = 0;
    if (!state.pageLog) state.pageLog = [];
    if (!state.charity) state.charity = [];
    if (!state.dhikrTotal) state.dhikrTotal = 0;
    if (!state.dhikrToday) state.dhikrToday = { date: '', count: 0, items: {} };
    if (!state.quranUsers) state.quranUsers = [
        { name: 'Ahmad', pages: 284 },
        { name: 'Zulfiya', pages: 210 },
        { name: 'Doniyor', pages: 180 },
    ];
    if (!state.dhikrUsers) state.dhikrUsers = [
        { name: 'Fatima', count: 3300 },
        { name: 'Sarvarbek', count: 2100 },
    ];
    if (!state.sadaqaUsers) state.sadaqaUsers = [
        { name: 'Nodira', amount: 500000 },
        { name: 'Jasur', amount: 200000 },
    ];
    if (!state.rakah) state.rakah = {};
    save();
}

function save() {
    localStorage.setItem('ramazon_state', JSON.stringify(state));
}

// ═══════════════ UTILITY FUNCTIONS ═══════════════
function getSelectedCity() {
    const city = localStorage.getItem(CITY_STORAGE_KEY);
    return city && CITY_TIMES[city] ? city : 'Toshkent';
}

function setSelectedCity(city) {
    if (CITY_TIMES[city]) localStorage.setItem(CITY_STORAGE_KEY, city);
}

function getTodayKey() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getRamadanStartDate() {
    return new Date(RAMADAN_START + 'T00:00:00');
}

function getRamadanEndKey() {
    const endKey = TASHKENT_TIMES.find(r => r.ramadan === 30)?.date;
    return endKey || '2026-03-20';
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function parseTimeToDate(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}

function formatCountdown(ms) {
    if (ms < 0) return '0s';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    if (h > 0) return `${h}s ${m}d`;
    if (m > 0) return `${m}d ${s}s`;
    return `${s}s`;
}

// ═══════════════ NAVIGATION ═══════════════
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');

    document.querySelectorAll('.nav-tabs button').forEach(b => b.classList.remove('active'));
    const btns = document.querySelectorAll('.nav-tabs button');
    const pages = ['home', 'namaz', 'quran', 'dhikr', 'sadaqa', 'roza'];
    const idx = pages.indexOf(name);
    if (btns[idx]) btns[idx].classList.add('active');

    document.querySelectorAll('.mobile-nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.mobile-nav button')[idx]?.classList.add('active');

    // Page specific initializations
    if (name === 'namaz') { 
        renderNamazHero(); 
        updateNamazStats(); 
        renderWeeklyGrid(); 
    }
    if (name === 'quran') { 
        renderQuranHero(); 
        renderQuranLog(); 
        loadLeaderboards(); 
    }
    if (name === 'dhikr') { 
        renderDhikrHero(); 
        renderDhikrStats(); 
    }
    if (name === 'sadaqa') { 
        renderSadaqaHero(); 
        renderCharity(); 
    }
    if (name === 'roza') { 
        renderRozaHero(); 
        generateRozaStars(); 
        renderCalendar(); 
    }
}

function showSubTab(page, tab) {
    const contents = document.querySelectorAll(`[id^="${page}-"]`);
    contents.forEach(c => c.classList.remove('active'));
    
    const target = document.getElementById(`${page}-${tab}`);
    if (target) target.classList.add('active');

    const tabs = document.querySelectorAll(`#page-${page} .sub-tab`);
    tabs.forEach(t => t.classList.remove('active'));
    
    const activeTab = Array.from(tabs).find(t => 
        t.getAttribute('onclick')?.includes(`'${tab}'`)
    );
    if (activeTab) activeTab.classList.add('active');
}

// ═══════════════ PRAYER TIMES ═══════════════
let saharTime = null;
let iftarTime = null;

function setTimesForToday(city = getSelectedCity()) {
    // ADD THESE DEBUG LINES AT THE VERY START
    console.log('📍 setTimesForToday called for city:', city);
    
    if (!CITY_TIMES[city]) city = 'Toshkent';

    const select = document.getElementById('citySelect');
    if (select) select.value = city;

    const todayKey = getTodayKey();
    // ADD THIS DEBUG LINE
    console.log('Today key:', todayKey);
    
    const row = CITY_TIMES_BY_DATE[city]?.[todayKey];
    // ADD THIS DEBUG LINE
    console.log('Row data:', row);
    
    if (!row) {
        saharTime = null;
        iftarTime = null;
        setText('saharTime', '—');
        setText('iftarTime', '—');
        setText('saharCountdown', '—');
        setText('iftarCountdown', '—');
        document.getElementById('progressFill').style.width = '0%';
        setText('progressPct', '—');
        return;
    }

    saharTime = row.tong;
    iftarTime = row.shom;
    renderTimes();
    renderNamazTimes(row);
}

function renderNamazTimes(row) {
    if (!row) {
        setText('namazFajr', '—');
        setText('namazSunrise', '—');
        setText('namazDhuhr', '—');
        setText('namazAsr', '—');
        setText('namazMaghrib', '—');
        setText('namazIsha', '—');
        return;
    }

    setText('namazFajr', row.tong);
    setText('namazSunrise', row.quyosh);
    setText('namazDhuhr', row.peshin);
    setText('namazAsr', row.asr);
    setText('namazMaghrib', row.shom);
    setText('namazIsha', row.xufton);
}

function renderTimes() {
    if (!saharTime || !iftarTime) return;
    
    setText('saharTime', saharTime);
    setText('iftarTime', iftarTime);

    const now = new Date();
    const sahar = parseTimeToDate(saharTime);
    const iftar = parseTimeToDate(iftarTime);

    if (sahar < now) sahar.setDate(sahar.getDate() + 1);
    if (iftar < now) iftar.setDate(iftar.getDate() + 1);

    const toSahar = sahar - now;
    const toIftar = iftar - now;

    setText('saharCountdown', toSahar > 0 ? formatCountdown(toSahar) + ' qoldi' : '—');
    setText('iftarCountdown', toIftar > 0 ? formatCountdown(toIftar) + ' qoldi' : 'Ro\'za tugatildi ✓');

    if (now >= sahar && now <= iftar) {
        const totalMs = iftar - sahar;
        const elapsed = now - sahar;
        const pct = Math.max(0, Math.min(100, (elapsed / totalMs) * 100));
        document.getElementById('progressFill').style.width = pct.toFixed(1) + '%';
        setText('progressPct', pct.toFixed(0) + '%');
    } else if (now > iftar) {
        document.getElementById('progressFill').style.width = '100%';
        setText('progressPct', '100%');
    } else {
        document.getElementById('progressFill').style.width = '0%';
        setText('progressPct', '0%');
    }

    checkDuaReminder(now, sahar, iftar);
}

function checkDuaReminder(now, sahar, iftar) {
    const toSahar = sahar - now;
    const sinceIftar = now - iftar;

    if (toSahar > 0 && toSahar <= 30 * 60000) {
        showReminder('sahar');
    } else if (sinceIftar >= 0 && sinceIftar <= 30 * 60000) {
        showReminder('iftar');
    }
}

function showReminder(type) {
    const key = 'shown_' + type + '_' + new Date().toDateString();
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');

    const dua = DUAS[type];
    setText('reminderTitle', dua.title);
    setText('reminderArabic', dua.arabic);
    setText('reminderText', dua.text);
    document.getElementById('reminderToast').classList.add('show');

    setTimeout(() => closeReminder(), 30000);
}

function closeReminder() {
    document.getElementById('reminderToast').classList.remove('show');
}

// ═══════════════ RAMADAN INFO ═══════════════
function getRamadanDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = getRamadanStartDate();
    start.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - start) / 86400000) + 1;
    if (diff < 1 || diff > RAMADAN_DAYS) return 0;
    return diff;
}

function renderRamadanInfo() {
    const day = getRamadanDay();
    const left = day === 0 ? RAMADAN_DAYS : Math.max(0, RAMADAN_DAYS - day);
    const juzDone = day;

    setText('ramadanDay', day === 0 ? '—' : String(day));
    setText('daysLeft', String(left));
    setText('juzDone', day === 0 ? '—' : String(juzDone));

    if (day === 0) {
        const start = getRamadanStartDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        const daysToStart = Math.max(0, Math.ceil((start - today) / 86400000));
        setText('heroDayText', `Ramazon boshlanishiga · ${daysToStart} kun`);
    } else {
        setText('heroDayText', `Ramazon ${day}-kuni · ${left} kun qoldi`);
    }

    const todayKey = getTodayKey();
    const todayRow = TARAWEH_BY_DATE[todayKey];

    if (!todayRow) {
        setText('tarawehTitle', 'Bugungi taroaveh');
        setText('tarawehDesc', 'Bu sana uchun taroaveh jadvali topilmadi.');
    } else {
        setText('tarawehTitle', `Taroaveh · ${todayRow.day}`);
        setText('tarawehDesc', `${todayRow.text} (${todayRow.pages})`);
    }

    const juzGrid = document.getElementById('juzProgress');
    if (juzGrid) {
        juzGrid.innerHTML = '';
        const todayIdx = TARAWEH_JUZ.findIndex(r => r.date === todayKey);
        
        for (let i = 0; i < TARAWEH_JUZ.length; i++) {
            const dot = document.createElement('div');
            dot.className = 'juz-dot';
            if (todayIdx !== -1 && i < todayIdx) dot.classList.add('done');
            if (i === todayIdx) dot.classList.add('today');
            dot.title = `${i + 1}-kun`;
            juzGrid.appendChild(dot);
        }
    }
}

// ═══════════════ CITY CHANGE ═══════════════
function onCityChange() {
    const city = document.getElementById('citySelect')?.value || 'Toshkent';
    setSelectedCity(city);
    setTimesForToday(city);
}

// ═══════════════ QURAN FUNCTIONS ═══════════════
function updateHasanat() {
    const pagesInput = document.getElementById('pagesInput');
    if (!pagesInput) return;
    
    const pages = parseInt(pagesInput.value) || 0;
    const hasanat = pages * 10;
    const badge = document.getElementById('todayHasanat');
    if (badge) badge.textContent = `✨ ${hasanat} hasanat`;
}

function logPages() {
    const pagesInput = document.getElementById('pagesInput');
    if (!pagesInput) return;
    
    const pages = parseInt(pagesInput.value) || 0;
    if (!pages) {
        alert('Iltimos, bet sonini kiriting');
        return;
    }
    
    if (pages < 1 || pages > 100) {
        alert('Bet soni 1-100 oralig\'ida bo\'lishi kerak');
        return;
    }
    
    const today = new Date().toLocaleDateString('uz-Cyrl-UZ');
    
    if (typeof state.pageTotal === 'undefined') state.pageTotal = 0;
    if (!state.pageLog) state.pageLog = [];
    if (!state.quranDaily) state.quranDaily = {};
    
    state.pageTotal += pages;
    state.pageLog.unshift({ date: today, pages });
    
    if (!state.quranDaily[today]) state.quranDaily[today] = 0;
    state.quranDaily[today] += pages;
    
    save();
    
    pagesInput.value = 0;
    
    updateHasanat();
    renderQuranLog();
    renderQuranHero();
    
    // Sync with backend
    saveToBackend('quran', state.pageTotal);
}

function renderQuranLog() {
    const total = state.pageTotal || 0;
    const pct = Math.min(100, (total / QURAN_TOTAL_PAGES) * 100);
    
    const progressBar = document.getElementById('quranProgressBar');
    if (progressBar) progressBar.style.width = pct + '%';
    
    const pagesLabel = document.getElementById('pagesLoggedLabel');
    if (pagesLabel) pagesLabel.textContent = total + ' bet';
    
    const today = new Date().toLocaleDateString('uz-Cyrl-UZ');
    const todayPages = state.quranDaily?.[today] || 0;
    
    const habitEnabled = state.quranHabit?.enabled;
    const dailyTarget = state.quranHabit?.dailyTarget || 0;
    
    const badge = document.getElementById('todayHasanat');
    if (badge) {
        const hasanat = todayPages * 10;
        if (habitEnabled && dailyTarget > 0) {
            badge.textContent = `✨ ${hasanat} · ${todayPages}/${dailyTarget} bet`;
            showDailyProgress(todayPages, dailyTarget);
        } else {
            badge.textContent = `✨ ${hasanat} hasanat`;
            hideDailyProgress();
        }
    }
    
    renderPageHistory();
}

function showDailyProgress(todayPages, dailyTarget) {
    const logDiv = document.getElementById('quran-log');
    if (!logDiv) return;
    
    const existing = document.getElementById('dailyProgressContainer');
    if (existing) existing.remove();
    
    const progressContainer = document.createElement('div');
    progressContainer.id = 'dailyProgressContainer';
    progressContainer.style.marginTop = '20px';
    progressContainer.style.padding = '20px';
    progressContainer.style.background = 'white';
    progressContainer.style.border = '1px solid var(--border)';
    progressContainer.style.borderRadius = '12px';
    progressContainer.style.boxShadow = 'var(--shadow)';
    
    const percent = Math.min(100, (todayPages / dailyTarget) * 100);
    const remaining = Math.max(0, dailyTarget - todayPages);
    
    progressContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span style="font-size:1rem; color:var(--green-deep); font-weight:600;">📊 Bugungi maqsad</span>
            <span style="font-size:1rem; font-family:'DM Mono',monospace; color:${remaining === 0 ? 'var(--green-light)' : 'var(--gold-dim)'}; font-weight:600;">
                ${todayPages}/${dailyTarget} bet
            </span>
        </div>
        <div style="height:10px; background:var(--border); border-radius:5px; overflow:hidden; margin-bottom:12px;">
            <div style="height:100%; width:${percent}%; background:${remaining === 0 ? 'var(--green-light)' : 'var(--gold)'}; border-radius:5px; transition:width 0.3s ease;"></div>
        </div>
        <div style="font-size:0.95rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
            ${remaining === 0 
                ? '<span style="color:var(--green-light);">✅ Tabriklaymiz! Bugungi maqsad bajarildi</span>' 
                : `<span>📖 Yana <strong style="color:var(--gold-dim);">${remaining} bet</strong> o\'qishingiz kerak</span>`}
        </div>
    `;
    
    const dailyCard = logDiv.querySelector('.daily-plan-card');
    if (dailyCard && dailyCard.parentNode) {
        dailyCard.parentNode.insertBefore(progressContainer, dailyCard.nextSibling);
    }
}

function hideDailyProgress() {
    const existing = document.getElementById('dailyProgressContainer');
    if (existing) existing.remove();
}

function renderPageHistory() {
    const hist = document.getElementById('pageLogHistory');
    if (!hist) return;
    
    const logs = state.pageLog || [];
    
    if (!logs.length) {
        hist.innerHTML = '<div class="section-title">Oxirgi o\'qishlar</div>' +
            '<div style="font-size:0.9rem; color:var(--text-muted); text-align:center; padding:30px; background:white; border-radius:12px; border:1px solid var(--border);">📖 Hali o\'qilgan betlar yo\'q</div>';
        return;
    }
    
    hist.innerHTML = '<div class="section-title">Oxirgi o\'qishlar</div>' +
        logs.slice(0, 7).map(l => `
            <div class="charity-log-item" style="margin-bottom:8px;">
                <div>
                    <div class="charity-log-desc" style="font-weight:500;">Qur\'on o\'qildi</div>
                    <div style="font-size:0.75rem; color:var(--text-light); font-family:\'DM Mono\',monospace;">${l.date}</div>
                </div>
                <div class="charity-log-amount" style="color:var(--green-light); font-weight:600;">+${l.pages} bet ✨</div>
            </div>
        `).join('');
}

function renderQuranHero() {
    const total = state.pageTotal || 0;
    const juz = Math.floor(total / QURAN_PAGES_PER_JUZ);
    const hasanat = total * 10;
    
    setText('heroPagesDone', total);
    setText('heroJuzDone', juz);
    
    let hasanatText;
    if (hasanat >= 1000000) {
        hasanatText = (hasanat/1000000).toFixed(1) + 'M';
    } else if (hasanat >= 1000) {
        hasanatText = (hasanat/1000).toFixed(1) + 'K';
    } else {
        hasanatText = hasanat;
    }
    setText('heroHasanat', hasanatText);
    
    const pct = Math.min(100, (total / QURAN_TOTAL_PAGES) * 100);
    const heroBar = document.getElementById('heroQuranBar');
    if (heroBar) heroBar.style.width = pct.toFixed(1) + '%';
    
    setText('heroBarLeft', total + ' bet');
}

function onPlanModeChange() {
    const modeSelect = document.getElementById('planMode');
    const dateInput = document.getElementById('khatmDate');
    
    if (!modeSelect || !dateInput) return;
    
    if (modeSelect.value === 'ramadanEnd') {
        dateInput.disabled = true;
        dateInput.value = getRamadanEndKey();
    } else {
        dateInput.disabled = false;
        dateInput.value = '';
    }
}

function calcQuranPlan() {
    const currentPageInput = document.getElementById('currentPage');
    const modeSelect = document.getElementById('planMode');
    const dateInput = document.getElementById('khatmDate');
    
    if (!currentPageInput || !modeSelect || !dateInput) {
        alert('Form elementlari topilmadi');
        return;
    }
    
    const currentPage = parseInt(currentPageInput.value) || 1;
    const mode = modeSelect.value;
    let targetDate = dateInput.value;
    
    if (currentPage < 1 || currentPage > 604) {
        alert('Bet raqami 1 dan 604 gacha bo\'lishi kerak');
        return;
    }
    
    if (mode === 'ramadanEnd') {
        targetDate = getRamadanEndKey();
    }
    
    if (!targetDate) {
        alert('Iltimos, maqsad sanani tanlang');
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDate + 'T00:00:00');
    target.setHours(0, 0, 0, 0);
    
    if (target < today) {
        alert('Maqsad sana bugungi kundan keyin bo\'lishi kerak');
        return;
    }
    
    let daysLeft = Math.floor((target - today) / (1000 * 60 * 60 * 24)) + 1;
    if (daysLeft < 1) daysLeft = 1;
    
    const pagesRemaining = 604 - (currentPage - 1);
    const dailyPages = Math.ceil(pagesRemaining / daysLeft);
    
    if (!state.quranPlan) state.quranPlan = {};
    state.quranPlan = {
        currentPage,
        targetDate,
        daysLeft,
        pagesRemaining,
        dailyPages
    };
    save();
    
    displayPlanResults();
    showHabitPrompt();
}

function displayPlanResults() {
    const plan = state.quranPlan;
    if (!plan) return;
    
    const resultDiv = document.getElementById('quranPlanResult');
    const dailyLabel = document.getElementById('dailyPagesLabel');
    const planDetails = document.getElementById('planDetails');
    
    if (resultDiv) resultDiv.style.display = 'block';
    if (dailyLabel) dailyLabel.textContent = `${plan.dailyPages} bet/kun`;
    
    if (planDetails) {
        planDetails.innerHTML = `
            📊 <strong>Hisob-kitob natijalari:</strong><br><br>
            • Hozirgi bet: ${plan.currentPage}<br>
            • Qolgan betlar: ${plan.pagesRemaining}<br>
            • Qolgan kunlar: ${plan.daysLeft}<br>
            • Maqsad sana: ${plan.targetDate}<br><br>
            <strong style="color: var(--green-deep); font-size:1.1rem;">✅ Kuniga ${plan.dailyPages} bet o'qishingiz kerak</strong>
        `;
    }
}

function showHabitPrompt() {
    const plan = state.quranPlan;
    if (!plan) return;
    
    const resultDiv = document.getElementById('quranPlanResult');
    if (!resultDiv) return;
    
    const existingPrompt = document.getElementById('habitPrompt');
    if (existingPrompt) existingPrompt.remove();
    
    const existingMessage = document.getElementById('habitMessage');
    if (existingMessage) existingMessage.remove();
    
    const promptDiv = document.createElement('div');
    promptDiv.id = 'habitPrompt';
    promptDiv.style.marginTop = '20px';
    promptDiv.style.padding = '20px';
    promptDiv.style.background = 'rgba(200, 169, 110, 0.1)';
    promptDiv.style.borderRadius = '12px';
    promptDiv.style.border = '1px solid var(--gold-dim)';
    
    promptDiv.innerHTML = `
        <div style="margin-bottom:16px;">
            <span style="font-size:1.1rem; color: var(--green-deep); font-weight:600;">📋 Kunlik odat sifatida saqlash</span>
            <p style="margin-top:8px; color: var(--text-muted); font-size:0.95rem;">
                Har kuni <strong>${plan.dailyPages} bet</strong> o'qish rejasi "Kunlik" bo'limida ko'rinadi. 
                Saqlaymizmi?
            </p>
        </div>
        <div style="display:flex; gap:12px;">
            <button class="btn btn-primary" onclick="saveQuranHabit(true)" style="flex:1;">Ha, saqlash</button>
            <button class="btn btn-outline" onclick="saveQuranHabit(false)" style="flex:1;">Yo'q</button>
        </div>
    `;
    
    resultDiv.appendChild(promptDiv);
}

function saveQuranHabit(enable) {
    const plan = state.quranPlan;
    const promptEl = document.getElementById('habitPrompt');
    
    if (promptEl) promptEl.remove();
    
    const resultDiv = document.getElementById('quranPlanResult');
    if (!resultDiv) return;
    
    const existingMessage = document.getElementById('habitMessage');
    if (existingMessage) existingMessage.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'habitMessage';
    messageDiv.style.marginTop = '16px';
    messageDiv.style.padding = '16px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.transition = 'opacity 0.5s ease';
    
    if (enable && plan) {
        if (!state.quranHabit) state.quranHabit = {};
        state.quranHabit = {
            enabled: true,
            dailyTarget: plan.dailyPages,
            currentPage: plan.currentPage,
            targetDate: plan.targetDate,
            startedAt: new Date().toISOString()
        };
        
        if (!state.quranDaily) state.quranDaily = {};
        
        messageDiv.style.background = 'rgba(61, 122, 87, 0.1)';
        messageDiv.style.border = '1px solid var(--green-light)';
        messageDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.2rem;">✅</span>
                <div>
                    <strong style="color: var(--green-deep);">Odat saqlandi!</strong><br>
                    <span style="font-size:0.9rem; color: var(--text-muted);">
                        Endi "Kunlik" bo'limida har kuni ${plan.dailyPages} bet ko'rinadi.
                    </span>
                </div>
            </div>
        `;
    } else {
        if (state.quranHabit) state.quranHabit.enabled = false;
        
        messageDiv.style.background = 'rgba(200, 60, 60, 0.05)';
        messageDiv.style.border = '1px solid rgba(200, 60, 60, 0.2)';
        messageDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.2rem;">❌</span>
                <div>
                    <strong style="color: #c83c3c;">Odat saqlanmadi</strong><br>
                    <span style="font-size:0.9rem; color: var(--text-muted);">
                        Keyin qaytadan reja tuzishingiz mumkin.
                    </span>
                </div>
            </div>
        `;
    }
    
    resultDiv.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv) {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv && messageDiv.parentNode) messageDiv.remove();
            }, 500);
        }
    }, 5000);
    
    save();
    renderQuranLog();
}

// ═══════════════ DHIKR FUNCTIONS ═══════════════
let currentDhikr = { name: 'Subhanalloh', arabic: 'سُبْحَانَ اللَّهِ', target: 33 };
let tapCurrent = 0;

function selectDhikr(el, name, arabic, target) {
    document.querySelectorAll('.dhikr-card').forEach(c => c.classList.remove('active-dhikr'));
    el.classList.add('active-dhikr');
    currentDhikr = { name, arabic, target };
    tapCurrent = 0;
    setText('activeDhikrName', name);
    setText('activeDhikrArabic', arabic);
    setText('tapTarget', target);
    setText('tapCount', 0);
}

function tap() {
    tapCurrent++;
    setText('tapCount', tapCurrent);

    if (tapCurrent >= currentDhikr.target) {
        completeDhikr();
    }
}

function resetDhikr() {
    tapCurrent = 0;
    setText('tapCount', 0);
}

function completeDhikr() {
    const today = new Date().toDateString();
    if (state.dhikrToday.date !== today) {
        state.dhikrToday = { date: today, count: 0, items: {} };
    }

    const count = tapCurrent || currentDhikr.target;
    state.dhikrToday.count += count;
    state.dhikrToday.items[currentDhikr.name] = (state.dhikrToday.items[currentDhikr.name] || 0) + count;
    state.dhikrTotal = (state.dhikrTotal || 0) + count;
    save();

    setText('dhikrHasanat', `✨ ${state.dhikrToday.count} hasanat bugun`);
    renderDhikrStats();
    renderDhikrHero();

    tapCurrent = 0;
    setText('tapCount', 0);

    // Sync with backend
    saveToBackend('dhikr', state.dhikrTotal);
}

function renderDhikrStats() {
    const today = new Date().toDateString();
    const statsEl = document.getElementById('todayDhikrStats');
    if (!statsEl) return;

    if (state.dhikrToday.date !== today) {
        statsEl.innerHTML = 'Hali zikr qilinmagan';
        return;
    }

    const items = state.dhikrToday.items;
    const html = Object.entries(items).map(([k, v]) => `
        <div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); font-size:0.88rem;">
            <span style="color:var(--text-main)">${k}</span>
            <span style="font-family:'DM Mono',monospace; color:var(--green-light)">${v} marta</span>
        </div>
    `).join('');
    
    statsEl.innerHTML = html || 'Hali zikr qilinmagan';
}

function renderDhikrHero() {
    const today = new Date().toDateString();
    const count = state.dhikrToday?.date === today ? (state.dhikrToday.count || 0) : 0;
    setText('heroDhikrCount', count);
}

// ═══════════════ CHARITY FUNCTIONS ═══════════════
function logCharity() {
    const amount = parseInt(document.getElementById('charityAmount')?.value) || 0;
    if (!amount) return;
    
    const type = document.getElementById('charityType')?.value || 'Naqd pul';
    const note = document.getElementById('charityNote')?.value || '';
    const today = new Date().toLocaleDateString('uz-Cyrl-UZ');

    state.charity = state.charity || [];
    state.charity.unshift({ date: today, amount, type, note });
    save();
    
    document.getElementById('charityAmount').value = '';
    document.getElementById('charityNote').value = '';
    renderCharity();
    renderSadaqaHero();
    
    // Sync with backend
    const total = state.charity.reduce((s, c) => s + c.amount, 0);
    saveToBackend('sadaqa', total);
}

function renderCharity() {
    const list = state.charity || [];
    const total = list.reduce((s, c) => s + c.amount, 0);
    const days = new Set(list.map(c => c.date)).size;

    setText('totalCharity', (total / 1000).toFixed(0) + 'K');
    setText('charityDays', days);

    const hist = document.getElementById('charityHistory');
    if (!hist) return;

    if (!list.length) {
        hist.innerHTML = '<div style="font-size:0.9rem; color:var(--text-muted); text-align:center; padding:20px;">Hali sadaqa yozilmagan</div>';
        return;
    }

    hist.innerHTML = list.slice(0, 10).map(c => `
        <div class="charity-log-item">
            <div>
                <div class="charity-log-desc">${c.type}${c.note ? ' — ' + c.note : ''}</div>
                <div style="font-size:0.75rem; color:var(--text-light); font-family:\'DM Mono\',monospace;">${c.date}</div>
            </div>
            <div class="charity-log-amount">${c.amount.toLocaleString()} so'm</div>
        </div>
    `).join('');
}

function renderSadaqaHero() {
    const list = state.charity || [];
    const total = list.reduce((s, c) => s + c.amount, 0);
    const days = new Set(list.map(c => c.date)).size;
    const hasanat = Math.floor(total / 1000);

    setText('heroTotalCharity', total >= 1000000 ? (total/1000000).toFixed(1) + 'M' : 
                                total >= 1000 ? (total/1000).toFixed(0) + 'K' : total);
    setText('heroCharityDays', days);
    setText('heroCharityHasanat', hasanat);
}

// ═══════════════ FASTING FUNCTIONS ═══════════════
function toggleFast() {
    const today = new Date().toDateString();
    if (!state.fasting) state.fasting = {};
    state.fasting[today] = !state.fasting[today];
    save();
    renderFastUI();
    renderCalendar();
    renderRozaHero();
}

function renderFastUI() {
    const today = new Date().toDateString();
    const fasting = state.fasting?.[today] || false;
    const allFasts = Object.values(state.fasting || {}).filter(Boolean).length;
    const streak = calcStreak();
    
    setText('fastedCount', allFasts);
    setText('streakCount', streak);
}

function calcStreak() {
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < RAMADAN_DAYS; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (state.fasting?.[d.toDateString()]) streak++;
        else break;
    }
    return streak;
}

function renderCalendar() {
    const cal = document.getElementById('ramadanCalendar');
    if (!cal) return;
    
    cal.innerHTML = '';
    const ramadanDay = getRamadanDay();
    const startDate = getRamadanStartDate();

    const startDay = startDate.getDay();
    const pad = startDay === 0 ? 6 : startDay - 1;
    for (let i = 0; i < pad; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.visibility = 'hidden';
        cal.appendChild(emptyDiv);
    }

    for (let i = 1; i <= RAMADAN_DAYS; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i - 1);
        const key = d.toDateString();
        
        const div = document.createElement('div');
        div.className = 'streak-day';
        div.textContent = i;

        if (i > ramadanDay) {
            div.classList.add('future');
        } else if (i === ramadanDay) {
            div.classList.add('today');
        } else if (state.fasting?.[key]) {
            div.classList.add('fasted');
        }

        if (i <= ramadanDay) {
            div.onclick = () => {
                if (!state.fasting) state.fasting = {};
                state.fasting[key] = !state.fasting[key];
                save();
                renderCalendar();
                renderFastUI();
                renderRozaHero();
            };
        }
        cal.appendChild(div);
    }
}

function renderRozaHero() {
    const today = new Date().toDateString();
    const isFasting = !!state.fasting?.[today];
    const allFasts = Object.values(state.fasting || {}).filter(Boolean).length;
    const left = Math.max(0, RAMADAN_DAYS - allFasts);
    const streak = calcStreak();

    setText('heroFastedCount', allFasts);
    setText('heroFastLeft', left);
    setText('heroFastStreak', streak);

    const dot = document.getElementById('rozaStatusDot');
    const txt = document.getElementById('rozaStatusText');
    if (dot) dot.className = 'roza-status-dot ' + (isFasting ? 'on' : 'off');
    if (txt) txt.textContent = isFasting ? '✓ Bugun ro\'za tutilmoqda' : 'Bugun ro\'za tutdingizmi?';
}

function generateRozaStars() {
    const container = document.getElementById('rozaStars');
    if (!container || container.children.length) return;
    
    for (let i = 0; i < 32; i++) {
        const s = document.createElement('div');
        s.className = 'star';
        s.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            --dur: ${2 + Math.random() * 3}s;
            --delay: ${Math.random() * 4}s;
            width: ${Math.random() > 0.7 ? 3 : 2}px;
            height: ${Math.random() > 0.7 ? 3 : 2}px;
            opacity: ${0.3 + Math.random() * 0.5};
        `;
        container.appendChild(s);
    }
}

// ═══════════════ NAMAZ FUNCTIONS ═══════════════
function renderNamazHero() {
    const now = new Date();
    const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'];
    setText('namazHeroDate', `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`);

    const city = getSelectedCity();
    const todayKey = getTodayKey();
    const row = CITY_TIMES_BY_DATE[city]?.[todayKey];
    
    if (!row) return;

    const prayerTimes5 = [row.tong, row.peshin, row.asr, row.shom, row.xufton];
    const prayerNames = ['Bomdod', 'Peshin', 'Asr', 'Shom', 'Xufton'];

    let activeIdx = -1;
    let nextIdx = -1;

    for (let i = 0; i < prayerTimes5.length; i++) {
        const time = parseTimeToDate(prayerTimes5[i]);
        if (now >= time) {
            activeIdx = i;
        } else {
            if (nextIdx === -1) nextIdx = i;
        }
    }

    if (activeIdx >= 0) {
        setText('currentPrayerName', prayerNames[activeIdx] + ' vaqti');
    } else {
        setText('currentPrayerName', 'Bomdod oldidan');
    }

    if (nextIdx >= 0) {
        const nextTime = parseTimeToDate(prayerTimes5[nextIdx]);
        if (nextTime < now) nextTime.setDate(nextTime.getDate() + 1);
        
        const diff = nextTime - now;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        
        let countdownText = '';
        if (h > 0) countdownText = `${h}s ${m}d qoldi`;
        else if (m > 0) countdownText = `${m}d ${s}s qoldi`;
        else countdownText = `${s}s qoldi`;
        
        setText('currentPrayerCountdown', `${prayerNames[nextIdx]}gacha ${countdownText}`);
    } else {
        setText('currentPrayerCountdown', 'Xufton o\'tdi');
    }

    const ribbon = document.getElementById('prayerRibbon');
    if (ribbon) {
        ribbon.innerHTML = PRAYERS.map((p, i) => {
            let cls = '';
            if (i === activeIdx) cls = 'active-slot';
            else if (i < activeIdx) cls = 'passed-slot';
            
            return `
                <div class="prayer-slot ${cls}">
                    <div class="ps-name">${p.uz}</div>
                    <div class="ps-time">${prayerTimes5[i]}</div>
                </div>
            `;
        }).join('');
    }
}

function updateNamazStats() {
    const todayKey = new Date().toDateString();
    let prayersDoneToday = 0;

    PRAYERS.forEach(p => {
        const rKey = `${todayKey}_${p.key}`;
        const done = state.rakah?.[rKey] || {};
        let farzDone = 0;
        for (let f = 0; f < p.farz; f++) {
            if (done[`f${f}`]) farzDone++;
        }
        if (farzDone === p.farz) prayersDoneToday++;
    });

    setText('namazTodayVal', `${prayersDoneToday}/5`);

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < RAMADAN_DAYS; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dk = d.toDateString();
        let allDone = true;
        
        PRAYERS.forEach(p => {
            const rKey = `${dk}_${p.key}`;
            const done = state.rakah?.[rKey] || {};
            for (let f = 0; f < p.farz; f++) {
                if (!done[`f${f}`]) allDone = false;
            }
        });
        
        if (allDone) streak++;
        else if (i > 0) break;
    }
    setText('namazStreakVal', streak);

    let totalFarz = 0, doneFarz = 0;
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dk = d.toDateString();
        
        PRAYERS.forEach(p => {
            const rKey = `${dk}_${p.key}`;
            const done = state.rakah?.[rKey] || {};
            totalFarz += p.farz;
            for (let f = 0; f < p.farz; f++) {
                if (done[`f${f}`]) doneFarz++;
            }
        });
    }
    
    const pct = totalFarz > 0 ? Math.round((doneFarz / totalFarz) * 100) : 0;
    setText('namazWeekVal', pct + '%');
}

function renderWeeklyGrid() {
    const grid = document.getElementById('weeklyGrid');
    if (!grid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();
    const monOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + monOffset);

    const dayLabels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });

    const fmt = d => `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    setText('weekRange', `${fmt(dates[0])} – ${fmt(dates[6])}`);

    let html = '<div></div>';
    dates.forEach((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        html += `<div class="wg-day-header ${isToday ? 'today-col' : ''}">${dayLabels[i]}<br><span style="font-size:0.58rem">${d.getDate()}</span></div>`;
    });

    PRAYERS.forEach(p => {
        html += `<div class="wg-row-label">${p.uz}</div>`;
        dates.forEach(d => {
            const isFuture = d > today;
            const dk = d.toDateString();
            const rKey = `${dk}_${p.key}`;
            const done = state.rakah?.[rKey] || {};
            
            let farzDone = 0;
            for (let f = 0; f < p.farz; f++) { 
                if (done[`f${f}`]) farzDone++; 
            }
            
            const allDone = farzDone === p.farz;
            
            let cls = isFuture ? 'wgc-future' : allDone ? 'wgc-done' : 'wgc-missed';
            html += `<div class="wg-cell ${cls}" onclick="togglePrayer('${rKey}', ${p.farz})"></div>`;
        });
    });

    grid.innerHTML = html;
}

function togglePrayer(rKey, farzCount) {
    if (!state.rakah) state.rakah = {};
    
    const done = state.rakah[rKey] || {};
    let allDone = true;
    
    for (let f = 0; f < farzCount; f++) { 
        if (!done[`f${f}`]) { 
            allDone = false; 
            break; 
        }
    }
    
    if (allDone) {
        state.rakah[rKey] = {};
    } else {
        state.rakah[rKey] = {};
        for (let f = 0; f < farzCount; f++) {
            state.rakah[rKey][`f${f}`] = true;
        }
    }
    
    save();
    updateNamazStats();
    renderWeeklyGrid();
}

// ═══════════════ LEADERBOARD FUNCTIONS (BACKEND SYNC) ═══════════════
async function saveToBackend(type, value) {
    const user = JSON.parse(localStorage.getItem('telegram_user') || '{}');
    const name = localStorage.getItem('user_display_name');
    
    if (!user.id || !name) return;
    
    try {
        await fetch(`${RAILWAY_URL}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: user.id,
                name: name,
                type: type,
                value: value
            })
        });
    } catch (err) {
        console.error('Backend save error:', err);
    }
}

// NEW: Join leaderboard function
async function joinLeaderboard(type) {
    const nameInput = document.getElementById(`lbName${type.charAt(0).toUpperCase() + type.slice(1)}`);
    if (!nameInput) return;
    
    let name = nameInput.value.trim();
    
    // If name is empty, try to get from localStorage
    if (!name) {
        name = localStorage.getItem('user_display_name');
    }
    
    if (!name) {
        alert('Iltimos, ismingizni kiriting');
        return;
    }
    
    // Get Telegram user
    const user = JSON.parse(localStorage.getItem('telegram_user') || '{}');
    const telegramId = user.id || `anon_${Date.now()}`;
    
    // Save name to localStorage
    localStorage.setItem('user_display_name', name);
    localStorage.setItem(`myName${type.charAt(0).toUpperCase() + type.slice(1)}`, name);
    
    // Clear input
    nameInput.value = '';
    
    try {
        // Register with backend
        await fetch(`${RAILWAY_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: telegramId,
                name: name
            })
        });
        
        // Get current score
        let currentScore = 0;
        if (type === 'quran') currentScore = state.pageTotal || 0;
        else if (type === 'dhikr') currentScore = state.dhikrTotal || 0;
        else if (type === 'sadaqa') {
            currentScore = (state.charity || []).reduce((s, c) => s + c.amount, 0);
        }
        
        // Initialize score for this type
        await fetch(`${RAILWAY_URL}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: telegramId,
                name: name,
                type: type,
                value: currentScore
            })
        });
        
        // Show success message
        alert(`✅ Siz ${type === 'quran' ? 'Qur\'on' : type === 'dhikr' ? 'Zikr' : 'Sadaqa'} leaderboardiga qo'shildingiz!`);
        
        // Reload leaderboards
        loadLeaderboards();
        
    } catch (err) {
        console.error('Error joining leaderboard:', err);
        alert('Xatolik yuz berdi, ammo mahalliy leaderboardga qo\'shildingiz');
        
        // Still add to local leaderboards
        addToLocalLeaderboard(type, name);
    }
}

// Helper function to add user to local leaderboard
function addToLocalLeaderboard(type, name) {
    const score = type === 'quran' ? (state.pageTotal || 0) :
                  type === 'dhikr' ? (state.dhikrTotal || 0) :
                  (state.charity || []).reduce((s, c) => s + c.amount, 0);
    
    if (type === 'quran') {
        if (!state.quranUsers) state.quranUsers = [];
        const existing = state.quranUsers.find(u => u.name === name);
        if (existing) {
            existing.pages = score;
        } else {
            state.quranUsers.push({ name, pages: score });
        }
    } else if (type === 'dhikr') {
        if (!state.dhikrUsers) state.dhikrUsers = [];
        const existing = state.dhikrUsers.find(u => u.name === name);
        if (existing) {
            existing.count = score;
        } else {
            state.dhikrUsers.push({ name, count: score });
        }
    } else if (type === 'sadaqa') {
        if (!state.sadaqaUsers) state.sadaqaUsers = [];
        const existing = state.sadaqaUsers.find(u => u.name === name);
        if (existing) {
            existing.amount = score;
        } else {
            state.sadaqaUsers.push({ name, amount: score });
        }
    }
    
    save();
    renderLocalLeaderboards();
}

// UPDATED: Load leaderboards from backend
async function loadLeaderboards() {
    try {
        // Load Quran leaderboard
        const quranRes = await fetch(`${RAILWAY_URL}/api/leaderboard/quran`);
        const quranData = await quranRes.json();
        // Take top 30 and sort by score
        const sortedQuran = (quranData || []).sort((a, b) => b.score - a.score).slice(0, 30);
        renderLB('quranLeaderboard', sortedQuran, u => `${u.score} bet`, u => u.score * 10);
        
        // Load Dhikr leaderboard
        const dhikrRes = await fetch(`${RAILWAY_URL}/api/leaderboard/dhikr`);
        const dhikrData = await dhikrRes.json();
        const sortedDhikr = (dhikrData || []).sort((a, b) => b.score - a.score).slice(0, 30);
        renderLB('dhikrLeaderboard', sortedDhikr, u => `${u.score} zikr`, u => u.score);
        
        // Load Sadaqa leaderboard
        const sadaqaRes = await fetch(`${RAILWAY_URL}/api/leaderboard/sadaqa`);
        const sadaqaData = await sadaqaRes.json();
        const sortedSadaqa = (sadaqaData || []).sort((a, b) => b.score - a.score).slice(0, 30);
        renderLB('sadaqaLeaderboard', sortedSadaqa, u => `${(u.score/1000).toFixed(0)}K so'm`, u => Math.floor(u.score/1000));
        
    } catch (err) {
        console.error('Load leaderboard error:', err);
        
        // Fallback to local data if backend fails
        renderLocalLeaderboards();
    }
}

// UPDATED: Render local leaderboards as fallback
function renderLocalLeaderboards() {
    // Sort by score (highest first) and take top 30
    const quranSorted = (state.quranUsers || [])
        .sort((a, b) => b.pages - a.pages)
        .slice(0, 30)
        .map(u => ({ name: u.name, score: u.pages }));
    
    const dhikrSorted = (state.dhikrUsers || [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 30)
        .map(u => ({ name: u.name, score: u.count }));
    
    const sadaqaSorted = (state.sadaqaUsers || [])
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 30)
        .map(u => ({ name: u.name, score: u.amount }));
    
    renderLB('quranLeaderboard', quranSorted, u => `${u.score} bet`, u => u.score * 10);
    renderLB('dhikrLeaderboard', dhikrSorted, u => `${u.score} zikr`, u => u.score);
    renderLB('sadaqaLeaderboard', sadaqaSorted, u => `${(u.score / 1000).toFixed(0)}K so'm`, u => Math.floor(u.score / 1000));
}

// UPDATED: Render leaderboard with consistent format
function renderLB(containerId, data, formatFn, scoreFn) {
    const el = document.getElementById(containerId);
    if (!el) return;
    
    if (!data || !data.length) {
        el.innerHTML = '<div style="font-size:0.9rem; color:var(--text-muted); text-align:center; padding:20px;">Hali ma\'lumot yo\'q</div>';
        return;
    }
    
    el.innerHTML = data.map((item, i) => {
        const score = item.score !== undefined ? item.score : 0;
        const name = item.name || 'Foydalanuvchi';
        
        return `
            <div class="leaderboard-item">
                <div class="lb-rank ${i < 3 ? 'top' : ''}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div class="lb-avatar">${name.charAt(0)}</div>
                <div class="lb-info">
                    <div class="lb-name">${name}</div>
                    <div class="lb-sub">${formatFn ? formatFn(item) : `${score} ball`}</div>
                </div>
                <div class="lb-score">✨ ${scoreFn ? scoreFn(item) : score}</div>
            </div>
        `;
    }).join('');
}

// Make functions globally available
window.joinLeaderboard = joinLeaderboard;
window.loadLeaderboards = loadLeaderboards;


// ═══════════════ INITIALIZATION ═══════════════
document.addEventListener('DOMContentLoaded', function() {
    initState();
    setTimesForToday();
    renderRamadanInfo();
    renderFastUI();
    renderDhikrStats();
    renderCharity();
    renderQuranLog();
    renderQuranHero();
    generateRozaStars();

    // Set default khatm date to end of Ramadan
    const endRamadan = new Date(getRamadanEndKey() + 'T00:00:00');
    const dateEl = document.getElementById('khatmDate');
    if (dateEl) {
        const y = endRamadan.getFullYear();
        const m = String(endRamadan.getMonth() + 1).padStart(2, '0');
        const d = String(endRamadan.getDate()).padStart(2, '0');
        dateEl.value = `${y}-${m}-${d}`;
    }

    const cityEl = document.getElementById('citySelect');
    if (cityEl) cityEl.value = getSelectedCity();

    // Load leaderboards from backend
    if (localStorage.getItem('user_display_name')) {
        loadLeaderboards();
    } else {
        renderLocalLeaderboards();
    }
    
    // ===== ADD THESE DEBUG LINES AT THE VERY END =====
    console.log('✅ DOMContentLoaded completed');
    console.log('saharTime:', saharTime);
    console.log('iftarTime:', iftarTime);
    console.log('Current city:', getSelectedCity());
    console.log('Today date:', new Date().toDateString());
});

    // Start timers
    setInterval(() => {
        if (document.getElementById('page-home').classList.contains('active')) {
            if (saharTime) renderTimes();
        }
    }, 1000);

    setInterval(() => {
        if (document.getElementById('page-namaz').classList.contains('active')) {
            renderNamazHero();
        }
    }, 1000);
});

// Make functions globally available
window.showPage = showPage;
window.showSubTab = showSubTab;
window.onCityChange = onCityChange;
window.onPlanModeChange = onPlanModeChange;
window.calcQuranPlan = calcQuranPlan;
window.saveQuranHabit = saveQuranHabit;
window.updateHasanat = updateHasanat;
window.logPages = logPages;
window.selectDhikr = selectDhikr;
window.tap = tap;
window.resetDhikr = resetDhikr;
window.completeDhikr = completeDhikr;
window.logCharity = logCharity;
window.toggleFast = toggleFast;
window.togglePrayer = togglePrayer;
window.joinLeaderboard = joinLeaderboard;
window.closeReminder = closeReminder;
window.showNameModal = showNameModal;
window.closeNameModal = closeNameModal;
window.saveTelegramName = saveTelegramName;
window.joinLeaderboard = joinLeaderboard;
window.loadLeaderboards = loadLeaderboards;
window.showNameModal = showNameModal;
window.closeNameModal = closeNameModal;
window.saveTelegramName = saveTelegramName;
window.joinAllLeaderboards = joinAllLeaderboards;