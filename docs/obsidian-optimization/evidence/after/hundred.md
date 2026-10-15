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
\tikzset{dcc/.style={text=dcColor1, font=\fontsize{16.5}{21.45}\selectfont\sffamily, anchor=\dcCenterAnchor, minimum size=0pt, inner sep=0pt, outer sep=0pt, rotate=0}}
\def\dcga#1#2#3#4#5{\draw[dca] (#1,#2) -- (#3,#2) (#4,#2) -- (#5,#2);}
\def\dcgb#1#2#3#4{\draw[dcb] (#1,#2) -- (#3,#2) -- (#3,#4) -- (#1,#4) -- cycle;}
\def\dcgc#1#2#3#4#5#6#7{\draw[dca] (#1,#2) -- (#3,#2) (#4,#2) -- (#5,#2) (#3,#6) -- (#3,#7) (#4,#6) -- (#4,#7);}
\def\dcgd#1#2#3#4#5#6#7#8#9{\draw[dca] (#1,#2) -- (#3,#2) .. controls (#3,#4) and (#5,#4) .. (#5,#2) .. controls (#5,#4) and (#6,#4) .. (#6,#2) .. controls (#6,#4) and (#7,#4) .. (#7,#2) .. controls (#7,#4) and (#8,#4) .. (#8,#2) -- (#9,#2);}
\def\dcge#1#2#3{\draw[dcb] (#1,#2) circle (#3pt);}
\def\dcgf#1#2#3#4#5#6#7#8{\draw[dca] (#1,#2) -- (#1,#3) (#4,#5) -- (#6,#5) (#7,#5) -- (#8,#5);}
\def\dcgg#1#2#3#4#5{\draw[dcb] (#1,#2) -- (#3,#4) -- (#1,#5) -- cycle;}
\def\dcgh#1#2#3{\draw[dca] (#1,#2) -- (#1,#3);}
\def\dcgi#1#2#3#4{\path (#1,#2) rectangle (#3,#4);}
\ifdcSvg
\special{dvisvgm:raw <style><![CDATA[/*! Copyright 2013 The Comic Relief Project Authors. SIL OPEN FONT LICENSE Version 1.1; full license in each WOFF metadata block. */@font-face{font-family:'Comic Relief';font-style:normal;font-weight:400;src:url(data:font/woff2;base64,d09GMgABAAAAAC8dAA4AAAAAT4QAACjzAAE1wwAAKUwAAAXRAAASDAAAAAAAAAAAGhYcgQgGYACCChEICs9IyH8BNgIkA5J8C4lAAAQgBYo2B6FCDAcbg0Y1qtcM5+A8ALFI/tqPqCL9Tfb/f0tQx4jYNFDXvyExVFaPHdc9bspVW1WBtWvqdJaHRJwbeNiIG4v+0GMsEg4yWU3X2RJfHkg3O49+8rcx+/7tqVy4Op/LwBGSzML/8/vjW2ff+z7IJGfIo8Q6japWnzhVSGSb/v3z/Db/3PcoAxsjCwOrABuDEJQQFQPFjm1GLd3aVblKV+7nql2Fq/jtJ6oWpVk91bO3CIhhRQgQATFg7OBGZmbcDDms55+ee//dZ9696YCVMAKtAwUsYA095qXhX3NoUwscHqZ2HQzvvDHMthYp2aQQYhlPd+986eN2TLtSAQhs6ayVc5V06Q6AKkCWVms7aD9BRY6ei6K+eXvcb8j05l/fhkvSRsk0FvXuu9CoTxlUqiLOA4rU7/OIM06K6Dbd/x0S9Nu06LCLLkMoacmvXqFPUCcTVjWD//9r9tp5H5BTIuEqDLqeyrJwd+6bJG/mZTbzZxYGPiSTJZx8CJQCyymxqwd0mE2JsiUAWeG++0bUVZgKz04yCVnhbOHpXab0yoy+e3nchMpGhlC7Wl2XW2lpBSXsAoNYeIxBYMyW2iykdQV0WHRh87tv/vbTusfWwiTMLXG1IyIC4hNL9u+KuesbY%
gBRXKcLBNIclHJ/4hhTB8OcPbT9Q3U5+MK2f5SUguUOYSMAw51xVzICKJRSz+NEa/Y/UpOt82/d/usCDHsEOiwYwBInHT/QlwdtRyEItOnL/Ogh+HeNIALB+dMPWDFcn7tqz9TeorjYUDmny2F6QEc8PT3fs2JhmvV/Q9l9lQDC3k7HQ3AFgB+8pgfIM+OlO4AkOAi2JoEfABFQwMBojc/QL637PyCP7z7z68fvHgh1Sv5vWZG2pblOxOxBZn3ubvey61lh9TQ76prt17Ecw8oqHjV5G+tQjMHtRqKaep09hA49Jix48hKAgYktVbZcBarUqtOsS78VJqy13ua455RHNuNWgx1xzKfIUpKnrKO+lrWi1W1rqpPd7lVf+me0lDesYU/6ZA4315xzyxYCbSxtADQPwD8CHAARL0DiPw5oBGwHgMD4dDgOwFAFhZvISMairGULN0Caq3xuMlZ5kbDYcYFpclzIIKpNrvtPMOJ5IOeK6QiMKIxiBSMvB2aKU4rwVqgUSjBWA8sXfbTLH0FhY6hR/s80b7SNtdw8T0R0N+QKMeACggYP1EkSCxNWg/HcngiIF46MyO3EnkkljKWHwyvTt9+eqIylsc5u32JdrplyH2ed943uuql+VcOmWlLqGr+AjtPFH+SA5bJp1iD/lQozHZUC5nG2zswXxAxCPJVGfZj3hVzX6eV0OZlPOzenlECP1ChM74cJK3FKqVPqZ8mJjZalsVSGKLkBRKuZ4tNKPuYLMy1aNEMWTL5K1e3kCbWzRb80r214muHxbEFX+GJ4dtBJ7/lJj8dYgMi6WEZK/imUcNRAiGpyxmkdOpHar86y3q5ZceSnOGvsW2RHL0L21VAPlZNHLgnto2YiV1zJQMdjpFACMzWz1kBI28HeHRBGseC4KXFYrCYbJNgZVmBlMEJgf3qITDpOSQ230O8hTXnEZJZC02445RrHZhAe2Go6petJeh+UotTaTK+r1yShJkSigNFB4xJHT%
WGFYrCoVVEfs+EffDFppDRYbPE4UrWw0paHxpxgBUDpEZqU9Ix/RFx0uUXt9Jt5an5oZjqRjhnyrNAZXVWwYrZSd3OWZ2l+XPlQl94NzqgRd53MeloeeT05Fe6DEtvnunN1q/cZO7H4Ad+kXvQcP+Zx+SAXXzBWeYocytqtV2OTLqf2qlTaJfSbibForZP/c+N7PQQmw7w/H88t+nFmmv4tqtVi6OokqovYCAiA2CJCbQWRXlhwrxcXdk0vKnZ3JCcPzekFRUSN+hOOUSCM3aDQG+7vFB21I6RVbFR7WGozZ8dIHP8MliUt4R6TxAbLzDPYtZesxXJoO7qp1etzqOUxtPXgARs+a2xX2e5+DhzIprb8k897+P4YrsECARzCQTOkkJMI0B4+3CCufSLvae6ueIVhSigXXvL3OJ6TLkzWIcORwrRdlPRlxbDjoteS6m6EH3sViSTA7ojNKVIJ0/F96338ik5AwPOBASTVrts+/BvnZ0JUKGEzqJmpfsxCENz9FQUxYZxhdFy0M6yyAsGgJnnymSjW9TbHzLTbZdd3wwYIiE9DkkgtSaZQGpuKDAsj3XCoosXMy4oFW9QdRQ9be/LGOAZzEFW1e+Qf3ktdBriHmGP90Rdq0t31H26iW4xYZyE9E6Pv4rvjBo67x7JW4s1Aj5DnOJBdBdqZVuFB9HBmpwQo0VevQFwiSvSIwiLOew4O9di9K4azVIsyel1ePNgywan1q8vbowVgHxFZsxzWHHGBqLHcVmrKCJqCblxKNPV3zB22Gt+DZaNSBQJrPsP9xfBOz8z39Ds+u7IyQ33de/NLw30w2DU4tzjVi70mEYW7KFdFCpgw+UxJwTYiCRQJg9gKFjrOiB8Q2ZQIViaP7HUSkfO6LQ6baRNrQsOx41TO5e1ouCwckXhd+PgiXGwZLHREUDjc5ID2Ija+h89NR10WA5a9L+S8zsi87X365DPxW16KlptDm33Q/HcwOk8y+nqDAUpqqoVYq%
XdViXQ6kO2Y3twg4vlhjTVKaRA89eMBfpM7XqQMCcGZNZ5oqrt26KNP+O1lJ5difai/ZhqUw9dESvot+9XWWFb+e3La1HHcgCIGogxKyq40I/t0TUoJk03F+C3P1xgSkuRbM2IwCk8Q/4rUB1Gr6bc2O01pPau9DaMuc0oxHZb4/3lKQz2dI3JcIsDY15ung6yfrbQblWJymtp4i1nBiu9D0rfMboeSOcvUcRx0iKLdnu8W3L/nfjcyqB8+yAypNXr6pEMgFvHxo59FGd+S/8cGYbB/beuIVOfM7ELvyiB3fGF5ff8LsJjOR0cW24FyFSAUJnkc8XiG6N8aN7kzc3Zl1POcy5n5meGbvDA5M6loZnruOF+A6INNOOpddknXG9QDOlyc6UyBLpKL3wq7p7y1Po/cduYtA6aEwrNDo70F8kZdhtJNoYmr+JOhvT9YgzsuSUpNASJ/hwjG+eAElwVmUIrf3lgc+8XclwlTcTLLKw8vrcXNJ2l70Hf3xuZ7vAJAseE+mPxDaYP4pvu6l4YQmRXH89+lpobk6vLicKdqS9TY3lyiz2gxHLb4IQDX0lHE1bwprsdWMqfA4OPLTUTyRGpL1RQdE2C84kn3S64/V6A0rYRnWVNGSjM+1Q6j1EXsOwJW58bkxXQv1kzDau7YnboTu2D2gBkUMyYe47mTopaSgD1dKlQSjPqDaH1kKqedIBTICbF5QdAsl3As57mGu0OIqeEXn1IDg5rSxl2ZrMWPSujWHCD2SIZIvdrD5B7ZCqCAP23nd1kRkP23S+/JDN2UlZ1oduOu14ICc5GpM1fte3z6peq9UGgmNvdeYP+Ntuk3NgLTLL84iENvSIkjjIb8EU5Lun32OT4SYDQlVsJF6kqisU40JTJiS5EZ8dyBaP3rCUeupzwVUKrsTukGG+DnFnLJ45qrtXihNSm0Zj1Zv2+zewVVqF5IBluDB5XMbotcg1hPpl98lAxPDGqN3My5bH3X9px+z6lK8%
B89PXzyM/kwaU3UdAqZpdWbr9s0yCuIOEBpJbKqhKOPvqQPJDaDvuw7D+ViDsVYIQ8ZPBUQrmIyQpNE87aWlmFVD1vntcx5aq8/c45CvXLWz1TnT8pQ31JpRRL5FgaGxFnN9V9ofEAcjJaESbiIQhnVPI4PAMbHqgZAgVF9fLEBhPEiyc4YRZaEmGiwI6i6gN6mWS6amu6QhLooEMi0V60kMFI1QhqQ8z49hGuO4hCabtDRdFOjjVTYw63+91X6sriuOkZFcAG+jsTLr6iP8bpvwjPhbpJsLPjH5bvbktllj5TgN3Z69PQHEp1yeOuZPRbNZIkQ5snjCBNjimaowE33g+6LN3yEsjBaLiblIgWgQs3wApIlyRIdJiIoRN85SFAk20VZWgkF1JgHCdSeW30iZet7dEN8sxdEla0PupAYKRoi0Xmx+/nzAObf7/XxFK2O71bvMPg/rwEFQMyxnJo3Uuk2vZzrBCREhQ1Ai/vMRygboxVjsoZeJiTXgAqCKCUmJjJSkFxFzVUkJCUlMhNTOKFiagLKg9NuNPBup4qgqFiMtmmh5/NIWFT9+oshsF2fSwo7qJfJ1cAX2ew6vIgKTYshHfuntlv4SIr5btLbf1U7FgcTRR6VT7Xq1Y2dsFuZ518carOKareFKsl1WAUZT1hh32pXR3rmbc3CJDxUgpAMVUeELRafPqPAkRx9T0CCIh5CHAg9aDNkSlyGRz+gNIzdmu3oLa86VPzlzeTqa4dl+JXPBK/B+eE1Pz+MD/79j8+jMA6VQL35gY9yMAceMvbbxrDz6qRhSffB5wXz+X8LbIvUVlH1WT+lUdY9QenLYjqzFucsK7CHsLgnMvzKO4Jz94/hid8exEwNJR/dIRUkpjCiJMLVS2wIn12hCSQZx4dMiEN46AMMYPFQkTTaW5GqEI/2JBjnznZ0lSv3Cb+83DABcToGnXEqxfT6/W6RCefuFmvIyUWmLWrV6vpGmo0VCbRU+PT+TXm5a%
1bQSP4OmEMp3ZkD0jHFKo4d6MXeyl3iuDrWqIrYRnQadVjU0x4TddpGoddhITKMCuEwhz0pUU2p8cpU61qf/fAVJoU/hqh/UNa1dEgKb5E+kX9aZ6hzgMIVJnHjNqkpiP0B+Q5R/bYeoxFy9zHiZuJw3I4M0L7woC+3uPXdW0DfXiMJ1xev0edvN0Iv4qOCTrA/fLkGw8QIm9AI1FR0ENeQ8G7MFnZKQAYzmDFk2kiACShTVyuQsAOUzkeOJBt7rjHYmJf0z9JE/Tj9A0L9jUKDuMQlSf9UrtJjArjT9MOHWTSvyThBkfR/twBavKqUvmqJ7EjQH3Ggq0FC4mJImtcjnhvYhsOEberg5fYxqHCfAI3v94oYCYIZ9lxHCDs+gBsbyv4187fMUBY3Jj4gpAFNUEBNSPMsWlDxuPyxe84hKeBOjpdPYf7dCw8j5FkhKQHeKTZ+vDVJyevSHMuDwnuciG4OqZBhcC82LRqUzVF7CdUVRQ0QkEYMkea3By9doiJJTVDS/moPGMHhD7oALhXpdzWblNI4o8ES/CPB3bDZsK3O9PefiBkfz1/ZjgVhj/1/ZpllEy9RMR/K3FT73iTdYpN8hsd6u125iZCS7/KoeOU0W5QRmh4Sk102eMKra8nq/W6bvKauasxrybYKVqz5K1xsGr7/l7wrBXfIhONY/05x4zFHv3SmR5Szyw2mT1qoyCTBOK6cyMLpeK6k9cT5wExF64Yi0oia8ULttC2nwDG+Yt1eA5849tfk1Dj2e+JHIqaxUvX/jqX5TINOROpKllEUTbaC074O6iA1UZhDqCT28rBozDLPczAVK8JTFoZV9IEcpBwJx7bGlBdtkWILVoHBfAQ8qK69m8qxtEq35nAsLzGXroiJu/8xMenQ0ePTEZH/RIdHRK5a/RuLZ22RZs4psL3Kgud8SH1a5fm3gSYpUegb1cVU+zVE47Za/eWQOq2kSIInMzhXe5NFWGa8yKXGTloBZXbyiOOTf%
bKsSu9Kn/Wavg6HONYH4zu6JZLQodBF1GXh3lecFPw/Ti4tzqj1WBxU0vvltl11WGmwB8+FU+fT4mchN89MZenv8WpaWNtte4QaC0mQo8u12ZbV6hW7tk58UOuLzckVmVke4XExLItUq/SCTnponkDziHJFJPkddbnrDw5vCXkjZasl6PQyeUiAOexAJVwkQWThMuku2AZ9nSND6j9raS6fGtt+p57re2VE3RGJ9eKOtumcHqL8vGndpGOxSWIqtwDfgVWnKqKyQYOUFGtrEemeTbTPyLBPt3NM96glWUaC2cx+LrAhRwCVmZBbBU55KUD1s/Quj5AEMUIlIeUR3lgMPlj/y/YXuYMwHPowkYr+aPUVUDSbe/LlXXNbJePPGOtn+ffQbdP/YtRlqPqLhm6iH7OZfHB4BvKJ7O6XjITGk3zi4f0TUz8JFoIfb/bfftlBAdhj5puWXxCAsuONjAetaYXG7kwp+ykFvX8/SPsGSEVlU+8xdWgeyPJLQTeUIEHQLPS+bhSD797rNal9hC5CkjitHOvBBlll0aIMk3HP6uz8hCcx3gxRS71zgVUt5VetrlOlq348Wj7eWHsU3kJZHodJpufBz22Zbg4ilZ1NTozlP275HcZ2bAjfzOQixKNGlsxxfesfL9o+doCiRj4/Pt7duRO2wHgeKTN1QRVKH4ctSKzlELavv1+7WyuGyylHlfjeFDE9tsVyh8veQ2/AleTqp0Yg+LhoT0ZEec5yh4koTS4BYeko3ZxtzohMy440NVCL1mBnJk6tbQiAx/dM+4VumjRknr3/6ZzXRk8+v34lbfZOt/Lb6hL/7+GM1SQyrEsBg7BvBlZVk/a3dHSb1e4DX9cb6+5T4+UlrtsP+gZGUoR1I/0ErKUEhKgXnkWiNsD2rs0v0cIbCcsb6zraXlJnqf0/Vay79PfU6FDNKYSjtYO8NE8B/a+t0cy45F9RP1SI8zk6NDPxIUnjIjHk0FneWtngeHPu7NiPn%
5L+FAl7n5EPJDilP0p7N3BxAb4TAp5YECYp39TRQ2QTc0H3iU8rXYSeAxA0QrRAY/JlriAnNRPKBLyqFKsc/q9lqQC4lfDTgdu+4u29Jraa1lYDFu1K6ZGti10NwCtva+Hrr7qf0KZBDMtCkIMQGAhz0xCG8dPAQMwDzRu0WnShdBKuG6ESLipFUAqTJj96SAoit+cFtJjmeaw/qlunriPSr7hBuk1ilxf0E5xA9/uD+LuMPeotGVgyam/Ol08AHRl5WG/vhoWyHkYKN9nUj1Nx6L16l4V6D3luDjavbnTqFMtBAoISANclww6SAC9fvrAe9sGUQgR8UBRmDaICTDLo7GxRLAMloPGFW2F7FcoCnw25tldtMg7f1Z3RMVMzelPPVER3LAVCa2jNxzPqjFEdsyHnjL6mpKMuRGNOr/ZGE40HDp20Y+55hnrZOsnxNu8PaGo5eJoQzgnV60DjkJQZwoh+h+eI6mLTZJfxoHiYuNbCymKGJftFZScFqcVSYwLD4wUxga3+zXbaoOvI4iPEx2g7UEkuKkZ4KS1y5bEj2us1kRr2EOpKKEIy1ON/4zO1cKVZpZaKJHBYkZjMjJ4DbgpbCHrxTD5CPIy2AyvhIgVCpUSnbcsz36Sq8gTH0pU59zx0MpNikiMSFAU/T6KYGiQGvZkw8k9nwRHzOEHsob+07Zpb/WMCBWFx0fRYapBadpJfVFhyFhO0uuMFSIBUaxW8SeQIK9VxDri8k7iCQDRX+wWrK6QIyFi9xjc126gdhwircdyJ+BuqV6jlkVE9+RNpphF+A9l44uLLqA1yUylIDNobaxuxgZTcnLZgzZpFahs1SPoad7H60mrC19dYA2wvFVM1MTHQzybknVXyFpTd9JMaWedbcuutPy4YHYjYDd9R6jV1mobV1cs390/TNcEC5DzqvJppnKEmkG/EYmKhDjRu+KUXMZdbP8+4Yt8Wb5hnacrNdfsKjEuRm81xHYXRPlyIZdaSGteUl%
MBtH45+7NDBtUg1tVbmuP351+ET+Cnk3j/Quzmtaf0nqF8Hds+Sr+EggeMpHGZqWX5SakLy6klJX2RO46W7qGtXz57nnyu6m8am4DuqW17SCl+BAQ6bWoGriNFOY80ci4/2i4vMEfKS4sDegcWUgITDm5Hy8uSBdJD+AU9C+ChPw0AHoqO3a56hdk3WjIHmsY5FnYNTcBgZLvAuQagUI25BEq0ASUZqn26bTlQ6W4Ta0cJIIUs5rlZBzldA1M2ZHv+jVhoBeITPeN/BTazUuKS1W1RN6WdU6mqa6nShU/SlNSNrR5Poxenw6ubhJg8GYsihBnXoQR9GxDHWNA5bYBts/RM53hfhE4BbafgfBVZhEtPBMtKjluSQtiHRId09m2gRGbzOK8GE6aSdIrDUvm+YtPhQqs5NK99HbJNkNjUt0SRAxyTx3Po0rW4z/4CTyDc99ArHUH2F1fYED91nF9pHX+Wb4bijrl+Aw4rwNPOQ6EHd3ArbgM+mmZEh0QyuHskuyCfbIiQ2JEabF2oeGmieHhMSSedpX7AMCf2KlPyYH4Umljv95xf56eOkDdfVu3VwgltAbqoXkFfaTo1q/mNtq6mxZ+1jHH880BgssCMSre7970zbYmAhpXFBVgTyOeDzEZcLtVADUAPViMcHLuJ9lkMRSCGbK70Kl2TgOxbCPzr40J6LdJjj9XdGdixYq3ltdKSr+xgMwRa1s0iM9PUiIxSkIUp6AYuPBvG2zCpWYRO5Ty00Drh7ZteP0FoH+mTV/ARuU3lq/EKdJbqmvc6//xr+W4TxJbPnfSQuAZ/hHPdVS6R3eCRwSTgBqEv9MSwNL6eewnE+D7B0TKQ5g+NCO0i6B2C0uYmPIznRDxXmQpY8oCwwR2whRX8WdIbzBEqaypDLqEp2azNNW8bKcu1GpaiCo68ngb5hPjEnNMG7ehaPCo1zSnYX5hj3wyaQRDdlaLdrtUgbJst80xyEavWatDBKcEw9UYkvU1UM3%
ein8obiygJGNTs0xAmZoa5VTnIjiWXbbxYXTJsyua0+iaC55EXHdOtrZ/+pkDJ+IJ8e0+5O9NTXoxgRud2gL112wVr3uu69bTgN/+fDdfgpNjrjoECUwalJqk5Mdi6pZbys2dDo7h7Pg5AgCCEN0MaMdLs0O0cfbLCcOb67DfU7KlCJZOLsmlpkpz4t/gLS11QoagpljfALkK6heQmY4K6QPEn19tP63z382/5Xi4QcaeNkGgUTYAV1OTtbqIGRUU7uTj4HqjIDvtd5+DL7f594zus10+2jbJMWBBOzCHGxZFpVegq9kPxcV2s9dcku15+8NxyFSS5hkXxWDiACvoIBDCDlV26q2/1M/lcliU54dbaBR18xWRye7lU1QI+Jo7Mi0vMqOhKM6h2VQaoQrIlwb0cGua13eugqBEyzeUiAujYjBRcVA1aq8SdhsiNqOEEex/JHn9EBVFdMyaOgOnwOn6mbXIupIzFk7F3HeQxH6TkE62qTfFSGpGPYyrwW84UmrTxa79o4hmuB6MErNXV1szKcgAzGUBmQqw05dl4t+vv9XUtT2C6lf5BAkSB28Wj998Q/J9xjAX7647TOtFiXztmD1QeNhnOofKpRi9qzKMMGeaZrw7R9sX14lDguDXr6Ua5Ncu0kdfeB2YNA7sbTIjJ4gpaobHFRSmx8mLDYmfUGAyYhOaagmJGb06SA+jpiMbhyH5GPiFsIDAJR5ORbo1ub0hxeK/DJ8YyoMcWxmV9j1xS55tjFrrU76OBbA+HjvMDYe0bs5AkVlouXqe57nwllZmqyc6OPBiaqugnOMm9mgKpIJo1tOxFPMHPzd/3eOgJKM8v6nEbi0N3IPO+Nmok9dhsp6EBS2Y9IScK+WRJ67g3ONHguKOzrBkjcGN5+D742ZOvBd/DrUo6cs7vl/00zdD7H/L2kdYcAArC679e+OM0hbcb/Dx4GAC8f6CcA+P1o/9+/B/+1vZ03rgJCwM6lL/HSwv8r4+fns%
pFpmj9St+09RZ991CjyngAuB1uDM3CAxzXsPewvInbGwcjli8GltFf7vw3QcPO1Qak0w9fBqmfWOdEbe7p3et/2VWL3gyMsg2K56NrXCNLZWHU+rrTU90Fap4rEvLjZCypyL5UkcDdDHCztM9dmFCmMbfd+5UHYwQofHRw0AWE3I8XcgJS6H9FM8Eqo3kFdLCfUP7tFgAgexy0cqVFdyJZT1ZVgzQifWMUr5fDgLF8y7ZTmn/2AAdj533pXqYbYj6nxyz53+fvi6iDMoO1/Dfd3PmcX1U/BJx0fKC7scwRls5P9HCDYf435eFXOgNVBHntYIsCrI/ZyleJyQW/Zi/houA6EWCr1eP/uZYz9Rzf16tq6b6j7Cs/QVHQhugrxS13AaOvRtahvp+tN2U80/okUtqZdA46fCXtVlWJQvRqsWjLxKu3fuTK31yS7GHEUwNKQH4CE5yr3O8NVPcqnJg0nQGgptJ9zenuKbcW4VNtaSTndwteYGMo6nyxeD+rBd3ptlNrjMtLn6d6RoLHmROeCiLrundsksUc59as9jcO+Hqpvrur+yeBm6jsf9RU38UFY1dj4pdJp2iPs/ppJPS84TriDE77TJ2S3PJY0Q6rwu3aPqEf5V7G3KPvVojuCtPNmv7zR2swIxVDkactgnnlDaWu/q/bhTUd0s339CadhXB6VKijntAUtpDiixMeUsvkAaDnJOXbD2qFUth9GKRcTx8ykZL3KVx6Meyo6/tViOqooe6R2DN2xm0fSF4K7H68z6GSF3g1yQ9fwTrzYBsioykMkNp87fHdANPToLkCCvsgfvE81rdx2jnhMOQt41Ftn1D0fLaZppeFVJjQNYbd6svNK6Vkhcvn51ZW1cdh9SrIB1m0E9inZvvTGvW/L/vXM2d6InT3P2UIGTTkDPAuwV6RoVZRgFTyaLCyz6VoG2v4jwBgXUzLK54lX5cDJoqR+M5kc41dKOsm09rol2bj7+3ef4V0hKHSjHM2T5%
UIOKAKciLT8aDNsUBtZc/v42Alx5zmnc5ibkuNiUBdK788d3tUt/LwoKFe399Ipq8q4eYN+SEol+7qogAxp2Md16/+UwuOfah0pcO90uktKvYvce4qJX3NS/fHwd3XkqHtp3EkAYmdChw+CpEh1p32yg65Lk70w2tDMWILFEEzaQZHzgcwM7V09lXfEyswbpuwtb3j120XQd7KWhM65ww88Yd4ptodbXUTXhzGKpxwZ1WEJPI5SaUVbKgWOG2n0mGU5o3TCkfqApv+50iiPwLg3gFVV/g7hnDRlNrNfA1XrE8zpEs1C31OTLXNYCWIbC3alGzLJaZ3AeUUkJZoZa8EpEdc1RTXBGPcddVHixKGyEaycQZeuXdeRogmdRco6XBQds3RoRDJGRdC0rIDuREA8RcFqFITb45Y/j19tJo/JTnKctAgHxq2njl9d4mc/dlwVFc83jePu2DcYP51yq6hvWdvrAmSp6Z9CpbiSjJ1z3AbhhM4rtvl+nwMzSGwNKfmZUzTCFnsqrOYAAzTvDDJliCCuuY8mx7AbDvLhMvsh8CGMHZIxffQlHw7DAx8B5xj7iJgm0kfCMTwfBb20+9QwyJhP3Rrb7NMgYx721QQf1Qou3vddi8BmiFFBqUGVYnJFqlnz5c2H30HmFESGJeQyVZbI8gwypZZMIaw0Ve3pJWQoZkWpYbmojK+iYs1ZnlVNmVghvN6OXHFufA0xTxKplpdSjq8hVazw4YxVvBTu2aMwF12Qby25GqUKVPHhyZcPb6HYUmWJFSqWeTmAB+RpbLYyPFvP6SrFcrkSVNcTKgZmm8yZgFeXbawCtYqpNMEcy1oBtVRroExZXkBC5kjJtCJyR0aaL1c4Ls4hZU61Kom7L1CqVAPr6ZVqeG1clk2Fqy/VaiQQZYVS+2zIkDMtL9dHThbZk9UEMdx9zHAw3VohrzIFGRhiTcq/bBU8VWEwSO5eG6/CMSSTFK6tU6Cc5tLyXOI+VeV6uUaIt%
G+VI5syJWEzT/Vc/3Kp/dnCxD0n1pDSMM2tMogP6k9e7DFHrDRVrXMF5qBKJ0o6P7tqIZ5SK7RTCy+zqOCerj8+5AIGxvOBbSTY4z9KNA8oMhKMn8O5SGxXCBZYiIUiCYXdHKKGo//4H6RRt0iLwilUtkYLZ7JoW5yf/JKuX9NLP4NoGWaUsTeZcOEaU3+aWeZZcItlVllnk2123GPvtxz87pK/uZxjTjnnkmtuPOLOMx558opX3vnkm5+nvOPPJwEFRi+o4EIUJpSvva7EcLUwctcLL8LaRBZVtNHE2MMvscUVz19AEkosKabAsDz3j7FLLgU9qaWVXkaZcbwX5EZZbpatyK1yyo0bL36C8gQLiTBR+RUIjRjD2ySORyosMi8rTC5WcYooDKZYqXUpSVFpZZVXkbLKqlJVXU211VVfQ4011VxLrbXVXkedddVdT731taCFLaq/gQYbariRRhtrvMUtaWnLWt6KJlrZqla3prWta30bmmxjm9rclra2re3taGe72t2e9jbVvvZ3oIMd6nBHOtqxjneik53qdNOd6WznOt+FZrrYT/3cL/3ab/2uJJe63BVq9rZrtijPdVEKULFTJk4EUW4Qyhcu0n2v9Yk3z5MAduVmtzzUndvusKBNv5MSdDrbnRBduWso9xxB5oHb3ZdImQfNqqLKQ5XM7Mgj++3L4570tGes87wXvTSHYP9MSjLNOK+dsZmRE/6AmTf+srne9s7CvO+DmHxkY4lttjvlNFY+9dkjOvmCrTpf1apTk299N2ZVfvRHf/ZXf/eP5PwrJf813/9SBzCT5OSxstjGIXLUM2nuDYmPQ2bZUPhE+qgpQpGKwtxOw0OlfrQgkaFhtGkaHc2mPNY4uqM3+mMwNAZj6Bvf+Swjq62xfoy1jIlMC2igyXIUdJ0zM6ZjZiUtxk2MOQ5bGxC54ICDDjnsPHWyxsKmsRyrsbZobMzKHlsv/Cu7sR8HvSyZjuM4jfO4MKEHp8cKO%
eM6buM+HuM5Xj4wHG8/+Mrd8RlfA2i+cKxwqf8ArVe1p+vQdl30jSFDM4YNHzHywcNHj588ffb8xctXr9+8fff+w8dPufQVF28YT6b4KwTeDThmaaG8da+G6Zd+NugNu6MRoLTTiTSatoJ+19jWZa2aMLM9AGvrYDUa6/gNwrS4on60wYkD+R3Xbrif6KJIXpskhYF2uAcfXyesBVi9AJqwWrGBSsMkRiRbBpGkAke2ytNRjUCbhq7V0BI9UNQPiVD+vxY4z2hFR5mnCYNQnRePQb5s7L1US/jWqzB+yvRsCrL0pVDfoDRbNspEURXFGw3j9e+Z6TdsrrkDr8OfQDWeMoWolk90jNuGNtZoERLnJH59TjnxRi/bJOcvKslrE+kBWYkWn72kP3q0721aMne8Z6KaXYrsgFzjS5fnNNXwROZlNrn+cz5HHPquL585RuYTFkPuk0zkTlFYFOwPK0MVc8gUafVIVmWFOrkp1MauxPrXZnOt9DvX93TNg7wmGzxUk3CHpro2v8Sm3NOmUENoW2/aZdNaP7ZDQdp4x0p9EGPUPy3oFomL0PpiCfoWWv2K66v8E/TDjicSA4cxbxHGlCWYBvODKa9NTZrJ7JMed+uczEz8FTf3zCiAsJfje8UJAhzWXLcAEaYIzbDmug2IMEVohjXXXYAIU4RmWHPdAUSYIjTDmutuQERohjXXPYAIU4RmWHPdC4gwRWiGNdd9gAhThGZYvQRlgAhThGZYc25fgtkSC5pvNoU4f5Ya7eHSUeY/88pnzTK7frpxxN5EjEVYA625sNhrYc2vxa2uNy+ZuZmGvNRq7LttLs+m2wasjgIFUMiDgoINs27LjnMJDS2FpPcv3YRzTlM4SYbfqOOwVH0snOawj8Lx5JiuW3neL77+Tozp1LegzkXTOp0k3Q9pmXk5KlyaX4vr31zzd7wW0MJlXz89HGStnL2WVLnsu/josxifk3CE/zHOUgdrRuL9+iqvefNvVZsHQ%
4WPs1nZVihP5He8vP5Vwvn0ZB5P93UrBL+o/ivu35SmIiaWQC8Fs3qhEr2g9Srb5PVaq9rWbiYu1q/5E4KUfovhpqAX4Jo7XYjfnqUC2luVGkpTmI4qg4OwpcocXbKsjeqeSFdW8Ib86Bdm2zfgBCj1uNFLGARHzvet/xa0X7brsHv48gh4qLB6SzBhUiiEejyxSklW2m9+mDT0onz5Qv/e8K5YW3lxH0SdesoVb3hSr5CTy2JvedigIS2Nto6uvvVPPlFlVar6yRzz+d730JcC6QpU8ukktIrb0/0O4Rkds0whGkS/MwGEhGAv/zFGSHYk5c5+eVlh+T080vbsZZ8BAAAAGwsSAJyFsfOiwBiEhXJCUf7i+/cRksz69lPljyBdUNrKGbRrswnQt62k8pDurwx/vao7y8Rpc6lJ5hw68y1UHr/glLG0zaUAkikuNia/X+nZ2JMn/NlrK+3uJJMs0d8tEFjKyy+jBBK6koQ+t7EhKLiCLB9Lq+1XnymKDRAjKsn0bzMxSyrCatZf1BR85fl+IQM4Kzm6cXOfGoDzASuDHt8c/0Iv91m7AanJQlJZ1PR2febLt2u3yEpJpitmiAqwkZI8AOp277+3c1q6e8Ney39tU+8vk9dedyppffpKc+ACyHQQIdlk7o1shgy1/8/moZX1BKJVDvY02jbVQVqK3mfW2u1ndHHow3rRt8/P5j+B3qXwR7lGPDmdyANZp2Jw9CvN5D206yIM+7PCXJ40Z3HxdeWOzzeVAek+OE//ilxVln5Win8lZCSQeVzumJae5tWPJFScctG5TqEI6c3OCktNH5rOQQGYFaqkMVqOMJXi1C9iF+wGYhz73+InjOyKMoY9HVBaV9khRB9+vpRpmAXV8GkaTKJic8kFigOItU5+pZmvU7YcSder4ub/IE60/oKA7uUkrAQWBR5weFH5wnzmIp9/Iv4FHqbNLG76gtiXSqYckl6R1OB+6ydgNv3MrfT9I/xbYTu+9%
kSzJ4KTxrjYGMnYbXrMBf85xGTpU2AU7mWCd/GYI5kRVmffiMWtlDtZp5R8ZdL4iONSeWIo5XJUEVGAY3yhDgdQ3B8jFRTUOsGmu1NP1eyotfZlYJLdr1KHsh5d8Ijk3ISChZCSIXF0OsXnYlffmC/gRyRSDOBDgvJpBTs9hzMYHqU+6ql0eqU25PJ69sNAJ6GWsIAZ8HAwpjTZvfJAUUno1TcESXFzWE/yhQ/GrBh6i/9LtdEZ9g/M9pGQkYPr4nCF6K+J67dISw5l4CrLOFmcDzzUDH5hnmitMVWza7SbePoRdgW74DIRagCcWx+LaOiwp1ZBogR+4mkXMCVzYRYhgP9XmByJo0CAldSmwTQ1EKYOInblXfChGDgM0hNIP5LyNwheHXdfwvXRCpgVObmwMNPxh6jFZKL5uomqPZuWBNdG6gjQBJ4gKLf7q9oeQaRYfOuJJ2oWnq4NFEfE9aoS+xEbP+aMApcYMjfr2rGotsm5cPd6HUEOlbCLYZ1Xp+Ckbb8mSQ+bp5zzkpZL2kImusLU6HezlGbuRWbaRsqhk1D9DuDs7PpIpYukIPeRbjyOv8EVS6I8AmmK1LIDzlCN2473DNdXWUjaANV+tbW9VEm6jXQBvKlhPWHpOw3bLjyd1pNQxD6G2nR82aM3nOK8t4oOtV6ontzsCa1aSGfvEip+yLOcR7i1VVgtoheGQvr9tAIexD1h7vKLwu8SXy8BZIPSkDCqMZsrw5JFWPoMmrLXY4pNSVyyPnKQYnKaYLHCrXwdhCNHQoZqRQs4KOf0EWfQN9AZ4jpETtLLagSPz8til6z2yQmYcTT763+s95TFPa+HIdc+FlGvA8QCDQ27yzXqrgoLsDwRcJuwIHxTpEguIk2iVSgp/sqTgeMcJb3sCUE9kUlRxQTdsdia+DxnLYgIcSKjMVLZnBcry+ZTEQ+2W7AdWkEttVkKNUN4Urljcwu6UkJ4+bLuCDMxj2No4WGXMJmFkIaVB5ykG%
LRaZpP4j9b33ddJy+bd1kbJza8/V0G8sycWvPOtD+17xmAqry8bx7CeAxpDPJheF6fTuX2mTQNaVwFfvZF87lc/SV4toMzHJXWHggvDYUjVcNVFEeTp1mQ2iriZfLK8Ady5vKlX0yfLPUq+YGC4PXOrNhiIfEjuTHkwytDNvfJs0s8K0hTvd4VTTS0+bG7jUIZiKBZwEl95iTTpOGJJ7Uou8XXeLorYM/HKV/yvabkpwmQmb6pt85ED7pngGUude7p5nJ+F17h3n7TKe4du22gw9O7+W9NfhXWNsD3PFDgSLnTJZZjcecNwbVxz/GJP6sIs29yMznTuAQ==) format('woff2');}]]></style>}
\fi
\dcga{-1.0544}{0}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{0.2372}{0.5272}{-0.2372}
\dcgc{2.8995}{0}{3.7958}{4.1121}{5.0083}{0.4481}{-0.4481}
\dcgd{6.8535}{0}{7.2752}{0.4745}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{0}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{0}{15}
\dcgf{11.5718}{0.1318}{-0.1318}{11.44}{0}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{0.369}{16.132}{0}{-0.369}
\dcga{14.7613}{0}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{0.369}{-0.369}
\dcga{18.7152}{0}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{0.2372}{20.2968}{-0.2372}
\dcgc{22.6692}{0}{23.5654}{23.8817}{24.7779}{0.4481}{-0.4481}
\dcgd{26.6231}{0}{27.0448}{0.4745}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{0}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{0}{15}
\dcgf{31.3414}{0.1318}{-0.1318}{31.2096}{0}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{0.369}{35.9016}{0}{-0.369}
\dcga{34.5309}{0}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{0.369}{-0.369}
\dcga{-1.0544}{-3.1631}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-2.9259}{0.5272}{-3.4004}
\dcgc{2.8995}{-3.1631}{3.7958}{4.1121}{5.0083}{-2.715}{-3.6112}
\dcgd{6.8535}{-3.1631}{7.2752}{-2.6887}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-3.1631}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-3.1631}{15}
\dcgf{11.5718}{-3.0313}{-3.2949}{11.44}{-3.1631}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-2.7941}{16.132}{-3.1631}{-3.5322}
\dcga{14.7613}{-3.1631}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-2.7941}{-3.5322}
\dcga{18.7152}{-3.1631}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-2.9259}{20.2968}{-3.4004}
\dcgc{22.6692}{-3.1631}{23.5654}{23.8817}{24.7779}{-2.715}{-3.6112}
\dcgd{26.6231}{-3.1631}{27.0448}{-2.6887}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-3.1631}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-3.1631}{15}
\dcgf{31.3414}{-3.0313}{-3.2949}{31.2096}{-3.1631}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-2.7941}{35.9016}{-3.1631}{-3.5322}
\dcga{34.5309}{-3.1631}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-2.7941}{-3.5322}
\dcga{-1.0544}{-6.3263}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-6.089}{0.5272}{-6.5635}
\dcgc{2.8995}{-6.3263}{3.7958}{4.1121}{5.0083}{-5.8782}{-6.7744}
\dcgd{6.8535}{-6.3263}{7.2752}{-5.8518}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-6.3263}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-6.3263}{15}
\dcgf{11.5718}{-6.1945}{-6.4581}{11.44}{-6.3263}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-5.9572}{16.132}{-6.3263}{-6.6953}
\dcga{14.7613}{-6.3263}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-5.9572}{-6.6953}
\dcga{18.7152}{-6.3263}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-6.089}{20.2968}{-6.5635}
\dcgc{22.6692}{-6.3263}{23.5654}{23.8817}{24.7779}{-5.8782}{-6.7744}
\dcgd{26.6231}{-6.3263}{27.0448}{-5.8518}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-6.3263}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-6.3263}{15}
\dcgf{31.3414}{-6.1945}{-6.4581}{31.2096}{-6.3263}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-5.9572}{35.9016}{-6.3263}{-6.6953}
\dcga{34.5309}{-6.3263}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-5.9572}{-6.6953}
\dcga{-1.0544}{-9.4894}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-9.2522}{0.5272}{-9.7267}
\dcgc{2.8995}{-9.4894}{3.7958}{4.1121}{5.0083}{-9.0413}{-9.9375}
\dcgd{6.8535}{-9.4894}{7.2752}{-9.0149}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-9.4894}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-9.4894}{15}
\dcgf{11.5718}{-9.3576}{-9.6212}{11.44}{-9.4894}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-9.1204}{16.132}{-9.4894}{-9.8584}
\dcga{14.7613}{-9.4894}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-9.1204}{-9.8584}
\dcga{18.7152}{-9.4894}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-9.2522}{20.2968}{-9.7267}
\dcgc{22.6692}{-9.4894}{23.5654}{23.8817}{24.7779}{-9.0413}{-9.9375}
\dcgd{26.6231}{-9.4894}{27.0448}{-9.0149}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-9.4894}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-9.4894}{15}
\dcgf{31.3414}{-9.3576}{-9.6212}{31.2096}{-9.4894}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-9.1204}{35.9016}{-9.4894}{-9.8584}
\dcga{34.5309}{-9.4894}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-9.1204}{-9.8584}
\dcga{-1.0544}{-12.6526}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-12.4153}{0.5272}{-12.8898}
\dcgc{2.8995}{-12.6526}{3.7958}{4.1121}{5.0083}{-12.2044}{-13.1007}
\dcgd{6.8535}{-12.6526}{7.2752}{-12.1781}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-12.6526}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-12.6526}{15}
\dcgf{11.5718}{-12.5208}{-12.7844}{11.44}{-12.6526}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-12.2835}{16.132}{-12.6526}{-13.0216}
\dcga{14.7613}{-12.6526}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-12.2835}{-13.0216}
\dcga{18.7152}{-12.6526}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-12.4153}{20.2968}{-12.8898}
\dcgc{22.6692}{-12.6526}{23.5654}{23.8817}{24.7779}{-12.2044}{-13.1007}
\dcgd{26.6231}{-12.6526}{27.0448}{-12.1781}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-12.6526}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-12.6526}{15}
\dcgf{31.3414}{-12.5208}{-12.7844}{31.2096}{-12.6526}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-12.2835}{35.9016}{-12.6526}{-13.0216}
\dcga{34.5309}{-12.6526}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-12.2835}{-13.0216}
\dcga{-1.0544}{-15.8157}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-15.5785}{0.5272}{-16.0529}
\dcgc{2.8995}{-15.8157}{3.7958}{4.1121}{5.0083}{-15.3676}{-16.2638}
\dcgd{6.8535}{-15.8157}{7.2752}{-15.3412}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-15.8157}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-15.8157}{15}
\dcgf{11.5718}{-15.6839}{-15.9475}{11.44}{-15.8157}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-15.4467}{16.132}{-15.8157}{-16.1847}
\dcga{14.7613}{-15.8157}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-15.4467}{-16.1847}
\dcga{18.7152}{-15.8157}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-15.5785}{20.2968}{-16.0529}
\dcgc{22.6692}{-15.8157}{23.5654}{23.8817}{24.7779}{-15.3676}{-16.2638}
\dcgd{26.6231}{-15.8157}{27.0448}{-15.3412}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-15.8157}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-15.8157}{15}
\dcgf{31.3414}{-15.6839}{-15.9475}{31.2096}{-15.8157}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-15.4467}{35.9016}{-15.8157}{-16.1847}
\dcga{34.5309}{-15.8157}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-15.4467}{-16.1847}
\dcga{-1.0544}{-18.9788}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-18.7416}{0.5272}{-19.2161}
\dcgc{2.8995}{-18.9788}{3.7958}{4.1121}{5.0083}{-18.5307}{-19.4269}
\dcgd{6.8535}{-18.9788}{7.2752}{-18.5044}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-18.9788}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-18.9788}{15}
\dcgf{11.5718}{-18.847}{-19.1106}{11.44}{-18.9788}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-18.6098}{16.132}{-18.9788}{-19.3479}
\dcga{14.7613}{-18.9788}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-18.6098}{-19.3479}
\dcga{18.7152}{-18.9788}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-18.7416}{20.2968}{-19.2161}
\dcgc{22.6692}{-18.9788}{23.5654}{23.8817}{24.7779}{-18.5307}{-19.4269}
\dcgd{26.6231}{-18.9788}{27.0448}{-18.5044}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-18.9788}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-18.9788}{15}
\dcgf{31.3414}{-18.847}{-19.1106}{31.2096}{-18.9788}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-18.6098}{35.9016}{-18.9788}{-19.3479}
\dcga{34.5309}{-18.9788}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-18.6098}{-19.3479}
\dcga{-1.0544}{-22.142}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-21.9047}{0.5272}{-22.3792}
\dcgc{2.8995}{-22.142}{3.7958}{4.1121}{5.0083}{-21.6939}{-22.5901}
\dcgd{6.8535}{-22.142}{7.2752}{-21.6675}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-22.142}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-22.142}{15}
\dcgf{11.5718}{-22.0102}{-22.2738}{11.44}{-22.142}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-21.7729}{16.132}{-22.142}{-22.511}
\dcga{14.7613}{-22.142}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-21.7729}{-22.511}
\dcga{18.7152}{-22.142}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-21.9047}{20.2968}{-22.3792}
\dcgc{22.6692}{-22.142}{23.5654}{23.8817}{24.7779}{-21.6939}{-22.5901}
\dcgd{26.6231}{-22.142}{27.0448}{-21.6675}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-22.142}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-22.142}{15}
\dcgf{31.3414}{-22.0102}{-22.2738}{31.2096}{-22.142}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-21.7729}{35.9016}{-22.142}{-22.511}
\dcga{34.5309}{-22.142}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-21.7729}{-22.511}
\dcga{-1.0544}{-25.3051}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-25.0679}{0.5272}{-25.5423}
\dcgc{2.8995}{-25.3051}{3.7958}{4.1121}{5.0083}{-24.857}{-25.7532}
\dcgd{6.8535}{-25.3051}{7.2752}{-24.8306}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-25.3051}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-25.3051}{15}
\dcgf{11.5718}{-25.1733}{-25.4369}{11.44}{-25.3051}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-24.9361}{16.132}{-25.3051}{-25.6741}
\dcga{14.7613}{-25.3051}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-24.9361}{-25.6741}
\dcga{18.7152}{-25.3051}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-25.0679}{20.2968}{-25.5423}
\dcgc{22.6692}{-25.3051}{23.5654}{23.8817}{24.7779}{-24.857}{-25.7532}
\dcgd{26.6231}{-25.3051}{27.0448}{-24.8306}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-25.3051}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-25.3051}{15}
\dcgf{31.3414}{-25.1733}{-25.4369}{31.2096}{-25.3051}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-24.9361}{35.9016}{-25.3051}{-25.6741}
\dcga{34.5309}{-25.3051}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-24.9361}{-25.6741}
\dcga{-1.0544}{-28.4682}{-0.5272}{0.5272}{1.0544}
\dcgb{-0.5272}{-28.231}{0.5272}{-28.7055}
\dcgc{2.8995}{-28.4682}{3.7958}{4.1121}{5.0083}{-28.0201}{-28.9164}
\dcgd{6.8535}{-28.4682}{7.2752}{-27.9938}{7.5915}{7.9078}{8.2242}{8.5405}{8.9622}
\dcga{10.8074}{-28.4682}{11.3346}{12.389}{12.9161}
\dcge{11.8618}{-28.4682}{15}
\dcgf{11.5718}{-28.3364}{-28.6}{11.44}{-28.4682}{11.7036}{12.0463}{12.2572}
\dcgg{15.4467}{-28.0992}{16.132}{-28.4682}{-28.8373}
\dcga{14.7613}{-28.4682}{15.4467}{16.132}{16.8701}
\dcgh{16.132}{-28.0992}{-28.8373}
\dcga{18.7152}{-28.4682}{19.2424}{20.2968}{20.824}
\dcgb{19.2424}{-28.231}{20.2968}{-28.7055}
\dcgc{22.6692}{-28.4682}{23.5654}{23.8817}{24.7779}{-28.0201}{-28.9164}
\dcgd{26.6231}{-28.4682}{27.0448}{-27.9938}{27.3611}{27.6775}{27.9938}{28.3101}{28.7318}
\dcga{30.577}{-28.4682}{31.1042}{32.1586}{32.6858}
\dcge{31.6314}{-28.4682}{15}
\dcgf{31.3414}{-28.3364}{-28.6}{31.2096}{-28.4682}{31.4732}{31.8159}{32.0268}
\dcgg{35.2163}{-28.0992}{35.9016}{-28.4682}{-28.8373}
\dcga{34.5309}{-28.4682}{35.2163}{35.9016}{36.6397}
\dcgh{35.9016}{-28.0992}{-28.8373}
\dcgi{-0.3427}{1.1994}{0.339}{0.3719}
\node[dcc] at (0,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-11" y="7.5" font-size="22">R</text><text x="2.8281" y="10.7969" font-size="15.4">1</text></g></g>}{$R_1$}};
\dcgi{3.5849}{1.1994}{4.3316}{0.3719}
\node[dcc] at (3.9539,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-12" y="7.5" font-size="22">R</text><text x="1.8281" y="10.7969" font-size="15.4">2</text></g></g>}{$R_2$}};
\dcgi{7.5388}{1.1994}{8.2855}{0.3719}
\node[dcc] at (7.9078,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-12" y="7.5" font-size="22">R</text><text x="1.8281" y="10.7969" font-size="15.4">3</text></g></g>}{$R_3$}};
\dcgi{11.4927}{1.1994}{12.2395}{0.3719}
\node[dcc] at (11.8618,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-12" y="7.5" font-size="22">R</text><text x="1.8281" y="10.7969" font-size="15.4">4</text></g></g>}{$R_4$}};
\dcgi{15.4467}{1.1994}{16.1934}{0.3719}
\node[dcc] at (15.8157,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-12" y="7.5" font-size="22">R</text><text x="1.8281" y="10.7969" font-size="15.4">5</text></g></g>}{$R_5$}};
\dcgi{19.4006}{1.1994}{20.1473}{0.3719}
\node[dcc] at (19.7696,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-12" y="7.5" font-size="22">R</text><text x="1.8281" y="10.7969" font-size="15.4">6</text></g></g>}{$R_6$}};
\dcgi{23.3545}{1.1994}{24.1012}{0.3719}
\node[dcc] at (23.7235,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-12" y="7.5" font-size="22">R</text><text x="1.8281" y="10.7969" font-size="15.4">7</text></g></g>}{$R_7$}};
\dcgi{27.3084}{1.1994}{28.0551}{0.3719}
\node[dcc] at (27.6775,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-12" y="7.5" font-size="22">R</text><text x="1.8281" y="10.7969" font-size="15.4">8</text></g></g>}{$R_8$}};
\dcgi{31.2623}{1.1994}{32.0091}{0.3719}
\node[dcc] at (31.6314,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-style="normal" font-weight="400"><text x="-12" y="7.5" font-size="22">R</text><text x="1.8281" y="10.7969" font-size="15.4">9</text></g></g>}{$R_9$}};
\dcgi{35.0713}{1.1994}{36.1071}{0.3719}
\node[dcc] at (35.5853,0.7908) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">0</text></g></g>}{$R_10$}};
\dcgi{-0.4745}{-1.9638}{0.4683}{-2.7912}
\node[dcc] at (0,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-16" y="7.5">R</text><text x="-2.1719" y="10.7969" font-size="15.4">1</text><text x="5.8594" y="7.5">1</text></g></g>}{$R_11$}};
\dcgi{3.4399}{-1.9638}{4.4758}{-2.7912}
\node[dcc] at (3.9539,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">2</text></g></g>}{$R_12$}};
\dcgi{7.3938}{-1.9638}{8.4297}{-2.7912}
\node[dcc] at (7.9078,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">3</text></g></g>}{$R_13$}};
\dcgi{11.3478}{-1.9638}{12.3836}{-2.7912}
\node[dcc] at (11.8618,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">4</text></g></g>}{$R_14$}};
\dcgi{15.3017}{-1.9638}{16.3375}{-2.7912}
\node[dcc] at (15.8157,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">5</text></g></g>}{$R_15$}};
\dcgi{19.2556}{-1.9638}{20.2914}{-2.7912}
\node[dcc] at (19.7696,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">6</text></g></g>}{$R_16$}};
\dcgi{23.2095}{-1.9638}{24.2454}{-2.7912}
\node[dcc] at (23.7235,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">7</text></g></g>}{$R_17$}};
\dcgi{27.1634}{-1.9638}{28.1993}{-2.7912}
\node[dcc] at (27.6775,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">8</text></g></g>}{$R_18$}};
\dcgi{31.1174}{-1.9638}{32.1532}{-2.7912}
\node[dcc] at (31.6314,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17.5" y="7.5">R</text><text x="-3.6719" y="10.7969" font-size="15.4">1</text><text x="4.3594" y="7.5">9</text></g></g>}{$R_19$}};
\dcgi{35.0318}{-1.9638}{36.1327}{-2.7912}
\node[dcc] at (35.5853,-2.3724) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">0</text></g></g>}{$R_20$}};
\dcgi{-0.5008}{-5.1269}{0.507}{-5.9544}
\node[dcc] at (0,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17" y="7.5">R</text><text x="-3.1719" y="10.7969" font-size="15.4">2</text><text x="7.3281" y="7.5">1</text></g></g>}{$R_21$}};
\dcgi{3.4004}{-5.1269}{4.5013}{-5.9544}
\node[dcc] at (3.9539,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">2</text></g></g>}{$R_22$}};
\dcgi{7.3543}{-5.1269}{8.4552}{-5.9544}
\node[dcc] at (7.9078,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">3</text></g></g>}{$R_23$}};
\dcgi{11.3082}{-5.1269}{12.4091}{-5.9544}
\node[dcc] at (11.8618,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">4</text></g></g>}{$R_24$}};
\dcgi{15.2621}{-5.1269}{16.3631}{-5.9544}
\node[dcc] at (15.8157,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">5</text></g></g>}{$R_25$}};
\dcgi{19.2161}{-5.1269}{20.317}{-5.9544}
\node[dcc] at (19.7696,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">6</text></g></g>}{$R_26$}};
\dcgi{23.17}{-5.1269}{24.2709}{-5.9544}
\node[dcc] at (23.7235,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">7</text></g></g>}{$R_27$}};
\dcgi{27.1239}{-5.1269}{28.2248}{-5.9544}
\node[dcc] at (27.6775,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">8</text></g></g>}{$R_28$}};
\dcgi{31.0778}{-5.1269}{32.1788}{-5.9544}
\node[dcc] at (31.6314,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">2</text><text x="5.3281" y="7.5">9</text></g></g>}{$R_29$}};
\dcgi{35.0318}{-5.1269}{36.1327}{-5.9544}
\node[dcc] at (35.5853,-5.5355) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">0</text></g></g>}{$R_30$}};
\dcgi{-0.5008}{-8.2901}{0.507}{-9.1175}
\node[dcc] at (0,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17" y="7.5">R</text><text x="-3.1719" y="10.7969" font-size="15.4">3</text><text x="7.3281" y="7.5">1</text></g></g>}{$R_31$}};
\dcgi{3.4004}{-8.2901}{4.5013}{-9.1175}
\node[dcc] at (3.9539,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">2</text></g></g>}{$R_32$}};
\dcgi{7.3543}{-8.2901}{8.4552}{-9.1175}
\node[dcc] at (7.9078,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">3</text></g></g>}{$R_33$}};
\dcgi{11.3082}{-8.2901}{12.4091}{-9.1175}
\node[dcc] at (11.8618,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">4</text></g></g>}{$R_34$}};
\dcgi{15.2621}{-8.2901}{16.3631}{-9.1175}
\node[dcc] at (15.8157,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">5</text></g></g>}{$R_35$}};
\dcgi{19.2161}{-8.2901}{20.317}{-9.1175}
\node[dcc] at (19.7696,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">6</text></g></g>}{$R_36$}};
\dcgi{23.17}{-8.2901}{24.2709}{-9.1175}
\node[dcc] at (23.7235,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">7</text></g></g>}{$R_37$}};
\dcgi{27.1239}{-8.2901}{28.2248}{-9.1175}
\node[dcc] at (27.6775,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">8</text></g></g>}{$R_38$}};
\dcgi{31.0778}{-8.2901}{32.1788}{-9.1175}
\node[dcc] at (31.6314,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">3</text><text x="5.3281" y="7.5">9</text></g></g>}{$R_39$}};
\dcgi{35.0318}{-8.2901}{36.1327}{-9.1175}
\node[dcc] at (35.5853,-8.6986) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">0</text></g></g>}{$R_40$}};
\dcgi{-0.5008}{-11.4532}{0.507}{-12.2806}
\node[dcc] at (0,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17" y="7.5">R</text><text x="-3.1719" y="10.7969" font-size="15.4">4</text><text x="7.3281" y="7.5">1</text></g></g>}{$R_41$}};
\dcgi{3.4004}{-11.4532}{4.5013}{-12.2806}
\node[dcc] at (3.9539,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">2</text></g></g>}{$R_42$}};
\dcgi{7.3543}{-11.4532}{8.4552}{-12.2806}
\node[dcc] at (7.9078,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">3</text></g></g>}{$R_43$}};
\dcgi{11.3082}{-11.4532}{12.4091}{-12.2806}
\node[dcc] at (11.8618,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">4</text></g></g>}{$R_44$}};
\dcgi{15.2621}{-11.4532}{16.3631}{-12.2806}
\node[dcc] at (15.8157,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">5</text></g></g>}{$R_45$}};
\dcgi{19.2161}{-11.4532}{20.317}{-12.2806}
\node[dcc] at (19.7696,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">6</text></g></g>}{$R_46$}};
\dcgi{23.17}{-11.4532}{24.2709}{-12.2806}
\node[dcc] at (23.7235,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">7</text></g></g>}{$R_47$}};
\dcgi{27.1239}{-11.4532}{28.2248}{-12.2806}
\node[dcc] at (27.6775,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">8</text></g></g>}{$R_48$}};
\dcgi{31.0778}{-11.4532}{32.1788}{-12.2806}
\node[dcc] at (31.6314,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">4</text><text x="5.3281" y="7.5">9</text></g></g>}{$R_49$}};
\dcgi{35.0318}{-11.4532}{36.1327}{-12.2806}
\node[dcc] at (35.5853,-11.8618) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">0</text></g></g>}{$R_50$}};
\dcgi{-0.5008}{-14.6163}{0.507}{-15.4438}
\node[dcc] at (0,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17" y="7.5">R</text><text x="-3.1719" y="10.7969" font-size="15.4">5</text><text x="7.3281" y="7.5">1</text></g></g>}{$R_51$}};
\dcgi{3.4004}{-14.6163}{4.5013}{-15.4438}
\node[dcc] at (3.9539,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">2</text></g></g>}{$R_52$}};
\dcgi{7.3543}{-14.6163}{8.4552}{-15.4438}
\node[dcc] at (7.9078,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">3</text></g></g>}{$R_53$}};
\dcgi{11.3082}{-14.6163}{12.4091}{-15.4438}
\node[dcc] at (11.8618,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">4</text></g></g>}{$R_54$}};
\dcgi{15.2621}{-14.6163}{16.3631}{-15.4438}
\node[dcc] at (15.8157,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">5</text></g></g>}{$R_55$}};
\dcgi{19.2161}{-14.6163}{20.317}{-15.4438}
\node[dcc] at (19.7696,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">6</text></g></g>}{$R_56$}};
\dcgi{23.17}{-14.6163}{24.2709}{-15.4438}
\node[dcc] at (23.7235,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">7</text></g></g>}{$R_57$}};
\dcgi{27.1239}{-14.6163}{28.2248}{-15.4438}
\node[dcc] at (27.6775,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">8</text></g></g>}{$R_58$}};
\dcgi{31.0778}{-14.6163}{32.1788}{-15.4438}
\node[dcc] at (31.6314,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">5</text><text x="5.3281" y="7.5">9</text></g></g>}{$R_59$}};
\dcgi{35.0318}{-14.6163}{36.1327}{-15.4438}
\node[dcc] at (35.5853,-15.0249) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">0</text></g></g>}{$R_60$}};
\dcgi{-0.5008}{-17.7795}{0.507}{-18.6069}
\node[dcc] at (0,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17" y="7.5">R</text><text x="-3.1719" y="10.7969" font-size="15.4">6</text><text x="7.3281" y="7.5">1</text></g></g>}{$R_61$}};
\dcgi{3.4004}{-17.7795}{4.5013}{-18.6069}
\node[dcc] at (3.9539,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">2</text></g></g>}{$R_62$}};
\dcgi{7.3543}{-17.7795}{8.4552}{-18.6069}
\node[dcc] at (7.9078,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">3</text></g></g>}{$R_63$}};
\dcgi{11.3082}{-17.7795}{12.4091}{-18.6069}
\node[dcc] at (11.8618,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">4</text></g></g>}{$R_64$}};
\dcgi{15.2621}{-17.7795}{16.3631}{-18.6069}
\node[dcc] at (15.8157,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">5</text></g></g>}{$R_65$}};
\dcgi{19.2161}{-17.7795}{20.317}{-18.6069}
\node[dcc] at (19.7696,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">6</text></g></g>}{$R_66$}};
\dcgi{23.17}{-17.7795}{24.2709}{-18.6069}
\node[dcc] at (23.7235,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">7</text></g></g>}{$R_67$}};
\dcgi{27.1239}{-17.7795}{28.2248}{-18.6069}
\node[dcc] at (27.6775,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">8</text></g></g>}{$R_68$}};
\dcgi{31.0778}{-17.7795}{32.1788}{-18.6069}
\node[dcc] at (31.6314,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">6</text><text x="5.3281" y="7.5">9</text></g></g>}{$R_69$}};
\dcgi{35.0318}{-17.7795}{36.1327}{-18.6069}
\node[dcc] at (35.5853,-18.188) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">0</text></g></g>}{$R_70$}};
\dcgi{-0.5008}{-20.9426}{0.507}{-21.7701}
\node[dcc] at (0,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17" y="7.5">R</text><text x="-3.1719" y="10.7969" font-size="15.4">7</text><text x="7.3281" y="7.5">1</text></g></g>}{$R_71$}};
\dcgi{3.4004}{-20.9426}{4.5013}{-21.7701}
\node[dcc] at (3.9539,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">2</text></g></g>}{$R_72$}};
\dcgi{7.3543}{-20.9426}{8.4552}{-21.7701}
\node[dcc] at (7.9078,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">3</text></g></g>}{$R_73$}};
\dcgi{11.3082}{-20.9426}{12.4091}{-21.7701}
\node[dcc] at (11.8618,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">4</text></g></g>}{$R_74$}};
\dcgi{15.2621}{-20.9426}{16.3631}{-21.7701}
\node[dcc] at (15.8157,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">5</text></g></g>}{$R_75$}};
\dcgi{19.2161}{-20.9426}{20.317}{-21.7701}
\node[dcc] at (19.7696,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">6</text></g></g>}{$R_76$}};
\dcgi{23.17}{-20.9426}{24.2709}{-21.7701}
\node[dcc] at (23.7235,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">7</text></g></g>}{$R_77$}};
\dcgi{27.1239}{-20.9426}{28.2248}{-21.7701}
\node[dcc] at (27.6775,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">8</text></g></g>}{$R_78$}};
\dcgi{31.0778}{-20.9426}{32.1788}{-21.7701}
\node[dcc] at (31.6314,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">7</text><text x="5.3281" y="7.5">9</text></g></g>}{$R_79$}};
\dcgi{35.0318}{-20.9426}{36.1327}{-21.7701}
\node[dcc] at (35.5853,-21.3512) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">0</text></g></g>}{$R_80$}};
\dcgi{-0.5008}{-24.1057}{0.507}{-24.9332}
\node[dcc] at (0,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17" y="7.5">R</text><text x="-3.1719" y="10.7969" font-size="15.4">8</text><text x="7.3281" y="7.5">1</text></g></g>}{$R_81$}};
\dcgi{3.4004}{-24.1057}{4.5013}{-24.9332}
\node[dcc] at (3.9539,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">2</text></g></g>}{$R_82$}};
\dcgi{7.3543}{-24.1057}{8.4552}{-24.9332}
\node[dcc] at (7.9078,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">3</text></g></g>}{$R_83$}};
\dcgi{11.3082}{-24.1057}{12.4091}{-24.9332}
\node[dcc] at (11.8618,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">4</text></g></g>}{$R_84$}};
\dcgi{15.2621}{-24.1057}{16.3631}{-24.9332}
\node[dcc] at (15.8157,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">5</text></g></g>}{$R_85$}};
\dcgi{19.2161}{-24.1057}{20.317}{-24.9332}
\node[dcc] at (19.7696,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">6</text></g></g>}{$R_86$}};
\dcgi{23.17}{-24.1057}{24.2709}{-24.9332}
\node[dcc] at (23.7235,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">7</text></g></g>}{$R_87$}};
\dcgi{27.1239}{-24.1057}{28.2248}{-24.9332}
\node[dcc] at (27.6775,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">8</text></g></g>}{$R_88$}};
\dcgi{31.0778}{-24.1057}{32.1788}{-24.9332}
\node[dcc] at (31.6314,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">8</text><text x="5.3281" y="7.5">9</text></g></g>}{$R_89$}};
\dcgi{35.0318}{-24.1057}{36.1327}{-24.9332}
\node[dcc] at (35.5853,-24.5143) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">0</text></g></g>}{$R_90$}};
\dcgi{-0.5008}{-27.2689}{0.507}{-28.0963}
\node[dcc] at (0,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-17" y="7.5">R</text><text x="-3.1719" y="10.7969" font-size="15.4">9</text><text x="7.3281" y="7.5">1</text></g></g>}{$R_91$}};
\dcgi{3.4004}{-27.2689}{4.5013}{-28.0963}
\node[dcc] at (3.9539,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">2</text></g></g>}{$R_92$}};
\dcgi{7.3543}{-27.2689}{8.4552}{-28.0963}
\node[dcc] at (7.9078,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">3</text></g></g>}{$R_93$}};
\dcgi{11.3082}{-27.2689}{12.4091}{-28.0963}
\node[dcc] at (11.8618,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">4</text></g></g>}{$R_94$}};
\dcgi{15.2621}{-27.2689}{16.3631}{-28.0963}
\node[dcc] at (15.8157,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">5</text></g></g>}{$R_95$}};
\dcgi{19.2161}{-27.2689}{20.317}{-28.0963}
\node[dcc] at (19.7696,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">6</text></g></g>}{$R_96$}};
\dcgi{23.17}{-27.2689}{24.2709}{-28.0963}
\node[dcc] at (23.7235,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">7</text></g></g>}{$R_97$}};
\dcgi{27.1239}{-27.2689}{28.2248}{-28.0963}
\node[dcc] at (27.6775,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">8</text></g></g>}{$R_98$}};
\dcgi{31.0778}{-27.2689}{32.1788}{-28.0963}
\node[dcc] at (31.6314,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-19" y="7.5">R</text><text x="-5.1719" y="10.7969" font-size="15.4">9</text><text x="5.3281" y="7.5">9</text></g></g>}{$R_99$}};
\dcgi{34.8868}{-27.2689}{36.2764}{-28.0963}
\node[dcc] at (35.5853,-27.6775) {\dcCanvasText{<g transform="translate({?x},{?y}) scale(0.75)" fill="\string#2463CB" stroke="none"><g font-family='"Comic Relief", cursive' font-size="22" font-style="normal" font-weight="400"><text x="-24.5" y="7.5">R</text><text x="-10.6719" y="10.7969" font-size="15.4">1</text><text x="-2.6406" y="7.5">00</text></g></g>}{$R_100$}};
\end{circuitikz}

\end{document}
```