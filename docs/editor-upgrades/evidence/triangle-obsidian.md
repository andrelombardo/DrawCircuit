```tikz
\usepackage{circuitikz}
% TikZJax/Inline TikZ SVG uses the system font; other drivers use upright sans.
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
\DeclareMathSymbol{A}{\mathalpha}{dcLetters}{65}
\DeclareMathSymbol{B}{\mathalpha}{dcLetters}{66}
\DeclareMathSymbol{C}{\mathalpha}{dcLetters}{67}
\DeclareMathSymbol{D}{\mathalpha}{dcLetters}{68}
\DeclareMathSymbol{E}{\mathalpha}{dcLetters}{69}
\DeclareMathSymbol{F}{\mathalpha}{dcLetters}{70}
\DeclareMathSymbol{G}{\mathalpha}{dcLetters}{71}
\DeclareMathSymbol{H}{\mathalpha}{dcLetters}{72}
\DeclareMathSymbol{I}{\mathalpha}{dcLetters}{73}
\DeclareMathSymbol{J}{\mathalpha}{dcLetters}{74}
\DeclareMathSymbol{K}{\mathalpha}{dcLetters}{75}
\DeclareMathSymbol{L}{\mathalpha}{dcLetters}{76}
\DeclareMathSymbol{M}{\mathalpha}{dcLetters}{77}
\DeclareMathSymbol{N}{\mathalpha}{dcLetters}{78}
\DeclareMathSymbol{O}{\mathalpha}{dcLetters}{79}
\DeclareMathSymbol{P}{\mathalpha}{dcLetters}{80}
\DeclareMathSymbol{Q}{\mathalpha}{dcLetters}{81}
\DeclareMathSymbol{R}{\mathalpha}{dcLetters}{82}
\DeclareMathSymbol{S}{\mathalpha}{dcLetters}{83}
\DeclareMathSymbol{T}{\mathalpha}{dcLetters}{84}
\DeclareMathSymbol{U}{\mathalpha}{dcLetters}{85}
\DeclareMathSymbol{V}{\mathalpha}{dcLetters}{86}
\DeclareMathSymbol{W}{\mathalpha}{dcLetters}{87}
\DeclareMathSymbol{X}{\mathalpha}{dcLetters}{88}
\DeclareMathSymbol{Y}{\mathalpha}{dcLetters}{89}
\DeclareMathSymbol{Z}{\mathalpha}{dcLetters}{90}
\DeclareMathSymbol{a}{\mathalpha}{dcLetters}{97}
\DeclareMathSymbol{b}{\mathalpha}{dcLetters}{98}
\DeclareMathSymbol{c}{\mathalpha}{dcLetters}{99}
\DeclareMathSymbol{d}{\mathalpha}{dcLetters}{100}
\DeclareMathSymbol{e}{\mathalpha}{dcLetters}{101}
\DeclareMathSymbol{f}{\mathalpha}{dcLetters}{102}
\DeclareMathSymbol{g}{\mathalpha}{dcLetters}{103}
\DeclareMathSymbol{h}{\mathalpha}{dcLetters}{104}
\DeclareMathSymbol{i}{\mathalpha}{dcLetters}{105}
\DeclareMathSymbol{j}{\mathalpha}{dcLetters}{106}
\DeclareMathSymbol{k}{\mathalpha}{dcLetters}{107}
\DeclareMathSymbol{l}{\mathalpha}{dcLetters}{108}
\DeclareMathSymbol{m}{\mathalpha}{dcLetters}{109}
\DeclareMathSymbol{n}{\mathalpha}{dcLetters}{110}
\DeclareMathSymbol{o}{\mathalpha}{dcLetters}{111}
\DeclareMathSymbol{p}{\mathalpha}{dcLetters}{112}
\DeclareMathSymbol{q}{\mathalpha}{dcLetters}{113}
\DeclareMathSymbol{r}{\mathalpha}{dcLetters}{114}
\DeclareMathSymbol{s}{\mathalpha}{dcLetters}{115}
\DeclareMathSymbol{t}{\mathalpha}{dcLetters}{116}
\DeclareMathSymbol{u}{\mathalpha}{dcLetters}{117}
\DeclareMathSymbol{v}{\mathalpha}{dcLetters}{118}
\DeclareMathSymbol{w}{\mathalpha}{dcLetters}{119}
\DeclareMathSymbol{x}{\mathalpha}{dcLetters}{120}
\DeclareMathSymbol{y}{\mathalpha}{dcLetters}{121}
\DeclareMathSymbol{z}{\mathalpha}{dcLetters}{122}
\DeclareMathSymbol{0}{\mathalpha}{dcLetters}{48}
\DeclareMathSymbol{1}{\mathalpha}{dcLetters}{49}
\DeclareMathSymbol{2}{\mathalpha}{dcLetters}{50}
\DeclareMathSymbol{3}{\mathalpha}{dcLetters}{51}
\DeclareMathSymbol{4}{\mathalpha}{dcLetters}{52}
\DeclareMathSymbol{5}{\mathalpha}{dcLetters}{53}
\DeclareMathSymbol{6}{\mathalpha}{dcLetters}{54}
\DeclareMathSymbol{7}{\mathalpha}{dcLetters}{55}
\DeclareMathSymbol{8}{\mathalpha}{dcLetters}{56}
\DeclareMathSymbol{9}{\mathalpha}{dcLetters}{57}
\makeatother
\begin{document}

% DrawCircuit WYSIWYG — 1 editor unit = 0.75 TeX pt; SVG Y axis inverted.
\definecolor{dcColor0}{HTML}{171A20}
\definecolor{dcColor1}{HTML}{DF4949}
\definecolor{dcColor2}{HTML}{2571C7}
\definecolor{dcColor3}{HTML}{2463CB}
\begin{circuitikz}[european resistors, american inductors, american ports, line cap=round, line join=round]
\draw[draw=dcColor0, line width=1.5pt] (-1.0544,-2.6359) -- (-2.9523,-2.6359);
\draw[draw=dcColor0, line width=1.5pt] (-3.9012,-2.6359) -- (-5.2719,-2.6359);
\draw[draw=dcColor0, line width=1.5pt] (1.0544,-2.6359) -- (5.2719,-2.6359);
\draw[draw=dcColor0, line width=1.5pt] (-3.3815,-0.7456) -- (-5.2719,-2.6359);
\draw[draw=dcColor0, line width=1.5pt] (-1.8904,0.7456) -- (0,2.6359);
\draw[draw=dcColor0, line width=1.5pt] (1.8904,0.7456) -- (0,2.6359);
\draw[draw=dcColor0, line width=1.5pt] (3.3815,-0.7456) -- (5.2719,-2.6359);
\begin{scope}[opacity=0.5, transparency group]
% Component: resistor
% Resistenza
\draw[draw=dcColor0, line width=1.5pt] (-1.0544,-2.6359) -- (-0.5272,-2.6359) (0.5272,-2.6359) -- (1.0544,-2.6359);
\draw[draw=dcColor0, line width=1.5pt, fill=white] (-0.5272,-2.3987) -- (0.5272,-2.3987) -- (0.5272,-2.8732) -- (-0.5272,-2.8732) -- cycle;
\end{scope}
% Component: resistor
% Resistenza
\draw[draw=dcColor0, line width=1.5pt] (-3.3815,-0.7456) -- (-3.0087,-0.3728) (-2.2632,0.3728) -- (-1.8904,0.7456);
\draw[draw=dcColor0, line width=1.5pt, fill=white] (-3.1765,-0.205) -- (-2.4309,0.5405) -- (-2.0954,0.205) -- (-2.841,-0.5405) -- cycle;
% Component: resistor
% Resistenza
\draw[draw=dcColor0, line width=1.5pt] (1.8904,0.7456) -- (2.2632,0.3728) (3.0087,-0.3728) -- (3.3815,-0.7456);
\draw[draw=dcColor0, line width=1.5pt, fill=white] (2.4309,0.5405) -- (3.1765,-0.205) -- (2.841,-0.5405) -- (2.0954,0.205) -- cycle;
\fill[dcColor0] (-5.2719,-2.6359) circle (3.375pt);
\fill[dcColor0] (5.2719,-2.6359) circle (3.375pt);
\fill[dcColor0] (0,2.6359) circle (3.375pt);
% Electrical annotation: current
\draw[draw=dcColor1,line width=1.5pt,line cap=round,line join=round] (-2.9523,-2.6359) -- (-3.9012,-2.6359);
\draw[draw=dcColor1,line width=1.5pt,line cap=round,line join=round] (-3.6376,-2.5173) -- (-3.9012,-2.6359) -- (-3.6376,-2.7546);
\begin{scope}[opacity=0.5, transparency group]
\draw[draw=dcColor2, line width=2.25pt] (-0.1152,-7.097) .. controls (-0.3143,-4.1419) and (-4.716,-8.1711) .. (-5.1567,-5.5556);
\draw[draw=dcColor2, line width=2.25pt] (-5.0307,-5.7482) -- (-5.1567,-5.5556) -- (-5.2127,-5.7789);
\end{scope}
\begin{scope}[opacity=0.65, transparency group]
\begin{scope}[rotate around={-27:(3.4267,-5.7991)}]
\draw[draw=dcColor1, line width=1.5pt] (5.2139,-6.0613) arc[start angle=345.6, end angle=21.6, x radius=1.8452cm, y radius=1.0544cm];
\end{scope}
\draw[draw=dcColor1, line width=1.5pt] (5.0118,-6.0355) -- (5.1315,-6.2321) -- (5.1947,-6.0108);
\end{scope}
\begin{scope}[opacity=0.8, transparency group]
\node[text=dcColor3, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (0,-1.8452) {$R_1$};
\end{scope}
\node[text=dcColor3, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (-2.6359,0.7908) {$R_2$};
\node[text=dcColor3, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (2.6359,0.7908) {$R_3$};
\node[text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{18}{23.4}\selectfont\sffamily] at (-5.8518,-2.6359) {A};
\node[text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{18}{23.4}\selectfont\sffamily] at (5.8518,-2.6359) {B};
\node[text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{18}{23.4}\selectfont\sffamily] at (0,3.2686) {C};
\node[text=dcColor3, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (-3.4267,-2.0033) {$i_1$};
\end{circuitikz}

\end{document}
```