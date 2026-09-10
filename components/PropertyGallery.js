"use client";
import Image from 'next/image';
import {useRef,useState} from 'react';
export default function PropertyGallery({images,title,locale='en'}){
 const [index,setIndex]=useState(0);const dialog=useRef(null);const fa=locale==='fa';
 const move=n=>setIndex(i=>(i+n+images.length)%images.length);
 return <section className="property-gallery" aria-label={fa?'تصاویر ملک':'Property images'}>
 <button className="gallery-open" onClick={()=>dialog.current?.showModal()} aria-label={fa?'بزرگ‌نمایی تصویر':'Enlarge image'}><Image src={images[index]} alt={title} fill priority sizes="(max-width:760px) 100vw, 1200px" unoptimized={!images[index].startsWith('/')} /><span>{index+1} / {images.length} · {fa?'بزرگ‌نمایی':'Enlarge'}</span></button>
 {images.length>1&&<div className="gallery-thumbnails">{images.map((src,i)=><button key={src} aria-label={`${fa?'تصویر':'Image'} ${i+1}`} aria-pressed={i===index} onClick={()=>setIndex(i)}><Image src={src} width={100} height={72} unoptimized alt=""/></button>)}</div>}
 <p className="image-context">{fa?'تصاویر ممکن است مربوط به ساختمان یا پروژه باشند؛ تصاویر اختصاصی واحد و موجودی را درخواست کنید.':'Images may show the building or development. Ask for unit-specific photos and availability.'}</p>
 <dialog ref={dialog} className="gallery-dialog" aria-label={fa?'نمایش بزرگ تصویر':'Image viewer'} onKeyDown={e=>{if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1);}}>
 <button autoFocus onClick={()=>dialog.current.close()}>{fa?'بستن':'Close'} ×</button>
 <div className="gallery-large"><Image src={images[index]} fill sizes="95vw" unoptimized alt={`${title} ${index+1}`}/></div>
 {images.length>1&&<div className="gallery-navigation"><button onClick={()=>move(-1)}>{fa?'قبلی':'Previous'}</button><span>{index+1} / {images.length}</span><button onClick={()=>move(1)}>{fa?'بعدی':'Next'}</button></div>}
 </dialog></section>;
}
