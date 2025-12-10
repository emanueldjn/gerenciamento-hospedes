// ============================================
// STORAGE SERVICE - LOCAL STORAGE MANAGER
// ============================================
// Gerencia todos os dados localmente usando localStorage
// Substitui completamente o backend (Express + Prisma + PostgreSQL)

// ============================================
// UTILITÁRIOS
// ============================================

// Gerar UUID v4 simples
const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Calcular dias entre datas
const calcularDias = (checkIn, checkOut) => {
    const diff = Math.abs(new Date(checkOut) - new Date(checkIn));
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// ============================================
// INICIALIZAÇÃO DO STORAGE
// ============================================

const STORAGE_KEYS = {
    CLIENTES: 'pousada_clientes',
    QUARTOS: 'pousada_quartos',
    RESERVAS: 'pousada_reservas',
};

// Inicializar estrutura de dados
const initStorage = () => {
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTES)) {
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUARTOS)) {
        localStorage.setItem(STORAGE_KEYS.QUARTOS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.RESERVAS)) {
        localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify([]));
    }
};

// Garantir inicialização
initStorage();

// ============================================
// FUNÇÕES AUXILIARES DE CÁLCULO
// ============================================

// Calcular status automático do quarto
const calcularStatusQuarto = (quartoId, quartos, reservas) => {
    const quarto = quartos.find(q => q.id === quartoId);
    if (!quarto) return 'DISPONIVEL';

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Prioridade 1: Flags manuais
    if (quarto.bloqueado) return 'BLOQUEADO';
    if (quarto.emManutencao) return 'MANUTENCAO';
    if (quarto.emLimpeza) return 'LIMPEZA';

    // Prioridade 2: Verificar reservas ativas
    const reservasQuarto = reservas.filter(r =>
        r.quartoId === quartoId &&
        !['CANCELADA', 'NO_SHOW', 'FINALIZADA'].includes(r.status)
    );

    const reservaAtiva = reservasQuarto.find(r => {
        const checkIn = new Date(r.checkIn);
        checkIn.setHours(0, 0, 0, 0);

        const checkOut = new Date(r.checkOut);
        checkOut.setHours(23, 59, 59, 999);

        return hoje >= checkIn && hoje < checkOut;
    });

    if (reservaAtiva) return 'OCUPADO';

    return 'DISPONIVEL';
};

// Atualizar status de um quarto
const atualizarStatusQuarto = (quartoId) => {
    const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');
    const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');

    const novoStatus = calcularStatusQuarto(quartoId, quartos, reservas);
    const quartoIndex = quartos.findIndex(q => q.id === quartoId);

    if (quartoIndex !== -1) {
        quartos[quartoIndex].statusAtual = novoStatus;
        quartos[quartoIndex].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.QUARTOS, JSON.stringify(quartos));
    }
};

// ============================================
// SERVIÇO DE CLIENTES
// ============================================

