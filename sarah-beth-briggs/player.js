'use strict';
(async()=>{
const $=id=>document.getElementById(id),album=$('album'),join=$('join-player');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
let tracks,media;
try{[tracks,media]=await Promise.all(['tracks.json','media.json'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error('Cannot load track information');return r.json()}))}catch(e){$('album-status').textContent='Track information could not load. Please refresh, or use the download folder above.';return}
let loadPromise=null,blobURL=null,operation=0;
function stopOthers(which){if(which!==album)album.pause();if(which!==join)join.pause();document.querySelectorAll('.preview').forEach(x=>x.remove());document.querySelectorAll('[data-preview]').forEach(x=>x.textContent='Play individual WAV')}
album.addEventListener('play',()=>stopOthers(album));join.addEventListener('play',()=>stopOthers(join));
async function ensureAlbum(){
 if(blobURL)return;
 if(loadPromise)return loadPromise;
 const button=$('load-album');button.disabled=true;$('load-progress').hidden=false;
 loadPromise=(async()=>{
 const blobs=new Array(media.parts.length);let next=0,loaded=0;
 async function worker(){while(next<media.parts.length){const i=next++,p=media.parts[i];const r=await fetch(p.url);if(!r.ok)throw Error('Audio download failed ('+r.status+')');const b=await r.blob();if(b.size!==p.size)throw Error('Incomplete audio download');blobs[i]=b;loaded+=b.size;$('load-progress').value=loaded/media.bytes*100;$('album-status').textContent='Loading album: '+Math.round(loaded/1e6)+' / '+Math.round(media.bytes/1e6)+' MB';}}
 const results=await Promise.allSettled(Array.from({length:3},worker));const failed=results.find(x=>x.status==='rejected');if(failed)throw failed.reason;
 blobURL=URL.createObjectURL(new Blob(blobs,{type:'audio/mpeg'}));
 await new Promise((resolve,reject)=>{album.addEventListener('loadedmetadata',resolve,{once:true});album.addEventListener('error',()=>reject(Error('This browser could not open the MP3')),{once:true});album.src=blobURL;album.load()});
 album.hidden=false;$('download-mp3').href=blobURL;$('download-mp3').hidden=false;button.textContent='Play full album';$('album-status').textContent='Ready. Use Play or a numbered track marker. The download includes embedded chapter markers for compatible players.';
 })().catch(e=>{if(blobURL){URL.revokeObjectURL(blobURL);blobURL=null}loadPromise=null;button.textContent='Retry loading album';$('album-status').textContent=e.message+'. Please retry, or use the individual WAV players.';throw e}).finally(()=>{button.disabled=false;$('load-progress').hidden=true});
 return loadPromise;
}
async function playFrom(index){const token=++operation;stopOthers(album);try{await ensureAlbum();if(token!==operation)return;album.currentTime=tracks[index].start;await album.play();}catch(e){if(blobURL)$('album-status').textContent='Ready. Press Play in the audio player to begin.';}}
$('load-album').addEventListener('click',()=>playFrom(0));
tracks.forEach((t,i)=>{const b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0')+' / '+clock(t.start);b.title=t.title;b.setAttribute('aria-label','Play track '+(i+1)+': '+t.title);b.addEventListener('click',()=>playFrom(i));$('markers').append(b)});
album.addEventListener('timeupdate',()=>{let i=tracks.findLastIndex(t=>album.currentTime>=t.start);if(i<0)i=0;$('now-playing').textContent=String(i+1).padStart(2,'0')+' - '+tracks[i].title;[...$('markers').children].forEach((b,j)=>{b.classList.toggle('active',i===j);if(i===j)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')})});
let section;tracks.forEach((t,i)=>{
 if(i===0||t.work!==tracks[i-1].work){section=document.createElement('div');section.className='work';section.innerHTML='<div class="work-head"><h3>'+esc(t.work)+'</h3></div>';$('tracks').append(section)}
 const row=document.createElement('div');row.className='track';row.innerHTML='<span class="num">'+String(i+1).padStart(2,'0')+'</span><div><div class="track-name">'+esc(t.movement||'Tema and 32 variations')+'</div><div class="actions"><button data-preview="'+i+'">Play individual WAV</button><button data-album="'+i+'">Album from here</button><a href="https://drive.google.com/uc?export=download&amp;id='+t.id+'" target="_blank" rel="noopener" aria-label="Download WAV track '+(i+1)+'">Download WAV</a><a href="https://drive.google.com/file/d/'+t.id+'/view" target="_blank" rel="noopener">Open in Drive</a></div></div><span class="duration">'+clock(t.duration)+'</span>';section.append(row);
 row.querySelector('[data-album]').addEventListener('click',()=>{playFrom(i);$('continuous-title').scrollIntoView({behavior:'smooth',block:'start'})});
 row.querySelector('[data-preview]').addEventListener('click',e=>{const old=row.querySelector('.preview');++operation;if(old){old.remove();e.target.textContent='Play individual WAV';return}stopOthers(null);const d=document.createElement('div');d.className='preview';const frame=document.createElement('iframe');frame.src='https://drive.google.com/file/d/'+t.id+'/preview';frame.title='Play '+t.title;frame.allow='autoplay';d.append(frame);row.children[1].append(d);e.target.textContent='Close WAV player'});
});
for(let i=1;i<tracks.length;i++){const b=document.createElement('button');const inside=tracks[i].work===tracks[i-1].work;b.innerHTML=String(i).padStart(2,'0')+' to '+String(i+1).padStart(2,'0')+'<small>'+esc(inside?tracks[i].movement:({1:'Variations / Pathetique',4:'Pathetique / Appassionata',7:'Appassionata / Op. 110'}[i]))+'</small>';b.title=tracks[i-1].title+' to '+tracks[i].title;b.addEventListener('click',()=>{++operation;stopOthers(join);[...$('joins').children].forEach(x=>x.classList.toggle('active',x===b));$('join-title').textContent='Track '+String(i).padStart(2,'0')+' to '+String(i+1).padStart(2,'0')+': '+tracks[i].title;join.src='audio/join-'+String(i).padStart(2,'0')+'.mp3?v=30s';join.hidden=false;join.play().catch(()=>$('join-title').textContent+=' - press Play to listen.')});$('joins').append(b)}
join.addEventListener('timeupdate',()=>{$('join-progress').style.width=Math.min(100,join.currentTime/35*100)+'%';if(join.currentTime>=35)join.pause()});
join.addEventListener('error',()=>{$('join-title').textContent='The clip could not load. Please retry, or use the continuous album.'});
})();
