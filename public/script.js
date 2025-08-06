// Socket.IO接続
const socket = io();

// DOM要素の取得
const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const loginFormContainer = document.getElementById('loginFormContainer');
const registerFormContainer = document.getElementById('registerFormContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginError = document.getElementById('loginError');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');
const showRegisterBtn = document.getElementById('showRegisterBtn');
const showLoginBtn = document.getElementById('showLoginBtn');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const checkinBtn = document.getElementById('checkinBtn');
const checkoutBtn = document.getElementById('checkoutBtn');
const currentTime = document.getElementById('currentTime');
const onlineUsers = document.getElementById('onlineUsers');
const onlineCount = document.getElementById('onlineCount');
const message = document.getElementById('message');
const dashboardTab = document.getElementById('dashboardTab');
const historyTab = document.getElementById('historyTab');
const dashboardContent = document.getElementById('dashboardContent');
const historyContent = document.getElementById('historyContent');
const attendanceHistory = document.getElementById('attendanceHistory');
const historyLoading = document.getElementById('historyLoading');
const historyEmpty = document.getElementById('historyEmpty');
const monthlyDays = document.getElementById('monthlyDays');
const monthlyHours = document.getElementById('monthlyHours');
const adminTab = document.getElementById('adminTab');
const adminContent = document.getElementById('adminContent');
const notificationBadge = document.getElementById('notificationBadge');
const employeeStatsBtn = document.getElementById('employeeStatsBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const bonusesBtn = document.getElementById('bonusesBtn');
const employeeStatsContent = document.getElementById('employeeStatsContent');
const notificationsContent = document.getElementById('notificationsContent');
const bonusesContent = document.getElementById('bonusesContent');
const sideMenu = document.getElementById('sideMenu');
const toggleSideMenu = document.getElementById('toggleSideMenu');
const showSideMenu = document.getElementById('showSideMenu');

// 現在のユーザー情報
let currentUser = null;

// セッション管理
const SESSION_KEY = 'attendance_session';

// セッションを保存
function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// セッションを取得
function getSession() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

// セッションをクリア
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// ログイン状態を復元
function restoreLoginState() {
    const savedUser = getSession();
    if (savedUser) {
        currentUser = savedUser;
        userName.textContent = currentUser.name;
        loginScreen.classList.add('hidden');
        mainScreen.classList.remove('hidden');
        
        // オーナー権限をチェック
        checkOwnerPermissions();
        
        // サイドメニューを初期化
        initializeSideMenu();
        
        // オンライン状況を取得
        loadOnlineStatus();
        
        console.log('ログイン状態を復元しました:', currentUser.name);
    }
}

// オーナー権限をチェックして管理画面タブを表示
function checkOwnerPermissions() {
    if (currentUser && currentUser.role === 'owner') {
        adminTab.classList.remove('hidden');
        updateNotificationBadge();
        console.log('オーナー権限を確認しました。管理画面を表示します。');
    } else {
        adminTab.classList.add('hidden');
        notificationBadge.classList.add('hidden');
    }
}

// 現在時刻の更新
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    currentTime.textContent = timeString;
}

// 1秒ごとに時刻を更新
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

// サイドメニューの制御
toggleSideMenu.addEventListener('click', () => {
    hideSideMenu();
});

showSideMenu.addEventListener('click', () => {
    showSideMenuFunc();
});

function hideSideMenu() {
    sideMenu.classList.add('hidden');
    showSideMenu.classList.remove('hidden');
    mainScreen.classList.remove('menu-open');
}

function showSideMenuFunc() {
    sideMenu.classList.remove('hidden');
    showSideMenu.classList.add('hidden');
    mainScreen.classList.add('menu-open');
}

// 初期状態でサイドメニューを表示
function initializeSideMenu() {
    // デスクトップでは最初から表示、モバイルでは非表示
    if (window.innerWidth > 768) {
        showSideMenuFunc();
    } else {
        hideSideMenu();
    }
}

// ウィンドウリサイズ時の処理
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        hideSideMenu();
    } else {
        showSideMenuFunc();
    }
});

// タブ切り替え
dashboardTab.addEventListener('click', () => {
    switchTab('dashboard');
});

