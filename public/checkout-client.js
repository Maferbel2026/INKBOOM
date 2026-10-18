/* Personalization persistence is enabled only on the dedicated Sandbox backend. */
const commerceSession={draftId:null,revision:null,busy:false,timer:null,queue:Promise.resolve(),catalogReady:false,poll:null,lastError:'',restoring:false};
const commerceEnabled=()=>typeof CHECKOUT_CONFIG!=='undefined'&&CHECKOUT_CONFIG.enabled===true;
const commerceURL=path=>(CHECKOUT_CONFIG.apiBase||'')+path;
function commerceNote(message,error=false){commerceSession.lastError=error?message:'';const el=document.getElementById('commerce-status');if(el){el.textContent=message;el.setAttribute('role',error?'alert':'status');}}
async function commerceRequest(path,options={}){
 const response=await fetch(commerceURL(path),{credentials:'include',signal:AbortSignal.timeout(options.body instanceof Blob?60000:30000),...options});const result=await response.json();
 if(!response.ok){const e=new Error(result.error||'No pudimos guardar tu aventura.');e.status=response.status;throw e;}return result;
}
function draftPayload(){return {story:state.story,recipient:state.recipient,style:state.style,edition:state.edition,count:Number(state.count),
 people:state.people.slice(0,state.count).map(p=>({name:p.name,traits:p.traits,photos:p.photos.filter(p=>p.fileId).map(p=>({id:p.fileId}))})),
 ...Object.fromEntries(['memory','phrase','details','feeling','dedication','from','to','message','position'].map(k=>[k,state[k]])),
 email:deliveryContact.email.trim(),coverAccepted:coverSession.acceptedKey===coverSnapshot().key};}
