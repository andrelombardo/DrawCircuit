```tikz
\usepackage{circuitikz}
\begin{document}

% DrawCircuit WYSIWYG — 1 editor unit = 0.75 TeX pt; SVG Y axis inverted.
\definecolor{dcColor0}{HTML}{171A20}
\begin{circuitikz}[european resistors, american inductors, american ports, line cap=round, line join=round]
\draw[draw=dcColor0, opacity=0.35, line width=1.5pt, dash pattern=on 6pt off 3pt] (-1.318,0) -- (1.1335,0);
\draw[draw=dcColor0, opacity=0.35, line width=1.5pt, dash pattern=on 6pt off 3pt] (1.5025,0) -- (3.9539,0);
\draw[draw=dcColor0, opacity=0.35, line width=3pt] (1.318,2.1088) -- (1.318,-2.1088);
\draw[draw=dcColor0, opacity=1, line width=1.5pt, dash pattern=on 6pt off 3pt] (-1.318,-5.2719) -- (3.9539,-5.2719);
\draw[draw=dcColor0, opacity=1, line width=3pt] (1.318,-3.1631) -- (1.318,-7.3807);
\draw[draw=dcColor0,opacity=0.35,line width=1.5pt, dash pattern=on 6pt off 3pt] (1.1335,0) .. controls (1.2073,0.1845) and (1.4287,0.1845) .. (1.5025,0);
% Unconnected wire crossing: horizontal bridge
\draw[draw=white,line width=6pt] (1.1335,-5.2719) -- (1.5025,-5.2719);
\draw[draw=dcColor0,line width=3pt] (1.318,-5.0874) -- (1.318,-5.4564);
\draw[draw=white,line width=6pt] (1.1335,-5.2719) .. controls (1.2073,-5.0874) and (1.4287,-5.0874) .. (1.5025,-5.2719);
\draw[draw=dcColor0,line width=1.5pt, dash pattern=on 6pt off 3pt] (1.1335,-5.2719) .. controls (1.2073,-5.0874) and (1.4287,-5.0874) .. (1.5025,-5.2719);
\end{circuitikz}

\end{document}
```