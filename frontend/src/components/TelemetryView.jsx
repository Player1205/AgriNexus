import { useState, useEffect, useRef } from 'react';
import { createTelemetrySocket } from '../services/api';
import { Bot, Terminal, ShieldCheck, Activity, Cpu, Sparkles, Zap } from 'lucide-react';

const NODE_ORDER = ['vision', 'rag', 'safety', 'web3', 'voice'];

// Spatial coordinates (in percentages) for dynamic node graph layout
const NODE_POSITIONS = {
    vision: { x: 18, y: 30, label: "Vision", color: "#06b6d4", shadow: "rgba(6,182,212,0.7)" },  // Cyan
    rag:    { x: 36, y: 68, label: "RAG",    color: "#a855f7", shadow: "rgba(168,85,247,0.7)" },  // Purple
    safety: { x: 54, y: 26, label: "Safety", color: "#10b981", shadow: "rgba(16,185,129,0.7)" }, // Emerald
    web3:   { x: 72, y: 72, label: "Web3",   color: "#f59e0b", shadow: "rgba(245,158,11,0.7)" },  // Amber
    voice:  { x: 86, y: 34, label: "Voice",  color: "#22c55e", shadow: "rgba(34,197,94,0.7)" }    // Green
};

// Sequential edge connections between consecutive agent nodes
const EDGES = [
    { id: 'vision-rag',    from: 'vision', to: 'rag',    x1: 18, y1: 30, x2: 36, y2: 68, color: '#38bdf8' },
    { id: 'rag-safety',    from: 'rag',    to: 'safety', x1: 36, y1: 68, x2: 54, y2: 26, color: '#c084fc' },
    { id: 'safety-web3',   from: 'safety', to: 'web3',   x1: 54, y1: 26, x2: 72, y2: 72, color: '#34d399' },
    { id: 'web3-voice',    from: 'web3',   to: 'voice',  x1: 72, y1: 72, x2: 86, y2: 34, color: '#fbbf24' },
];

