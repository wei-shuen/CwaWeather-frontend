let API_URL = "https://cwaweather-shuen.zeabur.app/api/weather/taipei";
// store original base and region
const __apiBase = API_URL.split('/').slice(0, -1).join('/') + '/';
let __currentRegion = API_URL.split('/').slice(-1)[0] || 'taipei';
// 最後一次渲染的 current.weather（供開發者 "自動" 還原用）
let __lastWeather = null;

function getWeatherIcon(weather, startTime) {
    if (!weather) return "🌤️";
    // 判斷是否為夜晚（18:00 - 04:59）
    let hour = new Date().getHours();
    if (startTime) {
        try {
            hour = new Date(startTime).getHours();
        } catch (e) {
            // fallback to current hour
        }
    }
    const isNight = (hour >= 18 || hour < 5);
    if (weather.includes("晴")) return isNight ? "🌕" : "☀️";
    if (weather.includes("多雲")) return "⛅";
    if (weather.includes("陰")) return "☁️";
    if (weather.includes("雨")) return "🌧️";
    if (weather.includes("雷")) return "⛈️";
    return isNight ? "🌙" : "🌤️";
}

// 根據天氣字串套用對應的主題 class 到 body
function applyTheme(weather) {
    const body = document.body;
    const themeClasses = ['theme-sunny', 'theme-cloudy', 'theme-rain', 'theme-overcast', 'theme-thunder'];
    
    // 先移除所有主題 class
    body.classList.remove(...themeClasses);
    
    // 使用 requestAnimationFrame 確保瀏覽器處理完 DOM 變化後再添加新 class，觸發 transition 動畫
    requestAnimationFrame(() => {
        if (!weather) return;
        if (weather.includes('晴')) {
            body.classList.add('theme-sunny');
        } else if (weather.includes('多雲')) {
            body.classList.add('theme-cloudy');
        } else if (weather.includes('雷')) {
            body.classList.add('theme-thunder');
        } else if (weather.includes('雨')) {
            body.classList.add('theme-rain');
        } else if (weather.includes('陰')) {
            body.classList.add('theme-overcast');
        }
    });
}

// 暴露給開發者快速測試
window.applyTheme = applyTheme;

function getAdvice(rainProb, maxTemp) {
    let rainIcon = "🌂";
    let rainText = "不用帶傘";
    if (parseInt(rainProb) > 30) {
        rainIcon = "☂️";
        rainText = "記得帶傘！";
    }

    let clothIcon = "👕";
    let clothText = "舒適穿搭";
    if (parseInt(maxTemp) >= 28) {
        clothIcon = "🎽";
        clothText = "短袖出發";
    } else if (parseInt(maxTemp) <= 20) {
        clothIcon = "🧥";
        clothText = "加件外套";
    }

    return {
        rainIcon,
        rainText,
        clothIcon,
        clothText
    };
}

function getTimePeriod(startTime) {
    const hour = new Date(startTime).getHours();
    if (hour >= 6 && hour < 18) return "白天";
    return "夜晚";
}

function renderWeather(data) {
    console.log("data", data)
    const current = data.hours[0];
    const others = data.hours.slice(1);
    // 儲存當前天氣描述以供開發者面板使用
    __lastWeather = current.weather;

    // 1. 渲染 Hero Card (主畫面)
    const advice = getAdvice(current.rain, current.maxTemp);
    const period = getTimePeriod(current.startTime);
    const avgTemp = Math.round((parseInt(current.maxTemp) + parseInt(current.minTemp)) / 2);

    // 3. 右上角顯示今日日期
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayIndex = now.getDay();
    const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

    document.getElementById('heroCard').innerHTML = `
        <div class="hero-card">
            <div class="hero-period">今日${period}</div>
            <div class="current-forecast">
                <div class="forecast-left">
                    <div class="hero-icon">${getWeatherIcon(current.weather, current.startTime)}</div>
                </div>
                <div class="forecast-right">
                    <div class="hero-temp">${avgTemp}°</div>
                    <div class="hero-location">${data.city}</div>
                </div>
            </div>
            <div class="advice-grid">
                <div class="advice-item">
                    <div class="advice-icon">${advice.rainIcon}</div>
                    <div class="advice-text">${advice.rainText}</div>
                    <div class="meta-text">降雨率 ${current.rain}</div>
                </div>
                <div class="advice-item">
                    <div class="advice-icon">${advice.clothIcon}</div>
                    <div class="advice-text">${advice.clothText}</div>
                    <div class="meta-text">最高溫 ${current.maxTemp}°</div>
                </div>
            </div>
        </div>`;

    // 3. 渲染稍後預報 (包含明天判斷)
    const miniCardContainer = document.getElementById('futureForecasts');
    miniCardContainer.innerHTML = '';

    // 抓今天的日期數字 (例如 24)
    const todayDate = new Date().getDate();

    others.forEach(f => {
        let p = getTimePeriod(f.startTime);

        // 判斷該預報的日期是否跟今天不同，不同就是明天
        const fDate = new Date(f.startTime);
        if (fDate.getDate() !== todayDate) {
            p = "明日" + p;
        } else {
            p = "今日" + p;    
        }

        miniCardContainer.innerHTML += `
            <div class="mini-card">
                <div class="hero-period">${p}</div>
                <div class="mini-icon">${getWeatherIcon(f.weather, f.startTime)}</div>
                <div class="mini-temp">${f.minTemp}° - ${f.maxTemp}°</div>
                <div class="mini-meta">💧${f.rain}</div>
            </div>
        `;
    });
    
    try {
        applyTheme(current.weather);
    } catch (e) {
        // 若 applyTheme 尚未定義或執行出錯，不影響核心渲染
        console.warn('applyTheme error', e);
    }
}

