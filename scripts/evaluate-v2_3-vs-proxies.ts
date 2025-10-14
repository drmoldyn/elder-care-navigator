#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import { parse } from "csv-parse/sync";

dotenv.config({ path: ".env.local" });

function readCSV(path: string): any[] {
  if (!fs.existsSync(path)) return [];
  const s = fs.readFileSync(path, "utf-8");
  return parse(s, { columns: true, skip_empty_lines: true, trim: true });
}
function pearson(x: number[], y: number[]): number { const n=x.length; if(n!==y.length||n<2) return NaN; const mx=x.reduce((s,v)=>s+v,0)/n, my=y.reduce((s,v)=>s+v,0)/n; let num=0,dx=0,dy=0; for(let i=0;i<n;i++){const a=x[i]-mx,b=y[i]-my; num+=a*b; dx+=a*a; dy+=b*b;} const den=Math.sqrt(dx*dy); return den===0?NaN:num/den; }
function spearman(x: number[], y: number[]): number { if(x.length!==y.length||x.length<3) return NaN; const rank=(arr:number[])=>{const s=[...arr].sort((a,b)=>a-b); return arr.map(v=>s.indexOf(v)+1)}; const rx=rank(x),ry=rank(y); const n=x.length; const d2=rx.reduce((s,v,i)=>s+Math.pow(v-ry[i],2),0); return 1-(6*d2)/(n*(n*n-1)); }
function deciles(x: number[]) { const s=[...x].sort((a,b)=>a-b); const q=(p:number)=>{const r=(s.length-1)*p; const lo=Math.floor(r),hi=Math.ceil(r),w=r-lo; return s[lo]*(1-w)+s[hi]*w}; return Array.from({length:11},(_,i)=>q(i/10)); }

