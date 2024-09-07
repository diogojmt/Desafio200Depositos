document.addEventListener('DOMContentLoaded', () => {
    const totalDisplay = document.getElementById('total');
    const dataInicialDisplay = document.getElementById('data-inicial');
    const dataFinalDisplay = document.getElementById('data-final');
    const mensagemMotivacionalDisplay = document.getElementById('mensagem-motivacional');
    const historicoDepositos = document.getElementById('historicoDepositos');
    let total = 0;
    
    // Cada depósito agora inclui valor e data
    let depositos = JSON.parse(localStorage.getItem('depositos')) || [];
    let mensagensMotivacionais = [];
    let ultimoDeposito = Date.now();
    const progressoCanvas = document.getElementById('progressoGrafico').getContext('2d');
    let progressoGrafico = null; // Armazenar a instância do gráfico para atualizações

    // Calcular probabilidade de atingir o objetivo
    function calcularProbabilidade() {
        console.log("Calculando probabilidade...");

        const diasRestantes = calcularDiasRestantes();
        const depositosRestantes = 200 - depositos.length;

        console.log(`Depósitos: ${depositos.length}, Dias Restantes: ${diasRestantes}, Depósitos Restantes: ${depositosRestantes}`);

        if (diasRestantes <= 0) {
            console.log("Dias restantes é zero ou negativo. Probabilidade de sucesso: 0%");
            document.getElementById('probabilidade').textContent = "Probabilidade de Sucesso: 0%";
            return;
        }

        const taxaNecessaria = depositosRestantes / diasRestantes;
        const diasPassados = Math.floor((new Date() - startDateObj) / (1000 * 60 * 60 * 24));
        const taxaAtual = diasPassados > 0 ? depositos.length / diasPassados : 0;

        console.log(`Taxa Atual: ${taxaAtual}, Taxa Necessária: ${taxaNecessaria}`);

        let probabilidade = 0;

        if (taxaAtual >= taxaNecessaria) {
            probabilidade = 100; // Alta probabilidade de sucesso
        } else {
            probabilidade = Math.min((taxaAtual / taxaNecessaria) * 100, 100);
        }

        console.log(`Probabilidade calculada: ${probabilidade}%`);

        document.getElementById('probabilidade').textContent = `Probabilidade de Sucesso: ${probabilidade.toFixed(2)}%`;
    }

    // Função para atualizar o total de depósitos e dias restantes
    function atualizarTotal() {
        calcularTotal();
        totalDisplay.textContent = `R$ ${total.toFixed(2)}`;
        const diasRestantes = calcularDiasRestantes();
        const mensagem = `Faltam ${diasRestantes} dias para terminar o desafio e você já realizou ${depositos.length} depósitos totalizando R$ ${total.toFixed(2)}.`;
        document.getElementById('mensagem').textContent = mensagem;

        calcularProbabilidade(); // Atualizar probabilidade
    }

    // Função para carregar as mensagens de um arquivo txt
    async function carregarMensagens() {
        try {
            const response = await fetch('mensagens.txt');
            if (!response.ok) {
                throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
            }
            const data = await response.text();
            mensagensMotivacionais = data.split('\n').filter(mensagem => mensagem.trim() !== '');
            exibirMensagemMotivacional(); // Exibe a mensagem motivacional após carregar as mensagens
        } catch (error) {
            console.error('Erro ao carregar as mensagens:', error);
            mensagemMotivacionalDisplay.textContent = "Erro ao carregar mensagens motivacionais.";
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

    // Função para alternar modo escuro
    document.getElementById('dark-mode-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    // Verificar se a data inicial já está no localStorage
    let startDate = localStorage.getItem('startDate');
    if (!startDate) {
        startDate = new Date().toISOString().split('T')[0]; // Salva a data de hoje como a data inicial
        localStorage.setItem('startDate', startDate);
    }

    const startDateObj = new Date(startDate);
    console.log(`Data inicial: ${startDateObj}`);  // Verificar se a data inicial está correta

    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 365);

    // Atualizar as exibições das datas
    dataInicialDisplay.textContent = `Data Inicial: ${startDateObj.toLocaleDateString()}`;
    dataFinalDisplay.textContent = `Data Final: ${endDateObj.toLocaleDateString()}`;

    // Função para criar a tabela de depósitos
    function criarTabela() {
        const tabela = document.getElementById('depositos');
        if (!tabela) {
            console.error("Tabela não encontrada no HTML.");
            return;
        }

        console.log("Criando tabela...");

        let contador = 1;

        // Limpa a tabela antes de recriá-la, para garantir que será criada corretamente
        tabela.innerHTML = '';

        for (let i = 0; i < 20; i++) {
            const row = document.createElement('tr');

            for (let j = 0; j < 10; j++) {
                const cell = document.createElement('td');
                cell.textContent = contador;
                cell.dataset.value = contador;  // Certificando que o valor correto está sendo atribuído

                // Verifica se o depósito já foi feito para essa célula
                if (depositos.find(d => d.valor === contador)) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', () => {
                    const valorClicado = parseInt(cell.dataset.value, 10); // Garante que estamos usando o valor correto
                    if (!cell.classList.contains('selected')) {
                        cell.classList.add('selected');

                        // Armazenar o valor e a data do depósito
                        depositos.push({ valor: valorClicado, data: new Date().toISOString() });
                        console.log(`Depósito feito: ${valorClicado}, Total de depósitos: ${depositos.length}`);
                        localStorage.setItem('depositos', JSON.stringify(depositos));
                        atualizarTotal();
                        atualizarHistorico();
                        verificarMarcos();
                        atualizarGrafico(); // Atualizar o gráfico após novos depósitos
                        ultimoDeposito = Date.now(); // Atualiza o tempo do último depósito
                    }
                });

                row.appendChild(cell);
                contador++;
            }

            tabela.appendChild(row);
        }

        console.log("Tabela criada com sucesso.");
    }

    // Atualizar o gráfico de progresso
    function atualizarGrafico() {
        if (progressoGrafico) {
            progressoGrafico.destroy(); // Destroi o gráfico anterior antes de recriar
        }

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

        console.log("Gráfico de progresso atualizado.");
    }

    // Atualizar o histórico de depósitos com a data correta
    function atualizarHistorico() {
        historicoDepositos.innerHTML = '';
        depositos.forEach((deposito, index) => {
            const dataDeposito = new Date(deposito.data).toLocaleDateString(); // Data do depósito
            const li = document.createElement('li');
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

    // Função para exportar CSV
    document.getElementById('exportarCSV').addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,Depósito,Data\n";
        depositos.forEach(deposito => {
            const dataDeposito = new Date(deposito.data).toLocaleDateString();
            csvContent += `${deposito.valor},${dataDeposito}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "progresso.csv");
        document.body.appendChild(link); // Necessário para Firefox
        link.click();
    });

    // Calcular total de depósitos
    function calcularTotal() {
        total = depositos.reduce((acc, deposito) => acc + deposito.valor, 0);
    }

    // Calcular dias restantes
    function calcularDiasRestantes() {
        const hoje = new Date();
        const diasPassados = Math.floor((hoje - startDateObj) / (1000 * 60 * 60 * 24));
        const diasRestantes = 365 - diasPassados;

        return diasRestantes > 0 ? diasRestantes : 0;
    }

    // Notificações de alerta para falta de depósitos
    setInterval(() => {
        if (Date.now() - ultimoDeposito > 86400000) { // 24 horas
            alert("Você não fez nenhum depósito nas últimas 24 horas. Lembre-se de continuar o desafio!");
        }
    }, 3600000); // Verifica a cada hora

    criarTabela();
    atualizarTotal();
    carregarMensagens(); // Carrega as mensagens do arquivo e exibe uma ao carregar a página
    atualizarGrafico(); // Atualiza o gráfico inicialmente
    atualizarHistorico(); // Atualiza o histórico inicialmente
});