export const clienteStorage = {
    // GET ALL - Listar todos os clientes
    getAll: ({ page = 1, limit = 10, search = '' } = {}) => {
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');

        let filtered = clientes;

        // Filtrar por busca
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = clientes.filter(c =>
                c.nome?.toLowerCase().includes(searchLower) ||
                c.cpf?.includes(search) ||
                c.email?.toLowerCase().includes(searchLower)
            );
        }

        // Adicionar reservas aos clientes
        const clientesComReservas = filtered.map(cliente => ({
            ...cliente,
            reservas: reservas
                .filter(r => r.clienteId === cliente.id)
                .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
                .slice(0, 5)
        }));

        // Paginação
        const skip = (page - 1) * limit;
        const paginatedClientes = clientesComReservas.slice(skip, skip + limit);

        return {
            clientes: paginatedClientes,
            pagination: {
                total: filtered.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(filtered.length / limit),
            },
        };
    },

    // GET BY ID - Buscar cliente por ID
    getById: (id) => {
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');

        const cliente = clientes.find(c => c.id === id);
        if (!cliente) {
            throw new Error('Cliente não encontrado');
        }

        return {
            ...cliente,
            reservas: reservas
                .filter(r => r.clienteId === id)
                .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
        };
    },

    // CREATE - Criar novo cliente
    create: (data) => {
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');

        // Validações
        if (!data.nome || !data.cpf || !data.telefone || !data.email) {
            throw new Error('Campos obrigatórios: nome, cpf, telefone, email');
        }

        // Verificar CPF ou email duplicado
        const existente = clientes.find(c => c.cpf === data.cpf || c.email === data.email);
        if (existente) {
            throw new Error('CPF ou email já cadastrado');
        }

        const novoCliente = {
            id: generateId(),
            nome: data.nome,
            cpf: data.cpf,
            telefone: data.telefone,
            email: data.email,
            endereco: data.endereco || null,
            cidade: data.cidade || null,
            estado: data.estado || null,
            cep: data.cep || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        clientes.push(novoCliente);
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));

        return novoCliente;
    },

    // UPDATE - Atualizar cliente
    update: (id, data) => {
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const index = clientes.findIndex(c => c.id === id);

        if (index === -1) {
            throw new Error('Cliente não encontrado');
        }

        // Verificar CPF ou email duplicado (exceto o próprio)
        if (data.cpf || data.email) {
            const conflito = clientes.find(c =>
                c.id !== id && (c.cpf === data.cpf || c.email === data.email)
            );
            if (conflito) {
                throw new Error('CPF ou email já cadastrado para outro cliente');
            }
        }

        const clienteAtualizado = {
            ...clientes[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };

        clientes[index] = clienteAtualizado;
        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));

        return clienteAtualizado;
    },

    // DELETE - Deletar cliente
    delete: (id) => {
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');

        const index = clientes.findIndex(c => c.id === id);
        if (index === -1) {
            throw new Error('Cliente não encontrado');
        }

        // Deletar cliente (deletar reservas em cascata)
        clientes.splice(index, 1);
        const reservasRestantes = reservas.filter(r => r.clienteId !== id);

        localStorage.setItem(STORAGE_KEYS.CLIENTES, JSON.stringify(clientes));
        localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservasRestantes));

        return { message: 'Cliente deletado com sucesso' };
    },
};

// ============================================
// SERVIÇO DE QUARTOS
// ============================================

