import { parseCST } from '@messageformat/resource';
import { parseMessage } from 'messageformat';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { connection } from './server';

export async function validateMessageResource(
  doc: TextDocument
): Promise<void> {
  const { uri } = doc;
  // import { getDocumentSettings, client } from './server';
  // const settings = await getDocumentSettings(uri);
  const text = doc.getText();

  const diagnostics: Diagnostic[] = [];
  const cst = parseCST(text, (range, message) => {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: doc.positionAt(range[0]),
        end: doc.positionAt(range[1])
      },
      message,
      source: 'mf2'
    });
  });

  for (const entry of cst) {
    if (entry.type === 'entry') {
      const msg = parseMessage(entry.value.value, { resource: true });
      for (const { message, start, end } of msg.errors) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: doc.positionAt(entry.value.range[0] + start),
            end: doc.positionAt(entry.value.range[0] + end)
          },
          message,
          source: 'mf2'
        });
      }
    }
  }

  connection.sendDiagnostics({ uri, diagnostics });
}
