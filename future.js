/**
 * After Regular Classes Attendance Calculator - Logic Module
 * Modularized, robust validation, and separated DOM handling.
 */
(() => {
    // DOM Cache
    const elements = {
        form: document.getElementById('calcForm'),
        btnCalculate: document.getElementById('btnCalculate'),
        totalClasses: document.getElementById('totalClasses'),
        attendedClasses: document.getElementById('attendedClasses'),
        defaultPerDay: document.getElementById('defaultPerDay'),
        btnAddCustomDay: document.getElementById('btnAddCustomDay'),
        customDaysList: document.getElementById('customDaysList'),
        startDay: document.getElementById('startDay'),
        studyDays: document.getElementById('studyDays'),
        // Results
        currentOutput: document.getElementById('current'),
        futureOutput: document.getElementById('future'),
        totalFutureOutput: document.getElementById('totalFuture'),
        // Navigation
        btnNavBack: document.getElementById('btnNavBack'),
        // Errors
        errGlobal: document.getElementById('err-global')
    };

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        elements.btnAddCustomDay.addEventListener('click', addCustomDayRow);
        elements.form.addEventListener("submit", handleCalculateFuture);
        elements.btnNavBack.addEventListener("click", () => {
            window.location.href = "index.html";
        });
        
        const inputs = elements.form.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => clearError(input));
        });
    }

    let customRowCounter = 0;
    function addCustomDayRow() {
        const rowId = customRowCounter++;
        const row = document.createElement('div');
        row.className = 'custom-day-row';
        row.innerHTML = `
            <div class="input-group">
                <label>Select Day</label>
                <select class="custom-day-select">
                    <option value="0">Monday</option>
                    <option value="1">Tuesday</option>
                    <option value="2">Wednesday</option>
                    <option value="3">Thursday</option>
                    <option value="4">Friday</option>
                    <option value="5">Saturday</option>
                    <option value="6">Sunday</option>
                </select>
            </div>
            <div class="input-group">
                <label>Classes</label>
                <input type="number" class="custom-day-classes" placeholder="e.g., 5" min="0" max="20" step="1">
                <span class="error"></span>
            </div>
            <button type="button" class="btn-remove">X</button>
        `;
        
        const removeBtn = row.querySelector('.btn-remove');
        removeBtn.addEventListener('click', () => row.remove());

        const input = row.querySelector('.custom-day-classes');
        const errSpan = row.querySelector('.error');
        input.addEventListener('input', () => {
            input.classList.remove('input-error');
            errSpan.textContent = "";
            errSpan.classList.remove('visible');
        });

        elements.customDaysList.appendChild(row);
    }

    function showError(inputElement, message) {
        inputElement.classList.add('input-error');
        const errSpan = document.getElementById(`err-${inputElement.id}`);
        if(errSpan) {
            errSpan.textContent = message;
            errSpan.classList.add('visible');
        } else {
            elements.errGlobal.textContent = message;
            elements.errGlobal.classList.add('visible');
        }
    }

    function clearError(inputElement) {
        inputElement.classList.remove('input-error');
        const errSpan = document.getElementById(`err-${inputElement.id}`);
        if(errSpan) {
            errSpan.textContent = "";
            errSpan.classList.remove('visible');
        }
        elements.errGlobal.textContent = "";
        elements.errGlobal.classList.remove('visible');
    }

    function clearAllErrors() {
        const inputs = elements.form.querySelectorAll('input, select');
        inputs.forEach(clearError);
        elements.errGlobal.textContent = "";
        elements.errGlobal.classList.remove('visible');
    }

    function handleCalculateFuture(e) {
        e.preventDefault();
        clearAllErrors();
        
        const total = parseFloat(elements.totalClasses.value);
        const attended = parseFloat(elements.attendedClasses.value);
        const defaultPerDay = parseFloat(elements.defaultPerDay.value);
        const studyDays = parseInt(elements.studyDays.value, 10);
        
        let startDay = parseInt(elements.startDay.value, 10);

        let hasError = false;

        const customMap = {};
        const customRows = elements.customDaysList.querySelectorAll('.custom-day-row');
        customRows.forEach(row => {
            const day = parseInt(row.querySelector('.custom-day-select').value, 10);
            const clsInput = row.querySelector('.custom-day-classes');
            const classes = parseFloat(clsInput.value);
            const errSpan = row.querySelector('.error');
            
            if(isNaN(classes) || classes < 0 || !Number.isInteger(classes)) {
                clsInput.classList.add('input-error');
                errSpan.textContent = "Valid integer required.";
                errSpan.classList.add('visible');
                hasError = true;
            } else {
                customMap[day] = classes;
            }
        });

        // Validation
        if (isNaN(total) || total <= 0 || !Number.isInteger(total)) {
            showError(elements.totalClasses, "Must be a positive integer.");
            hasError = true;
        }
        if (isNaN(attended) || attended < 0 || !Number.isInteger(attended)) {
            showError(elements.attendedClasses, "Must be a non-negative integer.");
            hasError = true;
        }
        if (!hasError && attended > total) {
            showError(elements.attendedClasses, "Attended cannot exceed total.");
            hasError = true;
        }
        if (isNaN(defaultPerDay) || defaultPerDay < 0 || !Number.isInteger(defaultPerDay)) {
            showError(elements.defaultPerDay, "Must be a non-negative integer.");
            hasError = true;
        }
        if (isNaN(studyDays) || studyDays <= 0 || !Number.isInteger(studyDays)) {
            showError(elements.studyDays, "Must be a positive integer.");
            hasError = true;
        }
        if (hasError) return;

        setLoadingState(true);

        setTimeout(() => {
            try {
                let addedClasses = 0;
                let countedDays = 0;
                let currentDay = startDay;

                // Safety limit against infinite loops from bad variables
                const loopLimit = 10000;
                let iterations = 0;

                while (countedDays < studyDays && iterations < loopLimit) {
                    iterations++;
                    if (currentDay === 6) { // Sunday
                        currentDay = (currentDay + 1) % 7;
                        continue;
                    }

                    let classesToday = defaultPerDay;
                    if (customMap[currentDay] !== undefined) {
                        classesToday = customMap[currentDay];
                    }

                    addedClasses += classesToday;
                    countedDays++;
                    currentDay = (currentDay + 1) % 7;
                }

                if (iterations >= loopLimit) {
                    throw new Error("Calculation limit exceeded");
                }

                const futureTotal = total + addedClasses;
                const futureAttended = attended + addedClasses;

                const currentAttendance = (total === 0) ? 0 : (attended / total) * 100;
                const futureAttendance = (futureTotal === 0) ? 0 : (futureAttended / futureTotal) * 100;

                elements.currentOutput.innerText = (isNaN(currentAttendance) ? "0.00" : currentAttendance.toFixed(2)) + "%";
                elements.futureOutput.innerText = (isNaN(futureAttendance) ? "0.00" : futureAttendance.toFixed(2)) + "%";
                elements.totalFutureOutput.innerText = futureTotal;

                if (futureAttendance < 75) {
                    elements.futureOutput.style.color = "#ef4444"; // red
                } else {
                    elements.futureOutput.style.color = "#4facfe"; // blue
                }
            } catch (err) {
                console.error(err);
                elements.errGlobal.textContent = "Error calculating attendance.";
                elements.errGlobal.classList.add('visible');
            } finally {
                setLoadingState(false);
            }
        }, 300);
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            elements.btnCalculate.disabled = true;
            elements.btnCalculate.textContent = "Processing...";
        } else {
            elements.btnCalculate.disabled = false;
            elements.btnCalculate.textContent = "Calculate";
        }
    }
})();