```tikz
\usepackage{circuitikz}
\makeatletter
\newif\ifdcSvg
\edef\dcDriver{\pgfsysdriver}
\def\dcXimera{pgfsys-ximera.def}
\def\dcDvisvgm{pgfsys-dvisvgm.def}
\ifx\dcDriver\dcXimera\dcSvgtrue\fi
\ifx\dcDriver\dcDvisvgm\dcSvgtrue\fi
\ifdcSvg
\def\dcCenterAnchor{base west}\def\dcStartAnchor{base west}\def\dcEndAnchor{base west}
\else
\def\dcCenterAnchor{center}\def\dcStartAnchor{west}\def\dcEndAnchor{east}
\fi
\newcommand{\dcCanvasText}[2]{\ifdcSvg\special{dvisvgm:raw #1}\else #2\fi}
\DeclareSymbolFont{dcLetters}{OT1}{cmss}{m}{n}
\SetSymbolFont{dcLetters}{bold}{OT1}{cmss}{bx}{n}
\DeclareSymbolFontAlphabet{\mathrm}{dcLetters}
\def\dcM#1{\DeclareMathSymbol{#1}{\mathalpha}{dcLetters}{`#1}}
\@tfor\dcChar:=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\do{\expandafter\dcM\dcChar}
\makeatother
\begin{document}

\definecolor{dcColor0}{HTML}{171A20}
\definecolor{dcColor1}{HTML}{2463CB}
\begin{circuitikz}[european resistors, american inductors, american ports, line cap=round, line join=round]
\tikzset{dca/.style={draw=dcColor0, line width=1.5pt}}
\tikzset{dcb/.style={draw=dcColor0, line width=1.5pt, fill=white}}
\tikzset{dcc/.style={text=dcColor0, font=\fontsize{15}{19.5}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0}}
\tikzset{dcd/.style={text=dcColor0, font=\fontsize{15}{19.5}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-45}}
\tikzset{dce/.style={text=dcColor0, font=\fontsize{15}{19.5}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-90}}
\tikzset{dcf/.style={text=dcColor0, font=\fontsize{15}{19.5}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-135}}
\tikzset{dcg/.style={text=dcColor0, font=\fontsize{15}{19.5}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-180}}
\tikzset{dch/.style={text=dcColor0, font=\fontsize{15}{19.5}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-225}}
\tikzset{dci/.style={text=dcColor0, font=\fontsize{15}{19.5}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-270}}
\tikzset{dcj/.style={text=dcColor0, font=\fontsize{15}{19.5}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-315}}
\tikzset{dck/.style={text=dcColor0, font=\fontsize{6.75}{8.775}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0}}
\tikzset{dcl/.style={text=dcColor0, font=\fontsize{6.75}{8.775}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-45}}
\tikzset{dcm/.style={text=dcColor0, font=\fontsize{6.75}{8.775}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-90}}
\tikzset{dcn/.style={text=dcColor0, font=\fontsize{6.75}{8.775}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-135}}
\tikzset{dco/.style={text=dcColor0, font=\fontsize{6.75}{8.775}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-180}}
\tikzset{dcp/.style={text=dcColor0, font=\fontsize{6.75}{8.775}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-225}}
\tikzset{dcq/.style={text=dcColor0, font=\fontsize{6.75}{8.775}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-270}}
\tikzset{dcr/.style={text=dcColor0, font=\fontsize{6.75}{8.775}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-315}}
\tikzset{dcs/.style={draw=dcColor0, line width=1.5pt, dash pattern=on 3pt off 3pt}}
\tikzset{dct/.style={text=dcColor0, font=\fontsize{10.5}{13.65}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0}}
\tikzset{dcu/.style={text=dcColor0, font=\fontsize{10.5}{13.65}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-45}}
\tikzset{dcv/.style={text=dcColor0, font=\fontsize{10.5}{13.65}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-90}}
\tikzset{dcw/.style={text=dcColor0, font=\fontsize{10.5}{13.65}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-135}}
\tikzset{dcx/.style={text=dcColor0, font=\fontsize{10.5}{13.65}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-180}}
\tikzset{dcy/.style={text=dcColor0, font=\fontsize{10.5}{13.65}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-225}}
\tikzset{dcz/.style={text=dcColor0, font=\fontsize{10.5}{13.65}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-270}}
\tikzset{dcaa/.style={text=dcColor0, font=\fontsize{10.5}{13.65}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-315}}
\tikzset{dcab/.style={text=dcColor1, font=\fontsize{16.5}{21.45}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0}}
\def\dcga#1#2#3#4#5{\draw[dca] (#1,#2) -- (#3,#2) (#4,#2) -- (#5,#2);}
\def\dcgb#1#2#3#4{\draw[dcb] (#1,#2) -- (#3,#2) -- (#3,#4) -- (#1,#4) -- cycle;}
\def\dcgc#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#3,#4) (#5,#6) -- (#7,#8);}
\def\dcgd#1#2#3#4#5#6#7#8{\draw[dcb] (#1,#2) -- (#3,#4) -- (#5,#6) -- (#7,#8) -- cycle;}
\def\dcge#1#2#3#4#5{\draw[dca] (#1,#2) -- (#1,#3) (#1,#4) -- (#1,#5);}
\def\dcgf#1#2#3#4{\draw[dcb] (#1,#2) -- (#1,#3) -- (#4,#3) -- (#4,#2) -- cycle;}
\def\dcgg#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#3,#2) (#4,#2) -- (#5,#2) (#3,#6) -- (#3,#7) (#4,#6) -- (#4,#7);}
\def\dcgh#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#1,#3) (#1,#4) -- (#1,#5) (#6,#3) -- (#7,#3) (#6,#4) -- (#7,#4);}
\def\dcgi#1#2#3#4#5#6#7#8#9{\draw[dca] (#1,#2) -- (#3,#2) .. controls (#3,#4) and (#5,#4) .. (#5,#2) .. controls (#5,#4) and (#6,#4) .. (#6,#2) .. controls (#6,#4) and (#7,#4) .. (#7,#2) .. controls (#7,#4) and (#8,#4) .. (#8,#2) -- (#9,#2);}
\def\dcgj#1#2#3#4#5#6#7#8#9{\draw[dca] (#1,#2) -- (#1,#3) .. controls (#4,#3) and (#4,#5) .. (#1,#5) .. controls (#4,#5) and (#4,#6) .. (#1,#6) .. controls (#4,#6) and (#4,#7) .. (#1,#7) .. controls (#4,#7) and (#4,#8) .. (#1,#8) -- (#1,#9);}
\def\dcgk#1#2#3#4{\draw[dca] (#1,#2) -- (#3,#4);}
\def\dcgl#1#2#3#4#5#6{\draw[dca] (#1,#2) -- (#3,#4) -- (#5,#6);}
\def\dcgm#1#2#3{\draw[dca] (#1,#2) -- (#1,#3);}
\def\dcgn#1#2#3#4#5{\draw[dca] (#1,#2) -- (#3,#4) -- (#5,#2);}
\def\dcgo#1#2#3{\draw[dca] (#1,#2) -- (#3,#2);}
\def\dcgp#1#2#3#4#5{\draw[dca] (#1,#2) -- (#3,#4) -- (#1,#5);}
\def\dcgq#1#2#3{\draw[dcb] (#1,#2) circle (#3pt);}
\def\dcgr#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#1,#3) (#4,#5) -- (#6,#5) (#7,#5) -- (#8,#5);}
\def\dcgs#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#3,#4) (#3,#2) -- (#1,#4) (#5,#6) -- (#7,#8);}
\def\dcgt#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#3,#2) (#4,#5) -- (#4,#6) (#4,#7) -- (#4,#8);}
\def\dcgu#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#3,#4) (#1,#4) -- (#3,#2) (#5,#6) -- (#7,#8);}
\def\dcgv#1#2#3#4#5#6{\draw[dcb] (#1,#2) -- (#3,#4) -- (#5,#2) -- (#3,#6) -- cycle;}
\def\dcgw#1#2#3#4#5#6{\draw[dcb] (#1,#2) -- (#3,#4) -- (#1,#5) -- (#6,#4) -- cycle;}
\def\dcgx#1#2#3#4#5{\draw[dcb] (#1,#2) -- (#3,#4) -- (#1,#5) -- cycle;}
\def\dcgy#1#2#3#4#5#6{\draw[dcb] (#1,#2) -- (#3,#4) -- (#5,#6) -- cycle;}
\def\dcgz#1#2#3#4#5{\draw[dcb] (#1,#2) -- (#3,#4) -- (#5,#2) -- cycle;}
\def\dcgaa#1#2#3#4#5#6{\draw[dca] (#1,#2) -- (#3,#2) (#4,#5) -- (#6,#5);}
\def\dcgab#1#2#3#4#5#6{\draw[dca] (#1,#2) -- (#1,#3) (#4,#5) -- (#4,#6);}
\def\dcgac#1#2#3#4#5{\draw[dca] (#1,#2) -- (#3,#2) -- (#3,#4) -- (#5,#4);}
\def\dcgad#1#2#3#4#5{\draw[dca] (#1,#2) -- (#1,#3) -- (#4,#3) -- (#4,#5);}
\def\dcgae#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#3,#2) (#4,#2) -- (#5,#2) (#6,#2) -- (#7,#8);}
\def\dcgaf#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#1,#3) (#1,#4) -- (#1,#5) (#1,#6) -- (#7,#8);}
\def\dcgag#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#3,#2) (#4,#2) -- (#5,#2) (#6,#2) -- (#7,#2);}
\def\dcgah#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#1,#3) (#1,#4) -- (#1,#5) (#1,#6) -- (#1,#7);}
\def\dcgai#1#2#3#4{\path (#1,#2) rectangle (#3,#4);}
\def\dcgaj#1#2#3#4{\draw[dca] (#1,#2) -- (#1,#3) (#4,#2) -- (#4,#3);}
\def\dcgak#1#2#3#4{\draw[dca] (#1,#2) -- (#3,#2) (#1,#4) -- (#3,#4);}
\def\dcgal#1#2#3#4#5#6#7#8#9{\draw[dca] (#1,#2) -- (#3,#2) (#4,#2) -- (#5,#2) (#3,#6) -- (#3,#7) (#4,#8) -- (#4,#9);}
\def\dcgam#1#2#3#4#5#6#7#8#9{\draw[dca] (#1,#2) -- (#1,#3) (#1,#4) -- (#1,#5) (#6,#3) -- (#7,#3) (#8,#4) -- (#9,#4);}
\def\dcgan#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#1,#3) -- (#4,#3) -- (#4,#5) -- (#6,#5) -- (#6,#7);}
\def\dcgao#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#3,#2) -- (#3,#4) -- (#5,#4) -- (#5,#6) -- (#7,#6);}
\def\dcgap#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#3,#2) (#4,#2) -- (#5,#2) (#6,#7) -- (#6,#8) (#4,#7) -- (#4,#8);}
\def\dcgaq#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#1,#3) (#1,#4) -- (#1,#5) (#6,#7) -- (#8,#7) (#6,#4) -- (#8,#4);}
\def\dcgar#1#2#3#4#5#6#7#8#9{\draw[dca] (#1,#2) -- (#3,#2) (#4,#5) -- (#6,#5) (#4,#7) -- (#6,#7) (#8,#2) -- (#9,#5);}
\def\dcgas#1#2#3#4#5#6#7#8#9{\draw[dca] (#1,#2) -- (#1,#3) (#4,#5) -- (#4,#6) (#7,#5) -- (#7,#6) (#1,#8) -- (#4,#9);}
\def\dcgat#1#2#3#4#5{\draw[dca] (#1,#2) -- (#1,#3) (#4,#2) -- (#5,#2);}
\def\dcgau#1#2#3#4#5{\draw[dca] (#1,#2) -- (#3,#2) (#1,#4) -- (#1,#5);}
\def\dcgav#1#2#3{\draw[dcs] (#1,#2) -- (#1,#3);}
\def\dcgaw#1#2#3#4{\draw[dcs] (#1,#2) -- (#3,#4);}
\def\dcgax#1#2#3{\draw[dcs] (#1,#2) -- (#3,#2);}
\def\dcgay#1#2#3#4#5#6{\draw[dcb] (#1,#2) -- (#1,#3) (#4,#3) -- (#1,#5) -- (#6,#3) -- cycle;}
\def\dcgaz#1#2#3#4#5#6{\draw[dcb] (#1,#2) -- (#3,#2) (#3,#4) -- (#5,#2) -- (#3,#6) -- cycle;}
\def\dcgba#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#3,#2) (#1,#4) -- (#3,#4) (#5,#6) -- (#7,#6);}
\def\dcgbb#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#1,#3) (#4,#2) -- (#4,#3) (#5,#6) -- (#5,#7);}
\def\dcgbc#1#2#3#4#5{\draw[dcb] (#1,#2) -- (#3,#2) .. controls (#4,#2) and (#4,#5) .. (#3,#5) -- (#1,#5) -- cycle;}
\def\dcgbd#1#2#3#4#5{\draw[dcb] (#1,#2) -- (#1,#3) .. controls (#1,#4) and (#5,#4) .. (#5,#3) -- (#5,#2) -- cycle;}
\def\dcgbe#1#2#3#4#5#6{\draw[dca] (#1,#2) .. controls (#3,#4) and (#3,#5) .. (#1,#6);}
\def\dcgbf#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) .. controls (#3,#4) and (#5,#6) .. (#7,#8);}
\def\dcgbg#1#2#3#4#5#6{\draw[dca] (#1,#2) .. controls (#3,#4) and (#5,#4) .. (#6,#2);}
\def\dcgbh#1#2#3#4#5#6{\draw[dcb] (#1,#2) -- (#3,#2) -- (#4,#5) -- (#3,#6) -- (#1,#6) -- cycle;}
\def\dcgbi#1#2#3#4#5#6{\draw[dcb] (#1,#2) -- (#1,#3) -- (#4,#5) -- (#6,#3) -- (#6,#2) -- cycle;}
\def\dcgbj#1#2#3#4{\draw[dca] (#1,#2) -- (#3,#4) (#1,#4) -- (#3,#2);}
\def\dcgbk#1#2#3#4{\draw[dca] (#1,#2) -- (#3,#4) (#3,#2) -- (#1,#4);}
\def\dcgbl#1#2#3#4#5#6{\draw[dcb] (#1,#2) -- (#3,#4) -- (#5,#4) -- (#6,#2) -- cycle;}
\ifdcSvg
\special{dvisvgm:raw <style><![CDATA[/*! Copyright 2013 The Comic Relief Project Authors. SIL OPEN FONT LICENSE Version 1.1; full license in each WOFF metadata block. */@font-face{font-family:'Comic Relief';font-style:normal;font-weight:400;src:url(data:font/woff;base64,d09GRgABAAAAAErmAA4AAAAAZdQAAQAAAABCzAAACBoAABIMAAAAAAAAAABHREVGAAABRAAAABYAAAAWABECX0dTVUIAAAFcAAAAbAAAAIjk4dz6T1MvMgAAAcgAAABYAAAAYIT6lkZjbWFwAAACIAAAAooAAAVsJNQgZGdhc3AAAASsAAAACAAAAAgAAAAQZ2x5ZgAABLQAACufAAA5tkSGTW5oZWFkAAAwVAAAADYAAAA2HNWRgGhoZWEAADCMAAAAIAAAACQM0RB+aG10eAAAMKwAAAUcAAAJfDB9ilVsb2NhAAA1yAAAAZ0AAATAzRbbvW1heHAAADdoAAAAHAAAACACcAEwbmFtZQAAN4QAAAH4AAAFNoB7pchwb3N0AAA5fAAACUUAABDCyJGMzXByZXAAAELEAAAABwAAAAdoBoyFAAEAAAAMAAAAAAAAAAIAAQABAl4AAQAAeNpjYGRgYBBgkGDgYmBikGFQYWDMSSzJYzBiYMrJT85hkAOTQFGgKkYGHSitBSZBgBFMM/mEeCgwqAT5+yqA1aj8Pwo0TYWBhaGRoYOJgUmYgeH/f4gOMA2GjB1AkoWhnqGd8R+TEABS3xKQeNpjYGG5zjiBgZWBgXUWqzEDA6MqhGZewLCeqYyLg5mfnYmZmYmJiYWBgamdAQn4+Ie6MBxgUPjNxFHw152BgeMiU6MCA8N8kBxLIJsQkFJgYAQAfnYNUHja7ZRnbM9BGMe/z/9LjHfEG5%
EIRc2i9l6191Z7q713rRd2xCo6qCpV3VWttpSqtuhGaKJF2tCIGUFIyN39XBqvxCu8kXiS710ud3mey+f73AFwWdGqjh2lcq5S1RuQsXZRDWPRAA3hhkZojCZwR1M0Rwu0RCt4oDXaoC080Q7t0QEd0Qmd0QVd0Q3d0QM90Qu90Qd90Q9e6I8BGITBGIKhGIbhGIGRGIXRNv84jMcETII3JmMKpmIapmMGZmIWZmMO5mIe5mMBfLAQi7AYS7AUy7AcK7ASq7Aaa7AW67ABG7EJm+GLLdiKbYgQT1dnbuNO7uJu7uFe7uN+HuBBHuJhHuFR+vEYj/ME/RnAQAbxJE8xmKcZwjMM5TmG8TzDeYERjGQUoxnDWMYxnheZwEtMZBIvM5kpTOUVXmUar/E603mDGbzJTGYxm7d4m3eYw1zmMZ8FLGRRQ3e32o5jGf/MtNlvMx34C6ZjfjCd+EdM1/9LTOWNeEmOBIq7pOCz5EkCvkqq1BJviZfHLg8JkrfyXLpKB3kghVJftorLnvcRN+kpkahwMpwi565T7DxyXjrvnE/WI7HvoQZqorZ1qont+jbWC6/KHh6O+8jHPWRJgdS17LNRhCd4JSI1pK7N7SGtxVN62BuNtBXWyw7Za+tHS7GUSKmUIR4xiEMYQlDP+WJ2mQCdpXbq4ypUnVXp6pmurp6aKmqj2q6CTbjy03WUn/qgYlWiSlZpKku7VJF6qEpVmSpX71WhWmWVqYLVa71MJ+gk/cL4ax+9QafrozrCROgoM02X6HJdoT9qY46ZmsbNdDEDTX8zzOww9fQaU18bnWt87a6v/lbmVRZU+RP8j78a3wFUtVFmAAAAAQAB//8AD3jahXsHfJRV9vac+5aZ9MxMkklPJh1CSSaZJJBCGum9QDKTRhqpdEKAEHpApYOC9CYidgRE1AVUZFEEBEUWxYJiA91VEZFk7nznvjMB3P/ufr9o3pKZW8495TnPOciIrJk2c5vFZhknk8tkaq%
VWGaxVapu5aJOOtJg20WaF7K6sWR6Nn2wxHxUmCn/KnGVqmQxCAgPkIGrcYtVatVtsTCioBa47oXxcAk2LqK+L2AZfbousbYg0vbyPviKU7tvXH/qIj9cj8ArNf9Tb5xHelUYRs3lwTCLKQCYbfBbdZKHE2+wti7a8x7WdNO/j7wgmmUKmlY3A2d00+CMXg7kAOSdqdLF8cFCsKjgkNAZXQoJD5CHqGMsn2E8oPJWR8WN24oRy+sJ4I9FyBlsFiKAEm+RWes87zdf1tcJquvJ4tCrBsGG7sctNvWLelNqJQhQQ+do5a3uDyTvV99a0E/BIS9kP3u+4uri4f/Q12ASpbIWBWQoHp4TCec1Rwx3tFLgD60px5c64cpDlmU/zq0WlLBgfpDXhCkNCQ+QiJyqJ5Zm9wVXiW310bAzRTltaOTY3M5Tn5z994eo7fbBuza9Hd5xUOE2IW1V/eH5ebUk2/1mur+vI6NSQ7FEp5dpAeus4XU3fP/E3hTy1MG+Zyt6YbCNOX/fFryvn4YrGmJ8R1ok2uKIduCIiO2z+uzBL+F3mIvPFNVkF6BYbFBukVkEQCjFEw2tkTHBCKMQYSABndHGqvgjNPeDgpKFz6D/pZnt7l1yw+RCilTbLm+iRT4TfK+9tnEg4gRMar4ATTIf8H4YQEG46vk1v/Ll64xQFh7LYbf6Ef0a4jmfI5g0JFKW5o9yigpkEBLX1EhSswyvU2ds5u1ax41IobO3JGys5bqVpgyOJkm4+sYEcyGW3wjXCQfm9VxsJ4aFqOnBExxEjXqGZkKoZwPTKOjPKwEfSs9XmT4Q/cSWoZ/RNlIpc5gNF0l+2mi8IB4Qf8JN66flt8wV5k/CD9MlfpE/q4XXpZA+YP+ZfEr6UeeCDtBO0hfs7kK64RxiKAiSGDnD+P+s2ZdvbKnHxlqU3k20cGGfgqpsIYdvgCW/Rn3eFONFRFs5mGdSR2L9oktyiSXxsjDpGLrB1BIvc4UWXF0w0lG%
R0T6nfZZySnuTpue+pgTtPbIL16/4JcUff8lXUUtjAcfNgihe49NjL+2YOfLdpSeJoXj5hdsQwo6Gxfuiwz7+ka+jZEyfkNs+8BPMaQUEaOoA/xNZ11Gzid+LulTKZoAvlBDd9dGhwQGBAoKhRu4GhXUgkxxrqBr7nOFFRxacIXAP/jDOZ1EEcSPu974w4glXSMveH5KcllmsM0w2tOgZ8JQXAb3ET5HImRz/SYiBOAzscCR7SuHv7mwhMJGPoV/QrlNtEoayajDMdJenVbI1p5sv8COGyTIOeLcDVJSqKCwzBixbVK1Crli5XlvX+5PPxsl7y2WJCZtMT3jCM3QiXa6f0b4faqQ0dfH1DB+qBdSzUiwRJL6RnuacsFDLNf8CJ+++zzZeFj6yaNUvSlwTYJ+nLWPMhIVi4Ku2XrUardAn0R6mJciLwSmWUGy4Hzi/rhZBn6a0J9aIfmGHGj9JqrhraB1y2masBKmiBuwrmct9C7UQc86L5FN8vcjK3h2QIkjsGpoGAEiyzStCeTKlLT6k2rSSVWTm5haZ3UIK/kPH3NqKVtBAw9RempxQQR9KRk51dbtpGsmpwN9bxcXd50h6azZf4RMEsc5LJNLrI4Bh9NGq7dFjiCVdOUddgGudLWtiMwxygpZU48bSWzdEmA/Nv5m3CflElc8TvusWCZZkhLIqkd+ngOnyl6yqOMn0Qsi3E9EHU8Ji5/BP9bXNjgucIGQbDvWNzcPYy817xsnBH5o06hyNY4g4zASCRzA4s8UjtxrUYkiD4pYDpHb6UBlY1RdGPb3vWVPnTW0E1bQEXL4eo5Ue4yoGuFxwdVvPX9xNu38BInutwdFzW37xVn7CNe3pg/zbcvXU+3P04affzzR+JThiFXPEB2ISDAh9UWWHEgNZTL7nMdqLh/uE9vIOgwhoJ5PJdvoCmfpiZOj+mf7s/4VuEzGpSjvNYx8V5KiQPPd18UnQUbskcZF44E8+hUQQGoOU7o+UHyW%
VKF42b1j9WpVZxr8Nqkb825/K1RZN/23uJbv6Q9q95DzJg1LlfAQStF22hb9I/1i+bfgRaf9x+lP+VXqDT6Y4v7kIAbCDTpOiwXz5JbMS526U9Wp9lEZJdk1CiRm8j+RsVh55G42Y1n5hYFUdCQ3iUAlG7abQBcjGKPPXjruNafebwrV3H989dFhZRMmr/OH+/XtjbBaSLnunTN0UOO7nQ9NnjVwpK4wN20ee7CHRV/AO4vcADt2dquUJeXvMJHaA3T75izMyoMLz4EuSDHpT7pyjat/xB79Kn37tqqGB2NhbXuQjXyexsOq4c1+/C3ltlh/uZINljIz4/h7Jkn1sn2eME2XZJylXmi/ww4S6iGdQntRQH8RhZIETTYRhCI+0bUcY1o+TDib2HL+xtP1I/ge5p3abKK46/XpI+roJuF36uuLdPMiMNRzRLb5j7A20d+TM2QDYtfnxTMOKXGvMt/k/hgixQNoThl2CrEwqMDVI6B8dGSRKVPJQo55XOgigPDADe1VlQcUF652CImE1GNwBp+JyD2zSQnGL3pjc7Z78IQBXwNcDuTvgehtLTirP0EoxOLiuZ2ukHb8GGAEPJ1Mllw0cMoSm0d0hcHFfo+0/6qzt40JuBF0HNQIms1XxZ/FzUsjimxhUwq9ITdL6Wq3VtbTMX2kB9MwFOY7mm9RHou/fITOFo872fWjmulSwjfQ/u2ppw5GDzt0KUaG/BPmimLEpJOsT0ODaGY1BDhQqEtoPixydwUUyqkQet3/8VL5DKDk4QwHvZcjlUtXK28zN2qbi6NqI8kZEpLFwoCAtNn+5+3efs2XYg7efO+Z18C/6cxAuTaOeFaa7kp8mTTe5+i5fiOW8yB4hRwg20WhZDB+1HFysFUESMaEeCZGORLJhqNPdtjfvIYlAfQNrLq481ZSc2blcr0a5Mz0tWB4+3pnV0rMuqYMa3R/iK/4l+QnvubLlW8Fx1YWrtEypXCIce0viGJ51K36EmWN%
0UWdTQ57Fk6kGo+W4LrmwBYsOPhH+ilQehTqAvQ4XjJPjK5GFVx5hYcLuPd/nixTPomEMp77S10I29M1WaB5qpdIafJ5uMGRk3C8uaOuizLhkdsHtY1lWwB4WXrR1fcW+XpKJuHEGtcZssxAEhS1eu3xaEVmK1BbSaaZIXWGH+SNBjdEcMhE5VFRxkwdKDeGMQt1oQSGiI5X4QkbDPQFBl6FiEgQvCQvrST3QsqkstHxVloyiKK5p16PbePxxtehs/+SVxl9Km1rCvY8WE4FEct65l/dNrnuMvP7Gdfi+K6x5bmBqg9tXE5zo7pSZkRmp1ALWr7+5aNFGusNEcNuRk2IoxISrvqKTk4aKYUcpW3We+KTQJN5k0YxFU6mJjArVMpnq2LAjCM8cXAWzxGsBwKS6HNu6HRRy/aOATeDXCngPePoLmw2pYLb10aCPgZ+NAgk2fauxdksuhrAPO6cLsHRzsw3TwHj52jHB1cDC9b3rf3c0L559pPiscEz5jmEjCG7pYKypkNjSwrPfWLT9iaCe+8FQfIYuEzypaod9dCgg3oaqeeSvrCHgOi6W8ZzAS2CCGYVYk4QadPjqQ+x9RgRRlpcLNypqZ/ys4cCn5Ofl58Pn/L0SgpzQdRrQ8XX4eV+RiiXwcIha1OiYUtdRyZzosL2rg7B1oL53Ac9DYBJxAGkmuq5MgP2+iZIvpjGkDRoqlJPB5OG36buALXIGSxD5nNptN5mf4H0RH3PMu5rEtz3Ifhqxkw+DtwfeySPMz4n5EwsyT10qefBccl7R1gvkcf0z4XsKiksEwf4LrDAzQgBuZ6u1dMBJycp7IcqGn6LuuWY/nQM6IITY2Hjv46oGM/t18TcZA/54tbCSj+aT8G7RIv8GRVBjV2UjW3ziepPmIXoSt3t55ETjuhiw3+i591yXv4fFH5nt750cADjk8VqFw28u3431m/wa+I9tyyQJz/+N7NOxv3KSBtdLs1kxNwqs4lQRnrDjJAu%
cg5HhrFpymrvGZhgQ4Cx8kGDLjqSuczmotbkWovrZVuJpYbXrF1JsfMzaflJmey0uPySeLSH514shHqB989QjTqirzT0IbYlQbjH2YD923lQA1OkqLv+fuv6uBNt6d2UP/522zuG7y/SICi0za7u6H3udUQ1UHKa+B+hpiy+5xN4PnyvJgVBkJMGlAMgiI4ddX6OgOOjp5XGEkUe8oKJ48hkwJEa5ETDSFkC9a4mMKB/bRI7tCR/UJ4UUomSrz+8gTXJeQF5pzYDAagkYAkf12Y8+Cdiz09N+YMYcrHzAMmcO79EDPwNP81eLUqfzkFhD6d0aOasGkv20qx3TJOh7qFsPmBHXrBT6AL0Z5YG4qxGA6jPKOVUmZeZBcVKuC0fdxFi8nqkW4W33eZV5n+Whe0Gi6E33ovX99yHFEnzf+PGdzcFhO24QRQZVx0LrE021d479g+LwFXo4epaeepaep33veoiPobi7UqjwTd9OSbGn2zTh7jXV2lozjvBz577MvPTopQz8mVSEOm5ifXUyP/fYhmltUbfrg7IGhRXEz9+SllFVhsukUuyhh1PRpHx5Cw/Y/48nfn30HLcmS7ApnFz6VhRDvscjEAOYnqCPe5j7BToxCjiBMFonRiZNWI5culjjJ1BONRIpRYIkBGCU4tSVMxPLffrk1v7QkfdKbS7YPi7hobq7eMYbeOFRTD4o3VjS8Hp2bamrQJXh6TM4L0lbOP1U2v3Wth/P+IdB2si4hfvwqiHji0L6D9k7PbL7XQE++/+E/BO75ufQfJSOG8DnFdVkZIh8X3UjT6JmOPXLbR4uPs1NdRYpgGZcjk8M1s5m8gHpzkE/g3cUpLF9hOmjND6S0gTSGD6M3MyIKMn7+V0aeLoP+OFycDJH0XH50UT6I9F5+UXQ+6CJZ3gG3+HncfgmNW+Pcw6zNYEwEZVFeanP5ru6iWkE0pvmNLGotTFre0tQY6JVWSJK3urttXgiQXTFtGcfVrOL4R6%
cAlJd3GX0DcY4h5A/uNTFe4mRCNG6uFhlLYMmKVCwHEBsNv1UBXC3315af35ieNCb71TeSk9OSt31g9PWpvwjiKGKc2VXkV1Lul7s5IyE559jJlIQxKdvztMXlgXk3jEzbp5lniF+KRlmtrJXNJsGvEDmPeoaaP7g7KWhKP/hXiUeTM3OTkAhGNuv+5VIMeoAB2E+UzvIpVxf2d2S9RA3KSe/M05Gu8hqd66hcGm1vCxe6c5Tq3Mp9SZlDgyAoeW/ztGm7g4KPlB9Z1JiQ4MiHVf2tbdbjbX3OV2Z2jhja3atrKS3Me6lnVqAjgCpgXMTo7iP+2jc3jxuT7usflFCdQFenjHEML3/iKTKtHxyyA1xs42kYXRbvlOLqNNrZt6yuq2nypJY3lo+L1Dlw2syljasf2zQy4kLH3Y2lI0ZxQUmjjeW6aEcfl4hHl742NqfCcGD+2IgGJ65sREZeUcmERXE1DjawWeHw5B9Ghc1+wGMisuXmD/ipYg76a0QcFibNjRkv/qisYsMEXAx9QEaCQqKDGhWbXjiwfK2d05Prr3QbfD3tCAQtOGGzb29btoHnilLFnOp75e2E1DYBLF79HjgcfDZKqSShDfcylavhvV2hnkX1z83sGI96025eiRo+GX25FDMsuv3SWF9yKri0JNQ0xE/MDkz5s780OKhEFFNY+K6nG4mLeIh9Ax0o5m46PRcNbxgEKKsg4iuQd3fvNJgmry7AHXbSJr5P9MIdYj6IhmNJjxCqW6AfOifkdwbRKVoDSxYtD+z3sR7BfuNe8DaurI7eZGNjtHV6lv5+frJTggB/+MduGKadW7ilc7a/7aS61hpBmPOkk124HZ1kMw2C8jzCt/wLfHZW2ihKVlzJnbm+kJ6499M0fq8dZ/Pn0cXFHJnNqW76e48YkleRPn5MhA3H4qeMLiSvimUseqtR91Dv3Fw5wvCSXMQEPTQmlEPTwnDhr740uZHnGydzPBgWrFqDBOLy5Ugcrt%
4Ba+nTHOcbkTwqMSE+OYK+QWc0VhByFVJa585phaev29pPL6Uz2GwizvamZTZQqxiujI1hKsAIMExs3KL8OQ65Opw1BH7kOPr0WoDtq+9PtZaQXsDTti7EFw7AitLp9rbXaWXL3J4WevwqIRWNsALSI5JHJyaMTmZzvkAnkDcRnzAGHrNEnI2PkrYnV8filaTSz+oR8DdCjKLTOH++68FO4WcCc/6c0gtQ3QQERHuobWQjHaTV5KR1JEaKadRow64usW6Yh3BIRA0f13nQdf58YyeBhEYcsl74GRpr4c/bmD001QERyDxxzVw2Uq35PPcZH8xiF4tT/54NPPAbUlQL71q+JKeY4/LSSjfMnDAyPTFsdv2ss0s6n5x77Nakcm3cpSJBaJjct2pSnefI8VkBkXVJQ/xtnI5vu/PFhlkANblxNczTh5qf5mfzyUQkxRI2fNa8G/bzRsSM12T+3HGZCNcwqQfZMfo4cZY9x3Qd0yortwjvlYXMCEhPHrYoaMGwOvpZhZ/3BPDIZxZtQIsukSyaoW0UsNX9oZWwDViIHu7hXbpwPxqIY+hIQ/eXj623UWxY+vz+DfIixlNef2XF0vRywhfG9T73sphDjKbjXl5Rzx6md05tWIxbKSOkU3i64d7bK5ydDJOnvdww1m/oqz+wVZSYT3E/Yx7jIBvOIo4SdVlC+qhNFlvTIM0qY0IddMSgY3eI1kjSxXF1BmNmVmMKvS062U+b1S0XT9Cfpyzdf2HqkwBjCun3L77YTLhm08JOboxAnzmVVZyfv/3x5RWk0EftW1yyBjX141+Wbu979ZNrfe9AdGUNruhzfjf3d8GAmJtFUim30UdLjAVeufyuGfNMK/CXYKirMFaz/xFB9PDzeE/EbOw77DD+7Vua2JhoJlu56OKm43bgtweu4K/f2jR5HiO9Shxj4h6M9sLuwLHDEl7wTfTHcVPpRv6f6L+SZGNleGgMBLpK0UmjEpgSP5Si6iLdXJl/Y+%
7KmptG6zE6YXSLZgcbGBrNTpYxedYDJTsNY0a9lFwRkgoGUlKSn1icorO1L2NpKwA6SFjaxJLXkh/8/BvnlUTHJx/dxlKD3/1D+vQLXkzerbKtCU9gTrSqytmrdPKTW+hvgslEfHxSxnu5puVnszzWaET/+q5bPMtmy90J+f67SH8XjyEZPqW7Cvrfdp3+2MIof3KY93jFmK1lCRdWbM7BGt5D8tiSFuuYFkc2cUquvQYpW15Dlg681ovYJ3kB059KZGkr+OEodabFGNStoVoyQywTWJ4YeGH+Oop5bPRIO9t5Ye6i7z5fMeXg6uPA7zSOdIkIT8s4u2LKBKX3sMZHGyrynODlCU5zn+xe4Oh4Zte5e+u6CFlVXB1ma5NbQKChHNwaYudCXOR4PKW55o/4JuFHPHuN5CH9MT8Vlc5afyS8YvTOnJuApyG4QUgwz/hv0kmTzvwJXxM5vfLl33lqvi7YgN0Xplsq0EEcAdpPTwk/0kl3curobjoHDkFmSfEtWEFnPR/ju/d3Qgbir8+vu0HN9kxBZRvM27hVvJ/E+Eh286DOJqnGfQ7Doi6D1gx0+eyGlOm+CYjfZj357ITx8YoiXcRoe6evbx4vIULx8NycrSt44fHpclvSMqSzyMMlNJOXJ46LSpEreqeudBvnm1G26W9JY5aNjqjiSVKi0umRR20VSQXooaQVIduIKPuCG6JsLFAwfwMu3DTueykTs3AGAsvuJVvBu5DAYxWFpKxzmunl8XjtgKnct1Xjocpg+lK64E4X0aPcD3yGxN4Nkka4WwzLqOSI6ALkuK97VchMGto55x2P7cS52+tQoCsOdGIOzmdUD9Qg0ugk1Tts7ehNk+dsW8VsLNadhgZfnwbmW6UZxHC28mHZ+G3kVXHlHebj0ChmYf6IPir2IXQYZUWB+kH0GKIOCAzRuLiqXWLRS+nV0Wd8XTR2Nkp1gIePjSLU28uWw7TQS+PnrHT2JGQcQDEhRjisUKu9NB%
4BPlpnB+SyPTyC7VyUzr4eGhsehJWkAqB/dwUp4uuZFMrNZ7j3xAwLkytioUeSg8RdBuLZSqEZV8h90EU69jgQQyfY3lkqF5feAK8Rx7qVLh9fya8XeNd3B35gsuA8Ogy9NbtVdnVT5PLJK+gVnKEB67orhK+stUtpfKRdkK1DxywpE4PPAXKpqiQHvwzHRLvSgoUTtkCcu5bOfaQ50aCLnvIzWWKnoK77toeR+okA7cJno01FvRyZ1wKEXqTl0FdYEF7+qp0v6YObMBcWN1YDyjoCo9I+ZIHcJT/KHF5UsIsGpa1XSlsMCFSiO1MLSOg9YzoQWENmQ11V+UrCrQwLa57qQcfDs0RYPfB+hM4IBw+248TQXN/I+bQCDMwCMp0ewBM1XzM9xfXzozDqhEqxb9A9MDvBU2QcqcDHygn7g3XHGAs9A9WlV097u8/uWLhR4LscbBOxPjy1tAeOgVju7Hlt8es1amXmmMPEaWSeHam4GHBUpQTbH3PTYL73v8g67yG023RkqMeyp+jtELfhmvEFAb4OIcSTq+lmdhxAD3Gf86NZfUtCt1b6GNclESIcF9JjiIAxChusmdYagdjZwpgIQ1XE3bsRvId21sC3LspNm7D8YoRwFw/Oc5ZWO8u0ibRgYQ5kU/hFpFbcaUXOUlbIhbyem/hTRZy++MIosTE+jQ7Uxembgc9kny+XvUnO8m1SBLSQGRaCBjWdbKGLxiVFj4dR9PX0MTHpMB/J1UuQl1uQmkPv0F9jMxNjQT88EEE0yNaa/8brxNy/1D0HLTbWokQxoMIaGqls4922vrYbIWN7LfA8feTCPFsi5pIqKTnoJCmvOzvg8NpuG8Vs6EeTnUGKGtnO4CNyh0ySdnbfpxy1kIKkIz8HCvLQrllUOSpckzBThJCClo01Put7jDaDz+YT5nPkgJDL+Dh63fzL/fcTzeeQoL+L77PoTRnzaZbvH8Lvv83eI093/cF789Omp8gq4Rs2H4hClk%
wkw39m8tht3sNXSJjrgTyQ8/5LETPIWsQUD0BZUU1CCd0PI8rSkztojAth0MoiEAh7krrNqI6fCp+CMqcgq55WcTMb2BxzzK/wEXwMm+Oh4aWAgMMzTRIvt/E2B6B2dHHhaLr+Zk1GchVttucNHbwvHyIsAOWTVFE2elQpsf2oLCelnC6FsbMVNrMHdmPEBdlz5kuwAfcg5VT3ceYwa+3f76E1IuLDz4eaz3I3hDKZyvJ5CzFhTd700XCnhQj0dGhxdegA2I8wVI6ku0EohVb67cCBVv+gVvKsacK0sLCpXMajj7EUHnnZXeQxvoDpplqUu1jzQEl8YyMgDuanxySl0ddh1PjopHHk1aERgcPp+7GJGXHgCLY5qQW5TGvMp4WfMJKE/YdIwizuYR3FEgX609iY76XA0sIpY57fLNpyE6s5e+BSX93Oi6SjhijkdOkHzdkXFlQCYYFmgqS1Qy6IAv2a6iWt/X0095zA0ys0isUd+AWVGDY8TqBoiHRuOhLCrSFX72uyxH2vnzCerJk1j1wxjjdWsk9Nph3cu3woVteQPcNkFhMZNcPoeKO3nm4kJyJCZslurBs3PxOq2kj0i8d8WC2kDm2LOML8scSm8/mGTDG/mtvXRkiHaetinj+ncvT0gcPTAPpoWKGpvKEampPBT4q85ne4f/6XyGux479G3qfk9lynJJS+/xt67ektGiKJ4PZg6CWyXvMhfqLwB2IDxjxZMC4m4HgWWJFBLKULZT7ZDevAPTVTH7ncpPWbDf9al4yxZLjpRzj/8SH6dwStRrOXhmS+bZwU7T7BoH0EVr54hxTZ2Zu+oiNPOoAvtDja0mP0N7TcAPMl7jspq8qVYryHTCG+IA6XxcrimV5FCRzLhaKiLD5YsFykHATbKSwZSKBkU1zA/WsAawybx9WAcu57fYSreScxOLPGqxJuS9eKdWuX8VwXvTe3rY3dvJoWYijSVtz903J9bEUfPN0Dv8zm0xuAVuc2fL%
hA42eAYXBeuoZDbRnsqC37apGv11T60XXpcsn0IuwGrBCwPOoD7n3ey1pHx7ztQR4Vi/o7mJXGqkjSJYDC3M66HMyb5l5d0jel5+CdbgyUXD5Pt75RXlRUsG3P8orz5IWXvvll6XogT86/TRJRB4aZzwmH+DCpJw3zDwsfyLGtBwawlgQNRktLIGXlT6max6ZUcSGCvlDukqqfX6hPEPGQSqX/QEzQF87Xp7rIC2cQm8lVt46Wlx+9VTXZhvBafjnd9OVhga9qhZ6kNEwey9KS6JLWKl44/CW0LOfls0y/UPMlgX/tNV7A7RCnWcwbSysU0eMQb9nnMvREcFry0lbZ4DP2Pw0+W/Dpt8xns64okC00X+DChNtSj5NEP0p8JDtWudUYAwJVxACx6cWnM6NTanNIbk4DGODdxokxsaLQa7B3zns9LaPCmNH/aWOZoZr/g+nVHNMp7i6faOHN1JJZSvCcWS5Owv7nxL908F03Yv8KpD371pIuWLT44FGdR3Q78Sdfly5fkJpPSErehikTTKdqiCtAmoPj3vXgcOyxVUBCRwHpvFfZKDQUqZQldQsfrZ1qq+jAfTXRIHJPnMHqCQIy7WoL048FKryXFkNST+v9Y5I3HMnL2DmjZIatXW3ajp05bZf7ENfYY7OCbvm+opz9PW/R3+lv9O/0yvm16+JKmMQicORTlpEZ/8S0Cyt1FsqcWSr5/mhbzs4dabV2tjjuzoy8IxuSY/z1l3tK4tatPQ9h6KwdwO6tnv05RfuW03PYC3GbZsgE2RbzKjETeT4F+ud0WaNsvpXRZgAk2AK/LdSAlROwpLgW+lYdGMAax6QkZ5CcRUBuoWf/A7H71++K95vO/vpdkT+S62caErInhJzyHWjO0kc5i+CoGZ1Q5OunG5Gv1zsKWGSIL/bwio4BXYmjCLaq8ODhSicfD08nDVG5BAWSzcXxo1RyZ6+UNIM2MC56fHy8M+/ik55i9PEdnQBxVc5yO5eIIV%
HYl+rlq/QgLm5FYnZIyp/3irNLRCFlpGd8XKGPb8SwHH2sUnT2TEos9vDQR2ZH65wEmpoQ6erm5Rnh5c6LSpW7dhiCxYAgNzfTSZ+0pEr/AL2uLD5RLVf5jk03envHx5bExzmL1B7SYzUevj56Py9ernbxCo7k+PCQIRF4squRY1ou28oqZujbHwgNGxgloUVbhIYeTxHg7al0Viq9PP04zs/D3cWNc3T28wkgW1UqH2//AB9vZ2cABztPnyBB8PPyV2HhksjK6TT+NT4JTziEdbhK5DEGXQufwTTIoqPYrWCJA8jEqrhduuFBh5ViTu77urlbFlTYqh4fkTc7Tl+Yv2RoCNQQjpvQxAng3jqZ7Plk1dRw+PqInV3UitSStmxKfULm/P3XKSMzFn1O/0Y/y5w+fQEhC74S7gDr1XQ2n+F/5J1kARLvi9uzNuixy2DizDIsRjrJxTFehgrf+HLbaqNtBYTGOTt4G3KSdCrbdH+7hMpH+UcHDk2qHsVpw1Rj7MnAzTp7+zpuuOnDJ4IKR4b5e2aEhKknksxXW5Jx3ijZDa6ed5M8NvKRcnmAK4un0pb1ekk1A+UIkS4b4KaRGGZ1oaerMrS0NjVe5F2hqaUFjAZ0pF0zMRsw/IJ34yrhXBOzzHDksjsQyjOuXvLVKF/maXAjFvd8vzuFHacymhcbQEyO6lOSugZONTk3NlDR2GATXj7zV6tYv1uRx/vwPVS7fmowFzOD52cMvDdybTt83c5x7aY/Xr4dbRXpkLt9JK6HnXGq6V3uAHo+VyZXYDQO83csqrLyPU6Nfu9hdpEbIjV4VCpHd19Z+8i6Ja+vDrclypSO1SV5hC/L61meYHq3WngWUURu0HM76e2La5cCuNNEXHCy3Ka+atWC6RMVthk4s7v5GHdUOIvaiz0dVofxX/J1S3I76H2ZZrNEV0Cq/L8n7jebq2J6ih59wmvI2Q88vJcb+DfANm4E3UcHXvofeTy/bGbW0MmZSt%
Wyc2OSz9+QC6fLorJhEWTJBakPjttJnhejsYKMWTeyCIiy0PNoGJBDY2Pdpn958Q+CdICjkRRzDhD04F6MnkxTOM4IdXAaC2/wlydM5Xz5GXBZ7LVgd5YH6vTKaJhThTCoslycy7fQsxNhIug7Jcx3iXsJMZ/UUTqI+Qa5bpQWrsKC+Fo5Zc3UGYbpw7w2jVvaOYVhvUoJ662pdtMkFiwozgsnpFytQpRLZH7UwL3HO6BWIIJlqSVjNF2tDUCSS3YW/sICk5jLy/sgXF441cajcyEjdumM+7wvb0dePHjJ3k6uMA2bKbeZCWU1fcc+IiPPPEz24l5CkGXezkejxSE3bk3p/62vZ7Cq+4DJH/wUBo7lVRVZcSN4PqMgpmLFvsYeZ6em8EnFtbNVLpGjZ08dPWPUCBvH1ZPWLWooCw9z9/vg3biyMN0aMSEy2Dc1IWy4kweG6tKFvXOio0JsHWKSRqVjRXfKyOAEY0aMg31WwvSWxgW+XgmGMdkMneTQx2EnXyULgcQ12PmBGasLdwL3kGXeyJ/Ezg/sMVAHICKxZuRsvYFnFvaS703z4quq0skJQpREXCLcONFfOCk2bqEwguc8wgzIU5aYT/K16OcGO2xwl5bOB+F/4cXyjYTbCNs78URp3n/BjrwtTDCAofr0/4KQuAdCq7F+kiSd/QNNQm8koJSZa7jvcIOYpyI5M7O7h+qWfPHkW/XH3miC+iwn+/GTExKdNdmnZyxy9uyiW/QvvtjONSp0pWWN8Y0xYz+mTd/16O3yRmkD9LmcIqNg1knv0uSPwW4P6h5mfXwZVvgsOQYiIZZZYOf6/Qq3GhlbxtpCzLsqFRwgbnTY38eWVpd2zXQdMuu7PTCM7jPL+I30CzqMBvM88hA/Q9qRuvKc7KT2xC7TUvoRPQajIQ53Osq8krthqVUOVuMRle+UUERJMYMRluheGhRUiuFd6oi5xK3GvJqtjdlboFQ8sNJ7jE2MluNKo+GWgdjNmF%
47bmYXotEOULa3z5z7vhzT7moaCk31A3ckWs++Geupl8xSZplqPs6t4QOkXi031vWI/dccjoiKExyQztefVfH1zbxLZ+cckZ9j2lTPHakduP0YPMY5ttUC6k0K9n9vFp2wumHPxkB+2yKlYKL151RaXk16TW+j744d6CCnA+kh+paHDwLjMWrRaeCXgctcAbk5sEphukPegt+Buki80DN8q0Clmg/W9dR4+oNWGYz/NAPPXzoRzL2tGnG/qLwG9kKkk2P/2aymcCytdT+PWX1KWNjhMv/uqBVbjPSb5QfqRWGsbnrhxBtOji+cCU/ghhY4RptlXwT7VszlbarrK3pjU2E46KbHiCNyz91YprJpGj0uQyGWxClUu58Ij1R7MtLrIj+PfIUVHXt8eLh6Q+oeFG345x7Uapi/PMfnCz8zRBMrRmlx0YH4byOYarHIZ2kssLgcaSvYTbxXmEiutSBFSd+mb8undX9zTy68bXxyT1vJ9LiMvJIpWbOnzuCE5+jdZasNjyHNCTBh34st0yDu+zlxYyJWpscl1yxyDx0V3/Np6YKTF9lJt5gPcdjdKMMtYG+NlQ+QOH/85xKIrAi+RWq4ykDciaGNsxcWrWnJI4S01RBU527M1UkeUgIdBDqpfG9qVob+VzjcbWPTTV3pKGiIRz7HfI0+LYSb61AvZILWVSuE3zsoFOx8Df/yGrJek7B2wzIoiwZb9i05E12UvzIaKQoir8O+zOp5Pp4GV4/R4XXf29qCl5LwHpP6J219dL7ceWxC/TVb6OR4ft0kFjHSzGfFKRizHJjnE1Br0Z4GLQq0wtcja6JMm0eUlowwbR5e5uVOVsDnA2Oj5gqnJ/PcpHuj2h2QQ5/Uz7jCAsQF3/A6qQ5s6cMl2oBByQQHcVdsSXMdsVWYZbcJL8mEwEdYq/4DDixcSJto308kebatTbfpY5okCsxXSyMKleirM0+ZMYiOlfJL9vZ30QXfZn2q+8vbb0Q7lnV+N8%
TylrG+Fh7CwmYhl4UhcJDunVUeAfHhBXlDIT6ivGGEaWAE7xbUO3C2s5OL7g0aOt+URt5kqZEsCfPeBj7QgiPZtjhmN1I4xQ6gByNGuhWlD/18pntFlft2zcTS8JNtmollQ0Eb3pIz/HNu/eLFphxyZI2jY+/A8TlzWCvonDlcSo+z3UpTjsTjSXXo/9Wx111cCtX0bw2FmbUwBIbUZhbU07ehorQ4z4Dp3TnsAEg20kX0mdaxSW2QRw+1JaW3QSX0GJMTW+hOqJvIeul+xxixU0xknViW6DYYm3EONBoJuaIf+y8RY+YSXuicFTnFTtlUfLHdzradnqi52jR04/hw+vvFCmj+DxFkx4lmTu+Y3+Tmzsnzu9Jj7MVmI+9Qe+1SRXJcEl1IP5sd9+8B5S0QsbsQzFdMu3h/xBX/qe+PO1EXRX+mL4+prkiGnafHtlaMJfFRvBDWZXqEzJulG9k1QGn0jvCgnUJwl8TbXsSxNJa+P6kxEcOzFOWRfWC0E/dDrKN7vql5OsdPh09N5xNEhwqyeTrHTaPhnGFseH7lJFNSblB+ZR1aTSJ6o63CT9YqttVjB1uvWHLJoZvoFlhgOkbCSbQQgY29K7GJNf3NgYGBG9xQ8rulx6Sau4N8Cno0ZMS0sv8YqFlKoQJrMOkQpmJXyVtN756pgMa/itpj1h9zz75yABJHSilD9VRhey3d/xXN+LVNb5/7QLyvB2SkToLF0AGuWBH6f9ZkPKkAAAEAAAABNcPjGP+wXw889QgDCAAAAAAAzR9X8AAAAADkQLiC+tz9fwmCCNEAAAAGAAIAAAAAAAB42mNgZGDgKPjrzsDA+e7XnX+vOJs4GFABUzwArDcHZ3jajZZpbFRVFMf/b+6977UsSSEtllAxEihptdhKSlk72JZFgQIjNbIISFuoWnVgwAUEakuAkGLF8AFQgyEECRjASiNgghJiMSZoaAwhLIZUiaAGiQ0GyvL8n9uZydCUwIdfzrln3r%
vnnu2+0cBCcxZVSY1IFkR/SBZZ2R3HBN2CyV1hfkTQNKNJcGej2DT7p7SPHQ/CnY/VcX0aGtxB+MS7gOP2/Vb/jD6HPSZMH1dxSGQi8qwZ6CwntWSJuehUu4P882LX81CcrFAs8mFwe+JZkSaEcYL+DS1xqrBQMGv8tpjegT/XS8EMQeIQAhV4zuQ7YZOP/2K2OOWIJG9Enciu8PYhGJNknNUVKiizokR0NuaYfpjrleAVU4FB/H2L8VCTiH2mHvVd0o61zN2yKAMT9GXR/eebS3eaHkiaf0dwTyIvbhuKl5OmY3ZnbG8c55mi79xDvT3rPeh05N1DBMeA29NF9yYxN0IKStyZqJbe1KdxwPYme4S1nxvvp4t+u/4Zo80trLH0wm5zBd1svdgjNr/Mo+TL9rDkIc1vl/zKmd1chPU1hL2xZDfCbioyk7bhgPU3mrXszv7zMN76PYlskdxniuQ51lfSS0lAb+8UnnSbkW3PQB82rnyM0kmoUcexVh/FAL0AMwXzFgaoNSg06VggqGvYbHLQzVxEb70cU/U3CHF9Vk/Acp2Beep7BHW2f8ZdgYn6MAbrNuzX4zgfOVjqvoil+gZS3eexTv2DdVp6Zzgm6e7+Net3hX/Iyn6Yqi4hM1CIpkCh/50a6X/u9UcPNw+z9XY+wzOID3OaOWnDBvdDhNQV/9/kIs6vxFIchTpzk+HcxQfWfp3+O+oY1LvQqH/ADD0GWV4ES6z9W6zXC/Gamucs0F/i9cBVgLhKYR9pZO33qNFOqeqLIxKrJYK2uB63OVX6Nlba+OmHc7g3UIAj7kso15cwQn+FWboZBWSUu4N6C2ap8ShhDULc71fynjqDp1m7Iu5V0JEHNMVqcl9ascIswh7RpSfVeuToXNTKmvneLOg0+qtkrcUu9MYLzh+oVltRTTlf90KZYb24Vznvjc9MEJPVq/46rnPdlf5N70/uH/QvqN/ZI5SJqHoM4d1eI+8xhjDnBKonysjjej%
tSWbtb1FPFxvUmru9aGcFBVYawEI11EeteQWql/uSyLsROynNuIxrMVgyn/kusPwifx0HKOdIr5LAOce5C7MkOWRPIwxcCzz1YfW31cpXFdcd5UpnvXN3LKTQnMNw55a91C9hbESedvbNRauEsxkCdhTcJuM6L5+8GSuN6K1ax1rA5LsBPtL0jeXKPoq+tbRd4OVJzx4ut3TTOJomt1Ta8b+sQx3mb35dK7l/H358ifaKEjGYdOIdmI8aybytJLuu7mPPxMeNoEJKv4tPkOt4xf7POLlIYy1Aywd49+/EE4yvSeUgnpaoSETUJw1Qm5zETq5mDYQJjHKb6Of35Xq2gz6MHv48V0XXQ9nk+HmNd22WOuyKwi/d9KpbIN4p5myixSf1t3BkI0BbmTI6QfPJuHSzfCrlbSJFI86jVLXz2Gcb9EeWmhDxto/+dwK0G5reF81DK32tpL2OMVTx/CpkiyJpYe2ckp4L0FPu5B9kFtJ+nHElOkDfIBlJC6oC7j1DeJFvsf4+eGJI8DZlmr3/F7A3UklXU/4rKy5yXjKiv0k6IbYr0j3mX928n7N2S4V+XezAR04d5E72UvZ9IK8Ywr/gfw9NuR3ja3cHNKzRxHADw37zujtmd2TGzs+aZeQ7PcevBBQclOXk52MNGiVLUpshL4rIUOXCS5O1gOSjtUSFJkc1SDgjl4GDLbU+UC9ny7bdjzI7xD+iDEAqiWod6FLVJoi30bPNKVJmGXcWJGWKOSGBXpEHWWPoLLLhYJZPkLnggHyiRCoFK0GqZpZaolMM5jRy8oIPuoQfpcdM2QzBlzBBzyFImno3ZbLJn7OUnTzGo+6bR0+LpwqY9p5Y3b6k3aombpryp34ojOB+IcQOWee6EeytaA5miV17kY3yCv+Pfff9M7d90gwHfNHb+xS/7S/1t4Bpk/Vnhv0NvgR3hSMgIGVESDdCNLYDrvACDRQLjDotg3yZrygVyEudKkv5KYakS1IFhaQM7AI%
95xYxNBOsCCezik8xaBLlfXnfxJL8rtCIq1T+Ig6Ryq9wGF4PpPNWnNqgj2J76EmoGkwWWQ6kCuVCuJOrQWTKBHWtIq9IipjFt1ZLW0n9Um3IwBDZcbYH7n+jIVViv0Gv1JqxPX7fcGGEjYjNqWjHuPwClLVFKAAAAeNpjYGRgYIpnOMjAzpDLwAriIQEWBkYAJ2QBo3jatVTNLnRBED1t5vvy+fwsxEKsbiyEhDFIRLAghJARzGBhZ8adMTJc5ofMzjN4CEtLj+EJxLM4p7vluvETEnLT3aer61RVV1VfAL24Qwom3Ul8z+GwwQB3DndQ58HjFBbw6HEaI2bA4z8YNIse/8WwOfD4H/rMtced6Dc3Hv83s+bW4y7kO5487n6Fe8xQKutxL2bSeSwjwjnaqKOKCo7RRIApZDGJaaJdSkKu0jqlRok4T0mNOESZu20yI5xwV7LcJbS4HlNWR4P7EWuzSR8NzGGCX4VcabRQRIYsWZ6gxYiSI56Vre06ZbHX8YTX0Q/jEa7QTg2HtDBJ+1Ocs5hHDlvYwwpRzH3NdB5i7sc3Turt21gbPI1wxtPY59f85N7ce8PqydMKNS4pbXwSjU4D6gXMaZtZlvSQeqraEWdFVmFkIXfSiTgX7ekp56ate4mMGr82pSEuGE+VfiULyVRVHU9VE/Pc9szLDZLdUaDszMa0SZzhuua5mn++FwIO9Zruo1XxVRmBpJlf8KcX4XK+aiuu7BSIykRXNh8uAmmIo0ooHy7/LWJVRfG+ZLOAdXZBwP5U9dRDseVcwsIYJe/1m4Z7q+/5jXtENa3aqhVtbQNG7PLhOmiVr3fH4ibz9bZaqrqsKreKL+knY/Pv/iHfZj0DWX3bj3jaXZYFeBvHFoXPubJWtuU0TZsyM6diKDuOYjtx7NRQJyllLW+kTQSuIFRmZmZmZmbm9pWZmZmbt9pdjf2ev897787O3P/emdGcgcD+W9aO6x3vf/9kT+uxIU6g4El68D%
iGcC0b6KVGH9JsxHXYiE3YGP9gGYbZTD9bsAnH4Qouh01hcDyXxxN4ihPwNFfgipzIlbgyV+Gq+IKrYTNsztXxO9fgmlwLW3BtrsN1uR7X5wbYkhviGW6EZ/Ec/sTz3JibcFNuxs25BbbilpjErTgJW3NrBhhkiGF8iAAjCDLKGONMMMltMI/bIoQb8AK3w4vcHhm8xB24I87nTmzlZJzINqvyMKcwxamIIMp2drCT0xDjdHyMv9jFGexGnD2cyZ3Zyz724xsk8DIH8Ap3QRavcpCzOJtzuCt34+5IYhvuwT05lzq25RC2w1dM424OY3sa+JTzmMEUmMxiAY6liRwu4HwuYI55FljkCPdiiWVWWOVCLuJiLuFS7s19uC/34/48gAfyIB7MQ3goD+PhPIJH8igezWN4LI/j8TyBJ/IknsxTeCpP4+k8g2fyLJ7Nc3guz+P5vIAX8iJezEt4KS/j5byCV/IqXs1reC2v4/W8gTfyJt7MW3grb+PtvIN38i7ezXt4L+/j/XyAD/IhPsxH+Cgf4+N8gk/yKT7NZ/gs5vM5Ps8X0MQX+R9cjgJfQit0jMMGyCOFHbEnX8YemIsdsBPewuc4HFPxLz4gUOQrfBXv4hC+htexFsbjaNyLdhyEh/g6iYP5Bo7jm7gDPryN1/gWOjDCt/kOSijzXeyFNXA138PNuInv8wN+yI+wLj/mJ/wUX6KBn+FidOIBrMrP8SAuwyq4B79hGr/AH/ySX/FrHMlv+C3a+B3Ww6m4ElfhPtyP6fyeP+A9LM8f0YUKf8JCLEKVP/MXnIRz+Ct/4+/8g3/yL8zg3+jmP/yXy9AjEIqIRxqwDk7BJeLFnfgIM/GmaPhOfDhdGvE9dpYmaRa/tGBNXIPjZRwWy3LQ0IslMh57y/LYBzfifSyVCbKCrCgTZSVMlJXxM37BD7IKzsV5uFBWxb6yGvpwBPxowRloxAQ8jMdkdVkDZ2M5nIyzZE30Y31cBC8exS24Fb%
fhdjyCZgzIWrhU1pZ1ZF0cJevhHewi6+MT/C0byIayEQ7D2lhdNpZNZFPZDKthBXhwKM7EoGwuW8iWspVMkq3xLVaWAH7FT3hDghLCMVgJP2KWhCUiUewnMRwgcRyI/SWByZKUbWRb2U62lx1kR9lJWmWytMkUSclUaZcO6ZRpMl26ZIZ0S4/MlJ2lV/qkXwZkFxnEbMyRWTJb5siu2FV2w274WnbHXThN9sDu1qn1mczFiqL7WlN6uloxtNahkrHQ8LbmRrJ6s/2sFAvFsq81r6dLxYKvtZgpFowFza0ls5CxhzRMNiq6vy1tltLV/LycsbihbbhY8bRlTW1KWrfGaFPKOb2c1VJ2aC1lNzakrE6+lBPVkypkfCknsi81UjZzxUKLa228J1XRG61/+6UhVS0Vve16Pq83tqeNYTOX0/3tY/jtVmitI5iIhsO2iTgmGtQ6QqFAPNzQMaSX/B2jI6RzmtZpZ+frdOvsdLJp6CxW9JbaY9g0SkbZLDfVXuw8tM6KmRs2/NNGA3mn6yMjeuN0Nyuty5nULj0/NGy92ZU3drlfG7qsPGVGVeu2ezV363ljhjEpHE7W3Wh01E0GtW5nfLc7XrqrWo+ddVPP8FDODuLpyeZ9PU4NzT15I+MuX0/erDW1uNZu9PfY6+KMm5k1ZabpmVk2tV4n6V6H1uvSPL3ZotZnf/L3jVbc0pcuWguhp9NGoeLtMzN53dOvVxv6rSnW+p0Q/W6Ilv6xffuz1r7RBpwCBuoF+AbcBRhwt8OAsw3Gu7a+DC3uu12Jd6C2G7UBez20QSfJwdEkmwbrw7TBTElfaMgs0z979Ls2227V5jgbeo61Lg1zatnpTnZ2s5X7kE83bL9Jn2eagUAokHC8RDIStL1gIBCMK8/5WvOSdS8UUJ4aEQopL6y8iPKiyospTzFCihFSjLBihBUjrBhhxQgrRlgxwooRVoywYoQVI6IYo5VHFCOiGBHFiChGRDEiihFRjIhiRB%
UjqhhRxYgqRlQxoooRVYyoYkQVI6oYMcWIKUZMMWIqXkzFi6l4MRUvpuLFVby4ihdX8eIq57jKOa4YccWIK0ZcMeKKkVCMhGIkFCOhGAnFSChGQjESipFQjIRiJBUjqRhJxUgqRlIxkoqRVIykYiQVI1lnWL7y6oxgoM4IBuqMYKDOCAbqjGCgzggG6oyg+2useYoRVAy1/4Ju9rFgyN11ludWHguGoyGvbquf/XSOT905lJr0QrFi5AxT9+muDuqjOjhU08H0GB1K13QwbengsH0OeoeNXEUfVz+K7MgtVpeKdTo6R67hKKThKKRRU0jDVUjDUkjDPRINVyFdawdqMsoVM69bsTxWGo3Wv9u8OJ3T89bp6p9nLjQMM5OtZMvejC2embp4ZsYknamJZya3ZCQbcEyoyT4ca8dfQ7YmnNnR3v6s1cEo5M1CtayZdvZizvdZidhnuOmKqFkT0dqjXvuEsS9OorUWR1ZNR1bnj5HVBbasLqjryIJMyTAKOd1Sg7Tm6IZlbI3NOZKTq2tszirHa01SpqzlzeFabbVkLcHLV4NawVGKgj5SLFdKRasUreCML7jjmwrl6ohRMoslKVS1oiMHRSVWRadQb7GmtM3209kwRVdvXeuUaM2FswDNxRGjMFTN5YyKvzgqwk3FhUapnC6WDG3EKFtL6BnJmh5rkbWS871kzVlarwlWyUmzVBfnkiXOZaea8hhxtoIpwdXK1hoWhlvKVgkFdyM0ledVnCX0lmvSrdnPoKdiKXilpuAVh1Opz3xlrIJXagreUslai1GPZy9dbat4HWGuTrVEw35G7GdUqzpzWFVzWHXmcFy1MOxWb33yVQumpYZx24YDIddGXBt1bcy19X4J17a6drJr2xwbcvuH3P4ht3/SjhtMJVM1GwqGAraNBurW5lvWjhOKBt32oD3OsnacUCxmcd3faNW9tri2vtcn/t+7cwi4je6U2XeZqnOXWeSs6aIxd5lF6i6zyLnLLD%
b9S8bcZZY4d5mlzqG0tHaXWWqt038BNq/k+QAAALgB/4WwBI0AeNqlWNty2zgSfcdXdPlhK66i7SSzt8o6nmIkKmaNTGkoOtk8UiQkYUMSXJCUor/f0wCpm71bOzOpVEUEge6D092nm7n/+UdZ0FaaRunq49W727dXJKtM56paf7x6TiY3f7/6+eG+lG2ap216vvPhPtP13qj1pn24b+WP9mE0PNP7t+9+omQjaaRLlVEsCyVXNDf6XzJrye/ajTbN/Z09dX93YqdQmawaSZ0pPl5t2rZuPtzd6VpWK121/ctbbdbw/ntc0pvB5lq1m255m+nyrtBdrlZKmjt79MYdvRYi2aiGJnBMC71qd6mRhIUeRU5dlUtDLVwuwinNANJtnroNHn1xdNG723e3zthwPfzEpRWMLGWhdx6lVc6LadFoSrepKtJlIWkHkJTSxP+V0vaDYOyA3mRG1W1z26iCqbibTaZCiJvf/0dY/PMgosksSmgajoJoEZzCpxt6/1eayKXpUrMH12//9occinkc+E+fpgFokbTWuDfpleXyBY/0Bhe8Jma/1dS0quyKtAU52hT5TuVS5HILFutS4hCsZLoAfdqkrdpK4sSh2qVB41kTXV1r01pv9m1mJPbqSsjVCi8slDRLc8mJxJEpUA+dgusMxsuyq1SrJIzxOxiE9S1wIFIrI/FPlQtOWTylpQTM76Qq2m1UtrH+GirTPQJPzQaXyl3sSzaCB+ysU9NW4H6jamEzQAOpaW45IcHPZIo0QdI09gKHbHSWgQaGOyx4oAp5zT9KFDTy23oS8IibGLXsWj4FwMWeUqSmrtb8L4ziGWRXuqVGF0jRPS+WjSy2srnlGhPWmQewWQEffLDaE6pBbR3pfGm8z9KK4SxRKQUDkeVS5jl+XaAArjttnDeX8zDXDDXX0wuqN2lrXxnZSAO2RAWCUTU9Wr42o70EYjH3BDHZx/eNJzZ6h/QxFiwbAV4jC5keK5w92hBQu6%
8lJ8cgRJYLI//dKSNt9iF9joHAWopwDjJxUv65Bmp2ltZ1sRfYa/nTWWet2Hxk9w1TO6Qp0tKqjTKnF0BWjINJGIVJOIsW4upMrq6AYYXUYTRsppG2QFaqgP/DLV18oZu9lIpHxEGaN831a9iZwAwnDdKmTM13Dl+Dmso2TAc2IrmFSww41J3JAJ8desgDhQD38uUi0V/Zlh+uchX3kXUKECG8p3dgllzIm1pmfU4755SuWqfG4tBOUAHgke3jLmx9hmVVpcUgbZf8sHJAJlj0QNO58qPwa13BFpA34jR7L/mjA3/s82kovld8XlRNCclha2lua6rVHt4WssWDJ7g+uiU0qO14gW5uBq3gvLACo9EysGzz1YnpCWi3Ii4pQFT2lG3SCqtrzt8ydZmGZVbJIQPPyWDsopI7TAtbZXTFHPNlXZt9ecVGraFoEAB2I/kXinoNeSz5dyuzTaWytBA7oziKcO8KroYVBANXw1WqA+N9uM4wwf08iJ/CxQKFQH9Ky/ofNJpF474w5tKUqrH9DDkK2xIXBIIK9jyn29w6oMhrdO4eeO9eL1sUMpgQKbftA7tn/u0hKJDT3T30BDuhvdIatMrXK/H+XP5cG4G6FmdCjdo7PNpZ4dAh2a04ukVW2BGnJ2WFHNY7DhsYy9GodNV8EOLdNUUS0tpPLOfhrEB4nzUK0Vc4B8XtkCXHBPJQ1HTIHhy4TGwU+NDX+q4BW7JYITDvr//3yVcJHawN3eO39AybXydNQ6ZQCA4IxAFqo+CS/WFKQNkd9QKSDJVzbf1E86zOQ/pcOxvELaeeT1agFmduUvRQ1Abm0kHxNl2ZVjeQ89zOcxv84LrQhsm0CGoArY3igaYESFTHcfth7gZZRd7Ya/I5dgATS/CJYcyp+VkH1wDbn+lbMJReQbC3Su6OioVsNYjOT0gN/SIo/z0mOGbfnGm1YK12LQNwGpI/arCnWuKSbjEMoZZOCrCvvAFJpg16OjKNhU9cKm%
nfWLAD0e/lueKpBd2T66LPfNCIhgRCGDG3CRbqmmcF66rfxZfmrvnnazsV8D6G3d/2FRHv227/CXGy96wOeZhDBfcThJ1E3GRYai5xWeX4/IDGIF1yjButsq10Ly5px9YfmaxtOafZ90rvkPtrR/hBArHviOMFXfzKpfAZaOPKxE0Ql+ERx/CAm784bi707SBHMHUUJ54CX7QhT5RdY5k4LVnEAYMSAvdyrHAiaA85Cs867OUcdlqXSIvX5y/oxf83fx3a1MX8JY7z12WnSbjTRD63lvMPu6WEYrLxDsnAV9pqhaEe3xPHpjyozqDOPL8KRoN653EuXIymfvgUxCJ5DNwn2WI2Sb76cUDhgubx7Es4DsZ05S/wfOXR1zB5nD0nhB2xHyXf8I1AfvSNfgmjsSeCf+Jja7GgWUzh03waBmOPwmg0fR6H0Wf6hHPRjD/6nsIERpOZPdqbCgOcmwhgGT3i0f8UTsPkm0eTMInY5gRGfZr7cRKOnqd+TPPneD7Dt6MfjWE2CqNJDC/BUxAlAqhGs/m3OPz8mHg4lGDRoyT2x8GTH//iMcIZrhyT3XILlLBBwRfso8WjP50S3oqDDXqcTcfY/SkAeh8fkw4O0Fv+PBr7T/5nvsFgl7e5G4gjA3zgcxAFsT/1aDEPRiH/AHVhHIwAEDtBNy6PVVjCTLEIfn3GAvaJ3gVi8BhYF8Ds4++IU4PjgO24IdtJZnFygPI1XAQe+XG4AAQxiWeAyyHECQ76MyjkeEU9Xg4Lr71MCOzi08JdcBz4UxhEXkQv996Kw/+49OmKX0OPefgPmH4cWQ==) format('woff');}]]></style>}
\fi
\dcga{-1.0544}{0}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{0.2372}{0.5272}{-0.2372}
\dcgc{3.472}{0.7456}{3.8447}{0.3728}{4.5903}{-0.3728}{4.9631}{-0.7456}
\dcgd{4.0125}{0.5405}{4.758}{-0.205}{4.4225}{-0.5405}{3.677}{0.205}
\dcge{8.435}{1.0544}{0.5272}{-0.5272}{-1.0544}
\dcgf{8.6723}{0.5272}{-0.5272}{8.1978}
\dcgc{13.3981}{0.7456}{13.0253}{0.3728}{12.2798}{-0.3728}{11.907}{-0.7456}
\dcgd{13.1931}{0.205}{12.4475}{-0.5405}{12.112}{-0.205}{12.8576}{0.5405}
\dcga{17.9244}{0}{17.3973}{16.3429}{15.8157}
\dcgb{17.3973}{-0.2372}{16.3429}{0.2372}
\dcgc{21.8331}{-0.7456}{21.4604}{-0.3728}{20.7148}{0.3728}{20.342}{0.7456}
\dcgd{21.2926}{-0.5405}{20.5471}{0.205}{20.8826}{0.5405}{21.6281}{-0.205}
\dcge{25.3051}{-1.0544}{-0.5272}{0.5272}{1.0544}
\dcgf{25.0679}{-0.5272}{0.5272}{25.5423}
\dcgc{28.7771}{-0.7456}{29.1498}{-0.3728}{29.8954}{0.3728}{30.2682}{0.7456}
\dcgd{28.9821}{-0.205}{29.7277}{0.5405}{30.0632}{0.205}{29.3176}{-0.5405}
\dcgg{-1.0544}{-3.4267}{-0.1582}{0.1582}{1.0544}{-2.9786}{-3.8748}
\draw[dca] (3.472,-2.6812) -- (4.1057,-3.3149) (4.3294,-3.5386) -- (4.9631,-4.1723) (4.4225,-2.998) -- (3.7888,-3.6318) (4.6462,-3.2217) -- (4.0125,-3.8554);
\dcgh{8.435}{-2.3724}{-3.2686}{-3.5849}{-4.4811}{8.8831}{7.9869}
\draw[dca] (13.3981,-2.6812) -- (12.7644,-3.3149) (12.5407,-3.5386) -- (11.907,-4.1723) (13.0812,-3.6318) -- (12.4475,-2.998) (12.8576,-3.8554) -- (12.2239,-3.2217);
\dcgg{17.9244}{-3.4267}{17.0282}{16.7119}{15.8157}{-3.8748}{-2.9786}
\draw[dca] (21.8331,-4.1723) -- (21.1994,-3.5386) (20.9758,-3.3149) -- (20.342,-2.6812) (20.8826,-3.8554) -- (21.5163,-3.2217) (20.6589,-3.6318) -- (21.2926,-2.998);
\dcgh{25.3051}{-4.4811}{-3.5849}{-3.2686}{-2.3724}{24.857}{25.7532}
\draw[dca] (28.7771,-4.1723) -- (29.4108,-3.5386) (29.6345,-3.3149) -- (30.2682,-2.6812) (29.0939,-3.2217) -- (29.7277,-3.8554) (29.3176,-2.998) -- (29.9513,-3.6318);
\draw[dca] (-1.0544,-6.8535) -- (-0.1582,-6.8535) (0.2372,-6.8535) -- (1.0544,-6.8535) (-0.1582,-6.4054) -- (-0.1582,-7.3016) (0.2372,-6.4054) .. controls (0.1142,-6.7041) and (0.1142,-7.0028) .. (0.2372,-7.3016) (-0.5008,-6.4844) -- (-0.29,-6.4844) (-0.3954,-6.379) -- (-0.3954,-6.5899);
\draw[dca] (3.472,-6.1079) -- (4.1057,-6.7416) (4.3853,-7.0212) -- (4.9631,-7.599) (4.4225,-6.4248) -- (3.7888,-7.0585) (4.7021,-6.7044) .. controls (4.4039,-6.8286) and (4.1927,-7.0399) .. (4.0684,-7.3381) (4.1243,-6.2384) -- (4.2734,-6.3875) (4.2734,-6.2384) -- (4.1243,-6.3875);
\draw[dca] (8.435,-5.7991) -- (8.435,-6.6953) (8.435,-7.0907) -- (8.435,-7.9078) (8.8831,-6.6953) -- (7.9869,-6.6953) (8.8831,-7.0907) .. controls (8.5844,-6.9677) and (8.2857,-6.9677) .. (7.9869,-7.0907) (8.8041,-6.3526) -- (8.8041,-6.5635) (8.9095,-6.4581) -- (8.6986,-6.4581);
\draw[dca] (13.3981,-6.1079) -- (12.7644,-6.7416) (12.4848,-7.0212) -- (11.907,-7.599) (13.0812,-7.0585) -- (12.4475,-6.4248) (12.8017,-7.3381) .. controls (12.6774,-7.0399) and (12.4662,-6.8286) .. (12.1679,-6.7044) (13.2676,-6.7603) -- (13.1185,-6.9094) (13.2676,-6.9094) -- (13.1185,-6.7603);
\draw[dca] (17.9244,-6.8535) -- (17.0282,-6.8535) (16.6328,-6.8535) -- (15.8157,-6.8535) (17.0282,-7.3016) -- (17.0282,-6.4054) (16.6328,-7.3016) .. controls (16.7558,-7.0028) and (16.7558,-6.7041) .. (16.6328,-6.4054) (17.3709,-7.2225) -- (17.16,-7.2225) (17.2655,-7.3279) -- (17.2655,-7.1171);
\draw[dca] (21.8331,-7.599) -- (21.1994,-6.9653) (20.9198,-6.6857) -- (20.342,-6.1079) (20.8826,-7.2822) -- (21.5163,-6.6484) (20.603,-7.0026) .. controls (20.9012,-6.8783) and (21.1124,-6.6671) .. (21.2367,-6.3689) (21.1808,-7.4686) -- (21.0317,-7.3194) (21.0317,-7.4686) -- (21.1808,-7.3194);
\draw[dca] (25.3051,-7.9078) -- (25.3051,-7.0116) (25.3051,-6.6162) -- (25.3051,-5.7991) (24.857,-7.0116) -- (25.7532,-7.0116) (24.857,-6.6162) .. controls (25.1557,-6.7392) and (25.4545,-6.7392) .. (25.7532,-6.6162) (24.9361,-7.3543) -- (24.9361,-7.1434) (24.8306,-7.2489) -- (25.0415,-7.2489);
\draw[dca] (28.7771,-7.599) -- (29.4108,-6.9653) (29.6904,-6.6857) -- (30.2682,-6.1079) (29.0939,-6.6484) -- (29.7277,-7.2822) (29.3735,-6.3689) .. controls (29.4978,-6.6671) and (29.709,-6.8783) .. (30.0072,-7.0026) (28.9075,-6.9467) -- (29.0566,-6.7975) (28.9075,-6.7975) -- (29.0566,-6.9467);
\dcgi{-1.0544}{-10.2802}{-0.6326}{-9.8057}{-0.3163}{0}{0.3163}{0.6326}{1.0544}
\draw[dca] (3.472,-9.5346) -- (3.7702,-9.8329) .. controls (4.1057,-9.4974) and (4.3294,-9.721) .. (3.9938,-10.0565) .. controls (4.3294,-9.721) and (4.553,-9.9447) .. (4.2175,-10.2802) .. controls (4.553,-9.9447) and (4.7767,-10.1684) .. (4.4412,-10.5039) .. controls (4.7767,-10.1684) and (5.0004,-10.392) .. (4.6649,-10.7275) -- (4.9631,-11.0258);
\dcgj{8.435}{-9.2258}{-9.6476}{8.9095}{-9.9639}{-10.2802}{-10.5965}{-10.9128}{-11.3346}
\draw[dca] (13.3981,-9.5346) -- (13.0999,-9.8329) .. controls (13.4354,-10.1684) and (13.2117,-10.392) .. (12.8762,-10.0565) .. controls (13.2117,-10.392) and (12.9881,-10.6157) .. (12.6526,-10.2802) .. controls (12.9881,-10.6157) and (12.7644,-10.8394) .. (12.4289,-10.5039) .. controls (12.7644,-10.8394) and (12.5407,-11.063) .. (12.2052,-10.7275) -- (11.907,-11.0258);
\dcgi{17.9244}{-10.2802}{17.5027}{-10.7547}{17.1864}{16.8701}{16.5538}{16.2374}{15.8157}
\draw[dca] (21.8331,-11.0258) -- (21.5349,-10.7275) .. controls (21.1994,-11.063) and (20.9758,-10.8394) .. (21.3113,-10.5039) .. controls (20.9758,-10.8394) and (20.7521,-10.6157) .. (21.0876,-10.2802) .. controls (20.7521,-10.6157) and (20.5284,-10.392) .. (20.8639,-10.0565) .. controls (20.5284,-10.392) and (20.3048,-10.1684) .. (20.6403,-9.8329) -- (20.342,-9.5346);
\dcgj{25.3051}{-11.3346}{-10.9128}{24.8306}{-10.5965}{-10.2802}{-9.9639}{-9.6476}{-9.2258}
\draw[dca] (28.7771,-11.0258) -- (29.0753,-10.7275) .. controls (28.7398,-10.392) and (28.9635,-10.1684) .. (29.299,-10.5039) .. controls (28.9635,-10.1684) and (29.1871,-9.9447) .. (29.5226,-10.2802) .. controls (29.1871,-9.9447) and (29.4108,-9.721) .. (29.7463,-10.0565) .. controls (29.4108,-9.721) and (29.6345,-9.4974) .. (29.97,-9.8329) -- (30.2682,-9.5346);
\dcga{-1.0544}{-13.7069}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-13.4697}{0.5272}{-13.9442}
\dcgk{-0.5535}{-14.2868}{0.6063}{-13.1007}
\dcgl{0.4578}{-13.1405}{0.6063}{-13.1007}{0.5716}{-13.2504}
\dcgc{3.472}{-12.9614}{3.8447}{-13.3342}{4.5903}{-14.0797}{4.9631}{-14.4525}
\dcgd{4.0125}{-13.1664}{4.758}{-13.912}{4.4225}{-14.2475}{3.677}{-13.5019}
\dcgk{3.416}{-13.7256}{5.0749}{-13.7069}
\dcgl{4.9418}{-13.6302}{5.0749}{-13.7069}{4.9445}{-13.7883}
\dcge{8.435}{-12.6526}{-13.1797}{-14.2341}{-14.7613}
\dcgf{8.6723}{-13.1797}{-14.2341}{8.1978}
\dcgk{7.8551}{-13.1534}{9.0413}{-14.3132}
\dcgl{9.0014}{-14.1648}{9.0413}{-14.3132}{8.8916}{-14.2785}
\dcgc{13.3981}{-12.9614}{13.0253}{-13.3342}{12.2798}{-14.0797}{11.907}{-14.4525}
\dcgd{13.1931}{-13.5019}{12.4475}{-14.2475}{12.112}{-13.912}{12.8576}{-13.1664}
\dcgk{12.6339}{-12.9055}{12.6526}{-14.5643}
\dcgl{12.7293}{-14.4312}{12.6526}{-14.5643}{12.5712}{-14.4339}
\dcga{17.9244}{-13.7069}{17.3973}{16.3429}{15.8157}
\dcgb{17.3973}{-13.9442}{16.3429}{-13.4697}
\dcgk{17.4236}{-13.127}{16.2638}{-14.3132}
\dcgl{16.4122}{-14.2733}{16.2638}{-14.3132}{16.2985}{-14.1635}
\dcgc{21.8331}{-14.4525}{21.4604}{-14.0797}{20.7148}{-13.3342}{20.342}{-12.9614}
\dcgd{21.2926}{-14.2475}{20.5471}{-13.5019}{20.8826}{-13.1664}{21.6281}{-13.912}
\dcgk{21.8891}{-13.6883}{20.2302}{-13.7069}
\dcgl{20.3634}{-13.7837}{20.2302}{-13.7069}{20.3606}{-13.6256}
\dcge{25.3051}{-14.7613}{-14.2341}{-13.1797}{-12.6526}
\dcgf{25.0679}{-14.2341}{-13.1797}{25.5423}
\dcgk{25.885}{-14.2605}{24.6988}{-13.1007}
\dcgl{24.7387}{-13.2491}{24.6988}{-13.1007}{24.8486}{-13.1353}
\dcgc{28.7771}{-14.4525}{29.1498}{-14.0797}{29.8954}{-13.3342}{30.2682}{-12.9614}
\dcgd{28.9821}{-13.912}{29.7277}{-13.1664}{30.0632}{-13.5019}{29.3176}{-14.2475}
\dcgk{29.5413}{-14.5084}{29.5226}{-12.8495}
\dcgl{29.4459}{-12.9827}{29.5226}{-12.8495}{29.604}{-12.9799}
\dcga{-1.0544}{-17.1337}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-16.8964}{0.5272}{-17.3709}
\dcgm{0}{-16.0793}{-16.8437}
\dcgn{0.0791}{-16.7119}{0}{-16.8437}{-0.0791}
\dcgc{3.472}{-16.3881}{3.8447}{-16.7609}{4.5903}{-17.5064}{4.9631}{-17.8792}
\dcgd{4.0125}{-16.5931}{4.758}{-17.3387}{4.4225}{-17.6742}{3.677}{-16.9286}
\dcgk{4.9631}{-16.3881}{4.4225}{-16.9286}
\dcgl{4.5717}{-16.8914}{4.4225}{-16.9286}{4.4598}{-16.7795}
\dcge{8.435}{-16.0793}{-16.6065}{-17.6609}{-18.188}
\dcgf{8.6723}{-16.6065}{-17.6609}{8.1978}
\dcgo{9.4894}{-17.1337}{8.725}
\dcgp{8.8568}{-17.2127}{8.725}{-17.1337}{-17.0546}
\dcgc{13.3981}{-16.3881}{13.0253}{-16.7609}{12.2798}{-17.5064}{11.907}{-17.8792}
\dcgd{13.1931}{-16.9286}{12.4475}{-17.6742}{12.112}{-17.3387}{12.8576}{-16.5931}
\dcgk{13.3981}{-17.8792}{12.8576}{-17.3387}
\dcgl{12.8949}{-17.4878}{12.8576}{-17.3387}{13.0067}{-17.376}
\dcga{17.9244}{-17.1337}{17.3973}{16.3429}{15.8157}
\dcgb{17.3973}{-17.3709}{16.3429}{-16.8964}
\dcgm{16.8701}{-18.188}{-17.4236}
\dcgn{16.791}{-17.5554}{16.8701}{-17.4236}{16.9491}
\dcgc{21.8331}{-17.8792}{21.4604}{-17.5064}{20.7148}{-16.7609}{20.342}{-16.3881}
\dcgd{21.2926}{-17.6742}{20.5471}{-16.9286}{20.8826}{-16.5931}{21.6281}{-17.3387}
\dcgk{20.342}{-17.8792}{20.8826}{-17.3387}
\dcgl{20.7334}{-17.376}{20.8826}{-17.3387}{20.8453}{-17.4878}
\dcge{25.3051}{-18.188}{-17.6609}{-16.6065}{-16.0793}
\dcgf{25.0679}{-17.6609}{-16.6065}{25.5423}
\dcgo{24.2507}{-17.1337}{25.0152}
\dcgp{24.8834}{-17.0546}{25.0152}{-17.1337}{-17.2127}
\dcgc{28.7771}{-17.8792}{29.1498}{-17.5064}{29.8954}{-16.7609}{30.2682}{-16.3881}
\dcgd{28.9821}{-17.3387}{29.7277}{-16.5931}{30.0632}{-16.9286}{29.3176}{-17.6742}
\dcgk{28.7771}{-16.3881}{29.3176}{-16.9286}
\dcgl{29.2803}{-16.7795}{29.3176}{-16.9286}{29.1685}{-16.8914}
\dcga{-1.0544}{-20.5604}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-20.5604}{15}
\dcgr{-0.29}{-20.4286}{-20.6922}{-0.4218}{-20.5604}{-0.1582}{0.1845}{0.3954}
\dcgc{3.472}{-19.8148}{3.8447}{-20.1876}{4.5903}{-20.9332}{4.9631}{-21.306}
\dcgq{4.2175}{-20.5604}{15}
\dcgs{4.1057}{-20.2622}{3.9193}{-20.4486}{4.348}{-20.6909}{4.4971}{-20.84}
\dcge{8.435}{-19.506}{-20.0332}{-21.0876}{-21.6148}
\dcgq{8.435}{-20.5604}{15}
\dcgt{8.5668}{-20.2704}{8.3032}{8.435}{-20.1386}{-20.4022}{-20.7449}{-20.9558}
\dcgc{13.3981}{-19.8148}{13.0253}{-20.1876}{12.2798}{-20.9332}{11.907}{-21.306}
\dcgq{12.6526}{-20.5604}{15}
\dcgu{12.9508}{-20.4486}{12.7644}{-20.2622}{12.5221}{-20.6909}{12.373}{-20.84}
\dcga{17.9244}{-20.5604}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-20.5604}{15}
\dcgr{17.16}{-20.6922}{-20.4286}{17.2918}{-20.5604}{17.0282}{16.6856}{16.4747}
\dcgc{21.8331}{-21.306}{21.4604}{-20.9332}{20.7148}{-20.1876}{20.342}{-19.8148}
\dcgq{21.0876}{-20.5604}{15}
\dcgs{21.1994}{-20.8586}{21.3858}{-20.6722}{20.9571}{-20.4299}{20.808}{-20.2808}
\dcge{25.3051}{-21.6148}{-21.0876}{-20.0332}{-19.506}
\dcgq{25.3051}{-20.5604}{15}
\dcgt{25.1733}{-20.8504}{25.4369}{25.3051}{-20.9822}{-20.7186}{-20.3759}{-20.165}
\dcgc{28.7771}{-21.306}{29.1498}{-20.9332}{29.8954}{-20.1876}{30.2682}{-19.8148}
\dcgq{29.5226}{-20.5604}{15}
\dcgu{29.2244}{-20.6722}{29.4108}{-20.8586}{29.6531}{-20.4299}{29.8022}{-20.2808}
\dcga{-1.0544}{-23.9871}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-23.9871}{15}
\dcgo{-0.3163}{-23.9871}{0.3163}
\dcgp{0.1845}{-23.9081}{0.3163}{-23.9871}{-24.0662}
\dcgc{3.472}{-23.2416}{3.8447}{-23.6144}{4.5903}{-24.3599}{4.9631}{-24.7327}
\dcgq{4.2175}{-23.9871}{15}
\dcgk{3.9938}{-23.7635}{4.4412}{-24.2108}
\dcgl{4.4039}{-24.0617}{4.4412}{-24.2108}{4.2921}{-24.1735}
\dcge{8.435}{-22.9328}{-23.4599}{-24.5143}{-25.0415}
\dcgq{8.435}{-23.9871}{15}
\dcgm{8.435}{-23.6708}{-24.3034}
\dcgn{8.5141}{-24.1716}{8.435}{-24.3034}{8.356}
\dcgc{13.3981}{-23.2416}{13.0253}{-23.6144}{12.2798}{-24.3599}{11.907}{-24.7327}
\dcgq{12.6526}{-23.9871}{15}
\dcgk{12.8762}{-23.7635}{12.4289}{-24.2108}
\dcgl{12.578}{-24.1735}{12.4289}{-24.2108}{12.4662}{-24.0617}
\dcga{17.9244}{-23.9871}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-23.9871}{15}
\dcgo{17.1864}{-23.9871}{16.5538}
\dcgp{16.6856}{-24.0662}{16.5538}{-23.9871}{-23.9081}
\dcgc{21.8331}{-24.7327}{21.4604}{-24.3599}{20.7148}{-23.6144}{20.342}{-23.2416}
\dcgq{21.0876}{-23.9871}{15}
\dcgk{21.3113}{-24.2108}{20.8639}{-23.7635}
\dcgl{20.9012}{-23.9126}{20.8639}{-23.7635}{21.013}{-23.8007}
\dcge{25.3051}{-25.0415}{-24.5143}{-23.4599}{-22.9328}
\dcgq{25.3051}{-23.9871}{15}
\dcgm{25.3051}{-24.3034}{-23.6708}
\dcgn{25.226}{-23.8026}{25.3051}{-23.6708}{25.3842}
\dcgc{28.7771}{-24.7327}{29.1498}{-24.3599}{29.8954}{-23.6144}{30.2682}{-23.2416}
\dcgq{29.5226}{-23.9871}{15}
\dcgk{29.299}{-24.2108}{29.7463}{-23.7635}
\dcgl{29.5972}{-23.8007}{29.7463}{-23.7635}{29.709}{-23.9126}
\draw[dca] (-1.0544,-27.4139) -- (-0.3163,-27.4139) (0.3163,-27.4139) -- (1.0544,-27.4139) (-0.3163,-26.913) -- (-0.3163,-27.9147) (-0.1054,-27.1503) -- (-0.1054,-27.6775) (0.1054,-26.913) -- (0.1054,-27.9147) (0.3163,-27.1503) -- (0.3163,-27.6775);
\draw[dca] (3.472,-26.6683) -- (3.9938,-27.1902) (4.4412,-27.6375) -- (4.9631,-28.1594) (4.348,-26.8361) -- (3.6397,-27.5443) (4.3294,-27.1529) -- (3.9566,-27.5257) (4.6462,-27.1343) -- (3.9379,-27.8426) (4.6276,-27.4511) -- (4.2548,-27.8239);
\draw[dca] (8.435,-26.3595) -- (8.435,-27.0976) (8.435,-27.7302) -- (8.435,-28.4682) (8.9359,-27.0976) -- (7.9342,-27.0976) (8.6986,-27.3084) -- (8.1714,-27.3084) (8.9359,-27.5193) -- (7.9342,-27.5193) (8.6986,-27.7302) -- (8.1714,-27.7302);
\draw[dca] (13.3981,-26.6683) -- (12.8762,-27.1902) (12.4289,-27.6375) -- (11.907,-28.1594) (13.2304,-27.5443) -- (12.5221,-26.8361) (12.9135,-27.5257) -- (12.5407,-27.1529) (12.9321,-27.8426) -- (12.2239,-27.1343) (12.6153,-27.8239) -- (12.2425,-27.4511);
\draw[dca] (17.9244,-27.4139) -- (17.1864,-27.4139) (16.5538,-27.4139) -- (15.8157,-27.4139) (17.1864,-27.9147) -- (17.1864,-26.913) (16.9755,-27.6775) -- (16.9755,-27.1503) (16.7646,-27.9147) -- (16.7646,-26.913) (16.5538,-27.6775) -- (16.5538,-27.1503);
\draw[dca] (21.8331,-28.1594) -- (21.3113,-27.6375) (20.8639,-27.1902) -- (20.342,-26.6683) (20.9571,-27.9917) -- (21.6654,-27.2834) (20.9758,-27.6748) -- (21.3485,-27.302) (20.6589,-27.6934) -- (21.3672,-26.9852) (20.6775,-27.3766) -- (21.0503,-27.0038);
\draw[dca] (25.3051,-28.4682) -- (25.3051,-27.7302) (25.3051,-27.0976) -- (25.3051,-26.3595) (24.8043,-27.7302) -- (25.8059,-27.7302) (25.0415,-27.5193) -- (25.5687,-27.5193) (24.8043,-27.3084) -- (25.8059,-27.3084) (25.0415,-27.0976) -- (25.5687,-27.0976);
\draw[dca] (28.7771,-28.1594) -- (29.299,-27.6375) (29.7463,-27.1902) -- (30.2682,-26.6683) (28.9448,-27.2834) -- (29.6531,-27.9917) (29.2617,-27.302) -- (29.6345,-27.6748) (29.243,-26.9852) -- (29.9513,-27.6934) (29.5599,-27.0038) -- (29.9327,-27.3766);
\dcga{-1.0544}{-30.8406}{-0.5272}{0.5272}{1.0544}
\dcgv{-0.5799}{-30.8406}{0}{-30.2607}{0.5799}{-31.4205}
\dcgr{-0.29}{-30.7088}{-30.9724}{-0.4218}{-30.8406}{-0.1582}{0.1845}{0.3954}
\dcgc{3.472}{-30.095}{3.8447}{-30.4678}{4.5903}{-31.2134}{4.9631}{-31.5862}
\dcgb{3.8075}{-30.4305}{4.6276}{-31.2507}
\dcgs{4.1057}{-30.5424}{3.9193}{-30.7288}{4.348}{-30.9711}{4.4971}{-31.1202}
\dcge{8.435}{-29.7862}{-30.3134}{-31.3678}{-31.895}
\dcgw{8.435}{-30.2607}{9.0149}{-30.8406}{-31.4205}{7.8551}
\dcgt{8.5668}{-30.5506}{8.3032}{8.435}{-30.4188}{-30.6824}{-31.0251}{-31.236}
\dcgc{13.3981}{-30.095}{13.0253}{-30.4678}{12.2798}{-31.2134}{11.907}{-31.5862}
\dcgf{13.0626}{-30.4305}{-31.2507}{12.2425}
\dcgu{12.9508}{-30.7288}{12.7644}{-30.5424}{12.5221}{-30.9711}{12.373}{-31.1202}
\dcga{17.9244}{-30.8406}{17.3973}{16.3429}{15.8157}
\dcgv{17.45}{-30.8406}{16.8701}{-31.4205}{16.2902}{-30.2607}
\dcgr{17.16}{-30.9724}{-30.7088}{17.2918}{-30.8406}{17.0282}{16.6856}{16.4747}
\dcgc{21.8331}{-31.5862}{21.4604}{-31.2134}{20.7148}{-30.4678}{20.342}{-30.095}
\dcgb{21.4976}{-31.2507}{20.6775}{-30.4305}
\dcgs{21.1994}{-31.1388}{21.3858}{-30.9524}{20.9571}{-30.7101}{20.808}{-30.561}
\dcge{25.3051}{-31.895}{-31.3678}{-30.3134}{-29.7862}
\dcgw{25.3051}{-31.4205}{24.7252}{-30.8406}{-30.2607}{25.885}
\dcgt{25.1733}{-31.1306}{25.4369}{25.3051}{-31.2623}{-30.9988}{-30.6561}{-30.4452}
\dcgc{28.7771}{-31.5862}{29.1498}{-31.2134}{29.8954}{-30.4678}{30.2682}{-30.095}
\dcgf{29.1126}{-31.2507}{-30.4305}{29.9327}
\dcgu{29.2244}{-30.9524}{29.4108}{-31.1388}{29.6531}{-30.7101}{29.8022}{-30.561}
\dcga{-1.0544}{-34.2673}{-0.5272}{0.5272}{1.0544}
\dcgv{-0.5799}{-34.2673}{0}{-33.6874}{0.5799}{-34.8472}
\dcgo{-0.3163}{-34.2673}{0.3163}
\dcgp{0.1845}{-34.1883}{0.3163}{-34.2673}{-34.3464}
\dcgc{3.472}{-33.5218}{3.8447}{-33.8946}{4.5903}{-34.6401}{4.9631}{-35.0129}
\dcgb{3.8075}{-33.8573}{4.6276}{-34.6774}
\dcgk{3.9938}{-34.0437}{4.4412}{-34.491}
\dcgl{4.4039}{-34.3419}{4.4412}{-34.491}{4.2921}{-34.4537}
\dcge{8.435}{-33.213}{-33.7401}{-34.7945}{-35.3217}
\dcgw{8.435}{-33.6874}{9.0149}{-34.2673}{-34.8472}{7.8551}
\dcgm{8.435}{-33.951}{-34.5836}
\dcgn{8.5141}{-34.4518}{8.435}{-34.5836}{8.356}
\dcgc{13.3981}{-33.5218}{13.0253}{-33.8946}{12.2798}{-34.6401}{11.907}{-35.0129}
\dcgf{13.0626}{-33.8573}{-34.6774}{12.2425}
\dcgk{12.8762}{-34.0437}{12.4289}{-34.491}
\dcgl{12.578}{-34.4537}{12.4289}{-34.491}{12.4662}{-34.3419}
\dcga{17.9244}{-34.2673}{17.3973}{16.3429}{15.8157}
\dcgv{17.45}{-34.2673}{16.8701}{-34.8472}{16.2902}{-33.6874}
\dcgo{17.1864}{-34.2673}{16.5538}
\dcgp{16.6856}{-34.3464}{16.5538}{-34.2673}{-34.1883}
\dcgc{21.8331}{-35.0129}{21.4604}{-34.6401}{20.7148}{-33.8946}{20.342}{-33.5218}
\dcgb{21.4976}{-34.6774}{20.6775}{-33.8573}
\dcgk{21.3113}{-34.491}{20.8639}{-34.0437}
\dcgl{20.9012}{-34.1928}{20.8639}{-34.0437}{21.013}{-34.0809}
\dcge{25.3051}{-35.3217}{-34.7945}{-33.7401}{-33.213}
\dcgw{25.3051}{-34.8472}{24.7252}{-34.2673}{-33.6874}{25.885}
\dcgm{25.3051}{-34.5836}{-33.951}
\dcgn{25.226}{-34.0828}{25.3051}{-33.951}{25.3842}
\dcgc{28.7771}{-35.0129}{29.1498}{-34.6401}{29.8954}{-33.8946}{30.2682}{-33.5218}
\dcgf{29.1126}{-34.6774}{-33.8573}{29.9327}
\dcgk{29.299}{-34.491}{29.7463}{-34.0437}
\dcgl{29.5972}{-34.0809}{29.7463}{-34.0437}{29.709}{-34.1928}
\dcgx{-0.369}{-37.325}{0.3163}{-37.6941}{-38.0631}
\dcga{-1.0544}{-37.6941}{-0.369}{0.3163}{1.0544}
\dcgm{0.3163}{-37.325}{-38.0631}
\dcgy{4.2175}{-37.1722}{4.4412}{-37.9177}{3.6956}{-37.6941}
\dcgc{3.472}{-36.9485}{3.9566}{-37.4331}{4.4412}{-37.9177}{4.9631}{-38.4396}
\dcgk{4.7021}{-37.6568}{4.1802}{-38.1787}
\dcgz{8.8041}{-37.325}{8.435}{-38.0104}{8.066}
\dcge{8.435}{-36.6397}{-37.325}{-38.0104}{-38.7484}
\dcgo{8.8041}{-38.0104}{8.066}
\dcgy{13.1744}{-37.6941}{12.4289}{-37.9177}{12.6526}{-37.1722}
\dcgc{13.3981}{-36.9485}{12.9135}{-37.4331}{12.4289}{-37.9177}{11.907}{-38.4396}
\dcgk{12.6898}{-38.1787}{12.1679}{-37.6568}
\dcgx{17.2391}{-38.0631}{16.5538}{-37.6941}{-37.325}
\dcga{17.9244}{-37.6941}{17.2391}{16.5538}{15.8157}
\dcgm{16.5538}{-38.0631}{-37.325}
\dcgy{21.0876}{-38.216}{20.8639}{-37.4704}{21.6095}{-37.6941}
\dcgc{21.8331}{-38.4396}{21.3485}{-37.955}{20.8639}{-37.4704}{20.342}{-36.9485}
\dcgk{20.603}{-37.7313}{21.1249}{-37.2095}
\dcgz{24.9361}{-38.0631}{25.3051}{-37.3778}{25.6741}
\dcge{25.3051}{-38.7484}{-38.0631}{-37.3778}{-36.6397}
\dcgo{24.9361}{-37.3778}{25.6741}
\dcgy{29.0007}{-37.6941}{29.7463}{-37.4704}{29.5226}{-38.216}
\dcgc{28.7771}{-38.4396}{29.2617}{-37.955}{29.7463}{-37.4704}{30.2682}{-36.9485}
\dcgk{29.4853}{-37.2095}{30.0072}{-37.7313}
\dcgx{-0.369}{-40.7518}{0.3163}{-41.1208}{-41.4898}
\dcga{-1.0544}{-41.1208}{-0.369}{0.3163}{1.0544}
\dcgm{0.3163}{-40.7518}{-41.4898}
\dcgc{0.0264}{-40.5672}{0.3427}{-40.2509}{0.29}{-40.6727}{0.6063}{-40.3564}
\dcgl{0.1936}{-40.2882}{0.3427}{-40.2509}{0.3054}{-40.4}
\dcgl{0.4572}{-40.3936}{0.6063}{-40.3564}{0.569}{-40.5055}
\dcgy{4.2175}{-40.5989}{4.4412}{-41.3445}{3.6956}{-41.1208}
\dcgc{3.472}{-40.3752}{3.9566}{-40.8599}{4.4412}{-41.3445}{4.9631}{-41.8664}
\dcgk{4.7021}{-41.0835}{4.1802}{-41.6054}
\dcgaa{4.6276}{-40.748}{5.0749}{4.7394}{-41.009}{5.1867}
\dcgp{4.9431}{-40.6689}{5.0749}{-40.748}{-40.8271}
\dcgp{5.0549}{-40.9299}{5.1867}{-41.009}{-41.088}
\dcgz{8.8041}{-40.7518}{8.435}{-41.4371}{8.066}
\dcge{8.435}{-40.0664}{-40.7518}{-41.4371}{-42.1752}
\dcgo{8.8041}{-41.4371}{8.066}
\dcgc{8.9886}{-41.1472}{9.3049}{-41.4635}{8.8831}{-41.4108}{9.1995}{-41.7271}
\dcgl{9.2676}{-41.3144}{9.3049}{-41.4635}{9.1558}{-41.4262}
\dcgl{9.1622}{-41.578}{9.1995}{-41.7271}{9.0503}{-41.6898}
\dcgy{13.1744}{-41.1208}{12.4289}{-41.3445}{12.6526}{-40.5989}
\dcgc{13.3981}{-40.3752}{12.9135}{-40.8599}{12.4289}{-41.3445}{11.907}{-41.8664}
\dcgk{12.6898}{-41.6054}{12.1679}{-41.0835}
\dcgab{13.0253}{-41.5309}{-41.9782}{12.7644}{-41.6427}{-42.09}
\dcgn{13.1044}{-41.8464}{13.0253}{-41.9782}{12.9463}
\dcgn{12.8435}{-41.9582}{12.7644}{-42.09}{12.6853}
\dcgx{17.2391}{-41.4898}{16.5538}{-41.1208}{-40.7518}
\dcga{17.9244}{-41.1208}{17.2391}{16.5538}{15.8157}
\dcgm{16.5538}{-41.4898}{-40.7518}
\dcgc{16.8437}{-41.6743}{16.5274}{-41.9907}{16.5801}{-41.5689}{16.2638}{-41.8852}
\dcgl{16.6765}{-41.9534}{16.5274}{-41.9907}{16.5647}{-41.8415}
\dcgl{16.4129}{-41.8479}{16.2638}{-41.8852}{16.3011}{-41.7361}
\dcgy{21.0876}{-41.6427}{20.8639}{-40.8971}{21.6095}{-41.1208}
\dcgc{21.8331}{-41.8664}{21.3485}{-41.3817}{20.8639}{-40.8971}{20.342}{-40.3752}
\dcgk{20.603}{-41.1581}{21.1249}{-40.6362}
\dcgaa{20.6775}{-41.4936}{20.2302}{20.5657}{-41.2326}{20.1184}
\dcgp{20.362}{-41.5727}{20.2302}{-41.4936}{-41.4145}
\dcgp{20.2502}{-41.3117}{20.1184}{-41.2326}{-41.1536}
\dcgz{24.9361}{-41.4898}{25.3051}{-40.8045}{25.6741}
\dcge{25.3051}{-42.1752}{-41.4898}{-40.8045}{-40.0664}
\dcgo{24.9361}{-40.8045}{25.6741}
\dcgc{24.7516}{-41.0944}{24.4352}{-40.7781}{24.857}{-40.8308}{24.5407}{-40.5145}
\dcgl{24.4725}{-40.9272}{24.4352}{-40.7781}{24.5844}{-40.8154}
\dcgl{24.578}{-40.6636}{24.5407}{-40.5145}{24.6898}{-40.5518}
\dcgy{29.0007}{-41.1208}{29.7463}{-40.8971}{29.5226}{-41.6427}
\dcgc{28.7771}{-41.8664}{29.2617}{-41.3817}{29.7463}{-40.8971}{30.2682}{-40.3752}
\dcgk{29.4853}{-40.6362}{30.0072}{-41.1581}
\dcgab{29.1498}{-40.7107}{-40.2634}{29.4108}{-40.5989}{-40.1516}
\dcgn{29.0708}{-40.3952}{29.1498}{-40.2634}{29.2289}
\dcgn{29.3317}{-40.2834}{29.4108}{-40.1516}{29.4899}
\dcgx{-0.369}{-44.1785}{0.3163}{-44.5475}{-44.9166}
\dcga{-1.0544}{-44.5475}{-0.369}{0.3163}{1.0544}
\dcgac{0.1582}{-44.0731}{0.3163}{-44.9166}{0.4745}
\dcgy{4.2175}{-44.0256}{4.4412}{-44.7712}{3.6956}{-44.5475}
\dcgc{3.472}{-43.802}{3.9566}{-44.2866}{4.4412}{-44.7712}{4.9631}{-45.2931}
\draw[dca] (4.6649,-44.3239) -- (4.7767,-44.4357) -- (4.1802,-45.0321) -- (4.2921,-45.144);
\dcgz{8.8041}{-44.1785}{8.435}{-44.8638}{8.066}
\dcge{8.435}{-43.4932}{-44.1785}{-44.8638}{-45.6019}
\dcgad{8.9095}{-44.7057}{-44.8638}{8.066}{-45.022}
\dcgy{13.1744}{-44.5475}{12.4289}{-44.7712}{12.6526}{-44.0256}
\dcgc{13.3981}{-43.802}{12.9135}{-44.2866}{12.4289}{-44.7712}{11.907}{-45.2931}
\draw[dca] (12.8762,-44.9949) -- (12.7644,-45.1067) -- (12.1679,-44.5103) -- (12.0561,-44.6221);
\dcgx{17.2391}{-44.9166}{16.5538}{-44.5475}{-44.1785}
\dcga{17.9244}{-44.5475}{17.2391}{16.5538}{15.8157}
\dcgac{16.7119}{-45.022}{16.5538}{-44.1785}{16.3956}
\dcgy{21.0876}{-45.0694}{20.8639}{-44.3239}{21.6095}{-44.5475}
\dcgc{21.8331}{-45.2931}{21.3485}{-44.8085}{20.8639}{-44.3239}{20.342}{-43.802}
\draw[dca] (20.6403,-44.7712) -- (20.5284,-44.6594) -- (21.1249,-44.0629) -- (21.013,-43.9511);
\dcgz{24.9361}{-44.9166}{25.3051}{-44.2312}{25.6741}
\dcge{25.3051}{-45.6019}{-44.9166}{-44.2312}{-43.4932}
\dcgad{24.8306}{-44.3894}{-44.2312}{25.6741}{-44.0731}
\dcgy{29.0007}{-44.5475}{29.7463}{-44.3239}{29.5226}{-45.0694}
\dcgc{28.7771}{-45.2931}{29.2617}{-44.8085}{29.7463}{-44.3239}{30.2682}{-43.802}
\draw[dca] (29.299,-44.1002) -- (29.4108,-43.9884) -- (30.0072,-44.5848) -- (30.1191,-44.473);
\dcgae{-1.0544}{-47.9743}{-0.4481}{0.4481}{1.0544}{-0.3954}{0.3427}{-47.4734}
\dcgq{-0.4218}{-47.9743}{1.875}
\dcgq{0.4218}{-47.9743}{1.875}
\draw[dca] (3.472,-47.2287) -- (3.9007,-47.6574) (4.5344,-48.2911) -- (4.9631,-48.7198) (3.9379,-47.6947) -- (4.814,-47.8624);
\dcgq{3.9193}{-47.676}{1.875}
\dcgq{4.5157}{-48.2725}{1.875}
\dcgaf{8.435}{-46.9199}{-47.5262}{-48.4224}{-49.0286}{-47.5789}{8.9359}{-48.3169}
\dcgq{8.435}{-47.5525}{1.875}
\dcgq{8.435}{-48.396}{1.875}
\draw[dca] (13.3981,-47.2287) -- (12.9694,-47.6574) (12.3357,-48.2911) -- (11.907,-48.7198) (12.9321,-47.6947) -- (12.7644,-48.5707);
\dcgq{12.9508}{-47.676}{1.875}
\dcgq{12.3543}{-48.2725}{1.875}
\dcgae{17.9244}{-47.9743}{17.3182}{16.422}{15.8157}{17.2655}{16.5274}{-48.4751}
\dcgq{17.2918}{-47.9743}{1.875}
\dcgq{16.4483}{-47.9743}{1.875}
\draw[dca] (21.8331,-48.7198) -- (21.4045,-48.2911) (20.7707,-47.6574) -- (20.342,-47.2287) (21.3672,-48.2538) -- (20.4911,-48.0861);
\dcgq{21.3858}{-48.2725}{1.875}
\dcgq{20.7894}{-47.676}{1.875}
\dcgaf{25.3051}{-49.0286}{-48.4224}{-47.5262}{-46.9199}{-48.3697}{24.8043}{-47.6316}
\dcgq{25.3051}{-48.396}{1.875}
\dcgq{25.3051}{-47.5525}{1.875}
\draw[dca] (28.7771,-48.7198) -- (29.2058,-48.2911) (29.8395,-47.6574) -- (30.2682,-47.2287) (29.243,-48.2538) -- (29.4108,-47.3778);
\dcgq{29.2244}{-48.2725}{1.875}
\dcgq{29.8208}{-47.676}{1.875}
\dcgag{-1.0544}{-51.401}{-0.4481}{0.4481}{1.0544}{-0.3954}{0.3427}
\dcgq{-0.4218}{-51.401}{1.875}
\dcgq{0.4218}{-51.401}{1.875}
\draw[dca] (3.472,-50.6554) -- (3.9007,-51.0841) (4.5344,-51.7179) -- (4.9631,-52.1466) (3.9379,-51.1214) -- (4.4598,-51.6433);
\dcgq{3.9193}{-51.1028}{1.875}
\dcgq{4.5157}{-51.6992}{1.875}
\dcgah{8.435}{-50.3466}{-50.9529}{-51.8491}{-52.4554}{-51.0056}{-51.7437}
\dcgq{8.435}{-50.9792}{1.875}
\dcgq{8.435}{-51.8227}{1.875}
\draw[dca] (13.3981,-50.6554) -- (12.9694,-51.0841) (12.3357,-51.7179) -- (11.907,-52.1466) (12.9321,-51.1214) -- (12.4102,-51.6433);
\dcgq{12.9508}{-51.1028}{1.875}
\dcgq{12.3543}{-51.6992}{1.875}
\dcgag{17.9244}{-51.401}{17.3182}{16.422}{15.8157}{17.2655}{16.5274}
\dcgq{17.2918}{-51.401}{1.875}
\dcgq{16.4483}{-51.401}{1.875}
\draw[dca] (21.8331,-52.1466) -- (21.4045,-51.7179) (20.7707,-51.0841) -- (20.342,-50.6554) (21.3672,-51.6806) -- (20.8453,-51.1587);
\dcgq{21.3858}{-51.6992}{1.875}
\dcgq{20.7894}{-51.1028}{1.875}
\dcgah{25.3051}{-52.4554}{-51.8491}{-50.9529}{-50.3466}{-51.7964}{-51.0583}
\dcgq{25.3051}{-51.8227}{1.875}
\dcgq{25.3051}{-50.9792}{1.875}
\draw[dca] (28.7771,-52.1466) -- (29.2058,-51.7179) (29.8395,-51.0841) -- (30.2682,-50.6554) (29.243,-51.6806) -- (29.7649,-51.1587);
\dcgq{29.2244}{-51.6992}{1.875}
\dcgq{29.8208}{-51.1028}{1.875}
\draw[dca] (0,-53.7733) -- (0,-54.8277) (-0.5008,-54.8277) -- (0.5008,-54.8277) (-0.3163,-55.0122) -- (0.3163,-55.0122) (-0.1318,-55.1968) -- (0.1318,-55.1968);
\draw[dca] (4.9631,-54.0822) -- (4.2175,-54.8277) (3.8634,-54.4736) -- (4.5717,-55.1819) (3.8634,-54.7345) -- (4.3107,-55.1819) (3.8634,-54.9955) -- (4.0498,-55.1819);
\draw[dca] (9.4894,-54.8277) -- (8.435,-54.8277) (8.435,-54.3269) -- (8.435,-55.3286) (8.2505,-54.5114) -- (8.2505,-55.144) (8.066,-54.6959) -- (8.066,-54.9595);
\draw[dca] (13.3981,-55.5733) -- (12.6526,-54.8277) (13.0067,-54.4736) -- (12.2984,-55.1819) (12.7457,-54.4736) -- (12.2984,-54.9209) (12.4848,-54.4736) -- (12.2984,-54.66);
\draw[dca] (16.8701,-55.8821) -- (16.8701,-54.8277) (17.3709,-54.8277) -- (16.3692,-54.8277) (17.1864,-54.6432) -- (16.5538,-54.6432) (17.0019,-54.4587) -- (16.7383,-54.4587);
\draw[dca] (20.342,-55.5733) -- (21.0876,-54.8277) (21.4417,-55.1819) -- (20.7334,-54.4736) (21.4417,-54.9209) -- (20.9944,-54.4736) (21.4417,-54.66) -- (21.2553,-54.4736);
\draw[dca] (24.2507,-54.8277) -- (25.3051,-54.8277) (25.3051,-55.3286) -- (25.3051,-54.3269) (25.4896,-55.144) -- (25.4896,-54.5114) (25.6741,-54.9595) -- (25.6741,-54.6959);
\draw[dca] (28.7771,-54.0822) -- (29.5226,-54.8277) (29.1685,-55.1819) -- (29.8768,-54.4736) (29.4294,-55.1819) -- (29.8768,-54.7345) (29.6904,-55.1819) -- (29.8768,-54.9955);
\dcga{-1.0544}{-58.2545}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-58.2545}{15}
\dcgai{-0.193}{-57.8673}{0.193}{-58.6054}
\node[dcc] at (0,-58.2808) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">A</text></g>}{A}};
\dcgc{3.472}{-57.5089}{3.8447}{-57.8817}{4.5903}{-58.6272}{4.9631}{-59}
\dcgq{4.2175}{-58.2545}{15}
\dcgai{3.8329}{-57.8443}{4.6277}{-58.639}
\node[dcd] at (4.1989,-58.2731) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">A</text></g>}{A}};
\dcge{8.435}{-57.2001}{-57.7273}{-58.7817}{-59.3088}
\dcgq{8.435}{-58.2545}{15}
\dcgai{8.0841}{-58.0615}{8.8222}{-58.4474}
\node[dce] at (8.4087,-58.2545) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">A</text></g>}{A}};
\dcgc{13.3981}{-57.5089}{13.0253}{-57.8817}{12.2798}{-58.6272}{11.907}{-59}
\dcgq{12.6526}{-58.2545}{15}
\dcgai{12.268}{-57.8699}{13.0628}{-58.6647}
\node[dcf] at (12.6339,-58.2358) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">A</text></g>}{A}};
\dcga{17.9244}{-58.2545}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-58.2545}{15}
\dcgai{16.6771}{-57.9036}{17.063}{-58.6416}
\node[dcg] at (16.8701,-58.2281) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">A</text></g>}{A}};
\dcgc{21.8331}{-59}{21.4604}{-58.6272}{20.7148}{-57.8817}{20.342}{-57.5089}
\dcgq{21.0876}{-58.2545}{15}
\dcgai{20.6774}{-57.8699}{21.4722}{-58.6647}
\node[dch] at (21.1062,-58.2358) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">A</text></g>}{A}};
\dcge{25.3051}{-59.3088}{-58.7817}{-57.7273}{-57.2001}
\dcgq{25.3051}{-58.2545}{15}
\dcgai{24.918}{-58.0615}{25.656}{-58.4474}
\node[dci] at (25.3315,-58.2545) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">A</text></g>}{A}};
\dcgc{28.7771}{-59}{29.1498}{-58.6272}{29.8954}{-57.8817}{30.2682}{-57.5089}
\dcgq{29.5226}{-58.2545}{15}
\dcgai{29.1124}{-57.8443}{29.9072}{-58.639}
\node[dcj] at (29.5413,-58.2731) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">A</text></g>}{A}};
\dcga{-1.0544}{-61.6812}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-61.6812}{15}
\dcgai{-0.1713}{-61.294}{0.1713}{-62.0321}
\node[dcc] at (0,-61.7076) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcgc{3.472}{-60.9356}{3.8447}{-61.3084}{4.5903}{-62.054}{4.9631}{-62.4268}
\dcgq{4.2175}{-61.6812}{15}
\dcgai{3.8482}{-61.2863}{4.6124}{-62.0505}
\node[dcd] at (4.1989,-61.6998) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcge{8.435}{-60.6268}{-61.154}{-62.2084}{-62.7356}
\dcgq{8.435}{-61.6812}{15}
\dcgai{8.0841}{-61.5099}{8.8222}{-61.8525}
\node[dce] at (8.4087,-61.6812) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcgc{13.3981}{-60.9356}{13.0253}{-61.3084}{12.2798}{-62.054}{11.907}{-62.4268}
\dcgq{12.6526}{-61.6812}{15}
\dcgai{12.2833}{-61.3119}{13.0475}{-62.0761}
\node[dcf] at (12.6339,-61.6626) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcga{17.9244}{-61.6812}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-61.6812}{15}
\dcgai{16.6987}{-61.3303}{17.0414}{-62.0684}
\node[dcg] at (16.8701,-61.6548) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcgc{21.8331}{-62.4268}{21.4604}{-62.054}{20.7148}{-61.3084}{20.342}{-60.9356}
\dcgq{21.0876}{-61.6812}{15}
\dcgai{20.6927}{-61.3119}{21.4569}{-62.0761}
\node[dch] at (21.1062,-61.6626) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcge{25.3051}{-62.7356}{-62.2084}{-61.154}{-60.6268}
\dcgq{25.3051}{-61.6812}{15}
\dcgai{24.918}{-61.5099}{25.656}{-61.8525}
\node[dci] at (25.3315,-61.6812) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcgc{28.7771}{-62.4268}{29.1498}{-62.054}{29.8954}{-61.3084}{30.2682}{-60.9356}
\dcgq{29.5226}{-61.6812}{15}
\dcgai{29.1277}{-61.2863}{29.8919}{-62.0505}
\node[dcj] at (29.5413,-61.6998) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\draw[dca] (-1.0544,-64.0535) -- (-0.5272,-64.0535) -- (-0.5272,-64.4753) .. controls (-0.0527,-64.4753) and (-0.0527,-64.7916) .. (-0.5272,-64.7916) .. controls (-0.0527,-64.7916) and (-0.0527,-65.1079) .. (-0.5272,-65.1079) .. controls (-0.0527,-65.1079) and (-0.0527,-65.4242) .. (-0.5272,-65.4242) .. controls (-0.0527,-65.4242) and (-0.0527,-65.7406) .. (-0.5272,-65.7406) -- (-0.5272,-66.1623) -- (-1.0544,-66.1623) (1.0544,-64.0535) -- (0.5272,-64.0535) -- (0.5272,-64.4753) .. controls (0.0527,-64.4753) and (0.0527,-64.7916) .. (0.5272,-64.7916) .. controls (0.0527,-64.7916) and (0.0527,-65.1079) .. (0.5272,-65.1079) .. controls (0.0527,-65.1079) and (0.0527,-65.4242) .. (0.5272,-65.4242) .. controls (0.0527,-65.4242) and (0.0527,-65.7406) .. (0.5272,-65.7406) -- (0.5272,-66.1623) -- (1.0544,-66.1623);
\dcgaj{-0.0791}{-64.4489}{-65.7669}{0.0791}
\draw[dca] (4.2175,-63.6168) -- (4.5903,-63.9896) -- (4.2921,-64.2878) .. controls (4.6276,-64.6233) and (4.4039,-64.847) .. (4.0684,-64.5115) .. controls (4.4039,-64.847) and (4.1802,-65.0707) .. (3.8447,-64.7351) .. controls (4.1802,-65.0707) and (3.9566,-65.2943) .. (3.6211,-64.9588) .. controls (3.9566,-65.2943) and (3.7329,-65.518) .. (3.3974,-65.1825) -- (3.0992,-65.4807) -- (2.7264,-65.1079) (5.7086,-65.1079) -- (5.3359,-64.7351) -- (5.0376,-65.0334) .. controls (4.7021,-64.6979) and (4.4785,-64.9215) .. (4.814,-65.257) .. controls (4.4785,-64.9215) and (4.2548,-65.1452) .. (4.5903,-65.4807) .. controls (4.2548,-65.1452) and (4.0311,-65.3689) .. (4.3666,-65.7044) .. controls (4.0311,-65.3689) and (3.8075,-65.5925) .. (4.143,-65.928) -- (3.8447,-66.2263) -- (4.2175,-66.599);
\dcgc{4.6276}{-64.586}{3.6956}{-65.518}{4.7394}{-64.6979}{3.8075}{-65.6298}
\draw[dca] (9.4894,-64.0535) -- (9.4894,-64.5807) -- (9.0677,-64.5807) .. controls (9.0677,-65.0552) and (8.7513,-65.0552) .. (8.7513,-64.5807) .. controls (8.7513,-65.0552) and (8.435,-65.0552) .. (8.435,-64.5807) .. controls (8.435,-65.0552) and (8.1187,-65.0552) .. (8.1187,-64.5807) .. controls (8.1187,-65.0552) and (7.8024,-65.0552) .. (7.8024,-64.5807) -- (7.3807,-64.5807) -- (7.3807,-64.0535) (9.4894,-66.1623) -- (9.4894,-65.6351) -- (9.0677,-65.6351) .. controls (9.0677,-65.1606) and (8.7513,-65.1606) .. (8.7513,-65.6351) .. controls (8.7513,-65.1606) and (8.435,-65.1606) .. (8.435,-65.6351) .. controls (8.435,-65.1606) and (8.1187,-65.1606) .. (8.1187,-65.6351) .. controls (8.1187,-65.1606) and (7.8024,-65.1606) .. (7.8024,-65.6351) -- (7.3807,-65.6351) -- (7.3807,-66.1623);
\dcgak{9.094}{-65.0289}{7.776}{-65.187}
\draw[dca] (14.1437,-65.1079) -- (13.7709,-65.4807) -- (13.4727,-65.1825) .. controls (13.1372,-65.518) and (12.9135,-65.2943) .. (13.249,-64.9588) .. controls (12.9135,-65.2943) and (12.6898,-65.0707) .. (13.0253,-64.7351) .. controls (12.6898,-65.0707) and (12.4662,-64.847) .. (12.8017,-64.5115) .. controls (12.4662,-64.847) and (12.2425,-64.6233) .. (12.578,-64.2878) -- (12.2798,-63.9896) -- (12.6526,-63.6168) (12.6526,-66.599) -- (13.0253,-66.2263) -- (12.7271,-65.928) .. controls (13.0626,-65.5925) and (12.8389,-65.3689) .. (12.5034,-65.7044) .. controls (12.8389,-65.3689) and (12.6153,-65.1452) .. (12.2798,-65.4807) .. controls (12.6153,-65.1452) and (12.3916,-64.9215) .. (12.0561,-65.257) .. controls (12.3916,-64.9215) and (12.1679,-64.6979) .. (11.8324,-65.0334) -- (11.5342,-64.7351) -- (11.1614,-65.1079);
\dcgc{13.1744}{-65.518}{12.2425}{-64.586}{13.0626}{-65.6298}{12.1307}{-64.6979}
\draw[dca] (17.9244,-66.1623) -- (17.3973,-66.1623) -- (17.3973,-65.7406) .. controls (16.9228,-65.7406) and (16.9228,-65.4242) .. (17.3973,-65.4242) .. controls (16.9228,-65.4242) and (16.9228,-65.1079) .. (17.3973,-65.1079) .. controls (16.9228,-65.1079) and (16.9228,-64.7916) .. (17.3973,-64.7916) .. controls (16.9228,-64.7916) and (16.9228,-64.4753) .. (17.3973,-64.4753) -- (17.3973,-64.0535) -- (17.9244,-64.0535) (15.8157,-66.1623) -- (16.3429,-66.1623) -- (16.3429,-65.7406) .. controls (16.8174,-65.7406) and (16.8174,-65.4242) .. (16.3429,-65.4242) .. controls (16.8174,-65.4242) and (16.8174,-65.1079) .. (16.3429,-65.1079) .. controls (16.8174,-65.1079) and (16.8174,-64.7916) .. (16.3429,-64.7916) .. controls (16.8174,-64.7916) and (16.8174,-64.4753) .. (16.3429,-64.4753) -- (16.3429,-64.0535) -- (15.8157,-64.0535);
\dcgaj{16.9491}{-65.7669}{-64.4489}{16.791}
\draw[dca] (21.0876,-66.599) -- (20.7148,-66.2263) -- (21.013,-65.928) .. controls (20.6775,-65.5925) and (20.9012,-65.3689) .. (21.2367,-65.7044) .. controls (20.9012,-65.3689) and (21.1249,-65.1452) .. (21.4604,-65.4807) .. controls (21.1249,-65.1452) and (21.3485,-64.9215) .. (21.684,-65.257) .. controls (21.3485,-64.9215) and (21.5722,-64.6979) .. (21.9077,-65.0334) -- (22.2059,-64.7351) -- (22.5787,-65.1079) (19.5965,-65.1079) -- (19.9692,-65.4807) -- (20.2675,-65.1825) .. controls (20.603,-65.518) and (20.8266,-65.2943) .. (20.4911,-64.9588) .. controls (20.8266,-65.2943) and (21.0503,-65.0707) .. (20.7148,-64.7351) .. controls (21.0503,-65.0707) and (21.274,-64.847) .. (20.9385,-64.5115) .. controls (21.274,-64.847) and (21.4976,-64.6233) .. (21.1621,-64.2878) -- (21.4604,-63.9896) -- (21.0876,-63.6168);
\dcgc{20.6775}{-65.6298}{21.6095}{-64.6979}{20.5657}{-65.518}{21.4976}{-64.586}
\draw[dca] (24.2507,-66.1623) -- (24.2507,-65.6351) -- (24.6725,-65.6351) .. controls (24.6725,-65.1606) and (24.9888,-65.1606) .. (24.9888,-65.6351) .. controls (24.9888,-65.1606) and (25.3051,-65.1606) .. (25.3051,-65.6351) .. controls (25.3051,-65.1606) and (25.6214,-65.1606) .. (25.6214,-65.6351) .. controls (25.6214,-65.1606) and (25.9377,-65.1606) .. (25.9377,-65.6351) -- (26.3595,-65.6351) -- (26.3595,-66.1623) (24.2507,-64.0535) -- (24.2507,-64.5807) -- (24.6725,-64.5807) .. controls (24.6725,-65.0552) and (24.9888,-65.0552) .. (24.9888,-64.5807) .. controls (24.9888,-65.0552) and (25.3051,-65.0552) .. (25.3051,-64.5807) .. controls (25.3051,-65.0552) and (25.6214,-65.0552) .. (25.6214,-64.5807) .. controls (25.6214,-65.0552) and (25.9377,-65.0552) .. (25.9377,-64.5807) -- (26.3595,-64.5807) -- (26.3595,-64.0535);
\dcgak{24.6461}{-65.187}{25.9641}{-65.0289}
\draw[dca] (28.0315,-65.1079) -- (28.4043,-64.7351) -- (28.7025,-65.0334) .. controls (29.038,-64.6979) and (29.2617,-64.9215) .. (28.9262,-65.257) .. controls (29.2617,-64.9215) and (29.4853,-65.1452) .. (29.1498,-65.4807) .. controls (29.4853,-65.1452) and (29.709,-65.3689) .. (29.3735,-65.7044) .. controls (29.709,-65.3689) and (29.9327,-65.5925) .. (29.5972,-65.928) -- (29.8954,-66.2263) -- (29.5226,-66.599) (29.5226,-63.6168) -- (29.1498,-63.9896) -- (29.4481,-64.2878) .. controls (29.1126,-64.6233) and (29.3362,-64.847) .. (29.6717,-64.5115) .. controls (29.3362,-64.847) and (29.5599,-65.0707) .. (29.8954,-64.7351) .. controls (29.5599,-65.0707) and (29.7836,-65.2943) .. (30.1191,-64.9588) .. controls (29.7836,-65.2943) and (30.0072,-65.518) .. (30.3427,-65.1825) -- (30.641,-65.4807) -- (31.0137,-65.1079);
\dcgc{29.0007}{-64.6979}{29.9327}{-65.6298}{29.1126}{-64.586}{30.0445}{-65.518}
\dcga{-1.0544}{-68.5347}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.6326}{-68.0075}{0.6326}{-69.0619}
\dcgai{-0.555}{-68.3765}{0.555}{-68.6665}
\node[text=dcColor0, font=\fontsize{5.6667}{7.3667}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (0,-68.5347) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="7.5556">BLACK&\string#32;BOX</text></g>}{BLACK BOX}};
\dcgc{3.472}{-67.7891}{3.8447}{-68.1619}{4.5903}{-68.9074}{4.9631}{-69.2802}
\dcgd{4.143}{-67.7145}{5.0376}{-68.6092}{4.2921}{-69.3548}{3.3974}{-68.4601}
\dcgai{3.7319}{-68.0304}{4.7218}{-69.0203}
\node[text=dcColor0, font=\fontsize{5.6667}{7.3667}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-45] at (4.2175,-68.5347) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="7.5556">BLACK&\string#32;BOX</text></g>}{BLACK BOX}};
\dcge{8.435}{-67.4803}{-68.0075}{-69.0619}{-69.589}
\dcgf{8.9622}{-67.902}{-69.1673}{7.9078}
\dcgai{8.3032}{-67.9797}{8.5932}{-69.0897}
\node[text=dcColor0, font=\fontsize{5.6667}{7.3667}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-90] at (8.435,-68.5347) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="7.5556">BLACK&\string#32;BOX</text></g>}{BLACK BOX}};
\dcgc{13.3981}{-67.7891}{13.0253}{-68.1619}{12.2798}{-68.9074}{11.907}{-69.2802}
\dcgd{13.4727}{-68.4601}{12.578}{-69.3548}{11.8324}{-68.6092}{12.7271}{-67.7145}
\dcgai{12.1669}{-68.049}{13.1568}{-69.0389}
\node[text=dcColor0, font=\fontsize{5.6667}{7.3667}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-135] at (12.6526,-68.5347) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="7.5556">BLACK&\string#32;BOX</text></g>}{BLACK BOX}};
\dcga{17.9244}{-68.5347}{17.3973}{16.3429}{15.8157}
\dcgb{17.5027}{-69.0619}{16.2374}{-68.0075}
\dcgai{16.3151}{-68.4029}{17.4251}{-68.6928}
\node[text=dcColor0, font=\fontsize{5.6667}{7.3667}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-180] at (16.8701,-68.5347) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="7.5556">BLACK&\string#32;BOX</text></g>}{BLACK BOX}};
\dcgc{21.8331}{-69.2802}{21.4604}{-68.9074}{20.7148}{-68.1619}{20.342}{-67.7891}
\dcgd{21.1621}{-69.3548}{20.2675}{-68.4601}{21.013}{-67.7145}{21.9077}{-68.6092}
\dcgai{20.5833}{-68.049}{21.5732}{-69.0389}
\node[text=dcColor0, font=\fontsize{5.6667}{7.3667}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-225] at (21.0876,-68.5347) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="7.5556">BLACK&\string#32;BOX</text></g>}{BLACK BOX}};
\dcge{25.3051}{-69.589}{-69.0619}{-68.0075}{-67.4803}
\dcgf{24.7779}{-69.1673}{-67.902}{25.8323}
\dcgai{25.1469}{-67.9797}{25.4369}{-69.0897}
\node[text=dcColor0, font=\fontsize{5.6667}{7.3667}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-270] at (25.3051,-68.5347) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="7.5556">BLACK&\string#32;BOX</text></g>}{BLACK BOX}};
\dcgc{28.7771}{-69.2802}{29.1498}{-68.9074}{29.8954}{-68.1619}{30.2682}{-67.7891}
\dcgd{28.7025}{-68.6092}{29.5972}{-67.7145}{30.3427}{-68.4601}{29.4481}{-69.3548}
\dcgai{29.0184}{-68.0304}{30.0083}{-69.0203}
\node[text=dcColor0, font=\fontsize{5.6667}{7.3667}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-315] at (29.5226,-68.5347) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="7.5556">BLACK&\string#32;BOX</text></g>}{BLACK BOX}};
\dcga{-1.0544}{-71.9614}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-71.7242}{0.5272}{-72.1986}
\draw[dca] (-0.5272,-72.5677) -- (0.5272,-71.3551) -- (0.7908,-71.3551);
\dcgai{0.6485}{-71.4779}{0.8372}{-71.8469}
\node[text=dcColor0, font=\fontsize{7.5}{9.75}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (0.7381,-71.6978) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="10">T</text></g>}{T}};
\dcgc{3.472}{-71.2158}{3.8447}{-71.5886}{4.5903}{-72.3342}{4.9631}{-72.707}
\dcgd{4.0125}{-71.4209}{4.758}{-72.1664}{4.4225}{-72.5019}{3.677}{-71.7564}
\dcgl{3.416}{-72.0173}{5.019}{-71.9055}{5.2054}{-72.0919}
\dcgai{4.757}{-72.078}{5.1514}{-72.4724}
\node[text=dcColor0, font=\fontsize{7.5}{9.75}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-45] at (4.9258,-72.2969) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="10">T</text></g>}{T}};
\dcge{8.435}{-70.907}{-71.4342}{-72.4886}{-73.0158}
\dcgf{8.6723}{-71.4342}{-72.4886}{8.1978}
\draw[dca] (7.8288,-71.4342) -- (9.0413,-72.4886) -- (9.0413,-72.7522);
\dcgai{8.5495}{-72.6099}{8.9186}{-72.7986}
\node[text=dcColor0, font=\fontsize{7.5}{9.75}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-90] at (8.6986,-72.6995) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="10">T</text></g>}{T}};
\dcgc{13.3981}{-71.2158}{13.0253}{-71.5886}{12.2798}{-72.3342}{11.907}{-72.707}
\dcgd{13.1931}{-71.7564}{12.4475}{-72.5019}{12.112}{-72.1664}{12.8576}{-71.4209}
\dcgl{12.5966}{-71.1599}{12.7085}{-72.7629}{12.5221}{-72.9493}
\dcgai{12.1415}{-72.5009}{12.5359}{-72.8953}
\node[text=dcColor0, font=\fontsize{7.5}{9.75}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-135] at (12.3171,-72.6697) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="10">T</text></g>}{T}};
\dcga{17.9244}{-71.9614}{17.3973}{16.3429}{15.8157}
\dcgb{17.3973}{-72.1986}{16.3429}{-71.7242}
\draw[dca] (17.3973,-71.3551) -- (16.3429,-72.5677) -- (16.0793,-72.5677);
\dcgai{16.0329}{-72.0759}{16.2216}{-72.4449}
\node[text=dcColor0, font=\fontsize{7.5}{9.75}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-180] at (16.132,-72.225) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="10">T</text></g>}{T}};
\dcgc{21.8331}{-72.707}{21.4604}{-72.3342}{20.7148}{-71.5886}{20.342}{-71.2158}
\dcgd{21.2926}{-72.5019}{20.5471}{-71.7564}{20.8826}{-71.4209}{21.6281}{-72.1664}
\dcgl{21.8891}{-71.9055}{20.2861}{-72.0173}{20.0997}{-71.8309}
\dcgai{20.1537}{-71.4504}{20.5481}{-71.8448}
\node[text=dcColor0, font=\fontsize{7.5}{9.75}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-225] at (20.3793,-71.6259) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="10">T</text></g>}{T}};
\dcge{25.3051}{-73.0158}{-72.4886}{-71.4342}{-70.907}
\dcgf{25.0679}{-72.4886}{-71.4342}{25.5423}
\draw[dca] (25.9114,-72.4886) -- (24.6988,-71.4342) -- (24.6988,-71.1706);
\dcgai{24.8216}{-71.1242}{25.1906}{-71.3129}
\node[text=dcColor0, font=\fontsize{7.5}{9.75}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-270] at (25.0415,-71.2233) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="10">T</text></g>}{T}};
\dcgc{28.7771}{-72.707}{29.1498}{-72.3342}{29.8954}{-71.5886}{30.2682}{-71.2158}
\dcgd{28.9821}{-72.1664}{29.7277}{-71.4209}{30.0632}{-71.7564}{29.3176}{-72.5019}
\dcgl{29.5785}{-72.7629}{29.4667}{-71.1599}{29.6531}{-70.9735}
\dcgai{29.6393}{-71.0275}{30.0336}{-71.4219}
\node[text=dcColor0, font=\fontsize{7.5}{9.75}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-315] at (29.8581,-71.2531) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="10">T</text></g>}{T}};
\dcga{-1.0544}{-75.3881}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-75.1509}{0.5272}{-75.6254}
\dcgc{0.0264}{-74.8346}{0.3427}{-74.5183}{0.29}{-74.94}{0.6063}{-74.6237}
\dcgl{0.1755}{-74.7973}{0.0264}{-74.8346}{0.0636}{-74.6855}
\dcgl{0.4391}{-74.9027}{0.29}{-74.94}{0.3272}{-74.7909}
\dcgc{3.472}{-74.6426}{3.8447}{-75.0153}{4.5903}{-75.7609}{4.9631}{-76.1337}
\dcgd{4.0125}{-74.8476}{4.758}{-75.5932}{4.4225}{-75.9287}{3.677}{-75.1831}
\dcgaa{4.6276}{-75.0153}{5.0749}{4.7394}{-75.2763}{5.1867}
\dcgp{4.7594}{-75.0944}{4.6276}{-75.0153}{-74.9363}
\dcgp{4.8712}{-75.3554}{4.7394}{-75.2763}{-75.1972}
\dcge{8.435}{-74.3337}{-74.8609}{-75.9153}{-76.4425}
\dcgf{8.6723}{-74.8609}{-75.9153}{8.1978}
\dcgc{8.9886}{-75.4145}{9.3049}{-75.7308}{8.8831}{-75.6781}{9.1995}{-75.9944}
\dcgl{9.0259}{-75.5636}{8.9886}{-75.4145}{9.1377}{-75.4518}
\dcgl{8.9204}{-75.8272}{8.8831}{-75.6781}{9.0323}{-75.7154}
\dcgc{13.3981}{-74.6426}{13.0253}{-75.0153}{12.2798}{-75.7609}{11.907}{-76.1337}
\dcgd{13.1931}{-75.1831}{12.4475}{-75.9287}{12.112}{-75.5932}{12.8576}{-74.8476}
\dcgab{13.0253}{-75.7982}{-76.2455}{12.7644}{-75.91}{-76.3574}
\dcgn{12.9463}{-75.93}{13.0253}{-75.7982}{13.1044}
\dcgn{12.6853}{-76.0418}{12.7644}{-75.91}{12.8435}
\dcga{17.9244}{-75.3881}{17.3973}{16.3429}{15.8157}
\dcgb{17.3973}{-75.6254}{16.3429}{-75.1509}
\dcgc{16.8437}{-75.9417}{16.5274}{-76.258}{16.5801}{-75.8362}{16.2638}{-76.1526}
\dcgl{16.6946}{-75.979}{16.8437}{-75.9417}{16.8064}{-76.0908}
\dcgl{16.431}{-75.8735}{16.5801}{-75.8362}{16.5428}{-75.9854}
\dcgc{21.8331}{-76.1337}{21.4604}{-75.7609}{20.7148}{-75.0153}{20.342}{-74.6426}
\dcgd{21.2926}{-75.9287}{20.5471}{-75.1831}{20.8826}{-74.8476}{21.6281}{-75.5932}
\dcgaa{20.6775}{-75.7609}{20.2302}{20.5657}{-75.5}{20.1184}
\dcgp{20.5457}{-75.6818}{20.6775}{-75.7609}{-75.84}
\dcgp{20.4339}{-75.4209}{20.5657}{-75.5}{-75.579}
\dcge{25.3051}{-76.4425}{-75.9153}{-74.8609}{-74.3337}
\dcgf{25.0679}{-75.9153}{-74.8609}{25.5423}
\dcgc{24.7516}{-75.3618}{24.4352}{-75.0455}{24.857}{-75.0982}{24.5407}{-74.7819}
\dcgl{24.7143}{-75.2127}{24.7516}{-75.3618}{24.6024}{-75.3245}
\dcgl{24.8197}{-74.9491}{24.857}{-75.0982}{24.7079}{-75.0609}
\dcgc{28.7771}{-76.1337}{29.1498}{-75.7609}{29.8954}{-75.0153}{30.2682}{-74.6426}
\dcgd{28.9821}{-75.5932}{29.7277}{-74.8476}{30.0632}{-75.1831}{29.3176}{-75.9287}
\dcgab{29.1498}{-74.9781}{-74.5307}{29.4108}{-74.8662}{-74.4189}
\dcgn{29.2289}{-74.8463}{29.1498}{-74.9781}{29.0708}
\dcgn{29.4899}{-74.7344}{29.4108}{-74.8662}{29.3317}
\dcgg{-1.0544}{-78.8149}{-0.1582}{0.1582}{1.0544}{-78.3667}{-79.263}
\dcgk{-0.5535}{-79.3948}{0.6063}{-78.2086}
\dcgl{0.4578}{-78.2485}{0.6063}{-78.2086}{0.5716}{-78.3583}
\draw[dca] (3.472,-78.0693) -- (4.1057,-78.703) (4.3294,-78.9267) -- (4.9631,-79.5604) (4.4225,-78.3862) -- (3.7888,-79.0199) (4.6462,-78.6098) -- (4.0125,-79.2436);
\dcgk{3.416}{-78.8335}{5.0749}{-78.8149}
\dcgl{4.9418}{-78.7381}{5.0749}{-78.8149}{4.9445}{-78.8962}
\dcgh{8.435}{-77.7605}{-78.6567}{-78.973}{-79.8692}{8.8831}{7.9869}
\dcgk{7.8551}{-78.2613}{9.0413}{-79.4211}
\dcgl{9.0014}{-79.2727}{9.0413}{-79.4211}{8.8916}{-79.3865}
\draw[dca] (13.3981,-78.0693) -- (12.7644,-78.703) (12.5407,-78.9267) -- (11.907,-79.5604) (13.0812,-79.0199) -- (12.4475,-78.3862) (12.8576,-79.2436) -- (12.2239,-78.6098);
\dcgk{12.6339}{-78.0134}{12.6526}{-79.6723}
\dcgl{12.7293}{-79.5391}{12.6526}{-79.6723}{12.5712}{-79.5419}
\dcgg{17.9244}{-78.8149}{17.0282}{16.7119}{15.8157}{-79.263}{-78.3667}
\dcgk{17.4236}{-78.235}{16.2638}{-79.4211}
\dcgl{16.4122}{-79.3813}{16.2638}{-79.4211}{16.2985}{-79.2714}
\draw[dca] (21.8331,-79.5604) -- (21.1994,-78.9267) (20.9758,-78.703) -- (20.342,-78.0693) (20.8826,-79.2436) -- (21.5163,-78.6098) (20.6589,-79.0199) -- (21.2926,-78.3862);
\dcgk{21.8891}{-78.7962}{20.2302}{-78.8149}
\dcgl{20.3634}{-78.8916}{20.2302}{-78.8149}{20.3606}{-78.7335}
\dcgh{25.3051}{-79.8692}{-78.973}{-78.6567}{-77.7605}{24.857}{25.7532}
\dcgk{25.885}{-79.3684}{24.6988}{-78.2086}
\dcgl{24.7387}{-78.357}{24.6988}{-78.2086}{24.8486}{-78.2433}
\draw[dca] (28.7771,-79.5604) -- (29.4108,-78.9267) (29.6345,-78.703) -- (30.2682,-78.0693) (29.0939,-78.6098) -- (29.7277,-79.2436) (29.3176,-78.3862) -- (29.9513,-79.0199);
\dcgk{29.5413}{-79.6163}{29.5226}{-77.9575}
\dcgl{29.4459}{-78.0906}{29.5226}{-77.9575}{29.604}{-78.0879}
\dcgi{-1.0544}{-82.2416}{-0.6326}{-81.7671}{-0.3163}{0}{0.3163}{0.6326}{1.0544}
\dcgk{-0.5535}{-82.8215}{0.6063}{-81.6353}
\dcgl{0.4578}{-81.6752}{0.6063}{-81.6353}{0.5716}{-81.7851}
\draw[dca] (3.472,-81.496) -- (3.7702,-81.7943) .. controls (4.1057,-81.4588) and (4.3294,-81.6824) .. (3.9938,-82.0179) .. controls (4.3294,-81.6824) and (4.553,-81.9061) .. (4.2175,-82.2416) .. controls (4.553,-81.9061) and (4.7767,-82.1298) .. (4.4412,-82.4653) .. controls (4.7767,-82.1298) and (5.0004,-82.3534) .. (4.6649,-82.6889) -- (4.9631,-82.9872);
\dcgk{3.416}{-82.2602}{5.0749}{-82.2416}
\dcgl{4.9418}{-82.1648}{5.0749}{-82.2416}{4.9445}{-82.323}
\dcgj{8.435}{-81.1872}{-81.609}{8.9095}{-81.9253}{-82.2416}{-82.5579}{-82.8742}{-83.296}
\dcgk{7.8551}{-81.688}{9.0413}{-82.8479}
\dcgl{9.0014}{-82.6994}{9.0413}{-82.8479}{8.8916}{-82.8132}
\draw[dca] (13.3981,-81.496) -- (13.0999,-81.7943) .. controls (13.4354,-82.1298) and (13.2117,-82.3534) .. (12.8762,-82.0179) .. controls (13.2117,-82.3534) and (12.9881,-82.5771) .. (12.6526,-82.2416) .. controls (12.9881,-82.5771) and (12.7644,-82.8008) .. (12.4289,-82.4653) .. controls (12.7644,-82.8008) and (12.5407,-83.0244) .. (12.2052,-82.6889) -- (11.907,-82.9872);
\dcgk{12.6339}{-81.4401}{12.6526}{-83.099}
\dcgl{12.7293}{-82.9658}{12.6526}{-83.099}{12.5712}{-82.9686}
\dcgi{17.9244}{-82.2416}{17.5027}{-82.7161}{17.1864}{16.8701}{16.5538}{16.2374}{15.8157}
\dcgk{17.4236}{-81.6617}{16.2638}{-82.8479}
\dcgl{16.4122}{-82.808}{16.2638}{-82.8479}{16.2985}{-82.6981}
\draw[dca] (21.8331,-82.9872) -- (21.5349,-82.6889) .. controls (21.1994,-83.0244) and (20.9758,-82.8008) .. (21.3113,-82.4653) .. controls (20.9758,-82.8008) and (20.7521,-82.5771) .. (21.0876,-82.2416) .. controls (20.7521,-82.5771) and (20.5284,-82.3534) .. (20.8639,-82.0179) .. controls (20.5284,-82.3534) and (20.3048,-82.1298) .. (20.6403,-81.7943) -- (20.342,-81.496);
\dcgk{21.8891}{-82.223}{20.2302}{-82.2416}
\dcgl{20.3634}{-82.3184}{20.2302}{-82.2416}{20.3606}{-82.1602}
\dcgj{25.3051}{-83.296}{-82.8742}{24.8306}{-82.5579}{-82.2416}{-81.9253}{-81.609}{-81.1872}
\dcgk{25.885}{-82.7951}{24.6988}{-81.6353}
\dcgl{24.7387}{-81.7838}{24.6988}{-81.6353}{24.8486}{-81.67}
\draw[dca] (28.7771,-82.9872) -- (29.0753,-82.6889) .. controls (28.7398,-82.3534) and (28.9635,-82.1298) .. (29.299,-82.4653) .. controls (28.9635,-82.1298) and (29.1871,-81.9061) .. (29.5226,-82.2416) .. controls (29.1871,-81.9061) and (29.4108,-81.6824) .. (29.7463,-82.0179) .. controls (29.4108,-81.6824) and (29.6345,-81.4588) .. (29.97,-81.7943) -- (30.2682,-81.496);
\dcgk{29.5413}{-83.0431}{29.5226}{-81.3842}
\dcgl{29.4459}{-81.5174}{29.5226}{-81.3842}{29.604}{-81.5146}
\dcga{-1.0544}{-85.6683}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-85.6683}{15}
\draw[dca] (-0.369,-85.6683) .. controls (-0.2636,-85.2729) and (-0.1054,-85.2729) .. (0,-85.6683) .. controls (0.1054,-86.0637) and (0.2636,-86.0637) .. (0.369,-85.6683);
\dcgai{-0.0772}{-85.8104}{0.0772}{-86.1267}
\node[dck] at (0,-85.9846) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">V</text></g>}{V}};
\dcgc{3.472}{-84.9228}{3.8447}{-85.2955}{4.5903}{-86.0411}{4.9631}{-86.4139}
\dcgq{4.2175}{-85.6683}{15}
\draw[dca] (3.9566,-85.4074) .. controls (4.3107,-85.2024) and (4.4225,-85.3142) .. (4.2175,-85.6683) .. controls (4.0125,-86.0225) and (4.1243,-86.1343) .. (4.4785,-85.9293);
\dcgai{3.8388}{-85.7142}{4.1716}{-86.0471}
\node[dcl] at (3.9938,-85.892) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">V</text></g>}{V}};
\dcge{8.435}{-84.6139}{-85.1411}{-86.1955}{-86.7227}
\dcgq{8.435}{-85.6683}{15}
\draw[dca] (8.435,-85.2993) .. controls (8.8304,-85.4047) and (8.8304,-85.5629) .. (8.435,-85.6683) .. controls (8.0396,-85.7738) and (8.0396,-85.9319) .. (8.435,-86.0374);
\dcgai{7.9766}{-85.5911}{8.2929}{-85.7456}
\node[dcm] at (8.1187,-85.6683) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">V</text></g>}{V}};
\dcgc{13.3981}{-84.9228}{13.0253}{-85.2955}{12.2798}{-86.0411}{11.907}{-86.4139}
\dcgq{12.6526}{-85.6683}{15}
\draw[dca] (12.9135,-85.4074) .. controls (13.1185,-85.7615) and (13.0067,-85.8734) .. (12.6526,-85.6683) .. controls (12.2984,-85.4633) and (12.1866,-85.5751) .. (12.3916,-85.9293);
\dcgai{12.2738}{-85.2896}{12.6067}{-85.6225}
\node[dcn] at (12.4289,-85.4447) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">V</text></g>}{V}};
\dcga{17.9244}{-85.6683}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-85.6683}{15}
\draw[dca] (17.2391,-85.6683) .. controls (17.1337,-86.0637) and (16.9755,-86.0637) .. (16.8701,-85.6683) .. controls (16.7646,-85.2729) and (16.6065,-85.2729) .. (16.501,-85.6683);
\dcgai{16.7928}{-85.2099}{16.9473}{-85.5262}
\node[dco] at (16.8701,-85.352) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">V</text></g>}{V}};
\dcgc{21.8331}{-86.4139}{21.4604}{-86.0411}{20.7148}{-85.2955}{20.342}{-84.9228}
\dcgq{21.0876}{-85.6683}{15}
\draw[dca] (21.3485,-85.9293) .. controls (20.9944,-86.1343) and (20.8826,-86.0225) .. (21.0876,-85.6683) .. controls (21.2926,-85.3142) and (21.1808,-85.2024) .. (20.8266,-85.4074);
\dcgai{21.1335}{-85.2896}{21.4663}{-85.6225}
\node[dcp] at (21.3113,-85.4447) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">V</text></g>}{V}};
\dcge{25.3051}{-86.7227}{-86.1955}{-85.1411}{-84.6139}
\dcgq{25.3051}{-85.6683}{15}
\draw[dca] (25.3051,-86.0374) .. controls (24.9097,-85.9319) and (24.9097,-85.7738) .. (25.3051,-85.6683) .. controls (25.7005,-85.5629) and (25.7005,-85.4047) .. (25.3051,-85.2993);
\dcgai{25.4472}{-85.5911}{25.7635}{-85.7456}
\node[dcq] at (25.6214,-85.6683) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">V</text></g>}{V}};
\dcgc{28.7771}{-86.4139}{29.1498}{-86.0411}{29.8954}{-85.2955}{30.2682}{-84.9228}
\dcgq{29.5226}{-85.6683}{15}
\draw[dca] (29.2617,-85.9293) .. controls (29.0566,-85.5751) and (29.1685,-85.4633) .. (29.5226,-85.6683) .. controls (29.8768,-85.8734) and (29.9886,-85.7615) .. (29.7836,-85.4074);
\dcgai{29.5685}{-85.7142}{29.9014}{-86.0471}
\node[dcr] at (29.7463,-85.892) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">V</text></g>}{V}};
\dcga{-1.0544}{-89.0951}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-89.0951}{15}
\draw[dca] (-0.369,-89.0951) .. controls (-0.2636,-88.6997) and (-0.1054,-88.6997) .. (0,-89.0951) .. controls (0.1054,-89.4905) and (0.2636,-89.4905) .. (0.369,-89.0951);
\dcgai{-0.0649}{-89.2372}{0.0649}{-89.5535}
\node[dck] at (0,-89.4114) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">I</text></g>}{I}};
\dcgc{3.472}{-88.3495}{3.8447}{-88.7223}{4.5903}{-89.4678}{4.9631}{-89.8406}
\dcgq{4.2175}{-89.0951}{15}
\draw[dca] (3.9566,-88.8341) .. controls (4.3107,-88.6291) and (4.4225,-88.7409) .. (4.2175,-89.0951) .. controls (4.0125,-89.4492) and (4.1243,-89.561) .. (4.4785,-89.356);
\dcgai{3.8475}{-89.1497}{4.1629}{-89.4651}
\node[dcl] at (3.9938,-89.3187) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">I</text></g>}{I}};
\dcge{8.435}{-88.0407}{-88.5679}{-89.6222}{-90.1494}
\dcgq{8.435}{-89.0951}{15}
\draw[dca] (8.435,-88.726) .. controls (8.8304,-88.8315) and (8.8304,-88.9896) .. (8.435,-89.0951) .. controls (8.0396,-89.2005) and (8.0396,-89.3587) .. (8.435,-89.4641);
\dcgai{7.9766}{-89.0302}{8.2929}{-89.1599}
\node[dcm] at (8.1187,-89.0951) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">I</text></g>}{I}};
\dcgc{13.3981}{-88.3495}{13.0253}{-88.7223}{12.2798}{-89.4678}{11.907}{-89.8406}
\dcgq{12.6526}{-89.0951}{15}
\draw[dca] (12.9135,-88.8341) .. controls (13.1185,-89.1883) and (13.0067,-89.3001) .. (12.6526,-89.0951) .. controls (12.2984,-88.89) and (12.1866,-89.0019) .. (12.3916,-89.356);
\dcgai{12.2825}{-88.725}{12.5979}{-89.0405}
\node[dcn] at (12.4289,-88.8714) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">I</text></g>}{I}};
\dcga{17.9244}{-89.0951}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-89.0951}{15}
\draw[dca] (17.2391,-89.0951) .. controls (17.1337,-89.4905) and (16.9755,-89.4905) .. (16.8701,-89.0951) .. controls (16.7646,-88.6997) and (16.6065,-88.6997) .. (16.501,-89.0951);
\dcgai{16.8052}{-88.6367}{16.9349}{-88.953}
\node[dco] at (16.8701,-88.7787) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">I</text></g>}{I}};
\dcgc{21.8331}{-89.8406}{21.4604}{-89.4678}{20.7148}{-88.7223}{20.342}{-88.3495}
\dcgq{21.0876}{-89.0951}{15}
\draw[dca] (21.3485,-89.356) .. controls (20.9944,-89.561) and (20.8826,-89.4492) .. (21.0876,-89.0951) .. controls (21.2926,-88.7409) and (21.1808,-88.6291) .. (20.8266,-88.8341);
\dcgai{21.1422}{-88.725}{21.4576}{-89.0405}
\node[dcp] at (21.3113,-88.8714) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">I</text></g>}{I}};
\dcge{25.3051}{-90.1494}{-89.6222}{-88.5679}{-88.0407}
\dcgq{25.3051}{-89.0951}{15}
\draw[dca] (25.3051,-89.4641) .. controls (24.9097,-89.3587) and (24.9097,-89.2005) .. (25.3051,-89.0951) .. controls (25.7005,-88.9896) and (25.7005,-88.8315) .. (25.3051,-88.726);
\dcgai{25.4472}{-89.0302}{25.7635}{-89.1599}
\node[dcq] at (25.6214,-89.0951) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">I</text></g>}{I}};
\dcgc{28.7771}{-89.8406}{29.1498}{-89.4678}{29.8954}{-88.7223}{30.2682}{-88.3495}
\dcgq{29.5226}{-89.0951}{15}
\draw[dca] (29.2617,-89.356) .. controls (29.0566,-89.0019) and (29.1685,-88.89) .. (29.5226,-89.0951) .. controls (29.8768,-89.3001) and (29.9886,-89.1883) .. (29.7836,-88.8341);
\dcgai{29.5772}{-89.1497}{29.8926}{-89.4651}
\node[dcr] at (29.7463,-89.3187) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="9">I</text></g>}{I}};
\dcga{-1.0544}{-92.5218}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-92.5218}{15}
\dcgai{-0.1713}{-92.1346}{0.1713}{-92.8727}
\node[dcc] at (0,-92.5482) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcgc{3.472}{-91.7762}{3.8447}{-92.149}{4.5903}{-92.8946}{4.9631}{-93.2674}
\dcgq{4.2175}{-92.5218}{15}
\dcgai{3.8482}{-92.1269}{4.6124}{-92.8911}
\node[dcd] at (4.1989,-92.5404) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcge{8.435}{-91.4674}{-91.9946}{-93.049}{-93.5762}
\dcgq{8.435}{-92.5218}{15}
\dcgai{8.0841}{-92.3505}{8.8222}{-92.6931}
\node[dce] at (8.4087,-92.5218) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcgc{13.3981}{-91.7762}{13.0253}{-92.149}{12.2798}{-92.8946}{11.907}{-93.2674}
\dcgq{12.6526}{-92.5218}{15}
\dcgai{12.2833}{-92.1525}{13.0475}{-92.9167}
\node[dcf] at (12.6339,-92.5032) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcga{17.9244}{-92.5218}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-92.5218}{15}
\dcgai{16.6987}{-92.1709}{17.0414}{-92.9089}
\node[dcg] at (16.8701,-92.4954) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcgc{21.8331}{-93.2674}{21.4604}{-92.8946}{20.7148}{-92.149}{20.342}{-91.7762}
\dcgq{21.0876}{-92.5218}{15}
\dcgai{20.6927}{-92.1525}{21.4569}{-92.9167}
\node[dch] at (21.1062,-92.5032) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcge{25.3051}{-93.5762}{-93.049}{-91.9946}{-91.4674}
\dcgq{25.3051}{-92.5218}{15}
\dcgai{24.918}{-92.3505}{25.656}{-92.6931}
\node[dci] at (25.3315,-92.5218) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcgc{28.7771}{-93.2674}{29.1498}{-92.8946}{29.8954}{-92.149}{30.2682}{-91.7762}
\dcgq{29.5226}{-92.5218}{15}
\dcgai{29.1277}{-92.1269}{29.8919}{-92.8911}
\node[dcj] at (29.5413,-92.5404) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">V</text></g>}{V}};
\dcga{-1.0544}{-95.9485}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-95.9485}{15}
\dcgai{-0.1442}{-95.5614}{0.1442}{-96.2994}
\node[dcc] at (0,-95.9749) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">I</text></g>}{I}};
\dcgc{3.472}{-95.203}{3.8447}{-95.5757}{4.5903}{-96.3213}{4.9631}{-96.6941}
\dcgq{4.2175}{-95.9485}{15}
\dcgai{3.8675}{-95.5728}{4.5932}{-96.2986}
\node[dcd] at (4.1989,-95.9672) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">I</text></g>}{I}};
\dcge{8.435}{-94.8941}{-95.4213}{-96.4757}{-97.0029}
\dcgq{8.435}{-95.9485}{15}
\dcgai{8.0841}{-95.8044}{8.8222}{-96.0927}
\node[dce] at (8.4087,-95.9485) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">I</text></g>}{I}};
\dcgc{13.3981}{-95.203}{13.0253}{-95.5757}{12.2798}{-96.3213}{11.907}{-96.6941}
\dcgq{12.6526}{-95.9485}{15}
\dcgai{12.3025}{-95.5985}{13.0282}{-96.3242}
\node[dcf] at (12.6339,-95.9299) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">I</text></g>}{I}};
\dcga{17.9244}{-95.9485}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-95.9485}{15}
\dcgai{16.7259}{-95.5976}{17.0142}{-96.3357}
\node[dcg] at (16.8701,-95.9222) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">I</text></g>}{I}};
\dcgc{21.8331}{-96.6941}{21.4604}{-96.3213}{20.7148}{-95.5757}{20.342}{-95.203}
\dcgq{21.0876}{-95.9485}{15}
\dcgai{20.7119}{-95.5985}{21.4377}{-96.3242}
\node[dch] at (21.1062,-95.9299) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">I</text></g>}{I}};
\dcge{25.3051}{-97.0029}{-96.4757}{-95.4213}{-94.8941}
\dcgq{25.3051}{-95.9485}{15}
\dcgai{24.918}{-95.8044}{25.656}{-96.0927}
\node[dci] at (25.3315,-95.9485) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">I</text></g>}{I}};
\dcgc{28.7771}{-96.6941}{29.1498}{-96.3213}{29.8954}{-95.5757}{30.2682}{-95.203}
\dcgq{29.5226}{-95.9485}{15}
\dcgai{29.1469}{-95.5728}{29.8727}{-96.2986}
\node[dcj] at (29.5413,-95.9672) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">I</text></g>}{I}};
\dcgal{-1.0544}{-99.3753}{-0.1054}{0.1054}{1.0544}{-98.8744}{-99.8761}{-99.1117}{-99.6389}
\draw[dca] (3.472,-98.6297) -- (4.143,-99.3007) (4.2921,-99.4498) -- (4.9631,-100.1208) (4.4971,-98.9466) -- (3.7888,-99.6548) (4.4785,-99.2634) -- (4.1057,-99.6362);
\dcgam{8.435}{-98.3209}{-99.2698}{-99.4807}{-100.4296}{8.9359}{7.9342}{8.6986}{8.1714}
\draw[dca] (13.3981,-98.6297) -- (12.7271,-99.3007) (12.578,-99.4498) -- (11.907,-100.1208) (13.0812,-99.6548) -- (12.373,-98.9466) (12.7644,-99.6362) -- (12.3916,-99.2634);
\dcgal{17.9244}{-99.3753}{16.9755}{16.7646}{15.8157}{-99.8761}{-98.8744}{-99.6389}{-99.1117}
\draw[dca] (21.8331,-100.1208) -- (21.1621,-99.4498) (21.013,-99.3007) -- (20.342,-98.6297) (20.808,-99.804) -- (21.5163,-99.0957) (20.8266,-99.4871) -- (21.1994,-99.1143);
\dcgam{25.3051}{-100.4296}{-99.4807}{-99.2698}{-98.3209}{24.8043}{25.8059}{25.0415}{25.5687}
\draw[dca] (28.7771,-100.1208) -- (29.4481,-99.4498) (29.5972,-99.3007) -- (30.2682,-98.6297) (29.0939,-99.0957) -- (29.8022,-99.804) (29.4108,-99.1143) -- (29.7836,-99.4871);
\dcgx{-0.369}{-102.433}{0.3163}{-102.802}{-103.171}
\dcga{-1.0544}{-102.802}{-0.369}{0.3163}{1.0544}
\dcgm{0.3163}{-102.433}{-103.171}
\dcgc{0.0264}{-102.2484}{0.3427}{-101.9321}{0.29}{-102.3539}{0.6063}{-102.0376}
\dcgl{0.1755}{-102.2112}{0.0264}{-102.2484}{0.0636}{-102.0993}
\dcgl{0.4391}{-102.3166}{0.29}{-102.3539}{0.3272}{-102.2048}
\dcgy{4.2175}{-102.2801}{4.4412}{-103.0257}{3.6956}{-102.802}
\dcgc{3.472}{-102.0564}{3.9566}{-102.541}{4.4412}{-103.0257}{4.9631}{-103.5476}
\dcgk{4.7021}{-102.7647}{4.1802}{-103.2866}
\dcgaa{4.6276}{-102.4292}{5.0749}{4.7394}{-102.6902}{5.1867}
\dcgp{4.7594}{-102.5083}{4.6276}{-102.4292}{-102.3501}
\dcgp{4.8712}{-102.7692}{4.7394}{-102.6902}{-102.6111}
\dcgz{8.8041}{-102.433}{8.435}{-103.1183}{8.066}
\dcge{8.435}{-101.7476}{-102.433}{-103.1183}{-103.8564}
\dcgo{8.8041}{-103.1183}{8.066}
\dcgc{8.9886}{-102.8284}{9.3049}{-103.1447}{8.8831}{-103.0919}{9.1995}{-103.4083}
\dcgl{9.0259}{-102.9775}{8.9886}{-102.8284}{9.1377}{-102.8656}
\dcgl{8.9204}{-103.2411}{8.8831}{-103.0919}{9.0323}{-103.1292}
\dcgy{13.1744}{-102.802}{12.4289}{-103.0257}{12.6526}{-102.2801}
\dcgc{13.3981}{-102.0564}{12.9135}{-102.541}{12.4289}{-103.0257}{11.907}{-103.5476}
\dcgk{12.6898}{-103.2866}{12.1679}{-102.7647}
\dcgab{13.0253}{-103.212}{-103.6594}{12.7644}{-103.3239}{-103.7712}
\dcgn{12.9463}{-103.3438}{13.0253}{-103.212}{13.1044}
\dcgn{12.6853}{-103.4557}{12.7644}{-103.3239}{12.8435}
\dcgx{17.2391}{-103.171}{16.5538}{-102.802}{-102.433}
\dcga{17.9244}{-102.802}{17.2391}{16.5538}{15.8157}
\dcgm{16.5538}{-103.171}{-102.433}
\dcgc{16.8437}{-103.3555}{16.5274}{-103.6719}{16.5801}{-103.2501}{16.2638}{-103.5664}
\dcgl{16.6946}{-103.3928}{16.8437}{-103.3555}{16.8064}{-103.5047}
\dcgl{16.431}{-103.2874}{16.5801}{-103.2501}{16.5428}{-103.3992}
\dcgy{21.0876}{-103.3239}{20.8639}{-102.5783}{21.6095}{-102.802}
\dcgc{21.8331}{-103.5476}{21.3485}{-103.0629}{20.8639}{-102.5783}{20.342}{-102.0564}
\dcgk{20.603}{-102.8393}{21.1249}{-102.3174}
\dcgaa{20.6775}{-103.1748}{20.2302}{20.5657}{-102.9138}{20.1184}
\dcgp{20.5457}{-103.0957}{20.6775}{-103.1748}{-103.2539}
\dcgp{20.4339}{-102.8347}{20.5657}{-102.9138}{-102.9929}
\dcgz{24.9361}{-103.171}{25.3051}{-102.4857}{25.6741}
\dcge{25.3051}{-103.8564}{-103.171}{-102.4857}{-101.7476}
\dcgo{24.9361}{-102.4857}{25.6741}
\dcgc{24.7516}{-102.7756}{24.4352}{-102.4593}{24.857}{-102.512}{24.5407}{-102.1957}
\dcgl{24.7143}{-102.6265}{24.7516}{-102.7756}{24.6024}{-102.7384}
\dcgl{24.8197}{-102.3629}{24.857}{-102.512}{24.7079}{-102.4748}
\dcgy{29.0007}{-102.802}{29.7463}{-102.5783}{29.5226}{-103.3239}
\dcgc{28.7771}{-103.5476}{29.2617}{-103.0629}{29.7463}{-102.5783}{30.2682}{-102.0564}
\dcgk{29.4853}{-102.3174}{30.0072}{-102.8393}
\dcgab{29.1498}{-102.3919}{-101.9446}{29.4108}{-102.2801}{-101.8328}
\dcgn{29.2289}{-102.2601}{29.1498}{-102.3919}{29.0708}
\dcgn{29.4899}{-102.1483}{29.4108}{-102.2801}{29.3317}
\dcgx{-0.369}{-105.8597}{0.3163}{-106.2287}{-106.5978}
\dcga{-1.0544}{-106.2287}{-0.369}{0.3163}{1.0544}
\dcgan{0.1582}{-105.9651}{-105.807}{0.3163}{-106.6505}{0.4745}{-106.4923}
\dcgy{4.2175}{-105.7068}{4.4412}{-106.4524}{3.6956}{-106.2287}
\dcgc{3.472}{-105.4832}{3.9566}{-105.9678}{4.4412}{-106.4524}{4.9631}{-106.9743}
\draw[dca] (4.5157,-106.1542) -- (4.6276,-106.0423) -- (4.7394,-106.1542) -- (4.143,-106.7506) -- (4.2548,-106.8625) -- (4.3666,-106.7506);
\dcgz{8.8041}{-105.8597}{8.435}{-106.545}{8.066}
\dcge{8.435}{-105.1743}{-105.8597}{-106.545}{-107.2831}
\dcgao{8.6986}{-106.3869}{8.8568}{-106.545}{8.0133}{-106.7032}{8.1714}
\dcgy{13.1744}{-106.2287}{12.4289}{-106.4524}{12.6526}{-105.7068}
\dcgc{13.3981}{-105.4832}{12.9135}{-105.9678}{12.4289}{-106.4524}{11.907}{-106.9743}
\draw[dca] (12.7271,-106.5269) -- (12.8389,-106.6388) -- (12.7271,-106.7506) -- (12.1307,-106.1542) -- (12.0188,-106.266) -- (12.1307,-106.3778);
\dcgx{17.2391}{-106.5978}{16.5538}{-106.2287}{-105.8597}
\dcga{17.9244}{-106.2287}{17.2391}{16.5538}{15.8157}
\dcgan{16.7119}{-106.4923}{-106.6505}{16.5538}{-105.807}{16.3956}{-105.9651}
\dcgy{21.0876}{-106.7506}{20.8639}{-106.0051}{21.6095}{-106.2287}
\dcgc{21.8331}{-106.9743}{21.3485}{-106.4897}{20.8639}{-106.0051}{20.342}{-105.4832}
\draw[dca] (20.7894,-106.3033) -- (20.6775,-106.4151) -- (20.5657,-106.3033) -- (21.1621,-105.7068) -- (21.0503,-105.595) -- (20.9385,-105.7068);
\dcgz{24.9361}{-106.5978}{25.3051}{-105.9124}{25.6741}
\dcge{25.3051}{-107.2831}{-106.5978}{-105.9124}{-105.1743}
\dcgao{25.0415}{-106.0706}{24.8834}{-105.9124}{25.7269}{-105.7543}{25.5687}
\dcgy{29.0007}{-106.2287}{29.7463}{-106.0051}{29.5226}{-106.7506}
\dcgc{28.7771}{-106.9743}{29.2617}{-106.4897}{29.7463}{-106.0051}{30.2682}{-105.4832}
\draw[dca] (29.4481,-105.9305) -- (29.3362,-105.8187) -- (29.4481,-105.7068) -- (30.0445,-106.3033) -- (30.1563,-106.1914) -- (30.0445,-106.0796);
\dcgx{-0.369}{-109.2864}{0.3163}{-109.6555}{-110.0245}
\dcgap{-1.0544}{-109.6555}{-0.369}{0.4745}{1.0544}{0.3163}{-109.2864}{-110.0245}
\dcgy{4.2175}{-109.1336}{4.4412}{-109.8791}{3.6956}{-109.6555}
\draw[dca] (3.472,-108.9099) -- (3.9566,-109.3945) (4.553,-109.991) -- (4.9631,-110.401) (4.7021,-109.6182) -- (4.1802,-110.1401) (4.814,-109.73) -- (4.2921,-110.2519);
\dcgz{8.8041}{-109.2864}{8.435}{-109.9718}{8.066}
\dcgaq{8.435}{-108.6011}{-109.2864}{-110.1299}{-110.7098}{8.8041}{-109.9718}{8.066}
\dcgy{13.1744}{-109.6555}{12.4289}{-109.8791}{12.6526}{-109.1336}
\draw[dca] (13.3981,-108.9099) -- (12.9135,-109.3945) (12.3171,-109.991) -- (11.907,-110.401) (12.6898,-110.1401) -- (12.1679,-109.6182) (12.578,-110.2519) -- (12.0561,-109.73);
\dcgx{17.2391}{-110.0245}{16.5538}{-109.6555}{-109.2864}
\dcgap{17.9244}{-109.6555}{17.2391}{16.3956}{15.8157}{16.5538}{-110.0245}{-109.2864}
\dcgy{21.0876}{-110.1773}{20.8639}{-109.4318}{21.6095}{-109.6555}
\draw[dca] (21.8331,-110.401) -- (21.3485,-109.9164) (20.7521,-109.32) -- (20.342,-108.9099) (20.603,-109.6927) -- (21.1249,-109.1708) (20.4911,-109.5809) -- (21.013,-109.059);
\dcgz{24.9361}{-110.0245}{25.3051}{-109.3391}{25.6741}
\dcgaq{25.3051}{-110.7098}{-110.0245}{-109.181}{-108.6011}{24.9361}{-109.3391}{25.6741}
\dcgy{29.0007}{-109.6555}{29.7463}{-109.4318}{29.5226}{-110.1773}
\draw[dca] (28.7771,-110.401) -- (29.2617,-109.9164) (29.8581,-109.32) -- (30.2682,-108.9099) (29.4853,-109.1708) -- (30.0072,-109.6927) (29.5972,-109.059) -- (30.1191,-109.5809);
\draw[dca] (-1.0544,-113.0822) -- (-0.3163,-113.0822) (-0.3163,-112.6077) -- (-0.3163,-113.5567) (-0.3163,-112.8186) -- (0.5272,-112.2914) -- (0.5272,-112.0278) (-0.3163,-113.3458) -- (0.5272,-113.873) -- (0.5272,-114.1366);
\dcgl{0.3782}{-113.686}{0.4481}{-113.8229}{0.2944}{-113.8201}
\draw[dca] (3.472,-112.3366) -- (3.9938,-112.8585) (4.3294,-112.523) -- (3.6583,-113.194) (4.1802,-112.6721) -- (5.1495,-112.8958) -- (5.3359,-112.7094) (3.8075,-113.0449) -- (4.0311,-114.0141) -- (3.8447,-114.2005);
\dcgl{4.058}{-113.7766}{4.0106}{-113.9228}{3.9039}{-113.8122}
\draw[dca] (8.435,-112.0278) -- (8.435,-112.7659) (8.9095,-112.7659) -- (7.9606,-112.7659) (8.6986,-112.7659) -- (9.2258,-113.6094) -- (9.4894,-113.6094) (8.1714,-112.7659) -- (7.6443,-113.6094) -- (7.3807,-113.6094);
\dcgl{7.8312}{-113.4604}{7.6943}{-113.5303}{7.6971}{-113.3766}
\draw[dca] (13.3981,-112.3366) -- (12.8762,-112.8585) (13.2117,-113.194) -- (12.5407,-112.523) (13.0626,-113.0449) -- (12.8389,-114.0141) -- (13.0253,-114.2005) (12.6898,-112.6721) -- (11.7206,-112.8958) -- (11.5342,-112.7094);
\dcgl{11.9581}{-112.9227}{11.8119}{-112.8753}{11.9226}{-112.7686}
\draw[dca] (17.9244,-113.0822) -- (17.1864,-113.0822) (17.1864,-113.5567) -- (17.1864,-112.6077) (17.1864,-113.3458) -- (16.3429,-113.873) -- (16.3429,-114.1366) (17.1864,-112.8186) -- (16.3429,-112.2914) -- (16.3429,-112.0278);
\dcgl{16.4918}{-112.4784}{16.422}{-112.3415}{16.5756}{-112.3443}
\draw[dca] (21.8331,-113.8278) -- (21.3113,-113.3059) (20.9758,-113.6414) -- (21.6468,-112.9704) (21.1249,-113.4922) -- (20.1556,-113.2686) -- (19.9692,-113.455) (21.4976,-113.1195) -- (21.274,-112.1502) -- (21.4604,-111.9639);
\dcgl{21.2471}{-112.3878}{21.2945}{-112.2416}{21.4012}{-112.3522}
\draw[dca] (25.3051,-114.1366) -- (25.3051,-113.3985) (24.8306,-113.3985) -- (25.7796,-113.3985) (25.0415,-113.3985) -- (24.5143,-112.555) -- (24.2507,-112.555) (25.5687,-113.3985) -- (26.0959,-112.555) -- (26.3595,-112.555);
\dcgl{25.9089}{-112.7039}{26.0458}{-112.6341}{26.043}{-112.7878}
\draw[dca] (28.7771,-113.8278) -- (29.299,-113.3059) (28.9635,-112.9704) -- (29.6345,-113.6414) (29.1126,-113.1195) -- (29.3362,-112.1502) -- (29.1498,-111.9639) (29.4853,-113.4922) -- (30.4546,-113.2686) -- (30.641,-113.455);
\dcgl{30.217}{-113.2417}{30.3632}{-113.2891}{30.2526}{-113.3958}
\draw[dca] (-1.0544,-116.5089) -- (-0.3163,-116.5089) (-0.3163,-116.0345) -- (-0.3163,-116.9834) (-0.3163,-116.2453) -- (0.5272,-115.7181) -- (0.5272,-115.4545) (-0.3163,-116.7725) -- (0.5272,-117.2997) -- (0.5272,-117.5633);
\dcgl{0.0699}{-117.1071}{0}{-116.9702}{0.1537}{-116.973}
\draw[dca] (3.472,-115.7634) -- (3.9938,-116.2853) (4.3294,-115.9498) -- (3.6583,-116.6208) (4.1802,-116.0989) -- (5.1495,-116.3225) -- (5.3359,-116.1361) (3.8075,-116.4716) -- (4.0311,-117.4409) -- (3.8447,-117.6273);
\dcgl{3.8439}{-116.9813}{3.8913}{-116.8351}{3.998}{-116.9457}
\draw[dca] (8.435,-115.4545) -- (8.435,-116.1926) (8.9095,-116.1926) -- (7.9606,-116.1926) (8.6986,-116.1926) -- (9.2258,-117.0361) -- (9.4894,-117.0361) (8.1714,-116.1926) -- (7.6443,-117.0361) -- (7.3807,-117.0361);
\dcgl{7.8368}{-116.5788}{7.9737}{-116.5089}{7.971}{-116.6626}
\draw[dca] (13.3981,-115.7634) -- (12.8762,-116.2853) (13.2117,-116.6208) -- (12.5407,-115.9498) (13.0626,-116.4716) -- (12.8389,-117.4409) -- (13.0253,-117.6273) (12.6898,-116.0989) -- (11.7206,-116.3225) -- (11.5342,-116.1361);
\dcgl{12.1802}{-116.1353}{12.3264}{-116.1827}{12.2157}{-116.2894}
\draw[dca] (17.9244,-116.5089) -- (17.1864,-116.5089) (17.1864,-116.9834) -- (17.1864,-116.0345) (17.1864,-116.7725) -- (16.3429,-117.2997) -- (16.3429,-117.5633) (17.1864,-116.2453) -- (16.3429,-115.7181) -- (16.3429,-115.4545);
\dcgl{16.8002}{-115.9107}{16.8701}{-116.0476}{16.7164}{-116.0449}
\draw[dca] (21.8331,-117.2545) -- (21.3113,-116.7326) (20.9758,-117.0681) -- (21.6468,-116.3971) (21.1249,-116.919) -- (20.1556,-116.6953) -- (19.9692,-116.8817) (21.4976,-116.5462) -- (21.274,-115.577) -- (21.4604,-115.3906);
\dcgl{21.4612}{-116.0365}{21.4138}{-116.1827}{21.3071}{-116.0721}
\draw[dca] (25.3051,-117.5633) -- (25.3051,-116.8252) (24.8306,-116.8252) -- (25.7796,-116.8252) (25.0415,-116.8252) -- (24.5143,-115.9817) -- (24.2507,-115.9817) (25.5687,-116.8252) -- (26.0959,-115.9817) -- (26.3595,-115.9817);
\dcgl{25.9033}{-116.4391}{25.7664}{-116.5089}{25.7692}{-116.3552}
\draw[dca] (28.7771,-117.2545) -- (29.299,-116.7326) (28.9635,-116.3971) -- (29.6345,-117.0681) (29.1126,-116.5462) -- (29.3362,-115.577) -- (29.1498,-115.3906) (29.4853,-116.919) -- (30.4546,-116.6953) -- (30.641,-116.8817);
\dcgl{29.995}{-116.8825}{29.8488}{-116.8351}{29.9594}{-116.7284}
\draw[dca] (-1.0544,-119.9357) -- (-0.4218,-119.9357) (-0.1582,-119.4085) -- (-0.1582,-120.4628) (-0.1582,-119.5666) -- (0.5272,-119.5666) -- (0.5272,-118.8813) (-0.1582,-120.3047) -- (0.5272,-120.3047) -- (0.5272,-120.99);
\dcgm{-0.4218}{-119.4612}{-120.4101}
\dcgo{-0.1582}{-119.9357}{0.2372}
\dcgp{0}{-120.0147}{-0.1318}{-119.9357}{-119.8566}
\draw[dca] (3.472,-119.1901) -- (3.9193,-119.6374) (4.4785,-119.451) -- (3.7329,-120.1966) (4.3666,-119.5629) -- (4.8512,-120.0475) -- (5.3359,-119.5629) (3.8447,-120.0848) -- (4.3294,-120.5694) -- (3.8447,-121.054);
\dcgk{4.2548}{-119.3019}{3.5838}{-119.9729}
\dcgk{4.1057}{-119.8238}{4.3853}{-120.1034}
\dcgl{4.1616}{-119.9916}{4.1243}{-119.8425}{4.2734}{-119.8797}
\draw[dca] (8.435,-118.8813) -- (8.435,-119.5139) (8.9622,-119.7775) -- (7.9078,-119.7775) (8.8041,-119.7775) -- (8.8041,-120.4628) -- (9.4894,-120.4628) (8.066,-119.7775) -- (8.066,-120.4628) -- (7.3807,-120.4628);
\dcgo{8.9095}{-119.5139}{7.9606}
\dcgm{8.435}{-119.7775}{-120.1729}
\dcgn{8.356}{-119.9357}{8.435}{-119.8039}{8.5141}
\draw[dca] (13.3981,-119.1901) -- (12.9508,-119.6374) (13.1372,-120.1966) -- (12.3916,-119.451) (13.0253,-120.0848) -- (12.5407,-120.5694) -- (13.0253,-121.054) (12.5034,-119.5629) -- (12.0188,-120.0475) -- (11.5342,-119.5629);
\dcgk{13.2863}{-119.9729}{12.6153}{-119.3019}
\dcgk{12.7644}{-119.8238}{12.4848}{-120.1034}
\dcgl{12.5966}{-119.8797}{12.7457}{-119.8425}{12.7085}{-119.9916}
\draw[dca] (17.9244,-119.9357) -- (17.2918,-119.9357) (17.0282,-120.4628) -- (17.0282,-119.4085) (17.0282,-120.3047) -- (16.3429,-120.3047) -- (16.3429,-120.99) (17.0282,-119.5666) -- (16.3429,-119.5666) -- (16.3429,-118.8813);
\dcgm{17.2918}{-120.4101}{-119.4612}
\dcgo{17.0282}{-119.9357}{16.6328}
\dcgp{16.8701}{-119.8566}{17.0019}{-119.9357}{-120.0147}
\draw[dca] (21.8331,-120.6812) -- (21.3858,-120.2339) (20.8266,-120.4203) -- (21.5722,-119.6747) (20.9385,-120.3084) -- (20.4539,-119.8238) -- (19.9692,-120.3084) (21.4604,-119.7865) -- (20.9758,-119.3019) -- (21.4604,-118.8173);
\dcgk{21.0503}{-120.5694}{21.7213}{-119.8984}
\dcgk{21.1994}{-120.0475}{20.9198}{-119.7679}
\dcgl{21.1435}{-119.8797}{21.1808}{-120.0289}{21.0317}{-119.9916}
\draw[dca] (25.3051,-120.99) -- (25.3051,-120.3574) (24.7779,-120.0938) -- (25.8323,-120.0938) (24.9361,-120.0938) -- (24.9361,-119.4085) -- (24.2507,-119.4085) (25.6741,-120.0938) -- (25.6741,-119.4085) -- (26.3595,-119.4085);
\dcgo{24.8306}{-120.3574}{25.7796}
\dcgm{25.3051}{-120.0938}{-119.6984}
\dcgn{25.3842}{-119.9357}{25.3051}{-120.0675}{25.226}
\draw[dca] (28.7771,-120.6812) -- (29.2244,-120.2339) (29.038,-119.6747) -- (29.7836,-120.4203) (29.1498,-119.7865) -- (29.6345,-119.3019) -- (29.1498,-118.8173) (29.6717,-120.3084) -- (30.1563,-119.8238) -- (30.641,-120.3084);
\dcgk{28.8889}{-119.8984}{29.5599}{-120.5694}
\dcgk{29.4108}{-120.0475}{29.6904}{-119.7679}
\dcgl{29.5785}{-119.9916}{29.4294}{-120.0289}{29.4667}{-119.8797}
\draw[dca] (-1.0544,-123.3624) -- (-0.4218,-123.3624) (-0.1582,-122.8352) -- (-0.1582,-123.8896) (-0.1582,-122.9934) -- (0.5272,-122.9934) -- (0.5272,-122.308) (-0.1582,-123.7314) -- (0.5272,-123.7314) -- (0.5272,-124.4168);
\dcgm{-0.4218}{-122.8879}{-123.8369}
\dcgo{-0.1582}{-123.3624}{0.2372}
\dcgp{0.0791}{-123.2833}{0.2109}{-123.3624}{-123.4415}
\dcgq{-0.5799}{-123.3624}{2.25}
\draw[dca] (3.472,-122.6168) -- (3.9193,-123.0642) (4.4785,-122.8778) -- (3.7329,-123.6233) (4.3666,-122.9896) -- (4.8512,-123.4742) -- (5.3359,-122.9896) (3.8447,-123.5115) -- (4.3294,-123.9961) -- (3.8447,-124.4807);
\dcgk{4.2548}{-122.7287}{3.5838}{-123.3997}
\dcgk{4.1057}{-123.2506}{4.3853}{-123.5301}
\dcgl{4.3294}{-123.3624}{4.3666}{-123.5115}{4.2175}{-123.4742}
\dcgq{3.8075}{-122.9523}{2.25}
\draw[dca] (8.435,-122.308) -- (8.435,-122.9406) (8.9622,-123.2042) -- (7.9078,-123.2042) (8.8041,-123.2042) -- (8.8041,-123.8896) -- (9.4894,-123.8896) (8.066,-123.2042) -- (8.066,-123.8896) -- (7.3807,-123.8896);
\dcgo{8.9095}{-122.9406}{7.9606}
\dcgm{8.435}{-123.2042}{-123.5996}
\dcgn{8.5141}{-123.4415}{8.435}{-123.5733}{8.356}
\dcgq{8.435}{-122.7825}{2.25}
\draw[dca] (13.3981,-122.6168) -- (12.9508,-123.0642) (13.1372,-123.6233) -- (12.3916,-122.8778) (13.0253,-123.5115) -- (12.5407,-123.9961) -- (13.0253,-124.4807) (12.5034,-122.9896) -- (12.0188,-123.4742) -- (11.5342,-122.9896);
\dcgk{13.2863}{-123.3997}{12.6153}{-122.7287}
\dcgk{12.7644}{-123.2506}{12.4848}{-123.5301}
\dcgl{12.6526}{-123.4742}{12.5034}{-123.5115}{12.5407}{-123.3624}
\dcgq{13.0626}{-122.9523}{2.25}
\draw[dca] (17.9244,-123.3624) -- (17.2918,-123.3624) (17.0282,-123.8896) -- (17.0282,-122.8352) (17.0282,-123.7314) -- (16.3429,-123.7314) -- (16.3429,-124.4168) (17.0282,-122.9934) -- (16.3429,-122.9934) -- (16.3429,-122.308);
\dcgm{17.2918}{-123.8369}{-122.8879}
\dcgo{17.0282}{-123.3624}{16.6328}
\dcgp{16.791}{-123.4415}{16.6592}{-123.3624}{-123.2833}
\dcgq{17.45}{-123.3624}{2.25}
\draw[dca] (21.8331,-124.1079) -- (21.3858,-123.6606) (20.8266,-123.847) -- (21.5722,-123.1014) (20.9385,-123.7352) -- (20.4539,-123.2506) -- (19.9692,-123.7352) (21.4604,-123.2133) -- (20.9758,-122.7287) -- (21.4604,-122.2441);
\dcgk{21.0503}{-123.9961}{21.7213}{-123.3251}
\dcgk{21.1994}{-123.4742}{20.9198}{-123.1946}
\dcgl{20.9758}{-123.3624}{20.9385}{-123.2133}{21.0876}{-123.2506}
\dcgq{21.4976}{-123.7724}{2.25}
\draw[dca] (25.3051,-124.4168) -- (25.3051,-123.7841) (24.7779,-123.5205) -- (25.8323,-123.5205) (24.9361,-123.5205) -- (24.9361,-122.8352) -- (24.2507,-122.8352) (25.6741,-123.5205) -- (25.6741,-122.8352) -- (26.3595,-122.8352);
\dcgo{24.8306}{-123.7841}{25.7796}
\dcgm{25.3051}{-123.5205}{-123.1252}
\dcgn{25.226}{-123.2833}{25.3051}{-123.1515}{25.3842}
\dcgq{25.3051}{-123.9423}{2.25}
\draw[dca] (28.7771,-124.1079) -- (29.2244,-123.6606) (29.038,-123.1014) -- (29.7836,-123.847) (29.1498,-123.2133) -- (29.6345,-122.7287) -- (29.1498,-122.2441) (29.6717,-123.7352) -- (30.1563,-123.2506) -- (30.641,-123.7352);
\dcgk{28.8889}{-123.3251}{29.5599}{-123.9961}
\dcgk{29.4108}{-123.4742}{29.6904}{-123.1946}
\dcgl{29.5226}{-123.2506}{29.6717}{-123.2133}{29.6345}{-123.3624}
\dcgq{29.1126}{-123.7724}{2.25}
\draw[dca] (-1.0544,-126.7891) -- (-0.1582,-126.7891) (-0.1582,-126.2619) -- (-0.1582,-127.3163) (-0.1582,-126.4201) -- (0.5272,-126.4201) -- (0.5272,-125.7347) (-0.1582,-127.1582) -- (0.5272,-127.1582) -- (0.5272,-127.8435);
\dcgp{-0.3163}{-126.71}{-0.1845}{-126.7891}{-126.8682}
\draw[dca] (3.472,-126.0436) -- (4.1057,-126.6773) (4.4785,-126.3045) -- (3.7329,-127.0501) (4.3666,-126.4163) -- (4.8512,-126.901) -- (5.3359,-126.4163) (3.8447,-126.9382) -- (4.3294,-127.4228) -- (3.8447,-127.9075);
\dcgl{4.0498}{-126.5095}{4.087}{-126.6587}{3.9379}{-126.6214}
\draw[dca] (8.435,-125.7347) -- (8.435,-126.631) (8.9622,-126.631) -- (7.9078,-126.631) (8.8041,-126.631) -- (8.8041,-127.3163) -- (9.4894,-127.3163) (8.066,-126.631) -- (8.066,-127.3163) -- (7.3807,-127.3163);
\dcgn{8.5141}{-126.4728}{8.435}{-126.6046}{8.356}
\draw[dca] (13.3981,-126.0436) -- (12.7644,-126.6773) (13.1372,-127.0501) -- (12.3916,-126.3045) (13.0253,-126.9382) -- (12.5407,-127.4228) -- (13.0253,-127.9075) (12.5034,-126.4163) -- (12.0188,-126.901) -- (11.5342,-126.4163);
\dcgl{12.9321}{-126.6214}{12.783}{-126.6587}{12.8203}{-126.5095}
\draw[dca] (17.9244,-126.7891) -- (17.0282,-126.7891) (17.0282,-127.3163) -- (17.0282,-126.2619) (17.0282,-127.1582) -- (16.3429,-127.1582) -- (16.3429,-127.8435) (17.0282,-126.4201) -- (16.3429,-126.4201) -- (16.3429,-125.7347);
\dcgp{17.1864}{-126.8682}{17.0546}{-126.7891}{-126.71}
\draw[dca] (21.8331,-127.5347) -- (21.1994,-126.901) (20.8266,-127.2737) -- (21.5722,-126.5282) (20.9385,-127.1619) -- (20.4539,-126.6773) -- (19.9692,-127.1619) (21.4604,-126.64) -- (20.9758,-126.1554) -- (21.4604,-125.6708);
\dcgl{21.2553}{-127.0687}{21.2181}{-126.9196}{21.3672}{-126.9569}
\draw[dca] (25.3051,-127.8435) -- (25.3051,-126.9473) (24.7779,-126.9473) -- (25.8323,-126.9473) (24.9361,-126.9473) -- (24.9361,-126.2619) -- (24.2507,-126.2619) (25.6741,-126.9473) -- (25.6741,-126.2619) -- (26.3595,-126.2619);
\dcgn{25.226}{-127.1054}{25.3051}{-126.9736}{25.3842}
\draw[dca] (28.7771,-127.5347) -- (29.4108,-126.901) (29.038,-126.5282) -- (29.7836,-127.2737) (29.1498,-126.64) -- (29.6345,-126.1554) -- (29.1498,-125.6708) (29.6717,-127.1619) -- (30.1563,-126.6773) -- (30.641,-127.1619);
\dcgl{29.243}{-126.9569}{29.3922}{-126.9196}{29.3549}{-127.0687}
\draw[dca] (-1.0544,-130.2159) -- (-0.1582,-130.2159) (-0.1582,-129.6887) -- (-0.1582,-130.743) (-0.1582,-129.8468) -- (0.5272,-129.8468) -- (0.5272,-129.1615) (-0.1582,-130.5849) -- (0.5272,-130.5849) -- (0.5272,-131.2702);
\dcgp{-0.3427}{-130.2949}{-0.4745}{-130.2159}{-130.1368}
\draw[dca] (3.472,-129.4703) -- (4.1057,-130.104) (4.4785,-129.7312) -- (3.7329,-130.4768) (4.3666,-129.8431) -- (4.8512,-130.3277) -- (5.3359,-129.8431) (3.8447,-130.365) -- (4.3294,-130.8496) -- (3.8447,-131.3342);
\dcgl{3.9193}{-130.0295}{3.882}{-129.8804}{4.0311}{-129.9176}
\draw[dca] (8.435,-129.1615) -- (8.435,-130.0577) (8.9622,-130.0577) -- (7.9078,-130.0577) (8.8041,-130.0577) -- (8.8041,-130.743) -- (9.4894,-130.743) (8.066,-130.0577) -- (8.066,-130.743) -- (7.3807,-130.743);
\dcgn{8.356}{-129.8732}{8.435}{-129.7414}{8.5141}
\draw[dca] (13.3981,-129.4703) -- (12.7644,-130.104) (13.1372,-130.4768) -- (12.3916,-129.7312) (13.0253,-130.365) -- (12.5407,-130.8496) -- (13.0253,-131.3342) (12.5034,-129.8431) -- (12.0188,-130.3277) -- (11.5342,-129.8431);
\dcgl{12.8389}{-129.9176}{12.9881}{-129.8804}{12.9508}{-130.0295}
\draw[dca] (17.9244,-130.2159) -- (17.0282,-130.2159) (17.0282,-130.743) -- (17.0282,-129.6887) (17.0282,-130.5849) -- (16.3429,-130.5849) -- (16.3429,-131.2702) (17.0282,-129.8468) -- (16.3429,-129.8468) -- (16.3429,-129.1615);
\dcgp{17.2127}{-130.1368}{17.3445}{-130.2159}{-130.2949}
\draw[dca] (21.8331,-130.9614) -- (21.1994,-130.3277) (20.8266,-130.7005) -- (21.5722,-129.9549) (20.9385,-130.5886) -- (20.4539,-130.104) -- (19.9692,-130.5886) (21.4604,-130.0667) -- (20.9758,-129.5821) -- (21.4604,-129.0975);
\dcgl{21.3858}{-130.4022}{21.4231}{-130.5514}{21.274}{-130.5141}
\draw[dca] (25.3051,-131.2702) -- (25.3051,-130.374) (24.7779,-130.374) -- (25.8323,-130.374) (24.9361,-130.374) -- (24.9361,-129.6887) -- (24.2507,-129.6887) (25.6741,-130.374) -- (25.6741,-129.6887) -- (26.3595,-129.6887);
\dcgn{25.3842}{-130.5585}{25.3051}{-130.6903}{25.226}
\draw[dca] (28.7771,-130.9614) -- (29.4108,-130.3277) (29.038,-129.9549) -- (29.7836,-130.7005) (29.1498,-130.0667) -- (29.6345,-129.5821) -- (29.1498,-129.0975) (29.6717,-130.5886) -- (30.1563,-130.104) -- (30.641,-130.5886);
\dcgl{29.3362}{-130.5141}{29.1871}{-130.5514}{29.2244}{-130.4022}
\dcgar{-1.0544}{-133.6426}{-0.4481}{0.4481}{-133.1154}{1.0544}{-134.1698}{-0.3954}{0.369}
\dcgq{-0.4218}{-133.6426}{1.875}
\dcgq{0.4218}{-133.1154}{1.875}
\dcgq{0.4218}{-134.1698}{1.875}
\draw[dca] (3.472,-132.897) -- (3.9007,-133.3257) (4.9072,-133.5867) -- (5.3359,-134.0154) (4.1616,-134.3322) -- (4.5903,-134.7609) (3.9379,-133.363) -- (4.8512,-133.5308);
\dcgq{3.9193}{-133.3444}{1.875}
\dcgq{4.8885}{-133.568}{1.875}
\dcgq{4.143}{-134.3136}{1.875}
\dcgas{8.435}{-132.5882}{-133.1945}{8.9622}{-134.0907}{-134.697}{7.9078}{-133.2472}{-134.0116}
\dcgq{8.435}{-133.2208}{1.875}
\dcgq{8.9622}{-134.0643}{1.875}
\dcgq{7.9078}{-134.0643}{1.875}
\draw[dca] (13.3981,-132.897) -- (12.9694,-133.3257) (12.7085,-134.3322) -- (12.2798,-134.7609) (11.9629,-133.5867) -- (11.5342,-134.0154) (12.9321,-133.363) -- (12.7644,-134.2763);
\dcgq{12.9508}{-133.3444}{1.875}
\dcgq{12.7271}{-134.3136}{1.875}
\dcgq{11.9815}{-133.568}{1.875}
\dcgar{17.9244}{-133.6426}{17.3182}{16.422}{-134.1698}{15.8157}{-133.1154}{17.2655}{16.501}
\dcgq{17.2918}{-133.6426}{1.875}
\dcgq{16.4483}{-134.1698}{1.875}
\dcgq{16.4483}{-133.1154}{1.875}
\draw[dca] (21.8331,-134.3881) -- (21.4045,-133.9595) (20.3979,-133.6985) -- (19.9692,-133.2698) (21.1435,-132.9529) -- (20.7148,-132.5243) (21.3672,-133.9222) -- (20.4539,-133.7544);
\dcgq{21.3858}{-133.9408}{1.875}
\dcgq{20.4166}{-133.7171}{1.875}
\dcgq{21.1621}{-132.9716}{1.875}
\dcgas{25.3051}{-134.697}{-134.0907}{24.7779}{-133.1945}{-132.5882}{25.8323}{-134.038}{-133.2736}
\dcgq{25.3051}{-134.0643}{1.875}
\dcgq{24.7779}{-133.2208}{1.875}
\dcgq{25.8323}{-133.2208}{1.875}
\draw[dca] (28.7771,-134.3881) -- (29.2058,-133.9595) (29.4667,-132.9529) -- (29.8954,-132.5243) (30.2123,-133.6985) -- (30.641,-133.2698) (29.243,-133.9222) -- (29.4108,-133.0089);
\dcgq{29.2244}{-133.9408}{1.875}
\dcgq{29.4481}{-132.9716}{1.875}
\dcgq{30.1936}{-133.7171}{1.875}
\dcgae{-1.0544}{-137.0693}{-0.4481}{0.4481}{1.0544}{-0.3954}{0.3427}{-136.5685}
\dcgq{-0.4218}{-137.0693}{1.875}
\dcgq{0.4218}{-137.0693}{1.875}
\dcgat{0}{-136.3313}{-136.8057}{-0.2109}{0.2109}
\draw[dca] (3.472,-136.3238) -- (3.9007,-136.7525) (4.5344,-137.3862) -- (4.9631,-137.8149) (3.9379,-136.7897) -- (4.814,-136.9575);
\dcgq{3.9193}{-136.7711}{1.875}
\dcgq{4.5157}{-137.3675}{1.875}
\dcgc{4.7394}{-136.5474}{4.4039}{-136.8829}{4.5903}{-136.3983}{4.8885}{-136.6965}
\dcgaf{8.435}{-136.0149}{-136.6212}{-137.5174}{-138.1237}{-136.6739}{8.9359}{-137.412}
\dcgq{8.435}{-136.6476}{1.875}
\dcgq{8.435}{-137.4911}{1.875}
\dcgau{9.1731}{-137.0693}{8.6986}{-136.8584}{-137.2802}
\draw[dca] (13.3981,-136.3238) -- (12.9694,-136.7525) (12.3357,-137.3862) -- (11.907,-137.8149) (12.9321,-136.7897) -- (12.7644,-137.6658);
\dcgq{12.9508}{-136.7711}{1.875}
\dcgq{12.3543}{-137.3675}{1.875}
\dcgc{13.1744}{-137.5912}{12.8389}{-137.2557}{13.3236}{-137.4421}{13.0253}{-137.7403}
\dcgae{17.9244}{-137.0693}{17.3182}{16.422}{15.8157}{17.2655}{16.5274}{-137.5702}
\dcgq{17.2918}{-137.0693}{1.875}
\dcgq{16.4483}{-137.0693}{1.875}
\dcgat{16.8701}{-137.8074}{-137.3329}{17.0809}{16.6592}
\draw[dca] (21.8331,-137.8149) -- (21.4045,-137.3862) (20.7707,-136.7525) -- (20.342,-136.3238) (21.3672,-137.3489) -- (20.4911,-137.1812);
\dcgq{21.3858}{-137.3675}{1.875}
\dcgq{20.7894}{-136.7711}{1.875}
\dcgc{20.5657}{-137.5912}{20.9012}{-137.2557}{20.7148}{-137.7403}{20.4166}{-137.4421}
\dcgaf{25.3051}{-138.1237}{-137.5174}{-136.6212}{-136.0149}{-137.4647}{24.8043}{-136.7267}
\dcgq{25.3051}{-137.4911}{1.875}
\dcgq{25.3051}{-136.6476}{1.875}
\dcgau{24.567}{-137.0693}{25.0415}{-137.2802}{-136.8584}
\draw[dca] (28.7771,-137.8149) -- (29.2058,-137.3862) (29.8395,-136.7525) -- (30.2682,-136.3238) (29.243,-137.3489) -- (29.4108,-136.4729);
\dcgq{29.2244}{-137.3675}{1.875}
\dcgq{29.8208}{-136.7711}{1.875}
\dcgc{29.0007}{-136.5474}{29.3362}{-136.8829}{28.8516}{-136.6965}{29.1498}{-136.3983}
\dcgag{-1.0544}{-140.4961}{-0.4481}{0.4481}{1.0544}{-0.3954}{0.3427}
\dcgq{-0.4218}{-140.4961}{1.875}
\dcgq{0.4218}{-140.4961}{1.875}
\dcgat{0}{-139.758}{-140.2325}{-0.2109}{0.2109}
\draw[dca] (3.472,-139.7505) -- (3.9007,-140.1792) (4.5344,-140.8129) -- (4.9631,-141.2416) (3.9379,-140.2165) -- (4.4598,-140.7384);
\dcgq{3.9193}{-140.1978}{1.875}
\dcgq{4.5157}{-140.7943}{1.875}
\dcgc{4.7394}{-139.9742}{4.4039}{-140.3097}{4.5903}{-139.8251}{4.8885}{-140.1233}
\dcgah{8.435}{-139.4417}{-140.0479}{-140.9442}{-141.5504}{-140.1007}{-140.8387}
\dcgq{8.435}{-140.0743}{1.875}
\dcgq{8.435}{-140.9178}{1.875}
\dcgau{9.1731}{-140.4961}{8.6986}{-140.2852}{-140.7069}
\draw[dca] (13.3981,-139.7505) -- (12.9694,-140.1792) (12.3357,-140.8129) -- (11.907,-141.2416) (12.9321,-140.2165) -- (12.4102,-140.7384);
\dcgq{12.9508}{-140.1978}{1.875}
\dcgq{12.3543}{-140.7943}{1.875}
\dcgc{13.1744}{-141.0179}{12.8389}{-140.6824}{13.3236}{-140.8688}{13.0253}{-141.1671}
\dcgag{17.9244}{-140.4961}{17.3182}{16.422}{15.8157}{17.2655}{16.5274}
\dcgq{17.2918}{-140.4961}{1.875}
\dcgq{16.4483}{-140.4961}{1.875}
\dcgat{16.8701}{-141.2341}{-140.7597}{17.0809}{16.6592}
\draw[dca] (21.8331,-141.2416) -- (21.4045,-140.8129) (20.7707,-140.1792) -- (20.342,-139.7505) (21.3672,-140.7756) -- (20.8453,-140.2537);
\dcgq{21.3858}{-140.7943}{1.875}
\dcgq{20.7894}{-140.1978}{1.875}
\dcgc{20.5657}{-141.0179}{20.9012}{-140.6824}{20.7148}{-141.1671}{20.4166}{-140.8688}
\dcgah{25.3051}{-141.5504}{-140.9442}{-140.0479}{-139.4417}{-140.8914}{-140.1534}
\dcgq{25.3051}{-140.9178}{1.875}
\dcgq{25.3051}{-140.0743}{1.875}
\dcgau{24.567}{-140.4961}{25.0415}{-140.7069}{-140.2852}
\draw[dca] (28.7771,-141.2416) -- (29.2058,-140.8129) (29.8395,-140.1792) -- (30.2682,-139.7505) (29.243,-140.7756) -- (29.7649,-140.2537);
\dcgq{29.2244}{-140.7943}{1.875}
\dcgq{29.8208}{-140.1978}{1.875}
\dcgc{29.0007}{-139.9742}{29.3362}{-140.3097}{28.8516}{-140.1233}{29.1498}{-139.8251}
\dcgae{-1.0544}{-143.3956}{-0.4481}{0.4481}{1.0544}{-0.3954}{0.3427}{-142.8948}
\dcgq{-0.4218}{-143.3956}{1.875}
\dcgq{0.4218}{-143.3956}{1.875}
\dcgae{-1.0544}{-144.45}{-0.4481}{0.4481}{1.0544}{-0.3954}{0.3427}{-143.9491}
\dcgq{-0.4218}{-144.45}{1.875}
\dcgq{0.4218}{-144.45}{1.875}
\dcgav{0}{-143.2111}{-144.2655}
\draw[dca] (3.8447,-142.8045) -- (4.2734,-143.2331) (4.9072,-143.8669) -- (5.3359,-144.2956) (4.3107,-143.2704) -- (5.1867,-143.4382);
\dcgq{4.2921}{-143.2518}{1.875}
\dcgq{4.8885}{-143.8482}{1.875}
\draw[dca] (3.0992,-143.55) -- (3.5279,-143.9787) (4.1616,-144.6124) -- (4.5903,-145.0411) (3.5652,-144.016) -- (4.4412,-144.1837);
\dcgq{3.5465}{-143.9973}{1.875}
\dcgq{4.143}{-144.5938}{1.875}
\dcgaw{4.7208}{-143.4195}{3.9752}{-144.1651}
\dcgaf{8.9622}{-142.8684}{-143.4747}{-144.3709}{-144.9772}{-143.5274}{9.4631}{-144.2655}
\dcgq{8.9622}{-143.501}{1.875}
\dcgq{8.9622}{-144.3445}{1.875}
\dcgaf{7.9078}{-142.8684}{-143.4747}{-144.3709}{-144.9772}{-143.5274}{8.4087}{-144.2655}
\dcgq{7.9078}{-143.501}{1.875}
\dcgq{7.9078}{-144.3445}{1.875}
\dcgax{9.1467}{-143.9228}{8.0924}
\draw[dca] (13.7709,-143.55) -- (13.3422,-143.9787) (12.7085,-144.6124) -- (12.2798,-145.0411) (13.3049,-144.016) -- (13.1372,-144.892);
\dcgq{13.3236}{-143.9973}{1.875}
\dcgq{12.7271}{-144.5938}{1.875}
\draw[dca] (13.0253,-142.8045) -- (12.5966,-143.2331) (11.9629,-143.8669) -- (11.5342,-144.2956) (12.5594,-143.2704) -- (12.3916,-144.1465);
\dcgq{12.578}{-143.2518}{1.875}
\dcgq{11.9815}{-143.8482}{1.875}
\dcgaw{13.1558}{-144.426}{12.4102}{-143.6805}
\dcgae{17.9244}{-144.45}{17.3182}{16.422}{15.8157}{17.2655}{16.5274}{-144.9508}
\dcgq{17.2918}{-144.45}{1.875}
\dcgq{16.4483}{-144.45}{1.875}
\dcgae{17.9244}{-143.3956}{17.3182}{16.422}{15.8157}{17.2655}{16.5274}{-143.8964}
\dcgq{17.2918}{-143.3956}{1.875}
\dcgq{16.4483}{-143.3956}{1.875}
\dcgav{16.8701}{-144.6345}{-143.5801}
\draw[dca] (21.4604,-145.0411) -- (21.0317,-144.6124) (20.3979,-143.9787) -- (19.9692,-143.55) (20.9944,-144.5752) -- (20.1184,-144.4074);
\dcgq{21.013}{-144.5938}{1.875}
\dcgq{20.4166}{-143.9973}{1.875}
\draw[dca] (22.2059,-144.2956) -- (21.7772,-143.8669) (21.1435,-143.2331) -- (20.7148,-142.8045) (21.74,-143.8296) -- (20.8639,-143.6618);
\dcgq{21.7586}{-143.8482}{1.875}
\dcgq{21.1621}{-143.2518}{1.875}
\dcgaw{20.5843}{-144.426}{21.3299}{-143.6805}
\dcgaf{24.7779}{-144.9772}{-144.3709}{-143.4747}{-142.8684}{-144.3182}{24.2771}{-143.5801}
\dcgq{24.7779}{-144.3445}{1.875}
\dcgq{24.7779}{-143.501}{1.875}
\dcgaf{25.8323}{-144.9772}{-144.3709}{-143.4747}{-142.8684}{-144.3182}{25.3315}{-143.5801}
\dcgq{25.8323}{-144.3445}{1.875}
\dcgq{25.8323}{-143.501}{1.875}
\dcgax{24.5934}{-143.9228}{25.6478}
\draw[dca] (28.4043,-144.2956) -- (28.833,-143.8669) (29.4667,-143.2331) -- (29.8954,-142.8045) (28.8703,-143.8296) -- (29.038,-142.9536);
\dcgq{28.8516}{-143.8482}{1.875}
\dcgq{29.4481}{-143.2518}{1.875}
\draw[dca] (29.1498,-145.0411) -- (29.5785,-144.6124) (30.2123,-143.9787) -- (30.641,-143.55) (29.6158,-144.5752) -- (29.7836,-143.6991);
\dcgq{29.5972}{-144.5938}{1.875}
\dcgq{30.1936}{-143.9973}{1.875}
\dcgaw{29.0194}{-143.4195}{29.7649}{-144.1651}
\dcgar{-1.0544}{-146.5587}{-0.4481}{0.4481}{-146.0315}{1.0544}{-147.0859}{-0.3954}{0.369}
\dcgq{-0.4218}{-146.5587}{1.875}
\dcgq{0.4218}{-146.0315}{1.875}
\dcgq{0.4218}{-147.0859}{1.875}
\dcgar{-1.0544}{-148.1403}{-0.4481}{0.4481}{-147.6131}{1.0544}{-148.6675}{-0.3954}{0.369}
\dcgq{-0.4218}{-148.1403}{1.875}
\dcgq{0.4218}{-147.6131}{1.875}
\dcgq{0.4218}{-148.6675}{1.875}
\dcgav{0}{-146.2951}{-147.8767}
\draw[dca] (4.0311,-146.0448) -- (4.4598,-146.4735) (5.4663,-146.7344) -- (5.895,-147.1631) (4.7208,-147.48) -- (5.1495,-147.9087) (4.4971,-146.5108) -- (5.4104,-146.6785);
\dcgq{4.4785}{-146.4921}{1.875}
\dcgq{5.4477}{-146.7158}{1.875}
\dcgq{4.7021}{-147.4614}{1.875}
\draw[dca] (2.9128,-147.1631) -- (3.3415,-147.5918) (4.348,-147.8528) -- (4.7767,-148.2815) (3.6024,-148.5983) -- (4.0311,-149.027) (3.3788,-147.6291) -- (4.2921,-147.7969);
\dcgq{3.3601}{-147.6105}{1.875}
\dcgq{4.3294}{-147.8341}{1.875}
\dcgq{3.5838}{-148.5797}{1.875}
\dcgaw{4.9631}{-146.604}{3.8447}{-147.7223}
\dcgas{9.2258}{-146.2951}{-146.9014}{9.753}{-147.7976}{-148.4039}{8.6986}{-146.9541}{-147.7186}
\dcgq{9.2258}{-146.9278}{1.875}
\dcgq{9.753}{-147.7713}{1.875}
\dcgq{8.6986}{-147.7713}{1.875}
\dcgas{7.6443}{-146.2951}{-146.9014}{8.1714}{-147.7976}{-148.4039}{7.1171}{-146.9541}{-147.7186}
\dcgq{7.6443}{-146.9278}{1.875}
\dcgq{8.1714}{-147.7713}{1.875}
\dcgq{7.1171}{-147.7713}{1.875}
\dcgax{9.4894}{-147.3495}{7.9078}
\draw[dca] (13.9573,-147.1631) -- (13.5286,-147.5918) (13.2676,-148.5983) -- (12.8389,-149.027) (12.5221,-147.8528) -- (12.0934,-148.2815) (13.4913,-147.6291) -- (13.3236,-148.5424);
\dcgq{13.5099}{-147.6105}{1.875}
\dcgq{13.2863}{-148.5797}{1.875}
\dcgq{12.5407}{-147.8341}{1.875}
\draw[dca] (12.8389,-146.0448) -- (12.4102,-146.4735) (12.1493,-147.48) -- (11.7206,-147.9087) (11.4037,-146.7344) -- (10.975,-147.1631) (12.373,-146.5108) -- (12.2052,-147.4241);
\dcgq{12.3916}{-146.4921}{1.875}
\dcgq{12.1679}{-147.4614}{1.875}
\dcgq{11.4224}{-146.7158}{1.875}
\dcgaw{13.3981}{-148.0951}{12.2798}{-146.9767}
\dcgar{17.9244}{-148.1403}{17.3182}{16.422}{-148.6675}{15.8157}{-147.6131}{17.2655}{16.501}
\dcgq{17.2918}{-148.1403}{1.875}
\dcgq{16.4483}{-148.6675}{1.875}
\dcgq{16.4483}{-147.6131}{1.875}
\dcgar{17.9244}{-146.5587}{17.3182}{16.422}{-147.0859}{15.8157}{-146.0315}{17.2655}{16.501}
\dcgq{17.2918}{-146.5587}{1.875}
\dcgq{16.4483}{-147.0859}{1.875}
\dcgq{16.4483}{-146.0315}{1.875}
\dcgav{16.8701}{-148.4039}{-146.8223}
\draw[dca] (21.274,-148.6543) -- (20.8453,-148.2256) (19.8388,-147.9646) -- (19.4101,-147.5359) (20.5843,-147.219) -- (20.1556,-146.7904) (20.808,-148.1883) -- (19.8947,-148.0205);
\dcgq{20.8266}{-148.2069}{1.875}
\dcgq{19.8574}{-147.9832}{1.875}
\dcgq{20.603}{-147.2377}{1.875}
\draw[dca] (22.3923,-147.5359) -- (21.9636,-147.1072) (20.9571,-146.8463) -- (20.5284,-146.4176) (21.7027,-146.1007) -- (21.274,-145.672) (21.9263,-147.0699) -- (21.013,-146.9022);
\dcgq{21.945}{-147.0886}{1.875}
\dcgq{20.9758}{-146.8649}{1.875}
\dcgq{21.7213}{-146.1194}{1.875}
\dcgaw{20.342}{-148.0951}{21.4604}{-146.9767}
\dcgas{24.5143}{-148.4039}{-147.7976}{23.9871}{-146.9014}{-146.2951}{25.0415}{-147.7449}{-146.9805}
\dcgq{24.5143}{-147.7713}{1.875}
\dcgq{23.9871}{-146.9278}{1.875}
\dcgq{25.0415}{-146.9278}{1.875}
\dcgas{26.0959}{-148.4039}{-147.7976}{25.5687}{-146.9014}{-146.2951}{26.6231}{-147.7449}{-146.9805}
\dcgq{26.0959}{-147.7713}{1.875}
\dcgq{25.5687}{-146.9278}{1.875}
\dcgq{26.6231}{-146.9278}{1.875}
\dcgax{24.2507}{-147.3495}{25.8323}
\draw[dca] (28.2179,-147.5359) -- (28.6466,-147.1072) (28.9075,-146.1007) -- (29.3362,-145.672) (29.6531,-146.8463) -- (30.0818,-146.4176) (28.6839,-147.0699) -- (28.8516,-146.1566);
\dcgq{28.6652}{-147.0886}{1.875}
\dcgq{28.8889}{-146.1194}{1.875}
\dcgq{29.6345}{-146.8649}{1.875}
\draw[dca] (29.3362,-148.6543) -- (29.7649,-148.2256) (30.0259,-147.219) -- (30.4546,-146.7904) (30.7714,-147.9646) -- (31.2001,-147.5359) (29.8022,-148.1883) -- (29.97,-147.275);
\dcgq{29.7836}{-148.2069}{1.875}
\dcgq{30.0072}{-147.2377}{1.875}
\dcgq{30.7528}{-147.9832}{1.875}
\dcgaw{28.7771}{-146.604}{29.8954}{-147.7223}
\dcga{-1.0544}{-150.7763}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-150.7763}{15}
\dcgai{-0.2531}{-150.3891}{0.2531}{-151.1272}
\node[dcc] at (0,-150.8026) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">&\string#937;</text></g>}{Ω}};
\dcgc{3.472}{-150.0307}{3.8447}{-150.4035}{4.5903}{-151.149}{4.9631}{-151.5218}
\dcgq{4.2175}{-150.7763}{15}
\dcgai{3.7904}{-150.3235}{4.6702}{-151.2034}
\node[dcd] at (4.1989,-150.7949) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">&\string#937;</text></g>}{Ω}};
\dcge{8.435}{-149.7219}{-150.2491}{-151.3034}{-151.8306}
\dcgq{8.435}{-150.7763}{15}
\dcgai{8.0841}{-150.5232}{8.8222}{-151.0293}
\node[dce] at (8.4087,-150.7763) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">&\string#937;</text></g>}{Ω}};
\dcgc{13.3981}{-150.0307}{13.0253}{-150.4035}{12.2798}{-151.149}{11.907}{-151.5218}
\dcgq{12.6526}{-150.7763}{15}
\dcgai{12.2255}{-150.3492}{13.1053}{-151.229}
\node[dcf] at (12.6339,-150.7576) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">&\string#937;</text></g>}{Ω}};
\dcga{17.9244}{-150.7763}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-150.7763}{15}
\dcgai{16.617}{-150.4253}{17.1232}{-151.1634}
\node[dcg] at (16.8701,-150.7499) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">&\string#937;</text></g>}{Ω}};
\dcgc{21.8331}{-151.5218}{21.4604}{-151.149}{20.7148}{-150.4035}{20.342}{-150.0307}
\dcgq{21.0876}{-150.7763}{15}
\dcgai{20.6349}{-150.3492}{21.5147}{-151.229}
\node[dch] at (21.1062,-150.7576) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">&\string#937;</text></g>}{Ω}};
\dcge{25.3051}{-151.8306}{-151.3034}{-150.2491}{-149.7219}
\dcgq{25.3051}{-150.7763}{15}
\dcgai{24.918}{-150.5232}{25.656}{-151.0293}
\node[dci] at (25.3315,-150.7763) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">&\string#937;</text></g>}{Ω}};
\dcgc{28.7771}{-151.5218}{29.1498}{-151.149}{29.8954}{-150.4035}{30.2682}{-150.0307}
\dcgq{29.5226}{-150.7763}{15}
\dcgai{29.0699}{-150.3235}{29.9497}{-151.2034}
\node[dcj] at (29.5413,-150.7949) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">&\string#937;</text></g>}{Ω}};
\dcga{-1.0544}{-154.203}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-154.203}{15}
\dcgai{-0.1792}{-153.8158}{0.1792}{-154.5539}
\node[dcc] at (0,-154.2293) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">G</text></g>}{G}};
\dcgc{3.472}{-153.4574}{3.8447}{-153.8302}{4.5903}{-154.5758}{4.9631}{-154.9485}
\dcgq{4.2175}{-154.203}{15}
\dcgai{3.8427}{-153.8025}{4.618}{-154.5778}
\node[dcd] at (4.1989,-154.2216) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">G</text></g>}{G}};
\dcge{8.435}{-153.1486}{-153.6758}{-154.7302}{-155.2574}
\dcgq{8.435}{-154.203}{15}
\dcgai{8.0841}{-154.0238}{8.8222}{-154.3822}
\node[dce] at (8.4087,-154.203) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">G</text></g>}{G}};
\dcgc{13.3981}{-153.4574}{13.0253}{-153.8302}{12.2798}{-154.5758}{11.907}{-154.9485}
\dcgq{12.6526}{-154.203}{15}
\dcgai{12.2777}{-153.8282}{13.053}{-154.6034}
\node[dcf] at (12.6339,-154.1843) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">G</text></g>}{G}};
\dcga{17.9244}{-154.203}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-154.203}{15}
\dcgai{16.6909}{-153.8521}{17.0492}{-154.5901}
\node[dcg] at (16.8701,-154.1766) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">G</text></g>}{G}};
\dcgc{21.8331}{-154.9485}{21.4604}{-154.5758}{20.7148}{-153.8302}{20.342}{-153.4574}
\dcgq{21.0876}{-154.203}{15}
\dcgai{20.6871}{-153.8282}{21.4624}{-154.6034}
\node[dch] at (21.1062,-154.1843) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">G</text></g>}{G}};
\dcge{25.3051}{-155.2574}{-154.7302}{-153.6758}{-153.1486}
\dcgq{25.3051}{-154.203}{15}
\dcgai{24.918}{-154.0238}{25.656}{-154.3822}
\node[dci] at (25.3315,-154.203) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">G</text></g>}{G}};
\dcgc{28.7771}{-154.9485}{29.1498}{-154.5758}{29.8954}{-153.8302}{30.2682}{-153.4574}
\dcgq{29.5226}{-154.203}{15}
\dcgai{29.1222}{-153.8025}{29.8974}{-154.5778}
\node[dcj] at (29.5413,-154.2216) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">G</text></g>}{G}};
\dcgay{0}{-156.5753}{-157.6297}{-0.4481}{-158.1042}{0.4481}
\draw[dcb] (4.9631,-156.8842) -- (4.2175,-157.6297) (3.9007,-157.3129) -- (3.882,-157.9652) -- (4.5344,-157.9466) -- cycle;
\dcgaz{9.4894}{-157.6297}{8.435}{-157.1816}{7.9606}{-158.0778}
\draw[dcb] (13.3981,-158.3753) -- (12.6526,-157.6297) (12.9694,-157.3129) -- (12.3171,-157.2942) -- (12.3357,-157.9466) -- cycle;
\dcgay{16.8701}{-158.6841}{-157.6297}{17.3182}{-157.1553}{16.422}
\draw[dcb] (20.342,-158.3753) -- (21.0876,-157.6297) (21.4045,-157.9466) -- (21.4231,-157.2942) -- (20.7707,-157.3129) -- cycle;
\dcgaz{24.2507}{-157.6297}{25.3051}{-158.0778}{25.7796}{-157.1816}
\draw[dcb] (28.7771,-156.8842) -- (29.5226,-157.6297) (29.2058,-157.9466) -- (29.8581,-157.9652) -- (29.8395,-157.3129) -- cycle;
\draw[dca] (0,-160.0021) -- (0,-161.0565) (-0.5272,-161.0565) -- (0.5272,-161.0565) (-0.4218,-161.0565) -- (-0.659,-161.3728) (0,-161.0565) -- (-0.2372,-161.3728) (0.4218,-161.0565) -- (0.1845,-161.3728);
\draw[dca] (4.9631,-160.3109) -- (4.2175,-161.0565) (3.8447,-160.6837) -- (4.5903,-161.4292) (3.9193,-160.7582) -- (3.5279,-160.8141) (4.2175,-161.0565) -- (3.8261,-161.1124) (4.5157,-161.3547) -- (4.1243,-161.4106);
\draw[dca] (9.4894,-161.0565) -- (8.435,-161.0565) (8.435,-160.5293) -- (8.435,-161.5836) (8.435,-160.6347) -- (8.1187,-160.3975) (8.435,-161.0565) -- (8.1187,-160.8192) (8.435,-161.4782) -- (8.1187,-161.241);
\draw[dca] (13.3981,-161.802) -- (12.6526,-161.0565) (13.0253,-160.6837) -- (12.2798,-161.4292) (12.9508,-160.7582) -- (12.8949,-160.3668) (12.6526,-161.0565) -- (12.5966,-160.665) (12.3543,-161.3547) -- (12.2984,-160.9633);
\draw[dca] (16.8701,-162.1108) -- (16.8701,-161.0565) (17.3973,-161.0565) -- (16.3429,-161.0565) (17.2918,-161.0565) -- (17.5291,-160.7401) (16.8701,-161.0565) -- (17.1073,-160.7401) (16.4483,-161.0565) -- (16.6856,-160.7401);
\draw[dca] (20.342,-161.802) -- (21.0876,-161.0565) (21.4604,-161.4292) -- (20.7148,-160.6837) (21.3858,-161.3547) -- (21.7772,-161.2988) (21.0876,-161.0565) -- (21.479,-161.0005) (20.7894,-160.7582) -- (21.1808,-160.7023);
\draw[dca] (24.2507,-161.0565) -- (25.3051,-161.0565) (25.3051,-161.5836) -- (25.3051,-160.5293) (25.3051,-161.4782) -- (25.6214,-161.7154) (25.3051,-161.0565) -- (25.6214,-161.2937) (25.3051,-160.6347) -- (25.6214,-160.8719);
\draw[dca] (28.7771,-160.3109) -- (29.5226,-161.0565) (29.1498,-161.4292) -- (29.8954,-160.6837) (29.2244,-161.3547) -- (29.2803,-161.7461) (29.5226,-161.0565) -- (29.5785,-161.4479) (29.8208,-160.7582) -- (29.8768,-161.1496);
\draw[dca] (-1.0544,-163.4288) -- (-0.5272,-163.4288) -- (-0.5272,-163.8506) .. controls (-0.0527,-163.8506) and (-0.0527,-164.1669) .. (-0.5272,-164.1669) .. controls (-0.0527,-164.1669) and (-0.0527,-164.4832) .. (-0.5272,-164.4832) .. controls (-0.0527,-164.4832) and (-0.0527,-164.7995) .. (-0.5272,-164.7995) .. controls (-0.0527,-164.7995) and (-0.0527,-165.1158) .. (-0.5272,-165.1158) -- (-0.5272,-165.5376) -- (-1.0544,-165.5376) (1.0544,-163.4288) -- (0.5272,-163.4288) -- (0.5272,-163.8506) .. controls (0.0527,-163.8506) and (0.0527,-164.1669) .. (0.5272,-164.1669) .. controls (0.0527,-164.1669) and (0.0527,-164.4832) .. (0.5272,-164.4832) .. controls (0.0527,-164.4832) and (0.0527,-164.7995) .. (0.5272,-164.7995) .. controls (0.0527,-164.7995) and (0.0527,-165.1158) .. (0.5272,-165.1158) -- (0.5272,-165.5376) -- (1.0544,-165.5376);
\dcgaj{-0.0791}{-163.8242}{-165.1422}{0.0791}
\dcgo{0.5272}{-164.4832}{1.5816}
\draw[dca] (4.2175,-162.9921) -- (4.5903,-163.3648) -- (4.2921,-163.6631) .. controls (4.6276,-163.9986) and (4.4039,-164.2222) .. (4.0684,-163.8867) .. controls (4.4039,-164.2222) and (4.1802,-164.4459) .. (3.8447,-164.1104) .. controls (4.1802,-164.4459) and (3.9566,-164.6696) .. (3.6211,-164.3341) .. controls (3.9566,-164.6696) and (3.7329,-164.8932) .. (3.3974,-164.5577) -- (3.0992,-164.856) -- (2.7264,-164.4832) (5.7086,-164.4832) -- (5.3359,-164.1104) -- (5.0376,-164.4086) .. controls (4.7021,-164.0731) and (4.4785,-164.2968) .. (4.814,-164.6323) .. controls (4.4785,-164.2968) and (4.2548,-164.5205) .. (4.5903,-164.856) .. controls (4.2548,-164.5205) and (4.0311,-164.7441) .. (4.3666,-165.0796) .. controls (4.0311,-164.7441) and (3.8075,-164.9678) .. (4.143,-165.3033) -- (3.8447,-165.6015) -- (4.2175,-165.9743);
\dcgc{4.6276}{-163.9613}{3.6956}{-164.8932}{4.7394}{-164.0731}{3.8075}{-165.0051}
\dcgk{4.5903}{-164.856}{5.3359}{-165.6015}
\draw[dca] (9.4894,-163.4288) -- (9.4894,-163.956) -- (9.0677,-163.956) .. controls (9.0677,-164.4305) and (8.7513,-164.4305) .. (8.7513,-163.956) .. controls (8.7513,-164.4305) and (8.435,-164.4305) .. (8.435,-163.956) .. controls (8.435,-164.4305) and (8.1187,-164.4305) .. (8.1187,-163.956) .. controls (8.1187,-164.4305) and (7.8024,-164.4305) .. (7.8024,-163.956) -- (7.3807,-163.956) -- (7.3807,-163.4288) (9.4894,-165.5376) -- (9.4894,-165.0104) -- (9.0677,-165.0104) .. controls (9.0677,-164.5359) and (8.7513,-164.5359) .. (8.7513,-165.0104) .. controls (8.7513,-164.5359) and (8.435,-164.5359) .. (8.435,-165.0104) .. controls (8.435,-164.5359) and (8.1187,-164.5359) .. (8.1187,-165.0104) .. controls (8.1187,-164.5359) and (7.8024,-164.5359) .. (7.8024,-165.0104) -- (7.3807,-165.0104) -- (7.3807,-165.5376);
\dcgak{9.094}{-164.4041}{7.776}{-164.5623}
\dcgm{8.435}{-165.0104}{-166.0648}
\draw[dca] (14.1437,-164.4832) -- (13.7709,-164.856) -- (13.4727,-164.5577) .. controls (13.1372,-164.8932) and (12.9135,-164.6696) .. (13.249,-164.3341) .. controls (12.9135,-164.6696) and (12.6898,-164.4459) .. (13.0253,-164.1104) .. controls (12.6898,-164.4459) and (12.4662,-164.2222) .. (12.8017,-163.8867) .. controls (12.4662,-164.2222) and (12.2425,-163.9986) .. (12.578,-163.6631) -- (12.2798,-163.3648) -- (12.6526,-162.9921) (12.6526,-165.9743) -- (13.0253,-165.6015) -- (12.7271,-165.3033) .. controls (13.0626,-164.9678) and (12.8389,-164.7441) .. (12.5034,-165.0796) .. controls (12.8389,-164.7441) and (12.6153,-164.5205) .. (12.2798,-164.856) .. controls (12.6153,-164.5205) and (12.3916,-164.2968) .. (12.0561,-164.6323) .. controls (12.3916,-164.2968) and (12.1679,-164.0731) .. (11.8324,-164.4086) -- (11.5342,-164.1104) -- (11.1614,-164.4832);
\dcgc{13.1744}{-164.8932}{12.2425}{-163.9613}{13.0626}{-165.0051}{12.1307}{-164.0731}
\dcgk{12.2798}{-164.856}{11.5342}{-165.6015}
\draw[dca] (17.9244,-165.5376) -- (17.3973,-165.5376) -- (17.3973,-165.1158) .. controls (16.9228,-165.1158) and (16.9228,-164.7995) .. (17.3973,-164.7995) .. controls (16.9228,-164.7995) and (16.9228,-164.4832) .. (17.3973,-164.4832) .. controls (16.9228,-164.4832) and (16.9228,-164.1669) .. (17.3973,-164.1669) .. controls (16.9228,-164.1669) and (16.9228,-163.8506) .. (17.3973,-163.8506) -- (17.3973,-163.4288) -- (17.9244,-163.4288) (15.8157,-165.5376) -- (16.3429,-165.5376) -- (16.3429,-165.1158) .. controls (16.8174,-165.1158) and (16.8174,-164.7995) .. (16.3429,-164.7995) .. controls (16.8174,-164.7995) and (16.8174,-164.4832) .. (16.3429,-164.4832) .. controls (16.8174,-164.4832) and (16.8174,-164.1669) .. (16.3429,-164.1669) .. controls (16.8174,-164.1669) and (16.8174,-163.8506) .. (16.3429,-163.8506) -- (16.3429,-163.4288) -- (15.8157,-163.4288);
\dcgaj{16.9491}{-165.1422}{-163.8242}{16.791}
\dcgo{16.3429}{-164.4832}{15.2885}
\draw[dca] (21.0876,-165.9743) -- (20.7148,-165.6015) -- (21.013,-165.3033) .. controls (20.6775,-164.9678) and (20.9012,-164.7441) .. (21.2367,-165.0796) .. controls (20.9012,-164.7441) and (21.1249,-164.5205) .. (21.4604,-164.856) .. controls (21.1249,-164.5205) and (21.3485,-164.2968) .. (21.684,-164.6323) .. controls (21.3485,-164.2968) and (21.5722,-164.0731) .. (21.9077,-164.4086) -- (22.2059,-164.1104) -- (22.5787,-164.4832) (19.5965,-164.4832) -- (19.9692,-164.856) -- (20.2675,-164.5577) .. controls (20.603,-164.8932) and (20.8266,-164.6696) .. (20.4911,-164.3341) .. controls (20.8266,-164.6696) and (21.0503,-164.4459) .. (20.7148,-164.1104) .. controls (21.0503,-164.4459) and (21.274,-164.2222) .. (20.9385,-163.8867) .. controls (21.274,-164.2222) and (21.4976,-163.9986) .. (21.1621,-163.6631) -- (21.4604,-163.3648) -- (21.0876,-162.9921);
\dcgc{20.6775}{-165.0051}{21.6095}{-164.0731}{20.5657}{-164.8932}{21.4976}{-163.9613}
\dcgk{20.7148}{-164.1104}{19.9692}{-163.3648}
\draw[dca] (24.2507,-165.5376) -- (24.2507,-165.0104) -- (24.6725,-165.0104) .. controls (24.6725,-164.5359) and (24.9888,-164.5359) .. (24.9888,-165.0104) .. controls (24.9888,-164.5359) and (25.3051,-164.5359) .. (25.3051,-165.0104) .. controls (25.3051,-164.5359) and (25.6214,-164.5359) .. (25.6214,-165.0104) .. controls (25.6214,-164.5359) and (25.9377,-164.5359) .. (25.9377,-165.0104) -- (26.3595,-165.0104) -- (26.3595,-165.5376) (24.2507,-163.4288) -- (24.2507,-163.956) -- (24.6725,-163.956) .. controls (24.6725,-164.4305) and (24.9888,-164.4305) .. (24.9888,-163.956) .. controls (24.9888,-164.4305) and (25.3051,-164.4305) .. (25.3051,-163.956) .. controls (25.3051,-164.4305) and (25.6214,-164.4305) .. (25.6214,-163.956) .. controls (25.6214,-164.4305) and (25.9377,-164.4305) .. (25.9377,-163.956) -- (26.3595,-163.956) -- (26.3595,-163.4288);
\dcgak{24.6461}{-164.5623}{25.9641}{-164.4041}
\dcgm{25.3051}{-163.956}{-162.9016}
\draw[dca] (28.0315,-164.4832) -- (28.4043,-164.1104) -- (28.7025,-164.4086) .. controls (29.038,-164.0731) and (29.2617,-164.2968) .. (28.9262,-164.6323) .. controls (29.2617,-164.2968) and (29.4853,-164.5205) .. (29.1498,-164.856) .. controls (29.4853,-164.5205) and (29.709,-164.7441) .. (29.3735,-165.0796) .. controls (29.709,-164.7441) and (29.9327,-164.9678) .. (29.5972,-165.3033) -- (29.8954,-165.6015) -- (29.5226,-165.9743) (29.5226,-162.9921) -- (29.1498,-163.3648) -- (29.4481,-163.6631) .. controls (29.1126,-163.9986) and (29.3362,-164.2222) .. (29.6717,-163.8867) .. controls (29.3362,-164.2222) and (29.5599,-164.4459) .. (29.8954,-164.1104) .. controls (29.5599,-164.4459) and (29.7836,-164.6696) .. (30.1191,-164.3341) .. controls (29.7836,-164.6696) and (30.0072,-164.8932) .. (30.3427,-164.5577) -- (30.641,-164.856) -- (31.0137,-164.4832);
\dcgc{29.0007}{-164.0731}{29.9327}{-165.0051}{29.1126}{-163.9613}{30.0445}{-164.8932}
\dcgk{29.8954}{-164.1104}{30.641}{-163.3648}
\draw[dca] (-1.0544,-166.8555) -- (-0.5272,-166.8555) -- (-0.5272,-167.2773) .. controls (-0.0527,-167.2773) and (-0.0527,-167.5936) .. (-0.5272,-167.5936) .. controls (-0.0527,-167.5936) and (-0.0527,-167.9099) .. (-0.5272,-167.9099) .. controls (-0.0527,-167.9099) and (-0.0527,-168.2262) .. (-0.5272,-168.2262) .. controls (-0.0527,-168.2262) and (-0.0527,-168.5425) .. (-0.5272,-168.5425) -- (-0.5272,-168.9643) -- (-1.0544,-168.9643) (1.0544,-166.8555) -- (0.5272,-166.8555) -- (0.5272,-167.2773) .. controls (0.0527,-167.2773) and (0.0527,-167.5936) .. (0.5272,-167.5936) .. controls (0.0527,-167.5936) and (0.0527,-167.9099) .. (0.5272,-167.9099) .. controls (0.0527,-167.9099) and (0.0527,-168.2262) .. (0.5272,-168.2262) .. controls (0.0527,-168.2262) and (0.0527,-168.5425) .. (0.5272,-168.5425) -- (0.5272,-168.9643) -- (1.0544,-168.9643);
\draw[dca] (4.2175,-166.4188) -- (4.5903,-166.7916) -- (4.2921,-167.0898) .. controls (4.6276,-167.4253) and (4.4039,-167.649) .. (4.0684,-167.3135) .. controls (4.4039,-167.649) and (4.1802,-167.8726) .. (3.8447,-167.5371) .. controls (4.1802,-167.8726) and (3.9566,-168.0963) .. (3.6211,-167.7608) .. controls (3.9566,-168.0963) and (3.7329,-168.32) .. (3.3974,-167.9845) -- (3.0992,-168.2827) -- (2.7264,-167.9099) (5.7086,-167.9099) -- (5.3359,-167.5371) -- (5.0376,-167.8354) .. controls (4.7021,-167.4999) and (4.4785,-167.7235) .. (4.814,-168.059) .. controls (4.4785,-167.7235) and (4.2548,-167.9472) .. (4.5903,-168.2827) .. controls (4.2548,-167.9472) and (4.0311,-168.1709) .. (4.3666,-168.5064) .. controls (4.0311,-168.1709) and (3.8075,-168.3945) .. (4.143,-168.73) -- (3.8447,-169.0283) -- (4.2175,-169.401);
\draw[dca] (9.4894,-166.8555) -- (9.4894,-167.3827) -- (9.0677,-167.3827) .. controls (9.0677,-167.8572) and (8.7513,-167.8572) .. (8.7513,-167.3827) .. controls (8.7513,-167.8572) and (8.435,-167.8572) .. (8.435,-167.3827) .. controls (8.435,-167.8572) and (8.1187,-167.8572) .. (8.1187,-167.3827) .. controls (8.1187,-167.8572) and (7.8024,-167.8572) .. (7.8024,-167.3827) -- (7.3807,-167.3827) -- (7.3807,-166.8555) (9.4894,-168.9643) -- (9.4894,-168.4371) -- (9.0677,-168.4371) .. controls (9.0677,-167.9626) and (8.7513,-167.9626) .. (8.7513,-168.4371) .. controls (8.7513,-167.9626) and (8.435,-167.9626) .. (8.435,-168.4371) .. controls (8.435,-167.9626) and (8.1187,-167.9626) .. (8.1187,-168.4371) .. controls (8.1187,-167.9626) and (7.8024,-167.9626) .. (7.8024,-168.4371) -- (7.3807,-168.4371) -- (7.3807,-168.9643);
\draw[dca] (14.1437,-167.9099) -- (13.7709,-168.2827) -- (13.4727,-167.9845) .. controls (13.1372,-168.32) and (12.9135,-168.0963) .. (13.249,-167.7608) .. controls (12.9135,-168.0963) and (12.6898,-167.8726) .. (13.0253,-167.5371) .. controls (12.6898,-167.8726) and (12.4662,-167.649) .. (12.8017,-167.3135) .. controls (12.4662,-167.649) and (12.2425,-167.4253) .. (12.578,-167.0898) -- (12.2798,-166.7916) -- (12.6526,-166.4188) (12.6526,-169.401) -- (13.0253,-169.0283) -- (12.7271,-168.73) .. controls (13.0626,-168.3945) and (12.8389,-168.1709) .. (12.5034,-168.5064) .. controls (12.8389,-168.1709) and (12.6153,-167.9472) .. (12.2798,-168.2827) .. controls (12.6153,-167.9472) and (12.3916,-167.7235) .. (12.0561,-168.059) .. controls (12.3916,-167.7235) and (12.1679,-167.4999) .. (11.8324,-167.8354) -- (11.5342,-167.5371) -- (11.1614,-167.9099);
\draw[dca] (17.9244,-168.9643) -- (17.3973,-168.9643) -- (17.3973,-168.5425) .. controls (16.9228,-168.5425) and (16.9228,-168.2262) .. (17.3973,-168.2262) .. controls (16.9228,-168.2262) and (16.9228,-167.9099) .. (17.3973,-167.9099) .. controls (16.9228,-167.9099) and (16.9228,-167.5936) .. (17.3973,-167.5936) .. controls (16.9228,-167.5936) and (16.9228,-167.2773) .. (17.3973,-167.2773) -- (17.3973,-166.8555) -- (17.9244,-166.8555) (15.8157,-168.9643) -- (16.3429,-168.9643) -- (16.3429,-168.5425) .. controls (16.8174,-168.5425) and (16.8174,-168.2262) .. (16.3429,-168.2262) .. controls (16.8174,-168.2262) and (16.8174,-167.9099) .. (16.3429,-167.9099) .. controls (16.8174,-167.9099) and (16.8174,-167.5936) .. (16.3429,-167.5936) .. controls (16.8174,-167.5936) and (16.8174,-167.2773) .. (16.3429,-167.2773) -- (16.3429,-166.8555) -- (15.8157,-166.8555);
\draw[dca] (21.0876,-169.401) -- (20.7148,-169.0283) -- (21.013,-168.73) .. controls (20.6775,-168.3945) and (20.9012,-168.1709) .. (21.2367,-168.5064) .. controls (20.9012,-168.1709) and (21.1249,-167.9472) .. (21.4604,-168.2827) .. controls (21.1249,-167.9472) and (21.3485,-167.7235) .. (21.684,-168.059) .. controls (21.3485,-167.7235) and (21.5722,-167.4999) .. (21.9077,-167.8354) -- (22.2059,-167.5371) -- (22.5787,-167.9099) (19.5965,-167.9099) -- (19.9692,-168.2827) -- (20.2675,-167.9845) .. controls (20.603,-168.32) and (20.8266,-168.0963) .. (20.4911,-167.7608) .. controls (20.8266,-168.0963) and (21.0503,-167.8726) .. (20.7148,-167.5371) .. controls (21.0503,-167.8726) and (21.274,-167.649) .. (20.9385,-167.3135) .. controls (21.274,-167.649) and (21.4976,-167.4253) .. (21.1621,-167.0898) -- (21.4604,-166.7916) -- (21.0876,-166.4188);
\draw[dca] (24.2507,-168.9643) -- (24.2507,-168.4371) -- (24.6725,-168.4371) .. controls (24.6725,-167.9626) and (24.9888,-167.9626) .. (24.9888,-168.4371) .. controls (24.9888,-167.9626) and (25.3051,-167.9626) .. (25.3051,-168.4371) .. controls (25.3051,-167.9626) and (25.6214,-167.9626) .. (25.6214,-168.4371) .. controls (25.6214,-167.9626) and (25.9377,-167.9626) .. (25.9377,-168.4371) -- (26.3595,-168.4371) -- (26.3595,-168.9643) (24.2507,-166.8555) -- (24.2507,-167.3827) -- (24.6725,-167.3827) .. controls (24.6725,-167.8572) and (24.9888,-167.8572) .. (24.9888,-167.3827) .. controls (24.9888,-167.8572) and (25.3051,-167.8572) .. (25.3051,-167.3827) .. controls (25.3051,-167.8572) and (25.6214,-167.8572) .. (25.6214,-167.3827) .. controls (25.6214,-167.8572) and (25.9377,-167.8572) .. (25.9377,-167.3827) -- (26.3595,-167.3827) -- (26.3595,-166.8555);
\draw[dca] (28.0315,-167.9099) -- (28.4043,-167.5371) -- (28.7025,-167.8354) .. controls (29.038,-167.4999) and (29.2617,-167.7235) .. (28.9262,-168.059) .. controls (29.2617,-167.7235) and (29.4853,-167.9472) .. (29.1498,-168.2827) .. controls (29.4853,-167.9472) and (29.709,-168.1709) .. (29.3735,-168.5064) .. controls (29.709,-168.1709) and (29.9327,-168.3945) .. (29.5972,-168.73) -- (29.8954,-169.0283) -- (29.5226,-169.401) (29.5226,-166.4188) -- (29.1498,-166.7916) -- (29.4481,-167.0898) .. controls (29.1126,-167.4253) and (29.3362,-167.649) .. (29.6717,-167.3135) .. controls (29.3362,-167.649) and (29.5599,-167.8726) .. (29.8954,-167.5371) .. controls (29.5599,-167.8726) and (29.7836,-168.0963) .. (30.1191,-167.7608) .. controls (29.7836,-168.0963) and (30.0072,-168.32) .. (30.3427,-167.9845) -- (30.641,-168.2827) -- (31.0137,-167.9099);
\dcgba{-1.0544}{-170.8095}{-0.6326}{-171.8638}{0.6326}{-171.3367}{1.0544}
\dcgx{-0.6326}{-170.4932}{0.6326}{-171.3367}{-172.1802}
\dcgai{-0.5105}{-170.5648}{-0.333}{-171.092}
\node[dct] at (-0.4218,-170.8622) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{-0.5105}{-171.5138}{-0.333}{-172.0409}
\node[dct] at (-0.4218,-171.8111) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\draw[dca] (3.8447,-170.2183) -- (4.143,-170.5165) (3.0992,-170.9639) -- (3.3974,-171.2621) (4.6649,-171.784) -- (4.9631,-172.0822);
\dcgy{4.3666}{-170.2929}{4.6649}{-171.784}{3.1737}{-171.4858}
\dcgai{4.0295}{-170.4299}{4.5278}{-170.9282}
\node[dcu] at (4.2548,-170.7029) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{3.3585}{-171.1009}{3.8568}{-171.5992}
\node[dcu] at (3.5838,-171.3739) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgbb{8.9622}{-170.2823}{-170.704}{7.9078}{8.435}{-171.9693}{-172.391}
\dcgz{9.2785}{-170.704}{8.435}{-171.9693}{7.5915}
\dcgai{8.6797}{-170.8261}{9.2069}{-171.0037}
\node[dcv] at (8.9095,-170.9149) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{7.7307}{-170.8261}{8.2579}{-171.0037}
\node[dcv] at (7.9606,-170.9149) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\draw[dca] (13.7709,-170.9639) -- (13.4727,-171.2621) (13.0253,-170.2183) -- (12.7271,-170.5165) (12.2052,-171.784) -- (11.907,-172.0822);
\dcgy{13.6963}{-171.4858}{12.2052}{-171.784}{12.5034}{-170.2929}
\dcgai{13.061}{-171.1487}{13.5593}{-171.647}
\node[dcw] at (13.2863,-171.3739) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{12.39}{-170.4777}{12.8883}{-170.976}
\node[dcw] at (12.6153,-170.7029) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgba{17.9244}{-171.8638}{17.5027}{-170.8095}{16.2374}{-171.3367}{15.8157}
\dcgx{17.5027}{-172.1802}{16.2374}{-171.3367}{-170.4932}
\dcgai{17.2031}{-171.5813}{17.3806}{-172.1085}
\node[dcx] at (17.2918,-171.8111) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{17.2031}{-170.6324}{17.3806}{-171.1596}
\node[dcx] at (17.2918,-170.8622) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\draw[dca] (21.4604,-172.455) -- (21.1621,-172.1568) (22.2059,-171.7094) -- (21.9077,-171.4112) (20.6403,-170.8893) -- (20.342,-170.5911);
\dcgy{20.9385}{-172.3804}{20.6403}{-170.8893}{22.1314}{-171.1875}
\dcgai{20.7773}{-171.7451}{21.2756}{-172.2434}
\node[dcy] at (21.0503,-171.9704) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{21.4483}{-171.0741}{21.9466}{-171.5724}
\node[dcy] at (21.7213,-171.2994) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgbb{24.7779}{-172.391}{-171.9693}{25.8323}{25.3051}{-170.704}{-170.2823}
\dcgz{24.4616}{-171.9693}{25.3051}{-170.704}{26.1486}
\dcgai{24.5333}{-171.6696}{25.0605}{-171.8472}
\node[dcz] at (24.8306,-171.7584) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{25.4822}{-171.6696}{26.0094}{-171.8472}
\node[dcz] at (25.7796,-171.7584) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\draw[dca] (28.4043,-171.7094) -- (28.7025,-171.4112) (29.1498,-172.455) -- (29.4481,-172.1568) (29.97,-170.8893) -- (30.2682,-170.5911);
\dcgy{28.4788}{-171.1875}{29.97}{-170.8893}{29.6717}{-172.3804}
\dcgai{28.6159}{-171.0263}{29.1142}{-171.5246}
\node[dcaa] at (28.8889,-171.2994) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{29.2869}{-171.6973}{29.7852}{-172.1956}
\node[dcaa] at (29.5599,-171.9704) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgba{-1.0544}{-174.2362}{-0.6326}{-175.2906}{0.6326}{-174.7634}{1.0544}
\dcgx{-0.6326}{-173.9199}{0.6326}{-174.7634}{-175.6069}
\dcgai{-0.5105}{-173.9915}{-0.333}{-174.5187}
\node[dct] at (-0.4218,-174.2889) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{-0.5105}{-174.9405}{-0.333}{-175.4677}
\node[dct] at (-0.4218,-175.2379) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgai{-0.0756}{-174.4467}{0.0756}{-175.0002}
\node[text=dcColor0, font=\fontsize{11.25}{14.625}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (0,-174.7634) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="15">&\string#62;</text></g>}{>}};
\draw[dca] (3.8447,-173.645) -- (4.143,-173.9433) (3.0992,-174.3906) -- (3.3974,-174.6888) (4.6649,-175.2107) -- (4.9631,-175.5089);
\dcgy{4.3666}{-173.7196}{4.6649}{-175.2107}{3.1737}{-174.9125}
\dcgai{4.0295}{-173.8566}{4.5278}{-174.3549}
\node[dcu] at (4.2548,-174.1297) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{3.3585}{-174.5276}{3.8568}{-175.0259}
\node[dcu] at (3.5838,-174.8007) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgai{3.9966}{-174.486}{4.4949}{-174.9843}
\node[text=dcColor0, font=\fontsize{11.25}{14.625}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-45] at (4.2175,-174.7634) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="15">&\string#62;</text></g>}{>}};
\dcgbb{8.9622}{-173.709}{-174.1308}{7.9078}{8.435}{-175.396}{-175.8178}
\dcgz{9.2785}{-174.1308}{8.435}{-175.396}{7.5915}
\dcgai{8.6797}{-174.2529}{9.2069}{-174.4304}
\node[dcv] at (8.9095,-174.3416) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{7.7307}{-174.2529}{8.2579}{-174.4304}
\node[dcv] at (7.9606,-174.3416) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgai{8.1982}{-174.6878}{8.7518}{-174.839}
\node[text=dcColor0, font=\fontsize{11.25}{14.625}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-90] at (8.435,-174.7634) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="15">&\string#62;</text></g>}{>}};
\draw[dca] (13.7709,-174.3906) -- (13.4727,-174.6888) (13.0253,-173.645) -- (12.7271,-173.9433) (12.2052,-175.2107) -- (11.907,-175.5089);
\dcgy{13.6963}{-174.9125}{12.2052}{-175.2107}{12.5034}{-173.7196}
\dcgai{13.061}{-174.5754}{13.5593}{-175.0737}
\node[dcw] at (13.2863,-174.8007) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{12.39}{-173.9044}{12.8883}{-174.4027}
\node[dcw] at (12.6153,-174.1297) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgai{12.4317}{-174.5425}{12.93}{-175.0408}
\node[text=dcColor0, font=\fontsize{11.25}{14.625}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-135] at (12.6526,-174.7634) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="15">&\string#62;</text></g>}{>}};
\dcgba{17.9244}{-175.2906}{17.5027}{-174.2362}{16.2374}{-174.7634}{15.8157}
\dcgx{17.5027}{-175.6069}{16.2374}{-174.7634}{-173.9199}
\dcgai{17.2031}{-175.008}{17.3806}{-175.5352}
\node[dcx] at (17.2918,-175.2379) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{17.2031}{-174.0591}{17.3806}{-174.5863}
\node[dcx] at (17.2918,-174.2889) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgai{16.7945}{-174.5266}{16.9456}{-175.0801}
\node[text=dcColor0, font=\fontsize{11.25}{14.625}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-180] at (16.8701,-174.7634) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="15">&\string#62;</text></g>}{>}};
\draw[dca] (21.4604,-175.8817) -- (21.1621,-175.5835) (22.2059,-175.1362) -- (21.9077,-174.8379) (20.6403,-174.3161) -- (20.342,-174.0178);
\dcgy{20.9385}{-175.8072}{20.6403}{-174.3161}{22.1314}{-174.6143}
\dcgai{20.7773}{-175.1718}{21.2756}{-175.6701}
\node[dcy] at (21.0503,-175.3971) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{21.4483}{-174.5008}{21.9466}{-174.9991}
\node[dcy] at (21.7213,-174.7261) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgai{20.8102}{-174.5425}{21.3085}{-175.0408}
\node[text=dcColor0, font=\fontsize{11.25}{14.625}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-225] at (21.0876,-174.7634) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="15">&\string#62;</text></g>}{>}};
\dcgbb{24.7779}{-175.8178}{-175.396}{25.8323}{25.3051}{-174.1308}{-173.709}
\dcgz{24.4616}{-175.396}{25.3051}{-174.1308}{26.1486}
\dcgai{24.5333}{-175.0964}{25.0605}{-175.2739}
\node[dcz] at (24.8306,-175.1851) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{25.4822}{-175.0964}{26.0094}{-175.2739}
\node[dcz] at (25.7796,-175.1851) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgai{24.9884}{-174.6878}{25.5419}{-174.839}
\node[text=dcColor0, font=\fontsize{11.25}{14.625}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-270] at (25.3051,-174.7634) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="15">&\string#62;</text></g>}{>}};
\draw[dca] (28.4043,-175.1362) -- (28.7025,-174.8379) (29.1498,-175.8817) -- (29.4481,-175.5835) (29.97,-174.3161) -- (30.2682,-174.0178);
\dcgy{28.4788}{-174.6143}{29.97}{-174.3161}{29.6717}{-175.8072}
\dcgai{28.6159}{-174.4531}{29.1142}{-174.9514}
\node[dcaa] at (28.8889,-174.7261) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">&\string#8722;</text></g>}{−}};
\dcgai{29.2869}{-175.1241}{29.7852}{-175.6224}
\node[dcaa] at (29.5599,-175.3971) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="14">+</text></g>}{+}};
\dcgai{29.2452}{-174.486}{29.7435}{-174.9843}
\node[text=dcColor0, font=\fontsize{11.25}{14.625}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-315] at (29.5226,-174.7634) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="15">&\string#62;</text></g>}{>}};
\dcgak{-1.0544}{-177.6629}{-0.5272}{-178.7173}
\dcgbc{-0.5272}{-177.4521}{0}{0.9226}{-178.9282}
\dcgo{0.6326}{-178.1901}{1.0544}
\dcgc{3.8447}{-177.0718}{4.2175}{-177.4446}{3.0992}{-177.8173}{3.472}{-178.1901}
\draw[dcb] (4.3666,-177.2954) -- (4.7394,-177.6682) .. controls (5.3918,-178.3206) and (4.348,-179.3644) .. (3.6956,-178.712) -- (3.3228,-178.3392) -- cycle;
\dcgk{4.6649}{-178.6375}{4.9631}{-178.9357}
\dcgaj{8.9622}{-177.1357}{-177.6629}{7.9078}
\dcgbd{9.1731}{-177.6629}{-178.1901}{-179.1127}{7.697}
\dcgm{8.435}{-178.8227}{-179.2445}
\dcgc{13.7709}{-177.8173}{13.3981}{-178.1901}{13.0253}{-177.0718}{12.6526}{-177.4446}
\draw[dcb] (13.5472,-178.3392) -- (13.1744,-178.712) .. controls (12.5221,-179.3644) and (11.4783,-178.3206) .. (12.1307,-177.6682) -- (12.5034,-177.2954) -- cycle;
\dcgk{12.2052}{-178.6375}{11.907}{-178.9357}
\dcgak{17.9244}{-178.7173}{17.3973}{-177.6629}
\dcgbc{17.3973}{-178.9282}{16.8701}{15.9475}{-177.4521}
\dcgo{16.2374}{-178.1901}{15.8157}
\dcgc{21.4604}{-179.3085}{21.0876}{-178.9357}{22.2059}{-178.5629}{21.8331}{-178.1901}
\draw[dcb] (20.9385,-179.0848) -- (20.5657,-178.712) .. controls (19.9133,-178.0596) and (20.9571,-177.0159) .. (21.6095,-177.6682) -- (21.9823,-178.041) -- cycle;
\dcgk{20.6403}{-177.7428}{20.342}{-177.4446}
\dcgaj{24.7779}{-179.2445}{-178.7173}{25.8323}
\dcgbd{24.567}{-178.7173}{-178.1901}{-177.2675}{26.0432}
\dcgm{25.3051}{-177.5575}{-177.1357}
\dcgc{28.4043}{-178.5629}{28.7771}{-178.1901}{29.1498}{-179.3085}{29.5226}{-178.9357}
\draw[dcb] (28.628,-178.041) -- (29.0007,-177.6682) .. controls (29.6531,-177.0159) and (30.6969,-178.0596) .. (30.0445,-178.712) -- (29.6717,-179.0848) -- cycle;
\dcgk{29.97}{-177.7428}{30.2682}{-177.4446}
\dcgak{-1.0544}{-181.0897}{-0.4745}{-182.144}
\draw[dcb] (-0.6326,-180.8788) .. controls (-0.2109,-180.8788) and (0.2109,-181.1248) .. (0.6326,-181.6169) .. controls (0.2109,-182.1089) and (-0.2109,-182.3549) .. (-0.6326,-182.3549) .. controls (-0.3515,-181.8629) and (-0.3515,-181.3708) .. (-0.6326,-180.8788) -- cycle;
\dcgo{0.6326}{-181.6169}{1.0544}
\dcgc{3.8447}{-180.4985}{4.2548}{-180.9086}{3.0992}{-181.2441}{3.5092}{-181.6541}
\draw[dcb] (4.2921,-180.6476) .. controls (4.5903,-180.9459) and (4.7146,-181.418) .. (4.6649,-182.0642) .. controls (4.0187,-182.1139) and (3.5465,-181.9896) .. (3.2483,-181.6914) .. controls (3.795,-181.5423) and (4.143,-181.1944) .. (4.2921,-180.6476) -- cycle;
\dcgk{4.6649}{-182.0642}{4.9631}{-182.3624}
\dcgaj{8.9622}{-180.5625}{-181.1424}{7.9078}
\draw[dcb] (9.1731,-180.9842) .. controls (9.1731,-181.406) and (8.9271,-181.8277) .. (8.435,-182.2495) .. controls (7.943,-181.8277) and (7.697,-181.406) .. (7.697,-180.9842) .. controls (8.189,-181.2654) and (8.6811,-181.2654) .. (9.1731,-180.9842) -- cycle;
\dcgm{8.435}{-182.2495}{-182.6712}
\dcgc{13.7709}{-181.2441}{13.3608}{-181.6541}{13.0253}{-180.4985}{12.6153}{-180.9086}
\draw[dcb] (13.6218,-181.6914) .. controls (13.3236,-181.9896) and (12.8514,-182.1139) .. (12.2052,-182.0642) .. controls (12.1555,-181.418) and (12.2798,-180.9459) .. (12.578,-180.6476) .. controls (12.7271,-181.1944) and (13.075,-181.5423) .. (13.6218,-181.6914) -- cycle;
\dcgk{12.2052}{-182.0642}{11.907}{-182.3624}
\dcgak{17.9244}{-182.144}{17.3445}{-181.0897}
\draw[dcb] (17.5027,-182.3549) .. controls (17.0809,-182.3549) and (16.6592,-182.1089) .. (16.2374,-181.6169) .. controls (16.6592,-181.1248) and (17.0809,-180.8788) .. (17.5027,-180.8788) .. controls (17.2215,-181.3708) and (17.2215,-181.8629) .. (17.5027,-182.3549) -- cycle;
\dcgo{16.2374}{-181.6169}{15.8157}
\dcgc{21.4604}{-182.7352}{21.0503}{-182.3251}{22.2059}{-181.9896}{21.7959}{-181.5796}
\draw[dcb] (21.013,-182.5861) .. controls (20.7148,-182.2879) and (20.5905,-181.8157) .. (20.6403,-181.1695) .. controls (21.2864,-181.1198) and (21.7586,-181.2441) .. (22.0568,-181.5423) .. controls (21.5101,-181.6914) and (21.1621,-182.0393) .. (21.013,-182.5861) -- cycle;
\dcgk{20.6403}{-181.1695}{20.342}{-180.8713}
\dcgaj{24.7779}{-182.6712}{-182.0913}{25.8323}
\draw[dcb] (24.567,-182.2495) .. controls (24.567,-181.8277) and (24.8131,-181.406) .. (25.3051,-180.9842) .. controls (25.7971,-181.406) and (26.0432,-181.8277) .. (26.0432,-182.2495) .. controls (25.5511,-181.9683) and (25.0591,-181.9683) .. (24.567,-182.2495) -- cycle;
\dcgm{25.3051}{-180.9842}{-180.5625}
\dcgc{28.4043}{-181.9896}{28.8143}{-181.5796}{29.1498}{-182.7352}{29.5599}{-182.3251}
\draw[dcb] (28.5534,-181.5423) .. controls (28.8516,-181.2441) and (29.3238,-181.1198) .. (29.97,-181.1695) .. controls (30.0197,-181.8157) and (29.8954,-182.2879) .. (29.5972,-182.5861) .. controls (29.4481,-182.0393) and (29.1001,-181.6914) .. (28.5534,-181.5423) -- cycle;
\dcgk{29.97}{-181.1695}{30.2682}{-180.8713}
\dcgo{-1.0544}{-185.0436}{-0.5272}
\dcgx{-0.5272}{-184.3846}{0.5799}{-185.0436}{-185.7026}
\dcgq{0.7381}{-185.0436}{3}
\dcgo{0.8435}{-185.0436}{1.0544}
\dcgk{3.472}{-184.298}{3.8447}{-184.6708}
\dcgy{4.3107}{-184.2048}{4.6276}{-185.4536}{3.3788}{-185.1368}
\dcgq{4.7394}{-185.5655}{3}
\dcgk{4.814}{-185.64}{4.9631}{-185.7891}
\dcgm{8.435}{-183.9892}{-184.5164}
\dcgz{9.094}{-184.5164}{8.435}{-185.6235}{7.776}
\dcgq{8.435}{-185.7817}{3}
\dcgm{8.435}{-185.8871}{-186.098}
\dcgk{13.3981}{-184.298}{13.0253}{-184.6708}
\dcgy{13.4913}{-185.1368}{12.2425}{-185.4536}{12.5594}{-184.2048}
\dcgq{12.1307}{-185.5655}{3}
\dcgk{12.0561}{-185.64}{11.907}{-185.7891}
\dcgo{17.9244}{-185.0436}{17.3973}
\dcgx{17.3973}{-185.7026}{16.2902}{-185.0436}{-184.3846}
\dcgq{16.132}{-185.0436}{3}
\dcgo{16.0266}{-185.0436}{15.8157}
\dcgk{21.8331}{-185.7891}{21.4604}{-185.4164}
\dcgy{20.9944}{-185.8823}{20.6775}{-184.6335}{21.9263}{-184.9504}
\dcgq{20.5657}{-184.5217}{3}
\dcgk{20.4911}{-184.4471}{20.342}{-184.298}
\dcgm{25.3051}{-186.098}{-185.5708}
\dcgz{24.6461}{-185.5708}{25.3051}{-184.4637}{25.9641}
\dcgq{25.3051}{-184.3055}{3}
\dcgm{25.3051}{-184.2001}{-183.9892}
\dcgk{28.7771}{-185.7891}{29.1498}{-185.4164}
\dcgy{28.6839}{-184.9504}{29.9327}{-184.6335}{29.6158}{-185.8823}
\dcgq{30.0445}{-184.5217}{3}
\dcgk{30.1191}{-184.4471}{30.2682}{-184.298}
\dcgak{-1.0544}{-187.9431}{-0.5272}{-188.9975}
\dcgbc{-0.5272}{-187.7323}{0}{0.9226}{-189.2084}
\dcgq{0.7381}{-188.4703}{3}
\dcgo{0.8435}{-188.4703}{1.0544}
\dcgc{3.8447}{-187.352}{4.2175}{-187.7248}{3.0992}{-188.0975}{3.472}{-188.4703}
\draw[dcb] (4.3666,-187.5756) -- (4.7394,-187.9484) .. controls (5.3918,-188.6008) and (4.348,-189.6446) .. (3.6956,-188.9922) -- (3.3228,-188.6194) -- cycle;
\dcgq{4.7394}{-188.9922}{3}
\dcgk{4.814}{-189.0668}{4.9631}{-189.2159}
\dcgaj{8.9622}{-187.4159}{-187.9431}{7.9078}
\dcgbd{9.1731}{-187.9431}{-188.4703}{-189.3929}{7.697}
\dcgq{8.435}{-189.2084}{3}
\dcgm{8.435}{-189.3138}{-189.5247}
\dcgc{13.7709}{-188.0975}{13.3981}{-188.4703}{13.0253}{-187.352}{12.6526}{-187.7248}
\draw[dcb] (13.5472,-188.6194) -- (13.1744,-188.9922) .. controls (12.5221,-189.6446) and (11.4783,-188.6008) .. (12.1307,-187.9484) -- (12.5034,-187.5756) -- cycle;
\dcgq{12.1307}{-188.9922}{3}
\dcgk{12.0561}{-189.0668}{11.907}{-189.2159}
\dcgak{17.9244}{-188.9975}{17.3973}{-187.9431}
\dcgbc{17.3973}{-189.2084}{16.8701}{15.9475}{-187.7323}
\dcgq{16.132}{-188.4703}{3}
\dcgo{16.0266}{-188.4703}{15.8157}
\dcgc{21.4604}{-189.5887}{21.0876}{-189.2159}{22.2059}{-188.8431}{21.8331}{-188.4703}
\draw[dcb] (20.9385,-189.365) -- (20.5657,-188.9922) .. controls (19.9133,-188.3398) and (20.9571,-187.2961) .. (21.6095,-187.9484) -- (21.9823,-188.3212) -- cycle;
\dcgq{20.5657}{-187.9484}{3}
\dcgk{20.4911}{-187.8739}{20.342}{-187.7248}
\dcgaj{24.7779}{-189.5247}{-188.9975}{25.8323}
\dcgbd{24.567}{-188.9975}{-188.4703}{-187.5477}{26.0432}
\dcgq{25.3051}{-187.7323}{3}
\dcgm{25.3051}{-187.6268}{-187.4159}
\dcgc{28.4043}{-188.8431}{28.7771}{-188.4703}{29.1498}{-189.5887}{29.5226}{-189.2159}
\draw[dcb] (28.628,-188.3212) -- (29.0007,-187.9484) .. controls (29.6531,-187.2961) and (30.6969,-188.3398) .. (30.0445,-188.9922) -- (29.6717,-189.365) -- cycle;
\dcgq{30.0445}{-187.9484}{3}
\dcgk{30.1191}{-187.8739}{30.2682}{-187.7248}
\dcgak{-1.0544}{-191.3699}{-0.4745}{-192.4242}
\draw[dcb] (-0.6326,-191.159) .. controls (-0.2109,-191.159) and (0.2109,-191.405) .. (0.6326,-191.8971) .. controls (0.2109,-192.3891) and (-0.2109,-192.6351) .. (-0.6326,-192.6351) .. controls (-0.3515,-192.1431) and (-0.3515,-191.651) .. (-0.6326,-191.159) -- cycle;
\dcgq{0.7381}{-191.8971}{3}
\dcgo{0.8435}{-191.8971}{1.0544}
\dcgc{3.8447}{-190.7787}{4.2548}{-191.1888}{3.0992}{-191.5243}{3.5092}{-191.9343}
\draw[dcb] (4.2921,-190.9278) .. controls (4.5903,-191.226) and (4.7146,-191.6982) .. (4.6649,-192.3444) .. controls (4.0187,-192.3941) and (3.5465,-192.2698) .. (3.2483,-191.9716) .. controls (3.795,-191.8225) and (4.143,-191.4746) .. (4.2921,-190.9278) -- cycle;
\dcgq{4.7394}{-192.4189}{3}
\dcgk{4.814}{-192.4935}{4.9631}{-192.6426}
\dcgaj{8.9622}{-190.8427}{-191.4226}{7.9078}
\draw[dcb] (9.1731,-191.2644) .. controls (9.1731,-191.6862) and (8.9271,-192.1079) .. (8.435,-192.5297) .. controls (7.943,-192.1079) and (7.697,-191.6862) .. (7.697,-191.2644) .. controls (8.189,-191.5456) and (8.6811,-191.5456) .. (9.1731,-191.2644) -- cycle;
\dcgq{8.435}{-192.6351}{3}
\dcgm{8.435}{-192.7406}{-192.9514}
\dcgc{13.7709}{-191.5243}{13.3608}{-191.9343}{13.0253}{-190.7787}{12.6153}{-191.1888}
\draw[dcb] (13.6218,-191.9716) .. controls (13.3236,-192.2698) and (12.8514,-192.3941) .. (12.2052,-192.3444) .. controls (12.1555,-191.6982) and (12.2798,-191.226) .. (12.578,-190.9278) .. controls (12.7271,-191.4746) and (13.075,-191.8225) .. (13.6218,-191.9716) -- cycle;
\dcgq{12.1307}{-192.4189}{3}
\dcgk{12.0561}{-192.4935}{11.907}{-192.6426}
\dcgak{17.9244}{-192.4242}{17.3445}{-191.3699}
\draw[dcb] (17.5027,-192.6351) .. controls (17.0809,-192.6351) and (16.6592,-192.3891) .. (16.2374,-191.8971) .. controls (16.6592,-191.405) and (17.0809,-191.159) .. (17.5027,-191.159) .. controls (17.2215,-191.651) and (17.2215,-192.1431) .. (17.5027,-192.6351) -- cycle;
\dcgq{16.132}{-191.8971}{3}
\dcgo{16.0266}{-191.8971}{15.8157}
\dcgc{21.4604}{-193.0154}{21.0503}{-192.6053}{22.2059}{-192.2698}{21.7959}{-191.8598}
\draw[dcb] (21.013,-192.8663) .. controls (20.7148,-192.5681) and (20.5905,-192.0959) .. (20.6403,-191.4497) .. controls (21.2864,-191.4) and (21.7586,-191.5243) .. (22.0568,-191.8225) .. controls (21.5101,-191.9716) and (21.1621,-192.3195) .. (21.013,-192.8663) -- cycle;
\dcgq{20.5657}{-191.3752}{3}
\dcgk{20.4911}{-191.3006}{20.342}{-191.1515}
\dcgaj{24.7779}{-192.9514}{-192.3715}{25.8323}
\draw[dcb] (24.567,-192.5297) .. controls (24.567,-192.1079) and (24.8131,-191.6862) .. (25.3051,-191.2644) .. controls (25.7971,-191.6862) and (26.0432,-192.1079) .. (26.0432,-192.5297) .. controls (25.5511,-192.2485) and (25.0591,-192.2485) .. (24.567,-192.5297) -- cycle;
\dcgq{25.3051}{-191.159}{3}
\dcgm{25.3051}{-191.0535}{-190.8427}
\dcgc{28.4043}{-192.2698}{28.8143}{-191.8598}{29.1498}{-193.0154}{29.5599}{-192.6053}
\draw[dcb] (28.5534,-191.8225) .. controls (28.8516,-191.5243) and (29.3238,-191.4) .. (29.97,-191.4497) .. controls (30.0197,-192.0959) and (29.8954,-192.5681) .. (29.5972,-192.8663) .. controls (29.4481,-192.3195) and (29.1001,-191.9716) .. (28.5534,-191.8225) -- cycle;
\dcgq{30.0445}{-191.3752}{3}
\dcgk{30.1191}{-191.3006}{30.2682}{-191.1515}
\dcgak{-1.0544}{-194.7966}{-0.4745}{-195.851}
\draw[dcb] (-0.6326,-194.5857) .. controls (-0.2109,-194.5857) and (0.2109,-194.8317) .. (0.6326,-195.3238) .. controls (0.2109,-195.8158) and (-0.2109,-196.0619) .. (-0.6326,-196.0619) .. controls (-0.3515,-195.5698) and (-0.3515,-195.0778) .. (-0.6326,-194.5857) -- cycle;
\dcgbe{-0.7908}{-194.5857}{-0.5096}{-195.0778}{-195.5698}{-196.0619}
\dcgo{0.6326}{-195.3238}{1.0544}
\dcgc{3.8447}{-194.2054}{4.2548}{-194.6155}{3.0992}{-194.951}{3.5092}{-195.3611}
\draw[dcb] (4.2921,-194.3546) .. controls (4.5903,-194.6528) and (4.7146,-195.125) .. (4.6649,-195.7711) .. controls (4.0187,-195.8208) and (3.5465,-195.6966) .. (3.2483,-195.3983) .. controls (3.795,-195.2492) and (4.143,-194.9013) .. (4.2921,-194.3546) -- cycle;
\dcgbf{4.1802}{-194.2427}{4.0311}{-194.7895}{3.6832}{-195.1374}{3.1365}{-195.2865}
\dcgk{4.6649}{-195.7711}{4.9631}{-196.0693}
\dcgaj{8.9622}{-194.2694}{-194.8493}{7.9078}
\draw[dcb] (9.1731,-194.6912) .. controls (9.1731,-195.1129) and (8.9271,-195.5347) .. (8.435,-195.9564) .. controls (7.943,-195.5347) and (7.697,-195.1129) .. (7.697,-194.6912) .. controls (8.189,-194.9723) and (8.6811,-194.9723) .. (9.1731,-194.6912) -- cycle;
\dcgbg{9.1731}{-194.533}{8.6811}{-194.8142}{8.189}{7.697}
\dcgm{8.435}{-195.9564}{-196.3782}
\dcgc{13.7709}{-194.951}{13.3608}{-195.3611}{13.0253}{-194.2054}{12.6153}{-194.6155}
\draw[dcb] (13.6218,-195.3983) .. controls (13.3236,-195.6966) and (12.8514,-195.8208) .. (12.2052,-195.7711) .. controls (12.1555,-195.125) and (12.2798,-194.6528) .. (12.578,-194.3546) .. controls (12.7271,-194.9013) and (13.075,-195.2492) .. (13.6218,-195.3983) -- cycle;
\dcgbf{13.7336}{-195.2865}{13.1869}{-195.1374}{12.8389}{-194.7895}{12.6898}{-194.2427}
\dcgk{12.2052}{-195.7711}{11.907}{-196.0693}
\dcgak{17.9244}{-195.851}{17.3445}{-194.7966}
\draw[dcb] (17.5027,-196.0619) .. controls (17.0809,-196.0619) and (16.6592,-195.8158) .. (16.2374,-195.3238) .. controls (16.6592,-194.8317) and (17.0809,-194.5857) .. (17.5027,-194.5857) .. controls (17.2215,-195.0778) and (17.2215,-195.5698) .. (17.5027,-196.0619) -- cycle;
\dcgbe{17.6609}{-196.0619}{17.3797}{-195.5698}{-195.0778}{-194.5857}
\dcgo{16.2374}{-195.3238}{15.8157}
\dcgc{21.4604}{-196.4421}{21.0503}{-196.0321}{22.2059}{-195.6966}{21.7959}{-195.2865}
\draw[dcb] (21.013,-196.293) .. controls (20.7148,-195.9948) and (20.5905,-195.5226) .. (20.6403,-194.8765) .. controls (21.2864,-194.8267) and (21.7586,-194.951) .. (22.0568,-195.2492) .. controls (21.5101,-195.3983) and (21.1621,-195.7463) .. (21.013,-196.293) -- cycle;
\dcgbf{21.1249}{-196.4048}{21.274}{-195.8581}{21.6219}{-195.5102}{22.1686}{-195.3611}
\dcgk{20.6403}{-194.8765}{20.342}{-194.5782}
\dcgaj{24.7779}{-196.3782}{-195.7983}{25.8323}
\draw[dcb] (24.567,-195.9564) .. controls (24.567,-195.5347) and (24.8131,-195.1129) .. (25.3051,-194.6912) .. controls (25.7971,-195.1129) and (26.0432,-195.5347) .. (26.0432,-195.9564) .. controls (25.5511,-195.6752) and (25.0591,-195.6752) .. (24.567,-195.9564) -- cycle;
\dcgbg{24.567}{-196.1146}{25.0591}{-195.8334}{25.5511}{26.0432}
\dcgm{25.3051}{-194.6912}{-194.2694}
\dcgc{28.4043}{-195.6966}{28.8143}{-195.2865}{29.1498}{-196.4421}{29.5599}{-196.0321}
\draw[dcb] (28.5534,-195.2492) .. controls (28.8516,-194.951) and (29.3238,-194.8267) .. (29.97,-194.8765) .. controls (30.0197,-195.5226) and (29.8954,-195.9948) .. (29.5972,-196.293) .. controls (29.4481,-195.7463) and (29.1001,-195.3983) .. (28.5534,-195.2492) -- cycle;
\dcgbf{28.4416}{-195.3611}{28.9883}{-195.5102}{29.3362}{-195.8581}{29.4853}{-196.4048}
\dcgk{29.97}{-194.8765}{30.2682}{-194.5782}
\dcgak{-1.0544}{-198.2233}{-0.4745}{-199.2777}
\draw[dcb] (-0.6326,-198.0125) .. controls (-0.2109,-198.0125) and (0.2109,-198.2585) .. (0.6326,-198.7505) .. controls (0.2109,-199.2426) and (-0.2109,-199.4886) .. (-0.6326,-199.4886) .. controls (-0.3515,-198.9965) and (-0.3515,-198.5045) .. (-0.6326,-198.0125) -- cycle;
\dcgbe{-0.7908}{-198.0125}{-0.5096}{-198.5045}{-198.9965}{-199.4886}
\dcgq{0.7381}{-198.7505}{3}
\dcgo{0.8435}{-198.7505}{1.0544}
\dcgc{3.8447}{-197.6322}{4.2548}{-198.0422}{3.0992}{-198.3777}{3.5092}{-198.7878}
\draw[dcb] (4.2921,-197.7813) .. controls (4.5903,-198.0795) and (4.7146,-198.5517) .. (4.6649,-199.1979) .. controls (4.0187,-199.2476) and (3.5465,-199.1233) .. (3.2483,-198.8251) .. controls (3.795,-198.676) and (4.143,-198.328) .. (4.2921,-197.7813) -- cycle;
\dcgbf{4.1802}{-197.6695}{4.0311}{-198.2162}{3.6832}{-198.5641}{3.1365}{-198.7132}
\dcgq{4.7394}{-199.2724}{3}
\dcgk{4.814}{-199.347}{4.9631}{-199.4961}
\dcgaj{8.9622}{-197.6961}{-198.276}{7.9078}
\draw[dcb] (9.1731,-198.1179) .. controls (9.1731,-198.5396) and (8.9271,-198.9614) .. (8.435,-199.3831) .. controls (7.943,-198.9614) and (7.697,-198.5396) .. (7.697,-198.1179) .. controls (8.189,-198.3991) and (8.6811,-198.3991) .. (9.1731,-198.1179) -- cycle;
\dcgbg{9.1731}{-197.9597}{8.6811}{-198.2409}{8.189}{7.697}
\dcgq{8.435}{-199.4886}{3}
\dcgm{8.435}{-199.594}{-199.8049}
\dcgc{13.7709}{-198.3777}{13.3608}{-198.7878}{13.0253}{-197.6322}{12.6153}{-198.0422}
\draw[dcb] (13.6218,-198.8251) .. controls (13.3236,-199.1233) and (12.8514,-199.2476) .. (12.2052,-199.1979) .. controls (12.1555,-198.5517) and (12.2798,-198.0795) .. (12.578,-197.7813) .. controls (12.7271,-198.328) and (13.075,-198.676) .. (13.6218,-198.8251) -- cycle;
\dcgbf{13.7336}{-198.7132}{13.1869}{-198.5641}{12.8389}{-198.2162}{12.6898}{-197.6695}
\dcgq{12.1307}{-199.2724}{3}
\dcgk{12.0561}{-199.347}{11.907}{-199.4961}
\dcgak{17.9244}{-199.2777}{17.3445}{-198.2233}
\draw[dcb] (17.5027,-199.4886) .. controls (17.0809,-199.4886) and (16.6592,-199.2426) .. (16.2374,-198.7505) .. controls (16.6592,-198.2585) and (17.0809,-198.0125) .. (17.5027,-198.0125) .. controls (17.2215,-198.5045) and (17.2215,-198.9965) .. (17.5027,-199.4886) -- cycle;
\dcgbe{17.6609}{-199.4886}{17.3797}{-198.9965}{-198.5045}{-198.0125}
\dcgq{16.132}{-198.7505}{3}
\dcgo{16.0266}{-198.7505}{15.8157}
\dcgc{21.4604}{-199.8689}{21.0503}{-199.4588}{22.2059}{-199.1233}{21.7959}{-198.7132}
\draw[dcb] (21.013,-199.7197) .. controls (20.7148,-199.4215) and (20.5905,-198.9493) .. (20.6403,-198.3032) .. controls (21.2864,-198.2535) and (21.7586,-198.3777) .. (22.0568,-198.676) .. controls (21.5101,-198.8251) and (21.1621,-199.173) .. (21.013,-199.7197) -- cycle;
\dcgbf{21.1249}{-199.8316}{21.274}{-199.2848}{21.6219}{-198.9369}{22.1686}{-198.7878}
\dcgq{20.5657}{-198.2286}{3}
\dcgk{20.4911}{-198.1541}{20.342}{-198.005}
\dcgaj{24.7779}{-199.8049}{-199.225}{25.8323}
\draw[dcb] (24.567,-199.3831) .. controls (24.567,-198.9614) and (24.8131,-198.5396) .. (25.3051,-198.1179) .. controls (25.7971,-198.5396) and (26.0432,-198.9614) .. (26.0432,-199.3831) .. controls (25.5511,-199.102) and (25.0591,-199.102) .. (24.567,-199.3831) -- cycle;
\dcgbg{24.567}{-199.5413}{25.0591}{-199.2601}{25.5511}{26.0432}
\dcgq{25.3051}{-198.0125}{3}
\dcgm{25.3051}{-197.907}{-197.6961}
\dcgc{28.4043}{-199.1233}{28.8143}{-198.7132}{29.1498}{-199.8689}{29.5599}{-199.4588}
\draw[dcb] (28.5534,-198.676) .. controls (28.8516,-198.3777) and (29.3238,-198.2535) .. (29.97,-198.3032) .. controls (30.0197,-198.9493) and (29.8954,-199.4215) .. (29.5972,-199.7197) .. controls (29.4481,-199.173) and (29.1001,-198.8251) .. (28.5534,-198.676) -- cycle;
\dcgbf{28.4416}{-198.7878}{28.9883}{-198.9369}{29.3362}{-199.2848}{29.4853}{-199.8316}
\dcgq{30.0445}{-198.2286}{3}
\dcgk{30.1191}{-198.1541}{30.2682}{-198.005}
\dcgo{-1.0544}{-202.1773}{-0.5272}
\dcgx{-0.5272}{-201.5183}{0.5799}{-202.1773}{-202.8362}
\dcgo{0.5799}{-202.1773}{1.0544}
\dcgk{3.472}{-201.4317}{3.8447}{-201.8045}
\dcgy{4.3107}{-201.3385}{4.6276}{-202.5873}{3.3788}{-202.2704}
\dcgk{4.6276}{-202.5873}{4.9631}{-202.9228}
\dcgm{8.435}{-201.1229}{-201.6501}
\dcgz{9.094}{-201.6501}{8.435}{-202.7572}{7.776}
\dcgm{8.435}{-202.7572}{-203.2316}
\dcgk{13.3981}{-201.4317}{13.0253}{-201.8045}
\dcgy{13.4913}{-202.2704}{12.2425}{-202.5873}{12.5594}{-201.3385}
\dcgk{12.2425}{-202.5873}{11.907}{-202.9228}
\dcgo{17.9244}{-202.1773}{17.3973}
\dcgx{17.3973}{-202.8362}{16.2902}{-202.1773}{-201.5183}
\dcgo{16.2902}{-202.1773}{15.8157}
\dcgk{21.8331}{-202.9228}{21.4604}{-202.55}
\dcgy{20.9944}{-203.016}{20.6775}{-201.7672}{21.9263}{-202.0841}
\dcgk{20.6775}{-201.7672}{20.342}{-201.4317}
\dcgm{25.3051}{-203.2316}{-202.7044}
\dcgz{24.6461}{-202.7044}{25.3051}{-201.5973}{25.9641}
\dcgm{25.3051}{-201.5973}{-201.1229}
\dcgk{28.7771}{-202.9228}{29.1498}{-202.55}
\dcgy{28.6839}{-202.0841}{29.9327}{-201.7672}{29.6158}{-203.016}
\dcgk{29.9327}{-201.7672}{30.2682}{-201.4317}
\dcgo{-1.0544}{-205.604}{-0.1318}
\dcgq{0}{-205.604}{3.75}
\dcgk{3.472}{-204.8584}{4.1243}{-205.5108}
\dcgq{4.2175}{-205.604}{3.75}
\dcgm{8.435}{-204.5496}{-205.4722}
\dcgq{8.435}{-205.604}{3.75}
\dcgk{13.3981}{-204.8584}{12.7457}{-205.5108}
\dcgq{12.6526}{-205.604}{3.75}
\dcgo{17.9244}{-205.604}{17.0019}
\dcgq{16.8701}{-205.604}{3.75}
\dcgk{21.8331}{-206.3495}{21.1808}{-205.6972}
\dcgq{21.0876}{-205.604}{3.75}
\dcgm{25.3051}{-206.6584}{-205.7358}
\dcgq{25.3051}{-205.604}{3.75}
\dcgk{28.7771}{-206.3495}{29.4294}{-205.6972}
\dcgq{29.5226}{-205.604}{3.75}
\dcgm{0}{-210.0851}{-209.1625}
\dcgq{0}{-209.0307}{3.75}
\dcgk{3.472}{-209.7763}{4.1243}{-209.1239}
\dcgq{4.2175}{-209.0307}{3.75}
\dcgo{7.3807}{-209.0307}{8.3032}
\dcgq{8.435}{-209.0307}{3.75}
\dcgk{11.907}{-208.2852}{12.5594}{-208.9375}
\dcgq{12.6526}{-209.0307}{3.75}
\dcgm{16.8701}{-207.9763}{-208.8989}
\dcgq{16.8701}{-209.0307}{3.75}
\dcgk{21.8331}{-208.2852}{21.1808}{-208.9375}
\dcgq{21.0876}{-209.0307}{3.75}
\dcgo{26.3595}{-209.0307}{25.4369}
\dcgq{25.3051}{-209.0307}{3.75}
\dcgk{30.2682}{-209.7763}{29.6158}{-209.1239}
\dcgq{29.5226}{-209.0307}{3.75}
\dcgb{-0.4745}{-211.6667}{0.4745}{-213.2482}
\dcgo{-1.0544}{-211.9303}{-0.1318}
\dcgq{-0.0791}{-211.9303}{2.25}
\dcgo{-1.0544}{-212.9846}{-0.1318}
\dcgq{-0.0791}{-212.9846}{2.25}
\dcgd{4.4412}{-211.5628}{5.1122}{-212.2338}{3.9938}{-213.3521}{3.3228}{-212.6811}
\dcgk{3.8447}{-211.3391}{4.4971}{-211.9915}
\dcgq{4.5344}{-212.0288}{2.25}
\dcgk{3.0992}{-212.0847}{3.7515}{-212.737}
\dcgq{3.7888}{-212.7743}{2.25}
\dcgf{9.2258}{-211.983}{-212.9319}{7.6443}
\dcgm{8.9622}{-211.4031}{-212.3257}
\dcgq{8.9622}{-212.3784}{2.25}
\dcgm{7.9078}{-211.4031}{-212.3257}
\dcgq{7.9078}{-212.3784}{2.25}
\dcgd{13.5472}{-212.6811}{12.8762}{-213.3521}{11.7579}{-212.2338}{12.4289}{-211.5628}
\dcgk{13.7709}{-212.0847}{13.1185}{-212.737}
\dcgq{13.0812}{-212.7743}{2.25}
\dcgk{13.0253}{-211.3391}{12.373}{-211.9915}
\dcgq{12.3357}{-212.0288}{2.25}
\dcgb{17.3445}{-213.2482}{16.3956}{-211.6667}
\dcgo{17.9244}{-212.9846}{17.0019}
\dcgq{16.9491}{-212.9846}{2.25}
\dcgo{17.9244}{-211.9303}{17.0019}
\dcgq{16.9491}{-211.9303}{2.25}
\dcgd{20.8639}{-213.3521}{20.1929}{-212.6811}{21.3113}{-211.5628}{21.9823}{-212.2338}
\dcgk{21.4604}{-213.5758}{20.808}{-212.9234}
\dcgq{20.7707}{-212.8861}{2.25}
\dcgk{22.2059}{-212.8302}{21.5536}{-212.1779}
\dcgq{21.5163}{-212.1406}{2.25}
\dcgf{24.5143}{-212.9319}{-211.983}{26.0959}
\dcgm{24.7779}{-213.5118}{-212.5892}
\dcgq{24.7779}{-212.5365}{2.25}
\dcgm{25.8323}{-213.5118}{-212.5892}
\dcgq{25.8323}{-212.5365}{2.25}
\dcgd{28.628}{-212.2338}{29.299}{-211.5628}{30.4173}{-212.6811}{29.7463}{-213.3521}
\dcgk{28.4043}{-212.8302}{29.0566}{-212.1779}
\dcgq{29.0939}{-212.1406}{2.25}
\dcgk{29.1498}{-213.5758}{29.8022}{-212.9234}
\dcgq{29.8395}{-212.8861}{2.25}
\dcgb{-0.4745}{-215.0934}{0.4745}{-216.675}
\dcgo{-1.0544}{-215.357}{-0.1318}
\dcgq{-0.0791}{-215.357}{2.25}
\dcgo{-1.0544}{-215.8842}{-0.1318}
\dcgq{-0.0791}{-215.8842}{2.25}
\dcgo{-1.0544}{-216.4114}{-0.1318}
\dcgq{-0.0791}{-216.4114}{2.25}
\dcgd{4.4412}{-214.9895}{5.1122}{-215.6605}{3.9938}{-216.7789}{3.3228}{-216.1079}
\dcgk{3.8447}{-214.7658}{4.4971}{-215.4182}
\dcgq{4.5344}{-215.4555}{2.25}
\dcgk{3.472}{-215.1386}{4.1243}{-215.791}
\dcgq{4.1616}{-215.8283}{2.25}
\dcgk{3.0992}{-215.5114}{3.7515}{-216.1638}
\dcgq{3.7888}{-216.201}{2.25}
\dcgf{9.2258}{-215.4097}{-216.3587}{7.6443}
\dcgm{8.9622}{-214.8298}{-215.7524}
\dcgq{8.9622}{-215.8051}{2.25}
\dcgm{8.435}{-214.8298}{-215.7524}
\dcgq{8.435}{-215.8051}{2.25}
\dcgm{7.9078}{-214.8298}{-215.7524}
\dcgq{7.9078}{-215.8051}{2.25}
\dcgd{13.5472}{-216.1079}{12.8762}{-216.7789}{11.7579}{-215.6605}{12.4289}{-214.9895}
\dcgk{13.7709}{-215.5114}{13.1185}{-216.1638}
\dcgq{13.0812}{-216.201}{2.25}
\dcgk{13.3981}{-215.1386}{12.7457}{-215.791}
\dcgq{12.7085}{-215.8283}{2.25}
\dcgk{13.0253}{-214.7658}{12.373}{-215.4182}
\dcgq{12.3357}{-215.4555}{2.25}
\dcgb{17.3445}{-216.675}{16.3956}{-215.0934}
\dcgo{17.9244}{-216.4114}{17.0019}
\dcgq{16.9491}{-216.4114}{2.25}
\dcgo{17.9244}{-215.8842}{17.0019}
\dcgq{16.9491}{-215.8842}{2.25}
\dcgo{17.9244}{-215.357}{17.0019}
\dcgq{16.9491}{-215.357}{2.25}
\dcgd{20.8639}{-216.7789}{20.1929}{-216.1079}{21.3113}{-214.9895}{21.9823}{-215.6605}
\dcgk{21.4604}{-217.0025}{20.808}{-216.3502}
\dcgq{20.7707}{-216.3129}{2.25}
\dcgk{21.8331}{-216.6297}{21.1808}{-215.9774}
\dcgq{21.1435}{-215.9401}{2.25}
\dcgk{22.2059}{-216.257}{21.5536}{-215.6046}
\dcgq{21.5163}{-215.5673}{2.25}
\dcgf{24.5143}{-216.3587}{-215.4097}{26.0959}
\dcgm{24.7779}{-216.9386}{-216.016}
\dcgq{24.7779}{-215.9633}{2.25}
\dcgm{25.3051}{-216.9386}{-216.016}
\dcgq{25.3051}{-215.9633}{2.25}
\dcgm{25.8323}{-216.9386}{-216.016}
\dcgq{25.8323}{-215.9633}{2.25}
\dcgd{28.628}{-215.6605}{29.299}{-214.9895}{30.4173}{-216.1079}{29.7463}{-216.7789}
\dcgk{28.4043}{-216.257}{29.0566}{-215.6046}
\dcgq{29.0939}{-215.5673}{2.25}
\dcgk{28.7771}{-216.6297}{29.4294}{-215.9774}
\dcgq{29.4667}{-215.9401}{2.25}
\dcgk{29.1498}{-217.0025}{29.8022}{-216.3502}
\dcgq{29.8395}{-216.3129}{2.25}
\dcgo{-1.0544}{-219.3109}{-0.5272}
\dcgbh{-0.5272}{-218.9946}{0.2636}{0.5799}{-219.3109}{-219.6272}
\dcgk{3.472}{-218.5654}{3.8447}{-218.9381}
\draw[dcb] (4.0684,-218.7145) -- (4.6276,-219.2736) -- (4.6276,-219.721) -- (4.1802,-219.721) -- (3.6211,-219.1618) -- cycle;
\dcgm{8.435}{-218.2565}{-218.7837}
\dcgbi{8.7513}{-218.7837}{-219.5745}{8.435}{-219.8908}{8.1187}
\dcgk{13.3981}{-218.5654}{13.0253}{-218.9381}
\draw[dcb] (13.249,-219.1618) -- (12.6898,-219.721) -- (12.2425,-219.721) -- (12.2425,-219.2736) -- (12.8017,-218.7145) -- cycle;
\dcgo{17.9244}{-219.3109}{17.3973}
\dcgbh{17.3973}{-219.6272}{16.6065}{16.2902}{-219.3109}{-218.9946}
\dcgk{21.8331}{-220.0565}{21.4604}{-219.6837}
\draw[dcb] (21.2367,-219.9074) -- (20.6775,-219.3482) -- (20.6775,-218.9009) -- (21.1249,-218.9009) -- (21.684,-219.46) -- cycle;
\dcgm{25.3051}{-220.3653}{-219.8381}
\dcgbi{24.9888}{-219.8381}{-219.0473}{25.3051}{-218.731}{25.6214}
\dcgk{28.7771}{-220.0565}{29.1498}{-219.6837}
\draw[dcb] (28.9262,-219.46) -- (29.4853,-218.9009) -- (29.9327,-218.9009) -- (29.9327,-219.3482) -- (29.3735,-219.9074) -- cycle;
\dcga{-1.0544}{-222.7377}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-222.5004}{0.5272}{-222.9749}
\dcgo{-0.5272}{-222.7377}{0.5272}
\dcgc{3.472}{-221.9921}{3.8447}{-222.3649}{4.5903}{-223.1104}{4.9631}{-223.4832}
\dcgd{4.0125}{-222.1971}{4.758}{-222.9427}{4.4225}{-223.2782}{3.677}{-222.5326}
\dcgk{3.8447}{-222.3649}{4.5903}{-223.1104}
\dcge{8.435}{-221.6833}{-222.2105}{-223.2648}{-223.792}
\dcgf{8.6723}{-222.2105}{-223.2648}{8.1978}
\dcgm{8.435}{-222.2105}{-223.2648}
\dcgc{13.3981}{-221.9921}{13.0253}{-222.3649}{12.2798}{-223.1104}{11.907}{-223.4832}
\dcgd{13.1931}{-222.5326}{12.4475}{-223.2782}{12.112}{-222.9427}{12.8576}{-222.1971}
\dcgk{13.0253}{-222.3649}{12.2798}{-223.1104}
\dcga{17.9244}{-222.7377}{17.3973}{16.3429}{15.8157}
\dcgb{17.3973}{-222.9749}{16.3429}{-222.5004}
\dcgo{17.3973}{-222.7377}{16.3429}
\dcgc{21.8331}{-223.4832}{21.4604}{-223.1104}{20.7148}{-222.3649}{20.342}{-221.9921}
\dcgd{21.2926}{-223.2782}{20.5471}{-222.5326}{20.8826}{-222.1971}{21.6281}{-222.9427}
\dcgk{21.4604}{-223.1104}{20.7148}{-222.3649}
\dcge{25.3051}{-223.792}{-223.2648}{-222.2105}{-221.6833}
\dcgf{25.0679}{-223.2648}{-222.2105}{25.5423}
\dcgm{25.3051}{-223.2648}{-222.2105}
\dcgc{28.7771}{-223.4832}{29.1498}{-223.1104}{29.8954}{-222.3649}{30.2682}{-221.9921}
\dcgd{28.9821}{-222.9427}{29.7277}{-222.1971}{30.0632}{-222.5326}{29.3176}{-223.2782}
\dcgk{29.1498}{-223.1104}{29.8954}{-222.3649}
\dcga{-1.0544}{-226.1644}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-226.1644}{15}
\dcgbj{-0.369}{-225.7954}{0.369}{-226.5334}
\dcgc{3.472}{-225.4188}{3.8447}{-225.7916}{4.5903}{-226.5372}{4.9631}{-226.9099}
\dcgq{4.2175}{-226.1644}{15}
\draw[dca] (4.2175,-225.6425) -- (4.2175,-226.6863) (3.6956,-226.1644) -- (4.7394,-226.1644);
\dcge{8.435}{-225.11}{-225.6372}{-226.6916}{-227.2188}
\dcgq{8.435}{-226.1644}{15}
\dcgbk{8.8041}{-225.7954}{8.066}{-226.5334}
\dcgc{13.3981}{-225.4188}{13.0253}{-225.7916}{12.2798}{-226.5372}{11.907}{-226.9099}
\dcgq{12.6526}{-226.1644}{15}
\draw[dca] (13.1744,-226.1644) -- (12.1307,-226.1644) (12.6526,-225.6425) -- (12.6526,-226.6863);
\dcga{17.9244}{-226.1644}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-226.1644}{15}
\dcgbj{17.2391}{-226.5334}{16.501}{-225.7954}
\dcgc{21.8331}{-226.9099}{21.4604}{-226.5372}{20.7148}{-225.7916}{20.342}{-225.4188}
\dcgq{21.0876}{-226.1644}{15}
\draw[dca] (21.0876,-226.6863) -- (21.0876,-225.6425) (21.6095,-226.1644) -- (20.5657,-226.1644);
\dcge{25.3051}{-227.2188}{-226.6916}{-225.6372}{-225.11}
\dcgq{25.3051}{-226.1644}{15}
\dcgbk{24.9361}{-226.5334}{25.6741}{-225.7954}
\dcgc{28.7771}{-226.9099}{29.1498}{-226.5372}{29.8954}{-225.7916}{30.2682}{-225.4188}
\dcgq{29.5226}{-226.1644}{15}
\draw[dca] (29.0007,-226.1644) -- (30.0445,-226.1644) (29.5226,-226.6863) -- (29.5226,-225.6425);
\dcga{-1.0544}{-229.5911}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-229.5911}{15}
\dcgai{-0.2327}{-229.204}{0.2327}{-229.942}
\node[dcc] at (0,-229.6175) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">M</text></g>}{M}};
\dcgc{3.472}{-228.8456}{3.8447}{-229.2183}{4.5903}{-229.9639}{4.9631}{-230.3367}
\dcgq{4.2175}{-229.5911}{15}
\dcgai{3.8048}{-229.1528}{4.6558}{-230.0038}
\node[dcd] at (4.1989,-229.6098) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">M</text></g>}{M}};
\dcge{8.435}{-228.5367}{-229.0639}{-230.1183}{-230.6455}
\dcgq{8.435}{-229.5911}{15}
\dcgai{8.0841}{-229.3584}{8.8222}{-229.8238}
\node[dce] at (8.4087,-229.5911) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">M</text></g>}{M}};
\dcgc{13.3981}{-228.8456}{13.0253}{-229.2183}{12.2798}{-229.9639}{11.907}{-230.3367}
\dcgq{12.6526}{-229.5911}{15}
\dcgai{12.2399}{-229.1784}{13.0909}{-230.0294}
\node[dcf] at (12.6339,-229.5725) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">M</text></g>}{M}};
\dcga{17.9244}{-229.5911}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-229.5911}{15}
\dcgai{16.6374}{-229.2402}{17.1028}{-229.9783}
\node[dcg] at (16.8701,-229.5648) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">M</text></g>}{M}};
\dcgc{21.8331}{-230.3367}{21.4604}{-229.9639}{20.7148}{-229.2183}{20.342}{-228.8456}
\dcgq{21.0876}{-229.5911}{15}
\dcgai{20.6493}{-229.1784}{21.5003}{-230.0294}
\node[dch] at (21.1062,-229.5725) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">M</text></g>}{M}};
\dcge{25.3051}{-230.6455}{-230.1183}{-229.0639}{-228.5367}
\dcgq{25.3051}{-229.5911}{15}
\dcgai{24.918}{-229.3584}{25.656}{-229.8238}
\node[dci] at (25.3315,-229.5911) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">M</text></g>}{M}};
\dcgc{28.7771}{-230.3367}{29.1498}{-229.9639}{29.8954}{-229.2183}{30.2682}{-228.8456}
\dcgq{29.5226}{-229.5911}{15}
\dcgai{29.0843}{-229.1528}{29.9353}{-230.0038}
\node[dcj] at (29.5413,-229.6098) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="20">M</text></g>}{M}};
\dcga{-1.0544}{-233.0178}{-0.3163}{0.3163}{1.0544}
\dcgb{-0.3163}{-232.8333}{0.3163}{-233.2024}
\dcgbl{-0.3163}{-232.8333}{-0.5535}{-232.4907}{0.5535}{0.3163}
\dcgc{3.472}{-232.2723}{3.9938}{-232.7942}{4.4412}{-233.2415}{4.9631}{-233.7634}
\dcgd{4.1243}{-232.6637}{4.5717}{-233.111}{4.3107}{-233.372}{3.8634}{-232.9247}
\dcgd{4.1243}{-232.6637}{4.1989}{-232.2537}{4.9817}{-233.0365}{4.5717}{-233.111}
\dcge{8.435}{-231.9635}{-232.7015}{-233.3342}{-234.0722}
\dcgf{8.6196}{-232.7015}{-233.3342}{8.2505}
\draw[dcb] (8.6196,-232.7015) -- (8.9622,-232.4643) -- (8.9622,-233.5714) -- (8.6196,-233.3342) -- cycle;
\dcgc{13.3981}{-232.2723}{12.8762}{-232.7942}{12.4289}{-233.2415}{11.907}{-233.7634}
\dcgd{13.0067}{-232.9247}{12.5594}{-233.372}{12.2984}{-233.111}{12.7457}{-232.6637}
\dcgd{13.0067}{-232.9247}{13.4168}{-232.9992}{12.6339}{-233.782}{12.5594}{-233.372}
\dcga{17.9244}{-233.0178}{17.1864}{16.5538}{15.8157}
\dcgb{17.1864}{-233.2024}{16.5538}{-232.8333}
\dcgbl{17.1864}{-233.2024}{17.4236}{-233.545}{16.3165}{16.5538}
\dcgc{21.8331}{-233.7634}{21.3113}{-233.2415}{20.8639}{-232.7942}{20.342}{-232.2723}
\dcgd{21.1808}{-233.372}{20.7334}{-232.9247}{20.9944}{-232.6637}{21.4417}{-233.111}
\dcgd{21.1808}{-233.372}{21.1062}{-233.782}{20.3234}{-232.9992}{20.7334}{-232.9247}
\dcge{25.3051}{-234.0722}{-233.3342}{-232.7015}{-231.9635}
\dcgf{25.1206}{-233.3342}{-232.7015}{25.4896}
\draw[dcb] (25.1206,-233.3342) -- (24.7779,-233.5714) -- (24.7779,-232.4643) -- (25.1206,-232.7015) -- cycle;
\dcgc{28.7771}{-233.7634}{29.299}{-233.2415}{29.7463}{-232.7942}{30.2682}{-232.2723}
\dcgd{29.1685}{-233.111}{29.6158}{-232.6637}{29.8768}{-232.9247}{29.4294}{-233.372}
\dcgd{29.1685}{-233.111}{28.7584}{-233.0365}{29.5413}{-232.2537}{29.6158}{-232.6637}
\dcga{-1.0544}{-236.4446}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-236.1283}{0.5272}{-236.7609}
\draw[dca] (-0.2636,-235.9438) .. controls (-0.0879,-235.768) and (0.0879,-235.768) .. (0.2636,-235.9438) (-0.3954,-235.7856) .. controls (-0.1318,-235.522) and (0.1318,-235.522) .. (0.3954,-235.7856);
\dcgc{3.472}{-235.699}{3.8447}{-236.0718}{4.5903}{-236.8174}{4.9631}{-237.1901}
\dcgd{4.0684}{-235.8481}{4.814}{-236.5937}{4.3666}{-237.041}{3.6211}{-236.2955}
\draw[dca] (4.3853,-235.9041) .. controls (4.6338,-235.9041) and (4.758,-236.0283) .. (4.758,-236.2768) (4.4039,-235.699) .. controls (4.7767,-235.699) and (4.9631,-235.8854) .. (4.9631,-236.2582);
\dcge{8.435}{-235.3902}{-235.9174}{-236.9718}{-237.499}
\dcgf{8.7513}{-235.9174}{-236.9718}{8.1187}
\draw[dca] (8.9359,-236.181) .. controls (9.1116,-236.3567) and (9.1116,-236.5324) .. (8.9359,-236.7082) (9.094,-236.0492) .. controls (9.3576,-236.3128) and (9.3576,-236.5764) .. (9.094,-236.84);
\dcgc{13.3981}{-235.699}{13.0253}{-236.0718}{12.2798}{-236.8174}{11.907}{-237.1901}
\dcgd{13.249}{-236.2955}{12.5034}{-237.041}{12.0561}{-236.5937}{12.8017}{-235.8481}
\draw[dca] (13.1931,-236.6123) .. controls (13.1931,-236.8609) and (13.0688,-236.9851) .. (12.8203,-236.9851) (13.3981,-236.631) .. controls (13.3981,-237.0038) and (13.2117,-237.1901) .. (12.8389,-237.1901);
\dcga{17.9244}{-236.4446}{17.3973}{16.3429}{15.8157}
\dcgb{17.3973}{-236.7609}{16.3429}{-236.1283}
\draw[dca] (17.1337,-236.9454) .. controls (16.9579,-237.1211) and (16.7822,-237.1211) .. (16.6065,-236.9454) (17.2655,-237.1036) .. controls (17.0019,-237.3672) and (16.7383,-237.3672) .. (16.4747,-237.1036);
\dcgc{21.8331}{-237.1901}{21.4604}{-236.8174}{20.7148}{-236.0718}{20.342}{-235.699}
\dcgd{21.2367}{-237.041}{20.4911}{-236.2955}{20.9385}{-235.8481}{21.684}{-236.5937}
\draw[dca] (20.9198,-236.9851) .. controls (20.6713,-236.9851) and (20.5471,-236.8609) .. (20.5471,-236.6123) (20.9012,-237.1901) .. controls (20.5284,-237.1901) and (20.342,-237.0038) .. (20.342,-236.631);
\dcge{25.3051}{-237.499}{-236.9718}{-235.9174}{-235.3902}
\dcgf{24.9888}{-236.9718}{-235.9174}{25.6214}
\draw[dca] (24.8043,-236.7082) .. controls (24.6285,-236.5324) and (24.6285,-236.3567) .. (24.8043,-236.181) (24.6461,-236.84) .. controls (24.3825,-236.5764) and (24.3825,-236.3128) .. (24.6461,-236.0492);
\dcgc{28.7771}{-237.1901}{29.1498}{-236.8174}{29.8954}{-236.0718}{30.2682}{-235.699}
\dcgd{28.9262}{-236.5937}{29.6717}{-235.8481}{30.1191}{-236.2955}{29.3735}{-237.041}
\draw[dca] (28.9821,-236.2768) .. controls (28.9821,-236.0283) and (29.1064,-235.9041) .. (29.3549,-235.9041) (28.7771,-236.2582) .. controls (28.7771,-235.8854) and (28.9635,-235.699) .. (29.3362,-235.699);
\dcga{-1.0544}{-239.8713}{-0.5272}{0.5272}{1.0544}
\dcgq{0}{-239.8713}{18}
\dcgai{-0.5472}{-239.5933}{0.551}{-240.0678}
\node[text=dcColor0, font=\fontsize{9.75}{12.675}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (0,-239.8713) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="13">BLOCK</text></g>}{BLOCK}};
\dcgc{3.472}{-239.1258}{3.8447}{-239.4985}{4.5903}{-240.2441}{4.9631}{-240.6169}
\dcgq{4.2175}{-239.8713}{18}
\dcgai{3.6917}{-239.2878}{4.8037}{-240.3998}
\node[text=dcColor0, font=\fontsize{9.75}{12.675}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-45] at (4.2175,-239.8713) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="13">BLOCK</text></g>}{BLOCK}};
\dcge{8.435}{-238.8169}{-239.3441}{-240.3985}{-240.9257}
\dcgq{8.435}{-239.8713}{18}
\dcgai{8.2386}{-239.3242}{8.713}{-240.4223}
\node[text=dcColor0, font=\fontsize{9.75}{12.675}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-90] at (8.435,-239.8713) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="13">BLOCK</text></g>}{BLOCK}};
\dcgc{13.3981}{-239.1258}{13.0253}{-239.4985}{12.2798}{-240.2441}{11.907}{-240.6169}
\dcgq{12.6526}{-239.8713}{18}
\dcgai{12.124}{-239.3455}{13.236}{-240.4575}
\node[text=dcColor0, font=\fontsize{9.75}{12.675}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-135] at (12.6526,-239.8713) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="13">BLOCK</text></g>}{BLOCK}};
\dcga{17.9244}{-239.8713}{17.3973}{16.3429}{15.8157}
\dcgq{16.8701}{-239.8713}{18}
\dcgai{16.3191}{-239.6749}{17.4172}{-240.1493}
\node[text=dcColor0, font=\fontsize{9.75}{12.675}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-180] at (16.8701,-239.8713) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="13">BLOCK</text></g>}{BLOCK}};
\dcgc{21.8331}{-240.6169}{21.4604}{-240.2441}{20.7148}{-239.4985}{20.342}{-239.1258}
\dcgq{21.0876}{-239.8713}{18}
\dcgai{20.5014}{-239.3428}{21.6134}{-240.4548}
\node[text=dcColor0, font=\fontsize{9.75}{12.675}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-225] at (21.0876,-239.8713) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="13">BLOCK</text></g>}{BLOCK}};
\dcge{25.3051}{-240.9257}{-240.3985}{-239.3441}{-238.8169}
\dcgq{25.3051}{-239.8713}{18}
\dcgai{25.0271}{-239.3204}{25.5016}{-240.4185}
\node[text=dcColor0, font=\fontsize{9.75}{12.675}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-270] at (25.3051,-239.8713) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="13">BLOCK</text></g>}{BLOCK}};
\dcgc{28.7771}{-240.6169}{29.1498}{-240.2441}{29.8954}{-239.4985}{30.2682}{-239.1258}
\dcgq{29.5226}{-239.8713}{18}
\dcgai{28.9391}{-239.2851}{30.0511}{-240.3971}
\node[text=dcColor0, font=\fontsize{9.75}{12.675}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=-315] at (29.5226,-239.8713) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#171A20" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="13">BLOCK</text></g>}{BLOCK}};
\draw[dca] (-1.0544,-243.298) -- (-0.6326,-243.298) -- (-0.5272,-243.0608) -- (-0.3163,-243.5353) -- (-0.1054,-243.0608) -- (0.1054,-243.5353) -- (0.3163,-243.0608) -- (0.5272,-243.5353) -- (0.6326,-243.298) -- (1.0544,-243.298);
\draw[dca] (3.472,-242.5525) -- (3.7702,-242.8507) -- (4.0125,-242.7575) -- (3.8261,-243.2421) -- (4.3107,-243.0557) -- (4.1243,-243.5404) -- (4.6089,-243.354) -- (4.4225,-243.8386) -- (4.6649,-243.7454) -- (4.9631,-244.0436);
\draw[dca] (8.435,-242.2437) -- (8.435,-242.6654) -- (8.6723,-242.7709) -- (8.1978,-242.9817) -- (8.6723,-243.1926) -- (8.1978,-243.4035) -- (8.6723,-243.6144) -- (8.1978,-243.8252) -- (8.435,-243.9307) -- (8.435,-244.3524);
\draw[dca] (13.3981,-242.5525) -- (13.0999,-242.8507) -- (13.1931,-243.093) -- (12.7085,-242.9066) -- (12.8949,-243.3912) -- (12.4102,-243.2049) -- (12.5966,-243.6895) -- (12.112,-243.5031) -- (12.2052,-243.7454) -- (11.907,-244.0436);
\draw[dca] (17.9244,-243.298) -- (17.5027,-243.298) -- (17.3973,-243.5353) -- (17.1864,-243.0608) -- (16.9755,-243.5353) -- (16.7646,-243.0608) -- (16.5538,-243.5353) -- (16.3429,-243.0608) -- (16.2374,-243.298) -- (15.8157,-243.298);
\draw[dca] (21.8331,-244.0436) -- (21.5349,-243.7454) -- (21.2926,-243.8386) -- (21.479,-243.354) -- (20.9944,-243.5404) -- (21.1808,-243.0557) -- (20.6962,-243.2421) -- (20.8826,-242.7575) -- (20.6403,-242.8507) -- (20.342,-242.5525);
\draw[dca] (25.3051,-244.3524) -- (25.3051,-243.9307) -- (25.0679,-243.8252) -- (25.5423,-243.6144) -- (25.0679,-243.4035) -- (25.5423,-243.1926) -- (25.0679,-242.9817) -- (25.5423,-242.7709) -- (25.3051,-242.6654) -- (25.3051,-242.2437);
\draw[dca] (28.7771,-244.0436) -- (29.0753,-243.7454) -- (28.9821,-243.5031) -- (29.4667,-243.6895) -- (29.2803,-243.2049) -- (29.7649,-243.3912) -- (29.5785,-242.9066) -- (30.0632,-243.093) -- (29.97,-242.8507) -- (30.2682,-242.5525);
\dcgai{-1.0902}{1.243}{1.0902}{0.4522}
\node[dcab] at (0,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">resistor</text></g>}{resistor}};
\dcgai{-1.2595}{-2.1837}{1.2595}{-2.9745}
\node[dcab] at (0,-2.6359) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">capacitor</text></g>}{capacitor}};
\dcgai{-2.5264}{-5.6105}{2.5264}{-6.4012}
\node[dcab] at (0,-6.0627) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">polarizedCapacitor</text></g>}{polarizedCapacitor}};
\dcgai{-1.1316}{-9.0372}{1.1316}{-9.828}
\node[dcab] at (0,-9.4894) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">inductor</text></g>}{inductor}};
\dcgai{-2.2018}{-12.4639}{2.2018}{-13.2547}
\node[dcab] at (0,-12.9161) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">variableResistor</text></g>}{variableResistor}};
\dcgai{-1.9442}{-15.8907}{1.9442}{-16.6814}
\node[dcab] at (0,-16.3429) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">potentiometer</text></g>}{potentiometer}};
\dcgai{-1.9222}{-19.3174}{1.9222}{-20.1082}
\node[dcab] at (0,-19.7696) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">voltageSource</text></g>}{voltageSource}};
\dcgai{-1.9772}{-22.7441}{1.9772}{-23.5349}
\node[dcab] at (0,-23.1963) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">currentSource</text></g>}{currentSource}};
\dcgai{-1.0428}{-26.1709}{1.0428}{-26.9616}
\node[dcab] at (0,-26.6231) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">battery</text></g>}{battery}};
\dcgai{-2.4306}{-29.5976}{2.4306}{-30.3884}
\node[dcab] at (0,-30.0498) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">dependentVoltage</text></g>}{dependentVoltage}};
\dcgai{-2.4638}{-33.0243}{2.4638}{-33.8151}
\node[dcab] at (0,-33.4765) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">dependentCurrent</text></g>}{dependentCurrent}};
\dcgai{-0.7333}{-36.451}{0.7333}{-37.2418}
\node[dcab] at (0,-36.9033) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">diode</text></g>}{diode}};
\dcgai{-0.4088}{-39.8778}{0.4088}{-40.6686}
\node[dcab] at (0,-40.33) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">led</text></g>}{led}};
\dcgai{-0.7648}{-43.3045}{0.7648}{-44.0953}
\node[dcab] at (0,-43.7567) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">zener</text></g>}{zener}};
\dcgai{-1.5519}{-46.7312}{1.5519}{-47.522}
\node[dcab] at (0,-47.1835) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">openSwitch</text></g>}{openSwitch}};
\dcgai{-1.785}{-50.158}{1.785}{-50.9488}
\node[dcab] at (0,-50.6102) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">closedSwitch</text></g>}{closedSwitch}};
\dcgai{-0.9286}{-53.5847}{0.9187}{-54.3755}
\node[dcab] at (0,-54.0369) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">ground</text></g>}{ground}};
\dcgai{-1.1926}{-57.0114}{1.1926}{-57.8022}
\node[dcab] at (0,-57.4637) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">ammeter</text></g>}{ammeter}};
\dcgai{-1.3285}{-60.4382}{1.3285}{-61.229}
\node[dcab] at (0,-60.8904) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">voltmeter</text></g>}{voltmeter}};
\dcgai{-1.68}{-63.0741}{1.68}{-63.8649}
\node[dcab] at (0,-63.5264) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">transformer</text></g>}{transformer}};
\dcgai{-1.2119}{-67.2916}{1.2119}{-68.0824}
\node[dcab] at (0,-67.7439) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">blackBox</text></g>}{blackBox}};
\dcgai{-1.4784}{-70.2439}{1.4784}{-71.0347}
\node[dcab] at (0,-70.6961) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">thermistor</text></g>}{thermistor}};
\dcgai{-1.8544}{-73.6706}{1.8544}{-74.4614}
\node[dcab] at (0,-74.1229) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">photoresistor</text></g>}{photoresistor}};
\dcgai{-2.3538}{-77.0974}{2.3538}{-77.8882}
\node[dcab] at (0,-77.5496) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">variableCapacitor</text></g>}{variableCapacitor}};
\dcgai{-2.2774}{-80.5241}{2.2774}{-81.3149}
\node[dcab] at (0,-80.9763) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">variableInductor</text></g>}{variableInductor}};
\dcgai{-2.2669}{-83.9508}{2.2669}{-84.7416}
\node[dcab] at (0,-84.4031) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">acVoltageSource</text></g>}{acVoltageSource}};
\dcgai{-2.3003}{-87.3776}{2.3003}{-88.1684}
\node[dcab] at (0,-87.8298) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">acCurrentSource</text></g>}{acCurrentSource}};
\dcgai{-2.9725}{-90.8043}{2.9626}{-91.5951}
\node[dcab] at (0,-91.2565) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">genericVoltageSource</text></g>}{genericVoltageSource}};
\dcgai{-3.0056}{-94.231}{2.9957}{-95.0218}
\node[dcab] at (0,-94.6833) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">genericCurrentSource</text></g>}{genericCurrentSource}};
\dcgai{-2.3124}{-97.6578}{2.3124}{-98.4486}
\node[dcab] at (0,-98.11) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">singleCellBattery</text></g>}{singleCellBattery}};
\dcgai{-1.4973}{-101.0845}{1.4973}{-101.8753}
\node[dcab] at (0,-101.5367) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">photodiode</text></g>}{photodiode}};
\dcgai{-1.1909}{-104.5112}{1.1909}{-105.302}
\node[dcab] at (0,-104.9635) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">schottky</text></g>}{schottky}};
\dcgai{-1.1545}{-107.938}{1.1545}{-108.7288}
\node[dcab] at (0,-108.3902) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">varactor</text></g>}{varactor}};
\dcgai{-0.4586}{-111.0484}{0.4586}{-111.8392}
\node[dcab] at (0,-111.5006) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">npn</text></g>}{npn}};
\dcgai{-0.4619}{-114.4751}{0.4619}{-115.2659}
\node[dcab] at (0,-114.9274) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">pnp</text></g>}{pnp}};
\dcgai{-0.6707}{-117.9019}{0.6707}{-118.6926}
\node[dcab] at (0,-118.3541) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">nmos</text></g>}{nmos}};
\dcgai{-0.674}{-121.3286}{0.674}{-122.1194}
\node[dcab] at (0,-121.7808) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">pmos</text></g>}{pmos}};
\dcgai{-0.7117}{-124.7553}{0.7117}{-125.5461}
\node[dcab] at (0,-125.2076) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">njfet</text></g>}{njfet}};
\dcgai{-0.715}{-128.1821}{0.715}{-128.9728}
\node[dcab] at (0,-128.6343) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">pjfet</text></g>}{pjfet}};
\dcgai{-0.6032}{-131.9251}{0.6032}{-132.7159}
\node[dcab] at (0,-132.3773) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">spdt</text></g>}{spdt}};
\dcgai{-1.9881}{-135.3518}{1.9881}{-136.1426}
\node[dcab] at (0,-135.8041) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">pushButtonNO</text></g>}{pushButtonNO}};
\dcgai{-1.9315}{-138.7786}{1.9315}{-139.5694}
\node[dcab] at (0,-139.2308) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">pushButtonNC</text></g>}{pushButtonNC}};
\dcgai{-0.6032}{-142.2053}{0.6032}{-142.9961}
\node[dcab] at (0,-142.6575) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">dpst</text></g>}{dpst}};
\dcgai{-0.6324}{-145.0521}{0.6324}{-145.8429}
\node[dcab] at (0,-145.5044) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">dpdt</text></g>}{dpdt}};
\dcgai{-1.3643}{-149.0588}{1.3643}{-149.8496}
\node[dcab] at (0,-149.511) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">ohmmeter</text></g>}{ohmmeter}};
\dcgai{-1.8042}{-152.4855}{1.7943}{-153.2763}
\node[dcab] at (0,-152.9377) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">galvanometer</text></g>}{galvanometer}};
\dcgai{-1.7177}{-155.5959}{1.7177}{-156.3867}
\node[dcab] at (0,-156.0482) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">signalGround</text></g>}{signalGround}};
\dcgai{-1.9315}{-159.0227}{1.9315}{-159.8134}
\node[dcab] at (0,-159.4749) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">chassisGround</text></g>}{chassisGround}};
\dcgai{-3.1351}{-162.4494}{3.1351}{-163.2402}
\node[dcab] at (0,-162.9016) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">centerTapTransformer</text></g>}{centerTapTransformer}};
\dcgai{-2.3658}{-165.8761}{2.3658}{-166.6669}
\node[dcab] at (0,-166.3284) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">coupledInductors</text></g>}{coupledInductors}};
\dcgai{-0.8999}{-169.6192}{0.8999}{-170.41}
\node[dcab] at (0,-170.0714) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">opAmp</text></g>}{opAmp}};
\dcgai{-1.5464}{-173.0459}{1.5464}{-173.8367}
\node[dcab] at (0,-173.4981) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">comparator</text></g>}{comparator}};
\dcgai{-1.1114}{-176.4726}{1.1114}{-177.2634}
\node[dcab] at (0,-176.9249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">andGate</text></g>}{andGate}};
\dcgai{-0.9329}{-179.8994}{0.9329}{-180.6902}
\node[dcab] at (0,-180.3516) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">orGate</text></g>}{orGate}};
\dcgai{-1.082}{-183.3261}{1.082}{-184.1169}
\node[dcab] at (0,-183.7783) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">notGate</text></g>}{notGate}};
\dcgai{-1.2632}{-186.7528}{1.2632}{-187.5436}
\node[dcab] at (0,-187.2051) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">nandGate</text></g>}{nandGate}};
\dcgai{-1.0847}{-190.1796}{1.0847}{-190.9704}
\node[dcab] at (0,-190.6318) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">norGate</text></g>}{norGate}};
\dcgai{-1.104}{-193.6063}{1.104}{-194.3971}
\node[dcab] at (0,-194.0585) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">xorGate</text></g>}{xorGate}};
\dcgai{-1.2558}{-197.033}{1.2558}{-197.8238}
\node[dcab] at (0,-197.4853) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">xnorGate</text></g>}{xnorGate}};
\dcgai{-0.9158}{-200.4598}{0.9158}{-201.2506}
\node[dcab] at (0,-200.912) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">buffer</text></g>}{buffer}};
\dcgai{-1.1209}{-203.8865}{1.1209}{-204.6773}
\node[dcab] at (0,-204.3387) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">terminal</text></g>}{terminal}};
\dcgai{-1.2465}{-207.3132}{1.2465}{-208.104}
\node[dcab] at (0,-207.7655) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">testPoint</text></g>}{testPoint}};
\dcgai{-1.5183}{-210.74}{1.5183}{-211.5308}
\node[dcab] at (0,-211.1922) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">connector2</text></g>}{connector2}};
\dcgai{-1.5183}{-214.1667}{1.5183}{-214.9575}
\node[dcab] at (0,-214.6189) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">connector3</text></g>}{connector3}};
\dcgai{-0.5836}{-217.5934}{0.5836}{-218.3842}
\node[dcab] at (0,-218.0457) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">port</text></g>}{port}};
\dcgai{-0.5982}{-221.0202}{0.5982}{-221.8109}
\node[dcab] at (0,-221.4724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">fuse</text></g>}{fuse}};
\dcgai{-0.6081}{-224.4469}{0.6081}{-225.2377}
\node[dcab] at (0,-224.8991) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">lamp</text></g>}{lamp}};
\dcgai{-0.8062}{-227.8736}{0.8062}{-228.6644}
\node[dcab] at (0,-228.3259) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">motor</text></g>}{motor}};
\dcgai{-1.0583}{-231.3004}{1.0583}{-232.0911}
\node[dcab] at (0,-231.7526) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">speaker</text></g>}{speaker}};
\dcgai{-0.9331}{-234.7271}{0.9331}{-235.5179}
\node[dcab] at (0,-235.1793) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">buzzer</text></g>}{buzzer}};
\dcgai{-1.477}{-238.1538}{1.4787}{-238.9446}
\node[dcab] at (0,-238.6061) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">circleBlock</text></g>}{circleBlock}};
\dcgai{-2.3353}{-241.5806}{2.3353}{-242.3713}
\node[dcab] at (0,-242.0328) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><text text-anchor="middle" dominant-baseline="middle" font-family='"Comic Relief", cursive' font-size="22">americanResistor</text></g>}{americanResistor}};
\end{circuitikz}

\end{document}
```