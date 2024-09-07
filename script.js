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
    let progressoGrafico = null;

    // Calcular probabilidade de atingir o objetivo
    function calcularProbabilidade() {
        const diasRestantes = calcularDiasRestantes();
        const depositosRestantes = 200 - depositos.length;

        if (diasRestantes <= 0) {
            document.getElementById('probabilidade').textContent = "Probabilidade de Sucesso: 0%";
            return;
        }

        const taxaNecessaria = depositosRestantes / diasRestantes;
        const diasPassados = Math.floor((new Date() - startDateObj) / (1000 * 60 * 60 * 24));
        const taxaAtual = diasPassados > 0 ? depositos.length / diasPassados : 0;

        let probabilidade = 0;
        if (taxaAtual >= taxaNecessaria) {
            probabilidade = 100;
        } else {
            probabilidade = Math.min((taxaAtual / taxaNecessaria) * 100, 100);
        }

        document.getElementById('probabilidade').textContent = `Probabilidade de Sucesso: ${probabilidade.toFixed(2)}%`;
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

    // Função para carregar as mensagens de um arquivo txt
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

    // Função para alternar modo escuro
    document.getElementById('dark-mode-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
    });

    // Verificar se a data inicial já está no localStorage
    let startDate = localStorage.getItem('startDate');
    if (!startDate) {
        startDate = new Date().toISOString().split('T')[0];
        localStorage.setItem('startDate', startDate);
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 365);

    dataInicialDisplay.textContent = `Data Inicial: ${startDateObj.toLocaleDateString()}`;
    dataFinalDisplay.textContent = `Data Final: ${endDateObj.toLocaleDateString()}`;

    // Função para criar a tabela de depósitos
    function criarTabela() {
        const tabela = document.getElementById('depositos');
        if (!tabela) {
            console.error("Tabela não encontrada no HTML.");
            return;
        }

        tabela.innerHTML = '';
        let contador = 1;

        for (let i = 0; i < 20; i++) {
            const row = document.createElement('tr');
            for (let j = 0; j < 10; j++) {
                const cell = document.createElement('td');
                cell.textContent = contador;
                cell.dataset.value = contador;

                if (depositos.find(d => d.valor === contador)) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', () => {
                    const valorClicado = parseInt(cell.dataset.value, 10);
                    if (!cell.classList.contains('selected')) {
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

                row.appendChild(cell);
                contador++;
            }
            tabela.appendChild(row);
        }
    }

    // Atualizar o gráfico de progresso
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

    // Atualizar o histórico de depósitos com a data correta
	function atualizarHistorico() {
		historicoDepositos.innerHTML = '';
		depositos.forEach((deposito, index) => {
			const li = document.createElement('li');
			
			// Verificar se o valor do depósito existe
			if (deposito.valor && !isNaN(deposito.valor)) {
				// Verificar se a data do depósito existe
				if (deposito.data) {
					const dataDeposito = new Date(deposito.data).toLocaleDateString(); // Data do depósito
					li.textContent = `Depósito ${index + 1}: Valor R$ ${deposito.valor.toFixed(2)} - Data: ${dataDeposito}`;
				} else {
					// Caso a data não esteja presente
					li.textContent = `Depósito ${index + 1}: Valor R$ ${deposito.valor.toFixed(2)} - Data não disponível`;
				}
			} else {
				li.textContent = `Depósito ${index + 1}: Valor inválido`;
			}
			
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
        document.body.appendChild(link);
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
        return 365 - diasPassados;
    }

    // Notificações de alerta
    setInterval(() => {
        if (Date.now() - ultimoDeposito > 86400000) {
            alert("Você não fez nenhum depósito nas últimas 24 horas. Lembre-se de continuar o desafio!");
        }
    }, 3600000);

    criarTabela();
    atualizarTotal();
    carregarMensagens();
    atualizarGrafico();
    atualizarHistorico();
});