historyTab.addEventListener('click', () => {
    switchTab('history');
    loadAttendanceHistory();
});

adminTab.addEventListener('click', () => {
    switchTab('admin');
    switchAdminTab('employeeStats');
    loadEmployeeStats();
});

// 管理画面内のタブ切り替え
employeeStatsBtn.addEventListener('click', () => {
    switchAdminTab('employeeStats');
    loadEmployeeStats();
});

notificationsBtn.addEventListener('click', () => {
    switchAdminTab('notifications');
    loadNotifications();
});

bonusesBtn.addEventListener('click', () => {
    switchAdminTab('bonuses');
    loadBonuses();
});

function switchAdminTab(tabName) {
    // ボタンの状態を切り替え
    employeeStatsBtn.classList.remove('active');
    notificationsBtn.classList.remove('active');
    bonusesBtn.classList.remove('active');
    
    // コンテンツの表示を切り替え
    employeeStatsContent.classList.add('hidden');
    notificationsContent.classList.add('hidden');
    bonusesContent.classList.add('hidden');
    
    if (tabName === 'employeeStats') {
        employeeStatsBtn.classList.add('active');
        employeeStatsContent.classList.remove('hidden');
    } else if (tabName === 'notifications') {
        notificationsBtn.classList.add('active');
        notificationsContent.classList.remove('hidden');
    } else if (tabName === 'bonuses') {
        bonusesBtn.classList.add('active');
        bonusesContent.classList.remove('hidden');
    }
}

function switchTab(tabName) {
    // タブボタンの状態を切り替え
    dashboardTab.classList.remove('active');
    historyTab.classList.remove('active');
    adminTab.classList.remove('active');
    
    // コンテンツの表示を切り替え
    dashboardContent.classList.add('hidden');
    historyContent.classList.add('hidden');
    adminContent.classList.add('hidden');
    
    if (tabName === 'dashboard') {
        dashboardTab.classList.add('active');
        dashboardContent.classList.remove('hidden');
    } else if (tabName === 'history') {
        historyTab.classList.add('active');
        historyContent.classList.remove('hidden');
    } else if (tabName === 'admin') {
        adminTab.classList.add('active');
        adminContent.classList.remove('hidden');
    }
}

// メッセージ表示
function showMessage(text, type = 'success') {
    message.textContent = text;
    message.className = `message ${type}`;
    
    // アニメーションでメッセージを表示
    setTimeout(() => {
        message.classList.add('show');
    }, 100);
    
    // 3秒後にメッセージを非表示
    setTimeout(() => {
        message.classList.remove('show');
    }, 3000);
}

// フォーム切り替え
showRegisterBtn.addEventListener('click', () => {
    loginFormContainer.classList.add('hidden');
    registerFormContainer.classList.remove('hidden');
    clearMessages();
});

showLoginBtn.addEventListener('click', () => {
    registerFormContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    clearMessages();
});

// メッセージクリア
function clearMessages() {
    loginError.textContent = '';
    registerError.textContent = '';
    registerSuccess.textContent = '';
}

// ログイン処理
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            userName.textContent = currentUser.name;
            
            // セッションを保存
            saveSession(currentUser);
            
            // オーナー権限をチェック
            checkOwnerPermissions();
            
            loginScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            loginError.textContent = '';
            
            // サイドメニューを初期化
            initializeSideMenu();
            
            // オンライン状況を取得
            loadOnlineStatus();
            
            showMessage(`${currentUser.name}さん、おかえりなさい！`);
        } else {
            loginError.textContent = result.message;
        }
    } catch (error) {
        console.error('ログインエラー:', error);
        loginError.textContent = 'ログインに失敗しました';
    }
});

