// ============================================================
//  HippoType — Main Application Script (Unified)
//  Features: Login, Google Sheets, Meaningful Sentences,
//  Code Snippets (C/C++/Python/Java/React), Adaptive Difficulty,
//  Custom Text Ingestion, Second Chance (Rescue Key)
// ============================================================

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwawcHyCJAaKcodanaVECWi9nVutL8IhGrGSj7uf22vxGcmyYBX6Kl1Fl5lu9wRn8O07g/exec';
let gameState = {
    isTyping: false, startTime: 0, currentCharIndex: 0,
    totalChars: 0, correctChars: 0, totalErrors: 0,
    consecutiveErrors: 0, combo: 0, maxCombo: 0,
    testMode: '60s', difficulty: 'medium', language: 'en',
    codeLanguage: 'python', wordList: [], targetText: '',
    wpmHistory: [], timerInterval: null, chartInterval: null,
    isCustomText: false,
    adaptiveHistory: [] 
};

let auth = { username: null };

let rescueTokens = 3; // FIXED: Added missing rescueTokens variable

let userProfile = {
    stats: { totalTests: 0, bestWPM: 0, avgWPM: 0, avgAccuracy: 0, streak: 0 },
    achievements: {
        speedDemon:    { name: "Speed Demon",   desc: "Reach 80 WPM",        icon: "⚡", threshold: 80,  unlocked: false },
        perfectionist: { name: "Perfectionist", desc: "100% accuracy",       icon: "✨", threshold: 100, unlocked: false },
        marathon:      { name: "Marathon",       desc: "Complete 5-min test", icon: "🏃", unlocked: false },
        combo50:       { name: "Combo Master",   desc: "50 combo streak",    icon: "🔥", threshold: 50,  unlocked: false },
        persistent:    { name: "Persistent",     desc: "10 tests completed", icon: "💪", threshold: 10,  unlocked: false },
    },
    preferences: { theme: 'ocean', fontSize: 24, smoothCaret: true, blindMode: false, adaptiveMode: false }
};

// ──── Meaningful Sentence Banks ────
const sentenceBanks = {
    en: {
        easy: [
            "The sun is shining bright today.", "I love to read good books.",
            "She smiled and waved at me.", "The cat sat on the warm mat.",
            "We had a great time together.", "Keep going and never give up.",
            "Today is a beautiful new day.", "Birds sing songs in the morning.",
            "Good things come to those who wait.", "Dreams can come true with hard work.",
            "Music makes the world a better place.", "Every step forward matters a lot."
        ],
        medium: [
            "Believe in yourself and all that you are capable of achieving.",
            "The journey of a thousand miles begins with a single step.",
            "Success is not final and failure is not fatal.",
            "Every morning brings new potential for growth and learning.",
            "The greatest glory lies not in never falling but in rising.",
            "Happiness depends upon ourselves and the choices we make.",
            "Education is the most powerful weapon which you can use.",
            "The best way to predict the future is to create it."
        ],
        hard: [
            "The extraordinary achievements of humanity demonstrate that persistence can overcome obstacles.",
            "Scientific discoveries have shown that the universe operates according to elegant mathematical principles.",
            "Throughout the centuries, philosophers have debated the fundamental nature of consciousness and free will.",
            "Environmental sustainability requires a comprehensive approach that balances economic development.",
            "The intersection of technology and creativity has produced remarkable innovations.",
            "Critical thinking involves the objective analysis and evaluation of an issue."
        ],
        expert: [
            "The epistemological foundations of scientific methodology rest upon philosophical frameworks established earlier.",
            "Contemporary neuroscience has revealed the extraordinary plasticity of the human brain over time.",
            "The mathematical elegance of fundamental physical theories suggests a profound connection between abstract structures and observable phenomena.",
            "Interdisciplinary research at the intersection of computational biology and machine learning has accelerated our understanding of complex systems."
        ]
    },
    es: {
        easy: ["El sol brilla hoy.", "Me gusta leer.", "El gato duerme.", "Buenos dias a todos.", "Vamos a jugar."],
        medium: ["El viaje de mil millas comienza con un solo paso.", "La educación es el arma más poderosa.", "Siempre parece imposible hasta que se hace."],
        hard: ["Las extraordinarias maravillas del mundo nos enseñan a apreciar la belleza de la naturaleza en todas sus formas."],
        expert: ["Los principios epistemológicos de la ciencia moderna requieren una evaluación rigurosa y un análisis profundo de cada fenómeno observado."]
    },
    fr: {
        easy: ["Le soleil brille aujourd'hui.", "J'aime lire des livres.", "Le chat dort bien.", "Bonjour tout le monde.", "Allons jouer ensemble."],
        medium: ["Le voyage de mille lieues commence par un seul pas.", "L'éducation est l'arme la plus puissante.", "Cela semble toujours impossible jusqu'à ce qu'on le fasse."],
        hard: ["Les merveilles extraordinaires du monde nous apprennent à apprécier la beauté de la nature sous toutes ses formes."],
        expert: ["Les principes épistémologiques de la science moderne exigent une évaluation rigoureuse et une analyse approfondie de chaque phénomène observé."]
    },
    de: {
        easy: ["Die Sonne scheint heute.", "Ich lese gerne Bücher.", "Die Katze schläft gut.", "Guten Morgen zusammen.", "Lass uns zusammen spielen."],
        medium: ["Die Reise von tausend Meilen beginnt mit einem einzigen Schritt.", "Bildung ist die mächtigste Waffe.", "Es scheint immer unmöglich, bis es getan ist."],
        hard: ["Die außergewöhnlichen Wunder der Welt lehren uns, die Schönheit der Natur in all ihren Formen zu schätzen."],
        expert: ["Die erkenntnistheoretischen Prinzipien der modernen Wissenschaft erfordern eine strenge Bewertung und eine tiefgreifende Analyse jedes beobachteten Phänomens."]
    },
    steno: {
        easy: [
            "The quick brown fox jumps over the lazy dog.",
            "Please record the witness statement accurately.",
            "The court is now in session for the hearing."
        ],
        medium: [
            "The defendant is required to answer the questions truthfully.",
            "Stenography requires immense focus and muscle memory.",
            "All evidence must be marked and submitted to the clerk."
        ],
        hard: [
            "Cross examination of the primary witness will begin immediately.",
            "The plaintiff's attorney has filed a motion for discovery.",
            "Transcribing rapid dialogue is the ultimate test of a reporter."
        ]
    }
};

