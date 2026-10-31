// AssetFlow · Vanilla JavaScript application
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='assetflow-v2-data', USERKEY='assetflow-v2-users', SESSION='assetflow-v2-session';
const DEPTS=['Development','Testing / QA','Human Resources','Finance','Marketing','IT Administration','Management','Operations'];
const CATS=['Laptop','Desktop','Workstation','Monitor','Projector','Keyboard','Mouse','Headset','Webcam','Docking Station','Smartphone','Tablet','Router','Switch','Access Point','Server','Storage Device','Printer','Other Accessories'];
const ASSET_STATUS=['Available','Assigned','Under Maintenance','Damaged','Retired','Lost'];
const ICONS={
'layout-dashboard':'<rect x="3" y="3" width="7" height="8" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/>',
'users':'<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
'package':'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/>',
'clipboard-check':'<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M9 5V3h6v2M8 13l2.5 2.5L16 10"/>',
'tags':'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
'inbox':'<path d="M4 4h16l2 11h-6l-2 3h-4l-2-3H2L4 4Z"/><path d="M2 15h6l2 3h4l2-3h6"/>',
'package-check':'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8M12 13v9"/><path d="m9 16 2 2 4-4"/>',
'wrench':'<path d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18l3 3 5.3-5.3a5 5 0 0 0 6.4-6.4L14 13l-3-3 3.7-3.7Z"/>',
'building-2':'<path d="M3 21h18M5 21V5l7-3 7 3v16M9 9h1M14 9h1M9 13h1M14 13h1M10 21v-4h4v4"/>',
'chart':'<path d="M3 3v18h18M7 14l4-4 4 3 5-7"/>',
'history':'<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
'settings':'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-1.7 2.9l-.2-.1a1.7 1.7 0 0 0-1.8.7l-.1.2a1.7 1.7 0 0 1-3.3-.7v-.2a1.7 1.7 0 0 0-1.3-1.6l-.2-.1a1.7 1.7 0 0 1-.7-3.3l.2-.1a1.7 1.7 0 0 0 .7-1.8l-.1-.2a1.7 1.7 0 0 1 2.9-1.7l.1.1a1.7 1.7 0 0 0 1.9 0l.1-.1a1.7 1.7 0 0 1 2.9 1.7l-.1.2a1.7 1.7 0 0 0 .7 1.8l.2.1a1.7 1.7 0 0 1-.7 3.3l-.2.1"/>',
'search':'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>','bell':'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
'eye':'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>','edit':'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
'trash':'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 5v5m4-5v5"/>','plus':'<path d="M12 5v14M5 12h14"/>','arrow-right':'<path d="M5 12h14m-7-7 7 7-7 7"/>','arrow-left':'<path d="m15 18-6-6 6-6M20 12H9"/>','x':'<path d="m18 6-12 12M6 6l12 12"/>','menu':'<path d="M4 6h16M4 12h16M4 18h16"/>','chevron-down':'<path d="m6 9 6 6 6-6"/>','log-out':'<path d="M10 17l5-5-5-5M15 12H4M12 4h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3h-5"/>','info':'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>','monitor':'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>','laptop':'<rect x="5" y="4" width="14" height="11" rx="1"/><path d="M2 19h20l-2 2H4l-2-2Z"/>','headphones':'<path d="M3 13v-2a9 9 0 0 1 18 0v2M3 13h4v7H5a2 2 0 0 1-2-2v-5Zm18 0h-4v7h2a2 2 0 0 0 2-2v-5Z"/>','box':'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="M3 8v9l9 5 9-5V8"/>',
'refresh':'<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>',
'maximize-2':'<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>'
};
function ic(name,cls=''){return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||ICONS.box}</svg>`}
const NAV=[['OVERVIEW',[['Dashboard','layout-dashboard']]],['ASSET MANAGEMENT',[['Employees','users'],['All Assets','package'],['Asset Assignments','clipboard-check'],['Asset Categories','tags']]],['OPERATIONS',[['Asset Requests','inbox'],['Asset Returns','package-check'],['Maintenance','wrench'],['Departments','building-2']]],['INSIGHTS',[['Reports & Analytics','chart'],['Audit Logs','history']]],['SYSTEM',[['Settings','wrench']]]];
const EMP_NAMES=['Aarav Sharma','Vihaan Reddy','Aditya Patel','Sai Kumar','Ishaan Rao','Reyansh Gupta','Arjun Verma','Krishna Singh','Ananya Nair','Diya Iyer','Aadhya Das','Ira Joshi','Saanvi Mishra','Meera Naidu','Riya Kapoor','Kavya Rao','Rahul Nair','Rohan Das','Karthik Reddy','Nikhil Sharma','Pooja Patel','Sneha Kumar','Varun Gupta','Neha Verma','Manish Singh'];
function seed(){let employees=EMP_NAMES.map((name,i)=>({id:`EMP-${1001+i}`,organization:['C1','C2','C3'][i%3],name,email:name.toLowerCase().replace(/\s+/g,'.')+'@gmail.com',phone:`+91 98${String(10000000+i*137).slice(0,8)}`,department:DEPTS[i%5],designation:['Software Engineer','QA Analyst','Product Designer','HR Executive','Systems Administrator'][i%5],joined:`202${i%5}-0${i%9+1}-12`,status:i===22?'On Leave':'Active',location:['Hyderabad','Bengaluru','Vijayawada'][i%3]}));
let assets=Array.from({length:100},(_,i)=>{let cat=CATS[i%12],emp=i<67&&i%9!==0?employees[(i*3)%25]:null,status=i%29===0?'Under Maintenance':i%37===0?'Damaged':emp?'Assigned':'Available';return{id:`AST-${String(i+1).padStart(4,'0')}`,name:`${cat} ${['Pro','Standard','Business'][i%3]}`,category:cat,brand:['Dell','HP','Lenovo','Logitech','Samsung','Apple'][i%6],model:['ThinkPad E14','Latitude 5440','ProBook 440','Business Edition'][i%4],serial:`NS-${(100000+i*173).toString(16).toUpperCase()}`,purchaseDate:`202${i%5}-0${i%9+1}-08`,price:[42000,68000,12000,8500,2200][i%5],vendor:['Dell India','HP Store','TechData','Ingram Micro'][i%4],warranty:`202${(i%5)+2}-12-31`,location:emp?.location||'Hyderabad',condition:i%23===0?'Fair':'Good',status,employeeId:status==='Assigned'?emp.id:'',employeeName:status==='Assigned'?emp.name:''}});
let assignments=assets.filter(a=>a.status==='Assigned').map((a,i)=>({id:`ASN-${String(i+1).padStart(4,'0')}`,assetId:a.id,assetName:a.name,employeeId:a.employeeId,employeeName:a.employeeName,department:employees.find(e=>e.id===a.employeeId)?.department||'',date:`2026-0${i%9+1}-0${i%8+1}`,expected:'',status:'Active'}));
return{companies:[{id:'C1',name:'C1',logo:''},{id:'C2',name:'C2',logo:''},{id:'C3',name:'C3',logo:''}],employees,assets:assets.map((a,i)=>({...a,organization:employees.find(e=>e.id===a.employeeId)?.organization||['C1','C2','C3'][i%3]})),assignments,requests:[{id:'REQ-0001',employeeId:'EMP-1005',employeeName:employees[4].name,asset:'Monitor',reason:'Additional display for development setup',date:'2026-10-28',priority:'High',status:'Pending'},{id:'REQ-0002',employeeId:'EMP-1009',employeeName:employees[8].name,asset:'Headset',reason:'Replacement for faulty headset',date:'2026-10-26',priority:'Normal',status:'Approved'}],returns:[],maintenance:[{id:'MNT-0001',assetId:'AST-0030',issue:'Intermittent display flicker',reported:'2026-10-22',provider:'Dell Service',cost:1800,status:'In Progress'}],logs:[{action:'workspace workspace initialized',assetId:'—',employeeId:'—',time:new Date().toISOString(),description:'100 sample assets and 25 employees loaded'}],settings:{org:'ZylloTech Asset Management',prefix:'AST',currency:'INR'}}}
let data;try{data=JSON.parse(localStorage.getItem(KEY))||seed()}catch{data=seed()}
data.settings=data.settings||{};data.settings.org='ZylloTech Asset Management';localStorage.setItem(KEY,JSON.stringify(data));
if(Array.isArray(data.employees)){data.employees.forEach(e=>{if(e.email&&/@northstar\.io$/i.test(e.email))e.email=e.email.replace(/@northstar\.io$/i,'@gmail.com')});localStorage.setItem(KEY,JSON.stringify(data))}
data.companies=data.companies||[{id:'C1',name:'C1',logo:''},{id:'C2',name:'C2',logo:''},{id:'C3',name:'C3',logo:''}];data.companies=data.companies.slice(0,3);['C1','C2','C3'].forEach((id,i)=>{if(!data.companies.some(c=>c.id===id))data.companies.push({id,name:id,logo:''})});data.companies.forEach(c=>{if(!c.name)c.name=c.id;if(!('logo'in c))c.logo='' });data.employees.forEach((e,i)=>{if(!e.organization)e.organization=['C1','C2','C3'][i%3]});data.assets.forEach((a,i)=>{if(!a.organization){let e=data.employees.find(x=>x.id===a.employeeId);a.organization=e?.organization||['C1','C2','C3'][i%3]}});localStorage.setItem(KEY,JSON.stringify(data));
let organizationFilter='All organizations';
let currentPage='Dashboard',searchText='',statusFilter='All statuses',selected=null,backPage='Dashboard',authMode='login',toastTimer;
const PAGE_ROUTES={
  'Dashboard':'dashboard',
  'Employees':'employees',
  'All Assets':'all-assets',
  'Asset Assignments':'assignments',
  'Asset Categories':'categories',
  'Asset Requests':'requests',
  'Asset Returns':'returns',
  'Maintenance':'maintenance',
  'Departments':'departments',
  'Reports & Analytics':'reports',
  'Audit Logs':'audit-logs',
  'Settings':'settings',
  'My Profile':'profile'
};
const ROUTE_PAGES={
  'dashboard':'Dashboard',
  'employees':'Employees',
  'all-assets':'All Assets',
  'assets':'All Assets',
  'assignments':'Asset Assignments',
  'categories':'Asset Categories',
  'requests':'Asset Requests',
  'returns':'Asset Returns',
  'maintenance':'Maintenance',
  'departments':'Departments',
  'reports':'Reports & Analytics',
  'audit-logs':'Audit Logs',
  'settings':'Settings',
  'profile':'My Profile'
};

function saveNavigationState(){
  try{
    sessionStorage.setItem('assetflow-active-page',currentPage);
    if(selected&&selected.record){
      sessionStorage.setItem('assetflow-active-detail',JSON.stringify({kind:selected.kind,id:selected.record.id}));
    }else{
      sessionStorage.removeItem('assetflow-active-detail');
    }
  }catch(e){}
}

function restoreNavigationFromUrl(){
  const hash=(window.location.hash||'').replace(/^#\/?/,'').trim();
  if(hash){
    const parts=hash.split('/');
    if(parts.length===2&&(parts[0]==='asset'||parts[0]==='employee')){
      const kind=parts[0],id=decodeURIComponent(parts[1]);
      const list=kind==='employee'?data?.employees:data?.assets;
      const rec=Array.isArray(list)?list.find(x=>x.id===id):null;
      if(rec){
        selected={kind,record:rec};
        currentPage=kind==='employee'?'Employees':'All Assets';
        backPage=currentPage;
        saveNavigationState();
        return;
      }
    }
    const pageName=ROUTE_PAGES[hash.toLowerCase()];
    if(pageName){
      currentPage=pageName;
      selected=null;
      saveNavigationState();
      return;
    }
  }
  try{
    const saved=sessionStorage.getItem('assetflow-active-page');
    if(saved&&(PAGE_ROUTES[saved]||saved==='My Profile')){
      currentPage=saved;
    }
    const savedDetail=sessionStorage.getItem('assetflow-active-detail');
    if(savedDetail){
      const {kind,id}=JSON.parse(savedDetail);
      const list=kind==='employee'?data?.employees:data?.assets;
      const rec=Array.isArray(list)?list.find(x=>x.id===id):null;
      if(rec){
        selected={kind,record:rec};
        backPage=currentPage;
      }
    }
  }catch(e){}
}

function openPhotoLightbox(url,title='Asset photo'){
  if(!url)return;
  let box=$('#photoLightbox');
  if(!box){
    box=document.createElement('div');
    box.id='photoLightbox';
    box.className='photo-lightbox-backdrop';
    box.innerHTML=`<div class="photo-lightbox-card" role="dialog" aria-modal="true" aria-labelledby="photoLightboxTitle">
      <header class="photo-lightbox-head">
        <h3 id="photoLightboxTitle"></h3>
        <button type="button" class="photo-lightbox-close" id="photoLightboxClose" aria-label="Close photo preview">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>
      <div class="photo-lightbox-body">
        <img id="photoLightboxImg" src="" alt="Expanded asset photo">
      </div>
    </div>`;
    document.body.appendChild(box);
    box.onclick=e=>{if(e.target===box)closePhotoLightbox()};
    box.querySelector('#photoLightboxClose').onclick=closePhotoLightbox;
  }
  box.querySelector('#photoLightboxTitle').textContent=title;
  box.querySelector('#photoLightboxImg').src=url;
  box.classList.add('active');
  document.body.style.overflow='hidden';
}
function closePhotoLightbox(){
  const box=$('#photoLightbox');
  if(box)box.classList.remove('active');
  document.body.style.overflow='';
}

function showPageLoader(title='Loading workspace records…',sub='Fetching latest devices, employees and statuses'){
  const root=$('#pageContent');
  if(root){
    root.innerHTML=`<div class="content-loader-wrap">
      <div class="content-loader-spinner"></div>
      <p class="content-loader-title">${esc(title)}</p>
      <span class="content-loader-sub">${esc(sub)}</span>
    </div>`;
  }
}

let isReloadingRightPane=false;
async function reloadRightPane(){
  if(isReloadingRightPane)return;
  isReloadingRightPane=true;
  const btn=$('#reloadBtn');
  if(btn)btn.classList.add('spinning');
  showPageLoader('Reloading workspace records…','Refreshing latest inventory and status updates');
  try{
    await syncWithBackend();
    restoreNavigationFromUrl();
    renderPage();
    toast('Workspace updated','Latest inventory and records loaded from database.');
  }catch(err){
    toast('Reload failed',err.message);
    renderPage();
  }finally{
    isReloadingRightPane=false;
    if(btn)btn.classList.remove('spinning');
  }
}

function showAppShellOnly(user){document.documentElement.classList.remove('has-session');
  const identity={...user,name:getDisplayName(user)};
  $('#authScreen').hidden=true;
  $('#appShell').hidden=false;
  const name=identity.name;
  $('#profileName').textContent=name;
  $('#profileInitials').textContent=initials(name);
  $('#topInitials').textContent=initials(name);
  $('#profileRole').textContent=getUserRole(identity);
  $('#topInitials').setAttribute('aria-label',`Open profile for ${name}`);
  $('#topDate').textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'});
  navRender();
  $('#crumbCurrent').textContent=selected?'Record details':currentPage;
}

function renderStaticIcons(){
  $$('[data-icon]').forEach(el=>{
    const name=el.dataset.icon;
    if(name&&ICONS[name]){
      el.outerHTML=ic(name,el.className);
    }
  });
}
const persist=()=>localStorage.setItem(KEY,JSON.stringify(data)),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toISOString().slice(0,10),initials=n=>String(n||'AD').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase(),money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const TOKEN_KEY='assetflow-jwt-token';
const getToken=()=>localStorage.getItem(TOKEN_KEY)||'';
async function api(path,options={}){
  const headers={...(options.headers||{})};
  const token=getToken();
  if(token)headers['Authorization']=`Bearer ${token}`;
  let body=options.body;
  if(body&&!(body instanceof FormData)&&typeof body==='object'){
    headers['Content-Type']='application/json';
    body=JSON.stringify(body);
  }
  const res=await fetch(path,{...options,headers,body});
  const json=await res.json().catch(()=>({}));
  if(!res.ok){
    if(res.status===401&&!path.includes('/login')&&!path.includes('/register')){
      localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(SESSION);
      $('#appShell').hidden=true;$('#authScreen').hidden=false;setAuthMode('login');
    }
    throw new Error(json.error||`Request failed (${res.status})`);
  }
  return json;
}
async function syncWithBackend(){
  try{
    const token=getToken();
    if(!token)return;
    const res=await api('/api/data');
    if(res&&res.data){
      Object.assign(data,res.data);
      if(Array.isArray(res.data.categories)){
        res.data.categories.forEach(c=>{let n=typeof c==='string'?c:c.name;if(n&&!CATS.includes(n))CATS.push(n)});
      }
      persist();
    }
  }catch(err){console.warn('Backend sync:',err.message);}
}
function toast(title,msg=''){let el=document.createElement('div');el.className='toast';el.innerHTML=`<b>✓</b><strong>${esc(title)}</strong> ${esc(msg)}`;$('#toastRegion').append(el);setTimeout(()=>el.remove(),3200)}
function log(action,assetId='—',employeeId='—',description=''){data.logs.unshift({action,assetId,employeeId,description,time:new Date().toISOString()})}
function statusTag(s){let cl=String(s||'').toLowerCase().replaceAll(' ','-').replaceAll('/','-');return `<span class="status ${cl}">${esc(s||'—')}</span>`}
function pageHeading(title,desc,actions=''){return `<div class="page-heading"><div><p class="eyebrow">ASSETFLOW WORKSPACE</p><h1>${esc(title)}</h1><p class="page-subtitle">${esc(desc)}</p></div><div class="heading-actions">${actions}</div></div>`}
function button(label,action,primary=true){return `<button class="btn ${primary?'btn-primary':''}" data-action="${action}">${label}</button>`}
function navRender(){let html='';NAV.forEach(([group,items])=>{html+=`<section class="nav-group"><div class="nav-group-head"><span>${group}</span></div><div class="nav-group-items">${items.map(([n,i])=>`<button class="nav-item ${currentPage===n?'active':''}" data-page="${n}">${ic(i,'nav-icon')}<span>${n}</span>${n==='Asset Requests'?`<small class="nav-count">${data.requests.filter(r=>r.status==='Pending').length}</small>`:''}</button>`).join('')}</div></section>`});$('#mainNav').innerHTML=html;$$('.nav-item').forEach(b=>b.onclick=()=>navigate(b.dataset.page))}
let tabLoadTimer=null;
function showTabLoader(name){const root=$('#pageContent');if(!root)return;root.innerHTML=`<div class="tab-loader" role="status" aria-live="polite"><div class="tl-top"><span class="tl-spin"></span><b>Loading ${esc(name)}…</b></div><div class="tl-bar tl-title"></div><div class="tl-bar tl-sub"></div><div class="tl-grid"><i></i><i></i><i></i><i></i></div><div class="tl-wide"></div><div class="tl-split"><i></i><i></i></div></div>`}
function navigate(p,updateHistory=true){const samePage=(p===currentPage&&!selected);currentPage=p;selected=null;searchText='';statusFilter='All statuses';saveNavigationState();if(updateHistory){const r=PAGE_ROUTES[p]||'dashboard';const targetHash=`#/${r}`;if(window.location.hash!==targetHash){try{history.pushState(null,'',targetHash)}catch(e){window.location.hash=targetHash}}}clearTimeout(tabLoadTimer);navRender();$('#crumbCurrent').textContent=p;toggleSidebar(false);closeNotices();window.scrollTo({top:0,behavior:'smooth'});if(samePage){renderPage();return}showTabLoader(p);tabLoadTimer=setTimeout(()=>{if(currentPage===p&&!selected)renderPage()},340)}
function renderNavAndPage(){navRender();renderPage()}
function renderPage(){let crumb=selected?'Record details':currentPage;$('#crumbCurrent').textContent=crumb;let root=$('#pageContent');if(selected){root.innerHTML=renderDetail();bindDetail();return}if(currentPage==='Dashboard')root.innerHTML=dashboard();else if(currentPage==='Employees')root.innerHTML=employeePage();else if(currentPage==='All Assets')root.innerHTML=assetPage();else if(currentPage==='Asset Assignments')root.innerHTML=assignmentPage();else if(currentPage==='Asset Returns')root.innerHTML=returnPage();else if(currentPage==='Asset Requests')root.innerHTML=requestPage();else if(currentPage==='Maintenance')root.innerHTML=maintenancePage();else if(currentPage==='Departments')root.innerHTML=departmentPage();else if(currentPage==='Asset Categories')root.innerHTML=categoryPage();else if(currentPage==='Reports & Analytics')root.innerHTML=reportPage();else if(currentPage==='Audit Logs')root.innerHTML=logPage();else if(currentPage==='Settings')root.innerHTML=settingsPage();else root.innerHTML=profilePage();bindPage();if(currentPage==='Dashboard'&&!selected)animateKpis()}
function table(headers,rows){return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(h=>`<th>${esc(h.toUpperCase())}</th>`).join('')}<th>ACTIONS</th></tr></thead><tbody>${rows.length?rows.map(r=>{let actionable=data.assets.some(a=>a.id===r.id)||data.employees.some(e=>e.id===r.id);return `<tr>${r.cells.map(c=>`<td>${c}</td>`).join('')}<td>${r.actionHtml|| (actionable?`<div class="row-actions"><button class="row-action" data-view="${r.id}" title="View details" aria-label="View details">${ic('eye')}</button><button class="row-action" data-edit-record="${r.id}" title="Edit record" aria-label="Edit record">${ic('edit')}</button></div>`:'<span class="sub-cell">—</span>')}</td></tr>`}).join(''):`<tr><td colspan="${headers.length+1}"><div class="empty-state">${ic('package')}<h3>No matching records</h3><p>Try another search or add a new record.</p></div></td></tr>`}</tbody></table></div>`}
function panelTable(title,desc,headers,rows,action=''){return `<section class="panel"><div class="panel-head"><div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>${action}</div>${table(headers,rows)}</section>`}
function companyAssetStats(companyId){let assets=data.assets.filter(a=>a.organization===companyId),employees=data.employees.filter(e=>e.organization===companyId);return{assets,employees,assigned:assets.filter(a=>a.status==='Assigned').length,available:assets.filter(a=>a.status==='Available').length,maintenance:assets.filter(a=>a.status==='Under Maintenance').length,damaged:assets.filter(a=>a.status==='Damaged').length}}
function companyGraph(company){let s=companyAssetStats(company.id),total=s.assets.length||1,assignedPct=s.assigned/total*100,availablePct=s.available/total*100,maintPct=s.maintenance/total*100,otherPct=Math.max(0,100-assignedPct-availablePct-maintPct),value=s.assets.reduce((v,a)=>v+Number(a.price||0),0);return `<section class="panel company-chart-card"><div class="company-chart-head"><div class="company-chart-brand ${company.logo?'has-logo':''}">${company.logo?`<img src="${company.logo}" alt="${esc(company.name)} logo">`:`<span>${esc(company.id)}</span>`}</div><div class="company-chart-title"><span class="eyebrow">${esc(company.id)} ORGANIZATION</span><h3>${esc(company.name)}</h3><p>${s.employees.length} employees · ${s.assets.length} registered assets</p></div><span class="company-chart-menu">${ic('chart-no-axes-combined')}</span></div><div class="company-chart-main"><div class="company-donut-wrap"><div class="company-donut" data-donut="true" data-assigned="${assignedPct}" data-available="${availablePct}" data-maintenance="${maintPct}" data-other="${otherPct}" style="--assigned:${assignedPct}%;--available:${assignedPct+availablePct}%;--maintenance:${assignedPct+availablePct+maintPct}%"><div class="company-donut-center"><b>${s.assets.length}</b><span>Total assets</span></div></div></div><div class="company-chart-legend-list"><button type="button" class="chart-legend-toggle active" data-chart-series="assigned" title="Show or hide assigned assets"><i class="legend-swatch assigned-fill"></i><span>Assigned assets</span><b>${s.assigned}</b></button><button type="button" class="chart-legend-toggle active" data-chart-series="available" title="Show or hide available assets"><i class="legend-swatch available-fill"></i><span>Available assets</span><b>${s.available}</b></button><button type="button" class="chart-legend-toggle active" data-chart-series="maintenance" title="Show or hide assets under maintenance"><i class="legend-swatch maintenance-fill"></i><span>Under maintenance</span><b>${s.maintenance}</b></button><button type="button" class="chart-legend-toggle active" data-chart-series="other" title="Show or hide other asset statuses"><i class="legend-swatch other-fill"></i><span>Other statuses</span><b>${s.damaged+Math.max(0,s.assets.length-s.assigned-s.available-s.maintenance-s.damaged)}</b></button></div></div><div class="company-chart-bottom"><div><span>Employees</span><b>${s.employees.length}</b></div><div><span>Inventory value</span><b>${money(value)}</b></div><div><span>Utilization</span><b>${Math.round(assignedPct)}%</b></div></div></section>`}

function healthCard(a,assigned,available,maint,damaged){const total=a.length||1,other=Math.max(0,a.length-assigned-available-maint-damaged),C=2*Math.PI*46;const segs=[['Assigned',assigned,'#0b78d6'],['Available',available,'#3dc7ff'],['Maintenance',maint,'#ff8a2a'],['Damaged',damaged,'#e5484d'],['Other',other,'#9fb8d8']];let off=0;const rings=segs.map(x=>{const len=x[1]/total*C,el=`<circle cx="60" cy="60" r="46" stroke="${x[2]}" stroke-dasharray="${len.toFixed(2)} ${(C-len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}"></circle>`;off+=len;return el}).join('');return `<div class="kpi-card kpi-health"><div class="kpi-top"><span class="kpi-label">Inventory health</span></div><div class="health-body"><div class="health-donut"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="46" class="health-track"></circle>${rings}</svg><div class="health-center"><b class="health-total">${a.length}</b><small>assets</small></div></div><ul class="health-legend">${segs.filter(x=>x[1]>0).map(x=>`<li><i style="background:${x[2]}"></i><span>${x[0]}</span><b>${Math.round(x[1]/total*100)}%</b></li>`).join('')}</ul></div></div>`}
function animateKpis(){if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.querySelectorAll('.kpi-value,.health-total,.banner-stats b').forEach(el=>{const target=parseInt(el.textContent.replace(/[^0-9]/g,''),10);if(isNaN(target)||target<=0)return;const t0=performance.now(),dur=900;const step=t=>{const p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(target*e);if(p<1)requestAnimationFrame(step);else el.textContent=target};el.textContent='0';requestAnimationFrame(step)})}
let dashTab=(()=>{try{return sessionStorage.getItem('assetflow-dash-tab')||'overview'}catch(e){return 'overview'}})();
function dashboard(){let a=data.assets,assigned=a.filter(x=>x.status==='Assigned').length,available=a.filter(x=>x.status==='Available').length,maint=a.filter(x=>x.status==='Under Maintenance').length,damaged=a.filter(x=>x.status==='Damaged').length,holding=new Set(a.filter(x=>x.status==='Assigned').map(x=>x.employeeId)).size,cats=CATS.slice(0,8),latest=data.assignments.slice(0,5);let companyStats=data.companies.map(c=>({company:c,...companyAssetStats(c.id)})),maxCompany=Math.max(1,...companyStats.map(x=>x.assets.length));
  const reqs=data.requests||[],retReqs=data.returnRequests||[],maints=data.maintenance||[];
  const pendingReq=reqs.filter(r=>r.status==='Pending').length;
  const pendingRet=retReqs.filter(q=>q.status==='Requested').length;
  const openMaint=maints.filter(m=>!/complete|closed|resolved|done/i.test(m.status||'')).length;
  const idleEmp=!a.length?0:data.employees.filter(e=>!a.some(x=>x.employeeId===e.id&&x.status==='Assigned')).length;
  const isEmpty=a.length===0;
  const hour=new Date().getHours(),greet=hour<12?'morning':hour<17?'afternoon':'evening';

  /* ---- reused chart/table sections ---- */
  const compOverview=`<section class="panel combined-company-panel"><div class="panel-head combined-chart-head"><div><span class="eyebrow">PORTFOLIO COMPARISON</span><h3>Company inventory overview</h3><p>Asset status distribution across all three organizations</p></div><span class="chart-period-pill">All companies · Live totals</span></div><div class="combined-chart-content"><div class="combined-chart-axis"><span>Organization</span><span>Asset count</span></div>${companyStats.map(x=>{let n=Math.max(1,x.assets.length);return `<div class="combined-chart-row"><div class="combined-chart-company"><span class="combined-company-avatar ${x.company.logo?'has-logo':''}">${x.company.logo?`<img src="${x.company.logo}" alt="${esc(x.company.name)} logo">`:esc(x.company.id)}</span><span><b>${esc(x.company.name)}</b><small>${esc(x.company.id)} · ${x.employees.length} employees</small></span></div><div class="combined-chart-track"><i class="assigned-fill" data-series-track="assigned" title="Assigned: ${x.assigned}" style="width:${x.assigned/n*100}%"></i><i class="available-fill" data-series-track="available" title="Available: ${x.available}" style="width:${x.available/n*100}%"></i><i class="maintenance-fill" data-series-track="maintenance" title="Under maintenance: ${x.maintenance}" style="width:${x.maintenance/n*100}%"></i><i class="other-fill" data-series-track="other" title="Other statuses: ${Math.max(0,n-x.assigned-x.available-x.maintenance)}" style="width:${x.assets.length?Math.max(0,n-x.assigned-x.available-x.maintenance)/n*100:0}%"></i></div><div class="combined-chart-total">${x.assets.length}</div></div>`}).join('')}<div class="combined-chart-legend interactive-legend"><button type="button" class="chart-legend-toggle active" data-chart-series="assigned"><i class="legend-swatch assigned-fill"></i>Assigned</button><button type="button" class="chart-legend-toggle active" data-chart-series="available"><i class="legend-swatch available-fill"></i>Available</button><button type="button" class="chart-legend-toggle active" data-chart-series="maintenance"><i class="legend-swatch maintenance-fill"></i>Under maintenance</button><button type="button" class="chart-legend-toggle active" data-chart-series="other"><i class="legend-swatch other-fill"></i>Other status</button></div></div><div class="company-comparison-summary">${companyStats.map(x=>`<div><span>${esc(x.company.id)} · ${esc(x.company.name)}</span><b>${x.assets.length} assets</b><small>${x.employees.length} employees</small></div>`).join('')}</div></section>`;
  const graphs=`<div class="company-graphs-heading"><div><h2>Individual company performance</h2><p>Separate inventory graphs for each organization</p></div></div><div class="company-graphs-grid">${data.companies.map(c=>companyGraph(c)).join('')}</div>`;
  const catPanel=`<section class="panel category-analytics-panel"><div class="panel-head"><div><span class="eyebrow">INVENTORY BREAKDOWN</span><h3>Asset distribution by category</h3><p>Full category names and status-level counts across all companies</p></div><span class="chart-period-pill">All organizations</span></div><div class="category-analytics-list">${cats.map(c=>{let group=a.filter(x=>x.category===c),total=group.length,as=group.filter(x=>x.status==='Assigned').length,av=group.filter(x=>x.status==='Available').length,mt=group.filter(x=>x.status==='Under Maintenance').length,other=total-as-av-mt;return `<div class="category-analytics-row" tabindex="0" role="button" data-category-filter="${esc(c)}" title="View ${esc(c)} assets"><div class="category-name"><b>${esc(c)}</b><small>${total} total assets</small></div><div class="category-stack" aria-label="${as} assigned, ${av} available, ${mt} under maintenance, ${other} other"><i class="assigned-fill" data-series-track="assigned" title="Assigned: ${as}" style="width:${as/Math.max(1,total)*100}%"></i><i class="available-fill" data-series-track="available" title="Available: ${av}" style="width:${av/Math.max(1,total)*100}%"></i><i class="maintenance-fill" data-series-track="maintenance" title="Under maintenance: ${mt}" style="width:${mt/Math.max(1,total)*100}%"></i><i class="other-fill" data-series-track="other" title="Other statuses: ${other}" style="width:${Math.max(0,other)/Math.max(1,total)*100}%"></i></div><div class="category-counts"><span><i class="legend-swatch assigned-fill"></i>${as} assigned</span><span><i class="legend-swatch available-fill"></i>${av} available</span><span><i class="legend-swatch maintenance-fill"></i>${mt} maintenance</span><span><i class="legend-swatch other-fill"></i>${other} other</span></div><b class="category-total">${total}</b></div>`}).join('')}</div><div class="combined-chart-legend"><span><i class="legend-swatch assigned-fill"></i>Assigned</span><span><i class="legend-swatch available-fill"></i>Available</span><span><i class="legend-swatch maintenance-fill"></i>Under maintenance</span><span><i class="legend-swatch other-fill"></i>Other status</span></div><div class="mini-stat-row"><div class="mini-stat"><span>Total inventory value</span><b>${money(a.reduce((s,x)=>s+Number(x.price||0),0))}</b></div><div class="mini-stat"><span>Assignment rate</span><b>${Math.round(assigned/(a.length||1)*100)}%</b></div><div class="mini-stat"><span>Asset categories</span><b>${new Set(a.map(x=>x.category)).size}</b></div></div></section>`;
  const dirPanel=`<section class="panel"><div class="panel-head"><div><h3>Company directory</h3><p>Manage company profiles and logos</p></div><button class="btn" data-goto="Employees">View employees →</button></div><div class="panel-body company-directory-mini">${data.companies.map(c=>`<div class="company-mini-row"><span class="company-mini-logo ${c.logo?'has-logo':''}">${c.logo?`<img src="${c.logo}" alt="">`:`${esc(c.id)}`}</span><span><b>${esc(c.name)}</b><small>${esc(c.id)} · ${companyAssetStats(c.id).employees.length} employees</small></span><button class="row-action" data-edit-company="${c.id}" title="Edit company">${ic('edit')}</button></div>`).join('')}</div></section>`;
  const recentPanel=`${panelTable('Recent assignments','Latest asset allocations',['Assignment','Employee','Asset','Department','Assigned on','Status'],latest.map(x=>({id:x.assetId,cells:[`<b class="primary-cell">${x.id}</b>`,`<b>${esc(x.employeeName)}</b><small class="sub-cell">${x.employeeId}</small>`,`<b>${esc(x.assetName)}</b><small class="sub-cell">${x.assetId}</small>`,esc(x.department),x.date,statusTag(x.status)]})),button('View register →','go-assign',false))}`;
  const activityPanel=`<section class="panel"><div class="panel-head"><div><h3>Workspace activity</h3><p>Latest changes across your inventory</p></div><button class="btn" data-goto="Audit Logs">Activity log →</button></div><div class="panel-body"><div class="activity-list">${data.logs.slice(0,5).map(l=>`<div class="activity-item"><span class="activity-icon">${ic('history')}</span><div class="activity-copy"><b>${esc(l.action)}</b><p>${esc(l.description||l.assetId)}</p></div><span class="activity-time">${new Date(l.time).toLocaleDateString()}</span></div>`).join('')}</div></div></section>`;
  const kpiBlock=`<div class="kpi-grid">${[['Total',a.length,'package','Across C1, C2 and C3'],['Assigned',assigned,'clipboard-check',`${Math.round(assigned/(a.length||1)*100)}% of inventory`,assigned/(a.length||1)*100],['Available',available,'package-check','Ready for allocation',available/(a.length||1)*100],['Maintenance',maint,'wrench','Service in progress',maint/(a.length||1)*100],['Damaged',damaged,'info','Needs attention',damaged/(a.length||1)*100],['Employees',data.employees.length,'users','Across all companies'],['Holding devices',holding,'users','Currently assigned',holding/(data.employees.length||1)*100]].map((x,i)=>`<div class="kpi-card" data-goto="${i===5||i===6?'Employees':'All Assets'}"><div class="kpi-top"><span class="kpi-label">${x[0]}</span><span class="kpi-icon ${['','aqua','sky','mist'][i%4]}">${ic(x[2])}</span></div><div class="kpi-value">${x[1]}</div><div class="kpi-foot">${x[3]}</div>${x[4]!==undefined?`<div class="kpi-meter"><i style="width:${Math.max(3,Math.min(100,x[4]))}%"></i></div>`:''}</div>`).join('')}${healthCard(a,assigned,available,maint,damaged)}</div>`;

  /* ---- new: header banner, quick actions, tabs ---- */
  const tabs=[['overview','Overview'],['companies','Companies'],['inventory','Inventory']];
  const tabBar=`<div class="dash-tabs" role="tablist">${tabs.map(t=>`<button type="button" role="tab" class="dash-tab ${dashTab===t[0]?'active':''}" aria-selected="${dashTab===t[0]}" data-dash-tab="${t[0]}">${t[1]}${t[0]==='companies'?`<em>${data.companies.length}</em>`:t[0]==='inventory'?`<em>${new Set(a.map(x=>x.category)).size}</em>`:''}</button>`).join('')}</div>`;

  /* ---- needs attention ---- */
  const att=[['Pending asset requests',pendingReq,'Asset Requests','inbox','Awaiting a decision'],['Return requests to review',pendingRet,'Asset Returns','history','Raised by employees'],['Open maintenance cases',openMaint,'Maintenance','wrench','In service or reported'],['Damaged assets',damaged,'All Assets','info','Needs repair or retirement'],['Employees with no assets',idleEmp,'Employees','users','Nothing assigned yet']];
  const attTotal=att.reduce((n,x)=>n+x[1],0);
  const attention=`<section class="panel attention-panel"><div class="panel-head"><div><span class="eyebrow">ACTION CENTRE</span><h3>Needs attention</h3><p>${attTotal?`${attTotal} item${attTotal===1?'':'s'} to review`:'Everything is in order'}</p></div><span class="chart-period-pill ${attTotal?'warn':'ok'}">${attTotal?'Review':'All clear'}</span></div><div class="panel-body attention-list">${att.map(x=>`<button type="button" class="attention-row ${x[1]?'has':'zero'}" data-goto="${x[2]}"><span class="att-ico">${ic(x[3])}</span><span class="att-copy"><b>${x[0]}</b><small>${x[4]}</small></span><span class="att-count">${x[1]?x[1]:'✓'}</span></button>`).join('')}</div></section>`;

  /* ---- company snapshot ---- */
  const snapshot=`<section class="panel snapshot-panel"><div class="panel-head"><div><span class="eyebrow">PORTFOLIO</span><h3>Company snapshot</h3><p>Assets, people and utilisation per company</p></div><button class="btn" data-dash-tab="companies">Details →</button></div><div class="panel-body snapshot-list">${companyStats.map((x,i)=>{const util=x.assets.length?Math.round(x.assigned/x.assets.length*100):0;return `<div class="snap-row c${i%3}"><span class="snap-avatar">${esc(x.company.id)}</span><div class="snap-main"><div class="snap-top"><b>${esc(x.company.name)}</b><span>${x.assets.length} assets · ${x.employees.length} people</span></div><div class="snap-bar"><i style="width:${util}%"></i></div></div><span class="snap-util">${util}%</span></div>`}).join('')}</div></section>`;

  /* ---- empty-inventory onboarding ---- */
  

  const hasEmp=data.employees.length>0;
  const steps=[['1','Add your team','Create employee profiles so devices can be assigned to people.','add-employee','data-action',hasEmp],['2','Register a device','Laptops, monitors, phones, desks and more.','add-asset','data-action',!isEmpty],['3','Assign & track','Hand devices out, then follow returns and servicing.','assign','data-action',assigned>0]];
  const onboarding=isEmpty?`<section class="panel onboard-panel"><div class="onboard-head"><span class="eyebrow">GET STARTED</span><h3>Set up your workspace in three steps</h3><p>${CATS.length} categories are ready. This dashboard fills in as you add data.</p></div><div class="onboard-grid">${steps.map(x=>`<button type="button" class="onboard-step ${x[5]?'done':''}" ${x[4]}="${x[3]}"><span class="os-num">${x[5]?'✓':x[0]}</span><span class="os-copy"><b>${x[1]}</b><small>${x[2]}</small></span><span class="os-go">${ic('arrow-right')}</span></button>`).join('')}</div></section>`:'';
  const recentBlock=latest.length?recentPanel:`<section class="panel"><div class="panel-head"><div><h3>Recent assignments</h3><p>Latest asset allocations</p></div></div><div class="panel-body empty-note">${ic('clipboard-check')}<b>No assignments yet</b><small>Assign an asset to an employee and it will appear here.</small></div></section>`;
  const activityBlock=data.logs.length?activityPanel:`<section class="panel"><div class="panel-head"><div><h3>Workspace activity</h3><p>Latest changes across your inventory</p></div></div><div class="panel-body empty-note">${ic('history')}<b>No activity yet</b><small>Changes to assets and assignments will be logged here.</small></div></section>`;

  const summary=isEmpty?(hasEmp?'Your inventory is empty — register your first device to get started.':'Your workspace is ready. Add your team and register devices to get started.'):`${a.length} devices across ${data.companies.length||3} companies · ${assigned} assigned, ${available} available${attTotal?` · ${attTotal} need attention`:''}.`;
  const heroBanner=`<section class="hero"><span class="hero-ring" aria-hidden="true"></span><div class="hero-copy"><p class="eyebrow">ASSET OVERVIEW · ${new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase()}</p><h1>Good ${greet}, ${esc(getUser().name||'Administrator')} <span>✦</span></h1><p class="hero-sub">${summary}</p><span class="hero-status"><i class="online-dot"></i>Workspace is healthy</span></div><div class="hero-actions"><button type="button" class="hero-primary" data-action="add-asset">${ic('plus')} Add asset</button><div class="hero-links"><button type="button" data-action="assign">${ic('clipboard-check')} Assign</button><button type="button" data-action="add-employee">${ic('users')} Add employee</button><button type="button" data-action="maintenance">${ic('wrench')} Maintenance</button><button type="button" data-goto="Reports & Analytics">${ic('chart')} Reports</button></div></div></section>`;
  const views={
    overview:onboarding+kpiBlock+`<div class="dash-two">${attention}${recentBlock}</div><div class="dash-two">${snapshot}${activityBlock}</div>`,
    companies:compOverview+graphs+`<div class="dash-one">${dirPanel}</div>`,
    inventory:isEmpty?`<section class="panel"><div class="panel-body empty-note big">${ic('package')}<b>No inventory to analyse yet</b><small>Category and status breakdowns appear once you add assets.</small></div></section>`:`<div class="dash-one">${catPanel}</div>`
  };
  return heroBanner+tabBar+`<div class="dash-body" data-tab="${dashTab}">${views[dashTab]||views.overview}</div>`}
function toolBar(placeholder,filters=''){return `<div class="module-toolbar"><div class="toolbar-left"><label class="search-field">${ic('search')}<input id="moduleSearch" value="${esc(searchText)}" placeholder="${placeholder}"></label>${filters}</div><div class="toolbar-right"><button class="btn" data-action="export-csv">↓ Export CSV</button></div></div>`}
function empRow(e){let n=data.assets.filter(a=>a.employeeId===e.id&&a.status==='Assigned').length;return{id:e.id,cells:[`<div class="employee-cell"><span class="avatar">${initials(e.name)}</span><span><b class="primary-cell">${esc(e.name)}</b><small class="sub-cell">${esc(e.email)}</small></span></div>`,`<b>${e.id}</b>`,esc(e.department),esc(e.designation),esc(e.phone),`<b>${n}</b>`,statusTag(e.status)]}}
function employeePage(){
  const all=data.employees;
  let rows=all.filter(e=>[e.id,e.name,e.email,e.department,e.organization].join(' ').toLowerCase().includes(searchText.toLowerCase())&&(statusFilter==='All statuses'||e.status===statusFilter)&&(organizationFilter==='All organizations'||e.organization===organizationFilter));
  const cnt=s=>all.filter(e=>e.status===s).length;
  const holding=new Set(data.assets.filter(a=>a.status==='Assigned').map(a=>a.employeeId)).size;
  const sel=organizationFilter!=='All organizations'?data.companies.find(c=>c.id===organizationFilter):null;
  const filtered=Boolean(searchText)||statusFilter!=='All statuses'||organizationFilter!=='All organizations';

  const hero=`<section class="hero hero-compact"><span class="hero-ring" aria-hidden="true"></span><div class="hero-copy"><p class="eyebrow">PEOPLE DIRECTORY</p><h1>Employees</h1><p class="hero-sub">${all.length?`${all.length} ${all.length===1?'person':'people'} across ${data.companies.length||'your'} ${data.companies.length===1?'company':'companies'} · ${holding} currently holding devices.`:'Add your team to start assigning devices to people.'}</p></div><div class="hero-actions"><button type="button" class="hero-primary" data-action="add-employee">${ic('plus')} Add employee</button></div></section>`;

  const stat=[['Total',all.length,'users','tone-blue'],['Active',cnt('Active'),'clipboard-check','tone-green'],['On leave',cnt('On Leave'),'history','tone-orange'],['Inactive',cnt('Inactive'),'info','tone-grey']];
  const stats=`<div class="mini-stats">${stat.map(x=>`<div class="mini-stat-card ${x[3]}"><span class="ms-ico">${ic(x[2])}</span><div class="ms-copy"><b class="ms-num">${x[1]}</b><small>${x[0]}</small></div><div class="ms-bar"><i style="width:${all.length?Math.max(x[1]?6:0,Math.round(x[1]/all.length*100)):0}%"></i></div></div>`).join('')}</div>`;

  const companies=data.companies.length?`<div class="company-logo-grid">${data.companies.map(c=>`<div class="company-logo-card ${organizationFilter===c.id?'selected':''}" data-company-select="${c.id}" tabindex="0" role="button" aria-label="View employees for ${esc(c.name)}"><div class="company-logo-display ${c.logo?'has-logo':''}">${c.logo?`<img src="${c.logo}" alt="${esc(c.name)} logo">`:`<span>${esc(c.id)}</span>`}</div><div class="company-logo-info"><b>${esc(c.name)}</b><small>${data.employees.filter(e=>e.organization===c.id).length} employees</small></div><button class="row-action company-edit-btn" data-edit-company="${c.id}" title="Edit company name or logo">${ic('edit')}</button></div>`).join('')}</div>`:`<div class="emp-notice"><span class="en-ico">${ic('building-2')}</span><div><b>No companies set up yet</b><small>Employees belong to an organization (C1, C2, C3), but none exist in the database yet. Once companies are added they appear here as filter cards.</small></div></div>`;

  const emptyAll=`<div class="emp-empty"><div class="ee-art">${ic('users')}</div><b>Your directory is empty</b><small>Use the button above to create the first profile. Each person can then be assigned devices and tracked here.</small></div>`;
  const emptyMatch=`<div class="emp-empty"><div class="ee-art">${ic('search')}</div><b>No matching employees</b><small>Nothing fits the current search or filters.</small><button type="button" class="btn" data-clear-filters>Clear filters</button></div>`;

  const body=!all.length?emptyAll:!rows.length?emptyMatch:table(['Employee','Employee ID','Organization','Department','Designation','Contact','Devices','Status'],rows.map(e=>{let r=empRow(e);r.cells.splice(2,0,`<span class="org-pill">${esc(e.organization||'—')}</span>`);return r}));

  return hero+stats+companies+`<section class="panel company-employee-panel emp-panel"><div class="emp-head"><div><h2>${sel?esc(sel.name):'Directory'}</h2><p>${rows.length} of ${all.length} ${all.length===1?'person':'people'}${sel?` in ${esc(sel.id)}`:''}</p></div>${sel?`<button class="btn" data-company-reset>Show all companies</button>`:''}</div>${toolBar('Search name, ID or department…',`<div class="filter-chips" id="statusFilter">${['All statuses','Active','On Leave','Inactive'].map(s=>`<button type="button" class="filter-chip ${statusFilter===s?'active':''}" data-filter-status="${s}">${s==='All statuses'?'All':s}</button>`).join('')}</div>`)}${body}${all.length?`<div class="table-footer">Showing ${rows.length} of ${all.length} employees</div>`:''}</section>`}
function getAssetCategoryIcon(cat){let c=String(cat||'').toLowerCase();if(c.includes('laptop'))return 'laptop';if(c.includes('desktop')||c.includes('workstation')||c.includes('monitor')||c.includes('projector'))return 'monitor';if(c.includes('headset')||c.includes('headphone'))return 'headphones';return 'box'}
function assetRow(a){let catIcon=getAssetCategoryIcon(a.category);let thumb=a.image?`<img src="${a.image}" alt="${esc(a.name)}" data-expand-photo="${esc(a.image)}" data-expand-title="${esc(a.name)}" title="Click photo to expand">`:ic(catIcon);return{id:a.id,cells:[`<div class="asset-cell"><span class="asset-thumb ${a.image?'asset-thumb-clickable':''}">${thumb}</span><span><b class="primary-cell">${esc(a.name)}</b><small class="sub-cell">${esc(a.serial)}</small></span></div>`,`<b>${a.id}</b>`,esc(a.category),`${esc(a.brand)} · ${esc(a.model)}`,a.employeeName?`${esc(a.employeeName)}<small class="sub-cell">${a.employeeId}</small>`:'—',money(a.price),statusTag(a.status)]}}
function assetPage(){let rows=data.assets.filter(a=>[a.id,a.name,a.serial,a.category,a.brand,a.employeeName].join(' ').toLowerCase().includes(searchText.toLowerCase())&&(statusFilter==='All statuses'||a.status===statusFilter));return pageHeading('All assets','A single inventory for every company-owned device and accessory.',button(`${ic('plus')} Add asset`,'add-asset'))+`<section class="panel">${toolBar('Search asset ID, serial number or employee…',`<div class="filter-chips" id="statusFilter">${['All statuses',...ASSET_STATUS].map(s=>`<button type="button" class="filter-chip ${statusFilter===s?'active':''}" data-filter-status="${s}">${s}</button>`).join('')}</div>`)}${table(['Asset','Asset ID','Category','Brand / model','Assigned to','Purchase value','Status'],rows.map(assetRow))}<div class="table-footer">Showing ${rows.length} of ${data.assets.length} assets · Total value ${money(data.assets.reduce((s,a)=>s+Number(a.price||0),0))}</div></section>`}
function assignmentPage(){let rows=data.assignments.filter(x=>[x.id,x.employeeName,x.employeeId,x.assetId,x.assetName].join(' ').toLowerCase().includes(searchText.toLowerCase()));return pageHeading('Asset assignments','Review current allocations and historical assignment records.',button(`${ic('plus')} Assign asset`,'assign'))+`<section class="panel">${toolBar('Search assignment, employee or asset…')}${table(['Assignment ID','Employee','Asset','Department','Assigned on','Expected return','Status'],rows.map(x=>({id:x.assetId,cells:[`<b>${x.id}</b>`,`<b>${esc(x.employeeName)}</b><small class="sub-cell">${x.employeeId}</small>`,`<b>${esc(x.assetName)}</b><small class="sub-cell">${x.assetId}</small>`,esc(x.department),x.date,x.expected||'—',statusTag(x.status)]})))}</section>`}
function returnPage(){let assigned=data.assets.filter(a=>a.status==='Assigned'),requests=data.returnRequests||[];let requestPanel=requests.length?panelTable('Employee return requests','Requests raised from employee profiles',['Request ID','Employee','Asset','Requested on','Status'],requests.map(q=>({id:q.id,cells:[`<b>${q.id}</b>`,`<b>${esc(q.employeeName)}</b><small class="sub-cell">${q.employeeId}</small>`,`<b>${esc(q.assetName)}</b><small class="sub-cell">${q.assetId}</small>`,q.requestedOn,statusTag(q.status)],actionHtml:`<div class="row-actions"><button class="row-action" data-view-return-request="${q.id}" title="View return request" aria-label="View return request">${ic('eye')}</button><button class="row-action" data-edit-return-request="${q.id}" title="Edit return request" aria-label="Edit return request">${ic('edit')}</button></div>`}))):'';return pageHeading('Asset returns','Track employee return requests and inspect equipment when it is handed back.',button(`${ic('package-check')} Process return`,'return'))+requestPanel+panelTable('Currently assigned assets','Select a device to process its return',['Asset','Employee','Department','Condition','Status'],assigned.map(a=>({id:a.id,cells:[`<b>${esc(a.name)}</b><small class="sub-cell">${a.id}</small>`,`<b>${esc(a.employeeName)}</b><small class="sub-cell">${a.employeeId}</small>`,esc(data.employees.find(e=>e.id===a.employeeId)?.department||'—'),esc(a.condition),statusTag(a.status)]})))+`<section class="panel section-gap"><div class="panel-head"><div><h3>Return history</h3><p>Previous returns and inspection results</p></div></div>${table(['Return ID','Asset','Employee','Return date','Condition','Remarks'],data.returns.map(r=>({id:r.assetId,cells:[r.id,`${esc(r.assetName)}<small class="sub-cell">${r.assetId}</small>`,`${esc(r.employeeName)}<small class="sub-cell">${r.employeeId}</small>`,r.date,statusTag(r.condition),esc(r.remarks||'—')]})))}</section>`}
function requestPage(){let pending=data.requests.filter(r=>r.status==='Pending').length;return pageHeading('Asset requests','Review employee requests, make allocation decisions and optionally prepare an email response.')+`<div class="kpi-grid request-kpis"><div class="kpi-card"><div class="kpi-label">Total requests</div><div class="kpi-value">${data.requests.length}</div></div><div class="kpi-card"><div class="kpi-label">Awaiting decision</div><div class="kpi-value">${pending}</div></div><div class="kpi-card"><div class="kpi-label">Approved</div><div class="kpi-value">${data.requests.filter(r=>r.status==='Approved').length}</div></div><div class="kpi-card"><div class="kpi-label">Rejected</div><div class="kpi-value">${data.requests.filter(r=>r.status==='Rejected').length}</div></div></div><section class="panel"><div class="panel-head"><div><h3>Request inbox</h3><p>Review each request and record your decision</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr>${['Request','Employee','Requested asset','Reason','Date','Priority','Status','Decision'].map(h=>`<th>${h.toUpperCase()}</th>`).join('')}</tr></thead><tbody>${data.requests.map(r=>`<tr><td><b>${esc(r.id)}</b></td><td><b>${esc(r.employeeName)}</b><small class="sub-cell">${esc(r.employeeId)} · ${esc(data.employees.find(e=>e.id===r.employeeId)?.email||'')}</small></td><td>${esc(r.asset)}</td><td>${esc(r.reason)}</td><td>${esc(r.date)}</td><td>${statusTag(r.priority)}</td><td>${statusTag(r.status)}</td><td><div class="row-actions request-actions"><button class="btn btn-small" data-request-decision="${r.id}" data-decision="Approved" ${r.status!=='Pending'?'disabled':''}>Accept</button><button class="btn btn-small btn-danger" data-request-decision="${r.id}" data-decision="Rejected" ${r.status!=='Pending'?'disabled':''}>Reject</button><button class="row-action" title="Draft email" data-request-mail="${r.id}">${ic('mail')}</button></div></td></tr>`).join('')}</tbody></table></div></section>`}
function maintenancePage(){return pageHeading('Maintenance','Track repairs, service providers, costs and downtime.',button(`${ic('plus')} Log maintenance`,'maintenance'))+panelTable('Maintenance register','Current and previous repair cases',['Case ID','Asset','Issue description','Reported date','Provider','Estimated cost','Status'],data.maintenance.map(m=>({id:m.id,cells:[m.id,esc(m.assetId),esc(m.issue),m.reported,esc(m.provider),money(m.cost),statusTag(m.status)]})))}
function departmentPage(){return pageHeading('Departments','Understand asset ownership and employee distribution by department.')+`<div class="kpi-grid">${DEPTS.map(d=>{let emp=data.employees.filter(e=>e.department===d),assets=data.assets.filter(a=>a.status==='Assigned'&&emp.some(e=>e.id===a.employeeId));return `<div class="kpi-card" data-dept="${d}"><div class="kpi-top"><span class="kpi-label">${d}</span><span class="kpi-icon">${ic('building-2')}</span></div><div class="kpi-value">${assets.length}</div><div class="kpi-foot">${emp.length} employees · allocated devices</div></div>`}).join('')}</div>`}
function categoryPage(){return pageHeading('Asset categories','Manage inventory quantities by category and monitor available stock.',`<button class="btn btn-primary" data-action="manage-stock">${ic('boxes')} Adjust inventory</button>`)+`<section class="panel"><div class="panel-head"><div><h3>Inventory by category</h3><p>Physical asset counts and availability</p></div></div><div class="table-wrap"><table class="data-table"><thead><tr>${['Category','Total stock','Assigned','Available','In maintenance','Actions'].map(h=>`<th>${h.toUpperCase()}</th>`).join('')}</tr></thead><tbody>${CATS.map(c=>{let a=data.assets.filter(x=>x.category===c);return `<tr><td><b>${esc(c)}</b></td><td><b>${a.length}</b></td><td>${a.filter(x=>x.status==='Assigned').length}</td><td><b>${a.filter(x=>x.status==='Available').length}</b></td><td>${a.filter(x=>x.status==='Under Maintenance').length}</td><td><button class="btn btn-small" data-stock-category="${esc(c)}">Manage stock</button></td></tr>`}).join('')}</tbody></table></div></section>`}
function reportPage(){
 const total=data.assets.length,assigned=data.assets.filter(a=>a.status==='Assigned').length,available=data.assets.filter(a=>a.status==='Available').length,maintenance=data.assets.filter(a=>a.status==='Under Maintenance').length;
 const value=data.assets.reduce((s,a)=>s+Number(a.price||0),0),active=data.employees.filter(e=>e.status==='Active').length;
 const categoryRows=CATS.map(c=>{let a=data.assets.filter(x=>x.category===c);return{id:c,cells:[c,a.length,a.filter(x=>x.status==='Assigned').length,a.filter(x=>x.status==='Available').length,a.filter(x=>x.status==='Under Maintenance').length]}});
 const reportCard=(icon,title,desc,kind)=>`<article class="report-export-card"><span class="report-export-icon">${ic(icon)}</span><div class="report-export-copy"><h3>${title}</h3><p>${desc}</p></div><div class="report-export-actions"><button class="btn btn-small" data-report-csv="${kind}">↓ CSV</button><button class="btn btn-small btn-primary" data-report-pdf="${kind}">↓ PDF</button></div></article>`;
 return pageHeading('Reports & analytics','Decision-ready summaries of inventory, assignments, employees and asset operations.',`<button class="btn" data-action="export-report-csv">↓ Export all CSV</button><button class="btn btn-primary" data-action="export-report-pdf">↓ Download PDF report</button>`)
 +`<div class="report-meta"><span>${ic('history')} Generated ${new Date().toLocaleString('en-IN')}</span><span>${ic('building-2')} ${esc(data.settings.org||'Organization')}</span><span>${ic('database')} Live browser workspace data</span></div>`
 +`<div class="kpi-grid report-kpis">${[['Inventory value',money(value),'package'],['Total assets',total,'box'],['Assigned assets',assigned, 'clipboard-check'],['Available assets',available,'package-check']].map(([l,v,i])=>`<div class="kpi-card"><div class="kpi-top"><span class="kpi-label">${l}</span><span class="kpi-icon">${ic(i)}</span></div><div class="kpi-value">${v}</div><div class="kpi-foot">Current workspace snapshot</div></div>`).join('')}</div>`
 +`<div class="report-section-heading"><div><h2>Export centre</h2><p>Choose a report and download a reusable file for sharing or analysis.</p></div></div><div class="report-export-grid">`
 +reportCard('package','Asset inventory','Complete register with ownership, status and purchase value.','assets')
 +reportCard('users','Employee directory','Employee details with department, role and employment status.','employees')
 +reportCard('clipboard-check','Assignment register','Current and historical asset allocation records.','assignments')
 +reportCard('wrench','Maintenance register','Repair cases, providers, estimated costs and status.','maintenance')
 +reportCard('chart','Category summary','Asset counts by category and allocation status.','categories')
 +reportCard('history','Audit activity','Recent workspace actions and change history.','audit')
 +`</div><div class="report-section-heading report-table-heading"><div><h2>Inventory by category</h2><p>Allocation status across ${CATS.length} asset categories.</p></div><button class="btn btn-small" data-report-csv="categories">↓ Download CSV</button></div><section class="panel report-table-panel">${table(['Category','Total assets','Assigned','Available','Maintenance'],categoryRows)}<div class="table-footer">${total} registered assets · ${money(value)} total purchase value</div></section>`
 +`<div class="report-bottom-grid"><section class="panel"><div class="panel-head"><div><h3>Asset status overview</h3><p>Distribution across the current inventory</p></div></div><div class="panel-body report-status-list">${[['Assigned',assigned],['Available',available],['Under Maintenance',maintenance],['Other statuses',total-assigned-available-maintenance]].map(([n,v])=>`<div class="report-status-row"><span>${n}</span><b>${v}</b><div class="report-track"><i style="width:${total?Math.round(v/total*100):0}%"></i></div><small>${total?Math.round(v/total*100):0}%</small></div>`).join('')}</div></section><section class="panel"><div class="panel-head"><div><h3>Workforce snapshot</h3><p>Employee and allocation indicators</p></div></div><div class="panel-body report-workforce"><div><span>Employees</span><b>${data.employees.length}</b></div><div><span>Active employees</span><b>${active}</b></div><div><span>Assignment rate</span><b>${total?Math.round(assigned/total*100):0}%</b></div><div><span>Open maintenance cases</span><b>${data.maintenance.filter(m=>m.status!=='Completed').length}</b></div></div></section></div>`
}
function logPage(){return pageHeading('Audit logs','A chronological record of changes made in this browser workspace.')+panelTable('Activity history',`${data.logs.length} recorded events`,['Activity','Asset ID','Employee ID','Timestamp','Description'],data.logs.map((l,i)=>({id:String(i),cells:[`<b>${esc(l.action)}</b>`,esc(l.assetId),esc(l.employeeId),new Date(l.time).toLocaleString(),esc(l.description)]})))}
function settingsPage(){let total=data.assets.length,available=data.assets.filter(a=>a.status==='Available').length,assigned=data.assets.filter(a=>a.status==='Assigned').length,maintenance=data.assets.filter(a=>a.status==='Under Maintenance').length;return pageHeading('Settings','Control organization preferences, company profiles and workspace data.')+`<div class="settings-intro panel"><div class="settings-intro-icon">${ic('settings-2')}</div><div><span class="eyebrow">WORKSPACE CONFIGURATION</span><h2>Manage your workspace</h2><p>Configure shared preferences and maintain company-specific identity for C1, C2 and C3.</p></div><div class="settings-intro-status"><i class="online-dot"></i><span>Workspace active</span></div></div><div class="settings-section-label"><div><h2>General preferences</h2><p>Organization-wide settings used across the workspace</p></div></div><div class="settings-layout"><section class="panel settings-card"><div class="settings-card-head"><span class="settings-icon">${ic('building-2')}</span><div><h3>Organization profile</h3><p>Workspace identity and asset numbering</p></div></div><form id="settingsForm" class="form-grid settings-form"><div class="form-field full"><label>Organization name</label><input name="org" value="${esc(data.settings.org||'ZylloTech Asset Management')}" required></div><div class="form-field"><label>Asset ID prefix</label><input name="prefix" value="${esc(data.settings.prefix)}" maxlength="8" required></div><div class="form-field"><label>Reporting currency</label><input value="Indian Rupee (INR)" readonly></div><div class="form-actions full"><button class="btn btn-primary">${ic('clipboard-check')} Save preferences</button></div></form></section><section class="panel settings-card"><div class="settings-card-head"><span class="settings-icon">${ic('database')}</span><div><h3>Data & storage</h3><p>Workspace records saved in this browser</p></div></div><div class="settings-storage-status"><span class="storage-status-icon">${ic('hard-drive')}</span><div><b>Local browser storage</b><small><i class="online-dot"></i> Connected and available</small></div><span class="storage-status-tag">ACTIVE</span></div><div class="settings-stats"><div><span>Employee records</span><b>${data.employees.length}</b></div><div><span>Registered assets</span><b>${total}</b></div><div><span>Available inventory</span><b>${available}</b></div><div><span>Assigned inventory</span><b>${assigned}</b></div><div><span>Under maintenance</span><b>${maintenance}</b></div></div><div class="settings-actions"><button class="btn" data-action="export-json">${ic('download')} Export workspace backup</button><button class="btn btn-danger" data-action="reset">${ic('history')} Restore initial records</button></div></section></div><div class="settings-section-label"><div><h2>Company profiles</h2><p>Manage each company's display name and logo. Changes are reflected in the dashboard and employee directory.</p></div></div><div class="settings-company-grid">${data.companies.map(c=>`<div class="panel settings-company-card"><div class="settings-company-logo ${c.logo?'has-logo':''}">${c.logo?`<img src="${c.logo}" alt="${esc(c.name)} logo">`:`<b>${esc(c.id)}</b>`}</div><div class="settings-company-copy"><span class="eyebrow">${esc(c.id)} ORGANIZATION</span><h3>${esc(c.name)}</h3><p>${data.employees.filter(e=>e.organization===c.id).length} employees · ${data.assets.filter(a=>a.organization===c.id).length} assets</p></div><button class="btn settings-company-edit" data-edit-company="${c.id}">${ic('edit')} Edit profile</button></div>`).join('')}</div><div class="settings-footer-note">${ic('info')}<span>Changes are stored in this browser only. Export a workspace backup regularly to preserve your records.</span></div>`}

