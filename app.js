const categories=['全部工具',...toolCategories];
const main=document.querySelector('#main');
const grid=document.querySelector('#toolGrid');
const pinnedSection=document.querySelector('#pinnedTools');
const pinnedGrid=document.querySelector('#pinnedGrid');
const pinnedCount=document.querySelector('#pinnedCount');
const pinnedEmpty=document.querySelector('#pinnedEmpty');
const choosePinned=document.querySelector('#choosePinned');
const pinNotice=document.querySelector('#pinNotice');
const search=document.querySelector('#search');
const panel=document.querySelector('#searchPanel');
const filters=document.querySelector('#filters');
const resultBar=document.querySelector('#results');
const resultText=document.querySelector('#resultText');
const announcement=document.querySelector('#announcement');
const searchToggle=document.querySelector('#searchToggle');
const filterToggle=document.querySelector('#filterToggle');
const viewToggle=document.querySelector('#viewToggle');
let category='全部工具';
let listView=false;
const iconColors=['#31577a','#6d4b85','#a45743','#3f675c','#645b36','#57548c','#3f5f78','#744e60'];
const collapseStorageKey='chemhub.collapsed-categories.v1';
const collapsedCategories=new Set(toolCategories);
try{
  const stored=JSON.parse(localStorage.getItem(collapseStorageKey));
  if(Array.isArray(stored)){
    collapsedCategories.clear();
    stored.forEach(name=>{
      // Restore the renamed category without resetting existing browse preferences.
      const currentName=name==='文献专利'?'文献专利搜索':name;
      if(toolCategories.includes(currentName))collapsedCategories.add(currentName);
    });
  }
}catch{/* Keep the default collapsed state when storage is invalid or unavailable. */}

const pinStorageKey='chemhub.pinned-tools.v1';
let pinnedUrls=new Set();
let pinStorageAvailable=true;
let renderedPinsKey=null;
function parsePinnedUrls(value){
  try{
    const stored=JSON.parse(value);
    return new Set(Array.isArray(stored)?stored.filter(url=>typeof url==='string'&&tools.some(tool=>tool.u===url)):[]);
  }catch{return new Set()}
}
try{pinnedUrls=parsePinnedUrls(localStorage.getItem(pinStorageKey))}
catch{pinStorageAvailable=false}

