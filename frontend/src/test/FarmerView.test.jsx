import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FarmerView from '../components/FarmerView';

// Mock the API module
vi.mock('../services/api', () => ({
    uploadImage: vi.fn(),
    getBaseApiUrl: vi.fn(() => ''),
    createTelemetrySocket: vi.fn(() => ({
        close: vi.fn()
    }))
}));

import { uploadImage } from '../services/api';

describe('FarmerView UI Component Suite', () => {
    it('Renders the AgriNexus branding, subtitle, and photo capture area cleanly', () => {
        render(<FarmerView />);
        
        expect(screen.getByText('AgriNexus')).toBeInTheDocument();
        expect(screen.getByText(/Autonomous Agricultural Swarm/i)).toBeInTheDocument();
        expect(screen.getByText(/फोटो खींचें \/ Upload/i)).toBeInTheDocument();
    });

    it('Renders all 11 Indian Regional Languages for farmer selection', () => {
        render(<FarmerView />);
        
        expect(screen.getByText('हिन्दी')).toBeInTheDocument();
        expect(screen.getByText('ਪੰਜਾਬੀ')).toBeInTheDocument();
        expect(screen.getByText('తెలుగు')).toBeInTheDocument();
        expect(screen.getByText('தமிழ்')).toBeInTheDocument();
        expect(screen.getByText('മലയാളം')).toBeInTheDocument();
        expect(screen.getByText('ಕನ್ನಡ')).toBeInTheDocument();
        expect(screen.getByText('বাংলা')).toBeInTheDocument();
        expect(screen.getByText('मराठी')).toBeInTheDocument();
        expect(screen.getByText('ગુજરાતી')).toBeInTheDocument();
        expect(screen.getByText('ଓଡ଼ିଆ')).toBeInTheDocument();
        expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('Allows switching active language seamlessly', () => {
        render(<FarmerView />);
        
        const punjabiBtn = screen.getByText('ਪੰਜਾਬੀ').closest('button');
        fireEvent.click(punjabiBtn);
        
        // Active state styles
        expect(punjabiBtn).toHaveClass('bg-green-600');
    });

    it('Renders the Verified Safe card, Weather HUD, and Sarvam AI audio player upon successful analysis', async () => {
        uploadImage.mockResolvedValueOnce({
            vision_diagnosis: 'Tomato Late Blight',
            is_safe: true,
            safe_dosage_ml_per_acre: 150.0,
            dosage_unit: 'ml',
            is_mic_protected: true,
            translated_text: 'ਕਿਸਾਨ ਵੀਰੋ, ਤੁਹਾਡੀ ਫਸਲ ਵਿੱਚ ਪਛੇਤਾ ਝੁਲਸ ਰੋਗ ਮਿਲਿਆ ਹੈ...',
            vernacular_audio_url: '/static/audio/test_audio.wav',
            weather_data: {
                temperature_c: 28.4,
                relative_humidity: 76.0,
                precipitation_mm: 0.0,
                rain_risk_6h_percent: 5.0,
                wind_speed_kmh: 8.2,
                is_spray_safe: true
            }
        });

        render(<FarmerView />);

        // Simulate file upload
        const file = new File(['fake-leaf-content'], 'leaf.jpg', { type: 'image/jpeg' });
        const input = document.querySelector('input[type="file"]');
        
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/Verified Safe/i)).toBeInTheDocument();
            expect(screen.getByText('Tomato Late Blight')).toBeInTheDocument();
            expect(screen.getByText(/28.4°C · 76% Humidity/i)).toBeInTheDocument();
            expect(screen.getByText(/Safe to Spray ✓/i)).toBeInTheDocument();
            expect(screen.getByText(/ICAR MIC Floor Protected/i)).toBeInTheDocument();
            expect(screen.getByText(/Sarvam AI Bulbul:v3/i)).toBeInTheDocument();
        });
    });

    it('Renders the Statutory Non-Actionable warning card and nearest KVK center on low-confidence image', async () => {
        uploadImage.mockResolvedValueOnce({
            vision_diagnosis: 'Unrecognized Anomaly',
            is_safe: false,
            safety_warning: 'NON-ACTIONABLE: Mandatory Physical Verification by Local KVK Extension Officer Required.',
            translated_text: 'किसान भाई, लक्षण स्पष्ट नहीं हैं। कृपया नजदीकी कृषि विज्ञान केंद्र से संपर्क करें।',
            nearest_kvk: {
                name: 'ICAR-KVK Samrala, Ludhiana',
                distance_km: 7.8,
                phone: '01628-261597',
                address: 'Samrala-Chawa Road, Ludhiana, Punjab 141114',
                maps_url: 'https://maps.google.com/?q=30.8336,76.1917'
            }
        });

        render(<FarmerView />);

        const file = new File(['fake-leaf'], 'unknown.jpg', { type: 'image/jpeg' });
        const input = document.querySelector('input[type="file"]');
        
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/NON-ACTIONABLE: KVK Verification Required/i)).toBeInTheDocument();
            expect(screen.getByText(/ICAR-KVK Samrala, Ludhiana/i)).toBeInTheDocument();
            expect(screen.getByText(/7.8 km away/i)).toBeInTheDocument();
            expect(screen.getByText(/Call Agronomist \(01628-261597\)/i)).toBeInTheDocument();
        });
    });
});
