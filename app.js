/* =========================================================
   TAXAS DE MAQUININHAS
   Versão integrada
========================================================= */


/* =========================================================
   CONFIGURAÇÃO DAS TAXAS DA MAQUININHA
========================================================= */

const STORAGE_KEY = 'taxasMaquininhaV2';

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

const NOMES = {
  debito: 'Débito',
  creditoVista: 'Crédito à vista',
  '2': 'Crédito 2x',
  '3': 'Crédito 3x',
  '4': 'Crédito 4x',
  '5': 'Crédito 5x',
  '6': 'Crédito 6x',
  '12': 'Crédito 12x'
};

const IDS = {
  taxaDebito: 'debito',
  taxaCreditoVista: 'creditoVista',
  taxa2x: '2',
  taxa3x: '3',
  taxa4x: '4',
  taxa5x: '5',
  taxa6x: '6',
  taxa12x: '12'
};


/* =========================================================
   ESTADO
========================================================= */

let modo = 'receber';

let taxas = carregarTaxas();


/* =========================================================
   FUNÇÕES BÁSICAS
========================================================= */

function carregarTaxas() {

  try {

    const salvo = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (salvo) {

      return {
        ...TAXAS_PADRAO,
        ...salvo
      };

    }

  } catch (erro) {

    console.warn(
      'Não foi possível carregar as taxas salvas.',
      erro
    );

  }

  return {
    ...TAXAS_PADRAO
  };
}


function brl(valor) {

  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );

}


function numeroBR(valor) {

  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );

}


function pct(valor) {

  return `${numeroBR(valor)}%`;

}


/* =========================================================
   TAXAS DA MAQUININHA
========================================================= */

function carregarTaxasNosInputs() {

  Object.entries(IDS).forEach(
    ([id, chave]) => {

      const campo =
        document.getElementById(id);

      if (campo) {

        campo.value =
          taxas[chave];

      }

    }
  );

}


function salvarTaxas() {

  Object.entries(IDS).forEach(
    ([id, chave]) => {

      const campo =
        document.getElementById(id);

      if (!campo) return;

      const valor =
        Number(campo.value);

      if (
        Number.isFinite(valor) &&
        valor >= 0
      ) {

        taxas[chave] = valor;

      } else {

        taxas[chave] =
          TAXAS_PADRAO[chave];

      }

    }
  );


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(taxas)
  );


  calcular();

}


function restaurarTaxas() {

  taxas = {
    ...TAXAS_PADRAO
  };


  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(taxas)
  );


  carregarTaxasNosInputs();

  calcular();

}


/* =========================================================
   MODO DA CALCULADORA DA MAQUININHA
========================================================= */

function setModo(novoModo) {

  modo = novoModo;


  const receber =
    document.getElementById(
      'btnModoReceber'
    );

  const cobrar =
    document.getElementById(
      'btnModoCobrar'
    );


  receber.classList.toggle(
    'active',
    modo === 'receber'
  );


  cobrar.classList.toggle(
    'active',
    modo === 'cobrar'
  );


  document.getElementById(
    'lblValor'
  ).textContent =
    modo === 'receber'
      ? 'Quanto você quer receber?'
      : 'Quanto você vai cobrar do cliente?';


  calcular();

}


/* =========================================================
   CALCULADORA DA TAXA
========================================================= */

