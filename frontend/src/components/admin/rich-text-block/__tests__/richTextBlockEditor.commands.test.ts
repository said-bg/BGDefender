import {
  applyMediaAlignCommand,
  applyMediaWidthCommand,
  removeSelectedMediaCommand,
} from '../richTextBlockEditor.commands';
import type { SelectedMediaState } from '../richTextBlockEditor.utils';

const createMockEditor = () => {
  const run = jest.fn();
  const updateImage = jest.fn(() => ({ run }));
  const setImageInline = jest.fn(() => ({ run }));
  const deleteSelection = jest.fn(() => ({ run }));
  const setNodeSelection = jest.fn(() => ({ updateImage, setImageInline, deleteSelection, run }));
  const focus = jest.fn(() => ({ setNodeSelection, updateImage, setImageInline, deleteSelection, run }));
  const chain = jest.fn(() => ({ focus, setNodeSelection, updateImage, setImageInline, deleteSelection, run }));

  return {
    editor: {
      chain,
    } as any,
    chain,
    focus,
    setNodeSelection,
    updateImage,
    setImageInline,
    deleteSelection,
    run,
  };
};

describe('richTextBlockEditor.commands', () => {
  it('keeps image nodes inline when changing alignment to center', () => {
    const { editor, setNodeSelection, updateImage, run } = createMockEditor();
    const selectedMedia: SelectedMediaState = {
      type: 'image',
      pos: 12,
      width: 480,
      align: 'left',
    };

    applyMediaAlignCommand(editor, selectedMedia, 'center');

    expect(setNodeSelection).toHaveBeenCalledWith(12);
    expect(updateImage).toHaveBeenCalledWith({
      align: 'center',
      width: 480,
      inline: false,
    });
    expect(run).toHaveBeenCalled();
  });

  it('updates image width through image node attributes', () => {
    const { editor, setNodeSelection, updateImage, run } = createMockEditor();
    const selectedMedia: SelectedMediaState = {
      type: 'image',
      pos: 21,
      width: 480,
      align: 'center',
    };

    applyMediaWidthCommand(editor, selectedMedia, 620);

    expect(setNodeSelection).toHaveBeenCalledWith(21);
    expect(updateImage).toHaveBeenCalledWith({ width: 620, inline: false });
    expect(run).toHaveBeenCalled();
  });

  it('removes the selected media node', () => {
    const { editor, setNodeSelection, deleteSelection, run } = createMockEditor();
    const selectedMedia: SelectedMediaState = {
      type: 'video',
      pos: 33,
      width: 760,
      align: 'center',
    };

    removeSelectedMediaCommand(editor, selectedMedia);

    expect(setNodeSelection).toHaveBeenCalledWith(33);
    expect(deleteSelection).toHaveBeenCalled();
    expect(run).toHaveBeenCalled();
  });
});
