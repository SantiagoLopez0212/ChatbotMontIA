// VOICE MODE — MontIA
// Speech-to-Text, Text-to-Speech, Podcast Mode
// Usa APIs nativas del navegador (100% gratis)


const VoiceMode = (() => {
    let recognition = null;
    let isListening = false;
    let autoReadEnabled = false;
    let currentUtterance = null;

    // SPEECH-TO-TEXT (Micrófono)
    function initSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn('SpeechRecognition no soportado en este navegador.');
            return false;
        }

        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            isListening = true;
            const micBtn = document.getElementById('mic-btn');
            if (micBtn) {
                micBtn.classList.add('recording');
                micBtn.title = 'Escuchando... haz clic para detener';
            }
        };

        recognition.onresult = (event) => {
            const input = document.getElementById('user-input');
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (input) input.value = transcript;
        };

        recognition.onend = () => {
            isListening = false;
            const micBtn = document.getElementById('mic-btn');
            if (micBtn) {
                micBtn.classList.remove('recording');
                micBtn.title = 'Hablar (micrófono)';
            }
            // Auto-submit si hay texto
            const input = document.getElementById('user-input');
            const form = document.getElementById('chat-form');
            if (input && input.value.trim() && form) {
                form.dispatchEvent(new Event('submit', { cancelable: true }));
            }
        };

        recognition.onerror = (event) => {
            console.error('Error de reconocimiento de voz:', event.error);
            isListening = false;
            const micBtn = document.getElementById('mic-btn');
            if (micBtn) micBtn.classList.remove('recording');

            if (event.error === 'not-allowed') {
                alert('Permiso de micrófono denegado. Habilita el acceso en la configuración del navegador.');
            }
        };

        return true;
    }

    function toggleListening() {
        if (!recognition) {
            const ok = initSpeechRecognition();
            if (!ok) {
                alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
                return;
            }
        }

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }
    
    // TEXT-TO-SPEECH (Voz del bot)
    function speak(text) {
        if (!window.speechSynthesis) {
            console.warn('SpeechSynthesis no soportado.');
            return;
        }

        // Cancelar cualquier lectura en curso
        window.speechSynthesis.cancel();

        const cleanText = text.replace(/MontIA:\s*/g, '').replace(/[*_#`]/g, '').trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Buscar mejor voz en español
        const voices = window.speechSynthesis.getVoices();
        const spanishVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Google'))
            || voices.find(v => v.lang.startsWith('es'))
            || voices[0];

        if (spanishVoice) utterance.voice = spanishVoice;

        currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
    }

    function stopSpeaking() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }

    function toggleAutoRead() {
        autoReadEnabled = !autoReadEnabled;
        const btn = document.getElementById('speaker-btn');
        if (btn) {
            btn.classList.toggle('active', autoReadEnabled);
            btn.textContent = autoReadEnabled ? '🔊' : '🔇';
            btn.title = autoReadEnabled ? 'Lectura automática activada (click para desactivar)' : 'Lectura automática desactivada (click para activar)';
        }
        return autoReadEnabled;
    }

    function isAutoReadEnabled() {
        return autoReadEnabled;
    }

    // =====================
    // PODCAST MODE
    // =====================
    async function generatePodcast(query, results, getAuthHeaders) {
        const podcastBtn = document.getElementById('podcast-active-btn');
        if (podcastBtn) {
            podcastBtn.disabled = true;
            podcastBtn.textContent = '⏳ Generando resumen narrado...';
        }

        const articlesText = results.map((item, i) =>
            `${i + 1}. "${item.title}" (${item.year || 's.f.'}) por ${item.author || 'Autor desconocido'}`
        ).join('\n');

        const prompt = `Actúa como un presentador de un podcast académico especializado. 
Narra un resumen de los siguientes artículos encontrados sobre "${query}" de forma amena, 
como si estuvieras grabando un episodio de podcast. Usa un tono conversacional pero informativo.
Comienza con "Bienvenidos a MontIA Podcast Académico" y concluye con un cierre. 
Máximo 200 palabras. Responde SOLO con la narración, sin instrucciones ni formato.

Artículos encontrados:
${articlesText}`;

        try {
            const res = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ message: prompt, filters: {} })
            });

            if (!res.ok) throw new Error('Error en el servidor');
            const data = await res.json();
            const narration = (data.reply || '').replace(/<[^>]*>/g, '');

            if (narration) {
                // Mostrar en el chat
                const chatBox = document.getElementById('chat-box');
                const msgDiv = document.createElement('div');
                msgDiv.classList.add('message', 'bot', 'podcast-message');
                msgDiv.innerHTML = `<div class="podcast-header">🎙️ MontIA Podcast Académico</div><div class="podcast-body">${narration}</div>`;
                chatBox.appendChild(msgDiv);
                chatBox.scrollTop = chatBox.scrollHeight;

                // Narrar en voz alta
                speak(narration);
            }
        } catch (err) {
            console.error('Error generando podcast:', err);
        } finally {
            if (podcastBtn) {
                podcastBtn.disabled = false;
                podcastBtn.textContent = '🎙️ Escuchar Resumen Podcast';
                podcastBtn.id = ''; // Reset ID
            }
        }
    }

    // =====================
    // INIT
    // =====================
    function init() {
        // Cargar voces (necesario en algunos navegadores)
        if (window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
            // Trigger carga inicial
            window.speechSynthesis.getVoices();
        }

        // Listener del botón de micrófono
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.addEventListener('click', toggleListening);
        }

        // Listener del botón de speaker
        const speakerBtn = document.getElementById('speaker-btn');
        if (speakerBtn) {
            speakerBtn.addEventListener('click', toggleAutoRead);
        }
    }

    return {
        init,
        speak,
        stopSpeaking,
        toggleListening,
        toggleAutoRead,
        isAutoReadEnabled,
        generatePodcast
    };
})();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    VoiceMode.init();
});
