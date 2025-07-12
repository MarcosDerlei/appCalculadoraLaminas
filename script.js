const form = document.getElementById('formulario');
const tabelaBody = document.getElementById('tabelaComponentes');
const totalSpan = document.getElementById('total');
const limparBtn = document.getElementById('limparBtn');
const exportarBtn = document.getElementById('exportarBtn');
const lerEtiquetaBtn = document.getElementById('lerEtiqueta');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

let totalFita = 0;

form.addEventListener('submit', event => {
  event.preventDefault();

  const tipo = document.getElementById('tipo').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value, 10);
  const comprimento = parseFloat(document.getElementById('comprimento').value);
  const largura = parseFloat(document.getElementById('largura').value);
  const ladosCompridos = parseInt(document.getElementById('ladosCompridos').value, 10);
  const ladosCurtos = parseInt(document.getElementById('ladosCurtos').value, 10);
  const espessura = document.getElementById('espessura').value;

  const fitaCmPorPeca = (ladosCompridos * comprimento) + (ladosCurtos * largura);
  const fitaMPorPeca = fitaCmPorPeca / 100;
  const fitaTotal = parseFloat((fitaMPorPeca * quantidade).toFixed(2));

  totalFita += fitaTotal;
  totalSpan.textContent = totalFita.toFixed(2);

  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${tipo}</td>
    <td>${quantidade}</td>
    <td>${comprimento}×${largura}</td>
    <td>${ladosCompridos} comprido(s), ${ladosCurtos} curto(s)</td>
    <td>${espessura} mm</td>
    <td>${fitaTotal.toFixed(2)} m</td>
  `;

  tabelaBody.appendChild(tr);
  form.reset();
});

// 🧼 Limpar tabela e zerar total
limparBtn.addEventListener('click', () => {
  tabelaBody.innerHTML = '';
  totalFita = 0;
  totalSpan.textContent = '0';
});

// 📤 Exportar para CSV
exportarBtn.addEventListener('click', () => {
  let csv = 'Tipo,Quantidade,Dimensões,Laminação,Espessura,Fita (m)\n';

  document.querySelectorAll('#tabelaComponentes tr').forEach(row => {
    const cols = Array.from(row.children).map(td => td.textContent);
    csv += cols.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'fita_de_borda.csv';
  link.click();

  URL.revokeObjectURL(url);
});

// 📷 Ler Etiqueta com OCR
lerEtiquetaBtn.addEventListener('click', async () => {
  video.style.display = 'block';
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;

  setTimeout(async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    video.style.display = 'none';
    stream.getTracks().forEach(track => track.stop());

    const result = await Tesseract.recognize(canvas, 'eng');
    const texto = result.data.text;
    console.log('Texto detectado:', texto);

    const textoLimpo = texto.replace(/[×xX]/g, 'x').replace(/\s+/g, ' ');

    // 🧠 Extrair medidas
    const regexMedidas = /\b(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{1,2})\b/;
    const matchMedidas = textoLimpo.match(regexMedidas);
    if (matchMedidas) {
      document.getElementById('comprimento').value = matchMedidas[1];
      document.getElementById('largura').value = matchMedidas[2];
      document.getElementById('espessura').value = matchMedidas[3];
    }

    // 🧠 Extrair tipo da peça
    const matchTipo = texto.match(/peça[:\-]?\s*(.+)/i);
    if (matchTipo) {
      const tipoExtraido = matchTipo[1].split('\n')[0].trim();
      document.getElementById('tipo').value = tipoExtraido;
    }

    alert("Informações extraídas com sucesso!");
  }, 3000);
});