export default function TelemetryView() {
    const [events, setEvents] = useState([]);
    const [activeNode, setActiveNode] = useState(null);
    const [ignitingNode, setIgnitingNode] = useState(null);
    const [completedNodes, setCompletedNodes] = useState(new Set());
    const [activeDrawingEdge, setActiveDrawingEdge] = useState(null);
    const [drawnEdges, setDrawnEdges] = useState(new Set());
    const terminalRef = useRef(null);
    const timersRef = useRef([]);

    // Clear all pending timeouts safely
    const clearAllTimers = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
    };

    useEffect(() => {
        const ws = createTelemetrySocket((data) => {
            const { node, state } = data;
            const nodeIdx = NODE_ORDER.indexOf(node);

            // If starting a fresh run from Agent 1 (Vision)
            if (node === 'vision') {
                clearAllTimers();
                setDrawnEdges(new Set());
                setActiveDrawingEdge(null);
                setCompletedNodes(new Set(['vision']));
                setEvents([{ node, timestamp: new Date().toLocaleTimeString(), state }]);
                setIgnitingNode('vision');
                setActiveNode('vision');

                const t1 = setTimeout(() => setIgnitingNode(null), 800);
                timersRef.current.push(t1);
                return;
            }

            // For subsequent nodes (RAG, Safety, Web3, Voice):
            // 1. Identify previous node and transition edge
            const prevNode = NODE_ORDER[nodeIdx - 1];
            const edgeId = `${prevNode}-${node}`;

            // 2. Stage 1: Trigger the progressive Laser Beam traveling from prevNode -> currentNode
            setActiveDrawingEdge(edgeId);
            setActiveNode(null); // Previous node completes, focus transfers to the beam

            // 3. Stage 2 (after 850ms beam travel): Laser beam arrives at target node!
            const t2 = setTimeout(() => {
                // Settle the drawn edge permanently
                setDrawnEdges((prev) => new Set([...prev, edgeId]));
                setActiveDrawingEdge(null);

                // Ignite target node into glowing activation
                setIgnitingNode(node);
                setActiveNode(node);

                // Update completed set
                setCompletedNodes((prev) => {
                    const next = new Set(prev);
                    for (let i = 0; i <= nodeIdx; i++) {
                        next.add(NODE_ORDER[i]);
                    }
                    return next;
                });

                // Append event to cryptographic terminal
                setEvents((prev) => [...prev, { node, timestamp: new Date().toLocaleTimeString(), state }]);

                // Cool down ignite burst to steady active state
                const t3 = setTimeout(() => setIgnitingNode(null), 700);
                timersRef.current.push(t3);
            }, 850);

            timersRef.current.push(t2);
        });

        return () => {
            clearAllTimers();
            ws.close();
        };
    }, []);

    // Auto-scroll terminal ledger
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [events]);

    // Helper to get active animation class per bot
    const getNodeAnimationClass = (nodeKey, isActive, isIgniting) => {
        if (isIgniting) return "animate-node-ignite z-50";
        if (!isActive) return "transition-all duration-700 ease-out";
        switch (nodeKey) {
            case 'vision':
                return 'animate-vision-orbit';
            case 'rag':
                return 'animate-rag-vertical';
            case 'safety':
                return 'animate-safety-circle';
            case 'web3':
                return 'animate-web3-tilt';
            case 'voice':
                return 'animate-voice-ripple';
            default:
                return 'animate-pulse';
        }
    };

    return (
        <div className="flex flex-col w-full h-full max-w-[100vw] bg-[#020612] text-gray-100 overflow-x-hidden font-sans border-l border-gray-800/80 select-none">
            {/* Header */}
            <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-gray-800/80 bg-[#040a1c]/90 backdrop-blur-md z-20 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                        <Cpu className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase">Multi-Agent Swarm (MAS)</h2>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                                <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 animate-spin" /> LIVE
                            </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-mono hidden xs:block">Progressive Neural Edge Traversal</p>
                    </div>
                </div>
                <div className="text-right font-mono text-[10px] sm:text-xs text-gray-400">
                    <span className="hidden sm:inline">STATE: </span>
                    <span className="font-bold text-cyan-400">
                        {activeDrawingEdge ? 'PROPAGATING BEAM' : activeNode ? activeNode.toUpperCase() : 'STANDBY'}
                    </span>
                </div>
            </div>

            {/* UPPER SECTION: 3D Moving Cybernetic Spatial Canvas */}
            <div className="relative w-full h-[55%] min-h-[240px] sm:min-h-[300px] bg-[#020617] overflow-hidden flex items-center justify-center shrink-0">
                
                {/* 3D Perspective Moving Cybernetic Grid Floor */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Deep dynamic ambient glow orbs */}
                    <div className="absolute top-1/4 left-1/4 w-48 sm:w-80 h-48 sm:h-80 bg-cyan-600/10 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
                    <div className="absolute bottom-1/4 right-1/4 w-56 sm:w-96 h-56 sm:h-96 bg-purple-600/10 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-600/5 rounded-full blur-3xl" />

                    {/* 3D Perspective Grid Plane */}
                    <div className="absolute inset-0 [perspective:700px] flex items-center justify-center opacity-30">
                        <div className="w-[200%] h-[200%] [transform:rotateX(60deg)_translateZ(-80px)] bg-cyber-grid animate-grid-flow" />
                    </div>
                    
                    {/* Moving stardust light streaks */}
                    <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] sm:[background-size:32px_32px] opacity-15 animate-stardust" />
                </div>

                {/* SVG Connecting Paths: Laser Drawn progressively between nodes */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <defs>
                        <filter id="glow-heavy" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="2.5" result="blur1" />
                            <feGaussianBlur stdDeviation="1.0" result="blur2" />
                            <feMerge>
                                <feMergeNode in="blur1" />
                                <feMergeNode in="blur2" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Render each segment */}
                    {EDGES.map((edge) => {
                        const isDrawing = activeDrawingEdge === edge.id;
                        const isDrawn = drawnEdges.has(edge.id);

                        if (!isDrawing && !isDrawn) return null;

                        return (
                            <g key={edge.id}>
                                {isDrawing ? (
                                    /* Progressive Laser Beam Shooting Across to Next Agent */
                                    <line 
                                        x1={edge.x1} 
                                        y1={edge.y1} 
                                        x2={edge.x2} 
                                        y2={edge.y2} 
                                        pathLength="100"
                                        stroke={edge.color} 
                                        strokeWidth="2.8" 
                                        filter="url(#glow-heavy)"
                                        vectorEffect="non-scaling-stroke"
                                        className="animate-laser-draw"
                                    />
                                ) : (
                                    /* Settled Continuous Flowing Stream */
                                    <>
                                        <line 
                                            x1={edge.x1} 
                                            y1={edge.y1} 
                                            x2={edge.x2} 
                                            y2={edge.y2} 
                                            stroke={edge.color} 
                                            strokeWidth="1.2" 
                                            strokeOpacity="0.4"
                                            filter="url(#glow-heavy)"
                                            vectorEffect="non-scaling-stroke"
                                        />
                                        <line 
                                            x1={edge.x1} 
                                            y1={edge.y1} 
                                            x2={edge.x2} 
                                            y2={edge.y2} 
                                            stroke={edge.color} 
                                            strokeWidth="0.9" 
                                            strokeDasharray="2 3"
                                            vectorEffect="non-scaling-stroke"
                                            className="animate-flow-dash"
                                        />
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Render Nodes */}
                {NODE_ORDER.map((nodeKey) => {
                    const pos = NODE_POSITIONS[nodeKey];
                    const isActive = activeNode === nodeKey;
                    const isIgniting = ignitingNode === nodeKey;
                    const isCompleted = completedNodes.has(nodeKey);
                    const animClass = getNodeAnimationClass(nodeKey, isActive, isIgniting);
                    
                    return (
                        <div 
                            key={nodeKey}
                            className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 sm:gap-2.5 z-20 ${animClass}`}
                            style={{ 
                                left: `${pos.x}%`, 
                                top: `${pos.y}%`,
                                zIndex: isIgniting ? 50 : isActive ? 40 : 20
                            }}
                        >
                            {/* High-intensity Ignite Shockwave on Arrival */}
                            {isIgniting && (
                                <div 
                                    className="absolute -inset-6 rounded-full border-2 border-white animate-ping pointer-events-none"
                                    style={{ borderColor: pos.color }}
                                />
                            )}

                            {/* Outer animated halo rings for active node */}
                            {isActive && !isIgniting && (
                                <>
                                    <div 
                                        className="absolute -inset-2 sm:-inset-3 rounded-full border border-cyan-400/40 animate-ping pointer-events-none"
                                        style={{ borderColor: pos.color }}
                                    />
                                    <div 
                                        className="absolute -inset-4 sm:-inset-6 rounded-full border border-cyan-400/20 animate-pulse pointer-events-none" 
                                        style={{ borderColor: pos.color }}
                                    />
                                </>
                            )}

                            {/* The Bot Node Shell */}
                            <div 
                                className={`relative flex items-center justify-center rounded-[1.4rem] sm:rounded-[2rem] rounded-bl-md p-2 sm:p-3.5 transition-all duration-500 backdrop-blur-md
                                    ${isIgniting
                                        ? 'scale-140 bg-[#0f2857] border-2 shadow-[0_0_40px_#fff]'
                                        : isActive 
                                            ? 'scale-115 sm:scale-125 bg-[#0b1b3b]/90 border-2 shadow-2xl' 
                                            : isCompleted 
                                                ? 'scale-100 sm:scale-105 bg-[#0a152d]/80 border border-cyan-500/50 shadow-lg' 
                                                : 'bg-[#050b18]/60 border border-gray-800/80 opacity-40 grayscale'
                                    }`}
                                style={{ 
                                    borderColor: (isActive || isIgniting) ? pos.color : (isCompleted ? '#38bdf8' : '#1e293b'),
                                    boxShadow: (isActive || isIgniting) ? `0 0 30px ${pos.shadow}, inset 0 0 15px ${pos.shadow}` : 'none'
                                }}
                            >
                                <Bot 
                                    className={`w-5 h-5 sm:w-8 sm:h-8 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} 
                                    style={{ color: (isActive || isIgniting) ? pos.color : (isCompleted ? '#e2e8f0' : '#475569') }} 
                                />
                                
                                {/* Scanning radar beam when node is active */}
                                {(isActive || isIgniting) && (
                                    <div className="absolute inset-0 overflow-hidden rounded-[1.4rem] sm:rounded-[2rem] rounded-bl-md pointer-events-none">
                                        <div className="w-full h-1 sm:h-1.5 bg-white/70 shadow-[0_0_15px_#fff] absolute top-0 animate-bot-scan" />
                                    </div>
                                )}
                            </div>

                            {/* Node Label HUD Badge */}
                            <div className="flex flex-col items-center">
                                <span className={`px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-mono font-bold tracking-wider uppercase transition-all duration-300 ${
                                    (isActive || isIgniting)
                                        ? 'text-white bg-cyan-950/90 border border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.5)]' 
                                        : isCompleted 
                                            ? 'text-gray-200 bg-gray-900/70 border border-gray-700/50' 
                                            : 'text-gray-600 bg-transparent'
                                }`}>
                                    {pos.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* LOWER SECTION: High-Tech Terminal / Telemetry Ledger */}
            <div className="flex-1 min-h-0 bg-[#01040a] p-3 sm:p-4 flex flex-col border-t border-gray-800/80 relative z-20 overflow-hidden">
                <div className="flex items-center justify-between text-gray-400 mb-2 pb-1.5 border-b border-gray-800/80 font-mono text-[10px] sm:text-xs shrink-0">
                    <span className="flex items-center gap-1.5 font-semibold tracking-wider text-cyan-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> 
                        TELEMETRY LEDGER
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-cyan-400" /> SYNCED</span>
                        <span>:8000</span>
                    </div>
                </div>
                
                <div ref={terminalRef} className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 font-mono text-[11px] pr-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    {events.length === 0 ? (
                        <div className="flex items-center gap-2 text-gray-500 italic mt-2 font-sans text-xs">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                            <span>Awaiting crop image from Farmer interface...</span>
                        </div>
                    ) : (
                        events.map((ev, i) => (
                            <div key={i} className="flex flex-col gap-1 border-l-2 pl-2.5 py-1 border-cyan-500/40 bg-gray-950/60 rounded-r border-y border-r border-gray-900/60 animate-in fade-in slide-in-from-left-2 duration-300 overflow-x-hidden">
                                <div className="text-gray-400 flex items-center justify-between text-[10px] sm:text-[11px]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-600 font-bold">[{ev.timestamp}]</span>
                                        <span style={{ color: NODE_POSITIONS[ev.node]?.color || '#fff' }} className="font-bold tracking-wide">
                                            ::{NODE_POSITIONS[ev.node]?.label?.toUpperCase() || ev.node}
                                        </span>
                                    </div>
                                    <span className="text-emerald-400 font-medium">✓ DONE</span>
                                </div>
                                <div className="text-gray-300 bg-black/70 p-1.5 sm:p-2 rounded border border-gray-800/50 break-words whitespace-pre-wrap font-mono text-[10px] sm:text-[11px]">
                                    {ev.node === 'vision' && `Diagnosis: ${ev.state.vision_diagnosis}\nConfidence: ${(ev.state.vision_confidence * 100).toFixed(1)}%\nEngine: ONNX EfficientNet-B4`}
                                    {ev.node === 'rag' && `Action: ICAR Vector Retrieved\nPrescription: ${ev.state.proposed_chemical}`}
                                    {ev.node === 'safety' && `C++ Engine: ${ev.state.is_safe ? 'VERIFIED SAFE' : 'REJECTED'}\nSafe Dosage: ${ev.state.safe_dosage_ml_per_acre} ml/acre`}
                                    {ev.node === 'web3' && `Base L2 Passport #${ev.state.passport_id}\nTx: ${ev.state.tx_hash ? ev.state.tx_hash.slice(0, 24) + '...' : '0x...'}`}
                                    {ev.node === 'voice' && `Vernacular Audio Synthesized\nText: "${ev.state.translated_text}"`}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Custom 3D, Laser Propagation & Node Keyframe Animations */}
            <style dangerouslySetInnerHTML={{__html: `
                /* 3D Moving Grid Background */
                .bg-cyber-grid {
                    background-image: 
                        linear-gradient(to right, rgba(6, 182, 212, 0.25) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(6, 182, 212, 0.25) 1px, transparent 1px);
                    background-size: 32px 32px;
                }
                @keyframes grid-flow {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 64px; }
                }
                .animate-grid-flow {
                    animation: grid-flow 3.5s linear infinite;
                }

                @keyframes stardust-drift {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-24px); }
                }
                .animate-stardust {
                    animation: stardust-drift 8s linear infinite;
                }

                /* Laser Beam Draw-In Animation */
                @keyframes laser-draw {
                    0% {
                        stroke-dasharray: 100;
                        stroke-dashoffset: 100;
                        opacity: 0.3;
                    }
                    25% {
                        opacity: 1;
                    }
                    100% {
                        stroke-dasharray: 100;
                        stroke-dashoffset: 0;
                        opacity: 1;
                    }
                }
                .animate-laser-draw {
                    animation: laser-draw 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }

                @keyframes flow-dash {
                    to { stroke-dashoffset: -12; }
                }
                .animate-flow-dash {
                    animation: flow-dash 0.8s linear infinite;
                }

                /* Node Ignition Burst when Laser Arrives */
                @keyframes node-ignite {
                    0% {
                        transform: translate(-50%, -50%) scale(0.95);
                        filter: brightness(0.8);
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.38);
                        filter: brightness(2) drop-shadow(0 0 20px #38bdf8);
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1.22);
                        filter: brightness(1);
                    }
                }
                .animate-node-ignite {
                    animation: node-ignite 0.7s ease-out forwards;
                }

                /* Bot Internal Scan */
                @keyframes bot-scan {
                    0% { top: 0%; opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-bot-scan {
                    animation: bot-scan 1.2s ease-in-out infinite;
                }

                /* 1. Vision: Circular Orbit Wobble Movement */
                @keyframes vision-orbit {
                    0%   { transform: translate(-50%, -50%) translate(0px, -6px); }
                    25%  { transform: translate(-50%, -50%) translate(6px, 0px); }
                    50%  { transform: translate(-50%, -50%) translate(0px, 6px); }
                    75%  { transform: translate(-50%, -50%) translate(-6px, 0px); }
                    100% { transform: translate(-50%, -50%) translate(0px, -6px); }
                }
                .animate-vision-orbit {
                    animation: vision-orbit 2.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
                }

                /* 2. RAG: Smooth Up-and-Down Vertical Floating */
                @keyframes rag-vertical {
                    0%, 100% { transform: translate(-50%, -50%) translateY(-10px); }
                    50%      { transform: translate(-50%, -50%) translateY(10px); }
                }
                .animate-rag-vertical {
                    animation: rag-vertical 1.8s ease-in-out infinite;
                }

                /* 3. Safety: Smooth Circular Rotation / Shield Pulse */
                @keyframes safety-circle {
                    0%   { transform: translate(-50%, -50%) translate(-5px, -5px) scale(1.08); }
                    33%  { transform: translate(-50%, -50%) translate(5px, 0px) scale(1.18); }
                    66%  { transform: translate(-50%, -50%) translate(-2px, 5px) scale(1.12); }
                    100% { transform: translate(-50%, -50%) translate(-5px, -5px) scale(1.08); }
                }
                .animate-safety-circle {
                    animation: safety-circle 2.2s ease-in-out infinite;
                }

                /* 4. Web3: Block Tilt & Dynamic Diamond Bounce */
                @keyframes web3-tilt {
                    0%, 100% { transform: translate(-50%, -50%) rotate(-5deg) scale(1.1); }
                    50%      { transform: translate(-50%, -50%) rotate(5deg) scale(1.2); }
                }
                .animate-web3-tilt {
                    animation: web3-tilt 1.6s ease-in-out infinite;
                }

                /* 5. Voice: Harmonic Wave Vibration Ripple */
                @keyframes voice-ripple {
                    0%, 100% { transform: translate(-50%, -50%) scale(1.12); }
                    25%      { transform: translate(-50%, -50%) scale(1.22) translateY(-3px); }
                    75%      { transform: translate(-50%, -50%) scale(1.18) translateY(3px); }
                }
                .animate-voice-ripple {
                    animation: voice-ripple 1.4s ease-in-out infinite;
                }
            `}} />
        </div>
    );
}