export const quartoStorage = {
    // GET ALL - Listar todos os quartos
    getAll: ({ search = '', capacidade } = {}) => {
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');

        let filtered = quartos;

        // Filtrar por busca
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = quartos.filter(q =>
                q.numero?.toLowerCase().includes(searchLower) ||
                q.tipo?.toLowerCase().includes(searchLower)
            );
        }

        // Filtrar por capacidade
        if (capacidade) {
            filtered = filtered.filter(q => q.capacidade >= parseInt(capacidade));
        }

        // Atualizar status de todos os quartos
        const quartosAtualizados = filtered.map(quarto => {
            const statusCalculado = calcularStatusQuarto(quarto.id, quartos, reservas);
            return {
                ...quarto,
                statusAtual: statusCalculado,
                status: statusCalculado, // Compatibilidade com frontend
            };
        });

        // Salvar status atualizados
        const quartosCompletos = quartos.map(q => {
            const atualizado = quartosAtualizados.find(qa => qa.id === q.id);
            return atualizado || q;
        });
        localStorage.setItem(STORAGE_KEYS.QUARTOS, JSON.stringify(quartosCompletos));

        return quartosAtualizados.sort((a, b) => a.numero.localeCompare(b.numero));
    },

    // GET DISPONIVEIS - Listar quartos disponíveis para um período
    getDisponiveis: ({ checkIn, checkOut, capacidade } = {}) => {
        if (!checkIn || !checkOut) {
            throw new Error('checkIn e checkOut são obrigatórios');
        }

        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');

        const dataCheckIn = new Date(checkIn);
        const dataCheckOut = new Date(checkOut);

        // Filtrar quartos não bloqueados e com capacidade adequada
        let quartosDisponiveis = quartos.filter(q =>
            !q.bloqueado &&
            !q.emManutencao &&
            (!capacidade || q.capacidade >= parseInt(capacidade))
        );

        // Verificar conflitos de reserva
        quartosDisponiveis = quartosDisponiveis.filter(quarto => {
            const conflito = reservas.find(r => {
                if (r.quartoId !== quarto.id) return false;
                if (['CANCELADA', 'NO_SHOW', 'FINALIZADA'].includes(r.status)) return false;

                const rCheckIn = new Date(r.checkIn);
                const rCheckOut = new Date(r.checkOut);

                // Verificar sobreposição de datas
                return (
                    (dataCheckIn >= rCheckIn && dataCheckIn < rCheckOut) ||
                    (dataCheckOut > rCheckIn && dataCheckOut <= rCheckOut) ||
                    (dataCheckIn <= rCheckIn && dataCheckOut >= rCheckOut)
                );
            });

            return !conflito;
        });

        return quartosDisponiveis;
    },

    // CREATE - Criar novo quarto
    create: (data) => {
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');

        // Verificar se número já existe
        const existente = quartos.find(q => q.numero === data.numero);
        if (existente) {
            throw new Error('Já existe um quarto com este número');
        }

        const novoQuarto = {
            id: generateId(),
            numero: data.numero,
            tipo: data.tipo,
            andar: data.andar,
            capacidade: data.capacidade || 2,
            valorDiaria: data.valorDiaria ? parseFloat(data.valorDiaria) : null,
            statusAtual: 'DISPONIVEL',
            status: 'DISPONIVEL', // Compatibilidade
            emLimpeza: false,
            emManutencao: false,
            bloqueado: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        quartos.push(novoQuarto);
        localStorage.setItem(STORAGE_KEYS.QUARTOS, JSON.stringify(quartos));

        return novoQuarto;
    },

    // UPDATE - Atualizar quarto
    update: (id, data) => {
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');
        const index = quartos.findIndex(q => q.id === id);

        if (index === -1) {
            throw new Error('Quarto não encontrado');
        }

        const quartoAtualizado = {
            ...quartos[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };

        // Se alterou flags, recalcular status
        const novoStatus = calcularStatusQuarto(id, [quartoAtualizado], reservas);
        quartoAtualizado.statusAtual = novoStatus;
        quartoAtualizado.status = novoStatus;

        quartos[index] = quartoAtualizado;
        localStorage.setItem(STORAGE_KEYS.QUARTOS, JSON.stringify(quartos));

        return quartoAtualizado;
    },

    // UPDATE STATUS - Atualizar apenas flags de controle
    updateStatus: (id, data) => {
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');
        const index = quartos.findIndex(q => q.id === id);

        if (index === -1) {
            throw new Error('Quarto não encontrado');
        }

        if (data.emLimpeza !== undefined) quartos[index].emLimpeza = Boolean(data.emLimpeza);
        if (data.emManutencao !== undefined) quartos[index].emManutencao = Boolean(data.emManutencao);
        if (data.bloqueado !== undefined) quartos[index].bloqueado = Boolean(data.bloqueado);

        quartos[index].updatedAt = new Date().toISOString();

        // Recalcular status
        const novoStatus = calcularStatusQuarto(id, quartos, reservas);
        quartos[index].statusAtual = novoStatus;
        quartos[index].status = novoStatus;

        localStorage.setItem(STORAGE_KEYS.QUARTOS, JSON.stringify(quartos));

        return quartos[index];
    },

    // DELETE - Deletar quarto
    delete: (id) => {
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');

        const index = quartos.findIndex(q => q.id === id);
        if (index === -1) {
            throw new Error('Quarto não encontrado');
        }

        // Verificar se tem reservas ativas
        const reservasAtivas = reservas.filter(r =>
            r.quartoId === id && ['CONFIRMADA', 'EM_ANDAMENTO'].includes(r.status)
        ).length;

        if (reservasAtivas > 0) {
            throw new Error(`Não é possível deletar. Quarto possui ${reservasAtivas} reserva(s) ativa(s).`);
        }

        quartos.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.QUARTOS, JSON.stringify(quartos));

        return { message: 'Quarto deletado com sucesso' };
    },
};