function calcular() {

  const campoValor =
    document.getElementById(
      'valorInput'
    );

  const campoTipo =
    document.getElementById(
      'tipoPagamento'
    );


  if (!campoValor || !campoTipo) {
    return;
  }


  const valor =
    Number(campoValor.value);

  const tipo =
    campoTipo.value;


  const taxa =
    Number(taxas[tipo] ?? 0);


  const out =
    document.getElementById(
      'resultadoContent'
    );

  const btn =
    document.getElementById(
      'btnCopiar'
    );


  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {

    out.innerHTML = `
      <div class="vazio">
        <strong>Digite um valor acima.</strong>
        <span>A conta aparece aqui.</span>
      </div>
    `;

    btn.style.display = 'none';

    window.ultimoResumo = '';

    return;

  }


  let cobrar;
  let desconto;
  let bolso;


  if (modo === 'receber') {

    /*
      Se quero receber R$ 100
      e a taxa é 3,19%:

      cobrança = 100 / (1 - 0,0319)
    */

    if (taxa >= 100) {

      out.innerHTML = `
        <div class="vazio">
          <strong>Taxa inválida.</strong>
          <span>A taxa precisa ser menor que 100%.</span>
        </div>
      `;

      btn.style.display = 'none';

      return;
    }


    bolso = valor;

    cobrar =
      valor /
      (1 - taxa / 100);

    desconto =
      cobrar - bolso;

  } else {

    cobrar = valor;

    desconto =
      cobrar * (taxa / 100);

    bolso =
      cobrar - desconto;

  }


  const parcelas =
    (
      tipo === 'debito' ||
      tipo === 'creditoVista'
    )
      ? 1
      : Number(tipo);


  const parcela =
    cobrar / parcelas;


  out.innerHTML = `

    <div class="resultado-grid">

      <div class="resultado-item">
        <span>Forma de pagamento</span>
        <strong>${NOMES[tipo]}</strong>
      </div>

      <div class="resultado-item">
        <span>Taxa cadastrada</span>
        <strong>${pct(taxa)}</strong>
      </div>

      <div class="resultado-item">
        <span>Valor a cobrar</span>
        <strong>${brl(cobrar)}</strong>
      </div>

      <div class="resultado-item">
        <span>Taxa descontada</span>
        <strong>${brl(desconto)}</strong>
      </div>

      ${
        parcelas > 1
          ? `
            <div class="resultado-item">
              <span>Parcelamento</span>
              <strong>
                ${parcelas}x de ${brl(parcela)}
              </strong>
            </div>
          `
          : ''
      }

    </div>


    <div class="destaque">

      <span>Valor que fica para você</span>

      <strong>${brl(bolso)}</strong>

    </div>

  `;


  btn.style.display = 'block';


  window.ultimoResumo = `RESUMO DA VENDA

Valor a cobrar: ${brl(cobrar)}
Forma de pagamento: ${NOMES[tipo]}
Taxa cadastrada: ${pct(taxa)}
Taxa descontada: ${brl(desconto)}
Valor que fica para você: ${brl(bolso)}${
  parcelas > 1
    ? `\nParcelamento: ${parcelas}x de ${brl(parcela)}`
    : ''
}

Calculado pela Calculadora de Taxas de Maquininhas.`;

}


/* =========================================================
   COPIAR RESUMO DA VENDA
========================================================= */

async function copiarResumo() {

  if (!window.ultimoResumo) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      window.ultimoResumo
    );

    mostrarAjuda(
      'Resumo copiado. Agora você pode colar no WhatsApp.'
    );

  } catch {

    mostrarAjuda(
      'O navegador não permitiu a cópia automática. Copie o resumo manualmente.'
    );

  }

}


/* =========================================================
   =========================================================
   MÓDULO NOVO
   JUROS PARA QUEM COMPRA
   =========================================================
   ========================================================= */


/*
  Sistema de parcelas iguais.

  P = preço à vista
  i = juros mensal
  n = número de parcelas

  Parcela:

  P * [i(1+i)^n] / [(1+i)^n - 1]

  Quando juros = 0:

  parcela = P / n
*/


