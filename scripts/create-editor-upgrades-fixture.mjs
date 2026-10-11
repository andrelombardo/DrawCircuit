import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
const result = await build({
  stdin: {
    contents: `
import {createComponent} from './src/model/catalog';
import {createJunction,createWire} from './src/model/factories';
import {emptyDocument} from './src/model/demo';
import {createCurrent} from './src/annotations/electrical';
import {exportStandalone,exportObsidian} from './src/tikz/exporter';
import {exportSVG} from './src/svg/exporter';
import {mirrorArrow,rotateArrow} from './src/utils/arrows';
const nodes=[createJunction({x:-200,y:100},'A'),createJunction({x:200,y:100},'B'),createJunction({x:0,y:-100},'C')];
nodes[0].label.offset={x:-22,y:0};nodes[1].label.offset={x:22,y:0};
const components=[createComponent('resistor',{x:0,y:100},1),createComponent('resistor',{x:-100,y:0},2),createComponent('resistor',{x:100,y:0},3)];
components[1].rotation=315;components[2].rotation=45;components[0].opacity=.5;components[0].label.opacity=.8;
const ends=[[0,1],[0,2],[2,1]];
const wires=components.flatMap((c,i)=>c.terminals.map((t,k)=>createWire({kind:'terminal',componentId:c.id,terminalId:t.id},{kind:'junction',junctionId:nodes[ends[i][k]].id},[],'45')));
const circuit={...emptyDocument(),title:'Triangolo · routing, opacità e frecce',objects:[...nodes,...components,...wires]};
const current=createCurrent(wires[0],{x:-130,y:100},circuit);current.label.text='i_1';
const curve=rotateArrow(mirrorArrow({kind:'arrow',id:'qa-curve',type:'curve',start:{x:-200,y:240},end:{x:0,y:240},controlPoints:[{x:-160,y:135},{x:-45,y:330}],color:'#2571c7',width:3,reversed:false,opacity:.5},'horizontal'),17);
const loop={kind:'loop-arrow',id:'qa-loop',x:60,y:180,width:140,height:80,rotation:27,direction:'clockwise',arrowPosition:.19,color:'#df4949',strokeWidth:2,opacity:.65};
circuit.objects.push(current,curve,loop);
export const fixture={circuit,tex:exportStandalone(circuit),obsidian:exportObsidian(circuit),svg:exportSVG(circuit)};
`,
    resolveDir: process.cwd(),
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
});
const { fixture } = await import(
  'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64')
);
const dir = 'docs/editor-upgrades/evidence';
mkdirSync(dir, { recursive: true });
writeFileSync(dir + '/triangle.json', JSON.stringify(fixture.circuit, null, 2));
writeFileSync(dir + '/triangle.tex', fixture.tex);
writeFileSync(dir + '/triangle-obsidian.md', fixture.obsidian);
writeFileSync(dir + '/triangle.svg', fixture.svg);
console.log('Generated connected triangle and canonical exports.');

writeFileSync(
  dir + '/triangle-block.json',
  JSON.stringify(
    {
      version: 1,
      blocks: [{ id: 'editor-upgrades-triangle', name: 'Triangolo QA', document: fixture.circuit }],
    },
    null,
    2,
  ),
);
