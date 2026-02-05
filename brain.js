const brain = {
    knowledgeBase: (typeof knowledgeData !== 'undefined') ? knowledgeData : {},

    dynamicCommands: {
        "saat kaç": () => `Şu an saat ${new Date().toLocaleTimeString('tr-TR')}`,
        "tarih ne": () => `Bugün ${new Date().toLocaleDateString('tr-TR')}`,
    },

    fuse: null,

    // Words meaning nothing or confusing the bot (Expanded)
    stopWords: [
        "en", "bir", "ve", "mi", "mu", "mı", "mü", "da", "de", "ise", "ki",
        "bu", "şu", "o"

    ],

    // Fallback responses when no match is found
    fallbackResponses: [
        "Bunu tam anlayamadım, tekrar eder misin?",
        "Ne demek istediğini çözemedim, belki farklı sorabilirsin?",
        "Hmm, bu konuda henüz bir bilgim yok.",
        "Sanırım seni yanlış anlıyorum, daha açık olabilir misin?",
        "Buna verecek bir cevabım şimdilik yok maalesef."
    ],

    initFuse: function () {
        // Prepare data for Fuse.js by storing both original and cleaned versions
        const dataList = Object.keys(this.knowledgeBase).map(key => ({
            question: key,
            // Clean stop words and punctuation for better search quality
            searchKey: this.cleanForSearch(key),
            answer: this.knowledgeBase[key]
        }));

        const options = {
            includeScore: true,
            keys: ['searchKey', 'question'], // Search in two fields
            threshold: 0.35, // STRICTER CHECK (0.0 = Exact Match, 1.0 = Match Anything)
            minMatchCharLength: 2,
            location: 0,
            distance: 100,
            ignoreLocation: true
        };

        this.fuse = new Fuse(dataList, options);
    },

    // Helper function to purify text for search
    cleanForSearch: function (text) {
        return text.toLowerCase()
            .replace(/[?.!,';:"]/g, "") // Remove punctuation
            .split(/\s+/)
            .filter(word => !this.stopWords.includes(word)) // Remove unnecessary words
            .join(" ")
            .trim();
    },

    getRandomFallback: function () {
        return this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
    },

    getReply: function (message) {
        if (!this.fuse) this.initFuse();

        // 1. PREPARE INPUT
        const rawInput = message.toLowerCase().trim();
        const cleanInput = rawInput.replace(/[?.!,]/g, "");

        // 2. EXACT MATCH CHECK (FAST AND ACCURATE)
        if (this.knowledgeBase[rawInput]) return this.knowledgeBase[rawInput];
        if (this.knowledgeBase[cleanInput]) return this.knowledgeBase[cleanInput];

        // 3. DYNAMIC COMMANDS
        for (let key in this.dynamicCommands) {
            if (cleanInput.includes(key)) return this.dynamicCommands[key]();
        }

        // 4. MATHEMATICAL OPERATIONS
        const mathRegex = /^[0-9+\-*\/.()%\s]+$/;
        if (mathRegex.test(message) && /[+\-*\/%]/.test(message)) {
            try {
                const result = new Function('return ' + message)();
                return `İşlemin sonucu: ${result}`;
            } catch (e) { return "Hesaplamada bir hata oluştu."; }
        }

        // 5. SMART SEARCH WITH FUSE.JS
        const searchInput = this.cleanForSearch(message);

        // If search text is too short (only stop words), do not search
        if (searchInput.length < 2) return this.getRandomFallback();

        const results = this.fuse.search(searchInput);

        if (results.length > 0) {
            const bestMatch = results[0];

            // Print score to console for debugging (Visible with F12)
            console.log(`Eşleşme: "${bestMatch.item.question}" | Skor: ${bestMatch.score}`);

            // 1. EXACT MATCH (Score <= 0.35)
            // Bot is very sure, returns answer directly.
            if (bestMatch.score <= 0.35) {
                return bestMatch.item.answer;
            }

            // 2. CLOSE GUESS / SUGGESTION (0.35 < Score <= 0.60)
            // Bot is not fully sure but guesses. Asks "Did you mean this?".
            if (bestMatch.score <= 0.60) {
                const suggestions = results
                    .filter(r => r.score <= 0.60) // Get only relevant ones
                    .slice(0, 3) // Select top 3
                    .map(r => r.item.question); // Get only questions

                let response = "Bunu mu demek istediniz?";
                suggestions.forEach(question => {
                    response += `\n➤ ${question}`;
                });

                return response;
            }
        }

        // 6. IF NOTHING FOUND, RETURN FALLBACK
        return this.getRandomFallback();
    }
};
