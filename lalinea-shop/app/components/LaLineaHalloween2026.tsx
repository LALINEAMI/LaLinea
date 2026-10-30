"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// LALINEA_HALLOWEEN — cambia true in false per spegnere tutte le decorazioni.
const LALINEA_HALLOWEEN_ENABLED = true;
const START_AT = Date.parse("2026-10-26T00:00:00+01:00");
const END_AT = Date.parse("2026-11-02T00:00:00+01:00");
const ATLAS_URL = "/lalinea-halloween-2026/adesivi.png?v=e70e6b44fa39";
const ATLAS_WIDTH = 1254;
const ATLAS_HEIGHT = 1254;
const STICKERS: {name:string;x:number;y:number;w:number;h:number}[] = [{"name":"zucca","x":12,"y":39,"w":300,"h":289},{"name":"gatto","x":349,"y":40,"w":262,"h":289},{"name":"fantasma","x":641,"y":42,"w":272,"h":284},{"name":"castello","x":976,"y":13,"w":270,"h":316},{"name":"calderone","x":25,"y":333,"w":269,"h":283},{"name":"mummia","x":353,"y":347,"w":243,"h":272},{"name":"pirata","x":632,"y":348,"w":305,"h":273},{"name":"pipistrelli","x":962,"y":366,"w":281,"h":245},{"name":"frankenstein","x":34,"y":633,"w":259,"h":278},{"name":"zombie","x":334,"y":620,"w":291,"h":314},{"name":"scheletro","x":656,"y":633,"w":264,"h":303},{"name":"caramelle","x":972,"y":634,"w":259,"h":282},{"name":"ragnatela","x":21,"y":925,"w":291,"h":299},{"name":"sfera","x":367,"y":945,"w":234,"h":278},{"name":"cappello","x":642,"y":951,"w":305,"h":265},{"name":"cestino","x":980,"y":930,"w":273,"h":288}];
const ORDER = [9, 0, 2, 8, 4, 7, 10, 1, 13, 11, 5, 15, 3, 12, 14, 6];
const CSS = "/* LALINEA_HALLOWEEN — stili limitati esclusivamente agli adesivi. */\n#ll-hw26-root{position:fixed!important;inset:0!important;z-index:40!important;overflow:hidden!important;pointer-events:none!important;user-select:none!important;isolation:isolate;contain:layout style;}\n#ll-hw26-root,#ll-hw26-root *{box-sizing:border-box!important;pointer-events:none!important;}\n#ll-hw26-root .ll-hw26-item{position:absolute;display:flex;align-items:center;justify-content:center;margin:0;padding:0;filter:drop-shadow(0 2px 3px #0007);}\n#ll-hw26-root .ll-hw26-sprite{display:block;flex:none;background-repeat:no-repeat;}\n@media print{#ll-hw26-root{display:none!important;}}\n";
const EXCLUDE = 'header,nav,footer,form,button,a,dialog,[role="dialog"],[aria-modal="true"],[inert],[aria-hidden="true"],#ll-carrello,[data-halloween-exclude]';
type Box = {left:number;top:number;right:number;bottom:number};
type Decoration = {key:string;x:number;y:number;size:number;sticker:number};
const intersects = (a:Box,b:Box,gap=3) => a.left < b.right+gap && a.right+gap > b.left && a.top < b.bottom+gap && a.bottom+gap > b.top;

