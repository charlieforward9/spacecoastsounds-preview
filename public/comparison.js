import { tiers } from './packages.js?v=20261005-immersive';
export { tiers };
export const features = [
  {label:'Ceremony',icon:'rings',values:[null,'Ceremony audio','Ceremony audio']},
  {label:'Cocktail',icon:'glass',values:[null,'Cocktail hour music','Cocktail hour audio']},
  {label:'Reception',icon:'record',values:['DJ · entrance, dinner & dancing','Full reception DJ & MC','Reception audio']},
  {label:'Sound',icon:'speaker',symbols:[['speaker'],['speaker'],['speaker','speaker']],multiple:[false,false,true],values:['Professional sound system','Ceremony audio system','Multiple sound setups']},
  {label:'Mics',icon:'mic',symbols:[['mic'],['mic'],['mic','mic']],multiple:[false,false,true],values:['Wireless microphone for toasts','Wireless officiant microphone','Additional microphones']},
  {label:'MC',icon:'voice',symbols:[['announce'],['voice'],[]],values:['Basic MC & announcements','Full reception MC',null]},
  {label:'Planning',icon:'music',symbols:[['consult'],['music'],[]],values:['Pre-wedding planning consultation','Custom music planning',null]},
  {label:'Timeline',icon:'clock',symbols:[[],['timeline'],['coordinate']],values:[null,'Timeline coordination','Event coordination support']}
];
const paths={
  rings:'<circle cx="9" cy="13" r="5"/><circle cx="15" cy="13" r="5"/><path d="m10 4 2-2 2 2-2 3z"/>',
  glass:'<path d="m4 4 8 8 8-8H4zm8 8v8m-4 0h8M16 4l3-3"/>',
  record:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M6 10a6 6 0 0 1 4-4m4 12a6 6 0 0 0 4-4"/>',
  speaker:'<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="15" r="4"/><circle cx="12" cy="6" r="1"/>',
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M6 10v2a6 6 0 0 0 12 0v-2m-6 8v4m-4 0h8"/>',
  consult:'<path d="M3 4h13v9H9l-4 3v-3H3zM10 16h7l3 3v-3h1V9h-3"/><path d="M6 7h7M6 10h4"/>',
  timeline:'<path d="M3 5h14M3 12h7M3 19h5"/><circle cx="18" cy="16" r="5"/><path d="M18 13v3l2 1M7 3v4M7 10v4M5 17v4"/>',
  coordinate:'<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 5h9a3 3 0 0 1 0 6H8a4 4 0 0 0 0 8h9m-4-3 3 3-3 3"/>',
  announce:'<path d="M4 9h4l5-4v14l-5-4H4zM17 10q3 2 0 4"/>',
  voice:'<path d="M4 9h4l5-4v14l-5-4H4zm13-1q6 4 0 8m0-5q2 1 0 2"/>',
  music:'<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>'
};
export const iconMarkup=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`;
export function featureSymbols(feature,index){return feature.values[index]?`<span class="feature-symbols${feature.multiple?.[index]?' is-multiple':''}">${(feature.symbols?.[index]??[feature.icon]).map(iconMarkup).join('')}${feature.multiple?.[index]?'<b aria-hidden="true">+</b>':''}</span>`:'';}
export function mountComparison() {
  const board=document.getElementById('comparison-board'),body=document.getElementById('comparison-body'),packageSelect=document.getElementById('package-select');
  let selected=1,moving=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rows=features.map((feature,rowIndex)=>{
    const row=document.createElement('div');row.className='feature-row';row.dataset.feature=rowIndex;
    const control=document.createElement('button');control.className='feature-summary';control.type='button';control.setAttribute('aria-expanded','false');control.setAttribute('aria-controls',`feature-detail-${rowIndex}`);
    const label=document.createElement('span');label.className='feature-label';label.innerHTML=`${feature.label}<i aria-hidden="true">+</i>`;control.append(label);
    feature.values.forEach((value,index)=>{const cell=document.createElement('span');cell.className='feature-icon';cell.dataset.column=index;if(value)cell.innerHTML=featureSymbols(feature,index);else{cell.textContent='—';cell.classList.add('unspecified');}const a11y=document.createElement('span');a11y.className='sr-only';a11y.textContent=`${tiers[index].name}: ${value||'not listed on the package sheet'}. `;cell.append(a11y);control.append(cell);});
    const reveal=document.createElement('div');reveal.id=`feature-detail-${rowIndex}`;reveal.className='feature-reveal';reveal.inert=true;reveal.setAttribute('aria-hidden','true');
    const inner=document.createElement('div');inner.className='feature-detail-grid';inner.append(document.createElement('span'));
    feature.values.forEach((value,index)=>{const cell=document.createElement('span');cell.dataset.column=index;cell.textContent=value||'Not listed';if(!value)cell.className='unspecified';inner.append(cell);});reveal.append(inner);row.append(control,reveal);body.append(row);
    control.addEventListener('click',()=>{row.dataset.manual='true';expand(row,control.getAttribute('aria-expanded')!=='true');});return row;
  });
  function expand(row,open=true){row.classList.toggle('is-expanded',open);row.querySelector('button').setAttribute('aria-expanded',String(open));const reveal=row.querySelector('.feature-reveal');reveal.inert=!open;reveal.setAttribute('aria-hidden',String(!open));}
  // Reveal once on entry. No per-frame scroll work or collapsing rows under the pointer.
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&scrollY>80&&!entry.target.dataset.manual){expand(entry.target);observer.unobserve(entry.target);}}},{rootMargin:'-20% 0px -18% 0px',threshold:.8});rows.forEach(row=>observer.observe(row));
  function select(index){
    if(index!==null&&!tiers[index])return;selected=index;board.dataset.selected=index===null?'':index;
    document.querySelectorAll('.package-choice').forEach(button=>{const active=Number(button.dataset.tier)===index;button.setAttribute('aria-pressed',String(active));button.closest('.package-tile').classList.toggle('is-selected',active);});
    board.querySelectorAll('[data-column]').forEach(cell=>cell.classList.toggle('is-selected',Number(cell.dataset.column)===index));
    packageSelect.value=index===null?'Still deciding':tiers[index].name;board.dispatchEvent(new CustomEvent('tierchange',{detail:{index}}));
  }
  document.querySelectorAll('.package-choice').forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.tier))));
  packageSelect.addEventListener('change',()=>{const index=tiers.findIndex(tier=>tier.name===packageSelect.value);select(index<0?null:index);});
  select(1);
  return {select,getSelectedIndex:()=>selected,getSelected:()=>tiers[selected]??{name:'Still deciding'},setMotion(value){moving=value;board.classList.toggle('instant',!moving);},dispose(){observer.disconnect();}};
}
