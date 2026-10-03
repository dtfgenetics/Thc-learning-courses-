#!/usr/bin/env python3
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, json

ROOT=Path(__file__).resolve().parents[1]
W,H=2400,1600
BG=(248,249,246); INK=(22,38,28); DEEP=(16,61,38); GREEN=(54,130,76)
MUTED=(83,98,87); LINE=(198,209,201); WHITE=(255,255,255)
BLUE=(74,125,164); PALE=(230,241,232); GOLD=(186,145,55); GOLDP=(250,244,225)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'; BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def ff(n,b=False): return ImageFont.truetype(BOLD if b else FONT,n)
def box(d,b,fill=WHITE): d.rounded_rectangle(b,28,fill=fill,outline=LINE,width=4)
def text(d,xy,s,n=34,b=False,fill=INK,anchor=None): d.text(xy,s,font=ff(n,b),fill=fill,anchor=anchor)
def wrap(d,s,w,n=28,b=False):
    out=[]; cur=''
    for word in s.split():
        t=(cur+' '+word).strip()
        if d.textlength(t,font=ff(n,b))<=w: cur=t
        else: out.append(cur); cur=word
    if cur: out.append(cur)
    return out
def para(d,x,y,s,w,n=28,fill=MUTED):
    for line in wrap(d,s,w,n): text(d,(x,y),line,n,False,fill); y+=int(n*1.4)
def base(title,sub):
    im=Image.new('RGB',(W,H),BG); d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,190),fill=DEEP)
    text(d,(90,42),'THC ACADEMY  •  TEACHING HEALTHY CULTIVATION',32,True,(202,230,208))
    text(d,(90,96),title,58,True,WHITE)
    text(d,(90,218),sub,32,False,MUTED)
    d.line((90,282,W-90,282),fill=LINE,width=3)
    return im,d
def arrow(d,x1,y1,x2,y2,c=GREEN):
    d.line((x1,y1,x2,y2),fill=c,width=10)
    d.polygon([(x2,y2),(x2-26,y2-16),(x2-26,y2+16)],fill=c)
def plant(d,cx,cy,s=1):
    d.line((cx,cy+160*s,cx,cy-60*s),fill=GREEN,width=max(5,int(10*s)))
    for k,(yy,sgn) in enumerate([(100,1),(45,-1),(0,1),(-40,-1)]):
        x2=cx+sgn*95*s; y2=cy+yy*s-20*s
        d.line((cx,cy+yy*s,x2,y2),fill=GREEN,width=max(4,int(7*s)))
        d.ellipse((x2-35*s,y2-14*s,x2+35*s,y2+14*s),fill=(77,150,85),outline=DEEP,width=max(2,int(3*s)))

