// Level 2: Gravity Jump (Earth gravity) - simple platformer placeholder
let state = {};
export function stop(){ state.running = false; }
export function start(ctx){
    return new Promise(resolve=>{
        const canvas = ctx.canvas; const c = canvas; const g = c.getContext('2d');
    state = { running: true, canvas:c, ctx:g, player:{x:50,y:300,r:14,xVel:0,yVel:0,jump:6, onGround:false}, platforms:[], stars:[], score:0, collectedTotal:0, animId:null, resolve };

        // create a simple floor and a platform
        state.platforms.push({x:0,y:c.height-40,w:c.width,h:40});
        state.platforms.push({x:200,y:c.height-140,w:140,h:16});

        function addStar(x,y){ state.stars.push({x:x||(100+Math.random()*(c.width-200)), y:y||Math.max(40, c.height - 120 - Math.random()*160), r:8, collected:false}); }
        function generateStars(){ state.stars = []; for(let i=0;i<6;i++) addStar(); }

    const keys = {};
    function kd(e){ keys[e.code]=true; if(e.code==='ArrowLeft'||e.code==='KeyA') state.player.dir='left'; if(e.code==='ArrowRight'||e.code==='KeyD') state.player.dir='right'; }
    function ku(e){ keys[e.code]=false; }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

    function clear(){ g.clearRect(0,0,c.width,c.height); }
    // set objective HUD text
    try{ ctx.hud.querySelector('#objective').textContent = 'Objective: collect all the stars'; }catch(e){}
    function drawStarImage(s){ try{ const img = window.assets && window.assets.images && window.assets.images.star; if(img){ const size = 28; g.drawImage(img, s.x - size/2, s.y - size/2, size, size); return; } }catch(e){} g.beginPath(); g.fillStyle='gold'; g.arc(s.x,s.y,Math.max(6,s.r),0,Math.PI*2); g.fill(); g.closePath(); }
        function draw(){
            // pause support
            try{ if(window.levelManager && window.levelManager.paused){ state.animId = requestAnimationFrame(draw); return; } }catch(e){}
            if(!state.running) return;
            clear();
            // input: horizontal movement (left/right) and gravity
            const hSpeed = 2.2;
            if(keys['ArrowLeft']||keys['KeyA']){ state.player.xVel = -hSpeed; }
            else if(keys['ArrowRight']||keys['KeyD']){ state.player.xVel = hSpeed; }
            else { state.player.xVel *= 0.8; }
            state.player.yVel += 0.35; // gravity
            if(keys['Space']||keys['KeyW']||keys['ArrowUp']){
                if(state.player.onGround){ state.player.yVel = -state.player.jump; state.player.onGround=false; }
            }
            state.player.x += state.player.xVel; state.player.y += state.player.yVel;
            // clamp to canvas
            state.player.x = Math.max(state.player.r, Math.min(c.width - state.player.r, state.player.x));
            state.player.y = Math.max(state.player.r, Math.min(c.height - state.player.r, state.player.y));

            // collision with platforms
            state.platforms.forEach(p=>{
                g.fillStyle='#333'; g.fillRect(p.x,p.y,p.w,p.h);
                if(state.player.x > p.x && state.player.x < p.x + p.w){
                    if(state.player.y + state.player.r > p.y && state.player.y + state.player.r < p.y + p.h + 20){
                        state.player.y = p.y - state.player.r; state.player.yVel = 0; state.player.onGround = true;
                    }
                }
            });

            // draw stars and handle collection
            for(let i=0;i<state.stars.length;i++){
                const s = state.stars[i];
                if(s.collected) continue;
                drawStarImage(s);
                const dx=s.x-state.player.x; const dy=s.y-state.player.y; if(Math.sqrt(dx*dx+dy*dy) < s.r + state.player.r){ s.collected=true; state.score++; state.collectedTotal++; try{ ctx.hud.querySelector('#score').textContent = 'Stars: ' + state.collectedTotal; }catch(e){} try{ if(window.assets && window.assets.audio && window.assets.audio.starCollect){ window.assets.audio.starCollect.currentTime=0; window.assets.audio.starCollect.play().catch(()=>{}); } }catch(e){}
                    // spawn replacement to keep ~6 stars
                    setTimeout(()=>{ state.stars = state.stars.filter(x=>!x.collected); while(state.stars.length < 6) addStar(); }, 80);
                }
            }

            // draw player as astronaut sprite if available
            try{ const imgL = window.assets && window.assets.images && window.assets.images.astronautLeft; const imgR = window.assets && window.assets.images && window.assets.images.astronautRight; const pSize = 48; if(state.player.dir==='right'&&imgR){ g.drawImage(imgR, state.player.x - pSize/2, state.player.y - pSize/2, pSize, pSize); } else if(imgL){ g.drawImage(imgL, state.player.x - pSize/2, state.player.y - pSize/2, pSize, pSize); } else { g.beginPath(); g.fillStyle='#88e0ff'; g.arc(state.player.x,state.player.y,state.player.r,0,Math.PI*2); g.fill(); g.closePath(); } }catch(e){ g.beginPath(); g.fillStyle='#88e0ff'; g.arc(state.player.x,state.player.y,state.player.r,0,Math.PI*2); g.fill(); g.closePath(); }

            // require 20 collected stars to pass
            if(state.collectedTotal >= 20){ try{ if(window.assets && window.assets.audio && window.assets.audio.levelPass){ window.assets.audio.levelPass.currentTime = 0; window.assets.audio.levelPass.play().catch(()=>{}); } else { ctx.speak('Great job! You collected 20 stars.'); } }catch(e){} setTimeout(()=>finish(true),800); return; }

            state.animId = requestAnimationFrame(draw);
        }

    function finish(res){ state.running=false; window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); try{ if(narrationAudio){ narrationAudio.pause(); narrationAudio.currentTime=0; } }catch(e){} if(typeof narrationTimeout !== 'undefined') clearTimeout(narrationTimeout); if(state.animId) cancelAnimationFrame(state.animId); resolve(res===true); }

        generateStars(); try{ ctx.hud.querySelector('#score').textContent='Stars: 0'; }catch(e){}
        // option sound then narration after 1.5s
        let narrationAudio = null;
        try{ if(window.assets && window.assets.audio && window.assets.audio.option){ window.assets.audio.option.currentTime=0; window.assets.audio.option.play().catch(()=>{}); } }catch(e){}
        const narrationTimeout = setTimeout(()=>{
            try{
                if(window.assets && window.assets.audio && window.assets.audio.lvl2Voice){ narrationAudio = window.assets.audio.lvl2Voice; narrationAudio.currentTime=0; narrationAudio.play().catch(()=>{}); console.log('Level 2 narration: playing lvl2Voice'); }
                else { console.log('Level 2 narration: using speechSynthesis fallback'); ctx.speak('Now you\'ve arrived back to Earth\'s gravity. Feel the weight as you jump and land. This helps you understand how gravity pulls you down, contrasting the weightless station!'); }
            }catch(e){ console.warn('Level 2 narration failed', e); }
        },1500);
        draw();
    });
}
