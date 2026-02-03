// ==============================================
// DATABASE PROFIL UNTUK GRUPCHAT REAL-TIME
// ==============================================

class ProfileDatabase {
    constructor() {
        this.dbName = 'chatAppProfilesDB';
        this.roomId = 'main_chat_room';
        this.initDatabase();
    }

    // ======================
    // INITIALIZATION
    // ======================
    initDatabase() {
        if (!localStorage.getItem(this.dbName)) {
            const initialDB = {
                version: '3.0',
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                
                // SEMUA USER DISIMPAN DI SINI
                users: [
                    // Contoh user default
                    {
                        id: 'user_default_1',
                        username: 'julyant',
                        displayName: 'July Ant',
                        avatarId: 1,
                        colorHex: '#6a11cb',
                        isOnline: false,
                        lastSeen: new Date().toISOString(),
                        createdAt: new Date().toISOString(),
                        stats: {
                            messageCount: 0,
                            loginCount: 0
                        }
                    }
                ],
                
                // ROOM UTAMA
                rooms: [
                    {
                        id: this.roomId,
                        name: 'Private Group Chat',
                        password: 'icebear',
                        created: new Date().toISOString(),
                        isActive: true,
                        maxUsers: 100,
                        currentUsers: 0
                    }
                ],
                
                // SEMUA MESSAGE DISIMPAN DI SINI
                messages: [],
                
                // SESI AKTIF
                sessions: [],
                
                // STATISTIK
                stats: {
                    totalUsers: 1,
                    totalMessages: 0,
                    activeUsers: 0
                }
            };
            this.saveDB(initialDB);
        }
    }

    // ======================
    // PROFILE MANAGEMENT
    // ======================
    
    // BUAT PROFILE BARU (atau pakai yang sudah ada)
    createOrGetProfile(username, displayName, avatarId = 1, colorHex = '#6a11cb') {
        const db = this.loadDB();
        
        // Cari user yang sudah ada
        let user = db.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() || 
            u.displayName.toLowerCase() === displayName.toLowerCase()
        );
        
        if (user) {
            // User sudah ada, update last seen
            user.lastSeen = new Date().toISOString();
            user.isOnline = true;
            this.saveDB(db);
            
            return {
                success: true,
                isNew: false,
                user: user
            };
        } else {
            // Buat user baru
            const newUser = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                username: username,
                displayName: displayName,
                avatarId: avatarId,
                colorHex: colorHex,
                isOnline: true,
                lastSeen: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                stats: {
                    messageCount: 0,
                    loginCount: 1
                }
            };
            
            db.users.push(newUser);
            db.stats.totalUsers++;
            this.saveDB(db);
            
