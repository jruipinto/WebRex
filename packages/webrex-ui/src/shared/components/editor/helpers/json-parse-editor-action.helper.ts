import type { editor } from 'monaco-editor';

export const jsonParseEditorAction: editor.IActionDescriptor = {
  id: 'json-parse-selection',
  label: 'Parse JSON selection',
  contextMenuGroupId: 'modification',
  contextMenuOrder: 1.5,
  run: (editor) => {
    const rangeSelected = editor.getSelection();
    if (!rangeSelected) {
      return;
    }
    const text = editor.getModel()?.getValueInRange(rangeSelected);
    if (!text) {
      return;
    }

    try {
      editor.executeEdits('json-parse-selection', [
        {
          range: rangeSelected,
          text: text
            .trim()
            .replace(/^("|')/, '')
            .replace(/("|')$/, '')
            .replace(/(\\")/g, '"'),
        },
      ]);
      editor?.getAction?.('editor.action.formatDocument')?.run();
    } catch (error) {
      console.error(error);
      // invalid JSON, ignore
    }
  },
};