// ============================================
// SERVIÇO DE RESERVAS
// ============================================

export const reservaStorage = {
    // GET ALL - Listar todas as reservas
    getAll: ({ status, dataInicio, dataFim } = {}) => {
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');

        let filtered = reservas;

        // Filtrar por status
        if (status) {
            filtered = filtered.filter(r => r.status === status);
        }

        // Filtrar por data
        if (dataInicio || dataFim) {
            filtered = filtered.filter(r => {
                const checkIn = new Date(r.checkIn);
                if (dataInicio && checkIn < new Date(dataInicio)) return false;
                if (dataFim && checkIn > new Date(dataFim)) return false;
                return true;
            });
        }

        // Adicionar dados de cliente e quarto
        const reservasCompletas = filtered.map(reserva => ({
            ...reserva,
            cliente: clientes.find(c => c.id === reserva.clienteId),
            quarto: quartos.find(q => q.id === reserva.quartoId),
        }));

        return reservasCompletas.sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
    },

    // GET BY ID - Buscar reserva por ID
    getById: (id) => {
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');

        const reserva = reservas.find(r => r.id === id);
        if (!reserva) {
            throw new Error('Reserva não encontrada');
        }

        return {
            ...reserva,
            cliente: clientes.find(c => c.id === reserva.clienteId),
            quarto: quartos.find(q => q.id === reserva.quartoId),
        };
    },

    // CREATE - Criar nova reserva (COM VALIDAÇÕES)
    create: (data) => {
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');

        // Validações básicas
        if (!data.clienteId || (!data.quartoId && !data.numeroQuarto) || !data.checkIn || !data.checkOut || data.valor === undefined) {
            throw new Error('Campos obrigatórios: clienteId, quartoId (ou numeroQuarto), checkIn, checkOut, valor');
        }

        // Verificar se cliente existe
        const cliente = clientes.find(c => c.id === data.clienteId);
        if (!cliente) {
            throw new Error('Cliente não encontrado');
        }

        // Buscar quarto
        let quarto;
        if (data.quartoId) {
            quarto = quartos.find(q => q.id === data.quartoId);
        } else if (data.numeroQuarto) {
            quarto = quartos.find(q => q.numero === data.numeroQuarto);
        }

        if (!quarto) {
            throw new Error('Quarto não encontrado');
        }

        // Validar datas
        const dataCheckIn = new Date(data.checkIn);
        const dataCheckOut = new Date(data.checkOut);

        if (dataCheckOut <= dataCheckIn) {
            throw new Error('Data de check-out deve ser posterior ao check-in');
        }

        // Não permitir reservar para o passado
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const checkInDate = new Date(dataCheckIn);
        checkInDate.setHours(0, 0, 0, 0);

        if (checkInDate < hoje) {
            throw new Error('Não é possível reservar para o passado');
        }

        // Validar capacidade
        const numHospedes = data.numHospedes || 1;
        if (numHospedes > quarto.capacidade) {
            throw new Error(`Quarto ${quarto.numero} suporta no máximo ${quarto.capacidade} pessoa(s)`);
        }

        // Verificar conflito de datas
        const conflito = reservas.find(r => {
            if (r.quartoId !== quarto.id) return false;
            if (['CANCELADA', 'NO_SHOW', 'FINALIZADA'].includes(r.status)) return false;

            const rCheckIn = new Date(r.checkIn);
            const rCheckOut = new Date(r.checkOut);

            return (
                (dataCheckIn >= rCheckIn && dataCheckIn < rCheckOut) ||
                (dataCheckOut > rCheckIn && dataCheckOut <= rCheckOut) ||
                (dataCheckIn <= rCheckIn && dataCheckOut >= rCheckOut)
            );
        });

        if (conflito) {
            const cliente = clientes.find(c => c.id === conflito.clienteId);
            const conflictCheckIn = new Date(conflito.checkIn).toLocaleDateString('pt-BR');
            const conflictCheckOut = new Date(conflito.checkOut).toLocaleDateString('pt-BR');
            throw new Error(
                `Quarto ${quarto.numero} já possui reserva de ${conflictCheckIn} a ${conflictCheckOut} (${cliente?.nome})`
            );
        }

        // Calcular valor total
        const dias = calcularDias(data.checkIn, data.checkOut);
        const valorTotal = parseFloat(data.valor) * dias;

        const novaReserva = {
            id: generateId(),
            clienteId: data.clienteId,
            quartoId: quarto.id,
            numeroQuarto: quarto.numero,
            checkIn: new Date(data.checkIn).toISOString(),
            checkOut: new Date(data.checkOut).toISOString(),
            status: data.status || 'CONFIRMADA',
            valor: parseFloat(data.valor),
            valorTotal,
            numHospedes,
            observacoes: data.observacoes || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        reservas.push(novaReserva);
        localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservas));

        // Atualizar status do quarto
        atualizarStatusQuarto(quarto.id);

        return {
            ...novaReserva,
            cliente,
            quarto,
        };
    },

    // UPDATE - Atualizar reserva (COM VALIDAÇÕES)
    update: (id, data) => {
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const quartos = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUARTOS) || '[]');

        const index = reservas.findIndex(r => r.id === id);
        if (index === -1) {
            throw new Error('Reserva não encontrada');
        }

        const reservaExistente = reservas[index];
        let quarto;

        // Se está mudando de quarto ou datas, validar novamente
        if (data.quartoId || data.numeroQuarto || data.checkIn || data.checkOut) {
            const quartoId = data.quartoId || reservaExistente.quartoId;
            const numeroQuarto = data.numeroQuarto || reservaExistente.numeroQuarto;

            if (quartoId) {
                quarto = quartos.find(q => q.id === quartoId);
            } else if (numeroQuarto) {
                quarto = quartos.find(q => q.numero === numeroQuarto);
            }

            if (!quarto) {
                throw new Error('Quarto não encontrado');
            }

            const checkIn = data.checkIn || reservaExistente.checkIn;
            const checkOut = data.checkOut || reservaExistente.checkOut;
            const numHospedes = data.numHospedes || reservaExistente.numHospedes;

            const dataCheckIn = new Date(checkIn);
            const dataCheckOut = new Date(checkOut);

            if (dataCheckOut <= dataCheckIn) {
                throw new Error('Data de check-out deve ser posterior ao check-in');
            }

            // Validar capacidade
            if (numHospedes > quarto.capacidade) {
                throw new Error(`Quarto ${quarto.numero} suporta no máximo ${quarto.capacidade} pessoa(s)`);
            }

            // Verificar conflito (excluindo a própria reserva)
            const conflito = reservas.find(r => {
                if (r.id === id) return false;
                if (r.quartoId !== quarto.id) return false;
                if (['CANCELADA', 'NO_SHOW', 'FINALIZADA'].includes(r.status)) return false;

                const rCheckIn = new Date(r.checkIn);
                const rCheckOut = new Date(r.checkOut);

                return (
                    (dataCheckIn >= rCheckIn && dataCheckIn < rCheckOut) ||
                    (dataCheckOut > rCheckIn && dataCheckOut <= rCheckOut) ||
                    (dataCheckIn <= rCheckIn && dataCheckOut >= rCheckOut)
                );
            });

            if (conflito) {
                const clienteConflito = clientes.find(c => c.id === conflito.clienteId);
                const conflictCheckIn = new Date(conflito.checkIn).toLocaleDateString('pt-BR');
                const conflictCheckOut = new Date(conflito.checkOut).toLocaleDateString('pt-BR');
                throw new Error(
                    `Quarto ${quarto.numero} já possui reserva de ${conflictCheckIn} a ${conflictCheckOut} (${clienteConflito?.nome})`
                );
            }
        }

        // Calcular novo valor total se necessário
        let novoValorTotal;
        if (data.valor !== undefined || data.checkIn || data.checkOut) {
            const novoValor = data.valor !== undefined ? parseFloat(data.valor) : reservaExistente.valor;
            const novoCheckIn = data.checkIn || reservaExistente.checkIn;
            const novoCheckOut = data.checkOut || reservaExistente.checkOut;
            const dias = calcularDias(novoCheckIn, novoCheckOut);
            novoValorTotal = novoValor * dias;
        }

        const reservaAtualizada = {
            ...reservaExistente,
            ...data,
            ...(quarto && { quartoId: quarto.id, numeroQuarto: quarto.numero }),
            ...(novoValorTotal && { valorTotal: novoValorTotal }),
            updatedAt: new Date().toISOString(),
        };

        reservas[index] = reservaAtualizada;
        localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservas));

        // Atualizar status dos quartos envolvidos
        if (quarto && quarto.id !== reservaExistente.quartoId) {
            atualizarStatusQuarto(reservaExistente.quartoId); // Quarto antigo
        }
        atualizarStatusQuarto(reservaAtualizada.quartoId); // Quarto novo/atual

        return {
            ...reservaAtualizada,
            cliente: clientes.find(c => c.id === reservaAtualizada.clienteId),
            quarto: quartos.find(q => q.id === reservaAtualizada.quartoId),
        };
    },

    // DELETE - Deletar reserva
    delete: (id) => {
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');
        const index = reservas.findIndex(r => r.id === id);

        if (index === -1) {
            throw new Error('Reserva não encontrada');
        }

        const reserva = reservas[index];
        const quartoId = reserva.quartoId;

        reservas.splice(index, 1);
        localStorage.setItem(STORAGE_KEYS.RESERVAS, JSON.stringify(reservas));

        // Atualizar status do quarto
        if (quartoId) {
            atualizarStatusQuarto(quartoId);
        }

        return { message: 'Reserva deletada com sucesso' };
    },
};