function rememberDraft(){try{localStorage.setItem('inkboom-sandbox-draft',commerceSession.draftId);}catch{}}
async function persistDraft(){
 if(!commerceEnabled()||!state.started||commerceSession.restoring)return;
 commerceNote('Guardando tu aventura…');
 if(!commerceSession.draftId){const payload=draftPayload();payload.people.forEach(p=>p.photos=[]);const d=await commerceRequest('/api/drafts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});Object.assign(commerceSession,{draftId:d.id,revision:d.revision});rememberDraft();}
 // Upload the actual File, never the temporary blob URL. Non-enumerable IDs preserve cover identity.
 for(const [i,p] of state.people.slice(0,state.count).entries())for(const photo of p.photos){
  if(photo.fileId)continue;if(!photo.file)throw new Error('Vuelve a añadir la foto: no está disponible para guardarla.');
  const result=await commerceRequest(`/api/drafts/${commerceSession.draftId}/files?person=${i}`,{method:'POST',headers:{'Content-Type':photo.file.type,'X-File-Name':encodeURIComponent(photo.name)},body:photo.file});
  Object.defineProperty(photo,'fileId',{value:result.id,writable:true,configurable:true});
 }
 const result=await commerceRequest(`/api/drafts/${commerceSession.draftId}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:commerceSession.revision,payload:draftPayload()})});
 commerceSession.revision=result.revision;commerceNote('Borrador guardado · se elimina tras 7 días sin actividad.');
}
function saveCommerce(){
 if(!commerceEnabled())return Promise.resolve();
 commerceSession.queue=commerceSession.queue.catch(()=>{}).then(persistDraft);return commerceSession.queue;
}
function queueCommerceSave(){if(!commerceEnabled()||commerceSession.restoring)return;clearTimeout(commerceSession.timer);commerceSession.timer=setTimeout(()=>saveCommerce().catch(e=>commerceNote(e.message,true)),650);}
async function restoreCommerce(){
 if(!commerceSession.draftId)return;commerceSession.restoring=true;
 try{
  const saved=await commerceRequest(`/api/drafts/${commerceSession.draftId}`);commerceSession.revision=saved.revision;
  const p=saved.payload;const {email,coverAccepted,...personalization}=p;Object.assign(state,personalization,{started:true,people:p.people.map(person=>({...person,photos:person.photos.map(photo=>{
   const file=saved.files.find(f=>f.id===photo.id);if(!file)return null;
   const result={url:commerceURL(`/api/files/${photo.id}`),name:file.name};Object.defineProperty(result,'fileId',{value:photo.id,writable:true,configurable:true});return result;
  }).filter(Boolean)}))});
  while(state.people.length<2)state.people.push({name:'',traits:'',photos:[]});
  deliveryContact.email=p.email;state[findEdition(state.edition).format==='printed'?'printEdition':'digitalEdition']=state.edition;
  if(p.coverAccepted){coverSession.result={snapshot:coverSnapshot(),attempt:coverSession.used};coverSession.accept(coverSnapshot().key);}
 }catch(e){if([401,404,410].includes(e.status)){commerceSession.draftId=null;commerceSession.revision=null;try{localStorage.removeItem('inkboom-sandbox-draft');}catch{}}commerceNote(e.message,true);}
 finally{commerceSession.restoring=false;render();}
}
async function initializeCommerce(){
 if(!commerceEnabled())return;
 try{commerceSession.draftId=localStorage.getItem('inkboom-sandbox-draft');}catch{}
 await restoreCommerce();
 try{
  const catalog=await commerceRequest('/api/catalog');
  if(catalog.mode!=='sandbox'||catalog.editions.length!==7)throw new Error('No pudimos verificar el catálogo Sandbox.');
  for(const item of catalog.editions){const local=findEdition(item.id);if(!local||local.priceId!==item.priceId||local.price*100!==item.amount)throw new Error('Los precios cambiaron. Actualiza la página y revisa tu edición.');}
  commerceSession.catalogReady=true;commerceNote('Stripe Sandbox · precios verificados.');
 }catch(e){commerceNote(e.message,true);}
 if(parseRoute().page==='pedido')mountOrderStatus(parseRoute().id);
}
async function startStripeCheckout(){
 if(commerceSession.busy)return;commerceSession.busy=true;const button=document.querySelector('[data-cover-pay],#checkout,[data-stripe-checkout]');
 if(button){button.disabled=true;button.textContent='Guardando tu aventura…';}
 try{
  if(!validDeliveryEmail(deliveryContact.email))throw new Error('Añade un correo válido en tu portada.');
  if(!commerceSession.catalogReady){const result=await commerceRequest('/api/catalog');commerceSession.catalogReady=result.mode==='sandbox';}
  clearTimeout(commerceSession.timer);await saveCommerce();
  const result=await commerceRequest('/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({draftId:commerceSession.draftId,revision:commerceSession.revision})});
  const target=new URL(result.url);if(target.origin!=='https://checkout.stripe.com')throw new Error('Checkout no válido.');location.assign(target.href);
 }catch(e){commerceNote(e.message,true);const el=document.getElementById('delivery-email-error');if(el)el.textContent=e.message;}
 finally{commerceSession.busy=false;if(button){button.disabled=false;button.textContent='¡QUIERO MI CÓMIC! →';}}
}
async function startNewCommerceDraft(){
 if(commerceSession.busy)return false;
 clearTimeout(commerceSession.timer);clearTimeout(commerceSession.poll);await commerceSession.queue.catch(()=>{});
 for(const person of state.people)for(const photo of person.photos)if(photo.url.startsWith('blob:'))URL.revokeObjectURL(photo.url);
 Object.assign(state,freshPersonalization());Object.assign(deliveryContact,{email:'',savedEmail:'',requestId:'',pending:false});
 Object.assign(commerceSession,{draftId:null,revision:null,lastError:'',restoring:false});
 try{localStorage.removeItem('inkboom-sandbox-draft');}catch{}
 // Leave the demo quota intact; starting another order never grants extra cover attempts.
 coverSession.pending=null;coverSession.result=null;coverSession.acceptedKey=null;step=0;navigate('#personalizar');return true;
}
function orderStatusPage(){return `<section class="wrap payment-page"><span class="eyebrow">Stripe Sandbox · Sin cobro real</span><h1>Tu siguiente capítulo.</h1><p id="order-status" role="status">Consultando la confirmación del pago…</p><p>El pedido se confirma con el aviso seguro de Stripe. Esta pantalla no inicia la generación del cómic.</p><a href="#resumen" class="button secondary">Revisar mi aventura →</a> <span id="new-adventure"></span></section>`;}
function mountOrderStatus(id){
 clearTimeout(commerceSession.poll);if(!commerceEnabled())return;
 let attempts=0;
 const tick=async()=>{
  if(parseRoute().page!=='pedido')return;
  try{const result=await commerceRequest(`/api/orders/${id}`);const el=document.getElementById('order-status');if(!el)return;
   const messages={paid_verified:'¡Pago de prueba confirmado! Tu pedido está guardado y pendiente de procesamiento de demostración.',review:'Tu pago requiere revisión. No vuelvas a pagar.',payment_pending:'Esperando la confirmación segura de Stripe. No vuelvas a pagar.',expired:'El Checkout venció. Tu borrador sigue disponible.',failed:'El pago no se confirmó. Puedes recuperar tu borrador.'};
   el.textContent=messages[result.state]||'Esperando el aviso seguro de Stripe…';const next=document.getElementById('new-adventure');if(next)next.innerHTML=result.state==='paid_verified'?'<button class="button secondary" data-new-commerce-draft>Crear otra aventura →</button>':'';if(['paid_verified','review','expired','failed'].includes(result.state))return;
  }catch(e){const el=document.getElementById('order-status');if(el)el.textContent=e.message;return;}
  if(++attempts<40)commerceSession.poll=setTimeout(tick,1500);
 };void tick();
}