function profilePage(){let u=getUser(),name=getDisplayName(u),email=u.email||'',role=getUserRole(u),joined=u.createdAt?new Date(u.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'Current session';let initialsText=initials(name);return pageHeading('My profile','Manage your account identity and review your access to ZylloTech Asset Management.')+`<section class="panel account-profile-hero"><div class="account-profile-brand"><img src="zyllotech-logo.png" alt="ZylloTech logo"><span><b>ZylloTech</b><small>ASSET MANAGEMENT</small></span></div><div class="account-profile-main"><div class="account-avatar-xl">${esc(initialsText)}</div><div class="account-profile-title"><span class="eyebrow">SIGNED-IN ACCOUNT</span><h2>${esc(name)}</h2><p>${esc(email)}</p><div class="account-profile-tags"><span>${ic('clipboard-check')} ${esc(role)}</span><span>${ic('check-circle')} Active account</span></div></div><button class="btn btn-danger account-signout" data-action="logout">${ic('log-out')} Sign out</button></div></section><div class="account-overview-grid"><section class="panel account-section"><div class="account-section-head"><span class="settings-icon">${ic('users')}</span><div><h3>Personal information</h3><p>Your account identity and contact details</p></div></div><div class="account-detail-list"><div><span>Full name</span><b>${esc(name)}</b></div><div><span>Work email</span><b>${esc(email)}</b></div><div><span>Account role</span><b>${esc(role)}</b></div><div><span>Account status</span><b><i class="online-dot"></i> Active</b></div></div></section><section class="panel account-section"><div class="account-section-head"><span class="settings-icon">${ic('settings')}</span><div><h3>Access & security</h3><p>Current workspace access information</p></div></div><div class="account-security-card"><div class="security-row"><span class="security-symbol">${ic('package')}</span><div><b>Browser session</b><small>Signed in on this device</small></div>${statusTag('Active')}</div><div class="security-row"><span class="security-symbol">${ic('database')}</span><div><b>Data storage</b><small>Account information is stored in this browser</small></div></div><div class="security-row"><span class="security-symbol">${ic('history')}</span><div><b>Session details</b><small>${esc(joined)}</small></div></div></div><button class="btn account-settings-link" data-action="goto-settings">${ic('settings')} Open workspace settings ${ic('chart')}</button></section></div><section class="panel account-footer-note"><span class="settings-icon">${ic('eye')}</span><div><b>About your workspace account</b><p>This frontend workspace uses browser-based account storage. It does not provide production-grade identity verification or centralized account security.</p></div></section>`}
function returnRequestCell(asset){let pending=(data.returnRequests||[]).some(q=>q.assetId===asset.id&&q.status==='Requested');return pending?'<span class="status-pill status-warning">Return requested</span>':`<button class="btn btn-small" data-request-return="${asset.id}">Request return</button>`}
function renderDetail(){let r=selected.record,kind=selected.kind;
if(kind==='employee'){
 let assigned=data.assets.filter(a=>a.status==='Assigned'&&a.employeeId===r.id);
 let history=data.assignments.filter(a=>a.employeeId===r.id);
 return `<button class="btn detail-back" data-action="back">${ic('arrow-left')} Back to employees</button>${pageHeading(r.name,`${r.id} · ${esc(r.department)} · ${esc(r.designation)}`,`<button class="btn" data-action="employee-transfer">${ic('clipboard-check')} Transfer asset</button><button class="btn btn-primary" data-action="employee-assign">${ic('plus')} Assign new asset</button>`)}
 <section class="panel profile-hero"><div class="profile-identity"><span class="profile-avatar-large">${initials(r.name)}</span><div><p class="eyebrow">EMPLOYEE PROFILE</p><h2>${esc(r.name)}</h2><p>${esc(r.email)} · ${esc(r.phone)}</p></div></div><div class="profile-metrics"><div><b>${assigned.length}</b><small>Assigned assets</small></div><div><b>${assigned.filter(a=>a.category==='Laptop').length}</b><small>Laptops</small></div><div><b>${assigned.filter(a=>a.category==='Monitor').length}</b><small>Monitors</small></div></div></section>
 <div class="detail-layout"><div><section class="panel"><div class="panel-head"><div><h3>Currently assigned assets</h3><p>Every device currently allocated to ${esc(r.name)}</p></div></div>${table(['Asset','Asset ID','Category','Brand / model','Serial number','Assigned on','Condition','Return request'],assigned.map(a=>({id:a.id,cells:[`<b class="primary-cell">${esc(a.name)}</b>`,`<b>${a.id}</b>`,esc(a.category),`${esc(a.brand)} · ${esc(a.model)}`,esc(a.serial),data.assignments.find(x=>x.assetId===a.id&&x.status==='Active')?.date||'—',statusTag(a.condition),returnRequestCell(a)]})))}</section>
 <section class="panel section-gap"><div class="panel-head"><div><h3>Asset assignment history</h3><p>Previous allocations and returns</p></div></div>${table(['Assignment ID','Asset','Assigned on','Expected return','Status'],history.map(a=>({id:a.id,cells:[a.id,`${esc(a.assetName)}<small class="sub-cell">${a.assetId}</small>`,a.date,a.expected||'—',statusTag(a.status)]})))}</section></div>
 <aside class="detail-side"><section class="panel"><div class="panel-head"><div><h3>Employee information</h3><p>Directory record</p></div></div><div class="panel-body">${[['Employee ID',r.id],['Department',r.department],['Designation',r.designation],['Email',r.email],['Contact',r.phone],['Joining date',r.joined],['Office location',r.location],['Employment status',r.status]].map(([k,v])=>`<div class="detail-field"><span>${k}</span><b>${esc(v||'—')}</b></div>`).join('')}<button class="btn detail-action" data-action="employee-edit">${ic('edit')} Edit employee</button></div></section></aside></div>`;
}
let pairs=Object.entries(r).filter(([k])=>!['id','employeeId','employeeName','image'].includes(k));
let catIcon=getAssetCategoryIcon(r.category);
let heroThumb=r.image?`<div class="asset-photo-card" data-expand-photo="${esc(r.image)}" data-expand-title="${esc(r.name||r.assetName||r.id)}" title="Click photo to expand"><img src="${r.image}" class="asset-detail-photo" alt="${esc(r.name)}"><span class="photo-expand-hint">${ic('maximize-2')} Click photo to expand</span></div>`:`<span class="asset-thumb asset-thumb-large">${ic(catIcon)}</span>`;
return `<button class="btn detail-back" data-action="back">${ic('arrow-left')} Back to ${esc(backPage)}</button>${pageHeading(r.name||r.assetName||r.id||'Record details',`${kind} · Record overview`,`<button class="btn btn-primary" data-action="detail-edit">${ic('edit')} Edit details</button>`)}<div class="detail-layout"><div><section class="panel"><div class="detail-hero"><div class="detail-hero-brand">${heroThumb}<div><p class="eyebrow">RECORD SUMMARY</p><h2>${esc(r.name||r.assetName||r.id)}</h2><p>${esc(r.id)} · ${esc(kind)}</p></div></div>${r.status?statusTag(r.status):''}</div><div class="panel-head"><div><h3>Record details</h3><p>Current saved information</p></div></div><div class="detail-grid">${pairs.map(([k,v])=>`<div class="detail-field"><span>${esc(k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()))}</span><b>${k==='price'?money(v):esc(v||'—')}</b></div>`).join('')}</div></section></div><aside class="detail-side"><section class="panel"><div class="panel-head"><div><h3>Next actions</h3><p>Manage this record</p></div></div><div class="panel-body"><button class="btn detail-action" data-action="detail-edit">${ic('edit')} Update details</button><button class="btn btn-danger detail-action" data-action="detail-delete">${ic('trash')} Delete record</button></div></section></aside></div>`}
function getUser(){try{return JSON.parse(localStorage.getItem(SESSION)||'{}')}catch{return {}}}
function getDisplayName(user=getUser()){const saved=String(user.name||'').trim();if(saved)return saved;const email=String(user.email||'').trim();if(email){const local=email.split('@')[0].replace(/[._-]+/g,' ').replace(/\\b\\w/g,c=>c.toUpperCase());return local||'User'}return 'User'}
function getUserRole(user=getUser()){return user.role||(user.email==='admin@assetflow.workspace'?'Administrator':'Workspace user')}
function openDetail(kind,id,updateHistory=true){let r=kind==='employee'?data.employees.find(x=>x.id===id):data.assets.find(x=>x.id===id);if(!r)return;backPage=currentPage;selected={kind,record:r};saveNavigationState();if(updateHistory){const targetHash=`#/${kind}/${encodeURIComponent(id)}`;if(window.location.hash!==targetHash){try{history.pushState(null,'',targetHash)}catch(e){window.location.hash=targetHash}}}renderPage();window.scrollTo(0,0)}
let chartSeriesVisibility={assigned:true,available:true,maintenance:true,other:true};
function refreshChartSeries(){Object.keys(chartSeriesVisibility).forEach(key=>{let on=chartSeriesVisibility[key];$$(`[data-chart-series="${key}"]`).forEach(b=>b.classList.toggle('active',on));$$(`[data-series-track="${key}"]`).forEach(el=>{el.style.opacity=on?'1':'0.08';el.style.filter=on?'none':'grayscale(1)'});});$$('[data-donut]').forEach(d=>{let keys=['assigned','available','maintenance','other'],values=keys.map(k=>chartSeriesVisibility[k]?Number(d.dataset[k]||0):0),sum=values.reduce((a,b)=>a+b,0)||1,stops=[],cursor=0,colors=['var(--ocean)','var(--aqua)','#e4a65c','#aebbc3'];values.forEach((v,i)=>{let next=cursor+v/sum*100;stops.push(`${colors[i]} ${cursor}% ${next}%`);cursor=next});d.style.background=`conic-gradient(${stops.join(',')})`});}
function bindPage(){// common nav and dashboard links
$$('[data-clear-filters]').forEach(b=>b.onclick=()=>{organizationFilter='All organizations';searchText='';statusFilter='All statuses';renderPage()});$$('[data-dash-tab]').forEach(b=>b.onclick=()=>{dashTab=b.dataset.dashTab;try{sessionStorage.setItem('assetflow-dash-tab',dashTab)}catch(e){}renderPage()});$$('[data-chart-series]').forEach(btn=>btn.onclick=()=>{let series=btn.dataset.chartSeries;chartSeriesVisibility[series]=!chartSeriesVisibility[series];refreshChartSeries();});refreshChartSeries();
$$('[data-category-filter]').forEach(el=>{el.onclick=()=>{statusFilter='All statuses';searchText=el.dataset.categoryFilter;currentPage='All Assets';renderNavAndPage();};el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}}});

