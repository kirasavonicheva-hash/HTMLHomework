
class AIAssistant {
    constructor() {
        this.initializeApp();
        this.setupEventListeners();
        this.loadData();
        this.initializeAI();
    }

    initializeApp() {
       
        this.currentChat = [];
        this.chatHistory = [];
        this.uploadedFiles = [];
        this.settings = this.getDefaultSettings();
        this.isRecording = false;
        this.currentTab = 'chat';
        
       
        toastr.options = {
            positionClass: "toast-top-right",
            progressBar: true,
            timeOut: 3000,
            closeButton: true
        };
        
        
        const savedName = localStorage.getItem('ai_assistant_username');
        if (savedName) {
            document.getElementById('username').textContent = savedName;
            document.getElementById('user-name').value = savedName;
        }
    }

    getDefaultSettings() {
        return {
            username: 'Пользователь',
            language: 'ru',
            aiModel: 'gpt',
            temperature: 0.7,
            maxTokens: 2000,
            saveHistory: true,
            creativeMode: true,
            rememberContext: true,
            theme: 'dark'
        };
    }

    initializeAI() {
      
        this.initVoiceRecognition();
        
        
        this.loadChatHistory();
        this.loadFiles();
        
       
        this.setupAutoResize();
        
        console.log('ИИ помощник инициализирован');
    }

