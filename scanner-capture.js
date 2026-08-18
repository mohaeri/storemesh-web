export function createScannerCapture({maxGapMs=80,minLength=3}={}){
  let buffer='',lastAt=0,target=null;
  const arm=input=>{target=input;buffer='';lastAt=0;input.value='';input.dataset.scanVerified='false'};
  const handle=event=>{
    if(!target||!event.isTrusted)return false;
    const now=event.timeStamp||performance.now();
    if(event.key==='Enter'){
      const accepted=buffer.length>=minLength;
      if(accepted){target.value=buffer;target.dataset.scanVerified='true';target.dispatchEvent(new Event('change',{bubbles:true}))}
      buffer='';lastAt=0;return accepted;
    }
    if(event.key.length!==1)return false;
    if(lastAt&&now-lastAt>maxGapMs)buffer='';
    buffer+=event.key;lastAt=now;return false;
  };
  return{arm,handle,isVerified:input=>input?.dataset.scanVerified==='true'};
}

export function bindScannerInputs(root=document){
  const scanner=createScannerCapture();
  for(const input of root.querySelectorAll('[data-scanner-input]')){
    input.readOnly=true;input.inputMode='none';input.addEventListener('pointerdown',()=>scanner.arm(input));input.addEventListener('focus',()=>scanner.arm(input));
  }
  root.addEventListener('keydown',scanner.handle,{capture:true});
  return scanner;
}
