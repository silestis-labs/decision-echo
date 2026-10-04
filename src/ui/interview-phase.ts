/** Tutor and library turns are transcript-only; a learner session cannot produce expert evidence. */
export function canCollectExpertDraft(stage:number,phase:'capture'|'map'|'teach'|undefined){return (stage===0||stage===1)&&(phase==='capture'||phase==='map');}
