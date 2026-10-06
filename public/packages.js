// Preview ladder based on the flyer. All-Day builds on the middle plan by request.
// Equipment counts illustrate categories, not equipment guarantees.
export const tiers=[
 {name:'Reception',title:'Reception',hours:4,coverage:['party'],distributed:false,additionalMics:false},
 {name:'Ceremony & Reception',title:'Ceremony + Reception',hours:6,coverage:['ceremony','cocktail','party'],distributed:false,additionalMics:false},
 {name:'All-Day Audio',title:'All-Day Audio',hours:8,coverage:['ceremony','cocktail','party'],distributed:true,additionalMics:true,buildsOn:1}
];
export function audioProfile(index,mode){
 const tier=tiers[index]??tiers[1],covered=tier.coverage.includes(mode);
 return {covered,distributed:tier.distributed,additionalMics:tier.additionalMics,speakerPairs:covered?(tier.distributed?2:1):0,microphones:covered?(tier.additionalMics?2:1):0};
}

export const phaseAvailable=(index,mode)=>(tiers[index]??tiers[1]).coverage.includes(mode);
export function resolvePhase(index,mode){const tier=tiers[index]??tiers[1];return tier.coverage.includes(mode)?mode:tier.coverage[tier.coverage.length-1];}
