// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { useEditActions } from '../src/components/toolbar/useEditActions';
import { useEditorStore } from '../src/store/editorStore';
import { demoDocument } from '../src/model/demo';

afterEach(cleanup);
it('subscribes to menu inputs and dispatches current store actions without unrelated renders', () => {
  const document = demoDocument();
  useEditorStore.setState({ document, selection: [], activeLabel: null, notice: '' });
  let renders = 0;
  const { result } = renderHook(() => {
    renders++;
    return useEditActions();
  });
  const initial = renders;
  act(() => useEditorStore.getState().notify('Saved'));
  act(() => useEditorStore.setState({ splittingWireId: 'wire' }));
  expect(renders).toBe(initial);
  act(() => useEditorStore.getState().select([document.objects[0].id]));
  expect(renders).toBeGreaterThan(initial);
  expect(result.current.contextItems.find((item) => item.id === 'delete')?.disabled).toBe(false);
  act(() => result.current.contextItems.find((item) => item.id === 'duplicate')!.onSelect!());
  expect(useEditorStore.getState().document.objects.length).toBeGreaterThan(
    document.objects.length,
  );
});
