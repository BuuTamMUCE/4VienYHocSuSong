
import { FALLBACK_EXCHANGE_RATE } from "../constants";

const CACHE_KEY = 'VIEN_Y_HOC_EXCHANGE_RATE';
const CACHE_TIMESTAMP_KEY = 'VIEN_Y_HOC_RATE_TIMESTAMP';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Hour

interface RateResponse {
    rates: {
        VND: number;
    };
    status: string;
}

export const getExchangeRate = async (): Promise<number> => {
    // 1. Check Cache
    const cachedRate = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (cachedRate && cachedTime) {
        const now = Date.now();
        const age = now - parseInt(cachedTime);
        if (age < CACHE_DURATION_MS) {
            console.log(`Using Cached Exchange Rate: 1 USD = ${cachedRate} VND`);
            return parseInt(cachedRate);
        }
    }

    // 2. Fetch Fresh Rate
    try {
        console.log("Fetching fresh exchange rate from open.er-api.com...");
        // Using Open Exchange Rates API (Free, no key required for base tier/public endpoint)
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        
        if (!response.ok) {
            throw new Error(`Exchange Rate API Error: ${response.status}`);
        }

        const data: RateResponse = await response.json();
        const vndRate = data.rates?.VND;

        if (vndRate) {
            const roundedRate = Math.ceil(vndRate);
            localStorage.setItem(CACHE_KEY, roundedRate.toString());
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
            console.log(`Updated Exchange Rate: 1 USD = ${roundedRate} VND`);
            return roundedRate;
        } else {
            throw new Error("VND rate not found in response");
        }

    } catch (e) {
        console.warn("Failed to fetch live exchange rate, using fallback.", e);
        // Fallback to constants if API fails
        return FALLBACK_EXCHANGE_RATE;
    }
};
