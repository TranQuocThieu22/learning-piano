document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('abc-source');
    
    // Default example
    const defaultABC = `X: 1
T: Bài tập luyện ngón 1
C: Tác giả: Gia sư Piano
M: 4/4
L: 1/4
Q: 1/4=90
K: C
"C"C D E F | "G"G F E D | "C"C4 |]`;

    editor.value = defaultABC;

    function renderABC() {
        const abcString = editor.value;
        if (!abcString.trim()) return;

        // Visual rendering
        var visualObj = ABCJS.renderAbc("paper", abcString, {
            responsive: 'resize',
            add_classes: true
        });

        // Audio rendering (MIDI)
        if (ABCJS.synth.supportsAudio()) {
            var synthControl = new ABCJS.synth.SynthController();
            synthControl.load("#audio", null, {
                displayLoop: true,
                displayRestart: true,
                displayPlay: true,
                displayProgress: true,
                displayWarp: true
            });

            var midiBuffer = new ABCJS.synth.CreateSynth();
            midiBuffer.init({
                visualObj: visualObj[0],
                // We can setup audio fonts here if needed, defaults are usually fine for basic usage
            }).then(function () {
                synthControl.setTune(visualObj[0], false).then(function () {
                    // Audio ready
                });
            }).catch(function (error) {
                console.warn("Audio problem:", error);
            });
        } else {
            document.querySelector("#audio").innerHTML = "Trình duyệt của bạn không hỗ trợ phát âm thanh MIDI.";
        }
    }

    // Initial render
    renderABC();

    // Render on input with debounce
    let timeoutId;
    editor.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(renderABC, 300);
    });
});
