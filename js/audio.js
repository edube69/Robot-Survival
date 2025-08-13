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
            case 'shoot': 
                this.playSound(800, 0.1, 'square', 0.05); 
                break;
            case 'enemyHit': 
                this.playSound(300, 0.2, 'sawtooth', 0.08); 
                break;
            case 'playerHit': 
                this.playSound(150, 0.5, 'triangle', 0.15); 
                break;
            case 'gemCollect': 
                this.playSound(600, 0.15, 'sine', 0.06);
                setTimeout(() => this.playSound(800, 0.1, 'sine', 0.04), 50);
                break;
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