// 新規登録処理
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    // パスワード確認チェック
    if (password !== passwordConfirm) {
        registerError.textContent = 'パスワードが一致しません';
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, username, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            registerError.textContent = '';
            registerSuccess.textContent = result.message + ' ログイン画面に移動します...';
            
            // 2秒後にログイン画面に切り替え
            setTimeout(() => {
                registerFormContainer.classList.add('hidden');
                loginFormContainer.classList.remove('hidden');
                
                // 登録したユーザー名をログインフォームに入力
                document.getElementById('loginUsername').value = username;
                document.getElementById('loginPassword').value = '';
                
                clearMessages();
                registerForm.reset();
            }, 2000);
        } else {
            registerError.textContent = result.message;
            registerSuccess.textContent = '';
        }
    } catch (error) {
        console.error('登録エラー:', error);
        registerError.textContent = '登録に失敗しました';
        registerSuccess.textContent = '';
    }
});

// ログアウト処理
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    
    // セッションをクリア
    clearSession();
    
    loginScreen.classList.remove('hidden');
    mainScreen.classList.add('hidden');
    
    // ログイン画面に戻る
    registerFormContainer.classList.add('hidden');
    loginFormContainer.classList.remove('hidden');
    
    // フォームをクリア
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    clearMessages();
    
    showMessage('ログアウトしました', 'success');
});

// 出勤処理
checkinBtn.addEventListener('click', async () => {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser.id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('出勤エラー:', error);
        showMessage('出勤に失敗しました', 'error');
    }
});

// 退勤処理
checkoutBtn.addEventListener('click', async () => {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUser.id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(result.message, 'success');
        } else {
            showMessage(result.message, 'error');
        }
    } catch (error) {
        console.error('退勤エラー:', error);
        showMessage('退勤に失敗しました', 'error');
    }
});

// 出勤状況の取得
async function loadAttendanceStatus() {
    try {
        const response = await fetch('/api/attendance-status');
        const attendanceStatus = await response.json();
        updateAttendanceDisplay(attendanceStatus);
    } catch (error) {
        console.error('出勤状況の取得エラー:', error);
    }
}

// 後方互換性のため
async function loadOnlineStatus() {
    await loadAttendanceStatus();
}

