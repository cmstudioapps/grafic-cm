#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const [, , command, ...args] = process.argv;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsPath = path.resolve(__dirname, '..', 'docs', 'index.html');

function printHelp() {
  console.log(`grafic-cm

Uso:
  grafic-cm empacotar [args do electron-builder]
  grafic-cm doc
  grafic-cm ajuda

Exemplos:
  grafic-cm empacotar
  grafic-cm empacotar --win
  grafic-cm empacotar --linux
  grafic-cm empacotar --mac
  grafic-cm empacotar --mac --publish never
  grafic-cm doc
`);
}

function resolveBuilderBinary(cwd) {
  const candidates = [
    path.join(cwd, 'node_modules', '.bin', process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder'),
    path.join(cwd, 'node_modules', 'electron-builder', 'cli.js')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function packageApp() {
  const builderBinary = resolveBuilderBinary(process.cwd());

  if (!builderBinary) {
    console.error('Nao encontrei `electron-builder` no projeto atual.');
    console.error('Instale no app que vai ser empacotado e tente novamente:');
    console.error('  npm install -D electron-builder');
    process.exit(1);
  }

  const commandArgs = builderBinary.endsWith('cli.js') ? [builderBinary, ...args] : args;
  const commandName = builderBinary.endsWith('cli.js') ? process.execPath : builderBinary;

  const child = spawn(commandName, commandArgs, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('Falha ao executar o empacotamento.');
    console.error(error.message);
    process.exit(1);
  });
}

function openDocs() {
  if (!fs.existsSync(docsPath)) {
    console.error('Nao encontrei a documentacao HTML do grafic-cm.');
    process.exit(1);
  }

  const platformOpeners = {
    darwin: ['open', [docsPath]],
    win32: ['cmd', ['/c', 'start', '', docsPath]],
    linux: ['xdg-open', [docsPath]]
  };

  const [commandName, commandArgs] = platformOpeners[process.platform] || [];

  if (!commandName) {
    console.error(`Plataforma nao suportada para abrir a documentacao: ${process.platform}`);
    console.error(`Abra manualmente: ${docsPath}`);
    process.exit(1);
  }

  const child = spawn(commandName, commandArgs, {
    cwd: process.cwd(),
    stdio: 'ignore',
    detached: true
  });

  child.on('error', () => {
    console.error('Nao foi possivel abrir o navegador automaticamente.');
    console.error(`Abra manualmente: ${docsPath}`);
    process.exit(1);
  });

  child.unref();
  console.log(`Abrindo documentacao: ${docsPath}`);
}

if (!command || command === 'ajuda' || command === '--help' || command === '-h') {
  printHelp();
  process.exit(0);
}

if (command === 'empacotar') {
  packageApp();
} else if (command === 'doc') {
  openDocs();
} else {
  console.error(`Comando desconhecido: ${command}`);
  printHelp();
  process.exit(1);
}
