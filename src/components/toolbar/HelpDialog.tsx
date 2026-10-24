import { t } from '../../i18n';
import { useRef } from 'react';
import { isMac, isStandalone, shortcut } from '../../utils/platform';
import { X } from 'lucide-react';
import { useDialogFocus } from './useDialogFocus';
export function HelpDialog({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLElement>(null);
  useDialogFocus(dialog, onClose);
  return (
    <div className="modal-backdrop">
      <section
        ref={dialog}
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-heading"
      >
        <button
          className="modal-close"
          aria-label={t('Close help')}
          title={t('Close help')}
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <span className="eyebrow">{t('A FEW GESTURES, A CLEAR CIRCUIT')}</span>
        <h2 id="help-heading">{t('Draw. Connect. Annotate.')}</h2>
        <div className="help-steps">
          <p>
            <b>{t('01 · Place')}</b>
            {t(
              'Choose a component on the left, then click the sheet. You can also drag it. Each click places another component; R rotates the preview, Esc finishes.',
            )}{' '}
          </p>
          <p>
            <b>{t('02 · Connect')}</b>
            {t(
              'Press W and click to start a wire. Click a terminal, junction, or highlighted wire to connect; click empty space to add bends. Double-click or press Enter to finish at a free point. Backspace removes the last bend. Choose Orthogonal, 45°, or Free; Shift + W changes routing. In Select, drag a terminal to create a wire, an endpoint to move or reconnect it, or a connected segment to slide it. The magnet toggles snapping; Alt/Option temporarily bypasses it. Free routing keeps exact pointer positions.',
            )}{' '}
          </p>
          <p>
            <b>{t('03 · Annotate')}</b>
            {t(
              'Press N for a junction, A for an arrow, L for a loop. Choose Text in the toolbar to write on the sheet. Drag to draw an arrow or loop. Double-click to edit text and labels; Enter or clicking outside confirms, Esc cancels. The Junction tool stays active until Esc, V, or a tool change.',
            )}{' '}
          </p>
        </div>
        <p className="help-note">
          {t('From Drawing and annotations, choose Diagrams for editable Cartesian axes or a Gauss plane. The Angle tool uses three clicks: vertex, first ray and radius, then second ray. Adjust degrees, radius and label in Properties. Decorative lines attach to the center or outline of circles and rectangles and follow them when moved.')}
        </p>
        <p className="help-note">
          {t(
            'Use Highlight eraser beside Highlighter to remove highlights only. Click to delete the topmost stroke or drag to erase part of every stroke you cross. Adjust its diameter in Properties; the outline shows the affected area in canvas units. Each drag is one undo step; Esc cancels an unfinished gesture and returns to Select.',
          )}
        </p>
        <div className="shortcut-grid">
          {[
            [t('Space + drag'), t('Pan the sheet')],
            [t('Mouse wheel / trackpad'), 'Zoom'],
            ['↑ ↓ ← →', t('Nudge (1 unit)')],
            ['Shift + ↑↓←→', t('Larger nudge (10 units)')],
            [t('Shift + click'), t('Multiple selection')],
            [t('N · repeated clicks'), t('Place multiple junctions · Esc finishes')],
            ['Shift + W', t('Change wire routing')],
            [t('Alt/Option + click label'), t('Cycle overlapping labels')],
            [t('Alt/Option + click'), t('Select the highlight beneath the circuit')],
            [t('Shift + Alt/Option + click'), t('Select multiple overlapping highlights')],
            [t('Shift + rotation handle'), t('Snap the arrow to 15° increments')],
            [t('Drag on the sheet'), t('Rectangle selection')],
            ['R', t('Rotate component by 45° · brace/bracket by 90°')],
            ['Enter', t('Edit name or label')],
            [t('Alt + click handle'), t('Remove wire bend')],
            [t('Drag wire endpoint'), t('Reconnect an existing wire')],
            ['L', t('Draw an elliptical loop')],
            [shortcut('D'), t('Duplicate')],
            [`${shortcut('C')} / ${shortcut('X')} / ${shortcut('V')}`, t('Copy / cut / paste')],
            [t('Option/Alt + drag'), t('Temporarily disable snapping')],
            [t('Shift while moving'), t('Show additional dimensions')],
            ['Delete / Backspace', t('Delete selection · on a label, delete only the text')],
            ['Shift + Delete / Backspace', t('Delete the object from its label')],
            [shortcut('Z'), t('Undo')],
            [shortcut('Z', true), t('Redo')],
            ['G', t('Show / hide grid')],
            ['T', t('Show / hide components')],
            ['1', t('Fit to view')],
            ['+ / −', t('Zoom in / out')],
            ['H · V', t('Pan / select')],
            [shortcut('A'), t('Select all')],
            ['Esc', t('Select / cancel wire')],
            ...(isStandalone() && isMac() ? [['⌘T', t('Show / hide Components')]] : []),
          ].map(([key, description]) => (
            <div key={key}>
              <span>{description}</span>
              <kbd>{key}</kbd>
            </div>
          ))}
        </div>
        <p className="help-note">
          {t(
            'Drag labels to move them. Double-click a wire to add an editable bend. Round handles move or reconnect the existing endpoint: filled means connected, hollow means free. Press W to add a branch. Square handles edit bends; Alt-click removes one. For loops, drag the corners to resize and the tip handle to move the arrowhead. Write',
          )}{' '}
          <code>r_&#123;AB&#125;</code> {t('for a subscript.')}{' '}
        </p>
        <p className="help-note">{t('Decorative lines use the same routing, snapping, endpoint and bend controls as wires. Choose Orthogonal, 45°, or Free. Click to add bends or drag to draw, then double-click or press Enter to finish. Graphic terminal anchors follow moved or rotated symbols.')}</p>
        <p className="help-note">{t('Choose Curved in Line routing to draw a curve or convert selected decorative lines. Click the two endpoints or drag to draw, then select the line and drag its two control handles to shape it.')}</p>
        <p className="help-note">{t('Select a decorative line and choose an open or filled Arrowhead in Properties to turn it into an arrow. Reverse arrow changes its direction.')}</p>
        <p className="help-note">
          {t(
            'The Properties sidebar adjusts color and opacity separately for symbols and labels, including groups. Select multiple components and choose Replace in the context menu to change them together. Mirror arrows and loops on either axis; the small handle beside a selected arrow rotates it freely. Each gesture is one undo step. Distribute by centers or clearances; exact spacing keeps the first element fixed. Choose wire styles or Split wire for a dashed continuation. Rectangles, circles, and decorative lines do not create electrical connections. Highlighter, in Drawing and annotations, follows connected wires, junctions, and components in one drag in Smart mode. Choose where to start and stop, even within a component; a click does not highlight the whole element. In Freehand mode, draw anywhere. Adjust mode, color, opacity, and width in Properties. Select a stroke and drag its handles to change the endpoints. Highlights follow their component or wire; Detach makes them independent.',
          )}{' '}
        </p>
        <p className="help-note">
          {t(
            'Smart Placement previews snapping and connections; Alt/Option bypasses them. Insert into wire appears in the bottom feedback. The Drawing and annotations pencil menu contains wires, junctions, arrows, loops, rectangles, circles, decorative lines, and electrical annotations. Current on wire creates an integrated arrow; the context menu applies it directly to a selected wire. Polarity + / − is also available in the properties of compatible components. Brace / Bracket offers both tools: drag to group, then add a label; R rotates by 90° and Flip side changes the side. Right-click the sheet or an element for relevant actions; keyboard shortcuts also provide editing commands. Save as block is available in Personal blocks. Drag the grip to move the toolbar; its position is remembered. Select elements and choose Copy as image in the right-click menu to copy the drawing. Use Select all first to copy the whole circuit. The circuit and zoom level are saved automatically in this browser.',
          )}{' '}
        </p>
      </section>
    </div>
  );
}
