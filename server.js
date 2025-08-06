const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// 静的ファイルの提供
app.use(express.static('public'));
app.use(express.json());

// データファイルのパス
const ACCOUNTS_FILE = path.join(__dirname, 'data', 'accounts.json');
const ATTENDANCE_FILE = path.join(__dirname, 'data', 'attendance.json');
const NOTIFICATIONS_FILE = path.join(__dirname, 'data', 'notifications.json');
const BONUSES_FILE = path.join(__dirname, 'data', 'bonuses.json');

// データディレクトリの作成
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

// アカウントデータの初期化
function initializeAccounts() {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
        const defaultAccounts = [
            { id: 1, name: "真田 小夜", username: "sanada", password: "sanada", role: "owner" }
        ];
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(defaultAccounts, null, 2));
    }
}

// 出勤データの初期化
function initializeAttendance() {
    if (!fs.existsSync(ATTENDANCE_FILE)) {
        fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify([], null, 2));
    }
}

// 通知データの初期化
function initializeNotifications() {
    if (!fs.existsSync(NOTIFICATIONS_FILE)) {
        fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
    }
}

// ボーナスデータの初期化
function initializeBonuses() {
    if (!fs.existsSync(BONUSES_FILE)) {
        fs.writeFileSync(BONUSES_FILE, JSON.stringify([], null, 2));
    }
}

