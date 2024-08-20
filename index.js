/**
 * 
 * Global constants and variables
 * 
 */

const COMMAND_SET_ROW_PREFIX = 'csrow_';

/**
 * 
 * Get all same-prefixed localStorage keys and returns it as Array.
 * The prefix is removed from keyname.
 * If no keys found, empty Array returned.
 * @param {string} keyname_prefix Will be searched with .startsWith() 
 * @returns {Array<String>}
 */
function localStorageGetKeysAll(keyname_prefix) {
    let all_keys_same_prefixed = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(keyname_prefix))
            all_keys_same_prefixed.push(key.substring(keyname_prefix.length));
    }
    return all_keys_same_prefixed;
}




/**
 * 
 * Initialization on page load 
 * 
 */
function onThisPageLoad() {
    let items = Array.from(localStorageGetKeysAll(COMMAND_SET_ROW_PREFIX));
    autocomplete(document.getElementById("selectedControllerName"), items);
    
    loadPageSettings();
    toggleEditMode(false);
    fillHex();

    // Adjust the height of the textarea based on its content
    const commands_textareas = document.querySelectorAll('#commandSetTable textarea');
    commands_textareas.forEach(cmd_txtA => {
        cmd_txtA.addEventListener('input', function () {
             this.style.height = 'auto'; // Reset height to auto before calculating the new height
             this.style.height = this.scrollHeight + 'px'; // Set the height to match the content
         });
    });

    const tdPort = document.getElementById('portConnectionStatus').closest('td');
    tdPort.style.maxWidth = window.getComputedStyle(tdPort).width;


}

function resizableTableInit() {
    const resizable_ths = document.querySelectorAll('.columnWidthResizable');
    resizable_ths.forEach(resizable_th => {
        let column_number = Array.from(resizable_th.parentNode.children).indexOf(resizable_th);
        resizable_cells_init(resizable_th.closest('table').querySelectorAll(`tr th:nth-child(${column_number + 1}), tr td:nth-child(${column_number + 1})`));
    });

}

function resizable_cells_init(resizable_cells) {
    resizable_cells.forEach(resizable_td => {
        if (resizable_td.querySelector('.resizer') == null) {
            let startX;
            let startWidth;

            const resizer_div = document.createElement('div');
            resizer_div.classList.add('resizer');
            resizable_td.appendChild(resizer_div);

            resizable_td.addEventListener('mousedown', function (e) {
                startX = e.pageX;
                startWidth = parseFloat(window.getComputedStyle(resizable_td).width);
                document.addEventListener('mousemove', resizeColumn);
                document.addEventListener('mouseup', stopResize);
            });

            /**
             * TODO
             * ajust td width for all cells in column (not only clicked)
             * @param {any} e
             */
            function resizeColumn(e) {
                try {
                    const newWidth = startWidth + (e.pageX - startX);
                    resizable_td.style.width = newWidth + 'px';
                } catch (Error) {
                    console.error("Error during column resize:", error);
                    stopResize(); // Fallback to stop resizing if error occurs
                }
            }

            function stopResize() {
                document.removeEventListener('mousemove', resizeColumn);
                document.removeEventListener('mouseup', stopResize);
            }
        }
    });

}




/**
 * Save page state: active tab, etc (except command set table)
 * @param {any} event
 */
function tabSwitched(evt) {
    savePageSettings(evt);
}
function savePageSettings(evt) {
    // if (evt.target.name == 'tabRadio') {
    const resizable_ths = document.querySelectorAll('#commandSetTable .columnWidthResizable');
    let widths = {};
    resizable_ths.forEach(resizable_th => {
        let column_number = Array.from(resizable_th.parentNode.children).indexOf(resizable_th);
        widths[column_number] = parseFloat(window.getComputedStyle(resizable_th).width);
    });

    const page_settings = {
        selectedTabId: document.querySelector('.tab-container input[name="tabRadio"]:checked').id,
        commandSetTableColWidth: widths
    }
    localStorage.setItem('pageSettings', JSON.stringify(page_settings));
}

function loadPageSettings() {
    const saved_settings = localStorage.getItem('pageSettings');
    if (saved_settings) {
        const saved_settings_parsed = JSON.parse(saved_settings);
        // Apply saved settings
        document.getElementById(saved_settings_parsed.selectedTabId).checked = true;
        const resizable_ths = document.querySelectorAll('#commandSetTable .columnWidthResizable');
        resizable_ths.forEach(resizable_th => {
            let column_number = Array.from(resizable_th.parentNode.children).indexOf(resizable_th);
            if (saved_settings_parsed.hasOwnProperty('commandSetTableColWidth'))
                if (saved_settings_parsed.commandSetTableColWidth.hasOwnProperty(`${column_number}`)) {
                    resizable_th.style.width = saved_settings_parsed.commandSetTableColWidth[column_number] + 'px';
                }
            
        });
        
        /*settingsDiv.style.display = saved_settings_parsed.divVisibility || 'block';
        nameInput.value = saved_settings_parsed.name || '';
        emailInput.value = saved_settings_parsed.email || '';*/
    }
}

