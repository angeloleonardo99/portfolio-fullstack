# 📅 AgendaPro | Sistema de Agendamento e Reservas Full Stack

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/)

Aplicação web Full Stack desenvolvida para gestão de agendamentos e reservas de serviços, implementando validação de conflitos de horário no back-end, painel administrativo com filtros dinâmicos e persistência relacional.

🔗 **[Testar Demonstração Online (GitHub Pages)](https://angeloleonardo99.github.io/portfolio-fullstack/)**
<img width="1266" height="720" alt="image" src="https://github.com/user-attachments/assets/561e7186-dad5-461b-9c96-e89bcbdc70a3" />


---

## Funcionalidades e Regras de Negócio

* **Bloqueio de Conflito de Horários:** O back-end valida automaticamente se já existe uma reserva ativa (`Pendente` ou `Confirmado`) para a mesma data e horário antes de inserir no banco de dados (retornando HTTP `409 Conflict`).
* **Dashboard de Métricas:** Contabilização em tempo real do total de reservas, atendimentos confirmados e pendentes.
* **Gestão de Status e Filtros:** Alteração rápida de estado (`Confirmado`, `Cancelado`, `Excluído`) e filtragem por data específica ou status.
* **Resiliência (Fallback Automático):** Caso a API Node.js não esteja em execução localmente, o front-end alterna automaticamente para um modo de demonstração funcional usando `LocalStorage`.

---

## Endpoints da API RESTful

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/api/appointments` | Lista todos os agendamentos (aceita query params `?date=` e `?status=`). |
| `POST` | `/api/appointments` | Cria uma nova reserva após validar disponibilidade de horário. |
| `PATCH` | `/api/appointments/:id/status` | Atualiza o status da reserva (`Pendente`, `Confirmado`, `Cancelado`). |
| `DELETE` | `/api/appointments/:id` | Remove o registro do banco de dados. |

---

## ⚙️ Como Executar Localmente

1. **Clonar o repositório:**
   ```bash
   git clone [https://github.com/angeloleonardo99/sistema-agendamento.git](https://github.com/angeloleonardo99/sistema-agendamento.git)
   cd sistema-agendamento
