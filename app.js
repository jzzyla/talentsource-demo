import {predict} from './inference.js';
const $ = id => document.getElementById(id);
const labels={baseline:'Mean baseline',ridge:'Ridge regression',forest:'Random forest'};
const notes={baseline:'The same training-set average for every profile. A reference to beat, not a chemistry-aware model.',ridge:'A standardized linear model. Easy to inspect; cannot capture complex interactions.',forest:'An ensemble of 60 trees capturing nonlinear relationships. Its output is not a confidence score.'};
let summary, models;
const savedWines = {a:null,b:null};
function openTab(id){ $(`tab-${id}`).click(); }
function renderComparison(){
 const modelName=$('compare-model').value;
 const cards=$('wine-cards');cards.replaceChildren();
 for(const slot of ['a','b']){
  const wine=savedWines[slot], title=`Wine ${slot.toUpperCase()}`;
  const card=document.createElement('article');card.className='wine-card';
  const tag=document.createElement('p');tag.className='eyebrow';tag.textContent=title;
  const heading=document.createElement('h3');heading.textContent=wine ? wine.name : `Add ${title}`;
  card.append(tag,heading);
  if(wine){
   const score=document.createElement('p');score.className='compare-score';score.textContent=`${predict(models[modelName],wine.values).toFixed(2)} / 10`;
   const detail=document.createElement('p');detail.className='muted';detail.textContent=`${labels[modelName]} · holdout MAE ${summary.metrics[modelName].mae.toFixed(3)}`;
   card.append(score,detail);
   const outside=summary.schema.filter((f,i)=>wine.values[i]<f.min||wine.values[i]>f.max);
   if(outside.length){const warning=document.createElement('p');warning.className='notice';warning.textContent=`Outside observed range: ${outside.map(f=>f.name).join(', ')}. Extrapolation may be unreliable.`;card.append(warning);}
  }else{const hint=document.createElement('p');hint.className='muted';hint.textContent='Enter measurements in the Prediction studio, then save this profile.';card.append(hint);}
  const actions=document.createElement('div');actions.className='compare-actions';
  const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent=wine?'Edit profile':'Enter profile';
  edit.addEventListener('click',()=>{
   if(wine){summary.schema.forEach((f,i)=>$(`input-${i}`).value=wine.values[i]);$('wine-name').value=wine.name;estimate();}
   openTab('predict');$('wine-name').focus();
  });actions.append(edit);
  if(wine){const remove=document.createElement('button');remove.type='button';remove.className='text-button';remove.textContent=`Remove ${title}`;remove.addEventListener('click',()=>{savedWines[slot]=null;renderComparison();$('compare-model').focus();});actions.append(remove);}
  card.append(actions);cards.append(card);
 }
 const both=savedWines.a&&savedWines.b;
 $('measurement-comparison').hidden=!both;
 $('compare-measurements').replaceChildren();
 if(!both){$('compare-summary').textContent='Save both wines to see the score gap and measurement differences.';return;}
 const gap=predict(models[modelName],savedWines.b.values)-predict(models[modelName],savedWines.a.values);
 $('compare-summary').textContent=Math.abs(gap)<0.005?'Both wines have the same estimated score to two decimal places.':`Wine ${gap>0?'B':'A'} has a higher estimated score by ${Math.abs(gap).toFixed(2)} quality points with ${labels[modelName]}.`;
 summary.schema.forEach((f,i)=>{
  const a=savedWines.a.values[i],b=savedWines.b.values[i],difference=b-a;
  const row=document.createElement('tr');if(a!==b)row.className='measurement-changed';
  const label=document.createElement('th');label.scope='row';label.textContent=f.name;row.append(label);
  for(const value of [a,b,difference===0?'—':`${difference>0?'+':''}${Number(difference.toPrecision(8))}`]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
  $('compare-measurements').append(row);
 });
}
function saveWine(slot){
 if(!$('wine-form').reportValidity())return;
 const values=summary.schema.map((f,i)=>Number($(`input-${i}`).value));
 if(values.some(v=>!Number.isFinite(v)))return;
 savedWines[slot]={name:$('wine-name').value.trim()||`Wine ${slot.toUpperCase()}`,values};
 $('save-status').textContent=`${savedWines[slot].name} saved as Wine ${slot.toUpperCase()}. ${savedWines.a&&savedWines.b?'Both wines are ready to compare.':'Save another profile to complete your comparison.'}`;
 renderComparison();
}
async function load(path){const r=await fetch(path);if(!r.ok)throw new Error(`Could not load ${path}: ${r.status}`);return r.json();}
function estimate(){
 const name=$('model').value, m=summary.metrics[name];
 $('mae').textContent=m.mae.toFixed(3);$('r2').textContent=m.r2.toFixed(3);$('model-note').textContent=notes[name];
 const valid=summary.schema.every((f,i)=>{const input=$(`input-${i}`);return input.validity.valid && Number.isFinite(input.valueAsNumber);});
 if(!valid){
  $('score').textContent='—';
  $('interpretation').textContent='Complete all measurements with valid numbers to see an estimate.';
  $('marker').hidden=true;
  $('range-warning').hidden=true;
  return;
 }
 const values=summary.schema.map((f,i)=>Number($(`input-${i}`).value));
 const outside=summary.schema.filter((f,i)=>values[i]<f.min || values[i]>f.max);
 const result=predict(models[name],values);
 $('score').textContent=result.toFixed(2);
 $('marker').hidden=false;
 $('interpretation').textContent='Estimated sensory quality · continuous prediction';
 $('marker').style.left=`${Math.max(0,Math.min(100,result*10))}%`;
 $('range-warning').hidden=!outside.length;
 $('range-warning').textContent=`Outside observed range: ${outside.map(f=>f.name).join(', ')}. Extrapolation may be unreliable.`;
}
try {
 [summary, ...models]=await Promise.all(['summary','baseline','ridge','forest'].map(n=>load(`./models/${n}.json`)));
 models=Object.fromEntries(models.map(m=>[m.name,m]));
 for(const [i,f] of summary.schema.entries()){
  const div=document.createElement('div');div.className='field';
  const label=document.createElement('label');label.htmlFor=`input-${i}`;label.textContent=f.name.replace(/\b\w/g,c=>c.toUpperCase());
  const input=document.createElement('input');input.id=`input-${i}`;input.name=f.name;input.type='number';input.step='any';input.required=true;input.value=f.default;input.setAttribute('aria-describedby',`range-${i}`);
  const hint=document.createElement('small');hint.id=`range-${i}`;hint.textContent=`Observed: ${f.min} – ${f.max}`;
  div.append(label,input,hint);$('inputs').append(div);
 }
 const max=Math.max(...Object.values(summary.distribution));
 for(const [score,count] of Object.entries(summary.distribution)){
  const col=document.createElement('div');col.className='bar-column';
  const n=document.createElement('small');n.textContent=count;
  const bar=document.createElement('div');bar.className='bar';bar.style.height=`${count/max*145}px`;bar.setAttribute('aria-hidden','true');col.setAttribute('aria-label',`Quality ${score}: ${count} wines`);
  const x=document.createElement('span');x.textContent=score;col.append(n,bar,x);$('distribution').append(col);
 }
 for(const f of summary.correlations){
  const row=document.createElement('div');row.className='corr';
  const label=document.createElement('span');label.textContent=f.name;
  const track=document.createElement('div');track.className='corr-track';const bar=document.createElement('i');bar.style.width=`${Math.abs(f.correlation)*100}%`;if(f.correlation<0)bar.className='negative';track.append(bar);
  const value=document.createElement('span');value.textContent=f.correlation.toFixed(2);row.append(label,track,value);$('correlations').append(row);
 }
 for(const [name,m] of Object.entries(summary.metrics)){
  const row=document.createElement('tr');for(const v of [labels[name],m.mae.toFixed(3),m.rmse.toFixed(3),m.r2.toFixed(3)]){const cell=document.createElement('td');cell.textContent=v;row.append(cell);}$('metrics').append(row);
 }
 $('split').textContent=`${summary.train} training wines / ${summary.test} held-out validation wines. Random seed: ${summary.seed}. Holdout: 20% of unique measurement groups (${summary.uniqueGroups} groups total).`;
 $('wine-form').addEventListener('submit',e=>{e.preventDefault();estimate();});
 $('model').addEventListener('change',estimate);
 $('inputs').addEventListener('input',estimate);
 for(const slot of ['a','b'])$(`save-${slot}`).addEventListener('click',()=>saveWine(slot));
 $('open-compare').addEventListener('click',()=>openTab('compare'));
 $('add-profile').addEventListener('click',()=>{openTab('predict');$('input-0').focus();});
 $('compare-model').addEventListener('change',renderComparison);
 renderComparison();
 $('reset').addEventListener('click',()=>{summary.schema.forEach((f,i)=>$(`input-${i}`).value=f.default);estimate();});
 document.querySelectorAll('[data-tab]').forEach((button,index)=>{
 button.addEventListener('keydown',event=>{
  const tabs=[...document.querySelectorAll('[data-tab]')];
  let next;
  if(event.key==='ArrowRight')next=(index+1)%tabs.length;
  else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
  else if(event.key==='Home')next=0;
  else if(event.key==='End')next=tabs.length-1;
  if(next!==undefined){event.preventDefault();tabs[next].focus();tabs[next].click();}
 });
 button.addEventListener('click',()=>{
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-selected',String(b===button));b.tabIndex=b===button?0:-1;});
  for(const id of ['predict','evidence','compare'])$(id).hidden=id!==button.dataset.tab;
 });
 });
 document.querySelector('[data-tab=evidence]').tabIndex=-1;
 estimate();$('status').textContent='Models ready. Predictions stay in this browser.';
} catch(error){$('status').textContent=`Unable to start: ${error.message}. Serve this directory over HTTP; see README.`;}
