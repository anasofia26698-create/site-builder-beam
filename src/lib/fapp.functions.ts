import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { fappSchema, type FappRecord } from './fapp-data';
export const loadFapp = createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=>{
 await context.supabase.rpc('accept_fapp_invitation');
 const {data:membership,error:memberError}=await context.supabase.from('workspace_members').select('user_id').eq('user_id',context.userId).maybeSingle();
 if(memberError)throw new Error(memberError.message);
 if(!membership)return {authorized:false,admin:false,records:[] as FappRecord[],invitations:[] as {id:string;email:string;expires_at:string;accepted_by:string|null}[]};
 const {data:role}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 const {data,error}=await context.supabase.from('fapp_monthly_records').select('payload');if(error)throw new Error(error.message);
 const {data:invites}=role?await context.supabase.from('workspace_invitations').select('id,email,expires_at,accepted_by').order('created_at',{ascending:false}):{data:[]};
 return {authorized:true,admin:Boolean(role),records:(data??[]).map(row=>fappSchema.parse(row.payload)),invitations:invites??[]};
});
export const saveFapp=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({record:fappSchema,confirmed:z.boolean()}).parse(input)).handler(async({data,context})=>{
 const {data:id,error}=await context.supabase.rpc('save_fapp_record',{p_payload:JSON.parse(JSON.stringify(data.record)),p_confirmed:data.confirmed});if(error)throw new Error(error.message);return {id};
});
export const inviteFapp=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((input:unknown)=>z.object({email:z.string().email(),role:z.enum(['admin','member'])}).parse(input)).handler(async({data,context})=>{
 const {data:admin}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});if(!admin)throw new Error('Somente administradores podem autorizar a equipe');
 const {error}=await context.supabase.from('workspace_invitations').insert({email:data.email.toLowerCase().trim(),role:data.role});if(error)throw new Error(error.message);return {success:true};
});
