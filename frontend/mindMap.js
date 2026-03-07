// ================================
// MIND MAP — MontIA
// Mapa Conceptual Interactivo con vis.js
// ================================

const MindMap = (() => {
    let network = null;

    /**
     * Muestra el modal del mapa conceptual y genera el grafo.
     */
    async function show(query, results, getAuthHeaders) {
        const modal = document.getElementById('mindmap-modal');
        if (!modal) return;

        modal.classList.add('active');
        const container = document.getElementById('mindmap-graph');
        const loadingEl = document.getElementById('mindmap-loading');
        const legendEl = document.getElementById('mindmap-legend');

        if (container) container.innerHTML = '';
        if (loadingEl) loadingEl.style.display = 'flex';
        if (legendEl) legendEl.style.display = 'none';

        try {
            const headers = getAuthHeaders ? getAuthHeaders() : { 'Content-Type': 'application/json' };
            const res = await fetch('http://localhost:3000/api/mindmap', {
                method: 'POST',
                headers,
                body: JSON.stringify({ query, results })
            });

            if (!res.ok) throw new Error('Error del servidor');
            const graphData = await res.json();

            if (loadingEl) loadingEl.style.display = 'none';
            if (legendEl) legendEl.style.display = 'flex';

            renderGraph(container, graphData);
        } catch (err) {
            console.error('Error generando mapa:', err);
            if (loadingEl) {
                loadingEl.innerHTML = '<span style="color:#ff6b6b;">Error al generar el mapa. Intenta de nuevo.</span>';
            }
        }
    }

    /**
     * Renderiza el grafo de vis.js en el contenedor dado.
     */
    function renderGraph(container, graphData) {
        if (!container || !graphData) return;

        const colorMap = {
            topic: { background: '#FFD700', border: '#DAA520', font: '#333', shape: 'diamond' },
            article: { background: '#4A90D9', border: '#2E6BB5', font: '#fff', shape: 'box' },
            theme: { background: '#2ECC71', border: '#27AE60', font: '#fff', shape: 'ellipse' },
            gap: { background: '#E74C3C', border: '#C0392B', font: '#fff', shape: 'star' }
        };

        const nodes = new vis.DataSet(
            graphData.nodes.map(n => {
                const style = colorMap[n.type] || colorMap.article;
                return {
                    id: n.id,
                    label: wrapLabel(n.label, 25),
                    title: `<div style="max-width:250px;padding:8px;"><strong>${n.label}</strong><br><em>${n.type}</em><br>${n.detail || ''}</div>`,
                    shape: style.shape,
                    color: {
                        background: style.background,
                        border: style.border,
                        highlight: { background: lighten(style.background), border: style.border },
                        hover: { background: lighten(style.background), border: style.border }
                    },
                    font: { color: style.font, size: n.type === 'topic' ? 18 : 14, face: 'Poppins, sans-serif', bold: n.type === 'topic' },
                    size: n.type === 'topic' ? 45 : n.type === 'gap' ? 35 : 30,
                    shadow: { enabled: true, color: 'rgba(0,0,0,0.2)', size: 8 },
                    borderWidth: n.type === 'topic' ? 3 : 2
                };
            })
        );

        const edges = new vis.DataSet(
            graphData.edges.map((e, i) => ({
                id: i,
                from: e.from,
                to: e.to,
                label: e.label || '',
                font: { size: 11, color: '#666', strokeWidth: 3, strokeColor: '#fff', face: 'Poppins, sans-serif' },
                color: { color: '#aaa', highlight: '#4A90D9', hover: '#4A90D9' },
                width: 2,
                smooth: { type: 'curvedCW', roundness: 0.2 },
                arrows: { to: { enabled: true, scaleFactor: 0.7 } }
            }))
        );

        const options = {
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -80,
                    centralGravity: 0.01,
                    springLength: 180,
                    springConstant: 0.06,
                    damping: 0.5
                },
                stabilization: { iterations: 150, updateInterval: 25 }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                zoomView: true,
                dragView: true,
                navigationButtons: false,
                keyboard: { enabled: true }
            },
            layout: { improvedLayout: true }
        };

        network = new vis.Network(container, { nodes, edges }, options);

        // Animación de entrada
        network.once('stabilizationIterationsDone', () => {
            network.fit({ animation: { duration: 800, easingFunction: 'easeInOutQuad' } });
        });

        // Click en nodo para zoom
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                network.focus(params.nodes[0], {
                    scale: 1.5,
                    animation: { duration: 600, easingFunction: 'easeInOutQuad' }
                });
            }
        });

        // Doble click para fit all
        network.on('doubleClick', () => {
            network.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
        });
    }

    /**
     * Cierra el modal del mapa conceptual.
     */
    function close() {
        const modal = document.getElementById('mindmap-modal');
        if (modal) modal.classList.remove('active');
        if (network) {
            network.destroy();
            network = null;
        }
    }

    /**
     * Wraps long labels into multiple lines.
     */
    function wrapLabel(text, maxChars) {
        if (!text || text.length <= maxChars) return text;
        const words = text.split(' ');
        let lines = [];
        let current = '';
        for (const word of words) {
            if ((current + ' ' + word).trim().length > maxChars) {
                if (current) lines.push(current.trim());
                current = word;
            } else {
                current += ' ' + word;
            }
        }
        if (current.trim()) lines.push(current.trim());
        return lines.join('\n');
    }

    /**
     * Lighten a hex color
     */
    function lighten(hex) {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + 30);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + 30);
        const b = Math.min(255, (num & 0x0000FF) + 30);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Init: bind close button
     */
    function init() {
        const closeBtn = document.getElementById('mindmap-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', close);
        }

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') close();
        });
    }

    return { init, show, close };
})();

document.addEventListener('DOMContentLoaded', () => {
    MindMap.init();
});