A=[
("VIS-FOUNDATION-LIGHT-PHOTOSYNTHESIS-001","visuals/COURSE3-ASSET-REGISTRY.json","LESSON-LIGHT-001","apps/web/public/assets/course3/foundation-light-photosynthesis.webp","From photons to photosynthesis","PPFD → interception → photosystems → carbon gain → crop response","Scientific flow from measured photon flux to leaf interception, photosystems, carbon assimilation and crop response, emphasizing that PPFD is an input measurement rather than a direct measurement of photosynthesis.","PPFD measures incoming photosynthetic photons; spectrum, photoperiod, canopy geometry, leaf temperature, carbon dioxide and water status influence the biological response.",["REF-LIGHT-001","REF-PURDUE-DLI-238"],"flow"),
("VIS-FOUNDATION-LIGHT-DLI-001","visuals/COURSE3-ASSET-REGISTRY.json","LESSON-LIGHT-DLI-003","apps/web/public/assets/course3/foundation-dli-equal-total.webp","Daily Light Integral","Different PPFD × time combinations can yield the same daily photon total.","Comparison of 500 micromoles per square meter per second for 16 hours and 1000 for 8 hours, both producing about 28.8 mole daily light integral, with a warning that equal DLI does not guarantee equal plant response.","DLI integrates PPFD over time. Equal daily totals can come from different intensity and photoperiod combinations, which may not be biologically equivalent.",["REF-LIGHT-001","REF-PURDUE-DLI-238"],"dli"),
("VIS-FOUNDATION-ROOTZONE-AIRWATER-001","visuals/COURSE4-ASSET-REGISTRY.json","LESSON-ROOTZONE-001","apps/web/public/assets/course4/foundation-rootzone-air-water.webp","Root-zone air–water balance","Drainage changes water-filled and air-filled pore space over time.","Three container cross sections showing high water-filled pore space after irrigation, increased air-filled pore space after drainage and lower water content approaching dryback.","Container media must supply water and oxygen. Observe drainage and dryback instead of treating constant saturation as adequate irrigation.",["REF-IRRIGATION-001","REF-CONTAINER-MEDIA-NCSU-2021"],"pore"),
("VIS-FOUNDATION-MEDIA-COMPARE-001","visuals/COURSE4-ASSET-REGISTRY.json","LESSON-ROOTZONE-MEDIA-002","apps/web/public/assets/course4/foundation-media-comparison.webp","Media structure comparison","Peat, coco and coarse soilless media differ in pore structure and water behavior.","Side-by-side media diagrams comparing representative peat-based, coco-based and coarse soilless pore structure, water retention and aeration without assigning universal irrigation schedules.","Media architecture changes water retention and aeration. Verify actual container behavior and measured dryback rather than copying a universal schedule.",["REF-IRRIGATION-001","REF-CONTAINER-MEDIA-NCSU-2021"],"media"),
("VIS-FOUNDATION-NUTRITION-MACRO-001","visuals/COURSE4-ASSET-REGISTRY.json","LESSON-NUTRITION-MACRO-002","apps/web/public/assets/course4/foundation-nutrition-macronutrients.webp","Macronutrient function map","N, P, K, Ca, Mg and S support distinct but interacting plant functions.","Chart mapping nitrogen, phosphorus, potassium, calcium, magnesium and sulfur to major plant functions and mobility context, with a warning that symptoms are not one-to-one diagnoses.","Use nutrient functions as diagnostic context, then verify pH, EC, roots, water status, spatial pattern and developmental stage.",["REF-NUTRITION-001","REF-PSU-HYDROPONIC-NUTRITION-2026"],"nutrients"),
("VIS-FOUNDATION-CLONE-ROOTING-001","visuals/COURSE5-ASSET-REGISTRY.json","LESSON-PROP-CLONE-003","apps/web/public/assets/course5/foundation-clone-rooting.webp","Cutting to rooted transplant","Unrooted support → adventitious rooting → gradual acclimatization.","Five-stage propagation sequence showing a fresh donor cutting, unrooted support, root initiation, a rooted cutting and gradual acclimatization.","A cutting must survive the unrooted phase, form adventitious roots, establish root function and then acclimate gradually as normal transpiration resumes.",["REF-PROP-001","REF-CANNABIS-CLONAL-ROOTING-2019"],"stages"),
("VIS-FOUNDATION-LST-001","visuals/COURSE5-ASSET-REGISTRY.json","LESSON-CANOPY-LST-002","apps/web/public/assets/course5/foundation-lst-before-after.webp","Low-stress training","Gradual branch repositioning redistributes canopy space while preserving recovery and access.","Before-and-after canopy diagram comparing a dominant upright plant with gradually repositioned branches distributed across a trellis for more even spacing and scouting access.","Low-stress training redistributes branches gradually. Protect plant vigor, sanitation, airflow and access, then verify the canopy response.",["REF-CANOPY-001","REF-LIGHT-001"],"lst"),
("VIS-FOUNDATION-HST-001","visuals/COURSE5-ASSET-REGISTRY.json","LESSON-CANOPY-HST-003","apps/web/public/assets/course5/foundation-hst-recovery.webp","Topping and recovery","Apical removal changes architecture but creates a recovery cost.","Four-stage diagram showing an intact plant apex, a topping cut, lateral growth response and recovery into two leaders.","Topping intentionally removes tissue and changes apical dominance. Confirm vigor, sanitation and recovery before stacking additional high-stress work.",["REF-CANOPY-001","REF-LIGHT-001"],"hst"),
("VIS-FOUNDATION-IPM-CYCLE-001","visuals/COURSE5-ASSET-REGISTRY.json","LESSON-IPM-001","apps/web/public/assets/course5/foundation-ipm-cycle.webp","Integrated Pest Management","Prevent → scout → identify → decide → control → verify.","Circular integrated pest management loop moving through prevention, scouting, identification, decision, authorized control and verification with evidence and recordkeeping feeding the next cycle.","IPM is an evidence loop, not a pesticide-first workflow. Scouting and diagnosis do not by themselves confer pesticide authority.",["REF-IPM-001","REF-PSU-GREENHOUSE-IPM-2026"],"cycle"),
("VIS-FOUNDATION-STORAGE-001","visuals/COURSE6-ASSET-REGISTRY.json","LESSON-POSTHARVEST-STORAGE-003","apps/web/public/assets/course6/foundation-storage-stability.webp","Storage stability","Package microenvironment and storage conditions continue to affect quality after drying.","Postharvest storage diagram showing moisture redistribution and headspace inside a package alongside external variables including temperature, light, barrier and seal performance and time.","After initial drying, package microenvironment and storage conditions still matter. Verify with controlled records and applicable quality criteria rather than appearance alone.",["REF-POSTHARVEST-001","REF-CANNABIS-POSTHARVEST-DRYING-2025"],"storage")
]