export default function LaLineaHalloween2026() {
  const [active,setActive] = useState(false);
  const [decorations,setDecorations] = useState<Decoration[]>([]);

  useEffect(() => {
    if (!LALINEA_HALLOWEEN_ENABLED) return;
    let timer:ReturnType<typeof setTimeout>|undefined;
    const sync = () => {
      if (timer !== undefined) clearTimeout(timer);
      const now = Date.now();
      setActive(now >= START_AT && now < END_AT);
      const next = now < START_AT ? START_AT : END_AT;
      if (next > now) timer = setTimeout(sync,Math.min(next-now,2147483647));
    };
    sync();
    document.addEventListener("visibilitychange",sync);
    window.addEventListener("pageshow",sync);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener("visibilitychange",sync);
      window.removeEventListener("pageshow",sync);
    };
  },[]);

  useEffect(() => {
    if (!active || !LALINEA_HALLOWEEN_ENABLED) return;
    let pending=0;
    let stopped=false;
    const root=document.getElementById("ll-hw26-root");
    const visible=(r:DOMRect) => r.width>0 && r.height>0 && r.bottom>0 && r.top<window.innerHeight && r.right>0 && r.left<window.innerWidth;
    const measure=() => {
      pending=0;
      if (stopped) return;
      const compact=window.innerWidth<=640;
      const size=compact?36:48;
      const limit=compact?16:24;
      const obstacles:Box[]=[];
      // Lettura del contenuto: i disegni occupano solo spazi liberi.
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let node:Node|null;
      while ((node=walker.nextNode())) {
        if (!node.textContent?.trim()) continue;
        const parent=node.parentElement;
        if (!parent || root?.contains(parent) || parent.closest('script,style,noscript,[hidden],[inert]')) continue;
        const range=document.createRange();
        range.selectNodeContents(node);
        for (const r of Array.from(range.getClientRects())) if (visible(r)) obstacles.push(r);
      }
      document.querySelectorAll<HTMLElement>('button,a,input,select,textarea,video,img,iframe,canvas,header,nav,footer,form,dialog,[role="button"],[role="dialog"],[data-halloween-protect]').forEach(element => {
        if (root?.contains(element)) return;
        const r=element.getBoundingClientRect();
        if (visible(r)) obstacles.push(r);
      });
      const result:Decoration[]=[];
      const perContainer=new Map<Element,number>();
      const headings=document.querySelectorAll<HTMLElement>('h1,h2,h3,h4,[role="heading"],p[class*="tracking-"]');
      headings.forEach((heading,index) => {
        if (result.length>=limit || heading.closest(EXCLUDE)) return;
        if (/carrell|checkout|accedi|login|password|pagament|riepilog|totale|conferma ordine/i.test(heading.textContent||"")) return;
        const box=heading.getBoundingClientRect();
        if (!visible(box) || getComputedStyle(heading).visibility!=="visible") return;
        const range=document.createRange();
        range.selectNodeContents(heading);
        const text=range.getBoundingClientRect();
        if (!visible(text)) return;
        const container=heading.closest('article,section,[data-halloween-section],div[class*="rounded-3xl"],div[class*="rounded-2xl"]')||heading.parentElement;
        if (!container || container.closest(EXCLUDE)) return;
        const count=perContainer.get(container)||0;
        if (count >= (compact?6:8)) return;
        const card=container.getBoundingClientRect();
        const left=Math.max(card.left+8,12);
        const right=Math.min(card.right-8,window.innerWidth-12);
        const candidates:[number,number][]=[];
        // Piccoli gruppi vicini al titolo, poi gli angoli liberi del riquadro.
        for (let i=0;i<3;i++) candidates.push([text.right+10+i*(size+7),text.top+(Math.min(text.height,size)-size)/2]);
        candidates.push([right-size,card.top+8],[right-size*2-7,card.top+8]);
        candidates.push([right-size,box.bottom+8],[left,box.top-size-8]);
        candidates.push([right-size,box.top+size+14],[right-size,box.top+size*2+24]);
        candidates.push([right-size,card.bottom-size-8],[left,card.bottom-size-8]);
        let placed=0;
        for (const [rawX,rawY] of candidates) {
          if (placed >= (compact?3:4) || count+placed >= (compact?6:8) || result.length>=limit) break;
          const x=Math.round(rawX), y=Math.round(rawY);
          const area={left:x,top:y,right:x+size,bottom:y+size};
          if (x<left || x+size>right || y<Math.max(card.top+3,4) || y+size>Math.min(card.bottom-3,window.innerHeight-4)) continue;
          if (obstacles.some(r=>intersects(area,r))) continue;
          if (result.some(d=>intersects(area,{left:d.x,top:d.y,right:d.x+d.size,bottom:d.y+d.size},7))) continue;
          const hit=document.elementFromPoint(x+size/2,y+size/2);
          if (hit?.closest(EXCLUDE)) continue;
          result.push({key:`${index}-${placed}`,x,y,size,sticker:ORDER[result.length%ORDER.length]});
          placed++;
        }
        perContainer.set(container,count+placed);
      });
      setDecorations(previous=>JSON.stringify(previous)===JSON.stringify(result)?previous:result);
    };
    const schedule=() => {
      if (!stopped && !pending) pending=requestAnimationFrame(measure);
    };
    const observer=new MutationObserver(records=>{
      const outside=records.some(record=>{
        if (root && (record.target===root || root.contains(record.target))) return false;
        if (record.type==="childList") {
          const nodes=[...Array.from(record.addedNodes),...Array.from(record.removedNodes)];
          if (nodes.length && nodes.every(n=>n===root || !!root?.contains(n))) return false;
        }
        return true;
      });
      if (outside) schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:["class","style","hidden","aria-hidden"]});
    const resize=typeof ResizeObserver!=="undefined"?new ResizeObserver(schedule):null;
    resize?.observe(document.body);
    schedule();
    window.addEventListener("scroll",schedule,{capture:true,passive:true});
    window.addEventListener("resize",schedule);
    window.addEventListener("pageshow",schedule);
    document.fonts?.addEventListener("loadingdone",schedule);
    return ()=>{
      stopped=true;
      if (pending) cancelAnimationFrame(pending);
      observer.disconnect();
      resize?.disconnect();
      window.removeEventListener("scroll",schedule,true);
      window.removeEventListener("resize",schedule);
      window.removeEventListener("pageshow",schedule);
      document.fonts?.removeEventListener("loadingdone",schedule);
    };
  },[active]);

  if (!active || !LALINEA_HALLOWEEN_ENABLED) return null;
  return createPortal(<div id="ll-hw26-root" aria-hidden="true" style={{pointerEvents:"none"}}>
    <style>{CSS}</style>
    {decorations.map(d=>{
      const art=STICKERS[d.sticker];
      const longest=Math.max(art.w,art.h);
      return <span key={d.key} className="ll-hw26-item" data-lalinea-halloween={art.name} style={{left:d.x,top:d.y,width:d.size,height:d.size}}>
        <span className="ll-hw26-sprite" style={{width:`${art.w/longest*100}%`,height:`${art.h/longest*100}%`,backgroundImage:`url("${ATLAS_URL}")`,backgroundSize:`${ATLAS_WIDTH/art.w*100}% ${ATLAS_HEIGHT/art.h*100}%`,backgroundPosition:`${art.x/(ATLAS_WIDTH-art.w)*100}% ${art.y/(ATLAS_HEIGHT-art.h)*100}%`}}/>
      </span>;
    })}
  </div>,document.body);
}
