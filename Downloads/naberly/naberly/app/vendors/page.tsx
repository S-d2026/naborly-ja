import { supabase } from '@/lib/supabase';

export const revalidate = 60;

export default async function VendorsPage() {
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <main style={{maxWidth:600,margin:'0 auto',padding:'1.5rem 1rem 3rem'}}>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontSize:22,fontWeight:700,marginBottom:4}}>Local Vendors</h1>
        <p style={{color:'#888',fontSize:14}}>{vendors?.length || 0} vendors listed across Jamaica</p>
      </div>

      {vendors?.length === 0 && (
        <div style={{textAlign:'center',padding:'3rem 1rem',color:'#999'}}>
          <p>No vendors yet — be the first!</p>
          <a href="/vendor-signup" style={{display:'inline-block',marginTop:12,background:'#f7c94b',color:'#0d1b2a',padding:'10px 20px',borderRadius:8,textDecoration:'none',fontWeight:600,fontSize:14}}>
            List Your Business Free →
          </a>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {vendors?.map(v => (
          <div key={v.id} style={{background:'#fff',border:'1px solid #eee',borderRadius:12,padding:'1rem 1.25rem'}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,marginBottom:8}}>
              <div style={{width:40,height:40,minWidth:40,borderRadius:10,background:'#0d1b2a',display:'flex',alignItems:'center',justifyContent:'center',color:'#f7c94b',fontWeight:700,fontSize:14}}>
                {v.name.split(' ').map((w:string)=>w[0]).slice(0,2).join('').toUpperCase()}
              </div>
              <div>
                <div style={{fontWeight:600,fontSize:15}}>{v.name}</div>
                <div style={{fontSize:12,color:'#888',marginTop:2}}>
                  {[v.parish, v.location, v.trading_days?.join(', ')].filter(Boolean).join(' · ')}
                </div>
              </div>
            </div>
            {v.categories?.length > 0 && (
              <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:8}}>
                {v.categories.map((c:string) => (
                  <span key={c} style={{background:'#f5f5f5',color:'#555',fontSize:11,padding:'2px 8px',borderRadius:20,border:'1px solid #e8e8e8'}}>{c}</span>
                ))}
              </div>
            )}
            {v.description && <p style={{fontSize:13,color:'#666',marginBottom:10,lineHeight:1.5}}>{v.description}</p>}
            <div style={{display:'flex',gap:8}}>
              <a href={`https://wa.me/${v.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noreferrer"
                style={{background:'#25d366',color:'#fff',padding:'6px 14px',borderRadius:6,fontSize:13,fontWeight:500,textDecoration:'none'}}>
                WhatsApp
              </a>
              {v.phone && (
                <a href={`tel:${v.phone}`}
                  style={{background:'#f0f0f0',color:'#333',padding:'6px 14px',borderRadius:6,fontSize:13,fontWeight:500,textDecoration:'none'}}>
                  Call
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{textAlign:'center',marginTop:'2rem',padding:'1.5rem',background:'#fffbea',borderRadius:12,border:'1px solid #f7c94b'}}>
        <p style={{fontSize:14,marginBottom:8}}>Are you a vendor?</p>
        <a href="/vendor-signup" style={{background:'#f7c94b',color:'#0d1b2a',padding:'10px 20px',borderRadius:8,textDecoration:'none',fontWeight:700,fontSize:14}}>
          List Your Business Free →
        </a>
      </div>
    </main>
  );
}
