// Localization module for Robot Survival
const dictionaries = {
    en: {
        // Menu principal
        menu_title: 'ROBOT SURVIVAL',
        menu_subtitle: 'Retro Survival Arena',
        menu_start: 'Start Mission',
        menu_highscores: 'View High Scores',
        menu_feature_targeting_title: 'Auto-Targeting',
        menu_feature_targeting_desc: 'Advanced AI targeting system locks onto the nearest threat',
        menu_feature_upgrades_title: 'Power Upgrades',
        menu_feature_upgrades_desc: 'Collect gems to unlock devastating abilities and orbital shields',
        menu_feature_enemies_title: 'Enemy Variants',
        menu_feature_enemies_desc: 'Face off against Fast Scouts, Heavy Tanks, and Splitter Units',
        menu_feature_resurrection_title: 'Resurrection',
        menu_feature_resurrection_desc: 'Death is not the end - revive with enhanced abilities',

        // HUD
        hud_score: 'Score',
        hud_wave: 'Wave',
        hud_lives: 'Lives',
        hud_gems: 'Gems',
        hud_next_upgrade: 'Next Upgrade',
        hud_resurrections: 'Resurrections',
        hud_mode_wasd: 'MODE: WASD',
        hud_mode_mouse: 'MODE: MOUSE',
        hud_combo: 'COMBO',

        // Game Over
        gameover_title: 'MISSION FAILED',
        gameover_score: 'SCORE',
        gameover_kills: 'KILLS',
        gameover_wave: 'WAVE',
        gameover_time: 'TIME',
        gameover_best_combo: 'BEST COMBO',
        gameover_callsign: 'ENTER YOUR CALL SIGN',
        gameover_placeholder: 'ACE PILOT',
        gameover_submit: 'SUBMIT',
        gameover_skip: 'SKIP',
        gameover_hint: 'Press ENTER to submit, ESC to skip',
        gameover_name_required: 'Name required!',
        gameover_submitting: 'Submitting...',
        gameover_saved: 'Saved!',
        gameover_error: 'Error - Retry',
        gameover_prompt: 'Press SPACE to restart or ESC for main menu',
        gameover_enter_name: 'Enter your name for the leaderboard:',

        // Wave
        wave_title: 'WAVE {wave}',
        wave_hostiles: 'INCOMING HOSTILES',
        wave_stats: 'Enemies: {count} | Difficulty: {diff}',
        wave_progress: 'Wave {wave}',
        wave_spawned: '{spawned}/{max} spawned',
        wave_upgrades: 'Upgrades {count}/2',
        difficulty_easy: 'EASY',
        difficulty_medium: 'MEDIUM',
        difficulty_hard: 'HARD',
        difficulty_extreme: 'EXTREME',

        // Upgrades
        upgrade_levelup: 'LEVEL UP!',
        upgrade_choose: 'Press 1, 2, 3 or click to choose',
        upgrade_fire_rate_name: 'Fire Rate+',
        upgrade_fire_rate_desc: 'Shoot faster ({current}\u2192{next} frames, max: {max})',
        upgrade_speed_name: 'Speed+',
        upgrade_speed_desc: 'Move faster ({current}\u2192{next}, max: {max})',
        upgrade_bullet_speed_name: 'Bullet Speed+',
        upgrade_bullet_speed_desc: 'Bullets fly faster ({current}\u2192{next}, max: {max})',
        upgrade_range_name: 'Range+',
        upgrade_range_desc: 'Shoot further ({current}\u2192{next}, max: {max})',
        upgrade_magnet_name: 'Magnet Upgrade',
        upgrade_magnet_desc: 'Attract gems from further away ({current}\u2192{next}, max: {max})',
        upgrade_triple_name: 'Triple Shot',
        upgrade_triple_desc: 'Fire 3 bullets at once (UNLOCK)',
        upgrade_shotgun_name: 'Shotgun Blast',
        upgrade_shotgun_desc: 'Spread shot pellets (UNLOCK)',
        upgrade_homing_name: 'Homing Missiles',
        upgrade_homing_desc: 'Heat-seeking rockets (UNLOCK)',
        upgrade_explosive_name: 'Explosive Cannon',
        upgrade_explosive_desc: 'Area damage blasts (UNLOCK)',
        upgrade_orbital_name: 'Orbital Shield',
        upgrade_orbital_desc: 'Add protective orb ({current}\u2192{next}, max: {max})',
        upgrade_orb_speed_name: 'Orb Velocity+',
        upgrade_orb_speed_desc: 'Orbs rotate faster ({current}\u2192{next}, max: {max})',
        upgrade_armed_orbs_name: 'Armed Orbs',
        upgrade_armed_orbs_desc: 'Orbs can shoot enemies (UNLOCK)',
        upgrade_health_name: 'Health+',
        upgrade_health_desc: 'Gain extra life ({current}\u2192{next})',
        upgrade_gem_bonus_name: '\uD83D\uDC8E Gem Bonus',
        upgrade_gem_bonus_desc: 'Receive extra gems',
        upgrade_gem_windfall_name: '\uD83D\uDC8E Gem Windfall',
        upgrade_gem_windfall_desc: 'Receive massive gem bonus',
        upgrade_full_health_name: '\uD83D\uDC8E Full Health',
        upgrade_full_health_desc: 'Restore all lives',
        upgrade_gems_name: '\uD83D\uDC8E {amount} Gems',
        upgrade_gems_desc: 'Extra currency bonus',

        // Revive upgrades
        revive_phoenix_name: 'Phoenix Protocol',
        revive_phoenix_desc: 'Massive fire rate + flame bullets',
        revive_phoenix_benefit: 'Fire rate boost + bullet speed',
        revive_ghost_name: 'Ghost Mode',
        revive_ghost_desc: 'Extended invincibility + speed boost',
        revive_ghost_benefit: '12 seconds invulnerable + speed',
        revive_berserker_name: 'Berserker Rage',
        revive_berserker_desc: 'Orbital shields + massive damage',
        revive_berserker_benefit: 'Max orbs + +50% damage boost',
        revive_gem_x2_name: '\uD83D\uDC8E Gem Multiplier x2',
        revive_gem_x2_desc: 'Double all gem gains permanently',
        revive_gem_x2_benefit: 'x2 gem multiplier for this run',
        revive_gem_x3_name: '\uD83D\uDC8E Gem Windfall x3',
        revive_gem_x3_desc: 'Triple gem gains + massive bonus',
        revive_gem_x3_benefit: 'x3 gem multiplier + windfall bonus',
        revive_gem_x5_name: '\uD83D\uDC8E Gem Mastery x5',
        revive_gem_x5_desc: 'Ultimate gem multiplier + mega bonus',
        revive_gem_x5_benefit: 'x5 gem multiplier + ultimate bonus',

        // Pause
        pause_title: 'PAUSED',
        pause_resume: 'Press P to resume',

        // Resurrection
        revive_title: 'RESURRECTION PROTOCOL',
        revive_prompt: 'Choose your enhanced abilities:',
        revive_instructions: 'Press 1, 2, or 3 to choose \u2022 4 to skip resurrection',

        // High Scores
        hs_title: 'High Scores',
        hs_music_on: 'Music: ON',
        hs_music_off: 'Music: OFF',
        hs_volume: 'Volume',
        hs_players: 'players',
        hs_record: 'Record',
        hs_rank: '#',
        hs_name: 'Name',
        hs_score: 'Score',
        hs_kills: 'Kills',
        hs_time: 'Time',
        hs_date: 'Date',
        hs_back: 'Back to Game',
        hs_error: 'Error: {message}',

        // Instructions
        instructions_text: 'WASD: Move | M: Toggle Mouse Mode | S: Toggle Sound | 1,2,3: Choose upgrades | SPACE: Restart',
    },
    fr: {
        // Menu principal
        menu_title: 'ROBOT SURVIVAL',
        menu_subtitle: 'Ar\u00E8ne de Survie R\u00E9tro',
        menu_start: 'Lancer la Mission',
        menu_highscores: 'Voir les Meilleurs Scores',
        menu_feature_targeting_title: 'Auto-Ciblage',
        menu_feature_targeting_desc: 'Le syst\u00E8me de ciblage IA avance verrouille la menace la plus proche',
        menu_feature_upgrades_title: 'Am\u00E9liorations',
        menu_feature_upgrades_desc: 'Collectez des gemmes pour d\u00E9bloquer des capacit\u00E9s d\u00E9vastatrices et des boucliers orbitaux',
        menu_feature_enemies_title: 'Variantes d\'Ennemis',
        menu_feature_enemies_desc: 'Affrontez des \u00C9claireurs rapides, des Tanks lourds et des Unit\u00E9s Fragmenteuses',
        menu_feature_resurrection_title: 'R\u00E9surrection',
        menu_feature_resurrection_desc: 'La mort n\'est pas la fin \u2013 revenez avec des capacit\u00E9s am\u00E9lior\u00E9es',

        // HUD
        hud_score: 'Score',
        hud_wave: 'Vague',
        hud_lives: 'Vies',
        hud_gems: 'Gemmes',
        hud_next_upgrade: 'Prochaine Am\u00E9lio.',
        hud_resurrections: 'R\u00E9surrections',
        hud_mode_wasd: 'MODE : ZQSD',
        hud_mode_mouse: 'MODE : SOURIS',
        hud_combo: 'COMBO',

        // Game Over
        gameover_title: 'MISSION \u00C9CHOU\u00C9E',
        gameover_score: 'SCORE',
        gameover_kills: '\u00C9LIMINATIONS',
        gameover_wave: 'VAGUE',
        gameover_time: 'TEMPS',
        gameover_best_combo: 'MEILLEUR COMBO',
        gameover_callsign: 'ENTREZ VOTRE NOM DE CODE',
        gameover_placeholder: 'AS DU PILOTAGE',
        gameover_submit: 'ENVOYER',
        gameover_skip: 'PASSER',
        gameover_hint: 'ENTR\u00C9E pour envoyer, \u00C9CHAP pour passer',
        gameover_name_required: 'Nom requis !',
        gameover_submitting: 'Envoi en cours...',
        gameover_saved: 'Enregistr\u00E9 !',
        gameover_error: 'Erreur - R\u00E9essayer',
        gameover_prompt: 'ESPACE pour recommencer, \u00C9CHAP pour le menu',
        gameover_enter_name: 'Entrez votre nom pour le classement :',

        // Wave
        wave_title: 'VAGUE {wave}',
        wave_hostiles: 'HOSTILES EN APPROCHE',
        wave_stats: 'Ennemis : {count} | Difficult\u00E9 : {diff}',
        wave_progress: 'Vague {wave}',
        wave_spawned: '{spawned}/{max} apparus',
        wave_upgrades: 'Am\u00E9liorations {count}/2',
        difficulty_easy: 'FACILE',
        difficulty_medium: 'MOYEN',
        difficulty_hard: 'DIFFICILE',
        difficulty_extreme: 'EXTR\u00CAME',

        // Upgrades
        upgrade_levelup: 'NIVEAU SUP\u00C9RIEUR !',
        upgrade_choose: 'Appuyez 1, 2, 3 ou cliquez pour choisir',
        upgrade_fire_rate_name: 'Cadence+',
        upgrade_fire_rate_desc: 'Tir plus rapide ({current}\u2192{next} frames, max : {max})',
        upgrade_speed_name: 'Vitesse+',
        upgrade_speed_desc: 'D\u00E9placement plus rapide ({current}\u2192{next}, max : {max})',
        upgrade_bullet_speed_name: 'Vitesse Balle+',
        upgrade_bullet_speed_desc: 'Balles plus rapides ({current}\u2192{next}, max : {max})',
        upgrade_range_name: 'Port\u00E9e+',
        upgrade_range_desc: 'Tir plus loin ({current}\u2192{next}, max : {max})',
        upgrade_magnet_name: 'Aimant Am\u00E9lior\u00E9',
        upgrade_magnet_desc: 'Attire les gemmes de plus loin ({current}\u2192{next}, max : {max})',
        upgrade_triple_name: 'Triple Tir',
        upgrade_triple_desc: 'Tire 3 balles \u00E0 la fois (D\u00C9BLOCAGE)',
        upgrade_shotgun_name: 'Tir \u00E0 Pompe',
        upgrade_shotgun_desc: 'Dispersion de projectiles (D\u00C9BLOCAGE)',
        upgrade_homing_name: 'Missiles \u00E0 T\u00EAte Chercheuse',
        upgrade_homing_desc: 'Roquettes autoguid\u00E9es (D\u00C9BLOCAGE)',
        upgrade_explosive_name: 'Canon Explosif',
        upgrade_explosive_desc: 'D\u00E9g\u00E2ts de zone (D\u00C9BLOCAGE)',
        upgrade_orbital_name: 'Bouclier Orbital',
        upgrade_orbital_desc: 'Ajoute un orbe protecteur ({current}\u2192{next}, max : {max})',
        upgrade_orb_speed_name: 'Vitesse Orbe+',
        upgrade_orb_speed_desc: 'Les orbes tournent plus vite ({current}\u2192{next}, max : {max})',
        upgrade_armed_orbs_name: 'Orbes Arm\u00E9s',
        upgrade_armed_orbs_desc: 'Les orbes peuvent tirer sur les ennemis (D\u00C9BLOCAGE)',
        upgrade_health_name: 'Vie+',
        upgrade_health_desc: 'Gagnez une vie suppl\u00E9mentaire ({current}\u2192{next})',
        upgrade_gem_bonus_name: '\uD83D\uDC8E Bonus Gemmes',
        upgrade_gem_bonus_desc: 'Recevez des gemmes suppl\u00E9mentaires',
        upgrade_gem_windfall_name: '\uD83D\uDC8E Pactole de Gemmes',
        upgrade_gem_windfall_desc: 'Recevez un bonus massif de gemmes',
        upgrade_full_health_name: '\uD83D\uDC8E Vie Compl\u00E8te',
        upgrade_full_health_desc: 'Restaure toutes les vies',
        upgrade_gems_name: '\uD83D\uDC8E {amount} Gemmes',
        upgrade_gems_desc: 'Bonus de monnaie suppl\u00E9mentaire',

        // Revive upgrades
        revive_phoenix_name: 'Protocole Ph\u00E9nix',
        revive_phoenix_desc: 'Cadence massive + balles enflamm\u00E9es',
        revive_phoenix_benefit: 'Boost cadence + vitesse balles',
        revive_ghost_name: 'Mode Fant\u00F4me',
        revive_ghost_desc: 'Invincibilit\u00E9 prolong\u00E9e + boost vitesse',
        revive_ghost_benefit: '12 secondes invuln\u00E9rable + vitesse',
        revive_berserker_name: 'Rage du Berserker',
        revive_berserker_desc: 'Boucliers orbitaux + d\u00E9g\u00E2ts massifs',
        revive_berserker_benefit: 'Orbes max + +50% boost d\u00E9g\u00E2ts',
        revive_gem_x2_name: '\uD83D\uDC8E Multiplicateur x2',
        revive_gem_x2_desc: 'Double les gains de gemmes de fa\u00E7on permanente',
        revive_gem_x2_benefit: 'Multiplicateur x2 pour cette partie',
        revive_gem_x3_name: '\uD83D\uDC8E Pactole x3',
        revive_gem_x3_desc: 'Triple les gains de gemmes + bonus massif',
        revive_gem_x3_benefit: 'Multiplicateur x3 + bonus pactole',
        revive_gem_x5_name: '\uD83D\uDC8E Ma\u00EEtrise x5',
        revive_gem_x5_desc: 'Multiplicateur de gemmes ultime + m\u00E9ga bonus',
        revive_gem_x5_benefit: 'Multiplicateur x5 + bonus ultime',

        // Pause
        pause_title: 'PAUSE',
        pause_resume: 'Appuyez P pour reprendre',

        // Resurrection
        revive_title: 'PROTOCOLE DE R\u00C9SURRECTION',
        revive_prompt: 'Choisissez vos capacit\u00E9s am\u00E9lior\u00E9es :',
        revive_instructions: 'Appuyez 1, 2, ou 3 pour choisir \u2022 4 pour refuser',

        // High Scores
        hs_title: 'Meilleurs Scores',
        hs_music_on: 'Musique : ON',
        hs_music_off: 'Musique : OFF',
        hs_volume: 'Volume',
        hs_players: 'joueurs',
        hs_record: 'Record',
        hs_rank: '#',
        hs_name: 'Nom',
        hs_score: 'Score',
        hs_kills: '\u00C9lim.',
        hs_time: 'Temps',
        hs_date: 'Date',
        hs_back: 'Retour au jeu',
        hs_error: 'Erreur : {message}',

        // Instructions
        instructions_text: 'ZQSD : D\u00E9placer | M : Mode Souris | S : Son | 1,2,3 : Am\u00E9liorations | ESPACE : Recommencer',
    }
};

export const i18n = {
    _lang: null,

    init() {
        this._lang = localStorage.getItem('lang') || 'en';
    },

    getLang() {
        if (!this._lang) this.init();
        return this._lang;
    },

    setLang(lang) {
        if (lang !== 'en' && lang !== 'fr') return;
        this._lang = lang;
        localStorage.setItem('lang', lang);
        this.applyTranslations();
    },

    toggleLang() {
        this.setLang(this.getLang() === 'en' ? 'fr' : 'en');
    },

    t(key, params) {
        const lang = this.getLang();
        let str = dictionaries[lang]?.[key] ?? dictionaries.en?.[key] ?? key;
        if (params) {
            for (const [k, v] of Object.entries(params)) {
                str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
            }
        }
        return str;
    },

    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });
        // Update lang toggle buttons
        document.querySelectorAll('.lang-toggle').forEach(btn => {
            const other = this.getLang() === 'en' ? 'FR' : 'EN';
            btn.textContent = `${this.getLang().toUpperCase()} | ${other}`;
        });
    }
};
