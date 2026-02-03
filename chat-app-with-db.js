// ==============================================
// CHAT APP DENGAN DATABASE PROFIL + DELETE ALL CHAT
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // CONFIGURATION
    // ======================
    const ROOM_PASSWORD = "icebear";
    const db = window.ProfileDatabase || profileDB;
    
    // ======================
    // STATE MANAGEMENT
    // ======================
    let currentUser = null;
    let currentSession = null;
    let messages = [];
    let isDarkTheme = false;
    let typingTimeout = null;
    
    // ======================
    // DOM ELEMENTS
    // ======================
    const passwordScreen = document.getElementById('password-screen');
    const profileScreen = document.getElementById('profile-screen');
    const chatScreen = document.getElementById('chat-screen');
    const roomPasswordInput = document.getElementById('room-password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const joinRoomBtn = document.getElementById('join-room');
    const backToPasswordBtn = document.getElementById('back-to-password');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const userNameInput = document.getElementById('user-name');
    const charCount = document.getElementById('char-count');
    const colorOptions = document.querySelectorAll('.color-option');
    const enterChatBtn = document.getElementById('enter-chat');
    const usersPreview = document.getElementById('users-preview');
    const backToProfileBtn = document.getElementById('back-to-profile');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const toggleSidebarMobileBtn = document.getElementById('toggle-sidebar-mobile');
    const sidebar = document.getElementById('sidebar');
    const usersOnline = document.getElementById('users-online');
    const leaveRoomBtn = document.getElementById('leave-room');
    const onlineCount = document.getElementById('online-count');
    const roomInfoBtn = document.getElementById('room-info-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const clearChatBtn = document.getElementById('clear-chat');
    const chatArea = document.getElementById('chat-area');
    const messageInput = document.getElementById('message-input');
    const emojiBtn = document.getElementById('emoji-btn');
    const sendBtn = document.getElementById('send-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const roomInfoModal = document.getElementById('room-info-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .emoji-close');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const toast = document.getElementById('toast');
    
    // ======================
    // INITIALIZATION
    // ======================
    function init() {
        loadTheme();
        setupEventListeners();
        updateUsersPreview();
    }
    
    // ======================
    // EVENT LISTENERS
    // ======================
    function setupEventListeners() {
        // Password Screen
        togglePasswordBtn.addEventListener('click', togglePasswordVisibility);
        joinRoomBtn.addEventListener('click', joinRoom);
        roomPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') joinRoom();
        });
        
        // Profile Screen
        backToPasswordBtn.addEventListener('click', () => {
            profileScreen.classList.remove('active');
            passwordScreen.classList.add('active');
        });
        
        avatarOptions.forEach(option => {
            option.addEventListener('click', () => {
                selectAvatar(option.dataset.avatar);
            });
        });
        
        userNameInput.addEventListener('input', updateCharCount);
        userNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') enterChat();
        });
        
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                selectColor(option.dataset.color);
            });
        });
        
        enterChatBtn.addEventListener('click', enterChat);
        
        // Chat Screen
        backToProfileBtn.addEventListener('click', () => {
            chatScreen.classList.remove('active');
            profileScreen.classList.add('active');
        });
        
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
        toggleSidebarMobileBtn.addEventListener('click', toggleSidebarMobile);
        leaveRoomBtn.addEventListener('click', leaveRoom);
        roomInfoBtn.addEventListener('click', showRoomInfo);
        themeToggle.addEventListener('click', toggleTheme);
        clearChatBtn.addEventListener('click', showClearChatConfirm);
        
        messageInput.addEventListener('input', handleTyping);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        emojiBtn.addEventListener('click', () => {
            document.getElementById('emoji-picker').classList.toggle('active');
        });
        
        sendBtn.addEventListener('click', sendMessage);
        
        // Emoji Picker
        document.querySelectorAll('.emoji-grid span').forEach(emoji => {
            emoji.addEventListener('click', () => {
                messageInput.value += emoji.textContent;
                messageInput.focus();
                document.getElementById('emoji-picker').classList.remove('active');
            });
        });
        
        // Modals
        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                roomInfoModal.classList.remove('active');
                confirmModal.classList.remove('active');
                document.getElementById('emoji-picker').classList.remove('active');
            });
        });
        
        cancelDeleteBtn.addEventListener('click', () => {
            confirmModal.classList.remove('active');
        });
        
        confirmDeleteBtn.addEventListener('click', clearAllChats);
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === roomInfoModal) roomInfoModal.classList.remove('active');
            if (e.target === confirmModal) confirmModal.classList.remove('active');
            if (e.target === document.getElementById('emoji-picker')) {
                document.getElementById('emoji-picker').classList.remove('active');
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
    }
    
    // ======================
    // PASSWORD SCREEN FUNCTIONS
    // ======================
    function togglePasswordVisibility() {
        const type = roomPasswordInput.getAttribute('type');
        roomPasswordInput.setAttribute('type', type === 'password' ? 'text' : 'password');
        togglePasswordBtn.innerHTML = type === 'password' ? 
            '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    }
    
    function joinRoom() {
        const password = roomPasswordInput.value.trim();
        
        if (!password) {
            showToast('Masukkan password room', 'error');
            return;
        }
        
        // Verify password dengan database
        const verifyResult = db.verifyRoomPassword(password);
        if (!verifyResult.success) {
            showToast(verifyResult.error, 'error');
            roomPasswordInput.value = '';
            roomPasswordInput.focus();
            return;
        }
        
        // Success
        passwordScreen.classList.remove('active');
        profileScreen.classList.add('active');
        
        // Set default
        selectAvatar('1');
        selectColor('#6a11cb');
        userNameInput.value = '';
        
        showToast('Berhasil masuk room!', 'success');
    }
    
    // ======================
    // PROFILE SCREEN FUNCTIONS
    // ======================
    function selectAvatar(avatarId) {
        avatarOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        const selected = document.querySelector(`[data-avatar="${avatarId}"]`);
        if (selected) selected.classList.add('selected');
    }
    
    function selectColor(color) {
        colorOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        const selected = document.querySelector(`[data-color="${color}"]`);
        if (selected) selected.classList.add('selected');
    }
    
    function updateCharCount() {
        const count = userNameInput.value.length;
        charCount.textContent = count;
        charCount.style.color = count === 20 ? '#ff6b6b' : 'var(--text-secondary)';
    }
    
    function updateUsersPreview() {
        const onlineUsers = db.getOnlineUsers();
        
        usersPreview.innerHTML = '';
        
        if (onlineUsers.length === 0) {
            const badge = document.createElement('div');
            badge.className = 'user-badge';
            badge.innerHTML = `
                <span class="user-dot online"></span>
                <span>Anda akan menjadi yang pertama</span>
            `;
            usersPreview.appendChild(badge);
            return;
        }
        
        // Show max 3 users in preview
        onlineUsers.slice(0, 3).forEach(user => {
            const badge = document.createElement('div');
            badge.className = 'user-badge';
            badge.innerHTML = `
                <span class="user-dot online"></span>
                <span>${user.displayName || user.username}</span>
            `;
            usersPreview.appendChild(badge);
        });
        
        if (onlineUsers.length > 3) {
            const moreBadge = document.createElement('div');
            moreBadge.className = 'user-badge';
            moreBadge.innerHTML = `
                <span>+${onlineUsers.length - 3} lainnya</span>
            `;
            usersPreview.appendChild(moreBadge);
        }
    }
    
    function enterChat() {
        const userName = userNameInput.value.trim();
        const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || '#6a11cb';
        const selectedAvatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || '1';
        
        if (!userName) {
            showToast('Masukkan nama Anda', 'error');
            userNameInput.focus();
            return;
        }
        
        if (userName.length < 2) {
            showToast('Nama minimal 2 karakter', 'error');
            return;
        }
        
        // 💡 GUNAKAN DATABASE: Create atau get profile
        const profileResult = db.createOrGetProfile(
            userName,
            userName, // display name
            selectedAvatar,
            selectedColor
        );
        
        if (!profileResult.success) {
            showToast('Gagal membuat profil', 'error');
            return;
        }
        
        currentUser = profileResult.user;
        
        // 💡 BUAT SESSION BARU untuk tracking bubble
        currentSession = db.createSession(currentUser.id);
        
        // 💡 UPDATE USER ONLINE STATUS
        db.updateUserOnlineStatus(currentUser.id, true);
        
        // 💡 UPDATE ROOM USER COUNT
        db.updateRoomUserCount(1);
        
        // Save session ID untuk reload
        localStorage.setItem('chatApp_currentSessionId', currentSession.id);
        localStorage.setItem('chatApp_currentUserId', currentUser.id);
        localStorage.setItem('chatApp_roomJoined', 'true');
        
        // Go to chat
        profileScreen.classList.remove('active');
        chatScreen.classList.add('active');
        
        // Load data
        loadMessages();
        updateOnlineUsers();
        messageInput.focus();
        
        // System message
        sendSystemMessage(`${userName} telah bergabung ke chat`);
        
        showToast(`Selamat datang, ${userName}!`, 'success');
    }
    
    // ======================
    // CHAT FUNCTIONS - DIPERBAIKI
    // ======================
    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !currentUser) return;
        
        // 💡 GUNAKAN DATABASE: Save message dengan session ID
        const messageResult = db.saveMessage(currentUser.id, text);
        
        if (!messageResult.success) {
            showToast('Gagal mengirim pesan', 'error');
            return;
        }
        
        // 💡 TAMBAH SESSION ID ke message untuk bubble tracking
        const message = messageResult.message;
        message.sessionId = currentSession.id; // 💡 INI PENTING!
        
        // 💡 SIMPAN KE LOCALSTORAGE sebagai backup
        const existingMessages = JSON.parse(localStorage.getItem('chatApp_messages') || '[]');
        existingMessages.push(message);
        localStorage.setItem('chatApp_messages', JSON.stringify(existingMessages));
        
        // Add to messages array
        messages.push(message);
        
        // Render message
        renderMessage(message);
        
        // Clear input
        messageInput.value = '';
        
        // Clear typing
        clearTypingIndicator();
        
        // Scroll
        scrollToBottom();
        
        // Update session activity
        db.updateSessionActivity(currentSession.id);
        
        showToast('Pesan terkirim', 'success');
    }
    
    function renderMessage(message) {
        const messageDiv = document.createElement('div');
        
        if (message.type === 'system') {
            messageDiv.className = 'system-message';
            messageDiv.innerHTML = `
                <div class="message-content">${message.text}</div>
                <div class="timestamp">${formatTime(message.timestamp)}</div>
            `;
        } else {
            // 💡 TENTUKAN BUBBLE POSITION DARI DATABASE
            const bubblePosition = db.getBubblePosition(
                message, 
                currentSession?.id, 
                currentUser?.id
            );
            
            const isFromCurrentUser = bubblePosition === 'right';
            const messageType = bubblePosition;
            
            messageDiv.className = `message message-${messageType}`;
            
            const avatarText = getAvatarText(message.displayName || message.username);
            const displayName = isFromCurrentUser ? 'Anda' : (message.displayName || message.username);
            
            messageDiv.innerHTML = `
                <div class="message-header">
                    <div class="message-avatar" style="background: ${message.colorHex || '#6a11cb'}">
                        ${avatarText}
                    </div>
                    <div class="message-sender" style="color: ${message.colorHex || '#6a11cb'}">
                        ${displayName}
                    </div>
                </div>
                <div class="message-content">${message.text}</div>
                <div class="message-time">${formatTime(message.timestamp)}</div>
            `;
        }
        
        chatArea.appendChild(messageDiv);
    }
    
    // ======================
    // LOAD MESSAGES - DIPERBAIKI
    // ======================
    function loadMessages() {
        // 💡 1. Load dari database utama
        let dbMessages = db.getAllMessages(200);
        
        // 💡 2. Load dari localStorage sebagai backup
        const localMessages = JSON.parse(localStorage.getItem('chatApp_messages') || '[]');
        const systemMessages = JSON.parse(localStorage.getItem('chatApp_system_messages') || '[]');
        
        // 💡 3. Gabungkan semua
        messages = [...dbMessages, ...localMessages, ...systemMessages];
        
        // 💡 4. Hapus duplikat berdasarkan ID
        const uniqueMessages = [];
        const seenIds = new Set();
        
        messages.forEach(msg => {
            if (!seenIds.has(msg.id)) {
                seenIds.add(msg.id);
                uniqueMessages.push(msg);
            }
        });
        
        messages = uniqueMessages;
        
        // 💡 5. Sort by timestamp
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        // Clear chat area
        chatArea.innerHTML = '';
        
        if (messages.length === 0) {
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) {
                chatArea.appendChild(welcomeMsg.cloneNode(true));
            }
            return;
        }
        
        // Render all
        messages.forEach(message => {
            renderMessage(message);
        });
        
        scrollToBottom();
    }
    
    // ======================
    // HAPUS SEMUA CHAT - VERSI FIXED
    // ======================
    function showClearChatConfirm() {
        confirmModal.classList.add('active');
    }
    
    function clearAllChats() {
        if (!confirm('Yakin hapus SEMUA chat? Semua pesan dari semua user akan dihapus PERMANEN.')) {
            confirmModal.classList.remove('active');
            return;
        }
        
        try {
            // 💡 Simpan nama user dulu
            const currentUserName = currentUser ? (currentUser.displayName || currentUser.username || 'User') : 'User';
            
            // 💡 1. RESET DATABASE ROOM
            let resetSuccess = false;
            if (typeof db !== 'undefined' && db.resetRoom) {
                resetSuccess = db.resetRoom();
            }
            
            // 💡 2. HAPUS LOCALSTORAGE CHAT DATA
            localStorage.removeItem('chatApp_messages');
            localStorage.removeItem('chatApp_broadcast');
            localStorage.removeItem('chatApp_system_messages');
            
            // 💡 3. RESET ARRAY MESSAGES (tapi user tetap login)
            messages = [];
            
            // 💡 4. RELOAD MESSAGES DARI DATABASE YANG BARU
            // Ini akan mengisi array messages dengan data kosong
            const freshMessages = db.getAllMessages(200);
            messages = freshMessages || [];
            
            // 💡 5. CLEAR CHAT AREA UI
            chatArea.innerHTML = '';
            
            // 💡 6. TAMPILKAN WELCOME MESSAGE BARU
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) {
                const welcomeClone = welcomeMsg.cloneNode(true);
                welcomeClone.style.display = 'block';
                chatArea.appendChild(welcomeClone);
            }
            
            // 💡 7. BUAT & SIMPAN SYSTEM MESSAGE BARU KE DATABASE
            if (currentUser) {
                const systemText = `${currentUserName} telah menghapus semua chat`;
                
                // Simpan system message ke database juga
                const systemMsgResult = db.saveMessage(currentUser.id, systemText);
                
                if (systemMsgResult.success) {
                    // Tandai sebagai system message
                    systemMsgResult.message.type = 'system';
                    
                    // Tambahkan session ID
                    systemMsgResult.message.sessionId = currentSession?.id;
                    
                    // 💡 SIMPAN KE LOCALSTORAGE sebagai backup
                    localStorage.setItem('chatApp_system_messages', JSON.stringify([systemMsgResult.message]));
                    
                    // Tambah ke array
                    messages.push(systemMsgResult.message);
                    
                    // Render message
                    renderMessage(systemMsgResult.message);
                    
                    // Scroll ke bawah
                    scrollToBottom();
                }
            }
            
            // 💡 8. TAMPILKAN TOAST SUCCESS
            showToast('SEMUA chat berhasil dihapus permanen!', 'success');
            
            // 💡 9. Refresh online users list
            updateOnlineUsers();
            
        } catch (error) {
            console.error('Error clearing chats:', error);
            showToast('Gagal menghapus chat', 'error');
        }
        
        // 💡 10. CLOSE MODAL
        confirmModal.classList.remove('active');
    }
    
    function sendSystemMessage(text) {
        // 💡 Simpan system message ke database JIKA ada current user
        if (currentUser && db && db.saveMessage) {
            const systemMsgResult = db.saveMessage(currentUser.id, text);
            
            if (systemMsgResult.success) {
                // Tandai sebagai system
                systemMsgResult.message.type = 'system';
                
                // Tambah session ID
                if (currentSession) {
                    systemMsgResult.message.sessionId = currentSession.id;
                }
                
                // Tambah ke array
                messages.push(systemMsgResult.message);
                
                // Simpan ke localStorage juga
                const existingSystem = JSON.parse(localStorage.getItem('chatApp_system_messages') || '[]');
                existingSystem.push(systemMsgResult.message);
                localStorage.setItem('chatApp_system_messages', JSON.stringify(existingSystem));
                
                // Render
                renderMessage(systemMsgResult.message);
                scrollToBottom();
                return;
            }
        }
        
        // Fallback: buat system message biasa
        const systemMessage = {
            id: 'sys_' + Date.now().toString(),
            type: 'system',
            text: text,
            timestamp: new Date().toISOString()
        };
        
        // Tambahkan ke array
        messages.push(systemMessage);
        
        // Simpan system message ke localStorage
        const existingSystem = JSON.parse(localStorage.getItem('chatApp_system_messages') || '[]');
        existingSystem.push(systemMessage);
        localStorage.setItem('chatApp_system_messages', JSON.stringify(existingSystem));
        
        // Render
        renderMessage(systemMessage);
        scrollToBottom();
    }
    
    // ======================
    // ONLINE USERS
    // ======================
    function updateOnlineUsers() {
        // 💡 GUNAKAN DATABASE: Get online users
        const onlineUsers = db.getOnlineUsers();
        
        // Update count
        onlineCount.textContent = onlineUsers.length;
        if (document.getElementById('modal-online-count')) {
            document.getElementById('modal-online-count').textContent = `${onlineUsers.length} user`;
        }
        
        // Update list
        usersOnline.innerHTML = '';
        
        if (onlineUsers.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'loading-users';
            emptyState.innerHTML = `
                <i class="fas fa-user-friends"></i>
                <span>Tidak ada user online</span>
            `;
            usersOnline.appendChild(emptyState);
            return;
        }
        
        // Add current user first
        if (currentUser) {
            const currentUserItem = createUserItem(currentUser, true);
            usersOnline.appendChild(currentUserItem);
        }
        
        // Add other users
        const otherUsers = onlineUsers.filter(u => u.id !== currentUser?.id);
        
        otherUsers.forEach(user => {
            const userItem = createUserItem(user, false);
            usersOnline.appendChild(userItem);
        });
    }
    
    function createUserItem(user, isCurrent) {
        const userItem = document.createElement('div');
        userItem.className = `user-item ${isCurrent ? 'active' : ''}`;
        
        const avatarText = getAvatarText(user.displayName || user.username);
        
        userItem.innerHTML = `
            <div class="user-avatar" style="background: ${user.colorHex || '#6a11cb'}">
                ${avatarText}
            </div>
            <div class="user-info">
                <div class="user-name">${isCurrent ? 'Anda' : (user.displayName || user.username)}</div>
                <div class="user-status">
                    <span class="status-dot online"></span>
                    <span>Online</span>
                </div>
            </div>
        `;
        
        return userItem;
    }
    
    // ======================
    // UI FUNCTIONS
    // ======================
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        const icon = toggleSidebarBtn.querySelector('i');
        icon.classList.toggle('fa-chevron-left');
        icon.classList.toggle('fa-chevron-right');
    }
    
    function toggleSidebarMobile() {
        sidebar.classList.toggle('active');
    }
    
    function toggleTheme() {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle('dark-theme', isDarkTheme);
        
        const icon = themeToggle.querySelector('i');
        icon.classList.toggle('fa-moon');
        icon.classList.toggle('fa-sun');
        
        themeToggle.title = isDarkTheme ? 'Mode Terang' : 'Mode Gelap';
        
        // Save theme preference
        localStorage.setItem('chatApp_theme', isDarkTheme ? 'dark' : 'light');
    }
    
    function loadTheme() {
        const savedTheme = localStorage.getItem('chatApp_theme');
        if (savedTheme === 'dark') {
            isDarkTheme = true;
            document.body.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.title = 'Mode Terang';
        }
    }
    
    function showRoomInfo() {
        if (document.getElementById('modal-password')) {
            document.getElementById('modal-password').textContent = ROOM_PASSWORD;
        }
        roomInfoModal.classList.add('active');
    }
    
    // ======================
    // LEAVE ROOM
    // ======================
    function leaveRoom() {
        if (confirm('Yakin keluar dari room?')) {
            // 💡 UPDATE DATABASE: Logout user
            if (currentSession) {
                db.endSession(currentSession.id);
            }
            
            if (currentUser) {
                db.updateUserOnlineStatus(currentUser.id, false);
                db.updateRoomUserCount(-1);
                
                // System message
                sendSystemMessage(`${currentUser.displayName || currentUser.username} telah meninggalkan chat`);
            }
            
            // Clear local storage
            localStorage.removeItem('chatApp_roomJoined');
            localStorage.removeItem('chatApp_currentSessionId');
            localStorage.removeItem('chatApp_currentUserId');
            
            // Reset state
            currentUser = null;
            currentSession = null;
            
            // Clean inactive sessions
            db.cleanInactiveSessions();
            
            // Go back
            chatScreen.classList.remove('active');
            passwordScreen.classList.add('active');
            
            showToast('Anda telah keluar dari room', 'info');
        }
    }
    
    // ======================
    // TYPING INDICATOR
    // ======================
    function handleTyping() {
        if (!currentUser) return;
        
        if (typingTimeout) clearTimeout(typingTimeout);
        
        typingTimeout = setTimeout(() => {
            clearTypingIndicator();
        }, 2000);
    }
    
    function clearTypingIndicator() {
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
    }
    
    // ======================
    // HELPER FUNCTIONS
    // ======================
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }
    
    function getAvatarText(name) {
        return name.charAt(0).toUpperCase();
    }
    
    function showToast(message, type = 'info') {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle'
        };
        
        toast.className = `toast show ${type}`;
        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    function scrollToBottom() {
        setTimeout(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        }, 100);
    }
    
    function handleResize() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
        }
    }
    
    // ======================
    // AUTO-RECONNECT
    // ======================
    function checkAutoReconnect() {
        const sessionId = localStorage.getItem('chatApp_currentSessionId');
        const userId = localStorage.getItem('chatApp_currentUserId');
        const roomJoined = localStorage.getItem('chatApp_roomJoined');
        
        if (roomJoined && sessionId && userId) {
            // Cek session masih aktif di database
            const user = db.getUserById(userId);
            if (user && user.isOnline) {
                // Auto reconnect
                currentUser = user;
                currentSession = { id: sessionId };
                
                passwordScreen.classList.remove('active');
                profileScreen.classList.remove('active');
                chatScreen.classList.add('active');
                
                loadMessages();
                updateOnlineUsers();
                messageInput.focus();
                
                showToast(`Selamat datang kembali, ${user.displayName || user.username}!`, 'success');
                return true;
            }
        }
        return false;
    }
    
    // ======================
    // PERIODIC UPDATES
    // ======================
    setInterval(() => {
        if (currentUser && currentSession) {
            // Update session activity
            db.updateSessionActivity(currentSession.id);
            
            // Update online users
            updateOnlineUsers();
            
            // 💡 LOAD NEW MESSAGES DARI DATABASE
            const newMessages = db.getAllMessages(200);
            if (newMessages.length > messages.length) {
                const latestMessages = newMessages.slice(messages.length);
                latestMessages.forEach(msg => {
                    if (!messages.some(m => m.id === msg.id)) {
                        messages.push(msg);
                        renderMessage(msg);
                    }
                });
                scrollToBottom();
            }
            
            // Clean inactive
            db.cleanInactiveSessions();
        }
    }, 3000);
    
    // ======================
    // INIT APP
    // ======================
    // Coba auto reconnect dulu
    if (!checkAutoReconnect()) {
        init();
    }
});