/**
 * 
 * Command byte(s) processing functions
 * 
 */

function fillHex() {
    const mcu_cmd_str_all_divs = document.querySelectorAll('table tr td div.mcu-cmd');
    mcu_cmd_str_all_divs.forEach(mcu_cmd_div => {
        const mcu_cmd_str = mcu_cmd_div.textContent;
        let bits2hex = '0x' + parseInt(mcu_cmd_div.textContent, 2).toString(16).padStart(2, '0').toUpperCase();

        // Find the index of the element among its siblings
        const children = Array.prototype.slice.call(mcu_cmd_div.parentNode.children);
        const div_index = children.indexOf(mcu_cmd_div);
        if (div_index == 0) {
            mcu_cmd_div.closest('td').nextElementSibling.innerHTML = '<div>' + bits2hex + '</div>';  // first byte
            mcu_cmd_div.closest('tr').querySelector('td form input[type="radio"][name="commandLength"][value="1"]').checked = true;
        } else {
            mcu_cmd_div.closest('td').nextElementSibling.innerHTML += '<div>' + bits2hex + '</div>'; // second byte
            mcu_cmd_div.closest('tr').querySelector('td form input[type="radio"][name="commandLength"][value="2"]').checked = true;
        }
    });
}


function commandLengthChanged(evt) {
    if (evt.target.name == "commandLength") {
        let cmd_td = evt.target.closest('tr').cells[1];
        if (evt.target.value == '1') {
            if (cmd_td.children[1]) cmd_td.removeChild(cmd_td.children[1]);
        } else {
            if (cmd_td.children.length == 1) {
                const node_clone = cmd_td.querySelector('div').cloneNode(true);
                cmd_td.appendChild(node_clone);
            }
        }
        fillHex();

    }
}


function changeBit(evt) {
    const clickedSpan = evt.target;
    if (clickedSpan.tagName.toLowerCase() === 'b') {
        let span_text_content = clickedSpan.textContent;
        // let is_edit_mode = clickedSpan.closest('tr').querySelector('td').contentEditable == "true";
        let is_edit_mode = document.getElementById('tableEditEnabled').style.display != 'none';
        let is_variable_part = clickedSpan.dataset.fov == 'v'; // clickedSpan.classList.contains('cmd-variable-part');
        if ( is_edit_mode && evt.ctrlKey ) {
            if (is_variable_part)
                clickedSpan.dataset.fov = 'f' // clickedSpan.classList.replace('cmd-variable-part', 'cmd-fixed-part')
            else
                clickedSpan.dataset.fov = 'v' //clickedSpan.classList.replace('cmd-fixed-part', 'cmd-variable-part');
            return;
        }

        if ( is_variable_part || is_edit_mode ) {
            clickedSpan.innerHTML = span_text_content == '0' ? '1' : '0';
            let decimalNumber = parseInt(clickedSpan.closest('.mcu-cmd').textContent, 2);
            const children = Array.prototype.slice.call(clickedSpan.closest('td').children);
            const div_index = children.indexOf(clickedSpan.parentNode);
            fillHex();
        }
    }
}



/**
 * 
 * Editable table
 * 
 * 
*/        
function makeColumnEditable(tableId, columnIndex, enableEdit) {
    var table = document.getElementById(tableId);
    var rows = table.getElementsByTagName('tr');
    for (var i = 0; i < rows.length; i++) {
        var cells = rows[i].getElementsByTagName('td'); // So, <th> will be ignored
        if (cells.length > columnIndex) {
            const ta_em = cells[columnIndex].querySelector('textarea');
            if (enableEdit) {
                cells[columnIndex].classList.add('editModeBgColorized');
                if (ta_em) {
                    ta_em.disabled = false;
                    ta_em.removeAttribute('readonly');
                }
            } else {
                cells[columnIndex].classList.remove('editModeBgColorized');
                if (ta_em) {
                    cells[columnIndex].querySelector('textarea').disabled = true;
                    cells[columnIndex].querySelector('textarea').setAttribute('readonly', true);
                }
            }
        }
    }
}

