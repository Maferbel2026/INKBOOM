/* Edition specifications and prices supplied by Ferry. Unknowns stay explicit. */
const PRINT_SIZE='15.6 × 23.4 cm';
const EDITIONS=[
 {id:'digital-mini',name:'INKBOOM! Mini',benefit:'Una aventura breve y especial',format:'digital',pages:24,binding:null,includesDigital:true},
 {id:'digital-original',name:'INKBOOM! Original',benefit:'Una historia con más momentos y emociones',recommended:true,format:'digital',pages:52,binding:null,includesDigital:true},
 {id:'digital-deluxe',name:'INKBOOM! Deluxe',benefit:'La experiencia narrativa más completa',format:'digital',pages:80,binding:null,includesDigital:true},
 {id:'mini',name:'INKBOOM! Mini',benefit:'Una aventura breve y especial',format:'printed',pages:24,binding:'Cubierta grapada',includesDigital:true},
 {id:'original',name:'INKBOOM! Original',benefit:'Una historia con más momentos y emociones',recommended:true,format:'printed',pages:52,binding:'Tapa blanda',includesDigital:true},
 {id:'original-premium',name:'INKBOOM! Original Premium',benefit:'Una historia con más momentos y emociones',format:'printed',pages:52,binding:'Tapa dura',includesDigital:true},
 {id:'deluxe',name:'INKBOOM! Deluxe',benefit:'La experiencia narrativa más completa',format:'printed',pages:80,binding:'Tapa dura',includesDigital:true}
];
for(const edition of EDITIONS){const price=globalThis.INKBOOM_COMMERCE_CATALOG.find(item=>item.id===edition.id);if(!price)throw new Error('Falta una edición en el catálogo de pagos.');Object.assign(edition,{price:price.amount/100,priceId:price.priceId});}
const findEdition=id=>EDITIONS.find(e=>e.id===id);
const selectedEdition=()=>findEdition(state.edition)||findEdition('mini');
const editionPrice=edition=>edition.price===null?'Precio por definir':new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(edition.price)+' MXN';
function editionFacts(edition){return edition.format==='printed'?[
 ['Formato','Impreso + digital'],['Edición',edition.name],['Páginas',String(edition.pages)],['Encuadernación',edition.binding],['Tamaño',PRINT_SIZE],['Envío','Gratis a México']
 ]:[['Formato','Digital'],['Edición',edition.name],['Páginas',String(edition.pages)]];}
