import fs from 'fs';
import path from 'path';

export function analisarProjeto(caminhoProjeto) {
  if (!caminhoProjeto || !fs.existsSync(caminhoProjeto)) {
    throw new Error('Caminho do projeto inválido ou inexistente.');
  }

  const packageJsonPath = path.join(caminhoProjeto, 'package.json');
  let packageData = {};
  let temPackageJson = fs.existsSync(packageJsonPath);

  if (temPackageJson) {
    try {
      packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (e) {
      console.warn('[Scanner] package.json inválido:', e.message);
    }
  }

  // Procurar index.html (raiz ou src/)
  let indexHtmlPath = null;
  const possiveisLocaisIndex = [
    path.join(caminhoProjeto, 'index.html'),
    path.join(caminhoProjeto, 'src', 'index.html'),
    path.join(caminhoProjeto, 'public', 'index.html')
  ];

  for (const local of possiveisLocaisIndex) {
    if (fs.existsSync(local)) {
      indexHtmlPath = local;
      break;
    }
  }

  // Procurar pasta api / backend
  const apiDir = path.join(caminhoProjeto, 'api');
  let temApi = fs.existsSync(apiDir);
  let apiEntry = null;
  if (temApi) {
    const possiveisServidores = [
      path.join(apiDir, 'server.js'),
      path.join(apiDir, 'index.js'),
      path.join(caminhoProjeto, 'server.js')
    ];
    for (const srv of possiveisServidores) {
      if (fs.existsSync(srv)) {
        apiEntry = srv;
        break;
      }
    }
  }

  // Procurar ícone
  let iconePath = null;
  const possiveisIcones = [
    path.join(caminhoProjeto, 'icon.png'),
    path.join(caminhoProjeto, 'icone.png'),
    path.join(caminhoProjeto, 'icon.ico'),
    path.join(caminhoProjeto, 'build', 'icon.png')
  ];
  for (const ico of possiveisIcones) {
    if (fs.existsSync(ico)) {
      iconePath = ico;
      break;
    }
  }

  return {
    caminhoAbsoluto: caminhoProjeto,
    nomeSugerido: packageData.name || path.basename(caminhoProjeto),
    versaoSugerida: packageData.version || '1.0.0',
    descricaoSugerida: packageData.description || '',
    temPackageJson,
    indexHtml: indexHtmlPath,
    temApi,
    apiEntry,
    iconePath,
    packageData
  };
}
