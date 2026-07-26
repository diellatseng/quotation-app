import{n as e}from"./rolldown-runtime-Bh1tDfsg.js";import{ut as t}from"./base-ui-A_RRZERW.js";import{S as n,x as r}from"./index-FmZLPcRG.js";var i=n(`printer`,[[`path`,{d:`M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2`,key:`143wyd`}],[`path`,{d:`M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6`,key:`1itne7`}],[`rect`,{x:`6`,y:`14`,width:`12`,height:`8`,rx:`1`,key:`1ue0tg`}]]),a=e(t()),o=`https://quotation-app-xtbb.onrender.com`;function s(){let[e,t]=(0,a.useState)(!1);return{exporting:e,exportPDF:async(e,{filename:n=`報價單`,onSuccess:i,styleMatchers:a=[`a4-`,`desc-block`,`diff-badge`]}={})=>{t(!0);try{let t=e?.current?.cloneNode(!0);if(!t){r.error(`找不到預覽內容，無法匯出 PDF`,{duration:6e3});return}t.querySelectorAll(`.a4-page-break`).forEach(e=>e.remove());let s=t.querySelectorAll(`[data-page]`);if(!s?.length){r.error(`預覽尚未完成排版，請稍候再試`,{duration:6e3});return}let c=Array.from(s).map(e=>e.outerHTML).join(`
`),l=``;try{for(let e of Array.from(document.styleSheets))try{let t=Array.from(e.cssRules||[]);for(let e of t){let t=e.cssText||``;a.some(e=>t.includes(e))&&(l+=t+`
`)}}catch{}}catch(e){console.warn(`[useExportPDF] Could not extract stylesheets:`,e)}let u=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    /* ── Reset ── */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; }
    body {
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: "Noto Sans TC", "Microsoft JhengHei", "Microsoft YaHei", sans-serif;
    }
    /* ── Extracted A4Preview styles ── */
    ${l}
    /* ── PDF pagination (export-only; does not change preview CSS) ── */
    @page { size: 794px 1123px; margin: 0; }
    .a4-page-break { display: none !important; }
    .a4-page {
      width: 794px;
      height: 1123px;
      max-height: 1123px;
      box-sizing: border-box;
      page-break-inside: avoid;
      break-inside: avoid-page;
    }
    .inv-page {
      width: 794px;
      height: 1123px;
      max-height: 1123px;
      box-sizing: border-box;
      page-break-inside: avoid;
      break-inside: avoid-page;
    }
    .ct-page {
      width: 794px;
      height: 1123px;
      max-height: 1123px;
      box-sizing: border-box;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid-page;
    }
    [data-page] {
      display: block;
      break-after: page;
      page-break-after: always;
    }
    [data-page]:last-of-type {
      break-after: avoid;
      page-break-after: avoid;
    }
  </style>
</head>
<body>
${c}
</body>
</html>`,d=await fetch(`${o}/api/export-pdf`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({html:u,filename:`${n}.pdf`})});if(!d.ok){let e=await d.json().catch(()=>({}));throw Error(e.error||`Server error ${d.status}`)}let f=await d.blob(),p=URL.createObjectURL(f),m=document.createElement(`a`);m.href=p,m.download=`${n}.pdf`,m.style.display=`none`,document.body.appendChild(m),m.click(),document.body.removeChild(m),URL.revokeObjectURL(p),i&&await i()}catch(e){console.error(`[useExportPDF]`,e),r.error(`PDF 匯出失敗：${e.message}`,{duration:6e3})}finally{t(!1)}}}}export{i as n,s as t};