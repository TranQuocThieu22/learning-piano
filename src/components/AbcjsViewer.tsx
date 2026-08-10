'use client';
import { useEffect, useRef } from 'react';
import ABCJS from 'abcjs';
import 'abcjs/abcjs-audio.css';

export function AbcjsViewer({ abcNotation }: { abcNotation: string }) {
  const paperRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!paperRef.current || !audioRef.current) return;

    // Visual render
    const visualObj = ABCJS.renderAbc(paperRef.current, abcNotation, {
      responsive: 'resize',
      add_classes: true
    });

    // Audio render
    if (ABCJS.synth.supportsAudio()) {
      const synthControl = new ABCJS.synth.SynthController();
      
      const cursorControl = {
        onStart: () => {
          if (paperRef.current) {
            paperRef.current.querySelectorAll('.abcjs-highlight').forEach(e => e.classList.remove('abcjs-highlight'));
          }
        },
        onEvent: (ev: any) => {
          if (paperRef.current) {
            paperRef.current.querySelectorAll('.abcjs-highlight').forEach(e => e.classList.remove('abcjs-highlight'));
          }
          if (ev.elements) {
            ev.elements.forEach((el: any) => {
              if (el && el.classList) {
                el.classList.add('abcjs-highlight');
              } else if (Array.isArray(el)) {
                // Xử lý trường hợp có nhiều bè/khuông nhạc (multi-staves)
                el.forEach((subEl: any) => {
                  if (subEl && subEl.classList) {
                    subEl.classList.add('abcjs-highlight');
                  }
                });
              }
            });
          }
        },
        onFinished: () => {
          if (paperRef.current) {
            paperRef.current.querySelectorAll('.abcjs-highlight').forEach(e => e.classList.remove('abcjs-highlight'));
          }
        }
      };

      synthControl.load(audioRef.current, cursorControl, {
        displayLoop: true,
        displayRestart: true,
        displayPlay: true,
        displayProgress: true,
        displayWarp: true
      });

      const midiBuffer = new ABCJS.synth.CreateSynth();
      midiBuffer.init({
        visualObj: visualObj[0]
      }).then(() => {
        synthControl.setTune(visualObj[0], false);
      }).catch(err => {
        console.warn("Audio problem:", err);
      });
    }
  }, [abcNotation]);

  return (
    <div className="sheet-music-wrapper" style={{ margin: '2rem 0', background: 'var(--mantine-color-body)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--mantine-color-default-border)' }}>
      <div ref={paperRef} className="sheet-music-paper" style={{ background: '#fff', color: '#000', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}></div>
      <div ref={audioRef} className="sheet-music-audio" style={{ marginTop: '1rem' }}></div>
    </div>
  );
}
