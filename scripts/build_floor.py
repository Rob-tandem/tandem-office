import re, sys
design = open(sys.argv[1]).read()
logo = open(sys.argv[2]).read()
out = sys.argv[3]
defs = re.search(r'<defs>(.*?)</defs>', design, re.S).group(1)
defs = re.sub(r'\s*<!--.*?-->', '', defs)
# logo inner content without the grey Figma background rect
logo_inner = re.search(r'<svg[^>]*>(.*)</svg>', logo, re.S).group(1)
logo_inner = re.sub(r'<rect width="118" height="23" fill="#E5E5E5"/>\s*', '', logo_inner)
logo_inner = re.sub(r' id="[^"]*"', '', logo_inner)

def use(sym, x, y, w, h, color=None):
    c = f' color="{color}"' if color else ''
    return f'<use href="#{sym}" x="{x}" y="{y}" width="{w}" height="{h}"{c}/>'
def g(x, y, body):
    return f'<g transform="translate({x} {y})">{body}</g>'

P = []  # body parts, in the design's document order
# floor
P.append('<rect x="16" y="16" width="1376" height="800" rx="28" fill="#FBF3E4" filter="url(#shFloor)"/>')
P.append('<rect x="16" y="16" width="1376" height="800" rx="28" fill="url(#dots)"/>')
# zone rugs
def rug(x, y, w, h, fill, ring=None, r=40, pat=()):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"/>'
    for p in pat: s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#{p})"/>'
    if ring: s += f'<rect x="{x+2}" y="{y+2}" width="{w-4}" height="{h-4}" rx="{r-2}" fill="none" stroke="{ring}" stroke-width="4"/>'
    return s
P.append(rug(42, 42, 396, 268, '#D5F1EC', '#BCE7DB'))
P.append(rug(490, 42, 428, 268, '#FBF0CC', '#F3E2A8'))
P.append(rug(992, 32, 384, 256, '#2B2F6B', r=14, pat=('starsRB', 'starsRA')))
P.append(rug(992, 320, 192, 160, '#E3F2DC', r=14))
P.append(rug(1216, 320, 160, 160, '#DCD9E6', r=14))
P.append(rug(992, 512, 384, 288, '#1B1E3B', r=14, pat=('starsNB', 'starsNA')))
# glass walls
for (x, y, w, h) in [(974,16,4,112),(974,192,4,320),(974,512,4,96),(974,672,4,144),(960,302,432,4),(960,494,288,4),(1312,494,80,4),(1198,288,4,224)]:
    P.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="2" fill="rgba(64,74,135,.28)"/>'
             f'<rect x="{x+.5}" y="{y+.5}" width="{w-1}" height="{h-1}" rx="1.5" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>')
# Playground
P.append(g(60, 60, '<path d="M6 38L18 6h72l12 32" stroke="#404A87" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  '<path d="M34 8v22M46 8v22M62 8v22M74 8v22" stroke="#8A5A2B" stroke-width="2"/>'
  '<rect x="29" y="29" width="22" height="8" rx="4" fill="#E5795E"/><rect x="57" y="29" width="22" height="8" rx="4" fill="#E5795E"/>'))
P.append(g(172, 36, '<circle cx="36" cy="36" r="34" fill="#F6DFA4"/><circle cx="36" cy="36" r="27" fill="#FBEBC2"/>'
  '<circle cx="24" cy="30" r="2" fill="#E0B95A"/><circle cx="46" cy="26" r="1.6" fill="#E0B95A"/><circle cx="40" cy="46" r="2" fill="#E0B95A"/><circle cx="26" cy="44" r="1.4" fill="#E0B95A"/>'
  '<rect x="42" y="36" width="12" height="12" rx="2" fill="#74B3E4"/><rect x="43" y="33" width="10" height="3" rx="1.5" fill="#4F91C9"/>'))
P.append(g(284, 58, '<path d="M10 66L84 14" stroke="#F6BB47" stroke-width="24" stroke-linecap="round"/>'
  '<path d="M7 55L81 3M13 77L87 25" stroke="#E5795E" stroke-width="4" stroke-linecap="round"/>'
  '<rect x="78" y="2" width="26" height="36" rx="7" fill="#404A87"/>'
  '<path d="M83 10h16M83 19h16M83 28h16" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'))