// アカウント情報を取得
function getAccounts() {
    try {
        const data = fs.readFileSync(ACCOUNTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('アカウントデータの読み込みエラー:', error);
        return [];
    }
}

// 出勤データを取得
function getAttendanceData() {
    try {
        const data = fs.readFileSync(ATTENDANCE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('出勤データの読み込みエラー:', error);
        return [];
    }
}

// 出勤データを保存
function saveAttendanceData(data) {
    try {
        fs.writeFileSync(ATTENDANCE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('出勤データの保存エラー:', error);
    }
}

// 通知データを取得
function getNotifications() {
    try {
        const data = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('通知データの読み込みエラー:', error);
        return [];
    }
}

// 通知データを保存
function saveNotifications(data) {
    try {
        fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('通知データの保存エラー:', error);
    }
}

// ボーナスデータを取得
function getBonuses() {
    try {
        const data = fs.readFileSync(BONUSES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('ボーナスデータの読み込みエラー:', error);
        return [];
    }
}

// ボーナスデータを保存
function saveBonuses(data) {
    try {
        fs.writeFileSync(BONUSES_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('ボーナスデータの保存エラー:', error);
    }
}

// 現在の出勤状況を取得（全ユーザー）
function getCurrentAttendanceStatus() {
    const accounts = getAccounts();
    const attendanceData = getAttendanceData();
    const today = new Date().toISOString().split('T')[0];
    
    // 全ユーザー（オーナーと従業員）を含める
    const allUsers = accounts;
    
    return allUsers.map(user => {
        const todayRecord = attendanceData.find(record => 
            record.userId === user.id && record.date === today
        );
        
        if (todayRecord) {
            return {
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                date: today,
                checkinTime: todayRecord.checkinTime,
                checkoutTime: todayRecord.checkoutTime,
                status: todayRecord.status
            };
        } else {
            return {
                userId: user.id,
                userName: user.name,
                userRole: user.role,
                date: today,
                checkinTime: null,
                checkoutTime: null,
                status: 'absent'
            };
        }
    });
}

// 現在のオンライン状況を取得（後方互換性のため）
function getCurrentOnlineStatus() {
    const attendanceData = getAttendanceData();
    const today = new Date().toISOString().split('T')[0];
    
    return attendanceData.filter(record => 
        record.date === today && record.status === 'online'
    );
}

// 連続出勤日数をチェック
function checkConsecutiveDays(userId) {
    const attendanceData = getAttendanceData();
    const userRecords = attendanceData
        .filter(record => record.userId === userId && record.checkoutTime)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (userRecords.length === 0) return 0;
    
    let consecutiveDays = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < userRecords.length; i++) {
        const recordDate = new Date(userRecords[i].date);
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        // 日付を比較（時間は無視）
        if (recordDate.toDateString() === expectedDate.toDateString()) {
            consecutiveDays++;
        } else {
            break;
        }
    }
    
    return consecutiveDays;
}

// ボーナス通知を作成
function createBonusNotification(userId, consecutiveDays) {
    const accounts = getAccounts();
    const user = accounts.find(account => account.id === userId);
    if (!user) return;
    
    const notifications = getNotifications();
    const bonuses = getBonuses();
    
    const bonusAmount = 1000000; // 100万円
    const bonusId = Date.now();
    
    // ボーナス記録を保存
    const bonusRecord = {
        id: bonusId,
        userId: userId,
        userName: user.name,
        consecutiveDays: consecutiveDays,
        amount: bonusAmount,
        date: new Date().toISOString(),
        paid: false
    };
    
    bonuses.push(bonusRecord);
    saveBonuses(bonuses);
    
    // 通知を作成
    const notification = {
        id: Date.now(),
        type: 'bonus',
        title: '🎉 連続出勤ボーナス達成！',
        message: `${user.name}さんが${consecutiveDays}日連続出勤を達成し、${bonusAmount.toLocaleString()}円のボーナスを獲得しました！`,
        userId: userId,
        userName: user.name,
        consecutiveDays: consecutiveDays,
        bonusAmount: bonusAmount,
        date: new Date().toISOString(),
        read: false
    };
    
    notifications.push(notification);
    saveNotifications(notifications);
    
    // Socket.IOで全クライアントに通知
    io.emit('bonusAchieved', notification);
    
    console.log(`ボーナス通知作成: ${user.name} - ${consecutiveDays}日連続出勤`);
}

// API エンドポイント

// ログイン
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const accounts = getAccounts();
    
    const user = accounts.find(account => 
        account.username === username && account.password === password
    );
    
    if (user) {
        res.json({ success: true, user: { id: user.id, name: user.name, username: user.username, role: user.role || 'employee' } });
    } else {
        res.json({ success: false, message: 'ユーザー名またはパスワードが間違っています' });
    }
});

// 新規登録
app.post('/api/register', (req, res) => {
    const { name, username, password } = req.body;
    
    // 入力検証
    if (!name || !username || !password) {
        return res.json({ success: false, message: '全ての項目を入力してください' });
    }
    
    if (username.length < 3) {
        return res.json({ success: false, message: 'ユーザー名は3文字以上で入力してください' });
    }
    
    if (password.length < 6) {
        return res.json({ success: false, message: 'パスワードは6文字以上で入力してください' });
    }
    
    const accounts = getAccounts();
    
    // ユーザー名の重複チェック
    const existingUser = accounts.find(account => account.username === username);
    if (existingUser) {
        return res.json({ success: false, message: 'このユーザー名は既に使用されています' });
    }
    
    // 新しいIDを生成
    const newId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
    
    // 新しいアカウントを作成
    const newAccount = {
        id: newId,
        name: name,
        username: username,
        password: password,
        role: 'employee'
    };
    
    accounts.push(newAccount);
    
    // ファイルに保存
    try {
        fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
        res.json({ 
            success: true, 
            message: 'アカウントが作成されました',
            user: { id: newAccount.id, name: newAccount.name, username: newAccount.username, role: newAccount.role }
        });
    } catch (error) {
        console.error('アカウント保存エラー:', error);
        res.json({ success: false, message: 'アカウントの作成に失敗しました' });
    }
});

// 出勤
app.post('/api/checkin', (req, res) => {
    const { userId } = req.body;
    const accounts = getAccounts();
    const user = accounts.find(account => account.id === userId);
    
    if (!user) {
        return res.json({ success: false, message: 'ユーザーが見つかりません' });
    }
    
    const attendanceData = getAttendanceData();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    // 今日の出勤記録があるかチェック
    const existingRecord = attendanceData.find(record => 
        record.userId === userId && record.date === today
    );
    
    if (existingRecord && existingRecord.status === 'online') {
        return res.json({ success: false, message: '既に出勤済みです' });
    }
    
    // 新しい出勤記録を追加または更新
    if (existingRecord) {
        existingRecord.checkinTime = now;
        existingRecord.status = 'online';
        existingRecord.checkoutTime = null;
    } else {
        attendanceData.push({
            userId: userId,
            userName: user.name,
            date: today,
            checkinTime: now,
            checkoutTime: null,
            status: 'online'
        });
    }
    
    saveAttendanceData(attendanceData);
    
    // リアルタイムで他のクライアントに通知
    io.emit('userCheckedIn', {
        userId: userId,
        userName: user.name,
        checkinTime: now
    });
    
    res.json({ success: true, message: '出勤しました' });
});

// 退勤
app.post('/api/checkout', (req, res) => {
    const { userId } = req.body;
    const attendanceData = getAttendanceData();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    
    const record = attendanceData.find(record => 
        record.userId === userId && record.date === today && record.status === 'online'
    );
    
    if (!record) {
        return res.json({ success: false, message: '出勤記録が見つかりません' });
    }
    
    record.checkoutTime = now;
    record.status = 'offline';
    
    saveAttendanceData(attendanceData);
    
    // 連続出勤日数をチェック
    const consecutiveDays = checkConsecutiveDays(userId);
    console.log(`${record.userName}の連続出勤日数: ${consecutiveDays}日`);
    
    // 7日の倍数でボーナス通知を作成
    if (consecutiveDays > 0 && consecutiveDays % 7 === 0) {
        createBonusNotification(userId, consecutiveDays);
    }
    
    // リアルタイムで他のクライアントに通知
    io.emit('userCheckedOut', {
        userId: userId,
        userName: record.userName,
        checkoutTime: now
    });
    
    res.json({ success: true, message: '退勤しました' });
});

// 現在のオンライン状況を取得
app.get('/api/online-status', (req, res) => {
    const onlineUsers = getCurrentOnlineStatus();
    res.json(onlineUsers);
});

// 現在の出勤状況を取得（全従業員）
app.get('/api/attendance-status', (req, res) => {
    const attendanceStatus = getCurrentAttendanceStatus();
    res.json(attendanceStatus);
});

// 個人の出勤履歴を取得
app.get('/api/attendance-history/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const attendanceData = getAttendanceData();
    
    // 指定されたユーザーの出勤記録を取得
    const userRecords = attendanceData.filter(record => record.userId === userId);
    
    // 日付順（新しい順）でソート
    userRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 出勤時間を計算
    const processedRecords = userRecords.map(record => {
        let workingHours = 0;
        let workingMinutes = 0;
        
        if (record.checkinTime && record.checkoutTime) {
            const checkin = new Date(record.checkinTime);
            const checkout = new Date(record.checkoutTime);
            const diffMs = checkout - checkin;
            const diffMinutes = Math.floor(diffMs / (1000 * 60));
            workingHours = Math.floor(diffMinutes / 60);
            workingMinutes = diffMinutes % 60;
        }
        
        return {
            date: record.date,
            checkinTime: record.checkinTime,
            checkoutTime: record.checkoutTime,
            status: record.status,
            workingHours,
            workingMinutes,
            totalMinutes: workingHours * 60 + workingMinutes
        };
    });
    
    res.json(processedRecords);
});

// オーナー専用: 全従業員の出勤統計を取得
app.get('/api/admin/employee-stats', (req, res) => {
    const accounts = getAccounts();
    const attendanceData = getAttendanceData();
    const bonuses = getBonuses();
    
    const employees = accounts.filter(account => account.role === 'employee');
    
    const stats = employees.map(employee => {
        const userRecords = attendanceData.filter(record => record.userId === employee.id);
        const completedDays = userRecords.filter(record => record.checkoutTime).length;
        const consecutiveDays = checkConsecutiveDays(employee.id);
        const userBonuses = bonuses.filter(bonus => bonus.userId === employee.id);
        const totalBonus = userBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
        
        // 今月の勤務時間計算
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonthRecords = userRecords.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === currentMonth && 
                   recordDate.getFullYear() === currentYear &&
                   record.checkoutTime;
        });
        
        const monthlyMinutes = thisMonthRecords.reduce((sum, record) => {
            if (record.checkinTime && record.checkoutTime) {
                const checkin = new Date(record.checkinTime);
                const checkout = new Date(record.checkoutTime);
                return sum + Math.floor((checkout - checkin) / (1000 * 60));
            }
            return sum;
        }, 0);
        
        return {
            id: employee.id,
            name: employee.name,
            username: employee.username,
            totalWorkDays: completedDays,
            consecutiveDays: consecutiveDays,
            monthlyWorkDays: thisMonthRecords.length,
            monthlyHours: Math.floor(monthlyMinutes / 60),
            monthlyMinutes: monthlyMinutes % 60,
            totalBonus: totalBonus,
            bonusCount: userBonuses.length
        };
    });
    
    res.json(stats);
});

