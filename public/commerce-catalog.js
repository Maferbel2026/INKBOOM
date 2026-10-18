/* Approved INKBOOM Sandbox catalog. Public identifiers only; never secret keys. */
globalThis.INKBOOM_COMMERCE_CATALOG = Object.freeze([
 {id:'digital-mini',priceId:'price_1URlzlAh1c8Dm2NYjUPMaiPB',amount:29900,format:'digital'},
 {id:'digital-original',priceId:'price_1URm0zAh1c8Dm2NYnbutGujN',amount:44900,format:'digital'},
 {id:'digital-deluxe',priceId:'price_1URm1aAh1c8Dm2NYREeKzrKB',amount:59900,format:'digital'},
 {id:'mini',priceId:'price_1URmBfAh1c8Dm2NYNEfbaLwi',amount:79900,format:'printed'},
 {id:'original',priceId:'price_1URmD0Ah1c8Dm2NYeraUpGb9',amount:99900,format:'printed'},
 {id:'original-premium',priceId:'price_1URmDkAh1c8Dm2NYZhe62NXg',amount:119900,format:'printed'},
 {id:'deluxe',priceId:'price_1URmEQAh1c8Dm2NYC4KM1C6x',amount:139900,format:'printed'}
].map(item=>Object.freeze({...item,currency:'mxn',taxInclusive:true,shippingAmount:0})));
