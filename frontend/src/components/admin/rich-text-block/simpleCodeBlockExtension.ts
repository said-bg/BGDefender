import { Node, mergeAttributes, textblockTypeInputRule } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    codeBlock: {
      setCodeBlock: () => ReturnType;
      toggleCodeBlock: () => ReturnType;
      unsetCodeBlock: () => ReturnType;
    };
  }
}

const backtickInputRegex = /^```[\s]$/;
const tildeInputRegex = /^~~~[\s]$/;

const SimpleCodeBlock = Node.create({
  name: 'codeBlock',

  group: 'block',

  content: 'text*',

  marks: '',

  code: true,

  defining: true,

  parseHTML() {
    return [
      {
        tag: 'pre',
        preserveWhitespace: 'full',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['pre', mergeAttributes(HTMLAttributes), ['code', 0]];
  },

  addCommands() {
    return {
      setCodeBlock:
        () =>
        ({ commands }) =>
          commands.setNode(this.name),
      toggleCodeBlock:
        () =>
        ({ commands }) =>
          commands.toggleNode(this.name, 'paragraph'),
      unsetCodeBlock:
        () =>
        ({ commands }) =>
          commands.setNode('paragraph'),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),
    };
  },

  addInputRules() {
    return [
      textblockTypeInputRule({
        find: backtickInputRegex,
        type: this.type,
      }),
      textblockTypeInputRule({
        find: tildeInputRegex,
        type: this.type,
      }),
    ];
  },
});

export default SimpleCodeBlock;
