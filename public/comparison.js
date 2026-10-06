import { tiers } from './packages.js?v=20261005-refine';
export { tiers };
export const features = [
  {label:'Ceremony',icon:'rings',symbols:[[],['vows'],['ceremonyAudio']],excluded:[true,false,false],values:[null,'Ceremony audio','Ceremony audio']},
  {label:'Cocktail',icon:'glass',symbols:[[],['cocktailMusic'],['cocktailAudio']],excluded:[true,false,false],values:[null,'Cocktail hour music','Cocktail hour audio']},
  {label:'Reception',icon:'record',symbols:[['decks'],['djMC'],['danceAudio']],values:['DJ · entrance, dinner & dancing','Full reception DJ & MC','Reception audio']},
  {label:'Sound',icon:'speaker',symbols:[['speaker'],['ceremonySpeaker'],['speaker','speaker']],multiple:[false,false,true],values:['Professional sound system','Ceremony audio system','Multiple sound setups']},
  {label:'Mics',icon:'mic',symbols:[['toastMic'],['officiantMic'],['mic','mic']],multiple:[false,false,true],values:['Wireless microphone for toasts','Wireless officiant microphone','Additional microphones']},
  {label:'MC',icon:'voice',symbols:[['announce'],['fullMC'],[]],values:['Basic MC & announcements','Full reception MC',null]},
  {label:'Planning',icon:'plan',symbols:[['consult'],['playlist'],[]],values:['Pre-wedding planning consultation','Custom music planning',null]},
  {label:'Timeline',icon:'clock',symbols:[[],['timeline'],['coordinate']],values:[null,'Timeline coordination','Event coordination support']}
];
// Each pictogram depicts the actual inclusion, rather than repeating a checkmark.
const paths={
  rings:'<circle cx="9" cy="13" r="5"/><circle cx="15" cy="13" r="5"/><path d="m10 4 2-2 2 2-2 3z"/>',
  vows:'<path d="M4 21V9a8 8 0 0 1 16 0v12M7 21V9a5 5 0 0 1 10 0v12M3 21h5m8 0h5"/><path d="M11 15h2v4h-2zM12 19v2"/>',
  ceremonyAudio:'<path d="M3 21V8a7 7 0 0 1 14 0v3M6 21V8a4 4 0 0 1 8 0v3M2 21h6"/><rect x="14" y="12" width="7" height="9" rx="1"/><circle cx="17.5" cy="17" r="2"/>',
  glass:'<path d="m4 4 8 8 8-8H4zm8 8v8m-4 0h8M16 4l3-3"/>',
  cocktailMusic:'<path d="m2 7 6 6 6-6H2m6 6v8m-3 0h6M16 12V3l6-1v8"/><ellipse cx="14" cy="12" rx="2" ry="1.5"/><ellipse cx="20" cy="10" rx="2" ry="1.5"/>',
  cocktailAudio:'<path d="m2 4 5 6 5-6H2m5 6v9m-3 0h6"/><rect x="14" y="9" width="8" height="12" rx="1"/><circle cx="18" cy="16" r="2.3"/><path d="M17 12h2M15 3q4 1 5 4"/>',
  record:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M6 10a6 6 0 0 1 4-4m4 12a6 6 0 0 0 4-4"/>',
  decks:'<rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><path d="M12 9v7M5 17h3m8 0h3M7 11v2m10-2v2"/>',
  djMC:'<rect x="2" y="12" width="15" height="9" rx="1"/><circle cx="6" cy="16" r="2"/><circle cx="13" cy="16" r="2"/><rect x="17" y="2" width="4" height="8" rx="2"/><path d="M15 6v2a4 4 0 0 0 8 0V6m-4 6v7"/>',
  danceAudio:'<path d="M12 3v5m-8 1 4 3m12-3-4 3M3 20h18"/><circle cx="12" cy="15" r="4"/><path d="m9 13 6 4m-6 0 6-4M5 4l1 2m12-2-1 2"/>',
  speaker:'<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="15" r="4"/><circle cx="12" cy="6" r="1"/>',
  ceremonySpeaker:'<rect x="6" y="2" width="12" height="13" rx="1"/><circle cx="12" cy="9" r="3"/><path d="M12 15v4m0-1-5 4m5-4 5 4M10 5h4"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2m-6 8v4m-4 0h8"/>',
  toastMic:'<rect x="3" y="3" width="5" height="10" rx="2.5"/><path d="M1 10v2a4.5 4.5 0 0 0 9 0m-4.5 4.5V22m-3 0h6M14 3h7l-1 9a2.5 2.5 0 0 1-5 0l-1-9zm3.5 12v7m-3 0h6"/>',
  officiantMic:'<path d="M3 16h13l-2 6H5zM9 16V9l4-3"/><rect x="12" y="2" width="4" height="8" rx="2" transform="rotate(35 14 6)"/><path d="m19 6 2 1m-3 3 2 2"/>',
  voice:'<path d="M3 9h5l5-4v14l-5-4H3zm14-1q6 4 0 8m0-5q2 1 0 2"/>',
  announce:'<path d="M3 9h5l6-4v14l-6-4H3zM6 15l2 6h3l-2-5M18 10q3 2 0 4"/>',
  fullMC:'<rect x="5" y="2" width="6" height="12" rx="3"/><path d="M2 10v2a6 6 0 0 0 12 0m-6 6v4m-4 0h8M17 5q8 5 0 10m0-6q2 1 0 2"/>',
  plan:'<rect x="3" y="5" width="18" height="17" rx="2"/><path d="M7 2v6m10-6v6M3 11h18m-14 5h3m4 0h3m-10 3h3"/>',
  consult:'<path d="M2 3h13v9H8l-4 3v-3H2zM10 16h7l3 3v-3h2V8h-4M5 6h7M5 9h4"/>',
  playlist:'<path d="M2 4h10M2 9h8M2 14h6M14 18V5l7-2v13M14 8l7-2"/><ellipse cx="11" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="16" rx="3" ry="2"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  timeline:'<path d="M2 5h15M2 12h7M2 19h5"/><circle cx="18" cy="16" r="5"/><path d="M18 13v3l2 1M6 3v4M6 10v4M4 17v4"/>',
  coordinate:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a3 3 0 0 1 0 6H8a4 4 0 0 0 0 8h9m-4-3 3 3-3 3"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>'
};
export const iconMarkup=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
export function featureSymbols(feature,index){
  if(!feature.values[index])return feature.excluded?.[index]?iconMarkup('lock'):'<span aria-hidden="true">—</span>';
  return `<span class="feature-symbols${feature.multiple?.[index]?' is-multiple':''}">${(feature.symbols?.[index]??[feature.icon]).map(iconMarkup).join('')}${feature.multiple?.[index]?'<b aria-hidden="true">+</b>':''}</span>`;
}
export function mountComparison() {
  const board=document.getElementById('comparison-board'),body=document.getElementById('comparison-body'),packageSelect=document.getElementById('package-select');
  let selected=1;
  const rows=features.map((feature,rowIndex)=>{
    const row=document.createElement('div');row.className='feature-row';row.dataset.feature=rowIndex;
    const summary=document.createElement('div');summary.className='feature-summary';
    const control=document.createElement('button');control.className='feature-label';control.type='button';control.dataset.disclosure='true';control.innerHTML=`${iconMarkup(feature.icon)}<span>${feature.label}</span><i aria-hidden="true">+</i>`;
    const detailId=`feature-detail-${rowIndex}`;control.setAttribute('aria-expanded','false');control.setAttribute('aria-controls',detailId);summary.append(control);
    const toggle=()=>{row.dataset.manual='true';expand(row,!row.classList.contains('is-expanded'));};control.addEventListener('click',toggle);
    feature.values.forEach((value,index)=>{
      const cell=document.createElement('button');cell.type='button';cell.className='feature-icon';cell.dataset.column=index;cell.dataset.available=String(!!value);cell.dataset.disclosure='true';cell.innerHTML=featureSymbols(feature,index);
      if(!value)cell.classList.add(feature.excluded?.[index]?'is-excluded':'unspecified');
      const detail=value||(feature.excluded?.[index]?'Not included':'Not listed on the package sheet');cell.setAttribute('aria-label',`${tiers[index].name}: ${detail}`);cell.title=detail;cell.setAttribute('aria-controls',detailId);cell.setAttribute('aria-expanded','false');cell.addEventListener('click',()=>{if(!cell.disabled)toggle();});summary.append(cell);
    });
    const reveal=document.createElement('div');reveal.id=detailId;reveal.className='feature-reveal';reveal.inert=true;reveal.setAttribute('aria-hidden','true');
    const inner=document.createElement('div');inner.className='feature-detail-grid';inner.append(document.createElement('span'));
    feature.values.forEach((value,index)=>{const cell=document.createElement('span');cell.dataset.column=index;cell.textContent=value||(feature.excluded?.[index]?'Not included':'Not listed');if(!value)cell.className='unspecified';inner.append(cell);});reveal.append(inner);row.append(summary,reveal);body.append(row);return row;
  });
  function expand(row,open=true){row.classList.toggle('is-expanded',open);row.querySelectorAll('[data-disclosure]').forEach(control=>control.setAttribute('aria-expanded',String(open)));const reveal=row.querySelector('.feature-reveal');reveal.inert=!open;reveal.setAttribute('aria-hidden',String(!open));}
  // Reveal once on entry; no continuous scroll calculation or disappearing details.
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&scrollY>80&&!entry.target.dataset.manual){expand(entry.target);observer.unobserve(entry.target);}}},{rootMargin:'-20% 0px -18% 0px',threshold:.8});rows.forEach(row=>observer.observe(row));
  function select(index){
    if(index!==null&&!tiers[index])return;selected=index;board.dataset.selected=index===null?'':index;
    document.querySelectorAll('.package-choice').forEach(button=>{const active=Number(button.dataset.tier)===index,tile=button.closest('.package-tile');button.setAttribute('aria-pressed',String(active));tile.classList.toggle('is-selected',active);tile.classList.toggle('is-inactive',index!==null&&!active);});
    board.querySelectorAll('[data-column]').forEach(cell=>{const active=Number(cell.dataset.column)===index,inactive=index!==null&&!active;cell.classList.toggle('is-selected',active);cell.classList.toggle('is-inactive',inactive);if(cell.dataset.available!==undefined){cell.disabled=inactive||cell.dataset.available!=='true';cell.setAttribute('aria-disabled',String(cell.disabled));}});
    packageSelect.value=index===null?'Still deciding':tiers[index].name;board.dispatchEvent(new CustomEvent('tierchange',{detail:{index}}));
  }
  document.querySelectorAll('.package-choice').forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.tier))));
  packageSelect.addEventListener('change',()=>{const index=tiers.findIndex(tier=>tier.name===packageSelect.value);select(index<0?null:index);});
  select(1);
  return {select,getSelectedIndex:()=>selected,getSelected:()=>tiers[selected]??{name:'Still deciding'},setMotion(value){board.classList.toggle('instant',!value);},dispose(){observer.disconnect();}};
}
