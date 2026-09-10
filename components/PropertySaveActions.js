"use client";
import {usePropertyPreferences} from './PropertyPreferences';
export default function PropertySaveActions({propertyId,locale='en'}){
 const p=usePropertyPreferences();const fa=locale==='fa';if(!p)return null;
 const selected=p.compare.includes(propertyId);const full=p.compare.length>=3&&!selected;
 return <div className="property-save-actions">
 <button type="button" disabled={!p.ready} aria-pressed={p.saved.includes(propertyId)} onClick={()=>p.toggle('saved',propertyId)}>{p.saved.includes(propertyId)?'♥':'♡'} {fa?'ذخیره':'Save'}</button>
 <button type="button" disabled={!p.ready||full} aria-pressed={selected} onClick={()=>p.toggle('compare',propertyId)}>{selected?'✓ ':''}{full?(fa?'حداکثر ۳ ملک':'3 property limit'):(fa?'مقایسه':'Compare')}</button>
 {p.storageError&&<small role="status">{fa?'ذخیره دائمی در این مرورگر ممکن نیست.':'Storage is unavailable in this browser.'}</small>}
 </div>;
}
