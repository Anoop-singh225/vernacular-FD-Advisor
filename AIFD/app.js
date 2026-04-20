/**
 * Nivesh Mitra - AI FD Advisor
 * v2.1 - Debugging AI Connection
 */

const BANK_DATA = [
    { id: 'sbi', name: 'State Bank of India', baseRate: 6.55, srBonus: 0.50, category: 'Public' },
    { id: 'hdfc', name: 'HDFC Bank', baseRate: 6.50, srBonus: 0.50, category: 'Private' },
    { id: 'icici', name: 'ICICI Bank', baseRate: 6.60, srBonus: 0.50, category: 'Private' },
    { id: 'kotak', name: 'Kotak Bank', baseRate: 6.80, srBonus: 0.50, category: 'Private' },
    { id: 'pnb', name: 'Punjab National Bank', baseRate: 6.40, srBonus: 0.50, category: 'Public' },
    { id: 'bob', name: 'Bank of Baroda', baseRate: 6.50, srBonus: 0.50, category: 'Public' },
    { id: 'bandhan', name: 'Bandhan Bank', baseRate: 7.00, srBonus: 0.75, category: 'Private' },
    { id: 'shriram', name: 'Shriram Finance', baseRate: 7.40, srBonus: 0.75, category: 'NBFC', recommended: true },
    { id: 'lichfl', name: 'LIC Housing Finance', baseRate: 6.90, srBonus: 0.25, category: 'Corporate/Public' },
    { id: 'sangam', name: 'Sangam City Co-op', baseRate: 7.20, srBonus: 0.50, category: 'Co-operative' }
];

const INFLATION_RATE = 4.6;

// State
let isSrCitizen = false;
let currentAmount = 100000;
let currentTenure = 3;
let selectedPersona = 'General';
let isListening = false;
let synthesis = window.speechSynthesis;

// DOM Elements
const aiInput = document.getElementById('aiInput');
const sendBtn = document.getElementById('sendBtn');
const voiceStatus = document.getElementById('voiceStatus');
const seniorToggle = document.getElementById('seniorToggle');
const bankGrid = document.getElementById('bankGrid');
const calcAmt = document.getElementById('calcAmt');
const calcTenure = document.getElementById('calcTenure');
const aiResponseArea = document.getElementById('aiResponseArea');
const aiAdviceText = document.getElementById('aiAdviceText');
const stopAudioBtn = document.getElementById('stopAudio');
const geminiKeyInput = document.getElementById('geminiKey');
const personaChips = document.querySelectorAll('.persona-chip');

// --- 1. Financial Functions ---

function calculateYield(principal, rate, years) {
    const r = rate / 100;
    const n = 4; // Quarterly
    return principal * Math.pow(1 + r / n, n * years);
}

function updateVisuals() {
    renderBanks();
    renderInflation();
}

function renderBanks() {
    bankGrid.innerHTML = '';
    BANK_DATA.forEach(bank => {
        const rate = isSrCitizen ? bank.baseRate + bank.srBonus : bank.baseRate;
        const totalYield = calculateYield(currentAmount, rate, currentTenure);
        const profit = totalYield - currentAmount;

        const card = document.createElement('div');
        card.className = `bank-card ${bank.recommended ? 'recommended' : ''}`;
        card.innerHTML = `
            <div class="bank-info">
                <div>
                    <div class="bank-name">${bank.name}</div>
                    <div class="yield-info">Returns in ${currentTenure} yrs</div>
                </div>
                <div class="interest-badge">${rate.toFixed(2)}%</div>
            </div>
            <span class="yield-amount">₹${totalYield.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            <div class="yield-info">
                Profit: +₹${profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div class="category-badge">${bank.category}</div>
        `;
        bankGrid.appendChild(card);
    });
}

function renderInflation() {
    const purchasingPower = currentAmount / Math.pow(1 + (INFLATION_RATE / 100), currentTenure);
    const avgRate = 7.0 + (isSrCitizen ? 0.6 : 0);
    const fdGrowth = calculateYield(currentAmount, avgRate, currentTenure);

    const homeBar = document.getElementById('homeBar');
    const fdBar = document.getElementById('fdBar');
    const homeVal = document.getElementById('homeVal');
    const fdVal = document.getElementById('fdVal');

    const homePercent = (purchasingPower / currentAmount) * 100;
    const fdPercent = Math.min(100, (fdGrowth / (currentAmount * 1.5)) * 100);

    homeBar.style.width = `${homePercent}%`;
    fdBar.style.width = `${fdPercent}%`;

    homeVal.innerText = `₹${Math.round(purchasingPower).toLocaleString()}`;
    fdVal.innerText = `₹${Math.round(fdGrowth).toLocaleString()}`;
}

