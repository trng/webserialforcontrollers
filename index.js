/**
 * 
 * Initialization on page load 
 * 
 */
function onThisPageLoad() {
    toggleEditMode(false);
    fillHex();
}



/**
 * 
 * Command byte(s) processing functions
 * 
 */

function fillHex() {
    const mcu_cmd_str_all_divs = document.querySelectorAll('table tr td div.mcu-cmd');
    mcu_cmd_str_all_divs.forEach( mcu_cmd_div => {
        const mcu_cmd_str = mcu_cmd_div.textContent;
        let bits2hex = '0x' + parseInt(mcu_cmd_div.textContent,2).toString(16).padStart(2, '0').toUpperCase();

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


function changeBit(event) {
    const clickedSpan = event.target;
    
    if (clickedSpan.tagName.toLowerCase() === 'span') {
        let span_text_content = clickedSpan.textContent;
        let is_edit_mode = clickedSpan.closest('tr').querySelector('td').contentEditable == "true";
        let is_variable_part = clickedSpan.classList.contains('cmd-variable-part');

        if ( is_edit_mode && event.ctrlKey ) {
            if (is_variable_part)
                clickedSpan.classList.replace('cmd-variable-part', 'cmd-fixed-part')
            else
                clickedSpan.classList.replace('cmd-fixed-part', 'cmd-variable-part');
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
            cells[columnIndex].contentEditable = enableEdit.toString();
            if ( enableEdit)
                cells[columnIndex].classList.add('editModeBgColorized');
            else
                cells[columnIndex].classList.remove('editModeBgColorized');
        }
    }
}

function toggleEditMode() {
    let enable_edit_mode = false;
    if ( arguments.length === 0 )
        enable_edit_mode = document.getElementById('tableEditEnabled').style.display == 'none';
    makeColumnEditable('commandSetTable', 0, enable_edit_mode);
    makeColumnEditable('commandSetTable', 3, enable_edit_mode);
    Array.from(document.styleSheets).forEach(sheet => {
        for (let i = 0; i < sheet.cssRules.length; i++) {
            const rule = sheet.cssRules[i];
            if (rule.selectorText === '#commandSetTable th:last-child, #commandSetTable td:last-child') {
                if (enable_edit_mode) {
                    rule.style.removeProperty('display');
                    document.getElementById('tableEditDisabled').style.display = 'none'; //'inline'
                    document.getElementById('tableEditEnabled').style.display = 'inline';
                } else {
                    rule.style.display = 'none';
                    document.getElementById('tableEditDisabled').style.display = 'inline'; // 'inline'
                    document.getElementById('tableEditEnabled').style.display = 'none';
                }
            }
        }
    });
}


function commandLengthChanged(event) {
    let cmd_td = event.target.closest('tr').children[1];
    if (event.target.value == '1') {
        if (cmd_td.children[1]) cmd_td.removeChild(cmd_td.children[1]);
    } else {
        if (cmd_td.children.length == 1) {
            const node_clone = cmd_td.querySelector('div').cloneNode(true);
            cmd_td.appendChild(node_clone);
        }
    }
    fillHex();
}

function delRow(event) {
    const current_tbody = event.target.closest('tbody');
    const current_row = event.target.closest('tr');
    if (current_tbody.children.length > 1) {
        current_tbody.removeChild(current_row);
    } else {
        current_row.querySelectorAll('td')[0].innerHTML = '';
        current_row.querySelectorAll('td')[2].innerHTML = '';
        current_row.querySelectorAll('td')[3].innerHTML = '';
        current_row.querySelectorAll('td')[1].querySelectorAll('span').forEach( bit_span => { 
            bit_span.innerHTML = '0';
        });
    }
        
}

function dupRow(event) {
    const current_tbody = event.target.closest('tbody');
    const current_row = event.target.closest('tr');
    current_tbody.insertBefore( current_row.cloneNode(true), current_row);
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

