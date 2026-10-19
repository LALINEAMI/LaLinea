export class Rewards {
  constructor(onState=()=>{}) { this.state=null;this.run=null;this.trace=[];this.pending=null;this.busy=false;this.onState=onState; }
  get authenticated(){return this.state?.authenticated===true;}
  get key(){return this.authenticated?'lalinea-game-pending-'+this.state.customer.id:null;}
  async request(action,body={}){
    let response;
    try{response=await fetch('/api/lalinea-game',{method:action?'POST':'GET',credentials:'same-origin',cache:'no-store',
      headers:action?{'Content-Type':'application/json'}:undefined,body:action?JSON.stringify({action,...body}):undefined});}
    catch{throw new Error('Collegamento ai buoni non disponibile. Riprova.');}
    const data=await response.json().catch(()=>null);
    if(!response.ok||!data){const error=new Error(data?.error||'I buoni non sono ancora disponibili sul sito.');error.status=response.status;throw error;}
    return data;
  }
  accept(state){this.state=state;this.onState(state);return state;}
  async refresh(){return this.accept(await this.request());}
  async login(telefono,pin){const state=this.accept(await this.request('login',{telefono,pin}));this.restorePending();return state;}
  async logout(){await this.request('logout');this.run=null;this.trace=[];this.pending=null;this.accept({authenticated:false});}
  restorePending(){this.pending=null;if(!this.key)return;try{const data=JSON.parse(localStorage.getItem(this.key));if(data&&typeof data.runId==='string'&&Array.isArray(data.trace))this.pending=data;}catch{}}
  persistPending(){if(!this.key)return;try{if(this.pending)localStorage.setItem(this.key,JSON.stringify(this.pending));else localStorage.removeItem(this.key);}catch{}}
  async begin(level){
    if(!this.authenticated){this.run=null;this.trace=[];return null;}
    if(this.busy)throw new Error('Attendi la verifica del premio.');
    if(this.pending)await this.claim();
    const run=await this.request('start',{level});this.run=run;this.trace=[];return run;
  }
  record(input){
    if(!this.run)return;
    const mask=(input.left?1:0)|(input.right?2:0)|(input.jump?4:0),n=this.trace.length;
    if(n&&this.trace[n-1]===mask)this.trace[n-2]++;else this.trace.push(1,mask);
  }
  async finish(){
    if(!this.run)throw new Error('Partita non collegata: accedi al VIP e ripeti il livello.');
    this.pending={runId:this.run.id,trace:this.trace.slice()};this.run=null;this.persistPending();return this.claim();
  }
  async claim(){
    if(!this.pending||this.busy)throw new Error('Premio non pronto per la verifica.');
    this.busy=true;
    try{const result=await this.request('complete',this.pending);this.pending=null;this.persistPending();return this.accept(result);}
    catch(error){if([400,403,409].includes(error.status)){this.pending=null;this.persistPending();}throw error;}finally{this.busy=false;}
  }
  async voucher(){return this.accept(await this.request('voucher'));}
}
