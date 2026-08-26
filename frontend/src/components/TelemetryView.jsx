import { useState, useEffect, useRef } from 'react';
import { createTelemetrySocket } from '../services/api';
import { Activity, CheckCircle, Clock, AlertTriangle, Cpu, Link2, Mic } from 'lucide-react';

const NODE_META = {
    vision: { label: 'Vision Pathology', icon: Activity, color: 'blue' },
    rag: { label: 'RAG Agronomy', icon: Activity, color: 'purple' },
    safety: { label: 'C++ Safety Engine', icon: Cpu, color: 'red' },
    web3: { label: 'Web3 Passport', icon: Link2, color: 'amber' },
    voice: { label: 'Vernacular Voice', icon: Mic, color: 'green' },
};

const NODE_ORDER = ['vision', 'rag', 'safety', 'web3', 'voice'];

function NodeCard({ nodeKey, data, isActive, isCompleted }) {
    const meta = NODE_META[nodeKey] || { label: nodeKey, icon: Activity, color: 'gray' };
    const Icon = meta.icon;

    const borderColor = isActive
        ? `border-${meta.color}-500 shadow-lg shadow-${meta.color}-500/20`
        : isCompleted
            ? 'border-green-600'
            : 'border-gray-700';

    return (
        <div className={`border rounded-lg p-3 transition-all duration-300 ${borderColor} bg-gray-800`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? `text-${meta.color}-400 animate-pulse` : isCompleted ? 'text-green-400' : 'text-gray-500'}`} />
                    <span className="text-sm font-semibold text-gray-200">{meta.label}</span>
                </div>
                {isActive && <Clock className="w-4 h-4 text-yellow-400 animate-spin" />}
                {isCompleted && <CheckCircle className="w-4 h-4 text-green-400" />}
            </div>

            {data && (
                <pre className="text-xs text-gray-400 bg-gray-900 rounded p-2 max-h-32 overflow-y-auto overflow-x-auto font-mono whitespace-pre-wrap break-words max-w-full">
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </div>
    );
}

export default function TelemetryView() {
    const [events, setEvents] = useState([]);
    const [activeNode, setActiveNode] = useState(null);
    const [completedNodes, setCompletedNodes] = useState(new Set());
    const [nodePayloads, setNodePayloads] = useState({});
    const wsRef = useRef(null);

    useEffect(() => {
        const ws = createTelemetrySocket((data) => {
            const { node, state } = data;

            setEvents((prev) => [...prev, { node, timestamp: new Date().toISOString(), state }]);
            setActiveNode(node);
            setNodePayloads((prev) => ({ ...prev, [node]: state }));

            // Mark previously active nodes as completed
            setCompletedNodes((prev) => {
                const next = new Set(prev);
                const idx = NODE_ORDER.indexOf(node);
                for (let i = 0; i < idx; i++) {
                    next.add(NODE_ORDER[i]);
                }
                return next;
            });
        });

        wsRef.current = ws;
        return () => ws.close();
    }, []);

    // Derive summary metrics
    const latestState = events.length > 0 ? events[events.length - 1].state : null;

    return (
        <div className="flex flex-col w-full h-full bg-gray-950 text-gray-100 px-3 py-4 sm:p-4 overflow-y-auto overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight text-green-400">⚡ Swarm Telemetry</h2>
                <span className={`text-xs px-2 py-1 rounded-full font-mono ${activeNode ? 'bg-yellow-900 text-yellow-300' : events.length > 0 ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-400'}`}>
                    {activeNode ? `Running: ${activeNode}` : events.length > 0 ? 'Complete' : 'Idle'}
                </span>
            </div>

            {/* Node Graph */}
            <div className="space-y-3 mb-4">
                {NODE_ORDER.map((key) => (
                    <NodeCard
                        key={key}
                        nodeKey={key}
                        data={nodePayloads[key]}
                        isActive={activeNode === key}
                        isCompleted={completedNodes.has(key)}
                    />
                ))}
            </div>

            {/* Summary Panel */}
            {latestState && (
                <div className="border border-gray-700 rounded-lg p-3 bg-gray-900 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-300">Final State Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-gray-500">Diagnosis:</span>
                            <p className="text-gray-200 font-mono">{latestState.vision_diagnosis || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Confidence:</span>
                            <p className="text-gray-200 font-mono">{latestState.vision_confidence ?? '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Chemical:</span>
                            <p className="text-gray-200 font-mono">{latestState.proposed_chemical || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Safety:</span>
                            <p className={`font-mono ${latestState.is_safe ? 'text-green-400' : 'text-red-400'}`}>
                                {latestState.is_safe ? '✓ SAFE' : '✗ UNSAFE'}
                            </p>
                        </div>
                        <div>
                            <span className="text-gray-500">Dosage:</span>
                            <p className="text-gray-200 font-mono">{latestState.safe_dosage_ml_per_acre || '—'} ml/acre</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Tx Hash:</span>
                            <p className="text-gray-200 font-mono truncate max-w-full">{latestState.tx_hash || '—'}</p>
                        </div>
                    </div>

                    {latestState.errors && latestState.errors.length > 0 && (
                        <div className="mt-2">
                            <div className="flex items-center gap-1 text-red-400 text-xs mb-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Errors</span>
                            </div>
                            {latestState.errors.map((err, i) => (
                                <p key={i} className="text-red-300 text-xs font-mono">{err}</p>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Raw Event Log */}
            {events.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-1">Event Log</h3>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                        {events.map((ev, i) => (
                            <div key={i} className="text-xs font-mono text-gray-500">
                                <span className="text-gray-600">[{ev.timestamp}]</span> <span className="text-green-400">{ev.node}</span> executed
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
