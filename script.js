// Private Group Chat App - FIXED SESSION SEPARATION
document.addEventListener('DOMContentLoaded', function() {
    // ======================
    // CONFIGURATION
    // ======================
    const ROOM_PASSWORD = "icebear";
    const ROOM_NAME = "Private Room";
    
    // ======================
    // STATE MANAGEMENT
    // ======================
    let currentUser = null;
    let onlineUsers = [];
    let messages = [];
    let isDarkTheme = false;
    let typingTimeout = null;
    let currentSessionId = null; // 💡 TAMBAH: ID Session saat ini
    
    // ======================
    // DOM ELEMENTS
    // ======================
    // Screens
    const passwordScreen = document.getElementById('password-screen');
    const profileScreen = document.getElementById('profile-screen');
    const chatScreen = document.getElementById('chat-screen');
    
    // Password Screen
    const roomPasswordInput = document.getElementById('room-password');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const joinRoomBtn = document.getElementById('join-room');
    
    // Profile Screen
    const backToPasswordBtn = document.getElementById('back-to-password');
    const avatarOptions = document.querySelectorAll('.avatar-option');
    const userNameInput = document.getElementById('user-name');
    const charCount = document.getElementById('char-count');
    const colorOptions = document.querySelectorAll('.color-option');
    const enterChatBtn = document.getElementById('enter-chat');
    const usersPreview = document.getElementById('users-preview');
    
    // Chat Screen
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
    
    // Modals
    const roomInfoModal = document.getElementById('room-info-modal');
    const confirmModal = document.getElementById('confirm-modal');
    const emojiPicker = document.getElementById('emoji-picker');
    
    // Modal Elements
    const modalPassword = document.getElementById('modal-password');
    const modalOnlineCount = document.getElementById('modal-online-count');
    const modalCloseBtns = document.querySelectorAll('.modal-close, .emoji-close');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const shareRoomBtn = document.getElementById('share-room');
    
    // Toast
    const toast = document.getElementById('toast');
    
    // ======================
    // INITIALIZATION
    // ======================
    function init() {
        loadFromLocalStorage();
        setupEventListeners();
        updateUsersPreview();
        
        // Check if user already in chat
        if (currentUser && localStorage.getItem('chatApp_roomJoined') === 'true') {
            // Check session timeout
            const sessionTimeout = localStorage.getItem('chatApp_sessionTimeout');
            const now = Date.now();
            
            if (sessionTimeout && now < parseInt(sessionTimeout)) {
                // Session masih valid
                passwordScreen.classList.remove('active');
                profileScreen.classList.remove('active');
                chatScreen.classList.add('active');
                updateOnlineUsers();
                loadMessages();
            } else {
                // Session expired
                clearUserSession();
                showToast('Session telah berakhir, silakan login kembali', 'info');
            }
        }
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
            emojiPicker.classList.toggle('active');
        });
        
        sendBtn.addEventListener('click', sendMessage);
        
        // Emoji Picker
        emojiPicker.querySelectorAll('span').forEach(emoji => {
            emoji.addEventListener('click', () => {
                messageInput.value += emoji.textContent;
                messageInput.focus();
                emojiPicker.classList.remove('active');
            });
        });
        
        // Modals
        modalCloseBtns.forEach(btn => {
            btn.addEventListener('click', closeAllModals);
        });
        
        cancelDeleteBtn.addEventListener('click', () => {
            confirmModal.classList.remove('active');
        });
        
        confirmDeleteBtn.addEventListener('click', clearAllMessages);
        
        shareRoomBtn.addEventListener('click', shareRoomPassword);
        
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === roomInfoModal) roomInfoModal.classList.remove('active');
            if (e.target === confirmModal) confirmModal.classList.remove('active');
            if (e.target === emojiPicker) emojiPicker.classList.remove('active');
        });
        
        // Handle window resize for responsive sidebar
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
        
        if (password !== ROOM_PASSWORD) {
            showToast('Password salah!', 'error');
            roomPasswordInput.value = '';
            roomPasswordInput.focus();
            return;
        }
        
        // Success - go to profile screen
        passwordScreen.classList.remove('active');
        profileScreen.classList.add('active');
        
        // Set default profile
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
        const users = JSON.parse(localStorage.getItem('chatApp_onlineUsers') || '[]');
        
        usersPreview.innerHTML = '';
        
        if (users.length === 0) {
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
        users.slice(0, 3).forEach(user => {
            const badge = document.createElement('div');
            badge.className = 'user-badge';
            badge.innerHTML = `
                <span class="user-dot online"></span>
                <span>${user.name}</span>
            `;
            usersPreview.appendChild(badge);
        });
        
        if (users.length > 3) {
            const moreBadge = document.createElement('div');
            moreBadge.className = 'user-badge';
            moreBadge.innerHTML = `
                <span>+${users.length - 3} lainnya</span>
            `;
            usersPreview.appendChild(moreBadge);
        }
    }
    
    // ======================
    // ENTER CHAT - FIXED SESSION
    // ======================
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
        
        // 💡 GENERATE SESSION ID BARU SETIAP LOGIN
        currentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create user dengan SESSION ID yang UNIK
        currentUser = {
            id: generateUserIdFromName(userName),
            name: userName,
            color: selectedColor,
            avatar: selectedAvatar,
            lastSeen: new Date().toISOString(),
            isTyping: false,
            sessionId: currentSessionId, // 💡 SESSION ID UNIK
            loginTime: Date.now()
        };
        
        // Save session timeout (8 jam)
        const sessionTimeout = Date.now() + (8 * 60 * 60 * 1000);
        localStorage.setItem('chatApp_sessionTimeout', sessionTimeout.toString());
        
        // Save current session ID
        localStorage.setItem('chatApp_currentSessionId', currentSessionId);
        
        // Save user to localStorage
        saveToLocalStorage();
        
        // Remove old users with same name
        removeOldUsersWithSameName(userName);
        
        // Add user to online users
        addUserToOnlineList(currentUser);
        
        // Go to chat screen
        profileScreen.classList.remove('active');
        chatScreen.classList.add('active');
        
        // Mark room as joined
        localStorage.setItem('chatApp_roomJoined', 'true');
        
        // Load messages
        loadMessages();
        updateOnlineUsers();
        messageInput.focus();
        
        // Send join notification
        sendSystemMessage(`${userName} telah bergabung ke chat`);
        
        showToast(`Selamat datang, ${userName}!`, 'success');
    }
    
    // ======================
    // CHAT FUNCTIONS
    // ======================
    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !currentUser) return;
        
        // Create message with SESSION ID
        const message = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            userName: currentUser.name,
            userColor: currentUser.color,
            userAvatar: currentUser.avatar,
            text: text,
            timestamp: new Date().toISOString(),
            type: 'user',
            sessionId: currentSessionId, // 💡 SIMPAN SESSION ID di message
            isCurrentSession: true // 💡 FLAG: ini dari session saat ini
        };
        
        // Add to messages array
        messages.push(message);
        
        // Save to localStorage
        saveMessages();
        
        // Render message
        renderMessage(message);
        
        // Clear input
        messageInput.value = '';
        
        // Clear typing indicator
        clearTypingIndicator();
        
        // Scroll to bottom
        scrollToBottom();
        
        // Update user's last seen
        updateUserLastSeen();
        
        // Broadcast message
        broadcastMessage(message);
    }
    
    function broadcastMessage(message) {
        const broadcastMessages = JSON.parse(localStorage.getItem('chatApp_broadcast') || '[]');
        
        // 💡 HAPUS isCurrentSession FLAG sebelum broadcast
        const messageToBroadcast = {...message};
        delete messageToBroadcast.isCurrentSession;
        
        broadcastMessages.push(messageToBroadcast);
        
        if (broadcastMessages.length > 100) {
            broadcastMessages.splice(0, broadcastMessages.length - 100);
        }
        
        localStorage.setItem('chatApp_broadcast', JSON.stringify(broadcastMessages));
    }
    
    function handleTyping() {
        if (!currentUser) return;
        
        currentUser.isTyping = true;
        currentUser.lastSeen = new Date().toISOString();
        updateUserInOnlineList(currentUser);
        
        if (typingTimeout) clearTimeout(typingTimeout);
        
        typingTimeout = setTimeout(() => {
            currentUser.isTyping = false;
            updateUserInOnlineList(currentUser);
        }, 2000);
    }
    
    function clearTypingIndicator() {
        if (currentUser) {
            currentUser.isTyping = false;
            updateUserInOnlineList(currentUser);
        }
        
        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
    }
    
    function sendSystemMessage(text) {
        const message = {
            id: 'sys_' + Date.now().toString(),
            text: text,
            timestamp: new Date().toISOString(),
            type: 'system'
        };
        
        messages.push(message);
        saveMessages();
        renderMessage(message);
        scrollToBottom();
    }
    
    // ======================
    // RENDER MESSAGE - FIXED BUBBLE POSITION
    // ======================
    function renderMessage(message) {
        const messageDiv = document.createElement('div');
        
        if (message.type === 'system') {
            messageDiv.className = 'system-message';
            messageDiv.innerHTML = `
                <div class="message-content">${message.text}</div>
                <div class="timestamp">${formatTime(message.timestamp)}</div>
            `;
        } else {
            // 💡 LOGIKA BUBBLE POSISI YANG BENAR:
            // 1. Jika message memiliki isCurrentSession = true → KANAN (dari session ini)
            // 2. Jika message.sessionId === currentSessionId → KANAN (dari session ini)
            // 3. Selain itu → KIRI (dari session lain atau user lain)
            
            let isFromCurrentSession = false;
            
            if (message.isCurrentSession === true) {
                // Message baru yang baru dikirim di session ini
                isFromCurrentSession = true;
            } else if (currentSessionId && message.sessionId === currentSessionId) {
                // Message lama dari session yang sama
                isFromCurrentSession = true;
            } else if (currentUser && message.userId === currentUser.id && 
                      message.sessionId && currentSessionId && 
                      message.sessionId === currentSessionId) {
                // Double check untuk pastikan
                isFromCurrentSession = true;
            }
            
            const messageType = isFromCurrentSession ? 'sent' : 'received';
            
            messageDiv.className = `message message-${messageType}`;
            
            const avatarText = getAvatarText(message.userName);
            const displayName = isFromCurrentSession ? 'Anda' : message.userName;
            
            messageDiv.innerHTML = `
                <div class="message-header">
                    <div class="message-avatar" style="background: ${message.userColor}">
                        ${avatarText}
                    </div>
                    <div class="message-sender" style="color: ${message.userColor}">
                        ${displayName}
                    </div>
                </div>
                <div class="message-content">${message.text}</div>
                <div class="message-time">${formatTime(message.timestamp)}</div>
            `;
        }
        
        chatArea.appendChild(messageDiv);
    }
    
    function loadMessages() {
        // 💡 LOAD MESSAGES DENGAN SESSION CHECK
        const savedMessages = JSON.parse(localStorage.getItem('chatApp_messages') || '[]');
        
        // Filter hanya messages yang relevan:
        // 1. System messages (selalu tampil)
        // 2. Messages dari session saat ini (jika ada currentSessionId)
        // 3. Messages dari broadcast (dari user lain)
        
        messages = savedMessages.filter(msg => {
            if (msg.type === 'system') return true;
            
            // Jika ada sessionId di message, cek apakah dari session ini
            if (msg.sessionId) {
                // Tandai jika dari session saat ini
                if (currentSessionId && msg.sessionId === currentSessionId) {
                    msg.isCurrentSession = true;
                    return true;
                }
                // Message dari session lain, tetap tampilkan
                return true;
            }
            
            // Message tanpa sessionId (dari versi lama atau broadcast)
            return true;
        });
        
        // Clear chat area
        chatArea.innerHTML = '';
        
        if (messages.length === 0) {
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) {
                chatArea.appendChild(welcomeMsg.cloneNode(true));
            }
            return;
        }
        
        // Render all messages
        messages.forEach(message => {
            renderMessage(message);
        });
        
        scrollToBottom();
    }
    
    // ======================