balls = [(22,24,'#E5795E'),(40,20,'#63C6AC'),(58,26,'#74B3E4'),(76,20,'#F3A7C3'),(96,26,'#F6BB47'),(30,42,'#9BA0D9'),(48,44,'#F6BB47'),(66,42,'#E5795E'),(86,44,'#63C6AC'),(22,60,'#74B3E4'),(40,62,'#F3A7C3'),(58,60,'#9BA0D9'),(78,62,'#E5795E'),(96,60,'#63C6AC')]
P.append(g(100, 164, '<rect x="2" y="4" width="116" height="82" rx="22" fill="#E9C9A0"/><rect x="2" y="2" width="116" height="80" rx="22" fill="#fff"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="8" fill="{c}"/>' for x, y, c in balls)))
P += [use('bean',288,192,32,32,'#F6BB47'), use('bean',352,160,32,32,'#E5795E'), use('teddy',54,236,44,44), use('plant',396,240,40,40)]
# The Picnic
P.append('<rect x="580" y="100" width="120" height="120" rx="10" fill="#fff" filter="url(#shSm)"/>'
         '<rect x="580" y="100" width="120" height="120" rx="10" fill="url(#gingham)"/>')
P += [use('basket',600,118,40,40), use('cake',648,150,36,36)]
P.append(g(760, 88, '<circle cx="40" cy="42" r="30" fill="#E9C9A0"/><circle cx="40" cy="40" r="30" fill="#fff"/><circle cx="40" cy="40" r="22" fill="#63C6AC"/>'
  '<circle cx="40" cy="6" r="7" fill="#404A87"/><circle cx="40" cy="74" r="7" fill="#404A87"/><circle cx="6" cy="40" r="7" fill="#404A87"/><circle cx="74" cy="40" r="7" fill="#404A87"/>'
  '<circle cx="40" cy="40" r="6" fill="#F6BB47"/>'))
P += [use('plant',860,56,40,40), use('plant',500,240,40,40), use('plant',868,236,40,40)]
# The Rocket
P.append(g(1072, 84, '<rect x="20" y="22" width="152" height="80" rx="40" fill="#1E2257"/><rect x="20" y="18" width="152" height="80" rx="40" fill="#fff"/><rect x="34" y="30" width="124" height="56" rx="28" fill="#63C6AC"/>'
  + ''.join(f'<circle cx="{x}" cy="{y}" r="8" fill="#9BA0D9"/>' for x, y in [(60,8),(96,6),(132,8),(60,110),(96,112),(132,110),(10,58),(182,58)])))
P.append(use('rocket',1296,48,56,56))
P.append(g(1010, 218, '<circle cx="22" cy="22" r="12" fill="#F3A7C3"/><circle cx="18" cy="19" r="4" fill="#F7C4D7"/>'
  '<ellipse cx="22" cy="24" rx="20" ry="5" fill="none" stroke="#9BA0D9" stroke-width="3" transform="rotate(-15 22 24)"/>'))
# The Treehouse
P.append(g(1056, 376, '<rect x="4" y="12" width="56" height="30" rx="15" fill="#E9C9A0"/><rect x="4" y="10" width="56" height="30" rx="15" fill="#fff"/><rect x="14" y="18" width="36" height="14" rx="7" fill="#63C6AC"/>'
  '<circle cx="32" cy="4" r="6" fill="#404A87"/><circle cx="32" cy="45" r="6" fill="#404A87"/>'))
P += [use('tree',1130,418,48,48), use('plant',1000,430,40,40)]
# The Cave
P.append(g(1280, 380, '<circle cx="20" cy="22" r="16" fill="#E9C9A0"/><circle cx="20" cy="20" r="16" fill="#fff"/><circle cx="20" cy="20" r="10" fill="#63C6AC"/>'
  '<circle cx="4" cy="20" r="5" fill="#404A87"/><circle cx="36" cy="20" r="5" fill="#404A87"/>'))
P += [use('rock',1326,426,44,44), use('lantern',1226,428,36,36)]
# Night Sky
P += [use('moon',1296,528,56,56), use('bean',1056,576,32,32,'#9BA0D9'), use('bean',1152,640,32,32,'#74B3E4'),
      use('bean',1248,576,32,32,'#F3A7C3'), use('bean',1120,704,32,32,'#63C6AC'), use('telescope',1008,720,56,56)]
# Desks (positions derive from DESKS in src/map.ts: unit at tile (x, y))
desks = [(1,11,'155,160,217',.33,.22,'#9BA0D9','castle'),(8,11,'116,179,228',.33,.22,'#74B3E4','rocket'),(15,11,'99,198,172',.33,.22,'#63C6AC','dino'),(22,11,'246,187,71',.33,.22,'#F6BB47','chicken'),
         (1,16,'139,211,166',.33,.22,'#8BD3A6','tree'),(8,16,'243,167,195',.33,.22,'#F3A7C3','island'),(15,16,'229,121,94',.33,.22,'#E5795E','lion'),(22,16,'184,58,87',.3,.2,'#B83A57','engine')]