    setupEventListeners() {
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(item.dataset.tab);
            });
        });

      
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        document.getElementById('userInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

       
        document.getElementById('voice-input').addEventListener('click', () => this.toggleVoiceInput());

        document.getElementById('attach-file').addEventListener('click', () => {
            document.getElementById('file-upload').click();
        });
        
        document.getElementById('image-input').addEventListener('click', () => {
            document.getElementById('image-upload').click();
        });

        document.getElementById('file-upload').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        document.getElementById('image-upload').addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files);
        });

       
        document.getElementById('new-chat').addEventListener('click', () => this.newChat());
        document.getElementById('export-chat').addEventListener('click', () => this.exportChat());
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('clear-history').addEventListener('click', () => this.clearHistory());
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());
        document.getElementById('clear-storage').addEventListener('click', () => this.clearStorage());

       
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
            });
        });

        
        document.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                this.useSuggestion(prompt);
            });
        });


        document.querySelectorAll('.tool-card-btn, .advanced-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tool = btn.dataset.tool;
                this.openToolModal(tool);
            });
        });

       
        document.getElementById('modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        
        document.getElementById('userInput').addEventListener('input', (e) => {
            this.updateCharCount(e.target.value.length);
        });

        
        document.getElementById('ai-temperature').addEventListener('input', (e) => {
            document.getElementById('temp-value').textContent = e.target.value;
        });

        document.getElementById('ai-max-tokens').addEventListener('input', (e) => {
            document.getElementById('tokens-value').textContent = `${e.target.value} токенов`;
        });

        
        document.getElementById('history-search').addEventListener('input', (e) => {
            this.searchHistory(e.target.value);
        });
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabName) {
                item.classList.add('active');
            }
        });
        
      
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
       
        const tabTitles = {
            chat: 'Чат с ИИ',
            files: 'Файлы',
            settings: 'Настройки',
            history: 'История',
            tools: 'Инструменты'
        };
        document.getElementById('current-tab').textContent = tabTitles[tabName];
        
        
        if (tabName === 'history') {
            this.loadHistoryList();
        } else if (tabName === 'files') {
            this.updateFilesDisplay();
        }
    }

    async sendMessage() {
        const input = document.getElementById('userInput');
        const message = input.value.trim();
        
        if (!message) return;
        
    
        this.addMessage(message, 'user');
        input.value = '';
        this.updateCharCount(0);
        
       
        const loadingId = this.showLoadingIndicator();
        
        try {
            
            const response = await this.getAIResponse(message);
            
            
            this.removeLoadingIndicator(loadingId);
            this.addMessage(response, 'ai');
            
            
            this.saveToHistory(message, response);
            
        } catch (error) {
            this.removeLoadingIndicator(loadingId);
            this.showNotification('Ошибка получения ответа от ИИ', 'error');
            console.error('Ошибка:', error);
        }
    }

    async getAIResponse(userMessage) {
        
        const responses = {
            'привет': [
                'Привет! Рад вас видеть! Чем могу помочь сегодня?',
                'Здравствуйте! Я ваш ИИ-помощник. Задавайте любые вопросы!',
                'Приветствую! Готов помочь с любыми задачами.'
            ],
            'как дела': [
                'У меня всё отлично! Готов помогать вам.',
                'Как у цифрового помощника - всегда на высоте!',
                'Всё хорошо, спасибо! А у вас как дела?'
            ],
            'спасибо': [
                'Пожалуйста! Всегда рад помочь.',
                'Не стоит благодарности! Обращайтесь ещё.',
                'Рад был помочь! Если будут ещё вопросы - обращайтесь.'
            ],
            'что ты умеешь': [
                'Я могу: отвечать на вопросы, анализировать файлы, переводить текст, генерировать код, суммаризировать тексты и многое другое!',
                'Мои возможности: общение на различные темы, работа с документами, помощь в программировании, анализ данных и другие полезные функции.',
                'Я умею поддерживать разговор, обрабатывать тексты, помогать с кодом, анализировать информацию и решать различные задачи.'
            ],
            'помощь': [
                'Я могу помочь вам с: вопросами по разным темам, анализом документов, переводом текста, написанием кода, созданием контента и многим другим. Что вас интересует?',
                'Мои основные функции: ответы на вопросы, работа с файлами, перевод текста, генерация кода, суммаризация. С чем помочь?'
            ]
        };
        
      
        const lowerMessage = userMessage.toLowerCase();
        for (const [key, responseList] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return responseList[Math.floor(Math.random() * responseList.length)];
            }
        }
        
        return this.generateAIResponse(userMessage);
    }

    generateAIResponse(message) {
       
        const responses = [
            `Интересный вопрос! По теме "${message}" могу сказать, что это важная и актуальная тема в современном мире.`,
            `Спасибо за вопрос о "${message}". Это действительно интересная область для обсуждения.`,
            `По поводу "${message}" - могу предложить несколько идей или решений, если уточните задачу.`,
            `Вопрос "${message}" требует детального рассмотрения. Могу помочь разобраться в этой теме.`,
            `Что касается "${message}", это зависит от конкретного контекста. Расскажите подробнее?`
        ];
        
        if (message.includes('?')) {
            responses.push(
                `На вопрос "${message}" могу ответить, что это зависит от многих факторов.`,
                `Чтобы ответить на ваш вопрос "${message}", нужна дополнительная информация.`
            );
        }
        
        if (message.length < 10) {
            responses.push(
                'Можете уточнить ваш запрос? Хотелось бы понять, что именно вас интересует.',
                'Расскажите подробнее, чтобы я мог дать более точный ответ.'
            );
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    addMessage(text, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-text">${this.formatMessage(text)}</div>
            <div class="message-info">
                <span>${sender === 'user' ? 'Вы' : 'ИИ Помощник'} • ${timestamp}</span>
                <div class="message-actions">
                    ${sender === 'ai' ? `
                        <button class="message-action" onclick="aiAssistant.copyMessage(this)">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="message-action" onclick="aiAssistant.regenerateMessage(this)">
                            <i class="fas fa-redo"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
      
        this.currentChat.push({
            text,
            sender,
            timestamp: new Date().toISOString()
        });
    }

    formatMessage(text) {
        
        let formatted = text
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        return formatted;
    }

    showLoadingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const loadingDiv = document.createElement('div');
        const id = 'loading-' + Date.now();
        loadingDiv.id = id;
        loadingDiv.className = 'message ai-message';
        loadingDiv.innerHTML = `
            <div class="message-text">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <div class="message-info">
                <span>ИИ Помощник • печатает...</span>
            </div>
        `;
        
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return id;
    }

    removeLoadingIndicator(id) {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
    }

    saveToHistory(userMessage, aiResponse) {
        if (!this.settings.saveHistory) return;
        
        const chat = {
            id: Date.now(),
            title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
            userMessage,
            aiResponse,
            timestamp: new Date().toISOString(),
            model: this.settings.aiModel
        };
        
        this.chatHistory.unshift(chat);
        localStorage.setItem('ai_assistant_history', JSON.stringify(this.chatHistory));
        
        if (this.currentTab === 'history') {
            this.addHistoryItem(chat);
        }
    }

    loadHistoryList() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        if (this.chatHistory.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-history"></i>
                    <p>История чатов пуста</p>
                </div>
            `;
            return;
        }
        
        this.chatHistory.forEach(chat => {
            this.addHistoryItem(chat);
        });
    }

    addHistoryItem(chat) {
        const historyList = document.getElementById('history-list');
        const date = new Date(chat.timestamp).toLocaleDateString('ru-RU');
        
        const item = document.createElement('div');
        item.className = 'history-item';
        item.dataset.id = chat.id;
        item.innerHTML = `
            <div class="history-item-header">
                <span class="history-item-title">${chat.title}</span>
                <span class="history-item-date">${date}</span>
            </div>
            <div class="history-item-preview">${chat.userMessage}</div>
        `;
        
        item.addEventListener('click', () => {
            this.loadChatFromHistory(chat.id);
            this.switchTab('chat');
        });
        
        historyList.appendChild(item);
    }

    loadChatFromHistory(chatId) {
        const chat = this.chatHistory.find(c => c.id === parseInt(chatId));
        if (!chat) return;
        
        
        this.currentChat = [];
        document.getElementById('chatMessages').innerHTML = '';
        
       
        this.addMessage(chat.userMessage, 'user');
        this.addMessage(chat.aiResponse, 'ai');
        
        this.showNotification('Чат загружен из истории', 'success');
    }

    newChat() {
        if (this.currentChat.length > 0) {
            if (confirm('Начать новый чат? Текущий диалог будет сохранен в истории.')) {
                this.currentChat = [];
                document.getElementById('chatMessages').innerHTML = '';
                document.getElementById('userInput').value = '';
                this.updateCharCount(0);
                
               
                setTimeout(() => {
                    this.addMessage('Привет! Я ваш ИИ-помощник. Чем могу помочь сегодня?', 'ai');
                }, 500);
            }
        }
    }

    exportChat() {
        if (this.currentChat.length === 0) {
            this.showNotification('Нет сообщений для экспорта', 'warning');
            return;
        }
        
        let exportText = '=== Экспорт чата с ИИ Помощником ===\n\n';
        exportText += `Дата: ${new Date().toLocaleString('ru-RU')}\n`;
        exportText += `Модель: ${this.settings.aiModel}\n\n`;
        
        this.currentChat.forEach(msg => {
            const sender = msg.sender === 'user' ? 'Вы' : 'ИИ Помощник';
            const time = new Date(msg.timestamp).toLocaleTimeString();
            exportText += `${sender} [${time}]:\n${msg.text}\n\n`;
        });
        
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `чат_с_ИИ_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Чат успешно экспортирован', 'success');
    }

    initVoiceRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ru-RU';
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('userInput').value = transcript;
                this.updateCharCount(transcript.length);
                this.showNotification('Голосовой ввод завершен', 'success');
            };
            
            this.recognition.onerror = (event) => {
                this.showNotification('Ошибка голосового ввода: ' + event.error, 'error');
                this.isRecording = false;
                this.updateVoiceButton();
            };
            
            this.recognition.onend = () => {
                this.isRecording = false;
                this.updateVoiceButton();
            };
        } else {
            document.getElementById('voice-input').style.display = 'none';
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('Голосовой ввод не поддерживается вашим браузером', 'warning');
            return;
        }
        
        if (this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
        } else {
            this.recognition.start();
            this.isRecording = true;
            this.showNotification('Слушаю... Говорите сейчас', 'info');
        }
        
        this.updateVoiceButton();
    }

    updateVoiceButton() {
        const voiceBtn = document.getElementById('voice-input');
        const icon = voiceBtn.querySelector('i');
        
        if (this.isRecording) {
            icon.className = 'fas fa-stop';
            voiceBtn.style.backgroundColor = 'var(--danger-color)';
            voiceBtn.style.color = 'white';
        } else {
            icon.className = 'fas fa-microphone';
            voiceBtn.style.backgroundColor = '';
            voiceBtn.style.color = '';
        }
    }

    async handleFileUpload(files) {
        if (!files || files.length === 0) return;
        
        for (let file of files) {
            if (file.size > 10 * 1024 * 1024) { 
                this.showNotification(`Файл ${file.name} слишком большой (макс. 10MB)`, 'error');
                continue;
            }
            
            const fileData = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: this.formatFileSize(file.size),
                type: file.type,
                uploaded: new Date().toISOString(),
                content: null
            };
           
            if (file.type.startsWith('text/') || file.name.endsWith('.txt') || 
                file.name.endsWith('.md') || file.name.endsWith('.js') ||
                file.name.endsWith('.html') || file.name.endsWith('.css')) {
                
                try {
                    const text = await this.readFileAsText(file);
                    fileData.content = text;
                    fileData.preview = text.substring(0, 100) + '...';
                } catch (error) {
                    console.error('Ошибка чтения файла:', error);
                }
            }
            
            this.uploadedFiles.push(fileData);
            this.showNotification(`Файл "${file.name}" загружен`, 'success');
        }
        
        this.saveFiles();
        this.updateFilesDisplay();
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    handleImageUpload(files) {
        if (!files || files.length === 0) return;
        
        for (let file of files) {
            if (!file.type.startsWith('image/')) {
                this.showNotification(`Файл ${file.name} не является изображением`, 'warning');
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: this.formatFileSize(file.size),
                    type: file.type,
                    uploaded: new Date().toISOString(),
                    dataUrl: e.target.result
                };
                
                this.uploadedFiles.push(imageData);
                this.showNotification(`Изображение "${file.name}" загружено`, 'success');
                this.saveFiles();
                this.updateFilesDisplay();
            };
            
            reader.readAsDataURL(file);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateFilesDisplay() {
        const filesGrid = document.getElementById('files-grid');
        
        if (this.uploadedFiles.length === 0) {
            filesGrid.innerHTML = `
                <div class="file-empty">
                    <i class="fas fa-folder-open"></i>
                    <p>Загрузите файлы для анализа ИИ</p>
                    <button class="btn-primary" id="upload-first">Загрузить первый файл</button>
                </div>
            `;
            
            document.getElementById('upload-first')?.addEventListener('click', () => {
                document.getElementById('file-upload').click();
            });
            
            return;
        }
        
        filesGrid.innerHTML = '';
        
        this.uploadedFiles.forEach(file => {
            const fileCard = document.createElement('div');
            fileCard.className = 'file-card';
            
            let icon = 'fa-file';
            if (file.type.startsWith('image/')) icon = 'fa-image';
            else if (file.type.includes('pdf')) icon = 'fa-file-pdf';
            else if (file.type.includes('document') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) icon = 'fa-file-word';
            else if (file.name.endsWith('.js')) icon = 'fa-js';
            else if (file.name.endsWith('.html')) icon = 'fa-html5';
            else if (file.name.endsWith('.css')) icon = 'fa-css3';
            
            fileCard.innerHTML = `
                <div class="file-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="file-info">
                    <h4>${file.name}</h4>
                    <p>${file.size} • ${new Date(file.uploaded).toLocaleDateString()}</p>
                    ${file.preview ? `<p class="file-preview">${file.preview}</p>` : ''}
                </div>
                <div class="file-actions">
                    <button class="file-action-btn" onclick="aiAssistant.analyzeFile(${file.id})">
                        Анализ
                    </button>
                    <button class="file-action-btn" onclick="aiAssistant.deleteFile(${file.id})">
                        Удалить
                    </button>
                </div>
            `;
            
            filesGrid.appendChild(fileCard);
        });
    }

    analyzeFile(fileId) {
        const file = this.uploadedFiles.find(f => f.id === fileId);
        if (!file) return;
        
        this.showNotification(`Анализирую файл "${file.name}"...`, 'info');
        
        setTimeout(() => {
            let analysis = `Анализ файла "${file.name}":\n`;
            analysis += `Размер: ${file.size}\n`;
            analysis += `Тип: ${file.type || 'неизвестен'}\n`;
            
            if (file.content) {
                const words = file.content.split(/\s+/).length;
                const chars = file.content.length;
                analysis += `Количество слов: ${words}\n`;
                analysis += `Количество символов: ${chars}\n`;
                
                if (words > 0) {
                    const sentences = file.content.split(/[.!?]+/).length;
                    const avgWordLength = chars / words;
                    analysis += `Предложений: ${sentences}\n`;
                    analysis += `Средняя длина слова: ${avgWordLength.toFixed(2)} символов\n`;
                }
            }
            
            
            this.switchTab('chat');
            setTimeout(() => {
                this.addMessage(analysis, 'ai');
            }, 500);
        }, 1500);
    }

    deleteFile(fileId) {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
        this.saveFiles();
        this.updateFilesDisplay();
        this.showNotification('Файл удален', 'success');
    }

    saveFiles() {
        localStorage.setItem('ai_assistant_files', JSON.stringify(this.uploadedFiles));
    }

    loadFiles() {
        const savedFiles = localStorage.getItem('ai_assistant_files');
        if (savedFiles) {
            this.uploadedFiles = JSON.parse(savedFiles);
        }
    }

    handleQuickAction(action) {
        switch (action) {
            case 'summary':
                this.addMessage('Могу суммаризировать текст. Вставьте текст или загрузите файл для анализа.', 'ai');
                break;
            case 'translate':
                this.addMessage('Готов перевести текст. Укажите язык перевода и вставьте текст.', 'ai');
                break;
            case 'code':
                this.addMessage('Могу помочь с кодом. Опишите задачу или покажите код для анализа.', 'ai');
                break;
            case 'clear':
                this.newChat();
                break;
        }
    }

    useSuggestion(prompt) {
        document.getElementById('userInput').value = prompt;
        this.updateCharCount(prompt.length);
        this.showNotification('Предложение добавлено в поле ввода', 'info');
    }

    openToolModal(toolName) {
        const modal = document.getElementById('tool-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        
        const tools = {
            'code-generator': {
                title: 'Генератор кода',
                content: `
                    <div class="tool-modal-content">
                        <h4>Сгенерировать код</h4>
                        <div class="form-group">
                            <label>Язык программирования</label>
                            <select id="code-language">
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="html">HTML/CSS</option>
                                <option value="java">Java</option>
                                <option value="cpp">C++</option>
                                <option value="php">PHP</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Описание задачи</label>
                            <textarea id="code-description" rows="4" placeholder="Опишите, какой код нужно сгенерировать..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Сложность</label>
                            <select id="code-complexity">
                                <option value="simple">Простая</option>
                                <option value="medium" selected>Средняя</option>
                                <option value="complex">Сложная</option>
                            </select>
                        </div>
                        <button class="btn-primary" onclick="aiAssistant.generateCode()">
                            <i class="fas fa-code"></i> Сгенерировать код
                        </button>
                    </div>
                `
            },
            'translator': {
                title: 'Переводчик текста',
                content: `
                    <div class="tool-modal-content">
                        <h4>Перевод текста</h4>
                        <div class="form-group">
                            <label>Исходный язык</label>
                            <select id="source-language">
                                <option value="auto">Определить автоматически</option>
                                <option value="ru">Русский</option>
                                <option value="en">Английский</option>
                                <option value="es">Испанский</option>
                                <option value="fr">Французский</option>
                                <option value="de">Немецкий</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Целевой язык</label>
                            <select id="target-language">
                                <option value="ru">Русский</option>
                                <option value="en" selected>Английский</option>
                                <option value="es">Испанский</option>
                                <option value="fr">Французский</option>
                                <option value="de">Немецкий</option>
                                <option value="zh">Китайский</option>
                                <option value="ja">Японский</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Текст для перевода</label>
                            <textarea id="text-to-translate" rows="6" placeholder="Введите текст для перевода..."></textarea>
                        </div>
                        <button class="btn-primary" onclick="aiAssistant.translateText()">
                            <i class="fas fa-language"></i> Перевести
                        </button>
                    </div>
                `
            },
            'summarizer': {
                title: 'Суммаризатор текста',
                content: `
                    <div class="tool-modal-content">
                        <h4>Суммаризация текста</h4>
                        <div class="form-group">
                            <label>Длина суммаризации</label>
                            <select id="summary-length">
                                <option value="short">Короткая (1-2 предложения)</option>
                                <option value="medium" selected>Средняя (абзац)</option>
                                <option value="detailed">Подробная (несколько абзацев)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Текст для суммаризации</label>
                            <textarea id="text-to-summarize" rows="8" placeholder="Введите текст для суммаризации..."></textarea>
                        </div>
                        <div class="form-group">
                            <label>Ключевые моменты</label>
                            <input type="checkbox" id="include-key-points" checked>
                            <span>Включить ключевые моменты</span>
                        </div>
                        <button class="btn-primary" onclick="aiAssistant.summarizeText()">
                            <i class="fas fa-file-contract"></i> Суммаризировать
                        </button>
                    </div>
                `
            }
        };
        
        const tool = tools[toolName] || {
            title: 'Инструмент',
            content: `<p>Этот инструмент находится в разработке.</p>`
        };
        
        modalTitle.textContent = tool.title;
        modalBody.innerHTML = tool.content;
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('tool-modal').classList.remove('active');
    }

    generateCode() {
        const language = document.getElementById('code-language').value;
        const description = document.getElementById('code-description').value;
        const complexity = document.getElementById('code-complexity').value;
        
        if (!description.trim()) {
            this.showNotification('Введите описание задачи', 'warning');
            return;
        }
        
        this.closeModal();
        this.switchTab('chat');
        
        
        setTimeout(() => {
            const codeExamples = {
                javascript: `// Пример кода на JavaScript
function ${this.generateFunctionName(description)}() {
    // ${description}
    console.log("Hello, World!");
    
    // Добавьте вашу логику здесь
    return "Результат";
}`,
                python: `# Пример кода на Python
def ${this.generateFunctionName(description)}():
    """
    ${description}
    """
    print("Hello, World!")
    
    # Добавьте вашу логику здесь
    return "Результат"`,
                html: `<!-- Пример HTML кода -->
<!DOCTYPE html>
<html>
<head>
    <title>${description.substring(0, 30)}</title>
    <style>
        /* CSS стили */
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
        }
    </style>
</head>
<body>
    <h1>${description.substring(0, 50)}</h1>
    <!-- Добавьте ваш HTML код здесь -->
</body>
</html>`
            };
            
            const code = codeExamples[language] || `// Код для: ${description}\n// Выберите другой язык программирования`;
            this.addMessage(`Сгенерированный код (${language}, ${complexity} сложность):\n\`\`\`${language}\n${code}\n\`\`\``, 'ai');
        }, 1000);
    }

    translateText() {
        const text = document.getElementById('text-to-translate').value;
        const targetLang = document.getElementById('target-language').value;
        
        if (!text.trim()) {
            this.showNotification('Введите текст для перевода', 'warning');
            return;
        }
        
        this.closeModal();
        this.switchTab('chat');
       
        setTimeout(() => {
            const translations = {
                en: `Translation to English:\n"${text}" → "This is a translated text example."`,
                ru: `Перевод на русский:\n"${text}" → "Это пример переведенного текста."`,
                es: `Traducción al español:\n"${text}" → "Este es un ejemplo de texto traducido."`,
                fr: `Traduction en français:\n"${text}" → "Ceci est un exemple de texte traduit."`
            };
            
            const translation = translations[targetLang] || `Перевод на выбранный язык:\n"${text}" → "[Переведенный текст]"`;
            this.addMessage(translation, 'ai');
        }, 1000);
    }

    summarizeText() {
        const text = document.getElementById('text-to-summarize').value;
        
        if (!text.trim()) {
            this.showNotification('Введите текст для суммаризации', 'warning');
            return;
        }
        
        this.closeModal();
        this.switchTab('chat');
      
        setTimeout(() => {
            const wordCount = text.split(/\s+/).length;
            const summary = `Краткое содержание (исходный текст: ${wordCount} слов):\n\n` +
                           `Основная идея текста: ${text.substring(0, 100)}...\n\n` +
                           `Ключевые моменты:\n` +
                           `1. Первый важный аспект\n` +
                           `2. Второй ключевой момент\n` +
                           `3. Основной вывод\n\n` +
                           `Резюме: Текст содержит важную информацию по заданной теме.`;
            
            this.addMessage(summary, 'ai');
        }, 1500);
    }

    generateFunctionName(description) {
   
        return description
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .slice(0, 3)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('')
            .replace(/^./, ch => ch.toLowerCase()) || 'processData';
    }

    toggleTheme() {
        const isDark = document.body.classList.contains('light-theme');
        if (isDark) {
            document.body.classList.remove('light-theme');
            localStorage.setItem('ai_assistant_theme', 'dark');
            this.showNotification('Тема изменена на темную', 'success');
        } else {
            document.body.classList.add('light-theme');
            localStorage.setItem('ai_assistant_theme', 'light');
            this.showNotification('Тема изменена на светлую', 'success');
        }
    }

    saveSettings() {
        this.settings.username = document.getElementById('user-name').value;
        this.settings.language = document.getElementById('user-language').value;
        this.settings.aiModel = document.getElementById('model-select').value;
        this.settings.temperature = parseFloat(document.getElementById('ai-temperature').value);
        this.settings.maxTokens = parseInt(document.getElementById('ai-max-tokens').value);
        this.settings.saveHistory = document.getElementById('save-history').checked;
        this.settings.creativeMode = document.getElementById('creative-mode').checked;
        this.settings.rememberContext = document.getElementById('ai-context').checked;
        
        localStorage.setItem('ai_assistant_settings', JSON.stringify(this.settings));
        localStorage.setItem('ai_assistant_username', this.settings.username);
        
        document.getElementById('username').textContent = this.settings.username;
        this.showNotification('Настройки сохранены', 'success');
        
       
        this.updateStorageInfo();
    }

    resetSettings() {
        if (confirm('Сбросить все настройки к значениям по умолчанию?')) {
            this.settings = this.getDefaultSettings();
            localStorage.removeItem('ai_assistant_settings');
            
           
            document.getElementById('user-name').value = this.settings.username;
            document.getElementById('user-language').value = this.settings.language;
            document.getElementById('model-select').value = this.settings.aiModel;
            document.getElementById('ai-temperature').value = this.settings.temperature;
            document.getElementById('ai-max-tokens').value = this.settings.maxTokens;
            document.getElementById('save-history').checked = this.settings.saveHistory;
            document.getElementById('creative-mode').checked = this.settings.creativeMode;
            document.getElementById('ai-context').checked = this.settings.rememberContext;
            
            document.getElementById('temp-value').textContent = this.settings.temperature;
            document.getElementById('tokens-value').textContent = `${this.settings.maxTokens} токенов`;
            document.getElementById('username').textContent = this.settings.username;
            
            this.showNotification('Настройки сброшены', 'success');
        }
    }

    clearHistory() {
        if (confirm('Очистить всю историю чатов? Это действие нельзя отменить.')) {
            this.chatHistory = [];
            localStorage.removeItem('ai_assistant_history');
            document.getElementById('history-list').innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-history"></i>
                    <p>История чатов пуста</p>
                </div>
            `;
            this.showNotification('История очищена', 'success');
            this.updateStorageInfo();
        }
    }

    clearStorage() {
        if (confirm('Очистить все локальные данные? Это удалит историю, файлы и настройки.')) {
            localStorage.clear();
            this.initializeApp();
            this.loadData();
            this.showNotification('Все данные очищены', 'success');
            this.updateStorageInfo();
        }
    }

    loadData() {
      
        const savedSettings = localStorage.getItem('ai_assistant_settings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
            
            
            if (this.settings.username) {
                document.getElementById('username').textContent = this.settings.username;
                document.getElementById('user-name').value = this.settings.username;
            }
            
            if (this.settings.theme === 'light') {
                document.body.classList.add('light-theme');
            }
        }
        
      
        const savedHistory = localStorage.getItem('ai_assistant_history');
        if (savedHistory) {
            this.chatHistory = JSON.parse(savedHistory);
        }
        
        
        this.updateStorageInfo();
    }

    updateStorageInfo() {
        let totalSize = 0;
        
      
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length * 2;
            }
        }
        
        const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
        const percentage = Math.min((usedMB / 10) * 100, 100); 
        
        document.getElementById('storage-used').textContent = `${usedMB} MB`;
        document.getElementById('storage-fill').style.width = `${percentage}%`;
    }

    searchHistory(query) {
        const items = document.querySelectorAll('.history-item');
        const lowerQuery = query.toLowerCase();
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(lowerQuery) ? 'block' : 'none';
        });
    }

    updateCharCount(count) {
        document.getElementById('charCount').textContent = count;
        
        
        const charCount = document.getElementById('charCount');
        if (count > 3500) {
            charCount.style.color = 'var(--danger-color)';
        } else if (count > 3000) {
            charCount.style.color = 'var(--warning-color)';
        } else {
            charCount.style.color = '';
        }
    }

    setupAutoResize() {
        const textarea = document.getElementById('userInput');
        
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    showNotification(message, type = 'info') {
        const notificationCenter = document.getElementById('notification-center');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <div class="notification-content">
                <h5>${type === 'success' ? 'Успешно' : 
                       type === 'error' ? 'Ошибка' : 
                       type === 'warning' ? 'Предупреждение' : 'Информация'}</h5>
                <p>${message}</p>
            </div>
        `;
        
        notificationCenter.appendChild(notification);
        
       
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    copyMessage(button) {
        const messageText = button.closest('.message').querySelector('.message-text').textContent;
        navigator.clipboard.writeText(messageText)
            .then(() => this.showNotification('Сообщение скопировано', 'success'))
            .catch(() => this.showNotification('Не удалось скопировать', 'error'));
    }

    regenerateMessage(button) {
        const messageDiv = button.closest('.message');
        const messageText = messageDiv.querySelector('.message-text').textContent;
        
        
        messageDiv.remove();
        
       
        document.getElementById('userInput').value = messageText;
        this.sendMessage();
    }
}


let aiAssistant;

document.addEventListener('DOMContentLoaded', () => {
    aiAssistant = new AIAssistant();
    
    
    window.aiAssistant = aiAssistant;
    
   
    setTimeout(() => {
        aiAssistant.addMessage('Привет! Я ваш ИИ-помощник. Готов помочь с любыми задачами: отвечать на вопросы, анализировать файлы, генерировать код и многое другое. Чем могу быть полезен?', 'ai');
    }, 1000);

});