// 初始化開發者主題切換面板（綁定按鈕事件）
function initDevThemePanel() {
    const panel = document.getElementById('devThemePanel');
    if (!panel) return;
    const buttons = panel.querySelectorAll('.dev-theme-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            // Visually mark active
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (theme === 'auto') {
                // 還原為資料驅動的主題（若有 lastWeather）
                if (__lastWeather) applyTheme(__lastWeather);
                else fetchWeather();
            } else {
                // 映射按鈕到對應的中文天氣關鍵字，並套用
                const mapping = {
                    sunny: '晴',
                    cloudy: '多雲',
                    rain: '雨',
                    overcast: '陰',
                    thunder: '雷'
                };
                applyTheme(mapping[theme] || mapping['sunny']);
            }
        });
    });
}

// Fetch weather for a specific region (assumes API pattern /api/weather/{region})
function fetchWeatherFor(regionKey) {
    console.log(regionKey)
    if (!regionKey) return;
    // 支援傳入中文縣市名稱或 slug
    const chineseToSlug = {
        "臺北市": "taipei",
        "新北市": "newtaipei",
        "基隆市": "keelung",
        "桃園市": "taoyuan",
        "新竹縣": "hsinchu",
        "新竹市": "hsinchuCity",
        "苗栗縣": "miaoli",
        "臺中市": "taichung",
        "南投縣": "nantou",
        "彰化縣": "changhua",
        "雲林縣": "yunlin",
        "嘉義縣": "chiayi",
        "嘉義市": "chiayiCity",
        "臺南市": "tainan",
        "高雄市": "kaohsiung",
        "屏東縣": "pingtung",
        "宜蘭縣": "yilan",
        "花蓮縣": "hualien",
        "臺東縣": "taitung",
        "金門縣": "kinmen",
        "澎湖縣": "penghu",
        "連江縣": "matsu",
    };
    // 如果傳入的是中文名稱，轉成 slug；否則假設已經是 slug
    let slug = chineseToSlug[regionKey] || regionKey;
    __currentRegion = slug;
    API_URL = __apiBase + slug;
    // visually mark active region - 標記 SVG 路徑、地圖點點、以及任何其他帶 data-region 的元素
    const allRegionElements = document.querySelectorAll('[data-region]');
    allRegionElements.forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-region') === slug);
    });
    // Update region select to show current selection
    const regionSelect = document.getElementById('regionSelect');
    if (regionSelect) {
        regionSelect.value = slug;
    }
    // re-fetch
    fetchWeather();
}

function initMapUI() {
    const panel = document.getElementById('mapContainer');
    if (!panel) return;
        panel.querySelectorAll('.map-spot, .map-hotspot, .map-region').forEach(spot => {
        spot.addEventListener('click', () => {
            // 以按鈕文字（中文）為優先，若不存在則回退到 data-region slug
            const displayName = (spot.textContent || spot.innerText || '').trim();
            const regionAttr = spot.getAttribute('data-region');
            const payload = displayName || regionAttr;
            fetchWeatherFor(payload);
        });
    });
    // mark initial active
    const initial = panel.querySelector(`[data-region="${__currentRegion}"]`);
    if (initial) initial.classList.add('active');
}

function initRegionSelect() {
    const regionSelect = document.getElementById('regionSelect');
    if (!regionSelect) return;

    // Set initial value to taipei (or current region)
    regionSelect.value = __currentRegion;

    regionSelect.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        if (selectedValue) {
            fetchWeatherFor(selectedValue);
        }
    });
}

async function fetchWeather() {
    try {
        // 1. 定義「最低等待時間」：1500 毫秒 (1.5秒)
        const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));

        // 2. 定義「抓取資料」的工作
        const fetchPromise = fetch(API_URL).then(res => res.json());

        // 3. Promise.all 會等待「兩個都完成」才會往下走
        // result 陣列裡，第一個是 delay 的結果(沒用到)，第二個是 api 的 json 資料
        const [_, json] = await Promise.all([delayPromise, fetchPromise]);

        if (json.success) {
            console.log("json.data", json.data)
            renderWeather(json.data);

            // 資料處理好後，隱藏 Loading，顯示主畫面
            document.getElementById('loading').classList.add('hidden');
            document.getElementById('mainContent').classList.remove('hidden');
        } else {
            throw new Error("API Error");
        }
    } catch (e) {
        console.error(e);
        alert("天氣資料讀取失敗，狸克把網路線咬斷了！");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initDevThemePanel();
    initMapUI();
    initRegionSelect();
    fetchWeather();
});