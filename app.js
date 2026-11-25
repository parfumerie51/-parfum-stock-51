let items = JSON.parse(localStorage.getItem('p51_items') || 'null') || INITIAL_CATALOGUE.map(x=>({...x}));
let history = JSON.parse(localStorage.getItem('p51_history') || '[]');
let editingCode=null, movingCode=null, movingType='in', currentView='stock';
const $=id=>document.getElementById(id);
function persist(){localStorage.setItem('p51_items',JSON.stringify(items));localStorage.setItem('p51_history',JSON.stringify(history));}
function toast(s){$('toast').textContent=s;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',2200)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function low(x){return x.threshold!==null&&x.threshold!==''&&Number(x.quantity)<=Number(x.threshold)}
function render(){
 $('total').textContent=items.length;$('stock').textContent=items.reduce((a,x)=>a+Number(x.quantity||0),0).toLocaleString('fr-FR')+' ml';$('lowCount').textContent=items.filter(low).length;
 let q=$('search').value.trim().toLowerCase(),cat=$('category').value,sort=$('sort').value;
 let arr=items.filter(x=>(cat==='الكل'||x.category===cat)&&(!q||x.code.toLowerCase().includes(q)||x.name.toLowerCase().includes(q)));
 arr.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):sort==='quantity'?b.quantity-a.quantity:a.code.localeCompare(b.code));
 $('items').innerHTML=arr.map(card).join('')||'<div class="empty">ما لقيت حتى مرجع</div>';
 $('history').innerHTML=history.slice().reverse().map(h=>`<div class="item"><div><h3>${esc(h.name)} <span class="meta">(${esc(h.code)})</span></h3><div class="meta">${esc(h.date)} — ${h.type==='in'?'دخول مخزون':'خروج مخزون'} ${h.note?' — '+esc(h.note):''}</div></div><div class="qty">${h.type==='in'?'+':'−'}${h.amount} ml</div></div>`).join('')||'<div class="empty">مازال ما تسجلات حتى عملية</div>';
 $('alerts').innerHTML=items.filter(low).map(card).join('')||'<div class="empty">ما كاين حتى تنبيه حالياً</div>';
}
function card(x){return `<article class="item"><div><h3>${esc(x.name)}</h3><div class="meta">${esc(x.code)} · ${esc(x.category)}${x.threshold!==null&&x.threshold!==''?' · حد التنبيه '+x.threshold+' ml':''}</div><div class="actions"><button class="btn" onclick="move('${x.code}','in')">＋ دخول</button><button class="btn" onclick="move('${x.code}','out')">− خروج</button><button class="btn" onclick="edit('${x.code}')">تعديل</button><button class="btn" onclick="removeItem('${x.code}')">حذف</button></div></div><div class="qty ${low(x)?'low':''}">${Number(x.quantity||0).toLocaleString('fr-FR')}<small class="meta"> ml</small></div></article>`}
function edit(code){let x=items.find(i=>i.code===code);editingCode=code||null;$('dialogTitle').textContent=x?'تعديل المرجع':'إضافة مرجع جديد';$('fCode').value=x?.code||'';$('fCode').disabled=!!x;$('fName').value=x?.name||'';$('fCategory').value=x?.category||'Homme';$('fQty').value=x?.quantity??0;$('fThreshold').value=x?.threshold??'';$('editDialog').showModal()}
function saveItem(){let code=$('fCode').value.trim().toUpperCase(),name=$('fName').value.trim(),category=$('fCategory').value,quantity=Number($('fQty').value),threshold=$('fThreshold').value===''?null:Number($('fThreshold').value);if(!code||!name||!Number.isFinite(quantity)||quantity<0){toast('راجع المعلومات المدخلة');return}if(!editingCode&&items.some(x=>x.code===code)){toast('هاد الكود موجود من قبل');return}if(editingCode){let x=items.find(i=>i.code===editingCode);Object.assign(x,{name,category,quantity,threshold})}else items.push({code,name,category,quantity,threshold});persist();$('editDialog').close();render();toast('تسجل المرجع')}
function removeItem(code){let x=items.find(i=>i.code===code);if(!confirm('واش متأكد بغيتي تحذف '+x.name+'؟'))return;items=items.filter(i=>i.code!==code);persist();render();toast('تم حذف المرجع')}
function move(code,type){movingCode=code;movingType=type;let x=items.find(i=>i.code===code);$('moveTitle').textContent=(type==='in'?'دخول مخزون: ':'خروج مخزون: ')+x.name;$('moveQty').value='';$('moveNote').value='';$('moveDialog').showModal()}
function confirmMove(){let amount=Number($('moveQty').value),x=items.find(i=>i.code===movingCode);if(!amount||amount<=0){toast('دخل كمية صحيحة');return}if(movingType==='out'&&amount>Number(x.quantity)){toast('الكمية غير كافية فالمخزون');return}x.quantity=Number((Number(x.quantity)+(movingType==='in'?amount:-amount)).toFixed(2));history.push({code:x.code,name:x.name,type:movingType,amount,date:new Date().toLocaleString('fr-MA'),note:$('moveNote').value.trim()});persist();$('moveDialog').close();render();toast('تسجلات العملية بنجاح')}
function switchView(v){currentView=v;document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('stockView').hidden=v!=='stock';$('historyView').hidden=v!=='history';$('alertsView').hidden=v!=='alerts';render()}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.view)));
$('search').addEventListener('input',render);$('category').addEventListener('change',render);$('sort').addEventListener('change',render);
$('addBtn').addEventListener('click',()=>edit(null));$('saveItem').addEventListener('click',saveItem);$('confirmMove').addEventListener('click',confirmMove);
function exportBackup(){
 const backup={items,history,exported:new Date().toISOString(),app:'Parfum Stock - Parfumerie 51'};
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='Parfumerie51-backup.json';document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 toast('وجدنا النسخة الاحتياطية، قلب عليها فالتنزيلات');
}
function importBackup(file){
 if(!file)return;
 const r=new FileReader();
 r.onload=()=>{try{
  const d=JSON.parse(r.result);
  if(!Array.isArray(d.items)||!Array.isArray(d.history))throw new Error('invalid backup');
  if(!confirm('استرجاع النسخة غادي يعوض البيانات الحالية. واش متأكد؟'))return;
  items=d.items;history=d.history;persist();render();toast('ترجعات النسخة بنجاح');
 }catch(e){toast('ملف النسخة غير صالح')}};
 r.readAsText(file);
}
$('exportBtn').addEventListener('click',exportBackup);
$('importBtn').addEventListener('click',()=>$('backupFile').click());
$('backupFile').addEventListener('change',e=>{importBackup(e.target.files[0]);e.target.value=''});
// Keep the old header shortcut available for compatibility.
document.querySelector('.brand').addEventListener('click',()=>{let choice=prompt('1 = تصدير نسخة احتياطية\n2 = استرجاع نسخة احتياطية');if(choice==='1')exportBackup();else if(choice==='2')$('backupFile').click()});
render();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
