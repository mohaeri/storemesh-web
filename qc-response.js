export function prepareQcSubmission(checklist,answerEntries,result){
  const answers=new Map(answerEntries.map(({itemCode,value})=>[itemCode,String(value??'').trim().toUpperCase()]));
  const missing=(checklist.items||[]).filter(item=>item.required!==false&&!answers.get(item.code));
  if(missing.length)throw Error('پاسخ همه آیتم‌های الزامی باید صریحاً ثبت شود');
  const responses=(checklist.items||[]).filter(item=>answers.get(item.code)).map(item=>({itemCode:item.code,value:answers.get(item.code)}));
  const requiredFailure=(checklist.items||[]).some(item=>item.required!==false&&answers.get(item.code)==='FAIL');
  return{responses,warning:result==='APPROVED'&&requiredFailure?'نتیجه تأییدشده با پاسخ ناموفق الزامی سازگار نیست؛ سرور این ترکیب را رد خواهد کرد.':''};
}
