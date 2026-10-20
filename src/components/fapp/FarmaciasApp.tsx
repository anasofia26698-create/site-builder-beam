import { Button } from '@/components/ui/button';
import type { StoreInput } from '@/lib/dashboard-data';
export default function FarmaciasApp({period,setPeriod,catalog}: {period:string;setPeriod:(v:string)=>void;catalog:StoreInput[];ifoodSnapshots:unknown[]}) { return <section><h1 className="page-title">Farmácias App</h1><p>{period}</p><Button onClick={()=>setPeriod(period)}>Visão geral</Button><p>{catalog.length} lojas</p></section> }
