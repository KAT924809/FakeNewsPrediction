document.getElementById('checkNews').addEventListener('click', async () => {
    // Fetch the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const loader = document.getElementById("loader");
    loader.style.display = "block";
    document.getElementById("checkNews").style.display = "none";
    updatePercentDisplay(0);
    setScales(0);
    document.querySelector('.speedometer-container').style.display = "none";
    // Fetch title and article content
    const { title, articleBody } = await getTitleAndArticleContent();
    console.log(articleBody);
    if (title && articleBody) {
        try {
        const response = await fetch('http://localhost:8000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title:title, text: articleBody })
        });

        if (!response.ok) {
            loader.style.display = "none";
            console.error("Failed to fetch:", response.status, response.statusText);
            document.getElementById('result').textContent = 'Error with the server request.';
            return;
        }
        loader.style.display = "none";
        document.querySelector('.speedometer-container').style.display = "block";
        const data = await response.json();
        console.log(data.prediction);
        runGauge(data); //percentage for speedometer
        
    } catch (error) {
        loader.style.display = "none";
        console.error("Error fetching data:", error);
        document.getElementById('result').textContent = 'Error with the server request or network issues.';
    }
}
else {
        loader.style.display = "none";
        document.getElementById('result').textContent = 'Failed to retrieve article information.';
    }
});

async function getTitleAndArticleContent() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_TITLE' }, (titleResponse) => {
            chrome.runtime.sendMessage({ type: 'GET_ARTICLE_CONTENT' }, (articleResponse) => {
                resolve({
                    title: titleResponse.title || 'No title found.',
                    articleBody: articleResponse.articleBody || 'No article body found.'
                });
            });
        });
    });
}


















function setScales(percent) {
    const count = 19;
    const scaleNum = Math.round((percent / 100) * (count - 1)) + 1;
    document.querySelectorAll('.speedometer-scale').forEach(e => e.classList.remove('active'));
    for (let i = 1; i <= scaleNum; i++) {
        const el = document.querySelector(`.speedometer-scale-${i}`);
        if (el) el.classList.add('active');
    }
}

function updatePercentDisplay(percent) {
    document.getElementById("percent-display").innerText = Math.round(percent);
}

function showResult(prediction,percent) {
    const result = document.getElementById('result');
    let side = prediction === "Fake"? 'The news is likely fake.' : 'The news seems to be real.';

    result.textContent = `${side} (${Math.round(percent)}%)`;
}

// This is the "wild and then settle" animation:
function runGauge(data) {
    let gaugePercent = data.prediction === "Fake" ? 100 - data.confidence : data.confidence;
    let finalPercent = gaugePercent 
    // Map 0-100% to 0-180 (in steps of 10)
    let targetSpeed = Math.round(finalPercent * 1.8 / 10) * 10;
    let el = document.getElementsByClassName("arrow-wrapper")[0];

    function clearClasses() {
        for (let i = 0; i <= 180; i += 10) {
            el.classList.remove("speed-" + i);
        }
    }

    function setScalesBySpeed(speedVal) {
        let percent = (speedVal / 180) * 100;
        setScales(percent);
        updatePercentDisplay(percent);
    }

    // Start at 0
    clearClasses();
    el.classList.add("speed-0");
    setScalesBySpeed(0);

    let time = 0;
    let wildInterval = setInterval(() => {
        let randomStep = Math.round(Math.random() * 18) * 10;
        clearClasses();
        el.classList.add("speed-" + randomStep);
        setScalesBySpeed(randomStep);
        time += 120;
        if (time > 1800) {
            clearInterval(wildInterval);

            setTimeout(() => {
                clearClasses();
                el.classList.add("speed-0");
                setScalesBySpeed(0);
                // Animate up to the target (one step at a time)
                let current = 0;
                let animateInterval = setInterval(() => {
                    clearClasses();
                    el.classList.add("speed-" + current);
                    setScalesBySpeed(current);
                    if (current < targetSpeed) {
                        current += 10;
                    } else if (current > targetSpeed) {
                        current -= 10;
                    } else {
                        clearInterval(animateInterval);
                        setScalesBySpeed(targetSpeed);
                        updatePercentDisplay(finalPercent);
                        showResult(data.prediction,data.confidence);
                    }
                }, 60);
            }, 100);
        }
    }, 120);
}