// ──── Code Snippet Banks ────
const codeSnippets = {
    c: {
        easy: ['int main() { printf("Hello World"); return 0; }', 'int x = 10; int y = 20; int sum = x + y;', 'for (int i = 0; i < 10; i++) { printf("%d", i); }'],
        medium: ['int factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }', 'void swap(int *a, int *b) { int temp = *a; *a = *b; *b = temp; }'],
        hard: ['void quicksort(int arr[], int low, int high) { if (low < high) { int pivot = arr[high]; } }'],
        expert: ['void *threadFunc(void *arg) { pthread_mutex_lock(&mutex); shared_counter++; pthread_mutex_unlock(&mutex); return NULL; }']
    },
    cpp: {
        easy: ['cout << "Hello World" << endl;', 'vector<int> nums = {1, 2, 3, 4, 5};'],
        medium: ['template<typename T> T maxVal(T a, T b) { return (a > b) ? a : b; }', 'auto lambda = [](int a, int b) { return a + b; };'],
        hard: ['class LinkedList { struct Node { int data; Node* next; }; Node* head = nullptr; };'],
        expert: ['template<typename... Args> void log(const string& fmt, Args&&... args) { ostringstream oss; ((oss << args << " "), ...); }']
    },
    python: {
        easy: ['print("Hello World")', 'for i in range(10):\n    print(i)', 'fruits = ["apple", "banana"]\nfor fruit in fruits:\n    print(fruit)'],
        medium: ['def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)', 'filtered = list(filter(lambda x: x > 5, [1, 3, 5]))'],
        hard: ['def merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    return merge(left, right)'],
        expert: ['import asyncio\nasync def fetch_data(url):\n    async with aiohttp.ClientSession() as session:\n        async with session.get(url) as response:\n            return await response.json()']
    },
    java: {
        easy: ['System.out.println("Hello World");', 'int[] nums = {1, 2, 3, 4, 5};'],
        medium: ['public class Calculator {\n    public int add(int a, int b) { return a + b; }\n}', 'List<Integer> list = Arrays.asList(1, 2, 3);'],
        hard: ['public abstract class Animal {\n    protected String name;\n    public abstract String makeSound();\n}'],
        expert: ['public class ThreadSafeQueue<T> {\n    private final Queue<T> queue = new LinkedList<>();\n    private final ReentrantLock lock = new ReentrantLock();\n}']
    },
    react: {
        easy: ['function App() { return <h1>Hello World</h1>; }', 'const [count, setCount] = useState(0);'],
        medium: ['useEffect(() => {\n  fetchData();\n}, []);', 'const ThemeContext = createContext("light");'],
        hard: ['function useDebounce(value, delay) {\n  const [debounced, setDebounced] = useState(value);\n  return debounced;\n}'],
        expert: ['const DataContext = createContext();\nfunction DataProvider({ children }) {\n  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;\n}']
    }
};

/* ===== DOM Initialization ===== */
const elements = {};

document.addEventListener('DOMContentLoaded', () => {
    // Populate elements dictionary
    ['testMode','difficulty','language','newGameBtn','settingsBtn','wpm','accuracy','timer','combo',
     'errors','bestWPM','avgWPM','totalTests','streak','game-area','target-words','cursor','focus-prompt',
     'progressBar','results-panel','finalWPM','finalAccuracy','finalTime','finalCombo','totalChars',
     'correctCharsCount','totalErrorsCount','rawWPM','retryBtn','nextBtn','shareBtn','settings-modal',
     'closeSettings','themeSelect','fontSize','fontSizeValue','blindMode','exportStats','resetStats',
     'welcomeUser','loading-screen','wpmChart','achievements-panel','achievementsGrid','login-modal',
     'login-username','login-password','login-btn','login-error','tab-login','tab-signup',
     'code-lang-group','codeLanguage','adaptive-badge','customTextBtn','custom-text-modal',
     'closeCustomText','customTextArea','useCustomTextBtn','clearCustomTextBtn','adaptiveMode','logoutBtn',
     'steno-funnel', 'leaderboardBtn', 'leaderboard-modal', 'closeLeaderboard', 'leaderboardTable',
     'leaderboardBody', 'leaderboard-loading', 'leaderboard-error', 'lb-speed-header', 'resultsPanel', 'rescueTokens'
    ].forEach(id => { elements[id] = document.getElementById(id); });

    // FIX 3: Explicitly map the camelCase variables so the Leaderboard doesn't crash
    elements.gameArea = elements['game-area'];
    elements.targetWords = elements['target-words'];
    elements.leaderboardLoading = elements['leaderboard-loading'];
    elements.leaderboardError = elements['leaderboard-error'];
    elements.leaderboardTable = elements['leaderboardTable'];
    elements.leaderboardBody = elements['leaderboardBody'];
    elements.lbSpeedHeader = elements['lb-speed-header'];
    elements.resultsPanel = elements['results-panel'];

    loadUserProfile();
    loadAuth();
    applyPreferences();

    // FIX 1: Always hide the loading screen immediately so the site doesn't freeze
    hideLoadingScreen();

    if (!auth.username) {
        showLogin();
    } else {
        initApp();
    }

    initializeLoginListeners();
});

