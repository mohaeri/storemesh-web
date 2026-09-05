const pdfEscape=value=>String(value).replace(/([\\()])/g,'\\$1');

export function buildContainerLabelPdf(container,qrFactory=globalThis.qrcode){
  if(typeof qrFactory!=='function')throw Error('مولد QR آفلاین در دسترس نیست');
  const qr=qrFactory(0,'M');qr.addData(container.code);qr.make();
  const count=qr.getModuleCount(),cell=Math.floor(240/count),size=cell*count,x0=180,y0=430;
  const commands=['0 0 0 rg'];
  for(let row=0;row<count;row++)for(let col=0;col<count;col++)if(qr.isDark(row,col))commands.push(`${x0+col*cell} ${y0+(count-row-1)*cell} ${cell} ${cell} re f`);
  commands.push(`BT /F1 22 Tf 210 370 Td (${pdfEscape(container.code)}) Tj ET`,`BT /F1 14 Tf 210 340 Td (Type: ${pdfEscape(container.type)}) Tj ET`);
  const stream=commands.join('\n'),objects=[
    '<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>'
  ];
  let pdf='%PDF-1.4\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(pdf.length);pdf+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`}const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer << /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function downloadContainerLabelPdf(container){const bytes=buildContainerLabelPdf(container),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=`${container.code}-label.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
