import { createContext, useContext } from 'react';
export const EditorCommandContext = createContext<{
  replace: () => void;
  saveBlock: () => void;
} | null>(null);
export const useEditorCommands = () =>
  useContext(EditorCommandContext) ?? { replace: () => {}, saveBlock: () => {} };
