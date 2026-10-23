import {display,escapeHTML as esc,validLink} from './content.js?v=20261023135513';
import {CREATURES} from './creatures.js?v=20261023135513';
const $=s=>document.querySelector(s);
export function createStories(profiles,testimonials,links){
 function action(id){const l=links[id];if(!l)return '';return validLink(l.url)?`<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)} ↗</a>`:`<button disabled>${esc(l.label)}・待補</button>`;}
 function open({title,region,subtitle,logo,sections,actions,placeholder,footer}){
 const card=$('#card');card.classList.add('story-card');card.classList.remove('expanded');$('#card-handle').setAttribute('aria-expanded','false');$('#card-region').textContent=region;$('#card-number').textContent='';$('#card-title').textContent=title;$('#card-subtitle').textContent=subtitle;
 let portrait=$('#story-logo');if(!portrait){portrait=document.createElement('img');portrait.id='story-logo';portrait.className='story-logo';$('#card-region').before(portrait);}portrait.hidden=!logo;if(logo){portrait.src=logo;portrait.alt=title+' Logo';}
 card.querySelector('.placeholder-note').textContent=placeholder?'內容準備中・文字與連結待補':'島上的真實分享';card.querySelector('.placeholder-note').hidden=!placeholder;
 $('#card-items').innerHTML=sections.map(s=>`<section class="item story-section"><h3>${esc(s.title)}</h3><p>${esc(display(s.text))}</p></section>`).join('');$('#card-post').replaceChildren();let linkHeading=$('#story-links-heading');if(!linkHeading){linkHeading=document.createElement('h3');linkHeading.id='story-links-heading';$('#card-actions').before(linkHeading);}linkHeading.textContent='相關連結';linkHeading.hidden=!actions.length;$('#card-actions').innerHTML=actions.map(action).join('');card.querySelector('.source-note').textContent=footer;card.hidden=false;document.body.classList.add('card-open','map-focused');card.querySelector('.card-content').scrollTop=0;
 }
 return {
 host(id){const p=profiles[id];if(!p)return;open({title:p.name,region:'島上的主人',subtitle:'關於我・我的故事',logo:p.logo,sections:[{title:'關於我',text:p.intro},{title:'我的故事',text:p.story}],actions:p.actions,placeholder:p.intro==='TODO'||p.story==='TODO',footer:'介紹、故事與網站連結，等熊爸提供後放入。'});},
 guest(id){const t=testimonials[id];if(!t)return;open({title:t.heading,region:'島上的客人',subtitle:t.status==='placeholder'?'客人的感謝與使用感想・待補':display(t.customerName),sections:[{title:'客人的感謝',text:t.thanks},{title:'使用感想',text:t.experience},{title:'相關商品',text:t.product},{title:'分享來源',text:t.source}],actions:t.actions||[t.sourceLink],placeholder:t.status==='placeholder',footer:t.status==='placeholder'?'這裡尚未放入真實評價；等客人的分享資料補齊。':'客人的分享，依提供的原文與出處呈現。'});},
 creature(id){const c=CREATURES[id];if(!c)return;open({title:c.title,region:'島上的居民',subtitle:c.subtitle,logo:null,sections:[{title:'介紹',text:c.text}],actions:[],placeholder:c.text==='TODO',footer:'介紹文字等熊爸提供後放入。'});},
 reset(){const card=$('#card');card.classList.remove('story-card');const linkHeading=$('#story-links-heading');if(linkHeading)linkHeading.hidden=true;const logo=$('#story-logo');if(logo)logo.hidden=true;card.querySelector('.placeholder-note').hidden=false;card.querySelector('.placeholder-note').textContent='內容準備中・先逛逛小島';}
 };
}
