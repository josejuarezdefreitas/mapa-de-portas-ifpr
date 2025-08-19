// main.js

// Importações do Firebase
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { auth, database } from './firebase-config.js';
import { ref, onValue, set, update, remove, push, serverTimestamp, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// Referências principais do Firebase
const dbRef = ref(database, 'switches');
const templatesRef = ref(database, 'switchTemplates');

// Verifica se o utilizador está autenticado
onAuthStateChanged(auth, user => {
    if (user) {
        console.log("Utilizador autenticado:", user.email);
        startApp();
    } else {
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
    }
});

// Função principal que inicializa a aplicação
function startApp() {
    
    // --- 1. SELEÇÃO DE ELEMENTOS DO DOM ---
    const switchRack = document.querySelector('.switch-rack');
    const searchBar = document.getElementById('search-bar');
    const addSwitchBtn = document.getElementById('add-switch-btn');
    const portTooltip = document.getElementById('port-tooltip');
    const logsBtn = document.getElementById('logs-btn');
    const templatesBtn = document.getElementById('templates-btn');
	const logoutBtn = document.getElementById('logout-btn');
    
    // Modais e seus componentes
    const portModal = document.getElementById('port-modal');
    const portForm = document.getElementById('port-form');
    const addSwitchModal = document.getElementById('add-switch-modal');
    const addSwitchForm = document.getElementById('add-switch-form');
    const switchTemplateSelect = document.getElementById('switch-template');
    const editSwitchModal = document.getElementById('edit-switch-modal');
    const editSwitchForm = document.getElementById('edit-switch-form');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const deleteConfirmForm = document.getElementById('delete-confirm-form');
    const deleteSwitchNameSpan = document.getElementById('delete-switch-name');
    const deleteConfirmInput = document.getElementById('delete-confirm-input');
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');
    const logsModal = document.getElementById('logs-modal');
    const logsContainer = document.getElementById('logs-container');
    const templatesModal = document.getElementById('templates-modal');
    const templatesList = document.getElementById('templates-list');
    const templateForm = document.getElementById('template-form');
    const templateFormTitle = document.getElementById('template-form-title');
    const saveTemplateBtn = document.getElementById('save-template-btn');
    const cancelEditTemplateBtn = document.getElementById('cancel-edit-template-btn');
	
    // --- 2. VARIÁVEIS DE ESTADO DA APLICAÇÃO ---
    let appData = {};
    let templateData = {};
    let currentEditing = { switchId: null, portId: null, type: null };
    let switchToDeleteId = null;
	
    // Objeto local para a migração inicial dos modelos
    const initialSwitchTemplates = {
        "Aruba-1930-48G": { name: "Aruba 1930 48G", model: "52 Portas (48 Cobre + 4 Fibra)", layout: [{ type: 'copper', count: 48 }, { type: 'sfp', count: 4 }] },
        "ECS2100-28T": { name: "Edge-Core ECS2100-28T", model: "28 Portas (24 Cobre + 4 Fibra)", layout: [{ type: 'copper', count: 24 }, { type: 'sfp', count: 4 }] },
        "Cisco-24": { name: "Cisco-24 Portas", model: "24 Portas Cobre", layout: [{ type: 'copper', count: 24 }, { type: 'sfp', count: 4 }] },
		"Edge-Core-24": { name: "Edge-Core 24 Portas", model: "24 Portas Cobre", layout: [{ type: 'copper', count: 24 }, { type: 'sfp', count: 4 }] }
    };

    // --- 3. FUNÇÕES AUXILIARES E DE RENDERIZAÇÃO ---
    function openModal(modalElement) { if (modalElement) modalElement.style.display = 'flex'; }
    function closeModal(modalElement) { if (modalElement) modalElement.style.display = 'none'; }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function createLogEntry(action, switchId, portId, details = '') {
        const user = auth.currentUser;
        if (!user) return; 
        const logRef = ref(database, 'logs');
        const switchName = appData[switchId]?.name || 'N/A';
        const newLog = { userEmail: user.email, timestamp: serverTimestamp(), action, switchId, switchName, portId, details };
        push(logRef, newLog);
    }

    function renderAllSwitches() {
        if (!switchRack) return;
        switchRack.innerHTML = '';
        const sortedIds = Object.keys(appData).sort((a, b) => (appData[a]?.name || '').localeCompare(appData[b]?.name || ''));
        sortedIds.forEach(id => {
            const switchObj = appData[id];
            if (switchObj) {
                const switchElement = createSwitchElement(switchObj);
                switchRack.appendChild(switchElement);
            }
        });
        attachEventListeners();
    }

    function createSwitchElement(switchObj) {
        const switchDevice = document.createElement('div');
        switchDevice.className = 'switch-device';
        switchDevice.dataset.switchId = switchObj.id;
        const portsContainer = document.createElement('div');
        portsContainer.className = 'switch-ports';
        let portCounter = 1;
        (switchObj.layout || []).forEach(block => {
            const portBlock = document.createElement('div');
            portBlock.className = 'port-block';
            portBlock.style.gridTemplateColumns = `repeat(${Math.ceil(block.count / 2)}, 1fr)`;
            const oddPortsHTML = [], evenPortsHTML = [];
            for (let i = 0; i < block.count; i++) {
                const portId = portCounter++;
                const portData = switchObj.ports?.[portId] || {};
                const classList = ['port', `port-${block.type}`];
                if (portData.status === 'damaged') {
                    classList.push('status-damaged');
                } else if (portData.deviceType && portData.deviceType !== 'vazio') {
                    classList.push('status-active', `port-type-${portData.deviceType}`);
                }
                const portHTML = `<div class="${classList.join(' ')}" data-port-id="${portId}">${portId}</div>`;
                (portId % 2 !== 0) ? oddPortsHTML.push(portHTML) : evenPortsHTML.push(portHTML);
            }
            portBlock.innerHTML = oddPortsHTML.join('') + evenPortsHTML.join('');
            portsContainer.appendChild(portBlock);
        });
        const urlLink = switchObj.url ? `<a href="${switchObj.url}" target="_blank" title="Acessar interface de gerenciamento">GERENCIAR</a>` : 'N/A';
        const productUrlLink = switchObj.productUrl ? `<a href="${switchObj.productUrl}" target="_blank" title="Ver página do produto">VER PRODUTO</a>` : '';
        const modelNumberHTML = switchObj.modelNumber ? `<span>MODELO Nº: ${switchObj.modelNumber} ${productUrlLink}</span>` : '';
        const metadataHTML = `
            <div class="switch-metadata">
                <span>DESCRIÇÃO: ${switchObj.model || 'N/A'}</span>
                ${modelNumberHTML}
                <hr>
                <span>IP: ${switchObj.ip || 'N/A'}</span>
                <span>MAC: ${switchObj.mac || 'N/A'}</span>
                <span>PATRIMONIO: ${switchObj.assetId || 'N/A'}</span>
                <span>GERENCIAMENTO: ${urlLink}</span>
            </div>`;
        switchDevice.innerHTML = `
            <div class="switch-header">
                <div class="switch-info"><h3 class="switch-name">${switchObj.name}</h3><div class="switch-model">${switchObj.location || 'Sem localização'}</div></div>
                ${metadataHTML}
                <div class="switch-actions"><button class="edit-switch-btn" title="Editar dados do switch">⚙️</button><button class="delete-switch-btn" title="Apagar switch">🗑️</button></div>
            </div>`;
        switchDevice.appendChild(portsContainer);
        return switchDevice;
    }

    function populateSwitchTemplateOptions() {
        if (!switchTemplateSelect) return;
        switchTemplateSelect.innerHTML = '';
        Object.entries(templateData).forEach(([key, template]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = template.name;
            switchTemplateSelect.appendChild(option);
        });
    }
    
    function renderTemplatesList() {
        if (!templatesList) return;
        templatesList.innerHTML = '';
        Object.entries(templateData).forEach(([id, template]) => {
            const item = document.createElement('div');
            item.className = 'template-item';
            item.innerHTML = `
                <span>${template.name}</span>
                <div class="template-item-actions">
                    <button class="edit-template-btn" data-id="${id}" title="Editar">✏️</button>
                    <button class="delete-template-btn" data-id="${id}" title="Apagar">🗑️</button>
                </div>`;
            templatesList.appendChild(item);
        });
    }

    function resetTemplateForm() {
        templateForm.reset();
        templateForm.elements.templateId.value = '';
        templateFormTitle.textContent = 'Adicionar Novo Modelo';
        saveTemplateBtn.textContent = 'Adicionar Modelo';
        cancelEditTemplateBtn.style.display = 'none';
    }

    // --- 4. LISTENERS DE DADOS DO FIREBASE ---
    async function listenForTemplates() {
        const snapshot = await get(templatesRef);
        if (!snapshot.exists()) {
            await set(templatesRef, initialSwitchTemplates);
        }
        onValue(templatesRef, (snapshot) => {
            templateData = snapshot.val() || {};
            populateSwitchTemplateOptions(); 
            renderTemplatesList();
        });
    }

    function listenForData() {
        onValue(dbRef, (snapshot) => {
            appData = snapshot.val() || {};
            renderAllSwitches();
        });
    }

    // --- 5. LISTENERS DE EVENTOS DE INTERAÇÃO DO UTILIZADOR ---
    function attachEventListeners() {
        document.querySelectorAll('.port').forEach(port => {
            port.addEventListener('click', (e) => {
                const switchId = e.target.closest('.switch-device').dataset.switchId;
                const portId = e.target.dataset.portId;
                currentEditing = { type: 'port', switchId, portId };
                const portData = appData[switchId]?.ports?.[portId] || {};
                document.getElementById('port-modal-title').textContent = `Editando: ${appData[switchId]?.name} - Porta ${portId}`;
                portForm.reset();
                Object.keys(portData).forEach(key => {
                    if (portForm.elements[key]) portForm.elements[key].value = portData[key];
                });
                openModal(portModal);
            });
            port.addEventListener('mouseover', (e) => {
                const switchId = e.target.closest('.switch-device').dataset.switchId;
                const portId = e.target.dataset.portId;
                const portData = appData[switchId]?.ports?.[portId];
                if (portData && portData.status !== 'damaged' && portData.deviceType !== 'vazio') {
                    portTooltip.innerHTML = `<strong>Dispositivo:</strong> ${portData.deviceName || 'N/A'}<br><strong>Tipo:</strong> ${portData.deviceType || 'N/A'}<br><strong>IP:</strong> ${portData.ipAddress || 'N/A'}<br><strong>MAC:</strong> ${portData.macAddress || 'N/A'}<br><strong>VLAN:</strong> ${portData.vlanId || 'N/A'}`;
                    portTooltip.style.display = 'block';
                }
            });
            port.addEventListener('mousemove', (e) => {
                portTooltip.style.left = `${e.clientX + 15}px`;
                portTooltip.style.top = `${e.clientY + 15}px`;
            });
            port.addEventListener('mouseout', () => {
                portTooltip.style.display = 'none';
            });
        });

        document.querySelectorAll('.edit-switch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const switchId = e.target.closest('.switch-device').dataset.switchId;
                currentEditing = { type: 'switch', switchId };
                const switchObj = appData[switchId];
                if (!switchObj) return;
                Object.keys(switchObj).forEach(key => {
                    if (editSwitchForm.elements[key]) editSwitchForm.elements[key].value = switchObj[key];
                });
                openModal(editSwitchModal);
            });
        });

        document.querySelectorAll('.delete-switch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const switchId = e.target.closest('.switch-device').dataset.switchId;
                switchToDeleteId = switchId; 
                deleteSwitchNameSpan.textContent = appData[switchId]?.name;
                deleteConfirmInput.value = '';
                deleteConfirmBtn.disabled = true;
                openModal(deleteConfirmModal);
            });
        });
    }

    addSwitchBtn.addEventListener('click', () => openModal(addSwitchModal));
    // SUBSTITUA o seu listener de logsBtn.addEventListener('click', ...) inteiro por este:

