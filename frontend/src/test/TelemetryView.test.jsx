import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TelemetryView from '../components/TelemetryView';

// Mock API module for telemetry
vi.mock('../services/api', () => ({
    createTelemetrySocket: vi.fn(() => ({
        close: vi.fn()
    }))
}));

describe('TelemetryView 3D Control Room Suite', () => {
    it('Renders the Multi-Agent Swarm (MAS) header and agent node badges', () => {
        render(<TelemetryView />);
        
        expect(screen.getByText(/Multi-Agent Swarm \(MAS\)/i)).toBeInTheDocument();
        expect(screen.getByText('LIVE')).toBeInTheDocument();
        expect(screen.getByText(/TELEMETRY LEDGER/i)).toBeInTheDocument();
        
        // Check node labels
        expect(screen.getByText('Vision')).toBeInTheDocument();
        expect(screen.getByText('RAG')).toBeInTheDocument();
        expect(screen.getByText('Safety')).toBeInTheDocument();
        expect(screen.getByText('Web3')).toBeInTheDocument();
        expect(screen.getByText('Voice')).toBeInTheDocument();
    });

    it('Renders standby state when no events have fired', () => {
        render(<TelemetryView />);
        
        expect(screen.getByText('STANDBY')).toBeInTheDocument();
        expect(screen.getByText(/Awaiting crop image from Farmer interface/i)).toBeInTheDocument();
    });
});
