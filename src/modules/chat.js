export class ChatManager {
  constructor() {
    this.isOpen = false;
    this.messages = [];
  }

  init() {
    const toggle = document.getElementById('chat-toggle');
    const window = document.getElementById('chat-window');
    const close = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');

    toggle.addEventListener('click', () => this.toggle());
    close.addEventListener('click', () => this.close());
    form.addEventListener('submit', (e) => this.sendMessage(e));

    // Add welcome message
    this.addMessage('¡Hola! Soy tu asistente financiero. ¿En qué puedo ayudarte hoy?', 'assistant');
  }

  toggle() {
    const window = document.getElementById('chat-window');
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      window.classList.remove('hidden');
      document.getElementById('chat-input').focus();
    } else {
      window.classList.add('hidden');
    }
  }

  close() {
    this.isOpen = false;
    document.getElementById('chat-window').classList.add('hidden');
  }

  async sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    this.addMessage(message, 'user');
    input.value = '';

    // Show typing indicator
    this.addTypingIndicator();

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      
      // Remove typing indicator
      this.removeTypingIndicator();
      
      if (data.reply) {
        this.addMessage(data.reply, 'assistant');
      } else {
        this.addMessage('Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?', 'assistant');
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.removeTypingIndicator();
      this.addMessage('Lo siento, hay un problema de conexión. Intenta más tarde.', 'assistant');
    }
  }

  addMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const message = document.createElement('div');
    message.className = `chat-message ${sender}`;
    message.textContent = text;
    
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    
    this.messages.push({ text, sender, timestamp: new Date() });
  }

  addTypingIndicator() {
    const container = document.getElementById('chat-messages');
    const indicator = document.createElement('div');
    indicator.className = 'chat-message assistant typing-indicator';
    indicator.innerHTML = '<div class="spinner"></div> Escribiendo...';
    indicator.id = 'typing-indicator';
    
    container.appendChild(indicator);
    container.scrollTop = container.scrollHeight;
  }

  removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
}