// 出勤履歴の取得
async function loadAttendanceHistory() {
    if (!currentUser) {
        console.error('ユーザー情報がありません');
        historyEmpty.textContent = 'ユーザー情報が見つかりません';
        historyEmpty.classList.remove('hidden');
        return;
    }
    
    try {
        historyLoading.classList.remove('hidden');
        historyEmpty.classList.add('hidden');
        attendanceHistory.innerHTML = '';
        
        console.log('履歴取得開始 - ユーザーID:', currentUser.id);
        
        const response = await fetch(`/api/attendance-history/${currentUser.id}`);
        
        console.log('レスポンス状態:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const historyData = await response.json();
        console.log('取得した履歴データ:', historyData);
        
        historyLoading.classList.add('hidden');
        
        if (!Array.isArray(historyData) || historyData.length === 0) {
            historyEmpty.textContent = '出勤履歴がありません';
            historyEmpty.classList.remove('hidden');
            return;
        }
        
        // 今月の統計を計算
        calculateMonthlySummary(historyData);
        
        // 履歴を表示
        displayAttendanceHistory(historyData);
        
    } catch (error) {
        console.error('出勤履歴の取得エラー:', error);
        historyLoading.classList.add('hidden');
        historyEmpty.textContent = `履歴の取得に失敗しました: ${error.message}`;
        historyEmpty.classList.remove('hidden');
    }
}

// 今月の統計を計算
function calculateMonthlySummary(historyData) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthRecords = historyData.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    const workingDays = thisMonthRecords.filter(record => record.checkoutTime).length;
    const totalMinutes = thisMonthRecords.reduce((sum, record) => sum + (record.totalMinutes || 0), 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    monthlyDays.textContent = `${workingDays}日`;
    monthlyHours.textContent = `${totalHours}時間${remainingMinutes}分`;
}

// 出勤履歴を表示
function displayAttendanceHistory(historyData) {
    attendanceHistory.innerHTML = historyData.map(record => {
        const date = new Date(record.date);
        const dateString = date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
        
        const checkinTime = record.checkinTime ? 
            new Date(record.checkinTime).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
            
        const checkoutTime = record.checkoutTime ? 
            new Date(record.checkoutTime).toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';
            
        const workingTime = record.checkoutTime ? 
            `${record.workingHours}時間${record.workingMinutes}分` : 
            (record.status === 'online' ? '勤務中' : '-');
            
        const statusClass = record.checkoutTime ? 'status-completed' : 'status-working';
        const statusText = record.checkoutTime ? '完了' : '勤務中';
        
        return `
            <div class="history-record">
                <div class="record-date">${dateString}</div>
                <div class="record-details">
                    <div class="record-item">
                        <span class="record-label">出勤時刻</span>
                        <span class="record-value">${checkinTime}</span>
                    </div>
                    <div class="record-item">
                        <span class="record-label">退勤時刻</span>
                        <span class="record-value">${checkoutTime}</span>
                    </div>
                    <div class="record-item">
                        <span class="record-label">勤務時間</span>
                        <span class="record-value working-hours">${workingTime}</span>
                    </div>
                    <div class="record-item">
                        <span class="record-label">状態</span>
                        <span class="record-status ${statusClass}">${statusText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 従業員統計を読み込み
async function loadEmployeeStats() {
    if (!currentUser || currentUser.role !== 'owner') return;
    
    try {
        const statsLoading = document.getElementById('statsLoading');
        const employeeStats = document.getElementById('employeeStats');
        
        statsLoading.classList.remove('hidden');
        employeeStats.innerHTML = '';
        
        const response = await fetch('/api/admin/employee-stats');
        const stats = await response.json();
        
        statsLoading.classList.add('hidden');
        
        if (stats.length === 0) {
            employeeStats.innerHTML = '<p class="empty-message">従業員データがありません</p>';
            return;
        }
        
        employeeStats.innerHTML = stats.map(employee => `
            <div class="employee-card">
                <div class="employee-name">${employee.name}</div>
                <div class="employee-stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">総出勤日数</span>
                        <span class="stat-value">${employee.totalWorkDays}日</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">連続出勤日数</span>
                        <span class="stat-value consecutive-days">${employee.consecutiveDays}日</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">今月の出勤日数</span>
                        <span class="stat-value">${employee.monthlyWorkDays}日</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">今月の勤務時間</span>
                        <span class="stat-value">${employee.monthlyHours}時間${employee.monthlyMinutes}分</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">ボーナス獲得回数</span>
                        <span class="stat-value">${employee.bonusCount}回</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">ボーナス総額</span>
                        <span class="stat-value bonus-amount">¥${employee.totalBonus.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('従業員統計の取得エラー:', error);
        document.getElementById('statsLoading').classList.add('hidden');
        document.getElementById('employeeStats').innerHTML = '<p class="empty-message">統計の取得に失敗しました</p>';
    }
}

// 通知管理を読み込み
async function loadNotifications() {
    if (!currentUser || currentUser.role !== 'owner') return;
    
    try {
        const notificationsLoading = document.getElementById('notificationsLoading');
        const notificationsList = document.getElementById('notificationsList');
        const notificationsEmpty = document.getElementById('notificationsEmpty');
        const unreadCount = document.getElementById('unreadCount');
        
        notificationsLoading.classList.remove('hidden');
        notificationsEmpty.classList.add('hidden');
        notificationsList.innerHTML = '';
        
        const response = await fetch('/api/admin/notifications');
        const notifications = await response.json();
        
        notificationsLoading.classList.add('hidden');
        
        if (notifications.length === 0) {
            notificationsEmpty.classList.remove('hidden');
            unreadCount.classList.add('hidden');
            return;
        }
        
        // 未読通知数を更新
        const unreadNotifications = notifications.filter(n => !n.read);
        if (unreadNotifications.length > 0) {
            unreadCount.textContent = unreadNotifications.length;
            unreadCount.classList.remove('hidden');
            notificationBadge.textContent = unreadNotifications.length;
            notificationBadge.classList.remove('hidden');
        } else {
            unreadCount.classList.add('hidden');
            notificationBadge.classList.add('hidden');
        }
        
        notificationsList.innerHTML = notifications.map(notification => {
            const date = new Date(notification.date).toLocaleString('ja-JP');
            const unreadClass = notification.read ? '' : 'unread';
            
            return `
                <div class="notification-item ${unreadClass}" onclick="markAsRead(${notification.id})">
                    <div class="notification-header">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-date">${date}</div>
                    </div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-details">
                        連続出勤日数: ${notification.consecutiveDays}日 | 
                        ボーナス金額: ¥${notification.bonusAmount.toLocaleString()}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('通知の取得エラー:', error);
        document.getElementById('notificationsLoading').classList.add('hidden');
        document.getElementById('notificationsEmpty').textContent = '通知の取得に失敗しました';
        document.getElementById('notificationsEmpty').classList.remove('hidden');
    }
}

// ボーナス履歴を読み込み
async function loadBonuses() {
    if (!currentUser || currentUser.role !== 'owner') return;
    
    try {
        const bonusesLoading = document.getElementById('bonusesLoading');
        const bonusesList = document.getElementById('bonusesList');
        const bonusesEmpty = document.getElementById('bonusesEmpty');
        
        bonusesLoading.classList.remove('hidden');
        bonusesEmpty.classList.add('hidden');
        bonusesList.innerHTML = '';
        
        const response = await fetch('/api/admin/bonuses');
        const bonuses = await response.json();
        
        bonusesLoading.classList.add('hidden');
        
        if (bonuses.length === 0) {
            bonusesEmpty.classList.remove('hidden');
            return;
        }
        
        bonusesList.innerHTML = bonuses.map(bonus => {
            const date = new Date(bonus.date).toLocaleString('ja-JP');
            const statusText = bonus.paid ? '支払済' : '未払い';
            const statusClass = bonus.paid ? 'status-paid' : 'status-unpaid';
            
            return `
                <div class="bonus-item">
                    <div class="bonus-header">
                        <div class="bonus-employee">${bonus.userName}</div>
                        <div class="bonus-amount-large">¥${bonus.amount.toLocaleString()}</div>
                    </div>
                    <div class="bonus-details">
                        <p><strong>連続出勤日数:</strong> ${bonus.consecutiveDays}日</p>
                        <p><strong>達成日時:</strong> ${date}</p>
                        <p><strong>支払状況:</strong> <span class="${statusClass}">${statusText}</span></p>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('ボーナス履歴の取得エラー:', error);
        document.getElementById('bonusesLoading').classList.add('hidden');
        document.getElementById('bonusesEmpty').textContent = 'ボーナス履歴の取得に失敗しました';
        document.getElementById('bonusesEmpty').classList.remove('hidden');
    }
}

// 通知を既読にする
async function markAsRead(notificationId) {
    if (!currentUser || currentUser.role !== 'owner') return;
    
    try {
        const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
            method: 'POST'
        });
        
        const result = await response.json();
        if (result.success) {
            // 通知リストを再読み込み
            loadNotifications();
        }
    } catch (error) {
        console.error('通知の既読処理エラー:', error);
    }
}

// 出勤状況表示の更新
function updateAttendanceDisplay(attendanceList) {
    const onlineUsers = attendanceList.filter(user => user.status === 'online');
    onlineCount.textContent = onlineUsers.length;
    
    if (attendanceList.length === 0) {
        document.getElementById('onlineUsers').innerHTML = '<p style="text-align: center; color: #666;">従業員がいません</p>';
        return;
    }
    
    // ユーザーを役割と出勤状況順にソート（オーナー最初 → 出勤中 → 退勤済み → 未出勤）
    const sortedList = attendanceList.sort((a, b) => {
        // まず役割でソート（オーナーが最初）
        if (a.userRole === 'owner' && b.userRole !== 'owner') return -1;
        if (a.userRole !== 'owner' && b.userRole === 'owner') return 1;
        
        // 同じ役割内では出勤状況でソート
        const statusOrder = { 'online': 0, 'offline': 1, 'absent': 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });
    
    document.getElementById('onlineUsers').innerHTML = sortedList.map(user => {
        let cardClass = 'employee-item';
        let statusClass = '';
        let statusText = '';
        let timeInfo = '';
        
        switch (user.status) {
            case 'online':
                cardClass += ' online';
                statusClass = 'status-online-text';
                statusText = '出勤中';
                if (user.checkinTime) {
                    const checkinTime = new Date(user.checkinTime).toLocaleString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    timeInfo = `${checkinTime}から出勤中`;
                }
                break;
            case 'offline':
                cardClass += ' offline';
                statusClass = 'status-offline-text';
                statusText = '退勤済み';
                if (user.checkinTime && user.checkoutTime) {
                    const checkinTime = new Date(user.checkinTime).toLocaleString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const checkoutTime = new Date(user.checkoutTime).toLocaleString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    timeInfo = `${checkinTime} - ${checkoutTime}`;
                }
                break;
            case 'absent':
                cardClass += ' absent';
                statusClass = 'status-absent-text';
                statusText = '未出勤';
                timeInfo = '本日まだ出勤していません';
                break;
        }
        
        // オーナーの場合は特別な表示
        const roleIndicator = user.userRole === 'owner' ? '<span class="role-badge owner">オーナー</span>' : '';
        
        return `
            <div class="${cardClass}">
                <div class="employee-avatar">
                    <div class="avatar-circle ${user.status} ${user.userRole === 'owner' ? 'owner-avatar' : ''}">
                        ${user.userName.charAt(0)}
                    </div>
                </div>
                <div class="employee-info">
                    <div class="employee-name">
                        ${user.userName}
                        ${roleIndicator}
                    </div>
                    <div class="employee-status ${statusClass}">${statusText}</div>
                    <div class="employee-time">${timeInfo}</div>
                </div>
                <div class="status-indicator-large status-${user.status}"></div>
            </div>
        `;
    }).join('');
}

// 後方互換性のため
function updateOnlineDisplay(usersList) {
    // 新しい形式に変換
    const attendanceList = usersList.map(user => ({
        ...user,
        status: 'online'
    }));
    updateAttendanceDisplay(attendanceList);
}

// Socket.IOイベントリスナー

// 現在のオンライン状況を受信
socket.on('currentOnlineStatus', (usersList) => {
    updateOnlineDisplay(usersList);
});

// 新しい出勤を受信
socket.on('userCheckedIn', (data) => {
    if (currentUser && data.userId !== currentUser.id) {
        showMessage(`${data.userName}さんが出勤しました`, 'success');
    }
    // 出勤状況を再取得
    loadAttendanceStatus();
});

// 退勤を受信
socket.on('userCheckedOut', (data) => {
    if (currentUser && data.userId !== currentUser.id) {
        showMessage(`${data.userName}さんが退勤しました`, 'success');
    }
    // 出勤状況を再取得
    loadAttendanceStatus();
});

// ボーナス達成通知を受信
socket.on('bonusAchieved', (notification) => {
    console.log('ボーナス達成通知を受信:', notification);
    
    // 全員にボーナス達成メッセージを表示
    showMessage(`🎉 ${notification.userName}さんが${notification.consecutiveDays}日連続出勤ボーナス（¥${notification.bonusAmount.toLocaleString()}）を達成しました！`, 'success');
    
    // オーナーの場合は通知バッジを更新
    if (currentUser && currentUser.role === 'owner') {
        updateNotificationBadge();
        
        // 管理画面の通知タブを開いている場合は自動で更新
        if (!notificationsContent.classList.contains('hidden')) {
            loadNotifications();
        }
    }
});

// 通知バッジを更新
async function updateNotificationBadge() {
    if (!currentUser || currentUser.role !== 'owner') return;
    
    try {
        const response = await fetch('/api/admin/notifications');
        const notifications = await response.json();
        const unreadNotifications = notifications.filter(n => !n.read);
        
        if (unreadNotifications.length > 0) {
            notificationBadge.textContent = unreadNotifications.length;
            notificationBadge.classList.remove('hidden');
        } else {
            notificationBadge.classList.add('hidden');
        }
    } catch (error) {
        console.error('通知バッジの更新エラー:', error);
    }
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', () => {
    // ログイン状態を復元
    restoreLoginState();
    
    // デモアカウントのクリックでフォーム入力
    const demoAccounts = document.querySelectorAll('.demo-accounts li');
    demoAccounts.forEach(account => {
        account.style.cursor = 'pointer';
        account.addEventListener('click', () => {
            const text = account.textContent;
            const [username, password] = text.split(' / ');
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').value = password;
        });
    });
});