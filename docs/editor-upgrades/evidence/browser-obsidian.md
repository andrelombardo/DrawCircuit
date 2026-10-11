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
\definecolor{dcColor1}{HTML}{2463CB}
\definecolor{dcColor2}{HTML}{DF4949}
\definecolor{dcColor3}{HTML}{2571C7}
\begin{circuitikz}[european resistors, american inductors, american ports, line cap=round, line join=round]
\draw[draw=dcColor0, line width=1.5pt] (-1.0544,2.6359) -- (-2.9523,2.6359);
\draw[draw=dcColor0, line width=1.5pt] (-3.9012,2.6359) -- (-5.2719,2.6359);
\draw[draw=dcColor0, line width=1.5pt] (1.0544,2.6359) -- (5.2719,2.6359);
\draw[draw=dcColor0, line width=1.5pt] (-3.3815,4.5263) -- (-5.2719,2.6359);
\draw[draw=dcColor0, line width=1.5pt] (-1.8904,6.0175) -- (0,7.9078);
\draw[draw=dcColor0, line width=1.5pt] (1.8904,6.0175) -- (0,7.9078);
\draw[draw=dcColor0, line width=1.5pt] (3.3815,4.5263) -- (5.2719,2.6359);
\begin{scope}[opacity=0.5, transparency group]
% Component: resistor
% Resistenza
\draw[draw=dcColor0, line width=1.5pt] (-1.0544,2.6359) -- (-0.5272,2.6359) (0.5272,2.6359) -- (1.0544,2.6359);
\draw[draw=dcColor0, line width=1.5pt, fill=white] (-0.5272,2.8732) -- (0.5272,2.8732) -- (0.5272,2.3987) -- (-0.5272,2.3987) -- cycle;
\end{scope}
% Component: resistor
% Resistenza
\draw[draw=dcColor0, line width=1.5pt] (-3.3815,4.5263) -- (-3.0087,4.8991) (-2.2632,5.6447) -- (-1.8904,6.0175);
\draw[draw=dcColor0, line width=1.5pt, fill=white] (-3.1765,5.0669) -- (-2.4309,5.8124) -- (-2.0954,5.4769) -- (-2.841,4.7314) -- cycle;
% Component: resistor
% Resistenza
\draw[draw=dcColor0, line width=1.5pt] (1.8904,6.0175) -- (2.2632,5.6447) (3.0087,4.8991) -- (3.3815,4.5263);
\draw[draw=dcColor0, line width=1.5pt, fill=white] (2.4309,5.8124) -- (3.1765,5.0669) -- (2.841,4.7314) -- (2.0954,5.4769) -- cycle;
\fill[dcColor0] (-5.2719,2.6359) circle (3.375pt);
\fill[dcColor0] (5.2719,2.6359) circle (3.375pt);
\fill[dcColor0] (0,7.9078) circle (3.375pt);
\begin{scope}[opacity=0.8, transparency group]
\path (-0.3427,3.8485) -- (0.339,3.8485) -- (-0.3427,3.0077) -- (0.339,3.0077) -- cycle;
\node[text=dcColor1, font=\fontsize{16.5}{21.45}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (0,3.4267) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g transform="translate(0,0)"><text x="-11" y="8" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="22" font-style="normal" font-weight="400">&\string#82;</text><text x="2.8281" y="11.3047" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="15.4" font-style="normal" font-weight="400">&\string#49;</text></g></g>}{$R_1$}};
\end{scope}
\path (-3.005,6.4844) -- (-2.2583,6.4844) -- (-3.005,5.6436) -- (-2.2583,5.6436) -- cycle;
\node[text=dcColor1, font=\fontsize{16.5}{21.45}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (-2.6359,6.0627) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g transform="translate(0,0)"><text x="-12" y="8" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="22" font-style="normal" font-weight="400">&\string#82;</text><text x="1.8281" y="11.3047" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="15.4" font-style="normal" font-weight="400">&\string#50;</text></g></g>}{$R_2$}};
\path (2.2669,6.4844) -- (3.0136,6.4844) -- (2.2669,5.6436) -- (3.0136,5.6436) -- cycle;
\node[text=dcColor1, font=\fontsize{16.5}{21.45}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (2.6359,6.0627) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g transform="translate(0,0)"><text x="-12" y="8" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="22" font-style="normal" font-weight="400">&\string#82;</text><text x="1.8281" y="11.3047" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="15.4" font-style="normal" font-weight="400">&\string#51;</text></g></g>}{$R_3$}};
\path (-6.0832,3.1638) -- (-5.6204,3.1638) -- (-6.0832,2.2807) -- (-5.6204,2.2807) -- cycle;
\node[text=dcColor2, font=\fontsize{18}{23.4}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (-5.8518,2.6359) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#DF4949" stroke="none"><g transform="translate(0,0)"><text text-anchor="middle" dominant-baseline="middle" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="24">&\string#65;</text></g></g>}{A}};
\path (5.6524,3.1638) -- (6.0513,3.1638) -- (5.6524,2.2807) -- (6.0513,2.2807) -- cycle;
\node[text=dcColor2, font=\fontsize{18}{23.4}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (5.8518,2.6359) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#DF4949" stroke="none"><g transform="translate(0,0)"><text text-anchor="middle" dominant-baseline="middle" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="24">&\string#66;</text></g></g>}{B}};
\path (-0.1906,9.0683) -- (0.1906,9.0683) -- (-0.1906,8.1852) -- (0.1906,8.1852) -- cycle;
\node[text=dcColor2, font=\fontsize{18}{23.4}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (0,8.5405) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#DF4949" stroke="none"><g transform="translate(0,0)"><text text-anchor="middle" dominant-baseline="middle" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="24">&\string#67;</text></g></g>}{C}};
% Electrical annotation: current
\draw[draw=dcColor2,line width=1.5pt,line cap=round,line join=round] (-2.9523,2.6359) -- (-3.9012,2.6359);
\draw[draw=dcColor2,line width=1.5pt,line cap=round,line join=round] (-3.6376,2.7546) -- (-3.9012,2.6359) -- (-3.6376,2.5173);
\path (-3.664,3.6903) -- (-3.1841,3.6903) -- (-3.664,2.8495) -- (-3.1841,2.8495) -- cycle;
\node[text=dcColor1, font=\fontsize{16.5}{21.45}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0] at (-3.4267,3.2686) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g transform="translate(0,0)"><text x="-7" y="8" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="22" font-style="normal" font-weight="400">&\string#105;</text><text x="-0.8281" y="11.3047" font-family="&\string#34;Comic Sans MS&\string#34;, &\string#34;Comic Sans&\string#34;, cursive" font-size="15.4" font-style="normal" font-weight="400">&\string#49;</text></g></g>}{$i_1$}};
\begin{scope}[opacity=0.5, transparency group]
\draw[draw=dcColor3, line width=2.25pt] (-0.8493,0.8837) .. controls (-3.599,1.9844) and (-1.8743,-3.7283) .. (-4.4226,-2.9925);
\draw[draw=dcColor3, line width=2.25pt] (-4.1944,-2.9623) -- (-4.4226,-2.9925) -- (-4.2456,-3.1396);
\end{scope}
\begin{scope}[opacity=0.65, transparency group]
\begin{scope}[rotate around={-27:(3.4267,-0.5272)}]
\draw[draw=dcColor2, line width=1.5pt] (5.2139,-0.7894) arc[start angle=345.6, end angle=21.6, x radius=1.8452cm, y radius=1.0544cm];
\end{scope}
\draw[draw=dcColor2, line width=1.5pt] (5.0118,-0.7636) -- (5.1315,-0.9602) -- (5.1947,-0.7389);
\end{scope}
\end{circuitikz}

\end{document}
```