logsBtn.addEventListener('click', () => {
    const logStartDateInput = document.getElementById('log-start-date');
    const logEndDateInput = document.getElementById('log-end-date');
    const logFilterBtn = document.getElementById('log-filter-btn');

    // Função interna para buscar e renderizar os logs
    const fetchAndRenderLogs = async (startTimestamp = null, endTimestamp = null) => {
        logsContainer.innerHTML = '<p>A carregar histórico...</p>';

        let logQuery;
        if (startTimestamp && endTimestamp) {
            // Se as datas foram fornecidas, cria uma query com intervalo
            logQuery = query(ref(database, 'logs'), orderByChild('timestamp'), startAt(startTimestamp), endAt(endTimestamp));
        } else {
            // Caso contrário, busca os últimos 100 registros como antes
            logQuery = query(ref(database, 'logs'), orderByChild('timestamp'), limitToLast(100));
        }

        try {
            const snapshot = await get(logQuery);
            if (snapshot.exists()) {
                const logsData = snapshot.val();
                const sortedLogs = Object.values(logsData).reverse();

                logsContainer.innerHTML = sortedLogs.map(log => `
                    <div class="log-entry">
                        <div><span class="user">${log.userEmail}</span> alterou a porta <strong>${log.portId}</strong> do switch <strong>${log.switchName}</strong></div>
                        <div class="details">${log.details}</div>
                        <div class="time">${new Date(log.timestamp).toLocaleString('pt-BR')}</div>
                    </div>`).join('');
            } else {
                logsContainer.innerHTML = '<p>Nenhum registro de histórico encontrado para o período selecionado.</p>';
            }
        } catch (error) {
            console.error("Erro ao buscar logs:", error);
            logsContainer.innerHTML = '<p>Ocorreu um erro ao carregar o histórico.</p>';
        }
    };

    // Listener para o botão de filtrar
    logFilterBtn.addEventListener('click', () => {
        const startDate = logStartDateInput.value;
        const endDate = logEndDateInput.value;

        if (!startDate || !endDate) {
            alert('Por favor, selecione uma data de início e de fim.');
            return;
        }

        // Converte as datas para timestamp (milissegundos)
        // Adiciona a hora para garantir que o intervalo inclua o dia inteiro
        const startTimestamp = new Date(startDate + 'T00:00:00').getTime();
        const endTimestamp = new Date(endDate + 'T23:59:59').getTime();

        fetchAndRenderLogs(startTimestamp, endTimestamp);
    });

    // Ao abrir o modal, busca os logs mais recentes por padrão
    fetchAndRenderLogs();
    openModal(logsModal);
});
    templatesBtn.addEventListener('click', () => openModal(templatesModal));
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Erro ao fazer logout:', error);
            showToast('Não foi possível sair. Tente novamente.', 'error');
        });
    });

    // Listeners de Formulários e Modais
    addSwitchForm.addEventListener('submit', e => {
        e.preventDefault();
        const templateKey = e.target.elements.templateKey.value;
        const customName = e.target.elements.customName.value;
        const template = templateData[templateKey];
        if (!template) { showToast('Modelo selecionado inválido.', 'error'); return; }
        const newSwitch = {
            id: `sw_${Date.now()}`, name: customName, model: template.model, layout: template.layout, 
            productUrl: template.productUrl || '', modelNumber: template.modelNumber || '',
            location: '', ip: '', assetId: '', mac: '', url: '', ports: {}
        };
        set(ref(database, `switches/${newSwitch.id}`), newSwitch).then(() => showToast(`Switch "${customName}" criado com sucesso!`));
        closeModal(addSwitchModal);
        e.target.reset();
    });

    editSwitchForm.addEventListener('submit', e => {
        e.preventDefault();
        if (currentEditing.type !== 'switch') return;
        const updatedData = Object.fromEntries(new FormData(e.target).entries());
        update(ref(database, `switches/${currentEditing.switchId}`), updatedData).then(() => showToast(`Switch "${updatedData.name}" atualizado!`));
        closeModal(editSwitchModal);
    });

    portForm.addEventListener('submit', e => {
        e.preventDefault();
        const { switchId, portId } = currentEditing;
        if (!switchId || !portId) return;
        const oldData = appData[switchId]?.ports?.[portId] || {};
        const newData = Object.fromEntries(new FormData(portForm).entries());
        newData.status = 'active';
        let details = 'Dados da porta atualizados. ';
        Object.keys(newData).forEach(key => { if (newData[key] !== oldData[key]) details += `[${key}: "${oldData[key] || ''}" -> "${newData[key]}"] `; });
        const portRef = ref(database, `switches/${switchId}/ports/${portId}`);
        set(portRef, newData).then(() => {
            showToast(`Porta ${portId} salva com sucesso!`);
            createLogEntry('update', switchId, portId, details.trim());
        });
        closeModal(portModal);
    });

    deleteConfirmForm.addEventListener('submit', e => {
        e.preventDefault();
        if (switchToDeleteId) {
            const switchName = appData[switchToDeleteId].name;
            remove(ref(database, `switches/${switchToDeleteId}`)).then(() => showToast(`Switch "${switchName}" apagado com sucesso.`, 'error'));
        }
        closeModal(deleteConfirmModal);
        switchToDeleteId = null;
    });

    deleteConfirmInput.addEventListener('input', () => {
        if (!switchToDeleteId) return;
        deleteConfirmBtn.disabled = deleteConfirmInput.value !== appData[switchToDeleteId].name;
    });
    
    document.getElementById('clear-data-btn').addEventListener('click', () => {
        const { switchId, portId } = currentEditing;
        if (!switchId || !portId) return;
        remove(ref(database, `switches/${switchId}/ports/${portId}`)).then(() => {
            showToast(`Dados da porta ${portId} foram limpos.`);
            createLogEntry('clear', switchId, portId, 'Todos os dados foram removidos.');
        });
        closeModal(portModal);
    });
    
    document.getElementById('mark-damaged-btn').addEventListener('click', () => {
        const { switchId, portId } = currentEditing;
        if (!switchId || !portId) return;
        update(ref(database, `switches/${switchId}/ports/${portId}`), { status: 'damaged' }).then(() => {
            showToast(`Porta ${portId} marcada como danificada.`, 'error');
            createLogEntry('damage', switchId, portId, 'Porta marcada como danificada.');
        });
        closeModal(portModal);
    });
    
    templateForm.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(templateForm);
        const id = formData.get('templateId');
        const layout = [];
        if (formData.get('b1_count')) layout.push({ type: formData.get('b1_type'), count: Number(formData.get('b1_count')) });
        if (formData.get('b2_count')) layout.push({ type: formData.get('b2_type'), count: Number(formData.get('b2_count')) });
        const newTemplate = { name: formData.get('name'), model: formData.get('model'), modelNumber: formData.get('modelNumber'), productUrl: formData.get('productUrl'), layout };
        if (id) {
            update(ref(database, `switchTemplates/${id}`), newTemplate).then(() => showToast(`Modelo "${newTemplate.name}" atualizado!`));
        } else {
            push(ref(database, 'switchTemplates'), newTemplate).then(() => showToast(`Modelo "${newTemplate.name}" adicionado!`));
        }
        resetTemplateForm();
    });

    templatesList.addEventListener('click', e => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (target.classList.contains('delete-template-btn')) {
            const templateName = templateData[id]?.name;
            if (confirm(`Tem a certeza que deseja apagar o modelo "${templateName}"?`)) {
                remove(ref(database, `switchTemplates/${id}`)).then(() => showToast(`Modelo "${templateName}" apagado.`, 'error'));
            }
        }
        if (target.classList.contains('edit-template-btn')) {
            const template = templateData[id];
            templateForm.elements.templateId.value = id;
            templateForm.elements.name.value = template.name;
            templateForm.elements.model.value = template.model;
            templateForm.elements.modelNumber.value = template.modelNumber || '';
            templateForm.elements.productUrl.value = template.productUrl || '';
            templateForm.elements.b1_count.value = '';
            templateForm.elements.b2_count.value = '';
            if (template.layout?.[0]) {
                templateForm.elements.b1_type.value = template.layout[0].type;
                templateForm.elements.b1_count.value = template.layout[0].count;
            }
            if (template.layout?.[1]) {
                templateForm.elements.b2_type.value = template.layout[1].type;
                templateForm.elements.b2_count.value = template.layout[1].count;
            }
            templateFormTitle.textContent = 'Editar Modelo';
            saveTemplateBtn.textContent = 'Salvar Alterações';
            cancelEditTemplateBtn.style.display = 'block';
        }
    });

    cancelEditTemplateBtn.addEventListener('click', resetTemplateForm);

    [portModal, addSwitchModal, editSwitchModal, deleteConfirmModal, logsModal, templatesModal].forEach(m => {
        if (m) {
            m.querySelector('.modal-close-btn').addEventListener('click', () => closeModal(m));
            m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
        }
    });

    // --- 6. INICIALIZAÇÃO DA APLICAÇÃO ---
    listenForData();
    listenForTemplates();
}