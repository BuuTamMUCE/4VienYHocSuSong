
/**
 * ERROR KNOWLEDGE BASE (FEEDBACK SYSTEM)
 * Simulates a database to store and retrieve learned error corrections.
 */

const FEEDBACK_STORAGE_KEY = 'VIEN_Y_HOC_FEEDBACK_DB_V2'; // Version bump for schema change

export interface FeedbackRecord {
    id: string;
    timestamp: number;
    userComplaint: string;
    originalPromptSnippet: string;
    preventativeRule: string; // The rule AI derived to prevent this in future
    mode: string; // Context/Feature scope (e.g., THUMBNAIL, SLIDE, MC_STUDIO)
}

/**
 * Saves a new feedback record.
 * This effectively "trains" the local system to avoid this error.
 * Now supports Context-Aware Learning (Scoped by Mode).
 */
export const learnFromError = (userComplaint: string, originalPrompt: string, preventativeRule: string, mode: string = 'GENERAL') => {
    try {
        const existingData = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        const records: FeedbackRecord[] = existingData ? JSON.parse(existingData) : [];
        
        const newRecord: FeedbackRecord = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            userComplaint,
            originalPromptSnippet: originalPrompt.substring(0, 100),
            preventativeRule,
            mode: mode
        };

        // Keep last 30 records to avoid bloat
        const updatedRecords = [newRecord, ...records].slice(0, 30);
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updatedRecords));
        console.log(`System learned new rule for [${mode}]:`, preventativeRule);
    } catch (e) {
        console.error("Failed to save feedback", e);
    }
};

/**
 * Retrieves the top learned rules to inject into the Prompt generation.
 * This acts as the "Preventative Measures" logic.
 * FILTERS rules based on the requested Mode to ensure isolation.
 */
export const getLearnedRules = (mode: string = 'GENERAL'): string => {
    try {
        const existingData = localStorage.getItem(FEEDBACK_STORAGE_KEY);
        if (!existingData) return "";

        const records: FeedbackRecord[] = JSON.parse(existingData);
        if (records.length === 0) return "";

        // Filter records by Mode (Exact match or GENERAL fallback if needed, but strict is better for this requirement)
        // We allow 'GENERAL' rules to apply everywhere if needed, but for now we strict scope.
        // Or we can say: Rules for 'THUMBNAIL' only apply to 'THUMBNAIL'.
        const scopedRecords = records.filter(r => r.mode === mode);

        // Deduplicate rules
        const rules = Array.from(new Set(scopedRecords.map(r => r.preventativeRule)));
        
        // Take top 5 most recent rules for this mode
        const topRules = rules.slice(0, 5);

        if (topRules.length === 0) return "";

        return `\n[LEARNED SAFETY PROTOCOLS FOR ${mode}]:\n${topRules.map((r, i) => `${i+1}. ${r}`).join('\n')}`;
    } catch (e) {
        return "";
    }
};