function toggleEditMode(enable_edit_mode) {
    if ( arguments.length === 0 )
        enable_edit_mode = document.getElementById('tableEditEnabled').style.display == 'none';
    makeColumnEditable('commandSetTable', 0, enable_edit_mode);
    makeColumnEditable('commandSetTable', 1, enable_edit_mode);
    makeColumnEditable('commandSetTable', 3, enable_edit_mode);
    Array.from(document.styleSheets).forEach(sheet => {
        for (let i = 0; i < sheet.cssRules.length; i++) {
            const rule = sheet.cssRules[i];
            if (rule.selectorText === '#commandSetTable th:last-child, #commandSetTable td:last-child') {
                if (enable_edit_mode)
                    rule.style.removeProperty('display');
                else
                    rule.style.display = 'none';
            } else if (rule.selectorText === 'div.resizer') {
                rule.style.display = (enable_edit_mode) ? '' : 'none';
            }
        }
    });
    if (enable_edit_mode) {
        document.getElementById('tableEditDisabled').closest('td').classList.add('editModeBgColorized');
        document.getElementById('tableEditDisabled').style.display = 'none'; //'inline'
        document.getElementById('tableEditEnabled').style.display = 'inline';
        document.querySelectorAll('#saveUndoButtons button').forEach(one_button => { one_button.disabled = false });
    } else {
        document.getElementById('tableEditDisabled').closest('td').classList.remove('editModeBgColorized');
        document.getElementById('tableEditDisabled').style.display = 'inline'; // 'inline'
        document.getElementById('tableEditEnabled').style.display = 'none';
        document.querySelectorAll('#saveUndoButtons button').forEach(one_button => { one_button.disabled = true });
        savePageSettings();
    }
}


function saveCommandSetTable() {
    const controller_name = document.getElementById('selectedControllerName').value;
    const command_set_rows = document.querySelectorAll('#commandSetTable tbody tr');
    let rows_arr = [];
    command_set_rows.forEach(command_set_row => {
        let cmd_bytes_arr = [];
        command_set_row.cells[1].querySelectorAll('.mcu-cmd').forEach(cmd_byte => {
            const data_mapped = Array.from(cmd_byte.querySelectorAll('b')).map(b_sibling => b_sibling.dataset.fov);
            const cmd_bits = cmd_byte.textContent;
            const fov_plus_bits = Array.from(data_mapped).reduce((acc_b, curr_b, idx_b) => {
                acc_b.push(curr_b + cmd_bits[idx_b]);
                return acc_b;
            }, []);
            cmd_bytes_arr.push(fov_plus_bits);
        }); 
        rows_arr.push([
            command_set_row.cells[0].querySelector('textarea').value,
            cmd_bytes_arr,
            command_set_row.cells[3].querySelector('textarea').value,
        ]);
    });

    const command_set_table = {
        controllerName: controller_name,
        rows: rows_arr
    };
    localStorage.setItem(COMMAND_SET_ROW_PREFIX + controller_name, JSON.stringify(rows_arr));
} 

/**
 * Return to last saved table
 */
function undoCommandSetTableEdit() {
    const controller_name = document.getElementById('selectedControllerName').value;
    const command_set_table_json = localStorage.getItem(COMMAND_SET_ROW_PREFIX + controller_name);
    console.log(command_set_table_json);
    if (command_set_table_json) {
        const command_set_table_parsed = JSON.parse(command_set_table_json);
        let table_tbody = document.querySelector('#commandSetTable tbody');
        table_tbody.innerHTML = '';
        let row_template = document.getElementById('empty-row-template').content;
        command_set_table_parsed.forEach(current_row_saved => {
            const row_clone = document.importNode(row_template, true);
            row_clone.querySelector('tr td:nth-of-type(1) textarea').value = current_row_saved[0];
            table_tbody.appendChild(row_clone);
            let row_just_added = table_tbody.querySelector('tr:last-of-type');
            current_row_saved[1].forEach((cmd_byte, cmd_byte_idx) => {
                row_just_added.querySelector(`tr td form input[type="radio"][name="commandLength"][value="${cmd_byte_idx + 1}"]`).click();
                row_just_added.querySelectorAll(`tr td:nth-of-type(2) .mcu-cmd:nth-child(${cmd_byte_idx + 1}) b`).forEach((bit_span, bit_span_idx) => {
                    bit_span.dataset.fov = cmd_byte[bit_span_idx][0];
                    bit_span.innerHTML = cmd_byte[bit_span_idx][1];
                });
            });
            row_just_added.querySelector('tr td:nth-of-type(4) textarea').value = current_row_saved[2];
            
        });
        let is_edit_mode = document.getElementById('tableEditEnabled').style.display != 'none';
        if (is_edit_mode) {
            resizableTableInit();
            toggleEditMode(true);
        }
        fillHex();
        
    }
}