$$('[data-goto]').forEach(b=>b.onclick=()=>navigate(b.dataset.goto));$$('[data-action]').forEach(b=>b.onclick=()=>handleAction(b.dataset.action));$$('[data-view]').forEach(b=>b.onclick=()=>openDetail(currentPage==='Employees'?'employee':'asset',b.dataset.view));$$('[data-request-return]').forEach(b=>b.onclick=()=>requestAssetReturn(b.dataset.requestReturn));$$('[data-view-return-request]').forEach(b=>b.onclick=()=>viewReturnRequest(b.dataset.viewReturnRequest));$$('[data-request-decision]').forEach(b=>b.onclick=()=>decideAssetRequest(b.dataset.requestDecision,b.dataset.decision));$$('[data-request-mail]').forEach(b=>b.onclick=()=>draftRequestEmail(b.dataset.requestMail));$$('[data-stock-category]').forEach(b=>b.onclick=()=>openStockManager(b.dataset.stockCategory));$$('[data-company-select]').forEach(b=>{b.onclick=()=>selectCompany(b.dataset.companySelect);b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectCompany(b.dataset.companySelect)}}});$$('[data-edit-company]').forEach(b=>b.onclick=e=>{e.stopPropagation();openCompanyEditor(b.dataset.editCompany)});$$('[data-filter-organization]').forEach(b=>b.onclick=()=>{organizationFilter=b.dataset.filterOrganization;renderPage()});$$('[data-company-reset]').forEach(b=>b.onclick=()=>{organizationFilter='All organizations';renderPage()});$$('[data-edit-return-request]').forEach(b=>b.onclick=()=>editReturnRequest(b.dataset.editReturnRequest));$$('[data-edit-record]').forEach(b=>b.onclick=()=>openForm(currentPage==='Employees'?'employee':'asset',b.dataset.editRecord));
let s=$('#moduleSearch');if(s)s.oninput=()=>{searchText=s.value;let pos=s.selectionStart;renderPage();let el=$('#moduleSearch');el.focus();el.setSelectionRange(pos,pos)};
$$('[data-filter-status]').forEach(b=>b.onclick=()=>{statusFilter=b.dataset.filterStatus;renderPage()});
$$('[data-dept]').forEach(b=>b.onclick=()=>{currentPage='Employees';searchText=b.dataset.dept;renderNavAndPage()});
let f=$('#settingsForm');if(f)f.onsubmit=async e=>{e.preventDefault();let fd=new FormData(f);try{await api('/api/settings',{method:'PUT',body:{org:fd.get('org'),prefix:fd.get('prefix')}});data.settings.org=fd.get('org');data.settings.prefix=fd.get('prefix');persist();await syncWithBackend();toast('Settings saved','Workspace preferences updated.');}catch(err){toast('Save failed',err.message);}};
}
function bindDetail(){$$('[data-action]').forEach(b=>b.onclick=()=>handleAction(b.dataset.action))}
function bindCommon(){$$('[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page))}
function viewReturnRequest(requestId){let q=(data.returnRequests||[]).find(x=>x.id===requestId);if(!q)return;$('#modalTitle').textContent='Return request details';$('#modalEyebrow').textContent='REQUEST OVERVIEW';$('#modalBody').innerHTML=`<div class="detail-grid">${[['Request ID',q.id],['Employee',q.employeeName],['Employee ID',q.employeeId],['Asset',q.assetName],['Asset ID',q.assetId],['Requested on',q.requestedOn],['Status',q.status],['Remarks',q.remarks||'—']].map(([k,v])=>`<div class="detail-field"><span>${k}</span><b>${esc(v||'—')}</b></div>`).join('')}</div><div class="form-actions"><button class="btn" id="closeReturnRequest">Close</button><button class="btn btn-primary" id="editFromReturnRequest">Edit request</button></div>`;$('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';$('#closeReturnRequest').onclick=closeModal;$('#editFromReturnRequest').onclick=()=>editReturnRequest(requestId)}
function editReturnRequest(requestId){let q=(data.returnRequests||[]).find(x=>x.id===requestId);if(!q)return;$('#modalTitle').textContent='Edit return request';$('#modalEyebrow').textContent='UPDATE REQUEST';$('#modalBody').innerHTML=`<form id="returnRequestForm"><div class="form-grid"><div class="form-field"><label>Request status *</label><div class="choice-grid">${['Requested','Approved','Declined','Completed'].map(v=>`<label class="choice-option ${q.status===v?'selected':''}"><input type="radio" name="status" value="${v}" ${q.status===v?'checked':''} required><span>${v}</span></label>`).join('')}</div></div><div class="form-field full"><label>Admin remarks</label><textarea name="remarks" placeholder="Add return instructions or notes">${esc(q.remarks||'')}</textarea></div></div><div class="form-actions"><button type="button" class="btn" id="cancelReturnRequest">Cancel</button><button type="submit" class="btn btn-primary">Save changes ${ic('arrow-right')}</button></div></form>`;$('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';$('#cancelReturnRequest').onclick=closeModal;$('#returnRequestForm').onchange=e=>{if(e.target.matches('input[type="radio"]'))e.target.closest('.choice-grid').querySelectorAll('.choice-option').forEach(x=>x.classList.toggle('selected',x.contains(e.target)))};$('#returnRequestForm').onsubmit=async e=>{e.preventDefault();let fd=new FormData(e.target);let nextStatus=fd.get('status'),nextRemarks=fd.get('remarks')||'';try{await api(`/api/returns/${encodeURIComponent(requestId)}`,{method:'PUT',body:{status:nextStatus,remarks:nextRemarks}});await syncWithBackend();closeModal();renderPage();toast('Return request updated','The request details have been saved.');}catch(err){toast('Update failed',err.message);}}}
async function requestAssetReturn(assetId){let asset=data.assets.find(a=>a.id===assetId&&a.status==='Assigned');if(!asset){toast('Request not created','This asset is no longer assigned.');return}try{const res=await api('/api/returns/requests',{method:'POST',body:{assetId:asset.id}});await syncWithBackend();renderPage();toast('Return request created',res.message||`A return request has been recorded.`);}catch(err){toast('Request failed',err.message);}}
async function decideAssetRequest(id,status){let r=data.requests.find(x=>x.id===id);if(!r||r.status!=='Pending')return;try{await api(`/api/requests/${encodeURIComponent(id)}/decision`,{method:'PUT',body:{decision:status}});await syncWithBackend();renderPage();toast(`Request ${status.toLowerCase()}`,`${r.employeeName}'s request has been ${status.toLowerCase()}.`);}catch(err){toast('Decision failed',err.message);}}
function draftRequestEmail(id){let r=data.requests.find(x=>x.id===id);if(!r)return;let emp=data.employees.find(e=>e.id===r.employeeId),email=emp?.email||'',subject=`Asset request ${r.status}: ${r.id}`,body=`Hello ${r.employeeName},\n\nYour request for ${r.asset} (${r.id}) has been reviewed.\nCurrent status: ${r.status}.\n\nRegards,\n${data.settings.org||'IT Asset Management'}`;$('#modalTitle').textContent='Draft employee email';$('#modalEyebrow').textContent='OPTIONAL EMAIL';$('#modalBody').innerHTML=`<div class="form-grid"><div class="form-field full"><label>To</label><input id="draftTo" value="${esc(email)}" type="email"></div><div class="form-field full"><label>Subject</label><input id="draftSubject" value="${esc(subject)}"></div><div class="form-field full"><label>Message</label><textarea id="draftBody" rows="8">${esc(body)}</textarea></div></div><p class="helper-text">This opens your default email application with the draft. No email is sent automatically.</p><div class="form-actions"><button class="btn" id="closeMailDraft">Close</button><button class="btn btn-primary" id="openMailDraft">${ic('mail')} Open email draft</button></div>`;$('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';$('#closeMailDraft').onclick=closeModal;$('#openMailDraft').onclick=()=>{api(`/api/requests/${encodeURIComponent(r.id)}/email`,{method:'POST',body:{to:$('#draftTo').value,subject:$('#draftSubject').value,message:$('#draftBody').value}}).catch(()=>{});window.location.href=`mailto:${encodeURIComponent($('#draftTo').value)}?subject=${encodeURIComponent($('#draftSubject').value)}&body=${encodeURIComponent($('#draftBody').value)}`;closeModal()}}
function openStockManager(category=''){let opts=CATS.map(c=>`<label class="choice-option ${category===c?'selected':''}"><input type="radio" name="stockCategory" value="${esc(c)}" ${category===c?'checked':''}><span>${esc(c)}</span></label>`).join('');$('#modalTitle').textContent='Adjust inventory stock';$('#modalEyebrow').textContent='INVENTORY CONTROL';$('#modalBody').innerHTML=`<form id="stockForm"><div class="form-field full"><label>Asset category *</label><div class="choice-grid choice-grid-many">${opts}</div></div><div class="form-field"><label>Adjustment *</label><div class="choice-grid"><label class="choice-option selected"><input type="radio" name="operation" value="add" checked><span>Add stock</span></label><label class="choice-option"><input type="radio" name="operation" value="remove"><span>Remove available stock</span></label></div></div><div class="form-field"><label>Quantity *</label><input name="quantity" type="number" min="1" step="1" value="1" required></div><div class="form-field full"><label>Reason / reference</label><textarea name="reason" placeholder="Purchase order, write-off reference or notes"></textarea></div><div class="form-actions"><button type="button" class="btn" id="cancelStock">Cancel</button><button class="btn btn-primary">Apply inventory adjustment</button></div></form>`;$('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';$('#cancelStock').onclick=closeModal;$('#stockForm').onsubmit=async e=>{e.preventDefault();let fd=new FormData(e.target),cat=fd.get('stockCategory'),op=fd.get('operation'),qty=Number(fd.get('quantity')),reason=fd.get('reason')||'';if(!cat||!Number.isInteger(qty)||qty<1)return;try{const res=await api('/api/categories/adjust-stock',{method:'POST',body:{stockCategory:cat,operation:op,quantity:qty,reason}});await syncWithBackend();closeModal();renderPage();toast('Inventory updated',res.message||'Inventory adjusted successfully.');}catch(err){toast('Adjustment failed',err.message);}}}
function openCompanyEditor(id){let c=data.companies.find(x=>x.id===id);if(!c)return;$('#modalTitle').textContent=`Edit ${c.id} company`;$('#modalEyebrow').textContent='COMPANY PROFILE';$('#modalBody').innerHTML=`<form id="companyForm"><div class="form-field full"><label>Company name</label><input name="name" value="${esc(c.name)}" required></div><div class="company-logo-edit-preview ${c.logo?'has-logo':''}">${c.logo?`<img src="${c.logo}" alt="Current logo">`:`<span>${esc(c.id)}</span>`}</div><div class="form-field full"><label>Upload company logo</label><input id="companyLogoFile" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"><small class="helper-text">Choose a PNG, JPG, WebP or SVG logo. The image is stored in this browser.</small></div><div class="form-actions company-form-actions"><button type="button" class="btn" id="removeCompanyLogo">${ic('trash-2')} Remove logo</button><button type="button" class="btn" id="cancelCompanyEdit">Cancel</button><button class="btn btn-primary">Save company</button></div></form>`;$('#modalBackdrop').hidden=false;document.body.style.overflow='hidden';let newLogo=c.logo;$('#companyLogoFile').onchange=e=>{let file=e.target.files[0];if(!file)return;if(file.size>1500000){toast('Logo is too large','Choose an image smaller than 1.5 MB.');e.target.value='';return}let reader=new FileReader();reader.onload=()=>{newLogo=reader.result;let preview=$('.company-logo-edit-preview');if(preview)preview.innerHTML=`<img src="${newLogo}" alt="New company logo">`};reader.readAsDataURL(file)};$('#removeCompanyLogo').onclick=()=>{newLogo='';toast('Logo will be removed','Save the company profile to confirm.')};$('#cancelCompanyEdit').onclick=closeModal;$('#companyForm').onsubmit=async e=>{e.preventDefault();let name=new FormData(e.target).get('name').trim()||c.id;let fileInput=$('#companyLogoFile');let file=fileInput?.files?.[0];try{if(file){let fd=new FormData();fd.append('name',name);fd.append('logoFile',file);await api(`/api/companies/${encodeURIComponent(c.id)}`,{method:'PUT',body:fd});}else{await api(`/api/companies/${encodeURIComponent(c.id)}`,{method:'PUT',body:{name,logo:newLogo}});}await syncWithBackend();closeModal();renderPage();toast('Company profile updated',`${c.id} details saved.`);}catch(err){toast('Update failed',err.message);}}}
function selectCompany(id){organizationFilter=id;searchText='';statusFilter='All statuses';currentPage='Employees';selected=null;renderNavAndPage();window.scrollTo(0,0)}
async function handleAction(a){if(a==='add-asset')openForm('asset');if(a==='add-employee')openForm('employee');if(a==='assign')openForm('assign');if(a==='return')openForm('return');if(a==='employee-assign')openForm('assign');if(a==='employee-transfer')openForm('transfer');if(a==='employee-edit')openForm('employee',selected.record.id);if(a==='maintenance')openForm('maintenance');if(a==='export-csv')exportCSV();if(a==='export-report-pdf')exportReportPDF('all');if(a==='export-report-csv')exportReportCSV('all');if(a==='export-json')download('assetflow-backup.json',JSON.stringify(data,null,2),'application/json');if(a==='print')window.print();if(a==='go-assign')navigate('Asset Assignments');if(a==='goto-settings')navigate('Settings');if(a==='back'){selected=null;currentPage=backPage||'All Assets';saveNavigationState();const r=PAGE_ROUTES[currentPage]||'dashboard';try{history.pushState(null,'',`#/${r}`)}catch(e){window.location.hash=`#/${r}`}renderNavAndPage()}if(a==='detail-edit')openForm(selected.kind,selected.record.id);if(a==='detail-delete'){if(confirm('Delete this record?')){try{if(selected.kind==='employee'){await api(`/api/employees/${encodeURIComponent(selected.record.id)}`,{method:'DELETE'});currentPage='Employees';}else{await api(`/api/assets/${encodeURIComponent(selected.record.id)}`,{method:'DELETE'});currentPage='All Assets';}await syncWithBackend();selected=null;saveNavigationState();const r=PAGE_ROUTES[currentPage]||'dashboard';try{history.pushState(null,'',`#/${r}`)}catch(e){window.location.hash=`#/${r}`}renderNavAndPage();toast('Record deleted');}catch(err){toast('Delete failed',err.message);}}}if(a==='reset'&&confirm('Restore the original workspace records? Your current local changes will be replaced.')){try{await api('/api/settings/reset',{method:'POST'});await syncWithBackend();renderNavAndPage();toast('workspace data restored');}catch(err){toast('Reset failed',err.message);}}if(a==='logout'){try{await api('/api/auth/logout',{method:'POST'});}catch(e){}localStorage.removeItem(TOKEN_KEY);localStorage.removeItem(SESSION);sessionStorage.removeItem('assetflow-active-page');sessionStorage.removeItem('assetflow-active-detail');window.location.hash='';$('#appShell').hidden=true;$('#authScreen').hidden=false;setAuthMode('login');}if(a==='add-category')openForm('category');if(a==='manage-stock')openStockManager()}
function openForm(type,id=null){
  let record=null;
  if(id)record=type==='employee'?data.employees.find(x=>x.id===id):data.assets.find(x=>x.id===id);
  let config=formConfig(type,record);
  $('#modalTitle').textContent=(record?'Edit ':'Add ')+config.title;
  $('#modalEyebrow').textContent=record?'EDIT RECORD':'NEW RECORD';{const subs={asset:'Register a device in your inventory.',employee:'Add a team member to the workspace.',assign:'Allocate an asset to an employee.',transfer:'Move an asset to another employee.',return:'Record an asset coming back.',maintenance:'Log a repair or service case.',category:'Create a new asset category.'};const icons={asset:'laptop',employee:'users',assign:'clipboard-check',transfer:'refresh',return:'package-check',maintenance:'wrench',category:'tags'};const ms=$('#modalSub');if(ms)ms.textContent=subs[type]||'';const mi=$('#modalIcon');if(mi)mi.innerHTML=ic(icons[type]||'box');}
  $('#modalBody').innerHTML=`<form id="recordForm"><div class="form-grid">${config.fields.map(f=>(config.sections&&config.sections[f[0]]?`<div class="form-section"><span>${config.sections[f[0]]}</span></div>`:'')+fieldHTML(f,record?.[f[0]])).join('')}</div><div class="form-actions"><button type="button" class="btn" id="cancelForm">Cancel</button><button type="submit" class="btn btn-primary">${record?'Save changes':'Create record'} ${ic('arrow-right')}</button></div></form>`;
  $('#modalBackdrop').hidden=false;
  document.body.style.overflow='hidden';
  $('#cancelForm').onclick=closeModal;

  let photoInput=$('#assetImageFile');
  if(photoInput){
    let preview=$('#assetPhotoPreview');
    let removeBtn=$('#removeAssetPhoto');
    let hiddenVal=$('#assetImageVal');
    photoInput.onchange=e=>{
      let file=e.target.files[0];
      if(!file)return;
      if(file.size>5*1024*1024){
        toast('Image too large','Choose an image smaller than 5 MB.');
        e.target.value='';
        return;
      }
      let reader=new FileReader();
      reader.onload=()=>{
        if(preview)preview.innerHTML=`<img src="${reader.result}" alt="Preview">`;
        if(removeBtn)removeBtn.style.display='inline-flex';const nm=$('#assetPhotoName');if(nm)nm.textContent=file.name;const pk=document.querySelector('.photo-pick span');if(pk)pk.textContent='Change photo';
      };
      reader.readAsDataURL(file);
    };
    if(removeBtn){
      removeBtn.onclick=()=>{
        photoInput.value='';
        if(hiddenVal)hiddenVal.value='';
        let currentCat=record?.category||$('input[name="category"]:checked')?.value||'Laptop';
        if(preview)preview.innerHTML=ic(getAssetCategoryIcon(currentCat));
        removeBtn.style.display='none';const nm=$('#assetPhotoName');if(nm)nm.textContent='PNG, JPG or WebP · up to 5 MB';const pk=document.querySelector('.photo-pick span');if(pk)pk.textContent='Choose photo';
      };
    }
  }

  $('#recordForm').onchange=e=>{
    if(e.target.matches('input[type="radio"]')){
      let group=e.target.closest('.choice-grid');
      group?.querySelectorAll('.choice-option').forEach(x=>x.classList.toggle('selected',x.contains(e.target)&&e.target.checked));
      if(e.target.name==='category'&&photoInput&&!photoInput.files.length&&!$('#assetImageVal')?.value){
        let preview=$('#assetPhotoPreview');
        if(preview)preview.innerHTML=ic(getAssetCategoryIcon(e.target.value));
      }
    }
  };
  $('#recordForm').onsubmit=e=>saveForm(e,type,record);
}
function formConfig(type,record){if(type==='employee')return{title:'employee',fields:[['id','Employee ID','text',true],['name','Full name','text',true],['organization','Organization','select',true,data.companies.map(c=>c.id)],['email','Email address','email',true],['phone','Contact number','tel',true],['department','Department','select',true,DEPTS],['designation','Designation','text',true],['joined','Joining date','date',false],['status','Employment status','select',true,['Active','On Leave','Inactive']],['location','Office location','text',false]],sections:{id:'Identity',email:'Contact details',department:'Work details'}};
if(type==='asset')return{title:'asset',fields:[['id','Asset ID','text',false],['image','Asset photo','file',false],['name','Asset name','text',true],['category','Category','select',true,CATS],['brand','Brand','text',true],['model','Model','text',false],['serial','Serial number','text',true],['purchaseDate','Purchase date','date',false],['price','Purchase price (₹)','number',false],['vendor','Vendor','text',false],['warranty','Warranty expiry','date',false],['location','Office location','text',false],['condition','Asset condition','select',true,['Excellent','Good','Fair','Poor','Damaged']],['status','Current status','select',true,ASSET_STATUS]],sections:{id:'Basic information',brand:'Product details',purchaseDate:'Purchase & warranty',location:'Location & status'}};
if(type==='assign')return{title:'asset assignment',fields:[['employeeId','Employee','select',true,data.employees.filter(e=>e.status==='Active').map(e=>`${e.id} · ${e.name}`)],['assetIds','Available asset IDs (comma separated)','text',true],['date','Assignment date','date',true],['expected','Expected return date','date',false],['remarks','Remarks','textarea',false]]};
if(type==='transfer')return{title:'asset transfer',fields:[['assetId','Currently assigned asset','select',true,data.assets.filter(a=>a.status==='Assigned').map(a=>`${a.id} · ${a.name} · ${a.employeeName}`)],['employeeId','Transfer to employee','select',true,data.employees.filter(e=>e.status==='Active').map(e=>`${e.id} · ${e.name}`)],['date','Transfer date','date',true],['remarks','Transfer remarks','textarea',false]]};
if(type==='return')return{title:'asset return',fields:[['assetId','Assigned asset','select',true,data.assets.filter(a=>a.status==='Assigned').map(a=>`${a.id} · ${a.name}`)],['date','Return date','date',true],['condition','Physical condition','select',true,['Excellent','Good','Fair','Poor','Damaged']],['remarks','Return remarks','textarea',false]]};
if(type==='maintenance')return{title:'maintenance case',fields:[['assetId','Asset ID','select',true,data.assets.map(a=>a.id)],['issue','Issue description','text',true],['reported','Reported date','date',true],['provider','Service provider','text',false],['cost','Estimated cost (₹)','number',false],['status','Maintenance status','select',true,['Reported','In Progress','Waiting for Parts','Completed']],['remarks','Remarks','textarea',false]]};
return{title:'asset category',fields:[['name','Category name','text',true],['group','Category group','select',false,['Computing','Display','Accessories','Mobile','Networking','Infrastructure','Other']]]}}
function fieldHTML(f,value=''){
  let [key,label,type,required,opts]=f;
  let v=value??(type==='date'?today():'');
  let input;
  if(type==='select'){
    let many=opts.length>8;
    input=`<div class="choice-grid ${many?'choice-grid-many':''}" role="group" aria-label="${esc(label)}">${opts.map((o,i)=>{let val=o.includes(' · ')?o.split(' · ')[0]:o;let chosen=String(v)===String(val);return `<label class="choice-option ${chosen?'selected':''}"><input type="radio" name="${key}" value="${esc(val)}" ${chosen?'checked':''} ${required&&i===0&&!v?'required':''}><span>${esc(o)}</span></label>`}).join('')}</div>`;
  }else if(type==='file'){
    let hasImg=Boolean(v);
    input=`<div class="asset-photo-preview-wrap">
      <div class="asset-photo-preview" id="assetPhotoPreview">${hasImg?`<img src="${esc(v)}" alt="Asset preview">`:`${ic('laptop')}`}</div>
      <div class="asset-photo-inputs">
        <input type="file" id="assetImageFile" name="imageFile" accept="image/png,image/jpeg,image/webp" class="photo-file-input">
        <input type="hidden" name="image" id="assetImageVal" value="${esc(v||'')}">
        <div class="photo-actions">
          <label for="assetImageFile" class="photo-pick">${ic('plus')} <span>${hasImg?'Change photo':'Choose photo'}</span></label>
          <button type="button" class="photo-remove" id="removeAssetPhoto" style="${hasImg?'':'display:none;'}" title="Remove photo">${ic('trash')} Remove</button>
        </div>
        <small class="helper-text photo-hint" id="assetPhotoName">PNG, JPG or WebP · up to 5 MB</small>
      </div>
    </div>`;
  }else if(type==='textarea')input=`<textarea name="${key}" placeholder="Enter ${esc(label.toLowerCase())}">${esc(v)}</textarea>`;
  else input=`<input name="${key}" type="${type||'text'}" value="${esc(v)}" ${required?'required':''} ${type==='number'?'min="0" step="1"':''} placeholder="Enter ${esc(label.toLowerCase())}">`;
  return `<div class="form-field ${type==='textarea'||type==='file'?'full':''}"><label>${esc(label)}${required?' *':''}</label>${input}</div>`;
}
async function saveForm(e,type,old){
  e.preventDefault();
  let form=e.target;
  let fd=new FormData(form),f=Object.fromEntries(fd.entries());
  try{
    if(type==='employee'){
      if(old){
        await api(`/api/employees/${encodeURIComponent(old.id)}`,{method:'PUT',body:f});
      }else{
        await api('/api/employees',{method:'POST',body:f});
      }
    }
    if(type==='asset'){
      let photoInput=form.querySelector('#assetImageFile');
      if(photoInput&&(!photoInput.files||photoInput.files.length===0)){
        fd.delete('imageFile');
      }
      if(old?.organization&&!fd.has('organization')){
        fd.append('organization',old.organization);
      }
      if(old?.employeeId&&!fd.has('employeeId')){
        fd.append('employeeId',old.employeeId);
      }
      if(old?.employeeName&&!fd.has('employeeName')){
        fd.append('employeeName',old.employeeName);
      }
      if(old){
        await api(`/api/assets/${encodeURIComponent(old.id)}`,{method:'PUT',body:fd});
      }else{
        await api('/api/assets',{method:'POST',body:fd});
      }
    }
    if(type==='assign'){
      await api('/api/assignments',{method:'POST',body:f});
    }
    if(type==='transfer'){
      await api('/api/assignments/transfer',{method:'POST',body:f});
    }
    if(type==='return'){
      await api('/api/returns',{method:'POST',body:f});
    }
    if(type==='maintenance'){
      await api('/api/maintenance',{method:'POST',body:f});
    }
    if(type==='category'){
      await api('/api/categories',{method:'POST',body:f});
      if(!CATS.includes(f.name))CATS.push(f.name);
    }
    await syncWithBackend();
    closeModal();
    if(selected&&selected.record){
      let updatedRecord=type==='employee'?data.employees.find(x=>x.id===selected.record.id):data.assets.find(x=>x.id===selected.record.id);
      if(updatedRecord)selected.record=updatedRecord;else selected=null;
    }else{
      selected=null;
    }
    renderNavAndPage();
    toast('Changes saved','Your workspace has been updated.');
  }catch(err){
    toast('Operation failed',err.message);
  }
}
function closeModal(){{const ms=$('#modalSub');if(ms)ms.textContent='';}$('#modalBackdrop').hidden=true;document.body.style.overflow=''}

function reportRows(kind){
 const employeeById=id=>data.employees.find(e=>e.id===id)||{};
 if(kind==='employees')return {name:'employee-directory',headers:['Employee ID','Full name','Email','Phone','Department','Designation','Location','Status','Date joined'],rows:data.employees.map(e=>[e.id,e.name,e.email,e.phone,e.department,e.designation,e.location,e.status,e.joined])};
 if(kind==='assignments')return {name:'asset-assignments',headers:['Assignment ID','Asset ID','Asset name','Employee ID','Employee name','Department','Assigned date','Expected return','Return date','Status','Remarks'],rows:data.assignments.map(x=>[x.id,x.assetId,x.assetName,x.employeeId,x.employeeName,x.department,x.date,x.expected,x.returnDate,x.status,x.remarks])};
 if(kind==='maintenance')return {name:'maintenance-register',headers:['Case ID','Asset ID','Issue','Reported date','Provider','Estimated cost (INR)','Status'],rows:data.maintenance.map(m=>[m.id,m.assetId,m.issue,m.reported,m.provider,m.cost,m.status])};
 if(kind==='categories')return {name:'category-summary',headers:['Category','Total assets','Assigned','Available','Under maintenance'],rows:CATS.map(c=>{let a=data.assets.filter(x=>x.category===c);return[c,a.length,a.filter(x=>x.status==='Assigned').length,a.filter(x=>x.status==='Available').length,a.filter(x=>x.status==='Under Maintenance').length]})};
 if(kind==='audit')return {name:'audit-activity',headers:['Action','Asset ID','Employee ID','Timestamp','Description'],rows:data.logs.map(l=>[l.action,l.assetId,l.employeeId,new Date(l.time).toLocaleString(),l.description])};
 return {name:'asset-inventory',headers:['Asset ID','Asset name','Category','Brand','Model','Serial number','Status','Employee ID','Employee name','Purchase date','Purchase price (INR)','Condition','Warranty'],rows:data.assets.map(a=>[a.id,a.name,a.category,a.brand,a.model,a.serial,a.status,a.employeeId,a.employeeName,a.purchaseDate,a.price,a.condition,a.warranty])};
}
function exportReportCSV(kind){
 const kinds=kind==='all'?['assets','employees','assignments','maintenance','categories','audit']:[kind];
 kinds.forEach(k=>{const r=reportRows(k),csv=[r.headers,...r.rows].map(row=>row.map(v=>{let s=String(v??'');return '"'+s.replaceAll('"','""')+'"'}).join(',')).join('\r\n');download(`assetflow-${r.name}.csv`,'\ufeff'+csv,'text/csv;charset=utf-8;')});
 toast('CSV export ready',kind==='all'?'Report files have been downloaded separately.':`${reportRows(kind).name} CSV is ready.`);
}
function exportReportPDF(kind='all'){
 const kinds=kind==='all'?['assets','employees','assignments','maintenance','categories','audit']:[kind];
 if(!window.jspdf?.jsPDF){toast('PDF library unavailable','Use Print report and choose Save as PDF, or reconnect to the internet to load the PDF exporter.');window.print();return}
 const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'pt',format:'a4'});
 const org=data.settings.org||'Organization',stamp=new Date().toLocaleString('en-IN');
 const total=data.assets.length,assigned=data.assets.filter(a=>a.status==='Assigned').length,value=data.assets.reduce((s,a)=>s+Number(a.price||0),0);
 let first=true;
 kinds.forEach(kindName=>{
  if(!first)doc.addPage();first=false;
  const r=reportRows(kindName);let y=48;
  doc.setFillColor(28,76,94);doc.rect(0,0,842,78,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(19);doc.text('ASSETFLOW',38,34);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text('ASSET MANAGEMENT · MANAGEMENT REPORT',38,53);
  doc.setFontSize(10);doc.text(org,804,33,{align:'right'});doc.text(`Generated ${stamp}`,804,51,{align:'right'});
  y=106;doc.setTextColor(30,48,58);doc.setFont('helvetica','bold');doc.setFontSize(17);doc.text(r.name.replaceAll('-',' ').replace(/\b\w/g,c=>c.toUpperCase()),38,y);
  y+=19;doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(105,120,128);doc.text(`Confidential workspace export  •  ${r.rows.length} records`,38,y);
  if(kindName==='assets'||kindName==='categories'){
   y+=28;doc.setFillColor(241,247,249);doc.roundedRect(38,y-13,766,43,6,6,'F');doc.setTextColor(35,65,77);doc.setFont('helvetica','bold');doc.setFontSize(9);
   doc.text(`Total assets: ${total}`,52,y+3);doc.text(`Assigned: ${assigned}`,220,y+3);doc.text(`Assignment rate: ${total?Math.round(assigned/total*100):0}%`,355,y+3);doc.text(`Inventory value: ${money(value)}`,540,y+3);y+=44;
  }else y+=25;
  const margin=38,usable=766,cols=r.headers.length,colW=usable/cols,headerH=25,rowH=18;
  const drawHeader=()=>{doc.setFillColor(50,148,177);doc.rect(margin,y-13,usable,headerH,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(Math.min(8,Math.max(5,8-cols*.13)));r.headers.forEach((h,i)=>doc.text(String(h).slice(0,25),margin+i*colW+5,y+3,{maxWidth:colW-8}));y+=headerH};
  drawHeader();doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(55,70,77);
  r.rows.forEach((row,idx)=>{
   if(y>555){doc.addPage();y=48;drawHeader();doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(55,70,77)}
   if(idx%2===0){doc.setFillColor(246,249,250);doc.rect(margin,y-12,usable,rowH,'F')}
   row.forEach((cell,i)=>{let s=String(cell??'—').replace(/\s+/g,' ');if(s.length>32)s=s.slice(0,29)+'…';doc.text(s,margin+i*colW+5,y,{maxWidth:colW-9})});y+=rowH;
  });
  doc.setFontSize(7);doc.setTextColor(130,140,145);doc.text(`AssetFlow · ${org} · Page ${doc.internal.getNumberOfPages()}`,margin,580);
 });
 doc.save(`assetflow-${kind==='all'?'management-report':reportRows(kind).name}.pdf`);
 toast('PDF report downloaded','Your report is ready to share or archive.');
}

function exportCSV(){let rows=[['Asset ID','Asset name','Category','Brand','Model','Serial number','Status','Employee ID','Employee name','Purchase price'],...data.assets.map(a=>[a.id,a.name,a.category,a.brand,a.model,a.serial,a.status,a.employeeId,a.employeeName,a.price])];download('assetflow-inventory.csv',rows.map(r=>r.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n'),'text/csv');toast('CSV exported','Inventory download is ready.')}
function download(name,content,type){let url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function toggleSidebar(show){$('#sidebar').classList.toggle('open',show);$('#scrim').classList.toggle('show',show)}
function notices(){let items=[];let overdue=data.assets.filter(a=>a.status==='Assigned'&&a.warranty&&a.warranty<today()).length;if(overdue)items.push(['Warranty expired',`${overdue} assigned asset warranties have expired.`]);let m=data.assets.filter(a=>a.status==='Under Maintenance').length;if(m)items.push(['Maintenance attention',`${m} assets are currently under maintenance.`]);let req=data.requests.filter(r=>r.status==='Pending').length;if(req)items.push(['Pending requests',`${req} employee requests need review.`]);return items}
function toggleNotifications(){let p=$('#noticePanel');if(!p.hidden){closeNotices();return}let n=notices();p.innerHTML=`<div class="panel-head"><div><h3>Notifications</h3><p>Items that may need your attention</p></div><button class="icon-btn" id="closeNotices">${ic('x')}</button></div>${n.length?n.map(x=>`<div class="notice-row"><span class="notice-dot"></span><div><b>${esc(x[0])}</b><p>${esc(x[1])}</p></div></div>`).join(''):'<p class="helper-text">You are all caught up. No new alerts.</p>'}`;p.hidden=false;$('#closeNotices').onclick=closeNotices}
function closeNotices(){$('#noticePanel').hidden=true}
function initAuth(){
  $$('[data-auth]').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.auth));
  $('#togglePassword').onclick=()=>{let p=$('#authPassword');p.type=p.type==='password'?'text':'password';$('#togglePassword').innerHTML=ic(p.type==='password'?'eye':'eye-off')};
  $('#forgotPassword').onclick=()=>toast('Password reset unavailable','Contact workspace administrator to reset account password.');
  $('#authForm').onsubmit=async e=>{
    e.preventDefault();
    let email=$('#authEmail').value.trim().toLowerCase(),password=$('#authPassword').value,name=$('#authName').value.trim(),err=$('#authError');
    err.textContent='';
    try{
      let res;
      if(authMode==='signup'){
        if(!name){err.textContent='Please enter your name.';return}
        res=await api('/api/auth/register',{method:'POST',body:{name,email,password}});
      }else{
        res=await api('/api/auth/login',{method:'POST',body:{email,password}});
      }
      if(res&&res.token){
        localStorage.setItem(TOKEN_KEY,res.token);
        localStorage.setItem(SESSION,JSON.stringify(res.user));
        showAppShellOnly(res.user);
        showPageLoader('Loading workspace records…');
        await syncWithBackend();
        restoreNavigationFromUrl();
        showApp(res.user);
      }
    }catch(error){
      err.textContent=error.message||'Authentication failed. Please check your credentials.';
    }
  }
}
function setAuthMode(m){authMode=m;let sign=m==='signup';$$('[data-auth]').forEach(b=>b.classList.toggle('active',b.dataset.auth===m));$('#authNameWrap').hidden=!sign;$('#authName').required=sign;$('#authEyebrow').textContent=sign?'GET STARTED':'WELCOME BACK';$('#authTitle').textContent=sign?'Create your AssetFlow account':'Sign in to your workspace';$('#authSubtitle').textContent=sign?'Set up your local workspace account to get started.':'Enter your details to continue to your asset dashboard.';$('#authSubmit').innerHTML=sign?'Create account '+ic('arrow-right'):'Sign in '+ic('arrow-right');$('#authPassword').autocomplete=sign?'new-password':'current-password';$('#authError').textContent=''}
function showApp(user){const identity={...user,name:getDisplayName(user)};$('#authScreen').hidden=true;$('#appShell').hidden=false;localStorage.setItem(SESSION,JSON.stringify(identity));const name=identity.name;$('#profileName').textContent=name;$('#profileInitials').textContent=initials(name);$('#topInitials').textContent=initials(name);$('#profileRole').textContent=getUserRole(identity);$('#topInitials').setAttribute('aria-label',`Open profile for ${name}`);$('#topDate').textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'});renderNavAndPage()}
async function init(){
  renderStaticIcons();
  initAuth();
  document.addEventListener('click',e=>{
    const exp=e.target.closest('[data-expand-photo]');
    if(exp){
      e.preventDefault();
      e.stopPropagation();
      openPhotoLightbox(exp.dataset.expandPhoto, exp.dataset.expandTitle||'Asset photo');
      return;
    }
    const csv=e.target.closest('[data-report-csv]');
    const pdf=e.target.closest('[data-report-pdf]');
    if(csv)exportReportCSV(csv.dataset.reportCsv);
    if(pdf)exportReportPDF(pdf.dataset.reportPdf);
  });
  window.addEventListener('popstate',()=>{
    restoreNavigationFromUrl();
    renderNavAndPage();
  });
  $('#menuToggle').onclick=()=>toggleSidebar(true);
  $('#closeSidebar').onclick=()=>toggleSidebar(false);
  $('#scrim').onclick=()=>toggleSidebar(false);
  $('#profileBtn').onclick=()=>navigate('My Profile');
  $('#topInitials').onclick=()=>navigate('My Profile');
  const reloadBtn=$('#reloadBtn');
  if(reloadBtn)reloadBtn.onclick=reloadRightPane;
  $('#notificationBtn').onclick=toggleNotifications;
  $('#modalClose').onclick=closeModal;
  $('#modalBackdrop').onclick=e=>{if(e.target===$('#modalBackdrop'))closeModal()};
  $('#globalSearch').oninput=e=>{let q=e.target.value.trim();if(!q){searchText='';if(currentPage==='All Assets'||currentPage==='Employees')renderPage();return}searchText=q;if(currentPage!=='All Assets'&&currentPage!=='Employees')currentPage='All Assets';renderNavAndPage()};
  $('#globalSearch').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();navigate('All Assets');$('#moduleSearch')?.focus()}};
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus()}
    if(e.key==='Escape'){closeModal();closeNotices();closePhotoLightbox()}
  });
  $('#topDate').textContent=new Date().toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short'});

  const token=getToken();
  if(token){
    try{
      restoreNavigationFromUrl();
      const cachedUser=getUser();
      if(cachedUser&&(cachedUser.email||cachedUser.name)){
        showAppShellOnly(cachedUser);
        showPageLoader('Loading workspace records…');
      }
      const res=await api('/api/auth/me');
      if(res&&res.user){
        await syncWithBackend();
        restoreNavigationFromUrl();
        showApp(res.user);
        return;
      }
    }catch(err){
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION);
    }
  }
  document.documentElement.classList.remove('has-session');
  $('#authScreen').hidden=false;
  $('#appShell').hidden=true;
  setAuthMode('login');
}
init();

// Company logos: fall back to the company initials when an image fails to load.
document.addEventListener('error',e=>{
  const t=e.target;
  if(!t||t.tagName!=='IMG')return;
  const box=t.closest('.company-logo-display,.company-mini-logo,.combined-company-avatar,.company-logo-edit-preview,.settings-company-logo,.company-chart-brand');
  if(!box)return;
  const id=(t.alt||'').trim().slice(0,2).toUpperCase()||'•';
  const span=document.createElement('span');
  span.textContent=box.closest('[data-company-select]')?.dataset.companySelect||id;
  t.replaceWith(span);
},true);
