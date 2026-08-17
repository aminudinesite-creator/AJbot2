const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const BOT_API_KEY = process.env.BOT_API_KEY || "seu_token_aqui";

// Função para ler o arquivo de estatísticas real do bot
function lerEstatisticas() {
  try {
    const internalFs = require('fs');
    const filePath = path.join(__dirname, 'estatisticas.json');
    if (internalFs.existsSync(filePath)) {
      const dadosRaw = internalFs.readFileSync(filePath, 'utf8');
      return JSON.parse(dadosRaw);
    }
  } catch (e) {
    console.error("Erro ao ler estatisticas.json:", e);
  }
  return {
    dataReferencia: "17/08/2026",
    totalCompradoresHoje: 1,
    totalMegasAcumuladosHoje: 400,
    totalFaturadoHoje: 9.00,
    custoTotalHoje: 7.42,
    lucroLiquidoHoje: 1.58,
    maiorCompradorJid: "Aminu",
    maiorCompradorMegas: 400
  };
}

// 1. Rota de Estatísticas Gerais (/api/stats)
app.get('/api/stats', (req, res) => {
  const stats = lerEstatisticas();
  res.json({
    dataReferencia: stats.dataReferencia || "17/08/2026",
    totalCompradoresHoje: stats.totalCompradoresHoje || 0,
    totalMegasAcumuladosHoje: stats.totalMegasAcumuladosHoje || 0,
    totalFaturadoHoje: stats.totalFaturadoHoje || 0,
    custoTotalHoje: stats.custoTotalHoje || 0,
    lucroLiquidoHoje: stats.lucroLiquidoHoje || 0,
    maiorCompradorJid: stats.maiorCompradorJid || "Nenhum",
    maiorCompradorMegas: stats.maiorCompradorMegas || 0
  });
});

// 2. Rota de Transações (/api/transacoes)
app.get('/api/transacoes', (req, res) => {
  const stats = lerEstatisticas();
  res.json({
    ultimaCompra: {
      clienteJid: stats.maiorCompradorJid || "Aminu",
      numeroTelefone: "84xxxxxxx",
      valorPago: stats.totalFaturadoHoje || 0,
      pacote: `${stats.totalMegasAcumuladosHoje || 0} MB`,
      canalPagamento: "M-Pesa"
    },
    transacoes: [
      {
        id: "1",
        clienteJid: stats.maiorCompradorJid || "Aminu",
        numeroTelefone: "84xxxxxxx",
        valorPago: stats.totalFaturadoHoje || 0,
        pacote: `${stats.totalMegasAcumuladosHoje || 0} MB`,
        canalPagamento: "M-Pesa",
        horario: "14:00"
      }
    ]
  });
});

// 3. Endpoints de Analytics e Listas
app.get('/api/analytics', (req, res) => {
  const stats = lerEstatisticas();
  res.json({
    receitaTotal: stats.totalFaturadoHoje || 0,
    lucroTotal: stats.lucroLiquidoHoje || 0,
    totalVendas: stats.totalCompradoresHoje || 0
  });
});

app.get('/api/analytics/hourly', (req, res) => { res.json({ horas: [] }); });
app.get('/api/analytics/operators', (req, res) => { res.json({ operadoras: [{ nome: "Vodacom", vendas: 1, receita: 9.00 }] }); });
app.get('/api/analytics/packages', (req, res) => { res.json({ pacotes: [] }); });
app.get('/api/analytics/groups', (req, res) => { res.json({ grupos: [] }); });

app.get('/api/clientes', (req, res) => {
  const stats = lerEstatisticas();
  res.json({
    clientes: [
      { jid: stats.maiorCompradorJid || "Aminu", totalGasto: stats.totalFaturadoHoje || 0, megasComprados: stats.totalMegasAcumuladosHoje || 0 }
    ]
  });
});

app.get('/api/vendas', (req, res) => { res.json({ vendas: [] }); });
app.get('/api/pacotes', (req, res) => { res.json({ pacotes: [] }); });
app.get('/api/operadoras', (req, res) => { res.json({ operadoras: [] }); });
app.get('/api/grupos', (req, res) => { res.json({ grupos: [] }); });
app.get('/api/relatorios', (req, res) => { res.json({ relatorios: [] }); });
app.get('/api/health', (req, res) => { res.json({ status: "online", uptime: process.uptime() }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});

/*[source: 1]
 
 _Este bot foi criado pelo Rony caso vá usar_
  ⚠️ _Não retire os créditos do canal_ ⚠️

                🌐 Canal 🌐

  Rony / Spectrum : https://youtube.com/@Spectrum_bots

                ⚙️ REST API ⚙️
                
                 *EM BREVE*
*/


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📦 MÓDULOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, DisconnectReason } = require('@whiskeysockets/baileys')
const pino = require('pino')
const readline = require('readline')
const fs = require('fs')

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚙️ CONFIGS, CUSTOS E DADOS DE PAGAMENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

