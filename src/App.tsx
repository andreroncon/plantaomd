import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jyuekaadflsvupubwefx.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5dWVrYWFkZmxzdnVwdWJ3ZWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5OTUxOTYsImV4cCI6MjA5NTU3MTE5Nn0.tVsgWk_tt0Dwyv_-ODRTHKRg1Yv0yrnJa5KEcswGa_Q"
);

function dbToShift(s: any) {
  return { id: s.id, membroId: s.membro_id, data: s.data, inicio: s.inicio, fim: s.fim, tipo: s.tipo, status: s.status, checkIn: s.check_in, checkOut: s.check_out, substitutoId: s.substituto_id };
}
function shiftToDb(s: any) {
  return { membro_id: s.membroId, data: s.data, inicio: s.inicio, fim: s.fim, tipo: s.tipo, status: s.status||"agendado", check_in: s.checkIn||null, check_out: s.checkOut||null, substituto_id: s.substitutoId||null };
}

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const FREQ_OPTS = ["Único","Semanal","Quinzenal","Mensal"];

const INIT_SHIFT_TYPES = [
  {id:"plantao_ps",     label:"Plantão PS",        color:"#185FA5", bg:"#E6F1FB"},
  {id:"cirurgia_el",    label:"Cirurgia Eletiva",   color:"#0F6E56", bg:"#E1F5EE"},
  {id:"horizontal",     label:"Horizontal",         color:"#BA7517", bg:"#FAEEDA"},
  {id:"coloproct",      label:"Coloproctologia",    color:"#533AB7", bg:"#EEEDFE"},
  {id:"ps_noite",       label:"PS Noite",           color:"#993556", bg:"#FBEAF0"},
  {id:"cobertura_ps",   label:"Cobertura PS",       color:"#A32D2D", bg:"#FCEBEB"},
  {id:"acionamento_ps", label:"Acionamento PS",     color:"#C25E00", bg:"#FDF0E6"},
];

const DEFAULT_TARIFAS = Object.fromEntries(INIT_SHIFT_TYPES.map(t=>[t.id,{bruto:1000,liquido:800}]));

let _uid = Date.now();
const uid = () => ++_uid;

