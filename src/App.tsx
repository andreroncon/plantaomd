import { useState, useRef, useEffect } from "react";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const FREQ_OPTS = ["Único","Semanal","Quinzenal","Mensal"];

const INIT_SHIFT_TYPES = [
  {id:"plantao_ps",   label:"Plantão PS",      color:"#185FA5", bg:"#E6F1FB"},
  {id:"cirurgia_el",  label:"Cirurgia Eletiva", color:"#0F6E56", bg:"#E1F5EE"},
  {id:"horizontal",   label:"Horizontal",       color:"#BA7517", bg:"#FAEEDA"},
  {id:"coloproct",    label:"Coloproctologia",  color:"#533AB7", bg:"#EEEDFE"},
  {id:"ps_noite",     label:"PS Noite",         color:"#993556", bg:"#FBEAF0"},
  {id:"cobertura_ps", label:"Cobertura PS",     color:"#A32D2D", bg:"#FCEBEB"},
];

const DEFAULT_TARIFAS = Object.fromEntries(
  INIT_SHIFT_TYPES.map(t=>[t.id,{bruto:1000,liquido:800}])
);

let _uid = Date.now();
const uid = () => ++_uid;

function localDateStr(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function initSenha(nome){
  return nome.trim().toLowerCase().replace(/\s+/g," ").split(" ").map(p=>p[0]).join("").slice(0,3)+"123";
}

const INIT_MEMBERS = [
  {id:1,  nome:"Amilcar Martinez",  crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Amilcar Martinez"),  role:"medico",ativo:true,periodicidades:{}},
  {id:2,  nome:"Aline Zara",        crmsp:"",esp:"Coloproctologia", tel:"",email:"",senha:initSenha("Aline Zara"),         role:"medico",ativo:true,periodicidades:{}},
  {id:3,  nome:"Andre Dias",        crmsp:"112000",esp:"Clínica Geral",tel:"",email:"",senha:initSenha("Andre Dias"),      role:"medico",ativo:true,periodicidades:{}},
  {id:4,  nome:"Anne Izabelly",     crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Anne Izabelly"),      role:"medico",ativo:true,periodicidades:{}},
  {id:5,  nome:"Antonio Marques",   crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Antonio Marques"),    role:"medico",ativo:true,periodicidades:{}},
  {id:6,  nome:"Carolina Bonizzio", crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Carolina Bonizzio"),  role:"medico",ativo:true,periodicidades:{}},
  {id:7,  nome:"Danilo Razente",    crmsp:"",esp:"Cirurgia",        tel:"",email:"",senha:initSenha("Danilo Razente"),      role:"medico",ativo:true,periodicidades:{}},
  {id:8,  nome:"Elisama Paiva",     crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Elisama Paiva"),      role:"medico",ativo:true,periodicidades:{}},
  {id:9,  nome:"Erica Sakamoto",    crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Erica Sakamoto"),     role:"medico",ativo:true,periodicidades:{}},
  {id:10, nome:"Gabriela Teixeira", crmsp:"",esp:"Cirurgia",        tel:"",email:"",senha:initSenha("Gabriela Teixeira"),  role:"medico",ativo:true,periodicidades:{}},
  {id:11, nome:"Joao Emilio",       crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Joao Emilio"),        role:"medico",ativo:true,periodicidades:{}},
  {id:12, nome:"Jose Farao",        crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Jose Farao"),         role:"medico",ativo:true,periodicidades:{}},
  {id:13, nome:"Juliana Batista",   crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Juliana Batista"),    role:"medico",ativo:true,periodicidades:{}},
  {id:14, nome:"Luis Felipe",       crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Luis Felipe"),        role:"medico",ativo:true,periodicidades:{}},
  {id:15, nome:"Matheus Rezende",   crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Matheus Rezende"),    role:"medico",ativo:true,periodicidades:{}},
  {id:16, nome:"Melissa Mazepa",    crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Melissa Mazepa"),     role:"medico",ativo:true,periodicidades:{}},
  {id:17, nome:"Munir Charruf",     crmsp:"",esp:"Cirurgia",        tel:"",email:"",senha:initSenha("Munir Charruf"),      role:"medico",ativo:true,periodicidades:{}},
  {id:18, nome:"Pedro Marin",       crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Pedro Marin"),        role:"medico",ativo:true,periodicidades:{}},
  {id:19, nome:"Renan Rosetti",     crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Renan Rosetti"),      role:"medico",ativo:true,periodicidades:{}},
  {id:20, nome:"Rodrigo Nicida",    crmsp:"",esp:"Cirurgia",        tel:"",email:"",senha:initSenha("Rodrigo Nicida"),     role:"medico",ativo:true,periodicidades:{}},
  {id:21, nome:"Sean Phillipe",     crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Sean Phillipe"),      role:"medico",ativo:true,periodicidades:{}},
  {id:22, nome:"Sterphany",         crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Sterphany"),          role:"medico",ativo:true,periodicidades:{}},
  {id:23, nome:"Thiago Igelssias",  crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Thiago Igelssias"),   role:"medico",ativo:true,periodicidades:{}},
  {id:24, nome:"Wlater Amorim",     crmsp:"",esp:"Clínica Geral",   tel:"",email:"",senha:initSenha("Wlater Amorim"),      role:"medico",ativo:true,periodicidades:{}},
];
INIT_MEMBERS.forEach((m,i)=>{ if(!m.crmsp) m.crmsp = String(100101+i); });

const MON_BASE = "2026-05-18";
const weekTemplate = [
  {off:1,mId:17,i:"07:00",f:"19:00",t:"plantao_ps"},{off:2,mId:22,i:"07:00",f:"19:00",t:"plantao_ps"},
  {off:3,mId:23,i:"07:00",f:"19:00",t:"plantao_ps"},{off:4,mId:24,i:"07:00",f:"19:00",t:"plantao_ps"},
  {off:5,mId:1, i:"07:00",f:"19:00",t:"plantao_ps"},{off:6,mId:6, i:"07:00",f:"19:00",t:"plantao_ps"},
  {off:7,mId:4, i:"07:00",f:"19:00",t:"plantao_ps"},{off:1,mId:1, i:"07:00",f:"19:00",t:"plantao_ps"},
  {off:6,mId:21,i:"07:00",f:"19:00",t:"plantao_ps"},{off:7,mId:5, i:"07:00",f:"19:00",t:"plantao_ps"},
  {off:1,mId:17,i:"08:00",f:"15:00",t:"cirurgia_el"},{off:2,mId:19,i:"08:00",f:"15:00",t:"cirurgia_el"},
  {off:4,mId:20,i:"08:00",f:"15:00",t:"cirurgia_el"},{off:5,mId:16,i:"08:00",f:"15:00",t:"cirurgia_el"},
  {off:3,mId:9, i:"08:00",f:"15:00",t:"cirurgia_el"},
  {off:1,mId:11,i:"08:00",f:"13:00",t:"horizontal"},{off:2,mId:10,i:"08:00",f:"13:00",t:"horizontal"},
  {off:3,mId:7, i:"08:00",f:"13:00",t:"horizontal"},{off:4,mId:11,i:"08:00",f:"13:00",t:"horizontal"},
  {off:5,mId:11,i:"08:00",f:"13:00",t:"horizontal"},{off:5,mId:19,i:"08:00",f:"13:00",t:"horizontal"},
  {off:3,mId:6, i:"13:00",f:"18:00",t:"cirurgia_el"},
  {off:1,mId:2, i:"07:00",f:"16:00",t:"coloproct"},
  {off:1,mId:12,i:"19:00",f:"07:00",t:"ps_noite"},{off:2,mId:19,i:"19:00",f:"07:00",t:"ps_noite"},
  {off:3,mId:20,i:"19:00",f:"07:00",t:"ps_noite"},{off:4,mId:15,i:"19:00",f:"07:00",t:"ps_noite"},
  {off:5,mId:18,i:"19:00",f:"07:00",t:"ps_noite"},{off:6,mId:8, i:"19:00",f:"07:00",t:"ps_noite"},
  {off:7,mId:14,i:"19:00",f:"07:00",t:"ps_noite"},
  {off:1,mId:13,i:"19:00",f:"07:00",t:"cobertura_ps"},{off:2,mId:9, i:"19:00",f:"07:00",t:"cobertura_ps"},
  {off:3,mId:9, i:"19:00",f:"07:00",t:"cobertura_ps"},{off:4,mId:19,i:"19:00",f:"07:00",t:"cobertura_ps"},
  {off:5,mId:19,i:"19:00",f:"07:00",t:"cobertura_ps"},{off:6,mId:19,i:"19:00",f:"07:00",t:"cobertura_ps"},
  {off:7,mId:19,i:"19:00",f:"07:00",t:"cobertura_ps"},
];

function generateShifts(){
  const sh=[]; let sid=1;
  const base=new Date(MON_BASE+"T12:00:00");
  for(let w=0;w<53;w++){
    weekTemplate.forEach(t=>{
      const d=new Date(base); d.setDate(d.getDate()+w*7+t.off);
      const ds=d.toISOString().slice(0,10);
      if(ds>="2026-05-19") sh.push({id:sid++,membroId:t.mId,data:ds,inicio:t.i,fim:t.f,tipo:t.t,status:"agendado",checkIn:null,checkOut:null,substitutoId:null});
    });
  }
  return sh;
}

const stColor={ativo:"#0F6E56",agendado:"#185FA5",concluido:"#5F5E5A"};
const stLabel={ativo:"Em plantão",agendado:"Agendado",concluido:"Concluído"};

export default function App(){
  const [user,setUser]   = useState(null);
  const [lf,setLf]       = useState({crm:"",senha:"",tipo:"medico"});
  const [lErr,setLErr]   = useState("");
  const [tab,setTab]     = useState("escala");
  const [members,setMembers]           = useState(INIT_MEMBERS);
  const [shifts,setShifts]             = useState(generateShifts);
  const [stypes,setStypes]             = useState(INIT_SHIFT_TYPES);
  const [tarifas,setTarifas]           = useState(DEFAULT_TARIFAS);
  const [savedReports,setSavedReports] = useState([]);
  const [selDate,setSelDate]           = useState("2026-05-19");
  const [calM,setCalM] = useState(4);
  const [calY,setCalY] = useState(2026);
  const [modal,setModal]   = useState(null);
  const [notifs,setNotifs] = useState([]);
  const [showNotifs,setShowNotifs] = useState(false);
  const nid = useRef(100);

  const isAdmin = user?.role==="admin";
  const myId    = user?.memberId;
  const stOf    = id=>stypes.find(t=>t.id===id)||stypes[0];
  const mById   = id=>members.find(m=>m.id===id);
  const mName   = id=>mById(id)?.nome||"—";
  const getDIM  = (y,m)=>new Date(y,m+1,0).getDate();
  const getFD   = (y,m)=>new Date(y,m,1).getDay();
  const addNotif= (txt,mId)=>setNotifs(p=>[{id:nid.current++,text:txt,membId:mId||null,read:false},...p]);
  const unread  = notifs.filter(n=>!n.read&&(isAdmin||n.membId===myId||n.membId===null)).length;

  useEffect(()=>{
    if(!user||isAdmin) return;
    const amanha=new Date(); amanha.setDate(amanha.getDate()+1);
    const ds=localDateStr(amanha);
    shifts.filter(s=>(s.membroId===myId||s.substitutoId===myId)&&s.data===ds&&s.status==="agendado")
      .forEach(sh=>{
        const t=stOf(sh.tipo);
        addNotif(`🔔 Lembrete: plantão amanhã (${ds}) — ${t.label} das ${sh.inicio} às ${sh.fim}`,myId);
      });
  },[user]);

  function doLogin(){
    if(lf.tipo==="admin"){
      if(lf.crm==="admin"&&lf.senha==="admin123"){setUser({role:"admin",nome:"Administrador"});setLErr("");}
      else setLErr("Credenciais inválidas.");
      return;
    }
    const crm=lf.crm.trim(), pw=lf.senha.trim();
    if(!crm||!pw){setLErr("Informe CRM-SP e senha.");return;}
    const m=members.find(x=>x.ativo&&x.crmsp===crm&&x.senha===pw);
    if(m){setUser({role:"medico",memberId:m.id,nome:m.nome});setLErr("");}
    else{
      const bl=members.find(x=>!x.ativo&&x.crmsp===crm);
      setLErr(bl?"Acesso bloqueado. Contate o administrador.":"CRM ou senha inválidos.");
    }
  }

  function shiftsForDay(d){
    const ds=`${calY}-${String(calM+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    return shifts.filter(s=>s.data===ds);
  }
  const checkin  = sid=>{const h=new Date().toTimeString().slice(0,5);setShifts(p=>p.map(s=>s.id===sid?{...s,status:"ativo",checkIn:h}:s));};
  const checkout = sid=>{const h=new Date().toTimeString().slice(0,5);setShifts(p=>p.map(s=>s.id===sid?{...s,status:"concluido",checkOut:h}:s));};
  const delShift = sid=>setShifts(p=>p.filter(s=>s.id!==sid));
  const changeResp=(sid,nId)=>setShifts(p=>p.map(s=>s.id===sid?{...s,membroId:Number(nId),substitutoId:null}:s));
  function setSub(sid,subId){
    setShifts(p=>p.map(s=>s.id===sid?{...s,substitutoId:Number(subId)}:s));
    const sh=shifts.find(s=>s.id===sid);
    if(sh) addNotif(`${mName(Number(subId))} assumiu plantão de ${mName(sh.membroId)} em ${sh.data}`,null);
  }
  const cancelSub=sid=>setShifts(p=>p.map(s=>s.id===sid?{...s,substitutoId:null}:s));

  function calcMes(membId,year,month){
    const m=mById(membId); if(!m) return{bruto:0,liquido:0,list:[]};
    const key=`${year}-${String(month+1).padStart(2,"0")}`;
    const done=shifts.filter(s=>{
      if(s.status!=="concluido"||!s.data.startsWith(key)) return false;
      return (s.substitutoId||s.membroId)===membId;
    });
    let bruto=0,liquido=0;
    done.forEach(s=>{const tar=tarifas[s.tipo]||{bruto:0,liquido:0};bruto+=tar.bruto;liquido+=tar.liquido;});
    return{bruto,liquido,list:done};
  }

  function buildReportHTML(membId,year,month,adminView){
    const m=mById(membId); if(!m) return"";
    const{bruto,liquido,list}=calcMes(membId,year,month);
    const rows=list.map(sh=>{
      const t=stOf(sh.tipo); const tar=tarifas[sh.tipo]||{bruto:0,liquido:0};
      return`<tr><td>${new Date(sh.data+"T12:00").toLocaleDateString("pt-BR")}</td><td style="color:${t.color}">${t.label}</td><td>${sh.inicio}–${sh.fim}</td><td>${mName(sh.membroId)}</td><td>${sh.substitutoId?mName(sh.substitutoId):"—"}</td>${adminView?`<td>R$ ${tar.bruto.toLocaleString("pt-BR")}</td>`:""}<td>R$ ${tar.liquido.toLocaleString("pt-BR")}</td></tr>`;
    }).join("");
    return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório ${MONTHS[month]}/${year} – ${m.nome}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#222}h1{color:#185FA5;font-size:18px}.sub{color:#555;font-size:13px;margin-bottom:16px}.sum{display:flex;gap:20px;margin:16px 0;padding:12px;background:#f0f6ff;border-radius:8px}.sl{font-size:11px;color:#555}.sv{font-size:16px;font-weight:bold;color:#185FA5}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}th{background:#185FA5;color:#fff;padding:7px 5px;text-align:left}td{padding:6px 5px;border-bottom:1px solid #eee}.ft{margin-top:20px;font-size:10px;color:#aaa}</style></head><body><h1>Relatório de Plantões — ${MONTHS[month]} ${year}</h1><div class="sub">${m.nome} · CRM-SP: ${m.crmsp||""} · ${m.esp}</div><div class="sum"><div><div class="sl">Plantões</div><div class="sv">${list.length}</div></div>${adminView?`<div><div class="sl">Bruto</div><div class="sv">R$ ${bruto.toLocaleString("pt-BR")}</div></div>`:""}<div><div class="sl">Líquido</div><div class="sv">R$ ${liquido.toLocaleString("pt-BR")}</div></div></div><table><thead><tr><th>Data</th><th>Tipo</th><th>Horário</th><th>Responsável</th><th>Substituto</th>${adminView?"<th>Bruto</th>":""}<th>Líquido</th></tr></thead><tbody>${rows}</tbody></table><div class="ft">Gerado em ${new Date().toLocaleString("pt-BR")} · PlantãoMed</div></body></html>`;
  }

  function buildTeamReportHTML(year,month){
    const rows=members.map(m=>{
      const{list,bruto,liquido}=calcMes(m.id,year,month);
      if(!list.length) return"";
      const byTipo:{[k:string]:{label:string,color:string,datas:string[],bruto:number,liquido:number}}={};
      list.forEach(sh=>{
        const t=stOf(sh.tipo); const tar=tarifas[sh.tipo]||{bruto:0,liquido:0};
        if(!byTipo[sh.tipo]) byTipo[sh.tipo]={label:t.label,color:t.color,datas:[],bruto:0,liquido:0};
        byTipo[sh.tipo].datas.push(new Date(sh.data+"T12:00").toLocaleDateString("pt-BR"));
        byTipo[sh.tipo].bruto+=tar.bruto; byTipo[sh.tipo].liquido+=tar.liquido;
      });
      const tipoRows=Object.values(byTipo).map(v=>`<tr><td style="padding-left:20px;color:${v.color}">${v.label}</td><td style="font-size:10px">${v.datas.join(", ")}</td><td>R$ ${v.bruto.toLocaleString("pt-BR")}</td><td>R$ ${v.liquido.toLocaleString("pt-BR")}</td></tr>`).join("");
      return`<tr style="background:#e8f0fe"><td colspan="4" style="padding:8px 6px;font-weight:bold;color:#185FA5">${m.nome} — ${list.length} plantão(ões) · Bruto: R$ ${bruto.toLocaleString("pt-BR")} · Líquido: R$ ${liquido.toLocaleString("pt-BR")}</td></tr>${tipoRows}`;
    }).filter(Boolean).join("");
    return`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatório Equipe ${MONTHS[month]}/${year}</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#222}h1{color:#185FA5;font-size:18px}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}th{background:#185FA5;color:#fff;padding:8px 6px;text-align:left}td{padding:6px;border-bottom:1px solid #eee}.ft{margin-top:20px;font-size:10px;color:#aaa}</style></head><body><h1>Relatório da Equipe — ${MONTHS[month]} ${year}</h1><table><thead><tr><th>Tipo</th><th>Datas</th><th>Bruto</th><th>Líquido</th></tr></thead><tbody>${rows}</tbody></table><div class="ft">Gerado em ${new Date().toLocaleString("pt-BR")} · PlantãoMed</div></body></html>`;
  }

  function openHTML(html){
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const w=window.open(url,"_blank");
    if(!w){const a=document.createElement("a");a.href=url;a.download="relatorio.html";document.body.appendChild(a);a.click();a.remove();}
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }

  function saveReport(title,html,membId){
    setSavedReports(p=>{
      const f=p.filter(r=>r.title!==title);
      return [{id:uid(),title,html,date:new Date().toLocaleString("pt-BR"),membId:membId||null},...f];
    });
  }

  function gerarRelatorio(membId,year,month,adminView){
    const m=mById(membId); if(!m) return;
    const html=buildReportHTML(membId,year,month,adminView);
    const title=`Relatório ${MONTHS[month]}/${year} – ${m.nome}`;
    saveReport(title,html,membId);
    openHTML(html);
  }

  function gerarRelatorioEquipe(year,month){
    const html=buildTeamReportHTML(year,month);
    const title=`Relatório Equipe — ${MONTHS[month]}/${year}`;
    saveReport(title,html,null);
    openHTML(html);
  }

  const s={
    app:{fontFamily:"system-ui,sans-serif",maxWidth:420,margin:"0 auto",background:"var(--color-background-tertiary)",height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"},
    hdr:{background:"#185FA5",color:"#fff",padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0},
    body:{flex:1,padding:"12px 12px 12px",overflowY:"auto"},
    nav:{display:"flex",background:"var(--color-background-primary)",borderTop:"0.5px solid var(--color-border-tertiary)",flexShrink:0},
    nb:(a)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"8px 2px 6px",border:"none",background:"none",cursor:"pointer",color:a?"#185FA5":"var(--color-text-secondary)",fontSize:9,gap:2,borderTop:a?"2px solid #185FA5":"2px solid transparent"}),
    card:{background:"var(--color-background-primary)",borderRadius:12,border:"0.5px solid var(--color-border-tertiary)",padding:"12px 14px",marginBottom:10},
    bdg:(c,bg)=>({display:"inline-block",padding:"2px 7px",borderRadius:6,fontSize:11,background:bg||c+"22",color:c,fontWeight:500}),
    btn:(c)=>({padding:"8px 14px",borderRadius:8,border:"none",background:c||"#185FA5",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:500}),
    out:{padding:"6px 12px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"none",color:"var(--color-text-primary)",cursor:"pointer",fontSize:13},
    inp:{width:"100%",padding:"8px 10px",borderRadius:8,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)",color:"var(--color-text-primary)",fontSize:13,boxSizing:"border-box"},
    lbl:{fontSize:12,color:"var(--color-text-secondary)",marginBottom:3,display:"block"},
    row:{display:"flex",gap:8,alignItems:"center"},
    sep:{height:"0.5px",background:"var(--color-border-tertiary)",margin:"8px 0"},
    ovl:{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:100},
    sht:{background:"var(--color-background-primary)",borderRadius:"16px 16px 0 0",padding:20,width:"100%",maxWidth:420,maxHeight:"84vh",overflowY:"auto"},
    ful:{position:"fixed",inset:0,background:"#fff",zIndex:200,display:"flex",flexDirection:"column",maxWidth:420,margin:"0 auto",overflow:"hidden"},
  };

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
        <div style={{marginTop:14,fontSize:11,color:"var(--color-text-secondary)",textAlign:"center",lineHeight:1.8}}>
          Admin: <b>admin</b> / <b>admin123</b><br/>
          Médico: login = nº CRM-SP · senha = iniciais + 123<br/>
          Ex: Andre Dias → <b>112000</b> / <b>ad123</b><br/>
          Ex: Amilcar Martinez → <b>100101</b> / <b>am123</b>
        </div>
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

  const myNotifs=notifs.filter(n=>isAdmin||n.membId===myId||n.membId===null);

  // ── SHIFT CARD ────────────────────────────────────────────────────────────
  function ShiftCard({sh}){
    const t=stOf(sh.tipo); const sub=sh.substitutoId?mById(sh.substitutoId):null;
    const [er,setEr]=useState(false); const [es,setEs]=useState(false);
    const [sr,setSr]=useState(sh.membroId);
    const [ss2,setSs2]=useState(members.find(m=>m.id!==sh.membroId)?.id||1);
    const sorted=[...members].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    return(
      <div style={{...s.card,borderLeft:`3px solid ${t.color}`}}>
        <div style={{...s.row,justifyContent:"space-between",marginBottom:3}}>
          <span style={s.bdg(t.color,t.bg)}>{t.label}</span>
          <span style={s.bdg(stColor[sh.status])}>{stLabel[sh.status]}</span>
        </div>
        <div style={{fontSize:13,fontWeight:500}}>{sh.inicio}–{sh.fim}</div>
        <div style={{fontSize:12,color:"var(--color-text-secondary)",marginTop:2}}>
          <b style={{color:"var(--color-text-primary)"}}>Resp.:</b> {mName(sh.membroId)}
          {sub&&<span style={{color:t.color}}> · Sub.: {sub.nome}</span>}
        </div>
        <div style={s.sep}/>
        {isAdmin&&<div style={{marginBottom:8}}>
          <div style={{...s.row,justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Responsável definitivo</span>
            <button style={{...s.out,fontSize:11,padding:"3px 8px"}} onClick={()=>setEr(v=>!v)}>{er?"✕":"Alterar"}</button>
          </div>
          {er&&<div style={{...s.row,gap:6}}>
            <select style={{...s.inp,flex:1}} value={sr} onChange={e=>setSr(Number(e.target.value))}>
              {sorted.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <button style={s.btn()} onClick={()=>{changeResp(sh.id,sr);setEr(false);}}>OK</button>
          </div>}
        </div>}
        {isAdmin&&sh.status==="agendado"&&<div style={{marginBottom:8}}>
          <div style={{...s.row,justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>Substituição pontual</span>
            {sub?<button style={{...s.out,fontSize:11,padding:"3px 8px",color:"#A32D2D"}} onClick={()=>cancelSub(sh.id)}>Cancelar sub.</button>
               :<button style={{...s.out,fontSize:11,padding:"3px 8px"}} onClick={()=>setEs(v=>!v)}>{es?"✕":"Indicar"}</button>}
          </div>
          {es&&!sub&&<div style={{...s.row,gap:6}}>
            <select style={{...s.inp,flex:1}} value={ss2} onChange={e=>setSs2(Number(e.target.value))}>
              {sorted.filter(m=>m.id!==sh.membroId).map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
            <button style={s.btn()} onClick={()=>{setSub(sh.id,ss2);setEs(false);}}>OK</button>
          </div>}
        </div>}
        <div style={{...s.row,gap:6,flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:"var(--color-text-secondary)",flex:1}}>In: <b>{sh.checkIn||"—"}</b> Out: <b>{sh.checkOut||"—"}</b></span>
          {sh.status==="agendado"&&<button style={s.btn("#0F6E56")} onClick={()=>checkin(sh.id)}>Entrada</button>}
          {sh.status==="ativo"&&<button style={s.btn("#BA7517")} onClick={()=>checkout(sh.id)}>Saída</button>}
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
            <div key={sh.id} onClick={()=>setModal({type:"editShift",shiftId:sh.id})}
              style={{...s.card,borderLeft:`3px solid ${t.color}`,cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1}}>
                <div style={{...s.row,gap:6,marginBottom:3}}><span style={s.bdg(t.color,t.bg)}>{t.label}</span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{sh.inicio}–{sh.fim}</span></div>
                <div style={{fontSize:13,fontWeight:500}}>{mName(sh.membroId)}</div>
                {sub&&<div style={{fontSize:12,color:t.color}}>Sub.: {sub.nome}</div>}
              </div>
              <span style={{color:"var(--color-text-secondary)",fontSize:18}}>›</span>
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
    const [selMem,setSelMem]=useState(isAdmin?members[0].id:myId);
    const [pM,setPM]=useState(calM); const [pY,setPY]=useState(calY);
    const m=mById(selMem);
    const{bruto,liquido,list}=m?calcMes(selMem,pY,pM):{bruto:0,liquido:0,list:[]};
    const byTipo={};
    list.forEach(sh=>{
      if(!byTipo[sh.tipo]) byTipo[sh.tipo]={count:0,bruto:0,liquido:0};
      const tar=tarifas[sh.tipo]||{bruto:0,liquido:0};
      byTipo[sh.tipo].count++; byTipo[sh.tipo].bruto+=tar.bruto; byTipo[sh.tipo].liquido+=tar.liquido;
    });
    const sorted=[...members].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    const myRep=savedReports.filter(r=>isAdmin||r.membId===myId);
    return(
      <div>
        {isAdmin&&<div style={{marginBottom:10}}>
          <label style={s.lbl}>Médico</label>
          <select style={s.inp} value={selMem} onChange={e=>setSelMem(Number(e.target.value))}>
            {sorted.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
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
        {Object.entries(byTipo).map(([tid,v])=>{const t=stOf(tid);return(
          <div key={tid} style={{...s.card,borderLeft:`3px solid ${t.color}`,padding:"10px 12px",marginBottom:8}}>
            <div style={{...s.row,justifyContent:"space-between",marginBottom:4}}><span style={s.bdg(t.color,t.bg)}>{t.label}</span><span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{v.count}×</span></div>
            <div style={{...s.row,gap:12}}>
              {isAdmin&&<div><div style={s.lbl}>Bruto</div><div style={{fontWeight:500,color:"#185FA5"}}>R$ {v.bruto.toLocaleString("pt-BR")}</div></div>}
              <div><div style={s.lbl}>Líquido</div><div style={{fontWeight:500,color:"#0F6E56"}}>R$ {v.liquido.toLocaleString("pt-BR")}</div></div>
            </div>
          </div>
        );})}
        <button style={{...s.btn(),width:"100%",marginTop:4}} onClick={()=>gerarRelatorio(selMem,pY,pM,isAdmin)}>
          📄 Gerar relatório individual
        </button>
        {isAdmin&&<button style={{...s.btn("#0F6E56"),width:"100%",marginTop:8}} onClick={()=>gerarRelatorioEquipe(pY,pM)}>
          📋 Gerar relatório da equipe
        </button>}
        {myRep.length>0&&<>
          <div style={{fontWeight:500,fontSize:14,margin:"16px 0 8px"}}>Relatórios salvos</div>
          {myRep.map(r=>(
            <div key={r.id} style={{...s.card,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{r.title}</div><div style={{fontSize:11,color:"var(--color-text-secondary)"}}>{r.date}</div></div>
              <button style={s.btn()} onClick={()=>openHTML(r.html)}>📥 Ver</button>
              <button style={{...s.out,color:"#A32D2D",fontSize:12,padding:"5px 8px"}} onClick={()=>setSavedReports(p=>p.filter(x=>x.id!==r.id))}>✕</button>
            </div>
          ))}
        </>}
      </div>
    );
  }

  // ── RELATÓRIO ─────────────────────────────────────────────────────────────
  function RelatorioView(){
    const [selMem,setSelMem]=useState(isAdmin?members[0].id:myId);
    const [rM,setRM]=useState(calM); const [rY,setRY]=useState(calY);
    const m=mById(selMem);
    const{bruto,liquido,list}=m?calcMes(selMem,rY,rM):{bruto:0,liquido:0,list:[]};
    const sorted=[...members].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    const myRep=savedReports.filter(r=>isAdmin||r.membId===myId);
    return(
      <div>
        {isAdmin&&<><div style={s.lbl}>Médico</div>
          <select value={selMem} onChange={e=>setSelMem(Number(e.target.value))} style={{...s.inp,marginBottom:10}}>
            {sorted.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
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
              {(()=>{
                const res=[{l:"Plantões",v:String(list.length),s2:"realizados"}];
                if(isAdmin) res.push({l:"Bruto",v:"R$ "+bruto.toLocaleString("pt-BR"),s2:MONTHS[rM]});
                res.push({l:"Líquido",v:"R$ "+liquido.toLocaleString("pt-BR"),s2:MONTHS[rM]});
                return res.map(({l,v,s2})=>(
                  <div key={l} style={{background:"#fff",borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#185FA5"}}>{l}</div>
                    <div style={{fontWeight:500,fontSize:14,color:"#185FA5"}}>{v}</div>
                    <div style={{fontSize:10,color:"#185FA5",opacity:0.7}}>{s2}</div>
                  </div>
                ));
              })()}
            </div>
            <button style={{...s.btn("#fff"),color:"#185FA5",width:"100%",border:"0.5px solid #185FA5"}} onClick={()=>gerarRelatorio(selMem,rY,rM,isAdmin)}>
              📄 Exportar e abrir relatório
            </button>
          </div>
          <div style={{fontWeight:500,fontSize:14,margin:"12px 0 8px"}}>Plantões — {list.length}</div>
          {list.map(sh=>{const t=stOf(sh.tipo); const tar=tarifas[sh.tipo]||{bruto:0,liquido:0}; return(
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
                <button style={{...s.out,color:"#A32D2D",fontSize:12,padding:"5px 8px"}} onClick={()=>setSavedReports(p=>p.filter(x=>x.id!==r.id))}>✕</button>
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
    const sorted=[...members].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    function addM(){
      if(!nm.nome||!nm.crmsp) return;
      const pw=initSenha(nm.nome);
      setMembers(p=>[...p,{...nm,id:uid(),senha:pw,role:"medico",ativo:true,periodicidades:{}}]);
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
              <input style={s.inp} placeholder={pl} value={nm[k]||""} onChange={e=>setNm(p=>({...p,[k]:e.target.value}))} type={tp}/>
            </div>
          ))}
          <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:10}}>Senha gerada automaticamente: 3 iniciais + 123</div>
          <button style={{...s.btn(),width:"100%"}} onClick={addM}>Salvar médico</button>
        </div>}
        {sorted.map(m=>(
          <div key={m.id} style={{...s.card,cursor:"pointer",opacity:m.ativo?1:0.5}} onClick={()=>setModal({type:"perfil",membId:m.id})}>
            <div style={{...s.row,gap:10}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:m.ativo?"#E6F1FB":"#eee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:"#185FA5",flexShrink:0}}>
                {m.nome.split(" ").map(x=>x[0]).slice(0,2).join("")}
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
    const [editId,setEditId]=useState(null);
    const [ef,setEf]=useState({label:"",bruto:0,liquido:0});
    const [sa,setSa]=useState(""); const [sn,setSn]=useState(""); const [sc,setSc]=useState(""); const [sm,setSm]=useState("");
    function startEdit(t){setEditId(t.id);setEf({label:t.label,bruto:tarifas[t.id]?.bruto||0,liquido:tarifas[t.id]?.liquido||0});}
    function saveEdit(tid){
      setStypes(p=>p.map(x=>x.id===tid?{...x,label:ef.label}:x));
      setTarifas(p=>({...p,[tid]:{bruto:Number(ef.bruto),liquido:Number(ef.liquido)}}));
      setEditId(null);
    }
    function trocarSenha(){
      const m=mById(myId);
      if(!m||m.senha!==sa){setSm("Senha atual incorreta.");return;}
      if(sn.length<6){setSm("Nova senha deve ter ao menos 6 caracteres.");return;}
      if(sn!==sc){setSm("As senhas não coincidem.");return;}
      setMembers(p=>p.map(x=>x.id===myId?{...x,senha:sn}:x));
      setSm("Senha alterada com sucesso!"); setSa(""); setSn(""); setSc("");
    }
    return(
      <div>
        {isAdmin&&<>
          <div style={{fontWeight:500,fontSize:15,marginBottom:8}}>Tipos de plantão</div>
          {stypes.map(t=>(
            <div key={t.id} style={{...s.card,padding:"12px",borderLeft:`3px solid ${t.color}`,marginBottom:8}}>
              {editId===t.id?(
                <div>
                  <div style={{marginBottom:8}}><label style={s.lbl}>Nome</label><input style={s.inp} value={ef.label} onChange={e=>setEf(p=>({...p,label:e.target.value}))}/></div>
                  <div style={{...s.row,gap:8,marginBottom:10}}>
                    <div style={{flex:1}}><label style={s.lbl}>Bruto (R$)</label><input type="number" style={s.inp} value={ef.bruto} onChange={e=>setEf(p=>({...p,bruto:e.target.value}))}/></div>
                    <div style={{flex:1}}><label style={s.lbl}>Líquido (R$)</label><input type="number" style={s.inp} value={ef.liquido} onChange={e=>setEf(p=>({...p,liquido:e.target.value}))}/></div>
                  </div>
                  <div style={{...s.row,gap:6}}>
                    <button style={{...s.out,flex:1}} onClick={()=>setEditId(null)}>Cancelar</button>
                    <button style={{...s.btn(),flex:1}} onClick={()=>saveEdit(t.id)}>Salvar</button>
                  </div>
                </div>
              ):(
                <div>
                  <div style={{...s.row,justifyContent:"space-between",marginBottom:6}}>
                    <div style={{...s.row,gap:8}}><span style={{width:10,height:10,borderRadius:"50%",background:t.color,display:"inline-block"}}/><span style={{fontWeight:500}}>{t.label}</span></div>
                    <button style={{...s.out,fontSize:12,padding:"4px 10px"}} onClick={()=>startEdit(t)}>Editar</button>
                  </div>
                  <div style={{...s.row,gap:16}}>
                    <div><div style={s.lbl}>Bruto</div><div style={{fontWeight:500,color:"#185FA5"}}>R$ {(tarifas[t.id]?.bruto||0).toLocaleString("pt-BR")}</div></div>
                    <div><div style={s.lbl}>Líquido</div><div style={{fontWeight:500,color:"#0F6E56"}}>R$ {(tarifas[t.id]?.liquido||0).toLocaleString("pt-BR")}</div></div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div style={s.sep}/>
        </>}
        <div style={{fontWeight:500,fontSize:15,margin:"12px 0 8px"}}>Alterar minha senha</div>
        {[["Senha atual",sa,setSa],["Nova senha",sn,setSn],["Confirmar",sc,setSc]].map(([pl,val,set])=>(
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
  function EditShiftModal({shiftId}){
    const sh=shifts.find(s=>s.id===shiftId); if(!sh) return null;
    const t=stOf(sh.tipo); const sub=sh.substitutoId?mById(sh.substitutoId):null;
    const [sr,setSr]=useState(sh.membroId);
    const sorted=[...members].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    return(
      <div style={s.ovl} onClick={()=>setModal(null)}>
        <div style={s.sht} onClick={e=>e.stopPropagation()}>
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
            {sorted.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          {sr!==sh.membroId&&<div style={{...s.row,gap:6,marginBottom:10}}>
            {isAdmin&&<button style={{...s.btn(),flex:1,fontSize:12}} onClick={()=>{changeResp(sh.id,sr);setModal(null);}}>Salvar definitivo</button>}
            <button style={{...s.btn("#0F6E56"),flex:1,fontSize:12}} onClick={()=>{setSub(sh.id,sr);setModal(null);}}>Salvar pontual</button>
          </div>}
          {sub&&<div style={{...s.card,background:t.bg,border:"none",marginBottom:10,padding:"10px 12px"}}>
            <div style={{fontSize:12,color:t.color,marginBottom:2}}>Substituto registrado</div>
            <div style={{...s.row,justifyContent:"space-between"}}>
              <span style={{fontWeight:500,color:t.color}}>{sub.nome}</span>
              <button style={{...s.out,fontSize:11,padding:"3px 8px",color:"#A32D2D"}} onClick={()=>{cancelSub(sh.id);setModal(null);}}>Cancelar</button>
            </div>
          </div>}
          <div style={s.sep}/>
          <div style={{...s.row,gap:10,marginBottom:12}}>
            {[["Entrada",sh.checkIn],["Saída",sh.checkOut]].map(([l,v])=>(
              <div key={l} style={{flex:1,padding:"10px",borderRadius:8,background:"var(--color-background-secondary)",textAlign:"center"}}>
                <div style={s.lbl}>{l}</div><div style={{fontWeight:500,fontSize:15}}>{v||"—"}</div>
              </div>
            ))}
          </div>
          <div style={{...s.row,gap:8}}>
            {sh.status==="agendado"&&<button style={{...s.btn("#0F6E56"),flex:1}} onClick={()=>{checkin(sh.id);setModal(null);}}>Registrar entrada</button>}
            {sh.status==="ativo"&&<button style={{...s.btn("#BA7517"),flex:1}} onClick={()=>{checkout(sh.id);setModal(null);}}>Registrar saída</button>}
            {isAdmin&&<button style={{...s.out,color:"#A32D2D"}} onClick={()=>{delShift(sh.id);setModal(null);}}>Excluir</button>}
          </div>
        </div>
      </div>
    );
  }

  function PerfilModal({membId}){
    const m=mById(membId); if(!m) return null;
    const [edit,setEdit]=useState(false); const [form,setForm]=useState({...m});
    const periOpts=[{v:1,l:"Toda semana"},{v:2,l:"A cada 2 sem."},{v:3,l:"A cada 3 sem."},{v:4,l:"A cada 4 sem."}];
    const meusTipos=[...new Set(shifts.filter(s=>s.membroId===membId).map(s=>s.tipo))];
    function save(){setMembers(p=>p.map(x=>x.id===membId?{...x,...form}:x));setEdit(false);}
    function toggleBlock(){setMembers(p=>p.map(x=>x.id===membId?{...x,ativo:!x.ativo}:x));}
    function del(){if(window.confirm(`Excluir ${m.nome}?`)){setMembers(p=>p.filter(x=>x.id!==membId));setModal(null);}}
    function applyPeri(tipoId,sem){
      setMembers(p=>p.map(x=>x.id===membId?{...x,periodicidades:{...(x.periodicidades||{}),[tipoId]:sem}}:x));
      const hoje=new Date("2026-05-19T12:00:00");
      setShifts(prev=>{
        const filt=prev.filter(s=>!(s.membroId===membId&&s.tipo===tipoId&&s.status==="agendado"&&new Date(s.data+"T12:00")>=hoje));
        const base=prev.find(s=>s.membroId===membId&&s.tipo===tipoId); if(!base) return filt;
        const novas=[]; const dow=new Date(base.data+"T12:00").getDay();
        const d0=new Date(hoje); while(d0.getDay()!==dow) d0.setDate(d0.getDate()+1);
        let d=new Date(d0); const fim=new Date("2027-05-19");
        while(d<=fim){novas.push({id:uid(),membroId:membId,data:d.toISOString().slice(0,10),inicio:base.inicio,fim:base.fim,tipo:tipoId,status:"agendado",checkIn:null,checkOut:null,substitutoId:null});d=new Date(d);d.setDate(d.getDate()+sem*7);}
        return[...filt,...novas];
      });
      addNotif(`Periodicidade de ${m.nome} em ${stOf(tipoId).label}: a cada ${sem} sem.`,null);
    }
    const fields=[["nome","Nome completo","text"],["crmsp","CRM-SP (login)","text"],["esp","Especialidade","text"],["tel","Telefone","tel"],["email","E-mail","email"],["senha","Senha","password"]];
    const initials=m.nome.split(" ").map(x=>x[0]).slice(0,2).join("");
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
                .map(([l,v])=>(
                  <div key={l} style={{...s.row,justifyContent:"space-between",padding:"10px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
                    <span style={{fontSize:13,color:"var(--color-text-secondary)"}}>{l}</span>
                    <span style={{fontSize:13,fontWeight:500,maxWidth:220,textAlign:"right",wordBreak:"break-all"}}>{v}</span>
                  </div>
                ))}
              {isAdmin&&<button style={{...s.btn(),width:"100%",marginTop:14}} onClick={()=>setEdit(true)}>Editar dados</button>}
            </>
          ):(
            <>
              {fields.map(([k,pl,tp])=>(
                <div key={k} style={{marginBottom:10}}>
                  <label style={s.lbl}>{pl}</label>
                  <input style={s.inp} type={tp} placeholder={pl} value={form[k]||""} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))}/>
                </div>
              ))}
              <div style={{...s.row,gap:8,marginTop:10,marginBottom:16}}>
                <button style={{...s.out,flex:1}} onClick={()=>setEdit(false)}>Cancelar</button>
                <button style={{...s.btn(),flex:1}} onClick={save}>Salvar</button>
              </div>
            </>
          )}
          {isAdmin&&<>
            <div style={s.sep}/>
            <div style={{fontWeight:500,fontSize:14,margin:"12px 0 6px"}}>Periodicidade dos plantões</div>
            {meusTipos.map(tipoId=>{
              const t=stOf(tipoId); const atual=(m.periodicidades||{})[tipoId]||1;
              return(
                <div key={tipoId} style={{...s.card,padding:"10px 12px",borderLeft:`3px solid ${t.color}`,marginBottom:8}}>
                  <div style={{...s.row,gap:6,marginBottom:6}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:t.color,display:"inline-block"}}/>
                    <span style={{fontWeight:500,fontSize:13,color:t.color}}>{t.label}</span>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                    {periOpts.map(o=>(
                      <div key={o.v} onClick={()=>applyPeri(tipoId,o.v)}
                        style={{padding:"7px 6px",borderRadius:8,cursor:"pointer",textAlign:"center",fontSize:12,
                          border:`1.5px solid ${atual===o.v?t.color:"var(--color-border-tertiary)"}`,
                          background:atual===o.v?t.bg:"transparent",
                          color:atual===o.v?t.color:"var(--color-text-primary)",fontWeight:atual===o.v?500:400}}>
                        {o.l}
                      </div>
                    ))}
                  </div>
                </div>
              );
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
    const [nsh,setNsh]=useState({membroId:members[0].id,data:"2026-05-19",inicio:"07:00",fim:"19:00",freq:"Único",tipo:"plantao_ps"});
    const sorted=[...members].sort((a,b)=>a.nome.localeCompare(b.nome,"pt-BR"));
    function addShift(){
      const base={...nsh,id:uid(),membroId:Number(nsh.membroId),status:"agendado",checkIn:null,checkOut:null,substitutoId:null};
      let toAdd=[base];
      if(nsh.freq==="Semanal") for(let i=1;i<53;i++){const d=new Date(nsh.data);d.setDate(d.getDate()+7*i);toAdd.push({...base,id:uid(),data:d.toISOString().slice(0,10)});}
      else if(nsh.freq==="Quinzenal") for(let i=1;i<27;i++){const d=new Date(nsh.data);d.setDate(d.getDate()+14*i);toAdd.push({...base,id:uid(),data:d.toISOString().slice(0,10)});}
      else if(nsh.freq==="Mensal") for(let i=1;i<12;i++){const d=new Date(nsh.data);d.setMonth(d.getMonth()+i);toAdd.push({...base,id:uid(),data:d.toISOString().slice(0,10)});}
      setShifts(p=>[...p,...toAdd]); addNotif(`Plantão adicionado para ${mName(Number(nsh.membroId))}`,null); setModal(null);
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
            {stypes.map(t=>(
              <div key={t.id} onClick={()=>{setNsh(p=>({...p,tipo:t.id}));setStep(2);}}
                style={{display:"flex",alignItems:"center",gap:14,padding:"16px",borderRadius:12,
                  border:`1.5px solid ${nsh.tipo===t.id?t.color:"var(--color-border-tertiary)"}`,
                  background:nsh.tipo===t.id?t.bg:"#fff",marginBottom:10,cursor:"pointer"}}>
                <div style={{width:42,height:42,borderRadius:"50%",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{width:14,height:14,borderRadius:"50%",background:t.color,display:"inline-block"}}/>
                </div>
                <div style={{flex:1}}><div style={{fontWeight:500,fontSize:14,color:t.color}}>{t.label}</div></div>
                <span style={{fontSize:18,color:"var(--color-text-secondary)"}}>›</span>
              </div>
            ))}
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
                <select style={s.inp} value={nsh.membroId} onChange={e=>setNsh(p=>({...p,membroId:e.target.value}))}>
                  {sorted.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div style={{marginBottom:10}}><label style={s.lbl}>Data</label>
                <input type="date" style={s.inp} value={nsh.data} onChange={e=>setNsh(p=>({...p,data:e.target.value}))}/>
              </div>
              <div style={{...s.row,gap:8,marginBottom:10}}>
                <div style={{flex:1}}><label style={s.lbl}>Início</label><input type="time" style={s.inp} value={nsh.inicio} onChange={e=>setNsh(p=>({...p,inicio:e.target.value}))}/></div>
                <div style={{flex:1}}><label style={s.lbl}>Fim</label><input type="time" style={s.inp} value={nsh.fim} onChange={e=>setNsh(p=>({...p,fim:e.target.value}))}/></div>
              </div>
              <div style={{marginBottom:20}}><label style={s.lbl}>Frequência</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
                  {FREQ_OPTS.map(f=>(
                    <div key={f} onClick={()=>setNsh(p=>({...p,freq:f}))}
                      style={{padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",
                        border:`1.5px solid ${nsh.freq===f?"#185FA5":"var(--color-border-tertiary)"}`,
                        background:nsh.freq===f?"#E6F1FB":"transparent",
                        color:nsh.freq===f?"#185FA5":"var(--color-text-primary)",fontWeight:nsh.freq===f?500:400,fontSize:13}}>
                      {f}
                    </div>
                  ))}
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
        <div style={s.sht} onClick={e=>e.stopPropagation()}>
          <div style={{...s.row,justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontWeight:500,fontSize:16}}>Notificações</span>
            <button style={s.out} onClick={()=>{setNotifs(p=>p.map(n=>({...n,read:true})));setShowNotifs(false);}}>Marcar lidas</button>
          </div>
          {myNotifs.length===0&&<div style={{textAlign:"center",color:"var(--color-text-secondary)",padding:"20px 0",fontSize:13}}>Nenhuma notificação</div>}
          {myNotifs.map(n=>(
            <div key={n.id} style={{...s.card,padding:"10px 12px",borderLeft:`3px solid ${n.read?"var(--color-border-tertiary)":"#185FA5"}`,opacity:n.read?0.6:1}}>
              <div style={{...s.row,gap:8}}>
                <span style={{fontSize:16}}>🔔</span>
                <span style={{fontSize:13,flex:1}}>{n.text}</span>
                {!n.read&&<span style={{width:8,height:8,borderRadius:"50%",background:"#185FA5",flexShrink:0}}/>}
              </div>
            </div>
          ))}
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
        {tabs.map(t=>(
          <button key={t.id} style={s.nb(tab===t.id)} onClick={()=>setTab(t.id)}>
            <span style={{fontSize:18}}>{t.icon}</span><span>{t.label}</span>
          </button>
        ))}
      </nav>
      {modal?.type==="novoPlantao"&&<NovoPlantaoModal/>}
      {modal?.type==="editShift"  &&<EditShiftModal shiftId={modal.shiftId}/>}
      {modal?.type==="perfil"     &&<PerfilModal membId={modal.membId}/>}
      {showNotifs&&<NotifsSheet/>}
    </div>
  );
}
