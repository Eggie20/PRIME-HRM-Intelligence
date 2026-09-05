/**
 * NBSC PRIME-HRM Intelligence Hub — SARA Voice AI Assistant Logic
 * Integrates Web Speech API (STT), SpeechSynthesis (TTS), HTML5 Canvas Waveform Visualizer,
 * and REST query dispatcher to /api/v1/sara/chat/.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSaraChat();
});

let activeSessionId = null;
let recognition = null;
let isListening = false;
let isTtsEnabled = true;
let animFrameId = null;
let visualizerState = 'idle'; // 'idle', 'listening', 'speaking'

/**
 * Initializes SARA interface, voice APIs, canvas animation, and event listeners.
 */
function initSaraChat() {
  initSpeechRecognition();
  initCanvasVisualizer();

  const btnMic = document.getElementById('btn-mic');
  const btnSend = document.getElementById('btn-sara-send');
  const inputMessage = document.getElementById('input-sara-message');
  const btnTts = document.getElementById('btn-toggle-tts');

  if (btnMic) {
    btnMic.addEventListener('click', toggleSpeechRecognition);
  }

  if (btnSend && inputMessage) {
    btnSend.addEventListener('click', () => handleSendUserMessage(inputMessage.value));
    inputMessage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendUserMessage(inputMessage.value);
      }
    });
  }

  if (btnTts) {
    btnTts.addEventListener('click', toggleTts);
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout && typeof logout === 'function') {
    btnLogout.addEventListener('click', logout);
  }
}

/**
 * Sets up the browser-native SpeechRecognition engine if available.
 */
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('Web Speech API (SpeechRecognition) is not supported in this browser.');
    const btnMic = document.getElementById('btn-mic');
    if (btnMic) btnMic.title = 'Speech Recognition not supported in this browser';
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-PH'; // Philippine English locale

  recognition.onstart = () => {
    isListening = true;
    visualizerState = 'listening';
    updateMicButtonUI(true);
    updateStatusCaption("SARA is listening to your microphone... Speak clearly.");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const inputField = document.getElementById('input-sara-message');
    if (inputField) inputField.value = transcript;
    updateStatusCaption(`Transcribed: "${transcript}"`);
    handleSendUserMessage(transcript);
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    isListening = false;
    visualizerState = 'idle';
    updateMicButtonUI(false);
    updateStatusCaption("Voice input paused. Click mic to speak again.");
  };

  recognition.onend = () => {
    isListening = false;
    if (visualizerState !== 'speaking') {
      visualizerState = 'idle';
    }
    updateMicButtonUI(false);
  };
}

/**
 * Toggles speech recognition recording.
 */
function toggleSpeechRecognition() {
  if (!recognition) {
    if (typeof showToast === 'function') {
      showToast('Speech Recognition is not supported by your browser. Please type your message.', 'info');
    }
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (err) {
      console.warn('Recognition start exception:', err);
    }
  }
}

/**
 * Toggles vocal response audio (Text-to-Speech).
 */
function toggleTts() {
  isTtsEnabled = !isTtsEnabled;
  const ttsStatus = document.getElementById('tts-status');
  const ttsIcon = document.getElementById('tts-icon');

  if (ttsStatus) ttsStatus.textContent = isTtsEnabled ? 'ON' : 'OFF';
  if (ttsIcon) ttsIcon.innerHTML = isTtsEnabled ? '&#128266;' : '&#128263;';

  if (!isTtsEnabled && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    visualizerState = 'idle';
  }

  if (typeof showToast === 'function') {
    showToast(`Voice vocalization ${isTtsEnabled ? 'enabled' : 'muted'}.`, 'info');
  }
}

/**
 * Updates mic button visual state.
 * @param {boolean} active - True if listening
 */
function updateMicButtonUI(active) {
  const btnMic = document.getElementById('btn-mic');
  if (btnMic) {
    if (active) {
      btnMic.classList.add('btn-mic--active');
    } else {
      btnMic.classList.remove('btn-mic--active');
    }
  }
}

/**
 * Updates caption in SARA aura banner.
 * @param {string} caption - Status message
 */
function updateStatusCaption(caption) {
  const el = document.getElementById('sara-status-caption');
  if (el) el.textContent = caption;
}

/**
 * Dispatches user utterance to backend and coordinates UI stream.
 * @param {string} messageText - Message text
 * @returns {Promise<void>}
 */