function initApp() {
    initializeEventListeners();
    initializeChart();
    updateUI();
    generateText();
    updateAchievementsDisplay();
}

/* ===== GOOGLE SHEETS API ===== */
async function fetchGS(action, dataObj = {}) {
    if (!GOOGLE_SCRIPT_URL) {
        return { status: 'success', message: 'Offline mode active.' };
    }
    try {
        const res = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            // Google Apps Script requires plain text to avoid CORS preflight failures
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: action, ...dataObj })
        });
        return await res.json();
    } catch (e) {
        console.error('GS Fetch Error:', e);
        // Fallback for demo purposes if the fetch fails locally
        return { status: 'error', error: 'Database connection failed. Check console.' };
    }
}

/* ===== LOGIN ===== */
let loginMode = 'login';

function loadAuth() {
    auth.username = localStorage.getItem('hippotypeAuth');
}

function saveAuth(username) {
    if (username) {
        localStorage.setItem('hippotypeAuth', username);
        auth.username = username;
    } else {
        localStorage.removeItem('hippotypeAuth');
        auth.username = null;
    }
}

function initializeLoginListeners() {
    if (elements['tab-login']) {
        elements['tab-login'].addEventListener('click', () => {
            loginMode = 'login';
            elements['tab-login'].classList.add('active');
            elements['tab-signup'].classList.remove('active');
            elements['login-btn'].textContent = 'Sign In';
        });
    }
    if (elements['tab-signup']) {
        elements['tab-signup'].addEventListener('click', () => {
            loginMode = 'signup';
            elements['tab-signup'].classList.add('active');
            elements['tab-login'].classList.remove('active');
            elements['login-btn'].textContent = 'Sign Up';
        });
    }
    if (elements['login-btn']) elements['login-btn'].addEventListener('click', attemptLogin);
    [elements['login-username'], elements['login-password']].forEach(el => {
        if(el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
    });
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', () => {
            saveAuth(null);
            closeSettings();
            showLogin();
        });
    }
}

function showLogin() {
    if (elements['login-modal']) {
        elements['login-modal'].style.display = 'flex';
        elements['login-modal'].setAttribute('aria-hidden', 'false');
    }
    setTimeout(() => { if (elements['login-username']) elements['login-username'].focus(); }, 120);
}

function hideLogin() {
    if (elements['login-modal']) {
        elements['login-modal'].style.display = 'none';
        elements['login-modal'].setAttribute('aria-hidden', 'true');
    }
}

async function attemptLogin() {
    const username = elements['login-username']?.value?.trim();
    const password = elements['login-password']?.value?.trim();

    if (!username || !password) {
        if (elements['login-error']) elements['login-error'].textContent = 'Please enter both username and password.';
        return;
    }

    elements['login-btn'].disabled = true;
    elements['login-btn'].textContent = 'Loading...';

    const passwordHash = btoa(password); 

    let result;
    if (loginMode === 'signup') {
        result = await fetchGS('register', { username, password: passwordHash }); // Use 'register' to match GAS code
        if (result && result.status === 'success') {
            loginMode = 'login'; 
            result = await fetchGS('login', { username, password: passwordHash });
        }
    } else {
        result = await fetchGS('login', { username, password: passwordHash });
    }

    elements['login-btn'].disabled = false;
    elements['login-btn'].textContent = loginMode === 'signup' ? 'Sign Up' : 'Sign In';

    // FIX 2: Check result.status, NOT result.success
    if (result && result.status === 'success') {
        saveAuth(username);
        if (elements['login-error']) elements['login-error'].textContent = '';
        hideLogin();
        if (elements.welcomeUser) elements.welcomeUser.textContent = `Welcome, ${auth.username}`;
        initApp();
    } else {
        const errorMsg = result ? (result.message || result.error) : 'Network failure.';
        if (elements['login-error']) elements['login-error'].textContent = errorMsg;
    }
}

/* ===== PREFERENCES ===== */
function hideLoadingScreen() {
    setTimeout(() => {
        if (elements['loading-screen']) {
            elements['loading-screen'].classList.add('fade-out');
            setTimeout(() => { elements['loading-screen'].style.display = 'none'; }, 500);
        }
    }, 500);
}

function closeSettings() {
    if (elements['settings-modal']) {
        elements['settings-modal'].classList.add('hidden');
        elements['settings-modal'].setAttribute('aria-hidden', 'true');
    }
}

function loadUserProfile() {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            userProfile = Object.assign(userProfile, parsed);
        } catch (e) { }
    }
    rescueTokens = localStorage.getItem('rescueTokens') ? parseInt(localStorage.getItem('rescueTokens')) : 3;
    applyPreferences();
}

function saveUserProfile() {
    try {
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        localStorage.setItem('rescueTokens', rescueTokens.toString());
    } catch (e) { }
}

function applyPreferences() {
    const prefs = userProfile.preferences || {};
    document.body.classList.remove('theme-ocean', 'theme-forest', 'theme-matrix', 'theme-sunset', 'theme-dark');
    const themeToApply = prefs.theme || 'ocean';
    document.body.classList.add(`theme-${themeToApply}`);
    if (elements.themeSelect) elements.themeSelect.value = themeToApply;

    if (elements.targetWords) elements.targetWords.style.fontSize = `${prefs.fontSize}px`;
    if (elements.fontSize) elements.fontSize.value = prefs.fontSize;
    if (elements.fontSizeValue) elements.fontSizeValue.textContent = `${prefs.fontSize}px`;

    if (elements.blindMode) elements.blindMode.checked = !!prefs.blindMode;
    if (elements.adaptiveMode) elements.adaptiveMode.checked = !!prefs.adaptiveMode;
    if (elements['adaptive-badge']) elements['adaptive-badge'].classList.toggle('hidden', !prefs.adaptiveMode);

    if (elements.welcomeUser) elements.welcomeUser.textContent = auth.username ? `Welcome, ${auth.username}` : 'Welcome';
    if (elements.rescueTokens) elements.rescueTokens.textContent = rescueTokens;
}

