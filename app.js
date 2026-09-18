let modo = 'receber'; // 'receber' ou 'cobrar'

const TAXAS_PADRAO = {
  debito: 1.99,
  creditoVista: 3.19,
  '2': 4.50,
  '3': 5.50,
  '4': 6.50,
  '5': 7.50,
  '6': 8.90,
  '12': 13.50
};

let taxas = JSON.parse(localStorage.getItem('taxasMaquininha')) || TAXAS_PADRAO;

function carregarTaxasNosInputs() {
  if (document.querySelector('#taxaDebito')) {
    document.querySelector('#taxaDebito').value = taxas.debito || 1.99;
    document.querySelector('#taxaCreditoVista').value = taxas.creditoVista || 3.19;
    document.querySelector('#taxa2x').value = taxas['2'] || 4.50;
    document.querySelector('#taxa6x').value = taxas['6'] || 8.90;
    document.querySelector('#taxa12x').value = taxas['12'] || 13.50;
  }
}

function salvarTaxas() {
  taxas.debito = Number(document.querySelector('#taxaDebito').value);
  taxas.creditoVista = Number(document.querySelector('#taxaCreditoVista').value);
  taxas['2'] = Number(document.querySelector('#taxa2x').value);
  taxas['6'] = Number(document.querySelector('#taxa6x').value);
  taxas['12'] = Number(document.querySelector('#taxa12x').value);

  localStorage.setItem('taxasMaquininha', JSON.stringify(taxas));
  calcular();
}

function setModo(novoModo) {
  modo = novoModo;
  document.querySelector('#btnModoReceber').classList.toggle('active', modo === 'receber');
  document.querySelector('#btnModoCobrar').classList.toggle('active', modo === 'cobrar');
  
  document.querySelector('#lblValor').textContent = modo === 'receber'
    ? 'Quanto você quer receber no bolso?'
    : 'Quanto você vai cobrar do cliente?';
    
  calcular();
}

const brl = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function calcular() {
  const valorInput = Number(document.querySelector('#valorInput').value);
  const tipo = document.querySelector('#tipoPagamento').value;
  const taxaPercentual = taxas[tipo] || 5.0; // valor padrão caso a parcela não esteja customizada

  if (!valorInput || valorInput <= 0) {
    document.querySelector('#resultadoContent').innerHTML = '<p class="muted">Digite um valor para ver a simulação.</p>';
    document.querySelector('#btnCopiar').style.display = 'none';
    return;
  }

  let valorCobrar = 0;
  let valorDesconto = 0;
  let valorNoBolso = 0;

  if (modo === 'receber') {
    // Fórmula para calcular o valor cobrado garantindo o valor líquido desejado
    valorCobrar = valorInput / (1 - (taxaPercentual / 100));
    valorDesconto = valorCobrar - valorInput;
    valorNoBolso = valorInput;
  } else {
    // Cálculo simples de desconto percentual sobre o valor cobrado
    valorDesconto = valorInput * (taxaPercentual / 100);
    valorNoBolso = valorInput - valorDesconto;
    valorCobrar = valorInput;
  }

  const numParcelas = Number(tipo) || 1;
  const valorParcela = valorCobrar / numParcelas;

  document.querySelector('#resultadoContent').innerHTML = `
    <p>Cobrar do cliente: <div class="highlight">${brl(valorCobrar)}</div></p>
    ${numParcelas > 1 ? `<p>Parcelado em <b>${numParcelas}x de${brl(valorParcela)}</b></p>` : ''}
    <hr>
    <p>Taxa da maquininha (${taxaPercentual}%): <b>${brl(valorDesconto)}</b></p>
    <p>Você recebe no bolso: <b>${brl(valorNoBolso)}</b></p>
  `;

  document.querySelector('#btnCopiar').style.display = 'block';
  window.ultimoResumo = `Resumo do Pagamento:\n- Valor a cobrar: ${brl(valorCobrar)}${numParcelas > 1 ? ` (${numParcelas}x de${brl(valorParcela)})` : ''}\n- Forma: ${tipo === 'debito' ? 'Débito' : 'Crédito'}`;
}

function copiarResumo() {
  if (window.ultimoResumo) {
    navigator.clipboard.writeText(window.ultimoResumo);
    alert('Resumo copiado! Agora você pode colar no WhatsApp do seu cliente.');
  }
}

// Inicialização
carregarTaxasNosInputs();