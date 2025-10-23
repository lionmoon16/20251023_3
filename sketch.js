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
let fireworkLaunched = false; // 標記是否已啟動煙火，避免重複發射

window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        // 重置煙火狀態，以便新的分數可以觸發它
        fireworkLaunched = false; 

        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
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
    // ... (其他設置)
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    noLoop(); // 預設不重複繪製，除非觸發動畫
} 

// score_display.js 中的 draw() 函數片段

function draw() { 
    // -----------------------------------------------------------------
    // 煙火特效的背景處理
    // -----------------------------------------------------------------
    let percentage = (finalScore / maxScore) * 100;

    if (percentage === 100 && !fireworkLaunched) {
        loop(); // 啟用連續繪製，開始動畫
        fireworkLaunched = true;
        // 黑色背景用於煙火效果，並帶有少量拖影 (trail effect)
        background(0, 0, 0, 255); 
    } else if (percentage < 100 && fireworkLaunched) {
        // 如果分數改變或不再是 100%，停止動畫
        noLoop();
        fireworkLaunched = false;
        background(255); // 重設為白色背景
    } else if (percentage === 100) {
        // 正在播放動畫時的背景（半透明黑色，產生拖影效果）
        background(0, 0, 0, 25); 
    } else {
        // 一般情況下的背景（白色）
        background(255); 
    }


    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    
    // 繪製分數顯示
    if (percentage === 100) {
        // 滿分時，使用一個閃爍的標題
        textSize(80); 
        textAlign(CENTER);
        // 使用 sine 波函數產生顏色閃爍
        let r = map(sin(frameCount * 0.1), -1, 1, 150, 255); 
        let g = map(sin(frameCount * 0.1 + TWO_PI / 3), -1, 1, 150, 255); 
        let b = map(sin(frameCount * 0.1 + TWO_PI * 2 / 3), -1, 1, 150, 255); 
        fill(r, g, b); 
        text("🎉 完美！超級優異成績！ 🎉", width / 2, height / 2 - 50);

    } else if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        textSize(80); 
        textAlign(CENTER);
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        textSize(80); 
        textAlign(CENTER);
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        textSize(80); 
        textAlign(CENTER);
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        textSize(80); 
        textAlign(CENTER);
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(255); // 在黑色背景下使用白色或淺色分數
    if (percentage < 100) {
        fill(50); // 在白色背景下使用深色分數
    }
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90 && percentage < 100) {
        // 畫一個大圓圈代表完美 [7] (非 100% 時)
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }


    // -----------------------------------------------------------------
    // C. 煙火特效的邏輯 (只在 percentage === 100 時執行)
    // -----------------------------------------------------------------
    if (percentage === 100) {
        // 定期發射新的煙火 (例如每 30 幀發射一個)
        if (frameCount % 30 === 0) {
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

class Particle {
    constructor(x, y, hue, firework) {
        this.pos = createVector(x, y);
        this.firework = firework; // 是否是火箭（上升階段）
        this.lifespan = 255;
        this.hu = hue;

        if (this.firework) {
            // 火箭（向上運動）
            this.vel = createVector(0, random(-10, -14)); 
            this.acc = createVector(0, 0);
            this.mass = 1;
        } else {
            // 爆炸碎片
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 碎片初始速度
            this.acc = createVector(0, 0); // 初始加速度為 0
            this.mass = 0.5;
        }
    }

    applyForce(force) {
        // F = ma -> a = F/m
        let f = force.copy();
        f.div(this.mass);
        this.acc.add(f);
    }

    update() {
        if (!this.firework) {
            // 爆炸碎片受重力和空氣阻力
            let gravity = createVector(0, 0.2); // 重力
            this.applyForce(gravity);
            this.lifespan -= 4; // 碎片逐漸消失
        }
        
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }

    show() {
        colorMode(HSB);
        if (this.firework) {
            // 火箭的樣式
            strokeWeight(4);
            stroke(this.hu, 255, 255);
        } else {
            // 碎片（更小的點，顏色逐漸變暗和透明）
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        }

        point(this.pos.x, this.pos.y);
    }
    
    isFinished() {
        return !this.firework && this.lifespan < 0;
    }
}


class Firework {
    constructor(x, y) {
        // HSB 顏色模式，hue 是色相 (0-360)
        this.hu = random(255); 
        this.firework = new Particle(x, y, this.hu, true); // 火箭粒子
        this.exploded = false;
        this.particles = []; // 爆炸碎片陣列
    }

    update() {
        if (!this.exploded) {
            this.firework.update();
            // 如果火箭速度開始變正（即開始下落），則爆炸
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
