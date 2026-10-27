import { useRef, useState } from 'react';
import { Activity, ArrowRight, CheckCircle2, FileSpreadsheet, FileUp, ShieldCheck, Table2, UploadCloud } from 'lucide-react';

type PreviewResult = { filename:string; columns:string[]; rows:Record<string,unknown>[]; row_count:number; warnings:string[] };
const outputColumns = ['Date','MONTH','N°','numéro de suivi d’origine','Port name','Importation et export','Truck Type','Plate No.','Plate No.2','Plate No.3','Company Name','PREPAID COMPANY','Origin','Cargo Name','Entry Time','Exit Time','Sub-Total of Border Post','Entry card','Mairie-Sakania','DRHKAT Fee','Kanyaka Parking','Sub-Total of Parking','Total','Remark'];

export default function App() {
  const inputRef=useRef<HTMLInputElement>(null);
  const [file,setFile]=useState<File|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [preview,setPreview]=useState<PreviewResult|null>(null);

  async function inspectFile(selected:File|null) {
    setFile(selected); setError(''); setPreview(null); if(!selected)return;
    if(!/\.(xlsb|xlsx|xls)$/i.test(selected.name)){setError('Format non pris en charge. Choisis un fichier .xlsb, .xlsx ou .xls.');return;}
    setBusy(true);
    try {
      const form=new FormData(); form.append('file',selected);
      const apiBase=(import.meta.env.VITE_API_BASE_URL||'').replace(/\\/$/,'');
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

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand-mark"><Activity size={21}/></div><div className="brand-copy"><strong>STATISTIC</strong><span>REPORT WORKSPACE</span></div>
      <div className="side-label">ESPACE DE TRAVAIL</div>
      <div className="nav-item active"><FileSpreadsheet size={18}/>Importer un rapport</div>
      <div className="nav-item muted"><Table2 size={18}/>Correspondance des colonnes</div>
      <div className="nav-item muted"><ShieldCheck size={18}/>Contrôle des données</div>
      <div className="sidebar-footer"><span className="status-dot"/>Traitement temporaire sécurisé</div>
    </aside>
    <section className="workspace">
      <header className="topbar"><div><div className="breadcrumb">Accueil <span>/</span> Rapports <span>/</span> Importation</div><h1>Importation d’un rapport</h1></div><div className="topbar-badge"><span className="status-dot"/>{preview?'Fichier analysé':file?'Fichier sélectionné':'Aucun rapport chargé'}</div></header>
      <section className="intro"><div><div className="section-kicker">TRAITEMENT DES DONNÉES</div><h2>Importer un fichier source</h2><p>Sélectionnez le rapport journalier du poste frontalier. Le fichier d’origine reste intact ; une copie temporaire est utilisée pour l’analyse.</p></div></section>
      <nav className="workflow-strip" aria-label="Étapes du traitement">
        <div className="workflow-step current"><span>1</span><div><strong>Importation</strong><small>Choisir le fichier source</small></div></div>
        <div className="workflow-step"><span>2</span><div><strong>Correspondance</strong><small>Associer les colonnes</small></div></div>
        <div className="workflow-step"><span>3</span><div><strong>Contrôle</strong><small>Vérifier les données</small></div></div>
        <div className="workflow-step"><span>4</span><div><strong>Export</strong><small>Produire le rapport final</small></div></div>
      </nav>
      <section className="upload-card">
        <div className="card-heading"><div><h3>Fichier source</h3><p>Formats acceptés : XLSB, XLSX et XLS</p></div><span className="step-pill">SOURCE</span></div>
        <button className="dropzone" onClick={()=>inputRef.current?.click()} disabled={busy}><div className="upload-icon">{busy?<Activity className="spin" size={25}/>:<UploadCloud size={25}/>}</div><strong>{busy?'Analyse du fichier en cours…':file?file.name:'Clique ici pour sélectionner un fichier'}</strong><span>{file&&preview?preview.row_count.toLocaleString('fr-FR')+' lignes détectées':'Le fichier original ne sera jamais modifié.'}</span><span className="choose-file"><FileUp size={16}/>{file?'Choisir un autre fichier':'Parcourir les fichiers'}</span></button>
        <input ref={inputRef} className="hidden-input" type="file" accept=".xlsb,.xlsx,.xls" onChange={e=>void inspectFile(e.target.files?.[0]??null)}/>
        {error&&<div className="alert error">{error}</div>}
        {preview&&<div className="alert success"><CheckCircle2 size={18}/><span><strong>Fichier lu avec succès.</strong> Vérifie les colonnes détectées avant de définir les règles de transformation.</span></div>}
      </section>
      {preview&&<section className="preview-card"><div className="card-heading"><div><h3>Aperçu des données</h3><p>{preview.filename} · {preview.columns.length} colonnes source · {preview.row_count} lignes</p></div><span className="step-pill">APERÇU</span></div>{preview.warnings.length>0&&<div className="alert warning">{preview.warnings.map((w,i)=><div key={i}>{w}</div>)}</div>}<div className="table-wrap"><table><thead><tr>{preview.columns.map((col,i)=><th key={i}>{col}</th>)}</tr></thead><tbody>{preview.rows.slice(0,8).map((row,i)=><tr key={i}>{preview.columns.map((col,j)=><td key={j}>{String(row[col]??'')}</td>)}</tr>)}</tbody></table></div><div className="preview-note"><ShieldCheck size={16}/>Aperçu limité aux 8 premières lignes. Aucune donnée source n’est modifiée.</div></section>}
      <section className="target-card"><div className="card-heading"><div><h3>Structure cible du rapport</h3><p>Schéma de sortie · 24 champs</p></div><span className="column-count">24 COLONNES</span></div><div className="column-grid">{outputColumns.map((col,i)=><div className="column-chip" key={col}><span>{String(i+1).padStart(2,'0')}</span>{col}</div>)}</div><div className="notice"><ShieldCheck size={17}/><span>Les formules de calcul et les correspondances seront validées à partir du fichier source réel avant activation de l’export.</span></div></section>
      <footer className="page-footer"><span>STATISTIC · Version initiale</span><span>Importation <ArrowRight size={13}/> Prévisualisation <ArrowRight size={13}/> Validation <ArrowRight size={13}/> Export</span></footer>
    </section>
  </main>;
}