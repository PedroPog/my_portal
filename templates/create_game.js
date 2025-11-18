require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' }});
  require(['vs/editor/editor.main'], function() {
   window.editor = monaco.editor.create(document.getElementById('editor'), {
    value: `<!DOCTYPE html>
<html>
<head>
 <title>Meu Jogo</title>
 <link rel="stylesheet" href="style.css">
</head>
<body>
 <h1>Olá, mundo!</h1>
 <canvas id="game"></canvas>
 <script src="script.js"></script>
</body>
</html>`,
    language: 'html',
    theme: 'vs-dark',
    automaticLayout: true,
    fontSize: 16,
    minimap: { enabled: false }
   });

   const files = {
    'index.html': `<!DOCTYPE html>
<html>
<head>
 <title>Meu Jogo</title>
 <link rel="stylesheet" href="style.css">
</head>
<body>
 <h1>Olá, mundo!</h1>
 <p>Edite os arquivos e clique em SALVAR!</p>
 <canvas id="game" width="400" height="400"></canvas>
 <script src="script.js"></script>
</body>
</html>`,
    'style.css': `body { 
 background: #000; 
 color: white; 
 text-align: center; 
 font-family: Arial; 
}
canvas { border: 4px solid #00ff88; border-radius: 10px; margin-top: 20px; }`,
    'script.js': `const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#00ff88';
ctx.fillRect(50, 50, 100, 100);
// Seu jogo começa aqui!`
   };

   document.querySelectorAll('.tab').forEach(tab => {
    tab.onclick = () => {
     document.querySelector('.tab.active').classList.remove('active');
     tab.classList.add('active');
     const file = tab.getAttribute('data-file');
     window.editor.setValue(files[file]);
     monaco.editor.setModelLanguage(window.editor.getModel(), file.split('.').pop());
    };
   });

   window.saveGame = function() {
    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const code = document.getElementById('code').value.trim().toLowerCase();

    if (!name || !description || !code) {
     alert('Preencha todos os campos!');
     return;
    }

    // Atualiza os arquivos com o que está no editor
    const activeFile = document.querySelector('.tab.active').getAttribute('data-file');
    files[activeFile] = window.editor.getValue();

    fetch('/api/create-game', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name, description, code, files })
    })
    .then(r => r.json())
    .then(data => {
     if (data.success) {
      alert('Jogo publicado com sucesso! Redirecionando...');
      window.location.href = data.url;
     } else {
      alert('Erro: ' + data.error);
     }
    });
   };
  });