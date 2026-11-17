import { 
    fetchAppointments, 
    createAppointment, 
    updateAppointmentStatus, 
    deleteAppointment,
    getMode 
} from './api.js';

const form = document.getElementById('appointment-form');
const listEl = document.getElementById('appointments-list');
const feedbackEl = document.getElementById('feedback-msg');
const statusBadge = document.getElementById('connection-status');

const filterDate = document.getElementById('filter-date');
const filterStatus = document.getElementById('filter-status');
const btnClearFilters = document.getElementById('btn-clear-filters');

// Define a data mínima no calendário para hoje
const today = new Date().toISOString().split('T')[0];
document.getElementById('date').value = today;
document.getElementById('date').min = today;

function showFeedback(message, type) {
    feedbackEl.textContent = message;
    feedbackEl.className = `feedback ${type}`;
    setTimeout(() => {
        feedbackEl.className = 'feedback hidden';
    }, 4500);
}

function updateMetrics(items) {
    document.getElementById('stat-total').textContent = items.length;
    document.getElementById('stat-confirmed').textContent = items.filter(i => i.status === 'Confirmado').length;
    document.getElementById('stat-pending').textContent = items.filter(i => i.status === 'Pendente').length;
}

function formatDateBR(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

async function renderAppointments() {
    const filters = {
        date: filterDate.value,
        status: filterStatus.value
    };

    const items = await fetchAppointments(filters);

    // Atualiza indicador de conexão (API Node.js vs Demo Local)
    if (getMode()) {
        statusBadge.textContent = 'Modo Demo (LocalStorage)';
    } else {
        statusBadge.textContent = 'API Node.js Conectada';
    }

    // Atualiza métricas globais (sem filtros)
    const allItems = await fetchAppointments();
    updateMetrics(allItems);

    listEl.innerHTML = '';

    if (items.length === 0) {
        listEl.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Nenhum agendamento encontrado.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${formatDateBR(item.date)}</strong><br><small>${item.time}</small></td>
            <td>${item.client_name}<br><small style="color:#94a3b8;">${item.client_phone}</small></td>
            <td>${item.service}</td>
            <td><span class="status-pill status-${item.status}">${item.status}</span></td>
            <td>
                <div class="action-btns">
                    ${item.status !== 'Confirmado' ? `<button class="btn-icon btn-confirm" data-id="${item.id}" data-action="Confirmado" title="Confirmar">✓</button>` : ''}
                    ${item.status !== 'Cancelado' ? `<button class="btn-icon btn-cancel" data-id="${item.id}" data-action="Cancelado" title="Cancelar">✕</button>` : ''}
                    <button class="btn-icon btn-delete" data-id="${item.id}" data-action="delete" title="Excluir">🗑</button>
                </div>
            </td>
        `;
        listEl.appendChild(tr);
    });
}

// Submissão do formulário
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        client_name: document.getElementById('client_name').value.trim(),
        client_phone: document.getElementById('client_phone').value.trim(),
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value
    };

    try {
        await createAppointment(payload);
        showFeedback('Horário reservado com sucesso!', 'success');
        form.reset();
        document.getElementById('date').value = today;
        renderAppointments();
    } catch (err) {
        showFeedback(err.message, 'error');
    }
});

// Delegação de eventos para os botões da tabela
listEl.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
        await deleteAppointment(id);
    } else {
        await updateAppointmentStatus(id, action);
    }
    renderAppointments();
});

// Filtros
filterDate.addEventListener('change', renderAppointments);
filterStatus.addEventListener('change', renderAppointments);
btnClearFilters.addEventListener('click', () => {
    filterDate.value = '';
    filterStatus.value = 'Todos';
    renderAppointments();
});

// Inicialização
renderAppointments();