            return {
                success: true,
                isNew: true,
                user: newUser
            };
        }
    }
    
    // UPDATE PROFILE (nama, avatar, warna)
    updateProfile(userId, updates) {
        const db = this.loadDB();
        const userIndex = db.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            return { success: false, error: 'User tidak ditemukan' };
        }
        
        db.users[userIndex] = {
            ...db.users[userIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveDB(db);
        return { success: true, user: db.users[userIndex] };
    }
    
    // GET USER BY ID
    getUserById(userId) {
        const db = this.loadDB();
        return db.users.find(u => u.id === userId);
    }
    
    // GET USER BY USERNAME
    getUserByUsername(username) {
        const db = this.loadDB();
        return db.users.find(u => 
            u.username.toLowerCase() === username.toLowerCase()
        );
    }
    
    // GET ALL USERS
    getAllUsers() {
        const db = this.loadDB();
        return db.users;
    }
    
    // GET ONLINE USERS
    getOnlineUsers() {
        const db = this.loadDB();
        return db.users.filter(u => u.isOnline);
    }
    
    // UPDATE USER ONLINE STATUS
    updateUserOnlineStatus(userId, isOnline) {
        const db = this.loadDB();
        const userIndex = db.users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            db.users[userIndex].isOnline = isOnline;
            db.users[userIndex].lastSeen = new Date().toISOString();
            
            // Update stats
            if (isOnline) {
                db.stats.activeUsers++;
            } else {
                db.stats.activeUsers = Math.max(0, db.stats.activeUsers - 1);
            }
            
            this.saveDB(db);
            return true;
        }
        return false;
    }
    
    // ======================
    // MESSAGE MANAGEMENT
    // ======================
    
    // SAVE MESSAGE dengan USER ID
    saveMessage(userId, messageText) {
        const db = this.loadDB();
        const user = db.users.find(u => u.id === userId);
        
        if (!user) {
            return { success: false, error: 'User tidak ditemukan' };
        }
        
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            username: user.username,
            displayName: user.displayName,
            avatarId: user.avatarId,
            colorHex: user.colorHex,
            text: messageText,
            timestamp: new Date().toISOString(),
            roomId: this.roomId,
            isDeleted: false,
            // 💡 SIMPAN SESSION ID untuk tracking bubble position
            sessionId: null // Akan diisi oleh chat app
        };
        
        db.messages.push(message);
        db.stats.totalMessages++;
        
        // Update user message count
        user.stats.messageCount++;
        
        this.saveDB(db);
        return { success: true, message: message };
    }
    
    // GET ALL MESSAGES (untuk load chat history)
    getAllMessages(limit = 200) {
        const db = this.loadDB();
        return db.messages
            .filter(m => !m.isDeleted && m.roomId === this.roomId)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-limit);
    }
    
    // GET USER MESSAGES
    getUserMessages(userId, limit = 50) {
        const db = this.loadDB();
        return db.messages
            .filter(m => m.userId === userId && !m.isDeleted)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }
    
    // DELETE MESSAGE
    deleteMessage(messageId) {
        const db = this.loadDB();
        const msgIndex = db.messages.findIndex(m => m.id === messageId);
        
        if (msgIndex !== -1) {
            db.messages[msgIndex].isDeleted = true;
            this.saveDB(db);
            return { success: true };
        }
        
        return { success: false, error: 'Message tidak ditemukan' };
    }
    
    // ======================
    // ROOM MANAGEMENT
    // ======================
    
    // VERIFY ROOM PASSWORD
    verifyRoomPassword(password) {
        const db = this.loadDB();
        const room = db.rooms.find(r => r.id === this.roomId);
        
        if (!room) {
            return { success: false, error: 'Room tidak ditemukan' };
        }
        
        if (room.password !== password) {
            return { success: false, error: 'Password salah' };
        }
        
        return { success: true, room: room };
    }
    
    // UPDATE ROOM USER COUNT
    updateRoomUserCount(change) {
        const db = this.loadDB();
        const roomIndex = db.rooms.findIndex(r => r.id === this.roomId);
        
        if (roomIndex !== -1) {
            db.rooms[roomIndex].currentUsers += change;
            this.saveDB(db);
            return true;
        }
        return false;
    }
    
    // ======================
    // SESSION MANAGEMENT (untuk bubble position)
    // ======================
    
    // CREATE SESSION untuk tracking bubble
    createSession(userId) {
        const db = this.loadDB();
        
        const session = {
            id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            startedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            isActive: true
        };
        
        db.sessions.push(session);
        this.saveDB(db);
        
        return session;
    }
    
    // UPDATE SESSION ACTIVITY
    updateSessionActivity(sessionId) {
        const db = this.loadDB();
        const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex !== -1) {
            db.sessions[sessionIndex].lastActivity = new Date().toISOString();
            this.saveDB(db);
            return true;
        }
        return false;
    }
    
    // END SESSION
    endSession(sessionId) {
        const db = this.loadDB();
        const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex !== -1) {
            db.sessions[sessionIndex].isActive = false;
            db.sessions[sessionIndex].endedAt = new Date().toISOString();
            this.saveDB(db);
            return true;
        }
        return false;
    }
    
    // GET USER ACTIVE SESSIONS
    getUserActiveSessions(userId) {
        const db = this.loadDB();
        return db.sessions.filter(s => 
            s.userId === userId && s.isActive
        );
    }
    
    // CLEAN INACTIVE SESSIONS (> 5 menit)
    cleanInactiveSessions() {
        const db = this.loadDB();
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const inactiveSessions = db.sessions.filter(s => 
            s.isActive && s.lastActivity < fiveMinutesAgo
        );
        
        inactiveSessions.forEach(session => {
            session.isActive = false;
            session.endedAt = new Date().toISOString();
            
            // Update user online status jika tidak ada session aktif lain
            const userActiveSessions = db.sessions.filter(s => 
                s.userId === session.userId && s.isActive
            );
            
            if (userActiveSessions.length === 0) {
                const userIndex = db.users.findIndex(u => u.id === session.userId);
                if (userIndex !== -1) {
                    db.users[userIndex].isOnline = false;
                }
            }
        });
        
        this.saveDB(db);
        return inactiveSessions.length;
    }
    
    // ======================
    // BUBBLE POSITION LOGIC
    // ======================
    
    // 💡 FUNGSI PENTING: Tentukan bubble position berdasarkan SESSION
    getBubblePosition(message, currentSessionId, currentUserId) {
        // Jika message punya sessionId, bandingkan dengan session saat ini
        if (message.sessionId) {
            // Jika sessionId SAMA → bubble KANAN (dari session ini)
            if (message.sessionId === currentSessionId) {
                return 'right';
            }
            // Jika sessionId BERBEDA → bubble KIRI (dari session lain)
            return 'left';
        }
        
        // Jika tidak ada sessionId (message lama), cek user ID
        if (message.userId === currentUserId) {
            return 'right';
        }
        
        return 'left';
    }
    
    // ADD SESSION ID TO MESSAGE (untuk tracking bubble)
    addSessionIdToMessage(messageId, sessionId) {
        const db = this.loadDB();
        const msgIndex = db.messages.findIndex(m => m.id === messageId);
        
        if (msgIndex !== -1) {
            db.messages[msgIndex].sessionId = sessionId;
            this.saveDB(db);
            return true;
        }
        return false;
    }
    
    // ======================
    // STATISTICS
    // ======================
    
    // GET DATABASE STATS
    getStats() {
        const db = this.loadDB();
        
        return {
            users: {
                total: db.stats.totalUsers,
                online: db.users.filter(u => u.isOnline).length,
                active: db.stats.activeUsers
            },
            messages: {
                total: db.stats.totalMessages,
                today: this.getMessagesToday(),
                thisMonth: this.getMessagesThisMonth()
            },
            room: {
                name: db.rooms.find(r => r.id === this.roomId)?.name || 'Unknown',
                currentUsers: db.rooms.find(r => r.id === this.roomId)?.currentUsers || 0
            },
            storage: {
                size: this.getDBSize(),
                lastUpdated: db.lastUpdated
            }
        };
    }
    
    // GET USER STATS
    getUserStats(userId) {
        const db = this.loadDB();
        const user = db.users.find(u => u.id === userId);
        
        if (!user) {
            return null;
        }
        
        const userMessages = db.messages.filter(m => 
            m.userId === userId && !m.isDeleted
        );
        
        const activeSessions = db.sessions.filter(s => 
            s.userId === userId && s.isActive
        ).length;
        
        return {
            profile: {
                username: user.username,
                displayName: user.displayName,
                avatarId: user.avatarId,
                colorHex: user.colorHex,
                joined: user.createdAt,
                lastSeen: user.lastSeen,
                isOnline: user.isOnline
            },
            activity: {
                messageCount: user.stats.messageCount,
                loginCount: user.stats.loginCount || 0,
                activeSessions: activeSessions,
                lastMessage: userMessages.length > 0 ? 
                    userMessages[userMessages.length - 1].timestamp : null
            },
            ranking: this.getUserRanking(userId)
        };
    }
    
    // GET USER RANKING (berdasarkan jumlah message)
    getUserRanking(userId) {
        const db = this.loadDB();
        
        const sortedUsers = [...db.users]
            .sort((a, b) => b.stats.messageCount - a.stats.messageCount);
        
        const rank = sortedUsers.findIndex(u => u.id === userId) + 1;
        const totalUsers = sortedUsers.length;
        
        return {
            rank: rank,
            total: totalUsers,
            percentile: Math.round((rank / totalUsers) * 100)
        };
    }
    
    // GET MESSAGES TODAY
    getMessagesToday() {
        const db = this.loadDB();
        const today = new Date().toDateString();
        
        return db.messages.filter(m => {
            const msgDate = new Date(m.timestamp).toDateString();
            return msgDate === today && !m.isDeleted;
        }).length;
    }
    
    // GET MESSAGES THIS MONTH
    getMessagesThisMonth() {
        const db = this.loadDB();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return db.messages.filter(m => {
            const msgDate = new Date(m.timestamp);
            return msgDate.getMonth() === currentMonth &&
                   msgDate.getFullYear() === currentYear &&
                   !m.isDeleted;
        }).length;
    }
    
    // ======================
    // BACKUP & RESTORE
    // ======================
    
    // EXPORT DATABASE
    exportDatabase() {
        const db = this.loadDB();
        const exportData = {
            ...db,
            exportInfo: {
                exportedAt: new Date().toISOString(),
                version: db.version,
                roomId: this.roomId
            }
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // IMPORT DATABASE
    importDatabase(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            // Validasi
            if (!importData.users || !importData.messages) {
                throw new Error('Format database tidak valid');
            }
            
            // Simpan sebagai backup dulu
            this.createBackup();
            
            // Ganti database
            localStorage.setItem(this.dbName, jsonData);
            
            return {
                success: true,
                imported: {
                    users: importData.users.length,
                    messages: importData.messages.length
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // CREATE BACKUP
    createBackup(backupName = 'manual_backup') {
        const backupData = this.exportDatabase();
        const backupKey = `${this.dbName}_backup_${backupName}_${Date.now()}`;
        
        localStorage.setItem(backupKey, backupData);
        this.cleanOldBackups(3);
        
        return backupKey;
    }
    
    // LIST BACKUPS
    listBackups() {
        const backups = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(`${this.dbName}_backup_`)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    backups.push({
                        key: key,
                        timestamp: key.split('_').pop(),
                        users: data.users?.length || 0,
                        messages: data.messages?.length || 0,
                        date: data.exportInfo?.exportedAt || data.lastUpdated
                    });
                } catch (e) {
                    // Skip invalid
                }
            }
        }
        
        return backups.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    // CLEAN OLD BACKUPS
    cleanOldBackups(keep = 3) {
        const backups = this.listBackups();
        
        if (backups.length > keep) {
            const toRemove = backups.slice(keep);
            toRemove.forEach(backup => {
                localStorage.removeItem(backup.key);
            });
        }
    }
    
    // ======================
    // UTILITY FUNCTIONS
    // ======================
    
    // GET DATABASE SIZE
    getDBSize() {
        const data = localStorage.getItem(this.dbName);
        if (!data) return '0 KB';
        
        const bytes = new Blob([data]).size;
        const kb = bytes / 1024;
        
        if (kb < 1024) {
            return `${kb.toFixed(2)} KB`;
        }
        return `${(kb / 1024).toFixed(2)} MB`;
    }
    
    // CLEAR ALL DATA (HATI-HATI!)
    clearAllData() {
        localStorage.removeItem(this.dbName);
        this.initDatabase();
        return true;
    }
    
    resetRoom() {
    const db = this.loadDB();
    
    if (!db) return false;
    
    try {
        // 💡 Hanya reset messages, tapi KEEP sessions dan user status
        db.messages = [];
        db.stats.totalMessages = 0;
        
        // 💡 JANGAN reset sessions - biarkan session aktif tetap ada
        // db.sessions = []; // JANGAN LAKUKAN INI!
        
        // 💡 JANGAN ubah user.isOnline - biarkan status asli
        // db.users.forEach(user => { user.isOnline = false; }); // JANGAN!
        
        // 💡 Hitung ulang activeUsers berdasarkan sessions aktif
        const activeSessions = db.sessions.filter(s => s.isActive);
        db.stats.activeUsers = activeSessions.length;
        
        // 💡 Update room user count
        const roomIndex = db.rooms.findIndex(r => r.id === this.roomId);
        if (roomIndex !== -1) {
            db.rooms[roomIndex].currentUsers = activeSessions.length;
        }
        
        this.saveDB(db);
        return true;
        
    } catch (error) {
        console.error('Error resetting room:', error);
        return false;
    }
}
    
    // ======================
    // LOW-LEVEL DB OPERATIONS
    // ======================
    
    // LOAD DATABASE
    loadDB() {
        const data = localStorage.getItem(this.dbName);
        return data ? JSON.parse(data) : null;
    }
    
    // SAVE DATABASE
    saveDB(data) {
        data.lastUpdated = new Date().toISOString();
        localStorage.setItem(this.dbName, JSON.stringify(data));
    }
}

// ======================
// CREATE GLOBAL INSTANCE
// ======================
const profileDB = new ProfileDatabase();

// Export
if (typeof window !== 'undefined') {
    window.ProfileDatabase = profileDB;
}