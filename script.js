// --- FUNÇÃO DE LIMPEZA DE TEXTO (SANITIZER) ---
// Converte "Praça do Bambu!" para "praca_do_bambu"
function sanitizeForUtm(text) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '_') // substitui espaços por _
        .replace(p, c => b.charAt(a.indexOf(c)))
        .replace(/[^\w\-]+/g, '') // remove todos os caracteres não-alfanuméricos
        .replace(/\_\_+/g, '_') // substitui múltiplos _ por um único _
        .replace(/^-+/, '').replace(/-+$/, '')
        .replace(/^_+/, '').replace(/_+$/, '');
}

// --- ELEMENTOS DA PÁGINA (DOM) ---
const destinationUrlInput = document.getElementById('destinationUrl');
const locationInput = document.getElementById('location');
const campaignNameInput = document.getElementById('campaignName');
const generateBtn = document.getElementById('generateBtn');

const resultBox = document.getElementById('resultBox');
const qrCodeCanvas = document.getElementById('qrCodeCanvas');
const generatedLinkSpan = document.getElementById('generatedLink');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');

let qrCodeInstance = null; // Guarda a instância do QR Code para limpeza

// --- FUNÇÃO PRINCIPAL PARA GERAR O QR CODE ---
function generateQRCode() {
    const destinationUrl = destinationUrlInput.value.trim();
    const location = locationInput.value.trim();
    const campaignName = campaignNameInput.value.trim();

    // Validação dos campos
    if (!destinationUrl || !location || !campaignName) {
        alert('Por favor, preencha todos os três campos.');
        return;
    }

    // Limpeza e padronização dos dados para os UTMs
    const utmSource = 'qrcode';
    const utmMedium = 'ponto_fisico';
    const utmCampaign = sanitizeForUtm(campaignName);
    const utmContent = sanitizeForUtm(location); // O local vira o "content" para fácil rastreio

    // Monta a URL rastreável final
    const trackableUrl = `${destinationUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}&utm_content=${utmContent}`;

    // Exibe a URL na tela
    generatedLinkSpan.textContent = trackableUrl;

    // Limpa o QR Code anterior, se houver
    qrCodeCanvas.innerHTML = '';
    
    // Gera o novo QR Code
    qrCodeInstance = new QRCode(qrCodeCanvas, {
        text: trackableUrl,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H // Alta correção de erro, bom para impressão
    });

    // Mostra a caixa de resultado
    resultBox.classList.remove('hidden');
}

// --- FUNÇÕES DOS BOTÕES DE AÇÃO ---

// Copiar o link gerado
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedLinkSpan.textContent).then(() => {
        copyBtn.textContent = 'Copiado!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = 'Copiar Link';
            copyBtn.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
});

// Baixar a imagem do QR Code
downloadBtn.addEventListener('click', () => {
    // Encontra o elemento canvas gerado pela biblioteca
    const canvas = qrCodeCanvas.querySelector('canvas');
    if (!canvas) return;

    // Cria um link temporário na memória
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    // Define o nome do arquivo usando o local sanitizado
    link.download = `qrcode-${sanitizeForUtm(locationInput.value.trim())}.png`;
    
    // Simula o clique no link para iniciar o download e depois remove o link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// --- EVENT LISTENER PRINCIPAL ---
generateBtn.addEventListener('click', generateQRCode);