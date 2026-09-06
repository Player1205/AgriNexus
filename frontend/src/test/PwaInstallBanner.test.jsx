import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PwaInstallBanner from '../components/PwaInstallBanner';

describe('PwaInstallBanner Component', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.restoreAllMocks();
    });

    it('renders nothing when already in standalone mode (installed to home screen)', () => {
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(display-mode: standalone)',
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        const { container } = render(<PwaInstallBanner />);
        expect(container.firstChild).toBeNull();
    });

    it('renders install prompt when beforeinstallprompt event fires in browser', async () => {
        window.matchMedia = vi.fn().mockImplementation(() => ({
            matches: false,
            media: '',
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        render(<PwaInstallBanner />);

        const mockPrompt = vi.fn();
        const mockEvent = new Event('beforeinstallprompt');
        mockEvent.prompt = mockPrompt;
        mockEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

        act(() => {
            window.dispatchEvent(mockEvent);
        });

        expect(screen.getByText('Install AgriNexus App')).toBeInTheDocument();
        expect(screen.getByText('Add to Home Screen')).toBeInTheDocument();

        // Click Add to Home Screen
        await act(async () => {
            fireEvent.click(screen.getByText('Add to Home Screen'));
        });

        expect(mockPrompt).toHaveBeenCalledTimes(1);
    });

    it('dismisses the banner when close button is clicked', () => {
        window.matchMedia = vi.fn().mockImplementation(() => ({
            matches: false,
            media: '',
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }));

        render(<PwaInstallBanner />);

        const mockEvent = new Event('beforeinstallprompt');
        mockEvent.prompt = vi.fn();
        mockEvent.userChoice = Promise.resolve({ outcome: 'dismissed' });

        act(() => {
            window.dispatchEvent(mockEvent);
        });

        const closeBtn = screen.getByLabelText('Close installation banner');
        fireEvent.click(closeBtn);

        expect(sessionStorage.getItem('agrinexus_pwa_dismissed')).toBe('true');
        expect(screen.queryByText('Install AgriNexus App')).toBeNull();
    });
});
