const form = document.getElementById('formulario');
const tabelaBody = document.getElementById('tabelaComponentes');
const totalSpan = document.getElementById('total');
const limparBtn = document.getElementById('limparBtn');
const exportarBtn = document.getElementById('exportarBtn');
const lerEtiquetaBtn = document.getElementById('lerEtiqueta');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');

let totalFita = 0;
let stream = null;

// ✅ Adicionar peça manualmente
form.addEventListener('submit', event => {
  event.preventDefault();

  const tipo = document.getElementById('tipo').value.trim();
  const quantidade = parseInt(document.getElementById('quantidade').value, 10);
  const comprimentoBruto = parseFloat(document.getElementById('comprimento').value);
  const larguraBruto = parseFloat(document.getElementById('largura').value);
  const comprimento = comprimentoBruto >= 300 ? comprimentoBruto / 10 : comprimentoBruto;
  const largura = larguraBruto >= 300 ? larguraBruto / 10 : larguraBruto;

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

// 📤 Exportar CSV
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

// 📷 Abertura da câmera e OCR automático após 4s
lerEtiquetaBtn.addEventListener('click', async () => {
  try {
    video.style.display = 'block';

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.srcObject = stream;

    // Aguarda 4 segundos para capturar a imagem
    setTimeout(async () => {
      document.body.style.cursor = 'wait';

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      video.style.display = 'none';
      if (stream) stream.getTracks().forEach(track => track.stop());

      try {
        const result = await Tesseract.recognize(canvas, 'eng');
        const texto = result.data.text;
        console.log('Texto detectado:', texto);

        const textoLimpo = texto.replace(/[×xX]/g, 'x').replace(/\s+/g, ' ');

        // 🧠 Extrair medidas
        const regexMedidas = /\b(\d{2,4})\s*x\s*(\d{2,4})\s*x\s*(\d{1,2})\b/;
        const matchMedidas = textoLimpo.match(regexMedidas);

        if (matchMedidas) {
          let comprimento = parseFloat(matchMedidas[1]);
          let largura = parseFloat(matchMedidas[2]);
          const espessura = parseFloat(matchMedidas[3]);

          // 🛠️ Corrigir erro comum de OCR (ex: 960 lido como 960 cm = 9.60 m, mas é 96.0 cm)
          if (largura > 300 && espessura <= 22) largura = largura / 10;
          if (comprimento > 1000 && espessura <= 22) comprimento = comprimento / 10;

          document.getElementById('comprimento').value = comprimento;
          document.getElementById('largura').value = largura;
          document.getElementById('espessura').value = espessura;
        } else {
          alert("Medidas não detectadas.");
        }


        // 🧠 Extrair tipo
        const matchTipo = texto.match(/pe[çc]a[:\-]?\s*(.+)/i);
        if (matchTipo) {
          let tipoExtraido = matchTipo[1].split('\n')[0].trim();
          tipoExtraido = tipoExtraido.replace(/[^\w\s]/g, '');
          if (tipoExtraido.toLowerCase().includes("pain")) {
            tipoExtraido = "Painel";
          }
          document.getElementById('tipo').value = tipoExtraido;
        } else {
          alert("Tipo da peça não identificado.");
        }

      } catch (ocrError) {
        alert("Erro ao processar a imagem: " + ocrError.message);
      } finally {
        // 🔁 Sempre restaura o cursor
        document.body.style.cursor = 'default';
      }

    }, 4000); // Tempo para estabilizar a câmera antes de capturar

  } catch (err) {
    alert('Erro ao acessar a câmera: ' + err.message);
    video.style.display = 'none';
    document.body.style.cursor = 'default';
    if (stream) stream.getTracks().forEach(track => track.stop());
  }
});
