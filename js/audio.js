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
            case 'playerHit': {
                // Son d'explosion spectaculaire pour la mort du joueur
                this.playExplosionSound({ 
                    baseFreq: 120, 
                    duration: 1.2, 
                    volume: 0.25, 
                    intense: true 
                });
                break;
            }
            case 'teleport': {
                // Son de téléportation dramatique
                this.playTeleportSound({ 
                    duration: 1.0, 
                    volume: 0.18 
                });
                break;
            }
            case 'gemCollect': {
                // Son de pièce de monnaie réaliste avec harmoniques
                this.playCoinSound({ 
                    baseFreq: 800, 
                    harmonics: [1, 1.5, 2.2, 3], 
                    duration: 0.35, 
                    volume: 0.12, 
                    metallic: true 
                });
                // Petit écho pour renforcer l'effet
                setTimeout(() => {
                    this.playCoinSound({ 
                        baseFreq: 600, 
                        harmonics: [1, 2], 
                        duration: 0.2, 
                        volume: 0.04, 
                        metallic: true 
                    });
                }, 80);
                break;
            }
            case 'upgrade':
                this.playSound(400, 0.2, 'sine', 0.1);
                setTimeout(() => this.playSound(600, 0.2, 'sine', 0.1), 100);
                setTimeout(() => this.playSound(800, 0.2, 'sine', 0.1), 200);
                break;
            case 'revive':
                this.playSound(200, 0.3, 'sine', 0.1);
                setTimeout(() => this.playSound(400, 0.3, 'sine', 0.1), 150);
                setTimeout(() => this.playSound(600, 0.3, 'sine', 0.1), 300);
                break;
        }
    },
    
    toggle() {
        this.enabled = !this.enabled;
    }
};