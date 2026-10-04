import {useEffect,useRef,useState} from 'react';
import './before-share.css';
import {createPortal} from 'react-dom';

/** An authorization declaration, not proof of internal approval or blanket consent. */
export function BeforeShare({open,onCancel,onContinue}:{open:boolean;onCancel:()=>void;onContinue:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [checked,setChecked]=useState(false);
 useEffect(()=>{if(open){setChecked(false);dialog.current?.showModal();}else dialog.current?.close();},[open]);
 return createPortal(<dialog ref={dialog} className="before-share" aria-labelledby="before-share-title" onCancel={onCancel} onKeyDown={e=>{if(e.key==='Escape')e.stopPropagation();}}>
  <BeforeShareContent checked={checked} onChecked={setChecked} onCancel={onCancel} onContinue={onContinue}/>
 </dialog>,document.body);
}

export function BeforeShareContent({checked,onChecked,onCancel,onContinue}:{checked:boolean;onChecked:(value:boolean)=>void;onCancel:()=>void;onContinue:()=>void}){return <>
  <h2 id="before-share-title">Before you share</h2>
  <p>Decision Echo processes shared screen content and voice using external AI services. Only share information you are authorized to use.</p>
  <p>For confidential company information or personal data, check your organization’s policy and obtain any required approval from the responsible internal contact before starting.</p>
  <p>Use fictional data for this demo. You can stop sharing at any time. Read our <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Notice</a> for details.</p>
  <label className="before-share-check"><input autoFocus type="checkbox" checked={checked} onChange={e=>onChecked(e.target.checked)}/> I am authorized to share this content and have obtained any required approval.</label>
  <div className="actions"><button className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={!checked} onClick={()=>{if(checked)onContinue();}}>Continue to screen sharing</button></div>
 </>;}
