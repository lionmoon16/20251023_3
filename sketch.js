// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 全域變數：用於儲存 H5P 傳遞過來的成績
let finalScore = 0; // 答對題數 (即 H5P 的 score)
let maxScore = 0;   // 總題數 (即 H5P 的 maxScore)
let scoreText = ""; // 顯示在畫布上的文字

// 全域變數：用於煙火效果控制
let fireworks = []; // 儲存所有煙火物件的陣列
let fireworkLaunched = false; // 標記是否已啟動煙火動畫

// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// ... (其他全域變數保持不動) ...

window.addEventListener('message', function (event) {
    // 監聽來自 H5P iFrame 的分數結果
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // 更新全域分數變數
        let finalScore = data.score; 
        let maxScore = data.maxScore;
        let scoreText = `答對題數: ${finalScore}/${maxScore}`;
        
        // 重置煙火狀態
        fireworkLaunched = false; 

        console.log("新的分數已接收:", scoreText); 
        
        // **實現要求二：成績完成後顯示 p5.js 畫面**
        // 假設 p5.js 畫布的預設 ID 是 'defaultCanvas0'
        const canvasElement = document.getElementById('defaultCanvas0');
        if (canvasElement) {
            // 將 canvas 設為可見 (覆蓋在 H5P 內容之上)
            canvasElement.style.display = 'block';
        }
        // ---------------------------------------------
        
        // 觸發 p5.js 立即重繪
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：p5.js 核心設定與繪圖
// -----------------------------------------------------------------

// =================================================================
// 步驟二：p5.js 核心設定與繪圖
// -----------------------------------------------------------------

let p5Canvas; // 宣告一個全域變數來儲存 p5.js canvas 元素

function setup() {
    // 獲取 H5P 容器的大小以決定 Canvas 大小
    const h5pIframe = document.querySelector('#h5pContainer iframe');
    const h5pWrapper = document.getElementById('overlayWrapper');

    let w = 600; 
    let h = 400; 
    
    if (h5pWrapper && h5pIframe) {
        // 獲取容器的實際寬度，並使用 H5P iframe 設定的固定高度
        w = h5pWrapper.offsetWidth; 
        h = parseInt(h5pIframe.getAttribute('height')) || 600;
    } 

    // 建立 canvas
    p5Canvas = createCanvas(w, h); 
    
    // 關鍵：將 canvas 放置到 #overlayWrapper 內，實現重疊效果
    p5Canvas.parent('overlayWrapper'); 

    colorMode(HSB, 360, 100, 100, 1);
    
    // 預設為只在有分數更新時繪製
    noLoop(); 
}

// ... (Particle 和 Firework 類別保持不動) ...

function draw() { 
    // 設定目標：答對 3 題時放煙火
    const FIREWORK_GOAL = 3;
    
    // 設定文字的基本屬性
    textAlign(CENTER);


    // -----------------------------------------------------------------
    // A. 煙火特效的背景處理與動畫控制 (觸發條件: finalScore === 3)
    // -----------------------------------------------------------------
    
    if (finalScore === FIREWORK_GOAL && !fireworkLaunched) {
        // 第一次達成目標：啟動動畫循環
        loop(); 
        fireworkLaunched = true;
        background(0, 0, 0, 100); // 黑色背景
        fireworks = []; // 清空舊的煙火
    } else if (finalScore !== FIREWORK_GOAL && fireworkLaunched) {
        // 分數不再是目標：停止動畫循環，重設為白色背景
        noLoop();
        fireworkLaunched = false;
        background(0, 0, 100, 100); // 白色背景
    } else if (finalScore === FIREWORK_GOAL) {
        // 正在播放動畫：半透明黑色背景，產生拖影效果
        background(0, 0, 0, 10); 
    } else {
        // 一般情況：白色背景
        background(0, 0, 100, 100); 
    }


    // -----------------------------------------------------------------
    // B. 根據答對題數繪製文字
    // -----------------------------------------------------------------
    
    // 繪製標題/鼓勵語
    textSize(80); 
    
    if (finalScore === maxScore && finalScore > 0) {
        // 答對總題數 (滿分)
        let hue = frameCount * 2 % 360; 
        fill(hue, 100, 100); 
        text("🎉 恭喜！全部答對！ 🎉", width / 2, height / 2 - 50);
        
    } else if (finalScore >= FIREWORK_GOAL) {
        // 答對題數 >= 3 題 (目標達成)
        let hue = frameCount * 2 % 360; 
        fill(hue, 100, 100); 
        text("🎉 答對 3 題目標達成！ 🎉", width / 2, height / 2 - 50);
        
    } else if (finalScore > 0) {
        // 有答對但未達成目標 (0 < finalScore < 3)
        fill(50, 100, 90); // 黃色
        text("成績良好，請繼續努力。", width / 2, height / 2 - 50);
        
    } else {
        // 答對 0 題
        fill(0, 80, 80); // 紅色
        text("需要加強努力！", width / 2, height / 2 - 50);
    }

    // 顯示具體分數
    textSize(50);
    if (finalScore === FIREWORK_GOAL) {
        fill(0, 0, 100); // 黑色背景下使用白色
    } else {
        fill(0, 0, 30); // 白色背景下使用深色
    }
    text(scoreText, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // C. 煙火特效的邏輯 (只在 finalScore === 3 時執行)
    // -----------------------------------------------------------------
    if (finalScore === FIREWORK_GOAL) {
        // 隨機發射新的煙火 (0.05 的機率)
        if (random(1) < 0.05) { 
            fireworks.push(new Firework(random(width), height));
        }

        // 更新和繪製所有煙火
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();

            // 移除已"死亡"的煙火
            if (fireworks[i].isFinished()) {
                fireworks.splice(i, 1);
            }
        }
    }
}


// =================================================================
// 步驟三：煙火和粒子類別 (Particle System)
// -----------------------------------------------------------------

class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; 
        this.lifespan = 100; // HSB 模式下，透明度範圍是 0-100
        this.hu = hue;

        if (this.firework) {
            // 火箭（向上運動）
            this.vel = createVector(0, random(-10, -14)); 
            this.mass = 2; // 火箭質量較大
        } else {
            // 爆炸碎片
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 碎片初始速度
            this.mass = 1; // 碎片質量較小
        }
        this.acc = createVector(0, 0); 
    }

    applyForce(force) {
        // a = F/m
        let f = force.copy();
        f.div(this.mass);
        this.acc.add(f);
    }

    update() {
        if (!this.firework) {
            // 碎片受重力影響
            let gravity = createVector(0, 0.2); 
            this.applyForce(gravity);
            this.lifespan -= 2; // 碎片逐漸消失 (速度較慢)
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }
    
    show() {
        noStroke();
        if (this.firework) {
            // 火箭的樣式
            fill(this.hu, 100, 100); 
            circle(this.pos.x, this.pos.y, 4); // 繪製一個小圓點
        } else {
            // 碎片
            // 碎片的顏色會隨著 lifespan 變透明 (第四個參數 alpha)
            fill(this.hu, 100, 100, this.lifespan); 
            circle(this.pos.x, this.pos.y, 2); 
        }
    }
    
    isFinished() {
        // 只有爆炸碎片（firework=false）且壽命耗盡才算完成
        return !this.firework && this.lifespan < 0;
    }
}


class Firework {
    constructor(x, y) {
        // 隨機色相 (0-360)
        this.hu = random(360); 
        // 建立火箭粒子。'true' 表示這是上升階段的粒子
        this.firework = new Particle(x, y, this.hu, true); 
        this.exploded = false;
        this.particles = []; // 爆炸碎片陣列
    }

    update() {
        if (!this.exploded) {
            // 火箭上升階段
            let gravity = createVector(0, 0.2); 
            this.firework.applyForce(gravity);
            this.firework.update();
            
            // 如果火箭速度開始變正（達到最高點開始下落），則爆炸
            if (this.firework.vel.y >= 0) {
                this.explode();
                this.exploded = true;
            }
        }

        // 更新爆炸碎片
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isFinished()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 產生多個爆炸碎片
        for (let i = 0; i < 100; i++) {
            // 爆炸碎片使用火箭爆炸時的位置和顏色。'false' 表示是碎片
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        
        // 繪製碎片
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
    }

    isFinished() {
        // 只有在爆炸後且所有碎片都消失時才算完成
        return this.exploded && this.particles.length === 0;
    }
}
