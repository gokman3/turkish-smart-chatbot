// app.js - Application Logic

// Select HTML Elements
const sendBtn = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Message Adding Function
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');

    if (sender === 'user') {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('bot-message');
    }

    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);

    // Automatically scroll down
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Bot Reply
function botReply(text) {
    // Pretend to think for a bit (add delay)
    setTimeout(() => {
        const reply = brain.getReply(text);
        addMessage(reply, 'bot');
    }, 600);
}

// Message Sending Process
function sendMessage() {
    const text = userInput.value.trim();

    if (text !== "") {
        addMessage(text, 'user'); // Add user message
        userInput.value = ''; // Clear the box
        botReply(text); // Trigger bot reply
    }
}

// When button is clicked
sendBtn.addEventListener('click', sendMessage);

// When Enter key is pressed
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Focus on input when page loads
window.onload = () => {
    userInput.focus();
};
