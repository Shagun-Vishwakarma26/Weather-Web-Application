// --- 1. CONFIGURATION AND API SETUP ---

// !! IMPORTANT: Replace 'YOUR_OPENWEATHERMAP_API_KEY' with your actual key !!
const API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const DEFAULT_CITY = 'India';
let currentLanguage = 'en';

// --- 2. UI ELEMENT SELECTION ---

const cityNameEl = document.getElementById('city-name');
const weatherIconEl = document.getElementById('weather-icon');
const temperatureEl = document.getElementById('temperature');
const descriptionEl = document.getElementById('description');
const errorMessageEl = document.getElementById('error-message');
const searchForm = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const languageSelect = document.getElementById('language-select');
const voiceButton = document.getElementById('voice-btn');

// Elements for Humanity, Date, and Time
const greetingEl = document.getElementById('greeting'); 
const dateEl = document.getElementById('current-date'); 
const timeEl = document.getElementById('current-time'); 

// NEW: Humidity Element
const humidityEl = document.getElementById('humidity');


// --- 3. MULTI-LANGUAGE (I18N) DICTIONARY ---

const translations = {
    'en': {
        'lang-label': 'Language:',
        'search-btn': 'Search',
        'temp-label': 'Temperature:',
        'desc-label': 'Description:',
        'humidity-label': 'Humidity:', // NEW
        'voice-btn-text': 'Speak',
        'error-api': 'City not found or API error. Please try again.',
        'loading': 'Loading...',
        'placeholder': 'Enter City Name',
        'default-desc': 'Fetching data...',
        'morning': 'Good morning!',
        'afternoon': 'Good afternoon!',
        'evening': 'Good evening!',
        'night': 'Hello there!'
    },
    'es': {
        'lang-label': 'Idioma:',
        'search-btn': 'Buscar',
        'temp-label': 'Temperatura:',
        'desc-label': 'Descripción:',
        'humidity-label': 'Humedad:', // NEW
        'voice-btn-text': 'Hablar',
        'error-api': 'Ciudad no encontrada o error de API. Por favor, inténtelo de nuevo.',
        'loading': 'Cargando...',
        'placeholder': 'Introduce el nombre de la ciudad',
        'default-desc': 'Obteniendo datos...',
        'morning': '¡Buenos días!',
        'afternoon': '¡Buenas tardes!',
        'evening': '¡Buenas noches!',
        'night': '¡Hola a ti!'
    }
};

/**
 * Updates all static UI elements based on the selected language.
 * @param {string} lang - The language code ('en' or 'es').
 */
function translateUI(lang) {
    currentLanguage = lang;
    const t = translations[lang];

    // Update static text content using data attributes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Update input placeholder separately
    cityInput.placeholder = t['placeholder'];
    
    // Reset or update display with translated default values
    if (cityNameEl.textContent.includes('Load') || cityNameEl.textContent.includes('Mumbai')) {
        cityNameEl.textContent = t['loading'];
        descriptionEl.textContent = t['default-desc'];
        humidityEl.textContent = '--%'; // Reset humidity display
    }
    
    errorMessageEl.textContent = ''; // Clear old error message on language change
    
    // Update date/time elements immediately after language change
    updateDateTimeAndGreeting(); 
}


// --- 4. API FETCHING LOGIC ---

/**
 * Fetches weather data from the OpenWeatherMap API.
 * @param {string} city - The city name to search for.
 */
async function fetchWeatherData(Mumbai) {
    const url = "https://api.openweathermap.org/data/2.5/weather?lat=19.0760&lon=72.8777&appid=a60365173f029bb14791997cbd269a66&units=metric";
    
    // Clear previous state and show loading
    cityNameEl.textContent = translations[currentLanguage]['loading'];
    temperatureEl.textContent = '--°C';
    descriptionEl.textContent = translations[currentLanguage]['default-desc'];
    humidityEl.textContent = '--%'; // Reset humidity
    errorMessageEl.textContent = '';
    weatherIconEl.classList.add('hidden');

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || translations[currentLanguage]['error-api']);
        }

        const data = await response.json();
        updateDisplay(data);

    } catch (error) {
        console.error('Fetch error:', error);
        cityNameEl.textContent = 'Error';
        temperatureEl.textContent = '--°C';
        descriptionEl.textContent = '';
        humidityEl.textContent = '--%';
        errorMessageEl.textContent = error.message.includes('404') ? translations[currentLanguage]['error-api'] : `API Error: ${error.message}`;
    }
}

