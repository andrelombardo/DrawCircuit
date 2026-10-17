import { createContext, useContext } from 'react';
export const EditorCommandContext = createContext<{
  replace: () => void;
  saveBlock: () => void;
  copyImage: () => void;
  imageBusy: boolean;
} | null>(null);
export const useEditorCommands = () =>
  useContext(EditorCommandContext) ?? {
    replace: () => {},
    saveBlock: () => {},
    copyImage: () => {},
    imageBusy: false,
  };