function localDateStr(d: Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function initSenha(nome: string){ return nome.trim().toLowerCase().replace(/\s+/g," ").split(" ").map((p:string)=>p[0]).join("").slice(0,3)+"123"; }

const stColor: any={ativo:"#0F6E56",agendado:"#185FA5",concluido:"#5F5E5A"};
const stLabel: any={ativo:"Em plantão",agendado:"Agendado",concluido:"Concluído"};

export default function App(){
  const [user,setUser]   = useState<any>(null);
  const [lf,setLf]       = useState({crm:"",senha:"",tipo:"medico"});
  const [lErr,setLErr]   = useState("");
  const [tab,setTab]     = useState("escala");
  const [members,setMembers]           = useState<any[]>([]);
  const [shifts,setShifts]             = useState<any[]>([]);
  const [stypes,setStypes]             = useState(INIT_SHIFT_TYPES);
  const [tarifas,setTarifas]           = useState(DEFAULT_TARIFAS);
  const [savedReports,setSavedReports] = useState<any[]>([]);
  const [selDate,setSelDate]           = useState(localDateStr(new Date()));
  const [calM,setCalM] = useState(new Date().getMonth());
  const [calY,setCalY] = useState(new Date().getFullYear());
  const [modal,setModal]   = useState<any>(null);
  const [notifs,setNotifs] = useState<any[]>([]);
  const [showNotifs,setShowNotifs] = useState(false);
  const [loading,setLoading] = useState(true);
  const nid = useRef(100);

  // ── CARREGAR DADOS DO SUPABASE ─────────────────────────────────────────────
  useEffect(()=>{
    async function load(){
      const [{ data: mData },{ data: sData }] = await Promise.all([
        supabase.from("members").select("*").order("id"),
        supabase.from("shifts").select("*").order("id"),
      ]);
      if(mData) setMembers(mData);
      if(sData) setShifts(sData.map(dbToShift));
      setLoading(false);
    }
    load();
  },[]);

  const isAdmin = user?.role==="admin";
  const myId    = user?.memberId;
  const stOf    = (id: string) => stypes.find(t=>t.id===id)||stypes[0];
  const mById   = (id: number) => members.find(m=>m.id===id);
  const mName   = (id: number) => mById(id)?.nome||"—";
  const getDIM  = (y: number,m: number)=>new Date(y,m+1,0).getDate();
  const getFD   = (y: number,m: number)=>new Date(y,m,1).getDay();
  const addNotif= (txt: string,mId: any)=>setNotifs(p=>[{id:nid.current++,text:txt,membId:mId||null,read:false},...p]);
  const unread  = notifs.filter(n=>!n.read&&(isAdmin||n.membId===myId||n.membId===null)).length;

  useEffect(()=>{
    if(!user||isAdmin) return;
    const amanha=new Date(); amanha.setDate(amanha.getDate()+1);
    const ds=localDateStr(amanha);
    shifts.filter(s=>(s.membroId===myId||s.substitutoId===myId)&&s.data===ds&&s.status==="agendado")
      .forEach(sh=>{ const t=stOf(sh.tipo); addNotif(`🔔 Lembrete: plantão amanhã (${ds}) — ${t.label} das ${sh.inicio} às ${sh.fim}`,myId); });
  },[user]);

  function doLogin(){
    if(lf.tipo==="admin"){
      if(lf.crm==="admin"&&lf.senha==="admin123"){setUser({role:"admin",nome:"Administrador"});setLErr("");}
      else setLErr("Credenciais inválidas.");
      return;
    }
    const crm=lf.crm.trim(), pw=lf.senha.trim();
    if(!crm||!pw){setLErr("Informe CRM-SP e senha.");return;}
    const m=members.find((x:any)=>x.ativo&&x.crmsp===crm&&x.senha===pw);
    if(m){setUser({role:"medico",memberId:m.id,nome:m.nome});setLErr("");}
    else{ const bl=members.find((x:any)=>!x.ativo&&x.crmsp===crm); setLErr(bl?"Acesso bloqueado. Contate o administrador.":"CRM ou senha inválidos."); }
  }

  function shiftsForDay(d: number){
    const ds=`${calY}-${String(calM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return shifts.filter(s=>s.data===ds);
  }

  const checkin  = async(sid: number)=>{ const h=new Date().toTimeString().slice(0,5); await supabase.from("shifts").update({status:"ativo",check_in:h}).eq("id",sid); setShifts(p=>p.map(s=>s.id===sid?{...s,status:"ativo",checkIn:h}:s)); };
  const checkout = async(sid: number)=>{ const h=new Date().toTimeString().slice(0,5); await supabase.from("shifts").update({status:"concluido",check_out:h}).eq("id",sid); setShifts(p=>p.map(s=>s.id===sid?{...s,status:"concluido",checkOut:h}:s)); };
  const delShift = async(sid: number)=>{ await supabase.from("shifts").delete().eq("id",sid); setShifts(p=>p.filter(s=>s.id!==sid)); };
  const changeResp = async(sid: number,nId: number)=>{ await supabase.from("shifts").update({membro_id:Number(nId),substituto_id:null}).eq("id",sid); setShifts(p=>p.map(s=>s.id===sid?{...s,membroId:Number(nId),substitutoId:null}:s)); };

  async function setSub(sid: number,subId: number){
    await supabase.from("shifts").update({substituto_id:Number(subId)}).eq("id",sid);
    setShifts(p=>p.map(s=>s.id===sid?{...s,substitutoId:Number(subId)}:s));
    const sh=shifts.find(s=>s.id===sid);
    if(sh) addNotif(`${mName(Number(subId))} assumiu plantão de ${mName(sh.membroId)} em ${sh.data}`,null);
  }
  const cancelSub = async(sid: number)=>{ await supabase.from("shifts").update({substituto_id:null}).eq("id",sid); setShifts(p=>p.map(s=>s.id===sid?{...s,substitutoId:null}:s)); };

  // helpers de acionamento (armazenado em checkIn como "acionado:{id}")
  const isAcionado  = (s: any) => typeof s.checkIn==="string"&&s.checkIn.startsWith("acionado:");
  const acionadoId  = (s: any) => isAcionado(s)?parseInt(s.checkIn.split(":")[1]):null;

  // Tipo efetivo para faturamento
  function tipoEfetivo(s: any){
    if(s.tipo==="cobertura_ps"){
      if(isAcionado(s))   return "acionamento_ps";
      if(s.substitutoId)  return "plantao_ps";
    }
    return s.tipo;
  }

  function calcMes(membId: number,year: number,month: number){
    const m=mById(membId); if(!m) return{bruto:0,liquido:0,list:[]};
    const key=`${year}-${String(month+1).padStart(2,"0")}`;
    const done=shifts.filter(s=>{
      if(!s.data.startsWith(key)) return false;
      if(s.tipo==="cobertura_ps"){
        if(isAcionado(s))  return acionadoId(s)===membId;
        return (s.substitutoId||s.membroId)===membId;
      }
      if((s.substitutoId||s.membroId)!==membId) return false;
      return s.checkIn!==null||s.checkOut!==null;
    });
    let bruto=0,liquido=0;
    done.forEach(s=>{ const tar=(tarifas as any)[tipoEfetivo(s)]||{bruto:0,liquido:0}; bruto+=tar.bruto; liquido+=tar.liquido; });
    return{bruto,liquido,list:done};
  }

  function buildReportHTML(membId: number,year: number,month: number,adminView: boolean){
    const m=mById(membId); if(!m) return"";
    const{bruto,liquido,list}=calcMes(membId,year,month);
    const rows=list.map(sh=>{ const t=stOf(sh.tipo); const tar=(tarifas as any)[tipoEfetivo(sh)]||{bruto:0,liquido:0}; return`<tr><td>${new Date(sh.data+"T12:00").toLocaleDateString("pt-BR")}</td><td style="color:${t.color}">${t.label}${sh.tipo==="cobertura_ps"&&sh.substitutoId?" → PS":""}</td><td>${sh.inicio}–${sh.fim}</td><td>${mName(sh.membroId)}</td><td>${sh.substitutoId?mName(sh.substitutoId):"—"}</td>${adminView?`<td>R$ ${tar.bruto.toLocaleString("pt-BR")}</td>`:""}<td>R$ ${tar.liquido.toLocaleString("pt-BR")}</td></tr>`; }).join("");
    return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório ${MONTHS[month]}/${year} – ${m.nome}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#222}h1{color:#185FA5;font-size:18px}.sub{color:#555;font-size:13px;margin-bottom:16px}.sum{display:flex;gap:20px;margin:16px 0;padding:12px;background:#f0f6ff;border-radius:8px}.sl{font-size:11px;color:#555}.sv{font-size:16px;font-weight:bold;color:#185FA5}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}th{background:#185FA5;color:#fff;padding:7px 5px;text-align:left}td{padding:6px 5px;border-bottom:1px solid #eee}.ft{margin-top:20px;font-size:10px;color:#aaa}</style></head><body><h1>Relatório de Plantões — ${MONTHS[month]} ${year}</h1><div class="sub">${m.nome} · CRM-SP: ${m.crmsp||""} · ${m.esp}</div><div class="sum"><div><div class="sl">Plantões</div><div class="sv">${list.length}</div></div>${adminView?`<div><div class="sl">Bruto</div><div class="sv">R$ ${bruto.toLocaleString("pt-BR")}</div></div>`:""}<div><div class="sl">Líquido</div><div class="sv">R$ ${liquido.toLocaleString("pt-BR")}</div></div></div><table><thead><tr><th>Data</th><th>Tipo</th><th>Horário</th><th>Responsável</th><th>Substituto</th>${adminView?"<th>Bruto</th>":""}<th>Líquido</th></tr></thead><tbody>${rows}</tbody></table><div class="ft">Gerado em ${new Date().toLocaleString("pt-BR")} · PlantãoMed</div></body></html>`;
  }

  function buildTeamReportHTML(year: number,month: number){
    const rows=members.map(m=>{ const{list,bruto,liquido}=calcMes(m.id,year,month); if(!list.length) return""; const byTipo:{[k:string]:{label:string,color:string,datas:string[],bruto:number,liquido:number}}={}; list.forEach(sh=>{ const t=stOf(sh.tipo); const tar=(tarifas as any)[sh.tipo]||{bruto:0,liquido:0}; if(!byTipo[sh.tipo]) byTipo[sh.tipo]={label:t.label,color:t.color,datas:[],bruto:0,liquido:0}; byTipo[sh.tipo].datas.push(new Date(sh.data+"T12:00").toLocaleDateString("pt-BR")); byTipo[sh.tipo].bruto+=tar.bruto; byTipo[sh.tipo].liquido+=tar.liquido; }); const tipoRows=Object.values(byTipo).map(v=>`<tr><td style="padding-left:20px;color:${v.color}">${v.label}</td><td style="font-size:10px">${v.datas.join(", ")}</td><td>R$ ${v.bruto.toLocaleString("pt-BR")}</td><td>R$ ${v.liquido.toLocaleString("pt-BR")}</td></tr>`).join(""); return`<tr style="background:#e8f0fe"><td colspan="4" style="padding:8px 6px;font-weight:bold;color:#185FA5">${m.nome} — ${list.length} plantão(ões) · Bruto: R$ ${bruto.toLocaleString("pt-BR")} · Líquido: R$ ${liquido.toLocaleString("pt-BR")}</td></tr>${tipoRows}`; }).filter(Boolean).join("");
    return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório Equipe ${MONTHS[month]}/${year}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#222}h1{color:#185FA5;font-size:18px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}th{background:#185FA5;color:#fff;padding:8px 6px;text-align:left}td{padding:6px;border-bottom:1px solid #eee}.ft{margin-top:20px;font-size:10px;color:#aaa}</style></head><body><h1>Relatório da Equipe — ${MONTHS[month]} ${year}</h1><table><thead><tr><th>Tipo</th><th>Datas</th><th>Bruto</th><th>Líquido</th></tr></thead><tbody>${rows}</tbody></table><div class="ft">Gerado em ${new Date().toLocaleString("pt-BR")} · PlantãoMed</div></body></html>`;
  }

  function openHTML(html: string){ const blob=new Blob([html],{type:"text/html;charset=utf-8"}); const url=URL.createObjectURL(blob); const w=window.open(url,"_blank"); if(!w){const a=document.createElement("a");a.href=url;a.download="relatorio.html";document.body.appendChild(a);a.click();a.remove();} setTimeout(()=>URL.revokeObjectURL(url),60000); }
  function saveReport(title: string,html: string,membId: any){ setSavedReports(p=>{ const f=p.filter(r=>r.title!==title); return [{id:uid(),title,html,date:new Date().toLocaleString("pt-BR"),membId:membId||null},...f]; }); }
  function gerarRelatorio(membId: number,year: number,month: number,adminView: boolean){ const m=mById(membId); if(!m) return; const html=buildReportHTML(membId,year,month,adminView); const title=`Relatório ${MONTHS[month]}/${year} – ${m.nome}`; saveReport(title,html,membId); openHTML(html); }
  function gerarRelatorioEquipe(year: number,month: number){ const html=buildTeamReportHTML(year,month); const title=`Relatório Equipe — ${MONTHS[month]}/${year}`; saveReport(title,html,null); openHTML(html); }

  const s: any = {
    app:{fontFamily:"system-ui,sans-serif",maxWidth:420,margin:"0 auto",background:"var(--color-background-tertiary)",height:"100dvh",minHeight:"-webkit-fill-available",display:"flex",flexDirection:"column",overflow:"hidden"},
    hdr:{background:"#185FA5",color:"#fff",padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0},
    body:{flex:1,padding:"12px 12px 12px",overflowY:"auto"},
    nav:{display:"flex",background:"var(--color-background-primary)",borderTop:"0.5px solid var(--color-border-tertiary)",flexShrink:0},
    nb:(a: boolean)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 2px 6px",border:"none",background:"none",cursor:"pointer",color:a?"#185FA5":"var(--color-text-secondary)",fontSize:9,gap:2,borderTop:a?"2px solid #185FA5":"2px solid transparent"}),
    card:{background:"var(--color-background-primary)",borderRadius:12,border:"0.5px solid var(--color-border-tertiary)",padding:"12px 14px",marginBottom:10},
    bdg:(c: string,bg?: string)=>({display:"inline-block",padding:"2px 7px",borderRadius:6,fontSize:11,background:bg||c+"22",color:c,fontWeight:500}),
    btn:(c?: string)=>({padding:"8px 14px",borderRadius:8,border:"none",background:c||"#185FA5",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}),
    out:{padding:"6px 12px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"none",color:"var(--color-text-primary)",cursor:"pointer",fontSize:13},
    inp:{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontSize:13,boxSizing:"border-box"},
    lbl:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:3,display:"block"},
    row:{display:"flex",gap:8,alignItems:"center"},
    sep:{height:"0.5px",background:"var(--color-border-tertiary)",margin:"8px 0"},
    ovl:{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100},
    sht:{background:"#fff",color:"#222",borderRadius:"16px 16px 0 0",padding:20,width:"100%",maxWidth:420,maxHeight:"84vh",overflowY:"auto"},
    ful:{position:"fixed",inset:0,background:"#fff",zIndex:200,display:"flex",flexDirection:"column",maxWidth:420,margin:"0 auto",overflow:"hidden"},
  };

  // ── LOADING ───────────────────────────────────────────────────────────────
  if(loading) return(
    <div style={{...s.app,justifyContent:"center",alignItems:"center"}}>
      <div style={{fontSize:40,marginBottom:12}}>🏥</div>
      <div style={{fontSize:14,color:"var(--color-text-secondary)"}}>Carregando...</div>
    </div>
  );

  // ── LOGIN ─────────────────────────────────────────────────────────────────
  if(!user) return(
    <div style={{...s.app,justifyContent:"center",alignItems:"center",padding:"0 24px"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{fontSize:40,marginBottom:6}}>🏥</div>
        <div style={{fontSize:22,fontWeight:500}}>PlantãoMed</div>
        <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>Gestão de Escalas Médicas</div>
      </div>
      <div style={{width:"100%",maxWidth:340}}>
        <div style={{...s.row,marginBottom:14,background:"var(--color-background-secondary)",borderRadius:10,padding:4}}>
          {["medico","admin"].map(t=>(
            <button key={t} onClick={()=>setLf(p=>({...p,tipo:t}))}
              style={{flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontWeight:500,fontSize:13,
                background:lf.tipo===t?"var(--color-background-primary)":"transparent",
                color:lf.tipo===t?"#185FA5":"var(--color-text-secondary)"}}>
              {t==="medico"?"Médico":"Administrador"}
            </button>
          ))}
        </div>
        <div style={{marginBottom:10}}>
          <label style={s.lbl}>{lf.tipo==="admin"?"Usuário":"Número do CRM-SP"}</label>
          <input style={s.inp} placeholder={lf.tipo==="admin"?"admin":"Ex: 112000"} value={lf.crm}
            onChange={e=>setLf(p=>({...p,crm:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={s.lbl}>Senha</label>
          <input type="password" style={s.inp} placeholder="••••••••" value={lf.senha}
            onChange={e=>setLf(p=>({...p,senha:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&doLogin()}/>
        </div>
        {lErr&&<div style={{color:"#A32D2D",fontSize:12,marginBottom:10,textAlign:"center"}}>{lErr}</div>}
        <button style={{...s.btn(),width:"100%",padding:"11px"}} onClick={doLogin}>Entrar</button>
      </div>
    </div>
  );

  const tabs=[
    {id:"escala",   icon:"📅",label:"Escala"},
    {id:"checkin",  icon:"⏱️",label:"Check-in"},
    {id:"pagamento",icon:"💰",label:"Pagamento"},
    {id:"relatorio",icon:"📊",label:"Relatório"},
    {id:"equipe",   icon:"👥",label:"Equipe"},
    ...(isAdmin?[{id:"config",icon:"⚙️",label:"Config"}]:[]),
  ];

  const myNotifs=notifs.filter((n:any)=>isAdmin||n.membId===myId||n.membId===null);

  // ── SHIFT CARD ────────────────────────────────────────────────────────────
  function ShiftCard({sh}: any){
    const t=stOf(sh.tipo); const sub=sh.substitutoId?mById(sh.substitutoId):null;
    const [er,setEr]=useState(false); const [es,setEs]=useState(false);
    const [sr,setSr]=useState(sh.membroId);
    const [ss2,setSs2]=useState(members.find((m:any)=>m.id!==sh.membroId)?.id||1);
    const sorted=[...members].sort((a:any,b:any)=>a.nome.localeCompare(b.nome,"pt-BR"));
    return(
      <div style={{...s.card,borderLeft:`3px solid ${t.color}`}}>
        <div style={{...s.row,justifyContent:"space-between",marginBottom:3}}>
          <span style={s.bdg(t.color,t.bg)}>{t.label}</span>
          <span style={s.bdg(stColor[sh.status])}>{stLabel[sh.status]}</span>
        </div>
        <div style={{fontSize:13,fontWeight:500}}>{sh.inicio}–{sh.fim}</div>
        <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>
          <b style={{color:"var(--color-text-primary)"}}>Resp.:</b> {mName(sh.membroId)}
          {sub&&<span style={{color:t.color}}> · Sub.: {(sub as any).nome}</span>}
        </div>
        <div style={s.sep}/>
        {isAdmin&&<div style={{marginBottom:8}}>
          <div style={{...s.row,justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Responsável definitivo</span>
            <button style={{...s.out,fontSize:11,padding:"3px 8px"}} onClick={()=>setEr(v=>!v)}>{er?"✕":"Alterar"}</button>
          </div>
          {er&&<div style={{...s.row,gap:6}}>
            <select style={{...s.inp,flex:1}} value={sr} onChange={e=>setSr(Number(e.target.value))}>
              {sorted.map((m:any)=><option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <button style={s.btn()} onClick={()=>{changeResp(sh.id,sr);setEr(false);}}>OK</button>
          </div>}
        </div>}
        {/* Substituição pontual (todos os tipos) */}
        {sh.tipo!=="cobertura_ps"&&sh.status==="agendado"&&<div style={{marginBottom:8}}>
          <div style={{...s.row,justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Substituição pontual</span>
            {sub?((isAdmin||myId===sh.membroId)&&<button style={{...s.out,fontSize:11,padding:"3px 8px",color:"#A32D2D"}} onClick={()=>cancelSub(sh.id)}>Cancelar sub.</button>)
               :<button style={{...s.out,fontSize:11,padding:"3px 8px"}} onClick={()=>setEs(v=>!v)}>{es?"✕":"Indicar"}</button>}
          </div>
          {es&&!sub&&<div style={{...s.row,gap:6}}>
            <select style={{...s.inp,flex:1}} value={ss2} onChange={e=>setSs2(Number(e.target.value))}>
              {(isAdmin||myId===sh.membroId
                ? sorted.filter((m:any)=>m.id!==sh.membroId)
                : sorted.filter((m:any)=>m.id===myId)
              ).map((m:any)=><option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <button style={s.btn()} onClick={()=>{setSub(sh.id,ss2);setEs(false);}}>OK</button>
          </div>}
        </div>}

        {/* Cobertura PS: Substituição por PS + Acionamento */}
        {sh.tipo==="cobertura_ps"&&sh.status==="agendado"&&!isAcionado(sh)&&!sh.substitutoId&&<div style={{marginBottom:8}}>
          {/* --- Substituição → PS --- */}
          <div style={{...s.row,justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"#185FA5",fontWeight:500}}>Substituição pontual</span>
            <button style={{...s.out,fontSize:11,padding:"3px 8px"}} onClick={()=>setEs(v=>!v)}>{es?"✕":"Indicar"}</button>
          </div>
          {es&&<div style={{...s.row,gap:6,marginBottom:8}}>
            <select style={{...s.inp,flex:1}} value={ss2} onChange={e=>setSs2(Number(e.target.value))}>
              {sorted.map((m:any)=><option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <button style={s.btn()} onClick={()=>{setSub(sh.id,ss2);setEs(false);}}>OK</button>
          </div>}
          {/* --- Acionamento --- */}
          <div style={{...s.row,justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"#C25E00",fontWeight:500}}>Acionamento PS</span>
            <button style={{...s.out,fontSize:11,padding:"3px 8px",color:"#C25E00"}} onClick={async()=>{
              const id=myId||sh.membroId;
              await supabase.from("shifts").update({check_in:"acionado:"+id}).eq("id",sh.id);
              setShifts(p=>p.map(x=>x.id===sh.id?{...x,checkIn:"acionado:"+id}:x));
            }}>Acionar</button>
          </div>
        </div>}
        {sh.tipo==="cobertura_ps"&&sh.substitutoId&&<div style={{...s.row,justifyContent:"space-between",marginBottom:8,padding:"8px 10px",borderRadius:8,background:"#E6F1FB"}}>
          <span style={{fontSize:12,color:"#185FA5"}}>💡 Sub. por PS: <b>{mName(sh.substitutoId)}</b></span>
          {(isAdmin||myId===sh.membroId)&&<button style={{...s.out,fontSize:11,padding:"3px 8px",color:"#A32D2D"}} onClick={()=>cancelSub(sh.id)}>Cancelar</button>}
        </div>}
        {sh.tipo==="cobertura_ps"&&isAcionado(sh)&&<div style={{...s.row,justifyContent:"space-between",marginBottom:8,padding:"8px 10px",borderRadius:8,background:"#FDF0E6"}}>
          <span style={{fontSize:12,color:"#C25E00"}}>🔔 Acionado: <b>{mName(acionadoId(sh)!)}</b></span>
          {(isAdmin||myId===sh.membroId)&&<button style={{...s.out,fontSize:11,padding:"3px 8px",color:"#A32D2D"}} onClick={async()=>{
            await supabase.from("shifts").update({check_in:null}).eq("id",sh.id);
            setShifts(p=>p.map(x=>x.id===sh.id?{...x,checkIn:null}:x));
          }}>Cancelar</button>}
        </div>}
        <div style={{...s.row,gap:6,flexWrap:"wrap"}}>
          {sh.tipo!=="cobertura_ps"&&<span style={{fontSize:12,color:"var(--color-text-secondary)",flex:1}}>In: <b>{sh.checkIn||"—"}</b> Out: <b>{sh.checkOut||"—"}</b></span>}
          {sh.tipo==="cobertura_ps"&&<span style={{fontSize:12,color:"var(--color-text-secondary)",flex:1,fontStyle:"italic"}}>Sem necessidade de check-in/out</span>}
          {/* Check-in/out: apenas o próprio médico responsável (ou substituto) e o admin */}
          {sh.tipo!=="cobertura_ps"&&sh.status==="agendado"&&(isAdmin||myId===sh.membroId||myId===sh.substitutoId)&&<button style={s.btn("#0F6E56")} onClick={()=>checkin(sh.id)}>Entrada</button>}
          {sh.tipo!=="cobertura_ps"&&sh.status==="ativo"&&(isAdmin||myId===sh.membroId||myId===sh.substitutoId)&&<button style={s.btn("#BA7517")} onClick={()=>checkout(sh.id)}>Saída</button>}
          {isAdmin&&<button style={{...s.out,color:"#A32D2D",fontSize:12,padding:"6px 8px"}} onClick={()=>delShift(sh.id)}>✕</button>}
        </div>
      </div>
    );
  }

  // ── ESCALA ────────────────────────────────────────────────────────────────
  function EscalaView(){
    const days=getDIM(calY,calM), first=getFD(calY,calM);
    const cells=[...Array(first).fill(null),...Array.from({length:days},(_,i)=>i+1)];
    const todayS=shifts.filter(s=>s.data===selDate);
    return(
      <div>
        <div style={{...s.row,justifyContent:"space-between",marginBottom:10}}>
          <button style={s.out} onClick={()=>{if(calM===0){setCalM(11);setCalY(y=>y-1);}else setCalM(m=>m-1);}}>‹</button>
          <span style={{fontWeight:500}}>{MONTHS[calM]} {calY}</span>
          <button style={s.out} onClick={()=>{if(calM===11){setCalM(0);setCalY(y=>y+1);}else setCalM(m=>m+1);}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:6}}>
          {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:"var(--color-text-secondary)",padding:"3px 0"}}>{d}</div>)}
          {cells.map((d,i)=>{
            if(!d) return <div key={"e"+i}/>;
            const ds=`${calY}-${String(calM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const ss=shiftsForDay(d); const isSel=ds===selDate;
            return(
              <div key={d} onClick={()=>setSelDate(ds)}
                style={{textAlign:"center",padding:"5px 2px",borderRadius:8,cursor:"pointer",
                  background:isSel?"#185FA5":"transparent",color:isSel?"#fff":"var(--color-text-primary)",fontSize:13}}>
                {d}
                {ss.length>0&&<div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:1,marginTop:1}}>
                  {ss.slice(0,4).map((x,xi)=>{const t=stOf(x.tipo);return <div key={xi} style={{width:4,height:4,borderRadius:"50%",background:isSel?"#fff":t.color}}/>;  })}
                </div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
          {stypes.map(t=><span key={t.id} style={{...s.bdg(t.color,t.bg),fontSize:10,display:"flex",alignItems:"center",gap:3}}><span style={{width:5,height:5,borderRadius:"50%",background:t.color,display:"inline-block"}}/>{t.label}</span>)}
        </div>
        <div style={{...s.row,justifyContent:"space-between",marginBottom:8}}>
          <span style={{fontWeight:500,fontSize:14}}>{new Date(selDate+"T12:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})} — {todayS.length}</span>
          {isAdmin&&<button style={s.btn()} onClick={()=>setModal({type:"novoPlantao"})}>+ Novo</button>}
        </div>
        {todayS.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"20px 0",fontSize:13}}>Nenhum plantão</div>}
        {todayS.map(sh=>{
          const t=stOf(sh.tipo); const sub=sh.substitutoId?mById(sh.substitutoId):null;
          return(
            <div key={sh.id} style={{...s.card,borderLeft:`3px solid ${t.color}`,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,cursor:"pointer"}} onClick={()=>setModal({type:"editShift",shiftId:sh.id})}>
                <div style={{...s.row,gap:6,marginBottom:3}}><span style={s.bdg(t.color,t.bg)}>{t.label}</span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{sh.inicio}–{sh.fim}</span></div>
                <div style={{fontSize:13,fontWeight:500}}>{mName(sh.membroId)}</div>
                {sub&&<div style={{fontSize:12,color:t.color}}>Sub.: {(sub as any).nome}</div>}
              </div>
              {isAdmin
                ? <button style={{...s.out,color:"#A32D2D",fontSize:13,padding:"6px 10px",flexShrink:0}} onClick={e=>{e.stopPropagation();delShift(sh.id);}}>✕</button>
                : <span style={{color:"var(--color-text-secondary)",fontSize:18}}>›</span>
              }
            </div>
          );
        })}
      </div>
    );
  }

  // ── CHECKIN ───────────────────────────────────────────────────────────────
  function CheckinView(){
    const ss=shifts.filter(s=>s.data===selDate);
    return(
      <div>
        <div style={{...s.row,justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontWeight:500,fontSize:14}}>{new Date(selDate+"T12:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</div>
            <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{ss.length} plantão(ões)</div>
          </div>
          <input type="date" value={selDate} onChange={e=>setSelDate(e.target.value)} style={{...s.out,fontSize:12}}/>
        </div>
        {ss.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"30px 0",fontSize:13}}>Nenhum plantão neste dia</div>}
        {ss.map(sh=><ShiftCard key={sh.id} sh={sh}/>)}
        {isAdmin&&<button style={{...s.btn(),width:"100%",marginTop:4}} onClick={()=>setModal({type:"novoPlantao"})}>+ Adicionar</button>}
      </div>
    );
  }

  // ── PAGAMENTO ─────────────────────────────────────────────────────────────
  function PagamentoView(){
    const [selMem,setSelMem]=useState(isAdmin?members[0]?.id:myId);
    const [pM,setPM]=useState(calM); const [pY,setPY]=useState(calY);
    const m=mById(selMem);
    const{bruto,liquido,list}=m?calcMes(selMem,pY,pM):{bruto:0,liquido:0,list:[]};
    const byTipo: any={};
    list.forEach(sh=>{ if(!byTipo[sh.tipo]) byTipo[sh.tipo]={count:0,bruto:0,liquido:0}; const tar=(tarifas as any)[sh.tipo]||{bruto:0,liquido:0}; byTipo[sh.tipo].count++; byTipo[sh.tipo].bruto+=tar.bruto; byTipo[sh.tipo].liquido+=tar.liquido; });
    const sorted=[...members].sort((a:any,b:any)=>a.nome.localeCompare(b.nome,"pt-BR"));
    const myRep=savedReports.filter(r=>isAdmin||r.membId===myId);
    return(
      <div>
        {isAdmin&&<div style={{marginBottom:10}}>
          <label style={s.lbl}>Médico</label>
          <select style={s.inp} value={selMem} onChange={e=>setSelMem(Number(e.target.value))}>
            {sorted.map((m:any)=><option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>}
        <div style={{...s.row,justifyContent:"space-between",marginBottom:12}}>
          <button style={s.out} onClick={()=>{if(pM===0){setPM(11);setPY(y=>y-1);}else setPM(m=>m-1);}}>‹</button>
          <span style={{fontWeight:500,fontSize:14}}>{MONTHS[pM]} {pY}</span>
          <button style={s.out} onClick={()=>{if(pM===11){setPM(0);setPY(y=>y+1);}else setPM(m=>m+1);}}>›</button>
        </div>
        <div style={{...s.card,background:"#E6F1FB",border:"none",marginBottom:12}}>
          <div style={{fontWeight:500,marginBottom:2}}>{m?.nome}</div>
          <div style={{fontSize:12,color:"#185FA5",marginBottom:10}}>{list.length} plantão(ões) concluído(s)</div>
          <div style={{...s.row,gap:16}}>
            {isAdmin&&<div><div style={s.lbl}>Total Bruto</div><div style={{fontWeight:500,fontSize:16,color:"#185FA5"}}>R$ {bruto.toLocaleString("pt-BR")}</div></div>}
            <div><div style={s.lbl}>Total Líquido</div><div style={{fontWeight:500,fontSize:16,color:"#0F6E56"}}>R$ {liquido.toLocaleString("pt-BR")}</div></div>
          </div>
        </div>
        {Object.entries(byTipo).map(([tid,v]: any)=>{const t=stOf(tid);return(
          <div key={tid} style={{...s.card,borderLeft:`3px solid ${t.color}`,padding:"10px 12px",marginBottom:8}}>
            <div style={{...s.row,justifyContent:"space-between",marginBottom:4}}><span style={s.bdg(t.color,t.bg)}>{t.label}</span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{v.count}×</span></div>
            <div style={{...s.row,gap:12}}>
              {isAdmin&&<div><div style={s.lbl}>Bruto</div><div style={{fontWeight:500,color:"#185FA5"}}>R$ {v.bruto.toLocaleString("pt-BR")}</div></div>}
              <div><div style={s.lbl}>Líquido</div><div style={{fontWeight:500,color:"#0F6E56"}}>R$ {v.liquido.toLocaleString("pt-BR")}</div></div>
            </div>
          </div>
        );})}
        <button style={{...s.btn(),width:"100%",marginTop:4}} onClick={()=>gerarRelatorio(selMem,pY,pM,isAdmin)}>📄 Gerar relatório individual</button>
        {isAdmin&&<button style={{...s.btn("#0F6E56"),width:"100%",marginTop:8}} onClick={()=>gerarRelatorioEquipe(pY,pM)}>📋 Gerar relatório da equipe</button>}
        {myRep.length>0&&<>
          <div style={{fontWeight:500,fontSize:14,margin:"16px 0 8px"}}>Relatórios salvos</div>
          {myRep.map(r=>(
            <div key={r.id} style={{...s.card,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{r.title}</div><div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{r.date}</div></div>
              <button style={s.btn()} onClick={()=>openHTML(r.html)}>📥 Ver</button>
              <button style={{...s.out,color:"#A32D2D",fontSize:12,padding:"5px 8px"}} onClick={()=>setSavedReports(p=>p.filter((x:any)=>x.id!==r.id))}>✕</button>
            </div>
          ))}
        </>}
      </div>
    );
  }

  // ── RELATÓRIO ─────────────────────────────────────────────────────────────
  function RelatorioView(){
    const [selMem,setSelMem]=useState(isAdmin?members[0]?.id:myId);
    const [rM,setRM]=useState(calM); const [rY,setRY]=useState(calY);
    const m=mById(selMem);
    const{bruto,liquido,list}=m?calcMes(selMem,rY,rM):{bruto:0,liquido:0,list:[]};
    const sorted=[...members].sort((a:any,b:any)=>a.nome.localeCompare(b.nome,"pt-BR"));
    const myRep=savedReports.filter(r=>isAdmin||r.membId===myId);
    return(
      <div>
        {isAdmin&&<><div style={s.lbl}>Médico</div>
          <select value={selMem} onChange={e=>setSelMem(Number(e.target.value))} style={{...s.inp,marginBottom:10}}>
            {sorted.map((m:any)=><option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </>}
        <div style={{...s.row,justifyContent:"space-between",marginBottom:12}}>
          <button style={s.out} onClick={()=>{if(rM===0){setRM(11);setRY(y=>y-1);}else setRM(m=>m-1);}}>‹</button>
          <span style={{fontWeight:500}}>{MONTHS[rM]} {rY}</span>
          <button style={s.out} onClick={()=>{if(rM===11){setRM(0);setRY(y=>y+1);}else setRM(m=>m+1);}}>›</button>
        </div>
        {m&&<>
          <div style={{...s.card,background:"#E6F1FB",border:"none"}}>
            <div style={{fontWeight:500,fontSize:15,marginBottom:2}}>{m.nome}</div>
            <div style={{fontSize:12,color:"#185FA5",marginBottom:8}}>CRM-SP: {m.crmsp||"—"} · {m.esp}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {(()=>{ const res: any[]=[{l:"Plantões",v:String(list.length),s2:"realizados"}]; if(isAdmin) res.push({l:"Bruto",v:"R$ "+bruto.toLocaleString("pt-BR"),s2:MONTHS[rM]}); res.push({l:"Líquido",v:"R$ "+liquido.toLocaleString("pt-BR"),s2:MONTHS[rM]}); return res.map(({l,v,s2})=>(<div key={l} style={{background:"#fff",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:10,color:"#185FA5"}}>{l}</div><div style={{fontWeight:500,fontSize:14,color:"#185FA5"}}>{v}</div><div style={{fontSize:10,color:"#185FA5",opacity:0.7}}>{s2}</div></div>)); })()}
            </div>
            <button style={{...s.btn("#fff"),color:"#185FA5",width:"100%",border:"0.5px solid #185FA5"}} onClick={()=>gerarRelatorio(selMem,rY,rM,isAdmin)}>📄 Exportar e abrir relatório</button>
          </div>
          <div style={{fontWeight:500,fontSize:14,margin:"12px 0 8px"}}>Plantões — {list.length}</div>
          {list.map(sh=>{const t=stOf(sh.tipo); const tar=(tarifas as any)[sh.tipo]||{bruto:0,liquido:0}; return(
            <div key={sh.id} style={{...s.card,padding:"10px 12px",borderLeft:`3px solid ${t.color}`}}>
              <div style={{...s.row,justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:500}}>{new Date(sh.data+"T12:00").toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"})}</span><span style={s.bdg(t.color,t.bg)}>{t.label}</span></div>
              <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{sh.inicio}–{sh.fim}</div>
              <div style={{...s.row,gap:12,marginTop:4}}>
                {isAdmin&&<div style={{fontSize:12}}>Bruto: <b style={{color:"#185FA5"}}>R$ {tar.bruto.toLocaleString("pt-BR")}</b></div>}
                <div style={{fontSize:12}}>Líquido: <b style={{color:"#0F6E56"}}>R$ {tar.liquido.toLocaleString("pt-BR")}</b></div>
              </div>
            </div>
          );})}
          {myRep.length>0&&<>
            <div style={{fontWeight:500,fontSize:14,margin:"16px 0 8px"}}>Relatórios salvos</div>
            {myRep.map(r=>(
              <div key={r.id} style={{...s.card,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{r.title}</div><div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{r.date}</div></div>
                <button style={s.btn()} onClick={()=>openHTML(r.html)}>📥 Ver</button>
                <button style={{...s.out,color:"#A32D2D",fontSize:12,padding:"5px 8px"}} onClick={()=>setSavedReports(p=>p.filter((x:any)=>x.id!==r.id))}>✕</button>
              </div>
            ))}
          </>}
        </>}
      </div>
    );
  }

  // ── EQUIPE ────────────────────────────────────────────────────────────────
  function EquipeView(){
    const [showForm,setShowForm]=useState(false);
    const [nm,setNm]=useState({nome:"",crmsp:"",esp:"",tel:"",email:""});
    const sorted=[...members].sort((a:any,b:any)=>a.nome.localeCompare(b.nome,"pt-BR"));
    async function addM(){
      if(!nm.nome||!nm.crmsp) return;
      const pw=initSenha(nm.nome);
      const newM={...nm,senha:pw,role:"medico",ativo:true,periodicidades:{}};
      const {data}=await supabase.from("members").insert(newM).select().single();
      if(data) setMembers(p=>[...p,data]);
      setNm({nome:"",crmsp:"",esp:"",tel:"",email:""}); setShowForm(false);
      addNotif(`Médico ${nm.nome} cadastrado. Senha inicial: ${pw}`,null);
    }
    return(
      <div>
        {isAdmin&&<button style={{...s.btn(),width:"100%",marginBottom:12}} onClick={()=>setShowForm(v=>!v)}>
          {showForm?"✕ Fechar formulário":"+ Incluir novo médico"}
        </button>}
        {isAdmin&&showForm&&<div style={{...s.card,marginBottom:12}}>
          <div style={{fontWeight:500,marginBottom:10}}>Novo médico</div>
          {[["nome","Nome completo","text"],["crmsp","Nº CRM-SP (login)","text"],["esp","Especialidade","text"],["tel","Telefone","tel"],["email","E-mail","email"]].map(([k,pl,tp])=>(
            <div key={k} style={{marginBottom:8}}><label style={s.lbl}>{pl}</label>
              <input style={s.inp} placeholder={pl} value={(nm as any)[k]||""} onChange={e=>setNm(p=>({...p,[k]:e.target.value}))} type={tp}/>
            </div>
          ))}
          <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10}}>Senha gerada automaticamente: iniciais + 123</div>
          <button style={{...s.btn(),width:"100%"}} onClick={addM}>Salvar médico</button>
        </div>}
        {sorted.map((m:any)=>(
          <div key={m.id} style={{...s.card,cursor:"pointer",opacity:m.ativo?1:0.5}} onClick={()=>setModal({type:"perfil",membId:m.id})}>
            <div style={{...s.row,gap:10}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:m.ativo?"#E6F1FB":"#eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#185FA5",flexShrink:0}}>
                {m.nome.split(" ").map((x:string)=>x[0]).slice(0,2).join("")}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{...s.row,gap:6}}><span style={{fontWeight:500,fontSize:14}}>{m.nome}</span>{!m.ativo&&<span style={{...s.bdg("#A32D2D"),fontSize:10}}>Bloqueado</span>}</div>
                {m.crmsp&&<div style={{fontSize:12,color:"var(--color-text-secondary)"}}>CRM-SP: {m.crmsp}</div>}
                <div style={{fontSize:12,color:"var(--color-text-secondary)"}}>{m.esp}</div>
              </div>
              <span style={{color:"var(--color-text-secondary)"}}>›</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── CONFIG ────────────────────────────────────────────────────────────────
  function ConfigView(){
    const [editId,setEditId]=useState<string|null>(null);
    const [ef,setEf]=useState({label:"",bruto:0,liquido:0});
    const [sa,setSa]=useState(""); const [sn,setSn]=useState(""); const [sc,setSc]=useState(""); const [sm,setSm]=useState("");
    function startEdit(t: any){setEditId(t.id);setEf({label:t.label,bruto:(tarifas as any)[t.id]?.bruto||0,liquido:(tarifas as any)[t.id]?.liquido||0});}
    function saveEdit(tid: string){ setStypes(p=>p.map(x=>x.id===tid?{...x,label:ef.label}:x)); setTarifas(p=>({...p,[tid]:{bruto:Number(ef.bruto),liquido:Number(ef.liquido)}})); setEditId(null); }
    async function trocarSenha(){
      const m=mById(myId); if(!m||m.senha!==sa){setSm("Senha atual incorreta.");return;}
      if(sn.length<6){setSm("Nova senha deve ter ao menos 6 caracteres.");return;}
      if(sn!==sc){setSm("As senhas não coincidem.");return;}
      await supabase.from("members").update({senha:sn}).eq("id",myId);
      setMembers(p=>p.map((x:any)=>x.id===myId?{...x,senha:sn}:x));
      setSm("Senha alterada com sucesso!"); setSa(""); setSn(""); setSc("");
    }
    return(
      <div>
        {isAdmin&&<>
          <div style={{fontWeight:500,fontSize:15,marginBottom:8}}>Tipos de plantão</div>
          {stypes.filter(t=>t.id!=="acionamento_ps").map(t=>(
            <div key={t.id} style={{...s.card,padding:"12px",borderLeft:`3px solid ${t.color}`,marginBottom:8}}>
              {editId===t.id?(
                <div>
                  <div style={{marginBottom:8}}><label style={s.lbl}>Nome</label><input style={s.inp} value={ef.label} onChange={e=>setEf(p=>({...p,label:e.target.value}))}/></div>
                  <div style={{...s.row,gap:8,marginBottom:10}}>
                    <div style={{flex:1}}><label style={s.lbl}>Bruto (R$)</label><input type="number" style={s.inp} value={ef.bruto} onChange={e=>setEf(p=>({...p,bruto:Number(e.target.value)}))}/></div>
                    <div style={{flex:1}}><label style={s.lbl}>Líquido (R$)</label><input type="number" style={s.inp} value={ef.liquido} onChange={e=>setEf(p=>({...p,liquido:Number(e.target.value)}))}/></div>
                  </div>
                  <div style={{...s.row,gap:6}}><button style={{...s.out,flex:1}} onClick={()=>setEditId(null)}>Cancelar</button><button style={{...s.btn(),flex:1}} onClick={()=>saveEdit(t.id)}>Salvar</button></div>
                </div>
              ):(
                <div>
                  <div style={{...s.row,justifyContent:"space-between",marginBottom:6}}>
                    <div style={{...s.row,gap:8}}><span style={{width:10,height:10,borderRadius:"50%",background:t.color,display:"inline-block"}}/><span style={{fontWeight:500}}>{t.label}</span></div>
                    <button style={{...s.out,fontSize:12,padding:"4px 10px"}} onClick={()=>startEdit(t)}>Editar</button>
                  </div>
                  <div style={{...s.row,gap:16}}>
                    <div><div style={s.lbl}>Bruto</div><div style={{fontWeight:500,color:"#185FA5"}}>R$ {((tarifas as any)[t.id]?.bruto||0).toLocaleString("pt-BR")}</div></div>
                    <div><div style={s.lbl}>Líquido</div><div style={{fontWeight:500,color:"#0F6E56"}}>R$ {((tarifas as any)[t.id]?.liquido||0).toLocaleString("pt-BR")}</div></div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Seção Acionamento PS */}
          <div style={{fontWeight:500,fontSize:15,margin:"12px 0 8px"}}>Acionamento PS</div>
          {(()=>{
            const tAc=stypes.find(x=>x.id==="acionamento_ps")!;
            const tarAc=(tarifas as any)["acionamento_ps"]||{bruto:0,liquido:0};
            return editId==="acionamento_ps"?(
              <div style={{...s.card,padding:"12px",borderLeft:`3px solid ${tAc.color}`,marginBottom:8}}>
                <div style={{marginBottom:8}}><label style={s.lbl}>Nome</label><input style={s.inp} value={ef.label} onChange={e=>setEf(p=>({...p,label:e.target.value}))}/></div>
                <div style={{...s.row,gap:8,marginBottom:10}}>
                  <div style={{flex:1}}><label style={s.lbl}>Bruto (R$)</label><input type="number" style={s.inp} value={ef.bruto} onChange={e=>setEf(p=>({...p,bruto:Number(e.target.value)}))}/></div>
                  <div style={{flex:1}}><label style={s.lbl}>Líquido (R$)</label><input type="number" style={s.inp} value={ef.liquido} onChange={e=>setEf(p=>({...p,liquido:Number(e.target.value)}))}/></div>
                </div>
                <div style={{...s.row,gap:6}}><button style={{...s.out,flex:1}} onClick={()=>setEditId(null)}>Cancelar</button><button style={{...s.btn(),flex:1}} onClick={()=>saveEdit("acionamento_ps")}>Salvar</button></div>
              </div>
            ):(
              <div style={{...s.card,padding:"12px",borderLeft:`3px solid ${tAc.color}`,marginBottom:8}}>
                <div style={{...s.row,justifyContent:"space-between",marginBottom:6}}>
                  <div style={{...s.row,gap:8}}><span style={{width:10,height:10,borderRadius:"50%",background:tAc.color,display:"inline-block"}}/><span style={{fontWeight:500}}>{tAc.label}</span></div>
                  <button style={{...s.out,fontSize:12,padding:"4px 10px"}} onClick={()=>startEdit(tAc)}>Editar</button>
                </div>
                <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>Valor cobrado quando um médico aciona uma Cobertura PS</div>
                <div style={{...s.row,gap:16}}>
                  <div><div style={s.lbl}>Bruto</div><div style={{fontWeight:500,color:"#C25E00"}}>R$ {tarAc.bruto.toLocaleString("pt-BR")}</div></div>
                  <div><div style={s.lbl}>Líquido</div><div style={{fontWeight:500,color:"#C25E00"}}>R$ {tarAc.liquido.toLocaleString("pt-BR")}</div></div>
                </div>
              </div>
            );
          })()}
          <div style={s.sep}/>
        </>}
        <div style={{fontWeight:500,fontSize:15,margin:"12px 0 8px"}}>Alterar minha senha</div>
        {[["Senha atual",sa,setSa],["Nova senha",sn,setSn],["Confirmar",sc,setSc]].map(([pl,val,set]: any)=>(
          <div key={pl} style={{marginBottom:8}}><label style={s.lbl}>{pl}</label>
            <input type="password" style={s.inp} placeholder="••••••••" value={val} onChange={e=>set(e.target.value)}/>
          </div>
        ))}
        {sm&&<div style={{fontSize:12,color:sm.includes("sucesso")?"#0F6E56":"#A32D2D",marginBottom:8}}>{sm}</div>}
        <button style={{...s.btn(),width:"100%"}} onClick={isAdmin?()=>setSm("Admin: use painel do sistema."):trocarSenha}>Alterar senha</button>
      </div>
    );
  }

  // ── MODALS ────────────────────────────────────────────────────────────────
  function EditShiftModal({shiftId}: any){
    const sh=shifts.find(s=>s.id===shiftId); if(!sh) return null;
    const t=stOf(sh.tipo); const sub=sh.substitutoId?mById(sh.substitutoId):null;
    const [sr,setSr]=useState(sh.membroId);
    const [showFreq,setShowFreq]=useState(false);
    const [novaFreq,setNovaFreq]=useState("Semanal");
    const sorted=[...members].sort((a:any,b:any)=>a.nome.localeCompare(b.nome,"pt-BR"));

    // Conta quantos plantões agendados futuros existem (mesmo médico + tipo)
    const futuros=shifts.filter(s=>s.membroId===sh.membroId&&s.tipo===sh.tipo&&s.status==="agendado"&&s.data>=sh.data);

    async function delEsteEProximos(){
      if(!window.confirm(`Excluir este plantão e mais ${futuros.length-1} futuros de ${mName(sh.membroId)} (${t.label})?`)) return;
      const ids=futuros.map(s=>s.id);
      await supabase.from("shifts").delete().in("id",ids);
      setShifts(p=>p.filter(s=>!ids.includes(s.id)));
      setModal(null);
    }

    async function aplicarNovaFreq(){
      if(!window.confirm(`Alterar frequência para "${novaFreq}" a partir de ${new Date(sh.data+"T12:00").toLocaleDateString("pt-BR")}?`)) return;
      // Exclui todos os agendados futuros do mesmo médico+tipo a partir desta data
      const ids=futuros.map(s=>s.id);
      if(ids.length) await supabase.from("shifts").delete().in("id",ids);
      // Gera novos plantões com a nova frequência
      const toAdd: any[]=[];
      const base={membro_id:sh.membroId,inicio:sh.inicio,fim:sh.fim,tipo:sh.tipo,status:"agendado",check_in:null,check_out:null,substituto_id:null};
      if(novaFreq==="Único") toAdd.push({...base,data:sh.data});
      else if(novaFreq==="Semanal")    for(let i=0;i<53;i++){const d=new Date(sh.data+"T12:00:00");d.setDate(d.getDate()+7*i);toAdd.push({...base,data:localDateStr(d)});}
      else if(novaFreq==="Quinzenal")  for(let i=0;i<27;i++){const d=new Date(sh.data+"T12:00:00");d.setDate(d.getDate()+14*i);toAdd.push({...base,data:localDateStr(d)});}
      else if(novaFreq==="Mensal")     for(let i=0;i<12;i++){const d=new Date(sh.data+"T12:00:00");d.setMonth(d.getMonth()+i);toAdd.push({...base,data:localDateStr(d)});}
      const {data}=await supabase.from("shifts").insert(toAdd).select();
      setShifts(p=>[...p.filter(s=>!ids.includes(s.id)),...(data||[]).map(dbToShift)]);
      setModal(null);
    }

    return(
      <div style={s.ovl} onClick={()=>setModal(null)}>
        <div style={s.sht} onClick={(e:any)=>e.stopPropagation()}>
          <div style={{...s.row,justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontWeight:500,fontSize:16}}>Detalhes do plantão</span>
            <button style={s.out} onClick={()=>setModal(null)}>✕</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:t.bg,marginBottom:14}}>
            <span style={{width:12,height:12,borderRadius:"50%",background:t.color,display:"inline-block"}}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:500,color:t.color,fontSize:15}}>{t.label}</div>
              <div style={{fontSize:12,color:t.color,opacity:0.8}}>{new Date(sh.data+"T12:00").toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})} · {sh.inicio}–{sh.fim}</div>
            </div>
            <span style={s.bdg(stColor[sh.status])}>{stLabel[sh.status]}</span>
          </div>
          <label style={s.lbl}>Responsável</label>
          <select style={{...s.inp,marginBottom:8}} value={sr} onChange={e=>setSr(Number(e.target.value))}>
            {sorted.map((m:any)=><option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          {sr!==sh.membroId&&<div style={{...s.row,gap:6,marginBottom:10}}>
            {isAdmin&&<button style={{...s.btn(),flex:1,fontSize:12}} onClick={()=>{changeResp(sh.id,sr);setModal(null);}}>Salvar definitivo</button>}
            <button style={{...s.btn("#0F6E56"),flex:1,fontSize:12}} onClick={()=>{setSub(sh.id,sr);setModal(null);}}>Salvar pontual</button>
          </div>}
          {sub&&<div style={{...s.card,background:t.bg,border:"none",marginBottom:10,padding:"10px 12px"}}>
            <div style={{fontSize:12,color:t.color,marginBottom:2}}>Substituto registrado</div>
            <div style={{...s.row,justifyContent:"space-between"}}>
              <span style={{fontWeight:500,color:t.color}}>{(sub as any).nome}</span>
              <button style={{...s.out,fontSize:11,padding:"3px 8px",color:"#A32D2D"}} onClick={()=>{cancelSub(sh.id);setModal(null);}}>Cancelar</button>
            </div>
          </div>}
          <div style={s.sep}/>
          {sh.tipo!=="cobertura_ps"&&<div style={{...s.row,gap:10,marginBottom:12}}>
            {[["Entrada",sh.checkIn],["Saída",sh.checkOut]].map(([l,v])=>(
              <div key={l} style={{flex:1,padding:"10px",borderRadius:8,background:"var(--color-background-secondary)",textAlign:"center"}}>
                <div style={s.lbl}>{l}</div><div style={{fontWeight:500,fontSize:15}}>{v||"—"}</div>
              </div>
            ))}
          </div>}
          {sh.tipo==="cobertura_ps"&&<div style={{fontSize:12,color:"#A32D2D",fontStyle:"italic",marginBottom:12}}>Sem check-in/out para Cobertura PS</div>}
          <div style={{...s.row,gap:8,marginBottom:isAdmin?10:0}}>
            {sh.tipo!=="cobertura_ps"&&sh.status==="agendado"&&(isAdmin||myId===sh.membroId||myId===sh.substitutoId)&&<button style={{...s.btn("#0F6E56"),flex:1}} onClick={()=>{checkin(sh.id);setModal(null);}}>Registrar entrada</button>}
            {sh.tipo!=="cobertura_ps"&&sh.status==="ativo"&&(isAdmin||myId===sh.membroId||myId===sh.substitutoId)&&<button style={{...s.btn("#BA7517"),flex:1}} onClick={()=>{checkout(sh.id);setModal(null);}}>Registrar saída</button>}
            {isAdmin&&<button style={{...s.out,color:"#A32D2D"}} onClick={()=>{delShift(sh.id);setModal(null);}}>Excluir este</button>}
          </div>
          {/* Opções de gestão em série — apenas admin */}
          {isAdmin&&sh.status==="agendado"&&futuros.length>1&&<>
            <div style={s.sep}/>
            <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:8}}>
              {futuros.length} plantões agendados deste médico · {t.label}
            </div>
            <button style={{...s.out,color:"#A32D2D",width:"100%",marginBottom:8,textAlign:"center"}} onClick={delEsteEProximos}>
              🗑 Excluir este e todos os próximos ({futuros.length})
            </button>
            <button style={{...s.out,width:"100%",textAlign:"center"}} onClick={()=>setShowFreq(v=>!v)}>
              🔁 {showFreq?"Cancelar":"Alterar frequência dos próximos"}
            </button>
            {showFreq&&<div style={{marginTop:10}}>
              <label style={s.lbl}>Nova frequência (a partir desta data)</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:4,marginBottom:10}}>
                {FREQ_OPTS.map(f=>(
                  <div key={f} onClick={()=>setNovaFreq(f)}
                    style={{padding:"9px 6px",borderRadius:8,cursor:"pointer",textAlign:"center",fontSize:12,
                      border:`1.5px solid ${novaFreq===f?"#185FA5":"var(--color-border-tertiary)"}`,
                      background:novaFreq===f?"#E6F1FB":"transparent",
                      color:novaFreq===f?"#185FA5":"var(--color-text-primary)",fontWeight:novaFreq===f?500:400}}>
                    {f}
                  </div>
                ))}
              </div>
              <button style={{...s.btn(),width:"100%"}} onClick={aplicarNovaFreq}>Aplicar nova frequência</button>
            </div>}
          </>}
        </div>
      </div>
    );
  }

  function PerfilModal({membId}: any){
    const m=mById(membId); if(!m) return null;
    const [edit,setEdit]=useState(false); const [form,setForm]=useState({...m});
    const periOpts=[{v:1,l:"Toda semana"},{v:2,l:"A cada 2 sem."},{v:3,l:"A cada 3 sem."},{v:4,l:"A cada 4 sem."}];
    const meusTipos=[...new Set(shifts.filter(s=>s.membroId===membId).map(s=>s.tipo))];
    async function save(){
      await supabase.from("members").update(form).eq("id",membId);
      setMembers(p=>p.map((x:any)=>x.id===membId?{...x,...form}:x)); setEdit(false);
    }
    async function toggleBlock(){
      const newAtivo=!m.ativo;
      await supabase.from("members").update({ativo:newAtivo}).eq("id",membId);
      setMembers(p=>p.map((x:any)=>x.id===membId?{...x,ativo:newAtivo}:x));
    }
    async function del(){
      if(window.confirm(`Excluir ${m.nome}?`)){
        await supabase.from("members").delete().eq("id",membId);
        setMembers(p=>p.filter((x:any)=>x.id!==membId)); setModal(null);
      }
    }
    async function applyPeri(tipoId: string,sem: number){
      const newPeri={...(m.periodicidades||{}),[tipoId]:sem};
      await supabase.from("members").update({periodicidades:newPeri}).eq("id",membId);
      setMembers(p=>p.map((x:any)=>x.id===membId?{...x,periodicidades:newPeri}:x));
      const hoje=new Date(); hoje.setHours(12,0,0,0);
      const toDelete=shifts.filter(s=>s.membroId===membId&&s.tipo===tipoId&&s.status==="agendado"&&new Date(s.data+"T12:00")>=hoje);
      if(toDelete.length) await supabase.from("shifts").delete().in("id",toDelete.map(s=>s.id));
      const base=shifts.find(s=>s.membroId===membId&&s.tipo===tipoId);
      if(base){
        const novas: any[]=[]; const dow=new Date(base.data+"T12:00").getDay();
        const d0=new Date(hoje); while(d0.getDay()!==dow) d0.setDate(d0.getDate()+1);
        let d=new Date(d0); const fim=new Date(); fim.setFullYear(fim.getFullYear()+1);
        while(d<=fim){ novas.push({membro_id:membId,data:localDateStr(d),inicio:base.inicio,fim:base.fim,tipo:tipoId,status:"agendado",check_in:null,check_out:null,substituto_id:null}); d=new Date(d); d.setDate(d.getDate()+sem*7); }
        const {data}=await supabase.from("shifts").insert(novas).select();
        setShifts(prev=>{ const filt=prev.filter(s=>!(s.membroId===membId&&s.tipo===tipoId&&s.status==="agendado"&&new Date(s.data+"T12:00")>=hoje)); return [...filt,...(data||[]).map(dbToShift)]; });
      }
      addNotif(`Periodicidade de ${m.nome} em ${stOf(tipoId).label}: a cada ${sem} sem.`,null);
    }
    const fields=[["nome","Nome completo","text"],["crmsp","CRM-SP (login)","text"],["esp","Especialidade","text"],["tel","Telefone","tel"],["email","E-mail","email"],["senha","Senha","password"]];
    const initials=m.nome.split(" ").map((x:string)=>x[0]).slice(0,2).join("");
    return(
      <div style={s.ful}>
        <div style={{background:"#185FA5",color:"#fff",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <button onClick={()=>setModal(null)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:22,padding:0,lineHeight:1}}>‹</button>
          <span style={{fontWeight:500,fontSize:16}}>Ficha do médico</span>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
          <div style={{textAlign:"center",marginBottom:16}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:"#E6F1FB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:"#185FA5",margin:"0 auto 8px"}}>{initials}</div>
            <div style={{fontWeight:500,fontSize:16}}>{m.nome}</div>
            <div style={{fontSize:13,color:"var(--color-text-secondary)"}}>{m.esp}</div>
            {!m.ativo&&<span style={{...s.bdg("#A32D2D"),marginTop:6,display:"inline-block"}}>Acesso bloqueado</span>}
          </div>
          {!edit?(
            <>
              {[["CRM-SP",m.crmsp||"—"],["Especialidade",m.esp],["Telefone",m.tel||"—"],["E-mail",m.email||"—"],...(isAdmin?[["Senha",m.senha]]:[])]
                .map(([l,v])=>(<div key={l} style={{...s.row,justifyContent:"space-between",padding:"10px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><span style={{fontSize:13,color:"var(--color-text-secondary)"}}>{l}</span><span style={{fontSize:13,fontWeight:500,maxWidth:220,textAlign:"right",wordBreak:"break-all"}}>{v}</span></div>))}
              {isAdmin&&<button style={{...s.btn(),width:"100%",marginTop:14}} onClick={()=>setEdit(true)}>Editar dados</button>}
            </>
          ):(
            <>
              {fields.map(([k,pl,tp])=>(<div key={k} style={{marginBottom:10}}><label style={s.lbl}>{pl}</label><input style={s.inp} type={tp} placeholder={pl} value={(form as any)[k]||""} onChange={e=>setForm((p:any)=>({...p,[k]:e.target.value}))}/></div>))}
              <div style={{...s.row,gap:8,marginTop:10,marginBottom:16}}>
                <button style={{...s.out,flex:1}} onClick={()=>setEdit(false)}>Cancelar</button>
                <button style={{...s.btn(),flex:1}} onClick={save}>Salvar</button>
              </div>
            </>
          )}
          {isAdmin&&<>
            <div style={s.sep}/>
            <div style={{fontWeight:500,fontSize:14,margin:"12px 0 6px"}}>Periodicidade dos plantões</div>
            {meusTipos.map((tipoId: any)=>{
              const t=stOf(tipoId); const atual=(m.periodicidades||{})[tipoId]||1;
              return(<div key={tipoId} style={{...s.card,padding:"10px 12px",borderLeft:`3px solid ${t.color}`,marginBottom:8}}>
                <div style={{...s.row,gap:6,marginBottom:6}}><span style={{width:8,height:8,borderRadius:"50%",background:t.color,display:"inline-block"}}/><span style={{fontWeight:500,fontSize:13,color:t.color}}>{t.label}</span></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {periOpts.map(o=>(<div key={o.v} onClick={()=>applyPeri(tipoId,o.v)} style={{padding:"7px 6px",borderRadius:8,cursor:"pointer",textAlign:"center",fontSize:12,border:`1.5px solid ${atual===o.v?t.color:"var(--color-border-tertiary)"}`,background:atual===o.v?t.bg:"transparent",color:atual===o.v?t.color:"var(--color-text-primary)",fontWeight:atual===o.v?500:400}}>{o.l}</div>))}
                </div>
              </div>);
            })}
            <div style={s.sep}/>
            <div style={{...s.row,gap:8,marginTop:12,marginBottom:8}}>
              <button style={{...s.out,flex:1,color:m.ativo?"#A32D2D":"#0F6E56"}} onClick={toggleBlock}>{m.ativo?"Bloquear acesso":"Desbloquear"}</button>
              <button style={{...s.btn("#A32D2D"),flex:1}} onClick={del}>Excluir</button>
            </div>
          </>}
        </div>
      </div>
    );
  }

  function NovoPlantaoModal(){
    const [step,setStep]=useState(1);
    const [nsh,setNsh]=useState({membroId:members[0]?.id||1,data:selDate,inicio:"07:00",fim:"19:00",freq:"Único",tipo:"plantao_ps"});
    const sorted=[...members].sort((a:any,b:any)=>a.nome.localeCompare(b.nome,"pt-BR"));
    async function addShift(){
      const base={membroId:Number(nsh.membroId),data:nsh.data,inicio:nsh.inicio,fim:nsh.fim,tipo:nsh.tipo};
      let toAdd=[{...base}];
      if(nsh.freq==="Semanal") for(let i=1;i<53;i++){const d=new Date(nsh.data+"T12:00:00");d.setDate(d.getDate()+7*i);toAdd.push({...base,data:localDateStr(d)});}
      else if(nsh.freq==="Quinzenal") for(let i=1;i<27;i++){const d=new Date(nsh.data+"T12:00:00");d.setDate(d.getDate()+14*i);toAdd.push({...base,data:localDateStr(d)});}
      else if(nsh.freq==="Mensal") for(let i=1;i<12;i++){const d=new Date(nsh.data+"T12:00:00");d.setMonth(d.getMonth()+i);toAdd.push({...base,data:localDateStr(d)});}
      const toInsert=toAdd.map(s=>shiftToDb({...s,status:"agendado",checkIn:null,checkOut:null,substitutoId:null}));
      const {data}=await supabase.from("shifts").insert(toInsert).select();
      if(data) setShifts(p=>[...p,...data.map(dbToShift)]);
      addNotif(`Plantão adicionado para ${mName(Number(nsh.membroId))}`,null); setModal(null);
    }
    return(
      <div style={s.ful}>
        <div style={{background:"#185FA5",color:"#fff",padding:"14px 16px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
          <button onClick={()=>step===1?setModal(null):setStep(1)} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",fontSize:22,padding:0}}>‹</button>
          <span style={{fontWeight:500,fontSize:16}}>{step===1?"Tipo de plantão":"Detalhes"}</span>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"20px 16px"}}>
          {step===1&&<>
            <p style={{fontSize:13,color:"var(--color-text-secondary)",marginBottom:16,marginTop:0}}>Escolha o tipo:</p>
            {stypes.map(t=>(<div key={t.id} onClick={()=>{setNsh(p=>({...p,tipo:t.id}));setStep(2);}} style={{display:"flex",alignItems:"center",gap:14,padding:"16px",borderRadius:12,border:`1.5px solid ${nsh.tipo===t.id?t.color:"var(--color-border-tertiary)"}`,background:nsh.tipo===t.id?t.bg:"#fff",marginBottom:10,cursor:"pointer"}}>
              <div style={{width:42,height:42,borderRadius:"50%",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{width:14,height:14,borderRadius:"50%",background:t.color,display:"inline-block"}}/></div>
              <div style={{flex:1}}><div style={{fontWeight:500,fontSize:14,color:t.color}}>{t.label}</div></div>
              <span style={{fontSize:18,color:"var(--color-text-secondary)"}}>›</span>
            </div>))}
          </>}
          {step===2&&(()=>{
            const t=stypes.find(x=>x.id===nsh.tipo)||stypes[0];
            return <>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px",borderRadius:12,background:t.bg,marginBottom:16}}>
                <span style={{width:12,height:12,borderRadius:"50%",background:t.color,display:"inline-block"}}/>
                <span style={{fontWeight:500,color:t.color,fontSize:15}}>{t.label}</span>
                <button onClick={()=>setStep(1)} style={{marginLeft:"auto",fontSize:11,color:t.color,background:"none",border:`1px solid ${t.color}`,borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>Trocar</button>
              </div>
              <div style={{marginBottom:10}}><label style={s.lbl}>Médico</label>
                <select style={s.inp} value={nsh.membroId} onChange={e=>setNsh(p=>({...p,membroId:Number(e.target.value)}))}>
                  {sorted.map((m:any)=><option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div style={{marginBottom:10}}><label style={s.lbl}>Data</label><input type="date" style={s.inp} value={nsh.data} onChange={e=>setNsh(p=>({...p,data:e.target.value}))}/></div>
              <div style={{...s.row,gap:8,marginBottom:10}}>
                <div style={{flex:1}}><label style={s.lbl}>Início</label><input type="time" style={s.inp} value={nsh.inicio} onChange={e=>setNsh(p=>({...p,inicio:e.target.value}))}/></div>
                <div style={{flex:1}}><label style={s.lbl}>Fim</label><input type="time" style={s.inp} value={nsh.fim} onChange={e=>setNsh(p=>({...p,fim:e.target.value}))}/></div>
              </div>
              <div style={{marginBottom:20}}><label style={s.lbl}>Frequência</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
                  {FREQ_OPTS.map(f=>(<div key={f} onClick={()=>setNsh(p=>({...p,freq:f}))} style={{padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",border:`1.5px solid ${nsh.freq===f?"#185FA5":"var(--color-border-tertiary)"}`,background:nsh.freq===f?"#E6F1FB":"transparent",color:nsh.freq===f?"#185FA5":"var(--color-text-primary)",fontWeight:nsh.freq===f?500:400,fontSize:13}}>{f}</div>))}
                </div>
              </div>
              <button style={{...s.btn(),width:"100%",padding:"13px",fontSize:15}} onClick={addShift}>Salvar plantão</button>
            </>;
          })()}
        </div>
      </div>
    );
  }

  function NotifsSheet(){
    return(
      <div style={s.ovl} onClick={()=>setShowNotifs(false)}>
        <div style={s.sht} onClick={(e:any)=>e.stopPropagation()}>
          <div style={{...s.row,justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontWeight:500,fontSize:16}}>Notificações</span>
            <button style={s.out} onClick={()=>{setNotifs(p=>p.map(n=>({...n,read:true})));setShowNotifs(false);}}>Marcar lidas</button>
          </div>
          {myNotifs.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"20px 0",fontSize:13}}>Nenhuma notificação</div>}
          {myNotifs.map((n:any)=>(<div key={n.id} style={{...s.card,padding:"10px 12px",borderLeft:`3px solid ${n.read?"var(--color-border-tertiary)":"#185FA5"}`,opacity:n.read?0.6:1}}><div style={{...s.row,gap:8}}><span style={{fontSize:16}}>🔔</span><span style={{fontSize:13,flex:1}}>{n.text}</span>{!n.read&&<span style={{width:8,height:8,borderRadius:"50%",background:"#185FA5",flexShrink:0}}/>}</div></div>))}
        </div>
      </div>
    );
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  return(
    <div style={s.app}>
      <div style={s.hdr}>
        <div>
          <div style={{fontSize:16,fontWeight:500}}>🏥 PlantãoMed</div>
          <div style={{fontSize:11,opacity:0.8}}>{user.nome} · {isAdmin?"Administrador":"Médico"}</div>
        </div>
        <div style={{...s.row,gap:8}}>
          {tab!=="equipe"&&tab!=="pagamento"&&(
            <button onClick={()=>setShowNotifs(true)} style={{background:"none",border:"none",cursor:"pointer",color:"#fff",position:"relative",padding:4}}>
              <span style={{fontSize:20}}>🔔</span>
              {unread>0&&<span style={{position:"absolute",top:0,right:0,background:"#E24B4A",color:"#fff",borderRadius:"50%",width:16,height:16,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:500}}>{unread}</span>}
            </button>
          )}
          <button onClick={()=>setUser(null)} style={{...s.out,background:"rgba(255,255,255,0.15)",color:"#fff",border:"none",fontSize:12}}>Sair</button>
        </div>
      </div>
      <div style={s.body}>
        {tab==="escala"   &&<EscalaView/>}
        {tab==="checkin"  &&<CheckinView/>}
        {tab==="pagamento"&&<PagamentoView/>}
        {tab==="relatorio"&&<RelatorioView/>}
        {tab==="equipe"   &&<EquipeView/>}
        {tab==="config"   &&<ConfigView/>}
      </div>
      <nav style={s.nav}>
        {tabs.map(t=>(<button key={t.id} style={s.nb(tab===t.id)} onClick={()=>setTab(t.id)}><span style={{fontSize:18}}>{t.icon}</span><span>{t.label}</span></button>))}
      </nav>
      {modal?.type==="novoPlantao"&&<NovoPlantaoModal/>}
      {modal?.type==="editShift"  &&<EditShiftModal shiftId={modal.shiftId}/>}
      {modal?.type==="perfil"     &&<PerfilModal membId={modal.membId}/>}
      {showNotifs&&<NotifsSheet/>}
    </div>
  );
}