// --- 2. Voice & AI Functions ---

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'hi-IN';

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        voiceStatus.innerText = "Suniye... (Listening)";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        voiceStatus.innerText = `Aapne poocha: "${transcript}"`;
        processAiConsultation(transcript).catch(e => {
            showAiResponse("Error: " + e.message);
        });
    };

    recognition.onend = () => {
        isListening = false;
    };
}

function handleSend() {
    const query = aiInput.value.trim();
    if (query) {
        processAiConsultation(query);
        aiInput.value = ""; // Clear after sending
        voiceStatus.innerText = "Aapne poocha: " + query;
    }
}

async function processAiConsultation(query) {
    // 1. Get Key
    let apiKey = geminiKeyInput.value.trim();
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        apiKey = "AIzaSyAFcuLGs241bkhWtOrW1X1awG2exO_tsUU";
    }

    if (apiKey.length < 10) {
        showAiResponse("Bhai, please provide a valid Gemini API key.");
        return;
    }

    showAiResponse("Mitra is thinking...");

    const systemPrompt = `You are "Nivesh Mitra", an expert Indian Financial Advisor.
    Context: Persona=${selectedPersona}, Amt=₹${currentAmount}, Tenure=${currentTenure}, SrCitizen=${isSrCitizen}.
    Respond in short, catchy HINGLISH. Recommended: Shriram Finance or Bandhan for yield.`;

    try {
        const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-pro", "gemini-1.5-pro"];
        let lastError = "";
        let success = false;

        async function processAiConsultation(query) {
            let apiKey = geminiKeyInput.value.trim();
            // Apni fallback key check kar lena
            if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
                
            }

            showAiResponse("Mitra is thinking...");

            // PRO-TIP: Gemini 1.5 Flash is fastest for MVP
            const model = "gemini-1.5-flash";
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const systemPrompt = `You are "Nivesh Mitra", an expert Indian Financial Advisor.
    Context: Persona=${selectedPersona}, Amt=₹${currentAmount}, Tenure=${currentTenure}, SrCitizen=${isSrCitizen}.
    Respond in short, catchy HINGLISH. Recommended: Shriram Finance or Bandhan for yield.`;

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `${systemPrompt}\n\nQuestion: ${query}` }] }]
                    })
                });

                const data = await response.json();

                if (response.ok && data.candidates && data.candidates[0].content) {
                    const advice = data.candidates[0].content.parts[0].text;
                    showAiResponse(advice);
                    speakAdvice(advice);
                } else {
                    // Agar error aaye toh handle karein
                    const errorMsg = data.error ? data.error.message : "Kuch gadbad ho gayi bhai!";
                    throw new Error(errorMsg);
                }

            } catch (error) {
                console.error("AI Error:", error);
                showAiResponse("Mitra Error: Model not responding. Try again after 2 mins.");
            }
        }

        if (!success) {
            throw new Error(lastError || "All models failed");
        }

    } catch (error) {
        console.error("AI Error:", error);
        showAiResponse("Mitra Error: " + error.message + ". Check your internet or API key.");
    }
}

function showAiResponse(text) {
    aiResponseArea.style.display = 'block';
    aiAdviceText.innerText = text;
}

function speakAdvice(text) {
    if (synthesis.speaking) synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.9;
    synthesis.speak(utterance);
}

// --- 3. Event Listeners ---

seniorToggle.addEventListener('change', (e) => {
    isSrCitizen = e.target.checked;
    updateVisuals();
});

calcAmt.addEventListener('input', (e) => {
    currentAmount = parseFloat(e.target.value) || 0;
    updateVisuals();
});

calcTenure.addEventListener('change', (e) => {
    currentTenure = parseInt(e.target.value);
    updateVisuals();
});

sendBtn.addEventListener('click', handleSend);
aiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

personaChips.forEach(chip => {
    chip.addEventListener('click', () => {
        personaChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedPersona = chip.getAttribute('data-persona');
        if (selectedPersona === 'Senior Citizen') {
            seniorToggle.checked = true;
            isSrCitizen = true;
        } else {
            seniorToggle.checked = false;
            isSrCitizen = false;
        }
        updateVisuals();
    });
});

stopAudioBtn.addEventListener('click', () => {
    if (synthesis.speaking) synthesis.cancel();
});

// Init
updateVisuals();
console.log("Nivesh Mitra 2.1 Debug Mode Activated.");
