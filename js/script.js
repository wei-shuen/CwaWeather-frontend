const API_URL = "https://cwaweather-shuen.zeabur.app/api/weather/kinmen";

function getWeatherIcon(weather) {
    if (!weather) return "🌤️";
    if (weather.includes("晴")) return "☀️";
    if (weather.includes("多雲")) return "⛅";
    if (weather.includes("陰")) return "☁️";
    if (weather.includes("雨")) return "🌧️";
    if (weather.includes("雷")) return "⛈️";
    return "🌤️";
}

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

    return { rainIcon, rainText, clothIcon, clothText };
}

function getTimePeriod(startTime) {
    const hour = new Date(startTime).getHours();
    if (hour >= 5 && hour < 11) return "早晨";
    if (hour >= 11 && hour < 14) return "中午";
    if (hour >= 14 && hour < 18) return "下午";
    if (hour >= 18 && hour < 23) return "晚上";
    return "深夜";
}

function renderWeather(data) {
    const forecasts = data.forecasts;
    const current = forecasts[0];
    const others = forecasts.slice(1);

    // 1. 渲染 Hero Card (主畫面)
    const advice = getAdvice(current.rain, current.maxTemp);
    const period = getTimePeriod(current.startTime);
    const avgTemp = Math.round((parseInt(current.maxTemp) + parseInt(current.minTemp)) / 2);

    document.getElementById('heroCard').innerHTML = `
                <div class="hero-card">
                    <div class="hero-period">${period}</div>
                    <div class="hero-temp-container">
                        <div class="hero-icon">${getWeatherIcon(current.weather)}</div>
                        <div class="hero-temp">${avgTemp}°</div>
                    </div>
                    <div class="hero-desc">${current.weather}</div>
                    
                    <div class="advice-grid">
                        <div class="advice-item">
                            <div class="advice-icon">${advice.rainIcon}</div>
                            <div class="advice-text">${advice.rainText}</div>
                            <div style="font-size:0.7rem; color:#999">降雨率 ${current.rain}</div>
                        </div>
                        <div class="advice-item">
                            <div class="advice-icon">${advice.clothIcon}</div>
                            <div class="advice-text">${advice.clothText}</div>
                            <div style="font-size:0.7rem; color:#999">最高溫 ${current.maxTemp}°</div>
                        </div>
                    </div>
                </div>
            `;

    // 2. 渲染稍後預報 (包含明天判斷)
    const scrollContainer = document.getElementById('futureForecasts');
    scrollContainer.innerHTML = '';

    // 抓今天的日期數字 (例如 24)
    const todayDate = new Date().getDate();

    others.forEach(f => {
        let p = getTimePeriod(f.startTime);

        // 判斷該預報的日期是否跟今天不同，不同就是明天
        const fDate = new Date(f.startTime);
        if (fDate.getDate() !== todayDate) {
            p = "明天" + p;
        }

        scrollContainer.innerHTML += `
                    <div class="mini-card">
                        <div class="mini-time">${p}</div>
                        <div class="mini-icon">${getWeatherIcon(f.weather)}</div>
                        <div class="mini-temp">${f.minTemp}° - ${f.maxTemp}°</div>
                        <div style="font-size:0.8rem; color:#888; margin-top:5px;">💧${f.rain}</div>
                    </div>
                `;
    });

    // 3. 右上角顯示今日日期
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayIndex = now.getDay();
    const days = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

    document.getElementById('updateTime').textContent = `${month}月${date}日 ${days[dayIndex]}`;
}

async function fetchWeather() {
    try {
        // 1. 定義「最低等待時間」：1500 毫秒 (1.5秒)
        const delayPromise = new Promise(resolve => setTimeout(resolve, 1500));

        // 2. 定義「抓取資料」的工作
        const fetchPromise = fetch(API_URL).then(res => res.json());

        // 3. Promise.all 會等待「兩個都完成」才會往下走
        // result 陣列裡，第一個是 delay 的結果(沒用到)，第二個是 api 的 json 資料
        const [_, json] = await Promise.all([delayPromise, fetchPromise]);

        if (json.success) {
            renderWeather(json.data);

            // 資料處理好後，隱藏 Loading，顯示主畫面
            document.getElementById('loading').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
        } else {
            throw new Error("API Error");
        }
    } catch (e) {
        console.error(e);
        alert("天氣資料讀取失敗，狸克把網路線咬斷了！");
    }
}

document.addEventListener("DOMContentLoaded", fetchWeather);
