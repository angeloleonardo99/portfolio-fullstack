const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Inicialização do Banco de Dados SQLite
const dbPath = path.resolve(__dirname, 'agendamentos.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Erro ao conectar ao SQLite:', err.message);
    else console.log('Conectado ao banco SQLite com sucesso.');
});

// Criação da tabela de agendamentos
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name TEXT NOT NULL,
            client_phone TEXT NOT NULL,
            service TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            status TEXT DEFAULT 'Pendente',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// [GET] Listar todos os agendamentos (ordenados por data e hora)
app.get('/api/appointments', (req, res) => {
    const { date, status } = req.query;
    let query = 'SELECT * FROM appointments WHERE 1=1';
    const params = [];

    if (date) {
        query += ' AND date = ?';
        params.push(date);
    }
    if (status && status !== 'Todos') {
        query += ' AND status = ?';
        params.push(status);
    }

    query += ' ORDER BY date ASC, time ASC';

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Erro ao buscar agendamentos.' });
        res.json(rows);
    });
});

// [POST] Criar novo agendamento com verificação de conflito de horário
app.post('/api/appointments', (req, res) => {
    const { client_name, client_phone, service, date, time } = req.body;

    if (!client_name || !client_phone || !service || !date || !time) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    // Regra de Negócio: Verifica se já existe agendamento ativo no mesmo dia e horário
    const checkSql = `
        SELECT id FROM appointments 
        WHERE date = ? AND time = ? AND status != 'Cancelado'
    `;

    db.get(checkSql, [date, time], (err, existing) => {
        if (err) return res.status(500).json({ error: 'Erro interno ao verificar disponibilidade.' });
        
        if (existing) {
            return res.status(409).json({ 
                error: `Horário indisponível! Já existe uma reserva confirmada ou pendente para ${date} às ${time}.` 
            });
        }

        const insertSql = `
            INSERT INTO appointments (client_name, client_phone, service, date, time, status)
            VALUES (?, ?, ?, ?, ?, 'Pendente')
        `;

        db.run(insertSql, [client_name, client_phone, service, date, time], function (err) {
            if (err) return res.status(500).json({ error: 'Erro ao salvar agendamento.' });
            res.status(201).json({
                id: this.lastID,
                client_name,
                client_phone,
                service,
                date,
                time,
                status: 'Pendente'
            });
        });
    });
});

// [PATCH] Atualizar status do agendamento (Confirmado, Cancelado, Concluído)
app.patch('/api/appointments/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Pendente', 'Confirmado', 'Cancelado'];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status inválido.' });
    }

    db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id], function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao atualizar status.' });
        if (this.changes === 0) return res.status(404).json({ error: 'Agendamento não encontrado.' });
        res.json({ message: 'Status atualizado com sucesso.', id, status });
    });
});

// [DELETE] Excluir registro
app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM appointments WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: 'Erro ao remover registro.' });
        if (this.changes === 0) return res.status(404).json({ error: 'Agendamento não encontrado.' });
        res.json({ message: 'Agendamento removido.' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});