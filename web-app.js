document.addEventListener('DOMContentLoaded', () => {
    const contentDiv = document.getElementById('content');
    const links = document.querySelectorAll('.nav-link');
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const mobileToggle = document.getElementById('mobile-toggle');

    // Mobile menu toggle
    function toggleMenu() {
        sidebar.classList.toggle('open');
    }
    menuBtn.addEventListener('click', toggleMenu);
    mobileToggle.addEventListener('click', toggleMenu);

    // Custom renderer for marked to intercept `abc` code blocks
    const renderer = new marked.Renderer();
    let abcBlocksCounter = 0;
    const abcDataMap = {}; // Store abc string to render later

    renderer.code = function(code, language) {
        if (language === 'abc') {
            const id = `abc-block-${abcBlocksCounter++}`;
            abcDataMap[id] = code;
            
            // Return a placeholder div where we will render the sheet music
            return `
                <div class="sheet-music-wrapper">
                    <div id="paper-${id}" class="sheet-music-paper"></div>
                    <div id="audio-${id}" class="sheet-music-audio"></div>
                </div>
            `;
        }
        // Default code block rendering
        return `<pre><code>${code}</code></pre>`;
    };

    marked.setOptions({ renderer });

    // Function to load and render markdown
    async function loadPage(file) {
        contentDiv.innerHTML = '<div class="loader">Đang tải...</div>';
        try {
            // In a real server environment, fetch works. 
            // Since we might run this locally via double click (file://), fetch might fail due to CORS.
            // But Github Pages uses http://, so it works perfectly.
            const response = await fetch(file);
            if (!response.ok) throw new Error('Network response was not ok');
            const markdownText = await response.text();
            
            // Reset counter for new page
            abcBlocksCounter = 0;
            // Clear old data
            for (let member in abcDataMap) delete abcDataMap[member];
            
            // Render markdown to HTML
            contentDiv.innerHTML = marked.parse(markdownText);

            // Now, render all abc blocks that were discovered
            renderAbcBlocks();
            
            // Scroll to top
            window.scrollTo(0, 0);

        } catch (error) {
            contentDiv.innerHTML = `
                <h2>Oops!</h2>
                <p>Không thể tải bài học: ${file}</p>
                <p style="color:var(--text-muted); font-size:0.9em;">Lưu ý: Nếu bạn đang mở file trực tiếp từ máy tính, trình duyệt có thể chặn tải file. Hãy dùng VSCode Live Server hoặc tải lên Github Pages.</p>
            `;
            console.error(error);
        }
    }

    function renderAbcBlocks() {
        for (const [id, abcString] of Object.entries(abcDataMap)) {
            // Visual render
            const visualObj = ABCJS.renderAbc(`paper-${id}`, abcString, {
                responsive: 'resize',
                add_classes: true
            });

            // Audio render
            if (ABCJS.synth.supportsAudio()) {
                const synthControl = new ABCJS.synth.SynthController();
                synthControl.load(`#audio-${id}`, null, {
                    displayLoop: true,
                    displayRestart: true,
                    displayPlay: true,
                    displayProgress: true,
                    displayWarp: true
                });

                const midiBuffer = new ABCJS.synth.CreateSynth();
                midiBuffer.init({
                    visualObj: visualObj[0]
                }).then(function () {
                    synthControl.setTune(visualObj[0], false);
                }).catch(function (error) {
                    console.warn("Audio problem:", error);
                });
            } else {
                document.getElementById(`audio-${id}`).innerHTML = "Trình duyệt không hỗ trợ phát nhạc.";
            }
        }
    }

    // Navigation logic
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Load content
            const file = link.getAttribute('data-file');
            loadPage(file);
            
            // Update URL hash
            window.location.hash = link.getAttribute('href');
            
            // Close mobile menu if open
            sidebar.classList.remove('open');
        });
    });

    // Handle initial load based on URL hash or default to roadmap
    const initialHash = window.location.hash;
    if (initialHash) {
        const link = document.querySelector(`.nav-link[href="${initialHash}"]`);
        if (link) {
            link.click();
        } else {
            loadPage('01-roadmap/roadmap.md');
        }
    } else {
        loadPage('01-roadmap/roadmap.md');
    }
});
