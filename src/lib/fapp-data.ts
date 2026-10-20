import { z } from 'zod';
export const paymentSchema = z.object({date:z.string(),value:z.number().nonnegative(),origin:z.string()});
export const campaignSchema = z.object({name:z.string(),start:z.string(),end:z.string(),participated:z.boolean(),model:z.enum(['gmv','excess','fixed','percent']),fixed:z.number().nonnegative(),percent:z.number().min(0).max(100),average:z.number().nonnegative(),sales:z.number().nonnegative(),atCost:z.boolean(),invoiceReceived:z.boolean(),invoicePaid:z.boolean(),invoiceValue:z.number().nonnegative()});
export const productSchema = z.object({name:z.string(),ean:z.string(),orders:z.number().int().nonnegative(),units:z.number().int().nonnegative(),revenue:z.number().nonnegative(),unitCost:z.number().nonnegative().nullable()});
const n=z.number().finite().nonnegative();
export const fappSchema=z.object({storeId:z.string().min(1),referenceMonth:z.string().min(1),status:z.enum(['Ativa','Inativa','Em ativação']),docas:z.boolean(),markup:n.nullable(),gmv:n,orders:n.int(),ticket:n,rating:n.max(5).nullable(),cancellation:n.max(100),docasSales:n,deliveredGmv:n,closed:z.boolean(),reconciled:z.boolean(),cmv:n.nullable(),commissionRate:n.max(100),operatingRate:n.max(100),discounts:n,losses:n,lossNote:z.string(),claim:z.string(),freightBudget:n,freightUsed:n,target:n,aboveCity:n.max(100).nullable(),aboveState:n.max(100).nullable(),cutoff:z.string(),firstFiveSales:n,firstFiveOrders:n.int(),payments:z.array(paymentSchema).max(100),campaigns:z.array(campaignSchema).max(100),products:z.array(productSchema).max(10)});
export type FappRecord=z.infer<typeof fappSchema>;
export type Campaign=z.infer<typeof campaignSchema>;
export type FappProduct=z.infer<typeof productSchema>;
export const emptyProduct=():FappProduct=>({name:'',ean:'',orders:0,units:0,revenue:0,unitCost:null});
export const emptyCampaign=():Campaign=>({name:'',start:'',end:'',participated:true,model:'gmv',fixed:0,percent:0,average:0,sales:0,atCost:false,invoiceReceived:false,invoicePaid:false,invoiceValue:0});
export const emptyFapp=(storeId:string,referenceMonth:string):FappRecord=>({storeId,referenceMonth,status:'Ativa',docas:false,markup:null,gmv:0,orders:0,ticket:0,rating:null,cancellation:0,docasSales:0,deliveredGmv:0,closed:false,reconciled:false,cmv:null,commissionRate:13,operatingRate:5,discounts:0,losses:0,lossNote:'',claim:'',freightBudget:0,freightUsed:0,target:0,aboveCity:null,aboveState:null,cutoff:'',firstFiveSales:0,firstFiveOrders:0,payments:[],campaigns:[],products:[]});
export const campaignCost=(c:Campaign)=>!c.participated?0:(c.model==='percent'?0:c.fixed)+(c.model==='fixed'?0:c.percent/100*(c.model==='excess'?Math.max(0,c.sales-c.average):c.sales));
export const campaignReturn=(c:Campaign)=>campaignCost(c)>0?c.sales/campaignCost(c):null;
export function calculateFapp(r:FappRecord){
 const payments=r.payments.reduce((s,p)=>s+p.value,0);
 const actual=r.closed&&r.reconciled&&r.deliveredGmv>0;
 const commission=actual?r.deliveredGmv-payments:r.gmv*r.commissionRate/100;
 const effective=actual?commission/r.deliveredGmv:null;
 const actions=r.campaigns.reduce((s,c)=>s+campaignCost(c),0);
 const grossMargin=r.cmv===null?null:r.gmv-r.cmv;
 const netMargin=grossMargin===null?null:grossMargin-commission-r.freightUsed-actions-r.discounts-r.losses-r.gmv*r.operatingRate/100;
 const ticket=r.orders?r.gmv/r.orders:0;
 const freightPct=r.freightBudget?r.freightUsed/r.freightBudget:null;
 const alerts:string[]=[];
 if(r.cancellation>10)alerts.push('Cancelamento acima de 10% — conferir estoque do site e ERP');
 if(r.rating!==null&&r.rating<4.5)alerts.push('Nota abaixo de 4,5');
 if(effective!==null&&Math.abs(effective-r.commissionRate/100)>0.010000001)alerts.push(`Repasse não confere com ${r.commissionRate.toLocaleString('pt-BR')}% — conferir taxas e conciliação`);
 if(!actual)alerts.push('Conferência de repasse pendente');
 if((freightPct!==null&&freightPct>0.8)||(r.freightBudget===0&&r.freightUsed>0))alerts.push('Frete acima de 80% da verba');
 if(r.cmv===null)alerts.push('Margem pendente: informar CMV');
 if(Math.abs(r.ticket-ticket)>0.01)alerts.push('Ticket informado difere do calculado');
 if(r.products.filter(p=>p.name).length<10)alerts.push('Top 10 com menos de 10 itens');
 r.campaigns.filter(c=>c.participated).forEach(c=>{const ret=campaignReturn(c);if(ret!==null&&ret<3)alerts.push(`${c.name}: retorno abaixo de 3x`);if(!c.invoiceReceived||!c.invoicePaid)alerts.push(`${c.name}: NF pendente`);if(c.atCost)alerts.push(`${c.name}: preço de custo gera tráfego, não margem`)});
 let projection:number|null=null;
 if(r.closed)projection=r.gmv;
 else if(r.cutoff){const d=new Date(r.cutoff+'T12:00:00Z');const names=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];if(`${names[d.getUTCMonth()]} ${d.getUTCFullYear()}`===r.referenceMonth)projection=r.gmv/d.getUTCDate()*new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()}
 return {payments,commission,effective,actions,grossMargin,netMargin,netMarginPct:netMargin!==null&&r.gmv>0?netMargin/r.gmv:null,ticket,freightPct,freightPerOrder:r.orders?r.freightUsed/r.orders:0,freightSalesPct:r.gmv?r.freightUsed/r.gmv:0,targetPct:r.target?r.gmv/r.target:null,projection,alerts};
}
export function parsePortalProducts(text:string){
 const products:FappProduct[]=[];const unrecognized:string[]=[];
 const blocks=text.trim().split(/\n\s*\n/);
 // Each product starts with a name followed by EAN; accept contiguous portal blocks too.
 const chunks=text.replace(/\r/g,'').split(/\n(?=[^\n]+\n\s*EAN\s*\d)/i);
 for(const block of chunks){const lines=block.trim().split('\n').map(l=>l.trim()).filter(Boolean);const ean=block.match(/EAN\s*[:\-]?\s*(\d{8,14})/i)?.[1];const price=block.match(/R\$\s*([\d.,]+)/)?.[1];const nums=lines.filter(l=>/^\d+\s*(pedidos?|unidades?)?$/i.test(l)).map(l=>Number(l.match(/\d+/)?.[0]));if(ean&&price&&lines[0]&&!/^EAN/i.test(lines[0])){products.push({name:lines[0],ean,orders:nums[0]??0,units:nums[1]??0,revenue:Number(price.replace(/\./g,'').replace(',','.')),unitCost:null})}else if(block.trim())unrecognized.push(block.trim())}
 if(products.length>10)unrecognized.push(...products.slice(10).map(p=>p.name));
 return {products:products.slice(0,10),unrecognized};
}
export function aggregateFappProducts(records:FappRecord[]){const map=new Map<string,FappProduct&{cost:number|null}>();records.forEach(r=>r.products.forEach(p=>{const key=p.ean||p.name;const old=map.get(key);map.set(key,{...p,orders:(old?.orders??0)+p.orders,units:(old?.units??0)+p.units,revenue:(old?.revenue??0)+p.revenue,cost:p.unitCost===null||old?.cost===null?null:(old?.cost??0)+p.unitCost*p.units})}));return [...map.values()].sort((a,b)=>b.revenue-a.revenue)}
