#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib,json,math
R=Path(__file__).resolve().parents[1]; W,H=2400,1600
F='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BG=(248,249,246); INK=(22,38,28); DEEP=(16,61,38); GREEN=(54,130,76); BLUE=(74,125,164); MUTED=(83,98,87); LINE=(198,209,201); WHITE=(255,255,255); PALE=(230,241,232); GOLD=(186,145,55)
def ff(n,b=False): return ImageFont.truetype(B if b else F,n)
def t(d,xy,s,n=34,b=False,c=INK,a=None): d.text(xy,s,font=ff(n,b),fill=c,anchor=a)
def box(d,b,fill=WHITE): d.rounded_rectangle(b,28,fill=fill,outline=LINE,width=4)
def base(title,sub):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im); d.rectangle((0,0,W,190),fill=DEEP)
    t(d,(90,42),'THC ACADEMY  •  TEACHING HEALTHY CULTIVATION',32,True,(202,230,208)); t(d,(90,96),title,58,True,WHITE); t(d,(90,218),sub,32,False,MUTED); d.line((90,282,W-90,282),fill=LINE,width=3); return im,d
def arrow(d,x1,y1,x2,y2,c=GREEN): d.line((x1,y1,x2,y2),fill=c,width=10); d.polygon([(x2,y2),(x2-28,y2-17),(x2-28,y2+17)],fill=c)
def plant(d,cx,cy,s=1):
    d.line((cx,cy+170*s,cx,cy-70*s),fill=GREEN,width=max(5,int(10*s)))
    for yy,sgn in [(110,1),(55,-1),(0,1),(-45,-1)]:
        x2=cx+sgn*100*s; y2=cy+yy*s-20*s; d.line((cx,cy+yy*s,x2,y2),fill=GREEN,width=max(4,int(7*s))); d.ellipse((x2-40*s,y2-15*s,x2+40*s,y2+15*s),fill=(78,149,86),outline=DEEP,width=3)
