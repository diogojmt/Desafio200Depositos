document.addEventListener('DOMContentLoaded', () => {
    const totalDisplay = document.getElementById('total');
    const dataInicialDisplay = document.getElementById('data-inicial');
    const dataFinalDisplay = document.getElementById('data-final');
    const mensagemMotivacionalDisplay = document.getElementById('mensagem-motivacional');
    const historicoDepositos = document.getElementById('historicoDepositos');
    const sugestoesDepositos = document.getElementById('sugestoesDepositos');
    const slider = document.getElementById('dias-limite'); // Controle deslizante para o limite
    const diasLimiteValorDisplay = document.getElementById('dias-limite-valor');
    const tabela = document.getElementById('depositos'); // Elemento da tabela no DOM
    let total = 0;

    // Verificação do slider e da tabela
    if (!slider) {
        console.error("Elemento 'dias-limite' não encontrado no DOM.");
        return;
    }
    if (!tabela) {
        console.error("Elemento 'depositos' não encontrado no DOM.");
        return;
    }

    // Inicializar limiteDias com o valor do slider
    let limiteDias = parseInt(slider.value);
    if (isNaN(limiteDias)) {
        console.error('Valor inválido do slider. Definindo valor padrão para 100 dias.');
        limiteDias = 100;
    }

    // Carregar depósitos e configurar estado inicial
    let depositos = JSON.parse(localStorage.getItem('depositos')) || [];
    let ultimoDeposito = Date.now();
    const progressoCanvas = document.getElementById('progressoGrafico').getContext('2d');
    let progressoGrafico = null;

    // Verificar se há um valor salvo no localStorage
    const valorSalvo = localStorage.getItem('limiteDias');

    if (valorSalvo) {
        slider.value = valorSalvo; // Restaurar valor do slider
        diasLimiteValorDisplay.textContent = `${valorSalvo} dias`; // Atualizar exibição do valor
        limiteDias = parseInt(valorSalvo); // Atualizar 'limiteDias' com o valor salvo
    }

    // Atualiza o valor do limite de dias dinamicamente e salva no localStorage
    slider.addEventListener('input', () => {
        const valor = parseInt(slider.value);
        if (!isNaN(valor)) {
            limiteDias = valor; // Atualizar 'limiteDias' sem redeclará-lo
            localStorage.setItem('limiteDias', valor); // Salvar o valor no localStorage
            diasLimiteValorDisplay.textContent = `${valor} dias`; // Atualiza o valor exibido
            iniciarDesafio(); // Atualizar a lógica do desafio com o novo limite
        } else {
            console.error('Valor inválido do slider.');
        }
    });

    // Função para iniciar o desafio com base no valor do slider
    function iniciarDesafio() {
        const startDate = localStorage.getItem('startDate') || new Date().toISOString().split('T')[0];
        const startDateObj = new Date(startDate);
        let endDateObj = new Date(startDateObj);
        endDateObj.setDate(startDateObj.getDate() + limiteDias);

        // Exibir as datas
        dataInicialDisplay.textContent = `Data Inicial: ${startDateObj.toLocaleDateString()}`;
        dataFinalDisplay.textContent = `Data Final: ${endDateObj.toLocaleDateString()}`;

        atualizarTotal();
        carregarMensagens();
        atualizarGrafico();
        atualizarHistorico();
        criarTabela(); // Garantir que a tabela seja criada ao iniciar o desafio
        gerarSugestoesDepositos();
    }

    // Função para criar a tabela de depósitos
    function criarTabela() {
        tabela.innerHTML = ''; // Limpar tabela antes de criar

        let contador = 1;
        for (let i = 0; i < 20; i++) { // Criar 20 linhas
            const row = document.createElement('tr'); // Criar linha
            for (let j = 0; j < 10; j++) { // Criar 10 células por linha
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
                    }
                });

                row.appendChild(cell); // Adicionar célula à linha
                contador++;
            }
            tabela.appendChild(row); // Adicionar linha à tabela
        }
    }

    // Função para atualizar o total de depósitos e dias restantes
    function atualizarTotal() {
        calcularTotal();
        totalDisplay.textContent = `R$ ${total.toFixed(2)}`;
        const diasRestantes = calcularDiasRestantes();
        const mensagem = `Faltam ${diasRestantes} dias para terminar o desafio e você já realizou ${depositos.length} depósitos totalizando R$ ${total.toFixed(2)}.`;
        document.getElementById('mensagem').textContent = mensagem;
        calcularProbabilidade();
    }

    // Função para calcular o total de depósitos
    function calcularTotal() {
        total = depositos.reduce((acc, deposito) => acc + deposito.valor, 0);
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
        const diasPassados = Math.floor((new Date() - new Date(localStorage.getItem('startDate'))) / (1000 * 60 * 60 * 24));
        const taxaAtual = diasPassados > 0 ? depositos.length / diasPassados : 0;

        let probabilidade = 0;
        if (taxaAtual >= taxaNecessaria) {
            probabilidade = 100;
        } else {
            probabilidade = Math.min((taxaAtual / taxaNecessaria) * 100, 100);
        }

        document.getElementById('probabilidade').textContent = `Probabilidade de Sucesso: ${probabilidade.toFixed(2)}%`;
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

    // Verificar objetivos intermediários
    function verificarMarcos() {
        if ([50, 100, 150].includes(depositos.length)) {
            alert(`Parabéns! Você atingiu o marco de ${depositos.length} depósitos! Continue firme no desafio.`);
        }
    }

    // Função para calcular dias restantes
	function calcularDiasRestantes() {
		const hoje = new Date();
		const startDate = new Date(localStorage.getItem('startDate') || hoje); // Garantir que a data de início seja obtida corretamente
		const diasPassados = Math.floor((hoje - startDate) / (1000 * 60 * 60 * 24)); // Diferença de dias desde a data de início
		return Math.max(limiteDias - diasPassados, 0); // Garantir que o valor não seja negativo
	}

    // Função para carregar mensagens motivacionais de um arquivo txt
    async function carregarMensagens() {
        try {
            const response = await fetch('mensagens.txt');
            if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
            const data = await response.text();
            mensagensMotivacionais = data.split('\n').filter(mensagem => mensagem.trim() !== '');
            exibirMensagemMotivacional();
        } catch (error) {
            console.error('Erro ao carregar as mensagens:', error);
            mensagemMotivacionalDisplay.textContent = "Nenhuma mensagem motivacional disponível.";
        }
    }

    // Exibir uma mensagem motivacional aleatória
    function exibirMensagemMotivacional() {
        if (mensagensMotivacionais.length > 0) {
            const mensagemAleatoria = mensagensMotivacionais[Math.floor(Math.random() * mensagensMotivacionais.length)];
            mensagemMotivacionalDisplay.textContent = mensagemAleatoria;
        } else {
            mensagemMotivacionalDisplay.textContent = "Mantenha-se motivado! Continue com o desafio!";
        }
    }

    // Gerar sugestões de depósitos
    function gerarSugestoesDepositos() {
        sugestoesDepositos.innerHTML = ''; // Limpar sugestões anteriores
        const diasRestantes = calcularDiasRestantes();
        const depositosRestantes = 200 - depositos.length;

        if (diasRestantes <= 0 || depositosRestantes <= 0) {
            const li = document.createElement('li');
            li.textContent = 'Você já completou ou não há mais dias disponíveis para sugestões.';
            sugestoesDepositos.appendChild(li);
            return;
        }

        const sugestoes = Math.min(3, depositosRestantes); // Gerar até 3 sugestões
        for (let i = 0; i < sugestoes; i++) {
            const numero = Math.ceil(Math.random() * 200); // Gerar sugestão de número aleatório
            const li = document.createElement('li');
            li.textContent = `Sugestão: Depósito de R$ ${numero.toFixed(2)}.`;
            sugestoesDepositos.appendChild(li);
        }
    }

    // Iniciar o desafio
    iniciarDesafio();

    // Notificações de alerta
    setInterval(() => {
        if (Date.now() - ultimoDeposito > 86400000) {
            alert("Você não fez nenhum depósito nas últimas 24 horas. Lembre-se de continuar o desafio!");
        }
    }, 3600000);
});