async function handleSendUserMessage(messageText) {
  const text = messageText.trim();
  if (!text) return;

  const inputField = document.getElementById('input-sara-message');
  if (inputField) inputField.value = '';

  // Append User message to UI
  appendMessageToStream('user', text);
  updateStatusCaption("SARA is analyzing policies & computing answer...");

  // Temporary typing indicator
  const typingBubble = appendTypingIndicator();

  try {
    const response = await fetch(`${API_BASE_URL}/sara/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(typeof getAuthToken === 'function' && getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
      },
      body: jsonBody({
        message: text,
        session_id: activeSessionId
      })
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Error communicating with SARA');

    const data = json.data;
    activeSessionId = data.session_id;

    // Remove typing indicator
    if (typingBubble) typingBubble.remove();

    // Append Assistant message
    appendMessageToStream('assistant', data.response, {
      citations: data.citations,
      suggestedPrompts: data.suggested_prompts
    });

    // Vocalize through SpeechSynthesis if enabled
    if (isTtsEnabled) {
      speakResponse(data.response);
    } else {
      updateStatusCaption("SARA ready for next question.");
    }
  } catch (err) {
    console.error('Error in SARA chat:', err);
    if (typingBubble) typingBubble.remove();
    appendMessageToStream('assistant', "I apologize, but I encountered an error retrieving that policy information. Please try again or rephrase your question.");
    updateStatusCaption("Ready.");
  }
}

/**
 * Helper to safely serialize JSON payload.
 * @param {Object} obj
 * @returns {string}
 */
function jsonBody(obj) {
  return JSON.stringify(obj);
}

/**
 * Appends a message bubble into the conversation stream.
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Markdown/plain text
 * @param {Object} [meta] - Citations & suggestions
 */
function appendMessageToStream(role, content, meta = {}) {
  const stream = document.getElementById('chat-stream');
  if (!stream) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message chat-message--${role}`;

  const avatarContent = role === 'assistant' ? '&#129302;' : 'U';
  const roleName = role === 'assistant' ? 'SARA AI HR Officer' : 'You';
  const headerClass = role === 'assistant' ? 'text-accent' : 'text-white';

  let citationsHtml = '';
  if (meta.citations && meta.citations.length > 0) {
    citationsHtml = `
      <div class="chat-message__citations">
        <span class="font-xs font-bold text-muted mr-1">Policy Citations:</span>
        ${meta.citations.map(c => `
          <span class="citation-pill" title="${c.section || ''}">&#128218; ${c.title}</span>
        `).join('')}
      </div>
    `;
  }

  let chipsHtml = '';
  if (meta.suggestedPrompts && meta.suggestedPrompts.length > 0) {
    chipsHtml = `
      <div class="chat-message__chips">
        ${meta.suggestedPrompts.map(p => `
          <button type="button" class="chip-btn" onclick="sendSuggestedPrompt('${escapeForAttr(p)}')">${p}</button>
        `).join('')}
      </div>
    `;
  }

  msgDiv.innerHTML = `
    <div class="chat-message__avatar">${avatarContent}</div>
    <div class="chat-message__bubble">
      <div class="chat-message__header">
        <strong class="${headerClass} font-xs">${roleName}</strong>
        <span class="text-muted font-xs">Just now</span>
      </div>
      <div class="chat-message__body">
        ${formatMarkdown(content)}
      </div>
      ${citationsHtml}
      ${chipsHtml}
    </div>
  `;

  stream.appendChild(msgDiv);
  stream.scrollTop = stream.scrollHeight;
}

/**
 * Appends a transient loading bubble.
 * @returns {HTMLElement}
 */
function appendTypingIndicator() {
  const stream = document.getElementById('chat-stream');
  if (!stream) return null;

  const div = document.createElement('div');
  div.className = 'chat-message chat-message--assistant';
  div.id = 'typing-indicator-bubble';
  div.innerHTML = `
    <div class="chat-message__avatar">&#129302;</div>
    <div class="chat-message__bubble">
      <div class="d-flex align-center gap-2 text-muted font-xs">
        <div class="loading-spinner loading-spinner--sm"></div>
        <span>SARA is searching policies...</span>
      </div>
    </div>
  `;
  stream.appendChild(div);
  stream.scrollTop = stream.scrollHeight;
  return div;
}

/**
 * Handles clicks from suggested prompt pills.
 * @param {string} promptText - Clicked prompt
 */
window.sendSuggestedPrompt = function(promptText) {
  const input = document.getElementById('input-sara-message');
  if (input) input.value = promptText;
  handleSendUserMessage(promptText);
};

/**
 * Simple markdown parser for bullet lists, bold text, and code spans.
 * @param {string} text
 * @returns {string}
 */
function formatMarkdown(text) {
  if (!text) return '';
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italics
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Code inline
  formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
  // Bullets
  formatted = formatted.replace(/^[•\-\*]\s+(.*)$/gm, '<li>$1</li>');
  // Line breaks
  formatted = formatted.replace(/\n\n/g, '<br><br>');
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

/**
 * Escapes strings for embedding in HTML onclick attributes.
 * @param {string} str
 * @returns {string}
 */
function escapeForAttr(str) {
  return str.replace(/'/g, "\\'");
}

/**
 * Vocalizes message using window.speechSynthesis.
 * @param {string} text - Message text to speak
 */
function speakResponse(text) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  // Strip markdown symbols for clean vocalization
  const cleanSpeech = text
    .replace(/[*_`#•]/g, ' ')
    .replace(/PHP\s+[\d,.]+/g, 'Philippine pesos')
    .substring(0, 300); // Speak first couple of sentences

  const utterance = new SpeechSynthesisUtterance(cleanSpeech);
  utterance.rate = 1.0;
  utterance.pitch = 1.05;

  utterance.onstart = () => {
    visualizerState = 'speaking';
    updateStatusCaption("SARA is speaking...");
  };

  utterance.onend = () => {
    visualizerState = 'idle';
    updateStatusCaption("SARA ready for next question.");
  };

  utterance.onerror = () => {
    visualizerState = 'idle';
    updateStatusCaption("Ready.");
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Animates the audio waveform on the HTML5 canvas.
 */
function initCanvasVisualizer() {
  const canvas = document.getElementById('voice-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let step = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = 4;
    const gap = 3;
    const barCount = Math.floor(width / (barWidth + gap));

    for (let i = 0; i < barCount; i++) {
      let barHeight = 4;

      if (visualizerState === 'listening') {
        // High frequency active ripple
        barHeight = 6 + Math.abs(Math.sin((step + i) * 0.3)) * 32;
      } else if (visualizerState === 'speaking') {
        // Harmonious sine wave
        barHeight = 4 + Math.abs(Math.sin((step + i * 2) * 0.15)) * 26;
      } else {
        // Idle gentle pulse
        barHeight = 3 + Math.abs(Math.sin((step + i) * 0.08)) * 8;
      }

      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      // Heritage Gold gradient
      const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
      grad.addColorStop(0, '#D4A843');
      grad.addColorStop(1, '#EAB308');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }

    step++;
    animFrameId = requestAnimationFrame(draw);
  }

  draw();
}
