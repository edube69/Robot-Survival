// Module de gestion audio
const Audio = {
    context: null,
    enabled: true,
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
            console.warn('Audio context not supported');
        }
    },
    
    playLaser({
        freqStart = 1200,
        freqEnd = 400,
        duration = 0.12,
        volume = 0.15,
        type = 'sawtooth',
        noise = false
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();

        osc.type = type;
        osc.frequency.setValueAtTime(freqStart, now);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.value = 1.2;

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);

        osc.start(now);
        osc.stop(now + duration);

        if (noise) {
            // Optionnel: léger bruit pour un tir plus "projectile"
            const bufferSize = this.context.sampleRate * duration;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.2; // bruit blanc faible
            }
            const noiseSource = this.context.createBufferSource();
            noiseSource.buffer = buffer;
            const noiseGain = this.context.createGain();
            noiseGain.gain.setValueAtTime(0.05, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            noiseSource.connect(noiseGain);
            noiseGain.connect(this.context.destination);
            noiseSource.start(now);
            noiseSource.stop(now + duration);
        }
    },
    
    playCoinSound({
        baseFreq = 800,
        harmonics = [1, 1.5, 2, 2.5],
        duration = 0.25,
        volume = 0.08,
        metallic = true
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son principal de la pièce avec harmoniques
        harmonics.forEach((harmonic, index) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            // Fréquence harmonique
            osc.frequency.setValueAtTime(baseFreq * harmonic, now);
            osc.type = 'sine';
            
            // Filtrage pour effet métallique
            if (metallic) {
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(baseFreq * harmonic, now);
                filter.Q.value = 8;
                osc.connect(filter);
                filter.connect(gain);
            } else {
                osc.connect(gain);
            }
            
            // Enveloppe de volume (attaque rapide, déclin naturel)
            const harmonicVolume = volume / (index + 1); // harmoniques plus faibles
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(harmonicVolume, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            
            gain.connect(this.context.destination);
            
            osc.start(now);
            osc.stop(now + duration);
        });
        
        // Ajout d'un petit "ting" métallique au début
        if (metallic) {
            const tingOsc = this.context.createOscillator();
            const tingGain = this.context.createGain();
            const tingFilter = this.context.createBiquadFilter();
            
            tingOsc.frequency.setValueAtTime(baseFreq * 4, now);
            tingOsc.type = 'triangle';
            
            tingFilter.type = 'highpass';
            tingFilter.frequency.setValueAtTime(baseFreq * 2, now);
            
            tingOsc.connect(tingFilter);
            tingFilter.connect(tingGain);
            tingGain.connect(this.context.destination);
            
            tingGain.gain.setValueAtTime(volume * 0.3, now);
            tingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            
            tingOsc.start(now);
            tingOsc.stop(now + 0.08);
        }
    },
    
    playExplosionSound({
        baseFreq = 150,
        duration = 0.8,
        volume = 0.2,
        intense = false
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son d'explosion principal (basse fréquence)
        const mainOsc = this.context.createOscillator();
        const mainGain = this.context.createGain();
        const mainFilter = this.context.createBiquadFilter();
        
        mainOsc.type = 'sawtooth';
        mainOsc.frequency.setValueAtTime(baseFreq, now);
        mainOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, now + duration);
        
        mainFilter.type = 'lowpass';
        mainFilter.frequency.setValueAtTime(800, now);
        mainFilter.frequency.exponentialRampToValueAtTime(200, now + duration);
        
        mainOsc.connect(mainFilter);
        mainFilter.connect(mainGain);
        mainGain.connect(this.context.destination);
        
        mainGain.gain.setValueAtTime(volume, now);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        mainOsc.start(now);
        mainOsc.stop(now + duration);
        
        // Bruit d'explosion (debris/crackling)
        const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            const decay = 1 - (i / noiseData.length);
            noiseData[i] = (Math.random() * 2 - 1) * decay * (intense ? 0.6 : 0.3);
        }
        
        const noiseSource = this.context.createBufferSource();
        const noiseGain = this.context.createGain();
        const noiseFilter = this.context.createBiquadFilter();
        
        noiseSource.buffer = noiseBuffer;
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(300, now);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.context.destination);
        
        noiseGain.gain.setValueAtTime(volume * 0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6);
        
        noiseSource.start(now);
        noiseSource.stop(now + duration);
        
        // Sons métalliques secondaires pour explosion intense
        if (intense) {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    const metalOsc = this.context.createOscillator();
                    const metalGain = this.context.createGain();
                    const metalFilter = this.context.createBiquadFilter();
                    
                    const freq = 400 + Math.random() * 800;
                    metalOsc.frequency.setValueAtTime(freq, this.context.currentTime);
                    metalOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.context.currentTime + 0.2);
                    metalOsc.type = 'triangle';
                    
                    metalFilter.type = 'bandpass';
                    metalFilter.frequency.setValueAtTime(freq, this.context.currentTime);
                    metalFilter.Q.value = 5;
                    
                    metalOsc.connect(metalFilter);
                    metalFilter.connect(metalGain);
                    metalGain.connect(this.context.destination);
                    
                    metalGain.gain.setValueAtTime(volume * 0.2, this.context.currentTime);
                    metalGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
                    
                    metalOsc.start();
                    metalOsc.stop(this.context.currentTime + 0.2);
                }, i * 50);
            }
        }
    },
    
    playTeleportSound({
        duration = 1.0,
        volume = 0.15
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son de téléportation principal (sweep descendant puis montant)
        const mainOsc = this.context.createOscillator();
        const mainGain = this.context.createGain();
        const mainFilter = this.context.createBiquadFilter();
        
        mainOsc.type = 'sine';
        mainOsc.frequency.setValueAtTime(800, now);
        mainOsc.frequency.exponentialRampToValueAtTime(200, now + duration * 0.3);
        mainOsc.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.7);
        mainOsc.frequency.exponentialRampToValueAtTime(400, now + duration);
        
        mainFilter.type = 'bandpass';
        mainFilter.frequency.setValueAtTime(600, now);
        mainFilter.frequency.exponentialRampToValueAtTime(1000, now + duration);
        mainFilter.Q.value = 3;
        
        mainOsc.connect(mainFilter);
        mainFilter.connect(mainGain);
        mainGain.connect(this.context.destination);
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(volume, now + 0.1);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        mainOsc.start(now);
        mainOsc.stop(now + duration);
        
        // Harmoniques cristallines pour l'effet énergétique
        for (let h = 0; h < 3; h++) {
            const harmOsc = this.context.createOscillator();
            const harmGain = this.context.createGain();
            const harmFilter = this.context.createBiquadFilter();
            
            const freqMult = 1.5 + h * 0.7;
            harmOsc.type = 'triangle';
            harmOsc.frequency.setValueAtTime(600 * freqMult, now);
            harmOsc.frequency.exponentialRampToValueAtTime(1200 * freqMult, now + duration * 0.5);
            harmOsc.frequency.exponentialRampToValueAtTime(800 * freqMult, now + duration);
            
            harmFilter.type = 'highpass';
            harmFilter.frequency.setValueAtTime(400, now);
            
            harmOsc.connect(harmFilter);
            harmFilter.connect(harmGain);
            harmGain.connect(this.context.destination);
            
            harmGain.gain.setValueAtTime(0, now);
            harmGain.gain.linearRampToValueAtTime(volume * 0.3 / (h + 1), now + 0.1);
            harmGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            
            harmOsc.start(now);
            harmOsc.stop(now + duration);
        }
        
        // Écho spatial pour effet de téléportation
        setTimeout(() => {
            const echoOsc = this.context.createOscillator();
            const echoGain = this.context.createGain();
            
            echoOsc.type = 'sine';
            echoOsc.frequency.setValueAtTime(1000, this.context.currentTime);
            echoOsc.frequency.exponentialRampToValueAtTime(500, this.context.currentTime + 0.3);
            
            echoOsc.connect(echoGain);
            echoGain.connect(this.context.destination);
            
            echoGain.gain.setValueAtTime(volume * 0.4, this.context.currentTime);
            echoGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
            
            echoOsc.start();
            echoOsc.stop(this.context.currentTime + 0.3);
        }, 400);
    },
    
    playNewWaveSound({
        duration = 2.0,
        volume = 0.2
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son héroïque montant pour nouvelle vague
        const mainOsc = this.context.createOscillator();
        const mainGain = this.context.createGain();
        const mainFilter = this.context.createBiquadFilter();
        
        mainOsc.type = 'sine';
        mainOsc.frequency.setValueAtTime(220, now); // La grave
        mainOsc.frequency.exponentialRampToValueAtTime(440, now + duration * 0.3); // La médium
        mainOsc.frequency.exponentialRampToValueAtTime(880, now + duration * 0.7); // La aigu
        mainOsc.frequency.exponentialRampToValueAtTime(660, now + duration); // Mi aigu (accord)
        
        mainFilter.type = 'lowpass';
        mainFilter.frequency.setValueAtTime(800, now);
        mainFilter.frequency.exponentialRampToValueAtTime(2000, now + duration);
        mainFilter.Q.value = 2;
        
        mainOsc.connect(mainFilter);
        mainFilter.connect(mainGain);
        mainGain.connect(this.context.destination);
        
        mainGain.gain.setValueAtTime(0, now);
        mainGain.gain.linearRampToValueAtTime(volume, now + 0.1);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        mainOsc.start(now);
        mainOsc.stop(now + duration);
        
        // Harmoniques pour effet orchestral
        for (let h = 0; h < 3; h++) {
            const harmOsc = this.context.createOscillator();
            const harmGain = this.context.createGain();
            
            const freqMult = [1.5, 2, 3][h]; // Quinte, octave, quinte supérieure
            harmOsc.type = 'triangle';
            harmOsc.frequency.setValueAtTime(220 * freqMult, now);
            harmOsc.frequency.exponentialRampToValueAtTime(880 * freqMult, now + duration * 0.7);
            harmOsc.frequency.exponentialRampToValueAtTime(660 * freqMult, now + duration);
            
            harmOsc.connect(harmGain);
            harmGain.connect(this.context.destination);
            
            harmGain.gain.setValueAtTime(0, now + 0.2);
            harmGain.gain.linearRampToValueAtTime(volume * 0.4 / (h + 1), now + 0.3);
            harmGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            
            harmOsc.start(now + 0.2);
            harmOsc.stop(now + duration);
        }
        
        // Effet de cymbale/gong en fin
        setTimeout(() => {
            const cymbalBuffer = this.context.createBuffer(1, this.context.sampleRate * 1.5, this.context.sampleRate);
            const cymbalData = cymbalBuffer.getChannelData(0);
            for (let i = 0; i < cymbalData.length; i++) {
                const decay = Math.exp(-i / (this.context.sampleRate * 0.8));
                cymbalData[i] = (Math.random() * 2 - 1) * decay * 0.3;
            }
            
            const cymbalSource = this.context.createBufferSource();
            const cymbalGain = this.context.createGain();
            const cymbalFilter = this.context.createBiquadFilter();
            
            cymbalSource.buffer = cymbalBuffer;
            cymbalFilter.type = 'highpass';
            cymbalFilter.frequency.setValueAtTime(1000, this.context.currentTime);
            
            cymbalSource.connect(cymbalFilter);
            cymbalFilter.connect(cymbalGain);
            cymbalGain.connect(this.context.destination);
            
            cymbalGain.gain.setValueAtTime(volume * 0.6, this.context.currentTime);
            cymbalGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 1.5);
            
            cymbalSource.start();
            cymbalSource.stop(this.context.currentTime + 1.5);
        }, 1200);
    },
    
    playSound(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.enabled || !this.context) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    },
    
    playSoundEffect(type) {
        switch(type) {
            case 'shoot': {
                // Tir laser/projetile: sweep de fréquence avec filtrage
                this.playLaser({ freqStart: 1400, freqEnd: 500, duration: 0.12, volume: 0.12, type: 'sawtooth', noise: true });
                break;
            }
            case 'enemyHit':
                this.playSound(300, 0.2, 'sawtooth', 0.08); 
                break;
            case 'playerHit':
                this.playPlayerHitSound();
                break;
            case 'playerDeath':
                this.playPlayerDeathSound();
                break;
            case 'scoutDestroyed':
                this.playScoutDestroyedSound();
                break;
            case 'interceptorDestroyed':
                this.playInterceptorDestroyedSound();
                break;
            case 'crusherDestroyed':
                this.playCrusherDestroyedSound();
                break;
            case 'shredderDestroyed':
                this.playShredderDestroyedSound();
                break;
            case 'orbHit':
                this.playOrbHitSound();
                break;
            case 'orbShoot':
                this.playOrbShootSound();
                break;
            case 'explosion':
                this.playExplosionSound();
                break;
            case 'missile':
                this.playMissileSound();
                break;
            case 'scoutSpawn':
                this.playScoutSpawnSound();
                break;
            case 'interceptorSpawn':
                this.playInterceptorSpawnSound();
                break;
            case 'crusherSpawn':
                this.playCrusherSpawnSound();
                break;
            case 'shredderSpawn':
                this.playShredderSpawnSound();
                break;
            case 'enemySpawn':
                this.playEnemySpawnSound();
                break;
            case 'lootBoxSpawn':
                this.playLootBoxSpawnSound();
                break;
            case 'lootBoxCollect':
                this.playLootBoxCollectSound();
                break;
            case 'nukeExplosion':
                this.playNukeExplosionSound();
                break;
            case 'giantMagnet':
                this.playGiantMagnetSound();
                break;
            case 'gemCollect':
                this.playCoinSound();
                break;
            case 'teleport':
                this.playTeleportSound();
                break;
        }
    },
    
    // Sons spécialisés pour chaque type d'ennemi détruit
    playScoutDestroyedSound({
        duration = 0.3,
        volume = 0.15
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son aigu et rapide pour le scout
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    playInterceptorDestroyedSound({
        duration = 0.4,
        volume = 0.18
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son rapide avec effet de vitesse
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(300, now + duration * 0.7);
        osc.frequency.exponentialRampToValueAtTime(100, now + duration);
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    playCrusherDestroyedSound({
        duration = 0.8,
        volume = 0.25
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son grave et puissant pour le tank
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + duration * 0.6);
        osc.frequency.exponentialRampToValueAtTime(40, now + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + duration);
        filter.Q.value = 5;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
        
        // Explosion secondaire
        setTimeout(() => {
            const subOsc = this.context.createOscillator();
            const subGain = this.context.createGain();
            
            subOsc.type = 'square';
            subOsc.frequency.setValueAtTime(100, this.context.currentTime);
            subOsc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
            
            subOsc.connect(subGain);
            subGain.connect(this.context.destination);
            
            subGain.gain.setValueAtTime(volume * 0.6, this.context.currentTime);
            subGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.3);
            
            subOsc.start();
            subOsc.stop(this.context.currentTime + 0.3);
        }, 200);
    },
    
    playShredderDestroyedSound({
        duration = 0.6,
        volume = 0.2
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son chaotique avec multiples fréquences
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const osc = this.context.createOscillator();
                const gain = this.context.createGain();
                const filter = this.context.createBiquadFilter();
                
                osc.type = 'sawtooth';
                const baseFreq = 300 + i * 150;
                osc.frequency.setValueAtTime(baseFreq, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, this.context.currentTime + duration * 0.8);
                
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(baseFreq * 2, this.context.currentTime);
                filter.Q.value = 3;
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.context.destination);
                
                gain.gain.setValueAtTime(volume / 3, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration * 0.8);
                
                osc.start();
                osc.stop(this.context.currentTime + duration * 0.8);
            }, i * 50);
        }
    },
    
    playOrbHitSound({
        duration = 0.2,
        volume = 0.12
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son cristallin pour l'impact orbital
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    playPlayerHitSound({
        duration = 0.5,
        volume = 0.2
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son dramatique pour les dégâts du joueur
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + duration);
        filter.Q.value = 3;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    playPlayerDeathSound({
        duration = 2.0,
        volume = 0.25
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son dramatique et épique pour la mort du joueur
        
        // === SON PRINCIPAL - CHUTE DRAMATIQUE ===
        const mainOsc = this.context.createOscillator();
        const mainGain = this.context.createGain();
        const mainFilter = this.context.createBiquadFilter();
        
        mainOsc.type = 'sawtooth';
        mainOsc.frequency.setValueAtTime(300, now);
        mainOsc.frequency.exponentialRampToValueAtTime(80, now + duration * 0.6);
        mainOsc.frequency.exponentialRampToValueAtTime(40, now + duration);
        
        mainFilter.type = 'lowpass';
        mainFilter.frequency.setValueAtTime(800, now);
        mainFilter.frequency.exponentialRampToValueAtTime(200, now + duration);
        mainFilter.Q.value = 5;
        
        mainOsc.connect(mainFilter);
        mainFilter.connect(mainGain);
        mainGain.connect(this.context.destination);
        
        mainGain.gain.setValueAtTime(volume, now);
        mainGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        mainOsc.start(now);
        mainOsc.stop(now + duration);
        
        // === SON SECONDAIRE - EXPLOSION INITIALE ===
        const explosionOsc = this.context.createOscillator();
        const explosionGain = this.context.createGain();
        
        explosionOsc.type = 'square';
        explosionOsc.frequency.setValueAtTime(150, now);
        explosionOsc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        
        explosionOsc.connect(explosionGain);
        explosionGain.connect(this.context.destination);
        
        explosionGain.gain.setValueAtTime(volume * 0.8, now);
        explosionGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        explosionOsc.start(now);
        explosionOsc.stop(now + 0.3);
        
        // === HARMONIQUES LUGUBRES ===
        for (let h = 0; h < 3; h++) {
            setTimeout(() => {
                const harmOsc = this.context.createOscillator();
                const harmGain = this.context.createGain();
                const harmFilter = this.context.createBiquadFilter();
                
                const baseFreq = 100 - h * 20; // Descendre en fréquence
                harmOsc.type = 'triangle';
                harmOsc.frequency.setValueAtTime(baseFreq, this.context.currentTime);
                harmOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.3, this.context.currentTime + 1.2);
                
                harmFilter.type = 'highpass';
                harmFilter.frequency.setValueAtTime(50, this.context.currentTime);
                
                harmOsc.connect(harmFilter);
                harmFilter.connect(harmGain);
                harmGain.connect(this.context.destination);
                
                harmGain.gain.setValueAtTime(0, this.context.currentTime);
                harmGain.gain.linearRampToValueAtTime(volume * 0.2 / (h + 1), this.context.currentTime + 0.2);
                harmGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 1.2);
                
                harmOsc.start();
                harmOsc.stop(this.context.currentTime + 1.2);
            }, h * 200);
        }
        
        // === BRUIT D'EXPLOSION ET DÉBRIS ===
        const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration * 0.7, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            const decay = 1 - (i / noiseData.length);
            noiseData[i] = (Math.random() * 2 - 1) * decay * 0.5;
        }
        
        const noiseSource = this.context.createBufferSource();
        const noiseGain = this.context.createGain();
        const noiseFilter = this.context.createBiquadFilter();
        
        noiseSource.buffer = noiseBuffer;
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(200, now);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.context.destination);
        
        noiseGain.gain.setValueAtTime(volume * 0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.7);
        
        noiseSource.start(now);
        noiseSource.stop(now + duration * 0.7);
        
        // === ÉCHO FINAL DRAMATIQUE ===
        setTimeout(() => {
            const echoOsc = this.context.createOscillator();
            const echoGain = this.context.createGain();
            
            echoOsc.type = 'sine';
            echoOsc.frequency.setValueAtTime(200, this.context.currentTime);
            echoOsc.frequency.exponentialRampToValueAtTime(100, this.context.currentTime + 0.8);
            
            echoOsc.connect(echoGain);
            echoGain.connect(this.context.destination);
            
            echoGain.gain.setValueAtTime(volume * 0.3, this.context.currentTime);
            echoGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.8);
            
            echoOsc.start();
            echoOsc.stop(this.context.currentTime + 0.8);
        }, 800);
    },
    
    playOrbShootSound({
        duration = 0.15,
        volume = 0.1
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son cristallin et rapide pour le tir d'orbe
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    playMissileSound({
        duration = 0.8,
        volume = 0.15
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son de missile avec effet doppler
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(300, now + duration * 0.7);
        osc.frequency.exponentialRampToValueAtTime(150, now + duration);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.Q.value = 3;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    // === SONS DE SPAWN D'ENNEMIS ===
    
    playScoutSpawnSound({
        duration = 0.4,
        volume = 0.12
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son de téléportation/matérialisation aigu pour le scout
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration * 0.5);
        osc.frequency.exponentialRampToValueAtTime(600, now + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + duration * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    playInterceptorSpawnSound({
        duration = 0.5,
        volume = 0.14
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son d'interceptor avec effet de vitesse
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + duration * 0.6);
        osc.frequency.exponentialRampToValueAtTime(400, now + duration);
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + duration * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    playCrusherSpawnSound({
        duration = 0.8,
        volume = 0.18
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son grave et menaçant pour le tank
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(120, now + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + duration);
        filter.Q.value = 4;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + duration * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    playShredderSpawnSound({
        duration = 0.6,
        volume = 0.16
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son chaotique multi-fréquences pour le shredder
        for (let i = 0; i < 3; i++) {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            const filter = this.context.createBiquadFilter();
            
            const baseFreq = 200 + i * 100;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now +	duration * 0.7);
            osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + duration);
            
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(baseFreq * 2, now);
            filter.Q.value = 2;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.context.destination);
            
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(volume / 3, now + i * 0.1 + duration * 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            
            osc.start(now + i * 0.1);
            osc.stop(now + duration);
        }
    },
    
    playEnemySpawnSound({
        duration = 0.5,
        volume = 0.12
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son générique de spawn
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + duration * 0.6);
        osc.frequency.exponentialRampToValueAtTime(450, now + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + duration * 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
    },
    
    // === SONS DE LOOT BOXES ===
    
    playLootBoxSpawnSound({
        duration = 0.8,
        volume = 0.18
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son magique et mystérieux pour l'apparition de loot box
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration * 0.4);
        osc.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.7);
        osc.frequency.exponentialRampToValueAtTime(600, now + duration);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(1200, now + duration);
        filter.Q.value = 4;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + duration * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
        
        // Harmonique cristalline
        const harmOsc = this.context.createOscillator();
        const harmGain = this.context.createGain();
        
        harmOsc.type = 'sine';
        harmOsc.frequency.setValueAtTime(1200, now);
        harmOsc.frequency.exponentialRampToValueAtTime(2400, now + duration);
        
        harmOsc.connect(harmGain);
        harmGain.connect(this.context.destination);
        
        harmGain.gain.setValueAtTime(0, now + duration * 0.3);
        harmGain.gain.linearRampToValueAtTime(volume * 0.3, now + duration * 0.5);
        harmGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        harmOsc.start(now + duration * 0.3);
        harmOsc.stop(now + duration);
    },
    
    playLootBoxCollectSound({
        duration = 1.0,
        volume = 0.2
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son de collection épique et satisfaisant
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + duration * 0.3);
        osc.frequency.exponentialRampToValueAtTime(800, now + duration);
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
        
        // Accord majeur pour l'effet de récompense
        const chordFreqs = [800, 1000, 1200]; // Accord de Do majeur
        chordFreqs.forEach((freq, index) => {
            setTimeout(() => {
                const chordOsc = this.context.createOscillator();
                const chordGain = this.context.createGain();
                
                chordOsc.type = 'triangle';
                chordOsc.frequency.setValueAtTime(freq, this.context.currentTime);
                chordOsc.frequency.exponentialRampToValueAtTime(freq * 0.8, this.context.currentTime + 0.4);
                
                chordOsc.connect(chordGain);
                chordGain.connect(this.context.destination);
                
                chordGain.gain.setValueAtTime(volume * 0.4, this.context.currentTime);
                chordGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);
                
                chordOsc.start();
                chordOsc.stop(this.context.currentTime + 0.4);
            }, index * 100);
        });
    },
    
    playNukeExplosionSound({
        duration = 2.0,
        volume = 0.3
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son d'explosion nucléaire massif et dramatique
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + duration * 0.3);
        osc.frequency.exponentialRampToValueAtTime(20, now + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + duration);
        filter.Q.value = 8;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
        
        // Bruit d'explosion
        const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            const decay = 1 - (i / noiseData.length);
            noiseData[i] = (Math.random() * 2 - 1) * decay * 0.8;
        }
        
        const noiseSource = this.context.createBufferSource();
        const noiseGain = this.context.createGain();
        const noiseFilter = this.context.createBiquadFilter();
        
        noiseSource.buffer = noiseBuffer;
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(100, now);
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.context.destination);
        
        noiseGain.gain.setValueAtTime(volume * 0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
        
        noiseSource.start(now);
        noiseSource.stop(now + duration);
    },
    
    playGiantMagnetSound({
        duration = 1.5,
        volume = 0.16
    } = {}) {
        if (!this.enabled || !this.context) return;
        const now = this.context.currentTime;
        
        // Son magnétique avec effet de succion
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        const filter = this.context.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + duration * 0.6);
        osc.frequency.exponentialRampToValueAtTime(300, now + duration);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.linearRampToValueAtTime(800, now + duration);
        filter.Q.value = 6;
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.context.destination);
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + duration * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.start(now);
        osc.stop(now + duration);
        
        // Effet de "whoosh" magnétique
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const whooshOsc = this.context.createOscillator();
                const whooshGain = this.context.createGain();
                
                whooshOsc.type = 'triangle';
                whooshOsc.frequency.setValueAtTime(400 + i * 200, this.context.currentTime);
                whooshOsc.frequency.exponentialRampToValueAtTime(200 + i * 100, this.context.currentTime + 0.2);
                
                whooshOsc.connect(whooshGain);
                whooshGain.connect(this.context.destination);
                
                whooshGain.gain.setValueAtTime(volume * 0.3, this.context.currentTime);
                whooshGain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.2);
                
                whooshOsc.start();
                whooshOsc.stop(this.context.currentTime + 0.2);
            }, i * 150);
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
    }
};