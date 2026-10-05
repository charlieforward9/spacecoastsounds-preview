const tiers = [
  {name:'Reception',title:'Reception',price:800,hours:4,kicker:'THE AFTER PARTY',features:['Up to 4 hours of DJ service','Professional sound system','Wireless microphone for toasts','Music for grand entrance, dinner & dancing','Basic MC services & announcements','Pre-wedding planning consultation','Setup & teardown included']},
  {name:'Ceremony & Reception',title:'Ceremony + Reception',price:1000,hours:6,kicker:'FROM VOWS TO LAST SONG',features:['Up to 6 hours of total coverage','Ceremony audio & wireless officiant microphone','Cocktail hour music','Full reception DJ & MC','Custom music planning','Timeline coordination','Setup & teardown included']},
  {name:'All-Day Audio',title:'All-Day Audio',price:1400,hours:8,kicker:'THE WHOLE CELEBRATION',features:['Up to 8 hours of total coverage','Ceremony, cocktail hour & reception','Multiple sound setups','Additional microphones','Event coordination support','Setup & teardown included']}
];
const features = [
  {label:'Ceremony',values:[null,['Audio coverage'],['Audio coverage']]},
  {label:'Cocktail hour',values:[null,['Music'],['Audio coverage']]},
  {label:'Reception',values:[['DJ service','Entrance, dinner & dancing'],['Full DJ & MC'],['Audio coverage']]},
  {label:'Sound system',values:[['Professional system'],['Ceremony audio','Other setups not specified'],['Multiple setups']]},
  {label:'Microphones',values:[['Wireless toast mic'],['Wireless officiant mic'],['Additional mics']]},
  {label:'MC services',values:[['Basic announcements'],['Full reception MC'],null]},
  {label:'Music & planning',values:[['Planning consultation','Pre-wedding'],['Custom music planning'],null]},
  {label:'Coordination',values:[null,['Timeline coordination'],['Event support']]}
];

export function mountComparison() {
  const board=document.getElementById('comparison-board');
  const head=document.getElementById('comparison-head'),body=document.getElementById('comparison-body');
  const tr=document.createElement('tr'),corner=document.createElement('th');corner.scope='col';corner.className='comparison-corner';corner.innerHTML='<span>YOUR CELEBRATION,<br>YOUR COVERAGE.</span><i aria-hidden="true">✦</i>';tr.append(corner);
  tiers.forEach((tier,index)=>{
    const th=document.createElement('th');th.scope='col';th.id=`tier-${index}`;th.dataset.column=index;th.className=index===1?'is-selected':'';
    const button=document.createElement('button');button.type='button';button.className='tier-button';button.dataset.tier=index;button.dataset.package=tier.name;button.setAttribute('aria-pressed',String(index===1));
    const kicker=document.createElement('span');kicker.className='tier-kicker';kicker.textContent=tier.kicker;
    const title=document.createElement('span');title.className='tier-title';title.textContent=tier.title;
    const price=document.createElement('span');price.className='tier-price';price.textContent=`$${tier.price.toLocaleString('en-US')}`;
    const duration=document.createElement('span');duration.className='tier-duration';duration.textContent=`Up to ${tier.hours} hours`;
    const selected=document.createElement('span');selected.className='tier-selected';selected.setAttribute('aria-hidden','true');selected.textContent='✓';
    button.append(kicker,title,price,duration,selected);th.append(button);tr.append(th);
  });head.append(tr);
  features.forEach((feature,rowIndex)=>{
    const row=document.createElement('tr');row.className='comparison-row';const label=document.createElement('th');label.scope='row';label.id=`feature-${rowIndex}`;label.textContent=feature.label;row.append(label);
    feature.values.forEach((value,index)=>{
      const cell=document.createElement('td');cell.dataset.column=index;cell.setAttribute('headers',`feature-${rowIndex} tier-${index}`);if(index===1)cell.classList.add('is-selected');
      if(!value){cell.classList.add('unspecified');cell.textContent='—';cell.setAttribute('aria-label',`${tiers[index].name}: not specified on the package sheet`);}
      else{const main=document.createElement('span');main.className='cell-main';main.textContent=value[0];cell.append(main);if(value[1]){const detail=document.createElement('span');detail.className='cell-detail';detail.textContent=value[1];cell.append(detail);}}
      row.append(cell);
    });body.append(row);
  });
  tiers.forEach(tier=>{const article=document.createElement('article'),h3=document.createElement('h3'),ul=document.createElement('ul');h3.textContent=tier.title;for(const feature of tier.features){const li=document.createElement('li');li.textContent=feature;ul.append(li);}article.append(h3,ul);document.getElementById('package-source-grid').append(article);});
  let selected=1;
  function select(index){selected=index;board.dataset.selected=index;document.querySelectorAll('[data-tier]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.tier)===index)));board.querySelectorAll('[data-column]').forEach(cell=>cell.classList.toggle('is-selected',Number(cell.dataset.column)===index));const cta=document.getElementById('comparison-cta');cta.dataset.package=tiers[index].name;cta.setAttribute('aria-label',`Ask about the ${tiers[index].name} package`);document.getElementById('package-select').value=tiers[index].name;board.dispatchEvent(new CustomEvent('tierchange',{detail:{index,tier:tiers[index]}}));}
  document.querySelectorAll('[data-tier]').forEach(button=>button.addEventListener('click',()=>select(Number(button.dataset.tier))));
  board.dataset.selected='1';
  return {select,getSelected:()=>tiers[selected]};
}