const prefix = ''
let jaPareou = false

// 💰 CONFIGURAÇÃO DE CUSTO
const custoPor10GB = 190; // 190 MT a cada 10 GB (10240 MB)

// 📱 NÚMEROS OFICIAIS DE RECEBIMENTO (E-Mola & M-Pesa)
const numeroEmolaOficial = "869541265"; 
const numeroMpesaOficial = "845164307"; 
const numeroMpesaOficialComDDI = "258845164307"; 

// 📁 GERENCIAMENTO E PERSISTÊNCIA DE ESTATÍSTICAS
const ARQUIVO_STATS = './estatisticas.json';

function carregarEstatisticas() {
    let dataHoje = new Date().toLocaleDateString('pt-BR');
    if (fs.existsSync(ARQUIVO_STATS)) {
        try {
            let dados = JSON.parse(fs.readFileSync(ARQUIVO_STATS, 'utf8'));
            // Zera automaticamente as estatísticas se o dia mudou
            if (dados.dataReferencia !== dataHoje) {
                return resetarEstatisticas(dataHoje);
            }
            return dados;
        } catch (e) {
            console.error("⚠️ Erro ao ler arquivo de estatísticas, criando um novo...");
        }
    }
    return resetarEstatisticas(dataHoje);
}

function resetarEstatisticas(data) {
    let novasStats = {
        dataReferencia: data,
        totalCompradoresHoje: 0,
        totalMegasAcumuladosHoje: 0,
        totalFaturadoHoje: 0,
        maiorCompradorMegas: 0,
        maiorCompradorJid: 'Ninguém ainda',
        historicoCompradores: {}
    };
    salvarEstatisticas(novasStats);
    return novasStats;
}

function salvarEstatisticas(dados) {
    try {
        fs.writeFileSync(ARQUIVO_STATS, JSON.stringify(dados, null, 2));
    } catch (e) {
        console.error("⚠️ Erro ao salvar estatísticas no disco:", e);
    }
}

// 🧠 Carrega as Estatísticas salvas
let stats = carregarEstatisticas();

// 🧠 Memória Temporária de Transações Processadas
const transacoesProcessadas = new Set();

// 📌 Variável para guardar o último comprovativo detectado no grupo
let ultimaCompraPendente = {
    clienteJid: null,
    numeroTelefone: null,
    valorPago: 0,
    pacote: null,
    messageKey: null,
    canalPagamento: null,
    idTransacao: null,
    aguardandoNumero: false
};

// 📋 TABELA DE PREÇOS (Mapeada para o bot consultar automaticamente pelo valor pago)
const tabelaPrecos = {
    9: "400MB",
    10: "440MB",
    12: "500MB",
    13: "570MB",
    14: "614MB",
    18: "760MB",
    19: "819MB",
    20: "890MB",
    23: "1GB (1024MB)",
    26: "1.14GB (1167MB)",
    30: "1.33GB (1363MB)",
    35: "1.52GB (1557MB)",
    40: "1.78GB (1823MB)",
    47: "2GB (2048MB)",
    52: "2.28GB (2335MB)",
    70: "3.04GB (3113MB)",
    96: "4GB (4096MB)",
    122: "5GB (5120MB)",
    144: "6GB (6144MB)",
    172: "7GB (7168MB)",
    192: "8GB (8192MB)",
    225: "9GB (9216MB)",
    245: "10GB (10240MB)",
    360: "15GB (15360MB)",
    // Mensais
    235: "7GB (7168MB) - 30 Dias",
    330: "10.5GB (10752MB) - 30 Dias",
    480: "18GB (18432MB) / 20GB Diário",
    590: "20GB (20480MB) - 30 Dias",
    950: "35.8GB (36659MB) / 1000 MT Crédito",
    1550: "54GB (55296MB) - 30 Dias",
    // Créditos
    95: "100 MT em crédito",
    190: "200 MT em crédito",
    470: "500 MT em crédito"
};

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚒️ FUNÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

