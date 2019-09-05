// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface UserHighlightConfig {
	regexp: string;
	backgroundColor?: string;
}
interface HighlightConfig {
	regexp: RegExp;
	backgroundColor?: string;
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	subscripToDocumentChanges(context);
}

function subscripToDocumentChanges(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor) {
				refreshHighlightRegions(editor.document);
			}
		})
	);
	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(e => {
			refreshHighlightRegions(e.document);
		})
	);
}

function getHighLightConfigs() {
	const userHighlightConfig = vscode.workspace.getConfiguration(`highlightKeyword.highlightConfig`);
	// let highlightExpStrs: string[] = [];
	if (!userHighlightConfig || !userHighlightConfig.has('rule')) {
		return;
	}
	const configs = userHighlightConfig.rule.map(
		({regexp, backgroundColor}: UserHighlightConfig) => ({
			regexp: new RegExp(regexp, 'g'), 
			backgroundColor
		})
	);
	return configs;
}

function getMatches(doc: vscode.TextDocument) {
	const hideRegs = getHighLightConfigs();
	const matches:any = {};

	for (let i = 0; i < doc.lineCount; i++) {
		const line = doc.lineAt(i);

		hideRegs.forEach(({regexp, backgroundColor = '#fcb'}: HighlightConfig) => {
			let res = regexp.exec(line.text);
			while (res) {
				const { index = 0 } = res;
				const [ matchStr ] = res;
				matches[backgroundColor] = matches[backgroundColor] || [];
				matches[backgroundColor].push(new vscode.Range(i, index, i, index + matchStr.length));
				res = regexp.exec(line.text);
			}
		});
	}
	return matches;
}

function refreshHighlightRegions(doc: vscode.TextDocument) {
	const matches = getMatches(doc);
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	Object.keys(matches).forEach((backgroundColor) => {
		let highlightDecoration = vscode.window.createTextEditorDecorationType({
			backgroundColor,
			rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
		});
		if (editor) {
			editor.setDecorations(highlightDecoration, matches[backgroundColor]);
		}
	});
	
}


// this method is called when your extension is deactivated
export function deactivate() {}
