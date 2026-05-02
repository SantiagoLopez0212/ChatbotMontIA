// MIND MAP — MontIA (Panel lateral + navegación a artículos)

const MindMap = (() => {
    let network = null;
    let nodesData = null;
    let edgesData = null;

    const colorMap = {
        topic:   { background: '#FFD700', border: '#FFC300' },
        article: { background: '#4A90D9', border: '#2980B9' },
        theme:   { background: '#2ECC71', border: '#27AE60' },
        gap:     { background: '#E74C3C', border: '#C0392B' }
    };

    const typeLabels = { topic: 'Tema Central', article: 'Artículo', theme: 'Tema Emergente', gap: 'Brecha / Gap' };
    const typeIcons  = { topic: '🎯', article: '📄', theme: '💡', gap: '🔍' };

    async function show(query, results, getAuthHeaders) {
        const modal = document.getElementById('mindmap-modal');
        if (!modal) return;

        modal.classList.add('active');
        const container   = document.getElementById('mindmap-graph');
        const loadingEl   = document.getElementById('mindmap-loading');
        const legendEl    = document.getElementById('mindmap-legend');
        const tooltipEl   = document.getElementById('custom-tooltip');
        const panelEl     = document.getElementById('mindmap-detail-panel');
        const nodeCountEl = document.getElementById('mindmap-node-count');

        if (container)   container.innerHTML = '';
        if (loadingEl)   loadingEl.style.display = 'flex';
        if (legendEl)    legendEl.style.display = 'none';
        if (tooltipEl)   tooltipEl.style.display = 'none';
        if (panelEl)     panelEl.classList.remove('active');
        if (nodeCountEl) nodeCountEl.textContent = '';

        try {
            const headers = getAuthHeaders ? getAuthHeaders() : { 'Content-Type': 'application/json' };
            const res = await fetch('http://localhost:3000/api/mindmap', {
                method: 'POST',
                headers,
                body: JSON.stringify({ query, results })
            });

            if (!res.ok) throw new Error('Error del servidor');
            const graphData = await res.json();

            if (loadingEl)   loadingEl.style.display = 'none';
            if (legendEl)    legendEl.style.display = 'flex';
            if (nodeCountEl) nodeCountEl.textContent = `${graphData.nodes.length} nodos`;

            renderGraph2D(container, graphData, tooltipEl);
        } catch (err) {
            console.error('Error generando mapa:', err);
            if (loadingEl) {
                loadingEl.style.display = 'flex';
                loadingEl.innerHTML = '<span style="color:#ff6b6b;">Error al mostrar el mapa. Verifica tu conexión.</span>';
            }
        }
    }

    function renderGraph2D(container, graphData, tooltipEl) {
        if (!container || !graphData || !window.vis) return;

        const visNodes = graphData.nodes.map(n => {
            const colors = colorMap[n.type] || { background: '#ccc', border: '#999' };
            const isGap  = n.type === 'gap';
            return {
                id: n.id,
                label: n.type === 'topic' ? n.label.toUpperCase() : n.label,
                shape: n.type === 'topic' ? 'hexagon' : (isGap ? 'star' : 'dot'),
                size:  n.type === 'topic' ? 35 : (isGap ? 25 : 18),
                color: {
                    background: colors.background,
                    border: colors.border,
                    highlight: { background: '#ffffff', border: colors.background }
                },
                font: { color: '#ffffff', size: 13, strokeWidth: 2, strokeColor: '#0f0c29' },
                shadow: { enabled: true, color: colors.background + '88', size: isGap ? 28 : 18, x: 0, y: 0 },
                customData: n
            };
        });

        const visEdges = graphData.edges.map(e => ({
            from: e.from,
            to: e.to,
            label: e.label,
            font: { color: '#8ec5fc', size: 11, strokeWidth: 3, strokeColor: '#0f0c29' },
            color: { color: 'rgba(142,197,252,0.2)', highlight: '#8ec5fc', hover: '#8ec5fc' },
            arrows: { to: { enabled: true, scaleFactor: 0.6 } },
            smooth: { type: 'curvedCW', roundness: 0.1 }
        }));

        nodesData = new vis.DataSet(visNodes);
        edgesData = new vis.DataSet(visEdges);

        const options = {
            physics: {
                forceAtlas2Based: {
                    gravitationalConstant: -80,
                    centralGravity: 0.01,
                    springLength: 220,
                    springConstant: 0.08
                },
                maxVelocity: 50,
                solver: 'forceAtlas2Based',
                timestep: 0.35,
                stabilization: { iterations: 180 }
            },
            interaction: { hover: true, tooltipDelay: 80, navigationButtons: false }
        };

        network = new vis.Network(container, { nodes: nodesData, edges: edgesData }, options);

        // Hover: tooltip rápido
        network.on('hoverNode', (params) => {
            const nodeId   = params.node;
            const nodePos  = network.canvasToDOM(network.getPositions([nodeId])[nodeId]);
            const nodeData = nodesData.get(nodeId).customData;
            const col      = colorMap[nodeData.type] || colorMap.article;

            if (tooltipEl) {
                tooltipEl.innerHTML = `
                    <strong style="color:${col.background}; font-size:1em; display:block; margin-bottom:4px;">${nodeData.label}</strong>
                    <span style="font-size:0.72em; background:${col.border}; color:#fff; padding:2px 7px; border-radius:4px; text-transform:uppercase; letter-spacing:0.05em;">${typeLabels[nodeData.type] || nodeData.type}</span>
                    <p style="font-size:0.82em; margin:8px 0 4px; line-height:1.4; color:rgba(255,255,255,0.8);">${(nodeData.detail || '').substring(0, 120)}${nodeData.detail && nodeData.detail.length > 120 ? '…' : ''}</p>
                    <em style="font-size:0.75em; color:#8ec5fc;">Clic para ver detalles</em>
                `;
                tooltipEl.style.display = 'block';
                const rect = container.getBoundingClientRect();
                tooltipEl.style.left = Math.min(nodePos.x + 18, rect.width - 310) + 'px';
                tooltipEl.style.top  = (nodePos.y - 30) + 'px';
            }
            container.style.cursor = 'pointer';
        });

        network.on('blurNode', () => {
            if (tooltipEl) tooltipEl.style.display = 'none';
            container.style.cursor = 'default';
        });

        // Clic: abrir panel lateral
        network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeData = nodesData.get(params.nodes[0]).customData;
                showDetailPanel(nodeData);
                if (tooltipEl) tooltipEl.style.display = 'none';
                // Dar tiempo al panel para abrirse antes de ajustar el grafo
                setTimeout(() => { if (network) network.fit({ animation: { duration: 400 } }); }, 320);
            } else {
                closePanel();
            }
        });

        network.on('doubleClick', (params) => {
            if (params.nodes.length > 0) {
                network.focus(params.nodes[0], { scale: 1.5, animation: { duration: 400 } });
            } else {
                network.fit({ animation: { duration: 400 } });
            }
        });

        network.on('zoom',      () => { if (tooltipEl) tooltipEl.style.display = 'none'; });
        network.on('dragStart', () => { if (tooltipEl) tooltipEl.style.display = 'none'; });
    }

    function showDetailPanel(nodeData) {
        const panel   = document.getElementById('mindmap-detail-panel');
        const content = document.getElementById('mindmap-panel-content');
        if (!panel || !content) return;

        const col   = colorMap[nodeData.type] || colorMap.article;
        const icon  = typeIcons[nodeData.type] || '●';
        const label = typeLabels[nodeData.type] || nodeData.type;

        const urlBtn = nodeData.url
            ? `<a href="${nodeData.url}" target="_blank" rel="noopener noreferrer" class="panel-btn panel-btn-primary">📖 Ver artículo</a>`
            : '';

        const focusBtn = `<button class="panel-btn panel-btn-secondary" id="panel-focus-btn">🔬 Focus Mode</button>`;

        content.innerHTML = `
            <div class="panel-type-badge" style="--badge-color:${col.background}; --badge-border:${col.border};">
                ${icon} ${label}
            </div>
            <h3 class="panel-title">${nodeData.label}</h3>
            <p class="panel-detail">${nodeData.detail || ''}</p>
            <div class="panel-actions">
                ${urlBtn}
                ${focusBtn}
            </div>
        `;

        document.getElementById('panel-focus-btn')?.addEventListener('click', () => {
            triggerFocusMode(nodeData);
        });

        panel.classList.add('active');
    }

    function closePanel() {
        const panel = document.getElementById('mindmap-detail-panel');
        if (panel) panel.classList.remove('active');
        setTimeout(() => { if (network) network.fit({ animation: { duration: 300 } }); }, 320);
    }

    function triggerFocusMode(nodeData) {
        close();
        const input = document.getElementById('user-input');
        if (input) {
            input.value = `Quiero hacer Focus Mode en: "${nodeData.label}". Contexto: ${nodeData.detail}. Dame un análisis profundo.`;
            const form = document.getElementById('chat-form');
            if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    }

    function close() {
        const modal = document.getElementById('mindmap-modal');
        if (modal) modal.classList.remove('active');
        const tooltipEl = document.getElementById('custom-tooltip');
        if (tooltipEl) tooltipEl.style.display = 'none';
        closePanel();
        if (network) {
            network.destroy();
            network = null;
            nodesData = null;
            edgesData = null;
        }
    }

    function init() {
        const closeBtn  = document.getElementById('mindmap-close');
        const panelClose = document.getElementById('mindmap-panel-close');
        if (closeBtn)   closeBtn.addEventListener('click', close);
        if (panelClose) panelClose.addEventListener('click', closePanel);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
        window.addEventListener('resize', () => { if (network) network.fit(); });
    }

    return { init, show, close };
})();

document.addEventListener('DOMContentLoaded', () => {
    MindMap.init();
});
