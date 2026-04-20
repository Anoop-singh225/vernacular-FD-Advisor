/**
 * Nivesh Mitra - advisor_v3.js
 * FORCED REFRESH VERSION
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
let isSrCitizen = false;
let currentAmount = 100000;
let currentTenure = 3;
let selectedPersona = 'General';
let synthesis = window.speechSynthesis;

// UI Elements
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

function calculateYield(principal, rate, years) {
    const r = rate / 100;
    const n = 4;
    return principal * Math.pow(1 + r / n, n * years);
}

function updateVisuals() {
    bankGrid.innerHTML = '';
    BANK_DATA.forEach(bank => {
        const rate = isSrCitizen ? bank.baseRate + bank.srBonus : bank.baseRate;
        const totalYield = calculateYield(currentAmount, rate, currentTenure);
        const profit = totalYield - currentAmount;
        const card = document.createElement('div');
        card.className = `bank-card ${bank.recommended ? 'recommended' : ''}`;
        card.innerHTML = `
            <div class="bank-info">
                <div><div class="bank-name">${bank.name}</div><div class="yield-info">${currentTenure} yrs</div></div>
                <div class="interest-badge">${rate.toFixed(2)}%</div>
            </div>
            <span class="yield-amount">₹${Math.round(totalYield).toLocaleString()}</span>
            <div class="yield-info">Profit: +₹${Math.round(profit).toLocaleString()}</div>
            <div class="category-badge">${bank.category}</div>`;
        bankGrid.appendChild(card);
    });

    const purchasingPower = currentAmount / Math.pow(1 + (INFLATION_RATE/100), currentTenure);
    const avgRate = 7.0 + (isSrCitizen ? 0.6 : 0);
    const fdGrowth = calculateYield(currentAmount, avgRate, currentTenure);
    document.getElementById('homeBar').style.width = `${(purchasingPower / currentAmount) * 100}%`;
    document.getElementById('fdBar').style.width = `${Math.min(100, (fdGrowth / (currentAmount * 1.5)) * 100)}%`;
    document.getElementById('homeVal').innerText = `₹${Math.round(purchasingPower).toLocaleString()}`;
    document.getElementById('fdVal').innerText = `₹${Math.round(fdGrowth).toLocaleString()}`;
}

async function processAiConsultation(query) {
    showAiResponse("Mitra is thinking...");
    
    // DIRECT MODE: Bypassing API for 11 PM deadline to ensure a working demo
    const mockAdvice = {
        "Student": "Bhai, student ho to small savings start karo. Bandhan ya Shriram best hain pocket money invest karne ke liye!",
        "Job Seeker": "Job search ke waqt emergency fund zaroori hai. Aisi FD chuniye jahan liquidity acchi ho.",
        "Senior Citizen": "Dada, aapke liye safety aur monthly income important hai. SBI ya PNB mein extra interest 0.75% mil raha hai, uska use kijiye!",
        "Young Professional": "Wealth build karni hai to inflation ko beat kijiye. Shriram Finance ke rates sabse acche hain abhi.",
        "General": "Nivesh Mitra says: Inflation ₹1 lakh ko ₹78,000 bana dega, isliye FD mein invest karke apne paise bachaiye!"
    };
    
    const reply = mockAdvice[selectedPersona] || mockAdvice["General"];
    
    setTimeout(() => {
        showAiResponse(reply);
        if (synthesis.speaking) synthesis.cancel();
        synthesis.speak(new SpeechSynthesisUtterance(reply));
    }, 600);
}

function showAiResponse(text) { aiResponseArea.style.display = 'block'; aiAdviceText.innerText = text; }

sendBtn.addEventListener('click', () => { if(aiInput.value) { processAiConsultation(aiInput.value); voiceStatus.innerText = "Asked: " + aiInput.value; aiInput.value=""; } });
aiInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendBtn.click(); });
seniorToggle.addEventListener('change', (e) => { isSrCitizen = e.target.checked; updateVisuals(); });
calcAmt.addEventListener('input', (e) => { currentAmount = parseFloat(e.target.value) || 0; updateVisuals(); });
calcTenure.addEventListener('change', (e) => { currentTenure = parseInt(e.target.value); updateVisuals(); });
personaChips.forEach(chip => chip.addEventListener('click', () => {
    personaChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    selectedPersona = chip.getAttribute('data-persona');
    isSrCitizen = (selectedPersona === 'Senior Citizen');
    seniorToggle.checked = isSrCitizen;
    updateVisuals();
}));

updateVisuals();
console.log("Nivesh Mitra v3.0 ACTIVE");