function calcularParcelaComJuros(
  valor,
  jurosMensal,
  parcelas
) {

  const principal =
    Number(valor);

  const taxa =
    Number(jurosMensal) / 100;

  const n =
    Number(parcelas);


  if (
    !Number.isFinite(principal) ||
    principal <= 0 ||
    !Number.isFinite(taxa) ||
    taxa < 0 ||
    !Number.isFinite(n) ||
    n <= 0
  ) {

    return null;

  }


  /*
    Sem juros.
  */

  if (taxa === 0) {

    const parcela =
      principal / n;

    return {

      parcela,

      total:
        principal,

      juros:
        0

    };

  }


  /*
    Sistema de parcelas iguais.
  */

  const fator =
    Math.pow(
      1 + taxa,
      n
    );


  const parcela =
    principal *
    (
      taxa * fator
    ) /
    (
      fator - 1
    );


  const total =
    parcela * n;


  const juros =
    total - principal;


  return {

    parcela,

    total,

    juros

  };

}


/* =========================================================
   MOSTRAR JUROS PARA O CLIENTE
========================================================= */

function calcularJurosCliente() {

  const valor =
    Number(
      document.getElementById(
        'jurosValor'
      ).value
    );


  const parcelas =
    Number(
      document.getElementById(
        'jurosParcelas'
      ).value
    );


  const jurosMensal =
    Number(
      document.getElementById(
        'jurosMensal'
      ).value
    );


  const out =
    document.getElementById(
      'resultadoJuros'
    );


  const btn =
    document.getElementById(
      'btnCopiarJuros'
    );


  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {

    out.innerHTML = `
      <div class="vazio">
        <strong>Digite o preço do produto.</strong>
        <span>
          O valor das parcelas aparecerá aqui.
        </span>
      </div>
    `;

    btn.style.display = 'none';

    window.ultimoResumoJuros = '';

    return;

  }


  if (
    !Number.isFinite(jurosMensal) ||
    jurosMensal < 0
  ) {

    out.innerHTML = `
      <div class="vazio">
        <strong>Confira a taxa de juros.</strong>
        <span>
          Digite uma taxa igual ou maior que zero.
        </span>
      </div>
    `;

    btn.style.display = 'none';

    return;

  }


  const resultado =
    calcularParcelaComJuros(
      valor,
      jurosMensal,
      parcelas
    );


  if (!resultado) {

    return;

  }


  out.innerHTML = `

    <div class="juros-principal">

      <span>
        Total que o cliente vai pagar
      </span>

      <strong>
        ${brl(resultado.total)}
      </strong>

    </div>


    <div class="juros-detalhes">

      <div class="juros-detalhe">

        <span>
          Valor de cada parcela
        </span>

        <strong>
          ${parcelas}x de ${brl(resultado.parcela)}
        </strong>

      </div>


      <div class="juros-detalhe">

        <span>
          Juros pagos pelo cliente
        </span>

        <strong>
          ${brl(resultado.juros)}
        </strong>

      </div>


      <div class="juros-detalhe">

        <span>
          Preço à vista
        </span>

        <strong>
          ${brl(valor)}
        </strong>

      </div>


      <div class="juros-detalhe">

        <span>
          Juros ao mês
        </span>

        <strong>
          ${pct(jurosMensal)}
        </strong>

      </div>

    </div>


    <div class="destaque">

      <span>
        Explicando de forma simples
      </span>

      <strong>
        O produto custa ${brl(valor)} à vista.
      </strong>

      <p>
        Parcelado em ${parcelas}x,
        com ${pct(jurosMensal)} ao mês,
        o cliente pagará ${brl(resultado.total)}
        no total.
      </p>

    </div>

  `;


  btn.style.display = 'block';


  window.ultimoResumoJuros =
`SIMULAÇÃO DE PARCELAMENTO

Preço à vista: ${brl(valor)}
Parcelamento: ${parcelas}x
Juros ao mês: ${pct(jurosMensal)}

Valor de cada parcela: ${brl(resultado.parcela)}
Total para o cliente: ${brl(resultado.total)}
Juros pagos: ${brl(resultado.juros)}

Calculado pela Calculadora de Taxas de Maquininhas.`;


}


