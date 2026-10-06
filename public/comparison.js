const tiers = [
  {name:'Reception',title:'Reception'},
  {name:'Ceremony & Reception',title:'Ceremony + Reception'},
  {name:'All-Day Audio',title:'All-Day Audio'}
];
const features = [
  {label:'Ceremony',values:[null,['Audio coverage'],['Audio coverage']]},
  {label:'Cocktail hour',values:[null,['Music'],['Audio coverage']]},
  {label:'Reception',values:[['DJ service','Entrance, dinner & dancing'],['Full DJ & MC'],['Audio coverage']]},
  {label:'Sound system',values:[['Professional system'],['Ceremony audio'],['Multiple setups']]},
  {label:'Microphones',values:[['Wireless toast mic'],['Wireless officiant mic'],['Additional mics']]},
  {label:'MC services',values:[['Basic announcements'],['Full reception MC'],null]},
  {label:'Music & planning',values:[['Planning consultation','Pre-wedding'],['Custom music planning'],null]},
  {label:'Coordination',values:[null,['Timeline coordination'],['Event support']]}
];
export function mountComparison() {
  const board=document.getElementById('comparison-board'),head=document.getElementById('comparison-head'),body=document.getElementById('comparison-body'),packageSelect=document.getElementById('package-select');
  const tr=document.createElement('tr'),corner=document.createElement('th');corner.scope='col';corner.className='comparison-corner';corner.textContent='Inclusions';tr.append(corner);
  tiers.forEach((tier,index)=>{const th=document.createElement('th');th.scope='col';th.id=`tier-${index}`;th.dataset.column=index;th.className=index===1?'is-selected':'';th.textContent=tier.title;tr.append(th);});head.append(tr);
  features.forEach((feature,rowIndex)=>{
    const row=document.createElement('tr');row.className='comparison-row';const label=document.createElement('th');label.scope='row';label.id=`feature-${rowIndex}`;label.textContent=feature.label;row.append(label);
    feature.values.forEach((value,index)=>{
      const cell=document.createElement('td');cell.dataset.column=index;cell.setAttribute('headers',`feature-${rowIndex} tier-${index}`);if(index===1)cell.classList.add('is-selected');
      if(!value){cell.classList.add('unspecified');cell.textContent='—';cell.setAttribute('aria-label',`${tiers[index].name}: not specified on the package sheet`);}
      else{const main=document.createElement('span');main.className='cell-main';main.textContent=value[0];cell.append(main);if(value[1]){const detail=document.createElement('span');detail.className='cell-detail';detail.textContent=value[1];cell.append(detail);}}
      row.append(cell);
    });body.append(row);
  });
  let selected=1;
  function select(index){
    if(index!==null&&!tiers[index])return;
    selected=index;board.dataset.selected=index===null?'':index;
    document.querySelectorAll('[data-tier]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.tier)===index)));
    board.querySelectorAll('[data-column]').forEach(cell=>cell.classList.toggle('is-selected',Number(cell.dataset.column)===index));
    packageSelect.value=index===null?'Still deciding':tiers[index].name;
    board.dispatchEvent(new CustomEvent('tierchange',{detail:{index}}));
  }
  document.querySelectorAll('[data-tier]').forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.tier))));
  packageSelect.addEventListener('change',()=>{const index=tiers.findIndex(tier=>tier.name===packageSelect.value);select(index<0?null:index);});
  board.dataset.selected='1';
  return {select,getSelected:()=>tiers[selected]??{name:'Still deciding'}};
}
