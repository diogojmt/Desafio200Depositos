document.addEventListener('DOMContentLoaded', () => {
    // Seleção de elementos do DOM
    const totalDisplay = document.getElementById('total');
    const dataInicialDisplay = document.getElementById('data-inicial');
    const dataFinalDisplay = document.getElementById('data-final');
    const mensagemMotivacionalDisplay = document.getElementById('mensagem-motivacional');
    const historicoDepositos = document.getElementById('historicoDepositos');
    const sugestoesDepositos = document.getElementById('sugestoesDepositos');
    const slider = document.getElementById('dias-limite');
    const diasLimiteValorDisplay = document.getElementById('dias-limite-valor');
    const tabela = document.getElementById('depositos');
    const toggleHistoricoBtn = document.getElementById('toggleHistorico');
    const historicoDepositosContainer = document.getElementById('historicoDepositosContainer');
    const progressoCanvas = document.getElementById('progressoGrafico').getContext('2d');
    
    let total = 0;
    let limiteDias = parseInt(localStorage.getItem('limiteDias')) || 100; // Recuperar limite de dias do localStorage
    let depositos = JSON.parse(localStorage.getItem('depositos')) || [];
    let startDate = localStorage.getItem('startDate') || new Date().toISOString().split('T')[0]; // Garantir o armazenamento da data de início
    let ultimoDeposito = Date.now();
    let progressoGrafico = null;

    // Função de inicialização do desafio
    function iniciarDesafio() {
        localStorage.setItem('startDate', startDate); // Garantir que a data de início está armazenada

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + limiteDias);

        dataInicialDisplay.textContent = `Data Inicial: ${startDateObj.toLocaleDateString()}`;
        dataFinalDisplay.textContent = `Data Final: ${endDateObj.toLocaleDateString()}`;

        atualizarTotal();
        carregarMensagens();
        atualizarGrafico();
        atualizarHistorico();
        criarTabela();
        gerarSugestoesDepositos();
    }

    // Função para atualizar o valor do slider
    slider.value = limiteDias; // Inicializar o slider com o valor salvo
    diasLimiteValorDisplay.textContent = `${limiteDias} dias`;

    slider.addEventListener('input', () => {
        limiteDias = parseInt(slider.value);
        localStorage.setItem('limiteDias', limiteDias); // Salvar o valor atualizado no localStorage
        diasLimiteValorDisplay.textContent = `${limiteDias} dias`;
        iniciarDesafio(); // Recarregar a lógica do desafio
    });

    // Função para criar a tabela de depósitos
function criarTabela() {
    // Certifique-se de que a tabela está presente no DOM
    if (!tabela) {
        console.error('Elemento da tabela não encontrado no DOM.');
        return;
    }

    // Limpar tabela antes de criar
    tabela.innerHTML = ''; 

    let contador = 1;
    for (let i = 0; i < 40; i++) { // Criar 40 linhas
        const row = document.createElement('tr'); // Criar linha

        // Adicionar ícone de sucesso na primeira célula
        const successIconCell = document.createElement('td');
        const successIcon = document.createElement('span');
        successIcon.classList.add('success-icon');
        successIcon.innerHTML = '✔'; // Ícone de sucesso (você pode substituir por um ícone gráfico)
        successIconCell.appendChild(successIcon);
        row.appendChild(successIconCell); // Adicionar a célula do ícone à linha

        for (let j = 0; j < 5; j++) { // Criar 5 células por linha
            const cell = document.createElement('td');
            cell.textContent = contador;
            cell.dataset.value = contador;

            // Verificar se o depósito já foi feito e marcar a célula
            if (depositos.find(d => d.valor === contador)) {
                cell.classList.add('selected');
            }

            // Adicionar evento de clique para selecionar depósito
            cell.addEventListener('click', () => {
                const valorClicado = parseInt(cell.dataset.value, 10);
                if (!cell.classList.contains('selected') && !depositos.some(d => d.valor === valorClicado)) {
                    cell.classList.add('selected');
                    depositos.push({ valor: valorClicado, data: new Date().toISOString() });
                    localStorage.setItem('depositos', JSON.stringify(depositos));
                    atualizarTotal();
                    atualizarHistorico();
                    verificarMarcos();
                    atualizarGrafico();
                    ultimoDeposito = Date.now();

                    // Verificar se toda a linha foi selecionada
                    verificarLinhaCompletamenteSelecionada(row);
                }
            });

            row.appendChild(cell); // Adicionar célula à linha
            contador++;
        }
        tabela.appendChild(row); // Adicionar linha à tabela

        // Verificar no carregamento inicial se a linha já está completamente selecionada
        verificarLinhaCompletamenteSelecionada(row);
    }
}


	// Função para verificar se toda a linha foi selecionada
	function verificarLinhaCompletamenteSelecionada(row) {
		const cells = row.querySelectorAll('td:not(:first-child)'); // Selecionar todas as células, exceto a do ícone
		const allSelected = Array.from(cells).every(cell => cell.classList.contains('selected'));

		// Exibir o ícone se todos os depósitos da linha forem selecionados
		const successIcon = row.querySelector('.success-icon');
		if (allSelected) {
			successIcon.classList.add('show');
		} else {
			successIcon.classList.remove('show');
		}
	}

    // Função para calcular o total de depósitos
    function calcularTotal() {
        total = depositos.reduce((acc, deposito) => acc + deposito.valor, 0);
    }

    // Função para atualizar o total de depósitos e os dias restantes
    function atualizarTotal() {
        calcularTotal();
        totalDisplay.textContent = `R$ ${total.toFixed(2)}`;
        const diasRestantes = calcularDiasRestantes();
        const mensagem = `Faltam ${diasRestantes} dias para terminar o desafio e você já realizou ${depositos.length} depósitos totalizando R$ ${total.toFixed(2)}.`;
        document.getElementById('mensagem').textContent = mensagem;
        calcularProbabilidade();
    }

    // Função para calcular a probabilidade de sucesso
    function calcularProbabilidade() {
        const diasRestantes = calcularDiasRestantes();
        const depositosRestantes = 200 - depositos.length;

        if (diasRestantes <= 0) {
            document.getElementById('probabilidade').textContent = "Probabilidade de Sucesso: 0%";
            return;
        }

        const taxaNecessaria = depositosRestantes / diasRestantes;
        const diasPassados = calcularDiasPassados();
        const taxaAtual = diasPassados > 0 ? depositos.length / diasPassados : 0;
        const probabilidade = taxaAtual >= taxaNecessaria ? 100 : Math.min((taxaAtual / taxaNecessaria) * 100, 100);

        document.getElementById('probabilidade').textContent = `Probabilidade de Sucesso: ${probabilidade.toFixed(2)}%`;
    }

    // Função para calcular dias restantes
    function calcularDiasRestantes() {
        const hoje = new Date();
        const startDateObj = new Date(startDate);
        const diasPassados = Math.floor((hoje - startDateObj) / (1000 * 60 * 60 * 24));
        return Math.max(limiteDias - diasPassados, 0);
    }

    // Função para calcular quantos dias já passaram desde o início do desafio
    function calcularDiasPassados() {
        const hoje = new Date();
        const startDateObj = new Date(startDate);
        return Math.floor((hoje - startDateObj) / (1000 * 60 * 60 * 24));
    }

    // Função para atualizar o gráfico de progresso
    function atualizarGrafico() {
        if (progressoGrafico) progressoGrafico.destroy();

        progressoGrafico = new Chart(progressoCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Depósitos Realizados', 'Depósitos Restantes'],
                datasets: [{
                    data: [depositos.length, 200 - depositos.length],
                    backgroundColor: ['#28a745', '#e9ecef']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            }
        });
    }

    // Função para alternar a visibilidade do histórico de depósitos
    toggleHistoricoBtn.addEventListener('click', () => {
        historicoDepositosContainer.classList.toggle('expanded');
        toggleHistoricoBtn.textContent = historicoDepositosContainer.classList.contains('expanded') ? 'Esconder Histórico' : 'Mostrar Histórico';
    });

    // Função para atualizar o histórico de depósitos
    function atualizarHistorico() {
        historicoDepositos.innerHTML = '';
        depositos.forEach((deposito, index) => {
            const li = document.createElement('li');
            const dataDeposito = new Date(deposito.data).toLocaleDateString();
            li.textContent = `Depósito ${index + 1}: Valor R$ ${deposito.valor.toFixed(2)} - Data: ${dataDeposito}`;
            historicoDepositos.appendChild(li);
        });
    }

    // Função para verificar se o usuário atingiu marcos
    function verificarMarcos() {
        if ([50, 100, 150].includes(depositos.length)) {
            alert(`Parabéns! Você atingiu o marco de ${depositos.length} depósitos! Continue firme no desafio.`);
        }
    }

    // Função para gerar sugestões de depósitos futuros
    function gerarSugestoesDepositos() {
        sugestoesDepositos.innerHTML = '';
        const diasRestantes = calcularDiasRestantes();
        const depositosRestantes = 200 - depositos.length;
        const diasPassados = calcularDiasPassados();

        if (diasRestantes <= 0 || depositosRestantes <= 0) {
            sugestoesDepositos.innerHTML = '<li>Você já completou ou não há mais dias disponíveis para sugestões.</li>';
            return;
        }

        const sugestoesPorDia = depositosRestantes / diasRestantes;
        const numerosNaoSelecionados = [...Array(201).keys()].slice(1).filter(i => !depositos.some(d => d.valor === i));

        for (let i = 0; i < Math.ceil(sugestoesPorDia); i++) {
            if (numerosNaoSelecionados.length === 0) break;
            const indiceAleatorio = Math.floor(Math.random() * numerosNaoSelecionados.length);
            const numeroSugestao = numerosNaoSelecionados.splice(indiceAleatorio, 1)[0];
            const li = document.createElement('li');
            li.textContent = `Sugestão: Depósito número ${numeroSugestao}.`;
            sugestoesDepositos.appendChild(li);
        }

        const instrucoesExtra = document.createElement('p');
        instrucoesExtra.textContent = `Você precisa realizar ${Math.ceil(sugestoesPorDia)} depósitos por dia para completar o desafio dentro do prazo.`;
        sugestoesDepositos.appendChild(instrucoesExtra);
    }

    // Função para carregar mensagens motivacionais
    async function carregarMensagens() {
        try {
            const response = await fetch('mensagens.txt');
            if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
            const data = await response.text();
            const mensagensMotivacionais = data.split('\n').filter(mensagem => mensagem.trim() !== '');
            exibirMensagemMotivacional(mensagensMotivacionais);
        } catch (error) {
            console.error('Erro ao carregar as mensagens:', error);
            mensagemMotivacionalDisplay.textContent = "Nenhuma mensagem motivacional disponível.";
        }
    }

    // Função para exibir uma mensagem motivacional aleatória
    function exibirMensagemMotivacional(mensagens) {
        if (mensagens.length > 0) {
            const mensagemAleatoria = mensagens[Math.floor(Math.random() * mensagens.length)];
            mensagemMotivacionalDisplay.textContent = mensagemAleatoria;
        } else {
            mensagemMotivacionalDisplay.textContent = "Mantenha-se motivado! Continue com o desafio!";
        }
    }

    // Iniciar o desafio ao carregar a página
    iniciarDesafio();

    // Notificação caso o usuário não tenha feito depósitos nas últimas 24 horas
    setInterval(() => {
        if (Date.now() - ultimoDeposito > 86400000) {
            alert("Você não fez nenhum depósito nas últimas 24 horas. Lembre-se de continuar o desafio!");
        }
    }, 3600000);
});
