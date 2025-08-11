// --- FUNÇÃO DE LIMPEZA DE TEXTO (SANITIZER) ---
function sanitizeForUtm(text) {
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
    return text.toString().toLowerCase().replace(/\s+/g, '_').replace(p, c => b.charAt(a.indexOf(c))).replace(/[^\w\-]+/g, '').replace(/\_\_+/g, '_').replace(/^-+/, '').replace(/-+$/, '').replace(/^_+/, '').replace(/_+$/, '');
}

// --- ELEMENTOS DA PÁGINA (DOM) ---
const destinationSelect = document.getElementById('destinationSelect');
const manualUrlInput = document.getElementById('manualUrl');
const locationInput = document.getElementById('location');
const campaignNameInput = document.getElementById('campaignName');
const generateBtn = document.getElementById('generateBtn');
const resultBox = document.getElementById('resultBox');
const qrCodeCanvas = document.getElementById('qrCodeCanvas');
const generatedLinkSpan = document.getElementById('generatedLink');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');

let qrCodeInstance = null;
let history = JSON.parse(localStorage.getItem('qrCodeHistory')) || [];

// --- GERENCIAMENTO DE ESTADO E LÓGICA ---

// Mostra/esconde o campo de URL manual
destinationSelect.addEventListener('change', () => {
    if (destinationSelect.value === 'manual') {
        manualUrlInput.classList.remove('hidden');
    } else {
        manualUrlInput.classList.add('hidden');
    }
});

// FUNÇÃO PRINCIPAL
function generateQRCode(data) {
    let destinationUrl, location, campaignName;

    // Se 'data' for fornecido, estamos recarregando do histórico
    if (data) {
        destinationUrl = data.destination;
        location = data.location;
        campaignName = data.campaign;
    } else { // Senão, pegamos dos campos de input
        const selectedDestination = destinationSelect.value;
        destinationUrl = selectedDestination === 'manual' ? manualUrlInput.value.trim() : selectedDestination;
        location = locationInput.value.trim();
        campaignName = campaignNameInput.value.trim();

        if (!destinationUrl || !location || !campaignName) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        // Salva no histórico apenas se for uma nova geração
        saveToHistory({ destination: destinationUrl, location, campaign: campaignName });
    }
    
    // Constrói a URL rastreável
    const trackableUrl = buildTrackableUrl(destinationUrl, location, campaignName);
    
    // Exibe os resultados
    displayResults(trackableUrl);
}

function buildTrackableUrl(destination, location, campaign) {
    const utmSource = 'qrcode';
    const utmMedium = 'ponto_fisico';
    const utmCampaign = sanitizeForUtm(campaign);
    const utmContent = sanitizeForUtm(location);
    return `${destination}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}&utm_content=${utmContent}`;
}

function displayResults(url) {
    generatedLinkSpan.textContent = url;
    qrCodeCanvas.innerHTML = '';
    qrCodeInstance = new QRCode(qrCodeCanvas, {
        text: url,
        width: 1024,
        height: 1024,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    resultBox.classList.remove('hidden');
}


// --- GERENCIAMENTO DO HISTÓRICO ---

function saveToHistory(entry) {
    // Adiciona a nova entrada no início do array
    history.unshift(entry);
    // Limita o histórico aos últimos 5 itens
    history = history.slice(0, 5);
    // Salva no localStorage do navegador
    localStorage.setItem('qrCodeHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    historyList.innerHTML = '';
    if (history.length > 0) {
        historySection.classList.remove('hidden');
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-info">
                    <p><strong>Campanha:</strong> ${item.campaign}</p>
                    <p><strong>Local:</strong> ${item.location}</p>
                </div>
                <div class="history-actions">
                    <button class="history-btn copy" data-index="${index}">Copiar Link</button>
                    <button class="history-btn view" data-index="${index}">Ver QR</button>
                    <button class="history-btn delete" data-index="${index}">Excluir</button>
                </div>
            `;
            historyList.appendChild(historyItem);
        });
    } else {
        historySection.classList.add('hidden');
    }
}

function deleteFromHistory(index) {
    history.splice(index, 1);
    localStorage.setItem('qrCodeHistory', JSON.stringify(history));
    renderHistory();
}


// --- EVENT LISTENERS ---

generateBtn.addEventListener('click', () => generateQRCode(null));

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
    link.download = `qrcode-${sanitizeForUtm(locationInput.value.trim() || 'campanha')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Ações do histórico
historyList.addEventListener('click', (e) => {
    const target = e.target;
    const index = target.dataset.index;

    if (target.classList.contains('delete')) {
        deleteFromHistory(index);
    } else if (target.classList.contains('view')) {
        generateQRCode(history[index]);
    } else if (target.classList.contains('copy')) {
        const urlToCopy = buildTrackableUrl(history[index].destination, history[index].location, history[index].campaign);
        navigator.clipboard.writeText(urlToCopy);
        target.textContent = 'Copiado!';
        setTimeout(() => target.textContent = 'Copiar Link', 2000);
    }
});

// Renderiza o histórico ao carregar a página
document.addEventListener('DOMContentLoaded', renderHistory);
