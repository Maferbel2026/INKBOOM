'use strict';
const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function sprite(file,x,y,w,h,cls=''){const dims=file==='homepage'?[1024,1536]:[1536,1024];return `<span class="sprite ${cls}" style="aspect-ratio:${w}/${h}"><img src="assets/${file}.png" alt="${cls==='logo'?'Logotipo oficial INKBOOM!':cls.includes('cover')?'Portada de la referencia oficial':cls.includes('genre')?'Categoría ilustrada de la referencia':cls.includes('hero')||cls.includes('headline')?'Portada oficial: Historias que hacen BOOM!':cls.includes('reading-art')?'Cómics que te acompañan en cada historia':'Inky, mascota oficial de INKBOOM!'}" style="width:${dims[0]/w*100}%;left:${-x/w*100}%;top:${-y/h*100}%"></span>`;}
function approvedImage(key,alt,cls=''){const a=APPROVED_ASSETS[key];return `<img class="approved-image ${cls}" src="${a.file}" alt="${esc(alt)}" width="${a.width}" height="${a.height}" ${key==='hero'||key==='logo-pink'?'fetchpriority="high"':key==='reading-banner'?'loading="eager"':'loading="lazy"'} decoding="async">`;}
function approvedWindow(key,x,y,w,h,cls,alt){const a=APPROVED_ASSETS[key];return `<span class="sprite ${cls}" style="aspect-ratio:${w}/${h}"><img src="${a.file}" alt="${esc(alt)}" loading="lazy" decoding="async" style="width:${a.width/w*100}%;left:${-x/w*100}%;top:${-y/h*100}%"></span>`;}
const logo=()=>approvedImage('logo-pink','Logotipo oficial INKBOOM!','official-logo');
$('#brand').innerHTML=logo();$('#footer-brand').innerHTML=logo().replace('logo-pink.png','logo-pink.png?v=white-outline');
function parseRoute(){const [path,raw='']=location.hash.slice(1).split('?');const [page='inicio',id]=path.split('/');return {page:page||'inicio',id,params:Object.fromEntries(new URLSearchParams(raw))};}
function legacyCatalogFilters(id,params){if(!id)return validFilters(params);const aliases={'mama':'mama','papa':'papa','abuela':'abuela','abuelo':'abuelo','pareja':'pareja','hijos':'ninos','ninos':'ninos','mascotas':'mascotas','para-mi':'para-mi'};const old=slug(decodeURIComponent(id));return validFilters({...params,...(old==='cumpleanos'?{ocasion:'cumpleanos'}:aliases[old]?{destinatario:aliases[old]}:{})});}
function render(){stopCoverTimer();disposeInkyMotion();const r=parseRoute();
 if(r.page==='catalogo'){catalogFilters=legacyCatalogFilters(r.id,r.params);catalogReturn=catalogHref(catalogFilters);$('#app').innerHTML=catalog();updateCatalog();}
 else if(r.page==='comic'){catalogFilters=validFilters(r.params);catalogReturn=catalogHref(catalogFilters);const c=findComic(r.id);$('#app').innerHTML=c?comicDetails(c):unknownComic();}
 else if(r.page==='personalizar'){if(r.id&&!findComic(r.id))$('#app').innerHTML=unknownComic();else{if(r.id)selectComic(r.id,r.params.destinatario,styleFromSlug(r.params.estilo));$('#app').innerHTML=configurator();}}
 else if(r.page==='portada'){$('#app').innerHTML=coverPage(r.id);mountCoverStage(r.id);}
 else if(r.page==='resumen')$('#app').innerHTML=summary();
 else if(r.page==='pedido'){$('#app').innerHTML=orderStatusPage();mountOrderStatus(r.id);}
 else if(r.page==='pago')$('#app').innerHTML=paymentPage();
 else{$('#app').innerHTML=home();disposeInkyMotion=mountInkyMotion($('#app'));if(r.id)requestAnimationFrame(()=>document.getElementById(r.id)?.scrollIntoView());}
 if(commerceEnabled()&&['personalizar','portada','resumen','pago'].includes(r.page))$('#app').insertAdjacentHTML('afterbegin',`<p class="wrap" id="commerce-status" role="status">${esc(commerceSession.lastError||'Sandbox · borrador privado · precios finales · envío gratis a México')}</p>`);
 $('#bag-count').textContent=state.started?'1':'0';$('#nav').classList.remove('open');$('.menu-toggle').setAttribute('aria-expanded','false');
}
function dialog(html){$('#info').classList.remove('image-viewer');$('#info-body').innerHTML=html;$('#info').showModal();}
function missingNames(){return state.people.slice(0,state.count).some(p=>!p.name.trim());}
function navigate(hash){if(location.hash===hash)render();else location.hash=hash;}
document.addEventListener('input',e=>{const t=e.target;if(t.hasAttribute('data-delivery-email'))updateDeliveryEmail(t);if(t.dataset.field)state[t.dataset.field]=t.value;if(t.dataset.person!==undefined)state.people[Number(t.dataset.person)][t.dataset.key]=t.value;});
document.addEventListener('submit',e=>{if(e.target.id==='catalog-search'){e.preventDefault();const next={...catalogFilters};const q=$('#search').value.trim();if(q)next.q=q;else delete next.q;navigate(catalogHref(next));}});
document.addEventListener('change',async e=>{const t=e.target;
 if(t.id==='lab-story'){labSelection.story=t.value;updateStoryLab();return;}
 if(t.dataset.catalogFilter){const next={...catalogFilters};if(t.value)next[t.dataset.catalogFilter]=t.value;else delete next[t.dataset.catalogFilter];navigate(catalogHref(next));return;}
 if(t.matches('.choice input')){state[t.name]=t.name==='count'?Number(t.value):t.value;state.started=true;if(t.name==='style')history.replaceState(null,'','#personalizar/'+state.story+'?destinatario='+state.recipient+'&estilo='+slug(state.style));render();}
 if(t.id==='story-choice'){selectComic(t.value,state.recipient);if(parseRoute().page==='personalizar')history.replaceState(null,'','#personalizar/'+state.story+'?destinatario='+state.recipient+'&estilo='+slug(state.style));render();}
 if(t.id==='recipient-choice'){state.recipient=t.value;const compatible=discoverComics({destinatario:t.value});if(!compatible.some(c=>c.id===state.story))state.story=compatible[0].id;state.started=true;history.replaceState(null,'','#personalizar/'+state.story+'?destinatario='+state.recipient+'&estilo='+slug(state.style));render();}
 if(t.name==='edition'){state.edition=t.value;state[findEdition(t.value).format==='printed'?'printEdition':'digitalEdition']=t.value;state.started=true;render();}
 if(t.id==='dedication'){state.dedication=t.checked;render();}
 if(t.dataset.upload!==undefined){const i=Number(t.dataset.upload),person=state.people[i],errors=[];
  for(const f of t.files){if(!['image/jpeg','image/png','image/webp'].includes(f.type)){errors.push(`${f.name}: usa JPG, PNG o WEBP.`);continue;}if(f.size>10*1024*1024){errors.push(`${f.name}: supera 10 MB.`);continue;}if(person.photos.length>=4){errors.push('Máximo 4 fotos por protagonista.');break;}const url=URL.createObjectURL(f);try{const img=new Image();img.src=url;await img.decode();const photo={url,name:f.name};Object.defineProperty(photo,'file',{value:f});person.photos.push(photo);}catch{URL.revokeObjectURL(url);errors.push(`${f.name}: no pudimos leer la imagen.`);}}
  render();const error=$(`#upload-error-${i}`);if(error)error.textContent=errors.join(' ');queueCommerceSave();
 }
});
document.addEventListener('click',e=>{const t=e.target.closest('button,a');if(!t)return;if(handleCoverAction(t))return;
 if(t.hasAttribute('data-new-commerce-draft')){void startNewCommerceDraft();return;}
 if(t.dataset.labStyle){labSelection.style=t.dataset.labStyle;updateStoryLab();return;}
 if(t.dataset.startComic){step=0;selectComic(t.dataset.startComic,t.dataset.recipient,t.dataset.style);}
 if(t.dataset.info)dialog(`<h2>Estamos imaginando el siguiente capítulo.</h2><p>${esc(t.dataset.info)}</p>`);
 if(t.matches('.close,.close-demo'))$('#info').close();
 if(t.matches('.menu-toggle')){const open=$('#nav').classList.toggle('open');t.setAttribute('aria-expanded',String(open));}
 if(t.dataset.step!==undefined){showPersonalizationStep(Number(t.dataset.step));}
 if(t.hasAttribute('data-edit-personalization')){step=0;navigate('#personalizar');}
 if(t.dataset.format){state.edition=t.dataset.format==='digital'?(state.digitalEdition||'digital-mini'):(state.printEdition||'mini');state.started=true;render();}
 if(t.id==='back'){if(step){showPersonalizationStep(step-1);}else navigate(catalogReturn);}
 if(t.id==='next'){state.started=true;if(step===1&&missingNames()){$('#form-error').textContent='Añade el nombre de cada protagonista para continuar.';$('[data-key="name"]')?.focus();return;}if(step<3){showPersonalizationStep(step+1);}else if(missingNames()){step=1;render();$('#form-error').textContent='Falta el nombre de uno o más protagonistas.';}else openCoverExperience();}
 if(t.dataset.remove){const [i,n]=t.dataset.remove.split(',').map(Number);URL.revokeObjectURL(state.people[i].photos[n].url);state.people[i].photos.splice(n,1);render();}
 if(t.id==='checkout'){if(commerceEnabled()){if(coverSession.acceptedKey!==coverSnapshot().key){navigate('#portada/transicion');return;}void startStripeCheckout();}else openPaymentDemo();return;}
 if(t.hasAttribute('data-stripe-checkout')){void startStripeCheckout();return;}
 if(t.hasAttribute('data-payment-demo'))dialog('<span class="eyebrow">Prueba completada · Sin cobro</span><h2>¡Así terminaría tu compra!</h2><p>Has llegado al final de la demostración. No se ha realizado un pago ni creado un pedido. Tus fotos y los detalles de tu historia siguen en esta pestaña. El correo se registró en INKBOOM para tu cómic.</p><button class="button close-demo">Volver a mi aventura →</button>');
});
window.addEventListener('hashchange',()=>{render();if(parseRoute().page!=='inicio'||!parseRoute().id)window.scrollTo(0,0);});
render();

if(commerceEnabled()){document.querySelector('.prototype-bar')?.replaceChildren(document.createTextNode('INKBOOM · Stripe Sandbox · Sin cobros reales'));document.addEventListener('input',queueCommerceSave);document.addEventListener('change',queueCommerceSave);document.addEventListener('click',e=>{if(e.target.closest('[data-remove],[data-format],[data-step],#next'))queueCommerceSave();});void initializeCommerce();}