async function main(){
  const csvPath = 'data/cms/processed/sunsetwell-scores-v2_3.csv';
  const rows = readCSV(csvPath);
  if (rows.length===0){ console.error(`❌ Missing ${csvPath}`); process.exit(1); }
  const scoreBy = new Map<string, number>();
  rows.forEach(r=>{ const c=String(r['facility_id']||'').trim(); const s=Number(r['overall_score']||''); if(c && Number.isFinite(s)) scoreBy.set(c,s); });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession:false, autoRefreshToken:false } });
  const selectCols = ['facility_id','number_of_substantiated_complaints','number_of_facility_reported_incidents','number_of_certified_beds','quality_rating','health_inspection_rating','staffing_rating','quality_measure_rating'].join(',');
  const facs: any[] = [];
  const pageSize = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select(selectCols)
      .eq('provider_type','nursing_home')
      .order('facility_id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    facs.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  const sw: number[] = []; const cmsO: number[] = []; const cmsHI: number[]=[]; const cmsSt: number[]=[]; const cmsQM: number[]=[];
  const comp: number[] = []; const inc: number[] = []; const comp100: number[]=[]; const inc100: number[]=[];

  for (const r of facs){
    const ccn=String(r.facility_id||'').trim(); const s=scoreBy.get(ccn); if(!Number.isFinite(s)) continue;
    const beds = Number(r.number_of_certified_beds||''); if (!Number.isFinite(beds) || beds<=0) continue; // require beds for per-100
    const c = Number(r.number_of_substantiated_complaints||'');
    const i = Number(r.number_of_facility_reported_incidents||'');
    if (!(Number.isFinite(c) || Number.isFinite(i))) continue;
    sw.push(s as number);
    comp.push(Number.isFinite(c)?c:0); inc.push(Number.isFinite(i)?i:0);
    comp100.push(Number.isFinite(c)? (c/beds)*100 : 0);
    inc100.push(Number.isFinite(i)? (i/beds)*100 : 0);
    cmsO.push(Number(r.quality_rating||NaN)); cmsHI.push(Number(r.health_inspection_rating||NaN)); cmsSt.push(Number(r.staffing_rating||NaN)); cmsQM.push(Number(r.quality_measure_rating||NaN));
  }

  const compare = (label:string, Xsw:number[], Xalt:number[], Y:number[]) => {
    const idx = Xalt.map((v,i)=>({i,v})).filter(o=>Number.isFinite(o.v)).map(o=>o.i);
    const xs=idx.map(i=>Xsw[i]); const xa=idx.map(i=>Xalt[i]); const yy=idx.map(i=>Y[i]);
    const invY = yy.map(v=>-v);
    return { label, n: xs.length, sw: { pearson: pearson(xs, invY), spearman: spearman(xs, invY) }, alt: { pearson: pearson(xa, invY), spearman: spearman(xa, invY) } };
  };

  const out:any = { raw:{}, per100:{} };
  out.raw.complaints = {
    overall: compare('CMS Overall', sw, cmsO, comp),
    inspect: compare('CMS Health Inspection', sw, cmsHI, comp),
    staffing: compare('CMS Staffing', sw, cmsSt, comp),
    quality: compare('CMS Quality Measures', sw, cmsQM, comp)
  };
  out.raw.incidents = {
    overall: compare('CMS Overall', sw, cmsO, inc),
    inspect: compare('CMS Health Inspection', sw, cmsHI, inc),
    staffing: compare('CMS Staffing', sw, cmsSt, inc),
    quality: compare('CMS Quality Measures', sw, cmsQM, inc)
  };
  out.per100.complaints = {
    overall: compare('CMS Overall', sw, cmsO, comp100),
    inspect: compare('CMS Health Inspection', sw, cmsHI, comp100),
    staffing: compare('CMS Staffing', sw, cmsSt, comp100),
    quality: compare('CMS Quality Measures', sw, cmsQM, comp100)
  };
  out.per100.incidents = {
    overall: compare('CMS Overall', sw, cmsO, inc100),
    inspect: compare('CMS Health Inspection', sw, cmsHI, inc100),
    staffing: compare('CMS Staffing', sw, cmsSt, inc100),
    quality: compare('CMS Quality Measures', sw, cmsQM, inc100)
  };

  // Decile means for raw and per-100
  const q = deciles(sw); const bin=(v:number)=> Math.min(9, Math.max(0, q.findIndex((t,i)=>i<10 && v<=q[i+1])));
  const meanByBin=(xs:number[], ys:number[])=>{ const acc=Array.from({length:10},()=>({s:0,n:0})); xs.forEach((v,i)=>{const b=bin(v); acc[b].s+=ys[i]; acc[b].n++}); return acc.map(a=>a.n?a.s/a.n:NaN) };
  out.deciles={ raw:{ complaints: meanByBin(sw, comp), incidents: meanByBin(sw, inc) }, per100:{ complaints: meanByBin(sw, comp100), incidents: meanByBin(sw, inc100) } };

  // Print concise summary
  const fmt=(v:number)=> Number.isFinite(v)? v.toFixed(3) : 'NaN';
  const show=(title:string,o:any)=>{ console.log(`${title} n=${o.n}`); console.log(`  SunsetWell v2.3 | Pearson ${fmt(o.sw.pearson)} | Spearman ${fmt(o.sw.spearman)}`); console.log(`  ${o.label.padEnd(17)}| Pearson ${fmt(o.alt.pearson)} | Spearman ${fmt(o.alt.spearman)}`); console.log(''); };
  console.log('\n📊 v2.3 Predictive PHI vs harmful events (higher is better; proxy inverted)');
  console.log('RAW counts');
  show('Complaints:', out.raw.complaints.overall);
  show('Complaints:', out.raw.complaints.inspect);
  show('Complaints:', out.raw.complaints.staffing);
  show('Complaints:', out.raw.complaints.quality);
  show('Incidents:', out.raw.incidents.overall);
  show('Incidents:', out.raw.incidents.inspect);
  show('Incidents:', out.raw.incidents.staffing);
  show('Incidents:', out.raw.incidents.quality);
  console.log('PER-100 beds');
  show('Complaints:', out.per100.complaints.overall);
  show('Complaints:', out.per100.complaints.inspect);
  show('Complaints:', out.per100.complaints.staffing);
  show('Complaints:', out.per100.complaints.quality);
  show('Incidents:', out.per100.incidents.overall);
  show('Incidents:', out.per100.incidents.inspect);
  show('Incidents:', out.per100.incidents.staffing);
  show('Incidents:', out.per100.incidents.quality);
  console.log('Deciles RAW (complaints):', out.deciles.raw.complaints.map((v:number)=>Number.isFinite(v)?v.toFixed(2):'NaN').join(', '));
  console.log('Deciles RAW (incidents):', out.deciles.raw.incidents.map((v:number)=>Number.isFinite(v)?v.toFixed(2):'NaN').join(', '));
  console.log('Deciles PER-100 (complaints):', out.deciles.per100.complaints.map((v:number)=>Number.isFinite(v)?v.toFixed(2):'NaN').join(', '));
  console.log('Deciles PER-100 (incidents):', out.deciles.per100.incidents.map((v:number)=>Number.isFinite(v)?v.toFixed(2):'NaN').join(', '));

  fs.mkdirSync('analysis/scoring', { recursive: true });
  fs.writeFileSync('analysis/scoring/v2_3_evaluation.json', JSON.stringify(out, null, 2));
  console.log('\n📝 Wrote analysis/scoring/v2_3_evaluation.json');
}

main().then(()=>process.exit(0)).catch(e=>{ console.error(e); process.exit(1); });