// オーナー専用: 通知一覧を取得
app.get('/api/admin/notifications', (req, res) => {
    const notifications = getNotifications();
    res.json(notifications.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// オーナー専用: 通知を既読にする
app.post('/api/admin/notifications/:id/read', (req, res) => {
    const notificationId = parseInt(req.params.id);
    const notifications = getNotifications();
    
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveNotifications(notifications);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: '通知が見つかりません' });
    }
});

// オーナー専用: ボーナス一覧を取得
app.get('/api/admin/bonuses', (req, res) => {
    const bonuses = getBonuses();
    res.json(bonuses.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// 開発用: テスト通知を作成
app.post('/api/admin/create-test-notification', (req, res) => {
    const { userId, consecutiveDays } = req.body;
    
    if (!userId || !consecutiveDays) {
        return res.json({ success: false, message: 'パラメーターが不足しています' });
    }
    
    createBonusNotification(userId, consecutiveDays);
    res.json({ success: true, message: 'テスト通知を作成しました' });
});

// Socket.IO 接続処理
io.on('connection', (socket) => {
    console.log('ユーザーが接続しました:', socket.id);
    
    // 接続時に現在のオンライン状況を送信
    const onlineUsers = getCurrentOnlineStatus();
    socket.emit('currentOnlineStatus', onlineUsers);
    
    socket.on('disconnect', () => {
        console.log('ユーザーが切断しました:', socket.id);
    });
});

// 初期化
initializeAccounts();
initializeAttendance();
initializeNotifications();
initializeBonuses();

// サーバー起動
server.listen(PORT, () => {
    console.log(`サーバーがポート${PORT}で起動しました`);
    console.log(`http://localhost:${PORT} でアクセスできます`);
});