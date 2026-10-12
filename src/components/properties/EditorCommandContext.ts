import { createContext, useContext } from 'react';
export const EditorCommandContext = createContext<{
  replace: () => void;
  saveBlock: () => void;
  saveImage: () => void;
  imageBusy: boolean;
} | null>(null);
export const useEditorCommands = () =>
  useContext(EditorCommandContext) ?? {
    replace: () => {},
    saveBlock: () => {},
    saveImage: () => {},
    imageBusy: false,
  };
