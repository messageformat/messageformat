import { ExtensionContext, workspace } from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(_context: ExtensionContext) {
  const serverModule = require.resolve('@messageformat/languageserver');
  console.log('client activate');

  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ language: 'mf2' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  };

  client = new LanguageClient(
    'mf2',
    'MF2 Client',
    serverOptions,
    clientOptions
  );
  client.start();
}

export const deactivate = () => client?.stop();
