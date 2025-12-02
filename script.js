// Page Navigation
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');
    const modal = document.getElementById('process-modal');
    const addProcessBtn = document.getElementById('add-process-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const submitProcessBtn = document.getElementById('submit-process');
    const runAlgorithmBtn = document.getElementById('run-algorithm-btn');
    const resetBtn = document.getElementById('reset-btn');
    const viewResumeBtn = document.getElementById('view-resume-btn');
    const resumeModal = document.getElementById('resume-modal');
    const closeResumeModalBtn = document.getElementById('close-resume-modal');
    const downloadResumeBtn = document.getElementById('download-resume-btn');

    let processes = [];
    let processCounter = 1;

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');

            // Update active nav link
            navLinks.forEach(nl => nl.classList.remove('active'));
            this.classList.add('active');

            // Show target page
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(targetPage).classList.add('active');

            // Removed: binding a general '.btn-secondary' handler here as it may match other buttons.
        });
    });

    // Handle "Hire Me" button on home page
    const heroHireBtn = document.getElementById('hero-hire-btn');
    if (heroHireBtn) {
        heroHireBtn.addEventListener('click', function() {
            navLinks.forEach(nl => nl.classList.remove('active'));
            document.querySelector('[data-page="contact"]').classList.add('active');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById('contact').classList.add('active');
        });
    }

    // NOTE: removed previous 'btn-blue' projects binding to prevent conflicts with the resume button.

    // Resume Modal Functions
    if (viewResumeBtn) {
        viewResumeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resumeModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }

    if (closeResumeModalBtn) {
        closeResumeModalBtn.addEventListener('click', function() {
            resumeModal.classList.remove('active');
            document.body.style.overflow = 'auto'; // Restore scrolling
        });
    }

    // Close resume modal when clicking outside
    if (resumeModal) {
        window.addEventListener('click', function(e) {
            if (e.target === resumeModal) {
                resumeModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Download Resume Function
    if (downloadResumeBtn) {
        downloadResumeBtn.addEventListener('click', function() {
            const resumeImage = document.getElementById('resume-image');
            const imageUrl = resumeImage.src;
            
            // Create a temporary anchor element to trigger download
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = 'John_Kevin_Javinez_Resume.jpg'; // Set the download filename
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

    // Modal functions
    addProcessBtn.addEventListener('click', function() {
        modal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', function() {
        modal.classList.remove('active');
        clearForm();
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            clearForm();
        }
    });

    function clearForm() {
        document.getElementById('process-name').value = '';
        document.getElementById('arrival-time').value = '';
        document.getElementById('burst-time').value = '';
    }

    // Add process
    submitProcessBtn.addEventListener('click', function() {
        let name = document.getElementById('process-name').value.trim();
        const arrival = parseInt(document.getElementById('arrival-time').value);
        const burst = parseInt(document.getElementById('burst-time').value);

        if (isNaN(arrival) || isNaN(burst) || burst < 1 || arrival < 0) {
            alert('Please fill in all fields with valid values.');
            return;
        }

        // Auto-generate process name if not provided
        if (!name) {
            name = `P${processCounter}`;
            processCounter++;
        }

        // Check if process name already exists
        if (processes.some(p => p.name === name)) {
            alert('Process name already exists. Please use a different name.');
            return;
        }

        processes.push({
            name: name,
            arrivalTime: arrival,
            burstTime: burst,
            remainingTime: burst
        });

        updateProcessesTable();
        modal.classList.remove('active');
        clearForm();
    });

    // Update processes table
    function updateProcessesTable() {
        const tbody = document.getElementById('processes-tbody');
        tbody.innerHTML = '';

        if (processes.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="4">No processes added. Click \'Add Process\' to get started.</td></tr>';
            return;
        }

        processes.forEach((process, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${process.name}</td>
                <td>${process.arrivalTime}</td>
                <td>${process.burstTime}</td>
                <td>
                    <button class="btn btn-secondary" onclick="removeProcess(${index})" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Remove process
    window.removeProcess = function(index) {
        processes.splice(index, 1);
        updateProcessesTable();
    };

    // Reset
    resetBtn.addEventListener('click', function() {
        processes = [];
        processCounter = 1;
        updateProcessesTable();
        document.getElementById('results-panel').classList.add('hidden');
        document.getElementById('gantt-chart').innerHTML = '';
        document.getElementById('avg-waiting-time').textContent = '-';
        document.getElementById('avg-turnaround-time').textContent = '-';
        const avgWaitingHero = document.getElementById('avg-waiting-time-hero');
        const avgTurnaroundHero = document.getElementById('avg-turnaround-time-hero');
        if (avgWaitingHero) avgWaitingHero.textContent = '-';
        if (avgTurnaroundHero) avgTurnaroundHero.textContent = '-';

        const summaryTbody = document.getElementById('process-summary-tbody');
        if (summaryTbody) summaryTbody.innerHTML = '<tr class="empty-row"><td colspan="6">No processes added.</td></tr>';
    });

    // Run SRTF Algorithm
    runAlgorithmBtn.addEventListener('click', function() {
        if (processes.length === 0) {
            alert('Please add at least one process before running the algorithm.');
            return;
        }

        const result = runSRTF([...processes]);
        displayResults(result);
    });

    // SRTF Algorithm Implementation
    function runSRTF(processList) {
        // Sort processes by arrival time
        processList.sort((a, b) => a.arrivalTime - b.arrivalTime);
        
        // Create a copy with remaining time tracking
        const processes = processList.map(p => ({
            name: p.name,
            arrivalTime: p.arrivalTime,
            burstTime: p.burstTime,
            remainingTime: p.burstTime,
            startTime: null,
            completionTime: null,
            waitingTime: 0,
            turnaroundTime: 0
        }));

        const ganttChart = [];
        const readyQueue = [];
        let currentTime = 0;
        let currentProcess = null;
        let completed = 0;
        const n = processes.length;

        while (completed < n) {
            // Add processes that have arrived to ready queue
            processes.forEach(p => {
                if (p.arrivalTime === currentTime && p.remainingTime > 0) {
                    readyQueue.push(p);
                }
            });

            // Sort ready queue by remaining time (SRTF)
            readyQueue.sort((a, b) => {
                if (a.remainingTime !== b.remainingTime) {
                    return a.remainingTime - b.remainingTime;
                }
                // If remaining times are equal, prefer the one that arrived first
                return a.arrivalTime - b.arrivalTime;
            });

            // Select process with shortest remaining time
            let selectedProcess = readyQueue.length > 0 ? readyQueue[0] : null;

            // Check if we need to preempt current process
            if (currentProcess && selectedProcess && 
                selectedProcess.remainingTime < currentProcess.remainingTime) {
                // Preempt current process
                if (currentProcess.remainingTime > 0) {
                    readyQueue.push(currentProcess);
                    readyQueue.sort((a, b) => {
                        if (a.remainingTime !== b.remainingTime) {
                            return a.remainingTime - b.remainingTime;
                        }
                        return a.arrivalTime - b.arrivalTime;
                    });
                }
                currentProcess = selectedProcess;
                readyQueue.shift();
            } else if (!currentProcess && selectedProcess) {
                // No current process, start the selected one
                currentProcess = selectedProcess;
                readyQueue.shift();
            }

            // Execute current process
            if (currentProcess) {
                if (currentProcess.startTime === null) {
                    currentProcess.startTime = currentTime;
                }

                // Add to Gantt chart
                if (ganttChart.length === 0 || ganttChart[ganttChart.length - 1].process !== currentProcess.name) {
                    ganttChart.push({
                        process: currentProcess.name,
                        start: currentTime,
                        end: currentTime + 1
                    });
                } else {
                    ganttChart[ganttChart.length - 1].end = currentTime + 1;
                }

                currentProcess.remainingTime--;

                if (currentProcess.remainingTime === 0) {
                    currentProcess.completionTime = currentTime + 1;
                    currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                    currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                    completed++;
                    currentProcess = null;
                }
            }

            currentTime++;
        }

        // Calculate averages
        const totalWaitingTime = processes.reduce((sum, p) => sum + p.waitingTime, 0);
        const totalTurnaroundTime = processes.reduce((sum, p) => sum + p.turnaroundTime, 0);
        const avgWaitingTime = (totalWaitingTime / n).toFixed(2);
        const avgTurnaroundTime = (totalTurnaroundTime / n).toFixed(2);

        return {
            ganttChart: ganttChart,
            processes: processes,
            avgWaitingTime: avgWaitingTime,
            avgTurnaroundTime: avgTurnaroundTime
        };
    }

    // Display Results
    function displayResults(result) {
        const resultsPanel = document.getElementById('results-panel');
        const ganttChartDiv = document.getElementById('gantt-chart');
        
        resultsPanel.classList.remove('hidden');

        // Display Gantt Chart (render with absolute positions so start times map to left offset)
        ganttChartDiv.innerHTML = '';

        // Where each unit of time equals this number of pixels
        const unitWidth = 40;

        // find min start and max end (handle empty gantt chart)
        if (!result.ganttChart || result.ganttChart.length === 0) {
            // no bars, clear and return
            ganttChartDiv.innerHTML = '<div class="gantt-track"></div>';
            return;
        }
        const minStart = Math.min(...result.ganttChart.map(i => i.start));
        const maxEnd = Math.max(...result.ganttChart.map(i => i.end));
        const totalUnits = maxEnd - minStart;
        const trackWidth = Math.max(totalUnits * unitWidth, 200);

        // Create track container (relative) that holds absolute-positioned bars
        const track = document.createElement('div');
        track.className = 'gantt-track';
        track.style.width = `${trackWidth}px`;
        ganttChartDiv.appendChild(track);

        const colorMap = {};
        const palette = [
            'var(--primary-green)',
            'var(--secondary-blue)',
            '#a67fc4',
            '#7c6ccf',
            '#8367b6',
            '#00b388',
            '#ffb86b',
            '#ff7b72'
        ];

        function getColorForProcess(name) {
            if (colorMap[name]) return colorMap[name];
            const key = Object.keys(colorMap).length % palette.length;
            colorMap[name] = palette[key];
            return colorMap[name];
        }

        // Create bars
        result.ganttChart.forEach(item => {
            const duration = item.end - item.start;
            const bar = document.createElement('div');
            bar.className = 'gantt-bar gantt-item';
            const sanitizedName = item.process.replace(/[^a-zA-Z0-9\-_]/g, '');
            bar.classList.add(`process-${sanitizedName}`);
            const left = (item.start - minStart) * unitWidth;
            const width = Math.max(duration * unitWidth, 40);
            bar.style.left = `${left}px`;
            bar.style.width = `${width}px`;
            // set background color using palette, use fallback if var style
            let bg = getColorForProcess(sanitizedName);
            if (bg && bg.startsWith('var(')) {
                // resolve css variable to a computed color
                const varName = bg.slice(4, -1).trim();
                const computedColor = getComputedStyle(document.documentElement).getPropertyValue(varName);
                if (computedColor) bg = computedColor.trim();
            }
            if (bg) {
                bar.style.backgroundColor = bg;
            }
            bar.textContent = `${item.process} (${item.start}-${item.end})`;
            track.appendChild(bar);
        });

        // Add timeline axis
        const axis = document.createElement('div');
        axis.className = 'gantt-time-axis';
        for (let t = minStart; t <= maxEnd; t++) {
            const tick = document.createElement('div');
            tick.className = 'time-tick';
            tick.style.minWidth = `${unitWidth}px`;
            tick.textContent = `${t}`;
            axis.appendChild(tick);
        }
        ganttChartDiv.appendChild(axis);

        // Display metrics (update both existing and new UI elements)
        const avgWaiting = result.avgWaitingTime;
        const avgTurnaround = result.avgTurnaroundTime;
        const avgWaitingEl = document.getElementById('avg-waiting-time');
        const avgTurnaroundEl = document.getElementById('avg-turnaround-time');
        const avgWaitingHero = document.getElementById('avg-waiting-time-hero');
        const avgTurnaroundHero = document.getElementById('avg-turnaround-time-hero');

        if (avgWaitingEl) avgWaitingEl.textContent = avgWaiting;
        if (avgTurnaroundEl) avgTurnaroundEl.textContent = avgTurnaround;
        if (avgWaitingHero) avgWaitingHero.textContent = avgWaiting;
        if (avgTurnaroundHero) avgTurnaroundHero.textContent = avgTurnaround;

        // Populate Process summary table
        const summaryTbody = document.getElementById('process-summary-tbody');
        if (summaryTbody) {
            summaryTbody.innerHTML = '';
            // Sort processes by name (P1,P2,...) for consistent ordering in the table
            const sortedProcesses = result.processes.slice().sort((a, b) => {
                const aNum = parseInt(a.name.replace(/[^0-9]/g, '')) || 0;
                const bNum = parseInt(b.name.replace(/[^0-9]/g, '')) || 0;
                return aNum - bNum;
            });

            sortedProcesses.forEach(p => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${p.name}</td>
                    <td>${p.arrivalTime}</td>
                    <td>${p.burstTime}</td>
                    <td>${p.completionTime}</td>
                    <td>${p.turnaroundTime}</td>
                    <td>${p.waitingTime}</td>
                `;
                summaryTbody.appendChild(row);
            });
        }

        // Scroll to results
        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

