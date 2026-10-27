import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, FileSpreadsheet, FileUp, Plus, ShieldCheck, Table2, UploadCloud, X, Settings2, Building2, FileCheck2 } from 'lucide-react';

type PreviewResult = { filename:string; columns:string[]; rows:Record<string,unknown>[]; row_count:number; warnings:string[] };
type ReportProfile = { id:string; name:string; prefix:string };
const sites = ['SAKANIA', 'MOKAMBO', 'MOKAMBO2'] as const;
type Site = typeof sites[number];
const defaultProfiles: ReportProfile[] = [
  { id:'import', name:'Importation', prefix:'IM' },
  { id:'export', name:'Exportation', prefix:'EX' }
];
const outputColumns = ['Date','MONTH','N°','numéro de suivi d’origine','Port name','Importation et export','Truck Type','Plate No.','Plate No.2','Plate No.3','Company Name','PREPAID COMPANY','Origin','Cargo Name','Entry Time','Exit Time','Sub-Total of Border Post','Entry card','Mairie-Sakania','DRHKAT Fee','Kanyaka Parking','Sub-Total of Parking','Total','Remark'];

export default function App() {
  const inputRef=useRef<HTMLInputElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [preview,setPreview]=useState<PreviewResult|null>(null);
  const [site,setSite]=useState<Site>('SAKANIA');
  const [profiles,setProfiles]=useState<ReportProfile[]>(defaultProfiles);
  const [activeProfileId,setActiveProfileId]=useState('import');
  const [newProfileName,setNewProfileName]=useState('');
  const [showNewProfile,setShowNewProfile]=useState(false);
  const [customColumns,setCustomColumns]=useState<string[]>(outputColumns);
  const [newColumn,setNewColumn]=useState('');
  const [showColumnEditor,setShowColumnEditor]=useState(false);

  useEffect(()=>{
    try {
      const saved=localStorage.getItem('statistic-report-profiles');
      if(saved) {
        const parsed=JSON.parse(saved) as ReportProfile[];
        if(Array.isArray(parsed) && parsed.some(p=>p.id==='import') && parsed.some(p=>p.id==='export')) setProfiles(parsed);
      }
    } catch { /* Ignore invalid local preferences and keep defaults. */ }
    try {
      const savedColumns=localStorage.getItem('statistic-output-columns');
      if(savedColumns) {
        const parsed=JSON.parse(savedColumns) as string[];
        if(Array.isArray(parsed) && parsed.length) setCustomColumns(parsed.filter(c=>typeof c==='string' && c.trim()));
      }
    } catch { /* Ignore invalid local preferences and keep defaults. */ }
  },[]);
  useEffect(()=>{ try { localStorage.setItem('statistic-report-profiles',JSON.stringify(profiles)); } catch { /* Preferences are optional. */ } },[profiles]);
  useEffect(()=>{ try { localStorage.setItem('statistic-output-columns',JSON.stringify(customColumns)); } catch { /* Preferences are optional. */ } },[customColumns]);

  const activeProfile=profiles.find(p=>p.id===activeProfileId) ?? profiles[0];
  const today = new Date();
  const two = (n:number) => String(n).padStart(2,'0');
  const numberExample = `${activeProfile.prefix}-${two(today.getFullYear()%100)}-${two(today.getMonth()+1)}-${two(today.getDate())}-001`;

  async function inspectFile(selected:File|null) {
    setFile(selected); setError(''); setPreview(null); if(!selected)return;
    if(!/\.(xlsb|xlsx|xls)$/i.test(selected.name)){setError('Format non pris en charge. Choisis un fichier .xlsb, .xlsx ou .xls.');return;}
    setBusy(true);
    try {
      const form=new FormData(); form.append('file',selected);
      const apiBase=(import.meta.env.VITE_API_BASE_URL||'https://statistic-api.onrender.com').replace(/\/$/,'');
      const response=await fetch(`${apiBase}/api/preview`,{method:'POST',body:form});
      const contentType=response.headers.get('content-type')||'';
      if(!contentType.includes('application/json')) {
        throw new Error('Le service de traitement Excel n’est pas encore connecté au site. Le fichier n’a pas été traité. Le backend doit être déployé et relié à cette application.');
      }
      const body=await response.json();
      if(!response.ok)throw new Error(body.detail||'Impossible de lire ce fichier.');
      setPreview(body as PreviewResult);
    } catch(e) {
      if(e instanceof TypeError) setError('Impossible de joindre le service de traitement Excel. Vérifie que le backend API est déployé et accessible.');
      else setError(e instanceof Error?e.message:'Erreur inattendue pendant la lecture du fichier.');
    }
    finally {setBusy(false);}
  }

  function addProfile() {
    const name=newProfileName.trim();
    if(!name) return;
    if(profiles.some(p=>p.name.toLocaleLowerCase()===name.toLocaleLowerCase())) {
      setError('Un onglet porte déjà ce nom. Choisis un nom différent.');
      return;
    }
    const base=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 ]/g,' ').trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,3);
    const profile={id:`custom-${Date.now()}`,name,prefix:base||'RP'};
    setProfiles(current=>[...current,profile]);
    setActiveProfileId(profile.id);
    setNewProfileName('');
    setShowNewProfile(false);
    setFile(null); setPreview(null); setError('');
  }

  function removeProfile(profile:ReportProfile) {
    if(profile.id==='import'||profile.id==='export') return;
    setProfiles(current=>current.filter(p=>p.id!==profile.id));
    if(activeProfileId===profile.id) setActiveProfileId('import');
  }

  function addColumn() {
    const name=newColumn.trim();
    if(!name || customColumns.some(c=>c.toLocaleLowerCase()===name.toLocaleLowerCase())) return;
    setCustomColumns(current=>[...current,name]);
    setNewColumn('');
  }

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><div className="brand-mark"><Activity size={20}/></div><div className="brand-copy"><strong>STATISTIC</strong><span>GESTION DES RAPPORTS</span></div></div>
      <div className="side-label">ESPACE DE TRAVAIL</div>
      <div className="nav-item active"><FileSpreadsheet size={17}/>Rapports statistiques</div>
      <div className="nav-item muted"><Table2 size={17}/>Structure des colonnes</div>
      <div className="nav-item muted"><ShieldCheck size={17}/>Contrôle des données</div>
      <div className="nav-item muted"><FileCheck2 size={17}/>Historique des traitements</div>
      <div className="sidebar-footer"><span className="status-dot"/><span>Session locale</span><span className="footer-divider"/>Données source préservées</div>
    </aside>
    <section className="workspace">
      <header className="topbar">
        <div><div className="breadcrumb">Opérations <span>/</span> Rapports statistiques <span>/</span> Préparation</div><h1>Centre de traitement des rapports</h1></div>
        <div className="topbar-status"><span className="status-dot"/><span>{preview?'Fichier analysé':file?'Fichier prêt à analyser':'En attente d’un fichier'}</span></div>
      </header>

      <section className="page-intro">
        <div className="intro-symbol"><Building2 size={23}/></div>
        <div><div className="section-kicker">POSTES FRONTALIERS · STATISTIQUES</div><h2>Préparer un rapport</h2><p>Importez le fichier reçu, vérifiez sa structure puis adaptez les colonnes avant la normalisation. Le document original reste intact.</p></div>
      </section>

      <section className="report-context">
        <div className="context-title"><div><span className="numbered-label">01</span><div><strong>Contexte du rapport</strong><small>Définissez le poste et le type de document à traiter.</small></div></div><span className="context-tag">PARAMÈTRES DU RAPPORT</span></div>
        <div className="context-row">
          <div className="field-group"><label>Poste frontalier</label><div className="site-tabs" role="tablist" aria-label="Poste frontalier">
            {sites.map(item=><button key={item} type="button" role="tab" aria-selected={site===item} className={site===item?'site-tab selected':'site-tab'} onClick={()=>{setSite(item);setFile(null);setPreview(null);setError('');}}>{item}</button>)}
          </div></div>
          <div className="number-preview"><span>Exemple de numéro d’origine</span><strong>{numberExample}</strong><small>Préfixe généré depuis l’onglet actif</small></div>
        </div>
        <div className="profile-heading"><div><label>Type de rapport / onglet de traitement</label><small>Créez des profils distincts selon vos rapports récurrents.</small></div><button className="text-action" type="button" onClick={()=>{setShowNewProfile(v=>!v);setError('');}}><Plus size={15}/> Nouvel onglet</button></div>
        <div className="profile-tabs" role="tablist" aria-label="Profils de rapport">
          {profiles.map(profile=><div key={profile.id} className={activeProfileId===profile.id?'profile-tab active':'profile-tab'}>
            <button type="button" role="tab" aria-selected={activeProfileId===profile.id} onClick={()=>{setActiveProfileId(profile.id);setFile(null);setPreview(null);setError('');}}>{profile.name}<span className="profile-prefix">{profile.prefix}</span></button>
            {profile.id!=='import'&&profile.id!=='export'&&<button className="remove-profile" type="button" aria-label={`Supprimer l’onglet ${profile.name}`} onClick={()=>removeProfile(profile)}><X size={13}/></button>}
          </div>)}
        </div>
        {showNewProfile&&<form className="new-profile-form" onSubmit={e=>{e.preventDefault();addProfile();}}><div><label htmlFor="new-profile-name">Nom du nouvel onglet</label><input id="new-profile-name" value={newProfileName} onChange={e=>setNewProfileName(e.target.value)} placeholder="Ex. Transit, Réexportation…" autoFocus maxLength={40}/></div><p>Un préfixe de numéro sera proposé automatiquement à partir du nom.</p><button type="submit" className="primary-button" disabled={!newProfileName.trim()}><Plus size={15}/> Créer l’onglet</button><button type="button" className="secondary-button" onClick={()=>{setShowNewProfile(false);setNewProfileName('');}}>Annuler</button></form>}
      </section>

      <nav className="workflow-strip" aria-label="Étapes du traitement">
        <div className="workflow-step current"><span>1</span><div><strong>Importation</strong><small>Charger le fichier</small></div></div>
        <div className="workflow-step"><span>2</span><div><strong>Structure</strong><small>Adapter les colonnes</small></div></div>
        <div className="workflow-step"><span>3</span><div><strong>Vérification</strong><small>Contrôler les données</small></div></div>
        <div className="workflow-step"><span>4</span><div><strong>Production</strong><small>Préparer la sortie</small></div></div>
      </nav>

      <section className="upload-card">
        <div className="card-heading"><div className="heading-with-icon"><div className="card-icon"><UploadCloud size={18}/></div><div><h3>Fichier source</h3><p>{site} · {activeProfile.name} · Formats acceptés : XLSB, XLSX, XLS</p></div></div><span className="step-pill">ÉTAPE 01</span></div>
        <button className="dropzone" onClick={()=>inputRef.current?.click()} disabled={busy}><div className="upload-icon">{busy?<Activity className="spin" size={23}/>:<FileSpreadsheet size={23}/>}</div><strong>{busy?'Lecture du fichier en cours…':file?file.name:'Sélectionner un fichier Excel'}</strong><span>{file&&preview?preview.row_count.toLocaleString('fr-FR')+' lignes détectées':'Déposez le fichier dans cette zone ou parcourez votre ordinateur.'}</span><span className="choose-file"><FileUp size={15}/>{file?'Remplacer le fichier':'Parcourir les fichiers'}</span></button>
        <input ref={inputRef} className="hidden-input" type="file" accept=".xlsb,.xlsx,.xls" onChange={e=>void inspectFile(e.target.files?.[0]??null)}/>
        {error&&<div className="alert error" role="alert">{error}</div>}
        {preview&&<div className="alert success"><CheckCircle2 size={17}/><span><strong>Fichier lu avec succès.</strong> Vérifiez les colonnes détectées et adaptez la structure de sortie avant de poursuivre.</span></div>}
      </section>

      {preview&&<section className="preview-card"><div className="card-heading"><div className="heading-with-icon"><div className="card-icon"><Table2 size={18}/></div><div><h3>Aperçu du fichier importé</h3><p>{preview.filename} · {preview.columns.length} colonnes source · {preview.row_count.toLocaleString('fr-FR')} lignes</p></div></div><span className="step-pill">APERÇU</span></div>{preview.warnings.length>0&&<div className="alert warning">{preview.warnings.map((w,i)=><div key={i}>{w}</div>)}</div>}<div className="table-wrap"><table><thead><tr>{preview.columns.map((col,i)=><th key={i}>{col}</th>)}</tr></thead><tbody>{preview.rows.slice(0,8).map((row,i)=><tr key={i}>{preview.columns.map((col,j)=><td key={j}>{String(row[col]??'')}</td>)}</tr>)}</tbody></table></div><div className="preview-note"><ShieldCheck size={15}/>Aperçu limité aux 8 premières lignes. Aucune donnée source n’est modifiée.</div></section>}

      <section className="target-card">
        <div className="card-heading"><div className="heading-with-icon"><div className="card-icon"><Settings2 size={18}/></div><div><h3>Structure cible du rapport</h3><p>Adaptez les champs de sortie à la structure attendue pour ce type de rapport.</p></div></div><span className="column-count">{customColumns.length} CHAMPS</span></div>
        <div className="column-toolbar"><span>Champs de sortie configurés</span><button className="text-action" type="button" onClick={()=>setShowColumnEditor(v=>!v)}><Settings2 size={15}/>{showColumnEditor?'Fermer les réglages':'Personnaliser les colonnes'}</button></div>
        {showColumnEditor&&<div className="column-editor"><form onSubmit={e=>{e.preventDefault();addColumn();}}><label htmlFor="new-column">Ajouter un champ de sortie</label><div className="inline-add"><input id="new-column" value={newColumn} onChange={e=>setNewColumn(e.target.value)} placeholder="Ex. Code douanier, Référence…" maxLength={80}/><button className="primary-button" type="submit" disabled={!newColumn.trim()}><Plus size={15}/> Ajouter</button></div></form><p>Retirez uniquement les champs dont votre modèle de sortie n’a pas besoin. Ces réglages personnalisent l’interface ; les règles de transformation restent à valider.</p><div className="editable-columns">{customColumns.map((col,i)=><div className="editable-column" key={col}><span>{String(i+1).padStart(2,'0')}</span><span>{col}</span><button type="button" aria-label={`Retirer ${col}`} onClick={()=>setCustomColumns(current=>current.filter(c=>c!==col))}><X size={14}/></button></div>)}</div><button className="secondary-button reset-button" type="button" onClick={()=>setCustomColumns(outputColumns)}>Rétablir les 24 champs standards</button></div>}
        {!showColumnEditor&&<div className="column-grid">{customColumns.map((col,i)=><div className="column-chip" key={col}><span>{String(i+1).padStart(2,'0')}</span>{col}</div>)}</div>}
        <div className="notice"><ShieldCheck size={16}/><span>La structure peut être adaptée. Les correspondances automatiques, les formules de calcul et l’export seront activés après validation des règles métier sur un fichier réel.</span></div>
      </section>
      <footer className="page-footer"><span>STATISTIC <span className="footer-divider"/> MODULE RAPPORTS</span><span>Importation <ArrowRight size={12}/> Structure <ArrowRight size={12}/> Vérification <ArrowRight size={12}/> Production</span></footer>
    </section>
  </main>;
}