/* ===== EVENT LISTENERS ===== */
function initializeEventListeners() {
    elements.newGameBtn?.addEventListener('click', startNewGame);
    elements.retryBtn?.addEventListener('click', startNewGame);
    elements.nextBtn?.addEventListener('click', startNewGame);
    elements.shareBtn?.addEventListener('click', shareResults);

    elements.settingsBtn?.addEventListener('click', () => {
        elements['settings-modal'].classList.remove('hidden');
        elements['settings-modal'].setAttribute('aria-hidden', 'false');
    });
    elements.closeSettings?.addEventListener('click', () => {
        elements['settings-modal'].classList.add('hidden');
        elements['settings-modal'].setAttribute('aria-hidden', 'true');
        saveUserProfile();
    });

    elements.gameArea?.addEventListener('click', () => { 
        if (elements.language?.value === 'steno') elements['steno-funnel']?.focus();
        else elements.gameArea.focus(); 
    });
    elements.gameArea?.addEventListener('keydown', handleKeyDown);
    elements.gameArea?.addEventListener('focus', () => { if (elements['focus-prompt']) elements['focus-prompt'].style.opacity = '0'; });
    elements.gameArea?.addEventListener('blur', () => { if (!gameState.isTyping && elements['focus-prompt']) elements['focus-prompt'].style.opacity = '1'; });

    // Steno Funnel Setup
    elements['steno-funnel']?.addEventListener('input', handleStenoInput);
    elements['steno-funnel']?.addEventListener('focus', () => { if (elements['focus-prompt']) elements['focus-prompt'].style.opacity = '0'; });
    elements['steno-funnel']?.addEventListener('blur', () => { if (!gameState.isTyping && elements['focus-prompt']) elements['focus-prompt'].style.opacity = '1'; });

    // Mode listeners
// Mode/difficulty/language changes
    elements.testMode?.addEventListener('change', () => { gameState.isCustomText = false; startNewGame(); });
    elements.difficulty?.addEventListener('change', () => { gameState.isCustomText = false; startNewGame(); });
    elements.codeLanguage?.addEventListener('change', () => { gameState.isCustomText = false; startNewGame(); });
    
    elements.language?.addEventListener('change', (e) => {
        gameState.isCustomText = false;
        
        const isSteno = e.target.value === 'steno';
        if (elements['steno-funnel']) {
            elements['steno-funnel'].value = ''; 
            elements['steno-funnel'].style.pointerEvents = isSteno ? 'auto' : 'none';
        }

        // Dynamically change WPM to SPM labels
        document.querySelectorAll('.stat-label, th, h3, p').forEach(el => {
            if (el.children.length === 0) {
                if (isSteno && el.textContent.includes('WPM')) el.textContent = el.textContent.replace(/WPM/g, 'SPM');
                else if (!isSteno && el.textContent.includes('SPM')) el.textContent = el.textContent.replace(/SPM/g, 'WPM');
            }
        });

        if (e.target.value === 'code') {
            elements['code-lang-group'].style.display = 'block';
        } else {
            elements['code-lang-group'].style.display = 'none';
        }
        
         startNewGame();
        // SMOOTH TRANSITION: Auto-focus the correct input so the user can type instantly
        setTimeout(() => {
            if (e.target.value === 'steno' && elements['steno-funnel']) {
                elements['steno-funnel'].focus();
            } else {
                // Focus the standard game area/hidden input depending on your layout
                document.body.focus(); 
            }
        }, 50);
    });
    elements.codeLanguage?.addEventListener('change', () => { gameState.isCustomText = false; generateText(); });

    // Custom Text
    elements.customTextBtn?.addEventListener('click', () => {
        elements['custom-text-modal'].classList.remove('hidden');
    });
    elements.closeCustomText?.addEventListener('click', () => {
        elements['custom-text-modal'].classList.add('hidden');
    });
    elements.useCustomTextBtn?.addEventListener('click', () => {
        const txt = elements.customTextArea?.value.trim();
        if (txt) {
            gameState.isCustomText = true;
            gameState.targetText = txt;
            elements['custom-text-modal'].classList.add('hidden');
            resetGame();
            displayText();
            setTimeout(() => elements.gameArea.focus(), 50);
        }
    });
    elements.clearCustomTextBtn?.addEventListener('click', () => {
        if(elements.customTextArea) elements.customTextArea.value = '';
    });

    // Settings
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    elements.themeSelect?.addEventListener('change', (e) => { userProfile.preferences.theme = e.target.value; applyPreferences(); saveUserProfile(); });
    elements.fontSize?.addEventListener('input', (e) => { userProfile.preferences.fontSize = parseInt(e.target.value); applyPreferences(); saveUserProfile(); });
    elements.blindMode?.addEventListener('change', (e) => { userProfile.preferences.blindMode = e.target.checked; saveUserProfile(); });
    elements.adaptiveMode?.addEventListener('change', (e) => {
        userProfile.preferences.adaptiveMode = e.target.checked;
        if (elements['adaptive-badge']) elements['adaptive-badge'].classList.toggle('hidden', !userProfile.preferences.adaptiveMode);
        saveUserProfile();
    });
    elements.exportStats?.addEventListener('click', exportStatistics);
    elements.resetStats?.addEventListener('click', resetStatistics);

    // Leaderboard
    elements.leaderboardBtn?.addEventListener('click', showLeaderboard);
    elements.closeLeaderboard?.addEventListener('click', () => {
        elements['leaderboard-modal'].classList.add('hidden');
    });
}