const esperar = async (tempo) => {
    return new Promise(funcao => setTimeout(funcao, tempo));
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🤖 BOT E CONEXÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

async function ligarbot() {
    
    const { state, saveCreds } = await useMultiFileAuthState('./sessao')
    const { version, isLatest } = await fetchLatestBaileysVersion()
    
    const client = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: Browsers.ubuntu('Chrome'),
      printQRInTerminal: false
    })

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ♻️ DADOS DA CONEXÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

client.ev.on('creds.update', saveCreds)

client.ev.on('chats.set', () => {
console.log('setando conversas...')
})

client.ev.on('contacts.set', () => {
console.log('setando contatos...')
})

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📧 MENSAGENS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

client.ev.on('messages.upsert', async ({ messages }) => {
try {

const info = messages[0]
if (!info.message) return 
if (info.key.fromMe) return

const key = {
    remoteJid: info.key.remoteJid,
    id: info.key.id, 
    participant: info.key.participant 
}
await client.readMessages([key])
if (info.key && info.key.remoteJid == 'status@broadcast') return

const altpdf = Object.keys(info.message)
const type = altpdf[0] == 'senderKeyDistributionMessage' ? altpdf[1] == 'messageContextInfo' ? altpdf[2] : altpdf[1] : altpdf[0]

const body = (type === 'conversation') ?
info.message.conversation : (type == 'imageMessage') ?
info.message.imageMessage.caption : (type == 'videoMessage') ?
info.message.videoMessage.caption : (type == 'extendedTextMessage') ?
info.message.extendedTextMessage.text : (type == 'buttonsResponseMessage') ?
info.message.buttonsResponseMessage.selectedButtonId : (info.message.listResponseMessage && info.message.listResponseMessage.singleSelectReply.selectedRowId.startsWith(prefix) && info.message.listResponseMessage.singleSelectReply.selectedRowId) ? info.message.listResponseMessage.singleSelectReply.selectedRowId : (type == 'templateButtonReplyMessage') ?
info.message.templateButtonReplyMessage.selectedId : (type === 'messageContextInfo') ? (info.message.buttonsResponseMessage?.selectedButtonId || info.text) : ''

const from = info.key.remoteJid
const sender = info.key.participant || info.key.remoteJid

const comando = body.trim().split(/ +/).shift().toLocaleLowerCase()
const separar = body.trim().split(/ +/).slice(1)
const x = separar.join(' ')

// 🛡️ Verificações de Grupo
const isGroup = from.endsWith('@g.us');
let groupMetadata = isGroup ? await client.groupMetadata(from).catch(() => {}) : '';
let groupParticipants = isGroup ? groupMetadata?.participants || [] : [];
let groupAdmins = isGroup ? groupParticipants.filter(v => v.admin !== null).map(v => v.id) : [];
let isGroupAdmins = isGroup ? groupAdmins.includes(sender) : false;


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📲 CAPTURA DE NÚMERO PENDENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

if (isGroup && ultimaCompraPendente.aguardandoNumero && ultimaCompraPendente.clienteJid === sender) {
    const matchNumero = body.trim().match(/\b(258\d{9}|8[234567]\d{7})\b/);
    if (matchNumero) {
        const numeroFornecido = matchNumero[0];
        
        ultimaCompraPendente.numeroTelefone = numeroFornecido;
        ultimaCompraPendente.aguardandoNumero = false;

        await client.sendMessage(from, { react: { text: "🕒", key: ultimaCompraPendente.messageKey } });

        const respostaConfirmacao = 
`💳 *Confirmação de Pagamento AJ MEGAS* (${ultimaCompraPendente.canalPagamento})

📱 *Número:* ${numeroFornecido}
💰 *Valor Pago:* ${ultimaCompraPendente.valorPago} MT
📦 *Pacote:* ${ultimaCompraPendente.pacote}
🆔 *ID:* ${ultimaCompraPendente.idTransacao || 'N/D'}

🚀 Comprovativo válido recebido com sucesso! Administrador, digite *.compra* para processar.`;

        await client.sendMessage(from, { text: respostaConfirmacao }, { quoted: info });
        return;
    }
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔍 DETECÇÃO E VALIDAÇÃO DE COMPROVATIVO (E-MOLA & M-PESA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

const isComprovativoEmola = (body.includes('Transferiste') || body.includes('transferred')) && (body.includes('para conta') || body.includes('ID da transacao'));
const isComprovativoMpesa = (body.includes('Confirmado') || body.includes('Confirmed')) && (body.includes('Transferiste') || body.includes('transferred')) && (body.includes('para') || body.includes('to'));

if (isGroup && (isComprovativoEmola || isComprovativoMpesa)) {
    
    let idTransacao = null;
    let valorPago = 0;
    let destinoEncontrado = false;

    // 1. Identificar ID da Transação (E-Mola e M-Pesa em Português/Inglês)
    if (isComprovativoEmola) {
        const matchId = body.match(/ID\s+da\s+transacao\s+([A-Z0-9.]+)/i);
        idTransacao = matchId ? matchId[1].trim() : null;
    } else if (isComprovativoMpesa) {
        const matchId = body.match(/(?:Confirmed|Confirmado)\s+([A-Z0-9.]+)/i);
        idTransacao = matchId ? matchId[1].trim() : null;
    }

    // Verificar se a transação já foi processada anteriormente
    if (idTransacao && transacoesProcessadas.has(idTransacao)) {
        console.log(`⚠️ Comprovativo duplicado bloqueado! ID: ${idTransacao}`);
        await client.sendMessage(from, { 
            text: `❌ *Comprovativo Rejeitado!*\n\nEste comprovativo com o ID *${idTransacao}* já foi utilizado anteriormente.` 
        }, { quoted: info });
        return;
    }

    // 2. Validar Números de Destino
    const todosNumeros = body.match(/\b(258\d{9}|8[234567]\d{7})\b/g) || [];

    destinoEncontrado = todosNumeros.some(num => 
        num === numeroEmolaOficial || 
        num === numeroMpesaOficial || 
        num === numeroMpesaOficialComDDI
    );

    if (!destinoEncontrado) {
        console.log(`⚠️ Tentativa de fraude: Pagamento não foi enviado para os números oficiais.`);
        
        await client.sendMessage(from, { react: { text: "❌", key: info.key } });

        const mensagemInvalido = 
`❌ *Comprovativo Inválido!*

⚠️ Este pagamento não foi enviado para os nossos números oficiais de atendimento.

💳 *FORMAS DE PAGAMENTO OFICIAIS:*
📱 E-MOLA: ${numeroEmolaOficial} - Aminudine Juma Rachid
📱 M-PESA: ${numeroMpesaOficial} - Aminudine Juma Rachid

Certifique-se de enviar para a conta correta!`;

        await client.sendMessage(from, { text: mensagemInvalido }, { quoted: info });
        return;
    }

    // 3. Extrair Valor Pago
    const matchValor = body.match(/(?:Transferiste|transferred)\s+([\d,.]+)\s*MT/i);
    valorPago = matchValor ? Math.floor(parseFloat(matchValor[1].replace(',', '.'))) : 0;

    // 4. Identificar Número do Cliente (Excluindo números oficiais)
    const numeroParaMegas = todosNumeros.find(num => 
        num !== numeroEmolaOficial && 
        num !== numeroMpesaOficial && 
        num !== numeroMpesaOficialComDDI
    );

    // 5. Consultar Pacote
    const pacoteIdentificado = tabelaPrecos[valorPago] || 'Pacote personalizado / Não listado';

    const canalPagamento = isComprovativoMpesa ? "M-Pesa" : "E-Mola";

    if (idTransacao) {
        transacoesProcessadas.add(idTransacao);
    }

    // 🛑 Se NÃO encontrar o número do cliente, solicita e aguarda envio separado
    if (!numeroParaMegas) {
        await client.sendMessage(from, { react: { text: "⚠️", key: info.key } });

        ultimaCompraPendente = {
            clienteJid: sender,
            numeroTelefone: null,
            valorPago: valorPago,
            pacote: pacoteIdentificado,
            messageKey: info.key,
            canalPagamento: canalPagamento,
            idTransacao: idTransacao,
            aguardandoNumero: true
        };

        await client.sendMessage(from, { 
            text: `✅ *Comprovativo recebido!*\n\n⚠️ Não identifiquei o *número de telefone* do destinatário no comprovativo.\n\nPor favor, envie o número de telefone (ex: 84xxxxxxx) agora para prosseguir com o pedido.` 
        }, { quoted: info });
        return;
    }

    // ⏱️ Reagir ao comprovativo válido quando o número já foi extraído
    await client.sendMessage(from, { react: { text: "🕒", key: info.key } });

    ultimaCompraPendente = {
        clienteJid: sender,
        numeroTelefone: numeroParaMegas,
        valorPago: valorPago,
        pacote: pacoteIdentificado,
        messageKey: info.key,
        canalPagamento: canalPagamento,
        idTransacao: idTransacao,
        aguardandoNumero: false
    };

    const respostaConfirmacao = 
`💳 *Confirmação de Pagamento AJ MEGAS* (${canalPagamento})

📱 *Número:* ${numeroParaMegas}
💰 *Valor Pago:* ${valorPago} MT
📦 *Pacote:* ${pacoteIdentificado}
🆔 *ID:* ${idTransacao || 'N/D'}

🚀 Comprovativo válido recebido com sucesso! Administrador, digite *.compra* para processar.`;

    await client.sendMessage(from, { text: respostaConfirmacao }, { quoted: info });
    return; 
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔰 FUNÇÕES DO BOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

async function escrever (texto) {
await client.sendPresenceUpdate('composing', from) 
await esperar(1000)   
client.sendMessage(from, { text: texto }, {quoted: info})
}

const enviar = (texto) => {
client.sendMessage(from, { text: texto }, {quoted: info})
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎮 COMANDOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

switch(comando) {

case 'tabela':
const tabela = `📡 AJ MEGAS 🇲🇿

⚡ INTERNET PRA TODOS • PREÇOS ACESSÍVEIS

━━━━━━━━━━━━━━━━━━━━

📅 PACOTES DIÁRIOS

⏱️ Validade: 24 horas

📶 400MB ━━━ 💰 9 MT
📶 440MB ━━━ 💰 10 MT
📶 500MB ━━━ 💰 12 MT
📶 570MB ━━━ 💰 13 MT
📶 614MB ━━━ 💰 14 MT
📶 760MB ━━━ 💰 18 MT
📶 819MB ━━━ 💰 19 MT
📶 890MB ━━━ 💰 20 MT
📶 1GB (1024MB) ━━━ 💰 23 MT
📶 1.14GB (1167MB) ━━━ 💰 26 MT
📶 1.33GB (1363MB) ━━━ 💰 30 MT
📶 1.52GB (1557MB) ━━━ 💰 35 MT
📶 1.78GB (1823MB) ━━━ 💰 40 MT
📶 2GB (2048MB) ━━━ 💰 47 MT
📶 2.28GB (2335MB) ━━━ 💰 52 MT
📶 3.04GB (3113MB) ━━━ 💰 70 MT
📶 4GB (4096MB) ━━━ 💰 96 MT
📶 5GB (5120MB) ━━━ 💰 122 MT
📶 6GB (6144MB) ━━━ 💰 144 MT
📶 7GB (7168MB) ━━━ 💰 172 MT
📶 8GB (8192MB) ━━━ 💰 192 MT
📶 9GB (9216MB) ━━━ 💰 225 MT
📶 10GB (10240MB) ━━━ 💰 245 MT
📶 15GB (15360MB) ━━━ 💰 360 MT
📶 20GB (20480MB) ━━━ 💰 480 MT

━━━━━━━━━━━━━━━━━━━━

🗓️ PACOTES MENSAIS

⏱️ Validade: 30 dias

⭐ 7GB (7168MB) ━━━━━ 💰 235 MT
⭐ 10.5GB (10752MB) ━━ 💰 330 MT
⭐ 18GB (18432MB) ━━━━━ 💰 480 MT
⭐ 20GB (20480MB) ━━━━━ 💰 590 MT
⭐ 35.8GB (36659MB) ━━━ 💰 950 MT
⭐ 54GB (55296MB) ━━━━━ 💰 1.550 MT

⚠️ ATENÇÃO
Pra ativar os pacotes mensais, o cliente não pode ter o serviço Txuna Crédito ativo.

━━━━━━━━━━━━━━━━━━━━

💳 CRÉDITO

💰 100 MT em crédito → 95 MT
💰 200 MT em crédito → 190 MT
💰 500 MT em crédito → 470 MT
💰 1.000 MT em crédito → 950 MT

━━━━━━━━━━━━━━━━━━━━

📲 COMO PEDIR

Faz a transferência do valor do pacote escolhido e envia o comprovativo junto com o número onde vai receber os megas. Depois é só aguardar a confirmação de ativação.

🇲🇿 AJ MEGAS

Mais megas • Melhor conexão • Economia garantida 📡

━━━━━━━━━━━━━━━━━━━━`
escrever(tabela)
break

case 'pagamento':
const pagamento = 
`💳 FORMAS DE PAGAMENTO

📱 E-MOLA: ${numeroEmolaOficial} - Aminudine Juma Rachid
📱 M-PESA: ${numeroMpesaOficial} - Aminudine Juma Rachid

⚠️ Após efetuar o pagamento, envie o comprovativo no grupo para confirmar a compra.`
escrever(pagamento)
break


// 📊 COMANDO DE ESTATÍSTICAS E LUCRO NO CHAT PRIVADO
case '.estatisticas':
case 'estatisticas':
case '.ranking':
    let totalAcumuladoTextoPV = stats.totalMegasAcumuladosHoje >= 1024 
        ? `${(stats.totalMegasAcumuladosHoje / 1024).toFixed(2)} GB` 
        : `${stats.totalMegasAcumuladosHoje.toFixed(2)} MB`;

    let maiorCompradorTextoPV = stats.maiorCompradorMegas >= 1024 
        ? `${(stats.maiorCompradorMegas / 1024).toFixed(2)} GB` 
        : `${stats.maiorCompradorMegas.toFixed(2)} MB`;

    // 🧮 Cálculo de Custo e Lucro Líquido
    let custoTotalHoje = (stats.totalMegasAcumuladosHoje / 10240) * custoPor10GB;
    let lucroLiquidoHoje = stats.totalFaturadoHoje - custoTotalHoje;

    let relatorioAdmin = 
`📊 *ESTATÍSTICAS E LUCRO - HOJE* (${stats.dataReferencia})

👥 Total de Compradores: *${stats.totalCompradoresHoje}*
📦 Total de Megas Vendidos: *${totalAcumuladoTextoPV}*
🏆 Maior Comprador: *${stats.maiorCompradorJid !== 'Ninguém ainda' ? '@' + stats.maiorCompradorJid.split('@')[0] : 'Ninguém ainda'}* (${maiorCompradorTextoPV})

━━━━━━━━━━━━━━━━━━━━
💰 *FINANÇAS DE HOJE*
📥 Total Faturado: *${stats.totalFaturadoHoje.toFixed(2)} MT*
💸 Custo Estimado: *${custoTotalHoje.toFixed(2)} MT*
📈 Lucro Líquido: *${lucroLiquidoHoje.toFixed(2)} MT*
━━━━━━━━━━━━━━━━━━━━`;

    await client.sendMessage(from, { 
        text: relatorioAdmin, 
        mentions: stats.maiorCompradorJid !== 'Ninguém ainda' ? [stats.maiorCompradorJid] : [] 
    }, { quoted: info });
    break;


// 🔒 COMANDOS EXCLUSIVOS DE ADMINISTRADOR NO GRUPO
default:

    const comandosRestritos = ['.compra', 'escrever', 'responda', 'ping', 'fechar'];

    if (comandosRestritos.includes(comando)) {
        if (isGroup && !isGroupAdmins) {
            await client.sendMessage(from, { 
                text: `❌ *Comando Restrito!*\n\n⚠️ Apenas os administradores do grupo podem utilizar este comando.` 
            }, { quoted: info });
            return;
        }

        switch(comando) {
            case '.compra':
                if (!ultimaCompraPendente.clienteJid) {
                    enviar('⚠️ Nenhum comprovativo recente foi detectado no grupo. Envie o comprovativo no grupo primeiro.');
                    return;
                }

                if (ultimaCompraPendente.aguardandoNumero) {
                    enviar('⚠️ Aguardando o cliente enviar o número de telefone para prosseguir.');
                    return;
                }

                let clienteAlvo = ultimaCompraPendente.clienteJid;
                let pacoteDetectado = ultimaCompraPendente.pacote;
                let valorPagoNaCompra = ultimaCompraPendente.valorPago;

                let matchQtd = pacoteDetectado.match(/([\d.]+)\s*(mb|gb)?/i);
                let quantidadeEmMB = 500;
                let quantidadeFormatada = pacoteDetectado;

                if (matchQtd) {
                    let qtd = parseFloat(matchQtd[1]);
                    let unidade = (matchQtd[2] || 'mb').toLowerCase();
                    quantidadeEmMB = unidade === 'gb' ? qtd * 1024 : qtd;
                }

                // 🔄 Atualização das estatísticas persistentes
                stats.totalCompradoresHoje += 1;
                stats.totalMegasAcumuladosHoje += quantidadeEmMB;
                stats.totalFaturadoHoje += valorPagoNaCompra;

                let primeiraCompraDoDia = false;
                if (!stats.historicoCompradores[clienteAlvo]) {
                    stats.historicoCompradores[clienteAlvo] = 0;
                    primeiraCompraDoDia = true;
                }
                stats.historicoCompradores[clienteAlvo] += quantidadeEmMB;

                if (stats.historicoCompradores[clienteAlvo] > stats.maiorCompradorMegas) {
                    stats.maiorCompradorMegas = stats.historicoCompradores[clienteAlvo];
                    stats.maiorCompradorJid = clienteAlvo;
                }

                // 💾 Salva no arquivo JSON imediatamente
                salvarEstatisticas(stats);

                let totalAcumuladoTexto = stats.totalMegasAcumuladosHoje >= 1024 
                    ? `${(stats.totalMegasAcumuladosHoje / 1024).toFixed(2)} GB` 
                    : `${stats.totalMegasAcumuladosHoje.toFixed(2)} MB`;

                let maiorCompradorTexto = stats.maiorCompradorMegas >= 1024 
                    ? `${(stats.maiorCompradorMegas / 1024).toFixed(2)} GB` 
                    : `${stats.maiorCompradorMegas.toFixed(2)} MB`;

                let textoPrimeiraCompra = primeiraCompraDoDia 
                    ? `\nVocê está fazendo a sua primeira compra do dia!\n` 
                    : `\nVocê já comprou um total de ${stats.historicoCompradores[clienteAlvo] >= 1024 ? (stats.historicoCompradores[clienteAlvo]/1024).toFixed(2)+' GB' : stats.historicoCompradores[clienteAlvo]+' MB'} hoje!\n`;

                let mensagemGrupo = `Obrigado @${clienteAlvo.split('@')[0]} por comprar ${quantidadeFormatada}!
${textoPrimeiraCompra}
Você é o comprador nº ${stats.totalCompradoresHoje} do grupo.
Total acumulado: ${totalAcumuladoTexto}
O maior comprador acumulou: ${maiorCompradorTexto}

💪 Lute para ultrapassar esse nível e ganhar bônus incríveis!`;

                await client.sendMessage(from, { 
                    text: mensagemGrupo, 
                    mentions: [clienteAlvo] 
                }, { quoted: info });

                // ✅ Mudar a reação do comprovativo de relógio (🕒) para concluído (✅)
                if (ultimaCompraPendente.messageKey) {
                    await client.sendMessage(from, { react: { text: "✅", key: ultimaCompraPendente.messageKey } });
                }

                ultimaCompraPendente = { clienteJid: null, numeroTelefone: null, valorPago: 0, pacote: null, messageKey: null, canalPagamento: null, idTransacao: null, aguardandoNumero: false };
                break;

            case 'escrever':
                escrever('ola, estou escrevendo como humano');
                break;

            case 'responda':
                enviar('ola');
                break;

            case 'ping':
                enviar(`🏓 Pong`);
                break;

            case 'fechar':
                escrever('fechar');
                break;
        }
    }
    break;

}

} catch (erro) {
console.log(erro)
}})


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 CONEXÃO DO BOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

client.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr } = update

  if (qr && !client.authState.creds.registered && !jaPareou) {
  
  jaPareou = true
  const Pergunta = await question('Por Favor Me diga Seu número\n')
  const Numero = Pergunta.replace(/[^0-9]/g, '')

  let codigo = await client.requestPairingCode(Numero)
  codigo = codigo?.match(/.{1,4}/g)?.join("-") || codigo
  console.log(`Codigo de Pareamento: ${codigo}`)
  }
  
  if (connection === 'open') {
    console.log('✅ Bot conectado com sucesso')
  }
  
  if (connection === 'close') {
    const statusCode = lastDisconnect?.error?.output?.statusCode
    console.log('❌ Conexão fechada. Código:', statusCode)

    if (statusCode !== DisconnectReason.loggedOut) {
      console.log('🔄 Reconectando sem refazer pairing...')
      ligarbot()
    } else {
      console.log('🚪 Deslogado. Apague a pasta sessao e pareie novamente.')
    }
  }
})
}

ligarbot()