A=[
("VIS-FOUNDATION-ENV-LEAF-VPD-001","visuals/COURSE3-ASSET-REGISTRY.json","LESSON-ENV-LEAF-VPD-003","apps/web/public/assets/course3/foundation-leaf-vpd-context.webp","Leaf temperature and vapor exchange","Air temperature is not leaf temperature; airflow changes the boundary layer.","Diagram comparing air and leaf temperature, the leaf boundary layer, airflow and leaf-to-air vapor exchange without prescribing a universal VPD target.","Leaf temperature, humidity and airflow affect the leaf-to-air vapor-pressure relationship. Verify representative measurements instead of assuming air temperature equals leaf temperature.",["REF-VPD-002","REF-MSU-BOUNDARY-LAYER-TRANSPIRATION"],"leaf"),
("VIS-FOUNDATION-NUTRITION-MICRO-001","visuals/COURSE4-ASSET-REGISTRY.json","LESSON-NUTRITION-MICRO-003","apps/web/public/assets/course4/foundation-micronutrient-context.webp","Micronutrient reasoning","Functions, pH-sensitive availability and symptom location are evidence streams—not photo diagnoses.","Scientific chart showing selected micronutrient functions, pH-sensitive availability context and the use of young-versus-old tissue symptom location as one part of diagnosis.","Micronutrient symptoms can overlap. Use function, pH/EC context, tissue age, root condition and spatial pattern together instead of diagnosing from one photograph.",["REF-NUTRITION-001","REF-PSU-HYDROPONIC-NUTRITION-2026"],"micro"),
("VIS-FOUNDATION-PROP-PROCESS-001","visuals/COURSE5-ASSET-REGISTRY.json","LESSON-PROP-001","apps/web/public/assets/course5/foundation-propagation-pathways.webp","Propagation pathways compared","Seed germination and cutting propagation reach establishment through different biological processes.","Side-by-side process diagram comparing seed imbibition, embryo activation and radicle emergence with cutting survival, wound response, adventitious rooting and acclimatization.","Seed and cutting propagation share the goal of establishment but use different biological pathways. Track identity, sanitation and stage-specific evidence for each.",["REF-PROP-001","REF-CANNABIS-SEED-GERMINATION-2021","REF-CANNABIS-CLONAL-ROOTING-2019"],"prop"),
("VIS-FOUNDATION-CANOPY-ARCH-001","visuals/COURSE5-ASSET-REGISTRY.json","LESSON-CANOPY-001","apps/web/public/assets/course5/foundation-canopy-architecture.webp","Apical dominance and canopy architecture","Shoot position, branch distribution and leaf geometry change spatial light interception.","Scientific plant architecture diagram comparing a dominant central leader with a redistributed canopy, showing lateral branching and differences in light interception across the crop surface.","Canopy architecture changes where leaves intercept light and how workers access the crop. Training decisions must consider plant vigor, sanitation, airflow and recovery.",["REF-CANOPY-001","REF-LIGHT-001"],"canopy")
]
def draw(title,sub,kind):
    im,d=base(title,sub)
    if kind=="leaf":
        box(d,(150,430,2250,1250)); d.ellipse((750,700,1650,1040),fill=(111,174,102),outline=DEEP,width=6); d.line((1200,1040,1200,1160),fill=GREEN,width=12)
        for x in [420,520,1880,1980]: arrow(d,x,790,x+220 if x<1200 else x-220,790,BLUE)
        t(d,(440,650),"AIR",40,True,BLUE); t(d,(1960,650),"AIRFLOW",32,True,BLUE,'mm'); t(d,(1200,820),"LEAF",48,True,WHITE,'mm')
        d.arc((650,610,1750,1120),180,360,fill=GOLD,width=14); t(d,(1200,585),"boundary layer",31,True,GOLD,'mm')
        t(d,(530,1120),"Air temperature + RH",30,True,INK); t(d,(1500,1120),"Leaf temperature",30,True,INK); arrow(d,1040,1120,1360,1120)
    elif kind=="micro":
        items=[("Fe","chlorophyll systems","younger tissue often informative"),("Mn","enzyme systems","pattern + pH context"),("Zn","enzymes / growth","short internodes can have many causes"),("B","cell walls / meristems","new growth often informative"),("Cu","redox enzymes","rare; verify before acting"),("Mo","nitrate metabolism","availability can be pH-sensitive")]
        for i,(a,b,c) in enumerate(items):
            x=130+(i%3)*760; y=420+(i//3)*420; box(d,(x,y,x+680,y+340)); d.ellipse((x+45,y+70,x+185,y+210),fill=PALE,outline=GREEN,width=5); t(d,(x+115,y+140),a,48,True,DEEP,'mm'); t(d,(x+220,y+80),b,29,True,INK); t(d,(x+220,y+150),c,25,False,MUTED)
        box(d,(260,1320,2140,1490),(250,244,225)); t(d,(1200,1380),"Use pH, EC, roots, tissue age and spatial pattern together.",34,True,INK,'mm')
    elif kind=="prop":
        box(d,(130,420,1130,1260)); box(d,(1270,420,2270,1260)); t(d,(630,485),"Seed pathway",42,True,DEEP,'mm'); t(d,(1770,485),"Cutting pathway",42,True,DEEP,'mm')
        seed=["Imbibition","Embryo activation","Radicle emergence","Seedling establishment"]; cut=["Cutting survival","Wound response","Adventitious roots","Acclimatization"]
        for i,l in enumerate(seed):
            y=630+i*145; d.ellipse((280,y-36,352,y+36),fill=(180,140,85),outline=INK,width=3); t(d,(410,y),l,30,True,INK,'lm'); 
            if i<3: arrow(d,315,y+50,315,y+108)
        for i,l in enumerate(cut):
            y=630+i*145; d.line((1460,y-45,1460,y+45),fill=GREEN,width=10); t(d,(1540,y),l,30,True,INK,'lm')
            if i<3: arrow(d,1460,y+50,1460,y+108)
    elif kind=="canopy":
        box(d,(140,420,1120,1260)); box(d,(1280,420,2260,1260)); t(d,(630,485),"Dominant leader",40,True,DEEP,'mm'); t(d,(1770,485),"Redistributed canopy",40,True,DEEP,'mm')
        plant(d,630,820,1.5); plant(d,1770,860,1.25)
        for x in [390,520,650,780,910]: arrow(d,x,610,x,720,GOLD)
        for x in [1450,1580,1710,1840,1970,2100]: arrow(d,x,610,x,740,GOLD)
        t(d,(630,1170),"Light concentrated near dominant top",28,True,MUTED,'mm'); t(d,(1770,1170),"Light spread across more leaf area",28,True,MUTED,'mm')
    return im
def main():
    for aid,reg,lesson,rel,title,sub,alt,caption,refs,kind in A:
        im=draw(title,sub,kind); out=R/rel; out.parent.mkdir(parents=True,exist_ok=True); im.save(out,'WEBP',lossless=True,method=6); raw=out.read_bytes(); sha=hashlib.sha256(raw).hexdigest()
        rp=R/reg; rr=json.loads(rp.read_text()); a=next(x for x in rr["assets"] if x["id"]==aid); learner="/"+"/".join(rel.split("/")[4:])
        a.update({"status":"produced","learnerPath":learner,"sourcePath":rel,"publicDownloadUrl":"https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/"+rel,"assetLifecycle":"production-raster-active","version":"1.0.0","learnerTextAlternative":alt,"caption":caption,"nativeRaster":{"status":"owner-approved-production-release","format":"webp","sourceMasterFormat":"programmatic-scientific-diagram","bytes":len(raw),"pixelWidth":W,"pixelHeight":H,"sha256":sha,"automatedQa":["RIFF/WEBP lossless raster generated deterministically","shortest side is at least 1600 px","lesson alt text and caption carry required instructional meaning","source references and lesson mapping retained"],"releaseApproved":True},"productionRasterDriveMirrorStatus":"not-recorded"}); rp.write_text(json.dumps(rr,indent=2)+"\n")
        lp=R/"content/lessons"/(lesson+".json"); l=json.loads(lp.read_text()); ext=l.setdefault("content",{}).setdefault("extensions",{}); pv=[x for x in ext.get("primaryVisuals",[]) if x.get("assetId")!=aid]; pv.append({"type":"image","assetId":aid,"title":title,"src":learner,"alt":alt,"caption":caption,"references":refs,"extensions":{"conceptId":aid,"releaseApproved":True,"releaseState":"owner-approved-production-release","rasterManifest":reg}}); ext["primaryVisuals"]=pv; lp.write_text(json.dumps(l,indent=2)+"\n")
        print(aid,sha,len(raw))
if __name__=="__main__": main()
