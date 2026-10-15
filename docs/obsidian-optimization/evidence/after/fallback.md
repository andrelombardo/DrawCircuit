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
\tikzset{dcc/.style={text=dcColor1, anchor=center, inner sep=0pt, rotate=0, font=\fontsize{16.5}{21.45}\selectfont\sffamily}}
\draw[dca] (-1.0544,0) -- (-0.5272,0) (0.5272,0) -- (1.0544,0);
\draw[dcb] (-0.5272,0.2372) -- (0.5272,0.2372) -- (0.5272,-0.2372) -- (-0.5272,-0.2372) -- cycle;
\draw[dca] (2.8995,0) -- (3.7958,0) (4.1121,0) -- (5.0083,0) (3.7958,0.4481) -- (3.7958,-0.4481) (4.1121,0.4481) -- (4.1121,-0.4481);
\draw[dca] (6.8535,0) -- (7.2752,0) .. controls (7.2752,0.4745) and (7.5915,0.4745) .. (7.5915,0) .. controls (7.5915,0.4745) and (7.9078,0.4745) .. (7.9078,0) .. controls (7.9078,0.4745) and (8.2242,0.4745) .. (8.2242,0) .. controls (8.2242,0.4745) and (8.5405,0.4745) .. (8.5405,0) -- (8.9622,0);
\draw[dca] (10.8074,0) -- (11.3346,0) (12.389,0) -- (12.9161,0);
\draw[dcb] (11.8618,0) circle (15pt);
\draw[dca] (11.5718,0.1318) -- (11.5718,-0.1318) (11.44,0) -- (11.7036,0) (12.0463,0) -- (12.2572,0);
\draw[dcb] (15.4467,0.369) -- (16.132,0) -- (15.4467,-0.369) -- cycle;
\draw[dca] (14.7613,0) -- (15.4467,0) (16.132,0) -- (16.8701,0);
\draw[dca] (16.132,0.369) -- (16.132,-0.369);
\node[dcc] at (0,0.7908) {$R_1$};
\node[dcc] at (3.9539,0.7908) {$R_2$};
\node[dcc] at (7.9078,0.7908) {$R_3$};
\node[dcc] at (11.8618,0.7908) {$R_4$};
\node[dcc] at (15.8157,0.7908) {$R_5$};
\end{circuitikz}

\end{document}
```