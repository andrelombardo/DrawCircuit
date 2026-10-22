# DrawCircuit user guide

[Read in Italian](it/guide.md) · [Open DrawCircuit](https://andrelombardo.github.io/DrawCircuit/)

DrawCircuit is a browser editor for electrical circuits in notes and teaching material. Components, wires, and annotations are editable vector objects. The library contains 72 symbols in 12 categories and 23 quick blocks. Comic Relief is bundled for circuit text and formulas; the UI uses Inter and KaTeX lays out mathematical labels.

## Language and local data

Choose **English** or **Italiano** in the selector at the bottom right. English is the default. The interface, tooltips, properties, messages, and built-in help switch together; the browser remembers your choice. Searches match English and Italian names in either interface language. Your existing labels, block names, circuit, and undo history are preserved.

Your circuit saves automatically after 400 ms of inactivity and before reload or closing. Personal blocks and preferences use separate browser storage. Keep using the same browser profile and origin to access them. Browser storage can be unavailable or cleared by browser settings; if saving fails, keep the page open and copy the drawing as an image. See the [web app guide](pwa.md) for installation and legacy migration.

## Start drawing

1. Choose a symbol from **Components**, then click the sheet to place it. You can also drag a component from the palette. Repeated clicks place more copies. **R** rotates the preview; **Esc** finishes.
2. Press **W**, then click a terminal, junction, or wire to start a connection. Click another target to finish. Click empty space for bends; double-click or press **Enter** to finish at a free point. **Backspace/Delete** removes the last bend or cancels a wire with no bends.
3. Press **N** to place labeled junction dots. Each click adds a junction until **Esc**, **V**, or a tool change. Placing a junction on a wire splits and connects it; clicking an existing junction does not duplicate it.
4. Double-click a label or text to edit it inline. **Enter** or clicking outside confirms; **Esc** cancels. Choose **Text** in the toolbar for standalone text.
5. Select elements, right-click, and choose **Copy as image**. Use **Cmd/Ctrl A** first to copy the whole circuit.

The toolbar grip lets you move the tools; its position is remembered. **Help** is at the bottom right. Zoom and grid controls are at the bottom left. Components and Properties each have a show/hide button and a draggable resize edge; double-click an edge to reset its width. At widths up to 600 px, both panels start closed and open one at a time. Choosing a component or block closes the mobile library. Desktop panel preferences are restored when returning to a wider layout.

## Select, move, and edit

**V** or **Esc** returns to Select. **Shift-click** adds or removes objects; dragging on empty sheet creates a selection rectangle. A single selection highlights its symbol; multiple selections share an outline. Editing handles appear for a single selected object.

Drag an object to move it or drag its label independently. Wires follow terminals and junctions. Arrow keys nudge by 1 document unit; **Shift + arrow** moves by 10. **Alt/Option** bypasses movement snapping and placement assistance. Local dimensions and alignment guides are temporary; they disappear after the gesture and never enter the document, copied images, or history. **Shift** shows additional dimensions during movement.

**R** rotates components by 45° and other supported objects by 90°. **Delete/Backspace** deletes the selection; when a label is the active target, it deletes only the text. **Shift + Delete/Backspace** deletes the label’s object. **Enter** edits the selected name or label. **Cmd/Ctrl D** duplicates with new IDs and automatic label numbers while preserving custom labels. Connections outside a duplicated selection are detached from the copies.

**Cmd/Ctrl Z** undoes; **Cmd/Ctrl Shift Z** or **Ctrl Y** redoes. A full drag, rotation, property change, or stroke is one history entry. History keeps the most recent 100 operations during the session. Text inputs keep native text undo while typing.

## Wires and junctions

Choose **Orthogonal**, **45°**, or **Free** routing while using W. **Shift + W** cycles modes, including during drawing. Orthogonal routing uses right angles; 45° routing uses diagonals and any needed horizontal/vertical segments; Free connects points directly. Wires align with their start and last bend even off the grid. Crossings stay electrically separate unless a junction is inserted.

In Select mode, drag a terminal to start a new connected wire; a click simply selects. Drag a round wire endpoint to move or reconnect that existing wire. Use **W** to add a branch or extend a wire. Filled round handles indicate connected endpoints, hollow handles indicate free endpoints. Drag a connected wire body to slide its segment while preserving connections; free endpoints follow. Include a connected wire in a multiple selection to translate its route as a whole.

The **magnet** beside the grid toggles snapping for wires, object movement, and component placement. **Alt/Option** temporarily bypasses snapping, including while drawing or editing a wire. Free routing keeps exact pointer positions while still offering nearby connection targets. Targets are chosen by proximity and remain stable through small pointer movements; the chosen wire is highlighted before a click connects it. Orthogonal segments use grid steps when snapping is enabled.

Deleting a junction removes its dot and label while preserving the shared connection of its incident wires. Removing a branch heals its remaining two straight, identically styled fragments without changing their visible route, currents, or highlights. Explicit style splits remain separate until an attached branch is removed.

Double-click a wire to add a bend. Drag square handles to edit bends; **Alt/Option-click** a square removes it. Redundant bends are removed only when the visible route remains identical. **Esc** cancels a gesture; panning with Space does not discard an unfinished wire.

Choose **Line style → Solid / Dashed / Dotted** in Properties for wires, decorative lines, rectangles, and circles. Dash length and gap use document units. A continuous hit area keeps dashed objects selectable. To style only a continuation, select a wire, choose **right-click → Split wire…**, and click the split point. The connected second segment remains selected and can receive its own style. Splits preserve current annotations and avoid endpoints and crossings. **Esc** cancels split placement.

## Properties and precise layout

The **Properties** sidebar shows the selected type or number of elements. It offers only shared properties for mixed selections. Different values appear as **Mixed values**, **Mixed**, or a dash. Confirm text and numeric changes with Enter or by leaving the field; Esc discards the draft. A shared edit changes the whole selection in one undo step.

**Text size**, **Thickness**, and **Rotation** combine editable values with their usual presets. Type a custom number, then press Enter or leave the field to apply it; use the arrow button or Up/Down to browse presets. Esc discards the draft. Decimal points, decimal commas, and pasted units are accepted. Invalid values show an error and leave the drawing unchanged. Text size must be greater than 0 and at most 200 px; line width must be greater than 0 and at most 20 px. Component, text, and label rotations retain their 45° increments (0–315°); arrows and loops allow custom angles. Distances, coordinates, and other numeric fields remain directly editable.

- **Label / Content:** edit object text or a shared value. **Internal text** edits the text inside generic blocks.
- **Position:** X/Y describe an object’s position or the top-left geometric bounds of a multiple selection. Editing a group coordinate translates the entire selection. Rotation applies to the object or selected label.
- **Appearance:** adjust symbol/text and label colors and opacity independently; change line width, styles, text size (up to 200 px)/alignment, and shape fill where relevant. Click a color for preset swatches or **Custom color…**. Native color-picker previews form one gesture.
- **Transforms:** rotate compatible groups around their center and mirror arrows or loops horizontally/vertically. **Reverse arrow** changes arrowhead direction without reflecting the shape.
- **Geometry:** object-specific dimensions, endpoints, routing, braces, alignment, distribution, and spacing.

The inspector resizes from 252–440 px, initially 292 px; the component sidebar uses 200–480 px. Their keyboard-accessible separators support arrow keys, Home, End, and double-click reset. Opening or resizing panels preserves zoom and the view center. Below 1050 px the inspector overlays the canvas.

### Align, distribute, and space

Select at least two independent objects and use the six alignment buttons for edges or centers. Distribution needs at least three objects and keeps the outermost objects fixed. Choose **Distance between centers** or **Clearance between edges**. Labels do not affect symbol measurements. Connected wires and annotations follow their hosts rather than moving twice; the panel indicates when only a subset can be arranged.

For an exact distance, choose **Geometry → Exact spacing**, select centers or clearances, and enter **Horizontal (X)** or **Vertical (Y)** spacing. Confirm with Enter or the adjacent button. Fields start empty: they specify distances to apply, not current measurements. The first object on the axis stays fixed; others keep their geometric order. Units are document units (`u`); the grid is 20 u. Invalid or overlapping arrangements are disabled with an explanation. Unselected junctions stay fixed; wire routing may add bends to preserve connections.

## Labels, math, and annotations

Labels and text support LaTeX: for example, `r_{AB}`, `V_{in}`, and `\frac{V}{R}`. They retain the original source, color, position, and size. Double-click editing uses the same SVG/KaTeX rendering as the circuit. Invalid formulas show a hint for correction. Comic Relief regular and bold load before editor measurements; copied PNGs preserve the bundled font.

New junction labels avoid nearby objects where possible. Existing moved labels stay where you place them. **Alt/Option-click** cycles overlapping labels.

The **Drawing and annotations** pencil menu includes wires, junctions, arrows, loops, braces/brackets, electrical annotations, highlights, rectangles, circles, and decorative lines.

### Arrows, loops, and braces

**A** draws a straight or Bézier arrow. **L** draws an elliptical loop; drag its corners to resize and the tip handle to move the arrowhead continuously. Mirror commands reflect the geometry; reverse commands change direction. Drag the small handle beside a selected arrow to rotate it freely; **Shift** snaps to 15° increments and **Esc** cancels.

Choose **Brace / Bracket**, then drag to group a region. Double-click to add a label. **R** rotates by 90°; **Flip side** changes its side. These annotations do not create electrical connections.

### Integrated current, voltage, and polarity

Select a compatible two-terminal component and enable **Electrical annotations → Polarity and voltage**. The host stays selected. Edit the voltage label, reverse polarity or arrow direction, adjust annotation and label offsets in canvas units, and expand **Annotation style** for color, opacity, width, and text size. Disabling the checkbox removes the annotation; Undo restores it.

Select a wire and enable **Electrical annotations → Current**, or use **Current on wire** from the drawing/context menu. The arrow stays on its wire and scales down on short segments. For multi-segment wires, **Current reference** chooses **Along the wire** or a particular **Segment**, preserving the proportional position. Edit position, current label, label offset, and direction. Legacy multiple annotations remain individually editable.

Use **Voltage between two points** to choose or drag from the first point to the second. **Polarity + / −** targets compatible components. DC voltage/current source markings retain their page orientation independently of pin rotation: voltage bars stay vertical and current bars horizontal.

### Highlighter

Choose **Drawing and annotations → Highlighter**. Properties shows the next stroke’s **Mode**, color, opacity, and width. **Smart** follows connected wires, junctions, and components in one drag without grid snapping. Start and stop anywhere along them, including inside a component body; a click does not highlight an entire element. **Freehand** draws anywhere. Release to commit; the tool remains active. **Esc** returns to Select and cancels an unfinished stroke. Tool changes, focus loss, or pointer cancellation discard previews.

Defaults are yellow `#FACC15`, 40% opacity, and 12 u width. Highlights render behind circuit symbols and labels with rounded ends and joints. Settings persist between strokes. Select a visible stroke edge or **Alt/Option-click** through the circuit; **Shift + Alt/Option-click** adjusts a multiple selection of overlapping highlights.

Smart strokes can traverse multiple components, turn at junctions, and retrace to shorten. At forks they follow the pointer; touching endpoints permit continuation without releasing. This graphical continuity does not change electrical topology. Disconnected crossings and separated endpoints stay separate. Fast movement can traverse several objects in one event.

Selected highlights expose endpoint handles and **Start / End** positions on the first/last referenced element. Proportional endpoints follow host movement, rotation, bends, and routing changes. Width remains uniform across wires and symbol bodies, without dark overlap joints. **Detach from path/component** freezes the visible geometry for independent movement. Splitting a wire remaps references; deleting a host keeps a free stroke with the same appearance. Legacy whole-component highlights remain visible.

Copying a smart highlight alone creates an independent path; copying it with its hosts remaps references. Personal blocks and image copying preserve highlights. One stroke is one undo step.

### Erasing highlights

Choose **Drawing and annotations → Highlight eraser**, beside Highlighter. Click and release on a stroke to delete the whole highlight; at overlaps, the topmost visible stroke takes priority. The eraser reaches highlights under circuit symbols without touching those symbols.

Drag to erase only the crossed portions of every intersected highlight. A 4 px movement threshold distinguishes dragging from a click; deletion waits until that intent is clear. Continuous swept geometry covers fast pointer movement between samples. Remaining parts become independent vector strokes with the original curve, color, opacity, and width. Partially erased smart highlights become independent of their former hosts.

**Properties → Size** adjusts the diameter from 6–160 document units; it stays in memory during the session and affects partial erasure only. The cursor outline uses the same canvas scale at any zoom. Each drag is one undo/redo action. Esc, tool changes, or pointer cancellation discard an unfinished erasure. To delete with the keyboard instead, use Select, Alt/Option-click a covered highlight if necessary, and press Delete/Backspace.

### Rectangles, circles, and decorative lines

Drag with **Rectangle**, **Circle**, or **Decorative line** to create a shape. Rectangle uses **Shift** for a square; Rectangle and Circle use **Alt/Option** to draw from the center. Circles stay circular when drawn or resized. Line uses **Shift** for 45° increments. Esc cancels previews. Rectangles and circles start unfilled; select their border and resize with corner handles. Enter width/height for rectangles or **Diameter** for circles in Properties. Both support independent outline/fill colors and opacity, plus solid, dashed, or dotted outlines. A 90° rotation exchanges rectangle width and height. These shapes render behind the circuit and create no electrical connections. Unfilled rectangles and circles leave interior objects selectable.

## Smart Placement and reusable blocks

During component placement, approach a terminal or junction with a preview pin. A green indicator previews a connection; click to place and connect. Clicking a target directly starts an anchor; move the component and click again. Two-terminal components orient during anchoring; **R** prioritizes manual rotation. **Alt/Option** bypasses assistance.

**Insert into wire** explicitly enables inline placement for compatible two-terminal components. Confirm only when the preview shows the wire split at both terminals. Short segments or crossings retain free placement. Multi-terminal components choose the nearest preview pin. Each placement is one undo step and preserves semantic endpoint references.

**Quick blocks** starts collapsed. Choose from series/parallel resistors, star/delta networks, voltage/current dividers, Wheatstone bridge, practical sources, Thévenin/Norton equivalents, series/parallel RC/RL/RLC, and small multi-branch networks. Search matches both languages. Choose a block, use R to rotate by 90°, and click to place; Esc cancels. Presets create ordinary editable objects with fresh IDs and collision-free automatic labels, selected as one undo step.

For **Personal blocks**, select elements and choose **Save as block** in the context menu or library. Use a 1–80 character name. Saved blocks stay in this browser; you can place, rename, delete, or import an existing JSON library. **Undo deletion** restores the last removed block during the session separately from circuit history. Libraries allow at most 100 blocks and 10 MB of JSON.

## Copying and navigation

**Cmd/Ctrl C/X/V** copies, cuts, and pastes editable objects. Cut obtains a validated copy before deleting; denied clipboard access still permits pasting in the same session. New IDs and internal references are remapped on paste. Browser-native clipboard events also work; text fields retain native clipboard behavior.

**Right-click → Copy as image** copies a transparent PNG, normally at 4× resolution, from the internal SVG representation. It includes internal wires and annotations associated with selected hosts, plus highlights; it excludes the grid, guides, selection, and handles. Wires to outside objects are excluded unless explicitly selected. Large images keep bounded dimensions and memory use. The browser must support and permit image clipboard writing.

Use **Space + drag** or **H** to pan, the wheel/trackpad or +/− to zoom, **1** to fit, **G** to toggle the grid, and **T** to show/hide Components. Shortcuts do not trigger while typing in text fields or dialogs. Properties menus support arrows, Home/End, Enter, Escape, and Tab. Controls preserve native Space/Enter activation.

## Local development and limits

Use Node.js 26.5.0 from `.nvmrc`, then `npm ci` and `npm run dev`. Run `npm run lint`, `npm test`, and `npm run build`; use `npm run preview` for production checks. See [CONTRIBUTING.md](../CONTRIBUTING.md) and [architecture](architecture.md).

JSON remains version 1, including compatibility for older optional fields. Labels can contain up to 10,000 characters; coordinates and offsets are bounded to ±10,000,000 units. Documents allow up to 10,000 objects and 10 MB of JSON. Invalid changes are rejected while preserving the last valid document. Unreadable saved data is backed up before replacement. Comic Relief sources and SIL OFL notices stay in `src/fonts/comic-relief/`.
