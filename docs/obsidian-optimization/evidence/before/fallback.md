```tikz
\usepackage{circuitikz}
% TikZJax/Inline TikZ SVG embeds Comic Relief; other drivers use upright sans.
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
\definecolor{dcColor1}{HTML}{2463CB}
\begin{circuitikz}[european resistors, american inductors, american ports, line cap=round, line join=round]
% Component: resistor
% Resistenza
\draw[draw=dcColor0, line width=1.5pt] (-1.0544,0) -- (-0.5272,0) (0.5272,0) -- (1.0544,0);
\draw[draw=dcColor0, line width=1.5pt, fill=white] (-0.5272,0.2372) -- (0.5272,0.2372) -- (0.5272,-0.2372) -- (-0.5272,-0.2372) -- cycle;
% Component: capacitor
% Condensatore
\draw[draw=dcColor0, line width=1.5pt] (2.8995,0) -- (3.7958,0) (4.1121,0) -- (5.0083,0) (3.7958,0.4481) -- (3.7958,-0.4481) (4.1121,0.4481) -- (4.1121,-0.4481);
% Component: inductor
% Induttore
\draw[draw=dcColor0, line width=1.5pt] (6.8535,0) -- (7.2752,0) .. controls (7.2752,0.4745) and (7.5915,0.4745) .. (7.5915,0) .. controls (7.5915,0.4745) and (7.9078,0.4745) .. (7.9078,0) .. controls (7.9078,0.4745) and (8.2242,0.4745) .. (8.2242,0) .. controls (8.2242,0.4745) and (8.5405,0.4745) .. (8.5405,0) -- (8.9622,0);
% Component: voltageSource
% Generatore di tensione DC
\draw[draw=dcColor0, line width=1.5pt] (10.8074,0) -- (11.3346,0) (12.389,0) -- (12.9161,0);
\draw[draw=dcColor0, line width=1.5pt, fill=white] (11.8618,0) circle (15pt);
\draw[draw=dcColor0, line width=1.5pt] (11.5718,0.1318) -- (11.5718,-0.1318) (11.44,0) -- (11.7036,0) (12.0463,0) -- (12.2572,0);
% Component: diode
% Diodo
\draw[draw=dcColor0, line width=1.5pt, fill=white] (15.4467,0.369) -- (16.132,0) -- (15.4467,-0.369) -- cycle;
\draw[draw=dcColor0, line width=1.5pt] (14.7613,0) -- (15.4467,0) (16.132,0) -- (16.8701,0);
\draw[draw=dcColor0, line width=1.5pt] (16.132,0.369) -- (16.132,-0.369);
\node[text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (0,0.7908) {$R_1$};
\node[text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (3.9539,0.7908) {$R_2$};
\node[text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (7.9078,0.7908) {$R_3$};
\node[text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (11.8618,0.7908) {$R_4$};
\node[text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily] at (15.8157,0.7908) {$R_5$};
\end{circuitikz}

\end{document}
```