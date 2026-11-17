const API_URL = 'http://localhost:3000/api/appointments';
const STORAGE_KEY = 'agendapro_fallback_data';

let isOfflineMode = false;

export function getMode() {
    return isOfflineMode;
}

// Funções auxiliares de fallback (caso o back-end local não esteja ativo)
function getLocalData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Dados iniciais de demonstração
    const demo = [
        { id: 1, client_name: 'Carlos Eduardo', client_phone: '(47) 99123-4567', service: 'Consultoria Técnica (1h)', date: new Date().toISOString().split('T')[0], time: '10:00', status: 'Confirmado' },
        { id: 2, client_name: 'Fernanda Costa', client_phone: '(47) 98877-6655', service: 'Avaliação Inicial (45min)', date: new Date().toISOString().split('T')[0], time: '14:00', status: 'Pendente' }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
    return demo;
}

export async function fetchAppointments(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.date) params.append('date', filters.date);
        if (filters.status && filters.status !== 'Todos') params.append('status', filters.status);

        const res = await fetch(`${API_URL}?${params.toString()}`);
        if (!res.ok) throw new Error('Falha na API');
        isOfflineMode = false;
        return await res.json();
    } catch (error) {
        isOfflineMode = true;
        let data = getLocalData();
        if (filters.date) data = data.filter(item => item.date === filters.date);
        if (filters.status && filters.status !== 'Todos') data = data.filter(item => item.status === filters.status);
        return data.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    }
}

export async function createAppointment(payload) {
    if (!isOfflineMode) {
        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erro ao agendar.');
            return data;
        } catch (err) {
            if (err.message.includes('Horário indisponível')) throw err;
            isOfflineMode = true;
        }
    }

    // Validação de conflito no modo demonstração (LocalStorage)
    const data = getLocalData();
    const conflict = data.find(item => item.date === payload.date && item.time === payload.time && item.status !== 'Cancelado');
    if (conflict) {
        throw new Error(`Horário indisponível! Já existe uma reserva para ${payload.date} às ${payload.time}.`);
    }

    const newItem = { id: Date.now(), ...payload, status: 'Pendente' };
    data.push(newItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return newItem;
}

export async function updateAppointmentStatus(id, status) {
    if (!isOfflineMode) {
        const res = await fetch(`${API_URL}/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Erro ao atualizar status.');
        return await res.json();
    }

    const data = getLocalData().map(item => item.id === Number(id) ? { ...item, status } : item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function deleteAppointment(id) {
    if (!isOfflineMode) {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao deletar.');
        return await res.json();
    }

    const data = getLocalData().filter(item => item.id !== Number(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}