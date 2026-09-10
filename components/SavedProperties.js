"use client";
import {useEffect,useState} from 'react';
import {usePropertyPreferences} from './PropertyPreferences';
import AreaPropertyCard from './AreaPropertyCard';
import {formatPriceDisplay} from '../lib/price';
export default function SavedProperties({locale='en'}){
 const p=usePropertyPreferences(),fa=locale==='fa';const [items,setItems]=useState([]),[state,setState]=useState('loading');
 useEffect(()=>{const c=new AbortController();fetch('/api/properties?owner=ali',{signal:c.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{setItems(d.items||[]);setState('ready');}).catch(e=>{if(e.name!=='AbortError')setState('error');});return()=>c.abort();},[]);
 if(state==='loading'||!p.ready)return <p role="status">{fa?'در حال بارگذاری…':'Loading…'}</p>;
 if(state==='error')return <p role="alert">{fa?'دریافت ملک‌ها انجام نشد. صفحه را دوباره بارگذاری کنید.':'Could not load properties. Please reload the page.'}</p>;
 const saved=items.filter(x=>p.saved.includes(x.id)),compare=p.compare.map(id=>items.find(x=>x.id===id)).filter(Boolean);
 const missing=[...new Set([...p.saved,...p.compare])].filter(id=>!items.some(x=>x.id===id));
 const fields=[[fa?'قیمت':'Price',x=>formatPriceDisplay(x.price,{locale})],[fa?'منطقه':'Area',x=>x.area],[fa?'خواب':'Bedrooms',x=>x.bedrooms],[fa?'زیربنا (فوت مربع)':'Built-up area (sq ft)',x=>x.size],[fa?'پلات (فوت مربع)':'Plot (sq ft)',x=>x.plot_size],[fa?'تحویل':'Handover',x=>x.handover],[fa?'چشم‌انداز':'View',x=>x.view]];
 return <>
 <p>{fa?'انتخاب‌ها روی همین مرورگر ذخیره می‌شوند؛ تا ۳ ملک را کنار هم مقایسه کنید.':'Saved on this browser. Compare up to 3 properties side by side.'}</p>
 {missing.length>0&&<p role="status">{fa?'بعضی انتخاب‌ها دیگر در فهرست عمومی موجود نیستند.':'Some selections are no longer publicly available.'} <button onClick={()=>missing.forEach(id=>{if(p.saved.includes(id))p.toggle('saved',id);if(p.compare.includes(id))p.toggle('compare',id);})}>{fa?'پاک کردن انتخاب‌های ناموجود':'Remove unavailable selections'}</button></p>}
 <h2>{fa?'مقایسه ملک‌ها':'Compare properties'}</h2>
 {compare.length?<div className="comparison-scroll" tabIndex={0} role="region" aria-label={fa?'جدول مقایسه':'Comparison table'}><table className="comparison-table"><caption>{fa?'مشخصات ملک‌های انتخابی':'Selected property details'}</caption><thead><tr><th scope="col">{fa?'مشخصات':'Details'}</th>{compare.map(x=><th scope="col" key={x.id}><a href={`${fa?'/fa':''}/properties/${encodeURIComponent(x.id)}`}>{x.building||x.title}</a><button onClick={()=>p.toggle('compare',x.id)} aria-label={`${fa?'حذف':'Remove'} ${x.building||x.title}`}>×</button></th>)}</tr></thead><tbody>{fields.map(([label,get])=><tr key={label}><th scope="row">{label}</th>{compare.map(x=><td key={x.id}>{get(x)||'—'}</td>)}</tr>)}</tbody></table></div>:<p>{fa?'روی «مقایسه» در کارت ملک‌های دلخواه بزنید.':'Tap Compare on a property card to start.'}</p>}
 <h2>{fa?'ملک‌های ذخیره‌شده':'Saved properties'}</h2>
 {saved.length?<div className="three-column-grid">{saved.map(x=><AreaPropertyCard property={x} key={x.id} locale={locale} areaName={x.area}/>)}</div>:<p>{fa?'هنوز ملکی ذخیره نکرده‌اید.':'You have not saved any properties yet.'}</p>}
 <a className="button secondary-button" href={`${fa?'/fa':''}/ready-properties`}>{fa?'دیدن ملک‌ها':'Explore properties'}</a>
 </>;
}