// HAPUS SEMUA CHAT - BENAR-BENAR SEMUA
// ======================
    // ======================
// HAPUS SEMUA CHAT - PERBAIKAN
// ======================
    function clearAllMessages() {
        if (!confirm('Yakin hapus SEMUA chat? Ini akan menghapus semua pesan dari awal sampai akhir.')) return;
        
        // 💡 HAPUS DARI LOCALSTORAGE TERLEBIH DAHULU
        localStorage.removeItem('chatApp_messages');
        localStorage.removeItem('chatApp_broadcast');
        
        // 💡 Reset array messages
        messages = [];
        
        // 💡 Clear chat area
        chatArea.innerHTML = '';
        
        // 💡 Tampilkan ulang welcome message
        const welcomeMsg = document.querySelector('.welcome-message');
        if (welcomeMsg) {
            const welcomeClone = welcomeMsg.cloneNode(true);
            welcomeClone.style.display = 'block';
            chatArea.appendChild(welcomeClone);
        }
        
        // 💡 Close modal
        confirmModal.classList.remove('active');
        
        // 💡 System message - TAPI HARUS TETAP DISIMPAN
        if (currentUser) {
            sendSystemMessage(`${currentUser.name} telah menghapus semua chat`);
        }
        
        showToast('Semua chat telah dihapus', 'success');
    }
    
    // ======================
    // ONLINE USERS MANAGEMENT
    // ======================
    function addUserToOnlineList(user) {
        let onlineUsers = JSON.parse(localStorage.getItem('chatApp_onlineUsers') || '[]');
        
        // Remove old entries with same name and old session
        const now = Date.now();
        onlineUsers = onlineUsers.filter(u => {
            if (u.name === user.name) {
                // Keep only if logged in within last 2 minutes
                return u.loginTime && (now - u.loginTime) < (2 * 60 * 1000);
            }
            return true;
        });
        
        // Add new user
        onlineUsers.push(user);
        
        localStorage.setItem('chatApp_onlineUsers', JSON.stringify(onlineUsers));
        updateOnlineUsers();
    }
    
    function removeOldUsersWithSameName(userName) {
        let onlineUsers = JSON.parse(localStorage.getItem('chatApp_onlineUsers') || '[]');
        const now = Date.now();
        
        onlineUsers = onlineUsers.filter(u => {
            if (u.name === userName) {
                // Remove if older than 1 minute
                return u.loginTime && (now - u.loginTime) < (1 * 60 * 1000);
            }
            return true;
        });
        
        localStorage.setItem('chatApp_onlineUsers', JSON.stringify(onlineUsers));
    }
    
    function updateUserInOnlineList(user) {
        let onlineUsers = JSON.parse(localStorage.getItem('chatApp_onlineUsers') || '[]');
        const index = onlineUsers.findIndex(u => u.id === user.id && u.sessionId === user.sessionId);
        
        if (index !== -1) {
            onlineUsers[index] = user;
            localStorage.setItem('chatApp_onlineUsers', JSON.stringify(onlineUsers));
            updateOnlineUsers();
        }
    }
    
    function updateOnlineUsers() {
        const onlineUsers = JSON.parse(localStorage.getItem('chatApp_onlineUsers') || '[]');
        const currentUserId = currentUser?.id;
        const currentUserSession = currentUser?.sessionId;
        
        // Filter active users (last seen within 2 minutes)
        const now = new Date();
        const activeUsers = onlineUsers.filter(u => {
            const lastSeen = new Date(u.lastSeen);
            const minutesDiff = (now - lastSeen) / (1000 * 60);
            return minutesDiff < 2;
        });
        
        // Update online count
        const totalOnline = activeUsers.length;
        onlineCount.textContent = totalOnline;
        modalOnlineCount.textContent = `${totalOnline} user`;
        
        // Update users online list
        usersOnline.innerHTML = '';
        
        if (activeUsers.length === 0) {
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
        const otherUsers = activeUsers.filter(u => 
            !(u.id === currentUserId && u.sessionId === currentUserSession)
        );
        
        otherUsers.forEach(user => {
            const userItem = createUserItem(user, false);
            usersOnline.appendChild(userItem);
        });
        
        updateTypingIndicator();
    }
    
    function createUserItem(user, isCurrent) {
        const userItem = document.createElement('div');
        userItem.className = `user-item ${isCurrent ? 'active' : ''}`;
        
        const avatarText = getAvatarText(user.name);
        const statusClass = user.isTyping ? 'typing' : 'online';
        const statusText = user.isTyping ? 'Mengetik...' : 'Online';
        
        userItem.innerHTML = `
            <div class="user-avatar" style="background: ${user.color}">
                ${avatarText}
            </div>
            <div class="user-info">
                <div class="user-name">${isCurrent ? 'Anda' : user.name}</div>
                <div class="user-status">
                    <span class="status-dot ${statusClass}"></span>
                    <span>${statusText}</span>
                </div>
            </div>
        `;
        
        return userItem;
    }
    
    function updateTypingIndicator() {
        const onlineUsers = JSON.parse(localStorage.getItem('chatApp_onlineUsers') || '[]');
        const currentUserSession = currentUser?.sessionId;
        
        const typingUsers = onlineUsers.filter(u => 
            u.isTyping && u.sessionId !== currentUserSession
        );
        
        typingIndicator.innerHTML = '';
        
        if (typingUsers.length > 0) {
            const names = typingUsers.map(u => u.name).join(', ');
            typingIndicator.innerHTML = `
                <span>${names} sedang mengetik</span>
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            `;
        }
    }
    
    function updateUserLastSeen() {
        if (currentUser) {
            currentUser.lastSeen = new Date().toISOString();
            updateUserInOnlineList(currentUser);
        }
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
        
        saveToLocalStorage();
    }
    
    function showRoomInfo() {
        modalPassword.textContent = ROOM_PASSWORD;
        roomInfoModal.classList.add('active');
    }
    
    function showClearChatConfirm() {
        confirmModal.classList.add('active');
    }
    
    function closeAllModals() {
        roomInfoModal.classList.remove('active');
        confirmModal.classList.remove('active');
        emojiPicker.classList.remove('active');
    }
    
    function leaveRoom() {
        if (confirm('Yakin keluar dari room?')) {
            clearUserSession();
            
            // Go back to password screen
            chatScreen.classList.remove('active');
            passwordScreen.classList.add('active');
            
            showToast('Anda telah keluar dari room', 'info');
        }
    }
    
    function clearUserSession() {
        // Remove session data
        localStorage.removeItem('chatApp_roomJoined');
        localStorage.removeItem('chatApp_sessionTimeout');
        localStorage.removeItem('chatApp_currentSessionId');
        
        // Remove user from online list
        if (currentUser) {
            let onlineUsers = JSON.parse(localStorage.getItem('chatApp_onlineUsers') || '[]');
            onlineUsers = onlineUsers.filter(u => u.sessionId !== currentUser.sessionId);
            localStorage.setItem('chatApp_onlineUsers', JSON.stringify(onlineUsers));
            
            // Send leave notification
            sendSystemMessage(`${currentUser.name} telah meninggalkan chat`);
        }
        
        // Clear current user
        currentUser = null;
        currentSessionId = null;
        localStorage.removeItem('chatApp_currentUser');
    }
    
    function shareRoomPassword() {
        const text = `Join Private Chat Room!\nPassword: ${ROOM_PASSWORD}\nRoom: ${ROOM_NAME}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Private Chat Room',
                text: text,
                url: window.location.href
            }).catch(console.error);
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => showToast('Password disalin ke clipboard!', 'success'))
                .catch(() => showToast('Gagal menyalin password', 'error'));
        } else {
            prompt('Copy password ini:', ROOM_PASSWORD);
        }
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
    
    function generateUserIdFromName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 5) - hash) + name.charCodeAt(i);
            hash = hash & hash;
        }
        return 'user_' + Math.abs(hash).toString();
    }
    
    // ======================
    // LOCAL STORAGE FUNCTIONS
    // ======================
    function saveToLocalStorage() {
        try {
            localStorage.setItem('chatApp_currentUser', JSON.stringify(currentUser));
            localStorage.setItem('chatApp_theme', isDarkTheme ? 'dark' : 'light');
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }
    
    function loadFromLocalStorage() {
        try {
            const savedUser = localStorage.getItem('chatApp_currentUser');
            const savedTheme = localStorage.getItem('chatApp_theme');
            
            if (savedUser) {
                currentUser = JSON.parse(savedUser);
            }
            
            if (savedTheme) {
                isDarkTheme = savedTheme === 'dark';
                if (isDarkTheme) {
                    document.body.classList.add('dark-theme');
                    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
                    themeToggle.title = 'Mode Terang';
                }
            }
            
            // Load current session ID
            currentSessionId = localStorage.getItem('chatApp_currentSessionId');
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
    
    function saveMessages() {
        try {
            if (messages.length > 200) {
                messages = messages.slice(messages.length - 200);
            }
            localStorage.setItem('chatApp_messages', JSON.stringify(messages));
        } catch (e) {
            console.error('Error saving messages:', e);
        }
    }
    
    // ======================
    // AUTO UPDATE FUNCTIONS
    // ======================
    function checkForNewMessages() {
        if (!currentUser || !currentSessionId) return;
        
        const broadcastMessages = JSON.parse(localStorage.getItem('chatApp_broadcast') || '[]');
        
        const newMessages = broadcastMessages.filter(broadcastMsg => {
            // Skip jika sudah ada
            if (messages.some(msg => msg.id === broadcastMsg.id)) return false;
            
            // Skip jika dari session sendiri
            if (broadcastMsg.sessionId === currentSessionId) return false;
            
            // Skip jika dari user dengan nama sama TAPI session berbeda
            // (ini adalah kasus user lain pakai nama sama)
            if (broadcastMsg.userName === currentUser.name && 
                broadcastMsg.sessionId !== currentSessionId) {
                return true; // 💡 TAMPILKAN sebagai orang lain
            }
            
            return true;
        });
        
        if (newMessages.length > 0) {
            newMessages.forEach(msg => {
                // Tandai sebagai bukan dari session saat ini
                msg.isCurrentSession = false;
                messages.push(msg);
                renderMessage(msg);
            });
            
            saveMessages();
            scrollToBottom();
            updateTypingIndicator();
        }
    }
    
    function cleanOldData() {
        // Clean old broadcast messages
        const broadcastMessages = JSON.parse(localStorage.getItem('chatApp_broadcast') || '[]');
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const recentBroadcasts = broadcastMessages.filter(msg => msg.timestamp > oneHourAgo);
        
        if (recentBroadcasts.length !== broadcastMessages.length) {
            localStorage.setItem('chatApp_broadcast', JSON.stringify(recentBroadcasts));
        }
        
        // Clean old online users
        let onlineUsers = JSON.parse(localStorage.getItem('chatApp_onlineUsers') || '[]');
        const now = new Date();
        const activeUsers = onlineUsers.filter(u => {
            const lastSeen = new Date(u.lastSeen);
            const minutesDiff = (now - lastSeen) / (1000 * 60);
            return minutesDiff < 5;
        });
        
        if (activeUsers.length !== onlineUsers.length) {
            localStorage.setItem('chatApp_onlineUsers', JSON.stringify(activeUsers));
        }
    }
    
    // ======================
    // PERIODIC UPDATES
    // ======================
    setInterval(() => {
        if (currentUser && localStorage.getItem('chatApp_roomJoined') === 'true') {
            updateUserLastSeen();
            updateOnlineUsers();
            checkForNewMessages();
            cleanOldData();
        }
    }, 5000);
    
    // ======================
    // INITIALIZE APP
    // ======================
    init();
});