// ============================================
// SERVIÇO DE DASHBOARD
// ============================================

export const dashboardStorage = {
    // GET STATS - Estatísticas do dashboard
    getStats: () => {
        const clientes = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTES) || '[]');
        const reservas = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESERVAS) || '[]');

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        // Total de clientes
        const totalClientes = clientes.length;

        // Total de reservas
        const totalReservas = reservas.length;

        // Reservas ativas
        const reservasAtivas = reservas.filter(r => r.status === 'EM_ANDAMENTO').length;

        // Check-ins hoje
        const checkInsHoje = reservas.filter(r => {
            const checkIn = new Date(r.checkIn);
            return checkIn >= hoje && checkIn < amanha;
        }).length;

        // Check-outs hoje
        const checkOutsHoje = reservas.filter(r => {
            const checkOut = new Date(r.checkOut);
            return checkOut >= hoje && checkOut < amanha;
        }).length;

        // Receita total
        const receitaTotal = reservas
            .filter(r => ['FINALIZADA', 'EM_ANDAMENTO'].includes(r.status))
            .reduce((sum, r) => sum + (r.valor || 0), 0);

        // Receita do mês atual
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

        const receitaMesAtual = reservas
            .filter(r => {
                if (!['FINALIZADA', 'EM_ANDAMENTO'].includes(r.status)) return false;
                const checkIn = new Date(r.checkIn);
                return checkIn >= inicioMes && checkIn <= fimMes;
            })
            .reduce((sum, r) => sum + (r.valor || 0), 0);

        // Reservas por status
        const reservasPorStatus = reservas.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {});

        // Próximas reservas
        const proximasReservas = reservas
            .filter(r => new Date(r.checkIn) >= hoje && r.status === 'CONFIRMADA')
            .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn))
            .slice(0, 5)
            .map(r => ({
                ...r,
                cliente: clientes.find(c => c.id === r.clienteId),
            }));

        // Reservas recentes
        const reservasRecentes = reservas
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map(r => ({
                ...r,
                cliente: clientes.find(c => c.id === r.clienteId),
            }));

        return {
            totais: {
                clientes: totalClientes,
                reservas: totalReservas,
                reservasAtivas,
                checkInsHoje,
                checkOutsHoje,
            },
            receita: {
                total: receitaTotal,
                mesAtual: receitaMesAtual,
            },
            reservasPorStatus,
            proximasReservas,
            reservasRecentes,
        };
    },
};
