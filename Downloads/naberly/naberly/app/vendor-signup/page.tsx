'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const PARISHES = [
  'Kingston','St. Andrew','St. Thomas','Portland','St. Mary',
  'St. Ann','Trelawny','St. James','Hanover','Westmoreland',
  'St. Elizabeth','Manchester','Clarendon','St. Catherine'
];
const CATEGORIES = [
  'Fresh Produce','Cooked Food','Clothing & Fabric','Crafts & Souvenirs',
  'Seafood & Fish','Spices & Seasonings','Baked Goods','Beauty & Hair',
  'Electronics','Other'
];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Daily'];

export default function VendorSignupPage() {
  const [form, setForm] = useState({
    name:'', parish:'', location:'',
    whatsapp:'', phone:'', email:'',
    description:'', categories:[] as string[], trading_days:[] as string[]
  });
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [savedVendor, setSavedVendor] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const toggle = (field: 'categories'|'trading_days', value: string) => {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v:string) => v !== value)
        : [...f[field], value]
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.parish || !form.whatsapp) {
      setErrorMsg('Please fill in Business Name, Parish, and WhatsApp number.');
      return;
    }
    setErrorMsg('');
    setStatus('loading');

    const { data, error } = await supabase
      .from('vendors')
      .insert([{
        name: form.name,
        parish: form.parish,
        location: form.location,
        whatsapp: form.whatsapp,
        phone: form.phone,
        email: form.email,
        description: form.description,
        categories: form.categories,
        trading_days: form.trading_days,
      }])
      .select()
      .single();

    if (error) {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
      return;
    }

    await fetch('/api/vendor-welcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor: data }),
    });

    setSavedVendor(data);
    setStatus('success');
  };

  if (status === 'success' && savedVendor) {
    const firstName = savedVendor.name.split(' ')[0];
    const listingUrl = `https://naberlyja.com/vendors`;
    const waText = encodeURIComponent(
      `Hi ${firstName}! 🎉\n\nYou are now LIVE on NaberlyJA!\n\nCustomers in ${savedVendor.parish} can find your listing right now at:\n${listingUrl}\n\nShare with friends, family & neighbours so they can find you too! 💛💚\n\nWelcome to the NaberlyJA family! 🇯🇲`
    );
    return (
      <main style={{maxWidth:480,margin:'0 auto',padding:'2rem 1rem',textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:'1rem'}}>🎉</div>
        <h1 style={{fontFamily:'var(--font-sans)',fontSize:22,marginBottom:8}}>{savedVendor.name} is LIVE!</h1>
        <p style={{color:'#666',marginBottom:'1.5rem'}}>
          Customers in <strong>{savedVendor.parish}</strong> can find you right now on NaberlyJA.
        </p>
        <div style={{background:'#f0faf4',border:'1px solid #b2dfcc',borderRadius:12,padding:'1rem',marginBottom:'1.5rem',textAlign:'left'}}>
          <p style={{fontSize:12,color:'#888',marginBottom:8,textTransform:'uppercase',letterSpacing:1}}>Your auto WhatsApp confirmation</p>
          <p style={{fontSize:13,lineHeight:1.6,whiteSpace:'pre-line'}}>
            {`Hi ${firstName}! 🎉\n\nYou are now LIVE on NaberlyJA!\n\nCustomers in ${savedVendor.parish} can find your listing at:\n${listingUrl}\n\nShare with friends, family & neighbours! 💛💚\n\nWelcome to the NaberlyJA family! 🇯🇲`}
          </p>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center'}}>
          <a href={`https://wa.me/?text=${waText}`} target="_blank" rel="noreferrer"
            style={{background:'#25d366',color:'#fff',padding:'10px 20px',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:500}}>
            Share on WhatsApp
          </a>
          <a href="/vendors"
            style={{background:'#0d1b2a',color:'#f7c94b',padding:'10px 20px',borderRadius:8,textDecoration:'none',fontSize:14,fontWeight:500}}>
            View All Vendors
          </a>
        </div>
        <button onClick={() => { setStatus('idle'); setForm({name:'',parish:'',location:'',whatsapp:'',phone:'',email:'',description:'',categories:[],trading_days:[]}); setSavedVendor(null); }}
          style={{marginTop:'1rem',background:'none',border:'none',color:'#999',fontSize:13,cursor:'pointer'}}>
          + Add another vendor
        </button>
      </main>
    );
  }

  return (
    <main style={{maxWidth:480,margin:'0 auto',padding:'1.5rem 1rem 3rem'}}>
      <div style={{background:'#0d1b2a',borderRadius:12,padding:'1.25rem',marginBottom:'1.5rem'}}>
        <div style={{fontFamily:'var(--font-sans)',fontSize:22,fontWeight:700,color:'#f7c94b'}}>
          naberly<span style={{color:'#fff'}}>ja</span>
        </div>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.45)',marginTop:2}}>List your business — 100% free</div>
      </div>

      {errorMsg && (
        <div style={{background:'#fff0f0',border:'1px solid #ffcccc',borderRadius:8,padding:'10px 12px',marginBottom:12,fontSize:13,color:'#cc0000'}}>
          {errorMsg}
        </div>
      )}

      <div style={{marginBottom:8,fontSize:11,fontWeight:600,letterSpacing:1.5,textTransform:'uppercase',color:'#888'}}>Your Business</div>
      <input placeholder="Business / Vendor Name *" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:14,marginBottom:10}} />
      <select value={form.parish} onChange={e=>setForm(f=>({...f,parish:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:14,marginBottom:10}}>
        <option value="">Select Parish *</option>
        {PARISHES.map(p=><option key={p}>{p}</option>)}
      </select>
      <input placeholder="Market / Area (e.g. Coronation Market)" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:14,marginBottom:16}} />

      <div style={{marginBottom:8,fontSize:11,fontWeight:600,letterSpacing:1.5,textTransform:'uppercase',color:'#888'}}>Contact</div>
      <input placeholder="WhatsApp Number * e.g. +1 876 XXX XXXX" value={form.whatsapp} onChange={e=>setForm(f=>({...f,whatsapp:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:14,marginBottom:10}} />
      <input placeholder="Phone Number (optional)" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:14,marginBottom:10}} />
      <input placeholder="Email (optional)" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:14,marginBottom:16}} />

      <div style={{marginBottom:8,fontSize:11,fontWeight:600,letterSpacing:1.5,textTransform:'uppercase',color:'#888'}}>What Do You Sell?</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
        {CATEGORIES.map(c=>(
          <label key={c} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 10px',border:`1px solid ${form.categories.includes(c)?'#f7c94b':'#ddd'}`,borderRadius:8,cursor:'pointer',fontSize:13,background:form.categories.includes(c)?'#fffbea':'#fff'}}>
            <input type="checkbox" checked={form.categories.includes(c)} onChange={()=>toggle('categories',c)} style={{accentColor:'#f7c94b'}} />
            {c}
          </label>
        ))}
      </div>
      <textarea placeholder="Describe your goods..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} style={{width:'100%',padding:'9px 12px',border:'1px solid #ddd',borderRadius:8,fontSize:14,minHeight:80,marginBottom:16,resize:'vertical'}} />

      <div style={{marginBottom:8,fontSize:11,fontWeight:600,letterSpacing:1.5,textTransform:'uppercase',color:'#888'}}>Trading Days</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:20}}>
        {DAYS.map(d=>(
          <label key={d} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 10px',border:`1px solid ${form.trading_days.includes(d)?'#f7c94b':'#ddd'}`,borderRadius:8,cursor:'pointer',fontSize:13,background:form.trading_days.includes(d)?'#fffbea':'#fff'}}>
            <input type="checkbox" checked={form.trading_days.includes(d)} onChange={()=>toggle('trading_days',d)} style={{accentColor:'#f7c94b'}} />
            {d}
          </label>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={status==='loading'}
        style={{width:'100%',padding:'13px',background:'#f7c94b',color:'#0d1b2a',border:'none',borderRadius:8,fontSize:15,fontWeight:700,cursor:'pointer'}}>
        {status==='loading' ? 'Listing your business...' : 'List My Business on NaberlyJA →'}
      </button>
    </main>
  );
}
