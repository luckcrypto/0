// Luck.fyi homepage hero drum — LIGHT theme variant (canvas id TNL)
// The DARK variant is mixer-home.js. A tiny controller in the page starts
// the variant matching the active theme and swaps them when the theme toggles.
function startHomeDrumLight(canvasId, seed) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) { console.error(`Canvas with id "${canvasId}" not found`); return null; }
    const ctx = canvas.getContext("2d");
    const width = canvas.width, height = canvas.height;
    const centerX = width / 2, centerY = height / 2;
    const drumRadius = 180, innerDrumRadius = drumRadius - 15;
    const gravity = 0.68, blowerPower = 2.8, blowerRadius = 58, friction = 0.9985, wallBounce = 0.48, timeScale = 0.525;
    function random(min, max) { return Math.random() * (max - min) + min; }
    const R = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };

    class Ball {
        constructor(x, y, velX, velY, size, number, fill, text) {
            this.x = x; this.y = y; this.velX = velX; this.velY = velY;
            this.size = size; this.number = number; this.fill = fill; this.text = text;
        }
        draw() {
            const g = ctx.createRadialGradient(this.x - this.size*0.4, this.y - this.size*0.4, this.size*0.1, this.x, this.y, this.size);
            g.addColorStop(0, this.fill);
            g.addColorStop(0.5, this.darken(this.fill, 0.85));
            g.addColorStop(1, this.darken(this.fill, 0.65));
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, 2*Math.PI); ctx.fillStyle = g; ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.8; ctx.stroke();
            ctx.beginPath(); ctx.arc(this.x - this.size*0.35, this.y - this.size*0.35, this.size*0.22, 0, 2*Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
            ctx.fillStyle = this.text; ctx.font = `bold ${this.size < 15 ? 13 : 14}px Arial`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.number, this.x, this.y);
        }
        darken(hex, f) {
            let r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
            r = Math.floor(r*f); g = Math.floor(g*f); b = Math.floor(b*f);
            return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
        }
        update() {
            const ts = timeScale; this.velY += gravity * ts;
            const dx = this.x - centerX, dy = this.y - centerY, dist = Math.hypot(dx, dy);
            if (dist > innerDrumRadius * 0.4) {
                const bottomDist = Math.hypot(dx, dy - innerDrumRadius + 35);
                if (bottomDist < blowerRadius) {
                    const strength = blowerPower * (2 - bottomDist / blowerRadius);
                    this.velY -= strength * (1 + random(-0.1, 0.8)) * ts;
                    this.velX += random(-0.1, 0.9) * ts;
                }
            }
            this.velX *= Math.pow(friction, ts); this.velY *= Math.pow(friction, ts);
            if (dist + this.size > innerDrumRadius) {
                const angle = Math.atan2(dy, dx);
                this.x = centerX + Math.cos(angle) * (innerDrumRadius - this.size);
                this.y = centerY + Math.sin(angle) * (innerDrumRadius - this.size);
                const nx = dx/dist, ny = dy/dist, dot = this.velX*nx + this.velY*ny;
                this.velX -= 2*dot*nx*wallBounce; this.velY -= 2*dot*ny*wallBounce;
            }
            this.x += this.velX * ts; this.y += this.velY * ts;
        }
        collisionDetect(balls) {
            for (const ball of balls) {
                if (this === ball) continue;
                const dx = this.x - ball.x, dy = this.y - ball.y, distance = Math.hypot(dx, dy);
                if (distance < this.size + ball.size) {
                    const nx = dx/distance, ny = dy/distance;
                    const rvx = this.velX - ball.velX, rvy = this.velY - ball.velY, dot = rvx*nx + rvy*ny, ix = dot*nx, iy = dot*ny;
                    this.velX -= ix*0.94; this.velY -= iy*0.94; ball.velX += ix*0.94; ball.velY += iy*0.94;
                    const overlap = this.size + ball.size - distance;
                    this.x += nx*overlap*0.5; this.y += ny*overlap*0.5; ball.x -= nx*overlap*0.5; ball.y -= ny*overlap*0.5;
                }
            }
        }
    }

    // ===== ball pools — the ONLY per-lottery difference =====
    const POOLS = [{fill:'#ffffff',text:'#000000',nums:R(1,10)},{fill:'#2F73D8',text:'#ffffff',nums:R(11,20)},{fill:'#E84C9A',text:'#111111',nums:R(21,30)},{fill:'#34B36A',text:'#111111',nums:R(31,40)},{fill:'#F3C53C',text:'#111111',nums:R(41,50)},{fill:'#8E5BD0',text:'#ffffff',nums:R(51,59)}];

    const balls = [], size = 12;
    const bottomOffset = innerDrumRadius * 0.65, spreadRadius = innerDrumRadius * 0.68;
    function spawn() {
        let x, y, dist;
        do {
            const angle = Math.PI + random(-Math.PI/2.8, Math.PI/2.8);
            const radius = random(0, spreadRadius * 1.0);
            x = centerX + radius * Math.cos(angle);
            y = centerY + radius * Math.sin(angle) + bottomOffset + random(-30, 30);
            dist = Math.hypot(x - centerX, y - centerY);
        } while (dist + size > innerDrumRadius || y < centerY - innerDrumRadius * 0.35);
        return { x, y };
    }
    // reuse ball positions when swapping themes (seed), else spawn fresh
    if (seed && seed.length) {
        for (const s of seed) balls.push(new Ball(s.x, s.y, s.velX, s.velY, s.size, s.number, s.fill, s.text));
    } else {
        for (const pool of POOLS) {
            for (const n of pool.nums) {
                const p = spawn();
                balls.push(new Ball(p.x, p.y, random(-2.4, 2.4), random(-1.4, 3.4), size, n.toString(), pool.fill, pool.text));
            }
        }
    }

    let rotationCW = 0.025, rotationCCW = 0.058;
    function drawDrum() {
        const cx = centerX, cy = centerY, r = drumRadius;
        const glass = ctx.createRadialGradient(cx - r*0.35, cy - r*0.35, r*0.1, cx, cy, r);
        glass.addColorStop(0, 'rgba(245,250,255,0.92)'); glass.addColorStop(0.4, 'rgba(220,235,255,0.75)');
        glass.addColorStop(0.7, 'rgba(200,220,245,0.55)'); glass.addColorStop(1, 'rgba(180,200,230,0.40)');
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle = glass; ctx.fill();
        // ----- LIGHT drum shadow (lighter, desaturated neutral-gray) -----
        const inset = ctx.createRadialGradient(cx + r*0.4, cy + r*0.4, r*0.3, cx, cy, r);
        inset.addColorStop(0, 'rgba(88,92,100,0.00)'); inset.addColorStop(0.5, 'rgba(80,84,92,0.05)');
        inset.addColorStop(0.8, 'rgba(72,76,84,0.10)'); inset.addColorStop(1, 'rgba(64,68,76,0.16)');
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle = inset; ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
        const rim = ctx.createRadialGradient(cx, cy, r-12, cx, cy, r);
        rim.addColorStop(0, 'rgba(0,0,0,0.00)'); rim.addColorStop(0.7, 'rgba(0,0,0,0.04)'); rim.addColorStop(1, 'rgba(0,0,0,0.09)');
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fillStyle = rim; ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(cx - r*0.38, cy - r*0.38, r*0.32, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.52)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx - r*0.25, cy - r*0.28, r*0.12, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
        ctx.beginPath(); ctx.arc(cx - r*0.18, cy - r*0.20, r*0.05, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotationCW); ctx.strokeStyle = 'rgba(38,38,48,0.38)'; ctx.lineWidth = 5;
        for (let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(r-10,0); ctx.stroke(); ctx.rotate(Math.PI*2/3);} ctx.restore();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotationCCW); ctx.strokeStyle = 'rgba(38,38,58,0.21)'; ctx.lineWidth = 8;
        for (let i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(r-10,0); ctx.stroke(); ctx.rotate(Math.PI*2/3);} ctx.restore();
    }
    let rafId;
    function animate() {
        ctx.clearRect(0, 0, width, height); drawDrum();
        for (const ball of balls) { ball.update(); ball.collisionDetect(balls); ball.draw(); }
        const rs = 0.025 * timeScale; rotationCW += rs; rotationCCW -= rs;
        rafId = requestAnimationFrame(animate);
    }
    animate();
    return {
        stop: function () { cancelAnimationFrame(rafId); },
        snapshot: function () { return balls.map(function (b) { return { x: b.x, y: b.y, velX: b.velX, velY: b.velY, size: b.size, number: b.number, fill: b.fill, text: b.text }; }); }
    };
}