function categoryCount(name){return name==='全部工具'?tools.length:tools.filter(tool=>tool.c===name).length}
function escapeHtml(value){return String(value).replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]))}
function hostname(url){try{return new URL(url).hostname.replace(/^www\./,'')}catch{return url}}
function logo(tool,className='tool-logo'){
  const index=tools.indexOf(tool);
  const image=tool.icon===false?'':`<img src="assets/icons/${index}.png" alt="" loading="lazy" onerror="this.remove()">`;
  return `<span class="${className}" style="--icon-bg:${iconColors[index%iconColors.length]}"><span class="monogram">${escapeHtml(tool.i)}</span>${image}</span>`;
}
function pinButton(tool,removeOnly=false){
  const pinned=pinnedUrls.has(tool.u),name=escapeHtml(tool.n);
  const state=removeOnly?' data-unpin':` aria-pressed="${pinned}"`;
  return `<button type="button" class="pin-toggle${removeOnly?' pin-remove':''}" data-pin-toggle="${tools.indexOf(tool)}"${state} aria-label="${removeOnly?'取消置顶':'置顶'} ${name}" title="${removeOnly||pinned?'取消置顶':'置顶到顶部'}"><svg aria-hidden="true"><use href="#${removeOnly?'i-close':'i-pin'}"/></svg></button>`;
}
function card(tool){
  const name=escapeHtml(tool.n),desc=escapeHtml(tool.d),cat=escapeHtml(tool.c),url=escapeHtml(tool.u),host=escapeHtml(hostname(tool.u));
  return `<article class="tool-item" data-tool="${tools.indexOf(tool)}"><a class="tool-card" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="打开 ${name}">
    <span class="card-head">${logo(tool)}<span class="card-title"><span class="tool-name">${name}</span><span class="tool-domain">${host}</span></span></span>
    <span class="tool-desc">${desc}</span>
    <span class="tool-tags"><span class="tool-tag"><svg><use href="#i-web"/></svg>网页端</span></span>
    <span class="card-foot"><span class="category">${cat}</span><span class="visit">访问官网</span></span>
  </a>${pinButton(tool)}<a class="tool-detail" href="tools/${escapeHtml(tool.slug)}/" aria-label="查看 ${name} 详情">详情</a></article>`;
}
function pinnedCard(tool){
  const name=escapeHtml(tool.n);
  return `<div class="pinned-item" data-tool="${tools.indexOf(tool)}"><a class="pinned-link" href="${escapeHtml(tool.u)}" target="_blank" rel="noopener noreferrer" aria-label="打开置顶工具 ${name}">${logo(tool,'pinned-logo')}<span class="pinned-text"><span class="pinned-name">${name}</span><span class="pinned-domain">${escapeHtml(hostname(tool.u))}</span></span></a>${pinButton(tool,true)}</div>`;
}
function renderPinned(){
  pinnedSection.hidden=Boolean(search.value.trim()||category!=='全部工具');
  pinNotice.hidden=pinStorageAvailable;
  pinnedCount.textContent=`${pinnedUrls.size} 个`;
  pinnedEmpty.hidden=pinnedUrls.size>0;
  const key=JSON.stringify([...pinnedUrls]);
  if(key===renderedPinsKey)return;
  const active=document.activeElement;
  const activeItem=active?.closest('.pinned-item');
  const oldPosition=activeItem&&pinnedGrid.contains(activeItem)?[...pinnedGrid.children].indexOf(activeItem):-1;
  const oldIndex=activeItem?.dataset.tool;
  const removeFocused=Boolean(active?.matches('button[data-unpin]'));
  pinnedGrid.innerHTML=[...pinnedUrls].map(url=>tools.find(tool=>tool.u===url)).filter(Boolean).map(pinnedCard).join('');
  renderedPinsKey=key;
  if(oldPosition>=0&&!pinnedSection.hidden){
    const nextItem=pinnedGrid.querySelector(`[data-tool="${oldIndex}"]`)||pinnedGrid.children[Math.min(oldPosition,pinnedGrid.children.length-1)];
    (nextItem?.querySelector(removeFocused?'button[data-unpin]':'.pinned-link')||choosePinned).focus({preventScroll:true});
  }
}
function syncPinButtons(){
  grid.querySelectorAll('button[data-pin-toggle]').forEach(button=>{
    const tool=tools[Number(button.dataset.pinToggle)];
    if(!tool)return;
    const pinned=pinnedUrls.has(tool.u);
    button.setAttribute('aria-pressed',String(pinned));
    button.title=pinned?'取消置顶':'置顶到顶部';
  });
}
function togglePinned(button){
  const index=button.dataset.pinToggle;
  const tool=/^\d+$/.test(index)?tools[Number(index)]:null;
  if(!tool)return;
  button.focus({preventScroll:true});
  const removing=button.hasAttribute('data-unpin')||pinnedUrls.has(tool.u);
  removing?pinnedUrls.delete(tool.u):pinnedUrls.add(tool.u);
  try{
    localStorage.setItem(pinStorageKey,JSON.stringify([...pinnedUrls]));
    pinStorageAvailable=true;
  }catch{pinStorageAvailable=false}
  // Keep category nodes, temporary folding and the originating button intact.
  syncPinButtons();
  renderPinned();
  announcement.textContent=`${tool.n}${removing?'已取消置顶':'已置顶'}，共 ${pinnedUrls.size} 个置顶工具${pinStorageAvailable?'':'（仅本页有效）'}`;
}
function groupedCards(visible,revealMatches){
  return categories.slice(1).map(name=>{
    const items=orderCategoryTools(visible.filter(tool=>tool.c===name),name);
    if(!items.length)return '';
    const headingId=`tool-category-${categories.indexOf(name)}`;
    const contentId=`${headingId}-cards`,countId=`${headingId}-count`;
    const expanded=revealMatches||!collapsedCategories.has(name);
    return `<section class="tool-group${expanded?'':' is-collapsed'}" aria-labelledby="${headingId}">
      <div class="group-heading"><h2 id="${headingId}"><button type="button" class="group-toggle" data-group-toggle="${escapeHtml(name)}" aria-expanded="${expanded}" aria-controls="${contentId}" aria-describedby="${countId}" title="${expanded?'收起':'展开'} ${escapeHtml(name)}"><span>${escapeHtml(name)}</span><svg class="group-chevron" aria-hidden="true"><use href="#i-arrow"/></svg></button></h2><span id="${countId}" class="group-count">${items.length} 个资源</span><span class="group-line" aria-hidden="true"></span></div>
      <div id="${contentId}" class="group-grid"${expanded?'':' hidden'}>${items.map(card).join('')}</div>
    </section>`;
  }).join('');
}
function toggleGroup(button){
  const name=button.dataset.groupToggle;
  const content=document.getElementById(button.getAttribute('aria-controls'));
  if(!content)return;
  const expanded=button.getAttribute('aria-expanded')!=='true';
  content.hidden=!expanded;
  button.setAttribute('aria-expanded',String(expanded));
  button.title=`${expanded?'收起':'展开'} ${name}`;
  button.closest('.tool-group').classList.toggle('is-collapsed',!expanded);
  // Search/category results open temporarily without changing the normal browsing preference.
  if(!search.value.trim()&&category==='全部工具'){
    expanded?collapsedCategories.delete(name):collapsedCategories.add(name);
    try{localStorage.setItem(collapseStorageKey,JSON.stringify([...collapsedCategories]))}catch{/* Keep working in memory. */}
  }
  announcement.textContent=`${name}已${expanded?'展开':'收起'}，${content.querySelectorAll('.tool-card').length} 个资源`;
}
function drawFilters(){
  filters.innerHTML=categories.map(name=>`<button type="button" data-category="${escapeHtml(name)}" aria-pressed="${name===category}">${escapeHtml(name)}<span class="filter-count">${categoryCount(name)}</span></button>`).join('');
}
function render(){
  const query=search.value.trim().toLowerCase();
  const visible=tools.filter(tool=>(category==='全部工具'||tool.c===category)&&(!query||(tool.n+tool.d+tool.c).toLowerCase().includes(query)));
  const filtering=Boolean(query||category!=='全部工具');
  grid.innerHTML=visible.length?groupedCards(visible,filtering):`<div class="empty"><strong>没有找到相关工具</strong>换个关键词，或者清除当前筛选条件。</div>`;
  resultBar.hidden=!filtering;
  resultText.textContent=`${query?`“${search.value.trim()}” · `:''}${category} · ${visible.length} 个结果`;
  announcement.textContent=`共 ${visible.length} 个资源`;
  document.querySelector('#total').textContent=`收录 ${tools.length} 个精选资源`;
  drawFilters();
  renderPinned();
  reservePanelSpace();
  if(!panel.hidden)main.scrollIntoView({block:'start'});
}
function reservePanelSpace(){
  // The floating panel must not cover result links or their pin controls.
  const space=panel.hidden?0:Math.max(0,panel.offsetTop+panel.offsetHeight-panel.parentElement.offsetHeight+12);
  main.style.setProperty('--search-space',`${space}px`);
}
function openPanel(focusSearch=false){
  panel.hidden=false;
  searchToggle.setAttribute('aria-expanded','true');
  filterToggle.setAttribute('aria-expanded','true');
  reservePanelSpace();
  main.scrollIntoView({block:'start'});
  if(focusSearch)requestAnimationFrame(()=>search.focus());
}
function closePanel(){
  panel.hidden=true;
  searchToggle.setAttribute('aria-expanded','false');
  filterToggle.setAttribute('aria-expanded','false');
  reservePanelSpace();
}
function reset(){category='全部工具';search.value='';render()}
function setListView(enabled){
  listView=enabled;grid.classList.toggle('list',enabled);pinnedGrid.classList.toggle('list',enabled);
  viewToggle.setAttribute('aria-pressed',String(enabled));
  viewToggle.setAttribute('aria-label',enabled?'切换为网格视图':'切换为列表视图');
  viewToggle.title=enabled?'切换为网格视图':'切换为列表视图';
}