for tx, ty, rgb, a1, a2, col, icon in desks:
    X, Y = tx*32, ty*32
    P.append(f'<circle cx="{X+64}" cy="{Y+67}" r="61" fill="rgba({rgb},{a1})"/><circle cx="{X+64}" cy="{Y+67}" r="54" fill="none" stroke="rgba({rgb},{a2})" stroke-width="14"/>')
    P += [use('desk',X+32,Y+32,64,32), use('chair',X+36,Y+70,24,24,col), use(icon,X+92,Y+20,40,40)]
# between the desks
P += [use('plant',188,420,40,40), use('plant',636,580,40,40)]
P.append(g(408, 580, '<rect x="4" y="6" width="40" height="38" rx="5" fill="#E9C9A0"/>'
  '<rect x="9" y="12" width="7" height="12" rx="1.5" fill="#E5795E"/><rect x="18" y="12" width="7" height="12" rx="1.5" fill="#63C6AC"/><rect x="27" y="12" width="7" height="12" rx="1.5" fill="#74B3E4"/>'
  '<rect x="9" y="28" width="7" height="12" rx="1.5" fill="#F6BB47"/><rect x="18" y="28" width="7" height="12" rx="1.5" fill="#9BA0D9"/><rect x="27" y="28" width="7" height="12" rx="1.5" fill="#F3A7C3"/>'))
P.append(g(844, 424, '<rect x="2" y="12" width="40" height="20" rx="5" fill="#B8BCC9"/><rect x="10" y="4" width="24" height="12" rx="2" fill="#fff"/><rect x="8" y="22" width="28" height="6" rx="2" fill="#404A87"/>'))
# Reception: sign with the Tandem logotype (118 x 23, contained in 256 x 50)
P.append('<rect x="318" y="651" width="292" height="76" rx="14" fill="#fff" filter="url(#shSign)"/>')
P.append(f'<svg x="336" y="664" width="256" height="50" viewBox="0 0 118 23" fill="none">{logo_inner}</svg>')
P += [use('sofa',128,736,96,32), use('sofa',704,736,96,32)]
P.append('<circle cx="464" cy="752" r="18" fill="rgba(246,187,71,.35)"/>')
P.append(use('bell',446,732,36,36))
P += [use('plant',40,650,44,44), use('plant',866,650,44,44), use('plant',932,20,36,36)]

def stars(id, ox, oy, w, h, r, fill):
    return (f'<pattern id="{id}" patternUnits="userSpaceOnUse" x="{ox}" y="{oy}" width="{w}" height="{h}">'
            f'<ellipse cx="{w/2}" cy="{h/2}" rx="{r}" ry="{round(r*h/w,3)}" fill="{fill}"/></pattern>')
extra_defs = ''.join([
  '<filter id="shFloor" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="10" stdDeviation="20" flood-color="#000" flood-opacity=".35"/></filter>',
  '<filter id="shSign" x="-20%" y="-40%" width="140%" height="190%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#292E4D" flood-opacity=".16"/></filter>',
  '<filter id="shSm" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#292E4D" flood-opacity=".14"/></filter>',
  '<pattern id="dots" patternUnits="userSpaceOnUse" x="16" y="16" width="32" height="32"><circle cx="16" cy="16" r="1.25" fill="rgba(41,46,77,.08)"/></pattern>',
  stars('starsRA', 999, 43, 53, 47, 1.2, '#fff'), stars('starsRB', 1011, 35, 29, 37, 1.0, 'rgba(255,255,255,.5)'),
  stars('starsNA', 1001, 525, 61, 43, 1.2, '#fff'), stars('starsNB', 1014, 517, 31, 29, 1.0, 'rgba(255,255,255,.5)'),
  # gingham: two coral .45 stripe layers, multiply-blended over white (CSS background-blend-mode), precomputed
  '<pattern id="gingham" patternUnits="userSpaceOnUse" x="580" y="100" width="32" height="32">'
  '<rect width="16" height="16" fill="#E89583"/><rect x="16" width="16" height="16" fill="#F3C3B7"/><rect y="16" width="16" height="16" fill="#F3C3B7"/></pattern>',
])
svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="1408" height="832" viewBox="0 0 1408 832">\n'
       '<!-- Storybook Land floor. Generated from the design artboard Main.dc.html (1408 x 832, 1 tile = 32 px).\n'
       '     Text (zone pills, desk signposts, "ring me") is drawn by src/render.ts with the Baloo 2 web font. -->\n'
       f'<defs>{extra_defs}{defs}</defs>\n'
       '<rect width="1408" height="832" fill="#2F3766"/>\n' + '\n'.join(P) + '\n</svg>\n')
open(out, 'w').write(svg)
print(len(svg), 'bytes')
