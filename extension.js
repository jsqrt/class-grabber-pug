// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

const vscode = require('vscode');
const pug = require('pug');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */

const findClassesRegExp = new RegExp(
	/(?<=\.|\bclass=['"])[\w-]+(?:\s[\w-]+)*/g,
);

const errorNoClasses = () => {
	return vscode.window.showInformationMessage(
		'There no classess to copy - ClassGrabberPug',
	);
};

function parsePugToHtml(pugContent) {
	if (!pugContent) return;

	// Опции для парсинга Pug
	const options = {
		// Игнорировать подключения сторонних ресурсов
		debug: true,
		compileDebug: true,
		basedir: '.', // Указать базовый путь, если есть пути относительно других файлов
		filters: {
			include: () => '', // Игнорировать фильтр include
			mixin: () => '', // Игнорировать фильтр mixin
			extend: () => '', // Игнорировать фильтр extend
			import: () => '', // Игнорировать фильтр import
			// Другие фильтры, если есть, также могут быть проигнорированы
		},
	};

	// Парсинг Pug в HTML
	const html = pug.compileClient(pugContent, options);
	return html;
}

function activate(context) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log(
		'Congratulations, your extension "class-grabber-pug" is now active!',
	);

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		'class-grabber-pug.grabCSS',
		async function () {
			// Получаем активный редактор
			let editor = vscode.window.activeTextEditor;
			if (editor) {
				// Получаем текст из выделения
				let selection = editor.selection;
				let selectedText = editor.document.getText(selection);

				const htm = parsePugToHtml(selectedText);

				// Пример использования
				console.log(htm);

				if (selectedText) {
					const matchesArr = selectedText
						.replace(/\t/g, ' ')
						.replace(/\n/g, ' ')
						.replace(/\r/g, ' ')
						.match(findClassesRegExp);

					if (!matchesArr.length) return errorNoClasses();

					const rawClassesArr = matchesArr
						.map((rawClassName) => {
							return rawClassName.split(' ');
						})
						.filter((rawClassName) => rawClassName && rawClassName !== ' ');

					if (!rawClassesArr.length) return errorNoClasses();

					const classNames = rawClassesArr.flat();
					let uniqClassnames = [];

					classNames.forEach((className) => {
						if (uniqClassnames.indexOf(className) !== -1) return;
						if (className.startsWith('js-')) return;
						uniqClassnames.push(className);
					});

					if (!uniqClassnames.length) return errorNoClasses();

					let cascade = [];

					uniqClassnames.forEach((className) => {
						if (className.includes('--') && cascade[cascade.length - 1]) {
							cascade[cascade.length - 1] = cascade[cascade.length - 1].concat(
								`\n\n\t.${className} {\n\n\t}`,
							);
						} else {
							cascade.push(`.${className} {`);
						}
					});

					if (!cascade.length) return errorNoClasses();

					cascade = cascade.join('\n\n}\n\n').concat('\n}\n\n');

					vscode.env.clipboard.writeText(cascade).then(
						() => {
							vscode.window.showInformationMessage(
								'Successfully copied to clipboard! - ClassGrabberPug',
							);
						},
						(err) => {
							console.error(
								'ClassGrabberPug: Failed to write to clipboard:',
								err,
							);
							vscode.window.showErrorMessage(
								'Failed to copy text to clipboard! - ClassGrabberPug',
							);
						},
					);
				} else {
					vscode.window.showWarningMessage(
						'No code selected! - ClassGrabberPug',
					);
				}
			} else {
				vscode.window.showWarningMessage('No active editor! - ClassGrabberPug');
			}
		},
	);

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate,
};