function exportStatistics() {
    const data = { profile: userProfile, rescueTokens, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `hippotype-stats.json`; a.click(); URL.revokeObjectURL(url);
}

function resetStatistics() {
    if (!confirm('Reset all stats?')) return;
    userProfile.stats = { totalTests: 0, bestWPM: 0, avgWPM: 0, avgAccuracy: 0, streak: 0 };
    rescueTokens = 3;
    Object.keys(userProfile.achievements).forEach(k => userProfile.achievements[k].unlocked = false);
    saveUserProfile(); updateUI(); updateAchievementsDisplay();
}

function shareResults() {
    const txt = `I just typed ${elements.finalWPM?.textContent} WPM with ${elements.finalAccuracy?.textContent} accuracy on HippoType!`;
    navigator.clipboard ? navigator.clipboard.writeText(txt).then(() => alert('Copied!')) : alert(txt);
}

/* ===== APP LOGIC ===== */
function startNewGame() {
    if (!gameState.isCustomText) {
        generateText();
    }
    resetGame();
    displayText();
    setTimeout(() => { 
        if (elements.language?.value === 'steno') {
            elements['steno-funnel']?.focus(); 
        } else {
            elements.gameArea?.focus(); 
        }
    }, 50);
}

function resetGame() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.chartInterval) clearInterval(gameState.chartInterval);

    gameState = {
        ...gameState,
        isTyping: false, startTime: 0, currentCharIndex: 0,
        totalChars: 0, correctChars: 0, totalErrors: 0, consecutiveErrors: 0,
        combo: 0, maxCombo: 0, wpmHistory: [],
        timerInterval: null, chartInterval: null,
        rescueUsedThisTest: false
    };

if (elements.resultsPanel) elements.resultsPanel.classList.add('hidden');
    if (elements.progressBar) elements.progressBar.style.width = '0%';
    
    // CRITICAL: Wipe the steno funnel memory on restart
    const stenoFunnel = document.getElementById('steno-funnel');
    if (stenoFunnel) stenoFunnel.value = '';

    updateStats(); updateProgress(); updateCursor();
}

function generateText() {
    if (gameState.isCustomText) return;

    const mode = elements.testMode?.value || '60s';
    const diff = elements.difficulty?.value || 'medium';
    const lang = elements.language?.value || 'en';
    const codeLang = elements.codeLanguage?.value || 'python';

    gameState.testMode = mode;
    gameState.difficulty = diff;
    gameState.language = lang;
    gameState.codeLanguage = codeLang;

    let availableText = [];
    if (lang === 'code') {
        availableText = codeSnippets[codeLang]?.[diff] || codeSnippets.python.medium;
    } else {
        availableText = sentenceBanks[lang]?.[diff] || sentenceBanks.en.medium;
    }

    let itemsToPick = 2;
    if (mode.endsWith('w')) {
        itemsToPick = Math.ceil((parseInt(mode) || 50) / 10);
    } else if (mode.endsWith('s')) {
        const secs = parseInt(mode) || 60;
        itemsToPick = Math.ceil(secs / 10); 
    } else if (mode === 'zen') {
        itemsToPick = 20;
    }

    const sentences = [];
    for (let i = 0; i < itemsToPick; i++) {
        sentences.push(availableText[Math.floor(Math.random() * availableText.length)]);
    }

    let sep = lang === 'code' ? '\n\n' : ' ';
    gameState.targetText = sentences.join(sep);
}

function displayText() {
    if (!elements.targetWords) return;
    elements.targetWords.innerHTML = '';
    const text = gameState.targetText || '';

    for (let i = 0; i < text.length; i++) {
        const span = document.createElement('span');
        span.className = 'char pending';
        const ch = text[i];
        if (ch === ' ') {
            span.classList.add('space-char');
            span.textContent = '\u00A0';
        } else if (ch === '\n') {
            span.classList.add('newline-char');
            span.textContent = '↵\n'; // visual representation + actual newline
        } else {
            span.textContent = ch;
        }
        elements.targetWords.appendChild(span);
    }
    updateCursor(); updateProgress(); updateStats();
}

function handleKeyDown(e) {
    // SECURITY LOCK: Do not allow typing if the results panel is showing
    if (elements.resultsPanel && !elements.resultsPanel.classList.contains('hidden')) return;
    
    // ANTI-CHEAT: Ignore keys that are being held down automatically by the OS
    if (e.repeat) return;

    if (e.key === ' ') e.preventDefault();
    if (e.ctrlKey || e.altKey || e.metaKey || ['Shift','Control','Alt','Meta','CapsLock','Tab','Escape'].includes(e.key)) return;

    if (!gameState.isTyping && e.key.length === 1) startTyping();
    if (!gameState.isTyping) return;

    if (e.key === 'Backspace') {
        e.preventDefault(); handleBackspace(); return;
    }
    if (e.key.length === 1) { handleCharacterInput(e.key); return; }
    if (e.key === 'Enter') { handleCharacterInput('\n'); }
}

function handleCharacterInput(key) {
    const idx = gameState.currentCharIndex;
    const targetChar = gameState.targetText[idx];
    if (typeof targetChar === 'undefined') { endGame(); return; }

    const charSpan = elements.targetWords.children[idx];
    if (!charSpan) return;

    let input = key; let expected = targetChar;
    // Assume case-sensitive for everything to be standard, especially for sentences and code
    
    gameState.totalChars++;

    if (input === expected) {
        charSpan.classList.replace('pending', 'correct');
        charSpan.classList.replace('incorrect', 'correct');
        gameState.correctChars++;
        gameState.combo++;
        gameState.consecutiveErrors = 0;
        if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
    } else {
        charSpan.classList.replace('pending', 'incorrect');
        charSpan.classList.replace('correct', 'incorrect');
        gameState.totalErrors++;
        gameState.consecutiveErrors++;
        gameState.combo = 0;
    }

    gameState.currentCharIndex++;
    updateCursor(); updateStats(); updateProgress();


    if (gameState.currentCharIndex >= gameState.targetText.length) endGame();
}