function delRow(evt) {
    const current_tbody = evt.target.closest('tbody');
    const current_row = evt.target.closest('tr');
    if (current_tbody.children.length > 1) {
        current_tbody.removeChild(current_row);
    } else {
        current_row.querySelectorAll('td textarea').forEach(text_area => { text_area.value = ''; });
        current_row.querySelectorAll('td .mcu-cmd b').forEach( bit_span => { bit_span.innerHTML = '0';});
    }
        
}

function dupRow(evt) {
    const current_tbody = evt.target.closest('tbody');
    const current_row = evt.target.closest('tr');
    current_tbody.insertBefore(current_row.cloneNode(true), current_row);
}








/**
 * 
 * Web Serial API
 * 
 * 
*/

let web_serial_port;
let web_serial_writer;

async function connectSerial() {
    try {
        // Request a port and open a connection
        web_serial_port = await navigator.serial.requestPort();
        await web_serial_port.open({ baudRate: 9600 });

        const port_info_entries = Object.entries(web_serial_port.getInfo());
        document.getElementById('portConnectionStatus').innerHTML = 'Port information: ' + port_info_entries.toString();

        document.getElementById('portConnectionStatus').closest('td').classList.add('editModeBgColorized');



        web_serial_writer = web_serial_port.writable.getWriter();
        console.log("Port connected and writer obtained");

        // Handle disconnection
        web_serial_port.addEventListener('disconnect', () => {
            document.getElementById('portConnectionStatus').innerHTML = 'Port disconnected';
            web_serial_writer.releaseLock();
            web_serial_writer = null;
        });

    } catch (error) {
        alert('Error connecting to serial port:' + error);
    }
}

async function sendString(clickedElement) {
    if (!web_serial_writer) {
        console.log('Serial port is not open');
        return;
    }
    const cmd_bytes = clickedElement.closest('td').previousElementSibling.previousElementSibling.previousElementSibling.querySelectorAll('.mcu-cmd');
    let str_to_send = '';
    cmd_bytes.forEach( cmd_byte => { str_to_send += '0b' + cmd_byte.textContent + ','; });            
    str_to_send = str_to_send.slice(0, -1) + '\n';
    if (str_to_send) {
        const data = new TextEncoder().encode(str_to_send); // Convert to byte array
        await web_serial_writer.write(data); // Write to the serial port
        console.log(`Sent: ${str_to_send}`);
    } else {
        console.log('No input string to send');
    }
}



function autocomplete(inp, arr) {
    var currentFocus;

    inp.addEventListener("input", function () {
        var a, b, i, val = this.value;
        this.value = this.value.trimStart();
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
            if ((arr[i].toLowerCase().includes(val.toLowerCase())) || val == ' ' ) {
                b = document.createElement("DIV");
                b.innerHTML = arr[i].replace(new RegExp(val, "i"), "<strong>$&</strong>");
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function () {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    undoCommandSetTableEdit();
                    closeAllLists();
                    
                });
                document.getElementById('commandSetTable').classList.add('disabledTable');
                a.appendChild(b);
            }
        }
        if (a.querySelectorAll('div').length == 0) {
            // no suitable controller name found
            //const controller_name_actions = ['NEW BLANK CONTROLLER', 'NEW CLONED CONTROLLER', 'RENAME CURRENT CONTROLLER'];
            const controller_name_actions = new Map([
                ['NEW BLANK CONTROLLER', function (table_tbody) {
                    table_tbody.innerHTML = '';
                    table_tbody.appendChild(document.importNode(document.getElementById('empty-row-template').content, true));
                }],
                ['NEW CLONED CONTROLLER', (table_tbody) => { console.log("cloned, but not saved"); }],
                ['RENAME CURRENT CONTROLLER', (table_tbody) => { console.log("delete old?"); }]
            ]);

            for (const single_action of controller_name_actions.keys()) { // controller_name_actions.forEach(single_action => 
                b = document.createElement("DIV");
                b.dataset.controllerNameAction = single_action;
                b.innerHTML = `${val} &nbsp;&nbsp;&nbsp;<em>${single_action}</em>`;
                b.innerHTML += `<input type="hidden" value="${val}">`;
                b.addEventListener("click", function () {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    controller_name_actions.get(this.dataset.controllerNameAction)( document.querySelector('#commandSetTable tbody') );
                    closeAllLists();
                });
                a.appendChild(b);
            };
            document.getElementById('commandSetTable').classList.add('disabledTable');
        }
    });

    inp.addEventListener("keydown", function (e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
                document.getElementById('commandSetTable').classList.remove('disabledTable');
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}


function deleteLocalSavedController() {
    const controller_name = document.getElementById('selectedControllerName').value;
    let userResponse = confirm("Do you want to proceed?");
    if (userResponse)
        localStorage.removeItem(COMMAND_SET_ROW_PREFIX + controller_name);
}