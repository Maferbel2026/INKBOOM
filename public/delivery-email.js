/* Contact details are intentionally separate from the cover-generation snapshot. */
const deliveryContact = { email: '', savedEmail: '', requestId: '', pending: false };
function validDeliveryEmail(value) {
 const email=String(value||'').trim();
 return email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function deliveryEmailPanel() {
 return `<div class="delivery-email-panel"><span class="delivery-email-kicker">EL DESTINO DE TU AVENTURA</span><h3>¿A dónde quieres que enviemos tu cómic?</h3><p>Déjanos el correo donde te gustaría recibir tu historia.</p><label for="delivery-email">Correo electrónico <span>· obligatorio</span></label><input id="delivery-email" data-delivery-email type="email" autocomplete="email" inputmode="email" maxlength="254" required value="${esc(deliveryContact.email)}" placeholder="tu@correo.com" aria-describedby="delivery-email-note delivery-email-error"><p id="delivery-email-note" class="delivery-email-note">${EMAIL_CAPTURE_CONFIG.endpoint?'Al continuar registraremos este correo para tu cómic.':'En esta prueba, el correo permanece únicamente en esta pestaña.'}</p><p id="delivery-email-error" class="field-error" role="alert"></p></div>`;
}
function updateDeliveryEmail(input) {
 const value=input.value;
 if(value.trim()!==deliveryContact.email.trim()) { deliveryContact.savedEmail=''; deliveryContact.requestId=''; }
 deliveryContact.email=value;
 input.removeAttribute('aria-invalid');
 const error=document.getElementById('delivery-email-error');
 if(error)error.textContent='';
}
async function registerDeliveryEmail() {
 const email=deliveryContact.email.trim();
 if(!validDeliveryEmail(email))return {ok:false,reason:'invalid'};
 if(!EMAIL_CAPTURE_CONFIG.endpoint)return {ok:true,mode:'demo'};
 if(deliveryContact.savedEmail===email)return {ok:true,mode:'saved'};
 if(!deliveryContact.requestId)deliveryContact.requestId=crypto.randomUUID();
 const response=await fetch(EMAIL_CAPTURE_CONFIG.endpoint,{
  method:'POST',credentials:'omit',headers:{'Content-Type':'text/plain;charset=UTF-8'},
  body:JSON.stringify({email,requestId:deliveryContact.requestId}),signal:AbortSignal.timeout(12000)
 });
 if(!response.ok)throw new Error('Email receiver unavailable');
 const result=await response.json();
 if(result.ok!==true)throw new Error('Email receiver did not acknowledge storage');
 deliveryContact.email=email;deliveryContact.savedEmail=email;
 return {ok:true,mode:'saved'};
}
async function prepareDeliveryEmail() {
 if(deliveryContact.pending)return false;
 const input=document.getElementById('delivery-email');
 if(input)deliveryContact.email=input.value;
 const error=document.getElementById('delivery-email-error');
 if(!validDeliveryEmail(deliveryContact.email)){
  if(error)error.textContent='Escribe un correo válido, por ejemplo: tu@correo.com.';
  if(input){input.setAttribute('aria-invalid','true');input.focus();}
  return false;
 }
 const button=document.querySelector('[data-cover-pay]');
 deliveryContact.pending=true;
 if(input)input.disabled=true;
 if(button){button.disabled=true;button.textContent=EMAIL_CAPTURE_CONFIG.endpoint?'Guardando tu correo…':'Continuando…';}
 try{
  const result=await registerDeliveryEmail();
  return result.ok && (!input || input.isConnected);
 }catch{
  if(error)error.textContent='No pudimos confirmar el registro de tu correo. Inténtalo de nuevo; tus detalles siguen aquí.';
  return false;
 }finally{
  deliveryContact.pending=false;
  if(input)input.disabled=false;
  if(button){button.disabled=false;button.textContent='¡QUIERO MI CÓMIC! →';}
 }
}
