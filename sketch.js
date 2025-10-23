// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------

// 全域變數：用於儲存 H5P 傳遞過來的成績
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; 

// 全域變數：用於煙火效果控制
let fireworks = []; // 儲存所有煙火物件的陣列
let fireworkLaunched = false; // 標記是否已啟動煙火動畫

window.addEventListener('message', function (event) {
    // 監聽來自 H5P iFrame 的分數結果
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // 更新全域分數變數
        finalScore = data.score; 
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        // 重置煙火狀態，以便新的分數可以觸發判斷
        fireworkLaunched = false; 

        console.log("新的分數已接收:", scoreText); 
        
        // 觸發 p5.js 立即重繪
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：p5.js 核心設定與繪圖
// -----------------------------------------------------------------

function setup() { 
    // 創建 Canvas 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 預設不重複繪製，節省資源。只有分數改變或啟動動畫時才繪製。
    noLoop(); 
    // 設定色彩模式：HSB (色相 0-360, 飽和度 0-100, 亮度 0-100)
    colorMode(HSB, 360, 100, 100, 100); 
} 

function draw() { 
    // 計算百分比，避免除以零
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
    
    // 設定文字的基本屬性
    textAlign(CENTER);


    // -----------------------------------------------------------------
    // A. 煙火特效的背景處理與動畫控制
    // -----------------------------------------------------------------
    if (percentage === 100 && !fireworkLaunched) {
        // 第一次滿分：啟動動畫循環
        loop(); 
        fireworkLaunched = true;
        background(0, 0, 0, 100); // 黑色背景，亮度為 0
        fireworks = []; // 清空舊的煙火
    } else if (percentage < 100 && fireworkLaunched) {
        // 分數改變或不滿分時：停止動畫循環，重設為白色背景
        noLoop();
        fireworkLaunched = false;
        background(0, 0, 100, 100); // 白色背景，亮度為 100
    } else if (percentage === 100) {
        // 正在播放動畫：半透明黑色背景，產生拖影效果 (trail effect)
        // HSB 模式下，色相/飽和度為 0，亮度為 0，透明度為 10
        background(0, 0, 0, 10); 
    } else {
        // 一般情況：白色背景
        background(0, 0, 100, 100); 
    }


    // -----------------------------------------------------------------
    // B. 根據分數區間繪製文字
    // -----------------------------------------------------------------
    
    // 繪製標題/鼓勵語
    textSize(80); 
    if (percentage === 100) {
        // 滿分時，使用一個閃爍的標題 
        let hue = frameCount * 2 % 360; // 色相隨幀數變化 (0-360)
        fill(hue, 100, 100); // 鮮豔的顏色
        text("🎉 完美！超級優異成績！ 🎉", width / 2, height / 2 - 50);

    } else if (percentage >= 90) {
        // 高分：綠色
        fill(120, 100, 70); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：黃色
        fill(50, 100, 90); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：紅色
        fill(0, 80, 80); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數
        fill(0, 0, 50); // 深灰色
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    if (percentage === 100) {
        fill(0, 0, 100); // 黑色背景下使用白色
    } else {
        fill(0, 0, 30); // 白色背景下使用深色
    }
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // C. 煙火特效的邏輯 (只在 percentage === 100 時執行)
    // -----------------------------------------------------------------
    if (percentage === 100) {
        // 隨機發射新的煙火 (0.05 的機率)
        if (random(1) < 0.05) { 
            // 在底部隨機 X 軸位置發射
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
        this.lifespan = 100; // HSB 模式下，亮度/透明度範圍是 0-100
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