function handleStenoInput(e) {
    if (!gameState.isTyping && e.target.value.length > 0) startTyping();
    if (!gameState.isTyping) return;

    const inputVal = e.target.value;
    let correctCount = 0;
    let errorCount = 0;
    
    const spans = elements.targetWords.children;
    
    // 1. Safe Visual Reset: Do not destroy the space and newline CSS classes
    for(let i=0; i < spans.length; i++) {
        spans[i].className = 'char pending';
        if (gameState.targetText[i] === ' ') spans[i].classList.add('space-char');
        if (gameState.targetText[i] === '\n') spans[i].classList.add('newline-char');
    }

    // 2. Grade the injection instantly (Case-Insensitive)
    for (let i = 0; i < inputVal.length; i++) {
        if (i >= gameState.targetText.length) break;
        
        // Convert both to lowercase to prevent dictionary capitalization crashes
        const expected = gameState.targetText[i].toLowerCase();
        const typed = inputVal[i].toLowerCase();
        const span = spans[i];
        
        if (typed === expected) {
            span.classList.replace('pending', 'correct');
            correctCount++;
        } else {
            span.classList.replace('pending', 'incorrect');
            errorCount++;
        }
    }
    
    gameState.currentCharIndex = inputVal.length;
    gameState.correctChars = correctCount;
    gameState.totalErrors = errorCount;
    gameState.totalChars = inputVal.length;
    gameState.consecutiveErrors = 0; // Steno skips sequential error blocks
    
    updateCursor(); updateStats(); updateProgress();
    
    // 3. Trigger End Game when injection fills the array
    if (gameState.currentCharIndex >= gameState.targetText.length) {
        e.target.value = ''; // Clear funnel for next game
        endGame();
    }
}

function handleBackspace() {
    if (gameState.currentCharIndex <= 0) return;
    gameState.currentCharIndex--;
    const charSpan = elements.targetWords.children[gameState.currentCharIndex];
    if (!charSpan) return;

    if (charSpan.classList.contains('correct')) gameState.correctChars = Math.max(0, gameState.correctChars - 1);
    else if (charSpan.classList.contains('incorrect')) { 
        gameState.totalErrors = Math.max(0, gameState.totalErrors - 1);
        gameState.consecutiveErrors = Math.max(0, gameState.consecutiveErrors - 1);
    }

    charSpan.className = 'char pending';
    if (gameState.targetText[gameState.currentCharIndex] === ' ') charSpan.classList.add('space-char');
    if (gameState.targetText[gameState.currentCharIndex] === '\n') charSpan.classList.add('newline-char');

    gameState.totalChars = Math.max(0, gameState.totalChars - 1);
    updateCursor(); updateStats(); updateProgress();
}

function startTyping() {
    gameState.isTyping = true;
    if (gameState.startTime === 0) gameState.startTime = Date.now();
    else gameState.startTime = Date.now() - (gameState.pausedElapsed || 0);

    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.chartInterval) clearInterval(gameState.chartInterval);

    gameState.timerInterval = setInterval(updateTimer, 250);
    gameState.chartInterval = setInterval(updateChart, 1000);
}

function updateTimer() {
    if (!elements.timer) return;
    const mode = gameState.testMode;

    if (mode === 'zen') {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        elements.timer.textContent = formatTime(elapsed);
    } else if (mode.endsWith('s')) {
        const totalSeconds = parseInt(mode) || 60;
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);
        elements.timer.textContent = formatTime(remaining);
        
    if (remaining === 0) {
         endGame();
     }
    } else {
        const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
        elements.timer.textContent = formatTime(elapsed);
    }
}

