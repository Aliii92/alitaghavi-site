import SavedProperties from '../../components/SavedProperties';
import ResponsiveNavbar from '../../components/ResponsiveNavbar';
import {getRequestLocale} from '../../lib/server-locale';
export const metadata={title:'Saved properties & comparison',robots:{index:false,follow:true}};
export default async function SavedPage(){const locale=await getRequestLocale();return <main className={`luxury-page ${locale==='fa'?'rtl':''}`}><ResponsiveNavbar locale={locale} brandLabel="Ali Taghavi" brandHref={locale==='fa'?'/fa':'/'} /><div className="content-shell section"><h1>{locale==='fa'?'انتخاب‌های شما':'Your shortlist'}</h1><SavedProperties locale={locale}/></div></main>;}
