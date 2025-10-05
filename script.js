// Module entry: manages starfield, menu and dynamic level loading
document.addEventListener("DOMContentLoaded", function () {
	const starfield = document.querySelector(".starfield");

	// Function to generate a random number within a range
	function getRandomNumber(min, max) {
		return Math.random() * (max - min) + min;
	}

	// Function to create a star element
	function createStar() {
		const star = document.createElement("div");
		star.classList.add("star");
		const isShootingStar = Math.random() > 0.95; // 5% chance of creating a shooting star
		if (isShootingStar) {
			star.classList.add("shooting-star");
			star.style.animationDuration = `${getRandomNumber(2, 4)}s`; // Set animation duration for shooting stars
		}
		star.style.left = `${getRandomNumber(0, 100)}vw`;
		star.style.top = `${getRandomNumber(0, 100)}vh`;
		star.style.width = `${isShootingStar ? getRandomNumber(3, 5) : getRandomNumber(1, 2)}px`; // Larger width for shooting stars
		star.style.height = `${isShootingStar ? getRandomNumber(3, 5) : getRandomNumber(1, 2)}px`; // Larger height for shooting stars
		starfield.appendChild(star);
	}

	// Generate stars including shooting stars
	for (let i = 0; i < 1000; i++) {
		createStar();
	}

	// Function to make stars fade in and out
	function blinkStars() {
		const stars = document.querySelectorAll(".star");
		stars.forEach((star) => {
			const duration = getRandomNumber(2, 4); // Randomize duration for each star
			star.style.animation = `blink ${duration}s infinite alternate`;
		});
	}

	// Blink stars
	blinkStars();

	// Level manager state
	const levelManager = {
		current: 0,
		total: 4,
		runningLevel: null,
		paused: false
	};

	const startButton = document.getElementById('startButton');
	const levelButtons = document.querySelectorAll('.level-btn');
	const menu = document.getElementById('menu');
	const gameContainer = document.getElementById('gameContainer');

	const backToMenu = document.getElementById('backToMenu');

	// Simple asset loader (images + audio)
	const assets = {
		images: {},
		audio: {}
	};

	async function loadAssets(){
		// images
		const imgList = {
			astronautLeft: './assets/astronaut left.png',
			astronautRight: './assets/astronaut right.png',
			star: './assets/star.jpg',
			earth: './assets/earth.jpg',
			mars: './assets/mars.jpg',
			moon: './assets/moon.jpg'
		};
		await Promise.all(Object.entries(imgList).map(([k, url]) => new Promise((res, rej) => {
			const img = new Image(); img.onload = () => { assets.images[k] = img; res(); }; img.onerror = rej; img.src = url;
		})));

		// audio
		// audio (voice files explicitly mapped to existing assets)
		const audioList = {
			option: './assets/option selected.mp3',
			levelPass: './assets/level passed.mp3',
			starCollect: './assets/star collected.mp3',
			// narration clips (only include files that exist in assets/)
			lvl1Voice: './assets/lvl1 voice.mp3',
			lvl2Voice: './assets/lvl2 voice.mp3',
			lvl3Voice: './assets/lvl3 voice.mp3',
			lvl4Voice: './assets/lvl4 voice.mp3'
		};
		Object.entries(audioList).forEach(([k,url]) => { assets.audio[k] = new Audio(url); assets.audio[k].preload = 'auto'; });
	}

	// preload assets in background and expose globally for levels
	const assetsReady = loadAssets().then(() => { try{ window.assets = assets; }catch(e){} }).catch(e=>{ console.warn('Asset load failed', e); });

	// Start button: disable while loading and start sequence
	startButton.addEventListener('click', async () => {
		// If a level is currently loaded/paused, treat this as a Continue button
		if(levelManager.runningLevel){
			// Try to reuse the same behavior as clicking the specific level button
			try{
				const lvl = levelManager.current;
				const btn = document.querySelector(`.level-btn[data-level="${lvl}"]`);
				if(btn){
					// trigger the same click handler as the level button
					btn.click();
					return;
				}
			}catch(e){}
			// fallback: resume (unhide) existing game
			menu.classList.add('hidden');
			gameContainer.classList.remove('hidden');
			levelManager.paused = false;
			startButton.textContent = 'Start (Play Levels in order)';
			return;
		}
		try{
			startButton.disabled = true;
			startButton.textContent = 'Loading...';
			console.log('Start pressed — loading level sequence');
			menu.classList.add('hidden');
			await startLevelSequence(1);
		}catch(err){
			console.error('Error starting level sequence', err);
			menu.classList.remove('hidden');
		}finally{
			startButton.disabled = false;
			startButton.textContent = 'Start (Play Levels in order)';
		}
	});

	// individual level buttons
	levelButtons.forEach(btn => {
		btn.addEventListener('click', () => {
			const lvl = parseInt(btn.dataset.level, 10);
			// If there's a running level already loaded, and user clicked that same level, treat as Continue
			if(levelManager.runningLevel && levelManager.current === lvl){
				menu.classList.add('hidden');
				gameContainer.classList.remove('hidden');
				levelManager.paused = false;
				startButton.textContent = 'Start (Play Levels in order)';
				return;
			}
			// If a different level is running, stop it first to ensure fresh config
			if(levelManager.runningLevel){
				stopRunningLevel();
				levelManager.runningLevel = null;
			}
			// otherwise start fresh at the chosen level
			menu.classList.add('hidden');
			startLevelSequence(lvl);
		});
	});

	// Resize canvas to be larger and match container before starting a level
	function resizeCanvasToContainer(){
		const canvas = document.getElementById('gameCanvas');
		const container = document.getElementById('gameContainer');
		if(!canvas || !container) return;
		// make canvas fill most of viewport with padding
		const maxW = Math.max(800, Math.floor(window.innerWidth * 0.9));
		const maxH = Math.max(480, Math.floor(window.innerHeight * 0.82));
		canvas.width = maxW;
		canvas.height = maxH;
		canvas.style.width = maxW + 'px';
		canvas.style.height = maxH + 'px';
	}

	window.addEventListener('resize', resizeCanvasToContainer);

	if(backToMenu){
		backToMenu.addEventListener('click', () => {
			// play option sound and hide the game (do not fully stop the running module so Continue works)
			if(assets.audio.option){ assets.audio.option.currentTime = 0; assets.audio.option.play().catch(()=>{}); }
			// pause audio but keep the running module in memory so the user can continue
			try{ Object.values(assets.audio || {}).forEach(a=>{ try{ a.pause(); }catch(e){} }); }catch(e){}
			gameContainer.classList.add('hidden');
			menu.classList.remove('hidden');
			levelManager.paused = true;
			// change start button to indicate continue
			startButton.textContent = 'Continue';
		});
	}

	function stopAllAudio(){
		Object.values(assets.audio || {}).forEach(a=>{ try{ a.pause(); a.currentTime = 0; }catch(e){} });
		// stop speech synthesis
		if('speechSynthesis' in window){ speechSynthesis.cancel(); }
	}

	function stopNarration(){
		// stop any narration audio elements but don't reset other game sounds
		try{
			if(assets && assets.audio){
				['lvl1Voice','lvl2Voice','lvl3Voice','lvl4Voice'].forEach(k=>{
					const a = assets.audio[k]; if(a){ try{ a.pause(); a.currentTime = 0; }catch(e){} }
				});
			}
		}catch(e){}
		if('speechSynthesis' in window) try{ speechSynthesis.cancel(); }catch(e){}
	}

	async function startLevelSequence(startAt){
		// ensure any previous level is fully stopped
		stopRunningLevel();
		levelManager.current = startAt;
		while(levelManager.current <= levelManager.total){
			// resize canvas to a larger play area before starting
			resizeCanvasToContainer();
			gameContainer.classList.remove('hidden');
			const success = await startLevel(levelManager.current);
			if(!success) break; // aborted
			levelManager.current++;
		}
		// sequence finished — return to menu
		stopRunningLevel();
		gameContainer.classList.add('hidden');
		menu.classList.remove('hidden');
	}

	let runningModule = null;
	// levelModuleMap lets us change which JS module backs a given level number
	// without moving files. Map format: requestedLevel -> actualModuleLevel
		const levelModuleMap = {
			1: 1,
			2: 4, // your request: make Level 2 load the previous Level 4 module
			3: 2, // Level 3 should load what was Level 2
			4: 3 // Level 4 should load what was Level 3
		};

		async function startLevel(n){
			let previousAlias = null;
			let moduleNum = (levelModuleMap && levelModuleMap[n]) ? levelModuleMap[n] : n;
			let moduleUrl = new URL(`./levels/level${moduleNum}.js`, import.meta.url).href;
			console.log('Importing level module from', moduleUrl);
			// wait for assets to be ready so aliasing can reference the visible level's audio
			try{ await assetsReady.catch(()=>{}); }catch(e){}

			try{
				// AUDIO ALIASING: some modules reference assets.audio.lvl<moduleNum>Voice
				// but you want visible Level n to use assets.audio.lvl<n>Voice.
				// To avoid changing module code, temporarily alias the module's
				// lvl<moduleNum>Voice entry to point to lvl<n>Voice before import.
				if(assets && assets.audio){
					const visibleKey = `lvl${n}Voice`;
					const moduleKey = `lvl${moduleNum}Voice`;
					if(assets.audio[visibleKey] && moduleKey !== visibleKey){
						previousAlias = assets.audio[moduleKey] || null;
						assets.audio[moduleKey] = assets.audio[visibleKey];
						console.log(`Aliasing audio ${moduleKey} -> ${visibleKey} for this level run`);
					}
				}

				// ensure any previous module is stopped before loading a new one
				stopRunningLevel();
				// stop any narration/voice to avoid overlap when the new level begins
				stopNarration();
				runningModule = await import(moduleUrl);
				if(typeof runningModule.start !== 'function'){
					console.warn('Level', n, 'has no start() export');
					return false;
				}
				// provide hooks and DOM elements
				const ctx = {
					canvas: document.getElementById('gameCanvas'),
					hud: document.getElementById('hud'),
					speak: speak,
					done: () => {} // placeholder — will be replaced per-level promise
				};
				// mark running level in manager
				levelManager.runningLevel = n;
				// each level's start should return a promise that resolves when level completes or is aborted
				const finished = await runningModule.start(ctx);
				levelManager.runningLevel = null;
				return finished === true;
			}catch(err){
				console.error('Failed to load level', n, err);
				return false;
			}finally{
				// restore any aliased audio reference so other runs are unaffected
				try{
					if(previousAlias !== null && assets && assets.audio){
						const moduleKey = `lvl${moduleNum}Voice`;
						assets.audio[moduleKey] = previousAlias;
						console.log(`Restored original ${moduleKey} audio reference after level run`);
					}
				}catch(e){ console.warn('Failed to restore audio alias', e); }
			}
		}

	function stopRunningLevel(){
		if(runningModule && typeof runningModule.stop === 'function'){
			try{ runningModule.stop(); }catch(e){/*ignore*/}
		}
		runningModule = null;
	}

	// Web Speech helper
	function speak(text){
		if(!('speechSynthesis' in window)) return;
		const utter = new SpeechSynthesisUtterance(text);
		utter.rate = 1.0;
		speechSynthesis.cancel();
		speechSynthesis.speak(utter);
	}

	// Note: per-level implementations live in `levels/levelX.js` modules.
	// The LevelManager dynamically imports them and calls their exported start(ctx) function.
});