document.querySelector('#browse').addEventListener('click',()=>{reset();closePanel();main.focus({preventScroll:true});main.scrollIntoView({block:'start'})});
choosePinned.addEventListener('click',()=>openPanel(true));
main.addEventListener('click',event=>{
  const button=event.target.closest('button[data-pin-toggle]');
  if(!button)return;
  event.stopPropagation();
  togglePinned(button);
});
filterToggle.addEventListener('click',()=>panel.hidden?openPanel(false):closePanel());
searchToggle.addEventListener('click',()=>panel.hidden?openPanel(true):closePanel());
document.querySelector('#closePanel').addEventListener('click',closePanel);
document.querySelector('#reset').addEventListener('click',reset);
viewToggle.addEventListener('click',()=>setListView(!listView));
search.addEventListener('input',render);
grid.addEventListener('click',event=>{
  const button=event.target.closest('button[data-group-toggle]');
  if(button)toggleGroup(button);
});
filters.addEventListener('click',event=>{
  const button=event.target.closest('[data-category]');if(!button)return;
  category=button.dataset.category;render();
});
document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openPanel(true)}
  if(event.key==='Escape'&&!panel.hidden){closePanel();searchToggle.focus()}
});
document.addEventListener('click',event=>{
  // Rendering a category replaces its button; the original event path still identifies an inside click.
  if(!panel.hidden&&!event.composedPath().includes(panel)&&!event.target.closest('#searchToggle, #filterToggle, #choosePinned'))closePanel();
});
window.addEventListener('resize',reservePanelSpace);
window.addEventListener('storage',event=>{
  if(event.key!==pinStorageKey&&event.key!==null)return;
  try{
    if(event.storageArea!==localStorage)return;
    pinnedUrls=parsePinnedUrls(localStorage.getItem(pinStorageKey));
    pinStorageAvailable=true;
  }catch{pinStorageAvailable=false}
  syncPinButtons();
  renderPinned();
});
render();
