/* Demo quota only. The real per-person rule belongs to an authenticated backend. */
class CoverPreviewSession {
 constructor(storage,limit=2){this.storage=storage;this.limit=limit;this.used=0;this.pending=null;this.result=null;this.acceptedKey=null;
  try{const saved=Number(storage?.getItem('inkboom-cover-demo-attempts'));this.used=Number.isInteger(saved)&&saved>=0?Math.min(saved,limit):0;}catch{}
 }
 remaining(){return Math.max(0,this.limit-this.used);}
 start(snapshot,now=Date.now()){
  if(this.pending)return this.pending;
  if(!this.remaining())return null;
  this.used++;this.acceptedKey=null;
  try{this.storage?.setItem('inkboom-cover-demo-attempts',String(this.used));}catch{}
  this.pending={snapshot:JSON.parse(JSON.stringify(snapshot)),startedAt:now,attempt:this.used};return this.pending;
 }
 finish(){if(this.pending){this.result=this.pending;this.pending=null;}return this.result;}
 accept(key){this.acceptedKey=key;}
}
