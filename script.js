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
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let qrCodeInstance = null;
let history = JSON.parse(localStorage.getItem('qrCodeHistory')) || [];

// --- GERENCIAMENTO DE ESTADO E LÓGICA ---

destinationSelect.addEventListener('change', () => {
    manualUrlInput.classList.toggle('hidden', destinationSelect.value !== 'manual');
});

function generateQRCode(data) {
    let destinationUrl, location, campaignName;

    if (data) {
        destinationUrl = data.destination;
        location = data.location;
        campaignName = data.campaign;
    } else {
        const selectedDestination = destinationSelect.value;
        destinationUrl = selectedDestination === 'manual' ? manualUrlInput.value.trim() : selectedDestination;
        location = locationInput.value.trim();
        campaignName = campaignNameInput.value.trim();

        if (!destinationUrl || !location || !campaignName) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        saveToHistory({ destination: destinationUrl, location, campaign: campaignName });
    }
    
    const trackableUrl = buildTrackableUrl(destinationUrl, location, campaignName);
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
    history.unshift(entry);
    history = history.slice(0, 10); // Aumentei o limite para 10
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
    if (confirm(`Tem certeza que deseja excluir a campanha "${history[index].campaign}" do histórico?`)) {
        history.splice(index, 1);
        localStorage.setItem('qrCodeHistory', JSON.stringify(history));
        renderHistory();
    }
}

function clearAllHistory() {
    if (confirm('Tem certeza que deseja apagar TODO o histórico de campanhas? Esta ação não pode ser desfeita.')) {
        history = [];
        localStorage.removeItem('qrCodeHistory');
        renderHistory();
    }
}

// --- EVENT LISTENERS ---

generateBtn.addEventListener('click', () => generateQRCode(null));

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(generatedLinkSpan.textContent).then(() => {
        copyBtn.textContent = 'Copiado!';
        copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.textContent = 'Copiar Link'; copyBtn.classList.remove('copied'); }, 2000);
    });
});

downloadBtn.addEventListener('click', () => {
    const canvas = qrCodeCanvas.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    
    // Usa os dados do input atual ou do histórico recarregado para nomear o arquivo
    const locationValue = document.getElementById('location').value.trim();
    const campaignValue = document.getElementById('campaignName').value.trim();
    const fileName = sanitizeForUtm(locationValue || campaignValue || 'qrcode');

    link.download = `qrcode-${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

historyList.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.dataset.index) return;
    const index = parseInt(target.dataset.index, 10);

    if (target.classList.contains('delete')) {
        deleteFromHistory(index);
    } else if (target.classList.contains('view')) {
        const item = history[index];
        // Preenche os campos para o usuário ver o que foi recarregado
        destinationSelect.value = item.destination.startsWith('http') ? (['https://www.instagram.com/prefeiturapetrolina/','https://www.instagram.com/simaodurando/','https://petrolina.pe.gov.br/'].includes(item.destination) ? item.destination : 'manual') : '';
        if (destinationSelect.value === 'manual') {
            manualUrlInput.classList.remove('hidden');
            manualUrlInput.value = item.destination;
        } else {
             manualUrlInput.classList.add('hidden');
        }
        locationInput.value = item.location;
        campaignNameInput.value = item.campaign;
        generateQRCode(item);
        window.scrollTo(0, 0); // Rola a página para o topo para ver o resultado
    } else if (target.classList.contains('copy')) {
        const urlToCopy = buildTrackableUrl(history[index].destination, history[index].location, history[index].campaign);
        navigator.clipboard.writeText(urlToCopy);
        target.textContent = 'Copiado!';
        setTimeout(() => target.textContent = 'Copiar Link', 2000);
    }
});

clearHistoryBtn.addEventListener('click', clearAllHistory);

document.addEventListener('DOMContentLoaded', renderHistory);
