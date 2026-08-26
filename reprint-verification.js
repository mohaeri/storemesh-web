export function verifiedReprintScan(scannedValue, expectedIdentity) {
  const scanned = String(scannedValue ?? '').trim();
  if (!scanned) throw new Error('ابتدا لیبل موجود را با اسکنر بخوانید');
  if (scanned !== String(expectedIdentity ?? '')) throw new Error('کد اسکن‌شده با لیبل مورد انتظار مطابقت ندارد');
  return scanned;
}

export async function submitVerifiedReprint({jobId,scannedValue,expectedIdentity,sessionId,reason,send}) {
  const verifiedScan=verifiedReprintScan(scannedValue,expectedIdentity);
  const retryReason=String(reason??'').trim();
  if(!retryReason)throw new Error('علت چاپ مجدد را وارد کنید');
  return send(`/api/print-jobs/${jobId}/retry`,{method:'POST',body:JSON.stringify({verifiedScan,sessionId,reason:retryReason})});
}