/* =========================================================
   COPIAR JUROS
========================================================= */

async function copiarResumoJuros() {

  if (!window.ultimoResumoJuros) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      window.ultimoResumoJuros
    );

    mostrarAjuda(
      'Simulação de juros copiada. Agora você pode colar no WhatsApp.'
    );

  } catch {

    mostrarAjuda(
      'O navegador não permitiu a cópia automática. Copie a simulação manualmente.'
    );

  }

}


/* =========================================================
   =========================================================
   COMPARADOR
   =========================================================
   ========================================================= */

function calcularComparador() {

  const valor =
    Number(
      document.getElementById(
        'compararValor'
      ).value
    );


  const parcelas =
    Number(
      document.getElementById(
        'compararParcelas'
      ).value
    );


  const juros =
    Number(
      document.getElementById(
        'compararJuros'
      ).value
    );


  const out =
    document.getElementById(
      'resultadoComparador'
    );


  if (
    !Number.isFinite(valor) ||
    valor <= 0
  ) {

    out.innerHTML = `
      <div class="vazio">
        <strong>Digite um preço.</strong>
        <span>
          A comparação aparecerá aqui.
        </span>
      </div>
    `;

    return;

  }


  const resultadoComJuros =
    calcularParcelaComJuros(
      valor,
      juros,
      parcelas
    );


  if (!resultadoComJuros) {
    return;
  }


  const parcelaSemJuros =
    valor / parcelas;


  out.innerHTML = `

    <div class="comparacao">

      <div class="comparacao-linha comparacao-cabecalho">

        <div>
          Forma
        </div>

        <div>
          Parcela
        </div>

        <div>
          Total
        </div>

      </div>


      <div class="comparacao-linha">

        <div>
          <strong>À vista</strong>
        </div>

        <div>
          ${brl(valor)}
        </div>

        <div>
          ${brl(valor)}
        </div>

      </div>


      <div class="comparacao-linha">

        <div>
          <strong>
            ${parcelas}x sem juros
          </strong>
        </div>

        <div>
          ${brl(parcelaSemJuros)}
        </div>

        <div>
          ${brl(valor)}
        </div>

      </div>


      <div class="comparacao-linha">

        <div>
          <strong>
            ${parcelas}x com juros
          </strong>
        </div>

        <div>
          ${brl(resultadoComJuros.parcela)}
        </div>

        <div>
          ${brl(resultadoComJuros.total)}
        </div>

      </div>

    </div>


    <p class="comparacao-observacao">

      Com ${pct(juros)} ao mês,
      o parcelamento acrescenta
      <strong>${brl(resultadoComJuros.juros)}</strong>
      ao preço original.

    </p>

  `;

}


/* =========================================================
   AJUDA
========================================================= */

function mostrarAjuda(texto) {

  const modal =
    document.getElementById(
      'modalAjuda'
    );

  const textoAjuda =
    document.getElementById(
      'textoAjuda'
    );


  textoAjuda.textContent =
    texto;


  modal.hidden = false;

}


function fecharAjuda() {

  document.getElementById(
    'modalAjuda'
  ).hidden = true;

}


/* =========================================================
   FECHAR MODAL CLICANDO FORA
========================================================= */

document
  .getElementById('modalAjuda')
  .addEventListener(
    'click',
    function (evento) {

      if (
        evento.target.id ===
        'modalAjuda'
      ) {

        fecharAjuda();

      }

    }
  );


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function () {

    carregarTaxasNosInputs();

    calcular();

    calcularJurosCliente();

    calcularComparador();


    /*
      Eventos das taxas.
      Assim não dependemos de
      onchange espalhado pelo HTML.
    */

    Object.keys(IDS).forEach(
      function (id) {

        const campo =
          document.getElementById(id);

        if (campo) {

          campo.addEventListener(
            'change',
            salvarTaxas
          );

        }

      }
    );

  }
);