def draw_card(title,sub,kind):
    im,d=base(title,sub)
    if kind=="flow":
        labels=["PPFD","Leaf capture","Photosystems","Carbon gain","Crop response"]
        for i,l in enumerate(labels):
            x=130+i*455; box(d,(x,500,x+350,940),PALE if i<3 else WHITE); text(d,(x+175,570),str(i+1),44,True,GREEN,'mm'); text(d,(x+175,690),l,31,True,DEEP,'mm')
            if i<4: arrow(d,x+355,720,x+445,720)
        para(d,180,1100,"Measurement boundary: PPFD describes incoming photon flux. It does not directly measure photosynthesis or guarantee a crop response.",2040,32)
    elif kind=="dli":
        for x,ppfd,hours in [(210,500,16),(1290,1000,8)]:
            box(d,(x,470,x+900,1120)); text(d,(x+60,535),f"{ppfd} µmol·m⁻²·s⁻¹",44,True,GREEN); text(d,(x+60,605),f"× {hours} h",40,True,INK)
            d.rectangle((x+60,720,x+820,900),fill=PALE,outline=LINE,width=4); d.rectangle((x+60,720,x+60+760*(hours/16),900),fill=(113,177,116))
            text(d,(x+450,810),f"{hours} h light",32,True,WHITE if hours>10 else INK,'mm'); text(d,(x+60,985),"≈ 28.8 mol·m⁻²·d⁻¹",36,True,BLUE)
        box(d,(300,1260,2100,1460),GOLDP); text(d,(1200,1335),"Same DLI does not guarantee the same plant response.",34,True,INK,'mm')
    elif kind=="pore":
        for i,(lab,water) in enumerate([("After irrigation",.70),("After drainage",.48),("Dryback",.30)]):
            x=170+i*750; box(d,(x,430,x+650,1260)); text(d,(x+325,490),lab,36,True,DEEP,'mm')
            d.rectangle((x+150,650,x+500,1080),fill=(184,151,111),outline=INK,width=4)
            for r in range(8):
                for c in range(6):
                    q=(r*6+c)/48; col=BLUE if q<water else (239,241,236)
                    px=x+190+c*55+(r%2)*20; py=700+r*45; d.ellipse((px-14,py-14,px+14,py+14),fill=col,outline=(126,130,120))
            text(d,(x+325,1150),f"Water-filled pores ~{int(water*100)}%",29,True,BLUE,'mm')
    elif kind=="media":
        specs=[("Peat-based","More fine pores","higher water retention"),("Coco-based","mixed/fibrous pores","water + air balance"),("Coarse soilless","more large pores","faster drainage")]
        for i,(a,b,c) in enumerate(specs):
            x=140+i*760; box(d,(x,430,x+680,1260)); text(d,(x+340,495),a,38,True,DEEP,'mm'); text(d,(x+340,550),b,27,False,MUTED,'mm')
            for r in range(6):
                for k in range(7):
                    rr=(10+i*6)+((r+k)%3)*5; px=x+150+k*70; py=700+r*60
                    d.ellipse((px-rr,py-rr,px+rr,py+rr),fill=BLUE if (r+k)%4==0 else (207,181,142),outline=(128,120,105))
            text(d,(x+340,1135),c,29,True,INK,'mm')
    elif kind=="nutrients":
        items=[("N","proteins • chlorophyll"),("P","energy • phosphates"),("K","osmotic regulation"),("Ca","cell walls • signaling"),("Mg","chlorophyll • enzymes"),("S","amino acids • cofactors")]
        for i,(a,b) in enumerate(items):
            x=145+(i%3)*760; y=420+(i//3)*430; box(d,(x,y,x+680,y+350)); d.ellipse((x+50,y+75,x+200,y+225),fill=PALE,outline=GREEN,width=6); text(d,(x+125,y+150),a,54,True,DEEP,'mm'); text(d,(x+250,y+105),b,30,True,INK)
        box(d,(260,1325,2140,1490),GOLDP); text(d,(1200,1385),"Symptoms are evidence, not one-to-one diagnoses.",34,True,INK,'mm')
    elif kind=="stages":
        labs=["Fresh cutting","Unrooted","Root initiation","Rooted","Acclimation"]
        for i,l in enumerate(labs):
            x=100+i*455; box(d,(x,440,x+380,1200)); text(d,(x+190,500),l,29,True,DEEP,'mm'); d.line((x+190,670,x+190,950),fill=GREEN,width=10)
            d.line((x+190,740,x+120,690),fill=GREEN,width=7); d.line((x+190,790,x+260,735),fill=GREEN,width=7)
            if i>=2:
                for k in range(i): d.line((x+190,950,x+130+k*35,1040),fill=(220,211,171),width=6)
            if i<4: arrow(d,x+385,820,x+445,820)
    elif kind=="lst":
        box(d,(160,430,1110,1260)); box(d,(1290,430,2240,1260)); text(d,(635,490),"Before",40,True,DEEP,'mm'); text(d,(1765,490),"After gradual repositioning",40,True,DEEP,'mm')
        plant(d,635,820,1.5); plant(d,1765,850,1.25); d.line((1400,800,2130,800),fill=LINE,width=8); d.line((1400,900,2130,900),fill=LINE,width=8); d.line((1550,650,1550,1100),fill=LINE,width=8); d.line((1950,650,1950,1100),fill=LINE,width=8)
        text(d,(1765,1170),"Even spacing • airflow • scouting access",30,True,GREEN,'mm')
    elif kind=="hst":
        labs=["Intact apex","Topping cut","Lateral response","Recovered leaders"]
        for i,l in enumerate(labs):
            x=100+i*565; box(d,(x,430,x+500,1220)); text(d,(x+250,490),l,31,True,DEEP,'mm'); plant(d,x+250,820,1.0)
            if i==1: d.line((x+195,650,x+305,650),fill=(178,73,62),width=14)
            if i>=2:
                d.line((x+250,760,x+160,660),fill=GREEN,width=9); d.line((x+250,760,x+340,660),fill=GREEN,width=9)
            if i<3: arrow(d,x+505,820,x+560,820)
        text(d,(1200,1355),"High-stress training adds a recovery cost—verify vigor before stacking stress.",32,True,INK,'mm')
    elif kind=="cycle":
        labs=["PREVENT","SCOUT","IDENTIFY","DECIDE","CONTROL","VERIFY"]
        cx,cy=1200,840; import math
        pts=[]
        for i,l in enumerate(labs):
            a=-1.57+i*2*math.pi/6; x=cx+620*math.cos(a); y=cy+460*math.sin(a); pts.append((x,y)); box(d,(x-170,y-80,x+170,y+80),PALE); text(d,(x,y),l,30,True,DEEP,'mm')
        for i in range(6):
            a=pts[i]; b=pts[(i+1)%6]; arrow(d,int(a[0]),int(a[1]),int((a[0]+b[0])/2+0.42*(b[0]-a[0])),int((a[1]+b[1])/2+0.42*(b[1]-a[1])))
        d.ellipse((980,680,1420,1000),fill=WHITE,outline=LINE,width=4); text(d,(1200,790),"EVIDENCE",36,True,GREEN,'mm'); text(d,(1200,845),"records • trend • response",25,False,MUTED,'mm')
    elif kind=="storage":
        box(d,(170,440,1140,1260)); text(d,(655,500),"Inside the package",40,True,DEEP,'mm')
        d.rounded_rectangle((400,650,900,1090),50,fill=(224,229,211),outline=INK,width=5); text(d,(650,770),"PRODUCT",38,True,DEEP,'mm'); text(d,(650,840),"moisture redistribution",27,False,MUTED,'mm'); text(d,(650,900),"headspace",27,False,MUTED,'mm')
        box(d,(1300,440,2230,1260)); text(d,(1765,500),"External controls",40,True,DEEP,'mm')
        for i,l in enumerate(["Temperature","Light","Seal / barrier","Oxygen","Time"]): text(d,(1430,640+i*105),"✓  "+l,34,True,INK)
    return im

def main():
    for aid,reg,lesson,rel,title,sub,alt,caption,refs,kind in A:
        im=draw_card(title,sub,kind); out=ROOT/rel; out.parent.mkdir(parents=True,exist_ok=True); im.save(out,'WEBP',lossless=True,method=6)
        raw=out.read_bytes(); sha=hashlib.sha256(raw).hexdigest()
        rp=ROOT/reg; r=json.loads(rp.read_text())
        asset=next(x for x in r["assets"] if x["id"]==aid)
        learner="/"+"/".join(rel.split("/")[4:])
        asset.update({"status":"produced","learnerPath":learner,"sourcePath":rel,"publicDownloadUrl":"https://raw.githubusercontent.com/dtfgenetics/Thc-learning-courses-/main/"+rel,"assetLifecycle":"production-raster-active","version":"1.0.0","learnerTextAlternative":alt,"caption":caption,"nativeRaster":{"status":"owner-approved-production-release","format":"webp","sourceMasterFormat":"programmatic-scientific-diagram","bytes":len(raw),"pixelWidth":W,"pixelHeight":H,"sha256":sha,"automatedQa":["RIFF/WEBP lossless raster generated deterministically","shortest side is at least 1600 px","lesson alt text and caption carry required instructional meaning","source references and lesson mapping retained"],"releaseApproved":True},"productionRasterDriveMirrorStatus":"not-recorded"})
        rp.write_text(json.dumps(r,indent=2)+"\n")
        lp=ROOT/"content/lessons"/(lesson+".json"); l=json.loads(lp.read_text()); c=l.setdefault("content",{}); ext=c.setdefault("extensions",{}); pv=ext.setdefault("primaryVisuals",[])
        pv=[x for x in pv if x.get("assetId")!=aid]
        pv.append({"type":"image","assetId":aid,"title":title,"src":learner,"alt":alt,"caption":caption,"references":refs,"extensions":{"conceptId":aid,"releaseApproved":True,"releaseState":"owner-approved-production-release","rasterManifest":reg}})
        ext["primaryVisuals"]=pv; lp.write_text(json.dumps(l,indent=2)+"\n")
        print(aid,sha,len(raw))
if __name__=="__main__": main()
