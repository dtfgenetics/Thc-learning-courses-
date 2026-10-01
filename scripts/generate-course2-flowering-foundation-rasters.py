from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, math, random, os, hashlib

W,H=2400,1800
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,'apps','web','public','assets','course2')
os.makedirs(OUT,exist_ok=True)
random.seed(42)

def font(size,bold=False):
    paths=[
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf'
    ]
    for p in paths:
        if os.path.exists(p): return ImageFont.truetype(p,size)
    return ImageFont.load_default()

F_TITLE=font(72,True); F_H2=font(38,True); F_BODY=font(30); F_SMALL=font(24); F_TINY=font(20)
INK=(28,34,32); MUTED=(83,91,88); GREEN=(35,93,61); GOLD=(171,128,44); LINE=(216,221,217)

def rounded(draw, box, radius=30, fill='white', outline=LINE, width=3):
    draw.rounded_rectangle(box,radius=radius,fill=fill,outline=outline,width=width)

def pill(draw, xy, text, fill=(236,243,238), color=GREEN):
    x,y=xy; f=F_SMALL
    bb=draw.textbbox((0,0),text,font=f); w=bb[2]-bb[0]+36; h=bb[3]-bb[1]+24
    draw.rounded_rectangle((x,y,x+w,y+h),radius=h//2,fill=fill)
    draw.text((x+18,y+10),text,font=f,fill=color)

def header(img,title,subtitle):
    d=ImageDraw.Draw(img)
    d.rectangle((0,0,W,210),fill=(250,251,250)); d.rectangle((0,0,18,210),fill=GREEN)
    d.text((70,44),title,font=F_TITLE,fill=INK); d.text((72,132),subtitle,font=F_BODY,fill=MUTED)
    return d

def footer(draw, source_note='THC Academy • Teaching Healthy Cultivation'):
    draw.line((70,H-88,W-70,H-88),fill=LINE,width=2)
    draw.text((70,H-64),source_note,font=F_TINY,fill=MUTED)
    draw.text((W-740,H-64),'Educational visual • not a universal cultivation target',font=F_TINY,fill=MUTED)

def save_webp(img,name,quality):
    path=os.path.join(OUT,name)
    img.convert('RGB').save(path,'WEBP',quality=quality,method=6)
    data=open(path,'rb').read()
    return {'path':path,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'width':W,'height':H}

def make_photoperiod():
    img=Image.new('RGB',(W,H),(255,255,255)); d=header(img,'Photoperiod, DLI & Dark-Period Integrity','Daily photon dose and developmental timing are related — but they are not the same measurement.')
    left=(70,255,1160,1550); right=(1240,255,2330,1550)
    rounded(d,left,32,'white'); rounded(d,right,32,'white')
    d.text((110,300),'1  Photoperiod ≠ DLI',font=F_H2,fill=INK)
    d.text((1280,300),'2  The plant experiences actual light',font=F_H2,fill=INK)

    def timeline(x,y,w,light_hours,intensity,label,accent):
        d.text((x,y),label,font=F_BODY,fill=INK); y+=52
        d.rounded_rectangle((x,y,x+w,y+80),radius=22,fill=(30,34,35))
        light_w=w*light_hours/24
        d.rounded_rectangle((x,y,x+light_w,y+80),radius=22,fill=(244,208,96))
        for hr in [0,6,12,18,24]:
            tx=x+w*hr/24; d.line((tx,y+86,tx,y+103),fill=MUTED,width=2)
            t='24' if hr==24 else str(hr); d.text((tx-12,y+108),t,font=F_TINY,fill=MUTED)
        d.text((x+12,y+22),'LIGHT',font=F_SMALL,fill=INK)
        d.text((x+light_w+10,y+22),'DARK',font=F_SMALL,fill=(235,238,237))
        y+=145
        d.text((x,y),f'PPFD example: {intensity} µmol/m²/s',font=F_SMALL,fill=MUTED)
        dli=intensity*light_hours*3600/1_000_000
        d.text((x,y+40),f'Calculated DLI ≈ {dli:.1f} mol/m²/day',font=F_SMALL,fill=accent)
        return y+90

    y=390; y=timeline(120,y,950,18,500,'Schedule A — longer light interval',GREEN); y+=55
    y=timeline(120,y,950,12,750,'Schedule B — shorter light interval',GOLD)
    rounded(d,(120,1120,1070,1370),24,(248,249,248),LINE)
    d.text((150,1150),'Same daily photon total ≠ same developmental signal',font=F_BODY,fill=INK)
    d.text((150,1210),'DLI integrates photons over the day. Photoperiod describes the duration and timing\nof light and darkness. Cultivars can respond differently to day length.',font=F_SMALL,fill=MUTED,spacing=10)
    pill(d,(150,1310),'Keep DLI and photoperiod as separate fields')

    rounded(d,(1290,390,2280,760),26,(249,250,249),LINE)
    d.text((1330,425),'Intended dark period — uninterrupted',font=F_BODY,fill=INK)
    x=1340; y=510; w=870
    for segx,segw,fill,label in [(x,w/2,(244,208,96),'LIGHT'),(x+w/2,w/2,(32,36,37),'DARK')]:
        d.rectangle((segx,y,segx+segw,y+78),fill=fill)
        d.text((segx+20,y+23),label,font=F_SMALL,fill=INK if label=='LIGHT' else (240,242,241))
    cx,cy=2160,650
    d.ellipse((cx-34,cy-34,cx+34,cy+34),fill=(225,241,231),outline=GREEN,width=3)
    d.line((cx-16,cy,cx-2,cy+15),fill=GREEN,width=8); d.line((cx-2,cy+15,cx+22,cy-14),fill=GREEN,width=8)
    d.text((1330,625),'Actual fixture state matches the intended cycle.',font=F_SMALL,fill=MUTED)

    rounded(d,(1290,810,2280,1210),26,(255,250,245),(229,205,170))
    d.text((1330,845),'Dark period — interrupted by bright work light',font=F_BODY,fill=INK)
    x=1340;y=930;w=870
    d.rectangle((x,y,x+w/2,y+78),fill=(244,208,96)); d.rectangle((x+w/2,y,x+w,y+78),fill=(32,36,37))
    ix=x+w*0.75; d.rectangle((ix-12,y,ix+18,y+78),fill=(255,245,176))
    d.polygon([(ix-42,y-38),(ix+38,y-38),(ix+18,y),(ix-22,y)],fill=(255,220,92))
    d.text((x+20,y+23),'LIGHT',font=F_SMALL,fill=INK); d.text((x+w/2+20,y+23),'DARK',font=F_SMALL,fill=(240,242,241))
    d.text((1330,1045),'Timer programming is not proof of the crop’s actual light exposure.',font=F_SMALL,fill=MUTED)
    cx,cy=2160,1115
    d.polygon([(cx,cy-42),(cx-46,cy+35),(cx+46,cy+35)],fill=(255,236,201),outline=GOLD)
    d.text((cx-7,cy-20),'!',font=font(50,True),fill=GOLD)

    rounded(d,(1290,1270,2280,1460),26,(244,248,245),(207,221,211))
    d.text((1330,1300),'Use four separate observations',font=F_BODY,fill=INK)
    labels=['Photoperiod = timing / duration','DLI = daily photon dose','Actual exposure matters','Cultivar response varies']
    for i,t in enumerate(labels):
        x=1330+(i%2)*460; y=1360+(i//2)*52
        d.ellipse((x,y+8,x+14,y+22),fill=GREEN); d.text((x+28,y),t,font=F_SMALL,fill=MUTED)
    footer(d)
    return save_webp(img,'flower-photoperiod-dark-period.webp',95)

def macro_panel(size=(505,365), stage=0.5, seed=1, canopy_bias=0.0):
    rnd=random.Random(seed); w,h=size
    yy,xx=np.mgrid[0:h,0:w]
    base=np.zeros((h,w,3),dtype=np.float32)
    base[:,:,0]=42+18*np.sin(xx/65)+8*np.cos(yy/27)
    base[:,:,1]=72+24*np.sin((xx+yy)/85)+10*np.cos(xx/31)
    base[:,:,2]=48+12*np.cos(yy/42)
    cx=w*.52; cy=h*.62
    dist=np.sqrt(((xx-cx)/(w*.62))**2+((yy-cy)/(h*.7))**2)
    mask=np.clip(1-dist,0,1); base[:,:,0]+=mask*35; base[:,:,1]+=mask*28; base[:,:,2]+=mask*10
    noise=np.random.default_rng(seed).normal(0,8,(h,w,1))
    base=np.clip(base+noise,0,255).astype(np.uint8)
    im=Image.fromarray(base).filter(ImageFilter.GaussianBlur(2.2)); dr=ImageDraw.Draw(im,'RGBA')
    for _ in range(22):
        x0=rnd.randint(0,w); y0=rnd.randint(int(h*.35),h); x1=x0+rnd.randint(-90,90); y1=y0-rnd.randint(50,180)
        dr.line((x0,y0,x1,y1),fill=(210,220,180,55),width=rnd.randint(1,3))
    for _ in range(120):
        x=rnd.randint(18,w-18); y=rnd.randint(45,h-18); stalk_len=rnd.randint(22,74); ang=rnd.uniform(-.45,.45)
        bx=x-int(math.sin(ang)*stalk_len); by=min(h-2,y+int(math.cos(ang)*stalk_len))
        dr.line((bx,by,x,y),fill=(220,236,213,150),width=rnd.choice([2,3,4]))
        dr.line((bx+2,by,x+2,y),fill=(255,255,244,80),width=1)
        amber_p=max(.05,min(.55,stage*.45+canopy_bias)); cloudy_p=max(.25,min(.75,.35+stage*.25))
        q=rnd.random()
        if q<amber_p: col=(201,139,49,210); edge=(239,190,92,235)
        elif q<amber_p+cloudy_p: col=(235,236,221,215); edge=(255,255,248,235)
        else: col=(210,235,226,100); edge=(245,255,250,190)
        rr=rnd.randint(8,15)
        dr.ellipse((x-rr-3,y-rr-3,x+rr+3,y+rr+3),fill=(255,255,255,25))
        dr.ellipse((x-rr,y-rr,x+rr,y+rr),fill=col,outline=edge,width=2)
        dr.ellipse((x-rr*.45,y-rr*.55,x-rr*.05,y-rr*.15),fill=(255,255,255,150))
    return im.filter(ImageFilter.UnsharpMask(radius=1.2,percent=130,threshold=3))

def make_trichome():
    img=Image.new('RGB',(W,H),(250,251,250)); d=header(img,'Representative Trichome Maturity Sampling','Compare matched floral bracts across canopy positions and dates — trend is stronger than one extreme image.')
    rounded(d,(70,260,650,1540),28,'white')
    d.text((105,300),'Sampling map',font=F_H2,fill=INK)
    d.text((105,355),'Use comparable floral tissue\nfrom repeatable canopy positions.',font=F_SMALL,fill=MUTED,spacing=8)
    cx=355; basey=1360
    d.line((cx,basey,cx,560),fill=(70,112,75),width=18)
    for i,y in enumerate([1180,1040,900,760,640]):
        span=180-15*i
        for sign in [-1,1]:
            d.line((cx,y,cx+sign*span,y-80),fill=(70,112,75),width=10)
            lx=cx+sign*span; ly=y-80
            for a in [-.6,-.25,0,.25,.6]:
                ex=lx+sign*math.cos(a)*70; ey=ly-math.sin(abs(a)+.4)*65
                d.ellipse((ex-22,ey-10,ex+22,ey+10),fill=(91,134,88))
    d.ellipse((cx-65,500,cx+65,700),fill=(102,132,75),outline=(71,103,61),width=4)
    positions=[('UPPER',660,GREEN),('MIDDLE',910,GOLD),('LOWER',1180,(111,91,143))]
    for name,y,col in positions:
        d.line((cx+80,y,570,y),fill=col,width=5); d.ellipse((cx+67,y-11,cx+89,y+11),fill=col)
        d.text((445,y-48),name,font=F_SMALL,fill=col)
    rounded(d,(105,1410,615,1500),18,(245,248,246),LINE)
    d.text((130,1436),'Same tissue • same magnification • repeated dates',font=F_TINY,fill=MUTED)

    startx=710; starty=300; cellw=505; cellh=365; gapx=35; gapy=95
    for c,hdr in enumerate(['Date 1','Date 2','Date 3']):
        x=startx+c*(cellw+gapx); d.text((x+150,250),hdr,font=F_BODY,fill=INK)
    for row in range(3):
        y=starty+row*(cellh+gapy)
        for col in range(3):
            x=startx+col*(cellw+gapx); stage=.18+.28*col+.05*row; bias=.05*(2-row)
            panel=macro_panel((cellw,cellh),stage,100+row*10+col,bias); img.paste(panel,(x,y))
            dd=ImageDraw.Draw(img); dd.rounded_rectangle((x,y,x+cellw,y+cellh),radius=20,outline=(215,220,216),width=3)
            dd.rounded_rectangle((x+16,y+16,x+145,y+54),radius=16,fill=(255,255,255,220))
            dd.text((x+30,y+24),f'Sample {row+1}.{col+1}',font=F_TINY,fill=INK)

    rounded(d,(710,1505,2280,1640),24,(243,248,244),(201,219,206))
    d.text((750,1534),'Trend + representative sampling > one image or one percentage',font=F_BODY,fill=GREEN)
    d.text((750,1586),'Mixed trichome states are expected. Genotype, tissue, canopy position and time affect what you see.',font=F_SMALL,fill=MUTED)
    footer(d,'THC Academy • Teaching Healthy Cultivation • Scientific macro illustration')
    return save_webp(img,'flower-trichome-representative-sampling.webp',82)

if __name__=='__main__':
    for meta in (make_photoperiod(),make_trichome()):
        print(f"{meta['path']} | {meta['width']}x{meta['height']} | {meta['bytes']} bytes | sha256 {meta['sha256']}")