/* ===== END GAME / STATS / ADAPTIVE ===== */
function endGame() {
    gameState.isTyping = false;
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    if (gameState.chartInterval) clearInterval(gameState.chartInterval);
    updateChart();

// Compute final stats
    const timeInSeconds = Math.max(1, (Date.now() - gameState.startTime) / 1000); // FIXED: was timeInSecs
    const timeInMinutes = Math.max(timeInSeconds / 60, 1 / 60); // FIXED: was timeInMins
    let wpm = Math.round((gameState.correctChars / 5) / timeInMinutes) || 0;
    let rawWPM = Math.round((gameState.totalChars / 5) / timeInMinutes) || 0;
    const accuracy = gameState.totalChars > 0 ? Math.round((gameState.correctChars / gameState.totalChars) * 100) : 0; // FIXED: was acc

    // ANTI-CHEAT: Final Telemetry Hard Cap
    const maxSpeed = (gameState.language === 'steno') ? 600 : 300;
    if (wpm > maxSpeed) wpm = maxSpeed;
    if (rawWPM > maxSpeed) rawWPM = maxSpeed;

 // FIX: Force JavaScript to treat the local storage data as an integer
    userProfile.stats.totalTests = parseInt(userProfile.stats.totalTests || 0, 10) + 1;
    if (wpm > userProfile.stats.bestWPM) userProfile.stats.bestWPM = wpm;
    if (wpm >= 80) unlockAchievement('speedDemon');
    if (accuracy === 100 && gameState.totalChars > 20) unlockAchievement('perfectionist'); // FIXED: was acc

    const prevC = userProfile.stats.totalTests - 1;
    userProfile.stats.avgWPM = Math.round(((userProfile.stats.avgWPM || 0) * prevC + wpm) / (prevC + 1));
    userProfile.stats.avgAccuracy = Math.round(((userProfile.stats.avgAccuracy || 0) * prevC + accuracy) / (prevC + 1)); // FIXED: was acc

    // Adaptive Difficulty
    if (userProfile.preferences.adaptiveMode && !gameState.isCustomText && elements.difficulty) {
        const diffs = ['easy','medium','hard','expert'];
        let idx = diffs.indexOf(gameState.difficulty);
        if (wpm >= 80 && accuracy >= 95 && idx < diffs.length - 1) { // FIXED: was acc
            elements.difficulty.value = diffs[idx + 1];
        } else if ((wpm <= 30 || accuracy < 85) && idx > 0) { // FIXED: was acc
            elements.difficulty.value = diffs[idx - 1];
        }
    }

    if (elements.finalWPM) elements.finalWPM.textContent = wpm;
    if (elements.finalAccuracy) elements.finalAccuracy.textContent = accuracy + '%'; // FIXED: was acc
    if (elements.finalTime) elements.finalTime.textContent = formatTime(timeInSeconds); // FIXED: was timeInSecs
    if (elements.finalCombo) elements.finalCombo.textContent = gameState.maxCombo;
    if (elements.totalChars) elements.totalChars.textContent = gameState.totalChars;
    if (elements.correctCharsCount) elements.correctCharsCount.textContent = gameState.correctChars;
    if (elements.totalErrorsCount) elements.totalErrorsCount.textContent = gameState.totalErrors;
    if (elements.rawWPM) elements.rawWPM.textContent = Math.round((gameState.totalChars / 5) / timeInMinutes) || 0; // FIXED: was timeInMins

    if (elements['results-panel']) elements['results-panel'].classList.remove('hidden');

    saveUserProfile(); updateUI(); applyPreferences();

if (auth.username) {
        // Resolve the exact language (handles the coding language glitch)
        const actualLanguage = gameState.language === 'code' ? gameState.codeLanguage : gameState.language;
        
        // Calculate Strokes Per Minute (only applies to Steno mode)
        const spm = (gameState.language === 'steno') ? Math.round(gameState.totalChars / timeInMinutes) : 0; // FIXED: was timeInMins

        // Send the exact 10 data points needed by the database (Date is generated on the server)
        fetchGS('submitScore', {
            username: auth.username,
            wpm: wpm,
            spm: spm,
            accuracy: accuracy, // FIXED: was acc
            total_errors: gameState.totalErrors,
            total_chars: gameState.totalChars,
            correct_chars: gameState.correctChars,
            mode: gameState.testMode,
            difficulty: elements.difficulty?.value || gameState.difficulty,
            language: actualLanguage
        });
    }
}

function unlockAchievement(k) {
    if (userProfile.achievements[k] && !userProfile.achievements[k].unlocked) {
        userProfile.achievements[k].unlocked = true;
        updateAchievementsDisplay();
    }
}

function updateAchievementsDisplay() {
    if (!elements.achievementsGrid) return;
    elements.achievementsGrid.innerHTML = '';
    Object.values(userProfile.achievements).forEach(ach => {
        const div = document.createElement('div');
        div.className = `achievement-item ${ach.unlocked ? 'unlocked' : ''}`;
        div.innerHTML = `<div style="font-size:1.5rem">${ach.icon}</div><div style="font-weight:700; font-size:.9rem">${ach.name}</div>`;
        div.title = ach.desc;
        elements.achievementsGrid.appendChild(div);
    });
}

function updateStats() {
    if (!elements.wpm) return;
    if (!gameState.isTyping && gameState.totalChars === 0) {
        elements.wpm.textContent = '0'; elements.accuracy.textContent = '100%';
        if (elements.errors) elements.errors.textContent = '0';
        if (elements.combo) elements.combo.textContent = '0';
        return;
    }
    
    const mins = Math.max(1, Date.now() - (gameState.startTime||Date.now())) / 60000;
    
    // 1. Calculate the raw WPM first
    let wpm = Math.round((gameState.correctChars / 5) / Math.max(mins, 1/60)) || 0;
    
    // 2. ANTI-CHEAT: Apply the Hard Cap ceiling before displaying
    const maxSpeed = (gameState.language === 'steno') ? 600 : 300;
    if (wpm > maxSpeed) wpm = maxSpeed;
    
    // 3. Update the UI safely
    elements.wpm.textContent = wpm;
    elements.accuracy.textContent = (gameState.totalChars > 0 ? Math.round((gameState.correctChars / gameState.totalChars) * 100) : 100) + '%';
    if (elements.errors) elements.errors.textContent = gameState.totalErrors;
    if (elements.combo) elements.combo.textContent = gameState.combo;
}
function updateProgress() {
    if (elements.progressBar) elements.progressBar.style.width = Math.min(100, (gameState.currentCharIndex / Math.max(1, gameState.targetText.length)) * 100) + '%';
}

/* ===== LEADERBOARD LOGIC ===== */
function showLeaderboard() {
    if (!elements['leaderboard-modal']) return;
    elements['leaderboard-modal'].classList.remove('hidden');
    fetchLeaderboardData();
}

async function fetchLeaderboardData() {
    if (elements.leaderboardLoading) elements.leaderboardLoading.classList.remove('hidden');
    if (elements.leaderboardError) elements.leaderboardError.classList.add('hidden');
    if (elements.leaderboardTable) elements.leaderboardTable.classList.add('hidden');
    
    try {
        // Call the Google Apps Script to get the real data
        const result = await fetchGS('getLeaderboard');
        
        if (result && result.status === 'success') {
            if (result.data.length === 0) {
                // If database is empty
                elements.leaderboardError.textContent = 'No scores yet! Be the first to play.';
                elements.leaderboardError.classList.remove('hidden');
            } else {
                renderLeaderboard(result.data);
            }
        } else {
            throw new Error(result.message || 'Failed to fetch');
        }
    } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        if (elements.leaderboardError) {
            elements.leaderboardError.textContent = 'Failed to load leaderboard data. Please try again later.';
            elements.leaderboardError.classList.remove('hidden');
        }
    } finally {
        if (elements.leaderboardLoading) elements.leaderboardLoading.classList.add('hidden');
    }
}

