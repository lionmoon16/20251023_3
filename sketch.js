// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字

// 全域變數：用於煙火效果
let fireworks = []; // 儲存所有煙火物件的陣列
// 標記是否已啟動煙火。必須是 false 才能在第一次滿分時觸發 loop()
let fireworkLaunched = false; 

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        // 當接收到新分數時，重置煙火狀態。
        // 如果分數是 100%，下一幀 draw() 會重新啟動它。
        fireworkLaunched = false; 

        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    // 讓 Canvas 寬度為視窗的一半，方便與 H5P 內容並排
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 預設不重複繪製，除非分數改變或達到滿分需要動畫
    noLoop(); 
    // 啟用 HSB 色彩模式 (色相, 飽和度, 亮度)，方便處理煙火顏色
    colorMode(HSB);
} 

function draw() { 
    // 計算百分比
    let percentage = (maxScore > 0) ? (finalScore / maxScore) * 100 : 0;
    
    // 設定文字的基本屬性
    textSize(80); 
    textAlign(CENTER);


    // -----------------------------------------------------------------
    // A. 煙火特效的背景處理與動畫控制
    // -----------------------------------------------------------------
    if (percentage === 100 && !fireworkLaunched) {
        // 第一次滿分：啟動動畫循環，設置黑色背景
        loop(); 
        fireworkLaunched = true;
        background(0, 0, 0, 255); // 黑色背景
    } else if (percentage < 100 && fireworkLaunched) {
        // 分數不滿分時：停止動畫循環，重設為白色背景
        noLoop();
        fireworkLaunched = false;
        background(255); 
    } else if (percentage === 100) {
        // 正在播放動畫：半透明黑色背景，產生拖影效果 (trail effect)
        background(0, 0, 0, 25); 
    } else {
        // 一般情況：白色背景
        background(255); 
    }


    // -----------------------------------------------------------------
    // B. 根據分數區間改變文本顏色和內容 
    // -----------------------------------------------------------------
    
    // 繪製標題/鼓勵語
    if (percentage === 100) {
        // 滿分時，使用一個閃爍的標題 (在 HSB 模式下，色相/亮度隨時間變化)
        let hue = frameCount * 3 % 255; // 色相隨幀數變化
        fill(hue, 255, 255); 
        text("🎉 完美！超級優異成績！ 🎉", width / 2, height / 2 - 50);

    } else if (percentage >= 90) {
        // 高分：綠色
        fill(100, 255, 255); // HSB: 綠色
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：黃色
        fill(50, 255, 255); // HSB: 黃色
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：紅色
        fill(0, 255, 255); // HSB: 紅色
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數
        fill(0, 0, 50); // HSB: 深灰色
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    if (percentage === 100) {
        fill(255); // 黑色背景下使用白色
    } else {
        fill(0, 0, 50); // 白色背景下使用深灰色
    }
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // C. 煙火特效的邏輯 (只在 percentage === 100 時執行)
    // -----------------------------------------------------------------
    if (percentage === 100) {
        // 定期發射新的煙火 (例如每 30 幀發射一個)
        if (random(1) < 0.05) { // 隨機發射，讓效果更自然
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
// =================================================================

// 單個粒子/碎片的類別
class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; // 是否是火箭（上升階段）
        this.lifespan = 255;
        this.hu = hue;

        if (this.firework) {
            // 火箭（向上運動）
            this.vel = createVector(0, random(-10, -14)); 
        } else {
            // 爆炸碎片
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 碎片初始速度
        }
        // 通用：加速度
        this.acc = createVector(0, 0);
        // 增加質量屬性，讓重力影響更明顯
        this.mass = this.firework ? 2 : 1; 
    }

    applyForce(force) {
        // F = ma -> a = F/m
        let f = force.copy();
        f.div(this.mass);
        this.acc.add(f);
    }

    update() {
        if (!this.firework) {
            // 碎片受重力影響
            let gravity = createVector(0, 0.2); 
            this.applyForce(gravity);
            this.lifespan -= 4; // 碎片逐漸消失
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }
    
    show() {
        if (this.firework) {
            // 火箭的樣式
            strokeWeight(4);
            // 火箭的顏色是單一色相 (hu)，亮度始終最高 (255)
            stroke(this.hu, 255, 255); 
        } else {
            // 碎片（更小的點，顏色逐漸變暗和透明）
            strokeWeight(2);
            // 碎片的顏色會隨著 lifespan 變透明
            stroke(this.hu, 255, 255, this.lifespan);
        }

        point(this.pos.x, this.pos.y);
    }
    
    isFinished() {
        // 只有爆炸碎片（firework=false）且壽命耗盡才算完成
        return !this.firework && this.lifespan < 0;
    }
}


// 煙火 (Firework) 的類別
class Firework {
    constructor(x, y) {
        // 隨機色相 (0-255，因為我們使用 HSB 模式)
        this.hu = random(255); 
        // 建立火箭粒子。'true' 表示這是上升階段的粒子
        this.firework = new Particle(x, y, this.hu, true); 
        this.exploded = false;
        this.particles = []; // 爆炸碎片陣列
    }

    update() {
        if (!this.exploded) {
            // 火箭上升階段
            // 施加一個向下的力（模擬重力）
            let gravity = createVector(0, 0.2); 
            this.firework.applyForce(gravity);
            this.firework.update();
            
            // 如果火箭速度開始變正（即開始下落，達到最高點），則爆炸
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
        // 只有在爆炸（火箭消失）後且所有碎片都消失時才算完成
        return this.exploded && this.particles.length === 0;
    }
}
