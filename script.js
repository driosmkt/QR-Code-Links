// --- FUNÇÃO DE LIMPEZA DE TEXTO (SANITIZER) ---
function sanitizeForUtm(text) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
    return text.toString().toLowerCase().replace(/\s+/g, '_').replace(p, c => b.charAt(a.indexOf(c))).replace(/[^\w\-]+/g, '').replace(/\_\_+/g, '_').replace(/^-+/, '').replace(/-+$/, '').replace(/^_+/, '').replace(/_+$/, '');
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
let qrCodeInstance = null;

// --- FUNÇÃO PRINCIPAL PARA GERAR O QR CODE ---
function generateQRCode() {
    const destinationUrl = destinationUrlInput.value.trim();
    const location = locationInput.value.trim();
    const campaignName = campaignNameInput.value.trim();

    if (!destinationUrl || !location || !campaignName) {
        alert('Por favor, preencha todos os três campos.');
        return;
    }

    const utmSource = 'qrcode';
    const utmMedium = 'ponto_fisico';
    const utmCampaign = sanitizeForUtm(campaignName);
    const utmContent = sanitizeForUtm(location);

    const trackableUrl = `${destinationUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}&utm_content=${utmContent}`;
    generatedLinkSpan.textContent = trackableUrl;
    qrCodeCanvas.innerHTML = '';
    
    // --- ALTERAÇÃO PRINCIPAL AQUI ---
    // Gerando o QR Code em alta resolução (1024x1024 pixels)
    qrCodeInstance = new QRCode(qrCodeCanvas, {
        text: trackableUrl,
        width: 1024,
        height: 1024,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    resultBox.classList.remove('hidden');
}

// --- FUNÇÕES DOS BOTÕES DE AÇÃO ---
copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedLinkSpan.textContent).then(() => {
        copyBtn.textContent = 'Copiado!';
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.textContent = 'Copiar Link';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
});

downloadBtn.addEventListener('click', () => {
    const canvas = qrCodeCanvas.querySelector('canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `qrcode-${sanitizeForUtm(locationInput.value.trim())}.png`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

generateBtn.addEventListener('click', generateQRCode);