function renderLeaderboard(data) {
    const tbody = elements.leaderboardBody;
    if (!tbody || !elements.leaderboardTable) return;
    
    tbody.innerHTML = '';
    const isSteno = elements.language?.value === 'steno';
    
    if (elements.lbSpeedHeader) {
        elements.lbSpeedHeader.textContent = isSteno ? 'SPM' : 'WPM';
    }
    
    data.forEach((entry, index) => {
        // In a real app, you might filter steno vs non-steno scores
        // Here we just display them, optionally adjusting speed display
        const speedVal = entry.speed + (isSteno && !entry.isSteno ? ' (WPM)' : (!isSteno && entry.isSteno ? ' (SPM)' : ''));
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="rank-col">#${index + 1}</td>
            <td class="user-col">${entry.username}</td>
            <td class="speed-col">${speedVal}</td>
            <td class="acc-col">${entry.accuracy}%</td>
            <td class="date-col">${entry.date}</td>
        `;
        tbody.appendChild(tr);
    });
    
    elements.leaderboardTable.classList.remove('hidden');
}

function updateCursor() {
    if (!elements.cursor || !elements.gameArea || !elements.targetWords) return;
    const idx = gameState.currentCharIndex;
    if (idx < elements.targetWords.children.length) {
        const span = elements.targetWords.children[idx];
        const rect = span.getBoundingClientRect();
        const cont = elements.gameArea.getBoundingClientRect();
        elements.cursor.style.left = (rect.left - cont.left + elements.gameArea.scrollLeft) + 'px';
        elements.cursor.style.top = (rect.top - cont.top + elements.gameArea.scrollTop) + 'px';
        elements.cursor.style.height = rect.height + 'px';
        Array.from(elements.targetWords.children).forEach(s => s.classList.remove('current-char'));
        span.classList.add('current-char');
        
        // Auto scroll
        if (rect.bottom > cont.bottom - 20) {
            elements.gameArea.scrollTop += rect.height * 2;
        }
    } else {
        elements.cursor.style.opacity = 0;
    }
}

function updateUI() {
    if (elements.bestWPM) elements.bestWPM.textContent = userProfile.stats.bestWPM || 0;
    if (elements.avgWPM)  elements.avgWPM.textContent = userProfile.stats.avgWPM || 0;
    if (elements.totalTests) elements.totalTests.textContent = userProfile.stats.totalTests || 0;
    if (elements.streak) elements.streak.textContent = userProfile.stats.streak || 0;
    if (elements.rescueTokens) elements.rescueTokens.textContent = rescueTokens;
}

function formatTime(s) {
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

function initializeChart() {
    if(elements.wpmChart) elements.wpmChart.width = elements.wpmChart.clientWidth;
}

function updateChart() {
    // 1. Only abort if the game is fully reset and empty
    if (!gameState.isTyping && gameState.wpmHistory.length === 0) return;

    // 2. If the user is currently typing, compute and record the speed
    if (gameState.isTyping) {
        const elapsedMin = Math.max((Date.now() - gameState.startTime) / 60000, 1 / 60);
        const wpm = Math.round((gameState.correctChars / 5) / elapsedMin) || 0;
        gameState.wpmHistory.push(wpm);
        if (gameState.wpmHistory.length > 120) gameState.wpmHistory.shift();
    }

    const canvas = elements.wpmChart;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const DPR = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    // Prevent fatal rendering errors if the window is hidden
    if (width === 0 || height === 0) return;

    canvas.width = width * DPR;
    canvas.height = height * DPR;
    ctx.scale(DPR, DPR);

    ctx.clearRect(0, 0, width, height);

    const padding = 12;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = padding + (height - padding * 2) * (i / 4);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }

    // 3. Draw the Line and Dotted Graph
    if (gameState.wpmHistory.length > 0) {
        ctx.beginPath();
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#0891b2';
        ctx.lineWidth = 2;
        const data = gameState.wpmHistory;
        const maxWPM = 150;
        
        // Draw the connecting line
        data.forEach((val, i) => {
            const x = padding + (width - padding * 2) * (i / Math.max(1, data.length - 1));
            const y = height - padding - (Math.min(val, maxWPM) / maxWPM) * (height - padding * 2);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // THE FIX: Draw the heavy dots over the line
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary-color') || '#0891b2';
        data.forEach((val, i) => {
            const x = padding + (width - padding * 2) * (i / Math.max(1, data.length - 1));
            const y = height - padding - (Math.min(val, maxWPM) / maxWPM) * (height - padding * 2);
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2); // Radius 3 for clear, visible dots
            ctx.fill();
        });
    }
}
// ===== LOGOUT & SECURITY WIPE =====
function handleLogout() {
    // 1. Destroy the security tokens in local storage
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('hippotypeAuth'); 
    auth.username = null;

    // 2. Forcefully close the settings modal
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) {
        settingsModal.classList.add('hidden');
        settingsModal.setAttribute('aria-hidden', 'true');
    }

    // 3. Summon the Login Bouncer to block the game
    const loginModal = document.getElementById('login-modal');
    if (loginModal) {
        loginModal.style.display = 'flex';
        loginModal.style.pointerEvents = 'auto';
        
        // Clear the password field so the next user can't see it
        const passInput = document.getElementById('login-password');
        if (passInput) passInput.value = '';
    }

    // 4. Halt any running timers or charts in the background
    resetGame();
}
