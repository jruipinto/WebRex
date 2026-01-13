import type { editor } from 'monaco-editor';

export const jsonStringifyEditorAction: editor.IActionDescriptor = {
  id: 'json-stringify-selection',
  label: 'Stringify JSON selection',
  contextMenuGroupId: 'modification',
  contextMenuOrder: 1.5,
  run: async (editor) => {
    const rangeSelected = editor.getSelection();
    if (!rangeSelected) {
      return;
    }
    const text = editor.getModel()?.getValueInRange(rangeSelected);
    if (!text) {
      return;
    }

    try {
      const safeJS = URL.createObjectURL(
        new Blob(['export default' + text], {
          type: 'application/javascript',
        })
      );
      const safeJsObject = (await import(safeJS)).default;
      editor.executeEdits('json-stringify-selection', [
        {
          range: rangeSelected,
          text: JSON.stringify(JSON.stringify(safeJsObject)),
        },
      ]);
    } catch (error) {
      console.error(error);
      // invalid JSON, ignore
    }
  },
};
