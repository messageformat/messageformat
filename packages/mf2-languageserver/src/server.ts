import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { validateMessageResource } from './validate';

export const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

export let client = {
  config: false,
  workspaceFolders: false,
  relatedInfo: false
};

connection.onInitialize(
  ({ capabilities }: InitializeParams): InitializeResult => {
    client = {
      config: capabilities.workspace?.configuration ?? false,
      workspaceFolders: capabilities.workspace?.workspaceFolders ?? false,
      relatedInfo:
        capabilities.textDocument?.publishDiagnostics?.relatedInformation ??
        false
    };

    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        completionProvider: { resolveProvider: true },
        workspace: client.workspaceFolders
          ? { workspaceFolders: { supported: true } }
          : undefined
      }
    };
  }
);

connection.onInitialized(() => {
  if (client.config) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (client.workspaceFolders) {
    connection.workspace.onDidChangeWorkspaceFolders(_ev => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// The example settings
interface ExampleSettings {
  maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 } satisfies ExampleSettings;
let globalSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings = new Map<string, Thenable<ExampleSettings>>();

connection.onDidChangeConfiguration(change => {
  if (client.config) {
    documentSettings.clear();
  } else {
    globalSettings = change.settings.mf2 || defaultSettings;
  }
  documents.all().forEach(validateMessageResource);
});

export function getDocumentSettings(uri: string): Thenable<ExampleSettings> {
  if (!client.config) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(uri);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: uri,
      section: 'mf2'
    });
    documentSettings.set(uri, result);
  }
  return result;
}

documents.onDidClose(({ document }) => documentSettings.delete(document.uri));
documents.onDidChangeContent(({ document }) =>
  validateMessageResource(document)
);

connection.onDidChangeWatchedFiles(_change => {
  // Monitored files have change in VS Code
  connection.console.log('We received a file change event');
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [
      {
        label: 'TypeScript',
        kind: CompletionItemKind.Text,
        data: 1
      },
      {
        label: 'JavaScript',
        kind: CompletionItemKind.Text,
        data: 2
      }
    ];
  }
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.data === 1) {
    item.detail = 'TypeScript details';
    item.documentation = 'TypeScript documentation';
  } else if (item.data === 2) {
    item.detail = 'JavaScript details';
    item.documentation = 'JavaScript documentation';
  }
  return item;
});

documents.listen(connection);
connection.listen();
