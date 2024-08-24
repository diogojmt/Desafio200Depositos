document.addEventListener('DOMContentLoaded', () => {
    const totalDisplay = document.getElementById('total');
    const dataInicialDisplay = document.getElementById('data-inicial');
    const dataFinalDisplay = document.getElementById('data-final');
    const mensagemMotivacionalDisplay = document.getElementById('mensagem-motivacional');
    let total = 0;
    let depositos = JSON.parse(localStorage.getItem('depositos')) || [];
    let mensagensMotivacionais = [];

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

    // Verificar se a data inicial já está no localStorage
    let startDate = localStorage.getItem('startDate');
    if (!startDate) {
        startDate = new Date().toISOString().split('T')[0]; // Salva a data de hoje como a data inicial
        localStorage.setItem('startDate', startDate);
    }
    
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 365);

    // Atualizar as exibições das datas
    dataInicialDisplay.textContent = `Data Inicial: ${startDateObj.toLocaleDateString()}`;
    dataFinalDisplay.textContent = `Data Final: ${endDateObj.toLocaleDateString()}`;

    function criarTabela() {
        const tabela = document.getElementById('depositos');
        let contador = 1;

        for (let i = 0; i < 20; i++) {
            const row = document.createElement('tr');

            for (let j = 0; j < 10; j++) {
                const cell = document.createElement('td');
                cell.textContent = contador;
                cell.dataset.value = contador;  // Certificando que o valor correto está sendo atribuído

                // Verifica se o depósito já foi feito para essa célula
                if (depositos.includes(contador)) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', () => {
                    const valorClicado = parseInt(cell.dataset.value, 10); // Garante que estamos usando o valor correto
                    if (!cell.classList.contains('selected')) {
                        cell.classList.add('selected');
                        depositos.push(valorClicado); // Adiciona o valor correto
                        localStorage.setItem('depositos', JSON.stringify(depositos));
                        atualizarTotal();
                    }
                });

                row.appendChild(cell);
                contador++;
            }

            tabela.appendChild(row);
        }
    }

    function calcularTotal() {
        total = depositos.reduce((acc, val) => acc + val, 0);
    }

    function calcularDiasRestantes() {
        const hoje = new Date();
        const diasPassados = Math.floor((hoje - startDateObj) / (1000 * 60 * 60 * 24));
        const diasRestantes = 365 - diasPassados;

        return diasRestantes > 0 ? diasRestantes : 0;
    }

    function atualizarTotal() {
        calcularTotal();
        totalDisplay.textContent = `R$ ${total.toFixed(2)}`;
        const diasRestantes = calcularDiasRestantes();
        const mensagem = `Faltam ${diasRestantes} dias para terminar o desafio e você já realizou ${depositos.length} depósitos totalizando R$ ${total.toFixed(2)}.`;
        document.getElementById('mensagem').textContent = mensagem;
    }

    criarTabela();
    atualizarTotal();
    carregarMensagens(); // Carrega as mensagens do arquivo e exibe uma ao carregar a página
});