/**
 * Updates the HTML elements with the fetched weather data.
 * @param {object} data - The weather data object from the API.
 */
function updateDisplay(data) {
    const temp = Math.round(data.main.temp);
    const humidity = data.main.humidity; // NEW: Get Humidity
    const description = data.weather[0].description;
    const iconCode = data.weather[0].icon;

    cityNameEl.textContent = data.name;
    temperatureEl.textContent = `${temp}°C`;
    descriptionEl.textContent = description.charAt(0).toUpperCase() + description.slice(1);
    humidityEl.textContent = `${humidity}%`; // NEW: Update Humidity display
    
    // OpenWeatherMap icon URL structure
    weatherIconEl.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIconEl.alt = description;
    weatherIconEl.classList.remove('hidden');

    // Automatically trigger voice output
    speakWeather(data.name, description, temp);
}


// --- 5. VOICE (WEB SPEECH API) FEATURE ---

/**
 * Uses the Web Speech API to read the weather data aloud.
 * @param {string} city - The city name.
 * @param {string} description - The weather description.
 * @param {number} temp - The temperature in Celsius.
 */
function speakWeather(city, description, temp) {
    if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API not supported in this browser.');
        return;
    }

    // Build the utterance text based on current language
    let textToSpeak = '';
    if (currentLanguage === 'es') {
        textToSpeak = `El tiempo actual en ${city} es de ${description}, con una temperatura de ${temp} grados centígrados.`;
    } else { // default to English
        textToSpeak = `The current weather in ${city} is ${description}, with a temperature of ${temp} degrees Celsius.`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    // Set speech language based on UI language
    utterance.lang = currentLanguage === 'es' ? 'es-ES' : 'en-US'; 
    utterance.pitch = 1.0;
    utterance.rate = 1.0;

    window.speechSynthesis.speak(utterance);
}


// --- 6. DATE, TIME, and HUMANITY FEATURES ---

/**
 * Determines the appropriate greeting based on the current hour.
 * @returns {string} The translation key for the greeting.
 */
function getGreetingKey() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return 'morning';
    } else if (hour >= 12 && hour < 18) {
        return 'afternoon';
    } else if (hour >= 18 && hour < 22) {
        return 'evening';
    } else {
        return 'night';
    }
}

/**
 * Updates the date, time, and greeting elements.
 */
function updateDateTimeAndGreeting() {
    const now = new Date();
    const langCode = currentLanguage;
    const t = translations[langCode];

    // 1. Date formatting
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString(langCode, dateOptions);

    // 2. Time formatting
    // Uses 'h24' for 24-hour cycle to keep time consistent globally
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h24' };
    timeEl.textContent = now.toLocaleTimeString(langCode, timeOptions);

    // 3. Greeting
    const greetingKey = getGreetingKey();
    greetingEl.textContent = t[greetingKey];
}


// --- 7. EVENT LISTENERS ---

// A. Handle Form Submission
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

// B. Handle Language Change
languageSelect.addEventListener('change', (e) => {
    translateUI(e.target.value);
});

// C. Handle Voice Button Click (manual trigger)
voiceButton.addEventListener('click', () => {
    const city = cityNameEl.textContent;
    const desc = descriptionEl.textContent;
    const tempText = temperatureEl.textContent.replace('°C', '');
    const temp = parseFloat(tempText);
    
    // Check if valid data is present before speaking
    if (city && desc && !isNaN(temp) && city !== translations[currentLanguage]['loading'] && city !== 'Error') {
        speakWeather(city, desc, temp);
    }
});

// --- 8. INITIALIZATION ---

// Load default city and set initial language on page load
document.addEventListener('DOMContentLoaded', () => {
    translateUI(languageSelect.value); // Set initial UI language
    fetchWeatherData(DEFAULT_CITY); // Fetch initial data

    // Initialize Date, Time, and Greeting
    updateDateTimeAndGreeting(); 
    
    // Set up interval to update time every second
    setInterval(updateDateTimeAndGreeting, 1000); 
});