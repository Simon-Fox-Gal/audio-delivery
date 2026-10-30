"""Reproducible listening derivatives; original Drive WAVs are never modified."""
from pathlib import Path
import subprocess, json, math, hashlib, argparse
import numpy as np

DEST=Path(__file__).resolve().parents[1]
SOURCES=json.loads((DEST/'sources.json').read_text(encoding='utf8'))
TITLES=['Der Morgen','Das Werk','Sinnen und Suchen','Natur','Dämmerung','Das ewige Licht']
SLUGS=['der-morgen','das-werk','sinnen-und-suchen','natur','daemmerung','das-ewige-licht']
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--wav-dir',required=True);parser.add_argument('--download',action='store_true');parser.add_argument('--art-only',action='store_true');args=parser.parse_args()
    root=Path(args.wav_dir).resolve();root.mkdir(exist_ok=True,parents=True)
    paths=[];starts=[];end=0
    for i,s in enumerate(SOURCES):
        p=root/f'{i+1:02d}.wav'
        if args.download and not p.exists():
            import gdown
            assert gdown.download(id=s['id'],output=str(p),quiet=True,use_cookies=False)
        assert p.stat().st_size==s['bytes'], f'Unexpected WAV size: {p}'
        assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256'],f'Changed source: {p}'
        paths.append(p);starts.append(end);end+=s['duration']
    audio=DEST/'audio';audio.mkdir(exist_ok=True)
    manifest={'duration':end,'format':'AAC 320 kbit/s, 48 kHz, stereo','movements':[{'title':t,'start':starts[i],'duration':SOURCES[i]['duration'],'mp3':f'audio/{i+1:02d}-{SLUGS[i]}.mp3','driveId':SOURCES[i]['id']} for i,t in enumerate(TITLES)]}
    (DEST/'recording.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf8')
    # Each concentric line records the measured envelope of one complete movement.
    curves=[]
    for i,p in enumerate(paths):
        raw=subprocess.run(['ffmpeg','-v','error','-i',str(p),'-ac','1','-ar','400','-f','f32le','pipe:1'],check=True,stdout=subprocess.PIPE).stdout
        a=np.frombuffer(raw,dtype='<f4'); blocks=np.array_split(a,360)
        rms=np.asarray([np.sqrt(np.mean(b*b)+1e-12) for b in blocks])
        db=20*np.log10(rms+1e-9);lo,hi=np.percentile(db,[5,95]);env=np.clip((db-lo)/max(hi-lo,1e-9),0,1)
        points=[]
        for j,v in enumerate(env):
            theta=2*math.pi*j/360-math.pi/2;r=68+i*27+float(v)*16
            points.append(f'{300+r*math.cos(theta):.2f},{260+r*math.sin(theta):.2f}')
        curves.append(f'<path d="M'+ ' L'.join(points)+' Z" fill="none" stroke="'+('#b99b74' if i==5 else '#738b86')+f'" stroke-width="{1.2 if i==5 else .8}"><title>{i+1}. {TITLES[i]}</title></path>')
    svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 520" role="img" aria-labelledby="title desc"><title id="title">Sechs Lebenskreise</title><desc id="desc">Sechs konzentrische Linien aus den gemessenen Lautstärkeverläufen der sechs Sätze, von innen nach außen. Gestalterische Interpretation, keine Partitur- oder Frequenzanalyse.</desc><rect width="600" height="520" fill="#151b1e"/>'+''.join(curves)+'<text x="300" y="257" fill="#e8dfce" text-anchor="middle" font-size="17" font-family="Georgia">Lebenskreise</text><text x="300" y="279" fill="#adbaa9" text-anchor="middle" font-size="10" font-family="sans-serif" letter-spacing="3">OPUS 70</text></svg>'
    (DEST/'klangkreise.svg').write_text(svg,encoding='utf8')
    if args.art_only:return
    concat=root/'concat.txt';concat.write_text(''.join("file '"+str(p).replace('\\','/')+"'\n" for p in paths),encoding='utf8')
    hls=audio/'complete';hls.mkdir(exist_ok=True)
    subprocess.run(['ffmpeg','-y','-nostdin','-v','error','-f','concat','-safe','0','-i',str(concat),'-vn','-af','aresample=48000:resampler=soxr:precision=28','-c:a','aac','-b:a','320k','-aac_tns','0','-aac_pns','0','-ac','2','-f','hls','-hls_time','18','-hls_playlist_type','vod','-hls_list_size','0','-hls_segment_filename',str(hls/'part-%03d.ts'),str(hls/'index.m3u8')],check=True)
    assert '#EXT-X-ENDLIST' in (hls/'index.m3u8').read_text()
    for i,p in enumerate(paths):
        subprocess.run(['ffmpeg','-y','-nostdin','-v','error','-i',str(p),'-vn','-c:a','libmp3lame','-b:a','320k','-id3v2_version','3','-metadata','artist=Hans Gál','-metadata','album=Lebenskreise, Op. 70 - Hamburg 2009','-metadata','title='+TITLES[i],'-metadata',f'track={i+1}/6',str(DEST/manifest['movements'][i]['mp3'])],check=True)
    inventory=[]
    for p in sorted(audio.rglob('*')):
        if p.is_file():inventory.append({'path':p.relative_to(DEST).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
    (DEST/'audio-inventory.json').write_text(json.dumps(inventory,indent=2),encoding='utf8')
    print(f'PASS: six original hashes; six MP3 derivatives; one continuous stream; {end:.3f} seconds')
if __name__=='__main__':main()
